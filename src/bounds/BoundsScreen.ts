/**
 * BoundsScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createBoundsIcon() in src/common/DoubleIntegralBuilderScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createBoundsIcon } from "../common/DoubleIntegralBuilderScreenIcons.js";
import DoubleIntegralBuilderColors from "../DoubleIntegralBuilderColors.js";
import { BoundsModel } from "./model/BoundsModel.js";
import { BoundsKeyboardHelpContent } from "./view/BoundsKeyboardHelpContent.js";
import { BoundsScreenView } from "./view/BoundsScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type BoundsScreenOptions = ScreenOptions & { tandem: Tandem };

export class BoundsScreen extends Screen<BoundsModel, BoundsScreenView> {
  public constructor(options: BoundsScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new BoundsModel(),
      // View factory — receives the model instance
      (model) =>
        new BoundsScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<BoundsScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: DoubleIntegralBuilderColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new BoundsKeyboardHelpContent(),
          homeScreenIcon: createBoundsIcon(),
          navigationBarIcon: createBoundsIcon(),
        },
        options,
      ),
    );
  }
}
