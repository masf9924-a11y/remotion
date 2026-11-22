// Renderiza um MP4 por módulo e concatena todos com ffmpeg num vídeo final único.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {MODULE_IDS} from '../src/timeline';

const chrome = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable = fs.existsSync(chrome) ? chrome : null;
const outDir = path.resolve('out/modulos');
fs.mkdirSync(outDir, {recursive: true});
const only = process.argv[2]?.split(',');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const files: string[] = [];
for (const id of MODULE_IDS) {
	const compId = `Modulo-${id.replace('m', '')}`;
	const output = path.join(outDir, `${compId}.mp4`);
	files.push(output);
	if (only && !only.includes(id)) continue;
	const composition = await selectComposition({serveUrl, id: compId, inputProps: {moduleId: id}, browserExecutable});
	const t0 = Date.now();
	let last = -1;
	await renderMedia({
		serveUrl,
		composition,
		inputProps: {moduleId: id},
		codec: 'h264',
		crf: 18,
		pixelFormat: 'yuv420p',
		imageFormat: 'jpeg',
		jpegQuality: 92,
		audioBitrate: '192k',
		concurrency: os.cpus().length,
		browserExecutable,
		outputLocation: output,
		onProgress: ({progress}) => {
			const pct = Math.floor(progress * 20) * 5;
			if (pct !== last) {
				last = pct;
				console.log(`${compId}: ${pct}% (${((Date.now() - t0) / 60000).toFixed(1)} min)`);
			}
		},
	});
	console.log(`OK ${compId} → ${output}`);
}

if (!only) {
	const list = path.join(outDir, 'lista.txt');
	fs.writeFileSync(list, files.map((f) => `file '${f}'`).join('\n'));
	const final = path.resolve('out/Videoaula-Agrotoxicos-completa.mp4');
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', final], {stdio: 'inherit'});
	console.log(`FINAL → ${final}`);
}
