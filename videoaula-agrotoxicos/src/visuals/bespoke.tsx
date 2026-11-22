import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import React from 'react';
import {interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {Icon} from '../components/icons';
import {useCueFrame, useCueSpring, useScene} from '../components/scene-context';
import {springAt} from '../springs';
import {C, FONT_BODY, FONT_HEAD} from '../theme';
import type {Visual} from '../timeline';
import {SceneHeading} from './common';

const Tag: React.FC<{x: number; y: number; text: string; p: number; color: string; small?: boolean}> = ({x, y, text, p, color, small}) => (
	<div style={{position: 'absolute', left: x, top: y, padding: small ? '6px 12px' : '8px 16px', borderRadius: 12, background: `${C.bg0}e6`, border: `2px solid ${color}`, fontFamily: FONT_BODY, fontWeight: 600, fontSize: small ? 18 : 22, color: C.text, opacity: p, transform: `translateY(${(1 - p) * 14}px)`, whiteSpace: 'nowrap'}}>
		{text}
	</div>
);

// ===========================================================================
// 1) ADIPOSE — por que o clorado acumula na gordura (curva de concentração)
export const Adipose: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color} = useScene();
	const fat = useCueSpring('fat', 'firme');
	const liver = useCueSpring('liver', 'firme');
	const curveF = useCueFrame('curve', 'show');
	const curve = springAt({frame, fps, from: curveF, preset: 'suave', durationInFrames: 70});
	const releaseF = useCueFrame('release', 'show');
	const release = springAt({frame, fps, from: releaseF, preset: 'firme'});
	const milk = useCueSpring('milk', 'elastico');
	const placenta = useCueSpring('placenta', 'elastico');

	// corpo à esquerda
	const bx = 320;
	const by = 560;
	// gráfico à direita
	const gx = 700;
	const gy0 = 300; // topo
	const gy1 = 760; // base (eixo x)
	const gw = 1010;
	const gh = gy1 - gy0;
	// curva de acúmulo: sobe devagar até platô (meia-vida longa)
	const plateau = 0.72;
	const pts: [number, number][] = [];
	for (let i = 0; i <= 40; i++) {
		const t = i / 40;
		const val = plateau * (1 - Math.exp(-3.1 * t));
		pts.push([gx + t * gw * 0.82, gy1 - val * gh]);
	}
	const curveD = `M ${pts[0][0]} ${pts[0][1]} ` + pts.slice(1).map((p) => `L ${p[0]} ${p[1]}`).join(' ');
	// pico de mobilização ao final (perda de peso)
	const spikeX = gx + gw * 0.82;
	const spikeTop = gy1 - 0.97 * gh;
	return (
		<>
			<SceneHeading text={v.heading} />
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				{/* silhueta do tronco */}
				<path d={`M ${bx - 70} ${by - 170} C ${bx - 70} ${by - 230} ${bx + 70} ${by - 230} ${bx + 70} ${by - 170} L ${bx + 95} ${by + 140} L ${bx - 95} ${by + 140} Z`} fill={C.panelSolid} stroke={C.line} strokeWidth={3} />
				{/* camada de gordura subcutânea destacada */}
				<path d={`M ${bx - 86} ${by - 150} L ${bx + 86} ${by - 150} L ${bx + 110} ${by + 150} L ${bx - 110} ${by + 150} Z`} fill="none" stroke={C.warn} strokeWidth={interpolate(fat, [0, 1], [0, 16])} strokeOpacity={0.55 * fat} strokeLinejoin="round" />
				{/* fígado */}
				<path d={`M ${bx - 60} ${by - 20} C ${bx - 10} ${by - 40} ${bx + 70} ${by - 30} ${bx + 70} ${by + 10} C ${bx + 70} ${by + 45} ${bx - 20} ${by + 45} ${bx - 60} ${by + 20} Z`} fill={`#B5651D${liver > 0 ? '' : '00'}`} fillOpacity={liver * 0.85} stroke="#B5651D" strokeWidth={2} strokeOpacity={liver} />
				{/* pontos de tóxico guardados na gordura */}
				{new Array(16).fill(0).map((_, i) => {
					const a = (i / 16) * Math.PI * 2;
					const rr = 92 + (i % 3) * 14;
					const x = bx + Math.cos(a) * rr * 0.9;
					const y = by - 10 + Math.sin(a) * rr;
					const gone = release > 0 ? 1 - Math.min(1, release * 1.4) : 1;
					return <circle key={i} cx={x} cy={y - release * 60} r={5} fill={C.bad} opacity={fat * (0.4 + 0.6 * Math.sin(frame / 20 + i)) * gone} />;
				})}
				{/* eixos */}
				<line x1={gx} y1={gy0} x2={gx} y2={gy1} stroke={C.line} strokeWidth={2} />
				<line x1={gx} y1={gy1} x2={gx + gw} y2={gy1} stroke={C.line} strokeWidth={2} />
				<text x={gx - 16} y={gy0 + 6} textAnchor="end" fontFamily={FONT_BODY} fontSize={20} fill={C.dim}>conc.</text>
				<text x={gx + gw} y={gy1 + 30} textAnchor="end" fontFamily={FONT_BODY} fontSize={20} fill={C.dim}>tempo (meses a anos)</text>
				{/* curva de acúmulo */}
				<path d={curveD} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" {...evolvePath(Math.min(1, curve), curveD)} />
				{/* platô tracejado */}
				<line x1={gx} y1={gy1 - plateau * gh} x2={spikeX} y2={gy1 - plateau * gh} stroke={color} strokeWidth={1.5} strokeDasharray="6 8" opacity={curve * 0.5} />
				<text x={gx + 12} y={gy1 - plateau * gh - 12} fontFamily={FONT_BODY} fontSize={18} fill={color} opacity={curve}>platô: meia-vida longa</text>
				{/* pico de mobilização */}
				{release > 0.02 ? (
					<>
						<path d={`M ${spikeX} ${gy1 - plateau * gh} L ${spikeX + 70} ${interpolate(release, [0, 1], [gy1 - plateau * gh, spikeTop])}`} stroke={C.bad} strokeWidth={6} strokeLinecap="round" />
						<circle cx={spikeX + 70} cy={interpolate(release, [0, 1], [gy1 - plateau * gh, spikeTop])} r={9} fill={C.bad} />
					</>
				) : null}
			</svg>
			<Tag x={bx - 150} y={by + 160} text="tecido adiposo = depósito" p={fat} color={C.warn} />
			<Tag x={bx - 60} y={by - 250} text="fígado: biotransformação lenta" p={liver} color="#B5651D" small />
			<Tag x={spikeX - 150} y={spikeTop - 70} text="perda de peso → libera" p={release} color={C.bad} small />
			<Tag x={gx + 40} y={gy1 + 56} text="saída pelo leite" p={milk} color="#7FB3FF" small />
			<Tag x={gx + 360} y={gy1 + 56} text="e pela placenta" p={placenta} color="#7FB3FF" small />
		</>
	);
};

