import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createJiraIssue } from "@/lib/jira";

// GET /api/tasks - List all tasks for the current user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { summary, description, priority } = body;

    if (!summary || typeof summary !== "string" || summary.trim() === "") {
      return NextResponse.json(
        { error: "Summary is required" },
        { status: 400 }
      );
    }

    // Create issue in Jira
    const jiraIssue = await createJiraIssue({
      summary: summary.trim(),
      description: description?.trim(),
      priority: priority || "Medium",
    });

    // Save to local database
    const task = await prisma.task.create({
      data: {
        jiraKey: jiraIssue.key,
        jiraId: jiraIssue.id,
        summary: jiraIssue.fields.summary,
        description: description?.trim() || null,
        status: jiraIssue.fields.status.name,
        priority: jiraIssue.fields.priority.name,
        userId: session.user.id,
        lastSyncedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create task",
      },
      { status: 500 }
    );
  }
}
