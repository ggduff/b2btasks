import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  searchTrackedIssues,
  extractDescriptionText,
  extractPartnerFromLabels,
  extractTaskTypeFromLabels,
  sanitizeForLabel,
} from "@/lib/jira";

// POST /api/tasks/sync - Sync tasks from Jira
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all tracked issues from Jira
    const jiraIssues = await searchTrackedIssues();

    // Pre-fetch all partners for efficient lookup during sync
    const allPartners = await prisma.partner.findMany({
      select: { id: true, name: true },
    });
    const partnerLookup = new Map<string, string>();
    for (const partner of allPartners) {
      // Map sanitized lowercase partner name to partner ID for matching
      partnerLookup.set(sanitizeForLabel(partner.name).toLowerCase(), partner.id);
    }

    let synced = 0;
    let created = 0;
    let updated = 0;

    for (const jiraIssue of jiraIssues) {
      const existingTask = await prisma.task.findUnique({
        where: { jiraKey: jiraIssue.key },
      });

      // Extract partner and task type from Jira labels for recovery
      const labels = jiraIssue.fields.labels || [];
      const labelPartnerName = extractPartnerFromLabels(labels);
      const labelTaskType = extractTaskTypeFromLabels(labels);

      // Try to recover partner ID from label
      let recoveredPartnerId: string | null = null;
      if (labelPartnerName) {
        recoveredPartnerId = partnerLookup.get(labelPartnerName.toLowerCase()) || null;
      }

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
        // Update existing task - only recover partner/taskType if currently null
        const updateData: Record<string, unknown> = { ...taskData };
        if (existingTask.partnerId === null && recoveredPartnerId) {
          updateData.partnerId = recoveredPartnerId;
        }
        if (existingTask.taskType === null && labelTaskType) {
          updateData.taskType = labelTaskType;
        }

        await prisma.task.update({
          where: { jiraKey: jiraIssue.key },
          data: updateData,
        });
        updated++;
      } else {
        // Create new task (this handles tasks created directly in Jira with our label)
        await prisma.task.create({
          data: {
            jiraKey: jiraIssue.key,
            ...taskData,
            partnerId: recoveredPartnerId,
            taskType: labelTaskType,
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
        partner: {
          select: {
            id: true,
            name: true,
            platform: true,
            partnerStatus: true,
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
