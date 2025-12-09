import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateUploadKey } from "@/lib/partner-utils";

// GET /api/partners - List all partners with optional filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const platform = searchParams.get("platform");
    const partnerType = searchParams.get("partnerType");
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "name";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Build where clause (without search - SQLite doesn't support mode: "insensitive")
    const where: {
      platform?: string;
      partnerType?: string;
      partnerStatus?: string;
    } = {};

    if (platform) {
      where.platform = platform;
    }
    if (partnerType) {
      where.partnerType = partnerType;
    }
    if (status) {
      where.partnerStatus = status;
    }

    // Build orderBy
    const orderBy: Record<string, "asc" | "desc"> = {};
    if (sortBy === "name" || sortBy === "dateAdded" || sortBy === "partnerStatus") {
      orderBy[sortBy] = sortOrder === "desc" ? "desc" : "asc";
    } else {
      orderBy.name = "asc";
    }

    let partners = await prisma.partner.findMany({
      where,
      orderBy,
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

    // Apply case-insensitive search filter in JavaScript (SQLite workaround)
    if (search) {
      const searchLower = search.toLowerCase();
      partners = partners.filter((p) =>
        p.name.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(partners);
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}

// POST /api/partners - Create a new partner
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      platform,
      partnerType,
      config,
      partnerStatus,
      hasLandingPage,
      supportChannel,
      contactName,
      contactEmail,
      commission,
      notes,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Partner name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.partner.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A partner with this name already exists" },
        { status: 400 }
      );
    }

    // Generate upload key
    const uploadKey = generateUploadKey();

    // Create partner
    const partner = await prisma.partner.create({
      data: {
        name: name.trim(),
        uploadKey,
        platform: platform || null,
        partnerType: partnerType || null,
        config: config || null,
        partnerStatus: partnerStatus || "PRE_SALES",
        hasLandingPage: hasLandingPage || false,
        supportChannel: supportChannel?.trim() || null,
        contactName: contactName?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        // Only save commission for affiliates
        commission: partnerType === "AFFILIATE" && commission != null ? commission : null,
        notes: notes?.trim() || null,
      },
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

    return NextResponse.json(partner, { status: 201 });
  } catch (error) {
    console.error("Error creating partner:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create partner",
      },
      { status: 500 }
    );
  }
}
