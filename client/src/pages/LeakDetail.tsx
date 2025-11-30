import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function LeakDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: leak, isLoading: leakLoading } = trpc.leaks.getById.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id }
  );

  const { data: linkedHands, isLoading: handsLoading } = trpc.leaks.getLinkedHands.useQuery(
    { leakId: parseInt(id!) },
    { enabled: !!id }
  );

  const updateLeak = trpc.leaks.update.useMutation({
    onSuccess: () => {
      toast.success("Leak marked as FIXED!");
      utils.leaks.getById.invalidate({ id: parseInt(id!) });
      utils.leaks.list.invalidate();
      utils.leaks.getTop.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to update leak: ${error.message}`);
    },
  });

  const handleMarkFixed = () => {
    updateLeak.mutate({
      id: parseInt(id!),
      status: "FIXED",
    });
  };

  const filteredHands = linkedHands?.filter((hand) => {
    if (severityFilter === "all") return true;
    return hand.mistakeSeverity.toString() === severityFilter;
  });

  if (leakLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="container py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <main className="container py-6">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!leak) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Leak Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    ACTIVE: "bg-red-100 text-red-700",
    IMPROVING: "bg-yellow-100 text-yellow-700",
    FIXED: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container py-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Leak Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{leak.name}</CardTitle>
                <CardDescription className="mt-2">
                  <Badge variant="outline" className="mr-2">
                    {leak.category}
                  </Badge>
                  <Badge className={statusColors[leak.status]}>{leak.status}</Badge>
                </CardDescription>
              </div>
              {leak.status !== "FIXED" && (
                <Button
                  onClick={handleMarkFixed}
                  disabled={updateLeak.isPending}
                  className="gap-2"
                  variant="outline"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as Fixed
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {leak.description && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Description</p>
                <p className="text-sm text-slate-600">{leak.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div>
                <p className="text-xs text-slate-500">Total Hands</p>
                <p className="text-2xl font-bold">{linkedHands?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Seen</p>
                <p className="text-sm font-medium">
                  {leak.lastSeenAt ? new Date(leak.lastSeenAt).toLocaleDateString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg Severity</p>
                <p className="text-2xl font-bold">
                  {linkedHands && linkedHands.length > 0
                    ? (
                        linkedHands.reduce((sum, h) => sum + h.mistakeSeverity, 0) /
                        linkedHands.length
                      ).toFixed(1)
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Linked Hands */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Linked Hands</CardTitle>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="1">Minor (1)</SelectItem>
                  <SelectItem value="2">Moderate (2)</SelectItem>
                  <SelectItem value="3">Major (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {handsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !filteredHands || filteredHands.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                {severityFilter === "all" ? "No hands linked to this leak yet" : "No hands match this filter"}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredHands.map((hand) => (
                  <button
                    key={hand.id}
                    onClick={() => setLocation(`/hands/${hand.id}`)}
                    className="w-full text-left p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Hero Hand & Position */}
                        <div className="flex items-center gap-2 mb-1">
                          {hand.heroHand && (
                            <span className="font-mono font-bold text-lg">{hand.heroHand}</span>
                          )}
                          {hand.heroPosition && (
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {hand.heroPosition}
                            </span>
                          )}
                        </div>

                        {/* Board */}
                        {hand.boardRunout && (
                          <p className="text-sm text-slate-600 font-mono mb-2">{hand.boardRunout}</p>
                        )}

                        {/* Mistake Info */}
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {hand.mistakeStreet && (
                            <span className="font-medium text-red-600">
                              {hand.mistakeStreet} mistake
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded ${
                              hand.mistakeSeverity === 3
                                ? "bg-red-100 text-red-700"
                                : hand.mistakeSeverity === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            Severity: {hand.mistakeSeverity}
                          </span>
                          <span>{new Date(hand.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
