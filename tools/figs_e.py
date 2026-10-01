"""01 엔지니어의 마인드 — 열 가지 원칙별 그림 (원칙 1은 figs_a.fact_interp)."""
import math
from figlib import Fig, f


def p2_units():
    g = Fig("p2-units", 720, 250, "단위와 자릿수 — 크기 감각으로 계산을 먼저 검사한다")
    x0, x1, y = 40, 680, 120
    lo, hi = -9, 0  # 1 nm ~ 1 m (log10 m)
    sx = lambda e: x0 + (e - lo) / (hi - lo) * (x1 - x0)
    g.line(x0, y, x1, y, "ax", 2)
    for e, lab in ((-9, "1 nm"), (-6, "1 µm"), (-3, "1 mm"), (0, "1 m")):
        g.line(sx(e), y - 6, sx(e), y + 6, "ax", 2)
        g.text(sx(e), y + 24, lab, "ink", 12.5, weight=700)
    for e in range(lo, hi):
        for k in (2, 5):
            g.line(sx(e + math.log10(k)), y - 3, sx(e + math.log10(k)), y + 3, "ax", 1)
    things = [(-8.0, "게이트 길이", "수십 nm", -1), (-5.0, "범프 높이", "수십 µm", -1), (-4.15, "머리카락", "약 70 µm", 1),
              (-3.11, "웨이퍼 두께", "약 0.8 mm", -1), (-0.52, "웨이퍼 지름", "300 mm", -1)]
    for e, t, v, side in things:
        yy = y - 18 if side < 0 else y + 44
        g.circle(sx(e), y, 5, "k1 ring", sw=2)
        g.line(sx(e), y - 6 if side < 0 else y + 6, sx(e), yy + (6 if side < 0 else -12), "gr", 1)
        g.text(sx(e), yy - 14 if side < 0 else yy + 4, t, "ink", 12, weight=600)
        g.text(sx(e), yy if side < 0 else yy + 20, v, "sub", 11.5)
    g.circle(sx(-2.52), y, 7, "crit ring", sw=2)
    g.text(sx(-2.52), y + 46, ["✗ 범프 높이 계산 결과 3 mm?", "µm를 mm로 착각 → 1000배 차이"], "ink", 12, weight=700)
    g.text(20, 28, "공식을 다시 보기 전에: 단위가 맞는가, 자릿수가 상식적인가", "sub", 12.5, anchor="start")
    return g


def p3_repro():
    g = Fig("p3-repro", 720, 300, "재현되지 않으면 아직 모르는 것이다 — 조건을 맞춘 비교")
    def panel(px, title, mark, conds, groups):
        g.rect(px, 14, 330, 272, "pn", rx=10)
        g.text(px + 165, 40, f"{mark} {title}", "ink", 14, weight=700)
        for i, (lab, c) in enumerate(conds):
            g.text(px + 90 + i * 150, 66, lab, "ink", 12.5, weight=700)
            g.text(px + 90 + i * 150, 84, c, "sub", 11.5, maxw=140)
        base, top = 250, 150
        g.line(px + 20, base, px + 310, base, "ax", 1.5)
        for gi, (vals, cls) in enumerate(groups):
            cx = px + 90 + gi * 150
            for j, v in enumerate(vals):
                g.circle(cx - 24 + j * 12, base - v * (base - top), 5, f"{cls} ring", sw=2)
        g.text(px + 165, 270 + 0, "불량률 (높을수록 나쁨)", "mut", 11)
    panel(14, "조건이 다른 비교", "✗", [("개선 전", "장비 A · 약품 lot 1 · 월"), ("개선 후", "장비 B · 약품 lot 2 · 목")],
          [([0.62], "k0"), ([0.35], "k1")])
    panel(376, "조건을 맞춘 비교", "✓", [("개선 전", "같은 장비·lot·계측"), ("개선 후", "웨이퍼를 나눠 동시에")],
          [([0.6, 0.66, 0.57, 0.63, 0.61], "k0"), ([0.33, 0.37, 0.3, 0.35, 0.34], "k1")])
    g.text(179, 116, ["좋아진 이유가", "개선 때문인지 모른다"], "ink", 12, weight=600)
    g.text(541, 116, ["5번 반복해도 같은 차이", "→ 개선 효과로 판단"], "ink", 12, weight=600)
    return g


