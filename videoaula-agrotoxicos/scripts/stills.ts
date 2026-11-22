import fs from 'node:fs';
// Renderiza um still por cena (no fim da cena, com todos os elementos visíveis) para revisão.
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {buildModule, MODULE_IDS} from '../src/timeline';

const only = process.argv[2];
const chrome = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = fs.existsSync(chrome) ? chrome : null;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
for (const id of MODULE_IDS) {
	if (only && !only.split(',').includes(id)) continue;
	const mod = buildModule(id);
	const composition = await selectComposition({serveUrl, id: `Modulo-${id.replace('m', '')}`, inputProps: {moduleId: id}, browserExecutable});
	for (const s of mod.scenes) {
		const frame = s.start + s.durationInFrames - 26;
		const output = path.resolve('out/stills', `${s.id}.png`);
		await renderStill({serveUrl, composition, frame, output, inputProps: {moduleId: id}, browserExecutable, scale: 0.5});
		console.log('still', s.id, frame);
	}
}
