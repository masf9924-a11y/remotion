import {evolvePath, getLength, getPointAtLength, interpolatePath} from '@remotion/paths';
import React, {useMemo} from 'react';
import {interpolate, interpolateColors, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {useCueFrame, useCueSpring, useScene} from '../components/scene-context';
import {springAt} from '../springs';
import {C, FONT_BODY, FONT_HEAD} from '../theme';
import type {Visual} from '../timeline';
import {FitText, SceneHeading} from './common';

// ---------------------------------------------------------------------------
// Lista de passos lateral, comum às cenas de mecanismo
const Steps: React.FC<{steps: {id: string; text: string; warn?: boolean}[]; x: number; y: number; w: number; h: number}> = ({steps, x, y, w, h}) => {
	const gap = 10;
	const sh = (h - gap * (steps.length - 1)) / steps.length;
	return (
		<>
			{steps.map((s, i) => (
				<Step key={s.id + i} s={s} i={i} x={x} y={y + i * (sh + gap)} w={w} h={sh} />
			))}
		</>
	);
};

const Step: React.FC<{s: {id: string; text: string; warn?: boolean}; i: number; x: number; y: number; w: number; h: number}> = ({s, i, x, y, w, h}) => {
	const {color} = useScene();
	const p = useCueSpring(s.id, 'firme');
	const accent = s.warn ? C.warn : color;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 16, background: s.warn ? `${C.warn}1f` : C.panel, border: `2px solid ${accent}55`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px', boxSizing: 'border-box', opacity: p, transform: `translateX(${(1 - p) * 60}px)`}}>
			<div style={{width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: accent, color: C.bg0, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{i + 1}</div>
			<FitText text={s.text} width={w - 90} height={h - 12} maxSize={25} minSize={14} weight={500} lineHeight={1.2} />
		</div>
	);
};

// ---------------------------------------------------------------------------
// Cólera
const closedChannel = 'M -34 -40 L -8 -40 L -8 40 L -34 40 Z M 8 -40 L 34 -40 L 34 40 L 8 40 Z';
const openChannel = 'M -46 -40 L -22 -40 L -22 40 L -46 40 Z M 22 -40 L 46 -40 L 46 40 L 22 40 Z';

export const Cholera: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color} = useScene();
	const toxinIn = useCueSpring('toxin', 'suave');
	const dock = useCueSpring('gm1', 'firme');
	const aIn = useCueSpring('gs', 'suave');
	const acArrow = useCueSpring('gs', 'suave', {delay: 14});
	const camp = useCueSpring('camp', 'suave');
	const cftrF = useCueFrame('cftr', 'show');
	const cftr = springAt({frame, fps, from: cftrF, preset: 'elastico'});
	const waterF = useCueFrame('water', 'show');
	const secretory = useCueSpring('secretory', 'elastico');
	const sgltF = useCueFrame('sglt', 'show');
	const sglt = springAt({frame, fps, from: sgltF, preset: 'firme'});
	const memY = 450;
	const tx = interpolate(dock, [0, 1], [interpolate(toxinIn, [0, 1], [180, 430]), 430]);
	const ty = interpolate(dock, [0, 1], [interpolate(toxinIn, [0, 1], [250, 330]), memY - 44]);
	const ax = interpolate(aIn, [0, 1], [tx, 560]);
	const ay = interpolate(aIn, [0, 1], [ty - 30, 600]);
	const microvilli = useMemo(() => {
		let d = `M 200 ${memY}`;
		for (let x = 200; x < 1500; x += 40) {
			d += ` L ${x + 8} ${memY} L ${x + 8} ${memY - 26} Q ${x + 16} ${memY - 34} ${x + 24} ${memY - 26} L ${x + 24} ${memY} L ${x + 40} ${memY}`;
		}
		return d;
	}, []);
	const stream = (from: number | null, n: number, x0: number, spread: number, y0: number, y1: number, speed: number, seed: string) => {
		if (from === null || frame < from) {
			return [];
		}
		return new Array(n).fill(0).map((_, i) => {
			const t = ((frame - from) / speed + i / n) % 1;
			const born = frame - from > (i / n) * speed;
			return {x: x0 + (random(`${seed}${i}`) - 0.5) * spread + Math.sin(t * 6 + i) * 6, y: interpolate(t, [0, 1], [y0, y1]), o: born ? Math.sin(t * Math.PI) : 0};
		});
	};
	const cl = stream(cftrF === null ? null : cftrF + 8, 14, 1100, 30, 680, 270, 70, 'cl');
	const water = stream(waterF, 16, 1200, 90, 690, 280, 80, 'w');
	const naGlu = stream(sgltF === null ? null : sgltF + 6, 10, 1370, 24, 280, 700, 80, 'n');
	const campDots = new Array(Math.round(camp * 26)).fill(0).map((_, i) => ({x: 640 + random(`cx${i}`) * 360, y: 520 + random(`cy${i}`) * 250}));
	return (
		<>
			<SceneHeading text={v.heading} />
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				<text x={210} y={300} fontFamily={FONT_BODY} fontWeight={700} fontSize={20} fill={C.dim} letterSpacing={4}>
					LÚMEN INTESTINAL
				</text>
				<rect x={200} y={memY} width={1300} height={380} rx={30} fill={C.panelSolid} stroke={`${color}66`} strokeWidth={2} />
				<path d={microvilli} fill="none" stroke={`${color}aa`} strokeWidth={3} />
				<text x={220} y={860} fontFamily={FONT_BODY} fontWeight={700} fontSize={20} fill={C.dim} letterSpacing={4}>
					ENTERÓCITO
				</text>
				{/* receptor GM1 */}
				<g transform={`translate(430 ${memY})`}>
					<path d="M 0 0 L 0 -16 M 0 -16 L -10 -28 M 0 -16 L 10 -28" stroke={C.warn} strokeWidth={4} strokeLinecap="round" />
					<text x={0} y={34} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={24} fill={C.warn} opacity={dock}>
						GM1
					</text>
				</g>
				{/* toxina AB5 */}
				<g transform={`translate(${tx} ${ty}) scale(${toxinIn})`} opacity={toxinIn}>
					{new Array(5).fill(0).map((_, i) => {
						const a = (i / 5) * Math.PI * 2 + frame / 40;
						return <circle key={i} cx={Math.cos(a) * 24} cy={Math.sin(a) * 12} r={13} fill={C.bad} stroke={C.bg0} strokeWidth={2} />;
					})}
					<text x={0} y={-36} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={22} fill={C.text}>
						{dock > 0.5 ? 'B5' : 'Toxina AB5'}
					</text>
				</g>
				<g transform={`translate(${ax} ${ay})`} opacity={toxinIn}>
					<path d="M -14 -10 L 14 -10 L 0 16 Z" fill="#FF9F1C" stroke={C.bg0} strokeWidth={2} />
					<text x={22} y={6} fontFamily={FONT_HEAD} fontWeight={700} fontSize={22} fill="#FF9F1C">
						A
					</text>
				</g>
				{/* Gs → adenilato ciclase → AMPc */}
				<g opacity={aIn}>
					<rect x={500} y={630} width={120} height={60} rx={14} fill={`${color}33`} stroke={color} strokeWidth={2.5} />
					<text x={560} y={668} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={26} fill={C.text}>
						Gsα
					</text>
				</g>
				<path d="M 625 660 L 715 660" stroke={color} strokeWidth={4} {...evolvePath(acArrow, 'M 625 660 L 715 660')} />
				<g opacity={acArrow}>
					<rect x={720} y={625} width={190} height={70} rx={14} fill={`${color}33`} stroke={color} strokeWidth={2.5} />
					<text x={815} y={656} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={700} fontSize={20} fill={C.text}>
						adenilato
					</text>
					<text x={815} y={680} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={700} fontSize={20} fill={C.text}>
						ciclase ativa
					</text>
				</g>
				{campDots.map((d, i) => (
					<circle key={i} cx={d.x} cy={d.y} r={6} fill={C.warn} opacity={0.6} />
				))}
				<g opacity={camp}>
					<rect x={960} y={500} width={44} height={290} rx={12} fill="none" stroke={C.warn} strokeWidth={3} />
					<rect x={964} y={786 - 282 * camp * 0.95} width={36} height={282 * camp * 0.95} rx={9} fill={C.warn} />
					<text x={982} y={490} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={26} fill={C.warn}>
						AMPc ↑↑
					</text>
				</g>
				{/* CFTR: morph fechado → aberto */}
				<g transform={`translate(1100 ${memY + 8})`}>
					<path d={interpolatePath(Math.min(1, cftr), closedChannel, openChannel)} fill={`${C.ok}55`} stroke={C.ok} strokeWidth={2.5} />
					<text x={0} y={70} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={24} fill={C.ok}>
						CFTR
					</text>
				</g>
				{cl.map((p, i) => (
					<g key={i} opacity={p.o}>
						<circle cx={p.x} cy={p.y} r={12} fill="#4CC9F0" />
						<text x={p.x} y={p.y + 6} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={700} fontSize={13} fill={C.bg0}>
							Cl⁻
						</text>
					</g>
				))}
				{water.map((p, i) => (
					<path key={i} d={`M ${p.x} ${p.y - 12} C ${p.x + 9} ${p.y} ${p.x + 7} ${p.y + 9} ${p.x} ${p.y + 9} C ${p.x - 7} ${p.y + 9} ${p.x - 9} ${p.y} ${p.x} ${p.y - 12} Z`} fill="#3A86FF" opacity={p.o * 0.9} />
				))}
				{waterF !== null && frame >= waterF ? (
					<text x={1150} y={398} fontFamily={FONT_HEAD} fontWeight={700} fontSize={26} fill="#7FB3FF" opacity={springAt({frame, fps, from: waterF, preset: 'suave'})}>
						água segue o Cl⁻
					</text>
				) : null}
				{/* SGLT1 intacto */}
				<g transform={`translate(1370 ${memY + 8})`} opacity={interpolate(sglt, [0, 1], [0.35, 1])}>
					<rect x={-26} y={-40} width={52} height={80} rx={18} fill={`${C.ok}33`} stroke={C.ok} strokeWidth={2.5} />
					<text x={0} y={70} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={700} fontSize={22} fill={C.ok}>
						SGLT1
					</text>
				</g>
				{naGlu.map((p, i) => (
					<g key={i} opacity={p.o}>
						<circle cx={p.x} cy={p.y} r={10} fill={i % 2 ? '#FFD166' : '#06D6A0'} />
						<text x={p.x} y={p.y + 4} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={700} fontSize={10} fill={C.bg0}>
							{i % 2 ? 'Gli' : 'Na⁺'}
						</text>
					</g>
				))}
			</svg>
			<div style={{position: 'absolute', left: 540, top: 262, padding: '12px 22px', borderRadius: 18, background: `${C.bad}22`, border: `2px solid ${C.bad}`, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 26, color: C.text, opacity: secretory, transform: `scale(${secretory})`}}>
				Diarreia SECRETORA · sem inflamação · “água de arroz”
			</div>
			<div style={{position: 'absolute', left: 1180, top: 762, width: 290, padding: '10px 14px', borderRadius: 14, background: `${C.ok}22`, border: `2px solid ${C.ok}`, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 20, color: C.text, opacity: sglt, transform: `translateY(${(1 - sglt) * 20}px)`}}>
				Na⁺ + glicose ainda entram → base do soro oral
			</div>
			<Steps
				x={1530}
				y={262}
				w={280}
				h={606}
				steps={[
					{id: 'toxin', text: 'Toxina AB5 do Vibrio'},
					{id: 'gm1', text: 'B liga-se ao GM1'},
					{id: 'gs', text: 'A ativa a Gsα'},
					{id: 'camp', text: 'AMPc muito alto'},
					{id: 'cftr', text: 'CFTR aberto: sai Cl⁻'},
					{id: 'water', text: 'Água acompanha'},
					{id: 'sglt', text: 'SGLT1 intacto', warn: true},
				]}
			/>
		</>
	);
};

