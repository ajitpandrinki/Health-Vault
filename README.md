# HealthVault India

A web app for Indian families to organise medical bills, prescriptions, reports, insurance claims, and hospital visits — with AI-assisted extraction from PDFs and images.

## Features

- **Upload** bills, prescriptions, reports, and insurance documents
- **AI extract** — PDF/image → hospital, date, total, and bill categories (Consultation, Diagnostics, Medicines, Room, Other)
- **Expenses** — totals by month, category, and family member (₹ INR)
- **Family** — organise members with blood group and spend summary
- **Search** — filter documents by type, member, and free text
- **Insurance claims** — track draft → paid status
- **Hospital visits** — OPD / IPD / emergency / lab timeline
- **Languages** — English and हिन्दी

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS
- PostgreSQL with Prisma ORM
- File storage ready for Supabase Storage or S3

## PostgreSQL setup

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to your Postgres connection string.
4. Run:

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI extraction note

The upload flow includes a realistic AI extraction experience. Wire `src/lib/ai-extract.ts` to a vision/OCR API (e.g. OpenAI, Google Document AI, or an Indian language OCR stack) for production use.
