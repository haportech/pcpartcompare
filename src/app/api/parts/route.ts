import { NextResponse } from "next/server";

// Lazy-init Prisma to avoid cold-start overhead on every request
async function getPrisma() {
  const { PrismaClient } = await import("@/generated/prisma/client");
  const { PrismaLibSql } = await import("@prisma/adapter-libsql");

  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || "file:./dev.db",
  });

  return new PrismaClient({ adapter });
}

export async function GET() {
  try {
    const prisma = await getPrisma();
    const parts = await prisma.part.findMany({
      include: {
        prices: true,
        benchmarks: true,
      },
    });
    return NextResponse.json({ parts });
  } catch (error) {
    console.error("Failed to fetch parts:", error);
    return NextResponse.json(
      { error: "Failed to fetch parts" },
      { status: 500 }
    );
  }
}