// ===========================================================================
// 2) BIOMAG — bioacumulação e biomagnificação na cadeia alimentar
export const Biomag: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {color} = useScene();
	const chainF = useCueFrame('chain', 'show');
	const levels = [
		{id: 'level1', icon: 'bug', label: 'zooplâncton', dots: 2},
		{id: 'level2', icon: 'fish', label: 'peixe', dots: 9},
		{id: 'level3', icon: 'bird', label: 'ave', dots: 20},
		{id: 'level4', icon: 'worker', label: 'ser humano', dots: 44},
	];
	const baseY = 820;
	const x0 = 220;
	const stepX = 400;
	const stepUp = 118;
	const warn = useCueSpring('warn', 'firme');
	const accum = useCueSpring('accum', 'firme');
	return (
		<>
			<SceneHeading text={v.heading} />
			{/* água de fundo */}
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				<rect x={110} y={baseY + 36} width={1700} height={30} fill="#2E86DE" opacity={0.25} rx={8} />
				{/* seta ascendente da biomagnificação */}
				{levels.slice(1).map((l, i) => {
					const from = useCueFrameNode(l.id);
					const p = springAt2(frame, from, 26);
					const ax = x0 + i * stepX + 150;
					const ay = baseY - i * stepUp - 60;
					const bx2 = x0 + (i + 1) * stepX - 10;
					const by2 = baseY - (i + 1) * stepUp - 60;
					const d = `M ${ax} ${ay} C ${ax + 120} ${ay - 20} ${bx2 - 120} ${by2 + 20} ${bx2} ${by2}`;
					if (p <= 0) return null;
					const len = getLength(d);
					const pt = getPointAtLength(d, len * p) ?? {x: ax, y: ay};
					return (
						<g key={l.id}>
							<path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" {...evolvePath(p, d)} />
							<path d="M -13 -8 L 3 0 L -13 8 Z" fill={color} transform={`translate(${pt.x} ${pt.y}) rotate(${(Math.atan2(by2 - ay, bx2 - ax) * 180) / Math.PI})`} />
						</g>
					);
				})}
			</svg>
			{levels.map((l, i) => (
				<Trophic key={l.id} l={l} x={x0 + i * stepX} y={baseY - i * stepUp} index={i} frame={frame} accum={i === 0 ? accum : 0} />
			))}
			{/* rótulo biomagnificação */}
			<div style={{position: 'absolute', left: 1040, top: 250, width: 320, opacity: springAt2(frame, chainF, 30)}}>
				<div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 30, color}}>↑ biomagnifica</div>
				<div style={{fontFamily: FONT_BODY, fontSize: 22, color: C.dim, marginTop: 6, lineHeight: 1.3}}>a cada degrau, mais concentrado</div>
			</div>
			<Tag x={200} y={250} text="bioacumulação: no mesmo corpo, com o tempo" p={accum} color={C.warn} small />
			<Tag x={1180} y={820} text="peixe e leite são sentinelas" p={warn} color={C.bad} />
		</>
	);
};

