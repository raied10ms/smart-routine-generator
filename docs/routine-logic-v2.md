<!-- SUMMARY
File: apps/ssc-routine/docs/routine-logic-v2.md
Topic: Routine Generator v2 logic spec — time allocation, task splitting, phase ratios
Status: Draft (pending implementation approval)
Owner: Raied
Key refs: Routine Generator.xlsx, lib/routine-engine.ts
Covers: SSC/HSC subject list, chapter schema, assessment→task mapping, importance ratios, phase splits
-->

# Routine Generator v2 — Pseudo-Logic Sheet

## 1. Data Source

Spreadsheet: `Routine Generator.xlsx`
Sheets: Physics, Chemistry, Biology, Math, H.Math, ICT, Science

### Column Schema
| Col | Field | Notes |
|-----|-------|-------|
| 0 | Grade | `SSC` or `HSC` (NaN = same as row above) |
| 1 | Subject/Book | e.g. `পদার্থবিজ্ঞান`, `পদার্থ প্রথম পত্র` |
| 2 | Chapter Index | e.g. `প্রথম অধ্যায়` |
| 3 | Chapter Title | Bengali name |
| 4 | MCQ Importance | 0–5 |
| 5 | SQ Importance | 0–5 (0 for HSC Physics, H.Math; 0 for ICT CQ) |
| 6 | CQ Importance | 0–5 (0 for SSC ICT) |
| 7 | পারি | Total hours for REVISION ONLY |
| 8 | রিভাইস দিলে পারবো | Total hours for PRACTICE + REVISION |
| 9 | পারিনা | Total hours for BASIC + PRACTICE + REVISION |
| 10 | সিলেবাসে নাই | Always 0 (flag only) |

**All time values are in HOURS (decimal). Convert × 60 → minutes for scheduling.**

---

## 2. Subjects Available Per Grade

### SSC
| Subject (Bangla) | Section | Notes |
|---|---|---|
| পদার্থবিজ্ঞান | বিজ্ঞান | 13 chapters |
| রসায়ন | বিজ্ঞান | 12 chapters |
| জীববিজ্ঞান | বিজ্ঞান | 14 chapters |
| উচ্চতর গণিত | বিজ্ঞান (optional) | 14 chapters |
| গণিত | সব | 17 chapters |
| তথ্য ও যোগাযোগ প্রযুক্তি | সব | 6 chapters |
| বিজ্ঞান | মানবিক/বাণিজ্য | 11 chapters (non-science only) |

**Subjects NOT in spreadsheet → not shown:** Bangla 1+2, English 1+2, Religious Studies, BGS, History, etc.

### HSC
| Subject (Bangla) | Papers | Notes |
|---|---|---|
| পদার্থ প্রথম পত্র | — | 10 chapters (SQ=0) |
| পদার্থ দ্বিতীয় পত্র | — | 11 chapters (SQ=0) |
| রসায়ন প্রথম পত্র | — | 5 chapters (SQ=0) |
| রসায়ন দ্বিতীয় পত্র | — | 5 chapters (SQ=0) |
| জীববিজ্ঞান প্রথম পত্র | উদ্ভিদবিজ্ঞান | 12 chapters |
| জীববিজ্ঞান দ্বিতীয় পত্র | প্রাণীবিজ্ঞান | 12 chapters |
| উচ্চতর গণিত প্রথম পত্র | — | 10 chapters (SQ=0) |
| উচ্চতর গণিত দ্বিতীয় পত্র | — | 10 chapters (SQ=0) |
| তথ্য ও যোগাযোগ প্রযুক্তি | — | 6 chapters (SQ=0) |

---

## 3. Assessment Status → Task Generation

### Status: পারি (I can do it)
```
→ Phase 3 only
→ Single task: "রিভিশন"
→ timeMin = পারি_hrs × 60
→ Rounds up to nearest 30 min, min 30 min
```

### Status: রিভাইস দিলে পারবো (Need revision)
```
→ Phase 2 + Phase 3
→ Phase 2: "অনুশীলন" tasks (split by task type)
   timeMin_p2 = রিভাইস_hrs × 60 × 0.55
→ Phase 3: "রিভিশন" task
   timeMin_p3 = রিভাইস_hrs × 60 × 0.45
→ Within Phase 2, split across task types by importance (see §4)
```

### Status: পারিনা (I can't do it)
```
→ Phases 1 + 2 + 3
→ total_min = পারিনা_hrs × 60
→ imp = max(MCQ_imp, SQ_imp, CQ_imp)  ← overall importance
→ phase splits (see §5):
   basic_min    = total_min × basicRatio(imp)
   practice_min = total_min × practiceRatio(imp)
   revise_min   = total_min × reviseRatio(imp)
→ Phase 1: "বেসিক" tasks split by task type
→ Phase 2: "অনুশীলন" tasks split by task type
→ Phase 3: single "রিভিশন" task (revise_min total)
```

### Status: সিলেবাসে নাই
```
→ Skip entirely. No tasks generated.
```

---

## 4. Task Type Splitting Within a Phase

Given a phase budget `X` minutes for a chapter with non-zero importances:

```
active_types = [MCQ, SQ, CQ] where importance > 0
total_imp = sum(importance for each active type)

For each active type t:
  t_min = X × (t_importance / total_imp)
  t_min = roundTo30(t_min)  ← round up to nearest 30, floor 30
  If t_min < 15 after rounding: skip task (too small)
```

**Task type labels by phase:**

| Phase | MCQ label | SQ label | CQ label |
|---|---|---|---|
| Phase 1 (Basic) | MCQ বেসিক | SQ বেসিক | CQ বেসিক |
| Phase 2 (Practice) | MCQ অনুশীলন | SQ অনুশীলন | CQ অনুশীলন |
| Phase 3 (Revision) | রিভিশন | রিভিশন | রিভিশন |

