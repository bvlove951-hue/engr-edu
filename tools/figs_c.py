"""04 반도체의 기초 그림."""
import math
from figlib import Fig, f


def conductivity():
    g = Fig("conductivity", 720, 170, "도체·반도체·부도체")
    x0, x1, y = 40, 680, 70
    segs = [("부도체", "q1", "유리 · 산화막(SiO₂)"), ("반도체", "q2", "실리콘 — 도핑으로 조절"), ("도체", "q3", "구리 · 알루미늄")]
    w = (x1 - x0) / 3
    for i, (t, cls, ex) in enumerate(segs):
        g.rect(x0 + i * w + (2 if i else 0), y, w - (2 if i else 0), 34, cls, rx=6)
        g.text(x0 + i * w + w / 2, y + 23, t, "ink", 14, weight=700)
        g.text(x0 + i * w + w / 2, y + 58, ex, "sub", 12.5)
    g.arrow(x0, 40, x1, 40, sw=1.6)
    g.text(x0, 30, "전기가 흐르는 정도 →", "ink", 13, anchor="start", weight=600)
    g.path(f"M{x0 + w + 30},{y + 72} L{x0 + w + 30},{y + 80} L{x0 + 2 * w - 30},{y + 80} L{x0 + 2 * w - 30},{y + 72}", "ed", sw=1.3)
    g.text(x0 + 1.5 * w, y + 96, "가치: 흐를지 말지를 우리가 제어할 수 있다", "ink", 12.5, weight=600)
    return g


def mosfet():
    g = Fig("mosfet", 720, 310, "MOSFET — 게이트 전압으로 켜고 끄는 스위치")
    for i, on in enumerate((False, True)):
        px = 30 + i * 350
        g.text(px + 160, 30, "OFF — 게이트 0 V" if not on else "ON — 게이트 + 전압", "ink", 14, weight=700)
        g.rect(px, 120, 320, 120, "m-p", rx=4)
        g.text(px + 160, 228, "p형 기판", "sub", 12)
        for sx_, lab in ((px + 20, "소스"), (px + 220, "드레인")):
            g.rect(sx_, 120, 80, 50, "m-n", rx=10)
            g.text(sx_ + 40, 150, "n+", "ink", 12.5, weight=700)
            g.line(sx_ + 40, 120, sx_ + 40, 70, "ed", 1.6)
            g.text(sx_ + 40, 62, lab, "ink", 12.5, weight=600)
        g.rect(px + 96, 112, 128, 8, "m-ox", rx=1)
        g.rect(px + 100, 86, 120, 26, "m-gate", rx=3)
        g.text(px + 160, 104, "게이트", "ink", 12, weight=700)
        g.text(px + 260, 104 - 0, "", "sub", 1)
        g.line(px + 160, 86, px + 160, 50, "ed", 1.6)
        g.text(px + 176, 54, "산화막", "mut", 11, anchor="start")
        g.line(px + 174, 50, px + 150, 114, "gr", 1)
        if on:
            g.rect(px + 96, 121, 128, 9, "k1", rx=2)
            g.arrow(px + 70, 182, px + 260, 182, "l1", 2.2)
            g.text(px + 160, 200, "채널 생김 → 전류 흐름 (1)", "ink", 12.5, weight=700)
        else:
            g.text(px + 160, 186, "채널 없음 → 전류 X (0)", "ink", 12.5, weight=700)
        g.text(px + 160, 270, "전자가 게이트 아래로 모여 길(채널)이 생긴다" if on else "소스와 드레인 사이가 끊겨 있다", "sub", 12, maxw=320)
    g.text(360, 298, "칩 하나에 이런 스위치가 수십억 개", "mut", 12)
    return g


