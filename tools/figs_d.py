"""05 제조기술의 기초 · 06 업무 알고리즘 작성법 그림."""
import math
from figlib import Fig, f


def m4e1():
    g = Fig("4m1e", 720, 310, "4M1E — 공정 결과를 바꾸는 다섯 가지 근원")
    cx, cy = 360, 160
    g.circle(cx, cy, 62, "f2 s2", sw=1.8)
    g.text(cx, cy - 6, "공정 결과", "ink", 14.5, weight=700)
    g.text(cx, cy + 15, "두께·조성·불량", "sub", 12)
    nodes = [("Man 사람", "교대·신규 인원", -90), ("Machine 설비", "PM·부품 교체", -18), ("Material 자재", "약품·소모품 lot", 54),
             ("Method 방법", "레시피·측정법", 126), ("Environment 환경", "온습도·순수·배기", 198)]
    for t, s, a in nodes:
        r = math.radians(a)
        x, y = cx + 250 * math.cos(r), cy + 112 * math.sin(r)
        g.line(cx + 64 * math.cos(r), cy + 64 * math.sin(r), x - 70 * math.cos(r) * 0.9, y - 26 * math.sin(r), "ed", 1.5)
        g.box(x - 80, y - 25, 160, 50, t, 1, 13.5, sub=s)
    g.text(24, 296, "이상이 생기면 다섯 가지의 변경 이력을 먼저 본다 — 변경은 반드시 기록한다", "sub", 12.5, anchor="start", maxw=680)
    return g


def spc_fdc():
    g = Fig("spc-fdc", 720, 300, "FDC는 빨리 잡고, SPC는 품질 영향을 확인한다")
    x0, x1 = 160, 690
    n = 20
    sx = lambda i: x0 + (i + 0.5) * (x1 - x0) / n
    # FDC 레인
    g.rect(20, 30, 680, 104, "pn", rx=10)
    g.text(34, 58, "FDC", "ink", 14, anchor="start", weight=700)
    g.text(34, 78, ["설비 센서", "공정 중 · 웨이퍼마다"], "sub", 11.5, anchor="start")
    base = 92
    pts = []
    for i in range(n * 6 + 1):
        t = i / 6
        v = 10 * math.sin(t * 2.1) * 0.5 + 4 * math.sin(t * 7.3)
        if 6.2 < t < 6.9:
            v += 34
        pts.append((x0 + t * (x1 - x0) / n, base - v * 0.9))
    g.add('<polyline class="l1" stroke-width="2" points="' + " ".join(f"{f(a)},{f(b)}" for a, b in pts) + '"/>')
    g.line(x0, base - 24, x1, base - 24, "critl", 1.2, dash="4 3")
    g.circle(x0 + 6.55 * (x1 - x0) / n, base - 34, 9, "critl", sw=1.6)
    g.text(x0 + 6.55 * (x1 - x0) / n + 14, base - 38, "7번 웨이퍼에서 바로 감지", "ink", 12, anchor="start", weight=700)
    # SPC 레인
    g.rect(20, 148, 680, 104, "pn", rx=10)
    g.text(34, 176, "SPC", "ink", 14, anchor="start", weight=700)
    g.text(34, 196, ["계측 결과", "공정 후 · 샘플링"], "sub", 11.5, anchor="start")
    cl = 206
    g.line(x0, cl - 28, x1, cl - 28, "ax", 1.2, dash="4 3")
    g.line(x0, cl, x1, cl, "gr", 1)
    vals = {2: 4, 12: 8, 17: -3}
    for i, v in vals.items():
        g.circle(sx(i), cl - v, 5, "k1 ring", sw=2)
    g.circle(sx(7), cl - 36, 5, "crit ring", sw=2)
    g.text(sx(7) + 10, cl - 40, "lot 계측에서 품질 영향 확인", "ink", 12, anchor="start", weight=700)
    g.line(x0, 266, x1, 266, "ax", 1.2)
    for i in range(0, n, 5):
        g.text(sx(i), 284, f"{i + 1}", "mut", 11.5)
    g.text(x1, 284, "웨이퍼 순서 →", "mut", 11.5, anchor="end")
    return g


