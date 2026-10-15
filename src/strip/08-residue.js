/* PR 스트립 08 — 잔여물과 검사: PR은 어디에 남고, 어떻게 찾을까? (범프 사이 · µm) */
(function(){
// 그림 예시 범프 (세 탭 공통 — plans/shared.md (a)): 지름 25 · 피치 55 µm (틈 30), Cu 15 + Ni 3 + SnAg 12 = 30 µm, PR 35 µm.
// 좁은 피치 예시: 피치 40 · 지름 22 µm → 틈 18 µm (PR 35 µm 그대로 → 깊이 : 폭 ≈ 1.9).
// ── 개념 모델 (기획 08장 · 5절). 상수는 경향을 보이려고 고른 가정값 ──
const RS = 6, RM = {none: 2, flow: 8, spray: 30};      // 03장 '녹는 PR' 모델 (70 °C): 겉 풀림 6 µm/분, 겉면 공급 µm/분 (가정)
const KV = {none: 0, flow: 0.5, spray: 1};            // 소용돌이가 닿는 깊이 = k × 틈 폭 (가정)
const CG = 0.5;                                        // 틈 바닥 배수 = 1 + 0.5 × 실질 깊이/폭 (가정 계수)
const AGN = {none: '담금만', flow: '순환', spray: '분사 · 메가소닉'};
const PRE = {ex: {g: 30, h: 35}, nar: {g: 18, h: 35}};
function calc(g, h, ag, os){
  const tf = h * (1 / RS + 1 / RM[ag]);               // 평평한 곳 클리어 (분) = h ÷ r, 1/r = 1/r_겉 + 1/r_공급
  const reach = Math.min(h, KV[ag] * g);               // 소용돌이가 닿는 깊이 (µm)
  const are = (h - reach) / g;                          // 실질 깊이/폭 = max(0, h − k·g)/g
  const mult = 1 + CG * are, tg = tf * mult, ts = tf * (1 + os / 100);
  const ok = ts >= tg - 1e-9;
  return {tf, tg, ts, reach, are, ar: h / g, mult, need: (mult - 1) * 100, ok, res: ok ? 0 : Math.min(h * 0.4, (tg - ts) / tg * h)};
}
// 손대지 않았을 때 단계마다 보여 줄 예시 (발표 모드 대비)
const DEMO = {
  gap: {g: 18, h: 35, ag: 'flow', os: 30},             // 좁은 피치 — 여유 30 %로는 틈 바닥 잔여
  foot: {g: 30, h: 35, ag: 'flow', os: 30},            // 그림 기준 (기본)
  redep: {g: 30, h: 35, ag: 'flow', os: 30},
  find: {g: 18, h: 35, ag: 'flow', os: 100}            // 여유 100 % — 틈 바닥까지 깨끗
};
// ── 장면 치수 ──
const XL = 40, XR = 600, XC = 320, BASE = 1000;       // 왼쪽 틈 확대 (시드 윗면 y 1000)
const PX0 = 1110, PW = 450;                            // 오른쪽 패널 · 종점 띠
const VIEW_FOOT = {x: 630, y: 545, w: 945, h: 570};   // 밑동 확대 + 원인 목록 + 종점 띠
const fnum = v => Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1);
const fmin = v => v >= 100 ? v.toFixed(0) : v.toFixed(1);
const fshort = v => v < 0.05 ? '0.1분 미만' : fmin(v) + '분';          // 모자란 시간 (반올림 0.0 대신)
// 찾기: 검사 방법과 대략 찾을 수 있는 잔여 크기 (nm, 조건 · PR에 따라 — 크기 감각용)
const METH = [
  ['XPS · ToF-SIMS — 표면 수 nm의 C · N', 1, 10, '표면 분석 — 맨 위 수 nm의 성분(탄소 · 질소). 얇은 유기막을 가장 확실히 본다. 느리고 비싸서 표본만'],
  ['접촉각 — 유기막이 있으면 보통 커짐', 1, 8, '물방울 각도 — 단분자층 수준의 변화에도 반응. 빠르고 싸지만 대기 시간 · 측정 조건에 민감. 두께는 알려 주지 않는다'],
  ['형광 — 남은 PR이 빛을 냄 (PR에 따라)', 30, 1e5, '형광 검사 — 남은 PR이 빛을 받아 형광을 낸다(공개 특허 예: 포지티브 적색 · 주황, 네거티브 노랑). 웨이퍼 전체를 빨리 훑는다. 아주 얇은 막 · 형광 없는 유기물은 못 봄'],
  ['EDS — 탄소 (보통 수십 nm 이상)', 30, 1e4, 'EDS — 전자현미경의 성분 분석. 얇은 막은 가속 전압을 낮춰도 잘 안 보일 수 있다'],
  ['SEM — 모양 (틈 바닥 · 밑동)', 20, 1e5, 'SEM — 모양을 본다. 단면 · 기울여 보기로 틈 바닥 · 밑동 잔여'],
  ['AOI — 조각 · 점 (웨이퍼 전체)', 1000, 1e6, 'AOI(자동 광학 외관 검사) — µm 이상 조각 · 점 · 얼룩을 웨이퍼 전체에서']
];
const LX = nm => 1150 + Math.log10(nm) / 6 * 380;     // 1 nm → 1150, 1 mm → 1530

(window.EngrStripChapters = window.EngrStripChapters || []).push({
  no: '08', id: 'residue', part: 3, short: '잔여물 · 검사', scale: '범프 사이 · µm',
  title: '잔여물과 검사 — PR은 어디에 남고, 어떻게 찾을까?',
  hook: '좁은 틈 바닥이 가장 늦다',
  one: 'PR은 액이 가장 늦게 닿는 곳과 가장 두꺼운 곳에 남습니다. 좁은 범프 사이 틈의 바닥, 범프 밑동 모서리, 웨이퍼 가장자리의 두꺼운 PR 턱(EBR 경계), 그리고 녹았던 PR이 물을 만나 다시 붙은 자리입니다. 얇은 유기막은 눈에 안 보이다가 시드 식각 뒤에야 드러나기도 합니다.',
  ana: '<b>설거지 뒤 컵 바닥 모서리</b> — 넓은 접시는 깨끗해도 좁고 깊은 컵의 바닥 모서리에는 때가 남기 쉽고, 헹굼 물이 더러우면 깨끗한 그릇에 다시 묻습니다. <i>(한계: 범프 사이 틈은 µm 크기라 손으로 닦을 수 없고, 흐름 대신 확산이 주로 액을 바꿉니다. 또 아주 얇은 막(nm)은 현미경으로도 잘 안 보여 다른 방법(접촉각 · 표면 분석 · 식각 결과)으로 찾습니다.)</i>',
  steps: [
    {id: 'gap', t: '좁은 틈 — 깊고 좁을수록 늦다', d: '범프 사이 틈은 폭만큼, 또는 폭보다 깊습니다(그림 기준 폭 30 · 깊이 35 µm, 피치 40 µm면 폭 18 µm). 흐름이 바닥까지 잘 못 들어가 녹은 PR이 바닥에 머물고 새 액이 늦게 닿습니다. 가교 PR 조각은 틈에 끼어 빠져나오지 못하기도 합니다.', viewN: {x: 24, y: 330, w: 600, h: 700}},
    {id: 'foot', t: '범프 밑동 — 모서리와 치마', d: 'PR · 시드 · 범프 옆벽이 만나는 밑동 모서리는 가장 늦게 걷힙니다. PR 발이 남았던 곳, 도금 중 PR이 들떠 금속이 얇게 번진 곳(치마)은 PR을 붙잡습니다. PR 위로 넘친 버섯 머리 아래도 액이 잘 닿지 않습니다.', view: VIEW_FOOT, viewN: {x: 632, y: 542, w: 466, h: 572}},
    {id: 'redep', t: '다시 붙는 잔여물', d: '녹아 있던 PR은 물을 만나면 다시 고체로 석출되고, 떠다니던 조각은 같은 웨이퍼나 다른 웨이퍼에 다시 붙습니다. 지친 액, 약품에 맞지 않는 헹굼, 막힌 필터에서 늘어납니다. 웨이퍼 전체의 얇은 얼룩이나 흩어진 점으로 보입니다.', viewN: {x: 1104, y: 140, w: 462, h: 380}},
    {id: 'find', t: '찾기 — 보이는 것, 안 보이는 것, 종점', d: '광학 외관(AOI) · 형광 검사 · SEM은 조각과 밑동 잔여를, 접촉각 · 표면 분석(XPS 등)은 얇은 유기막을 찾습니다. 다 걷힌 시각(클리어)에 여유 시간을 더해 종점을 정하고, 시드 식각 뒤 잔여 · 누설로 마지막 확인을 합니다.', viewN: {x: 1104, y: 140, w: 462, h: 610}}
  ],
  icon(K){
    const {R, C, P, L} = K;
    return R(4, 46, 56, 6, 'f-seed2') + R(6, 20, 16, 26, 'f-cu2') + R(6, 12, 16, 8, 'f-sn2') + R(36, 20, 16, 26, 'f-cu2') + R(36, 12, 16, 8, 'f-sn2') +
      P('M22,46 L22,38 Q29,43 36,38 L36,46 Z', 'f-res') + C(29, 37, 11, 'st08-lens') + L(37, 45, 45, 53, 'st08-lensh');
  },
  draw(K){
    const {R, C, L, P, PG, T, TT, G, LB, tip, only, W, arrow, rng} = K;
    let s = `<defs><pattern id="${K.id('st08-hat')}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="rgba(148,163,184,.07)"/><line x1="0" y1="0" x2="0" y2="14" stroke="rgba(148,163,184,.34)" stroke-width="2"/></pattern>` +
      `<clipPath id="${K.id('st08-wc')}"><circle cx="795" cy="360" r="135"/></clipPath></defs>`;
    const mark = (n, x, y, step) => G(C(x, y, 13, 'st08-mk0') + T(x, y + 6, String(n), 'st08-mkt')) + (step ? G(C(x, y, 17, 'co-ring') + C(x, y, 14, 'st08-mk1') + T(x, y + 6, String(n), 'st08-mkt1'), W(only(step), {'data-noov': '1'})) : '');

    /* ───────── 왼쪽: 틈 확대 (위젯이 다시 그린다) ───────── */
    s += R(30, 130, 580, BASE - 130, 'f-bath', tip('스트리퍼 액 (예: DMSO · NMP 계 + 알칼리, 보통 60~80 °C로 데워 씀)')) + R(30, 130, 580, BASE - 130, 'f-strip');
    s += `<g data-v="gz"></g>`;
    s += LB(T(48, 166, '틈 확대 — 범프 사이 한 칸 (설정 시간에)', 't-acc', 'start'));
    s += `<g data-v="gzt"></g>`;
    s += R(30, 130, 580, 980, 'pl-hlbox', W({rx: 12}, only('gap')));

    /* ───────── 가운데 위: 잔여가 남는 네 자리 (gap · foot · redep) ───────── */
    let ov = LB(T(656, 164, '잔여가 남는 네 자리', 't-acc', 'start') + T(656, 192, '① 틈 바닥  ② 밑동  ③ 다시 붙음  ④ 가장자리', 't-dim', 'start'));
    ov += R(650, 210, 430, 190, 'f-bath', tip('스트리퍼 액')) + R(650, 210, 430, 190, 'f-strip');
    ov += R(650, 400, 430, 4, 'f-seed2', tip('시드 Cu (예시 300 nm — 그림은 과장)')) + R(650, 404, 430, 2, 'f-ti', tip('Ti (예시 100 nm — 그림은 과장)')) + R(650, 406, 430, 5, 'f-pas', tip('보호막(패시베이션)')) + R(650, 411, 430, 13, 'f-si', tip('실리콘 웨이퍼'));
    [690, 910].forEach(x => {
      ov += G(R(x, 340, 100, 60, 'f-cu2') + R(x, 328, 100, 12, 'f-ni') + R(x, 280, 100, 48, 'f-sn2'), tip('범프 (그림 기준: 지름 25 µm · Cu 15 + Ni 3 + SnAg 12 µm) — PR이 걷힌 뒤'));
    });
    // ① 틈 바닥 잔여
    ov += G(PG([[790, 400], [814, 400], [790, 382]], 'f-res') + PG([[910, 400], [886, 400], [910, 382]], 'f-res') + R(790, 396, 120, 4, 'f-res'), tip('① 틈 바닥 — 흐름이 잘 안 들어가 가장 늦게 걷힌다'));
    // ② 밑동: 왼쪽 PR 발, 오른쪽 치마 위 잔여
    ov += G(PG([[690, 400], [674, 400], [690, 384]], 'f-res') + PG([[1010, 400], [1036, 400], [1010, 394]], 'f-cu2') + PG([[1010, 394], [1036, 400], [1041, 397], [1010, 386]], 'f-res'), tip('② 밑동 — 모서리 · PR 발 · 치마(도금 중 들뜬 자리)가 PR을 붙잡는다'));
    // ③ 다시 붙은 점
    const r3 = rng(31);
    let dots = '';
    for (let k = 0; k < 9; k++){
      const left = k % 2 === 0, x = left ? 696 + r3() * 88 : 916 + r3() * 88;
      dots += C(x, 278, 3.4, 'f-res');
    }
    [[786, 300], [786, 356], [914, 318], [914, 372], [840, 397]].forEach(([x, y]) => { dots += C(x, y, 3.4, 'f-res'); });
    ov += G(dots, tip('③ 다시 붙은 점 — 물을 만나 석출된 PR · 떠다니던 조각'));
    // gap: 범프 사이에 걸린 가교 PR 조각
    ov += G(R(796, 284, 108, 12, 'f-prs', {transform: 'rotate(-10 850 290)'}) + LB(T(850, 246, '끼인 가교 조각', 't-dim')), W(only('gap'), tip('가교 PR 조각 — 들뜬 판이 범프 사이에 걸려 빠져나오지 못하기도 한다 (조건에 따라)')));
    // ④ 웨이퍼 가장자리 PR 턱 (크기 비율 아님)
    const ey = 476;
    ov += P(`M650,${ey} L1010,${ey} Q1030,${ey} 1036,${ey + 10} Q1040,${ey + 22} 1022,${ey + 24} L650,${ey + 24} Z`, 'f-si', tip('웨이퍼 가장자리 (베벨) — 크기 비율 아님'));
    ov += P(`M650,${ey} L650,${ey - 18} L928,${ey - 18} Q952,${ey - 18} 962,${ey - 32} Q974,${ey - 42} 984,${ey - 30} L990,${ey} Z`, 'f-pr', tip('가장자리 PR 턱 — 돌려 바른 두꺼운 PR이 가장자리에 쌓이고(에지 비드), EBR 뒤에도 경계에 턱이 남는다.\n가장 두꺼워 가장 늦게 걷힌다 (스트립 전 모습)'));
    ov += C(968, ey - 22, 26, 'st08-hot', tip('④ 가장자리 — PR이 가장 두꺼운 곳'));
    ov += LB(T(656, 518, '④ 가장자리 — EBR 경계의 PR 턱 (스트립 전)', 't-dim', 'start'));
    ov += mark(1, 850, 366, 'gap') + mark(2, 1056, 372, null) + mark(3, 740, 254, 'redep') + mark(4, 1012, 444, null);
    s += G(R(640, 130, 450, 400, 'pl-panel', {rx: 14}) + ov, only('gap redep'));

    /* ───────── 가운데 위 (find): SEM으로 볼 자리 ───────── */
    let sm = LB(T(656, 164, 'SEM으로 볼 자리 — 가장 늦은 곳', 't-acc', 'start') + T(656, 192, '평균이 아니라 가장 나쁜 곳을 본다', 't-dim', 'start'));
    sm += C(795, 360, 135, 'st08-waf', tip('웨이퍼 (300 mm) — 위에서 본 모습'));
    let grid = '';
    for (let x = 669; x < 930; x += 28) grid += L(x, 225, x, 495, 'st08-grid');
    for (let y = 234; y < 495; y += 28) grid += L(660, y, 930, y, 'st08-grid');
    sm += G(grid, {'clip-path': K.url('st08-wc')});
    sm += P('M660,360 a135,135 0 1,0 270,0 a135,135 0 1,0 -270,0 Z M672,360 a123,123 0 1,1 246,0 a123,123 0 1,1 -246,0 Z', 'st08-excl', W({'fill-rule': 'evenodd'}, tip('가장자리 띠 (몇 mm) — EBR로 PR을 씻어 낸 곳. 경계에 PR 턱이 남는다')));
    sm += C(795, 360, 123, 'st08-ebr', tip('EBR 경계 — 평평한 곳보다 PR이 두껍다'));
    sm += P('M786,496 L795,482 L804,496 Z', 'f-hole2', tip('노치 — PR이 더 두껍고 베벨 · 뒷면으로 넘어가기도 한다'));
    sm += R(781, 318, 28, 28, 'st08-diehl', tip('① 가장 좁은 틈 — 빽빽한 블록이 있는 다이'));
    sm += R(697, 402, 28, 28, 'st08-diehl', tip('④ 고립 범프 — 도금이 빨라 버섯 머리가 생기기 쉬운 곳'));
    sm += mark(1, 795, 332, 'find') + mark(2, 889, 281, 'find') + mark(3, 795, 462, 'find') + mark(4, 711, 416, 'find');
    sm += LB(T(948, 252, '① 좁은 틈', 't-dim', 'start') + T(948, 284, '② EBR 경계 턱', 't-dim', 'start') + T(948, 316, '③ 노치', 't-dim', 'start') + T(948, 348, '④ 고립 범프', 't-dim', 'start') + T(948, 374, '(버섯 머리)', 't-dim', 'start'));
    sm += LB(T(656, 522, '가장자리: PR 가장 두꺼움 · 매엽은 액도 식음', 't-dim', 'start'));
    s += G(R(640, 130, 450, 400, 'pl-panel', {rx: 14}) + sm, only('find'));

    /* ───────── 가운데 아래: 밑동 확대 (모든 단계, foot에서 확대) ───────── */
    s += R(640, 550, 450, 560, 'pl-panel', {rx: 14});
    let ft = LB(T(656, 584, '밑동 확대 — 범프 한 개', 't-acc', 'start') + T(656, 610, '오버 도금 예 · 기둥 가운데 줄임 · 1 µm ≈ 10 px', 't-dim', 'start'));
    ft += R(650, 622, 430, 318, 'f-bath', tip('스트리퍼 액')) + R(650, 622, 430, 318, 'f-strip');
    ft += R(650, 940, 430, 8, 'f-seed2', tip('시드 Cu (예시 300 nm — 실제 수백 nm, 그림은 과장)')) + R(650, 948, 430, 4, 'f-ti', tip('Ti — 시드 아래 접착 · 방벽층 (예시 100 nm — 그림은 과장)'));
    ft += R(650, 952, 430, 8, 'f-pas', tip('보호막(패시베이션) — 스트립 동안은 시드가 덮고 있어 액에 닿지 않는다')) + R(770, 952, 190, 8, 'f-al', tip('패드 — 범프 아래 보호막이 열린 자리')) + R(650, 960, 430, 34, 'f-si', tip('실리콘 웨이퍼'));
    ft += P('M712,662 Q712,630 748,628 L982,628 Q1018,630 1018,662 Z', 'f-sn2', tip('버섯 머리 (오버 도금 예) — 금속이 PR 높이를 넘어 옆으로 퍼진 머리.\n그림 기준 범프(30 µm)는 PR(35 µm)보다 낮아 보통은 생기지 않는다'));
    ft += R(740, 662, 250, 30, 'f-sn2', tip('SnAg 솔더')) + R(740, 692, 250, 26, 'f-ni', tip('Ni 방벽 (예시 3 µm)'));
    ft += R(712, 662, 28, 34, 'st08-shade') + R(990, 662, 28, 34, 'st08-shade');
    ft += G(R(712, 662, 28, 16, 'f-res') + R(990, 662, 28, 16, 'f-res'), tip('(다) 버섯 머리 그늘 — 머리 아래 PR에 액이 잘 닿지 않아 남기 쉽다'));
    ft += L(650, 662, 1080, 662, 'st08-prt', tip('PR 윗면이 있던 자리 — 금속이 이 높이를 넘어 퍼지면 버섯 머리'));
    let wv = '';
    [721, 741].forEach(y => { let d = `M734,${y}`; for (let x = 734; x < 996; x += 32) d += ` q8,-6 16,0 t16,0`; wv += P(d, 'st08-wv'); });
    ft += G(R(734, 718, 262, 26, 'st08-brk') + wv, tip('기둥 가운데 줄임 — 실제 범프 30 µm · PR 35 µm'));
    ft += R(740, 744, 250, 196, 'f-cu2', tip('Cu 기둥 (예시 15 µm)'));
    ft += PG([[740, 940], [712, 940], [740, 908]], 'f-res', tip('(가) 밑동 모서리 · PR 발 — PR · 시드 · 범프 옆벽이 만나는 곳. 가장 늦게 걷힌다'));
    ft += PG([[990, 940], [1042, 940], [990, 929]], 'f-cu2', tip('치마 — 도금 중 PR이 들떠 밑동 둘레로 번진 얇은 금속 (그림은 과장)'));
    ft += PG([[990, 929], [1042, 940], [1050, 936], [990, 918]], 'f-res', tip('(나) 치마 위에 물린 PR — 치마가 PR을 붙잡아 잘 안 떨어진다'));
    ft += L(705, 896, 720, 920, 's-lead') + L(1052, 920, 1040, 932, 's-lead') + L(704, 684, 716, 676, 's-lead');
    // 위 '네 자리'의 ①~④와 헷갈리지 않게 밑동 확대는 가 · 나 · 다
    ft += mark('가', 694, 888, 'foot') + mark('나', 1064, 908, 'foot') + mark('다', 692, 690, 'foot');
    [['가', '밑동 모서리 · PR 발 — 가장 늦게 걷힘'], ['나', '치마 — 도금 중 들뜬 자리가 PR을 붙잡음'], ['다', '버섯 머리 그늘 — 액이 잘 닿지 않음']].forEach(([k, txt], i) => {
      const y = 1024 + i * 28;
      ft += LB(C(669, y - 7, 12, 'st08-mk0') + T(669, y - 1, k, 'st08-mkt') + T(689, y, txt, 't-dim', 'start'));
    });
    // redep: 밑동 확대에도 다시 붙은 점
    const r4 = rng(77);
    let fd = '';
    for (let k = 0; k < 5; k++) fd += C(735, 760 + k * 34 + r4() * 10, 4, 'f-res') + C(995, 770 + k * 30 + r4() * 10, 4, 'f-res');
    [[672, 936], [690, 936], [1060, 936], [1072, 936], [800, 624], [900, 625]].forEach(([x, y]) => { fd += C(x, y, 4, 'f-res'); });
    ft += G(fd, W(only('redep'), tip('다시 붙은 점 — 물을 만나 석출된 PR')));
    s += G(ft);
    s += R(640, 550, 450, 560, 'pl-hlbox', W({rx: 14}, only('foot')));

    /* ───────── 오른쪽 패널 (단계마다) ───────── */
    s += R(PX0, 130, PW, 750, 'pl-panel', {rx: 14});
    s += R(PX0, 130, PW, 750, 'pl-hlbox', W({rx: 14}, only('redep find')));
    s += `<g data-v="gg"></g>`;
    // foot: 원인 목록 + 꼬리표
    let fc = LB(T(1130, 592, '밑동 잔여 — 어디서 왔나', 't-acc', 'start'));
    const CAUSE = [
      ['up', '앞 공정', 'PR 발 · 디스컴 부족', '현상 뒤 바닥 모서리에 남은 PR 꼬리', '[앞 공정] 노광 · 현상 · 디스컴 — PR 발이 남으면 밑동 잔여의 씨앗'],
      ['up', '앞 공정', '도금 중 PR 들뜸 → 치마', '들뜬 틈으로 금속이 얇게 번짐', '[앞 공정] 도금 — PR 들뜸 · 액 스며듦 (전해도금 12장)'],
      ['up', '앞 공정', '오버 도금 → 버섯 머리', '머리 아래로 액이 잘 닿지 않음', '[앞 공정] 도금 — 고립 범프 · 높은 전류에서 PR 높이를 넘김'],
      ['cond', '스트립-조건', '시간 · 교반 부족', '모서리 · 그늘은 가장 늦게 걷힌다', '[스트립-조건] 여유 시간 · 교반 · 온도 — 이 공정이 바꿀 수 있는 손잡이']
    ];
    CAUSE.forEach(([c, tg, a, b, tp], i) => {
      const y = 630 + i * 58, tw = tg.length * 17 + 18;
      fc += G(R(1130, y - 19, tw, 26, 'st08-tg ' + c, {rx: 6}) + T(1130 + tw / 2, y, tg, 'st08-tgt'), tip(tp));
      fc += LB(T(1130 + tw + 10, y, a, 't-sub', 'start') + T(1130, y + 26, b, 't-dim', 'start'));
    });
    fc += `<a href="#go-plating-12" class="pl-tablink" data-tip="전해도금 12장 — PR 들뜸 · PR 발 · 버섯 머리">${LB(T(1130, 866, '→ 전해도금 12장 (PR 들뜸 · PR 발)', 'pl-hdg', 'start'))}</a>`;
    s += G(fc, only('foot'));

    // redep: 비커 3칸
    let rd = LB(T(1130, 166, '다시 붙는 잔여물 — 물을 만나면', 't-acc', 'start'));
    const BKX = [1130, 1280, 1430];
    const tank = x => P(`M${x},214 L${x},370 Q${x},384 ${x + 14},384 L${x + 106},384 Q${x + 120},384 ${x + 120},370 L${x + 120},214`, 'f-tank');
    // ① 녹은 PR이 고르게 섞인 스트리퍼
    let b1 = R(BKX[0] + 3, 244, 114, 137, 'f-bath') + R(BKX[0] + 3, 244, 114, 137, 'f-strip') + tank(BKX[0]);
    const r5 = rng(13);
    for (let k = 0; k < 14; k++){
      const x = BKX[0] + 16 + r5() * 88, y = 258 + r5() * 112, a = 6;
      b1 += `<circle r="3.4" class="st08-dis"><animateMotion dur="${(2.6 + r5() * 1.6).toFixed(2)}s" begin="-${(r5() * 3).toFixed(2)}s" repeatCount="indefinite" path="M${x.toFixed(0)},${y.toFixed(0)} l${a},${-a} l${a},${a} l${-a},${a} Z"/></circle>`;
    }
    rd += G(b1, tip('스트리퍼에 녹은 PR — 분자로 고르게 섞여 있다'));
    // ② 물이 들어가면 뿌연 알갱이
    let b2 = R(BKX[1] + 3, 244, 114, 137, 'f-bath') + R(BKX[1] + 3, 244, 114, 137, 'f-strip') + R(BKX[1] + 3, 244, 114, 137, 'st08-cloud') + tank(BKX[1]);
    const r6 = rng(17);
    for (let k = 0; k < 16; k++) b2 += C(BKX[1] + 14 + r6() * 92, 262 + r6() * 110, 3.5 + r6() * 3.5, 'st08-grain');
    b2 += `<g><path d="M0,-13 Q9,0 0,7 Q-9,0 0,-13 Z" class="st08-drop"/><animateTransform attributeName="transform" type="translate" values="${BKX[1] + 60} 196;${BKX[1] + 60} 250" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;.8;1" dur="1.6s" repeatCount="indefinite"/></g>`;
    rd += G(b2, W(tip('물(헹굼)이 들어가면 녹은 PR이 더는 녹아 있지 못하고 뿌연 알갱이로 석출된다'), {'data-noov': '1'}));
    rd += LB(T(BKX[1] + 96, 206, '+ 물', 't-dim', 'start'));
    // ③ 표면에 다시 붙음
    let b3 = R(BKX[2], 214, 120, 170, 'pl-lane', {rx: 10}) + R(BKX[2] + 2, 220, 116, 140, 'f-rinse');
    b3 += R(BKX[2] + 2, 360, 116, 5, 'f-seed2') + R(BKX[2] + 2, 365, 116, 16, 'f-si');
    [BKX[2] + 14, BKX[2] + 76].forEach(x => { b3 += R(x, 326, 30, 34, 'f-cu2') + R(x, 320, 30, 6, 'f-ni') + R(x, 296, 30, 24, 'f-sn2'); });
    [[BKX[2] + 12, 310], [BKX[2] + 12, 344], [BKX[2] + 46, 334], [BKX[2] + 58, 356], [BKX[2] + 104, 316], [BKX[2] + 74, 346], [BKX[2] + 24, 292], [BKX[2] + 90, 292], [BKX[2] + 110, 356]].forEach(([x, y]) => { b3 += C(x, y, 4.2, 'st08-grain'); });
    b3 += R(BKX[2] + 78, 280, 26, 9, 'f-pr', {transform: `rotate(-14 ${BKX[2] + 91} 284)`});
    rd += G(b3, tip('석출된 알갱이 · 떠다니던 PR 조각이 범프와 시드 표면에 붙는다'));
    rd += arrow(BKX[0] + 124, 300, BKX[1] - 4, 300, 's-arr') + arrow(BKX[1] + 124, 300, BKX[2] - 4, 300, 's-arr');
    [['녹은 PR이', '고르게 섞임'], ['물을 만나면', '뿌연 알갱이'], ['표면에', '다시 붙음']].forEach(([a, b], i) => { rd += LB(T(BKX[i] + 60, 412, a, 't-dim') + T(BKX[i] + 60, 436, b, 't-dim')); });
    rd += LB(T(1130, 478, '왜? PR 수지는 물에 녹지 않는다', 't-sub', 'start') + T(1130, 504, '물이 어느 비율을 넘으면 뿌옇게 석출된다', 't-dim', 'start'));
    rd += LB(T(1130, 548, '늘어나는 때', 'pl-hdg', 'start') + TT(1130, 576, ['· 지친 액 — 녹은 PR이 많이 쌓임 (06장)', '· 약품에 맞지 않는 헹굼 — 물을 너무 일찍', '· 막힌 필터 · 떠다니는 조각'], 't-dim', 'start', 26));
    rd += LB(T(1130, 676, '보이는 모습', 'pl-hdg', 'start') + T(1130, 704, '· 웨이퍼 전체 얇은 얼룩, 흩어진 점', 't-dim', 'start'));
    rd += LB(T(1130, 748, '대책', 'pl-hdg', 'start') + TT(1130, 776, ['· 약품이 정한 헹굼 순서 (필요하면 중간 용제)', '· 액 교체 · 필터 관리 · 조각 걸러 내기', '· 마르지 않게, 첫 물은 빠르고 많이 (07장)'], 't-dim', 'start', 26));
    s += G(rd, only('redep'));

    // find: 크기 사다리 (가로 로그 눈금 1 nm ~ 1 mm)
    let fd2 = LB(T(1130, 166, '찾기 — 잔여 크기에 맞는 검사', 't-acc', 'start') + T(1130, 194, '막대 = 주로 쓰는 크기 범위 (조건 · PR에 따라)', 't-dim', 'start'));
    fd2 += R(LX(1), 288, LX(100) - LX(1), 380, 'st08-zthin', tip('얇은 유기막 (수 nm ~ 100 nm) — 눈 · 광학으로는 안 보인다')) + R(LX(1000), 288, LX(1e6) - LX(1000), 380, 'st08-zvis', tip('조각 · 점 · 밑동 잔여 (µm 이상) — 광학 · SEM으로 보인다'));
    fd2 += L(LX(1), 252, LX(1e6), 252, 's-axis');
    for (let k = 0; k <= 6; k++) fd2 += L(LX(Math.pow(10, k)), 246, LX(Math.pow(10, k)), 258, 's-axis');
    fd2 += LB(T(LX(1), 280, '1 nm', 't-dim', 'start') + T(LX(100), 280, '100 nm', 't-dim') + T(LX(1e4), 280, '10 µm', 't-dim') + T(LX(1e6), 280, '1 mm', 't-dim', 'end'));
    fd2 += LB(T((LX(1) + LX(100)) / 2, 310, '얇은 막 — 안 보임', 'st08-zt') + T((LX(1000) + LX(1e6)) / 2, 310, '조각 · 점 — 보임', 'st08-zt2'));
    METH.forEach(([nm, lo, hi, tp], i) => {
      const y = 344 + i * 56;
      fd2 += G(LB(T(1130, y, nm, 't-sub', 'start')) + R(LX(lo), y + 9, LX(hi) - LX(lo), 14, 'st08-bar' + (hi <= 10 ? ' st08-bt' : lo >= 1000 ? ' st08-bv' : ''), {rx: 6}), tip(tp));
    });
    fd2 += LB(T(1130, 700, '+ 결과로 확인: 시드 식각 뒤 누설 · 잔여', 'pl-warn', 'start') + T(1130, 728, '(시드 식각 07 · 09장 — 가장 늦지만 가장 확실)', 't-dim', 'start'));
    fd2 += LB(T(1130, 786, '종점 = 클리어 시각 + 여유 시간', 't-sub', 'start') + T(1130, 814, '여유는 가장 늦은 자리의 SEM으로 정한다', 't-dim', 'start'));
    fd2 += arrow(1335, 832, 1335, 896, 's-arr2');
    s += G(fd2, only('find'));

    /* ───────── 오른쪽 아래: 종점 띠 (모든 단계, 위젯이 그린다) ───────── */
    s += R(PX0, 900, PW, 200, 'pl-panel', {rx: 14});
    s += `<g data-v="band"></g>`;
    s += R(PX0, 900, PW, 200, 'pl-hlbox', W({rx: 14}, only('find')));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 틈 바닥은 언제 깨끗해질까</div>
      ${K.seg('pre', [['ex', '그림 기준 (피치 55 · 틈 30 µm)'], ['nar', '좁은 피치 (피치 40 · 틈 18 µm)']], 'ex', '형상 예시 · PR 35 µm')}
      ${K.ctl('g', '범프 사이 틈 폭 (µm)', 10, 60, 1, 30)}${K.ctl('h', '깊이 = PR 두께 (µm)', 20, 100, 5, 35)}
      ${K.seg('ag', [['none', '담금만'], ['flow', '순환'], ['spray', '분사 · 메가소닉']], 'flow', '교반')}
      ${K.ctl('os', '여유 시간 (오버 스트립, %)', 0, 150, 5, 30)}
      ${K.kpis([['평평한 곳 클리어', 'k-tf', '분 (예시)'], ['틈 바닥 클리어', 'k-tg', '분 (예시)'], ['설정 시간', 'k-ts', '분 = 평평한 곳 × (1 + 여유)'], ['판정', 'k-v', '설정 시간에 틈 바닥']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('평평한 곳 클리어 = 03장 \'녹는 PR\' 모델(70 °C: 겉 풀림 6 µm/분, 겉면 공급 담금 2 · 순환 8 · 분사 30 µm/분 — 가정값). 틈 바닥 클리어 = 평평한 곳 × (1 + 0.5 × 실질 깊이/폭), 실질 깊이 = 깊이 − 소용돌이 깊이(폭 × 0 · 0.5 · 1) — 경향을 보이려고 고른 <b>가정 계수</b>입니다. 녹는 PR 기준이며, 부풀어 떨어지는 가교 PR은 조각이 틈에 끼는 것이 더 큰 문제입니다(노트 「한 걸음 더」). \'필요한 여유 %\'는 이 가정 계수에서 나온 예시이지 기준이 아니고, 그림의 잔여 높이도 모자란 시간 비율로 그린 개념입니다. 실제로는 가장 좁은 틈 · 가장 두꺼운 자리(가장자리 EBR 경계 포함)의 SEM으로 클리어 시간을 재서 정합니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, PG, T, G, LB, tip, W, only, rng} = K;
    const st = Object.assign({}, DEMO.foot);
    let touched = false, ready = false;
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const gIn = inp('g'), hIn = inp('h'), oIn = inp('os');
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const preOf = () => Object.keys(PRE).find(k => PRE[k].g === st.g && PRE[k].h === st.h) || '';
    const f1 = v => v.toFixed(1);

    // ── 왼쪽 틈 확대 ──
    function gapZoom(m){
      const S = Math.min(15, 570 / st.h, 440 / st.g);       // 1 µm = S px
      const gp = st.g * S, gL = XC - gp / 2, gR = XC + gp / 2;
      const top = BASE - st.h * S;                            // 처음 PR 윗면
      const Hb = Math.max(0.6 * st.h, st.h - 5), bt = BASE - Hb * S;   // 범프 높이 (그림 기준 PR 35 → 범프 30 µm)
      const hCu = Hb * 0.5 * S, hNi = Hb * 0.1 * S;
      let s = '';
      // 범프 두 개 (확대라 옆은 잘림)
      [[XL, gL], [gR, XR]].forEach(([a, b]) => {
        s += R(a, BASE - hCu, b - a, hCu, 'f-cu2', tip('Cu 기둥'));
        s += R(a, BASE - hCu - hNi, b - a, hNi, 'f-ni', tip('Ni 방벽'));
        s += R(a, bt, b - a, BASE - hCu - hNi - bt, 'f-sn2', tip('SnAg 솔더 (리플로우 전 원기둥)'));
      });
      // 바닥층
      s += R(30, BASE, 580, 8, 'f-seed2', tip('시드 Cu (예시 300 nm — 실제 수백 nm, 그림은 과장). 틈 바닥 잔여가 이 시드를 가리면 시드 식각이 늦어진다'));
      s += R(30, BASE + 8, 580, 4, 'f-ti', tip('Ti — 접착 · 방벽층 (예시 100 nm — 그림은 과장)'));
      s += R(30, BASE + 12, 580, 8, 'f-pas', tip('보호막(패시베이션)')) + R(XL, BASE + 12, gL - XL - 14, 8, 'f-al', tip('패드')) + R(gR + 14, BASE + 12, XR - gR - 14, 8, 'f-al', tip('패드'));
      s += R(30, BASE + 20, 580, 44, 'f-si', tip('실리콘 웨이퍼'));
      // 위 흐름선 (교반에 따라 빠르기 · 진하기)
      const fcls = {none: 'st08-fl0', flow: '', spray: 'st08-fl2'}[st.ag];
      let fl = '';
      (st.ag === 'none' ? [56] : [56, 86, 116]).forEach(dy => { const y = top - dy; fl += P(`M44,${y.toFixed(0)} C200,${(y - 10).toFixed(0)} 440,${(y + 10).toFixed(0)} 596,${y.toFixed(0)}`, 's-flow ' + fcls); });
      s += G(fl, W(tip(st.ag === 'none' ? '담금만 — 액이 거의 움직이지 않는다' : st.ag === 'flow' ? '순환 흐름 — 틈 위를 지나간다' : '분사 · 메가소닉 — 틈 위 흐름이 세다'), {'data-noov': '1'}));
      if (st.ag === 'spray'){
        let sp = '';
        const y0 = Math.max(316, top - 150);                 // 위 설명 글(y ~290)을 지나가지 않게
        for (let k = 0; k < 5; k++){ const x = XC - gp * 0.3 + k * gp * 0.15; sp += K.mover(x - 40, y0, x, top + 24, 4, 'st08-dot', 0.9, k * 0.18); }
        s += G(sp, {'data-noov': '1'});
      }
      // 소용돌이
      const vd = m.reach * S;
      if (vd > 16){
        const rx = Math.max(10, 0.38 * gp), ry = vd / 2 - 3, cy = top + vd / 2;
        const d = `M${(XC - rx).toFixed(1)},${cy.toFixed(1)} a${rx.toFixed(1)},${ry.toFixed(1)} 0 1,1 ${(2 * rx).toFixed(1)},0 a${rx.toFixed(1)},${ry.toFixed(1)} 0 1,1 ${(-2 * rx).toFixed(1)},0`;
        let vx = P(d, 's-flow st08-vx ' + fcls);
        const dur = st.ag === 'spray' ? 1.3 : 2.4;
        for (let k = 0; k < 4; k++) vx += `<circle r="5" class="st08-dot"><animateMotion dur="${dur}s" begin="-${(k * dur / 4).toFixed(2)}s" repeatCount="indefinite" path="${d}"/></circle>`;
        s += G(vx, W(tip(`소용돌이 — 틈 위 흐름이 만든 회전. 폭의 약 ${KV[st.ag]}배 깊이(${fnum(m.reach)} µm)까지 닿는다고 둔 가정`), {'data-noov': '1'}));
      }
      // 정체 구역 (소용돌이 아래 ~ 잔여 위)
      const rp = m.res * S, sTop = top + vd, sBot = BASE - rp;
      if (sBot - sTop > 4){
        // 아랫변은 잔여의 오목한 윗면과 같은 곡선 (잔여가 없으면 바닥 직선)
        const dS = `M${gL.toFixed(1)},${sTop.toFixed(1)} L${gR.toFixed(1)},${sTop.toFixed(1)} L${gR.toFixed(1)},${sBot.toFixed(1)} Q${XC},${(BASE - rp * 0.1).toFixed(1)} ${gL.toFixed(1)},${sBot.toFixed(1)} Z`;
        s += P(dS, 'st08-still', W({fill: K.url('st08-hat')}, tip('정체 구역 — 흐름이 거의 없어 확산으로만 액이 바뀐다.\n녹은 PR이 머물고 새 액이 늦게 닿는다')));
        const rr = rng(Math.round(st.g * 7 + st.h));
        let df = '';
        for (let k = 0; k < 3; k++){
          const x = gL + gp * (0.25 + 0.25 * k), y = sTop + (sBot - sTop) * (0.35 + 0.2 * rr()), a = Math.min(14, gp * 0.08);
          df += `<circle r="4" class="st08-dif"><animateMotion dur="${(3.4 + rr() * 2).toFixed(2)}s" begin="-${(rr() * 3).toFixed(2)}s" repeatCount="indefinite" path="M${x.toFixed(0)},${y.toFixed(0)} l${a.toFixed(0)},${(-a * 0.6).toFixed(0)} l${(-a * 0.4).toFixed(0)},${(a * 1.2).toFixed(0)} l${(-a * 1.1).toFixed(0)},${(-a * 0.3).toFixed(0)} Z"/></circle>`;
        }
        s += G(df, {'data-noov': '1'});
        if (sBot - sTop > 110 && gp > 100) s += LB(T(XC, sTop + 40, '정체', 't-dim') + T(XC, sTop + 64, '확산만', 't-dim'));
      }
      // 처음 PR 윗면 · 치수
      s += L(XL, top, XR, top, 'st08-prt', tip(`처음 PR 윗면 — 깊이 ${st.h} µm`));
      s += L(gL, top - 16, gR, top - 16, 'st08-dim') + L(gL, top - 24, gL, top - 8, 'st08-dim') + L(gR, top - 24, gR, top - 8, 'st08-dim');
      s += L(52, top, 52, BASE, 'st08-dim') + L(44, top, 60, top, 'st08-dim') + L(44, BASE, 60, BASE, 'st08-dim');
      s += LB(T(XC, top - 28, `폭 ${st.g} µm`, 't-warn') + T(44, top - 28, `깊이 ${st.h} µm`, 't-warn', 'start') + T(XR - 2, top - 28, '처음 PR 윗면', 't-dim', 'end'));
      // 잔여 또는 깨끗
      if (!m.ok){
        const y0 = BASE - rp;
        s += P(`M${gL.toFixed(1)},${BASE} L${gL.toFixed(1)},${y0.toFixed(1)} Q${XC},${(BASE - rp * 0.1).toFixed(1)} ${gR.toFixed(1)},${y0.toFixed(1)} L${gR.toFixed(1)},${BASE} Z`, 'f-res', tip(`틈 바닥 잔여 — 설정 시간에 아직 남은 PR\n높이는 모자란 시간 비율로 그린 개념 (약 ${fnum(m.res)} µm — 그림은 깊이의 40 %까지만)`));
        if (rp > 8 && gp > 70) s += LB(T(XC, Math.min(y0 + rp * 0.55 - 12, BASE - 14), '잔여', 'st08-ng'));
      } else {
        s += G(C(XC, BASE - 26, 16, 'st08-ok') + T(XC, BASE - 18, '✓', 'st08-ck'), tip('설정 시간에 틈 바닥까지 깨끗'));
        if (gp > 120) s += LB(T(XC + 24, BASE - 19, '깨끗', 'st08-okt', 'start'));
      }
      // redep: 벽 · 바닥 · 윗면에 다시 붙은 점
      const r9 = rng(5);
      let rd = '';
      for (let k = 0; k < 6; k++){ const y = bt + (BASE - bt) * (0.12 + 0.15 * k); rd += C(k % 2 ? gR - 4 : gL + 4, y, 4.5, 'f-res'); }
      for (let k = 0; k < 4; k++) rd += C(gL + gp * (0.15 + 0.23 * k), BASE - 4, 4.5, 'f-res');
      for (let k = 0; k < 5; k++){ rd += C(XL + 8 + r9() * Math.max(10, gL - XL - 16), bt - 4, 4, 'f-res') + C(gR + 8 + r9() * Math.max(10, XR - gR - 16), bt - 4, 4, 'f-res'); }
      s += G(rd, W(only('redep'), tip('다시 붙은 점 — 물을 만나 석출된 PR · 떠다니던 조각')));
      s += LB(T(XL, 1092, `그림은 개념 (예시 값) · 1 µm ≈ ${S.toFixed(0)} px · 시드 두께는 과장`, 't-dim', 'start'));
      return s;
    }
    function gapText(m){
      const need = Math.round(m.need);
      const l2 = st.ag === 'none' ? '담금만 — 틈 안으로 흐름이 거의 들지 않는다' : `소용돌이가 닿는 깊이 ≈ ${fnum(m.reach)} µm (${AGN[st.ag]} — 폭 × ${KV[st.ag]})`;
      const l3 = st.ag === 'none' ? `틈 전체 ${st.h} µm가 정체 — 확산으로만 액이 바뀐다` : m.reach >= st.h ? '바닥까지 소용돌이가 닿는다 — 정체 구역 없음' : `그 아래 ${fnum(st.h - m.reach)} µm는 정체 — 확산으로만 액이 바뀐다`;
      // 잔여 높이(µm)는 그림용 개념값이라 글에는 모델이 주는 '모자란 시간'을 쓴다 (KPI · 종점 띠와 같은 값)
      const l4 = m.ok ? `틈 바닥까지 깨끗 (필요 여유 ${need} %)` : `틈 바닥 잔여 — ${fshort(m.tg - m.ts)} 모자람 (필요 여유 ${need} %)`;
      return LB(T(48, 204, `폭 ${st.g} µm · 깊이 ${st.h} µm → 깊이 : 폭 = ${m.ar.toFixed(2)}`, 't-sub', 'start') + T(48, 232, l2, 't-dim', 'start') + T(48, 258, l3, 't-dim', 'start') + T(48, 288, l4, m.ok ? 'st08-okt' : 'st08-ng', 'start'));
    }
    // ── 오른쪽: 틈 바닥 배수 그래프 (gap 단계) ──
    function graph(m){
      const X = a => 1190 + Math.min(a, 5) / 5 * 340, Y = v => 790 - (Math.min(v, 3.5) - 1) / 2.5 * 460;
      let g = LB(T(1130, 166, '틈 바닥은 몇 배 늦게 걷힐까', 't-acc', 'start') + T(1130, 194, '= 1 + 0.5 × 실질 깊이/폭 (개념 모델)', 't-dim', 'start'));
      const CUR = [['none', 'st08-c0', 1130, '담금만'], ['flow', 'st08-c1', 1240, '순환'], ['spray', 'st08-c2', 1330, '분사 · 메가소닉']];
      CUR.forEach(([k, c, x, nm]) => { g += L(x, 226, x + 26, 226, c + (k === st.ag ? ' st08-on' : '')) + LB(T(x + 32, 233, nm, k === st.ag ? 't-sub' : 't-dim', 'start')); });
      g += L(1190, 330, 1190, 790, 's-axis') + L(1190, 790, 1535, 790, 's-axis');
      [1, 2, 3].forEach(v => { g += L(1190, Y(v), 1535, Y(v), 'st08-gl') + LB(T(1180, Y(v) + 7, '×' + v, 't-dim', 'end')); });
      [0, 1, 2, 3, 4, 5].forEach(a => { g += L(X(a), 790, X(a), 798, 's-axis') + LB(T(X(a), 820, String(a), 't-dim')); });
      g += LB(T(1362, 850, '깊이 ÷ 폭', 't-dim'));
      // 두 기준선 이름이 다른 선에 걸리지 않게: '좁은 피치' 선은 '그림 기준' 글 아래에서 시작
      [[35 / 30, '그림 기준', 354, 336], [35 / 18, '좁은 피치', 390, 368]].forEach(([a, nm, yl, y0]) => { g += L(X(a), y0, X(a), 790, 's-dash') + LB(T(X(a) + 6, yl, nm, 't-dim', 'start')); });
      CUR.forEach(([k, c]) => {
        const kk = KV[k], pts = [[0, 1], [kk, 1], [5, 1 + CG * (5 - kk)]];
        g += P('M' + pts.map(([a, v]) => `${X(a).toFixed(1)},${Y(v).toFixed(1)}`).join(' L'), c + (k === st.ag ? ' st08-on' : ''), tip(`${AGN[k]} — 소용돌이가 폭의 ${kk}배 깊이까지 (가정)`));
      });
      const ys = Y(1 + st.os / 100);
      g += L(1190, ys, 1535, ys, 'st08-set', tip('설정 시간 ÷ 평평한 곳 클리어 = 1 + 여유. 점이 이 선 위에 있으면 틈 바닥 잔여'));
      g += LB(T(1532, ys - 9, `설정 ×${(1 + st.os / 100).toFixed(2)}`, 'st08-sett', 'end'));
      const px = X(m.ar), py = Y(m.mult);
      g += L(px, py, px, 790, 's-dash') + C(px, py, 18, 'co-ring') + C(px, py, 9, m.ok ? 'k-ok' : 'k-ng', tip(`지금: 깊이/폭 ${m.ar.toFixed(2)} → 틈 바닥 ×${m.mult.toFixed(2)}`));
      if (m.ar > 5 || m.mult > 3.5) g += LB(T(px - 14, py + 30, '범위 밖 →', 't-dim', 'end'));
      g += LB(T(1130, 268, `● 지금: 틈 바닥이 ×${m.mult.toFixed(2)} 늦다`, 't-sub', 'start') +
        T(1130, 296, `필요 여유 ${Math.round(m.need)} % · 설정 ${st.os} % → ${m.ok ? '깨끗' : '잔여'}`, m.ok ? 'st08-okt' : 'st08-ng', 'start'));
      return G(g, only('gap'));
    }
    // ── 종점 띠 (모든 단계) ──
    function band(m){
      const tmax = Math.max(m.tg, m.ts) * 1.08, X = t => 1300 + t / tmax * 240;
      let b = LB(T(1130, 934, '종점 — 언제 멈출까 (분, 예시)', 't-acc', 'start'));
      [['평평한 곳', m.tf, 'st08-b0', '평평한 곳 클리어 — 넓은 곳의 PR이 다 걷힌 시각'], ['틈 바닥', m.tg, 'st08-b1', '틈 바닥 클리어 — 가장 늦은 곳이 걷힌 시각'], ['설정', m.ts, 'st08-b2', '설정 시간 = 평평한 곳 클리어 × (1 + 여유)']].forEach(([nm, t, c, tp], i) => {
        const y = 970 + i * 34;
        b += LB(T(1130, y, `${nm} ${fmin(t)}분`, 't-sub', 'start')) + R(1300, y - 15, X(t) - 1300, 18, c, W({rx: 4}, tip(tp)));
      });
      b += L(X(m.ts), 948, X(m.ts), 1044, 'st08-setv', tip('설정 시간'));
      b += LB(T(1130, 1082, m.ok ? `깨끗 — 틈 바닥 클리어보다 ${fmin(m.ts - m.tg)}분 여유` : `틈 바닥 잔여 — ${fshort(m.tg - m.ts)} 모자람`, m.ok ? 'st08-okt' : 'st08-ng', 'start'));
      return b;
    }
    function render(){
      if (!ready) return;
      const m = calc(st.g, st.h, st.ag, st.os);
      ctx.$('[data-v="gz"]').innerHTML = gapZoom(m);
      ctx.$('[data-v="gzt"]').innerHTML = gapText(m);
      ctx.$('[data-v="gg"]').innerHTML = graph(m);
      ctx.$('[data-v="band"]').innerHTML = band(m);
      setSeg('pre', preOf());
      ctx.refresh();
      ctx.out('k-tf', fmin(m.tf)); ctx.out('k-tg', fmin(m.tg)); ctx.out('k-ts', fmin(m.ts)); ctx.out('k-v', m.ok ? '깨끗' : '틈 바닥 잔여');
      const kv = ctx.card.querySelector('[data-o="k-v"]').parentNode;
      kv.classList.toggle('ok', m.ok); kv.classList.toggle('ng', !m.ok);
      const need = Math.round(m.need);
      let msg = need < 1
        ? `${AGN[st.ag]} — 소용돌이가 틈 바닥까지 닿아, 바닥도 평평한 곳과 거의 같이 걷힙니다(깊이 : 폭 ${m.ar.toFixed(2)}).`
        : `틈 바닥은 평평한 곳보다 <b>${m.mult.toFixed(2)}배</b> 늦게 걷힙니다(깊이 : 폭 ${m.ar.toFixed(2)}, ${AGN[st.ag]}). 바닥까지 걷으려면 여유가 <b>${need} %</b> 이상 필요합니다.`;
      msg += m.ok ? ` 지금 여유 ${st.os} %면 틈 바닥까지 깨끗합니다.` : ` 지금 여유 ${st.os} %로는 틈 바닥에 잔여가 남습니다(${fshort(m.tg - m.ts)} 모자람) — 여유를 늘리거나 교반을 키웁니다.`;
      msg += ' 다만 여유가 길수록 담그는 시간만큼 금속 손실도 늡니다 → <a data-go="metal.cu">07장</a>.';
      ctx.q('[data-o=msg]').innerHTML = msg;
    }
    // 손으로 움직이면 그 값을 그대로 둔다. 밑동 확대(foot)에서 움직이면 틈이 보이는 gap 단계로
    const userTouch = () => { touched = true; if (ctx.step() === 'foot') ctx.go('gap'); };
    ctx.range('g', v => { st.g = v; render(); return `${v} µm`; });
    ctx.range('h', v => { st.h = v; render(); return `${v} µm`; });
    ctx.range('os', v => { st.os = v; render(); return `${v} %`; });
    ctx.seg('ag', (v, user) => { st.ag = v; if (user) userTouch(); render(); });
    ctx.seg('pre', (v, user) => {
      if (!user || !PRE[v]) return;
      st.g = PRE[v].g; st.h = PRE[v].h;
      gIn.value = st.g; hIn.value = st.h; ctx.out('g', `${st.g} µm`); ctx.out('h', `${st.h} µm`);
      userTouch(); render();
    });
    [gIn, hIn, oIn].forEach(i => i.addEventListener('input', userTouch));
    ready = true;
    render();
    // 손대기 전에는 단계마다 예시 값으로. 발표 모드에서는 위젯을 만질 수 없으므로 늘 예시 값으로 되돌린다
    ctx.demo = sid => {
      const ep = window.EngrTheatres && window.EngrTheatres.strip;
      if (ep && ep.state && ep.state.pres != null) touched = false;
      const d = DEMO[sid];
      if (touched || !d) return ctx.refresh();
      Object.assign(st, d);
      gIn.value = d.g; hIn.value = d.h; oIn.value = d.os;
      ctx.out('g', `${d.g} µm`); ctx.out('h', `${d.h} µm`); ctx.out('os', `${d.os} %`);
      setSeg('ag', d.ag);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['깊이 : 폭 (종횡비)', '틈의 깊이를 폭으로 나눈 값. 클수록 바닥까지 액이 늦게 바뀐다 (그림 기준 35 ÷ 30 ≈ 1.2, 피치 40 µm 예시 35 ÷ 18 ≈ 1.9)'],
      ['클리어 · 오버 스트립', '클리어 = 눈에 보이는 PR이 다 걷힌 시각. 오버 스트립(여유 시간) = 그 뒤에 더 두는 시간 — 보이지 않는 곳까지 걷기 위함'],
      ['재석출 · 재부착', '녹았던 PR이 물을 만나 다시 고체로 나오는 것 · 떠다니던 조각이 다시 붙는 것'],
      ['치마', '도금 중 PR이 들떠, 범프 밑동 둘레로 금속이 얇게 번진 것. 위의 PR을 물고 놓지 않는다'],
      ['버섯 머리 (오버 도금)', '금속이 PR 높이를 넘어 옆으로 퍼진 머리. 머리 아래 PR에는 액이 잘 닿지 않는다'],
      ['에지 비드 · EBR', '돌려 바른 PR이 웨이퍼 가장자리에 두껍게 쌓인 턱(에지 비드)과, 그것을 씻어 내는 가장자리 세정(EBR). 경계에도 턱이 남는다'],
      ['접촉각', '물방울이 표면과 이루는 각. 얇은 유기막이 있으면 보통 커진다'],
      ['XPS · EDS · AOI', '표면 수 nm의 성분 분석 · 전자현미경의 성분 분석 · 자동 광학 외관 검사']
    ]) + K.field([
      '잔여물은 <b>어디에</b> 있는지가 원인을 말해 줍니다: 틈 바닥 → 시간 · 교반 · 깊이/폭, 밑동 → PR 발 · 들뜸[앞 공정], 가장자리 고리 → EBR 경계 PR 턱 · 노치 · 베벨/뒷면으로 넘어간 PR(도포 · EBR — [앞 공정])과 매엽 가장자리 액[스트립-장비], 웨이퍼 전체 얇은 얼룩 → 액 나이 · 헹굼, 흩어진 점 → 조각 · 필터 → <a data-go="defects.tiles">09장</a>.',
      '잔여 확인용 SEM 자리는 가장 좁은 틈 · 가장 두꺼운 PR 자리 · 버섯 머리가 생기기 쉬운 고립 범프 · <b>EBR 경계와 노치(가장자리 몇 mm)</b>로 정해 둡니다. 피치가 55 → 40 µm로 좁아지면(같은 PR 35 µm) 틈 바닥 시간이 크게 늘 수 있으니 클리어 시간을 다시 잽니다.',
      '물 접촉각이 갑자기 오르면 얇은 유기막을 의심합니다(같은 측정 조건 · 같은 대기 시간에서 비교).',
      'PR이 걷힌 직후는 범프 높이 · 지름 · 높이 고름(동일 평면성)을 처음 바로 잴 수 있는 자리입니다. 높이 이상은 보통 도금[앞 공정] 쪽이고, 스트립이 바꾸는 것은 표면 · 잔여입니다 — 측정 결과를 받으면 먼저 이 둘을 가릅니다.',
      '시드 식각 뒤 범프 사이 누설 · 브리지가 늘면 스트립 잔여와 시드 식각 부족을 함께 봅니다 → <a href="#go-etch-07">시드 식각 07장</a> · <a href="#go-etch-09">09장</a>. 리플로우 뒤 모양 · 젖음 불량과 보이드도 보이지 않는 유기막에서 올 수 있습니다 → <a href="#go-reflow-04">리플로우 04장</a> · <a href="#go-reflow-07">07장</a>.'
    ]) + K.deep(`<p>위젯의 개념 모델 (가정 계수 — 경향만):</p>
      ${K.eq('t_평평 = h ÷ r,  1/r = 1/r_겉 + 1/r_공급   (03장 녹는 PR)')}
      ${K.eq('t_바닥 = t_평평 × [1 + 0.5 × max(0, h − k·g) / g],  k = 0 · 0.5 · 1')}
      ${K.eq('필요한 여유 = t_바닥 ÷ t_평평 − 1')}
      <ul><li><b>공동(캐비티) 흐름</b> — 열린 틈 위를 흐름이 지나가면 틈 안에 소용돌이가 생기지만, 깊이/폭이 크면 아래쪽으로 갈수록 소용돌이가 훨씬 약해져 바닥은 사실상 확산으로만 액이 바뀝니다(보통 깊이/폭 1~2 이상부터 — 형상 · 흐름에 따라). 위젯의 k는 '소용돌이가 폭의 몇 배 깊이까지 닿나'를 거칠게 나타낸 가정입니다. 예: 그림 기준(1.2) · 순환이면 필요 여유 약 33 %, 피치 40 µm(1.9)면 약 72 %, PR 60 µm(전해도금 02장 예시, 틈 30 µm)면 약 75 %. 전해도금의 깊은 구멍 속 공급(<a href="#go-plating-08">전해도금 08장</a>)과 같은 이야기입니다.</li>
      <li><b>재석출</b> — 물의 수소결합 성분(한센 δH 약 42 MPa^½)은 NMP(약 7) · DMSO(약 10)보다 훨씬 커서, 녹은 PR(노볼락 등)은 물이 많아지면 더는 녹아 있지 못합니다. 스트리퍼 : 물 비율이 어느 선을 넘으면 뿌옇게 석출됩니다. 여러 공개 특허는 물 헹굼 전에 유기 용제로 먼저 헹구라고 권하고, 반대로 물로 바로 헹궈도 석출이 덜하게 만든 약품도 있습니다 — 헹굼 순서는 약품 공급사가 검증한 순서를 따릅니다(<a data-go="metal.rinse">07장</a>). 헹굼이 너무 짧으면 스트리퍼 자신의 성분(4차 암모늄 · 아민 염, 억제제)이 남아 얇은 막이 되기도 합니다.</li>
      <li><b>얇은 막 찾기</b> — XPS · ToF-SIMS(표면 수 nm의 C · N), 접촉각(빠르고 싸지만 대기 시간 · 측정 조건에 민감), 형광 검사(남은 PR이 빛을 받아 형광을 냄 — 공개 특허 예: 포지티브는 보통 적색 · 주황, 네거티브는 노랑. 웨이퍼 전체를 빨리 훑지만 아주 얇은 막 · 형광이 없는 유기물은 못 봄), FTIR(두꺼운 막), EDS(탄소 — 얇은 막은 가속 전압을 낮춰도 잘 안 보일 수 있음). 표본 검사(XPS · SEM)와 전수 검사(AOI · 형광)를 짝지어 씁니다.</li>
      <li><b>가장자리 고리</b> — 두꺼운 PR을 돌려 바르면 가장자리에 PR 턱(에지 비드)이 생기고, EBR 뒤에도 경계에 평평한 곳보다 두꺼운 턱이 남습니다. 노치에서는 더 두껍고 베벨 · 뒷면으로 넘어가기도 하며, 20~30 µm가 넘는 막은 EBR 자체가 어렵다는 공개 특허 서술도 있습니다. 가교 PR이면 시간이 두께보다 빠르게 늘어(<a data-go="soak.square">03장</a>) 가장 늦게 걷히는 자리가 되기 쉽고, 매엽에서는 가운데에 뿌린 액이 가장자리에서 가장 식고 지쳐 있습니다. 도금 립씰 자리와도 이웃합니다[앞 공정].</li>
      <li><b>종점</b> — 배치 탱크는 보통 시간으로 정하고, 매엽은 광학으로 클리어를 보기도 합니다. 설정 시간은 '평평한 곳 클리어 × (1 + 여유)'처럼 정하되, 여유는 가장 늦은 자리(좁은 틈 · 밑동 · 가장자리)의 클리어를 SEM으로 확인해 정합니다. 클리어 시간은 액 나이와 함께 늘어나므로 정기적으로 다시 잽니다(<a data-go="bath.rule">06장</a>).</li>
      <li><b>잔여 → 시드 식각 · 리플로우</b> — 유기막은 식각액이 시드에 닿는 것을 늦춰 국부 시드 잔여 → 범프 사이 누설 · 단락이 됩니다(<a href="#go-bump">범프 공정</a> 탭 07 → 08, <a href="#go-etch-07">시드 식각 07장</a>). 솔더 겉의 얇은 유기막은 리플로우 때 녹은 솔더가 고르게 둥글어지는 것을 막거나(<a href="#go-reflow-04">리플로우 04장</a>), 열에 분해되며 기체를 내 보이드의 씨앗이 되기도 합니다(<a href="#go-reflow-07">리플로우 07장</a>). 잔여를 없애려 오버 스트립을 늘리면 금속 손실이 늘어나므로 두 창을 함께 봅니다. 디스컴과 비슷한 짧은 O₂ 플라즈마로 얇은 잔여를 정리하기도 하지만 솔더 표면 산화를 키울 수 있어, 리플로우 전 처리(범프 공정 탭 09 PLT · <a href="#go-reflow-03">리플로우 03장</a>)와 함께 설계합니다.</li>
      <li><b>가교 조각 끼임</b> — 들뜬 가교 PR은 범프 숲에 구멍 뚫린 판처럼 걸려 있어 위로 빠져나와야 합니다. 피치가 좁거나 버섯 머리가 있으면 판이 걸려 잔여 · 범프 손상의 원인이 될 수 있습니다(조건에 따라). 고압 분사는 판을 깨서 빼내는 데 돕지만, 세게 할수록 가는 범프가 기울 위험이 있습니다(<a data-go="tool.agit">05장</a>).</li></ul>`);
  },
  css: `.st08-lens{fill:rgba(125,211,252,.14);stroke:#7dd3fc;stroke-width:2.4}
.st08-lensh{stroke:#7dd3fc;stroke-width:4;stroke-linecap:round}
.pl-svg .st08-fl0{animation-duration:3.2s;opacity:.35}
.pl-svg .st08-fl2{animation-duration:.4s;opacity:1;stroke-width:2.6}
.pl-svg .st08-vx{stroke:#7dd3fc;stroke-width:2.4;opacity:.75}
.st08-dot{fill:#7dd3fc}
.st08-dif{fill:#c4b5fd;opacity:.85}
.st08-still{stroke:rgba(148,163,184,.4);stroke-width:1;stroke-dasharray:4 4}
.st08-dim{fill:none;stroke:#f59e0b;stroke-width:2.2}
.st08-prt{fill:none;stroke:#c4b5fd;stroke-width:2;stroke-dasharray:8 6}
.st08-ok{fill:#22c55e;stroke:#bbf7d0;stroke-width:1.5}
.pl-svg .st08-ck{font-size:22px;font-weight:900;fill:#052e16 !important;stroke:none !important;text-anchor:middle}
.pl-svg .st08-ng{font-size:19px;font-weight:800;fill:#fca5a5 !important}
.pl-svg .st08-okt{font-size:19px;font-weight:800;fill:#86efac !important}
.st08-mk0{fill:#1e293b;stroke:#94a3b8;stroke-width:1.6}
.st08-mk1{fill:#f59e0b;stroke:#fde68a;stroke-width:2}
.pl-svg .st08-mkt{font-size:17px;font-weight:900;fill:#e2e8f0 !important;text-anchor:middle}
.pl-svg .st08-mkt1{font-size:18px;font-weight:900;fill:#1b1203 !important;stroke:none !important;text-anchor:middle}
.st08-hot{fill:none;stroke:#f87171;stroke-width:2.4;stroke-dasharray:6 5}
.st08-shade{fill:rgba(2,6,16,.55)}
.st08-brk{fill:#0b1222}
.st08-wv{fill:none;stroke:#e2e8f0;stroke-width:2.4}
.st08-waf{fill:#26354f;stroke:#94a3b8;stroke-width:1.6}
.st08-grid{stroke:rgba(148,163,184,.22);stroke-width:1}
.st08-excl{fill:rgba(245,158,11,.16)}
.st08-ebr{fill:none;stroke:#f59e0b;stroke-width:2;stroke-dasharray:6 5}
.st08-diehl{fill:rgba(56,189,248,.28);stroke:#38bdf8;stroke-width:2}
.st08-tg.up{fill:rgba(167,139,250,.32)}
.st08-tg.cond{fill:rgba(45,212,191,.28)}
.pl-svg .st08-tgt{font-size:17px;font-weight:800;fill:#e2e8f0 !important;text-anchor:middle}
.st08-dis{fill:#c4b5fd}
.st08-grain{fill:rgba(203,213,225,.8);stroke:#f1f5f9;stroke-width:.8}
.st08-cloud{fill:rgba(226,232,240,.13)}
.st08-drop{fill:rgba(125,211,252,.75);stroke:#bae6fd;stroke-width:1}
.st08-zthin{fill:rgba(167,139,250,.10)}
.st08-zvis{fill:rgba(245,158,11,.08)}
.pl-svg .st08-zt{font-size:19px;font-weight:700;fill:#c4b5fd !important;text-anchor:middle}
.pl-svg .st08-zt2{font-size:19px;font-weight:700;fill:#fcd34d !important;text-anchor:middle}
.st08-bar{fill:rgba(125,211,252,.5);stroke:#7dd3fc;stroke-width:1.2}
.st08-bar.st08-bt{fill:rgba(167,139,250,.6);stroke:#c4b5fd}
.st08-bar.st08-bv{fill:rgba(245,158,11,.55);stroke:#fcd34d}
.st08-gl{stroke:rgba(148,163,184,.14);stroke-width:1}
.st08-c0,.st08-c1,.st08-c2{fill:none;stroke-width:2.4;opacity:.5}
.st08-c0{stroke:#f87171}
.st08-c1{stroke:#38bdf8}
.st08-c2{stroke:#4ade80}
.pl-svg .st08-on{stroke-width:4.4;opacity:1}
.st08-set{stroke:#f8fafc;stroke-width:2.2;stroke-dasharray:9 6}
.pl-svg .st08-sett{font-size:19px;font-weight:800;fill:#f8fafc !important}
.st08-setv{stroke:#f8fafc;stroke-width:3}
.st08-b0{fill:rgba(56,189,248,.6)}
.st08-b1{fill:rgba(245,158,11,.65)}
.st08-b2{fill:rgba(226,232,240,.45)}`
});
})();
