# AGENTS.md — Double Integral Builder

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Double Integral Builder (`double-integral-builder`) is a SceneryStack simulation scaffolded from SceneryStackTemplate.

## Key files

| File | Purpose |
|---|---|
| `src/DoubleIntegralBuilderColors.ts` | All `ProfileColorProperty` instances |
| `src/DoubleIntegralBuilderConstants.ts` | Named numeric constants |
| `src/DoubleIntegralBuilderNamespace.ts` | Namespace for color property names |
| `src/i18n/StringManager.ts` | Singleton localized string accessor |
| `src/common/DoubleIntegralBuilderPanel.ts` | Pre-themed `Panel` wrapper |
| `src/common/DoubleIntegralBuilderButtonOptions.ts` | Flat button / combo-box option bundles |
| `src/volume/VolumeScreen.ts` | Screen wrapper |
| `src/volume/model/VolumeModel.ts` | Simulation state and logic |
| `src/volume/view/VolumeScreenView.ts` | Visual nodes, layout, a11y wiring |
| `src/bounds/BoundsScreen.ts` | Screen wrapper |
| `src/bounds/model/BoundsModel.ts` | Simulation state and logic |
| `src/bounds/view/BoundsScreenView.ts` | Visual nodes, layout, a11y wiring |

## Compliance carve-outs

None yet.

## Testing

See the shared Vitest setup (`vitest.config.ts`, `tests/setup.ts`) and `tests/memory-leak.test.ts` for disposal coverage. Add sim-specific unit tests under `tests/` as physics and UI logic land.

## Accessibility

Follow [Baton/ACCESSIBILITY.md](https://github.com/OpenLyceum/Baton/blob/main/ACCESSIBILITY.md): PDOM names, per-screen `*ScreenSummaryContent`, and keyboard-help content. Document any intentional deviations under Compliance carve-outs.
