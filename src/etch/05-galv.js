/* 시드 식각 05 — 갈바닉: 다른 금속이 닿으면 왜 한쪽이 빨리 녹을까? (범프 밑동 · µm)
 *  왼쪽: 단계마다 다른 그림 (비커 전지 → 전위 사다리 → 범프 한 칸의 면적비 → 우리 범프의 네 곳 → 두 다이의 짝)
 *  범프 그림은 베이스 다이(Cu 기둥 12 · Ni 3 · 상부 Cu 3 · SnAg 12 µm), die 단계에서 코어 다이(Ni 5 · SnAg 12 µm)와 나란히 (plans/stack.md)
 *  오른쪽: 에반스 그림 (위젯이 그린다) · 아래: 단계 설명 패널 + 위젯 결과 상자
 *  개념 모델(혼합 전위): F = (1 + kR)^½ (반응 지배 · 타펠 기울기 같음) 또는 1 + kR (공급 지배), 좁은 틈 상한 10 (예시) */
(function(){
const B = 0.12, EK = 0.08;                       // 타펠 기울기 b (V/자릿수, 그림용 예시) · 공급 지배 그림의 꺾임 높이 (V)
const FMAX = 10, R_FIELD = 1.1;                  // 좁은 틈 상한(예시) · Ti가 이어져 있을 때 한 칸의 면적비
// 예시 Ti 언더컷 (µm, 06장 식 u = h + G·r·(t − t₀)): Ti 두께 0.1 (끊기기 전 — 가속 없음) + 끊긴 뒤 과식각 동안 혼자 옆으로 녹는 거리 0.039 (06장 묽은 HF 기본 600 nm/분 × 3.9 s) × 실제 배수
const UH = 0.1, US = 0.039, U1 = UH + US;
const rOf = v => Math.pow(10, v / 100);          // 슬라이더 0~300 → R 1~1000 (기본 256 → ≈ 363)
const kOf = v => Math.pow(10, v / 100 - 3);      // 슬라이더 0~400 → k 0.001~10 (기본 160 → ≈ 0.040)
function calc(st){
  const R = st.ph === 'field' ? R_FIELD : rOf(st.rv), k = kOf(st.kv), x = 1 + k * R, L = Math.log10(x), tafel = st.mode === 'tafel';
  const F = tafel ? Math.sqrt(x) : x, Fe = Math.min(F, FMAX);
  return {R, k, x, L, F, Fe, dE: (tafel ? B / 2 : B) * L, u: st.ph === 'field' ? null : UH + US * Fe, capped: F > FMAX + 1e-9, tafel, field: st.ph === 'field', die: st.ph === 'field' ? '' : DIE_RV[st.rv] || ''};
}
const fF = f => f < 2 ? f.toFixed(2) : f < 10 ? f.toFixed(1) : f < 1000 ? f.toFixed(0) : Math.round(f).toLocaleString('en-US');
const fR = r => r < 10 ? r.toFixed(1) : Math.round(r).toLocaleString('en-US');
const fk = k => k >= 10 ? k.toFixed(0) : k >= 1 ? k.toFixed(1) : k.toPrecision(2);
// 발표 모드 · 손대기 전: 단계마다 보여 줄 값 (rv: R 슬라이더, kv: k 슬라이더)
const DEMO = {
  cell: {ph: 'iso', rv: 0, kv: 300, mode: 'tafel'},     // R 1 · k 1 → ×1.41
  who: {ph: 'iso', rv: 0, kv: 200, mode: 'tafel'},      // R 1 · k 0.1 → ×1.05
  area: {ph: 'iso', rv: 256, kv: 160, mode: 'tafel'},   // 끊긴 뒤 R ≈ 360 · k 0.04 → ×3.9 (= 06장 G 4)
  bump: {ph: 'iso', rv: 256, kv: 160, mode: 'tafel'},
  die: {ph: 'iso', rv: 237, kv: 160, mode: 'tafel'}      // 코어 다이 끊긴 뒤 R ≈ 234 · k 0.04 → ×3.2
};
// 끊긴 뒤 면적비 예시 (슬라이더 값): 베이스 다이 256 (R ≈ 363, 범프 겉 ≈ 2,850 µm²) · 코어 다이 237 (R ≈ 234, ≈ 1,830 µm²)
const DIE_RV = {256: '베이스 다이', 237: '코어 다이'};
// 범프 한 칸 (옆 단면, 1 µm = 8 px): 지름 25 µm · 피치 55 µm · 베이스 다이 Cu 기둥 12 + Ni 3 + 상부 Cu 3 + SnAg 12 µm = 30 µm (예시, stack.md)
// 층 윗면 y: Cu 기둥 Y_CU · Ni Y_NI · 상부 Cu Y_UC · SnAg Y_SN (시드 · Ti만 과장)
const BX0 = 300, BX1 = 500, YT = 600, TI_H = 14, Y_SEED = 592, Y_CU = 496, Y_NI = 472, Y_UC = 448, Y_SN = 352;
// 에반스 그림: 가로 log₁₀ i (−2 ~ +4, A 혼자의 부식 전류 = 1), 세로 전위 (A 혼자의 부식 전위 = 0, −0.3 ~ +0.5 V)
const GX0 = 900, GX1 = 1520, GY0 = 560, GY1 = 226, LMIN = -2, LMAX = 4, EMIN = -0.3, EMAX = 0.5;
const ex = l => GX0 + (l - LMIN) / (LMAX - LMIN) * (GX1 - GX0), ey = e => GY0 - (e - EMIN) / (EMAX - EMIN) * (GY0 - GY1);
const r1 = v => Math.round(v * 10) / 10;
// 받는 선: Lc = log₁₀(받는 전류 배수). 반응 지배는 기울기 −b 직선, 공급 지배는 위쪽 타펠 + 아래쪽 세로(한계)
function cathD(Lc, lim){
  if (!lim) return `M${r1(ex(-3))},${r1(ey(B * (3 + Lc)))} L${r1(ex(Lc + 3))},${r1(ey(-B * 3))}`;
  const Ek = B * Lc + EK, d = 0.25;
  return `M${r1(ex(-4))},${r1(ey(Ek + B * (Lc + 4)))} L${r1(ex(Lc - d))},${r1(ey(Ek + B * d))} Q${r1(ex(Lc))},${r1(ey(Ek))} ${r1(ex(Lc))},${r1(ey(Ek - 0.03))} L${r1(ex(Lc))},${r1(ey(EMIN - 0.1))}`;
}
// 글 폭 어림 (px): 한글 1em, 영문 · 숫자 약 0.55em
const tw = (s, px) => [...String(s)].reduce((a, ch) => a + (/[ㄱ-힝]/.test(ch) ? 1 : /[A-Za-z0-9 .,:;'()\-+]/.test(ch) ? 0.56 : 0.8), 0) * px;
// 움직이는 분자 · 이온 (글자가 든 동그라미 — 엔진 이온 종류에 없는 것)
const mol = (path, label, cls, r, dur, delay) => `<g class="et05-mol ${cls}"><circle r="${r}"/><text y="4.5" text-anchor="middle">${label}</text><animateMotion dur="${dur}s" begin="-${delay}s" repeatCount="indefinite" path="${path}"/><animate attributeName="opacity" values="0;1;1;1;0" dur="${dur}s" begin="-${delay}s" repeatCount="indefinite"/></g>`;
// 아래 패널 사례 카드 (bump 단계)
const CARDS = [
  {h: '① HF 속 Ti–범프', d: '맨몸 Ti(녹는 쪽)가 넓은 범프 겉면(받는 쪽)에 이어져 있다 → 범프 사이 Ti가 끊긴 뒤 밑동 Ti가 빨리 파인다 · 공개 특허: 묽은 HF로 Ti 언더컷 1 µm 이상 · 줄이기: 과식각↓, 다른 Ti 식각액'},
  {h: '② 과산화수소 Ti 식각 + Cu', d: '엄밀히는 전지보다 촉매: Cu가 과산화수소 분해를 도와 Cu 가까운 Ti(W)가 더 빨리 녹는다 (공개 보고) · 액도 빨리 지친다 · 범프에 Cu가 없는 코어 다이는 덜할 수 있다 · 줄이기: 킬레이트 · 안정제, 새 액'},
  {h: '③ 도금 Cu vs 스퍼터 Cu', d: '같은 Cu라도 결정 크기 · 불순물 · 풀림이 다르면 녹는 빠르기 · 전위가 다르다 · 공개 보고: 풀림 전 도금 Cu가 약 2.5배 빨랐다 → 기둥 얇아짐 · 계면 홈'},
  {h: '④ 솔더 · 치환 석출', d: 'Sn은 Cu보다 덜 귀하고(베이스 다이는 SnAg가 상부 Cu에 닿음), 솔더 속 Ag₃Sn은 Sn보다 귀하다 → 솔더 겉 얼룩 · 액 속 Cu²⁺가 Sn · 맨몸 Ti 위에 Cu로 붙는다(치환 석출) → 단계 사이 헹굼'}
];
const CW = 360, CX = i => 58 + i * 378, CY = 774, CH = 324;
const VN = {x: 32, y: 122, w: 736, h: 606};       // 좁은 세로 화면: 왼쪽 패널(단계마다 바뀌는 그림)만 크게
// 작은 베이스 다이 범프 (아래부터 Cu 기둥 · Ni · 상부 Cu · SnAg — Ni · 상부 Cu는 같은 두께 8로 과장)
function miniBump(K, x0, x1, yt, yb){
  const {R, P} = K, h = (yb - yt - 16) / 2, yn = yb - h, yu = yn - 8, ys = yu - 8;
  return R(x0, yn, x1 - x0, h, 'f-cu2') + R(x0, yu, x1 - x0, 8, 'f-ni') + R(x0, ys, x1 - x0, 8, 'f-cu2') +
    P(`M${x0},${ys} L${x0},${yt + 8} Q${x0},${yt} ${x0 + 8},${yt} L${x1 - 8},${yt} Q${x1},${yt} ${x1},${yt + 8} L${x1},${ys} Z`, 'f-sn2');
}
// 사례 카드의 작은 그림 (x, y: 왼쪽 위, 344 × 92)
function cardPic(K, i, x, y){
  const {R, C, P, T, LB} = K;
  let g = R(x, y, 344, 74, 'f-etl') + R(x, y + 82, 344, 10, 'f-pas');
  const px0 = x + 122, px1 = x + 222;
  if (i === 0){
    g += miniBump(K, px0, px1, y + 8, y + 72) + R(px0 + 2, y + 72, 96, 4, 'f-seed2') + R(px0 + 12, y + 76, 76, 6, 'f-ti');
    g += R(px0 + 8, y + 76, 5, 6, 'pl-on') + R(px1 - 13, y + 76, 5, 6, 'pl-on');
    [[x + 96, y + 60, 4], [x + 248, y + 52, 5], [x + 262, y + 30, 3.5], [x + 84, y + 34, 3]].forEach(([cx, cy, r]) => { g += C(cx, cy, r, 'pl-bub'); });
    g += LB(T(x + 14, y + 30, 'HF', 't-dim', 'start') + T(x + 330, y + 30, 'H₂', 't-dim', 'end'));
  } else if (i === 1){
    g += miniBump(K, px0, px1, y + 8, y + 72) + R(px0 + 2, y + 72, 96, 4, 'f-seed2');
    g += P(`M${x},${y + 74} L${px0 - 50},${y + 74} Q${px0 - 18},${y + 74} ${px0 - 6},${y + 82} L${px0},${y + 82} L${px0},${y + 76} L${px1},${y + 76} L${px1},${y + 82} L${px1 + 6},${y + 82} Q${px1 + 18},${y + 74} ${px1 + 50},${y + 74} L${x + 344},${y + 74} L${x + 344},${y + 82} L${x},${y + 82} Z`, 'f-ti');
    [[px0 - 22, y + 58, 4], [px1 + 22, y + 52, 4.5], [px1 + 34, y + 30, 3], [px0 - 34, y + 30, 3]].forEach(([cx, cy, r]) => { g += C(cx, cy, r, 'pl-bub'); });
    g += LB(T(x + 14, y + 30, 'H₂O₂', 't-dim', 'start') + T(x + 330, y + 30, 'O₂', 't-dim', 'end'));
  } else if (i === 2){
    const rg = K.rng(7), big = [], fine = [];
    for (let k = 0; k < 7; k++) big.push([px0 + 8 + rg() * 84, y + 6 + rg() * 56]);
    for (let k = 0; k < 14; k++) fine.push([px0 + 4 + rg() * 92, y + 64 + rg() * 8]);
    g += K.voronoi(big, px0, y + 6, px1, y + 64).map(pl => K.PG(pl, 'f-cu2 f-grain')).join('');
    g += K.voronoi(fine, px0 + 3, y + 64, px1 - 3, y + 74).map(pl => K.PG(pl, 'f-seed2 f-grain')).join('');
    g += R(px0 + 3, y + 74, 94, 8, 'f-ti') + P(`M${px1 + 1},${y + 58} L${px1 - 9},${y + 66} L${px1 + 1},${y + 70} Z`, 'f-hole2') + P(`M${px0 - 1},${y + 58} L${px0 + 9},${y + 66} L${px0 - 1},${y + 70} Z`, 'f-hole2');
    g += LB(K.lead(px0 + 30, y + 30, x + 92, y + 30, '', 'end') + T(x + 14, y + 36, '도금 Cu', 't-dim', 'start') + K.lead(px1 - 6, y + 69, x + 236, y + 50, '', 'start') + T(x + 330, y + 56, '스퍼터 Cu', 't-dim', 'end'));
  } else {
    g += miniBump(K, px0, px1, y + 4, y + 74);
    [[px0 + 20, y + 12], [px0 + 46, y + 20], [px0 + 70, y + 10], [px0 + 86, y + 24], [px0 + 32, y + 26]].forEach(([cx, cy]) => { g += C(cx, cy, 3.4, 'et05-stain'); });
    g += R(px0 - 70, y + 76, 240, 6, 'f-ti');
    [[px0 - 54, y + 74], [px0 - 30, y + 74], [px1 + 26, y + 74], [px1 + 52, y + 74]].forEach(([cx, cy]) => { g += C(cx, cy, 3.6, 'f-cu2'); });
    g += LB(T(x + 14, y + 30, '얼룩', 't-dim', 'start') + T(x + 330, y + 30, 'Ti 위 Cu 점', 't-dim', 'end'));
  }
  return g;
}

(window.EngrEtchChapters = window.EngrEtchChapters || []).push({
  no: '05', id: 'galv', part: 2, short: '갈바닉', scale: '범프 밑동 · µm',
  title: '갈바닉 — 다른 금속이 닿으면 왜 한쪽이 빨리 녹을까?',
  hook: '녹는 쪽이 좁을수록 빨리 녹는다',
  one: '서로 다른 두 금속이 전기로 이어진 채 같은 액에 잠기면 작은 전지가 됩니다. 전자를 더 잘 내놓는 쪽(녹는 쪽, 애노드)은 혼자 있을 때보다 빨리 녹고, 다른 쪽(받는 쪽, 캐소드)은 오히려 보호받습니다. 녹는 쪽이 좁고 받는 쪽이 넓을수록 녹는 쪽이 더 빨리 녹습니다.',
  ana: '<b>넓은 지붕과 좁은 홈통</b> — 넓은 지붕(받는 쪽)에 내린 빗물(산화제가 전자를 받는 반응)이 좁은 홈통(녹는 쪽) 하나로 몰리면 홈통이 넘칩니다. 지붕이 넓을수록 홈통이 바쁩니다. <i>(비유의 한계: 빗물과 달리 \'얼마나 모으는지\'는 받는 쪽 금속 위에서 반응이 얼마나 잘 일어나는지, 약품 공급, 액의 전기 저항에 따라 다르고, 녹는 쪽이 산화막을 만들면 거의 안 녹을 수도 있습니다. 또 좁은 틈 깊숙한 곳까지는 효과가 잘 닿지 않습니다.)</i>',
  steps: [
    {id: 'cell', t: '두 금속 + 액 = 전지', d: '시드 식각 중에는 범프 · 시드 · Ti가 모두 금속으로 이어져 있습니다. 녹는 쪽(애노드)에서 금속이 내놓은 전자는 금속 안을 지나 받는 쪽(캐소드)으로 가고, 거기서 산화제가 전자를 받습니다. 액 속에서는 이온이 전류를 나릅니다.', viewN: VN},
    {id: 'who', t: '누가 녹나', d: '그 액 속에서 실제 전위(부식 전위)가 더 낮은 쪽이 녹는 쪽(애노드)이 됩니다. 표준 전위 표만 보면 틀릴 수 있습니다. Ti는 표에서 아주 낮지만, 산화막에 덮이면 귀한 금속처럼 거의 안 녹고, 산화막을 녹이는 HF 속에서는 표대로 녹는 쪽이 됩니다(→ 06장).', viewN: VN},
    {id: 'area', t: '면적비', d: '녹는 쪽은 받는 쪽 전체가 쓰는 전자를 혼자 내놓으므로, 면적비(받는 쪽 넓이 ÷ 녹는 쪽 넓이)가 클수록 빨리 녹습니다. 범프 사이 Ti가 이어져 있으면 면적비가 1 안팎이지만, 다 지워져 끊기면 범프 밑 Ti의 둥근 가장자리(고리)만 액에 닿아 수백으로 뜁니다. 그래서 과식각 동안 빨라집니다.', viewN: VN},
    {id: 'bump', t: '우리 범프에서', d: 'HF 속 Ti–범프, 과산화수소 Ti 식각에서 Cu의 촉매 효과, 도금 Cu와 스퍼터 Cu, 솔더와 치환 석출이 대표 사례입니다(①~④). 줄이는 법은 과식각 줄이기, 억제제 · pH, 산화제 관리, 단계 사이 헹굼, 새 액입니다.', viewN: VN},
    {id: 'die', t: '두 다이에서 — 베이스 · 코어', d: '베이스 다이(Cu/Ni/Cu/SnAg)는 Ni와 SnAg 사이 얇은 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu) 띠가 옆으로 파일 수 있고, 코어 다이(Ni/SnAg)는 Ni 발이 Cu 시드에 바로 닿습니다. 코어 범프는 낮아 HF 속 면적비도 작습니다(≈ 230 vs 360).', viewN: VN}
  ],
  icon(K){
    const {R, P, C} = K;
    return R(2, 20, 62, 40, 'f-etl') + R(8, 10, 14, 46, 'f-ti') + R(44, 10, 14, 46, 'f-cu2') + P('M15,10 L15,4 L51,4 L51,10', 's-wire') + C(33, 4, 3.5, 'k-e') + P('M22,34 L16,40 L22,48 Z', 'f-hole2');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, wrap, arrow, arrowP} = K;
    let s = '';
    // ── 왼쪽 패널
    s += R(40, 130, 720, 590, 'pl-panel', {rx: 14});
    // cell: 비커 전지
    let cl = P('M150,290 L150,660 Q150,680 170,680 L630,680 Q650,680 650,660 L650,290', 'f-tank') + R(153, 330, 494, 347, 'f-etl', tip('식각액 (예: 묽은 HF — Ti 식각 단계) — 이온이 전류를 나르는 길'));
    cl += LB(T(400, 318, '식각액 예: 묽은 HF', 't-dim'));
    cl += P('M265,250 L265,190 L535,190 L535,250', 's-wire', tip('금속 길 — 실제로는 범프 · 시드 · Ti가 서로 맞닿아 이어져 있다'));
    cl += LB(T(400, 172, '전자는 금속(전선) 안으로만 간다', 't-sub'));
    cl += `<g data-v="cellv"></g>`;
    cl += LB(T(95, 302, '금속 A', 't-lbl') + T(95, 334, '녹는 쪽', 't-warn') + T(95, 362, '(애노드)', 't-warn') + T(95, 394, '예: Ti', 't-dim'));
    cl += LB(T(705, 302, '금속 B', 't-lbl') + T(705, 334, '받는 쪽', 't-acc') + T(705, 362, '(캐소드)', 't-acc') + T(705, 394, '예: Cu', 't-dim'));
    cl += arrow(330, 652, 470, 652, 's-arr') + LB(TT(400, 598, ['액 속에서는', '이온이 전류를 나른다'], 't-dim', 'middle', 24));
    cl += LB(T(250, 708, '녹음: M → Mⁿ⁺ + n e⁻', 't-dim') + T(562, 708, '받음: 2H⁺ + 2e⁻ → H₂ (산화제 = H⁺)', 't-dim'));
    s += G(cl, only('cell'));
    // who: 표준 전위 사다리 vs 그 액 속 실제 순서
    const ys = E => 248 + (0.8 - E) * 172;
    let wh = T(60, 172, '표준 전위 표 vs 그 액 속 실제 순서', 'pl-hdg', 'start');
    wh += T(60, 210, '표준 전위 (V, 25 °C)', 't-acc', 'start') + T(430, 210, '그 액 속 (개념 · 액마다 다름)', 't-acc', 'start');
    wh += L(110, 234, 110, 684, 's-axis') + L(440, 234, 440, 684, 's-axis');
    const LAD = [[0.80, 'Ag⁺/Ag  +0.80', 0, 'k-acc'], [0.34, 'Cu²⁺/Cu  +0.34', 0, 'k-acc'], [-0.14, 'Sn²⁺/Sn  −0.14', -8, 'k-acc'], [-0.26, 'Ni²⁺/Ni  −0.26', 8, 'k-acc'], [-1.19, 'TiF₆²⁻/Ti  −1.19', 0, 'k-acc2'], [-1.63, 'Ti²⁺/Ti  −1.63 (참고)', 0, 'k-acc2']];
    LAD.forEach(([E, nm, dy, k]) => { const y = ys(E); wh += L(102, y, 118, y, 's-axis') + C(110, y, 6, k) + (dy ? L(118, y, 128, y + dy, 's-lead') : '') + T(132, y + dy + 7, nm, 't-sub', 'start'); });
    wh += LB(T(132, ys(-1.19) + 33, '(불소 액의 짝)', 't-dim', 'start'));
    const RL = [[262, 'Ti + 산화막 (부동태)', 'et05-pv', '→ 귀한 쪽처럼 · 거의 안 녹음', '과산화수소 Cu 식각액 · 공기 속 Ti — TiO₂ 막이 덮어 거의 안 녹는다'], [352, 'Cu (기둥 · 상부 Cu · 시드)', 't-sub', '', 'Cu — 베이스 다이의 Cu 기둥 · 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu)와 두 다이의 Cu 시드'], [418, 'SnAg 솔더 (Sn)', 't-sub', '', 'SnAg 솔더 — Sn은 Cu보다 덜 귀하다'], [484, 'Ni — 산화막에 따라 달라짐', 't-dim', '', 'Ni는 산화막 상태에 따라 녹는 쪽도 받는 쪽도 될 수 있다 (조성 · 액에 따라)\n베이스 다이: Cu 기둥과 솔더 사이 방벽 · 코어 다이: 몸통 겸 방벽'], [646, 'Ti 맨몸 (HF 속)', 't-warn', '→ 표의 낮은 자리 그대로 · 녹는 쪽', '묽은 HF가 산화막을 녹여 맨몸 Ti가 드러난다 → 녹는 쪽(애노드)']];
    RL.forEach(([y, nm, c, sub, tp]) => { wh += G(L(432, y - 6, 448, y - 6, 's-axis') + C(440, y - 6, 6, c === 't-warn' ? 'k-acc2' : c === 'et05-pv' ? 'et05-pvd' : 'k-acc') + T(458, y, nm, c, 'start') + (sub ? T(458, y + 26, sub, 't-dim', 'start') : ''), tip(tp)); });
    wh += arrowP('M322,660 C395,640 385,285 430,258', 's-arr3') + arrowP('M322,672 C372,690 398,646 430,641', 's-arr2');
    wh += LB(T(60, 706, '↑ 위로 갈수록 귀함 (받는 쪽) · ↓ 아래로 갈수록 녹기 쉬움 (녹는 쪽)', 't-dim', 'start'));
    s += G(wh, only('who'));
    // area · bump: 범프 한 칸 (옆 단면)
    let bp = R(60, 252, 680, YT - 252, 'f-etl', tip('식각액 (예: 묽은 HF — Ti 식각 단계)'));
    bp += P(`M${BX0},${Y_UC} L${BX0},${Y_SN + 12} Q${BX0},${Y_SN} ${BX0 + 12},${Y_SN} L${BX1 - 12},${Y_SN} Q${BX1},${Y_SN} ${BX1},${Y_SN + 12} L${BX1},${Y_UC} Z`, 'f-sn2', tip('SnAg 12 µm — 녹아서 붙는 솔더 (리플로우 전 원기둥, 예시)'));
    bp += R(BX0, Y_UC, BX1 - BX0, Y_NI - Y_UC, 'f-cu2', tip('상부 Cu 3 µm — Ni 위에 얇게 한 번 더 올린 Cu (예시)\n솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로'));
    bp += R(BX0, Y_NI, BX1 - BX0, Y_CU - Y_NI, 'f-ni', tip('Ni 3 µm — Cu 기둥과 솔더 사이 방벽 (예시)')) + R(BX0, Y_CU, BX1 - BX0, Y_SEED - Y_CU, 'f-cu2', tip('Cu 기둥 12 µm · 지름 25 µm — 높이 · 전기 (베이스 다이 예시)'));
    bp += R(BX0 + 2, Y_SEED, BX1 - BX0 - 4, YT - Y_SEED, 'f-seed2', tip('Cu 시드 — 기둥 밑에 남은 부분 (실제 0.3 µm — 그림은 과장)'));
    bp += R(60, YT + TI_H, 680, 28, 'f-pas', tip('보호막 (예시)'));
    bp += `<g data-v="bumpv"></g>`;
    bp += P(`M${BX0 - 4},${YT - 3} L${BX0 - 4},${Y_SN + 12} Q${BX0 - 4},${Y_SN - 4} ${BX0 + 12},${Y_SN - 4} L${BX1 - 12},${Y_SN - 4} Q${BX1 + 4},${Y_SN - 4} ${BX1 + 4},${Y_SN + 12} L${BX1 + 4},${YT - 3}`, 'et05-cath', tip('받는 쪽(캐소드) — 범프 겉면 전체: Cu 기둥 옆 + Ni + 상부 Cu + SnAg\n한 칸 ≈ 2,850 µm² (베이스 다이: 지름 25 · 높이 30 µm 예시)\n코어 다이(Ni / SnAg, 17 µm)는 ≈ 1,830 µm² → die 단계'));
    bp += G(LB(T(60, 172, '베이스 다이 범프 한 칸 — 옆 단면 (두께 과장)', 'pl-hdg', 'start') + T(60, 214, '받는 쪽 (캐소드): 범프 겉면 전체', 't-acc', 'start') + T(60, 242, 'Cu 기둥 · Ni · 상부 Cu · SnAg 겉 ≈ 2,850 µm² (한 칸)', 't-dim', 'start') + T(70, 290, '식각액 (예: 묽은 HF)', 't-dim', 'start')), only('area'));
    bp += G(LB(T(60, 172, '우리 범프에서 갈바닉이 보이는 네 곳 (①~④) · 그림은 베이스 다이', 'pl-hdg', 'start')), only('bump'));
    // bump: 줄이는 법 (오른쪽 위)
    bp += G(LB(T(560, 206, '줄이는 법', 'pl-hdg3', 'start') + TT(560, 238, ['· 과식각 줄이기', '· 억제제 · pH 창', '· 산화제 · 산소 관리', '· 단계 사이 헹굼', '· 새 액 · 액 나이 관리'], 't-dim', 'start', 26)), only('bump'));
    bp += G(LB(T(60, 706, '원인은 여럿 — 단면에서 어느 층이 얼마나 파였는지 따로 잰다', 't-dim', 'start')), only('bump'));
    s += G(bp, only('area bump'));
    // die: 두 다이 범프 나란히 (1 µm = 6 px — 시드 · Ti만 과장). 베이스 Cu 기둥 12 · Ni 3 · 상부 Cu 3 · SnAg 12, 코어 Ni 5 · SnAg 12 µm
    const DG = 584, cap = (x0, x1, y0, y1) => `M${x0},${y1} L${x0},${y0 + 10} Q${x0},${y0} ${x0 + 10},${y0} L${x1 - 10},${y0} Q${x1},${y0} ${x1},${y0 + 10} L${x1},${y1} Z`;
    const glow = (x0, x1, y0) => `M${x0 - 4},${DG - 2} L${x0 - 4},${y0 + 10} Q${x0 - 4},${y0 - 4} ${x0 + 10},${y0 - 4} L${x1 - 10},${y0 - 4} Q${x1 + 4},${y0 - 4} ${x1 + 4},${y0 + 10} L${x1 + 4},${DG - 2}`;
    let dd = R(60, 296, 680, DG + 8 - 296, 'f-etl', tip('식각액 — Cu 식각액(과산화수소 + 산) 또는 묽은 HF(Ti 식각)'));
    dd += R(60, DG + 8, 680, 8, 'f-ti', tip('Ti (실제 0.1 µm — 그림은 과장) — 범프 사이에 아직 이어져 있다')) + R(60, DG + 16, 680, 30, 'f-pas', tip('보호막 (예시)'));
    dd += R(202, DG, 146, 8, 'f-seed2', tip('Cu 시드 — Cu 기둥 밑 (같은 Cu · 실제 0.3 µm — 그림은 과장)')) + R(200, DG - 72, 150, 72, 'f-cu2', tip('Cu 기둥 12 µm — 높이 · 전기'));
    dd += R(200, DG - 90, 150, 18, 'f-ni', tip('Ni 3 µm — Cu 기둥과 솔더 사이 방벽')) + R(200, DG - 108, 150, 18, 'f-cu2', tip('상부 Cu 3 µm — Ni 위에 얇게 한 번 더 올린 Cu\n솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로'));
    dd += P(cap(200, 350, DG - 180, DG - 108), 'f-sn2', tip('SnAg 12 µm — 녹아서 붙는 솔더'));
    dd += G(P(`M199,${DG - 106} L209,${DG - 99} L199,${DG - 92} Z`, 'et05-groove') + P(`M351,${DG - 106} L341,${DG - 99} L351,${DG - 92} Z`, 'et05-groove'), tip('A 상부 Cu 띠의 옆 홈(노치) — Ni와 SnAg 사이 (그림은 과장)'));
    dd += R(490, DG, 130, 8, 'f-seed2', tip('C Cu 시드 — Ni 발 밑에 남은 부분. 가장자리가 Ni 발 밑으로 파였다 (그림은 과장)'));
    dd += R(480, DG - 30, 150, 30, 'f-ni', tip('Ni 5 µm — 몸통 겸 방벽 (Cu 기둥 없음)')) + P(cap(480, 630, DG - 102, DG - 30), 'f-sn2', tip('SnAg 12 µm — 녹아서 붙는 솔더'));
    dd += P(glow(200, 350, DG - 180), 'et05-cath', tip('받는 쪽(HF 속) — 베이스 다이 범프 겉 ≈ 2,850 µm²'));
    dd += P(glow(480, 630, DG - 102), 'et05-cath', tip('받는 쪽(HF 속) — 코어 다이 범프 겉 ≈ 1,830 µm² (낮아서 좁다)'));
    dd += G(L(80, 323, 120, 323, 'et05-cath') + LB(T(134, 330, '= HF 속 받는 쪽(캐소드) — 범프 겉 전체', 't-dim', 'start')), tip('파란 테두리 — HF로 Ti를 지울 때 전자를 받는 범프 겉면 (Ti가 끊긴 뒤 면적비의 분자)'));
    let dl = T(60, 172, '두 다이 — 액에 닿는 금속 짝이 다르다', 'pl-hdg', 'start') + T(60, 204, 'Cu 식각 뒤 · Ti 식각 전 — 1 µm = 6 px (시드 · Ti만 과장, 예시)', 't-dim', 'start');
    dl += T(275, 248, '베이스 다이', 't-lbl') + T(275, 278, 'Cu / Ni / Cu / SnAg · 30 µm', 't-dim') + T(555, 248, '코어 다이', 't-lbl') + T(555, 278, 'Ni / SnAg · 17 µm', 't-dim');
    dl += T(186, DG - 137, 'SnAg', 't-sub', 'end') + K.lead(206, DG - 99, 188, DG - 110, '상부 Cu', 'end') + K.lead(206, DG - 81, 188, DG - 72, 'Ni', 'end') + T(186, DG - 29, 'Cu 기둥', 't-sub', 'end');
    dl += T(644, DG - 59, 'SnAg', 't-sub', 'start') + T(644, DG - 8, 'Ni (몸통)', 't-sub', 'start');
    dl += T(275, 700, '끊긴 뒤 면적비 ≈ 360', 't-warn') + T(555, 700, '≈ 230 (범프가 낮다)', 't-warn');
    const DM = [['A', 404, 432, 352, DG - 99, '상부 Cu 홈', 'start'], ['B', 392, 650, 349, DG + 5, '같은 Cu', 'start'], ['C', 690, 650, 621, DG + 5, 'Ni 발–Cu 시드', 'end']];
    DM.forEach(([m, x, y, tx, ty, lb, a]) => { dl += L(x, y, tx, ty, 's-lead') + C(tx, ty, 3.5, 'k-lead') + C(x, y, 16, 'et05-num') + T(x, y + 7, m, 'et05-numt') + T(a === 'start' ? x + 22 : x - 22, y + 7, lb, 't-dim', a); });
    s += G(dd + LB(dl), only('die'));

    // ── 오른쪽: 에반스 그림
    let ev = R(800, 130, 760, 590, 'pl-panel', {rx: 14});
    ev += T(824, 168, '전위와 전류 — 에반스 그림 (개념도)', 't-acc', 'start') + T(824, 198, '녹는 선과 받는 선이 만나는 점 = 녹는 속도와 전위', 't-dim', 'start');
    ev += `<defs><clipPath id="${K.id('et05-ev')}"><rect x="${GX0}" y="${GY1}" width="${GX1 - GX0}" height="${GY0 - GY1}"/></clipPath></defs>`;
    for (let l = LMIN; l <= LMAX; l++) ev += L(ex(l), GY1, ex(l), GY0, 's-faint') + L(ex(l), GY0, ex(l), GY0 + 8, 's-axis') + T(ex(l), GY0 + 30, ['0.01', '0.1', '1', '10', '100', '10³', '10⁴'][l - LMIN], 't-dim');
    [-0.2, 0, 0.2, 0.4].forEach(e => { ev += L(GX0 - 8, ey(e), GX0, ey(e), 's-axis') + T(GX0 - 12, ey(e) + 7, (e > 0 ? '+' : e < 0 ? '−' : '') + Math.abs(e).toFixed(e ? 1 : 0) + (e === 0.4 ? ' V' : ''), 't-dim', 'end'); });
    ev += L(GX0, ey(0), GX1, ey(0), 's-faint', tip('A 혼자일 때의 부식 전위 (기준 0)'));
    ev += L(GX0, GY0, GX1 + 8, GY0, 's-axis') + L(GX0, GY0, GX0, GY1 - 8, 's-axis');
    ev += LB(T(1210, GY0 + 60, '전류 (로그 눈금, A 혼자 녹는 전류 = 1) →', 't-dim'));
    ev += LB(T(836, (GY0 + GY1) / 2, '전위 (A 혼자 = 0) →', 't-dim', 'middle', {transform: `rotate(-90 836 ${(GY0 + GY1) / 2})`}));
    ev += L(ex(-2), ey(-0.24), ex(4), ey(0.48), 's-curve2', tip('A가 녹는 선 (애노드) — 전위를 올릴수록 지수적으로 빨리 녹는다 (타펠, b = 0.12 V/자릿수 예시)'));
    ev += `<g data-v="ev"></g>`;
    // 범례 (두 줄)
    const lg = (x, y, cls, txt) => L(x, y - 7, x + 40, y - 7, cls) + T(x + 50, y, txt, 't-dim', 'start');
    ev += LB(lg(830, 656, 's-curve2', 'A 녹는 선 (애노드)') + lg(1190, 656, 's-dash', 'A 받는 선 (혼자)') + lg(830, 692, 's-curve', 'A + B 받는 선 (결합)') + lg(1190, 692, 'et05-capl', '좁은 틈 상한 ×10 (예시)'));
    s += ev;

    // ── 아래 패널
    s += R(40, 760, 1520, 350, 'pl-panel', {rx: 14});
    // cell: 전지의 네 조건
    let bc = T(70, 802, '갈바닉 전지의 네 조건 — 하나라도 없으면 갈바닉 전류는 0', 'pl-hdg', 'start');
    [['① 녹는 쪽', '(애노드)', '금속이 전자를 내놓고 이온이 되어 녹는다', 't-warn'], ['② 받는 쪽', '(캐소드)', '산화제(H₂O₂ · O₂ · H⁺)가 전자를 받는다', 't-acc'], ['③ 금속 길', '(전자)', '범프 · 시드 · Ti는 늘 이어져 있다', 't-acc'], ['④ 액 길', '(이온)', '식각액 · 헹굼 물 — 액이 닿는 동안', 't-acc']].forEach(([h, h2, d, c], i) => {
      const x = 70 + i * 232;
      bc += R(x, 822, 216, 186, 'pl-box', {rx: 10}) + T(x + 16, 856, h, c, 'start') + T(x + 16, 884, h2, 't-dim', 'start') + TT(x + 16, 920, wrap(d, 9.6), 't-dim', 'start', 25);
    });
    bc += TT(70, 1048, ['시드 식각에서는 ③이 늘 있어서, 액이 닿는 동안 서로 다른 금속은 늘 한 전지입니다.', '얼마나 빨라지는지는 오른쪽 그림에서 두 선이 만나는 점이 정합니다.'], 't-sub', 'start', 34);
    s += G(LB(bc), only('cell'));
    // who: 같은 Ti라도 액에 따라
    let bw = T(70, 802, '같은 Ti라도 액에 따라 역할이 바뀐다', 'pl-hdg', 'start');
    [['Cu 식각액 (과산화수소 + 산)', 't-acc', ['Ti: 산화막에 덮여 거의 안 녹음 → 받는 쪽에 가깝다', '녹는 것: Cu 시드 · 기둥 옆 · 상부 Cu 띠 (Cu끼리는 결정 · 풀림 차이만)']], ['묽은 HF (Ti 식각)', 't-warn', ['Ti: 산화막이 녹아 맨몸 → 녹는 쪽', '받는 쪽: 범프 겉면 — 베이스 다이 Cu · Ni · SnAg, 코어 다이 Ni · SnAg (수소 발생 · 용존 산소)']]].forEach(([h, c, ls], i) => {
      const x = 70 + i * 466;
      bw += R(x, 822, 448, 214, 'pl-box', {rx: 10}) + T(x + 18, 858, h, c, 'start');
      let y = 898;
      ls.forEach(t => { const w = wrap(t, 20.5); bw += TT(x + 18, y, w, 't-sub', 'start', 28); y += w.length * 28 + 10; });
    });
    bw += T(70, 1066, '실제 순서(갈바닉 계열)는 산화막 · 착화제 · pH가 정한다 — 액마다 따로 잰다', 't-dim', 'start');
    bw += T(70, 1096, 'k(받는 반응 세기)가 작으면 이어져 있어도 거의 안 빨라진다 → 오른쪽 그림', 't-dim', 'start');
    s += G(LB(bw), only('who'));
    // area: 식과 면적 계산
    let ba = T(70, 808, 'F = (1 + k·R)^m', 'pl-eqn', 'start') + T(320, 808, 'm = ½ 반응 지배 (기울기 같을 때) · 1 공급 지배 · 좁은 틈 상한 10 (예시)', 't-dim', 'start');
    ba += TT(70, 852, ['받는 쪽: 범프 겉면 (둘레 × 높이 + 윗면) ≈ 2,850 µm²', '녹는 쪽 — Ti가 이어져 있을 때: 한 칸의 Ti ≈ 2,530 µm² → 면적비 ≈ 1.1', '녹는 쪽 — 끊긴 뒤: 고리 단면 (둘레 × Ti 두께) ≈ 7.9 µm² → ≈ 360', '(베이스 다이: 지름 25 · 피치 55 · 높이 30 µm · Ti 0.1 µm 예시)'], 't-sub', 'start', 34);
    ba += T(70, 1000, '코어 다이(Ni / SnAg, 높이 17 µm): 겉 ≈ 1,830 µm² → 이어짐 ≈ 0.7 · 끊긴 뒤 ≈ 230', 't-dim', 'start');
    ba += T(70, 1040, 'Ti가 다 지워져 끊기는 순간 면적비가 약 1 → 수백으로 뛴다 → 과식각 동안 빨라진다', 't-warn', 'start');
    ba += T(70, 1076, '깊이 파일수록 좁은 틈의 액 저항 · 공급이 가속을 묶는다 (틈 부식과 같은 원리)', 't-dim', 'start');
    s += G(LB(ba), only('area'));
    // die: 다이마다 달라지는 짝 (왼쪽 A · B · C 와 같은 글자)
    let bd = T(70, 802, '다이마다 달라지는 짝 — 녹는 쪽은 그 액 속 실제 전위가 정한다', 'pl-hdg', 'start');
    [['베이스 다이 — Cu / Ni / Cu / SnAg', 't-acc', [['A', '상부 Cu 띠(3 µm): 위아래로 Ni · SnAg와 맞닿은 얇은 Cu — Cu 식각액에 옆이 파이면 Ni와 SnAg 사이 홈(노치)'], ['B', 'Cu 기둥–Cu 시드: 같은 Cu — 결정 · 풀림 차이만 (앞 단계 ③)'], ['', 'HF: 범프 겉 ≈ 2,850 µm² → Ti가 끊긴 뒤 R\u00a0≈\u00a0360 → ×3.9 (k 0.04 예시)']]],
      ['코어 다이 — Ni / SnAg (Cu 기둥 없음)', 't-warn', [['C', 'Ni 발–Cu 시드: 다른 금속이 맞닿음 — Cu 식각액에 Ni 발 밑 시드가 파이고, 더 빨라질지는 실제 전위가 정한다'], ['', 'SnAg가 Ni에 바로 닿는다(베이스는 상부 Cu에) · 범프에 Cu가 없어 Cu 손실 · Cu 촉매(앞 단계 ②)는 작은 편'], ['', 'HF: 범프가 낮아 겉 ≈ 1,830 µm² → R\u00a0≈\u00a0230 → ×3.2 (같은 k라면 — k는 겉 금속마다 다르다)']]]].forEach(([h, hc, items], i) => {
      const x = 70 + i * 470;
      bd += R(x, 822, 450, 276, 'pl-box', {rx: 10}) + T(x + 18, 856, h, hc, 'start');
      let y = 890;
      items.forEach(([m, t]) => {
        const w = wrap(t, 19.6);
        bd += m ? C(x + 30, y - 7, 14, 'et05-num') + T(x + 30, y, m, 'et05-numt') : C(x + 30, y - 7, 4, 'k-acc');
        bd += TT(x + 54, y, w, 't-dim', 'start', 22); y += w.length * 22 + 8;
      });
    });
    s += G(LB(bd), only('die'));
    // 결과 상자 (위젯) — cell · who · area
    s += G(`<g data-v="res"></g>`, only('cell who area die'));
    // bump: 사례 카드 4장
    let cards = '';
    CARDS.forEach((c, i) => {
      const x = CX(i), y = CY;
      let g = R(x, y, CW, CH, 'pl-box', {rx: 12}) + T(x + 16, y + 32, c.h, 'pl-hdg', 'start');
      g += G(cardPic(K, i, x + 8, y + 44), tip(c.h.slice(2)));
      g += TT(x + 16, y + 168, wrap(c.d, 16.4), 't-dim', 'start', 25);
      cards += G(g);
    });
    s += G(LB(cards), only('bump'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 면적비와 녹는 속도</div>
      ${K.seg('ph', [['field', '이어져 있음 (R 1.1)'], ['iso', '끊긴 뒤 · R 직접']], 'iso', '범프 사이 Ti')}
      ${K.ctl('r', '면적비 R (받는 쪽 ÷ 녹는 쪽)', 0, 300, 1, 256)}
      ${K.ctl('k', '받는 반응 세기 k (범프 겉 ÷ Ti, 예시)', 0, 400, 1, 160)}
      ${K.seg('mode', [['tafel', '반응 지배'], ['lim', '공급 지배']], 'tafel', '받는 반응')}
      ${K.kpis([['면적비 R', 'k-r', '받는 쪽 ÷ 녹는 쪽'], ['이론 배수 F', 'k-f', 'A 혼자 대비'], ['실제 배수', 'k-fe', '좁은 틈 상한 10'], ['전위 이동 ΔE', 'k-de', '이론값'], ['예시 Ti 언더컷', 'k-u', `06장 식 · 혼자 ${U1.toFixed(2)} µm`]])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('혼합 전위 — 이어진 두 금속은 한 전위로 맞춰지고, A가 녹는 전류 = A · B 위에서 받는 전류의 합입니다. A 혼자의 부식 전류를 1, 타펠 기울기 b = 0.12 V/자릿수를 두 반응에 같게 두면 반응 지배 F = (1 + kR)^½, 받는 반응이 공급(확산) 한계면 F = 1 + kR (k ≈ 1). 예시 Ti 언더컷 = Ti 두께 0.1 µm(끊기기 전 — 가속 없음) + 끊긴 뒤 옆 식각 0.039 µm × 실제 배수(06장 묽은 HF 기본: 600 nm/분 × 과식각 3.9 s) — 06장 위젯과 같은 식이라 기본값에서 약 0.25 µm(06장 256 nm)입니다. 좁은 틈 상한 10 · 기본 k 0.04(06장 Ti 식각 위젯의 가속 4와 맞춘 값)는 모두 예시이고, 실제 크기는 액 · 장비 · 범프마다 다릅니다. 끊긴 뒤 면적비 예시: 베이스 다이 ≈ 360(범프 겉 ≈ 2,850 µm²) · 코어 다이 ≈ 230(≈ 1,830 µm², 범프가 낮다).')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, TT, G, LB, tip, wrap, arrow, arrowP, clamp} = K;
    const st = Object.assign({}, DEMO.area);
    let touched = false, kTouched = false;
    const rin = ctx.card.querySelector('input[data-i=r]'), kin = ctx.card.querySelector('input[data-i=k]');
    const klab = kin.parentNode.querySelector('label'), rctl = rin.parentNode;
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    // ── 왼쪽 cell: 판 A가 녹고, 판 B는 면적비만큼 넓게
    function cellV(c){
      const wB = 50 + 60 * clamp(Math.log10(c.R) / 3, 0, 1), dA = 3 + 2.4 * c.Fe;
      const n = Math.round(clamp(3 * Math.pow(c.Fe, 0.6), 3, 12));
      let g = P(`M240,250 L290,250 L290,336 L${r1(290 - dA)},356 L${r1(290 - 0.8 * dA)},420 L${r1(290 - dA)},490 L${r1(290 - 0.75 * dA)},560 L${r1(290 - dA)},612 L${r1(290 - 0.6 * dA)},630 L240,630 Z`, 'f-ti', tip(`금속 A (녹는 쪽, 애노드) — 혼자일 때보다 ×${fF(c.Fe)} 빨리 녹는다 (위젯 값)`));
      g += R(510, 250, wB, 380, 'f-cu2', tip(`금속 B (받는 쪽, 캐소드) — 면적비 R ${fR(c.R)} (판 너비는 로그로 나타냄)`));
      let mv = '';
      for (let q = 0; q < n; q++){
        const y = 384 + (q * 37) % 180, d0 = q * 3.1 / n;
        mv += mol(`M${r1(292 - dA + 16)},${y} C340,${y - 6} 360,${y - 30} 392,${y - 46}`, 'Mⁿ⁺', 'mion', 17, 3.1, d0);
        mv += K.ionPath('M265,320 L265,190 L535,190 L535,320', 'e', 2.6, q * 2.6 / n);
      }
      [392, 448, 504].forEach((y, q) => { mv += K.ionPath(`M420,${y + 30} C450,${y + 20} 474,${y + 4} 500,${y}`, 'h', 3.4, q * 1.1); });
      [[502, 600, 5, 0], [498, 540, 4, 1.3], [503, 470, 4.5, 2.4]].forEach(([bx, by, br, d], q) => { mv += K.bubble(bx, by, br, 60 + q * 8, 2.6, d); });
      g += G(mv, K.W({'data-noov': 1}, tip('금속 이온 Mⁿ⁺ — Ti는 HF 속에서 불소와 묶인 착이온(TiF₆³⁻ 등)으로 녹는다\nH⁺ — B 겉면에서 전자를 받아 수소(H₂) 거품이 된다')));
      g += LB(T(250, 236, `녹는 속도 ×${fF(c.Fe)}`, 't-warn', 'end') + (c.capped ? T(250, 262, '(좁은 틈 상한 — 예시)', 't-dim', 'end') : ''));
      return g;
    }
    // ── 왼쪽 area · bump: Ti(이어짐 / 끊긴 뒤) · 밑동 파임 · 전류 · 위에서 본 한 칸 · 번호
    function bumpV(c){
      const up = c.field ? 0 : Math.min(54, 80 * c.u), sw = (1.6 + 1.4 * Math.log10(Math.max(1, c.Fe))).toFixed(1), aw = {style: `stroke-width:${sw}`};
      let g = '', ar = '';
      if (c.field){
        g += R(60, YT, 680, TI_H, 'f-ti', tip('Ti (실제 0.1 µm — 그림은 과장) — 범프 사이에 아직 이어져 있다')) + R(60, YT, BX0 - 60, TI_H, 'pl-on') + R(BX1, YT, 740 - BX1, TI_H, 'pl-on');
        [[96, 584], [150, 568], [204, 548], [258, 522]].forEach(([xs, ye]) => { ar += arrowP(`M${xs},${YT - 3} Q${xs},${ye} ${BX0 - 9},${ye}`, 's-arr2', aw); });
        g += G(ar, K.W(K.only('area'), tip('액 속 전류 — 넓은 Ti 전체에서 나와 범프 겉면으로 (녹는 쪽이 넓어 한 곳에 몰리지 않는다)')));
        g += G(LB(T(60, 706, '녹는 쪽 (애노드): 범프 사이 Ti 전체 — 면적비 ≈ 1.1', 't-warn', 'start')), K.only('area'));
        g += LB(T(60, 668, 'Ti 전체가 고르게 얇아지는 중 · 두께 과장 (Ti 실제 0.1 µm)', 't-dim', 'start'));
      } else {
        g += R(60, YT, 680, TI_H, 'f-etl') + R(BX0 + up, YT, BX1 - BX0 - 2 * up, TI_H, 'f-ti', tip('밑동 Ti — 범프 사이 Ti가 다 지워져 고리 끝만 액에 닿는다'));
        g += R(BX0 + up - 3, YT, 6, TI_H, 'pl-on') + R(BX1 - up - 3, YT, 6, TI_H, 'pl-on') + C(BX1 - up, YT + 7, 14, 'co-ring') + C(BX0 + up, YT + 7, 14, 'co-ring');
        [[562, 40], [514, 58], [462, 76], [404, 92]].forEach(([ye, dx]) => { ar += arrowP(`M${BX0 - 4},${YT - 2} C${BX0 - dx},${YT - 14} ${BX0 - dx},${ye + 6} ${BX0 - 9},${ye}`, 's-arr2', aw); });
        g += G(ar, K.W(K.only('area'), tip('액 속 전류 — 범프 겉면 전체에서 받은 전류가 고리 끝 한 곳에 몰린다 (오른쪽 끝도 같다)')));
        g += G(LB(T(60, 706, `녹는 쪽 (애노드): 밑동 Ti 고리 끝만 — 면적비 R ≈ ${fR(c.R)}`, 't-warn', 'start')), K.only('area'));
        g += LB(T(60, 668, `예시 Ti 언더컷 ≈ ${c.u.toFixed(2)} µm (그림은 10배 과장) · Ti 실제 0.1 µm`, 't-dim', 'start'));
      }
      // 위에서 본 한 칸 (area, 왼쪽)
      const ix = 66, iy = 336, iw = 124, cx = ix + iw / 2, cy = iy + iw / 2, rr = 12.5 / 55 * iw;
      let ins = R(ix - 5, iy - 5, iw + 10, iw + 10, 'pl-box', {rx: 8}) + T(cx, iy - 14, '위에서 본 한 칸', 't-dim');
      if (c.field) ins += R(ix, iy, iw, iw, 'f-ti') + R(ix, iy, iw, iw, 'pl-on') + C(cx, cy, rr, 'f-cu2') + C(cx, cy, rr + 2, 'et05-cath2');
      else ins += R(ix, iy, iw, iw, 'f-pas') + C(cx, cy, rr, 'f-cu2') + C(cx, cy, rr + 1, 'et05-ring');
      ins += T(cx, iy + iw + 30, '녹는 쪽', 't-warn') + T(cx, iy + iw + 56, c.field ? 'Ti 전체' : '고리 단면', 't-warn') + T(cx, iy + iw + 82, c.field ? '≈ 2,530 µm²' : '≈ 7.9 µm²', 't-sub');
      g += G(LB(ins), K.W(K.only('area'), tip(c.field ? '피치 55 µm 한 칸: 녹는 쪽 = 범프 밖 Ti 전체 (55² − π·12.5² ≈ 2,530 µm²)' : '피치 55 µm 한 칸: 녹는 쪽 = 범프 밑 Ti 고리의 단면 (둘레 π·25 µm × 두께 0.1 µm ≈ 7.9 µm²)')));
      // 확대: 밑동 고리 끝 (area, 오른쪽) — 그림 비율은 과장
      const MX = 642, MY = 398, MR = 106, WX = 660, TY = 404, TH = 34;
      let mg = C(MX, MY, MR, 'et05-magbg') + R(MX - MR, MY - MR, 2 * MR, TY + TH - (MY - MR), 'f-etl');
      mg += R(MX - MR, TY + TH, 2 * MR, MY + MR - TY - TH, 'f-pas') + R(MX - MR, MY - MR, WX - (MX - MR), TY - 18 - (MY - MR), 'f-cu2') + R(MX - MR, TY - 18, WX - (MX - MR), 18, 'f-seed2');
      let ma = '';
      if (c.field){
        mg += R(MX - MR, TY, WX - (MX - MR), TH, 'f-ti') + R(WX, TY + 6, MX + MR - WX, TH - 6, 'f-ti') + R(WX, TY + 6, MX + MR - WX, TH - 6, 'pl-on');
        [[680, 374], [708, 342], [736, 310]].forEach(([xs, ye]) => { ma += arrowP(`M${xs},${TY + 2} Q${xs},${ye} ${WX + 7},${ye}`, 's-arr2', aw); });
      } else {
        const tx = WX - Math.min(80, 160 * c.u);
        mg += R(MX - MR, TY, tx - (MX - MR), TH, 'f-ti') + R(tx - 3, TY, 6, TH, 'pl-on') + C(tx, TY + TH / 2, 12, 'co-ring');
        [[372, 30], [340, 50], [308, 70]].forEach(([ye, dx]) => { ma += arrowP(`M${tx + 6},${TY + TH / 2} C${WX + dx},${TY + TH / 2} ${WX + dx},${ye + 8} ${WX + 7},${ye}`, 's-arr2', aw); });
      }
      mg += ma;
      mg += LB(T(MX - 50, MY - 42, 'Cu', 'et05-zl') + T(MX - 86, TY + TH / 2 + 7, 'Ti', 'et05-zl') + T(MX - 30, TY + TH + 40, '보호막', 't-dim'));
      let mag = `<clipPath id="${K.id('et05-mag')}"><circle cx="${MX}" cy="${MY}" r="${MR}"/></clipPath>` + G(mg, {'clip-path': K.url('et05-mag')});
      mag += C(MX, MY, MR, 'et05-mag') + L(MX - 76, MY + 74, BX1 + 10, YT - 4, 'et05-magl') + C(BX1, YT + 6, 11, 'et05-magc');
      mag += LB(T(MX, MY - MR - 12, c.field ? '확대: 범프 밑동 가장자리' : '확대: 밑동 고리 끝', 't-dim'));
      g += G(mag, K.W(K.only('area'), tip(c.field ? '확대 — Ti가 아직 이어져 있어 범프 밖 Ti 전체가 고르게 녹는다' : `확대 — 고리 끝(녹는 쪽)이 범프 밑으로 파고든다 (그림 비율은 과장). 예시 Ti 언더컷 ≈ ${c.u.toFixed(2)} µm\n= Ti 0.1 µm + 끊긴 뒤 옆 0.039 µm × ${fF(c.Fe)} (06장 식)`)));
      // 번호 (bump)
      const NUM = [[1, 640, 556, BX1 - up + 2, YT + 7, 'Ti 고리', 'start'], [2, 162, 556, BX0 + up - 2, YT + 7, 'Cu 옆 Ti', 'end'], [3, 640, 474, BX1, Y_SEED + 3, '계면 홈', 'start'], [4, 162, 402, BX0, 400, '솔더 겉', 'end']];
      // bump: ③ 기둥–시드 계면 홈 · ④ 솔더 겉 얼룩 (그림은 과장)
      let bx = P(`M${BX1 + 1},${Y_SEED - 12} L${BX1 - 12},${Y_SEED - 1} L${BX1 + 1},${Y_SEED + 4} Z`, 'et05-groove') + P(`M${BX0 - 1},${Y_SEED - 12} L${BX0 + 12},${Y_SEED - 1} L${BX0 - 1},${Y_SEED + 4} Z`, 'et05-groove');
      [[BX0 + 16, 396], [BX0 + 34, 374], [BX0 + 24, 424], [BX1 - 30, 384], [BX1 - 46, 428], [BX1 - 84, 366]].forEach(([sx, sy]) => { bx += C(sx, sy, 4.2, 'et05-stain'); });
      g += G(bx, K.W(K.only('bump'), tip('③ 기둥–시드 계면 홈 · ④ 솔더 겉 얼룩 (그림은 과장)')));
      let nm = '';
      NUM.forEach(([n, x, y, tx, ty, lb, a]) => {
        nm += L(x, y, tx, ty, 's-lead') + C(tx, ty, 3.5, 'k-lead') + C(x, y, 17, 'et05-num') + T(x, y + 7, String(n), 'et05-numt') + T(a === 'start' ? x + 24 : x - 24, y + 7, lb, 't-dim', a);
      });
      g += G(LB(nm), K.only('bump'));
      return g;
    }
    // ── 에반스 그림
    function evV(c){
      const lim = !c.tafel;
      let ln = P(cathD(0, lim), 's-dash', tip('A 위에서 받는 선 — A 혼자일 때'));
      if (c.x > 1.001) ln += P(cathD(c.L, lim), 's-curve', tip(`A + B 위에서 받는 선의 합 — A 혼자의 ${fF(c.x)}배 (1 + kR)`));
      if (c.capped) ln += L(ex(1), GY1, ex(1), GY0, 'et05-capl', tip('좁은 틈 상한 ×10 (예시) — 고리 끝이 Ti 두께만 한 좁은 틈으로 들어가면 틈 속 액 저항 · 공급이 가속을 묶는다'));
      let g = G(ln, {'clip-path': K.url('et05-ev')});
      const x0 = ex(0), y0 = ey(0), lA = Math.log10(c.Fe), xA = ex(lA), yA = ey(B * lA);
      const busy = [[x0 - 10, y0 - 10, x0 + 10, y0 + 10], [xA - 12, yA - 12, xA + 12, yA + 12]];
      const fits = (bx) => bx[0] > GX0 + 4 && bx[2] < 1550 && bx[1] > GY1 - 4 && bx[3] < GY0 - 4 && !busy.some(b => bx[0] < b[2] && bx[2] > b[0] && bx[1] < b[3] && bx[3] > b[1]);
      // 이름표 자리: 후보 [x, y(글 기준선), 정렬] 중 처음으로 비어 있는 곳
      const place = (txt, cls, px, cands) => {
        const w = tw(txt, px);
        for (const [x, y, a] of cands){ const x0b = a === 'end' ? x - w : a === 'middle' ? x - w / 2 : x, bx = [x0b, y - px * 0.82, x0b + w, y + px * 0.22]; if (fits(bx)){ busy.push(bx); return T(x, y, txt, cls, a); } }
        const [x, y, a] = cands[0]; return T(x, y, txt, cls, a);
      };
      if (xA - x0 > 34) g += arrow(x0 + 12, y0, xA - 8, y0, 's-arr2') + L(xA, y0 - 2, xA, yA + 10, 'et05-guide');
      if (c.capped){
        const lT = Math.log10(c.F), xT = ex(lT), yT = ey(B * lT);
        busy.push([xT - 12, yT - 12, xT + 12, yT + 12]);
        g += C(xT, yT, 9, 'et05-th', tip(`이론 교점 — 상한이 없다면 ×${fF(c.F)}`));
        g += LB(place(`이론 ×${fF(c.F)}`, 't-dim', 19, lim ? [[xT + 16, yT + 26, 'start'], [xT - 16, yT - 10, 'end'], [xT + 16, yT - 10, 'start']] : [[xT, yT - 30, 'middle'], [xT + 32, yT + 6, 'start'], [xT, yT + 46, 'middle']]));
      }
      g += C(x0, y0, 9, 'k-acc', tip('혼자 — A만 액에 잠겼을 때: 녹는 선과 A 위 받는 선이 만나는 점 (속도 1, 전위 0)'));
      g += C(xA, yA, 10, 'k-acc2', tip(`결합 — A가 B와 이어졌을 때: 녹는 속도 ×${fF(c.Fe)}, 전위 +${Math.round(c.dE * 1000)} mV (이론)`)) + C(xA, yA, 18, 'co-ring');
      g += LB(place('혼자', 't-sub', 21, [[x0 - 32, y0 + 7, 'end'], [x0 - 14, y0 - 18, 'end'], [x0 + 14, y0 + 32, 'start']]));
      const lbl = c.capped ? `실제 ×${fF(c.Fe)} (상한)` : `결합 ×${fF(c.Fe)}`;
      const cand = c.capped ? [[xA - 24, yA + 2, 'end'], [xA - 16, yA - 14, 'end'], [xA + 16, yA + 30, 'start']]
        : lim ? [[xA + 16, yA + 30, 'start'], [xA - 16, yA - 8, 'end'], [xA + 16, yA - 14, 'start']]
          : [[xA + 30, yA + 6, 'start'], [xA - 30, yA + 6, 'end'], [xA + 14, yA + 34, 'start'], [xA - 14, yA - 18, 'end']];
      g += LB(place(lbl, 'pl-hdg2', 21, cand));
      return g;
    }
    // ── 결과 상자 (cell · who · area)
    function resV(c){
      let g = R(1010, 784, 526, 302, 'pl-box', {rx: 12}) + T(1030, 818, '지금 — 직접 해 보기 값 (개념 모델)', 't-dim', 'start');
      g += T(1030, 856, `R ${fR(c.R)}${c.field ? ' (Ti 이어짐)' : c.die ? ` (${c.die})` : ''} · k ${fk(c.k)} · ${c.tafel ? '반응 지배' : '공급 지배'}`, 't-sub', 'start');
      const big = `녹는 속도 ×${fF(c.Fe)}`;
      g += T(1030, 916, big, 'et05-big', 'start');
      if (c.capped) g += T(1030 + tw(big, 40) + 14, 916, `(이론 ×${fF(c.F)})`, 't-dim', 'start');
      g += T(1030, 960, `전위 이동 +${Math.round(c.dE * 1000)} mV (이론)`, 't-sub', 'start');
      g += T(1030, 996, c.field ? '예시 Ti 언더컷: 아직 Ti 두께(0.1 µm) 이하' : `예시 Ti 언더컷 (06장 식): 혼자 ${U1.toFixed(2)} → ${c.u.toFixed(2)} µm`, 't-sub', 'start');
      const v = c.field ? `Ti가 이어져 있어 녹는 쪽이 넓다 → 가속이 ${c.Fe < 1.2 ? '거의 없다' : '작다'} (끊긴 뒤와 비교)`
        : c.capped ? `이론으로는 ×${fF(c.F)}지만, 좁은 틈 속 액 저항 · 공급이 가속을 묶는다 (상한은 예시)`
          : c.Fe >= 2 ? '넓은 받는 쪽이 쓰는 전자를 좁은 녹는 쪽이 모두 내놓는다'
            : c.Fe < 1.2 ? '받는 쪽이 좁거나 받는 반응이 약해 거의 그대로'
              : '조금 빨라진다 — 면적비 R · 받는 반응 k가 클수록 더';
      g += TT(1030, 1036, wrap(v, 24), c.Fe >= 2 ? 't-warn' : 't-dim', 'start', 28);
      return g;
    }
    function render(){
      const c = calc(st);
      ctx.$('[data-v="cellv"]').innerHTML = cellV(c);
      ctx.$('[data-v="bumpv"]').innerHTML = bumpV(c);
      ctx.$('[data-v="ev"]').innerHTML = evV(c);
      ctx.$('[data-v="res"]').innerHTML = LB(resV(c));
      ctx.refresh();
      ctx.out('r', st.ph === 'field' ? '1.1 (이어짐)' : fR(c.R));
      ctx.out('k', fk(c.k));
      rctl.style.opacity = st.ph === 'field' ? '0.45' : '';
      klab.firstChild.nodeValue = (c.tafel ? '받는 반응 세기 k (범프 겉 ÷ Ti, 예시)' : '받는 쪽 공급 비 k (흐름 같으면 ≈ 1)') + ' ';
      ctx.out('k-r', fR(c.R)); ctx.out('k-f', '×' + fF(c.F)); ctx.out('k-fe', '×' + fF(c.Fe)); ctx.out('k-de', `+${Math.round(c.dE * 1000)} mV`); ctx.out('k-u', c.field ? '≤ 0.1 µm' : `${c.u.toFixed(2)} µm`);
      const kfe = ctx.card.querySelector('[data-o="k-fe"]').parentNode;
      kfe.classList.toggle('ok', c.Fe < 1.5); kfe.classList.toggle('warn', c.Fe >= 1.5 && c.Fe < 5); kfe.classList.toggle('ng', c.Fe >= 5);
      let m;
      if (c.field) m = `Ti가 이어져 있는 동안은 녹는 쪽이 넓어(면적비 ≈ 1.1) 갈바닉 가속이 ${c.Fe < 1.2 ? '거의 없습니다' : '작습니다'} (×${fF(c.Fe)}). Ti 언더컷도 아직 Ti 두께(0.1 µm) 이하입니다. '끊긴 뒤'를 눌러 면적비가 수백으로 뛸 때와 비교해 보세요.`;
      else if (c.capped) m = `이론 배수는 <b>×${fF(c.F)}</b>이지만, 좁은 틈 속 액 저항 · 공급이 가속을 묶어 실제로는 ×${fF(c.Fe)} 근처입니다(상한은 예시). 예시 Ti 언더컷 약 ${c.u.toFixed(2)} µm.`;
      else if (c.Fe >= 2) m = `녹는 쪽이 좁아져(면적비 ${fR(c.R)}${c.die ? ' — ' + c.die + ' 예시' : ''}) 녹는 속도가 약 <b>×${fF(c.Fe)}</b>가 됩니다. 범프 사이 Ti가 끊긴 뒤의 일이라, HF로 Ti를 지울 때 과식각을 짧게 잡는 까닭입니다.`;
      else if (c.Fe >= 1.2) m = `받는 쪽(B)이 쓰는 전자까지 녹는 쪽이 내놓아야 해서 혼자일 때보다 ×${fF(c.Fe)} 빨리 녹습니다. 받는 쪽이 넓을수록(R) · 받는 반응이 잘 될수록(k) 더 빨라집니다.`;
      else m = `면적비 · 받는 반응이 작아 이어져 있어도 녹는 속도는 ×${fF(c.Fe)}로 거의 그대로입니다. 면적비 R이나 k를 키워 보세요.`;
      if (!c.tafel) m += ' 공급 지배: 받는 쪽 전류밀도는 공급이 정해 금속 종류와 거의 무관(k ≈ 1) → 면적비가 거의 그대로 배수가 됩니다.';
      ctx.q('[data-o=msg]').innerHTML = m;
    }
    ctx.seg('ph', (v, user) => {
      st.ph = v;
      if (user){ touched = true; const sid = ctx.step(); if (sid === 'cell' || sid === 'who') ctx.go('area'); }
      render();
    });
    ctx.seg('mode', (v, user) => {
      st.mode = v;
      if (user){ touched = true; if (v === 'lim' && !kTouched){ st.kv = 300; kin.value = 300; } }
      render();
    });
    ctx.range('r', v => { st.rv = v; render(); return null; });
    ctx.range('k', v => { st.kv = v; render(); return null; });
    rin.addEventListener('input', () => { touched = true; if (st.ph === 'field'){ st.ph = 'iso'; setSeg('ph', 'iso'); render(); } });
    kin.addEventListener('input', () => { touched = true; kTouched = true; });
    ctx.demo = sid => {
      if (touched || !DEMO[sid]) return ctx.refresh();
      Object.assign(st, DEMO[sid]);
      rin.value = st.rv; kin.value = st.kv; setSeg('ph', st.ph); setSeg('mode', st.mode);
      render();
    };
    render();
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['갈바닉 부식 (전지 효과)', '서로 다른 금속이 전기로 이어진 채 같은 액에 잠길 때, 한쪽이 혼자 있을 때보다 더 빨리 녹는 현상'],
      ['애노드 · 캐소드', '애노드(산화 전극) = 금속이 전자를 내놓고 녹는 쪽, 캐소드(환원 전극) = 산화제가 전자를 받는 쪽. 주의 — 도금(전기분해)에서는 애노드가 정류기 (+)에 물린 쪽이지만, 식각 · 부식처럼 저절로 일어나는 전지에서는 녹는 애노드가 오히려 전위가 낮은 쪽이다. 그래서 이 탭은 부호가 뒤바뀌기 쉬운 \'양극 · 음극\' 대신 애노드 · 캐소드라고 부른다'],
      ['전위', '금속이 전자를 붙잡아 두려는 정도를 전기의 \'높이\'로 나타낸 값. 낮을수록 전자를 쉽게 내놓아 잘 녹고(녹는 쪽), 높을수록 \'귀하다\'고 하며 잘 안 녹는다'],
      ['부식 전위 · 혼합 전위', '부식 전위 = 그 액 속에서 금속이 혼자 있을 때 저절로 자리 잡는 전위. 산화막 · 착화제 · pH 때문에 표준 전위 순서와 다를 수 있다. 혼합 전위 = 녹는 반응과 받는 반응의 전류가 같아지는 전위 — 이어진 금속들은 하나의 혼합 전위를 갖는다'],
      ['면적비', '받는 쪽 면적 ÷ 녹는 쪽 면적. 클수록 녹는 쪽이 빨리 녹는다 (이 장의 베이스 다이 범프 예: Ti가 이어져 있으면 ≈ 1.1, 끊긴 뒤 ≈ 360 · 낮은 코어 다이 범프는 끊긴 뒤 ≈ 230)'],
      ['두 다이의 범프', '베이스 다이(맨 아래 로직 · 인터페이스 다이): Cu 기둥 / Ni / 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu) / SnAg, 예시 30 µm. 코어 다이(DRAM, 여러 장 쌓임): Ni / SnAg, 예시 17 µm — 액에 닿는 금속 짝이 다르다'],
      ['에반스 그림', '가로에 전류(로그), 세로에 전위를 두고 녹는 선과 받는 선이 만나는 점으로 녹는 속도와 전위를 읽는 그림'],
      ['치환 석출', '액 속 귀한 금속 이온(Cu²⁺)이 덜 귀한 금속(Sn · 맨몸 Ti) 표면에서 전기 없이 금속으로 붙는 일']
    ]) + K.field([
      '갈바닉 언더컷은 \'범프 근처만\' 빨리 파이는 모양으로 나타납니다. 범프에서 먼 시드는 정상인데 밑동만 깊으면 의심합니다. 같은 조건에서 범프 없는 시드 웨이퍼(블랭킷)의 속도와 범프 웨이퍼의 밑동 언더컷을 비교하면 갈바닉 몫을 가늠할 수 있습니다.',
      'HF로 Ti를 지울 때 위험한 구간은 과식각 시간입니다. 범프 사이 Ti가 끊긴 순간부터 밑동 Ti가 빨리 녹습니다 → <a data-go="ti.hf">06장</a>.',
      '같은 레시피인데 범프 크기 · 밀도 · 솔더 높이가 다른 제품에서 언더컷이 다르면 면적비를 생각합니다 (범프가 크고 높을수록 받는 쪽이 넓습니다). 코어 다이(Ni / SnAg)와 베이스 다이(Cu / Ni / Cu / SnAg)도 높이 · 겉 금속이 달라 따로 봅니다 — 단면에서 베이스 다이는 Ni와 SnAg 사이 상부 Cu 띠의 옆 홈, 코어 다이는 Ni 발 밑 Cu 시드 언더컷을 잽니다 (<a data-go="galv.die">두 다이</a>).',
      '용존 산소 · 산화제 농도 · 액 나이 · 온도가 받는 반응 세기(k)를 바꿔 갈바닉 크기를 바꿉니다. Cu 식각과 Ti 식각 사이 헹굼이 모자라면 Cu²⁺가 다음 액으로 넘어가 치환 석출 · 얼룩이 늘 수 있습니다 → <a data-go="tool.rinse">08장</a>.',
      '갈바닉의 기초(이어진 금속끼리, 넓은 금속에 붙은 작은 금속)는 PR 스트립 탭에도 있습니다 → <a href="#go-strip-07">PR 스트립 07장</a>. 스트립에서 생기는 계면 손실은 보통 nm~수십 nm이고, µm 단위 밑동 언더컷은 시드 식각을 먼저 의심합니다.'
    ]) + K.deep(`<p>이어진 두 금속은 한 전위(혼합 전위)로 맞춰지고, 녹는 전류의 합 = 받는 전류의 합입니다 (Wagner–Traud). A(녹는 쪽) 면적 A_a, B(받는 쪽) 면적 A_c, 면적비 R = A_c / A_a, k = 같은 전위에서 받는 전류밀도의 비(B ÷ A)라 하면:</p>
      ${K.eq('A_a·i_a = A_a·i_c,A + A_c·i_c,B')}${K.eq('→ i_a = i_c,A·(1 + k·R)')}
      <p>반응 지배(타펠 기울기 b가 두 반응에 같음):</p>${K.eq('F = (1 + k·R)^½ · ΔE = (b/2)·log(1 + k·R)')}
      <p>공급 지배(받는 반응이 확산 한계, k ≈ 1):</p>${K.eq('F = 1 + k·R · ΔE = b·log(1 + k·R)')}
      <ul><li><b>면적비 법칙</b> — 공급 지배 식이 교과서의 '작은 애노드 + 큰 캐소드는 위험'입니다. 받는 반응이 확산 한계면 받는 쪽 전류밀도는 공급(D·C/δ)이 정하고 금속의 촉매 성질과는 거의 무관해 k ≈ 1입니다(흐름이 같을 때). 반응 지배에서는 같은 R이라도 가속이 제곱근으로 작아집니다 — 예: R 360 · k 0.04 → ×3.9 · +71 mV(위젯 기본, b 0.12 V 예시), 공급 지배 · k 1 → 이론 ×361.</li>
      <li><b>범프 밑 Ti 고리 — 가속은 왜 '끊긴 뒤'에 커지나</b> — 범프 사이 Ti가 이어져 있는 동안은 Ti 전체가 녹는 쪽입니다. 피치 55 µm 한 칸에서 Ti ≈ 55² − π·12.5² ≈ 2,530 µm², 받는 쪽(베이스 다이 범프 겉면 π·25·30 + π·12.5²) ≈ 2,850 µm² → 면적비 ≈ 1.1. 범프 사이 Ti가 다 지워져 끊기는 순간 녹는 쪽이 고리 단면(π·25·0.1 ≈ 7.9 µm²)으로 줄어 ≈ 360으로 뜁니다. 그래서 갈바닉 언더컷은 끊긴 직후 급히 빨라졌다가, 깊이 파일수록 좁은 틈(높이 = Ti 두께)의 액 저항 · 공급 제한 때문에 점점 느려지는 경향이 있습니다(틈 부식과 같은 원리 — 위젯의 상한 10은 개념 값). 덜 귀한 접착층이 드러나는 순간 옆 식각이 급히 빨라진다는 금속 식각의 일반 관찰(금 식각 리뷰)과 같은 이야기이고, 06장 위젯이 가속을 '다 지운 뒤에만' 붙이는 까닭입니다 → <a data-go="ti.hf">06장</a>.</li>
      <li><b>HF 속 받는 반응</b> — 산화제가 없는 HF 속에서 받는 반응은 주로 수소 발생(H⁺ + e⁻ → ½H₂)과 용존 산소 환원입니다. 금속별 수소 발생 교환 전류 자료에서 Cu는 Ti보다 작지 않아, 넓은 범프 겉면이 받는 쪽 역할을 충분히 합니다. 겉 금속마다 다르기도 해서(보통 Ni는 Cu보다 크고 Sn은 작은 편 — 자료마다 다름), 겉이 Cu · Ni · SnAg인 베이스 다이와 Ni · SnAg뿐인 코어 다이는 k도 다를 수 있습니다. 위젯 기본 k 0.04는 이 자료에서 나온 값이 아니라 06장의 옆 가속 4와 맞춘 <i>보수적인 예시</i>입니다. 교환 전류만 보면 k ≈ 1에 가까울 수도 있고, 그러면 반응 지배에서도 이론 ×19 → 좁은 틈 상한 ×10입니다. 실제 배수는 같은 액에서 블랭킷 Ti 속도와 범프 밑동 언더컷을 재어 거꾸로 구합니다.</li>
      <li><b>표준 전위</b> (25 °C, V): Ag⁺/Ag +0.80, Cu²⁺/Cu +0.34, Sn²⁺/Sn −0.14, Ni²⁺/Ni −0.26, Ti²⁺/Ti −1.63. Ti²⁺는 물속에서 안정한 이온이 아니어서 순서 참고용이고, 불소 액에서 의미 있는 짝은 TiF₆²⁻/Ti(약 −1.19 V)입니다. 실제 액 속 순서(갈바닉 계열)는 산화막 · 착화제 · pH가 정하므로 액마다 따로 잽니다. Ni는 산화막 상태 · 액에 따라 녹는 쪽도 받는 쪽도 될 수 있습니다(조성 의존이 큼).</li>
      <li><b>치환 석출 · 같은 금속끼리도</b> — 덜 귀한 금속이 녹는 자리에 액 속 Cu²⁺가 Cu로 붙습니다(Cu²⁺ + Sn → Cu + Sn²⁺, HF 속 맨몸 Ti 위의 Cu). Cu 식각과 Ti 식각 사이 헹굼이 이것을 막고, 늙은 Cu 식각액(산화제 부족)에서 솔더 변색이 느는 까닭이기도 합니다. 반도체용 HF가 Cu 오염을 엄격히 관리하는 것도 Cu가 표면에 석출하기 때문입니다(공개 특허: Cu를 섞은 묽은 HF에서 Ti 덮인 웨이퍼가 표면에 Cu를 모음). 솔더 속 Ag₃Sn(→ <a href="#go-plating-10">전해도금 10장</a>)은 Sn보다 귀해 미세한 전지를 만듭니다. 같은 Cu라도 결정 크기 · 불순물 · 응력이 다르면 전위가 조금 달라 미세 갈바닉이 생깁니다(도금 Cu vs 스퍼터 Cu, 계면 · 결정 경계 → <a data-go="under.pillar">04장</a>).</li>
      <li><b>두 다이의 짝</b> (예시 기하) — 베이스 다이(Cu 기둥 12 · Ni 3 · 상부 Cu 3 · SnAg 12 µm): 받는 쪽 ≈ 2,850 µm² → Ti가 끊긴 뒤 R ≈ 360 → k 0.04 · 반응 지배면 ×3.9. 코어 다이(Ni 5 · SnAg 12 µm): π·25·17 + π·12.5² ≈ 1,830 µm² → 이어짐 ≈ 0.7, 끊긴 뒤 ≈ 230 → 같은 k면 ×3.2(예시 Ti 언더컷 약 0.23 µm vs 0.25 µm). Cu 식각액에서는 짝이 더 다릅니다. 베이스 다이의 상부 Cu 띠는 그 자체로 녹는 Cu인 데다 위아래로 Ni · SnAg와 맞닿아, 옆으로 조금만 파여도 3 µm 띠에 홈(노치)이 됩니다. 코어 다이는 범프에 Cu가 없고 SnAg가 Ni에 바로 닿으며(베이스 다이는 상부 Cu에), Ni 발이 Cu 시드에 바로 서 있어 Ni 발 밑 시드 언더컷이 Ni–Cu 짝이 맞닿은 좁은 틈이 됩니다(<a data-go="under.core">04장</a>). 어느 쪽이 녹는 쪽이 될지는 표준 전위가 아니라 그 액 속 실제 전위가 정하므로, 두 다이를 따로 단면으로 잽니다.</li>
      <li><b>줄이는 법</b> (공개 자료 · 특허 수준) — 과식각 줄이기(특히 HF), 억제제로 두 금속의 전위 차를 좁히기, 킬레이트 · pH 창, 산화제 · 용존 산소 줄이기, 단계 사이 헹굼(치환 석출 막기), 액 나이 관리, 층 순서 · 재료 바꾸기. 과산화수소계 Ti(W) 식각에서 Cu 가까운 곳이 빨리 녹는 것은 엄밀히는 전지보다 Cu가 과산화수소 분해를 돕는 촉매 효과로 보고되었습니다.</li>
      <li><b>얼마나 멀리</b> — 갈바닉 전류가 영향을 주는 거리는 액 전도도가 높을수록 깁니다. 범프 사이 간격(이 장의 예 30 µm)이 이 거리보다 짧으면 이웃 범프까지 함께 영향을 받습니다. 반대로 물이 거의 없는 스트리퍼처럼 전도도가 낮은 액에서는 공격이 두 금속이 맞닿은 선 바로 옆에 좁게 몰립니다(→ <a href="#go-strip-07">PR 스트립 07장</a>).</li></ul>`);
  },
  css: `.pl-svg .et05-cath{fill:none;stroke:#38bdf8;stroke-width:6;opacity:.45;stroke-linejoin:round}
.pl-svg .et05-cath2{fill:none;stroke:#38bdf8;stroke-width:4;opacity:.6}
.pl-svg .et05-ring{fill:none;stroke:#f59e0b;stroke-width:5}
.pl-svg .et05-mol circle{stroke-width:1.4}
.pl-svg .et05-mol text{font-size:13px;font-weight:900;stroke:none;paint-order:normal;fill:#0b1222}
.pl-svg .et05-mol.mion circle{fill:#8d96ab;stroke:#e2e8f0}
.pl-svg .et05-pv{font-size:21px;font-weight:800;fill:#c4b5fd}
.pl-svg .et05-pvd{fill:#a78bfa}
.pl-svg .et05-capl{fill:none;stroke:#f87171;stroke-width:2;stroke-dasharray:3 5}
.pl-svg .et05-guide{fill:none;stroke:#f59e0b;stroke-width:1.4;stroke-dasharray:3 4;opacity:.8}
.pl-svg .et05-th{fill:rgba(245,158,11,.12);stroke:#fbbf24;stroke-width:2;stroke-dasharray:4 3}
.pl-svg .et05-big{font-size:40px;font-weight:900;fill:#fbbf24}
.pl-svg .et05-num{fill:#fbbf24;stroke:#fef3c7;stroke-width:1.5}
.pl-svg .et05-numt{font-size:20px;font-weight:900;fill:#1b1203;stroke:none;paint-order:normal;text-anchor:middle}
.pl-svg .et05-magbg{fill:#070d18}
.pl-svg .et05-zl{font-size:19px;font-weight:800;fill:#0b1222 !important;stroke:none !important}
.pl-svg .et05-mag{fill:none;stroke:#e2e8f0;stroke-width:3}
.pl-svg .et05-magl{fill:none;stroke:#e2e8f0;stroke-width:1.6;stroke-dasharray:5 4;opacity:.8}
.pl-svg .et05-magc{fill:none;stroke:#e2e8f0;stroke-width:2}
.pl-svg .et05-groove{fill:#0c2530;stroke:#5eead4;stroke-width:1.2;stroke-linejoin:round}
.pl-svg .et05-stain{fill:#4b3a2a;stroke:#8a6a48;stroke-width:1}`
});
})();
