import {evolvePath, getPointAtLength, getLength, getTangentAtLength} from '@remotion/paths';
import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Icon} from '../components/icons';
import {useCueFrame, useCueSpring, usePulse, useScene} from '../components/scene-context';
import {springAt} from '../springs';
import {C, FONT_BODY, FONT_HEAD, STAGE} from '../theme';
import type {Visual} from '../timeline';
import {CueChip, FitText, SceneHeading, STAGE_W} from './common';

type Node = {id: string; label: string; sub: string; icon?: string};
type Box = {x: number; y: number; w: number; h: number};

/** Seta que se desenha (evolvePath) com ponta que acompanha a tangente. */
export const Arrow: React.FC<{d: string; progress: number; color: string; width?: number; dashed?: boolean}> = ({d, progress, color, width = 4, dashed}) => {
	if (progress <= 0) {
		return null;
	}
	const len = getLength(d);
	const at = Math.max(0.01, Math.min(len, len * progress));
	const pt = getPointAtLength(d, at) ?? {x: 0, y: 0};
	const tan = getTangentAtLength(d, at) ?? {x: 1, y: 0};
	const ang = (Math.atan2(tan.y, tan.x) * 180) / Math.PI;
	return (
		<g>
			<path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" {...evolvePath(progress, d)} opacity={dashed ? 0.7 : 1} />
			<path d="M -14 -9 L 2 0 L -14 9 Z" fill={color} transform={`translate(${pt.x} ${pt.y}) rotate(${ang})`} />
		</g>
	);
};

