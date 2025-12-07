import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Study() {
  const [, setLocation] = useLocation();
  const [currentWeek, setCurrentWeek] = useState(1);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    drills: true,
    videos: false,
    reading: false,
    assignments: false,
    checklist: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const weekTopics = [
    "Preflop Fundamentals",
    "Postflop Basics",
    "3-Bet Pots IP",
    "3-Bet Pots OOP",
    "Turn Barreling",
    "River Value/Bluff",
    "Bubble ICM",
    "Final Table",
    "Live Exploits",
    "Consolidation",
    "Advanced Spots",
    "Review & Mastery",
  ];

  const weekDrills = {
    1: [
      { label: "Preflop Ranges", description: "Master opening ranges", drills: [{ title: "Preflop+", reps: "50 hands" }] },
      { label: "Position Basics", description: "Learn position fundamentals", drills: [{ title: "GTO Wizard", reps: "30 spots" }] },
      { label: "Hand Strength", description: "Evaluate hand strength", drills: [{ title: "Review", reps: "20 hands" }] },
      { label: "Bet Sizing", description: "Master bet sizing", drills: [{ title: "Drill", reps: "25 hands" }] },
      { label: "Fold Equity", description: "Understand fold equity", drills: [{ title: "Study", reps: "15 mins" }] },
      { label: "Aggression", description: "Develop aggression", drills: [{ title: "Play", reps: "1 session" }] },
      { label: "Review", description: "Review the week", drills: [{ title: "Recap", reps: "30 mins" }] },
    ],
    2: [
      { label: "Flop Play", description: "Master flop strategy", drills: [{ title: "Preflop+", reps: "40 hands" }] },
      { label: "C-Betting", description: "Learn c-betting patterns", drills: [{ title: "GTO Wizard", reps: "25 spots" }] },
      { label: "Check Back", description: "When to check back", drills: [{ title: "Review", reps: "15 hands" }] },
      { label: "Floating", description: "Floating technique", drills: [{ title: "Drill", reps: "20 hands" }] },
      { label: "Donk Bets", description: "Handle donk bets", drills: [{ title: "Study", reps: "20 mins" }] },
      { label: "Pot Control", description: "Control pot size", drills: [{ title: "Play", reps: "1 session" }] },
      { label: "Review", description: "Review the week", drills: [{ title: "Recap", reps: "30 mins" }] },
    ],
  };

  const currentWeekDrills = weekDrills[currentWeek as keyof typeof weekDrills] || weekDrills[1];
  const progressPercentage = (currentWeek / 12) * 100;

  return (
    <div className="pb-24">
      {/* Week Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
              disabled={currentWeek === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Week {currentWeek}</h1>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => setCurrentWeek(Math.min(12, currentWeek + 1))}
              disabled={currentWeek === 12}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-blue-100 text-lg font-medium mb-4">{weekTopics[currentWeek - 1]}</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-3">
        {/* Daily Drills */}
        <Card>
          <button
            onClick={() => toggleSection("drills")}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Daily Drills</CardTitle>
                  <CardDescription className="text-xs">7 days of focused practice</CardDescription>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform",
                    expandedSections.drills && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </button>
          {expandedSections.drills && (
            <CardContent className="pt-0 space-y-2">
              {currentWeekDrills.map((day: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-sm">Day {idx + 1}: {day.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{day.description}</p>
                  {day.drills && day.drills.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {day.drills.map((drill: any, dIdx: number) => (
                        <div key={dIdx} className="text-xs text-slate-600">
                          • {drill.title} ({drill.reps})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button
                className="w-full mt-3"
                onClick={() => setLocation("/guided-session")}
              >
                Start Guided Session →
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Videos */}
        <Card>
          <button
            onClick={() => toggleSection("videos")}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">📹 Videos</CardTitle>
                  <CardDescription className="text-xs">Recommended learning resources</CardDescription>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform",
                    expandedSections.videos && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </button>
          {expandedSections.videos && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Videos will be added based on week topic</p>
            </CardContent>
          )}
        </Card>

        {/* Reading */}
        <Card>
          <button
            onClick={() => toggleSection("reading")}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">📖 Reading</CardTitle>
                  <CardDescription className="text-xs">Articles and guides</CardDescription>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform",
                    expandedSections.reading && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </button>
          {expandedSections.reading && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Reading materials coming soon</p>
            </CardContent>
          )}
        </Card>

        {/* Assignments */}
        <Card>
          <button
            onClick={() => toggleSection("assignments")}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">✅ Assignments</CardTitle>
                  <CardDescription className="text-xs">Weekly challenges</CardDescription>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform",
                    expandedSections.assignments && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </button>
          {expandedSections.assignments && (
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">Assignments will appear here</p>
            </CardContent>
          )}
        </Card>

        {/* Review Checklist */}
        <Card>
          <button
            onClick={() => toggleSection("checklist")}
            className="w-full text-left"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">🎯 Review Checklist</CardTitle>
                  <CardDescription className="text-xs">End-of-week review</CardDescription>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform",
                    expandedSections.checklist && "rotate-180"
                  )}
                />
              </div>
            </CardHeader>
          </button>
          {expandedSections.checklist && (
            <CardContent className="pt-0 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Completed all 7 daily drills</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Reviewed key concepts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">Applied learnings in play</span>
              </label>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
