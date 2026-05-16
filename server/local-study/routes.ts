import type express from "express";
import {
  buildAuditSummary,
  chooseTrainerQuestion,
  createSnapshotFromCells,
  createStudyNote,
  deleteDraft,
  deleteStudyNote,
  exportApprovedPack,
  exportFullBackup,
  getChart,
  getDraft,
  getLocalDbPath,
  importApprovedPack,
  listCharts,
  listSnapshots,
  listStudyNotes,
  resolveChart,
  restoreFullBackup,
  revertToSnapshot,
  saveDraft,
  updateStudyNote,
} from "./db";
import { importTypedSeedsIntoLocalDb } from "./seedImport";
import { toValidationProblem } from "../../shared/strategy-v2/validation";
import type { ActionToken, ChartCells } from "../../shared/strategy-v2/model";

function asyncRoute(
  handler: (req: express.Request, res: express.Response) => Promise<void> | void
) {
  return async (req: express.Request, res: express.Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      const problem = toValidationProblem(error);
      res.status(problem.code === "UNKNOWN" ? 500 : 400).json({
        ok: false,
        error: problem,
      });
    }
  };
}

export function registerLocalStudyRoutes(app: express.Express) {
  app.get(
    "/api/local/health",
    asyncRoute((_req, res) => {
      res.json({ ok: true, dbPath: getLocalDbPath() });
    })
  );

  app.post(
    "/api/local/seeds/import",
    asyncRoute((_req, res) => {
      res.json({ ok: true, ...importTypedSeedsIntoLocalDb() });
    })
  );

  app.get(
    "/api/local/charts",
    asyncRoute((req, res) => {
      res.json({
        ok: true,
        charts: listCharts({
          stackBb: req.query.stackBb ? Number(req.query.stackBb) : undefined,
          spotType: req.query.spotType ? String(req.query.spotType) : undefined,
          position: req.query.position ? String(req.query.position) : undefined,
          status: req.query.status ? String(req.query.status) : undefined,
        }),
      });
    })
  );

  app.get(
    "/api/local/charts/:nodeKey",
    asyncRoute((req, res) => {
      const resolved = resolveChart(req.params.nodeKey);
      if (!resolved) {
        res.status(404).json({ ok: false, error: { message: "Chart not found" } });
        return;
      }
      res.json({ ok: true, resolved });
    })
  );

  app.get(
    "/api/local/charts/:nodeKey/history",
    asyncRoute((req, res) => {
      const chart = getChart(req.params.nodeKey);
      if (!chart) {
        res.status(404).json({ ok: false, error: { message: "Chart not found" } });
        return;
      }
      res.json({ ok: true, snapshots: listSnapshots(chart.nodeKey), draft: getDraft(chart.nodeKey) });
    })
  );

  app.post(
    "/api/local/charts/:nodeKey/draft",
    asyncRoute((req, res) => {
      const draft = saveDraft({
        nodeKey: req.params.nodeKey,
        allowedActions: req.body.allowedActions as ActionToken[],
        cells: req.body.cells as ChartCells,
        notes: req.body.notes ?? null,
      });
      res.json({ ok: true, draft });
    })
  );

  app.delete(
    "/api/local/charts/:nodeKey/draft",
    asyncRoute((req, res) => {
      deleteDraft(req.params.nodeKey);
      res.json({ ok: true });
    })
  );

  app.post(
    "/api/local/charts/:nodeKey/review",
    asyncRoute((req, res) => {
      const snapshot = createSnapshotFromCells({
        nodeKey: req.params.nodeKey,
        status: "reviewed",
        allowedActions: req.body.allowedActions as ActionToken[],
        cells: req.body.cells as ChartCells,
        notes: req.body.notes ?? null,
      });
      res.json({ ok: true, snapshot, resolved: resolveChart(req.params.nodeKey) });
    })
  );

  app.post(
    "/api/local/charts/:nodeKey/approve",
    asyncRoute((req, res) => {
      const snapshot = createSnapshotFromCells({
        nodeKey: req.params.nodeKey,
        status: "approved",
        allowedActions: req.body.allowedActions as ActionToken[],
        cells: req.body.cells as ChartCells,
        notes: req.body.notes ?? null,
      });
      res.json({ ok: true, snapshot, resolved: resolveChart(req.params.nodeKey) });
    })
  );

  app.post(
    "/api/local/charts/:nodeKey/revert",
    asyncRoute((req, res) => {
      const snapshot = revertToSnapshot(req.params.nodeKey, Number(req.body.snapshotId));
      res.json({ ok: true, snapshot, resolved: resolveChart(req.params.nodeKey) });
    })
  );

  app.get(
    "/api/local/export/approved",
    asyncRoute((_req, res) => {
      res.json(exportApprovedPack());
    })
  );

  app.post(
    "/api/local/import/approved",
    asyncRoute((req, res) => {
      res.json({ ok: true, ...importApprovedPack(req.body) });
    })
  );

  app.get(
    "/api/local/backup",
    asyncRoute((_req, res) => {
      res.json(exportFullBackup());
    })
  );

  app.post(
    "/api/local/restore",
    asyncRoute((req, res) => {
      res.json({ ok: true, ...restoreFullBackup(req.body) });
    })
  );

  app.get(
    "/api/local/audit",
    asyncRoute((_req, res) => {
      res.json({ ok: true, audit: buildAuditSummary() });
    })
  );

  app.get(
    "/api/local/study-notes",
    asyncRoute((req, res) => {
      res.json({
        ok: true,
        notes: listStudyNotes({
          query: req.query.query ? String(req.query.query) : undefined,
          category: req.query.category ? String(req.query.category) : undefined,
        }),
      });
    })
  );

  app.post(
    "/api/local/study-notes",
    asyncRoute((req, res) => {
      res.json({ ok: true, note: createStudyNote(req.body) });
    })
  );

  app.put(
    "/api/local/study-notes/:id",
    asyncRoute((req, res) => {
      res.json({ ok: true, note: updateStudyNote(Number(req.params.id), req.body) });
    })
  );

  app.delete(
    "/api/local/study-notes/:id",
    asyncRoute((req, res) => {
      deleteStudyNote(Number(req.params.id));
      res.json({ ok: true });
    })
  );

  app.get(
    "/api/local/trainer/question",
    asyncRoute((req, res) => {
      const handPool =
        req.query.handPool === "all" || req.query.handPool === "fold"
          ? req.query.handPool
          : "playable";
      const question = chooseTrainerQuestion({
        stackBb: req.query.stackBb ? Number(req.query.stackBb) : undefined,
        spotType: req.query.spotType ? String(req.query.spotType) : undefined,
        handPool,
      });
      if (!question) {
        const message =
          handPool === "playable"
            ? "No playable hands available for this chart."
            : handPool === "fold"
              ? "No Fold hands available for this chart."
              : "No reviewed charts available.";
        res.status(404).json({ ok: false, error: { message } });
        return;
      }
      res.json({ ok: true, question });
    })
  );
}
