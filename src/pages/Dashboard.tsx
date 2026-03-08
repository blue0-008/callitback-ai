import { motion } from "framer-motion";
import { Zap, BookOpen, HelpCircle, Layers, ArrowRight } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SubjectBadge from "@/components/SubjectBadge";
import { CardSkeleton } from "@/components/ContentSkeleton";
import { useNavigate } from "react-router-dom";

const quickActions = [
  { label: "Start Study Session", icon: BookOpen, path: "/study", color: "text-primary" },
  { label: "Take a Quiz", icon: HelpCircle, path: "/quiz", color: "text-emerald-400" },
  { label: "Review Flashcards", icon: Layers, path: "/flashcards", color: "text-accent" },
];

const recentSessions = [
  { title: "Organic Chemistry — Reaction Types", subject: "Chemistry", time: "2h ago", progress: 78 },
  { title: "World War II — Key Events", subject: "History", time: "5h ago", progress: 92 },
  { title: "Linear Algebra — Eigenvalues", subject: "Math", time: "Yesterday", progress: 45 },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <motion.div variants={item} className="space-y-1">
        <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Zap className="h-7 w-7 text-primary animate-pulse_glow" />
          Good evening, Student
        </h1>
        <p className="text-muted-foreground text-sm">Pick up where you left off or start something new.</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((a) => (
          <GlassCard
            key={a.label}
            onClick={() => navigate(a.path)}
            className="flex items-center gap-4 group"
          >
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <a.icon className={`h-5 w-5 ${a.color}`} />
            </div>
            <span className="text-sm font-medium">{a.label}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </GlassCard>
        ))}
      </motion.div>

      {/* Recent Sessions */}
      <motion.div variants={item} className="space-y-4">
        <h2 className="text-lg font-heading font-semibold">Recent Sessions</h2>
        <div className="grid gap-3">
          {recentSessions.map((s) => (
            <GlassCard key={s.title} className="flex items-center justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">{s.title}</p>
                <div className="flex items-center gap-2">
                  <SubjectBadge subject={s.subject} />
                  <span className="text-xs text-muted-foreground">{s.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{s.progress}%</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