// ---------------------------------------------------------------------------
// Ascaris: ciclo de Loss sobre uma silhueta
const SEGMENTS: {to: string; d: string}[] = [
	{to: 'egg', d: 'M 700 330 L 712 470 L 740 600 L 765 655'},
	{to: 'intestine', d: 'M 765 655 C 790 700 720 720 700 770'},
	{to: 'liver', d: 'M 700 770 C 680 740 660 720 630 690'},
	{to: 'heart', d: 'M 630 690 C 650 640 700 610 735 580'},
	{to: 'lung', d: 'M 735 580 C 770 560 800 540 790 505'},
	{to: 'trachea', d: 'M 790 505 C 760 470 712 470 702 440 L 700 380'},
	{to: 'adult', d: 'M 700 380 C 708 420 714 460 716 500 L 740 600 L 765 660 C 800 720 760 790 720 805'},
];

export const Ascaris: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color, scene} = useScene();
	const full = SEGMENTS.map((s, i) => (i === 0 ? s.d : s.d.replace(/^M [\d.]+ [\d.]+/, ''))).join(' ');
	const lengths = SEGMENTS.map((s) => getLength(s.d));
	const total = lengths.reduce((a, b) => a + b, 0);
	let progress = 0;
	SEGMENTS.forEach((s, i) => {
		const f = scene.cues[s.to]?.show ?? null;
		progress += (lengths[i] / total) * springAt({frame, fps, from: f, preset: 'suave', durationInFrames: 40});
	});
	const pt = getPointAtLength(full, Math.max(0.01, progress * getLength(full))) ?? {x: 700, y: 330};
	const hatched = useCueSpring('intestine', 'elastico');
	const adult = useCueSpring('adult', 'elastico');
	const organ = (id: string) => useCueSpringOrgan(id);
	const lit = (id: string, base: string) => interpolateColors(organ(id), [0, 1], [`${base}22`, `${base}aa`]);
	const labels: {id: string; x: number; y: number; text: string; anchor?: 'end' | 'start'}[] = [
		{id: 'egg', x: 780, y: 330, text: 'boca'},
		{id: 'intestine', x: 830, y: 790, text: 'intestino delgado'},
		{id: 'liver', x: 520, y: 700, text: 'fígado', anchor: 'end'},
		{id: 'heart', x: 868, y: 640, text: 'coração D'},
		{id: 'lung', x: 900, y: 470, text: 'pulmões'},
		{id: 'trachea', x: 620, y: 410, text: 'traqueia', anchor: 'end'},
		{id: 'adult', x: 520, y: 830, text: 'jejuno: adulto', anchor: 'end'},
	];
	return (
		<>
			<SceneHeading text={v.heading} />
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				{/* silhueta */}
				<circle cx={700} cy={300} r={62} fill={C.panelSolid} stroke={C.line} strokeWidth={3} />
				<path d="M 660 360 L 740 360 L 750 400 C 860 410 900 440 910 520 L 900 860 L 500 860 L 490 520 C 500 440 540 410 650 400 Z" fill={C.panelSolid} stroke={C.line} strokeWidth={3} />
				<path d="M 700 380 L 700 470" stroke={lit('trachea', '#9AA6C8')} strokeWidth={14} strokeLinecap="round" />
				<ellipse cx={612} cy={530} rx={66} ry={92} fill={lit('lung', '#7C9CFF')} stroke="#7C9CFF" strokeWidth={2} />
				<ellipse cx={790} cy={530} rx={66} ry={92} fill={lit('lung', '#7C9CFF')} stroke="#7C9CFF" strokeWidth={2} />
				<path d="M 735 612 C 688 582 688 540 714 540 C 727 540 735 551 735 556 C 735 551 743 540 756 540 C 782 540 782 582 735 612 Z" fill={lit('heart', '#EF476F')} stroke="#EF476F" strokeWidth={2} />
				<path d="M 540 650 C 600 630 700 640 690 680 C 680 720 600 730 545 715 Z" fill={lit('liver', '#B5651D')} stroke="#B5651D" strokeWidth={2} />
				<path d="M 560 760 C 600 740 640 790 680 760 C 720 730 760 790 800 760 C 840 730 840 800 800 815 C 760 830 720 790 680 820 C 640 850 600 800 560 820 C 530 835 520 775 560 760 Z" fill={lit('intestine', '#FF9F1C')} stroke="#FF9F1C" strokeWidth={2} />
				{/* trajeto da larva, desenhado progressivamente */}
				<path d={full} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" {...evolvePath(progress, full)} />
				{labels.map((l) => (
					<text key={l.id} x={l.x} y={l.y} textAnchor={l.anchor ?? 'start'} fontFamily={FONT_HEAD} fontWeight={700} fontSize={26} fill={C.text} opacity={organ(l.id)}>
						{l.text}
					</text>
				))}
				{/* marcador: ovo → larva → verme adulto */}
				<g transform={`translate(${pt.x} ${pt.y})`} opacity={useCueSpring('egg', 'firme')}>
					<ellipse rx={14 * (1 - hatched)} ry={18 * (1 - hatched)} fill="#F4E3B2" stroke={C.bg0} strokeWidth={2} />
					<path d={`M -${10 + adult * 22} 0 Q -${5 + adult * 11} -${6 + adult * 6} 0 0 T ${10 + adult * 22} 0`} stroke="#F7C59F" strokeWidth={5 + adult * 5} fill="none" strokeLinecap="round" opacity={hatched} transform={`rotate(${Math.sin(frame / 5) * 18})`} />
				</g>
			</svg>
			<Steps
				x={1120}
				y={262}
				w={690}
				h={606}
				steps={[
					{id: 'egg', text: 'Ingestão do ovo embrionado (solo, mãos, alimentos)'},
					{id: 'intestine', text: 'Larva eclode e atravessa a parede intestinal'},
					{id: 'liver', text: 'Veia porta → fígado'},
					{id: 'heart', text: 'Coração direito'},
					{id: 'lung', text: 'Pulmões e alvéolos (síndrome de Löffler)'},
					{id: 'trachea', text: 'Sobe pela traqueia e é deglutida'},
					{id: 'adult', text: 'Verme adulto no jejuno'},
					{id: 'exam', text: 'Exame de fezes positivo só 2 a 3 meses depois', warn: true},
				]}
			/>
		</>
	);
};

