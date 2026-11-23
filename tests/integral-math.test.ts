import { describe, expect, it } from "vitest";
import {
  EXACT_AREA,
  EXACT_VOLUME,
  sliceBounds,
  volumeCells,
  volumeEstimate,
} from "../src/common/model/IntegralMath.js";

describe("double integrals", () => {
  it("uses the chosen sample point in each square column", () => {
    expect(volumeCells(2, "midpoint")[0]).toMatchObject({ x: 0, y: 0, sampleX: 0.25, sampleY: 0.25, height: 1.125 });
    expect(volumeCells(2, "upperRight")[0]).toMatchObject({ x: 0, y: 0, sampleX: 0.5, sampleY: 0.5, height: 1.5 });
  });

  it("converges toward the exact volume from opposite sides", () => {
    for (const count of [2, 4, 12]) {
      const midpoint = volumeEstimate(volumeCells(count, "midpoint"));
      const upperRight = volumeEstimate(volumeCells(count, "upperRight"));
      expect(midpoint).toBeCloseTo(EXACT_VOLUME - 1 / (6 * count ** 2), 12);
      expect(upperRight).toBeCloseTo(EXACT_VOLUME + 1 / count + 1 / (3 * count ** 2), 12);
    }
  });

  it("sweeps the same area in both orders and switches boundaries at x = 1", () => {
    expect(sliceBounds("horizontal", 0.5)).toEqual([0.25, 1.5]);
    expect(sliceBounds("vertical", 0.25)).toEqual([0, 0.5]);
    expect(sliceBounds("vertical", 1)).toEqual([0, 1]);
    expect(sliceBounds("vertical", 1.75)).toEqual([0, 0.25]);
    const count = 10000;
    for (const [direction, span] of [
      ["horizontal", 1],
      ["vertical", 2],
    ] as const) {
      let area = 0;
      for (let i = 0; i < count; i++) {
        const [lower, upper] = sliceBounds(direction, ((i + 0.5) * span) / count);
        area += ((upper - lower) * span) / count;
      }
      expect(area).toBeCloseTo(EXACT_AREA, 6);
    }
  });
});
