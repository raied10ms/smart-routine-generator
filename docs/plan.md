# SSC 27 Smart Routine Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Next.js web app that generates personalized, phase-based SSC 27 study routines from a CSV-imported chapter database, previews them in-browser, captures leads, generates branded PDFs, and delivers via SMS.

**Architecture:** Multi-step wizard UI (6 screens). Next.js App Router with server actions. PostgreSQL for submissions + chapter data (CSV imported). PDF generation via `@react-pdf/renderer` server-side. SMS delivery via external API (endpoint TBD). Routine generation algorithm runs server-side as a pure function.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, PostgreSQL (pg), `@react-pdf/renderer`, `csv-parse` for import.

---

## CSV Import Format

The content team provides a CSV file with the following structure. This is imported into the `chapters` table via a script.

```csv
section,subject,chapter_number,chapter_name_bn,chapter_name_en,question_type,cq_importance,mcq_importance,math_importance,time_cq_min,time_mcq_min,time_math_min,time_revision_min
বিজ্ঞান,পদার্থবিজ্ঞান,1,গতি,Motion,CQ+MCQ,5,4,3,90,45,60,30
বিজ্ঞান,পদার্থবিজ্ঞান,2,বল,Force,CQ+MCQ,4,5,4,75,50,60,25
বিজ্ঞান,রসায়ন,1,রসায়নের ভাষা,Language of Chemistry,CQ+MCQ,3,4,2,60,40,30,20
মানবিক,ইতিহাস ও বিশ্বসভ্যতা,1,ইতিহাস পরিচিতি,Introduction to History,CQ+MCQ,3,3,0,45,30,0,20
বাণিজ্য,হিসাববিজ্ঞান,1,হিসাববিজ্ঞানের ধারণাগত কাঠামো,Accounting Framework,CQ+MCQ,5,4,3,90,45,60,30
```

**Column definitions:**

| Column | Type | Required | Notes |
|---|---|---|---|
| `section` | string | yes | বিজ্ঞান / মানবিক / বাণিজ্য / কলা |
| `subject` | string | yes | Bangla subject name |
| `chapter_number` | int | yes | 1-indexed within subject |
| `chapter_name_bn` | string | yes | Bangla chapter name (shown to student) |
| `chapter_name_en` | string | no | English fallback |
| `question_type` | string | yes | `CQ+MCQ` / `Math` / `MCQ-only` / `English-1` / `English-2` / `English-3` / `English-4` |
| `cq_importance` | int (1-5) | yes | 0 if not applicable |
| `mcq_importance` | int (1-5) | yes | 0 if not applicable |
| `math_importance` | int (1-5) | yes | 0 if not applicable |
| `time_cq_min` | int | yes | Minutes for CQ practice; 0 if N/A |
| `time_mcq_min` | int | yes | Minutes for MCQ practice; 0 if N/A |
| `time_math_min` | int | yes | Minutes for Math practice; 0 if N/A |
| `time_revision_min` | int | yes | Minutes for revision |

---

## Database Schema

Three tables: `chapters` (imported from CSV), `submissions` (lead capture), `routine_days` (generated routine per submission).

```sql
-- chapters: imported from content CSV
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  section VARCHAR(20) NOT NULL,       -- বিজ্ঞান / মানবিক / বাণিজ্য / কলা
  subject VARCHAR(100) NOT NULL,
  chapter_number INT NOT NULL,
  chapter_name_bn VARCHAR(200) NOT NULL,
  chapter_name_en VARCHAR(200),
  question_type VARCHAR(20) NOT NULL,  -- CQ+MCQ / Math / MCQ-only / English-*
  cq_importance INT NOT NULL DEFAULT 0,
  mcq_importance INT NOT NULL DEFAULT 0,
  math_importance INT NOT NULL DEFAULT 0,
  time_cq_min INT NOT NULL DEFAULT 0,
  time_mcq_min INT NOT NULL DEFAULT 0,
  time_math_min INT NOT NULL DEFAULT 0,
  time_revision_min INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(section, subject, chapter_number)
);

-- submissions: one row per student who completes the flow
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  school VARCHAR(300),
  class_roll VARCHAR(20),
  section VARCHAR(20) NOT NULL,
  device_preference VARCHAR(10) DEFAULT 'mobile', -- mobile / desktop
  duration_days INT NOT NULL,                      -- 7/15/20/30/60
  assessment JSONB NOT NULL,                       -- { "subjectName": { "chapterId": "pari_na" | "revise" | "syllabus_nai" } }
  pdf_url VARCHAR(500),
  sms_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- routine_days: generated routine stored for PDF rendering
CREATE TABLE routine_days (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL REFERENCES submissions(id),
  day_number INT NOT NULL,
  phase INT NOT NULL,            -- 1, 2, or 3
  is_weekend BOOLEAN DEFAULT FALSE,
  entries JSONB NOT NULL,        -- [{ chapterId, subject, chapterName, taskType, timeMin }]
  total_time_min INT NOT NULL,
  UNIQUE(submission_id, day_number)
);
```

---

## File Structure

```
webapps/ssc-routine/
├── app/
│   ├── layout.tsx                  # Root layout: fonts, meta, global styles
│   ├── page.tsx                    # Hero/landing screen (Step 0)
│   ├── globals.css                 # Tailwind base + Bangla font imports
│   ├── wizard/
│   │   ├── layout.tsx              # Wizard layout: progress bar, max-width container
│   │   ├── info/page.tsx           # Step 1: Name + Section
│   │   ├── assess/page.tsx         # Step 2: Subject & chapter assessment
│   │   ├── duration/page.tsx       # Step 3: Time selector
│   │   ├── preview/page.tsx        # Step 4: Routine preview + share
│   │   └── capture/page.tsx        # Step 5: Lead capture + submit
│   ├── success/page.tsx            # Step 6: Confirmation screen
│   └── api/
│       ├── generate/route.ts       # POST: run routine algorithm, store, return preview
│       ├── submit/route.ts         # POST: save lead info, generate PDF, trigger SMS
│       └── import-csv/route.ts     # POST: import chapter CSV (admin endpoint)
├── lib/
│   ├── db.ts                       # PostgreSQL connection pool
│   ├── types.ts                    # Shared TypeScript types
│   ├── routine-engine.ts           # Core routine generation algorithm (pure function)
│   ├── pdf-generator.tsx           # @react-pdf/renderer document component
│   └── sms.ts                      # SMS API client (sends download link)
├── components/
│   ├── ProgressBar.tsx             # Step indicator (1–5)
│   ├── PillButton.tsx              # Reusable pill/tag selector
│   ├── SubjectCard.tsx             # Subject row with assessment + expand
│   ├── ChapterRow.tsx              # Chapter row with importance + assessment
│   ├── DurationTile.tsx            # Duration option tile
│   ├── RoutineTable.tsx            # Day-by-day preview table
│   └── PhaseLabel.tsx              # Phase separator label
├── scripts/
│   └── import-csv.ts               # CLI script: reads CSV, inserts into chapters table
├── migrations/
│   ├── 001_create_chapters.sql
│   ├── 002_create_submissions.sql
│   └── 003_create_routine_days.sql
├── public/
│   └── 10ms-logo.svg
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── .env.local                       # DATABASE_URL, SMS_API_URL, SMS_API_KEY
```

---

## Design Tokens (from SuperXperience Figma)

Extracted from the `Project-SuperXperience` Figma file (node 2130:10508). All new UI components must use only these tokens — no custom colors or component styles.

