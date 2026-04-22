import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { SessionTimer } from "@/components/SessionTimer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const SESSION_TYPES = [
  { value: "RANGE_TRAINING", label: "Range Training" },
  { value: "HAND_REVIEW", label: "Hand Review" },
  { value: "LIGHT_REVIEW", label: "Notes / Light Review" },
] as const;

function getSafeSessionType(value: string) {
  return SESSION_TYPES.some(type => type.value === value)
    ? value
    : "RANGE_TRAINING";
}

export default function LogStudySession() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const urlParams = new URLSearchParams(window.location.search);
  const fromPlan = urlParams.get("fromPlan") === "true";
  const planSlot = urlParams.get("planSlot") || undefined;
  const typeFromUrl = getSafeSessionType(urlParams.get("type") || "HAND_REVIEW");
  const dateFromUrl = urlParams.get("date")
    ? new Date(urlParams.get("date")!)
    : new Date();
  const planTypeLabel = useMemo(
    () =>
      SESSION_TYPES.find(type => type.value === typeFromUrl)?.label ??
      "Preflop study",
    [typeFromUrl]
  );

  const [formData, setFormData] = useState({
    type: typeFromUrl,
    durationMinutes: "0",
    resourceUsed: "",
    handsReviewedCount: "0",
    drillsCompletedCount: "0",
    accuracyPercent: "",
    keyTakeaways: "",
  });

  const createSession = trpc.studySessions.create.useMutation({
    onSuccess: () => {
      toast.success("Study session logged successfully.");
      utils.weeks.getCurrent.invalidate();
      utils.dashboard.getStats.invalidate();
      utils.studyPlan.getWeek.invalidate();
      utils.studyPlan.getToday.invalidate();
      setLocation("/");
    },
    onError: error => {
      toast.error(`Failed to log session: ${error.message}`);
    },
  });

  useEffect(() => {
    setFormData(previous => ({
      ...previous,
      type: typeFromUrl,
    }));
  }, [typeFromUrl]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!formData.durationMinutes || parseInt(formData.durationMinutes) < 1) {
      toast.error("Please enter a valid duration.");
      return;
    }

    createSession.mutate({
      date: dateFromUrl,
      type: formData.type as
        | "RANGE_TRAINING"
        | "HAND_REVIEW"
        | "LIGHT_REVIEW",
      durationMinutes: parseInt(formData.durationMinutes),
      resourceUsed: formData.resourceUsed || undefined,
      handsReviewedCount: parseInt(formData.handsReviewedCount) || 0,
      drillsCompletedCount: parseInt(formData.drillsCompletedCount) || 0,
      accuracyPercent: formData.accuracyPercent
        ? parseFloat(formData.accuracyPercent)
        : undefined,
      keyTakeaways: formData.keyTakeaways || undefined,
      fromPlan,
      planSlot,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="container py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Log Study Session</CardTitle>
            <CardDescription>
              {fromPlan ? (
                <span className="font-medium text-blue-600">
                  From Study Plan - {planTypeLabel}
                </span>
              ) : (
                "Record a preflop study session, hand review, or note pass."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Session Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={value =>
                    setFormData({ ...formData, type: value })
                  }
                  disabled={fromPlan}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Session Timer</Label>
                <SessionTimer
                  onDurationChange={minutes =>
                    setFormData({
                      ...formData,
                      durationMinutes: minutes.toString(),
                    })
                  }
                  initialMinutes={parseInt(formData.durationMinutes) || 0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  placeholder="30"
                  value={formData.durationMinutes}
                  onChange={event =>
                    setFormData({
                      ...formData,
                      durationMinutes: event.target.value,
                    })
                  }
                  required
                />
                <p className="text-xs text-slate-500">
                  Auto-filled by timer, or enter manually.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource">Resource Used</Label>
                <Input
                  id="resource"
                  placeholder="e.g., Range Trainer, Hand Ranges, Notes"
                  value={formData.resourceUsed}
                  onChange={event =>
                    setFormData({
                      ...formData,
                      resourceUsed: event.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="handsReviewed">Hands Reviewed</Label>
                  <Input
                    id="handsReviewed"
                    type="number"
                    min="0"
                    value={formData.handsReviewedCount}
                    onChange={event =>
                      setFormData({
                        ...formData,
                        handsReviewedCount: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drills">Range Reps</Label>
                  <Input
                    id="drills"
                    type="number"
                    min="0"
                    value={formData.drillsCompletedCount}
                    onChange={event =>
                      setFormData({
                        ...formData,
                        drillsCompletedCount: event.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accuracy">Accuracy (%)</Label>
                <Input
                  id="accuracy"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="85.5"
                  value={formData.accuracyPercent}
                  onChange={event =>
                    setFormData({
                      ...formData,
                      accuracyPercent: event.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="takeaways">Key Takeaways</Label>
                <Textarea
                  id="takeaways"
                  placeholder="What should you study or remember next?"
                  rows={4}
                  value={formData.keyTakeaways}
                  onChange={event =>
                    setFormData({
                      ...formData,
                      keyTakeaways: event.target.value,
                    })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSession.isPending}
                  className="flex-1"
                >
                  {createSession.isPending ? "Saving..." : "Save Session"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
