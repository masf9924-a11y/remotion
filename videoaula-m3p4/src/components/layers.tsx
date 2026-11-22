import {interpolatePath} from '@remotion/paths';
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {springAt} from '../springs';
import {BLOOM_LEVELS, C, FONT_BODY, FONT_HEAD, H, W} from '../theme';
import type {TimedModule} from '../timeline';

// ---------- Fundo: blob que se transforma (interpolatePath) a cada cena ----------
const blobPath = (seed: number, cx: number, cy: number, r: number) => {
	const n = 8;
	const pts = new Array(n).fill(0).map((_, i) => {
		const a = (i / n) * Math.PI * 2;
		const rr = r * (0.72 + random(`b${seed}-${i}`) * 0.5);
		return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
	});
	// curva fechada suave (Catmull-Rom → Bézier)
	let d = `M ${pts[0][0]} ${pts[0][1]}`;
	for (let i = 0; i < n; i++) {
		const p0 = pts[(i - 1 + n) % n];
		const p1 = pts[i];
		const p2 = pts[(i + 1) % n];
		const p3 = pts[(i + 2) % n];
		const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
		const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`;
	}
	return `${d} Z`;
};

const sceneIndexAt = (mod: TimedModule, frame: number) => {
	let idx = 0;
	mod.scenes.forEach((s, i) => {
		if (frame >= s.start) {
			idx = i;
		}
	});
	return idx;
};

export const Background: React.FC<{mod: TimedModule}> = ({mod}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const idx = sceneIndexAt(mod, frame);
	const scene = mod.scenes[idx];
	const p = idx === 0 ? 1 : springAt({frame, fps, from: scene.start, preset: 'suave', durationInFrames: 45});
	const spots = [
		[1500, 330],
		[420, 760],
		[1450, 820],
		[380, 300],
	];
	const a = spots[(idx + 3) % spots.length];
	const b = spots[idx % spots.length];
	const cx = interpolate(p, [0, 1], [a[0], b[0]]);
	const cy = interpolate(p, [0, 1], [a[1], b[1]]);
	const wobble = Math.sin(frame / 90) * 18;
	const d = interpolatePath(p, blobPath(idx * 7 + mod.number, 0, 0, 380), blobPath(idx * 7 + 7 + mod.number, 0, 0, 380));
	const particles = useMemo(
		() =>
			new Array(34).fill(0).map((_, i) => ({
				x: random(`px${i}`) * W,
				y: random(`py${i}`) * H,
				r: 1 + random(`pr${i}`) * 2.2,
				s: 0.15 + random(`ps${i}`) * 0.4,
			})),
		[],
	);
	return (
		<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, ${C.bg1} 0%, ${C.bg0} 75%)`}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<defs>
					<radialGradient id="blobfill">
						<stop offset="0%" stopColor={mod.color} stopOpacity={0.2} />
						<stop offset="100%" stopColor={mod.color} stopOpacity={0} />
					</radialGradient>
					<pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
						<path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(140,160,220,0.06)" strokeWidth="1" />
					</pattern>
				</defs>
				<rect width={W} height={H} fill="url(#grid)" />
				<g transform={`translate(${cx + wobble} ${cy - wobble * 0.6}) rotate(${frame / 12})`}>
					<path d={d} fill="url(#blobfill)" />
					<path d={d} fill="none" stroke={mod.color} strokeOpacity={0.12} strokeWidth={2} transform="scale(0.82)" />
				</g>
				{particles.map((pt, i) => (
					<circle key={i} cx={(pt.x + frame * pt.s * 0.6) % W} cy={(pt.y - frame * pt.s + H * 4) % H} r={pt.r} fill={mod.color} opacity={0.16} />
				))}
			</svg>
		</AbsoluteFill>
	);
};