const Trophic: React.FC<{l: {id: string; icon: string; label: string; dots: number}; x: number; y: number; index: number; frame: number; accum: number}> = ({l, x, y, index, frame, accum}) => {
	const {color} = useScene();
	const p = useCueSpring(l.id, 'firme', {fallbackDelay: 10 + index * 10});
	const w = 240;
	const h = 150;
	const dots = Math.round(l.dots * Math.min(1, p + accum));
	return (
		<div style={{position: 'absolute', left: x, top: y - h, width: w, height: h + 90, opacity: p, transform: `translateY(${(1 - p) * 40}px)`}}>
			{/* reservatório de tóxico (nuvem de pontos) */}
			<svg width={w} height={h} style={{position: 'absolute', top: -10}}>
				<rect x={10} y={10} width={w - 20} height={h - 20} rx={18} fill={C.panel} stroke={`${color}66`} strokeWidth={2} />
				{new Array(dots).fill(0).map((_, i) => (
					<circle key={i} cx={28 + (i % 8) * 26} cy={34 + Math.floor(i / 8) * 26} r={6} fill={C.bad} opacity={0.5 + 0.5 * Math.sin(frame / 18 + i)} />
				))}
				<text x={w - 20} y={34} textAnchor="end" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill={C.bad}>×{l.dots}</text>
			</svg>
			<div style={{position: 'absolute', top: h, width: w, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4}}>
				<Icon name={l.icon} size={48} color={color} draw={p} />
				<div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 24, color: C.text}}>{l.label}</div>
			</div>
		</div>
	);
};

const useCueFrameNode = (id: string) => useCueFrame(id, 'show', 14);
const springAt2 = (frame: number, from: number | null, dur?: number) => {
	if (from === null) return 0;
	return springAt({frame, fps: 30, from: from - 8, preset: 'suave', durationInFrames: dur});
};

