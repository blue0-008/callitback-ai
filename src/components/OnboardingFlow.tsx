import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronLeft, Check, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  completeOnboarding,
  setPreferredMethods,
  setUserName,
} from "@/lib/userPrefs";

/* ── Confetti (reuse pattern from QuizPlayer) ──── */

function spawnConfetti(container: HTMLDivElement) {
  const colors = ["#6366F1", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];
  for (let i = 0; i < 50; i++) {
    const el = document.createElement("div");
    const size = Math.random() * 6 + 4;
    el.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      left:50%;top:40%;pointer-events:none;z-index:50;
    `;
    container.appendChild(el);
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 250 + 120;
    const dx = Math.cos(angle) * velocity;
    const dy = Math.sin(angle) * velocity - 200;
    el.animate(
      [
        { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`,
          opacity: 0,
        },
      ],
      {
        duration: 900 + Math.random() * 400,
        easing: "cubic-bezier(.2,.8,.3,1)",
        fill: "forwards",
      }
    );
    setTimeout(() => el.remove(), 1400);
  }
}

/* ── Subject data ──────────────────────────────── */

const ALL_SUBJECTS = [
  { emoji: "📐", name: "Math" },
  { emoji: "🔬", name: "Science" },
  { emoji: "⚗️", name: "Chemistry" },
  { emoji: "🧬", name: "Biology" },
  { emoji: "📜", name: "History" },
  { emoji: "🌍", name: "Geography" },
  { emoji: "💻", name: "Computer Science" },
  { emoji: "📖", name: "Literature" },
  { emoji: "🗣️", name: "Languages" },
  { emoji: "⚖️", name: "Law" },
  { emoji: "💰", name: "Economics" },
  { emoji: "🎨", name: "Art" },
  { emoji: "🎵", name: "Music" },
  { emoji: "🏋️", name: "Other" },
];

const STUDY_STYLES = [
  {
    key: "quiz",
    emoji: "🧠",
    label: "Quizzes",
    desc: "Test yourself until it sticks",
  },
  {
    key: "flashcards",
    emoji: "🃏",
    label: "Flashcards",
    desc: "Flip through key concepts",
  },
  {
    key: "summaries",
    emoji: "📋",
    label: "Summaries",
    desc: "Read the key points fast",
  },
] as const;

const TIPS = [
  "💡 Tip: Paste any text to instantly generate a quiz",
  "💡 Tip: Press F for Focus Mode while studying",
  "💡 Tip: Study daily to build your streak 🔥",
];

/* ── Step dots ─────────────────────────────────── */

const StepDots = ({ total, current }: { total: number; current: number }) => (
  <div className="flex items-center gap-2 justify-center">
    {Array.from({ length: total }, (_, i) => (
      <motion.div
        key={i}
        animate={{
          width: i === current ? 10 : 6,
          height: i === current ? 10 : 6,
          opacity: i === current ? 1 : i < current ? 0.6 : 0.25,
        }}
        className={cn(
          "rounded-full transition-colors",
          i <= current ? "bg-primary" : "bg-muted-foreground/30"
        )}
      />
    ))}
  </div>
);

/* ── Slide variants ────────────────────────────── */

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
};

/* ── Main Component ────────────────────────────── */

