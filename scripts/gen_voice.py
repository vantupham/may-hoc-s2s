"""Sinh giọng đọc và phụ đề cho bài giảng.

Đọc kịch bản đã build (dist/giang/<slug>/kich-ban.json), tổng hợp từng câu bằng edge-tts
(giọng neural của Microsoft Edge), rồi ghép thành một tệp MP3 cho mỗi bài:

    public/giang/<slug>/loi-giang.mp3    lời giảng (MP3 CBR 24 kHz, 48 kbps, mono)
    public/giang/<slug>/thoi-gian.json   mã băm và thời lượng từng câu, để trình phát đồng bộ cảnh
    public/giang/<slug>/phu-de.vtt       phụ đề WebVTT

Không cần ffmpeg: edge-tts trả về MP3 CBR, mỗi frame dài đúng 144 byte (24 ms), nên ghép bằng cách
nối byte và tính thời lượng từ số frame. Khoảng lặng giữa các câu là các frame im lặng lấy từ đầu
một câu (frame đầu không tham chiếu frame trước).

Mỗi câu được lưu đệm trong data/voice-cache/<mã băm>.mp3: sửa một câu chỉ phải tạo lại câu đó.

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
GAP_FRAMES = 15      # 0,36 giây lặng sau mỗi câu (khớp DEFAULT_GAP trong timeline.ts)


def lines_of(lec):
    for ch in lec["chapters"]:
        for sc in ch["scenes"]:
            for ln in sc["lines"]:
                yield ln


def check_frames(data: bytes, name: str):
    if len(data) == 0 or len(data) % FRAME:
        raise SystemExit(f"{name}: kích thước {len(data)} không chia hết cho {FRAME} — định dạng MP3 khác dự kiến")
    for i in range(0, len(data), FRAME):
        if data[i] != 0xFF or (data[i + 1] & 0xE0) != 0xE0:
            raise SystemExit(f"{name}: frame {i // FRAME} không có header MP3")
    if b"Xing" in data[:FRAME] or b"Info" in data[:FRAME]:
        raise SystemExit(f"{name}: có frame Xing/Info, cần bỏ trước khi ghép")


async def synth(say: str, voice: str, out: Path, sem: asyncio.Semaphore, tries=4):
    async with sem:
        for k in range(tries):
            try:
                data = b""
                async for chunk in edge_tts.Communicate(say, voice).stream():
                    if chunk["type"] == "audio":
                        data += chunk["data"]
                check_frames(data, out.name)
                out.write_bytes(data)
                return
            except SystemExit:
                raise
            except Exception as e:  # mạng chập chờn: thử lại
                if k == tries - 1:
                    raise
                print(f"  thử lại ({e.__class__.__name__}): {say[:50]}…", file=sys.stderr)
                await asyncio.sleep(2 * (k + 1))


def vtt_time(t: float) -> str:
    ms = round(t * 1000)
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


async def build(slug: str, dist: Path, jobs: int):
    src = dist / "giang" / slug / "kich-ban.json"
    lec = json.loads(src.read_text(encoding="utf-8"))
    voice = lec["voice"]
    lines = list(lines_of(lec))
    CACHE.mkdir(parents=True, exist_ok=True)
    todo = [ln for ln in lines if not (CACHE / f"{ln['h']}.mp3").exists()]
    todo = list({ln["h"]: ln for ln in todo}.values())
    print(f"{slug}: {len(lines)} câu, cần tạo {len(todo)} câu mới (giọng {voice})")
    sem = asyncio.Semaphore(jobs)
    await asyncio.gather(*(synth(ln["say"], voice, CACHE / f"{ln['h']}.mp3", sem) for ln in todo))

    clips = [(CACHE / f"{ln['h']}.mp3").read_bytes() for ln in lines]
    silence = clips[0][:FRAME] * GAP_FRAMES  # frame đầu của câu: im lặng, không phụ thuộc frame trước
    out_dir = ROOT / "public" / "giang" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    audio = bytearray()
    timing = []
    cues = ["WEBVTT", ""]
    t = 0.0
    for ln, clip in zip(lines, clips):
        d = len(clip) // FRAME * FRAME_SEC
        timing.append({"h": ln["h"], "d": round(d, 3)})
        cues += [f"{vtt_time(t)} --> {vtt_time(t + d)}", ln["cap"], ""]
        audio += clip + silence
        t += d + GAP_FRAMES * FRAME_SEC
    (out_dir / "loi-giang.mp3").write_bytes(bytes(audio))
    (out_dir / "thoi-gian.json").write_text(
        json.dumps({"voice": voice, "gap": round(GAP_FRAMES * FRAME_SEC, 3), "lines": timing}, ensure_ascii=False),
        encoding="utf-8",
    )
    (out_dir / "phu-de.vtt").write_text("\n".join(cues), encoding="utf-8")
    words = sum(len(ln["say"].split()) for ln in lines)
    print(f"  → {t / 60:.1f} phút, {words} âm tiết, {len(audio) / 1e6:.1f} MB")
    if not 8 * 60 <= t <= 12.5 * 60:
        print(f"  ! thời lượng {t / 60:.1f} phút nằm ngoài khoảng 8–12 phút", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", nargs="*", help="slug các bài cần sinh (mặc định: mọi bài đã build)")
    ap.add_argument("--dist", default=str(ROOT / "dist"), help="thư mục build của Astro")
    ap.add_argument("--jobs", type=int, default=4, help="số câu tổng hợp song song")
    a = ap.parse_args()
    dist = Path(a.dist)
    slugs = a.only or sorted(p.parent.name for p in (dist / "giang").glob("*/kich-ban.json"))
    if not slugs:
        raise SystemExit("Không thấy kịch bản nào trong dist/giang/. Chạy npm run build trước.")
    for slug in slugs:
        asyncio.run(build(slug, dist, a.jobs))


if __name__ == "__main__":
    main()
