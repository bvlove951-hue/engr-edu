/* 시드 식각 06 — Ti 식각: 무엇으로 지우고, 무엇이 함께 다칠까? (막 · 수십~수백 nm) */
(function(){
// ── 개념 모델 (예시 상수) ─ [속도 nm/분, 기준 °C, Eₐ kJ/mol]
const RG = 8.314;
const arr = (a, T) => a[0] * Math.exp(-a[2] * 1000 / RG * (1 / (T + 273.15) - 1 / (a[1] + 273.15)));
const CH = {
  hf: {nm: '묽은 HF', r: [600, 25, 30], ind: 3, G: 4, ox: [5, 25, 30], cu: [2, 25, 30], sn: [2, 25, 30]},
  alk: {nm: '과산화수소계', r: [30, 45, 60], ind: 10, G: 1.5, ox: [0.2, 45, 40], cu: [4, 45, 40], cuOff: [40, 45, 40], sn: [3, 45, 40]}
};
// t₀ = 유도 + h/r, t = t₀(1 + 과식각). 옆 가속 G 는 범프 사이 Ti가 끊긴 뒤(t > t₀)에만 (05장).
// 보호막은 Ti 밑에 있어 Ti가 지워진 뒤(과식각 동안)에만 액에 닿고, Cu 기둥 · SnAg는 처음부터 닿는다
function calc(s){
  const c = CH[s.chem], r = arr(c.r, s.T), rs = r / 60;
  const t0 = c.ind + s.h / rs, t = t0 * (1 + s.oe / 100), tov = t - t0;
  const rcu = arr(s.chem === 'alk' && s.inh === 'off' ? c.cuOff : c.cu, s.T), rox = arr(c.ox, s.T), rsn = arr(c.sn, s.T);
  return {c, r, rs, t0, t, tov, ind: c.ind, G: c.G, u: s.h + c.G * rs * tov, e2: c.G * rs * 2,
    rox, rcu, rsn, ox: rox / 60 * tov, cu: rcu / 60 * t, sn: rsn / 60 * t};
}
const nf = v => v >= 1000 ? Math.round(v).toLocaleString('en-US') : v >= 10 ? String(Math.round(v)) : v >= 0.1 ? v.toFixed(1) : v > 0 ? '< 0.1' : '0';
const tf = v => v < 100 ? v.toFixed(1) + ' s' : Math.round(v) + ' s';
const tfl = v => v < 120 ? tf(v) : `${Math.round(v)} s (약 ${(v / 60).toFixed(v < 600 ? 1 : 0)}분)`;
const tfk = v => v < 120 ? tf(v) : `${(v / 60).toFixed(v < 600 ? 1 : 0)}분`;          // 결과 칸용 (짧게)
const DEMO = {oxide: {chem: 'hf', oe: 30, T: 25, h: 100}, hf: {oe: 30, T: 25, h: 100}, alk: {inh: 'on', oe: 30, T: 45, h: 100}, sel: {chem: 'alk', oe: 30, T: 45, h: 100}};
// 왼쪽 밑동 확대: 가로 1 nm = 0.4 px, 세로 1 nm = 0.2 px (Ti 100 nm = 20 px). 보호막 산화막 손실은 1 nm = 20 px (세로 100배 과장)
const X0 = 60, X1 = 780, XE = 420, PY0 = 222, TB = 490, SX = 0.4, SY = 0.2, OXP = 20;
const ZX = 446, ZY = 602, ZW = 330, ZH = 112;                    // 가장자리 확대 창 (왼쪽 패널 오른쪽 아래)
const VN_L = {x: 30, y: 122, w: 780, h: 606};                    // 좁은(세로) 화면 전용 확대: 왼쪽 밑동 패널
const VN_S = {x: 40, y: 292, w: 1124, h: 820};                   // 좁은 화면 sel: 재료 열 + 두 Ti 식각액 열 + 범례 (Cu 식각액 열 · 위젯 줄은 넓은 화면에서)
// 오른쪽 그래프 · 아래 막대
const GX0 = 930, GX1 = 1460, GY0 = 616, GY1 = 300;
const BX0 = 470, BW = 900, LG0 = -1, LG1 = 3.5;
const bxv = v => BX0 + BW * (Math.log10(Math.max(v, 1e-3)) - LG0) / (LG1 - LG0);
// 선택비 표 (보통 경향): [재료, 재질, 역할, [Cu 식각액, 묽은 HF, 과산화수소계] 칸 = [점, 색, 글]]
const SEL = [
  ['Cu 시드', 'f-seed2', '지울 것 (먼저)', [['●●●', 'acc', '목표'], ['●', 'ok', '산화제 없으면 느림'], ['●~●●', 'warn', '조성에 따라']]],
  ['Cu 기둥', 'f-cu2', '지킬 것', [['●●●', 'ng', '같은 금속 → 04장'], ['●', 'ok', '받는 쪽 — 보호받음'], ['●~●●●', 'warn', '암모니아만이면 많이']]],
  ['Ni', 'f-ni', '지킬 것', [['●', 'ok', '보통 느림 · 조성 따라'], ['●', 'ok', '느림'], ['●', 'ok', '느림']]],
  ['SnAg 솔더', 'f-sn2', '지킬 것', [['●~●●', 'warn', '산화 · 변색, 황산계 주의'], ['●', 'ok', '표면 변화 (조건 따라)'], ['●~●●', 'warn', 'pH가 높으면 Sn이 녹음']]],
  ['Ti', 'f-ti', '지울 것 (나중)', [['○', 'ok', '멈춤층'], ['●●●', 'acc', '목표 · 매우 빠름'], ['●●', 'acc', '목표 · 느리고 고름']]],
  ['보호막 산화막 SiO₂', 'f-ox', '지킬 것', [['○', 'ok', '거의 안'], ['●●', 'warn', '녹음 — 주의'], ['○~●', 'ok', '거의 안']]],
  ['보호막 질화막 SiN', 'et06-sin', '지킬 것', [['○', 'ok', '거의 안'], ['●~●●', 'warn', '막질 따라 꽤 (PECVD)'], ['○', 'ok', '거의 안']]],
  ['폴리이미드', 'et06-pi', '지킬 것', [['○', 'ok', '거의 안'], ['○', 'ok', '거의 안'], ['●', 'warn', 'pH · 온도가 높으면 주의']]]
];
// 칸 순서(SEL 의 셋째 배열)는 [Cu 식각액, HF, 과산화수소계] 그대로 두고 x 만 바꿔, 두 Ti 식각액을 재료 열 옆에 놓는다 (좁은 화면 viewN 이 재료 + 두 Ti 식각액만 확대)
const COLS = [[1158, 386, 'Cu 식각액 (비교용)', '산성 과산화수소 (먼저 씀)', null], [390, 380, '묽은 HF', 'Ti 식각액 ①', 'hf'], [774, 380, '과산화수소계 + 킬레이트', 'Ti 식각액 ② (Cu 보호 조성)', 'alk']];
const SY0 = 384, SRH = 78;                                      // 표 첫 행 위 · 행 높이
// 작은 분자 (엔진 이온 목록에 없는 것): 동그라미 + 글자
const molS = (x, y, kind, label, r) => `<g class="et06-mol ${kind}" transform="translate(${x} ${y})"><circle r="${r}"/><text y="4.5" text-anchor="middle">${label}</text></g>`;
function molP(kind, label, r, path, dur, delay){
  return `<g class="et06-mol ${kind}"><circle r="${r}"/><text y="4.5" text-anchor="middle">${label}</text><animateMotion dur="${dur}s" begin="-${delay}s" repeatCount="indefinite" path="${path}"/><animate attributeName="opacity" values="0;1;1;0" dur="${dur}s" begin="-${delay}s" repeatCount="indefinite"/></g>`;
}

(window.EngrEtchChapters = window.EngrEtchChapters || []).push({
  no: '06', id: 'ti', part: 2, short: 'Ti · 선택비', scale: '막 · 수십~수백 nm',
  title: 'Ti 식각 — 무엇으로 지우고, 무엇이 함께 다칠까?',
  hook: '빠른 약은 옆도 많이 다친다',
  one: 'Ti는 표면에 아주 얇고 단단한 산화막(TiO₂)을 스스로 만들어 웬만한 산 · 산화제에는 잘 녹지 않습니다. 그래서 Cu와 다른 식각액이 필요합니다. 묽은 불산(HF)은 빠르지만 산화물 보호막도 녹이고, 과산화수소계 식각액은 느리고 고르지만 조성에 따라 Cu · SnAg를 건드릴 수 있습니다.',
  ana: '<b>얼룩 지우개 고르기</b> — 센 지우개는 얼룩(Ti)이 빨리 지워지지만 옷감(보호막)도 상하고, 순한 지우개는 오래 문질러야 하며 다른 색 천(Cu · SnAg)에 물이 들 수 있습니다. <i>(비유의 한계: 지우개와 달리 식각액의 \'세기\'는 하나가 아니라 재료마다 따로 정해집니다. \'Ti에는 세고 다른 것에는 약한\' 액을 고르는 것(선택비)이 핵심이고, 온도 · 농도 · 첨가제로 그 비율이 바뀝니다. 또 센 약은 오래 문지른 만큼이 아니라 \'Ti가 끊긴 뒤의 몇 초\'에 밑동을 가장 많이 팝니다.)</i>',
  steps: [
    {id: 'oxide', t: 'Ti의 갑옷 — 산화막', d: 'Ti는 몇 nm 두께의 산화막을 스스로 만듭니다. 이 막은 공기 중에서도 생기지만, 과산화수소가 든 Cu 식각액 속에서 Cu 과식각 동안 더 자랍니다. 그래서 Cu가 먼저 지워진 곳일수록 Ti 식각이 늦게 시작될 수 있습니다.', viewN: VN_L},
    {id: 'hf', t: '묽은 불산 (HF)', d: '불소가 Ti를 물에 녹는 착이온으로 만들고 수소 거품이 납니다. 아주 빠르지만 SiO₂ 같은 산화물 보호막도 녹입니다. 05장의 갈바닉 때문에, 범프 사이 Ti가 끊긴 뒤에는 넓은 Cu 범프에 붙은 밑동 Ti가 빨리 파입니다.', viewN: VN_L},
    {id: 'alk', t: '과산화수소계 + 킬레이트', d: '과산화수소가 Ti를 산화하고 킬레이트가 녹는 착물로 데려갑니다. 느리고 고르며 산화물 보호막은 거의 그대로입니다. 다만 암모니아는 Cu도 녹이므로(02장), 범프용은 Cu를 덜 녹이는 염기(TMAH 등) · Cu 억제제 · pH로 Cu를 지키고 데워 씁니다.', viewN: VN_L},
    {id: 'sel', t: '선택비 — 무엇이 함께 다치나', d: '두 Ti 식각액과 (비교용) Cu 식각액이 Cu 기둥 · Ni · SnAg · Ti · 보호막에 하는 일을 한 표로 봅니다. 선택비는 지울 막 속도 ÷ 지킬 막 속도이고, 클수록 좋습니다. 표는 보통 경향이고 조성에 따라 크게 달라집니다.', viewN: VN_S}
  ],
  icon(K){
    const {R, C} = K;
    return R(10, 10, 34, 30, 'f-cu2') + R(4, 40, 58, 6, 'f-ti') + R(38, 40, 8, 6, 'f-hole2') + C(52, 30, 4, 'pl-air') + C(56, 20, 3, 'pl-air');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, on, wrap, box} = K;
    let s = `<clipPath id="et06-clip"><rect x="${X0}" y="140" width="${X1 - X0}" height="570"/></clipPath><clipPath id="et06-zc"><rect x="${ZX}" y="${ZY}" width="${ZW}" height="${ZH}" rx="6"/></clipPath>`;
    // ── 왼쪽: 범프 밑동 확대
    let lf = R(40, 130, 760, 590, 'pl-panel', {rx: 14});
    lf += LB(T(60, 168, '범프 밑동 확대 — Cu 식각 직후, Ti가 드러난 때', 't-acc', 'start'), only('oxide')) + `<g class="lbl" data-v="ltitle" data-st="hf alk"></g>`;
    lf += LB(T(60, 198, '가로 1 nm = 0.4 px · 세로는 납작하게 (Ti 100 nm = 20 px)', 't-dim', 'start'));
    lf += R(X0, TB, X1 - X0, 40, 'f-ox', tip('보호막 맨 위 산화막(SiO₂) — 있는 경우의 예시. 보호막 재료는 제품마다 다르다'));
    lf += R(X0, TB + 40, X1 - X0, 64, 'f-pas', tip('보호막 (패시베이션) — 질화막 · 폴리이미드 등. 칩 위를 덮고 패드 자리만 열려 있다'));
    lf += G('<g data-v="L0"></g>', only('oxide'));
    lf += `<g data-v="L1" data-st="hf alk" clip-path="url(#et06-clip)"></g><g data-v="L1t" data-st="hf alk"></g><g data-v="zoom" data-st="hf alk"></g>`;
    lf += LB(T(80, TB + 28, '맨 위 산화막 (SiO₂ · 예시)', 't-sub', 'start') + T(80, TB + 82, '보호막 (질화막 · 폴리이미드 등)', 't-sub', 'start'));
    s += G(lf, on('oxide', 'sel'));

    // ── 오른쪽 위: 그래프 (oxide) · HF 카드 · 과산화수소계 카드
    let rt = R(840, 130, 720, 590, 'pl-panel', {rx: 14});
    rt += G(LB(T(864, 168, '지운 Ti 두께 — 시간에 따라 (개념 그림)', 't-acc', 'start') + T(864, 198, '처음 몇 초는 산화막을 뚫느라 거의 안 지워진다 (유도 시간)', 't-dim', 'start')) + '<g data-v="gr"></g>', only('oxide'));
    const card = (title, head, lines, v) => {
      let g = box(864, 158, 672, 546, title), y = 270;
      g += T(884, 228, head[0], head[1] ? 'et06-eqk' : 'pl-eqn', 'start');
      lines.forEach(([t, c, em]) => { const ln = wrap(t, em || 29); g += TT(884, y, ln, c || 't-sub', 'start', c === 't-dim' ? 25 : 27); y += ln.length * (c === 't-dim' ? 25 : 27) + 9; });
      return G(LB(g) + `<g class="lbl" data-v="${v}"></g>`);
    };
    rt += G(card('묽은 불산 (HF)', ['Ti + 6HF → TiF₆³⁻ + 3H⁺ + 3/2 H₂', 0], [
      ['산화제가 없으면 주로 3가로 녹는다 · Ti 1개당 H₂ 약 1.5개 → 거품', 't-dim', 32],
      ['· 빠르다 — 예시 25 °C 600 nm/분 (농도 · 온도에 따라 다름)'],
      ['· 산화물 보호막(SiO₂ · 유리)도 녹인다 — Ti가 지워진 뒤 과식각 동안 (낮은 온도에서 플라즈마로 쌓은 PECVD 막은 더 빠를 수 있다)'],
      ['· Ti가 끊긴 뒤 갈바닉으로 밑동이 빨라진다 (→ 05장)'],
      ['· 1~2초 차이로 언더컷이 크게 바뀐다 — 헹굼 전환을 일정하게'],
      ['공개 특허: 묽은 HF는 Ti 언더컷이 약 1 µm 이상 — 0.5 µm 이하를 목표로 다른 조성이 제안되어 왔다', 't-dim', 32]
    ], 'cwhf'), only('hf'));
    rt += G(card('과산화수소계 + 킬레이트 (Cu 보호 조성)', ['Ti → (H₂O₂가 산화) → (킬레이트가 감쌈) → 녹는 착물', 1], [
      ['· 느리고 고르다 — 예시 45 °C 30 nm/분, 25 °C 약 7 nm/분'],
      ['· 산화물 보호막은 거의 그대로'],
      ['· 암모니아 + 과산화수소만이면 Cu를 잘 녹인다(02장) → Cu를 덜 녹이는 염기(TMAH 등) · Cu 억제제 · 킬레이트 · pH로 지킨다'],
      ['· Cu가 과산화수소 분해를 도와 Cu 옆이 빨라지고(예시 ×1.5) 액이 빨리 지친다'],
      ['· TiW는 과산화수소로 W를 녹이며 지운다 (데워 쓰는 예가 많다)', 't-dim', 32]
    ], 'cwalk'), only('alk'));
    s += G(rt, on('oxide', 'sel'));

    // ── 아래 패널: oxide = 산화막 이야기 3칸, hf · alk = 결과 막대
    let bt = R(40, 740, 1520, 375, 'pl-panel', {rx: 14});
    let so = LB(T(64, 778, '유도 시간은 어디서 오나 — Cu 식각에서 Ti 식각으로 넘어가는 사이', 't-acc', 'start'));
    const SB = [64, 566, 1068];
    SB.forEach(x => { so += R(x, 796, 470, 304, 'pl-box', {rx: 12}); });
    // ① Cu가 먼저 지워진 곳 — Ti가 과산화수소에 닿는다
    let x = SB[0];
    so += R(x + 20, 862, 430, 14, 'f-ti') + R(x + 20, 840, 170, 22, 'f-seed2', tip('아직 남은 Cu 시드')) + R(x + 190, 858, 260, 4, 'et06-tiox', tip('갓 드러난 Ti 위 산화막'));
    so += molS(x + 250, 830, 'pox', 'H₂O₂', 20) + molS(x + 330, 822, 'pox', 'H₂O₂', 20) + molS(x + 410, 834, 'pox', 'H₂O₂', 20);
    so += LB(T(x + 105, 832, 'Cu 시드', 't-dim'));
    // ② 오래 닿을수록 두껍다
    x = SB[1];
    so += R(x + 20, 862, 430, 14, 'f-ti') + R(x + 20, 858, 200, 4, 'et06-tiox') + R(x + 250, 850, 200, 12, 'et06-tiox', tip('Cu 식각액에 오래 닿아 두꺼워진 TiO₂'));
    so += LB(T(x + 120, 844, '짧게 닿음', 't-dim') + T(x + 350, 838, '오래 닿음 → 두껍다', 't-warn'));
    // ③ 늦게 시작한 곳이 잔여
    x = SB[2];
    so += R(x + 20, 876, 430, 6, 'f-ox') + R(x + 190, 864, 110, 12, 'f-ti', tip('늦게 시작해 레시피 끝에도 남은 Ti — 잔여')) + R(x + 190, 856, 110, 8, 'et06-tiox');
    so += LB(T(x + 245, 844, 'Ti 잔여', 't-warn') + T(x + 90, 864, '다 지움', 't-dim') + T(x + 380, 864, '다 지움', 't-dim'));
    const ST = [['① Ti가 처음 드러나는 곳', 'Cu가 먼저 지워진 곳의 Ti는 공기가 아니라 과산화수소가 든 Cu 식각액 속에서 처음 드러납니다. 과산화수소는 Ti 표면을 산화합니다.'],
      ['② 오래 닿을수록 산화막이 두껍다', 'Cu 과식각 · 단계 사이 시간 · 장비를 옮기며 기다린 시간이 길수록 TiO₂가 자라 Ti 식각이 늦게 시작됩니다 (유도 시간↑).'],
      ['③ 늦게 시작한 곳이 잔여가 된다', '"Ti 잔여 → Cu 과식각을 늘리자"는 거꾸로일 수 있습니다. 단계 사이 시간을 일정하게 두고, 잔여 맵을 Cu 식각 맵과 겹쳐 봅니다 (07장).']];
    ST.forEach(([h, d], k) => { so += LB(T(SB[k] + 20, 920, h, 'pl-hdg', 'start') + TT(SB[k] + 20, 954, wrap(d, 20.5), 't-sub', 'start', 28)); });
    bt += G(so, only('oxide'));
    // 결과 막대 (로그 눈금)
    let bs = '';
    [0.1, 1, 10, 100, 1000].forEach(v => { bs += L(bxv(v), 812, bxv(v), 1034, 'et06-grid') + T(bxv(v), 804, v >= 1000 ? '1,000 nm' : String(v), 't-dim'); });
    bs += R(bxv(500), 814, BX0 + BW - bxv(500), 32, 'et06-mk', tip('Ti 언더컷 0.5 µm 넘음 — 공개 특허가 목표로 든 값 (예시 기준)'));
    bs += LB(T(1536, 1098, '막대 길이: 로그 눈금 (한 칸 = 10배) · 붉은 구역 = 공개 특허의 목표 언더컷 0.5 µm를 넘는 곳', 't-dim', 'end'));
    bt += G(bs + '<g data-v="bars"></g>', only('hf alk'));
    s += G(bt, on('oxide', 'sel'));

    // ── sel: 선택비 표 (무대 전체)
    let tb = R(40, 130, 1520, 985, 'pl-panel', {rx: 14});
    tb += LB(T(64, 172, '선택비 표 — 세 식각액이 각 재료에 하는 일 (보통 경향)', 't-acc', 'start') + T(64, 210, '선택비 = 지울 막 속도 ÷ 지킬 막 속도 — 클수록 지킬 막이 덜 다친다', 'pl-eqn', 'start'));
    tb += '<g data-v="selhl"></g>';
    for (let i = 0; i < SEL.length; i += 2) tb += R(52, SY0 + i * SRH, 1496, SRH, 'et06-cell');
    tb += L(52, SY0, 1548, SY0, 's-axis');
    let th = T(72, 340, '재료', 'pl-hdg', 'start') + T(72, 366, '(이 탭의 색)', 't-dim', 'start');
    COLS.forEach(([cx, , h1, h2]) => { th += T(cx + 18, 340, h1, 'pl-hdg', 'start') + T(cx + 18, 366, h2, 't-dim', 'start'); });
    SEL.forEach(([nm, cls, role, cells], i) => {
      const y = SY0 + i * SRH;
      th += R(72, y + 18, 40, 24, cls) + T(124, y + 37, nm, 'et06-mat', 'start') + T(124, y + 64, role, 't-dim', 'start');
      cells.forEach(([dot, col, txt], j) => { th += T(COLS[j][0] + 18, y + 35, dot, 'et06-dot et06-' + col, 'start') + T(COLS[j][0] + 18, y + 64, txt, 't-sub', 'start'); });
    });
    tb += LB(th) + '<g data-v="self"></g>';
    tb += LB(T(64, 1050, '●●● 잘 녹음 · ●● 조금 · ● 느림 · ○ 거의 안 — 하늘: 지울 것 · 초록: 안전 · 주황: 주의 · 빨강: 다침', 't-sub', 'start') +
      T(64, 1086, '보통 경향 · 조성 · 온도 · 첨가제 · 막질에 따라 크게 다르다 — 내 액 · 내 막은 블랭킷 조각으로 직접 속도를 잰다', 't-dim', 'start'));
    s += G(tb, only('sel'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — Ti 식각액 고르기</div>
      ${K.seg('chem', [['hf', '묽은 HF'], ['alk', '과산화수소계 (Cu 보호 조성)']], 'hf', 'Ti 식각액')}
      ${K.seg('cuinh', [['on', 'Cu 보호제 있음'], ['off', '없음 (암모니아만)']], 'on', 'Cu 보호')}
      ${K.ctl('h', 'Ti 두께 (nm)', 30, 200, 5, 100)}${K.ctl('oe', '과식각 (%, 다 지움 시간 기준)', 0, 100, 5, 30)}${K.ctl('T', '온도 (°C)', 20, 60, 1, 25)}
      ${K.kpis([['다 지움', 'k-t0', '레시피 끝 <span data-o="k-t">–</span>'], ['Ti 언더컷', 'k-u', '밑동, 기둥 테두리부터'], ['±2 s 차이', 'k-e', '언더컷이 이만큼 바뀜'], ['보호막 SiO₂', 'k-ox', '과식각 동안 손실'], ['Cu 기둥', 'k-cu', '옆면 손실']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('묽은 HF: Ti 600 nm/분 @25 °C(Eₐ 30 kJ/mol), 유도 3 s, 다 지운 뒤 옆 가속 G 4(05장 위젯 값), SiO₂ 5 · Cu 2 · SnAg 2 nm/분. 과산화수소계: Ti 30 nm/분 @45 °C(Eₐ 60), 유도 10 s, G 1.5(Cu 촉매), SiO₂ 0.2 · Cu 4(보호제 없음 40) · SnAg 3 nm/분(Eₐ 40). t₀ = 유도 + h ÷ r, t = t₀ × (1 + 과식각), 언더컷 = h + G·r·(t − t₀) — 가속은 범프 사이 Ti가 끊긴 뒤에만 붙습니다. 보호막은 Ti 밑에 있어 과식각 동안만, Cu · SnAg는 처음부터 녹습니다. 상수는 공개 자료 수준의 예시이고, 내 액으로 잰 속도로 바꿔 봐야 합니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, TT, G, LB, tip, wrap} = K;
    const st = {chem: 'hf', inh: 'on', h: 100, oe: 30, T: 25};
    const touched = {};
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const segEl = id => ctx.card.querySelector(`.pl-seg[data-g="${id}"]`);
    const press = (id, v) => segEl(id).querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    const FMT = {h: v => v + ' nm', oe: v => v + ' %', T: v => v + ' °C'};
    const cls = (id, c) => { const k = ctx.card.querySelector(`[data-o="${id}"]`).parentNode; ['ok', 'warn', 'ng'].forEach(x => k.classList.toggle(x, x === c)); };
    const pillar = (xp, yT) => {
      let g = R(X0, PY0, xp - X0, yT - PY0, 'f-cu2', tip('Cu 기둥 — 그 밑의 Cu 시드와 한 몸. 위로 Ni · SnAg 모자 (그림 밖)'));
      let z = `M${X0},${PY0 + 9}`;
      for (let x = X0; x < xp; x += 24) z += ` L${Math.min(xp, x + 12)},${PY0 + 3} L${Math.min(xp, x + 24)},${PY0 + 9}`;
      g += P(z, 'et06-brk');
      // 기둥이 많이 깎여 좁아지면 긴 글은 빼고 짧게 (글이 어두운 액 위로 넘치지 않게)
      const wide = xp - X0 >= 330;
      g += LB(T(80, 272, 'Cu 기둥', 'et06-onc', 'start') + (wide ? T(80, 302, 'Cu 시드와 한 몸 · 위로 수십 µm', 'et06-onc2', 'start') + T(80, 330, '← 범프 중심 쪽 (그림 밖)', 'et06-onc2', 'start') : '') +
        T(80, yT - 22, wide ? `▼ Ti ${st.h} nm (접착 · 방벽층)` : `▼ Ti ${st.h} nm`, 'et06-onc2', 'start'));
      return g;
    };
    // oxide 단계: Ti 식각 직전 (Cu 식각액 속, Ti 위 산화막)
    function left0(){
      const yT = TB - SY * st.h;
      let g = R(XE, PY0, X1 - XE, yT - PY0, 'f-etl', tip('Cu 식각액 — 과산화수소 + 산 (기준 액)'));
      g += R(X0, yT, X1 - X0, SY * st.h, 'f-ti', tip(`Ti ${st.h} nm — 아직 다 남아 있다 (세로는 납작하게)`));
      g += R(XE, yT - 4, 280, 4, 'et06-tiox', tip('TiO₂ 산화막 — 수 nm (그림은 과장)')) + R(700, yT - 9, 80, 9, 'et06-tiox', tip('먼저 드러나 Cu 식각액에 오래 닿은 곳 — 산화막이 더 두껍다'));
      g += pillar(XE, yT);
      g += G(K.lead(560, yT - 3, 470, 300, '산화막 TiO₂ — 수 nm (과장)', 'start', 't-sub'));
      g += L(744, yT - 10, 744, 386, 's-lead') + C(744, yT - 10, 3.5, 'k-lead') + LB(T(770, 346, '먼저 드러난 곳 — 더 두껍다', 't-warn', 'end') + T(770, 374, '(Cu 식각액에 더 오래 닿음)', 't-dim', 'end'));
      g += LB(TT(60, 640, ['Ti 식각액에 들어가기 전 — Ti 위 산화막(TiO₂)이', 'HF · 과산화수소계 어느 쪽이든 Ti 식각의 출발을 늦춘다', '→ 오른쪽 그래프 · 아래 세 칸'], 't-sub', 'start', 28));
      g += LB(T(770, 248, 'Cu 식각액 (과산화수소 + 산) 속', 't-acc', 'end'));
      const mj = (x, y, sd) => { const r = K.rng(sd); let d = `M${x},${y}`; for (let k = 0; k < 4; k++) d += ` L${(x + (r() - 0.5) * 18).toFixed(1)},${(y + (r() - 0.5) * 12).toFixed(1)}`; return `<g class="et06-mol pox"><circle r="20"/><text y="4.5" text-anchor="middle">H₂O₂</text><animateMotion dur="${(3.5 + r() * 2).toFixed(1)}s" begin="-${(r() * 3).toFixed(1)}s" repeatCount="indefinite" path="${d} Z"/></g>`; };
      g += G(mj(462, yT - 46, 3) + mj(552, yT - 62, 5) + mj(640, yT - 44, 9), {'data-noov': '1'});
      return g;
    }
    // hf · alk 단계: 레시피 끝 (t)
    function left1(m){
      const yT = TB - SY * st.h, rx = SX * st.h, ry = SY * st.h;
      // 기둥 옆 깎임은 그림에서 기둥 폭 150 px 까지만 (보호제 없음 · 상온 · 긴 시간이면 1 µm 넘게 깎여 그림 밖)
      const XPMIN = X0 + 150, cuClip = XE - SX * m.cu < XPMIN;
      const xp = Math.max(XPMIN, XE - SX * m.cu), xb = XE - SX * (m.u - st.h), xt = xb - rx, xbc = Math.max(X0, xb), xtc = Math.max(X0, xt);
      const xl = Math.max(X0, Math.min(xp, xt));
      let art = R(xl, PY0, X1 - xl, TB + 40 - PY0, 'f-etl', tip(`${CH[st.chem].nm} — Ti 식각액`));
      art += R(X0 - 200, TB, X1 - X0 + 200, 40, 'f-ox');
      // 보호막 산화막: Ti가 지워진 곳만 깎인다 (밑동 쪽은 과식각 동안 차례로 드러나 덜 깎임)
      const d = Math.min(36, OXP * m.ox);
      if (d > 0.4){
        const pts = `${xbc},${TB} ${Math.max(xbc, XE)},${(TB + d).toFixed(1)} ${X1},${(TB + d).toFixed(1)} ${X1},${TB}`;
        art += `<polygon points="${pts}" class="et06-er"/><polygon points="${pts}" class="f-etl"/>` + L(xbc, TB, X1, TB, 'pl-ghost', tip('보호막의 처음 윗면'));
      }
      art += P(`M${X0 - 200},${yT.toFixed(1)} L${xt.toFixed(1)},${yT.toFixed(1)} A${rx.toFixed(1)},${ry.toFixed(1)} 0 0 0 ${xb.toFixed(1)},${TB} L${X0 - 200},${TB} Z`, 'f-ti', tip(`남은 Ti — 밑동 언더컷 ${nf(m.u)} nm (위쪽 가장자리 기준)`));
      art += R(X0 - 200, PY0, xp - X0 + 200, yT - PY0, 'f-cu2', tip('Cu 기둥 — 그 밑의 Cu 시드와 한 몸. 위로 Ni · SnAg 모자 (그림 밖)'));
      // 기둥 위에 덧그리는 것 (본 그림에서 기둥을 다시 그린 뒤에 놓아야 보인다): ±2 s 띠 · Cu 억제제 막 · 처음 테두리
      let over = R(xt - SX * m.e2, yT, Math.max(2, 2 * SX * m.e2), ry, 'et06-band', tip(`±2 s 차이 → Ti 가장자리가 이 띠 안에서 ±${nf(m.e2)} nm 움직인다`));
      if (st.chem === 'alk' && st.inh === 'on') over += L(xp + 3, PY0 + 12, xp + 3, yT - 2, 'et06-inh', tip('Cu 억제제 — Cu 표면에 얇게 붙어 Cu가 녹는 것을 늦춘다'));
      if (XE - xp > 2 || XE - xt > 2) over += L(XE, PY0 + 14, XE, TB, 'pl-ghost', tip('처음 테두리 — 기둥 옆면 · Ti 가장자리'));
      let g = art + pillar(xp, yT) + over;
      // 움직이는 것: HF는 F⁻ → TiF₆³⁻, 전자는 Ti → Cu 기둥(금속 안) → Cu 겉에서 H₂ 거품(받는 쪽). 과산화수소계는 H₂O₂ → Ti 착물
      let mv = '';
      if (st.chem === 'hf'){
        [[xp + 7, yT - 14, 0], [xp + 7, yT - 64, 0.9], [xp + 8, 380, 0.3], [xp + 7, 330, 1.3], [XE + 10, TB - 8, 0.6], [XE + 34, TB - 6, 1.6]].forEach(([bx, by, dl], k) => { mv += K.bubble(bx, by, 4 + (k % 3), 50, 1.6 + (k % 3) * 0.4, dl); });
        mv += molP('f', 'F⁻', 13, `M770,432 Q620,440 ${XE + 12},${TB - 10}`, 4.2, 0) + molP('f', 'F⁻', 13, `M770,462 Q620,476 ${XE + 12},${TB - 10}`, 4.2, 2.1);
        mv += molP('tif', 'TiF₆³⁻', 24, `M${XE + 22},${TB - 14} Q560,450 700,434`, 5, 1.2);
        mv += K.mover(xtc + 10, yT - 6, xp - 10, yT - 64, 6, 'k-e', 1.6, 0) + K.mover(xtc + 10, yT - 6, xp - 10, yT - 64, 6, 'k-e', 1.6, 0.8);
      } else {
        mv += molP('pox', 'H₂O₂', 20, `M770,408 Q620,420 ${XE + 16},${TB - 12}`, 4.6, 0) + molP('pox', 'H₂O₂', 20, `M770,462 Q640,472 ${XE + 16},${TB - 12}`, 4.6, 2.3);
        mv += molP('tic', 'Ti 착물', 26, `M${XE + 22},${TB - 14} Q560,440 690,410`, 5.4, 1.4);
      }
      g += G(mv, {'data-noov': '1'});
      ctx.$('[data-v="L1"]').innerHTML = g;
      // 가장자리 확대 (오른쪽 아래 작은 창): 같은 그림을 키워 Ti 끝 · ±2 s 띠 · 보호막 깎임을 보인다
      const wh = ry + 28, kz = Math.min(3, ZH / wh), ww = ZW / kz, wx0 = Math.max(X0 - 20, Math.min(XE + 12 - ww, xt - 12)), wy0 = yT - 12;
      ctx.$('[data-v="zoom"]').innerHTML = G(`<g transform="translate(${(ZX - wx0 * kz).toFixed(1)} ${(ZY - wy0 * kz).toFixed(1)}) scale(${kz.toFixed(3)})">${art}${over}</g>`, {'clip-path': 'url(#et06-zc)'}) +
        R(ZX, ZY, ZW, ZH, 'et06-zf', {rx: 6}) + LB(T(ZX + ZW - 8, ZY + ZH - 10, `가장자리 ×${kz.toFixed(1)}`, 'et06-zl', 'end'));
      // 글 · 치수선 (잘리지 않게 따로)
      let tx = '';
      const DY = 622, mid = (XE + xtc) / 2, lx = Math.max(150, Math.min(300, mid));
      tx += R(Math.max(X0, wx0), wy0, Math.min(X1, wx0 + ww) - Math.max(X0, wx0), wh, 'et06-zw', tip('오른쪽 아래 확대 창이 보여 주는 곳'));
      tx += L(XE, yT, XE, DY + 12, 's-dash') + L(xtc, yT, xtc, DY + 12, 's-dash');
      if (XE - xtc > 26) tx += K.arrow(mid, DY, XE - 2, DY, 's-arr2') + K.arrow(mid, DY, xtc + 2, DY, 's-arr2');
      if (xt < X0) tx += K.arrow(110, DY, X0 + 2, DY, 's-arr2');
      tx += LB(T(lx, 656, `Ti 언더컷 ${nf(m.u)} nm${xt < X0 ? ' (그림 밖)' : ''}`, 't-warn') + T(lx, 688, `±2 s 차이 → ±${nf(m.e2)} nm`, 'et06-bandt'));
      tx += LB(T(770, TB + 28, m.ox > 0 ? `−${nf(m.ox)} nm (${OXP * m.ox > 36 ? '100배 과장 · 잘림' : '세로 100배 과장'})` : '깎임 없음 (과식각 0 %)', 't-warn', 'end'));
      tx += LB(T(770, 248, `${CH[st.chem].nm} · ${st.T} °C`, 't-acc', 'end') + (XE - xp > 2 || XE - xt > 2 ? T(XE + 8, 248, '처음 테두리', 't-dim', 'start') : ''));
      const gl = st.chem === 'hf' ? ['범프 사이 Ti가 끊긴 뒤에는', '밑동 Ti = 녹는 쪽 (애노드)', '넓은 Cu 기둥 = 받는 쪽 (캐소드)', 'e⁻는 금속 안으로 → Cu 위에서 H₂', '→ 옆으로 약 4배 빨리 (05장)'] :
        ['H₂O₂가 Ti를 산화하고', '킬레이트가 녹는 착물로 데려간다', 'Cu 옆은 H₂O₂ 분해가 빨라', '조금 더 빠르다 (×1.5, 예시)'];
      tx += LB(TT(446, 290, gl, 't-sub', 'start', 28));
      if (st.chem === 'hf') tx += LB(T(xp - 18, yT - 50, 'e⁻', 'et06-onc', 'end'));
      // Cu 옆 깎임: 기둥이 넓으면 기둥 안에, 좁아지면 기둥 밖(액 쪽)에
      const cuT = `Cu 옆 −${nf(m.cu)} nm${cuClip ? ' (그림 밖)' : ''}`;
      tx += LB(xp - X0 >= 300 ? T(xp - 10, 366, cuT + ' →', 'et06-onc2', 'end') : T(xp + 12, yT - 34, '← ' + cuT, 'et06-cul', 'start'));
      if (st.chem === 'alk' && st.inh === 'on') tx += LB(T(xp - 10, 400, 'Cu 억제제 막 →', 'et06-onc2', 'end'));
      ctx.$('[data-v="L1t"]').innerHTML = tx;
      ctx.$('[data-v="ltitle"]').innerHTML = T(60, 168, `범프 밑동 확대 — Ti 식각 레시피 끝 (t = ${tfk(m.t)})`, 't-acc', 'start');
    }
    // oxide 단계 그래프: 보통 곳 vs 산화막이 두꺼운 곳(유도 2배 — 예시)
    function graph(m){
      const ind2 = 2 * m.ind, t02 = ind2 + st.h / m.rs, tmax = m.t * 1.12;
      const gx = v => GX0 + Math.min(v, tmax) / tmax * (GX1 - GX0), gy = d => GY0 - Math.min(d, st.h) / st.h * (GY0 - GY1);
      const xi = gx(m.ind), x0 = gx(m.t0), xt = gx(m.t), xi2 = gx(ind2), x02 = gx(t02);
      let g = R(x0, GY1, xt - x0, GY0 - GY1, 'et06-oez', tip('과식각 — Ti는 다 지워졌고 밑동만 옆으로 녹는 시간'));
      g += L(GX0, GY0, GX1 + 30, GY0, 's-axis') + L(GX0, GY0, GX0, GY1 - 16, 's-axis') + L(GX0 - 6, GY1, GX1, GY1, 's-dash');
      const step = [1, 2, 5, 10, 20, 30, 60, 120, 300, 600].find(v => tmax / v <= 6) || 1200;
      for (let v = 0; v <= tmax; v += step) g += L(gx(v), GY0, gx(v), GY0 + 7, 's-axis') + T(gx(v), GY0 + 28, String(v), 't-dim');
      g += LB(T(1548, GY0 + 6, '시간 (s)', 't-dim', 'end') + T(GX0 - 10, GY0 + 6, '0', 't-dim', 'end') + T(GX0 - 10, GY1 + 7, `${st.h} nm`, 't-dim', 'end') + T(GX0 + 8, GY1 - 24, '↑ 지운 Ti 두께', 't-dim', 'start'));
      g += L(x0, GY0, x0, GY1, 's-dash');
      g += P(`M${GX0},${GY0} L${xi.toFixed(1)},${GY0} L${x0.toFixed(1)},${GY1} L${xt.toFixed(1)},${GY1}`, 's-curve', tip(`보통 곳 — 유도 ${m.ind} s 뒤 ${nf(m.r)} nm/분`));
      const done2 = t02 <= m.t + 1e-6;
      const yEnd2 = done2 ? GY1 : gy(Math.max(0, m.rs * (m.t - ind2)));
      g += P(`M${GX0},${GY0 - 3} L${xi2.toFixed(1)},${GY0 - 3} L${(done2 ? x02 : xt).toFixed(1)},${yEnd2.toFixed(1)}${done2 ? ` L${xt.toFixed(1)},${GY1}` : ''}`, 's-curve2', tip(`산화막이 두꺼운 곳 — 유도 ${ind2} s (예시: 2배)`));
      g += L(xt, GY0, xt, GY1 - 40, 'pl-peak');
      if (!done2) g += C(xt, yEnd2, 8, 'k-ng') + C(xt, yEnd2, 16, 'co-ring');
      // 이름표
      let lb = L(GX0 + 16, GY1 + 34, GX0 + 56, GY1 + 34, 's-curve') + T(GX0 + 66, GY1 + 41, '보통 곳', 't-acc', 'start') +
        L(GX0 + 16, GY1 + 70, GX0 + 56, GY1 + 70, 's-curve2') + T(GX0 + 66, GY1 + 77, '산화막 두꺼운 곳', 't-warn', 'start') + T(GX0 + 66, GY1 + 103, '(유도 2배 — 예시)', 't-dim', 'start');
      lb += T(x0 - 8, GY1 - 10, `다 지움 ${tf(m.t0)}`, 't-dim', 'end');
      const ew = 170;
      lb += T(Math.min(xt, 1548 - ew / 2), GY1 - 48, `레시피 끝 ${tf(m.t)}`, 'pl-pkt');
      if (xt - x0 > 70) lb += T((x0 + xt) / 2, GY0 - 14, '과식각', 'et06-oet');
      lb += T(Math.max(GX0 - 4, xi - 12), GY0 + 56, `↑ 유도 ${m.ind} s (산화막을 뚫는 시간)`, 't-dim', 'start');
      lb += done2 ? T(864, GY0 + 88, `두꺼운 곳도 끝 전에 다 지움 (여유 ${tf(m.t - t02)})`, 't-sub', 'start') :
        T(864, GY0 + 88, `두꺼운 곳은 Ti가 ${nf(st.h - m.rs * Math.max(0, m.t - ind2))} nm 남는다 — 과식각이 모자람`, 'pl-warn', 'start');
      ctx.$('[data-v="gr"]').innerHTML = g + LB(lb);
    }
    function bars(m){
      let g = LB(T(64, 778, `레시피 끝에서 — ${CH[st.chem].nm}${st.chem === 'alk' ? (st.inh === 'on' ? ' (Cu 보호제 있음)' : ' (보호제 없음)') : ''} · Ti ${st.h} nm · 과식각 ${st.oe} % · ${st.T} °C → t = ${tfl(m.t)}`, 't-acc', 'start'));
      const rows = [['Ti 언더컷 (밑동)', m.u, 'et06-bu', ''], ['±2 s 차이 → 언더컷', m.e2, 'et06-be', '±'], ['보호막 산화막 손실', m.ox, 'et06-bo', ''], ['Cu 기둥 손실 (옆면)', m.cu, 'et06-bc', ''], ['SnAg 겉 손실', m.sn, 'et06-bs', '']];
      rows.forEach(([nm, v, c, pre], i) => {
        const y = 816 + i * 46, w = v > 0 ? Math.max(3, bxv(v) - BX0) : 0;
        g += LB(T(64, y + 21, nm, 't-sub', 'start'));
        if (w > 0) g += R(BX0, y, w, 28, c, {rx: 4});
        g += LB(T(BX0 + w + 12, y + 21, `${pre}${nf(v)} nm`, i < 2 ? 't-warn' : 't-sub', 'start'));
      });
      const msg = st.chem === 'hf' ? `빠르지만 2초 차이로 언더컷이 ±${nf(m.e2)} nm 바뀝니다. ` + (m.tov > 0 ? `Ti가 끊긴 뒤의 과식각 ${tf(m.tov)} 동안 밑동이 가장 빨리 파입니다.` : '과식각 0 % — 밑동은 덜 파이지만 늦게 시작한 곳에 Ti가 남을 수 있습니다.') :
        st.inh === 'off' ? `보호제가 없으면 Cu 기둥이 ${nf(m.cu)} nm 얇아집니다 — 암모니아 + 과산화수소는 Cu를 잘 녹입니다.` :
        `느리고 고르지만(±2 s → ±${nf(m.e2)} nm) Cu · SnAg가 ${tfl(m.t)} 동안 액에 닿습니다.${st.T < 35 ? ' 상온에서는 너무 느려 보통 데워 씁니다.' : ''}`;
      g += LB(T(64, 1066, msg, 't-sub', 'start'));
      ctx.$('[data-v="bars"]').innerHTML = g;
    }
    function selw(m){
      const col = COLS.find(c => c[4] === st.chem);
      ctx.$('[data-v="selhl"]').innerHTML = R(col[0] - 4, 312, col[1] + 8, SRH * SEL.length + 82, 'pl-hlbox', {rx: 10});
      const sOx = m.r / m.rox, sCu = m.r / m.rcu, sSn = m.r / m.rsn;
      const t1 = `위젯 (${CH[st.chem].nm}${st.chem === 'alk' && st.inh === 'off' ? ' · 보호제 없음' : ''} · ${st.T} °C): Ti ${nf(m.r)} · SiO₂ ${nf(m.rox)} · Cu ${nf(m.rcu)} · SnAg ${nf(m.rsn)} nm/분 → 선택비 Ti/SiO₂ ${nf(sOx)} · Ti/Cu ${nf(sCu)} · Ti/SnAg ${nf(sSn)}`;
      const t2 = `레시피 끝 손실: 보호막 SiO₂ ${nf(m.ox)} nm (Ti 밑이라 과식각 동안만 닿음) · Cu 기둥 ${nf(m.cu)} nm · SnAg ${nf(m.sn)} nm (처음부터 닿음) — 식은 「한 걸음 더」`;
      ctx.$('[data-v="self"]').innerHTML = LB(T(64, 248, t1, 't-sub', 'start') + T(64, 280, t2, 't-dim', 'start'));
    }
    function render(){
      const m = calc(st);
      // Cu 보호제 선택은 과산화수소계에서만 — 줄을 숨기면 카드 높이가 바뀌어 (좁은 화면) 스크롤 위치로 단계가 다시 정해지므로 흐리게만 한다
      const ci = segEl('cuinh'), nin = st.chem !== 'alk';
      ci.style.opacity = nin ? '.4' : ''; ci.title = nin ? '과산화수소계에서만 쓰는 선택입니다' : '';
      ci.querySelectorAll('button').forEach(b => { b.disabled = nin; });
      ctx.$('[data-v="L0"]').innerHTML = left0();
      left1(m); graph(m); bars(m); selw(m);
      const cw = st.chem === 'hf' ? 'cwhf' : 'cwalk';
      // 카드 아래: 시간 막대 (유도 · 범프 사이 Ti · 끊긴 뒤 과식각) + 지금 값
      const TX0 = 884, TW = 632, tx = v => TX0 + TW * v / m.t;
      let tb = T(TX0, 560, 'Ti 식각 시간 (위젯) — 밑동은 언제 빨리 파이나', 't-dim', 'start');
      const hf = st.chem === 'hf';
      tb += R(TX0, 574, tx(m.ind) - TX0, 26, 'et06-tind', tip(`유도 ${m.ind} s — 산화막을 뚫는 중`)) + R(tx(m.ind), 574, tx(m.t0) - tx(m.ind), 26, 'et06-tfld', tip(hf ? '범프 사이 Ti가 위에서부터 녹는 중 — 녹는 Ti가 넓어 갈바닉 가속이 거의 없다 (면적비 ≈ 1.1, 05장)' : '범프 사이 Ti가 위에서부터 녹는 중 — 밑동은 아직 옆으로 드러나지 않았다'));
      if (m.tov > 0) tb += R(tx(m.t0), 574, TX0 + TW - tx(m.t0), 26, 'et06-tov', tip(hf ? `Ti가 끊긴 뒤 과식각 ${tf(m.tov)} — 밑동 Ti 고리만 남아 갈바닉으로 옆으로 ×${m.G} (05장)` : `다 지운 뒤 과식각 ${tf(m.tov)} — 밑동만 옆으로 녹는다. Cu 옆은 H₂O₂ 분해가 빨라 ×${m.G} (예시)`));
      tb += T(tx(m.ind) + 8, 624, hf ? '범프 사이 Ti — 가속 거의 없음' : '범프 사이 Ti가 녹는 중', 't-dim', 'start');
      if (m.tov > 0) tb += T(TX0 + TW, 624, `${hf ? '끊긴' : '다 지운'} 뒤 옆 ×${m.G}`, 't-warn', 'end');
      tb += TT(TX0, 662, st.chem === 'hf' ? [`지금 ${st.T} °C: Ti ${nf(m.r)} nm/분 · 다 지움 ${tf(m.t0)}`, `±2 s 차이 → 언더컷 ±${nf(m.e2)} nm`] :
        [`지금 ${st.T} °C: Ti ${nf(m.r)} nm/분 · 다 지움 ${tfl(m.t0)}`, `Cu 보호제 ${st.inh === 'on' ? '있음' : '없음'} → Cu 기둥 −${nf(m.cu)} nm`], 'et06-now', 'start', 28);
      ctx.$(`[data-v="${cw}"]`).innerHTML = tb;
      ctx.refresh();
      ctx.out('k-t0', tfk(m.t0)); ctx.out('k-t', tfk(m.t)); ctx.out('k-u', nf(m.u) + ' nm'); ctx.out('k-e', '±' + nf(m.e2) + ' nm'); ctx.out('k-ox', nf(m.ox) + ' nm'); ctx.out('k-cu', nf(m.cu) + ' nm');
      cls('k-t0', m.t0 < 10 || m.t0 > 600 ? 'warn' : 'ok');
      cls('k-u', m.u > 500 ? 'ng' : m.u > 300 ? 'warn' : 'ok');
      cls('k-e', m.e2 > 100 ? 'ng' : m.e2 > 10 ? 'warn' : 'ok');
      cls('k-ox', m.ox > 2 ? 'ng' : m.ox > 0.5 ? 'warn' : 'ok');
      cls('k-cu', m.cu > 100 ? 'ng' : m.cu > 30 ? 'warn' : 'ok');
      let msg = st.chem === 'hf' ? `<b>묽은 HF</b> — Ti를 ${tf(m.t0)}에 다 지웁니다. 빠르지만 2초 차이로 언더컷이 <b>±${nf(m.e2)} nm</b> 바뀝니다. ` + (m.tov > 0 ? `범프 사이 Ti가 끊긴 뒤의 과식각(${tf(m.tov)})이 밑동을 가장 빨리 팝니다(옆 ×${m.G}). 보호막 맨 위가 산화막이면 손실도 봅니다.` : '과식각 0 %면 언더컷은 Ti 두께 정도지만, 늦게 시작한 곳(산화막이 두꺼운 곳)에 Ti가 남습니다.') :
        st.inh === 'off' ? `<b>보호제 없음</b> — 암모니아 + 과산화수소는 Cu를 잘 녹입니다. Cu 기둥이 약 <b>${nf(m.cu)} nm</b> 얇아집니다(보호제가 있으면 약 ${nf(calc(Object.assign({}, st, {inh: 'on'})).cu)} nm).` :
        `<b>과산화수소계</b> — 느리고 고릅니다(±2 s → ±${nf(m.e2)} nm). 대신 Cu · SnAg가 ${tfl(m.t)} 동안 액에 닿습니다.${st.T < 35 ? ' 상온에서는 너무 느려 보통 데워 씁니다(예: 45 °C).' : ''}`;
      if (m.u > 500) msg += ` <b>언더컷 ${nf(m.u)} nm</b> — 공개 특허가 목표로 든 0.5 µm를 넘습니다.`;
      if (m.t0 < 10) msg += ' 다 지움이 10초 안쪽이면 노즐 · 회전 · 헹굼 전환의 1~2초가 큰 몫이 됩니다.';
      else if (m.t0 > 600) msg += ' 다 지움이 10분을 넘어 처리량이 크게 떨어집니다.';
      ctx.q('[data-o=msg]').innerHTML = msg;
    }
    ['h', 'oe', 'T'].forEach(id => {
      ctx.range(id, v => { st[id] = v; render(); return FMT[id](v); });
      inp(id).addEventListener('input', () => { touched[id] = true; });
    });
    ctx.seg('cuinh', (v, user) => { st.inh = v; if (user) touched.inh = true; render(); });
    // 식각액: hf · alk 단계에서 고르면 그 단계로 간다 (카드 · 장면이 같은 액을 보이게)
    ctx.seg('chem', (v, user) => {
      st.chem = v;
      if (user){ touched.chem = true; const s = ctx.step(); if ((s === 'hf' || s === 'alk') && s !== v){ ctx.go(v); return; } }
      render();
    });
    // 손대지 않은 값은 단계마다 예시 값으로 (발표 모드 대비). hf · alk 단계는 식각액을 단계에 맞춘다
    ctx.demo = sid => {
      const d = DEMO[sid];
      if (!d) return;
      if (sid === 'hf' || sid === 'alk') st.chem = sid;
      else if (!touched.chem && d.chem) st.chem = d.chem;
      if (!touched.inh && d.inh) st.inh = d.inh;
      ['h', 'oe', 'T'].forEach(k => { if (!touched[k] && d[k] != null){ st[k] = d[k]; inp(k).value = d[k]; ctx.out(k, FMT[k](d[k])); } });
      press('chem', st.chem); press('cuinh', st.inh);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['부동태 (산화막)', '금속 표면의 얇은 산화막이 녹는 반응을 막는 상태. Ti는 TiO₂ 막으로 쉽게 부동태가 된다'],
      ['유도 시간', '식각이 눈에 띄게 시작되기 전, 산화막을 뚫는 동안의 시간'],
      ['불산 (HF)', '플루오린화수소 수용액. Ti · 산화물(SiO₂ · 유리)을 녹인다. 피부로 스며드는 독성 — 전용 보호구 · 해독 연고 등 안전 절차를 따른다'],
      ['킬레이트제', '금속 이온을 여러 팔로 감싸 녹게 하거나 붙잡아 두는 분자 (EDTA 계열, 에틸렌디아민 계열 등)'],
      ['Cu 억제제', 'Cu 표면에 얇게 붙어 Cu가 녹는 것을 늦추는 첨가제'],
      ['선택비', '지울 막 속도 ÷ 지킬 막 속도. 클수록 지킬 막이 덜 다친다. 온도 · 조성에 따라 바뀐다'],
      ['TiW', 'Ti와 W의 합금 막. Ti 대신 쓰기도 하며, 과산화수소로 W를 녹이며 지운다'],
      ['보호막 (패시베이션)', '칩 위를 덮는 절연막 — 산화막 · 질화막 · 폴리이미드 등. 패드 자리만 열려 있고, 시드 식각 때 Ti 바로 밑에 있다']
    ]) + K.field([
      'Ti 잔여가 늘면 Cu 과식각 시간 · Cu 식각액 산화제 농도 · 단계 사이 시간을 함께 봅니다. Ti가 먼저 드러난 곳일수록 과산화수소에 오래 닿아 산화막이 두꺼워 Ti 식각이 늦게 시작됩니다. \'Ti 잔여 → Cu 과식각을 늘리자\'는 거꾸로일 수 있습니다 → <a data-go="end.map">07장</a>.',
      '같은 챔버에서 Cu 식각 → 헹굼 → Ti 식각을 이어 하면 몇 초 사이라 공기 중 대기는 작은 몫입니다. 챔버나 장비를 옮기면 건조 · 대기 시간이 끼어 큰 몫이 될 수 있습니다. 단계 사이 시간을 일정하게 둡니다.',
      '보호막 맨 위가 산화막이거나 PECVD(낮은 온도에서 플라즈마로 쌓은) 질화막이면 HF 계열에서 손실을 잽니다(블랭킷 조각 · 두께 측정). 폴리이미드면 높은 pH · 온도에서 표면 변화를 봅니다.',
      'Cu 식각과 Ti 식각 사이 헹굼이 모자라면 Cu²⁺가 Ti 식각액으로 넘어갑니다. HF에서는 맨몸 Ti 위에 Cu가 석출하고(<a data-go="galv.bump">05장</a>), 과산화수소계에서는 과산화수소 분해가 빨라져 액 수명이 짧아집니다 → <a data-go="tool.bath">08장</a>.',
      '식각액을 바꾸면 SnAg 표면 상태가 바뀌어 리플로우 결과(젖음 · 모양)가 달라질 수 있습니다. 바꿀 때는 리플로우 뒤까지 확인합니다 → <a href="#go-reflow-03">리플로우 03장</a>.'
    ]) + K.deep(`${K.eq('t₀ = 유도 시간 + h ÷ r_Ti,  t = t₀ × (1 + 과식각)')}${K.eq('Ti 언더컷 u = h + G · r_Ti · (t − t₀)   (G는 범프 사이 Ti가 끊긴 뒤에만)')}
      <ul><li><b>HF와 Ti</b> — 산화제가 없는 HF에서 Ti는 주로 3가로 녹습니다: Ti + 6HF → TiF₆³⁻ + 3H⁺ + 3/2 H₂ (Ti 1개당 H₂ 약 1.5개 — 거품). TiF₆²⁻(4가)는 과산화수소를 섞은 Ti 식각액(예: H₂O : H₂O₂ : HF = 20 : 1 : 1)이나 그 뒤 공기 산화에서 나옵니다. HF는 Ti 금속을 산화막보다 훨씬 빨리 녹이므로(공개 특허) 처음 몇 초(산화막) 뒤 갑자기 빨라집니다. 공개 연구(1961)는 HF 속 Ti 용해의 활성화 에너지를 약 29 kJ/mol(6.9 kcal/mol), 차수 약 0.76으로 보고하고 확산(공급) 지배로 해석했습니다 — Ti 식각도 흐름(담금 vs 스프레이)에 따라 달라질 수 있다는 뜻입니다(<a data-go="rate.which">03장</a>). 반응 지배로 본 연구도 있어 조건에 따라 다릅니다.</li>
      <li><b>Cu 과식각과 유도 시간</b> — Ti가 처음 드러나는 곳은 공기가 아니라 과산화수소가 든 Cu 식각액 속입니다. Cu가 먼저 지워진 곳의 Ti는 Cu 과식각 내내 산화되어 산화막이 자랍니다. 그래서 Ti 식각의 시작 시점이 고르지 않은 주된 원인은 Cu 과식각 시간과 그 맵입니다(<a data-go="end.map">07장</a>). 위젯 그래프의 '두꺼운 곳(유도 2배)'은 이 차이를 보이는 예시이고, 실제 배수는 산화제 농도 · 시간 · 온도에 따라 다릅니다.</li>
      <li><b>HF의 대가 — 가속은 왜 '다 지운 뒤'에 붙나</b> — 범프 사이 Ti가 이어져 있는 동안은 녹는 Ti가 넓어 면적비가 약 1.1입니다. 범프 사이 Ti가 끊기는 순간 범프마다 밑동 Ti 고리(두께 × 둘레)만 남아 면적비가 약 360으로 뛰고 옆 식각이 갑자기 빨라집니다(<a data-go="galv.area">05장</a>: 반응 지배 · k 0.04 → 약 4배). 그래서 HF 과식각 1~2초가 언더컷을 크게 바꿉니다. 공개 특허: 묽은 HF로 Ti를 지우면 언더컷이 약 1 µm 이상이었고 0.5 µm 이하를 목표로 다른 조성이 제안되었습니다. Ti 두께의 5~10배 언더컷이 흔하다는 기술도 있고, HF로 Ti 장벽층을 지운 다른 공개 특허(큰 범프 · 예전 공정)는 범프 밑 언더컷이 약 10 µm까지 들어가 들뜸을 걱정해 식각 → 헹굼 전환을 1초 안으로 줄였습니다.</li>
      <li><b>과산화수소계 + 킬레이트</b> (공개 특허 예) — 과산화수소 + 암모니아 또는 TMAH + 에틸렌디아민계 킬레이트 + 알코올류. 과산화수소가 너무 적으면 찌꺼기가 남고, 너무 많으면 막이 지나치게 산화된다는 기술이 있습니다. 다만 수산화암모늄 + 과산화수소는 솔더 · Ti보다 Cu를 먼저 공격한다는 공개 특허가 있고(<a data-go="chem.fam">02장</a> 암모니아 계열과 같은 이유), SC1(암모니아 + 과산화수소 세정액) 계열 액은 Cu가 있으면 과산화수소가 빨리 분해됩니다. 그래서 Cu 범프 옆에서는 Cu를 착화하지 않는 염기(TMAH 등) · Cu 억제제 · 킬레이트 선택 · pH 창이 함께 있어야 Cu를 지킵니다. Cu가 드러난 곳 가까이 TiW 식각이 훨씬 빨랐다는 보고(Cu가 과산화수소 분해를 도움)와, 킬레이트의 종류 · 양이 Cu 옆 언더컷을 크게 바꾼다는 공개 특허도 있습니다 — 위젯의 G 1.5는 이 효과의 예시 값입니다.</li>
      <li><b>TiW와 납 솔더 시절의 처방</b> — TiW는 H₂O₂가 W를 텅스텐산으로 녹이며 함께 지웁니다. 상온에서는 매우 느리고(공개 특허: 30 % H₂O₂ 상온 약 1.5 nm/분) 40~60 °C에서 빨라집니다. 납-주석(Pb–Sn) 솔더를 쓰던 공개 특허 예는 과산화수소 + EDTA(W 착화) + 황산칼륨(솔더 겉 보호막)을 40~60 °C에서 썼고 pH 약 2.7~4.0 창을 두었습니다. 이 보호막은 잘 안 녹는 납 황산염에 기댄 것으로 보여, 납이 없는 SnAg에는 그대로 옮길 수 없어 억제제 · pH를 따로 고릅니다.</li>
      <li><b>질화막 보호막과 HF</b> — 웨이퍼 앞면 질화막 보호막은 보통 저온 PECVD 막이라 막질(수소 함량 · Si/N 비)에 따라 HF에서 꽤 빨리 녹을 수 있습니다(공개 식각 속도 표: LPCVD와 PECVD 질화막의 HF 속도 차가 큼). 폴리이미드 위에 스퍼터한 Ti는 폴리이미드의 탄소와 반응층을 만들어 보통의 Ti 식각액으로 잘 안 지워지고 이웃 배선 사이 누설이 된다는 공개 특허도 있습니다 — 보호막 재료가 바뀌면 Ti 식각을 다시 확인합니다.</li>
      <li><b>선택비와 손실 — 어느 막이 언제 닿나</b> — Ti 밑의 보호막은 Ti가 다 지워진 뒤(과식각 동안)에만 액에 닿습니다: 손실 ≈ Ti 두께 × 과식각 ÷ 선택비. 예: Ti 100 nm, 과식각 30 %, SiO₂ 선택비 120(600 ÷ 5) → 약 0.25 nm(위젯은 유도 시간까지 넣어 0.33 nm). 처음부터 닿는 Cu 기둥 · SnAg는 ≈ Ti 두께 × (1 + 과식각) ÷ 선택비입니다. 한 번에는 작아도 재작업 · 긴 과식각 · 먼저 지워진 곳에서 쌓입니다. 같은 액이라도 막마다 Eₐ가 달라 온도에 따라 선택비가 바뀝니다 — 위젯에서 과산화수소계를 데우면(Eₐ Ti 60 &gt; Cu 40) 시간이 줄어 Cu 손실이 오히려 줄어듭니다.</li></ul>`);
  },
  css: `.pl-svg .et06-tiox{fill:#4b5563;stroke:#9ca3af;stroke-width:.6}
.pl-svg .et06-brk{fill:none;stroke:#060b16;stroke-width:5}
.pl-svg .et06-onc{font-size:25px;font-weight:900;fill:#3b1d0a !important;stroke:none !important}
.pl-svg .et06-onc2{font-size:19px;font-weight:800;fill:#3b1d0a !important;stroke:none !important}
.pl-svg .et06-band{fill:rgba(248,113,113,.42);stroke:#fca5a5;stroke-width:1.4;stroke-dasharray:4 3}
.pl-svg .et06-cul{font-size:19px;font-weight:800;fill:#fdba74 !important}
.pl-svg .et06-bandt{font-size:19px;font-weight:700;fill:#fca5a5 !important}
.pl-svg .et06-er{fill:#08101f}
.pl-svg .et06-inh{fill:none;stroke:#86efac;stroke-width:4;stroke-dasharray:3 5}
.pl-svg .et06-oez{fill:rgba(245,158,11,.12)}
.pl-svg .et06-tind{fill:#64748b}
.pl-svg .et06-tfld{fill:#38bdf8}
.pl-svg .et06-tov{fill:#f59e0b}
.pl-svg .et06-oet{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .et06-grid{stroke:rgba(148,163,184,.18);stroke-width:1}
.pl-svg .et06-mk{fill:rgba(239,68,68,.16)}
.pl-svg .et06-zf{fill:none;stroke:#7dd3fc;stroke-width:1.8}
.pl-svg .et06-zw{fill:none;stroke:#7dd3fc;stroke-width:1.4;stroke-dasharray:4 3}
.pl-svg .et06-zl{font-size:19px;font-weight:800;fill:#e0f2fe !important}
.pl-svg .et06-eqk{font-size:22px;font-weight:800;fill:#fde68a !important}
.pl-svg .et06-now{font-size:21px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .et06-mat{font-size:21px;font-weight:800;fill:#e2e8f0 !important}
.pl-svg .et06-dot{font-size:24px;font-weight:900;letter-spacing:2px}
.pl-svg .et06-acc{fill:#38bdf8 !important}
.pl-svg .et06-ok{fill:#4ade80 !important}
.pl-svg .et06-warn{fill:#f59e0b !important}
.pl-svg .et06-ng{fill:#ef4444 !important}
.pl-svg .et06-cell{fill:rgba(148,163,184,.06);stroke:none}
.pl-svg .et06-sin{fill:#64748b;stroke:#94a3b8;stroke-width:1}
.pl-svg .et06-pi{fill:#b45309;stroke:#f59e0b;stroke-width:1}
.pl-svg .et06-bu{fill:#f59e0b}
.pl-svg .et06-be{fill:#f87171}
.pl-svg .et06-bo{fill:#60a5fa}
.pl-svg .et06-bc{fill:#d4874a}
.pl-svg .et06-bs{fill:#cbd5e1}
.et06-mol circle{stroke-width:1.4}
.et06-mol text{font-size:13px;font-weight:900;stroke:none !important;paint-order:normal;fill:#0b1222 !important}
.et06-mol.f circle{fill:#bef264;stroke:#ecfccb}
.et06-mol.tif circle{fill:#a5b4fc;stroke:#e0e7ff}
.et06-mol.pox circle{fill:#5eead4;stroke:#ccfbf1}
.et06-mol.tic circle{fill:#c4b5fd;stroke:#ede9fe}`
});
})();
