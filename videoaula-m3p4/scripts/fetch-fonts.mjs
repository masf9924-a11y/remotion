// Usa os metadados oficiais do @remotion/google-fonts (URLs + unicode-range)
// e baixa os .woff2 para public/fonts, para renderizar sem depender da rede.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const WANT = {Lexend: ['400', '600', '700', '800'], Inter: ['400', '500', '600', '700']};
const SUBSETS = ['latin', 'latin-ext', 'greek'];
const out = path.join(process.cwd(), 'public', 'fonts');
fs.mkdirSync(out, {recursive: true});
const faces = [];
for (const [name, weights] of Object.entries(WANT)) {
	const info = (await import(`@remotion/google-fonts/${name}`)).getInfo();
	for (const w of weights) {
		for (const s of SUBSETS) {
			const url = info.fonts.normal[w]?.[s];
			if (!url) continue;
			const file = `${name}-${w}-${s}.woff2`;
			if (!fs.existsSync(path.join(out, file))) execFileSync('curl', ['-sSfL', '-o', path.join(out, file), url]);
			faces.push({family: info.fontFamily, weight: w, file, unicodeRange: info.unicodeRanges[s]});
		}
	}
}
fs.writeFileSync(path.join(process.cwd(), 'src', 'data', 'fonts.json'), JSON.stringify(faces, null, 1));
console.log(`${faces.length} arquivos de fonte prontos`);
