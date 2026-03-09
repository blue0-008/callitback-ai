import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Flame, BookOpen, Layers, HelpCircle } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { getStats, type UserStats } from "@/lib/store";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

/* ── Heatmap helpers ──────────────────────────── */

const dayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"];

function heatColor(count: number) {
  if (count === 0) return "bg-muted/40";
  if (count <= 1) return "bg-primary/20";
  if (count <= 3) return "bg-primary/45";
  return "bg-primary/80";
}

function buildHeatmapWeeks(heatmap: Record<string, number>): number[][] {
  const weeks: number[][] = [];
  const today = new Date();
  // Go back 7 weeks
  for (let w = 6; w >= 0; w--) {
    const week: number[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + (6 - d)));
      const key = date.toISOString().slice(0, 10);
      week.push(heatmap[key] || 0);
    }
    weeks.push(week);
  }
  return weeks;
}

const SUBJECT_COLORS = [
  "hsl(38, 92%, 50%)",
  "hsl(38, 92%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(25, 95%, 53%)",
  "hsl(187, 85%, 53%)",
  "hsl(330, 80%, 60%)",
];

/* ── Animation ─────────────────────────────────── */

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/* ── Custom tooltip ────────────────────────────── */

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs border border-border/40 shadow-xl">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{payload[0].value}%</p>
    </div>
  );
};

/* ── Component ─────────────────────────────────── */

const Progress = () => {
  const [stats, setStats] = useState<UserStats>(getStats());

  useEffect(() => {
    setStats(getStats());
  }, []);

  const heatmapWeeks = buildHeatmapWeeks(stats.heatmap);
  const hasData = stats.totalSessions > 0;
  const hasQuizData = stats.quizScores.length > 0;
  const hasSubjectData = Object.keys(stats.subjectTime).length > 0;
  const hasDeckData = stats.deckMastery.length > 0;

  const subjectBreakdown = Object.entries(stats.subjectTime).map(([name, value], i) => ({
    name,
    value,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));

  const totalSubjectTime = subjectBreakdown.reduce((s, e) => s + e.value, 0);

  const allTimeStats = [
    { label: "Total Sessions", value: stats.totalSessions > 0 ? String(stats.totalSessions) : "--", icon: BookOpen, color: "text-primary" },
    { label: "Cards Reviewed", value: stats.totalCardsReviewed > 0 ? String(stats.totalCardsReviewed) : "--", icon: Layers, color: "text-accent" },
    { label: "Quizzes Taken", value: stats.totalQuizzesTaken > 0 ? String(stats.totalQuizzesTaken) : "--", icon: HelpCircle, color: "text-emerald-400" },
    { label: "Best Streak", value: stats.bestStreak > 0 ? `${stats.bestStreak} days` : "--", icon: Flame, color: "text-accent" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8">
      {/* Header + streak */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" /> Your Progress
          </h1>
          <p className="text-muted-foreground text-sm">Track your learning journey and stay consistent.</p>
        </div>
        <div className="glass rounded-xl px-5 py-3 flex items-center gap-3 border border-accent/20">
          <motion.div
            animate={stats.streak > 0 ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="text-2xl"
          >
            🔥
          </motion.div>
          <div>
            <p className="text-xl font-heading font-bold text-accent">{stats.streak}</p>
            <p className="text-[10px] text-muted-foreground">Day Streak</p>
          </div>
        </div>
      </motion.div>

      {/* All-time stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {allTimeStats.map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 text-center space-y-1.5">
            <s.icon className={cn("h-5 w-5 mx-auto", s.color)} />
            <p className="text-lg font-heading font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Heatmap */}
      <motion.div variants={item}>
        <GlassCard hover={false} className="space-y-3">
          <h2 className="text-sm font-heading font-semibold">Weekly Activity</h2>
          <div className="flex gap-4 rtl:flex-row-reverse">
            <div className="flex flex-col gap-[3px] text-[9px] text-muted-foreground/60 pt-0.5 rtl:text-right">
              {dayLabels.map((l, i) => (
                <div key={i} className="h-[14px] flex items-center">{l}</div>
              ))}
            </div>
            <div className="flex gap-[3px] rtl:flex-row-reverse">
              {heatmapWeeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((count, di) => (
                    <div
                      key={di}
                      className={cn("w-[14px] h-[14px] rounded-sm transition-colors", heatColor(count))}
                      title={`${count} sessions`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground/50 rtl:flex-row-reverse">
            <span>Less</span>
            {[0, 1, 2, 4].map((c) => (
              <div key={c} className={cn("w-[10px] h-[10px] rounded-sm", heatColor(c))} />
            ))}
            <span>More</span>
          </div>
        </GlassCard>
      </motion.div>

      {/* Charts row */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quiz scores line chart */}
        <GlassCard hover={false} className="space-y-3">
          <h2 className="text-sm font-heading font-semibold">Quiz Scores Over Time</h2>
          {hasQuizData ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.quizScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 18%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220 10% 54%)" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(220 10% 54%)" }} axisLine={false} tickLine={false} />
                  <RTooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(38 92% 50%)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(38 92% 50%)" }}
                    activeDot={{ r: 5, stroke: "hsl(38 92% 50%)", strokeWidth: 2, fill: "hsl(228 14% 7%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={<HelpCircle className="h-8 w-8 text-primary/40" />}
              title="No quiz data yet"
              description="Complete your first quiz to see progress"
            />
          )}
        </GlassCard>

        {/* Subject donut chart */}
        <GlassCard hover={false} className="space-y-3">
          <h2 className="text-sm font-heading font-semibold">Study Time by Subject</h2>
          {hasSubjectData ? (
            <div className="h-48 flex items-center gap-4">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="85%"
                      dataKey="value"
                      stroke="none"
                    >
                      {subjectBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                {subjectBreakdown.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                    <span className="text-foreground/80">{s.name}</span>
                    <span className="ml-auto text-muted-foreground">{totalSubjectTime > 0 ? Math.round((s.value / totalSubjectTime) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="h-8 w-8 text-primary/40" />}
              title="No subjects yet"
              description="Study a topic to see your subject breakdown"
            />
          )}
        </GlassCard>
      </motion.div>

      {/* Flashcard mastery stacked bar */}
      <motion.div variants={item}>
        <GlassCard hover={false} className="space-y-3">
          <h2 className="text-sm font-heading font-semibold">Flashcard Mastery by Deck</h2>
          {hasDeckData ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.deckMastery} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(228 14% 18%)" />
                    <XAxis dataKey="deck" tick={{ fontSize: 10, fill: "hsl(220 10% 54%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(220 10% 54%)" }} axisLine={false} tickLine={false} />
                    <RTooltip
                      content={({ active, payload, label }: any) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="glass rounded-lg px-3 py-2 text-xs border border-border/40 shadow-xl space-y-1">
                            <p className="font-medium text-foreground">{label}</p>
                            <p className="text-emerald-400">Mastered: {payload[0]?.value}</p>
                            <p className="text-muted-foreground">Learning: {payload[1]?.value}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="mastered" stackId="a" fill="hsl(142, 71%, 45%)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="learning" stackId="a" fill="hsl(228 14% 22%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(142, 71%, 45%)" }} /> Mastered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(228 14% 22%)" }} /> Still Learning
                </span>
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Layers className="h-8 w-8 text-primary/40" />}
              title="No flashcard data yet"
              description="Complete a flashcard deck to see mastery stats"
            />
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default Progress;
