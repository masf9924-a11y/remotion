import path from 'node:path';
import {installWhisperCpp, downloadWhisperModel} from '@remotion/install-whisper-cpp';

export const WHISPER_DIR = path.join(process.cwd(), 'whisper.cpp');
export const WHISPER_VERSION = '1.5.5';
export const WHISPER_MODEL = 'medium';

if (import.meta.url === `file://${process.argv[1]}`) {
	await installWhisperCpp({to: WHISPER_DIR, version: WHISPER_VERSION});
	try {
		await downloadWhisperModel({model: WHISPER_MODEL, folder: WHISPER_DIR});
	} catch (err) {
		console.error('MODEL_DOWNLOAD_FAILED', err.message);
		process.exitCode = 2;
	}
}
