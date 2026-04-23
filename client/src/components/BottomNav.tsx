import { Home, Plus, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/" },
    { id: "log", label: "Log", icon: Plus, path: "/log" },
    { id: "study", label: "Study", icon: BookOpen, path: "/study" },
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/80 bg-background/95 shadow-[0_-10px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-2xl items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => setLocation(tab.path)}
              className={cn(
                "flex h-full flex-1 items-center justify-center transition",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex min-w-[76px] flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-2 transition",
                  active
                    ? "bg-accent text-foreground shadow-sm shadow-black/25"
                    : "hover:bg-accent/70"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
