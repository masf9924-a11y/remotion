import {evolvePath} from '@remotion/paths';
import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Icon} from '../components/icons';
import {useCueFrame, useCueSpring, usePulse, useScene} from '../components/scene-context';
import {fitLine} from '../components/text-fit';
import {springAt} from '../springs';
import {C, FONT_BODY, FONT_HEAD, STAGE} from '../theme';
import type {Visual} from '../timeline';
import {CueChip, FitText, SceneHeading, STAGE_W} from './common';

type Item = {id: string; title: string; body: string; icon?: string; tag?: string; swatch?: string; answer?: string};

const Card: React.FC<{item: Item; x: number; y: number; w: number; h: number; index: number}> = ({item, x, y, w, h, index}) => {
	const {color} = useScene();
	const p = useCueSpring(item.id, 'firme', {fallbackDelay: 10 + index * 6});
	const draw = useCueSpring(item.id, 'suave', {delay: 4, fallbackDelay: 10 + index * 6});
	const pulse = usePulse(item.id);
	const solve = useCueSpring(item.id, 'elastico', {action: 'solve'});
	const accent = item.swatch ?? color;
	const pad = 26;
	const inner = w - pad * 2;
	const iconSize = Math.min(64, h * 0.2);
	const answerH = item.answer ? 92 : 0;
	const titleH = Math.min(96, h * 0.28);
	const bodyH = h - pad * 2 - iconSize - 18 - titleH - 10 - answerH;
	return (
		<>
			{/* "fantasma": a estrutura aparece antes, convidando a prever o conteúdo */}
			<div style={{position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 26, border: `2px dashed ${C.line}`, opacity: 1 - p}} />
			<div
				style={{
					position: 'absolute',
					left: x,
					top: y,
					width: w,
					height: h,
					borderRadius: 26,
					background: C.panel,
					border: `2px solid ${pulse > 0 || solve > 0 ? accent : `${accent}55`}`,
					boxShadow: `0 20px 50px rgba(0,0,0,0.35)${pulse > 0 ? `, 0 0 ${40 * pulse}px ${accent}` : ''}`,
					opacity: p,
					transform: `translateY(${(1 - p) * 50}px) scale(${interpolate(p, [0, 1], [0.86, 1]) + pulse * 0.03})`,
					overflow: 'hidden',
					padding: pad,
					boxSizing: 'border-box',
				}}
			>
				{item.swatch ? <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: 14, background: item.swatch}} /> : null}
				<div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: iconSize, marginTop: item.swatch ? 8 : 0}}>
					<div style={{width: iconSize, height: iconSize, borderRadius: iconSize / 3, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
						<Icon name={item.icon ?? 'target'} size={iconSize * 0.66} color={accent} draw={draw} />
					</div>
					{item.tag ? <div style={{fontFamily: FONT_BODY, fontWeight: 700, fontSize: 16, color: accent, border: `1.5px solid ${accent}`, borderRadius: 999, padding: '4px 12px', textTransform: 'uppercase', letterSpacing: 1}}>{item.tag}</div> : null}
				</div>
				<div style={{marginTop: 18, height: titleH, display: 'flex', alignItems: 'center'}}>
					<FitText text={item.title} width={inner} height={titleH} maxSize={40} minSize={20} weight={700} head lineHeight={1.12} />
				</div>
				<div style={{marginTop: 10, height: bodyH, overflow: 'hidden'}}>
					<FitText text={item.body} width={inner} height={bodyH} maxSize={32} minSize={15} color={C.dim} lineHeight={1.3} />
				</div>
				{item.answer ? (
					<div
						style={{
							position: 'absolute',
							left: 14,
							right: 14,
							bottom: 14,
							height: answerH - 14,
							borderRadius: 16,
							background: `${C.ok}26`,
							border: `2px solid ${C.ok}`,
							display: 'flex',
							alignItems: 'center',
							gap: 10,
							padding: '0 14px',
							boxSizing: 'border-box',
							opacity: solve,
							transform: `translateY(${(1 - solve) * 40}px)`,
						}}
					>
						<Icon name="check" size={30} color={C.ok} draw={solve} strokeWidth={3} />
						<FitText text={item.answer} width={inner - 60} height={answerH - 28} maxSize={21} minSize={13} weight={600} lineHeight={1.2} />
					</div>
				) : null}
			</div>
		</>
	);
};

export const Cards: React.FC<{v: Visual}> = ({v}) => {
	const items = v.items as Item[];
	const cols: number = v.columns ?? Math.min(items.length, 4);
	const rows = Math.ceil(items.length / cols);
	const gap = 28;
	const top = STAGE.top + (v.badge ? 150 : 100);
	const bottom = v.chips ? 790 : 870;
	const w = (STAGE_W - gap * (cols - 1)) / cols;
	const h = Math.min(cols >= 5 ? 360 : 460, (bottom - top - gap * (rows - 1)) / rows);
	const gridH = rows * h + (rows - 1) * gap;
	const y0 = top + (bottom - top - gridH) / 2;
	return (
		<>
			<SceneHeading text={v.heading} />
			{v.badge ? (
				<div style={{position: 'absolute', left: STAGE.left, top: STAGE.top + 80}}>
					<CueChip id="badge" text={v.badge} />
				</div>
			) : null}
			{items.map((it, i) => {
				const r = Math.floor(i / cols);
				const inRow = Math.min(cols, items.length - r * cols);
				const offset = ((cols - inRow) * (w + gap)) / 2;
				return <Card key={it.id} item={it} index={i} x={STAGE.left + offset + (i % cols) * (w + gap)} y={y0 + r * (h + gap)} w={w} h={h} />;
			})}
			{v.chips ? (
				<div style={{position: 'absolute', left: STAGE.left, top: 812, width: STAGE_W, display: 'flex', justifyContent: 'center', gap: 20}}>
					{(v.chips as {id: string; text: string}[]).map((c) => (
						<CueChip key={c.id} id={c.id} text={c.text} maxWidth={STAGE_W / v.chips.length} />
					))}
				</div>
			) : null}
		</>
	);
};

