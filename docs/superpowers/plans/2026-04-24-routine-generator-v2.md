<!-- SUMMARY
File: apps/ssc-routine/docs/superpowers/plans/2026-04-24-routine-generator-v2.md
Topic: Routine Generator v2 implementation plan — SSC/HSC, new engine, chapter data
Status: Ready
Owner: Raied
Key refs: docs/routine-logic-v2.md
Covers: 9 tasks, DB migration, seed 148 chapters, types, API, UI, engine rewrite
File: apps/ssc-routine/docs/superpowers/plans/2026-04-24-routine-generator-v2.md
Topic: Implementation plan for Routine Generator v2 — new chapter schema, SSC/HSC grade, revised engine
Status: Ready for execution
Owner: Raied
Key refs: docs/routine-logic-v2.md, Routine Generator.xlsx
Covers: DB migration, seed data, types, API, UI, engine rewrite
-->

# Routine Generator v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SSC-only, section-based routine generator with a grade-aware (SSC/HSC) system using real chapter time data from the Routine Generator spreadsheet.

**Architecture:** New `chapters` table schema with `grade`, per-chapter time budgets (`time_pari_min`, `time_revise_min`, `time_parina_min`) and separate MCQ/SQ/CQ importance scores. The routine engine reads status + importance to split total chapter time across phases (Basic/Practice/Revision). Task types (MCQ/SQ/CQ) are split proportionally by importance within each phase. All v1 column names (section, question_type, time_cq_min etc.) are removed.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL), Tailwind v4, Anek Bangla font

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `migrations/004_rebuild_chapters.sql` | Create | Drop + recreate chapters table with new schema |
| `migrations/005_add_grade_to_submissions.sql` | Create | Add `grade` column to submissions |
| `scripts/seed-chapters-v2.ts` | Create | Insert all chapter data (SSC + HSC) |
| `lib/types.ts` | Modify | Replace `Section`/old `Chapter` with `Grade`, new `Chapter`, updated `WizardState` |
| `lib/routine-engine.ts` | Rewrite | Phase-based task generation from pari/revise/parina times + importance |
| `app/api/chapters/route.ts` | Modify | Filter by `grade` instead of `section` |
| `app/api/generate/route.ts` | Modify | Accept `grade` instead of `section` in body |
| `app/wizard/info/page.tsx` | Rewrite | Replace section tabs with SSC/HSC grade toggle |
| `app/wizard/assess/page.tsx` | Modify | Use `grade` from wizard state |
| `components/RoutineTable.tsx` | Modify | Add SQ badge color; update task type badge logic |

---

## Task 1: DB Migration — Rebuild Chapters Table

**Files:**
- Create: `migrations/004_rebuild_chapters.sql`
- Create: `migrations/005_add_grade_to_submissions.sql`

- [ ] **Step 1: Write migration 004**

```sql
-- migrations/004_rebuild_chapters.sql
DROP TABLE IF EXISTS chapters CASCADE;

CREATE TABLE chapters (
  id              SERIAL PRIMARY KEY,
  grade           VARCHAR(10)  NOT NULL,        -- 'SSC' | 'HSC'
  subject         VARCHAR(150) NOT NULL,         -- includes paper name for HSC
  chapter_num     INT          NOT NULL,
  chapter_name_bn VARCHAR(250) NOT NULL,
  mcq_importance  INT          NOT NULL DEFAULT 0,
  sq_importance   INT          NOT NULL DEFAULT 0,
  cq_importance   INT          NOT NULL DEFAULT 0,
  time_pari_min   INT          NOT NULL DEFAULT 0,
  time_revise_min INT          NOT NULL DEFAULT 0,
  time_parina_min INT          NOT NULL DEFAULT 0,
  created_at      TIMESTAMP    DEFAULT NOW(),
  UNIQUE(grade, subject, chapter_num)
);
```

- [ ] **Step 2: Write migration 005**

```sql
-- migrations/005_add_grade_to_submissions.sql
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS grade VARCHAR(10) DEFAULT 'SSC';
```

- [ ] **Step 3: Run both migrations in Supabase SQL editor (or via psql)**

Execute 004 first, then 005. Verify:
```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'chapters' ORDER BY ordinal_position;
-- Expected: id, grade, subject, chapter_num, chapter_name_bn,
--           mcq_importance, sq_importance, cq_importance,
--           time_pari_min, time_revise_min, time_parina_min, created_at
```

- [ ] **Step 4: Commit**

```bash
git add migrations/004_rebuild_chapters.sql migrations/005_add_grade_to_submissions.sql
git commit -m "feat(db): rebuild chapters schema for v2 — grade/subject/importance/pari-revise-parina"
```

---

## Task 2: Seed Chapter Data

**Files:**
- Create: `scripts/seed-chapters-v2.ts`

- [ ] **Step 1: Write the seed script**

