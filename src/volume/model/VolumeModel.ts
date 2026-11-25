import { NumberProperty, StringUnionProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { type Integrand, integrands, type Sampling, samplings } from "../../common/model/IntegralMath.js";
import { DEFAULT_COLUMNS, DEFAULT_ROWS, GRID_COUNT_MAX, GRID_COUNT_MIN } from "../../DoubleIntegralBuilderConstants.js";

/** Columns under z = f(x, y) over the unit square: m × n of them, each sampled at one point. */
export class VolumeModel implements TModel {
  public readonly integrandProperty = new StringUnionProperty<Integrand>("paraboloid", { validValues: integrands });
  public readonly columnsProperty = new NumberProperty(DEFAULT_COLUMNS, {
    range: new Range(GRID_COUNT_MIN, GRID_COUNT_MAX),
  });
  public readonly rowsProperty = new NumberProperty(DEFAULT_ROWS, {
    range: new Range(GRID_COUNT_MIN, GRID_COUNT_MAX),
  });
  public readonly samplingProperty = new StringUnionProperty<Sampling>("midpoint", { validValues: samplings });
  public readonly rotationProperty = new NumberProperty(-35, { range: new Range(-75, 10) });
  public readonly properties = [
    this.integrandProperty,
    this.columnsProperty,
    this.rowsProperty,
    this.samplingProperty,
    this.rotationProperty,
  ] as const;

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
