import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { searchTrackedIssues, extractDescriptionText } from "@/lib/jira";

// POST /api/tasks/sync - Sync tasks from Jira
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all tracked issues from Jira
    const jiraIssues = await searchTrackedIssues();

    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const jiraIssue of jiraIssues) {
      const existingTask = await prisma.task.findUnique({
        where: { jiraKey: jiraIssue.key },
      });

      const taskData = {
        jiraId: jiraIssue.id,
        summary: jiraIssue.fields.summary,
        description: extractDescriptionText(jiraIssue.fields.description),
        status: jiraIssue.fields.status.name,
        priority: jiraIssue.fields.priority.name,
        assignee: jiraIssue.fields.assignee?.emailAddress || null,
        lastSyncedAt: new Date(),
      };

      if (existingTask) {
        // Update existing task
        await prisma.task.update({
          where: { jiraKey: jiraIssue.key },
          data: taskData,
        });
        updated++;
      } else {
        // Create new task (this handles tasks created directly in Jira with our label)
        await prisma.task.create({
          data: {
            jiraKey: jiraIssue.key,
            ...taskData,
            userId: session.user.id, // Assign to current user if created via Jira
          },
        });
        created++;
      }
      synced++;
    }

    // Fetch all tasks after sync
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

    return NextResponse.json({
      message: `Synced ${synced} tasks (${created} created, ${updated} updated)`,
      synced,
      created,
      updated,
      tasks,
    });
  } catch (error) {
    console.error("Error syncing tasks:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to sync tasks",
      },
      { status: 500 }
    );
  }
}
