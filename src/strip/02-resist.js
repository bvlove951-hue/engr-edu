/* PR 스트립 02 — PR의 정체: 녹는 PR과 조각나는 PR은 왜 다를까 (분자 · 막 · nm~µm) */
(function(){
// 왼쪽 단면 — plans/shared.md (a)의 기준 범프를 실제 비율(1 µm = 10 px)로: PR 35 µm, Cu 15 + Ni 3 + SnAg 12 µm, 지름 25 µm, 틈 30 µm
const S = 10, YB = 990, YPR = YB - 35 * S;                           // 시드 윗면 990, PR 윗면 640
const YCU = YB - 15 * S, YNI = YCU - 3 * S, YSN = YNI - 12 * S;       // 840 · 810 · 690
const GX0 = 200, GX1 = 500, GXC = 350;                               // 범프 사이 틈 (30 µm = 300 px)
const BUMPS = [[GX0 - 250, GX0], [GX1, GX1 + 250]];                  // 왼쪽 · 오른쪽 범프 (단면 밖은 잘림)
const LX0 = 40, LX1 = 700;
// 오른쪽 위 확대 창 (사슬 그림)
const ZX0 = 784, ZX1 = 1516, ZY0 = 270, ZY1 = 626, ZCY = 448, NCH = 12, NPT = 10, ZSEED = 656;
// 개념 모델 상수 (모두 가정값 — K.model 에 밝힘)
const XG = 0.1, NU = 0.4, GF = (1 + NU) / (2 * (1 - NU)), R0 = 3.4;  // 겔점, 푸아송 비, G 계수 ≈ 1.17, 03장 모델의 70 °C · 순환 녹는 속도 (µm/분)
const GAM = {lo: 2, mid: 5, hi: 15};                                 // 붙잡는 에너지 Γ (J/m²)
const TYPE = {pos: '포지티브', ca: '화학증폭 포지티브', neg: '네거티브'};
// 손대지 않았을 때 단계마다 보여 줄 예시 [종류, 열 이력 °C, 두께 µm, 밀착, 스트리퍼]
const DEMO = {chain: ['pos', 110, 35, 'mid', 'lift'], pos: ['pos', 110, 35, 'mid', 'lift'], neg: ['neg', 110, 35, 'mid', 'lift'], lift: ['neg', 110, 35, 'mid', 'lift'], history: ['pos', 190, 35, 'mid', 'lift']};
const MODE = {
  dis: {nm: '녹음', c: 'st02-m0', k: 'ok'},
  slow: {nm: '느리게 녹음', c: 'st02-m1', k: 'warn'},
  sdis: {nm: '느리게 녹음 (용해형)', c: 'st02-m1', k: 'warn'},
  lift: {nm: '들떠 조각', c: 'st02-m2', k: 'warn'},
  stay: {nm: '부풀기만 · 남음', c: 'st02-m3', k: 'ng'}
};
// 좁은 세로 화면 전용 확대: 분자 확대 창 · 왼쪽 단면
const VN_Z = {x: 730, y: 130, w: 840, h: 640}, VN_L = {x: 30, y: 400, w: 690, h: 710};   // VN_L: 틈 PR · 범프 · 바닥만 (위쪽 설명 줄은 카드에 있음) → 좁은 화면에서 더 크게
const clamp01 = v => Math.max(0, Math.min(1, v));
// 개념 모델: 가교 지표 x → 녹음 / 그물(G vs Γ) / 용해형
// 과하게 구운 포지티브 · 화학증폭(열로 겔점을 넘음): 같은 굽기가 바닥 밀착도 올린다고 둔다 Γ × (1 + x/0.1) (가정) → 보통 주름만 지며 남고, 밀착이 약하거나 막이 두꺼울 때만 들뜬다
function model(s){
  const T = s.bake, h = s.h;
  const x = s.type === 'pos' ? clamp01((T - 150) / 100) * 0.6 : s.type === 'ca' ? clamp01((T - 160) / 100) * 0.4 : 0.6 + clamp01((T - 100) / 100) * 0.4;
  const hb = s.type !== 'neg' && x >= XG;
  const r = {x, hb, gam0: GAM[s.adh], gam: hb ? Math.round(GAM[s.adh] * (1 + x / XG)) : GAM[s.adh], net: x >= XG, G: null, t: null, frag: null, chem: s.chem};
  if (r.net){ r.eps = 0.15 * Math.pow(XG / x, 0.6); r.E = 10 * x / XG; r.G = GF * r.E * 1e6 * r.eps * r.eps * h * 1e-6; }
  if (s.chem === 'dis'){
    r.sl = 1 / (1 + 2 * x); r.t = h / (R0 * r.sl); r.mode = r.net ? 'sdis' : 'dis';
  } else if (!r.net){
    r.sl = Math.pow(1 - x / XG, 2); r.t = r.sl > 1e-3 ? h / (R0 * r.sl) : Infinity; r.mode = r.sl < 0.4 ? 'slow' : 'dis';
  } else if (r.G > r.gam){
    r.mode = 'lift'; r.t = 5 * Math.pow(h / 30, 4 / 3) + 2; r.frag = 4 * h;
  } else r.mode = 'stay';
  return r;
}
const fmtT = t => t == null ? '끝나지 않음' : !isFinite(t) || t > 240 ? '4시간 넘음' : t >= 60 ? `약 ${Math.round(t)}분 (${(t / 60).toFixed(1)}시간)` : `약 ${Math.max(1, Math.round(t))}분`;
// 매끈한 곡선 (점을 지나는 캣멀-롬 → 3차 베지어)
const f1 = v => v.toFixed(1);
function smooth(pts){
  let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++){
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return d;
}
// 사슬 12가닥 (결정적) · 가교 자리 24곳
function chains(K){
  const r = K.rng(7), out = [];
  for (let i = 0; i < NCH; i++){
    const y0 = ZY0 + i * (ZY1 - ZY0) / (NCH - 1), ph = r() * 6.28, pts = [];
    let dr = 0;
    for (let j = 0; j < NPT; j++){
      const x = ZX0 + j * (ZX1 - ZX0) / (NPT - 1) + (j && j < NPT - 1 ? (r() - 0.5) * 34 : (r() - 0.5) * 16);
      dr = Math.max(-16, Math.min(16, dr + (r() - 0.5) * 16));
      pts.push([x, Math.max(ZY0 - 14, Math.min(ZY1 + 14, y0 + Math.sin(ph + j * 1.25) * 10 + dr))]);
    }
    out.push(pts);
  }
  return out;
}
// 비스듬히 가로지르는 사슬 몇 가닥 (엉킨 느낌)
function crossers(K){
  const r = K.rng(19);
  return [[830, 300, 1010, 610], [1090, 286, 1250, 612], [1370, 292, 1210, 606], [1490, 300, 1400, 616]].map(([x0, y0, x1, y1]) => {
    const pts = [];
    for (let k = 0; k <= 6; k++){ const t = k / 6, nx = -(y1 - y0), ny = x1 - x0, nl = Math.hypot(nx, ny), w = Math.sin(t * 9 + r() * 2) * 14; pts.push([x0 + (x1 - x0) * t + nx / nl * w, y0 + (y1 - y0) * t + ny / nl * w]); }
    return pts;
  });
}
function links(K){
  const r = K.rng(11), seen = new Set(), out = [];
  while (out.length < 24){
    const i = Math.floor(r() * (NCH - 1)), j = 1 + Math.floor(r() * (NPT - 2)), k = i + ',' + j;
    if (seen.has(k)) continue;
    seen.add(k); out.push([i, j]);
  }
  return out;
}
// 중심을 명시한 크기 애니메이션 (SVG scale 은 원점 기준이라 겹친 transform 으로 중심을 옮긴다)
const swell = (inner, cx, cy, vals, dur) => `<g transform="translate(${cx},${cy})"><g><animateTransform attributeName="transform" type="scale" values="${vals}" dur="${dur}s" repeatCount="indefinite"/><g transform="translate(${-cx},${-cy})">${inner}</g></g></g>`;
// 틈 PR 윗면 모양: 가운데가 amp 만큼 솟고, wav 만큼 주름, dy 만큼 통째로 들림
function prPath(amp, wav, dy){
  let d = `M${GX0},${YB + dy}`;
  for (let x = GX0; x <= GX1; x += 10){
    const u = (x - GXC) / (GX1 - GX0) * 2;
    d += ` L${x},${f1(YPR + dy - amp * (1 - u * u) + wav * Math.sin((x - GX0) / 8))}`;
  }
  return d + ` L${GX1},${YB + dy} Z`;
}
function prTop(amp, wav, dy){
  let d = '';
  for (let x = GX0; x <= GX1; x += 5){
    const u = (x - GXC) / (GX1 - GX0) * 2;
    d += `${d ? ' L' : 'M'}${x},${f1(YPR + dy - amp * (1 - u * u) + wav * Math.sin((x - GX0) / 8))}`;
  }
  return d;
}
const LEFTCAP = {
  chain: ['PR 막 = 긴 사슬(수지)이 엉킨 고분자', '용제가 사슬 사이로 스며든다 → 오른쪽 분자 확대'],
  pos: ['포지티브 PR — 위에서부터 얇아진다', '겉의 끈적한 겔층에서 사슬이 한 가닥씩 풀려 나간다'],
  neg: ['가교 PR — 용제를 먹고 부풀 뿐, 풀리지 않는다', '옆은 범프, 아래는 바닥에 막혀 위로 부푼다'],
  lift: ['쌓인 에너지 > 붙잡는 에너지 → 들떠 조각', '용해형 약품이면 조각 대신 천천히 녹는다 (위젯)']
};
// 열 · 액 이력 목록 [이름, 온도 · 시간, 효과, 효과 색(0 작음 · 1 조건에 따라 · 2 큼), 온도계 높이]
const HIST = [
  ['① 굽기 (코팅 뒤 · 노광 뒤)', '보통 100 °C 안팎 (예시)', '너무 뜨겁게 · 오래 → 사슬이 묶이기 시작 (포지티브도)', 2, 0.6],
  ['② 디스컴 (O₂ 플라즈마)', '짧게 · 겉면만', '겉이 조금 변함 — 얇은 겉층', 1, 0.35],
  ['③ Cu 도금', '보통 실온 근처', '영향 작음', 0, 0.2],
  ['④ Ni 도금', '따뜻한 액 (보통 수십 °C)', '(조건에 따라) 더 안 벗겨질 수 있음', 1, 0.42],
  ['⑤ SnAg 도금', '보통 실온 근처', '③~⑤를 합치면 액에 수십 분 담김 — 영향은 조건에 따라', 1, 0.2],
  ['⑥ 대기 (도금 → 스트립)', '실온 · 기다린 시간', '마르고 굳음 — 오래 두면 (조건에 따라) 더 안 벗겨짐', 1, 0.12]
];

(window.EngrStripChapters = window.EngrStripChapters || []).push({
  no: '02', id: 'resist', part: 1, short: 'PR의 정체', scale: '분자 · 막 · nm~µm',
  title: 'PR의 정체 — 녹는 PR과 조각나는 PR은 왜 다를까?',
  hook: '녹느냐, 부풀어 떨어지느냐',
  one: 'PR은 아주 긴 사슬 분자(고분자)가 엉킨 막입니다. 사슬끼리 묶여 있지 않으면 용제가 사슬을 한 가닥씩 풀어 녹입니다. 사슬끼리 그물처럼 묶여(가교) 있으면 그대로는 녹지 못하고 부풀기만 합니다. 그러면 바닥에서 들떠 조각으로 떨어지거나, 알칼리가 그물을 잘라 주면 천천히 녹습니다.',
  ana: '<b>삶은 국수 더미 vs 그물</b> — 묶이지 않은 국수 더미는 물을 부어 저으면 한 가닥씩 풀려 흩어지지만, 매듭으로 묶인 그물은 물을 먹어 불어날 뿐 풀리지 않고 통째로 들립니다. <i>(한계: 실제 사슬은 nm 크기이고, \'녹는다\'는 사슬이 풀려 액으로 퍼지는 것이지 사슬이 잘게 분해되는 것이 아닙니다. 다만 알칼리가 든 스트리퍼는 그물의 매듭 일부를 화학적으로 끊기도 합니다.)</i>',
  steps: [
    {id: 'chain', t: '고분자 — 긴 사슬이 엉킨 막', d: 'PR의 몸통은 수지(아주 긴 사슬 분자)입니다. 용제 분자가 사슬 사이로 들어가 틈을 벌리면 사슬이 움직일 수 있게 됩니다. 사슬끼리 묶여 있는지가 녹는 방식을 정합니다.', viewN: VN_Z},
    {id: 'pos', t: '포지티브 PR — 풀려서 녹는다', d: '범프용 두꺼운 포지티브 PR(노볼락 수지 + 감광제 DNQ, 또는 화학증폭형)은 사슬끼리 묶여 있지 않습니다. 용제가 스며 겉에 끈적한 겔층이 생기고, 사슬이 한 가닥씩 풀려 나가 막이 위에서부터 얇아집니다.', viewN: VN_L},
    {id: 'neg', t: '네거티브 · 가교 PR — 그물은 그대로는 녹지 않는다', d: '네거티브 PR은 노광 · 굽기 때 사슬 사이에 다리(가교)가 놓여 그물이 됩니다. 그물은 용제를 먹어 부풀 뿐 풀려 나가지 못합니다. 그래서 알칼리로 그물을 잘라 녹이거나, 부풀려 바닥에서 떼어 냅니다.', viewN: VN_Z},
    {id: 'lift', t: '부풀어 들뜨고 조각난다', d: '부푼 그물은 바닥(시드)에 붙어 옆으로 못 늘어나므로, 눌리는 힘(압축)과 함께 에너지가 쌓입니다. 이 에너지가 붙잡는 에너지(밀착)보다 크면 위로 휘며 들뜨고, 금이 가 조각으로 떨어집니다. 그물을 잘라 녹이는 약품(용해형)에서는 조각 대신 천천히 녹기도 합니다.', viewN: VN_L},
    {id: 'history', t: '굽기와 도금이 바꾸는 것', d: '포지티브 PR도 너무 뜨겁게 오래 구우면 사슬이 묶이기 시작해 잘 안 녹습니다. 도금액에 오래 담긴 PR은 조건에 따라 더 안 벗겨질 수 있다고 알려져 있습니다. 도금 중 들떠 금속이 밑으로 번진 자리(치마)는 PR을 붙잡고, PR 위로 넘친 버섯 머리는 그 아래 PR을 액에서 가립니다.', viewN: VN_Z}
  ],
  icon(K){
    const {PL, L, C} = K;
    let s = '';
    [12, 27, 42].forEach(y => { s += PL([[4, y], [14, y - 5], [24, y + 4], [34, y - 4], [44, y + 4], [60, y - 2]], 's-curve'); });
    s += L(24, 16, 24, 31, 's-acc2') + C(24, 23.5, 4, 'k-acc2') + L(44, 31, 44, 46, 's-acc2') + C(44, 38.5, 4, 'k-acc2');
    return s;
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, W} = K;
    let s = '';
    // ── 왼쪽 단면 (x 40~700에서 자른다)
    s += `<clipPath id="${K.id('st02-clipL')}"><rect x="${LX0}" y="140" width="${LX1 - LX0}" height="930"/></clipPath>`;
    let a = R(LX0, 140, LX1 - LX0, YB - 140, 'f-strip', tip('스트리퍼 액 — PR을 없애는 약품 (보통 60~80 °C로 데워 씀)'));
    BUMPS.forEach(([x0, x1]) => {
      a += G(R(x0, YCU, x1 - x0, YB - YCU, 'f-cu2') + R(x0, YNI, x1 - x0, YCU - YNI, 'f-ni') + R(x0, YSN, x1 - x0, YNI - YSN, 'f-sn2'),
        tip('범프 — Cu 15 + Ni 3 + SnAg 12 µm (예시 · 리플로우 전 원기둥, 지름 25 µm)\n스트립 동안 지켜야 할 금속'));
    });
    a += `<g data-v="pr"></g>`;
    let sv = '';
    const rs = K.rng(41);
    for (let k = 0; k < 12; k++){ const x = GX0 + 20 + rs() * 260; sv += K.mover(x, 300 + rs() * 120, x + (rs() - 0.5) * 30, YPR + 30 + rs() * 260, 5, 'st02-sol', 4 + rs() * 3, rs() * 6); }
    a += G(sv, only('chain'));
    a += R(LX0, YB, LX1 - LX0, 8, 'f-seed2', tip('Cu 시드 300 nm (예시) — 실제 수백 nm, 그림은 과장\n스트립 동안 지켜야 할 바닥'));
    a += R(LX0, YB + 8, LX1 - LX0, 6, 'f-ti', tip('Ti 100 nm (예시, 접착 · 방벽층) — Cu 시드 아래. 그림은 과장'));
    a += R(LX0, YB + 14, LX1 - LX0, 12, 'f-pas', tip('보호막(패시베이션) — 스트립 동안은 시드가 덮고 있어 액에 닿지 않는다'));
    a += R(LX0, YB + 14, 130, 12, 'f-al', tip('패드 — 범프 아래 보호막이 열린 자리')) + R(530, YB + 14, 170, 12, 'f-al', tip('패드 — 범프 아래 보호막이 열린 자리'));
    a += R(LX0, YB + 26, LX1 - LX0, 44, 'f-si', tip('실리콘 웨이퍼'));
    // history: 밑동 치마 + 버섯 머리 (+ 그 아래 가려진 PR)
    let hx = P(`M${GX0},${YB} L${GX0 + 50},${YB} L${GX0},${YB - 13} Z`, 'f-cu2', tip('치마 — 도금 중 PR 바닥이 들뜬 틈으로 금속이 얇게 번진 자리 (그림은 과장)\nPR 가장자리를 붙잡아 잘 안 벗겨진다'));
    hx += P(`M${GX1 - 38},${YPR - 6} L${GX1},${YPR - 6} L${GX1},${YPR + 46} L${GX1 - 38},${YPR + 10} Z`, 'st02-shadow', tip('버섯 머리 아래 PR — 액이 늦게 닿는다'));
    hx += P(`M${GX1},${YNI} L${GX1},${YPR} L${GX1 - 36},${YPR} Q${GX1 - 44},${YPR - 30} ${GX1 + 10},${YPR - 44} Q${GX1 + 140},${YPR - 62} ${LX1 + 20},${YPR - 58} L${LX1 + 20},${YNI} Z`, 'f-sn2', tip('버섯 머리 — SnAg가 PR 위로 넘쳐 옆으로 퍼진 모양\n그 아래 PR을 액에서 가린다'));
    a += G(hx, only('history'));
    s += G(a, {'clip-path': K.url('st02-clipL')});
    // 층 이름 (단면 위)
    s += LB(T(120, YSN + 68, 'SnAg 12 µm', 'st02-ml') + T(120, YNI + 22, 'Ni 3 µm', 'st02-ml') + T(120, YCU + 84, 'Cu 15 µm', 'st02-ml'));
    s += LB(T(600, YSN + 68, 'SnAg', 'st02-ml') + T(600, YNI + 22, 'Ni', 'st02-ml') + T(600, YCU + 84, 'Cu', 'st02-ml'), {'data-off': 'history'});
    s += LB(T(LX0 + 4, YB + 100, '바닥: 시드 Ti(100 nm) 위 Cu 300 nm · 보호막 · Si — 얇은 층은 과장', 't-dim', 'start'));
    s += LB(T(LX1 - 8, 266, '스트리퍼 액 (보통 60~80 °C)', 't-dim', 'end'), {'data-off': 'history'});
    // 단계마다 위쪽 설명
    Object.keys(LEFTCAP).forEach(k => { s += G(LB(T(LX0 + 16, 176, LEFTCAP[k][0], 't-acc', 'start') + T(LX0 + 16, 208, LEFTCAP[k][1], 't-sub', 'start')), only(k)); });
    s += G(LB(T(LX0 + 16, 176, '이력이 남긴 것 — 굳은 PR · 치마 · 버섯 머리', 't-acc', 'start') +
      T(LX0 + 16, 208, '① 치마: 금속이 PR 밑으로 번져 PR을 붙잡음', 't-sub', 'start') +
      T(LX0 + 16, 238, '② 버섯 머리: 그 아래 PR에 액이 늦게 닿음', 't-sub', 'start') +
      T(LX0 + 16, 268, '→ 둘 다 스트립 뒤 밑동 잔여의 단골 원인', 't-dim', 'start')), only('history'));
    // history 번호 표시
    const mk = (x, y, n, px, py) => L(x, y, px, py, 's-lead') + C(x, y, 15, 'st02-mk') + T(x, y + 7, n, 'st02-mkt');
    s += G(mk(170, 962, '1', GX0 + 6, YB - 4) + mk(560, 566, '2', GX1 - 18, YPR - 22), only('history'));
    // chain: 치수
    s += G(LB(L(GX0 + 4, YPR - 18, GX1 - 4, YPR - 18, 's-acc2') + L(GX0 + 4, YPR - 28, GX0 + 4, YPR - 8, 's-acc2') + L(GX1 - 4, YPR - 28, GX1 - 4, YPR - 8, 's-acc2') + T(GXC, YPR - 28, '틈 30 µm', 't-warn') +
      L(GX0 + 18, YPR + 4, GX0 + 18, YB - 4, 's-acc2') + L(GX0 + 8, YPR + 4, GX0 + 28, YPR + 4, 's-acc2') + L(GX0 + 8, YB - 4, GX0 + 28, YB - 4, 's-acc2') + T(GXC + 14, 830, 'PR 35 µm (예시)', 't-warn')), only('chain'));
    // 확대 표시 (단면의 이 자리를 오른쪽에서 크게)
    const zc = (y) => R(GXC - 20, y, 40, 40, 'st02-zsq') + P(`M${GXC + 20},${y} L742,224 M${GXC + 20},${y + 40} L742,720`, 'st02-zl');
    s += G(zc(700), only('chain neg')) + G(zc(944), only('lift'));

    // ── 오른쪽 위: 분자 확대 창
    s += R(740, 140, 820, 620, 'pl-panel', {rx: 14});
    s += G(LB(T(764, 176, '분자 확대 — PR 속 사슬 (그림 · 실제는 nm)', 't-acc', 'start')), {'data-off': 'history'});
    s += `<g data-v="znote"></g>`;
    s += `<clipPath id="${K.id('st02-zclip')}"><rect x="742" y="222" width="816" height="500"/></clipPath>`;
    s += G(`<g data-v="zoom"></g>`, {'clip-path': K.url('st02-zclip'), 'data-off': 'history'});
    s += G(L(766, 744, 806, 744, 'st02-chain') + C(966, 744, 6, 'st02-sol') + L(1118, 734, 1118, 754, 'st02-xl') + C(1118, 744, 6, 'k-acc2') +
      LB(T(816, 751, '사슬 (수지)', 't-dim', 'start') + T(980, 751, '용제 분자', 't-dim', 'start') + T(1132, 751, '가교 (다리)', 't-dim', 'start')), {'data-off': 'history'});
    // history: 열 · 액 이력 목록
    let hl = LB(T(764, 176, '열 · 액 이력 — PR이 지나온 길 (예시)', 't-acc', 'start') + T(764, 206, '뜨거울수록 · 오래 담길수록 잘 안 벗겨질 수 있다 (조건에 따라)', 't-dim', 'start'));
    HIST.forEach(([nm, tc, ef, sev, lv], i) => {
      const y = 254 + i * 74;
      hl += G(R(772, y - 26, 14, 42, 'st02-thb', {rx: 7}) + R(775, y - 26 + 42 * (1 - lv), 8, 42 * lv, 'st02-thf') + C(779, y + 22, 10, 'st02-thf'), tip('온도 · 담긴 시간이 클수록 영향이 크다 (그림은 상대 크기)'));
      hl += LB(T(806, y, nm, 't-sub', 'start') + T(1540, y, tc, 't-dim', 'end') + T(806, y + 28, ef, 'st02-e' + sev, 'start'));
    });
    s += G(hl + `<g data-v="hx"></g>`, only('history'));

    // ── 오른쪽 아래: 결과 상자 (위젯이 그린다)
    s += R(740, 784, 820, 320, 'pl-box', {rx: 12});
    s += LB(T(760, 818, '결과 — 녹을까, 들뜰까 (위젯 · 개념 모델)', 't-acc', 'start'));
    s += `<g data-v="res"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 녹을까, 들뜰까</div>
      ${K.seg('type', [['pos', '포지티브 (노볼락 · DNQ)'], ['ca', '화학증폭 포지티브'], ['neg', '네거티브 (가교)']], 'pos', 'PR 종류')}
      ${K.ctl('bake', '열 이력 — 굽기 · 공정 중 최고 온도 (예시)', 90, 200, 5, 110)}${K.ctl('h', 'PR 두께', 20, 100, 5, 35)}
      ${K.seg('adh', [['lo', '약함'], ['mid', '보통'], ['hi', '강함']], 'mid', '바닥과 붙은 정도 (시드 표면 · 도금 이력)')}
      ${K.seg('chem', [['lift', '박리형 (용제 위주)'], ['dis', '용해형 (알칼리가 그물을 자름)']], 'lift', '스트리퍼')}
      ${K.kpis([['거동', 'k-mode', ''], ['가교 지표', 'k-x', '0 = 안 묶임 · 0.1(겔점) 넘으면 그물'], ['들뜨게 하는 / 붙잡는 에너지', 'k-g', 'G / Γ (J/m²)'], ['걸리는 시간 (→ 03장 모델)', 'k-t', '70 °C · 순환 예시']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('가교 지표(포지티브 150 °C · 화학증폭 160 °C부터 오름, 네거티브 0.6~1) · 겔점 0.1 · 부푸는 양 ε = 0.15·(0.1/x)^0.6 · 탄성률 E = 10 MPa·x/0.1 · 붙잡는 에너지 Γ 2 · 5 · 15 J/m²(포지티브 · 화학증폭이 굽기로 겔점을 넘으면 밀착도 올라 Γ × (1 + x/0.1)) · 용해형 느려짐 1/(1+2x) · 조각 ≈ 4 × 두께는 모두 경향을 보이려고 고른 가정값입니다. G = (1+ν)/(2(1−ν))·E·ε²·h(ν 0.4 → 약 1.17·E·ε²·h)는 바닥에 붙은 막의 들뜬 끝이 한 방향으로 나아갈 때의 정상 상태 식(박막 역학, Hutchinson & Suo)이고, 시간은 03장 모델(70 °C · 순환: 녹는 PR 3.4 µm/분, 부풀어 떨어지는 PR 5분 × (두께/30 µm)^(4/3) + 2분)입니다. 실제 PR · 스트리퍼 · 시드 표면마다 크게 다릅니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip} = K;
    const CH = chains(K), XL = links(K), CX = crossers(K);
    const st = {type: 'pos', bake: 110, h: 35, adh: 'mid', chem: 'lift'};
    let touched = false;
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const diss = m => m.mode === 'dis' || m.mode === 'slow' || m.mode === 'sdis';
    const animS = m => Math.max(5, Math.min(24, (isFinite(m.t) && m.t ? m.t : 40) * 0.8));   // 장면 속 녹는 애니메이션 길이 (초) — 오래 걸릴수록 느리게

    // ── 왼쪽 틈 PR: 거동에 따라 다시 그린다
    function prG(m, sid){
      const body = m.net ? 'f-prx' : 'f-pr';
      const tp = tip(m.net ? `가교된 PR (그물) — 가교 지표 ${m.x.toFixed(2)}\n그대로는 녹지 않고 용제를 먹어 부푼다` : 'PR (묶이지 않은 사슬) — 용제가 사슬을 풀어 녹인다\n틈 30 µm · PR 35 µm (예시, 실제 비율)');
      if (sid === 'chain') return P(prPath(0, 0, 0), body, tp);
      if (diss(m)){
        // 윗면이 위에서부터 내려간다 + 그 위 겔층 띠 + 풀려 나간 사슬 조각이 액으로
        const dur = animS(m), gh = m.mode === 'dis' ? 16 : 32, kt = 'keyTimes="0;.86;1"', an = `dur="${f1(dur)}s" repeatCount="indefinite"`;
        let g = `<rect x="${GX0}" width="${GX1 - GX0}" class="${body}"${K.at(tp)}><animate attributeName="y" values="${YPR + gh};${YB};${YB}" ${kt} ${an}/><animate attributeName="height" values="${YB - YPR - gh};0;0" ${kt} ${an}/></rect>`;
        g += `<rect x="${GX0}" width="${GX1 - GX0}" height="${gh}" class="st02-gel"${K.at(tip('겔층 — 용제를 먹어 끈적해진 겉층. 사슬은 여기서 풀려 액으로 나간다'))}><animate attributeName="y" values="${YPR};${YB - gh};${YB - gh}" ${kt} ${an}/><animate attributeName="opacity" values="1;1;0" ${kt} ${an}/></rect>`;
        const r = K.rng(21), n = m.mode === 'dis' ? 9 : 5;
        for (let k = 0; k < n; k++){ const x = GX0 + 30 + r() * 240; g += K.mover(x, YPR - 20, x + (r() - 0.5) * 120, 330, 4, 'st02-bit', 3 + r() * 2 + (m.mode === 'dis' ? 0 : 2), r() * 5); }
        const lab = m.mode === 'dis' ? '겔층 ↓ 위에서부터 얇아짐' : m.mode === 'slow' ? '두꺼운 겔 — 아주 천천히 얇아짐' : '용해형 — 그물을 잘라 천천히 녹임';
        return g + LB(T(GXC, YPR - 40, lab, 't-warn'));
      }
      if (sid === 'neg'){
        // 부풀기 (들뜨기 전) — 바닥 (350, 990)을 기준으로 위로만
        let g = swell(P(prPath(30, 0, 0), body, tp) + P(prPath(30, 0, 0), 'st02-swo'), GXC, YB, '1 1;1 1.08;1 1', 6);
        g += K.arrow(GX0 + 40, YPR - 34, GX0 + 40, YPR - 74, 's-arr3') + K.arrow(GX1 - 40, YPR - 34, GX1 - 40, YPR - 74, 's-arr3');
        const r = K.rng(33);
        for (let k = 0; k < 6; k++){ const x = GX0 + 40 + r() * 220; g += K.mover(x, 470, x + (r() - 0.5) * 40, 700 + r() * 220, 5, 'st02-sol', 3.5 + r() * 2, r() * 4); }
        return g + LB(T(GXC, YPR - 100, '용제를 먹고 위로 부푼다', 't-warn'));
      }
      if (m.mode === 'lift'){
        // 들뜸: 틈의 PR이 통째로 바닥에서 떨어져(빨간 틈) 금이 간 채 위로 떠나간다.
        // 단면에는 이 한 토막만 보이지만 실제 조각은 범프 자리가 뚫린 판(약 4 × 두께, 가정)이다
        const dur = Math.max(6, Math.min(10, m.t * 0.6)), rep = `dur="${f1(dur)}s" repeatCount="indefinite"`;
        const tpl = tip(`들뜬 PR — 단면에는 이 한 토막만 보이지만, 실제로는 범프 자리가 뚫린 판(약 ${Math.round(m.frag)} µm, 4 × 두께 가정)째 들린다\n박리형 약품에서는 거의 녹지 않는다`);
        let blk = P(prPath(34, 0, 0), body, tpl) + P(prPath(34, 0, 0), 'st02-swo');
        blk += P(`M${GX0 + 96},${YPR - 30} L${GX0 + 108},${YPR + 50} L${GX0 + 94},${YPR + 120} L${GX0 + 106},${YPR + 190}`, 'pl-crack') + P(`M${GX0 + 214},${YPR - 26} L${GX0 + 202},${YPR + 70} L${GX0 + 216},${YPR + 150}`, 'pl-crack');
        let g = `<g><animateTransform attributeName="transform" type="translate" values="0,0;0,-12;0,-12;0,-360" keyTimes="0;.15;.5;1" ${rep}/><animate attributeName="opacity" values="1;1;1;0" keyTimes="0;.5;.8;1" ${rep}/>${blk}</g>`;
        g += L(GX0 + 4, YB - 5, GX1 - 4, YB - 5, 'st02-gap', tip('들뜬 틈 — 쌓인 에너지 G가 붙잡는 에너지 Γ보다 커서 바닥과 떨어졌다'));
        g += K.arrow(GX0 + 34, YB - 16, GX0 + 34, YB - 96, 's-arrr') + K.arrow(GX1 - 34, YB - 16, GX1 - 34, YB - 96, 's-arrr');
        return g + LB(T(GXC, YB - 76, '바닥에서 들뜸', 't-warn') + T(GXC, 448, `판째 들려 떠나감 — 조각 약 ${Math.round(m.frag)} µm`, 't-warn'));
      }
      // 부풀기만 하고 남음: 주름진 윗면 + 잔여 위험
      let g = swell(P(prPath(22, 5, 0), body, tp) + P(prTop(22, 5, 0), 'st02-wrk'), GXC, YB, '1 1;1 1.03;1 1', 5);
      return g + LB(T(GXC, 800, '잔여 위험', 'st02-ng') + T(GXC, 832, '붙은 채 남음 (G ≤ Γ)', 'st02-wt'));
    }

    // ── 확대 창: 사슬 · 가교 · 용제
    function zoomG(m, sid){
      const live = sid !== 'chain', dz = diss(m) && live, nX = Math.round(24 * Math.min(1, m.x));
      let z = '', net = '', top = '';
      if (dz) z += R(752, 236, 796, m.mode === 'dis' ? 58 : 92, 'st02-gelz');
      CH.forEach((pts, i) => {
        const d = smooth(pts);
        if (dz && i < 3){
          const dur = Math.max(4, Math.min(14, animS(m) * 0.7)), rep = `dur="${f1(dur)}s" begin="-${f1(i * dur / 3)}s" repeatCount="indefinite"`;
          top += `<g><animateTransform attributeName="transform" type="translate" values="0,0;0,0;0,-140" keyTimes="0;.35;1" ${rep}/><animate attributeName="opacity" values="1;1;0" keyTimes="0;.35;1" ${rep}/>${P(d, 'st02-chain st02-lv')}</g>`;
        } else net += P(d, 'st02-chain');
      });
      CX.forEach(pts => { net += P(smooth(pts), 'st02-chain'); });
      XL.slice(0, nX).forEach(([i, j]) => {
        const a = CH[i][j], b = CH[i + 1][j], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        if (dz && m.mode !== 'sdis' && i <= 2) return;                 // 떠나가는 맨 위 사슬에 붙은 다리는 그리지 않는다
        if (m.mode === 'sdis' && live && i <= 2) net += L(a[0], a[1], b[0], b[1], 'st02-xlc') + P(`M${f1(mx - 8)},${f1(my - 8)} l16,16 M${f1(mx + 8)},${f1(my - 8)} l-16,16`, 'st02-cut');
        else net += L(a[0], a[1], b[0], b[1], 'st02-xl') + C(mx, my, 6, 'k-acc2');
      });
      const r = K.rng(3);
      let sol = '';
      for (let k = 0; k < 16; k++){ const x = 800 + r() * 700; sol += K.mover(x, 226, x + (r() - 0.5) * 50, 290 + r() * 330, 5, 'st02-sol', 4 + r() * 3, r() * 6); }
      if (m.net && !dz && live && sid !== 'lift') net = swell(net, 1150, ZCY, '1;1.1;1', 6);
      else if (m.net && !dz && sid === 'lift'){
        // 바닥에 붙은 막: 옆으로는 못 늘고 위로만 — 사슬 끝이 바닥에 매여 있다 (들뜨면 끊김)
        const up = m.mode === 'lift';
        let teth = '', anc = '';
        [1, 3, 5, 7, 8].forEach(j => {
          const p = CH[NCH - 1][j];
          teth += L(p[0], p[1], p[0], ZSEED - (up ? 10 : 0), up ? 'st02-tethx' : 'st02-teth');
          anc += C(p[0], ZSEED, 6, up ? 'st02-ancx' : 'st02-anc');
        });
        let g = swell(net + teth, 1150, ZSEED, '1 1;1 1.12;1 1', 6);
        if (up) g = `<g><animateTransform attributeName="transform" type="translate" values="0,0;0,-16;0,0" dur="6s" repeatCount="indefinite"/>${g}</g>`;
        net = R(760, ZSEED, 780, 14, 'f-seed2', tip('바닥 (시드) — 그림은 모식도')) + anc + g;
        net += K.arrow(752, 560, 800, 560, 's-arrr') + K.arrow(1548, 560, 1500, 560, 's-arrr');
      }
      return z + net + top + sol;
    }
    function znoteG(m, sid){
      if (sid === 'history') return '';
      const nX = Math.round(24 * Math.min(1, m.x));
      let t;
      if (sid === 'chain') t = '용제 분자(하늘 점)가 사슬 사이로 들어가 틈을 벌린다 — 사슬이 움직일 수 있게';
      else if (m.mode === 'dis') t = '겔층(끈적한 겉층)에서 맨 위 사슬부터 한 가닥씩 풀려 나간다';
      else if (m.mode === 'slow') t = '살짝 묶인 사슬 — 겔이 두껍고 끈적해 아주 천천히 풀린다';
      else if (m.mode === 'sdis') t = `알칼리가 다리(가교 ${nX}개)를 잘라(×) 맨 위부터 천천히 풀려 나간다`;
      else if (sid === 'lift') t = m.mode === 'lift' ? '바닥에 매여 옆으로 못 늘어남 → 압축 → 쌓인 에너지가 이겨 들뜬다' : '바닥에 매여 옆으로 못 늘어남 → 압축 · 붙잡는 에너지가 이겨 남는다';
      else t = `다리(가교 ${nX}개)로 묶인 그물 — 용제를 먹고 통째로 부푼다`;
      return LB(T(764, 206, t, 't-dim', 'start'));
    }
    // ── 결과 상자
    function resG(m){
      const md = MODE[m.mode];
      let s = LB(T(760, 864, '거동: ' + md.nm, 'st02-mode ' + md.c, 'start') + T(1540, 864, `가교 지표 ${m.x.toFixed(2)} (0.1 넘으면 그물)`, 't-sub', 'end'));
      const BX0 = 1040, BX1 = 1500, bx = v => BX0 + Math.min(v, 30) / 30 * (BX1 - BX0);
      if (m.net && m.chem === 'lift'){
        s += LB(T(760, 920, '들뜨게 하는 에너지 G', 't-sub', 'start') + T(760, 964, m.hb ? '붙잡는 에너지 Γ (굽기로 ↑)' : '붙잡는 에너지 Γ (밀착)', 't-sub', 'start'));
        s += R(BX0, 900, bx(m.G) - BX0, 26, 'st02-bg', tip('G — 부푼 막에 쌓여 들뜰 때 풀리는 면적당 에너지 (두께에 비례)')) +
          R(BX0, 944, bx(m.gam) - BX0, 26, 'st02-bk', tip(m.hb ? `Γ — PR이 바닥에 붙어 있는 면적당 에너지 (가정값)\n과하게 구운 포지티브: 굽기로 밀착도 올라 ${m.gam0} → ${m.gam} J/m² (Γ × (1 + 가교 지표/0.1), 가정)` : 'Γ — PR이 바닥에 붙어 있는 면적당 에너지 (가정값)'));
        // 값 글자: 막대가 길면 막대 끝 안쪽에 (상자 밖으로 나가지 않게)
        const bv = (v, y, txt) => bx(v) > 1400 ? T(bx(v) - 8, y, txt, 'st02-bvd', 'end') : T(bx(v) + 8, y, txt, 'st02-bv', 'start');
        s += LB(bv(m.G, 920, m.G.toFixed(1)) + bv(m.gam, 964, m.hb ? `${m.gam0} → ${m.gam}` : String(m.gam)));
        s += L(BX0, 984, BX1, 984, 's-axis');
        [0, 10, 20, 30].forEach(v => { s += L(bx(v), 984, bx(v), 992, 's-axis') + LB(T(bx(v), 1012, v === 30 ? '30 J/m²' : String(v), 't-dim', v === 30 ? 'end' : 'middle')); });
        s += LB(T(760, 1012, '면적당 에너지 (힘이 아님)', 't-dim', 'start'));
      } else {
        const sl = Math.max(0, m.sl);
        s += LB(T(760, 920, '녹는 빠르기 s', 't-sub', 'start') + T(760, 948, '(안 묶인 PR = 1)', 't-dim', 'start'));
        s += R(BX0, 902, (BX1 - BX0) * sl, 26, 'st02-bs', tip('녹는 빠르기 — 안 묶인 PR을 1로 본 상대값 (가정)')) + R(BX0, 902, BX1 - BX0, 26, 'st02-bfr');
        s += LB(T(BX0 + (BX1 - BX0) * sl + (sl > 0.8 ? -8 : 8), 922, sl.toFixed(2), sl > 0.8 ? 'st02-bvd' : 'st02-bv', sl > 0.8 ? 'end' : 'start'));
        const nl = m.mode === 'sdis' ? '용해형 — 알칼리가 그물을 잘라 녹이므로 들뜸 비교(G vs Γ) 없음' : m.mode === 'slow' ? '아직 그물이 아님 (겔점 0.1 아래) — 들뜸 비교(G vs Γ) 없음' : '묶이지 않은 PR — 들뜸 비교(G vs Γ)는 그물일 때만';
        s += LB(T(760, 1000, nl, 't-dim', 'start'));
      }
      let l1, l2 = `걸리는 시간 ${fmtT(m.t)} — 03장 모델 (70 °C · 순환 예시)`;
      if (m.mode === 'lift') l1 = `조각 약 ${Math.round(m.frag)} µm — 범프 틈 30 µm의 약 ${(m.frag / 30).toFixed(1)}배 (판째 들림)`;
      else if (m.mode === 'stay'){ l1 = m.hb ? 'G ≤ Γ — 굽기로 밀착도 올라 들뜨지 않고 주름만 지며 남음' : 'G ≤ Γ — 바닥에서 안 떨어짐 → 알칼리 · 온도 · 고압 분사 필요'; l2 = '걸리는 시간 — 끝나지 않음 (잔여 위험)'; }
      else if (m.mode === 'dis') l1 = m.x > 0 ? (m.chem === 'dis' ? '살짝 묶인 사슬도 알칼리가 끊어 녹인다 (조각 없음)' : '살짝 묶인 사슬 — 조금 느려지지만 위에서부터 녹는다 (조각 없음)') : '묶이지 않은 사슬 — 위에서부터 녹는다 (조각 없음)';
      else if (m.mode === 'slow') l1 = '살짝 묶인 사슬 — 겔이 오래 남아 느려진다 (겔점에 가까울수록)';
      else {
        const mL = model(Object.assign({}, st, {chem: 'lift'}));        // 같은 막을 박리형으로 걷으면?
        l1 = mL.mode === 'lift' ? `조각은 없지만 박리형(들떠 조각, ${fmtT(mL.t)})보다 느리다` : '박리형이면 붙은 채 남을 막(G ≤ Γ)도 녹여 낸다 — 조각 없음';
      }
      return s + LB(T(760, 1048, l1, 't-sub', 'start') + T(760, 1082, l2, m.mode === 'stay' ? 'st02-ngs' : 't-dim', 'start'));
    }
    function hxG(m){
      return LB(T(764, 700, `위젯: ${TYPE[st.type]} · 열 이력 ${st.bake} °C → 가교 지표 ${m.x.toFixed(2)}`, 't-acc', 'start') + T(764, 730, `→ ${MODE[m.mode].nm} (밀착 ${({lo: '약함', mid: '보통', hi: '강함'})[st.adh]}${m.hb && st.chem === 'lift' ? `, 굽기로 Γ ${m.gam0}→${m.gam}` : ''} · ${st.chem === 'dis' ? '용해형' : '박리형'})`, 't-sub', 'start'));
    }
    function render(){
      const sid = ctx.step() || 'chain', m = model(st);
      ctx.$('[data-v="pr"]').innerHTML = prG(m, sid);
      ctx.$('[data-v="zoom"]').innerHTML = zoomG(m, sid);
      ctx.$('[data-v="znote"]').innerHTML = znoteG(m, sid);
      ctx.$('[data-v="res"]').innerHTML = resG(m);
      ctx.$('[data-v="hx"]').innerHTML = hxG(m);
      ctx.refresh();
      ctx.out('k-mode', MODE[m.mode].nm);
      ctx.out('k-x', m.x.toFixed(2));
      ctx.out('k-g', m.net && m.chem === 'lift' ? `${m.G.toFixed(1)} / ${m.gam}` : `– / ${m.gam}`);
      ctx.out('k-t', fmtT(m.t));
      const kp = ctx.card.querySelector('[data-o="k-mode"]').parentNode;
      ['ok', 'warn', 'ng'].forEach(c => kp.classList.toggle(c, MODE[m.mode].k === c));
      const kt = ctx.card.querySelector('[data-o="k-t"]').parentNode;
      kt.classList.toggle('ng', m.t == null || !isFinite(m.t) || m.t > 240);
      const g = m.G == null ? '' : m.G.toFixed(1);
      let msg;
      if (m.mode === 'dis' && m.chem === 'lift') msg = `묶이지 않은 사슬 — 용제가 사슬을 한 가닥씩 풀어 위에서부터 녹입니다. 걸리는 시간 ${fmtT(m.t)}(03장 모델) — 겉부터 녹으므로 두께에 거의 비례합니다 → <a data-go="soak.square">03장</a>.`;
      else if (m.mode === 'slow') msg = `열 이력으로 사슬이 조금 묶이기 시작했습니다(가교 지표 ${m.x.toFixed(2)}). 끈적한 겔이 오래 남아 느려집니다 — 걸리는 시간 ${fmtT(m.t)}. 겔점(0.1)에 가까울수록 급히 느려지고, 겔점을 넘으면 녹지 않고 부풀기만 합니다(박리형) — 굽기로 밀착도 함께 올라 보통 주름진 채 남고, 밀착이 약하거나 막이 두꺼우면 들떠 조각이 됩니다. 스트립 조건보다 굽기 조건부터 확인합니다 [앞 공정].`;
      else if (m.mode === 'lift') msg = `가교 그물 — 들뜨게 하는 에너지(G ${g} J/m²)가 붙잡는 에너지(Γ ${m.gam} J/m²${m.hb ? `, 굽기로 ${m.gam0}에서 오름` : ''})보다 커서 바닥에서 들뜹니다. 조각 약 ${Math.round(m.frag)} µm는 박리형 약품에서는 거의 녹지 않으므로 필터 · 재부착을 조심합니다 → <a data-go="tool.agit">05장</a>.` +
        (m.hb ? ' 포지티브 PR에서 조각이 나오는 것은 과한 굽기(가교)에 약한 밀착 · 두꺼운 막이 겹친 신호입니다 — 빨리 떨어져도 깨끗해진 것이 아닙니다. 굽기 조건부터 확인합니다 [앞 공정].' : '');
      else if (m.mode === 'stay' && m.hb) msg = `과하게 구운 ${TYPE[st.type]} PR — 굽기로 사슬이 묶이면서 바닥 밀착도 함께 올라(Γ ${m.gam0} → ${m.gam} J/m², 가정) 들뜨게 하는 에너지(G ${g} J/m²)가 이기지 못합니다. 보통 판째 들뜨지 않고 주름만 지며 남습니다(공개 응용 노트: 220 °C로 구운 노볼락은 NMP에서 주름만). 굽기 조건부터 확인하고 [앞 공정], 용해형 · 온도 · 고압 분사를 검토합니다 — 잔여 위험 → <a data-go="soak.stir">03장</a>.`;
      else if (m.mode === 'stay') msg = (st.h <= 25 ? '얇은 가교 막은 들뜨게 하는 에너지가 작아 붙은 채 남기 쉽습니다 — 두꺼운 막보다 오히려 까다롭습니다. ' : st.adh === 'hi' ? '바닥과 아주 잘 붙은 막은 부풀어도 떨어지지 않습니다. ' : '') + `G ${g} J/m² ≤ Γ ${m.gam} J/m² — 부풀기만 하고 남습니다. 알칼리 공격(용해형) · 온도 · 고압 분사가 필요합니다 — 잔여 위험 → <a data-go="soak.stir">03장</a>.`;
      else if (m.mode === 'sdis'){
        const mL = model(Object.assign({}, st, {chem: 'lift'}));
        msg = `용해형 — 알칼리가 그물을 잘라 조각 없이 녹입니다(${fmtT(m.t)}). ` + (mL.mode === 'lift' ? `같은 막을 박리형으로 걷으면 ${fmtT(mL.t)}에 들떠 조각으로 떨어지므로, 조각 걱정을 덜고 시간을 더 씁니다. ` : `박리형이었다면 붙은 채 남았을 막(G ${mL.G.toFixed(1)} ≤ Γ ${mL.gam} J/m²)입니다. `) +
          `녹은 PR이 액을 빨리 지치게 하고 → <a data-go="bath.load">06장</a>, 알칼리가 세면 금속 손실도 함께 봅니다 → <a data-go="metal.cu">07장</a>.`;
      }
      else msg = `용해형 — ${m.x > 0 ? '살짝 묶인 사슬도 알칼리가 끊어 주므로 겔에 갇히지 않고' : '묶이지 않은 PR은 그대로'} 녹습니다(${fmtT(m.t)}). 알칼리가 든 만큼 금속 손실을 함께 봅니다 → <a data-go="metal.cu">07장</a>.`;
      ctx.q('[data-o=msg]').innerHTML = msg;
    }
    // 손대면: 장면 설명 줄과 맞는 단계로 옮긴다 (녹음 · 느리게 녹음 → pos, 그물(들뜸 · 남음 · 용해형) → lift. neg 단계는 그물이면 그대로)
    function touch(){
      touched = true;
      const sid = ctx.step(), md = model(st).mode, toPos = md === 'dis' || md === 'slow';
      if (sid === 'chain') ctx.go(toPos ? 'pos' : 'lift');
      else if (sid === 'pos' && !toPos) ctx.go('lift');
      else if ((sid === 'neg' || sid === 'lift') && toPos) ctx.go('pos');
    }
    ctx.seg('type', (v, u) => { st.type = v; render(); if (u) touch(); });
    ctx.seg('adh', (v, u) => { st.adh = v; render(); if (u) touch(); });
    ctx.seg('chem', (v, u) => { st.chem = v; render(); if (u) touch(); });
    ctx.range('bake', v => { st.bake = v; render(); return v + ' °C'; });
    ctx.range('h', v => { st.h = v; render(); return v + ' µm'; });
    ['bake', 'h'].forEach(id => inp(id).addEventListener('input', touch));
    ctx.demo = sid => {
      if (!touched && DEMO[sid]){
        const [type, bake, h, adh, chem] = DEMO[sid];
        Object.assign(st, {type, bake, h, adh, chem});
        setSeg('type', type); setSeg('adh', adh); setSeg('chem', chem);
        inp('bake').value = bake; ctx.out('bake', bake + ' °C');
        inp('h').value = h; ctx.out('h', h + ' µm');
      }
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['고분자 (폴리머)', '같은 단위가 수십~수천 개 이어진 긴 사슬 분자. PR의 몸통(수지)이 고분자다 — 포지티브 PR의 노볼락은 보통 수십~백여 개로 짧은 편(잘 녹는 까닭 중 하나)이고, 네거티브 PR의 아크릴 수지는 보통 더 길다'],
      ['노볼락 · DNQ', '범프용 포지티브 PR의 대표 조합. 노볼락(페놀 수지)이 몸통, DNQ는 빛을 받으면 알칼리에 녹게 바뀌는 감광제'],
      ['화학증폭형 (CA)', '빛이 만든 산이 반응을 여러 번 일으키는 PR. 두꺼운 막에서 감도가 좋다. 포지티브는 보통 가교되지 않는다'],
      ['가교', '사슬 사이에 다리를 놓아 그물로 묶는 것. 네거티브 PR은 노광 · 굽기 때 가교된다. 포지티브도 너무 뜨겁게 오래 구우면 묶이기 시작한다. 묶임이 늘어 막 전체가 하나의 그물로 이어지는 문턱을 겔점이라 한다 (이 장 위젯은 가교 지표 0.1로 가정)'],
      ['겔층', '녹는 PR 겉에 생기는, 용제를 먹어 끈적해진 층. 사슬은 여기서 풀려 액으로 나간다'],
      ['팽윤 (부풂)', '그물이 용제를 먹어 부피가 커지는 것. 그물은 풀리지 않으므로 녹는 대신 부푼다'],
      ['밀착 (붙잡는 에너지 Γ)', 'PR이 바닥(시드)에 붙어 있는 정도. 면적당 에너지(J/m²)로 말하고, 시드 표면 상태 · 굽기 · 도금 이력이 정한다'],
      ['박리형 · 용해형 스트리퍼', '박리형 = 가교 PR을 부풀려 떼어 내는 약품 — 조각(플레이크)이 나오고, 조각은 거의 녹지 않는다. 용해형 = 알칼리로 그물을 잘라 녹여 내는 약품 — 조각이 덜 나오지만 보통 더 느리다']
    ]) + K.field([
      'PR 종류와 굽기 조건은 포토 공정이 정합니다 [앞 공정]. 스트립 조건만 세게 하기 전에 PR · 굽기 · 노광량 변경 이력부터 확인합니다.',
      '박리형 약품으로 네거티브 PR을 걷으면 조각이 나오므로 필터 차압 · 필터 교체 주기가 중요합니다 → <a data-go="tool.agit">05장</a> · <a data-go="bath.rule">06장</a>. 조각은 범프 틈(30 µm)보다 클 수 있어 범프 자리가 뚫린 판째 들리기도 합니다(크기는 PR · 약품에 따라). 조각이 문제면 용해형 약품을 평가하기도 합니다 [스트립-액] — 녹은 PR이 액을 빨리 지치게 하고 금속 손실이 다를 수 있어 함께 봅니다.',
      '같은 PR이라도 도금 시간이 긴 제품(높은 범프), 따뜻한 Ni 액에 오래 담근 제품은 더 안 벗겨질 수 있다고 알려져 있습니다(조건에 따라) — 제품별로 클리어 시간(PR이 다 걷히는 시간)을 확인합니다.',
      '포지티브 PR인데 조각이 나오거나 주름이 지면 과한 굽기 · 열 이력(가교)을 의심합니다. 밑동에만 남으면 도금 중 들뜸(치마) · 버섯 머리를 먼저 봅니다 → <a data-go="residue.foot">08장</a>.'
    ]) + K.deep(`<ul>
      <li><b>고분자가 녹는 순서</b> — 용제 흡수 → 유리처럼 단단한 상태에서 고무 같은 상태로(용제가 유리 전이 온도를 낮춤) → 겉에 겔층 → 엉킨 사슬이 풀림 → 사슬이 확산으로 액으로. 사슬이 길수록(분자량이 클수록) 느립니다(고분자 용해 총설, Miller-Chou &amp; Koenig 2003). 노볼락/DNQ에서 노광 안 된 DNQ는 노볼락의 알칼리 현상을 막지만(소수성), 노광되면 카복실산으로 바뀌어 알칼리에 녹습니다. 스트리퍼의 극성 용제는 노광 여부와 관계없이 사슬을 직접 풀어 녹입니다.</li>
      <li><b>잘 녹이는 용제 — 한센 용해도 매개변수</b> — 분산 δD · 극성 δP · 수소결합 δH가 PR과 가까울수록 잘 녹입니다. 거리 Ra² = 4(ΔδD)² + (ΔδP)² + (ΔδH)². 용제별 값은 <a data-go="chem.solvent">04장</a> 그림에 있습니다(물의 δH 약 42 MPa½ — NMP 약 7 · DMSO 약 10보다 훨씬 큼). 물은 δH가 너무 커 PR을 녹이지 못합니다 → 녹은 PR이 물을 만나면 다시 석출될 수 있습니다(<a data-go="residue.redep">08장</a>).</li>
      <li><b>열 이력</b> — 현상된 포지티브 PR은 보통 약 100~130 °C에서 물러져 모서리가 둥글어지고(흐름), 훨씬 높은 온도(예: 180~250 °C)로 오래 구우면 가교가 크게 진행되어 NMP · DMSO로도 안 녹고 주름만 생긴다는 보고가 있습니다. 위젯의 150 °C 시작은 경향을 보이려는 가정값입니다(가교가 시작되는 온도의 공개값은 PR마다 다름). 굽기는 바닥 밀착도 올리므로(하드베이크의 목적 중 하나), 과하게 구운 포지티브 막은 보통 판째 들뜨기보다 주름진 채 남습니다 — 위젯은 이를 '밀착 Γ × (1 + 가교 지표/0.1)'이라는 가정으로 나타냅니다. 그래도 밀착이 약하거나 막이 두꺼우면 들떠 조각이 될 수 있습니다.</li>
      <li><b>들뜸 조건</b> — 바닥에 붙은 막이 부풀면 옆으로 못 늘어나 평면 압축 응력 σ ≈ E·ε/(1−ν)가 생깁니다. 막에 쌓인 탄성 에너지는 면적당 (1−ν)σ²h/E(상한)이고, 들뜬 끝이 한 방향으로 나아갈 때 풀리는 에너지는 ${K.eq('G = (1−ν²)·σ²·h / (2E)')}${K.eq('  = (1+ν)/(2(1−ν))·E·ε²·h')}${K.eq('  ≈ 1.17·E·ε²·h   (ν = 0.4)')} 입니다(정상 상태 박리, Hutchinson &amp; Suo 1992). G가 계면 밀착 에너지 Γ보다 크면 들뜹니다. 가교가 촘촘할수록 덜 부풀지만(플로리–레너, 부피 팽윤비 Q ∝ Mc^(3/5)) 더 단단해집니다. 위젯 예: 네거티브 · 110 °C → 가교 지표 0.64, ε ≈ 4.9 %, E ≈ 64 MPa → G ≈ 6.3 J/m²(35 µm, Γ 5보다 큼 → 들뜸) · 3.6(20 µm → 남음) · 10.9(60 µm). G가 두께에 비례하므로 <b>두꺼운 막은 스며드는 데 오래 걸리지만 일단 부풀면 잘 들뜨고, 얇은 가교 막은 붙어 남기 쉽습니다</b>(이 예시에서 Γ 5이면 약 28 µm 아래).</li>
      <li><b>좌굴로 들뜬다</b> — 부푼 막은 압축이라 실제로는 위로 휘어 오르며(주름 · 물집, 좌굴) 들뜨기 쉽고, 이때 계면은 미끄러지는 쪽(모드 II)으로 더 버팁니다. 들뜬 자리가 휘어 오를 수 있는 가장 작은 반폭은 약 b ≈ πh/√(12(1+ν)ε) — ε 5 %면 약 3.4h입니다. 위젯의 '조각 ≈ 4h'는 이 크기 감각(두께의 수 배)에서 빌린 가정입니다. 35 µm 막이면 약 140 µm로 범프 틈(30 µm)보다 훨씬 커서, 조각은 범프 자리가 뚫린 판으로 들릴 수 있습니다. 다만 범프 사이 PR은 두께(35 µm)가 틈(30 µm)보다 커서 '얇은 막' 식은 크기 감각일 뿐이고, 범프 옆벽에 붙은 힘도 PR을 붙잡습니다(부푼 PR이 범프를 옆으로 밀기도 합니다 — 조건에 따라).</li>
      <li><b>알칼리의 화학 공격 · 용해형</b> — 알칼리는 페놀 수지를 페놀레이트 이온으로, 아크릴계 네거티브 PR의 카복실산을 이온으로 바꿔 더 잘 부풀게 하고, 일부 에스터 결합을 가수분해해 그물을 약하게 합니다(조건에 따라). 이 반응을 앞세운 <b>용해형</b> 스트리퍼는 가교 막을 조각 대신 녹여 냅니다 — 공개 기술 자료에는 같은 두꺼운 네거티브 막이 일반 DMSO · NMP · TMAH 혼합액에서는 판처럼 벗겨지고 용해형 액에서는 녹았다는 예가 있고, 4차 암모늄 수산화물이 든 액으로 두꺼운 네거티브 PR의 '부풂과 녹음'을 함께 평가한 공개 연구도 있습니다. 아주 촘촘한 에폭시 계열 네거티브 막은 일반 스트리퍼로 거의 안 벗겨져 영구 막으로 쓰이기도 합니다.</li>
      <li><b>도금이 남기는 것</b> — 도금 중 PR이 바닥에서 들뜨면 그 틈으로 금속이 얇게 번져(치마) PR 가장자리를 붙잡습니다. PR 위로 넘친 버섯 머리는 그 아래 PR을 액에서 가립니다. 둘 다 스트립 뒤 밑동 잔여의 단골 원인입니다(<a href="#go-plating-12">전해도금 12장</a> — 외톨이 범프가 먼저 높이 자라 넘치는 까닭은 <a href="#go-plating-08">08장</a>).</li></ul>`);
  },
  css: `.pl-svg .st02-chain{fill:none;stroke:#c4b5fd;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.pl-svg .st02-lv{stroke:#f0abfc}
.pl-svg .st02-sol{fill:#7dd3fc}
.pl-svg .st02-bit{fill:#e9d5ff}
.pl-svg .st02-xl{stroke:#f59e0b;stroke-width:3}
.pl-svg .st02-xlc{stroke:#f59e0b;stroke-width:2.2;stroke-dasharray:4 4;opacity:.65}
.pl-svg .st02-cut{fill:none;stroke:#f87171;stroke-width:3.2;stroke-linecap:round}
.pl-svg .st02-gel{fill:rgba(240,171,252,.62);stroke:#f5d0fe;stroke-width:1.2;stroke-dasharray:5 4}
.pl-svg .st02-gelz{fill:rgba(240,171,252,.12);stroke:rgba(240,171,252,.45);stroke-width:1.2;stroke-dasharray:6 5}
.pl-svg .st02-gap{stroke:#f87171;stroke-width:5;stroke-linecap:round}
.pl-svg .st02-swo{fill:none;stroke:#e9d5ff;stroke-width:2;stroke-dasharray:7 5}
.pl-svg .st02-swo2{stroke:#e9d5ff;stroke-width:1.6}
.pl-svg .st02-wrk{fill:none;stroke:#f5f3ff;stroke-width:2.4}
.pl-svg .st02-shadow{fill:rgba(2,6,15,.42)}
.pl-svg .st02-ml{font-size:19px;font-weight:800;fill:#0f172a;stroke:none}
.pl-svg .st02-teth{stroke:#86efac;stroke-width:2.6}
.pl-svg .st02-tethx{stroke:#f87171;stroke-width:2.4;stroke-dasharray:4 4}
.pl-svg .st02-anc{fill:#86efac}
.pl-svg .st02-ancx{fill:none;stroke:#f87171;stroke-width:2}
.pl-svg .st02-zsq{fill:none;stroke:#7dd3fc;stroke-width:2.4}
.pl-svg .st02-zl{fill:none;stroke:rgba(125,211,252,.4);stroke-width:1.4;stroke-dasharray:6 6}
.pl-svg .st02-mode{font-size:30px;font-weight:900}
.pl-svg .st02-m0{fill:#86efac}
.pl-svg .st02-m1{fill:#fbbf24}
.pl-svg .st02-m2{fill:#7dd3fc}
.pl-svg .st02-m3{fill:#f87171}
.pl-svg .st02-bg{fill:#38bdf8}
.pl-svg .st02-bk{fill:#f59e0b}
.pl-svg .st02-bs{fill:#a78bfa}
.pl-svg .st02-bfr{fill:none;stroke:rgba(148,163,184,.45);stroke-width:1.2}
.pl-svg .st02-bv{font-size:21px;font-weight:800;fill:#fde68a}
.pl-svg .st02-bvd{font-size:21px;font-weight:800;fill:#0b1222;stroke:none}
.pl-svg .st02-ng{font-size:26px;font-weight:900;fill:#fca5a5;stroke:#1e1b4b;stroke-width:5;stroke-linejoin:round;paint-order:stroke}
.pl-svg .st02-wt{font-size:21px;font-weight:800;fill:#f8fafc;stroke:#1e1b4b;stroke-width:4;stroke-linejoin:round;paint-order:stroke}
.pl-svg .st02-ngs{font-size:19px;font-weight:700;fill:#fca5a5}
.pl-svg .st02-e0{font-size:19px;fill:#86efac}
.pl-svg .st02-e1{font-size:19px;fill:#fcd34d}
.pl-svg .st02-e2{font-size:19px;fill:#fca5a5}
.pl-svg .st02-thb{fill:#0b1222;stroke:#94a3b8;stroke-width:1.4}
.pl-svg .st02-thf{fill:#f87171}
.pl-svg .st02-mk{fill:#f59e0b;stroke:#0b1222;stroke-width:2}
.pl-svg .st02-mkt{font-size:19px;font-weight:900;fill:#0b1222;stroke:none}`
});
})();
