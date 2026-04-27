import { getSpotNote } from "./spotNotes";
import type { ChartLikeSpotContext } from "./spotIds";
import {
  getStrategySourceLabel,
  getStrategySourceStatus,
  type StrategySourceStatus,
} from "./sourceTruth";

export interface StrategyTheoryContext extends ChartLikeSpotContext {}

export interface StrategyTheorySection {
  key:
    | "coreIdea"
    | "defaultLine"
    | "exploitLever"
    | "commonPunt"
    | "drillCue"
    | "stageAdjustment";
  title: string;
  body: string;
  accent?: boolean;
}

export interface StrategyTheoryResult {
  sections: StrategyTheorySection[];
  sourceStatus: StrategySourceStatus | null;
  sourceLabel: string | null;
}

export function buildStrategyTheoryResult(
  context: StrategyTheoryContext
): StrategyTheoryResult {
  const note = getSpotNote(context);
  if (!note) return { sections: [], sourceStatus: null, sourceLabel: null };

  return {
    sections: buildStrategyTheorySections(context),
    sourceStatus: getStrategySourceStatus(context),
    sourceLabel: getStrategySourceLabel(context),
  };
}

export function buildStrategyTheorySections(
  context: StrategyTheoryContext
): StrategyTheorySection[] {
  const note = getSpotNote(context);
  if (!note) return [];

  const sections: StrategyTheorySection[] = [
    { key: "coreIdea", title: "Core Idea", body: note.coreIdea },
    { key: "defaultLine", title: "Default", body: note.defaultLine },
    {
      key: "exploitLever",
      title: "Exploit Lever",
      body: note.exploitLever,
    },
    { key: "commonPunt", title: "Common Punt", body: note.commonPunt },
    {
      key: "drillCue",
      title: "Drill Cue",
      body: note.drillCue,
      accent: true,
    },
  ];

  if (note.stageAdjustment) {
    sections.push({
      key: "stageAdjustment",
      title: "Stage Adjustment",
      body: note.stageAdjustment,
    });
  }

  return sections;
}
