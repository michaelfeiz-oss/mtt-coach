import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DrillCard } from "@/components/DrillCard";

// Mock 12-week program data
const PROGRAM_WEEKS = [
  {
    week: 1,
    name: "Preflop Foundation",
    focus: "Master opening ranges and blind defense",
    progress: 8,
    days: [
      { day: "Monday", title: "Opening Ranges", tool: "Preflop+", template: { name: "Preflop+ Day", tool: "Preflop+", duration: "30–45 minutes", steps: ["Do 20 randomized range recall drills", "Do 10 blind-defense drills", "Save 3 rules to your Notes"], deliverable: "3 preflop heuristics" } },
      { day: "Tuesday", title: "3-bet / 4-bet", tool: "Preflop+", template: { name: "Preflop+ Day", tool: "Preflop+", duration: "30–45 minutes", steps: ["Do 20 randomized range recall drills", "Do 10 blind-defense drills", "Save 3 rules to your Notes"], deliverable: "3 preflop heuristics" } },
      { day: "Wednesday", title: "Blind Defense", tool: "Preflop+", template: { name: "Preflop+ Day", tool: "Preflop+", duration: "30–45 minutes", steps: ["Do 20 randomized range recall drills", "Do 10 blind-defense drills", "Save 3 rules to your Notes"], deliverable: "3 preflop heuristics" } },
      { day: "Thursday", title: "Early Stage Exploits", tool: "APT", template: { name: "Exploit Day (APT)", tool: "APT", duration: "45–60 minutes", steps: ["Play 1 APT session", "Identify 2–3 population tendencies", "Write exploit rules"], deliverable: "2–3 exploit rules" } },
      { day: "Friday", title: "SRP Solver Spots", tool: "Postflopizer", template: { name: "Solver Day", tool: "Postflopizer", duration: "45 minutes", steps: ["Load 10 spots matching the weekly theme", "Compare solver strategy vs your instinct", "Write 3 heuristics"], deliverable: "3 postflop rules" } },
    ],
  },
  {
    week: 2,
    name: "Flop Strategy",
    focus: "C-bet textures and multiway dynamics",
    progress: 0,
    days: [
      { day: "Monday", title: "C-bet Textures", tool: "Postflopizer", template: { name: "Solver Day", tool: "Postflopizer", duration: "45 minutes", steps: ["Load 10 spots matching the weekly theme", "Compare solver strategy vs your instinct", "Write 3 heuristics"], deliverable: "3 postflop rules" } },
      { day: "Tuesday", title: "Turns After C-bet", tool: "Postflopizer", template: { name: "Solver Day", tool: "Postflopizer", duration: "45 minutes", steps: ["Load 10 spots matching the weekly theme", "Compare solver strategy vs your instinct", "Write 3 heuristics"], deliverable: "3 postflop rules" } },
      { day: "Wednesday", title: "Multiway Strategy", tool: "Postflopizer", template: { name: "Solver Day", tool: "Postflopizer", duration: "45 minutes", steps: ["Load 10 spots matching the weekly theme", "Compare solver strategy vs your instinct", "Write 3 heuristics"], deliverable: "3 postflop rules" } },
      { day: "Thursday", title: "Solver 10 Flops", tool: "Postflopizer", template: { name: "Solver Day", tool: "Postflopizer", duration: "45 minutes", steps: ["Load 10 spots matching the weekly theme", "Compare solver strategy vs your instinct", "Write 3 heuristics"], deliverable: "3 postflop rules" } },
      { day: "Friday", title: "APT Tournament", tool: "APT", template: { name: "Tournament Simulation Day", tool: "APT", duration: "1 hour", steps: ["Play 1 MTT simulation", "Mark 3 hands", "Review them in MTT Coach"], deliverable: "3 corrected hands" } },
    ],
  },
  {
    week: 3,
    name: "Aggression / Bluffing",
    focus: "Bluff combos and turn aggression",
    progress: 0,
    days: [
      { day: "Monday", title: "Bluff Combos", tool: "Postflopizer", template: { name: "Solver Day", tool: "Postflopizer", duration: "45 minutes", steps: ["Load 10 spots matching the weekly theme", "Compare solver strategy vs your instinct", "Write 3 heuristics"], deliverable: "3 postflop rules" } },
      { day: "Tuesday", title: "Turn Aggression", tool: "Postflopizer", template: { name: "Solver Day", tool: "Postflopizer", duration: "45 minutes", steps: ["Load 10 spots matching the weekly theme", "Compare solver strategy vs your instinct", "Write 3 heuristics"], deliverable: "3 postflop rules" } },
      { day: "Wednesday", title: "River Bluffs", tool: "Postflopizer", template: { name: "Solver Day", tool: "Postflopizer", duration: "45 minutes", steps: ["Load 10 spots matching the weekly theme", "Compare solver strategy vs your instinct", "Write 3 heuristics"], deliverable: "3 postflop rules" } },
      { day: "Thursday", title: "Scare-card Exploit", tool: "APT", template: { name: "Exploit Day (APT)", tool: "APT", duration: "45–60 minutes", steps: ["Play 1 APT session", "Identify 2–3 population tendencies", "Write exploit rules"], deliverable: "2–3 exploit rules" } },
      { day: "Friday", title: "Review Bluffs", tool: "MTT Coach", template: { name: "Weekly Review", tool: "MTT Coach", duration: "20–30 minutes", steps: ["Review your week's notes", "Select 1 leak to fix", "Set next week's focus"], deliverable: "1 main leak" } },
    ],
  },
];

export default function Study() {
  const [currentWeekIdx, setCurrentWeekIdx] = useState(0);
  const currentWeek = PROGRAM_WEEKS[currentWeekIdx];

  const goToPreviousWeek = () => {
    setCurrentWeekIdx((prev) => Math.max(0, prev - 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekIdx((prev) => Math.min(PROGRAM_WEEKS.length - 1, prev + 1));
  };

  return (
    <div className="pb-24">
      {/* Header with Week Info */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold">Week {currentWeek.week}</h1>
          <p className="text-lg font-semibold mt-1">{currentWeek.name}</p>
          <p className="text-blue-100 text-sm mt-2">{currentWeek.focus}</p>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Progress</span>
              <span className="text-xs font-medium">{currentWeek.progress}%</span>
            </div>
            <Progress value={currentWeek.progress} className="h-2" />
          </div>

          {/* Week Navigation */}
          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={goToPreviousWeek}
              disabled={currentWeekIdx === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={goToNextWeek}
              disabled={currentWeekIdx === PROGRAM_WEEKS.length - 1}
            >
              Next Week
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Daily Drills */}
      <div className="container py-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Daily Drills</h3>

        <div className="space-y-3">
          {currentWeek.days.map((day: any, idx: number) => (
            <DrillCard
              key={idx}
              day={day.day}
              title={day.title}
              tool={day.tool}
              template={day.template}
              onStartSession={() => console.log(`Starting ${day.day} session`)}
              onAddRules={() => console.log(`Adding rules for ${day.day}`)}
            />
          ))}
        </div>

        {/* Weekly Review Card */}
        <Card className="border-l-4 border-l-purple-500 mt-6">
          <CardHeader>
            <CardTitle className="text-base">Weekly Review</CardTitle>
            <CardDescription>Complete your week's review</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              Start Weekly Review
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
