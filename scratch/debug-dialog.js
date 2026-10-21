const { chromium } = require("/home/primer/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");
const EXEC = "/home/primer/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";
(async () => {
  const browser = await chromium.launch({ executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3000/pt-br/animes/grand-blue", { waitUntil: "networkidle", timeout: 60000 });
  await page.locator('button[title="Ver gráfico de avaliações"]').first().click({ timeout: 15000 });
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await page.waitForTimeout(800);
  const buttons = await page.locator('[role="dialog"] button').evaluateAll((els) =>
    els.map((el) => ({ text: el.textContent?.trim().slice(0, 40), expanded: el.getAttribute("aria-expanded"), visible: el.getBoundingClientRect().height > 0 }))
  );
  console.log(JSON.stringify(buttons, null, 2));
  await browser.close();
})();
