import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ChevronRight, Edit, Plus, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickEditHand } from "@/components/QuickEditHand";
import { trpc } from "@/lib/trpc";

function safeParseTags(tagsJson?: string | null): string[] {
  if (!tagsJson) return [];
  try {
    const parsed = JSON.parse(tagsJson);
    return Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === "string")
      : [];
  } catch {
    return [];
  }
}

function statusLabel(reviewed: boolean, mistakeSeverity: number) {
  if (!reviewed) return "Review";
  if (mistakeSeverity > 0) return `Sev ${mistakeSeverity}`;
  return "Reviewed";
}

export default function HandsList() {
  const [, setLocation] = useLocation();
  const [editingHandId, setEditingHandId] = useState<number | null>(null);
  const [deletingHandId, setDeletingHandId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: hands = [], isLoading } = trpc.hands.getByUser.useQuery({
    limit: 100,
  });

  const reviewCounts = useMemo(
    () => ({
      total: hands.length,
      pending: hands.filter(hand => !hand.reviewed).length,
      reviewed: hands.filter(hand => hand.reviewed).length,
    }),
    [hands]
  );

  const deleteHand = trpc.hands.delete.useMutation({
    onSuccess: async () => {
      toast.success("Hand deleted");
      await utils.hands.getByUser.invalidate();
      setDeletingHandId(null);
    },
    onError: error => {
      toast.error(`Failed to delete hand: ${error.message}`);
    },
  });

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <header className="app-surface-elevated p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="app-eyebrow mb-2">Hand Log</p>
              <h1 className="text-3xl font-bold tracking-tight">Hands</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Logged decisions, notes, and review status.
              </p>
            </div>
            <Button
              className="h-11 rounded-xl px-4"
              onClick={() => setLocation("/log")}
            >
              <Plus className="h-4 w-4" />
              Log Hand
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-2">
          {[
            { label: "Total", value: reviewCounts.total },
            { label: "Review", value: reviewCounts.pending },
            { label: "Done", value: reviewCounts.reviewed },
          ].map(stat => (
            <Card key={stat.label} className="app-surface">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="app-surface">
          <CardHeader>
            <CardTitle>Saved Hands</CardTitle>
            <CardDescription>
              Tap a row for the hand detail and review notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(index => (
                  <Skeleton key={index} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : hands.length === 0 ? (
              <div className="app-empty-state p-5">
                No hands logged yet. Use the Log tab during or after play.
              </div>
            ) : (
              <div className="space-y-2">
                {hands.map(hand => {
                  const tags = safeParseTags(hand.tagsJson);
                  return (
                    <div
                      key={hand.id}
                      className="app-list-row flex items-start justify-between gap-3 p-3.5"
                    >
                      <button
                        type="button"
                        onClick={() => setLocation(`/hands/${hand.id}`)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-base font-semibold">
                            {hand.heroHand || hand.handClass || "Hand"}
                          </span>
                          {hand.heroPosition && (
                            <Badge variant="outline" className="rounded-full">
                              {hand.heroPosition}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              hand.reviewed
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-[#FFF7E6] text-[#9A4D12]"
                            }
                          >
                            {statusLabel(hand.reviewed, hand.mistakeSeverity)}
                          </Badge>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {[
                            hand.effectiveStackBb
                              ? `${Math.round(hand.effectiveStackBb)}bb`
                              : null,
                            hand.spotType?.replace(/_/g, " "),
                            new Date(hand.createdAt).toLocaleDateString(),
                          ]
                            .filter(Boolean)
                            .join(" | ")}
                        </p>

                        {tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {tags.map(tag => (
                              <span
                                key={tag}
                                className="rounded bg-sky-100 px-2 py-0.5 text-xs text-sky-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingHandId(hand.id)}
                          className="h-8 w-8 text-muted-foreground hover:bg-accent/70 hover:text-foreground"
                          aria-label="Quick edit hand"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingHandId(hand.id)}
                          className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700"
                          aria-label="Delete hand"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editingHandId && (
        <QuickEditHand
          handId={editingHandId}
          open={Boolean(editingHandId)}
          onOpenChange={open => !open && setEditingHandId(null)}
        />
      )}

      <AlertDialog
        open={Boolean(deletingHandId)}
        onOpenChange={open => !open && setDeletingHandId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete hand?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this hand log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingHandId && deleteHand.mutate({ id: deletingHandId })
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
