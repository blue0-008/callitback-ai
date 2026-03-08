import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  FileUp,
  Link2,
  ClipboardList,
  Brain,
  Layers,
  RefreshCw,
  ClipboardCopy,
  Save,
  ChevronDown,
  Dna,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SummaryOutput from "@/components/SummaryOutput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SourceType = "text" | "pdf" | "youtube";
type OutputMode = "summary" | "quiz" | "flashcards";
type Difficulty = "Beginner" | "Intermediate" | "Advanced";

const sourceTypes: { key: SourceType; label: string; icon: string }[] = [
  { key: "text", label: "Text", icon: "📝" },
  { key: "pdf", label: "PDF Upload", icon: "📄" },
  { key: "youtube", label: "YouTube URL", icon: "🔗" },
];

const outputModes: { key: OutputMode; label: string; icon: string; desc: string }[] = [
  { key: "summary", label: "Summary", icon: "📋", desc: "Condensed key points" },
  { key: "quiz", label: "Quiz", icon: "🧠", desc: "Test your knowledge" },
  { key: "flashcards", label: "Flashcards", icon: "🃏", desc: "Spaced repetition cards" },
];

const loadingMessages = [
  "Reading your content...",
  "Extracting key concepts...",
  "Building your study set...",
];


const Study = () => {
  const [source, setSource] = useState<SourceType>("text");
  const [content, setContent] = useState("");
  const [selectedModes, setSelectedModes] = useState<Set<OutputMode>>(new Set(["summary"]));
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");
  const [diffOpen, setDiffOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [detectedSubject, setDetectedSubject] = useState<string | null>(null);

  // Fake subject detection
  useEffect(() => {
    if (content.length > 30) {
      const timer = setTimeout(() => setDetectedSubject("Biology 🧬"), 600);
      return () => clearTimeout(timer);
    }
    setDetectedSubject(null);
  }, [content]);

  // Loading message cycle
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setLoadingIdx((i) => (i + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [generating]);

  const toggleMode = useCallback((mode: OutputMode) => {
    setSelectedModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) {
        if (next.size > 1) next.delete(mode);
      } else {
        next.add(mode);
      }
      return next;
    });
  }, []);

  const handleGenerate = () => {
    if (!content.trim() && source === "text") return;
    setGenerating(true);
    setLoadingIdx(0);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 5500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> AI Study Generator
        </h1>
        <p className="text-muted-foreground text-sm">
          Paste your notes, upload a document, or drop a link — and let AI do the heavy lifting.
        </p>
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
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Input area */}
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
                <Button variant="outline" size="sm" className="mt-1 text-xs">
                  Browse Files
                </Button>
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

            {/* Detected subject */}
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
                    Detected: {detectedSubject}
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
                    active
                      ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_hsl(239_84%_67%/0.15)]"
                      : "border-border/30 hover:border-border/60"
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
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Study Materials
              </>
            )}
          </button>
        </div>

        {/* ===== RIGHT — Output Panel ===== */}
        <div className="min-h-[400px]">
          <GlassCard hover={false} className="h-full flex flex-col relative">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-heading font-semibold text-muted-foreground">Output</h2>

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
                            className={cn(
                              "w-full text-left px-3 py-1.5 text-xs transition-colors",
                              d === difficulty ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            )}
                          >
                            {d}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action buttons (visible when generated) */}
                {generated && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1"
                  >
                    <button className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Regenerate">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Copy">
                      <ClipboardCopy className="h-3.5 w-3.5" />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors" title="Save to Library">
                      <Save className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-auto">
              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center gap-4"
                  >
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/40 to-accent/30 animate-spin" style={{ animationDuration: "3s" }} />
                      <div className="absolute inset-2 rounded-full bg-card/80 flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-primary animate-pulse_glow" />
                      </div>
                    </div>
                    <motion.p
                      key={loadingIdx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="text-sm text-muted-foreground"
                    >
                      {loadingMessages[loadingIdx]}
                    </motion.p>
                  </motion.div>
                ) : generated ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="h-full"
                  >
                    <SummaryOutput onStartQuiz={() => {}} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center gap-3 py-16"
                  >
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 flex items-center justify-center animate-pulse_glow">
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
