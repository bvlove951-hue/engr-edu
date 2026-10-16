/* 리플로우 04 — 둥글어지기: 녹은 솔더는 왜 둥글어지고, 어디서 멈출까? (범프 · µm)
   범프(예시): 베이스 다이 Cu 기둥 12 + Ni 3 + 상부 Cu 3 + SnAg 12 µm, 코어 다이 Ni 5 + SnAg 12 µm.
   솔더가 젖는 바닥 = 맨 위 금속 (베이스 상부 Cu · 코어 Ni). 지름 · SnAg가 같아 두 다이의 부피 · 돔은 같다. */
(function(){
const RAD = Math.PI / 180, q = v => Math.round(v * 10) / 10;
const TOP = {b: '상부 Cu', k: 'Ni'};                    // 솔더가 처음 만나는 금속
const TH = {b: {c: 30, o: 70, x: 140}, k: {c: 40, o: 70, x: 140}};   // 맨 위 금속/SnAg 계면 젖음 각 (가정값 — 깨끗한 Cu가 Ni보다 조금 잘 젖음)
const SFN = {c: d => `깨끗한 ${TOP[d]}`, o: () => '얇은 산화', x: () => '계면 산화 · 오염'};
const SFW = {c: '잘 젖음', o: '덜 젖음', x: '안 젖음 (공처럼)'};
const TSIDE = 15, TF = 1.5, GAM = 0.5;                 // 깨끗한 옆면 각(가정), 옆면 막 두께(가정), 표면장력 N/m(예시)
// 솔더 밑 금속 층 (아래부터, µm · 예시)
const STK = {b: [['cu', 12], ['ni', 3], ['tc', 3]], k: [['ni', 5]]};
const HS = {b: 18, k: 5};                              // 솔더 밑 금속 높이
const DIEN = {b: '베이스 다이', k: '코어 다이'}, DIES = {b: 'Cu / Ni / Cu / SnAg', k: 'Ni / SnAg'};
const LTIP = {cu: 'Cu 기둥 (12 µm) — 높이 · 전기. 옆면이 깨끗하면 솔더가 타고 내려올 수 있다', tc: '상부 Cu (3 µm, Ni 위에 얇게 한 번 더 올린 Cu) — 솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로. 옆면도 잘 젖는다',
  ni: {b: 'Ni (3 µm) — Cu 기둥과 솔더 사이 방벽. 산화된 옆면은 잘 안 젖는다', k: 'Ni (5 µm) — 몸통 겸 방벽 (Cu 기둥 없음). 윗면이 솔더가 젖는 바닥'}};
// 모서리 한계 각: 바로 아래 옆면이 젖으면 옆면 각 + 90°, 안 젖으면 180° 넘음(999). 베이스는 상부 Cu 옆면이 늘 젖는다(Cu 산화막은 잘 걷힘)
const LIM = (die, sw) => die === 'b' || sw === 'cl' ? TSIDE + 90 : 999;
// 흘러내린 막이 멈추는 길이 (µm) = 젖는 옆면이 끝나는 곳 (sw = Ni 옆면 상태, Cu 옆면은 늘 젖음): 베이스 산화 → Ni 앞(상부 Cu 3) · 깨끗 → Ni 지나 기둥 밑 18, 코어 깨끗 → Ni 밑동 5
const LMAX = (die, sw) => die === 'b' ? (sw === 'cl' ? 18 : 3) : (sw === 'cl' ? 5 : 0);
const BXC = 510, YB = 1000;                            // 두 범프 가운데 x, 범프 바닥 y
const DEF = {d: 25, hc: 12, sf: 'c', sw: 'ox', p: 55, die: 'b'};
// 손대지 않았을 때 단계마다 보여 줄 값 (발표 모드 대비) — 기본값 + 적힌 값만
const DEMO = {tension: {}, volume: {}, angle: {sf: 'x'}, edge: {hc: 14}, dies: {die: 'k'}};
const IDS = ['d', 'hc', 'p'];
const FMT = {d: v => `${v} µm`, hc: v => `${(+v).toFixed(1)} µm`, p: v => `${v} µm`};
const fmt = v => Math.round(v).toLocaleString('en-US');
const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
// 좁은 세로 화면 전용 확대
const VN_UP = {x: 40, y: 140, w: 940, h: 500}, VN_BUMP = {x: 40, y: 620, w: 940, h: 476}, VN_PAN = {x: 1000, y: 130, w: 560, h: 560};

// 구형 모자: 가운데 cx, 바닥선 y0, 바닥 반폭 a(px), 높이 h(px). h > a 이면 반구보다 큰 호
const cap = (cx, y0, a, h) => { const R = (a * a + h * h) / (2 * h); return `M${q(cx - a)},${q(y0)} A${q(R)},${q(R)} 0 ${h > a ? 1 : 0} 1 ${q(cx + a)},${q(y0)} Z`; };
// 부피 V(µm³)와 바닥 반지름 a(µm) → 돔 높이 h(µm): πh(3a² + h²)/6 = V (이분법)
function capH(a, V){ let lo = 0, hi = 6 * a + 60; for (let k = 0; k < 60; k++){ const m = (lo + hi) / 2; if (Math.PI * m * (3 * a * a + m * m) / 6 < V) lo = m; else hi = m; } return (lo + hi) / 2; }
// 접촉각 θ(rad)로 바닥 반지름을 정하는 모자 (덜 덮일 때)
const capR = (V, th) => Math.cbrt(3 * V * Math.pow(Math.sin(th), 3) / (Math.PI * (2 - 3 * Math.cos(th) + Math.pow(Math.cos(th), 3))));
const capV = (a, h) => Math.PI * h * (3 * a * a + h * h) / 6;

// 개념 모델 (기획 04장): 다 덮음(가장자리 고정) · 덜 덮임 · 공처럼 · 옆면 흘러내림
function calc(s){
  const a = s.d / 2, V = Math.PI * a * a * s.hc, h0 = capH(a, V), th0 = 2 * Math.atan(h0 / a) / RAD, thY = TH[s.die][s.sf];
  const lim = LIM(s.die, s.sw), Lm = LMAX(s.die, s.sw);
  const c = {a, V, h0, th0, thY, lim, Lm, r: a, h: h0, th: th0, mode: 'dome', L: 0, Lfull: 0, t: TF, Vex: 0, hm: 0, stop: false};
  if (thY > th0){ c.r = capR(V, thY * RAD); c.h = c.r * Math.tan(thY * RAD / 2); c.th = thY; c.mode = s.sf === 'x' ? 'ball' : 'dewet'; }
  else if (th0 > lim){
    c.hm = a * Math.tan(lim * RAD / 2); c.Vex = V - capV(a, c.hm);
    c.Lfull = c.L = c.Vex / (Math.PI * (s.d + TF) * TF);
    if (c.L > Lm){ c.L = Lm; c.stop = true; c.t = (-s.d + Math.sqrt(s.d * s.d + 4 * c.Vex / (Lm * Math.PI))) / 2; }   // 젖는 옆면 끝에 닿으면 막이 두꺼워진다
    c.h = c.hm; c.th = lim; c.mode = 'wick';
  }
  c.Rs = c.h > c.r ? (c.r * c.r + c.h * c.h) / (2 * c.h) : c.r;                 // 솔더 가장 넓은 반지름
  c.Rw = Math.max(c.mode === 'wick' ? Math.max(c.Rs, a + c.t) : c.Rs, a);       // 범프 가장 넓은 반지름 (솔더 · 옆면 막 · 기둥 중 큰 것)
  c.gap = s.p - 2 * c.Rw; c.dH = c.h - s.hc;
  // 부피 ±5 % → 꼭대기 변화 (양쪽 평균). 가장자리 고정이면 돔 식, 덜 덮이면 모양이 닮은 채 커져 h ∝ V^⅓, 흘러내리면 꼭대기는 한계에 묶임
  c.dh = c.mode === 'dome' ? (capH(a, V * 1.05) - capH(a, V * 0.95)) / 2 : c.mode === 'wick' ? 0 : c.h * (Math.cbrt(1.05) - Math.cbrt(0.95)) / 2;
  c.dL = c.mode === 'wick' && !c.stop ? 0.05 * V / (Math.PI * (s.d + TF) * TF) : 0;
  c.dP = 2 * GAM / (c.Rs * 1e-6) / 1e5;                                          // 속 압력 (bar)
  // 넘치기까지 남은 부피 (%) — 모서리 한계가 있을 때
  c.room = lim < 180 ? (capV(a, a * Math.tan(lim * RAD / 2)) / V - 1) * 100 : null;
  // 베이스 · 산화된 옆면에서 Ni 앞에 멈춘 것은 '여유 적음', 기둥 밑 · Ni 밑동까지 닿은 것은 '나쁨'.
  // Ni 앞에 모인 테가 상부 Cu 띠(3 µm)보다 두꺼우면 산화된 Ni도 넘을 수 있다 (이 모델 밖) → '나쁨'
  c.over = c.stop && s.die === 'b' && s.sw === 'ox' && c.t > 3;
  const shape = c.mode === 'ball' ? 'ng' : c.mode === 'dewet' ? 'warn' : c.mode === 'wick' ? (c.stop && (!(s.die === 'b' && s.sw === 'ox') || c.over) ? 'ng' : 'warn') : 'ok';
  const gp = c.gap < 5 ? 'ng' : c.gap < 10 ? 'warn' : 'ok', RK = {ok: 0, warn: 1, ng: 2};
  c.shapeCls = shape; c.gapCls = gp; c.cls = RK[shape] >= RK[gp] ? shape : gp;
  return c;
}
// 옆면 막이 지나는 층 (베이스: 상부 Cu 3 → Ni 3 → Cu 기둥 12 µm)
const onLayer = (die, L0) => die === 'b' ? (L0 <= 3 ? '상부 Cu 옆면 안' : L0 <= 6 ? `상부 Cu 3 µm 지나 Ni ${f1(L0 - 3)} µm` : `상부 Cu · Ni 지나 Cu 기둥 ${f1(L0 - 6)} µm`) : 'Ni 옆면';
// 흘러내린 막 이름 (멈춘 곳 · 아직 안 멈췄으면 지나는 층)
const stopName = (s, c) => !c.stop ? (s.die === 'b' ? (c.L <= 3 ? '상부 Cu 옆면 흘러내림' : c.L <= 6 ? 'Ni 옆면까지 흘러내림' : 'Cu 기둥 옆면까지 흘러내림') : 'Ni 옆면 흘러내림') : s.die === 'b' ? (s.sw === 'ox' ? (c.over ? 'Ni 앞 테 두꺼움' : 'Ni 앞에서 멈춤') : '기둥 밑까지 흘러내림') : 'Ni 밑동까지 흘러내림';
// 두 범프 배치: 배율 s(px/µm) · 가운데 x · 솔더 바닥선 y0
function lay(s, c){
  const k = Math.min(8, 780 / (s.p + s.d), 360 / (HS[s.die] + c.h)), half = s.p * k / 2;
  return {s: k, X: [BXC - half, BXC + half], y0: YB - HS[s.die] * k};
}
// 글 폭 어림 (px) — 한글 1em, 영문 · 숫자 약 0.55em
const tw = (t, fs) => [...String(t)].reduce((a, ch) => a + (/[ㄱ-힝]/.test(ch) ? 1 : /[A-Za-z0-9 .,:;'()\-]/.test(ch) ? 0.55 : 0.85), 0) * fs;

(window.EngrReflowChapters = window.EngrReflowChapters || []).push({
  no: '04', id: 'wet', part: 2, short: '둥글어지기', scale: '범프 · µm',
  title: '둥글어지기 — 녹은 솔더는 왜 둥글어지고, 어디서 멈출까?',
  hook: '모양은 부피와 가장자리가 정한다',
  one: '녹은 솔더는 겉넓이를 줄이려는 힘(표면장력) 때문에 둥근 모자 모양이 됩니다. 범프 크기에서는 무게가 거의 힘을 쓰지 못해, 모양은 솔더 부피와 젖은 바닥 넓이가 정합니다. 바닥은 베이스 다이에서 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu), 코어 다이에서 Ni 윗면이고, 솔더는 그 모서리에서 멈추거나 젖는 옆면을 타고 내려갑니다.',
  ana: '<b>동전 위 물방울</b> — 동전에 물을 조금씩 떨어뜨리면 물은 동전 가장자리에서 멈추고 점점 볼록해집니다. 너무 많으면 가장자리를 넘어 흘러내립니다. <i>(비유의 한계: 동전 위 물은 무게가 표면장력보다 10배 넘게 커서 납작한 웅덩이(높이 몇 mm)가 되지만, 25 µm 솔더는 무게가 표면장력의 약 5만분의 1이라 거의 완전한 구의 일부가 됩니다. 또 솔더는 바닥 금속(상부 Cu · Ni)과 반응하며 젖으므로, 표면이 깨끗한지(산화막 · 오염)가 물보다 훨씬 크게 작용합니다.)</i>',
  steps: [
    {id: 'tension', viewN: VN_UP, t: '표면장력 — 겉넓이를 줄이는 힘', d: '겉의 원자는 이웃이 적어 에너지가 높아, 겉넓이를 넓히려면 일이 듭니다. 그래서 액체는 같은 부피에서 겉넓이가 가장 작은 모양(구)으로 가려 합니다. 이 힘은 겉면을 따라 당기는 힘이고, 겉이 굽으면 안쪽 압력이 높아집니다. 녹은 SnAg의 표면장력은 물의 약 6~8배입니다.'},
    {id: 'volume', viewN: VN_BUMP, t: '부피는 그대로 — 돔의 높이', d: '바닥(맨 위 금속 윗면) 지름과 솔더 부피가 정해지면 돔 모양은 하나로 정해집니다. 이 예시 크기에서는 같은 부피가 가운데로 모여 꼭대기가 도금 높이보다 높아집니다. 그래서 부피가 흩어지면 꼭대기 높이도 함께 흩어집니다(부피 ±5 % → 꼭대기 약 ±3 %).'},
    {id: 'angle', viewN: VN_UP, t: '접촉각 — 잘 젖는가', d: '고체 · 액체 · 기체가 만나는 선에서 세 경계면의 힘이 겨루어 접촉각이 정해집니다(영의 식). 깨끗한 금속(베이스 다이 상부 Cu · 코어 다이 Ni) 위에서는 작고, 산화 · 오염된 곳에서는 큽니다. 바닥 금속/SnAg 계면이 안 젖으면 솔더가 물러나 공처럼 뭉칩니다.'},
    {id: 'edge', viewN: VN_UP, t: '가장자리 — 멈추거나 흘러내리거나', d: '돔은 맨 위 금속 모서리에 걸려 멈춥니다(고정). 베이스 다이는 상부 Cu 옆면이 잘 젖어, 겉보기 각이 약 105°를 넘으면 그 옆면(3 µm)을 타고 내려가 산화된 Ni 앞에서 멈춥니다. Ni 옆면까지 깨끗하면 기둥 밑까지 갑니다. 코어 다이는 옆면도 Ni라 산화돼 있으면 넘치지 않습니다.'},
    {id: 'dies', viewN: VN_UP, t: '두 다이 — 상부 Cu 위 · Ni 위', d: '지름 · SnAg가 같으면 부피 · 돔도 같지만 젖는 금속이 다릅니다. 베이스 다이는 상부 Cu 위 — 잘 젖고 계면은 Cu₆Sn₅입니다. 코어 다이는 Ni 위 — Ni 산화막은 빨리 생기고 잘 안 걷혀(윗면은 도금 때, 모서리는 플럭스 · 포름산으로) 더 민감하고, 계면은 Ni₃Sn₄입니다.'}
  ],
  icon(K){
    const {R, P} = K;
    // 베이스 다이 범프 둘: Cu 기둥 · Ni · 상부 Cu 위 돔 (오른쪽은 상부 Cu 옆면을 타고 Ni 앞에서 멈춤)
    const stk = x => R(x, 50, 22, 12, 'f-cu2') + R(x, 47, 22, 3, 'f-ni') + R(x, 44, 22, 3, 'f-cu2');
    return stk(6) + P('M6,44 A11,11 0 1 1 28,44 Z', 'f-sn2') +
      stk(38) + P('M38,44 A13,9 0 0 1 60,44 Z', 'f-sn2') + R(36, 44, 2, 3, 'f-sn2') + R(60, 44, 2, 3, 'f-sn2');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, wrap, arrow} = K;
    let s = '';
    // ── 아래: 웨이퍼 (두 범프는 위젯이 그린다)
    s += R(40, 1012, 940, 12, 'f-pas', tip('보호막 (산화막 · 질화막 · 폴리이미드 등) — 솔더가 젖지 않는다'));
    s += R(40, 1024, 940, 60, 'f-si', tip('실리콘 웨이퍼'));
    s += `<g data-v="bumps"></g>`;

    // ── 위쪽 그림 칸 (x 40~980, y 130~620), 단계별
    // tension: 원자 그림 + 굽은 겉면
    let tn = T(60, 172, '표면장력 — 겉면을 따라 당기는 힘', 't-acc', 'start');
    tn += T(60, 206, '평평한 겉에서는 양쪽 당김이 비겨 알짜 힘이 0 — "겉 원자를 안으로 끌어당긴다"는 그림은 흔한 오해', 't-dim', 'start');
    const AX = (r, c) => 110 + c * 56 + (r % 2) * 28, AY = r => 340 + r * 48;
    const IN = [2, 3], SF = [0, 4];
    const nb = (r, c) => { const o = [[r, c + 1]]; if (r < 4) (r % 2 ? [[r + 1, c], [r + 1, c + 1]] : [[r + 1, c - 1], [r + 1, c]]).forEach(p => o.push(p)); return o.filter(([rr, cc]) => cc >= 0 && cc < 8); };
    const isIn = (r, c) => r === IN[0] && c === IN[1], isSf = (r, c) => r === SF[0] && c === SF[1];
    let bonds = '', atoms = '';
    for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) nb(r, c).forEach(([rr, cc]) => {
      const hi = isIn(r, c) || isIn(rr, cc) ? 'rf04-bh' : isSf(r, c) || isSf(rr, cc) ? 'rf04-bh2' : 'rf04-bond';
      bonds += L(AX(r, c), AY(r), AX(rr, cc), AY(rr), hi);
    });
    for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++){
      const cls = isIn(r, c) ? 'k-acc' : isSf(r, c) ? 'k-acc2' : 'rf04-at';
      atoms += C(AX(r, c), AY(r), 17, cls, tip(isIn(r, c) ? '안쪽 원자 — 이웃 6개와 결합 (2차원 그림)' : isSf(r, c) ? '겉 원자 — 위쪽 이웃이 없어 결합이 끊겨 있다 → 에너지가 높다' : r === 0 ? '겉 원자' : '안쪽 원자'));
    }
    const sx = AX(0, 4), sy = AY(0);
    tn += G(bonds + atoms, tip('액체 속 원자 (실제는 불규칙하게 움직인다 — 그림은 단순화)'));
    tn += T(AX(2, 3), AY(2) + 7, '①', 'rf04-num') + T(sx, sy + 7, '②', 'rf04-num');
    tn += L(sx, sy, sx - 28, sy - 48, 'rf04-brk') + L(sx, sy, sx + 28, sy - 48, 'rf04-brk');
    tn += LB(T(sx, sy - 58, '끊긴 결합', 't-dim'));
    tn += LB(T(116, 272, '기체', 't-dim', 'start'));
    tn += arrow(sx - 46, 306, sx - 156, 306, 's-arr2') + arrow(sx + 46, 306, sx + 156, 306, 's-arr2');
    tn += LB(T(sx + 168, 312, '겉면을 따라 당김', 't-warn', 'start'));
    tn += LB(T(60, 568, '① 안쪽 원자 — 사방에 이웃 (결합 6개)', 't-sub', 'start') + T(60, 599, '② 겉 원자 — 이웃이 적어 에너지↑ (끊긴 결합)', 't-sub', 'start'));
    // 굽은 겉면 (오른쪽)
    const OX = 800, OY = 640, RR = 180, pt = d => [OX + RR * Math.cos(d * RAD), OY + RR * Math.sin(d * RAD)];
    const cy0 = 548, cdx = Math.sqrt(RR * RR - (OY - cy0) * (OY - cy0));
    tn += P(`M${q(OX - cdx)},${cy0} A${RR},${RR} 0 0 1 ${q(OX + cdx)},${cy0} Z`, 'f-sn2', tip('굽은 겉면 (녹은 솔더 돔의 겉)'));
    const [p1x, p1y] = pt(240), [p2x, p2y] = pt(300);
    tn += P(`M${q(p1x)},${q(p1y)} A${RR},${RR} 0 0 1 ${q(p2x)},${q(p2y)}`, 'rf04-skin');
    tn += arrow(p1x, p1y, p1x - 92 * Math.sin(60 * RAD), p1y + 92 * Math.cos(60 * RAD), 's-arr2') + arrow(p2x, p2y, p2x + 92 * Math.sin(60 * RAD), p2y + 92 * Math.cos(60 * RAD), 's-arr2');
    tn += arrow(OX, OY - RR + 14, OX, OY - RR + 82, 's-arr');
    tn += LB(T(OX, 404, '굽은 겉면', 't-sub') + T(OX + 14, 528, '합 → 안쪽', 'rf04-dk', 'start'));
    tn += LB(T(640, 568, '두 당김의 합이 안쪽으로', 't-sub', 'start') + T(640, 599, '→ 속 압력↑ (라플라스 압력)', 't-sub', 'start'));
    s += G(tn, only('tension'));

    // volume: 녹는 순간 (네 칸) — 위젯이 모양을 그린다
    let vo = T(60, 172, '같은 부피 · 같은 바닥 → 모양은 하나뿐', 't-acc', 'start');
    vo += T(60, 206, '녹는 순간 겉넓이를 줄이며 가운데로 모인다 — 출렁임은 1 ms 안에 가라앉는다', 't-dim', 'start');
    for (let k = 0; k < 4; k++) vo += R(60 + k * 228, 252, 212, 288, 'pl-lane', {rx: 10});
    vo += `<g data-v="frames"></g>`;
    s += G(vo, only('volume'));

    // angle: 접촉선 큰 그림 (위젯이 방울 · 힘을 그린다)
    let an = T(60, 172, '접촉각 — 세 경계면이 접촉선에서 겨룬다', 't-acc', 'start');
    an += T(60, 206, '세 힘이 맞서 멈춘 각 = 접촉각 (영의 식)', 't-dim', 'start');
    an += `<g data-v="ang"></g>`;                       // 바닥 금속 (베이스 상부 Cu · 코어 Ni) · 방울 · 힘은 위젯이 그린다
    s += G(an, only('angle'));

    // edge: 모서리 확대 (위젯이 솔더 · 부채꼴을 그린다)
    let ed = T(60, 172, '가장자리 — 모서리에 걸려 멈춘다', 't-acc', 'start');
    ed += T(60, 206, '모서리에서는 각이 윗면 접촉각 θ부터 「옆면 접촉각 + 90°」까지 커져도 멈춰 있다 (깁스의 조건)', 't-dim', 'start');
    ed += R(60, 226, 560, 380, 'pl-box', {rx: 12}) + TT(606, 254, ['모서리 확대', '(비율 아님)'], 't-dim', 'end', 24);
    ed += `<g data-v="corner"></g>`;                    // 층(베이스 상부 Cu · Ni · Cu 기둥 / 코어 Ni) · 솔더 · 부채꼴은 위젯이 그린다
    ed += T(640, 252, '옆면 상태', 't-sub', 'start') + `<g data-v="side"></g>`;
    s += G(ed, only('edge'));

    // dies: 두 다이 범프 윗부분 — 같은 축척(8 px/µm), 리플로우 뒤 돔. 젖는 금속 · 계면 IMC · 옆면
    let di = T(60, 172, '두 다이 — 솔더가 처음 만나는 금속이 다르다', 't-acc', 'start');
    di += T(60, 206, '같은 지름 25 · SnAg 12 µm (예시) → 부피 · 돔은 같다. 같은 축척 (IMC · 옆면 막은 과장)', 't-dim', 'start');
    const DY = 588, DA = 100, DH = 15.7 * 8;                            // 범프 바닥 y, 돔 반폭 · 높이 (px)
    [[60, 'b'], [530, 'k']].forEach(([lx, d]) => {
      const cx = lx + 124, x0 = cx - DA;
      di += R(lx, 226, 440, 384, 'pl-lane', {rx: 10});
      di += T(lx + 16, 256, d === 'b' ? '베이스 다이 — 상부 Cu 위' : '코어 다이 — Ni 위', 'pl-hdg', 'start') + T(lx + 16, 282, d === 'b' ? 'Cu 기둥 / Ni / 상부 Cu / SnAg' : 'Ni / SnAg (Cu 기둥 없음)', 't-dim', 'start');
      di += R(lx + 8, DY, 236, 12, 'f-pas', tip('보호막 — 솔더가 젖지 않는다'));
      let yb = DY;
      STK[d].forEach(([m, hh]) => { const ph = hh * 8; di += R(x0, yb - ph, 2 * DA, ph, m === 'ni' ? 'f-ni' : 'f-cu2', tip(m === 'ni' ? LTIP.ni[d] : LTIP[m])); yb -= ph; });
      const y0 = yb;                                                     // 맨 위 금속 윗면
      if (d === 'b'){
        // 이 부피(103°)는 한계 105° 아래라 넘치지 않는다. 넘치면(부피 약 6 % 더) 상부 Cu 옆면(3 µm)을 타고 내려가 산화된 Ni 앞에서 멈춘다 — 점선
        [x0 - 6, x0 + 2 * DA].forEach(x => { di += R(x, y0, 6, 24, 'pl-ghost', tip('넘치면 (부피 약 6 % 더) — 솔더가 상부 Cu 옆면을 적시고 산화된 Ni 앞에서 멈춘다. 이 예시 부피(겉보기 각 103°)에서는 아직 넘치지 않는다')); });
        di += L(x0 - 12, y0 + 24, x0 - 1, y0 + 24, 'rf04-stop') + L(x0 + 2 * DA + 1, y0 + 24, x0 + 2 * DA + 12, y0 + 24, 'rf04-stop');
        di += R(x0, y0, 2 * DA, 5, 'f-imc', tip('Cu₆Sn₅ — 상부 Cu 위 계면 IMC (+ 얇은 Cu₃Sn) → 05장'));
      }
      di += P(cap(cx, y0, DA, DH), 'f-sn2', tip(`녹은 SnAg — 지름 25 · 꼭대기 15.7 µm (두 다이 같음)`));
      if (d === 'k'){
        // Ni₃Sn₄ — 각진 조각으로 자란다 (솔더 쪽으로 톱니)
        let zz = `M${x0},${y0}`;
        for (let j = 0; j <= 20; j++) zz += ` L${x0 + j * 10},${y0 - (j % 2 ? 8 : 2)}`;
        di += P(zz + ` L${x0 + 2 * DA},${y0 + 3} L${x0},${y0 + 3} Z`, 'f-imc', tip('Ni₃Sn₄ — Ni 위 계면 IMC, 각진 조각으로 자란다 → 05장'));
      }
      di += LB(T(cx, y0 - 52, 'SnAg', 'rf04-dk'));
      di += LB(d === 'b' ? T(cx, y0 + 19, '상부 Cu', 'rf04-dk') + T(cx, y0 + 43, 'Ni', 'rf04-dk') + T(cx, y0 + 103, 'Cu 기둥', 'rf04-dk') : T(cx, y0 + 27, 'Ni (5 µm)', 'rf04-dk'));
      const tx = lx + 248;
      if (d === 'b'){
        di += LB(TT(tx, 330, ['Cu 산화막은', '플럭스 · 포름산에', '잘 걷혀 잘 젖음'], 't-sub', 'start', 26));
        di += K.lead(x0 + 2 * DA - 10, y0 + 2, tx - 8, 420, 'Cu₆Sn₅ (계면)', 'start', 't-sub');
        di += LB(T(tx, 458, '넘치면 (점선)', 't-dim', 'start') + T(tx, 484, 'Ni 앞에서 멈춤', 't-warn', 'start') + T(tx, 508, '(산화된 Ni 옆면)', 't-dim', 'start'));
        di += L(x0 + 2 * DA + 14, y0 + 24, tx - 6, 478, 's-lead');
        di += R(x0 - 3, y0 + 24, 3, 24, 'rf04-niox', tip('Ni 옆면 산화막 — 잘 안 젖어 솔더가 멈춘다')) + R(x0 + 2 * DA, y0 + 24, 3, 24, 'rf04-niox', tip('Ni 옆면 산화막 — 잘 안 젖어 솔더가 멈춘다'));
      } else {
        di += L(lx + 16, 588 - 33.7 * 8, lx + 432, 588 - 33.7 * 8, 's-dash', tip('베이스 다이 범프 꼭대기 높이 (같은 축척)'));
        di += LB(T(lx + 432, 588 - 33.7 * 8 + 24, '베이스 꼭대기 33.7 µm', 't-dim', 'end') + T(cx, y0 - DH - 14, '꼭대기 20.7 µm', 't-sub'));
        di += LB(TT(tx, 374, ['Ni 산화막은 빨리', '생기고 잘 안 걷힘', '윗면은 도금 때,', '모서리는 환원으로'], 't-sub', 'start', 26));
        di += K.lead(x0 + 2 * DA - 10, y0 - 4, tx - 8, 486, 'Ni₃Sn₄ (계면)', 'start', 't-sub');
        di += R(x0 - 3, y0 + 3, 3, 37, 'rf04-niox', tip('Ni 옆면 산화막 — 잘 안 젖어 넘치지 않는다')) + R(x0 + 2 * DA, y0 + 3, 3, 37, 'rf04-niox', tip('Ni 옆면 산화막 — 잘 안 젖어 넘치지 않는다'));
        di += L(x0 + 2 * DA + 5, y0 + 22, tx - 6, 534, 's-lead') + LB(TT(tx, 540, ['옆면도 Ni — 산화돼', '있으면 넘치지 않음'], 't-dim', 'start', 24));
      }
    });
    s += G(di, only('dies'));

    // ── 오른쪽 패널
    s += R(1000, 130, 560, 970, 'pl-panel', {rx: 14});
    // tension: 표면장력 크기 · 무게 대 표면장력 · 큰 방울 vs 범프
    let pt1 = T(1030, 176, '얼마나 센가 — 표면장력 (N/m)', 't-acc', 'start');
    const SB = 700;                                                  // 1 N/m = 700 px
    pt1 += R(1040, 200, 0.072 * SB, 32, 'rf04-water', tip('물 (25 °C) 0.072 N/m')) + T(1040 + 0.072 * SB + 14, 224, '물 0.072', 't-sub', 'start');
    pt1 += R(1040, 252, 0.4 * SB, 32, 'f-sn2', tip('녹은 SnAg — 약 0.4~0.55 N/m (측정법 · 분위기 · 산소에 따라 흩어짐)')) + R(1040 + 0.4 * SB, 252, 0.15 * SB, 32, 'rf04-band', tip('보고값이 흩어지는 범위'));
    pt1 += T(1040 + 0.55 * SB + 12, 276, '0.4~0.55', 't-sub', 'start');
    pt1 += T(1040, 316, '녹은 SnAg (분위기 · 산소에 따라)', 't-dim', 'start') + T(1040, 348, '→ 물의 약 6~8배', 't-warn', 'start');
    pt1 += T(1030, 404, '무게 : 표면장력 (지름 25 µm 솔더)', 't-acc', 'start');
    const LX0 = 1060, LDX = 72;                                      // 10⁻⁶ → 10⁰, 한 자리 72 px
    pt1 += R(LX0, 424, LDX * 1.3, 26, 'rf04-wt', tip('무게 (중력) — 표면장력의 약 2×10⁻⁵ (본드 수)')) + T(LX0 + LDX * 1.3 + 12, 444, '무게 ≈ 2×10⁻⁵', 't-sub', 'start');
    pt1 += R(LX0, 460, LDX * 6, 26, 'f-sn2', tip('표면장력 (기준 1)')) + T(LX0 + 14, 480, '표면장력 = 1', 'rf04-dk', 'start');
    pt1 += L(LX0, 494, LX0 + LDX * 6, 494, 's-axis');
    [['10⁻⁶', 0], ['10⁻⁴', 2], ['10⁻²', 4], ['1', 6]].forEach(([t, k]) => { pt1 += L(LX0 + LDX * k, 494, LX0 + LDX * k, 502, 's-axis') + T(LX0 + LDX * k, 524, t, 't-dim'); });
    pt1 += T(1040, 562, '≈ 1 : 50,000 → 무게는 거의 무시', 't-warn', 'start');
    pt1 += R(1030, 588, 245, 214, 'pl-lane', {rx: 10}) + R(1285, 588, 245, 214, 'pl-lane', {rx: 10});
    pt1 += T(1152, 620, '큰 물방울 (cm)', 't-sub') + T(1152, 646, '무게로 납작한 웅덩이', 't-dim');
    pt1 += R(1048, 744, 208, 16, 'rf04-plate') + P('M1060,744 C1060,712 1076,708 1100,708 L1204,708 C1228,708 1244,712 1244,744 Z', 'rf04-water', tip('큰 물방울 — 높이 몇 mm에서 더 못 쌓이고 퍼진다 (무게가 이김)'));
    pt1 += T(1407, 620, '마이크로범프 솔더', 't-sub') + T(1407, 646, '구의 일부 (무게 무시)', 't-dim');
    pt1 += R(1347, 744, 120, 8, 'f-cu2', tip('상부 Cu — 솔더가 젖는 바닥 (베이스 다이. 코어 다이는 Ni)')) + R(1347, 752, 120, 8, 'f-ni', tip('Ni')) + P(cap(1407, 744, 60, 76), 'f-sn2', tip('25 µm 솔더 — 거의 완전한 구의 일부'));
    pt1 += T(1152, 786, '본드 수 약 14 (동전 위 물)', 't-dim') + T(1407, 786, '본드 수 약 2×10⁻⁵', 't-dim');
    pt1 += TT(1030, 846, wrap('모양은 녹자마자(µs~0.1 ms) 바뀌고, 출렁임도 1 ms 안에 가라앉습니다. 리플로우에서 시간이 드는 것은 열 전달 · 산화막 제거 · 기포 빠지기 · IMC 반응입니다.', 24.5), 't-sub', 'start', 30);
    pt1 += TT(1030, 984, wrap('속 압력(라플라스) = 2 × 표면장력 ÷ 반지름 — 반지름 약 13 µm 돔이면 바깥보다 약 0.8기압 높다 (범프 위 숫자는 지금 위젯 값)', 25.5), 't-dim', 'start', 26);
    s += G(pt1, only('tension'));
    // volume · angle · edge · dies 패널은 위젯이 그린다
    s += G(`<g data-v="pvol"></g>`, only('volume')) + G(`<g data-v="pang"></g>`, only('angle')) + G(`<g data-v="pedge"></g>`, only('edge')) + G(`<g data-v="pdies"></g>`, only('dies'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 돔 계산기</div>
      ${K.seg('die', [['b', '베이스 다이 (Cu/Ni/Cu/SnAg)'], ['k', '코어 다이 (Ni/SnAg)']], 'b', '범프')}
      ${K.ctl('d', '범프 지름', 15, 40, 1, 25)}${K.ctl('hc', '도금한 SnAg 높이', 4, 25, 0.5, 12)}
      ${K.seg('sf', [['c', '깨끗함 (30°)'], ['o', '얇은 산화 (70°)'], ['x', '계면 산화 · 오염 (140°)']], 'c', '상부 Cu/SnAg 계면')}
      ${K.seg('sw', [['ox', '산화된 옆면'], ['cl', '깨끗한 옆면']], 'ox', 'Ni 옆면')}
      ${K.ctl('p', '피치', 30, 80, 1, 55)}
      ${K.kpis([['솔더 부피 (µm³)', 'k-v', 'pL'], ['돔 꼭대기', 'k-h', 'µm (도금 높이 대비)'], ['겉보기 각', 'k-th', '°'], ['이웃과 틈', 'k-gap', '두 범프 가장 넓은 곳 사이'], ['판정', 'k-j', '']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('범프 크기에서는 무게를 무시하고(본드 수 약 2×10⁻⁵) 녹은 솔더를 구의 일부로 계산합니다. 부피 = π·(지름/2)²·도금 높이, 다 덮으면 πh(3a² + h²)/6 = 부피. 범프(예시): 베이스 다이 Cu 기둥 12 · Ni 3 · 상부 Cu 3 µm, 코어 다이 Ni 5 µm — 지름 · SnAg가 같으면 돔도 같습니다. 젖음 각(깨끗함 상부 Cu 30 · Ni 40 / 얇은 산화 70 / 오염 140°) · 옆면 각(15°) · 옆면 막 두께(1.5 µm)는 가정값입니다. Cu 옆면(상부 Cu · Cu 기둥)은 산화막이 잘 걷혀 늘 젖는 것으로 두고, Ni 옆면만 고른 상태(산화 · 깨끗)를 따릅니다. 막이 젖는 옆면 끝(베이스: 산화된 Ni 앞 3 µm · 깨끗하면 기둥 밑 18 µm, 코어: 깨끗하면 Ni 밑동 5 µm)에 닿으면 더 내려가지 않고 두꺼워지는 것으로 셉니다(Ni 앞 테가 상부 Cu 띠보다 두꺼워지면 실제로는 산화된 Ni도 넘을 수 있어 「나쁨」으로 표시). 반응하며 조금씩 타고 내려가는 실제 흘러내림(시간에 따라)은 넣지 않은 평형 계산입니다. 판정 경계(틈 5 · 10 µm)도 예시입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, TT, G, LB, tip, only, wrap, lead, arrow} = K;
    const st = Object.assign({}, DEF);
    let touched = false, pfix = false;
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const setSeg = (g, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${g}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const put = (sel, html) => { const e = ctx.$(sel); if (e) e.innerHTML = html; };
    // 다이에 따라 손잡이 이름 바꾸기 (계면 · 젖음 각)
    function segText(){
      const sf = ctx.card.querySelector('.pl-seg[data-g="sf"]'), TD = TH[st.die];
      if (sf){ sf.querySelector('.lb').textContent = `${TOP[st.die]}/SnAg 계면`; [['c', '깨끗함'], ['o', '얇은 산화'], ['x', '계면 산화 · 오염']].forEach(([v, t]) => { const b = sf.querySelector(`button[data-v="${v}"]`); if (b) b.textContent = `${t} (${TD[v]}°)`; }); }
    }
    const clampP = () => {
      pfix = false;
      if (st.p < st.d + 5){ st.p = st.d + 5; pfix = true; const i = inp('p'); if (i) i.value = st.p; ctx.out('p', FMT.p(st.p)); }
    };
    // 솔더 한 덩이 (범프 하나): 모드별 모양. cx, y0, 배율 k. Lpx = 옆면 막 길이(px, 층을 비율대로 안 그린 그림용)
    function solder(c, cx, y0, k, cls, Lpx){
      let o = '';
      if (c.mode === 'wick'){
        const t = c.t * k, Lp = Lpx != null ? Lpx : c.L * k;
        // 옆면 막: 길고 얇으면 띠, 짧고 두꺼우면(젖는 옆면 끝에 모인 테) 옆으로 불룩한 테
        const film = (xe, sd) => Lp - t / 2 > 4
          ? P(`M${q(xe)},${q(y0 - 1)} L${q(xe + sd * t)},${q(y0 + 3)} L${q(xe + sd * t)},${q(y0 + Lp - t / 2)} Q${q(xe + sd * t)},${q(y0 + Lp)} ${q(xe)},${q(y0 + Lp)} Z`, cls)
          : P(`M${q(xe)},${q(y0 - 1)} C${q(xe + sd * t * 4 / 3)},${q(y0 - 1)} ${q(xe + sd * t * 4 / 3)},${q(y0 + Lp)} ${q(xe)},${q(y0 + Lp)} Z`, cls);
        o += film(cx - c.a * k, -1) + film(cx + c.a * k, 1);
      }
      o += P(cap(cx, y0, c.r * k, c.h * k), cls);
      return o;
    }
    // ── 아래: 두 범프
    function bumps(c, Ly){
      const k = Ly.s, y0 = Ly.y0, w = st.d * k, uc = 0.5 * k, top = y0 - c.h * k, tn = TOP[st.die];
      const tipS = c.mode === 'dome' ? `녹은 솔더 — 바닥(${tn} 윗면)을 다 덮고 모서리에 걸린 돔 (꼭대기 ${f1(c.h)} µm)` : c.mode === 'wick' ? `흘러내린 솔더 — 돔은 ${f1(c.h)} µm, 옆면 막 ${f1(c.L)} µm (${stopName(st, c)})` : `덜 덮인 솔더 — 바닥 지름 ${f1(2 * c.r)} µm로 물러남 (${tn}가 드러남)`;
      let o = '';
      Ly.X.forEach(cx => {
        o += R(cx - w / 2 + uc, YB, w - 2 * uc, 6, 'f-seed2', tip('Cu 시드 — 시드 식각 뒤 범프 밑에만 남는다 (실제 수백 nm — 그림은 과장)'));
        o += R(cx - w / 2 + uc, YB + 6, w - 2 * uc, 6, 'f-ti', tip('Ti 시드 (접착 · 방벽층, 실제 약 100 nm — 그림은 과장). 가장자리가 조금 깎임(언더컷)'));
        let yb = YB;
        STK[st.die].forEach(([m, hh]) => { o += R(cx - w / 2, yb - hh * k, w, hh * k, m === 'ni' ? 'f-ni' : 'f-cu2', tip(m === 'ni' ? LTIP.ni[st.die] : LTIP[m])); yb -= hh * k; });
        o += G(solder(c, cx, y0, k, 'f-sn2'), tip(tipS));
        if (c.r < c.a - 0.05) o += R(cx - w / 2, y0 - 3, (c.a - c.r) * k, 4, 'rf04-bare', tip(`드러난 ${tn} — 솔더가 물러난 자리`)) + R(cx + c.r * k, y0 - 3, (c.a - c.r) * k, 4, 'rf04-bare', tip(`드러난 ${tn} — 솔더가 물러난 자리`));
      });
      // 왼쪽 범프 안 이름 (층이 얇아 글이 안 들어가면 생략 — 마우스 설명은 남음)
      const cx1 = Ly.X[0];
      let lb = '', yb = YB;
      STK[st.die].forEach(([m, hh]) => {
        const ph = hh * k, nm = m === 'cu' ? (w > 110 ? 'Cu 기둥' : 'Cu') : m === 'tc' ? (w > 90 ? '상부 Cu' : 'Cu') : st.die === 'k' && w > 110 && ph > 30 ? 'Ni (5 µm)' : 'Ni';
        if (ph >= 17) lb += T(cx1, yb - ph / 2 + 7, nm, 'rf04-dk');
        yb -= ph;
      });
      if (c.h * k > 44) lb += T(cx1, y0 - Math.min(c.h * k * 0.42, 70) + 7, c.r * k * 2 > 140 ? 'SnAg 솔더' : '솔더', 'rf04-dk');
      o += LB(lb);
      o += lead(cx1 + w / 2 - 12, YB + 6, cx1 + w / 2 + 22, 1060, '시드 Ti + Cu — 범프 밑에만 남음', 'start', 't-sub');
      // 단계별 표시
      const xr = Ly.X[1], xl = Ly.X[0], R0 = c.Rw * k;
      // tension: 속 압력
      const yLab = Math.max(top - 16, 630);
      o += G(LB(T(xr, yLab, `속 압력 약 +${c.dP.toFixed(1)}기압`, 't-warn') + T(xl, yLab, '녹은 솔더 — 구의 일부', 't-sub')), only('tension'));
      // volume: 원기둥 점선 · 모이는 화살표 · 높이 괄호
      let v = '';
      const yc = y0 - st.hc * k;
      Ly.X.forEach(cx => {
        v += R(cx - w / 2, yc, w, st.hc * k, 'pl-ghost', tip(`도금한 그대로의 원기둥 (높이 ${st.hc} µm)`));
        if (c.mode === 'dome' || c.mode === 'wick'){
          if (c.h > st.hc + 0.6) [-1, 1].forEach(sd => { v += arrow(cx + sd * (w / 2 - 6), yc + 6, cx + sd * w * 0.16, top + 18, 's-arr'); });
          else if (c.h < st.hc - 0.6) [-1, 1].forEach(sd => { v += arrow(cx + sd * w * 0.3, yc + 10, cx + sd * (R0 + 6), y0 - (c.h - c.Rs) * k, 's-arr'); });
        }
      });
      const bxL = xl - Math.max(w / 2, R0) - 18, bxR = xr + Math.max(w / 2, R0) + 18;
      const brk = (x, y1, y2, sd) => P(`M${q(x - sd * 8)},${q(y1)} L${q(x)},${q(y1)} L${q(x)},${q(y2)} L${q(x - sd * 8)},${q(y2)}`, 's-acc2');
      v += brk(bxL, yc, y0, -1) + brk(bxR, top, y0, 1);
      const tL = `도금 ${f1(st.hc)} µm`, tR = `꼭대기 ${f1(c.h)} µm`, yTop = Math.max(Math.min(yc, top) - 14, 630);
      v += LB(T(bxL - 10 - tw(tL, 21) >= 46 ? bxL - 10 : bxL - 8, bxL - 10 - tw(tL, 21) >= 46 ? (yc + y0) / 2 + 7 : yTop, tL, 't-warn', bxL - 10 - tw(tL, 21) >= 46 ? 'end' : 'start'));
      v += LB(T(bxR + 10 + tw(tR, 21) <= 976 ? bxR + 10 : bxR + 8, bxR + 10 + tw(tR, 21) <= 976 ? (top + y0) / 2 + 7 : yTop, tR, 't-warn', bxR + 10 + tw(tR, 21) <= 976 ? 'start' : 'end'));
      o += G(v, only('volume'));
      // angle: 드러난 바닥 금속 이름 · 다 덮음
      let ag = '';
      if (c.r < c.a - 0.05){
        // 안쪽 두 드러난 자리에서 가운데 이름으로 (틈이 좁으면 돔 위로)
        const lt = `드러난 ${tn}`, lw = tw(lt, 23), exL = xl + c.r * k + (c.a - c.r) * k / 2, exR = xr - c.r * k - (c.a - c.r) * k / 2;
        const inner = (xr - Math.max(w / 2, c.Rs * k)) - (xl + Math.max(w / 2, c.Rs * k)), ly = inner > lw + 30 ? y0 - 40 : yLab;
        ag += L(exL, y0 - 2, BXC - lw / 2 - 4, ly - 7, 's-lead') + L(exR, y0 - 2, BXC + lw / 2 + 4, ly - 7, 's-lead') + C(exL, y0 - 2, 3.5, 'k-lead') + C(exR, y0 - 2, 3.5, 'k-lead');
        ag += LB(T(BXC, ly, lt, 't-warn'));
      } else ag += LB(T(BXC, yLab, `바닥을 다 덮고 ${tn} 모서리에 걸림`, 't-sub'));
      o += G(ag, only('angle'));
      // edge: 틈 치수선 · 흘러내린 막
      let eg = '';
      // 치수선은 두 범프가 가장 가까운 높이에: 옆면 막 · 기둥이 솔더보다 넓으면 그 높이, 아니면 솔더 가장 넓은 곳
      const yw = c.mode === 'wick' && c.a + c.t >= c.Rs ? y0 + c.L * k * 0.35 : c.Rs < c.a - 0.01 ? y0 + 1.5 * k : c.h > c.Rs ? y0 - (c.h - c.Rs) * k : y0 - 6;
      const gx0 = xl + R0, gx1 = xr - R0;
      if (c.gap > 0){
        eg += L(gx0, yw, gx1, yw, 'rf04-dim') + L(gx0, yw - 10, gx0, yw + 10, 'rf04-dim') + L(gx1, yw - 10, gx1, yw + 10, 'rf04-dim');
        const lt = `틈 ${f1(c.gap)} µm`, ok = gx1 - gx0 > tw(lt, 22) + 16;
        eg += LB(T(BXC, ok ? yw - 14 : yLab, lt, c.gap < 5 ? 'pl-warn' : 't-warn'));
        if (!ok) eg += L(BXC, yLab + 6, BXC, yw - 4, 'rf04-dim');
      } else eg += LB(T(BXC, yLab, '붙음 — 브리지', 'pl-warn'));
      if (c.mode === 'wick'){
        // 흘러내린 막 이름: 두 기둥 사이가 넓으면 그 사이 아래쪽에, 아니면 오른쪽 · 왼쪽 빈 곳에
        const fy = y0 + c.L * k * 0.6, inL = xl + c.a * k + c.t * k, inR = xr - c.a * k - c.t * k, t1 = c.stop ? stopName(st, c) : '흘러내린 막', t2 = `옆면 막 ${f1(c.L)} µm`;
        // 범프 금속이 낮으면(코어 다이) 치수선 아래에 두 줄이 안 들어가 → 치수선 위 두 돔 사이에
        const lyC = Math.min(YB - 32, Math.max(fy + 30, yw + 64)), below = lyC >= yw + 36, need = Math.max(tw(t1, 21), tw(t2, 21)) + 24, ly = below ? lyC : yw - 72;
        if (inR - inL >= need) eg += (below ? L(inL + 2, fy, BXC - 8, ly - 30, 's-lead') + L(inR - 2, fy, BXC + 8, ly - 30, 's-lead')
          : L(inL + 2, y0 + 4, BXC - 8, ly + 24, 's-lead') + L(inR - 2, y0 + 4, BXC + 8, ly + 24, 's-lead')) + LB(T(BXC, ly - 8, t1, 't-warn') + T(BXC, ly + 18, t2, 't-warn'));
        else {
          const fx = xr + c.a * k + c.t * k;
          if (fx + 30 + need <= 976) eg += lead(fx, fy, fx + 26, ly, t1, 'start', 't-warn') + LB(T(fx + 34, ly + 32, t2, 't-warn', 'start'));
          else if (xl - c.a * k - c.t * k - 30 - need >= 44) eg += lead(xl - c.a * k - c.t * k, fy, xl - c.a * k - c.t * k - 26, ly, t1, 'end', 't-warn') + LB(T(xl - c.a * k - c.t * k - 34, ly + 32, t2, 't-warn', 'end'));
        }
      }
      o += G(eg, only('edge'));
      // dies: 지금 그린 범프가 어느 다이인지
      o += G(LB(T(BXC, yLab, `지금 아래 그림: ${DIEN[st.die]} 범프 (${DIES[st.die]}) — 위젯에서 바꿔 보기`, 't-sub')), only('dies'));
      return o;
    }
    // ── 위: 녹는 순간 네 칸 (volume)
    function frames(c){
      const base = 508, fw = 212, tn = TOP[st.die];
      // 솔더 밑 금속 (비율 아님): 베이스 상부 Cu 8 · Ni 8 · Cu 기둥 12 px, 코어 Ni 16 px
      const FL = st.die === 'b' ? [['tc', 8], ['ni', 8], ['cu', 12]] : [['ni', 16]];
      // 옆면 막 길이 µm → 이 그림의 층 px (상부 Cu 3 µm = 8 px, Ni 3 µm = 8 px, Cu 기둥 12 µm = 12 px / 코어 Ni 5 µm = 16 px)
      const FZ = st.die === 'b' ? [[0, 0], [3, 8], [6, 16], [18, 28]] : [[0, 0], [5, 16]];
      const fz = L0 => { for (let j = 1; j < FZ.length; j++) if (L0 <= FZ[j][0]) return FZ[j - 1][1] + (L0 - FZ[j - 1][0]) / (FZ[j][0] - FZ[j - 1][0]) * (FZ[j][1] - FZ[j - 1][1]); return FZ[FZ.length - 1][1]; };
      const wa = 0.98 * c.r, wh = 1.14 * Math.max(c.h, 1), W3 = wh > wa ? (wa * wa + wh * wh) / (2 * wh) : wa;   // ③ 출렁임 모양의 가장 넓은 반지름
      const Wd = Math.max(c.a + (c.mode === 'wick' ? c.t : 0), c.Rs, W3);
      const m = Math.min(94 / Wd, 226 / Math.max(st.hc, wh, 1)), a = c.a * m, yc = base - st.hc * m;
      const NM = [['① 도금한 원기둥', `${f1(st.hc)} µm · 거친 겉`], ['② 녹기 시작', '모서리부터 둥글게'], ['③ 출렁임', '흔들리다 가라앉음'], ['④ 멈춘 모양', c.mode === 'dome' ? `꼭대기 ${f1(c.h)} µm` : c.mode === 'wick' ? `흘러내림 · ${f1(c.h)} µm` : c.mode === 'ball' ? `공처럼 뭉침 · ${f1(c.h)} µm` : `덜 덮임 · ${f1(c.h)} µm`]];
      let o = '';
      NM.forEach(([t1, t2], i) => {
        const cx = 60 + i * 228 + fw / 2;
        let fy = base;
        FL.forEach(([mm, hh], j) => { o += R(cx - a, fy, 2 * a, hh, mm === 'ni' ? 'f-ni' : 'f-cu2', tip(j ? (mm === 'ni' ? 'Ni' : 'Cu 기둥') : `${tn} 윗면 — 솔더가 젖는 바닥 (모서리에서 멈춤)`)); fy += hh; });
        if (i === 0){
          let d = `M${q(cx - a)},${base} L${q(cx - a)},${q(yc)}`;
          const n = 8, g = K.rng(7);
          for (let j = 1; j <= n; j++) d += ` L${q(cx - a + 2 * a * j / n)},${q(yc + (j < n ? (g() - 0.5) * 6 : 0))}`;
          o += P(d + ` L${q(cx + a)},${base} Z`, 'f-sn2', tip('도금한 그대로 — 원기둥, 겉이 거칠다'));
        } else if (i === 1){
          const rr = Math.min(a, st.hc * m) * 0.6;
          o += P(`M${q(cx - a)},${base} L${q(cx - a)},${q(yc + rr)} Q${q(cx - a)},${q(yc)} ${q(cx - a + rr)},${q(yc - 2)} L${q(cx + a - rr)},${q(yc - 2)} Q${q(cx + a)},${q(yc)} ${q(cx + a)},${q(yc + rr)} L${q(cx + a)},${base} Z`, 'f-sn2', tip('녹기 시작 — 모서리부터 둥글어진다'));
          o += R(cx - a, yc, 2 * a, st.hc * m, 'pl-ghost');
          [-1, 1].forEach(sd => { o += arrow(cx + sd * (a - 4), yc - 14, cx + sd * a * 0.3, yc - 34, 's-arr'); });
        } else if (i === 2){
          const hh = Math.max(c.h, 1) * m * 1.14, aa = c.r * m * 0.98;
          o += P(cap(cx, base, aa, hh), 'f-sn2', tip('출렁임 — 약 10 µs 주기로 흔들리다 1 ms 안에 가라앉는다'));
          o += P(cap(cx, base, c.r * m, c.h * m), 'pl-ghost');
          o += P(`M${q(cx - 30)},${q(base - hh - 12)} q15,-8 30,0 q15,8 30,0`, 'rf04-wig') + P(`M${q(cx - 30)},${q(base - hh - 26)} q15,-8 30,0 q15,8 30,0`, 'rf04-wig');
        } else {
          o += solder(c, cx, base, m, 'f-sn2', c.mode === 'wick' ? fz(c.L) : null) + R(cx - a, yc, 2 * a, st.hc * m, 'pl-ghost', tip('점선 = 도금한 원기둥'));
          if (c.r < c.a - 0.05) o += R(cx - a, base - 3, a - c.r * m, 4, 'rf04-bare') + R(cx + c.r * m, base - 3, a - c.r * m, 4, 'rf04-bare');
        }
        o += LB(T(cx, 568, t1, 't-sub') + T(cx, 594, t2, 't-dim'));
        if (i) o += T(60 + i * 228 - 8, 410, '→', 't-lbl');
      });
      o += LB(T(60, 240, `부피 ${fmt(c.V)} µm³ — 네 칸 모두 같다`, 't-warn', 'start'));
      return o;
    }
    // ── 위: 접촉선 큰 그림 (angle)
    function contact(){
      const th = TH[st.die][st.sf], tn = TOP[st.die], sfn = SFN[st.sf](st.die), rp = th > 90 ? 128 : 260, hp = rp * Math.tan(th * RAD / 2), cx = 380, Px = cx + rp, Py = 580;
      const dir = t => [-Math.cos(t * RAD), -Math.sin(t * RAD)];
      // 바닥 = 맨 위 금속 (베이스 상부 Cu · 코어 Ni)
      let o = R(80, 580, 880, 22, st.die === 'b' ? 'f-cu2' : 'f-ni', tip(`${tn} 윗면 (고체) — 솔더가 젖는 바닥 (${DIEN[st.die]})`));
      o += L(80, 580, 960, 580, 's-edge') + LB(T(96, 597, `${tn} (고체)`, 'rf04-dk', 'start'));
      o += P(cap(cx, Py, rp, hp), 'f-sn2', tip(`녹은 솔더 방울 — 접촉각 약 ${th}° (${sfn})`));
      o += C(Px, Py, 7, 'k-acc2', tip('접촉선 — 고체 · 액체 · 기체가 만나는 곳'));
      const gSL = 120, gSV = Math.max(26, gSL + 130 * Math.cos(th * RAD));      // 영의 식: γ_SV = γ_SL + γ_LV·cosθ (그림 길이, γ_LV = 130)
      o += arrow(Px, Py, Px + gSV, Py, 's-arrg') + arrow(Px, Py, Px - gSL, Py, 's-arrr');
      const [ux, uy] = dir(th);
      o += arrow(Px, Py, Px + 130 * ux, Py + 130 * uy, 's-arr');
      // θ 호 (액체 쪽: 고체–액체 면에서 표면 접선까지)
      const ra = 46, [ex, ey] = [Px + ra * ux, Py + ra * uy];
      o += P(`M${q(Px - ra)},${Py} A${ra},${ra} 0 0 1 ${q(ex)},${q(ey)}`, 'rf04-arc');
      const [hx, hy] = dir(th / 2);
      o += LB(T(Px + 88 * hx, Py + 88 * hy + 8, `θ ${th}°`, 't-warn'));
      o += LB(T(Px + Math.max(gSV, 64) + 10, Py - 14, '고체–기체', 't-sub', 'start'));
      o += LB(T(Px - gSL - 10, Py - 12, '고체–액체', 'rf04-dk', 'end'));
      const lx = Px + 130 * ux, ly = Py + 130 * uy;
      o += LB(th < 60 ? T(lx - 8, ly - 14, '액체–기체 (표면장력)', 't-sub', 'end') : T(lx + 14, ly - 4, '액체–기체 (표면장력)', 't-sub', 'start'));
      // 지금 상태 (오른쪽 위)
      o += LB(T(670, 290, `지금 ${tn}/SnAg 계면`, 't-dim', 'start') + T(670, 322, sfn, 't-warn', 'start') + T(670, 352, `접촉각 약 ${th}°`, 't-sub', 'start') + T(670, 380, SFW[st.sf], 't-sub', 'start'));
      o += LB(T(670, 420, th < 50 ? '고체–기체 힘이 커서 넓게 퍼짐' : th < 90 ? '고체–기체 힘이 조금 커서 덜 퍼짐' : '고체–기체 힘이 작아 물러남', 't-dim', 'start'));
      return o;
    }
    // ── 위: 모서리 확대 (edge)
    function corner(c){
      const cx = 430, cy = 400, dir = t => [-Math.cos(t * RAD), -Math.sin(t * RAD)], lim = c.lim, tn = TOP[st.die], base = st.die === 'b';
      // 층 (비율 아님): 베이스 상부 Cu 52 · Ni 52 · Cu 기둥 94 px, 코어 Ni 140 px + 시드 + 보호막. ZB = 옆면 막 길이 µm → px
      let o = '';
      if (base){
        o += R(80, 400, 350, 52, 'f-cu2', tip(LTIP.tc)) + R(80, 452, 350, 52, 'f-ni', tip(LTIP.ni.b)) + R(80, 504, 350, 94, 'f-cu2', tip(LTIP.cu));
        o += LB(T(96, 433, '상부 Cu (3 µm)', 'rf04-dk', 'start') + T(96, 485, 'Ni (3 µm)', 'rf04-dk', 'start') + T(96, 556, 'Cu 기둥', 'rf04-dk', 'start'));
      } else {
        o += R(80, 400, 350, 140, 'f-ni', tip(LTIP.ni.k)) + R(80, 540, 350, 8, 'f-seed2', tip('Cu · Ti 시드 (실제 수백 nm — 그림은 과장)')) + R(62, 548, 556, 50, 'f-pas', tip('보호막 — 솔더가 젖지 않는다'));
        o += LB(T(96, 476, 'Ni (5 µm)', 'rf04-dk', 'start') + T(96, 580, '보호막 (안 젖음)', 'rf04-dk', 'start'));
      }
      o += L(80, 400, 430, 400, 's-edge') + L(430, 400, 430, base ? 598 : 548, 's-edge');
      const ZB = base ? [[0, 0], [3, 52], [6, 104], [18, 198]] : [[0, 0], [5, 140]];
      const zpx = L0 => { for (let j = 1; j < ZB.length; j++) if (L0 <= ZB[j][0]) return ZB[j - 1][1] + (L0 - ZB[j - 1][0]) / (ZB[j][0] - ZB[j - 1][0]) * (ZB[j][1] - ZB[j - 1][1]); return ZB[ZB.length - 1][1]; };
      if (c.mode === 'dewet' || c.mode === 'ball'){
        // 바닥이 안 젖어 모서리까지 오지 못함
        const th = c.thY, rx = 130, hh = rx * Math.tan(th * RAD / 2), mx = 210;
        o += `<clipPath id="${K.id('rf04-zc')}"><rect x="80" y="230" width="540" height="170"/></clipPath>`;
        o += G(P(cap(mx, cy, rx, hh), 'f-sn2'), {'clip-path': K.url('rf04-zc')});
        o += R(mx + rx, cy - 3, cx - mx - rx, 4, 'rf04-bare', tip(`드러난 ${tn}`));
        o += LB(T(cx - 8, cy + 30, `드러난 ${tn} ↑`, 'rf04-dk', 'end'));
        o += TT(446, 306, [`${tn} 윗면이`, '안 젖어', '모서리까지', '오지 못함'], 't-sub', 'start', 26);
        return o;
      }
      const thS = Math.min(c.th0, lim), Rz = Math.min(320, 170 / (1 - Math.cos(thS * RAD)));
      const [ux, uy] = dir(thS), nx = -Math.sin(thS * RAD), ny = Math.cos(thS * RAD), ox = cx + Rz * nx, oy = cy + Rz * ny;
      const b0 = Math.atan2(cy - oy, cx - ox), sgn = (-Math.sin(b0) * ux + Math.cos(b0) * uy) > 0 ? 1 : -1;
      const bT = -Math.PI / 2, TAU = 2 * Math.PI;
      let span = sgn > 0 ? ((bT - b0) % TAU + TAU) % TAU : -(((b0 - bT) % TAU + TAU) % TAU);
      const pts = [[cx, cy]];
      for (let k = 1; k <= 48; k++){ const b = b0 + span * k / 48, x = ox + Rz * Math.cos(b), y = oy + Rz * Math.sin(b); if (x < 82){ pts.push([82, y]); break; } pts.push([x, y]); }
      const last = pts[pts.length - 1];
      if (last[0] > 82) pts.push([82, last[1]]);
      pts.push([82, cy]);
      // 흘러내린 막 (옆면) — 젖는 옆면 끝에 닿으면 멈추고 두꺼워진다
      if (c.mode === 'wick'){
        const Lz = Math.max(10, zpx(Math.min(c.Lfull, c.Lm))), tz = 14 * K.clamp(c.t / TF, 1, 3);
        o += P(`M${cx},${cy - 2} L${q(cx + tz)},${cy + 6} L${q(cx + tz)},${q(cy + Lz - 7)} Q${q(cx + tz)},${q(cy + Lz)} ${cx},${q(cy + Lz)} Z`, 'f-sn2', tip(`넘친 솔더가 옆면을 타고 내려간 막 (${f1(c.L)} µm${c.stop ? ' — ' + stopName(st, c) : ''})`));
        o += arrow(cx + tz + 18, cy + 12, cx + tz + 18, cy + Math.max(36, Lz - 8), 's-arr2');
        if (c.stop){
          o += L(cx - 4, cy + Lz, cx + tz + 10, cy + Lz, 'rf04-stop');
          o += LB(T(cx - 12, Math.min(cy + Lz + (base && st.sw === 'ox' ? 26 : -12), 592), base ? (st.sw === 'ox' ? (c.over ? 'Ni 앞 — 테 두꺼움 →' : 'Ni 앞에서 멈춤 →') : '기둥 밑까지 →') : 'Ni 밑동까지 →', 'rf04-dk', 'end'));
        } else o += LB(T(cx + tz + 34, cy + Math.min(Lz, 140) / 2 + 30, '흘러내림', 't-warn', 'start'));
      }
      o += K.PG(pts, 'f-sn2', tip(`녹은 솔더 — 모서리에서 겉보기 각 ${Math.round(thS)}°`));
      // 허용 부채꼴 θ_Y ~ 한계
      const rf = 118, a0 = c.thY, a1 = Math.min(lim, 180), [f0x, f0y] = dir(a0), [f1x, f1y] = dir(a1);
      o += P(`M${cx},${cy} L${q(cx + rf * f0x)},${q(cy + rf * f0y)} A${rf},${rf} 0 0 1 ${q(cx + rf * f1x)},${q(cy + rf * f1y)} Z`, 'rf04-fan', tip(`멈춰 있을 수 있는 각의 범위: ${a0}° ~ ${lim < 180 ? lim + '°' : '180° 넘음'}`));
      const wick = c.mode === 'wick';
      o += L(cx, cy, cx + 140 * ux, cy + 140 * uy, 'rf04-tan');
      const tx = cx + 140 * ux, ty = cy + 140 * uy;
      if (wick){ const [lx, ly] = dir(lim); o += LB(T(cx + 96 * lx + 18, cy + 96 * ly + 6, `한계 ${lim}°`, 'pl-warn', 'start') + T(cx + 96 * lx + 18, cy + 96 * ly + 32, '→ 넘침', 't-warn', 'start')); }
      else {
        o += LB(T(tx - 8, ty - 4, `겉보기 ${Math.round(c.th0)}°`, 't-warn rf04-halo', 'end'));
        if (lim < 180){
          const [lx, ly] = dir(lim);
          o += L(cx, cy, cx + 140 * lx, cy + 140 * ly, 'pl-peak') + LB(T(cx + 118 * lx + 14, cy + 118 * ly + 26, `한계 ${lim}°`, 'pl-warn', 'start'));
        } else o += L(cx, cy, cx + 150, cy, 'pl-peak') + LB(T(cx + 20, cy + 34, '한계 > 180°', 'pl-warn', 'start'));
      }
      const [yx, yy] = dir(a0);
      o += LB(T(cx + 128 * yx - 6, cy + 128 * yy + 4, `θ ${a0}°`, 'rf04-dk', 'end'));
      return o;
    }
    function side(){
      const cur = st.sw, base = st.die === 'b';
      const box = (y, h, on, hd, cls, lines) => R(636, y, 330, h, on ? 'pl-hlbox' : 'pl-lane', {rx: 10}) + T(652, y + 32, hd, cls, 'start') + TT(652, y + 62, lines, 't-dim', 'start', 25);
      let o = base ? box(270, 150, cur === 'ox', '산화된 Ni 옆면', 'pl-hdg3', ['상부 Cu 옆면(3 µm)만 젖고', '산화된 Ni 앞에서 멈춤', '(뒤 공정 접착에는 나쁨)'])
        : box(270, 150, cur === 'ox', '산화된 Ni 옆면', 'pl-hdg3', ['잘 안 젖음 → 한계가 180°를', '넘어 돔이 넘치지 않음', '(뒤 공정 접착에는 나쁨)']);
      o += base ? box(434, 178, cur === 'cl', '깨끗한 Ni 옆면', 'pl-hdg2', ['센 환원으로 Ni 산화막까지', '걷힘 → 105°를 넘은 솔더가', 'Ni를 지나 Cu 기둥 옆면', '밑(18 µm)까지 내려감'])
        : box(434, 178, cur === 'cl', '깨끗한 Ni 옆면', 'pl-hdg2', ['Ni 산화막까지 걷힘 · 옆면', '각 약 15° (가정) → 105°를', '넘으면 Ni 옆면(5 µm)을', '타고 밑동까지 내려감']);
      return o;
    }
    // ── 오른쪽 패널: 부피 → 높이 그래프 (volume)
    function pvol(c){
      const GX0 = 1086, GX1 = 1520, GY0 = 570, GY1 = 254, a = c.a;
      const Vmax = Math.max(16000, Math.ceil(c.V * 1.3 / 4000) * 4000), hTop = Math.max(capH(a, Vmax), c.h * 1.1, 24);
      const Hmax = Math.ceil(hTop / 8) * 8, X = v => GX0 + v / Vmax * (GX1 - GX0), Y = h => GY0 - h / Hmax * (GY0 - GY1);
      let o = T(1030, 176, `부피 → 돔 꼭대기 (바닥 지름 ${st.d} µm)`, 't-acc', 'start');
      o += L(1036, 206, 1076, 206, 's-curve') + T(1084, 213, '돔 꼭대기 (가장자리 고정)', 't-sub', 'start');
      o += L(1346, 206, 1386, 206, 's-curve2') + T(1394, 213, '도금 높이', 't-sub', 'start');
      o += R(X(c.V * 0.95), GY1, X(c.V * 1.05) - X(c.V * 0.95), GY0 - GY1, 'rf04-band2', tip('부피 ±5 % 범위'));
      o += L(GX0, GY0, GX1 + 8, GY0, 's-axis') + L(GX0, GY0, GX0, GY1 - 6, 's-axis');
      const xs = Vmax / 4;
      for (let k = 0; k <= 4; k++){ const v = xs * k; o += L(X(v), GY0, X(v), GY0 + 8, 's-axis') + T(X(v), GY0 + 30, k ? fmt(v) : '0', 't-dim'); }
      for (let h = 0; h <= Hmax; h += 8) o += L(GX0 - 8, Y(h), GX0, Y(h), 's-axis') + T(GX0 - 12, Y(h) + 7, String(h), 't-dim', 'end');
      o += T((GX0 + GX1) / 2, GY0 + 58, '솔더 부피 (µm³)', 't-sub') + T(GX0 - 12, GY1 - 14, 'µm', 't-dim', 'end');
      o += `<clipPath id="${K.id('rf04-gc')}"><rect x="${GX0}" y="${GY1}" width="${GX1 - GX0}" height="${GY0 - GY1}"/></clipPath>`;
      let dc = `M${GX0},${GY0}`;
      for (let k = 1; k <= 80; k++){ const v = Vmax * k / 80; dc += ` L${q(X(v))},${q(Y(capH(a, v)))}`; }
      const dl = `M${GX0},${GY0} L${q(X(Vmax))},${q(Y(Vmax / (Math.PI * a * a)))}`;
      let g = L(GX0, Y(a), GX1, Y(a), 's-dash') + P(dc, 's-curve', tip('돔 꼭대기 h — 부피 V = πh(3a² + h²)/6')) + P(dl, 's-curve2', tip('도금 높이 = 부피 ÷ 바닥 넓이 (원기둥)'));
      const vx = Math.PI * a * a * Math.sqrt(3) * a;
      if (vx < Vmax) g += C(X(vx), Y(Math.sqrt(3) * a), 6, 'k-acc', tip('여기서 돔 꼭대기 = 도금 높이 (도금 높이가 지름의 약 0.87배). 더 많으면 공처럼 옆으로 부풀어 꼭대기가 도금보다 낮아진다'));
      // 모서리 아래 옆면이 젖으면(베이스 상부 Cu 옆면 · 깨끗한 Ni 옆면) 꼭대기는 옆면 한계(105°)의 높이에 묶인다
      const hm = a * Math.tan((TSIDE + 90) * RAD / 2), Vm = capV(a, hm), avoid = [], hasLim = c.lim < 180;
      const limN = st.die === 'b' ? '상부 Cu 옆면' : '깨끗한 Ni 옆면';
      if (hasLim && Vm < Vmax) g += L(X(Vm), Y(hm), GX1, Y(hm), 'pl-peak', tip(`${limN}: 겉보기 각 ${TSIDE + 90}°를 넘는 솔더는 옆면으로 흘러내려 꼭대기가 ${f1(hm)} µm에 묶인다`));
      o += G(g, {'clip-path': K.url('rf04-gc')});
      // 그래프 선 위의 점들 (돔 곡선 · 도금 높이 선 · 반구 점선 · 옆면 한계 선) — 글이 선을 가로지르지 않게
      const onLine = [];
      for (let k = 0; k <= 200; k++){ const v = Vmax * k / 200; onLine.push([X(v), Y(capH(a, v))], [X(v), Y(v / (Math.PI * a * a))]); }
      for (let x = GX0; x <= GX1; x += 5) onLine.push([x, Y(a)]);
      if (hasLim && Vm < Vmax) for (let x = X(Vm); x <= GX1; x += 5) onLine.push([x, Y(hm)]);
      const hitLine = (x, y, w, up, dn) => onLine.some(([sx, sy]) => sy >= GY1 && sx > x - 4 && sx < x + w + 4 && sy > y - up && sy < y + dn);
      const hitBox = (x, y, w, up, dn) => avoid.some(b => x < b[2] && x + w > b[0] && y - up < b[3] && y + dn > b[1]);
      const px = X(c.V), py = Y(c.h), nearPt = (x, y, w, up, dn) => Math.hypot(K.clamp(px, x, x + w) - px, K.clamp(py, y - up, y + dn) - py) <= 20;
      if (hasLim && Vm < Vmax){
        // 선 오른쪽 끝 아래 (위쪽은 돔 곡선 · 도금 높이 선이 지나간다)
        const lt = `${limN} 한계`, w0 = tw(lt, 22), lx = GX1 - 4 - w0, ly = Y(hm) + 26;
        o += LB(T(lx, ly, lt, 'pl-warn rf04-halo', 'start')); avoid.push([lx - 4, ly - 22, lx + w0 + 4, ly + 6]);
      }
      // 반구 점선 이름: 오른쪽 끝 위 → 아래 → 왼쪽 끝 위 → 아래 중 곡선 · 점 · 다른 글과 안 겹치는 곳
      //   (긴 이름이 들어갈 곳이 없으면 짧게 '반구')
      const hcs = [];
      ['반구 (높이 = 바닥 반지름)', '반구'].forEach(t => { const w = tw(t, 19); [[GX1 - 4 - w, Y(a) - 10], [GX1 - 4 - w, Y(a) + 24], [GX0 + 10, Y(a) - 10], [GX0 + 10, Y(a) + 24], [(GX0 + GX1 - w) / 2, Y(a) - 10], [(GX0 + GX1 - w) / 2, Y(a) + 24]].forEach(([x, y]) => { if (y - 18 >= GY1 && y <= GY0 - 6) hcs.push([x, y, t, w]); }); });
      const [hx, hy, ht, hw] = hcs.find(([x, y, , w]) => !hitLine(x, y, w, 19, 6) && !hitBox(x, y, w, 18, 4) && !nearPt(x, y, w, 18, 4)) || hcs.find(([x, y, , w]) => !hitLine(x, y, w, 19, 6)) || hcs[0] || [GX1 - 4 - tw('반구', 19), Y(a) + 24, '반구', tw('반구', 19)];
      o += LB(T(hx, hy, ht, 't-dim rf04-halo', 'start', tip('반구 — 돔 높이 = 바닥 반지름 (겉보기 각 90°)'))); avoid.push([hx - 2, hy - 18, hx + hw + 2, hy + 4]);
      // 지금 점
      o += C(px, py, 9, c.mode === 'dome' ? 'k-acc2' : 'k-warn') + C(px, py, 18, 'co-ring');
      const lt = `${fmt(c.V)} µm³ → ${f1(c.h)} µm`, lw = tw(lt, 23);
      const xc = K.clamp(px - lw / 2, GX0 + 4, GX1 + 36 - lw), cands = [];
      [-16, 30, -44, 56, -72, 84, -100, 112, -128, 140].forEach(dy => [px + 18, px - 18 - lw, xc, px - 30, px + 30 - lw, px - lw / 4, px - 3 * lw / 4].forEach(x => cands.push([x, py + dy])));
      cands.push([GX0 + 12, GY1 + 26], [GX1 + 36 - lw, GY0 - 12]);
      const fits = ([x, y]) => x >= GX0 + 4 && x + lw <= GX1 + 36 && y - 20 >= GY1 && y <= GY0 - 6 && !hitBox(x, y, lw, 20, 6) && !hitLine(x, y, lw, 22, 8) && !nearPt(x, y, lw, 20, 6);
      // 들어갈 수 있는 자리 중 점에 가장 가까운 곳 (±5 % 띠 테두리를 가로지르면 조금 손해)
      const bE = [X(c.V * 0.95), X(c.V * 1.05)], score = ([x, y]) => Math.hypot(K.clamp(px, x, x + lw) - px, K.clamp(py, y - 20, y + 6) - py) + (bE.some(b => b > x - 2 && b < x + lw + 2) ? 40 : 0);
      const [lx0, ly0] = cands.filter(fits).sort((u, v) => score(u) - score(v))[0] || [xc, py - 36 >= GY1 ? py - 16 : py + 30];
      o += LB(T(lx0, ly0, lt, 't-warn rf04-halo', 'start'));
      // 아래 글
      let y = 672;
      const line = (t, cls, em = 24.5, lh = 29) => { const ln = wrap(t, em); o += TT(1030, y, ln, cls, 'start', lh); y += ln.length * lh + 10; };
      if (c.mode === 'dome'){
        line(`부피 ±5 % → 꼭대기 ±${c.dh.toFixed(2)} µm (±${(c.dh / c.h * 100).toFixed(1)} %)`, 't-warn', 22);
        line(`도금 높이였다면 ±${(0.05 * st.hc).toFixed(2)} µm — ${c.h > c.a ? '돔이 반구보다 높아 조금 줄어서 넘어갑니다. 아주 얇은 솔더(반구보다 낮은 돔)는 오히려 커집니다.' : '돔이 반구보다 낮아 오히려 커져서 넘어갑니다 (얇을수록 약 2배까지).'}`, 't-sub');
        if (hasLim && c.room != null && c.room < 30) line(`${limN} 한계까지 부피 여유 약 +${c.room.toFixed(1)} % — 더 많으면 옆면으로 넘칩니다.`, 't-sub');
      } else if (c.mode === 'wick'){
        line(`꼭대기는 ${limN} 한계 105°에 묶여 ${f1(c.h)}\u00a0µm`, 't-warn', 22);
        line(`넘친 ${fmt(c.Vex)} µm³는 옆면으로 → 부피 ±5 %는 꼭대기가 아니라 ${c.stop ? `옆면 막 두께로 넘어갑니다 (${stopName(st, c)}).` : `흘러내림 길이로${c.dL ? ` (±${f1(c.dL)} µm)` : ''} 넘어갑니다.`}`, 't-sub');
      } else {
        line(`바닥이 물러나 점이 곡선보다 높다 (${f1(c.h)} µm)`, 't-warn', 22);
        line(`바닥 지름 ${f1(2 * c.r)} µm로 줄어 더 높은 공에 가까워집니다. 이때 부피 ±5 % → 꼭대기 ±${c.dh.toFixed(2)} µm.`, 't-sub');
      }
      if (c.dH < 0 && c.mode === 'dome') line(`도금 높이가 지름의 약 0.87배를 넘어 공처럼 옆으로 부풀었습니다 — 꼭대기가 도금보다 ${f1(-c.dH)} µm 낮음.`, 't-sub');
      line('→ 리플로우 뒤 높이 산포를 줄이는 손잡이는 대부분 앞 공정입니다 (도금 부피 = 두께 × 바닥 넓이).', 't-dim', 26.5, 26);
      return o;
    }
    // ── 오른쪽 패널: 방울 셋 (angle)
    function pang(c){
      const tn = TOP[st.die], TD = TH[st.die];
      let o = T(1030, 176, `${tn}/SnAg 계면 상태 → 접촉각 (${DIEN[st.die]})`, 't-acc', 'start');
      [['c', TD.c, `깨끗한 ${tn}`, `약 ${TD.c}° — 잘 젖음`], ['o', TD.o, '얇은 산화', `약 ${TD.o}° — 덜 젖음`], ['x', TD.x, '계면 산화 · 오염', `약 ${TD.x}° — 안 젖음`]].forEach(([k, th, n1, n2], i) => {
        const y = 200 + i * 172, on = st.sf === k, rp = th > 90 ? 34 : 62, hp = rp * Math.tan(th * RAD / 2);
        o += R(1030, y, 500, 156, on ? 'pl-hlbox' : 'pl-lane', {rx: 10});
        o += R(1048, y + 124, 164, 12, st.die === 'b' ? 'f-cu2' : 'f-ni', tip(`${tn} 윗면`)) + P(cap(1130, y + 124, rp, hp), 'f-sn2', tip(`${n1} — ${n2}`));
        o += T(1236, y + 58, n1, on ? 't-warn' : 't-sub', 'start') + T(1236, y + 90, n2, 't-dim', 'start');
        if (on) o += T(1514, y + 30, '지금', 'pl-hdg', 'end');
      });
      let y = 742;
      const line = (t, cls, em = 24.5, lh = 28) => { const ln = wrap(t, em); o += TT(1030, y, ln, cls, 'start', lh); y += ln.length * lh + 10; };
      o += T(1030, y, '겉보기 각 ≠ 접촉각', 'pl-hdg', 'start'); y += 34;
      line(c.mode === 'dome' || c.mode === 'wick' ? `가장자리에 걸린 돔의 각(지금 ${Math.round(c.th0)}°)은 부피가 정합니다. 접촉각은 '바닥을 다 덮을 수 있는가'만 정합니다.` : `접촉각 ${c.thY}°가 다 덮을 때의 각 ${Math.round(c.th0)}°보다 커서 바닥을 다 덮지 못합니다 → 바닥 지름 ${f1(2 * c.r)} µm.`, 't-sub');
      line('보고값(조건 · 측정법에 따라): SnAg 계열은 깨끗한 Cu · Ni 위 모두 대략 30~45°로 겹치고, 같은 조건이면 Cu 위가 조금 작은 편입니다. Ni 산화막은 Cu 산화막보다 잘 안 걷혀 코어 다이(Ni 위)가 더 민감합니다. 솔더 겉 산화막은 공이 아니라 덜 둥긂으로 나타납니다 (03장).', 't-dim', 26.5, 26);
      return o;
    }
    // ── 오른쪽 패널: 틈 · 흘러내림 (edge)
    function pedge(c){
      let o = T(1030, 176, '이웃과 틈 · 흘러내림', 't-acc', 'start');
      const BX0 = 1050, BX1 = 1510, gmax = 30, Xg = g => BX0 + Math.max(0, Math.min(gmax, g)) / gmax * (BX1 - BX0);
      o += R(BX0, 214, Xg(5) - BX0, 30, 'rf04-zng') + R(Xg(5), 214, Xg(10) - Xg(5), 30, 'rf04-zw') + R(Xg(10), 214, BX1 - Xg(10), 30, 'rf04-zok');
      [0, 5, 10, 20, 30].forEach(g => { o += L(Xg(g), 244, Xg(g), 252, 's-axis') + T(Xg(g), 274, String(g), 't-dim'); });
      o += T(BX1, 300, '틈 (µm)', 't-dim', 'end') + T(BX0 + 4, 300, '붙을 위험 · 여유 적음 · 괜찮음 (예시)', 't-dim', 'start');
      const gx = Xg(c.gap);
      o += P(`M${q(gx)},208 l-10,-16 l20,0 Z`, c.gap < 5 ? 'k-ng' : c.gap < 10 ? 'k-warn' : 'k-ok') + L(gx, 210, gx, 248, 'rf04-dim');
      let y = 352;
      const line = (t, cls, em = 24.5, lh = 29) => { const ln = wrap(t, em); o += TT(1030, y, ln, cls, 'start', lh); y += ln.length * lh + 12; };
      line(c.gap > 0 ? `틈 ${f1(c.gap)} µm (피치 ${st.p} − 범프 가장 넓은 폭 ${f1(2 * c.Rw)})` : `틈 없음 — 피치 ${st.p} µm < 범프 폭 ${f1(2 * c.Rw)} µm`, c.gap < 5 ? 'pl-warn' : 't-warn', 22);
      const tn = TOP[st.die], base = st.die === 'b', th = `꼭대기 ${f1(c.h0)} → ${f1(c.h)}\u00a0µm`;
      if (c.mode === 'wick') line(c.stop ? (base && st.sw === 'ox' ? `상부 Cu 옆면(3 µm)을 다 적시고 산화된 Ni 앞에서 멈춤 — 테가 ${f1(c.t)} µm로 두꺼워짐${c.over ? '(띠 3 µm보다 두꺼워 Ni도 넘을 수 있음)' : ''}. ${th}` : `흘러내림 — ${base ? '기둥 밑(18 µm)' : 'Ni 밑동(5 µm)'}까지 닿고 막이 ${f1(c.t)} µm로 두꺼워짐. ${th}`) : `흘러내림 ${f1(c.L)} µm (${onLayer(st.die, c.L)}) · ${th}. 옆면에도 IMC가 생깁니다 (05장).`, 't-sub');
      else if (c.mode === 'dome') line(c.lim < 180 ? `겉보기 각 ${Math.round(c.th0)}° < 한계 105° — 아직 모서리에 걸려 있습니다. ${base ? '상부 Cu 옆면은 늘 잘 젖어' : '깨끗한 Ni 옆면이라'} 부피가 약 ${c.room.toFixed(0)} %${c.room < 20 ? '만 많아도' : ' 많아지면'} 넘칩니다.` : `흘러내림 없음 — 산화된 Ni 옆면이 모서리에서 붙잡습니다 (겉보기 각 ${Math.round(c.th0)}°).`, 't-sub');
      else line(`바닥(${tn} 윗면)도 다 젖지 않아 모서리까지 오지 못했습니다 — 흘러내림 없음.`, 't-sub');
      line('뒤 공정: 열압착(TC) 본딩(누르면서 데워 붙임) 때 눌리면 더 흘러내리고 퍼집니다.', 't-sub');
      const J = {ok: '괜찮음 — 틈 여유 충분', warn: '여유 적음', ng: '이웃과 붙을 위험 (브리지)'}[c.gapCls];
      o += T(1030, y + 8, `틈 판정: ${J}`, c.gapCls === 'ok' ? 'pl-hdg3' : 'pl-hdg2', 'start');
      // 도금 높이 → 옆면 막 길이 (지금 다이 · 지름). 실선 = 지금 옆면 상태, 회색 점선 = 다른 상태. 오른쪽 띠 = 막이 지나는 옆면
      const a = c.a, hm = a * Math.tan((TSIDE + 90) * RAD / 2), hth = capV(a, hm) / (Math.PI * a * a), Lmc = LMAX(st.die, 'cl');
      const Lc = (hc, sw) => LIM(st.die, sw) > 180 ? 0 : Math.min(LMAX(st.die, sw), Math.max(0, (Math.PI * a * a * hc - capV(a, hm)) / (Math.PI * (st.d + TF) * TF)));
      const CY0 = y + 236, CY1 = y + 92, CX0 = 1090, CX1 = 1420, xh = v => CX0 + (v - 4) / 21 * (CX1 - CX0), yl = v => CY0 - v / Lmc * (CY0 - CY1);
      o += T(1030, y + 44, `도금 높이 → 옆면 막 길이 (${DIEN[st.die]} · 지름 ${st.d} µm)`, 'pl-hdg', 'start');
      o += L(CX0, CY0, CX1 + 8, CY0, 's-axis') + L(CX0, CY0, CX0, CY1 - 6, 's-axis');
      [4, 10, 15, 20, 25].forEach(v => { o += L(xh(v), CY0, xh(v), CY0 + 7, 's-axis') + T(xh(v), CY0 + 28, v === 25 ? '25 µm' : String(v), 't-dim'); });
      (base ? [0, 3, 6, 18] : [0, 5]).forEach(v => { o += L(CX0 - 7, yl(v), CX0, yl(v), 's-axis') + T(CX0 - 12, yl(v) + 7, String(v), 't-dim', 'end'); });
      o += T(CX0 - 12, CY1 - 18, 'µm', 't-dim', 'end');
      (base ? [[0, 3, 'f-cu2', '상부 Cu', LTIP.tc], [3, 6, 'f-ni', 'Ni', LTIP.ni.b], [6, 18, 'f-cu2', 'Cu 기둥', LTIP.cu]] : [[0, 5, 'f-ni', 'Ni', LTIP.ni.k]]).forEach(([u0, u1, cls, nm, tp]) => {
        o += R(1436, yl(u1), 14, yl(u0) - yl(u1), cls, tip(tp)) + T(1458, (yl(u0) + yl(u1)) / 2 + 7, nm, 't-dim', 'start');
      });
      o += T(1436, CY1 - 18, '옆면', 't-dim', 'start');
      const path = sw => { let d = ''; for (let k = 0; k <= 84; k++){ const v = 4 + 21 * k / 84; d += (k ? ' L' : 'M') + q(xh(v)) + ',' + q(yl(Lc(v, sw))); } return d; };
      const oth = st.sw === 'cl' ? 'ox' : 'cl', SWN = {ox: '산화된 옆면', cl: '깨끗한 옆면'};
      o += P(path(oth), 'rf04-alt', tip(`${SWN[oth]}일 때 (비교)`)) + P(path(st.sw), 's-curve', tip(`${SWN[st.sw]}일 때 옆면 막 길이 (평형 · 개념 모델)`));
      const hasLim = c.lim < 180 || LIM(st.die, oth) < 180;
      if (hasLim && hth >= 4 && hth <= 25) o += L(xh(hth), CY0, xh(hth), CY1, 's-dash', tip(`모서리 아래 옆면이 젖으면 도금 높이 ${f1(hth)} µm부터 넘친다 (지름 ${st.d} µm)`));
      const ly0 = Lc(st.hc, st.sw);
      o += C(xh(st.hc), yl(ly0), 9, ly0 > 0 ? 'k-acc2' : 'k-ok') + C(xh(st.hc), yl(ly0), 18, 'co-ring');
      // 그림 풀이 (글이 곡선 · 점과 겹치지 않게 그래프 아래에)
      const lg = wrap(`실선 = 지금(${SWN[st.sw]}), 회색 점선 = ${SWN[oth]}` + (hasLim ? ` · 세로 점선 = 넘치기 시작하는 도금 높이 ${f1(hth)} µm` : '') + ` · 지금 점: 도금 ${f1(st.hc)} µm → 막 ${f1(ly0)} µm` + (c.lim > 180 ? ' (산화된 Ni 옆면이라 넘치지 않음)' : ''), 27);
      o += TT(1030, y + 294, lg, 't-dim', 'start', 25);
      y += 294 + lg.length * 25 + 22;
      // 환원 세기 — 맞바꿈 (지금 옆면 상태 표시)
      const ty = y, cl = st.sw === 'cl';
      o += T(1030, ty, '환원 세기(플럭스 · 포름산) — 맞바꿈', 'pl-hdg', 'start');
      o += K.arrowP(`M1290,${ty + 34} L1060,${ty + 34}`, 's-arr3') + K.arrowP(`M1300,${ty + 34} L1520,${ty + 34}`, 's-arr3');
      o += T(1060, ty + 66, '약함', 't-sub', 'start') + T(1520, ty + 66, '셈', 't-sub', 'end');
      o += C(cl ? 1440 : 1140, ty + 34, 11, 'k-acc2') + C(cl ? 1440 : 1140, ty + 34, 20, 'co-ring');
      o += TT(1040, ty + 98, ['옆면 산화 남음', st.die === 'b' ? 'Ni 앞 멈춤 · 접착 나쁨' : '흘러내림 막음 · 접착 나쁨'], cl ? 't-dim' : 't-sub', 'start', 26);
      o += TT(1520, ty + 98, ['옆면 깨끗', '흘러내림 위험 · 접착 좋음'], cl ? 't-sub' : 't-dim', 'end', 26);
      return o;
    }
    // ── 오른쪽 패널: 두 다이 비교 (dies) — 지금 고른 다이 칸을 강조
    function pdies(){
      let o = T(1030, 176, '베이스 · 코어 — 리플로우에서 다른 점', 't-acc', 'start');
      const CB = 1168, CK = 1368, rows = [
        ['젖는 바닥', '상부 Cu', 'Ni'],
        ['산화막', 'Cu 산화막 — 플럭스 · 포름산에 잘 걷힘', 'Ni 산화막 — 단단해 잘 안 걷힘'],
        ['깨끗할 때 각', `약 ${TH.b.c}° (가정)`, `약 ${TH.k.c}° (가정)`],
        ['모서리 한계', '105° — 상부 Cu 옆면이 젖음', '옆면 산화면 넘치지 않음 · 깨끗하면 105°'],
        ['넘치면', '상부 Cu 옆면 3\u00a0µm → Ni 앞에서 멈춤', '깨끗한 Ni 옆면 5\u00a0µm까지'],
        ['계면 IMC', 'Cu₆Sn₅ (+ 얇은 Cu₃Sn)', 'Ni₃Sn₄ (각진 조각)'],
        ['열 이력 뒤', '상부 Cu가 다 쓰여 Ni 위 (Cu,Ni)₆Sn₅', 'Ni₃Sn₄가 자라며 Ni가 줄어듦']];
      let y = 262, body = '';
      rows.forEach(([n, b, k]) => {
        const lb = wrap(b, 8.2), lk = wrap(k, 7.9), nl = Math.max(lb.length, lk.length, 1);
        body += L(1030, y - 26, 1548, y - 26, 's-faint') + T(1030, y, n, 't-dim', 'start') + TT(CB, y, lb, 't-sub', 'start', 26) + TT(CK, y, lk, 't-sub', 'start', 26);
        y += nl * 26 + 16;
      });
      const yh = y - 26 + 6, ls = wrap('두 다이 같음 — 지름 25 · SnAg 12\u00a0µm(예시) → 5,890\u00a0µm³ · 꼭대기 15.7\u00a0µm · 103°', 15.5);
      body += L(1030, y - 26, 1548, y - 26, 's-faint') + T(1030, y, '부피 · 돔', 't-dim', 'start') + TT(CB, y, ls, 't-warn', 'start', 27);
      y += ls.length * 27 + 8;
      const hx = st.die === 'b' ? CB - 10 : CK - 10, hw = st.die === 'b' ? 194 : 190;
      o += R(hx, 196, hw, yh - 196, 'pl-hlbox', {rx: 8}) + R(hx, 196, hw, 38, 'rf04-hd', {rx: 8});
      o += T(CB, 222, '베이스 다이', 'pl-hdg', 'start') + T(CK, 222, '코어 다이', 'pl-hdg', 'start') + body;
      y += 30;
      const ln = wrap('도금 사이 산화: 맨 위 금속 윗면은 SnAg 밑에 묻혀 리플로우의 플럭스 · 포름산이 닿지 않습니다(솔더 겉 · 모서리 · 옆면에만 작용). 그래서 코어 다이는 Ni 도금 → SnAg 도금 사이 Ni 산화를 도금에서 막아야 합니다(헹굼 뒤 지체 없이). 베이스 다이는 이 문제가 Ni/상부 Cu 계면의 밀착 쪽으로 옮겨 갑니다.', 24.5);
      o += TT(1030, y, ln, 't-sub', 'start', 29);
      return o;
    }
    function render(){
      clampP();
      const c = calc(st), Ly = lay(st, c);
      put('[data-v="bumps"]', bumps(c, Ly));
      put('[data-v="frames"]', frames(c));
      put('[data-v="ang"]', contact());
      put('[data-v="corner"]', corner(c));
      put('[data-v="side"]', side());
      put('[data-v="pvol"]', pvol(c));
      put('[data-v="pang"]', pang(c));
      put('[data-v="pedge"]', pedge(c));
      put('[data-v="pdies"]', pdies());
      segText();
      ctx.refresh();
      // KPI
      ctx.out('k-v', fmt(c.V));
      ctx.out('k-h', `${f1(c.h)} µm`);
      const sub = (id, t) => { const e = ctx.card.querySelector(`[data-o="${id}"]`); if (e && e.parentNode.querySelector('.s')) e.parentNode.querySelector('.s').textContent = t; };
      sub('k-v', `= ${(c.V / 1000).toFixed(1)} pL`);
      sub('k-h', `도금 ${f1(st.hc)} µm 대비 ${c.dH >= 0 ? '+' : '−'}${f1(Math.abs(c.dH))}`);
      sub('k-th', c.mode === 'dome' ? '가장자리에 걸린 돔의 각' : c.mode === 'wick' ? '옆면 한계 각에 묶임' : '= 접촉각 (바닥이 물러남)');
      ctx.out('k-th', `${Math.round(c.th)}°`);
      ctx.out('k-gap', c.gap > 0 ? `${f1(c.gap)} µm` : '0 — 붙음');
      const SJ = {dome: c.dH < 0 ? '돔 — 옆으로 부풂' : '매끈한 돔', dewet: '덜 덮임', ball: '공처럼 뭉침', wick: stopName(st, c)}[c.mode];
      ctx.out('k-j', c.gapCls === 'ng' ? '브리지 위험' : SJ + (c.gapCls === 'warn' ? ' · 틈 적음' : ''));
      const kj = ctx.card.querySelector('[data-o="k-j"]').parentNode, kg = ctx.card.querySelector('[data-o="k-gap"]').parentNode;
      ['ok', 'warn', 'ng'].forEach(x => { kj.classList.toggle(x, c.cls === x); kg.classList.toggle(x, c.gapCls === x); });
      // 메시지
      const dTxt = c.dH >= 0 ? `${f1(c.dH)} µm 높음` : `${f1(-c.dH)} µm 낮음 — 공처럼 옆으로 부풂`;
      let m = '';
      if (c.mode === 'dome') m = `${fmt(c.V)} µm³가 지름 ${st.d} µm 바닥에 모이면 꼭대기 ${f1(c.h)} µm (도금 ${f1(st.hc)} µm보다 ${dTxt}). 매끈한 돔 — 가장자리에 고정되어 있고, 부피 ±5 %면 꼭대기 ±${c.dh.toFixed(2)} µm입니다.`;
      else if (c.mode === 'wick'){
        const base = st.die === 'b', lead2 = c.stop ? (base && st.sw === 'ox' ? ` 상부 Cu 옆면(3 µm)을 다 적시고 산화된 Ni 앞에 모여 테가 ${f1(c.t)} µm로 두꺼워지고${c.over ? '(상부 Cu 띠 3 µm보다 두꺼워 산화된 Ni도 넘을 수 있습니다 — 이 모델 밖)' : ''}` : base ? ' 기둥 밑(18 µm)까지 닿고' : ' Ni 밑동(5 µm)까지 닿고') : ` 막 길이 ${f1(c.L)} µm (${onLayer(st.die, c.L)})`;
        m = `다 덮고 멈추면 겉보기 각이 ${Math.round(c.th0)}°가 되어 ${base ? '상부 Cu 옆면' : '깨끗한 Ni 옆면'}의 한계 105°를 넘습니다. 넘친 ${fmt(c.Vex)} µm³가 옆면으로 흘러내려${lead2}, 꼭대기는 ${f1(c.h0)} → ${f1(c.h)} µm로 낮아집니다. → ` +
          (base ? '베이스 다이는 상부 Cu 옆면이 늘 젖어 솔더 부피(도금 높이)를 먼저 봅니다. Ni 아래까지 내려갔다면 Ni · Cu 기둥 옆면을 깨끗하게 만든 환원 · 긴 액상선 위 시간(TAL) · 시드 식각에서 새로 드러난 옆면(<a href="#go-etch-04">시드 식각 04장</a> · <a href="#go-etch-09">09장</a>)을 봅니다.'
            : '코어 다이는 Ni 옆면 산화막까지 걷은 강한 환원 · 긴 액상선 위 시간(TAL) · 많은 솔더를 봅니다.');
      }
      else m = `접촉각 ${c.thY}°가 다 덮을 때의 겉보기 각 ${Math.round(c.th0)}°보다 커서 바닥을 다 덮지 못합니다 → 바닥 지름 ${f1(2 * c.r)} µm, 꼭대기 ${f1(c.h)} µm (${c.mode === 'ball' ? '공처럼 뭉침 — 비젖음' : '덜 덮임 — 디웨팅'}). → 보통 ${TOP[st.die]}/SnAg 계면 산화(도금 층 사이 대기) · 오염이 원인입니다${st.die === 'k' ? ' — Ni는 공기 · 물에서 금방 얇은 산화막(부동태)이 생겨 더 민감합니다' : ''} (<a href="#go-plating-12">전해도금 12장</a>).`;
      if (c.mode === 'ball') m += ` 솔더 겉 산화막은 공이 아니라 덜 둥긂(원기둥 그대로)으로 나타납니다 → <a data-go="oxide.film">03장</a>.`;
      if (c.gapCls === 'ng') m += ` <b>이웃과 틈 ${c.gap > 0 ? f1(c.gap) + ' µm' : '없음'} — 붙을 위험(브리지).</b>`;
      else if (c.gapCls === 'warn') m += ` 이웃과 틈 ${f1(c.gap)} µm — 여유 적음.`;
      if (pfix) m += ` <i>피치는 지름보다 커야 합니다 (틈 5 µm 이상으로 맞춤).</i>`;
      ctx.q('[data-o=msg]').innerHTML = m;
    }
    // 손으로 움직이면 그 값을 그대로 둔다. 바뀐 것이 보이는 단계로 넘긴다
    function jump(id){
      const sid = ctx.step();
      if (!sid) return;
      if ((id === 'd' || id === 'hc') && sid === 'tension') ctx.go('volume');
      else if (id === 'sf' && (sid === 'tension' || sid === 'volume')) ctx.go('angle');
      else if ((id === 'sw' || id === 'p') && sid !== 'edge') ctx.go('edge');
    }
    IDS.forEach(id => ctx.range(id, v => { st[id] = v; render(); return FMT[id](st[id]); }));
    ctx.seg('die', (v, user) => { st.die = v; render(); if (user) touched = true; });
    ctx.seg('sf', (v, user) => { st.sf = v; render(); if (user){ touched = true; jump('sf'); } });
    ctx.seg('sw', (v, user) => { st.sw = v; render(); if (user){ touched = true; jump('sw'); } });
    IDS.forEach(id => { const i = inp(id); if (i) i.addEventListener('input', () => { touched = true; jump(id); }); });
    ctx.demo = sid => {
      if (touched) return ctx.refresh();
      Object.assign(st, DEF, DEMO[sid] || {});
      IDS.forEach(id => { const i = inp(id); if (i) i.value = st[id]; ctx.out(id, FMT[id](st[id])); });
      setSeg('sf', st.sf); setSeg('sw', st.sw); setSeg('die', st.die);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['표면장력 (γ)', '액체가 겉넓이를 줄이려는 성질 — 겉면을 따라 당기는 힘으로 나타난다. 단위 N/m. 물 0.072, 녹은 SnAg 약 0.4~0.55'],
      ['상부 Cu', '베이스 다이 범프에서 Ni 위에 얇게 한 번 더 올린 Cu (예시 3 µm). 솔더가 처음 만나는 면 — 잘 젖고 계면 IMC를 Cu₆Sn₅ 쪽으로 이끈다. 코어 다이(Ni / SnAg)는 Ni 윗면이 바닥'],
      ['접촉각 (θ)', '방울 가장자리에서 고체 면과 액체 겉면이 이루는 각. 작을수록 잘 젖는다. 세 경계면 에너지(고체–기체 · 고체–액체 · 액체–기체)의 균형(영의 식)이 정한다'],
      ['젖음 · 비젖음 · 디웨팅', '퍼져 붙음 / 처음부터 안 붙음 / 붙었다가 물러나 바닥 금속(상부 Cu · Ni)이 드러남'],
      ['가장자리 고정 (핀닝)', '접촉선이 모서리에 걸려, 각이 커져도 움직이지 않는 것'],
      ['본드 수', '무게와 표면장력의 비. 아주 작으면(지름 25 µm 솔더 약 2×10⁻⁵) 무게를 무시한다'],
      ['흘러내림 (위킹)', '녹은 솔더가 범프 옆면을 타고 내려가는 것. 베이스 다이는 상부 Cu 옆면 → (깨끗하면) Ni · Cu 기둥 옆면, 코어 다이는 Ni 옆면'],
      ['동일평면성 (코플래너리티)', '다이 안 범프 꼭대기가 한 평면에 고르게 있는 정도. 본딩에서 모든 범프가 함께 닿으려면 중요하다']
    ]) + K.field([
      '<span class="pl-tag up">앞 공정</span> 리플로우 뒤 <b>높이 산포를 줄이는 손잡이는 대부분 앞 공정</b>(도금 부피 산포: 두께 × 바닥 넓이)입니다. 리플로우 조건으로는 덜 녹음 · 흘러내림의 차이만 줄일 수 있습니다 → <a href="#go-plating-07">전해도금 07장</a>. 돔 높이는 측정 정의(꼭대기 · 평균 · 기준면)와 장비가 다르면 숫자가 달라지므로, 리플로우 전후를 같은 정의로 잽니다.',
      '<span class="pl-tag ep">리플로우-분위기</span><span class="pl-tag rf04-cond">리플로우-조건</span><span class="pl-tag up">앞 공정</span> 옆면 흘러내림이 보이면 솔더 부피 · 환원 세기(플럭스 양 · 포름산) · 액상선 위 시간 · 시드 식각에서 새로 드러난 옆면을 함께 봅니다. 베이스 다이는 상부 Cu 옆면이 잘 젖어 솔더가 조금만 많아도(이 예시 약 6 %) Ni 앞까지 내려오므로, 단면에서 솔더가 Ni · Cu 기둥 옆면까지 갔는지를 봅니다. 코어 다이는 Ni 옆면이 산화돼 있으면 거의 넘치지 않습니다 → <a href="#go-etch-04">시드 식각 04장</a> · <a href="#go-etch-09">시드 식각 09장</a>.',
      '<span class="pl-tag up">앞 공정</span> 디웨팅(바닥 금속이 드러남)은 대개 <b>맨 위 금속/SnAg 계면</b> 문제입니다(도금 층 사이 대기 · 헹굼). 이 계면은 SnAg 밑에 묻혀 리플로우의 플럭스가 닿지 않습니다. 코어 다이(Ni/SnAg 계면)는 Ni가 공기 · 물에서 금방 얇은 산화막(부동태)을 만들어 더 민감한 편이고, 베이스 다이는 상부 Cu/SnAg 계면입니다. 리플로우 조건보다 도금 층 사이 시간을 먼저 봅니다 → <a href="#go-plating-12">전해도금 12장</a>.',
      '<span class="pl-tag dn">뒤 공정</span> 옆면 산화막은 흘러내림을 막아 주지만, 산화 · 변색된 옆면(베이스 다이 Ni · Cu 기둥 · 코어 다이 Ni)은 뒤 공정에서 칩 사이에 넣는 접착 필름(NCF, 비전도성 필름) · 칩 사이를 채우는 수지(언더필)와 잘 붙지 않습니다. 환원 세기(플럭스 · 포름산)는 이 둘 사이의 맞바꿈입니다 → <a data-go="defects.tiles">09장</a>.',
      '<span class="pl-tag up">앞 공정</span> 솔더 겉 · 범프 옆면의 아주 얇은 유기막(PR 스트립 잔여)도 젖음을 나쁘게 하고 보이드 기체가 됩니다. 눈에 안 보여도 의심합니다 → <a href="#go-strip-08">PR 스트립 08장</a>.'
    ]) + K.deep(`<p>이 장 위젯의 식 (구형 모자, a = 바닥 반지름, h = 꼭대기 높이):</p>
      ${K.eq('V = πa²·H_c = πh(3a² + h²)/6')}${K.eq('겉보기 각 = 2·arctan(h/a)')}${K.eq('구 반지름 R = (a² + h²)/(2h)')}${K.eq('γ_SV = γ_SL + γ_LV·cosθ  (영의 식)')}
      <ul><li><b>영의 식과 반응성 젖음</b> — 솔더–금속 젖음은 계면에서 IMC가 생기며 진행되어, 실제로 보는 각은 반응 뒤 IMC 위의 각에 가깝습니다. 보고 예: SAC 계열 250 °C · Ar에서 Ni 위 약 37°, Cu 위 약 29°, Sn-3.5Ag/Cu 약 43°(측정법 · 플럭스에 따라). 측정마다 범위는 겹치지만 같은 조건에서 견준 보고(앞의 SAC 예)에서는 Cu 위가 조금 작아, 이 장은 깨끗한 상부 Cu(베이스 다이) 30° · Ni(코어 다이) 40°로 가정합니다. 또 Ni는 공기 · 물에서 얇고 단단한 산화막(부동태)을 금방 만들고, 이 막은 Cu 산화물보다 환원 · 용해가 어려운 편이라 같은 플럭스 · 포름산에서 Ni 면이 덜 젖습니다. 계면 IMC도 다릅니다 — 베이스 Cu₆Sn₅(+ 얇은 Cu₃Sn), 코어 Ni₃Sn₄(→ <a data-go="imc">05장</a>).</li>
      <li><b>본드 수와 모양</b> — Bo = ρgR²/γ ≈ 7,000 × 9.8 × (12.5×10⁻⁶)² / 0.5 ≈ 2×10⁻⁵. 그래서 녹은 솔더는 구의 일부(구형 모자)입니다. 예: a 12.5 µm · 도금 12 µm → V 5,890 µm³ · h 15.7 µm · 겉보기 각 103° · R 12.8 µm. 속 압력은 라플라스 압력 ΔP = 2γ/R ≈ 2 × 0.5 / 12.8×10⁻⁶ ≈ 0.8 bar(약 0.8기압 더). h/H_c = 6a²/(3a² + h²)라, 도금 높이가 지름의 약 0.87배(h > √3·a, 겉보기 각 120° 넘음)를 넘으면 꼭대기가 오히려 도금보다 낮아집니다.</li>
      <li><b>높이 산포</b> — dh/dV = 2/[π(a² + h²)], 곧 꼭대기 변화 ÷ 도금 높이 변화 = 2a²/(a² + h²). h ≈ a(반구)에서는 꼭대기가 도금 높이와 같은 µm만큼 흔들리고, h > a(지금 예시 h/a ≈ 1.26)에서는 조금 줄어듭니다(±5 % → ±0.47 µm, 도금 높이였다면 ±0.6 µm). 아주 얇은 솔더(h ≪ a)에서는 오히려 약 2배로 커집니다. 비율(%)로는 부피 ±5 %가 꼭대기 약 ±2~5 %가 됩니다 (높은 돔일수록 작음, 이 예시 ±3 %).</li>
      <li><b>깁스의 조건</b> — 직각 모서리에서 접촉선은 θ_윗면 ≤ θ ≤ θ_옆면 + 90° 사이에서 고정됩니다(일반식 θ_c = θ_Y + α, α = 모서리 너머 면이 꺾인 각, θ_Y = 넘어갈 면의 접촉각). 옆면이 깨끗해 옆면 각이 작으면(예 15°) 겉보기 각 약 105°에서 넘치고, 옆면이 산화돼 각이 90°를 넘으면 한계가 180°를 넘어 넘치지 않습니다. 젖는 면과 안 젖는 면의 경계(베이스 다이의 상부 Cu 옆면 → 산화된 Ni 옆면)에서도 같은 원리로 멈춥니다(화학적 경계). Ni 앞에 모인 테를 원호로 어림하면, 테 두께가 상부 Cu 띠 높이(3 µm)만큼 될 때 테 아래 가장자리 각이 약 127°로 산화된 Ni 위 각(보통 90°를 훌쩍 넘음)에 가까워집니다 — 위젯이 그보다 두꺼운 테를 「나쁨」으로 표시하는 까닭입니다. 이 예시(지름 25 · SnAg 12 µm)의 겉보기 각 103°는 상부 Cu 옆면 한계 105°에 가까워, 부피가 약 6 % 많으면 상부 Cu 옆면으로 넘칩니다. 실제로는 반응(IMC)이 앞서 나가며 조금씩 타고 내려가는 '반응성 흘러내림'도 있어 시간이 길수록 늘어납니다.</li>
      <li><b>표면장력 수치</b> — 순수 Sn은 녹는점 근처 약 0.5~0.55 N/m(산소가 아주 적을 때), 온도 계수 약 −0.1 mN/(m·K). 산소가 흡착하면 크게 낮아지고, 산소 분압이 높으면 녹는점 근처에서 온도에 따라 오히려 오르는 보고도 있습니다. SnAg는 보고값이 측정법 · 분위기에 따라 흩어져 '약 0.4~0.55 N/m'로 씁니다.</li>
      <li><b>모양이 바뀌는 시간</b> — 모세관 시간 √(ρa³/γ) ≈ 5 µs, 오네조르게 수 μ/√(ργa) ≈ 0.01이라 약 10 µs 주기로 출렁이고, 출렁임은 약 0.1 ms(ρa²/5μ)마다 1/e로 줄어 1 ms 안에 가라앉습니다(→ <a data-go="why.melt">01장</a>). 녹는 순간 모양은 거의 바로 정해집니다.</li>
      <li><b>작은 범프와 옆면</b> — Cu 기둥이 있는 범프(베이스 다이 쪽)의 보고입니다. Sn-3.5Ag/Ni/Cu 범프에서 지름이 작을수록 기둥 가장자리의 옆면 젖음 반응(보이드 · (Cu,Ni)₆Sn₅)이 두드러진다는 보고, 열압착(TC) 본딩에서 녹은 솔더가 눌려 Cu 기둥 옆면으로 올라가 Sn 소모 · 커켄달 보이드를 키운다는 보고가 있습니다(→ <a data-go="imc.cu">05장</a>).</li></ul>`);
  },
  css: `.pl-svg .rf04-bond{stroke:#475569;stroke-width:2}
.pl-svg .rf04-bh{stroke:#38bdf8;stroke-width:4}
.pl-svg .rf04-bh2{stroke:#f59e0b;stroke-width:4}
.pl-svg .rf04-brk{stroke:#f59e0b;stroke-width:3;stroke-dasharray:6 5;fill:none}
.pl-svg .rf04-at{fill:#cbd5e1;stroke:#64748b;stroke-width:1.5}
.pl-svg .rf04-num{font-size:19px;font-weight:900;fill:#0b1222 !important;stroke:none !important;text-anchor:middle}
.pl-svg .rf04-dk{font-size:20px;font-weight:800;fill:#0b1222 !important;stroke:rgba(255,255,255,.35) !important;stroke-width:2px !important}
.pl-svg .rf04-skin{fill:none;stroke:#f59e0b;stroke-width:6;stroke-linecap:round}
.pl-svg .rf04-water{fill:rgba(56,189,248,.55);stroke:#7dd3fc;stroke-width:1.2}
.pl-svg .rf04-band{fill:rgba(203,213,225,.35);stroke:#cbd5e1;stroke-width:1.2;stroke-dasharray:5 4}
.pl-svg .rf04-band2{fill:rgba(251,191,36,.2);stroke:rgba(251,191,36,.45);stroke-width:1;stroke-dasharray:4 4}
.pl-svg .rf04-wt{fill:#a78bfa}
.pl-svg .rf04-plate{fill:#64748b}
.pl-svg .rf04-bare{fill:#e2e8f0;stroke:#f8fafc;stroke-width:.8}
.pl-svg .rf04-dim{stroke:#fbbf24;stroke-width:2;fill:none}
.pl-svg .rf04-wig{fill:none;stroke:#7dd3fc;stroke-width:2.4}
.pl-svg .rf04-arc{fill:none;stroke:#fbbf24;stroke-width:3}
.pl-svg .rf04-fan{fill:rgba(56,189,248,.16);stroke:rgba(56,189,248,.6);stroke-width:1.2}
.pl-svg .rf04-tan{stroke:#fbbf24;stroke-width:3.5}
.pl-svg .rf04-zng{fill:rgba(248,113,113,.4)}
.pl-svg .rf04-zw{fill:rgba(251,191,36,.38)}
.pl-svg .rf04-zok{fill:rgba(74,222,128,.28)}
.pl-svg .rf04-halo{paint-order:stroke;stroke:#0b1222;stroke-width:6px;stroke-linejoin:round}
.pl-svg .rf04-stop{stroke:#f87171;stroke-width:3.5}
.pl-svg .rf04-alt{fill:none;stroke:#94a3b8;stroke-width:2.5;stroke-dasharray:7 6}
.pl-svg .rf04-hd{fill:rgba(56,189,248,.16)}
.pl-svg .rf04-niox{fill:#4b5563;stroke:#1f2937;stroke-width:.6}
.jc .pl-tag.rf04-cond{background:rgba(45,212,191,.18);color:#5eead4}`
});
})();
