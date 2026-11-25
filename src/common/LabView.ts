import { DerivedProperty, type NumberProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Dimension2, type Range, roundSymmetric, toFixedNumber, Vector2 } from "scenerystack/dot";
import { localeProperty } from "scenerystack/joist";
import { Shape } from "scenerystack/kite";
import {
  CanvasNode,
  Circle,
  DragListener,
  KeyboardDragListener,
  Node,
  Rectangle,
  RichText,
  Text,
  VBox,
} from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenSummaryContent, ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { ComboBox, HSlider, RectangularPushButton } from "scenerystack/sun";
import Colors from "../DoubleIntegralBuilderColors.js";
import { SCREEN_VIEW_MARGIN } from "../DoubleIntegralBuilderConstants.js";
import {
  DOUBLE_INTEGRAL_BUILDER_COMBO_BOX_OPTIONS as COMBO_BOX_OPTIONS,
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "./DoubleIntegralBuilderButtonOptions.js";
import { DoubleIntegralBuilderPanel as LabPanel } from "./DoubleIntegralBuilderPanel.js";

type StringSource = string | TReadOnlyProperty<string>;
type Dependencies = readonly TReadOnlyProperty<unknown>[];
type Point = readonly [number, number];

const PLOT_WIDTH = 590;
const PLOT_HEIGHT = 420;
const PLOT_MARGIN = 23;

export function computed(dependencies: Dependencies, calculate: () => string) {
  return DerivedProperty.deriveAny([localeProperty, ...dependencies], calculate);
}

export function format(value: number, digits = 2): string {
  return new Intl.NumberFormat(localeProperty.value, {
    maximumFractionDigits: digits,
  }).format(Math.abs(value) < 10 ** -digits / 2 ? 0 : value);
}

function text(value: StringSource, size: number, width: number, bold = false): Text {
  return new Text(value, {
    font: `${bold ? "bold " : ""}${size}px sans-serif`,
    maxWidth: width,
    fill: Colors.textColorProperty,
  });
}

/**
 * A labelled slider. `display` turns the value into the shown and spoken text, for a slider
 * that runs over a fraction but should read as the quantity it stands for.
 */
export function slider(
  label: TReadOnlyProperty<string>,
  value: NumberProperty,
  step: number,
  suffix = "",
  display: (current: number) => string = (current) => `${format(current)}${suffix}`,
  dependencies: Dependencies = [],
): VBox {
  const caption = computed([label, value, ...dependencies], () => `${label.value}  ${display(value.value)}`);
  const control = new HSlider(value, value.range, {
    accessibleName: label,
    keyboardStep: step,
    constrainValue: (next) => value.range.constrainValue(toFixedNumber(roundSymmetric(next / step) * step, 8)),
    pdomCreateAriaValueText: (current) => display(current ?? value.value),
    // The spoken value also depends on whatever `display` reads, such as the region.
    pdomDependencies: [...dependencies],
    trackSize: new Dimension2(243, 4),
    thumbSize: new Dimension2(16, 21),
    thumbFill: Colors.accentColorProperty,
  });
  return new VBox({ children: [text(caption, 15, 288, true), control], spacing: 3, align: "left" });
}

/**
 * A drop-down list for choosing one of several named items. Labels may carry RichText markup.
 * The open list is drawn in `listParent`, which LabView keeps on top.
 */
export function comboBox<T>(
  property: ConstructorParameters<typeof ComboBox<T>>[0],
  choices: readonly { value: T; label: StringSource; name?: StringSource }[],
  listParent: Node,
  accessibleName: TReadOnlyProperty<string>,
): ComboBox<T> {
  return new ComboBox(
    property,
    choices.map((item) => ({
      value: item.value,
      createNode: () =>
        new RichText(item.label, { font: "15px sans-serif", fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: 255 }),
      accessibleName: item.name ?? item.label,
    })),
    listParent,
    { ...COMBO_BOX_OPTIONS, accessibleName, xMargin: 10, yMargin: 5, cornerRadius: 4 },
  );
}

/** A push button with a text label. */
export function button(label: TReadOnlyProperty<string>, listener: () => void): RectangularPushButton {
  return new RectangularPushButton({
    ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
    accessibleName: label,
    content: new Text(label, { font: "bold 15px sans-serif", maxWidth: 270, fill: LIGHT_SURFACE_TEXT_FILL }),
    xMargin: 10,
    yMargin: 7,
    listener,
  });
}

type SummaryStrings = {
  playAreaStringProperty: TReadOnlyProperty<string>;
  controlAreaStringProperty: TReadOnlyProperty<string>;
  interactionHintStringProperty: TReadOnlyProperty<string>;
};

type LabViewConfig = {
  title: TReadOnlyProperty<string>;
  summary: SummaryStrings;
  details: TReadOnlyProperty<string>;
  plot: PlotCanvas;
  controls: Node[];
  readouts: StringSource[];
  reset: () => void;
  /** Parent for open combo-box lists, created by the view and added here on top of everything. */
  listParent?: Node;
};

export class LabView extends ScreenView {
  public constructor(config: LabViewConfig, options?: ScreenViewOptions) {
    super({
      ...options,
      screenSummaryContent: new ScreenSummaryContent({
        playAreaContent: config.summary.playAreaStringProperty,
        controlAreaContent: config.summary.controlAreaStringProperty,
        interactionHintContent: config.summary.interactionHintStringProperty,
        currentDetailsContent: config.details,
      }),
    });

    const bounds = this.layoutBounds;
    const left = bounds.minX + SCREEN_VIEW_MARGIN;
    const title = text(config.title, 28, bounds.width - 2 * SCREEN_VIEW_MARGIN, true);
    title.left = left;
    title.top = bounds.minY + SCREEN_VIEW_MARGIN;
    config.plot.setTranslation(left, title.bottom + 14);
    const column = new VBox({
      align: "left",
      spacing: 8,
      children: [
        ...config.controls,
        ...config.readouts.map(
          (value, index) =>
            new RichText(value, {
              font: `${index === 0 ? "bold " : ""}15px sans-serif`,
              maxWidth: 300,
              fill: Colors.textColorProperty,
            }),
        ),
      ],
    });
    const panel = new LabPanel(column, { xMargin: 15, yMargin: 13, minWidth: 325 });
    panel.left = config.plot.left + PLOT_WIDTH + 18;
    panel.top = title.bottom + 14;
    const reset = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: config.reset,
      right: bounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: bounds.maxY - SCREEN_VIEW_MARGIN,
    });
    const content = new Node({
      children: [title, config.plot, panel, reset, ...(config.listParent ? [config.listParent] : [])],
      pdomOrder: [config.plot, panel, reset],
    });
    this.addChild(content);
  }
}