def r2r():
    g = Fig("r2r", 720, 290, "Run-to-Run 보정 — 보정이 계속 커지면 근본 원인을 찾는다")
    boxes = [(30, 40, "공정", 1), (190, 40, "계측", 1), (190, 160, "컨트롤러", 4), (30, 160, "다음 lot 레시피", 3)]
    for x, y, t, tone in boxes:
        g.box(x, y, 130, 48, t, tone, 13.5)
    g.arrow(160, 64, 188, 64)
    g.arrow(255, 88, 255, 158)
    g.arrow(190, 184, 162, 184)
    g.arrow(95, 160, 95, 90)
    g.text(262, 128, "오차", "sub", 12, anchor="start")
    g.text(110, 128, "보정", "sub", 12, anchor="end")
    g.text(160, 240, "이전 결과로 다음 lot 조건을 조금씩 고친다", "sub", 12)
    # 오른쪽 차트
    x0, x1, y0, y1 = 400, 690, 230, 60
    g.text(x0, 36, "lot별 보정량 (도금 시간 +%)", "ink", 13, anchor="start", weight=700)
    g.rect(x0, y1, x1 - x0, 50, "critw", rx=0)
    g.text(x0 + 8, y1 + 18, "점검 기준 초과", "ink", 11.5, anchor="start", weight=700)
    g.line(x0, y0, x1, y0, "ax", 1.5)
    vals = [0.3, 0.2, 0.5, 0.4, 0.7, 0.9, 0.8, 1.2, 1.4, 1.5, 1.9, 2.2, 2.4, 2.9]
    sx = lambda i: x0 + 12 + i * (x1 - x0 - 24) / (len(vals) - 1)
    sy = lambda v: y0 - v / 3.2 * (y0 - y1)
    g.add('<polyline class="l1" stroke-width="2" points="' + " ".join(f"{f(sx(i))},{f(sy(v))}" for i, v in enumerate(vals)) + '"/>')
    for i, v in enumerate(vals):
        g.circle(sx(i), sy(v), 4, "k1 ring", sw=2)
    g.text(x0, y0 + 18, "lot 1", "mut", 11.5, anchor="start")
    g.text(x1, y0 + 18, "lot 14", "mut", 11.5, anchor="end")
    g.text((x0 + x1) / 2, y0 + 44, "→ 장비 열화 · 약품 소모 · 소모품 수명을 점검", "ink", 12.5, weight=600)
    return g


def eight_d():
    g = Fig("8d", 720, 190, "8D 문제 해결 순서")
    steps = [("D1", "팀 구성"), ("D2", "문제 기술"), ("D3", "임시 조치"), ("D4", "근본 원인"), ("D5", "대책 선정"),
             ("D6", "실행·확인"), ("D7", "재발 방지"), ("D8", "종결")]
    w = 84
    for i, (d, t) in enumerate(steps):
        x = 16 + i * 86
        hi = d in ("D3", "D4")
        cls = "f2 s2" if hi else "f1 s1"
        pts = [(x, 30), (x + w - 14, 30), (x + w, 60), (x + w - 14, 90), (x, 90), (x + 14, 60)] if i else \
              [(x, 30), (x + w - 14, 30), (x + w, 60), (x + w - 14, 90), (x, 90)]
        g.poly(pts, cls, sw=1.5)
        g.text(x + w / 2 + 2, 56, d, "ink", 14, weight=700)
        g.text(x + w / 2 + 2, 76, t, "sub", 11.5)
    g.text(16, 124, "D3 임시 조치: 고객을 먼저 보호 (봉쇄·선별)", "ink", 12.5, anchor="start", weight=600)
    g.text(16, 148, "D4 근본 원인: 왜 생겼나(발생 원인) + 왜 못 잡았나(유출 원인)를 모두 찾는다", "ink", 12.5, anchor="start", weight=600, maxw=690)
    g.text(16, 174, "D7 재발 방지: 표준화하고 유사 공정·장비에도 적용한다", "sub", 12.5, anchor="start")
    return g


