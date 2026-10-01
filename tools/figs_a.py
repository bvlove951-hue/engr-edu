"""00 과정 안내 · 01 엔지니어의 마인드 · 02 자주 부딪히는 업무 상황 그림."""
from figlib import Fig


def course_map():
    g = Fig("course-map", 720, 350, "교육과정 구성도", "마인드를 바닥에, 공학·반도체·제조 기초를 기둥으로, 업무 상황과 알고리즘 작성을 지붕으로 쌓는 구조")
    g.poly([(50, 112), (360, 24), (670, 112)], "f1 s1", sw=1.5)
    g.text(360, 76, "02 자주 부딪히는 업무 상황 · 06 업무 알고리즘", "ink", 14, weight=700, maxw=420)
    g.text(360, 98, "배운 것을 현장 판단과 절차로 바꾼다", "sub", 12)
    cols = [
        ("03 공학의 기초", ["통계·공정능력", "측정·실험계획(DOE)", "응력·확산·전기화학"], 3),
        ("04 반도체의 기초", ["트랜지스터·메모리", "전공정·후공정", "범프·TSV·HBM"], 2),
        ("05 제조기술의 기초", ["4M1E·SPC·FDC", "변경관리·FMEA·8D", "설비·품질 비용"], 4),
    ]
    for i, (t, items, tone) in enumerate(cols):
        x = 78 + i * 196
        g.rect(x, 124, 172, 140, f"f{tone} s{tone}", rx=8, sw=1.5)
        g.text(x + 86, 150, t, "ink", 14, weight=700, maxw=160)
        g.text(x + 86, 180, items, "sub", 12.5, lh=1.6, maxw=160)
    g.rect(50, 276, 620, 58, "f5 s5", rx=10, sw=1.5)
    g.text(360, 300, "01 엔지니어의 마인드", "ink", 14, weight=700)
    g.text(360, 322, "현상과 해석 구분 · 변화점 먼저 · 빠른 정정 · 기록이 곧 실력", "sub", 12.5, maxw=600)
    return g


def fact_interp():
    g = Fig("fact-interp", 720, 260, "한 문장을 측정·가정으로 나누기")
    g.rect(170, 18, 380, 46, "pn", rx=23)
    g.text(360, 47, "“Ni 두께가 얇아서 범프가 찢어졌다.”", "ink", 15, weight=700)
    cards = [
        (30, "측정", 3, ["3번 lot에서", "범프 찢어짐 2.1%"]),
        (260, "측정", 3, ["같은 lot Ni 두께", "기준 대비 −8%"]),
        (490, "가정", 4, ["두께 저하가", "찢어짐의 원인 (검증 전)"]),
    ]
    for x, tag, tone, lines in cards:
        g.arrow(360, 66, x + 100, 104)
        g.rect(x, 108, 200, 92, f"f{tone} s{tone}", rx=10, sw=1.5)
        g.pill(x + 12, 132, f"[{tag}]", tone)
        g.text(x + 100, 160, lines, "ink", 13.5, weight=600, maxw=184)
    g.text(360, 232, "꼬리표를 붙이면 듣는 사람이 어디를 믿고 어디를 검증할지 바로 안다", "sub", 13, maxw=680)
    return g


def tradeoff():
    g = Fig("tradeoff", 720, 330, "품질·시간·비용의 트레이드오프")
    A, B, C = (360, 64), (170, 262), (550, 262)
    g.poly([A, B, C], "pn", sw=0)
    g.poly([A, B, C, A], "l0", sw=1.5, closed=False)
    for (x, y), t, tone in [(A, "품질", 1), (B, "시간", 3), (C, "비용", 2)]:
        g.circle(x, y, 34, f"f{tone} s{tone}", sw=1.5)
        g.text(x, y + 5, t, "ink", 15, weight=700)
    g.text(360, 196, "엔지니어의 결정", "ink", 15, weight=700)
    g.text(360, 218, "세 꼭짓점을 동시에 최대로 할 수 없다", "sub", 12)
    g.text(238, 146, ["추가 실험", "근거↑ · 일정↓"], "sub", 12.5, anchor="end")
    g.text(482, 146, ["검사 강화", "품질↑ · 비용↑"], "sub", 12.5, anchor="start")
    g.text(360, 312, "장비 추가 → 시간↓ · 비용↑", "sub", 12.5)
    g.text(20, 30, "대가를 숨긴 제안은 나중에 발목을 잡는다", "mut", 12, anchor="start")
    return g


