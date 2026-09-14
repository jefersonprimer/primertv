import { NextResponse } from "next/server";
import { fetchHeroItems } from "../hero/route";
import { fetchMediaItems } from "../media/route";

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "anime") as "anime" | "series" | "movie";

    const [hero, popular, recent, dubbed] = await Promise.all([
      fetchHeroItems(type, 6),
      fetchMediaItems("popular", type, 12),
      fetchMediaItems("recent", type, 12),
      fetchMediaItems("dubbed", type, 12),
    ]);

    return NextResponse.json(
      {
        hero,
        popular,
        recent,
        dubbed,
      },
      {
        headers: {
          ...corsHeaders,
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Erro na rota /api/home:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor ao carregar feed da home" },
      { status: 500, headers: corsHeaders }
    );
  }
}
