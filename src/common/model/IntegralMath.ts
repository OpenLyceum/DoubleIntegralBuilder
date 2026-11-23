export const EXACT_VOLUME = 5 / 3;
export const EXACT_AREA = 7 / 6;

export type Sampling = "midpoint" | "upperRight";
export type Sweep = "horizontal" | "vertical";

export function roof(x: number, y: number): number {
  return 1 + x * x + y * y;
}

type VolumeCell = { x: number; y: number; sampleX: number; sampleY: number; height: number };

export function volumeCells(count: number, sampling: Sampling): VolumeCell[] {
  const offset = sampling === "midpoint" ? 0.5 : 1;
  const cells: VolumeCell[] = [];
  for (let row = 0; row < count; row++) {
    for (let column = 0; column < count; column++) {
      const x = column / count;
      const y = row / count;
      const sampleX = (column + offset) / count;
      const sampleY = (row + offset) / count;
      cells.push({ x, y, sampleX, sampleY, height: roof(sampleX, sampleY) });
    }
  }
  return cells;
}

export function volumeEstimate(cells: ReturnType<typeof volumeCells>): number {
  return cells.reduce((sum, cell) => sum + cell.height, 0) / cells.length;
}

export function sliceBounds(sweep: Sweep, coordinate: number): readonly [number, number] {
  return sweep === "horizontal"
    ? [coordinate ** 2, 2 - coordinate]
    : [0, coordinate <= 1 ? Math.sqrt(coordinate) : 2 - coordinate];
}
