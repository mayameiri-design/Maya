#!/usr/bin/env python3
"""Maya's music library: add / search / list / mix.  Needs only ffmpeg + ffprobe.

Why a license is mandatory: these videos are business ads. A track without a
clear commercial licence can get a Reel muted or an ad rejected, so `add`
refuses to register a track unless its licence and source are stated.

Library location: <skill>/music/library  (override: MAYA_MUSIC_DIR)

  add    music.py add FILE --title T --artist A --source S --license L \
                      [--license-url U] [--mood calm,warm] [--genre lofi] [--bpm 90] [--attribution "text"]
  search music.py search [--mood M] [--genre G] [--min-dur 15] [--max-dur 90] [--text word]
  list   music.py list
  mix    music.py mix --video IN.mp4 --track ID --out OUT.mp4 [--level -20] [--no-duck] [--fade 1.5]
         Writes OUT.mp4 (video + voice + ducked music) AND OUT.music-stem.wav
         (the music alone, so it can be imported as a separate layer).
"""
import argparse, json, os, shutil, subprocess, sys, re
from pathlib import Path

ROOT = Path(os.environ.get("MAYA_MUSIC_DIR", Path(__file__).resolve().parent.parent))
LIB = ROOT / "library"
INDEX = ROOT / "index.json"

# Licences that allow commercial use (ads, monetised social). Anything else is refused.
OK_LICENSES = {
    "cc0", "public-domain", "cc-by", "cc-by-4.0", "cc-by-3.0",
    "pixabay", "youtube-audio-library", "epidemic-sound", "artlist",
    "envato", "purchased", "own-work",
}
NEEDS_ATTRIBUTION = {"cc-by", "cc-by-4.0", "cc-by-3.0"}


def load():
    return json.loads(INDEX.read_text()) if INDEX.exists() else []


def save(items):
    INDEX.parent.mkdir(parents=True, exist_ok=True)
    INDEX.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n")


def probe_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True)
    if out.returncode != 0 or not out.stdout.strip():
        sys.exit(f"ffprobe could not read {path} - is it a valid audio file?")
    return round(float(out.stdout.strip()), 1)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "track"


def cmd_add(a):
    lic = a.license.lower()
    if lic not in OK_LICENSES:
        sys.exit(f"Refusing: licence '{a.license}' is not on the commercial-use list: "
                 f"{', '.join(sorted(OK_LICENSES))}.\n"
                 "If it really allows commercial use, add it to OK_LICENSES deliberately.")
    if lic in NEEDS_ATTRIBUTION and not a.attribution:
        sys.exit("This licence requires attribution: pass --attribution \"Title by Artist (link)\".")
    src = Path(a.file)
    if not src.is_file():
        sys.exit(f"No such file: {src}")
    items = load()
    tid = slug(f"{a.artist}-{a.title}")
    if any(i["id"] == tid for i in items):
        sys.exit(f"Already in library: {tid}")
    LIB.mkdir(parents=True, exist_ok=True)
    dest = LIB / f"{tid}{src.suffix.lower()}"
    shutil.copy2(src, dest)
    items.append({
        "id": tid, "file": dest.name, "title": a.title, "artist": a.artist,
        "source": a.source, "license": a.license, "license_url": a.license_url or "",
        "attribution": a.attribution or "", "mood": [m.strip() for m in a.mood.split(",") if m.strip()],
        "genre": a.genre or "", "bpm": a.bpm, "duration_s": probe_duration(dest),
    })
    save(items)
    print(f"added {tid} ({items[-1]['duration_s']}s, {a.license})")


