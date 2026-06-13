import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { parts } from "./data/parts";
import { benchmarks } from "./data/benchmarks";
import { prices } from "./data/prices";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding parts...");

  for (const part of parts) {
    const created = await prisma.part.upsert({
      where: {
        type_brand_model: {
          type: part.type,
          brand: part.brand,
          model: part.model,
        },
      },
      create: {
        type: part.type,
        brand: part.brand,
        model: part.model,
        specs: part.specs,
        ...(part.imageUrl ? { imageUrl: part.imageUrl } : {}),
      },
      update: {
        specs: part.specs,
      },
    });

    // Attach benchmarks
    const partBenchmarks = benchmarks.filter((b) => b.partModel === part.model);
    for (const bm of partBenchmarks) {
      await prisma.benchmark.upsert({
        where: {
          partId_benchmark: {
            partId: created.id,
            benchmark: bm.benchmark,
          },
        },
        create: {
          partId: created.id,
          source: bm.source,
          benchmark: bm.benchmark,
          score: bm.score,
          unit: bm.unit,
        },
        update: {
          score: bm.score,
        },
      });
    }

    // Attach prices
    const partPrices = prices.filter((p) => p.partModel === part.model);
    for (const price of partPrices) {
      await prisma.pricePoint.upsert({
        where: {
          partId_retailer: {
            partId: created.id,
            retailer: price.retailer,
          },
        },
        create: {
          partId: created.id,
          retailer: price.retailer,
          amount: price.amount,
          ...(price.url ? { url: price.url } : {}),
        },
        update: {
          amount: price.amount,
        },
      });
    }

    console.log(`  ✓ ${part.brand} ${part.model}`);
  }

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