export type PlotColors = { background: string; ink: string; grid: string; accent: string; alternate: string };

export class PlotCanvas extends CanvasNode {
  private readonly draw: (context: CanvasRenderingContext2D, colors: PlotColors) => void;
  public constructor(
    dependencies: Dependencies,
    draw: (context: CanvasRenderingContext2D, colors: PlotColors) => void,
  ) {
    super({ canvasBounds: new Bounds2(0, 0, PLOT_WIDTH, PLOT_HEIGHT) });
    this.draw = draw;
    const paintDependencies = [
      ...dependencies,
      Colors.panelBackgroundColorProperty,
      Colors.textColorProperty,
      Colors.panelBorderColorProperty,
      Colors.accentColorProperty,
      Colors.secondaryPlotColorProperty,
      localeProperty,
    ];
    for (const dependency of paintDependencies) {
      dependency.lazyLink(this.repaint);
    }
    this.addDisposable({
      dispose: () => {
        for (const dependency of paintDependencies) {
          dependency.unlink(this.repaint);
        }
      },
    });
  }

  private readonly repaint = () => this.invalidatePaint();

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const colors = {
      background: Colors.panelBackgroundColorProperty.value.toCSS(),
      ink: Colors.textColorProperty.value.toCSS(),
      grid: Colors.panelBorderColorProperty.value.toCSS(),
      accent: Colors.accentColorProperty.value.toCSS(),
      alternate: Colors.secondaryPlotColorProperty.value.toCSS(),
    };
    context.fillStyle = colors.background;
    context.fillRect(0, 0, PLOT_WIDTH, PLOT_HEIGHT);
    context.save();
    context.beginPath();
    context.rect(1, 1, PLOT_WIDTH - 2, PLOT_HEIGHT - 2);
    context.clip();
    this.draw(context, colors);
    context.restore();
  }
}

