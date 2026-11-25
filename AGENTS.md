# AGENTS.md — Double Integral Builder

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Double Integral Builder (`double-integral-builder`) builds double integrals from Riemann sums and iterated integrals.

- **Volume:** columns under z = f(x, y) over the unit square.
  - The integrand comes from a combo box: 1 + x² + y², 4xy, 2 sin(πx) sin(πy), 2 − x − y, or 1.
  - Separate m × n column counts.
  - The sample point (four corners or the midpoint) comes from a combo box.
  - The solid turns by drag, flick or slider.
  - A floor plan shows the sample points, and a log–log inset plots |error| against n for n × n columns, so the midpoint's second order stands out.
- **Bounds:** a region from a combo box: between x = y² and x = 2 − y, the triangle 0 ≤ y ≤ x ≤ 1, between y = x² and y = √x, or the quarter disk.
  - Choose an integrand and the slice direction.
  - Each order is written as an iterated integral; the parabola-and-line region needs two pieces for vertical slices.
  - The slice runs over a fraction of the outer range, so it never leaves the region. Move it by grip, slider or tap, or press Sweep.
  - Readouts give the slice bounds, the inner integral at the slice, the integral accumulated so far (the swept part is shaded), and the whole integral.

## Key files

| File | Purpose |
|---|---|
| `src/common/model/IntegralMath.ts` | Integrand library with exact square volumes, sample points and `volumeCells`, the region library (pieces for both orders with bound labels), `sliceBounds`, `innerIntegral`, `accumulated`, `total`, `notation` |
| `src/volume/view/VolumeScreenView.ts` | Projected columns, roof wireframe, floor plan, error inset, rotation with inertia |
| `src/bounds/view/BoundsScreenView.ts` | Region, swept area, slice and grip, iterated-integral readouts |
| `src/common/LabView.ts` | Shared layout and controls (this sim's fork adds `PlotGrip`, `addPlotDrag`, `addPlotKeyboardDrag`, a slider `display` mapping), plus `comboBox` and `button` |
| `src/common/Projection.ts` | Orthographic projection, shared with Contour Explorer and Circulation Lab |

## Compliance carve-outs

None yet.

## Testing

See the shared Vitest setup (`vitest.config.ts`, `tests/setup.ts`) and `tests/memory-leak.test.ts` for disposal coverage. Add sim-specific unit tests under `tests/` as physics and UI logic land.

## Accessibility

Follow [Baton/ACCESSIBILITY.md](https://github.com/OpenLyceum/Baton/blob/main/ACCESSIBILITY.md): PDOM names, per-screen `*ScreenSummaryContent`, and keyboard-help content. Document any intentional deviations under Compliance carve-outs.