// ---------- Cabeçalho: módulo + escada de Bloom com indicador contínuo ----------
export const Header: React.FC<{mod: TimedModule}> = ({mod}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const idx = sceneIndexAt(mod, frame);
	const scene = mod.scenes[idx];
	const prev = mod.scenes[Math.max(0, idx - 1)];
	const enter = springAt({frame, fps, from: 0, preset: 'suave'});
	const levelOf = (b: string) => Math.max(0, BLOOM_LEVELS.indexOf(b as (typeof BLOOM_LEVELS)[number]));
	const move = springAt({frame, fps, from: scene.start + 6, preset: 'firme'});
	const level = interpolate(move, [0, 1], [levelOf(prev.bloom), levelOf(scene.bloom)]);
	const chipW = 150;
	const gap = 10;
	const ladderX = W - 110 - BLOOM_LEVELS.length * (chipW + gap) + gap;
	const progress = frame / mod.durationInFrames;
	return (
		<AbsoluteFill style={{opacity: enter, transform: `translateY(${(1 - enter) * -30}px)`}}>
			<div style={{position: 'absolute', left: 110, top: 44, display: 'flex', alignItems: 'center', gap: 20}}>
				<div
					style={{
						width: 64,
						height: 64,
						borderRadius: 20,
						background: mod.color,
						color: C.bg0,
						fontFamily: FONT_HEAD,
						fontWeight: 800,
						fontSize: 30,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						transform: `rotate(${(1 - enter) * -30}deg)`,
					}}
				>
					{mod.number === 0 ? '★' : mod.number}
				</div>
				<div>
					<div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 28, color: C.text}}>{mod.title}</div>
					<div style={{fontFamily: FONT_BODY, fontSize: 18, color: C.dim, marginTop: 2}}>{mod.subtitle}</div>
				</div>
			</div>
			<div style={{position: 'absolute', left: ladderX, top: 56, width: BLOOM_LEVELS.length * (chipW + gap), height: 44}}>
				<div
					style={{
						position: 'absolute',
						left: level * (chipW + gap),
						top: 0,
						width: chipW,
						height: 44,
						borderRadius: 22,
						background: mod.color,
						boxShadow: `0 0 24px ${mod.color}88`,
					}}
				/>
				{BLOOM_LEVELS.map((b, i) => {
					const active = Math.max(0, 1 - Math.abs(level - i));
					return (
						<div
							key={b}
							style={{
								position: 'absolute',
								left: i * (chipW + gap),
								top: 0,
								width: chipW,
								height: 44,
								borderRadius: 22,
								border: `1.5px solid ${i <= Math.round(level) ? mod.color : C.line}`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontFamily: FONT_BODY,
								fontWeight: 600,
								fontSize: 17,
								color: active > 0.5 ? C.bg0 : i < level ? C.text : C.faint,
							}}
						>
							{b}
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: ladderX, top: 108, fontFamily: FONT_BODY, fontSize: 14, color: C.faint, letterSpacing: 2}}>TAXONOMIA DE BLOOM</div>
			<div style={{position: 'absolute', left: 110, right: 110, top: 140, height: 3, borderRadius: 2, background: C.line}}>
				<div style={{width: `${progress * 100}%`, height: '100%', borderRadius: 2, background: mod.color}} />
			</div>
		</AbsoluteFill>
	);
};

// ---------- Avatares com boca sincronizada às palavras ----------
type AbsLine = {speaker: string; from: number; to: number; words: {from: number; to: number; text: string}[]};

const mouthOpen = (lines: AbsLine[], speaker: string, frame: number) => {
	for (const l of lines) {
		if (l.speaker !== speaker || frame < l.from || frame > l.to) {
			continue;
		}
		for (const w of l.words) {
			if (frame >= w.from && frame < w.to) {
				const syl = Math.max(1, Math.round(w.text.length / 3));
				const t = (frame - w.from) / Math.max(1, w.to - w.from);
				return 0.3 + 0.7 * Math.abs(Math.sin(t * Math.PI * syl));
			}
		}
		return 0.05;
	}
	return 0;
};

const isTalking = (lines: AbsLine[], speaker: string, frame: number) => lines.some((l) => l.speaker === speaker && frame >= l.from - 4 && frame <= l.to + 4);

