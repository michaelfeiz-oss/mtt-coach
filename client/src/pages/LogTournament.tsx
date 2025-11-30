import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function LogTournament() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    name: "",
    venue: "",
    date: new Date().toISOString().slice(0, 16),
    buyIn: "",
    startingStack: "",
    fieldSize: "",
    reEntries: "0",
    finalPosition: "",
    prize: "0",
    stageReached: "",
    selfRating: "",
    mentalRating: "",
    notesOverall: "",
  });

  const createTournament = trpc.tournaments.create.useMutation({
    onSuccess: () => {
      toast.success("Tournament logged successfully!");
      utils.weeks.getCurrent.invalidate();
      utils.dashboard.getStats.invalidate();
      utils.tournaments.getByWeek.invalidate();
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`Failed to log tournament: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.buyIn || parseFloat(formData.buyIn) < 0) {
      toast.error("Please enter a valid buy-in amount");
      return;
    }

    createTournament.mutate({
      date: new Date(formData.date),
      name: formData.name || undefined,
      venue: formData.venue || undefined,
      buyIn: parseFloat(formData.buyIn),
      startingStack: formData.startingStack ? parseInt(formData.startingStack) : undefined,
      fieldSize: formData.fieldSize ? parseInt(formData.fieldSize) : undefined,
      reEntries: parseInt(formData.reEntries) || 0,
      finalPosition: formData.finalPosition ? parseInt(formData.finalPosition) : undefined,
      prize: parseFloat(formData.prize) || 0,
      stageReached: formData.stageReached ? (formData.stageReached as any) : undefined,
      selfRating: formData.selfRating ? parseInt(formData.selfRating) : undefined,
      mentalRating: formData.mentalRating ? parseInt(formData.mentalRating) : undefined,
      notesOverall: formData.notesOverall || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Log Tournament</CardTitle>
            <CardDescription>Record your tournament results and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name</Label>
                  <Input
                    id="name"
                    placeholder="Thursday Night $220"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    placeholder="Kings Poker, APL"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  />
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              {/* Buy-in & Re-entries */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyIn">Buy-in ($) *</Label>
                  <Input
                    id="buyIn"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="220"
                    value={formData.buyIn}
                    onChange={(e) => setFormData({ ...formData, buyIn: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reEntries">Re-entries</Label>
                  <Input
                    id="reEntries"
                    type="number"
                    min="0"
                    value={formData.reEntries}
                    onChange={(e) => setFormData({ ...formData, reEntries: e.target.value })}
                  />
                </div>
              </div>

              {/* Field Size & Starting Stack */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fieldSize">Field Size</Label>
                  <Input
                    id="fieldSize"
                    type="number"
                    min="1"
                    placeholder="45"
                    value={formData.fieldSize}
                    onChange={(e) => setFormData({ ...formData, fieldSize: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startingStack">Starting Stack</Label>
                  <Input
                    id="startingStack"
                    type="number"
                    min="1"
                    placeholder="20000"
                    value={formData.startingStack}
                    onChange={(e) => setFormData({ ...formData, startingStack: e.target.value })}
                  />
                </div>
              </div>

              {/* Final Position & Prize */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="finalPosition">Final Position</Label>
                  <Input
                    id="finalPosition"
                    type="number"
                    min="1"
                    placeholder="8"
                    value={formData.finalPosition}
                    onChange={(e) => setFormData({ ...formData, finalPosition: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prize">Prize ($)</Label>
                  <Input
                    id="prize"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="450"
                    value={formData.prize}
                    onChange={(e) => setFormData({ ...formData, prize: e.target.value })}
                  />
                </div>
              </div>

              {/* Stage Reached */}
              <div className="space-y-2">
                <Label htmlFor="stage">Stage Reached</Label>
                <Select
                  value={formData.stageReached}
                  onValueChange={(value) => setFormData({ ...formData, stageReached: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EARLY">Early</SelectItem>
                    <SelectItem value="MID">Mid</SelectItem>
                    <SelectItem value="LATE">Late</SelectItem>
                    <SelectItem value="FT">Final Table</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selfRating">Self Rating (0-10)</Label>
                  <Input
                    id="selfRating"
                    type="number"
                    min="0"
                    max="10"
                    placeholder="7"
                    value={formData.selfRating}
                    onChange={(e) => setFormData({ ...formData, selfRating: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mentalRating">Mental Rating (0-10)</Label>
                  <Input
                    id="mentalRating"
                    type="number"
                    min="0"
                    max="10"
                    placeholder="8"
                    value={formData.mentalRating}
                    onChange={(e) => setFormData({ ...formData, mentalRating: e.target.value })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Overall performance, key hands, mental state..."
                  rows={4}
                  value={formData.notesOverall}
                  onChange={(e) => setFormData({ ...formData, notesOverall: e.target.value })}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/")} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={createTournament.isPending} className="flex-1">
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
