export interface AppDefinition {
  name: string;
  icon: string;
  alt: string;
}

export type StageState = "waiting" | "active" | "complete";

export type FeedItemStatus = "entering" | "processing" | "completing" | "exiting";

export interface FeedItem {
  id: string;
  app: AppDefinition;
  stageIndex: number;
  stageProgress: number;
  status: FeedItemStatus;
  holdElapsed: number;
  enterElapsed: number;
}

export type ViewportMode = "desktop" | "mobile";
export type FeedAnimationMode = "default" | "heroCalm";

export interface FeedMotionConfig {
  stageDurationsMs: number[];
  enterAnimationMs: number;
  completeHoldMs: number;
  exitAnimationMs: number;
  visibleCount: number;
  enterOffsetY: number;
  exitOffsetY: number;
}

const STAGE_DURATIONS_BASE_MS = [1100, 1450, 1300, 900] as const;
const MOBILE_DURATION_MULTIPLIER = 1.2;
const HERO_CALM_STAGE_DURATIONS_BASE_MS = STAGE_DURATIONS_BASE_MS.map((duration) =>
  Math.round(duration * 1.18)
) as [number, number, number, number];
const HERO_CALM_MOBILE_DURATION_MULTIPLIER = 1.12;

export const FEED_MOTION_CONFIGS: Record<ViewportMode, FeedMotionConfig> = {
  desktop: {
    stageDurationsMs: [...STAGE_DURATIONS_BASE_MS],
    enterAnimationMs: 320,
    completeHoldMs: 900,
    exitAnimationMs: 400,
    visibleCount: 3,
    enterOffsetY: 14,
    exitOffsetY: -8,
  },
  mobile: {
    stageDurationsMs: STAGE_DURATIONS_BASE_MS.map((duration) =>
      Math.round(duration * MOBILE_DURATION_MULTIPLIER)
    ),
    enterAnimationMs: 320,
    completeHoldMs: 900,
    exitAnimationMs: 400,
    visibleCount: 2,
    enterOffsetY: 10,
    exitOffsetY: -5,
  },
};

export const HERO_CALM_FEED_MOTION_CONFIGS: Record<ViewportMode, FeedMotionConfig> = {
  desktop: {
    stageDurationsMs: [...HERO_CALM_STAGE_DURATIONS_BASE_MS],
    enterAnimationMs: 380,
    completeHoldMs: 1050,
    exitAnimationMs: 460,
    visibleCount: 3,
    enterOffsetY: 12,
    exitOffsetY: -6,
  },
  mobile: {
    stageDurationsMs: HERO_CALM_STAGE_DURATIONS_BASE_MS.map((duration) =>
      Math.round(duration * HERO_CALM_MOBILE_DURATION_MULTIPLIER)
    ),
    enterAnimationMs: 380,
    completeHoldMs: 1050,
    exitAnimationMs: 460,
    visibleCount: 2,
    enterOffsetY: 9,
    exitOffsetY: -4,
  },
};

export function getFeedMotionConfig(mode: FeedAnimationMode, viewportMode: ViewportMode): FeedMotionConfig {
  return mode === "heroCalm" ? HERO_CALM_FEED_MOTION_CONFIGS[viewportMode] : FEED_MOTION_CONFIGS[viewportMode];
}

interface MakeItemParams {
  app: AppDefinition;
  id: string;
  status: FeedItemStatus;
  stageIndex: number;
  stageProgress: number;
  enterAnimationMs: number;
}

function makeItem({ app, id, status, stageIndex, stageProgress, enterAnimationMs }: MakeItemParams): FeedItem {
  return {
    id,
    app,
    stageIndex,
    stageProgress,
    status,
    holdElapsed: 0,
    enterElapsed: status === "processing" ? enterAnimationMs : 0,
  };
}

interface CreateInitialFeedItemsOptions {
  config: FeedMotionConfig;
  stageCount: number;
  getNextApp: () => AppDefinition;
  createId: (app: AppDefinition) => string;
}

