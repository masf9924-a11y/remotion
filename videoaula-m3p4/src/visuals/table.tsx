import {interpolatePath} from '@remotion/paths';
import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Icon} from '../components/icons';
import {hasCue, useCueFrame, useCueSpring, usePulse, useScene} from '../components/scene-context';
import {fitLine, textWidth} from '../components/text-fit';
import {springAt} from '../springs';
import {C, FONT_BODY, FONT_HEAD, STAGE} from '../theme';
import type {Visual} from '../timeline';
import {CueChip, FitText, SceneHeading, STAGE_W} from './common';

type Row = {id: string; cells: string[]};

export const Table: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color, scene} = useScene();
	const columns = v.columns as string[];
	const rows = v.rows as Row[];
	const top = 268;
	const headH = 62;
	const bottom = v.chips ? 790 : 868;
	const gap = 10;
	const rowH = Math.min(132, (bottom - top - headH - gap * rows.length) / rows.length);
	// larguras proporcionais ao texto medido de cada coluna (layout-utils)
	const natural = columns.map((c, ci) => Math.max(textWidth(c, 26, FONT_HEAD, 700), ...rows.map((r) => textWidth(r.cells[ci], 24, FONT_BODY, 500))));
	const clamped = natural.map((n, ci) => Math.max(ci === 0 ? 110 : 260, Math.min(ci === 0 ? 420 : 1100, n)));
	const sum = clamped.reduce((a, b) => a + b, 0);
	const widths = clamped.map((c) => (c / sum) * STAGE_W);
	const xs = widths.map((_, i) => STAGE.left + widths.slice(0, i).reduce((a, b) => a + b, 0));
	const headP = springAt({frame, fps, from: scene.lead - 4, preset: 'suave'});
	return (
		<>
			<SceneHeading text={v.heading} />
			<div style={{position: 'absolute', left: STAGE.left, top, width: STAGE_W, height: headH, borderRadius: 16, background: `${color}30`, opacity: headP}} />
			{columns.map((c, ci) => (
				<div key={c} style={{position: 'absolute', left: xs[ci] + 22, top: top + 14, width: widths[ci] - 44, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: fitLine({text: c, width: widths[ci] - 44, maxSize: 28, minSize: 16, fontFamily: FONT_HEAD, fontWeight: 700}), color: C.text, opacity: headP, whiteSpace: 'nowrap'}}>
					{c}
				</div>
			))}
			{rows.map((r, ri) => {
				const y = top + headH + gap + ri * (rowH + gap);
				const rowHasCue = hasCue(scene, r.id);
				return (
					<TableRow key={r.id} row={r} y={y} h={rowH} xs={xs} widths={widths} cellTargets={r.cells.map((_, ci) => (rowHasCue || ci === 0 ? r.id : `${r.id}:${ci}`))} index={ri} />
				);
			})}
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

const TableRow: React.FC<{row: Row; y: number; h: number; xs: number[]; widths: number[]; cellTargets: string[]; index: number}> = ({row, y, h, xs, widths, cellTargets, index}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color, scene} = useScene();
	const pulse = usePulse(row.id);
	const hl = useCueSpring(row.id, 'suave', {action: 'highlight'});
	// rótulo da linha entra junto com a primeira célula que aparecer
	const cellFrames = cellTargets.map((t, ci) => (ci === 0 ? null : (scene.cues[t]?.show ?? null)));
	const known = cellFrames.filter((f): f is number => f !== null);
	const rowCue = useCueFrame(row.id, 'show', 12 + index * 10);
	const labelFrom = hasCue(scene, row.id) || known.length === 0 ? rowCue : Math.min(...known);
	const labelP = springAt({frame, fps, from: labelFrom, preset: 'firme'});
	return (
		<>
			<div style={{position: 'absolute', left: STAGE.left, top: y, width: STAGE_W, height: h, borderRadius: 16, border: `2px dashed ${C.line}`, opacity: 1 - labelP}} />
			<div
				style={{
					position: 'absolute',
					left: STAGE.left,
					top: y,
					width: STAGE_W,
					height: h,
					borderRadius: 16,
					background: hl > 0 ? `${color}33` : C.panel,
					border: `2px solid ${hl > 0 ? color : `${color}40`}`,
					boxShadow: pulse > 0 ? `0 0 ${40 * pulse}px ${color}` : 'none',
					opacity: labelP,
					transform: `scaleX(${interpolate(labelP, [0, 1], [0.96, 1])})`,
				}}
			/>
			{row.cells.map((cell, ci) => {
				const from = ci === 0 ? labelFrom : hasCue(scene, cellTargets[ci]) ? (scene.cues[cellTargets[ci]].show as number) : labelFrom === null ? null : labelFrom + ci * 5;
				const p = springAt({frame, fps, from, preset: 'firme'});
				return (
					<div key={ci} style={{position: 'absolute', left: xs[ci] + 22, top: y, height: h, display: 'flex', alignItems: 'center', opacity: p, transform: `translateX(${(1 - p) * -36}px)`}}>
						<FitText text={cell} width={widths[ci] - 44} height={h - 16} maxSize={ci === 0 ? 30 : 27} minSize={14} weight={ci === 0 ? 700 : 500} head={ci === 0} color={ci === 0 ? color : C.text} lineHeight={1.22} />
					</div>
				);
			})}
		</>
	);
};