const NodeCard: React.FC<{node: Node; box: Box; index: number; big?: boolean}> = ({node, box, index, big}) => {
	const {color} = useScene();
	const p = useCueSpring(node.id, 'firme', {fallbackDelay: 10 + index * 8});
	const draw = useCueSpring(node.id, 'suave', {delay: 3, fallbackDelay: 10 + index * 8});
	const pulse = usePulse(node.id);
	const hl = useCueSpring(node.id, 'elastico', {action: 'highlight'});
	const pad = 18;
	const wide = box.w > box.h * 1.6;
	const hasSub = node.sub.length > 0;
	const shell: React.CSSProperties = {
		position: 'absolute',
		left: box.x,
		top: box.y,
		width: box.w,
		height: box.h,
		borderRadius: 24,
		background: big ? `${color}26` : C.panel,
		border: `2px solid ${hl > 0 ? color : `${color}77`}`,
		boxShadow: `0 16px 40px rgba(0,0,0,0.35)${pulse > 0 ? `, 0 0 ${50 * pulse}px ${color}` : ''}`,
		opacity: p,
		transform: `scale(${interpolate(p, [0, 1], [0.7, 1]) + pulse * 0.05})`,
		padding: pad,
		boxSizing: 'border-box',
		overflow: 'hidden',
		display: 'flex',
	};
	const ghost = <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: 24, border: `2px dashed ${C.line}`, opacity: (1 - p) * 0.9}} />;
	if (wide) {
		const icon = big ? 64 : 54;
		const textW = box.w - pad * 2 - icon - 16;
		const inner = box.h - pad * 2;
		const labelH = hasSub ? inner * 0.5 : inner;
		return (
			<>
				{ghost}
				<div style={{...shell, flexDirection: 'row', alignItems: 'center', gap: 16}}>
					<div style={{flexShrink: 0}}>
						<Icon name={node.icon ?? 'target'} size={icon} color={color} draw={draw} />
					</div>
					<div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', height: inner}}>
						<FitText text={node.label} width={textW} height={labelH} maxSize={big ? 40 : 32} minSize={18} weight={700} head lineHeight={1.1} />
						{hasSub ? <FitText text={node.sub} width={textW} height={inner - labelH} maxSize={24} minSize={15} color={C.dim} lineHeight={1.22} style={{marginTop: 4}} /> : null}
					</div>
				</div>
			</>
		);
	}
	const icon = 52;
	const labelH = hasSub ? Math.min(84, box.h * 0.32) : box.h - pad * 2 - icon - 8;
	return (
		<>
			{ghost}
			<div style={{...shell, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'}}>
				<Icon name={node.icon ?? 'target'} size={icon} color={color} draw={draw} />
				<div style={{marginTop: 10, height: labelH, display: 'flex', alignItems: 'center'}}>
					<FitText text={node.label} width={box.w - pad * 2} height={labelH} maxSize={34} minSize={18} weight={700} head lineHeight={1.1} style={{textAlign: 'center'}} />
				</div>
				{hasSub ? <FitText text={node.sub} width={box.w - pad * 2} height={box.h - pad * 2 - icon - labelH - 24} maxSize={25} minSize={15} color={C.dim} lineHeight={1.25} style={{textAlign: 'center', marginTop: 8}} /> : null}
			</div>
		</>
	);
};

const Hero: React.FC<{hero: {title: string; body: string}; firstNode: string}> = ({hero, firstNode}) => {
	const {color} = useScene();
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const appear = useCueSpring('hero', 'firme');
	// quando o primeiro nó entra, o card-herói encolhe e vira a faixa-tema da cena
	const dockFrom = useCueFrame(firstNode, 'show');
	const dock = springAt({frame, fps, from: dockFrom === null ? null : dockFrom - 8, preset: 'suave', durationInFrames: 30});
	const big: Box = {x: 360, y: 330, w: 1200, h: 360};
	const small: Box = {x: 260, y: 268, w: 1400, h: 96};
	const b = {
		x: interpolate(dock, [0, 1], [big.x, small.x]),
		y: interpolate(dock, [0, 1], [big.y, small.y]),
		w: interpolate(dock, [0, 1], [big.w, small.w]),
		h: interpolate(dock, [0, 1], [big.h, small.h]),
	};
	return (
		<div
			style={{
				position: 'absolute',
				left: b.x,
				top: b.y,
				width: b.w,
				height: b.h,
				borderRadius: interpolate(dock, [0, 1], [36, 48]),
				background: `${color}22`,
				border: `3px solid ${color}`,
				opacity: appear,
				transform: `scale(${interpolate(appear, [0, 1], [0.6, 1])})`,
				display: 'flex',
				flexDirection: dock > 0.5 ? 'row' : 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: interpolate(dock, [0, 1], [20, 24]),
				textAlign: 'center',
				padding: '0 30px',
				boxSizing: 'border-box',
			}}
		>
			<div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: interpolate(dock, [0, 1], [64, 30]), color: C.text, whiteSpace: 'nowrap'}}>{hero.title}</div>
			<div style={{fontFamily: FONT_BODY, fontWeight: 500, fontSize: interpolate(dock, [0, 1], [38, 24]), color: C.dim}}>{dock > 0.5 ? '· ' : ''}{hero.body}</div>
		</div>
	);
};

