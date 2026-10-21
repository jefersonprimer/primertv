# Redesign minimalista — StarRatingModal (versão final)

## Objetivo
`components/StarRatingModal.tsx` virou um painel **informativo** (estatísticas da comunidade), limpo e minimalista. A votação continua nas estrelas inline da página (`AnimeStarRating`).

## Decisões do usuário
1. Modal **não** mostra o nome do anime (só no `aria-label` do diálogo, para acessibilidade).
2. Cabeçalho no formato "Média 9.6 de 10 estrelas" + "55.144 avaliações".
3. Modal **não** tem votação (sem estrelas clicáveis, sem "minha nota"). Escala nativa de **10 pontos**.
4. Seção "anti-review-bomb" resumida (sem tabela 2×2, sem fórmula, sem emoji).

## `app/globals.css`
`@theme` + `@keyframes` reais (antes `animate-in`/`animate-fade-in` eram no-op, pois `tailwindcss-animate` não existe no projeto):
- `--animate-fade-in` / `--animate-fadeIn` / `--animate-zoom-in-95`

## `components/StarRatingModal.tsx`
- Props: `isOpen, onClose, animeTitle, averageScore, totalVotes, breakdown, isLoggedIn` (`userScore` e `onRate` removidos).
- Painel `max-w-md rounded-2xl bg-zinc-950/95 ring-1 ring-zinc-800/80`, conteúdo com `max-h-[88vh] overflow-y-auto custom-scrollbar`.
- Seções separadas por `border-t border-zinc-800/70` (zero cards aninhados).
- Hero: eyebrow "MÉDIA DA COMUNIDADE" → número grande `tabular-nums` → `de 10 estrelas` → 10 estrelas com preenchimento fracionário (overlay clipped) → "55.144 avaliações" → (deslogado) pill "Faça login para avaliar este anime".
- Distribuição: 10 faixas (10→1), barra `h-2 rounded-full`, % + contagem em `tabular-nums`.
- Accordion "Como calculamos a nota" (ShieldCheck + ChevronDown rotativo) com `trustSystemDescription` + `bayesianNote`.
- A11y: `role="dialog"`, `aria-modal`, `aria-expanded` no accordion, ESC fecha, scroll-lock, foco no painel, `useSyncExternalStore` no lugar do `setMounted` (lint `react-hooks/set-state-in-effect`).

## i18n (6 locales)
Chaves novas em `StarRating`: `outOfStars`, `ratings` (ICU plural), `howItWorks`, `bayesianNote`, `loginToRate`, `close`.

## Verificação
`npx tsc --noEmit` e `npx eslint components/StarRatingModal.tsx components/AnimeStarRating.tsx` sem erros; compilação do Tailwind verificada (`animate-zoom-in-95` + keyframes gerados).
