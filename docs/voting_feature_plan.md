# Plano de Implementação: Sistema de Votação para Episódios de Animes

Este documento detalha o planejamento para implementar a feature de votação em episódios de animes, conforme solicitado. O objetivo é permitir que os usuários logados possam avaliar (ex: Like/Dislike ou Notas) os episódios que estão assistindo.

## 1. Alterações no Banco de Dados (Prisma)
Arquivo alvo: `prisma/schema.prisma`

Precisaremos criar uma nova tabela/modelo para armazenar os votos e criar as relações com os modelos `User` e `Episode` (que pertence à temporada de um anime).

**Sugestão de Modelo:**
```prisma
model EpisodeVote {
  id        String   @id @default(cuid())
  userId    String
  episodeId String
  type      String   // Pode ser "UP", "DOWN" (ou usar um Int para notas de 1 a 5, por exemplo)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  episode Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)

  // Um usuário só pode votar uma vez por episódio
  @@unique([userId, episodeId])
  @@index([episodeId])
}
```

*Também será necessário adicionar a relação `episodeVotes EpisodeVote[]` nos modelos `User` e `Episode`.*

**Passos:**
1. Adicionar os modelos no `schema.prisma`.
2. Rodar a migração via Makefile (ex: `make migrate/up` com atlas/golang-migrate se aplicável, ou via Prisma `npx prisma db push` / `npx prisma migrate dev`).

## 2. Lógica de Backend (Next.js Server Actions / API)
Arquivo alvo: `app/actions/vote.ts` (ou equivalente na estrutura de actions)

Criaremos funções executadas no servidor para gerenciar os votos, interagindo com o Prisma:

- **`castVote(episodeId: string, type: 'UP' | 'DOWN')`**:
  - Verifica se o usuário está logado (usando a sessão atual).
  - Usa `prisma.episodeVote.upsert()` para criar o voto se não existir, ou atualizar se o usuário estiver mudando seu voto (ex: de UP para DOWN).
  - Retorna o status de sucesso.
- **`removeVote(episodeId: string)`**:
  - Deleta o registro de voto do usuário logado para um episódio específico.
- **`getEpisodeVoteStats(episodeId: string)`**:
  - Retorna o total de votos positivos e negativos para o episódio, permitindo que a UI mostre a proporção ou quantidade.

*Consideração de Performance:* Como especificado na arquitetura, podemos usar o **Redis** para cache curto das estatísticas de voto de um episódio muito acessado, com invalidação quando um novo voto ocorrer.

## 3. Interface do Usuário (Frontend)
Arquivo alvo: Componente na página do player do anime (ex: `app/(rotas)/anime/[slug]/episode/[id]/page.tsx` ou componente de player)

- **Criar componente `<VoteButtons episodeId={episode.id} initialStats={stats} initialUserVote={userVote} />`**:
  - Interface com dois botões (Like 👍 / Dislike 👎).
  - Utilizar **Optimistic UI (useOptimistic do React)** para que o clique reflita imediatamente na tela antes da requisição ao servidor terminar.
  - Chamar as server actions `castVote` ou `removeVote` dependendo da interação.
  - Estilização seguindo o padrão atual do projeto (Tailwind CSS + ícones padrão como Lucide).

## 4. Ordem de Execução
1. Atualizar o `prisma/schema.prisma` e aplicar a migração.
2. Desenvolver e testar as Server Actions independentemente.
3. Construir o componente React do frontend.
4. Integrar o componente na página do episódio e fazer o polimento final (animações e responsividade).
