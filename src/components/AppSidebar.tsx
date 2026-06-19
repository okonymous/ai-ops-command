import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  Users,
  FileBarChart,
  LineChart,
  BrainCircuit,
  Settings,
  ServerCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/tasks", label: "Tasks", icon: ListTodo, exact: false },
  { to: "/calendar", label: "Calendar", icon: CalendarDays, exact: false },
  { to: "/team", label: "Team Members", icon: Users, exact: false },
  { to: "/reports", label: "Reports", icon: FileBarChart, exact: false },
  { to: "/analytics", label: "Analytics", icon: LineChart, exact: false },
  { to: "/ai-settings", label: "AI Settings", icon: BrainCircuit, exact: false },
  { to: "/settings", label: "System Settings", icon: Settings, exact: false },
] as const;

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <ServerCog className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold">IT Ops AI</p>
          <p className="text-[11px] text-muted-foreground">Task Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((item) => {
          const active = isActive(item.to, item.exact);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 text-[11px] text-muted-foreground">
        <p className="font-medium text-foreground/70">Powered by Lovable AI</p>
        <p>Cloud + Local model support</p>
      </div>
    </div>
  );
}
