import {continueRender, delayRender, staticFile} from 'remotion';
import faces from './data/fonts.json';

// Fontes do catálogo @remotion/google-fonts, servidas localmente (scripts/fetch-fonts.mjs)
let loading: Promise<unknown> | null = null;
export const fontsReady = () => {
	if (!loading) {
		const handle = delayRender('Carregando fontes locais');
		loading = Promise.all(
			faces.map((f) => {
				const face = new FontFace(f.family, `url(${staticFile(`fonts/${f.file}`)}) format('woff2')`, {weight: f.weight, unicodeRange: f.unicodeRange});
				(document.fonts as unknown as {add: (f: FontFace) => void}).add(face);
				return face.load();
			}),
		).then(() => continueRender(handle));
	}
	return loading;
};

export const FONT_HEAD = 'Lexend';
export const FONT_BODY = 'Inter';

export const C = {
	bg0: '#070D1A',
	bg1: '#0E1730',
	panel: 'rgba(22, 33, 62, 0.88)',
	panelSolid: '#16213E',
	line: 'rgba(160, 180, 230, 0.18)',
	text: '#EEF2FF',
	dim: '#9AA6C8',
	faint: '#5D6A8F',
	ok: '#3DDC97',
	bad: '#FF5C7A',
	warn: '#FFB703',
	professor: '#7C9CFF',
	aluno: '#FFB86B',
};

export const W = 1920;
export const H = 1080;
export const FPS = 30;
// Área útil entre o cabeçalho e os avatares
export const STAGE = {top: 170, bottom: 880, left: 110, right: 1810};

export const BLOOM_LEVELS = ['Lembrar', 'Compreender', 'Aplicar', 'Analisar', 'Avaliar', 'Criar'] as const;
