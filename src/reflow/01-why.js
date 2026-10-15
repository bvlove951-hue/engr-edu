/* 리플로우 01 — 왜 녹이나: 리플로우는 범프에 무엇을 해 줄까 (범프 · 수십 µm) */
(function(){
// 큰 범프 (왼쪽, 1 µm = 12 px): 가운데 x, 솔더 바닥(= Ni 윗면) y, 바닥 반폭(px)
const CX = 410, Y0 = 780, A = 150, PX = 12;
const AUM = 12.5, HC = 12;                                     // 바닥 반지름 · 도금 솔더 높이 (µm, 예시 — plans/shared.md)
// 구형 모자: 가운데 cx, 바닥선 y0, 바닥 반폭 a(px), 높이 h(px). h > a 이면 반구보다 큰 호
const cap = (cx, y0, a, h) => { const R = (a * a + h * h) / (2 * h); return `M${cx - a},${y0} A${R.toFixed(1)},${R.toFixed(1)} 0 ${h > a ? 1 : 0} 1 ${cx + a},${y0} Z`; };
// 부피 V(µm³)와 바닥 반지름 a(µm) → 돔 높이 h(µm): πh(3a² + h²)/6 = V (이분법)
function capH(a, V){ let lo = 0, hi = 6 * a + 60; for (let k = 0; k < 60; k++){ const m = (lo + hi) / 2; if (Math.PI * m * (3 * a * a + m * m) / 6 < V) lo = m; else hi = m; } return (lo + hi) / 2; }
const VOL = Math.PI * AUM * AUM * HC, HD = capH(AUM, VOL);       // 5,890 µm³ → 15.72 µm
const HDP = HD * PX, RS = (A * A + HDP * HDP) / (2 * HDP), CYS = Y0 - HDP + RS;   // 돔 높이(px) · 구 반지름 · 구 중심 y
const YTOP = Y0 - HC * PX;                                     // 도금 윗면 y (636)

// 02장 위젯의 기본 프로파일(예열 170 °C 90 s · 최고 설정 255 °C 30 s · 승온 · 냉각 2 °C/s · τ 5 s)을 미리 계산 (dt 0.25 s)
const DT = 0.25, TE = 221, TLQ = 224, TN = 191;               // 녹기 시작(공정점(共晶)) · 다 녹음(Ag 2.5 %) · 식을 때 굳기 시작(06장 모델)
const PR = (() => {
  const tau = 5, ru = 2, rc = 2, Ts = 170, ts = 90, Tset = 255, tp = 30;
  const t1 = (Ts - 25) / ru, t2 = t1 + ts, t3 = t2 + (Tset - Ts) / ru, t4 = t3 + tp;
  const S = t => t < t1 ? 25 + ru * t : t < t2 ? Ts : t < t3 ? Ts + ru * (t - t2) : t < t4 ? Tset : Math.max(25, Tset - rc * (t - t4));
  const n = Math.round(380 / DT), T = [25];
  for (let i = 1; i <= n; i++) T.push(T[i - 1] + (S((i - 1) * DT) - T[i - 1]) / tau * DT);
  let ipk = 0;
  T.forEach((v, i) => { if (v > T[ipk]) ipk = i; });
  const iup = T.findIndex(v => v >= TE);
  let isol = n + 1;
  for (let i = ipk + 1; i <= n; i++) if (T[i] < TN){ isol = i; break; }
  let idn = isol;
  for (let i = ipk + 1; i <= n; i++) if (T[i] < TE){ idn = i; break; }
  // IMC: x³ = ∫k(T)dt, 솔더가 액체인 동안 (05장과 같은 예시 상수: 250 °C 60 s → 1 µm, Q 25 kJ/mol)
  const k = c => Math.exp(-(25000 / 8.314) * (1 / (c + 273.15) - 1 / 523.15)) / 60;
  const X = [0];
  let I = 0;
  for (let i = 1; i <= n; i++){ if (i >= iup && i < isol) I += k(T[i]) * DT; X.push(Math.cbrt(I)); }
  return {T, X, n, ipk, iup, isol, idn, t1, t2};
})();
const LIQS = Math.round((PR.isol - PR.iup) * DT), TAL = Math.round((PR.idn - PR.iup) * DT);   // 액체인 시간 79 s · 221 °C 위 64 s
// 작은 프로파일 상자의 좌표
const GX0 = 110, GX1 = 740, GY0 = 436, GY1 = 196;
const gx = t => GX0 + t / 380 * (GX1 - GX0), gy = T => GY0 - T / 300 * (GY0 - GY1);
const DEMO = {before: 0, melt: 200, join: 230, line: 380};
// 좁은(세로) 화면 전용 확대: 큰 범프 · 계면 확대 · 공정 순서 가운데
const VN_BUMP = {x: 30, y: 486, w: 760, h: 624}, VN_IN = {x: 812, y: 146, w: 736, h: 466}, VN_FLOW = {x: 806, y: 300, w: 750, h: 366};

// t 초에서 솔더 상태
function stateAt(i){
  const T = PR.T[i];
  if (i < PR.iup) return {k: 'solid0', nm: '고체', ph: i * DT < PR.t1 ? 'ramp' : i * DT < PR.t2 ? 'soak' : 'ramp2'};
  if (i >= PR.isol) return {k: 'solid', nm: '굳음'};
  if (i <= PR.ipk) return T < TLQ ? {k: 'mush', nm: '녹는 중'} : {k: 'liq', nm: '녹음'};
  return T >= TLQ ? {k: 'liq', nm: '녹음'} : {k: 'super', nm: '과냉 액체'};
}
// 거친 윗면 원기둥 (가운데 cx, 바닥 y0, 반폭 a, 높이 h, 거칠기 amp, 간격 st)
function cylPath(cx, y0, a, h, amp, st, seed){
  const r = (n => () => { n = (n * 16807) % 2147483647; return (n - 1) / 2147483646; })(seed * 131 + 7);
  let d = `M${cx - a},${y0} L${cx - a},${(y0 - h + amp).toFixed(1)}`;
  for (let x = cx - a + st; x < cx + a - 1; x += st) d += ` L${x.toFixed(1)},${(y0 - h + (r() * 2 - 1) * amp).toFixed(1)}`;
  return d + ` L${cx + a},${(y0 - h + amp).toFixed(1)} L${cx + a},${y0} Z`;
}
// 산화막에 갇혀 쭈글쭈글하게 녹은 솔더 (원기둥 윤곽 + 물결 윗면)
function wrinPath(){
  let d = `M${CX - A},${Y0} L${CX - A - 3},700 Q${CX - A - 2},650 ${CX - A + 14},${YTOP + 2}`;
  const n = 9, w = (2 * A - 28) / n;
  for (let k = 0; k < n; k++){ const x0 = CX - A + 14 + k * w; d += ` Q${(x0 + w / 2).toFixed(1)},${(YTOP + (k % 2 ? 12 : -12)).toFixed(1)} ${(x0 + w).toFixed(1)},${YTOP + 2}`; }
  return d + ` Q${CX + A + 2},650 ${CX + A + 3},700 L${CX + A},${Y0} Z`;
}
// 구 위의 점 (각도 deg, 화면 좌표: 위가 −90°)
const onDome = deg => { const r = deg * Math.PI / 180; return [CX + RS * Math.cos(r), CYS + RS * Math.sin(r)]; };

(window.EngrReflowChapters = window.EngrReflowChapters || []).push({
  no: '01', id: 'why', part: 1, short: '왜 녹이나', scale: '범프 · 수십 µm',
  title: '왜 녹이나 — 리플로우는 범프에 무엇을 해 줄까?',
  hook: '녹였다 굳히면 세 가지가 바뀐다',
  one: '리플로우는 도금으로 쌓은 솔더(SnAg)를 녹는점 위로 잠깐 올렸다가 식히는 공정입니다. 녹은 솔더는 표면장력으로 매끈한 둥근 모자(돔)가 되고, 아래 Ni와 반응해 얇은 금속간 화합물(IMC) 층으로 단단히 이어집니다. 그러려면 겉의 산화막을 걷어 내야 합니다.',
  ana: '<b>동전 위의 얼음 기둥</b> — 동전 크기로 자른 얼음 기둥이 녹으면, 물은 동전 가장자리에 멈춘 채 볼록한 돔이 됩니다. 양(무게)은 그대로이고 모양만 바뀝니다. <i>(비유의 한계: 얼음은 녹으며 부피가 약 8 % 줄지만, 솔더는 녹을 때 2~3 %만 늘었다가 굳으면 돌아옵니다. 물은 동전과 반응하지 않지만, 솔더는 아래 Ni와 반응해 IMC 층을 만들며 Ni를 조금 먹습니다. 솔더 겉에는 산화막이라는 껍질이 있어 먼저 걷어 내야 둥글어집니다. 또 동전 위 물은 무게가 표면장력보다 10배 넘게 커서 납작한 웅덩이(높이 몇 mm)가 되지만, 수십 µm 솔더는 무게가 거의 힘을 못 써 표면장력만으로 모양이 정해집니다.)</i>',
  steps: [
    {id: 'before', t: '도금 직후 — 거친 원기둥', d: '시드 식각까지 마친 범프의 SnAg는 도금한 모양 그대로인 원기둥입니다. 윗면은 거칠고, 겉에는 공기 · 물에 닿아 생긴 얇은 산화막과 유기물 찌꺼기가 있습니다. 이대로는 다른 칩과 고르게 붙기 어렵습니다.', viewN: VN_BUMP},
    {id: 'melt', t: '녹이면 — 매끈한 돔', d: 'SnAg는 221 °C(공정점(共晶))에서 녹기 시작합니다. 녹은 솔더는 겉넓이를 줄이려는 힘(표면장력)으로 매끈한 돔이 됩니다. 부피는 그대로라 이 예시 크기에서는 가운데 꼭대기가 도금 높이보다 오히려 높아집니다.', viewN: VN_BUMP},
    {id: 'join', t: '이어지기 — 계면에 IMC', d: '녹은 Sn은 아래 Ni와 반응해 얇은 금속간 화합물(IMC, 주로 Ni₃Sn₄) 층을 만듭니다. 이 층이 솔더와 Ni를 금속으로 이어 줍니다. 대신 열을 받을수록 두꺼워지며 Ni와 Sn을 조금씩 먹습니다.', viewN: VN_IN},
    {id: 'line', t: '자리 — 앞뒤 공정과 주고받기', d: '범프 공정에서는 시드 식각 → 플라즈마 처리(산화막 · 유기물 정리) → 리플로우 → 후처리 플라즈마 · 세정 → 검사 → 본딩 순서입니다. 리플로우 결과(높이 · 모양 · 보이드 · IMC)는 본딩에서 다시 드러납니다.', viewN: VN_FLOW}
  ],
  icon(K){
    const {R, P} = K;
    return R(10, 52, 46, 8, 'f-si') + R(20, 34, 26, 18, 'f-cu2') + R(20, 30, 26, 4, 'f-ni') + P('M20,30 A14,14 0 0 1 46,30 Z', 'f-sn2') + P('M20,30 L20,16 L46,16 L46,30', 'pl-ghost');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, wrap} = K;
    let s = '';

    // ── 작은 프로파일 (왼쪽 위, 모든 단계): 곡선은 고정, 지금 시간 표시는 위젯이 그린다
    let g = R(70, 120, 700, 360, 'pl-box', {rx: 12}) + T(88, 152, '이 웨이퍼가 겪는 온도 (예시 프로파일)', 't-dim', 'start');
    g += R(gx(PR.iup * DT), GY1, gx(PR.idn * DT) - gx(PR.iup * DT), GY0 - GY1, 'pl-liqz', tip(`221 °C 위 약 ${TAL}초 — 이 탭이 세는 '액상선 위 시간(TAL)' (02장)`));
    g += R(gx(PR.idn * DT), GY1, gx(PR.isol * DT) - gx(PR.idn * DT), GY0 - GY1, 'rf01-scz', tip('221 °C 아래로 식었지만 아직 액체 — 과냉 (06장)'));
    g += L(GX0, GY0, GX1 + 6, GY0, 's-axis') + L(GX0, GY0, GX0, GY1 - 6, 's-axis');
    [0, 100, 200, 300].forEach(v => { g += L(gx(v), GY0, gx(v), GY0 + 6, 's-axis') + T(gx(v), GY0 + 26, String(v), 't-dim'); });
    [100, 200, 300].forEach(v => { g += L(GX0 - 6, gy(v), GX0, gy(v), 's-axis') + T(GX0 - 10, gy(v) + 7, String(v), 't-dim', 'end'); });
    g += LB(T(GX1, GY0 + 26, '시간 (초)', 't-dim', 'end') + T(GX0 - 10, GY1 - 14, '°C', 't-dim', 'end'));
    g += L(GX0, gy(TE), GX1, gy(TE), 's-dash', tip('221 °C — Sn–Ag 공정점(共晶). 여기서 녹기 시작한다 (Ag 2.5 %는 약 224 °C에서 다 녹음)'));
    g += LB(T(GX0 + 8, gy(TE) - 7, '221 °C 녹기 시작', 't-dim', 'start'));
    const sx = gx(PR.isol * DT), sy = gy(TN);
    g += G(L(sx - 26, sy, sx + 8, sy, 'rf01-tn') + P(`M${sx},${sy - 8} l8,8 l-8,8 l-8,-8 Z`, 'rf01-tnk') + T(sx + 16, sy - 6, '191 °C 굳음 (과냉)', 'rf01-tnt', 'start'),
      tip('약 191 °C — 식을 때 실제로 굳기 시작하는 온도. 221 °C 아래로 수십 °C 내려가도 아직 액체였다 (과냉, 06장 모델: 25 µm · 2 °C/초)'));
    let d = '';
    for (let t = 0; t <= 380; t += 2) d += (t ? ' L' : 'M') + gx(t).toFixed(1) + ',' + gy(PR.T[t / DT]).toFixed(1);
    g += P(d, 's-curve', tip('웨이퍼 온도 — 02장 기본 프로파일 (최고 약 255 °C, 예시)'));
    // 띠 이름은 지금 시간 세로선(pm) 위에 그려, 선이 지나가도 글자가 가려지지 않게
    s += G(g) + `<g data-v="pm"></g>` + LB(T((gx(PR.iup * DT) + gx(PR.isol * DT)) / 2, GY0 - 12, `액체 약 ${LIQS}초`, 't-dim'));

    // ── 큰 범프 (12 px/µm): Si · 보호막 · 시드 · Cu 기둥 · Ni
    s += R(60, 1010, 700, 80, 'f-si', tip('Si 웨이퍼')) + R(60, 1004, 700, 6, 'f-pas', tip('보호막'));
    s += R(266, 1002, 288, 8, 'f-ti', tip('Ti — 시드 아래 접착 · 방벽층 (실제 약 100 nm — 그림은 과장)')) + R(266, 996, 288, 6, 'f-seed2', tip('Cu 시드 (실제 약 300 nm — 그림은 과장). 시드 식각 뒤 기둥 아래에만 남고 가장자리가 조금 깎였다(언더컷)'));
    s += R(CX - A, 816, 2 * A, 180, 'f-cu2', tip('Cu 기둥 15 µm (예시)')) + R(CX - A, Y0, 2 * A, 36, 'f-ni', tip('Ni 방벽 3 µm — 솔더가 Cu를 빨리 먹지 않게 막는다'));
    s += `<g data-v="sol"></g><g data-v="imc"></g>`;
    s += T(660, 1058, 'Si 웨이퍼', 't-sub');

    // 지시선 (확대 단계 밖) — 짧은 이름만, 자세한 말은 툴팁
    s += G(K.lead(536, 728, 640, 712, 'SnAg 솔더', 'start', 't-sub', tip('SnAg 솔더 — 녹아서 붙는 금속 (Ag 보통 1.5~2.5 wt%)')) +
      K.lead(548, 798, 640, 800, 'Ni 방벽', 'start', 't-sub', tip('Ni 방벽 — 솔더가 Cu를 빨리 먹지 않게 막는다')) +
      K.lead(548, 900, 640, 900, 'Cu 기둥', 'start', 't-sub', tip('Cu 기둥 — 높이 · 전기 · 열의 길')) +
      K.lead(551, 999, 640, 966, '시드 (과장)', 'start', 't-sub', tip('시드 (Ti · Cu) — 실제 수백 nm, 그림은 과장')), only('before melt line'));
    // before: 산화막 · 유기물
    s += G(K.lead(CX - A - 5, 664, 196, 604, '산화막 (과장)', 'end', 't-sub', tip('산화막 — 실제는 수 nm (그림은 크게 과장). 아래 SnO, 겉 SnO₂')) +
      K.lead(300, 628, 196, 546, '유기물 찌꺼기', 'end', 't-sub', tip('유기물 찌꺼기 — PR 스트립 · 세정 뒤에 남은 얇은 유기막 · 얼룩')), only('before'));

    // melt: 원기둥 윤곽 · 표면장력 · 높이 (돔일 때만 — 위젯이 감춘다)
    let m = P(`M${CX - A},${Y0} L${CX - A},${YTOP} L${CX + A},${YTOP} L${CX + A},${Y0}`, 'pl-ghost', tip('녹기 전 원기둥 (도금 모양)'));
    [-152, -116, -64, -28].forEach(dg => {
      const r = dg * Math.PI / 180, nx = Math.cos(r), ny = Math.sin(r), tx = -ny, ty = nx;
      const x = CX + (RS + 12) * nx, y = CYS + (RS + 12) * ny;                  // 겉면 바로 바깥에 (돔 윤곽을 가리지 않게)
      m += K.arrow(x + tx * 4, y + ty * 4, x + tx * 34, y + ty * 34, 's-arr2') + K.arrow(x - tx * 4, y - ty * 4, x - tx * 34, y - ty * 34, 's-arr2') + C(x, y, 4, 'k-acc2');
    });
    m = G(m, tip('표면장력 — 겉면을 따라 양쪽으로 당기는 힘 (겉 원자가 안으로 끌리는 것이 아님)'));
    m += G(K.arrow(CX, Y0 - HDP + 8, CX, Y0 - HDP + 50, 's-arr') + P(`M${CX + 6},${Y0 - HDP + 30} L586,604`, 's-lead') +
      TT(594, 598, ['굽은 겉면 →', '안쪽 압력 (라플라스)'], 't-dim', 'start', 24), tip('겉면이 굽어 있으면 겉면을 따라 당기는 힘이 안쪽 압력이 된다 (작을수록 큼, 04장)'));
    m += LB(P(`M256,${YTOP} l-8,0 l0,${HC * PX} l8,0`, 'rf01-brk') + T(236, (YTOP + Y0) / 2 + 8, `도금 ${HC} µm`, 't-sub', 'end'));
    m += LB(L(236, Y0 - HDP, CX - 12, Y0 - HDP, 's-dash') + L(236, YTOP, CX - A, YTOP, 's-dash') + K.arrow(236, YTOP - 2, 236, Y0 - HDP + 6, 's-arr2') + T(226, YTOP - 14, `+${(HD - HC).toFixed(1)} µm`, 't-warn', 'end'));
    m += LB(T(CX, Y0 - HDP - 24, `꼭대기 약 ${HD.toFixed(1)} µm (부피 같음)`, 't-warn'));
    s += G(G(m, only('melt')), {'data-v': 'mov'});
    // 산화막에 갇힘 (쭈글쭈글일 때 위젯이 보인다)
    // (가운데 오른쪽 위 x 345~595 · y 548~600: before · line 지시선, join 돋보기 선과 겹치지 않는 자리)
    s += G(LB(TT(470, 568, ['산화막 껍질에 갇혀', '둥글어지지 못함 (03장)'], 't-warn', 'middle', 28)), {'data-v': 'oxl', class: 'hide'});

    // line: 리플로우 뒤 확인하는 것
    s += G(LB(P(`M330,622 L204,548`, 's-lead') + C(330, 622, 3.5, 'k-lead') + T(196, 540, '높이 · 모양', 't-sub', 'end') + T(196, 566, '외관 · 높이 검사', 't-dim', 'end')) +
      LB(P(`M276,776 L204,716`, 's-lead') + C(276, 776, 3.5, 'k-lead') + T(196, 706, 'IMC · 보이드', 't-sub', 'end') + T(196, 732, 'X-ray · 단면으로', 't-dim', 'end')), only('line'));

    // join: 계면 돋보기 → 오른쪽 확대 (확대 그림은 위젯이 그린다)
    s += G(R(326, 744, 168, 66, 'rf01-mag', {rx: 6}) + L(494, 744, 824, 430, 'rf01-magl') + L(494, 810, 824, 596, 'rf01-magl') +
      LB(P(`M300,778 L204,716`, 's-lead') + C(300, 778, 3.5, 'k-lead') + T(196, 706, 'IMC (Ni₃Sn₄)', 't-sub', 'end') + T(196, 732, '오른쪽에 확대 →', 't-dim', 'end')), only('join'));

    // ── 오른쪽 패널
    s += R(800, 130, 760, 970, 'pl-panel', {rx: 16});
    s += `<g data-v="jz"></g>`;                                   // join: 계면 확대 (위젯이 그린다)
    // before: 이대로는 쓰기 어렵다 — 카드 3장
    let b = T(824, 172, '도금 직후 범프 — 이대로는 쓰기 어렵다', 't-acc', 'start');
    const CARDS = [
      ['거친 윗면 · 원기둥', '도금한 모양 그대로입니다. 윗면이 울퉁불퉁하고 모서리가 각져 있습니다. 도금 부피도 범프마다 조금씩 다릅니다.', '→ 녹이면 매끈 (부피 차이는 높이 차이로 남음)'],
      ['얇은 산화막 · 유기물 찌꺼기', 'PR 스트립 · 시드 식각 · 공기 중에 생긴 껍질과 찌꺼기입니다. 실제 산화막은 수 nm입니다 (그림은 과장).', '→ 녹여도 덜 둥글고 잘 붙지 않음 (03장)'],
      ['Ni와는 맞닿아 있을 뿐', '도금으로 쌓여 붙어 있지만, 금속끼리 반응해 생긴 층(IMC)은 아직 거의 없습니다.', '→ 녹여서 반응시켜야 금속으로 이어짐']
    ];
    CARDS.forEach(([h, t, c], k) => {
      const y = 196 + k * 252;
      b += R(824, y, 712, 232, 'pl-lane', {rx: 12});
      const by = y + 168;                                        // 작은 그림의 Ni 윗면
      if (k === 0){
        // 피치 55 µm · 지름 25 µm 그대로 (1.9 px/µm), 도금 부피(높이) 차이는 조금 과장
        b += mini(K, 862, by, 1.9, 'cyl', 13.2, 3) + mini(K, 862 + 55 * 1.9, by, 1.9, 'cyl', 10.6, 5);
        b += L(834, by - 13.2 * 1.9 - 2, 994, by - 13.2 * 1.9 - 2, 's-dash');
      } else if (k === 1){
        b += mini(K, 914, by, 3.2, 'cyl', 12, 4);
        b += P(cylPath(914, by, AUM * 3.2 + 3, 12 * 3.2 + 3, 1.6, 8, 4).replace(/ Z$/, ''), 'rf01-ox rf01-oxs');
        [890, 912, 936].forEach((x, j) => { b += C(x, by - 12 * 3.2 - 6 - (j % 2) * 4, 4, 'rf01-org'); });
      } else {
        b += R(844, y + 46, 140, 74, 'f-sn2') + R(844, y + 120, 140, 70, 'f-ni') + L(844, y + 120, 984, y + 120, 'rf01-sharp');
        b += LB(T(914, y + 92, 'SnAg', 'rf01-dk') + T(914, y + 162, 'Ni', 'rf01-dk'));
      }
      b += T(1000, y + 44, h, 'pl-hdg2', 'start') + TT(1000, y + 82, wrap(t, 24), 't-sub', 'start', 28) + T(1000, y + 204, c, 'pl-hdg', 'start');
    });
    b += T(824, 990, '리플로우는 이 셋을 한 번에 바꿉니다 — 모양 · 표면 · 계면', 't-acc', 'start');
    b += T(824, 1024, '솔더를 더하거나 빼지 않습니다 — 부피는 그대로, 모양 · 겉 · 바닥이 바뀝니다', 't-dim', 'start');
    s += G(b, only('before'));

    // melt: 바뀌는 것
    let mm = T(824, 172, '녹이면 바뀌는 것 — 부피는 그대로', 't-acc', 'start');
    mm += mini(K, 940, 360, 5, 'cyl', 12, 6) + mini(K, 1340, 360, 5, 'dome');
    mm += K.arrow(1036, 300, 1236, 300, 's-arr2') + T(1136, 284, '녹였다 굳힘', 't-dim') + T(1136, 330, `같은 부피 약 ${(Math.round(VOL / 10) * 10).toLocaleString('en-US')} µm³`, 't-dim');
    mm += L(1340 - 62.5 - 10, 360 - HD * 5, 1340 + 62.5 + 10, 360 - HD * 5, 's-dash') + L(940 - 62.5 - 10, 300, 940 + 62.5 + 10, 300, 's-dash');
    mm += T(940, 480, `원기둥 ${HC} µm`, 't-sub') + T(1340, 480, `돔 꼭대기 ${HD.toFixed(1)} µm`, 't-sub');
    const ROWS = [['① 모양', `원기둥 → 매끈한 돔. 부피가 같아 이 크기에서는 꼭대기가 약 ${(HD - HC).toFixed(1)} µm 높아집니다.`],
      ['② 표면', '거칠고 흐림 → 매끈 · 광택. 녹은 겉이 거칠기를 스스로 지웁니다.'],
      ['③ 산화막', '껍질이 남아 있으면 녹아도 둥글어지지 못합니다 → 미리(플라즈마) 또는 녹이는 동안(플럭스 · 포름산) 걷어 냅니다 (03장).'],
      ['④ 계면', 'Ni와 반응해 IMC로 이어집니다 → 다음 단계.']];
    let ry = 548;
    ROWS.forEach(([h, t]) => { const ln = wrap(t, 27.5); mm += T(824, ry, h, 'pl-hdg3', 'start') + TT(948, ry, ln, 't-sub', 'start', 28); ry += ln.length * 28 + 30; });
    mm += R(824, 878, 712, 140, 'pl-box', {rx: 12}) + T(844, 910, '왜 둥글어지나', 'pl-hdg', 'start');
    mm += TT(844, 940, wrap('녹은 솔더는 겉넓이를 가장 작게 하려 합니다(표면장력). 이 크기에서 무게는 표면장력의 약 5만분의 1이라, 모양은 부피와 젖은 바닥(Ni 윗면)이 정합니다 → 04장.', 32.5), 't-sub', 'start', 27);
    mm += TT(824, 1052, wrap('모양은 녹자마자(µs~0.1 ms) 바뀝니다 — 시간이 드는 것은 열 전달 · 산화막 걷기 · 기포 빠지기 · IMC 반응입니다.', 37), 't-dim', 'start', 26);
    s += G(mm, only('melt'));

    // line: 범프 공정 순서 (상자 7개)
    let ln = T(824, 172, '범프 공정에서 리플로우의 자리', 't-acc', 'start');
    const FLOW = [['시드 식각', '범프를 서로 떼어 놓음', '앞 탭 — 시드 식각 탭'],
      ['플라즈마 처리', '산화막 · 유기물 정리 (기체에 따라)', '기체에 따라 효과가 다르다 — O₂ 위주는 유기물만, Ar · H₂ · 불소 계열이 산화막 (03장)'],
      ['리플로우', '녹여서 돔 · IMC — 이 탭', ''],
      ['후처리 플라즈마', '리플로우 뒤 찌꺼기 정리', '플럭스 · 유기물 찌꺼기 정리 (범프 공정 탭)'],
      ['스크러버 세정', '입자 제거 · 건조', '솔 · 물줄기로 입자를 떼고 말린다 (범프 공정 탭)'],
      ['검사', '외관 · 높이 · X-ray', '모양 · 높이 · 브리지는 외관으로, 보이드는 X-ray로, IMC는 단면으로'],
      ['캐리어 본딩 · 적층 본딩', '다시 녹일 때 결과가 드러남', '캐리어 본딩은 보통 녹이지 않고, 적층 본딩에서 다시 녹는다 (05장)']];
    const FX = 1030, FW = 320, FH = 80, FG = 44;
    FLOW.forEach(([h, sub, tp], k) => {
      const y = 196 + k * (FH + FG), now = k === 2;
      let bx = R(FX, y, FW, FH, now ? 'pl-hlbox' : 'pl-tile2', {rx: 10}) + T(FX + FW / 2, y + 34, h, now ? 'rf01-now' : 'pl-hdg') + T(FX + FW / 2, y + 62, sub, 't-dim');
      ln += G(bx, tp ? tip(tp) : null);
      if (k < FLOW.length - 1) ln += K.arrow(FX + FW / 2, y + FH + 4, FX + FW / 2, y + FH + FG - 6, 's-arr');
    });
    const ry2 = 196 + 2 * (FH + FG);
    ln += T(826, ry2 - 6, '받는 것', 'pl-hdg2', 'start') + TT(826, ry2 + 24, ['거친 원기둥', '얇은 산화막'], 't-sub', 'start', 26);
    ln += K.arrow(972, ry2 + FH / 2, FX - 6, ry2 + FH / 2, 's-arr2');
    ln += K.arrow(FX + FW + 6, ry2 + FH / 2, 1388, ry2 + FH / 2, 's-arrg');
    ln += T(1396, ry2 - 6, '넘기는 것', 'pl-hdg3', 'start') + TT(1396, ry2 + 24, ['매끈한 돔', 'IMC로 이음', '광택 나는 겉'], 't-sub', 'start', 26);
    ln += T(824, 1066, '리플로우 결과(높이 · 모양 · 보이드 · IMC)는 본딩에서 다시 드러납니다', 't-dim', 'start');
    s += G(ln, only('line'));
    return s;

    // 작은 범프 (패널 그림): 가운데 cx, Ni 윗면 y, 배율 sc(px/µm), 'cyl' | 'dome', 솔더 높이(µm), 거칠기 씨앗
    function mini(K, cx, y, sc, kind, hc, seed){
      const a = AUM * sc;
      let o = K.R(cx - a, y + 3 * sc, 2 * a, 15 * sc, 'f-cu2') + K.R(cx - a, y, 2 * a, 3 * sc, 'f-ni');
      o += kind === 'dome' ? K.P(cap(cx, y, a, HD * sc), 'f-sn2') : K.P(cylPath(cx, y, a, hc * sc, 0.5 * sc + 0.4, Math.max(5, 2 * sc), seed), 'f-sn2');
      return o;
    }
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 리플로우 한 번 따라가기</div>
      ${K.ctl('t', '시간 (초)', 0, 380, 1, 0)}
      ${K.seg('sf', [['ok', '깨끗함 (전처리 · 질소)'], ['ox', '산화막 두껍게 남음']], 'ok', '솔더 표면')}
      ${K.kpis([['웨이퍼 온도', 'k-T', '예시 프로파일'], ['솔더', 'k-st', '지금 상태'], ['모양', 'k-sh', '겉모양'], ['IMC', 'k-x', 'Ni₃Sn₄ 두께 (예시)']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('온도 곡선은 02장 기본 프로파일(예시)입니다. 솔더 상태는 녹기 시작 221 °C · 다 녹음 224 °C(Ag 2.5 %) · 식을 때 굳기 시작 약 191 °C(06장 모델: 25 µm · 2 °C/초)로 나눴고, IMC는 05장의 예시 상수(250 °C 60초 → 약 1 µm)로 솔더가 액체인 동안 적분합니다. 실제 두께 · 온도는 솔더 · 분위기 · 장비마다 다릅니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip, rng} = K;
    let touched = false;
    const st = {t: 0, sf: 'ok'};
    const tin = ctx.card.querySelector('input[data-i=t]');
    const sol = ctx.$('[data-v="sol"]'), imc = ctx.$('[data-v="imc"]'), pm = ctx.$('[data-v="pm"]'), jz = ctx.$('[data-v="jz"]');
    const mov = ctx.$('[data-v="mov"]'), oxl = ctx.$('[data-v="oxl"]');
    const cyl = cylPath(CX, Y0, A, HC * PX, 7, 25, 1);
    const oxBand = cylPath(CX, Y0, A + 6, HC * PX + 6, 7, 25, 1).replace(/ Z$/, '');
    const dome = cap(CX, Y0, A, HDP), wrin = wrinPath();
    function render(){
      const i = Math.round(st.t / DT), T0 = PR.T[i], x = PR.X[i], s0 = stateAt(i);
      const melted = i >= PR.iup, liquid = s0.k === 'mush' || s0.k === 'liq' || s0.k === 'super';
      const shape = !melted ? 'cyl' : st.sf === 'ok' ? 'dome' : 'wrin';
      // 솔더
      let o = '';
      const path = shape === 'cyl' ? cyl : shape === 'dome' ? dome : wrin;
      if (liquid) o += P(path, 'rf01-liqg');
      o += P(path, 'f-sn2', tip(shape === 'cyl' ? '도금한 모양 그대로인 SnAg 원기둥 — 윗면이 거칠다' : shape === 'dome' ? `매끈한 돔 — 꼭대기 약 ${HD.toFixed(1)} µm (부피 그대로)` : '산화막 껍질에 갇혀 쭈글쭈글 — 녹아도 둥글어지지 못한다 (03장)'));
      if (shape === 'dome') o += K.E(CX - 62, Y0 - HDP + 62, 40, 18, 'rf01-shine');
      if (shape === 'cyl'){
        o += P(oxBand, 'rf01-ox', tip('산화막 — 실제는 수 nm (그림은 크게 과장)'));
        const r = rng(9);
        [290, 340, 392, 446, 498, 532].forEach(px => { o += C(px, YTOP - 8 + (r() * 2 - 1) * 6, 5, 'rf01-org', tip('유기물 찌꺼기')); });
      }
      if (shape === 'wrin'){
        o += P(wrin.replace(/ Z$/, ''), 'rf01-ox rf01-oxw', tip('두껍게 남은 산화막 — 녹은 솔더를 껍질처럼 가둔다'));
        o += P(`M300,${YTOP + 22} q20,-8 40,0 M390,${YTOP + 26} q24,8 46,-2 M480,${YTOP + 20} q18,-8 36,2`, 'rf01-wr');
      }
      if (liquid) o += P(path, 'rf01-liq' + (s0.k === 'super' ? ' rf01-sc' : ''), tip(s0.k === 'super' ? '과냉 액체 — 221 °C 아래지만 아직 액체' : '녹아 있는 솔더'));
      if (s0.k === 'solid' && shape === 'dome'){ const [ax, ay] = onDome(-121), [bx, by] = onDome(-24); o += P(`M356,${Y0} Q366,712 352,700 Q340,660 ${ax.toFixed(1)},${ay.toFixed(1)} M352,700 Q440,706 ${bx.toFixed(1)},${by.toFixed(1)}`, 'rf01-gb', tip('굳은 뒤의 β-Sn 결정 경계 — 범프 하나에 결정이 몇 개뿐 (06장)')); }
      sol.innerHTML = o;
      // IMC (Ni 윗면에서 위로) — Ni는 0.26 × 두께만큼 먹힌다
      let im = '';
      if (x > 0.004){
        const th = x * PX, yn = Y0 + 0.26 * th, g = rng(3), n = 12, w = 2 * A / n;
        let d = `M${CX - A},${yn.toFixed(1)}`;
        for (let k = 0; k < n; k++){
          const x0 = CX - A + k * w;
          d += ` L${(x0 + 0.15 * w).toFixed(1)},${(yn - 0.72 * th).toFixed(1)} L${(x0 + 0.5 * w).toFixed(1)},${(yn - th * (1.05 + 0.5 * g())).toFixed(1)} L${(x0 + 0.85 * w).toFixed(1)},${(yn - 0.72 * th).toFixed(1)}`;
        }
        d += ` L${CX + A},${yn.toFixed(1)} Z`;
        im += P(d, 'f-imc', tip(`Ni₃Sn₄ (IMC) — 지금 약 ${x.toFixed(2)} µm (예시). 윗면은 바늘 · 조각 모양`)) + L(CX - A, Y0, CX + A, Y0, 'rf01-ni0', tip('원래 Ni 윗면 — IMC가 Ni를 조금 먹어 들어갔다'));
      }
      imc.innerHTML = im;
      // 프로파일의 지금 시간
      const px = gx(st.t), py = gy(T0), right = px > 470;
      pm.innerHTML = L(px, GY1, px, GY0, 's-acc2') + C(px, py, 8, 'k-acc2') + LB(T(right ? px - 12 : px + 12, GY1 - 8, `${T0.toFixed(1)} °C · ${s0.nm}`, 't-warn', right ? 'end' : 'start'));
      // 오른쪽 패널 (join): 계면 확대 (1 µm = 60 px, 큰 그림의 5배)
      const IX0 = 824, IX1 = 1536, IY0 = 196, IY1 = 600, NI0 = 452, ZP = 60;
      const th = x * ZP, yn = NI0 + 0.26 * th;
      let z = T(824, 172, '계면 확대 — 솔더와 Ni 사이에 IMC가 자란다', 't-acc', 'start');
      let zi = R(IX0, IY0, IX1 - IX0, yn - IY0 + 4, 'f-sn2', tip('SnAg 솔더')) + R(IX0, yn, IX1 - IX0, IY1 - yn, 'f-ni', tip('Ni 방벽 — IMC가 먹은 만큼 윗면이 내려간다'));
      let top = NI0;
      if (x > 0.004){
        const gr = rng(11), n = 9, w = (IX1 - IX0) / n;
        for (let k = 0; k < n; k++){
          const x0 = IX0 + k * w, hs = [0.55 + 0.2 * gr(), 0.9 + 0.4 * gr(), 1.2 + 0.5 * gr(), 0.85 + 0.3 * gr(), 0.6 + 0.2 * gr()], fx = [0, 0.3, 0.55, 0.8, 1];
          const pts = [[x0, yn]].concat(fx.map((f, j) => [x0 + f * w, yn - th * hs[j]])).concat([[x0 + w, yn]]);
          top = Math.min(top, ...pts.map(p => p[1]));
          zi += K.PG(pts, 'f-imc rf01-gr');
        }
        zi = G(zi, tip(`Ni₃Sn₄ (IMC) — 지금 약 ${x.toFixed(2)} µm (예시). 바늘 · 조각 모양 알갱이가 Ni 위에 자란다`));
      }
      zi += L(IX0, NI0, IX1, NI0, 'rf01-ni0');
      if (liquid){
        for (let k = 0; k < 4; k++) zi += K.mover(1080 + k * 36, 236, 1080 + k * 36, top + 6, 9, 'rf01-sn', 2.6, k * 0.65);
        for (let k = 0; k < 3; k++) zi += K.mover(1250 + k * 30, yn + 70, 1250 + k * 30, 250, 9, 'rf01-ni', 3.2, k * 1.05);
      }
      const solNm = !melted ? 'SnAg 솔더 — 아직 고체' : s0.k === 'super' ? 'SnAg 솔더 — 과냉 액체 (아직 녹아 있음)' : liquid ? 'SnAg 솔더 — 녹아 있음' : 'SnAg 솔더 — 굳음';
      zi += T(848, 238, solNm, 'rf01-dk2', 'start');
      if (liquid) zi += T(848, 270, '↓ Sn이 내려와 반응', 'rf01-dk3', 'start') + T(1512, 238, '↑ Ni가 조금 녹아든다', 'rf01-dk3', 'end');
      else zi += T(848, 270, !melted ? '맞닿아 있을 뿐 — 반응이 거의 없다' : '굳은 뒤에는 아주 느리게 자란다 (05장)', 'rf01-dk3', 'start');
      zi += x > 0.004 ? T(848, top - 40, 'Ni₃Sn₄ (IMC)', 'rf01-dk2', 'start') + T(848, top - 14, `지금 ${x.toFixed(2)} µm (예시)`, 'rf01-dk3', 'start')
        : T(848, NI0 - 14, 'IMC 아직 없음', 'rf01-dk2', 'start');
      if (x > 0.004) zi += T(848, yn + 34, '점선 = 원래 Ni 윗면 (먹힌 만큼 내려감)', 'rf01-dk3', 'start');
      zi += T(1512, 584, 'Ni (방벽)', 'rf01-dk2', 'end');
      zi += L(848, 576, 848 + ZP, 576, 'rf01-bar2') + T(916, 582, '1 µm', 'rf01-dk3', 'start');
      z += `<clipPath id="${K.id('rf01-clip')}"><rect x="${IX0}" y="${IY0}" width="${IX1 - IX0}" height="${IY1 - IY0}" rx="12"/></clipPath>` + G(zi, {'clip-path': K.url('rf01-clip')}) + R(IX0, IY0, IX1 - IX0, IY1 - IY0, 'rf01-frame', {rx: 12});
      const ROWS = [['pl-hdg3', '이어 준다', 'IMC는 솔더와 Ni를 금속 결합으로 잇습니다. 이 층이 생겨야 단단히 붙습니다.'],
        ['pl-hdg2', '먹는다', '1 µm 자랄 때 Ni 약 0.26 µm · Sn 약 0.87 µm를 씁니다. 너무 두꺼우면 잘 깨지고, Ni가 다 먹히면 솔더가 Cu와 만납니다 (05장).'],
        ['pl-hdg', '쌓인다', '리플로우 · 본딩 · 고온 공정 · 시험의 열이 모두 더해집니다 (모든 열 이력의 합).']];
      let ry = 640;
      ROWS.forEach(([c, h, t]) => { const ln = K.wrap(t, 27.5); z += T(824, ry, h, c, 'start') + K.TT(948, ry, ln, 't-sub', 'start', 27); ry += ln.length * 27 + 22; });
      // IMC 두께 — 시간 (180~300 초 구간)
      const bx = t => 912 + (t - 180) / 120 * 580, byy = v => 1046 - v / 1.2 * 110, B0 = 878;
      z += R(824, B0, 712, 208, 'pl-box', {rx: 12}) + T(840, B0 + 30, 'IMC 두께 — 솔더가 액체인 동안 자란다 (개념 예시)', 't-dim', 'start');
      z += R(bx(PR.iup * DT), byy(1.2), bx(PR.isol * DT) - bx(PR.iup * DT), byy(0) - byy(1.2), 'pl-liqz', tip(`솔더가 액체인 동안 (약 ${LIQS}초, 과냉 포함)`));
      z += L(912, byy(0), 1500, byy(0), 's-axis') + L(912, byy(0), 912, byy(1.2) - 4, 's-axis');
      [180, 240, 300].forEach(v => { z += T(bx(v), byy(0) + 24, v === 300 ? '300 s' : String(v), 't-dim'); });
      z += L(906, byy(1), 912, byy(1), 's-axis') + T(900, byy(1) + 7, '1 µm', 't-dim', 'end') + T(900, byy(0) + 7, '0', 't-dim', 'end');
      let dd = '';
      for (let t = 180; t <= 300; t += 2) dd += (t > 180 ? ' L' : 'M') + bx(t).toFixed(1) + ',' + byy(PR.X[t / DT]).toFixed(1);
      z += P(dd, 's-curve', tip('IMC 두께 — x³ = ∫k(T)dt (액체인 동안만, 05장과 같은 예시 상수)'));
      if (st.t >= 180 && st.t <= 300) z += L(bx(st.t), byy(1.2), bx(st.t), byy(0), 's-acc2') + C(bx(st.t), byy(x), 7, 'k-acc2');
      else z += T(st.t < 180 ? 930 : 1492, st.t < 180 ? byy(1.2) + 18 : byy(0.5), st.t < 180 ? '← 지금은 아직 녹기 전' : '지금은 굳은 뒤 — 그대로 →', 't-warn', st.t < 180 ? 'start' : 'end');
      z += T(1500, byy(PR.X[PR.n]) - 12, `끝 ${PR.X[PR.n].toFixed(2)} µm`, 't-dim', 'end');
      jz.innerHTML = G(z, K.only('join'));
      mov.classList.toggle('hide', shape !== 'dome');
      oxl.classList.toggle('hide', shape !== 'wrin');
      ctx.refresh();
      // 카드
      ctx.out('k-T', `${T0.toFixed(1)} °C`);
      ctx.out('k-st', s0.nm);
      ctx.out('k-sh', shape === 'cyl' ? '원기둥' : shape === 'dome' ? '돔' : '쭈글쭈글');
      ctx.out('k-x', `${x.toFixed(2)} µm`);
      const ks = ctx.card.querySelector('[data-o="k-sh"]').parentNode;
      ks.classList.toggle('ok', shape === 'dome'); ks.classList.toggle('ng', shape === 'wrin');
      const kst = ctx.card.querySelector('[data-o="k-st"]').parentNode;
      kst.classList.toggle('warn', s0.k === 'super' || s0.k === 'mush'); kst.classList.toggle('ok', s0.k === 'liq');
      let msg;
      if (s0.k === 'solid0') msg = s0.ph === 'ramp' ? '승온 — 웨이퍼를 초당 약 2 °C로 천천히 데우는 중입니다. 솔더는 아직 도금한 원기둥 그대로입니다.'
        : s0.ph === 'soak' ? '예열 — 녹는점 아래(150~200 °C)에서 웨이퍼 온도를 고르게 맞추고 표면을 준비합니다 → <a data-go="profile.soak">02장</a>.'
        : '녹는점(221 °C)을 향해 다시 올리는 중입니다 — 아직 고체입니다.';
      else if (st.sf === 'ox' && s0.k !== 'solid') msg = `${s0.nm} — 하지만 산화막이 두꺼워 녹아도 둥글어지지 못합니다. 껍질에 갇힌 채 쭈글쭈글하게 남습니다 → <a data-go="oxide.film">03장</a>.`;
      else if (s0.k === 'mush') msg = '녹는 중 — 221~224 °C에서는 고체 Sn과 액체가 함께 있습니다 (Ag 2.5 %). 녹기 시작하자 곧 둥글어집니다.';
      else if (s0.k === 'liq') msg = `녹음 — 표면장력으로 둥글어지고, Ni와 반응해 IMC가 자랍니다 (지금 ${x.toFixed(2)} µm).`;
      else if (s0.k === 'super') msg = `${T0 < TE ? '221 °C 아래' : '다 녹는 온도(224 °C) 아래'}지만 아직 액체입니다(과냉). 약 191 °C에서 한꺼번에 굳습니다 → <a data-go="solid.under">06장</a>.`;
      else msg = st.sf === 'ox' ? `굳음 — 산화막에 갇힌 쭈글쭈글한 모양 그대로 굳었습니다 → <a data-go="oxide.film">03장</a>. IMC ${x.toFixed(2)} µm.`
        : `굳음 — 모양 · IMC는 이제 그대로입니다. 액체였던 시간 약 ${LIQS}초(221 °C 위 ${TAL}초 + 과냉), IMC ${x.toFixed(2)} µm (예시).`;
      ctx.q('[data-o=msg]').innerHTML = msg;
    }
    ctx.range('t', v => { st.t = v; render(); return `${v} s`; });
    ctx.seg('sf', (v, user) => { st.sf = v; if (user) touched = true; render(); });
    tin.addEventListener('input', () => { touched = true; });
    ctx.demo = sid => {
      if (touched || !(sid in DEMO)) return ctx.refresh();
      tin.value = DEMO[sid]; st.t = DEMO[sid]; ctx.out('t', `${st.t} s`);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['리플로우 (reflow)', '솔더를 녹는점 위로 올려 다시 흐르게(re-flow) 했다가 식혀 굳히는 공정'],
      ['솔더', '녹여서 붙이는 금속. 여기서는 Sn에 Ag를 조금(보통 1.5~2.5 wt%) 섞은 SnAg'],
      ['공정점(共晶)', '두 금속이 섞여 한 온도에서 한꺼번에 녹는 조성. Sn–Ag는 Ag 3.5 wt% · 221 °C. 공정(工程)과 다른 말'],
      ['액상선', '이 온도 위에서는 다 녹는 온도. Ag 2.5 wt%면 약 224 °C (순수 Sn은 231.9 °C)'],
      ['과냉 액체', '굳어야 할 온도 아래로 식었는데도 아직 액체인 상태. 굳기 시작할 씨앗이 없어서 생긴다 (06장)'],
      ['IMC (금속간 화합물)', 'Sn이 Ni · Cu와 정해진 비율로 결합한 단단한 층 (예: Ni₃Sn₄)'],
      ['산화막', '금속 겉이 산소와 결합해 생긴 아주 얇은 막. Sn은 SnO · SnO₂, 실온에서 수 nm'],
      ['프로파일', '시간에 따라 온도를 그린 곡선. 장비 설정값이 아니라 웨이퍼에서 잰 값이 기준 (02장)']
    ]) + K.field([
      '리플로우는 앞 공정의 결과를 <b>드러내는</b> 단계이기도 합니다. 솔더 부피 산포 · Ag % · 막 속 유기물 · 표면 산화는 리플로우 뒤 높이 · 덜 둥긂 · 보이드로 나타납니다 → <a data-go="defects.map">09장</a> · <a href="#go-plating-12">전해도금 12장</a>.',
      '리플로우 <b>전 · 후 높이를 따로</b> 기록합니다. 도금 직후 높이는 솔더 \'두께\', 리플로우 뒤 높이는 솔더 \'부피\'를 봅니다 → <a data-go="wet.volume">04장</a>.',
      '플라즈마 처리와 리플로우 사이 <b>대기 시간(Q-time)</b>이 길면 산화막이 다시 자랍니다. 장비가 멈춰 웨이퍼가 쌓이면 대기 시간부터 확인합니다 → <a data-go="oxide.plasma">03장</a> · <a href="#go-bump">범프 공정 탭</a>.',
      '캐리어(임시) 본딩 · 뒷면 공정은 보통 녹는점 아래(접착제가 견디는 온도 안)라 솔더를 녹이지 않지만, 고체 상태로 IMC가 조금 자랍니다. 적층 본딩(열압착 · 일괄 리플로우)에서는 솔더가 다시 녹습니다(아래 다이일수록 여러 번). IMC · Ni 소모 · Ag₃Sn은 <b>모든 열 이력의 합</b>으로 봅니다 → <a data-go="imc.budget">05장</a>.'
    ]) + K.deep(`<ul>
      <li><b>왜 웨이퍼에서 미리 녹이나</b> — 도금 솔더는 윗면이 거칠고(도금 Sn 거칠기 수백 nm 보고), PR 스트립 · 식각을 거치며 Sn 산화물 · 수산화물과 유기 찌꺼기를 품습니다. 미리 녹여 매끈한 돔 + 얇은 SnO 표면으로 만들어 두면 본딩 때 젖음 · 보이드가 좋아지고, 프로브 자국도 지워진다는 공개 설명이 있습니다. 본딩 때 처음 녹이는 공정도 있어(평평한 솔더로 열압착) 높이 기준 · 산화막 관리가 달라집니다.</li>
      <li><b>부피 보존</b> — 녹기 전 원기둥과 녹은 뒤 돔(구형 모자)의 부피가 같습니다.${K.eq('V = π·a²·H_c = π·h·(3a² + h²) / 6')}a 12.5 µm, H_c 12 µm → V ≈ 5,890 µm³(5.9 pL) → h ≈ 15.7 µm, 겉보기 각 2·atan(h/a) ≈ 103°. 두 식에서 ${K.eq('h / H_c = 6a² / (3a² + h²)')}그래서 꼭대기가 도금 높이보다 높아지는 것은 h < √3·a일 때(도금 높이 < 지름의 약 0.87배, 겉보기 각 120° 미만 — 이 예시 h/H_c ≈ 1.31, 아주 얇은 솔더는 2배에 가까움)입니다. 솔더를 지름에 비해 아주 높게 쌓으면 공처럼 옆으로 부풀어 꼭대기가 오히려 낮아집니다(예: 지름 25 · 도금 25 µm → 23.2 µm). 부피가 ±5 % 흩어지면 꼭대기는 약 ±0.47 µm(±3 %) — 리플로우 뒤 높이 산포는 대부분 도금 부피 산포입니다(<a data-go="wet.volume">04장</a>).</li>
      <li><b>무게는 거의 힘을 못 쓴다</b> — 본드 수 Bo = ρ·g·a²/γ ≈ 7,000 × 9.8 × (12.5×10⁻⁶)² / 0.5 ≈ 2×10⁻⁵(γ 약 0.5 N/m 예시). 무게가 표면장력의 약 5만분의 1이라 돔은 처지지 않고, 모양은 부피와 젖은 바닥(가장자리 고정)이 정합니다(<a data-go="wet.edge">04장</a>).</li>
      <li><b>녹는 범위</b> — Ag 2.5 wt%는 221 °C에서 공정 액체가 생기며 녹기 시작해 약 224 °C에서 다 녹습니다. 221 °C를 넘자마자 공정 반응으로 약 70 %(지렛대 규칙 2.5/3.5)가 액체가 되고, 남은 고체 Sn은 224 °C까지 몇 °C 동안 마저 녹습니다(<a href="#go-plating-10">전해도금 10장</a> 상태도) — 그래서 녹기 시작하자 곧 둥글어집니다. 리플로우 최고 온도는 보통 액상선보다 20~40 °C 높게(약 240~260 °C) 잡습니다. 식을 때는 굳을 씨앗이 없어 액상선보다 수십 °C 낮은 온도까지 과냉 액체로 남았다가 한꺼번에 굳습니다(이 예시 약 191 °C, <a data-go="solid.under">06장</a>) — 위젯의 '액체인 시간'(약 ${LIQS}초)이 221 °C 위 시간(${TAL}초)보다 긴 까닭입니다.</li>
      <li><b>시간 규모</b> — 표면장력이 모양을 바꾸는 시간 √(ρa³/γ) ≈ √(7000 × (12.5×10⁻⁶)³ / 0.5) ≈ 5 µs(ρ 약 7,000 kg/m³, γ 약 0.5 N/m, μ 약 2 mPa·s 예시). 녹은 Sn은 아주 묽어 오네조르게 수 Oh = μ/√(ργa) ≈ 0.01 ≪ 1이라, 모양 변화는 관성과 표면장력이 정합니다(점성 시간 μa/γ는 이 영역의 기준이 아님). 그래서 약 10 µs 주기(자유 방울의 레일리 l = 2 모드로 어림)로 출렁이고, 그 출렁임은 약 0.1 ms(ρa²/5μ, 램의 감쇠 시간)마다 1/e로 줄어 1 ms 안에 가라앉습니다. 프로파일의 수십 초에 비하면 순간이라, 시간이 드는 것은 열 전달 · 산화막 제거 · 기포 빠지기 · IMC 반응입니다.</li>
      <li><b>보이는 것과 안 보이는 것</b> — 외관 · 높이 검사로는 모양 · 광택 · 변색 · 브리지만 보입니다. 보이드 · IMC · Ag₃Sn · 결정은 X-ray · 단면 · FIB로만 보이고(결정 방향은 단면을 편광 현미경 · EBSD로), 수 µm 보이드는 2D X-ray로 놓치기 쉽습니다(<a data-go="void.stay">07장</a>).</li>
      <li><b>열 이력이 다시 쓰는 것</b> — 다시 녹일 때마다 모양 · 결정 · Ag₃Sn은 새로 정해지지만, IMC 성장 · Ni 소모 · Sn 소모(→ 남은 솔더의 Ag가 진해짐)는 쌓입니다. 위젯의 IMC는 x³ = ∫k(T)dt(액체인 동안, k(250 °C) = 1/60 µm³/s, 활성화 에너지 25 kJ/mol — 05장과 같은 가정값)로 셈한 개념 예시이고, 보고값은 조건에 따라 넓게 흩어집니다.</li></ul>`);
  },
  css: `.pl-svg .rf01-ox{fill:none;stroke:#94a3b8;stroke-width:7;opacity:.9;stroke-linejoin:round}
.pl-svg .rf01-oxs{stroke-width:4}
.pl-svg .rf01-oxw{stroke:#64748b;stroke-width:9}
.pl-svg .rf01-org{fill:#a3e635;stroke:#1a2e05;stroke-width:1}
.pl-svg .rf01-wr{fill:none;stroke:#475569;stroke-width:2.2}
.pl-svg .rf01-liq{fill:none;stroke:#fbbf24;stroke-width:2.4}
.pl-svg .rf01-sc{stroke-dasharray:8 6}
.pl-svg .rf01-liqg{fill:none;stroke:#fbbf24;stroke-width:9;opacity:.45;filter:var(--th-glow)}
.pl-svg .rf01-shine{fill:#fff;opacity:.2}
.pl-svg .rf01-gb{fill:none;stroke:#64748b;stroke-width:1.6;opacity:.85}
.pl-svg .rf01-ni0{stroke:#cbd5e1;stroke-width:1.2;stroke-dasharray:4 3;opacity:.8}
.pl-svg .rf01-sn{fill:#e2e8f0;stroke:#334155;stroke-width:1.5}
.pl-svg .rf01-ni{fill:#9aa6b5;stroke:#0f172a;stroke-width:1.5}
.pl-svg .rf01-tn{fill:none;stroke:#a78bfa;stroke-width:1.4;stroke-dasharray:4 5}
.pl-svg .rf01-tnt{font-size:19px;fill:#c4b5fd !important}
.pl-svg .rf01-scz{fill:rgba(167,139,250,.14)}
.pl-svg .rf01-sharp{stroke:#f8fafc;stroke-width:2}
.pl-svg .rf01-dk{font-size:19px;font-weight:800;fill:#0b1222 !important;stroke:none !important}
.pl-svg .rf01-brk{fill:none;stroke:#cbd5e1;stroke-width:2}
.pl-svg .rf01-bar2{stroke:#0b1222;stroke-width:4}
.pl-svg .rf01-mag{fill:none;stroke:#38bdf8;stroke-width:2.4}
.pl-svg .rf01-magl{stroke:#38bdf8;stroke-width:1.4;stroke-dasharray:6 5;opacity:.75}
.pl-svg .rf01-frame{fill:none;stroke:#38bdf8;stroke-width:2.4}
.pl-svg .rf01-gr{stroke:#4a3524;stroke-width:1.4;stroke-linejoin:round}
.pl-svg .rf01-tnk{fill:#a78bfa;stroke:#ede9fe;stroke-width:1}
.pl-svg .rf01-dk2{font-size:21px;font-weight:800;fill:#0b1222 !important;stroke:none !important}
.pl-svg .rf01-dk3{font-size:19px;font-weight:700;fill:#1e293b !important;stroke:none !important}
.pl-svg .rf01-now{font-size:21px;font-weight:800;fill:#7dd3fc !important}`
});
})();
