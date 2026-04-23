import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { SessionTimer } from "@/components/SessionTimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const typeFromUrl = getSafeSessionType(urlParams.get("type") || "RANGE_TRAINING");
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
      toast.success("Study session logged");
      void utils.weeks.getCurrent.invalidate();
      void utils.dashboard.getStats.invalidate();
      void utils.studyPlan.getWeek.invalidate();
      void utils.studyPlan.getToday.invalidate();
      setLocation("/");
    },
    onError: error => {
      toast.error(`Failed to log session: ${error.message}`);
    },
  });

  useEffect(() => {
    setFormData(previous => ({ ...previous, type: typeFromUrl }));
  }, [typeFromUrl]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const duration = Number.parseInt(formData.durationMinutes, 10);
    if (!Number.isFinite(duration) || duration < 1) {
      toast.error("Please enter a valid duration.");
      return;
    }

    createSession.mutate({
      date: dateFromUrl,
      type: formData.type as "RANGE_TRAINING" | "HAND_REVIEW" | "LIGHT_REVIEW",
      durationMinutes: duration,
      resourceUsed: formData.resourceUsed || undefined,
      handsReviewedCount: Number.parseInt(formData.handsReviewedCount, 10) || 0,
      drillsCompletedCount: Number.parseInt(formData.drillsCompletedCount, 10) || 0,
      accuracyPercent: formData.accuracyPercent
        ? Number.parseFloat(formData.accuracyPercent)
        : undefined,
      keyTakeaways: formData.keyTakeaways.trim() || undefined,
      fromPlan,
      planSlot,
    });
  }

  return (
    <div className="app-shell min-h-screen text-foreground">
      <header className="sticky top-0 z-10 border-b border-border/80 bg-background/90 backdrop-blur">
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

      <main className="container max-w-2xl py-6">
        <Card className="app-surface">
          <CardHeader>
            <CardTitle>Log Study Session</CardTitle>
            <CardDescription>
              {fromPlan
                ? `From Study Plan - ${planTypeLabel}`
                : "Capture your preflop study effort and takeaways."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Session Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={value =>
                    setFormData(previous => ({ ...previous, type: value }))
                  }
                  disabled={fromPlan}
                >
                  <SelectTrigger id="type">
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
                    setFormData(previous => ({
                      ...previous,
                      durationMinutes: String(minutes),
                    }))
                  }
                  initialMinutes={Number.parseInt(formData.durationMinutes, 10) || 0}
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
                    setFormData(previous => ({
                      ...previous,
                      durationMinutes: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource">Resource Used</Label>
                <Input
                  id="resource"
                  placeholder="Range Trainer, Hand Ranges, Notes..."
                  value={formData.resourceUsed}
                  onChange={event =>
                    setFormData(previous => ({
                      ...previous,
                      resourceUsed: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="handsReviewed">Hands Reviewed</Label>
                  <Input
                    id="handsReviewed"
                    type="number"
                    min="0"
                    value={formData.handsReviewedCount}
                    onChange={event =>
                      setFormData(previous => ({
                        ...previous,
                        handsReviewedCount: event.target.value,
                      }))
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
                      setFormData(previous => ({
                        ...previous,
                        drillsCompletedCount: event.target.value,
                      }))
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
                  placeholder="85"
                  value={formData.accuracyPercent}
                  onChange={event =>
                    setFormData(previous => ({
                      ...previous,
                      accuracyPercent: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="takeaways">Key Takeaway</Label>
                <Textarea
                  id="takeaways"
                  rows={4}
                  placeholder="What should you train next?"
                  value={formData.keyTakeaways}
                  onChange={event =>
                    setFormData(previous => ({
                      ...previous,
                      keyTakeaways: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-xl"
                  onClick={() => setLocation("/")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-[#FF8A1F]"
                  disabled={createSession.isPending}
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
