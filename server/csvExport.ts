/**
 * CSV Export Utilities
 * 
 * Generate CSV exports for hands, tournaments, and study sessions
 */

import type { Hand, Tournament, StudySession } from "../drizzle/schema";

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: Record<string, any>[], headers: string[]): string {
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeCSV).join(",");
  const dataRows = data.map((row) =>
    headers.map((header) => escapeCSV(row[header])).join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Export hands to CSV
 */
export function exportHandsToCSV(hands: any[]): string {
  const headers = [
    "id",
    "date",
    "tournamentName",
    "position",
    "heroHand",
    "board",
    "stackBB",
    "stage",
    "mistakeStreet",
    "severity",
    "lesson",
    "actionSummary",
    "reviewed",
  ];

  const data = hands.map((hand) => ({
    id: hand.id,
    date: hand.date ? new Date(hand.date).toISOString() : "",
    tournamentName: hand.tournament?.name || hand.tournament?.venue || "",
    position: hand.position || "",
    heroHand: hand.heroHand || "",
    board: hand.board || "",
    stackBB: hand.stackBB || "",
    stage: hand.stage || "",
    mistakeStreet: hand.mistakeStreet || "",
    severity: hand.severity ?? "",
    lesson: hand.lesson || "",
    actionSummary: hand.actionSummary || "",
    reviewed: hand.reviewed ? "Yes" : "No",
  }));

  return arrayToCSV(data, headers);
}

/**
 * Export tournaments to CSV
 */
export function exportTournamentsToCSV(tournaments: Tournament[]): string {
  const headers = [
    "id",
    "date",
    "venue",
    "name",
    "buyIn",
    "startingStack",
    "fieldSize",
    "reEntries",
    "finalPosition",
    "prize",
    "netResult",
    "stageReached",
    "selfRating",
    "mentalRating",
    "notesOverall",
  ];

  const data = tournaments.map((t) => ({
    id: t.id,
    date: t.date ? new Date(t.date).toISOString() : "",
    venue: t.venue || "",
    name: t.name || "",
    buyIn: t.buyIn,
    startingStack: t.startingStack || "",
    fieldSize: t.fieldSize || "",
    reEntries: t.reEntries,
    finalPosition: t.finalPosition || "",
    prize: t.prize,
    netResult: t.netResult,
    stageReached: t.stageReached || "",
    selfRating: t.selfRating ?? "",
    mentalRating: t.mentalRating ?? "",
    notesOverall: t.notesOverall || "",
  }));

  return arrayToCSV(data, headers);
}

/**
 * Export study sessions to CSV
 */
export function exportStudySessionsToCSV(sessions: StudySession[]): string {
  const headers = [
    "id",
    "date",
    "type",
    "durationMinutes",
    "resourceUsed",
    "handsReviewedCount",
    "drillsCompletedCount",
    "accuracyPercent",
    "keyTakeaways",
    "fromPlan",
    "planSlot",
  ];

  const data = sessions.map((s) => ({
    id: s.id,
    date: s.date ? new Date(s.date).toISOString() : "",
    type: s.type,
    durationMinutes: s.durationMinutes,
    resourceUsed: s.resourceUsed || "",
    handsReviewedCount: s.handsReviewedCount,
    drillsCompletedCount: s.drillsCompletedCount,
    accuracyPercent: s.accuracyPercent ?? "",
    keyTakeaways: s.keyTakeaways || "",
    fromPlan: s.fromPlan ? "Yes" : "No",
    planSlot: s.planSlot || "",
  }));

  return arrayToCSV(data, headers);
}
