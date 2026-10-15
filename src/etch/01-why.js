/* 시드 식각 01 — 왜 지우나: 왜 시드를 지워야 할까? (웨이퍼 · 범프) */
(function(){
// 범프 단면(② 패널) — 지름 25 µm · 피치 55 µm · Cu 15 + Ni 3 + SnAg 12 µm (plans/shared.md (a)), 6.4 px/µm. 시드 두께만 크게 과장
const BX = [708, 1060, 1412], HW = 80;                                    // 범프 중심 x, 반폭 (25 µm → 160 px)
const Y_SN = 304, Y_NI = 381, Y_CU = 400, Y_SD = 496, Y_TI = 512, Y_PAS = 524, Y_PB = 560;   // SnAg 위 · Ni 위 · 기둥 위 · Cu 시드 위 · Ti 위 · 보호막 위 · 아래
const GAPS = [[788, 980], [1140, 1332]];                                  // 범프 사이 틈 (30 µm → 192 px)
// 위젯 개념 모델 (예시 상수) — 기획 01장 · 사실 표 F33~F36 · F52
const MET = {cu: {rho: 1.8e-8, l: 39, ox: 1, nm: 'Cu'}, ti: {rho: 5e-7, l: 5, ox: 3, nm: 'Ti'}};
const GW = 30 / 25, PC = 0.5927;                                          // 틈 ÷ 폭, 2차원 정사각 격자 스며들기 문턱
const R_SHORT = 1e4, R_OPEN = 1e8;                                        // 판정 경계 (개념 예시: 10 kΩ · 100 MΩ)
const TM_MIN = 0.5;                                                       // nm — 원자 약 두 층보다 얇은 금속은 이어진 막이 못 된다 (개념 가정)
const VN_B = {x: 556, y: 136, w: 1008, h: 520};                          // 좁은 세로 화면: ② 단면 패널만 크게
const DEMO = {short: {m: 'cu', t: 300, p: 100}, stack: {m: 'ti', t: 100, p: 100}, order: {m: 'ti', t: 10, p: 100}, keep: {m: 'ti', t: 4, p: 65}};
const tOf = v => Math.pow(10, v / 100 * 2.5), vOf = t => Math.round(Math.log10(t) / 2.5 * 100);   // 슬라이더 0~100 → 1~316 nm (로그)
// 잔여 섬 격자 (keep 단계 ③ 패널 왼쪽): 위에서 본 두 범프(반지름 150 = 지름 25 µm) 사이 틈 360 px(= 1.2 × 지름), 칸 20
const LX = 102, RX = 762, CY = 885, RB = 150, CS = 20, LY0 = 735, LY1 = 1035, SEED = 49;
// 저항 눈금 (로그 10⁻² ~ 10¹² Ω)
const SX0 = 870, SX1 = 1520, SY = 800, SH = 40;
const sx = r => SX0 + (Math.log10(r) + 2) / 14 * (SX1 - SX0);
// 숫자 모양
const n2 = v => { const s = Number(v.toPrecision(v < 1 ? 1 : 2)); return String(s); };
function fR(v){
  if (!isFinite(v)) return '∞';
  const U = [[1e9, 'GΩ'], [1e6, 'MΩ'], [1e3, 'kΩ'], [1, 'Ω']];
  for (const [d, u] of U) if (v >= d) return `${n2(v / d)} ${u}`;
  return `${n2(v)} Ω`;
}
function fI(v){
  const U = [[1, 'A'], [1e-3, 'mA'], [1e-6, 'µA'], [1e-9, 'nA']];
  for (const [d, u] of U) if (v >= d) return `${n2(v / d)} ${u}`;
  return `${n2(v * 1e12)} pA`;
}
const fT = t => t >= 10 ? String(Math.round(t)) : String(Number(t.toFixed(1)));
const VCLS = {short: 'pl-hdg2', leak: 'pl-warn', open: 'pl-hdg3', ox: 'pl-warn', isl: 'pl-hdg3', none: 'pl-hdg3'};
const VNAME = {short: '단락', leak: '누설', open: '분리', ox: '산화물 잔여', isl: '분리 (끊김)', none: '분리 (잔여 없음)'};
const VKPI = {short: 'ng', leak: 'warn', open: 'ok', ox: 'warn', isl: 'ok', none: 'ok'};

(window.EngrEtchChapters = window.EngrEtchChapters || []).push({
  no: '01', id: 'why', part: 1, short: '왜 지우나', scale: '웨이퍼 · 범프',
  title: '왜 지우나 — 왜 시드를 지워야 할까?',
  hook: '모든 범프가 한 막에 이어져 있다',
  one: '도금할 때 시드는 웨이퍼 전체에 전류를 나르는 전선이었습니다. 도금이 끝나면 이 막이 모든 범프를 서로 이어 놓는 \'단락\'이 됩니다. 시드 식각은 범프 밑만 남기고 나머지 시드를 녹여 범프를 하나씩 떼어 놓는 공정입니다.',
  ana: '<b>절취선 없는 우표 시트</b> — 우표(범프)가 모두 한 장의 종이(시드)에 붙어 있어서, 하나씩 쓰려면 우표 사이의 종이를 없애야 합니다. 다만 시드 식각은 가위가 아니라 \'녹이는 물\'이라, 우표 사이 종이를 다 녹이는 동안 우표 가장자리 밑도 조금 녹습니다(언더컷). <i>(비유의 한계: 우표와 달리 범프 밑 시드는 남아서 범프를 붙잡는 접착층이 되므로 다 떼면 안 됩니다. 또 종이 한 장이 아니라 Ti와 Cu 두 겹이라 두 번에 나눠 녹입니다.)</i>',
  steps: [
    {id: 'short', t: '시드는 하나의 전선', d: '도금할 때 시드는 웨이퍼 전체를 덮어, 가장자리 접점에서 모든 범프 자리까지 전류를 날랐습니다. PR을 벗긴 지금, 웨이퍼 한 장의 범프 수십만~수백만 개는 모두 이 막으로 이어져 전기로는 한 덩어리입니다.', viewN: VN_B},
    {id: 'stack', t: '시드의 속 — Ti + Cu', d: '시드는 두 겹입니다. 아래 Ti(보통 50~200 nm)는 보호막 · 패드와 Cu를 붙이고 Cu가 번지는 것을 막고, 위 Cu(보통 100~500 nm)는 도금 전류의 길이자 도금이 붙는 바탕입니다. 예시 값(Ti 100 + Cu 300 nm)을 합쳐도 범프 높이(30 µm)의 약 1/75입니다.', view: {x: 596, y: 286, w: 446, h: 364}, viewN: {x: 596, y: 286, w: 446, h: 364}},
    {id: 'order', t: 'Cu 먼저, Ti 나중', d: '두 겹은 녹이는 약품이 다릅니다. 먼저 Cu 식각액으로 Cu를 지우면 Ti에서 거의 멈추고, 이어서 Ti 식각액으로 Ti를 지웁니다. 단계마다 물로 헹궈 멈추고, 마지막에 돌려 말립니다.', viewN: VN_B},
    {id: 'keep', t: '남길 곳과 지울 곳', d: '범프 밑 시드는 남아 범프를 붙잡습니다. 범프 사이는 수~수십 nm 금속만 이어져 남아도 누설 · 단락이 됩니다. 덜 지우면 잔여, 더 지우면 밑동이 파이는 줄다리기 — 이 탭의 모든 이야기가 여기서 나옵니다.', viewN: VN_B}
  ],
  css: `
.pl-svg .et01-seedw{fill:rgba(224,144,79,.38);stroke:#f3b07a;stroke-width:1.5}
.pl-svg .et01-tiw{fill:rgba(141,150,171,.42);stroke:#c8cfdc;stroke-width:1.2}
.pl-svg .et01-cu{fill:#e0904f}
.pl-svg .et01-ti{fill:#8d96ab}
.pl-svg .et01-tiox{fill:#6b7280;opacity:.8}
.pl-svg .et01-path{stroke:#ef4444;stroke-width:2.4}
.pl-svg .et01-path2{stroke:#f59e0b;stroke-width:2.2;stroke-dasharray:4 3}
.pl-svg .et01-die{fill:#1e293b;stroke:#64748b;stroke-width:1}
.pl-svg .et01-bad{fill:rgba(239,68,68,.18);stroke:#ef4444;stroke-width:3}
.pl-svg .et01-ring{fill:rgba(239,68,68,.22);stroke:#ef4444;stroke-width:3}
.pl-svg .et01-keep{fill:none;stroke:#4ade80;stroke-width:2.6}
.pl-svg .et01-del{fill:rgba(239,68,68,.06);stroke:#f87171;stroke-width:2.4;stroke-dasharray:7 5}
.pl-svg .et01-probe{fill:none;stroke:#cbd5e1;stroke-width:1.6;stroke-dasharray:4 4}
.pl-svg .et01-tip{fill:#cbd5e1}
.pl-svg .et01-z2{fill:rgba(239,68,68,.34)}
.pl-svg .et01-z1{fill:rgba(245,158,11,.32)}
.pl-svg .et01-z0{fill:rgba(34,197,94,.30)}
.pl-svg .et01-pasv{fill:#2c7d6b;opacity:.45}
.pl-svg .et01-ifc{stroke:rgba(70,35,12,.75);stroke-width:1.4}
.pl-svg .et01-bk{font-size:21px;font-weight:800;fill:#0b1222 !important;stroke:none !important}
.pl-svg .et01-fade{transition:opacity .5s}
.pl-scene[data-step="stack"] .et01-fade{opacity:.07}
.pl-svg .et01-zd{font-size:13px;font-weight:800;fill:#0b1222 !important;stroke:none !important}
.pl-svg .et01-icl{fill:none;stroke:#ef4444;stroke-width:2.6;stroke-dasharray:3 2}
.pl-svg .et01-bt{font-size:21px;font-weight:800;fill:#f8fafc !important}
.jc .et01-w .kpi{flex:1 1 72px;min-width:0;padding:5px 7px}
.jc .et01-w .kpi .v{font-size:16px;white-space:nowrap}
.jc .et01-w .kpi .s{font-size:10px;line-height:1.3}
.jc .et01-msg{min-height:72px}
@media (max-width:520px){.jc .et01-w .kpi{flex:1 1 40%}}`,
  icon(K){
    const {R, P} = K;
    return R(4, 40, 58, 8, 'f-pas') + R(4, 34, 58, 6, 'f-seed2') + R(10, 14, 14, 20, 'f-cu2') + R(42, 14, 14, 20, 'f-cu2') + R(10, 7, 14, 7, 'f-sn2') + R(42, 7, 14, 7, 'f-sn2') + P('M25,37 L41,37', 'et01-icl');
  },
  draw(K){
    const {R, C, L, P, PG, T, TT, G, LB, tip, only, W, wrap} = K;
    const off = id => ({'data-off': id});
    let s = '';
    // ── ① 웨이퍼 패널 (확대 단계에서는 흐리게 — 넓은 화면에서 확대 상자 밖 큰 글 조각이 보이지 않게)
    let a = '';
    a += R(40, 130, 480, 522, 'pl-panel', {rx: 14});
    a += T(60, 166, '① 웨이퍼 — 모든 범프가 한 막 위에', 't-acc', 'start');
    a += C(280, 400, 200, 'f-wafer', tip('300 mm 웨이퍼 (그림은 다이 수를 크게 줄였다)\n실제는 다이 수백 개 · 범프 수십만~수백만 개'));
    let dies = '';
    for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++){
      if (Math.hypot(i * 42, j * 42) + 25.5 > 190) continue;
      const x = 280 + i * 42 - 18, y = 400 + j * 42 - 18;
      dies += R(x, y, 36, 36, 'et01-die', {rx: 3});
      for (let u = 0; u < 3; u++) for (let v = 0; v < 3; v++) dies += C(x + 8 + u * 10, y + 8 + v * 10, 3, 'f-sn2');
    }
    a += G(dies, tip('다이 — 다이마다 범프 수천 개 (점은 범프 묶음)'));
    a += C(280, 400, 196, 'et01-seedw', W(off('order'), tip('시드(Ti + Cu)가 웨이퍼 전체를 덮고 있다 — 모든 범프가 이 막으로 이어진다')));
    a += C(280, 400, 196, 'et01-tiw', W(only('order'), tip('Cu를 지운 뒤 — Ti가 아직 웨이퍼 전체를 덮어 범프를 잇는다')));
    let ct = '';
    for (let k = 0; k < 8; k++){
      const a = k * Math.PI / 4, x = 280 + 199 * Math.cos(a), y = 400 + 199 * Math.sin(a);
      ct += R(-9, -5, 18, 10, 'f-contact', {transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(k * 45 + 90) % 360})`});
    }
    a += G(ct, W(off('order'), tip('접점 — 도금 때 전류가 들어온 곳 (웨이퍼 가장자리 8곳 예시). 지금은 쓰지 않는다')));
    a += G(P('M90,400 L232,400', 's-flow') + P('M420,260 L318,362', 's-flow') + P('M280,592 L280,446', 's-flow') + P('M140,540 L242,438', 's-flow'), W(only('short'), tip('도금 때 전류의 길 — 가장자리 접점 → 시드 → 모든 범프 자리')));
    a += G(R(280 + 42 - 18, 400 - 42 - 18, 36, 36, 'et01-bad', {rx: 3}), W(only('keep'), tip('범프 사이 틈 하나만 잔여로 이어져도 그 다이는 불량 — 평균이 아니라 가장 나쁜 곳이 기준')));
    a += G(LB(T(280, 634, '도금 때: 가장자리 접점 → 시드 → 모든 범프', 't-dim')), {'data-off': 'order'});
    a += G(LB(T(280, 634, 'Cu는 지웠지만 Ti 막이 아직 전체를 잇는다', 't-warn')), only('order'));
    a += G(LB(T(280, 634, '식각 뒤 — 틈 하나만 이어져도 그 다이는 불량', 't-dim')), only('keep'));
    s += G(a, {class: 'et01-fade'});
    // ── ② 범프 단면 패널
    s += R(560, 130, 1000, 522, 'pl-panel', {rx: 14});
    s += G(G(T(580, 166, '② 범프 단면 — 시드가 범프를 모두 잇는다', 't-acc', 'start'), off('keep')) + G(T(580, 166, '② 범프 단면 — 식각 뒤: 남길 곳과 지울 곳', 't-acc', 'start'), only('keep')) + T(1540, 166, '두께 과장한 개념도', 't-dim', 'end'), {class: 'et01-fade'});
    s += R(580, Y_PAS, 960, Y_PB - Y_PAS, 'f-pas', tip('보호막(패시베이션) — 절연막. 범프 패드 자리만 열려 있다'));
    BX.forEach(c => { s += R(c - 60, Y_PAS, 120, Y_PB - Y_PAS, 'f-al', tip('패드 — 칩 안 배선과 범프를 잇는 금속 (보호막이 이 자리만 열려 있다)')); });
    s += R(580, Y_TI, 960, Y_PAS - Y_TI, 'f-ti', W(off('keep'), tip('Ti (접착 · 방벽층) — 보통 50~200 nm (TiW를 쓰기도). 보호막 · 패드와 Cu를 붙이고 Cu가 번지는 것을 막는다\n실제 수백 nm 이하 — 그림은 과장')));
    s += R(580, Y_SD, 960, Y_TI - Y_SD, 'f-seed2', W(off('order'), tip('Cu 시드 — 보통 100~500 nm. 도금 전류의 길이자 도금이 붙는 바탕\n실제 수백 nm — 그림은 과장')));
    // 범프 밑 시드 조각 (늘 남는다) — keep 단계에서는 밑동이 조금 파인 모습
    BX.forEach(c => {
      s += G(R(c - HW, Y_SD, 2 * HW, Y_TI - Y_SD, 'f-seed2') + R(c - HW, Y_TI, 2 * HW, Y_PAS - Y_TI, 'f-ti'), W(off('keep'), tip('범프 밑 시드 — 식각 뒤에도 남아 범프를 붙잡는다')));
      s += G(R(c - HW + 9, Y_SD, 2 * HW - 18, Y_TI - Y_SD, 'f-seed2') + R(c - HW + 13, Y_TI, 2 * HW - 26, Y_PAS - Y_TI, 'f-ti'), W(only('keep'), tip('범프 밑 시드 — 남아 범프를 붙잡는다. 가장자리가 조금 파였다(언더컷, 과장) → 04장')));
    });
    const sn = c => `M${c - HW},${Y_NI} L${c - HW},${Y_SN + 10} Q${c - HW},${Y_SN} ${c - HW + 10},${Y_SN} L${c + HW - 10},${Y_SN} Q${c + HW},${Y_SN} ${c + HW},${Y_SN + 10} L${c + HW},${Y_NI} Z`;
    BX.forEach(c => {
      s += R(c - HW, Y_CU, 2 * HW, Y_SD - Y_CU, 'f-cu2', tip('Cu 기둥 — 15 µm (예시)'));
      s += R(c - HW, Y_NI, 2 * HW, Y_CU - Y_NI, 'f-ni', tip('Ni 방벽 — 3 µm (예시)'));
      s += P(sn(c), 'f-sn2', tip('SnAg 솔더 — 12 µm, 리플로우 전이라 원기둥 (예시)'));
      s += L(c - HW, Y_SD, c + HW, Y_SD, 'et01-ifc');
    });
    // 측정 칩: 둘째 · 셋째 범프 사이 저항 (위젯 값이 모든 단계에 보인다)
    let ch = G(P(`M1290,226 L1290,252 L1060,${Y_SN - 6}`, 'et01-probe') + P(`M1490,226 L1490,252 L1412,${Y_SN - 6}`, 'et01-probe') + C(1060, Y_SN - 4, 5, 'et01-tip') + C(1412, Y_SN - 4, 5, 'et01-tip'),
      tip('두 범프 사이 저항을 재는 탐침 (개념 그림) — 값은 카드의 "직접 해 보기"'));
    ch += R(1220, 180, 320, 46, 'pl-tile2', W({rx: 10}, tip('범프 사이 저항 — 카드의 "직접 해 보기" 값 (개념 모델 · 예시)')));
    ch += LB(T(1206, 210, '범프 사이 저항', 't-dim', 'end'));
    s += G(ch + `<g data-v="chip"></g>`, {class: 'et01-fade'});
    // short: 시드를 따라 흐르는 전류 + 범프 사이 '단락'
    let sh = P(`M584,${Y_SD + 8} L1536,${Y_SD + 8}`, 's-flow');
    GAPS.forEach(([a, b]) => { const g = (a + b) / 2; sh += C(g, Y_SD + 8, 15, 'et01-ring') + T(g, Y_SD - 24, '단락', 'pl-warn'); });
    sh += LB(T(580, 600, 'Cu 300 nm 한 겹만으로도 범프 사이 ≈ 0.08 Ω — 전기로는 한 덩어리', 't-sub', 'start') + T(580, 632, '도금 때 전류의 길이던 막이, 이제는 모든 범프를 잇는 단락이다', 't-dim', 'start'));
    s += G(sh, W(only('short'), tip('시드를 따라 범프와 범프가 이어져 있다 — 단락')));
    // stack: 확대 이름표 (확대 단계용 작은 글)
    let st = L(800, Y_SN, 800, Y_SD, 's-axis') + L(794, Y_SN, 806, Y_SN, 's-axis') + L(794, Y_SD, 806, Y_SD, 's-axis');
    st += T(810, 330, '범프 높이 ≈ 30 µm', 'pl-zt', 'start') + T(810, 347, '(Cu 15 + Ni 3 + SnAg 12)', 'pl-zt', 'start');
    st += TT(818, 404, ['Cu 시드', '보통 100~500 nm', '도금 전류의 길이자', '도금이 붙는 바탕'], 'pl-zt', 'start', 17);
    st += P(`M884,${Y_SD + 6} L862,470`, 's-lead') + C(884, Y_SD + 6, 2.5, 'k-lead');
    st += P(`M612,${Y_TI + 6} L612,575`, 's-lead') + C(612, Y_TI + 6, 2.5, 'k-lead');
    st += T(BX[0], 346, 'SnAg 솔더', 'et01-zd') + T(BX[0], 395, 'Ni', 'pl-zt') + T(BX[0], 452, 'Cu 기둥 (도금)', 'pl-zt') + T(BX[0], 470, '시드 위에 쌓였다', 'pl-zt');
    st += T(620, 580, 'Ti — 보통 50~200 nm · 접착 · Cu 확산 방지', 'pl-zt', 'start') + T(620, 597, 'Ti 100 nm 한 겹만 남아도 범프 사이 ≈ 6 Ω (금속이다)', 'pl-zt', 'start');
    st += T(796, 547, '보호막 — 패드 자리만 열려 있다', 'pl-zt', 'start') + T(708, 547, '패드', 'et01-zd');
    st += T(620, 621, '그림의 시드 두께는 크게 과장 — 실제 Ti + Cu 약 0.4 µm', 'pl-zt', 'start') + T(620, 638, '= 범프 높이(30 µm)의 약 1/75', 'pl-zt', 'start');
    s += G(st, only('stack'));
    // order: Cu를 지운 뒤 — Ti 를 따라 아직 이어짐
    let od = P(`M584,${Y_TI + 6} L1536,${Y_TI + 6}`, 's-flow2');
    GAPS.forEach(([a, b]) => { const g = (a + b) / 2; od += C(g, Y_TI + 6, 15, 'et01-ring') + T(g, Y_SD - 24, '아직 이어짐', 'pl-warn'); });
    od += LB(T(580, 600, 'Cu를 지워도 Ti가 남으면 아직 이어져 있다 (Ti도 금속)', 't-warn', 'start') + T(580, 632, 'Ti가 10 nm만 이어져 남아도 범프 사이 ≈ 110 Ω — 단락 (오른쪽 위 측정)', 't-dim', 'start'));
    s += G(od, W(only('order'), tip('Cu를 지운 뒤 — 범프 사이 Ti 막이 아직 범프를 잇는다')));
    // keep: 남길 곳 · 지울 곳
    let kp = `<g data-v="res"></g>`;
    BX.forEach(c => { kp += R(c - HW - 4, Y_SD - 4, 2 * HW + 8, Y_PAS - Y_SD + 8, 'et01-keep', {rx: 4}) + T(c, Y_SD - 14, '남길 곳', 'pl-hdg3'); });
    [[584, 624], ...GAPS.map(([a, b]) => [a + 8, b - 8]), [1496, 1536]].forEach(([a, b]) => { kp += R(a, Y_SD - 4, b - a, Y_PAS - Y_SD + 8, 'et01-del', {rx: 4}); });
    GAPS.forEach(([a, b]) => { kp += T((a + b) / 2, Y_SD - 24, '지울 곳', 'pl-hdg2'); });
    kp += K.lead(BX[1] + HW - 3, Y_SD + 8, BX[1] + HW + 22, 418, '밑동 파임 → 04장', 'start', 't-dim');
    kp += LB(T(580, 600, '덜 지우면 잔여 · 누설 ↔ 더 지우면 밑동이 파인다 (언더컷 → 04장)', 't-sub', 'start') + T(580, 632, '범프 밑 시드는 남아 범프를 붙잡는다 — 그림의 파임은 과장', 't-dim', 'start'));
    s += G(kp, W(only('keep'), tip('초록 = 남길 곳(범프 밑) · 빨간 점선 = 지울 곳(범프 사이)')));
    // ── ③ 아래 패널 (확대 단계에서는 흐리게)
    const s0 = s.length;
    s += R(40, 676, 1520, 434, 'pl-panel', {rx: 14});
    // short · stack: 카드 3장 — 도금 때 전선 / 지금 단락 / 식각 뒤 분리
    const mini = (x, kind) => {
      const c1 = x + 150, c2 = x + 310, hw = 32, y = 834;     // 시드 위 y
      let m = R(x + 30, y + 14, 400, 20, 'f-pas');
      if (kind !== 'open') m += R(x + 30, y, 400, 8, 'f-seed2') + R(x + 30, y + 8, 400, 6, 'f-ti');
      [c1, c2].forEach(c => {
        m += R(c - hw, y, 2 * hw, 8, 'f-seed2') + R(c - hw, y + 8, 2 * hw, 6, 'f-ti');
        m += R(c - hw, y - 38, 2 * hw, 38, 'f-cu2') + R(c - hw, y - 46, 2 * hw, 8, 'f-ni') + R(c - hw, y - 77, 2 * hw, 31, 'f-sn2', {rx: 4});
      });
      if (kind === 'wire') m += R(x + 30, y - 2, 14, 18, 'f-contact') + P(`M${x + 48},${y + 4} L${x + 426},${y + 4}`, 's-flow') + T(x + 37, y - 12, '접점', 't-dim');
      if (kind === 'short') m += C((c1 + c2) / 2, y + 6, 13, 'et01-ring') + T((c1 + c2) / 2, y - 18, '단락', 'pl-warn');
      if (kind === 'open') m += T((c1 + c2) / 2, y - 18, '분리', 'pl-hdg3');
      return m;
    };
    const card = (x, title, kind, text, key, kcls, hl) => {
      let g = R(x, 696, 460, 400, hl ? 'pl-hlbox' : 'pl-box', {rx: 12}) + T(x + 20, 732, title, 't-acc', 'start') + mini(x, kind);
      g += TT(x + 20, 912, wrap(text, 19), 't-sub', 'start', 30);
      g += L(x + 20, 1036, x + 440, 1036, 's-faint') + T(x + 230, 1072, key, kcls);
      return g;
    };
    let cd = card(60, '도금 때 — 전선', 'wire', '가장자리 접점에서 들어온 전류가 시드를 타고 모든 범프 자리로 갔습니다. 시드가 얇을수록 가운데가 불리합니다 (터미널 효과 → 전해도금 07장).', '접점 → 시드 → 모든 범프', 't-acc');
    cd += card(560, '지금 (PR 스트립 뒤) — 단락', 'short', '모든 범프가 한 막 위에 서 있습니다. 범프 사이 ≈ 0.08 Ω (Cu 300 nm, 예시) — 전기로는 한 덩어리입니다.', '범프 사이 ≈ 0.08 Ω', 'pl-warn', true);
    cd += card(1060, '시드 식각 뒤 — 분리', 'open', '범프 사이에는 절연 보호막만 남습니다. 다이마다 범프가 수천 개 — 그 사이 틈 하나만 이어져도 그 다이는 불량입니다.', '범프 사이 > 100 MΩ (예시)', 'pl-hdg3');
    [520, 1020].forEach(x0 => { cd += K.arrow(x0 + 6, 896, x0 + 34, 896, 's-arr2'); });
    s += G(cd, {'data-off': 'order'});
    // order: 3장면 — 스트립 뒤 → Cu 식각 → Ti 식각
    // 3.84 px/µm: 지름 25 µm = 96 px, 피치 55 µm = 211 px, 높이 30 µm = 115 px (시드만 과장)
    const scene = (x, kind) => {
      const y = 906, c1 = x + 105, c2 = x + 316, hw = 48, gc = (c1 + c2) / 2;
      let m = R(x + 16, y + 20, 388, 26, 'f-pas');
      [c1, c2].forEach(c => { m += R(c - 34, y + 20, 68, 26, 'f-al'); });
      if (kind === 0) m += R(x + 16, y, 388, 12, 'f-seed2');
      if (kind <= 1) m += R(x + 16, y + 12, 388, 8, 'f-ti');
      [c1, c2].forEach(c => {
        const n = kind === 2 ? 4 : 0;
        m += R(c - hw + n, y, 2 * hw - 2 * n, 12, 'f-seed2') + R(c - hw + n, y + 12, 2 * hw - 2 * n, 8, 'f-ti');
        m += R(c - hw, y - 58, 2 * hw, 58, 'f-cu2') + R(c - hw, y - 70, 2 * hw, 12, 'f-ni') + R(c - hw, y - 115, 2 * hw, 45, 'f-sn2', {rx: 5}) + L(c - hw, y, c + hw, y, 'et01-ifc');
      });
      m += T(gc, y - 14, ['Cu + Ti', 'Ti만 남음', '보호막'][kind], ['t-sub', 't-warn', 'pl-hdg3'][kind]);
      return m;
    };
    let sc = '';
    [['시작 — PR 스트립 뒤', 'Ti + Cu가 웨이퍼 전체를 덮음', '모든 범프가 이어져 있다'],
     ['Cu 식각 뒤', 'Cu는 Ti에서 거의 멈춘다 (식각 멈춤층)', '범프 사이 Ti는 아직 금속 — 단락'],
     ['Ti 식각 뒤', '보호막이 드러나 범프마다 떨어짐', '마지막에 헹구고 돌려 말린다']].forEach(([t, c1, c2], k) => {
      const x = 60 + k * 530;
      sc += R(x, 700, 420, 290, k === 1 ? 'pl-hlbox' : 'pl-box', {rx: 12}) + T(x + 20, 736, t, 't-acc', 'start') + scene(x, k);
      sc += T(x + 210, 1032, c1, 't-sub') + T(x + 210, 1066, c2, k === 2 ? 'pl-hdg3' : 't-dim');
    });
    [['Cu 식각액', '→ 헹굼'], ['Ti 식각액', '→ 헹굼']].forEach(([a, b], k) => {
      const x0 = 486 + k * 530;
      sc += K.arrow(x0, 850, x0 + 92, 850, 's-arr2') + T(x0 + 46, 824, a, 't-dim') + T(x0 + 46, 886, b, 't-dim');
    });
    s += G(sc, W(only('order'), tip('시드 식각 순서 — Cu 식각 → 헹굼 → Ti 식각 → 헹굼 → 돌려 말리기 (범프 공정 탭 08과 같은 순서)')));
    // keep: 위에서 본 잔여 섬 + 저항 눈금 (위젯이 그린다)
    let kc = T(64, 714, '위에서 본 범프 사이 — 남은 시드 조각 (한 가지 예시 배치)', 't-acc', 'start');
    kc += `<clipPath id="et01-lclip"><rect x="64" y="730" width="736" height="310" rx="10"/></clipPath>`;
    kc += G(R(64, 730, 736, 310, 'et01-pasv') + C(LX, CY, RB, 'f-cu2') + C(LX, CY, RB - 6, 'f-sn2') + C(RX, CY, RB, 'f-cu2') + C(RX, CY, RB - 6, 'f-sn2'), {'clip-path': 'url(#et01-lclip)'});
    kc += R(64, 730, 736, 310, 's-edge', {rx: 10});
    kc += LB(T(150, 892, '범프', 'et01-bk') + T(714, 892, '범프', 'et01-bk'));
    kc += `<g data-v="isl" clip-path="url(#et01-lclip)"></g><g data-v="islmsg"></g>`;
    kc += L(820, 700, 820, 1090, 's-faint');
    kc += T(850, 714, '범프 사이 저항 (로그 눈금 · 개념 예시)', 't-acc', 'start');
    kc += R(SX0, SY, sx(R_SHORT) - SX0, SH, 'et01-z2') + R(sx(R_SHORT), SY, sx(R_OPEN) - sx(R_SHORT), SH, 'et01-z1') + R(sx(R_OPEN), SY, SX1 - sx(R_OPEN), SH, 'et01-z0');
    kc += R(SX0, SY, SX1 - SX0, SH, 's-edge');
    kc += LB(T((SX0 + sx(R_SHORT)) / 2, SY + 28, '단락', 'et01-bt') + T((sx(R_SHORT) + sx(R_OPEN)) / 2, SY + 28, '누설', 'et01-bt') + T((sx(R_OPEN) + SX1) / 2, SY + 28, '분리', 'et01-bt'));
    [[1, '1 Ω'], [1e3, '1 kΩ'], [1e6, '1 MΩ'], [1e9, '1 GΩ'], [1e12, '1 TΩ']].forEach(([v, t]) => {
      kc += L(sx(v), SY + SH, sx(v), SY + SH + 8, 's-axis') + T(sx(v), SY + SH + 30, t, 't-dim', v === 1e12 ? 'end' : 'middle');
    });
    kc += T(850, SY + SH + 62, '경계(예시): 10 kΩ · 100 MΩ — 1 V에서 0.1 mA · 10 nA', 't-dim', 'start');
    kc += `<g data-v="mk"></g><g data-v="read"></g>`;
    s += G(kc, only('keep'));
    s = s.slice(0, s0) + G(s.slice(s0), {class: 'et01-fade'});
    return s;
  },
  body(K){
    return `<div class="pl-w et01-w"><div class="hd">직접 해 보기 — 남은 시드와 범프 사이 저항</div>
      ${K.seg('m', [['ti', 'Ti'], ['cu', 'Cu']], 'ti', '남은 금속')}
      ${K.ctl('t', '남은 두께', 0, 100, 1, 40)}${K.ctl('p', '덮인 비율 (조각이 덮은 넓이)', 0, 100, 1, 100)}
      ${K.kpis([['남은 금속', 'k-tm', '겉 산화막을 뺀 두께'], ['면저항', 'k-rs', '비저항 ÷ 두께'], ['범프 사이', 'k-r', '틈 30 µm · 폭 25 µm'], ['1 V 전류', 'k-i', ''], ['판정', 'k-v', '개념 예시']])}
      <p class="pl-msg et01-msg" data-o="msg"></p>
      ${K.model('남은 금속 t<sub>m</sub> = t − 겉 산화막(Ti 3 · Cu 1 nm, 예시). t<sub>m</sub>이 0.5 nm(원자 약 두 층)보다 얇으면 이어진 금속 막으로 보지 않습니다(산화물 잔여). 면저항 Rs = ρ₀(1 + 3ℓ/8t<sub>m</sub>) ÷ t<sub>m</sub> — 막이 전자의 평균 자유 행로보다 두꺼울 때 맞는 근사라, 아주 얇으면 실제 저항은 더 큽니다(\'적어도 이만큼\'). R = Rs × (틈 30 ÷ 폭 25 µm — 범프 지름만 한 띠로 본 어림) ÷ G, G = ((p − 0.593) ÷ 0.407)<sup>1.3</sup>(스며들기). 장면의 예시 배치에 이어진 길이 없으면 분리, 길이 있으면 G ≥ 0.01. Cu ρ₀ 1.8×10⁻⁸ Ω·m · ℓ 39 nm, Ti ρ₀ 5×10⁻⁷ Ω·m · ℓ 5 nm. 경계 10 kΩ · 100 MΩ도 개념 예시이고, 실제 기준은 제품 · 시험 규격이 정합니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, PG, T, G, LB, tip, rng} = K;
    const st = {m: 'ti', t: 10, p: 100};
    let touched = false;
    const tIn = ctx.card.querySelector('input[data-i=t]'), pIn = ctx.card.querySelector('input[data-i=p]');
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    // 격자 칸 (한 번만): 두 범프 원 밖, 두 범프 중심 사이. u < p 이면 시드 조각이 남은 칸
    const g = rng(SEED), cells = [], NC = Math.round((RX - LX) / CS), NR = Math.round((LY1 - LY0) / CS);
    for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++){
      const x = LX + (c + 0.5) * CS, y = LY0 + (r + 0.5) * CS, u = g();
      const dl = Math.hypot(x - LX, y - CY), dr = Math.hypot(x - RX, y - CY);
      if (dl < RB + CS * 0.5 || dr < RB + CS * 0.5) continue;
      cells.push({r, c, x, y, u, L: dl < RB + CS * 1.5, R: dr < RB + CS * 1.5});
    }
    // 왼쪽 범프에 닿은 칸에서 오른쪽 범프에 닿은 칸까지 이어진 가장 짧은 길 (4이웃)
    function spanPath(p){
      const map = new Map();
      cells.forEach(o => { if (o.u < p) map.set(o.r * NC + o.c, o); });
      const q = [], prev = new Map();
      for (const [k, o] of map) if (o.L){ q.push(k); prev.set(k, -1); }
      for (let i = 0; i < q.length; i++){
        const k = q[i], o = map.get(k);
        if (o.R){ const path = new Set(); for (let j = k; j !== -1; j = prev.get(j)) path.add(j); return path; }
        for (const [dr, dc] of [[0, 1], [1, 0], [-1, 0], [0, -1]]){
          const rr = o.r + dr, cc = o.c + dc;
          if (cc < 0 || cc >= NC) continue;
          const kk = rr * NC + cc;
          if (map.has(kk) && !prev.has(kk)){ prev.set(kk, k); q.push(kk); }
        }
      }
      return null;
    }
    function calc(){
      const M = MET[st.m], p = st.p / 100, tm = Math.max(0, st.t - M.ox);
      const metal = Math.round(tm * 10) / 10 >= TM_MIN;                    // 화면에 보이는 0.1 nm 값으로 판정 (보이는 숫자와 판정이 어긋나지 않게)
      const o = {M, p, tm, metal, Rs: Infinity, R: Infinity, G: 0, path: null, kind: ''};
      if (metal) o.Rs = M.rho * (1 + 3 * M.l / (8 * tm)) / (tm * 1e-9);
      if (p <= 0){ o.kind = 'none'; return o; }
      o.path = spanPath(p);
      if (!o.path){ o.kind = 'isl'; return o; }
      if (!metal){ o.kind = 'ox'; return o; }
      o.G = p >= 1 ? 1 : p > PC ? Math.max(0.01, Math.pow((p - PC) / (1 - PC), 1.3)) : 0.01;
      o.R = o.Rs * GW / o.G;
      o.kind = o.R < R_SHORT ? 'short' : o.R < R_OPEN ? 'leak' : 'open';
      return o;
    }
    function render(){
      const o = calc(), M = o.M, k = o.kind, vc = VCLS[k];
      const fcls = !o.metal ? 'et01-tiox' : st.m === 'cu' ? 'et01-cu' : 'et01-ti';
      const rTxt = k === 'short' || k === 'leak' || k === 'open' ? `R ≈ ${fR(o.R)}` : k === 'ox' ? '금속 길 없음' : '이어진 길 없음';
      // ② 측정 칩
      ctx.$('[data-v="chip"]').innerHTML = LB(T(1380, 211, `${rTxt} — ${VNAME[k].replace(/ \(.*\)/, '')}`, vc));
      // ② keep: 범프 사이 단면의 잔여 (격자의 가운데 줄 두 개를 단면으로)
      const hgt = Math.max(2, 2 + 2.4 * Math.log10(st.t));
      let rs = '';
      GAPS.forEach(([a, b], gi) => {
        const row = gi ? 6 : 7, xs = cells.filter(c => c.r === row && c.x > LX + RB && c.x < RX - RB);
        const w = (b - a) / Math.max(1, xs.length);
        xs.forEach((c, i) => { if (c.u < o.p) rs += R(a + i * w, Y_PAS - hgt, w + 0.4, hgt, fcls); });
      });
      ctx.$('[data-v="res"]').innerHTML = G(rs, tip(`범프 사이에 남은 ${M.nm} 조각 (단면, 두께 과장)`));
      // ③ keep: 위에서 본 잔여 섬
      let is = '';
      cells.forEach(c => {
        if (c.u >= o.p) return;
        const onp = o.path && o.path.has(c.r * NC + c.c);
        is += R(c.x - 9, c.y - 9, 18, 18, fcls + (onp ? (o.metal ? ' et01-path' : ' et01-path2') : ''), {rx: 2});
      });
      ctx.$('[data-v="isl"]').innerHTML = G(is, tip(!o.path ? '남은 시드 조각 — 이어지면 길이 된다' : o.metal ? '남은 시드 조각 — 빨간 테두리 칸이 범프와 범프를 잇는 잔여 길(누설 · 단락)' : '남은 조각 — 이어져 있지만 산화막이라 금속 길은 아니다(주황 점선)'));
      const im = k === 'none' ? ['남은 시드 없음 — 보호막만 드러남', 'pl-hdg3']
        : !o.path ? [`이어진 길 없음 — 끊김 (덮인 비율 ${st.p} %, 문턱 약 59 %)`, 'pl-hdg3']
        : k === 'ox' ? ['조각은 이어졌지만 산화막 — 이어진 금속 길은 없음', 'pl-warn']
        : [`빨간 테두리 = 범프와 범프를 잇는 ${M.nm} 잔여 길`, 'pl-hdg2'];
      ctx.$('[data-v="islmsg"]').innerHTML = LB(T(432, 1076, im[0], im[1]));
      // ③ keep: 저항 눈금 위 표시
      let mk = '';
      if (isFinite(o.R)){
        const x = Math.max(SX0, Math.min(SX1, sx(o.R))), an = x < 980 ? 'start' : x > 1410 ? 'end' : 'middle', tx = an === 'start' ? x - 14 : an === 'end' ? x + 14 : x;
        mk = PG([[x - 13, SY - 30], [x + 13, SY - 30], [x, SY - 4]], 'k-acc2') + LB(T(tx, SY - 42, `${rTxt} — ${VNAME[k]}`, vc, an));
      } else {
        const x0 = k === 'ox' ? sx(1e6) : sx(1e9);
        mk = K.arrow(x0, SY - 18, SX1 - 4, SY - 18, k === 'ox' ? 's-arr2' : 's-arrg', {'stroke-dasharray': '7 6'}) + LB(T(SX1, SY - 42, k === 'ox' ? '금속 길 없음 — 누설은 측정으로' : k === 'none' ? '잔여 없음 — 분리' : '끊김 — 분리 쪽 (> 100 MΩ)', vc, 'end'));
      }
      ctx.$('[data-v="mk"]').innerHTML = G(mk, tip('지금 위젯 값의 범프 사이 저항 (개념 모델)'));
      const allOx = st.t <= M.ox;
      const lines = [
        k === 'none' ? `남은 ${M.nm} 조각 없음 (덮인 비율 0 %)` : allOx ? `남은 ${M.nm} ${fT(st.t)} nm → 모두 산화막 (금속 0 nm)` : `남은 ${M.nm} ${fT(st.t)} nm → 금속 ${fT(o.tm)} nm (겉 약 ${M.ox} nm는 산화막)`,
        k === 'none' ? '두께와 상관없이 잔여 길이 없다' : o.metal ? `면저항 ${fR(o.Rs)}/□ · 덮인 비율 ${st.p} %` : allOx ? `금속 길 없음 · 덮인 비율 ${st.p} %` : `금속 ${fT(o.tm)} nm — 이어진 금속 막이 못 됨 · 덮인 비율 ${st.p} %`,
        isFinite(o.R) ? `1 V에서 전류 ≈ ${fI(1 / o.R)}` : k === 'ox' ? '누설은 산화물 · 오염 · 습기가 정한다' : '1 V에서 전류 < 10 nA 쪽'
      ];
      const why = {short: st.t >= 30 ? '금속 막이 거의 그대로 이어져 있다 — 단락' : '눈에 안 보일 두께라도 이어진 금속이면 단락이다', leak: '단락은 아니지만 새는 전류 — 신호 · 전원 범프 사이의 문제', open: '길은 있지만 저항이 매우 크다 — 습기 · 전압에서 바뀔 수 있다',
        ox: '남은 것은 거의 산화막 — 누설은 측정으로 확인한다', isl: '조각이 범프와 범프를 잇지 못한다 — 습기 · 전압에서 바뀔 수 있다', none: '범프 사이에는 절연 보호막만 남았다'}[k];
      ctx.$('[data-v="read"]').innerHTML = LB(K.TT(850, 958, lines, 't-sub', 'start', 34) + T(850, 1076, why, 't-dim', 'start'));
      // 카드
      ctx.out('k-tm', k === 'none' ? '—' : `${fT(o.tm)} nm`);
      ctx.out('k-rs', k !== 'none' && o.metal ? `${fR(o.Rs)}/□` : '—');
      ctx.out('k-r', isFinite(o.R) ? fR(o.R) : k === 'ox' ? '측정으로' : '> 100 MΩ');
      ctx.out('k-i', isFinite(o.R) ? fI(1 / o.R) : k === 'ox' ? '—' : '< 10 nA');
      ctx.out('k-v', VNAME[k].replace(/ \(.*\)/, ''));
      const kv = ctx.card.querySelector('[data-o="k-v"]').closest('.kpi');
      ['ok', 'warn', 'ng'].forEach(c => kv.classList.toggle(c, VKPI[k] === c));
      const thin = st.t < 30 ? ' 눈으로는 안 보일 두께입니다.' : '';
      ctx.q('[data-o=msg]').innerHTML = k === 'short' && st.t >= 30 ? `${M.nm} ${fT(st.t)} nm가 이어져 있으면 범프 사이는 약 ${fR(o.R)} — <b>단락</b>입니다(1 V에 ${fI(1 / o.R)}). 이만큼 두꺼우면 겉 산화막(약 ${M.ox} nm)은 거의 영향이 없습니다.`
        : k === 'short' ? `${M.nm}가 ${fT(st.t)} nm 이어져 남으면 겉 약 ${M.ox} nm는 산화막이 되고, 남은 금속 ${fT(o.tm)} nm로도 범프 사이가 약 ${fR(o.R)} — <b>단락</b>입니다(1 V에 ${fI(1 / o.R)}).${thin}`
        : k === 'leak' ? `범프 사이 약 ${fR(o.R)} — <b>누설</b>입니다. 단락은 아니지만 1 V에서 ${fI(1 / o.R)}가 샙니다. 남은 금속 ${fT(o.tm)} nm · 덮인 비율 ${st.p} % — 얇고 듬성듬성해도 이어져 있으면 길이 됩니다.`
        : k === 'open' ? `범프 사이 약 ${fR(o.R)} — <b>분리</b> 쪽입니다. 하지만 이어진 금속 길이 있으니 습기 · 전압 · 열에서 바뀔 수 있습니다.`
        : k === 'ox' ? (allOx ? `${M.nm} ${fT(st.t)} nm는 겉 산화막 두께(약 ${M.ox} nm)보다 얇아 모두 산화막이 되고, 금속 길이 없습니다.` : `${M.nm} ${fT(st.t)} nm 가운데 겉 약 ${M.ox} nm는 산화막이 되고, 남은 금속 ${fT(o.tm)} nm는 원자 두어 층도 안 되어 이어진 금속 막이 되지 못합니다.`) + ' 하지만 산화막 · 이온 오염 · 습기가 누설 길이 될 수 있어 <b>측정으로</b> 확인합니다.'
        : k === 'isl' ? `덮인 비율 ${st.p} % — 남은 조각이 범프와 범프를 잇지 못합니다(이어진 길 없음, 문턱 약 59 %). <b>분리</b> 쪽이지만 조각이 늘거나 습기 · 전압이 걸리면 바뀔 수 있습니다.`
        : '남은 시드가 없습니다 — 범프 사이에는 절연 보호막만 있습니다(<b>분리</b>).';
      ctx.refresh();
    }
    ctx.seg('m', v => { st.m = v; render(); });
    ctx.range('t', v => { st.t = tOf(v); render(); return `${fT(st.t)} nm`; });
    ctx.range('p', v => { st.p = v; render(); return `${v} %`; });
    // 손으로 움직이면 그 값을 그대로 두고, 섬 그림 · 눈금이 보이는 keep 단계로
    const touch = () => { touched = true; const sid = ctx.step(); if (sid && sid !== 'keep') ctx.go('keep'); };
    ctx.card.querySelectorAll('.et01-w input').forEach(i => i.addEventListener('input', touch));
    ctx.card.querySelectorAll('.et01-w .pl-seg button').forEach(b => b.addEventListener('click', touch));
    ctx.demo = sid => {
      const d = DEMO[sid];
      if (touched || !d) return ctx.refresh();
      st.m = d.m; st.t = d.t; st.p = d.p;
      setSeg('m', d.m);
      tIn.value = vOf(d.t); ctx.out('t', `${fT(d.t)} nm`);
      pIn.value = d.p; ctx.out('p', `${d.p} %`);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['시드 (시드층)', '도금 전에 PVD(스퍼터)로 웨이퍼 전체에 까는 얇은 금속막. 도금 전류의 길이자 도금이 붙는 바탕 (보통 Ti 50~200 nm + Cu 100~500 nm, 그림 · 위젯 예시 Ti 100 nm + Cu 300 nm)'],
      ['Ti (접착 · 방벽층)', '보호막 · 패드와 Cu를 붙이고 Cu가 아래로 번지는 것을 막는 층. TiW(Ti–W 합금)를 쓰기도 한다'],
      ['보호막 (패시베이션)', '칩 위를 덮는 절연막 — 산화막 · 질화막 · 폴리이미드 등. 패드 자리만 열려 있고, 시드 식각 뒤 범프 사이에 드러난다'],
      ['습식 식각', '액체 약품(식각액)으로 재료를 녹여 없애는 일 (↔ 건식: 플라즈마 · 이온빔)'],
      ['단락 · 누설', '단락 = 떨어져 있어야 할 두 전극이 낮은 저항으로 이어짐. 누설 = 저항은 크지만 무시 못 할 만큼 전류가 샘'],
      ['면저항 (Rs, Ω/□)', '막의 저항을 정사각형 한 칸 기준으로 나타낸 값 = 비저항 ÷ 두께. 정사각형 크기와 상관없다. 4탐침으로 잰다'],
      ['식각 멈춤층', '위 막을 지우는 액에 잘 안 녹아 식각이 거기서 멈추게 해 주는 아래 막 (Cu 식각에서 Ti)'],
      ['언더컷', '범프 밑동 아래가 옆으로 파여 들어간 것 (→ <a data-go="under">04장</a>)']
    ]) + K.field([
      '시드 식각 뒤에는 <b>외관</b>(잔여 · 범프 손상)과 <b>전기</b>(테스트 패턴의 누설 · 절연)를 함께 봅니다. 몇 nm 잔여는 눈에도, 보통 SEM-EDS(전자 현미경에서 원소를 보는 분석 — 신호가 수백 nm 깊이에서 나와 몇 nm 막은 묻힘)에도 잘 안 잡혀 누설 시험 패턴으로 먼저 봅니다 → <a data-go="defects.resid">09장</a>.',
      '시드 두께는 PVD(<span class="pl-tag up">앞 공정</span>)가 정하고, 도금 균일도와 식각 시간을 함께 바꿉니다. 두꺼우면 도금(터미널 효과)에는 좋고 식각(시간 · 언더컷)에는 불리합니다 → <a href="#go-plating-07">전해도금 07장</a>.',
      'PR 스트립에서 남은 찌꺼기는 시드를 가려 그 자리만 안 녹습니다. 시드 식각의 잔여는 스트립 결과와 함께 봅니다 → <a href="#go-strip-08">PR 스트립 08장</a>.',
      '범프 공정 순서처럼 시드 식각 뒤에는 플라즈마 처리 → 리플로우가 이어집니다. 식각 · 헹굼 중에 생긴 솔더 표면 산화는 이 단계들에서 다룹니다 → <a href="#go-bump">범프 공정</a> · <a href="#go-reflow-03">리플로우 03장</a>.'
    ]) + K.deep(`<ul>
      <li><b>왜 전면 시드인가</b> — 전해도금은 모든 범프 자리에 전기가 닿아야 하므로 웨이퍼 전체에 시드를 깔고(전면 시드 → PR 패턴 → 도금 → PR 제거 → 시드 제거), 이 순서를 세미 애디티브(semi-additive) 방식이라 부릅니다. 시드 제거는 이 방식의 피할 수 없는 마지막 단계입니다.</li>
      <li><b>저항 예시</b> (피치 55 µm · 지름 25 µm · 틈 30 µm): ${K.eq('R = Rs × 틈 ÷ 폭 = (ρ ÷ t) × 30 ÷ 25')} 범프 지름만 한 띠로 본 어림입니다 — 막이 전면으로 이어져 있으면 전류가 옆으로도 퍼져 실제 저항은 이보다 작습니다(단락 판정은 더 확실해짐). Cu 300 nm(ρ ≈ 1.9×10⁻⁸ Ω·m) → Rs ≈ 0.063 Ω/□ → R ≈ 0.08 Ω. Ti 100 nm(ρ ≈ 5×10⁻⁷) → Rs ≈ 5 Ω/□ → R ≈ 6 Ω. Ti가 10 nm 이어져 남으면 겉 약 3 nm는 산화막이 되고, 남은 금속 7 nm로도 약 110 Ω — 단락입니다. Ti 4 nm(금속 1 nm)가 65 %만 덮여도 약 22 kΩ(1 V에 약 45 µA) — 누설입니다.</li>
      <li><b>아주 얇은 막</b> — 막이 전자의 평균 자유 행로(Cu 약 39 nm)만큼 얇아지면 표면 · 결정 경계 산란으로 비저항이 커집니다. 위젯의 ρ₀(1 + 3ℓ/8t)는 막이 평균 자유 행로보다 두꺼울 때 맞는 근사(Fuchs–Sondheimer)이고, 더 얇으면 실제 비저항은 이보다 큽니다. 몇 nm 아래에서는 막이 섬처럼 끊겨 '이어졌나'가 저항을 정합니다: 2차원 정사각 격자 문턱 p<sub>c</sub> ≈ 0.593, 문턱 위 전도도 ∝ (p − p<sub>c</sub>)<sup>1.3</sup>. 유한한 영역에서는 문턱 근처에서 길이 있기도 없기도 해, 위젯은 장면의 예시 배치로 판정합니다.</li>
      <li><b>얇은 잔여는 산화된다</b> — Ti 자연 산화막은 수 nm이고, TiO₂/Ti 의 Pilling–Bedworth 비가 약 1.7이라 산화막 3~5 nm가 생기면 금속 Ti 약 2~3 nm가 사라집니다. Cu도 자연 산화막(Cu₂O) 1~2 nm가 금속 약 1 nm를 먹습니다. 그래서 1~3 nm 잔여는 금속 길이라기보다 산화물입니다. 하지만 산화물 · 이온 오염은 습기 · 전압 · 열에서 누설이 바뀔 수 있어 믿고 둘 수 없습니다. 잔여 판정은 '안 보임'이 아니라 '측정으로 없음'입니다.</li>
      <li><b>판정 경계</b> — 위젯의 단락 &lt; 10 kΩ(1 V에서 0.1 mA 넘음) · 누설 10 kΩ~100 MΩ · 분리 &gt; 100 MΩ는 개념 예시입니다. 표면 절연 저항 시험의 판정 예로 10⁸ Ω가 쓰이지만, 실제 기준은 제품 · 시험 규격이 정합니다.</li>
      <li><b>꼬리가 기준</b> — 다이 하나에 범프가 수천 개(공개 예: HBM 시험 배열 약 4천 개), 웨이퍼에는 수십만~수백만 개입니다. 범프 사이 틈 하나만 이어져도 그 다이는 불량이므로 평균 잔여가 아니라 가장 나쁜 곳이 기준이 됩니다 (→ <a data-go="end.time">07장</a>).</li>
      <li><b>다른 길</b> — 습식 대신 이온빔 · 플라즈마로 시드를 지우거나(건식), 전기로 녹이는(전해 식각) 방법도 연구 · 사용됩니다. 6 µm 피치처럼 아주 작은 범프에서는 습식 언더컷 때문에 건식(이온빔) 제거를 쓴 공개 연구가 있습니다.</li></ul>`);
  }
});
})();
