import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Filter, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ICM_CATEGORY_LABELS,
  ICM_TAG_LABELS,
  type IcmCategory,
  type IcmTag,
} from "../../../../shared/icm";

export default function IcmPackDetail() {
  const { packSlug } = useParams<{ packSlug: string }>();
  const [playerCount, setPlayerCount] = useState<number | undefined>(undefined);
  const [tag, setTag] = useState<IcmTag | undefined>(undefined);
  const [primaryCategory, setPrimaryCategory] = useState<IcmCategory | undefined>(undefined);

  const input = useMemo(
    () => ({
      slug: packSlug ?? "",
      playerCount,
      tag,
      primaryCategory,
    }),
    [packSlug, playerCount, tag, primaryCategory]
  );

  const { data: pack, isLoading, error } = trpc.icm.getPack.useQuery(input, {
    enabled: Boolean(packSlug),
  });

  const hasFilters =
    playerCount !== undefined || tag !== undefined || primaryCategory !== undefined;

  function clearFilters() {
    setPlayerCount(undefined);
    setTag(undefined);
    setPrimaryCategory(undefined);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <header className="border-b bg-white/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Link href="/study/icm">
            <Button variant="ghost" size="sm" className="-ml-2 mb-2 h-8 gap-1 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              ICM Packs
            </Button>
          </Link>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ) : pack ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-zinc-900 text-white">{pack.difficulty}</Badge>
                <Badge variant="secondary">{pack.spotCount} curated spots</Badge>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{pack.title}</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {pack.description}
              </p>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">ICM Pack</h1>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        {error && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {error.message}
            </CardContent>
          </Card>
        )}

        {pack && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <SlidersHorizontal className="h-4 w-4 text-orange-500" />
                  Filters
                </CardTitle>
                <CardDescription>
                  Narrow the curated pack by table size, pressure type, or tag.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Players
                    </p>
                    {hasFilters && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearFilters}>
                        Clear
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <Button
                      size="sm"
                      variant={playerCount === undefined ? "default" : "outline"}
                      className="h-8 shrink-0"
                      onClick={() => setPlayerCount(undefined)}
                    >
                      All
                    </Button>
                    {pack.availableFilters.playerCounts.map(count => (
                      <Button
                        key={count}
                        size="sm"
                        variant={playerCount === count ? "default" : "outline"}
                        className="h-8 shrink-0"
                        onClick={() => setPlayerCount(count)}
                      >
                        {count}-handed
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pressure Type
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <Button
                      size="sm"
                      variant={primaryCategory === undefined ? "default" : "outline"}
                      className="h-8 shrink-0"
                      onClick={() => setPrimaryCategory(undefined)}
                    >
                      All
                    </Button>
                    {pack.availableFilters.categories.map(category => (
                      <Button
                        key={category}
                        size="sm"
                        variant={primaryCategory === category ? "default" : "outline"}
                        className="h-8 shrink-0"
                        onClick={() => setPrimaryCategory(category)}
                      >
                        {ICM_CATEGORY_LABELS[category]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tags
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <Button
                      size="sm"
                      variant={tag === undefined ? "default" : "outline"}
                      className="h-8 shrink-0"
                      onClick={() => setTag(undefined)}
                    >
                      All
                    </Button>
                    {pack.availableFilters.tags.map(candidate => (
                      <Button
                        key={candidate}
                        size="sm"
                        variant={tag === candidate ? "default" : "outline"}
                        className="h-8 shrink-0"
                        onClick={() => setTag(candidate)}
                      >
                        {ICM_TAG_LABELS[candidate]}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Curated Spots
                </h2>
                <p className="text-xs text-muted-foreground">
                  {pack.spots.length} visible with current filters
                </p>
              </div>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>

            {pack.spots.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No spots match these filters.
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {pack.spots.map(spot => (
                <Link key={spot.id} href={`/study/icm/spot/${spot.id}`}>
                  <Card className="cursor-pointer bg-white transition hover:border-orange-300 hover:shadow-sm">
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-foreground">
                            {spot.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {spot.stackSummaryText || "Scenario overview"}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {spot.playerCount}H
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="secondary">
                          {ICM_CATEGORY_LABELS[spot.primaryCategory]}
                        </Badge>
                        {spot.actionHint && (
                          <Badge variant="outline">{spot.actionHint}</Badge>
                        )}
                        {spot.tags.slice(0, 4).map(spotTag => (
                          <Badge key={spotTag} variant="outline">
                            {ICM_TAG_LABELS[spotTag]}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
