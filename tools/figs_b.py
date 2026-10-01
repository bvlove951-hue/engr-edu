"""03 공학의 기초 그림."""
import math
from figlib import Fig, normal_pdf, curve_path, area_path, f


def normal():
    g = Fig("normal", 720, 320, "정규분포와 ±1σ·±2σ·±3σ 범위")
    x0, x1, base, peak = 60, 660, 210, 46
    sx = lambda z: x0 + (z + 4) / 8 * (x1 - x0)
    pk = normal_pdf(0, 0, 1)
    sy = lambda p: base - p / pk * (base - peak)
    fn = lambda z: normal_pdf(z, 0, 1)
    for k, cls in ((3, "q1"), (2, "q2"), (1, "q3")):
        g.path(area_path(fn, -k, k, sx, sy, base), cls)
    g.path(curve_path(fn, -4, 4, sx, sy), "l1", sw=2)
    g.line(x0, base, x1, base, "ax", 1.5)
    for z in range(-3, 4):
        g.line(sx(z), base, sx(z), base + 5, "ax", 1.5)
        g.text(sx(z), base + 19, "평균" if z == 0 else f"{z:+d}σ".replace("+", "+"), "mut", 11.5)
    g.line(sx(0), peak, sx(0), base, "gr", 1, dash="3 3")
    rows = [(1, "±1σ 안에 약 68.3%"), (2, "±2σ 안에 약 95.4%"), (3, "±3σ 안에 약 99.73%")]
    for i, (k, t) in enumerate(rows):
        y = 246 + i * 24
        g.line(sx(-k), y, sx(k), y, "ed", 1.4)
        g.line(sx(-k), y - 5, sx(-k), y + 5, "ed", 1.4)
        g.line(sx(k), y - 5, sx(k), y + 5, "ed", 1.4)
        g.label_bg(sx(0), y + 4, t, 12, "ink")
    g.text(24, 30, "같은 평균이라도 σ(산포)가 작을수록 좁고 높은 산이 된다", "sub", 12.5, anchor="start")
    return g


def cp_cpk():
    g = Fig("cp-cpk", 720, 300, "Cp와 Cpk — 중심과 산포가 규격에 주는 영향")
    panels = [
        ("① 좋음", 10.0, 0.2, "Cp 1.67 · Cpk 1.67", "규격 밖 ≈ 0%"),
        ("② 중심 치우침", 10.7, 0.2, "Cp 1.67 · Cpk 0.50", "규격 밖 ≈ 6.7%"),
        ("③ 산포 큼", 10.0, 0.4, "Cp 0.83 · Cpk 0.83", "규격 밖 ≈ 1.2%×2"),
    ]
    lo, hi = 8.6, 11.6
    for i, (t, mu, sd, s1, s2) in enumerate(panels):
        px = 22 + i * 232
        g.rect(px, 14, 214, 272, "pn", rx=10)
        g.text(px + 107, 40, t, "ink", 14, weight=700)
        x0, x1, base, top = px + 12, px + 202, 200, 86
        sx = lambda v, x0=x0, x1=x1: x0 + (v - lo) / (hi - lo) * (x1 - x0)
        scale = (base - top - 10) / normal_pdf(0, 0, 0.2)
        sy = lambda p, scale=scale: base - p * scale
        fn = lambda v, mu=mu, sd=sd: normal_pdf(v, mu, sd)
        g.path(area_path(fn, max(lo, mu - 4 * sd), min(hi, mu + 4 * sd), sx, sy, base), "f1")
        if mu + 4 * sd > 11:
            g.path(area_path(fn, 11, min(hi, mu + 4 * sd), sx, sy, base), "critw")
        if mu - 4 * sd < 9:
            g.path(area_path(fn, max(lo, mu - 4 * sd), 9, sx, sy, base), "critw")
        g.path(curve_path(fn, max(lo, mu - 4 * sd), min(hi, mu + 4 * sd), sx, sy), "l1", sw=2)
        g.line(x0, base, x1, base, "ax", 1.5)
        for v, lab in ((9, "LSL"), (11, "USL")):
            g.line(sx(v), top - 6, sx(v), base, "critl", 1.5, dash="5 3")
            g.text(sx(v), top - 12, lab, "ink", 11.5, weight=700)
        g.line(sx(10), base, sx(10), base + 5, "ax", 1.5)
        g.text(sx(10), base + 18, "규격 중심", "mut", 11)
        g.text(px + 107, 244, s1, "ink", 13, weight=700)
        g.text(px + 107, 266, s2, "sub", 12.5)
    return g