type Side = {id: string; title: string; sub: string; color: string; items: {id: string; text: string; bad?: boolean}[]};

// "VS" que se transforma (interpolatePath) de círculo em losango quando o 2º painel entra
const circleD = 'M 0 -46 C 25 -46 46 -25 46 0 C 46 25 25 46 0 46 C -25 46 -46 25 -46 0 C -46 -25 -25 -46 0 -46 Z';
const diamondD = 'M 0 -58 C 20 -38 38 -20 58 0 C 38 20 20 38 0 58 C -20 38 -38 20 -58 0 C -38 -20 -20 -38 0 -58 Z';

export const Compare: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const left = v.left as Side;
	const right = v.right as Side;
	const bottomBand = v.center || v.footer;
	const top = 262;
	const bottom = bottomBand ? 768 : 868;
	const rightFrom = useCueFrame(right.id, 'show', 14);
	const morph = springAt({frame, fps, from: rightFrom, preset: 'elastico'});
	const vsIn = useCueSpring(left.id, 'elastico', {delay: 6});
	const band = (v.center ?? v.footer) as {id: string; text: string} | undefined;
	return (
		<>
			<SceneHeading text={v.heading} />
			<Panel side={left} x={STAGE.left} y={top} w={790} h={bottom - top} dir={-1} />
			<Panel side={right} x={STAGE.right - 790} y={top} w={790} h={bottom - top} dir={1} />
			<svg width={160} height={160} style={{position: 'absolute', left: 960 - 80, top: (top + bottom) / 2 - 80, opacity: vsIn}}>
				<g transform={`translate(80 80) rotate(${morph * 45 + frame / 6})`}>
					<path d={interpolatePath(morph, circleD, diamondD)} fill={C.panelSolid} stroke={C.text} strokeWidth={3} />
				</g>
				<text x={80} y={92} textAnchor="middle" fontFamily={FONT_HEAD} fontWeight={800} fontSize={32} fill={C.text}>
					×
				</text>
			</svg>
			{band ? <Band band={band} /> : null}
		</>
	);
};