// ===========================================================================
// 3) NEURO — dois alvos no neurônio: canal de sódio e receptor GABA-A
export const Neuro: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const sodium = useCueSpring('sodium', 'firme');
	const fireF = useCueFrame('fire', 'show');
	const tremor = useCueSpring('tremor', 'elastico');
	const gaba = useCueSpring('gaba', 'firme');
	const chlorideF = useCueFrame('chloride', 'show');
	const chloride = springAt({frame, fps, from: chlorideF, preset: 'firme'});
	const seizure = useCueSpring('seizure', 'elastico');
	const memY = 560;
	const leftX = 540;
	const rightX = 1380;

	// íons Na+ entrando pelo canal aberto
	const naIons = sodium > 0 ? new Array(10).fill(0).map((_, i) => {
		const t = ((frame + i * 9) / 46) % 1;
		return {x: leftX + (random(`na${i}`) - 0.5) * 30, y: interpolate(t, [0, 1], [memY - 150, memY + 110]), o: Math.sin(t * Math.PI) * sodium};
	}) : [];
	// íons Cl- bloqueados (param acima da membrana quando chloride sobe)
	const clIons = gaba > 0 ? new Array(8).fill(0).map((_, i) => {
		const t = ((frame + i * 11) / 54) % 1;
		const blocked = chloride;
		const yEnter = interpolate(t, [0, 1], [memY - 150, memY + 110]);
		const yBlocked = Math.min(yEnter, memY - 40);
		return {x: rightX + (random(`cl${i}`) - 0.5) * 30, y: interpolate(blocked, [0, 1], [yEnter, yBlocked]), o: Math.sin(t * Math.PI) * gaba * (1 - blocked * 0.5)};
	}) : [];

	// forma de onda do potencial de ação (dispara repetido)
	const apActive = fireF !== null && frame >= fireF;
	const apPath = () => {
		let d = `M 220 ${memY - 230}`;
		for (let x = 220; x <= 860; x += 6) {
			const phase = (x / 60) - (apActive ? frame / 6 : 0);
			const spike = Math.max(0, Math.sin(phase)) ** 8;
			d += ` L ${x} ${memY - 230 - spike * 70}`;
		}
		return d;
	};
	return (
		<>
			<SceneHeading text={v.heading} />
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				{/* membrana (bicamada) */}
				<rect x={160} y={memY - 20} width={1600} height={40} rx={6} fill={C.panelSolid} stroke={C.line} strokeWidth={2} />
				<text x={180} y={memY - 40} fontFamily={FONT_BODY} fontWeight={700} fontSize={18} fill={C.dim} letterSpacing={3}>EXTRACELULAR</text>
				<text x={180} y={memY + 56} fontFamily={FONT_BODY} fontWeight={700} fontSize={18} fill={C.dim} letterSpacing={3}>INTRACELULAR (neurônio)</text>

				{/* ---- lado esquerdo: canal de sódio aberto (tipo DDT) ---- */}
				<g>
					<rect x={leftX - 38} y={memY - 26} width={30} height={52} rx={8} fill={`${C.bad}44`} stroke={C.bad} strokeWidth={2.5} transform={`translate(${-6 - sodium * 10} 0)`} />
					<rect x={leftX + 8} y={memY - 26} width={30} height={52} rx={8} fill={`${C.bad}44`} stroke={C.bad} strokeWidth={2.5} transform={`translate(${6 + sodium * 10} 0)`} />
					<text x={leftX} y={memY - 46} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={24} fill={C.bad} opacity={sodium}>Na⁺ aberto</text>
				</g>
				{naIons.map((p, i) => (
					<g key={i} opacity={p.o}>
						<circle cx={p.x} cy={p.y} r={13} fill="#FFD166" />
						<text x={p.x} y={p.y + 5} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={700} fontSize={13} fill={C.bg0}>Na⁺</text>
					</g>
				))}
				{/* onda de PA */}
				<path d={apPath()} fill="none" stroke={C.bad} strokeWidth={3} opacity={springAt({frame, fps, from: fireF, preset: 'suave'})} />
				<text x={220} y={memY - 250} fontFamily={FONT_BODY} fontSize={20} fill={C.bad} opacity={springAt({frame, fps, from: fireF, preset: 'suave'})}>disparos repetidos</text>

				{/* ---- lado direito: GABA-A bloqueado (tipo ciclodieno/HCH) ---- */}
				<g>
					<rect x={rightX - 34} y={memY - 26} width={68} height={52} rx={10} fill={`${color2(gaba)}`} stroke={C.warn} strokeWidth={2.5} />
					<text x={rightX} y={memY - 46} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={24} fill={C.warn} opacity={gaba}>GABA-A</text>
					{/* X de bloqueio */}
					{chloride > 0.05 ? (
						<g transform={`translate(${rightX} ${memY}) scale(${chloride})`} opacity={chloride}>
							<circle r={22} fill={C.bg0} stroke={C.bad} strokeWidth={3} />
							<path d="M -10 -10 L 10 10 M 10 -10 L -10 10" stroke={C.bad} strokeWidth={4} strokeLinecap="round" />
						</g>
					) : null}
				</g>
				{clIons.map((p, i) => (
					<g key={i} opacity={p.o}>
						<circle cx={p.x} cy={p.y} r={13} fill="#4CC9F0" />
						<text x={p.x} y={p.y + 5} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={700} fontSize={13} fill={C.bg0}>Cl⁻</text>
					</g>
				))}
			</svg>
			<Tag x={leftX - 150} y={memY + 150} text="DDT: retarda a repolarização" p={sodium} color={C.bad} />
			<div style={{position: 'absolute', left: leftX - 110, top: memY + 210, opacity: tremor, transform: `scale(${tremor})`}}>
				<div style={{padding: '10px 22px', borderRadius: 999, background: C.bad, color: C.bg0, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 28}}>→ TREMOR</div>
			</div>
			<Tag x={rightX - 160} y={memY + 150} text="bloqueia o GABA: menos inibição" p={chloride} color={C.warn} />
			<div style={{position: 'absolute', left: rightX - 130, top: memY + 210, opacity: seizure, transform: `scale(${seizure})`}}>
				<div style={{padding: '10px 22px', borderRadius: 999, background: C.warn, color: C.bg0, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 28}}>→ CONVULSÃO</div>
			</div>
		</>
	);
};

