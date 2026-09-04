# 🎮 Plano de Arquitetura & UX: Gamificação e Perfil Interativo (PrimerTV)

> **Visão de Engenharia e Design UI/UX Senior**  
> Um sistema de gamificação bem desenhado transforma uma plataforma de streaming passiva em uma **comunidade ativa e altamente engajada**. Elementos como níveis, molduras (frames), badges e listas personalizadas criam um ciclo de retenção (habit loop), status social e senso de pertencimento.

---

## 💡 1. Avaliação do Especialista: Vale a Pena?

**Sim, com certeza!** Para plataformas de anime/mídia, a gamificação é uma das estratégias de maior impacto no LTV (Lifetime Value) e engajamento dos usuários.

### Por que isso funciona tão bem no PrimerTV?
1. **Identidade Social nos Comentários**: Ao ver um comentário com uma moldura de nível "Mítico" ou badge "Crítico Lendário", outros usuários são incentivados a participar mais para desbloquear os mesmos cosméticos.
2. **Ciclo de Retenção Diária (Habit Loop)**: A manutenção de "Ofensivas" (Daily Streaks) faz com que o usuário volte todos os dias para assistir ao menos um episódio.
3. **Colecionacionismo**: Fãs de anime adoram organizar o que assistiram e exibir estatísticas (ex: "500 horas assistidas", "120 animes concluídos").

---

## 🌟 2. Ideias de Features e Mecânicas de Gamificação

### 👑 A. Sistema de Níveis & XP
- **Fórmula de XP Progressiva**:
  $$\text{XP necessário para o nível } N = 100 \times N^{1.5}$$
- **Fontes de XP**:
  - 📺 **Assistir episódio completo (>80%)**: +15 XP (máx. 10 episódios/dia elegíveis para XP para evitar abusos).
  - 💬 **Comentar em um episódio**: +5 XP (limite de 3 comentários premiados/dia).
  - ⭐ **Avaliar um anime**: +10 XP.
  - 🔥 **Ofensiva Diária (Login/Watch)**: +20 XP por dia consecutivo.
  - 🎉 **Concluir um Anime**: +50 XP (Bônus de finalização).

### 🏆 B. Badges (Conquistas & Emblemas)
As badges possuem raridades: `Comum (Bronze)`, `Raro (Prata)`, `Épico (Ouro)`, `Lendário (Diamante)`, `Mítico (Neon)`.
- **Exemplos de Badges**:
  - 🍿 *Maratonista*: Assista 5 episódios no mesmo dia.
  - 🦉 *Coruja*: Assista a um episódio entre 02:00 e 05:00 da manhã.
  - 🗣️ *Debatedor*: Escreva 20 comentários em episódios diferentes.
  - 👑 *Sem Vida Social*: Complete 50 animes.
  - 🌸 *Especialista Shonen / Seinen / Isekai*: Assista a 10 animes do gênero específico.

### 🖼️ C. Molduras de Avatar (Frames) e Títulos Desbloqueáveis
- **Molduras de Avatar**: Bordas animadas ou estilizadas em SVG/CSS ao redor da foto de perfil.
  - *Nível 10*: Moldura Bronze de Madeira/Ferro.
  - *Nível 50*: Moldura Neon Cyberpunk Animada.
  - *Conquista Especial*: Moldura de Fogo / Aura de Saiyajin ao concluir 100 animes.
- **Títulos no Perfil e Comentários**: Texto abaixo do nome do usuário (ex: *"Otaku Casual"*, *"Senpai dos Animes"*, *"Caçador de Waifus"*).

### 📊 D. Minha Lista de Animes (My Anime List Integrada)
- **Status de Acompanhamento**:
  - `Assistindo` (com contador de progresso: ex: *Ep. 12/24*)
  - `Concluído`
  - `Quero Assistir` (Plan to Watch)
  - `Pausado` / `Abandonado`
- **Estatísticas Visuais**:
  - Total de horas assistidas.
  - Gráfico de pizza com distribuição de gêneros favoritos.
  - Gráfico de atividade recente (estilo "contribuidores do GitHub").

### 🔥 E. Ofensiva Diária & Missões Diárias (Daily Quests)
- **Painel de Missões**:
  - 1. Assistir 1 episódio hoje (+20 XP)
  - 2. Deixar uma avaliação em um anime (+15 XP)
  - 3. Compartilhar um anime (+10 XP)
