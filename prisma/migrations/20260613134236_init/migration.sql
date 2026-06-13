-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "specs" TEXT NOT NULL,
    "image_url" TEXT,
    "released_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "price_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "part_id" TEXT NOT NULL,
    "retailer" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "url" TEXT,
    "fetched_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "price_points_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "benchmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "part_id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "benchmark" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "tested_at" DATETIME,
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "benchmarks_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
