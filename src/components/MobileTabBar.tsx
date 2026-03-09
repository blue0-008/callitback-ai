import { LayoutDashboard, BookOpen, HelpCircle, Layers, Library } from "lucide-react";
import { NavLink as RouterLink, useLocation } from "react-router-dom";
import { getDueToday } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export function MobileTabBar() {
  const location = useLocation();
  const { t } = useTranslation();

  const items = [
    { title: t("nav.home"), url: "/dashboard", icon: LayoutDashboard, badge: 0 },
    { title: t("nav.study"), url: "/study", icon: BookOpen, badge: 0 },
    { title: t("nav.library"), url: "/library", icon: Library, badge: 0 },
    { title: t("nav.quiz"), url: "/quiz", icon: HelpCircle, badge: 0 },
    { title: t("nav.cards"), url: "/flashcards", icon: Layers, badge: getDueToday() },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/40 backdrop-blur-xl bg-background/90 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = location.pathname === item.url;
          return (
            <RouterLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.title}
            >
              <span className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[8px] font-bold px-0.5">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{item.title}</span>
            </RouterLink>
          );
        })}
      </div>
    </nav>
  );
}
