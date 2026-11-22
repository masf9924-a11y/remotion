// Gera src/data/manifest.json: duração real de cada fala, timestamps de cada
// palavra e o instante (ms) de cada cue, resolvido pela palavra-gatilho.
//
// Fonte de timestamps, em ordem de preferência:
//   1. whisper.cpp (via @remotion/install-whisper-cpp), se o modelo existir;
//   2. limites de palavra (WordBoundary) emitidos pelo próprio motor TTS.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {transcribe, toCaptions} from '@remotion/install-whisper-cpp';
import {WHISPER_DIR, WHISPER_MODEL, WHISPER_VERSION} from './install-whisper.mjs';

const ROOT = process.cwd();
const roteiro = JSON.parse(fs.readFileSync(path.join(ROOT, 'roteiro.json'), 'utf8'));
const modelPath = path.join(WHISPER_DIR, `ggml-${WHISPER_MODEL}.bin`);
const useWhisper = fs.existsSync(modelPath) && !process.argv.includes('--tts-only');
const wavDir = path.join(ROOT, 'build', 'wav');
const whisperDir = path.join(ROOT, 'build', 'whisper');
fs.mkdirSync(wavDir, {recursive: true});
fs.mkdirSync(whisperDir, {recursive: true});

const normalize = (s) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');

const levenshtein = (a, b) => {
	const d = Array.from({length: a.length + 1}, (_, i) => [i, ...Array(b.length).fill(0)]);
	for (let j = 1; j <= b.length; j++) d[0][j] = j;
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
		}
	}
	return d[a.length][b.length];
};

const whisperWords = async (line) => {
	const cache = path.join(whisperDir, `${line.id}.json`);
	if (fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, 'utf8'));
	const wav = path.join(wavDir, `${line.id}.wav`);
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(ROOT, 'public', 'audio', `${line.id}.mp3`), '-ar', '16000', '-ac', '1', wav]);
	const output = await transcribe({
		inputPath: wav,
		whisperPath: WHISPER_DIR,
		whisperCppVersion: WHISPER_VERSION,
		model: WHISPER_MODEL,
		language: 'pt',
		tokenLevelTimestamps: true,
		printOutput: false,
	});
	const {captions} = toCaptions({whisperCppOutput: output});
	const words = captions.map((c) => ({text: c.text.trim(), startMs: c.startMs, endMs: c.endMs}));
	fs.writeFileSync(cache, JSON.stringify(words));
	return words;
};

const findInWords = (words, cue) => {
	const target = normalize(cue.word);
	const wanted = cue.n ?? 1;
	let seen = 0;
	for (const w of words) {
		if (normalize(w.text) === target && ++seen === wanted) return w.startMs;
	}
	// Whisper pode quebrar uma palavra em tokens: tenta juntar até 3 tokens seguidos.
	seen = 0;
	for (let i = 0; i < words.length; i++) {
		let joined = '';
		for (let k = 0; k < 3 && i + k < words.length; k++) {
			joined += normalize(words[i + k].text);
			if (joined === target && ++seen === wanted) return words[i].startMs;
		}
	}
	// Grafia aproximada: aceita a palavra mais parecida (edit distance).
	let best = null;
	for (const w of words) {
		const dist = levenshtein(normalize(w.text), target);
		if (dist <= Math.max(1, Math.floor(target.length / 4)) && (!best || dist < best.dist)) best = {dist, ms: w.startMs};
	}
	return best ? best.ms : null;
};

// Usa o tempo do Whisper; se não achar a palavra-gatilho, cai no tempo do TTS
// (mesmo áudio, mesma linha do tempo) em vez de abortar.
const findCueMs = (words, cue, lineId, fallbackWords) => {
	const w = findInWords(words, cue);
	if (w !== null) return w;
	if (fallbackWords) {
		const f = findInWords(fallbackWords, cue);
		if (f !== null) {
			console.warn(`  cue "${cue.word}" (${lineId}): Whisper não achou, usando tempo do TTS`);
			return f;
		}
	}
	throw new Error(`Cue "${cue.word}" não encontrado na fala ${lineId}`);
};

const manifest = {
	source: useWhisper ? `whisper.cpp ${WHISPER_VERSION} (${WHISPER_MODEL})` : 'edge-tts WordBoundary',
	generatedAt: new Date().toISOString(),
	modules: [],
};

let totalMs = 0;
for (const mod of roteiro.modules) {
	const scenes = [];
	for (const scene of mod.scenes) {
		const lines = [];
		for (const line of scene.lines) {
			if (line.speaker === 'pausa') {
				lines.push({id: line.id, speaker: 'pausa', audio: null, durationMs: line.pauseMs, words: [], cues: []});
				totalMs += line.pauseMs;
				continue;
			}
			const tts = JSON.parse(fs.readFileSync(path.join(ROOT, 'build', 'tts', `${line.id}.json`), 'utf8'));
			const words = useWhisper ? await whisperWords(line) : tts.words;
			const cues = line.cues.map((cue) => ({
				target: cue.target,
				action: cue.action ?? 'show',
				word: cue.word,
				ms: findCueMs(words, cue, line.id, tts.words),
			}));
			lines.push({id: line.id, speaker: line.speaker, audio: `audio/${line.id}.mp3`, durationMs: tts.durationMs, words, cues});
			totalMs += tts.durationMs;
		}
		scenes.push({id: scene.id, lines});
	}
	manifest.modules.push({id: mod.id, scenes});
}

fs.mkdirSync(path.join(ROOT, 'src', 'data'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'src', 'data', 'manifest.json'), JSON.stringify(manifest));
console.log(`Manifest: fonte=${manifest.source}, fala+pausas=${(totalMs / 60000).toFixed(1)} min`);
