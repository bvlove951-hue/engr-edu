/* 리플로우 04 — 둥글어지기: 녹은 솔더는 왜 둥글어지고, 어디서 멈출까? (범프 · µm) */
(function(){
const RAD = Math.PI / 180, q = v => Math.round(v * 10) / 10;
const TH = {c: 30, o: 70, x: 140};                    // Ni/SnAg 계면 젖음 각 (가정값)
const SFN = {c: '깨끗한 Ni', o: '얇은 산화', x: '계면 산화 · 오염'};
const SFW = {c: '잘 젖음', o: '덜 젖음', x: '안 젖음 (공처럼)'};
const TSIDE = 15, TF = 1.5, HP = 18, GAM = 0.5;       // 깨끗한 옆면 각(가정), 옆면 막 두께(가정), Ni + Cu 높이(µm), 표면장력 N/m(예시)
const BXC = 510, YB = 1000;                            // 두 범프 가운데 x, Cu 기둥 바닥 y
const DEF = {d: 25, hc: 12, sf: 'c', sw: 'ox', p: 55};
// 손대지 않았을 때 단계마다 보여 줄 값 (발표 모드 대비) — 기본값 + 적힌 값만
const DEMO = {tension: {}, volume: {}, angle: {sf: 'x'}, edge: {sw: 'cl', hc: 16}};
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
  const a = s.d / 2, V = Math.PI * a * a * s.hc, h0 = capH(a, V), th0 = 2 * Math.atan(h0 / a) / RAD, thY = TH[s.sf];
  const c = {a, V, h0, th0, thY, r: a, h: h0, th: th0, mode: 'dome', L: 0, Lfull: 0, t: TF, Vex: 0, hm: 0};
  if (thY > th0){ c.r = capR(V, thY * RAD); c.h = c.r * Math.tan(thY * RAD / 2); c.th = thY; c.mode = s.sf === 'x' ? 'ball' : 'dewet'; }
  else if (s.sw === 'cl' && th0 > TSIDE + 90){
    c.hm = a * Math.tan((TSIDE + 90) * RAD / 2); c.Vex = V - capV(a, c.hm);
    c.Lfull = c.L = c.Vex / (Math.PI * (s.d + TF) * TF);
    if (c.L > HP){ c.L = HP; c.t = (-s.d + Math.sqrt(s.d * s.d + 4 * c.Vex / (HP * Math.PI))) / 2; }   // 기둥 밑까지 닿으면 막이 두꺼워진다
    c.h = c.hm; c.th = TSIDE + 90; c.mode = 'wick';
  }
  c.Rs = c.h > c.r ? (c.r * c.r + c.h * c.h) / (2 * c.h) : c.r;                 // 솔더 가장 넓은 반지름
  c.Rw = c.mode === 'wick' ? Math.max(c.Rs, a + c.t) : c.Rs;
  c.gap = s.p - 2 * c.Rw; c.dH = c.h - s.hc;
  // 부피 ±5 % → 꼭대기 변화 (양쪽 평균). 가장자리 고정이면 돔 식, 덜 덮이면 모양이 닮은 채 커져 h ∝ V^⅓, 흘러내리면 꼭대기는 한계에 묶임
  c.dh = c.mode === 'dome' ? (capH(a, V * 1.05) - capH(a, V * 0.95)) / 2 : c.mode === 'wick' ? 0 : c.h * (Math.cbrt(1.05) - Math.cbrt(0.95)) / 2;
  c.dL = c.mode === 'wick' && c.L < HP ? 0.05 * V / (Math.PI * (s.d + TF) * TF) : 0;
  c.dP = 2 * GAM / (c.Rs * 1e-6) / 1e5;                                          // 속 압력 (bar)
  const shape = c.mode === 'ball' ? 'ng' : c.mode === 'dewet' ? 'warn' : c.mode === 'wick' ? (c.Lfull > HP ? 'ng' : 'warn') : 'ok';
  const gp = c.gap < 5 ? 'ng' : c.gap < 10 ? 'warn' : 'ok', RK = {ok: 0, warn: 1, ng: 2};
  c.shapeCls = shape; c.gapCls = gp; c.cls = RK[shape] >= RK[gp] ? shape : gp;
  return c;
}
// 두 범프 배치: 배율 s(px/µm) · 가운데 x · 솔더 바닥선 y0 · Ni/Cu 경계 yn
function lay(s, c){
  const k = Math.min(8, 780 / (s.p + s.d), 360 / (HP + c.h)), half = s.p * k / 2;
  return {s: k, X: [BXC - half, BXC + half], y0: YB - HP * k, yn: YB - 15 * k};
}
// 글 폭 어림 (px) — 한글 1em, 영문 · 숫자 약 0.55em
const tw = (t, fs) => [...String(t)].reduce((a, ch) => a + (/[ㄱ-힝]/.test(ch) ? 1 : /[A-Za-z0-9 .,:;'()\-]/.test(ch) ? 0.55 : 0.85), 0) * fs;

(window.EngrReflowChapters = window.EngrReflowChapters || []).push({
  no: '04', id: 'wet', part: 2, short: '둥글어지기', scale: '범프 · µm',
  title: '둥글어지기 — 녹은 솔더는 왜 둥글어지고, 어디서 멈출까?',
  hook: '모양은 부피와 가장자리가 정한다',
  one: '녹은 솔더는 겉넓이를 줄이려는 힘(표면장력) 때문에 둥근 모자 모양이 됩니다. 범프 크기에서는 무게가 거의 힘을 쓰지 못해, 모양은 솔더 부피와 젖은 바닥(Ni 윗면) 넓이가 정합니다. 깨끗하면 Ni 가장자리에서 멈추고, 옆면까지 깨끗하면 흘러내릴 수 있습니다.',
  ana: '<b>동전 위 물방울</b> — 동전에 물을 조금씩 떨어뜨리면 물은 동전 가장자리에서 멈추고 점점 볼록해집니다. 너무 많으면 가장자리를 넘어 흘러내립니다. <i>(비유의 한계: 동전 위 물은 무게가 표면장력보다 10배 넘게 커서 납작한 웅덩이(높이 몇 mm)가 되지만, 25 µm 솔더는 무게가 표면장력의 약 5만분의 1이라 거의 완전한 구의 일부가 됩니다. 또 솔더는 Ni와 반응하며 젖으므로, 표면이 깨끗한지(산화막 · 오염)가 물보다 훨씬 크게 작용합니다.)</i>',
  steps: [
    {id: 'tension', viewN: VN_UP, t: '표면장력 — 겉넓이를 줄이는 힘', d: '겉의 원자는 이웃이 적어 에너지가 높아, 겉넓이를 넓히려면 일이 듭니다. 그래서 액체는 같은 부피에서 겉넓이가 가장 작은 모양(구)으로 가려 합니다. 이 힘은 겉면을 따라 당기는 힘이고, 겉이 굽으면 안쪽 압력이 높아집니다. 녹은 SnAg의 표면장력은 물의 약 6~8배입니다.'},
    {id: 'volume', viewN: VN_BUMP, t: '부피는 그대로 — 돔의 높이', d: '바닥(Ni 윗면) 지름과 솔더 부피가 정해지면 돔 모양은 하나로 정해집니다. 이 예시 크기에서는 같은 부피가 가운데로 모여 꼭대기가 도금 높이보다 높아집니다. 그래서 부피 산포가 거의 그대로 높이 산포로 넘어갑니다(부피 ±5 % → 꼭대기 약 ±3 %).'},
    {id: 'angle', viewN: VN_UP, t: '접촉각 — 잘 젖는가', d: '고체 · 액체 · 기체가 만나는 선에서 세 겉면의 힘이 겨루어 접촉각이 정해집니다(영의 식). 깨끗한 Ni 위에서는 작고(잘 젖음), 산화 · 오염된 곳에서는 큽니다(안 젖음). Ni/SnAg 계면이 안 젖으면 솔더가 물러나 공처럼 뭉칩니다.'},
    {id: 'edge', viewN: VN_UP, t: '가장자리 — 멈추거나 흘러내리거나', d: '돔은 Ni 윗면 모서리에 걸려 멈춥니다(고정). 옆면이 산화돼 있으면 잘 버티지만, 플럭스 · 환원 기체로 옆면까지 깨끗해지면 솔더가 Ni · Cu 옆면을 타고 내려갑니다. 그러면 돔이 낮아지고, 간격이 좁으면 이웃과 붙을 수 있습니다.'}
  ],
  icon(K){
    const {R, P} = K;
    return R(6, 48, 22, 14, 'f-cu2') + R(6, 44, 22, 4, 'f-ni') + P('M6,44 A11,11 0 1 1 28,44 Z', 'f-sn2') +
      R(38, 48, 22, 14, 'f-cu2') + R(38, 44, 22, 4, 'f-ni') + P('M38,44 A13,9 0 0 1 60,44 Z', 'f-sn2') + R(36, 44, 2, 11, 'f-sn2') + R(60, 44, 2, 11, 'f-sn2');
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
    tn += T(60, 206, '평평한 겉: 양쪽 당김이 비겨 알짜 힘은 0 — "겉 원자를 안으로 끈다"는 흔한 오해', 't-dim', 'start');
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
    tn += LB(T(60, 570, '① 안쪽 원자 — 사방에 이웃 (결합 6개)', 't-sub', 'start') + T(60, 597, '② 겉 원자 — 이웃이 적어 에너지↑ (끊긴 결합)', 't-sub', 'start'));
    // 굽은 겉면 (오른쪽)
    const OX = 800, OY = 640, RR = 180, pt = d => [OX + RR * Math.cos(d * RAD), OY + RR * Math.sin(d * RAD)];
    const cy0 = 548, cdx = Math.sqrt(RR * RR - (OY - cy0) * (OY - cy0));
    tn += P(`M${q(OX - cdx)},${cy0} A${RR},${RR} 0 0 1 ${q(OX + cdx)},${cy0} Z`, 'f-sn2', tip('굽은 겉면 (녹은 솔더 돔의 겉)'));
    const [p1x, p1y] = pt(240), [p2x, p2y] = pt(300);
    tn += P(`M${q(p1x)},${q(p1y)} A${RR},${RR} 0 0 1 ${q(p2x)},${q(p2y)}`, 'rf04-skin');
    tn += arrow(p1x, p1y, p1x - 92 * Math.sin(60 * RAD), p1y + 92 * Math.cos(60 * RAD), 's-arr2') + arrow(p2x, p2y, p2x + 92 * Math.sin(60 * RAD), p2y + 92 * Math.cos(60 * RAD), 's-arr2');
    tn += arrow(OX, OY - RR + 14, OX, OY - RR + 82, 's-arr');
    tn += LB(T(OX, 404, '굽은 겉면', 't-sub') + T(OX + 14, 528, '합 → 안쪽', 'rf04-dk', 'start'));
    tn += LB(T(640, 570, '두 당김의 합이 안쪽으로', 't-sub', 'start') + T(640, 597, '→ 속 압력↑ (라플라스 압력)', 't-sub', 'start'));
    s += G(tn, only('tension'));

    // volume: 녹는 순간 (네 칸) — 위젯이 모양을 그린다
    let vo = T(60, 172, '같은 부피 · 같은 바닥 → 모양은 하나뿐', 't-acc', 'start');
    vo += T(60, 206, '녹는 순간 겉넓이를 줄이며 가운데로 모인다 — 출렁임은 약 0.1 ms 안에 가라앉는다', 't-dim', 'start');
    for (let k = 0; k < 4; k++) vo += R(60 + k * 228, 252, 212, 288, 'pl-lane', {rx: 10});
    vo += `<g data-v="frames"></g>`;
    s += G(vo, only('volume'));

    // angle: 접촉선 큰 그림 (위젯이 방울 · 힘을 그린다)
    let an = T(60, 172, '접촉각 — 세 겉면이 접촉선에서 겨룬다', 't-acc', 'start');
    an += T(60, 206, '세 힘이 맞서 멈춘 각 = 접촉각 (영의 식)', 't-dim', 'start');
    an += R(80, 580, 880, 22, 'f-ni', tip('Ni 윗면 (고체) — 솔더가 젖는 바닥'));
    an += L(80, 580, 960, 580, 's-edge') + LB(T(96, 597, 'Ni (고체)', 'rf04-dk', 'start'));
    an += `<g data-v="ang"></g>`;
    s += G(an, only('angle'));

    // edge: 모서리 확대 (위젯이 솔더 · 부채꼴을 그린다)
    let ed = T(60, 172, '가장자리 — 모서리에 걸려 멈춘다', 't-acc', 'start');
    ed += T(60, 206, '모서리에서는 각이 θ부터 θ + 90°까지 커져도 멈춰 있다 (깁스의 조건)', 't-dim', 'start');
    ed += R(60, 226, 560, 394, 'pl-box', {rx: 12}) + TT(606, 254, ['모서리 확대', '(비율 아님)'], 't-dim', 'end', 24);
    ed += R(80, 400, 350, 70, 'f-ni', tip('Ni (3 µm) — 윗면이 솔더가 젖는 바닥')) + R(80, 470, 350, 140, 'f-cu2', tip('Cu 기둥 (15 µm)'));
    ed += L(80, 400, 430, 400, 's-edge') + L(430, 400, 430, 610, 's-edge');
    ed += LB(T(96, 442, 'Ni 윗면', 'rf04-dk', 'start') + T(96, 548, 'Cu 기둥', 'rf04-dk', 'start'));
    ed += `<g data-v="corner"></g>`;
    ed += T(640, 252, '옆면 상태', 't-sub', 'start') + `<g data-v="side"></g>`;
    s += G(ed, only('edge'));

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
    pt1 += R(1347, 744, 120, 16, 'f-ni') + P(cap(1407, 744, 60, 76), 'f-sn2', tip('25 µm 솔더 — 거의 완전한 구의 일부'));
    pt1 += T(1152, 786, '본드 수 약 14 (동전 위 물)', 't-dim') + T(1407, 786, '본드 수 약 2×10⁻⁵', 't-dim');
    pt1 += TT(1030, 846, wrap('모양이 바뀌는 데는 µs~0.1 ms면 충분합니다 (몇 번 출렁이다 멈춤). 리플로우에서 시간이 드는 것은 열 전달 · 산화막 제거 · 기포 빠지기 · IMC 반응입니다.', 24.5), 't-sub', 'start', 30);
    pt1 += TT(1030, 990, wrap('속 압력: 반지름 약 13 µm 돔은 바깥보다 약 0.8기압 높다 (아래 범프 위 숫자)', 25.5), 't-dim', 'start', 26);
    s += G(pt1, only('tension'));
    // volume · angle · edge 패널은 위젯이 그린다
    s += G(`<g data-v="pvol"></g>`, only('volume')) + G(`<g data-v="pang"></g>`, only('angle')) + G(`<g data-v="pedge"></g>`, only('edge'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 돔 계산기</div>
      ${K.ctl('d', '범프 지름', 15, 40, 1, 25)}${K.ctl('hc', '도금한 SnAg 높이', 4, 25, 0.5, 12)}
      ${K.seg('sf', [['c', '깨끗함 (30°)'], ['o', '얇은 산화 (70°)'], ['x', '계면 산화 · 오염 (140°)']], 'c', 'Ni/SnAg 계면 상태')}
      ${K.seg('sw', [['ox', '산화된 옆면'], ['cl', '깨끗한 옆면']], 'ox', 'Ni · Cu 옆면')}
      ${K.ctl('p', '피치', 30, 80, 1, 55)}
      ${K.kpis([['솔더 부피 (µm³)', 'k-v', 'pL'], ['돔 꼭대기', 'k-h', 'µm (도금 높이 대비)'], ['겉보기 각', 'k-th', '°'], ['이웃과 틈', 'k-gap', 'µm'], ['판정', 'k-j', '']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('범프 크기에서는 무게를 무시하고(본드 수 약 2×10⁻⁵) 녹은 솔더를 구의 일부로 계산합니다. 부피 = π·(지름/2)²·도금 높이, 다 덮으면 πh(3a² + h²)/6 = 부피. 젖음 각(30 · 70 · 140°) · 옆면 각(15°) · 옆면 막 두께(1.5 µm)는 가정값이고, 막이 기둥 밑(Ni + Cu 18 µm)에 닿으면 더 내려가지 않고 두꺼워지는 것으로 셉니다. 반응하며 조금씩 타고 내려가는 실제 흘러내림(시간에 따라)은 넣지 않은 평형 계산입니다. 판정 경계(틈 5 · 10 µm)도 예시입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, TT, G, LB, tip, only, wrap, lead, arrow} = K;
    const st = Object.assign({}, DEF);
    let touched = false, pfix = false;
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const setSeg = (g, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${g}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const put = (sel, html) => { const e = ctx.$(sel); if (e) e.innerHTML = html; };
    const clampP = () => {
      pfix = false;
      if (st.p < st.d + 5){ st.p = st.d + 5; pfix = true; const i = inp('p'); if (i) i.value = st.p; ctx.out('p', FMT.p(st.p)); }
    };
    // 솔더 한 덩이 (범프 하나): 모드별 모양. cx, y0, 배율 k
    function solder(c, cx, y0, k, cls){
      let o = '';
      if (c.mode === 'wick'){
        const t = c.t * k, Lp = c.L * k, x0 = cx - c.a * k;
        o += P(`M${q(x0)},${q(y0 - 1)} L${q(x0 - t)},${q(y0 + 3)} L${q(x0 - t)},${q(y0 + Lp - t / 2)} Q${q(x0 - t)},${q(y0 + Lp)} ${q(x0)},${q(y0 + Lp)} Z`, cls) +
          P(`M${q(cx + c.a * k)},${q(y0 - 1)} L${q(cx + c.a * k + t)},${q(y0 + 3)} L${q(cx + c.a * k + t)},${q(y0 + Lp - t / 2)} Q${q(cx + c.a * k + t)},${q(y0 + Lp)} ${q(cx + c.a * k)},${q(y0 + Lp)} Z`, cls);
      }
      o += P(cap(cx, y0, c.r * k, c.h * k), cls);
      return o;
    }
    // ── 아래: 두 범프
    function bumps(c, Ly){
      const k = Ly.s, y0 = Ly.y0, yn = Ly.yn, w = st.d * k, uc = 0.5 * k, top = y0 - c.h * k;
      const tipS = c.mode === 'dome' ? `녹은 솔더 — 바닥을 다 덮고 Ni 모서리에 걸린 돔 (꼭대기 ${f1(c.h)} µm)` : c.mode === 'wick' ? `흘러내린 솔더 — 돔은 ${f1(c.h)} µm, 옆면 막 ${f1(c.L)} µm` : `덜 덮인 솔더 — 바닥 지름 ${f1(2 * c.r)} µm로 물러남 (Ni가 드러남)`;
      let o = '';
      Ly.X.forEach(cx => {
        o += R(cx - w / 2 + uc, YB, w - 2 * uc, 6, 'f-seed2', tip('Cu 시드 — 시드 식각 뒤 기둥 밑에만 남는다 (실제 수백 nm — 그림은 과장)'));
        o += R(cx - w / 2 + uc, YB + 6, w - 2 * uc, 6, 'f-ti', tip('Ti 시드 (접착 · 방벽층, 실제 약 100 nm — 그림은 과장). 가장자리가 조금 깎임(언더컷)'));
        o += R(cx - w / 2, yn, w, YB - yn, 'f-cu2', tip(`Cu 기둥 (15 µm) — 옆면이 깨끗하면 솔더가 타고 내려올 수 있다`));
        o += R(cx - w / 2, y0, w, yn - y0, 'f-ni', tip('Ni (3 µm) — 윗면이 솔더가 젖는 바닥'));
        o += G(solder(c, cx, y0, k, 'f-sn2'), tip(tipS));
        if (c.r < c.a - 0.05) o += R(cx - w / 2, y0 - 3, (c.a - c.r) * k, 4, 'rf04-bare', tip('드러난 Ni — 솔더가 물러난 자리')) + R(cx + c.r * k, y0 - 3, (c.a - c.r) * k, 4, 'rf04-bare', tip('드러난 Ni — 솔더가 물러난 자리'));
      });
      // 왼쪽 범프 안 이름
      const cx1 = Ly.X[0];
      let lb = T(cx1, YB - 7.5 * k + 7, w > 110 ? 'Cu 기둥' : 'Cu', 'rf04-dk') + T(cx1, (y0 + yn) / 2 + 7, 'Ni', 'rf04-dk');
      if (c.h * k > 44) lb += T(cx1, y0 - Math.min(c.h * k * 0.42, 70) + 7, c.r * k * 2 > 140 ? 'SnAg 솔더' : '솔더', 'rf04-dk');
      o += LB(lb);
      o += lead(cx1 + w / 2 - 12, YB + 6, cx1 + w / 2 + 22, 1060, '시드 Ti + Cu — 기둥 밑에만 남음', 'start', 't-sub');
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
      // angle: 드러난 Ni 이름 · 다 덮음
      let ag = '';
      if (c.r < c.a - 0.05){
        // 안쪽 두 드러난 자리에서 가운데 이름으로 (틈이 좁으면 돔 위로)
        const lt = '드러난 Ni', lw = tw(lt, 23), exL = xl + c.r * k + (c.a - c.r) * k / 2, exR = xr - c.r * k - (c.a - c.r) * k / 2;
        const inner = (xr - Math.max(w / 2, c.Rs * k)) - (xl + Math.max(w / 2, c.Rs * k)), ly = inner > lw + 30 ? y0 - 40 : yLab;
        ag += L(exL, y0 - 2, BXC - lw / 2 - 4, ly - 7, 's-lead') + L(exR, y0 - 2, BXC + lw / 2 + 4, ly - 7, 's-lead') + C(exL, y0 - 2, 3.5, 'k-lead') + C(exR, y0 - 2, 3.5, 'k-lead');
        ag += LB(T(BXC, ly, lt, 't-warn'));
      } else ag += LB(T(BXC, yLab, '바닥을 다 덮고 Ni 모서리에 걸림', 't-sub'));
      o += G(ag, only('angle'));
      // edge: 틈 치수선 · 흘러내린 막
      let eg = '';
      const yw = c.h * k > c.Rs * k ? y0 - (c.h - c.Rs) * k : y0 - 6, gx0 = xl + R0, gx1 = xr - R0;
      if (c.gap > 0){
        eg += L(gx0, yw, gx1, yw, 'rf04-dim') + L(gx0, yw - 10, gx0, yw + 10, 'rf04-dim') + L(gx1, yw - 10, gx1, yw + 10, 'rf04-dim');
        const lt = `틈 ${f1(c.gap)} µm`, ok = gx1 - gx0 > tw(lt, 22) + 16;
        eg += LB(T(BXC, ok ? yw - 14 : yLab, lt, c.gap < 5 ? 'pl-warn' : 't-warn'));
        if (!ok) eg += L(BXC, yLab + 6, BXC, yw - 4, 'rf04-dim');
      } else eg += LB(T(BXC, yLab, '붙음 — 브리지', 'pl-warn'));
      if (c.mode === 'wick'){
        // 흘러내린 막 이름: 두 기둥 사이가 넓으면 그 사이 아래쪽에, 아니면 오른쪽 · 왼쪽 빈 곳에
        const fy = y0 + c.L * k * 0.6, inL = xl + c.a * k + c.t * k, inR = xr - c.a * k - c.t * k, t1 = '흘러내린 막', t2 = `${f1(c.L)} µm (양쪽)`;
        const need = Math.max(tw(t1, 21), tw(t2, 21)) + 24, ly = Math.min(YB - 40, Math.max(fy + 30, y0 + 70));
        if (inR - inL >= need) eg += L(inL + 2, fy, BXC - 8, ly - 30, 's-lead') + L(inR - 2, fy, BXC + 8, ly - 30, 's-lead') + LB(T(BXC, ly - 8, t1, 't-warn') + T(BXC, ly + 18, t2, 't-warn'));
        else {
          const fx = xr + c.a * k + c.t * k;
          if (fx + 30 + need <= 976) eg += lead(fx, fy, fx + 26, ly, `${t1} ${f1(c.L)} µm`, 'start', 't-warn');
          else if (xl - c.a * k - c.t * k - 30 - need >= 44) eg += lead(xl - c.a * k - c.t * k, fy, xl - c.a * k - c.t * k - 26, ly, `${t1} ${f1(c.L)} µm`, 'end', 't-warn');
        }
      }
      o += G(eg, only('edge'));
      return o;
    }
    // ── 위: 녹는 순간 네 칸 (volume)
    function frames(c){
      const base = 512, fw = 212;
      const m = Math.min(176 / st.d, 226 / Math.max(st.hc, c.h * 1.14, 1)), a = c.a * m, yc = base - st.hc * m;
      const NM = [['① 도금한 원기둥', `${f1(st.hc)} µm · 거친 겉`], ['② 녹기 시작', '모서리부터 둥글게'], ['③ 출렁임', '몇 번 흔들리다'], ['④ 멈춘 모양', c.mode === 'dome' ? `꼭대기 ${f1(c.h)} µm` : c.mode === 'wick' ? `흘러내림 · ${f1(c.h)} µm` : `덜 덮임 · ${f1(c.h)} µm`]];
      let o = '';
      NM.forEach(([t1, t2], i) => {
        const cx = 60 + i * 228 + fw / 2;
        o += R(cx - a - 10, base, 2 * a + 20, 10, 'f-ni') + R(cx - a - 10, base + 10, 2 * a + 20, 14, 'f-cu2');
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
          o += P(cap(cx, base, aa, hh), 'f-sn2', tip('출렁임 — 몇 번 흔들리다 가라앉는다 (약 0.1 ms)'));
          o += P(cap(cx, base, c.r * m, c.h * m), 'pl-ghost');
          o += P(`M${q(cx - 30)},${q(base - hh - 12)} q15,-8 30,0 q15,8 30,0`, 'rf04-wig') + P(`M${q(cx - 30)},${q(base - hh - 26)} q15,-8 30,0 q15,8 30,0`, 'rf04-wig');
        } else {
          o += solder(c, cx, base, m, 'f-sn2') + R(cx - a, yc, 2 * a, st.hc * m, 'pl-ghost', tip('점선 = 도금한 원기둥'));
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
      const th = TH[st.sf], rp = th > 90 ? 128 : 260, hp = rp * Math.tan(th * RAD / 2), cx = 380, Px = cx + rp, Py = 580;
      const dir = t => [-Math.cos(t * RAD), -Math.sin(t * RAD)];
      let o = P(cap(cx, Py, rp, hp), 'f-sn2', tip(`녹은 솔더 방울 — 접촉각 약 ${th}° (${SFN[st.sf]})`));
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
      o += LB(T(Px - gSL + 8, Py - 14, '고체–액체', 'rf04-dk', 'end'));
      const lx = Px + 130 * ux, ly = Py + 130 * uy;
      o += LB(th < 60 ? T(lx - 8, ly - 14, '액체–기체 (표면장력)', 't-sub', 'end') : T(lx + 14, ly - 4, '액체–기체 (표면장력)', 't-sub', 'start'));
      // 지금 상태 (오른쪽 위)
      o += LB(T(670, 290, '지금 Ni/SnAg 계면', 't-dim', 'start') + T(670, 322, SFN[st.sf], 't-warn', 'start') + T(670, 352, `접촉각 약 ${th}°`, 't-sub', 'start') + T(670, 380, SFW[st.sf], 't-sub', 'start'));
      o += LB(T(670, 420, th < 90 ? '고체–기체 힘이 커서 퍼진다' : '고체–기체 힘이 작아 물러난다', 't-dim', 'start'));
      return o;
    }
    // ── 위: 모서리 확대 (edge)
    function corner(c){
      const cx = 430, cy = 400, dir = t => [-Math.cos(t * RAD), -Math.sin(t * RAD)];
      const lim = st.sw === 'cl' ? TSIDE + 90 : 180;
      let o = '';
      if (c.mode === 'dewet' || c.mode === 'ball'){
        // 바닥이 안 젖어 모서리까지 오지 못함
        const th = c.thY, rx = 130, hh = rx * Math.tan(th * RAD / 2), mx = 210;
        o += `<clipPath id="${K.id('rf04-zc')}"><rect x="80" y="230" width="540" height="170"/></clipPath>`;
        o += G(P(cap(mx, cy, rx, hh), 'f-sn2'), {'clip-path': K.url('rf04-zc')});
        o += R(mx + rx, cy - 3, cx - mx - rx, 4, 'rf04-bare', tip('드러난 Ni'));
        o += LB(T(cx - 8, cy - 18, '드러난 Ni', 't-warn', 'end'));
        o += TT(450, 300, ['바닥(Ni 윗면)이', '안 젖어 모서리까지', '오지 못함'], 't-sub', 'start', 28);
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
      // 흘러내린 막 (옆면)
      if (c.mode === 'wick'){
        const Lz = c.Lfull <= 3 ? c.Lfull / 3 * 70 : Math.min(210, 70 + (c.Lfull - 3) / 15 * 140);
        o += P(`M${cx},${cy - 2} L${cx + 14},${cy + 6} L${cx + 14},${q(cy + Lz - 7)} Q${cx + 14},${q(cy + Lz)} ${cx},${q(cy + Lz)} Z`, 'f-sn2', tip(`넘친 솔더가 옆면을 타고 내려간 막 (${f1(c.L)} µm)`));
        o += arrow(cx + 32, cy + 20, cx + 32, cy + Math.max(40, Lz - 10), 's-arr2');
        o += LB(T(cx + 48, cy + Math.min(Lz, 140) / 2 + 30, '흘러내림', 't-warn', 'start'));
      }
      o += K.PG(pts, 'f-sn2', tip(`녹은 솔더 — 모서리에서 겉보기 각 ${Math.round(thS)}°`));
      // 허용 부채꼴 θ_Y ~ 한계
      const rf = 118, a0 = c.thY, a1 = Math.min(lim, 180), [f0x, f0y] = dir(a0), [f1x, f1y] = dir(a1);
      o += P(`M${cx},${cy} L${q(cx + rf * f0x)},${q(cy + rf * f0y)} A${rf},${rf} 0 0 1 ${q(cx + rf * f1x)},${q(cy + rf * f1y)} Z`, 'rf04-fan', tip(`멈춰 있을 수 있는 각의 범위: ${a0}° ~ ${st.sw === 'cl' ? lim + '°' : '180° 넘음'}`));
      const wick = c.mode === 'wick';
      o += L(cx, cy, cx + 140 * ux, cy + 140 * uy, 'rf04-tan');
      const tx = cx + 140 * ux, ty = cy + 140 * uy;
      if (wick){ const [lx, ly] = dir(lim); o += LB(T(cx + 96 * lx + 18, cy + 96 * ly + 6, `한계 ${lim}°`, 'pl-warn', 'start') + T(cx + 96 * lx + 18, cy + 96 * ly + 32, '→ 넘침', 't-warn', 'start')); }
      else {
        o += LB(T(tx - 8, ty - 4, `겉보기 ${Math.round(c.th0)}°`, 't-warn', 'end'));
        if (st.sw === 'cl'){
          const [lx, ly] = dir(lim);
          o += L(cx, cy, cx + 140 * lx, cy + 140 * ly, 'pl-peak') + LB(T(cx + 118 * lx + 14, cy + 118 * ly + 26, `한계 ${lim}°`, 'pl-warn', 'start'));
        } else o += L(cx, cy, cx + 150, cy, 'pl-peak') + LB(T(cx + 20, cy + 34, '한계 > 180°', 'pl-warn', 'start'));
      }
      const [yx, yy] = dir(a0);
      o += LB(T(cx + 128 * yx - 6, cy + 128 * yy + 4, `θ ${a0}°`, 'rf04-dk', 'end'));
      return o;
    }
    function side(){
      const cur = st.sw;
      const box = (y, h, on, hd, cls, lines) => R(636, y, 330, h, on ? 'pl-hlbox' : 'pl-lane', {rx: 10}) + T(652, y + 32, hd, cls, 'start') + TT(652, y + 62, lines, 't-dim', 'start', 25);
      let o = box(270, 150, cur === 'ox', '산화된 옆면', 'pl-hdg3', ['잘 안 젖음 → 한계가 180°를', '넘어 돔이 넘치지 않음', '(뒤 공정 접착에는 나쁨)']);
      o += box(434, 178, cur === 'cl', '깨끗한 옆면', 'pl-hdg2', ['플럭스 · 환원 기체로 산화막이', '걷힘 · 옆면 각 약 15° (가정)', '→ 겉보기 각 105°를 넘으면', '옆면으로 흘러내림']);
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
      o += G(g, {'clip-path': K.url('rf04-gc')});
      o += LB(T(GX1 - 4, Y(a) + (Y(a) - GY1 > 30 ? -10 : 24), '반구 (높이 = 바닥 반지름)', 't-dim', 'end'));
      // 지금 점
      const px = X(c.V), py = Y(c.h);
      o += C(px, py, 9, c.mode === 'dome' ? 'k-acc2' : 'k-warn') + C(px, py, 18, 'co-ring');
      const lt = `${fmt(c.V)} µm³ → ${f1(c.h)} µm`, lw = tw(lt, 23);
      const hb = [GX1 - 4 - tw('반구 (높이 = 바닥 반지름)', 19), Y(a) + (Y(a) - GY1 > 30 ? -10 : 24) - 18, GX1, Y(a) + (Y(a) - GY1 > 30 ? -10 : 24) + 4];
      const cands = [[px + 18, py - 16], [px - 18 - lw, py - 16], [px + 18, py + 30], [px - 18 - lw, py + 30]];
      const fits = ([x, y]) => x >= GX0 + 4 && x + lw <= GX1 + 36 && y - 20 >= GY1 && y <= GY0 - 6 && !(x < hb[2] && x + lw > hb[0] && y - 20 < hb[3] && y > hb[1]);
      const [lx0, ly0] = cands.find(fits) || cands[0];
      o += LB(T(lx0, ly0, lt, 't-warn', 'start'));
      // 아래 글
      let y = 672;
      const line = (t, cls, em = 24.5, lh = 29) => { const ln = wrap(t, em); o += TT(1030, y, ln, cls, 'start', lh); y += ln.length * lh + 10; };
      if (c.mode === 'dome'){
        line(`부피 ±5 % → 꼭대기 ±${c.dh.toFixed(2)} µm (±${(c.dh / c.h * 100).toFixed(1)} %)`, 't-warn', 22);
        line(`도금 높이였다면 ±${(0.05 * st.hc).toFixed(2)} µm — 돔이 반구보다 높으면 조금 줄어서 넘어가고, 아주 얇은 솔더는 오히려 커집니다.`, 't-sub');
      } else if (c.mode === 'wick'){
        line(`꼭대기는 105° 한계에 묶여 ${f1(c.h)} µm`, 't-warn', 22);
        line(`넘친 ${fmt(c.Vex)} µm³는 옆면으로 → 부피 ±5 %는 꼭대기가 아니라 흘러내림 길이로${c.dL ? ` (±${f1(c.dL)} µm)` : ''} 넘어갑니다.`, 't-sub');
      } else {
        line(`바닥이 물러나 점이 곡선 위에 있다 (${f1(c.h)} µm)`, 't-warn', 22);
        line(`바닥 지름 ${f1(2 * c.r)} µm로 줄어 더 높은 공에 가까워집니다. 이때 부피 ±5 % → 꼭대기 ±${c.dh.toFixed(2)} µm.`, 't-sub');
      }
      if (c.dH < 0 && c.mode === 'dome') line(`도금 높이가 지름의 약 0.87배를 넘어 공처럼 옆으로 부풀었습니다 — 꼭대기가 도금보다 ${f1(-c.dH)} µm 낮음.`, 't-sub');
      line('→ 리플로우 뒤 높이 산포를 줄이는 손잡이는 대부분 앞 공정입니다 (도금 부피 = 두께 × 바닥 넓이).', 't-dim', 26.5, 26);
      return o;
    }
    // ── 오른쪽 패널: 방울 셋 (angle)
    function pang(c){
      let o = T(1030, 176, 'Ni/SnAg 계면 상태 → 접촉각', 't-acc', 'start');
      [['c', 30, '깨끗한 Ni', '약 30° — 잘 젖음'], ['o', 70, '얇은 산화', '약 70° — 덜 젖음'], ['x', 140, '계면 산화 · 오염', '약 140° — 안 젖음']].forEach(([k, th, n1, n2], i) => {
        const y = 200 + i * 172, on = st.sf === k, rp = th > 90 ? 34 : 62, hp = rp * Math.tan(th * RAD / 2);
        o += R(1030, y, 500, 156, on ? 'pl-hlbox' : 'pl-lane', {rx: 10});
        o += R(1048, y + 124, 164, 12, 'f-ni') + P(cap(1130, y + 124, rp, hp), 'f-sn2', tip(`${n1} — ${n2}`));
        o += T(1236, y + 58, n1, on ? 't-warn' : 't-sub', 'start') + T(1236, y + 90, n2, 't-dim', 'start');
        if (on) o += T(1514, y + 30, '지금', 'pl-hdg', 'end');
      });
      let y = 742;
      const line = (t, cls, em = 24.5, lh = 28) => { const ln = wrap(t, em); o += TT(1030, y, ln, cls, 'start', lh); y += ln.length * lh + 10; };
      o += T(1030, y, '겉보기 각 ≠ 접촉각', 'pl-hdg', 'start'); y += 34;
      line(c.mode === 'dome' || c.mode === 'wick' ? `가장자리에 걸린 돔의 각(지금 ${Math.round(c.th0)}°)은 부피가 정합니다. 접촉각은 '바닥을 다 덮을 수 있는가'만 정합니다.` : `접촉각 ${c.thY}°가 다 덮을 때의 각 ${Math.round(c.th0)}°보다 커서 바닥을 다 덮지 못합니다 → 바닥 지름 ${f1(2 * c.r)} µm.`, 't-sub');
      line('깨끗한 Ni 위 SnAg 계열 약 30~45° (보고값, 조건에 따라). 솔더 겉 산화막은 공이 아니라 덜 둥긂으로 나타납니다 (03장).', 't-dim', 26.5, 26);
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
      line(c.gap > 0 ? `틈 ${f1(c.gap)} µm (피치 ${st.p} − 솔더 폭 ${f1(2 * c.Rw)})` : `틈 없음 — 피치 ${st.p} µm < 솔더 폭 ${f1(2 * c.Rw)} µm`, c.gap < 5 ? 'pl-warn' : 't-warn', 22);
      if (c.mode === 'wick') line(c.Lfull > HP ? `흘러내림 — 기둥 밑(18 µm)까지 닿고 막이 ${f1(c.t)} µm로 두꺼워짐. 꼭대기 ${f1(c.h0)} → ${f1(c.h)} µm` : `흘러내림 ${f1(c.L)} µm (Ni 3 µm${c.L > 3 ? ` 지나 Cu ${f1(c.L - 3)} µm` : ''}) · 꼭대기 ${f1(c.h0)} → ${f1(c.h)} µm. 옆면에도 IMC가 생깁니다 (05장).`, 't-sub');
      else if (c.mode === 'dome') line(st.sw === 'cl' ? `겉보기 각 ${Math.round(c.th0)}° < 한계 105° — 아직 모서리에 걸려 있습니다. 솔더가 조금만 많아도 넘칩니다.` : `흘러내림 없음 — 산화된 옆면이 모서리에서 붙잡습니다 (겉보기 각 ${Math.round(c.th0)}°).`, 't-sub');
      else line('바닥(Ni 윗면)도 다 젖지 않아 모서리까지 오지 못했습니다 — 흘러내림 없음.', 't-sub');
      line('뒤 공정: 열압착(TC) 본딩(누르면서 데워 붙임) 때 눌리면 더 흘러내리고 퍼집니다.', 't-sub');
      const J = {ok: '괜찮음 — 틈 여유 충분', warn: '여유 적음', ng: '이웃과 붙을 위험 (브리지)'}[c.gapCls];
      o += T(1030, y + 8, `틈 판정: ${J}`, c.gapCls === 'ok' ? 'pl-hdg3' : 'pl-hdg2', 'start');
      // 도금 높이 → 흘러내림 길이 (깨끗한 옆면, 지금 지름)
      const a = c.a, hm = a * Math.tan((TSIDE + 90) * RAD / 2), hth = capV(a, hm) / (Math.PI * a * a);
      const Lc = hc => Math.min(HP, Math.max(0, (Math.PI * a * a * hc - capV(a, hm)) / (Math.PI * (st.d + TF) * TF)));
      const CY0 = y + 236, CY1 = y + 92, CX0 = 1090, CX1 = 1500, xh = v => CX0 + (v - 4) / 21 * (CX1 - CX0), yl = v => CY0 - v / HP * (CY0 - CY1);
      o += T(1030, y + 44, `도금 높이 → 흘러내림 (깨끗한 옆면 · 지름 ${st.d} µm)`, 'pl-hdg', 'start');
      o += L(CX0, CY0, CX1 + 8, CY0, 's-axis') + L(CX0, CY0, CX0, CY1 - 6, 's-axis');
      [4, 10, 15, 20, 25].forEach(v => { o += L(xh(v), CY0, xh(v), CY0 + 7, 's-axis') + T(xh(v), CY0 + 28, v === 25 ? '25 µm' : String(v), 't-dim'); });
      [0, 9, 18].forEach(v => { o += L(CX0 - 7, yl(v), CX0, yl(v), 's-axis') + T(CX0 - 12, yl(v) + 7, String(v), 't-dim', 'end'); });
      o += T(CX0 - 12, CY1 - 18, 'µm', 't-dim', 'end') + T(CX1, yl(HP) + 26, '기둥 밑 (18 µm)', 't-dim', 'end');
      let lc = '';
      for (let k = 0; k <= 84; k++){ const v = 4 + 21 * k / 84; lc += (k ? ' L' : 'M') + q(xh(v)) + ',' + q(yl(Lc(v))); }
      o += P(lc, 's-curve', tip('깨끗한 옆면일 때 흘러내림 길이 (평형 · 개념 모델). 18 µm = 기둥 밑'));
      if (hth >= 4 && hth <= 25){ const lt = `${f1(hth)} µm부터 넘침`, left = xh(hth) - 10 - tw(lt, 23) >= CX0 + 4; o += L(xh(hth), CY0, xh(hth), CY1, 's-dash') + T(left ? xh(hth) - 10 : xh(hth) + 10, CY0 - 58, lt, 't-warn', left ? 'end' : 'start'); }
      const cl0 = st.sw === 'cl', ly0 = cl0 ? Lc(st.hc) : 0;
      o += C(xh(st.hc), yl(ly0), 9, cl0 ? 'k-acc2' : 'k-ok') + C(xh(st.hc), yl(ly0), 18, 'co-ring');
      if (!cl0){ const lt = '산화된 옆면 → 0', x0 = Math.max(CX0 + 4, Math.min(xh(st.hc) - tw(lt, 21) / 2, CX1 - tw(lt, 21))); o += T(x0, CY0 - 18, lt, 't-sub', 'start'); }
      y += 316;
      // 환원 세기 — 맞바꿈 (지금 옆면 상태 표시)
      const ty = y, cl = st.sw === 'cl';
      o += T(1030, ty, '환원 세기(플럭스 · 포름산) — 맞바꿈', 'pl-hdg', 'start');
      o += K.arrowP(`M1290,${ty + 34} L1060,${ty + 34}`, 's-arr3') + K.arrowP(`M1300,${ty + 34} L1520,${ty + 34}`, 's-arr3');
      o += T(1060, ty + 66, '약함', 't-sub', 'start') + T(1520, ty + 66, '셈', 't-sub', 'end');
      o += C(cl ? 1440 : 1140, ty + 34, 11, 'k-acc2') + C(cl ? 1440 : 1140, ty + 34, 20, 'co-ring');
      o += TT(1040, ty + 98, ['옆면 산화 남음', '흘러내림 막음 · 접착 나쁨'], cl ? 't-dim' : 't-sub', 'start', 26);
      o += TT(1520, ty + 98, ['옆면 깨끗', '흘러내림 위험 · 접착 좋음'], cl ? 't-sub' : 't-dim', 'end', 26);
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
      const SJ = {dome: c.dH < 0 ? '돔 — 옆으로 부풂' : '매끈한 돔', dewet: '덜 덮임', ball: '공처럼 뭉침', wick: c.Lfull > HP ? '기둥 밑까지 흘러내림' : '흘러내림'}[c.mode];
      ctx.out('k-j', c.gapCls === 'ng' ? '브리지 위험' : SJ + (c.gapCls === 'warn' ? ' · 틈 적음' : ''));
      const kj = ctx.card.querySelector('[data-o="k-j"]').parentNode, kg = ctx.card.querySelector('[data-o="k-gap"]').parentNode;
      ['ok', 'warn', 'ng'].forEach(x => { kj.classList.toggle(x, c.cls === x); kg.classList.toggle(x, c.gapCls === x); });
      // 메시지
      const dTxt = c.dH >= 0 ? `${f1(c.dH)} µm 높음` : `${f1(-c.dH)} µm 낮음 — 공처럼 옆으로 부풂`;
      let m = '';
      if (c.mode === 'dome') m = `${fmt(c.V)} µm³가 지름 ${st.d} µm 바닥에 모이면 꼭대기 ${f1(c.h)} µm (도금 ${f1(st.hc)} µm보다 ${dTxt}). 매끈한 돔 — 가장자리에 고정되어 있고, 부피 ±5 %면 꼭대기 ±${c.dh.toFixed(2)} µm입니다.`;
      else if (c.mode === 'wick') m = `겉보기 각 ${Math.round(c.th0)}°가 깨끗한 옆면의 한계 105°를 넘어 ${fmt(c.Vex)} µm³가 옆면으로 흘러내립니다(${c.Lfull > HP ? '기둥 밑까지' : f1(c.L) + ' µm'}). 꼭대기는 ${f1(c.h0)} → ${f1(c.h)} µm. → 옆면을 깨끗하게 만든 환원 · 긴 액상 시간 · 많은 솔더 · 언더컷으로 드러난 옆면 (<a href="#go-etch-04">시드 식각 4장</a>)을 봅니다.`;
      else m = `접촉각 ${c.thY}°가 다 덮을 때의 겉보기 각 ${Math.round(c.th0)}°보다 커서 바닥을 다 덮지 못합니다 → 바닥 지름 ${f1(2 * c.r)} µm, 꼭대기 ${f1(c.h)} µm (${c.mode === 'ball' ? '공처럼 뭉침 — 비젖음' : '덜 덮임 — 디웨팅'}). → 보통 Ni/SnAg 계면 산화(도금 층 사이 대기) · 오염이 원인입니다 (<a href="#go-plating-12">전해도금 12장</a>).`;
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
    ctx.seg('sf', (v, user) => { st.sf = v; render(); if (user){ touched = true; jump('sf'); } });
    ctx.seg('sw', (v, user) => { st.sw = v; render(); if (user){ touched = true; jump('sw'); } });
    IDS.forEach(id => { const i = inp(id); if (i) i.addEventListener('input', () => { touched = true; jump(id); }); });
    ctx.demo = sid => {
      if (touched) return ctx.refresh();
      Object.assign(st, DEF, DEMO[sid] || {});
      IDS.forEach(id => { const i = inp(id); if (i) i.value = st[id]; ctx.out(id, FMT[id](st[id])); });
      setSeg('sf', st.sf); setSeg('sw', st.sw);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['표면장력 (γ)', '액체가 겉넓이를 줄이려는 성질 — 겉면을 따라 당기는 힘으로 나타난다. 단위 N/m. 물 0.072, 녹은 SnAg 약 0.4~0.55'],
      ['접촉각 (θ)', '방울 가장자리에서 고체 면과 액체 겉면이 이루는 각. 작을수록 잘 젖는다'],
      ['젖음 · 비젖음 · 디웨팅', '퍼져 붙음 / 처음부터 안 붙음 / 붙었다가 물러나 Ni가 드러남'],
      ['영의 식', '접촉선에서 세 겉면 에너지(고체–기체 · 고체–액체 · 액체–기체)의 균형으로 접촉각을 정하는 식'],
      ['가장자리 고정 (핀닝)', '접촉선이 모서리에 걸려, 각이 커져도 움직이지 않는 것'],
      ['본드 수', '무게와 표면장력의 비. 아주 작으면(지름 25 µm 솔더 약 2×10⁻⁵) 무게를 무시한다'],
      ['흘러내림 (위킹)', '녹은 솔더가 Ni · Cu 옆면을 타고 내려가는 것'],
      ['동일평면성 (코플래너리티)', '다이 안 범프 꼭대기가 한 평면에 고르게 있는 정도. 본딩에서 모든 범프가 함께 닿으려면 중요하다']
    ]) + K.field([
      '리플로우 뒤 <b>높이 산포를 줄이는 손잡이는 대부분 앞 공정</b>(도금 부피 산포: 두께 × 바닥 넓이)입니다. 리플로우 조건으로는 덜 녹음 · 흘러내림의 차이만 줄일 수 있습니다 → <a href="#go-plating-07">전해도금 7장</a>. 돔 높이는 측정 정의(꼭대기 · 평균 · 기준면)와 장비가 다르면 숫자가 달라지므로, 리플로우 전후를 같은 정의로 잽니다.',
      '옆면 흘러내림이 보이면 환원 세기(플럭스 양 · 포름산) · 액상선 위 시간 · 솔더 부피 · 시드 식각 언더컷(드러난 옆면)을 함께 봅니다 [리플로우-분위기 · 조건] [앞 공정] → <a href="#go-etch-04">시드 식각 4장</a>.',
      '디웨팅(Ni가 드러남)은 대개 <b>Ni/SnAg 계면</b> 문제입니다(Ni 도금 → SnAg 도금 사이 대기 · 헹굼) [앞 공정]. 리플로우 조건보다 도금 층 사이 시간을 먼저 봅니다 → <a href="#go-plating-12">전해도금 12장</a>.',
      '옆면 산화막은 흘러내림을 막아 주지만, 산화 · 변색된 Cu 기둥 옆면은 뒤 공정(NCF · 언더필) 접착에 나쁩니다 [뒤 공정]. 환원 세기(플럭스 · 포름산)는 이 둘 사이의 맞바꿈입니다 → <a data-go="defects.tiles">09장</a>.',
      '솔더 · Ni 표면의 아주 얇은 유기막(PR 스트립 잔여)도 젖음을 나쁘게 하고 보이드 기체가 됩니다. 눈에 안 보여도 의심합니다 [앞 공정] → <a href="#go-strip-08">PR 스트립 8장</a>.'
    ]) + K.deep(`<p>이 장 위젯의 식 (구형 모자, a = 바닥 반지름, h = 꼭대기 높이):</p>
      ${K.eq('V = πa²·H_c = πh(3a² + h²)/6')}${K.eq('겉보기 각 = 2·arctan(h/a)')}${K.eq('구 반지름 R = (a² + h²)/(2h)')}${K.eq('γ_SV = γ_SL + γ_LV·cosθ  (영의 식)')}
      <ul><li><b>영의 식과 반응성 젖음</b> — 솔더–금속 젖음은 계면에서 IMC가 생기며 진행되어, 실제로 보는 각은 반응 뒤 IMC 위의 각에 가깝습니다. 보고 예: SAC 계열 250 °C · Ar에서 Ni 위 약 37°, Cu 위 약 29°, Sn-3.5Ag/Cu 약 43°(측정법 · 플럭스에 따라).</li>
      <li><b>본드 수와 모양</b> — Bo = ρgR²/γ ≈ 7,000 × 9.8 × (12.5×10⁻⁶)² / 0.5 ≈ 2×10⁻⁵. 그래서 녹은 솔더는 구의 일부(구형 모자)입니다. 예: a 12.5 µm · 도금 12 µm → V 5,890 µm³ · h 15.7 µm · 겉보기 각 103° · R 12.8 µm. 속 압력은 라플라스 압력 ΔP = 2γ/R ≈ 2 × 0.5 / 12.8×10⁻⁶ ≈ 0.8 bar(약 0.8기압 더). h/H_c = 6a²/(3a² + h²)라, 도금 높이가 지름의 약 0.87배(h > √3·a, 겉보기 각 120° 넘음)를 넘으면 꼭대기가 오히려 도금보다 낮아집니다.</li>
      <li><b>높이 산포</b> — dh/dV = 2/[π(a² + h²)]. h ≈ a 근처에서는 부피 산포가 높이 산포로 거의 1 : 1로, h > a(지금 예시 h/a ≈ 1.26)에서는 조금 줄어서 넘어갑니다(±5 % → ±0.47 µm, 도금 높이였다면 ±0.6 µm). 아주 얇은 솔더(h ≪ a)에서는 오히려 약 2배로 커집니다.</li>
      <li><b>깁스의 조건</b> — 직각 모서리에서 접촉선은 θ_Y ≤ θ ≤ θ_Y + 90° 사이에서 고정됩니다(일반식 θ_c = θ_Y + α, α = 모서리 너머 면이 꺾인 각). 옆면이 깨끗해 옆면 각이 작으면(예 15°) 겉보기 각 약 105°에서 넘치고, 옆면이 산화돼 각이 크면 넘치지 않습니다. 실제로는 반응(IMC)이 앞서 나가며 조금씩 타고 내려가는 '반응성 흘러내림'도 있어 시간이 길수록 늘어납니다.</li>
      <li><b>표면장력 수치</b> — 순수 Sn은 녹는점 근처 약 0.5~0.55 N/m(산소가 아주 적을 때), 온도 계수 약 −0.1 mN/(m·K). 산소가 흡착하면 크게 낮아지고, 산소 분압이 높으면 녹는점 근처에서 온도에 따라 오히려 오르는 보고도 있습니다. SnAg는 보고값이 측정법 · 분위기에 따라 흩어져 '약 0.4~0.55 N/m'로 씁니다.</li>
      <li><b>모양이 바뀌는 시간</b> — 모세관 시간 √(ρa³/γ) ≈ 5 µs, 오네조르게 수 μ/√(ργa) ≈ 0.01이라 몇 번 출렁이다 약 0.1 ms(ρa²/5μ)에 가라앉습니다. 녹는 순간 모양은 거의 바로 정해집니다.</li>
      <li><b>작은 범프와 옆면</b> — Sn-3.5Ag/Ni/Cu 범프에서 지름이 작을수록 기둥 가장자리의 옆면 젖음 반응(보이드 · (Cu,Ni)₆Sn₅)이 두드러진다는 보고, 열압착(TC) 본딩에서 녹은 솔더가 눌려 Cu 기둥 옆면으로 올라가 Sn 소모 · 커켄달 보이드를 키운다는 보고가 있습니다(→ <a data-go="imc.cu">05장</a>).</li></ul>`);
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
.pl-svg .rf04-zok{fill:rgba(74,222,128,.28)}`
});
})();
