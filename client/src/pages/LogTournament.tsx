import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TournamentFormData {
  date: string;
  venue: string;
  buyIn: string;
  reEntries: string;
  finalPosition: string;
  prize: string;
  notesOverall: string;
}

function parseFinalPosition(value: string) {
  const match = value.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : undefined;
}

export default function LogTournament() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState<TournamentFormData>({
    date: new Date().toISOString().slice(0, 16),
    venue: "",
    buyIn: "",
    reEntries: "0",
    finalPosition: "",
    prize: "",
    notesOverall: "",
  });

  const createTournament = trpc.tournaments.create.useMutation({
    onSuccess: () => {
      toast.success("Tournament logged");
      void utils.weeks.getCurrent.invalidate();
      void utils.dashboard.getStats.invalidate();
      void utils.tournaments.getByWeek.invalidate();
      setLocation("/");
    },
    onError: error => {
      toast.error(`Could not save tournament: ${error.message}`);
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!formData.buyIn) {
      toast.error("Buy-in is required.");
      return;
    }

    if (!formData.finalPosition) {
      toast.error("Final position is required.");
      return;
    }

    createTournament.mutate({
      date: new Date(formData.date),
      buyIn: Number.parseFloat(formData.buyIn),
      reEntries: Number.parseInt(formData.reEntries, 10) || 0,
      finalPosition: parseFinalPosition(formData.finalPosition),
      prize: Number.parseFloat(formData.prize) || 0,
      venue: formData.venue || undefined,
      notesOverall: formData.notesOverall.trim() || undefined,
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
            <CardTitle>Log Tournament Result</CardTitle>

          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date &amp; Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={event =>
                    setFormData(previous => ({
                      ...previous,
                      date: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="buyIn">Buy-in ($) *</Label>
                  <Input
                    id="buyIn"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="220"
                    value={formData.buyIn}
                    onChange={event =>
                      setFormData(previous => ({
                        ...previous,
                        buyIn: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reEntries">Re-entries</Label>
                  <Input
                    id="reEntries"
                    type="number"
                    min="0"
                    value={formData.reEntries}
                    onChange={event =>
                      setFormData(previous => ({
                        ...previous,
                        reEntries: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finalPosition">Final Position *</Label>
                  <Input
                    id="finalPosition"
                    placeholder="e.g. 12"
                    value={formData.finalPosition}
                    onChange={event =>
                      setFormData(previous => ({
                        ...previous,
                        finalPosition: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prize">Prize ($)</Label>
                  <Input
                    id="prize"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={formData.prize}
                    onChange={event =>
                      setFormData(previous => ({
                        ...previous,
                        prize: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  placeholder="Poker room or platform"
                  value={formData.venue}
                  onChange={event =>
                    setFormData(previous => ({
                      ...previous,
                      venue: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notesOverall">Session Note</Label>
                <Textarea
                  id="notesOverall"
                  rows={4}
                  placeholder="One quick takeaway from this session."
                  value={formData.notesOverall}
                  onChange={event =>
                    setFormData(previous => ({
                      ...previous,
                      notesOverall: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => setLocation("/")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-[#FF8A1F]"
                  disabled={createTournament.isPending}
                >
                  {createTournament.isPending ? "Saving..." : "Save Tournament"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
