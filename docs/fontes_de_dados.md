# Fontes de Dados e Metadados do PrimerTV

Este documento descreve a origem e o fluxo de coleta de dados (títulos, capas, sinopses, gêneros e links de reprodução) para cada tipo de mídia no projeto **PrimerTV**.

---

## Resumo das Fontes de Dados

| Tipo de Mídia | Sinopse (Descrição) e Gêneros | Imagem de Capa | Links de Vídeo / Capítulos |
| :--- | :--- | :--- | :--- |
| **Filmes** | 🤖 TMDB API (Automático) / Manual | 🤖 TMDB API / StartFlix | 🤖 StartFlix / Vizer / Megacine / TheFilmes / OnlyFlix |
| **Séries** | 🤖 TVMaze API (Automático) | 🤖 TVMaze API / Scrapers | 🤖 Scrapers de sites de séries |
| **Animes** | 🤖 Jikan API (MAL) (Automático) | 🤖 Jikan API (MAL) | 🤖 Scrapers de sites de anime |
| **Mangás** | 🤖 Jikan API (MAL) (Automático) | 🤖 Jikan API (MAL) | 🤖 Scrapers de páginas de mangá |
| **Novelas** | ❌ Manual (Painel Admin) | 🤖 Scrapers de novelas | 🤖 Scrapers de sites de novelas |
| **Canais** | ❌ Seed / Manual (Painel Admin) | ❌ Seed / Manual | 🤖 Scrapers de TV / Links estáticos |

---

## Detalhamento por Categoria

### 🎬 Filmes
* **Coleta Automática (Worker & API):**
  * O worker em Rust ([worker/src/scraper/movies.rs](file:///home/primer/Documents/primertv/worker/src/scraper/movies.rs)) monitora lançamentos raspando a página de filmes do [StartFlix](https://startflix.co/filmes/).
  * Ele extrai o **título** e a **imagem de capa inicial**.
  * Ele tenta buscar os links de reprodução (`videoUrl`) buscando o título em múltiplos provedores: `StartFlix`, `Vizer`, `Megacine`, `TheFilmes` e `OnlyFlix`.
* **Metadados (Sinopse e Gêneros):**
  * Utiliza a **API do TMDB** (`https://api.themoviedb.org/3`) através do serviço `TmdbService` ([worker/src/tmdb.rs](file:///home/primer/Documents/primertv/worker/src/tmdb.rs)) com as credenciais configuradas no `.env`.
  * Ele busca pelo título do filme e extrai:
    * **Sinopse** (`overview`) em português (pt-BR).
    * **Gêneros** do filme mapeados e traduzidos.
    * **Imagem de capa** em alta resolução do TMDB (`poster_path`), que substitui ou complementa a do StartFlix.
  * O preenchimento/edição manual ainda pode ser feito pelo painel de administração (`/admin/movies`) caso seja necessário ajustar algo.

### 📺 Séries
* **Coleta Automática (Worker & API):**
  * O worker descobre novas séries e atualiza os dados utilizando a **API pública do TVMaze** (`https://api.tvmaze.com`).
  * O serviço em [worker/src/imdb.rs](file:///home/primer/Documents/primertv/worker/src/imdb.rs) realiza a busca e extrai:
    * **Sinopse** (com limpeza de tags HTML).
    * **Gêneros**.
    * **Imagem de capa** em alta resolução.
  * Em seguida, o `SeriesScraper` busca os episódios e os links de reprodução de sites terceiros.

### ⛩️ Animes e Mangás
* **Coleta Automática (Worker & API):**
  * O worker descobre novos animes/mangás populares e preenche seus metadados utilizando a **API do Jikan** (`https://api.jikan.moe/v4`), que é um wrapper aberto do *MyAnimeList* (implementado em [worker/src/jikan.rs](file:///home/primer/Documents/primertv/worker/src/jikan.rs)).
  * São importados automaticamente:
    * **Sinopse** (`synopsis`).
    * **Gêneros**.
    * **Status de exibição/publicação**.
    * **Classificação e Nota**.
    * **Imagem de capa**.
    * **Data de estreia** e **Duração**.
  * Os scrapers específicos de animes e mangás tratam de raspar as fontes de vídeo (episódios) e imagens (páginas dos capítulos).

### 🎭 Novelas
* **Coleta Automática (Worker):**
  * Semelhante aos filmes, o worker raspa as páginas de sites de novelas ([worker/src/scraper/novelas.rs](file:///home/primer/Documents/primertv/worker/src/scraper/novelas.rs)) para obter títulos, capítulos e capas.
  * **Sinopses e gêneros** não são obtidos automaticamente e dependem de preenchimento manual via painel do administrador (`/admin/novelas`).

### 📡 Canais de TV
* **Criação Inicial:**
  * São semeados no banco de dados através do script [prisma/seed.ts](file:///home/primer/Documents/primertv/prisma/seed.ts) (ex: Globo, SBT, Record, CNN Brasil, etc.).
  * Os metadados, logos e links estáticos são definidos ali ou atualizados no painel do administrador (`/admin/channels`).

---

## Estrutura do Código de Raspagem
Os scrapers e serviços do worker são orquestrados em [worker/src/main.rs](file:///home/primer/Documents/primertv/worker/src/main.rs):
- `do_anime`: Orquestra Jikan API + Scraper de episódios.
- `do_series`: Orquestra TVMaze API + Scraper de episódios.
- `do_movies`: Orquestra TMDB API + Scraper de filmes do StartFlix.
- `do_manga`: Orquestra Jikan API + Scraper de capítulos.
- `do_novela`: Orquestra Scraper de novelas.
- `do_channels`: Semeia e atualiza canais.
