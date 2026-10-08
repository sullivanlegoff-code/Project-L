/** Presentation only. Never persisted; logical cells and economy remain unchanged. */
export const VISUAL = {
  grid: {originX: 120, originY: 120, width: 176, depth: 148, columns: 6, rows: 2},
  rabbit: {scale: 1.3, hitRadius: 27, crowdedOffsets: [{x: -52, y: -28}, {x: 0, y: -28}, {x: 52, y: -28}, {x: -27, y: 10}, {x: 27, y: 10}, {x: -49, y: 47}, {x: 49, y: 47}], offsets: [{x: -37, y: -4}, {x: 34, y: -4}, {x: 0, y: 30}]},
  camera: {minZoom: .8, maxZoom: 1.65, initialZoom: 1.05, focusX: 1.5, focusY: 1,
    marginX: 300, marginY: 160, hudHeight: 70, compactHudHeight: 62, portraitHudHeight: 122},
} as const;
