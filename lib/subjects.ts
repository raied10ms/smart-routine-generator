import type { Grade, Group } from "./types";

// Ordered subject lists per grade+group. Order is canonical — used in assess page,
// diagnosis section, and PDF output.
export const SUBJECT_ORDER: Record<Grade, Record<Group, string[]>> = {
  SSC: {
    "বিজ্ঞান":         ["পদার্থবিজ্ঞান", "রসায়ন", "জীববিজ্ঞান", "উচ্চতর গণিত", "তথ্য ও যোগাযোগ প্রযুক্তি"],
    "ব্যবসায় শিক্ষা": ["গণিত", "বিজ্ঞান", "তথ্য ও যোগাযোগ প্রযুক্তি"],
    "মানবিক":           ["গণিত", "বিজ্ঞান", "তথ্য ও যোগাযোগ প্রযুক্তি"],
  },
  HSC: {
    "বিজ্ঞান":         [
      "পদার্থ প্রথম পত্র", "পদার্থ দ্বিতীয় পত্র",
      "রসায়ন প্রথম পত্র", "রসায়ন দ্বিতীয় পত্র",
      "জীববিজ্ঞান প্রথম পত্র", "জীববিজ্ঞান দ্বিতীয় পত্র",
      "উচ্চতর গণিত প্রথম পত্র", "উচ্চতর গণিত দ্বিতীয় পত্র",
      "তথ্য ও যোগাযোগ প্রযুক্তি",
    ],
    "ব্যবসায় শিক্ষা": ["তথ্য ও যোগাযোগ প্রযুক্তি"],
    "মানবিক":           ["তথ্য ও যোগাযোগ প্রযুক্তি"],
  },
};

export function getSubjects(grade: Grade, group: Group): string[] {
  return SUBJECT_ORDER[grade]?.[group] ?? [];
}
