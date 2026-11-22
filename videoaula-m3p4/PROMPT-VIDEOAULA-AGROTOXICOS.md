Atue como engenheiro de software criativo, designer instrucional e pedagogo. Crie, configure e renderize uma videoaula completa em Motion Graphics / infográfico animado, programada em React/TypeScript com Remotion, renderizada em MP4, para eu estudar para uma prova de medicina (4º semestre, Unicid, São Paulo; disciplinas: tutoria, morfologia, bioética, epidemiologia, APS e farmacologia).

## Tema e objetivos de aprendizagem (material base)

Não tenho resumo pronto: você deve montar o conteúdo a partir de fontes confiáveis (Anvisa, Ministério da Saúde, Convenção de Estocolmo, FIOCRUZ/CIATox, livros-texto de toxicologia e artigos do PubMed, se a ferramenta estiver disponível), com rigor acadêmico. Onde a legislação brasileira ou as datas de proibição forem incertas, confirme na fonte oficial e, se não conseguir, diga isso no vídeo e na lista final em vez de afirmar com certeza.

1. Identificar os principais agrotóxicos clorados e sua permissão quanto ao uso
2. Reconhecer formas de exposição a esses compostos
3. Caracterizar os principais mecanismos responsáveis pelos efeitos adversos da exposição, explicando toxicodinâmica e toxicocinética
4. Definir intoxicação e caracterizar suas fases
5. Listar os métodos de determinação da exposição a agrotóxicos
6. Definir agentes tóxicos
7. Caracterizar o correto manejo de resíduos industriais
8. Caracterizar poluição de solo e água
9. Identificar as medidas de descontaminação ambiental

Pontos que merecem atenção especial no conteúdo:
- Organoclorados: DDT, HCH/lindano, aldrin, dieldrin, endrin, clordano, heptacloro, endossulfan, mirex, entre outros. Para cada um: situação regulatória no Brasil (proibido, restrito, ainda permitido em qual uso) e na Convenção de Estocolmo (POPs).
- Toxicocinética: absorção (oral, dérmica, inalatória), lipofilicidade, distribuição no tecido adiposo, biotransformação, meia-vida longa, excreção (inclusive leite materno e placenta), bioacumulação e biomagnificação.
- Toxicodinâmica: ação no sistema nervoso central (canais de sódio, receptor GABA-A), quadro agudo (tremores, convulsões) e crônico (efeitos endócrinos, carcinogenicidade, neurotoxicidade, hepatotoxicidade, efeitos reprodutivos).
- Fases da intoxicação: exposição, toxicocinética, toxicodinâmica e clínica, e a distinção entre intoxicação aguda, subaguda e crônica.
- Determinação da exposição: monitoramento ambiental, monitoramento biológico (biomarcadores de exposição, efeito e suscetibilidade), dosagem em sangue, soro, urina e leite, análise de resíduos em alimentos.
- Conexão com a prática: APS, vigilância em saúde do trabalhador, notificação compulsória das intoxicações exógenas, EPI e rotulagem (faixas coloridas de toxicidade), bioética e justiça ambiental.

## Modo autônomo
Não me faça perguntas nem espere aprovação: tome as decisões técnicas, visuais e pedagógicas e execute tudo, do planejamento ao MP4 final. Só me interrompa se algo depender de uma permissão que só eu posso dar (rede, GitHub).

## Ponto de partida: reutilize o projeto anterior
Já existe um projeto funcionando em `videoaula-m3p4/` neste repositório (Remotion 4.0.545), na branch `main`. **Não recomece do zero:** copie-o para uma nova pasta (`videoaula-agrotoxicos/`), leia o `README.md` e o arquivo `PROMPT-PROXIMA-VIDEOAULA.md` (que traz as lições aprendidas) e reaproveite:
- `scripts/tts.py`: edge-tts com vozes pt-BR (Professor: `pt-BR-AntonioNeural`; Estudante: `pt-BR-FranciscaNeural`) e WordBoundary.
- `scripts/align.mjs`: gera `src/data/manifest.json` com duração real de cada fala e o instante de cada cue; usa whisper.cpp se o modelo existir e, se não existir, os tempos por palavra do TTS.
- `scripts/fetch-fonts.mjs`, `src/springs.ts`, `src/timeline.ts`, `src/components/*` e `src/visuals/*` (opener, cards, flow row/cycle/hub/stairs, table, compare, stats, profile, quiz com contagem regressiva, quote e cenas sob medida).
- `scripts/stills.ts` (um PNG por cena para revisão) e `scripts/render-all.ts` (um MP4 por módulo + concatenação via ffmpeg).

