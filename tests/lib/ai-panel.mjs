/** The AI panel is open by default; open it only if it is hidden. */
export async function openPanel(page) {
  if (await page.locator(".ai-panel").isHidden()) await page.click(".ai-toggle");
}
