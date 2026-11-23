/**
 * DoubleIntegralBuilderPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Keep this empty shell until the sim needs real preferences; the
 * empty until the sim needs a preference.
 */
import DoubleIntegralBuilderNamespace from "../DoubleIntegralBuilderNamespace.js";
import "./doubleIntegralBuilderQueryParameters.js";

export class DoubleIntegralBuilderPreferencesModel {
  // Pattern for a preference (skill: scenerystack-preferences). Every preference is
  // one chain: query parameter → Property here → label in every strings_*.json →
  // control in DoubleIntegralBuilderPreferencesNode → reset() below.
  //
  //   import { BooleanProperty } from "scenerystack/axon";
  //   import doubleIntegralBuilderQueryParameters from "./doubleIntegralBuilderQueryParameters.js"; // replaces the bare import
  //
  //   public readonly showGridProperty: BooleanProperty;
  //
  //   // in the constructor (rename _tandem → tandem):
  //   this.showGridProperty = new BooleanProperty(
  //     doubleIntegralBuilderQueryParameters.showGrid,
  //     tandem ? { tandem: tandem.createTandem("showGridProperty") } : undefined,
  //   );
  //
  //   // in reset():
  //   this.showGridProperty.reset();

  public reset(): void {
    // No sim-specific preferences yet.
  }
}

DoubleIntegralBuilderNamespace.register("DoubleIntegralBuilderPreferencesModel", DoubleIntegralBuilderPreferencesModel);
