# Futuras Melhorias - Leitor de Mangá (PrimerTV)

Este documento lista as funcionalidades planejadas para o leitor de mangá que exigem maior complexidade técnica, mudanças no banco de dados ou refatoração profunda.

## Experiência de Leitura Avançada

- [ ] **Modos de Leitura:**
  - Modo Webtoon (Scroll Vertical Contínuo) - *Atual*
  - Modo Página Única (Slide)
  - Modo Página Dupla
- [ ] **Scroll Contínuo Automático:** Ajuste de velocidade para leitura mãos-livres.
- [ ] **Zoom Inteligente:** Pinch-to-zoom no mobile e double-tap zoom.
- [ ] **Qualidade Adaptativa:** Seleção automática de qualidade de imagem (WebP/AVIF) baseada na conexão.

## Persistência e Engajamento

- [ ] **Favoritos:** Salvar mangás na lista de favoritos do usuário.
- [ ] **Continuar Lendo / Histórico:**
  - Salvar automaticamente o último capítulo lido.
  - Salvar a posição exata (página/scroll) dentro do capítulo.
  - Sincronização entre dispositivos.
- [ ] **Sistema de Comentários:** Comentários por capítulo ou por página.
- [ ] **Reações:** Curtir/Amei em capítulos específicos.

## Performance

- [ ] **Preload Inteligente:** Pré-carregar os próximos 2-3 capítulos em background.
- [ ] **Offline Reading:** Cachear páginas usando Service Workers para leitura sem internet.
- [ ] **Blur Preview:** Mostrar uma versão em baixa resolução (blur) enquanto a imagem principal carrega.

## Social

- [ ] **Compartilhamento:** Gerar link para uma página específica com preview da imagem.
- [ ] **Notificações:** Avisar quando um novo capítulo de um favorito for lançado.
