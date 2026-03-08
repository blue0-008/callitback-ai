import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Search, Baby, HelpCircle } from "lucide-react";
import KeyTerm from "@/components/KeyTerm";
import { cn } from "@/lib/utils";

type SummaryTab = "tldr" | "deep" | "feynman";

const tabs: { key: SummaryTab; label: string; icon: string; Icon: typeof Zap }[] = [
  { key: "tldr", label: "TL;DR", icon: "⚡", Icon: Zap },
  { key: "deep", label: "Deep Dive", icon: "🔍", Icon: Search },
  { key: "feynman", label: "Feynman", icon: "🧒", Icon: Baby },
];

/* ── Sample content ───────────────────────────────── */

const tldrBullets = [
  { keyword: "Cell Theory", text: "All living organisms are composed of one or more cells, the basic unit of life." },
  { keyword: "Prokaryotes vs Eukaryotes", text: "Prokaryotic cells lack a nucleus; eukaryotic cells have membrane-bound organelles." },
  { keyword: "Mitochondria", text: "Often called the powerhouse of the cell — produces ATP through cellular respiration." },
  { keyword: "Cell Division", text: "Mitosis handles growth and repair; meiosis produces gametes for reproduction." },
  { keyword: "Homeostasis", text: "Cells maintain internal balance through selective membrane permeability and feedback loops." },
];

const deepDiveSections = [
  {
    heading: "Cell Structure & Organization",
    paragraphs: [
      {
        text: "Every living organism is built from ",
        terms: [
          { before: "Every living organism is built from ", term: "cells", def: "The smallest structural and functional unit of an organism, typically microscopic.", after: ", which serve as the fundamental building blocks of life. Cells were first observed by Robert Hooke in 1665 using a primitive microscope, and the concept was later refined into " },
          { before: "", term: "Cell Theory", def: "A scientific theory stating that all living things are made of cells, cells are the basic unit of life, and all cells arise from pre-existing cells.", after: " — one of the unifying principles of biology." },
        ],
      },
    ],
  },
  {
    heading: "Organelles & Their Functions",
    paragraphs: [
      {
        text: "",
        terms: [
          { before: "The ", term: "nucleus", def: "Membrane-bound organelle containing the cell's DNA and controlling gene expression.", after: " acts as the control center, housing genetic material in the form of DNA. Energy production is handled by " },
          { before: "", term: "mitochondria", def: "Double-membrane organelle that generates ATP through oxidative phosphorylation.", after: ", which convert glucose into ATP through a process called " },
          { before: "", term: "cellular respiration", def: "A metabolic process that converts biochemical energy from nutrients into ATP.", after: ". Meanwhile, " },
          { before: "", term: "ribosomes", def: "Molecular machines that synthesize proteins by translating messenger RNA.", after: " are responsible for translating mRNA into functional proteins." },
        ],
      },
    ],
  },
  {
    heading: "Cell Division & Reproduction",
    paragraphs: [
      {
        text: "",
        terms: [
          { before: "Cells reproduce through two primary mechanisms: ", term: "mitosis", def: "A type of cell division resulting in two identical daughter cells, used for growth and repair.", after: " for growth and tissue repair, and " },
          { before: "", term: "meiosis", def: "A specialized cell division that produces four genetically unique gametes, each with half the chromosome count.", after: " for producing sex cells. The cell cycle is tightly regulated by " },
          { before: "", term: "checkpoints", def: "Control mechanisms in the cell cycle that ensure each phase is completed correctly before proceeding.", after: " to prevent errors and uncontrolled growth." },
        ],
      },
    ],
  },
];

