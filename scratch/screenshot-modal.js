const { chromium } = require("/home/primer/.npm/_npx/e41f203b7505f1fb/node_modules/playwright");

(async () => {
  const browser = await chromium.launch({ executablePath: "/home/primer/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const url = process.argv[2] || "http://localhost:3000/pt-br/animes/grand-blue";
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });

  // Abre o modal de estatísticas (botão com o título "Ver gráfico de avaliações")
  const trigger = page.locator('button[title="Ver gráfico de avaliações"]');
  await trigger.first().click({ timeout: 15000 });
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await page.waitForTimeout(1200);

  const out = process.argv[3] || "/tmp/opencode/modal.png";
  await page.locator('[role="dialog"]').screenshot({ path: out });

  // Também captura o texto renderizado para conferir os números
  const text = await page.locator('[role="dialog"]').innerText();
  console.log(text);

  await browser.close();
})();
