import { Multilink } from "scenerystack/axon";
import { Range, toFixedNumber, Vector2 } from "scenerystack/dot";
import { Node } from "scenerystack/scenery";
import type { ScreenViewOptions } from "scenerystack/sim";
import {
  addPlotDrag,
  addPlotKeyboardDrag,
  button,
  comboBox,
  computed,
  dot,
  format,
  LabView,
  line,
  Plane,
  PlotCanvas,
  PlotGrip,
  plotLabel,
  slider,
} from "../../common/LabView.js";
import {
  accumulated,
  type Integrand,
  innerIntegral,
  integrandLabel,
  integrands,
  notation,
  outerRange,
  pieces,
  type RegionId,
  regionBoundary,
  regions,
  type Sweep,
  sliceBounds,
  total,
} from "../../common/model/IntegralMath.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { BoundsModel } from "../model/BoundsModel.js";

const SWEPT_SAMPLES = 60;
const superscripts: Record<string, string> = { "2": "²", "3": "³" };
/** Plain text for the canvas: <sup>2</sup> becomes ², other tags are dropped. */
const plain = (markup: string) =>
  markup
    .replace(/<sup>([^<]*)<\/sup>/g, (_, power: string) => superscripts[power] ?? `^${power}`)
    .replace(/<[^>]+>/g, "");

