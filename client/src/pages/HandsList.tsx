import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.09),transparent_28rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_44%,#eef2f7_100%)] pb-24">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <QuickAddHand />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-6">
        <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/95 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <CardTitle>Preflop Hand Review</CardTitle>
            <CardDescription>
              Scan logged tournament spots by hand, stack, position, decision,
              and lesson.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !hands || hands.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-4">No preflop hands logged yet</p>
                <p className="text-sm text-slate-400">
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
                      className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-all hover:border-orange-200 hover:bg-white hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {hand.heroHand && (
                              <span className="font-mono font-bold text-lg">{hand.heroHand}</span>
                            )}
                            {hand.heroPosition && (
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {hand.heroPosition}
                              </span>
                            )}
                            {hand.reviewed && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Reviewed
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {hand.spotType && <span>{hand.spotType.replace(/_/g, " ")}</span>}
                            {hand.effectiveStackBb && <span>{hand.effectiveStackBb.toFixed(1)}bb</span>}
                            <span>BBA</span>
                            {hand.mistakeSeverity > 0 && (
                              <span className="text-red-600 font-medium">
                                Mistake: {hand.mistakeSeverity}/3
                              </span>
                            )}
                          </div>

                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {tags.map((tag: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingHandId(hand.id);
                            }}
                            className="h-8 w-8 p-0"
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
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
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
