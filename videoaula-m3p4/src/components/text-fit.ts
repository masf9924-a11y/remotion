import {fillTextBox, fitText, measureText} from '@remotion/layout-utils';

const cache = new Map<string, number>();

/** Maior fonte (≤ maxSize) em que `text` cabe numa linha de `width` px. */
export const fitLine = ({text, width, maxSize, minSize, fontFamily, fontWeight}: {text: string; width: number; maxSize: number; minSize: number; fontFamily: string; fontWeight: number}) => {
	const key = ['L', text, width, maxSize, minSize, fontFamily, fontWeight].join('|');
	const hit = cache.get(key);
	if (hit !== undefined) {
		return hit;
	}
	const {fontSize} = fitText({text, withinWidth: width, fontFamily, fontWeight});
	const result = Math.max(minSize, Math.min(maxSize, Math.floor(fontSize)));
	cache.set(key, result);
	return result;
};

/**
 * Maior fonte em que o texto quebrado em linhas cabe em width × height.
 * Usa fillTextBox (quebra por palavras medidas no DOM) para nunca estourar o card.
 */
export const fitBlock = ({text, width, height, maxSize, minSize, lineHeight, fontFamily, fontWeight}: {text: string; width: number; height: number; maxSize: number; minSize: number; lineHeight: number; fontFamily: string; fontWeight: number}) => {
	const key = ['B', text, width, height, maxSize, minSize, lineHeight, fontFamily, fontWeight].join('|');
	const hit = cache.get(key);
	if (hit !== undefined) {
		return hit;
	}
	const words = text.split(/\s+/).filter(Boolean);
	let chosen = minSize;
	for (let size = maxSize; size >= minSize; size -= 1) {
		const maxLines = Math.floor(height / (size * lineHeight));
		if (maxLines < 1) {
			continue;
		}
		const box = fillTextBox({maxBoxWidth: width, maxLines});
		let fits = true;
		for (let i = 0; i < words.length; i++) {
			const r = box.add({text: i === words.length - 1 ? words[i] : `${words[i]} `, fontFamily, fontWeight, fontSize: size});
			if (r.exceedsBox) {
				fits = false;
				break;
			}
		}
		if (fits) {
			chosen = size;
			break;
		}
	}
	cache.set(key, chosen);
	return chosen;
};

export const textWidth = (text: string, fontSize: number, fontFamily: string, fontWeight: number) => measureText({text, fontSize, fontFamily, fontWeight}).width;
