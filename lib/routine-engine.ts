import type { Chapter, Assessment, AssessmentStatus, RoutineDay, RoutineEntry } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHASE_NAMES: Record<1 | 2 | 3, string> = {
  1: "ফাউন্ডেশন মোড 🏗️",
  2: "প্র্যাকটিস গ্রাইন্ড 🔥",
  3: "ফাইনাল রিভিশন 🎯",
};

const NORMAL_BUDGET = 300;   // 5 hours
const EXTREME_BUDGET = 420;  // 7 hours — পাওয়ার ডে ⚡
const WEEKEND_BUDGET = 150;  // 2.5 hours
const MAX_SUBJECTS_PER_DAY = 4;
const MIN_ENTRY_MIN = 30;

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface ChapterWithStatus extends Chapter {
  status: AssessmentStatus;
  maxImportance: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Round up to nearest 30 min, with a floor of 30 min. */
function roundTo30(minutes: number): number {
  if (minutes <= 0) return 0;
  const rounded = Math.ceil(minutes / 30) * 30;
  return Math.max(rounded, MIN_ENTRY_MIN);
}

/** Get the time budget for a given day number (1-indexed, Mon=1). */
function getDayBudget(dayNumber: number): { budget: number; isWeekend: boolean; isExtreme: boolean } {
  // Week position: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  const dayInWeek = ((dayNumber - 1) % 7) + 1;
  const isWeekend = dayInWeek === 6 || dayInWeek === 7;
  const isExtreme = dayInWeek === 5; // Thursday = 5th day

  if (isWeekend) return { budget: WEEKEND_BUDGET, isWeekend, isExtreme };
  if (isExtreme) return { budget: EXTREME_BUDGET, isWeekend, isExtreme };
  return { budget: NORMAL_BUDGET, isWeekend, isExtreme };
}

// ---------------------------------------------------------------------------
// Task type names by phase
// ---------------------------------------------------------------------------

function cqTaskName(phase: 1 | 2 | 3): string {
  if (phase === 1) return "CQ বেসিক";
  if (phase === 2) return "CQ অনুশীলন";
  return "রিভিশন";
}

function mcqTaskName(phase: 1 | 2 | 3): string {
  if (phase === 1) return "MCQ বেসিক";
  if (phase === 2) return "MCQ অনুশীলন";
  return "রিভিশন";
}

function mathTaskName(phase: 1 | 2 | 3): string {
  if (phase === 1) return "গণিত বেসিক";
  if (phase === 2) return "গণিত অনুশীলন";
  return "রিভিশন";
}

// ---------------------------------------------------------------------------
// Task builders
// ---------------------------------------------------------------------------

function buildPhase1Tasks(chapters: ChapterWithStatus[], isShort: boolean): RoutineEntry[] {
  const pool = chapters.filter((ch) =>
    isShort ? ch.status === "pari_na" || ch.status === "revise" : ch.status === "pari_na"
  );
  pool.sort((a, b) => b.maxImportance - a.maxImportance);

  const tasks: RoutineEntry[] = [];
  for (const ch of pool) {
    if (ch.time_cq_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: cqTaskName(1), timeMin: roundTo30(ch.time_cq_min * 0.5),
      });
    }
    if (ch.time_mcq_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: mcqTaskName(1), timeMin: roundTo30(ch.time_mcq_min * 0.3),
      });
    }
    if (ch.time_math_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: mathTaskName(1), timeMin: roundTo30(ch.time_math_min * 0.4),
      });
    }
  }
  return tasks;
}

function buildPhase2Tasks(chapters: ChapterWithStatus[]): RoutineEntry[] {
  const pool = chapters.filter((ch) => ch.status === "pari_na" || ch.status === "revise");
  pool.sort((a, b) => b.maxImportance - a.maxImportance);

  const tasks: RoutineEntry[] = [];
  for (const ch of pool) {
    if (ch.time_cq_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: cqTaskName(2), timeMin: roundTo30(ch.time_cq_min),
      });
    }
    if (ch.time_mcq_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: mcqTaskName(2), timeMin: roundTo30(ch.time_mcq_min),
      });
    }
    if (ch.time_math_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: mathTaskName(2), timeMin: roundTo30(ch.time_math_min),
      });
    }
  }
  return tasks;
}