## Armadilhas do ambiente já resolvidas
- TLS/proxy: o edge-tts precisa usar `/root/.ccr/ca-bundle.crt` (o script atual já faz isso).
- Chrome: use `/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell` (o projeto já faz isso de forma condicional).
- Fontes: carregue os `.woff2` locais via `FontFace` + `staticFile`, incluindo o subset `greek`.
- Whisper: eu liberei `huggingface.co` e `cas-bridge.xethub.hf.co` no ambiente. Tente `npm run whisper` para baixar o modelo; se falhar, siga com os tempos do TTS e me avise.
- Faça o primeiro commit e o push cedo, para descobrir logo qualquer problema de permissão.

## Pedagogia
- Módulos seguindo a Taxonomia de Bloom (Lembrar → Compreender → Aplicar → Analisar → Avaliar → Criar), com a escada de Bloom no cabeçalho mudando por cena.
- Módulo de abertura com o mapa da aula e módulo final com caso clínico/ambiental integrador e mapa mental (nível Criar). Sugestão de caso: comunidade rural com histórico de uso de organoclorado, com trabalhador intoxicado, contaminação de solo e água e decisões de vigilância.
- Pelo menos 1 desafio estilo prova por módulo: pausa de 7 s com contagem regressiva; o Estudante escolhe uma alternativa (às vezes errada de forma plausível) e o Professor corrige com delicadeza, explicando o porquê.
- Uma frase-chave para a prova no fim de cada módulo.
- Diálogo entre o Professor (calmo, didático, acolhedor, sem pressa) e o Estudante (dúvidas reais, pede exemplos, conecta os temas). Falas de 1 a 3 frases.

## Melhorias em relação à primeira videoaula (faça)
1. Duração total de 20 a 25 min, módulos de no máximo 4 a 5 min. A primeira ficou com 32 min; corte repetições e priorize o que mais cai em prova.
2. Menos texto na tela: no máximo cerca de 12 palavras por card; o detalhe vai na fala. Prefira diagramas a listas.
3. Pelo menos uma cena sob medida por módulo, por exemplo: bioacumulação e biomagnificação ao longo da cadeia alimentar (zooplâncton → peixe → ave/humano), ação do organoclorado no canal de sódio e no GABA-A, curva de concentração no tecido adiposo, ciclo do contaminante entre solo, água e alimento, e corte de um aterro industrial. Evite rótulos sobrepostos.
4. Continuidade visual: use mais vezes um elemento que se transforma na cena seguinte.
5. No fim de cada módulo, 3 flashcards relâmpago (pergunta, 3 s, resposta).
6. Áudio: além do tique e do sino dos desafios, um "pop" suave quando os cards entram e uma trilha ambiente bem baixa (abaixo de -30 dB), com ducking durante as falas.
7. Pronúncia: antes de sintetizar tudo, teste siglas e termos difíceis (DDT, HCH, POPs, GABA-A, toxicodinâmica, biomagnificação) e reescreva no texto falado o que soar mal.
8. Controle de qualidade: renderize stills de cada cena e também de estados intermediários (meio de transição, pausa do quiz, revelação da resposta). Procure sobreposição e texto pequeno demais (menos de 18 px) e corrija antes do render final.
9. Entregáveis extras: lista de capítulos com timestamps (formato YouTube) gerada a partir do manifest; PDF de 1 a 2 páginas de resumo para revisão; thumbnail PNG.

## Stack e regras técnicas
- Node LTS + ffmpeg: confirme no terminal. Confirme também que meu uso (estudo pessoal, individual) se enquadra na Free License do Remotion.
- Pacotes oficiais na mesma versão do `remotion`: `@remotion/transitions`, `@remotion/paths` (evolvePath para setas e linhas; interpolatePath para morphing), `@remotion/layout-utils` (fitText/fillTextBox para nunca estourar cards), `@remotion/google-fonts`, `@remotion/install-whisper-cpp`.
- Roteiro em `roteiro.json` com `id`, `speaker`, `text` e `cues` (`word`, `target`, `action`, `n`). Cada elemento visual importante aparece no instante exato da palavra-gatilho.
- A duração das cenas vem sempre do manifest (áudio/transcrição), nunca de tempos digitados à mão; a única exceção são as pausas de desafio.
- Zero legendas corridas e zero slides estáticos. Tudo entra animado com os presets de spring centralizados.
- 1920×1080, 30 fps. Um MP4 por módulo e o vídeo final concatenado com ffmpeg. Envie o vídeo final para mim e faça commit e push do código (sem os MP4s) numa branch nova; não crie pull request a menos que eu peça.

## Ao terminar, me entregue
- O vídeo final, os capítulos, o PDF de resumo e a thumbnail.
- A lista do que você corrigiu, ampliou ou não conseguiu confirmar em fonte oficial (principalmente datas e proibições de agrotóxicos).
- O que não foi possível fazer e por quê.
