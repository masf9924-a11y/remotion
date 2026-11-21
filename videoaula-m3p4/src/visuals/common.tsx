import React from 'react';
import {interpolate} from 'remotion';
import {fitBlock, fitLine} from '../components/text-fit';
import {useCueSpring, usePulse, useScene} from '../components/scene-context';
import {C, FONT_BODY, FONT_HEAD, STAGE} from '../theme';

export const STAGE_W = STAGE.right - STAGE.left;

/** Título da cena: entra suave e mede o texto para nunca estourar a largura. */
export const SceneHeading: React.FC<{text: string; top?: number}> = ({text, top = STAGE.top + 6}) => {
	const {color} = useScene();
	const p = useCueSpring('__heading', 'suave');
	const size = fitLine({text, width: STAGE_W - 40, maxSize: 52, minSize: 30, fontFamily: FONT_HEAD, fontWeight: 700});
	return (
		<div style={{position: 'absolute', left: STAGE.left, top, width: STAGE_W, display: 'flex', alignItems: 'center', gap: 18, opacity: p, transform: `translateY(${(1 - p) * 24}px)`}}>
			<div style={{width: 10, height: size * 0.95, borderRadius: 5, background: color, transform: `scaleY(${p})`}} />
			<div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: size, color: C.text, whiteSpace: 'nowrap', letterSpacing: -0.5}}>{text}</div>
		</div>
	);
};

/** Pílula de informação disparada por cue. */
export const CueChip: React.FC<{id: string; text: string; style?: React.CSSProperties; maxWidth?: number}> = ({id, text, style, maxWidth = 1500}) => {
	const {color} = useScene();
	const p = useCueSpring(id, 'elastico', {fallbackDelay: 20});
	const pulse = usePulse(id);
	const size = fitLine({text, width: maxWidth - 60, maxSize: 26, minSize: 16, fontFamily: FONT_BODY, fontWeight: 600});
	return (
		<div
			style={{
				padding: '12px 26px',
				borderRadius: 999,
				background: `${color}22`,
				border: `2px solid ${color}`,
				color: C.text,
				fontFamily: FONT_BODY,
				fontWeight: 600,
				fontSize: size,
				whiteSpace: 'nowrap',
				opacity: Math.min(1, p * 1.4),
				transform: `scale(${interpolate(p, [0, 1], [0.6, 1]) + pulse * 0.06})`,
				boxShadow: pulse > 0 ? `0 0 ${30 * pulse}px ${color}` : 'none',
				...style,
			}}
		>
			{text}
		</div>
	);
};

/** Bloco de texto que escolhe a maior fonte que cabe na caixa (layout-utils). */
export const FitText: React.FC<{text: string; width: number; height: number; maxSize: number; minSize?: number; weight?: number; head?: boolean; color?: string; lineHeight?: number; style?: React.CSSProperties}> = ({
	text,
	width,
	height,
	maxSize,
	minSize = 14,
	weight = 400,
	head = false,
	color = C.text,
	lineHeight = 1.25,
	style,
}) => {
	const fontFamily = head ? FONT_HEAD : FONT_BODY;
	const size = fitBlock({text, width, height, maxSize, minSize, lineHeight, fontFamily, fontWeight: weight});
	return <div style={{width, fontFamily, fontWeight: weight, fontSize: size, lineHeight, color, ...style}}>{text}</div>;
};
