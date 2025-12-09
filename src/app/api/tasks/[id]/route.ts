import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getIssueTransitions,
  transitionIssue,
  getJiraIssue,
} from "@/lib/jira";

// GET /api/tasks/[id] - Get task details and available transitions
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

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get available transitions from Jira
    const transitions = await getIssueTransitions(task.jiraKey);

    // Only show transitions to "Done" category statuses
    const filteredTransitions = transitions
      .filter((t) => t.to.statusCategory.key === "done")
      .map((t) => ({
        id: t.id,
        name: t.name,
        toStatus: t.to.name,
      }));

    return NextResponse.json({
      task,
      transitions: filteredTransitions,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update task status
export async function PATCH(
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
    const { transitionId } = body;

    if (!transitionId) {
      return NextResponse.json(
        { error: "Transition ID is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Execute transition in Jira
    await transitionIssue(task.jiraKey, transitionId);

    // Fetch updated issue from Jira
    const updatedJiraIssue = await getJiraIssue(task.jiraKey);

    // Update local database
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: updatedJiraIssue.fields.status.name,
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

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update task",
      },
      { status: 500 }
    );
  }
}
