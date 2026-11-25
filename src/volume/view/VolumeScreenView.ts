import { roundSymmetric, Vector2 } from "scenerystack/dot";
import { Node } from "scenerystack/scenery";
import type { ScreenViewOptions } from "scenerystack/sim";
import {
  addPlotDrag,
  addPlotKeyboardDrag,
  comboBox,
  computed,
  dot,
  format,
  LabView,
  line,
  PlotCanvas,
  plotLabel,
  slider,
} from "../../common/LabView.js";
import {
  evaluate,
  exactVolume,
  type Integrand,
  integrandLabel,
  integrands,
  type Sampling,
  samplings,
  volumeCells,
  volumeEstimate,
} from "../../common/model/IntegralMath.js";
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

const superscripts: Record<string, string> = { "2": "²", "3": "³" };
/** Plain text for the canvas: <sup>2</sup> becomes ², other tags are dropped. */
function canvasText(markup: string): string {
  return markup
    .replace(/<sup>([^<]*)<\/sup>/g, (_, power: string) => superscripts[power] ?? `^${power}`)
    .replace(/<[^>]+>/g, "");
}

/** A floor plan in the lower left that shows the sample point of every cell without occlusion. */
function drawFloorPlan(
  context: CanvasRenderingContext2D,
  colors: { ink: string; accent: string },
  cells: ReturnType<typeof volumeCells>,
  columns: number,
  rows: number,
  crowded: boolean,
): void {
  const insetLeft = 39;
  const insetBottom = 314;
  const insetSize = 155;
  const fromAbove = (x: number, y: number): readonly [number, number] => [
    insetLeft + x * insetSize,
    insetBottom - y * insetSize,
  ];
  for (let i = 0; i <= rows; i++) {
    line(context, [fromAbove(0, i / rows), fromAbove(1, i / rows)], colors.ink);
  }
  for (let i = 0; i <= columns; i++) {
    line(context, [fromAbove(i / columns, 0), fromAbove(i / columns, 1)], colors.ink);
  }
  for (const sample of cells) {
    dot(context, fromAbove(sample.sampleX, sample.sampleY), colors.accent, crowded ? 2 : 3);
  }
  plotLabel(context, "x", fromAbove(1.06, 0), colors.ink);
  plotLabel(context, "y", fromAbove(0, 1.06), colors.ink);
}

/** The largest value of f on the unit square, sampled on a grid, for scaling heights. */
function roofHeight(integrand: Integrand): number {
  let top = 0;
  for (let i = 0; i <= 20; i++) {
    for (let j = 0; j <= 20; j++) {
      top = Math.max(top, Math.abs(evaluate(integrand, i / 20, j / 20)));
    }
  }
  return Math.max(top, 1e-6);
}

/**
 * |error| against n for n × n columns with the current sample point, on log–log axes in the
 * top-right corner: the midpoint rule falls twice as steeply as a corner rule.
 */
function drawErrorInset(
  context: CanvasRenderingContext2D,
  colors: { ink: string; accent: string; grid: string },
  integrand: Integrand,
  sampling: Sampling,
  columns: number,
  rows: number,
  title: string,
): void {
  const box = { left: 62, right: 205, top: 48, bottom: 128 };
  const counts = Array.from({ length: 12 }, (_, i) => i + 1);
  const errors = counts.map((n) =>
    Math.log10(
      Math.max(1e-12, Math.abs(volumeEstimate(volumeCells(n, n, sampling, integrand)) - exactVolume(integrand))),
    ),
  );
  const low = Math.floor(Math.min(...errors, -1));
  const high = Math.ceil(Math.max(...errors, 0));
  const px = (n: number) => box.left + ((box.right - box.left) * Math.log(n)) / Math.log(12);
  const py = (value: number) => box.bottom - ((box.bottom - box.top) * (value - low)) / Math.max(1, high - low);
  line(
    context,
    [
      [box.left, box.top],
      [box.left, box.bottom],
      [box.right, box.bottom],
    ],
    colors.ink,
    1,
  );
  line(
    context,
    counts.map((n, i) => [px(n), py(errors[i] ?? 0)] as const),
    colors.accent,
    2,
  );
  if (columns === rows) {
    dot(context, [px(columns), py(errors[columns - 1] ?? 0)], colors.accent, 5);
  }
  plotLabel(context, title, [box.left - 4, box.top - 10], colors.ink);
  plotLabel(context, `1e${high}`, [box.left - 40, box.top + 4], colors.ink);
  plotLabel(context, `1e${low}`, [box.left - 40, box.bottom], colors.ink);
  plotLabel(context, "n = 1", [box.left - 6, box.bottom + 15], colors.ink);
  plotLabel(context, "12", [box.right - 12, box.bottom + 15], colors.ink);
}