```css
/* Colors */
--color-primary: #E31E24;       /* 10MS red — buttons, CTAs, progress bar, phase 1 */
--color-primary-light: #FFF0F0; /* Light red bg for selected/highlighted states */
--color-secondary: #111111;     /* Near-black text */
--color-text: #333333;          /* Body text */
--color-text-muted: #888888;    /* Secondary text, captions */
--color-bg: #FFFFFF;            /* Page background */
--color-surface: #F5F5F5;       /* Card backgrounds, input backgrounds */
--color-border: #E5E5E5;        /* Borders, dividers */
--color-success: #22C55E;       /* Green — Phase 3, WhatsApp share, "pari" state */
--color-warning: #F59E0B;       /* Amber — "revise dile parbo", Phase 2 */
--color-error: #EF4444;         /* Red light — "ekdom pari na" highlight */
--color-gray: #9CA3AF;          /* "Syllabus e nai" state */

/* Typography */
--font-family: 'Hind Siliguri', sans-serif;  /* Bangla + Latin */
--font-size-hero: 28px;
--font-size-h1: 22px;
--font-size-h2: 18px;
--font-size-body: 15px;
--font-size-caption: 13px;
--line-height-bn: 1.6;  /* Extra line height for Bangla */

/* Spacing */
--radius-card: 12px;
--radius-pill: 20px;
--radius-button: 8px;
--padding-page: 16px;
--padding-card: 16px;

/* Shadows */
--shadow-card: 0 1px 3px rgba(0,0,0,0.08);
```

---

## Task 1: Project Scaffold + Database Migrations

**Files:**
- Create: `webapps/ssc-routine/package.json`
- Create: `webapps/ssc-routine/tsconfig.json`
- Create: `webapps/ssc-routine/next.config.ts`
- Create: `webapps/ssc-routine/postcss.config.mjs`
- Create: `webapps/ssc-routine/.env.local`
- Create: `webapps/ssc-routine/app/layout.tsx`
- Create: `webapps/ssc-routine/app/globals.css`
- Create: `webapps/ssc-routine/migrations/001_create_chapters.sql`
- Create: `webapps/ssc-routine/migrations/002_create_submissions.sql`
- Create: `webapps/ssc-routine/migrations/003_create_routine_days.sql`
- Create: `webapps/ssc-routine/lib/db.ts`
- Create: `webapps/ssc-routine/lib/types.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd webapps/ssc-routine
npm init -y
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/node tailwindcss@latest @tailwindcss/postcss
npm install pg csv-parse @react-pdf/renderer
npm install -D @types/pg
```

Update `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start",
    "import-csv": "npx tsx scripts/import-csv.ts"
  }
}
```

- [ ] **Step 2: Create config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:
```typescript
import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;
```

`postcss.config.mjs`:
```javascript
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

`.env.local`:
```
DATABASE_URL=postgresql://user:pass@host:5432/ssc_routine
SMS_API_URL=https://api.example.com/sms
SMS_API_KEY=placeholder
```

- [ ] **Step 3: Create globals.css with design tokens**

`app/globals.css`:
```css
@import "tailwindcss";

@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap');

:root {
  --color-primary: #E31E24;
  --color-primary-light: #FFF0F0;
  --color-secondary: #111111;
  --color-text: #333333;
  --color-text-muted: #888888;
  --color-bg: #FFFFFF;
  --color-surface: #F5F5F5;
  --color-border: #E5E5E5;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-gray: #9CA3AF;
}

