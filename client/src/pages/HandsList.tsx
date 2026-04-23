import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { QuickAddHand } from "@/components/QuickAddHand";
import { QuickEditHand } from "@/components/QuickEditHand";
import { useState } from "react";

export default function HandsList() {
  const [, setLocation] = useLocation();
  const [editingHandId, setEditingHandId] = useState<number | null>(null);
  const [deletingHandId, setDeletingHandId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: hands, isLoading } = trpc.hands.getByUser.useQuery({ limit: 50 });

  const deleteHand = trpc.hands.delete.useMutation({
    onSuccess: () => {
      toast.success("Hand deleted successfully");
      utils.hands.getByUser.invalidate();
      utils.dashboard.getStats.invalidate();
      setDeletingHandId(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete hand: ${error.message}`);
    },
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.13),transparent_26rem),linear-gradient(180deg,#09090b_0%,#18181b_48%,#0f172a_100%)] pb-24 text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/90 backdrop-blur">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2 text-zinc-300 hover:bg-white/[0.08] hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <QuickAddHand />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-6">
        <Card className="rounded-[1.2rem] border-white/10 bg-zinc-950/80 shadow-xl shadow-black/25">
          <CardHeader>
            <CardTitle className="text-zinc-100">Preflop Hand Review</CardTitle>
            <CardDescription className="text-zinc-400">
              Scan logged tournament spots by hand, stack, position, decision,
              and lesson.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/10" />
                ))}
              </div>
            ) : !hands || hands.length === 0 ? (
              <div className="py-12 text-center">
                <p className="mb-4 text-zinc-300">No preflop hands logged yet</p>
                <p className="text-sm text-zinc-500">
                  Use quick capture after a tournament session, then review here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {hands.map((hand) => {
                  const tags = hand.tagsJson ? JSON.parse(hand.tagsJson) : [];

                  return (
                    <div
                      key={hand.id}
                      onClick={() => setLocation(`/hands/${hand.id}`)}
                      className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-all hover:border-orange-300/40 hover:bg-white/[0.08] hover:shadow-md hover:shadow-black/20"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            {hand.heroHand && (
                              <span className="font-mono text-lg font-bold">{hand.heroHand}</span>
                            )}
                            {hand.heroPosition && (
                              <span className="rounded bg-white/[0.06] px-2 py-1 text-xs text-zinc-300">
                                {hand.heroPosition}
                              </span>
                            )}
                            {hand.reviewed && (
                              <span className="rounded bg-green-500/20 px-2 py-1 text-xs text-green-300">
                                Reviewed
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                            {hand.spotType && <span>{hand.spotType.replace(/_/g, " ")}</span>}
                            {hand.effectiveStackBb && <span>{hand.effectiveStackBb.toFixed(1)}bb</span>}
                            <span>BBA</span>
                            {hand.mistakeSeverity > 0 && (
                              <span className="font-medium text-red-400">
                                Mistake: {hand.mistakeSeverity}/3
                              </span>
                            )}
                          </div>

                          {tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {tags.map((tag: string, i: number) => (
                                <span
                                  key={i}
                                  className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingHandId(hand.id);
                            }}
                            className="h-8 w-8 p-0 text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingHandId(hand.id);
                            }}
                            className="h-8 w-8 p-0 text-red-400 hover:bg-red-500/15 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-5 w-5 text-zinc-500" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {editingHandId && (
        <QuickEditHand
          handId={editingHandId}
          open={!!editingHandId}
          onOpenChange={(open) => !open && setEditingHandId(null)}
        />
      )}

      <AlertDialog open={!!deletingHandId} onOpenChange={(open) => !open && setDeletingHandId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Hand?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this hand and remove it from all leak associations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingHandId && deleteHand.mutate({ id: deletingHandId })}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
