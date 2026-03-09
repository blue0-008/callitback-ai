import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { RotateCcw, ArrowRight, Layers, Trophy } from "lucide-react";

/* ── Types ─────────────────────────────────────── */

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizPlayerProps {
  title: string;
  questions: QuizQuestion[];
  timerEnabled?: boolean;
  timerSeconds?: number;
  onExit: () => void;
  onRetryWrong?: (wrong: QuizQuestion[]) => void;
}

/* ── Confetti burst (lightweight, no deps) ─────── */

function spawnConfetti(container: HTMLDivElement) {
  const colors = ["#6366F1", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    const size = Math.random() * 6 + 4;
    el.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      left:50%;top:50%;pointer-events:none;z-index:50;
    `;
    container.appendChild(el);
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 200 + 100;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 150;
    el.animate(
      [
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 },
      ],
      { duration: 800 + Math.random() * 400, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }
    );
    setTimeout(() => el.remove(), 1300);
  }
}

/* ── Grade helpers ─────────────────────────────── */

function getGrade(pct: number) {
  if (pct === 100) return { emoji: "🏆", label: "Perfect" };
  if (pct >= 80) return { emoji: "🔥", label: "Excellent" };
  if (pct >= 50) return { emoji: "👍", label: "Good" };
  return { emoji: "😬", label: "Needs Work" };
}

/* ── Progress ring ─────────────────────────────── */

const ProgressRing = ({ pct }: { pct: number }) => {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="140" height="140" className="mx-auto">
      <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(228 14% 18%)" strokeWidth="10" />
      <motion.circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke="hsl(38 92% 50%)"
        strokeWidth="10"
        strokeLinecap="round"
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

/* ── Main component ────────────────────────────── */

const QuizPlayer = ({
  title,
  questions,
  timerEnabled = true,
  timerSeconds = 30,
  onExit,
  onRetryWrong,
}: QuizPlayerProps) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [phase, setPhase] = useState<"answering" | "revealed">("answering");
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const confettiRef = useRef<HTMLDivElement>(null);

  const q = questions[current];
  const total = questions.length;
  const isLast = current === total - 1;

  // Timer
  useEffect(() => {
    if (!timerEnabled || phase !== "answering") return;
    setTimeLeft(timerSeconds);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          // Auto-submit with no answer
          handleSelect(-1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, phase, timerEnabled]);

  const handleSelect = useCallback(
    (idx: number) => {
      if (phase !== "answering") return;
      const answerIdx = idx === -1 ? null : idx;
      setSelected(answerIdx);
      setPhase("revealed");
      setAnswers((prev) => [...prev, answerIdx]);

      if (answerIdx === q.correctIndex && confettiRef.current) {
        spawnConfetti(confettiRef.current);
      }
    },
    [phase, q]
  );

  const handleNext = useCallback(() => {
    if (phase !== "revealed") return;
    if (isLast) {
      setShowResult(true);
      // Confetti on completion if score > 80%
      const finalCorrect = [...answers, selected].filter((a, i) => a === questions[i]?.correctIndex).length;
      const finalPct = Math.round((finalCorrect / total) * 100);
      if (finalPct > 80 && confettiRef.current) {
        setTimeout(() => {
          if (confettiRef.current) {
            for (let burst = 0; burst < 3; burst++) {
              setTimeout(() => confettiRef.current && spawnConfetti(confettiRef.current), burst * 200);
            }
          }
        }, 400);
      }
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setPhase("answering");
    }
  }, [phase, isLast, answers, selected, questions, total]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showResult) return;
      if (phase === "answering") {
        const num = parseInt(e.key);
        if (num >= 1 && num <= (q?.options.length ?? 0)) {
          handleSelect(num - 1);
        }
      }
      if (phase === "revealed" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, showResult, q, handleSelect, handleNext]);

  // Score calculations
  const correctCount = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
  const wrongCount = total - correctCount;
  const pct = Math.round((correctCount / total) * 100);
  const grade = getGrade(pct);

  const wrongQuestions = questions.filter((_, i) => answers[i] !== questions[i]?.correctIndex);

  /* ── Results screen ─────────────────────────── */
  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md mx-auto space-y-6 py-8"
      >
        <div className="glass rounded-xl p-8 text-center space-y-5">
          <ProgressRing pct={pct} />
          <div className="space-y-1">
            <p className="text-3xl">{grade.emoji}</p>
            <h2 className="text-xl font-heading font-bold">{grade.label}</h2>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-400">{correctCount}</p>
              <p className="text-[10px] text-muted-foreground">Correct</p>
            </div>
            <div className="w-px bg-border/40" />
            <div className="text-center">
              <p className="text-lg font-bold text-red-400">{wrongCount}</p>
              <p className="text-[10px] text-muted-foreground">Wrong</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {wrongCount > 0 && onRetryWrong && (
            <button
              onClick={() => onRetryWrong(wrongQuestions)}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry Wrong Answers Only
            </button>
          )}
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold bg-secondary/60 border border-border/40 text-foreground hover:bg-secondary transition-all"
          >
            <ArrowRight className="h-3.5 w-3.5" /> New Quiz
          </button>
          <button
            onClick={onExit}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
          >
            <Layers className="h-3.5 w-3.5" /> View Flashcards from this topic
          </button>
        </div>
      </motion.div>
    );
  }

  /* ── Question screen ────────────────────────── */
  const letters = ["A", "B", "C", "D"];

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4 relative" ref={confettiRef}>
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Question {current + 1} of {total}</span>
          <span className="font-medium">{title}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${((current + 1) / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Timer bar */}
      {timerEnabled && phase === "answering" && (
        <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full transition-colors",
              timeLeft > 10 ? "bg-accent" : "bg-red-500"
            )}
            initial={{ width: "100%" }}
            animate={{ width: `${(timeLeft / timerSeconds) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="glass rounded-xl p-6 sm:p-8">
            <p className="font-heading font-semibold text-foreground" style={{ fontSize: "1.5rem", lineHeight: 1.4 }}>
              {q.question}
            </p>
          </div>

          {/* Answer options — 2x2 grid on desktop, stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {q.options.map((opt, i) => {
              const isSelected = selected === i;
              const isCorrect = i === q.correctIndex;
              const revealed = phase === "revealed";

              let cardClass = "glass border-border/40 hover:border-primary/40 hover:bg-primary/5";
              if (revealed) {
                if (isCorrect) {
                  cardClass = "border-emerald-500/60 bg-emerald-500/10";
                } else if (isSelected && !isCorrect) {
                  cardClass = "border-red-500/60 bg-red-500/10";
                } else {
                  cardClass = "glass border-border/20 opacity-50";
                }
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={revealed}
                  initial={revealed && (isSelected || isCorrect) ? { scale: 1 } : undefined}
                  animate={
                    revealed && isSelected && !isCorrect
                      ? { x: [0, -6, 6, -4, 4, 0] }
                      : revealed && isCorrect
                      ? { scale: [1, 1.03, 1] }
                      : undefined
                  }
                  transition={{ duration: 0.4 }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer",
                    "disabled:cursor-default",
                    cardClass
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
                      revealed && isCorrect
                        ? "bg-emerald-500/20 text-emerald-400"
                        : revealed && isSelected && !isCorrect
                        ? "bg-red-500/20 text-red-400"
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {letters[i]}
                  </span>
                  <span className="text-sm font-medium">{opt}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation + next */}
          <AnimatePresence>
            {phase === "revealed" && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="space-y-4"
              >
                <div className="glass rounded-lg p-4 border-l-2 border-primary/40">
                  <p className="text-xs font-semibold text-primary mb-1">Explanation</p>
                  <p className="text-xs text-foreground/75 leading-relaxed">{q.explanation}</p>
                </div>
                <button
                  onClick={handleNext}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-300",
                    "bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground",
                    "hover:shadow-[0_0_30px_hsl(38_92%_50%/0.3)] hover:scale-[1.01]"
                  )}
                >
                  {isLast ? (
                    <>
                      <Trophy className="h-4 w-4" /> See Results
                    </>
                  ) : (
                    <>
                      Next Question <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-muted-foreground/50">
                  Press <kbd className="px-1 py-0.5 rounded bg-secondary/60 text-muted-foreground text-[10px]">Space</kbd> to continue
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Keyboard hint */}
      {phase === "answering" && (
        <p className="text-center text-[10px] text-muted-foreground/40">
          Press <kbd className="px-1 py-0.5 rounded bg-secondary/60 text-muted-foreground/60 text-[10px]">1</kbd>–
          <kbd className="px-1 py-0.5 rounded bg-secondary/60 text-muted-foreground/60 text-[10px]">4</kbd> to answer
        </p>
      )}
    </div>
  );
};

export default QuizPlayer;
