import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/partners/[id] - Get a single partner
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

    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        tasks: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            jiraKey: true,
            summary: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error fetching partner:", error);
    return NextResponse.json(
      { error: "Failed to fetch partner" },
      { status: 500 }
    );
  }
}

// PATCH /api/partners/[id] - Update a partner
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

    // Check partner exists
    const existing = await prisma.partner.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // If name is being changed, check for duplicates
    if (body.name && body.name.trim() !== existing.name) {
      const duplicate = await prisma.partner.findUnique({
        where: { name: body.name.trim() },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "A partner with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: {
      name?: string;
      platform?: string | null;
      partnerType?: string | null;
      config?: string | null;
      partnerStatus?: string;
      hasLandingPage?: boolean;
      supportChannel?: string | null;
      contactName?: string | null;
      contactEmail?: string | null;
      commission?: number | null;
      notes?: string | null;
    } = {};

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }
    if (body.platform !== undefined) {
      updateData.platform = body.platform || null;
    }
    if (body.partnerType !== undefined) {
      updateData.partnerType = body.partnerType || null;
    }
    if (body.config !== undefined) {
      updateData.config = body.config || null;
    }
    if (body.partnerStatus !== undefined) {
      updateData.partnerStatus = body.partnerStatus;
    }
    if (body.hasLandingPage !== undefined) {
      updateData.hasLandingPage = body.hasLandingPage;
    }
    if (body.supportChannel !== undefined) {
      updateData.supportChannel = body.supportChannel?.trim() || null;
    }
    if (body.contactName !== undefined) {
      updateData.contactName = body.contactName?.trim() || null;
    }
    if (body.contactEmail !== undefined) {
      updateData.contactEmail = body.contactEmail?.trim() || null;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes?.trim() || null;
    }

    // Commission: only save for affiliates
    const finalPartnerType = body.partnerType !== undefined ? body.partnerType : existing.partnerType;
    if (finalPartnerType === "AFFILIATE") {
      if (body.commission !== undefined) {
        updateData.commission = body.commission;
      }
    } else {
      updateData.commission = null;
    }

    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        uploadKey: true,
        dateAdded: true,
        platform: true,
        partnerType: true,
        config: true,
        partnerStatus: true,
        hasLandingPage: true,
        supportChannel: true,
        contactName: true,
        contactEmail: true,
        commission: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error updating partner:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update partner",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/partners/[id] - Delete a partner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check partner exists and get task count
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Prevent deletion if partner has tasks
    if (partner._count.tasks > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete partner with ${partner._count.tasks} associated task${partner._count.tasks === 1 ? "" : "s"}. Reassign tasks first.`,
        },
        { status: 400 }
      );
    }

    await prisma.partner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete partner",
      },
      { status: 500 }
    );
  }
}
