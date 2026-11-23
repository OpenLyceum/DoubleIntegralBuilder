/**
 * VolumeScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createVolumeIcon() in src/common/DoubleIntegralBuilderScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createVolumeIcon } from "../common/DoubleIntegralBuilderScreenIcons.js";
import DoubleIntegralBuilderColors from "../DoubleIntegralBuilderColors.js";
import { VolumeModel } from "./model/VolumeModel.js";
import { VolumeKeyboardHelpContent } from "./view/VolumeKeyboardHelpContent.js";
import { VolumeScreenView } from "./view/VolumeScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type VolumeScreenOptions = ScreenOptions & { tandem: Tandem };

export class VolumeScreen extends Screen<VolumeModel, VolumeScreenView> {
  public constructor(options: VolumeScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new VolumeModel(),
      // View factory — receives the model instance
      (model) =>
        new VolumeScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<VolumeScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: DoubleIntegralBuilderColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VolumeKeyboardHelpContent(),
          homeScreenIcon: createVolumeIcon(),
          navigationBarIcon: createVolumeIcon(),
        },
        options,
      ),
    );
  }
}