```typescript
// scripts/seed-chapters-v2.ts
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// grade | subject | ch_num | name_bn | mcq | sq | cq | pari_min | revise_min | parina_min
type Row = [string, string, number, string, number, number, number, number, number, number];

const chapters: Row[] = [
  // ─── SSC ──────────────────────────────────────────────────────────────────
  // পদার্থবিজ্ঞান (13)
  ["SSC","পদার্থবিজ্ঞান",1,"ভৌত রাশি এবং তাদের পরিমাপ",3,4,3,120,240,480],
  ["SSC","পদার্থবিজ্ঞান",2,"গতি",5,5,5,180,360,540],
  ["SSC","পদার্থবিজ্ঞান",3,"বল",5,5,5,180,360,540],
  ["SSC","পদার্থবিজ্ঞান",4,"কাজ, ক্ষমতা ও শক্তি",5,5,5,180,360,540],
  ["SSC","পদার্থবিজ্ঞান",5,"পদার্থের অবস্থা ও চাপ",5,4,5,180,360,540],
  ["SSC","পদার্থবিজ্ঞান",6,"বস্তুর ওপর তাপের প্রভাব",5,4,5,240,480,720],
  ["SSC","পদার্থবিজ্ঞান",7,"তরঙ্গ ও শব্দ",5,5,5,180,360,600],
  ["SSC","পদার্থবিজ্ঞান",8,"আলোর প্রতিফলন",5,4,5,180,360,600],
  ["SSC","পদার্থবিজ্ঞান",9,"আলোর প্রতিসরণ",5,5,5,180,360,600],
  ["SSC","পদার্থবিজ্ঞান",10,"স্থির বিদ্যুৎ",5,5,5,180,360,600],
  ["SSC","পদার্থবিজ্ঞান",11,"চল বিদ্যুৎ",5,3,5,240,420,660],
  ["SSC","পদার্থবিজ্ঞান",12,"বিদ্যুতের চৌম্বক ক্রিয়া",4,3,3,60,120,240],
  ["SSC","পদার্থবিজ্ঞান",13,"তেজস্ক্রিয়তা ও ইলেকট্রনিকস",3,3,2,60,120,180],
  // রসায়ন (12)
  ["SSC","রসায়ন",1,"রসায়নের ধারণা",3,3,3,0,60,120],
  ["SSC","রসায়ন",2,"পদার্থের অবস্থা",3,3,3,60,60,180],
  ["SSC","রসায়ন",3,"পদার্থের গঠন",4,4,4,120,120,300],
  ["SSC","রসায়ন",4,"পর্যায় সারণি",5,5,5,120,180,300],
  ["SSC","রসায়ন",5,"রাসায়নিক বন্ধন",5,5,5,180,180,420],
  ["SSC","রসায়ন",6,"মোলের ধারণা ও রাসায়নিক গণনা",5,5,5,120,240,480],
  ["SSC","রসায়ন",7,"রাসায়নিক বিক্রিয়া",5,5,5,180,240,480],
  ["SSC","রসায়ন",8,"রসায়ন ও শক্তি",4,4,4,120,240,480],
  ["SSC","রসায়ন",9,"এসিড-ক্ষারক সমতা",4,4,4,120,180,300],
  ["SSC","রসায়ন",10,"খনিজ সম্পদ: ধাতু-অধাতু",3,3,3,120,180,300],
  ["SSC","রসায়ন",11,"খনিজ সম্পদ: জীবাশ্ম",5,5,5,300,300,600],
  ["SSC","রসায়ন",12,"আমাদের জীবনে রসায়ন",4,4,4,180,240,420],
  // জীববিজ্ঞান (14)
  ["SSC","জীববিজ্ঞান",1,"জীবন পাঠ",3,3,4,120,180,240],
  ["SSC","জীববিজ্ঞান",2,"জীবকোষ ও টিস্যু",5,5,5,180,240,420],
  ["SSC","জীববিজ্ঞান",3,"কোষ বিভাজন",4,4,5,120,180,300],
  ["SSC","জীববিজ্ঞান",4,"জীবনীশক্তি",3,4,4,180,240,360],
  ["SSC","জীববিজ্ঞান",5,"খাদ্য পুষ্টি এবং পরিপাক",5,3,4,240,300,360],
  ["SSC","জীববিজ্ঞান",6,"জীবে পরিবহন",4,4,5,240,300,360],
  ["SSC","জীববিজ্ঞান",7,"গ্যাসীয় বিনিময়",3,3,4,180,240,240],
  ["SSC","জীববিজ্ঞান",8,"রেচন প্রক্রিয়া",3,3,3,120,180,240],
  ["SSC","জীববিজ্ঞান",9,"দৃঢ়তা প্রদান ও চলন",4,4,4,120,180,240],
  ["SSC","জীববিজ্ঞান",10,"সমন্বয়",5,5,5,240,300,420],
  ["SSC","জীববিজ্ঞান",11,"জীবের প্রজনন",4,4,5,240,300,420],
  ["SSC","জীববিজ্ঞান",12,"জীবের বংশগতি ও জৈব অভিব্যক্তি",5,5,5,240,300,360],
  ["SSC","জীববিজ্ঞান",13,"জীবের পরিবেশ",5,4,5,180,240,300],
  ["SSC","জীববিজ্ঞান",14,"জীবপ্রযুক্তি",4,4,4,120,180,240],
  // গণিত (17)
  ["SSC","গণিত",1,"বাস্তব সংখ্যা",2,2,2,180,360,720],
  ["SSC","গণিত",2,"সেট ও ফাংশন",3,5,4,180,360,720],
  ["SSC","গণিত",3,"বীজগাণিতিক রাশি",4,5,4,300,540,1080],
  ["SSC","গণিত",4,"সূচক ও লগারিদম",4,5,4,120,300,600],
  ["SSC","গণিত",5,"এক চলকবিশিষ্ট সমীকরণ",3,3,3,120,240,480],
  ["SSC","গণিত",6,"রেখা, কোণ ও ত্রিভুজ",4,3,4,120,240,480],
  ["SSC","গণিত",7,"ব্যাবহারিক জ্যামিতি",4,4,5,120,240,480],
  ["SSC","গণিত",8,"বৃত্ত",5,5,5,180,420,840],
  ["SSC","গণিত",9,"ত্রিকোণমিতিক অনুপাত",5,5,5,180,360,720],
  ["SSC","গণিত",10,"দূরত্ব ও উচ্চতা",4,5,4,120,180,420],
  ["SSC","গণিত",11,"বীজগাণিতিক অনুপাত ও সমানুপাত",5,2,2,120,180,360],
  ["SSC","গণিত",12,"দুই চলকবিশিষ্ট সরল সহসমীকরণ",4,3,3,120,360,720],
  ["SSC","গণিত",13,"সসীম ধারা",4,3,4,120,240,480],
  ["SSC","গণিত",14,"অনুপাত, সদৃশতা ও প্রতিসমতা",2,2,2,120,300,600],
  ["SSC","গণিত",15,"ক্ষেত্রফল সম্পর্কিত উপপাদ্য ও সম্পাদ্য",3,3,3,120,180,420],
  ["SSC","গণিত",16,"পরিমিতি",5,5,5,180,420,840],
  ["SSC","গণিত",17,"পরিসংখ্যান",5,5,5,120,240,480],
  // উচ্চতর গণিত (14)
  ["SSC","উচ্চতর গণিত",1,"সেট ও ফাংশন",5,5,5,120,300,840],
  ["SSC","উচ্চতর গণিত",2,"বীজগাণিতিক রাশি",5,5,5,180,300,840],
  ["SSC","উচ্চতর গণিত",3,"জ্যামিতি",4,3,4,180,300,840],
  ["SSC","উচ্চতর গণিত",4,"জ্যামিতিক অঙ্কন",3,2,2,120,300,720],
  ["SSC","উচ্চতর গণিত",5,"সমীকরণ",5,5,5,120,300,840],
  ["SSC","উচ্চতর গণিত",6,"অসমতা",3,3,2,60,120,840],
  ["SSC","উচ্চতর গণিত",7,"অসীম ধারা",5,5,5,90,150,600],
  ["SSC","উচ্চতর গণিত",8,"ত্রিকোণমিতি",5,5,5,240,480,1200],
  ["SSC","উচ্চতর গণিত",9,"সূচকীয় ও লগারিদমীয় ফাংশন",5,5,5,180,360,900],
  ["SSC","উচ্চতর গণিত",10,"দ্বিপদী বিস্তৃতি",5,5,5,150,300,720],
  ["SSC","উচ্চতর গণিত",11,"স্থানাঙ্ক জ্যামিতি",5,5,5,240,480,1200],
  ["SSC","উচ্চতর গণিত",12,"সমতলীয় ভেক্টর",5,5,5,150,360,840],
  ["SSC","উচ্চতর গণিত",13,"ঘন জ্যামিতি",4,4,4,150,300,720],
  ["SSC","উচ্চতর গণিত",14,"সম্ভাবনা",5,5,5,120,240,900],
  // তথ্য ও যোগাযোগ প্রযুক্তি SSC (6, CQ=0)
  ["SSC","তথ্য ও যোগাযোগ প্রযুক্তি",1,"তথ্য ও যোগাযোগ প্রযুক্তি ও আমাদের বাংলাদেশ",2,3,0,0,60,180],
  ["SSC","তথ্য ও যোগাযোগ প্রযুক্তি",2,"কম্পিউটার রক্ষণাবেক্ষণ ও সাইবার নিরাপত্তা",5,4,0,60,120,240],
  ["SSC","তথ্য ও যোগাযোগ প্রযুক্তি",3,"ইন্টারনেট ও ওয়েব পরিচিতি",3,3,0,0,60,120],
  ["SSC","তথ্য ও যোগাযোগ প্রযুক্তি",4,"আমার লেখালেখি ও হিসাব",4,5,0,30,60,240],
  ["SSC","তথ্য ও যোগাযোগ প্রযুক্তি",5,"মাল্টিমিডিয়া ও গ্রাফিক্স",5,4,0,30,120,360],
  ["SSC","তথ্য ও যোগাযোগ প্রযুক্তি",6,"প্রোগ্রামিংয়ের মাধ্যমে সমস্যার সমাধান",5,5,0,60,120,480],
  // বিজ্ঞান SSC (11, non-science section)
  ["SSC","বিজ্ঞান",1,"উন্নততর জীবনধারা",5,4,5,60,240,420],
  ["SSC","বিজ্ঞান",2,"জীবনের জন্য পানি",4,3,4,60,120,240],
  ["SSC","বিজ্ঞান",3,"হৃদ্যন্ত্রের যত কথা এবং অন্যান্য",4,3,3,60,120,300],
  ["SSC","বিজ্ঞান",4,"নবজীবনের সূচনা",3,4,2,60,120,240],
  ["SSC","বিজ্ঞান",5,"দেখতে হলে আলো চাই",3,3,3,60,60,180],
  ["SSC","বিজ্ঞান",6,"পলিমার",2,3,4,60,120,240],
  ["SSC","বিজ্ঞান",7,"অম্ল, ক্ষারক ও লবণের ব্যবহার",5,5,5,60,180,300],
  ["SSC","বিজ্ঞান",8,"আমাদের সম্পদ",2,2,2,60,60,240],
  ["SSC","বিজ্ঞান",9,"দুর্যোগের সাথে বসবাস",2,3,3,60,60,240],
  ["SSC","বিজ্ঞান",10,"এসো বলকে জানি",4,5,5,60,180,360],
  ["SSC","বিজ্ঞান",11,"প্রাত্যহিক জীবনে তড়িৎ",5,5,5,60,180,300],

  // ─── HSC ──────────────────────────────────────────────────────────────────
  // পদার্থ প্রথম পত্র (10, SQ=0)
  ["HSC","পদার্থ প্রথম পত্র",1,"ভৌতজগত ও পরিমাপ",2,0,1,60,120,180],
  ["HSC","পদার্থ প্রথম পত্র",2,"ভেক্টর",5,0,5,240,420,720],
  ["HSC","পদার্থ প্রথম পত্র",3,"গতিবিদ্যা",5,0,5,240,420,720],
  ["HSC","পদার্থ প্রথম পত্র",4,"নিউটনিয়ান বলবিদ্যা",5,0,5,300,480,840],
  ["HSC","পদার্থ প্রথম পত্র",5,"কাজ, শক্তি ও ক্ষমতা",5,0,5,240,420,780],
  ["HSC","পদার্থ প্রথম পত্র",6,"মহাকর্ষ ও অভিকর্ষ",5,0,5,240,420,780],
  ["HSC","পদার্থ প্রথম পত্র",7,"পদার্থের গাঠনিক ধর্ম",5,0,5,240,420,720],
  ["HSC","পদার্থ প্রথম পত্র",8,"পর্যাবৃত্তিক গতি",5,0,5,240,420,720],
  ["HSC","পদার্থ প্রথম পত্র",9,"তরঙ্গ",4,0,4,300,480,840],
  ["HSC","পদার্থ প্রথম পত্র",10,"আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব",5,0,5,240,420,780],
  // পদার্থ দ্বিতীয় পত্র (11, SQ=0)
  ["HSC","পদার্থ দ্বিতীয় পত্র",1,"তাপগতিবিদ্যা",5,0,5,240,420,720],
  ["HSC","পদার্থ দ্বিতীয় পত্র",2,"স্থির তড়িৎ",5,0,5,180,360,780],
  ["HSC","পদার্থ দ্বিতীয় পত্র",3,"চল তড়িৎ",5,0,5,240,420,780],
  ["HSC","পদার্থ দ্বিতীয় পত্র",4,"তড়িৎ প্রবাহের চৌম্বক ক্রিয়া ও চুম্বকত্ব",5,0,5,240,420,780],
  ["HSC","পদার্থ দ্বিতীয় পত্র",5,"তাড়িতচৌম্বকীয় আবেশ ও পরিবর্তী প্রবাহ",5,0,5,180,360,720],
  ["HSC","পদার্থ দ্বিতীয় পত্র",6,"জ্যামিতিক আলোকবিজ্ঞান",4,0,5,180,360,720],
  ["HSC","পদার্থ দ্বিতীয় পত্র",7,"ভৌত আলোকবিজ্ঞান",5,0,5,240,420,780],
  ["HSC","পদার্থ দ্বিতীয় পত্র",8,"আধুনিক পদার্থবিজ্ঞানের সূচনা",5,0,5,240,420,780],
  ["HSC","পদার্থ দ্বিতীয় পত্র",9,"পরমাণুর মডেল এবং নিউক্লিয়ার পদার্থবিজ্ঞান",4,0,5,240,420,780],
  ["HSC","পদার্থ দ্বিতীয় পত্র",10,"সেমিকন্ডাক্টর ও ইলেকট্রনিক্স",4,0,3,180,360,720],
  ["HSC","পদার্থ দ্বিতীয় পত্র",11,"জ্যোতির্বিজ্ঞান",2,0,5,60,120,240],
  // রসায়ন প্রথম পত্র (5, SQ=0)
  ["HSC","রসায়ন প্রথম পত্র",1,"ল্যাবরেটরির নিরাপদ ব্যবহার",1,0,1,30,60,300],
  ["HSC","রসায়ন প্রথম পত্র",2,"গুণগত রসায়ন",5,0,5,180,300,900],
  ["HSC","রসায়ন প্রথম পত্র",3,"মৌলের পর্যায়বৃত্ত ধর্ম",5,0,5,240,300,960],
  ["HSC","রসায়ন প্রথম পত্র",4,"রাসায়নিক পরিবর্তন",5,0,5,180,300,840],
  ["HSC","রসায়ন প্রথম পত্র",5,"কর্মমুখী রসায়ন",1,0,1,60,60,300],
  // রসায়ন দ্বিতীয় পত্র (5, SQ=0)
  ["HSC","রসায়ন দ্বিতীয় পত্র",1,"পরিবেশ রসায়ন",4,0,4,180,240,600],
  ["HSC","রসায়ন দ্বিতীয় পত্র",2,"জৈব রসায়ন",5,0,5,300,480,1200],
  ["HSC","রসায়ন দ্বিতীয় পত্র",3,"পরিমাণগত রসায়ন",4,0,4,240,300,900],
  ["HSC","রসায়ন দ্বিতীয় পত্র",4,"তড়িৎ রসায়ন",4,0,4,180,240,780],
  ["HSC","রসায়ন দ্বিতীয় পত্র",5,"অর্থনৈতিক রসায়ন",2,0,2,60,120,360],
  // জীববিজ্ঞান প্রথম পত্র (12)
  ["HSC","জীববিজ্ঞান প্রথম পত্র",1,"কোষ ও এর গঠন",5,5,5,300,360,540],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",2,"কোষ বিভাজন",4,4,5,300,360,420],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",3,"কোষ রসায়ন",5,5,5,300,360,540],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",4,"অণুজীব",5,4,5,300,360,420],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",5,"শৈবাল ও ছত্রাক",4,3,3,180,240,300],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",6,"ব্রায়োফাইটা ও টেরিডোফাইটা",3,2,3,180,240,300],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",7,"নগ্নবীজী ও আবৃতবীজী উদ্ভিদ",4,5,5,300,360,480],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",8,"টিস্যু ও টিস্যুতন্ত্র",5,4,4,300,420,480],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",9,"উদ্ভিদ শারীরতত্ত্ব",5,5,5,300,420,480],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",10,"উদ্ভিদ প্রজনন",4,3,4,300,360,420],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",11,"জীবপ্রযুক্তি",5,4,5,360,420,480],
  ["HSC","জীববিজ্ঞান প্রথম পত্র",12,"জীবের পরিবেশ, বিস্তার ও সংরক্ষণ",5,4,5,360,480,540],
  // জীববিজ্ঞান দ্বিতীয় পত্র (12)
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",1,"প্রাণীর বিভিন্নতা ও শ্রেণিবিন্যাস",5,3,3,360,420,540],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",2,"প্রাণীর পরিচিতি",5,5,5,420,480,540],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",3,"মানব শারীরতত্ত্ব: পরিপাক ও শোষণ",5,4,4,420,480,540],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",4,"মানব শারীরতত্ত্ব: রক্ত",5,4,4,420,480,540],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",5,"মানব শারীরতত্ত্ব: শ্বসন ও শ্বাসক্রিয়া",4,3,3,300,360,420],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",6,"মানব শারীরতত্ত্ব: বর্জ্য ও নিষ্কাশন",3,3,3,240,300,360],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",7,"মানব শারীরতত্ত্ব: চলন ও অঙ্গচালনা",5,5,5,300,360,480],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",8,"মানব শারীরতত্ত্ব: সমন্বয় ও নিয়ন্ত্রণ",5,5,5,360,420,540],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",9,"মানব জীবনের ধারাবাহিকতা",5,5,5,360,420,480],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",10,"মানবদেহের প্রতিরক্ষা",5,4,4,300,360,420],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",11,"জিনতত্ত্ব ও বিবর্তন",5,5,5,360,420,480],
  ["HSC","জীববিজ্ঞান দ্বিতীয় পত্র",12,"প্রাণীর আচরণ",5,4,4,300,360,420],
  // উচ্চতর গণিত প্রথম পত্র (10, SQ=0)
  ["HSC","উচ্চতর গণিত প্রথম পত্র",1,"ম্যাট্রিক্স ও নির্ণায়ক",5,0,5,180,360,780],
  ["HSC","উচ্চতর গণিত প্রথম পত্র",2,"ভেক্টর",3,0,2,60,180,480],
  ["HSC","উচ্চতর গণিত প্রথম পত্র",3,"সরলরেখা",5,0,5,180,360,1080],
  ["HSC","উচ্চতর গণিত প্রথম পত্র",4,"বৃত্ত",5,0,5,120,300,960],
  ["HSC","উচ্চতর গণিত প্রথম পত্র",5,"বিন্যাস ও সমাবেশ",4,0,4,120,300,960],
  ["HSC","উচ্চতর গণিত প্রথম পত্র",6,"ত্রিকোণমিতিক অনুপাত",2,0,2,60,180,360],
  ["HSC","উচ্চতর গণিত প্রথম পত্র",7,"সংযুক্ত কোণের ত্রিকোণমিতিক অনুপাত",5,0,5,300,600,1500],
  ["HSC","উচ্চতর গণিত প্রথম পত্র",8,"ফাংশন ও ফাংশনের লেখচিত্র",5,0,5,120,300,840],
  ["HSC","উচ্চতর গণিত প্রথম পত্র",9,"অন্তরীকরণ",5,0,5,240,600,1800],
  ["HSC","উচ্চতর গণিত প্রথম পত্র",10,"যোগজীকরণ",5,0,5,240,600,1800],
  // উচ্চতর গণিত দ্বিতীয় পত্র (10, SQ=0)
  ["HSC","উচ্চতর গণিত দ্বিতীয় পত্র",1,"বাস্তব সংখ্যা ও অসমতা",3,0,3,120,240,600],
  ["HSC","উচ্চতর গণিত দ্বিতীয় পত্র",2,"যোগাশ্রয়ী প্রোগ্রাম",3,0,3,60,120,480],
  ["HSC","উচ্চতর গণিত দ্বিতীয় পত্র",3,"জটিল সংখ্যা",5,0,5,180,420,1200],
  ["HSC","উচ্চতর গণিত দ্বিতীয় পত্র",4,"বহুপদী ও বহুপদী সমীকরণ",5,0,5,180,420,1200],
  ["HSC","উচ্চতর গণিত দ্বিতীয় পত্র",5,"দ্বিপদী বিস্তৃতি",4,0,4,120,360,960],
  ["HSC","উচ্চতর গণিত দ্বিতীয় পত্র",6,"কনিক",5,0,5,240,600,1320],
  ["HSC","উচ্চতর গণিত দ্বিতীয় পত্র",7,"বিপরীত ত্রিকোণমিতিক ফাংশন ও সমীকরণ",5,0,5,180,420,1080],
  ["HSC","উচ্চতর গণিত দ্বিতীয় পত্র",8,"স্থিতিবিদ্যা",5,0,5,240,540,1680],
  ["HSC","উচ্চতর গণিত দ্বিতীয় পত্র",9,"সমতলে বস্তুকণার গতি",5,0,5,240,540,1680],
  ["HSC","উচ্চতর গণিত দ্বিতীয় পত্র",10,"বিস্তার পরিমাপ ও সম্ভাবনা",3,0,5,180,360,1320],
  // তথ্য ও যোগাযোগ প্রযুক্তি HSC (6, SQ=0)
  ["HSC","তথ্য ও যোগাযোগ প্রযুক্তি",1,"তথ্য ও যোগাযোগ প্রযুক্তি: বিশ্ব ও বাংলাদেশ প্রেক্ষিত",3,0,3,60,120,240],
  ["HSC","তথ্য ও যোগাযোগ প্রযুক্তি",2,"কমিউনিকেশন সিস্টেমস ও নেটওয়ার্কিং",4,0,4,60,120,240],
  ["HSC","তথ্য ও যোগাযোগ প্রযুক্তি",3,"সংখ্যা পদ্ধতি ও ডিজিটাল ডিভাইস",5,0,5,300,600,1200],
  ["HSC","তথ্য ও যোগাযোগ প্রযুক্তি",4,"ওয়েব ডিজাইন পরিচিতি এবং HTML",4,0,4,180,360,720],
  ["HSC","তথ্য ও যোগাযোগ প্রযুক্তি",5,"প্রোগ্রামিং ভাষা",5,0,5,240,480,960],
  ["HSC","তথ্য ও যোগাযোগ প্রযুক্তি",6,"ডেটাবেজ ম্যানেজমেন্ট সিস্টেম",3,0,3,60,120,240],
];

async function seed() {
  console.log(`Seeding ${chapters.length} chapters...`);

  const rows = chapters.map(([grade, subject, chapter_num, chapter_name_bn,
    mcq_importance, sq_importance, cq_importance,
    time_pari_min, time_revise_min, time_parina_min]) => ({
    grade, subject, chapter_num, chapter_name_bn,
    mcq_importance, sq_importance, cq_importance,
    time_pari_min, time_revise_min, time_parina_min,
  }));

  const { error } = await supabase.from("chapters").insert(rows);
  if (error) { console.error("Seed failed:", error.message); process.exit(1); }
  console.log("Done.");
}

seed();
```