body {
  font-family: 'Hind Siliguri', sans-serif;
  color: var(--color-text);
  background: var(--color-bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 4: Create root layout**

`app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SSC 27 Smart Routine — 10 Minute School",
  description: "তোমার SSC 27 রুটিন তৈরি করো মাত্র ৩ মিনিটে",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Create shared types**

`lib/types.ts`:
```typescript
export type Section = "বিজ্ঞান" | "মানবিক" | "বাণিজ্য" | "কলা";

export type AssessmentStatus = "pari" | "revise" | "pari_na" | "syllabus_nai";

export type QuestionType = "CQ+MCQ" | "Math" | "MCQ-only" | "English-1" | "English-2" | "English-3" | "English-4";

export interface Chapter {
  id: number;
  section: Section;
  subject: string;
  chapter_number: number;
  chapter_name_bn: string;
  chapter_name_en: string | null;
  question_type: QuestionType;
  cq_importance: number;
  mcq_importance: number;
  math_importance: number;
  time_cq_min: number;
  time_mcq_min: number;
  time_math_min: number;
  time_revision_min: number;
}

// Assessment: { "পদার্থবিজ্ঞান": { "3": "pari_na", "5": "revise" } }
// Key = subject name, value = { chapterId: status }
export type Assessment = Record<string, Record<string, AssessmentStatus>>;

export interface RoutineEntry {
  chapterId: number;
  subject: string;
  chapterName: string;
  taskType: string;  // "CQ Practice" | "MCQ Practice" | "Math Practice" | "Revision"
  timeMin: number;
}

export interface RoutineDay {
  dayNumber: number;
  phase: 1 | 2 | 3;
  isWeekend: boolean;
  entries: RoutineEntry[];
  totalTimeMin: number;
}

export interface WizardState {
  name: string;
  section: Section | null;
  assessment: Assessment;
  durationDays: number | null;
  routinePreview: RoutineDay[] | null;
}

export type DurationOption = 7 | 15 | 20 | 30 | 60;
```

- [ ] **Step 6: Create database connection**

`lib/db.ts`:
```typescript
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default pool;
```

- [ ] **Step 7: Create migration files**

`migrations/001_create_chapters.sql`:
```sql
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  section VARCHAR(20) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  chapter_number INT NOT NULL,
  chapter_name_bn VARCHAR(200) NOT NULL,
  chapter_name_en VARCHAR(200),
  question_type VARCHAR(20) NOT NULL,
  cq_importance INT NOT NULL DEFAULT 0,
  mcq_importance INT NOT NULL DEFAULT 0,
  math_importance INT NOT NULL DEFAULT 0,
  time_cq_min INT NOT NULL DEFAULT 0,
  time_mcq_min INT NOT NULL DEFAULT 0,
  time_math_min INT NOT NULL DEFAULT 0,
  time_revision_min INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(section, subject, chapter_number)
);
```

`migrations/002_create_submissions.sql`:
```sql
CREATE TABLE IF NOT EXISTS submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  school VARCHAR(300),
  class_roll VARCHAR(20),
  section VARCHAR(20) NOT NULL,
  device_preference VARCHAR(10) DEFAULT 'mobile',
  duration_days INT NOT NULL,
  assessment JSONB NOT NULL,
  pdf_url VARCHAR(500),
  sms_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

`migrations/003_create_routine_days.sql`:
```sql
CREATE TABLE IF NOT EXISTS routine_days (
  id SERIAL PRIMARY KEY,
  submission_id INT NOT NULL REFERENCES submissions(id),
  day_number INT NOT NULL,
  phase INT NOT NULL,
  is_weekend BOOLEAN DEFAULT FALSE,
  entries JSONB NOT NULL,
  total_time_min INT NOT NULL,
  UNIQUE(submission_id, day_number)
);
```

- [ ] **Step 8: Verify scaffold**

```bash
cd webapps/ssc-routine && npm run dev
```

Expected: Next.js starts on port 3002, blank page loads.

- [ ] **Step 9: Commit**

```bash
git add webapps/ssc-routine/
git commit -m "feat(ssc-routine): scaffold Next.js project with DB schema and types"
```

---

## Task 2: CSV Import Script + API

**Files:**
- Create: `webapps/ssc-routine/scripts/import-csv.ts`
- Create: `webapps/ssc-routine/app/api/import-csv/route.ts`

- [ ] **Step 1: Create CLI import script**

`scripts/import-csv.ts`:
```typescript
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run import-csv <path-to-csv>");
    process.exit(1);
  }

  const raw = readFileSync(filePath, "utf-8");
  const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  // Run migrations first
  const migrations = ["001_create_chapters.sql", "002_create_submissions.sql", "003_create_routine_days.sql"];
  for (const m of migrations) {
    const sql = readFileSync(`migrations/${m}`, "utf-8");
    await pool.query(sql);
  }

  // Clear existing chapters and re-import
  await pool.query("DELETE FROM chapters");

  let imported = 0;
  for (const row of records) {
    await pool.query(
      `INSERT INTO chapters (section, subject, chapter_number, chapter_name_bn, chapter_name_en, question_type, cq_importance, mcq_importance, math_importance, time_cq_min, time_mcq_min, time_math_min, time_revision_min)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (section, subject, chapter_number) DO UPDATE SET
         chapter_name_bn = EXCLUDED.chapter_name_bn,
         question_type = EXCLUDED.question_type,
         cq_importance = EXCLUDED.cq_importance,
         mcq_importance = EXCLUDED.mcq_importance,
         math_importance = EXCLUDED.math_importance,
         time_cq_min = EXCLUDED.time_cq_min,
         time_mcq_min = EXCLUDED.time_mcq_min,
         time_math_min = EXCLUDED.time_math_min,
         time_revision_min = EXCLUDED.time_revision_min`,
      [
        row.section, row.subject, parseInt(row.chapter_number),
        row.chapter_name_bn, row.chapter_name_en || null, row.question_type,
        parseInt(row.cq_importance), parseInt(row.mcq_importance), parseInt(row.math_importance),
        parseInt(row.time_cq_min), parseInt(row.time_mcq_min), parseInt(row.time_math_min),
        parseInt(row.time_revision_min),
      ]
    );
    imported++;
  }

  console.log(`Imported ${imported} chapters.`);
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Create API import route (admin)**

`app/api/import-csv/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true });

  await pool.query("DELETE FROM chapters");
  let imported = 0;

  for (const row of records) {
    await pool.query(
      `INSERT INTO chapters (section, subject, chapter_number, chapter_name_bn, chapter_name_en, question_type, cq_importance, mcq_importance, math_importance, time_cq_min, time_mcq_min, time_math_min, time_revision_min)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        row.section, row.subject, parseInt(row.chapter_number),
        row.chapter_name_bn, row.chapter_name_en || null, row.question_type,
        parseInt(row.cq_importance), parseInt(row.mcq_importance), parseInt(row.math_importance),
        parseInt(row.time_cq_min), parseInt(row.time_mcq_min), parseInt(row.time_math_min),
        parseInt(row.time_revision_min),
      ]
    );
    imported++;
  }

  return NextResponse.json({ imported });
}
```

- [ ] **Step 3: Commit**

```bash
git add webapps/ssc-routine/scripts/ webapps/ssc-routine/app/api/import-csv/
git commit -m "feat(ssc-routine): add CSV import script and API route"
```

---

## Task 3: Routine Generation Engine

**Files:**
- Create: `webapps/ssc-routine/lib/routine-engine.ts`

This is the core algorithm. Pure function: takes chapters + assessment + duration → returns RoutineDay[].

- [ ] **Step 1: Implement routine engine**

`lib/routine-engine.ts`:
```typescript
import type { Chapter, Assessment, AssessmentStatus, RoutineDay, RoutineEntry } from "./types";

interface ChapterWithStatus extends Chapter {
  status: AssessmentStatus;
  maxImportance: number; // max(cq_importance, mcq_importance, math_importance)
}

export function generateRoutine(
  chapters: Chapter[],
  assessment: Assessment,
  durationDays: number
): RoutineDay[] {
  // 1. Attach assessment status to each chapter
  const assessed = chapters.map((ch): ChapterWithStatus => {
    const subjectAssessment = assessment[ch.subject] || {};
    const status = subjectAssessment[String(ch.id)] || "pari";
    return {
      ...ch,
      status,
      maxImportance: Math.max(ch.cq_importance, ch.mcq_importance, ch.math_importance),
    };
  });

  // 2. Filter out "syllabus_nai"
  const active = assessed.filter((ch) => ch.status !== "syllabus_nai");

  // 3. Determine phase allocation
  const isShort = durationDays <= 7;
  const phase1Days = isShort ? 0 : Math.round(durationDays * 0.35);
  const phase2Days = isShort
    ? Math.round(durationDays * 0.7)
    : Math.round(durationDays * 0.35);
  const phase3Days = durationDays - phase1Days - phase2Days;

  // 4. Build task pools per phase
  const phase1Pool = buildPhase1Tasks(active, isShort); // basics for pari_na
  const phase2Pool = buildPhase2Tasks(active, isShort); // practice for pari_na + revise
  const phase3Pool = buildPhase3Tasks(active);          // revision for all (by importance)

  // 5. Distribute tasks across days
  const days: RoutineDay[] = [];
  let dayNum = 1;

  // Phase 1 (or merged 1+2 for short timelines)
  if (!isShort && phase1Days > 0) {
    days.push(...distributeTasks(phase1Pool, dayNum, phase1Days, 1));
    dayNum += phase1Days;
  }

  // Phase 2
  const p2Tasks = isShort ? [...phase1Pool, ...phase2Pool] : phase2Pool;
  days.push(...distributeTasks(p2Tasks, dayNum, phase2Days, isShort ? 2 : 2));
  dayNum += phase2Days;

  // Phase 3
  days.push(...distributeTasks(phase3Pool, dayNum, phase3Days, 3));

  return days;
}

function buildPhase1Tasks(chapters: ChapterWithStatus[], isShort: boolean): RoutineEntry[] {
  // Phase 1: basics for "pari_na" chapters only. If short timeline, include revise too.
  const pool = chapters.filter((ch) =>
    isShort ? ch.status === "pari_na" || ch.status === "revise" : ch.status === "pari_na"
  );
  // Sort by importance desc
  pool.sort((a, b) => b.maxImportance - a.maxImportance);

  const tasks: RoutineEntry[] = [];
  for (const ch of pool) {
    // Phase 1 = book reading / basics for each applicable task type
    if (ch.time_cq_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: "বই পড়া (CQ)", timeMin: Math.round(ch.time_cq_min * 0.5),
      });
    }
    if (ch.time_mcq_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: "বই পড়া (MCQ)", timeMin: Math.round(ch.time_mcq_min * 0.3),
      });
    }
    if (ch.time_math_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: "সূত্র ও উদাহরণ", timeMin: Math.round(ch.time_math_min * 0.4),
      });
    }
  }
  return tasks;
}

function buildPhase2Tasks(chapters: ChapterWithStatus[], isShort: boolean): RoutineEntry[] {
  // Phase 2: practice for pari_na + revise
  const pool = chapters.filter((ch) => ch.status === "pari_na" || ch.status === "revise");
  pool.sort((a, b) => b.maxImportance - a.maxImportance);

  const tasks: RoutineEntry[] = [];
  for (const ch of pool) {
    if (ch.time_cq_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: "CQ অনুশীলন", timeMin: ch.time_cq_min,
      });
    }
    if (ch.time_mcq_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: "MCQ অনুশীলন", timeMin: ch.time_mcq_min,
      });
    }
    if (ch.time_math_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: "গণিত অনুশীলন", timeMin: ch.time_math_min,
      });
    }
  }
  return tasks;
}

function buildPhase3Tasks(chapters: ChapterWithStatus[]): RoutineEntry[] {
  // Phase 3: revision for all chapters, weighted by importance
  // High importance (4-5): included. Medium (3): included if pari_na/revise. Low (1-2): only if pari_na.
  const pool = chapters.filter((ch) => {
    if (ch.maxImportance >= 4) return true;
    if (ch.maxImportance >= 3 && (ch.status === "pari_na" || ch.status === "revise")) return true;
    if (ch.status === "pari_na") return true;
    return false;
  });
  pool.sort((a, b) => b.maxImportance - a.maxImportance);

  const tasks: RoutineEntry[] = [];
  for (const ch of pool) {
    tasks.push({
      chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
      taskType: "রিভিশন", timeMin: ch.time_revision_min,
    });
  }
  return tasks;
}

function distributeTasks(
  tasks: RoutineEntry[],
  startDay: number,
  numDays: number,
  phase: 1 | 2 | 3
): RoutineDay[] {
  if (numDays === 0 || tasks.length === 0) return [];

  const days: RoutineDay[] = [];

  // Create empty days
  for (let i = 0; i < numDays; i++) {
    const dayNum = startDay + i;
    // 5-day sprint: days 6,7 / 13,14 / etc are weekends (lighter)
    const dayInWeek = ((dayNum - 1) % 7) + 1;
    const isWeekend = dayInWeek === 6 || dayInWeek === 7;
    days.push({ dayNumber: dayNum, phase, isWeekend, entries: [], totalTimeMin: 0 });
  }

  // Round-robin distribute tasks across days
  // Weekends get ~60% of the task time
  let dayIdx = 0;
  for (const task of tasks) {
    const day = days[dayIdx];
    const adjustedTime = day.isWeekend ? Math.round(task.timeMin * 0.6) : task.timeMin;
    day.entries.push({ ...task, timeMin: adjustedTime });
    day.totalTimeMin += adjustedTime;
    dayIdx = (dayIdx + 1) % numDays;
  }

  return days;
}
```

- [ ] **Step 2: Commit**

```bash
git add webapps/ssc-routine/lib/routine-engine.ts
git commit -m "feat(ssc-routine): implement 3-phase routine generation engine"
```

---

## Task 4: UI Components

**Files:**
- Create: `webapps/ssc-routine/components/ProgressBar.tsx`
- Create: `webapps/ssc-routine/components/PillButton.tsx`
- Create: `webapps/ssc-routine/components/SubjectCard.tsx`
- Create: `webapps/ssc-routine/components/ChapterRow.tsx`
- Create: `webapps/ssc-routine/components/DurationTile.tsx`
- Create: `webapps/ssc-routine/components/RoutineTable.tsx`
- Create: `webapps/ssc-routine/components/PhaseLabel.tsx`

- [ ] **Step 1: ProgressBar component**

`components/ProgressBar.tsx`:
```tsx
"use client";

interface Props {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: Props) {
  const pct = (currentStep / totalSteps) * 100;
  return (
    <div className="w-full h-1 bg-[var(--color-border)]">
      <div
        className="h-full bg-[var(--color-primary)] transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
```

- [ ] **Step 2: PillButton component**

`components/PillButton.tsx`:
```tsx
"use client";

interface Props {
  label: string;
  selected: boolean;
  variant: "warning" | "error" | "gray" | "default";
  onClick: () => void;
}

const variantStyles = {
  warning: { active: "bg-[var(--color-warning)] text-white", inactive: "bg-[var(--color-surface)] text-[var(--color-warning)] border border-[var(--color-warning)]" },
  error: { active: "bg-[var(--color-error)] text-white", inactive: "bg-[var(--color-surface)] text-[var(--color-error)] border border-[var(--color-error)]" },
  gray: { active: "bg-[var(--color-gray)] text-white", inactive: "bg-[var(--color-surface)] text-[var(--color-gray)] border border-[var(--color-gray)]" },
  default: { active: "bg-[var(--color-primary)] text-white", inactive: "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]" },
};

export default function PillButton({ label, selected, variant, onClick }: Props) {
  const styles = variantStyles[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-[var(--radius-pill)] text-[13px] font-medium transition-colors ${selected ? styles.active : styles.inactive}`}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 3: SubjectCard component**

`components/SubjectCard.tsx`:
```tsx
"use client";

import { useState } from "react";
import type { Chapter, AssessmentStatus } from "@/lib/types";
import PillButton from "./PillButton";
import ChapterRow from "./ChapterRow";

interface Props {
  subject: string;
  chapters: Chapter[];
  subjectStatus: AssessmentStatus | null;
  chapterStatuses: Record<string, AssessmentStatus>;
  onSubjectChange: (status: AssessmentStatus) => void;
  onChapterChange: (chapterId: string, status: AssessmentStatus) => void;
}

export default function SubjectCard({
  subject, chapters, subjectStatus, chapterStatuses,
  onSubjectChange, onChapterChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const statusLabel = !subjectStatus || subjectStatus === "pari"
    ? null
    : subjectStatus === "revise" ? "রিভাইজ দিলে পারব"
    : subjectStatus === "pari_na" ? "একদম পারি না"
    : "সিলেবাসে নাই";

  return (
    <div className="bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-card)] overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[var(--font-size-body)] font-semibold">{subject}</span>
          {statusLabel && (
            <span className="text-[11px] text-[var(--color-text-muted)]">{statusLabel}</span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <PillButton
            label="রিভাইজ দিলে পারব"
            selected={subjectStatus === "revise"}
            variant="warning"
            onClick={() => onSubjectChange(subjectStatus === "revise" ? "pari" : "revise")}
          />
          <PillButton
            label="একদম পারি না"
            selected={subjectStatus === "pari_na"}
            variant="error"
            onClick={() => onSubjectChange(subjectStatus === "pari_na" ? "pari" : "pari_na")}
          />
          <PillButton
            label="সিলেবাসে নাই"
            selected={subjectStatus === "syllabus_nai"}
            variant="gray"
            onClick={() => onSubjectChange(subjectStatus === "syllabus_nai" ? "pari" : "syllabus_nai")}
          />
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-[var(--color-primary)] text-[13px] font-medium"
        >
          {expanded ? "অধ্যায় লুকাও ▴" : "অধ্যায় দেখো ▾"}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 pb-3">
          {chapters.map((ch) => (
            <ChapterRow
              key={ch.id}
              chapter={ch}
              status={chapterStatuses[String(ch.id)] || subjectStatus || "pari"}
              onChange={(s) => onChapterChange(String(ch.id), s)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: ChapterRow component**

`components/ChapterRow.tsx`:
```tsx
"use client";

import type { Chapter, AssessmentStatus } from "@/lib/types";
import PillButton from "./PillButton";

interface Props {
  chapter: Chapter;
  status: AssessmentStatus;
  onChange: (status: AssessmentStatus) => void;
}

export default function ChapterRow({ chapter, status, onChange }: Props) {
  const importance = Math.max(chapter.cq_importance, chapter.mcq_importance, chapter.math_importance);
  const stars = "★".repeat(importance) + "☆".repeat(5 - importance);

  return (
    <div className={`py-3 border-b border-[var(--color-border)] last:border-b-0 ${status === "pari_na" ? "border-l-2 border-l-[var(--color-error)] pl-3" : ""}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[14px]">{chapter.chapter_name_bn}</span>
        <span className="text-[12px] text-[var(--color-warning)]">{stars}</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <PillButton label="রিভাইজ দিলে পারব" selected={status === "revise"} variant="warning"
          onClick={() => onChange(status === "revise" ? "pari" : "revise")} />
        <PillButton label="একদম পারি না" selected={status === "pari_na"} variant="error"
          onClick={() => onChange(status === "pari_na" ? "pari" : "pari_na")} />
        <PillButton label="সিলেবাসে নাই" selected={status === "syllabus_nai"} variant="gray"
          onClick={() => onChange(status === "syllabus_nai" ? "pari" : "syllabus_nai")} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: DurationTile component**

`components/DurationTile.tsx`:
```tsx
"use client";

import type { DurationOption } from "@/lib/types";

interface Props {
  days: DurationOption;
  description: string;
  recommended?: boolean;
  selected: boolean;
  onClick: () => void;
}

export default function DurationTile({ days, description, recommended, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative p-4 rounded-[var(--radius-card)] border-2 text-left transition-colors ${
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
          : "border-[var(--color-border)] bg-white"
      }`}
    >
      {recommended && (
        <span className="absolute -top-2.5 left-3 bg-[var(--color-primary)] text-white text-[11px] px-2 py-0.5 rounded-full">
          সেরা পছন্দ
        </span>
      )}
      <span className="block text-[24px] font-bold text-[var(--color-secondary)]">{days} দিন</span>
      <span className="block text-[13px] text-[var(--color-text-muted)] mt-1">{description}</span>
      {selected && <span className="absolute top-3 right-3 text-[var(--color-primary)]">✓</span>}
    </button>
  );
}
```

- [ ] **Step 6: PhaseLabel + RoutineTable components**

`components/PhaseLabel.tsx`:
```tsx
const phaseConfig = {
  1: { label: "Phase 1 — ভিত্তি তৈরি", bg: "bg-[var(--color-primary-light)]", text: "text-[var(--color-primary)]" },
  2: { label: "Phase 2 — অনুশীলন", bg: "bg-amber-50", text: "text-[var(--color-warning)]" },
  3: { label: "Phase 3 — রিভিশন", bg: "bg-green-50", text: "text-[var(--color-success)]" },
};

export default function PhaseLabel({ phase }: { phase: 1 | 2 | 3 }) {
  const cfg = phaseConfig[phase];
  return (
    <div className={`${cfg.bg} ${cfg.text} px-4 py-2 text-[13px] font-semibold`}>
      {cfg.label}
    </div>
  );
}
```

`components/RoutineTable.tsx`:
```tsx
import type { RoutineDay } from "@/lib/types";
import PhaseLabel from "./PhaseLabel";

interface Props {
  days: RoutineDay[];
  maxVisible?: number;
}

export default function RoutineTable({ days, maxVisible }: Props) {
  const visible = maxVisible ? days.slice(0, maxVisible) : days;
  const hasMore = maxVisible && days.length > maxVisible;
  let currentPhase = 0;

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden bg-white">
      {/* Header */}
      <div className="grid grid-cols-[50px_1fr_1fr_60px] gap-1 px-3 py-2 bg-[var(--color-surface)] text-[12px] font-semibold text-[var(--color-text-muted)]">
        <span>দিন</span><span>বিষয় ও অধ্যায়</span><span>ধরন</span><span>সময়</span>
      </div>
      {visible.map((day) => {
        const showPhase = day.phase !== currentPhase;
        currentPhase = day.phase;
        return (
          <div key={day.dayNumber}>
            {showPhase && <PhaseLabel phase={day.phase as 1 | 2 | 3} />}
            {day.entries.map((entry, i) => (
              <div
                key={`${day.dayNumber}-${i}`}
                className={`grid grid-cols-[50px_1fr_1fr_60px] gap-1 px-3 py-2 border-t border-[var(--color-border)] text-[13px] ${day.isWeekend ? "bg-blue-50/30" : ""}`}
              >
                {i === 0 ? (
                  <span className="font-semibold">
                    Day {day.dayNumber}
                    {day.isWeekend && <span className="text-[10px] text-[var(--color-text-muted)] block">🌙</span>}
                  </span>
                ) : <span />}
                <span className="truncate">
                  <span className="font-medium">{entry.subject}</span>
                  <span className="text-[var(--color-text-muted)] block text-[11px] truncate">{entry.chapterName}</span>
                </span>
                <span className="text-[var(--color-text-muted)]">{entry.taskType}</span>
                <span className="text-right">{entry.timeMin} মি.</span>
              </div>
            ))}
            {day.entries.length > 0 && (
              <div className="px-3 py-1 text-right text-[12px] text-[var(--color-text-muted)] bg-[var(--color-surface)]/50">
                ~{Math.round(day.totalTimeMin / 60 * 10) / 10} ঘণ্টা
              </div>
            )}
          </div>
        );
      })}
      {hasMore && (
        <div className="px-4 py-3 text-center text-[13px] text-[var(--color-text-muted)] bg-gradient-to-t from-white via-white/80 to-transparent">
          PDF-এ সম্পূর্ণ রুটিন দেখো ↓
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add webapps/ssc-routine/components/
git commit -m "feat(ssc-routine): add all UI components (pills, cards, table, progress)"
```

---

## Task 5: Wizard Pages (Steps 0–5)

**Files:**
- Create: `webapps/ssc-routine/app/page.tsx`
- Create: `webapps/ssc-routine/app/wizard/layout.tsx`
- Create: `webapps/ssc-routine/app/wizard/info/page.tsx`
- Create: `webapps/ssc-routine/app/wizard/assess/page.tsx`
- Create: `webapps/ssc-routine/app/wizard/duration/page.tsx`
- Create: `webapps/ssc-routine/app/wizard/preview/page.tsx`
- Create: `webapps/ssc-routine/app/wizard/capture/page.tsx`
- Create: `webapps/ssc-routine/app/success/page.tsx`

This task implements all page-level routing and client state management. State flows via `sessionStorage` between wizard pages (no global state library needed — 6-step wizard, short-lived session).

- [ ] **Step 1: Hero landing page**

`app/page.tsx`:
```tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-dvh bg-[var(--color-primary)] flex flex-col justify-center items-center px-6 text-center">
      <img src="/10ms-logo.svg" alt="10MS" className="w-16 h-16 mb-8 brightness-0 invert" />
      <h1 className="text-[28px] font-bold text-white leading-tight mb-4">
        তোমার SSC 27 রুটিন তৈরি করো
      </h1>
      <p className="text-white/80 text-[15px] mb-10 max-w-xs">
        মাত্র ৩ মিনিটে — তোমার নাম সহ PDF পাবে সরাসরি SMS-এ
      </p>
      <Link
        href="/wizard/info"
        className="bg-white text-[var(--color-primary)] font-semibold text-[16px] px-8 py-3.5 rounded-[var(--radius-button)] shadow-lg"
      >
        শুরু করো →
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Wizard layout with progress bar**

`app/wizard/layout.tsx`:
```tsx
"use client";

import { usePathname } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

const stepMap: Record<string, number> = {
  "/wizard/info": 1,
  "/wizard/assess": 2,
  "/wizard/duration": 3,
  "/wizard/preview": 4,
  "/wizard/capture": 5,
};

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = stepMap[pathname] || 1;

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <ProgressBar currentStep={step} totalSteps={5} />
      <div className="max-w-md mx-auto px-[var(--padding-page)] py-6">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Step 1 — Info page**

`app/wizard/info/page.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Section } from "@/lib/types";

const sections: Section[] = ["বিজ্ঞান", "মানবিক", "বাণিজ্য", "কলা"];

export default function InfoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [section, setSection] = useState<Section | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("wizard");
    if (saved) {
      const data = JSON.parse(saved);
      if (data.name) setName(data.name);
      if (data.section) setSection(data.section);
    }
  }, []);

  function handleNext() {
    if (!name.trim() || !section) return;
    const existing = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    sessionStorage.setItem("wizard", JSON.stringify({ ...existing, name: name.trim(), section }));
    router.push("/wizard/assess");
  }

  return (
    <div>
      <h1 className="text-[var(--font-size-h1)] font-bold mb-6">তোমার তথ্য দাও</h1>

      <label className="block mb-4">
        <span className="text-[14px] text-[var(--color-text-muted)] mb-1 block">তোমার নাম</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="নাম লেখো"
          className="w-full px-4 py-3 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] outline-none focus:border-[var(--color-primary)]"
        />
      </label>

      <div className="mb-8">
        <span className="text-[14px] text-[var(--color-text-muted)] mb-2 block">তোমার বিভাগ</span>
        <div className="flex gap-2 flex-wrap">
          {sections.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSection(s)}
              className={`px-5 py-2.5 rounded-[var(--radius-pill)] text-[14px] font-medium transition-colors ${
                section === s
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!name.trim() || !section}
        className="w-full py-3.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white font-semibold text-[16px] disabled:opacity-40"
      >
        পরের ধাপ →
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Step 2 — Assessment page**

`app/wizard/assess/page.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Chapter, Assessment, AssessmentStatus } from "@/lib/types";
import SubjectCard from "@/components/SubjectCard";

export default function AssessPage() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [assessment, setAssessment] = useState<Assessment>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (!saved.section) { router.push("/wizard/info"); return; }
    if (saved.assessment) setAssessment(saved.assessment);

    fetch(`/api/chapters?section=${encodeURIComponent(saved.section)}`)
      .then((r) => r.json())
      .then((data) => { setChapters(data); setLoading(false); });
  }, [router]);

  // Group chapters by subject
  const subjects = chapters.reduce<Record<string, Chapter[]>>((acc, ch) => {
    if (!acc[ch.subject]) acc[ch.subject] = [];
    acc[ch.subject].push(ch);
    return acc;
  }, {});

  function getSubjectStatus(subject: string): AssessmentStatus | null {
    const chStatuses = assessment[subject];
    if (!chStatuses) return null;
    const vals = Object.values(chStatuses);
    if (vals.length === 0) return null;
    // If all chapters have same status, that's the subject status
    const allSame = vals.every((v) => v === vals[0]);
    return allSame ? vals[0] : null;
  }

  function handleSubjectChange(subject: string, status: AssessmentStatus) {
    const subjectChapters = subjects[subject] || [];
    const newChapterStatuses: Record<string, AssessmentStatus> = {};
    for (const ch of subjectChapters) {
      newChapterStatuses[String(ch.id)] = status;
    }
    setAssessment((prev) => ({ ...prev, [subject]: newChapterStatuses }));
  }

  function handleChapterChange(subject: string, chapterId: string, status: AssessmentStatus) {
    setAssessment((prev) => ({
      ...prev,
      [subject]: { ...prev[subject], [chapterId]: status },
    }));
  }

  function handleNext() {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    sessionStorage.setItem("wizard", JSON.stringify({ ...saved, assessment }));
    router.push("/wizard/duration");
  }

  if (loading) return <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>;

  return (
    <div>
      <h1 className="text-[var(--font-size-h1)] font-bold mb-2">কোন বিষয়ে কী অবস্থা?</h1>
      <p className="text-[13px] text-[var(--color-text-muted)] mb-6">
        প্রতিটি বিষয়ের পাশে তোমার অবস্থা বেছে নাও। বিস্তারিত দেখতে অধ্যায়ে ক্লিক করো।
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {Object.entries(subjects).map(([subject, chs]) => (
          <SubjectCard
            key={subject}
            subject={subject}
            chapters={chs}
            subjectStatus={getSubjectStatus(subject)}
            chapterStatuses={assessment[subject] || {}}
            onSubjectChange={(s) => handleSubjectChange(subject, s)}
            onChapterChange={(chId, s) => handleChapterChange(subject, chId, s)}
          />
        ))}
      </div>

      <button
        onClick={handleNext}
        className="w-full py-3.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white font-semibold text-[16px]"
      >
        পরের ধাপ →
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Step 3 — Duration page**

`app/wizard/duration/page.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { DurationOption } from "@/lib/types";
import DurationTile from "@/components/DurationTile";

const options: { days: DurationOption; desc: string; rec?: boolean }[] = [
  { days: 7, desc: "দ্রুত — দ্রুত রিভিশনের জন্য" },
  { days: 15, desc: "ছোট — গুরুত্বপূর্ণ অধ্যায়গুলো cover হবে" },
  { days: 20, desc: "মাঝারি — ভালো balance" },
  { days: 30, desc: "Pre-test-এর জন্য আদর্শ", rec: true },
  { days: 60, desc: "Board-এর জন্য সেরা — পুরো syllabus" },
];

export default function DurationPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<DurationOption | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (saved.durationDays) setSelected(saved.durationDays);
  }, []);

  async function handleNext() {
    if (!selected) return;
    setGenerating(true);
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        section: saved.section,
        assessment: saved.assessment,
        durationDays: selected,
      }),
    });
    const { routine } = await res.json();

    sessionStorage.setItem("wizard", JSON.stringify({ ...saved, durationDays: selected, routinePreview: routine }));
    setGenerating(false);
    router.push("/wizard/preview");
  }

  return (
    <div>
      <h1 className="text-[var(--font-size-h1)] font-bold mb-6">কতদিনের রুটিন চাও?</h1>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {options.map((o) => (
          <DurationTile
            key={o.days}
            days={o.days}
            description={o.desc}
            recommended={o.rec}
            selected={selected === o.days}
            onClick={() => setSelected(o.days)}
          />
        ))}
      </div>

      <button
        onClick={handleNext}
        disabled={!selected || generating}
        className="w-full py-3.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white font-semibold text-[16px] disabled:opacity-40"
      >
        {generating ? "রুটিন তৈরি হচ্ছে..." : "রুটিন দেখো →"}
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Step 4 — Preview page**

`app/wizard/preview/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoutineDay } from "@/lib/types";
import RoutineTable from "@/components/RoutineTable";

export default function PreviewPage() {
  const router = useRouter();
  const [data, setData] = useState<{ name: string; routine: RoutineDay[]; durationDays: number } | null>(null);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (!saved.routinePreview) { router.push("/wizard/duration"); return; }
    setData({ name: saved.name, routine: saved.routinePreview, durationDays: saved.durationDays });
  }, [router]);

  if (!data) return null;

  const gapCount = data.routine.reduce((count, day) => {
    return count + day.entries.filter((e) => e.taskType !== "রিভিশন").length;
  }, 0);

  function handleShare() {
    const text = `আমি SSC 27 এর জন্য ${data!.durationDays} দিনের personalized রুটিন তৈরি করেছি! তুমিও তৈরি করো 👉 ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div>
      <h1 className="text-[var(--font-size-h1)] font-bold mb-3">তোমার রুটিন তৈরি হয়েছে!</h1>

      <div className="bg-[var(--color-primary)] text-white rounded-[var(--radius-card)] px-4 py-3 mb-4 text-[14px]">
        <span className="font-semibold">{data.durationDays} দিন</span> | {data.routine[0]?.entries.length > 0 ? `${gapCount} টি task চিহ্নিত` : ""}
      </div>

      <RoutineTable days={data.routine} maxVisible={5} />

      <div className="flex gap-3 mt-6">
        <button
          onClick={handleShare}
          className="flex-1 py-3 rounded-[var(--radius-button)] bg-[#25D366] text-white font-semibold text-[14px]"
        >
          বন্ধুকে share করো
        </button>
        <button
          onClick={() => router.push("/wizard/capture")}
          className="flex-1 py-3 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white font-semibold text-[14px]"
        >
          PDF পেতে →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Step 5 — Capture page**

`app/wizard/capture/page.tsx`:
```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CapturePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [roll, setRoll] = useState("");
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (!saved.routinePreview) router.push("/wizard/duration");
  }, [router]);

  async function handleSubmit() {
    if (!phone.trim()) return;
    setSubmitting(true);

    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: saved.name,
        phone: phone.trim(),
        school: school.trim(),
        classRoll: roll.trim(),
        section: saved.section,
        devicePreference: device,
        durationDays: saved.durationDays,
        assessment: saved.assessment,
        routine: saved.routinePreview,
      }),
    });

    if (res.ok) {
      sessionStorage.removeItem("wizard");
      router.push("/success");
    }
    setSubmitting(false);
  }

  return (
    <div>
      <h1 className="text-[var(--font-size-h1)] font-bold mb-2">একটু তথ্য দাও</h1>
      <p className="text-[13px] text-[var(--color-text-muted)] mb-6">PDF আসছে SMS-এ</p>

      <div className="flex flex-col gap-4 mb-6">
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          placeholder="তোমার নম্বর" className="w-full px-4 py-3 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] outline-none focus:border-[var(--color-primary)]" />
        <p className="text-[11px] text-[var(--color-text-muted)] -mt-2">তোমার নম্বর শুধু PDF পাঠাতে ব্যবহার হবে।</p>

        <input type="text" value={school} onChange={(e) => setSchool(e.target.value)}
          placeholder="তোমার স্কুলের নাম" className="w-full px-4 py-3 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] outline-none focus:border-[var(--color-primary)]" />

        <input type="text" value={roll} onChange={(e) => setRoll(e.target.value)}
          placeholder="ক্লাস রোল" className="w-full px-4 py-3 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] outline-none focus:border-[var(--color-primary)]" />

        <div>
          <span className="text-[14px] text-[var(--color-text-muted)] mb-2 block">Device</span>
          <div className="flex gap-2">
            {(["mobile", "desktop"] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDevice(d)}
                className={`flex-1 py-2.5 rounded-[var(--radius-pill)] text-[14px] font-medium ${device === d ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border)]"}`}>
                {d === "mobile" ? "মোবাইল" : "কম্পিউটার"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={!phone.trim() || submitting}
        className="w-full py-3.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white font-semibold text-[16px] disabled:opacity-40">
        {submitting ? "পাঠানো হচ্ছে..." : "PDF পাঠাও →"}
      </button>
    </div>
  );
}
```

- [ ] **Step 8: Success page**

`app/success/page.tsx`:
```tsx
import Link from "next/link";

