import { useState, useEffect, useRef } from "react";
import { X, Pencil, Check, Trash2, RotateCcw, Download, Sun, Moon, Camera } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { useAvatar } from "@/contexts/AvatarContext";
import AvatarPickerModal from "@/components/AvatarPickerModal";
import { toast } from "@/hooks/use-toast";
import { getUserName, setUserName } from "@/lib/userPrefs";
import { getStats } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/* ── helpers ──────────────────────────────────── */

function getJoinDate(): string {
  const key = "studysprint_joinDate";
  let d = localStorage.getItem(key);
  if (!d) {
    d = new Date().toISOString().slice(0, 10);
    localStorage.setItem(key, d);
  }
  return d;
}

function getDailyGoal(): number {
  return Number(localStorage.getItem("studysprint_dailyGoal")) || 3;
}
function setDailyGoal(n: number) {
  localStorage.setItem("studysprint_dailyGoal", String(n));
}

function getTodaySessions(): number {
  const today = new Date().toISOString().slice(0, 10);
  const stats = getStats();
  return stats.heatmap[today] || 0;
}


function formatJoinDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/* ── component ────────────────────────────────── */

interface Props {
  open: boolean;
  onClose: () => void;
}

const ProfileDrawer = ({ open, onClose }: Props) => {
  const { setAvatar } = useAvatar();
  const [name, setName] = useState(getUserName() || "User");
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const [clearOpen, setClearOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [goal, setGoal] = useState(getDailyGoal());
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSave = (url: string) => {
    setAvatar(url);
  };

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const saveName = () => {
    const trimmed = editValue.trim() || "User";
    setUserName(trimmed);
    setName(trimmed);
    setEditing(false);
  };

  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("studysprint_theme", next ? "dark" : "light");
    setDark(next);
  };

  const handleClearAll = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem("hasCompletedOnboarding");
    window.location.reload();
  };

  const handleExport = async () => {
    toast({ title: "Preparing your export...", description: "Generating PDF" });
    const { generateExportPdf } = await import("@/lib/exportPdf");
    await generateExportPdf();
    toast({ title: "Export ready! Check your downloads ✅" });
  };

  const handleGoalChange = (n: number) => {
    setGoal(n);
    setDailyGoal(n);
  };

  const goalOptions = [1, 2, 3, 5];

  const quickStats = [
    { emoji: "🔥", label: "Current Streak", value: `${stats.streak} days` },
    { emoji: "🧠", label: "Quizzes Taken", value: String(stats.totalQuizzesTaken) },
    { emoji: "🃏", label: "Cards Mastered", value: String(stats.cardsMastered) },
    { emoji: "⚡", label: "Total Sessions", value: String(stats.totalSessions) },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full sm:w-80 bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors z-10"
          aria-label="Close profile drawer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECTION 1 — Profile Header */}
          <div className="flex flex-col items-center pt-4 space-y-2">
            <button
              onClick={() => setAvatarPickerOpen(true)}
              className="relative group cursor-pointer rounded-full"
              aria-label="Change avatar"
            >
              <UserAvatar key={avatarKey} size={80} className="shadow-lg group-hover:opacity-80 transition-opacity" />
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>

            <div className="flex items-center gap-1.5">
              {editing ? (
                <div className="flex items-center gap-1">
                  <input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="bg-secondary/60 border border-border rounded-md px-2 py-1 text-sm font-semibold text-foreground w-32 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button onClick={saveName} className="h-6 w-6 rounded flex items-center justify-center text-primary hover:bg-primary/10 transition-colors">
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-base font-heading font-bold">{name}</span>
                  <button
                    onClick={() => { setEditValue(name); setEditing(true); }}
                    className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                    aria-label="Edit name"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>

            <span className="text-xs text-muted-foreground">
              Member since {formatJoinDate(joinDate)}
            </span>
          </div>

          {/* SECTION 2 — Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            {quickStats.map((s) => (
              <div key={s.label} className="glass rounded-lg p-3 text-center space-y-0.5">
                <span className="text-lg">{s.emoji}</span>
                <p className="text-sm font-bold font-heading">{s.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* SECTION 3 — Study Goal */}
          <div className="space-y-3">
            <h3 className="text-sm font-heading font-semibold">Daily Study Goal 🎯</h3>
            <Progress value={progress} className="h-2.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{todaySessions}</span> of{" "}
              <span className="font-semibold text-foreground">{goal}</span> sessions completed today
            </p>
            <div className="flex gap-2">
              {goalOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => handleGoalChange(n)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-semibold transition-all",
                    goal === n
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {n}/day
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 4 — Settings */}
          <div className="space-y-1">
            <h3 className="text-sm font-heading font-semibold mb-2">Settings</h3>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors"
            >
              {dark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
              <span>{dark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
            </button>

            <button
              onClick={() => setClearOpen(true)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All Data</span>
            </button>

            <button
              onClick={handleResetOnboarding}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors"
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              <span>Reset Onboarding</span>
            </button>

            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              <span>Export My Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your summaries, quizzes and flashcards. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, clear everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AvatarPickerModal
        open={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        onSave={handleAvatarSave}
      />
    </>
  );
};

export default ProfileDrawer;
