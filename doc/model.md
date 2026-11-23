# Model — Double Integral Builder

## Volume

The roof is `z = 1 + x² + y²` over the unit square. An n-by-n grid gives each column a base area of `1/n²`. The column height is the roof height evaluated at its midpoint or upper-right corner. The model sums the column volumes and compares the result with the exact volume `5/3`.

## Bounds

Horizontal slices run from `x = y²` to `x = 2 − y` for `0 ≤ y ≤ 1`. Vertical slices start at `y = 0` and end at `√x` on `[0,1]` or `2 − x` on `[1,2]`. The area in either order is `7/6`.