interface OnboardingFlowProps {
  onComplete: () => void;
}

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState("");
  const [preferredMethods, setPreferredMethodsState] = useState<Set<string>>(new Set());
  const confettiRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const TOTAL_STEPS = 4;

  const next = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const back = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const skip = useCallback(() => {
    completeOnboarding();
    onComplete();
  }, [onComplete]);

  const finish = useCallback(() => {
    setUserName(name.trim() || "");
    setPreferredMethods(Array.from(preferredMethods));
    completeOnboarding();
    onComplete();
    navigate("/study");
  }, [name, preferredMethods, onComplete, navigate]);

  const togglePreferredMethod = useCallback((method: string) => {
    setPreferredMethodsState((prev) => {
      const next = new Set(prev);
      if (next.has(method)) next.delete(method);
      else next.add(method);
      return next;
    });
  }, []);

  // Focus input on step 1
  useEffect(() => {
    if (step === 1) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [step]);

  // Confetti on final step
  useEffect(() => {
    if (step === 3 && confettiRef.current) {
      setTimeout(() => {
        if (confettiRef.current) {
          for (let burst = 0; burst < 3; burst++) {
            setTimeout(
              () => confettiRef.current && spawnConfetti(confettiRef.current),
              burst * 200
            );
          }
        }
      }, 300);
    }
  }, [step]);

  const displayName = name.trim() || "there";
  const initial = name.trim() ? name.trim()[0].toUpperCase() : "?";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4"
      ref={confettiRef}
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      {/* Step dots (hidden on step 0) */}
      {step > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-1/2 -translate-x-1/2"
        >
          <StepDots total={TOTAL_STEPS} current={step} />
        </motion.div>
      )}

      {/* Back button */}
      {step >= 2 && step <= 3 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={back}
          className="absolute top-8 left-6 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </motion.button>
      )}

      {/* Steps */}
      <div className="relative w-full max-w-lg">
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <motion.div
              key="step0"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <motion.div
                initial={{ y: -60, opacity: 0, scale: 0.5 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
                className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center"
              >
                <Zap className="h-10 w-10 text-primary" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="space-y-3"
              >
                <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">
                  Welcome to <span className="text-primary glow-text">StudySprint AI</span>
                </h1>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  The smartest way to study anything. Let's get you set up in 30 seconds.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.3 }}
                className="space-y-3"
              >
                <button
                  onClick={next}
                  className="flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground hover:shadow-[0_0_40px_hsl(38_92%_50%/0.35)] hover:scale-[1.02]"
                >
                  Let's Go →
                </button>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.3 }}
                onClick={skip}
                className="absolute bottom-4 right-4 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                Skip for now
              </motion.button>
            </motion.div>
          )}

          {/* STEP 1 — Name */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="glass rounded-2xl p-8 sm:p-10 w-full max-w-md space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-heading font-bold">What should we call you?</h2>
                  <p className="text-xs text-muted-foreground">We'll personalize your dashboard</p>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  placeholder="e.g. Alex"
                  className="w-full bg-secondary/60 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors text-center"
                  maxLength={30}
                />

                <button
                  onClick={next}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(38_92%_50%/0.3)] hover:scale-[1.01]"
                >
                  Continue →
                </button>
              </div>

              <button
                onClick={skip}
                className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {/* STEP 2 — Study style */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-heading font-bold">What's your go-to study style?</h2>
                <p className="text-xs text-muted-foreground">
                  Pick as many as you like — you can always change this later
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
                {STUDY_STYLES.map((s) => {
                  const selected = preferredMethods.has(s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => togglePreferredMethod(s.key)}
                      className={cn(
                        "glass rounded-xl p-5 text-center border transition-all duration-200 space-y-2 relative",
                        selected
                          ? "border-primary/60 bg-primary/10 shadow-[0_0_20px_hsl(38_92%_50%/0.2)]"
                          : "border-border/30 hover:border-border/60 hover:bg-secondary/30"
                      )}
                      aria-pressed={selected}
                    >
                      {selected && (
                        <span className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                      <span className="text-2xl">{s.emoji}</span>
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {preferredMethods.size > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    onClick={next}
                    className="flex items-center justify-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(38_92%_50%/0.3)] hover:scale-[1.01]"
                  >
                    Continue →
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* STEP 3 — All set! */}
          {step === 3 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-6"
            >
              {/* Avatar with initial */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
                className="relative"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-3xl font-heading font-bold text-foreground shadow-[0_0_40px_hsl(38_92%_50%/0.25)]">
                  {initial}
                </div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-primary/20"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-heading font-bold">
                  You're ready, {displayName}! ⚡
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your study space is set up. Time to sprint.
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={finish}
                className="flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground hover:shadow-[0_0_40px_hsl(38_92%_50%/0.35)] hover:scale-[1.02]"
              >
                <Zap className="h-4 w-4" /> Start Studying →
              </motion.button>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="flex flex-col gap-2 items-center"
              >
                {TIPS.map((tip, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-muted-foreground/60 bg-secondary/40 rounded-full px-3 py-1"
                  >
                    {tip}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
