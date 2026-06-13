# PartCompare

Compare computer parts side by side — specs, benchmarks, and pricing for CPUs and GPUs.

Built with [Next.js 16](https://nextjs.org), [Prisma 7](https://prisma.io), [Turso](https://turso.tech).

## Features

- **Side-by-side comparison** — select 2-4 parts and compare specs, benchmarks, and prices in a single table
- **Color-coded scoring** — green for best value per field (higher clocks, lower TDP/prices)
- **Benchmarks** — real performance data (Cinebench, Geekbench, 3DMark, game FPS)
- **Shareable URLs** — `?parts=id1,id2` URLs for direct comparison links
- **Mobile responsive** — card layout on phones, table layout on desktop
- **Manual prices** — v1 uses curated pricing; automated pipeline coming in v2

## Getting Started

```bash
npm install
npm run seed           # populate database with 13 parts, 39 benchmarks, 13 prices
npm run dev            # start dev server at http://localhost:3000
```

Open http://localhost:3000/compare to start comparing parts.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | SQLite (dev) / Turso (edge SQLite, production) |
| ORM | Prisma 7 with libsql adapter |
| Testing | Vitest + React Testing Library (planned) |
| Styling | Tailwind CSS v4 |
| Hosting | Vercel |

## Database

```bash
npm run seed           # seed 6 CPUs + 7 GPUs with specs, benchmarks, prices
npx prisma studio      # browse data in browser
npx prisma db push     # sync schema changes to local DB
```

## API

```
GET /api/parts         → { parts: Part[] } with nested prices[] and benchmarks[]
```

## Seed Data

13 parts across 6 CPU models (AMD Ryzen 7000 series, Intel Core 14th gen) and 7 GPU models (NVIDIA RTX 40 series, AMD Radeon RX 7000 series), each with 2-4 benchmarks and 1 manual price.

## Deploy to Cloudflare Pages

```bash
# 1. Set up Turso database (free)
npm install -g turso
turso auth login
turso db create pcpartcompare
turso db show pcpartcompare --url       # copy the URL
turso db tokens create pcpartcompare     # copy the token

# 2. Set DATABASE_URL in Cloudflare Pages dashboard
#    Settings → Environment variables → Add:
#    DATABASE_URL = libsql://pcpartcompare.turso.io?authToken=YOUR_TOKEN

# 3. Connect repo to Cloudflare Pages
#    Dashboard → Pages → Connect Git → haportech/pcpartcompare
#    Build command: npx @opennextjs/cloudflare
#    Build output: .vercel/output/static

# 4. Set custom domain
#    Pages → pcpartcompare → Custom domains → Add domain
```

Requires a [Turso](https://turso.tech) database (free tier, no credit card) for the edge-hosted SQLite backend. Local SQLite won't work on Cloudflare's serverless platform.

## v2 Roadmap

- Amazon Creators API pricing pipeline
- Automated price tracking with price history charts
- Open data JSON dumps
- More part categories (RAM, motherboards, storage, PSUs)
- Crowdsourced benchmark submissions
- Larger curated dataset (100+ parts)

## License

MIT