export class VolumeScreenView extends LabView {
  public constructor(model: VolumeModel, options?: ScreenViewOptions) {
    const manager = StringManager.getInstance();
    const { controls: s, screenSummary } = manager.getVolumeA11yStrings();
    const { integrandProperty, columnsProperty, rowsProperty, samplingProperty, rotationProperty, properties } = model;
    const cells = () =>
      volumeCells(columnsProperty.value, rowsProperty.value, samplingProperty.value, integrandProperty.value);
    const exact = () => exactVolume(integrandProperty.value);
    const samplingName = computed([samplingProperty], () => s[`${samplingProperty.value}StringProperty`].value);
    const estimate = computed(
      properties,
      () => `Σ f(x<sub>i</sub>*, y<sub>j</sub>*) ΔA ≈ ${format(volumeEstimate(cells()), 5)}`,
    );
    const exactLine = computed(properties, () => `V = ${format(exact(), 5)}`);
    const error = computed(properties, () => `ΔV = Σ − V = ${format(volumeEstimate(cells()) - exact(), 5)}`);
    const plain = (markup: string) => markup.replace(/<sup>([^<]*)<\/sup>/g, "^$1").replace(/<[^>]+>/g, "");
    const details = computed(
      [estimate, error, columnsProperty, rowsProperty, samplingName, integrandProperty],
      () =>
        `f(x, y) = ${plain(integrandLabel(integrandProperty.value))}. ${format(columnsProperty.value)} × ${format(rowsProperty.value)}. ${samplingName.value}. ${plain(estimate.value)}. V = ${format(exact(), 5)}. ${plain(error.value)}.`,
    );
    const plot = new PlotCanvas(properties, (context, colors) => {
      const project = orthographic(rotationProperty.value, 27, 122, [369, 355]);
      const floor: Point3[] = [
        [0, 0, 0],
        [1, 0, 0],
        [1, 1, 0],
        [0, 1, 0],
      ];
      // Scale heights so the tallest point of the roof stands about 1.5 units high.
      const integrand = integrandProperty.value;
      const zScale = 1.5 / roofHeight(integrand);
      const xy = ([x, y, z]: Point3) => project([x, y, z * zScale]).point;
      drawTurntable(context, rotationProperty.value, xy, colors.ink);
      line(context, [...floor, floor[0] as Point3].map(xy), colors.ink, 2);
      const crowded = columnsProperty.value * rowsProperty.value > 64;
      const faces = cells().flatMap(({ x, y, width, depth, height, sampleX, sampleY }) => {
        const a: Point3 = [x, y, 0];
        const b: Point3 = [x + width, y, 0];
        const c: Point3 = [x + width, y + depth, 0];
        const d: Point3 = [x, y + depth, 0];
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
            face.corners.reduce((total, p) => total + project([p[0], p[1], p[2] * zScale]).depth, 0) /
            face.corners.length,
        }));
      });
      faces.sort((a, b) => a.depth - b.depth);
      for (const face of faces) {
        context.globalAlpha = face.sample ? 0.72 : 0.19;
        line(context, face.corners.map(xy), colors.background, 1, face.fill);
        context.globalAlpha = 1;
        if (face.sample) {
          dot(context, xy(face.sample), colors.background, crowded ? 1.3 : 2.3);
        }
      }

      // The actual roof is the orange wireframe, independent of the estimates.
      context.globalAlpha = 0.82;
      for (let i = 0; i <= 4; i++) {
        for (const swap of [false, true]) {
          const curve = Array.from({ length: 25 }, (_, j) => {
            const x = swap ? j / 24 : i / 4;
            const y = swap ? i / 4 : j / 24;
            return xy([x, y, evaluate(integrand, x, y)]);
          });
          line(context, curve, colors.alternate, 1.35);
        }
      }
      context.globalAlpha = 1;
      drawFloorPlan(context, colors, cells(), columnsProperty.value, rowsProperty.value, crowded);
      plotLabel(context, `z = ${canvasText(integrandLabel(integrand))}`, [16, 405], colors.alternate);
      drawErrorInset(
        context,
        colors,
        integrand,
        samplingProperty.value,
        columnsProperty.value,
        rowsProperty.value,
        s.errorPlotStringProperty.value,
      );
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
    const listParent = new Node();
    super(
      {
        title: manager.getScreenNames().volumeStringProperty,
        summary: screenSummary,
        details,
        plot,
        listParent,
        controls: [
          comboBox(
            integrandProperty,
            integrands.map((integrand: Integrand) => ({
              value: integrand,
              label: `f(x, y) = ${integrandLabel(integrand)}`,
              name: `f(x, y) = ${plain(integrandLabel(integrand))}`,
            })),
            listParent,
            s.integrandStringProperty,
          ),
          slider(s.columnsStringProperty, columnsProperty, 1),
          slider(s.rowsStringProperty, rowsProperty, 1),
          comboBox(
            samplingProperty,
            samplings.map((sampling: Sampling) => ({ value: sampling, label: s[`${sampling}StringProperty`] })),
            listParent,
            s.samplingStringProperty,
          ),
          slider(s.rotationStringProperty, rotationProperty, 5, "°"),
        ],
        readouts: [estimate, exactLine, error],
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
