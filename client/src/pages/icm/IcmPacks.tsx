import { Link } from "wouter";
import { ArrowLeft, ChevronRight, Trophy } from "lucide-react";
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
import { trpc } from "@/lib/trpc";

export default function IcmPacks() {
  const { data: packs = [], isLoading, error } = trpc.icm.listPacks.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <header className="border-b bg-white/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href="/study">
              <Button variant="ghost" size="sm" className="-ml-2 mb-2 h-8 gap-1 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Study
              </Button>
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
                <Trophy className="h-5 w-5" />
              </span>
              ICM Packs
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Advanced payout-pressure study, separate from everyday preflop ranges.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(index => (
              <Skeleton key={index} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        )}

        {error && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {error.message}
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && packs.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No ICM packs available yet.
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {packs.map(pack => (
            <Link key={pack.slug} href={`/study/icm/${pack.slug}`}>
              <Card className="cursor-pointer border-border bg-white shadow-sm transition hover:border-orange-300 hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className="bg-zinc-900 text-white">
                          {pack.difficulty}
                        </Badge>
                        <Badge variant="secondary">{pack.spotCount} spots</Badge>
                      </div>
                      <CardTitle className="text-lg">{pack.title}</CardTitle>
                      <CardDescription className="mt-1 leading-relaxed">
                        {pack.description}
                      </CardDescription>
                    </div>
                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
