import { motion } from "framer-motion";
import { Zap, ArrowRight, BookOpen, Flame } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SubjectBadge from "@/components/SubjectBadge";
import EmptyState from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { useCountUp } from "@/hooks/useCountUp";
import { getSessions, getStats, getDecks, getQuizzes, type StudySession } from "@/lib/store";
import { getUserName } from "@/lib/userPrefs";
import { useState, useEffect, useMemo } from "react";

/* ── Animated stat card ────────────────────────── */

const StatCard = ({ label, numValue, suffix, icon, delay }: { label: string; numValue: number; suffix: string; icon: string; delay: number }) => {
  const count = useCountUp(numValue, 1000, delay);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay / 1000 }}
      className="glass rounded-xl p-4 text-center space-y-1"
    >
      <span className="text-xl">{icon}</span>
      <p className="text-lg font-heading font-bold">{numValue === 0 ? "--" : `${count}${suffix}`}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </motion.div>
  );
};

/* ── Animations ────────────────────────────────── */

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ── Component ─────────────────────────────────── */

const Dashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    setSessions(getSessions());
    setStats(getStats());
  }, []);

  // Sessions this week
  const sessionsThisWeek = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return sessions.filter(s => new Date(s.date) >= startOfWeek).length;
  }, [sessions]);

  // Last 3 items from localStorage (sessions as continue items)
  const continueItems = useMemo(() => {
    return sessions.slice(0, 3);
  }, [sessions]);

  // Weak spots: quiz sessions with score < 70%
  const weakSpots = useMemo(() => {
    return sessions
      .filter(s => s.type === "quiz" || s.type === "summary + quiz")
      .filter(s => s.score != null && s.score < 70)
      .slice(0, 6);
  }, [sessions]);

  const quickStats = [
    { label: "Sessions This Week", numValue: sessionsThisWeek, suffix: "", icon: "📊" },
    { label: "Quizzes Taken", numValue: stats.totalQuizzesTaken, suffix: "", icon: "🧠" },
    { label: "Cards Mastered", numValue: stats.cardsMastered, suffix: "", icon: "🃏" },
    { label: "Best Streak", numValue: stats.bestStreak, suffix: " days", icon: "🏆" },
  ];

  const typeRoute: Record<string, string> = {
    summary: "/library",
    quiz: "/quiz",
    flashcards: "/flashcards",
    "summary + quiz": "/quiz",
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8">
      {/* Greeting + Streak */}
      <motion.div variants={item} className="glass rounded-xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5 pointer-events-none" />
        <div className="relative space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            {getGreeting()}, {getUserName() || "Hey there"} <Zap className="h-6 w-6 text-primary animate-pulse" />
          </h1>
          {stats.streak > 0 ? (
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-semibold text-foreground">🔥 {stats.streak} day streak</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Start studying today to begin your streak 🔥</p>
          )}
        </div>
      </motion.div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickStats.map((s, i) => (
          <StatCard key={s.label} {...s} delay={200 + i * 100} />
        ))}
      </div>

      {/* Two columns: Continue Studying + Weak Spots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT — Continue Studying */}
        <motion.div variants={item} className="space-y-3">
          <h2 className="text-lg font-heading font-semibold">Continue Studying</h2>
          {continueItems.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8 text-primary/40" />}
              title="Nothing yet"
              description="Start your first sprint! ⚡"
              action={
                <button
                  onClick={() => navigate("/study")}
                  className="mt-2 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-all"
                >
                  <Zap className="h-3.5 w-3.5" /> Go to Study
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {continueItems.map((s) => (
                <GlassCard
                  key={s.id}
                  className="flex items-center justify-between py-3 px-4"
                  onClick={() => navigate(typeRoute[s.type] || "/study")}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SubjectBadge subject={s.subject} />
                    <span className="text-sm font-medium truncate">{s.topic}</span>
                  </div>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1 shrink-0">
                    Continue <ArrowRight className="h-3 w-3" />
                  </span>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>

        {/* RIGHT — Weak Spots */}
        <motion.div variants={item} className="space-y-3">
          <h2 className="text-lg font-heading font-semibold">Weak Spots 🎯</h2>
          {weakSpots.length === 0 ? (
            <div className="glass rounded-lg p-6 text-center space-y-1">
              <p className="text-sm text-muted-foreground">No weak spots yet. Keep it up! 💪</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {weakSpots.map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/study?topic=${encodeURIComponent(s.topic)}`)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
                >
                  {s.topic} — {s.score}%
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Big CTA */}
      <motion.div variants={item}>
        <button
          onClick={() => navigate("/study")}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground hover:shadow-[0_0_40px_hsl(239_84%_67%/0.35)] hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Zap className="h-4 w-4" /> Start a New Sprint ⚡
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
