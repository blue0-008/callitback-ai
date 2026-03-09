import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STUDY_MINS = 25;
const BREAK_MINS = 5;

type Phase = "study" | "break";

const PomodoroTimer = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("study");
  const [secondsLeft, setSecondsLeft] = useState(STUDY_MINS * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = phase === "study" ? STUDY_MINS * 60 : BREAK_MINS * 60;
  const pct = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          if (phase === "study") {
            toast.success("🎉 Study session complete! Time for a break.", { duration: 5000 });
            setPhase("break");
            return BREAK_MINS * 60;
          } else {
            toast.success("☕ Break over! Ready for another sprint?", { duration: 5000 });
            setPhase("study");
            return STUDY_MINS * 60;
          }
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase]);

  const reset = () => {
    setRunning(false);
    setPhase("study");
    setSecondsLeft(STUDY_MINS * 60);
  };

  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="glass rounded-2xl border border-border/40 shadow-2xl overflow-hidden">
        {/* Collapsed: just a mini bar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-2 px-3 py-2 w-full text-xs font-medium hover:bg-secondary/30 transition-colors"
          aria-label={collapsed ? "Expand timer" : "Collapse timer"}
        >
          <span className={cn("w-2 h-2 rounded-full", running ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/40")} />
          <span className="text-muted-foreground">
            {phase === "study" ? "Study" : "Break"} · {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </span>
          {collapsed ? <ChevronUp className="h-3 w-3 ml-auto text-muted-foreground" /> : <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />}
        </button>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 flex flex-col items-center gap-3">
                {/* Ring */}
                <svg width="72" height="72">
                  <circle cx="36" cy="36" r={r} fill="none" stroke="hsl(228 14% 18%)" strokeWidth="5" />
                  <circle
                    cx="36" cy="36" r={r} fill="none"
                    stroke={phase === "study" ? "hsl(38 92% 50%)" : "hsl(142 71% 45%)"}
                    strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    transform="rotate(-90 36 36)"
                    className="transition-all duration-1000"
                  />
                  <text x="36" y="36" textAnchor="middle" dy="0.35em" className="fill-foreground text-[11px] font-heading font-bold">
                    {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                  </text>
                </svg>

                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {phase === "study" ? "Focus Time" : "Break Time"}
                </p>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRunning(!running)}
                    className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
                    aria-label={running ? "Pause timer" : "Start timer"}
                  >
                    {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                  </button>
                  <button
                    onClick={reset}
                    className="h-8 w-8 rounded-full bg-secondary/60 text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors"
                    aria-label="Reset timer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PomodoroTimer;