const color2 = (gaba: number) => (gaba > 0 ? `rgba(255,183,3,${0.26 * gaba})` : 'transparent');

// ===========================================================================
// 4) CONTAMCYCLE — ciclo do contaminante entre solo, água, planta, animal, humano
export const ContamCycle: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {color} = useScene();
	const cx = 820;
	const cy = 580;
	const rx = 520;
	const ry = 268;
	const nodes = [
		{id: 'soil', icon: 'landfill', label: 'Solo', sub: 'reservatório'},
		{id: 'water', icon: 'drop', label: 'Água', sub: 'lençol freático'},
		{id: 'plant', icon: 'plant', label: 'Planta', sub: 'absorve resíduo'},
		{id: 'animal', icon: 'fish', label: 'Animal', sub: 'acumula'},
		{id: 'human', icon: 'worker', label: 'Humano', sub: 'alimento e água'},
	];
	const n = nodes.length;
	const ang = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
	const pos = nodes.map((_, i) => ({x: cx + Math.cos(ang(i)) * rx, y: cy + Math.sin(ang(i)) * ry}));
	const warn = useCueSpring('warn', 'firme');
	return (
		<>
			<SceneHeading text={v.heading} />
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				{/* arcos entre nós */}
				{nodes.map((_, i) => {
					const a0 = ang(i) + 0.4;
					const a1 = ang((i + 1) % n) - 0.4 + (i === n - 1 ? Math.PI * 2 : 0);
					let d = '';
					const steps = 20;
					for (let s = 0; s <= steps; s++) {
						const a = a0 + ((a1 - a0) * s) / steps;
						d += `${s === 0 ? 'M' : 'L'} ${cx + Math.cos(a) * (rx + 40)} ${cy + Math.sin(a) * (ry + 54)} `;
					}
					const nextId = nodes[(i + 1) % n].id;
					const from = useCueFrameNode(nextId);
					const p = springAt2(frame, from, 26);
					if (p <= 0) return null;
					const len = getLength(d);
					const pt = getPointAtLength(d, Math.max(1, len * p)) ?? {x: cx, y: cy};
					const tanPt = getPointAtLength(d, Math.max(2, len * p - 2)) ?? pt;
					const angle = (Math.atan2(pt.y - tanPt.y, pt.x - tanPt.x) * 180) / Math.PI;
					return (
						<g key={i}>
							<path d={d} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" {...evolvePath(p, d)} />
							<path d="M -13 -8 L 3 0 L -13 8 Z" fill={color} transform={`translate(${pt.x} ${pt.y}) rotate(${angle})`} />
						</g>
					);
				})}
				{/* centro: persistência */}
				<circle cx={cx} cy={cy} r={94} fill="none" stroke={color} strokeWidth={2} strokeDasharray="12 10" transform={`rotate(${frame} ${cx} ${cy})`} opacity={warn} />
				<text x={cx} y={cy - 6} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={30} fill={color} opacity={warn}>persiste</text>
				<text x={cx} y={cy + 26} textAnchor="middle" fontFamily={FONT_BODY} fontSize={20} fill={C.dim} opacity={warn}>por décadas</text>
			</svg>
			{nodes.map((node, i) => (
				<CycleNode key={node.id} node={node} x={pos[i].x} y={pos[i].y} index={i} />
			))}
		</>
	);
};

