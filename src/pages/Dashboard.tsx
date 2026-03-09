import { motion } from "framer-motion";
import { Zap, ArrowRight, BookOpen, Flame } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import GlassCard from "@/components/GlassCard";
import SubjectBadge from "@/components/SubjectBadge";
import EmptyState from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { useCountUp } from "@/hooks/useCountUp";
import { getSessions, getStats, getDecks, getQuizzes, type StudySession } from "@/lib/store";
import { useUser } from "@/contexts/AvatarContext";
import { useTranslation } from "react-i18next";
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

/* ── Component ─────────────────────────────────── */

const Dashboard = () => {
  const navigate = useNavigate();
  const { username } = useUser();
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [stats, setStats] = useState(getStats());

  useEffect(() => {
    setSessions(getSessions());
    setStats(getStats());
  }, []);

  function getGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return t("dashboard.goodMorning");
    if (h >= 12 && h < 17) return t("dashboard.goodAfternoon");
    if (h >= 17 && h < 21) return t("dashboard.goodEvening");
    return t("dashboard.studyingLate");
  }

  const sessionsThisWeek = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return sessions.filter(s => new Date(s.date) >= startOfWeek).length;
  }, [sessions]);

  const continueItems = useMemo(() => {
    return sessions.slice(0, 3);
  }, [sessions]);

  const weakSpots = useMemo(() => {
    return sessions
      .filter(s => s.type === "quiz" || s.type === "summary + quiz")
      .filter(s => s.score != null && s.score < 70)
      .slice(0, 6);
  }, [sessions]);

  const quickStats = [
    { label: t("dashboard.sessionsThisWeek"), numValue: sessionsThisWeek, suffix: "", icon: "📊" },
    { label: t("dashboard.quizzesTaken"), numValue: stats.totalQuizzesTaken, suffix: "", icon: "🧠" },
    { label: t("dashboard.cardsMastered"), numValue: stats.cardsMastered, suffix: "", icon: "🃏" },
    { label: t("dashboard.bestStreak"), numValue: stats.bestStreak, suffix: ` ${t("dashboard.days")}`, icon: "🏆" },
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
          <div className="flex items-center gap-3">
            <UserAvatar size={48} />
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
              {getGreeting()}, {username || t("dashboard.heyThere")} <Zap className="h-6 w-6 text-primary animate-pulse" />
            </h1>
          </div>
          {stats.streak > 0 ? (
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-semibold text-foreground">🔥 {t("dashboard.streakDays", { count: stats.streak })}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("dashboard.startStreak")}</p>
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
          <h2 className="text-lg font-heading font-semibold">{t("dashboard.continueStudying")}</h2>
          {continueItems.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-8 w-8 text-primary/40" />}
              title={t("dashboard.nothingYet")}
              description={t("dashboard.startFirstSprint")}
              action={
                <button
                  onClick={() => navigate("/study")}
                  className="mt-2 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition-all"
                >
                  <Zap className="h-3.5 w-3.5" /> {t("dashboard.goToStudy")}
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
                    {t("dashboard.continue")} <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                  </span>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>

        {/* RIGHT — Weak Spots */}
        <motion.div variants={item} className="space-y-3">
          <h2 className="text-lg font-heading font-semibold">{t("dashboard.weakSpots")}</h2>
          {weakSpots.length === 0 ? (
            <div className="glass rounded-lg p-6 text-center space-y-1">
              <p className="text-sm text-muted-foreground">{t("dashboard.noWeakSpots")}</p>
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
          className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-semibold transition-all duration-300 bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground hover:shadow-[0_0_40px_hsl(38_92%_50%/0.35)] hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Zap className="h-4 w-4" /> {t("dashboard.startNewSession")}
        </button>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
