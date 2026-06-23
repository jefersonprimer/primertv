import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/channels",
        destination: "/livetv",
        permanent: true,
      },
      {
        source: "/channels/:slug*",
        destination: "/livetv/:slug*",
        permanent: true,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "animesonlinecc.to",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
      {
        protocol: "https",
        hostname: "s4.anilist.co",
      },
      {
        protocol: "https",
        hostname: "animesonline.io",
      },
      {
        protocol: "https",
        hostname: "animesonline.cloud",
      },
      {
        protocol: "https",
        hostname: "otakuplay.com.br",
      },
      {
        protocol: "https",
        hostname: "topanimes.net",
      },
      {
        protocol: "http",
        hostname: "goyabu.io",
      },
      {
        protocol: "https",
        hostname: "animesonlines.net",
      },
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
      },
      {
        protocol: "https",
        hostname: "megacine.boats",
      },
      {
        protocol: "https",
        hostname: "filme4you.com",
      },
      {
        protocol: "https",
        hostname: "suaideiapodevirarumfilme.com",
      },
      {
        protocol: "https",
        hostname: "vizer.life",
      },
      {
        protocol: "https",
        hostname: "vizer.tv",
      },
      {
        protocol: "https",
        hostname: "prodigoofilme.com",
      },
      {
        protocol: "https",
        hostname: "yesfilmesgratis.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "mangalivre.to",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "static.tvmaze.com",
      },
      {
        protocol: "https",
        hostname: "startflix.co",
      },
      {
        protocol: "https",
        hostname: "mangalivre.blog",
      },
      {
        protocol: "https",
        hostname: "mangaonline.blue",
      },
      {
        protocol: "https",
        hostname: "noveflixtv.com",
      },
      {
        protocol: "https",
        hostname: "maxnovelas.com",
      },
      {
        protocol: "https",
        hostname: "upnovelas.com",
      },
      {
        protocol: "https",
        hostname: "noveflix.net",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "static.sbt.com.br",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**.claudeassets.com",
      },
    ],
  },
};

export default nextConfig;
