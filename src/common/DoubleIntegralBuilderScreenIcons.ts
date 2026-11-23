import { Shape } from "scenerystack/kite";
import { Node, Path, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import Colors from "../DoubleIntegralBuilderColors.js";

const WIDTH = 548;
const HEIGHT = 373;

function iconFrom(...paths: string[]): ScreenIcon {
  const background = new Rectangle(0, 0, WIDTH, HEIGHT, { fill: Colors.panelBackgroundColorProperty });
  const graphic = paths.map(
    (path, index) =>
      new Path(new Shape(path), {
        stroke: index === 0 ? Colors.accentColorProperty : Colors.secondaryPlotColorProperty,
        lineWidth: 12,
        lineJoin: "round",
        lineCap: "round",
      }),
  );
  return new ScreenIcon(new Node({ children: [background, ...graphic] }), {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: Colors.backgroundColorProperty,
  });
}

export function createVolumeIcon(): ScreenIcon {
  return iconFrom(
    "M100 278 L100 187 L193 165 L193 256 Z M193 165 L193 128 L286 106 L286 234 M286 106 L286 67 L379 45 L379 213 L100 278",
    "M100 187 L174 207 L451 142 L379 120 M174 207 L174 302 L451 238 L451 142 M100 278 L174 302 M286 181 L286 276 M368 163 L368 257",
  );
}

export function createBoundsIcon(): ScreenIcon {
  return iconFrom(
    "M104 305 Q136 150 285 54 L442 305 Z",
    "M133 243 L400 243 M161 181 L357 181 M203 119 L317 119",
    "M104 319 L445 319 M90 306 L90 60",
  );
}
