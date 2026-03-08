import { motion } from "framer-motion";
import { Zap, ArrowRight, Clock, PlayCircle } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SubjectBadge from "@/components/SubjectBadge";
import { useNavigate } from "react-router-dom";
import { useCountUp } from "@/hooks/useCountUp";

/* ── Data ──────────────────────────────────────── */

const statsData = [
  { label: "Streak", numValue: 5, suffix: " days", icon: "🔥" },
  { label: "Topics Studied", numValue: 12, suffix: "", icon: "📚" },
  { label: "Quiz Avg", numValue: 78, suffix: "%", icon: "🧠" },
  { label: "Cards Mastered", numValue: 47, suffix: "", icon: "🃏" },
];

const recentSessions = [
  { topic: "Organic Chemistry — Reaction Types", subject: "Chemistry", date: "Today, 2:30 PM", type: "Summary + Quiz", score: 85 },
  { topic: "World War II — Key Events", subject: "History", date: "Today, 10:15 AM", type: "Flashcards", score: null },
  { topic: "Linear Algebra — Eigenvalues", subject: "Math", date: "Yesterday", type: "Quiz", score: 72 },
  { topic: "Cell Biology — Organelles", subject: "Biology", date: "2 days ago", type: "Summary", score: null },
];

const continueItem = {
  topic: "Organic Chemistry — Reaction Types",
  subject: "Chemistry",
  type: "quiz" as const,
  progress: 3,
  total: 10,
  path: "/quiz",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

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
      <p className="text-lg font-heading font-bold">{count}{suffix}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </motion.div>
  );
};

/* ── Animations ────────────────────────────────── */

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

/* ── Component ─────────────────────────────────── */

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8">
      {/* Welcome banner */}
      <motion.div variants={item} className="glass rounded-xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/5 pointer-events-none" />
        <div className="relative space-y-1">
          <p className="text-xs text-muted-foreground">{getFormattedDate()}</p>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            {getGreeting()}, Student <Zap className="h-6 w-6 text-primary animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground">Ready to sprint?</p>
        </div>
      </motion.div>

      {/* Count-up stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statsData.map((s, i) => (
          <StatCard key={s.label} {...s} delay={200 + i * 100} />
        ))}
      </div>

      {/* Continue where you left off */}
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

      {/* Recent sessions */}
      <motion.div variants={item} className="space-y-4">
        <h2 className="text-lg font-heading font-semibold">Recent Sessions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recentSessions.map((s, i) => (
            <motion.div
              key={s.topic}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
            >
              <GlassCard className="space-y-2.5">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium leading-snug pr-2">{s.topic}</p>
                  {s.score !== null && <span className="shrink-0 text-xs font-bold text-primary">{s.score}%</span>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <SubjectBadge subject={s.subject} />
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {s.date}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/70">{s.type}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
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