const useCueSpringOrgan = (id: string) => useCueSpring(id, 'suave');

// ---------------------------------------------------------------------------
// Lixão × aterro controlado × aterro sanitário (corte transversal)
const PANEL_W = 550;
const GROUND = 640;
const WATER = 800;

const Mound: React.FC<{x0: number; fill: string}> = ({x0, fill}) => (
	<path d={`M ${x0 + 70} ${GROUND} C ${x0 + 120} ${GROUND - 170} ${x0 + 430} ${GROUND - 170} ${x0 + 480} ${GROUND} Z`} fill={fill} stroke="#6B5B4B" strokeWidth={2} />
);

const Stamp: React.FC<{x: number; text: string; color: string; p: number}> = ({x, text, color, p}) => (
	<div style={{position: 'absolute', left: x + PANEL_W - 262, top: 432, width: 240, textAlign: 'center', padding: '8px 0', borderRadius: 14, border: `4px solid ${color}`, color, fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 26, letterSpacing: 2, background: `${C.bg0}cc`, opacity: Math.min(1, p * 1.5), transform: `rotate(-8deg) scale(${interpolate(p, [0, 1], [1.8, 1])})`}}>
		{text}
	</div>
);

export const Landfill: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const xs = [110, 685, 1260];
	const head = [useCueSpring('lixao', 'firme'), useCueSpring('controlado', 'firme'), useCueSpring('sanitario', 'firme')];
	const chorume = useCueSpring('chorume', 'suave', {});
	const chorumeF = useCueFrame('chorume', 'show');
	const gasF = useCueFrame('gas', 'show');
	const vetor = useCueSpring('vetor', 'firme');
	const proib = useCueSpring('vetor', 'elastico', {delay: 25});
	const cover = useCueSpring('cover', 'firme');
	const leak2F = useCueFrame('leak2', 'show');
	const leak2 = springAt({frame, fps, from: leak2F, preset: 'suave'});
	const inad = useCueSpring('inad', 'elastico');
	const manta = useCueSpring('manta', 'suave');
	const dreno = useCueSpring('dreno', 'suave');
	const drenoF = useCueFrame('dreno', 'show');
	const capta = useCueSpring('capta', 'firme');
	const monitor = useCueSpring('monitor', 'firme');
	const ok = useCueSpring('ok', 'elastico');
	const titles = ['Lixão', 'Aterro controlado', 'Aterro sanitário'];
	const subs = ['céu aberto, sem controle', 'coberto com terra, sem projeto', 'obra de engenharia licenciada'];
	const drops = (x0: number, from: number | null, seed: string) => {
		if (from === null || frame < from) {
			return null;
		}
		return new Array(7).fill(0).map((_, i) => {
			const t = ((frame - from) / 50 + i / 7) % 1;
			const x = x0 + 120 + random(`${seed}${i}`) * 310;
			return <circle key={i} cx={x} cy={interpolate(t, [0, 1], [GROUND, WATER + 10])} r={6} fill="#4A3A1A" opacity={Math.sin(t * Math.PI)} />;
		});
	};
	const gas = (x0: number, from: number | null) => {
		if (from === null || frame < from) {
			return null;
		}
		return new Array(4).fill(0).map((_, i) => {
			const t = ((frame - from) / 60 + i / 4) % 1;
			const x = x0 + 170 + i * 70;
			const y = interpolate(t, [0, 1], [GROUND - 110, GROUND - 260]);
			return <path key={i} d={`M ${x} ${y} q 12 -16 0 -32 q -12 -16 0 -32`} stroke="#B7E4C7" strokeWidth={4} fill="none" strokeLinecap="round" opacity={Math.sin(t * Math.PI) * 0.8} />;
		});
	};
	const linerD = `M ${xs[2] + 50} ${GROUND - 4} C ${xs[2] + 60} ${GROUND + 26} ${xs[2] + 490} ${GROUND + 26} ${xs[2] + 500} ${GROUND - 4}`;
	const drainD = `M ${xs[2] + 110} ${GROUND + 12} L ${xs[2] + 470} ${GROUND + 12} L ${xs[2] + 470} ${GROUND + 60} L ${xs[2] + 505} ${GROUND + 60}`;
	return (
		<>
			<SceneHeading text={v.heading} />
			<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
				{xs.map((x0, i) => {
					const waterColor = i === 0 ? interpolateColors(chorume, [0, 1], ['#2E86DE', '#6B5B2E']) : i === 1 ? interpolateColors(leak2, [0, 1], ['#2E86DE', '#5E6A3A']) : '#2E86DE';
					return (
						<g key={i} opacity={Math.max(0.25, head[i])}>
							<rect x={x0} y={262} width={PANEL_W} height={606} rx={24} fill={C.panelSolid} stroke={C.line} strokeWidth={2} />
							<rect x={x0 + 2} y={GROUND} width={PANEL_W - 4} height={WATER - GROUND} fill="#3B2F25" />
							<rect x={x0 + 2} y={WATER} width={PANEL_W - 4} height={66} fill={waterColor} opacity={0.75} />
							<text x={x0 + 20} y={WATER + 42} fontFamily={FONT_BODY} fontWeight={600} fontSize={18} fill={C.text} opacity={0.85}>
								lençol freático
							</text>
							<Mound x0={x0} fill={i === 1 ? interpolateColors(cover, [0, 1], ['#7A6A55', '#8B6B3E']) : '#7A6A55'} />
						</g>
					);
				})}
				{/* lixão */}
				{drops(xs[0], chorumeF, 'a')}
				{gas(xs[0], gasF)}
				{new Array(9).fill(0).map((_, i) => (
					<circle key={i} cx={xs[0] + 275 + Math.cos(frame / 6 + i * 2.1) * (80 + i * 14)} cy={GROUND - 150 + Math.sin(frame / 4 + i) * 40} r={4} fill={C.text} opacity={vetor} />
				))}
				{[0, 1].map((i) => (
					<path key={i} d={`M ${xs[0] + 140 + i * 230 + Math.sin(frame / 20 + i) * 30} ${330 + i * 20} l 18 10 l 18 -10`} stroke={C.text} strokeWidth={3} fill="none" opacity={vetor} />
				))}
				{/* controlado: cobertura de terra, mas o chorume continua */}
				<path d={`M ${xs[1] + 70} ${GROUND} C ${xs[1] + 120} ${GROUND - 170} ${xs[1] + 430} ${GROUND - 170} ${xs[1] + 480} ${GROUND}`} stroke="#A0804A" strokeWidth={16} fill="none" {...evolvePath(cover, `M ${xs[1] + 70} ${GROUND} C ${xs[1] + 120} ${GROUND - 170} ${xs[1] + 430} ${GROUND - 170} ${xs[1] + 480} ${GROUND}`)} />
				{drops(xs[1], leak2F, 'b')}
				{gas(xs[1], leak2F)}
				{/* sanitário */}
				<path d={linerD} stroke="#111" strokeWidth={10} fill="none" {...evolvePath(manta, linerD)} />
				<path d={linerD} stroke={C.ok} strokeWidth={4} fill="none" {...evolvePath(manta, linerD)} />
				<path d={drainD} stroke="#4CC9F0" strokeWidth={8} fill="none" strokeLinecap="round" {...evolvePath(dreno, drainD)} />
				<rect x={xs[2] + 470} y={GROUND + 64} width={70} height={60} rx={8} fill="#4CC9F0" opacity={dreno * 0.8} />
				{drenoF !== null && frame > drenoF
					? new Array(5).fill(0).map((_, i) => {
							const t = ((frame - drenoF) / 40 + i / 5) % 1;
							return <circle key={i} cx={interpolate(t, [0, 1], [xs[2] + 130, xs[2] + 470])} cy={GROUND + 12} r={5} fill="#4A3A1A" />;
						})
					: null}
				<g opacity={capta}>
					<rect x={xs[2] + 268} y={GROUND - 240} width={14} height={130} fill="#9AA6C8" />
					<path d={`M ${xs[2] + 275} ${GROUND - 250} c 14 -12 6 -30 0 -42 c -6 12 -14 30 0 42 Z`} fill={C.warn} transform={`scale(1 ${1 + Math.sin(frame / 3) * 0.12})`} style={{transformOrigin: `${xs[2] + 275}px ${GROUND - 250}px`}} />
				</g>
				{[xs[2] + 30, xs[2] + 520].map((x, i) => (
					<g key={i} opacity={monitor}>
						<rect x={x - 5} y={GROUND - 40} width={10} height={WATER - GROUND + 80} fill="#C9D3EE" />
						<rect x={x - 12} y={GROUND - 52} width={24} height={14} rx={3} fill={C.text} />
					</g>
				))}
				{xs.map((x0, i) => (
					<g key={`t${i}`} opacity={head[i]}>
						<text x={x0 + 24} y={306} fontFamily={FONT_HEAD} fontWeight={800} fontSize={34} fill={C.text}>
							{titles[i]}
						</text>
						<text x={x0 + 24} y={338} fontFamily={FONT_BODY} fontSize={20} fill={C.dim}>
							{subs[i]}
						</text>
					</g>
				))}
			</svg>
			<Label x={xs[0] + 300} y={700} text="chorume infiltra" p={chorume} />
			<Label x={xs[0] + 24} y={400} text="metano escapa" p={useCueSpring('gas', 'firme')} />
			<Label x={xs[1] + 300} y={700} text="continua infiltrando" p={leak2} />
			<Label x={xs[2] + 20} y={GROUND + 30} text="argila + manta PEAD" p={manta} small />
			<Label x={xs[2] + 330} y={GROUND + 130} text="chorume tratado" p={dreno} small />
			<Label x={xs[2] + 24} y={400} text="metano captado" p={capta} small />
			<Label x={xs[2] + 60} y={WATER - 80} text="poços de monitoramento" p={monitor} small />
			<Stamp x={xs[0]} text="PROIBIDO" color={C.bad} p={proib} />
			<Stamp x={xs[1]} text="INADEQUADO" color={C.warn} p={inad} />
			<Stamp x={xs[2]} text="ADEQUADO" color={C.ok} p={ok} />
					</>
	);
};

const Label: React.FC<{x: number; y: number; text: string; p: number; small?: boolean}> = ({x, y, text, p, small}) => (
	<div style={{position: 'absolute', left: x, top: y, padding: '6px 12px', borderRadius: 10, background: `${C.bg0}dd`, border: `1.5px solid ${C.line}`, fontFamily: FONT_BODY, fontWeight: 600, fontSize: small ? 18 : 21, color: C.text, opacity: p, transform: `translateY(${(1 - p) * 14}px)`, whiteSpace: 'nowrap'}}>
		{text}
	</div>
);
