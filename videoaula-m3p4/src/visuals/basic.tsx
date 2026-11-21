import {evolvePath, interpolatePath} from '@remotion/paths';
import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Icon} from '../components/icons';
import {useCueFrame, useCueSpring, useScene} from '../components/scene-context';
import {fitBlock, fitLine} from '../components/text-fit';
import {springAt} from '../springs';
import {BLOOM_LEVELS, C, FONT_BODY, FONT_HEAD} from '../theme';
import type {Visual} from '../timeline';
import {SceneHeading} from './common';

// Formas para o morphing do selo de abertura (mesmo número de vértices → morph limpo)
const shape = (kind: 'circle' | 'squircle' | 'hex', r: number) => {
	const n = 12;
	const pts: string[] = [];
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2 - Math.PI / 2;
		let rr = r;
		if (kind === 'hex') {
			const seg = Math.PI / 3;
			const local = ((a + Math.PI / 2) % seg) - seg / 2;
			rr = (r * Math.cos(seg / 2)) / Math.cos(local);
		}
		if (kind === 'squircle') {
			rr = r * (0.9 + 0.1 * Math.cos(4 * a));
		}
		pts.push(`${Math.cos(a) * rr} ${Math.sin(a) * rr}`);
	}
	return `M ${pts[0]} ${pts.slice(1).map((p) => `L ${p}`).join(' ')} Z`;
};

export const Opener: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color, mod} = useScene();
	const enter = useCueSpring('__start', 'suave');
	const titleP = useCueSpring('title', 'firme');
	const subP = useCueSpring('subtitle', 'suave');
	const drawP = springAt({frame, fps, from: 10, preset: 'suave', durationInFrames: 60});
	// morph contínuo círculo → squircle → hexágono
	const t = (frame / 75) % 3;
	const shapes = [shape('circle', 190), shape('squircle', 190), shape('hex', 190)];
	const i0 = Math.floor(t);
	const d = interpolatePath(t - i0, shapes[i0], shapes[(i0 + 1) % 3]);
	const titleSize = fitLine({text: v.title, width: 1000, maxSize: 100, minSize: 56, fontFamily: FONT_HEAD, fontWeight: 800});
	const subSize = fitBlock({text: v.subtitle, width: 1000, height: 130, maxSize: 40, minSize: 24, lineHeight: 1.3, fontFamily: FONT_BODY, fontWeight: 400});
	const levels = Array.from(new Set(mod.scenes.map((s) => s.bloom))).sort((a, b) => BLOOM_LEVELS.indexOf(a as never) - BLOOM_LEVELS.indexOf(b as never));
	return (
		<>
			<svg width={600} height={600} style={{position: 'absolute', left: 200, top: 250, overflow: 'visible'}}>
				<g transform={`translate(260 270) scale(${interpolate(enter, [0, 1], [0.4, 1])}) rotate(${frame / 4})`}>
					<path d={d} fill={`${color}1f`} stroke={color} strokeWidth={4} />
					<path d={shape('circle', 230)} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={2} strokeDasharray="6 14" />
				</g>
			</svg>
			<div style={{position: 'absolute', left: 340, top: 400, opacity: enter}}>
				<Icon name={v.icon} size={240} color={color} draw={drawP} strokeWidth={1.4} />
			</div>
			<div style={{position: 'absolute', left: 800, top: 330, width: 1010}}>
				<div style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: 26, letterSpacing: 6, color, textTransform: 'uppercase', opacity: enter, transform: `translateX(${(1 - enter) * 40}px)`}}>{v.kicker}</div>
				<div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: titleSize, color: C.text, lineHeight: 1.05, marginTop: 18, whiteSpace: 'nowrap', opacity: titleP, transform: `translateY(${(1 - titleP) * 50}px)`, letterSpacing: -1.5}}>{v.title}</div>
				<div style={{height: 6, width: 220 * subP, background: color, borderRadius: 3, marginTop: 26}} />
				<div style={{fontFamily: FONT_BODY, fontSize: subSize, color: C.dim, marginTop: 24, lineHeight: 1.3, opacity: subP, transform: `translateY(${(1 - subP) * 24}px)`}}>{v.subtitle}</div>
				<div style={{display: 'flex', gap: 12, marginTop: 40, alignItems: 'center'}}>
					{levels.map((l, i) => {
						const p = springAt({frame, fps, from: 30 + i * 6, preset: 'elastico'});
						return (
							<React.Fragment key={l}>
								{i > 0 ? <div style={{color: C.faint, fontSize: 24, opacity: p}}>→</div> : null}
								<div style={{padding: '8px 18px', borderRadius: 999, border: `1.5px solid ${color}88`, color: C.text, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 20, opacity: p, transform: `scale(${p})`}}>{l}</div>
							</React.Fragment>
						);
					})}
				</div>
			</div>
		</>
	);
};

