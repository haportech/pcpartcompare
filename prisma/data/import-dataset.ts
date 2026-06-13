import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// Map dataset category → our Part.type enum
const CATEGORY_MAP: Record<string, string> = {
  cpu: "CPU",
  "video-card": "GPU",
  memory: "RAM",
  motherboard: "Motherboard",
  "internal-hard-drive": "Storage",
  "external-hard-drive": "Storage",
  "power-supply": "PSU",
  case: "Case",
  "case-fan": "Case",
  "case-accessory": "Case",
  "cpu-cooler": "CPU",
  "optical-drive": "Storage",
  os: "OS",
  monitor: "Monitor",
  keyboard: "Keyboard",
  mouse: "Mouse",
  speakers: "Speaker",
  headphones: "Headphone",
  webcam: "Webcam",
  "sound-card": "SoundCard",
  "wired-network-card": "NetworkCard",
  "wireless-network-card": "NetworkCard",
  "fan-controller": "Case",
  "thermal-paste": "ThermalPaste",
  ups: "UPS",
};

// Fields to exclude from specs (metadata, not specs)
const EXCLUDE_FIELDS = new Set(["name", "price"]);

function parseName(name: string): { brand: string; model: string } {
  const parts = name.split(" ");
  // First word is usually the brand
  const knownBrands = [
    "AMD", "Intel", "NVIDIA", "MSI", "ASUS", "Gigabyte", "ASRock", "EVGA",
    "Corsair", "Samsung", "Western Digital", "Seagate", "WD", "Kingston",
    "G.Skill", "Crucial", "Thermaltake", "Cooler Master", "Noctua", "be quiet!",
    "Fractal Design", "NZXT", "Lian Li", "Phanteks", "DeepCool", "ARCTIC",
    "Sony", "Logitech", "Razer", "SteelSeries", "HyperX", "Apple",
    "LG", "Dell", "HP", "Acer", "BenQ", "ViewSonic", "Alienware",
    "SeaSonic", "Antec", "be quiet", "EKWB", "Alphacool",
  ];

  // Try to match known brand (including multi-word)
  for (const brand of knownBrands.sort((a, b) => b.length - a.length)) {
    if (name.startsWith(brand)) {
      return { brand, model: name.slice(brand.length).trim() };
    }
  }

  // Fallback: first word = brand
  return { brand: parts[0], model: parts.slice(1).join(" ") || parts[0] };
}

async function importCategory(fileName: string) {
  const category = fileName.replace(".json", "");
  const partType = CATEGORY_MAP[category];
  if (!partType) {
    console.log(`  SKIP ${category} — no type mapping`);
    return 0;
  }

  const filePath = path.join(
    __dirname,
    "../../datasets/pc-part-dataset/data/json",
    fileName
  );
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP ${category} — file not found`);
    return 0;
  }

  const entries: any[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  let imported = 0;

  for (const entry of entries) {
    const { brand, model } = parseName(entry.name);
    const specs: Record<string, any> = {};

    for (const [key, val] of Object.entries(entry)) {
      if (!EXCLUDE_FIELDS.has(key) && val !== null && val !== "") {
        specs[key] = val;
      }
    }

    try {
      const created = await prisma.part.upsert({
        where: {
          type_brand_model: { type: partType, brand, model },
        },
        create: {
          type: partType,
          brand,
          model,
          specs: JSON.stringify(specs),
        },
        update: {
          specs: JSON.stringify(specs),
        },
      });

      // Add price point if present
      if (entry.price != null && entry.price > 0) {
        await prisma.pricePoint.upsert({
          where: {
            partId_retailer: { partId: created.id, retailer: "pcpartpicker" },
          },
          create: {
            partId: created.id,
            retailer: "pcpartpicker",
            amount: entry.price,
          },
          update: { amount: entry.price },
        });
      }

      imported++;
      if (imported % 1000 === 0) {
        console.log(`    ${category}: ${imported}/${entries.length}`);
      }
    } catch (err: any) {
      // Skip individual failures (e.g., name too long)
      if (imported === 0) console.error(`    ${category} error: ${err.message?.slice(0, 100)}`);
    }
  }

  return imported;
}

async function main() {
  const dataDir = path.join(
    __dirname,
    "../../datasets/pc-part-dataset/data/json"
  );
  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"));

  let total = 0;
  for (const file of files) {
    const category = file.replace(".json", "");
    console.log(`Importing ${category}...`);
    const count = await importCategory(file);
    total += count;
    console.log(`  → ${count} imported`);
  }

  console.log(`\nTotal: ${total} parts imported across ${files.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
