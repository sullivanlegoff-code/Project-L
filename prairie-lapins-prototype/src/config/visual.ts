/** Presentation only. Never persisted; logical cells and economy remain unchanged. */
export const VISUAL = {
  grid: {originX: 120, originY: 120, width: 176, depth: 148, columns: 6, rows: 2},
  rabbit: {
    scale: 1.3, hitRadius: 27, motion: {x: 3, y: 1.5, hop: 5},
    offsets: [{x: -37, y: -4}, {x: 34, y: -4}, {x: 0, y: 30}],
    fourOffsets: [{x: -31, y: -8}, {x: 31, y: -8}, {x: -31, y: 32}, {x: 31, y: 32}],
    fiveOffsets: [{x: -49, y: -10}, {x: 0, y: -10}, {x: 49, y: -10}, {x: -27, y: 32}, {x: 27, y: 32}],
    sixOffsets: [{x: -49, y: -8}, {x: 0, y: -8}, {x: 49, y: -8}, {x: -49, y: 34}, {x: 0, y: 34}, {x: 49, y: 34}],
    crowdedOffsets: [{x: -50, y: -17}, {x: 0, y: -17}, {x: 50, y: -17}, {x: -25, y: 9}, {x: 25, y: 9}, {x: -48, y: 34}, {x: 48, y: 34}],
  },
  camera: {minZoom: .8, maxZoom: 1.65, initialZoom: 1.05, focusX: 1.5, focusY: 1,
    marginX: 300, marginY: 160, hudHeight: 70, compactHudHeight: 62, portraitHudHeight: 122},
} as const;
