import type { Chapter, Assessment, AssessmentStatus, RoutineDay, RoutineEntry } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASE_NAMES: Record<1 | 2 | 3, string> = {
  1: "ফাউন্ডেশন মোড 🏗️",
  2: "প্র্যাকটিস গ্রাইন্ড 🔥",
  3: "ফাইনাল রিভিশন 🎯",
};

const NORMAL_BUDGET  = 300;
const EXTREME_BUDGET = 420;
const WEEKEND_BUDGET = 150;
const MAX_SUBJECTS_PER_DAY = 4;

// ─── Phase ratio table for পারিনা [basic%, practice%, revise%] ──────────────

const PHASE_RATIOS: Record<number, [number, number, number]> = {
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
  const dayInWeek = ((dayNumber - 1) % 7) + 1;
  const isWeekend = dayInWeek === 6 || dayInWeek === 7;
  const isExtreme = dayInWeek === 5;
  if (isWeekend) return { budget: WEEKEND_BUDGET, isWeekend, isExtreme: false };
  if (isExtreme) return { budget: EXTREME_BUDGET, isWeekend: false, isExtreme };
  return { budget: NORMAL_BUDGET, isWeekend: false, isExtreme: false };
}

function isLightTask(taskType: string): boolean {
  return taskType.includes("MCQ") || taskType === "রিভিশন";
}

// ─── Task labels ──────────────────────────────────────────────────────────────

function taskLabel(type: "MCQ" | "SQ" | "CQ", phase: 1 | 2 | 3): string {
  return phase === 3 ? "রিভিশন" : `${type} ${phase === 1 ? "বেসিক" : "অনুশীলন"}`;
}

// ─── Per-chapter task generation ─────────────────────────────────────────────

interface ChapterWithStatus extends Chapter {
  status: AssessmentStatus;
}

interface PhaseTask extends RoutineEntry {
  phase: 1 | 2 | 3;
}

function splitByType(ch: ChapterWithStatus, totalMin: number, phase: 1 | 2 | 3): PhaseTask[] {
  const types: Array<{ key: "MCQ" | "SQ" | "CQ"; imp: number }> = [];
  if (ch.mcq_importance > 0) types.push({ key: "MCQ", imp: ch.mcq_importance });
  if (ch.sq_importance  > 0) types.push({ key: "SQ",  imp: ch.sq_importance });
  if (ch.cq_importance  > 0) types.push({ key: "CQ",  imp: ch.cq_importance });
  if (types.length === 0 || totalMin <= 0) return [];

  const totalImp = types.reduce((s, t) => s + t.imp, 0);
  const importance = Math.max(ch.mcq_importance, ch.sq_importance, ch.cq_importance);
  const tasks: PhaseTask[] = [];
  for (const t of types) {
    const rounded = roundTo30((totalMin * t.imp) / totalImp);
    if (rounded >= 30) {
      tasks.push({
        chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
        taskType: taskLabel(t.key, phase), timeMin: rounded, phase, importance,
      });
    }
  }
  return tasks;
}

function getTasksForChapter(ch: ChapterWithStatus): PhaseTask[] {
  if (ch.status === "syllabus_nai") return [];
  const importance = Math.max(ch.mcq_importance, ch.sq_importance, ch.cq_importance);

  if (ch.status === "pari") {
    if (ch.time_pari_min <= 0) return [];
    return [{
      chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
      taskType: "রিভিশন", timeMin: roundTo30(ch.time_pari_min), phase: 3, importance,
    }];
  }

  if (ch.status === "revise") {
    const total = ch.time_revise_min;
    if (total <= 0) return [];
    const p2Min = Math.round(total * 0.55);
    const p3Min = total - p2Min;
    const tasks: PhaseTask[] = [...splitByType(ch, p2Min, 2)];
    if (p3Min >= 30) tasks.push({
      chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
      taskType: "রিভিশন", timeMin: roundTo30(p3Min), phase: 3, importance,
    });
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
    const tasks: PhaseTask[] = [
      ...splitByType(ch, basicMin, 1),
      ...splitByType(ch, practiceMin, 2),
    ];
    if (reviseMin >= 30) tasks.push({
      chapterId: ch.id, subject: ch.subject, chapterName: ch.chapter_name_bn,
      taskType: "রিভিশন", timeMin: roundTo30(reviseMin), phase: 3, importance,
    });
    return tasks;
  }

  return [];
}

