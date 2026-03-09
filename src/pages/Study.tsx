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
}

/* ── Constants ─────────────────────────────────── */

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

/* ── Markdown-ish summary renderer ──────────────── */

function renderSummaryText(text: string) {
  const lines = text.split("\n").filter(Boolean);
  return lines.map((line, i) => {
    // bullet bold keyword: text
    const bulletMatch = line.match(/^[•\-\*]\s+\*\*(.+?)\*\*:\s*(.+)$/);
    if (bulletMatch) {
      return (
        <div key={i} className="flex items-start gap-2 text-xs leading-relaxed">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
          <span>
            <span className="font-semibold text-foreground">{bulletMatch[1]}: </span>
            <span className="text-foreground/75">{bulletMatch[2]}</span>
          </span>
        </div>
      );
    }
    // heading line (### or **)
    if (line.startsWith("###") || (line.startsWith("**") && line.endsWith("**"))) {
      const heading = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
      return <h3 key={i} className="text-sm font-heading font-semibold text-foreground mt-4 mb-1">{heading}</h3>;
    }
    // plain line with inline bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-xs leading-relaxed text-foreground/80">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <span key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</span>
            : <span key={j}>{part}</span>
        )}
      </p>
    );
  });
}

/* ── Component ─────────────────────────────────── */