const feynmanContent = `Imagine you're building a city out of LEGO bricks. Each individual brick is like a **cell** — it's the smallest piece that still counts as "part of the city."

Now, some cities are simple — just a few bricks stacked together, like a single wall. Those are like **bacteria** (prokaryotes). They get the job done, but they don't have fancy rooms inside.

Other cities are way more complex — they've got a town hall (the **nucleus**), a power plant (the **mitochondria**), factories making stuff (the **ribosomes**), and highways moving things around (the **endoplasmic reticulum**). These are your animal and plant cells — the eukaryotes.

Here's the cool part: when the city needs to grow, it doesn't just get bigger — it **copies itself**. That's **mitosis**. It's like photocopying the entire blueprint and building a second identical city next door. But when it needs to create something special — like a seed to start a brand new, *unique* city — it uses **meiosis**, which shuffles the blueprints around to create something one-of-a-kind.

The big takeaway? Every living thing you see — from a tree to a whale to *you* — is just an incredibly well-organized collection of these tiny LEGO bricks, all working together.`;

/* ── Helpers ────────────────────────────────────── */

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function readTime(words: number) {
  const mins = Math.ceil(words / 200);
  return `${mins} min read`;
}

function getAllText(tab: SummaryTab): string {
  if (tab === "tldr") return tldrBullets.map((b) => `${b.keyword} ${b.text}`).join(" ");
  if (tab === "feynman") return feynmanContent;
  return deepDiveSections
    .flatMap((s) => s.paragraphs.flatMap((p) => p.terms.map((t) => `${t.before}${t.term}${t.after}`)))
    .join(" ");
}

/* ── Component ─────────────────────────────────── */

interface SummaryOutputProps {
  onStartQuiz?: () => void;
}

const SummaryOutput = ({ onStartQuiz }: SummaryOutputProps) => {
  const [activeTab, setActiveTab] = useState<SummaryTab>("tldr");

  const words = wordCount(getAllText(activeTab));

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Tab bar + meta */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 bg-secondary/40 rounded-lg p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
                activeTab === t.key
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="text-sm">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground/60 shrink-0">
          {words} words · {readTime(words)}
        </span>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto pr-1">
        <AnimatePresence mode="wait">
          {activeTab === "tldr" && (
            <motion.ul
              key="tldr"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {tldrBullets.map((b, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.25 }}
                  className="flex items-start gap-2 text-xs leading-relaxed"
                >
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>
                    <span className="font-semibold text-foreground">{b.keyword}:</span>{" "}
                    <span className="text-foreground/75">{b.text}</span>
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          )}

          {activeTab === "deep" && (
            <motion.div
              key="deep"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {deepDiveSections.map((section, si) => (
                <div key={si} className="space-y-2">
                  <h3 className="text-sm font-heading font-semibold text-foreground">{section.heading}</h3>
                  {section.paragraphs.map((p, pi) => (
                    <p key={pi} className="text-xs leading-relaxed text-foreground/80">
                      {p.terms.map((t, ti) => (
                        <span key={ti}>
                          {t.before}
                          <KeyTerm term={t.term} definition={t.def} />
                          {t.after}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "feynman" && (
            <motion.div
              key="feynman"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {feynmanContent.split("\n\n").map((paragraph, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="text-xs leading-relaxed text-foreground/80"
                >
                  {paragraph.split(/(\*\*[^*]+\*\*)/).map((segment, j) => {
                    if (segment.startsWith("**") && segment.endsWith("**")) {
                      const word = segment.slice(2, -2);
                      return (
                        <span key={j} className="font-semibold text-accent" style={{ textShadow: "0 0 10px hsl(38 92% 50% / 0.25)" }}>
                          {word}
                        </span>
                      );
                    }
                    return <span key={j}>{segment}</span>;
                  })}
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <button
        onClick={onStartQuiz}
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all duration-300",
          "bg-secondary/60 border border-border/40 text-foreground",
          "hover:bg-primary/15 hover:border-primary/40 hover:text-primary hover:shadow-[0_0_20px_hsl(239_84%_67%/0.12)]"
        )}
      >
        <HelpCircle className="h-3.5 w-3.5" />
        How well do you know this? — Quick 3-question quiz
      </button>
    </div>
  );
};

export default SummaryOutput;
