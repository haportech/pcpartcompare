import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Input validation
  const type = searchParams.get("type") || undefined;
  const search = searchParams.get("search") || undefined;
  const idsParam = searchParams.get("ids") || undefined;

  const pageRaw = parseInt(searchParams.get("page") || "1");
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const limitRaw = parseInt(searchParams.get("limit") || "50");
  const limit = Number.isFinite(limitRaw) && limitRaw > 0
    ? Math.min(limitRaw, 200)
    : 50;

  try {
    const where: Record<string, unknown> = {};

    if (type) where.type = type;

    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      if (ids.length) where.id = { in: ids };
    }

    if (search) {
      where.OR = [
        { brand: { contains: search } },
        { model: { contains: search } },
      ];
    }

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where: where as any,
        include: { prices: true, benchmarks: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { brand: "asc" },
      }),
      prisma.part.count({ where: where as any }),
    ]);

    // Get distinct types (cache for 60s via Vercel edge config or just query)
    const typesRaw = idsParam
      ? []
      : await prisma.part.findMany({
          select: { type: true },
          distinct: ["type"],
        });
    const types = [...new Set(typesRaw.map((t: { type: string }) => t.type))].sort();

    return NextResponse.json({ parts, total, types, page, limit });
  } catch (error) {
    console.error("Failed to fetch parts:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch parts",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