def cost():
    g = Fig("cost-1-10-100", 720, 230, "발견이 늦을수록 비용이 커진다 (1:10:100)")
    rows = [("공정 안에서 발견", 1), ("출하 검사에서 발견", 10), ("고객 현장에서 발견", 100)]
    x0, wmax = 190, 300
    for i, (t, v) in enumerate(rows):
        y = 40 + i * 52
        g.text(x0 - 12, y + 20, t, "ink", 13, anchor="end", weight=600)
        w = max(5, v / 100 * wmax)
        g.rect(x0, y + 4, w, 24, "k1", rx=4)
        g.text(x0 + w + 8, y + 21, f"{v}" + (" 이상 (리콜·신뢰 손실)" if v == 100 else ""), "ink", 13, anchor="start", weight=700, maxw=280)
    g.line(x0, 30, x0, 200, "ax", 1.5)
    g.text(360, 216, "앞 공정에서 잡는 것이 언제나 가장 싸다 (상대 비용, 경험칙)", "sub", 12.5)
    return g


def oee():
    g = Fig("oee", 720, 300, "OEE — 가동률 × 성능률 × 양품률")
    x0, y0, y1 = 70, 240, 76
    sy = lambda v: y0 - v / 100 * (y0 - y1)
    for v in (0, 25, 50, 75, 100):
        g.line(x0, sy(v), 690, sy(v), "gr" if v else "ax", 1 if v else 1.5)
        g.text(x0 - 8, sy(v) + 4, f"{v}", "mut", 11.5, anchor="end")
    bars = [("계획 가동 시간", 0, 100, "k0", "100"), ("가동 손실", 85, 100, "k2", "−15 (고장·PM·대기)"),
            ("성능 손실", 76.5, 85, "k2", "−8.5 (속도 저하)"), ("품질 손실", 75.0, 76.5, "k2", "−1.5 (불량)"), ("OEE", 0, 75.0, "k1", "75")]
    bw = 90
    for i, (t, lo, hi, cls, lab) in enumerate(bars):
        x = 100 + i * 122
        g.rect(x, sy(hi), bw, max(2, sy(lo) - sy(hi)), cls, rx=4)
        g.text(x + bw / 2, sy(hi) - 8, lab.split(" ")[0], "ink", 13, weight=700)
        g.text(x + bw / 2, y0 + 18, t, "sub", 12)
        if " " in lab:
            g.text(x + bw / 2, y0 + 36, lab.split(" ", 1)[1], "mut", 11)
        if 0 < i < 4:
            g.line(x - 32, sy(hi), x, sy(hi), "gr", 1, dash="3 3")
    g.text(24, 26, "예: 가동률 85% × 성능률 90% × 양품률 98% ≈ 75%", "ink", 13, anchor="start", weight=600)
    return g


