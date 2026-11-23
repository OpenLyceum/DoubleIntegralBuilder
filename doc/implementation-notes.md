# Implementation notes — Double Integral Builder

The screen packages are volume, bounds. Each model owns its reactive controls and resets them through the standard Reset All button. The pure calculations live in `src/common/model/IntegralMath.ts` and are exercised by model tests.

Volume projects the columns, roof wireframe, and axes into the Scenery canvas. A top-down inset shows the sample points independently of the view angle. Bounds uses a flat plot and keeps a separate slice position for each direction.

The shared Scenery view arranges the plot and controls, registers the live accessible screen summary, and reads the active color profile. Screen-specific text comes from `StringManager`.
