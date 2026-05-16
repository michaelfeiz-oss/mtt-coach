import type {
  ActionToken,
  ChartCells,
  ResolvedStrategyChart,
  StrategyChartRecord,
  StrategyChartSnapshot,
  StrategyPack,
} from "@shared/strategy-v2/model";

export interface StudyNoteRecord {
  id: number;
  title: string;
  body: string;
  category: string | null;
  tags: string[];
  linkedNodeKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyNoteInput {
  title: string;
  body: string;
  category?: string | null;
  tags?: string[];
  linkedNodeKey?: string | null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.ok === false) {
    const message = data?.error?.message ?? `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

export function listCharts(filters?: {
  stackBb?: number | string;
  spotType?: string;
  position?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "all" && value !== "") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return request<{ ok: true; charts: StrategyChartRecord[] }>(
    `/api/local/charts${query ? `?${query}` : ""}`
  );
}

export function getChart(nodeKey: string) {
  return request<{ ok: true; resolved: ResolvedStrategyChart }>(
    `/api/local/charts/${encodeURIComponent(nodeKey)}`
  );
}

export function getHistory(nodeKey: string) {
  return request<{
    ok: true;
    snapshots: StrategyChartSnapshot[];
    draft: unknown;
  }>(`/api/local/charts/${encodeURIComponent(nodeKey)}/history`);
}

export function importTypedSeeds() {
  return request<{
    ok: true;
    imported: number;
    skipped: number;
    totalReviewedNodes: number;
  }>("/api/local/seeds/import", { method: "POST", body: "{}" });
}

export function saveDraft(
  nodeKey: string,
  payload: { allowedActions: ActionToken[]; cells: ChartCells; notes?: string | null }
) {
  return request(`/api/local/charts/${encodeURIComponent(nodeKey)}/draft`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function markReviewed(
  nodeKey: string,
  payload: { allowedActions: ActionToken[]; cells: ChartCells; notes?: string | null }
) {
  return request(`/api/local/charts/${encodeURIComponent(nodeKey)}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function approveChart(
  nodeKey: string,
  payload: { allowedActions: ActionToken[]; cells: ChartCells; notes?: string | null }
) {
  return request(`/api/local/charts/${encodeURIComponent(nodeKey)}/approve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function revertChart(nodeKey: string, snapshotId: number) {
  return request(`/api/local/charts/${encodeURIComponent(nodeKey)}/revert`, {
    method: "POST",
    body: JSON.stringify({ snapshotId }),
  });
}

export function exportApprovedPack() {
  return request<StrategyPack>("/api/local/export/approved");
}

export function importApprovedPack(pack: StrategyPack) {
  return request("/api/local/import/approved", {
    method: "POST",
    body: JSON.stringify(pack),
  });
}

export function exportFullBackup() {
  return request<Record<string, unknown>>("/api/local/backup");
}

export function restoreFullBackup(backup: unknown) {
  return request("/api/local/restore", {
    method: "POST",
    body: JSON.stringify(backup),
  });
}

export function getAudit() {
  return request<{ ok: true; audit: unknown }>("/api/local/audit");
}

export function getTrainerQuestion(filters?: {
  stackBb?: number | string;
  spotType?: string;
  handPool?: string;
  chartSource?: string;
  nodeKey?: string;
}) {
  const params = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && (key === "handPool" || value !== "all")) {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return request<{ ok: true; question: any }>(
    `/api/local/trainer/question${query ? `?${query}` : ""}`
  );
}

export function listStudyNotes(filters?: { query?: string; category?: string }) {
  const params = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "all" && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return request<{ ok: true; notes: StudyNoteRecord[] }>(
    `/api/local/study-notes${query ? `?${query}` : ""}`
  );
}

export function createStudyNote(payload: StudyNoteInput) {
  return request<{ ok: true; note: StudyNoteRecord }>("/api/local/study-notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStudyNote(id: number, payload: StudyNoteInput) {
  return request<{ ok: true; note: StudyNoteRecord }>(`/api/local/study-notes/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteStudyNote(id: number) {
  return request<{ ok: true }>(`/api/local/study-notes/${id}`, {
    method: "DELETE",
  });
}
