import { LayoutDashboard, BookOpen, HelpCircle, Layers, BarChart3, Zap } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { totalDueToday } from "@/pages/Flashcards";
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

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, badge: 0 },
  { title: "Study", url: "/study", icon: BookOpen, badge: 0 },
  { title: "Quiz", url: "/quiz", icon: HelpCircle, badge: 0 },
  { title: "Flashcards", url: "/flashcards", icon: Layers, badge: totalDueToday },
  { title: "Progress", url: "/progress", icon: BarChart3, badge: 0 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="pt-4">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 mb-6">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-heading text-base font-bold text-foreground tracking-tight">
              StudySprint
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          active
                            ? "bg-primary/15 text-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                        activeClassName=""
                      >
                        <span className="relative shrink-0">
                          <item.icon className={`h-4 w-4 transition-colors ${active ? "text-primary" : ""}`} />
                          {item.badge > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[9px] font-bold px-0.5">
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
      </SidebarContent>
    </Sidebar>
  );
}
