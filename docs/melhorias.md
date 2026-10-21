# Melhorias de SEO — PrimerTV

Diagnóstico feito sem alterar código. Cada item aponta o problema, onde está no
projeto e a ação recomendada. Prioridades: 🔴 crítico → 🟠 alto → 🟡 médio.

**O que já está bom:**
- Renderização server-side na home e na maioria das páginas (Server Components).
- `revalidate = 3600` nas páginas de detalhe (ISR, bom para crawl budget).
- Slugs amigáveis em todas as rotas (`/animes/[slug]`, `/series/[slug]`, etc.).
- Metadados localizados via `getTranslations` em páginas de detalhe.
- Redirect de CUID → username canônico em `app/[locale]/user/[id]/page.tsx:175`.
- Middleware `proxy.ts` com `next-intl` (locale prefixado, rota limpa).

---

## 🔴 Críticos (fazem o SEO não funcionar de verdade)

### 1. Não existe `robots.txt` nem `sitemap.xml`
- `public/` não contém robots.txt; não há `app/robots.ts` nem `app/sitemap.ts`.
- O matcher do `proxy.ts` (`/((?!api|_next|_vercel|.*\\..*).*)`) já ignora arquivos
  com extensão, então basta adicionar os arquivos — eles serão servidos direto.
- **Ação:** criar `app/robots.ts` (permitir tudo, bloquear `/admin`, `/api`,
  `/watchlist`, `/history`, `/search`, `/profile`, `/lists`, `/login`, `/signup`,
  `/forgot-password`; apontar para o sitemap) e `app/sitemap.ts` gerando URLs de
  todas as páginas públicas × 6 idiomas, incluindo animes/séries/filmes/mangás/novelas
  do banco (com `lastModified` quando disponível).

### 2. Sem `canonical` e sem `hreflang` (conteúdo duplicado entre idiomas)
- Site tem 6 locales (`pt-br`, `en`, `es`, `fr`, `de`, `ar`) com `localePrefix: 'always'`
  (`i18n/routing.ts`), mas nenhuma página declara `alternates.canonical` ou
  `languages` — grep no projeto inteiro não encontra `alternates`, `canonical`
  nem `hreflang`.
- O Google indexa as 6 versões como páginas duplicatas competindo entre si.
- **Ação:** no `generateMetadata` do `app/[locale]/layout.tsx:16` (e nas páginas
  que geram metadata própria), adicionar:
  - `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL)`
  - `alternates.canonical` = URL absoluta da página no locale atual
  - `alternates.languages` = mapa `{ pt-br, en, es, fr, de, ar, x-default }`
- Como a maioria das páginas usa os mesmos params de rota, dá para centralizar
  isso num helper (ex.: `lib/seo.ts`) reaproveitado por todas.

### 3. Páginas pessoais/indexáveis sem `noindex`
- Nenhuma página usa `robots: { robots: "noindex" }` (grep por `noindex` = 0).
- Páginas que não devem ser indexadas e hoje estão:
  `/search`, `/watchlist`, `/history`, `/lists`, `/lists/[id]`, `/profile`,
  `/login`, `/signup`, `/forgot-password`, páginas de usuário (`/user/[id]`).
- Variantes com querystring de player também: `/watch/[publicId]?player=...&source=...`
  (`app/[locale]/watch/[publicId]/[slug]/page.tsx:35-40`) geram URLs infinitas.
- **Ação:** adicionar `robots: { index: false, follow: true }` nessas páginas;
  nas de detalhe, `alternates.canonical` apontando para a URL limpa (sem query).

### 4. `metadataBase` ausente → Open Graph inconsistente
- Só 10 páginas têm `openGraph` (detalhe de animes/séries/filmes/novelas/watch);
  sem `metadataBase` o Next não resolve URLs relativas, e não há `og:url`,
  `og:type`, `og:locale` nem `twitter:card` de forma consistente (só watch e
  novelas-episode têm twitter).
- **Ação:** definir `metadataBase` no layout raiz e um `openGraph` padrão
  (site_name, locale `pt_BR`, type `website`) + `twitter: { card: "summary_large_image" }`.

### 5. Não existe página `not-found` (404)
- Não há `app/not-found.tsx` nem `app/[locale]/not-found.tsx`.
- 404 default do Next = sem metadados, sem links de volta, ruim para usuário e
  para o crawl.
- **Ação:** criar um `not-found.tsx` com título próprio, descrição e links para
  as seções principais.

---

## 🟠 Alto impacto

### 6. Zero dados estruturados (JSON-LD)
- Nenhum `application/ld+json` no projeto (grep por `schema.org` = 0).
- **Ação por tipo de página:**
  - Home: `WebSite` + `SearchAction` (aponta para `/search?q={query}`).
  - `/animes/[slug]`, `/series/[slug]`: `TVSeries` (com `containsSeason`/`episode`)
    ou `Movie` para filmes; usar também `InteractionCounter` para rating
    (padrão Jikan/MyAnimeList facilita rich results).
  - `/watch/[publicId]/[slug]`: `VideoObject` (name, thumbnailUrl, uploadDate,
    duration, description).
  - `/mangas/[slug]` + `/read/...`: `Book`/`ComicStory`.
  - Todas as páginas de listagem/detalhe: `BreadcrumbList`.