export const Flow: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color, scene} = useScene();
	const nodes = v.nodes as Node[];
	const layout: string = v.layout;
	const boxes: Box[] = [];
	const arrows: {d: string; to: string; from?: string}[] = [];

	if (layout === 'row') {
		const n = nodes.length;
		const gap = 76;
		const w = Math.min(320, (STAGE_W - gap * (n - 1)) / n);
		const total = n * w + (n - 1) * gap;
		const x0 = STAGE.left + (STAGE_W - total) / 2;
		const h = 290;
		const y = v.hero ? 450 : 400;
		nodes.forEach((_, i) => boxes.push({x: x0 + i * (w + gap), y, w, h}));
		for (let i = 1; i < n; i++) {
			const a = boxes[i - 1];
			const b = boxes[i];
			const my = a.y + a.h / 2;
			arrows.push({d: `M ${a.x + a.w + 6} ${my} C ${a.x + a.w + gap / 2} ${my - 14} ${b.x - gap / 2} ${my - 14} ${b.x - 12} ${my}`, to: nodes[i].id});
		}
	} else if (layout === 'cycle') {
		const n = nodes.length;
		const cx = 960;
		const cy = 585;
		const rx = 470;
		const ry = 225;
		const w = 380;
		const h = 160;
		const ang = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
		nodes.forEach((_, i) => boxes.push({x: cx + Math.cos(ang(i)) * rx - w / 2, y: cy + Math.sin(ang(i)) * ry - h / 2, w, h}));
		const arcPath = (a0: number, a1: number) => {
			const steps = 24;
			let d = '';
			for (let s = 0; s <= steps; s++) {
				const a = a0 + ((a1 - a0) * s) / steps;
				d += `${s === 0 ? 'M' : 'L'} ${cx + Math.cos(a) * (rx + 40)} ${cy + Math.sin(a) * (ry + 70)} `;
			}
			return d;
		};
		for (let i = 0; i < n; i++) {
			const a0 = ang(i) + 0.42;
			const a1 = ang(i + 1) - 0.42;
			arrows.push({d: arcPath(a0, a1), to: nodes[(i + 1) % n].id, from: i === n - 1 ? 'loop' : undefined});
		}
	} else if (layout === 'hub') {
		const [center, ...sats] = nodes;
		const cx = 960;
		const cy = 590;
		const cw = 400;
		const ch = 190;
		boxes.push({x: cx - cw / 2, y: cy - ch / 2, w: cw, h: ch});
		const rx = 650;
		const ry = 255;
		const w = 380;
		const h = 160;
		sats.forEach((_, i) => {
			const a = -Math.PI / 2 + (i / sats.length) * Math.PI * 2;
			boxes.push({x: cx + Math.cos(a) * rx - w / 2, y: cy + Math.sin(a) * ry - h / 2, w, h});
		});
		sats.forEach((s, i) => {
			const b = boxes[i + 1];
			const sx = b.x + b.w / 2;
			const sy = b.y + b.h / 2;
			// do centro para fora (ou de fora para o centro) até a borda das caixas
			const dx = sx - cx;
			const dy = sy - cy;
			const len = Math.hypot(dx, dy);
			const ux = dx / len;
			const uy = dy / len;
			const tEdge = (bw: number, bh: number) => Math.min(Math.abs(bw / 2 / (ux || 1e-6)), Math.abs(bh / 2 / (uy || 1e-6)));
			const p0 = [cx + ux * (tEdge(cw, ch) + 12), cy + uy * (tEdge(cw, ch) + 12)];
			const p1 = [sx - ux * (tEdge(w, h) + 14), sy - uy * (tEdge(w, h) + 14)];
			const d = v.inward ? `M ${p1[0]} ${p1[1]} L ${p0[0]} ${p0[1]}` : `M ${p0[0]} ${p0[1]} L ${p1[0]} ${p1[1]}`;
			arrows.push({d, to: s.id});
			void center;
		});
	}

	if (layout === 'stairs') {
		return <Stairs v={v} />;
	}

	return (
		<>
			<SceneHeading text={v.heading} />
			{v.chips ? (
				<div style={{position: 'absolute', left: STAGE.left, top: layout === 'cycle' ? 300 : 262, width: STAGE_W, display: 'flex', justifyContent: layout === 'cycle' ? 'space-between' : 'center', gap: 24}}>
					{(v.chips as {id: string; text: string}[]).map((c) => (
						<CueChip key={c.id} id={c.id} text={c.text} />
					))}
				</div>
			) : null}
			{v.hero ? <Hero hero={v.hero} firstNode={nodes[0].id} /> : null}
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				{arrows.map((a, i) => {
					const target = a.from === 'loop' ? (scene.cues[a.to]?.highlight ?? null) : (useCueFrameArrow(a.to) ?? null);
					const fromFrame = a.from === 'loop' && target === null ? null : target;
					const p = springAt({frame, fps, from: fromFrame === null ? null : fromFrame - 10, preset: 'suave', durationInFrames: 26});
					return <Arrow key={i} d={a.d} progress={p} color={color} dashed={a.from === 'loop'} />;
				})}
			</svg>
			{layout === 'cycle' ? <CycleCenter nodes={nodes} /> : null}
			{nodes.map((n, i) => (
				<NodeCard key={n.id} node={n} box={boxes[i]} index={i} big={layout === 'hub' && i === 0} />
			))}
		</>
	);
};