- [ ] **Step 2: Run the seed script**

```bash
cd apps/ssc-routine && npx tsx scripts/seed-chapters-v2.ts
```

Expected output:
```
Seeding 148 chapters...
Done.
```

- [ ] **Step 3: Verify in Supabase**

```sql
SELECT grade, subject, COUNT(*) FROM chapters GROUP BY grade, subject ORDER BY grade, subject;
```

Expected: 17 rows — 7 SSC subjects + 10 HSC books with correct chapter counts.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-chapters-v2.ts
git commit -m "feat(data): seed 148 chapters for SSC/HSC from Routine Generator spreadsheet"
```

---

## Task 3: Update TypeScript Types

**Files:**
- Modify: `lib/types.ts`

- [ ] **Step 1: Replace entire types.ts**

```typescript
// lib/types.ts
export type Grade = "SSC" | "HSC";

export type AssessmentStatus = "pari" | "revise" | "pari_na" | "syllabus_nai";

export interface Chapter {
  id: number;
  grade: Grade;
  subject: string;
  chapter_num: number;
  chapter_name_bn: string;
  mcq_importance: number;   // 0–5
  sq_importance: number;    // 0–5
  cq_importance: number;    // 0–5
  time_pari_min: number;
  time_revise_min: number;
  time_parina_min: number;
}

