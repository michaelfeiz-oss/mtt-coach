import { useState } from "react";
import {
  exportApprovedPack,
  exportFullBackup,
  importApprovedPack,
  importTypedSeeds,
  restoreFullBackup,
} from "@/local-study/api";
import { LocalShell, PageHeader } from "@/local-study/LocalShell";

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ImportExportV2() {
  const [text, setText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      setMessage(success);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      setMessage(null);
    }
  }

  return (
    <LocalShell>
      <PageHeader
        eyebrow="Admin"
        title="Import, Export, Backup"
        body="Approved packs use nodeKey identity. Full backups include snapshots, drafts, and audit logs."
      />

      {message ? <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">{message}</div> : null}
      {error ? <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => run(importTypedSeeds, "Typed seeds imported.")} className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-left font-bold text-orange-900">
          Import Typed Seeds
          <span className="mt-1 block text-sm font-normal">Skips seed-protected approved charts.</span>
        </button>
        <button type="button" onClick={() => exportApprovedPack().then(pack => downloadJson("approved-strategy-pack.json", pack))} className="rounded-2xl border border-slate-200 bg-white p-5 text-left font-bold">
          Export Approved Pack
          <span className="mt-1 block text-sm font-normal text-slate-600">Exports approved active chart truth only.</span>
        </button>
        <button type="button" onClick={() => exportFullBackup().then(backup => downloadJson("mtt-study-full-backup.json", backup))} className="rounded-2xl border border-slate-200 bg-white p-5 text-left font-bold">
          Export Full Backup
          <span className="mt-1 block text-sm font-normal text-slate-600">Includes snapshots, drafts, audit log, and import/export log.</span>
        </button>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="font-bold">Paste approved pack or full backup JSON</label>
        <textarea
          value={text}
          onChange={event => setText(event.target.value)}
          className="mt-3 min-h-64 w-full rounded-xl border border-slate-200 p-3 font-mono text-xs"
          placeholder="{ ... }"
        />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => run(() => importApprovedPack(JSON.parse(text) as any), "Approved pack imported.")}
            className="rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white"
          >
            Import Approved Pack
          </button>
          <button
            type="button"
            onClick={() => run(() => restoreFullBackup(JSON.parse(text)), "Full backup restored.")}
            className="rounded-xl bg-red-600 px-4 py-3 font-bold text-white"
          >
            Restore Full Backup
          </button>
        </div>
      </section>
    </LocalShell>
  );
}
