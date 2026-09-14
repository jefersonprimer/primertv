-- AlterTable
ALTER TABLE "Anime" ADD COLUMN "sequelMalId" INTEGER,
ADD COLUMN "prequelMalId" INTEGER,
ADD COLUMN "sequelAnilistId" INTEGER,
ADD COLUMN "prequelAnilistId" INTEGER;

-- CreateIndex
CREATE INDEX "Anime_sequelMalId_idx" ON "Anime"("sequelMalId");

-- CreateIndex
CREATE INDEX "Anime_prequelMalId_idx" ON "Anime"("prequelMalId");

-- CreateIndex
CREATE INDEX "Anime_sequelAnilistId_idx" ON "Anime"("sequelAnilistId");

-- CreateIndex
CREATE INDEX "Anime_prequelAnilistId_idx" ON "Anime"("prequelAnilistId");
