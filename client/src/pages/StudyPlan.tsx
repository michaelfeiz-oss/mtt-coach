import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, ArrowLeft, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function StudyPlan() {
  const [, setLocation] = useLocation();
  const [selectedDate] = useState(new Date());
  const [expandedDrills, setExpandedDrills] = useState<string | null>(null);

  const { data: weekPlan, isLoading } = trpc.studyPlan.getWeek.useQuery({
    date: selectedDate,
  });
  
  const { data: dailyFocus } = trpc.studyPlan.getDailyFocus.useQuery();
  
  const { data: curriculumWeek } = trpc.studyPlan.getCurriculumWeek.useQuery({
    date: selectedDate,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="container max-w-2xl">
          <p className="text-center text-slate-500 py-8">Loading study plan...</p>
        </div>
      </div>
    );
  }

  if (!weekPlan) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="container max-w-2xl">
          <p className="text-center text-slate-500 py-8">Unable to load study plan</p>
        </div>
      </div>
    );
  }

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = new Date(start).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = new Date(end).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startStr} - ${endStr}`;
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayOfWeek - 1] || "";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container max-w-2xl px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setLocation("/")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Study Plan</h1>
          </div>
          <p className="text-sm text-slate-600 ml-12">
            {formatDateRange(weekPlan.startDate, weekPlan.endDate)}
          </p>
        </div>
      </div>

      {/* Week Theme Banner */}
      {curriculumWeek && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-4">
          <div className="container max-w-2xl">
            <h2 className="text-xl font-bold">{curriculumWeek.themeTitle}</h2>
            <p className="text-blue-100 text-sm mt-1">{curriculumWeek.themeDescription}</p>
          </div>
        </div>
      )}

      {/* Daily Focus Section */}
      {dailyFocus && (
        <div className="container max-w-2xl px-4 pt-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">This Week's Focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dailyFocus.primaryLeak ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Primary Leak:</p>
                    <p className="text-base font-semibold text-blue-900">{dailyFocus.primaryLeak}</p>
                  </div>
                  {dailyFocus.secondaryLeaks.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Also Working On:</p>
                      <p className="text-sm text-slate-600">{dailyFocus.secondaryLeaks.join(", ")}</p>
                    </div>
                  )}
                  <div className="pt-2 border-t border-blue-200">
                    <p className="text-sm font-medium text-slate-700 mb-1">Weekly Goal:</p>
                    <p className="text-sm text-slate-600">{dailyFocus.weeklyGoal}</p>
                  </div>
                  {dailyFocus.suggestedDeepDiveTopic && (
                    <div className="pt-2 border-t border-blue-200">
                      <p className="text-sm font-medium text-slate-700 mb-1">Suggested Deep Dive Topic:</p>
                      <p className="text-sm font-semibold text-blue-800">{dailyFocus.suggestedDeepDiveTopic}</p>
                      <p className="text-xs text-slate-500 mt-1">Based on your top leak - will appear on Day 5</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-600">
                  No leaks tracked yet. Start logging hands to get personalized recommendations!
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Study Plan Days */}
      <div className="container max-w-2xl px-4 py-6 space-y-4">
        {weekPlan.days.map((day) => {
          const dayDate = new Date(day.date);
          const isToday =
            dayDate.toDateString() === new Date().toDateString();
          const isPast = dayDate < new Date() && !isToday;
          const curriculumDay = curriculumWeek?.days.find(
            (d) => d.dayOfWeek === day.dayOfWeek
          );

          return (
            <Card
              key={day.planSlot}
              className={`${
                isToday
                  ? "border-blue-500 border-2 shadow-md"
                  : day.completed
                  ? "border-green-200 bg-green-50"
                  : isPast
                  ? "border-slate-200 bg-slate-50"
                  : "border-slate-200"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {day.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                      <CardTitle className="text-lg">
                        {getDayName(day.dayOfWeek)} • {day.label}
                      </CardTitle>
                    </div>
                    <p className="text-xs text-slate-500 ml-7">
                      {dayDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {isToday && (
                        <span className="ml-2 text-blue-600 font-medium">
                          Today
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-700">{day.description}</p>

                {/* Curriculum Drills Section */}
                {curriculumDay && curriculumDay.drills.length > 0 && (
                  <div className="border-t pt-3 mt-3">
                    <button
                      onClick={() =>
                        setExpandedDrills(
                          expandedDrills === day.planSlot ? null : day.planSlot
                        )
                      }
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedDrills === day.planSlot ? "rotate-180" : ""
                        }`}
                      />
                      View Drills & Tools ({curriculumDay.drills.length})
                    </button>

                    {expandedDrills === day.planSlot && (
                      <div className="mt-3 space-y-3 bg-slate-50 p-3 rounded-lg">
                        {curriculumDay.drills.map((drill) => (
                          <div
                            key={drill.drillId}
                            className="bg-white p-3 rounded border border-slate-200"
                          >
                            <h4 className="font-medium text-sm text-slate-900">
                              {drill.title}
                            </h4>
                            <div className="mt-2 space-y-1 text-xs text-slate-600">
                              <p>
                                <span className="font-medium">Primary Tool:</span>{" "}
                                {drill.primaryTool}
                              </p>
                              {drill.tools && drill.tools.length > 0 && (
                                <p>
                                  <span className="font-medium">Tools:</span>{" "}
                                  {drill.tools.join(", ")}
                                </p>
                              )}
                              <p>
                                <span className="font-medium">Reps:</span> {drill.reps}
                              </p>
                              <p>
                                <span className="font-medium">Instructions:</span>{" "}
                                {drill.instructions}
                              </p>
                              <p>
                                <span className="font-medium">Success Metric:</span>{" "}
                                {drill.successMetric}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {day.completed ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">Completed</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => {
                      const params = new URLSearchParams({
                        fromPlan: "true",
                        planSlot: day.planSlot,
                        type: day.type,
                        date: dayDate.toISOString(),
                      });
                      setLocation(`/log-session?${params.toString()}`);
                    }}
                    className="w-full"
                    variant={isToday ? "default" : "outline"}
                  >
                    Start Session
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
