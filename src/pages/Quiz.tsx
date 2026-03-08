import { motion } from "framer-motion";
import { HelpCircle, Clock, CheckCircle2 } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { CardSkeleton } from "@/components/ContentSkeleton";

const sampleQuizzes = [
  { title: "Organic Chemistry Basics", questions: 15, duration: "12 min", completed: true },
  { title: "World History: 20th Century", questions: 20, duration: "18 min", completed: false },
  { title: "Calculus I — Limits & Derivatives", questions: 10, duration: "8 min", completed: false },
];

const Quiz = () => (
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

    <div className="grid gap-3">
      {sampleQuizzes.map((q) => (
        <GlassCard key={q.title} className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-2">
              {q.title}
              {q.completed && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{q.questions} questions</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {q.duration}</span>
            </div>
          </div>
          <button className="text-xs font-medium text-primary hover:underline transition-colors">
            {q.completed ? "Retake" : "Start"}
          </button>
        </GlassCard>
      ))}
    </div>
  </motion.div>
);

export default Quiz;