export class Plane {
  private readonly scale: number;
  private readonly origin: Point;

  private readonly xRange: Range;
  private readonly yRange: Range;

  public constructor(xRange: Range, yRange: Range) {
    this.xRange = xRange;
    this.yRange = yRange;
    this.scale = Math.min(
      (PLOT_WIDTH - 2 * PLOT_MARGIN) / xRange.getLength(),
      (PLOT_HEIGHT - 2 * PLOT_MARGIN) / yRange.getLength(),
    );
    this.origin = [PLOT_WIDTH / 2 - this.scale * xRange.getCenter(), PLOT_HEIGHT / 2 + this.scale * yRange.getCenter()];
  }

  public project = ([x, y]: Point): Point => [this.origin[0] + x * this.scale, this.origin[1] - y * this.scale];

  public unproject = ([x, y]: Point): Point => [(x - this.origin[0]) / this.scale, (this.origin[1] - y) / this.scale];

  public axes(context: CanvasRenderingContext2D, colors: PlotColors): void {
    const { min: x0, max: x1 } = this.xRange;
    const { min: y0, max: y1 } = this.yRange;
    for (let x = Math.ceil(x0); x < x1; x++) {
      const p = this.project([x, 0]);
      line(context, [this.project([x, y0]), this.project([x, y1])], x ? colors.grid : colors.ink);
      if (x !== 0) {
        plotLabel(context, format(x), [p[0] + 4, p[1] + 15], colors.ink);
      }
    }
    for (let y = Math.ceil(y0); y < y1; y++) {
      const p = this.project([0, y]);
      line(context, [this.project([x0, y]), this.project([x1, y])], y ? colors.grid : colors.ink);
      if (y !== 0) {
        plotLabel(context, format(y), [p[0] + 5, p[1] - 4], colors.ink);
      }
    }
    plotLabel(context, "x", this.project([x1, 0]), colors.ink);
    plotLabel(context, "y", this.project([0, y1]), colors.ink);
  }
}

export function line(
  context: CanvasRenderingContext2D,
  points: readonly Point[],
  stroke: string,
  width = 1,
  fill?: string,
): void {
  const first = points[0];
  if (!first) {
    return;
  }
  context.beginPath();
  context.moveTo(...first);
  for (const point of points.slice(1)) {
    context.lineTo(...point);
  }
  if (fill) {
    context.closePath();
    context.fillStyle = fill;
    context.fill();
  }
  context.lineWidth = width;
  context.strokeStyle = stroke;
  context.stroke();
}

export function dot(context: CanvasRenderingContext2D, point: Point, color: string, radius = 5): void {
  context.beginPath();
  context.arc(...point, radius, 0, 2 * Math.PI);
  context.fillStyle = color;
  context.fill();
}

export function plotLabel(context: CanvasRenderingContext2D, value: string, point: Point, color: string): void {
  context.font = "13px sans-serif";
  context.fillStyle = color;
  context.fillText(value, ...point);
}

type PlotDrag = (x: number, y: number, start: boolean) => void;
const plotPoint = (plot: PlotCanvas, point: Vector2, offset = Vector2.ZERO): Point => {
  const local = plot.globalToLocalPoint(point).plus(offset);
  return [Math.max(0, Math.min(PLOT_WIDTH, local.x)), Math.max(0, Math.min(PLOT_HEIGHT, local.y))];
};

/**
 * Pointer drag surface over the whole plot, reporting plot-pixel positions.
 */
