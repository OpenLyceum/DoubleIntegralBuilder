import { BooleanProperty, NumberProperty, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import {
  type Integrand,
  integrands,
  outerRange,
  type RegionId,
  regions,
  type Sweep,
} from "../../common/model/IntegralMath.js";
import { SWEEP_SECONDS } from "../../DoubleIntegralBuilderConstants.js";

/**
 * A region, an integrand, and a slice that sweeps across the region. The slice position is a
 * fraction of the outer variable's range, so it stays inside the region for every choice.
 */
export class BoundsModel implements TModel {
  public readonly regionProperty = new StringUnionProperty<RegionId>("parabolaLine", { validValues: regions });
  public readonly integrandProperty = new StringUnionProperty<Integrand>("one", { validValues: integrands });
  public readonly sweepProperty = new StringUnionProperty<Sweep>("horizontal", {
    validValues: ["horizontal", "vertical"],
  });
  public readonly fractionProperty = new NumberProperty(0.45, { range: new Range(0, 1) });
  public readonly playingProperty = new BooleanProperty(false);
  public readonly properties = [
    this.regionProperty,
    this.integrandProperty,
    this.sweepProperty,
    this.fractionProperty,
    this.playingProperty,
  ] as const;

  /** The slice's outer coordinate: y for a horizontal slice, x for a vertical one. */
  public get outer(): number {
    const [from, to] = outerRange(this.regionProperty.value, this.sweepProperty.value);
    return from + this.fractionProperty.value * (to - from);
  }

  /** Starts a sweep from the beginning of the region. */
  public sweep(): void {
    this.fractionProperty.value = 0;
    this.playingProperty.value = true;
  }

  public step(dt: number): void {
    if (this.playingProperty.value) {
      const next = Math.min(1, this.fractionProperty.value + dt / SWEEP_SECONDS);
      this.fractionProperty.value = next;
      if (next === 1) {
        this.playingProperty.value = false;
      }
    }
  }

  public reset(): void {
    for (const property of this.properties) {
      property.reset();
    }
  }

  public dispose(): void {
    for (const property of this.properties) {
      property.dispose();
    }
  }
}
