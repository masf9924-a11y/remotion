import {spring, type SpringConfig} from 'remotion';

// Presets únicos de física usados em TODO o projeto.
export const SPRINGS = {
	// suave: entradas de blocos grandes, câmera, transições
	suave: {damping: 200, stiffness: 80, mass: 1} satisfies Partial<SpringConfig>,
	// firme: cards, nós, linhas de tabela
	firme: {damping: 22, stiffness: 170, mass: 0.9} satisfies Partial<SpringConfig>,
	// elástico: micro-interações (selos, checks, destaques)
	elastico: {damping: 9, stiffness: 180, mass: 0.7} satisfies Partial<SpringConfig>,
} as const;

export type SpringPreset = keyof typeof SPRINGS;

export const springAt = ({
	frame,
	fps,
	from,
	preset,
	durationInFrames,
}: {
	frame: number;
	fps: number;
	from: number | null;
	preset: SpringPreset;
	durationInFrames?: number;
}) => {
	if (from === null) {
		return 0;
	}
	return spring({frame: frame - from, fps, config: SPRINGS[preset], durationInFrames});
};