def dram():
    g = Fig("dram", 720, 300, "DRAM 셀(1T1C)과 리프레시")
    g.line(40, 50, 320, 50, "l5", 2.4)
    g.text(44, 40, "워드라인 (선택)", "ink", 12, anchor="start", weight=600)
    g.line(70, 50, 70, 250, "l1", 2.4)
    g.text(80, 244, "비트라인 (읽기·쓰기)", "ink", 12, anchor="start", weight=600)
    g.rect(130, 96, 96, 44, "f0 s0", rx=8, sw=1.5)
    g.text(178, 123, "트랜지스터", "ink", 12.5, weight=700)
    g.line(178, 50, 178, 96, "ed", 1.6)
    g.line(70, 118, 130, 118, "ed", 1.6)
    g.line(226, 118, 270, 118, "ed", 1.6)
    g.line(270, 118, 270, 150, "ed", 1.6)
    g.rect(240, 150, 60, 7, "k2", rx=2)
    g.rect(240, 166, 60, 7, "k2", rx=2)
    g.line(270, 173, 270, 196, "ed", 1.6)
    for k, w in enumerate((40, 26, 12)):
        g.line(270 - w / 2, 196 + k * 6, 270 + w / 2, 196 + k * 6, "ed", 1.6)
    g.text(310, 166, "커패시터", "ink", 12.5, anchor="start", weight=700)
    g.text(310, 184, ["전하 있음 = 1", "없음 = 0"], "sub", 12, anchor="start")
    # 오른쪽: 전압 감소와 리프레시
    x0, x1, y0, y1 = 420, 690, 220, 70
    g.text(x0, 40, "셀 전압 — 새어 나가고, 다시 채운다", "ink", 13, anchor="start", weight=700)
    g.line(x0, y0, x1, y0, "ax", 1.5)
    thr = y0 - 0.45 * (y0 - y1)
    g.line(x0, thr, x1, thr, "critl", 1.4, dash="5 4")
    g.line(x0, y0 + 46, x0 + 26, y0 + 46, "critl", 1.4, dash="5 4")
    g.text(x0 + 32, y0 + 50, "읽기 기준 — 이 아래로 내려가면 1을 0으로 읽는다", "sub", 11.5, anchor="start")
    pts = []
    period = (x1 - x0) / 3
    for k in range(3):
        for j in range(31):
            t = j / 30
            v = 0.95 * math.exp(-1.2 * t)
            pts.append((x0 + k * period + t * period, y0 - v * (y0 - y1)))
    g.add('<polyline class="l1" stroke-width="2" points="' + " ".join(f"{f(a)},{f(b)}" for a, b in pts) + '"/>')
    for k in (1, 2):
        xx = x0 + k * period
        g.line(xx, y0 - 0.95 * math.exp(-1.2) * (y0 - y1), xx, y0 - 0.95 * (y0 - y1), "l1", 2)
        g.text(xx, y1 - 6, "리프레시", "ink", 11.5, weight=600)
    g.text((x0 + x1) / 2, y0 + 20, "시간 →", "mut", 11.5)
    return g


def fab_cycle():
    g = Fig("fab-cycle", 720, 350, "전공정 — 같은 공정을 수백 번 반복해 층을 쌓는다")
    cx, cy, rx, ry = 360, 178, 210, 118
    steps = [("산화", "절연막"), ("포토", "패턴 새기기"), ("식각", "깎아내기"), ("증착", "막 쌓기"), ("이온주입", "성질 만들기"), ("금속배선", "연결")]
    pos = []
    for i in range(6):
        a = -math.pi / 2 + i * math.pi / 3
        pos.append((cx + rx * math.cos(a), cy + ry * math.sin(a)))
    for i in range(6):
        (xa, ya), (xb, yb) = pos[i], pos[(i + 1) % 6]
        dx, dy = xb - xa, yb - ya
        d = math.hypot(dx, dy)
        g.arrow(xa + dx / d * 62, ya + dy / d * 30, xb - dx / d * 62, yb - dy / d * 30, sw=1.6)
    for (x, y), (t, s) in zip(pos, steps):
        g.box(x - 62, y - 24, 124, 48, t, 1, 14, sub=s)
    g.text(cx, cy - 4, "×수백 회", "ink", 18, weight=700)
    g.text(cx, cy + 20, "한 층씩 회로를 쌓는다", "sub", 12.5)
    g.text(24, 30, "웨이퍼 →", "ink", 13, anchor="start", weight=700)
    g.text(696, 336, "→ EDS 테스트 → 후공정", "ink", 13, anchor="end", weight=700)
    return g


def photo():
    g = Fig("photo", 720, 250, "포토·식각 — 패턴을 옮기는 순서")
    steps = ["① 감광막 도포", "② 노광 (마스크 + 빛)", "③ 현상", "④ 식각", "⑤ 감광막 제거"]
    for i, t in enumerate(steps):
        px = 14 + i * 140
        base = 170
        g.rect(px, base, 128, 30, "m-si", rx=2)
        film = [(px, px + 128)] if i < 3 else [(px, px + 44), (px + 84, px + 128)]
        for a, b in film:
            g.rect(a, base - 16, b - a, 16, "m-ox", rx=1)
        if i <= 1:
            g.rect(px, base - 34, 128, 18, "m-pr", rx=1)
        elif i in (2, 3):
            g.rect(px, base - 34, 44, 18, "m-pr", rx=1)
            g.rect(px + 84, base - 34, 44, 18, "m-pr", rx=1)
        if i == 1:
            g.rect(px, 66, 44, 10, "m-gate", rx=1)
            g.rect(px + 84, 66, 44, 10, "m-gate", rx=1)
            for xx in (px + 54, px + 64, px + 74):
                g.arrow(xx, 40, xx, base - 38, "l4", 1.6)
            g.text(px + 64, 34, "빛", "ink", 11.5, weight=700)
            g.text(px + 126, 62, "마스크", "mut", 11, anchor="end")
        g.text(px + 64, 222, t, "ink", 12, weight=600, maxw=136)
    g.rect(196, 236 - 0, 0, 0, "bg")
    lg = [("m-pr", "감광막"), ("m-ox", "가공할 막"), ("m-si", "웨이퍼")]
    for i, (c, t) in enumerate(lg):
        g.rect(470 + i * 82, 12, 12, 12, c, rx=2)
        g.text(486 + i * 82, 22, t, "sub", 11.5, anchor="start")
    return g


