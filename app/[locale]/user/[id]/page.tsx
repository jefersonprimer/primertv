import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateUniqueUsername } from "@/lib/username";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { UserProfileClient } from "./UserProfileClient";

interface UserProfilePageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: UserProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const user =
    (await prisma.user.findUnique({
      where: { username: id },
      select: { name: true, username: true },
    })) ||
    (await prisma.user.findUnique({
      where: { id: id },
      select: { name: true, username: true },
    }));

  if (!user) {
    return { title: "Usuário não encontrado - PrimerTv" };
  }

  const displayName = user.username ? `@${user.username}` : user.name;

  return {
    title: `Perfil de ${user.name} (${displayName}) - PrimerTv`,
    description: `Confira o perfil público, watchlist, histórico e conquistas de ${user.name} no PrimerTv.`,
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { locale, id } = await params;

  // Search by username first, then fallback to id
  const userSelect = {
    id: true,
    name: true,
    username: true,
    image: true,
    imageBackground: true,
    createdAt: true,
    watchlistItems: {
      take: 40,
      orderBy: { createdAt: "desc" as const },
      include: {
        anime: {
          select: {
            id: true,
            slug: true,
            title: true,
            imageUrl: true,
            score: true,
            latestEpisodeNumber: true,
            genres: true,
          },
        },
        series: {
          select: {
            id: true,
            slug: true,
            title: true,
            imageUrl: true,
            score: true,
          },
        },
        manga: {
          select: {
            id: true,
            slug: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    },
    watchHistory: {
      take: 30,
      orderBy: { watchedAt: "desc" as const },
      include: {
        episode: {
          select: {
            id: true,
            publicId: true,
            slug: true,
            number: true,
            title: true,
            imageUrl: true,
            season: {
              select: {
                number: true,
                anime: {
                  select: {
                    id: true,
                    slug: true,
                    title: true,
                    imageUrl: true,
                    genres: true,
                  },
                },
              },
            },
          },
        },
      },
    },
    customLists: {
      take: 12,
      orderBy: { createdAt: "desc" as const },
      include: {
        _count: {
          select: { items: true },
        },
      },
    },
    animeRatings: {
      take: 16,
      orderBy: { updatedAt: "desc" as const },
      include: {
        anime: {
          select: {
            id: true,
            slug: true,
            title: true,
            imageUrl: true,
          },
        },
      },
    },
    _count: {
      select: {
        watchlistItems: true,
        watchHistory: true,
        customLists: true,
        animeRatings: true,
      },
    },
  };

  let targetUser = await prisma.user.findUnique({
    where: { username: id },
    select: userSelect,
  });

  if (!targetUser) {
    targetUser = await prisma.user.findUnique({
      where: { id: id },
      select: userSelect,
    });
  }

  if (!targetUser) {
    notFound();
  }

  // Auto-generate username if user doesn't have one yet
  let activeUsername = targetUser.username;
  if (!activeUsername) {
    activeUsername = await generateUniqueUsername(targetUser.name || "user");
    await prisma.user.update({
      where: { id: targetUser.id },
      data: { username: activeUsername },
    });
  }

  // If user accessed via raw CUID id, redirect to canonical /user/[username]
  if (id === targetUser.id && activeUsername) {
    redirect(`/${locale}/user/${activeUsername}`);
  }

  // Check if active user is viewing their own profile
  const currentSession = await getSession();
  const isOwner = currentSession?.user?.id === targetUser.id;
  const isAdmin = currentSession?.user?.role === "admin";

  const memberSince = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(targetUser.createdAt));

  return (
    <UserProfileClient
      locale={locale}
      targetUser={targetUser}
      activeUsername={activeUsername}
      isOwner={isOwner}
      isAdmin={isAdmin}
      memberSince={memberSince}
    />
  );
}