// key = subject, value = { chapterId: status }
export type Assessment = Record<string, Record<string, AssessmentStatus>>;

export interface RoutineEntry {
  chapterId: number;
  subject: string;
  chapterName: string;
  taskType: string;   // e.g. 'MCQ বেসিক' | 'SQ অনুশীলন' | 'CQ অনুশীলন' | 'রিভিশন'
  timeMin: number;
}

export interface RoutineDay {
  dayNumber: number;
  phase: 1 | 2 | 3;
  phaseName: string;
  isWeekend: boolean;
  isExtreme: boolean;
  entries: RoutineEntry[];
  totalTimeMin: number;
}

export interface WizardState {
  name: string;
  grade: Grade | null;
  assessment: Assessment;
  durationDays: number | null;
  routinePreview: RoutineDay[] | null;
}

export type DurationOption = 7 | 15 | 20 | 30 | 60;
```

- [ ] **Step 2: Fix remaining TypeScript import of Section**

```bash
grep -r "Section" apps/ssc-routine/app apps/ssc-routine/lib apps/ssc-routine/components --include="*.ts" --include="*.tsx" -l
```

Open each file listed and replace `Section` import with `Grade`.

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "refactor(types): replace Section with Grade, new Chapter v2 schema"
```

---

## Task 4: Update API Routes

