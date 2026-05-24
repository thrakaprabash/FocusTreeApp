export const XP_PER_TASK = 10;
export const XP_PER_LEVEL = 100;
export const XP_PENALTY = 10;

/**
 * How many XP-levels map to a single tree stage image.
 * 1 level = 100 XP = 10 completed tasks
 * 1 stage = 1 level  →  100 stages cover levels 0-99
 * (players progress through all 100 tree images)
 */
export const LEVELS_PER_TREE_STAGE = 1;

// ─── All 100 tree stage images ────────────────────────────────────────────────
// Source: extracted_tree_snaps/
// These are direct screenshots of the growing tree, one per stage.
// No extra whitespace, so imageScale = 1 for all.
const TREE_STAGE_IMAGES = [
  require("../../extracted_tree_snaps/tree_snap_001.webp"),
  require("../../extracted_tree_snaps/tree_snap_002.webp"),
  require("../../extracted_tree_snaps/tree_snap_003.webp"),
  require("../../extracted_tree_snaps/tree_snap_004.webp"),
  require("../../extracted_tree_snaps/tree_snap_005.webp"),
  require("../../extracted_tree_snaps/tree_snap_006.webp"),
  require("../../extracted_tree_snaps/tree_snap_007.webp"),
  require("../../extracted_tree_snaps/tree_snap_008.webp"),
  require("../../extracted_tree_snaps/tree_snap_009.webp"),
  require("../../extracted_tree_snaps/tree_snap_010.webp"),
  require("../../extracted_tree_snaps/tree_snap_011.webp"),
  require("../../extracted_tree_snaps/tree_snap_012.webp"),
  require("../../extracted_tree_snaps/tree_snap_013.webp"),
  require("../../extracted_tree_snaps/tree_snap_014.webp"),
  require("../../extracted_tree_snaps/tree_snap_015.webp"),
  require("../../extracted_tree_snaps/tree_snap_016.webp"),
  require("../../extracted_tree_snaps/tree_snap_017.webp"),
  require("../../extracted_tree_snaps/tree_snap_018.webp"),
  require("../../extracted_tree_snaps/tree_snap_019.webp"),
  require("../../extracted_tree_snaps/tree_snap_020.webp"),
  require("../../extracted_tree_snaps/tree_snap_021.webp"),
  require("../../extracted_tree_snaps/tree_snap_022.webp"),
  require("../../extracted_tree_snaps/tree_snap_023.webp"),
  require("../../extracted_tree_snaps/tree_snap_024.webp"),
  require("../../extracted_tree_snaps/tree_snap_025.webp"),
  require("../../extracted_tree_snaps/tree_snap_026.webp"),
  require("../../extracted_tree_snaps/tree_snap_027.webp"),
  require("../../extracted_tree_snaps/tree_snap_028.webp"),
  require("../../extracted_tree_snaps/tree_snap_029.webp"),
  require("../../extracted_tree_snaps/tree_snap_030.webp"),
  require("../../extracted_tree_snaps/tree_snap_031.webp"),
  require("../../extracted_tree_snaps/tree_snap_032.webp"),
  require("../../extracted_tree_snaps/tree_snap_033.webp"),
  require("../../extracted_tree_snaps/tree_snap_034.webp"),
  require("../../extracted_tree_snaps/tree_snap_035.webp"),
  require("../../extracted_tree_snaps/tree_snap_036.webp"),
  require("../../extracted_tree_snaps/tree_snap_037.webp"),
  require("../../extracted_tree_snaps/tree_snap_038.webp"),
  require("../../extracted_tree_snaps/tree_snap_039.webp"),
  require("../../extracted_tree_snaps/tree_snap_040.webp"),
  require("../../extracted_tree_snaps/tree_snap_041.webp"),
  require("../../extracted_tree_snaps/tree_snap_042.webp"),
  require("../../extracted_tree_snaps/tree_snap_043.webp"),
  require("../../extracted_tree_snaps/tree_snap_044.webp"),
  require("../../extracted_tree_snaps/tree_snap_045.webp"),
  require("../../extracted_tree_snaps/tree_snap_046.webp"),
  require("../../extracted_tree_snaps/tree_snap_047.webp"),
  require("../../extracted_tree_snaps/tree_snap_048.webp"),
  require("../../extracted_tree_snaps/tree_snap_049.webp"),
  require("../../extracted_tree_snaps/tree_snap_050.webp"),
  require("../../extracted_tree_snaps/tree_snap_051.webp"),
  require("../../extracted_tree_snaps/tree_snap_052.webp"),
  require("../../extracted_tree_snaps/tree_snap_053.webp"),
  require("../../extracted_tree_snaps/tree_snap_054.webp"),
  require("../../extracted_tree_snaps/tree_snap_055.webp"),
  require("../../extracted_tree_snaps/tree_snap_056.webp"),
  require("../../extracted_tree_snaps/tree_snap_057.webp"),
  require("../../extracted_tree_snaps/tree_snap_058.webp"),
  require("../../extracted_tree_snaps/tree_snap_059.webp"),
  require("../../extracted_tree_snaps/tree_snap_060.webp"),
  require("../../extracted_tree_snaps/tree_snap_061.webp"),
  require("../../extracted_tree_snaps/tree_snap_062.webp"),
  require("../../extracted_tree_snaps/tree_snap_063.webp"),
  require("../../extracted_tree_snaps/tree_snap_064.webp"),
  require("../../extracted_tree_snaps/tree_snap_065.webp"),
  require("../../extracted_tree_snaps/tree_snap_066.webp"),
  require("../../extracted_tree_snaps/tree_snap_067.webp"),
  require("../../extracted_tree_snaps/tree_snap_068.webp"),
  require("../../extracted_tree_snaps/tree_snap_069.webp"),
  require("../../extracted_tree_snaps/tree_snap_070.webp"),
  require("../../extracted_tree_snaps/tree_snap_071.webp"),
  require("../../extracted_tree_snaps/tree_snap_072.webp"),
  require("../../extracted_tree_snaps/tree_snap_073.webp"),
  require("../../extracted_tree_snaps/tree_snap_074.webp"),
  require("../../extracted_tree_snaps/tree_snap_075.webp"),
  require("../../extracted_tree_snaps/tree_snap_076.webp"),
  require("../../extracted_tree_snaps/tree_snap_077.webp"),
  require("../../extracted_tree_snaps/tree_snap_078.webp"),
  require("../../extracted_tree_snaps/tree_snap_079.webp"),
  require("../../extracted_tree_snaps/tree_snap_080.webp"),
  require("../../extracted_tree_snaps/tree_snap_081.webp"),
  require("../../extracted_tree_snaps/tree_snap_082.webp"),
  require("../../extracted_tree_snaps/tree_snap_083.webp"),
  require("../../extracted_tree_snaps/tree_snap_084.webp"),
  require("../../extracted_tree_snaps/tree_snap_085.webp"),
  require("../../extracted_tree_snaps/tree_snap_086.webp"),
  require("../../extracted_tree_snaps/tree_snap_087.webp"),
  require("../../extracted_tree_snaps/tree_snap_088.webp"),
  require("../../extracted_tree_snaps/tree_snap_089.webp"),
  require("../../extracted_tree_snaps/tree_snap_090.webp"),
  require("../../extracted_tree_snaps/tree_snap_091.webp"),
  require("../../extracted_tree_snaps/tree_snap_092.webp"),
  require("../../extracted_tree_snaps/tree_snap_093.webp"),
  require("../../extracted_tree_snaps/tree_snap_094.webp"),
  require("../../extracted_tree_snaps/tree_snap_095.webp"),
  require("../../extracted_tree_snaps/tree_snap_096.webp"),
  require("../../extracted_tree_snaps/tree_snap_097.webp"),
  require("../../extracted_tree_snaps/tree_snap_098.webp"),
  require("../../extracted_tree_snaps/tree_snap_099.webp"),
  require("../../extracted_tree_snaps/tree_snap_100.webp")
];

// ─── Build stage metadata ─────────────────────────────────────────────────────
export const TREE_STAGES = TREE_STAGE_IMAGES.map((image, index) => {
  const stageNumber = index + 1;
  const minLevel    = index * LEVELS_PER_TREE_STAGE;
  const maxLevel    = minLevel + LEVELS_PER_TREE_STAGE - 1;

  return {
    id:          `stage_${String(stageNumber).padStart(3, "0")}`,
    stageNumber,
    minLevel,
    maxLevel,
    label:       `Tree Stage ${stageNumber}`,
    detail:      `Level ${minLevel}`,
    image,
    imageScale:  1   // extracted snaps fill the frame — no extra whitespace
  };
});

// ─── Lookup helper ────────────────────────────────────────────────────────────
export const getTreeStage = (level) => {
  const value = Number.isFinite(level) ? level : 0;

  // Clamp to last stage if the player maxes out
  const index = Math.min(
    Math.floor(value / LEVELS_PER_TREE_STAGE),
    TREE_STAGES.length - 1
  );

  return TREE_STAGES[Math.max(0, index)];
};
