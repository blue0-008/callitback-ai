import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Plus } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SubjectBadge from "@/components/SubjectBadge";
import FlashcardPlayer, { type Flashcard } from "@/components/FlashcardPlayer";

/* ── Sample data ───────────────────────────────── */

const sampleCards: Record<string, Flashcard[]> = {
  chem: [
    { id: "c1", term: "Hydrogen (H)", definition: "Atomic number 1. The lightest element. Highly flammable diatomic gas." },
    { id: "c2", term: "Helium (He)", definition: "Atomic number 2. Noble gas, used in balloons and cryogenics." },
    { id: "c3", term: "Lithium (Li)", definition: "Atomic number 3. Soft alkali metal used in batteries." },
    { id: "c4", term: "Carbon (C)", definition: "Atomic number 6. Basis of organic chemistry, forms 4 bonds." },
    { id: "c5", term: "Oxygen (O)", definition: "Atomic number 8. Essential for respiration, makes up 21% of atmosphere." },
    { id: "c6", term: "Nitrogen (N)", definition: "Atomic number 7. Makes up 78% of atmosphere. Key component of amino acids." },
    { id: "c7", term: "Iron (Fe)", definition: "Atomic number 26. Transition metal, essential for hemoglobin." },
    { id: "c8", term: "Gold (Au)", definition: "Atomic number 79. Noble metal, excellent conductor, highly malleable." },
  ],
  hist: [
    { id: "h1", term: "Storming of the Bastille", definition: "July 14, 1789 — Parisian revolutionaries stormed the Bastille fortress, symbolizing the start of the French Revolution." },
    { id: "h2", term: "Reign of Terror", definition: "1793–1794 — Period of extreme political violence during the Revolution, led by the Committee of Public Safety." },
    { id: "h3", term: "Declaration of the Rights of Man", definition: "1789 — Fundamental document of the French Revolution defining individual and collective rights." },
    { id: "h4", term: "Napoleon's Rise", definition: "1799 — Napoleon Bonaparte staged a coup d'état, ending the Revolution and establishing the Consulate." },
    { id: "h5", term: "Execution of Louis XVI", definition: "January 21, 1793 — King Louis XVI was executed by guillotine, marking the end of absolute monarchy in France." },
  ],
  math: [
    { id: "m1", term: "sin²θ + cos²θ", definition: "Always equals 1. This is the Pythagorean identity, fundamental to trigonometry." },
    { id: "m2", term: "tan θ", definition: "Equals sin θ / cos θ. Undefined when cos θ = 0 (at 90° and 270°)." },
    { id: "m3", term: "sin(2θ)", definition: "Equals 2 sin θ cos θ. This is the double angle formula for sine." },
    { id: "m4", term: "cos(2θ)", definition: "Equals cos²θ − sin²θ, or 2cos²θ − 1, or 1 − 2sin²θ." },
  ],
  bio: [
    { id: "b1", term: "Mitosis", definition: "Cell division producing two identical daughter cells. Used for growth and repair." },
    { id: "b2", term: "Meiosis", definition: "Cell division producing four genetically unique gametes with half the chromosome number." },
    { id: "b3", term: "ATP", definition: "Adenosine triphosphate — the primary energy currency of cells." },
    { id: "b4", term: "Ribosome", definition: "Organelle that synthesizes proteins by translating messenger RNA." },
    { id: "b5", term: "Mitochondria", definition: "Double-membrane organelle that produces ATP through cellular respiration." },
    { id: "b6", term: "Nucleus", definition: "Membrane-bound organelle containing DNA that controls gene expression." },
  ],
};

const decks = [
  { id: "chem", title: "Periodic Table Elements", subject: "Chemistry", cards: 48, mastered: 32, dueToday: 5 },
  { id: "hist", title: "French Revolution Timeline", subject: "History", cards: 24, mastered: 18, dueToday: 3 },
  { id: "math", title: "Trigonometric Identities", subject: "Math", cards: 16, mastered: 5, dueToday: 8 },
  { id: "bio", title: "Cell Biology Vocabulary", subject: "Biology", cards: 30, mastered: 22, dueToday: 2 },
];

// Export for sidebar badge
export const totalDueToday = decks.reduce((sum, d) => sum + d.dueToday, 0);

const Flashcards = () => {
  const [activeDeck, setActiveDeck] = useState<string | null>(null);

  if (activeDeck) {
    const deck = decks.find((d) => d.id === activeDeck);
    const cards = sampleCards[activeDeck] ?? sampleCards.chem;
    return (
      <FlashcardPlayer
        deckTitle={deck?.title ?? "Flashcards"}
        cards={cards}
        onExit={() => setActiveDeck(null)}
      />
    );
  }

  return (
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
          <GlassCard key={d.id} className="space-y-3" onClick={() => setActiveDeck(d.id)}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{d.title}</p>
              <SubjectBadge subject={d.subject} />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{d.cards} cards</span>
              <span>{d.mastered} mastered</span>
              {d.dueToday > 0 && (
                <span className="text-accent font-medium">{d.dueToday} due today</span>
              )}
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
};

export default Flashcards;
