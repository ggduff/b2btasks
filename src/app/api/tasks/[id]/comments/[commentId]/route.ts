import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  updateIssueComment,
  deleteIssueComment,
  extractCommentText,
} from "@/lib/jira";

// PUT /api/tasks/[id]/comments/[commentId] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, commentId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Get task and comment
    const task = await prisma.task.findUnique({
      where: { id },
      select: { jiraKey: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment || existingComment.taskId !== id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Update in Jira
    const jiraComment = await updateIssueComment(
      task.jiraKey,
      existingComment.jiraCommentId,
      content.trim()
    );

    // Update local database
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        body: extractCommentText(jiraComment.body),
        jiraUpdatedAt: new Date(jiraComment.updated),
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update comment",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, commentId } = await params;

    // Get task and comment
    const task = await prisma.task.findUnique({
      where: { id },
      select: { jiraKey: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!existingComment || existingComment.taskId !== id) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Delete from Jira
    await deleteIssueComment(task.jiraKey, existingComment.jiraCommentId);

    // Delete from local database
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete comment",
      },
      { status: 500 }
    );
  }
}
