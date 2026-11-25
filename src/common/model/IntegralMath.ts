/** The integrands offered on both screens, as z = f(x, y) over the unit square or a region. */
export const integrands = ["paraboloid", "product", "waves", "plane", "one"] as const;
export type Integrand = (typeof integrands)[number];

type IntegrandEntry = {
  readonly label: string;
  readonly f: (x: number, y: number) => number;
  /** The exact integral over the unit square [0, 1] × [0, 1]. */
  readonly squareVolume: number;
};

const integrandLibrary: Readonly<Record<Integrand, IntegrandEntry>> = {
  paraboloid: { label: "1 + x<sup>2</sup> + y<sup>2</sup>", f: (x, y) => 1 + x * x + y * y, squareVolume: 5 / 3 },
  product: { label: "4xy", f: (x, y) => 4 * x * y, squareVolume: 1 },
  waves: {
    label: "2 sin(πx) sin(πy)",
    f: (x, y) => 2 * Math.sin(Math.PI * x) * Math.sin(Math.PI * y),
    squareVolume: 8 / Math.PI ** 2,
  },
  plane: { label: "2 − x − y", f: (x, y) => 2 - x - y, squareVolume: 1 },
  one: { label: "1", f: () => 1, squareVolume: 1 },
};

export function integrandLabel(integrand: Integrand): string {
  return integrandLibrary[integrand].label;
}

export function evaluate(integrand: Integrand, x: number, y: number): number {
  return integrandLibrary[integrand].f(x, y);
}

export function exactVolume(integrand: Integrand): number {
  return integrandLibrary[integrand].squareVolume;
}

/** Where each column of the Riemann sum is sampled, as a fraction of the cell in x and y. */
export const samplings = ["lowerLeft", "lowerRight", "upperLeft", "upperRight", "midpoint"] as const;
export type Sampling = (typeof samplings)[number];
const offsets: Readonly<Record<Sampling, readonly [number, number]>> = {
  lowerLeft: [0, 0],
  lowerRight: [1, 0],
  upperLeft: [0, 1],
  upperRight: [1, 1],
  midpoint: [0.5, 0.5],
};

type VolumeCell = {
  x: number;
  y: number;
  width: number;
  depth: number;
  sampleX: number;
  sampleY: number;
  height: number;
};

/** The m × n columns over the unit square, each as tall as f at its sample point. */
export function volumeCells(
  columns: number,
  rows: number,
  sampling: Sampling,
  integrand: Integrand = "paraboloid",
): VolumeCell[] {
  const [ox, oy] = offsets[sampling];
  const width = 1 / columns;
  const depth = 1 / rows;
  const cells: VolumeCell[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = column * width;
      const y = row * depth;
      const sampleX = x + ox * width;
      const sampleY = y + oy * depth;
      cells.push({ x, y, width, depth, sampleX, sampleY, height: evaluate(integrand, sampleX, sampleY) });
    }
  }
  return cells;
}

export function volumeEstimate(cells: readonly VolumeCell[]): number {
  return cells.reduce((sum, cell) => sum + cell.height * cell.width * cell.depth, 0);
}

/** Slices sweep across y (horizontal slices, x inner) or across x (vertical slices, y inner). */
export type Sweep = "horizontal" | "vertical";

/**
 * One piece of an iterated integral: the outer variable runs over [from, to], and for each of
 * its values the inner variable runs from `low(t)` to `high(t)`. The labels are the inner
 * bounds as formulas (RichText markup).
 */
type Piece = {
  readonly from: number;
  readonly to: number;
  readonly low: (t: number) => number;
  readonly high: (t: number) => number;
  readonly lowLabel: string;
  readonly highLabel: string;
  readonly fromLabel: string;
  readonly toLabel: string;
};

/** A region described both ways: as horizontal slices (dx dy) and as vertical slices (dy dx). */
type Region = {
  readonly horizontal: readonly Piece[];
  readonly vertical: readonly Piece[];
  /** Its boundary, traced counterclockwise, for drawing. */
  readonly boundary: (steps: number) => [number, number][];
};

export const regions = ["parabolaLine", "triangle", "lens", "quarterDisk"] as const;
export type RegionId = (typeof regions)[number];

const sqrt = (t: number) => Math.sqrt(Math.max(0, t));
const sampleCurve = (steps: number, from: number, to: number, point: (t: number) => [number, number]) =>
  Array.from({ length: steps + 1 }, (_, i) => point(from + ((to - from) * i) / steps));

