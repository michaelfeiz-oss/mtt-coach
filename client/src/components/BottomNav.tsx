import { FileText, Hand, Home, Plus, Target, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "dashboard", label: "Home", icon: Home, path: "/" },
  { id: "log", label: "Log", icon: Plus, path: "/log" },
  { id: "hands", label: "Hands", icon: Hand, path: "/hands" },
  { id: "tournaments", label: "Tourn.", icon: Trophy, path: "/tournaments" },
  { id: "notes", label: "Notes", icon: FileText, path: "/notes" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-border bg-sidebar/95 px-4 py-5 backdrop-blur lg:flex lg:flex-col">
        <div className="flex items-center gap-2 rounded-xl px-2 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF3E8] text-primary ring-1 ring-amber-200/70">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">MTT Coach</p>
            <p className="text-xs text-muted-foreground">Live Tracker</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-1.5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLocation(tab.path)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-[#FFF3E8] text-[#9A4D12] shadow-none ring-1 ring-amber-200/80"
                    : "text-secondary-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-[#9A4D12]" : "text-secondary-foreground")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="rounded-xl border border-border bg-secondary px-3 py-2">
          <p className="text-xs font-semibold text-foreground">Live play only</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Hands, tournaments, and notes.
          </p>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = isActive(tab.path);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLocation(tab.path)}
                className={cn(
                  "flex h-full flex-1 items-center justify-center transition",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex min-w-[62px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2 transition",
                    active
                      ? "bg-[#FFF3E8] text-[#9A4D12] ring-1 ring-amber-200/80"
                      : "hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] font-semibold">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
