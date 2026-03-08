import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Clock, CheckCircle2, Timer, TimerOff } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import EmptyState from "@/components/EmptyState";
import QuizPlayer, { type QuizQuestion } from "@/components/QuizPlayer";
import { getQuizzes, type SavedQuiz } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const Quiz = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [timerEnabled, setTimerEnabled] = useState(true);

  useEffect(() => {
    setQuizzes(getQuizzes());
  }, []);

  if (activeQuiz) {
    const quiz = quizzes.find((q) => q.id === activeQuiz);
    return (
      <QuizPlayer
        title={quiz?.title ?? "Quiz"}
        questions={quizQuestions}
        timerEnabled={timerEnabled}
        onExit={() => { setActiveQuiz(null); setQuizzes(getQuizzes()); }}
        onRetryWrong={(wrong) => {
          setQuizQuestions(wrong);
          setActiveQuiz(activeQuiz);
        }}
      />
    );
  }

  if (quizzes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-emerald-400" /> Quiz Arena
          </h1>
          <p className="text-muted-foreground text-sm">Test your knowledge with AI-generated quizzes.</p>
        </div>
        <EmptyState
          icon={<HelpCircle className="h-8 w-8 text-emerald-400/40" />}
          title="No quizzes yet"
          description="Head to Study to generate one 🧠"
          action={
            <button
              onClick={() => navigate("/study")}
              className="mt-2 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all"
            >
              Go to Study
            </button>
          }
        />
      </motion.div>
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
        {quizzes.map((q) => (
          <GlassCard
            key={q.id}
            className="flex items-center justify-between"
            onClick={() => {
              // Quiz question data would be loaded from localStorage
              setQuizQuestions([]);
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
