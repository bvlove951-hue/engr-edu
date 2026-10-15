/* PR 스트립 04 — 스트리퍼 약품: 병 속에는 무엇이 들어 있고, 각각 무슨 일을 할까 (약품 · 분자) */
(function(){
// ── 개념 모델 (상대값 · 가정값 — 기획 rev.2의 04장 모델 그대로) ──
// 포지티브 녹임 = 5·S·(1 − w/40)·A50·(1 + 0.3B), 가교 공격 = 5·(0.3S + 1.2·B·g_w)·A50 (둘 다 최대 10)
// r_Cu = 2·A60·(0.1 + f_w)·B_Cu·I_Cu, r_Sn = 3·A60·(0.1 + f_w)·B_Sn·I_Sn (nm/분, 가정), f_w = w/(w+2)
// g_w (알칼리 힘에 대한 물 효과, 가정): 아민 w/(w+2) — 물을 만나야 OH⁻ · TMAH 1/(1 + w/3) — 물이 OH⁻를 감싸 약하게 함
const RG = 8.314, TREF = 343.15;                                   // 기준 70 °C
const arr = (Ea, T) => Math.exp(-(Ea / RG) * (1 / (T + 273.15) - 1 / TREF));
const SOL = {nmp: {S: 1.0, fp: 91, nm: 'NMP'}, dmso: {S: 0.95, fp: 88, nm: 'DMSO'}};          // 용제 힘(가정) · 인화점(약, 밀폐식)
const BASE = {none: {B: 0, cu: 0.05, sn: 0.05, nm: '알칼리 없음'}, amine: {B: 0.5, cu: 1.0, sn: 0.3, nm: '아민'}, tmah: {B: 1.0, cu: 0.5, sn: 1.0, nm: 'TMAH'}};
const gw = (b, w) => b === 'amine' ? w / (w + 2) : b === 'tmah' ? 1 / (1 + w / 3) : 0;
const MARGIN = 10;                                                 // 인화점 예시 경고선: 인화점 − 10 °C (가정 — 03장과 같음)
function calc(s){
  const S = SOL[s.sol].S, b = BASE[s.base], a50 = arr(50000, s.T), a60 = arr(60000, s.T), fw = s.w / (s.w + 2);
  const pos = Math.min(10, 5 * S * (1 - s.w / 40) * a50 * (1 + 0.3 * b.B));
  const xl = Math.min(10, 5 * (0.3 * S + 1.2 * b.B * gw(s.base, s.w)) * a50);
  const cu = 2.0 * a60 * (0.1 + fw) * b.cu * (s.inh === 'on' ? 0.1 : 1);
  const sn = 3.0 * a60 * (0.1 + fw) * b.sn * (s.inh === 'on' ? 0.4 : 1);
  return {pos, xl, cu, sn, a50, a60, fpm: SOL[s.sol].fp - s.T};
}
const xlAt = (S, base, w, a50) => Math.min(10, 5 * (0.3 * S + 1.2 * BASE[base].B * gw(base, w)) * a50);
// 손대지 않았을 때 단계마다 보여 줄 배합 — 한 단계에 성분 하나씩 더해 간다 (용제만 → 알칼리 → 물 · TMAH → 억제제 → 안전)
const DEMO = {
  solvent: {sol: 'dmso', base: 'none', w: 0, inh: 'off', T: 70},
  base: {sol: 'dmso', base: 'amine', w: 3, inh: 'off', T: 70},
  water: {sol: 'dmso', base: 'tmah', w: 10, inh: 'off', T: 70},
  inhib: {sol: 'dmso', base: 'amine', w: 3, inh: 'on', T: 70},
  safety: {sol: 'nmp', base: 'tmah', w: 3, inh: 'on', T: 85}
};

// ── 비커 속 분자 자리 (결정적 난수 — 그림이 매번 같게) ──
function rand(seed){ let k = seed % 2147483647; if (k <= 0) k += 2147483646; return () => ((k = (k * 16807) % 2147483647) - 1) / 2147483646; }
function spots(n, seed, d, avoid, x0, x1, y0, y1){
  const g = rand(seed), out = [];
  for (let t = 0; t < 8000 && out.length < n; t++){
    const x = x0 + g() * (x1 - x0), y = y0 + g() * (y1 - y0);
    if (out.some(p => Math.hypot(p[0] - x, p[1] - y) < d) || avoid.some(p => Math.hypot(p[0] - x, p[1] - y) < p[2])) continue;
    out.push([x, y]);
  }
  return out;
}
const SP_B = spots(8, 11, 84, [], 292, 628, 400, 830);                                   // 알칼리 (TMAH는 오른쪽 위로 OH⁻가 붙는다)
const SP_S = spots(30, 23, 36, SP_B.map(p => [p[0] + 10, p[1] - 4, 46]), 284, 678, 392, 846);
const SP_W = spots(40, 37, 22, SP_B.map(p => [p[0] + 10, p[1] - 4, 38]).concat(SP_S.map(p => [p[0], p[1], 14])), 284, 678, 392, 846);
// 제자리에서 흔들리는 분자: inner 는 (0,0) 기준 그림
function wob(x, y, seed, amp, inner){
  const g = rand(seed * 131 + 7);
  let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
  for (let k = 0; k < 4; k++) d += ` L${(x + (g() - 0.5) * 2 * amp).toFixed(1)},${(y + (g() - 0.5) * 2 * amp).toFixed(1)}`;
  return `<g>${inner}<animateMotion dur="${(3.4 + g() * 2.6).toFixed(1)}s" begin="-${(g() * 4).toFixed(1)}s" repeatCount="indefinite" path="${d} Z"/></g>`;
}
const GL = {
  sol: '<circle r="7" class="st04-sol"/>',
  amine: '<circle r="15" class="st04-am"/><text y="6" class="st04-mt">N</text>',
  tmah: '<circle r="15" class="st04-am"/><text y="5.5" class="st04-mt">N⁺</text><circle cx="27" cy="-14" r="15" class="st04-oh"/><text x="27" y="-9" class="st04-mt2">OH⁻</text>',
  w: '<circle r="5" class="st04-w"/>'
};
// 경로를 따라 움직이며 나타났다 사라지는 작은 동그라미 (글자 포함)
function flyer(cls, label, path, dur, delay, tcls = 'st04-mt2'){
  const b = `begin="-${delay.toFixed(1)}s"`;
  return `<g><circle r="15" class="${cls}"/><text y="5" class="${tcls}">${label}</text><animateMotion dur="${dur}s" ${b} repeatCount="indefinite" path="${path}"/><animate attributeName="opacity" values="0;1;1;1;0" dur="${dur}s" ${b} repeatCount="indefinite"/></g>`;
}
// 녹아 나가는 금속 (액 속에서는 착이온 · 주석산 이온 — 그림은 원소 이름만)
function leave(kind, path, dur, delay){
  const b = `begin="-${delay.toFixed(1)}s"`;
  return `<g class="pl-ion ${kind}"><circle r="15"/><text y="5" text-anchor="middle">${kind === 'cu' ? 'Cu' : 'Sn'}</text><animateMotion dur="${dur}s" ${b} repeatCount="indefinite" path="${path}"/><animate attributeName="opacity" values="0;1;1;0" dur="${dur}s" ${b} repeatCount="indefinite"/></g>`;
}
// 글자 폭 어림 (한글 1em, 영문 · 숫자 약 0.56em, 그 밖 0.9em)
const emw = s => [...String(s)].reduce((a, c) => a + (/[ㄱ-힝]/.test(c) ? 1 : /[A-Za-z0-9 .,:;'()\-]/.test(c) ? 0.56 : 0.9), 0);

// ── 오른쪽 패널 그림 조각 ──
// NMP: 5각 고리(락탐) — N에 CH₃, 옆 탄소에 =O
function nmpMol(K, cx, cy){
  const {L, T} = K, r = 44, rad = a => a * Math.PI / 180;
  const V = [-90, -18, 54, 126, 198].map(a => [cx + r * Math.cos(rad(a)), cy + r * Math.sin(rad(a))]);
  const cut = (a, b, ca, cb) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy); return L(a[0] + dx / l * ca, a[1] + dy / l * ca, b[0] - dx / l * cb, b[1] - dy / l * cb, 'st04-bond'); };
  let s = cut(V[0], V[1], 0, 0) + cut(V[1], V[2], 0, 0) + cut(V[2], V[3], 0, 14) + cut(V[3], V[4], 14, 0) + cut(V[4], V[0], 0, 0);
  const N = V[3], dm = [Math.cos(rad(126)), Math.sin(rad(126))];
  s += L(N[0] + dm[0] * 14, N[1] + dm[1] * 14, N[0] + dm[0] * 36, N[1] + dm[1] * 36, 'st04-bond') + T(N[0] + dm[0] * 54, N[1] + dm[1] * 54 + 8, 'CH₃', 'st04-at');
  const C = V[4], dO = [Math.cos(rad(198)), Math.sin(rad(198))], nx = -dO[1] * 4, ny = dO[0] * 4, O = [C[0] + dO[0] * 46, C[1] + dO[1] * 46];
  [1, -1].forEach(k => { s += L(C[0] + nx * k, C[1] + ny * k, O[0] - dO[0] * 13 + nx * k, O[1] - dO[1] * 13 + ny * k, 'st04-bond'); });
  s += T(N[0], N[1] + 8, 'N', 'st04-at') + T(O[0], O[1] + 8, 'O', 'st04-at');
  return s;
}
// DMSO: S=O 와 CH₃ 두 개
function dmsoMol(K, cx, cy){
  const {L, T} = K;
  let s = L(cx - 4, cy - 15, cx - 4, cy - 46, 'st04-bond') + L(cx + 4, cy - 15, cx + 4, cy - 46, 'st04-bond') + T(cx, cy - 52, 'O', 'st04-at');
  [[-1, 'H₃C'], [1, 'CH₃']].forEach(([k, t]) => { s += L(cx + k * 12, cy + 9, cx + k * 37, cy + 28, 'st04-bond') + T(cx + k * 56, cy + 46, t, 'st04-at'); });
  return s + T(cx, cy + 8, 'S', 'st04-at');
}
// 그물(가교 PR) — 사슬 i 의 x 위치에서 y
const CH_Y = [236, 310, 384, 458, 532], chy = (i, x) => CH_Y[i] + 8 * Math.sin(x / 38 + i * 1.3);
const XL = [[930, 0], [1190, 0], [1070, 1], [1390, 1], [900, 2], [1250, 2], [1010, 3], [1330, 3]], BRK = [1, 5];

(window.EngrStripChapters = window.EngrStripChapters || []).push({
  no: '04', id: 'chem', part: 2, short: '스트리퍼 약품', scale: '약품 · 분자',
  title: '스트리퍼 약품 — 병 속에는 무엇이 들어 있고, 각각 무슨 일을 할까?',
  hook: '녹이는 힘과 지키는 힘',
  // 좁은(세로) 화면: 단계마다 바뀌는 오른쪽 패널을 크게 (비커 · 막대는 넓은 화면에서)
  viewN: {x: 780, y: 124, w: 784, h: 984},
  one: '스트리퍼는 PR을 녹이는 용제가 몸통이고, 가교된 PR을 공격하는 알칼리, 알칼리 종류에 따라 돕기도 해치기도 하는 물, 금속을 지키는 부식 억제제가 조금씩 들어갑니다. 녹이는 힘을 키우면 금속도 함께 먹히기 쉬워, 둘의 균형이 핵심입니다.',
  ana: '<b>설거지 세제</b> — 기름때(PR)를 녹이는 성분(용제), 눌어붙은 때를 불리는 성분(알칼리), 그릇이 상하지 않게 하는 성분(억제제)이 함께 들어 있습니다. 세게 만들수록 때는 잘 빠지지만 은수저(금속)가 변색될 수 있습니다. <i>(한계: 스트리퍼는 물이 주성분이 아닌 경우가 많고, 몇 °C · 몇 % 물 차이로 금속 손실이 크게 달라집니다. 또 성분은 날아가거나 분해되어 시간이 지나며 바뀝니다 → <a data-go="bath.age">06장</a>.)</i>',
  steps: [
    {id: 'solvent', t: '몸통 — 극성 용제 (NMP · DMSO)', d: '몸통은 PR 수지와 성질이 비슷해 PR을 잘 녹이는 극성 용제(분자 안 전기가 한쪽으로 치우친 용제)입니다. 대표가 NMP와 DMSO이고, 보통 60~80 °C로 데워 씁니다. 둘 다 물과 잘 섞이고 공기 중 물을 빨아들입니다(흡습성).'},
    {id: 'base', t: '알칼리 — 아민 · TMAH', d: '아민이나 TMAH(수산화 테트라메틸암모늄) 같은 알칼리는 수지의 산성기(H⁺를 내놓는 자리 — 페놀 · 카복실산)를 이온으로 바꾸고 그물의 일부 결합을 끊어, 가교 PR이 잘 부풀고 녹게 돕습니다. 대신 Cu · Sn을 먹는 힘도 함께 커집니다.'},
    {id: 'water', t: '물 — 알칼리에 따라 돕기도 해치기도', d: '물의 효과는 알칼리 종류에 따라 다릅니다. 아민은 물이 조금 있어야 OH⁻를 냅니다. TMAH는 처음부터 OH⁻를 갖고 있어, 물이 적은 DMSO 속에서 오히려 훨씬 셉니다. 어느 쪽이든 물이 많으면 금속 부식이 빨라지고 녹아 있던 PR이 다시 석출될 수 있어, 물 함량은 관리 항목입니다.'},
    {id: 'inhib', t: '부식 억제제 — 금속 겉에 얇은 막', d: '부식 억제제는 금속 표면에 아주 얇게 달라붙어 알칼리 · 산소가 금속에 닿는 것을 막습니다. Cu에는 아졸류(벤조트라이아졸 등)가 대표입니다. 억제제 막이 두껍게 남으면 그것도 잔여물이 됩니다.'},
    {id: 'safety', t: '안전과 규제', d: '데운 용제는 인화점(증기에 불이 붙을 수 있는 가장 낮은 온도 — NMP 약 91 °C, DMSO 약 87~89 °C)에 가까워 온도 · 배기 · 화재 관리가 필요합니다. NMP는 생식 독성으로 규제가 강해지는 중입니다. TMAH는 피부로 흡수되어 치명적일 수 있습니다.'}
  ],
  icon(K){
    const {P, C} = K;
    return P('M26,4 L38,4 L38,15 Q47,20 47,29 L47,50 Q47,55 42,55 L22,55 Q17,55 17,50 L17,29 Q17,20 26,15 Z', 'st04-bottle') + P('M18,30 L46,30 L46,50 Q46,54 42,54 L22,54 Q18,54 18,50 Z', 'f-strip') + K.R(24, 2, 16, 5, 'st04-cap', {rx: 1.5}) + C(25, 43, 4.5, 'st04-sol') + C(33, 36, 5, 'st04-am') + C(39, 47, 4, 'st04-inhh') + C(30, 49, 2.6, 'st04-w');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, wrap} = K;
    let s = '';
    // ── 왼쪽: 비커 (지금 배합) ──
    s += T(60, 136, '비커 속 — 지금 배합', 't-acc', 'start');
    s += '<g data-v="rec"></g><g data-v="tags"></g>';
    s += P('M103,300 L103,914 Q103,933 122,933 L678,933 Q697,933 697,914 L697,300 Z', 'f-strip', tip('스트리퍼 액 — 데운 극성 용제에 알칼리 · 물 · 억제제가 조금씩'));
    s += L(103, 300, 697, 300, 'st04-surf') + '<g data-v="vap"></g>';
    s += P('M100,226 L100,916 Q100,936 120,936 L680,936 Q700,936 700,916 L700,226', 'f-tank');
    s += '<g data-v="leg"></g><g data-v="pr"></g><g data-v="mol" data-noov="1"></g>';
    s += R(150, 890, 230, 30, 'f-cu2', tip('Cu 시편 — 범프 기둥 · 시드와 같은 금속')) + R(420, 890, 230, 30, 'f-sn2', tip('SnAg 시편 — 범프 모자(솔더)와 같은 금속'));
    s += LB(T(265, 912, 'Cu 시편', 'st04-pt') + T(535, 912, 'SnAg 시편', 'st04-pt'));
    s += '<g data-v="inh"></g><g data-v="ions" data-noov="1"></g><g data-v="therm"></g>';
    // 막대 (위젯 결과)
    s += T(60, 962, '같은 시간 동안 — 녹이는 힘 vs 금속이 먹히는 힘 (상대 0~10)', 't-dim', 'start');
    s += '<g data-v="bars"></g>';

    // ── 오른쪽 패널 ──
    s += R(780, 124, 784, 984, 'pl-panel', {rx: 16});

    // solvent: NMP · DMSO 카드 + 한센 막대
    let sv = T(804, 160, '몸통 — 극성 용제 두 가지 (성질 비교 · 보통 값)', 't-acc', 'start');
    sv += R(800, 178, 744, 266, 'pl-box', {rx: 12}) + R(800, 456, 744, 266, 'pl-box', {rx: 12}) + '<g data-v="solhl"></g>';
    sv += G(nmpMol(K, 905, 318), tip('NMP (N-메틸-2-피롤리돈) — 질소가 든 5각 고리 + C=O. 극성이 크고 물과 잘 섞인다'));
    sv += T(1010, 214, 'NMP (N-메틸-2-피롤리돈)', 'pl-hdg', 'start');
    sv += TT(1010, 252, ['끓는점 202 °C · 어는점 약 −24 °C', '인화점 약 91 °C (자료에 따라 86~95)', '물과 완전히 섞임 · 흡습성 있음', '오래 쓰여 온 대표 스트리퍼 용제', '생식 독성 → 규제가 강해지는 중'], 't-sub', 'start', 36);
    sv += G(dmsoMol(K, 905, 612), tip('DMSO (다이메틸 설폭사이드) — S=O 하나에 CH₃ 두 개. 극성이 크고 물과 잘 섞인다'));
    sv += T(1010, 492, 'DMSO (다이메틸 설폭사이드)', 'pl-hdg', 'start');
    sv += TT(1010, 530, ['끓는점 189 °C · 어는점 18.5 °C', '인화점 약 87~89 °C (밀폐식)', '물과 완전히 섞임 · 흡습성 강함', '실온 근처에서 언다 → 보관 · 배관 온도 관리', 'NMP와 성능이 비슷한 대체 용제'], 't-sub', 'start', 36);
    sv += T(804, 760, '비슷한 것끼리 녹는다 — 한센 용해도 매개변수 (MPa½)', 't-acc', 'start');
    const HC = [['st04-hd', 'δD 분산력'], ['st04-hp', 'δP 극성'], ['st04-hh', 'δH 수소결합']];
    HC.forEach(([c, t], k) => { sv += R(812 + k * 190, 780, 22, 18, c) + T(842 + k * 190, 796, t, 't-dim', 'start'); });
    const HS = [['NMP', 18.0, 12.3, 7.2], ['DMSO', 18.4, 16.4, 10.2], ['IPA', 15.8, 6.1, 16.4], ['물', 15.5, 16.0, 42.3]];
    HS.forEach(([nm, d, p, h], k) => {
      const c = 900 + k * 180;
      let g = '';
      [d, p, h].forEach((v, j) => { g += R(c - 57 + j * 40, 1030 - v * 4, 34, v * 4, HC[j][0]); });
      g += LB(T(c + 40, 1022 - h * 4, h.toFixed(1), 't-dim'));
      g += T(c, 1058, nm, 't-sub');
      sv += G(g, tip(`${nm} — δD ${d} · δP ${p} · δH ${h} MPa½ (자료마다 소수 차이)`));
    });
    sv += L(830, 1030, 1530, 1030, 's-axis');
    sv += T(812, 1092, '물은 δH가 너무 커서 PR과 멀다 → 못 녹이고, 녹은 PR은 다시 석출', 't-dim', 'start');
    s += G(sv, only('solvent'));

    // base: 가교 그물 + 끊김 + 얻는 것 / 잃는 것
    let bs = T(804, 160, '알칼리가 하는 일 — 가교 그물을 공격한다', 't-acc', 'start');
    bs += R(800, 178, 744, 480, 'pl-box', {rx: 12});
    let ch = '';
    CH_Y.forEach((y, i) => { const pts = []; for (let x = 840; x <= 1504; x += 12) pts.push([x, chy(i, x)]); ch += K.PL(pts, 'st04-chain'); });
    XL.forEach(([x, i], k) => {
      const y0 = chy(i, x) + 5, y1 = chy(i + 1, x) - 5, m = (y0 + y1) / 2;
      if (!BRK.includes(k)){ ch += L(x, y0, x, y1, 'st04-xl') + C(x, m, 8, 'st04-xn'); return; }
      const an = dy => `<animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 ${dy};0 ${dy};0 0" keyTimes="0;.25;.45;.85;1" dur="4s" repeatCount="indefinite"/>`;
      ch += `<g>${L(x, y0, x, m - 3, 'st04-xl')}${P(`M${x - 8},${m - 3} A8,8 0 0 1 ${x + 8},${m - 3} Z`, 'st04-xn')}${an(-12)}</g>`;
      ch += `<g>${L(x, m + 3, x, y1, 'st04-xl')}${P(`M${x - 8},${m + 3} A8,8 0 0 0 ${x + 8},${m + 3} Z`, 'st04-xn')}${an(12)}</g>`;
      ch += `<g data-noov="1">${C(x + 40, m, 16, 'st04-oh')}${T(x + 40, m + 5, 'OH⁻', 'st04-mt2')}</g>`;
    });
    // 산성기 −OH → −O⁻ (이온이 됨)
    const AC = [[1110, 0, -1], [880, 1, 1], [1420, 3, 1], [980, 4, 1], [1340, 4, 1]];
    AC.forEach(([x, i, sd], k) => {
      const y = chy(i, x) + sd * 30 + 6, b = `dur="4s" begin="-${k * 0.7}s" repeatCount="indefinite"`;
      ch += `<g data-noov="1"><text x="${x}" y="${y}" class="st04-acid" text-anchor="middle">−OH<animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;.3;.4;.85;1" ${b}/></text><text x="${x}" y="${y}" class="st04-acid2" text-anchor="middle">−O⁻<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.3;.4;.85;1" ${b}/></text></g>`;
    });
    bs += G(ch, tip('가교 PR의 그물 — 사슬(수지)을 다리(가교점)가 묶는다. 알칼리가 산성기를 이온으로 바꾸고 다리 일부를 끊는다'));
    bs += L(820, 632, 852, 632, 'st04-chain') + T(862, 639, '사슬(수지)', 't-dim', 'start') + C(1000, 632, 8, 'st04-xn') + T(1016, 639, '다리(가교점)', 't-dim', 'start') + T(1180, 639, '−OH → −O⁻ 산성기가 이온으로', 'st04-acid2', 'start');
    bs += T(804, 700, '−OH + OH⁻ → −O⁻ + H₂O', 'pl-eqn', 'start');
    bs += TT(804, 732, wrap('산성기(페놀 · 카복실산)가 이온이 되면 용제 · 물을 더 끌어들여 그물이 부풀고, 알칼리는 다리(에스터 등) 일부도 끊습니다.', 38), 't-dim', 'start', 25);
    bs += R(800, 784, 362, 316, 'st04-gain', {rx: 12}) + R(1182, 784, 362, 316, 'st04-loss', {rx: 12});
    bs += T(820, 818, '얻는 것 — 녹이는 힘 ↑', 'pl-hdg3', 'start') + TT(820, 852, wrap('가교 PR이 잘 부풀고, 그물이 끊겨 녹거나 들뜹니다.', 15), 't-sub', 'start', 28);
    bs += T(1202, 818, '잃는 것 — 금속이 먹힘 ↑', 'pl-hdg2', 'start') + TT(1202, 852, wrap('아민은 Cu를 붙잡아(착이온) 녹이고, 강알칼리는 Sn을 녹입니다.', 15), 't-sub', 'start', 28);
    bs += '<g data-v="pbase"></g>';
    s += G(bs, only('base'));

    // water: 물 함량 그래프 (위젯이 곡선을 그린다) + 아민 / TMAH 설명
    const GX = w => 880 + w * 25, GY = v => 744 - v * 53;
    let wt = T(804, 160, '물 함량에 따라 — 알칼리마다 반대로 간다', 't-acc', 'start');
    wt += R(GX(0), GY(10), GX(3) - GX(0), GY(0) - GY(10), 'st04-okz', tip('TMAH · DMSO 계: 물을 낮게 — 공개 특허 예 약 3 % 아래 또는 물 없음'));
    wt += L(GX(0), GY(0), GX(20) + 8, GY(0), 's-axis') + L(GX(0), GY(0), GX(0), GY(10) - 8, 's-axis');
    [0, 5, 10, 15, 20].forEach(w => { wt += L(GX(w), GY(0), GX(w), GY(0) + 8, 's-axis') + T(GX(w), GY(0) + 30, String(w), 't-dim'); });
    [0, 5, 10].forEach(v => { wt += L(GX(0) - 8, GY(v), GX(0), GY(v), 's-axis') + T(GX(0) - 14, GY(v) + 7, String(v), 't-dim', 'end'); });
    wt += LB(T(812, 196, '상대값', 't-dim', 'start') + T(GX(20), GY(0) + 58, '물 함량 (%)', 't-sub', 'end') + T(GX(1.5), GY(0) - 12, '물 낮게', 'st04-okt'));
    wt += '<g data-v="pwater"></g>';
    wt += R(800, 818, 744, 282, 'pl-box', {rx: 12});
    wt += T(820, 852, '아민 — 물을 만나야 OH⁻를 낸다', 'pl-hdg', 'start') + T(1528, 852, 'R–NH₂ + H₂O ⇌ R–NH₃⁺ + OH⁻', 'pl-eqn', 'end');
    wt += T(820, 882, '아민계: 물이 늘면 알칼리 힘과 금속 부식이 함께 오른다', 't-dim', 'start');
    wt += T(820, 926, 'TMAH — 처음부터 OH⁻, 물이 적을수록 세다', 'pl-hdg', 'start') + T(1528, 926, '(CH₃)₄N⁺ OH⁻', 'pl-eqn', 'end');
    wt += TT(820, 956, wrap('DMSO 속 OH⁻는 거의 감싸이지 않아 아주 세다. 물이 들어와 수소결합으로 감싸면 약해진다 → 물이 늘면 공격 ↓ · 금속 부식 ↑', 37), 't-dim', 'start', 25);
    wt += T(820, 1040, '어느 쪽이든 물이 많으면 → 금속 부식 ↑ · 녹은 PR 재석출 ↑', 'pl-hdg2', 'start');
    wt += T(820, 1072, '물이 적은 액의 알칼리 세기는 pH로 읽지 않는다 · 목표 물 함량은 약품마다 다름', 't-dim', 'start');
    s += G(wt, only('water'));

    // inhib: 확대 — 억제제 없음 / 있음
    let ih = T(804, 160, '부식 억제제 — 금속 겉에 붙는 얇은 막 (확대 · 개념 그림)', 't-acc', 'start');
    [[800, 'off'], [1182, 'on']].forEach(([x0, k]) => {
      let z = R(x0, 178, 362, 520, 'pl-box', {rx: 12}) + R(x0 + 12, 230, 338, 380, 'f-strip') + R(x0 + 12, 610, 338, 72, 'f-cu2', tip('Cu 표면'));
      z += T(x0 + 20, 212, k === 'off' ? '억제제 없음' : '억제제 있음', k === 'off' ? 'pl-hdg2' : 'pl-hdg3', 'start');
      const g = rand(k === 'off' ? 41 : 43);
      if (k === 'off'){
        for (let q = 0; q < 6; q++){ const x = x0 + 40 + q * 56; z += C(x + 10, 611, 7, 'st04-pitz'); }
        for (let q = 0; q < 6; q++){ const x = x0 + 36 + q * 52 + g() * 12; z += flyer(q % 2 ? 'st04-o2' : 'st04-oh', q % 2 ? 'O₂' : 'OH⁻', `M${(x + 18).toFixed(0)},250 L${x.toFixed(0)},598`, 3.2, q * 0.55); }
        for (let q = 0; q < 4; q++){ const x = x0 + 64 + q * 76 + g() * 16; z += leave('cu', `M${x.toFixed(0)},596 Q${(x - 20).toFixed(0)},450 ${(x + 14).toFixed(0)},280`, 4.2, q * 1.05); }
      } else {
        for (let q = 0; q < 18; q++){ const x = x0 + 24 + q * 18; z += L(x, 598, x, 566, 'st04-inh') + C(x, 603, 6.5, 'st04-inhh'); }
        for (let q = 0; q < 6; q++){ const x = x0 + 36 + q * 50 + g() * 12, xe = Math.max(x0 + 34, Math.min(x0 + 326, x + (q < 3 ? 70 : -60))); z += flyer(q % 2 ? 'st04-o2' : 'st04-oh', q % 2 ? 'O₂' : 'OH⁻', `M${(x + 10).toFixed(0)},250 L${(x + 26).toFixed(0)},540 L${xe.toFixed(0)},300`, 3.4, q * 0.57); }
      }
      ih += G(z, Object.assign({'data-noov': '1'}, tip(k === 'off' ? '억제제가 없으면 OH⁻ · 산소가 Cu에 바로 닿아 Cu가 녹아 나간다 (아민 착이온)' : '억제제 막이 Cu 겉을 덮어 OH⁻ · 산소가 닿기 어렵다 — 막은 아주 얇다 (그림은 과장)')));
    });
    ih += '<g data-v="pinh"></g>';
    ih += TT(804, 740, wrap('Cu: 아졸류(벤조트라이아졸 등)의 N이 Cu에 붙어 아주 얇은 Cu(I)–아졸 막을 만든다', 34), 't-sub', 'start', 28);
    ih += T(804, 806, 'Sn: 양쪽성 금속 — 아주 센 알칼리에서는 억제제로도 다 막기 어렵다 (07장)', 't-dim', 'start');
    ih += R(800, 834, 744, 262, 'st04-wbox', {rx: 12});
    ih += T(822, 872, '⚠ 너무 두꺼우면 → 억제제 막도 잔여물', 'pl-warn', 'start');
    ih += TT(822, 910, wrap('억제제 막이 두껍게 자라 남으면 시드 식각을 늦추고, 리플로우에서 솔더 젖음을 방해할 수 있습니다 (조건에 따라).', 22), 't-sub', 'start', 30);
    ih += TT(822, 1014, wrap('DMSO 계에서 두꺼운 Cu(I)–아졸 막이 자랄 수 있다는 공개 특허 보고 — 억제제 양도 평가 항목', 24.5), 't-dim', 'start', 25);
    let tf = R(1330, 1004, 190, 52, 'f-cu2') + P('M1330,1004 L1330,972 Q1354,962 1378,972 T1426,972 T1474,972 T1520,972 L1520,1004 Z', 'st04-film');
    tf += K.arrow(1425, 896, 1425, 956, 's-arr2') + L(1413, 950, 1437, 974, 'st04-x') + L(1437, 950, 1413, 974, 'st04-x');
    tf += LB(T(1425, 886, '식각액 · 솔더', 't-dim') + T(1425, 1086, '두꺼운 억제제 막', 't-dim'));
    ih += G(tf, tip('두꺼운 억제제 막 — 식각액 · 녹은 솔더가 금속에 닿기 어렵다 (그림은 과장)'));
    s += G(ih, only('inhib'));

    // safety: 카드 3장
    let sf = '<g data-v="safehl"></g>';
    sf += R(800, 136, 744, 300, 'pl-box', {rx: 12}) + R(800, 448, 744, 300, 'pl-box', {rx: 12}) + R(800, 760, 744, 336, 'pl-box', {rx: 12});
    // ① 인화점 눈금
    const FX = t => 850 + (t - 40) * 11;
    sf += T(820, 170, '① 인화점 — 데운 용제의 증기에 불이 붙을 수 있다', 'pl-hdg2', 'start');
    sf += T(820, 200, '인화점: 증기에 불이 붙을 수 있는 가장 낮은 온도 (밀폐식 · 자료마다 몇 °C 다름)', 't-dim', 'start');
    sf += T(820, 226, '주황 띠 = 예시 경고선 (인화점 − 10 °C, 가정) · 실제 여유는 장비 · 사내 안전 기준', 't-dim', 'start');
    sf += '<g data-v="pfp"></g>';
    sf += L(FX(40), 330, FX(100), 330, 's-axis');
    for (let t = 40; t <= 100; t += 10) sf += L(FX(t), 322, FX(t), 338, 's-axis') + T(FX(t), 360, t + (t === 100 ? ' °C' : ''), 't-dim');
    // ② NMP 규제 — 날짜가 붙은 '최종 규칙'은 쓰지 않는다 (오프라인 앱에서 낡지 않게)
    sf += T(820, 482, '② NMP — 생식 독성으로 규제가 강해지는 중', 'pl-hdg2', 'start');
    sf += L(860, 540, 1500, 540, 's-axis');
    [[900, '2018', 'EU 규칙 채택'], [1110, '2020', 'EU 적용'], [1330, '2024', '미국 규칙안']].forEach(([x, y, t]) => { sf += C(x, 540, 9, 'st04-tl') + T(x, 522, y, 't-sub') + T(x, 572, t, 't-dim'); });
    sf += C(1480, 540, 9, 'pl-ghost') + T(1480, 572, '최종?', 't-dim');
    sf += TT(820, 618, ['EU — 2020년 5월부터: NMP 0.3 % 이상 든 제품은', '　작업자 노출을 기준값 아래로 관리해야 한다', '미국 — 규칙안(일부 용도 금지 · 작업자 보호) — 최종 여부는 다시 확인'], 't-sub', 'start', 30);
    sf += T(820, 724, '→ NMP 없는 스트리퍼(DMSO 계 등)로 옮겨 가는 중', 'pl-hdg3', 'start');
    // ③ 피부
    sf += T(820, 794, '③ 피부 — TMAH · DMSO', 'pl-hdg2', 'start');
    let sk = R(822, 900, 150, 26, 'st04-sk1') + R(822, 926, 150, 46, 'st04-sk2') + R(822, 972, 150, 30, 'st04-sk3');
    sk += P('M897,836 C882,858 878,874 897,884 C916,874 912,858 897,836 Z', 'st04-drop') + K.arrow(897, 890, 897, 958, 's-arrr') + T(897, 1030, '피부로 스며듦', 't-dim');
    sf += G(sk, tip('액이 피부에 닿으면 — TMAH는 피부로 흡수되고, DMSO는 녹아 있는 다른 성분을 피부 속으로 데려간다'));
    sf += TT(1000, 832, wrap('TMAH — 피부로 흡수되어 신경 · 근육에 작용합니다. 진한 액(25 %) 노출 사망 사례가 보고됐고, 현상액 농도(2.38 %)도 넓은 면적이면 중증이 될 수 있습니다.', 25.5), 't-sub', 'start', 28);
    sf += TT(1000, 974, wrap('DMSO — 녹아 있는 다른 성분을 피부 속으로 데려갑니다 → 장갑 재질 선택', 25.5), 't-sub', 'start', 28);
    sf += T(1000, 1066, '→ 보호구 · 즉시 많은 물로 씻기 · 의료 조치', 'pl-hdg3', 'start');
    s += G(sf, only('safety'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 스트리퍼 배합 (개념 모델)</div>
      ${K.seg('sol', [['nmp', 'NMP'], ['dmso', 'DMSO']], 'dmso', '용제')}
      ${K.seg('base', [['none', '알칼리 없음'], ['amine', '아민'], ['tmah', 'TMAH']], 'amine', '알칼리')}
      ${K.ctl('w', '물 함량 (%)', 0, 20, 0.5, 3)}
      ${K.seg('inh', [['on', '억제제 있음'], ['off', '없음']], 'on', '부식 억제제')}
      ${K.ctl('T', '온도 (°C)', 40, 90, 1, 70)}
      ${K.kpis([['포지티브 녹임', 'k-p', '상대 0~10'], ['가교 공격', 'k-x', '상대 0~10'], ['Cu 손실', 'k-cu', 'nm/분 (가정)'], ['Sn 손실', 'k-sn', 'nm/분 (가정)'], ['인화점까지', 'k-fp', '예시 경고선 10 °C']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('용제 힘(NMP 1 · DMSO 0.95) · 알칼리 세기(아민 0.5 · TMAH 1) · 물 효과(금속 w/(w+2), 알칼리 힘 — 아민 w/(w+2) · TMAH 1/(1+w/3)) · 기준 속도(Cu 2 · Sn 3 nm/분) · 억제 배수(Cu ×0.1 · Sn ×0.4) · 온도 효과(녹이는 힘 Ea 50, 금속 60 kJ/mol) · 결과 색 경계는 경향을 보이려고 고른 가정값입니다. TMAH 쪽 물 효과의 방향은 DMSO–물–TMAH의 염기 세기 측정(물이 적을수록 셈)에서 빌렸고 크기는 가정이며, NMP 속에서도 같은 꼴로 가정했습니다. 아민의 물 효과는 물이 없으면 0이 되는 단순화입니다. 실제 제품은 성분 · 비율이 공개되지 않는 경우가 많으니, 블랭킷 Cu · Sn 시편으로 손실을 직접 재세요.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, TT, G, LB, tip, wrap} = K;
    const st = {sol: 'dmso', base: 'amine', w: 3, inh: 'on', T: 70};
    const GX = w => 880 + w * 25, GY = v => 744 - v * 53;
    const f1 = v => v.toFixed(1), f2 = v => v < 0.1 ? v.toFixed(3) : v < 1 ? v.toFixed(2) : v.toFixed(1);
    const times = (a, b) => b <= 0 ? '—' : a / b >= 10 ? '×' + Math.round(a / b) : '×' + String(Math.round(a / b * 10) / 10);
    const bae = (a, b) => times(a, b).replace('×', '') + '배';                // 문장 속 배수 (예: 2.3배)
    function render(){
      const m = calc(st), S = SOL[st.sol], B = BASE[st.base];
      const noB = calc(Object.assign({}, st, {base: 'none'}));
      const cuB = Math.min(10, m.cu * 5), snB = Math.min(10, m.sn * 5);
      const warns = [];
      if (st.sol === 'nmp') warns.push('⚠ 규제 강화 (NMP)');
      if (st.base === 'tmah') warns.push('⚠ 피부 흡수 독성 (TMAH)');
      if (m.fpm < MARGIN) warns.push(m.fpm < 0 ? '⚠ 인화점 넘음' : m.fpm === 0 ? '⚠ 인화점 도달' : '⚠ 인화점 여유 작음');
      // 머리글: 지금 배합 · 경고 꼬리표
      ctx.$('[data-v="rec"]').innerHTML = T(60, 168, `${S.nm} · ${B.nm} · 물 ${f1(st.w)} % · 억제제 ${st.inh === 'on' ? '있음' : '없음'} · ${st.T} °C`, 't-sub', 'start');
      let tg = '', tx = 60;
      warns.forEach(w => { const wd = emw(w) * 19 + 26; tg += R(tx, 182, wd, 32, 'st04-tag', {rx: 16}) + T(tx + 13, 205, w, 'st04-tagt', 'start'); tx += wd + 10; });
      if (!warns.length) tg = T(60, 205, '경고 꼬리표 없음 (이 배합 · 온도에서)', 't-dim', 'start');
      ctx.$('[data-v="tags"]').innerHTML = G(tg, tip('규제 · 독성 · 인화점 경고 — 인화점은 예시 경고선(인화점 − 10 °C, 가정). 실제 여유는 장비 · 사내 안전 기준'));
      // 김 (온도가 높을수록 많이)
      const nv = st.T < 55 ? 0 : Math.min(6, Math.round((st.T - 50) / 7));
      let vp = '';
      for (let k = 0; k < nv; k++){ const x = 170 + k * 88; vp += `<path d="M${x},294 C${x - 14},278 ${x + 14},262 ${x},246 C${x - 10},236 ${x + 6},230 ${x + 2},222" class="st04-vap"><animate attributeName="opacity" values="0;.7;0" dur="${(2.6 + (k % 3) * 0.5).toFixed(1)}s" begin="-${(k * 0.6).toFixed(1)}s" repeatCount="indefinite"/></path>`; }
      ctx.$('[data-v="vap"]').innerHTML = G(vp, tip('데운 용제의 증기 — 배기로 뽑는다. 온도가 인화점에 가까울수록 위험'));
      // 범례 (없는 성분은 흐리게)
      const LG = [['sol', '용제', true], ['base', '알칼리', st.base !== 'none'], ['w', '물', st.w > 0], ['inh', '억제제', st.inh === 'on'], ['dis', '녹은 PR', m.pos > 0.5]];
      let lg = R(114, 312, 572, 38, 'st04-leg', {rx: 8}), lx = 130;
      LG.forEach(([k, t, onv]) => {
        let gl = k === 'sol' ? C(lx + 8, 331, 7, 'st04-sol') : k === 'base' ? C(lx + 8, 331, 10, 'st04-am') : k === 'w' ? C(lx + 8, 331, 5, 'st04-w') : k === 'inh' ? L(lx + 8, 336, lx + 8, 320, 'st04-inh') + C(lx + 8, 339, 5, 'st04-inhh') : C(lx + 8, 331, 6, 'st04-dis');
        lg += G(gl + T(lx + 24, 338, t, 't-dim', 'start'), onv ? null : {class: 'dim'});
        lx += 24 + emw(t) * 19 + 26;
      });
      ctx.$('[data-v="leg"]').innerHTML = lg;
      // PR 덩어리 (같은 시간 뒤 남은 모양, 개념)
      const fp = Math.max(0.06, 1 - m.pos / 10.8), wp = 64 * fp, hp = 120 * (0.45 + 0.55 * fp);
      const wc = 64 * Math.max(0.15, 1 - m.xl / 12), ws = wc + 10 + m.xl * 1.4, hs = 120 * (0.55 + 0.45 * wc / 64) + 10;
      let pr = R(103, 392, 64, 120, 'pl-ghost', tip('처음 PR 자리'));
      pr += R(103, 452 - hp / 2, wp, hp, 'f-pr', tip(`포지티브 PR — 같은 시간 뒤 남은 모양 (녹임 ${f1(m.pos)}, 개념)`));
      pr += R(103, 590, 64, 120, 'pl-ghost', tip('처음 PR 자리'));
      pr += R(103, 650 - hs / 2, ws, hs, 'f-prs', tip('부푼 겉층 — 용제 · 알칼리가 스며들어 부풀었다'));
      pr += R(103, 650 - (hs - 14) / 2, wc, hs - 14, 'f-prx', tip(`가교 PR — 녹지 않고 부푼다. 알칼리가 그물을 공격하면 줄어든다 (공격 ${f1(m.xl)}, 개념)`));
      if (m.xl >= 5) [[176, 612, 24], [196, 676, -18], [170, 728, 40]].slice(0, m.xl >= 7.5 ? 3 : 2).forEach(([x, y, a]) => { pr += R(x, y, 20, 12, 'f-prx', Object.assign({transform: `rotate(${a} ${x + 10} ${y + 6})`}, tip('들뜬 조각 — 박리형 약품이면 조각으로 떨어진다 (02장)'))); });
      pr += LB(T(108, 538, '포지티브 PR', 't-dim', 'start') + T(108, 752, '가교 PR', 't-dim', 'start'));
      const nd = Math.round(m.pos * 0.8), nd2 = Math.round(m.xl * 0.5);
      let ds = '';
      for (let k = 0; k < nd; k++) ds += K.mover(103 + wp + 4, 410 + k * 11, 330 + (k % 3) * 60, 400 + k * 14, 6, 'st04-dis', 3.6 + (k % 3) * 0.6, k * 0.5);
      for (let k = 0; k < nd2; k++) ds += K.mover(103 + ws + 4, 610 + k * 14, 320 + (k % 3) * 50, 640 + k * 16, 6, 'st04-dis', 4.2 + (k % 3) * 0.6, k * 0.6);
      pr += G(ds, tip('녹아 나간 PR — 액이 품는다. 많이 쌓이면 액이 지친다 (06장)'));
      ctx.$('[data-v="pr"]').innerHTML = pr;
      // 분자
      let mo = '';
      SP_S.forEach((p, k) => { mo += wob(p[0], p[1], k + 1, 9, GL.sol); });
      const sol = G(mo, tip(`용제 (${S.nm}) — PR 사슬 사이로 들어가 푼다`));
      let ba = '';
      if (st.base !== 'none') SP_B.forEach((p, k) => { ba += wob(p[0], p[1], k + 50, 7, st.base === 'tmah' ? GL.tmah : GL.amine); });
      const nw = Math.round(st.w * 2);
      let wa = '';
      for (let k = 0; k < nw; k++) wa += wob(SP_W[k][0], SP_W[k][1], k + 90, 8, GL.w);
      ctx.$('[data-v="mol"]').innerHTML = sol + G(wa, tip(`물 ${f1(st.w)} % — 금속 부식 · 재석출을 키운다. 녹이는 힘은 알칼리에 따라 돕기도(아민) 해치기도(TMAH)`)) +
        G(ba, tip(st.base === 'tmah' ? 'TMAH — (CH₃)₄N⁺ OH⁻. 처음부터 OH⁻를 가진 강알칼리' : '아민 (R–NH₂) — 물과 만나 OH⁻를 낸다. Cu를 붙잡는다(착이온)'));
      // 억제제 · 시편 파임
      let ih = '';
      if (st.inh === 'on'){
        for (let k = 0; k < 14; k++){ const x = 160 + k * 15.5; ih += L(x, 879, x, 856, 'st04-inh') + C(x, 884, 5.5, 'st04-inhh'); }
        for (let k = 0; k < 6; k++){ const x = 442 + k * 37; ih += L(x, 879, x, 856, 'st04-inh') + C(x, 884, 5.5, 'st04-inhh'); }
        ih = G(ih, tip('부식 억제제 — 금속 겉에 줄지어 붙어 OH⁻ · 산소를 막는다 (Cu에 잘 붙고, Sn에는 덜)'));
      }
      let pit = '';
      const npc = Math.round(cuB / 2), nps = Math.round(snB / 2);
      for (let k = 0; k < npc; k++) pit += E2(172 + k * 42, 890);
      for (let k = 0; k < nps; k++) pit += E2(444 + k * 42, 890);
      function E2(x, y){ return K.E(x, y, 9, 4, 'st04-pit'); }
      ctx.$('[data-v="inh"]').innerHTML = ih + G(pit, tip('먹힌 자리 (그림은 과장 — 실제 손실은 nm 수준)'));
      // 녹아 나가는 금속
      let io = '';
      const nc = Math.min(8, Math.round(cuB)), ns = Math.min(8, Math.round(snB));
      for (let k = 0; k < nc; k++){ const x = 166 + k * 28; io += leave('cu', `M${x},884 Q${x + 30},760 ${x + 60 + (k % 3) * 30},${560 + (k % 4) * 30}`, 4.6 + (k % 3) * 0.7, k * 0.7); }
      for (let k = 0; k < ns; k++){ const x = 436 + k * 28; io += leave('sn', `M${x},884 Q${x - 20},760 ${x - 40 - (k % 3) * 30},${560 + (k % 4) * 30}`, 4.6 + (k % 3) * 0.7, k * 0.7 + 0.3); }
      ctx.$('[data-v="ions"]').innerHTML = G(io, tip('녹아 나간 금속 — Cu는 아민과 착이온, Sn은 알칼리에 녹아 주석산 이온이 된다'));
      // 온도계
      const TY = t => 880 - (t - 40) * 520 / 60, fpT = S.fp;
      let th = R(722, TY(fpT), 36, TY(fpT - MARGIN) - TY(fpT), 'st04-fpb', tip(`예시 경고선 — 인화점 − 10 °C (가정)`));
      th += R(731, 340, 18, 560, 'st04-thg', {rx: 9}) + C(740, 906, 19, 'st04-thf');
      th += R(735, TY(st.T), 10, 906 - TY(st.T), 'st04-thf');
      for (let t = 40; t <= 100; t += 10) th += L(751, TY(t), 759, TY(t), 's-axis');
      th += L(720, TY(fpT), 760, TY(fpT), 'st04-fp', tip(`${S.nm} 인화점 약 ${fpT} °C`));
      th += T(740, 326, `${st.T} °C`, m.fpm < MARGIN ? 'st04-tw' : 't-sub');
      ctx.$('[data-v="therm"]').innerHTML = G(th, tip(`액 온도 ${st.T} °C · 빨간 눈금 = ${S.nm} 인화점(약 ${fpT} °C)`));
      // 막대 4개
      const ROWS = [['포지티브 PR 녹임', m.pos, f1(m.pos), 'st04-bs'], ['가교 PR 공격', m.xl, f1(m.xl), 'st04-bs'], ['Cu 손실', cuB, f2(m.cu) + ' nm/분', 'st04-bm'], ['Sn 손실', snB, f2(m.sn) + ' nm/분', 'st04-bm']];
      let br = '';
      ROWS.forEach(([nm, v, txt, cls], k) => {
        const y = 976 + k * 34;
        br += T(236, y + 20, nm, 't-sub', 'end') + R(248, y, 360, 24, 'st04-trk', {rx: 4}) + R(248, y, 36 * Math.min(10, v), 24, cls, {rx: 4}) + T(618, y + 20, txt, 't-sub', 'start');
      });
      ctx.$('[data-v="bars"]').innerHTML = G(br, tip('막대 = 같은 시간 동안의 상대값 (0~10). Cu · Sn은 nm/분 × 5 — 개념 모델 · 가정값'));

      // ── 오른쪽 패널의 움직이는 부분 ──
      ctx.$('[data-v="solhl"]').innerHTML = R(800, st.sol === 'nmp' ? 178 : 456, 744, 266, 'pl-hlbox', {rx: 12});
      // base: 얻는 것 / 잃는 것
      let pb = '';
      if (st.base === 'none'){
        pb += T(820, 950, `가교 공격 ${f1(m.xl)}`, 'st04-big', 'start') + TT(820, 986, ['용제만 — 가교 PR은 부풀기만', '포지티브 PR은 녹는다 (' + f1(m.pos) + ')'], 't-sub', 'start', 30);
        pb += T(1202, 950, `Cu ${f2(m.cu)} nm/분`, 'st04-big', 'start') + TT(1202, 986, ['금속은 거의 안 먹힌다', '→ 위젯에서 알칼리를 골라 보세요'], 't-sub', 'start', 30);
      } else {
        pb += T(820, 950, `가교 공격 ${f1(m.xl)}`, 'st04-big', 'start') + T(820, 986, `알칼리 없음 ${f1(noB.xl)} → ${times(m.xl, noB.xl)}`, 't-sub', 'start') + T(820, 1018, `포지티브 녹임 ${f1(m.pos)} (${times(m.pos, noB.pos)})`, 't-dim', 'start');
        pb += T(1202, 950, `Cu ${times(m.cu, noB.cu)} · Sn ${times(m.sn, noB.sn)}`, 'st04-big', 'start') + T(1202, 986, `Cu ${f2(m.cu)} · Sn ${f2(m.sn)} nm/분`, 't-sub', 'start') + TT(1202, 1018, ['알칼리 없음 대비', '(같은 물 · 온도 · 억제제)'], 't-dim', 'start', 26);
      }
      pb += T(820, 1078, '(상대값 · 개념 모델)', 't-dim', 'start');
      ctx.$('[data-v="pbase"]').innerHTML = pb;
      // water: 곡선 (지금 용제 · 온도에서) + 지금 물 함량
      const pts = f => { let d = ''; for (let w = 0; w <= 20.001; w += 0.25) d += (d ? ' L' : 'M') + GX(w).toFixed(1) + ',' + GY(f(w)).toFixed(1); return d; };
      const metal = w => (0.1 + w / (w + 2)) / 1.1 * 10, prec = w => 10 / (1 + Math.exp(-(w - 14) / 1.8));
      const CV = [
        ['amine', w => xlAt(S.S, 'amine', w, m.a50), 'st04-cam', '가교 공격 · 아민'],
        ['tmah', w => xlAt(S.S, 'tmah', w, m.a50), 'st04-ctm', '가교 공격 · TMAH'],
        ['none', w => xlAt(S.S, 'none', w, m.a50), 'st04-cno', '알칼리 없음'],
        ['metal', metal, 'st04-cme', '금속 부식 (모양)'],
        ['prec', prec, 'st04-cpr', '석출 위험 (모양)']
      ];
      let pw = '';
      CV.forEach(([k, f, cls]) => {
        const sel = k === st.base, isB = k === 'amine' || k === 'tmah' || k === 'none';
        pw += P(pts(f), cls + (isB ? (sel ? ' st04-sel' : ' st04-dimc') : ''));
      });
      // 오른쪽 끝 이름표 — 겹치지 않게 세로로 밀어 낸다
      const lab = CV.map(([k, f, cls, t]) => ({k, y: GY(f(20)) + 7, t, cls}));
      lab.sort((a, b) => a.y - b.y);
      for (let i = 1; i < lab.length; i++) if (lab[i].y - lab[i - 1].y < 26) lab[i].y = lab[i - 1].y + 26;
      for (let i = lab.length - 1; i >= 0; i--){ if (lab[i].y > GY(0) - 4) lab[i].y = GY(0) - 4; if (i && lab[i].y - lab[i - 1].y < 26) lab[i - 1].y = lab[i].y - 26; }
      lab.forEach(o => { pw += T(GX(20) + 12, o.y, o.t, 'st04-cl ' + (o.k === 'metal' ? 'st04-clm' : o.k === 'prec' ? 'st04-clp' : o.k === st.base ? 'st04-cls' : 'st04-cld'), 'start'); });
      const xw = GX(st.w), cur = CV.filter(([k]) => k === st.base || k === 'metal' || k === 'prec');
      pw += L(xw, GY(10) - 4, xw, GY(0), 'pl-peak');
      cur.forEach(([k, f]) => { pw += C(xw, GY(f(st.w)), 8, k === 'metal' ? 'k-ng' : k === 'prec' ? 'k-warn' : 'k-acc'); });
      const lt = `지금 물 ${f1(st.w)} %`, lw = emw(lt) * 21 + 20, lx0 = st.w < 12 ? xw + 10 : xw - 10 - lw;
      pw += R(lx0, 226, lw, 32, 'st04-badge', {rx: 8}) + T(lx0 + 10, 249, lt, 't-sub', 'start');
      ctx.$('[data-v="pwater"]').innerHTML = G(pw, tip('곡선: 가교 공격(지금 용제 · 온도에서 계산) · 금속 부식과 석출 위험은 모양만 — 개념 모델 · 가정'));
      // inhib: 두 확대의 Cu 손실 (지금 배합에서 억제제만 바꿔)
      const mOff = calc(Object.assign({}, st, {inh: 'off'})), mOn = calc(Object.assign({}, st, {inh: 'on'}));
      let pi = R(st.inh === 'off' ? 800 : 1182, 178, 362, 520, 'pl-hlbox', {rx: 12});
      pi += T(981, 654, `Cu 손실 ${f2(mOff.cu)} nm/분`, 'st04-pt') + T(1363, 654, `Cu 손실 ${f2(mOn.cu)} nm/분`, 'st04-pt');
      pi += T(981, 678, `SnAg 쪽 Sn ${f2(mOff.sn)} nm/분`, 'st04-pt2') + T(1363, 678, `SnAg 쪽 Sn ${f2(mOn.sn)} nm/분`, 'st04-pt2');
      ctx.$('[data-v="pinh"]').innerHTML = pi;
      // safety: 인화점 눈금 위 표시 + 카드 강조
      const FX = t => 850 + (t - 40) * 11;
      let pf = R(FX(S.fp - MARGIN), 302, FX(S.fp) - FX(S.fp - MARGIN), 42, 'st04-fpb');
      [['nmp', 91, 'NMP 약 91', 'start', 8], ['dmso', 88, 'DMSO 약 88', 'end', -8]].forEach(([k, t, nm, an, dx]) => {
        const on = k === st.sol;
        pf += L(FX(t), 286, FX(t), 344, on ? 'st04-fp' : 'st04-fp0') + T(FX(t) + dx, 290, nm, on ? 'st04-tw' : 't-dim', an);
      });
      const tc = Math.min(100, st.T);
      pf += P(`M${FX(tc)},368 l-11,20 l22,0 Z`, m.fpm < MARGIN ? 'k-warn' : 'k-acc') + L(FX(tc), 312, FX(tc), 346, 'st04-now') + T(FX(tc) - 18, 388, '지금', m.fpm < MARGIN ? 'st04-tw' : 't-sub', 'end');
      const fpTxt = m.fpm <= 0 ? `지금 ${st.T} °C — ${S.nm} 인화점(약 ${S.fp} °C)${m.fpm < 0 ? '을 넘었다' : '에 닿았다'} · 위험 (예시)` : `지금 ${st.T} °C → ${S.nm} 인화점(약 ${S.fp} °C)까지 ${m.fpm} °C` + (m.fpm < MARGIN ? ' — 예시 경고선 안쪽' : ' — 예시 경고선 밖');
      pf += T(820, 426, fpTxt, m.fpm < MARGIN ? 'st04-tw' : 't-sub', 'start');
      ctx.$('[data-v="pfp"]').innerHTML = pf;
      let sh = '';
      if (m.fpm < MARGIN) sh += R(800, 136, 744, 300, 'pl-hlbox', {rx: 12});
      if (st.sol === 'nmp') sh += R(800, 448, 744, 300, 'pl-hlbox', {rx: 12});
      if (st.base === 'tmah') sh += R(800, 760, 744, 336, 'pl-hlbox', {rx: 12});
      ctx.$('[data-v="safehl"]').innerHTML = sh;

      // ── 카드 KPI · 메시지 ──
      ctx.out('k-p', f1(m.pos)); ctx.out('k-x', f1(m.xl)); ctx.out('k-cu', f2(m.cu)); ctx.out('k-sn', f2(m.sn));
      ctx.out('k-fp', m.fpm < 0 ? `넘음 (${-m.fpm} °C 위)` : m.fpm === 0 ? '도달' : `${m.fpm} °C`);
      const cls = (id, c) => { const el = ctx.card.querySelector(`[data-o="${id}"]`); if (el) ['ok', 'warn', 'ng'].forEach(x => el.parentNode.classList.toggle(x, x === c)); };
      cls('k-cu', m.cu < 0.3 ? 'ok' : m.cu < 1 ? 'warn' : 'ng');
      cls('k-sn', m.sn < 0.5 ? 'ok' : m.sn < 1.5 ? 'warn' : 'ng');
      cls('k-fp', m.fpm <= 0 ? 'ng' : m.fpm < MARGIN ? 'warn' : 'ok');
      cls('k-x', m.xl >= 3 ? 'ok' : m.xl >= 2 ? 'warn' : 'ng');
      const msg = [];
      if (st.base === 'none') msg.push(`알칼리가 없으면 용제만으로 포지티브 PR은 녹지만(<b>${f1(m.pos)}</b>), 가교 PR은 부풀기만 하고 거의 공격받지 않습니다(<b>${f1(m.xl)}</b>).`);
      else msg.push(`알칼리(${B.nm})를 넣으면 가교 PR 공격이 <b>${bae(m.xl, noB.xl)}</b>가 되지만 Cu 손실도 <b>${bae(m.cu, noB.cu)}</b>, Sn 손실은 <b>${bae(m.sn, noB.sn)}</b>가 됩니다. 녹이는 힘과 지키는 힘을 함께 보세요.`);
      if (st.base === 'tmah' && st.w >= 5) msg.push(`<b>TMAH · ${S.nm} 계에서는 물이 늘면 가교 PR 공격이 줄고 금속 부식만 늘어납니다</b> — 물을 낮게 관리합니다.`);
      else if (st.base === 'amine' && st.w < 1) msg.push('아민은 물을 만나야 OH⁻를 냅니다 — 이 모델에서는 물이 거의 없으면 아민이 보태는 공격이 거의 0입니다 (단순화: 실제 아민은 물 없이도 일부 결합을 직접 공격할 수 있습니다).');
      if (st.inh === 'off' && st.base !== 'none') msg.push(`억제제가 없으면 Cu 손실이 <b>${f2(m.cu)} nm/분</b>(있을 때의 10배)입니다.`);
      if (m.fpm <= 0) msg.push(`⚠ <b>${S.nm} 인화점(약 ${S.fp} °C)${m.fpm < 0 ? '보다 높습니다' : '에 닿았습니다'}</b> — 증기에 불이 붙을 수 있는 온도입니다 (예시). 운전 온도는 인화점보다 충분히 낮게, 실제 여유는 장비 · 사내 안전 기준을 따릅니다.`);
      else if (m.fpm < MARGIN) msg.push(`⚠ ${S.nm} 인화점까지 ${m.fpm} °C — 예시 경고선(10 °C, 가정)보다 가깝습니다. 실제 여유는 장비 · 사내 안전 기준입니다.`);
      else if (st.T !== 70) msg.push(`70 → ${st.T} °C: 녹이는 힘 ×${m.a50.toFixed(2)}, 금속 손실 ×${m.a60.toFixed(2)} (금속 쪽이 더 민감 — 가정 Ea 60 > 50).`);
      ctx.q('[data-o=msg]').innerHTML = msg.join(' ');
      ctx.refresh();
    }
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const wIn = ctx.card.querySelector('input[data-i="w"]'), tIn = ctx.card.querySelector('input[data-i="T"]');
    let ready = false;
    const rr = () => { if (ready) render(); };
    ctx.seg('sol', v => { st.sol = v; rr(); });
    ctx.seg('base', v => { st.base = v; rr(); });
    ctx.seg('inh', v => { st.inh = v; rr(); });
    ctx.range('w', v => { st.w = v; rr(); return v.toFixed(1) + ' %'; });
    ctx.range('T', v => { st.T = v; rr(); return v + ' °C'; });
    ready = true;
    render();
    // 손대기 전에는 단계마다 예시 배합으로. 발표 모드에서는 늘 예시 배합으로 되돌린다
    let touched = false;
    ctx.card.querySelectorAll('.pl-w input, .pl-w .pl-seg button').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    ctx.demo = sid => {
      const ep = window.EngrTheatres && window.EngrTheatres.strip;
      if (ep && ep.state.pres != null) touched = false;
      const d = DEMO[sid];
      if (touched || !d) return ctx.refresh();
      Object.assign(st, d);
      setSeg('sol', d.sol); setSeg('base', d.base); setSeg('inh', d.inh);
      if (wIn) wIn.value = d.w;
      if (tIn) tIn.value = d.T;
      ctx.out('w', d.w.toFixed(1) + ' %'); ctx.out('T', d.T + ' °C');
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['극성 비양자성 용제', '전기적으로 치우쳐 있지만(극성) 수소 이온(H⁺)을 잘 내놓지 않는 용제. NMP · DMSO가 대표. 음이온(OH⁻)을 잘 감싸지 않아 그 속의 알칼리가 세게 작용한다'],
      ['NMP (N-메틸-2-피롤리돈)', '오래 쓰여 온 대표 스트리퍼 용제. 생식 독성으로 규제가 강해지는 중'],
      ['DMSO (다이메틸 설폭사이드)', 'NMP와 성능이 비슷한 대체 용제. 약 18.5 °C에서 언다'],
      ['아민', '질소를 가진 알칼리성 유기물(R–NH₂). 물과 만나 OH⁻를 내어 가교 PR 공격을 돕지만, Cu를 붙잡아(착이온) 녹일 수 있다'],
      ['TMAH', '수산화 테트라메틸암모늄. 처음부터 OH⁻를 가진 강알칼리로 현상액(약 2.38 %)으로도 쓴다. 피부 흡수 독성 주의'],
      ['흡습성', '공기 중 물을 빨아들이는 성질. 데운 액은 물을 날려 보내기도 해서, 물 함량은 평형값으로 다가간다 (<a data-go="bath.age">06장</a>)'],
      ['부식 억제제', '금속 표면에 아주 얇게 붙어 부식을 막는 성분. Cu에는 아졸류(벤조트라이아졸 등)'],
      ['인화점', '증기에 불이 붙을 수 있는 가장 낮은 온도. 측정 방식(밀폐식 · 개방식)에 따라 몇 °C 다르다']
    ]) + K.field([
      '스트리퍼는 보통 여러 성분을 미리 섞은 제품으로 들어옵니다. 현장에서 바꿀 수 있는 것은 주로 <b>온도 · 시간 · 물 관리 · 교체 주기</b>, 그리고 약품 종류 선택(박리형 · 용해형, 아민계 · TMAH계)입니다 [스트립-액 · 조건].',
      '물 관리 목표는 알칼리 종류에 따라 다릅니다. <b>TMAH · DMSO 계는 물이 늘면 PR 공격은 줄고 금속 부식만 늘어</b> 물을 낮게 지킵니다. 아민계는 공급사가 정한 범위 안에 둡니다. 물은 온도 · 습도 · 질소 덮개에 따라 늘기도 줄기도 하므로 인라인 농도계나 정기 분석으로 봅니다 → <a data-go="bath.age">06장</a>.',
      '새 스트리퍼를 평가할 때는 PR 제거뿐 아니라 블랭킷 Cu · Ni · SnAg · Ti 시편의 손실, 그리고 <a href="#go-etch-01">시드 식각</a> · <a href="#go-reflow-04">리플로우</a> 뒤 결과(시드 잔여 · 젖음)까지 함께 봅니다. 억제제 막도 잔여 후보입니다 [뒤 공정].',
      'DMSO는 약 18.5 °C에서 얼어 보관 · 이송 · 배관 온도를 관리합니다. 데운 용제의 증기는 배기로 뽑고, 폐액은 성분(용제 · 알칼리 · 녹은 PR · 금속)을 알고 나눠 처리합니다.',
      'TMAH가 든 액이 피부에 닿으면 <b>즉시 많은 물로 씻고 의료 조치</b>를 받습니다. DMSO는 다른 성분을 피부 속으로 데려가므로 장갑 재질도 약품에 맞춰 고릅니다.'
    ]) + K.deep(`<ul>
      <li><b>배합의 뼈대</b> — 두꺼운 PR용 스트리퍼는 용제 + 아민 · 4차 암모늄 수산화물 + 공용매 + 부식 억제제 조합이 흔하고, DMSO나 NMP가 몸통인 경우가 많습니다. 공개 특허 예: DMSO 약 55~95 % + 4차 암모늄 수산화물 약 2~10 %. TMAH는 값 · 성능 때문에 가장 흔한 4차 암모늄 수산화물이지만, 독성 때문에 TMAH · NMP · DMSO를 빼려는 배합도 나옵니다. 성분 · 비율이 공개되지 않는 경우가 많아, 블랭킷 시편으로 직접 재는 것이 가장 확실합니다.</li>
      <li><b>용제 성질</b> — NMP 끓는점 202~204 °C, 인화점 약 91 °C(자료에 따라 86~95), 어는점 약 −24 °C. DMSO 끓는점 189 °C, 녹는점 18.4~18.5 °C, 인화점 87~89 °C(밀폐식) · 95 °C(개방식). 둘 다 물과 완전히 섞이고 흡습성입니다. 한센 매개변수 δD/δP/δH(MPa½): NMP 18.0/12.3/7.2, DMSO 18.4/16.4/10.2, IPA 15.8/6.1/16.4, 물 15.5/16.0/42.3 — 물은 δH가 매우 커서 수지와 멀어, 녹은 PR이 물을 만나면 다시 석출될 수 있습니다. DMSO는 끓는점 근처나 강산 · 강염기와 오래 가열하면 분해(냄새 · 열)될 수 있어, 보통 운전 온도(60~80 °C)보다 훨씬 높은 과열을 막습니다.</li>
      <li><b>물의 이중 역할 — 알칼리마다 다르다</b> — 아민은 물이 있어야 R–NH₂ + H₂O ⇌ R–NH₃⁺ + OH⁻로 OH⁻를 냅니다. 그래서 아민계에서는 물이 늘면 알칼리 힘과 금속 부식이 함께 오릅니다. TMAH(4차 암모늄 수산화물)는 처음부터 OH⁻를 가진 염입니다. DMSO는 OH⁻를 거의 감싸지 않아 물이 적을수록 OH⁻가 아주 셉니다 — 염기 세기 지표 H₋가 0.011 M TMAH에서 물 약 12 → DMSO 99.6 mol % 약 26(약 10¹⁴배)이라는 공개 측정이 있습니다. 물을 넣으면 OH⁻가 수소결합으로 감싸여 약해집니다. 그래서 <b>TMAH · DMSO 계에서는 물이 늘면 PR 공격은 줄고 금속 부식만 오르며</b>, 공개 특허의 DMSO + 4차 암모늄 수산화물 스트리퍼는 물을 약 3 % 아래로 두거나 넣지 않습니다. 어느 쪽이든 물이 늘면 녹은 PR의 용해도는 떨어집니다(재석출). 물이 적은 액의 알칼리 세기는 물의 pH 눈금으로 읽을 수 없습니다(<a data-go="metal.sn">07장</a>).</li>
      <li><b>온도</b> — 위젯은 녹이는 힘에 Ea 50 kJ/mol(10 °C마다 약 ×1.6~1.7), 금속 손실에 Ea 60 kJ/mol(약 ×1.8)을 가정합니다. 온도를 올리면 PR은 빨리 빠지지만 금속은 더 빨리 먹힙니다. 한 번 스트립의 손실이 늘지 줄지는 시간이 얼마나 줄고 부식의 Ea가 얼마인지에 달려, 블랭킷 시편을 두 온도에서 재 보면 압니다(<a data-go="soak.heat">03장</a> · <a data-go="metal.cu">07장</a>).</li>
      <li><b>NMP 규제</b> — NMP는 EU에서 생식 독성 1B로 분류됩니다. EU REACH 부속서 XVII 71항(규칙 2018/588): 2020년 5월 9일부터 0.3 % 이상 NMP가 든 제품은 작업자 노출을 기준값(DNEL 흡입 14.4 mg/m³, 피부 4.8 mg/kg/일) 아래로 관리해야 합니다(전선 코팅은 2024년부터). 미국: TSCA 위험 평가(2020) · 수정 판단(2022) · 규칙안(2024년 6월, 일부 용도 금지 · 작업자 보호)이 나와 있습니다 — 최종 여부는 다시 확인합니다.</li>
      <li><b>TMAH 독성 · 분해</b> — 강알칼리 화상에 더해 테트라메틸암모늄 이온이 신경 · 근육의 아세틸콜린 수용체에 작용합니다. 공개 보고: 피부 노출 13건 가운데 25 % 액에 노출된 3명이 숨졌고, 다른 후향 연구(29명)에서는 대부분 경증이었지만 2.38 %에서도 넓은 면적 노출은 중증이 될 수 있었습니다. 즉시 씻기와 호흡 지원이 핵심입니다. 약 130 °C 이상에서 트리메틸아민(생선 냄새) · 메탄올 등으로 분해된다는 자료가 있어(자료 품질 낮음), 오래 데운 액의 알칼리 감소 · 냄새의 한 원인일 수 있습니다(조건에 따라).</li>
      <li><b>억제제와 수계 스트리퍼</b> — Cu 위 아졸은 Cu(I)–아졸 고분자 막을 만들어 보호합니다. DMSO 계에서는 이 막이 두껍게 자라 문제가 될 수 있다는 특허 보고가 있어 억제제 막도 잔여물 후보입니다. Sn은 산 · 강알칼리 양쪽에 녹는 양쪽성 금속이라 pH가 아주 높으면 억제제로도 완전히 막기 어렵다는 보고가 있습니다(<a data-go="metal.sn">07장</a>). 드라이 필름 · 네거티브 PR에는 물이 주성분인 알칼리 액도 씁니다(보통 PR이 녹지 않고 들떠 조각 — <a data-go="resist.lift">02장</a>). 웨이퍼에는 금속 이온(Na⁺ · K⁺)이 없는 TMAH · 아민 액을 쓰는 경우가 많고, 물이 많아 Sn 손실을 더 조심합니다(조건에 따라).</li></ul>`);
  },
  css: `.pl-svg .st04-bottle{fill:rgba(192,132,252,.18);stroke:#c4b5fd;stroke-width:2}
.pl-svg .st04-cap{fill:#94a3b8;stroke:#e2e8f0;stroke-width:1}
.pl-svg .st04-surf{stroke:rgba(196,181,253,.6);stroke-width:2}
.pl-svg .st04-sol{fill:#7dd3fc;stroke:#e0f2fe;stroke-width:1}
.pl-svg .st04-am{fill:#a78bfa;stroke:#f5f3ff;stroke-width:1.6}
.pl-svg .st04-oh{fill:#f0abfc;stroke:#fdf4ff;stroke-width:1.2}
.pl-svg .st04-o2{fill:#f87171;stroke:#fee2e2;stroke-width:1.2}
.pl-svg .st04-mt{font-size:16px;font-weight:900;fill:#1e1033 !important;stroke:none !important;text-anchor:middle}
.pl-svg .st04-mt2{font-size:13.5px;font-weight:900;fill:#2e1065 !important;stroke:none !important;text-anchor:middle}
.pl-svg .st04-w{fill:#2dd4bf;stroke:#ccfbf1;stroke-width:.8}
.pl-svg .st04-inh{fill:none;stroke:#4ade80;stroke-width:3;stroke-linecap:round}
.pl-svg .st04-inhh{fill:#22c55e;stroke:#dcfce7;stroke-width:1}
.pl-svg .st04-dis{fill:#c4b5fd;opacity:.85}
.pl-svg .st04-pit{fill:#140b06;stroke:#7c4a24;stroke-width:1}
.pl-svg .st04-pitz{fill:#1b1f2e}
.pl-svg .st04-pt{font-size:19px;font-weight:800;fill:#1b1203 !important;stroke:none !important;text-anchor:middle}
.pl-svg .st04-pt2{font-size:19px;font-weight:700;fill:#2a1a08 !important;stroke:none !important;text-anchor:middle}
.pl-svg .st04-vap{fill:none;stroke:#cbd5e1;stroke-width:2.4;stroke-linecap:round}
.pl-svg .st04-thg{fill:rgba(226,232,240,.06);stroke:#94a3b8;stroke-width:1.6}
.pl-svg .st04-thf{fill:#ef4444}
.pl-svg .st04-fp{stroke:#f87171;stroke-width:3.4}
.pl-svg .st04-fp0{stroke:#94a3b8;stroke-width:2;stroke-dasharray:4 3}
.pl-svg .st04-fpb{fill:rgba(251,191,36,.30)}
.pl-svg .st04-now{stroke:#fbbf24;stroke-width:3}
.pl-svg .st04-tw{font-size:21px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .st04-tag{fill:rgba(251,191,36,.12);stroke:#fbbf24;stroke-width:1.4}
.pl-svg .st04-tagt{font-size:19px;font-weight:800;fill:#fcd34d !important}
.pl-svg .st04-leg{fill:rgba(5,10,20,.6);stroke:rgba(148,163,184,.25);stroke-width:1}
.pl-svg .st04-trk{fill:rgba(148,163,184,.10);stroke:rgba(148,163,184,.3);stroke-width:1}
.pl-svg .st04-bs{fill:#38bdf8}
.pl-svg .st04-bm{fill:#f87171}
.pl-svg .st04-bond{stroke:#cbd5e1;stroke-width:3;stroke-linecap:round}
.pl-svg .st04-at{font-size:22px;font-weight:800;fill:#e2e8f0 !important;text-anchor:middle}
.pl-svg .st04-hd{fill:#60a5fa}
.pl-svg .st04-hp{fill:#f472b6}
.pl-svg .st04-hh{fill:#34d399}
.pl-svg .st04-chain{fill:none;stroke:#c4b5fd;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}
.pl-svg .st04-xl{stroke:#fbbf24;stroke-width:3.4}
.pl-svg .st04-xn{fill:#fbbf24;stroke:#fef3c7;stroke-width:1}
.pl-svg .st04-acid{font-size:19px;font-weight:800;fill:#e2e8f0 !important}
.pl-svg .st04-acid2{font-size:19px;font-weight:800;fill:#f0abfc !important}
.pl-svg .st04-gain{fill:rgba(34,197,94,.07);stroke:#4ade80;stroke-width:2}
.pl-svg .st04-loss{fill:rgba(239,68,68,.07);stroke:#f87171;stroke-width:2}
.pl-svg .st04-big{font-size:30px;font-weight:900;fill:#f8fafc !important}
.pl-svg .st04-okz{fill:rgba(34,197,94,.10)}
.pl-svg .st04-okt{font-size:19px;font-weight:800;fill:#86efac !important;text-anchor:middle}
.pl-svg .st04-cam{fill:none;stroke:#38bdf8;stroke-width:3.2}
.pl-svg .st04-ctm{fill:none;stroke:#38bdf8;stroke-width:3.2;stroke-dasharray:16 9}
.pl-svg .st04-cno{fill:none;stroke:#94a3b8;stroke-width:2.4;stroke-dasharray:3 6}
.pl-svg .st04-cme{fill:none;stroke:#f87171;stroke-width:3.2}
.pl-svg .st04-cpr{fill:none;stroke:#f59e0b;stroke-width:3.2;stroke-dasharray:9 7}
.pl-svg .st04-sel{stroke-width:6}
.pl-svg .st04-dimc{opacity:.45}
.pl-svg .st04-cl{font-size:19px;font-weight:800}
.pl-svg .st04-cls{fill:#7dd3fc !important}
.pl-svg .st04-cld{fill:#7c8da8 !important}
.pl-svg .st04-clm{fill:#fca5a5 !important}
.pl-svg .st04-clp{fill:#fcd34d !important}
.pl-svg .st04-badge{fill:#0b1222;stroke:#f87171;stroke-width:1.4}
.pl-svg .st04-wbox{fill:rgba(245,158,11,.07);stroke:#f59e0b;stroke-width:2}
.pl-svg .st04-tl{fill:#f87171;stroke:#fee2e2;stroke-width:1.2}
.pl-svg .st04-sk1{fill:#f3c6a5}
.pl-svg .st04-sk2{fill:#e8a98a}
.pl-svg .st04-sk3{fill:#c98b70}
.pl-svg .st04-film{fill:rgba(74,222,128,.45);stroke:#4ade80;stroke-width:1.6}
.pl-svg .st04-x{stroke:#f87171;stroke-width:4;stroke-linecap:round}
.pl-svg .st04-drop{fill:rgba(192,132,252,.6);stroke:#e9d5ff;stroke-width:1.6}`
});
})();
