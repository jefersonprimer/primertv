# Plano de Implementação: Franquia e Continuações de Animes (Prequel / Sequel)

## 1. Visão Geral e Objetivos

O objetivo desta funcionalidade é conectar animes que fazem parte da mesma franquia ou linha cronológica (por exemplo: *Naruto Clássico (MAL 20)* ➡️ *Naruto Shippuuden (MAL 1735)* ➡️ *Boruto (MAL 34566)*).

Isso resolve duas grandes dores de experiência do usuário (UX):
1. **No Player (`/watch` e `EpisodeSidebar.tsx`):** Quando o usuário estiver assistindo ao **último episódio** de um anime (ex: Episódio 220 de Naruto), a barra lateral não fica sem próximo episódio. Em vez disso, ela exibe com destaque o **Episódio 1 da continuação direta (*Naruto Shippuuden*)**, permitindo continuar a maratona com um único clique.
2. **Na Página de Detalhes (`/animes/[slug]`):** Uma seção visual "Franquia / Linha do Tempo" que exibe os títulos anteriores (*Prequel*) e seguintes (*Sequel*), com pôsteres e links diretos.
3. **No Painel de Administração (`/admin`):** O administrador pode definir ou sobrescrever manualmente o `sequelMalId` e `prequelMalId`, ou puxar automaticamente essas relações da API do Jikan/MyAnimeList.

---

## 2. Modelagem de Dados (Prisma Schema)

Arquivo: `prisma/schema.prisma`

No modelo `Anime`, adicionamos campos opcionais para MyAnimeList e AniList com índices para busca rápida:

```prisma
model Anime {
  // ... campos existentes ...
  anilistId         Int?             @unique
  malId             Int?             @unique
  
  // Novos campos para encadeamento de franquia
  sequelMalId       Int?
  prequelMalId      Int?
  sequelAnilistId   Int?
  prequelAnilistId  Int?

  // ...
  @@index([sequelMalId])
  @@index([prequelMalId])
  @@index([sequelAnilistId])
  @@index([prequelAnilistId])
}
```

### Migração SQL:
```sql
ALTER TABLE "Anime"
ADD COLUMN "sequelMalId" INTEGER,
ADD COLUMN "prequelMalId" INTEGER,
ADD COLUMN "sequelAnilistId" INTEGER,
ADD COLUMN "prequelAnilistId" INTEGER;

CREATE INDEX "Anime_sequelMalId_idx" ON "Anime"("sequelMalId");
CREATE INDEX "Anime_prequelMalId_idx" ON "Anime"("prequelMalId");
CREATE INDEX "Anime_sequelAnilistId_idx" ON "Anime"("sequelAnilistId");
CREATE INDEX "Anime_prequelAnilistId_idx" ON "Anime"("prequelAnilistId");
```

---

## 3. Serviços e Utilitários (`lib/anime-relations.ts`)

Camada de serviço especializada em resolver relações:
1. **`fetchAniListRelations({ anilistId, malId })`**:
   - Consulta a API GraphQL do AniList (`https://graphql.anilist.co`).
   - AniList retorna **simultaneamente** o `id` (AniList ID) e `idMal` (MyAnimeList ID) das relações do tipo `SEQUEL` e `PREQUEL`.
   - Caso AniList não encontre ou falhe, faz fallback automático para Jikan (`fetchMalRelations`).
2. **`resolveAnimeFranchise(options)`**:
   - Dado um anime com seus IDs (ou descobrindo via API se ainda não preenchido):
   - Busca no banco de dados local (`prisma.anime`) se já existe o anime correspondente por `anilistId` ou por `malId`.
   - Se existir, recupera o slug, título, pôster e o primeiro episódio disponível da 1ª temporada (com rota para `/watch/...`).
   - Retorna objetos tipados `prequel` e `sequel`.

---

## 4. Formulário do Admin (`components/admin/AdminMediaForm.tsx` & `lib/admin.ts`)

1. **Campos no Formulário:**
   - `sequelMalId`: "MAL ID da Sequência (Ex: 1735 para Naruto Shippuuden)".
   - `prequelMalId`: "MAL ID do Prequel (Ex: 20 para Naruto)".
2. **Auto-Preenchimento Inteligente:**
   - Botão no Admin "Detectar Sequências (MAL)" ou disparo ao salvar: se o admin informou o `malId`, mas deixou `sequelMalId` ou `prequelMalId` vazios, o sistema pode buscar na API e preencher automaticamente.
3. **Ações de Salvamento (`app/admin/actions.ts`):**
   - Ler e persistir `sequelMalId` e `prequelMalId` na tabela `Anime`.

---

## 5. Interface do Player (`EpisodeSidebar.tsx` e `app/[locale]/watch/...`)

1. **Detecção de Fim de Temporada/Série:**
   - O `EpisodeSidebar` já sabe o `currentIndex` e se `currentIndex === allEpisodes.length - 1` (último episódio da série).
2. **Card de Continuação de Franquia:**
   - Quando `nextEpisode` for nulo, mas houver uma `sequel` disponível com o primeiro episódio:
   - Renderizar o bloco **"Próxima Temporada / Continuação"**:
     - Miniatura/Pôster do sequel anime.
     - Título da sequência e "Episódio 1".
     - Botão de ação estilizado com gradiente e badge "Sequência Direta".
3. **Passagem de Props:**
   - A página `app/[locale]/watch/[publicId]/[slug]/page.tsx` resolve a franquia do anime atual e passa `sequel` e `prequel` para o `<AnimeEpisodeSidebar />`.

---

## 6. Interface da Página de Detalhes (`app/[locale]/animes/[slug]/page.tsx`)

1. Adicionar o componente `<AnimeFranchiseSection />` logo após a lista de temporadas/episódios.
2. Exibir cards interativos:
   - ⬅️ **Anterior (Prequel):** Caso o usuário queira ver a origem da história.
   - ➡️ **Continuação (Sequel):** Para avançar diretamente para a próxima fase.
3. Caso o anime da sequência já esteja no catálogo do site, exibe o link direto; caso ainda não esteja cadastrado, indica "Em breve no catálogo".

---

## 7. Internacionalização (i18n)

Adicionar chaves nos arquivos de tradução (`messages/*.json`):
- `franchiseTitle`: "Franquia e Continuações"
- `sequelLabel`: "Próxima Temporada / Sequência"
- `prequelLabel`: "Temporada Anterior / Prequel"
- `startSequel`: "Continuar Assistindo em {title}"
- `nextSeriesEp`: "Episódio 1 da Próxima Fase"
- `autoDetectRelations`: "Buscar Relações MAL"