- Isso é o que habilita rich results (vídeo, FAQ, breadcrumbs) no Google.

### 7. Título da home é keyword stuffing e longo demais
- `messages/pt-br.json` → `Layout.metaTitle`:
  `"primertv - Assista a Animes Online, assista a Séries Online, assista a Filmes Online, leia Mangás Online"` (~100 chars, será truncado; marca em minúscula; repetição "assista a... assista a...").
- **Ação:** encurtar para algo como
  `PrimerTV — Animes, Séries, Filmes e Mangás Online em HD`
  e aplicar `title: { template: "%s | PrimerTV" }` no layout para normalizar
  todas as páginas filhas. Repetir a correção nos 6 arquivos de `messages/`.

### 8. 17 páginas sem metadata própria
Sem `generateMetadata`/`metadata` (herdam o genérico do layout — títulos
duplicados entre si):
`animes/page.tsx`, `novelas/page.tsx`, `livetv/page.tsx`, `seasons/page.tsx`,
`contact`, `search`, `watch/[publicId]/page.tsx`, `read/[publicId]/page.tsx`,
`login`, `signup`, `forgot-password`, `profile`, `history`, `watchlist`,
`lists`, `lists/[id]`.
- **Ação:** título/descrição únicos para cada seção indexável
  (`animes`, `novelas`, `livetv`, `seasons`, `contact`, `search`) usando as
  chaves já existentes no padrão dos demais (`metaTitle`/`metaDescription`).

### 9. `/animes` é uma cópia quase exata da home
- `app/[locale]/animes/page.tsx` repete os mesmos carrosséis de
  `app/[locale]/page.tsx` (Top, Temporada, Recentes, Filmes, Mangás...).
- Conteúdo duplicado = uma das duas páginas ranqueia mal ou compete consigo mesma.
- **Ação:** transformar `/animes` numa listagem real com paginação
  (`/animes?p=2` ou cursor), filtros (gênero, status, temporada) e conteúdo
  exclusivo; idem para `/series`, `/movies` se aplicável.

### 10. Conteúdo fino nas páginas de categoria
- Listagens são só carrosséis de imagens (títulos de carrossel usam `h2`, o que
  está certo, mas não há texto).
- **Ação:** adicionar bloco de texto SEO no topo/fundo (2–3 parágrafos
  localizados), ex.: "Assistir animes online grátis em HD com dublagem e
  legendado, episódios atualizados toda semana...". Isso dá contexto semântico
  e keyword coverage. O mesmo nos cards: manter `alt={item.title}` (já existe em
  `MediaCard.tsx:71`) e adicionar nos componentes sem alt.

### 11. `images.unoptimized: true` (Core Web Vitals)
- `next.config.ts:71-72` desativa o otimizador do Next em todos os banners/posters.
  Impacto direto em LCP, especialmente na home/mobile.
- **Ação:** reativar a otimização (mesmo com cache local dos remotos via
  `remotePatterns`, que já estão listados) e usar `priority` só no hero
  (já usado no `HeroCarouselClient`) + `sizes` corretos nos carrosséis.

### 12. Logging com `fs.appendFileSync` dentro de `generateMetadata`
- `app/[locale]/animes/[slug]/page.tsx:58-62` (e mais 3 blocos iguais na página)
  escreve em `/tmp` a cada geração de metadata.
- Além de poluir, adiciona I/O síncrono no caminho crítico do SEO (TTFB do `<head>`)
  e falha silenciosa em serverless.
- **Ação:** remover esses logs antes de ir pra produção.

### 13. Páginas de listagem em `force-dynamic`
- `mangas/page.tsx:9`, `new/page.tsx:8`, `popular/page.tsx:7`, `novelas/page.tsx:7`
  forçam render dinâmica → TTFB sempre alto, sem cache de CDN.
- **Ação:** usar `revalidate = 300–3600` (conteúdo muda pouco) ou
  `generateStaticParams` + ISR; manter `force-dynamic` só onde o conteúdo é
  realmente por usuário.

### 14. Múltiplos `<h1>` no hero
- `HeroCarouselClient.tsx:242` e `:245` renderizam um `h1` sr-only **e** um `h1`
  visível no mesmo slide (e possivelmente um por slide montado).
- **Ação:** um único `h1` por página (título do site/destaque atual); os demais
  slides devem usar `h2` ou `div`.

### 15. Imagens sem `alt`
- Vários `<Image>` sem alt: `HistoryCard.tsx:53,131`, `TodayReleasesClient.tsx:196,213`,
  `MangaReader.tsx:227`, entre outros (grep sem `alt=` listou 15+ ocorrências).