def bump():
    g = Fig("bump", 720, 320, "범프 구조 — 도금 직후와 리플로우 후")
    def stack(cx, reflow):
        g.rect(cx - 110, 250, 220, 30, "m-si", rx=2)
        g.rect(cx - 50, 242, 100, 8, "m-al", rx=1)
        g.rect(cx - 110, 244, 50, 6, "m-ox", rx=1)
        g.rect(cx + 60, 244, 50, 6, "m-ox", rx=1)
        g.rect(cx - 42, 150, 84, 92, "m-cu", rx=1)
        g.rect(cx - 42, 138, 84, 12, "m-ni", rx=1)
        if reflow:
            g.rect(cx - 42, 132, 84, 6, "m-imc", rx=1)
            g.path(f"M{cx - 44},{132} C{cx - 48},{70} {cx + 48},{70} {cx + 44},{132} Z", "m-sn")
        else:
            g.rect(cx - 42, 84, 84, 54, "m-sn", rx=1)
    stack(170, False)
    stack(470, True)
    g.text(170, 34, "도금 직후", "ink", 14, weight=700)
    g.text(470, 34, "리플로우 후", "ink", 14, weight=700)
    g.text(170, 304, "웨이퍼 / 패드", "sub", 12)
    labels = [(104, ["SnAg 솔더", "녹아서 붙는 접합재"]), (144, ["Ni — 확산 방지층"]), (200, ["Cu — 몸통", "(전기·높이)"])]
    for y, t in labels:
        g.line(212, y, 250, y, "ed", 1.2)
        g.text(254, y + 4, t, "ink", 12, anchor="start", weight=600, maxw=150)
    g.line(512, 135, 560, 135, "ed", 1.2)
    g.text(564, 132, ["IMC (금속간화합물)", "접합에 필요하지만", "너무 자라면 취약"], "ink", 12, anchor="start", weight=600)
    g.text(470, 304, "솔더가 둥글게 · 계면에 IMC 생성", "sub", 12)
    return g


def hbm():
    g = Fig("hbm", 720, 360, "HBM 구조 (단면, 개념도)")
    g.rect(40, 286, 640, 30, "m-sub", rx=4)
    g.text(360, 306, "패키지 기판", "ink", 12.5, weight=700)
    g.rect(70, 254, 580, 22, "m-si", rx=3)
    g.text(80, 270, "인터포저 — 수천 개 배선", "ink", 12, anchor="start", weight=600)
    for x in range(80, 650, 18):
        g.circle(x, 281, 3.2, "m-sn")
    g.rect(90, 176, 180, 66, "f0 s0", rx=4, sw=1.5)
    g.text(180, 214, "GPU / 프로세서", "ink", 13.5, weight=700)
    for x in range(100, 270, 14):
        g.circle(x, 248, 2.6, "m-sn")
    g.rect(392, 52, 196, 190, "m-emc", rx=6)
    ys = [216, 188, 160, 132, 104, 76]
    for i, y in enumerate(ys):
        g.rect(406, y, 168, 20, "f1" if i else "f3", rx=2)
        for x in range(416, 574, 16):
            g.circle(x, y + 23.5, 2.2, "m-sn")
    for x in (438, 490, 542):
        g.line(x, 76, x, 236, "m-cu", 1)
        g.line(x, 76, x, 236, "l2", 2.2)
    for x in range(400, 584, 14):
        g.circle(x, 248, 2.6, "m-sn")
    g.label_bg(490, 231, "base die (로직)", 11.5, "ink")
    g.label_bg(490, 119, "core die (DRAM)", 11.5, "ink")
    g.text(490, 34, "× 8~16단", "ink", 13, weight=700)
    labels = [(84, "몰드·언더필", 588), (148, "TSV (관통 전극)", 542), (190, "마이크로범프", 574)]
    for y, t, x in labels:
        g.line(x + 2, y, 612, y, "ed", 1.2)
        g.text(616, y + 4, t, "ink", 11.5, anchor="start", weight=600, maxw=98)
    g.arrow(272, 262, 390, 262, "l1", 2.4)
    g.arrow(390, 268, 272, 268, "l1", 2.4)
    g.text(330, 160, ["넓은 통로", "= 높은 대역폭"], "ink", 13, weight=700)
    g.line(330, 182, 330, 254, "gr", 1, dash="3 3")
    g.text(360, 344, "DRAM을 쌓고 TSV로 꿰어, 프로세서 옆에 붙여 데이터 길을 넓힌다", "sub", 12.5, maxw=680)
    return g


