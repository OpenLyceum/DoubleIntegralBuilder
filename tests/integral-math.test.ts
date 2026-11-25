import { describe, expect, it } from "vitest";
import { BoundsModel } from "../src/bounds/model/BoundsModel.js";
import {
  accumulated,
  evaluate,
  exactVolume,
  innerIntegral,
  integrands,
  notation,
  outerRange,
  regions,
  type Sweep,
  sliceBounds,
  total,
  volumeCells,
  volumeEstimate,
} from "../src/common/model/IntegralMath.js";

describe("volume columns", () => {
  it("uses the chosen sample point in each column", () => {
    const [first] = volumeCells(2, 2, "upperRight");
    expect([first?.sampleX, first?.sampleY]).toEqual([0.5, 0.5]);
    expect(volumeCells(2, 2, "midpoint")[0]?.height).toBe(1.125);
    const [lowerLeft] = volumeCells(3, 2, "lowerLeft");
    expect([lowerLeft?.sampleX, lowerLeft?.sampleY, lowerLeft?.width, lowerLeft?.depth]).toEqual([0, 0, 1 / 3, 0.5]);
  });

  it("matches each integrand's exact volume and converges from both sides", () => {
    for (const integrand of integrands) {
      // A fine midpoint sum is accurate to O(h²).
      expect(volumeEstimate(volumeCells(200, 200, "midpoint", integrand))).toBeCloseTo(exactVolume(integrand), 4);
    }
    const exact = exactVolume("paraboloid");
    expect(volumeEstimate(volumeCells(4, 4, "upperRight"))).toBeGreaterThan(exact);
    expect(volumeEstimate(volumeCells(4, 4, "lowerLeft"))).toBeLessThan(exact);
    const error = (n: number) => Math.abs(volumeEstimate(volumeCells(n, n, "midpoint")) - exact);
    // The midpoint rule is second order: doubling n quarters the error.
    expect(error(4) / error(8)).toBeCloseTo(4, 1);
  });
});

describe("iterated integrals", () => {
  const areas = { parabolaLine: 7 / 6, triangle: 1 / 2, lens: 1 / 3, quarterDisk: Math.PI / 4 } as const;

  it("gives each region's area in both orders", () => {
    for (const region of regions) {
      for (const sweep of ["horizontal", "vertical"] as const satisfies readonly Sweep[]) {
        expect(total(region, sweep, "one")).toBeCloseTo(areas[region], 3);
      }
    }
  });

  it("integrates the same function to the same value in both orders", () => {
    for (const region of regions) {
      for (const integrand of integrands) {
        expect(total(region, "horizontal", integrand)).toBeCloseTo(total(region, "vertical", integrand), 3);
      }
    }
  });

  it("switches the vertical bounds at x = 1 and writes two pieces", () => {
    expect(sliceBounds("parabolaLine", "vertical", 0.25)).toEqual([0, 0.5]);
    expect(sliceBounds("parabolaLine", "vertical", 1.5)).toEqual([0, 0.5]);
    expect(sliceBounds("parabolaLine", "horizontal", 0.5)).toEqual([0.25, 1.5]);
    expect(notation("parabolaLine", "vertical").split("+")).toHaveLength(2);
    expect(notation("parabolaLine", "horizontal")).toContain("dx dy");
    expect(outerRange("parabolaLine", "vertical")).toEqual([0, 2]);
  });

  it("accumulates the inner integral up to the slice", () => {
    // Triangle 0 ≤ y ≤ x ≤ 1 with f = 1: vertical slices have length x, so the swept area is x²/2.
    expect(innerIntegral("triangle", "vertical", "one", 0.6)).toBeCloseTo(0.6, 10);
    expect(accumulated("triangle", "vertical", "one", 0.6)).toBeCloseTo(0.18, 8);
    expect(evaluate("product", 0.5, 0.5)).toBe(1);
  });

  it("keeps the slice inside the region and sweeps across it", () => {
    const model = new BoundsModel();
    model.regionProperty.value = "triangle";
    model.sweepProperty.value = "vertical";
    model.fractionProperty.value = 1;
    expect(model.outer).toBe(1);
    model.sweep();
    expect(model.fractionProperty.value).toBe(0);
    model.step(2);
    expect(model.fractionProperty.value).toBeCloseTo(0.5, 10);
    model.step(10);
    expect(model.playingProperty.value).toBe(false);
    model.dispose();
  });
});
