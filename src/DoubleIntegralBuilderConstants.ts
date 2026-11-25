/**
 * DoubleIntegralBuilderConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Model / math values note their unit in a comment on each value.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in DoubleIntegralBuilderColors.ts, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 *
 * PLOT_* matches Circulation Lab and Contour Explorer LabView copies — keep
 * those in sync.
 */

import DoubleIntegralBuilderNamespace from "./DoubleIntegralBuilderNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/**
 * Corner radius shared by control panels and dialogs.
 * @public
 */
export const PANEL_CORNER_RADIUS = 6;

/** Lab plot canvas width (px). */
export const PLOT_WIDTH = 590;

/** Lab plot canvas height (px). */
export const PLOT_HEIGHT = 420;

/** Inner margin from plot edge to axis content (px). */
export const PLOT_MARGIN = 23;

/** Control panel minimum width (px). */
export const PANEL_MIN_WIDTH = 325;

/** Gap between plot and control panel (px). */
export const PANEL_GAP = 18;

/** Gap between title and plot/panel row (px). */
export const TITLE_TO_PLOT_GAP = 14;

// ── Model / interaction ─────────────────────────────────────────────────────────

/** Duration of a full bounds sweep animation (s). */
export const SWEEP_SECONDS = 4;

/** Default Riemann-column counts on the Volume screen. */
export const DEFAULT_COLUMNS = 4;
export const DEFAULT_ROWS = 4;

/** Column/row slider range. */
export const GRID_COUNT_MIN = 1;
export const GRID_COUNT_MAX = 12;

/** Default Simpson panels for area integrals. */
export const SIMPSON_PANELS = 64;

DoubleIntegralBuilderNamespace.register("DoubleIntegralBuilderConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  PLOT_WIDTH,
  PLOT_HEIGHT,
  PLOT_MARGIN,
  PANEL_MIN_WIDTH,
  PANEL_GAP,
  TITLE_TO_PLOT_GAP,
  SWEEP_SECONDS,
  DEFAULT_COLUMNS,
  DEFAULT_ROWS,
  GRID_COUNT_MIN,
  GRID_COUNT_MAX,
  SIMPSON_PANELS,
});
