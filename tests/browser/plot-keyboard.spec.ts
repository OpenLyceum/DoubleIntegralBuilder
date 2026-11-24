import { expect, test } from "@playwright/test";

test("the slice grip follows the selected sweep direction", async ({ page }) => {
  await page.goto("/?ea&screens=2");
  const grip = page.getByRole("application", { name: "Slice grip", exact: true });
  const y = page.getByRole("slider", { name: "Slice y", exact: true });

  await grip.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(grip).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(y).toHaveAttribute("aria-valuenow", "0.45");
  await page.keyboard.press("ArrowUp");
  await expect(y).toHaveAttribute("aria-valuenow", "0.5");

  await page.getByRole("button", { name: "Slice direction", exact: true }).press("Enter");
  await grip.press("Shift+ArrowRight");
  await expect(page.getByRole("slider", { name: "Slice x", exact: true })).toHaveAttribute("aria-valuenow", "0.76");
  await expect(grip).toBeFocused();
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
