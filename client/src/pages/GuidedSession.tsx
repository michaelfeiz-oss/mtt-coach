import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Clock, Target } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function GuidedSession() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [currentDrillIndex, setCurrentDrillIndex] = useState(0);
  const [completedDrills, setCompletedDrills] = useState<string[]>([]);
  const [sessionNotes, setSessionNotes] = useState("");

  const params = new URLSearchParams(search);
  const fromDate = params.get("date") ? new Date(params.get("date")!) : new Date();

  const { data: todayDrills } = trpc.studyPlan.getCurriculumToday.useQuery();

  if (!todayDrills || !todayDrills.drills || todayDrills.drills.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="container max-w-2xl">
          <button
            onClick={() => setLocation("/")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="text-center text-slate-500 py-8">
            No drills available for today
          </p>
        </div>
      </div>
    );
  }

  const currentDrill = todayDrills.drills[currentDrillIndex];
  const isLastDrill = currentDrillIndex === todayDrills.drills.length - 1;
  const allCompleted = completedDrills.length === todayDrills.drills.length;

  const handleCompleteDrill = () => {
    if (!completedDrills.includes(currentDrill.drillId)) {
      setCompletedDrills([...completedDrills, currentDrill.drillId]);
    }
    if (!isLastDrill) {
      setCurrentDrillIndex(currentDrillIndex + 1);
    }
  };

  const handleFinishSession = async () => {
    // Save session with guided metadata
    const params = new URLSearchParams({
      fromPlan: "true",
      type: todayDrills.studyType,
      date: fromDate.toISOString(),
      guided: "true",
      completedDrills: completedDrills.join(","),
    });
    setLocation(`/log-session?${params.toString()}`);
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
            <h1 className="text-2xl font-bold">Guided Study Session</h1>
          </div>
          <p className="text-sm text-slate-600 ml-12">
            {todayDrills.focusTitle}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b px-4 py-4">
        <div className="container max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Drill {currentDrillIndex + 1} of {todayDrills.drills.length}
            </span>
            <span className="text-sm text-slate-500">
              {Math.round(((currentDrillIndex + 1) / todayDrills.drills.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentDrillIndex + 1) / todayDrills.drills.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Current Drill */}
      <div className="container max-w-2xl px-4 py-6">
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl">{currentDrill.title}</CardTitle>
                <p className="text-sm text-slate-600 mt-2">
                  {todayDrills.focusDescription}
                </p>
              </div>
              {completedDrills.includes(currentDrill.drillId) && (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drill Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-medium text-slate-600 uppercase">
                    Primary Tool
                  </span>
                </div>
                <p className="font-semibold text-slate-900">
                  {currentDrill.primaryTool}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-medium text-slate-600 uppercase">
                    Duration
                  </span>
                </div>
                <p className="font-semibold text-slate-900">{currentDrill.reps}</p>
              </div>
            </div>

            {/* Tools */}
            {currentDrill.tools && currentDrill.tools.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Tools:</p>
                <div className="flex flex-wrap gap-2">
                  {currentDrill.tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Instructions:
              </p>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                {currentDrill.instructions}
              </p>
            </div>

            {/* Success Metric */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Success Metric:
              </p>
              <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg font-medium">
                {currentDrill.successMetric}
              </p>
            </div>

            {/* Session Notes */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Session Notes (Optional)
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Add any notes about this drill or your progress..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {currentDrillIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentDrillIndex(currentDrillIndex - 1)}
                  className="flex-1"
                >
                  Previous
                </Button>
              )}
              {!isLastDrill && (
                <Button
                  onClick={handleCompleteDrill}
                  className="flex-1"
                  variant={
                    completedDrills.includes(currentDrill.drillId)
                      ? "outline"
                      : "default"
                  }
                >
                  {completedDrills.includes(currentDrill.drillId)
                    ? "Completed ✓"
                    : "Mark Complete"}
                </Button>
              )}
              {isLastDrill && (
                <Button
                  onClick={() => {
                    if (!completedDrills.includes(currentDrill.drillId)) {
                      setCompletedDrills([...completedDrills, currentDrill.drillId]);
                    }
                  }}
                  className="flex-1"
                  variant={
                    completedDrills.includes(currentDrill.drillId)
                      ? "outline"
                      : "default"
                  }
                >
                  {completedDrills.includes(currentDrill.drillId)
                    ? "Completed ✓"
                    : "Mark Complete"}
                </Button>
              )}
            </div>

            {/* Finish Session Button */}
            {allCompleted && (
              <Button
                onClick={handleFinishSession}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Finish Session & Log
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drill List Sidebar */}
      <div className="container max-w-2xl px-4 py-6">
        <h3 className="font-semibold text-slate-900 mb-3">Today's Drills</h3>
        <div className="space-y-2">
          {todayDrills.drills.map((drill, idx) => (
            <button
              key={drill.drillId}
              onClick={() => setCurrentDrillIndex(idx)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                idx === currentDrillIndex
                  ? "border-blue-500 bg-blue-50"
                  : completedDrills.includes(drill.drillId)
                  ? "border-green-200 bg-green-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {completedDrills.includes(drill.drillId) ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
                <span className="text-sm font-medium">{drill.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
