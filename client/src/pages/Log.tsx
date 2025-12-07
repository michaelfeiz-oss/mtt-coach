import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickAddHand } from "@/components/QuickAddHand";
import { QuickLogTournament } from "@/components/QuickLogTournament";

export default function Log() {
  const [, setLocation] = useLocation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hand: true,
    tournament: false,
    leak: false,
    session: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sections = [
    {
      id: "hand",
      title: "Log Hand",
      description: "Quick entry for a single hand",
      icon: "🃏",
    },
    {
      id: "tournament",
      title: "Log Tournament",
      description: "Record tournament results",
      icon: "🏆",
    },
    {
      id: "leak",
      title: "Add Leak",
      description: "Track a new leak to focus on",
      icon: "🎯",
    },
    {
      id: "session",
      title: "Log Study Session",
      description: "Record your study time",
      icon: "📚",
    },
  ];

  return (
    <div className="pb-24">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-6">
        <h1 className="text-2xl font-bold">Log Activity</h1>
        <p className="text-sm text-muted-foreground mt-1">Quick entry for hands, tournaments, and study</p>
      </div>

      <div className="container py-6 space-y-3">
        {/* Hand Logging */}
        <Card className="border-l-4 border-l-primary">
          <button
            onClick={() => toggleSection("hand")}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sections[0].icon}</span>
                  <div>
                    <CardTitle className="text-lg">{sections[0].title}</CardTitle>
                    <CardDescription className="text-xs">{sections[0].description}</CardDescription>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform",
                    expandedSections.hand && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </button>
          {expandedSections.hand && (
            <CardContent className="pt-0">
              <QuickAddHand />
            </CardContent>
          )}
        </Card>

        {/* Tournament Logging */}
        <Card className="border-l-4 border-l-orange-500">
          <button
            onClick={() => toggleSection("tournament")}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sections[1].icon}</span>
                  <div>
                    <CardTitle className="text-lg">{sections[1].title}</CardTitle>
                    <CardDescription className="text-xs">{sections[1].description}</CardDescription>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform",
                    expandedSections.tournament && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </button>
          {expandedSections.tournament && (
            <CardContent className="pt-0">
              <QuickLogTournament />
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-xs"
                onClick={() => setLocation("/log-tournament")}
              >
                Full Tournament Entry →
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Leak Tracking */}
        <Card className="border-l-4 border-l-red-500">
          <button
            onClick={() => toggleSection("leak")}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sections[2].icon}</span>
                  <div>
                    <CardTitle className="text-lg">{sections[2].title}</CardTitle>
                    <CardDescription className="text-xs">{sections[2].description}</CardDescription>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform",
                    expandedSections.leak && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </button>
          {expandedSections.leak && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                Leaks are automatically tracked from your hands. View them on the Dashboard.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/hands")}
              >
                View All Leaks →
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Study Session Logging */}
        <Card className="border-l-4 border-l-blue-500">
          <button
            onClick={() => toggleSection("session")}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sections[3].icon}</span>
                  <div>
                    <CardTitle className="text-lg">{sections[3].title}</CardTitle>
                    <CardDescription className="text-xs">{sections[3].description}</CardDescription>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform",
                    expandedSections.session && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </button>
          {expandedSections.session && (
            <CardContent className="pt-0">
              <Button
                className="w-full"
                onClick={() => setLocation("/log-session")}
              >
                Start Study Session →
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
