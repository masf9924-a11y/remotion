import React from 'react';
import {Composition} from 'remotion';
import {ModuleVideo} from './components/ModuleVideo';
import {FPS, H, W} from './theme';
import {buildModule, MODULE_IDS} from './timeline';

export const RemotionRoot: React.FC = () => (
	<>
		{MODULE_IDS.map((id) => (
			<Composition
				key={id}
				id={`Modulo-${id.replace('m', '')}`}
				component={ModuleVideo}
				width={W}
				height={H}
				fps={FPS}
				durationInFrames={1}
				defaultProps={{moduleId: id}}
				// duração calculada a partir do manifest de áudio (nunca digitada à mão)
				calculateMetadata={({props}) => ({durationInFrames: buildModule(props.moduleId).durationInFrames})}
			/>
		))}
	</>
);
