import { useEffect, useState } from "react";
import { Link } from "wouter";
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
          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-amber-950">Population drafts requiring review</p>
                <p className="mt-1 text-sm text-amber-900">
                  These charts are constructed placeholders. Review before approval.
                </p>
              </div>
              <span className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-black text-amber-800">
                {audit.populationDrafts?.length ?? 0}
              </span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="text-xs uppercase text-amber-900">
                  <tr>
                    <th className="py-2 pr-3">nodeKey</th>
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Stack</th>
                    <th className="py-2 pr-3">Spot family</th>
                    <th className="py-2 pr-3">sourceType</th>
                    <th className="py-2 pr-3">Last imported</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(audit.populationDrafts ?? []).map((chart: any) => (
                    <tr key={chart.nodeKey} className="border-t border-amber-200">
                      <td className="py-2 pr-3 font-mono text-xs">{chart.nodeKey}</td>
                      <td className="py-2 pr-3 font-bold">{chart.title}</td>
                      <td className="py-2 pr-3">{chart.stackBb}bb</td>
                      <td className="py-2 pr-3">{chart.spotType}</td>
                      <td className="py-2 pr-3">{chart.sourceType}</td>
                      <td className="py-2 pr-3">{chart.lastImported}</td>
                      <td className="py-2 pr-3">
                        <div className="flex gap-2">
                          <Link className="rounded-lg border border-amber-300 bg-white px-2 py-1 font-bold text-amber-900" href={`/strategy/chart/${chart.nodeKey}`}>
                            Open Chart
                          </Link>
                          <Link className="rounded-lg bg-orange-600 px-2 py-1 font-bold text-white" href={`/strategy/editor/${chart.nodeKey}`}>
                            Edit Chart
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="font-bold">Not final-approved</p>
            <div className="mt-3 space-y-2">
              {audit.notReviewed.slice(0, 40).map((chart: any) => (
                <Link
                  key={chart.nodeKey}
                  href={`/strategy/chart/${chart.nodeKey}`}
                  className="block rounded-xl bg-slate-50 p-3 text-sm hover:bg-orange-50"
                >
                  <strong>{chart.title}</strong>
                  <span className="ml-2 text-slate-500">{chart.status}</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </LocalShell>
  );
}
