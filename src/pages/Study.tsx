import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileUp,
  RefreshCw,
  ClipboardCopy,
  ChevronDown,
  Dna,
  ArrowRight,
  HelpCircle,
  Layers,
  RotateCcw,
  MapPin,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUserSubjects, getPreferredMethods } from "@/lib/userPrefs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getQuizzes, saveQuizzes, getDecks, saveDecks, addSession } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useUser, type AppLanguage } from "@/contexts/AvatarContext";
import { useTranslation } from "react-i18next";

/* ── Types ─────────────────────────────────────── */

type SourceType = "text" | "pdf" | "youtube";
type OutputMode = "summary" | "quiz" | "flashcards";
type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type SummaryTab = "tldr" | "deepDive" | "feynman";

interface DetectedSubject { subject: string; emoji: string; confidence: string }
interface QuizItem { id: number; question: string; options: { A: string; B: string; C: string; D: string }; correct: string; explanation: string }
interface FlashcardItem { id: number; front: string; back: string; tag: string }

interface GeneratedOutput {
  summary?: { tldr?: string; deepDive?: string; feynman?: string };
  quizId?: string;
  deckId?: string;
  quizCount?: number;
  deckCount?: number;
  subject?: DetectedSubject;
  outputLanguage?: AppLanguage;
}

/* ── Constants ─────────────────────────────────── */

const LANG_OPTIONS: { code: AppLanguage; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "es", flag: "🇪🇸", label: "Español" },
];

const LANG_LABELS: Record<AppLanguage, string> = {
  en: "English",
  ar: "Arabic",
  fr: "French",
  es: "Spanish",
};

const sourceTypes = [
  { key: "text" as SourceType, label: "Text", icon: "📝" },
  { key: "pdf" as SourceType, label: "PDF Upload", icon: "📄" },
  { key: "youtube" as SourceType, label: "YouTube URL", icon: "🔗" },
];

const outputModes = [
  { key: "summary" as OutputMode, label: "Summary", icon: "📋", desc: "Condensed key points" },
  { key: "quiz" as OutputMode, label: "Quiz", icon: "🧠", desc: "Test your knowledge" },
  { key: "flashcards" as OutputMode, label: "Flashcards", icon: "🃏", desc: "Spaced repetition cards" },
];

const loadingMessages = [
  "Reading your content...",
  "Extracting key concepts...",
  "Building your study set...",
  "Almost there...",
];

/* ── AI call ───────────────────────────────────── */

async function callStudyAI(params: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.functions.invoke("study-ai", { body: params });
  if (error) throw new Error(error.message || "Function error");
  if (data?.error) {
    if (data.error === "RATE_LIMITED") throw new Error("RATE_LIMITED");
    if (data.error === "PAYMENT_REQUIRED") throw new Error("PAYMENT_REQUIRED");
    throw new Error(data.error);
  }
  return data?.result ?? "";
}

/* ── Arabic RTL text wrapper ─────────────────────── */

function isArabic(lang: AppLanguage) { return lang === "ar"; }

function renderSummaryText(text: string, lang: AppLanguage = "en") {
  const rtl = isArabic(lang);
  const lines = text.split("\n").filter(Boolean);
  return lines.map((line, i) => {
    const bulletMatch = line.match(/^[•\-\*]\s+\*\*(.+?)\*\*:\s*(.+)$/);
    if (bulletMatch) {
      return (
        <div key={i} className={cn("flex items-start gap-2 text-xs leading-relaxed", rtl && "flex-row-reverse text-right font-cairo")}>
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
          <span>
            <span className="font-semibold text-foreground">{bulletMatch[1]}: </span>
            <span className="text-foreground/75">{bulletMatch[2]}</span>
          </span>
        </div>
      );
    }
    if (line.startsWith("###") || (line.startsWith("**") && line.endsWith("**"))) {
      const heading = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
      return (
        <h3 key={i} className={cn("text-sm font-heading font-semibold text-foreground mt-4 mb-1", rtl && "text-right font-cairo")}>
          {heading}
        </h3>
      );
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={cn("text-xs leading-relaxed text-foreground/80", rtl && "text-right font-cairo")}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <span key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</span>
            : <span key={j}>{part}</span>
        )}
      </p>
    );
  });
}

/* ── Language Selector ─────────────────────────── */

