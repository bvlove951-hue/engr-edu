/* PR 스트립 07 — 금속 지키기: 스트리퍼는 왜 Cu · Sn을 먹을까 (범프 표면 · nm) */
(function(){
// 그림 예시 범프 (plans/stack.md): 지름 25 µm. 기준 그림 = 베이스 다이 Cu 기둥 12 + Ni 3 + 상부 Cu 3 + SnAg 12 µm (= 30 µm),
// 위젯 '범프'에서 코어 다이 Ni 5 + SnAg 12 µm (= 17 µm)로 바꿔 그린다. PR은 이미 걷힌 뒤(오버 스트립 · 헹굼)
const PX = 10;                                                     // 1 µm = 10 px (왼쪽 단면 — 범프는 실제 비율, 시드 · Ti만 과장)
const LX0 = 40, LX1 = 760;                                         // 왼쪽 단면 가로 범위
const SEED = 940, SEEDH = 20;                                      // 시드 Cu 윗면 · 그림 두께 (실제 300 nm — 크게 과장)
const BX0 = 250, BX1 = 500, BCX = 375;                             // 범프 (지름 25 µm)
const SNH = 12 * PX;                                               // SnAg 12 µm (두 다이 같은 예시)
const NI_TIP = '\n알칼리에서는 비교적 잘 견딘다 (아민 · 암모니아와는 착이온을 만들 수 있어 조건에 따라 먹힘)';
// 범프 층 (아래 → 위, SnAg 제외): [위 y, 아래 y, 재질, 이름표, 이름표 글자, 툴팁]. 베이스: Cu 기둥 820~940 · Ni 790~820 · 상부 Cu 760~790 · SnAg 640~760
const LAY = {
  base: [[SEED - 12 * PX, SEED, 'f-cu2', 'Cu 기둥', 'st07-in', 'Cu 기둥 — 높이 · 전기 (예시 12 µm · 지름 25 µm)\n옆면 손실 수 nm는 지름에는 아주 작은 몫'],
    [SEED - 15 * PX, SEED - 12 * PX, 'f-ni', 'Ni', 'st07-in2', 'Ni — Cu 기둥과 솔더 사이 방벽 (예시 3 µm)' + NI_TIP],
    [SEED - 18 * PX, SEED - 15 * PX, 'f-cu2', '상부 Cu', 'st07-in2', '상부 Cu — 솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로 (예시 3 µm)\nNi 위에 얇게 한 번 더 올린 Cu. 스트립 때는 Ni와 SnAg 사이 얇은 띠로 액에 닿는다']],
  core: [[SEED - 5 * PX, SEED, 'f-ni', 'Ni (몸통)', 'st07-in', 'Ni — 몸통 겸 방벽 (Cu 기둥 없음, 예시 5 µm · 지름 25 µm)' + NI_TIP]]
};
// 다이별 기하: SnAg 위 · 아래, 옆면에 드러난 Cu 구간, 두 금속이 맞닿은 선 (y)
const geo = die => {
  const L = LAY[die], sb = L[L.length - 1][0];
  return {L, sb, st: sb - SNH, cu: die === 'base' ? [[L[0][0], SEED], [L[2][0], L[2][1]]] : [], junc: die === 'base' ? [L[0][0], L[1][0], L[2][0]] : [SEED, sb]};
};
const UCH = 3000;                                                  // 상부 Cu 띠 높이 (nm, 예시 3 µm)
const pc2 = v => v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : v.toFixed(0);
const LIQ = 240;                                                  // 액 윗면 (위는 공기 · 질소 띠)
const ZC = {x: 650, y: 790, r: 100}, ZS = 2, ZTOP = 742;           // 확대 동그라미: 시드 윗부분을 nm 눈금(2 px/nm, 위 약 70 nm)으로
const RP = {x: 790, y: 120, w: 780, h: 762};                       // 오른쪽 패널
const RB = {x: 790, y: 896, w: 780, h: 212};                       // 결과 상자

// ── 개념 모델 (기획 rev.2의 07장 모델 · 04장과 같은 속도식 — 상수는 모두 가정값) ──
// r_Cu = 2·A60·(0.1 + f_w)·O·B_Cu·I_Cu, r_Sn = 3·A60·(0.1 + f_w)·B_Sn·I_Sn (nm/분), f_w = w/(w+2)
// 헹굼 순간: Δ_Cu = 3·(1 + f_w)·H, Δ_Sn = 2·(아민 1 · TMAH 2)·(1 + f_w)·H, H: 중간 용제 → 물 0.2 · 바로 물 1 (아민계 가정)
const RG = 8.314, TREF = 343.15;
const a60 = T => Math.exp(-(60000 / RG) * (1 / (T + 273.15) - 1 / TREF));
function calc(s){
  const A = a60(s.T), fw = s.w / (s.w + 2), am = s.base === 'amine';
  const rCu = 2.0 * A * (0.1 + fw) * (s.o2 === 'air' ? 1 : 0.3) * (am ? 1 : 0.5) * (s.inh === 'on' ? 0.1 : 1);
  const rSn = 3.0 * A * (0.1 + fw) * (am ? 0.3 : 1) * (s.inh === 'on' ? 0.4 : 1);
  const H = s.rinse === 'sol' ? 0.2 : 1;
  const cuS = rCu * s.t, snS = rSn * s.t, cuR = 3 * (1 + fw) * H, snR = 2 * (am ? 1 : 2) * (1 + fw) * H;
  const cu = cuS + cuR, sn = snS + snR;
  return {A, fw, rCu, rSn, cuS, snS, cuR, snR, cu, sn, seed: Math.max(0, 1 - cu / 300), strip: (cuS + snS) / (cu + sn)};
}
// 기본 13분 = 그림 기준 PR 35 µm · 70 °C · 순환에서 평평한 곳이 다 걷히는 약 10분 + 여유 30 % (08장 예와 같음)
// die: 그림의 범프 (base 베이스 다이 · core 코어 다이) — 손실 속도는 같고, 어느 면이 액에 닿는지만 바뀐다
const DEF = {T: 70, w: 3, t: 13, base: 'amine', o2: 'air', inh: 'on', rinse: 'sol', die: 'base'};
// 손대지 않았을 때 단계마다 보여 줄 값 (발표 모드 대비)
const DEMO = {
  cu: Object.assign({}, DEF, {w: 10, inh: 'off'}),
  sn: Object.assign({}, DEF, {w: 5, base: 'tmah'}),
  galv: Object.assign({}, DEF),
  rinse: Object.assign({}, DEF, {rinse: 'di'}),
  die: Object.assign({}, DEF, {die: 'core'})
};
const STEPS = ['cu', 'sn', 'galv', 'rinse', 'die'];
const SEGS = ['base', 'o2', 'inh', 'rinse', 'die'];
// 좁은 세로 화면 전용 확대: 범프 단면(아래쪽) 또는 오른쪽 패널
const VN_L = {x: 26, y: 424, w: 748, h: 696}, VN_R = {x: 784, y: 116, w: 792, h: 772};

// ── 헹굼 첫 1분 그래프 (모양만 · 개념): 성분 농도와 '금속이 먹히는 세기' ──
const comps = t => ({inh: Math.exp(-t / 4), w: 1 - Math.exp(-t / 2.5), d: Math.exp(-t / 7), oh: (1 - Math.exp(-t / 1.5)) * Math.exp(-t / 9)});
function attack(t, amine){ if (t <= 0) return 0; const c = comps(t); return c.d * c.w * (1 - 0.85 * c.inh) * (1 + (amine ? 1.4 : 0) * c.oh); }
let ATKMAX = 0; for (let t = 0; t <= 60; t += 0.1) ATKMAX = Math.max(ATKMAX, attack(t, true));
const RX0 = 900, RX1 = 1500, RY0 = 620, RY1 = 215;
const rgx = t => RX0 + t / 60 * (RX1 - RX0), rgy = v => RY0 - v / 1.08 * (RY0 - RY1);
// ── Sn 녹는 정도 – pH (로그, 모양만): 산 쪽 Sn²⁺, 알칼리 쪽 HSnO₂⁻ · SnO₃²⁻, 가장 덜 녹는 곳 pH 약 8.5 ──
const SX0 = 900, SX1 = 1500, SY0 = 730, SY1 = 240;
const snx = ph => SX0 + ph / 14 * (SX1 - SX0), snL = ph => Math.log10(Math.pow(10, -1.2 * (ph - 8.5)) + Math.pow(10, 0.9 * (ph - 8.5)));
const sny = v => SY0 - (v + 0.5) / 11 * (SY0 - SY1);

// 글자 폭 어림 (한글 1em, 영문 · 숫자 약 0.56em, 그 밖 0.9em)
const emw = s => [...String(s)].reduce((a, c) => a + (/[ㄱ-힝]/.test(c) ? 1 : /[A-Za-z0-9 .,:;'()\-]/.test(c) ? 0.56 : 0.9), 0);
const f1 = v => v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(1);
// 경로를 따라 움직이며 나타났다 사라지는 작은 분자 (pre: 이온 원 뒤에 그릴 것 — 아민 고리 등)
function fly(cls, label, path, dur, delay, pre, tipText){
  const b = `begin="-${delay.toFixed(1)}s"`;
  return `<g class="pl-ion ${cls}"${tipText ? ` data-tip="${tipText}"` : ''}>${pre || ''}<circle r="${cls === 'st07-oh' ? 14 : 18}"/><text y="5" text-anchor="middle">${label}</text><animateMotion dur="${dur}s" ${b} repeatCount="indefinite" path="${path}"/><animate attributeName="opacity" values="0;1;1;1;0" dur="${dur}s" ${b} repeatCount="indefinite"/></g>`;
}
// 산소 분자: 빨간 원 두 개
function o2(path, dur, delay){
  const b = `begin="-${delay.toFixed(1)}s"`;
  return `<g class="pl-ion st07-o2" data-tip="O₂ — 액에 녹은 산소 (Cu를 산화시키는 산화제)"><circle cx="-8" r="10"/><circle cx="8" r="10"/><text y="5" text-anchor="middle">O₂</text><animateMotion dur="${dur}s" ${b} repeatCount="indefinite" path="${path}"/><animate attributeName="opacity" values="0;1;1;1;0" dur="${dur}s" ${b} repeatCount="indefinite"/></g>`;
}
// 제자리에서 흔들리는 작은 점 (물 분자)
function wob(x, y, r, cls, seed, amp){
  let k = seed * 7919 + 11; const g = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  let d = `M${x.toFixed(1)},${y.toFixed(1)}`;
  for (let i = 0; i < 4; i++) d += ` L${(x + (g() - 0.5) * 2 * amp).toFixed(1)},${(y + (g() - 0.5) * 2 * amp).toFixed(1)}`;
  return `<circle r="${r}" class="${cls}"><animateMotion dur="${(3 + g() * 3).toFixed(1)}s" begin="-${(g() * 4).toFixed(1)}s" repeatCount="indefinite" path="${d} Z"/></circle>`;
}

(window.EngrStripChapters = window.EngrStripChapters || []).push({
  no: '07', id: 'metal', part: 3, short: '금속 지키기', scale: '범프 표면 · nm',
  title: '금속 지키기 — 스트리퍼는 왜 Cu · Sn을 먹을까?',
  hook: '물 · 산소 · 알칼리가 만나면',
  one: '스트리퍼는 PR을 녹이려고 만든 액이지만, 알칼리 · 물 · 산소가 함께 있으면 Cu · Sn · Ni도 조금씩 녹입니다. 아민은 Cu를 붙잡아 녹이고, Sn은 강한 알칼리에 녹으며, 이어진 금속끼리는 한쪽이 더 빨리 녹을 수 있습니다. 베이스 다이 범프(Cu / Ni / Cu / SnAg)는 옆면에 Ni · SnAg와 함께 Cu 기둥 · 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu)도 드러나고, 코어 다이 범프(Ni / SnAg)는 Ni · SnAg만 드러납니다.',
  ana: '<b>바닷가 자전거</b> — 물 · 소금 · 산소가 있으면 녹이 슬고, 서로 다른 금속이 맞닿은 나사 근처가 더 빨리 녹습니다. 스트리퍼 속 범프도 물 · 알칼리 · 산소가 함께일 때, 다른 금속끼리 이어진 곳에서 더 조심해야 합니다. <i>(한계: 스트리퍼는 바닷물과 달리 물이 적고 억제제가 들어 있어 보통 아주 느리게(nm 수준) 진행됩니다. 또 액에 따라 어느 금속이 녹는 쪽이 될지 바뀝니다.)</i>',
  steps: [
    {id: 'cu', t: 'Cu — 아민 · 산소 · 물이 만나면', d: 'Cu는 액에 녹은 산소에 산화되고, 아민이 그 이온을 붙잡아(착이온) 액으로 데려갑니다. 물 · 산소가 많고 뜨거울수록 빠릅니다. 그림(베이스 다이)에서는 시드 · Cu 기둥 옆면 · 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu) 띠가 닿지만, 같은 몇 nm라도 수백 nm인 시드가 먼저 다칩니다.', viewN: VN_L},
    {id: 'sn', t: 'Sn — 알칼리에 녹는 금속', d: 'Sn은 산에도 강한 알칼리에도 녹는 양쪽성 금속입니다. TMAH 같은 강한 알칼리와 물이 많으면 SnAg 표면이 녹아 거칠어지거나 색이 변할 수 있습니다. 이 표면은 리플로우 때 젖음과 모양에 영향을 줍니다.', viewN: VN_R},
    {id: 'galv', t: '갈바닉 — 이어진 금속끼리', d: '범프 금속(베이스 다이 SnAg · 상부 Cu · Ni · Cu 기둥, 코어 다이 SnAg · Ni)과 시드는 모두 이어져 있어, 액에 닿으면 작은 전지가 되고 녹는 쪽(애노드)이 더 빨리 녹습니다. 물이 적은 스트리퍼는 전기가 잘 안 통해 공격이 맞닿은 선 바로 옆에 좁게 몰리고, 헹굼 순간에는 넓고 빨라집니다.', viewN: VN_R},
    {id: 'rinse', t: '헹굼 첫 순간 — 금속이 가장 약할 때', d: '스트리퍼가 묻은 채 물을 만나면 모든 성분이 함께 묽어집니다. 그런데 부식에 필요한 물이 늘어 전기가 잘 통하게 되고, 억제제는 묽어져 금속 겉 보호막이 약해집니다. 아민계는 물을 만나 OH⁻도 더 냅니다. 그래서 처음 몇 초~수십 초가 가장 약한 순간입니다.', viewN: VN_R},
    {id: 'die', t: '두 다이 — 베이스 · 코어', d: '베이스 다이(Cu / Ni / Cu / SnAg)는 Cu 기둥 옆면과, Ni · SnAg 사이 3 µm 상부 Cu 띠가 액에 닿습니다. 코어 다이(Ni / SnAg)는 범프 옆면에 Cu가 없어 Ni · SnAg만 닿습니다. 범프 사이 시드 Cu는 두 다이 모두 드러납니다. 띠의 홈은 스트립에서 보통 nm~수십 nm입니다.', viewN: VN_R}
  ],
  icon(K){
    const {R, C} = K;
    return R(4, 50, 56, 4, 'f-seed2') + R(16, 34, 26, 16, 'f-cu2') + R(16, 30, 26, 4, 'f-ni') + R(16, 26, 26, 4, 'f-cu2') + R(16, 10, 26, 16, 'f-sn2') +
      C(53, 32, 4.5, 'st07-icu') + C(53, 32, 8.5, 'st07-iam') + C(55, 13, 3.5, 'st07-isn');
  },
  draw(K){
    const {R, C, E, L, P, PG, T, TT, G, LB, tip, only, W, wrap, arrow, arrowP, ionPath} = K;
    let s = '';
    s += `<defs><clipPath id="${K.id('st07-zc')}"><circle cx="${ZC.x}" cy="${ZC.y}" r="${ZC.r - 2}"/></clipPath>` +
      `<pattern id="${K.id('st07-hat')}" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="rgba(248,113,113,.10)"/><line x1="0" y1="0" x2="0" y2="12" stroke="#f87171" stroke-width="3" stroke-opacity=".6"/></pattern>` +
      `<linearGradient id="${K.id('st07-cond')}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#1e1b4b"/><stop offset=".32" stop-color="#3730a3"/><stop offset=".62" stop-color="#0e7490"/><stop offset="1" stop-color="#67e8f9"/></linearGradient></defs>`;

    /* ================= 왼쪽: 범프 단면 (PR은 이미 걷혔다) ================= */
    const HL = {cu: 'Cu — 산소가 산화시키고, 아민이 붙잡아 데려간다', sn: 'Sn — 강한 알칼리 + 물에 녹는다 (양쪽성 금속)', galv: '이어진 금속 = 작은 전지 — 한쪽이 더 빨리 녹는다', rinse: '헹굼 첫 순간 — 물이 들어오고 억제제는 묽어진다', die: '두 다이 — 액에 닿는 금속이 다르다'};
    STEPS.forEach(k => { s += G(LB(T(56, 152, HL[k], 't-acc', 'start')), only(k)); });
    s += '<g data-v="cond"></g><g data-v="gas"></g>';
    s += R(LX0, LIQ, LX1 - LX0, SEED - LIQ, 'f-strip', tip('스트리퍼 — 예: DMSO + 아민(또는 TMAH) + 물 조금 + 부식 억제제, 보통 60~80 °C (→ 04장)'));
    // 헹굼: 헹굼 물이 섞여 들어오는 색 (6초 되풀이)
    s += G(`<rect x="${LX0}" y="${LIQ}" width="${LX1 - LX0}" height="${SEED - LIQ}" class="st07-rin"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.1;.45;.92;1" dur="6s" repeatCount="indefinite"/></rect>`, only('rinse'));
    s += '<g data-v="water"></g>';
    // 바닥: Si · 보호막 · 패드 · Ti · 시드 Cu
    s += R(LX0, 979, LX1 - LX0, 61, 'f-si', tip('칩 (실리콘)'));
    s += R(LX0, 967, LX1 - LX0, 12, 'f-pas', tip('보호막(패시베이션) — 스트립 동안은 시드가 덮고 있어 액에 닿지 않는다'));
    s += R(BX0 + 20, 967, BX1 - BX0 - 40, 12, 'f-al', tip('패드 — 범프 아래 보호막이 열린 자리'));
    s += R(LX0, 960, LX1 - LX0, 7, 'f-ti', tip('Ti — 시드 아래 접착 · 방벽층 (예시 100 nm — 그림은 크게 과장)'));
    s += R(LX0, SEED, LX1 - LX0, SEEDH, 'f-seed2', tip('시드 Cu (예시 300 nm) — 실제 수백 nm, 그림은 과장.\n스트립에서 가장 먼저 다치는 Cu: 같은 몇 nm도 시드에는 몇 %'));
    s += '<g data-v="seedloss"></g>';
    s += T(56, 1074, '시드: Ti 100 nm 위 Cu 300 nm (예시) — 그림의 시드 두께는 크게 과장', 't-dim', 'start');
    s += '<g data-v="dlab"></g>';                                    // 그림 범프 이름 · 두께 (맨 아래 줄)
    // 범프: 층 · SnAg(윗면 거칠기) · 이름표 · 먹히는 표면 점선 — 위젯 '범프'(베이스 · 코어)에 따라 render 가 그린다
    s += '<g data-v="bump"></g>';
    s += '<g data-v="inh"></g><g data-v="o2"></g><g data-v="oh"></g><g data-v="cuion"></g><g data-v="snion"></g>';

    // galv: 설명 상자 (금속 속 전자 · 맞닿은 선 · 애노드 / 캐소드 이름표는 다이에 따라 render 가 그린다)
    let gv = R(50, 262, 700, 106, 'st07-cap', {rx: 10}) + LB(T(68, 292, '금속 속에서는 전자(e⁻)가, 액 속에서는 이온이 전류를 나른다', 't-sub', 'start') +
      T(68, 322, '애노드(알칼리 속): Sn + 3OH⁻ → HSnO₂⁻ + H₂O + 2e⁻', 't-dim', 'start') + T(68, 350, '캐소드: O₂ + 2H₂O + 4e⁻ → 4OH⁻', 't-dim', 'start'));
    s += G(gv, only('galv')) + '<g data-v="galvb"></g>';
    // die: 설명 상자 (render 가 다이에 맞게 쓴다)
    s += G(R(50, 262, 700, 78, 'st07-cap', {rx: 10}) + '<g data-v="dcap"></g>', only('die'));

    // rinse: 위에서 쏟아지는 헹굼 물 + 설명 상자 (위젯이 첫 줄을 쓴다)
    let rn = '';
    [[80, 0], [150, 1.3], [215, 0.6], [300, 2.0], [350, 0.3], [430, 1.6], [470, 0.9], [560, 2.3], [640, 1.1], [710, 0.2], [600, 1.8], [120, 2.6]].forEach(([x, dl], i) => {
      rn += K.mover(x, 206, x + (i % 2 ? 6 : -6), x > 530 ? 560 : i % 3 === 0 ? 900 : 620, 7, 'st07-drop', 2.4, dl);
    });
    s += G(rn, W(only('rinse'), tip('헹굼 물 — 스트리퍼가 묻은 표면에 물이 들어온다')));
    s += G(R(50, 262, 700, 78, 'st07-cap', {rx: 10}) + '<g data-v="rcap"></g>', only('rinse'));
    s += '<g data-v="zoom"></g><g data-v="snlab"></g>';

    /* ================= 오른쪽 패널 (단계별) ================= */
    s += R(RP.x, RP.y, RP.w, RP.h, 'pl-panel', {rx: 14});

    // ── cu: 산화 → 붙잡기 → 액으로 ──
    let cp = T(812, 160, 'Cu가 먹히는 길 — 산화 → 붙잡기 → 액으로', 't-acc', 'start');
    const BOX = [[812, 'Cu', '금속 표면'], [1093, 'Cu₂O · CuO', '얇은 산화물'], [1374, '[Cu(아민)ₙ]²⁺', '착이온 → 액으로']];
    BOX.forEach(([x, a, b], i) => {
      cp += R(x, 190, 178, 104, 'st07-rbox', W({rx: 12}, tip(['Cu 금속 — 시드 윗면 (두 다이) · Cu 기둥 옆면 · 상부 Cu 띠 (베이스 다이)', 'Cu₂O · CuO — 산소가 Cu 겉을 산화시킨 아주 얇은 막', '[Cu(아민)ₙ]²⁺ — 아민이 Cu 이온을 둘러싸 붙잡은 착이온. 액으로 빠져나간다'][i])));
      cp += T(x + 89, 238, a, 'st07-bt') + T(x + 89, 272, b, 't-dim');
    });
    cp += arrow(994, 252, 1087, 252, 's-arrr') + T(1040, 236, '+ O₂', 'st07-o2t');
    cp += arrow(1275, 252, 1368, 252, 's-arr3') + T(1321, 236, '+ 아민', 'st07-amt');
    cp += arrowP('M1463,298 C1463,372 901,372 901,300', 's-arr3') + T(1182, 404, '녹아 쌓인 [Cu(아민)ₙ]²⁺도 Cu를 다시 녹인다 — 지친 액일수록 빨라질 수 있다', 't-dim');
    cp += T(812, 452, '빨라지게 하는 것', 'pl-hdg2', 'start') + T(812, 550, '느리게 하는 것', 'pl-hdg3', 'start');
    cp += T(812, 648, '밝은 칩 = 지금 위젯 조건 (액에 녹은 Cu는 위젯에 넣지 않음 → 06장)', 't-dim', 'start');
    cp += T(812, 702, '같은 몇 nm라도 시드가 먼저 다친다', 'pl-hdg', 'start');
    s += G(cp + '<g data-v="cupan"></g>', only('cu'));

    // ── sn: pH – 녹는 정도 (U자) ──
    let sp = T(812, 160, 'Sn — 산에도, 강한 알칼리에도 녹는다 (모양만 · 개념)', 't-acc', 'start') + '<g data-v="snnow"></g>';
    sp += R(snx(0), SY1 + 60, snx(1) - snx(0), SY0 - SY1 - 60, 'st07-band1', tip('산성 도금액 (SnAg 도금, pH 1 아래) — Sn²⁺로 녹아 있다'));
    sp += R(snx(11), SY1 + 92, snx(14) - snx(11), SY0 - SY1 - 92, 'st07-band2', tip('헹굼 때 물에 묽어진 알칼리 (수용액) — pH로 읽을 수 있는 경우'));
    sp += L(SX0, SY0, SX1 + 10, SY0, 's-axis') + L(SX0, SY0, SX0, SY1, 's-axis');
    for (let ph = 0; ph <= 14; ph += 2) sp += L(snx(ph), SY0, snx(ph), SY0 + 8, 's-axis') + T(snx(ph), SY0 + 30, String(ph), 't-dim');
    sp += T(SX1 + 16, SY0 + 6, 'pH', 't-sub', 'start') + T(SX0 + 12, 226, '↑ 녹는 정도 (로그 눈금 · 모양만)', 't-dim', 'start');
    let cv = '';
    for (let ph = 0; ph <= 14.001; ph += 0.1) cv += (cv ? ' L' : 'M') + snx(ph).toFixed(1) + ',' + sny(snL(ph)).toFixed(1);
    sp += P(cv, 's-curve', tip('Sn(산화물)이 녹는 정도 — pH 약 8.5에서 가장 낮고, 산 쪽 · 강알칼리 쪽으로 갈수록 많이 녹는다 (모양만)'));
    sp += L(snx(12), SY1 + 92, snx(12), SY0, 'st07-ph12', tip('pH 약 12 — 이보다 세면 억제제로도 다 막기 어렵다는 보고'));
    sp += L(snx(8.5), sny(snL(8.5)) - 8, snx(8.5), 552, 's-dash') + C(snx(8.5), sny(snL(8.5)), 7, 'k-acc2');
    sp += LB(T(snx(8.5), 540, '가장 덜 녹음 · pH 약 8.5', 't-dim'));
    sp += LB(T(960, 262, '← 산성 도금액 (SnAg 도금)', 't-dim', 'start') + T(986, 288, 'pH 1 아래 — Sn²⁺로 녹아 있다', 't-dim', 'start'));
    sp += LB(T(1030, 386, 'Sn²⁺로 녹음 (산)', 't-sub', 'start'));
    sp += LB(T(SX1, 262, '헹굼 때 물에 묽어진 알칼리', 't-dim', 'end') + T(SX1, 288, '(수용액 · 대략 pH 11~14)', 't-dim', 'end'));
    sp += LB(T(SX1, 316, '강알칼리: HSnO₂⁻ · SnO₃²⁻로 녹음 ↓', 't-sub', 'end'));
    sp += LB(T(812, 812, '점선(pH 12): 이보다 세면 억제제로도 다 막기 어렵다는 보고가 있습니다.', 't-dim', 'start'));
    sp += G(LB(T(812, 842, '물이 적은 스트리퍼 속 알칼리 세기는 pH로 읽지 않습니다 (→ 04장 물).', 't-dim', 'start')), {'data-go': 'chem.water', class: 'st07-link', 'data-tip': '04장 「물 — 알칼리에 따라 돕기도 해치기도」로'});
    sp += LB(T(812, 870, 'Sn이 빠지면 겉에 Ag(Ag₃Sn)가 상대적으로 남아 색 · 거칠기가 달라질 수 있다', 't-dim', 'start'));
    s += G(sp, only('sn'));

    // ── galv: 액의 전도도 막대 + 맞닿은 선 옆 전류 몰림 ──
    let gp = T(812, 160, '액의 전도도(전기가 통하는 정도)가 공격 모양을 바꾼다', 't-acc', 'start');
    gp += R(1100, 230, 230, 22, '', {fill: K.url('st07-hat')}) + T(1215, 222, '위험 창 — 물이 섞이기 시작', 't-warn');
    gp += R(840, 252, 680, 36, 'st07-cbar', {fill: K.url('st07-cond'), rx: 6, 'data-tip': '액의 전도도 (전기가 통하는 정도) — 물이 적은 스트리퍼는 낮고, 헹굼 물이 섞이면 높아진다'});
    gp += '<g data-v="gmark"></g>';
    gp += T(840, 374, '← 스트리퍼 (물 적음) — 낮음', 't-dim', 'start') + T(1520, 374, '헹굼 물이 섞임 — 높음 →', 't-dim', 'end');
    gp += T(840, 410, '물이 거의 없어도, 맞닿은 선 옆 µm 거리에서는 전류가 흐른다', 't-sub', 'start');
    const mini = (x, hi) => {
      const xj = x + 170, ym = 640;
      let g = R(x, 430, 340, 340, 'pl-box', {rx: 12});
      g += T(x + 16, 462, hi ? '② 높음 — 헹굼 순간' : '① 낮음 — 스트리퍼 속', hi ? 'pl-hdg' : 'pl-hdg3', 'start');
      g += R(x + 10, 476, 320, ym - 476, hi ? 'st07-rinbox' : 'f-strip');
      g += R(x + 10, ym, 160, 56, 'f-sn2', tip('녹는 쪽 금속 (애노드) — 예: SnAg')) + R(xj, ym, 160, 56, 'f-cu2', tip('받는 쪽 금속 (캐소드) — 예: Cu. 여기서 산소가 전자를 받고, 이 금속은 덜 녹는다'));
      if (!hi) g += E(xj - 8, ym - 4, 34, 16, 'st07-hotspot', tip('전류가 몰리는 곳 — 맞닿은 선 바로 옆'));
      (hi ? [22, 48, 78, 110, 146] : [6, 13, 21, 31]).forEach(d => { g += P(`M${xj - d},${ym - 2} Q${xj},${ym - 2 - d * (hi ? 0.95 : 1.5)} ${xj + d},${ym - 2}`, 'st07-cur'); });
      if (hi) g += P(`M${x + 16},${ym} Q${xj - 80},${ym + 24} ${xj - 1},${ym + 8} L${xj - 1},${ym} Z`, 'st07-groove', tip('넓고 얕게 먹힌 곳 (그림은 과장)'));
      else g += PG([[xj - 22, ym], [xj - 1, ym], [xj - 4, ym + 34]], 'st07-groove', tip('맞닿은 선 옆 좁은 V자 홈 (그림은 과장)'));
      g += L(xj, ym - 8, xj, ym + 56, 'st07-junc', tip('두 금속이 맞닿은 선'));
      g += T(x + 90, ym + 36, '녹는 쪽', 'st07-mt') + T(xj + 80, ym + 36, '받는 쪽', 'st07-mt');
      g += TT(x + 16, 728, hi ? ['넓게 퍼진다 →', '넓고 빠른 공격'] : ['선 옆 몇 µm에 좁게 몰린다', '→ 좁은 띠 · V자 홈'], 't-dim', 'start', 25);
      return g;
    };
    gp += mini(820, false) + mini(1210, true);
    gp += `<a href="#go-etch-05" class="pl-tablink" data-tip="시드 식각 탭 05장 「갈바닉」으로">${T(812, 818, '원리 · 면적비(작은 녹는 쪽 + 넓은 받는 쪽) → 시드 식각 05장', 't-acc', 'start')}</a>`;
    gp += T(812, 852, '물에서는 보통 Sn · Ni가 녹는 쪽 — 착화제가 Cu를 붙잡으면 순서가 바뀔 수 있다', 't-dim', 'start');
    s += G(gp, only('galv'));

    // ── rinse: 헹굼 첫 1분 그래프 ──
    let rp = T(812, 160, '헹굼 첫 1분 — 금속이 먹히는 세기 (개념 · 모양만)', 't-acc', 'start');
    rp += L(RX0, RY0, RX1 + 10, RY0, 's-axis') + L(RX0, RY0, RX0, RY1 - 10, 's-axis');
    for (let t = 0; t <= 60; t += 10) rp += L(rgx(t), RY0, rgx(t), RY0 + 8, 's-axis') + T(rgx(t), RY0 + 30, String(t), 't-dim');
    rp += T(RX1, RY0 + 58, '시간 (초) →', 't-dim', 'end') + T(RX0 - 12, RY1 + 6, '세기', 't-dim', 'end') + T(RX0 - 12, RY1 + 30, '(상대)', 't-dim', 'end');
    rp += '<g data-v="rcurve"></g>';
    const LEG = [[812, 714, 'st07-cdi', '바로 물'], [1060, 714, 'st07-csol', '중간 용제 → 물'], [1320, 714, null, '위험 창'], [812, 744, 'st07-cinh', '억제제 농도'], [1060, 744, 'st07-coh', 'OH⁻ (아민계)'], [1320, 744, 'st07-cw', '물 · 전도도']];
    LEG.forEach(([x, y, c, t]) => {
      rp += (c ? L(x, y - 7, x + 40, y - 7, c) : R(x, y - 18, 40, 20, '', {fill: K.url('st07-hat')})) + T(x + 50, y, t, 't-dim', 'start');
    });
    rp += TT(812, 790, wrap('아민계: 물과 만나 OH⁻가 늘어남 · TMAH계: OH⁻는 늘지 않지만 물이 들어와 부식이 쉬워짐 — 둘 다 억제제는 묽어진다', 38), 't-dim', 'start', 26);
    rp += T(812, 864, '점선은 성분 농도 (바로 물일 때) · 실제 헹굼 순서는 약품 공급사가 검증한 순서', 't-dim', 'start');
    s += G(rp, only('rinse'));

    // ── die: 두 다이 범프를 같은 축척으로 (1 µm = 8 px, 시드 · Ti만 과장) — 서로 다른 웨이퍼라 따로 그린다 ──
    let dp = T(812, 160, '두 다이 — PR이 걷히면 액에 닿는 금속', 't-acc', 'start');
    dp += T(812, 190, '범프는 같은 축척 1 µm = 8 px (시드 · Ti만 과장) · 두께는 예시', 't-dim', 'start');
    dp += T(812, 216, '노란 점선 = 액에 닿는 Cu · 짧은 흰 선 = 두 금속이 맞닿은 선', 't-dim', 'start');
    const DY = 576, dmk = (x0, x1, lays, tp) => {                    // 웨이퍼 한 조각: 액 · 시드 · Ti · 보호막 + 범프 층 + 이름표
      let g = R(x0, 292, x1 - x0, DY - 292, 'f-strip') + R(x0, DY, x1 - x0, 8, 'f-seed2', tip('시드 Cu (예시 300 nm — 그림은 과장) — 두 다이 모두 범프 사이에 드러난다')) +
        R(x0, DY + 8, x1 - x0, 5, 'f-ti') + R(x0, DY + 13, x1 - x0, 12, 'f-pas');
      let y = DY, lb = '';
      lays.forEach(([h, c, nm, cls, t]) => { g += c === 'f-sn2' ? P(`M${tp},${y} L${tp},${y - h + 8} Q${tp},${y - h} ${tp + 8},${y - h} L${tp + 192},${y - h} Q${tp + 200},${y - h} ${tp + 200},${y - h + 8} L${tp + 200},${y} Z`, c, tip(t)) : R(tp, y - h, 200, h, c, tip(t));
        lb += T(tp + 100, y - h / 2 + (cls === 'st07-in' ? 7 : 6.5), nm, cls); y -= h; });
      return g + LB(lb);
    };
    dp += dmk(812, 1250, [[96, 'f-cu2', 'Cu 기둥', 'st07-in', 'Cu 기둥 12 µm — 높이 · 전기'], [24, 'f-ni', 'Ni', 'st07-in2', 'Ni 3 µm — Cu 기둥과 솔더 사이 방벽'],
      [24, 'f-cu2', '상부 Cu', 'st07-in2', '상부 Cu 3 µm — 솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로\n스트립 때는 Ni와 SnAg 사이 얇은 띠로 액에 닿는다'], [96, 'f-sn2', 'SnAg', 'st07-in', 'SnAg 12 µm — 녹아서 붙는 솔더']], 1010);
    dp += dmk(1266, 1552, [[40, 'f-ni', 'Ni (몸통)', 'st07-in', 'Ni 5 µm — 몸통 겸 방벽 (Cu 기둥 없음)'], [96, 'f-sn2', 'SnAg', 'st07-in', 'SnAg 12 µm — 녹아서 붙는 솔더']], 1309);
    dp += LB(T(1110, 252, '베이스 다이', 't-lbl') + T(1110, 278, 'Cu / Ni / Cu / SnAg · 30 µm', 't-dim') + T(1409, 252, '코어 다이', 't-lbl') + T(1409, 278, 'Ni / SnAg · 17 µm', 't-dim'));
    // 액에 닿는 Cu (점선): 베이스 = 시드 · Cu 기둥 옆 · 상부 Cu 띠 옆, 코어 = 시드뿐
    dp += G(P(`M812,${DY - 5} L1005,${DY - 5} L1005,480 M1005,456 L1005,432 M1215,432 L1215,456 M1215,480 L1215,${DY - 5} L1250,${DY - 5}`, 'st07-hot'), tip('베이스 다이 — 액에 닿는 Cu: 시드 · Cu 기둥 옆면 · 상부 Cu 띠 옆면'));
    dp += G(P(`M1266,${DY - 5} L1304,${DY - 5} M1514,${DY - 5} L1552,${DY - 5}`, 'st07-hot'), tip('코어 다이 — 액에 닿는 Cu: 범프 사이 시드뿐 (범프에 Cu가 없다)'));
    [[1010, 1210, [480, 456, 432]], [1309, 1509, [DY, 536]]].forEach(([a, b, ys]) => ys.forEach(y => { dp += L(a - 16, y, a, y, 'st07-junc') + L(b, y, b + 16, y, 'st07-junc'); }));
    dp += G(PG([[1010, 434], [1019, 444], [1010, 454]], 'st07-groove') + PG([[1210, 434], [1201, 444], [1210, 454]], 'st07-groove'), tip('상부 Cu 띠의 옆 홈(노치) — 그림은 크게 과장 (스트립에서는 보통 nm~수십 nm)'));
    dp += L(988, 444, 1011, 444, 's-lead') + C(1013, 444, 3, 'k-lead') + '<g data-v="dcall"></g>';
    // 비교 표
    const DR = [['옆면 금속', 'Cu 기둥 · Ni · 상부 Cu · SnAg', 'Ni · SnAg (Cu 없음)'], ['맞닿은 선', 'Cu/Ni · Ni/Cu · Cu/SnAg', '시드 Cu/Ni · Ni/SnAg'],
      ['먹히는 Cu', '시드 · Cu 기둥 옆 · 상부 Cu 띠', '범프 사이 시드뿐'], ['볼 곳', '상부 Cu 띠 홈 · 시드 · SnAg', 'SnAg 표면 · Ni 발 옆 시드']];
    dp += T(960, 636, '베이스 다이', 'pl-hdg', 'start') + T(1266, 636, '코어 다이', 'pl-hdg3', 'start');
    DR.forEach(([h, b, c], i) => { const y = 670 + i * 32; dp += L(812, y - 24, 1552, y - 24, 's-faint') + T(812, y, h, 't-sub', 'start') + T(960, y, b, 't-dim', 'start') + T(1266, y, c, 't-dim', 'start'); });
    dp += '<g data-v="dpan"></g>';
    dp += `<a href="#go-etch-04" class="pl-tablink" data-tip="시드 식각 탭 04장 「언더컷」으로 — 베이스 다이는 Cu 식각액이 상부 Cu 띠도 옆으로 팔 수 있다">${T(812, 866, '띠의 홈은 시드 식각에서 더 깊어질 수 있다 → 시드 식각 04장', 't-acc', 'start')}</a>`;
    s += G(dp, only('die'));

    /* ================= 결과 상자 (모든 단계) ================= */
    s += R(RB.x, RB.y, RB.w, RB.h, 'pl-box', {rx: 12}) + T(812, 928, '결과 — 금속 손실 (개념 모델)', 't-acc', 'start');
    s += T(812, 970, 'Cu (시드 위)', 't-sub', 'start') + T(812, 1016, 'Sn (SnAg 윗면)', 't-sub', 'start');
    s += '<g data-v="res"></g>';
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 금속 손실 (개념 모델)</div>
      ${K.ctl('T', '온도 (°C)', 40, 90, 1, DEF.T)}${K.ctl('w', '물 함량 (%)', 0, 20, 0.5, DEF.w)}${K.ctl('t', '스트립 시간 (분)', 5, 60, 1, DEF.t)}
      ${K.seg('base', [['amine', '아민계'], ['tmah', 'TMAH계']], DEF.base, '알칼리')}
      ${K.seg('o2', [['air', '공기 접촉'], ['n2', '질소 덮기']], DEF.o2, '산소')}
      ${K.seg('inh', [['on', '억제제 있음'], ['off', '없음']], DEF.inh, '억제제')}
      ${K.seg('rinse', [['sol', '중간 용제 → 물'], ['di', '바로 물 (아민계 가정)']], DEF.rinse, '헹굼 순서')}
      ${K.seg('die', [['base', '베이스 다이 (Cu/Ni/Cu/SnAg)'], ['core', '코어 다이 (Ni/SnAg)']], DEF.die, '범프')}
      ${K.kpis([['Cu 손실', 'k-cu', 'nm (스트립 + 헹굼)'], ['시드 남은 비율', 'k-seed', '시드 Cu 300 nm 예시'], ['Sn 손실', 'k-sn', 'nm (SnAg 윗면)'], ['가장 큰 몫', 'k-big', 'Cu + Sn 손실 중']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('Ea 60 kJ/mol, 기준 속도(Cu 2 · Sn 3 nm/분, 70 °C), 물 효과 w/(w+2), 산소(질소 덮기 ×0.3) · 알칼리(Cu: 아민 1 · TMAH 0.5, Sn: 아민 0.3 · TMAH 1) · 억제(Cu ×0.1 · Sn ×0.4) · 헹굼 배수는 모두 경향을 보이려고 고른 가정값입니다. 헹굼 순간 몫은 Cu 3 · Sn 2 nm(TMAH계는 Sn ×2) × (1 + 물 효과)에 헹굼 배수(중간 용제 → 물 ×0.2 · 바로 물 ×1)를 곱합니다 — 바로 물 ×5는 아민계를 가정한 값으로, 물로 바로 헹구게 만든 약품에서는 이 배수가 작습니다. 스트립 시간은 금속이 액에 닿아 있는 시간으로 셉니다 — 실제로 SnAg 윗면은 처음부터 닿지만, 시드와 범프 옆면(베이스 다이는 Cu 기둥 · 상부 Cu 띠)의 Cu는 PR이 걷힌 뒤(오버 스트립)부터 닿습니다. 범프(베이스 · 코어) 선택은 어느 면이 액에 닿는지만 바꾸고 손실 속도는 같게 둡니다 — 맞닿은 선 옆 갈바닉 몫은 넣지 않았습니다. 기본 13분은 그림 기준 PR 35 µm · 70 °C · 순환에서 평평한 곳이 다 걷히는 약 10분 + 여유 30 %(<a data-go="residue.foot">08장</a> 예)라, Cu 몫은 넉넉하게(크게) 센 값입니다. 녹은 Cu가 쌓인 지친 액이 Cu 손실을 키우는 효과는 넣지 않았습니다(한 걸음 더). 실제 손실은 액 · 금속 표면 · 장비마다 달라 자릿수도 다를 수 있으니, 블랭킷 Cu · Sn 시편의 두께 변화(면저항 · XRF)로 직접 재세요.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, PG, T, TT, G, LB, tip, only, W, wrap, ionPath, rng} = K;
    const st = Object.assign({}, DEF);
    let touched = false;
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const kpiBox = id => { const o = ctx.card.querySelector(`[data-o="${id}"]`); return o && o.parentNode; };
    const setCls = (id, c) => { const b = kpiBox(id); if (!b) return; ['ok', 'warn', 'ng'].forEach(k => b.classList.toggle(k, k === c)); };
    const OUT = {T: v => `${v.toFixed(0)} °C`, w: v => `${v.toFixed(1)} %`, t: v => `${v.toFixed(0)}분`};
    const set$ = (sel, html) => { const e = ctx.$(sel); if (e) e.innerHTML = html; };

    function render(){
      const m = calc(st), am = st.base === 'amine';
      const nCu = Math.max(1, Math.min(8, Math.round(m.cu / 5))), nSn = Math.max(1, Math.min(8, Math.round(m.sn / 5)));
      const g = rng(7);
      const gm = geo(st.die), base = st.die === 'base', YS = gm.st, YB = gm.sb, pc = pc2(Math.min(m.cu, UCH) / UCH * 100);

      // ── 범프 (다이별): 층 · SnAg · 이름표 · 먹히는 표면 점선 ──
      let bm = '';
      gm.L.forEach(([y0, y1, c, , , tp]) => { bm += R(BX0, y0, BX1 - BX0, y1 - y0, c, tip(tp)); });
      // SnAg: 윗면 거칠기 진폭 = min(18 px, Sn 손실 × 1 px) — 크게 과장
      const A = Math.min(18, m.sn), gs = rng(19);
      let d = `M${BX0},${YB} L${BX0},${(YS + A * 0.5).toFixed(1)}`;
      for (let i = 0; i <= 20; i++) d += ` L${(BX0 + i * (BX1 - BX0) / 20).toFixed(1)},${(YS + A * (0.2 + 0.8 * gs())).toFixed(1)}`;
      d += ` L${BX1},${YB} Z`;
      bm += P(d, 'f-sn2', tip(`SnAg — 녹아서 붙는 솔더 (예시 12 µm, 리플로우 전 원기둥)\n윗면 손실 ${f1(m.sn)} nm — 그림의 거칠기는 크게 과장`));
      bm += LB(gm.L.map(([y0, y1, , nm, cls]) => T(BCX, (y0 + y1) / 2 + (cls === 'st07-in' ? 7 : 6.5), nm, cls)).join('') + T(BCX, YS + 70, 'SnAg 솔더', 'st07-in'));
      // 액에 닿는 Cu 겉 (o: 범프 · 시드에서 띄울 거리 — 점선 6 · 억제제 막 1.5). 베이스: 시드 + Cu 기둥 옆 + 상부 Cu 띠 옆, 코어: 시드뿐
      const cuEdge = o => {
        const y = SEED - o, a = BX0 - o, b = BX1 + o;
        if (!base) return `M${LX0},${y} L${a},${y} M${b},${y} L${LX1},${y}`;
        const [p0, u] = gm.cu;
        return `M${LX0},${y} L${a},${y} L${a},${p0[0]} M${b},${p0[0]} L${b},${y} L${LX1},${y} M${a},${u[1]} L${a},${u[0]} M${b},${u[0]} L${b},${u[1]}`;
      };
      bm += G(P(cuEdge(6), 'st07-hot'), W(only('cu die'), tip(base ? 'Cu가 드러난 곳 — 시드 윗면 · Cu 기둥 옆면 · 상부 Cu 띠 옆면' : 'Cu가 드러난 곳 — 범프 사이 시드 윗면뿐 (코어 다이 범프에는 Cu가 없다)')));
      bm += G(R(BX0 - 8, YS - 9, BX1 - BX0 + 16, YB - YS + 9, 'st07-hot', {rx: 4}), W(only('sn'), tip('SnAg가 드러난 곳 — 윗면과 옆면')));
      bm += G(L(BX0 - 14, YS, BX1 + 14, YS, 's-dash'), W(only('sn'), tip('처음 윗면 — 깎인 깊이 · 거칠기는 크게 과장 (실제 수 nm~수십 nm)')));
      // die: 상부 Cu 띠의 옆 홈 (베이스) — Cu가 먹혀 바로 아래 Ni보다 들어간 곳
      if (base){
        const [u0, u1] = gm.cu[1], ntip = tip(`상부 Cu 띠의 옆 홈(노치) — Cu가 먹혀 바로 아래 Ni(거의 안 먹힘)보다 들어간 곳\n깊이 ≈ Cu 손실 ${f1(m.cu)} nm = 띠 높이 3 µm의 ${pc} % — 그림은 크게 과장`);
        bm += G(PG([[BX0, u0 + 2], [BX0 + 10, (u0 + u1) / 2], [BX0, u1 - 2]], 'st07-groove') + PG([[BX1, u0 + 2], [BX1 - 10, (u0 + u1) / 2], [BX1, u1 - 2]], 'st07-groove'), W(only('die'), ntip));
      }
      // 범프 옆 이름표: 베이스 = 상부 Cu 띠 (galv · die), 코어 = Ni 몸통 (die)
      bm += base
        ? G(LB(T(522, (gm.cu[1][0] + gm.cu[1][1]) / 2 + 7, '← 상부 Cu 띠 (3 µm)', 'st07-uct', 'start') + T(546, gm.cu[1][1] + 18, '맞닿은 선 둘 사이', 't-dim', 'start', only('galv')) +
            T(546, gm.cu[1][1] + 18, `홈 깊이 ≈ ${f1(m.cu)} nm`, 't-dim', 'start', only('die'))), W(only('galv die'), tip('상부 Cu — Ni 위에 얇게 한 번 더 올린 Cu (예시 3 µm)\n위 SnAg · 아래 Ni와 맞닿은 선 사이가 3 µm뿐이다. 그림처럼 Sn이 녹는 쪽이면 띠 바로 위 SnAg가 파이고, 아민이 Cu를 붙잡아 Cu가 녹는 쪽이 되면(예: 부동태 Ni와의 짝) 두 선 옆 공격이 띠 전체에 겹칠 수 있다')))
        : G(LB(T(522, 892, '← Ni 몸통 (5 µm)', 'st07-uct', 'start') + T(546, 918, '옆면에 Cu가 없다', 't-dim', 'start')), only('die'));
      set$('[data-v="bump"]', bm);
      set$('[data-v="dlab"]', T(56, 1102, base ? '그림: 베이스 다이 범프 — Cu 기둥 12 · Ni 3 · 상부 Cu 3 · SnAg 12 µm (예시)' : '그림: 코어 다이 범프 — Ni 5 · SnAg 12 µm, Cu 기둥 없음 (예시)', 't-dim', 'start'));

      // ── galv: 금속 속 전자 · 맞닿은 선 · 홈 · 녹는 쪽(애노드) / 받는 쪽(캐소드) ──
      let gv = '';
      // 전자 길: 층 이름표(가운데 x 325~425)를 피해 범프 가장자리 쪽(x 292 · 458)으로 내려간다. 코어는 Ni 이름표 아래 시드로
      const e0 = YS + 60, e1 = base ? 905 : 950, eTip = tip(`e⁻ — 녹는 쪽(애노드, 예: SnAg)이 내놓은 전자가 금속 속을 지나 받는 쪽(캐소드, 예: ${base ? 'Cu 기둥 · 시드' : 'Ni · 시드 Cu'})으로 간다` + (base ? '' : '\nNi가 받는 쪽일지는 산화막 · 액에 따라 다르다'));
      [[`M292,${e0} L292,${e1} L262,${e1}`, 0], [`M458,${e0} L458,${e1} L488,${e1}`, 1.1], [`M292,${e0 - 20} L292,950 L110,950`, 0.5], [`M458,${e0 - 10} L458,950 L640,950`, 1.7], [`M300,${e0 + 20} L300,${e1} L470,${e1}`, 2.4]].forEach(([p, dl]) => {
        gv += ionPath(p, 'e', 3.2, dl, eTip);
      });
      gm.junc.forEach(y => { gv += L(BX0 - 18, y, BX0, y, 'st07-junc') + L(BX1, y, BX1 + 18, y, 'st07-junc'); });
      const grTip = tip('맞닿은 선 옆에 좁게 파인 홈 — 스트립에서는 보통 nm~수십 nm (그림은 크게 과장)');
      gv += PG([[BX0, YB - 16], [BX0 + 11, YB - 2], [BX0, YB]], 'st07-groove', grTip) + PG([[BX1, YB - 16], [BX1 - 11, YB - 2], [BX1, YB]], 'st07-groove', grTip);
      gv += LB(P(`M${BX1 - 4},${YS + 8} L548,${YS - 28}`, 's-lead') + C(BX1 - 4, YS + 8, 3.5, 'k-lead') + T(520, YS - 58, '녹는 쪽 = 애노드', 'st07-anod', 'start') + T(556, YS - 30, '산화 · 예: SnAg', 't-dim', 'start'));
      const cy = base ? 846 : 812, cq = base ? 880 : 915;
      gv += LB(P(`M${BX1 + 4},${cq} L514,${cy + 14}`, 's-lead') + C(BX1 + 4, cq, 3.5, 'k-lead') + T(518, cy, '받는 쪽 = 캐소드', 'st07-cath', 'start') +
        T(518, cy + 28, base ? '환원 · 예: Cu (덜 녹음)' : '환원 · 예: Ni · 시드 Cu', 't-dim', 'start') +
        (base ? '' : T(518, cy + 54, '(Ni는 알칼리에서 부동태)', 't-dim', 'start')) + T(518, cy + (base ? 54 : 80), 'O₂가 전자를 받는다', 't-dim', 'start'));
      set$('[data-v="galvb"]', G(gv, only('galv')));

      // ── die: 왼쪽 설명 상자 · 오른쪽 패널의 숫자 ──
      set$('[data-v="dcap"]', LB(T(68, 292, base ? '베이스 다이: 옆면에 Cu 기둥 · Ni · 상부 Cu · SnAg' : '코어 다이: 옆면에 Ni · SnAg뿐 — 범프에 Cu가 없다', 't-sub', 'start') +
        T(68, 322, base ? `점선 = 액에 닿는 Cu · 상부 Cu 띠 홈 ≈ ${f1(m.cu)} nm (그림은 과장)` : '점선 = 액에 닿는 Cu — 범프 사이 시드뿐', 't-dim', 'start')));
      set$('[data-v="dcall"]', LB(T(984, 420, '상부 Cu 띠 3 µm', 't-sub', 'end') + T(984, 452, `홈 ≈ ${f1(m.cu)} nm`, 't-warn', 'end') + T(984, 480, `띠 높이의 ${pc} %`, 't-dim', 'end')));
      set$('[data-v="dpan"]', LB(T(812, 806, `지금 조건 Cu 손실 ${f1(m.cu)} nm — 베이스: 시드 · 기둥 · 띠가 같이 얇아짐 · 코어: 시드만`, 't-dim', 'start') +
        T(812, 834, `Sn 손실 ${f1(m.sn)} nm — 모델은 두 다이 같게 (같은 SnAg 12 µm · 갈바닉 몫은 뺌)`, 't-dim', 'start')));

      // 조건 줄 · 기체 띠
      set$('[data-v="cond"]', LB(T(56, 184, `지금: ${st.T} °C · 물 ${st.w} % · ${st.t}분 · ${am ? '아민계' : 'TMAH계'} · ${st.o2 === 'air' ? '공기' : '질소 덮기'} · 억제제 ${st.inh === 'on' ? '있음' : '없음'}`, 't-dim', 'start')));
      set$('[data-v="gas"]', st.o2 === 'air'
        ? G(R(LX0, 205, LX1 - LX0, 35, 'st07-air') + T(LX1 - 12, 229, '공기 — 산소가 액에 녹아 든다', 't-dim', 'end'), tip('공기에 열린 액 — 산소가 계속 녹아 든다'))
        : G(R(LX0, 205, LX1 - LX0, 35, 'st07-n2') + T(LX1 - 12, 229, '질소 덮기 — 녹아 드는 산소가 적다', 't-dim', 'end'), tip('질소 덮기 · 탈기 — 액에 녹은 산소를 줄여 Cu 부식을 늦춘다')));

      // 물 분자 (물 함량에 비례)
      let wd = '';
      const nW = Math.round(st.w * 1.2);
      for (let i = 0; i < nW; i++){ const x = 64 + g() * 672, y = 352 + g() * 220; wd += wob(x, y, 4.5, 'st07-w', i + 3, 9); }
      set$('[data-v="water"]', G(wd, tip(`물 ${st.w} % — 부식에 필요한 물. 물이 많을수록 액의 전도도도 오른다`)));

      // 산소 (공기 6 · 질소 2)
      const O2T = base ? [[90, SEED - 14, 70], [182, SEED - 14, 200], [BX0 - 14, 860, 150], [BX0 - 14, 775, 300], [BX1 + 14, 880, 520], [600, SEED - 14, 690]]
        : [[90, SEED - 14, 70], [182, SEED - 14, 200], [BX0 - 30, SEED - 14, 150], [136, SEED - 14, 300], [BX1 + 24, SEED - 14, 520], [600, SEED - 14, 690]];
      let ox = '';
      O2T.slice(0, st.o2 === 'air' ? 6 : 2).forEach(([tx, ty, x0], i) => { ox += o2(`M${x0},254 L${tx},${ty}`, 4.4 + (i % 3) * 0.5, i * 0.8); });
      set$('[data-v="o2"]', G(ox, only('cu galv rinse')));

      // 억제제 막 (Cu 표면) — 헹굼에서는 옅어진다
      const inhD = cuEdge(1.5);
      const inhTip = tip('부식 억제제 막 — Cu 겉에 아주 얇게(분자 몇 층) 달라붙어 알칼리 · 산소를 막는다 (그림은 과장)');
      set$('[data-v="inh"]', st.inh === 'on'
        ? G(P(inhD, 'st07-inh'), W(only('cu sn galv'), inhTip)) + G(`<path d="${inhD}" class="st07-inh"><animate attributeName="opacity" values="1;1;.15;.15;1" keyTimes="0;.15;.55;.95;1" dur="6s" repeatCount="indefinite"/></path>`, W(only('rinse'), tip('억제제 막이 묽어져 옅어진다 — 헹굼 첫 순간')))
        : '');

      // OH⁻ — sn: SnAg 곁의 알칼리, galv: Cu(캐소드)에서 생겨 떠남, rinse: 아민계에서 물과 만나 생김
      let oh = '';
      const nOH = am ? 2 : 5;
      for (let i = 0; i < nOH; i++){ const x = 284 + i * 44 + (i % 2) * 10, y = YS - 36 - (i % 2) * 22; oh += fly('st07-oh', 'OH⁻', `M${x},${y} L${x + 8},${y + 6} L${x - 6},${y + 12} L${x},${y}`, 3.4 + i * 0.3, i * 0.7); }
      let ohg = '';
      [[BX0 - 18, 900, 170, 700], [120, SEED - 18, 90, 760], [205, SEED - 18, 150, 800]].forEach(([x0, y0, x1, y1], i) => { ohg += fly('st07-oh', 'OH⁻', `M${x0},${y0} Q${(x0 + x1) / 2 - 30},${(y0 + y1) / 2} ${x1},${y1}`, 4.2, i * 1.3); });
      let ohr = '';
      if (am) [[110, SEED - 30], [200, SEED - 34], [BX0 - 28, 850], [BX0 - 30, 770], [560, SEED - 30]].forEach(([x, y], i) => {
        ohr += `<g class="pl-ion st07-oh" transform="translate(${x} ${y})"><circle r="14"/><text y="5" text-anchor="middle">OH⁻</text><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.12;.3;.6;.85;1" dur="6s" begin="-${(i * 0.2).toFixed(1)}s" repeatCount="indefinite"/></g>`;
      });
      set$('[data-v="oh"]', G(oh, W(only('sn'), tip(am ? 'OH⁻ — 아민계는 알칼리가 약해 Sn을 덜 먹는다' : 'OH⁻ — TMAH는 강알칼리라 Sn을 더 먹는다'))) + G(ohg, W(only('galv'), tip(`OH⁻ — 캐소드(${base ? 'Cu' : 'Ni · 시드 Cu'})에서 산소가 전자를 받아 생긴다`))) +
        G(ohr, W(only('rinse'), tip('아민계: 물과 만나 OH⁻가 늘어난다 (R–NH₂ + H₂O ⇌ R–NH₃⁺ + OH⁻)'))));

      // 떠나는 Cu 이온 (아민계는 보라 고리 = 아민이 붙잡음)
      const CUS = base ? [[110, SEED - 20, -30], [BX0 - 22, 880, -50], [BX1 + 16, 900, 0], [196, SEED - 20, 20], [BX0 - 22, 775, -60], [62, SEED - 20, 10], [BX1 + 16, 775, 0], [154, SEED - 20, -10]]
        : [[110, SEED - 20, -30], [BX0 - 26, SEED - 20, -50], [BX1 + 16, SEED - 20, 0], [196, SEED - 20, 20], [BX0 - 60, SEED - 20, -60], [62, SEED - 20, 10], [BX1 + 70, SEED - 20, 0], [154, SEED - 20, -10]];
      let ci = '';
      CUS.slice(0, nCu).forEach(([x, y, dx], i) => {
        const up = x > BX1 ? 330 : 290, path = x > BX1 ? `M${x},${y} L${x + 4},${y - up}` : `M${x},${y} Q${x + dx * 0.3},${y - up * 0.5} ${x + dx},${y - up}`;
        ci += fly('cu', 'Cu²⁺', path, 4.4 + (i % 3) * 0.6, i * 0.55, am ? '<circle r="27" class="st07-am"/>' : '');
      });
      set$('[data-v="cuion"]', G(ci, W(only('cu rinse'), tip(am ? '[Cu(아민)ₙ]²⁺ — 아민(보라 고리)이 붙잡아 액으로 데려간다' : 'Cu — TMAH계는 아민계보다 Cu를 덜 먹는다 (개념 모델 ×0.5)'))));

      // 떠나는 Sn (알칼리 속에서는 주석산 이온 — 그림은 원소 이름만)
      const SNS = [[300, YS + 6], [362, YS + 6], [424, YS + 6], [472, YS + 6], [330, YS + 6], [BX1 + 16, YS + 60], [BX0 - 22, YS + 50], [450, YS + 6]];
      let si = '';
      SNS.slice(0, nSn).forEach(([x, y], i) => {
        const path = x > BX1 ? `M${x},${y} L${x + 4},${y - 300}` : x < BX0 ? `M${x},${y} Q${x - 20},${y - 120} ${x - 50},${y - 300}` : `M${x},${y} Q${x + (i % 2 ? 24 : -24)},${y - 130} ${x + (i % 2 ? 10 : -30)},${y - 280}`;
        si += fly('sn', 'Sn', path, 4.6 + (i % 3) * 0.5, i * 0.6);
      });
      set$('[data-v="snion"]', G(si, W(only('sn galv rinse'), tip(am ? 'Sn — 아민계에서는 조금 녹는다' : 'Sn — 강알칼리(TMAH)에서는 HSnO₂⁻ · SnO₃²⁻ (주석산 이온)로 녹는다'))));

      set$('[data-v="snlab"]', G(LB(T(520, YS - 52, `Sn 손실 ${f1(m.sn)} nm`, 't-warn', 'start') +
        TT(520, YS - 20, wrap('윗면이 거칠어지고 색이 변할 수 있다 → 리플로우 젖음 · 모양', 11.4), 't-dim', 'start', 25) + T(520, YS + 86, '(깊이 · 거칠기는 크게 과장)', 't-dim', 'start')), only('sn')));

      // 장면의 시드: 범프 사이에서 잃은 몫을 빨간 띠로 (그림 두께 20 px = 300 nm 비율, 범프 아래는 그대로)
      const sl = Math.min(1, m.cu / 300) * SEEDH;
      set$('[data-v="seedloss"]', sl > 0.4 ? G(R(LX0, SEED, BX0 - LX0, sl, 'st07-ghs') + R(BX1, SEED, LX1 - BX1, sl, 'st07-ghs'), tip(`잃은 시드 ${f1(Math.min(300, m.cu))} nm (빨강) — 그림의 시드 두께 = 300 nm 비율`)) : '');

      // 확대 동그라미 — 시드 Cu 윗부분을 nm 눈금으로 (cu · rinse). 2 px/nm: 몇 nm 손실도 보이게, 눈금 10 nm
      const ZBOT = ZC.y + ZC.r, lossPx = Math.min(300, m.cu) * ZS, sPx = Math.min(300, m.cuS) * ZS, x0 = ZC.x - ZC.r, w0 = ZC.r * 2;
      const surf = ZTOP + lossPx, seen = surf < ZBOT - 6;            // 지금 표면이 동그라미 안에 보이나
      let z = R(x0, ZC.y - ZC.r, w0, ZTOP - (ZC.y - ZC.r), 'f-strip');
      z += `<rect x="${x0}" y="${ZC.y - ZC.r}" width="${w0}" height="${ZTOP - (ZC.y - ZC.r)}" class="st07-rin" data-st="rinse"><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.1;.45;.92;1" dur="6s" repeatCount="indefinite"/></rect>`;
      if (seen) z += R(x0, surf, w0, ZBOT - surf, 'f-seed2');
      if (sPx > 0.3) z += R(x0, ZTOP, w0, Math.min(sPx, ZBOT - ZTOP), 'st07-ghs');
      if (lossPx - sPx > 0.3 && ZTOP + sPx < ZBOT) z += R(x0, ZTOP + sPx, w0, Math.min(lossPx - sPx, ZBOT - ZTOP - sPx), 'st07-ghr');
      z += L(x0, ZTOP, x0 + w0, ZTOP, 's-dash');
      // 깊이 눈금 (처음 표면 = 0, 10 nm마다)
      for (let k = 1; k <= 7; k++){
        const y = ZTOP + k * 10 * ZS;
        z += L(k % 2 ? 622 : 614, y, 632, y, 'st07-ztk') + (k % 2 ? '' : T(610, y + 6, String(k * 10), 'st07-zt', 'end'));
      }
      if (st.inh === 'on' && seen){
        z += G(L(x0, surf - 2, x0 + w0, surf - 2, 'st07-inh'), only('cu'));
        z += G(`<line x1="${x0}" y1="${(surf - 2).toFixed(1)}" x2="${x0 + w0}" y2="${(surf - 2).toFixed(1)}" class="st07-inh"><animate attributeName="opacity" values="1;1;.15;.15;1" keyTimes="0;.15;.55;.95;1" dur="6s" repeatCount="indefinite"/></line>`, only('rinse'));
      }
      const yS = Math.min(surf, ZBOT - 18);
      z += `<g><circle cx="-5" r="5" class="st07-zo"/><circle cx="5" r="5" class="st07-zo"/><animateMotion dur="3.2s" repeatCount="indefinite" path="M650,700 L654,${(yS - 7).toFixed(0)}"/></g>`;
      z += `<g><circle r="11" class="st07-am"/><circle r="6" class="st07-zcu"/><animateMotion dur="3.2s" begin="-1.6s" repeatCount="indefinite" path="M696,${(yS - 8).toFixed(0)} L712,698"/><animate attributeName="opacity" values="0;1;1;0" dur="3.2s" begin="-1.6s" repeatCount="indefinite"/></g>`;
      if (surf + 26 <= 850) z += T(694, surf + 26, '시드 Cu', 'st07-in'); else if (!seen) z += T(672, ZBOT - 30, '↓ 눈금 밖', 'st07-zt');
      let zz = G(z, {'clip-path': K.url('st07-zc')}) + C(ZC.x, ZC.y, ZC.r, 'st07-zring', tip(`확대 — 시드 Cu 윗부분을 nm 눈금으로 (눈금 10 nm · 시드 300 nm 가운데 위 약 70 nm)\n점선 = 처음 표면 · 빨강 = 스트립 중 · 주황 = 헹굼 순간 몫`));
      zz += L(ZC.x, ZC.y + ZC.r, ZC.x, SEED - 8, 's-lead') + R(ZC.x - 30, SEED - 8, 60, 36, 'st07-zspot');
      zz += LB(T(ZC.x, 606, '시드 확대 (눈금 10 nm)', 't-dim', 'middle', only('cu')) + T(ZC.x, 606, '주황 = 헹굼 순간 몫', 't-dim', 'middle', only('rinse')) +
        T(ZC.x, 634, `Cu −${f1(m.cu)} nm`, 't-warn') + T(ZC.x, 662, m.seed <= 0 ? '시드가 다 녹음' : `남은 시드 ${Math.floor(m.seed * 1000) / 10} %`, 't-sub'));
      set$('[data-v="zoom"]', G(zz, only('cu rinse')));

      // 헹굼 설명 상자 첫 줄
      set$('[data-v="rcap"]', LB(T(68, 292, st.rinse === 'di' ? '지금 헹굼: 바로 물 (아민계 가정 — 헹굼 몫 ×5)' : '지금 헹굼: 중간 용제(IPA 등) → 물 (헹굼 몫 ×0.2)', 't-sub', 'start') +
        T(68, 322, am ? '물 · 전도도 ↑ · 억제제 ↓ (묽어짐) · 아민계는 OH⁻도 ↑' : '물 · 전도도 ↑ · 억제제 ↓ (묽어짐) · TMAH계는 OH⁻가 늘지 않음', 't-dim', 'start')));

      // ── 오른쪽 cu 패널: 손잡이 칩 + 기둥 vs 시드 ──
      const chip = (x, y, t, onCls) => { const w = Math.round(emw(t) * 19 + 30); return [w, R(x, y, w, 38, 'st07-chip' + (onCls ? ' ' + onCls : ''), {rx: 19}) + T(x + w / 2, y + 26, t, onCls ? 'st07-chipt' : 't-dim')]; };
      let cpn = '', cx = 812;
      [['물 ↑', st.w >= 5], [st.o2 === 'air' ? '산소 ↑ (공기)' : '산소 ↑', st.o2 === 'air'], ['온도 ↑', st.T >= 75], ['액에 녹은 Cu ↑', false]].forEach(([t, on]) => { const [w, h] = chip(cx, 466, t, on ? 'up' : ''); cpn += h; cx += w + 12; });
      cx = 812;
      [['억제제 (아졸 막)', st.inh === 'on'], ['질소 덮기 · 탈기', st.o2 === 'n2'], ['TMAH계 (Cu에는 덜)', !am]].forEach(([t, on]) => { const [w, h] = chip(cx, 564, t, on ? 'dn' : ''); cpn += h; cx += w + 12; });
      const BW = 400, bx = 1010;
      const rowBar = (y, lab, lost, tot, pil) => {
        const f = Math.min(1, lost / tot), pc = lost / tot * 100;
        return T(812, y + 20, lab, 't-sub', 'start') + R(bx, y, BW, 26, pil ? 'st07-pil' : 'f-seed2', {rx: 3}) + R(bx, y, Math.max(f * BW, 1.5), 26, 'st07-ls', {rx: 2}) +
          T(bx + BW + 14, y + 21, `${pc >= 10 ? Math.min(100, pc).toFixed(0) : pc >= 1 ? pc.toFixed(1) : pc.toFixed(2)} %`, 'pl-val', 'start');
      };
      // 기둥 옆면 손실은 지름(양옆)에서, 시드 손실은 두께에서 빠진다. 상부 Cu 띠는 지름이 같이 줄며 거의 안 먹히는 Ni보다 들어간 홈이 된다
      const sp = Math.min(100, m.cu / 3).toFixed(m.cu / 3 >= 10 ? 0 : 1);
      if (base){
        cpn += rowBar(718, '기둥 지름 25 µm', 2 * m.cu, 25000, true) + rowBar(762, '시드 두께 300 nm', m.cu, 300, false);
        cpn += T(812, 826, `Cu 손실 ${f1(m.cu)} nm — 기둥 지름에는 ${(2 * m.cu / 250).toFixed(2)} %(양옆), 시드 두께에는 ${sp} %`, 't-dim', 'start');
        cpn += T(812, 856, `상부 Cu 띠: 바로 아래 Ni보다 ${f1(m.cu)} nm 들어간 ${m.cu < 150 ? '얕은 ' : ''}홈 (띠 높이 3 µm의 ${pc} %)`, 't-dim', 'start');
      } else {
        cpn += T(812, 738, 'Cu 기둥 없음 — 범프 옆면은 Ni · SnAg (코어 다이)', 't-sub', 'start') + rowBar(762, '시드 두께 300 nm', m.cu, 300, false);
        cpn += T(812, 826, `Cu 손실 ${f1(m.cu)} nm — 시드 두께에는 ${sp} % · 범프에서 잃는 Cu는 없다`, 't-dim', 'start');
        cpn += T(812, 856, 'Ni 옆면은 알칼리에서 비교적 잘 견딘다 (아민과는 조건에 따라 착이온)', 't-dim', 'start');
      }
      set$('[data-v="cupan"]', cpn);

      // ── sn 패널: 지금 배합 ──
      set$('[data-v="snnow"]', T(812, 190, `지금: ${am ? '아민계 — 알칼리가 약해 Sn은 덜 먹힌다' : 'TMAH계 — 강알칼리라 Sn을 더 먹는다 (아민계의 약 3배)'}`, am ? 't-sub' : 'st07-warn2', 'start'));

      // ── galv 패널: 지금 스트리퍼의 물 표시 ──
      const mx = 840 + Math.min(1, st.w / 20) * 0.32 * 680;
      set$('[data-v="gmark"]', PG([[mx, 292], [mx - 9, 308], [mx + 9, 308]], 'st07-mark') + T(Math.max(836, mx - 24), 336, `지금 스트리퍼 물 ${st.w} %`, 't-sub', 'start'));

      // ── rinse 패널: 곡선 ──
      let rc = '', hat = '', ln = {di: '', sol: '', inh: '', oh: '', w: ''};
      const di = t => attack(t, am) / ATKMAX, so = t => t > 8 ? 0.15 * attack((t - 8) / 1.4, am) / ATKMAX : 0;
      const pts = [];
      for (let t = 0; t <= 60.001; t += 0.25){
        const c = comps(t), X = rgx(t).toFixed(1), add = (k, v) => { ln[k] += (ln[k] ? ' L' : 'M') + X + ',' + rgy(v).toFixed(1); };
        add('di', di(t)); add('sol', so(t)); add('inh', 0.95 * c.inh); add('oh', am ? 0.85 * c.oh / 0.62 : 0.05); add('w', 0.8 * c.w);
        if (di(t) >= 0.3) pts.push([rgx(t), rgy(di(t))]);
      }
      if (pts.length > 1) hat = P(`M${pts[0][0].toFixed(1)},${RY0} ` + pts.map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${pts[pts.length - 1][0].toFixed(1)},${RY0} Z`, '', {fill: K.url('st07-hat'), 'data-tip': '위험 창 — 물이 들어오고 억제제는 묽어지는 첫 몇 초~수십 초'});
      const pick = st.rinse;
      rc += hat;
      rc += P(ln.inh, 'st07-cinh', tip('억제제 농도 — 묽어지며 처음부터 줄기만 한다')) + P(ln.w, 'st07-cw', tip('물 · 전도도 — 헹굼 물이 들어오며 오른다')) + P(ln.oh, 'st07-coh' + (am ? '' : ' st07-faint'), tip(am ? 'OH⁻ (아민계) — 물을 만나 솟았다가 더 묽어지면 내려간다' : 'TMAH계 — 물이 들어와도 OH⁻가 솟지 않는다'));
      rc += P(ln.sol, 'st07-csol' + (pick === 'sol' ? '' : ' st07-faint'), tip('중간 용제(IPA 등) → 물 — 스트리퍼를 먼저 밀어낸 뒤 물이 와서 낮고 완만하다'));
      rc += P(ln.di, 'st07-cdi' + (pick === 'di' ? '' : ' st07-faint'), tip('바로 물 — 물이 들어오는 첫 몇 초에 급히 솟았다가 30초쯤 내려간다'));
      const pk = pick === 'di' ? [rgx(4.5), rgy(di(4.5))] : [rgx(14.3), rgy(so(14.3))];
      rc += C(pk[0], pk[1], 8, pick === 'di' ? 'k-ng' : 'k-acc');
      rc += LB(T(1010, 270, '← 위험 창 (첫 몇 초~수십 초)', 't-warn', 'start'));
      rc += LB(T(1500, pick === 'di' ? 520 : 560, pick === 'di' ? '지금: 바로 물 (빨강)' : '지금: 중간 용제 → 물 (하늘)', pick === 'di' ? 'pl-warn' : 'pl-hdg', 'end'));
      set$('[data-v="rcurve"]', rc);

      // ── 결과 상자 ──
      const RBX = 1010, RBW = 430, sc = RBW / 300;
      const bar = (y, a, b, bg) => {
        const tot = a + b, wa = Math.min(RBW, a * sc), wb = Math.min(RBW - wa, b * sc);
        return R(RBX, y, RBW, 28, bg, {rx: 3}) + R(RBX, y, Math.max(wa, 1.2), 28, 'st07-ls') + (wb > 0.3 ? R(RBX + wa, y, Math.max(wb, 1.2), 28, 'st07-lr') : '') +
          (tot > 300 ? T(RBX + RBW - 8, y + 21, '≫', 'st07-in', 'end') : '') + T(RBX + RBW + 12, y + 22, `${f1(tot)} nm`, 'pl-val', 'start');
      };
      let rs = bar(948, m.cuS, m.cuR, 'st07-seedbg') + bar(994, m.snS, m.snR, 'st07-snbg');
      const big = m.strip >= 0.5 ? '스트립 중' : '헹굼 순간', bp = Math.min(99, Math.round((m.strip >= 0.5 ? m.strip : 1 - m.strip) * 100));
      rs += T(1550, 928, `가장 큰 몫: ${big} (${bp} %)`, 't-warn', 'end');
      rs += T(812, 1060, '막대 끝 = 300 nm (두 줄 모두 시드 두께 눈금) · 빨강 = 스트립 중 · 주황 = 헹굼', 't-dim', 'start');
      rs += T(812, 1090, `스트립 중 속도: Cu ${m.rCu.toFixed(2)} · Sn ${m.rSn.toFixed(2)} nm/분 × ${st.t}분 · 헹굼 몫: Cu ${m.cuR.toFixed(1)} · Sn ${m.snR.toFixed(1)} nm`, 't-dim', 'start');
      set$('[data-v="res"]', rs);
      ctx.refresh();

      // ── 카드 KPI · 메시지 ──
      ctx.out('k-cu', `${f1(m.cu)} nm`);
      ctx.out('k-seed', m.seed <= 0 ? '0 % (다 녹음)' : `${(Math.floor(m.seed * 1000) / 10).toFixed(1)} %`);
      ctx.out('k-sn', `${f1(m.sn)} nm`);
      ctx.out('k-big', `${big} ${bp} %`);
      setCls('k-cu', m.cu < 10 ? 'ok' : m.cu < 30 ? 'warn' : 'ng');
      setCls('k-seed', m.seed >= 0.97 ? 'ok' : m.seed >= 0.9 ? 'warn' : 'ng');
      setCls('k-sn', m.sn < 10 ? 'ok' : m.sn < 30 ? 'warn' : 'ng');
      let msg = `가장 큰 몫은 <b>${big}</b>입니다 (Cu + Sn 손실의 ${bp} %).`;
      if (m.seed <= 0) msg += ' 시드 Cu 300 nm가 다 녹는 극단 조건입니다(개념 모델) — 실제로는 쓰지 않는 조건입니다.';
      else if (m.seed < 0.9) msg += ` 시드 Cu가 ${(m.cu / 3).toFixed(0)} % 얇아집니다 — 시드 식각 시간 · 언더컷이 달라질 수 있습니다.`;
      if (!base) msg += ' 코어 다이는 범프 옆면에 Cu가 없어 Cu 손실이 범프 사이 시드에서만 생기고, 범프에서는 SnAg 표면(알칼리 종류 · 물)을 더 봅니다.';
      else if (m.cu >= 10) msg += ` 베이스 다이의 상부 Cu 띠(3 µm)도 ${f1(m.cu)} nm 들어가 Ni와 SnAg 사이에 ${m.cu < 150 ? '얕은 ' : ''}홈이 됩니다(띠 높이의 ${pc} %).`;
      if (m.sn >= 10) msg += ` SnAg 윗면이 ${f1(m.sn)} nm 깎여 거칠어지거나 색이 변할 수 있습니다 — 리플로우 젖음과 이어 봅니다.`;
      // 인화점 (03 · 04 · 05장과 같은 두 단계): 88 °C 이상 = 인화점 닿음 · 넘음, 78 °C 넘음 = 예시 경고선(인화점 − 10 °C, 가정) 안쪽
      if (st.T >= 88) msg += ` <b>⚠ ${st.T} °C는 DMSO 인화점(약 88 °C)${st.T > 88 ? '보다 높습니다' : '에 닿았습니다'} — 증기에 불이 붙을 수 있는 온도라 예시 모델에서도 쓰지 않습니다.</b> 실제 여유는 장비 · 사내 안전 기준 → <a data-go="chem.safety">04장</a>.`;
      else if (st.T > 78) msg += ` <b>⚠ ${st.T} °C — DMSO 인화점(약 88 °C)까지 ${88 - st.T} °C, 예시 경고선(인화점 − 10 °C, 가정) 안쪽입니다.</b> 실제 여유는 장비 · 사내 안전 기준 → <a data-go="chem.safety">04장</a>.`;
      msg += st.inh === 'on' ? ' 억제제가 든 액에서는 헹굼 순간이 상대적으로 커집니다 — 헹굼 순서를 바꿔 보세요 (실제 순서는 약품 공급사가 검증한 순서).'
        : ' 억제제가 없으면 스트립 중 Cu 손실이 약 10배로 커집니다 — 억제제 · 질소 덮기를 켜 보세요.';
      ctx.q('[data-o=msg]').innerHTML = msg;
    }

    ['T', 'w', 't'].forEach(id => {
      ctx.range(id, v => { st[id] = v; render(); return OUT[id](v); });
      const i = inp(id); if (i) i.addEventListener('input', () => { touched = true; });
    });
    SEGS.forEach(id => ctx.seg(id, (v, user) => { st[id] = v; if (user) touched = true; render(); }));
    // 손대지 않았으면 단계마다 예시 값으로 (발표 모드에서도 장면이 단계에 맞게)
    function apply(p){
      Object.assign(st, p);
      ['T', 'w', 't'].forEach(id => { const i = inp(id); if (i){ i.value = p[id]; ctx.out(id, OUT[id](+p[id])); } });
      SEGS.forEach(id => {
        const g = ctx.card.querySelector(`.pl-seg[data-g="${id}"]`);
        if (g) g.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === String(p[id]) ? 'true' : 'false'));
      });
      render();
    }
    ctx.demo = sid => {
      const ep = window.EngrTheatres && window.EngrTheatres.strip;
      if (ep && ep.state.pres != null) touched = false;
      if (touched) return ctx.refresh();
      apply(DEMO[sid] || DEF);
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['착이온', '금속 이온을 다른 분자(여기서는 아민)가 둘러싸 붙잡은 것. 금속이 액으로 잘 빠져나가게 한다'],
      ['양쪽성 금속', '산에도 강한 알칼리에도 녹는 금속 (Sn · Al 등)'],
      ['갈바닉 부식', '서로 다른 금속이 전기로 이어진 채 같은 액에 닿아 작은 전지가 되어, 한쪽이 더 빨리 녹는 것'],
      ['애노드 · 캐소드 (부식에서)', '녹는 쪽 = 애노드(산화), 받는 쪽 = 캐소드(환원 — 산소 등이 여기서 전자를 받고, 이 금속은 덜 녹아 지켜진다). 시드 식각 탭과 같은 짝이다. 바깥 전원이 있는 도금 셀과 +/− 부호가 반대로 보여 헷갈리므로 \'양극 · 음극\' 대신 이 이름을 쓴다 — \'산화가 일어나 녹는 쪽 = 애노드\'로 기억'],
      ['상부 Cu (베이스 다이)', 'Ni 위에 얇게 한 번 더 올린 Cu (예시 3 µm). 솔더가 처음 만나는 면 — PR이 걷히면 Ni와 SnAg 사이 얇은 띠로 액에 닿는다. 코어 다이(Ni / SnAg)에는 없다'],
      ['오버 스트립', 'PR이 다 걷힌 뒤에도 더 담가 두는 여유 시간. 이 동안에는 금속만 먹힌다 — 시드와 범프 옆면(베이스 다이는 Cu 기둥 · 상부 Cu)은 PR이 걷혀야 액에 닿으므로 Cu 손실은 주로 이때와 헹굼에서 생긴다 (SnAg 윗면은 처음부터 닿음)'],
      ['헹굼 충격', '헹굼 첫 순간 물이 들어와 부식이 쉬워지고 억제제는 묽어지는 상태 (아민계는 OH⁻도 늘어남)'],
      ['블랭킷 시편', '무늬 없이 금속만 입힌 시험 웨이퍼. 손실을 면저항 · 두께(XRF) 변화로 잰다']
    ]) + K.field([
      'Cu 손실은 굵은 Cu 기둥(베이스 다이)보다 <b>얇은 시드에서 먼저</b> 문제가 됩니다 — 시드는 두 다이 모두 범프 사이에 드러납니다. 시드가 얇아지면 시드 식각 시간 · 언더컷이 달라집니다 → <a href="#go-etch-04">시드 식각 04장</a>.',
      'SnAg 표면이 변색 · 거칠어지면 리플로우 젖음 · 모양이 흔들릴 수 있습니다. 스트립 직후 외관과 리플로우 결과를 lot으로 이어 봅니다 → <a href="#go-reflow-03">리플로우 03장</a> · <a href="#go-reflow-04">04장</a>.',
      '물 함량 · 온도 · 시간이 같아도, 스트립 → 헹굼 사이 <b>이동 시간과 헹굼 순서</b>가 바뀌면 부식이 달라집니다(→ <a data-go="tool.rinse">05장 헹굼</a>). 헹굼 순서는 약품 공급사가 검증한 순서를 따르고, 헹굼 레시피 변경도 변경 관리 대상입니다.',
      '스트립에서 생기는 계면 파임은 보통 nm~수십 nm입니다 — 베이스 다이의 상부 Cu 띠 홈도 마찬가지입니다. <b>수백 nm~µm 홈 · 밑동 언더컷</b>이 보이면 시드 식각을 먼저 의심하고, 스트립 직후(시드 식각 전) 단면과 비교합니다. 베이스 · 코어 다이는 따로 잽니다 → <a href="#go-etch-04">시드 식각 04장</a> · <a href="#go-etch-05">05장</a>.',
      '손실 확인은 블랭킷 Cu · Sn 시편을 제품과 함께 흘려 면저항 · XRF 두께 변화로 재는 방법이 간단합니다. 새 액 · 지친 액, 두 온도에서 한 번씩 재 두면 아래 「온도와 시간의 맞바꿈」을 내 액으로 판단할 수 있습니다.'
    ]) + K.deep(`<ul>
      <li><b>Cu 용해</b> — 2Cu + O₂ → 2CuO(또는 4Cu + O₂ → 2Cu₂O), 산화물 + 아민 → [Cu(아민)ₙ]²⁺(Cu⁺ 착이온은 산소가 다시 Cu²⁺로). 아민 · 암모니아는 Cu의 착화제라 Cu를 식각할 수 있습니다(공개 특허 문헌). 에탄올아민 수용액에 공기 · 산소를 넣어 Cu를 녹이는 공업 공정이 있을 정도로, 산소는 Cu 부식의 핵심 산화제입니다 → 질소 덮기 · 탈기로 줄입니다. 또 <b>녹아 쌓인 Cu²⁺–아민 착이온은 그 자체가 Cu를 녹이는 산화제</b>입니다(Cu + Cu²⁺ → 2Cu⁺, 산소가 Cu⁺를 다시 Cu²⁺로 — 알칼리 암모니아 Cu 식각액과 같은 원리). 그래서 Cu가 쌓인 지친 액에서는 Cu 손실이 빨라질 수 있습니다 — 액 속 Cu는 부식의 결과이자 원인입니다(<a data-go="bath.rule">06장</a>).</li>
      <li><b>Sn</b> — 산화물 용해도는 pH 약 8.5에서 가장 낮고, 강알칼리에서는 HSnO₂⁻ · SnO₃²⁻ 이온으로 녹습니다. pH 약 12를 넘으면 억제제로도 완전히 막기 어렵다는 보고가 있습니다(물에 묽어진 알칼리 기준 — 물이 적은 스트리퍼 속 알칼리 세기는 pH로 읽지 않습니다, <a data-go="chem.water">04장</a>). Sn이 빠지면 표면에 Ag(Ag₃Sn)가 상대적으로 남아 색 · 거칠기가 달라질 수 있습니다(조건에 따라).</li>
      <li><b>Ni</b> — 알칼리에서는 비교적 부동태라 잘 견디지만, 아민 · 암모니아와 착이온을 만들 수 있어 조건에 따라 먹힙니다. 코어 다이(Ni / SnAg)는 Ni가 범프 몸통(예시 5 µm)이라 옆면에 Cu 대신 Ni가 드러납니다 — 몇 nm 손실은 몸통에 견주면 아주 작고, 볼 곳은 SnAg 표면과 Ni 발 옆 시드입니다.</li>
      <li><b>상부 Cu 띠 (베이스 다이)</b> — 예시 3 µm 띠가 위 SnAg · 아래 Ni 사이에 끼어 옆면으로 드러납니다. 고르게 먹혀도 깊이는 Cu 기둥 옆면과 같은 몇~수십 nm(띠 높이의 1 % 이하)이지만, 바로 아래 Ni는 거의 안 먹혀 띠가 들어간 홈(노치)이 됩니다(위 SnAg는 액에 따라 같이 먹히기도 합니다). 또 맞닿은 선 둘(Ni/상부 Cu · 상부 Cu/SnAg)이 3 µm 안에 있어 선 옆에 몰리는 갈바닉 공격이 띠 전체에 겹칠 수 있습니다 — 액에 따라 Cu가 녹는 쪽이 되면(착화제가 Cu를 붙잡을 때) 띠가, Sn이 녹는 쪽이면 띠 바로 위 SnAg가 파입니다. 스트립의 홈은 얕지만, 뒤의 Cu 식각액이 이 띠를 시드 두께 · 과식각만큼(수백 nm) 더 팔 수 있어(<a href="#go-etch-04">시드 식각 04장</a>) 베이스 다이는 스트립 직후 단면에서 띠를 따로 봅니다.</li>
      <li><b>갈바닉</b> — 표준 전위 Ag⁺/Ag +0.80, Cu²⁺/Cu +0.34, Sn²⁺/Sn −0.14, Ni²⁺/Ni −0.26 V(물, 25 °C). 물에서는 보통 Sn · Ni가 녹는 쪽(애노드)이 되기 쉽지만, 착화제가 Cu를 강하게 붙잡으면 Cu의 실제 전위가 내려가 순서가 바뀔 수 있습니다. 알칼리 스트리퍼에서는 Ni가 얇은 산화막(부동태)에 덮여 SnAg보다 덜 녹는 쪽(캐소드)이 되기 쉽습니다 — 코어 다이(Ni / SnAg)에서는 보통 SnAg가 녹는 쪽입니다(아민이 Ni를 붙잡는 액에서는 조건에 따라). 넓은 캐소드 + 작은 애노드는 애노드 전류밀도를 키워 국부 부식을 빠르게 합니다(원리 · 면적비 → <a href="#go-etch-05">시드 식각 05장</a>). 전류가 어디까지 퍼지는지는 액 전도도 × 거리가 정합니다. <b>물이 거의 없는 액은 전도도가 낮아 먼 거리 갈바닉은 약하지만, 두 금속이 맞닿은 선(베이스 다이: Cu 기둥/Ni · Ni/상부 Cu · 상부 Cu/SnAg, 코어 다이: 시드 Cu/Ni 발 · Ni/SnAg) 바로 옆 µm 거리에서는 액 저항이 작아 여전히 전류가 흐르고, 공격이 계면에 좁게 몰립니다</b>(띠 · V자 홈 — <a data-go="defects.tiles">09장</a>). 물이 섞여 전도도가 오르는 헹굼 순간에는 공격 범위가 넓어지고 빨라집니다.</li>
      <li><b>헹굼 충격</b> — 물로 묽히면 모든 성분의 농도가 같은 비율로 떨어집니다. 그런데 아민 평형 R–NH₂ + H₂O ⇌ R–NH₃⁺ + OH⁻는 물이 적을 때 왼쪽에 머물다가 물이 늘면 오른쪽으로 가 OH⁻가 늘어납니다. 더 묽어지면 다시 줄어, OH⁻는 '솟았다 내려가는' 곡선이 되고 억제제는 처음부터 줄기만 합니다 — 이 사이가 위험 창입니다. 같은 때 물이 들어와 전기화학 부식이 쉬워지고 녹은 PR은 석출될 수 있습니다. TMAH · DMSO 계는 물이 염기 세기를 낮춰 이 솟음이 작고, 묽어진 알칼리 수막과 산소가 위험의 중심입니다. 세정 장비 문헌은 헹굼 첫 몇 초에 갈바닉 부식이 생길 수 있다고 보고하고, 다층 금속 웨이퍼를 용제 스트립 뒤 곧바로 물로 헹구면 갈바닉 부식이 생길 수 있다는 업계 글도 있습니다(주로 아민계 · Al 배선 사례). 대책은 약품에 맞게: 중간 용제(IPA 등) 헹굼, 빠른 대량 물 투입(퀵 덤프), 이동 시간 단축(마르지 않게), 묽은 산 헹굼(특허 예). 물로 바로 헹구게 만든 약품도 많아, 순서는 공급사가 검증한 대로 따릅니다.</li>
      <li><b>온도와 시간의 맞바꿈</b> — 한 번의 손실 = 부식 속도 × 시간입니다. 온도를 10 °C 올리면 스트립 시간은 <a data-go="soak.heat">03장</a> 모델(그림 기준 PR 35 µm · 순환, 70 → 80 °C)로 녹는 PR ×0.78, 가교 PR ×0.70만 줄어듭니다(가교 PR이 60 µm로 두꺼우면 ×0.66 — 겉면 공급 · 조각 치움 몫은 온도로 거의 안 빨라짐). 부식 속도는 부식의 활성화 에너지에 따라 늘어납니다 — 위젯 가정 Ea 60 kJ/mol이면 ×1.81이라 한 번 손실은 <b>×1.4(녹는 PR) · ×1.3(가교, 60 µm면 ×1.2)으로 오히려 늘고</b>, 부식이 산소 공급(액 속 확산, 보통 Ea 15~25 kJ/mol)에 묶여 Ea가 작으면(예: 20 kJ/mol, ×1.22) ×0.95 · ×0.86(60 µm 가교면 ×0.81)으로 조금 줍니다. 어느 쪽인지는 블랭킷 Cu · Sn 시편을 두 온도에서 재 보면 압니다. 온도는 시간을 줄이는 손잡이지만 금속에는 대개 손해이고, 손실을 줄이는 손잡이는 주로 물 · 산소 · 억제제 · 헹굼입니다.</li>
    </ul>`);
  },
  css: `.pl-svg .st07-in{font-size:21px;font-weight:800;fill:#0b1222 !important;stroke:none !important;text-anchor:middle}
.pl-svg .st07-in2{font-size:19px;font-weight:800;fill:#0b1222 !important;stroke:none !important;text-anchor:middle}
.pl-svg .st07-mt{font-size:19px;font-weight:800;fill:#0b1222 !important;stroke:none !important;text-anchor:middle}
.pl-svg .st07-bt{font-size:22px;font-weight:800;fill:#f8fafc !important;text-anchor:middle}
.pl-svg .st07-o2t{font-size:21px;font-weight:800;fill:#fca5a5 !important;text-anchor:middle}
.pl-svg .st07-amt{font-size:21px;font-weight:800;fill:#c4b5fd !important;text-anchor:middle}
.pl-svg .st07-anod{font-size:22px;font-weight:800;fill:#fdba74 !important}
.pl-svg .st07-cath{font-size:22px;font-weight:800;fill:#7dd3fc !important}
.pl-svg .st07-warn2{font-size:21px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .st07-uct{font-size:21px;font-weight:800;fill:#f1f5f9 !important}
.pl-svg .st07-cap{fill:rgba(6,11,24,.94);stroke:rgba(148,163,184,.35);stroke-width:1.2}
.pl-svg .st07-chipt{font-size:19px;font-weight:800;fill:#f8fafc !important;text-anchor:middle}
.pl-svg .st07-link{cursor:pointer}
.pl-svg .st07-link:hover text{fill:#7dd3fc !important}
.pl-ion.st07-o2 circle{fill:#ef4444;stroke:#fecaca}
.pl-ion.st07-o2 text{fill:#fff !important;font-size:12px}
.pl-ion.st07-oh circle{fill:#c084fc;stroke:#f3e8ff}
.pl-ion.st07-oh text{font-size:11px}
.pl-ion.cu circle.st07-am,.pl-svg .st07-am{fill:none;stroke:#a78bfa;stroke-width:3.2;stroke-dasharray:6 4}
.pl-svg .st07-w{fill:#67e8f9;opacity:.75}
.pl-svg .st07-drop{fill:#22d3ee;stroke:#cffafe;stroke-width:1.2}
.pl-svg .st07-rin{fill:rgba(103,232,249,.16)}
.pl-svg .st07-rinbox{fill:rgba(103,232,249,.18)}
.pl-svg .st07-air{fill:rgba(148,163,184,.10);stroke:rgba(148,163,184,.3);stroke-width:1}
.pl-svg .st07-n2{fill:rgba(56,189,248,.16);stroke:#38bdf8;stroke-width:1.4;stroke-dasharray:6 5}
.pl-svg .st07-inh{fill:none;stroke:#4ade80;stroke-width:4;stroke-linecap:round}
.pl-svg .st07-hot{fill:none;stroke:#fbbf24;stroke-width:3.5;stroke-dasharray:10 7;opacity:.9}
.pl-svg .st07-junc{fill:none;stroke:#e2e8f0;stroke-width:2.6;stroke-dasharray:3 3}
.pl-svg .st07-groove{fill:#0b1020;stroke:#f87171;stroke-width:1.6}
.pl-svg .st07-hotspot{fill:rgba(248,113,113,.30);stroke:none}
.pl-svg .st07-cur{fill:none;stroke:#7dd3fc;stroke-width:2.6;stroke-dasharray:8 6;animation:jzflow .9s linear infinite}
.pl-svg .st07-rbox{fill:rgba(15,23,42,.75);stroke:#64748b;stroke-width:1.4}
.pl-svg .st07-chip{fill:rgba(15,23,42,.6);stroke:rgba(148,163,184,.45);stroke-width:1.2}
.pl-svg .st07-chip.up{fill:rgba(239,68,68,.28);stroke:#f87171;stroke-width:2}
.pl-svg .st07-chip.dn{fill:rgba(34,197,94,.24);stroke:#4ade80;stroke-width:2}
.pl-svg .st07-pil{fill:#b8743f}
.pl-svg .st07-ls{fill:#ef4444}
.pl-svg .st07-lr{fill:#f59e0b}
.pl-svg .st07-seedbg{fill:rgba(224,144,79,.45);stroke:#e0904f;stroke-width:1}
.pl-svg .st07-snbg{fill:rgba(226,232,240,.18);stroke:#cbd5e1;stroke-width:1}
.pl-svg .st07-ghs{fill:rgba(239,68,68,.45);stroke:#f87171;stroke-width:1}
.pl-svg .st07-ghr{fill:#fbbf24;fill-opacity:.85;stroke:#78350f;stroke-width:1.5}
.pl-svg .st07-zring{fill:none;stroke:#38bdf8;stroke-width:3}
.pl-svg .st07-zspot{fill:rgba(56,189,248,.10);stroke:#38bdf8;stroke-width:2}
.pl-svg .st07-zo{fill:#ef4444;stroke:#fecaca;stroke-width:1}
.pl-svg .st07-zcu{fill:#f59e0b;stroke:#fde68a;stroke-width:1}
.pl-svg .st07-ztk{stroke:#1c1917;stroke-width:2;opacity:.75}
.pl-svg .st07-zt{font-size:16px;font-weight:800;fill:#fff7ed !important;stroke:#1c1917 !important;stroke-width:3px;paint-order:stroke}
.pl-svg .st07-band1{fill:rgba(250,204,21,.12)}
.pl-svg .st07-band2{fill:rgba(56,189,248,.12)}
.pl-svg .st07-ph12{fill:none;stroke:#f87171;stroke-width:2;stroke-dasharray:7 6}
.pl-svg .st07-mark{fill:#fbbf24;stroke:#fff7ed;stroke-width:1}
.pl-svg .st07-cdi{fill:none;stroke:#f87171;stroke-width:5;stroke-linejoin:round}
.pl-svg .st07-csol{fill:none;stroke:#38bdf8;stroke-width:5;stroke-linejoin:round}
.pl-svg .st07-cinh{fill:none;stroke:#4ade80;stroke-width:2.4;stroke-dasharray:8 6}
.pl-svg .st07-coh{fill:none;stroke:#c084fc;stroke-width:2.4;stroke-dasharray:8 6}
.pl-svg .st07-cw{fill:none;stroke:#22d3ee;stroke-width:2.4;stroke-dasharray:3 5}
.pl-svg .st07-faint{opacity:.28}
.st07-icu{fill:#f59e0b}
.st07-iam{fill:none;stroke:#a78bfa;stroke-width:2}
.st07-isn{fill:#e2e8f0}`
});
})();