- `HeroCarouselClient.tsx:148,169` usa `alt=""` em imagens decorativas — ok —,
  mas as de conteúdo precisam de alt descritivo com o título da obra.
- **Ação:** adicionar `alt={title}` (ou `alt=""` se puramente decorativo).

---

## 🟡 Médio / consolidação

### 16. Breadcrumbs
- Nenhum componente de breadcrumb existe. Adicionar `BreadcrumbList` (JSON-LD)
  + trilha visual nas páginas de detalhe: Home › Animes › Título.

### 17. Pré-render das páginas populares
- Nenhum `generateStaticParams` no projeto. As páginas de detalhe usam ISR
  (`revalidate = 3600`) mas cada URL só é cacheada após o primeiro hit.
- **Ação:** `generateStaticParams` para os top N por rank/score (já consultado
  em `app/[locale]/page.tsx`) e para as páginas de listagem por locale.

### 18. Links externos de baixa qualidade no footer
- `components/Footer.tsx` linka para `https://twitter.com` e `https://github.com`
  (genéricos, sem perfil real). Isso não ajuda e pode parecer lixo.
- **Ação:** apontar para os perfis reais ou remover.

### 19. Rotas duplicadas `/watch/[publicId]` e `/read/[publicId]`
- Existem as duas versões (com e sem slug no path). Sem canonical, são URLs
  duplicadas.
- **Ação:** nas versões sem slug, redirecionar 301 (ou canonical) para a
  versão canônica com slug.

### 20. Locale/OG completo
- Adicionar `openGraph.locale` (`pt_BR` etc.), `siteName`, e no sitemap os
  `alternates` por locale. O `LanguageSwitcher` já navega entre locales —
  depois do hreflang no `<head>`, o Google passa a entender o cluster de idiomas.

### 21. Favicon / app icons
- `public/` tem `logo.png`, `logo-name.png`, `anime_award_icon.png` e svgs de
  template, mas não há `apple-touch-icon`, `og-image` padrão do site nem
  `manifest.json` (não é obrigatório, mas `apple-touch-icon` + meta OG padrão
  ajudam branding e CTR no mobile/coletores).

### 22. Search Console + Analytics
- Não há rastro de verificação do Google Search Console nem GA4.
- **Ação:** verificar o domínio no GSC (meta tag no layout ou DNS), enviar o
  sitemap, monitorar "Cobertura" e "Core Web Vitals". Opcional: GA4/matomo.

### 23. Qualidade das metadescriptions por idioma
- Verificar os 6 arquivos `messages/*.json`: chaves `metaTitle`/`metaDescription`
  existem em alguns namespaces (`AnimeDetails`, `SeriesDetails`, `Movies`,
  `Mangas`, `Popular`, `Layout`) — confirmar que todos os idiomas têm as mesmas
  chaves e textos naturalizados (não traduções literais de "Assistir...").

### 24. Performance geral do crawl/render
- Muitos componentes `use client` nas páginas de listagem (`MediaCarousel`,
  `MediaCard` são client e recebem dados do server — bom padrão), mas o hero
  monta todos os slides; garantir que o HTML inicial tenha já os links dos
  carrosséis (hoje tem, pois os itens vêm do server) e que não haja fetch
  client-side do conteúdo principal. A rota `app/api/hero/route.ts` parece
  redundante com o `HeroCarousel` server — se ninguém a chama, remover evita
  confusão de fonte de dados.

---

## Ordem de implementação sugerida

| # | Item | Esforço | Impacto |
|---|------|---------|---------|
| 1 | `robots.ts` + `sitemap.ts` | Baixo | 🔴 ✅ feito |
| 2 | `metadataBase` + canonical + hreflang (helper único) | Médio | 🔴 ✅ feito |
| 3 | `noindex` nas páginas pessoais e variantes de player | Baixo | 🔴 ✅ feito |
| 4 | JSON-LD (WebSite, TVSeries/Movie, VideoObject, Breadcrumb) | Médio | 🟠 |
| 5 | Title template + títulos curtos (6 idiomas) | Baixo | 🟠 |
| 6 | Metadata para as 17 páginas sem título próprio | Baixo | 🟠 |
| 7 | Remover `appendFileSync` + `not-found.tsx` | Baixo | 🟠 |
| 8 | Texto SEO nas categorias + deduplicar `/animes` | Médio | 🟠 |
| 9 | Reativar `next/image` optimization | Baixo | 🟠 |
| 10 | `revalidate`/`generateStaticParams` nas listagens | Médio | 🟡 |

## Como validar depois

- `npx next build` e checar se `/robots.txt` e `/sitemap.xml` respondem 200.
- Rich Results Test (Google) nas páginas de detalhe com JSON-LD.
- Search Console → Sítio → Páginas: esperar "Canonicals alternativos" zerando
  os duplicados entre idiomas.
- Lighthouse (mobile, incógnito): foco em LCP (hero) e CLS após ativar images.
- Busca `site:seudominio` para conferir títulos/descrições finais.