function LanguageSelector({
  value,
  onChange,
  label,
}: {
  value: AppLanguage;
  onChange: (l: AppLanguage) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {label && <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>}
      <div className="flex gap-1">
        {LANG_OPTIONS.map((l) => (
          <button
            key={l.code}
            onClick={() => onChange(l.code)}
            title={l.label}
            className={cn(
              "h-8 w-8 rounded-lg text-sm flex items-center justify-center border transition-all duration-150",
              value === l.code
                ? "border-primary/60 bg-primary/15 shadow-[0_0_8px_hsl(var(--primary)/0.2)]"
                : "border-border/30 bg-secondary/40 hover:border-border/60 hover:bg-secondary/60"
            )}
          >
            {l.flag}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Component ─────────────────────────────────── */

const Study = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language: appLanguage } = useUser();
  const { t } = useTranslation();

  const [source, setSource] = useState<SourceType>("text");
  const [content, setContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedModes, setSelectedModes] = useState<Set<OutputMode>>(() => {
    const saved = getPreferredMethods();
    const valid = saved.filter((m): m is OutputMode => ["summary", "quiz", "flashcards"].includes(m));
    return valid.length > 0 ? new Set(valid) : new Set<OutputMode>(["summary"]);
  });
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [diffOpen, setDiffOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [detectedSubject, setDetectedSubject] = useState<DetectedSubject | null>(null);
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [activeOutputTab, setActiveOutputTab] = useState<OutputMode>("summary");
  const [activeSummaryTab, setActiveSummaryTab] = useState<SummaryTab>("tldr");

  // Language state
  const [outputLanguage, setOutputLanguage] = useState<AppLanguage>(appLanguage);
  const [detectedInputLang, setDetectedInputLang] = useState<AppLanguage | null>(null);
  const [youtubeLang, setYoutubeLang] = useState<AppLanguage>(appLanguage);

  // Keep outputLanguage in sync with app language when app language changes
  useEffect(() => {
    setOutputLanguage(appLanguage);
    setYoutubeLang(appLanguage);
  }, [appLanguage]);

  // Loading message cycle
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => setLoadingIdx((i) => (i + 1) % loadingMessages.length), 1800);
    return () => clearInterval(interval);
  }, [generating]);

  const toggleMode = useCallback((mode: OutputMode) => {
    setSelectedModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) next.delete(mode);
      else next.add(mode);
      return next;
    });
  }, []);

  // Auto-detect input language when content changes (debounced)
  useEffect(() => {
    if (source !== "text" || content.trim().length < 80) {
      setDetectedInputLang(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const raw = await callStudyAI({ type: "detect-language", content: content.trim().slice(0, 300) });
        const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(clean);
        const detectedCode = parsed.language as AppLanguage;
        if (["en", "ar", "fr", "es"].includes(detectedCode) && parsed.confidence !== "low") {
          setDetectedInputLang(detectedCode);
          setOutputLanguage(detectedCode);
        } else {
          setDetectedInputLang(null);
        }
      } catch {
        setDetectedInputLang(null);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [content, source]);

  const handleGenerate = async () => {
    const activeContent = source === "youtube" ? youtubeUrl.trim() : content.trim();
    const activeLang = source === "youtube" ? youtubeLang : outputLanguage;

    if (!activeContent && source === "text") return;

    if (source === "text" && content.trim().length < 50) {
      toast({ title: "Content too short", description: "Please add more content for better results", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setLoadingIdx(0);
    setOutput(null);
    setDetectedSubject(null);

    try {
      let subject: DetectedSubject | null = null;
      try {
        const raw = await callStudyAI({ type: "detect-subject", content: content.trim() });
        const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        subject = JSON.parse(clean);
        setDetectedSubject(subject);
      } catch {
        // non-critical
      }

      const modes = Array.from(selectedModes);
      const result: GeneratedOutput = { subject: subject ?? undefined, outputLanguage: activeLang };

      const tasks = modes.map(async (mode) => {
        if (mode === "summary") {
          const [tldrRaw, deepRaw, feynRaw] = await Promise.all([
            callStudyAI({ type: "summary", content: content.trim(), summaryStyle: "tldr", outputLanguage: activeLang }),
            callStudyAI({ type: "summary", content: content.trim(), summaryStyle: "deepDive", outputLanguage: activeLang }),
            callStudyAI({ type: "summary", content: content.trim(), summaryStyle: "feynman", outputLanguage: activeLang }),
          ]);
          result.summary = { tldr: tldrRaw, deepDive: deepRaw, feynman: feynRaw };
        }

        if (mode === "quiz") {
          const raw = await callStudyAI({ type: "quiz", content: content.trim(), difficulty, questionCount: 10, outputLanguage: activeLang });
          const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(clean) as { quiz: QuizItem[] };
          const quizId = `quiz_${Date.now()}`;
          const questions = parsed.quiz.map((q) => ({
            question: q.question,
            options: [q.options.A, q.options.B, q.options.C, q.options.D],
            correctIndex: ["A", "B", "C", "D"].indexOf(q.correct),
            explanation: q.explanation,
            isRtl: activeLang === "ar",
          }));
          localStorage.setItem(`studysprint_quiz_data_${quizId}`, JSON.stringify(questions));
          const quizzes = getQuizzes();
          const topic = subject ? `${subject.subject} Quiz` : "Study Quiz";
          quizzes.unshift({ id: quizId, title: topic, questions: questions.length, duration: `${Math.ceil(questions.length * 1.5)} min`, completed: false, createdAt: new Date().toISOString() });
          saveQuizzes(quizzes);
          result.quizId = quizId;
          result.quizCount = questions.length;
        }

        if (mode === "flashcards") {
          const raw = await callStudyAI({ type: "flashcards", content: content.trim(), cardCount: 20, outputLanguage: activeLang });
          const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(clean) as { flashcards: FlashcardItem[] };
          const deckId = `deck_${Date.now()}`;
          const cards = parsed.flashcards.map((c, idx) => ({
            id: `${deckId}_${idx}`,
            term: c.front,
            definition: c.back,
            isRtl: activeLang === "ar",
          }));
          localStorage.setItem(`studysprint_deck_data_${deckId}`, JSON.stringify(cards));
          const decks = getDecks();
          const deckTitle = subject ? `${subject.subject} Flashcards` : "Study Flashcards";
          decks.unshift({ id: deckId, title: deckTitle, subject: subject?.subject ?? "General", cards: cards.length, mastered: 0, dueToday: cards.length, createdAt: new Date().toISOString() });
          saveDecks(decks);
          result.deckId = deckId;
          result.deckCount = cards.length;
        }
      });

      await Promise.all(tasks);

      addSession({
        id: `session_${Date.now()}`,
        topic: subject ? `${subject.subject} — ${content.trim().slice(0, 40)}...` : content.trim().slice(0, 60),
        subject: subject?.subject ?? "General",
        date: new Date().toISOString(),
        type: modes.length > 1 ? "summary + quiz" : (modes[0] as "summary" | "quiz" | "flashcards"),
      });

      setOutput(result);
      setActiveOutputTab(modes[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg === "RATE_LIMITED") {
        toast({ title: "Rate limit reached", description: "Too many requests — please wait a moment and try again.", variant: "destructive" });
      } else if (msg === "PAYMENT_REQUIRED") {
        toast({ title: "Credits needed", description: "Add credits in your workspace settings to continue.", variant: "destructive" });
      } else {
        toast({ title: "Generation failed — try again", description: "Something went wrong. Check your input and retry.", variant: "destructive" });
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    const text = output?.summary?.[activeSummaryTab] ?? "";
    if (text) navigator.clipboard.writeText(text).then(() => toast({ title: "Copied to clipboard" }));
  };

  const modesArr = Array.from(selectedModes);
  const hasMultipleOutputs = modesArr.length > 1;
  const outputLang = output?.outputLanguage ?? "en";
  const isOutputArabic = outputLang === "ar";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> AI Study Generator
          </h1>
          <p className="text-muted-foreground text-sm">
            Paste your notes, upload a document, or drop a link — and let AI do the heavy lifting.
          </p>
        </div>
        {getUserSubjects().length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {getUserSubjects().map((subj) => (
              <span key={subj} className="inline-flex items-center rounded-full bg-secondary/60 border border-border/30 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                {subj}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== LEFT — Input Panel ===== */}
        <div className="space-y-4">
          <GlassCard hover={false} className="space-y-5">
            {/* Source toggles */}
            <div className="flex gap-2">
              {sourceTypes.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSource(s.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 border",
                    source === s.key
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-secondary/50 border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <span>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>

            {source === "text" && (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your notes, a paragraph, or just type a topic..."
                className="w-full h-44 bg-transparent resize-none text-sm placeholder:text-muted-foreground/60 focus:outline-none leading-relaxed"
              />
            )}
            {source === "pdf" && (
              <div className="h-44 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-lg gap-2">
                <FileUp className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Drop a PDF here or click to upload</p>
                <Button variant="outline" size="sm" className="mt-1 text-xs">Browse Files</Button>
              </div>
            )}
            {source === "youtube" && (
              <div className="h-44 flex flex-col justify-center gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">YouTube Video URL</label>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-secondary/50 border border-border/40 rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                {/* YouTube language selector */}
                <LanguageSelector
                  value={youtubeLang}
                  onChange={setYoutubeLang}
                  label="Transcribe & summarize in:"
                />
              </div>
            )}

            {/* Detected subject chip */}
            <AnimatePresence>
              {detectedSubject && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
                    <Dna className="h-3 w-3" />
                    {detectedSubject.emoji} {detectedSubject.subject} detected
                    {detectedSubject.confidence === "high" && <span className="ml-1 text-[9px] opacity-60">high confidence</span>}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Detected input language chip */}
            <AnimatePresence>
              {detectedInputLang && source === "text" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/25 px-3 py-1 text-xs font-medium text-foreground">
                    <MapPin className="h-3 w-3 text-accent" />
                    {LANG_OPTIONS.find(l => l.code === detectedInputLang)?.flag}{" "}
                    {LANG_LABELS[detectedInputLang]} detected — generating in {LANG_LABELS[detectedInputLang]}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Output mode selectors */}
          <div className="grid grid-cols-3 gap-3">
            {outputModes.map((m) => {
              const active = selectedModes.has(m.key);
              return (
                <button
                  key={m.key}
                  onClick={() => toggleMode(m.key)}
                  className={cn(
                    "glass rounded-lg p-3 text-left transition-all duration-200 border",
                    active ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.15)]" : "border-border/30 hover:border-border/60"
                  )}
                >
                  <span className="text-lg">{m.icon}</span>
                  <p className="text-xs font-medium mt-1.5">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="pt-2 pb-1">
            <div className="border-t border-border/30" />
          </div>

          {/* Output Language selector (only for text/pdf) */}
          {source !== "youtube" && (
            <LanguageSelector
              value={outputLanguage}
              onChange={(l) => { setOutputLanguage(l); setDetectedInputLang(null); }}
              label="Output Language"
            />
          )}

          {/* Generate button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full">
                <button
                  onClick={handleGenerate}
                  disabled={generating || (!content.trim() && source === "text") || selectedModes.size === 0}
                  className={cn(
                    "w-full relative overflow-hidden rounded-lg px-6 py-5 text-sm font-semibold transition-all duration-300",
                    "bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground",
                    "hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:scale-[1.01]",
                    "disabled:opacity-50 disabled:hover:shadow-none disabled:hover:scale-100 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2",
                    generating && "animate-pulse"
                  )}
                >
                  {generating ? (
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={loadingIdx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        {loadingMessages[loadingIdx]}
                      </motion.span>
                    </AnimatePresence>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate Study Materials</>
                  )}
                </button>
              </span>
            </TooltipTrigger>
            {selectedModes.size === 0 && (
              <TooltipContent>Pick at least one output type</TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* ===== RIGHT — Output Panel ===== */}
        <div className="min-h-[400px]">
          <GlassCard hover={false} className="h-full flex flex-col relative min-h-[400px]">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-4">
              {hasMultipleOutputs && output ? (
                <div className="flex gap-1 bg-secondary/40 rounded-lg p-0.5">
                  {modesArr.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setActiveOutputTab(mode)}
                      className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                        activeOutputTab === mode ? "bg-primary/15 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {outputModes.find(m => m.key === mode)?.icon} {outputModes.find(m => m.key === mode)?.label}
                    </button>
                  ))}
                </div>
              ) : (
                <h2 className="text-sm font-heading font-semibold text-muted-foreground">Output</h2>
              )}

              <div className="flex items-center gap-2">
                {/* Difficulty dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDiffOpen(!diffOpen)}
                    className="flex items-center gap-1.5 rounded-md bg-secondary/60 border border-border/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {difficulty}
                    <ChevronDown className={cn("h-3 w-3 transition-transform", diffOpen && "rotate-180")} />
                  </button>
                  <AnimatePresence>
                    {diffOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 top-full mt-1 z-10 glass rounded-lg border border-border/40 py-1 min-w-[140px]"
                      >
                        {(["Beginner", "Intermediate", "Advanced"] as Difficulty[]).map((d) => (
                          <button
                            key={d}
                            onClick={() => { setDifficulty(d); setDiffOpen(false); }}
                            className={cn("w-full text-left px-3 py-1.5 text-xs transition-colors", d === difficulty ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")}
                          >
                            {d}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {output?.summary && activeOutputTab === "summary" && (
                  <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1">
                    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Copy">
                      <ClipboardCopy className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => { setOutput(null); }} className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Clear">
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-auto">
              <AnimatePresence mode="wait">
                {/* Loading */}
                {generating && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center gap-4 py-16">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/40 to-accent/30 animate-spin" style={{ animationDuration: "3s" }} />
                      <div className="absolute inset-2 rounded-full bg-card/80 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p key={loadingIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-sm text-muted-foreground">
                        {loadingMessages[loadingIdx]}
                      </motion.p>
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Summary output */}
                {!generating && output && (activeOutputTab === "summary" || (!hasMultipleOutputs && selectedModes.has("summary"))) && output.summary && (
                  <motion.div key="summary-out" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-full flex flex-col gap-4">
                    <div className="flex gap-1 bg-secondary/40 rounded-lg p-0.5 w-fit">
                      {[
                        { key: "tldr" as SummaryTab, label: "TL;DR", icon: "⚡" },
                        { key: "deepDive" as SummaryTab, label: "Deep Dive", icon: "🔍" },
                        { key: "feynman" as SummaryTab, label: "Feynman", icon: "🧒" },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setActiveSummaryTab(t.key)}
                          className={cn("flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200", activeSummaryTab === t.key ? "bg-primary/15 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                        >
                          <span>{t.icon}</span> {t.label}
                        </button>
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeSummaryTab}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className={cn("space-y-2 flex-1 overflow-auto pr-1", isOutputArabic && "direction-rtl")}
                        dir={isOutputArabic ? "rtl" : "ltr"}
                      >
                        {renderSummaryText(output.summary[activeSummaryTab] ?? "", outputLang as AppLanguage)}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Quiz output */}
                {!generating && output && (activeOutputTab === "quiz" || (!hasMultipleOutputs && selectedModes.has("quiz"))) && output.quizId && (
                  <motion.div key="quiz-out" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center gap-4 py-12">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <HelpCircle className="h-8 w-8 text-emerald-400" />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-base font-heading font-semibold">Quiz Ready! 🧠</h3>
                      <p className="text-xs text-muted-foreground">
                        {output.quizCount} questions · {difficulty} difficulty
                        {isOutputArabic && " · عربي"}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/quiz?id=${output.quizId}`)}
                      className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:scale-[1.01] transition-all"
                    >
                      Start Now <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </button>
                  </motion.div>
                )}

                {/* Flashcards output */}
                {!generating && output && (activeOutputTab === "flashcards" || (!hasMultipleOutputs && selectedModes.has("flashcards"))) && output.deckId && (
                  <motion.div key="deck-out" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center gap-4 py-12">
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                      <Layers className="h-8 w-8 text-accent" />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-base font-heading font-semibold">Deck Ready! 🃏</h3>
                      <p className="text-xs text-muted-foreground">
                        {output.deckCount} flashcards generated
                        {isOutputArabic && " · عربي"}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/flashcards?id=${output.deckId}`)}
                      className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold bg-gradient-to-r from-accent via-accent/90 to-accent text-accent-foreground hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)] hover:scale-[1.01] transition-all"
                    >
                      Study Now <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </button>
                  </motion.div>
                )}

                {/* Empty state */}
                {!generating && !output && (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center gap-3 py-16">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-primary/40" />
                    </div>
                    <p className="text-sm text-muted-foreground">Ready to generate...</p>
                    <p className="text-xs text-muted-foreground/60">Paste content on the left and hit Generate</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>
      </div>
    </motion.div>
  );
};

export default Study;