CC_DATA = [0.3, -0.8, 1.1, -0.2, 0.6, -1.3, 0.2, 0.9, -0.5, -0.1, 3.4, -0.6, -0.3, 0.5, 1.2, 0.3, 0.8, 1.5, 0.6, 0.9, 0.4,
           -1.6, -1.1, -0.6, -0.1, 0.5, 1.0, 1.8]


def control_chart():
    g = Fig("control-chart", 720, 330, "관리도 읽기 — 이상 신호 세 가지")
    x0, x1, cl, s = 70, 690, 182, 22
    n = len(CC_DATA)
    sx = lambda i: x0 + 10 + i * (x1 - x0 - 20) / (n - 1)
    sy = lambda v: cl - v * s
    for v, lab, cls, dash in ((4.5, "USL", "critl", "6 3"), (3, "UCL", "ax", "4 3"), (0, "중심선", "ax", None),
                              (-3, "LCL", "ax", "4 3"), (-4.5, "LSL", "critl", "6 3")):
        g.line(x0, sy(v), x1, sy(v), cls, 1.4 if cls == "ax" else 1.5, dash=dash)
        g.text(x0 - 8, sy(v) + 4, lab, "ink" if cls == "critl" else "sub", 11.5, anchor="end", weight=700 if cls == "critl" else None)
    # 이상 구간 표시
    g.rect(sx(13) - 8, sy(2.1), sx(20) - sx(13) + 16, sy(-0.6) - sy(2.1), "f4", rx=6)
    g.rect(sx(21) - 8, sy(2.4), sx(27) - sx(21) + 16, sy(-2.2) - sy(2.4), "f5", rx=6)
    pts = " ".join(f"{f(sx(i))},{f(sy(v))}" for i, v in enumerate(CC_DATA))
    g.add(f'<polyline class="l1" points="{pts}" stroke-width="2"/>')
    for i, v in enumerate(CC_DATA):
        g.circle(sx(i), sy(v), 4.5, "k1 ring" if i != 10 else "crit ring", sw=2)
    g.circle(sx(10), sy(3.4), 10, "critl", sw=1.6)
    g.text(sx(10) + 14, sy(3.4) + 4, "① 관리한계 밖 1점", "ink", 12.5, anchor="start", weight=700)
    g.text((sx(13) + sx(20)) / 2, sy(-0.6) + 18, "② 중심선 한쪽 연속 8점", "ink", 12.5, weight=700)
    g.text((sx(21) + sx(27)) / 2, sy(2.4) - 8, "③ 연속 증가 (추세)", "ink", 12.5, weight=700)
    g.text(24, 26, "관리한계(UCL·LCL)는 공정의 실제 산포로 정하고, 규격(USL·LSL)은 고객·설계가 정한다", "sub", 12.5, anchor="start", maxw=670)
    g.text(x0, 316, "lot 순서 →", "mut", 11.5, anchor="start")
    return g


def acc_prec():
    g = Fig("acc-prec", 720, 250, "정확도와 정밀도")
    cases = [("정확 ✓ 정밀 ✓", "목표 상태", (0, 0), 6), ("정확 ✗ 정밀 ✓", "교정(calibration) 필요", (22, -18), 6),
             ("정확 ✓ 정밀 ✗", "반복성 개선 필요", (0, 0), 26), ("정확 ✗ 정밀 ✗", "측정 방법부터 점검", (-20, 16), 24)]
    offs = [(0.2, 0.9), (-0.8, 0.3), (0.6, -0.6), (-0.3, -0.9), (0.9, 0.1), (-0.6, 0.8), (0.1, -0.2), (-0.9, -0.4)]
    for i, (t, sub, (cx, cy), spread) in enumerate(cases):
        x, y = 92 + i * 179, 112
        for r, cls in ((64, "f0"), (44, "pn"), (24, "f0")):
            g.circle(x, y, r, cls)
        g.circle(x, y, 64, "l0", sw=1)
        g.circle(x, y, 4, "k0")
        for ox, oy in offs:
            g.circle(x + cx + ox * spread, y + cy + oy * spread, 5, "k1 ring", sw=2)
        g.text(x, 202, t, "ink", 13, weight=700)
        g.text(x, 222, sub, "sub", 12, maxw=172)
    g.text(24, 28, "가운데 = 참값, 파란 점 = 같은 시료를 반복 측정한 값", "sub", 12.5, anchor="start")
    return g