def p4_change():
    g = Fig("p4-change", 720, 300, "변화점 먼저 — 결과가 바뀐 시점과 바뀐 것을 나란히 놓는다")
    x0, x1 = 70, 690
    n = 20
    sx = lambda d: x0 + (d + 0.5) * (x1 - x0) / n
    base, top = 180, 40
    vals = [10.02, 9.98, 10.05, 10.0, 9.97, 10.03, 10.01, 9.99, 10.02, 9.71, 9.68, 9.74, 9.7, 9.66, 9.72, 9.69, 9.73, 9.7, 9.67, 9.71]
    sy = lambda v: base - (v - 9.5) / 0.7 * (base - top)
    for v in (9.6, 9.8, 10.0, 10.2):
        g.line(x0, sy(v), x1, sy(v), "gr", 1)
        g.text(x0 - 8, sy(v) + 4, f"{v:.1f}", "mut", 11.5, anchor="end")
    g.text(x0, 26, "도금 두께 평균 (µm)", "sub", 12, anchor="start")
    g.add('<polyline class="l1" stroke-width="2" points="' + " ".join(f"{f(sx(i))},{f(sy(v))}" for i, v in enumerate(vals)) + '"/>')
    for i, v in enumerate(vals):
        g.circle(sx(i), sy(v), 4, "k1 ring", sw=2)
    g.line(sx(8.5), top - 6, sx(8.5), 262, "critl", 1.5, dash="5 4")
    g.text(sx(8.5) + 8, top + 4, "여기서 바뀌었다", "ink", 12, anchor="start", weight=700)
    # 사건 레인
    g.rect(x0, 208, x1 - x0, 54, "pn", rx=8)
    g.text(x0 - 8, 240, "변경 이력", "sub", 11.5, anchor="end")
    events = [(2, "PM", 0), (8.6, "약품 lot 교체", 2), (13, "작업자 교대", 0)]
    for d, t, tone in events:
        g.pill(sx(d), 242, t, tone, anchor="middle")
    g.text(360, 290, "→ 바뀐 시점과 겹치는 변경은 약품 lot 교체 — 먼저 확인할 후보", "ink", 12.5, weight=600)
    return g


def p5_falsifiable():
    g = Fig("p5-falsifiable", 720, 300, "반증할 수 있는 가설 — 틀릴 수 있어야 검증할 수 있다")
    g.rect(14, 14, 250, 272, "pn", rx=10)
    g.text(139, 42, "✗ 쓸모없는 가설", "ink", 14, weight=700)
    g.box(30, 62, 218, 70, ["“여러 요인이", "복합적으로 작용했다”"], 0, 13.5)
    g.text(139, 168, ["어떤 결과가 나와도", "“맞다”고 할 수 있다", "→ 아무것도 검증하지 못한다"], "sub", 12.5, lh=1.5)
    g.rect(278, 14, 428, 272, "pn", rx=10)
    g.text(492, 42, "✓ 좋은 가설 — 예측을 품고 있다", "ink", 14, weight=700)
    g.box(294, 58, 396, 56, ["Ni 두께가 원인이라면", "→ Ni가 얇은 site일수록 찢어짐이 많아야 한다"], 1, 13)
    x0, x1, y0, y1 = 340, 560, 260, 140
    g.line(x0, y0, x1, y0, "ax", 1.5)
    g.line(x0, y0, x0, y1, "ax", 1.5)
    g.text((x0 + x1) / 2, y0 + 18 - 0, "Ni 두께 (얇음 → 두꺼움)", "mut", 11)
    g.text(x0 - 6, y1 + 6, "찢어짐", "mut", 11, anchor="end")
    pts = [(0.1, 0.85), (0.2, 0.7), (0.3, 0.72), (0.45, 0.5), (0.55, 0.42), (0.7, 0.3), (0.82, 0.22), (0.92, 0.15)]
    for a, b in pts:
        g.circle(x0 + a * (x1 - x0), y0 - b * (y0 - y1), 4.5, "k1 ring", sw=2)
    g.line(x0 + 10, y0 - 0.9 * (y0 - y1), x1 - 10, y0 - 0.12 * (y0 - y1), "l1", 1.4, dash="4 3")
    g.text(574, 168, ["관측이 예측과 같다", "→ 다음 검증으로"], "ink", 12, anchor="start", weight=600)
    g.text(574, 222, ["관측이 다르다", "→ 가설을 버린다"], "sub", 12, anchor="start")
    return g


