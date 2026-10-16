/* 전해도금 10 — 금속별 도금액: Cu · Ni · SnAg (도금액 3종) */
(function(){
// Sn–Ag 액상선 (wt% Ag, °C) — 공개 자료 수준의 근삿값(±3~5 °C). Sn 231.9 °C, 공정점(共晶) 3.5 wt% · 221 °C
// Ag가 적은 쪽(Sn 쪽)은 완만하게 내려가고, 많은 쪽(Ag₃Sn 쪽)은 가파르게 오른다
const LIQ = [[0, 231.9], [1, 229], [1.8, 226], [2.5, 224], [3, 222], [3.5, 221], [4, 230], [5, 243], [6, 260], [7, 270], [8, 280], [9, 289], [10, 298]];
const AMAX = 10, EU = 3.5, TE = 221, AG3 = 73.2;                     // Ag₃Sn = Ag 73.2 wt%
const liq = x => { x = Math.max(0, Math.min(AMAX, x)); for (let k = 1; k < LIQ.length; k++) if (x <= LIQ[k][0]){ const [a, ta] = LIQ[k - 1], [b, tb] = LIQ[k]; return ta + (tb - ta) * (x - a) / (b - a); } return LIQ[LIQ.length - 1][1]; };
// 온도 T에서 액체의 조성 (side: 'sn' = 공정점 왼쪽, 'ag' = 오른쪽)
function liqInv(T, side){
  const seg = side === 'sn' ? LIQ.filter(p => p[0] <= EU) : LIQ.filter(p => p[0] >= EU);
  for (let k = 1; k < seg.length; k++){
    const [a, ta] = seg[k - 1], [b, tb] = seg[k];
    if ((T - ta) * (T - tb) <= 0) return a + (b - a) * (T - ta) / (tb - ta);
  }
  return side === 'sn' ? 0 : AMAX;
}
// 리플로우 최고 온도에서의 상태: 다 녹음 / 고체가 일부 남음(지렛대 규칙) / 안 녹음
function melt(ag, pk){
  const tl = liq(ag);
  if (pk < TE) return {k: 'solid', tl, fs: 1, ph: ''};
  if (pk >= tl) return {k: 'liq', tl, fs: 0, ph: ''};
  if (ag > EU){ const cl = liqInv(pk, 'ag'); return {k: 'two', tl, cl, fs: Math.max(0, (ag - cl) / (AG3 - cl)), ph: 'Ag₃Sn'}; }
  const cl = liqInv(pk, 'sn');
  return {k: 'two', tl, cl, fs: Math.max(0, (cl - ag) / cl), ph: 'Sn'};
}
// 개념 모델: Ag 부분 전류 = 공급 한계 몫(액의 Ag 농도 · √교반에 비례) × J/(J+1) + 작은 반응 몫. 나머지 전류는 Sn
// 예: Ag 0.5 g/L, 착이온 D 약 4×10⁻¹⁰ m²/s, δ 30 µm → Ag 한계전류 약 0.06 ASD
const IL0 = 0.055, K0 = 0.002;
function agSplit(J, agit, conc){
  const iAg = conc * (IL0 * Math.sqrt(agit) * J / (J + 1) + K0 * J);
  const x = Math.min(0.5, iAg / J);                                     // Ag에 쓰인 전류 몫
  const mAg = x * 107.87, mSn = (1 - x) * 118.71 / 2;                   // Ag⁺는 전자 1개, Sn²⁺는 2개
  return {x, wt: 100 * mAg / (mAg + mSn)};
}
const PD = {x0: 420, x1: 1110, y0: 1050, y1: 760, t0: 200, t1: 300};   // 상태도 영역
const px = a => PD.x0 + Math.min(AMAX, a) / AMAX * (PD.x1 - PD.x0), py = t => PD.y0 - (t - PD.t0) / (PD.t1 - PD.t0) * (PD.y0 - PD.y1);
const BATHS = [
  {id: 'cu', x: 40, nm: 'Cu 도금액', ions: ['cu', 'so4', 'h', 'cl'], lines: ['황산구리 + 황산 + Cl⁻ (수십 ppm)', '+ 첨가제 3종 (05장)', '양극(애노드, +): 인 함유 구리 (녹아서 보충)', '역할: Cu 기둥 · 상부 Cu (베이스만)', '관리: Cu · 산 · Cl · 첨가제 · 양극 피막'], on: {base: 'cu top', core: ''}},
  {id: 'ni', x: 560, nm: 'Ni 도금액', ions: ['ni', 'h', 'cl'], lines: ['설파민산 니켈 + 붕산 (pH 완충)', '+ 소량 염화물 · 습윤제', '양극(애노드, +): 니켈 (녹아서 보충)', '역할: 베이스 방벽 · 코어 몸통 겸 방벽', '관리: pH · 온도 · 응력 · 표면 산화'], on: {base: 'ni', core: 'ni'}},
  {id: 'snag', x: 1080, nm: 'SnAg 도금액', ions: ['sn', 'ag', 'ms', 'sn4'], lines: ['메탄설폰산(MSA) + Sn²⁺ + Ag⁺', '+ 착화제 (Ag⁺를 붙잡아 둔다)', '양극(애노드, +): 불용성 또는 Sn + 분리막', '역할: 녹아서 붙는 솔더 (두 다이 같음)', '관리: Sn²⁺ · Ag · 산 · Sn⁴⁺ · 착화제'], on: {base: 'sn', core: 'sn'}}
];
// 앞면 범프 두 구조 (예시 두께 µm, 아래층부터) — 베이스 다이 Cu 기둥 12 + Ni 3 + 상부 Cu 3 + SnAg 12 = 30, 코어 다이 Ni 5 + SnAg 12 = 17
const STK = {
  base: [['cu', 12, 'f-cu2', 'Cu 기둥 — 높이 · 전기'], ['ni', 3, 'f-ni', 'Ni — Cu 기둥과 솔더 사이 방벽'], ['top', 3, 'f-cu2', '상부 Cu — 솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로\n(Ni 위에 얇게 한 번 더 올린 Cu)'], ['sn', 12, 'f-sn2', 'SnAg — 녹아서 붙는 솔더']],
  core: [['ni', 5, 'f-ni', 'Ni — 몸통 겸 방벽 (Cu 기둥 없음)'], ['sn', 12, 'f-sn2', 'SnAg — 녹아서 붙는 솔더']]
};
// 도금 직후 범프 단면 (바닥 y0, 폭 w, 두께 µm당 k). n = 아래부터 몇 층까지, cls(층 id) = 그 층에 더할 클래스
function stack(K, die, x, y0, w, k, n, cls){
  let s = '', y = y0;
  STK[die].slice(0, n || 9).forEach(([id, um, f, tp]) => { const h = um * k; y -= h; s += K.R(x, y, w, h, f + (cls ? cls(id) : ''), K.tip(tp)); });
  return s;
}

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '10', id: 'chem', part: 3, short: 'Cu · Ni · SnAg', scale: '도금액 3종',
  title: 'Cu · Ni · SnAg — 금속마다 무엇이 다를까?',
  hook: 'Ag 몇 %가 녹는 모습을 바꾼다',
  one: '도금액은 Cu · Ni · SnAg 세 가지지만, 쌓는 순서는 다이마다 다릅니다. 베이스 다이는 Cu 기둥 → Ni → 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu) → SnAg, 코어 다이는 Ni → SnAg입니다. 층마다 맡은 일과 관리할 것이 다르고, 특히 SnAg는 두 금속이 함께 쌓이는 합금이라 조건이 조금만 달라져도 조성(Ag %)과 녹는 모습 · 굳은 뒤 속 모양이 달라집니다.',
  ana: '<b>층 케이크 두 가지</b> — 베이스 다이 범프는 키를 세우는 시트(Cu 기둥) 위에 크림이 스며들지 않게 막는 얇은 막(Ni), 그 위에 크림이 잘 붙는 얇은 시트(상부 Cu), 맨 위에 녹아서 다른 칩에 붙는 크림(SnAg)을 올립니다. 코어 다이는 시트 없이 막(Ni)을 두껍게 깔고 바로 크림을 올려 낮습니다. 크림 배합(Ag %)이 바뀌면 녹는 모습이 바뀝니다. 다만 케이크와 달리, 크림(솔더)은 맞닿은 금속과 반응해 새 층(IMC)을 만들며 조금씩 먹어 들어갑니다.',
  steps: [
    {id: 'order', t: '두 다이, 두 순서', d: '도금액은 세 가지, 쌓는 순서는 다이마다 다릅니다. 베이스 다이는 Cu 기둥 → Ni → 상부 Cu(Ni 위 얇은 Cu) → SnAg로 Cu 액을 두 번 쓰고, 코어 다이는 Cu 기둥 없이 시드 위에 Ni → SnAg만 쌓아 낮습니다. 층 사이는 보통 헹굼만 거쳐 마르지 않게, Ni 다음은 특히 곧바로 넘깁니다.'},
    {id: 'cu', t: 'Cu — 기둥 · 상부 Cu', d: '황산구리 + 황산 + 아주 적은 Cl⁻ + 첨가제 액으로, 베이스 다이에서만 두 번 씁니다 — Cu 기둥(높이 · 전기 · 열)과 Ni 위 얇은 상부 Cu. 양극(애노드, +)은 인이 조금 든 구리로 녹아서 Cu²⁺를 보충하고, 표면의 검은 피막이 구리 가루(슬러지)를 줄입니다.'},
    {id: 'ni', t: 'Ni — 방벽 · 몸통', d: '설파민산 니켈 + 붕산(pH 완충) 액입니다. 베이스 다이에서는 Cu 기둥과 솔더 사이의 얇은 방벽(예시 3 µm), 코어 다이에서는 시드 위에 바로 서는 몸통 겸 방벽(예시 5 µm)입니다. 응력 · pH · 온도를 지키고, 표면이 산화되기 전에 다음 층으로 넘깁니다.'},
    {id: 'snag', t: 'SnAg — 솔더', d: 'Sn과 Ag를 함께 쌓는 합금 도금입니다. Ag는 Sn보다 전자를 훨씬 잘 받아(표준 전위가 높음) 그냥 두면 먼저 · 저절로 석출되므로 착화제로 붙잡아 둡니다. Sn²⁺는 공기 · 양극에서 Sn⁴⁺로 바뀌어 뿌연 찌꺼기가 됩니다.'},
    {id: 'comp', t: 'SnAg 조성과 녹는 모습', d: '보통 전류밀도를 올리면 Ag %가 내려가고, 교반 · 액의 Ag 농도를 올리면 올라갑니다. Ag가 공정점(共晶, 3.5 %)을 넘으면 다 녹는 온도가 가파르게 오르지만, 보통 리플로우 온도(240~260 °C)에서는 고체로 남는 Ag₃Sn이 몇 %뿐입니다. 더 흔한 문제는 식을 때 자라는 큰 Ag₃Sn 판입니다.'}
  ],
  icon(K){
    const {R} = K;
    return R(16, 34, 36, 20, 'f-cu2') + R(16, 28, 36, 6, 'f-ni') + R(16, 22, 36, 6, 'f-cu2') + R(16, 4, 36, 18, 'f-sn2');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, W, TT, wrap} = K;
    let s = '';
    BATHS.forEach((b, i) => {
      let g = R(b.x, 130, 500, 520, 'pl-panel', {rx: 16}) + R(b.x, 130, 500, 520, 'pl-hlbox', W({rx: 16}, only(b.id === 'snag' ? 'snag comp' : b.id)));
      g += T(b.x + 24, 172, b.nm, 't-acc', 'start');
      // 비커
      g += P(`M${b.x + 26},200 L${b.x + 26},378 Q${b.x + 26},392 ${b.x + 40},392 L${b.x + 254},392 Q${b.x + 268},392 ${b.x + 268},378 L${b.x + 268},200`, 'f-tank') + R(b.x + 29, 230, 236, 159, 'f-bath');
      b.ions.forEach((k, j) => { for (let n = 0; n < 2; n++) g += K.jiggle(b.x + 62 + ((j * 2 + n) % 4) * 54, 268 + Math.floor((j * 2 + n) / 4) * 62, k, i * 20 + j * 3 + n, 8); });
      if (b.id === 'snag') g += C(b.x + 62 + 108, 268, 26, 'pl-cplx', tip('착화제가 Ag⁺를 감싸 붙잡아 둔다'));
      // 두 다이의 범프 (도금 직후, 같은 축척 µm당 5) — 이 액으로 쌓는 층만 강조
      const lit = die => id => (' ' + b.on[die] + ' ').includes(' ' + id + ' ') ? ' pl-lyon' : ' pl-lyoff';
      g += R(b.x + 286, 390, 208, 8, 'f-seed2', tip('Cu 시드 — 실제 수백 nm, 그림은 과장'));
      g += stack(K, 'base', b.x + 296, 390, 84, 5, 0, lit('base')) + stack(K, 'core', b.x + 402, 390, 84, 5, 0, lit('core'));
      if (!b.on.core) g += T(b.x + 444, 292, 'Cu 안 씀', 't-dim');
      g += T(b.x + 391, 222, '범프에서 이 층', 't-dim') + T(b.x + 338, 424, '베이스', 't-dim') + T(b.x + 444, 424, '코어', 't-dim');
      g += TT(b.x + 24, 456, b.lines, 't-sub', 'start', 38);
      s += G(g, tip(b.nm));
    });
    // ── 아래 패널: 단계마다 다른 그림
    s += R(40, 680, 1540, 440, 'pl-panel', {rx: 16}) + R(40, 680, 1540, 440, 'pl-hlbox', W({rx: 16}, only('order comp')));

    // order: 다이마다 쌓는 순서 — 열 = 도금 단계(쓰는 액), 줄 = 다이. 두 다이 같은 축척 (µm당 4, 폭 = 지름 25 µm)
    const OX = [380, 700, 1020, 1340], OW = 100, YB = 892, YC = 1046;
    const snap = (die, i, n, y0, newId) => R(OX[i] - 66, y0, 132, 6, 'f-seed2') + stack(K, die, OX[i] - OW / 2, y0, OW, 4, n, id => id === newId ? ' pl-lyon' : '');
    let od = T(64, 722, '다이마다 쌓는 순서 — 도금액은 셋, 순서는 둘', 'pl-hdg', 'start') + T(1556, 722, '두께 · 지름은 예시 · 두 다이 같은 축척', 't-dim', 'end');
    ['Cu 도금액', 'Ni 도금액', 'Cu 도금액 (다시)', 'SnAg 도금액'].forEach((t, i) => { od += T(OX[i], 756, t, i === 2 ? 'p10-again' : 't-sub'); });
    // 베이스 다이: Cu 기둥 → Ni → 상부 Cu → SnAg (Cu 액을 두 번)
    od += LB(T(64, 818, '베이스 다이', 'p10-bt', 'start') + T(64, 846, 'Cu / Ni / Cu / SnAg', 't-dim', 'start') + T(64, 872, '예시 높이 30 µm', 't-dim', 'start'), tip('맨 아래 로직 · 인터페이스 다이 — 범프가 인터포저(또는 기판) 쪽에 붙는다'));
    [['① Cu 기둥 · 12 µm', '높이 · 전기 · 열의 길', 'cu'], ['② Ni · 3 µm', 'Cu 기둥과 솔더 사이 방벽', 'ni'], ['③ 상부 Cu · 3 µm', '솔더가 처음 만나는 면', 'top'], ['④ SnAg · 12 µm', '녹아서 붙는 솔더', 'sn']]
      .forEach(([h, r, id], i) => { od += snap('base', i, i + 1, YB, id) + T(OX[i], YB + 30, h, 't-sub') + T(OX[i], YB + 54, r, 't-dim'); });
    [0, 1, 2].forEach(i => {
      const x0 = OX[i] + 72, x1 = OX[i + 1] - 72, xm = (x0 + x1) / 2;
      if (i !== 1){ od += K.arrow(x0, YB - 40, x1, YB - 40) + T(xm, YB - 52, '헹굼', 't-dim'); return; }
      // Ni → 상부 Cu: Ni가 산화되기 전에 곧바로
      od += G(K.arrow(x0, YB - 40, x1, YB - 40, 's-arr2') + T(xm, YB - 52, '헹굼 · 곧바로', 'pl-warn') + T(xm, YB - 18, 'Ni 산화 전에', 't-dim'),
        tip('Ni 표면은 공기 · 물에서 금방 얇은 산화막(부동태)이 생긴다\n→ 그 위 상부 Cu의 밀착이 약해질 수 있다 (들뜸)\n→ 마르지 않게 지체 없이, 필요하면 산 담금(활성화)'));
    });
    // 코어 다이: Cu 기둥 없이 시드 위에 Ni → SnAg
    od += LB(T(64, 1000, '코어 다이', 'p10-bt', 'start') + T(64, 1028, 'Ni / SnAg', 't-dim', 'start') + T(64, 1054, '예시 높이 17 µm', 't-dim', 'start'), tip('여러 장 쌓이는 DRAM 다이 — 범프가 아래 다이의 후면 패드에 붙는다'));
    od += R(OX[0] - 66, YC, 132, 6, 'f-seed2') + R(OX[0] - OW / 2, YC - 48, OW, 48, 'pl-ghost', tip('코어 다이에는 Cu 기둥이 없다 — 접합부를 낮게\n(12~16단을 정해진 높이 안에 쌓아야 해서 · 보통 드는 이유)')) + T(OX[0], YC + 30, 'Cu 기둥 없음', 't-dim') + T(OX[0], YC + 54, '시드 위에 바로 Ni', 't-dim');
    od += snap('core', 1, 1, YC, 'ni') + T(OX[1], YC + 30, '① Ni · 5 µm', 't-sub') + T(OX[1], YC + 54, '몸통 겸 방벽 · 저응력 · 밀착', 't-dim');
    od += G(K.arrow(OX[1] + 72, YC - 34, OX[3] - 72, YC - 34, 's-arr2') + T(OX[2], YC - 46, '헹굼 · 곧바로', 'pl-warn'),
      tip('코어 다이도 Ni 다음은 곧바로 — Ni 표면에 산화막(부동태)이 생기면\n그 위 SnAg의 밀착이 약해질 수 있다 (마르지 않게 · 필요하면 산 담금)')) + T(OX[2], YC + 30, '상부 Cu 없음', 't-dim');
    od += snap('core', 3, 2, YC, 'sn') + T(OX[3], YC + 30, '② SnAg · 12 µm', 't-sub') + T(OX[3], YC + 54, '같은 SnAg 액 · 같은 두께', 't-dim');
    s += G(od, only('order'));

    // cu: 인 함유 구리 양극의 검은 피막 — 얇음 · 알맞음 · 두꺼움
    let cu = T(64, 722, '인 함유 구리 양극 — 검은 피막이 하는 일', 'pl-hdg', 'start') + T(64, 752, 'P 약 0.04~0.065 % · 전류와 Cl⁻가 있어야 피막이 생긴다', 't-dim', 'start');
    const film = (x0, kind) => {
      const fw = {thin: 3, good: 12, thick: 34}[kind];
      let g = R(x0, 822, 46, 140, 'f-anode', tip('인 함유 구리 양극')) + R(x0 + 46, 822, fw, 140, 'p10-film', tip('검은 피막')) + R(x0 + 46 + fw, 822, 400 - fw, 140, 'f-bath');
      if (kind === 'good') for (let k = 0; k < 3; k++) g += K.ionPath(`M${x0 + 80},${852 + k * 40} L${x0 + 420},${852 + k * 40}`, 'cu', 3.4, k * 1.1);
      if (kind === 'thin'){
        g += K.ionPath(`M${x0 + 70},852 L${x0 + 420},852`, 'cu', 3.4, 0.4) + C(x0 + 82, 912, 19, 'p10-cup') + T(x0 + 82, 918, 'Cu⁺', 'p10-ct') + K.arrow(x0 + 102, 912, x0 + 176, 924, 's-arrr');
        const r = K.rng(7);
        for (let k = 0; k < 16; k++) g += C(x0 + 190 + r() * 220, 900 + r() * 56, 3 + r() * 2.5, 'p10-dust');
        g += LB(T(x0 + 300, 892, '구리 가루', 't-dim'));
      }
      if (kind === 'thick'){
        g += P(`M${x0 + 58},850 l14,18 M${x0 + 64},900 l16,-10 M${x0 + 56},935 l20,10`, 'p10-crack') + K.ionPath(`M${x0 + 96},852 L${x0 + 420},852`, 'cu', 3.4, 0.8);
        [[130, 902, 20], [190, 934, -15], [250, 912, 35], [320, 944, -30]].forEach(([dx, y, a]) => { g += R(x0 + dx, y, 22, 8, 'p10-film', {transform: `rotate(${a} ${x0 + dx + 11} ${y + 4})`}); });
        g += LB(T(x0 + 230, 892, '떨어진 조각', 't-dim'));
      }
      return g;
    };
    const FC = [[64, 'thin', 'pl-hdg2', '① 피막이 얇거나 없음', 'Cu⁺가 생겨 구리 가루(슬러지)가 된다 → 입자 · 노듈, 첨가제도 더 쓴다'], [584, 'good', 'pl-hdg3', '② 알맞은 검은 피막', 'Cu⁺를 줄여 Cu²⁺로 고르게 녹는다 → 찌꺼기 · 첨가제 소모가 적다'], [1104, 'thick', 'pl-hdg2', '③ 피막이 너무 두꺼움', '피막이 떨어져 나와 입자가 된다 · 전압이 오른다']];
    FC.forEach(([x0, kind, c, h, d]) => { cu += T(x0, 800, h, c, 'start') + film(x0, kind) + TT(x0, 994, wrap(d, 22.5), 't-dim', 'start', 26); });
    cu += T(64, 1090, '새 양극 · 오래 쉰 뒤에는 더미 도금으로 피막을 다시 만든다 · 분리막이 있으면 입자는 대부분 막에 걸린다 (09장)', 't-sub', 'start');
    s += G(cu, only('cu'));

    // ni: 설파민산 Ni 관리 창 + 꼭 알아 둘 네 가지 (오른쪽 두 칸은 다이마다 다른 점)
    const nx = ph => 150 + (ph - 2.5) / 3 * 450, ny = t => 1040 - (t - 25) / 45 * 260;
    let ni = T(64, 722, '설파민산 Ni — 관리 창 (공개 자료 예시 · 약품마다 다름)', 'pl-hdg', 'start');
    ni += R(nx(2.5), ny(70), 450, ny(60) - ny(70), 'p10-bad') + R(nx(2.5), ny(60), nx(3.5) - nx(2.5), ny(25) - ny(60), 'p10-bad') + R(nx(5), ny(60), nx(5.5) - nx(5), ny(25) - ny(60), 'p10-warn');
    ni += R(nx(3.5), ny(55), nx(4.5) - nx(3.5), ny(35) - ny(55), 'p10-ok', tip('pH 약 3.5~4.5 · 약 35~55 °C'));
    ni += L(nx(2.5), ny(25), nx(5.5) + 8, ny(25), 's-axis') + L(nx(2.5), ny(25), nx(2.5), ny(70) - 8, 's-axis');
    [3, 4, 5].forEach(v => { ni += L(nx(v), ny(25), nx(v), ny(25) + 8, 's-axis') + T(nx(v), ny(25) + 30, String(v), 't-dim'); });
    [30, 40, 50, 60, 70].forEach(v => { ni += L(nx(2.5) - 8, ny(v), nx(2.5), ny(v), 's-axis') + T(nx(2.5) - 14, ny(v) + 7, String(v), 't-dim', 'end'); });
    ni += LB(T(nx(5.5), ny(25) + 56, 'pH', 't-sub', 'end') + T(nx(2.5) - 14, ny(70) - 18, '°C', 't-dim', 'end'));
    ni += LB(T(nx(4), ny(65) + 7, '너무 뜨거움 → 설파민산 분해 · 응력↑', 't-dim') + T(nx(3), ny(44), 'pH 낮음', 't-dim') + T(nx(3), ny(44) + 26, '→ 분해', 't-dim') + T(nx(5.25), ny(44), '응력↑', 't-dim') + T(nx(4), ny(45) + 7, '권장 창', 'pl-hdg3'));
    const NR = [['pl-hdg', '붕산 — 표면 pH 완충', '음극에서 수소가 조금 나오면 표면 pH가 올라 수산화물이 막에 섞입니다(거칠고 단단해짐). 붕산이 이것을 막습니다.'],
      ['pl-hdg', '염화물 — 양극을 잘 녹게', '모자라면 Ni 양극이 막혀(부동태) 전압이 오르고 pH가 내려갑니다. 양극에서 설파민산이 분해되면 응력도 변합니다.'],
      ['pl-hdg3', '코어 다이 — Ni가 몸통', '얇은 Cu 시드(예시 300 nm) 위에 바로, 더 두껍게(예시 5 µm) 쌓습니다. 두꺼울수록 막 응력이 휨 · 들뜸으로 이어져 저응력 설파민산이 중요하고, 시드 위 첫 핵이 고르게 생겨야 잘 붙습니다.'],
      ['pl-hdg2', 'Ni 표면은 금방 산화된다', '공기 · 물에서 얇은 산화막(부동태)이 생겨, 그 위에 올릴 층(베이스: 상부 Cu · 코어: SnAg)의 밀착이 약해질 수 있습니다. 헹굼 뒤 지체 없이 넘기고, 필요하면 산 담금(활성화)을 합니다 (09장).']];
    NR.forEach(([c, h, d], k) => {
      const x = k < 2 ? 680 : 1130, y = 772 + (k % 2) * 178;
      ni += T(x, y, h, c, 'start') + TT(x, y + 30, wrap(d, 21.5), 't-dim', 'start', 26);
    });
    s += G(ni, only('ni'));

    // snag: 착화제와 양극
    const vy = v => 836 + (0.9 - v) * 210;
    let sa = T(64, 722, 'SnAg 액이 까다로운 이유 — 착화제와 양극', 'pl-hdg', 'start');
    sa += T(64, 790, '전자를 받는 힘 (표준 전위)', 't-sub', 'start') + L(100, vy(0.9), 100, vy(-0.3), 's-axis');
    sa += L(92, vy(0.8), 108, vy(0.8), 's-axis') + L(92, vy(-0.14), 108, vy(-0.14), 's-axis') + C(100, vy(0.8), 7, 'k-acc2') + C(100, vy(-0.14), 7, 'k-acc');
    sa += LB(T(120, vy(0.8) + 7, 'Ag⁺/Ag +0.80 V', 't-sub', 'start') + T(120, vy(-0.14) + 7, 'Sn²⁺/Sn −0.14 V', 't-sub', 'start') + T(120, (vy(0.8) + vy(-0.14)) / 2 - 10, '약 0.94 V 차이', 't-dim', 'start'));
    sa += K.arrow(300, vy(0.8) + 22, 300, vy(-0.14) - 24, 's-arr3') + LB(T(312, (vy(0.8) + vy(-0.14)) / 2 + 22, '착화제', 'p10-cx', 'start') + T(312, (vy(0.8) + vy(-0.14)) / 2 + 48, '→ 가깝게', 't-dim', 'start'));
    sa += T(420, 790, '착화제가 없으면', 'pl-hdg2', 'start');
    let sy = 822;
    ['① Ag가 먼저 · 많이 쌓여 Ag가 많은 나뭇가지(덴드라이트) 막이 된다', '② 액 속에서 Sn²⁺가 Ag⁺에게 전자를 줘 Ag 알갱이가 가라앉는다 (Ag 손실 · 입자)', '③ Sn 양극 · 갓 쌓은 Sn · 밑면(베이스는 상부 Cu, 코어는 Ni)에 Ag가 전기 없이 붙는다 (치환 석출)'].forEach(t => {
      const ln = wrap(t, 24.5); sa += TT(420, sy, ln, 't-dim', 'start', 25); sy += ln.length * 25 + 12;
    });
    sa += TT(420, sy + 14, wrap('착화제가 떨어지거나 분해되면 → Ag %가 튀고 액이 흐려진다', 24.5), 'p10-cx', 'start', 25);
    sa += T(950, 790, '양극(+) 두 방식 — 둘 다 분리막 뒤에', 't-sub', 'start');
    const abox = (x, h, lines) => {
      let g = R(x, 808, 300, 192, 'pl-box', {rx: 12}) + T(x + 16, 840, h, 'p10-bt', 'start');
      let yy = 872;
      lines.forEach(t => { const ln = wrap(t, 14.6); g += TT(x + 16, yy, ln, 't-dim', 'start', 24); yy += ln.length * 24 + 6; });
      return g;
    };
    sa += abox(950, 'Sn 양극', ['Sn이 녹아서 보충', '양극액엔 Ag를 넣지 않음 (Sn 양극에 Ag가 치환 석출)', 'Sn이 조금씩 늘기 쉽다']);
    sa += abox(1264, '불용성 양극', ['산소가 나와 Sn²⁺ · 첨가제를 산화 → 분리막으로 나눔', 'Sn 농축액으로 보충 → 산(MSA)이 쌓인다']);
    sa += T(950, 1034, 'Sn²⁺ → Sn⁴⁺ (공기 · 양극 · 높은 온도)', 'pl-hdg2', 'start') + TT(950, 1062, ['→ SnO₂ 알갱이(100 nm 이하) → 막에 섞여 노듈 · 리플로우 무너짐', '→ 공기 접촉 · 온도를 줄이고 필터 · Sn⁴⁺ 분석'], 't-dim', 'start', 26);
    s += G(sa, only('snag'));

    // comp: Sn–Ag 상태도 + 범프 + 판정
    let pd = T(64, 722, 'SnAg 조성 → 리플로우에서 녹는 모습 (개략 상태도)', 't-acc', 'start');
    pd += L(PD.x0, PD.y0, PD.x1 + 10, PD.y0, 's-axis') + L(PD.x0, PD.y0, PD.x0, PD.y1 - 10, 's-axis');
    for (let a = 0; a <= AMAX; a += 1) pd += L(px(a), PD.y0, px(a), PD.y0 + 8, 's-axis') + (a % 2 ? '' : T(px(a), PD.y0 + 30, String(a), 't-dim'));
    for (let t = 200; t <= 300; t += 20) pd += L(PD.x0 - 8, py(t), PD.x0, py(t), 's-axis') + T(PD.x0 - 14, py(t) + 7, String(t), 't-dim', 'end');
    pd += LB(T((PD.x0 + PD.x1) / 2, PD.y0 + 54, 'Ag (무게 %)', 't-sub') + T(PD.x0 + 8, PD.y1 - 6, '°C', 't-dim', 'start'));
    pd += R(px(1.5), PD.y1, px(2.5) - px(1.5), PD.y0 - PD.y1, 'p10-tgt', tip('범프 SnAg의 Ag 목표 — 보통 1.5~2.5 wt% (공정점보다 적게)'));
    let lq = '';
    for (let a = 0; a <= AMAX + 1e-4; a += 0.1) lq += (lq ? ' L' : 'M') + px(a).toFixed(1) + ',' + py(liq(a)).toFixed(1);
    pd += P(lq + ` L${px(AMAX)},${py(PD.t1)} L${px(0)},${py(PD.t1)} Z`, 'pl-liqz') + P(lq, 's-curve', tip('액상선 — 이 온도 위에서 다 녹는다 (근삿값)'));
    pd += L(px(0), py(TE), px(AMAX), py(TE), 's-dash') + C(px(EU), py(TE), 7, 'k-acc2', tip('공정점(共晶) — Ag 3.5 %, 221 °C. 한 온도에서 한꺼번에 녹는다'));
    pd += LB(T(px(8.3), py(208), '고체 (Sn + Ag₃Sn)', 't-dim'), {'data-v': 'l3'});      // 최고 온도가 낮아 이름표와 겹치면 숨긴다
    pd += LB(T(px(0.3), py(291), '다 녹음 (액체)', 't-sub', 'start') + T(px(EU), py(TE) + 28, '공정점(共晶)', 'p10-eu') + T(px(EU), py(TE) + 50, '3.5 % · 221 °C', 'p10-eu'));
    pd += LB(T(px(8.3), py(229), '액체 + 고체 Ag₃Sn', 't-dim'), {'data-v': 'l2'});        // 최고 온도 이름표와 겹치면 숨긴다
    pd += K.lead(px(1.6), py(224.6), px(0.3), py(268), '액체 + 고체 Sn', 'start', 't-dim') + LB(T(px(2), PD.y1 - 10, '보통 목표', 'p10-tg'));
    pd += `<g data-v="pd"></g><g data-v="bump"></g>`;
    pd += R(1160, 740, 396, 360, 'pl-box', {rx: 12}) + T(1180, 774, '판정 (개념 예시)', 'pl-hdg', 'start') + `<g data-v="verdict"></g>`;
    s += G(pd, only('comp'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — SnAg 조성과 리플로우</div>
      ${K.ctl('j', '전류밀도 (ASD)', 2, 15, 0.5, 5)}${K.ctl('a', '교반 (흐름 · 회전, 배수)', 0, 100, 1, 50)}${K.ctl('c', '액의 Ag 농도 (목표 대비)', 0.5, 2, 0.05, 1)}${K.ctl('pk', '리플로우 최고 온도 (°C, 예시)', 210, 270, 1, 250)}
      ${K.kpis([['Ag', 'k-ag', '무게 %'], ['다 녹는 온도', 'k-tl', '액상선'], ['리플로우 뒤', 'k-v', '']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('Ag 부분 전류 = 공급 한계 몫(액의 Ag 농도 · √교반에 비례) × J/(J+1) + 작은 반응 몫, 나머지는 Sn. 경향을 보이는 모델이고, 실제 액은 착화제로 덜 민감하게 설계됩니다. 상태도는 근삿값(±3~5 °C)이고, 고체 몫은 지렛대 규칙으로 계산합니다. 내 액의 실험 데이터로 확인하세요.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, TT, tip, wrap, W} = K;
    const st = {j: 5, a: 50, c: 1, pk: 250};
    const agMul = v => 0.5 * Math.pow(4, v / 100);          // ×0.5 ~ ×2
    function render(){
      const sp = agSplit(st.j, agMul(st.a), st.c), ag = sp.wt, m = melt(ag, st.pk);
      const fsP = Math.round(m.fs * 100), fsT = fsP < 1 ? '1 % 미만' : '약 ' + fsP + ' %';
      const word = m.k === 'liq' ? '다 녹음' : m.k === 'solid' ? '안 녹음' : m.fs < 0.1 ? '대부분 녹음' : m.fs < 0.5 ? '덜 녹음' : '일부만 녹음';
      const cls = m.k === 'solid' || (m.k === 'two' && m.fs >= 0.1) ? 'ng' : (m.k === 'two' || ag > EU) ? 'warn' : 'ok';
      const xa = px(ag);
      // 상태도 위: Ag 위치 · 최고 온도 · 지금 상태 점 · 고체가 남으면 지렛대(이음선)
      let pd = L(xa, PD.y0, xa, py(Math.max(m.tl, st.pk)), 's-dash') + L(px(0), py(st.pk), px(AMAX), py(st.pk), 'pl-peak');
      pd += LB(T(px(AMAX) - 4, py(st.pk) - 10, `최고 ${st.pk} °C`, 'pl-pkt', 'end'));
      pd += C(xa, py(m.tl), 6, 'k-acc', tip(`다 녹는 온도(액상선) ${m.tl.toFixed(0)} °C`));
      if (m.k === 'two'){
        const x1 = m.ph === 'Ag₃Sn' ? px(AMAX) : px(0);
        pd += L(px(m.cl), py(st.pk), x1, py(st.pk), 'p10-tie', tip(`지렛대: 액체(Ag ${m.cl.toFixed(1)} %) ↔ 고체 ${m.ph}`)) + C(px(m.cl), py(st.pk), 6, 'k-acc');
      }
      pd += C(xa, py(st.pk), 11, 'k-' + cls) + C(xa, py(st.pk), 20, 'co-ring');
      // 「x % → y °C」 이름표: 액상선 점의 오른쪽 · 왼쪽 위에서 곡선 · 상태 점 · 축 글자 · 다른 이름표와 안 겹치는 첫 자리 (글자 폭은 어림값)
      const lt = `${ag.toFixed(1)} % → ${m.tl.toFixed(0)} °C`, lw = lt.length * 12.6, yPk = py(st.pk);
      // 비워 둘 곳 [x0, y0, x1, y1]: 제목 · °C · 보통 목표 · 다 녹음 · 액체+고체 Sn · 공정점 · 최고 온도 이름표
      const busy = [[60, 700, 730, 730], [426, 736, 452, 760], [515, 732, 601, 756], [436, 764, 580, 796], [436, 834, 584, 860], [600, 998, 724, 1046], [978, yPk - 30, 1110, yPk - 4]];
      if (!(st.pk > 216 && st.pk < 238)) busy.push([914, 946, 1072, 974]);
      if (st.pk >= 217) busy.push([914, 1006, 1072, 1034]);
      const cost = (x0, yb) => {
        const x1 = x0 + lw, y0 = yb - 20, y1 = yb + 6;
        if (x0 < PD.x0 + 6 || x1 > 1150 || y0 < 700) return 1e6;
        let c = 0;
        for (let x = x0; x <= x1; x += 5){ const yc = py(liq((x - PD.x0) / (PD.x1 - PD.x0) * AMAX)); if (yc > y0 - 4 && yc < y1 + 4){ c += 100; break; } }
        busy.forEach(([a0, b0, a1, b1]) => { if (x0 < a1 && x1 > a0 && y0 < b1 && y1 > b0) c += 100; });
        const nx = Math.max(x0, Math.min(xa, x1)), ny = Math.max(y0, Math.min(yPk, y1));
        if (Math.hypot(nx - xa, ny - yPk) < 22) c += 100;                 // 상태 점
        if (yPk > y0 && yPk < y1) c += 1;                                  // 최고 온도 점선 (지나가도 읽히지만 피하면 좋다)
        return c;
      };
      let lp = null, lc = Infinity;
      [30, 60, 90, 120].forEach(dy => {
        const gx = dy > 30 ? 36 : 24;                                      // 오른쪽으로 높이 올릴 때는 상태 점에서 더 띄운다
        [xa + gx, xa - 24 - lw].forEach(x0 => { const c = cost(x0, py(m.tl) - dy); if (c < lc){ lc = c; lp = [x0, py(m.tl) - dy, dy]; } });
      });
      if (lp[2] > 30){                                                     // 점에서 멀리 놓이면 점까지 가는 가는 선
        const lx = Math.max(lp[0] + 8, Math.min(xa, lp[0] + lw - 8));
        pd += L(lx, lp[1] + 8, xa + (lx > xa ? 4 : -4), py(m.tl) - 7, 'p10-agk');
      }
      pd += LB(T(lp[0], lp[1], lt, 'p10-agl', 'start'));
      ctx.$('[data-v="pd"]').innerHTML = pd;
      ctx.$('[data-v="l2"]').classList.toggle('hide', st.pk > 216 && st.pk < 238);
      ctx.$('[data-v="l3"]').classList.toggle('hide', st.pk < 217);
      // 범프 단면 (리플로우 뒤, 베이스 다이 예시 · µm당 약 7.2): Cu 기둥 12 · Ni 3 · 상부 Cu 3 µm 위에 돔. yT = 상부 Cu 윗면 = 돔 바닥
      const bx = 96, bw = 180, by = 1000, yT = by + 50 - 18 * 7.2;
      let b = R(bx - 30, by + 50, bw + 60, 14, 'f-seed2') + stack(K, 'base', bx, by + 50, bw, 7.2, 3);
      const dome = `M${bx},${yT} C${bx - 10},${yT - 42} ${bx},${by - 190} ${bx + bw / 2},${by - 196} C${bx + bw},${by - 190} ${bx + bw + 10},${yT - 42} ${bx + bw},${yT} Z`;
      const rough = m.k === 'solid' || (m.k === 'two' && m.fs >= 0.5);     // 고체가 절반 넘게 남으면 둥글어지지 못한다
      if (rough) b += P(`M${bx},${yT} L${bx},${by - 170} L${bx + 40},${by - 182} L${bx + 70},${by - 168} L${bx + 120},${by - 186} L${bx + 160},${by - 170} L${bx + bw},${by - 178} L${bx + bw},${yT} Z`, 'f-sn2', tip(m.k === 'solid' ? '녹지 않은 솔더 — 도금한 모양 그대로' : `덜 녹은 솔더 — 고체 ${m.ph}이 ${fsT} 남아 둥글어지지 못함`));
      else b += P(dome, 'f-sn2', tip(m.k === 'liq' ? '다 녹아 둥글어진 솔더' : `고체 ${m.ph}이 ${fsT} 남은 채 둥글어짐`));
      if (m.k !== 'solid') b += R(bx, yT - 3, bw, 6, 'f-imc', tip('IMC — 상부 Cu 위 Cu₆Sn₅ (얇게)\n코어 다이는 Ni 위 Ni₃Sn₄'));
      if (m.k === 'two'){
        const n = Math.max(1, Math.min(8, Math.round(m.fs * 40)));
        const r = K.rng(11);
        for (let k = 0; k < n; k++) b += R(bx + 30 + r() * 130, by - 170 + r() * 80, 14, 9, m.ph === 'Ag₃Sn' ? 'pl-ag3' : 'p10-snc', tip(m.ph === 'Ag₃Sn' ? '녹지 않고 남은 고체 Ag₃Sn' : '녹지 않고 남은 고체 Sn'));
      }
      if (!rough && ag > EU){
        b += R(bx + 24, by - 128, 150, 9, 'pl-ag3', W(tip('식을 때 자란 큰 Ag₃Sn 판 — 균열이 지나가기 쉬운 길'), {transform: `rotate(-14 ${bx + 99} ${by - 124})`}));
        if (ag > 5) b += R(bx + 40, by - 104, 120, 8, 'pl-ag3', {transform: `rotate(10 ${bx + 100} ${by - 100})`});
      }
      b += T(bx + bw / 2, 772, word, cls === 'ok' ? 't-sub' : 'pl-warn') + T(bx + bw / 2, 798, '리플로우 뒤 (베이스 다이 예시)', 't-dim');
      ctx.$('[data-v="bump"]').innerHTML = b;
      // 판정 상자
      let v = T(1180, 816, word, cls === 'ok' ? 'p10-vok' : 'p10-vng', 'start');
      let vy = 848;
      const line = (t, c) => { const ln = wrap(t, 17.6); v += TT(1180, vy, ln, c, 'start', 26); vy += ln.length * 26 + 8; };
      line(`Ag\u00a0${ag.toFixed(1)}\u00a0% · 액상선\u00a0${m.tl.toFixed(0)}\u00a0°C · 최고\u00a0${st.pk}\u00a0°C`, 't-dim');
      if (m.k === 'two') line(`+ 고체 ${m.ph} ${fsT.replace(/ /g, '\u00a0')} (지렛대\u00a0규칙\u00a0·\u00a0노란\u00a0선)`, 't-sub');
      if (m.k === 'solid') line('최고 온도가 공정점(共晶) 221 °C보다 낮다', 't-sub');
      if (ag > EU) line('⚠ Ag > 3.5 % — 식을 때 큰 Ag₃Sn 판이 자라기 쉽다 → 균열 길', 'p10-wn');
      else if (ag > 2.5) line('목표보다 높음 — 마이크로범프는 3.5\u00a0% 아래에서도 판이 보고됨', 'p10-wn');
      else if (ag < 1) line('Ag < 1 % → 녹는 온도↑(232 °C 쪽), 강도 · 위스커 억제↓', 'p10-wn');
      else if (ag >= 1.5) line('✓ 보통 목표(1.5~2.5 %) 안', 'p10-okt');
      v += TT(1180, Math.max(1030, vy + 22), wrap('덜 녹아 보이면 보통 산화막 · 유기물 · 낮은 최고 온도가 먼저입니다 (12장)', 19.5), 't-dim', 'start', 25);
      ctx.$('[data-v="verdict"]').innerHTML = v;
      ctx.out('k-ag', ag.toFixed(1) + ' %'); ctx.out('k-tl', m.tl.toFixed(0) + ' °C'); ctx.out('k-v', word);
      const kv = ctx.card.querySelector('[data-o="k-v"]').parentNode;
      ['ok', 'warn', 'ng'].forEach(c => kv.classList.toggle(c, cls === c));
      let msg = `Ag에 쓰인 전류 <b>${(sp.x * 100).toFixed(1)} %</b> → Ag <b>${ag.toFixed(1)} %</b> (Ag⁺는 전자 1개, Sn²⁺는 2개라 같은 전기로 약 1.8배 무겁게 쌓입니다). `;
      msg += m.k === 'liq' ? `다 녹는 온도 ${m.tl.toFixed(0)} °C보다 높아 다 녹습니다.` : m.k === 'solid' ? '최고 온도가 공정점(共晶) 221 °C보다 낮아 녹지 않습니다.' : `액상선 ${m.tl.toFixed(0)} °C보다 낮아 고체 ${m.ph}이 ${fsT} 남습니다.`;
      if (ag > EU) msg += ' <b>Ag가 공정점(共晶) 3.5 %보다 많아 식을 때 큰 Ag₃Sn 판이 자랄 수 있습니다(균열 길).</b>';
      else if (ag > 2.5) msg += ' Ag가 보통 목표(1.5~2.5 %)보다 높습니다. 마이크로범프는 솔더가 적어 3.5 % 아래에서도 큰 Ag₃Sn 판이 보고됩니다.';
      else if (ag < 1) msg += ' Ag가 너무 적으면 녹는 온도가 Sn(232 °C) 쪽으로 오르고 Ag의 이점이 줄어듭니다.';
      else if (ag >= 1.5) msg += ' 보통 목표(1.5~2.5 %) 안입니다. 베이스 다이는 상부 Cu를 다 쓰면 남은 솔더의 Ag가 약 2배로 진해지므로, 상한을 이 몫까지 넣어 정합니다 (<a href="#go-reflow-06">리플로우 06장</a>).';
      ctx.q('[data-o=msg]').innerHTML = msg;
      ctx.refresh();
    }
    const go = () => { if (ctx.step() && ctx.step() !== 'comp') ctx.go('comp'); };
    ctx.range('j', v => { st.j = v; render(); return v.toFixed(1); });
    ctx.range('a', v => { st.a = v; render(); return '×' + agMul(v).toFixed(2); });
    ctx.range('c', v => { st.c = v; render(); return '×' + v.toFixed(2); });
    ctx.range('pk', v => { st.pk = v; render(); return v + ' °C'; });
    ctx.card.querySelectorAll('input').forEach(i => i.addEventListener('input', go));
  },
  notes(K){
    return K.terms([
      ['코어 · 베이스 다이', '코어 다이 = 여러 장 쌓이는 DRAM 다이 (앞면 범프 Ni / SnAg). 베이스 다이 = 맨 아래 로직 · 인터페이스 다이 (Cu / Ni / Cu / SnAg, 인터포저 쪽)'],
      ['상부 Cu', 'Ni 위에 얇게 한 번 더 올린 Cu (베이스 다이, 예시 3 µm). 솔더가 처음 만나는 면. 아래쪽 두꺼운 Cu는 Cu 기둥'],
      ['인 함유 구리 양극', 'P 약 0.04~0.065 %. 전류 · Cl⁻가 있으면 표면에 검은 피막이 생겨 Cu⁺(구리 가루의 원인)를 줄인다'],
      ['설파민산 니켈', '응력이 낮은 Ni 도금액. 붕산이 표면 pH 상승을 막고, 염화물이 양극을 잘 녹게 한다'],
      ['부동태', '금속 표면에 얇은 산화막이 생겨 녹거나 붙는 반응이 잘 안 되는 상태'],
      ['MSA', '메탄설폰산. SnAg 도금액의 산. 금속염이 잘 녹고 비교적 다루기 쉽다'],
      ['착화제', '금속 이온을 감싸 붙잡아 두는 분자. Ag가 혼자 먼저 · 저절로 석출되는 것을 막는다'],
      ['치환 석출', '전류 없이 Ag⁺가 Sn · Ni · Cu 같은 금속 표면에서 전자를 빼앗아 저절로 붙는 것'],
      ['wt %', '무게 기준 퍼센트. Ag 2 wt% = 솔더 100 g에 Ag 2 g'],
      ['공정점(共晶)', '두 금속이 섞여 한 온도에서 한꺼번에 녹는 조성. Sn–Ag는 Ag 3.5 wt%, 221 °C. 공정(工程)과 다른 말'],
      ['액상선', '이 온도 위에서는 다 녹는 선. 공정점(共晶)에서 멀어질수록 오른다'],
      ['Ag₃Sn', 'Ag 약 73 wt%인 단단한 화합물. 공정점보다 Ag가 많으면 액체에서 먼저 굳어 판으로 자란다'],
      ['IMC (금속간 화합물)', '솔더의 Sn이 Ni · Cu와 반응해 생기는 단단한 화합물 층 (코어: Ni 위 Ni₃Sn₄ · 베이스: 상부 Cu 위 Cu₆Sn₅)']
    ]) + K.field([
      '<b>Ag % 맵은 두께 맵과 반대로 움직이기 쉽습니다.</b> 국부 전류밀도가 높은 곳(가장자리 · 고립 범프)은 두껍고 Ag가 낮습니다. 제품이 바뀌어 개구율이 달라지면 같은 전류에서도 실제 전류밀도가 바뀌어 Ag %가 바뀝니다 (<a data-go="wafer">07</a> · <a data-go="pattern">08장</a>).',
      '<b>온도</b>를 올리면 보통 Ag 공급이 빨라져 Ag %가 오르고, Sn²⁺ 산화(Sn⁴⁺ 찌꺼기)도 빨라집니다. 열교환기 이상은 SnAg에서 두께보다 조성으로 먼저 보일 수 있습니다 (<a data-go="tool.loop">09장</a>).',
      '<b>저알파 주석</b> — Sn 원료 · 양극 · 약품에 아주 적은 방사성 불순물(예: Po-210)이 있으면 알파 입자가 나와 메모리 셀의 데이터를 뒤집을 수 있습니다(소프트 에러). 메모리 범프용 Sn 약품은 알파 방출 규격으로 관리하고, 공급처 · 등급 변경은 변경관리 대상입니다.',
      '비용융(덜 녹음)이 보이면 Ag %보다 먼저 표면 산화막 · 막 속 유기물 · 리플로우 최고 온도와 시간을 봅니다. Ag 때문에 고체가 많이 남는 것은 Ag가 크게 벗어났을 때(착화제 · 첨가제 고장 등)입니다 (<a data-go="defects.melt">12장</a>).',
      '<b>Ni 다음 층은 곧바로.</b> Ni 표면은 공기 · 물에서 금방 산화(부동태)되어 그 위에 올릴 층(베이스 다이는 상부 Cu, 코어 다이는 SnAg)의 밀착이 약해질 수 있습니다(들뜸). 보통 한 장비 안에서 헹굼만 거쳐 마르지 않게 넘기고, 필요하면 산 담금(활성화)을 합니다. 헹굼 · 대기 시간을 관리합니다 (<a data-go="tool.seq">09장</a>).',
      '<b>상부 Cu는 얇아서(예시 3 µm) 두께 산포가 곧 계면 차이입니다.</b> 얇은 곳은 리플로우 · 본딩을 몇 번 거치기 전에 Ni가 일찍 드러나 계면 IMC가 달라지고, 두꺼운 곳은 열 이력 뒤에도 Cu가 남아 Cu₃Sn · 보이드 쪽으로 가기 쉽습니다. 짧은 도금이라 입수 · 처음 몇 초의 조건이 두께 · 밀착에 차지하는 몫이 커서, 상부 Cu/Ni 계면 들뜸과 함께 따로 봅니다.',
      '따뜻한 Ni 액이나 산성 SnAg 액이 PR을 붓게 하거나 들뜨게 하면 PR 밑으로 도금이 번지고, PR 성분이 녹아 나와 액을 오염시키기도 합니다. PR을 바꾸면 도금액과의 궁합도 확인합니다.'
    ]) + K.deep(`<ul>
      <li><b>왜 Ag가 공급에 민감한가</b> — Ag는 Sn보다 훨씬 쉽게 석출되는 금속인데, 액 속 농도는 Sn의 약 1/50~1/100입니다. 그래서 Sn이 쌓일 만큼 세게 밀면 Ag는 "오는 만큼" 다 쌓이고(확산 한계 근처), Sn은 전류가 시키는 만큼 쌓입니다. 예: Ag 0.5 g/L, 착이온 확산계수 약 4×10⁻¹⁰ m²/s, 확산층 30 µm이면 Ag 한계전류는 약 0.06 ASD로, 6 ASD에서 전류의 약 1 %가 Ag에 쓰입니다. Ag⁺는 전자 1개, Sn²⁺는 2개라 전류 1 %가 Ag 약 1.8 wt%가 됩니다. 상용 액은 착화제로 Ag 석출을 Sn 쪽으로 끌어내려 이 민감도를 줄이도록 설계되어, 실제 기울기는 액마다 다릅니다. 펄스 도금에서 쉬는 시간을 늘리면 보통 Ag %가 오르고, 범프 높이 방향으로도 Ag가 조금 달라질 수 있습니다(리플로우로 대부분 섞임).</li>
      <li><b>Sn–Ag 상태도와 지렛대 규칙</b> — 액상선 근삿값: Ag 1 % 229 · 1.8 % 226 · 2.5 % 224 · 3 % 222 · 3.5 % 221(공정점) · 4 % 230 · 5 % 약 243 · 6 % 260 · 8 % 280 °C. 공정점 오른쪽에서 먼저 굳는 것은 Sn이 아니라 Ag₃Sn(Ag 73.2 wt%)입니다. 고체 몫 = (내 Ag % − 그 온도의 액체 Ag %) ÷ (73.2 − 액체 Ag %). 예: Ag 8 % 범프를 250 °C로 올리면 액체는 Ag 약 5.4 %를 품고, 고체 Ag₃Sn은 약 4 %만 남습니다. 그래서 Ag가 조금 높아도 "안 녹음"은 드뭅니다. 리플로우 최고 온도는 보통 액상선보다 약 20~40 °C 높게(SnAg 범프 약 240~260 °C), 액상선 위에 머무는 시간은 약 30~90초로 잡습니다. 온도 · 시간이 늘면 IMC가 더 자랍니다.</li>
      <li><b>큰 Ag₃Sn 판</b> — Ag가 많고 천천히 식으면 솔더 안에 판 모양 Ag₃Sn이 크게 자라 균열이 지나가는 길이 됩니다. 그래서 마이크로범프 SnAg는 보통 Ag를 공정점보다 적게(약 1.5~2.5 wt%) 잡고 상한을 관리합니다. 마이크로범프는 솔더가 적어, 리플로우 · 본딩을 여러 번 하면 Sn이 IMC로 소모되고 남은 솔더의 Ag가 진해져 처음엔 2.5 %였어도 판이 생길 수 있습니다.</li>
      <li><b>Ag를 넣는 이유 · 너무 적을 때</b> — Ag는 녹는 온도를 낮추고(221 °C), 미세한 Ag₃Sn 그물로 솔더를 단단하게 하며, 위스커를 줄입니다. Ag가 약 1 % 근처로 너무 낮으면 녹는 온도가 Sn(232 °C) 쪽으로 오르고 위스커가 보고된 예도 있습니다. 그래서 Ag %는 위아래 규격으로 관리합니다.</li>
      <li><b>IMC — 다이마다 처음 만나는 금속이 다르다</b> — 리플로우 · 본딩 때 솔더의 Sn은 처음 만나는 금속과 반응해 IMC를 만듭니다. 코어 다이는 Ni 위 Ni₃Sn₄(상대 쪽 Cu가 들어오면 (Cu,Ni)₆Sn₅)가 자라며 Ni를 조금씩 먹습니다. Ni₃Sn₄는 Cu₆Sn₅보다 잘 깨지는 편이라는 보고가 많아, 코어 다이는 Ni 두께와 열 이력(리플로우 · 적층 본딩 횟수)을 챙깁니다. 베이스 다이는 상부 Cu 위 Cu₆Sn₅(+ 얇은 Cu₃Sn)이고, 상부 Cu가 다 쓰이면 Ni 위 (Cu,Ni)₆Sn₅로 안정됩니다. 마이크로범프는 솔더가 적어 열을 여러 번 받으면 많은 부분이 IMC로 바뀔 수 있고, 적층에서 아래쪽 다이일수록 열을 더 받습니다. Ni 두께는 "모든 열 이력 뒤에도 남아 있어야 할 양"으로 정합니다 — 계산 감(코어 다이): 3Ni + 4Sn → Ni₃Sn₄ 에서 Sn 12 µm가 모두 Ni₃Sn₄가 되는 극단에서도 Ni 소모는 약 3.6 µm라(몰 부피 Ni 6.6, Sn 16.3 cm³/mol) 예시 Ni 5 µm면 남습니다. 베이스 다이(Ni 3 µm)는 상부 Cu가 Sn 약 5.7 µm를 먼저 쓰므로, 남은 Sn이 모두 Ni와 반응하는 극단에서도 Ni 소모는 약 1.9 µm이고, 실제로는 (Cu,Ni)₆Sn₅가 Ni를 덮어 이보다 훨씬 적습니다.</li>
      <li><b>상부 Cu는 왜 얇게 · 계산 감</b> — 6Cu + 5Sn → Cu₆Sn₅ 에서 몰 부피(Cu 7.1, Sn 16.3 cm³/mol)로 따지면 Cu 3 µm는 Sn 약 5.7 µm와 반응합니다. SnAg 12 µm(예시)면 다 쓰일 수 있는 양이고, 아래 Cu 기둥의 Cu는 Ni가 막아 더 들어오지 않습니다. 그래서 다 쓰인 뒤에는 Ni 위 (Cu,Ni)₆Sn₅로 안정되어, 두꺼운 Cu 위에서 Cu₃Sn이 계속 자랄 때 생기는 커켄달 보이드를 줄입니다 (공개 연구: 얇은 Cu를 솔더가 다 쓰도록 설계한 Cu/Ni/Cu/SnAg 마이크로범프가 고온 보관에서 계면 보이드가 거의 없었다는 보고). 같은 이유로 상부 Cu 두께는 위아래 규격으로 관리합니다. 다만 상부 Cu를 다 쓰면 그것만으로 Sn 약 48 %(예시 두께 기준)가 IMC가 되고, Ag는 IMC에 거의 들어가지 않아 남은 솔더의 Ag가 약 2배로 진해집니다(실효 Ag = Ag₀ ÷ (1 − 0.48): 예시 1.8 % → 약 3.5 %, 2.5 % → 약 4.8 %). 그 상태로 다시 녹으면(인터포저 본딩 · 그 뒤 리플로우) 공정점(共晶) 근처 · 위라 식을 때 큰 Ag₃Sn 판이 자라기 쉽습니다. 그래서 베이스 다이의 Ag 목표 · 상한은 이 몫까지 넣어 정합니다(<a href="#go-reflow-06">리플로우 06장</a>).</li>
      <li><b>Sn 위스커</b> — 주로 순수 Sn 무광 도금 마감(리드 등)의 문제입니다. 리플로우된 SnAg 마이크로범프는 합금이고, 녹았다 굳었으며, 언더필 · 몰드로 덮이므로 위험이 낮은 편입니다.</li>
      <li><b>양극 방식과 산 · 금속 수지</b> — Sn 양극은 녹는 양이 쌓이는 양보다 조금 많아 Sn이 늘기 쉽습니다. 불용성 양극은 금속을 Sn 농축액(Sn-MSA)으로 보충하므로 산(MSA)이 계속 쌓입니다. 그래서 일부를 버리고 새 액을 넣거나(bleed & feed) 산이 없는 보충제(예: 산화주석 분말)로 맞춥니다 (<a data-go="bath.metal">11장</a>).</li>
      <li><b>Ni 응력과 양극</b> — 설파민산 Ni 양극이 잘 녹지 않으면(염화물 부족 등) 양극에서 설파민산이 분해되어 황 성분 부산물이 생기고 막의 응력이 바뀔 수 있습니다. 막이 두꺼울수록 응력의 영향이 커서, Ni가 몸통인 코어 다이(예시 5 µm)에서 더 중요합니다. Ni 크랙 · 들뜸(12장)이 보이면 응력 측정값과 함께 양극 상태 · 염화물 농도를 봅니다. 음극 효율(약 95~99 %, 설파민산 · 조건에 따라)이 양극(약 100 %)보다 조금 낮아 Ni 농도와 pH가 서서히 오르므로, 분석해서 맞춥니다.</li>
      <li><b>고속 Cu 액</b> — 범프용 고속 Cu 액은 보통 구리 농도를 높여 한계전류를 키웁니다. 03장의 iL = nFDC/δ에서 C를 키우는 것과 같습니다.</li></ul>`);
  },
  css: `.pl-svg .p10-film{fill:#1b1b1f;stroke:#4b5563;stroke-width:1}
.pl-svg .p10-cup{fill:#fdba74;stroke:#9a3412;stroke-width:1.2}
.pl-svg .p10-ct{font-size:18px;font-weight:900;fill:#1b1203 !important;stroke:none !important}
.pl-svg .p10-dust{fill:#c2410c;opacity:.85}
.pl-svg .p10-crack{fill:none;stroke:#94a3b8;stroke-width:1.6}
.pl-svg .p10-bad{fill:rgba(239,68,68,.14)}
.pl-svg .p10-warn{fill:rgba(245,158,11,.14)}
.pl-svg .p10-ok{fill:rgba(34,197,94,.18);stroke:#4ade80;stroke-width:2}
.pl-svg .p10-cx{font-size:21px;font-weight:800;fill:#c4b5fd !important}
.pl-svg .p10-bt{font-size:22px;font-weight:800;fill:#f8fafc !important}
.pl-svg .p10-tgt{fill:rgba(34,197,94,.10)}
.pl-svg .p10-tg{font-size:18px;font-weight:800;fill:#86efac !important}
.pl-svg .p10-eu{font-size:20px;font-weight:800;fill:#fbbf24 !important;paint-order:stroke;stroke:#0b1220;stroke-width:5px;stroke-linejoin:round}
.pl-svg .p10-agk{stroke:#fbbf24;stroke-width:1.6;stroke-dasharray:3 4;opacity:.75}
.pl-svg .p10-agl{font-size:23px;font-weight:800;fill:#fbbf24 !important;paint-order:stroke;stroke:#0b1220;stroke-width:6px;stroke-linejoin:round}
.pl-svg .p10-tie{stroke:#fde68a;stroke-width:3}
.pl-svg .p10-snc{fill:#e2e8f0;stroke:#64748b;stroke-width:1}
.pl-svg .p10-vok{font-size:30px;font-weight:900;fill:#4ade80 !important}
.pl-svg .p10-vng{font-size:30px;font-weight:900;fill:#fbbf24 !important}
.pl-svg .p10-wn{font-size:21px;font-weight:800;fill:#fca5a5 !important}
.pl-svg .p10-okt{font-size:21px;font-weight:800;fill:#86efac !important}
.pl-svg .p10-again{font-size:21px;font-weight:800;fill:#f3b07a !important}`
});
})();
