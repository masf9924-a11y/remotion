import React from 'react';
import {interpolate} from 'remotion';
import {Icon} from '../components/icons';
import {useCueSpring, useScene} from '../components/scene-context';
import {C, FONT_BODY, FONT_HEAD, STAGE} from '../theme';
import type {Visual} from '../timeline';
import {FitText, SceneHeading, STAGE_W} from './common';

type Card = {id: string; q: string; a: string};

// 3 flashcards relâmpago: a pergunta aparece no cue "show" e a resposta
// gira para dentro no cue "solve" (≈3 s depois, pela fala).
export const Flashcards: React.FC<{v: Visual}> = ({v}) => {
	const cards = v.cards as Card[];
	const gap = 44;
	const w = (STAGE_W - gap * (cards.length - 1)) / cards.length;
	const h = 470;
	const top = STAGE.top + 170;
	return (
		<>
			<SceneHeading text={v.heading} />
			<div style={{position: 'absolute', left: STAGE.left, top: STAGE.top + 92, fontFamily: FONT_BODY, fontSize: 24, color: C.dim, letterSpacing: 1}}>
				pergunta → pense 3 s → resposta
			</div>
			{cards.map((c, i) => (
				<Flashcard key={c.id} card={c} x={STAGE.left + i * (w + gap)} y={top} w={w} h={h} index={i} />
			))}
		</>
	);
};

const Flashcard: React.FC<{card: Card; x: number; y: number; w: number; h: number; index: number}> = ({card, x, y, w, h, index}) => {
	const {color} = useScene();
	const appear = useCueSpring(card.id, 'firme', {fallbackDelay: 10 + index * 8});
	const solve = useCueSpring(card.id, 'elastico', {action: 'solve'});
	const flip = interpolate(solve, [0, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const showBack = flip > 0.5;
	const pad = 30;
	return (
		<>
			<div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 28, border: `2px dashed ${C.line}`, opacity: 1 - appear}} />
			<div
				style={{
					position: 'absolute',
					left: x,
					top: y,
					width: w,
					height: h,
					borderRadius: 28,
					background: showBack ? `${C.ok}1e` : C.panel,
					border: `2.5px solid ${showBack ? C.ok : `${color}66`}`,
					boxShadow: `0 20px 50px rgba(0,0,0,0.35)${showBack ? `, 0 0 ${44 * solve}px ${C.ok}55` : ''}`,
					opacity: appear,
					transform: `translateY(${(1 - appear) * 50}px) perspective(1200px) rotateY(${flip * 180}deg)`,
					transformStyle: 'preserve-3d',
					padding: pad,
					boxSizing: 'border-box',
					display: 'flex',
					flexDirection: 'column',
				}}
			>
				{/* frente (pergunta) */}
				<div style={{position: 'absolute', inset: pad, display: showBack ? 'none' : 'flex', flexDirection: 'column'}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
						<div style={{width: 46, height: 46, borderRadius: 14, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 26, color}}>?</div>
						<div style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: 18, letterSpacing: 2, color: C.faint}}>CARTÃO {index + 1}</div>
					</div>
					<div style={{flex: 1, display: 'flex', alignItems: 'center'}}>
						<FitText text={card.q} width={w - pad * 2} height={h - pad * 2 - 70} maxSize={38} minSize={20} weight={700} head lineHeight={1.2} />
					</div>
				</div>
				{/* verso (resposta) */}
				<div style={{position: 'absolute', inset: pad, display: showBack ? 'flex' : 'none', flexDirection: 'column', transform: 'rotateY(180deg)'}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
						<Icon name="check" size={34} color={C.ok} strokeWidth={3.2} draw={solve} />
						<div style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: 18, letterSpacing: 2, color: C.ok}}>RESPOSTA</div>
					</div>
					<div style={{flex: 1, display: 'flex', alignItems: 'center'}}>
						<FitText text={card.a} width={w - pad * 2} height={h - pad * 2 - 70} maxSize={34} minSize={18} weight={600} lineHeight={1.25} />
					</div>
				</div>
			</div>
		</>
	);
};