def p6_sampling():
    g = Fig("p6-sampling", 720, 300, "데이터의 출처를 의심하라 — 어디를 쟀는가")
    def wafer(cx, cy, r):
        g.circle(cx, cy, r, "f0 s0", sw=1.5)
        g.path(f"M{cx - 10},{cy + r - 1} L{cx},{cy + r - 8} L{cx + 10},{cy + r - 1}", "bg")
    g.text(180, 34, "✗ 중심 1점만 측정", "ink", 14, weight=700)
    wafer(180, 150, 100)
    g.circle(180, 150, 7, "k1 ring", sw=2)
    g.text(180, 178, "10.1", "ink", 12.5, weight=700)
    g.text(180, 276, "평균 10.1 µm — “문제없음”", "sub", 12.5)
    g.text(540, 34, "✓ 13점 측정", "ink", 14, weight=700)
    wafer(540, 150, 100)
    pts = [(0, 0, 10.1), (0, -45, 10.0), (45, 0, 10.0), (0, 45, 10.1), (-45, 0, 10.0),
           (0, -84, 9.3), (60, -60, 9.4), (84, 0, 9.2), (60, 60, 9.4), (0, 84, 9.3), (-60, 60, 9.5), (-84, 0, 9.3), (-60, -60, 9.4)]
    for dx, dy, v in pts:
        cls = "crit" if v < 9.6 else "k1"
        g.circle(540 + dx, 150 + dy, 6, f"{cls} ring", sw=2)
        g.text(540 + dx, 150 + dy + (17 if dy >= 0 else -10), f"{v}", "ink", 10.5, weight=600)
    g.text(540, 276, "평균 9.6 µm — 가장자리가 얇다", "ink", 12.5, weight=700)
    g.circle(626, 30, 5, "crit ring", sw=2)
    g.text(636, 34, "9.6 µm 미만", "sub", 11, anchor="start")
    return g


def p7_correct():
    g = Fig("p7-correct", 720, 290, "틀렸으면 빨리, 명확하게 정정한다")
    g.rect(20, 16, 420, 258, "pn", rx=10)
    g.rect(20, 16, 420, 40, "f1", rx=10)
    g.rect(20, 46, 420, 10, "f1", rx=0)
    g.text(36, 42, "제목: [정정] 범프 높이 산포 분석 rev.2", "ink", 13, anchor="start", weight=700)
    rows = [("①", "원래 무엇이라고 했는가", "“분리 한계는 2.23 µm”"), ("②", "무엇이, 왜 틀렸는가", "IMC 가정에 따라 값이 달라지는데 한 값으로 단정"),
            ("③", "결론이 바뀌는가", "대책 방향은 같음, 한계는 범위로 표시")]
    for i, (n, k, v) in enumerate(rows):
        y = 84 + i * 62
        g.circle(46, y + 6, 13, "f2 s2", sw=1.4)
        g.text(46, y + 11, n, "ink", 13, weight=700)
        g.text(68, y + 4, k, "ink", 13, anchor="start", weight=700)
        g.text(68, y + 24, v, "sub", 12, anchor="start", maxw=360)
    g.text(36, 264, "→ 첨부를 이 파일로 교체해 주십시오", "mut", 12, anchor="start")
    g.text(580, 44, "신뢰는 어떻게 바뀌나", "ink", 13.5, weight=700)
    g.box(470, 66, 220, 62, "발견 당일 정정", 3, 14, sub="“이 사람 자료는 검증된다”")
    g.box(470, 152, 220, 62, "숨겼다가 남이 발견", 2, 14, sub="“이 사람 자료는 다시 봐야 한다”")
    g.text(580, 248, ["정정은 신뢰를 잃는 일이 아니라", "쌓는 일이다"], "sub", 12.5)
    return g


def p8_tradeoff():
    g = Fig("p8-tradeoff", 720, 300, "트레이드오프를 숨기지 마라 — 전류밀도의 대가")
    charts = [("불량률 (낮을수록 좋음)", lambda x: 0.12 + 0.75 * (x / 10) ** 2.4), ("생산성 UPH (높을수록 좋음)", lambda x: 0.12 + 0.78 * x / 10)]
    for i, (t, fn) in enumerate(charts):
        px = 30 + i * 350
        x0, x1, y0, y1 = px + 30, px + 310, 240, 60
        g.text(px + 30, 38, t, "ink", 13.5, anchor="start", weight=700)
        sx = lambda v, x0=x0, x1=x1: x0 + v / 10 * (x1 - x0)
        g.rect(sx(4), y1, sx(6.5) - sx(4), y0 - y1, "f3", rx=0)
        for k in range(1, 5):
            g.line(x0, y0 - k * (y0 - y1) / 4, x1, y0 - k * (y0 - y1) / 4, "gr", 1)
        g.line(x0, y0, x1, y0, "ax", 1.5)
        pts = " ".join(f"{f(sx(v / 4))},{f(y0 - fn(v / 4) * (y0 - y1))}" for v in range(0, 41))
        g.add(f'<polyline class="l{1 + i}" stroke-width="2" points="{pts}"/>')
        g.text((x0 + x1) / 2, y0 + 20, "전류밀도 (낮음 → 높음)", "mut", 11.5)
        g.text(sx(5.25), y1 + 16, "운전 창", "ink", 12, weight=700)
    g.text(360, 290, "보고할 때는 “품질 +, 생산성 −약 20%” 처럼 대가를 숫자로 함께 적는다", "sub", 12.5, maxw=690)
    return g


