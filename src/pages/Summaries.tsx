import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Eye, Trash2, RefreshCw, BookOpen, Clock, CalendarDays } from "lucide-react";
import { getSummaries, deleteSummary, getSubjectEmoji, SavedSummary } from "@/lib/summaryStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── helpers ────────────────────────────────────────────────────────────────

type Mode = "all" | "tldr" | "deep" | "feynman";

const MODE_META: Record<string, { label: string; color: string }> = {
  tldr:    { label: "TL;DR",     color: "bg-primary/15 text-primary border border-primary/30" },
  deep:    { label: "Deep Dive", color: "bg-accent/15 text-accent border border-accent/30" },
  feynman: { label: "Feynman",   color: "bg-muted text-muted-foreground border border-border" },
};

const getModeLabel = (mode: string) => MODE_META[mode]?.label ?? mode;
const getModeCls   = (mode: string) => MODE_META[mode]?.color ?? "bg-muted text-muted-foreground";

const FILTER_MODES: { key: Mode; label: string }[] = [
  { key: "all",     label: "All"       },
  { key: "tldr",    label: "TL;DR"     },
  { key: "deep",    label: "Deep Dive" },
  { key: "feynman", label: "Feynman"   },
];

/** Strip markdown syntax to get plain preview text */
const plainText = (content: string) =>
  content
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .split("\n")
    .filter((l) => l.trim())
    .join(" ");

/** Render content with basic markdown-to-JSX */
const renderContent = (content: string) =>
  content.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return <h2 key={i} className="text-lg font-semibold mt-5 mb-2 text-foreground">{line.slice(3)}</h2>;
    if (line.startsWith("### "))
      return <h3 key={i} className="text-base font-semibold mt-4 mb-1.5 text-foreground">{line.slice(4)}</h3>;
    if (line.startsWith("- "))
      return <li key={i} className="ml-5 mb-1 text-muted-foreground list-disc">{line.slice(2)}</li>;
    if (line.trim() === "")
      return <div key={i} className="h-2" />;
    return <p key={i} className="mb-2 text-muted-foreground leading-relaxed">{line}</p>;
  });

// ─── Chip ───────────────────────────────────────────────────────────────────
const Chip = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "h-8 px-3 rounded-full text-sm font-medium border transition-all",
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-border/80"
    )}
  >
    {children}
  </button>
);

// ─── Summary Card ────────────────────────────────────────────────────────────
const SummaryCard = ({
  summary,
  onView,
  onDelete,
  onRegenerate,
}: {
  summary: SavedSummary;
  onView: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
}) => {
  const preview = plainText(summary.content).slice(0, 160);
  const date = new Date(summary.dateCreated).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 cursor-pointer
                 hover:border-primary/40 hover:shadow-md transition-all duration-200"
      onClick={onView}
    >
      {/* Top row: subject + menu */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{getSubjectEmoji(summary.subject)}</span>
          <span className="font-semibold text-sm text-foreground capitalize truncate">
            {summary.subject}
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <button className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground
                               hover:bg-secondary hover:text-foreground transition-colors shrink-0">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }}>
              <Eye className="h-4 w-4 mr-2" /> View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRegenerate(); }}>
              <RefreshCw className="h-4 w-4 mr-2" /> Regenerate
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content preview */}
      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed flex-1">
        {preview}…
      </p>

      {/* Footer: badge + meta */}
      <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-border/50">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", getModeCls(summary.mode))}>
          {getModeLabel(summary.mode)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          {date}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {summary.estimatedReadTime} min read
        </span>
      </div>
    </motion.div>
  );
};

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = ({ filtered }: { filtered: boolean }) => {
  const navigate = useNavigate();
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
        <BookOpen className="h-9 w-9 text-primary/60" />
      </div>
      <h3 className="text-xl font-semibold text-foreground">
        {filtered ? "No matching summaries" : "No summaries yet"}
      </h3>
      <p className="text-muted-foreground max-w-xs text-sm">
        {filtered
          ? "Try adjusting your search or filters."
          : "Save summaries from the Study page and they'll appear here."}
      </p>
      {!filtered && (
        <Button className="mt-2" onClick={() => navigate("/study")}>
          Generate your first summary →
        </Button>
      )}
    </div>
  );
};

// ─── Page ────────────────────────────────────────────────────────────────────
const Summaries = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<SavedSummary[]>(getSummaries);
  const [search, setSearch]           = useState("");
  const [mode,   setMode]             = useState<Mode>("all");
  const [viewing, setViewing]         = useState<SavedSummary | null>(null);

  const filtered = summaries.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q);
    const matchesMode = mode === "all" || s.mode === mode;
    return matchesSearch && matchesMode;
  });

  const handleDelete = (id: string) => {
    deleteSummary(id);
    setSummaries(getSummaries());
    if (viewing?.id === id) setViewing(null);
    toast.success("Summary deleted");
  };

  const handleRegenerate = () => {
    navigate("/study");
    toast.info("Head to the Study page to regenerate a summary");
  };

  const isFiltered = !!search || mode !== "all";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground mb-1">My Summaries</h1>
        <p className="text-muted-foreground text-sm">All your saved summaries in one place</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by keyword or topic…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_MODES.map(({ key, label }) => (
          <Chip key={key} active={mode === key} onClick={() => setMode(key)}>
            {label}
          </Chip>
        ))}
      </div>

      {/* Count */}
      {summaries.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "summary" : "summaries"}
          {isFiltered ? " found" : " saved"}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <EmptyState filtered={isFiltered && summaries.length > 0} />
          ) : (
            filtered.map((summary) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                onView={() => setViewing(summary)}
                onDelete={() => handleDelete(summary.id)}
                onRegenerate={handleRegenerate}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-2xl w-full max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
          {/* Modal header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{viewing && getSubjectEmoji(viewing.subject)}</span>
              <span className="text-sm font-medium text-muted-foreground capitalize">{viewing?.subject}</span>
              {viewing && (
                <span className={cn("ml-auto text-xs font-medium px-2 py-0.5 rounded-full", getModeCls(viewing.mode))}>
                  {getModeLabel(viewing.mode)}
                </span>
              )}
            </div>
            <DialogTitle className="text-xl font-heading font-bold leading-tight text-foreground">
              {viewing?.title}
            </DialogTitle>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {viewing && new Date(viewing.dateCreated).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {viewing?.estimatedReadTime} min read
              </span>
            </div>
          </DialogHeader>

          {/* Scrollable content */}
          <div className="overflow-y-auto px-6 py-5 flex-1">
            <div className="text-sm leading-relaxed">
              {viewing && renderContent(viewing.content)}
            </div>
          </div>

          {/* Modal footer actions */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setViewing(null); handleRegenerate(); }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => viewing && handleDelete(viewing.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Summaries;
