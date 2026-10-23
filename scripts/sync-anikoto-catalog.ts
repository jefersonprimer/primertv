import "dotenv/config";

import { syncAnikotoCatalog } from "../lib/anikoto-sync";
import { prisma } from "../lib/prisma";

async function main() {
  const maxPages =
    Number(process.env.ANIKOTO_SYNC_MAX_PAGES ?? 0) || undefined;

  console.log(
    `[anikoto] syncing ${maxPages ? `first ${maxPages} pages` : "full catalog"}`,
  );

  const result = await syncAnikotoCatalog({
    maxPages,
    onProgress: ({ page, totalPages, entriesSynced }) => {
      console.log(
        `[anikoto] page ${page}/${totalPages ?? "?"} - ${entriesSynced} entries synced`,
      );
    },
  });

  console.log("[anikoto] sync finished", result);
}

main()
  .catch((error) => {
    console.error("[anikoto] sync failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
