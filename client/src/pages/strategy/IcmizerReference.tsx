import { ExternalLink, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function IcmizerReference() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 space-y-6">
      <Link href="/strategy">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Study Hub
        </Button>
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Push / Fold &amp; ICM</h1>
        <p className="text-sm text-muted-foreground">
          Short-stack shove/call-off decisions and ICM calculations are handled in ICMIZER — a dedicated solver with exact Nash ranges.
        </p>
      </div>

      <Card className="app-surface">
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Why ICMIZER, not this app?</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Push/fold decisions at 5–15bb are solver-grade problems. Simplified internal charts introduce errors that compound over thousands of hands. ICMIZER gives you exact Nash equilibrium ranges, ICM-adjusted call-offs, FGS calculations, and final-table bubble analysis — none of which can be replicated accurately with a static lookup table.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Use ICMIZER for</p>
            <ul className="space-y-1 text-sm text-foreground">
              {[
                "Open shove ranges (5–15bb)",
                "BB call-off vs shove from any position",
                "Re-jam / squeeze shove spots",
                "Nash equilibrium push/fold charts",
                "ICM-adjusted ranges on the bubble",
                "Final table short-stack decisions",
                "FGS (Future Game Simulation) spots",
              ].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <a
            href="https://www.icmpoker.com/icmizer/"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full gap-2">
              Open ICMIZER
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>

      <Card className="app-surface border-dashed">
        <CardContent className="p-5 space-y-2">
          <p className="text-sm font-semibold text-foreground">Logging a shove or call-off hand?</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You can still log push/fold hands here for review. Tag the hand with <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">ICMIZER_REVIEW</span> and use the Hand Detail page to note what ICMIZER showed for that exact spot.
          </p>
          <Link href="/hands/new">
            <Button variant="outline" size="sm" className="mt-1">
              Log a hand
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