export default function SuccessPage() {
  return (
    <div className="min-h-dvh flex flex-col justify-center items-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center mb-6">
        <span className="text-[var(--color-primary)] text-4xl">✓</span>
      </div>
      <h1 className="text-[var(--font-size-h1)] font-bold mb-3">রুটিন পাঠানো হয়েছে!</h1>
      <p className="text-[var(--color-text-muted)] text-[15px] mb-8 max-w-xs">
        তোমার নম্বরে SMS গেছে। PDF download করো এবং নাম লিখে শুরু করো আজই।
      </p>
      <a href="https://wa.me/?text=আমি%20SSC%2027%20এর%20জন্য%20personalized%20রুটিন%20তৈরি%20করেছি!%20তুমিও%20তৈরি%20করো%20👉"
        className="bg-[#25D366] text-white font-semibold px-6 py-3 rounded-[var(--radius-button)] mb-4 text-[14px]" target="_blank">
        বন্ধুকে পাঠাও
      </a>
      <Link href="/" className="text-[var(--color-primary)] text-[14px] font-medium">
        আবার শুরু করো
      </Link>
    </div>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add webapps/ssc-routine/app/
git commit -m "feat(ssc-routine): add all wizard pages (hero, info, assess, duration, preview, capture, success)"
```

---

## Task 6: API Routes (Generate + Submit + Chapters)

**Files:**
- Create: `webapps/ssc-routine/app/api/chapters/route.ts`
- Create: `webapps/ssc-routine/app/api/generate/route.ts`
- Create: `webapps/ssc-routine/app/api/submit/route.ts`
- Create: `webapps/ssc-routine/lib/sms.ts`

- [ ] **Step 1: Chapters API (fetches by section)**

`app/api/chapters/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section");
  if (!section) return NextResponse.json({ error: "section required" }, { status: 400 });

  const { rows } = await pool.query(
    "SELECT * FROM chapters WHERE section = $1 ORDER BY subject, chapter_number",
    [section]
  );

  return NextResponse.json(rows);
}
```

- [ ] **Step 2: Generate API (runs routine engine, returns preview)**

`app/api/generate/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateRoutine } from "@/lib/routine-engine";