def ecd_seq():
    g = Fig("ecd-seq", 720, 380, "웨이퍼 레벨 범프 도금 순서 (단면)")
    steps = ["① 시드층", "② 감광막 패턴", "③ Cu 도금", "④ Ni 도금", "⑤ SnAg 도금", "⑥ 감광막 제거", "⑦ 시드 식각", "⑧ 리플로우"]
    for i, t in enumerate(steps):
        c, r = i % 4, i // 4
        px, py = 18 + c * 174, 18 + r * 176
        g.rect(px, py, 162, 160, "pn", rx=10)
        base = py + 126
        cx = px + 81
        g.rect(px + 10, base, 142, 16, "m-si", rx=2)
        if i < 7:
            seed_w = (142, 0) if i < 6 else (40, 51)
            if i < 6:
                g.rect(px + 10, base - 4, 142, 4, "m-cu", rx=1)
            else:
                g.rect(cx - 20, base - 4, 40, 4, "m-cu", rx=1)
        else:
            g.rect(cx - 20, base - 4, 40, 4, "m-cu", rx=1)
        if 1 <= i <= 4:
            g.rect(px + 10, base - 84, 51, 80, "m-pr", rx=1)
            g.rect(cx + 20, base - 84, 51, 80, "m-pr", rx=1)
        h_cu = 40 if i >= 2 else 0
        if h_cu:
            g.rect(cx - 20, base - 4 - h_cu, 40, h_cu, "m-cu", rx=1)
        if i >= 3:
            g.rect(cx - 20, base - 52, 40, 8, "m-ni", rx=1)
        if 4 <= i <= 6:
            g.rect(cx - 20, base - 78, 40, 26, "m-sn", rx=1)
        if i == 7:
            g.rect(cx - 20, base - 55, 40, 3, "m-imc", rx=1)
            g.path(f"M{cx - 21},{base - 54} C{cx - 24},{base - 92} {cx + 24},{base - 92} {cx + 21},{base - 54} Z", "m-sn")
        g.text(cx, py + 26, t, "ink", 13, weight=700)
    lg = [("m-si", "웨이퍼"), ("m-pr", "감광막"), ("m-cu", "Cu·시드"), ("m-ni", "Ni"), ("m-sn", "SnAg"), ("m-imc", "IMC")]
    for i, (c, t) in enumerate(lg):
        g.rect(90 + i * 96, 362, 12, 12, c, rx=2)
        g.text(106 + i * 96, 372, t, "sub", 11.5, anchor="start")
    return g


def bath():
    g = Fig("bath", 720, 300, "도금액 농도 관리 — 소모와 보충의 반복")
    x0, x1, y0, y1 = 70, 690, 240, 50
    sy = lambda v: y0 - (v - 30) / 45 * (y0 - y1)
    g.rect(x0, sy(70), x1 - x0, sy(45) - sy(70), "f3", rx=0)
    g.text(x1 - 6, sy(45) - 6, "관리 범위", "ink", 11.5, anchor="end", weight=700)
    g.line(x0, y0, x1, y0, "ax", 1.5)
    g.text(x0 - 8, sy(70) + 4, "상한", "mut", 11.5, anchor="end")
    g.text(x0 - 8, sy(45) + 4, "하한", "mut", 11.5, anchor="end")
    pts, doses, late = [], [], None
    v, x = 66.0, x0
    step = (x1 - x0) / 120
    for i in range(121):
        t = i
        dose_at = {20, 40, 60, 95, 112}
        if t in dose_at:
            pts.append((x0 + t * step, sy(v)))
            doses.append((x0 + t * step, sy(v)))
            v = 67
        pts.append((x0 + t * step, sy(v)))
        v -= 0.42 if not (60 < t < 95) else 0.78
        if 60 < t < 95 and v < 45 and late is None:
            late = (x0 + t * step, sy(v))
    g.add('<polyline class="l1" stroke-width="2" points="' + " ".join(f"{f(a)},{f(b)}" for a, b in pts) + '"/>')
    for x, y in doses:
        g.arrow(x, y + 30, x, y + 6, "l3", 1.6)
    g.text(doses[0][0], doses[0][1] + 46, "보충", "ink", 11.5, weight=700)
    for t in range(10, 120, 15):
        g.circle(x0 + t * step, y0 - 8, 3.5, "k0")
    g.text(x1, y0 + 18, "● 정기 분석 시점", "mut", 11.5, anchor="end")
    if late:
        g.circle(late[0] + 20, late[1] + 8, 11, "critl", sw=1.6)
        g.text(late[0] + 2, late[1] + 30, "보충이 늦어 하한 이탈", "ink", 12, anchor="end", weight=700)
    g.text(24, 30, "금속은 쓰는 만큼 줄고, 첨가제는 분해되고, 부산물은 쌓인다 → 분석 · 보충 · 이력 관리", "sub", 12.5, anchor="start", maxw=680)
    g.text((x0 + x1) / 2, y0 + 40, "시간 →", "mut", 11.5)
    return g