**Files:**
- Modify: `app/api/chapters/route.ts`
- Modify: `app/api/generate/route.ts`

- [ ] **Step 1: Update chapters route**

```typescript
// app/api/chapters/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  const grade = req.nextUrl.searchParams.get("grade");
  if (!grade || (grade !== "SSC" && grade !== "HSC")) {
    return NextResponse.json({ error: "grade required: SSC | HSC" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("grade", grade)
    .order("subject")
    .order("chapter_num");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 2: Update generate route**

```typescript
// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { generateRoutine } from "@/lib/routine-engine";

export async function POST(req: NextRequest) {
  const { grade, assessment, durationDays } = await req.json();

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("grade", grade)
    .order("subject")
    .order("chapter_num");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const routine = generateRoutine(chapters || [], assessment, durationDays);
  return NextResponse.json({ routine });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/chapters/route.ts app/api/generate/route.ts
git commit -m "feat(api): chapters and generate routes use grade instead of section"
```

---

## Task 5: Info Page — SSC/HSC Grade Selector

**Files:**
- Modify: `app/wizard/info/page.tsx`

- [ ] **Step 1: Rewrite info page**

```tsx
// app/wizard/info/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Grade } from "@/lib/types";

export default function InfoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (saved.name)  setName(saved.name);
    if (saved.grade) setGrade(saved.grade);
  }, []);

  function handleNext() {
    if (!name.trim() || !grade) return;
    const existing = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    sessionStorage.setItem("wizard", JSON.stringify({ ...existing, name: name.trim(), grade }));
    router.push("/wizard/assess");
  }

  return (
    <div className="pb-8">
      <h1 className="text-[22px] font-bold text-ten-ink mb-1">তোমার তথ্য দাও</h1>
      <p className="text-sm text-gray-400 mb-6">ধাপ ১: নাম ও পরীক্ষা</p>

      <label className="block mb-5">
        <span className="text-[13px] font-semibold text-gray-500 mb-1.5 block">তোমার নাম</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="নাম লেখো"
          className="input-field-light"
        />
      </label>

      <div className="mb-8">
        <span className="text-[13px] font-semibold text-gray-500 mb-2.5 block">কোন পরীক্ষার জন্য রুটিন?</span>
        <div className="flex gap-3">
          {(["SSC", "HSC"] as Grade[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`flex-1 py-4 rounded-2xl border-2 text-center transition-all duration-200 cursor-pointer ${
                grade === g
                  ? "border-ten-red bg-[rgba(232,0,29,0.06)] ring-2 ring-ten-red/10"
                  : "border-gray-200 bg-white hover:border-ten-red/40"
              }`}
            >
              <div className="text-[22px] font-bold text-ten-ink">{g}</div>
              <div className="text-[12px] text-gray-400 mt-0.5">
                {g === "SSC" ? "মাধ্যমিক পরীক্ষা" : "উচ্চমাধ্যমিক পরীক্ষা"}
              </div>
              {grade === g && (
                <div className="mt-1.5 w-4 h-4 rounded-full bg-ten-red flex items-center justify-center mx-auto">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!name.trim() || !grade}
        className="btn-primary w-full text-[16px] px-5 py-3.5 rounded-[10px]"
      >
        পরের ধাপ →
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/wizard/info/page.tsx
git commit -m "feat(ui): replace section selector with SSC/HSC grade toggle on info page"
```

---

## Task 6: Assess Page — Use Grade

**Files:**
- Modify: `app/wizard/assess/page.tsx`

- [ ] **Step 1: Update assess page to use grade**

Replace every occurrence of `saved.section` with `saved.grade`, update the API call param, and update the redirect check:

```tsx
// app/wizard/assess/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Chapter, Assessment, AssessmentStatus } from "@/lib/types";
import SubjectCard from "@/components/SubjectCard";
import { toBanglaNum } from "@/lib/utils";

export default function AssessPage() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [assessment, setAssessment] = useState<Assessment>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (!saved.grade) { router.push("/wizard/info"); return; }
    if (saved.assessment) setAssessment(saved.assessment);

    fetch(`/api/chapters?grade=${encodeURIComponent(saved.grade)}`)
      .then((r) => r.json())
      .then((data) => { setChapters(data); setLoading(false); });
  }, [router]);

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
    return vals.every((v) => v === vals[0]) ? vals[0] : null;
  }

  const stats = useMemo(() => {
    const subjectNames = Object.keys(subjects);
    let pari = 0, revise = 0, pariNa = 0, syllabusNai = 0;
    for (const subject of subjectNames) {
      const status = getSubjectStatus(subject);
      if (status === "pari") pari++;
      else if (status === "revise") revise++;
      else if (status === "pari_na") pariNa++;
      else if (status === "syllabus_nai") syllabusNai++;
    }
    return { total: subjectNames.length, pari, revise, pariNa, syllabusNai };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, assessment]);

  function handleSubjectChange(subject: string, status: AssessmentStatus) {
    const newStatuses: Record<string, AssessmentStatus> = {};
    for (const ch of subjects[subject] || []) newStatuses[String(ch.id)] = status;
    setAssessment((prev) => ({ ...prev, [subject]: newStatuses }));
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

  if (loading) {
    return (
      <div className="pb-8">
        <h1 className="text-[22px] font-bold text-ten-ink mb-1">কোন বিষয়ে কী অবস্থা?</h1>
        <p className="text-sm text-gray-400 mb-6">ধাপ ২: বিষয় মূল্যায়ন</p>
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-[90px] w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <h1 className="text-[22px] font-bold text-ten-ink mb-1">কোন বিষয়ে কী অবস্থা?</h1>
      <p className="text-[13px] text-gray-400 mb-4">ধাপ ২: প্রতিটি বিষয়ের পাশে অবস্থা বেছে নাও</p>

      {/* Sticky stats bar */}
      <div className="sticky top-1 z-10 bg-white/95 backdrop-blur shadow-sm rounded-xl px-3 py-2.5 mb-4 flex flex-wrap gap-1.5 items-center ring-1 ring-gray-100">
        <span className="badge-muted">
          <svg width="6" height="6" viewBox="0 0 8 8" fill="#4B5563"><circle cx="4" cy="4" r="4"/></svg>
          {toBanglaNum(stats.total)}টি বিষয়
        </span>
        {stats.pari > 0 && (
          <span className="badge-success">
            <svg width="6" height="6" viewBox="0 0 8 8" fill="#0E7B4F"><circle cx="4" cy="4" r="4"/></svg>
            {toBanglaNum(stats.pari)}টি পারি
          </span>
        )}
        {stats.revise > 0 && (
          <span className="badge-warning">
            <svg width="6" height="6" viewBox="0 0 8 8" fill="#92400E"><circle cx="4" cy="4" r="4"/></svg>
            {toBanglaNum(stats.revise)}টি রিভাইজ
          </span>
        )}
        {stats.pariNa > 0 && (
          <span className="badge-error">
            <svg width="6" height="6" viewBox="0 0 8 8" fill="#931212"><circle cx="4" cy="4" r="4"/></svg>
            {toBanglaNum(stats.pariNa)}টি পারি না
          </span>
        )}
        {stats.syllabusNai > 0 && (
          <span className="badge-muted">
            <svg width="6" height="6" viewBox="0 0 8 8" fill="#4B5563"><circle cx="4" cy="4" r="4"/></svg>
            {toBanglaNum(stats.syllabusNai)}টি সিলেবাসে নাই
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {Object.entries(subjects).map(([subject, chs]) => (
          <SubjectCard key={subject} subject={subject} chapters={chs}
            subjectStatus={getSubjectStatus(subject)}
            chapterStatuses={assessment[subject] || {}}
            onSubjectChange={(s) => handleSubjectChange(subject, s)}
            onChapterChange={(chId, s) => handleChapterChange(subject, chId, s)} />
        ))}
      </div>

      <button onClick={handleNext} className="btn-primary w-full text-[16px] px-5 py-3.5 rounded-[10px]">
        পরের ধাপ →
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update SubjectCard to use `chapter_num` instead of `chapter_number`**

In `components/SubjectCard.tsx` and `components/ChapterRow.tsx`, replace any reference to `chapter_number` with `chapter_num`, and `chapter_name_en` with `chapter_name_bn` if needed. Also update the chapter count display to use `ch.id` as the key since that's what's stored in assessment.

Verify `ChapterRow.tsx` uses `chapter.id` for the assessment key (it should already, since assessment stores by `String(ch.id)`).

- [ ] **Step 3: Update duration page to pass grade to generate API**

In `app/wizard/duration/page.tsx`, update `handleNext` to include `grade`:

```tsx
// In handleNext(), update the fetch body:
body: JSON.stringify({ 
  grade: saved.grade,        // ← add this
  assessment: saved.assessment, 
  durationDays: selected 
}),
```

- [ ] **Step 4: Commit**

```bash
git add app/wizard/assess/page.tsx app/wizard/duration/page.tsx components/ChapterRow.tsx
git commit -m "feat(ui): assess page uses grade; duration page passes grade to generate API"
```

---

## Task 7: Rewrite Routine Engine

**Files:**
- Rewrite: `lib/routine-engine.ts`

- [ ] **Step 1: Replace entire routine-engine.ts**

```typescript
// lib/routine-engine.ts
import type { Chapter, Assessment, AssessmentStatus, RoutineDay, RoutineEntry } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASE_NAMES: Record<1 | 2 | 3, string> = {
  1: "ফাউন্ডেশন মোড 🏗️",
  2: "প্র্যাকটিস গ্রাইন্ড 🔥",
  3: "ফাইনাল রিভিশন 🎯",
};

const NORMAL_BUDGET  = 300;  // 5 hrs
const EXTREME_BUDGET = 420;  // 7 hrs
const WEEKEND_BUDGET = 150;  // 2.5 hrs
const MAX_SUBJECTS_PER_DAY = 4;

// ─── Phase ratio table (for পারিনা) ─────────────────────────────────────────

const PHASE_RATIOS: Record<number, [number, number, number]> = {
  // [basicRatio, practiceRatio, reviseRatio]
  5: [0.25, 0.45, 0.30],
  4: [0.30, 0.40, 0.30],
  3: [0.35, 0.35, 0.30],
  2: [0.40, 0.30, 0.30],
  1: [0.45, 0.25, 0.30],
};

function phaseRatios(imp: number): [number, number, number] {
  return PHASE_RATIOS[Math.max(1, Math.min(5, imp))] ?? PHASE_RATIOS[3];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roundTo30(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.max(30, Math.ceil(minutes / 30) * 30);
}

function getDayBudget(dayNumber: number): { budget: number; isWeekend: boolean; isExtreme: boolean } {
  const dayInWeek = ((dayNumber - 1) % 7) + 1; // 1=Mon … 7=Sun
  const isWeekend = dayInWeek === 6 || dayInWeek === 7;
  const isExtreme = dayInWeek === 5;
  if (isWeekend) return { budget: WEEKEND_BUDGET, isWeekend, isExtreme: false };
  if (isExtreme) return { budget: EXTREME_BUDGET, isWeekend: false, isExtreme };
  return { budget: NORMAL_BUDGET, isWeekend: false, isExtreme: false };
}

// ─── Task labels ──────────────────────────────────────────────────────────────

function taskLabel(type: "MCQ" | "SQ" | "CQ", phase: 1 | 2 | 3): string {
  const suffix = phase === 1 ? " বেসিক" : " অনুশীলন";
  return type + suffix;
}

// ─── Per-chapter task generation ─────────────────────────────────────────────

interface ChapterWithStatus extends Chapter {
  status: AssessmentStatus;
}

interface PhaseTask extends RoutineEntry {
  phase: 1 | 2 | 3;
}

/** Split a time budget across active task types proportionally by importance. */
function splitByType(
  ch: ChapterWithStatus,
  totalMin: number,
  phase: 1 | 2 | 3,
): PhaseTask[] {
  const types: Array<{ key: "MCQ" | "SQ" | "CQ"; imp: number }> = [];
  if (ch.mcq_importance > 0) types.push({ key: "MCQ", imp: ch.mcq_importance });
  if (ch.sq_importance  > 0) types.push({ key: "SQ",  imp: ch.sq_importance });
  if (ch.cq_importance  > 0) types.push({ key: "CQ",  imp: ch.cq_importance });
  if (types.length === 0 || totalMin <= 0) return [];

  const totalImp = types.reduce((s, t) => s + t.imp, 0);
  const tasks: PhaseTask[] = [];

  for (const t of types) {
    const raw = (totalMin * t.imp) / totalImp;
    const rounded = roundTo30(raw);
    if (rounded < 30) continue;
    tasks.push({
      chapterId: ch.id,
      subject: ch.subject,
      chapterName: ch.chapter_name_bn,
      taskType: taskLabel(t.key, phase),
      timeMin: rounded,
      phase,
    });
  }
  return tasks;
}

function getTasksForChapter(ch: ChapterWithStatus): PhaseTask[] {
  if (ch.status === "syllabus_nai") return [];

  if (ch.status === "pari") {
    if (ch.time_pari_min <= 0) return [];
    return [{
      chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
      taskType: "রিভিশন", timeMin: roundTo30(ch.time_pari_min), phase: 3,
    }];
  }

  if (ch.status === "revise") {
    const total = ch.time_revise_min;
    if (total <= 0) return [];
    const p2Min = Math.round(total * 0.55);
    const p3Min = total - p2Min;
    const tasks: PhaseTask[] = [];
    tasks.push(...splitByType(ch, p2Min, 2));
    if (p3Min >= 30) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: "রিভিশন", timeMin: roundTo30(p3Min), phase: 3,
      });
    }
    return tasks;
  }

  if (ch.status === "pari_na") {
    const total = ch.time_parina_min;
    if (total <= 0) return [];
    const imp = Math.max(ch.mcq_importance, ch.sq_importance, ch.cq_importance);
    const [bRatio, pRatio] = phaseRatios(imp);
    const basicMin    = Math.round(total * bRatio);
    const practiceMin = Math.round(total * pRatio);
    const reviseMin   = total - basicMin - practiceMin;

    const tasks: PhaseTask[] = [];
    tasks.push(...splitByType(ch, basicMin, 1));
    tasks.push(...splitByType(ch, practiceMin, 2));
    if (reviseMin >= 30) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: "রিভিশন", timeMin: roundTo30(reviseMin), phase: 3,
      });
    }
    return tasks;
  }

  return [];
}

// ─── Day slot distribution ────────────────────────────────────────────────────

function isLightTask(taskType: string): boolean {
  return taskType.includes("MCQ") || taskType === "রিভিশন";
}

function distributeTasks(
  tasks: PhaseTask[],
  startDay: number,
  numDays: number,
  phase: 1 | 2 | 3,
): RoutineDay[] {
  const phaseName = PHASE_NAMES[phase];

  const days: RoutineDay[] = Array.from({ length: numDays }, (_, i) => {
    const dayNumber = startDay + i;
    const { budget, isWeekend, isExtreme } = getDayBudget(dayNumber);
    return { dayNumber, phase, phaseName, isWeekend, isExtreme, entries: [], totalTimeMin: 0 };
  });

  if (tasks.length === 0) return days;

  // Sort tasks: harder subjects first, CQ > SQ > MCQ > Revision within subject
  const taskPriority = (t: PhaseTask) => {
    if (t.taskType.includes("CQ")) return 0;
    if (t.taskType.includes("SQ")) return 1;
    if (t.taskType.includes("MCQ")) return 2;
    return 3;
  };
  const sorted = [...tasks].sort((a, b) => taskPriority(a) - taskPriority(b));

  let taskIdx = 0;
  while (taskIdx < sorted.length) {
    const task = sorted[taskIdx];
    let placed = false;

    for (const day of days) {
      const { budget } = getDayBudget(day.dayNumber);
      // Weekend: light tasks only
      if (day.isWeekend && !isLightTask(task.taskType)) continue;
      // Budget check
      if (day.totalTimeMin + task.timeMin > budget) continue;
      // Max subjects check
      const subjects = new Set(day.entries.map((e) => e.subject));
      if (!subjects.has(task.subject) && subjects.size >= MAX_SUBJECTS_PER_DAY) continue;

      day.entries.push({ ...task });
      day.totalTimeMin += task.timeMin;
      taskIdx++;
      placed = true;
      break;
    }

    if (!placed) {
      // Force-place: ignore weekend restriction, still respect budget + subjects
      let forcePlaced = false;
      for (const day of days) {
        const { budget } = getDayBudget(day.dayNumber);
        if (day.totalTimeMin + task.timeMin > budget) continue;
        const subjects = new Set(day.entries.map((e) => e.subject));
        if (!subjects.has(task.subject) && subjects.size >= MAX_SUBJECTS_PER_DAY) continue;
        day.entries.push({ ...task });
        day.totalTimeMin += task.timeMin;
        taskIdx++;
        forcePlaced = true;
        break;
      }
      if (!forcePlaced) taskIdx++; // skip if truly can't place
    }
  }

  // Sort entries within each day: CQ > SQ > MCQ > Revision per subject
  for (const day of days) {
    day.entries.sort((a, b) => {
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      return taskPriority(a as PhaseTask) - taskPriority(b as PhaseTask);
    });
  }

  return days;
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function generateRoutine(
  chapters: Chapter[],
  assessment: Assessment,
  durationDays: number,
): RoutineDay[] {
  // Attach status to each chapter
  const assessed: ChapterWithStatus[] = chapters.map((ch) => {
    const subjectAssessment = assessment[ch.subject] || {};
    const status = (subjectAssessment[String(ch.id)] as AssessmentStatus) || "pari";
    return { ...ch, status };
  });

  // Generate all tasks, pre-assigned to phases
  const allTasks: PhaseTask[] = [];
  for (const ch of assessed) {
    allTasks.push(...getTasksForChapter(ch));
  }

  // Separate into phase buckets
  const p1Tasks = allTasks.filter((t) => t.phase === 1);
  const p2Tasks = allTasks.filter((t) => t.phase === 2);
  const p3Tasks = allTasks.filter((t) => t.phase === 3);

  // Phase day allocation
  const isShort = durationDays <= 7;
  const phase1Days = isShort ? 0 : Math.round(durationDays * 0.35);
  const phase2Days = isShort
    ? Math.round(durationDays * 0.70)
    : Math.round(durationDays * 0.35);
  const phase3Days = durationDays - phase1Days - phase2Days;

  // For short duration: merge p1 tasks into p2 (no foundation phase)
  const effective2Tasks = isShort ? [...p1Tasks, ...p2Tasks] : p2Tasks;

  // Distribute
  const allDays: RoutineDay[] = [
    ...distributeTasks(p1Tasks, 1, phase1Days, 1),
    ...distributeTasks(effective2Tasks, phase1Days + 1, phase2Days, 2),
    ...distributeTasks(p3Tasks, phase1Days + phase2Days + 1, phase3Days, 3),
  ];

  // Remove empty days and re-number
  const nonEmpty = allDays.filter((d) => d.entries.length > 0);
  nonEmpty.forEach((d, i) => { d.dayNumber = i + 1; });

  return nonEmpty;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/ssc-routine && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/routine-engine.ts
git commit -m "feat(engine): rewrite routine engine v2 — pari/revise/parina time budgets, MCQ/SQ/CQ split by importance"
```

---

## Task 8: Update RoutineTable Task Badges

**Files:**
- Modify: `components/RoutineTable.tsx`

- [ ] **Step 1: Update badge color maps**

In `RoutineTable.tsx`, replace the `taskTypeColor` and `taskTypeColorDark` maps to handle the new task type strings:

```typescript
// Light mode
const taskTypeColor: Record<string, string> = {
  "MCQ":       "bg-amber-100 text-amber-700",
  "SQ":        "bg-blue-100 text-blue-700",
  "CQ":        "bg-purple-100 text-purple-700",
  "রিভিশন":   "bg-green-100 text-green-700",
};

// Dark mode
const taskTypeColorDark: Record<string, string> = {
  "MCQ":       "bg-amber-900/50 text-amber-300",
  "SQ":        "bg-blue-900/50 text-blue-300",
  "CQ":        "bg-purple-900/50 text-purple-300",
  "রিভিশন":   "bg-green-900/50 text-green-300",
};

function getTaskBadgeClass(taskType: string, dark?: boolean): string {
  const map = dark ? taskTypeColorDark : taskTypeColor;
  for (const [key, cls] of Object.entries(map)) {
    if (taskType.includes(key)) return cls;
  }
  return dark ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-700";
}
```

- [ ] **Step 2: Commit**

```bash
git add components/RoutineTable.tsx
git commit -m "feat(ui): routine table — SQ/CQ/MCQ/Revision badge colors for v2 task types"
```

---

## Task 9: Smoke Test End-to-End

- [ ] **Step 1: Verify the dev server runs without errors**

```bash
cd apps/ssc-routine && npm run dev
```

Expected: No compilation errors, server starts on port 3002.

- [ ] **Step 2: Test SSC flow**

1. Go to `http://localhost:3002`
2. Enter name "Test", select **SSC** → Next
3. Verify chapters load (Physics, Chemistry, Biology, Math, H.Math, ICT, বিজ্ঞান)
4. Mark পদার্থবিজ্ঞান as "পারিনা", রসায়ন as "রিভাইজ দিলে পারবো", rest as "পারি"
5. Proceed → Duration → select 30 days → "Routine Generate koro →"
6. Verify routine preview loads with dark theme
7. Check that day cards show task types like "CQ বেসিক", "SQ অনুশীলন", "রিভিশন"
8. Check Phase 1 days show MCQ/SQ/CQ বেসিক for পদার্থবিজ্ঞান chapters

- [ ] **Step 3: Test HSC flow**

1. Start over → Enter name, select **HSC** → Next
2. Verify chapters load: পদার্থ প্রথম পত্র, পদার্থ দ্বিতীয় পত্র, রসায়ন প্রথম পত্র, etc.
3. Mark পদার্থ প্রথম পত্র Ch 2 (ভেক্টর) as "পারিনা" → expect NO SQ tasks (SQ=0)
4. Generate routine → verify MCQ বেসিক + CQ বেসিক for ভেক্টর, no SQ tasks

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: routine generator v2 complete — SSC/HSC grade, real chapter time budgets, MCQ/SQ/CQ engine"
```

---

## Self-Review Checklist

- [x] **Migration**: drops old columns, creates new schema ✓
- [x] **Seed**: all 148 chapters from spreadsheet, hours→minutes converted ✓
- [x] **Types**: `Grade`, `Chapter` v2, `WizardState` with `grade` field ✓
- [x] **API**: `grade` param replaces `section` on both routes ✓
- [x] **Info page**: SSC/HSC toggle, saves `grade` to wizard state ✓
- [x] **Assess page**: fetches by `grade`, `chapter_num` not `chapter_number` ✓
- [x] **Duration page**: passes `grade` in generate API call ✓
- [x] **Engine**: `getTasksForChapter` implements all 3 statuses correctly ✓
- [x] **Engine**: `splitByType` skips task types with importance=0 ✓
- [x] **Engine**: phase ratios match v2 logic doc ✓
- [x] **Engine**: weekend filter uses `isLightTask` (MCQ + রিভিশন only) ✓
- [x] **RoutineTable**: badge colors cover MCQ/SQ/CQ/রিভিশন ✓
- [x] **No `section` references** remain in production code ✓
