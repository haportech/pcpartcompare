import { NextRequest, NextResponse } from "next/server";

// Lazy-init Prisma to avoid cold-start overhead on every request
async function getPrisma() {
  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");

  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || "file:./dev.db",
  });

  return new PrismaClient({ adapter });
}

export async function GET(request: NextRequest) {
  try {
    const prisma = await getPrisma();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const ids = searchParams.get("ids");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (ids) {
      where.id = { in: ids.split(",") };
    }

    if (search) {
      where.OR = [
        { brand: { contains: search } },
        { model: { contains: search } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        include: {
          prices: true,
          benchmarks: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { brand: "asc" },
      }),
      prisma.part.count({ where }),
    ]);

    // Get distinct types
    const typesRaw = ids
      ? []
      : await prisma.part.findMany({
          select: { type: true },
          distinct: ["type"],
          orderBy: { type: "asc" },
        });
    const types = [...new Set(typesRaw.map((t: { type: string }) => t.type))].sort();

    return NextResponse.json({ parts, total, types, page, limit });
  } catch (error) {
    console.error("Failed to fetch parts:", error);
    return NextResponse.json(
      { error: "Failed to fetch parts" },
      { status: 500 }
    );
  }
}