const useCueFrameArrow = (id: string) => useCueFrame(id, 'show', 18);

const CycleCenter: React.FC<{nodes: Node[]}> = ({nodes}) => {
	const frame = useCurrentFrame();
	const {color} = useScene();
	const last = useCueSpring(nodes[nodes.length - 1].id, 'suave', {delay: 10});
	return (
		<div style={{position: 'absolute', left: 960 - 170, top: 585 - 70, width: 340, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: last}}>
			<svg width={160} height={160} style={{position: 'absolute', left: 90, top: -10}}>
				<circle cx={80} cy={80} r={70} fill="none" stroke={color} strokeWidth={3} strokeDasharray="14 12" transform={`rotate(${frame * 2} 80 80)`} />
			</svg>
			<div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 30, color, textAlign: 'center', lineHeight: 1.1}}>
				círculo
				<br />
				vicioso
			</div>
		</div>
	);
};

const Stairs: React.FC<{v: Visual}> = ({v}) => {
	const {color} = useScene();
	const nodes = v.nodes as Node[];
	const top = 262;
	const bottom = v.chips ? 790 : 860;
	const n = nodes.length;
	const h = (bottom - top) / n;
	return (
		<>
			<SceneHeading text={v.heading} />
			<div style={{position: 'absolute', left: 1490, top: 300, width: 300, fontFamily: FONT_BODY, color: C.dim, fontSize: 24, lineHeight: 1.4}}>
				<div style={{fontFamily: FONT_HEAD, color: C.text, fontWeight: 700, fontSize: 28}}>↓ prioridade</div>
				do mais desejável
				<br />
				ao último recurso
			</div>
			{nodes.map((node, i) => (
				<StairRow key={node.id} node={node} i={i} n={n} y={top + i * h} h={h - 10} color={color} />
			))}
			{v.chips ? (
				<div style={{position: 'absolute', left: STAGE.left, top: 808, width: STAGE_W, display: 'flex', justifyContent: 'center'}}>
					{(v.chips as {id: string; text: string}[]).map((c) => (
						<CueChip key={c.id} id={c.id} text={c.text} />
					))}
				</div>
			) : null}
		</>
	);
};

const StairRow: React.FC<{node: Node; i: number; n: number; y: number; h: number; color: string}> = ({node, i, n, y, h, color}) => {
	const p = useCueSpring(node.id, 'firme', {fallbackDelay: 10 + i * 8});
	const pulse = usePulse(node.id);
	const hl = useCueSpring(node.id, 'elastico', {action: 'highlight'});
	const w0 = interpolate(i, [0, n], [1240, 520]);
	const w1 = interpolate(i + 1, [0, n], [1240, 520]);
	const cx = 820;
	const d = `M ${cx - w0 / 2} 0 L ${cx + w0 / 2} 0 L ${cx + w1 / 2} ${h} L ${cx - w1 / 2} ${h} Z`;
	const alpha = interpolate(i, [0, n - 1], [0.95, 0.35]);
	return (
		<div style={{position: 'absolute', left: 0, top: y, width: 1920, height: h, opacity: p, transform: `translateY(${(1 - p) * -30}px) scale(${1 + pulse * 0.03})`}}>
			<svg width={1920} height={h} style={{position: 'absolute'}}>
				<path d={d} fill={color} fillOpacity={alpha * 0.55} stroke={hl > 0 ? C.warn : color} strokeWidth={hl > 0 ? 5 : 2} />
			</svg>
			<div style={{position: 'absolute', left: cx - 300, width: 600, top: 0, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16}}>
				<div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 26, color: C.bg0, background: C.text, borderRadius: 999, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
				<div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: Math.min(38, h * 0.5), color: C.text}}>{node.label}</div>
				{node.sub ? <div style={{fontFamily: FONT_BODY, fontSize: 22, color: C.text, opacity: 0.8}}>({node.sub})</div> : null}
			</div>
		</div>
	);
};
