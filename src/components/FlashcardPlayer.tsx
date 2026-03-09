import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Shuffle,
  RotateCcw,
  ArrowRight,
  FileDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  List,
  X,
} from "lucide-react";

/* ── Types ─────────────────────────────────────── */

export interface Flashcard {
  id: string;
  term: string;
  definition: string;
}

type Mastery = "learning" | "getting-there" | "got-it";

interface FlashcardPlayerProps {
  deckTitle: string;
  cards: Flashcard[];
  onExit: () => void;
}

/* ── Progress ring (reused pattern) ────────────── */

const MasteryRing = ({ pct }: { pct: number }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="140" height="140" className="mx-auto">
      <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(228 14% 18%)" strokeWidth="10" />
      <motion.circle
        cx="70" cy="70" r={r} fill="none"
        stroke="hsl(38 92% 50%)"
        strokeWidth="10" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="70" textAnchor="middle" dy="0.35em" className="fill-foreground text-2xl font-heading font-bold">
        {pct}%
      </text>
    </svg>
  );
};

/* ── 3D Flip Card ──────────────────────────────── */

const FlipCard = ({
  card,
  flipped,
  onFlip,
  direction,
}: {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
  direction: number;
}) => (
  <div
    className="w-full max-w-lg mx-auto cursor-pointer"
    style={{ perspective: "1200px" }}
    onClick={onFlip}
  >
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={card.id + (flipped ? "-back" : "-front")}
        custom={direction}
        initial={{ rotateY: flipped ? -180 : 0, opacity: 0, x: direction * 60 }}
        animate={{ rotateY: 0, opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -60 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className={cn(
          "rounded-2xl p-8 sm:p-12 min-h-[260px] flex items-center justify-center text-center",
          "glass border transition-shadow duration-300",
          flipped
            ? "border-accent/30 shadow-[0_0_25px_hsl(38_92%_50%/0.1)]"
            : "border-border/40 shadow-[0_0_25px_hsl(38_92%_50%/0.1)]"
        )}
      >
        <div>
          {!flipped && (
            <p className="text-xs text-muted-foreground/50 mb-3 uppercase tracking-wider">Term</p>
          )}
          {flipped && (
            <p className="text-xs text-accent/60 mb-3 uppercase tracking-wider">Definition</p>
          )}
          <p
            className={cn(
              "font-heading font-semibold leading-snug",
              flipped ? "text-base text-foreground/85" : "text-xl text-foreground"
            )}
          >
            {flipped ? card.definition : card.term}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  </div>
);

/* ── Dot trail progress ────────────────────────── */

const DotTrail = ({
  total,
  current,
  masteryMap,
}: {
  total: number;
  current: number;
  masteryMap: Map<string, Mastery>;
  cardIds: string[];
}) => {
  const maxDots = Math.min(total, 20);
  const step = total <= maxDots ? 1 : Math.floor(total / maxDots);
  const dots: number[] = [];
  for (let i = 0; i < total; i += step) dots.push(i);
  if (dots[dots.length - 1] !== total - 1) dots.push(total - 1);

  return (
    <div className="flex items-center gap-1 justify-center flex-wrap rtl:flex-row-reverse">
      {dots.map((idx) => (
        <div
          key={idx}
          className={cn(
            "rounded-full transition-all duration-200",
            idx === current
              ? "w-2.5 h-2.5 bg-primary"
              : "w-1.5 h-1.5",
            idx !== current && "bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
};

/* ── Main component ────────────────────────────── */

const FlashcardPlayer = ({ deckTitle, cards: initialCards, onExit }: FlashcardPlayerProps) => {
  const [cards, setCards] = useState(initialCards);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [masteryMap, setMasteryMap] = useState<Map<string, Mastery>>(new Map());
  const [shuffled, setShuffled] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Touch state for swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const card = cards[current];
  const total = cards.length;

  const gotItCount = useMemo(
    () => Array.from(masteryMap.values()).filter((m) => m === "got-it").length,
    [masteryMap]
  );
  const masteryPct = total > 0 ? Math.round((gotItCount / total) * 100) : 0;

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= total) return;
      setDirection(idx > current ? 1 : -1);
      setCurrent(idx);
      setFlipped(false);
    },
    [current, total]
  );

  const markMastery = useCallback(
    (level: Mastery) => {
      setMasteryMap((prev) => {
        const next = new Map(prev);
        next.set(card.id, level);
        return next;
      });
      // Advance
      if (current < total - 1) {
        setDirection(1);
        setCurrent((c) => c + 1);
        setFlipped(false);
      } else {
        setCompleted(true);
      }
    },
    [card, current, total]
  );

  const handleShuffle = useCallback(() => {
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setCurrent(0);
    setFlipped(false);
    setShuffled((s) => !s);
  }, [cards]);

  const restartDeck = useCallback(() => {
    setCards(initialCards);
    setCurrent(0);
    setFlipped(false);
    setMasteryMap(new Map());
    setCompleted(false);
  }, [initialCards]);

  const reviewWeak = useCallback(() => {
    const weak = cards.filter((c) => masteryMap.get(c.id) !== "got-it");
    if (weak.length === 0) return;
    setCards(weak);
    setCurrent(0);
    setFlipped(false);
    setMasteryMap(new Map());
    setCompleted(false);
  }, [cards, masteryMap]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (completed) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        markMastery("learning");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        markMastery("got-it");
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        markMastery("getting-there");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [completed, markMastery]);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientX - touchStart;
    if (Math.abs(diff) > 60) {
      if (diff < 0) markMastery("learning");
      else markMastery("got-it");
    }
    setTouchStart(null);
  };

  /* ── Completion screen ─────────────────────── */
  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto space-y-6 py-8"
      >
        <div className="glass rounded-xl p-8 text-center space-y-5">
          <MasteryRing pct={masteryPct} />
          <div className="space-y-1">
            <h2 className="text-xl font-heading font-bold">Deck Complete!</h2>
            <p className="text-xs text-muted-foreground">{deckTitle}</p>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-accent">{gotItCount}</p>
              <p className="text-[10px] text-muted-foreground">Mastered</p>
            </div>
            <div className="w-px bg-border/40" />
            <div className="text-center">
              <p className="text-lg font-bold text-muted-foreground">{total - gotItCount}</p>
              <p className="text-[10px] text-muted-foreground">Still Learning</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {total - gotItCount > 0 && (
            <button
              onClick={reviewWeak}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Review Weak Cards Only
            </button>
          )}
          <button
            onClick={restartDeck}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold bg-secondary/60 border border-border/40 text-foreground hover:bg-secondary transition-all"
          >
            <ArrowRight className="h-3.5 w-3.5" /> Restart Deck
          </button>
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
          >
            <FileDown className="h-3.5 w-3.5" /> Export as PDF
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── Player screen ──────────────────────────── */
  return (
    <div className="flex gap-6 max-w-5xl mx-auto">
      {/* Desktop sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="hidden lg:block overflow-hidden shrink-0"
          >
            <div className="glass rounded-xl p-3 h-full max-h-[70vh] overflow-auto space-y-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground">All Cards</p>
                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
              {cards.map((c, i) => {
                const m = masteryMap.get(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => goTo(i)}
                    className={cn(
                      "w-full text-left rtl:text-right rounded-lg px-2.5 py-1.5 text-[11px] transition-all flex items-center gap-2 rtl:flex-row-reverse",
                      i === current
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    {m === "got-it" && <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />}
                    {m === "getting-there" && <span className="w-3 h-3 shrink-0 text-center text-[10px]">😐</span>}
                    {m === "learning" && <span className="w-3 h-3 shrink-0 text-center text-[10px]">😅</span>}
                    {!m && <span className="w-3 h-3 shrink-0 rounded-full bg-muted" />}
                    <span className="truncate">{c.term}</span>
                  </button>
                );
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div
        className="flex-1 space-y-5 py-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between rtl:flex-row-reverse">
          <button onClick={onExit} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 rtl:flex-row-reverse">
            <ChevronLeft className="h-3 w-3 rtl:rotate-180" /> Back
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Card {current + 1} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
              title="Card list"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleShuffle}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                shuffled
                  ? "bg-accent/15 text-accent"
                  : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
              )}
              title="Shuffle"
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Dot trail */}
        <DotTrail total={total} current={current} masteryMap={masteryMap} cardIds={cards.map((c) => c.id)} />

        {/* Flip card */}
        <FlipCard
          card={card}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          direction={direction}
        />

        {/* Tap to flip hint */}
        <p className="text-center text-[10px] text-muted-foreground/40">
          {flipped ? "Tap to see term" : "Tap to reveal answer"} ·{" "}
          <kbd className="px-1 py-0.5 rounded bg-secondary/60 text-muted-foreground/60 text-[10px]">Space</kbd> to flip
        </p>

        {/* Mastery buttons */}
        <div className="flex gap-3 justify-center">
          {[
            { level: "learning" as Mastery, emoji: "😅", label: "Still Learning", key: "←" },
            { level: "getting-there" as Mastery, emoji: "😐", label: "Getting There", key: "↑" },
            { level: "got-it" as Mastery, emoji: "✅", label: "Got It", key: "→" },
          ].map((btn) => (
            <button
              key={btn.level}
              onClick={() => markMastery(btn.level)}
              className={cn(
                "flex-1 max-w-[140px] flex flex-col items-center gap-1 rounded-xl border p-3 transition-all duration-200",
                "glass border-border/30 hover:border-border/60",
                btn.level === "got-it" && "hover:border-emerald-500/40 hover:bg-emerald-500/5",
                btn.level === "learning" && "hover:border-red-500/30 hover:bg-red-500/5"
              )}
            >
              <span className="text-lg">{btn.emoji}</span>
              <span className="text-[10px] font-medium">{btn.label}</span>
              <kbd className="px-1 py-0.5 rounded bg-secondary/60 text-muted-foreground/50 text-[9px]">{btn.key}</kbd>
            </button>
          ))}
        </div>

        {/* Nav arrows */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            disabled={current === total - 1}
            className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardPlayer;