def p9_safety():
    g = Fig("p9-safety", 720, 260, "안전은 협상 대상이 아니다")
    g.rect(20, 14, 680, 40, "f2 s2", rx=10, sw=1.5)
    g.text(360, 40, "일정이 급해도 아래 네 가지는 생략하지 않는다", "ink", 14.5, weight=700)
    cards = [("보호구", "보안경·장갑·앞치마", "ppe"), ("LOTO", "잠금·표지 후 작업", "lock"), ("MSDS 확인", "약품의 위험과 조치", "doc"), ("작업 허가·2인", "위험 작업은 혼자 않기", "two")]
    for i, (t, s, ic) in enumerate(cards):
        x = 20 + i * 172
        g.rect(x, 70, 160, 176, "pn", rx=10)
        cx, cy = x + 80, 128
        if ic == "ppe":
            g.rect(cx - 34, cy - 12, 30, 22, "f1 s1", rx=10, sw=2)
            g.rect(cx + 4, cy - 12, 30, 22, "f1 s1", rx=10, sw=2)
            g.line(cx - 4, cy - 2, cx + 4, cy - 2, "l1", 2.5)
        elif ic == "lock":
            g.path(f"M{cx - 16},{cy - 6} L{cx - 16},{cy - 18} A16,16 0 0 1 {cx + 16},{cy - 18} L{cx + 16},{cy - 6}", "l2", sw=4)
            g.rect(cx - 24, cy - 8, 48, 36, "f2 s2", rx=6, sw=2)
            g.circle(cx, cy + 8, 4, "k2")
        elif ic == "doc":
            g.rect(cx - 22, cy - 28, 44, 56, "f4 s4", rx=4, sw=2)
            for k in range(4):
                g.line(cx - 12, cy - 14 + k * 10, cx + 12, cy - 14 + k * 10, "l4", 2)
        else:
            for dx in (-16, 16):
                g.circle(cx + dx, cy - 14, 9, "f3 s3", sw=2)
                g.path(f"M{cx + dx - 16},{cy + 22} Q{cx + dx},{cy - 6} {cx + dx + 16},{cy + 22} Z", "f3 s3", sw=2)
        g.text(cx, 190, t, "ink", 14, weight=700)
        g.text(cx, 212, s, "sub", 11.5, maxw=150)
    return g


def p10_record():
    g = Fig("p10-record", 720, 290, "기록이 곧 실력이다 — 같은 문제를 다시 만났을 때")
    x0, x1, y0, y1 = 80, 560, 240, 50
    n = 5
    sx = lambda i: x0 + 20 + i * (x1 - x0 - 40) / (n - 1)
    sy = lambda hrs: y0 - hrs / 20 * (y0 - y1)
    for hrs in (0, 5, 10, 15, 20):
        g.line(x0, sy(hrs), x1, sy(hrs), "gr" if hrs else "ax", 1 if hrs else 1.5)
        g.text(x0 - 8, sy(hrs) + 4, f"{hrs}", "mut", 11.5, anchor="end")
    g.text(x0, 30, "해결에 걸린 시간 (시간)", "sub", 12, anchor="start")
    for i in range(n):
        g.text(sx(i), y0 + 20, f"{i + 1}번째", "mut", 11.5)
    series = [([16, 15, 16, 14, 15], "2", "매번 처음부터"), ([16, 6, 3, 2, 2], "1", "점점 빨라짐")]
    for vals, c, lab in series:
        pts = " ".join(f"{f(sx(i))},{f(sy(v))}" for i, v in enumerate(vals))
        g.add(f'<polyline class="l{c}" stroke-width="2" points="{pts}"/>')
        for i, v in enumerate(vals):
            g.circle(sx(i), sy(v), 4.5, f"k{c} ring", sw=2)
        g.text(sx(n - 1) + 12, sy(vals[-1]) + 4, lab, "ink", 12, anchor="start", weight=600, maxw=150)
    for i, (vals, c, lab) in enumerate(series):
        g.rect(300 + i * 170, 24, 18, 3, f"k{c}", rx=1)
    g.text(322, 30, "기록 없음", "sub", 11.5, anchor="start")
    g.text(492, 30, "알고리즘으로 기록함", "sub", 11.5, anchor="start")
    g.text(360, 282, "같은 문제를 다시 만난 순서 → (예시)", "mut", 11.5)
    return g


FIGS = [p2_units, p3_repro, p4_change, p5_falsifiable, p6_sampling, p7_correct, p8_tradeoff, p9_safety, p10_record]
