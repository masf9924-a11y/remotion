import {evolvePath} from '@remotion/paths';
import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Icon} from '../components/icons';
import {useCueFrame, useCueSpring, useScene} from '../components/scene-context';
import {springAt} from '../springs';
import {C, FONT_BODY, FONT_HEAD} from '../theme';
import type {Visual} from '../timeline';
import {FitText} from './common';

export const Quiz: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color, scene} = useScene();
	const tagP = useCueSpring('__tag', 'elastico');
	const qP = useCueSpring('question', 'firme');
	const optFrom = useCueFrame('options');
	const answerFrom = useCueFrame('answer', 'show');
	const reveal = springAt({frame, fps, from: answerFrom, preset: 'firme'});
	const explain = useCueSpring('explanation', 'firme');
	const pause = scene.pauses[0];
	const options = v.options as {id: string; text: string}[];
	// relógio: aparece com as alternativas, conta durante a pausa
	const clockP = springAt({frame, fps, from: optFrom === null ? null : optFrom + 10, preset: 'elastico'});
	const remaining = pause ? Math.max(0, pause.to - Math.max(frame, pause.from)) : 0;
	const pauseProgress = pause ? interpolate(frame, [pause.from, pause.to], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
	const inPause = pause && frame >= pause.from && frame < pause.to;
	const secs = Math.ceil(remaining / fps);
	const ring = 'M 80 12 a 68 68 0 1 1 -0.01 0';
	return (
		<>
			<div style={{position: 'absolute', left: 160, top: 182, display: 'flex', alignItems: 'center', gap: 16, opacity: tagP, transform: `scale(${tagP})`, transformOrigin: 'left center'}}>
				<div style={{padding: '10px 24px', borderRadius: 999, background: C.warn, color: C.bg0, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 26, letterSpacing: 3}}>DESAFIO</div>
				<div style={{padding: '10px 22px', borderRadius: 999, border: `2px solid ${color}`, color: C.text, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 22}}>nível de Bloom: {v.level}</div>
			</div>
			<div style={{position: 'absolute', left: 160, top: 262, width: 1400, height: 160, borderRadius: 26, background: C.panel, border: `2px solid ${color}66`, padding: '18px 30px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', opacity: qP, transform: `translateY(${(1 - qP) * 40}px)`}}>
				<FitText text={v.question} width={1340} height={124} maxSize={38} minSize={20} weight={600} head lineHeight={1.25} />
			</div>
			<svg width={160} height={160} style={{position: 'absolute', left: 1600, top: 262, opacity: clockP, transform: `scale(${clockP})`}}>
				<circle cx={80} cy={80} r={68} fill={C.panelSolid} stroke={C.line} strokeWidth={10} />
				<path d={ring} fill="none" stroke={inPause ? C.warn : reveal > 0 ? C.ok : color} strokeWidth={10} strokeLinecap="round" {...evolvePath(pause && frame >= pause.from ? 1 - pauseProgress : 1, ring)} />
				{reveal > 0.05 ? null : (
					<text x={80} y={inPause ? 100 : 92} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={inPause ? 64 : 30} fill={C.text}>
						{inPause ? secs : 'pense'}
					</text>
				)}
			</svg>
			{reveal > 0.05 ? (
				<div style={{position: 'absolute', left: 1640, top: 302, transform: `scale(${reveal})`}}>
					<Icon name="check" size={80} color={C.ok} strokeWidth={3.5} draw={reveal} />
				</div>
			) : null}
			{options.map((o, i) => (
				<Option key={o.id} o={o} i={i} correct={v.correct === o.id} optFrom={optFrom} reveal={reveal} />
			))}
			<div style={{position: 'absolute', left: 160, top: 758, width: 1600, height: 110, borderRadius: 22, background: `${C.ok}1c`, borderLeft: `10px solid ${C.ok}`, padding: '12px 28px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 20, opacity: explain, transform: `translateY(${(1 - explain) * 40}px)`}}>
				<div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 24, color: C.ok, letterSpacing: 2}}>POR QUÊ?</div>
				<FitText text={v.explanation} width={1360} height={86} maxSize={28} minSize={16} weight={500} lineHeight={1.25} />
			</div>
		</>
	);
};

const Option: React.FC<{o: {id: string; text: string}; i: number; correct: boolean; optFrom: number | null; reveal: number}> = ({o, i, correct, optFrom, reveal}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color} = useScene();
	const p = springAt({frame, fps, from: optFrom === null ? null : optFrom + i * 5, preset: 'firme'});
	const pick = useCueSpring(o.id, 'elastico', {action: 'pick'});
	const col = i % 2;
	const row = Math.floor(i / 2);
	const x = 160 + col * 810;
	const y = 448 + row * 148;
	const w = 790;
	const h = 132;
	const picked = pick > 0;
	const wrongPick = picked && !correct;
	const border = reveal > 0.5 ? (correct ? C.ok : wrongPick ? C.bad : C.line) : picked ? C.aluno : `${color}55`;
	const dim = reveal > 0.5 && !correct && !picked ? 0.4 : 1;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				borderRadius: 22,
				background: reveal > 0.5 && correct ? `${C.ok}2a` : C.panel,
				border: `3px ${picked && reveal < 0.5 ? 'dashed' : 'solid'} ${border}`,
				display: 'flex',
				alignItems: 'center',
				gap: 22,
				padding: '0 24px',
				boxSizing: 'border-box',
				opacity: p * dim,
				transform: `translateY(${(1 - p) * 40}px) scale(${1 + (correct ? reveal * 0.03 : 0)})`,
				boxShadow: correct && reveal > 0 ? `0 0 ${40 * reveal}px ${C.ok}88` : 'none',
			}}
		>
			<div style={{width: 62, height: 62, flexShrink: 0, borderRadius: 18, background: reveal > 0.5 && correct ? C.ok : `${color}2e`, color: reveal > 0.5 && correct ? C.bg0 : C.text, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{o.id.toUpperCase()}</div>
			<FitText text={o.text} width={w - 190} height={h - 24} maxSize={30} minSize={16} weight={500} lineHeight={1.2} />
			{picked ? (
				<div style={{position: 'absolute', right: 18, top: -18, padding: '4px 14px', borderRadius: 999, background: C.aluno, color: C.bg0, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 18, transform: `scale(${pick})`}}>Estudante</div>
			) : null}
			{reveal > 0.5 && (correct || wrongPick) ? (
				<div style={{position: 'absolute', right: 22, top: 40, transform: `scale(${reveal})`}}>
					<Icon name={correct ? 'check' : 'cross'} size={50} color={correct ? C.ok : C.bad} strokeWidth={3.5} />
				</div>
			) : null}
		</div>
	);
};
