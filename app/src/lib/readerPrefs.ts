export type ReaderTheme = "storybook" | "night";
export type ReaderDensity = "story" | "focus";
export type ReaderTextSize = "normal" | "large";

export interface ReaderPrefs {
  theme: ReaderTheme;
  density: ReaderDensity;
  textSize: ReaderTextSize;
}

export interface LearnerProfile {
  id: string;
  name: string;
  grade: string;
  teacherId?: string;
  teacherName?: string;
  classId?: string;
  className?: string;
  updatedAt?: string;
}

export interface StudyStats {
  attempted: number;
  correct: number;
  bookmarks: number;
  units: Record<string, StudyBucket>;
  topics: Record<string, StudyBucket>;
}

export interface StudyBucket {
  attempted: number;
  correct: number;
  lastStudiedAt?: string;
}

const PREFS_KEY = "codex-math-reader-prefs";
const PROFILE_KEY = "codex-math-learner-profile";
const LEGACY_STATS_KEY = "codex-math-study-stats";
const STATS_KEY_PREFIX = "codex-math-study-stats:";

export const DEFAULT_PREFS: ReaderPrefs = {
  theme: "storybook",
  density: "story",
  textSize: "normal",
};

export const DEFAULT_LEARNER: LearnerProfile = {
  id: "default-learner",
  name: "학습자",
  grade: "6학년 연산",
};

export const DEFAULT_STATS: StudyStats = {
  attempted: 0,
  correct: 0,
  bookmarks: 0,
  units: {},
  topics: {},
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

function normalizeProfileName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeGrade(value: string) {
  const grade = normalizeProfileName(value);
  const compact = grade.replace(/\s+/g, "").toLowerCase();
  if (compact.includes("1") && (compact.includes("연산") || compact.includes("op") || compact.includes("operation"))) return "1학년 연산";
  if (compact.includes("2") && (compact.includes("연산") || compact.includes("op") || compact.includes("operation"))) return "2학년 연산";
  if (compact.includes("3") && (compact.includes("연산") || compact.includes("op") || compact.includes("operation"))) return "3학년 연산";
  if (compact.includes("4") && (compact.includes("연산") || compact.includes("op") || compact.includes("operation"))) return "4학년 연산";
  if (compact.includes("5") && (compact.includes("연산") || compact.includes("op") || compact.includes("operation"))) return "5학년 연산";
  if (compact.includes("6") && (compact.includes("연산") || compact.includes("op") || compact.includes("operation"))) return "6학년 연산";
  if ((compact.includes("예비") && compact.includes("2")) || compact.includes("pre2")) return "1학년";
  if ((compact.includes("예비") && compact.includes("3")) || compact.includes("pre3")) return "2학년";
  if ((compact.includes("예비") && compact.includes("5")) || compact.includes("pre5")) return "4학년";
  if ((compact.includes("예비") && compact.includes("4")) || compact.includes("pre4")) return "3학년";
  return grade;
}

function learnerId(name: string, grade: string) {
  return encodeURIComponent(`${grade.trim()}__${name.trim()}`.toLowerCase());
}

function normalizeLearnerProfile(profile: Partial<LearnerProfile>): LearnerProfile {
  const name = normalizeProfileName(profile.name ?? "") || DEFAULT_LEARNER.name;
  const grade = normalizeGrade(profile.grade ?? "") || DEFAULT_LEARNER.grade;
  const isDefaultLearner = name === DEFAULT_LEARNER.name && grade === DEFAULT_LEARNER.grade;
  return {
    id: isDefaultLearner ? DEFAULT_LEARNER.id : profile.id || learnerId(name, grade),
    name,
    grade,
    teacherId: profile.teacherId,
    teacherName: profile.teacherName,
    classId: profile.classId,
    className: profile.className,
    updatedAt: profile.updatedAt,
  };
}

function statsKey(learnerProfileId: string) {
  return `${STATS_KEY_PREFIX}${learnerProfileId || DEFAULT_LEARNER.id}`;
}

function normalizeStats(stats: StudyStats): StudyStats {
  return {
    ...DEFAULT_STATS,
    ...stats,
    units: stats.units ?? {},
    topics: stats.topics ?? {},
  };
}

export function loadReaderPrefs(): ReaderPrefs {
  return readJson(PREFS_KEY, DEFAULT_PREFS);
}

export function saveReaderPrefs(prefs: ReaderPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function loadLearnerProfile(): LearnerProfile {
  const stored = readJson(PROFILE_KEY, DEFAULT_LEARNER);
  const wasOldDefaultLearner =
    stored.id === DEFAULT_LEARNER.id &&
    normalizeProfileName(stored.name ?? "") === DEFAULT_LEARNER.name &&
    (normalizeGrade(stored.grade ?? "") === "1학년" || normalizeGrade(stored.grade ?? "") === "6학년");

  return normalizeLearnerProfile(wasOldDefaultLearner ? DEFAULT_LEARNER : stored);
}

export function saveLearnerProfile(profile: Partial<LearnerProfile>): LearnerProfile {
  const next = normalizeLearnerProfile({ ...profile, updatedAt: new Date().toISOString() });
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function loadStudyStats(learnerProfileId = loadLearnerProfile().id): StudyStats {
  const stored = localStorage.getItem(statsKey(learnerProfileId));
  if (stored) {
    try {
      return normalizeStats(JSON.parse(stored));
    } catch {
      return DEFAULT_STATS;
    }
  }

  if (learnerProfileId === DEFAULT_LEARNER.id) {
    const legacyStats = readJson(LEGACY_STATS_KEY, DEFAULT_STATS);
    return normalizeStats(legacyStats);
  }

  return DEFAULT_STATS;
}

export function saveStudyStats(stats: StudyStats, learnerProfileId = loadLearnerProfile().id) {
  localStorage.setItem(statsKey(learnerProfileId), JSON.stringify(normalizeStats(stats)));
}