def shapes():
    g = Fig("shapes", 720, 200, "업무 알고리즘 맵의 도형")
    items = [("start", "시작 · 끝", "업무의 계기와 마침"), ("process", "단계", "사람이 하는 작업 하나"),
             ("decision", "판단", "예/아니오로 답하는 질문"), ("io", "자료", "확인하거나 남기는 데이터")]
    for i, (k, t, s) in enumerate(items):
        cx = 96 + i * 176
        cy = 74
        if k == "start":
            g.rect(cx - 70, cy - 22, 140, 44, "nterm", rx=22, sw=1.5)
        elif k == "process":
            g.rect(cx - 70, cy - 24, 140, 48, "nproc", rx=8, sw=1.5)
        elif k == "decision":
            g.poly([(cx, cy - 38), (cx + 76, cy), (cx, cy + 38), (cx - 76, cy)], "ndec", sw=1.5)
        else:
            g.poly([(cx - 58, cy - 24), (cx + 70, cy - 24), (cx + 58, cy + 24), (cx - 70, cy + 24)], "nio", sw=1.5)
        g.text(cx, cy + 5, t, "ink", 14, weight=700)
        g.text(cx, 140, s, "sub", 12, maxw=170)
    g.text(360, 180, "노드마다 종류 · 제목 · 글 · 사진을 넣는다 — 사진은 마우스를 올리면 바로 보인다", "ink", 12.5, weight=600, maxw=690)
    return g


def text_to_map():
    g = Fig("text-to-map", 720, 330, "글이 도형이 되는 방식")
    g.rect(20, 20, 300, 290, "pn", rx=10)
    lines = ["# PM 후 확인", "시작: PM 완료", "1. 소모품 교체 이력 기록", "2. ? Qual 두께가 기준 안인가",
             "  아니오 → 조정 후 재측정 → 2", "3. 생산 투입", "끝: 이력 등록"]
    ys = []
    for i, t in enumerate(lines):
        y = 50 + i * 36
        ys.append(y)
        ind = len(t) - len(t.lstrip())
        g.text(34 + ind * 8, y, t.strip(), "ink mono" if i else "sub mono", 12.5, anchor="start", weight=600 if i else None)
    cx = 520
    nodes = [(1, "nterm", 52, "PM 완료"), (2, "nproc", 102, "소모품 교체 이력 기록"), (3, "ndec", 168, "Qual 두께가 기준 안인가"),
             (5, "nproc", 236, "생산 투입"), (6, "nterm", 290, "이력 등록")]
    for li, cls, y, t in nodes:
        if cls == "ndec":
            g.poly([(cx, y - 30), (cx + 104, y), (cx, y + 30), (cx - 104, y)], cls, sw=1.5)
        else:
            g.rect(cx - 90, y - 18, 180, 36, cls, rx=18 if cls == "nterm" else 6, sw=1.5)
        g.text(cx, y + 4, t, "ink", 12.5, weight=600)
        g.line(320, ys[li] - 4, cx - (104 if cls == "ndec" else 90), y, "gr", 1, dash="3 3")
    for a, b in ((70, 84), (120, 138), (198, 218), (254, 272)):
        g.arrow(cx, a, cx, b, sw=1.4)
    g.path(f"M{cx + 104},168 L{cx + 140},168 L{cx + 140},102 L{cx + 92},102", "ed", sw=1.4, arrow=True)
    g.text(cx + 146, 140, ["아니오", "재측정"], "sub", 11.5, anchor="start")
    g.text(cx + 8, 212, "예", "sub", 11.5, anchor="start")
    g.text(370, 24, "규칙 변환 또는 LLM 변환", "ink", 12.5, anchor="start", weight=700)
    return g


FIGS = [m4e1, spc_fdc, r2r, eight_d, cost, oee, ecd_seq, bath, shapes, text_to_map]
