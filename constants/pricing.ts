export type SubjectTier = "basic" | "upper" | "sat";
export type SessionFormat = "individual" | "group";

// ── Subject → Tier mapping ────────────────────────────────────────────────────
export const SUBJECT_TIERS: Record<string, SubjectTier> = {
  // Basic
  "Reading":            "basic",
  "Writing":            "basic",
  "English":            "basic",
  "Grammar":            "basic",
  "Elementary Math":    "basic",
  "Pre-Algebra":        "basic",
  "Algebra 1":          "basic",
  "Algebra 2":          "basic",
  "Middle School Math": "basic",
  "Biology":            "basic",
  "Earth Science":      "basic",
  "General Science":    "basic",
  "History":            "basic",
  "Social Studies":     "basic",
  "Geography":          "basic",

  // Upper-Level
  "Geometry":           "upper",
  "Trigonometry":       "upper",
  "Pre-Calculus":       "upper",
  "Calculus":           "upper",
  "Statistics":         "upper",
  "AP English":         "upper",
  "AP Literature":      "upper",
  "Chemistry":          "upper",
  "Physics":            "upper",
  "AP Chemistry":       "upper",
  "AP Physics":         "upper",
  "AP History":         "upper",
  "AP Government":      "upper",
  "Computer Science":   "upper",
  "Foreign Language":   "upper",

  // SAT / Test Prep
  "SAT Prep":           "sat",
  "ACT Prep":           "sat",
  "PSAT Prep":          "sat",
  "Test Prep":          "sat",
};

// Subjects grouped for display in the picker
export const SUBJECT_GROUPS = [
  {
    label: "Basic Subjects",
    subjects: [
      "Reading", "Writing", "English", "Grammar",
      "Elementary Math", "Pre-Algebra", "Algebra 1", "Algebra 2", "Middle School Math",
      "Biology", "Earth Science", "General Science",
      "History", "Social Studies", "Geography",
    ],
  },
  {
    label: "Upper-Level Subjects",
    subjects: [
      "Geometry", "Trigonometry", "Pre-Calculus", "Calculus", "Statistics",
      "AP English", "AP Literature",
      "Chemistry", "Physics", "AP Chemistry", "AP Physics",
      "AP History", "AP Government",
      "Computer Science", "Foreign Language",
    ],
  },
  {
    label: "SAT / Test Prep",
    subjects: ["SAT Prep", "ACT Prep", "PSAT Prep", "Test Prep"],
  },
];

// ── Pricing table ─────────────────────────────────────────────────────────────
// parentRate: what parents pay per hour
// tutorRate:  what tutors earn per hour
export const PRICING: Record<SessionFormat, Record<SubjectTier, { parentRate: number; tutorRate: number }>> = {
  individual: {
    basic: { parentRate: 35, tutorRate: 20 },
    upper: { parentRate: 40, tutorRate: 24 },
    sat:   { parentRate: 45, tutorRate: 27 },
  },
  group: {
    basic: { parentRate: 25, tutorRate: 15 },
    upper: { parentRate: 30, tutorRate: 18 },
    sat:   { parentRate: 40, tutorRate: 21 },
  },
};

export function getPrice(subject: string, format: SessionFormat) {
  const tier = SUBJECT_TIERS[subject] ?? "basic";
  return PRICING[format][tier];
}

export const TIER_LABELS: Record<SubjectTier, string> = {
  basic: "Basic",
  upper: "Upper-Level",
  sat:   "SAT / Test Prep",
};