export const Stats: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color} = useScene();
	const items = v.items as {id: string; value: number; suffix: string; label: string; icon: string}[];
	return (
		<>
			<SceneHeading text={v.heading} />
			{items.map((it, i) => {
				const from = useCueFrameStable(it.id);
				const p = springAt({frame, fps, from, preset: 'suave', durationInFrames: 50});
				const pop = springAt({frame, fps, from, preset: 'elastico'});
				const cx = 960 + (i - (items.length - 1) / 2) * 640;
				const r = 165;
				const ring = `M ${cx} ${470 - r} a ${r} ${r} 0 1 1 -0.01 0`;
				return (
					<React.Fragment key={it.id}>
						<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
							<path d={ring} fill="none" stroke={C.line} strokeWidth={22} />
							<path d={ring} fill="none" stroke={color} strokeWidth={22} strokeLinecap="round" {...evolvePath((p * it.value) / 100, ring)} />
						</svg>
						<div style={{position: 'absolute', left: cx - 200, top: 380, width: 400, textAlign: 'center', fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 120, color: C.text, transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])})`, opacity: Math.min(1, pop * 2)}}>
							{Math.round(p * it.value)}
							<span style={{fontSize: 64, color}}>{it.suffix}</span>
						</div>
						<div style={{position: 'absolute', left: cx - 280, top: 665, width: 560, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, opacity: p}}>
							<Icon name={it.icon} size={40} color={color} draw={p} />
							<div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 30, color: C.dim}}>{it.label}</div>
						</div>
					</React.Fragment>
				);
			})}
			<div style={{position: 'absolute', left: STAGE.left, top: 760, width: STAGE_W, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
				{(v.chips as {id: string; text: string}[]).map((c) => (
					<CueChip key={c.id} id={c.id} text={c.text} />
				))}
			</div>
		</>
	);
};

const useCueFrameStable = (id: string) => useCueFrame(id, 'show', 20);

export const Profile: React.FC<{v: Visual}> = ({v}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {color} = useScene();
	const enter = springAt({frame, fps, from: 8, preset: 'suave'});
	const draw = springAt({frame, fps, from: 14, preset: 'suave', durationInFrames: 70});
	const rows = v.rows as {id: string; label: string; text: string}[];
	const top = 210;
	const rowGap = 18;
	const rowH = Math.min(140, (870 - top - rowGap * (rows.length - 1)) / rows.length);
	const nameSize = fitLine({text: v.animal, width: 460, maxSize: 72, minSize: 40, fontFamily: FONT_HEAD, fontWeight: 800});
	return (
		<>
			<div style={{position: 'absolute', left: 130, top: 250, width: 480, height: 480, opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])})`}}>
				<svg width={480} height={480} style={{position: 'absolute'}}>
					<circle cx={240} cy={240} r={220} fill={`${color}18`} stroke={color} strokeWidth={3} strokeDasharray="10 12" strokeDashoffset={-frame * 0.6} />
				</svg>
				<div style={{position: 'absolute', left: 90, top: 90}}>
					<Icon name={v.icon} size={300} color={color} draw={draw} strokeWidth={1.3} />
				</div>
			</div>
			<div style={{position: 'absolute', left: 130, top: 760, width: 480, textAlign: 'center', opacity: enter}}>
				<div style={{fontFamily: FONT_HEAD, fontWeight: 800, fontSize: nameSize, color: C.text}}>{v.animal}</div>
				<div style={{fontFamily: FONT_BODY, fontStyle: 'italic', fontSize: 32, color}}>{v.genus}</div>
			</div>
			{rows.map((r, i) => (
				<ProfileRow key={r.id} row={r} y={top + i * (rowH + rowGap)} h={rowH} index={i} />
			))}
		</>
	);
};

const ProfileRow: React.FC<{row: {id: string; label: string; text: string}; y: number; h: number; index: number}> = ({row, y, h, index}) => {
	const {color} = useScene();
	const p = useCueSpring(row.id, 'firme', {fallbackDelay: 12 + index * 8});
	const key = row.id === 'key';
	const accent = key ? C.warn : color;
	const textW = 1810 - 720 - 230;
	return (
		<>
			<div style={{position: 'absolute', left: 720, top: y, width: 1090, height: h, borderRadius: 22, border: `2px dashed ${C.line}`, opacity: 1 - p}} />
			<div
				style={{
					position: 'absolute',
					left: 720,
					top: y,
					width: 1090,
					height: h,
					borderRadius: 22,
					background: key ? `${C.warn}1c` : C.panel,
					border: `2px solid ${accent}66`,
					display: 'flex',
					alignItems: 'center',
					opacity: p,
					transform: `translateX(${(1 - p) * 80}px)`,
				}}
			>
				<div style={{width: 190, marginLeft: 22, padding: '10px 0', borderRadius: 14, background: accent, color: C.bg0, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 24, textAlign: 'center'}}>{row.label}</div>
				<div style={{marginLeft: 26}}>
					<FitText text={row.text} width={textW} height={h - 24} maxSize={32} minSize={17} lineHeight={1.25} />
				</div>
			</div>
		</>
	);
};
