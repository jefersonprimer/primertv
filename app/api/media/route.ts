import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function fetchMediaItems(
  category: "popular" | "recent" | "dubbed" | string = "recent",
  type: "anime" | "series" | "movie" = "anime",
  limit: number = 12
) {
  let items: any[] = [];

  if (type === "anime") {
    let whereClause: any = { bannerUrl: { not: "none" } };
    let orderByClause: any = { createdAt: "desc" };

    if (category === "dubbed") {
      whereClause.isDubbed = true;
    } else if (category === "popular") {
      orderByClause = [
        { score: "desc" },
        { createdAt: "desc" },
      ];
    }

    items = await prisma.anime.findMany({
      where: whereClause,
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        bannerUrl: true,
        isDubbed: true,
        isSubtitled: true,
        rating: true,
        score: true,
        year: true,
        genres: true,
      },
      orderBy: orderByClause,
      take: limit,
    });
  } else if (type === "series") {
    const orderByClause: any =
      category === "popular"
        ? [{ score: "desc" }, { createdAt: "desc" }]
        : { createdAt: "desc" };

    items = await prisma.series.findMany({
      where: { bannerUrl: { not: "none" } },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        bannerUrl: true,
        rating: true,
        score: true,
        genres: true,
      },
      orderBy: orderByClause,
      take: limit,
    });
  } else if (type === "movie") {
    const orderByClause: any =
      category === "popular"
        ? [{ score: "desc" }, { createdAt: "desc" }]
        : { createdAt: "desc" };

    items = await prisma.movie.findMany({
      where: { bannerUrl: { not: "none" } },
      select: {
        id: true,
        slug: true,
        title: true,
        imageUrl: true,
        bannerUrl: true,
        rating: true,
        score: true,
        genres: true,
      },
      orderBy: orderByClause,
      take: limit,
    });
  }

  return items.map((item) => ({ ...item, type }));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "recent";
    const type = (searchParams.get("type") || "anime") as "anime" | "series" | "movie";
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 12, 1), 30);

    const items = await fetchMediaItems(category, type, limit);

    return NextResponse.json(items, {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Erro na rota /api/media:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao carregar mídias" },
      { status: 500, headers: corsHeaders }
    );
  }
}
