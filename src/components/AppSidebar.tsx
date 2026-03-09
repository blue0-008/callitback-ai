import { LayoutDashboard, BookOpen, HelpCircle, Layers, Zap, Library, Globe } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { getDueToday } from "@/lib/store";
import { useTranslation } from "react-i18next";
import { useUser, type AppLanguage } from "@/contexts/AvatarContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const LANGUAGES: { code: AppLanguage; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "ar", flag: "🇸🇦", label: "العربية" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "es", flag: "🇪🇸", label: "Español" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { t } = useTranslation();
  const { language, setLanguage } = useUser();
  const isRtl = language === "ar";

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const navItems = [
    { title: t("nav.dashboard"), url: "/dashboard", icon: LayoutDashboard, badge: 0 },
    { title: t("nav.study"), url: "/study", icon: BookOpen, badge: 0 },
    { title: t("nav.library"), url: "/library", icon: Library, badge: 0 },
    { title: t("nav.quiz"), url: "/quiz", icon: HelpCircle, badge: 0 },
    { title: t("nav.flashcards"), url: "/flashcards", icon: Layers, badge: getDueToday() },
  ];

  return (
    <Sidebar side={isRtl ? "right" : "left"} collapsible="icon" className="border-r-0 rtl:border-r-0 rtl:border-l-0">
      <SidebarContent className="pt-4 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 mb-6 rtl:flex-row-reverse rtl:justify-end">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-heading text-base font-bold text-foreground tracking-tight">
                CallItBack
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">Study less. Remember more.</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 rtl:flex-row-reverse rtl:justify-end rtl:text-right ${
                          active
                            ? "bg-primary/15 text-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                        activeClassName=""
                      >
                        <span className="relative shrink-0">
                          <item.icon className={`h-4 w-4 transition-colors ${active ? "text-primary" : ""}`} />
                          {item.badge > 0 && (
                            <span className="absolute -top-1.5 ltr:-right-1.5 rtl:-left-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[9px] font-bold px-0.5">
                              {item.badge}
                            </span>
                          )}
                        </span>
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Language switcher at bottom */}
        <div className="px-3 pb-4">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors w-full rtl:flex-row-reverse rtl:justify-between",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                aria-label={t("profile.language", "Language")}
              >
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                {!collapsed && (
                  <span className="flex items-center gap-1.5">
                    <span>{currentLang.flag}</span>
                    <span className="uppercase text-xs">{currentLang.code}</span>
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent side={isRtl ? "left" : "right"} align="end" className="w-44 p-2" sideOffset={8}>
              <div className="space-y-1">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm transition-colors",
                      language === lang.code
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