def fishbone():
    g = Fig("fishbone", 720, 320, "특성요인도 (4M1E) — 범프 높이 산포 증가 예시")
    g.arrow(40, 162, 566, 162, "ed", 2.2)
    g.rect(572, 124, 132, 76, "f2 s2", rx=10, sw=1.5)
    g.text(638, 156, ["범프 높이", "산포 증가"], "ink", 14, weight=700)
    bones = [
        (100, True, "Man 사람", ["신규 작업자", "레시피 입력 실수"]),
        (270, True, "Machine 설비", ["립씰 수명", "애노드 소모"]),
        (440, True, "Environment 환경", ["순수 온도", "배기 변동"]),
        (180, False, "Material 자재", ["약품 lot 변경", "첨가제 분해"]),
        (350, False, "Method 방법", ["전류밀도 조건", "측정 위치(site)"]),
    ]
    for x0, top, label, causes in bones:
        y0 = 52 if top else 272
        g.line(x0, y0, x0 + 64, 162, "ed", 1.6)
        g.text(x0, y0 - 10 if top else y0 + 22, label, "ink", 13, weight=700)
        for t, c in zip((0.38, 0.7), causes):
            px, py = x0 + 64 * t, y0 + (162 - y0) * t
            g.line(px - 8, py, px, py, "ed", 1.2)
            g.text(px - 12, py + 4, c, "sub", 12, anchor="end", maxw=150)
    return g


def five_why():
    g = Fig("five-why", 720, 380, "5 Why — 왜를 다섯 번, 답마다 데이터로 확인")
    steps = [
        ("현상", "특정 위치 범프가 찢어진다", 2),
        ("왜?", "그 위치 범프에 응력이 몰린다", 0),
        ("왜?", "높이가 낮은 범프가 늘어나며 버틴다", 0),
        ("왜?", "웨이퍼 가장자리 도금 두께가 얇다", 0),
        ("왜?", "가장자리 전류 분포가 바뀌었다", 0),
        ("근본 원인", "전류 분포를 잡는 부품이 마모되었다", 3),
    ]
    for i, (tag, t, tone) in enumerate(steps):
        y = 18 + i * 58
        x = 150 + (i % 2) * 40
        g.rect(x, y, 420, 40, f"f{tone} s{tone}", rx=8, sw=1.5 if tone else 1)
        g.text(x + 210, y + 25, t, "ink", 13.5, weight=600, maxw=400)
        g.text(x - 14, y + 25, tag, "ink" if tone else "sub", 12.5, anchor="end", weight=700)
        if i < len(steps) - 1:
            g.arrow(x + 210, y + 40, 150 + ((i + 1) % 2) * 40 + 210, y + 58)
            g.text(626, y + 25, "✔ 데이터 확인", "mut", 11.5, anchor="start")
    g.text(360, 370, "대책은 근본 원인에 건다 → 마모 부품의 교체 주기를 관리 항목에 넣는다", "sub", 12.5, maxw=680)
    return g


def priority():
    g = Fig("priority", 720, 334, "긴급도·중요도로 일의 순서 정하기")
    x0, y0, w, h = 150, 52, 260, 112
    g.text(x0 + w / 2, 38, "긴급도 높음", "ink", 13, weight=700)
    g.text(x0 + w + 14 + w / 2, 38, "긴급도 낮음", "ink", 13, weight=700)
    g.text(132, y0 + h / 2 + 4, "중요도 높음", "ink", 13, anchor="end", weight=700)
    g.text(132, y0 + h + 14 + h / 2 + 4, "중요도 낮음", "ink", 13, anchor="end", weight=700)
    cells = [
        (0, 0, 2, "즉시", ["라인 이상", "고객 클레임"]),
        (1, 0, 1, "시간을 따로 확보", ["개선과제", "교육자료 정리"]),
        (0, 1, 4, "짧게 처리 · 위임", ["단순 문의", "자료 요청"]),
        (1, 1, 0, "정리", ["하지 않아도 되는 일"]),
    ]
    for c, r, tone, t, items in cells:
        x, y = x0 + c * (w + 14), y0 + r * (h + 14)
        g.rect(x, y, w, h, f"f{tone} s{tone}", rx=10, sw=1.5)
        g.text(x + w / 2, y + 36, t, "ink", 15, weight=700)
        g.text(x + w / 2, y + 62, items, "sub", 12.5, lh=1.45)
    g.text(360, 320, "헷갈리면 혼자 정하지 말고 “A와 B 중 무엇을 먼저 할까요?”라고 묻는다", "mut", 12, maxw=680)
    return g