const Study = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [source, setSource] = useState<SourceType>("text");
  const [content, setContent] = useState("");
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

  // Loading message cycle
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => setLoadingIdx((i) => (i + 1) % loadingMessages.length), 1800);
    return () => clearInterval(interval);
  }, [generating]);

  const toggleMode = useCallback((mode: OutputMode) => {
    setSelectedModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode) && next.size > 1) next.delete(mode);
      else next.add(mode);
      return next;
    });
  }, []);

  const handleGenerate = async () => {
    const trimmed = content.trim();
    if (!trimmed && source === "text") return;

    if (trimmed.length < 50) {
      toast({ title: "Content too short", description: "Please add more content for better results", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setLoadingIdx(0);
    setOutput(null);
    setDetectedSubject(null);

    try {
      // Step 1 — detect subject
      let subject: DetectedSubject | null = null;
      try {
        const raw = await callStudyAI({ type: "detect-subject", content: trimmed });
        const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        subject = JSON.parse(clean);
        setDetectedSubject(subject);
      } catch {
        // non-critical — continue
      }

      const modes = Array.from(selectedModes);
      const result: GeneratedOutput = { subject: subject ?? undefined };

      // Step 2 — run selected modes in parallel
      const tasks = modes.map(async (mode) => {
        if (mode === "summary") {
          // Fetch all 3 summary styles in parallel
          const [tldrRaw, deepRaw, feynRaw] = await Promise.all([
            callStudyAI({ type: "summary", content: trimmed, summaryStyle: "tldr" }),
            callStudyAI({ type: "summary", content: trimmed, summaryStyle: "deepDive" }),
            callStudyAI({ type: "summary", content: trimmed, summaryStyle: "feynman" }),
          ]);
          result.summary = { tldr: tldrRaw, deepDive: deepRaw, feynman: feynRaw };
        }

        if (mode === "quiz") {
          const raw = await callStudyAI({ type: "quiz", content: trimmed, difficulty, questionCount: 10 });
          const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(clean) as { quiz: QuizItem[] };
          const quizId = `quiz_${Date.now()}`;
          // Convert to QuizPlayer format and save
          const questions = parsed.quiz.map((q) => ({
            question: q.question,
            options: [q.options.A, q.options.B, q.options.C, q.options.D],
            correctIndex: ["A", "B", "C", "D"].indexOf(q.correct),
            explanation: q.explanation,
          }));
          // Save quiz data
          localStorage.setItem(`studysprint_quiz_data_${quizId}`, JSON.stringify(questions));
          // Save quiz metadata
          const quizzes = getQuizzes();
          const topic = subject ? `${subject.subject} Quiz` : "Study Quiz";
          quizzes.unshift({
            id: quizId,
            title: topic,
            questions: questions.length,
            duration: `${Math.ceil(questions.length * 1.5)} min`,
            completed: false,
            createdAt: new Date().toISOString(),
          });
          saveQuizzes(quizzes);
          result.quizId = quizId;
          result.quizCount = questions.length;
        }

        if (mode === "flashcards") {
          const raw = await callStudyAI({ type: "flashcards", content: trimmed, cardCount: 20 });
          const clean = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(clean) as { flashcards: FlashcardItem[] };
          const deckId = `deck_${Date.now()}`;
          // Convert to Flashcard format
          const cards = parsed.flashcards.map((c, idx) => ({
            id: `${deckId}_${idx}`,
            term: c.front,
            definition: c.back,
          }));
          // Save deck data
          localStorage.setItem(`studysprint_deck_data_${deckId}`, JSON.stringify(cards));
          // Save deck metadata
          const decks = getDecks();
          const deckTitle = subject ? `${subject.subject} Flashcards` : "Study Flashcards";
          decks.unshift({
            id: deckId,
            title: deckTitle,
            subject: subject?.subject ?? "General",
            cards: cards.length,
            mastered: 0,
            dueToday: cards.length,
            createdAt: new Date().toISOString(),
          });
          saveDecks(decks);
          result.deckId = deckId;
          result.deckCount = cards.length;
        }
      });

      await Promise.all(tasks);

      // Record study session
      addSession({
        id: `session_${Date.now()}`,
        topic: subject ? `${subject.subject} — ${trimmed.slice(0, 40)}...` : trimmed.slice(0, 60),
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
        toast({
          title: "Generation failed — try again",
          description: "Something went wrong. Check your input and retry.",
          variant: "destructive",
        });
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
              <div className="h-44 flex flex-col justify-center gap-3">
                <label className="text-xs text-muted-foreground">YouTube Video URL</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-secondary/50 border border-border/40 rounded-lg px-3 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors"
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
                    active ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_hsl(239_84%_67%/0.15)]" : "border-border/30 hover:border-border/60"
                  )}
                >
                  <span className="text-lg">{m.icon}</span>
                  <p className="text-xs font-medium mt-1.5">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={generating || (!content.trim() && source === "text")}
            className={cn(
              "w-full relative overflow-hidden rounded-lg px-6 py-3.5 text-sm font-semibold transition-all duration-300",
              "bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground",
              "hover:shadow-[0_0_30px_hsl(239_84%_67%/0.4)] hover:scale-[1.01]",
              "disabled:opacity-50 disabled:hover:shadow-none disabled:hover:scale-100",
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
                {!generating && output && (activeOutputTab === "summary" || !hasMultipleOutputs && selectedModes.has("summary")) && output.summary && (
                  <motion.div key="summary-out" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="h-full flex flex-col gap-4">
                    {/* Summary tab bar */}
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
                        className="space-y-2 flex-1 overflow-auto pr-1"
                      >
                        {renderSummaryText(output.summary[activeSummaryTab] ?? "")}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Quiz output */}
                {!generating && output && (activeOutputTab === "quiz" || !hasMultipleOutputs && selectedModes.has("quiz")) && output.quizId && (
                  <motion.div key="quiz-out" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center gap-4 py-12">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <HelpCircle className="h-8 w-8 text-emerald-400" />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-base font-heading font-semibold">Quiz Ready! 🧠</h3>
                      <p className="text-xs text-muted-foreground">{output.quizCount} questions · {difficulty} difficulty</p>
                    </div>
                    <button
                      onClick={() => navigate(`/quiz?id=${output.quizId}`)}
                      className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(239_84%_67%/0.3)] hover:scale-[1.01] transition-all"
                    >
                      Start Now <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}

                {/* Flashcards output */}
                {!generating && output && (activeOutputTab === "flashcards" || !hasMultipleOutputs && selectedModes.has("flashcards")) && output.deckId && (
                  <motion.div key="deck-out" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col items-center justify-center gap-4 py-12">
                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                      <Layers className="h-8 w-8 text-accent" />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="text-base font-heading font-semibold">Deck Ready! 🃏</h3>
                      <p className="text-xs text-muted-foreground">{output.deckCount} flashcards generated</p>
                    </div>
                    <button
                      onClick={() => navigate(`/flashcards?id=${output.deckId}`)}
                      className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold bg-gradient-to-r from-accent via-accent/90 to-accent text-accent-foreground hover:shadow-[0_0_30px_hsl(38_92%_50%/0.3)] hover:scale-[1.01] transition-all"
                    >
                      Study Now <ArrowRight className="h-4 w-4" />
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
