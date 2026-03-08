import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { type ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4 }}
    className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4"
  >
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 flex items-center justify-center">
      {icon || <Sparkles className="h-8 w-8 text-primary/40" />}
    </div>
    <div className="space-y-1">
      <h3 className="text-base font-heading font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
    {action}
  </motion.div>
);

export default EmptyState;
