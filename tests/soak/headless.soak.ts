/**
 * By-hand headless soak: npm run test:soak:headless (never in CI).
 *
 * List the screens exactly as main.ts builds them. The harness in
 * tests/helpers/headlessSoak.ts (template-owned) presses every control, sets every slider,
 * steps, switches screens, flips the color profile and locale, presses Reset All, and
 * fails when listener counts, node counts or retained heap rise after every round.
 *
 * Add `actions` for what only this sim can do (record/clear, add/remove objects) and
 * `exclude` for controls that must not be pressed headless.
 */

import { StringProperty } from "scenerystack/axon";
import { Tandem } from "scenerystack/tandem";
import { BoundsScreen } from "../../src/bounds/BoundsScreen.js";
import DoubleIntegralBuilderColors from "../../src/DoubleIntegralBuilderColors.js";
import { VolumeScreen } from "../../src/volume/VolumeScreen.js";
import { describeHeadlessSoak } from "../helpers/headlessSoak.js";

describeHeadlessSoak({
  screens: () => [
    new VolumeScreen({ name: new StringProperty("Volume"), tandem: Tandem.OPT_OUT }),
    new BoundsScreen({ name: new StringProperty("Bounds"), tandem: Tandem.OPT_OUT }),
  ],
  tracked: () => ({ DoubleIntegralBuilderColors }),
});
