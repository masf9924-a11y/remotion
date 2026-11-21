import React, {createContext, useContext} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {springAt, type SpringPreset} from '../springs';
import type {CueAction, TimedModule, TimedScene} from '../timeline';

type SceneCtx = {scene: TimedScene; color: string; mod: TimedModule};

const Ctx = createContext<SceneCtx | null>(null);

export const SceneProvider: React.FC<{scene: TimedScene; mod: TimedModule; children: React.ReactNode}> = ({scene, mod, children}) => (
	<Ctx.Provider value={{scene, color: mod.color, mod}}>{children}</Ctx.Provider>
);

export const useScene = () => {
	const ctx = useContext(Ctx);
	if (!ctx) {
		throw new Error('useScene fora de SceneProvider');
	}
	return ctx;
};

/**
 * Frame (relativo à cena) em que o cue dispara.
 * - Se o roteiro tem cue para o alvo, usa o instante exato da palavra-gatilho.
 * - Se não tem cue de "show", o elemento entra no início da cena (com `fallbackDelay`).
 * - Para ações diferentes de "show", retorna null quando não houver cue.
 */
export const useCueFrame = (target: string, action: CueAction = 'show', fallbackDelay = 0): number | null => {
	const {scene} = useScene();
	const f = scene.cues[target]?.[action];
	if (f !== undefined) {
		return f;
	}
	if (action !== 'show') {
		return null;
	}
	return scene.lead - 6 + fallbackDelay;
};

export const hasCue = (scene: TimedScene, target: string, action: CueAction = 'show') => scene.cues[target]?.[action] !== undefined;

/** Progresso de spring (0..1) disparado por um cue. */
export const useCueSpring = (target: string, preset: SpringPreset = 'firme', opts: {action?: CueAction; delay?: number; fallbackDelay?: number} = {}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const from = useCueFrame(target, opts.action ?? 'show', opts.fallbackDelay ?? 0);
	return springAt({frame, fps, from: from === null ? null : from + (opts.delay ?? 0), preset});
};

/** Pulso curto (0..1..0) após um cue de destaque. */
export const usePulse = (target: string, action: CueAction = 'highlight') => {
	const frame = useCurrentFrame();
	const from = useCueFrame(target, action);
	if (from === null || frame < from) {
		return 0;
	}
	const t = (frame - from) / 30;
	return Math.max(0, Math.sin(Math.min(t, 1) * Math.PI)) * (t < 1 ? 1 : 0);
};