- Recompensa por completar todas as 3 missões diárias: **Bônus de XP + Proteção de Ofensiva (Streak Shield)**.

---

## 🛠️ 3. Arquitetura Técnica Recomendada

### 🗄️ Modelo de Dados (Prisma Schema - PostgreSQL)

```prisma
model UserStats {
  id              String   @id @default(cuid())
  userId          String   @unique
  xp              Int      @default(0)
  level           Int      @default(1)
  streakCount     Int      @default(0)
  lastActiveAt    DateTime @default(now())
  totalWatchTime  Int      @default(0) // em minutos
  selectedTitle   String?
  selectedFrameId String?  @map("selected_frame_id")
  
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  selectedFrame   UserFrame? @relation(fields: [selectedFrameId], references: [id])

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Badge {
  id          String      @id @default(cuid())
  slug        String      @unique
  name        String
  description String
  iconUrl     String
  rarity      String      // BRONZE, SILVER, GOLD, DIAMOND, MYTHIC
  category    String      // WATCH, COMMENT, COMMUNITY, STREAK
  users       UserBadge[]
}

model UserBadge {
  id         String   @id @default(cuid())
  userId     String
  badgeId    String
  unlockedAt DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  badge      Badge    @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@unique([userId, badgeId])
}

model UserFrame {
  id          String      @id @default(cuid())
  slug        String      @unique
  name        String
  assetUrl    String
  minLevel    Int         @default(1)
  rarity      String
  usersStats  UserStats[]
}

model UserAnimeList {
  id          String   @id @default(cuid())
  userId      String
  animeId     String
  status      String   // WATCHING, COMPLETED, PLAN_TO_WATCH, PAUSED, DROPPED
  progressEp  Int      @default(0)
  score       Int?     // 1 a 10
  isFavorite  Boolean  @default(false)
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, animeId])
}
```

---

## 🎨 4. Design de Interface (UI/UX Guidelines)

1. **Avatar com Molduras Flexíveis**:
   - Usar um container `relative` com a foto do usuário centralizada e o SVG/PNG da moldura sobreposto absolutamente (`absolute inset-0 pointer-events-none`).
   - Badge de Nível posicionado no canto inferior direito do avatar (`-bottom-1 -right-1`).

2. **Integração na Seção de Comentários**:
   - Exibir a moldura no avatar do comentarista.
   - Tag colorida com o nível (ex: `[Nvl 42]`) e título abaixo do nome do usuário.

3. **Animações de Level Up & Unlock**:
   - Usar `framer-motion` ou animações Tailwind CSS para popup de "Level Up!" ou "Nova Conquista Desbloqueada!".

---

## 🗺️ 5. Plano de Implementação Passo a Passo

### **Fase 1: Infraestrutura de Lista de Animes & Stats Básicos** (Curto Prazo)
- [ ] Criar tabelas `UserStats` e `UserAnimeList` no Prisma Schema.
- [ ] Criar rotas de API e Server Actions para adicionar/atualizar status do anime na lista do usuário.
- [ ] Construir a aba "Minha Lista" e estatísticas básicas no perfil do usuário (`/profile`).

### **Fase 2: Motor de XP e Níveis** (Médio Prazo)
- [ ] Desenvolver utilitário `awardXP(userId, actionType, amount)` com trava de limite diário (anti-spam).
- [ ] Integrar ganho de XP quando o vídeo atinge >80% de reprodução no player.
- [ ] Integrar ganho de XP ao criar comentários elegíveis.
- [ ] Exibir barra de progresso de Nível no header e no menu do usuário (`UserMenu.tsx`).

### **Fase 3: Badges, Molduras e Cosméticos** (Longo Prazo)
- [ ] Criar catálogo de Molduras (CSS/SVG) e Badges.
- [ ] Desenvolver a vitrine de conquistas no perfil do usuário.
- [ ] Exibir molduras e títulos dinamicamente nos comentários (`CommentsSection.tsx`).

---

> **Próximos Passos Sugeridos**:
> Quando quiser iniciar a implementação, podemos começar pela **Fase 1 (Estruturação da Tabela do Prisma e Lista de Animes do Usuário)**.