def cmd_search(a):
    hits = []
    for i in load():
        if a.mood and not any(a.mood.lower() == m.lower() for m in i["mood"]):
            continue
        if a.genre and a.genre.lower() != i["genre"].lower():
            continue
        if a.min_dur and i["duration_s"] < a.min_dur:
            continue
        if a.max_dur and i["duration_s"] > a.max_dur:
            continue
        if a.text and a.text.lower() not in json.dumps(i, ensure_ascii=False).lower():
            continue
        hits.append(i)
    if not hits:
        print("no matching tracks (library may be empty - see music/README.md)")
    for i in hits:
        print(f"{i['id']:40} {i['duration_s']:>6}s  bpm={i['bpm'] or '-':<4} "
              f"{','.join(i['mood']):28} {i['license']}")


def cmd_list(_):
    cmd_search(argparse.Namespace(mood=None, genre=None, min_dur=None, max_dur=None, text=None))


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("ffmpeg failed:\n" + r.stderr[-1500:])


def has_audio(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries",
                        "stream=index", "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    return bool(r.stdout.strip())


def cmd_mix(a):
    items = {i["id"]: i for i in load()}
    if a.track not in items:
        sys.exit(f"Unknown track '{a.track}'. Run: music.py list")
    track = LIB / items[a.track]["file"]
    vid = Path(a.video)
    dur = probe_duration(vid)
    fade = min(a.fade, dur / 3)
    out = Path(a.out)
    stem = out.with_suffix(".music-stem.wav")

    # music bed: loop if short, trim to video length, fade in/out, set level (dB)
    bed = (f"[1:a]aloop=loop=-1:size=2e9,atrim=0:{dur},asetpts=N/SR/TB,"
           f"afade=t=in:d={fade},afade=t=out:st={max(dur - fade, 0)}:d={fade},"
           f"volume={a.level}dB")

    # stem (music alone) - lets the editor import it as its own layer
    run(["ffmpeg", "-v", "error", "-y", "-i", str(vid), "-i", str(track),
         "-filter_complex", bed + "[m]", "-map", "[m]", "-ar", "48000", str(stem)])

    if has_audio(vid) and not a.no_duck:
        # sidechain: music automatically dips while the voice is speaking
        fc = (f"[0:a]asplit[v1][v2];{bed}[m];"
              "[m][v1]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=450[d];"
              "[v2][d]amix=inputs=2:normalize=0:duration=first[a]")
    elif has_audio(vid):
        fc = f"{bed}[m];[0:a][m]amix=inputs=2:normalize=0:duration=first[a]"
    else:
        fc = f"{bed}[a]"
    run(["ffmpeg", "-v", "error", "-y", "-i", str(vid), "-i", str(track),
         "-filter_complex", fc, "-map", "0:v", "-map", "[a]",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", str(out)])
    print(f"wrote {out} and {stem}")
    t = items[a.track]
    if t["attribution"]:
        print("ATTRIBUTION REQUIRED in the caption/credits:", t["attribution"])


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = p.add_subparsers(dest="cmd", required=True)
    a = sp.add_parser("add")
    a.add_argument("file"); a.add_argument("--title", required=True); a.add_argument("--artist", required=True)
    a.add_argument("--source", required=True); a.add_argument("--license", required=True)
    a.add_argument("--license-url"); a.add_argument("--attribution")
    a.add_argument("--mood", default=""); a.add_argument("--genre", default=""); a.add_argument("--bpm", type=int)
    a.set_defaults(fn=cmd_add)
    s = sp.add_parser("search")
    s.add_argument("--mood"); s.add_argument("--genre"); s.add_argument("--text")
    s.add_argument("--min-dur", type=float); s.add_argument("--max-dur", type=float)
    s.set_defaults(fn=cmd_search)
    sp.add_parser("list").set_defaults(fn=cmd_list)
    m = sp.add_parser("mix")
    m.add_argument("--video", required=True); m.add_argument("--track", required=True)
    m.add_argument("--out", required=True); m.add_argument("--level", type=float, default=-20.0)
    m.add_argument("--fade", type=float, default=1.5); m.add_argument("--no-duck", action="store_true")
    m.set_defaults(fn=cmd_mix)
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
