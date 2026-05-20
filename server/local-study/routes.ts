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
  getReviewScenario,
  getReviewScenarioSummary,
  importApprovedPack,
  importPopulationDraftPack,
  importReviewScenarioPack,
  listCharts,
  listReviewScenarios,
  listSnapshots,
  listStudyNotes,
  resolveChart,
  restoreFullBackup,
  revertToSnapshot,
  saveDraft,
  updateStudyNote,
  updateReviewScenarioOwnerDecision,
} from "./db";
import { importTypedSeedsIntoLocalDb } from "./seedImport";
import { loadReviewPack } from "./reviewScenarios";
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

  app.post(
    "/api/local/import/population-draft",
    asyncRoute((req, res) => {
      res.json({ ok: true, ...importPopulationDraftPack(req.body) });
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
    "/api/local/strategy-review/scenarios",
    asyncRoute((req, res) => {
      res.json({
        ok: true,
        scenarios: listReviewScenarios({
          spotFamily: req.query.family ? String(req.query.family) : undefined,
          stackBb: req.query.stackBb ? Number(req.query.stackBb) : undefined,
          appStatus: req.query.status ? String(req.query.status) : undefined,
          sourceClass: req.query.sourceClass ? String(req.query.sourceClass) : undefined,
          rangeCellsStatus: req.query.rangeCellsStatus ? String(req.query.rangeCellsStatus) : undefined,
          trainerDefaultVisibility: req.query.trainerVisibility
            ? String(req.query.trainerVisibility)
            : undefined,
          ownerDecision: req.query.ownerDecision ? String(req.query.ownerDecision) : undefined,
        }),
      });
    })
  );

  app.get(
    "/api/local/strategy-review/summary",
    asyncRoute((_req, res) => {
      res.json({ ok: true, summary: getReviewScenarioSummary() });
    })
  );

  app.post(
    "/api/local/strategy-review/import",
    asyncRoute((_req, res) => {
      res.json({ ok: true, ...importReviewScenarioPack(loadReviewPack()) });
    })
  );

  app.get(
    "/api/local/strategy-review/scenarios/:nodeKey",
    asyncRoute((req, res) => {
      const scenario = getReviewScenario(req.params.nodeKey);
      if (!scenario) {
        res.status(404).json({ ok: false, error: { message: "Review scenario not found" } });
        return;
      }
      res.json({ ok: true, scenario });
    })
  );

  app.patch(
    "/api/local/strategy-review/scenarios/:nodeKey/owner-decision",
    asyncRoute((req, res) => {
      res.json({
        ok: true,
        scenario: updateReviewScenarioOwnerDecision(req.params.nodeKey, req.body),
      });
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
      const chartSource =
        req.query.chartSource === "approved" ||
        req.query.chartSource === "reviewed_approved" ||
        req.query.chartSource === "include_population"
          ? req.query.chartSource
          : "typed_seed";
      const question = chooseTrainerQuestion({
        nodeKey: req.query.nodeKey ? String(req.query.nodeKey) : undefined,
        stackBb: req.query.stackBb ? Number(req.query.stackBb) : undefined,
        spotType: req.query.spotType ? String(req.query.spotType) : undefined,
        handPool,
        chartSource,
      });
      if (!question) {
        const message = "No eligible charts for this trainer filter.";
        res.status(404).json({ ok: false, error: { message } });
        return;
      }
      res.json({ ok: true, question });
    })
  );
}
