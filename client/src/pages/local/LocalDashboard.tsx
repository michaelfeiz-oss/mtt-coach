import { Link } from "wouter";
import { useEffect, useState } from "react";
import { getAudit, importTypedSeeds } from "@/local-study/api";
import { LocalShell, PageHeader } from "@/local-study/LocalShell";

export default function LocalDashboard() {
  const [audit, setAudit] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getAudit().then(result => setAudit(result.audit)).catch(() => setAudit(null));
  }, []);

  async function handleImportSeeds() {
    const result = await importTypedSeeds();
    setMessage(`Imported ${result.imported} seed charts. Skipped ${result.skipped} protected charts.`);
    const refreshed = await getAudit();
    setAudit(refreshed.audit);
  }

  const counts = audit?.counts;

  return (
    <LocalShell>
      <PageHeader
        eyebrow="Local MTT Study"
        title="Strategy Workspace"
        body="Local-only chart study, editing, approval, drills, and backup. Strategy truth is full 169-cell snapshots."
      />

      <section className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Charts", counts?.charts ?? "-"],
          ["Approved", counts?.approved ?? "-"],
          ["Reviewed", counts?.reviewed ?? "-"],
          ["Drafts", counts?.drafts ?? "-"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-4 grid min-w-0 items-stretch gap-3 sm:grid-cols-2">
        <Link href="/strategy/library" className="block h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300">
          <p className="text-lg font-bold">Strategy Library</p>
          <p className="mt-1 text-sm text-slate-600">Browse and open full 13x13 charts.</p>
        </Link>
        <Link href="/strategy/trainer" className="block h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300">
          <p className="text-lg font-bold">Basic Drills</p>
          <p className="mt-1 text-sm text-slate-600">Practice random hands from resolved charts.</p>
        </Link>
        <Link href="/study/notes" className="block h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300">
          <p className="text-lg font-bold">Study Notes</p>
          <p className="mt-1 text-sm text-slate-600">Capture chart review notes, heuristics, and drill reflections.</p>
        </Link>
        <Link href="/admin/import-export" className="block h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300">
          <p className="text-lg font-bold">Import / Backup</p>
          <p className="mt-1 text-sm text-slate-600">Export approved packs and full local backups.</p>
        </Link>
        <button
          type="button"
          onClick={handleImportSeeds}
          className="h-full rounded-2xl border border-orange-200 bg-orange-50 p-5 text-left shadow-sm hover:border-orange-400"
        >
          <p className="text-lg font-bold text-orange-800">Import Typed Seeds</p>
          <p className="mt-1 text-sm text-orange-900">Loads reviewed typed seed charts without touching approved charts.</p>
        </button>
      </section>

      {message ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
    </LocalShell>
  );
}
