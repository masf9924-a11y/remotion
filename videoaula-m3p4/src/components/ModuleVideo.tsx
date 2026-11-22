import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {springTiming, TransitionSeries, type TransitionPresentation, type TransitionPresentationComponentProps} from '@remotion/transitions';
import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, Sequence, staticFile} from 'remotion';
import {SPRINGS} from '../springs';
import {fontsReady} from '../theme';
import {buildModule, TRANSITION_FRAMES, type TimedModule, type TimedScene} from '../timeline';
import {Ascaris, Cholera, Landfill} from '../visuals/bespoke';
import {BloomPyramid, Opener, Quote} from '../visuals/basic';
import {Cards, Profile, Stats} from '../visuals/cards';
import {Flow} from '../visuals/flow';
import {Quiz} from '../visuals/quiz';
import {Compare, Table} from '../visuals/table';
import {Avatars, Background, Header} from './layers';
import {SceneProvider} from './scene-context';

// Apresentação própria: a cena que sai "avança" (escala + desfoque) e a nova sobe no lugar.
const LiftPresentation: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({children, presentationDirection, presentationProgress: p}) => {
	const style: React.CSSProperties =
		presentationDirection === 'entering'
			? {opacity: p, transform: `translateY(${(1 - p) * 60}px) scale(${0.94 + 0.06 * p})`}
			: {opacity: 1 - p, transform: `scale(${1 + 0.08 * p})`, filter: `blur(${p * 8}px)`};
	return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};
const lift = (): TransitionPresentation<Record<string, never>> => ({component: LiftPresentation, props: {}});

const presentationFor = (next: TimedScene, i: number): TransitionPresentation<Record<string, unknown>> => {
	if (next.visual.type === 'quiz' || next.visual.type === 'quote') {
		return lift() as unknown as TransitionPresentation<Record<string, unknown>>;
	}
	const cycle = [slide({direction: 'from-right'}), lift(), wipe({direction: 'from-left'}), fade()];
	return cycle[i % cycle.length] as unknown as TransitionPresentation<Record<string, unknown>>;
};

const SceneVisual: React.FC<{scene: TimedScene}> = ({scene}) => {
	const v = scene.visual;
	switch (v.type) {
		case 'opener':
			return <Opener v={v} />;
		case 'quote':
			return <Quote v={v} />;
		case 'bloom':
			return <BloomPyramid v={v} />;
		case 'cards':
			return <Cards v={v} />;
		case 'stats':
			return <Stats v={v} />;
		case 'profile':
			return <Profile v={v} />;
		case 'flow':
			return <Flow v={v} />;
		case 'table':
			return <Table v={v} />;
		case 'compare':
			return <Compare v={v} />;
		case 'quiz':
			return <Quiz v={v} />;
		case 'cholera':
			return <Cholera v={v} />;
		case 'ascaris':
			return <Ascaris v={v} />;
		case 'landfill':
			return <Landfill v={v} />;
		default:
			throw new Error(`Tipo visual desconhecido: ${v.type}`);
	}
};

const FontGate: React.FC<{children: React.ReactNode}> = ({children}) => {
	const [handle] = useState(() => delayRender('Carregando fontes'));
	const [ready, setReady] = useState(false);
	useEffect(() => {
		fontsReady().then(() => {
			setReady(true);
			continueRender(handle);
		});
	}, [handle]);
	return ready ? <>{children}</> : null;
};

export const ModuleVideo: React.FC<{moduleId: string}> = ({moduleId}) => {
	const mod: TimedModule = buildModule(moduleId);
	return (
		<AbsoluteFill>
			<FontGate>
				<Background mod={mod} />
				<TransitionSeries>
					{mod.scenes.flatMap((scene, i) => {
						const seq = (
							<TransitionSeries.Sequence key={scene.id} durationInFrames={scene.durationInFrames} name={scene.id}>
								<SceneProvider scene={scene} mod={mod}>
									<SceneVisual scene={scene} />
								</SceneProvider>
							</TransitionSeries.Sequence>
						);
						if (i === mod.scenes.length - 1) {
							return [seq];
						}
						return [
							seq,
							<TransitionSeries.Transition
								key={`${scene.id}-t`}
								presentation={presentationFor(mod.scenes[i + 1], i)}
								timing={springTiming({config: SPRINGS.suave, durationInFrames: TRANSITION_FRAMES})}
							/>,
						];
					})}
				</TransitionSeries>
				<Header mod={mod} />
				<Avatars mod={mod} />
			</FontGate>
			{/* Áudio de cada fala no frame exato vindo do manifest */}
			{mod.scenes.flatMap((scene) =>
				scene.lines
					.filter((l) => l.audio !== null)
					.map((l) => (
						<Sequence key={l.id} from={scene.start + l.from} durationInFrames={l.durationInFrames + 2} name={`fala ${l.id}`}>
							<Audio src={staticFile(l.audio as string)} />
						</Sequence>
					)),
			)}
			{/* Efeitos: tique a cada segundo da pausa de desafio e sino na revelação */}
			{mod.scenes.flatMap((scene) => [
				...scene.pauses.flatMap((p) =>
					new Array(Math.floor((p.to - p.from) / 30)).fill(0).map((_, k) => (
						<Sequence key={`${scene.id}-tick-${k}`} from={scene.start + p.from + k * 30} durationInFrames={6}>
							<Audio src={staticFile('sfx-tick.wav')} volume={0.35} />
						</Sequence>
					)),
				),
				...(scene.cues.answer?.show !== undefined
					? [
							<Sequence key={`${scene.id}-ding`} from={scene.start + scene.cues.answer.show} durationInFrames={24}>
								<Audio src={staticFile('sfx-ding.wav')} volume={0.3} />
							</Sequence>,
						]
					: []),
			])}
		</AbsoluteFill>
	);
};