**Subjects with CQ=0 (SSC ICT):** Only MCQ + SQ tasks generated.
**Subjects with SQ=0 (HSC Physics, H.Math, HSC ICT, HSC Chem):** Only MCQ + CQ tasks generated.

---

## 5. Phase Budget Ratios (পারিনা only)

Based on `imp = max(MCQ_imp, SQ_imp, CQ_imp)`:

| imp | Basic % | Practice % | Revise % |
|-----|---------|------------|---------|
| 5   | 25%     | 45%        | 30%     |
| 4   | 30%     | 40%        | 30%     |
| 3   | 35%     | 35%        | 30%     |
| 2   | 40%     | 30%        | 30%     |
| 1   | 45%     | 25%        | 30%     |

**Revision is always 30% regardless of importance** — students always need to revise.

---

## 6. Phase Duration Split (Across the Routine)

```
isShort = durationDays <= 7

if isShort:
  phase1Days = 0
  phase2Days = round(duration × 0.70)
  phase3Days = duration - phase2Days

else:
  phase1Days = round(duration × 0.35)
  phase2Days = round(duration × 0.35)
  phase3Days = duration - phase1Days - phase2Days
```

---

## 7. Day Budget

| Day type | Budget | Notes |
|---|---|---|
| Normal weekday | 300 min (5 hrs) | Mon, Tue, Wed, Sun |
| Extreme day (পাওয়ার ডে) | 420 min (7 hrs) | Thursday |
| Weekend light day | 150 min (2.5 hrs) | Fri, Sat |

Max 4 subjects per day.
Weekend days: only MCQ + রিভিশন tasks (no Basic or SQ/CQ practice).

---

## 8. Database Schema (new)

```sql
CREATE TABLE chapters (
  id          SERIAL PRIMARY KEY,
  grade       TEXT NOT NULL,        -- 'SSC' | 'HSC'
  subject     TEXT NOT NULL,        -- e.g. 'পদার্থবিজ্ঞান'
  book        TEXT,                 -- e.g. 'প্রথম পত্র' | NULL for SSC single books
  chapter_num INTEGER NOT NULL,
  chapter_name_bn TEXT NOT NULL,
  mcq_importance  INTEGER DEFAULT 0,  -- 0-5
  sq_importance   INTEGER DEFAULT 0,  -- 0-5
  cq_importance   INTEGER DEFAULT 0,  -- 0-5
  time_pari_min   INTEGER NOT NULL,   -- পারি × 60
  time_revise_min INTEGER NOT NULL,   -- রিভাইস × 60
  time_parina_min INTEGER NOT NULL    -- পারিনা × 60
);
```

Times stored as **minutes** (pre-converted from hours × 60, rounded to nearest 5).

---

## 9. Full Task List Per Chapter (Example)

**Example: SSC Physics Ch2 গতি (imp=5, MCQ=5, SQ=5, CQ=5)**
- পারি time: 3 hrs → 180 min
- রিভাইস time: 6 hrs → 360 min
- পারিনা time: 9 hrs → 540 min

**If পারিনা:**
```
total = 540 min
imp = 5 → Basic 25%, Practice 45%, Revise 30%
basic_min    = 135 min → split MCQ:SQ:CQ = 5:5:5 → 45:45:45 min each
practice_min = 243 min → split 81:81:81 min each
revise_min   = 162 min → single রিভিশন task

Tasks generated:
Phase 1: MCQ বেসিক (60 min), SQ বেসিক (60 min), CQ বেসিক (60 min)   [rounded to 30s]
Phase 2: MCQ অনুশীলন (90 min), SQ অনুশীলন (90 min), CQ অনুশীলন (90 min)
Phase 3: রিভিশন (180 min)
```

**Example: SSC ICT Ch2 (MCQ=5, SQ=4, CQ=0)**
- পারিনা time: 4 hrs → 240 min, imp=5
```
basic_min = 60 → MCQ:SQ = 5:4 → MCQ 33, SQ 27 → rounded: MCQ 60, SQ 30
practice_min = 108 → MCQ 60, SQ 60
revise_min = 72 → রিভিশন 90 (rounded up)
```

---

## 10. Opening Screen: SSC / HSC Selection

On page `/wizard/info`:
- Add a toggle/choice: **SSC** or **HSC**
- Selection determines which subjects appear on the assess page
- SSC Science group: Physics, Chemistry, Biology, Math, H.Math (optional), ICT
- HSC group: Physics 1+2, Chem 1+2, Bio 1+2, H.Math 1+2, ICT
- No Bangla, English, etc. — only subjects in spreadsheet

---

## 11. Migration: Seeding New Chapter Data

All 7 sheets need to be parsed and inserted into the `chapters` table.
- Carry forward Grade/Subject/Book from first row where NaN
- Convert hours → minutes (× 60, round to nearest 5)
- Set `book` = subject name for HSC (e.g. 'পদার্থ প্রথম পত্র') and NULL for SSC single-book subjects
- Strip "অধ্যায় X:" prefixes from Biology chapter titles for cleaner display

---

## 12. Removed Features / Simplifications vs v1

| v1 | v2 |
|---|---|
| `section` (বিজ্ঞান/মানবিক) | replaced by `grade` (SSC/HSC) + subject list |
| `time_cq_min`, `time_mcq_min`, `time_math_min` flat columns | `time_pari_min`, `time_revise_min`, `time_parina_min` + importance-based splitting |
| hardcoded task split ratios | importance-driven ratios from spreadsheet |
| Phase 1 only for pari_na | Phase 1 for pari_na based on importance |
| Bangla/English subjects | Removed (not in spreadsheet) |
