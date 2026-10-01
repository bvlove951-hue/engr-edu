#!/usr/bin/env python3
"""기획 문서용 그림(docs/figures/*.svg)을 만든다.  사용법: python3 tools/make_doc_figures.py"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import figlib  # noqa: E402
from figlib import Fig  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "docs" / "figures"


def concepts():
    g = Fig("hbm-concepts", 960, 660, "HBM 역추적 표현 방식 4가지")
    panels = [(16, 16, "A. Powers of Ten 연속 줌"), (488, 16, "B. 도면 상세도"),
              (16, 330, "C. 공정 되감기"), (488, 330, "D. 분해도 + 마우스 오버")]
    for x, y, t in panels:
        g.rect(x, y, 456, 300, "pn", rx=12)
        g.text(x + 16, y + 30, t, "ink", 15, anchor="start", weight=700)

    # A — 중첩된 사각형과 로그 눈금
    x0, y0 = 16, 16
    cx, cy = x0 + 270, y0 + 170
    sizes = [(300, "12 m"), (190, "0.8 m"), (120, "100 mm"), (76, "30 mm"), (48, "16 mm"), (30, "200 µm")]
    for i, (w, lab) in enumerate(sizes):
        h = w / 1.6
        ox, oy = cx + (i * 6), cy + (i * 4)
        g.rect(ox - w / 2, oy - h / 2, w, h, "l1" if i else "l0", rx=4, sw=1.4 if i else 1.2, dash=None if i == 0 else "5 3")
        if i < 4:
            g.text(ox - w / 2 + 4, oy - h / 2 + 13, lab, "sub", 10.5, anchor="start")
    g.circle(cx + 30, cy + 20, 4, "k1")
    g.line(x0 + 30, y0 + 60, x0 + 30, y0 + 280, "ax", 2)
    for k, lab in enumerate(["10 m", "1 m", "1 cm", "100 µm", "1 µm", "100 nm"]):
        yy = y0 + 64 + k * 42
        g.line(x0 + 25, yy, x0 + 35, yy, "ax", 1.5)
        g.text(x0 + 40, yy + 4, lab, "mut", 10, anchor="start")
    g.poly([(x0 + 20, y0 + 186), (x0 + 30, y0 + 192), (x0 + 20, y0 + 198)], "k2")
    g.text(x0 + 440, y0 + 290, "스크롤 = 한 점으로 계속 빨려 들어감", "sub", 11.5, anchor="end")

    # B — 상세 원과 상세도
    x0, y0 = 488, 16
    g.rect(x0 + 24, y0 + 60, 200, 140, "f0 s0", rx=6, sw=1.2)
    g.rect(x0 + 74, y0 + 90, 100, 80, "f1 s1", rx=4, sw=1.2)
    for k in range(3):
        g.rect(x0 + 40, y0 + 78 + k * 36, 26, 26, "f2 s2", rx=3, sw=1)
    g.circle(x0 + 66, y0 + 116, 22, "l2", sw=2)
    g.text(x0 + 66, y0 + 60, "B", "ink", 13, weight=700)
    g.line(x0 + 86, y0 + 106, x0 + 286, y0 + 92, "ed", 1.2, dash="4 3")
    g.circle(x0 + 344, y0 + 140, 86, "l2", sw=2)
    g.rect(x0 + 284, y0 + 104, 68, 68, "f2 s2", rx=4, sw=1.4)
    g.rect(x0 + 356, y0 + 104, 60, 68, "f1 s1", rx=4, sw=1.4)
    for k in range(5):
        g.line(x0 + 352, y0 + 112 + k * 13, x0 + 356, y0 + 112 + k * 13, "l1", 2)
    g.text(x0 + 344, y0 + 246, "상세 B · SCALE 10:1", "ink", 12, weight=700)
    g.rect(x0 + 300, y0 + 258, 140, 32, "bg", rx=3)
    g.rect(x0 + 300, y0 + 258, 140, 32, "l0", rx=3, sw=1)
    g.text(x0 + 306, y0 + 271, "표제란 · 상세 3/10", "sub", 9.5, anchor="start")
    g.text(x0 + 306, y0 + 284, "화면 폭 100 mm · ×120", "sub", 9.5, anchor="start")

    # C — 공정 타임라인 되감기
    x0, y0 = 16, 330
    steps = ["FAB", "전면", "캐리어", "후면", "적층", "테스트", "다이싱", "출하", "CoWoS"]
    for k, t in enumerate(steps):
        xx = x0 + 34 + k * 47
        cls = "f2 s2" if k == 7 else ("f1 s1" if k > 7 else "f0 s0")
        g.rect(xx - 20, y0 + 220, 42, 26, cls, rx=6, sw=1)
        g.text(xx + 1, y0 + 237, t, "ink", 9.5, weight=600)
    g.text(x0 + 300, y0 + 272, "◀◀ 되감기 — 표시가 거꾸로 움직인다", "ink", 11.5, weight=700)
    # 큐브 → 웨이퍼 자리
    g.circle(x0 + 120, y0 + 130, 70, "f0 s0", sw=1.2)
    for i in range(-3, 4):
        for j in range(-3, 4):
            if i * i + j * j <= 10:
                g.rect(x0 + 120 + i * 16 - 7, y0 + 130 + j * 16 - 7, 14, 14, "f3" if (i, j) != (1, -1) else "k2", rx=2)
    g.poly([(x0 + 330, y0 + 90), (x0 + 380, y0 + 112), (x0 + 330, y0 + 134), (x0 + 280, y0 + 112)], "f2 s2", sw=1.4)
    g.poly([(x0 + 280, y0 + 112), (x0 + 330, y0 + 134), (x0 + 330, y0 + 148), (x0 + 280, y0 + 126)], "f0 s0", sw=1.2)
    g.poly([(x0 + 330, y0 + 134), (x0 + 380, y0 + 112), (x0 + 380, y0 + 126), (x0 + 330, y0 + 148)], "f0 s0", sw=1.2)
    g.path(f"M{x0 + 280},{y0 + 150} C{x0 + 240},{y0 + 190} {x0 + 180},{y0 + 150} {x0 + 140},{y0 + 116}", "ed", sw=1.6, dash="5 4", arrow=True)
    g.text(x0 + 330, y0 + 76, "큐브", "sub", 11)
    g.text(x0 + 120, y0 + 52, "웨이퍼의 제자리", "sub", 11)

    # D — 분해도 + 툴팁
    x0, y0 = 488, 330
    ox, oy = x0 + 150, y0 + 70
    for k in range(5):
        z = k * 34
        top = [(ox, oy + 120 - z), (ox + 90, oy + 168 - z), (ox, oy + 216 - z), (ox - 90, oy + 168 - z)]
        cls = "f3 s3" if k == 0 else ("f2 s2" if k == 3 else "f1 s1")
        g.poly(top, cls, sw=1.3)
    g.line(ox, oy + 80, ox, oy + 200, "l2", 1.6, dash="3 3")
    g.rect(x0 + 260, y0 + 96, 180, 74, "bg", rx=8)
    g.rect(x0 + 260, y0 + 96, 180, 74, "l0", rx=8, sw=1)
    g.text(x0 + 272, y0 + 118, "코어 다이 #3 (DRAM)", "ink", 12, anchor="start", weight=700)
    g.text(x0 + 272, y0 + 138, "두께 수십 µm", "sub", 11, anchor="start")
    g.text(x0 + 272, y0 + 156, "TSV 수천 개로 위아래 연결", "sub", 11, anchor="start")
    g.line(x0 + 260, y0 + 132, ox + 60, oy + 98, "ed", 1.2)
    g.text(x0 + 440, y0 + 290, "부품에 마우스 → 이름·크기·역할", "sub", 11.5, anchor="end")

    g.text(480, 652, "최종안: A의 카메라 + B의 시각 언어 + C의 시간 축 + D의 상호작용", "ink", 13, weight=700)
    return g


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for fn in (concepts,):
        g = fn()
        (OUT / f"{g.name}.svg").write_text(g.svg(), encoding="utf-8")
        print("→", OUT / f"{g.name}.svg")
    for w in figlib.WARNINGS:
        print("경고:", w)


if __name__ == "__main__":
    main()
