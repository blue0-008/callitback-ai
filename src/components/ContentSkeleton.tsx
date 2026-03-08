import { cn } from "@/lib/utils";

interface ContentSkeletonProps {
  lines?: number;
  className?: string;
}

const Shimmer = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "rounded-md bg-muted/60",
      "bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%] animate-shimmer",
      className
    )}
  />
);

const ContentSkeleton = ({ lines = 3, className }: ContentSkeletonProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      <Shimmer className="h-5 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer key={i} className={cn("h-3", i === lines - 1 ? "w-1/2" : "w-full")} />
      ))}
    </div>
  );
};

export const CardSkeleton = () => (
  <div className="glass rounded-lg p-5 space-y-4">
    <div className="flex items-center gap-3">
      <Shimmer className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-1/3" />
        <Shimmer className="h-3 w-1/2" />
      </div>
    </div>
    <ContentSkeleton lines={2} />
  </div>
);

export default ContentSkeleton;
