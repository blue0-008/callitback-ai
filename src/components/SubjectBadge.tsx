import { cn } from "@/lib/utils";

const subjectColors: Record<string, string> = {
  Math: "bg-primary/20 text-primary border-primary/30",
  Science: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  History: "bg-accent/20 text-accent border-accent/30",
  English: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  Physics: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Biology: "bg-green-500/20 text-green-400 border-green-500/30",
  Chemistry: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

interface SubjectBadgeProps {
  subject: string;
  className?: string;
}

const SubjectBadge = ({ subject, className }: SubjectBadgeProps) => {
  const colors = subjectColors[subject] || "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        colors,
        className
      )}
    >
      {subject}
    </span>
  );
};

export default SubjectBadge;
