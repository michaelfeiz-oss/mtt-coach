import { Link, useParams } from "wouter";
import { ArrowLeft, FileCode2, Info, Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ICM_CATEGORY_LABELS, ICM_TAG_LABELS } from "../../../../shared/icm";

export default function IcmSpotDetail() {
  const { spotId } = useParams<{ spotId: string }>();
  const parsedSpotId = Number(spotId);
  const validSpotId = Number.isFinite(parsedSpotId) ? parsedSpotId : 0;

  const { data: spot, isLoading, error } = trpc.icm.getSpot.useQuery(
    { spotId: validSpotId },
    { enabled: validSpotId > 0 }
  );

  const content = spot?.content ?? null;
  const notes = content?.notes ?? [];
  const colorCounts = content?.colorClassCounts
    ? Object.entries(content.colorClassCounts).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.09),transparent_28rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f1f5f9_100%)] pb-24">
      <header className="px-4 py-5">
        <div className="mx-auto max-w-4xl rounded-[1.75rem] bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_18rem),linear-gradient(135deg,#18181b_0%,#09090b_100%)] p-5 text-white shadow-2xl shadow-slate-950/20">
          <Link href="/study/icm">
            <Button variant="ghost" size="sm" className="-ml-2 mb-2 h-8 gap-1 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              ICM Packs
            </Button>
          </Link>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ) : spot ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="rounded-full bg-orange-500 text-white">
                  {spot.playerCount}-handed
                </Badge>
                <Badge variant="outline" className="rounded-full border-white/15 bg-white/5 text-zinc-200">
                  {ICM_CATEGORY_LABELS[spot.primaryCategory]}
                </Badge>
                {spot.actionHint && (
                  <Badge variant="secondary" className="rounded-full">
                    {spot.actionHint}
                  </Badge>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">{spot.title}</h1>
                <p className="mt-1 text-sm text-zinc-400">
                  {spot.stackSummaryText || "Scenario overview"}
                </p>
              </div>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">ICM Spot</h1>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4">
        {error && (
          <Card className="rounded-[1.5rem] border-dashed bg-white/90 shadow-sm shadow-slate-950/5">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {error.message}
            </CardContent>
          </Card>
        )}

        {!isLoading && validSpotId <= 0 && (
          <Card className="rounded-[1.5rem] border-dashed bg-white/90 shadow-sm shadow-slate-950/5">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Invalid ICM spot id.
            </CardContent>
          </Card>
        )}

        {spot && (
          <>
            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Layers3 className="h-4 w-4 text-orange-500" />
                  Structured Metadata
                </CardTitle>
                <CardDescription>
                  Filename-derived metadata for this advanced ICM scenario.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Players</p>
                    <p className="font-semibold">{spot.playerCount}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Hero</p>
                    <p className="font-semibold">{spot.heroPosition ?? "N/A"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Villain</p>
                    <p className="font-semibold">{spot.villainPosition ?? "N/A"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs text-muted-foreground">Category</p>
                    <p className="font-semibold">
                      {ICM_CATEGORY_LABELS[spot.primaryCategory]}
                    </p>
                  </div>
                </div>

                {spot.stackSummary.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Stacks
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {spot.stackSummary.map(stack => (
                        <div
                          key={`${stack.rawToken}-${stack.position ?? "unknown"}`}
                          className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <p className="text-xs text-muted-foreground">
                            {stack.position ?? "Unknown"}
                          </p>
                          <p className="text-lg font-bold">{stack.stackBb}bb</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {spot.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="rounded-full">
                        {ICM_TAG_LABELS[tag]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4 text-orange-500" />
                  Study Notes
                </CardTitle>
                <CardDescription>
                  Short heuristics for reviewing the spot before deeper parsing exists.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notes.length > 0 ? (
                  <ul className="space-y-2">
                    {notes.map(note => (
                      <li key={note} className="rounded-2xl border border-orange-200 bg-orange-50/70 p-3 text-sm leading-relaxed">
                        {note}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No notes have been added for this spot yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCode2 className="h-4 w-4 text-orange-500" />
                  Source File
                </CardTitle>
                <CardDescription>
                  Metadata-only now, with a limited HTML extraction preview where available.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p className="font-mono font-semibold">{spot.fileName}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    {spot.sourcePath}
                  </p>
                </div>

                {content && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-semibold">{content.status.replace("_", " ")}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-xs text-muted-foreground">Hands</p>
                      <p className="font-semibold">{content.tableHandCount ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-xs text-muted-foreground">Weighted</p>
                      <p className="font-semibold">{content.weightedComboCount ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-xs text-muted-foreground">Linked Spots</p>
                      <p className="font-semibold">{content.linkedSpotCount ?? 0}</p>
                    </div>
                  </div>
                )}

                {content?.groupTitle && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-xs text-muted-foreground">HTML title preview</p>
                    <p className="mt-1 text-sm font-medium">{content.groupTitle}</p>
                  </div>
                )}

                {colorCounts.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Detected color classes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {colorCounts.slice(0, 10).map(([colorClass, count]) => (
                        <Badge key={colorClass} variant="secondary" className="rounded-full">
                          {colorClass}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-dashed bg-white p-4 text-sm text-muted-foreground">
                  Full chart and decision rendering is intentionally not wired until
                  the HTML action semantics are mapped reliably.
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
