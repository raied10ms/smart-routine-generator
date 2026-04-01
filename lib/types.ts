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

export type Assessment = Record<string, Record<string, AssessmentStatus>>;

export interface RoutineEntry {
  chapterId: number;
  subject: string;
  chapterName: string;
  taskType: string;
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
  section: Section | null;
  assessment: Assessment;
  durationDays: number | null;
  routinePreview: RoutineDay[] | null;
}

export type DurationOption = 7 | 15 | 20 | 30 | 60;
