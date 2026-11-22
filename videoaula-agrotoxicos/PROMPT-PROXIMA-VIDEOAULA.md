# Prompt para a próxima videoaula (copie tudo abaixo da linha)

> **Antes de abrir o novo chat (2 minutos que evitam os maiores travamentos da primeira vez):**
> 1. Em https://github.com/settings/installations → app **Claude** → **Configure**: confirme que o repositório está incluído e que as permissões pendentes foram aceitas (sem isso o push falha com 403).
> 2. Se quiser sincronia com Whisper, no ambiente da sessão libere o host `huggingface.co` (o modelo do Whisper vem de lá). Se não liberar, tudo funciona mesmo assim, usando os tempos por palavra do próprio TTS.
> 3. Anexe o resumo do novo tema (arquivo .md) e, se possível, mantenha a pasta `videoaula-m3p4/` no repositório, para servir de base.

---

Atue como engenheiro de software criativo, designer instrucional e pedagogo. Crie, configure e renderize uma videoaula completa em Motion Graphics / infográfico animado, programada em React/TypeScript com Remotion, renderizada em MP4, para eu estudar para uma prova de medicina (estou no 4º semestre da Unicid). Use o arquivo anexado como material base: amplie, aprofunde e corrija o que for preciso, com rigor acadêmico, e liste no final o que você corrigiu ou acrescentou.

## Modo autônomo
Não me faça perguntas nem espere aprovação: tome as decisões técnicas, visuais e pedagógicas e execute tudo, do planejamento ao MP4 final. Só me interrompa se algo depender de uma permissão que só eu posso dar (rede, GitHub).

## Ponto de partida: reutilize o projeto anterior
Já existe um projeto funcionando em `videoaula-m3p4/` neste repositório (Remotion 4.0.545). **Não recomece do zero:** copie-o para uma nova pasta (ex.: `videoaula-<tema>/`), leia o `README.md` e reaproveite:
- `scripts/tts.py`: edge-tts com vozes pt-BR (Professor: `pt-BR-AntonioNeural`; Estudante: `pt-BR-FranciscaNeural`) e WordBoundary.
- `scripts/align.mjs`: gera `src/data/manifest.json` com duração real de cada fala e o instante de cada cue; usa whisper.cpp se o modelo existir e, se não existir, o WordBoundary do TTS.
- `scripts/fetch-fonts.mjs`: baixa as fontes do catálogo `@remotion/google-fonts` para `public/fonts`.
- `src/springs.ts` (presets suave/firme/elástico), `src/timeline.ts`, `src/components/*` (fundo com morphing, cabeçalho com escada de Bloom, avatares com lip-sync, contexto de cues) e `src/visuals/*` (opener, cards, flow row/cycle/hub/stairs com card-herói que vira faixa, table, compare, stats, profile, quiz com contagem regressiva, quote, além de cenas sob medida).
- `scripts/stills.ts` (um PNG por cena para revisão) e `scripts/render-all.ts` (um MP4 por módulo + concatenação via ffmpeg).

## Armadilhas do ambiente que já foram resolvidas (não perca tempo com elas)
- **TLS/proxy:** o edge-tts precisa usar o bundle `/root/.ccr/ca-bundle.crt` (substituir `certifi.where`). O script atual já faz isso.
- **Chrome do Remotion:** não baixa o próprio navegador (remotion.media bloqueado). Use `/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`; o projeto já faz isso de forma condicional.
- **Fontes:** o Chrome do render não alcança o Google Fonts. Carregue os `.woff2` locais via `FontFace` + `staticFile`, como em `src/theme.ts`, incluindo o subset `greek` (γ, ε, β).
- **Whisper:** `installWhisperCpp` compila via git clone; o download do modelo exige `huggingface.co` liberado.
- **Commit e push:** faça o push assim que houver o primeiro commit, para descobrir cedo se há problema de permissão.

