"""Sintetiza cada fala do roteiro com edge-tts (vozes neurais pt-BR).

Saídas:
  public/audio/<id>.mp3          áudio da fala
  build/tts/<id>.json            limites de palavra (WordBoundary) emitidos pelo motor TTS

Os limites de palavra servem de fonte de timestamps quando o modelo Whisper
não está disponível; o scripts/align.mjs decide qual fonte usar.
"""

import asyncio
import hashlib
import json
import os
import subprocess
import sys

import certifi

# O proxy deste ambiente reescreve TLS; o edge-tts usa o bundle do certifi.
if os.path.exists("/root/.ccr/ca-bundle.crt"):
    certifi.where = lambda: "/root/.ccr/ca-bundle.crt"

import edge_tts  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(ROOT, "public", "audio")
META_DIR = os.path.join(ROOT, "build", "tts")
os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(META_DIR, exist_ok=True)

with open(os.path.join(ROOT, "roteiro.json"), encoding="utf-8") as f:
    roteiro = json.load(f)

voices = roteiro["voices"]


def probe_duration_ms(path: str) -> int:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]
    )
    return round(float(out.decode().strip()) * 1000)


async def synth(line, sem):
    v = voices[line["speaker"]]
    key = hashlib.sha1(json.dumps([line["text"], v], ensure_ascii=False).encode()).hexdigest()
    mp3 = os.path.join(AUDIO_DIR, f"{line['id']}.mp3")
    meta_path = os.path.join(META_DIR, f"{line['id']}.json")
    if os.path.exists(meta_path) and os.path.exists(mp3):
        with open(meta_path, encoding="utf-8") as f:
            if json.load(f).get("hash") == key:
                return "cached"

    async with sem:
        for attempt in range(4):
            try:
                words = []
                comm = edge_tts.Communicate(
                    line["text"], v["voice"], rate=v["rate"], pitch=v["pitch"], boundary="WordBoundary"
                )
                with open(mp3, "wb") as out:
                    async for chunk in comm.stream():
                        if chunk["type"] == "audio":
                            out.write(chunk["data"])
                        elif chunk["type"] == "WordBoundary":
                            # offset/duração em unidades de 100 ns
                            start = chunk["offset"] / 10_000
                            words.append(
                                {
                                    "text": chunk["text"],
                                    "startMs": round(start, 1),
                                    "endMs": round(start + chunk["duration"] / 10_000, 1),
                                }
                            )
                break
            except Exception as e:  # rede instável: tenta de novo
                if attempt == 3:
                    raise
                print(f"  retry {line['id']}: {e}", file=sys.stderr)
                await asyncio.sleep(2 * (attempt + 1))

    meta = {
        "id": line["id"],
        "hash": key,
        "durationMs": probe_duration_ms(mp3),
        "words": words,
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    return "new"


async def main():
    sem = asyncio.Semaphore(4)
    lines = [
        l
        for m in roteiro["modules"]
        for s in m["scenes"]
        for l in s["lines"]
        if l["speaker"] != "pausa"
    ]
    results = await asyncio.gather(*(synth(l, sem) for l in lines))
    print(f"TTS: {results.count('new')} novas, {results.count('cached')} em cache, {len(lines)} falas")


asyncio.run(main())
