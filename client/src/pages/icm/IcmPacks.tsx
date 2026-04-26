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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.09),transparent_28rem),linear-gradient(180deg,#f8fafc_0%,#ffffff_42%,#f1f5f9_100%)] pb-24">
      <header className="px-4 py-5">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-[1.75rem] bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.18),transparent_18rem),linear-gradient(135deg,#18181b_0%,#09090b_100%)] p-5 text-white shadow-2xl shadow-slate-950/20">
          <div className="min-w-0">
            <Link href="/study">
              <Button variant="ghost" size="sm" className="-ml-2 mb-2 h-8 gap-1 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Study
              </Button>
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/20">
                <Trophy className="h-5 w-5" />
              </span>
              ICM Packs
            </h1>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map(index => (
              <Skeleton key={index} className="h-36 w-full rounded-xl" />
            ))}
          </div>
        )}

        {error && (
          <Card className="rounded-[1.5rem] border-dashed bg-white/90 shadow-sm shadow-slate-950/5">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {error.message}
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && packs.length === 0 && (
          <Card className="rounded-[1.5rem] border-dashed bg-white/90 shadow-sm shadow-slate-950/5">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No ICM packs available yet.
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {packs.map(pack => (
            <Link key={pack.slug} href={`/study/icm/${pack.slug}`}>
              <Card className="cursor-pointer rounded-[1.5rem] border-slate-200/80 bg-white/95 shadow-sm shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-xl hover:shadow-slate-950/10">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full bg-zinc-950 text-white">
                          {pack.difficulty}
                        </Badge>
                        <Badge variant="secondary" className="rounded-full">
                          {pack.spotCount} spots
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{pack.title}</CardTitle>

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