def confounder():
    g = Fig("confounder", 720, 260, "상관과 인과 — 제3의 변수")
    g.box(230, 16, 260, 62, "제3의 변수", 4, 14, sub="같은 장비 · 같은 시기 · 같은 약품 lot")
    g.box(60, 138, 200, 48, "A: 두께 증가", 1, 14)
    g.box(460, 138, 200, 48, "B: 불량 증가", 1, 14)
    g.arrow(300, 78, 190, 136, sw=1.8)
    g.arrow(420, 78, 530, 136, sw=1.8)
    g.text(232, 106, "영향", "sub", 12, anchor="end")
    g.text(488, 106, "영향", "sub", 12, anchor="start")
    g.line(262, 162, 458, 162, "ed", 1.6, dash="5 4")
    g.label_bg(360, 156, "함께 움직임 = 상관", 12, "ink")
    g.text(360, 218, "✗ 상관만으로는 A가 B의 원인이라는 증거가 되지 않는다", "ink", 13, weight=700)
    g.text(360, 242, "인과를 확인하려면 다른 조건을 고정하고 A만 바꿔 본다", "sub", 12)
    return g


def interaction():
    g = Fig("interaction", 720, 306, "교호작용 — 한 인자의 효과가 다른 인자 수준에 따라 달라짐")
    charts = [("교호작용 없음 (평행)", [(2.0, 4.0), (3.0, 5.0)]), ("교호작용 있음 (교차)", [(2.0, 2.4), (2.6, 5.4)])]
    for i, (t, series) in enumerate(charts):
        px = 30 + i * 350
        g.text(px + 160, 30, t, "ink", 14, weight=700)
        x0, x1, y0, y1 = px + 50, px + 250, 230, 60
        for v in (0, 2, 4, 6):
            yy = y0 - v / 6 * (y0 - y1)
            g.line(x0, yy, x1, yy, "gr", 1)
        g.line(x0, y0, x1, y0, "ax", 1.5)
        g.text(px + 34, (y0 + y1) / 2, "불량률", "mut", 11.5, anchor="end")
        for xx, lab in ((x0 + 20, "전류밀도 저"), (x1 - 20, "전류밀도 고")):
            g.text(xx, y0 + 18, lab, "mut", 11.5)
        for (a, b), cls, lab in zip(series, ("1", "2"), ("온도 저", "온도 고")):
            ya, yb = y0 - a / 6 * (y0 - y1), y0 - b / 6 * (y0 - y1)
            g.line(x0 + 20, ya, x1 - 20, yb, f"l{cls}", 2)
            g.circle(x0 + 20, ya, 5, f"k{cls} ring", sw=2)
            g.circle(x1 - 20, yb, 5, f"k{cls} ring", sw=2)
            g.text(x1 - 10, yb + 4, lab, "ink", 12, anchor="start", weight=600)
    g.circle(250, 268, 5, "k1 ring", sw=2)
    g.text(260, 272, "온도 저", "sub", 12, anchor="start")
    g.circle(340, 268, 5, "k2 ring", sw=2)
    g.text(350, 272, "온도 고", "sub", 12, anchor="start")
    g.text(360, 296, "OFAT(한 번에 한 인자)로는 오른쪽 같은 경우를 놓친다 → DOE로 함께 바꿔 본다", "sub", 12.5, maxw=680)
    return g


def cte():
    g = Fig("cte", 720, 310, "열팽창계수 차이와 휨")
    g.text(30, 30, "열팽창계수 (ppm/K, 대략)", "ink", 13.5, anchor="start", weight=700)
    mats = [("실리콘 Si", 2.6), ("몰드 EMC", 10), ("니켈 Ni", 13), ("구리 Cu", 17), ("SnAg 솔더", 21)]
    for i, (m, v) in enumerate(mats):
        y = 56 + i * 44
        g.text(118, y + 17, m, "sub", 12.5, anchor="end")
        w = v / 22 * 190
        g.rect(126, y + 4, w, 20, "k1", rx=4)
        g.text(126 + w + 6, y + 19, f"{v:g}", "ink", 12.5, anchor="start", weight=700)
    g.text(30, 290, "EMC는 유리전이온도 이상에서 크게 증가", "mut", 11.5, anchor="start")
    # 오른쪽: 이중층 휨
    cx = 540
    g.text(cx, 30, "고온 (접합할 때) — 평평", "ink", 13, weight=700)
    g.rect(cx - 140, 46, 280, 16, "m-cu", rx=2)
    g.rect(cx - 140, 62, 280, 22, "m-si", rx=2)
    g.text(cx + 150, 58, "Cu", "sub", 11.5, anchor="start")
    g.text(cx + 150, 78, "Si", "sub", 11.5, anchor="start")
    g.arrow(cx, 96, cx, 134, sw=1.8)
    g.text(cx + 10, 120, "식으면 (ΔT)", "sub", 12, anchor="start")
    # 휜 모양 (가장자리가 올라감)
    def arc(y, sag, h, cls):
        top = f"M{cx - 140},{y} Q{cx},{y + 2 * sag} {cx + 140},{y}"
        bot = f"L{cx + 140},{y + h} Q{cx},{y + h + 2 * sag} {cx - 140},{y + h} Z"
        g.path(top + " " + bot, cls)
    arc(150, 26, 16, "m-cu")
    arc(166, 26, 22, "m-si")
    g.text(cx, 236, "Cu가 Si보다 많이 줄어든다", "ink", 13, weight=700)
    g.text(cx, 256, "→ 휨(warpage) + 계면 응력", "sub", 12.5)
    g.text(cx, 280, "응력 ≈ E × Δα × ΔT", "ink", 13, weight=700)
    return g