def report():
    g = Fig("report", 720, 290, "보고는 결론 먼저")
    g.text(165, 34, "✗ 시간 순서대로 쓴 보고", "ink", 14, weight=700)
    g.text(520, 34, "✓ 결론 먼저 쓴 보고", "ink", 14, weight=700)
    items = ["배경 설명", "처음 한 실험", "그다음 실험", "데이터 해석", "결론 · 요청"]
    ys = [50, 92, 134, 200, 242]
    for i, t in enumerate(items):
        y = ys[i]
        last = i == len(items) - 1
        g.rect(60, y, 210, 32, "f2 s2" if last else "f0 s0", rx=6, sw=1.2)
        g.text(165, y + 21, t, "ink", 13, weight=600 if last else None)
        if i < len(items) - 1:
            g.arrow(165, y + 32, 165, ys[i + 1], sw=1.2)
    g.line(36, 183, 294, 183, "critl", 1.5, dash="5 4")
    g.label_bg(165, 187, "바쁜 상사는 여기서 읽기를 멈춘다", 11.5, "ink")
    tiers = [(430, 180, "① 결론 · 요청", 2, None), (390, 260, "② 근거 3개 이내", 1, "측정·계산·가정 표시"),
             (355, 330, "③ 상세 데이터", 0, "→ 부속 문서로 분리")]
    y = 52
    for x, w, t, tone, sub in tiers:
        g.box(x, y, w, 52, t, tone, 14, sub=sub)
        y += 60
    g.text(520, 254, "첫 세 줄에 결론과 요청이 있다", "sub", 12.5)
    g.text(520, 274, "근거는 아래로 갈수록 자세하게", "mut", 12)
    return g


def first30():
    g = Fig("first-30", 720, 230, "라인 이상 발생 — 첫 30분")
    x0, x1 = 40, 680
    seg = (x1 - x0) / 6
    steps = [("사실 확인", "항목·시점·크기", 1), ("계측 재확인", "재측정·교차", 1), ("영향 범위", "lot·장비", 1),
             ("격리", "홀드·인터락", 2), ("1차 보고", "사실과 조치만", 4), ("변화점 조사", "4M1E", 3)]
    for i, (t, s, tone) in enumerate(steps):
        x = x0 + i * seg
        g.box(x + 3, 56, seg - 6, 62, t, tone, 13.5, sub=s)
    g.line(x0, 140, x1, 140, "ax", 1.5)
    for i in range(7):
        x = x0 + i * seg
        g.line(x, 136, x, 144, "ax", 1.5)
        g.text(x, 160, f"{i * 5}분", "mut", 11.5)
    g.text(40, 36, "알람 →", "ink", 13, anchor="start", weight=700)
    g.text(680, 36, "→ 원인 분석으로 이관", "ink", 13, anchor="end", weight=700)
    g.rect(40, 180, 640, 36, "pn", rx=8)
    g.text(360, 203, "하지 말 것 ✗  원인을 확신하기 전 레시피 변경  ·  혼자 해결하려고 보고 미루기", "ink", 12.5, maxw=620)
    return g


def interface():
    g = Fig("interface", 720, 290, "여러 공정에 걸친 불량 — 내가 바꿀 수 있는 인자와 아닌 인자")
    procs = [("포토", ["패턴 CD", "레지스트 형상"], 0), ("도금 (우리)", ["두께·조성", "높이 산포"], 1),
             ("리플로우", ["온도 프로파일", "분위기"], 0), ("적층", ["압력·온도", "휨(warpage)"], 0),
             ("몰드", ["언더필 충전", "경화 수축"], 0)]
    for i, (t, fs, tone) in enumerate(procs):
        x = 22 + i * 138
        g.box(x, 24, 124, 42, t, tone, 14, sw=2 if tone else 1.2)
        if i < 4:
            g.arrow(x + 124, 45, x + 138, 45, sw=1.2)
        g.text(x + 62, 92, fs, "sub", 12, lh=1.45)
        g.arrow(x + 62, 124, 360 + (i - 2) * 40, 196, sw=1.2)
    g.box(220, 198, 280, 44, "범프 불량 (찢어짐 · 비접합)", 2, 14)
    g.rect(40, 258, 14, 14, "f1 s1", rx=3, sw=1.5)
    g.text(60, 270, "우리 공정이 바꿀 수 있는 인자", "sub", 12, anchor="start")
    g.rect(300, 258, 14, 14, "f0 s0", rx=3, sw=1.2)
    g.text(320, 270, "다른 공정이 주관 → 공동 DOE를 제안", "sub", 12, anchor="start")
    return g


FIGS = [course_map, fact_interp, tradeoff, fishbone, five_why, priority, report, first30, interface]
