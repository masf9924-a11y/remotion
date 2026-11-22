# Videoaula M3P4 — motion graphics em Remotion

Videoaula de revisão (≈37 min, 1920×1080, 30 fps) da tutoria M3P4: saneamento básico, doenças infecciosas
do saneamento, imunologia contra parasitas, animais peçonhentos e resíduos sólidos, encerrando num caso integrador.

## Estrutura pedagógica (Taxonomia de Bloom)

| Módulo | Tema | Níveis de Bloom | Desafio |
| --- | --- | --- | --- |
| 0 | Abertura: mapa da aula e pirâmide de Bloom | Lembrar | — |
| 1 | Saneamento básico | Lembrar → Compreender → Aplicar | Plano de hidratação (Aplicar) |
| 2 | Dengue, ascaridíase, cólera, giardíase, criptosporidiose | Lembrar → Analisar | Mecanismo da diarreia (Analisar) |
| 3 | Imunologia contra parasitas | Compreender → Analisar | Löffler com fezes negativas (Analisar) |
| 4 | Animais peçonhentos | Lembrar → Analisar | Gênero e soro (Analisar) |
| 5 | Resíduos sólidos | Lembrar → Avaliar | Aterro controlado (Avaliar) |
| 6 | Caso integrador e mapa mental | Analisar → Criar | Intervenção de maior impacto (Avaliar) |

O cabeçalho mostra uma escada de Bloom cujo indicador desliza para o nível de cada cena. Cada desafio tem
uma pausa com contagem regressiva para o estudante responder antes da correção. O personagem Estudante
erra de forma plausível e é corrigido.

## Pipeline

```bash
npm install
npm run tts      # edge-tts (vozes neurais pt-BR) → public/audio/*.mp3 + limites de palavra
npm run whisper  # @remotion/install-whisper-cpp: compila whisper.cpp e tenta baixar o modelo
npm run align    # gera src/data/manifest.json (duração real + instante de cada palavra/cue)
npm run fonts    # baixa as fontes do catálogo @remotion/google-fonts para public/fonts
npm run stills   # um PNG por cena em out/stills (revisão)
npm run render   # um MP4 por módulo em out/modulos + concatenação ffmpeg → out/Videoaula-M3P4-completa.mp4
```

- **Roteiro:** `roteiro.json`. Cada fala tem `id`, `speaker`, `text` e `cues` (`word` = palavra-gatilho,
  `target` = elemento visual, `action` = show/highlight/pick/solve, `n` = ocorrência da palavra).
- **Sincronia:** `scripts/align.mjs` usa o whisper.cpp (`transcribe` com `tokenLevelTimestamps`) quando o
  modelo `ggml-medium.bin` existe em `whisper.cpp/`. Sem ele, usa os limites de palavra (WordBoundary)
  emitidos pelo próprio motor TTS. Nos dois casos as durações vêm do áudio: nada é digitado à mão.
- **Física:** `src/springs.ts` define os únicos presets de spring (`suave`, `firme`, `elastico`).
- **Pacotes:** `@remotion/transitions` (slide, wipe, fade e uma apresentação própria), `@remotion/paths`
  (`evolvePath` para setas, anéis e trajetos; `interpolatePath` para morphing do fundo, do selo de abertura,
  do canal CFTR e do “×” das comparações), `@remotion/layout-utils` (`fitText`, `fillTextBox`,
  `measureText` para nunca estourar cards), `@remotion/google-fonts` (Lexend e Inter),
  `@remotion/install-whisper-cpp`.

## Licença do Remotion

Uso individual para estudo se enquadra na **Free License** do Remotion (indivíduos podem usar gratuitamente).
