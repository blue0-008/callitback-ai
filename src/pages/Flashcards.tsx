import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SubjectBadge from "@/components/SubjectBadge";
import EmptyState from "@/components/EmptyState";
import FlashcardPlayer, { type Flashcard } from "@/components/FlashcardPlayer";
import { getDecks, saveDecks, type SavedDeck } from "@/lib/store";
import { useNavigate, useSearchParams } from "react-router-dom";

function loadDeckCards(id: string): Flashcard[] {
  try {
    const raw = localStorage.getItem(`callitback_deck_data_${id}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const Flashcards = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<string | null>(null);
  const [activeCards, setActiveCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    const loaded = getDecks();
    setDecks(loaded);

    // Auto-open deck from URL param (coming from /study)
    const idParam = searchParams.get("id");
    if (idParam) {
      const found = loaded.find((d) => d.id === idParam);
      if (found) {
        const cards = loadDeckCards(idParam);
        if (cards.length > 0) {
          setActiveCards(cards);
          setActiveDeck(idParam);
        }
      }
    }
  }, [searchParams]);

  const openDeck = (id: string) => {
    const cards = loadDeckCards(id);
    setActiveCards(cards);
    setActiveDeck(id);
  };

  if (activeDeck) {
    const deck = decks.find((d) => d.id === activeDeck);
    return (
      <FlashcardPlayer
        deckTitle={deck?.title ?? "Flashcards"}
        cards={activeCards}
        onExit={() => {
          const reloaded = getDecks();
          setDecks(reloaded);
          setActiveDeck(null);
          navigate("/flashcards", { replace: true });
        }}
      />
    );
  }

  if (decks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-accent" /> Flashcard Decks
          </h1>
          <p className="text-muted-foreground text-sm">Review and master your flashcard collections.</p>
        </div>
        <EmptyState
          icon={<Layers className="h-8 w-8 text-accent/40" />}
          title="No decks yet"
          description="Generate your first flashcard set to get started 🃏"
          action={
            <button
              onClick={() => navigate("/study")}
              className="mt-2 flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 transition-all"
            >
              Go to Study
            </button>
          }
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6 text-accent" /> Flashcard Decks
        </h1>
        <p className="text-muted-foreground text-sm">Review and master your flashcard collections.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {decks.map((d) => (
          <GlassCard key={d.id} className="space-y-3" onClick={() => openDeck(d.id)}>
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
            <div className="relative w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 ltr:left-0 rtl:right-0 h-full rounded-full bg-accent transition-all"
                style={{ width: `${d.cards > 0 ? Math.round((d.mastered / d.cards) * 100) : 0}%` }}
              />
            </div>
          </GlassCard>
        ))}
      </div>
    </motion.div>
  );
};

export default Flashcards;
