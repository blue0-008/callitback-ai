/**
 * LocalStorage-backed store for all user-generated data.
 * No mock data — everything starts empty.
 */

export interface StudySession {
  id: string;
  topic: string;
  subject: string;
  date: string; // ISO string
  type: "summary" | "quiz" | "flashcards" | "summary + quiz";
  score?: number | null; // quiz score percentage
}

export interface SavedQuiz {
  id: string;
  title: string;
  questions: number;
  duration: string;
  completed: boolean;
  score?: number;
  createdAt: string;
}

export interface SavedDeck {
  id: string;
  title: string;
  subject: string;
  cards: number;
  mastered: number;
  dueToday: number;
  createdAt: string;
}

export interface UserStats {
  streak: number;
  lastStudyDate: string | null; // ISO date string (YYYY-MM-DD)
  bestStreak: number;
  totalSessions: number;
  totalCardsReviewed: number;
  totalQuizzesTaken: number;
  topicsStudied: number;
  cardsMastered: number;
  quizScores: { date: string; score: number }[];
  subjectTime: Record<string, number>; // subject -> minutes
  heatmap: Record<string, number>; // "YYYY-MM-DD" -> session count
  deckMastery: { deck: string; mastered: number; learning: number }[];
}

const KEYS = {
  sessions: "callitback_sessions",
  quizzes: "callitback_quizzes",
  decks: "callitback_decks",
  stats: "callitback_stats",
  continueItem: "callitback_continue",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Default empty stats
const emptyStats: UserStats = {
  streak: 0,
  lastStudyDate: null,
  bestStreak: 0,
  totalSessions: 0,
  totalCardsReviewed: 0,
  totalQuizzesTaken: 0,
  topicsStudied: 0,
  cardsMastered: 0,
  quizScores: [],
  subjectTime: {},
  heatmap: {},
  deckMastery: [],
};

// Sessions
export function getSessions(): StudySession[] {
  return read<StudySession[]>(KEYS.sessions, []);
}
export function addSession(session: StudySession) {
  const sessions = getSessions();
  sessions.unshift(session);
  write(KEYS.sessions, sessions);
  // Update stats
  const stats = getStats();
  stats.totalSessions++;
  const today = new Date().toISOString().slice(0, 10);
  stats.heatmap[today] = (stats.heatmap[today] || 0) + 1;
  // Streak logic
  if (stats.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (stats.lastStudyDate === yesterday) {
      stats.streak++;
    } else if (stats.lastStudyDate !== today) {
      stats.streak = 1;
    }
    stats.lastStudyDate = today;
    if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
  }
  if (session.subject && !Object.keys(stats.subjectTime).includes(session.subject)) {
    stats.topicsStudied++;
  }
  stats.subjectTime[session.subject] = (stats.subjectTime[session.subject] || 0) + 1;
  saveStats(stats);
}

// Quizzes
export function getQuizzes(): SavedQuiz[] {
  return read<SavedQuiz[]>(KEYS.quizzes, []);
}
export function saveQuizzes(quizzes: SavedQuiz[]) {
  write(KEYS.quizzes, quizzes);
}

// Decks
export function getDecks(): SavedDeck[] {
  return read<SavedDeck[]>(KEYS.decks, []);
}
export function saveDecks(decks: SavedDeck[]) {
  write(KEYS.decks, decks);
}

// Stats
export function getStats(): UserStats {
  return read<UserStats>(KEYS.stats, { ...emptyStats });
}
export function saveStats(stats: UserStats) {
  write(KEYS.stats, stats);
}

// Continue item
export interface ContinueItem {
  topic: string;
  subject: string;
  type: "quiz" | "flashcards";
  progress: number;
  total: number;
  path: string;
}
export function getContinueItem(): ContinueItem | null {
  return read<ContinueItem | null>(KEYS.continueItem, null);
}
export function saveContinueItem(item: ContinueItem | null) {
  write(KEYS.continueItem, item);
}

// Due today count (from saved decks)
export function getDueToday(): number {
  return getDecks().reduce((sum, d) => sum + d.dueToday, 0);
}