/**
 * DoubleIntegralBuilderPanel.ts
 *
 * A pre-themed Panel that automatically uses DoubleIntegralBuilderColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { DoubleIntegralBuilderPanel } from "../../common/DoubleIntegralBuilderPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new DoubleIntegralBuilderPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new DoubleIntegralBuilderPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new DoubleIntegralBuilderPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import DoubleIntegralBuilderColors from "../DoubleIntegralBuilderColors.js";
import { PANEL_CORNER_RADIUS } from "../DoubleIntegralBuilderConstants.js";

/** @public */
export type DoubleIntegralBuilderPanelOptions = PanelOptions;

/** Pre-themed Panel wrapper for control panels and info boxes. @public */
export class DoubleIntegralBuilderPanel extends Panel {
  public constructor(content: Node, providedOptions?: DoubleIntegralBuilderPanelOptions) {
    const options = optionize<DoubleIntegralBuilderPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: DoubleIntegralBuilderColors.panelBackgroundColorProperty,
        stroke: DoubleIntegralBuilderColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}
