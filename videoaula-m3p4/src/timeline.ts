import roteiro from '../roteiro.json';
import manifest from './data/manifest.json';
import {FPS} from './theme';

// Constantes de ritmo (respiros), não durações de fala:
// toda duração de fala vem do manifest gerado a partir do áudio.
export const TRANSITION_FRAMES = 20;
const LINE_GAP_MS = 320;
const SCENE_TAIL_MS = 650;
const MODULE_TAIL_MS = 1400;

const msToFrames = (ms: number) => Math.round((ms / 1000) * FPS);

export type Speaker = 'professor' | 'aluno' | 'pausa';
export type CueAction = 'show' | 'highlight' | 'pick' | 'solve';

export type TimedWord = {text: string; from: number; to: number};

export type TimedLine = {
	id: string;
	speaker: Speaker;
	audio: string | null;
	// frames relativos ao início da cena
	from: number;
	durationInFrames: number;
	words: TimedWord[];
};

export type CueMap = Record<string, Partial<Record<CueAction, number>>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Visual = {type: string; [key: string]: any};

export type TimedScene = {
	id: string;
	bloom: string;
	visual: Visual;
	// início absoluto no módulo (já descontada a sobreposição das transições)
	start: number;
	durationInFrames: number;
	// frame relativo em que a primeira fala começa
	lead: number;
	lines: TimedLine[];
	cues: CueMap;
	pauses: {from: number; to: number}[];
};

export type TimedModule = {
	id: string;
	number: number;
	title: string;
	subtitle: string;
	color: string;
	scenes: TimedScene[];
	durationInFrames: number;
};

type ManifestLine = {
	id: string;
	speaker: Speaker;
	audio: string | null;
	durationMs: number;
	words: {text: string; startMs: number; endMs: number}[];
	cues: {target: string; action: CueAction; ms: number}[];
};

export const buildModule = (moduleId: string): TimedModule => {
	const mod = roteiro.modules.find((m) => m.id === moduleId);
	const mMod = manifest.modules.find((m) => m.id === moduleId);
	if (!mod || !mMod) {
		throw new Error(`Módulo ${moduleId} não encontrado no roteiro/manifest`);
	}

	let cursor = 0;
	const scenes: TimedScene[] = mod.scenes.map((scene, sIdx) => {
		const mScene = mMod.scenes.find((s) => s.id === scene.id);
		if (!mScene) {
			throw new Error(`Cena ${scene.id} ausente no manifest. Rode "npm run align".`);
		}
		const lead = TRANSITION_FRAMES + (sIdx === 0 ? 10 : 4);
		let t = lead;
		const cues: CueMap = {};
		const pauses: {from: number; to: number}[] = [];
		const lines: TimedLine[] = (mScene.lines as ManifestLine[]).map((l) => {
			const from = t;
			const durationInFrames = msToFrames(l.durationMs);
			for (const cue of l.cues) {
				const f = from + msToFrames(cue.ms);
				cues[cue.target] = cues[cue.target] ?? {};
				const prev = cues[cue.target][cue.action];
				cues[cue.target][cue.action] = prev === undefined ? f : Math.min(prev, f);
			}
			if (l.speaker === 'pausa') {
				pauses.push({from, to: from + durationInFrames});
			}
			t += durationInFrames + msToFrames(LINE_GAP_MS);
			return {
				id: l.id,
				speaker: l.speaker,
				audio: l.audio,
				from,
				durationInFrames,
				words: l.words.map((w) => ({text: w.text, from: from + msToFrames(w.startMs), to: from + Math.max(msToFrames(w.endMs), msToFrames(w.startMs) + 2)})),
			};
		});
		const isLast = sIdx === mod.scenes.length - 1;
		const durationInFrames = t + msToFrames(isLast ? MODULE_TAIL_MS : SCENE_TAIL_MS) + (isLast ? 0 : TRANSITION_FRAMES);
		const timed: TimedScene = {
			id: scene.id,
			bloom: scene.bloom,
			visual: scene.visual as Visual,
			start: cursor,
			durationInFrames,
			lead,
			lines,
			cues,
			pauses,
		};
		cursor += durationInFrames - (isLast ? 0 : TRANSITION_FRAMES);
		return timed;
	});

	return {
		id: mod.id,
		number: mod.number,
		title: mod.title,
		subtitle: mod.subtitle,
		color: mod.color,
		scenes,
		durationInFrames: cursor,
	};
};

export const MODULE_IDS = roteiro.modules.map((m) => m.id);
export const MANIFEST_SOURCE = manifest.source;