export async function POST(req: NextRequest) {
  const { section, assessment, durationDays } = await req.json();

  const { rows: chapters } = await pool.query(
    "SELECT * FROM chapters WHERE section = $1 ORDER BY subject, chapter_number",
    [section]
  );

  const routine = generateRoutine(chapters, assessment, durationDays);

  return NextResponse.json({ routine });
}
```

- [ ] **Step 3: SMS client stub**

`lib/sms.ts`:
```typescript
export async function sendSms(phone: string, message: string): Promise<boolean> {
  const url = process.env.SMS_API_URL;
  const key = process.env.SMS_API_KEY;
  if (!url || !key) {
    console.warn("SMS not configured — skipping send to", phone);
    return false;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ phone, message }),
  });

  return res.ok;
}
```

- [ ] **Step 4: Submit API (save to DB + trigger SMS)**

`app/api/submit/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, school, classRoll, section, devicePreference, durationDays, assessment, routine } = body;

  // 1. Insert submission
  const { rows } = await pool.query(
    `INSERT INTO submissions (name, phone, school, class_roll, section, device_preference, duration_days, assessment)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [name, phone, school || null, classRoll || null, section, devicePreference, durationDays, JSON.stringify(assessment)]
  );
  const submissionId = rows[0].id;

  // 2. Insert routine days
  for (const day of routine) {
    await pool.query(
      `INSERT INTO routine_days (submission_id, day_number, phase, is_weekend, entries, total_time_min)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [submissionId, day.dayNumber, day.phase, day.isWeekend, JSON.stringify(day.entries), day.totalTimeMin]
    );
  }

  // 3. TODO: Generate PDF and upload (Task 7)
  // 4. Send SMS with placeholder link
  const pdfUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://ssc.10ms.com"}/api/pdf/${submissionId}`;
  await pool.query("UPDATE submissions SET pdf_url = $1 WHERE id = $2", [pdfUrl, submissionId]);

  const smsSent = await sendSms(phone, `${name}, তোমার SSC 27 রুটিন তৈরি হয়েছে! Download করো: ${pdfUrl}`);
  await pool.query("UPDATE submissions SET sms_sent = $1 WHERE id = $2", [smsSent, submissionId]);

  return NextResponse.json({ id: submissionId, pdfUrl });
}
```

- [ ] **Step 5: Commit**

```bash
git add webapps/ssc-routine/app/api/ webapps/ssc-routine/lib/sms.ts
git commit -m "feat(ssc-routine): add API routes (chapters, generate, submit) and SMS client"
```

---

## Task 7: PDF Generation

**Files:**
- Create: `webapps/ssc-routine/lib/pdf-generator.tsx`
- Create: `webapps/ssc-routine/app/api/pdf/[id]/route.ts`

- [ ] **Step 1: PDF document component**

`lib/pdf-generator.tsx`:
```tsx
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { RoutineDay } from "./types";