export class BoundsScreenView extends LabView {
  public constructor(model: BoundsModel, options?: ScreenViewOptions) {
    const manager = StringManager.getInstance();
    const { controls: s, screenSummary } = manager.getBoundsA11yStrings();
    const { regionProperty, integrandProperty, sweepProperty, fractionProperty, playingProperty, properties } = model;
    const region = () => regionProperty.value;
    const sweep = () => sweepProperty.value;
    const horizontal = () => sweep() === "horizontal";
    const [outerName, innerName] = [() => (horizontal() ? "y" : "x"), () => (horizontal() ? "x" : "y")];
    const notationLine = computed([regionProperty, sweepProperty], () => notation(region(), sweep()));
    const active = computed(properties, () => {
      const t = model.outer;
      const [min, max] = sliceBounds(region(), sweep(), t);
      return `${outerName()} = ${format(t)}:   ${format(min)} ≤ ${innerName()} ≤ ${format(max)}`;
    });
    const inner = computed(
      properties,
      () =>
        `∫ f d${innerName()} = ${format(innerIntegral(region(), sweep(), integrandProperty.value, model.outer), 4)}`,
    );
    const swept = computed(properties, () => {
      const [from] = outerRange(region(), sweep());
      return `∫<sub>${format(from)}</sub><sup>${format(model.outer)}</sup> (∫ f d${innerName()}) d${outerName()} = ${format(accumulated(region(), sweep(), integrandProperty.value, model.outer), 4)}`;
    });
    const whole = computed(
      [regionProperty, integrandProperty, sweepProperty, s.totalStringProperty],
      () => `${s.totalStringProperty.value}  ${format(total(region(), sweep(), integrandProperty.value), 4)}`,
    );
    const details = computed([notationLine, active, inner, swept, whole, integrandProperty], () =>
      [
        `f(x, y) = ${plain(integrandLabel(integrandProperty.value))}`,
        plain(notationLine.value),
        active.value,
        inner.value,
        plain(swept.value),
        whole.value,
      ].join(". "),
    );

    const plane = new Plane(new Range(-0.3, 2.3), new Range(-0.35, 1.4));
    const plot = new PlotCanvas(properties, (context, colors) => {
      plane.axes(context, colors);
      const boundary = regionBoundary(region()).map((point) => plane.project(point));
      context.globalAlpha = 0.18;
      line(context, [...boundary, boundary[0] ?? [0, 0]], colors.accent, 1, colors.accent);
      context.globalAlpha = 1;
      // The part already swept, from the start of the outer range up to the slice.
      const [from] = outerRange(region(), sweep());
      const t = model.outer;
      const outerSamples = Array.from({ length: SWEPT_SAMPLES + 1 }, (_, i) => from + ((t - from) * i) / SWEPT_SAMPLES);
      const at = (outer: number, innerValue: number) =>
        plane.project(horizontal() ? [innerValue, outer] : [outer, innerValue]);
      const lower = outerSamples.map((outer) => at(outer, sliceBounds(region(), sweep(), outer)[0]));
      const upper = outerSamples.map((outer) => at(outer, sliceBounds(region(), sweep(), outer)[1])).reverse();
      if (t > from) {
        context.globalAlpha = 0.45;
        line(context, [...lower, ...upper], colors.accent, 1, colors.accent);
        context.globalAlpha = 1;
      }
      line(context, [...boundary, boundary[0] ?? [0, 0]], colors.ink, 1.7);
      // Where the description switches from one piece to the next.
      context.setLineDash([5, 5]);
      for (const piece of pieces(region(), sweep()).slice(1)) {
        const [low, high] = sliceBounds(region(), sweep(), piece.from);
        line(context, [at(piece.from, low), at(piece.from, high + 0.15)], colors.ink, 1.4);
      }
      context.setLineDash([]);
      const [min, max] = sliceBounds(region(), sweep(), t);
      const start = at(t, min);
      const end = at(t, max);
      line(context, [start, end], colors.alternate, 4);
      dot(context, start, colors.alternate);
      dot(context, end, colors.alternate);
      // Name the curves the slice runs between.
      const piece = pieces(region(), sweep()).find((p) => t <= p.to) ?? pieces(region(), sweep())[0];
      if (piece) {
        // A bound of 0 is the axis itself and needs no label.
        if (piece.lowLabel !== "0") {
          const [dx, dy] = horizontal() ? [-46, -8] : [8, 16];
          plotLabel(context, `${innerName()} = ${plain(piece.lowLabel)}`, [start[0] + dx, start[1] + dy], colors.ink);
        }
        plotLabel(context, `${innerName()} = ${plain(piece.highLabel)}`, [end[0] + 8, end[1] - 8], colors.ink);
      }
    });
    // Drag the slice by its grip, or tap anywhere on the plot to move the slice there.
    const moveSlice = (x: number, y: number) => {
      playingProperty.value = false;
      const [modelX, modelY] = plane.unproject([x, y]);
      const [from, to] = outerRange(region(), sweep());
      const outer = horizontal() ? modelY : modelX;
      fractionProperty.value = fractionProperty.range.constrainValue(toFixedNumber((outer - from) / (to - from), 3));
    };
    addPlotDrag(plot, "pointer", moveSlice);
    const grip = new PlotGrip(plot, moveSlice, () => active.value);
    // Either pair of arrow keys moves the slice along the outer variable.
    addPlotKeyboardDrag(grip, s.sliceGripStringProperty, {
      dragDelta: 0.05,
      shiftDragDelta: 0.01,
      positionProperty: {
        get value() {
          return new Vector2(fractionProperty.value, -fractionProperty.value);
        },
        set value(position: Vector2) {
          playingProperty.value = false;
          const current = fractionProperty.value;
          const next = position.x !== current ? position.x : -position.y;
          fractionProperty.value = fractionProperty.range.constrainValue(toFixedNumber(next, 3));
        },
      },
    });
    Multilink.multilink(properties, () => {
      const t = model.outer;
      const [min, max] = sliceBounds(region(), sweep(), t);
      const middle = (min + max) / 2;
      grip.place(plane.project(horizontal() ? [middle, t] : [t, middle]));
      grip.cursor = horizontal() ? "ns-resize" : "ew-resize";
    });
    const listParent = new Node();
    super(
      {
        title: manager.getScreenNames().boundsStringProperty,
        summary: screenSummary,
        details,
        plot,
        listParent,
        controls: [
          comboBox(
            regionProperty,
            regions.map((id: RegionId) => ({ value: id, label: s[`${id}StringProperty`] })),
            listParent,
            s.regionStringProperty,
          ),
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
          comboBox(
            sweepProperty,
            (["horizontal", "vertical"] as const satisfies readonly Sweep[]).map((option) => ({
              value: option,
              label: s[`${option}StringProperty`],
            })),
            listParent,
            s.sweepStringProperty,
          ),
          slider(s.sliceStringProperty, fractionProperty, 0.01, "", () => `${outerName()} = ${format(model.outer)}`, [
            regionProperty,
            sweepProperty,
          ]),
          button(s.sweepButtonStringProperty, () => model.sweep()),
        ],
        readouts: [notationLine, active, inner, swept, whole],
        reset: () => model.reset(),
      },
      options,
    );
  }
}
