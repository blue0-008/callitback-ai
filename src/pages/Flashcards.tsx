import { motion } from "framer-motion";
import { Layers, Plus } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SubjectBadge from "@/components/SubjectBadge";

const decks = [
  { title: "Periodic Table Elements", subject: "Chemistry", cards: 48, mastered: 32 },
  { title: "French Revolution Timeline", subject: "History", cards: 24, mastered: 18 },
  { title: "Trigonometric Identities", subject: "Math", cards: 16, mastered: 5 },
  { title: "Cell Biology Vocabulary", subject: "Biology", cards: 30, mastered: 22 },
];

const Flashcards = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="max-w-4xl mx-auto space-y-8"
  >
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6 text-accent" /> Flashcard Decks
        </h1>
        <p className="text-muted-foreground text-sm">Review and master your flashcard collections.</p>
      </div>
      <button className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors">
        <Plus className="h-4 w-4" />
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {decks.map((d) => (
        <GlassCard key={d.title} className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{d.title}</p>
            <SubjectBadge subject={d.subject} />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{d.cards} cards</span>
            <span>{d.mastered} mastered</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.round((d.mastered / d.cards) * 100)}%` }}
            />
          </div>
        </GlassCard>
      ))}
    </div>
  </motion.div>
);

export default Flashcards;