def diffusion():
    g = Fig("diffusion", 720, 280, "확산 거리는 시간의 제곱근에 비례")
    x0, x1, y0, y1 = 80, 640, 230, 50
    sx = lambda t: x0 + t / 16 * (x1 - x0)
    sy = lambda d: y0 - d / 4.4 * (y0 - y1)
    for d in (1, 2, 3, 4):
        g.line(x0, sy(d), x1, sy(d), "gr", 1)
        g.text(x0 - 8, sy(d) + 4, f"{d}", "mut", 11.5, anchor="end")
    g.line(x0, y0, x1, y0, "ax", 1.5)
    for t in (0, 4, 8, 12, 16):
        g.text(sx(t), y0 + 18, f"{t}", "mut", 11.5)
    g.text((x0 + x1) / 2, y0 + 40, "시간 (상대값)", "sub", 12)
    g.text(x0 - 8, y1 - 12, "확산 거리", "sub", 12, anchor="start")
    g.path(curve_path(lambda t: math.sqrt(t), 0, 16, sx, sy, 160), "l1", sw=2)
    for t, lab in ((1, "t=1 → 거리 1"), (4, "t=4 → 거리 2"), (16, "t=16 → 거리 4")):
        g.circle(sx(t), sy(math.sqrt(t)), 5.5, "k1 ring", sw=2)
        g.text(sx(t) + (10 if t < 16 else -10), sy(math.sqrt(t)) - 10, lab, "ink", 12.5,
               anchor="start" if t < 16 else "end", weight=600)
    g.text(660, 120, ["시간 4배", "→ 거리 2배"], "ink", 13, anchor="end", weight=700)
    return g


def plating_cell():
    g = Fig("plating-cell", 720, 340, "전해도금 원리 (개념도)")
    g.rect(150, 96, 420, 190, "m-bath", rx=6)
    g.rect(150, 96, 420, 190, "l0", rx=6, sw=1.5)
    g.text(320, 278, "도금액 (Cu²⁺ 이온 + 산 + 첨가제)", "sub", 12)
    g.rect(186, 120, 22, 140, "m-cu", rx=3)
    g.text(150 - 8, 180, ["애노드 (+)", "Cu 공급"], "ink", 12.5, anchor="end", weight=600)
    g.rect(500, 112, 14, 156, "m-si", rx=2)
    g.rect(496, 112, 4, 156, "m-cu", rx=1)
    g.text(578, 170, ["웨이퍼", "= 캐소드 (−)", "Cu가 석출"], "ink", 12.5, anchor="start", weight=600)
    g.rect(462, 112, 34, 156, "f1", rx=2)
    g.line(462, 112, 462, 268, "l1", 1.2, dash="4 3")
    g.rect(300, 22, 120, 40, "f0 s0", rx=8, sw=1.5)
    g.text(360, 47, "정류기 (전류 I)", "ink", 13, weight=600)
    g.path("M300,42 L197,42 L197,120", "ed", sw=1.6)
    g.path("M420,42 L507,42 L507,112", "ed", sw=1.6)
    g.text(250, 36, "e⁻ ←", "sub", 12)
    g.text(462, 36, "→ e⁻", "sub", 12)
    for i, (x, y) in enumerate([(250, 140), (300, 190), (350, 150), (400, 220), (290, 240), (420, 170), (360, 250)]):
        g.circle(x, y, 9, "f2 s2", sw=1.2)
        g.text(x, y + 4, "+", "ink", 11, weight=700)
        g.arrow(x + 12, y, x + 34, y, sw=1.2)
    g.text(250, 124, "Cu²⁺", "ink", 12, weight=700)
    g.text(479, 308, "확산층", "ink", 12, weight=700)
    g.line(479, 296, 479, 270, "ed", 1.2)
    g.text(360, 330, "석출량 ∝ 전류 × 시간 (패러데이 법칙) · 확산층은 교반이 강할수록 얇아진다", "sub", 12, maxw=680)
    return g


FIGS = [normal, cp_cpk, control_chart, acc_prec, confounder, interaction, cte, diffusion, plating_cell]
