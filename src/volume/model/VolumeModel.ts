import { NumberProperty, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";

export class VolumeModel implements TModel {
  public readonly countProperty = new NumberProperty(4, { range: new Range(2, 12) });
  public readonly samplingProperty = new StringUnionProperty<"midpoint" | "upperRight">("midpoint", {
    validValues: ["midpoint", "upperRight"],
  });
  public readonly rotationProperty = new NumberProperty(-35, { range: new Range(-75, 10) });
  public readonly properties = [this.countProperty, this.samplingProperty, this.rotationProperty] as const;

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
