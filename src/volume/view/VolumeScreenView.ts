import { roundSymmetric, Vector2 } from "scenerystack/dot";
import type { ScreenViewOptions } from "scenerystack/sim";
import {
  addPlotDrag,
  addPlotKeyboardDrag,
  choice,
  computed,
  dot,
  format,
  LabView,
  line,
  PlotCanvas,
  plotLabel,
  slider,
} from "../../common/LabView.js";
import { EXACT_VOLUME, roof, volumeCells, volumeEstimate } from "../../common/model/IntegralMath.js";
import { orthographic } from "../../common/Projection.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VolumeModel } from "../model/VolumeModel.js";

type Point3 = readonly [number, number, number];
const DEGREES_PER_PIXEL = 0.3;
// After a flick the solid keeps turning, losing speed at this rate (1/s), and stops below the minimum.
const SPIN_FRICTION = 4;
const MIN_SPIN_SPEED = 3; // degrees per second
const MIN_FLICK_SPEED = 20; // degrees per second

/**
 * A double-headed arc around the front of the base, fixed to the viewer like a turntable
 * ring, so touch users (who never see a cursor) can tell the view turns when dragged.
 */
function drawTurntable(
  context: CanvasRenderingContext2D,
  yawDegrees: number,
  xy: (point: Point3) => readonly [number, number],
  color: string,
): void {
  const yaw = (yawDegrees * Math.PI) / 180;
  const front = Math.atan2(-Math.cos(yaw), Math.sin(yaw));
  const arc = Array.from({ length: 41 }, (_, i) => {
    const angle = front + ((i - 20) / 20) * (Math.PI / 3);
    return xy([0.5 + 0.9 * Math.cos(angle), 0.5 + 0.9 * Math.sin(angle), 0]);
  });
  context.globalAlpha = 0.55;
  line(context, arc, color, 2);
  for (const [tip, before] of [
    [arc[0], arc[3]],
    [arc[arc.length - 1], arc[arc.length - 4]],
  ] as const) {
    if (tip && before) {
      const angle = Math.atan2(tip[1] - before[1], tip[0] - before[0]);
      const wing = (side: number): readonly [number, number] => [
        tip[0] - 11 * Math.cos(angle + side * 0.45),
        tip[1] - 11 * Math.sin(angle + side * 0.45),
      ];
      line(context, [wing(1), tip, wing(-1)], color, 2);
    }
  }
  context.globalAlpha = 1;
}

