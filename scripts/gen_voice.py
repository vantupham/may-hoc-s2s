"""Sinh giọng đọc và phụ đề cho bài giảng.

Đọc kịch bản đã build (dist/giang/<slug>/kich-ban.json), tổng hợp bằng edge-tts (giọng neural của
Microsoft Edge), rồi ghép thành một tệp MP3 cho mỗi bài:

    public/giang/<slug>/loi-giang.mp3    lời giảng (MP3 CBR 24 kHz, 48 kbps, mono)
    public/giang/<slug>/thoi-gian.json   mã băm và thời lượng từng câu, để trình phát đồng bộ cảnh
    public/giang/<slug>/phu-de.vtt       phụ đề WebVTT

Mỗi câu được đọc trong một yêu cầu riêng. Dịch vụ từ chối ngẫu nhiên khá nhiều yêu cầu (câu càng
dài càng hay bị từ chối), nên mỗi câu được thử lại nhanh nhiều lần.

Không cần ffmpeg: edge-tts trả về MP3 CBR, mỗi frame dài đúng 144 byte (24 ms), nên ghép bằng cách
nối byte và tính thời lượng từ số frame. Khoảng lặng giữa các câu là các frame im lặng lấy từ đầu
một câu (frame đầu không tham chiếu frame trước).

Bộ đệm: data/voice-cache/<mã băm câu>.mp3 (không commit). Sửa một câu chỉ phải đọc lại câu đó.

Cách dùng:
    pip install edge-tts
    npm run build
    python3 scripts/gen_voice.py                       # mọi bài
    python3 scripts/gen_voice.py --only gradient-descent
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "data" / "voice-cache"
FRAME = 144          # byte mỗi frame ở 24 kHz, 48 kbps
FRAME_SEC = 0.024    # 576 mẫu / 24.000 Hz
GAP_FRAMES = 15      # 0,36 giây lặng (khớp DEFAULT_GAP trong timeline.ts)


def check_frames(data: bytes, name: str):
    if len(data) == 0 or len(data) % FRAME:
        raise ValueError(f"{name}: kích thước {len(data)} không chia hết cho {FRAME}")
    for i in range(0, len(data), FRAME):
        if data[i] != 0xFF or (data[i + 1] & 0xE0) != 0xE0:
            raise ValueError(f"{name}: frame {i // FRAME} không có header MP3")
    if b"Xing" in data[:FRAME] or b"Info" in data[:FRAME]:
        raise ValueError(f"{name}: có frame Xing/Info")


async def tts(text: str, voice: str) -> bytes:
    """Một câu, thử lại nhanh nhiều lần: dịch vụ từ chối ngẫu nhiên, không theo nội dung câu."""
    for k in range(40):
        try:
            async def collect():
                data = b""
                async for ch in edge_tts.Communicate(text, voice).stream():
                    if ch["type"] == "audio":
                        data += ch["data"]
                return data
            data = await asyncio.wait_for(collect(), timeout=60)
            check_frames(data, text[:30])
            return data
        except Exception as e:
            if k == 39:
                raise SystemExit(f"không đọc được sau 40 lần: {text[:60]} ({e.__class__.__name__})")
            await asyncio.sleep(30 if k % 10 == 9 else 1.5)  # mỗi 10 lần hỏng thì nghỉ lâu hơn


def vtt_time(t: float) -> str:
    ms = round(t * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


async def build(slug: str, dist: Path):
    lec = json.loads((dist / "giang" / slug / "kich-ban.json").read_text(encoding="utf-8"))
    voice = lec["voice"]
    scenes = [sc["lines"] for ch in lec["chapters"] for sc in ch["scenes"]]
    CACHE.mkdir(parents=True, exist_ok=True)
    print(f"{slug}: {sum(len(s) for s in scenes)} câu (giọng {voice})", flush=True)

    todo = list({ln["h"]: ln for s in scenes for ln in s if not (CACHE / f"{ln['h']}.mp3").exists()}.values())
    for n, ln in enumerate(todo):
        print(f"  {n + 1}/{len(todo)}: {ln['say'][:50]}", flush=True)
        (CACHE / f"{ln['h']}.mp3").write_bytes(await tts(ln["say"], voice))

    audio, timing, cues, t = bytearray(), [], ["WEBVTT", ""], 0
    silence = None
    for lines in scenes:
        for ln in lines:
            clip = (CACHE / f"{ln['h']}.mp3").read_bytes()
            silence = silence or clip[:FRAME] * GAP_FRAMES  # frame đầu của câu: im lặng
            d = len(clip) // FRAME
            timing.append({"h": ln["h"], "d": round(d * FRAME_SEC, 3)})
            cues += [f"{vtt_time(t * FRAME_SEC)} --> {vtt_time((t + d) * FRAME_SEC)}", ln["cap"], ""]
            audio += clip + silence
            t += d + GAP_FRAMES

    out_dir = ROOT / "public" / "giang" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    assert len(audio) == t * FRAME, "lệch giữa âm thanh và bảng thời gian"
    (out_dir / "loi-giang.mp3").write_bytes(bytes(audio))
    (out_dir / "thoi-gian.json").write_text(
        json.dumps({"voice": voice, "gap": round(GAP_FRAMES * FRAME_SEC, 3), "lines": timing}, ensure_ascii=False),
        encoding="utf-8",
    )
    (out_dir / "phu-de.vtt").write_text("\n".join(cues), encoding="utf-8")
    sec = t * FRAME_SEC
    print(f"  → {sec / 60:.1f} phút, {len(audio) / 1e6:.1f} MB", flush=True)
    if not 8 * 60 <= sec <= 12.5 * 60:
        print(f"  ! thời lượng {sec / 60:.1f} phút nằm ngoài khoảng 8–12 phút", file=sys.stderr, flush=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", nargs="*", help="slug các bài cần sinh (mặc định: mọi bài đã build)")
    ap.add_argument("--dist", default=str(ROOT / "dist"), help="thư mục build của Astro")
    a = ap.parse_args()
    dist = Path(a.dist)
    slugs = a.only or sorted(p.parent.name for p in (dist / "giang").glob("*/kich-ban.json"))
    if not slugs:
        raise SystemExit("Không thấy kịch bản nào trong dist/giang/. Chạy npm run build trước.")
    for slug in slugs:
        asyncio.run(build(slug, dist))


if __name__ == "__main__":
    main()
