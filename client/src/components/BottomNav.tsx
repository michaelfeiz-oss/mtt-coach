import { BookOpen, Home, Plus, Target } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
  { id: "log", label: "Log", icon: Plus, path: "/log" },
  { id: "study", label: "Study", icon: BookOpen, path: "/study" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 border-r border-border bg-sidebar/95 px-4 py-5 backdrop-blur lg:flex lg:flex-col">
        <div className="flex items-center gap-2 rounded-xl px-2 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Target className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">MTT Coach</p>
            <p className="text-xs text-muted-foreground">Preflop Study</p>
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
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="rounded-xl border border-border bg-accent/75 px-3 py-2">
          <p className="text-xs font-semibold text-foreground">BBA only</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Preflop tournament spots up to 40bb.
          </p>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white lg:hidden">
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
                    "flex min-w-[76px] flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-2 transition",
                    active
                      ? "bg-primary/12"
                      : "hover:bg-accent"
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

