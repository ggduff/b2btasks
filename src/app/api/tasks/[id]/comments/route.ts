import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getIssueComments,
  addIssueComment,
  extractCommentText,
} from "@/lib/jira";

// GET /api/tasks/[id]/comments - Get all comments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      select: { jiraKey: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch comments from Jira
    const jiraComments = await getIssueComments(task.jiraKey);

    // Sync comments to local database
    const comments = await Promise.all(
      jiraComments.map(async (jiraComment) => {
        const commentData = {
          jiraCommentId: jiraComment.id,
          taskId: id,
          authorName: jiraComment.author.displayName,
          authorEmail: jiraComment.author.emailAddress || null,
          authorAvatar: jiraComment.author.avatarUrls["48x48"] || null,
          body: extractCommentText(jiraComment.body),
          jiraCreatedAt: new Date(jiraComment.created),
          jiraUpdatedAt: new Date(jiraComment.updated),
        };

        // Upsert comment to keep local DB in sync
        return prisma.comment.upsert({
          where: { jiraCommentId: jiraComment.id },
          update: {
            body: commentData.body,
            jiraUpdatedAt: commentData.jiraUpdatedAt,
          },
          create: commentData,
        });
      })
    );

    // Remove any comments that no longer exist in Jira
    const jiraCommentIds = jiraComments.map((c) => c.id);
    await prisma.comment.deleteMany({
      where: {
        taskId: id,
        jiraCommentId: { notIn: jiraCommentIds },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/comments - Add a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id },
      select: { jiraKey: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Add comment to Jira
    const jiraComment = await addIssueComment(task.jiraKey, content.trim());

    // Save to local database
    const comment = await prisma.comment.create({
      data: {
        jiraCommentId: jiraComment.id,
        taskId: id,
        authorName: jiraComment.author.displayName,
        authorEmail: jiraComment.author.emailAddress || null,
        authorAvatar: jiraComment.author.avatarUrls["48x48"] || null,
        body: extractCommentText(jiraComment.body),
        jiraCreatedAt: new Date(jiraComment.created),
        jiraUpdatedAt: new Date(jiraComment.updated),
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to add comment",
      },
      { status: 500 }
    );
  }
}
