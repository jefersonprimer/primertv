const { chromium } = require("/home/primer/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");

const EXEC = "/home/primer/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome";

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC });
  const url = process.argv[2] || "http://localhost:3000/pt-br/animes/grand-blue";

  // Desktop
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator('button[title="Ver gráfico de avaliações"]').first().click({ timeout: 15000 });
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await page.waitForTimeout(800);

  // Abre o accordion "Como calculamos a nota" e rola até o fim
  await page.locator('button[aria-expanded="false"]').click({ timeout: 10000 });
  await page.waitForTimeout(600);
  await page.locator('[role="dialog"] .custom-scrollbar').evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(600);
  await page.locator('[role="dialog"]').screenshot({ path: "/tmp/opencode/modal-bottom.png" });

  await page.close();

  // Mobile
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await mobile.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await mobile.locator('button[title="Ver gráfico de avaliações"]').first().click({ timeout: 15000 });
  await mobile.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await mobile.waitForTimeout(800);
  await mobile.screenshot({ path: "/tmp/opencode/modal-mobile.png" });
  await mobile.close();

  await browser.close();
})();
