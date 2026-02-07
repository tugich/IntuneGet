import { describe, expect, it } from "vitest";
import {
  FEED_MOTION_CONFIGS,
  createInitialFeedItems,
  tickFeedItems,
  type AppDefinition,
  type FeedItem,
  type FeedMotionConfig,
} from "@/lib/landing/deploymentFeedMotion";

function makeApp(name: string): AppDefinition {
  return {
    name,
    icon: `/icons/${name}.png`,
    alt: `${name} deployment`,
  };
}

function makeNextApp(names: string[]) {
  let index = 0;
  return () => {
    const name = names[index % names.length];
    index += 1;
    return makeApp(name);
  };
}

function makeIdFactory() {
  let id = 0;
  return (app: AppDefinition) => `${app.name}-${++id}`;
}

describe("deploymentFeedMotion", () => {
  it("creates desktop and mobile seeds with expected visible count", () => {
    const desktopItems = createInitialFeedItems({
      config: FEED_MOTION_CONFIGS.desktop,
      stageCount: 4,
      getNextApp: makeNextApp(["A", "B", "C", "D"]),
      createId: makeIdFactory(),
    });

    const mobileItems = createInitialFeedItems({
      config: FEED_MOTION_CONFIGS.mobile,
      stageCount: 4,
      getNextApp: makeNextApp(["A", "B", "C", "D"]),
      createId: makeIdFactory(),
    });

    expect(desktopItems).toHaveLength(3);
    expect(mobileItems).toHaveLength(2);
    expect(desktopItems[0].status).toBe("processing");
    expect(mobileItems[1].status).toBe("entering");
  });

  it("advances processing items with stage-specific durations", () => {
    const desktop = FEED_MOTION_CONFIGS.desktop;
    const item: FeedItem = {
      id: "a",
      app: makeApp("Chrome"),
      stageIndex: 0,
      stageProgress: 0,
      status: "processing",
      holdElapsed: 0,
      enterElapsed: desktop.enterAnimationMs,
    };

    const advanced = tickFeedItems({
      prevItems: [item],
      config: { ...desktop, visibleCount: 1 },
      tickMs: 550,
      stageCount: 4,
      getNextApp: makeNextApp(["Next"]),
      createId: makeIdFactory(),
    });

    expect(advanced[0].status).toBe("processing");
    expect(advanced[0].stageProgress).toBeCloseTo(0.5, 2);
  });

  it("keeps mobile progression calmer via longer stage durations", () => {
    const desktop = FEED_MOTION_CONFIGS.desktop;
    const mobile = FEED_MOTION_CONFIGS.mobile;

    const base: FeedItem = {
      id: "a",
      app: makeApp("Slack"),
      stageIndex: 0,
      stageProgress: 0,
      status: "processing",
      holdElapsed: 0,
      enterElapsed: desktop.enterAnimationMs,
    };

    const desktopTick = tickFeedItems({
      prevItems: [base],
      config: { ...desktop, visibleCount: 1 },
      tickMs: 220,
      stageCount: 4,
      getNextApp: makeNextApp(["X"]),
      createId: makeIdFactory(),
    });

    const mobileTick = tickFeedItems({
      prevItems: [base],
      config: { ...mobile, visibleCount: 1 },
      tickMs: 220,
      stageCount: 4,
      getNextApp: makeNextApp(["X"]),
      createId: makeIdFactory(),
    });

    expect(desktopTick[0].stageProgress).toBeGreaterThan(mobileTick[0].stageProgress);
  });

  it("removes exiting items after exit animation duration", () => {
    const config: FeedMotionConfig = {
      ...FEED_MOTION_CONFIGS.desktop,
      visibleCount: 0,
    };

    const exiting: FeedItem = {
      id: "old",
      app: makeApp("VSCode"),
      stageIndex: 3,
      stageProgress: 1,
      status: "exiting",
      holdElapsed: 390,
      enterElapsed: config.enterAnimationMs,
    };

    const next = tickFeedItems({
      prevItems: [exiting],
      config,
      tickMs: 20,
      stageCount: 4,
      getNextApp: makeNextApp(["Unused"]),
      createId: makeIdFactory(),
    });

    expect(next).toHaveLength(0);
  });

  it("maintains visible count by creating entering items", () => {
    const items = tickFeedItems({
      prevItems: [],
      config: FEED_MOTION_CONFIGS.desktop,
      tickMs: 80,
      stageCount: 4,
      getNextApp: makeNextApp(["A", "B", "C", "D"]),
      createId: makeIdFactory(),
    });

    expect(items).toHaveLength(FEED_MOTION_CONFIGS.desktop.visibleCount);
    expect(items.every((item) => item.status === "entering")).toBe(true);
  });

  it("phases out overflow rows when switching to a smaller visible count", () => {
    const prev: FeedItem[] = [
      {
        id: "1",
        app: makeApp("App1"),
        stageIndex: 0,
        stageProgress: 0.4,
        status: "processing",
        holdElapsed: 0,
        enterElapsed: FEED_MOTION_CONFIGS.desktop.enterAnimationMs,
      },
      {
        id: "2",
        app: makeApp("App2"),
        stageIndex: 1,
        stageProgress: 0.2,
        status: "processing",
        holdElapsed: 0,
        enterElapsed: FEED_MOTION_CONFIGS.desktop.enterAnimationMs,
      },
      {
        id: "3",
        app: makeApp("App3"),
        stageIndex: 2,
        stageProgress: 0.1,
        status: "processing",
        holdElapsed: 0,
        enterElapsed: FEED_MOTION_CONFIGS.desktop.enterAnimationMs,
      },
    ];

    const next = tickFeedItems({
      prevItems: prev,
      config: FEED_MOTION_CONFIGS.mobile,
      tickMs: 80,
      stageCount: 4,
      getNextApp: makeNextApp(["X", "Y"]),
      createId: makeIdFactory(),
    });

    expect(next.filter((item) => item.status !== "exiting")).toHaveLength(FEED_MOTION_CONFIGS.mobile.visibleCount);
  });
});