const Face: React.FC<{kind: 'professor' | 'aluno'; open: number; blink: number; color: string}> = ({kind, open, blink, color}) => {
	const skin = kind === 'professor' ? '#E7B48F' : '#C68E6A';
	return (
		<svg width={120} height={120} viewBox="0 0 120 120">
			<circle cx={60} cy={60} r={58} fill={C.panelSolid} stroke={color} strokeWidth={3} />
			<clipPath id={`clip-${kind}`}>
				<circle cx={60} cy={60} r={56} />
			</clipPath>
			<g clipPath={`url(#clip-${kind})`}>
				<path d="M18 120c2-22 20-32 42-32s40 10 42 32Z" fill={kind === 'professor' ? '#3D5A99' : '#D9822B'} />
				{kind === 'professor' ? <path d="M50 88l10 12 10-12" fill="#EEF2FF" /> : <path d="M40 92c6 8 34 8 40 0" stroke="#F2B36B" strokeWidth={4} fill="none" />}
				<rect x={52} y={72} width={16} height={16} rx={6} fill={skin} />
				<ellipse cx={60} cy={54} rx={24} ry={27} fill={skin} />
				{kind === 'professor' ? (
					<>
						<path d="M36 46c0-18 12-24 24-24s24 6 24 24c-4-8-14-11-24-11s-20 3-24 11Z" fill="#9AA3B5" />
						<path d="M44 66c4 12 28 12 32 0c-2 12-8 16-16 16s-14-4-16-16Z" fill="#9AA3B5" opacity={0.9} />
						<circle cx={50} cy={53} r={8} fill="none" stroke="#2A3550" strokeWidth={2.2} />
						<circle cx={70} cy={53} r={8} fill="none" stroke="#2A3550" strokeWidth={2.2} />
						<path d="M58 53h4" stroke="#2A3550" strokeWidth={2.2} />
					</>
				) : (
					<path d="M35 52c-2-22 12-30 26-30s27 8 24 30c-3-10-6-13-10-15-8 4-24 6-40 15Z" fill="#2B1B14" />
				)}
				<ellipse cx={50} cy={54} rx={3} ry={3 * (1 - blink) + 0.3} fill="#1B2238" />
				<ellipse cx={70} cy={54} rx={3} ry={3 * (1 - blink) + 0.3} fill="#1B2238" />
				<ellipse cx={60} cy={69} rx={6 + open * 2} ry={1.2 + open * 5.5} fill="#5A1F2B" />
			</g>
		</svg>
	);
};

export const Avatars: React.FC<{mod: TimedModule}> = ({mod}) => {
	const frame = useCurrentFrame();
	const lines: AbsLine[] = useMemo(
		() =>
			mod.scenes.flatMap((s) =>
				s.lines
					.filter((l) => l.speaker !== 'pausa')
					.map((l) => ({
						speaker: l.speaker,
						from: s.start + l.from,
						to: s.start + l.from + l.durationInFrames,
						words: l.words.map((w) => ({text: w.text, from: s.start + w.from, to: s.start + w.to})),
					})),
			),
		[mod],
	);
	const people: {kind: 'professor' | 'aluno'; label: string; side: 'left' | 'right'; color: string}[] = [
		{kind: 'professor', label: 'Professor', side: 'left', color: C.professor},
		{kind: 'aluno', label: 'Estudante', side: 'right', color: C.aluno},
	];
	return (
		<AbsoluteFill>
			{people.map((p) => {
				const talking = isTalking(lines, p.kind, frame);
				const open = mouthOpen(lines, p.kind, frame);
				const cycle = (frame + (p.kind === 'aluno' ? 47 : 0)) % 130;
				const blink = cycle < 5 ? Math.sin((cycle / 5) * Math.PI) : 0;
				const bob = talking ? Math.sin(frame / 7) * 2.5 : Math.sin(frame / 40) * 1.5;
				const bars = new Array(5).fill(0).map((_, i) => (talking ? 6 + open * 26 * (0.5 + 0.5 * Math.sin(frame / 3 + i * 1.7)) : 4));
				return (
					<div
						key={p.kind}
						style={{
							position: 'absolute',
							bottom: 34,
							[p.side]: 90,
							display: 'flex',
							flexDirection: p.side === 'left' ? 'row' : 'row-reverse',
							alignItems: 'center',
							gap: 18,
							opacity: talking ? 1 : 0.55,
							transform: `translateY(${bob}px) scale(${talking ? 1 : 0.92})`,
							transformOrigin: p.side === 'left' ? 'left bottom' : 'right bottom',
						}}
					>
						<div style={{borderRadius: '50%', boxShadow: talking ? `0 0 0 6px ${p.color}33, 0 0 40px ${p.color}66` : 'none'}}>
							<Face kind={p.kind} open={open} blink={blink} color={p.color} />
						</div>
						<div style={{display: 'flex', flexDirection: 'column', alignItems: p.side === 'left' ? 'flex-start' : 'flex-end', gap: 8}}>
							<div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 24, color: p.color}}>{p.label}</div>
							<div style={{display: 'flex', gap: 5, alignItems: 'center', height: 34}}>
								{bars.map((h, i) => (
									<div key={i} style={{width: 6, height: h, borderRadius: 3, background: p.color, opacity: talking ? 0.9 : 0.3}} />
								))}
							</div>
						</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
