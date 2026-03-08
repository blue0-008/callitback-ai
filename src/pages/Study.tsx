import { motion } from "framer-motion";
import { Sparkles, Upload, ArrowRight } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SubjectBadge from "@/components/SubjectBadge";
import { Button } from "@/components/ui/button";

const subjects = ["Math", "Science", "History", "English", "Physics", "Biology", "Chemistry"];

const Study = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> AI Study Generator
        </h1>
        <p className="text-muted-foreground text-sm">Paste your notes or upload a document to generate study materials.</p>
      </div>

      <GlassCard hover={false} className="space-y-5">
        <textarea
          placeholder="Paste your notes, topic, or question here..."
          className="w-full h-40 bg-transparent resize-none text-sm placeholder:text-muted-foreground focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <SubjectBadge key={s} subject={s} className="cursor-pointer hover:scale-105 transition-transform" />
          ))}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <Button variant="outline" size="sm" className="gap-2 border-border/60">
            <Upload className="h-4 w-4" /> Upload PDF
          </Button>
          <Button size="sm" className="gap-2 ml-auto">
            Generate <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default Study;
