import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  Brain,
  ChevronRight,
  ClipboardList,
  ExternalLink,
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
    <div className="rounded-[1rem] border border-dashed border-border bg-secondary p-5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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

  const { data: studySpots = [], isLoading: spotsLoading } =
    trpc.strategy.listSpots.useQuery({});
  const { data: trainerSpots = [] } = trpc.strategy.listTrainerSpots.useQuery({});
  const { data: hands = [], isLoading: handsLoading } =
    trpc.hands.getByUser.useQuery({ limit: 5, reviewStatus: "all" });
  const { data: reviewQueueSummary } = trpc.hands.getReviewQueueSummary.useQuery();
  const { data: todayTraining = [] } = trpc.suggestions.getTodayTraining.useQuery();
  const { data: weakSpots = [] } = trpc.weakSpots.getTop.useQuery({ limit: 5 });
  const { data: stats } = trpc.strategy.getStats.useQuery(undefined, {
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

  const trainerSafeSpotIds = useMemo(
    () => new Set(trainerSpots.map(spot => spot.id)),
    [trainerSpots]
  );
  const recentSpot = recentSpots[0];
  const recentSpotIsTrainerSafe =
    recentSpot !== undefined && trainerSafeSpotIds.has(recentSpot.id);
  const continueHref = recentSpot
    ? recentSpotIsTrainerSafe
      ? `/strategy/trainer?chartId=${recentSpot.id}`
      : `/strategy/library?chartId=${recentSpot.id}`
    : "/strategy/trainer";
  const continueTitle = recentSpot
    ? recentSpotIsTrainerSafe
      ? "Resume Last Drill Spot"
      : "Resume Last Study Spot"
    : "Continue Training";
  const continueHelper = recentSpot
    ? recentSpotIsTrainerSafe
      ? `${recentSpot.title} - ${formatSpotMeta(recentSpot)}`
      : `${recentSpot.title} - study-only reference`
    : "Jump into source-backed Range Trainer reps or open a chart for study.";
  const chartCount = studySpots.length;
  const pendingHands = useMemo(
    () => reviewQueueSummary?.totalNeedsReview ?? hands.filter(hand => !hand.reviewed).length,
    [hands, reviewQueueSummary]
  );
  const priorityPacks = useMemo(
    () =>
      resolveAllPriorityDrillPacks(studySpots).slice(0, 4),
    [studySpots]
  );
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
                <Button className="h-12 w-full justify-between rounded-2xl px-4 text-sm font-semibold">
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
                  className="h-11 w-full justify-between rounded-2xl border-[var(--border-strong)] bg-card px-4 text-sm font-semibold text-secondary-foreground hover:bg-secondary"
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

          <div className="mt-5 rounded-xl border border-border bg-secondary p-4">
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
                          <div className="rounded-xl border border-border bg-secondary p-3 transition hover:-translate-y-0.5 hover:bg-slate-100">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {spot.title}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <Badge className="rounded-full bg-primary text-primary-foreground">
                                {spot.stackDepth}bb
                              </Badge>
                              <Badge
                                variant="outline"
                                className="rounded-full border-[var(--border-strong)] bg-card text-[11px] text-secondary-foreground"
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
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary p-3 transition hover:-translate-y-0.5 hover:bg-slate-100">
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
              title="Suggested Drills + Review Queue"
              helper="Today's reps and review actions built from trainer misses, weak spots, and logged hands."
            />

            <Card className="app-surface">
              <CardContent className="space-y-4 p-4 sm:p-5">
                {todayTraining.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      Suggested Drills
                    </div>
                    {todayTraining.map(suggestion => (
                      <div
                        key={suggestion.id}
                        className="rounded-xl border border-border bg-secondary p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {suggestion.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {suggestion.reason}
                            </p>
                          </div>
                          <Link href={suggestion.targetRoute}>
                            <Button
                              size="sm"
                              className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold"
                            >
                              {suggestion.type === "review_hands"
                                ? "Review"
                                : suggestion.type === "study_chart"
                                  ? "View"
                                  : "Start"}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {weakSpots.length > 0 && (
                  <>
                    <div className="h-px bg-border/80" />
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-muted-foreground">
                        Weak Spots
                      </div>
                      {weakSpots.slice(0, 4).map(spot => (
                        <div
                          key={spot.id}
                          className="rounded-xl border border-border bg-secondary p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {spot.label}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {spot.misses} miss{spot.misses === 1 ? "" : "es"} -{" "}
                                {spot.accuracy}% accuracy
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {spot.suggestedChartId !== null && (
                                <Link href={`/strategy/library?chartId=${spot.suggestedChartId}`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 rounded-full px-3 text-xs font-semibold"
                                  >
                                    View
                                  </Button>
                                </Link>
                              )}
                              {spot.suggestedDrillPackId ? (
                                <Link href={`/strategy/trainer?packId=${spot.suggestedDrillPackId}`}>
                                  <Button
                                    size="sm"
                                    className="h-8 rounded-full px-3 text-xs font-semibold"
                                  >
                                    Drill
                                  </Button>
                                </Link>
                              ) : spot.suggestedChartId !== null ? (
                                <Link href={`/strategy/trainer?chartId=${spot.suggestedChartId}`}>
                                  <Button
                                    size="sm"
                                    className="h-8 rounded-full px-3 text-xs font-semibold"
                                  >
                                    Drill
                                  </Button>
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {reviewQueueSummary && (
                  <>
                    <div className="h-px bg-border/80" />
                    <div className="rounded-xl border border-border bg-secondary p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-muted-foreground">
                            Review Queue
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {reviewQueueSummary.totalNeedsReview} hand
                            {reviewQueueSummary.totalNeedsReview === 1 ? "" : "s"} need review
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {reviewQueueSummary.topLeakLabel
                              ? `Most common tag: ${reviewQueueSummary.topLeakLabel}`
                              : "Use review to turn logged mistakes into next drills."}
                          </p>
                        </div>
                        <Link
                          href={
                            reviewQueueSummary.topLeakFamilyId
                              ? `/hands?reviewStatus=needs_review&leakFamily=${reviewQueueSummary.topLeakFamilyId}`
                              : "/hands?reviewStatus=needs_review"
                          }
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 rounded-full px-3 text-xs font-semibold"
                          >
                            Open
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </>
                )}

                {todayTraining.length === 0 &&
                  weakSpots.length === 0 &&
                  (!reviewQueueSummary || reviewQueueSummary.totalNeedsReview === 0) && (
                      <EmptyState
                        title="No weak spots yet"
                        helper="Train ranges or log mistakes and this will become your next-study queue."
                        ctaHref="/strategy/trainer"
                        ctaLabel="Start trainer"
                      />
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
                    className="rounded-xl border border-border bg-secondary p-3"
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
                          {!pack.trainerAvailable && (
                            <Badge className="rounded-full border-amber-200 bg-[#FFF7E6] text-[#9A4D12]">
                              Study-only
                            </Badge>
                          )}
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
                      {pack.supported ? (
                        <Link href={`/strategy/trainer?packId=${pack.id}`}>
                          <Button className="h-9 rounded-full px-4 text-xs font-semibold">
                            Start Drill
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          className="h-9 rounded-full px-4 text-xs font-semibold"
                          disabled
                        >
                          Study Only
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="app-surface border-dashed">
              <CardContent className="space-y-3 p-4 sm:p-5">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Push / Fold &amp; ICM
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    Use ICMIZER
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Short-stack shoves, call-offs, Nash ranges, and ICM bubble spots are solver-grade decisions. Use ICMIZER for exact results — not simplified internal charts.
                  </p>
                </div>
                <a
                  href="https://www.icmpoker.com/icmizer/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="h-10 w-full rounded-xl text-sm font-semibold gap-2">
                    Open ICMIZER
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
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
                <div className="group rounded-[1rem] border border-border bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:bg-secondary">
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
                          ? "rounded-full bg-emerald-600 text-white"
                          : "rounded-full bg-red-600 text-white"
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
