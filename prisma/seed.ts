import { prisma } from "../lib/prisma";

async function main() {
  const channels = [
    {
      title: "Globo",
      slug: "globo",
      imageUrl: "/TV_Globo_logo_(April_2025).png",
      description: "Programação da TV Globo ao vivo.",
      sources: [
        {
          title: "Globo SP",
          url: "https://s2.micineovs.com/GLOBO/index.m3u8?token=16FOTt9Ae2m8",
        },
        { title: "Globo RJ", url: "https://v2.rde.lat/globorj" },
      ],
    },
    {
      title: "SBT",
      slug: "sbt",
      imageUrl: "/Logotipo_do_SBT.svg.png",
      description: "Programação do SBT ao vivo.",
      videoUrl: "https://s2.micineovs.com/SBT/index.m3u8?token=16FOTt9Ae2m8",
      embedUrl: "https://www.youtube.com/embed/LLpNUqHVam8",
      sources: [
        {
          title: "SBT RJ",
          url: "https://s2.micineovs.com/SBT/index.m3u8?token=16FOTt9Ae2m8",
        },
        {
          title: "SBT SP",
          url: "https://redecanaistv.wales/player3/ch.php?canal=sbt",
        },
      ],
    },
    {
      title: "Record",
      slug: "record",
      imageUrl: "/Logomarca_da_Record_(2023).webp",
      description: "Programação da Rede Record ao vivo.",
      sources: [
        {
          title: "Opção 1",
          url: "https://tvacabo.top/player.html?url=https://tvconquistalrv.duckdns.org:3334/hls/tvconquistalrv.m3u8",
        },
        {
          title: "Opção 2",
          url: "https://redecanaistv.wales/player3/ch.php?canal=record",
        },
        { title: "Opção 3", url: "https://ww2.embedtv.lat/recordmg" },
      ],
    },
    {
      title: "Band",
      slug: "band",
      imageUrl: "Rede_Bandeirantes_logo_2018.svg.png",
      description: "Programação da Rede Bandeirantes ao vivo.",
    },
    {
      title: "RedeTV!",
      slug: "redetv",
      imageUrl: "/RedeTV!_2019_logo.png",
      description: "Programação da RedeTV! ao vivo.",
    },
    {
      title: "Cultura",
      slug: "cultura",
      imageUrl: "/Cultura_logo_2013.svg.png",
      description: "Programação da TV Cultura ao vivo.",
      embedUrl:
        "https://tvacabo.top/player.html?url=https://player-tvcultura.stream.uol.com.br/live/tvcultura.m3u8",
    },
    {
      title: "Gazeta",
      slug: "gazeta",
      imageUrl: "/TV_Gazeta_2026.svg.png",
      description: "Programação da TV Gazeta ao vivo.",
      embedUrl: "https://geo.dailymotion.com/player.html?video=x9xwtpy",
    },
    {
      title: "CNN Brasil",
      slug: "cnn-brasil",
      imageUrl: "/CNN_Brasil.svg",
      description: "Programação da CNN Brasil ao vivo.",
      videoUrl:
        "http://ndzcdn.asizv.click/live/c683B3095j/5873513/474.m3u8?sjwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODE1Njc5OTksImlhdCI6MTc4MTQ4MTYwMCwibmJmIjoxNzgxNDgxNjAwLCJ1c2VyIjoiYzY4M0IzMDk1aiIsInVzZXJBZ2VudCI6Ik1vemlsbGEvNS4wIChYMTE7IExpbnV4IHg4Nl82NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzE0OS4wLjAuMCBTYWZhcmkvNTM3LjM2IiwidXNlcklwIjoiMTg1LjIzNi4xODMuMTA3OjYwNzM0In0.w437QETzhgyfxPPkYcX57-vvm2Ns-Y08ynMMKZ_B_Bs&id=474&p=m3u8&aid=1781533649",
      embedUrl: "https://www.youtube.com/embed/guAL3wmQYbc",
    },
    {
      title: "GloboNews",
      slug: "globonews",
      imageUrl: "/GloboNews_2022.svg.png",
      description: "Programação da GloboNews ao vivo.",
      videoUrl:
        "http://nizcdn.asizv.click/live/360121095/Q360z4362q/478.m3u8?sjwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODE1Njc5OTksImlhdCI6MTc4MTQ4MTYwMCwibmJmIjoxNzgxNDgxNjAwLCJ1c2VyIjoiMzYwMTIxMDk1IiwidXNlckFnZW50IjoiTW96aWxsYS81LjAgKFgxMTsgTGludXggeDg2XzY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTQ5LjAuMC4wIFNhZmFyaS81MzcuMzYiLCJ1c2VySXAiOiIxODUuMjM2LjE4My4xMDc6MzYyMDgifQ.ZBlIDJHzHEpQ6DPBhJF1OqpTkZbIm5JS2UpslL9WOcE&id=478&p=m3u8&aid=1781549480",
    },
    {
      title: "Cartoon Network",
      slug: "cartoon-network",
      imageUrl: "/Cartoon_Network_2010_logo.svg.png",
      description: "Programação do Cartoon Network ao vivo.",
      sources: [
        {
          title: "Opção 1",
          url: "https://redecanaistv.wales/player3/ch.php?canal=cartoon",
        },
        { title: "Opção 2", url: "https://rdcanais.com/cartoonnetwork" },
      ],
    },
  ];

  console.log("Seeding channels...");
  for (const channel of channels as any[]) {
    const { sources, ...channelData } = channel;

    await prisma.channel.upsert({
      where: { slug: channel.slug },
      update: {
        imageUrl: channel.imageUrl,
        description: channel.description,
        videoUrl: channel.videoUrl,
        embedUrl: channel.embedUrl,
        sources: sources
          ? {
              deleteMany: {},
              create: sources,
            }
          : undefined,
      },
      create: {
        ...channelData,
        sources: sources
          ? {
              create: sources,
            }
          : undefined,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