export function addPlotDrag(plot: PlotCanvas, cursor: string, drag: PlotDrag, end?: () => void): Rectangle {
  // Rectangles have a Scenery hit shape. The canvas itself only paints pixels.
  const hitArea = new Rectangle(0, 0, PLOT_WIDTH, PLOT_HEIGHT, { fill: "transparent", cursor });
  const listener = new DragListener({
    start: (event) => drag(...plotPoint(plot, event.pointer.point), true),
    drag: (event) => drag(...plotPoint(plot, event.pointer.point), false),
    end: () => end?.(),
  });
  hitArea.addInputListener(listener);
  plot.insertChild(0, hitArea);
  hitArea.addDisposable(listener);
  plot.addDisposable(hitArea);
  return hitArea;
}

export function addPlotKeyboardDrag(
  target: Node,
  name: TReadOnlyProperty<string>,
  options: ConstructorParameters<typeof KeyboardDragListener>[0],
): void {
  target.tagName = "div";
  target.ariaRole = "application";
  target.accessibleNameBehavior = (_node, nodeOptions, label) => ({ ...nodeOptions, ariaLabel: label });
  target.accessibleName = name;
  target.focusable = true;
  const listener = new KeyboardDragListener(options);
  target.addInputListener(listener);
  target.addDisposable({
    dispose: () => {
      target.removeInputListener(listener);
      listener.dispose();
    },
  });
}

/**
 * Visible grab handle on a plot, above any drag surface. The caller places it in plot pixels.
 * The grip preserves the pointer grab offset and shows an optional readout.
 */
export class PlotGrip extends Node {
  private readonly readout: (() => string) | null;
  private readonly label = new Text("", { font: "bold 13px sans-serif", fill: Colors.textColorProperty });
  private readonly labelBox: Rectangle;

  public constructor(plot: PlotCanvas, drag: (x: number, y: number) => void, readout?: () => string) {
    const radius = 8;
    const halo = new Circle(radius + 7, { fill: Colors.secondaryPlotColorProperty, opacity: 0.3 });
    super({
      excludeInvisibleChildrenFromBounds: true,
      children: [
        halo,
        new Circle(radius, {
          fill: Colors.secondaryPlotColorProperty,
          stroke: Colors.panelBackgroundColorProperty,
          lineWidth: 2,
        }),
      ],
    });
    this.readout = readout ?? null;
    this.labelBox = new Rectangle(0, 0, 1, 1, {
      cornerRadius: 4,
      fill: Colors.panelBackgroundColorProperty,
      opacity: 0.9,
      pickable: false,
      visible: false,
      children: [this.label],
    });
    this.addChild(this.labelBox);
    this.mouseArea = Shape.circle(0, 0, radius + 6);
    this.touchArea = Shape.circle(0, 0, radius + 16);
    let offset = Vector2.ZERO;
    const listener = new DragListener({
      start: (event) => {
        offset = this.translation.minus(plot.globalToLocalPoint(event.pointer.point));
      },
      drag: (event) => drag(...plotPoint(plot, event.pointer.point, offset)),
    });
    listener.isHighlightedProperty.link((highlighted) => {
      halo.opacity = highlighted ? 0.5 : 0.3;
      this.labelBox.visible = highlighted && this.readout !== null;
      this.updateLabel();
    });
    this.addInputListener(listener);
    this.addDisposable(listener);
    plot.addChild(this);
  }

  public place([x, y]: Point): void {
    this.setTranslation(x, y);
    this.updateLabel();
  }

  /** Refreshes the readout and keeps it on the plot: above the grip, or below it near the top. */
  private updateLabel(): void {
    if (!(this.readout && this.labelBox.visible)) {
      return;
    }
    this.label.string = this.readout();
    this.labelBox.setRect(0, 0, this.label.width + 10, this.label.height + 4);
    this.label.center = this.labelBox.localBounds.center;
    const gap = 18;
    this.labelBox.centerX = Math.max(
      this.labelBox.width / 2 - this.x,
      Math.min(PLOT_WIDTH - this.x - this.labelBox.width / 2, 0),
    );
    if (this.y - gap - this.labelBox.height >= 0) {
      this.labelBox.bottom = -gap;
    } else {
      this.labelBox.top = gap;
    }
  }
}