export class VolumeScreenView extends LabView {
  public constructor(model: VolumeModel, options?: ScreenViewOptions) {
    const manager = StringManager.getInstance();
    const { controls: s, screenSummary } = manager.getVolumeA11yStrings();
    const { countProperty, samplingProperty, rotationProperty, properties } = model;
    const cells = () => volumeCells(countProperty.value, samplingProperty.value);
    const samplingName = computed(
      [samplingProperty, s.midpointStringProperty, s.upperRightStringProperty],
      () => (samplingProperty.value === "midpoint" ? s.midpointStringProperty : s.upperRightStringProperty).value,
    );
    const estimate = computed(properties, () => `Σ f(xᵢ, yⱼ) ΔA ≈ ${format(volumeEstimate(cells()), 5)}`);
    const error = computed(properties, () => `ΔV = ${format(volumeEstimate(cells()) - EXACT_VOLUME, 5)}`);
    const details = computed(
      [estimate, error, countProperty, samplingName],
      () =>
        `${format(countProperty.value)} × ${format(countProperty.value)}. ${samplingName.value}. ${estimate.value}. V = 5/3. ${error.value}.`,
    );
    const plot = new PlotCanvas(properties, (context, colors) => {
      const project = orthographic(rotationProperty.value, 27, 122, [369, 355]);
      const floor: Point3[] = [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ];
      const xy = ([x, y, z]: Point3) => project([x, y, z * 0.75]).point;
      drawTurntable(context, rotationProperty.value, xy, colors.ink);
      line(context, [...floor, floor[0] as Point3].map(xy), colors.ink, 2);
      const boxSize = 1 / countProperty.value;
      const faces = cells().flatMap(({ x, y, height, sampleX, sampleY }) => {
        const a: Point3 = [x, y, 0];
        const b: Point3 = [x + boxSize, y, 0];
        const c: Point3 = [x + boxSize, y + boxSize, 0];
        const d: Point3 = [x, y + boxSize, 0];
        const raised = ([u, v]: Point3): Point3 => [u, v, height];
        return [
          {
            corners: [raised(a), raised(b), raised(c), raised(d)],
            fill: colors.accent,
            sample: raised([sampleX, sampleY, 0]),
          },
          { corners: [a, b, raised(b), raised(a)], fill: colors.ink },
          { corners: [b, c, raised(c), raised(b)], fill: colors.ink },
          { corners: [c, d, raised(d), raised(c)], fill: colors.ink },
          { corners: [a, d, raised(d), raised(a)], fill: colors.ink },
        ].map((face) => ({
          ...face,
          depth:
            face.corners.reduce((total, p) => total + project([p[0], p[1], p[2] * 0.75]).depth, 0) /
            face.corners.length,
        }));
      });
      faces.sort((a, b) => a.depth - b.depth);
      for (const face of faces) {
        context.globalAlpha = face.sample ? 0.72 : 0.19;
        line(context, face.corners.map(xy), colors.background, 1, face.fill);
        context.globalAlpha = 1;
        if (face.sample) {
          dot(context, xy(face.sample), colors.background, countProperty.value > 8 ? 1.3 : 2.3);
        }
      }

      // The actual roof is the orange wireframe, independent of the estimates.
      context.globalAlpha = 0.82;
      for (let i = 0; i <= 4; i++) {
        for (const swap of [false, true]) {
          const curve = Array.from({ length: 25 }, (_, j) => {
            const x = swap ? j / 24 : i / 4;
            const y = swap ? i / 4 : j / 24;
            return xy([x, y, roof(x, y)]);
          });
          line(context, curve, colors.alternate, 1.35);
        }
      }
      context.globalAlpha = 1;
      // A floor plan shows the selected sample in each cell without occlusion.
      const insetLeft = 39;
      const insetBottom = 314;
      const insetSize = 155;
      const fromAbove = (x: number, y: number): readonly [number, number] => [
        insetLeft + x * insetSize,
        insetBottom - y * insetSize,
      ];
      for (let i = 0; i <= countProperty.value; i++) {
        const coordinate = i / countProperty.value;
        line(context, [fromAbove(0, coordinate), fromAbove(1, coordinate)], colors.ink);
        line(context, [fromAbove(coordinate, 0), fromAbove(coordinate, 1)], colors.ink);
      }
      const sampleColor = colors.accent;
      for (const sample of cells()) {
        dot(context, fromAbove(sample.sampleX, sample.sampleY), sampleColor, countProperty.value > 8 ? 2 : 3);
      }
      plotLabel(context, "x", fromAbove(1.06, 0), colors.ink);
      plotLabel(context, "y", fromAbove(0, 1.06), colors.ink);
      plotLabel(context, "z = 1 + x² + y²", [16, 25], colors.alternate);
      plotLabel(context, "x", xy([1.2, 0, 0]), colors.ink);
      plotLabel(context, "y", xy([0, 1.14, 0]), colors.ink);
    });
    // The drag's speed, measured each frame from the rotation it produced, carries
    // on after release. `angle` keeps the fractional rotation between frames.
    const spin = { dragging: false, velocity: 0, angle: rotationProperty.value, sampled: rotationProperty.value };
    // Drag sideways anywhere on the view to turn the solid.
    let grabX = 0;
    let grabRotation = 0;
    const dragSurface = addPlotDrag(
      plot,
      "ew-resize",
      (x, _y, start) => {
        if (start) {
          grabX = x;
          grabRotation = rotationProperty.value;
          spin.dragging = true;
          spin.velocity = 0;
        } else {
          // Dragging right turns the near corner to the right, which lowers the yaw.
          const next = roundSymmetric(grabRotation - (x - grabX) * DEGREES_PER_PIXEL);
          rotationProperty.value = rotationProperty.range.constrainValue(next);
        }
      },
      () => {
        spin.dragging = false;
        spin.angle = rotationProperty.value;
        if (Math.abs(spin.velocity) < MIN_FLICK_SPEED) {
          spin.velocity = 0;
        }
      },
    );
    addPlotKeyboardDrag(dragSurface, s.rotateSolidStringProperty, {
      keyboardDragDirection: "leftRight",
      dragDelta: 5,
      shiftDragDelta: 1,
      positionProperty: {
        get value() {
          return new Vector2(-rotationProperty.value, 0);
        },
        set value(position: Vector2) {
          spin.velocity = 0;
          rotationProperty.value = rotationProperty.range.constrainValue(-position.x);
        },
      },
    });
    super(
      {
        title: manager.getScreenNames().volumeStringProperty,
        summary: screenSummary,
        details,
        plot,
        controls: [
          slider(s.countStringProperty, countProperty, 1),
          choice(s.samplingStringProperty, samplingName, () => {
            samplingProperty.value = samplingProperty.value === "midpoint" ? "upperRight" : "midpoint";
          }),
          slider(s.rotationStringProperty, rotationProperty, 5, "°"),
        ],
        readouts: [estimate, "V = 5/3 ≈ 1.66667", error, "ΔV = Σ f(xᵢ, yⱼ) ΔA − V"],
        reset: () => model.reset(),
      },
      options,
    );
    this.spin = (dt) => {
      const rotation = rotationProperty.value;
      if (spin.dragging) {
        // Smooth over a few frames so a release keeps the drag's momentum.
        spin.velocity = 0.6 * spin.velocity + (0.4 * (rotation - spin.sampled)) / dt;
      } else if (spin.velocity !== 0) {
        if (roundSymmetric(spin.angle) !== rotation) {
          // The slider or Reset All moved the solid: let it win.
          spin.velocity = 0;
        } else {
          spin.velocity *= Math.exp(-SPIN_FRICTION * dt);
          spin.angle += spin.velocity * dt;
          const range = rotationProperty.range;
          if (Math.abs(spin.velocity) < MIN_SPIN_SPEED || !range.contains(spin.angle)) {
            spin.angle = range.constrainValue(spin.angle);
            spin.velocity = 0;
          }
          rotationProperty.value = roundSymmetric(spin.angle);
        }
      }
      spin.sampled = rotationProperty.value;
    };
  }

  private readonly spin: (dt: number) => void;

  public override step(dt: number): void {
    if (dt > 0) {
      this.spin(dt);
    }
  }
}
