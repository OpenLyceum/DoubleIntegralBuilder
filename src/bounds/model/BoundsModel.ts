import { NumberProperty, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";

export class BoundsModel implements TModel {
  public readonly sweepProperty = new StringUnionProperty<"horizontal" | "vertical">("horizontal", {
    validValues: ["horizontal", "vertical"],
  });
  public readonly yProperty = new NumberProperty(0.45, { range: new Range(0, 1) });
  public readonly xProperty = new NumberProperty(0.75, { range: new Range(0, 2) });
  public readonly properties = [this.sweepProperty, this.yProperty, this.xProperty] as const;

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
