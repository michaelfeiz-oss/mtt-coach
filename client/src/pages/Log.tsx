import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BottomSheet } from "@/components/BottomSheet";
import { Hand, Trophy, Target, FileText } from "lucide-react";

export default function Log() {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-6 border-b border-border">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Log Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">Quick entry for hands, tournaments, and study</p>
        </div>
      </div>

      <div className="container py-6 space-y-3">
        {/* LOG OPTIONS - 4 Buttons */}
        <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Log Options</h3>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-auto flex items-center justify-start gap-3 py-4 px-4"
          onClick={() => setActiveSheet("hand")}
        >
          <Hand className="h-6 w-6 text-primary" />
          <div className="text-left">
            <p className="font-semibold">Log Hand</p>
            <p className="text-xs text-muted-foreground">Quick entry for a single hand</p>
          </div>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-auto flex items-center justify-start gap-3 py-4 px-4"
          onClick={() => setActiveSheet("tournament")}
        >
          <Trophy className="h-6 w-6 text-orange-500" />
          <div className="text-left">
            <p className="font-semibold">Log Tournament</p>
            <p className="text-xs text-muted-foreground">Record tournament results</p>
          </div>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-auto flex items-center justify-start gap-3 py-4 px-4"
          onClick={() => setActiveSheet("leak")}
        >
          <Target className="h-6 w-6 text-red-500" />
          <div className="text-left">
            <p className="font-semibold">Add Leak</p>
            <p className="text-xs text-muted-foreground">Track a new leak to focus on</p>
          </div>
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="w-full h-auto flex items-center justify-start gap-3 py-4 px-4"
          onClick={() => setActiveSheet("note")}
        >
          <FileText className="h-6 w-6 text-slate-500" />
          <div className="text-left">
            <p className="font-semibold">Add Note</p>
            <p className="text-xs text-muted-foreground">Quick note or observation</p>
          </div>
        </Button>
      </div>

      {/* LOG HAND SHEET */}
      <BottomSheet
        isOpen={activeSheet === "hand"}
        onClose={() => setActiveSheet(null)}
        title="Log Hand"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Board</label>
            <Input placeholder="e.g., T♠ 8♥ 7♦" className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Stage</label>
            <div className="flex gap-2 mt-2">
              {["Preflop", "Flop", "Turn", "River"].map((stage) => (
                <Button key={stage} variant="outline" size="sm" className="flex-1">
                  {stage}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Mistake?</label>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" className="flex-1">
                Yes
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                No
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea placeholder="What happened?" className="mt-2 min-h-24" />
          </div>
          <Button className="w-full">Save Hand</Button>
        </div>
      </BottomSheet>

      {/* LOG TOURNAMENT SHEET */}
      <BottomSheet
        isOpen={activeSheet === "tournament"}
        onClose={() => setActiveSheet(null)}
        title="Log Tournament"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tournament Name</label>
            <Input placeholder="e.g., Kings 350" className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Buy-in</label>
            <Input placeholder="$" type="number" className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Prize</label>
            <Input placeholder="$" type="number" className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Finish Position</label>
            <Input placeholder="e.g., 5th" className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <Textarea placeholder="How did you play?" className="mt-2 min-h-24" />
          </div>
          <Button className="w-full">Save Tournament</Button>
        </div>
      </BottomSheet>

      {/* ADD LEAK SHEET */}
      <BottomSheet
        isOpen={activeSheet === "leak"}
        onClose={() => setActiveSheet(null)}
        title="Add Leak"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Leak Name</label>
            <Input placeholder="e.g., Overfolding to 3-bets" className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {["Preflop", "Flop", "Turn", "River", "ICM"].map((cat) => (
                <Button key={cat} variant="outline" size="sm">
                  {cat}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Severity</label>
            <div className="flex gap-2 mt-2">
              {["Low", "Medium", "High"].map((sev) => (
                <Button key={sev} variant="outline" size="sm" className="flex-1">
                  {sev}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="Describe the leak..." className="mt-2 min-h-24" />
          </div>
          <Button className="w-full">Save Leak</Button>
        </div>
      </BottomSheet>

      {/* ADD NOTE SHEET */}
      <BottomSheet
        isOpen={activeSheet === "note"}
        onClose={() => setActiveSheet(null)}
        title="Add Note"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Note Title</label>
            <Input placeholder="e.g., Key insight" className="mt-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Content</label>
            <Textarea placeholder="Your note..." className="mt-2 min-h-32" />
          </div>
          <Button className="w-full">Save Note</Button>
        </div>
      </BottomSheet>
    </div>
  );
}