def pkg_evo():
    g = Fig("pkg-evo", 720, 250, "패키징 연결 방식의 발전")
    titles = [("와이어 본딩", "가장자리를 선으로"), ("플립칩", "뒤집어 범프로"), ("TSV 적층", "칩을 꿰어 위로"), ("하이브리드 본딩", "범프 없이 Cu–Cu")]
    for i, (t, s) in enumerate(titles):
        px = 20 + i * 172
        g.rect(px, 14, 160, 168, "pn", rx=10)
        g.text(px + 80, 40, t, "ink", 13.5, weight=700)
        base = 150
        g.rect(px + 14, base, 132, 14, "m-sub", rx=2)
        if i == 0:
            g.rect(px + 44, base - 24, 72, 24, "m-si", rx=2)
            for side in (-1, 1):
                x_chip = px + 80 + side * 32
                x_sub = px + 80 + side * 58
                g.path(f"M{x_chip},{base - 24} C{x_chip},{base - 52} {x_sub},{base - 40} {x_sub},{base}", "l4", sw=1.6)
        elif i == 1:
            g.rect(px + 34, base - 32, 92, 24, "m-si", rx=2)
            for x in range(px + 42, px + 126, 12):
                g.circle(x, base - 4, 4, "m-sn")
        elif i == 2:
            for k in range(3):
                y = base - 26 - k * 26
                g.rect(px + 44, y, 72, 18, "m-si", rx=2)
                for x in range(px + 50, px + 116, 12):
                    g.circle(x, y + 22, 2.5, "m-sn")
            for x in (px + 64, px + 96):
                g.line(x, base - 78, x, base - 8, "l2", 2)
        else:
            g.rect(px + 44, base - 44, 72, 22, "m-si", rx=2)
            g.rect(px + 44, base - 22, 72, 20, "m-si", rx=2)
            for x in range(px + 50, px + 116, 10):
                g.rect(x, base - 25, 6, 6, "m-cu", rx=1)
        g.text(px + 80, 176, s, "sub", 12)
    g.arrow(40, 212, 680, 212, sw=1.8)
    g.text(40, 236, "연결 밀도·속도 낮음", "mut", 11.5, anchor="start")
    g.text(680, 236, "높음 (차세대)", "mut", 11.5, anchor="end")
    return g


def yield_curve():
    g = Fig("yield", 720, 320, "단계별 수율이 쌓이면 — 누적 수율")
    x0, x1, y0, y1 = 70, 560, 250, 60
    sx = lambda n: x0 + n / 200 * (x1 - x0)
    sy = lambda v: y0 - v / 100 * (y0 - y1)
    for v in (0, 25, 50, 75, 100):
        g.line(x0, sy(v), x1, sy(v), "gr" if v else "ax", 1 if v else 1.5)
        g.text(x0 - 8, sy(v) + 4, f"{v}%", "mut", 11.5, anchor="end")
    for n in (0, 50, 100, 150, 200):
        g.text(sx(n), y0 + 18, f"{n}", "mut", 11.5)
    g.text((x0 + x1) / 2, y0 + 40, "공정 단계 수", "sub", 12)
    series = [(99.9, "1", "단계별 99.9%"), (99.5, "2", "단계별 99.5%"), (99.0, "3", "단계별 99%")]
    short = {99.9: "99.9%", 99.5: "99.5%", 99.0: "99%"}
    for p, c, lab in series:
        pts = " ".join(f"{f(sx(n))},{f(sy(100 * (p / 100) ** n))}" for n in range(0, 201, 4))
        g.add(f'<polyline class="l{c}" stroke-width="2" points="{pts}"/>')
        yv = 100 * (p / 100) ** 200
        g.circle(sx(200), sy(yv), 4.5, f"k{c} ring", sw=2)
        g.text(sx(200) + 10, sy(yv) + 4, f"{short[p]} → {yv:.0f}%", "ink", 12, anchor="start", weight=600)
    yv = 100 * 0.99 ** 100
    g.circle(sx(100), sy(yv), 6, "k3 ring", sw=2)
    g.text(sx(100) - 12, sy(yv) + 22, f"99% × 100단계 ≈ {yv:.1f}%", "ink", 12.5, anchor="end", weight=700)
    for i, (p, c, lab) in enumerate(series):
        g.rect(70 + i * 130, 22, 18, 3, f"k{c}", rx=1)
        g.text(94 + i * 130, 28, lab, "sub", 12, anchor="start")
    return g


FIGS = [conductivity, mosfet, dram, fab_cycle, photo, bump, hbm, pkg_evo, yield_curve]
