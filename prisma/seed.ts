/**
 * Seed de avaliações da comunidade.
 *
 * Gera votos realistas para que o painel de estatísticas
 * (components/StarRatingModal.tsx) possa ser avaliado com dados reais.
 *
 * Uso:
 *   npx tsx prisma/seed.ts            # cria/atualiza os votos de demonstração
 *   npx tsx prisma/seed.ts --clean    # remove apenas os dados de demonstração
 *
 * Todos os usuários criados usam o e-mail "demo+ratings@primer.tv" e podem ser
 * removidos com segurança pelo comando --clean.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import pg from "pg";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEMO_EMAIL = "demo+ratings@primer.tv";
const DEMO_EMAIL_DOMAIN = "@demo.primer.tv";

const BACKUP_FILE = join(process.cwd(), "prisma", "seed-score-backup.json");

const MAX_STARS = 10;

/** Lê o backup das notas originais dos animes (usado pelo --clean). */
function readScoreBackup(): Record<string, number | null> {
  if (!existsSync(BACKUP_FILE)) return {};
  try {
    return JSON.parse(readFileSync(BACKUP_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function writeScoreBackup(backup: Record<string, number | null>) {
  writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2), "utf-8");
}

/** Gerador pseudoaleatório determinístico (mulberry32). */
function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller: transforma números uniformes em uma distribuição normal. */
function gaussian(random: () => number, mean: number, deviation: number) {
  const u = Math.max(random(), Number.EPSILON);
  const v = random();
  return mean + deviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Converte uma nota real (0-10) em uma nota inteira de 1-10.
 * Usuários tendem a se expressar nas extremes, então aplicamos um leve
 * viés de "arredondamento" para longe do centro.
 */
function toVoteScore(realScore: number, random: () => number) {
  const noise = gaussian(random, 0, 0.85);
  const rounded = Math.round(clamp(realScore + noise, 1, MAX_STARS));
  return clamp(rounded, 1, MAX_STARS);
}

async function main() {
  const shouldClean = process.argv.includes("--clean");

  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não configurada.");
  }

  const pool = new pg.Pool({ connectionString, max: 5 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    if (shouldClean) {
      const demoUsers = await prisma.user.findMany({
        where: {
          OR: [
            { id: { startsWith: "demo-rater-" } },
            { email: { endsWith: DEMO_EMAIL_DOMAIN } },
            { email: DEMO_EMAIL },
          ],
        },
        select: { id: true },
      });
      const demoUserIds = demoUsers.map((user) => user.id);

      const { count: deletedRatings } = await prisma.animeRating.deleteMany({
        where: { userId: { in: demoUserIds } },
      });
      const { count: deletedUsers } = await prisma.user.deleteMany({
        where: { id: { in: demoUserIds } },
      });

      // Restaura as notas originais dos animes afetados
      const backup = readScoreBackup();
      let restored = 0;
      for (const [animeId, score] of Object.entries(backup)) {
        await prisma.anime.update({
          where: { id: animeId },
          data: { score },
        });
        restored++;
      }
      if (existsSync(BACKUP_FILE)) {
        writeFileSync(BACKUP_FILE, "{}", "utf-8");
      }

      console.log(
        `Limpeza concluída: ${deletedRatings} avaliações e ${deletedUsers} usuários de demonstração removidos. ` +
          `${restored} notas de anime restauradas.`,
      );
      return;
    }

    const shouldUpdateScores = process.argv.includes("--update-scores");

    const random = createRandom(20260221);

    // ------------------------------------------------------------------
    // Usuários de demonstração
    // ------------------------------------------------------------------
    const DEMO_USERS = 220;

    const hashedPassword = await bcrypt.hash(
      `demo-${Math.random().toString(36).slice(2)}`,
      10,
    );

    const demoUsers: { id: string; weight: number }[] = [];

    for (let i = 0; i < DEMO_USERS; i++) {
      const id = `demo-rater-${String(i + 1).padStart(4, "0")}`;
      const email =
        i === 0 ? DEMO_EMAIL : `demo-rater-${String(i + 1).padStart(4, "0")}${DEMO_EMAIL_DOMAIN}`;

      // Distribuição de maturidade: muitos recém-criados, poucosveteranos
      const ageRoll = random();
      const accountAgeDays =
        ageRoll < 0.25
          ? Math.floor(random() * 2) // < 2 dias  -> peso 0.00 / 0.25
          : ageRoll < 0.5
            ? Math.floor(2 + random() * 12) // 2-14 dias -> peso 0.25 / 0.50
            : ageRoll < 0.85
              ? Math.floor(14 + random() * 60) // 14-74 dias -> peso 0.50 / 1.00
              : Math.floor(74 + random() * 700); // +74 dias -> peso 1.00+

      const activity = Math.floor(random() * random() * 40);
      const createdAt = new Date(
        Date.now() - accountAgeDays * 24 * 60 * 60 * 1000,
      );

      const user = await prisma.user.upsert({
        where: { email },
        update: { createdAt, updatedAt: createdAt },
        create: {
          id,
          name: `Rater ${String(i + 1).padStart(4, "0")}`,
          username: `rater-${String(i + 1).padStart(4, "0")}`,
          email,
          password: hashedPassword,
          image: null,
          createdAt,
          updatedAt: createdAt,
        },
        select: { id: true, createdAt: true },
      });

      // Peso de confiança (mesmas regras de lib/rating/trust.ts)
      let weight: number;
      if (accountAgeDays < 1) weight = 0;
      else if (accountAgeDays < 7) weight = 0.25;
      else if (accountAgeDays < 30) weight = 0.5;
      else if (activity >= 20) weight = 1.25;
      else if (activity >= 5) weight = 1.1;
      else weight = 1.0;

      demoUsers.push({ id: user.id, weight });
    }

    console.log(`${demoUsers.length} usuários de demonstração prontos.`);

    // ------------------------------------------------------------------
    // Animes popularmente votados
    // ------------------------------------------------------------------
    const animes = await prisma.anime.findMany({
      where: { score: { not: null } },
      select: {
        id: true,
        title: true,
        score: true,
        members: true,
        popularity: true,
      },
      orderBy: [{ members: { sort: "desc", nulls: "last" } }],
      take: 60,
    });

    if (animes.length === 0) {
      console.log("Nenhum anime com nota encontrada — nada a fazer.");
      return;
    }

    // ------------------------------------------------------------------
    // Geração dos votos
    // ------------------------------------------------------------------
    const ratings: {
      userId: string;
      animeId: string;
      score: number;
      weight: number;
    }[] = [];

    for (const anime of animes) {
      const baseScore = anime.score ?? 7;

      // Volume de votos proporcional à popularidade do anime
      const popularity = Math.max(anime.members ?? 1000, anime.popularity ?? 100);
      const voteCount = clamp(
        Math.round((popularity / 12000) * 30 + random() * 40 + 8),
        6,
        320,
      );

      // Cada anime tem uma "personalidade" de espalhamento
      const deviation = 0.9 + random() * 0.9;
      const bias = (random() - 0.45) * 0.9;

      const voters = new Set<string>();
      while (voters.size < voteCount && voters.size < demoUsers.length) {
        voters.add(demoUsers[Math.floor(random() * demoUsers.length)].id);
      }

      for (const userId of voters) {
        const user = demoUsers.find((candidate) => candidate.id === userId);
        if (!user) continue;

        const realScore = clamp(
          baseScore + bias + gaussian(random, 0, deviation),
          1,
          MAX_STARS,
        );

        ratings.push({
          userId,
          animeId: anime.id,
          score: toVoteScore(realScore, random),
          weight: user.weight,
        });
      }
    }

    // Persistência (upsert por userId + animeId)
    let created = 0;
    for (const rating of ratings) {
      const result = await prisma.animeRating.upsert({
        where: {
          userId_animeId: { userId: rating.userId, animeId: rating.animeId },
        },
        update: { score: rating.score, weight: rating.weight },
        create: rating,
        select: { id: true },
      });
      if (result) created++;
    }

    console.log(`${created} avaliações gravadas.`);

    // ------------------------------------------------------------------
    // Recalcula a nota bayesiana de cada anime afetado
    // (opcional — o campo "Anime.score" guarda a nota original da fonte)
    // ------------------------------------------------------------------
    const affected = new Set(ratings.map((rating) => rating.animeId));

    if (!shouldUpdateScores) {
      console.log(
        `\n${affected.size} animes receberam votos. Use --update-scores para também sincronizar o campo "Anime.score" com a nota bayesiana.`,
      );
      await printSummary(prisma);
      return;
    }

    const MINIMUM_WEIGHTED_VOTES = 10;
    const DEFAULT_GLOBAL_AVERAGE = 7.0;

    const globalStats = await prisma.animeRating.aggregate({
      _sum: { score: true },
      _count: { id: true },
    });
    const globalAverage =
      globalStats._count.id > 0 && globalStats._sum.score !== null
        ? globalStats._sum.score / globalStats._count.id
        : DEFAULT_GLOBAL_AVERAGE;

    const backup = readScoreBackup();

    for (const animeId of affected) {
      const animeRatings = await prisma.animeRating.findMany({
        where: { animeId },
        select: { score: true, weight: true },
      });
      if (animeRatings.length === 0) continue;

      let weightedSum = 0;
      let weightedVotes = 0;
      for (const rating of animeRatings) {
        const weight = rating.weight ?? 1;
        weightedSum += rating.score * weight;
        weightedVotes += weight;
      }

      const realAverage = weightedVotes > 0 ? weightedSum / weightedVotes : 0;
      const bayesianScore =
        (weightedVotes / (weightedVotes + MINIMUM_WEIGHTED_VOTES)) * realAverage +
        (MINIMUM_WEIGHTED_VOTES / (weightedVotes + MINIMUM_WEIGHTED_VOTES)) *
          globalAverage;

      const anime = await prisma.anime.findUnique({
        where: { id: animeId },
        select: { score: true },
      });
      if (!(animeId in backup)) {
        backup[animeId] = anime?.score ?? null;
      }

      await prisma.anime.update({
        where: { id: animeId },
        data: { score: Math.round(bayesianScore * 10) / 10 },
      });
    }

    writeScoreBackup(backup);

    console.log(
      `Notas bayesianas recalculadas para ${affected.size} animes (média global: ${globalAverage.toFixed(2)}).`,
    );

    await printSummary(prisma);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function printSummary(prisma: PrismaClient) {
  const total = await prisma.animeRating.count();
  console.log(`\nTotal de avaliações na plataforma: ${total}`);
  console.log(
    `Para remover os dados de demonstração: npx tsx prisma/seed.ts --clean`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