Font.register({
  family: "HindSiliguri",
  src: "https://fonts.gstatic.com/s/hindsiliguri/v12/ijwTs5juQtsqLLdNIgBJcDYSA66Q.ttf",
  fontWeight: 400,
});

const styles = StyleSheet.create({
  page: { fontFamily: "HindSiliguri", fontSize: 10, padding: 30, color: "#333" },
  header: { backgroundColor: "#E31E24", color: "white", padding: 15, marginBottom: 15, borderRadius: 6 },
  headerTitle: { fontSize: 16, fontWeight: 700, marginBottom: 4 },
  headerSub: { fontSize: 10, opacity: 0.8 },
  phaseLabel: { padding: "6 10", fontSize: 10, fontWeight: 600, marginTop: 8, marginBottom: 4, borderRadius: 4 },
  row: { flexDirection: "row", borderBottom: "1 solid #E5E5E5", paddingVertical: 4, paddingHorizontal: 6 },
  rowHeader: { flexDirection: "row", backgroundColor: "#F5F5F5", paddingVertical: 5, paddingHorizontal: 6, fontWeight: 600, fontSize: 9 },
  colDay: { width: "10%" }, colSubject: { width: "25%" }, colChapter: { width: "30%" },
  colType: { width: "20%" }, colTime: { width: "15%", textAlign: "right" },
  dayTotal: { textAlign: "right", fontSize: 9, color: "#888", paddingVertical: 2, paddingRight: 6 },
  footer: { position: "absolute", bottom: 20, left: 30, right: 30, textAlign: "center", fontSize: 8, color: "#888" },
  cta: { backgroundColor: "#FFF0F0", padding: 10, borderRadius: 6, marginTop: 15, textAlign: "center" },
  ctaText: { fontSize: 11, color: "#E31E24", fontWeight: 600 },
});

