import { useState } from "react";
import { cn } from "@/lib/utils";

interface KeyTermProps {
  term: string;
  definition: string;
}

const KeyTerm = ({ term, definition }: KeyTermProps) => {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-block cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-accent font-medium border-b border-accent/40 transition-colors hover:border-accent" style={{ textShadow: "0 0 12px hsl(38 92% 50% / 0.3)" }}>
        {term}
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 w-56 px-3 py-2 rounded-lg text-xs leading-relaxed glass border border-border/50 text-foreground/90 shadow-xl pointer-events-none">
          <span className="font-semibold text-accent">{term}</span>
          <span className="block mt-0.5 text-muted-foreground">{definition}</span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 rotate-45 glass border-b border-r border-border/50" />
        </span>
      )}
    </span>
  );
};

export default KeyTerm;
