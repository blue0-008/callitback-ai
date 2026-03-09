import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Eye, Trash2, CalendarDays, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import GlassCard from "@/components/GlassCard";
import EmptyState from "@/components/EmptyState";
import { getSubjectEmoji, type SavedSummary } from "@/lib/summaryStore";
import { type SavedQuiz, type SavedDeck } from "@/lib/store";
import { cn } from "@/lib/utils";

type LibraryFilter = "all" | "summary" | "quiz" | "flashcards";
type LibraryItemType = Exclude<LibraryFilter, "all">;

type LibraryItem = {
  id: string;
  type: LibraryItemType;
  subject: string;
  title: string;
  preview: string;
  dateSaved: number;
  quickStat: string;
  summaryContent?: string;
};

const STORAGE_KEYS = {
  summaries: "callitback_summaries",
  quizzes: "callitback_quizzes",
  decks: "callitback_decks",
} as const;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function formatDate(value: number) {
  const locale = typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "ar-u-nu-latn" : undefined;
  return new Date(value).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeDate(input: string | number | undefined) {
  if (!input) return Date.now();
  const time = typeof input === "number" ? input : new Date(input).getTime();
  return Number.isNaN(time) ? Date.now() : time;
}

function summaryPreview(summary: SavedSummary) {
  const firstLine = summary.content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  return (firstLine || summary.title || "Untitled summary").slice(0, 180);
}

function inferQuizSubject(quiz: SavedQuiz) {
  const lower = quiz.title.toLowerCase();
  if (lower.includes("math")) return "Math";
  if (lower.includes("science")) return "Science";
  if (lower.includes("history")) return "History";
  if (lower.includes("english") || lower.includes("literature")) return "English";
  return "General";
}

const typeBadgeClass: Record<LibraryItemType, string> = {
  summary: "bg-primary/15 text-primary border border-primary/30",
  quiz: "bg-secondary text-secondary-foreground border border-border",
  flashcards: "bg-accent/15 text-accent border border-accent/30",
};

const typeLabel: Record<LibraryItemType, string> = {
  summary: "Summary",
  quiz: "Quiz",
  flashcards: "Flashcard Deck",
};

const Library = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [search, setSearch] = useState("");
  const [summaries, setSummaries] = useState<SavedSummary[]>([]);
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [viewingSummary, setViewingSummary] = useState<LibraryItem | null>(null);

  useEffect(() => {
    setSummaries(readStorage<SavedSummary[]>(STORAGE_KEYS.summaries, []));
    setQuizzes(readStorage<SavedQuiz[]>(STORAGE_KEYS.quizzes, []));
    setDecks(readStorage<SavedDeck[]>(STORAGE_KEYS.decks, []));
  }, []);

  const items = useMemo<LibraryItem[]>(() => {
    const summaryItems: LibraryItem[] = summaries.map((summary) => ({
      id: summary.id,
      type: "summary",
      subject: summary.subject,
      title: summary.title || "Untitled summary",
      preview: summaryPreview(summary),
      dateSaved: normalizeDate(summary.dateCreated),
      quickStat: `${summary.estimatedReadTime} min read`,
      summaryContent: summary.content,
    }));

    const quizItems: LibraryItem[] = quizzes.map((quiz) => ({
      id: quiz.id,
      type: "quiz",
      subject: inferQuizSubject(quiz),
      title: quiz.title,
      preview: quiz.title,
      dateSaved: normalizeDate(quiz.createdAt),
      quickStat: `${quiz.questions} questions`,
    }));

    const deckItems: LibraryItem[] = decks.map((deck) => ({
      id: deck.id,
      type: "flashcards",
      subject: deck.subject || "General",
      title: deck.title,
      preview: deck.title,
      dateSaved: normalizeDate(deck.createdAt),
      quickStat: `${deck.cards} cards`,
    }));

    return [...summaryItems, ...quizItems, ...deckItems].sort((a, b) => b.dateSaved - a.dateSaved);
  }, [summaries, quizzes, decks]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = filter === "all" || item.type === filter;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.preview.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [items, filter, search]);

  const openItem = (item: LibraryItem) => {
    if (item.type === "summary") {
      setViewingSummary(item);
      return;
    }
    if (item.type === "quiz") {
      navigate(`/quiz?id=${item.id}`);
      return;
    }
    navigate(`/flashcards?id=${item.id}`);
  };

  const deleteItem = (item: LibraryItem) => {
    if (item.type === "summary") {
      const next = summaries.filter((s) => s.id !== item.id);
      setSummaries(next);
      localStorage.setItem(STORAGE_KEYS.summaries, JSON.stringify(next));
      if (viewingSummary?.id === item.id) setViewingSummary(null);
      return;
    }

    if (item.type === "quiz") {
      const next = quizzes.filter((q) => q.id !== item.id);
      setQuizzes(next);
      localStorage.setItem(STORAGE_KEYS.quizzes, JSON.stringify(next));
      localStorage.removeItem(`callitback_quiz_data_${item.id}`);
      return;
    }

    const next = decks.filter((d) => d.id !== item.id);
    setDecks(next);
    localStorage.setItem(STORAGE_KEYS.decks, JSON.stringify(next));
    localStorage.removeItem(`callitback_deck_data_${item.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-heading font-bold text-foreground">My Library 📚</h1>
        <p className="text-sm text-muted-foreground">Everything you've studied, in one place</p>
      </div>

      <div className="relative">
        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search summaries, quizzes, flashcards..."
          className="ltr:pl-9 rtl:pr-9"
        />
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as LibraryFilter)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="summary">Summaries</TabsTrigger>
          <TabsTrigger value="quiz">Quizzes</TabsTrigger>
          <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="Your library is empty. Go study something! ⚡"
          description="Generate a summary, quiz, or flashcard deck from Study to populate your library."
          action={
            <Button onClick={() => navigate("/study")}>Go to Study</Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <GlassCard
              key={`${item.type}-${item.id}`}
              className="space-y-3"
              onClick={() => openItem(item)}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={cn("text-[11px] font-semibold px-2 py-1 rounded-full", typeBadgeClass[item.type])}>
                  {typeLabel[item.type]}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <button
                      className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      aria-label="Open item menu"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        openItem(item);
                      }}
                    >
                      <Eye className="h-4 w-4 ltr:mr-2 rtl:ml-2" /> Open
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item);
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 ltr:mr-2 rtl:ml-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-lg leading-none">{getSubjectEmoji(item.subject)}</span>
                <span className="font-medium text-foreground capitalize">{item.subject}</span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{item.preview}</p>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" /> {formatDate(item.dateSaved)}
                </span>
                <span className="flex items-center gap-1 text-foreground/80">
                  <Clock className="h-3 w-3" /> {item.quickStat}
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Dialog open={!!viewingSummary} onOpenChange={(open) => !open && setViewingSummary(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{viewingSummary?.title}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto ltr:pr-1 rtl:pl-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {viewingSummary?.summaryContent}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Library;
