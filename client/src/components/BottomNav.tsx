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
    <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background z-50">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => setLocation(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
