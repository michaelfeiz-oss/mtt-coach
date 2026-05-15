import { useEffect, useState } from "react";
import { getAudit } from "@/local-study/api";
import { LocalShell, PageHeader } from "@/local-study/LocalShell";

export default function AuditV2() {
  const [audit, setAudit] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAudit()
      .then(result => setAudit(result.audit))
      .catch(error => setError(error instanceof Error ? error.message : String(error)));
  }, []);

  return (
    <LocalShell>
      <PageHeader
        eyebrow="Data Audit"
        title="Local Strategy Status"
        body="Quick status view for the local SQLite strategy database."
      />
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}
      {audit ? (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            {Object.entries(audit.counts).map(([key, value]) => (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase text-slate-500">{key}</p>
                <p className="mt-2 text-2xl font-black">{String(value)}</p>
              </div>
            ))}
          </section>
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-bold">Database</p>
            <p className="mt-1 break-all text-sm text-slate-600">{audit.dbPath}</p>
          </section>
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-bold">Not final-approved</p>
            <div className="mt-3 space-y-2">
              {audit.notReviewed.slice(0, 40).map((chart: any) => (
                <div key={chart.nodeKey} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <strong>{chart.title}</strong>
                  <span className="ml-2 text-slate-500">{chart.status}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </LocalShell>
  );
}