const CycleNode: React.FC<{node: {id: string; icon: string; label: string; sub: string}; x: number; y: number; index: number}> = ({node, x, y, index}) => {
	const {color} = useScene();
	const p = useCueSpring(node.id, 'firme', {fallbackDelay: 10 + index * 8});
	const w = 236;
	const h = 128;
	return (
		<div style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 22, background: C.panel, border: `2px solid ${color}77`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', boxSizing: 'border-box', opacity: p, transform: `scale(${interpolate(p, [0, 1], [0.7, 1])})`}}>
			<Icon name={node.icon} size={52} color={color} draw={p} />
			<div>
				<div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 28, color: C.text}}>{node.label}</div>
				<div style={{fontFamily: FONT_BODY, fontSize: 19, color: C.dim}}>{node.sub}</div>
			</div>
		</div>
	);
};

// ===========================================================================
// 5) LANDFILL (resíduos industriais) — célula impermeabilizada + incinerador
export const Landfill: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color} = useScene();
	const liner = useCueSpring('liner', 'firme');
	const leachateF = useCueFrame('leachate', 'show');
	const leachate = springAt({frame, fps, from: leachateF, preset: 'suave'});
	const incinerate = useCueSpring('incinerate', 'firme');
	const GROUND = 620;
	const cellX = 160;
	const cellW = 820;
	const linerBottom = GROUND + 150;
	// contorno da célula (bacia)
	const basinD = `M ${cellX} ${GROUND} L ${cellX + 40} ${linerBottom} L ${cellX + cellW - 40} ${linerBottom} L ${cellX + cellW} ${GROUND}`;
	const drainD = `M ${cellX + 90} ${linerBottom - 8} L ${cellX + cellW - 90} ${linerBottom - 8} L ${cellX + cellW - 60} ${linerBottom + 70} L ${cellX + cellW + 40} ${linerBottom + 70}`;
	return (
		<>
			<SceneHeading text={v.heading} />
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				{/* terreno */}
				<rect x={110} y={GROUND} width={1700} height={260} fill="#3B2F25" opacity={0.6} />
				<rect x={110} y={GROUND + 230} width={1700} height={40} fill="#2E86DE" opacity={0.3} />
				<text x={1180} y={GROUND + 258} fontFamily={FONT_BODY} fontWeight={600} fontSize={18} fill={C.text} opacity={0.8}>lençol freático protegido</text>

				{/* camadas de impermeabilização (argila + geomembrana PEAD) */}
				<path d={basinD} fill="none" stroke="#8a6a3a" strokeWidth={22} strokeLinejoin="round" {...evolvePath(liner, basinD)} opacity={0.9} />
				<path d={basinD} fill="none" stroke="#111" strokeWidth={10} strokeLinejoin="round" {...evolvePath(liner, basinD)} />
				<path d={basinD} fill="none" stroke={C.ok} strokeWidth={4} strokeLinejoin="round" {...evolvePath(liner, basinD)} />

				{/* resíduo dentro da célula */}
				<path d={`M ${cellX + 60} ${GROUND + 10} C ${cellX + 200} ${GROUND - 120} ${cellX + cellW - 200} ${GROUND - 120} ${cellX + cellW - 60} ${GROUND + 10} L ${cellX + cellW - 50} ${linerBottom - 14} L ${cellX + 50} ${linerBottom - 14} Z`} fill="#6B5B4B" stroke="#4A3A2A" strokeWidth={2} opacity={liner} />
				{new Array(10).fill(0).map((_, i) => (
					<rect key={i} x={cellX + 120 + (i % 5) * 110} y={GROUND - 70 + Math.floor(i / 5) * 60} width={30} height={30} rx={5} fill={i % 3 === 0 ? C.bad : '#9AA6C8'} opacity={liner * 0.8} transform={`rotate(${i * 12} ${cellX + 135 + (i % 5) * 110} ${GROUND - 55 + Math.floor(i / 5) * 60})`} />
				))}

				{/* dreno de chorume */}
				<path d={drainD} fill="none" stroke="#4CC9F0" strokeWidth={8} strokeLinecap="round" {...evolvePath(leachate, drainD)} />
				<rect x={cellX + cellW + 20} y={linerBottom + 50} width={90} height={70} rx={10} fill="none" stroke="#4CC9F0" strokeWidth={3} opacity={leachate} />
				<rect x={cellX + cellW + 24} y={linerBottom + 90 - 26 * leachate} width={82} height={26 * leachate} fill="#4CC9F0" opacity={0.7} />
				{leachateF !== null && frame > leachateF ? new Array(5).fill(0).map((_, i) => {
					const t = ((frame - leachateF) / 44 + i / 5) % 1;
					return <circle key={i} cx={interpolate(t, [0, 1], [cellX + 120, cellX + cellW - 70])} cy={linerBottom - 8} r={5} fill="#4A3A1A" />;
				}) : null}

				{/* poços de monitoramento */}
				{[130, cellX + cellW + 150].map((x, i) => (
					<g key={i} opacity={liner}>
						<rect x={x - 5} y={GROUND - 30} width={10} height={280} fill="#C9D3EE" />
						<rect x={x - 12} y={GROUND - 44} width={24} height={14} rx={3} fill={C.text} />
					</g>
				))}

				{/* incinerador à direita */}
				<g opacity={incinerate} transform={`translate(1180 0)`}>
					<rect x={320} y={GROUND - 170} width={240} height={180} rx={14} fill={C.panelSolid} stroke={`${color}aa`} strokeWidth={3} />
					<rect x={360} y={GROUND - 320} width={46} height={150} fill={C.panelSolid} stroke={`${color}aa`} strokeWidth={3} />
					{/* chama alta */}
					{new Array(6).fill(0).map((_, i) => {
						const fx = 360 + i * 32;
						const hh = 60 + Math.sin(frame / 4 + i) * 20;
						return <path key={i} d={`M ${fx} ${GROUND - 20} C ${fx - 10} ${GROUND - 20 - hh} ${fx + 10} ${GROUND - 20 - hh} ${fx} ${GROUND - 20 - hh * 1.4} C ${fx + 8} ${GROUND - 20 - hh} ${fx + 14} ${GROUND - 20} ${fx} ${GROUND - 20} Z`} fill={i % 2 ? '#FF9F1C' : '#FFD166'} opacity={0.85} />;
					})}
					{/* fumaça controlada */}
					{new Array(3).fill(0).map((_, i) => {
						const t = ((frame + i * 20) / 70) % 1;
						return <circle key={i} cx={383} cy={interpolate(t, [0, 1], [GROUND - 320, GROUND - 420])} r={10 + t * 10} fill="#B7E4C7" opacity={(1 - t) * 0.5 * incinerate} />;
					})}
					<text x={440} y={GROUND - 40} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill={C.text}>&gt; 1000 °C</text>
				</g>
			</svg>
			<Tag x={cellX + 40} y={linerBottom + 90} text="argila + geomembrana PEAD" p={liner} color={C.ok} small />
			<Tag x={cellX + cellW - 40} y={linerBottom + 130} text="chorume coletado e tratado" p={leachate} color="#4CC9F0" small />
			<Tag x={1500} y={GROUND - 360} text="incineração controlada" p={incinerate} color="#FF9F1C" small />
			<Tag x={120} y={GROUND - 70} text="poços de monitoramento" p={liner} color={C.dim} small />
		</>
	);
};
