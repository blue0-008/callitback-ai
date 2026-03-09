import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileTabBar } from "@/components/MobileTabBar";
import AnimatedOutlet from "@/components/AnimatedOutlet";
import PomodoroTimer from "@/components/PomodoroTimer";
import ProfileDropdown from "@/components/ProfileDropdown";
import { useFocusMode } from "@/hooks/useFocusMode";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const AppLayout = () => {
  const { focusMode, toggleFocus } = useFocusMode();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative">
        {/* Noise overlay */}
        <div className="fixed inset-0 pointer-events-none z-[60] opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat" }} />

        {/* Desktop sidebar */}
        {!isMobile && (
          <div className={cn("transition-opacity duration-500", focusMode && "opacity-30 pointer-events-none")}>
            <AppSidebar />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className={cn(
            "h-14 flex items-center border-b border-border/40 px-4 backdrop-blur-md bg-background/80 sticky top-0 z-30 transition-opacity duration-500",
            focusMode && "opacity-30"
          )}>
            {!isMobile && (
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Toggle sidebar" />
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={toggleFocus}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  focusMode
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
                aria-label="Toggle focus mode (F)"
                title="Focus mode (F)"
              >
                {focusMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                S
              </div>
            </div>
          </header>
          <main className={cn("flex-1 p-4 sm:p-6 overflow-auto", isMobile && "pb-20")}>
            <AnimatedOutlet />
          </main>
        </div>

        {/* Mobile bottom tab bar */}
        {isMobile && <MobileTabBar />}

        {/* Pomodoro */}
        <PomodoroTimer />
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
