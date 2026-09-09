ALTER TABLE "Season"
ADD COLUMN "anilistId" INTEGER,
ADD COLUMN "malId" INTEGER;

CREATE INDEX "Season_malId_idx" ON "Season"("malId");
CREATE INDEX "Season_anilistId_idx" ON "Season"("anilistId");
