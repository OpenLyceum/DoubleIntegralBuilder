import { DerivedProperty, Multilink } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { ScreenViewOptions } from "scenerystack/sim";
import {
  addPlotDrag,
  choice,
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
import { EXACT_AREA, sliceBounds } from "../../common/model/IntegralMath.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { BoundsModel } from "../model/BoundsModel.js";

export class BoundsScreenView extends LabView {
  public constructor(model: BoundsModel, options?: ScreenViewOptions) {
    const manager = StringManager.getInstance();
    const { controls: s, screenSummary } = manager.getBoundsA11yStrings();
    const { xProperty, yProperty, sweepProperty, properties } = model;
    const horizontal = () => sweepProperty.value === "horizontal";
    const coordinate = () => (horizontal() ? yProperty.value : xProperty.value);
    const name = computed(
      [s.horizontalStringProperty, s.verticalStringProperty, sweepProperty],
      () => (horizontal() ? s.horizontalStringProperty : s.verticalStringProperty).value,
    );
    const active = computed(properties, () => {
      const t = coordinate();
      const [min, max] = sliceBounds(sweepProperty.value, t);
      return horizontal()
        ? `y = ${format(t)}    ${format(min)} ≤ x ≤ ${format(max)}`
        : `x = ${format(t)}    ${format(min)} ≤ y ≤ ${format(max)}`;
    });
    const bounds = computed([sweepProperty], () =>
      horizontal() ? "0 ≤ y ≤ 1     y² ≤ x ≤ 2 − y" : "0 ≤ x ≤ 1     0 ≤ y ≤ √x",
    );
    const remaining = computed([sweepProperty], () => (horizontal() ? "" : "1 ≤ x ≤ 2     0 ≤ y ≤ 2 − x"));
    const area = computed([], () => `A = 7/6 ≈ ${format(EXACT_AREA, 4)}`);
    const details = computed([active, bounds, remaining, area, name], () =>
      [name.value, active.value, bounds.value, remaining.value, area.value].filter(Boolean).join(". "),
    );
    const xSlider = slider(s.xStringProperty, xProperty, 0.01);
    const ySlider = slider(s.yStringProperty, yProperty, 0.01);
    xSlider.visibleProperty = new DerivedProperty([sweepProperty], (sweep) => sweep === "vertical");
    ySlider.visibleProperty = new DerivedProperty([sweepProperty], (sweep) => sweep === "horizontal");

    const plane = new Plane(new Range(-0.3, 2.3), new Range(-0.35, 1.4));
    const curve = Array.from({ length: 81 }, (_, i) => {
      const y = i / 80;
      return plane.project([y ** 2, y]);
    });
    const plot = new PlotCanvas(properties, (context, colors) => {
      plane.axes(context, colors);
      context.globalAlpha = 0.26;
      line(context, [...curve, plane.project([2, 0])], colors.accent, 1, colors.accent);
      context.globalAlpha = 1;
      line(context, [...curve, plane.project([2, 0]), plane.project([0, 0])], colors.ink, 1.7);
      if (!horizontal()) {
        context.setLineDash([5, 5]);
        line(context, [plane.project([1, 0]), plane.project([1, 1])], colors.ink, 1.4);
        context.setLineDash([]);
      }
      const t = coordinate();
      const [min, max] = sliceBounds(sweepProperty.value, t);
      const start = plane.project(horizontal() ? [min, t] : [t, min]);
      const end = plane.project(horizontal() ? [max, t] : [t, max]);
      line(context, [start, end], colors.alternate, 4);
      dot(context, start, colors.alternate);
      dot(context, end, colors.alternate);
      plotLabel(context, "x = y²", plane.project([0.06, 0.73]), colors.ink);
      plotLabel(context, "x = 2 − y", plane.project([1.62, 0.74]), colors.ink);
      if (!horizontal()) {
        plotLabel(context, "x = 1", plane.project([0.92, -0.13]), colors.ink);
      }
    });
    // Drag the slice by its grip, or tap anywhere on the plot to move the slice there.
    const moveSlice = (x: number, y: number) => {
      const [modelX, modelY] = plane.unproject([x, y]);
      const property = horizontal() ? yProperty : xProperty;
      property.value = property.range.constrainValue(Math.round((horizontal() ? modelY : modelX) * 100) / 100);
    };
    addPlotDrag(plot, "pointer", moveSlice);
    const grip = new PlotGrip(plot, moveSlice);
    Multilink.multilink(properties, () => {
      const t = coordinate();
      const [min, max] = sliceBounds(sweepProperty.value, t);
      const middle = (min + max) / 2;
      grip.place(plane.project(horizontal() ? [middle, t] : [t, middle]));
      grip.cursor = horizontal() ? "ns-resize" : "ew-resize";
    });
    super(
      {
        title: manager.getScreenNames().boundsStringProperty,
        summary: screenSummary,
        details,
        plot,
        controls: [
          choice(s.sweepStringProperty, name, () => {
            sweepProperty.value = horizontal() ? "vertical" : "horizontal";
          }),
          xSlider,
          ySlider,
        ],
        readouts: [active, bounds, remaining, area],
        reset: () => model.reset(),
      },
      options,
    );
  }
}