export const Quote: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color} = useScene();
	const start = useCueFrame('quote') ?? 0;
	const marks = useCueSpring('quote', 'elastico');
	const words: string[] = v.text.split(' ');
	const norm = (s: string) => s.replace(/[.,;:()]/g, '').toLowerCase();
	const highlights: string[] = (v.highlights as string[]).map((h) => h.toLowerCase());
	const size = fitBlock({text: v.text, width: 1380, height: 420, maxSize: 74, minSize: 40, lineHeight: 1.3, fontFamily: FONT_HEAD, fontWeight: 700});
	return (
		<>
			<div style={{position: 'absolute', left: 200, top: 210, fontFamily: FONT_HEAD, fontSize: 260, color, opacity: 0.35 * marks, transform: `scale(${marks}) rotate(${(1 - marks) * -20}deg)`, lineHeight: 1}}>“</div>
			<div style={{position: 'absolute', left: 270, top: 330, width: 1380, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: size, lineHeight: 1.3, color: C.text}}>
				{words.map((w, i) => {
					const p = springAt({frame, fps, from: start + i * 3, preset: 'firme'});
					const hl = highlights.includes(norm(w));
					const under = springAt({frame, fps, from: start + words.length * 3 + 6 + i, preset: 'suave'});
					const wave = 'M 0 6 Q 12 0 24 6 T 48 6 T 72 6 T 96 6 T 120 6 T 144 6 T 168 6 T 192 6 T 216 6 T 240 6';
					return (
						<span key={i} style={{display: 'inline-block', position: 'relative', marginRight: size * 0.28, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: hl ? color : C.text}}>
							{w}
							{hl ? (
								<svg width="100%" height={14} viewBox="0 0 240 12" preserveAspectRatio="none" style={{position: 'absolute', left: 0, bottom: -6}}>
									<path d={wave} stroke={color} strokeWidth={4} fill="none" {...evolvePath(under, wave)} />
								</svg>
							) : null}
						</span>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: 270, top: 790, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 22, letterSpacing: 5, color: C.dim, opacity: springAt({frame, fps, from: start + words.length * 3 + 10, preset: 'suave'})}}>FRASE-CHAVE PARA A PROVA</div>
		</>
	);
};

export const BloomPyramid: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color} = useScene();
	const outline = useCueSpring('pyramid', 'suave');
	const clockP = useCueSpring('clock', 'elastico');
	const levels = v.levels as {id: string; label: string; sub: string}[];
	const cx = 720;
	const baseY = 860;
	const lh = 98;
	const topW = 300;
	const baseW = 1180;
	const widthAt = (y: number) => interpolate(y, [baseY - levels.length * lh, baseY], [topW, baseW]);
	const outlineD = `M ${cx - baseW / 2} ${baseY} L ${cx - topW / 2} ${baseY - levels.length * lh} L ${cx + topW / 2} ${baseY - levels.length * lh} L ${cx + baseW / 2} ${baseY} Z`;
	return (
		<>
			<SceneHeading text={v.heading} />
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				<path d={outlineD} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={3} {...evolvePath(outline, outlineD)} />
				{levels.map((l, i) => {
					const p = useCueSpringLevel(l.id);
					const y1 = baseY - i * lh;
					const y0 = y1 - lh + 8;
					const w1 = widthAt(y1);
					const w0 = widthAt(y0);
					const lift = (1 - p) * 60;
					const d = `M ${cx - w1 / 2 + 6} ${y1 - 4 + lift} L ${cx - w0 / 2 + 6} ${y0 + lift} L ${cx + w0 / 2 - 6} ${y0 + lift} L ${cx + w1 / 2 - 6} ${y1 - 4 + lift} Z`;
					const alpha = 0.25 + (i / levels.length) * 0.75;
					return (
						<g key={l.id} opacity={p}>
							<path d={d} fill={color} fillOpacity={alpha * 0.85} stroke={color} strokeWidth={2} />
							<text x={cx} y={(y0 + y1) / 2 + lift - 4} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={34} fill={C.bg0}>
								{l.label}
							</text>
							<text x={cx} y={(y0 + y1) / 2 + lift + 26} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={600} fontSize={19} fill={C.bg0} opacity={0.8}>
								{l.sub}
							</text>
						</g>
					);
				})}
			</svg>
			<div
				style={{
					position: 'absolute',
					left: 1440,
					top: 420,
					width: 370,
					padding: 30,
					borderRadius: 28,
					background: C.panel,
					border: `2px solid ${C.warn}`,
					opacity: clockP,
					transform: `scale(${interpolate(clockP, [0, 1], [0.5, 1])})`,
					textAlign: 'center',
				}}
			>
				<svg width={120} height={120} viewBox="0 0 120 120">
					<circle cx={60} cy={60} r={52} fill="none" stroke={C.warn} strokeWidth={6} />
					<line x1={60} y1={60} x2={60 + 38 * Math.sin(frame / 8)} y2={60 - 38 * Math.cos(frame / 8)} stroke={C.warn} strokeWidth={6} strokeLinecap="round" />
					<circle cx={60} cy={60} r={6} fill={C.warn} />
				</svg>
				<div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 32, color: C.text, marginTop: 10}}>Pausa = sua vez</div>
				<div style={{fontFamily: FONT_BODY, fontSize: 22, color: C.dim, marginTop: 8}}>responda antes da correção</div>
			</div>
			<div style={{position: 'absolute', left: 1440, top: 330, fontFamily: FONT_BODY, fontSize: 20, color: C.faint, opacity: springAt({frame, fps, from: 40, preset: 'suave'})}}>da base ao topo ↑</div>
		</>
	);
};

// pequeno wrapper para usar o hook dentro do map com nome estável
const useCueSpringLevel = (id: string) => useCueSpring(id, 'firme');
