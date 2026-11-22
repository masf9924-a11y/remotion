# Videoaula Agrotóxicos Organoclorados — motion graphics em Remotion

Videoaula de revisão (~19 min, 1920×1080, 30 fps) de toxicologia: agrotóxicos organoclorados,
da definição de agente tóxico ao caso ambiental integrador. Diálogo animado Professor × Estudante,
com desafios estilo prova, flashcards e frases-chave.

## Estrutura pedagógica (Taxonomia de Bloom, com peso por verbo do objetivo)

| Módulo | Tema | Níveis de Bloom | Cena sob medida | Desafio |
| --- | --- | --- | --- | --- |
| 0 | Abertura: mapa + Bloom ponderado | Lembrar | mapa em hub | — |
| 1 | Fundamentos: agente tóxico e quais são | Lembrar → Compreender | tabela de proibições | Lei própria do DDT |
| 2 | Exposição e toxicocinética | Compreender → Analisar | curva no tecido adiposo; biomagnificação | Leite da nutriz |
| 3 | Mecanismo e intoxicação | Analisar → Avaliar | canal de Na⁺ e GABA-A no neurônio | Convulsão por lindano |
| 4 | Determinação da exposição | Lembrar → Compreender | — (compare + ciclo APS) | Dose interna |
| 5 | Ambiente: resíduo, solo, água | Compreender → Avaliar | ciclo do contaminante; aterro industrial | 1ª medida no solo |
| 6 | Caso integrador + mapa mental | Analisar → **Criar** | mapa mental do caso | Maior impacto coletivo |

Os objetivos de "explicar/caracterizar" (mecanismo, cinética) recebem mais tempo que os de
"identificar/listar" — o Módulo 3 (mecanismo) é o mais longo. Cada módulo termina com **3 flashcards
relâmpago** e uma **frase-chave para a prova**. Cada desafio tem pausa de 7 s com contagem regressiva;
o Estudante erra de forma plausível e é corrigido.

## Pipeline

```bash
npm install
npm run tts      # edge-tts (vozes neurais pt-BR) → public/audio/*.mp3 + limites de palavra
npm run whisper  # (opcional) baixa o modelo whisper.cpp para sincronia mais fina
npm run align    # gera src/data/manifest.json (duração real + instante de cada palavra/cue)
npm run fonts    # baixa as fontes do catálogo @remotion/google-fonts para public/fonts
npm run stills   # um PNG por cena em out/stills (revisão)
npm run render   # um MP4 por módulo em out/modulos + concatenação ffmpeg → out/Videoaula-Agrotoxicos-completa.mp4
```

- **Roteiro:** `roteiro.json`. Cada fala tem `id`, `speaker`, `text` e `cues` (`word` = palavra-gatilho,
  `target` = elemento visual, `action` = show/highlight/pick/solve, `n` = ocorrência da palavra).
- **Sincronia:** `scripts/align.mjs` usa whisper.cpp quando o modelo existe; senão, os limites de
  palavra (WordBoundary) do próprio TTS. As durações vêm sempre do áudio.
- **Áudio:** além do tique (pausa) e do sino (revelação), há um "pop" na entrada de cada cena
  (`public/sfx-pop.wav`) e uma trilha ambiente bem baixa (`public/ambient.mp3`) com ducking nas falas.
- **Visuais sob medida:** `src/visuals/bespoke.tsx` (curva adiposa, biomagnificação, neurônio,
  ciclo do contaminante, aterro industrial) e `src/visuals/review.tsx` (flashcards).

## Conteúdo e fontes

As afirmações regulatórias e os mecanismos estão compilados, com fontes, em **`FONTES.md`**.
Itens incertos estão lá marcados como **[A CONFIRMAR]** e também ditos com cautela no vídeo.

## Licença do Remotion

Uso individual para estudo se enquadra na **Free License** do Remotion (indivíduos podem usar gratuitamente).
Verifique em https://remotion.dev/license se for usar comercialmente ou em equipe ≥ 4 pessoas.