const regionLibrary: Readonly<Record<RegionId, Region>> = {
  // Between x = y² and x = 2 − y: vertical slices need two pieces, split at x = 1.
  parabolaLine: {
    horizontal: [
      {
        from: 0,
        to: 1,
        low: (y) => y * y,
        high: (y) => 2 - y,
        lowLabel: "y<sup>2</sup>",
        highLabel: "2 − y",
        fromLabel: "0",
        toLabel: "1",
      },
    ],
    vertical: [
      { from: 0, to: 1, low: () => 0, high: sqrt, lowLabel: "0", highLabel: "√x", fromLabel: "0", toLabel: "1" },
      {
        from: 1,
        to: 2,
        low: () => 0,
        high: (x) => 2 - x,
        lowLabel: "0",
        highLabel: "2 − x",
        fromLabel: "1",
        toLabel: "2",
      },
    ],
    boundary: (steps) => [[0, 0], [2, 0], [1, 1], ...sampleCurve(steps, 1, 0, (y) => [y * y, y])],
  },
  triangle: {
    horizontal: [
      { from: 0, to: 1, low: (y) => y, high: () => 1, lowLabel: "y", highLabel: "1", fromLabel: "0", toLabel: "1" },
    ],
    vertical: [
      { from: 0, to: 1, low: () => 0, high: (x) => x, lowLabel: "0", highLabel: "x", fromLabel: "0", toLabel: "1" },
    ],
    boundary: () => [
      [0, 0],
      [1, 0],
      [1, 1],
    ],
  },
  // Between y = x² and y = √x.
  lens: {
    horizontal: [
      {
        from: 0,
        to: 1,
        low: (y) => y * y,
        high: sqrt,
        lowLabel: "y<sup>2</sup>",
        highLabel: "√y",
        fromLabel: "0",
        toLabel: "1",
      },
    ],
    vertical: [
      {
        from: 0,
        to: 1,
        low: (x) => x * x,
        high: sqrt,
        lowLabel: "x<sup>2</sup>",
        highLabel: "√x",
        fromLabel: "0",
        toLabel: "1",
      },
    ],
    boundary: (steps) => [
      ...sampleCurve(steps, 0, 1, (x) => [x, x * x]),
      ...sampleCurve(steps, 1, 0, (x) => [x, sqrt(x)]),
    ],
  },
  quarterDisk: {
    horizontal: [
      {
        from: 0,
        to: 1,
        low: () => 0,
        high: (y) => sqrt(1 - y * y),
        lowLabel: "0",
        highLabel: "√(1 − y<sup>2</sup>)",
        fromLabel: "0",
        toLabel: "1",
      },
    ],
    vertical: [
      {
        from: 0,
        to: 1,
        low: () => 0,
        high: (x) => sqrt(1 - x * x),
        lowLabel: "0",
        highLabel: "√(1 − x<sup>2</sup>)",
        fromLabel: "0",
        toLabel: "1",
      },
    ],
    boundary: (steps) => [[0, 0], ...sampleCurve(steps, 0, Math.PI / 2, (a) => [Math.cos(a), Math.sin(a)])],
  },
};

export function regionBoundary(region: RegionId, steps = 80): [number, number][] {
  return regionLibrary[region].boundary(steps);
}

export function pieces(region: RegionId, sweep: Sweep): readonly Piece[] {
  return regionLibrary[region][sweep];
}

/** The outer variable's full range for a region and sweep. */
export function outerRange(region: RegionId, sweep: Sweep): readonly [number, number] {
  const all = pieces(region, sweep);
  return [all[0]?.from ?? 0, all[all.length - 1]?.to ?? 1];
}

/** The inner bounds at outer value t: x-limits for a horizontal slice at y = t, y-limits for a vertical one. */
export function sliceBounds(region: RegionId, sweep: Sweep, t: number): readonly [number, number] {
  const all = pieces(region, sweep);
  const piece = all.find((p) => t <= p.to) ?? all[all.length - 1];
  return piece ? [piece.low(t), piece.high(t)] : [0, 0];
}

/** Composite Simpson's rule with an even number of panels. */
function simpson(g: (t: number) => number, from: number, to: number, panels = 64): number {
  if (to <= from) {
    return 0;
  }
  const h = (to - from) / panels;
  let weighted = g(from) + g(to);
  for (let i = 1; i < panels; i++) {
    weighted += (i % 2 === 1 ? 4 : 2) * g(from + i * h);
  }
  return (weighted * h) / 3;
}

/** The inner integral at outer value t: ∫ f along the slice. */
export function innerIntegral(region: RegionId, sweep: Sweep, integrand: Integrand, t: number): number {
  const [low, high] = sliceBounds(region, sweep, t);
  const f =
    sweep === "horizontal" ? (x: number) => evaluate(integrand, x, t) : (y: number) => evaluate(integrand, t, y);
  return simpson(f, low, high);
}

/**
 * The iterated integral accumulated from the start of the outer range up to t, piece by piece
 * so the kink at a split (x = 1) does not spoil the quadrature.
 */
export function accumulated(region: RegionId, sweep: Sweep, integrand: Integrand, t: number): number {
  return pieces(region, sweep).reduce(
    (sum, piece) =>
      sum + simpson((s) => innerIntegral(region, sweep, integrand, s), piece.from, Math.min(piece.to, t), 128),
    0,
  );
}

/** The whole iterated integral over the region. */
export function total(region: RegionId, sweep: Sweep, integrand: Integrand): number {
  return accumulated(region, sweep, integrand, Number.POSITIVE_INFINITY);
}

/**
 * The iterated integral in notation, one term per piece, e.g.
 * ∫₀¹ ∫_{y²}^{2−y} f dx dy for horizontal slices.
 */
export function notation(region: RegionId, sweep: Sweep): string {
  const [inner, outer] = sweep === "horizontal" ? ["dx", "dy"] : ["dy", "dx"];
  return pieces(region, sweep)
    .map(
      (p) =>
        `∫<sub>${p.fromLabel}</sub><sup>${p.toLabel}</sup> ∫<sub>${p.lowLabel}</sub><sup>${p.highLabel}</sup> f ${inner} ${outer}`,
    )
    .join("  +  ");
}
