import { motion } from "framer-motion";
import { BarChart3, Flame, Clock, Target, TrendingUp } from "lucide-react";
import GlassCard from "@/components/GlassCard";

const stats = [
  { label: "Study Streak", value: "12 days", icon: Flame, color: "text-accent" },
  { label: "Hours This Week", value: "8.5h", icon: Clock, color: "text-primary" },
  { label: "Quizzes Passed", value: "23", icon: Target, color: "text-emerald-400" },
  { label: "Cards Mastered", value: "142", icon: TrendingUp, color: "text-rose-400" },
];

const weeklyData = [
  { day: "Mon", hours: 1.5 },
  { day: "Tue", hours: 2.0 },
  { day: "Wed", hours: 0.5 },
  { day: "Thu", hours: 1.8 },
  { day: "Fri", hours: 2.2 },
  { day: "Sat", hours: 0.3 },
  { day: "Sun", hours: 0.2 },
];

const maxHours = Math.max(...weeklyData.map((d) => d.hours));

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const Progress = () => (
  <motion.div variants={container} initial="hidden" animate="show" className="max-w-4xl mx-auto space-y-8">
    <motion.div variants={item} className="space-y-1">
      <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-primary" /> Your Progress
      </h1>
      <p className="text-muted-foreground text-sm">Track your learning journey and stay consistent.</p>
    </motion.div>

    {/* Stats Grid */}
    <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((s) => (
        <GlassCard key={s.label} hover={false} className="text-center space-y-2">
          <s.icon className={`h-5 w-5 mx-auto ${s.color}`} />
          <p className="text-xl font-heading font-bold">{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </GlassCard>
      ))}
    </motion.div>

    {/* Weekly Chart */}
    <motion.div variants={item}>
      <GlassCard hover={false} className="space-y-4">
        <h2 className="text-sm font-heading font-semibold">This Week</h2>
        <div className="flex items-end justify-between gap-2 h-32">
          {weeklyData.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.hours / maxHours) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-full max-w-[28px] rounded-t-md bg-primary/70"
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  </motion.div>
);

export default Progress;
