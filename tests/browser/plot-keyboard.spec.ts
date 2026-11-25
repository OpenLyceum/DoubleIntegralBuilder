import { expect, test } from "@playwright/test";

test("the slice grip moves along either arrow axis and stays inside the region", async ({ page }) => {
  await page.goto("/?ea&screens=2");
  const grip = page.getByRole("application", { name: "Slice grip", exact: true });
  const slice = page.getByRole("slider", { name: "Slice", exact: true });

  await grip.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(grip).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(slice).toHaveAttribute("aria-valuenow", "0.5");
  await page.keyboard.press("Shift+ArrowRight");
  await expect(slice).toHaveAttribute("aria-valuenow", "0.51");
  await expect(slice).toHaveAttribute("aria-valuetext", "y = 0.51");

  // Vertical slices across the same region run over 0 ≤ x ≤ 2, and the inner bounds switch at x = 1.
  const direction = page.getByRole("button", { name: /^Slice direction/ });
  await direction.press("Enter");
  await page.getByRole("option", { name: "Vertical" }).press("Enter");
  await expect(slice).toHaveAttribute("aria-valuetext", "x = 1.02");
  await expect(page.getByText(/x = 1\.02:\s+0 ≤ y ≤ 0\.98/).first()).toBeAttached();
  await expect(grip).not.toBeFocused();
});

test("the solid rotates directly with coarse and fine keyboard steps", async ({ page }) => {
  await page.goto("/?ea&screens=1");
  const solid = page.getByRole("application", { name: "Rotate the solid", exact: true });
  const angle = page.getByRole("slider", { name: "View angle", exact: true });

  await solid.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(solid).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(angle).toHaveAttribute("aria-valuenow", "-40");
  await page.keyboard.press("Shift+ArrowLeft");
  await expect(angle).toHaveAttribute("aria-valuenow", "-39");
  await expect(solid).toBeFocused();
});