## Pedagogia (mantenha o que funcionou)
- Módulos seguindo a Taxonomia de Bloom (Lembrar → Compreender → Aplicar → Analisar → Avaliar → Criar), com a escada de Bloom no cabeçalho mudando por cena.
- Um módulo de abertura com o mapa da aula e um módulo final com caso clínico integrador e mapa mental (nível Criar).
- Pelo menos 1 desafio estilo prova por módulo: pausa de 7 s com contagem regressiva; o Estudante escolhe uma alternativa (às vezes errada de forma plausível) e o Professor corrige com delicadeza, explicando o porquê.
- Uma frase-chave para a prova no fim de cada módulo.
- Diálogo: Professor calmo e acolhedor; Estudante com dúvidas reais, que pede exemplos e conecta temas. Falas de 1 a 3 frases.

## Melhorias em relação à primeira versão (faça)
1. **Duração:** alvo de 20 a 25 min no total, com módulos de no máximo 4 a 5 min. O anterior teve 32 min e ficou longo; corte repetições e priorize o que mais cai em prova.
2. **Menos texto na tela:** no máximo cerca de 12 palavras por card; o detalhe vai na fala. Prefira diagramas e esquemas a listas.
3. **Mais cenas sob medida:** pelo menos uma por módulo (mecanismo fisiopatológico, ciclo, via de sinalização, corte anatômico), como as cenas da toxina da cólera, do ciclo do Ascaris e do aterro sanitário. Desenhe as estruturas anatômicas com mais cuidado e evite rótulos sobrepostos.
4. **Continuidade visual mais forte:** use mais vezes um elemento que se transforma na cena seguinte (card → nó de diagrama, número → gráfico), além das transições slide/wipe/fade e da apresentação própria "lift".
5. **Revisão ativa:** no fim de cada módulo, 3 "flashcards relâmpago" (pergunta → 3 s → resposta).
6. **Áudio:** além do tique e do sino dos desafios, um "pop" suave quando os cards entram e uma trilha ambiente bem baixa (gerada com ffmpeg ou de licença livre, abaixo de -30 dB), com ducking durante as falas.
7. **Pronúncia:** antes de sintetizar tudo, gere uma amostra com siglas e termos difíceis (IgE, Th1, CFTR, nomes científicos) e reescreva no texto falado o que soar mal (ex.: "imunoglobulina E").
8. **Controle de qualidade:** renderize stills de cada cena e também de estados intermediários (meio de transição, pausa do quiz, revelação da resposta). Procure sobreposição e texto pequeno demais (menos de 18 px) e corrija antes do render final.
9. **Entregáveis extras:** (a) lista de capítulos com timestamps (formato YouTube) gerada a partir do manifest; (b) um PDF de 1 a 2 páginas de resumo para revisão, com as tabelas e as frases-chave; (c) uma thumbnail PNG.

## Stack e regras técnicas
- Node LTS + ffmpeg: confirme no terminal. Confirme também que meu uso (estudo pessoal, individual) se enquadra na Free License do Remotion.
- Pacotes oficiais na mesma versão do `remotion`: `@remotion/transitions`, `@remotion/paths` (evolvePath para setas e linhas; interpolatePath para morphing), `@remotion/layout-utils` (fitText/fillTextBox para nunca estourar cards), `@remotion/google-fonts`, `@remotion/install-whisper-cpp`.
- Roteiro em `roteiro.json` com `id`, `speaker`, `text` e `cues` (`word`, `target`, `action`, `n`). Cada elemento visual importante aparece no instante exato da palavra-gatilho.
- A duração das cenas vem sempre do manifest (áudio/transcrição), nunca de tempos digitados à mão; a única exceção são as pausas de desafio.
- Zero legendas corridas e zero slides estáticos. Tudo entra animado com os presets de spring centralizados.
- 1920×1080, 30 fps. Um MP4 por módulo e o vídeo final concatenado com ffmpeg. Envie o vídeo final para mim e faça commit e push do código (sem os MP4s).

## Ao terminar, me entregue
- O vídeo final, os capítulos, o PDF de resumo e a thumbnail.
- A lista do que você corrigiu ou ampliou no conteúdo em relação ao meu arquivo.
- O que não foi possível fazer e por quê.