function buildPhase3Tasks(chapters: ChapterWithStatus[]): RoutineEntry[] {
  const pool = chapters.filter((ch) => {
    if (ch.maxImportance >= 4) return true;
    if (ch.maxImportance >= 3 && (ch.status === "pari_na" || ch.status === "revise")) return true;
    if (ch.status === "pari_na") return true;
    return false;
  });
  pool.sort((a, b) => b.maxImportance - a.maxImportance);

  const tasks: RoutineEntry[] = [];
  for (const ch of pool) {
    if (ch.time_revision_min > 0) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: "রিভিশন", timeMin: roundTo30(ch.time_revision_min),
      });
    }
  }
  return tasks;
}

// ---------------------------------------------------------------------------
// Sorting: group by subject, importance desc, CQ > MCQ > Math within subject
// ---------------------------------------------------------------------------

function taskTypePriority(taskType: string): number {
  if (taskType.includes("CQ")) return 0;
  if (taskType.includes("MCQ")) return 1;
  if (taskType.includes("গণিত")) return 2;
  return 3; // রিভিশন
}

function sortTasksForDistribution(tasks: RoutineEntry[], chapters: ChapterWithStatus[]): RoutineEntry[] {
  // Build a lookup for max importance per chapter
  const importanceMap = new Map<number, number>();
  for (const ch of chapters) {
    importanceMap.set(ch.id, ch.maxImportance);
  }

  // Group tasks by subject
  const bySubject = new Map<string, RoutineEntry[]>();
  for (const t of tasks) {
    const arr = bySubject.get(t.subject) || [];
    arr.push(t);
    bySubject.set(t.subject, arr);
  }

  // Sort each subject's tasks: importance desc, then CQ > MCQ > Math
  for (const [, arr] of bySubject) {
    arr.sort((a, b) => {
      const impA = importanceMap.get(a.chapterId) ?? 0;
      const impB = importanceMap.get(b.chapterId) ?? 0;
      if (impB !== impA) return impB - impA;
      return taskTypePriority(a.taskType) - taskTypePriority(b.taskType);
    });
  }

  // Sort subjects by their highest importance task (harder subjects first)
  const subjectMaxImp = new Map<string, number>();
  for (const [subj, arr] of bySubject) {
    const maxImp = Math.max(...arr.map((t) => importanceMap.get(t.chapterId) ?? 0));
    subjectMaxImp.set(subj, maxImp);
  }

  const sortedSubjects = [...bySubject.keys()].sort(
    (a, b) => (subjectMaxImp.get(b) ?? 0) - (subjectMaxImp.get(a) ?? 0)
  );

  // Flatten: all tasks grouped by subject, subjects ordered by importance
  const result: RoutineEntry[] = [];
  for (const subj of sortedSubjects) {
    result.push(...(bySubject.get(subj) ?? []));
  }
  return result;
}

// ---------------------------------------------------------------------------
// Distribution algorithm
// ---------------------------------------------------------------------------

