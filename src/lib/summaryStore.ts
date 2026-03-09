export interface SavedSummary {
  id: string;
  subject: string;
  mode: "tldr" | "deep" | "feynman";
  content: string;
  title: string;
  dateCreated: number;
  estimatedReadTime: number;
}

const STORAGE_KEY = "callitback_summaries";

export const saveSummary = (summary: SavedSummary): void => {
  const summaries = getSummaries();
  summaries.unshift(summary);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(summaries));
};

export const getSummaries = (): SavedSummary[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteSummary = (id: string): void => {
  const summaries = getSummaries().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(summaries));
};

export const getSubjectEmoji = (subject: string): string => {
  const emojiMap: Record<string, string> = {
    math: "📐",
    science: "🔬",
    biology: "🧬",
    chemistry: "⚗️",
    physics: "⚛️",
    history: "📜",
    geography: "🌍",
    literature: "📚",
    english: "📖",
    art: "🎨",
    music: "🎵",
    computer: "💻",
    programming: "👨‍💻",
    business: "💼",
    economics: "📊",
    psychology: "🧠",
    philosophy: "🤔",
  };
  
  const key = subject.toLowerCase();
  for (const [k, emoji] of Object.entries(emojiMap)) {
    if (key.includes(k)) return emoji;
  }
  return "📄";
};