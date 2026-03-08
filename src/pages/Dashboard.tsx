import { motion } from "framer-motion";
import { Zap, ArrowRight, Clock, PlayCircle, BookOpen } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SubjectBadge from "@/components/SubjectBadge";
import EmptyState from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { useCountUp } from "@/hooks/useCountUp";
import { getSessions, getStats, getContinueItem, type StudySession, type ContinueItem } from "@/lib/store";
import { getUserName } from "@/lib/userPrefs";
import { useState, useEffect } from "react";

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

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/* ── Component ─────────────────────────────────── */

const Dashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [continueItem, setContinueItem] = useState<ContinueItem | null>(null);
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    setSessions(getSessions());
    setContinueItem(getContinueItem());
    setStats(getStats());
  }, []);

  const recentSessions = sessions.slice(0, 4);
  const statsData = [
    { label: "Streak", numValue: stats.streak, suffix: " days", icon: "🔥" },
    { label: "Topics Studied", numValue: stats.topicsStudied, suffix: "", icon: "📚" },
    { label: "Quiz Avg", numValue: stats.quizScores.length > 0 ? Math.round(stats.quizScores.reduce((s, q) => s + q.score, 0) / stats.quizScores.length) : 0, suffix: "%", icon: "🧠" },
    { label: "Cards Mastered", numValue: stats.cardsMastered, suffix: "", icon: "🃏" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8">
      {/* Welcome banner */}
      <motion.div variants={item} className="glass rounded-xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5 pointer-events-none" />
        <div className="relative space-y-1">
          <p className="text-xs text-muted-foreground">{getFormattedDate()}</p>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            {getGreeting()} <Zap className="h-6 w-6 text-primary animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground">
            {stats.streak > 0 ? "Ready to sprint?" : "Start studying today to begin your streak 🔥"}
          </p>
        </div>
      </motion.div>

      {/* Count-up stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsData.map((s, i) => (
          <StatCard key={s.label} {...s} delay={200 + i * 100} />
        ))}
      </div>

      {/* Continue where you left off */}
      {continueItem && (
        <motion.div variants={item}>
          <GlassCard className="flex items-center justify-between group" onClick={() => navigate(continueItem.path)}>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <PlayCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Continue where you left off</p>
                <p className="text-sm font-medium">{continueItem.topic}</p>
                <div className="flex items-center gap-2">
                  <SubjectBadge subject={continueItem.subject} />
                  <span className="text-[10px] text-muted-foreground">
                    {continueItem.type === "quiz" ? "Quiz" : "Flashcards"} · {continueItem.progress}/{continueItem.total}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(continueItem.progress / continueItem.total) * 100}%` }} />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Recent sessions */}
      <motion.div variants={item} className="space-y-4">
        <h2 className="text-lg font-heading font-semibold">Recent Sessions</h2>
        {recentSessions.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-8 w-8 text-primary/40" />}
            title="No sessions yet"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentSessions.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * i }}
              >
                <GlassCard className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-medium leading-snug pr-2">{s.topic}</p>
                    {s.score != null && <span className="shrink-0 text-xs font-bold text-primary">{s.score}%</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <SubjectBadge subject={s.subject} />
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> {new Date(s.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70">{s.type}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick-start CTA */}
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