const Band: React.FC<{band: {id: string; text: string}}> = ({band}) => {
	const {color} = useScene();
	const p = useCueSpring(band.id, 'firme', {fallbackDelay: 40});
	const pulse = usePulse(band.id);
	return (
		<div
			style={{
				position: 'absolute',
				left: STAGE.left,
				top: 790,
				width: STAGE_W,
				height: 84,
				borderRadius: 22,
				background: `${color}24`,
				border: `2.5px solid ${color}`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 16,
				opacity: p,
				transform: `translateY(${(1 - p) * 40}px) scale(${1 + pulse * 0.03})`,
				boxShadow: pulse > 0 ? `0 0 ${50 * pulse}px ${color}` : 'none',
			}}
		>
			<Icon name="alert" size={40} color={color} draw={p} />
			<div style={{fontFamily: FONT_HEAD, fontWeight: 700, fontSize: fitLine({text: band.text, width: STAGE_W - 160, maxSize: 34, minSize: 18, fontFamily: FONT_HEAD, fontWeight: 700}), color: C.text, whiteSpace: 'nowrap'}}>{band.text}</div>
		</div>
	);
};

const Panel: React.FC<{side: Side; x: number; y: number; w: number; h: number; dir: number}> = ({side, x, y, w, h, dir}) => {
	const {scene} = useScene();
	const firstItem = side.items.map((i) => scene.cues[i.id]?.show).find((f) => f !== undefined);
	const panelFrom = useCueFrame(side.id, 'show', 10 + (dir > 0 ? 12 : 0));
	const from = hasCue(scene, side.id) ? panelFrom : (firstItem ?? panelFrom);
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = springAt({frame, fps, from: from === null ? null : from - 4, preset: 'firme'});
	const headH = 120;
	const itemGap = 14;
	const itemH = Math.min(124, (h - headH - 20 - itemGap * (side.items.length - 1)) / side.items.length);
	const blockH = side.items.length * itemH + (side.items.length - 1) * itemGap;
	const offsetY = Math.max(6, (h - headH - 14 - blockH) / 2);
	return (
		<>
			<div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 28, border: `2px dashed ${C.line}`, opacity: 1 - p}} />
			<div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 28, background: C.panel, border: `2px solid ${side.color}66`, opacity: p, transform: `translateX(${(1 - p) * 70 * dir}px)`, overflow: 'hidden'}}>
				<div style={{height: 8, background: side.color}} />
				<div style={{padding: '18px 30px 0'}}>
					<div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: fitLine({text: side.title, width: w - 60, maxSize: 44, minSize: 24, fontFamily: FONT_HEAD, fontWeight: 800}), color: side.color, whiteSpace: 'nowrap'}}>{side.title}</div>
					<div style={{fontFamily: FONT_BODY, fontSize: 22, color: C.dim, marginTop: 2}}>{side.sub}</div>
				</div>
				{side.items.map((it, i) => (
					<CompareItem key={it.id} item={it} x={24} y={headH + offsetY + i * (itemH + itemGap)} w={w - 48} h={itemH} color={side.color} index={i} panelFrom={from} />
				))}
			</div>
		</>
	);
};

const CompareItem: React.FC<{item: {id: string; text: string; bad?: boolean}; x: number; y: number; w: number; h: number; color: string; index: number; panelFrom: number | null}> = ({item, x, y, w, h, color, index, panelFrom}) => {
	const {scene} = useScene();
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const own = scene.cues[item.id]?.show;
	const from = own ?? (panelFrom === null ? null : panelFrom + 14 + index * 8);
	const p = springAt({frame, fps, from, preset: 'firme'});
	const mark = springAt({frame, fps, from: from === null ? null : from + 4, preset: 'elastico'});
	const accent = item.bad ? C.bad : color;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 18, background: item.bad ? `${C.bad}1e` : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px', boxSizing: 'border-box', opacity: p, transform: `translateY(${(1 - p) * 26}px)`}}>
			<div style={{width: 44, height: 44, flexShrink: 0, borderRadius: 14, background: `${accent}2a`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${mark})`}}>
				<Icon name={item.bad ? 'cross' : 'check'} size={28} color={accent} strokeWidth={3} draw={mark} />
			</div>
			<FitText text={item.text} width={w - 100} height={h - 16} maxSize={29} minSize={15} weight={500} lineHeight={1.25} />
		</div>
	);
};