export function createInitialFeedItems({
  config,
  stageCount,
  getNextApp,
  createId,
}: CreateInitialFeedItemsOptions): FeedItem[] {
  const safeMaxStageIndex = Math.max(stageCount - 1, 0);
  const seedTemplates =
    config.visibleCount >= 3
      ? [
          { stageIndex: Math.min(2, safeMaxStageIndex), stageProgress: 0.4, status: "processing" as const },
          { stageIndex: Math.min(1, safeMaxStageIndex), stageProgress: 0.2, status: "processing" as const },
          { stageIndex: 0, stageProgress: 0, status: "entering" as const },
        ]
      : [
          { stageIndex: Math.min(1, safeMaxStageIndex), stageProgress: 0.25, status: "processing" as const },
          { stageIndex: 0, stageProgress: 0, status: "entering" as const },
        ];

  return seedTemplates.slice(0, config.visibleCount).map((template) => {
    const app = getNextApp();
    return makeItem({
      app,
      id: createId(app),
      status: template.status,
      stageIndex: template.stageIndex,
      stageProgress: template.stageProgress,
      enterAnimationMs: config.enterAnimationMs,
    });
  });
}

interface TickFeedItemsOptions {
  prevItems: FeedItem[];
  config: FeedMotionConfig;
  tickMs: number;
  stageCount: number;
  getNextApp: () => AppDefinition;
  createId: (app: AppDefinition) => string;
}

function getStageDurationMs(config: FeedMotionConfig, stageIndex: number): number {
  if (stageIndex >= 0 && stageIndex < config.stageDurationsMs.length) {
    return config.stageDurationsMs[stageIndex];
  }
  return config.stageDurationsMs[config.stageDurationsMs.length - 1] ?? 1200;
}

export function tickFeedItems({
  prevItems,
  config,
  tickMs,
  stageCount,
  getNextApp,
  createId,
}: TickFeedItemsOptions): FeedItem[] {
  const lastStageIndex = Math.max(stageCount - 1, 0);
  let items = prevItems.map((item) => ({ ...item }));

  for (const item of items) {
    switch (item.status) {
      case "entering": {
        item.enterElapsed += tickMs;
        if (item.enterElapsed >= config.enterAnimationMs) {
          item.status = "processing";
          item.enterElapsed = config.enterAnimationMs;
        }
        break;
      }
      case "processing": {
        const stageDurationMs = getStageDurationMs(config, item.stageIndex);
        item.stageProgress = Math.min(1, item.stageProgress + tickMs / stageDurationMs);

        if (item.stageProgress >= 1) {
          if (item.stageIndex >= lastStageIndex) {
            item.stageProgress = 1;
            item.status = "completing";
            item.holdElapsed = 0;
          } else {
            item.stageIndex += 1;
            item.stageProgress = 0;
          }
        }
        break;
      }
      case "completing": {
        item.holdElapsed += tickMs;
        if (item.holdElapsed >= config.completeHoldMs) {
          item.status = "exiting";
          item.holdElapsed = 0;
        }
        break;
      }
      case "exiting": {
        item.holdElapsed += tickMs;
        break;
      }
    }
  }

  // If viewport profile asks for fewer visible rows, phase out extras gracefully.
  let nonExitingItems = items.filter((item) => item.status !== "exiting");
  if (nonExitingItems.length > config.visibleCount) {
    const overflow = nonExitingItems.length - config.visibleCount;
    let marked = 0;
    for (let i = items.length - 1; i >= 0 && marked < overflow; i -= 1) {
      if (items[i].status !== "exiting") {
        items[i].status = "exiting";
        items[i].holdElapsed = 0;
        marked += 1;
      }
    }
  }

  nonExitingItems = items.filter((item) => item.status !== "exiting");
  while (nonExitingItems.length < config.visibleCount) {
    const nextApp = getNextApp();
    const newItem = makeItem({
      app: nextApp,
      id: createId(nextApp),
      status: "entering",
      stageIndex: 0,
      stageProgress: 0,
      enterAnimationMs: config.enterAnimationMs,
    });
    items.push(newItem);
    nonExitingItems.push(newItem);
  }

  items = items.filter((item) => {
    if (item.status !== "exiting") return true;
    return item.holdElapsed < config.exitAnimationMs;
  });

  return items;
}
