export type Grade = "SSC" | "HSC";
export type Group = "বিজ্ঞান" | "ব্যবসায় শিক্ষা" | "মানবিক";

export type AssessmentStatus = "pari" | "revise" | "pari_na" | "syllabus_nai";

export interface Chapter {
  id: number;
  grade: Grade;
  subject: string;
  chapter_num: number;
  chapter_name_bn: string;
  mcq_importance: number;
  sq_importance: number;
  cq_importance: number;
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
  taskType: string;
  timeMin: number;
  importance?: number;  // max(mcq, sq, cq) — used for star display; absent in old DB rows
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
  group: Group | null;
  assessment: Assessment;
  durationDays: number | null;
  routinePreview: RoutineDay[] | null;
}

export type DurationOption = 7 | 15 | 20 | 30 | 60;