// ─── Distribution ─────────────────────────────────────────────────────────────

function taskPriority(taskType: string): number {
  if (taskType.includes("CQ")) return 0;
  if (taskType.includes("SQ")) return 1;
  if (taskType.includes("MCQ")) return 2;
  return 3;
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

  const sorted = [...tasks].sort((a, b) => taskPriority(a.taskType) - taskPriority(b.taskType));
  let taskIdx = 0;

  while (taskIdx < sorted.length) {
    const task = sorted[taskIdx];
    let placed = false;

    for (const day of days) {
      const { budget } = getDayBudget(day.dayNumber);
      if (day.isWeekend && !isLightTask(task.taskType)) continue;
      if (day.totalTimeMin + task.timeMin > budget) continue;
      const subjects = new Set(day.entries.map((e) => e.subject));
      if (!subjects.has(task.subject) && subjects.size >= MAX_SUBJECTS_PER_DAY) continue;
      day.entries.push({ ...task });
      day.totalTimeMin += task.timeMin;
      taskIdx++;
      placed = true;
      break;
    }

    if (!placed) {
      let force = false;
      for (const day of days) {
        const { budget } = getDayBudget(day.dayNumber);
        if (day.totalTimeMin + task.timeMin > budget) continue;
        const subjects = new Set(day.entries.map((e) => e.subject));
        if (!subjects.has(task.subject) && subjects.size >= MAX_SUBJECTS_PER_DAY) continue;
        day.entries.push({ ...task });
        day.totalTimeMin += task.timeMin;
        taskIdx++;
        force = true;
        break;
      }
      if (!force) taskIdx++;
    }
  }

  for (const day of days) {
    day.entries.sort((a, b) => {
      if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
      return taskPriority(a.taskType) - taskPriority(b.taskType);
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
  const assessed: ChapterWithStatus[] = chapters.map((ch) => {
    const subjectAssessment = assessment[ch.subject] || {};
    const status = (subjectAssessment[String(ch.id)] as AssessmentStatus) || "pari";
    return { ...ch, status };
  });

  const allTasks: PhaseTask[] = [];
  for (const ch of assessed) allTasks.push(...getTasksForChapter(ch));

  const p1Tasks = allTasks.filter((t) => t.phase === 1);
  const p2Tasks = allTasks.filter((t) => t.phase === 2);
  const p3Tasks = allTasks.filter((t) => t.phase === 3);

  const isShort = durationDays <= 7;
  const phase1Days = isShort ? 0 : Math.round(durationDays * 0.35);
  const phase2Days = isShort ? Math.round(durationDays * 0.70) : Math.round(durationDays * 0.35);
  const phase3Days = durationDays - phase1Days - phase2Days;

  const effective2Tasks = isShort ? [...p1Tasks, ...p2Tasks] : p2Tasks;

  // Add second pass for phase 3 if pool is small relative to days
  const p3TasksWithFallback = [...p3Tasks];
  const estimatedP3Days = Math.ceil(p3Tasks.reduce((s, t) => s + t.timeMin, 0) / NORMAL_BUDGET);
  if (estimatedP3Days < phase3Days && p3Tasks.length > 0) {
    const secondPass = p3Tasks.map((t) => ({
      ...t, timeMin: roundTo30(t.timeMin * 0.6),
    }));
    p3TasksWithFallback.push(...secondPass);
  }

  const allDays: RoutineDay[] = [
    ...distributeTasks(p1Tasks, 1, phase1Days, 1),
    ...distributeTasks(effective2Tasks, phase1Days + 1, phase2Days, 2),
    ...distributeTasks(p3TasksWithFallback, phase1Days + phase2Days + 1, phase3Days, 3),
  ];

  const nonEmpty = allDays.filter((d) => d.entries.length > 0);
  nonEmpty.forEach((d, i) => { d.dayNumber = i + 1; });
  return nonEmpty;
}