const phaseColors = {
  1: { bg: "#FFF0F0", text: "#E31E24", label: "Phase 1 — ভিত্তি তৈরি" },
  2: { bg: "#FFF8E1", text: "#F59E0B", label: "Phase 2 — অনুশীলন" },
  3: { bg: "#F0FFF4", text: "#22C55E", label: "Phase 3 — রিভিশন" },
};

interface Props { name: string; section: string; durationDays: number; routine: RoutineDay[]; }

export default function RoutinePDF({ name, section, durationDays, routine }: Props) {
  let currentPhase = 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SSC 27 Smart Routine — {name}</Text>
          <Text style={styles.headerSub}>{section} | {durationDays} দিন | 10 Minute School</Text>
        </View>

        <View style={styles.rowHeader}>
          <Text style={styles.colDay}>দিন</Text>
          <Text style={styles.colSubject}>বিষয়</Text>
          <Text style={styles.colChapter}>অধ্যায়</Text>
          <Text style={styles.colType}>ধরন</Text>
          <Text style={styles.colTime}>সময়</Text>
        </View>

        {routine.map((day) => {
          const showPhase = day.phase !== currentPhase;
          currentPhase = day.phase;
          const pc = phaseColors[day.phase as 1 | 2 | 3];

          return (
            <View key={day.dayNumber}>
              {showPhase && (
                <View style={[styles.phaseLabel, { backgroundColor: pc.bg }]}>
                  <Text style={{ color: pc.text }}>{pc.label}</Text>
                </View>
              )}
              {day.entries.map((entry, i) => (
                <View key={`${day.dayNumber}-${i}`} style={styles.row} wrap={false}>
                  <Text style={styles.colDay}>{i === 0 ? `Day ${day.dayNumber}` : ""}</Text>
                  <Text style={styles.colSubject}>{entry.subject}</Text>
                  <Text style={styles.colChapter}>{entry.chapterName}</Text>
                  <Text style={styles.colType}>{entry.taskType}</Text>
                  <Text style={styles.colTime}>{entry.timeMin} মি.</Text>
                </View>
              ))}
              <Text style={styles.dayTotal}>~{(day.totalTimeMin / 60).toFixed(1)} ঘণ্টা</Text>
            </View>
          );
        })}

        <View style={styles.cta}>
          <Text style={styles.ctaText}>SSC 27 Complete Prep — 10 Minute School-এ ভর্তি হও!</Text>
        </View>

        <Text style={styles.footer}>Generated by 10 Minute School Smart Routine Generator</Text>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: PDF download API route**

`app/api/pdf/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import pool from "@/lib/db";
import RoutinePDF from "@/lib/pdf-generator";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { rows: subs } = await pool.query("SELECT * FROM submissions WHERE id = $1", [id]);
  if (subs.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const sub = subs[0];

  const { rows: days } = await pool.query(
    "SELECT * FROM routine_days WHERE submission_id = $1 ORDER BY day_number",
    [id]
  );

  const routine = days.map((d) => ({
    dayNumber: d.day_number,
    phase: d.phase,
    isWeekend: d.is_weekend,
    entries: d.entries,
    totalTimeMin: d.total_time_min,
  }));

  const buffer = await renderToBuffer(
    RoutinePDF({ name: sub.name, section: sub.section, durationDays: sub.duration_days, routine })
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="SSC27-Routine-${sub.name.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add webapps/ssc-routine/lib/pdf-generator.tsx webapps/ssc-routine/app/api/pdf/
git commit -m "feat(ssc-routine): add PDF generation with @react-pdf/renderer"
```

---

## Task 8: Generate Figma Designs

**Files:** None (Figma only)

Use the Figma MCP to generate all screens into the Routine file (`tjdVdHoHjZUCMINWb0JWeX`), using the SuperXperience design tokens and component patterns.

- [ ] **Step 1: Generate all 8 screens into Figma**

Use `mcp__figma-remote-mcp__generate_figma_design` to create:
1. Hero/Landing
2. Info (name + section)
3. Assessment (subject + chapter accordion)
4. Duration selector
5. Routine preview with phase labels
6. Lead capture form
7. Success screen
8. PDF preview

Each screen at 393px width (mobile), matching the SuperXperience card radius, pill buttons, red primary, gray surfaces, and Hind Siliguri typography.

- [ ] **Step 2: Screenshot and verify all screens**

Use `mcp__figma-remote-mcp__get_screenshot` on each generated frame. Present to Raied for approval before coding.

---

## Task 9: Integration Testing + Deploy

- [ ] **Step 1: Run migrations against real database**

```bash
cd webapps/ssc-routine
# Run each migration
cat migrations/001_create_chapters.sql | psql $DATABASE_URL
cat migrations/002_create_submissions.sql | psql $DATABASE_URL
cat migrations/003_create_routine_days.sql | psql $DATABASE_URL
```

- [ ] **Step 2: Import test CSV**

Create a test CSV with 5-10 chapters and run:
```bash
DATABASE_URL=... npm run import-csv test-data.csv
```

- [ ] **Step 3: Run full flow manually**

```bash
npm run dev
```

Open `http://localhost:3002`, walk through all 6 steps. Verify:
- Chapters load for selected section
- Assessment UI works (subject-level and chapter-level)
- Routine generates with correct phases
- Preview table renders
- Submission saves to DB
- PDF downloads correctly
- SMS fires (or logs warning if not configured)

- [ ] **Step 4: Commit final state**

```bash
git add -A webapps/ssc-routine/
git commit -m "feat(ssc-routine): complete SSC 27 Smart Routine Generator v1"
```

---

## Self-Review Checklist

| Spec Requirement | Task |
|---|---|
| Name + Section input | Task 5 Step 3 |
| Subject + chapter assessment with 4 states | Task 4 Steps 3-4, Task 5 Step 4 |
| Subject→chapter hierarchy with auto-populate | Task 4 Step 3 (SubjectCard) |
| Duration selector (7/15/20/30/60) | Task 4 Step 5, Task 5 Step 5 |
| 3-phase routine generation | Task 3 |
| Short timeline compression | Task 3 (isShort logic) |
| Weekend lighter days | Task 3 (distributeTasks) |
| Routine preview with phase labels | Task 4 Step 6, Task 5 Step 6 |
| WhatsApp share | Task 5 Step 6 |
| Lead capture (phone, school, roll, device) | Task 5 Step 7 |
| PDF with student name | Task 7 |
| SMS delivery | Task 6 Step 3-4 |
| CSV import | Task 2 |
| Database migrations | Task 1 Step 7 |
| Analytics logging (chapter weakness data) | Task 6 Step 4 (JSONB assessment saved) |
| Figma designs | Task 8 |
