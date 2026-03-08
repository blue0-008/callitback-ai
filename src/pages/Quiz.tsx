import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Clock, CheckCircle2, Timer, TimerOff } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import QuizPlayer, { type QuizQuestion } from "@/components/QuizPlayer";
import { cn } from "@/lib/utils";

/* ── Sample quiz data ──────────────────────────── */

const sampleQuestions: QuizQuestion[] = [
  {
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
    correctIndex: 1,
    explanation:
      "Mitochondria are often called the powerhouse of the cell because they generate most of the cell's supply of ATP, the main energy currency.",
  },
  {
    question: "Which type of bond involves the sharing of electron pairs between atoms?",
    options: ["Ionic bond", "Hydrogen bond", "Covalent bond", "Metallic bond"],
    correctIndex: 2,
    explanation:
      "A covalent bond is formed when two atoms share one or more pairs of electrons. This is distinct from ionic bonds, where electrons are transferred.",
  },
  {
    question: "What is the process by which plants convert light energy into chemical energy?",
    options: ["Cellular respiration", "Fermentation", "Photosynthesis", "Glycolysis"],
    correctIndex: 2,
    explanation:
      "Photosynthesis is the process used by plants and other organisms to convert light energy into chemical energy stored in glucose.",
  },
  {
    question: "Which organelle is responsible for protein synthesis?",
    options: ["Lysosome", "Ribosome", "Vacuole", "Endoplasmic reticulum"],
    correctIndex: 1,
    explanation:
      "Ribosomes are molecular machines that translate messenger RNA (mRNA) into polypeptide chains, which fold into functional proteins.",
  },
  {
    question: "What phase of mitosis involves the alignment of chromosomes at the cell's equator?",
    options: ["Prophase", "Metaphase", "Anaphase", "Telophase"],
    correctIndex: 1,
    explanation:
      "During metaphase, chromosomes align along the metaphase plate (the cell's equator), ensuring each daughter cell receives one copy of each chromosome.",
  },
];

const sampleQuizzes = [
  { id: "chem", title: "Organic Chemistry Basics", questions: 15, duration: "12 min", completed: true },
  { id: "hist", title: "World History: 20th Century", questions: 20, duration: "18 min", completed: false },
  { id: "calc", title: "Calculus I — Limits & Derivatives", questions: 10, duration: "8 min", completed: false },
];

const Quiz = () => {
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(sampleQuestions);
  const [timerEnabled, setTimerEnabled] = useState(true);

  if (activeQuiz) {
    const quiz = sampleQuizzes.find((q) => q.id === activeQuiz);
    return (
      <QuizPlayer
        title={quiz?.title ?? "Quiz"}
        questions={quizQuestions}
        timerEnabled={timerEnabled}
        onExit={() => setActiveQuiz(null)}
        onRetryWrong={(wrong) => {
          setQuizQuestions(wrong);
          setActiveQuiz(activeQuiz); // force re-render via key
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-emerald-400" /> Quiz Arena
          </h1>
          <p className="text-muted-foreground text-sm">Test your knowledge with AI-generated quizzes.</p>
        </div>
        <button
          onClick={() => setTimerEnabled(!timerEnabled)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-all",
            timerEnabled
              ? "bg-accent/10 border-accent/30 text-accent"
              : "bg-secondary/50 border-border/40 text-muted-foreground"
          )}
        >
          {timerEnabled ? <Timer className="h-3.5 w-3.5" /> : <TimerOff className="h-3.5 w-3.5" />}
          {timerEnabled ? "Timer On" : "Timer Off"}
        </button>
      </div>

      <div className="grid gap-3">
        {sampleQuizzes.map((q) => (
          <GlassCard
            key={q.id}
            className="flex items-center justify-between"
            onClick={() => {
              setQuizQuestions(sampleQuestions);
              setActiveQuiz(q.id);
            }}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center gap-2">
                {q.title}
                {q.completed && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{q.questions} questions</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {q.duration}
                </span>
              </div>
            </div>
            <span className="text-xs font-medium text-primary hover:underline transition-colors">
              {q.completed ? "Retake" : "Start"}
            </span>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
};

export default Quiz;