function distributeTasks(
  tasks: RoutineEntry[],
  startDay: number,
  numDays: number,
  phase: 1 | 2 | 3,
  chapters: ChapterWithStatus[],
  isWeekendPhase?: boolean,
): RoutineDay[] {
  if (numDays === 0) return [];

  const phaseName = PHASE_NAMES[phase];

  // Create day slots
  const days: RoutineDay[] = [];
  for (let i = 0; i < numDays; i++) {
    const dayNumber = startDay + i;
    const { budget, isWeekend, isExtreme } = getDayBudget(dayNumber);
    days.push({
      dayNumber,
      phase,
      phaseName,
      isWeekend,
      isExtreme,
      entries: [],
      totalTimeMin: 0,
    });
  }

  if (tasks.length === 0) return days;

  // Sort tasks for optimal distribution
  const sorted = sortTasksForDistribution([...tasks], chapters);

  // For weekend-only phases (phase 3 weekend tasks), filter to MCQ/revision only
  const taskQueue = isWeekendPhase
    ? sorted.filter((t) => t.taskType.includes("MCQ") || t.taskType.includes("রিভিশন"))
    : [...sorted];

  // Distribute tasks across days respecting constraints
  let taskIdx = 0;

  while (taskIdx < taskQueue.length) {
    let placed = false;

    for (const day of days) {
      if (taskIdx >= taskQueue.length) break;

      const task = taskQueue[taskIdx];
      const { budget } = getDayBudget(day.dayNumber);

      // Weekend days: only allow revision/MCQ tasks
      if (day.isWeekend) {
        const isMcqOrRevision = task.taskType.includes("MCQ") || task.taskType.includes("রিভিশন");
        if (!isMcqOrRevision) {
          // Skip this day for non-revision tasks on weekends
          continue;
        }
      }

      // Check time budget
      if (day.totalTimeMin + task.timeMin > budget) continue;

      // Check max subjects constraint
      const subjectsInDay = new Set(day.entries.map((e) => e.subject));
      if (!subjectsInDay.has(task.subject) && subjectsInDay.size >= MAX_SUBJECTS_PER_DAY) continue;

      // Place the task
      day.entries.push({ ...task });
      day.totalTimeMin += task.timeMin;
      taskIdx++;
      placed = true;
      break;
    }

    if (!placed) {
      // Try to place on any day that has room, ignoring weekend MCQ restriction
      let forcePlaced = false;
      for (const day of days) {
        const { budget } = getDayBudget(day.dayNumber);
        if (day.totalTimeMin + taskQueue[taskIdx].timeMin > budget) continue;
        const subjectsInDay = new Set(day.entries.map((e) => e.subject));
        if (!subjectsInDay.has(taskQueue[taskIdx].subject) && subjectsInDay.size >= MAX_SUBJECTS_PER_DAY) continue;

        day.entries.push({ ...taskQueue[taskIdx] });
        day.totalTimeMin += taskQueue[taskIdx].timeMin;
        taskIdx++;
        forcePlaced = true;
        break;
      }

      if (!forcePlaced) {
        // Cannot place this task anywhere — skip to avoid infinite loop
        taskIdx++;
      }
    }
  }

  // Sort entries within each day: harder subjects first, CQ > MCQ > Math within subject
  const importanceMap = new Map<number, number>();
  for (const ch of chapters) {
    importanceMap.set(ch.id, ch.maxImportance);
  }

  for (const day of days) {
    day.entries.sort((a, b) => {
      // Group by subject first
      if (a.subject !== b.subject) {
        const impA = Math.max(...day.entries.filter((e) => e.subject === a.subject).map((e) => importanceMap.get(e.chapterId) ?? 0));
        const impB = Math.max(...day.entries.filter((e) => e.subject === b.subject).map((e) => importanceMap.get(e.chapterId) ?? 0));
        if (impB !== impA) return impB - impA;
        return a.subject.localeCompare(b.subject);
      }
      // Within same subject: CQ > MCQ > Math
      return taskTypePriority(a.taskType) - taskTypePriority(b.taskType);
    });
  }

  return days;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function generateRoutine(
  chapters: Chapter[],
  assessment: Assessment,
  durationDays: number
): RoutineDay[] {
  // Assess chapters
  const assessed = chapters.map((ch): ChapterWithStatus => {
    const subjectAssessment = assessment[ch.subject] || {};
    const status = subjectAssessment[String(ch.id)] || "pari";
    return {
      ...ch,
      status,
      maxImportance: Math.max(ch.cq_importance, ch.mcq_importance, ch.math_importance),
    };
  });

  const active = assessed.filter((ch) => ch.status !== "syllabus_nai");

  // Phase split
  const isShort = durationDays <= 7;
  const phase1Days = isShort ? 0 : Math.round(durationDays * 0.35);
  const phase2Days = isShort
    ? Math.round(durationDays * 0.7)
    : Math.round(durationDays * 0.35);
  const phase3Days = durationDays - phase1Days - phase2Days;

  // Build task pools
  const phase1Pool = buildPhase1Tasks(active, isShort);
  const phase2Pool = buildPhase2Tasks(active);
  const phase3Pool = buildPhase3Tasks(active);

  // Distribute across days
  const allDays: RoutineDay[] = [];
  let dayNum = 1;

  if (!isShort && phase1Days > 0) {
    allDays.push(...distributeTasks(phase1Pool, dayNum, phase1Days, 1, assessed));
    dayNum += phase1Days;
  }

  const p2Tasks = isShort ? [...phase1Pool, ...phase2Pool] : phase2Pool;
  allDays.push(...distributeTasks(p2Tasks, dayNum, phase2Days, 2, assessed));
  dayNum += phase2Days;

  allDays.push(...distributeTasks(phase3Pool, dayNum, phase3Days, 3, assessed));

  // Filter out empty days (no entries) and re-number sequentially
  const nonEmpty = allDays.filter((d) => d.entries.length > 0);
  for (let i = 0; i < nonEmpty.length; i++) {
    nonEmpty[i].dayNumber = i + 1;
  }

  return nonEmpty;
}
