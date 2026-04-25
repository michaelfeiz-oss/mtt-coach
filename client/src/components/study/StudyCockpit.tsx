import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  AlertCircle,
  BookOpen,
  Brain,
  ChevronRight,
  ClipboardList,
  FileText,
  History,
  Plus,
  Target,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  loadRecentStrategySpots,
  type RecentStrategySpot,
} from "@/lib/strategyRecentSpots";
import { StudyModuleCard } from "./StudyModuleCard";
import {
  buildPriorityPackSummary,
  resolveAllPriorityDrillPacks,
} from "@shared/drillPacks";
import { findLeakFamilyByLabel } from "@shared/leakFamilies";
import {
  ACTION_LABELS,
  SPOT_GROUP_LABELS,
  type Action,
} from "@shared/strategy";

function formatSpotMeta(spot: RecentStrategySpot) {
  const positions = spot.villainPosition
    ? `${spot.heroPosition} vs ${spot.villainPosition}`
    : spot.heroPosition;

  return `${spot.stackDepth}bb - ${positions}`;
}

function formatHandMeta(hand: {
  heroPosition?: string | null;
  effectiveStackBb?: number | null;
  spotType?: string | null;
}) {
  const parts = [
    hand.heroPosition,
    hand.effectiveStackBb ? `${Math.round(hand.effectiveStackBb)}bb` : null,
    hand.spotType ? hand.spotType.replace(/_/g, " ") : null,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(" - ") : "Captured for review";
}

function SectionHeader({
  label,
  title,
  helper,
  action,
}: {
  label?: string;
  title: string;
  helper?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        {label && (
          <p className="mb-1 text-[11px] font-semibold text-muted-foreground">
            {label}
          </p>
        )}
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {helper && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {helper}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function EmptyState({
  title,
  helper,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  helper: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="rounded-[1rem] border border-dashed border-border/75 bg-accent/45 p-5 text-center shadow-sm shadow-black/20">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{helper}</p>
      <Link href={ctaHref}>
        <Button
          size="sm"
          variant="outline"
          className="mt-4 h-9 rounded-full px-4 text-xs font-semibold"
        >
          {ctaLabel}
        </Button>
      </Link>
    </div>
  );
}

export function StudyCockpit() {
  const { isAuthenticated } = useAuth();
  const [recentSpots, setRecentSpots] = useState<RecentStrategySpot[]>([]);

  const { data: spots = [], isLoading: spotsLoading } =
    trpc.strategy.listSpots.useQuery({});
  const { data: hands = [], isLoading: handsLoading } =
    trpc.hands.getByUser.useQuery({ limit: 5 });
  const { data: topLeaks = [] } = trpc.leaks.getTop.useQuery({ limit: 4 });
  const { data: stats } = trpc.strategy.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: progress } = trpc.strategy.getProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: recentAttempts = [] } =
    trpc.strategy.getRecentAttempts.useQuery(
      { limit: 4 },
      { enabled: isAuthenticated }
    );

  useEffect(() => {
    setRecentSpots(loadRecentStrategySpots());
  }, []);

  const recentSpot = recentSpots[0];
  const continueHref = recentSpot
    ? `/strategy/trainer?chartId=${recentSpot.id}`
    : "/strategy/trainer";
  const continueTitle = recentSpot
    ? "Resume Last Study Spot"
    : "Continue Training";
  const continueHelper = recentSpot
    ? `${recentSpot.title} - ${formatSpotMeta(recentSpot)}`
    : "Jump into Range Trainer and build reps from the current range pool.";
  const chartCount = spots.length;
  const pendingHands = useMemo(
    () => hands.filter(hand => !hand.reviewed).length,
    [hands]
  );
  const weakSpots = progress?.weakSpots ?? [];
  const missedHands = progress?.missedHands ?? [];
  const priorityPacks = useMemo(
    () =>
      resolveAllPriorityDrillPacks(spots)
        .filter(pack => pack.supported || pack.id === "30bb-broadways-vs-limper")
        .slice(0, 4),
    [spots]
  );
  const leakBoard = useMemo(
    () =>
      topLeaks.map(leak => ({
        leak,
        family: findLeakFamilyByLabel(leak.name),
      })),
    [topLeaks]
  );
  const suggestedNextSpotTitle = weakSpots[0]?.chartTitle ?? recentSpot?.title;
  const suggestedNextSpotMeta = weakSpots[0]
    ? `${weakSpots[0].accuracy}% accuracy over ${weakSpots[0].attempts} attempts`
    : recentSpot
      ? formatSpotMeta(recentSpot)
      : null;
  const suggestedNextSpotHref = weakSpots[0]
    ? `/strategy/trainer?chartId=${weakSpots[0].chartId}`
    : recentSpot
      ? `/strategy/trainer?chartId=${recentSpot.id}`
      : null;

  return (
    <main className="app-shell min-h-screen pb-24 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-6">
        <section className="app-surface-elevated overflow-hidden p-5 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="app-eyebrow mb-2">
                Training Cockpit
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Study
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Train preflop ranges, review leaks, and capture tournament
                hands while the decision is still fresh.
              </p>
            </div>

            <div className="grid gap-2 sm:min-w-[20rem]">
              <Link href={continueHref}>
                <Button className="h-12 w-full justify-between rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-black/25 hover:bg-[#FF8A1F]">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    {continueTitle}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/log">
                <Button
                  variant="outline"
                  className="h-11 w-full justify-between rounded-2xl border-border/80 bg-accent/55 px-4 text-sm font-semibold text-secondary-foreground hover:bg-accent"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Log a Hand
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-accent/70 p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Next action
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {continueHelper}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StudyModuleCard
            href="/strategy/library"
            icon={BookOpen}
            title="Hand Ranges"
            subtitle="Browse BBA tournament charts at 15bb, 25bb, and 40bb."
            meta={
              spotsLoading ? "Loading charts" : `${chartCount} charts available`
            }
            tone="zinc"
          />
          <StudyModuleCard
            href="/strategy/trainer"
            icon={Zap}
            title="Range Trainer"
            subtitle="Fast preflop drills with visual chart reveal."
            meta={
              stats
                ? `${stats.accuracy}% saved accuracy`
                : "Practice without setup"
            }
            tone="orange"
          />
          <StudyModuleCard
            href="/log"
            icon={FileText}
            title="Notes"
            subtitle="Capture spot takeaways and hand lessons."
            meta="Attached to review"
            tone="blue"
          />
          <StudyModuleCard
            href="/hands"
            icon={Brain}
            title="Hand Review"
            subtitle="Revisit preflop mistakes and turn them into drills."
            meta={
              pendingHands > 0
                ? `${pendingHands} hands to review`
                : "Review logged hands"
            }
            tone="green"
          />
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="space-y-4">
            <SectionHeader
              label="Continue"
              title="Recent Study"
              helper="Pick up from actual study and hand-review activity."
              action={
                <Link href="/hands">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full text-xs font-semibold text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  >
                    View all
                  </Button>
                </Link>
              }
            />

            <Card className="app-surface">
              <CardContent className="space-y-4 p-4 sm:p-5">
                {recentSpots.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                      <History className="h-3.5 w-3.5" />
                      Recently Viewed Ranges
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {recentSpots.slice(0, 4).map(spot => (
                        <Link
                          key={spot.id}
                          href={`/strategy/library?chartId=${spot.id}`}
                        >
                          <div className="rounded-xl border border-border bg-accent/65 p-3 transition hover:-translate-y-0.5 hover:bg-accent/90">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {spot.title}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <Badge className="rounded-full bg-primary text-primary-foreground">
                                {spot.stackDepth}bb
                              </Badge>
                              <Badge
                                variant="outline"
                                className="rounded-full border-border/80 bg-accent/55 text-[11px] text-secondary-foreground"
                              >
                                {SPOT_GROUP_LABELS[spot.spotGroup]}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    title="No recent ranges yet"
                    helper="Open a chart once and it will appear here for quick return."
                    ctaHref="/strategy/library"
                    ctaLabel="Browse ranges"
                  />
                )}

                <div className="h-px bg-border/80" />

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5" />
                    Recently Logged Hands
                  </div>

                  {handsLoading && (
                    <div className="space-y-2">
                      {[1, 2, 3].map(index => (
                        <Skeleton
                          key={index}
                          className="h-14 w-full rounded-2xl"
                        />
                      ))}
                    </div>
                  )}

                  {!handsLoading && hands.length === 0 && (
                    <EmptyState
                      title="No logged hands yet"
                      helper="Use quick hand capture after a session, then review it here."
                      ctaHref="/log"
                      ctaLabel="Log first hand"
                    />
                  )}

                  {!handsLoading &&
                    hands.slice(0, 3).map(hand => (
                      <Link key={hand.id} href={`/hands/${hand.id}`}>
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-accent/65 p-3 transition hover:-translate-y-0.5 hover:bg-accent/90">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {hand.heroHand || "Hand captured"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {formatHandMeta(hand)}
                            </p>
                          </div>
                          <Badge
                            variant={hand.reviewed ? "secondary" : "outline"}
                            className="shrink-0 rounded-full"
                          >
                            {hand.reviewed ? "Reviewed" : "To review"}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <SectionHeader
              label="Weak Spots"
              title="What Needs Reps"
              helper="Saved trainer history and leak data drive this area."
            />

            <Card className="app-surface">
              <CardContent className="space-y-4 p-4 sm:p-5">
                {suggestedNextSpotTitle &&
                  suggestedNextSpotMeta &&
                  suggestedNextSpotHref && (
                  <div className="rounded-xl border border-border bg-accent/65 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-muted-foreground">
                          Suggested Next Spot
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-foreground">
                          {suggestedNextSpotTitle}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {suggestedNextSpotMeta}
                        </p>
                      </div>
                      <Link href={suggestedNextSpotHref}>
                        <Button
                          size="sm"
                          className="h-8 shrink-0 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-[#FF8A1F]"
                        >
                          Train
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {isAuthenticated && weakSpots.length > 0 && (
                  <div className="space-y-2">
                    {weakSpots.slice(0, 4).map(spot => (
                      <div
                        key={spot.chartId}
                        className="rounded-xl border border-border bg-accent/65 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {spot.chartTitle}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {spot.accuracy}% over {spot.attempts} attempts
                            </p>
                          </div>
                          <Link href={`/strategy/trainer?chartId=${spot.chartId}`}>
                            <Button
                              size="sm"
                              className="h-8 shrink-0 rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-[#FF8A1F]"
                            >
                              Train
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(!isAuthenticated || weakSpots.length === 0) &&
                  topLeaks.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Active Leaks
                      </div>
                      {leakBoard.map(({ leak, family }) => (
                        <Link key={leak.id} href={`/leaks/${leak.id}`}>
                          <div className="rounded-xl border border-border bg-accent/65 p-3 transition hover:bg-accent/90">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">
                                  {family?.label ?? leak.name}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {family?.description ?? leak.category} ·{" "}
                                  {leak.handCount} linked hands
                                </p>
                                {family?.relatedPackIds?.[0] && (
                                  <Badge
                                    variant="outline"
                                    className="mt-2 rounded-full"
                                  >
                                    Drill: {family.relatedPackIds[0].replace(/-/g, " ")}
                                  </Badge>
                                )}
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                {isAuthenticated && missedHands.length > 0 && (
                  <>
                    <div className="h-px bg-border/80" />
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-muted-foreground">
                        Most Missed Hands
                      </div>
                      {missedHands.slice(0, 3).map(hand => (
                        <div
                          key={`${hand.chartId}-${hand.handCode}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-accent/65 p-3"
                        >
                          <div>
                            <p className="font-mono text-base font-semibold text-foreground">
                              {hand.handCode}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Correct: {ACTION_LABELS[hand.correctAction]}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="rounded-full border-red-400/35 bg-red-500/12 text-red-300"
                          >
                            Missed {hand.missed}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {(!isAuthenticated || weakSpots.length === 0) &&
                  topLeaks.length === 0 && (
                    <EmptyState
                      title="No weak spots yet"
                      helper="Train ranges or log mistakes and this will become your next-study queue."
                      ctaHref="/strategy/trainer"
                      ctaLabel="Start trainer"
                    />
                  )}

                {!isAuthenticated && (
                  <p className="rounded-xl border border-border bg-accent/70 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    Range practice works while logged out. Saved weak spots
                    appear here for authenticated users.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            label="Priority"
            title="Priority Drill Packs"
            helper="Curated packs target boundary hands, blind defense, and the pressure spots that leak most often."
            action={
              <Link href="/strategy/trainer">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full text-xs font-semibold text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                >
                  Open trainer
                </Button>
              </Link>
            }
          />

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <Card className="app-surface">
              <CardContent className="space-y-3 p-4 sm:p-5">
                {priorityPacks.map(pack => (
                  <div
                    key={pack.id}
                    className="rounded-xl border border-border bg-accent/65 p-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {pack.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {pack.purpose}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="rounded-full">
                            {buildPriorityPackSummary(pack)}
                          </Badge>
                          {pack.focusTags.map(tag => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="rounded-full"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Link href={`/strategy/trainer?packId=${pack.id}`}>
                        <Button
                          className="h-9 rounded-full px-4 text-xs font-semibold"
                          disabled={!pack.supported}
                        >
                          {pack.supported ? "Start Drill" : "Needs Coverage"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="app-surface">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Push / Fold Mode
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    Short-stack reference and drill
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Dedicated up to 10bb mode for open shoves and BB call-offs, sourced from your short-stack notes.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[5, 6, 7, 8, 9, 10].map(stack => (
                    <Badge key={stack} variant="outline" className="rounded-full">
                      {stack}bb
                    </Badge>
                  ))}
                </div>

                <Link href="/strategy/push-fold">
                  <Button className="h-10 w-full rounded-xl text-sm font-semibold">
                    Open Push/Fold Mode
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader
            label="Tools"
            title="Study Utilities"
            helper="Secondary workflows stay close, without competing with preflop training."
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                href: "/strategy/library",
                icon: BookOpen,
                title: "Spot Notes",
                helper: "Review notes attached to preflop charts.",
              },
              {
                href: "/strategy/trainer",
                icon: Target,
                title: "Focused Reps",
                helper: "Drill the current setup or spin a random spot.",
              },
              {
                href: "/hands",
                icon: FileText,
                title: "Hand Review",
                helper: "Review saved preflop hand logs.",
              },
              {
                href: "/log",
                icon: Plus,
                title: "Quick Capture",
                helper: "Log a hand, leak, note, or takeaway.",
              },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="group rounded-[1rem] border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-accent/55">
                  <item.icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.helper}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {isAuthenticated && recentAttempts.length > 0 && (
          <section className="space-y-4">
            <SectionHeader
              label="Trainer"
              title="Recent Answers"
              helper="Your last saved trainer decisions."
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {recentAttempts.map(attempt => (
                <div
                  key={attempt.id}
                  className="rounded-[1rem] border border-border bg-card p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-base font-semibold text-foreground">
                      {attempt.handCode}
                    </p>
                    <Badge
                      className={
                        attempt.isCorrect
                          ? "rounded-full bg-emerald-500 text-white"
                          : "rounded-full bg-red-500 text-white"
                      }
                    >
                      {attempt.isCorrect ? "Hit" : "Miss"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Correct:{" "}
                    {ACTION_LABELS[attempt.correctAction as Action] ??
                      attempt.correctAction}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
