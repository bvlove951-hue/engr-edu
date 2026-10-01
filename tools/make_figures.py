#!/usr/bin/env python3
"""교육자료 그림(education/figures/*.svg)을 만든다.

사용법:  python3 tools/make_figures.py [--gallery 경로.html]
그림을 고치려면 tools/figs_*.py 를 수정하고 이 스크립트를 다시 실행한다.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import figlib  # noqa: E402
import figs_a, figs_b, figs_c, figs_d  # noqa: E402,E401

OUT = Path(__file__).resolve().parent.parent / "education" / "figures"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    names = []
    for mod in (figs_a, figs_b, figs_c, figs_d):
        for fn in mod.FIGS:
            g = fn()
            (OUT / f"{g.name}.svg").write_text(g.svg(), encoding="utf-8")
            names.append(g.name)
    for p in OUT.glob("*.svg"):
        if p.stem not in names:
            p.unlink()
    print(f"그림 {len(names)}개 → {OUT}")
    if figlib.WARNINGS:
        print("경고:")
        for w in figlib.WARNINGS:
            print("  -", w)
    if "--gallery" in sys.argv:
        dest = Path(sys.argv[sys.argv.index("--gallery") + 1])
        body = "".join(f"<h3>{n}</h3>{(OUT / f'{n}.svg').read_text(encoding='utf-8')}" for n in names)
        dest.write_text(f"<!doctype html><meta charset=utf-8><body style='background:#ddd;font-family:sans-serif'>{body}</body>", encoding="utf-8")
        print("갤러리:", dest)
    return 1 if figlib.WARNINGS and "--strict" in sys.argv else 0


if __name__ == "__main__":
    sys.exit(main())
