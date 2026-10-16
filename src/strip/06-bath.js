/* PR 스트립 06 — 액 수명: 스트리퍼는 왜 지치고, 언제 바꿀까 (탱크 · 수십 L · 일) */
(function(){
// ---- 개념 모델 상수 (가정값은 위젯 K.model 에 밝힌다) ----
const DAYS = 30;
const RHO = 1.15, PR_AREA = Math.PI * 14.8 * 14.8 * 0.8;       // g/cm³ (예시), 300 mm − EBR 2 mm 면적 × (1 − 개구율 20 %) [cm²]
const MPR = t => RHO * PR_AREA * t * 1e-4;                      // 웨이퍼당 PR 무게 (g) — 01장과 같은 어림
const SAT = 150, LIM = 60, NG = 90, PHI = 0.9, DRAG = 0.003;    // 포화 상한 · 관리 한계 · 첫 탱크 몫 · 드래그아웃 L/장 (가정)
const KE = 0.3, WEQ = {open: 3, n2: 1}, W0 = {dry: 0.5, aq: 5}; // 평형 물 함량으로 다가가는 빠르기 (/일) · 평형 % · 새 액 물 %
const ALPHA = 0.002, CAIR = {open: 0.01, n2: 0.002};            // 알칼리 소모: 녹은 PR /(g/L) · 공기(CO₂) · 분해 /일
// 손대지 않았을 때 단계마다 보여 줄 예시 값 (발표 모드 대비)
const DEMO = {
  load: {mode: 'dump', dd: 7, b: 20, cov: 'n2', wt: 'dry'},
  age: {mode: 'dump', dd: 7, b: 20, cov: 'open', wt: 'dry'},
  cascade: {mode: 'casc', dd: 7, b: 20, cov: 'n2', wt: 'dry'},
  rule: {mode: 'dump', dd: 5, b: 20, cov: 'n2', wt: 'dry'}
};
// 좁은 세로 화면 전용 확대 (엔진이 세로 무대에서만 쓴다): 탱크 쪽 · 교체 기준 표
const VN_TANK = {x: 36, y: 184, w: 672, h: 664}, VN_TABLE = {x: 738, y: 672, w: 826, h: 436};
// 탱크 · 그래프 좌표
const T1 = {x: 80, cx: 205}, T2 = {x: 400, cx: 525}, TW = 250, TY0 = 300, TY1 = 760, LY = 340;
const GX0 = 826, GX1 = 1490, dx = d => GX0 + d / DAYS * (GX1 - GX0);
const G1Y0 = 600, G1Y1 = 210, gy1 = c => G1Y0 - Math.min(c, SAT) / SAT * (G1Y0 - G1Y1);
const G2Y0 = 1040, G2Y1 = 766, gyw = w => G2Y0 - Math.min(Math.max(w, 0), 6) / 6 * (G2Y0 - G2Y1);
const gya = a => G2Y0 - Math.min(Math.max(a - 0.5, 0), 0.5) / 0.5 * (G2Y0 - G2Y1);
const fC = c => c < 10 ? c.toFixed(1) : String(Math.round(c));
const f1 = v => (Math.round(v * 10) / 10).toFixed(1);

// 30일 하루 단위 계산. 점 배열은 [일, 값] — 통째 교체는 같은 날에 교체 전 · 후 두 점(톱니)
function sim(p){
  const m = MPR(+p.pr), n = p.n, V = p.V, b = p.b / 100, g = m * n / V;
  const weq = WEQ[p.cov], w0 = W0[p.wt], cA = CAIR[p.cov], dn = DRAG * n, f = dn / V;
  const r = {m, g, weq, w0, cA, dn, P1: [[0, 0]], P2: [[0, 0]], PW: [[0, w0]], PA: [[0, 1]], reps: [], sat: [], max1: 0, max2: 0, wX: w0, aMin: 1, a1Min: 1, cross1: -1, cross2: -1};
  let C1 = 0, C2 = 0, w1 = w0, w2 = w0, a1 = 1, a2 = 1;
  for (let d = 1; d <= DAYS; d++){
    let sat = false;
    if (p.mode === 'dump'){
      C1 += g; if (C1 >= SAT){ C1 = SAT; sat = true; }
      w1 += KE * (weq - w1);
      a1 = Math.max(0, a1 - ALPHA * g - cA);
    } else if (p.mode === 'bf'){
      C1 = C1 * (1 - b) + g; if (C1 >= SAT){ C1 = SAT; sat = true; }
      w1 += KE * (weq - w1) + b * (w0 - w1);
      a1 = Math.min(1, Math.max(0, a1 - ALPHA * g - cA + b * (1 - a1)));
    } else {
      // 역류: 새 액 → 탱크 2 → 넘쳐 탱크 1 → 버림. 탱크 1이 PR의 φ, 탱크 2가 1 − φ. 웨이퍼가 탱크 1 액을 dn L/일 탱크 2로 옮긴다
      const g1 = PHI * g, g2 = (1 - PHI) * g;
      const nC2 = C2 + g2 + f * C1 - (b + f) * C2, nC1 = C1 + g1 + b * (C2 - C1);
      const nw2 = w2 + KE * (weq - w2) + b * (w0 - w2) + f * (w1 - w2), nw1 = w1 + KE * (weq - w1) + b * (w2 - w1);
      const na2 = a2 - ALPHA * g2 - cA + b * (1 - a2) + f * (a1 - a2), na1 = a1 - ALPHA * g1 - cA + b * (a2 - a1);
      C1 = nC1; C2 = nC2; w1 = nw1; w2 = nw2; a1 = Math.min(1, Math.max(0, na1)); a2 = Math.min(1, Math.max(0, na2));
      if (C1 >= SAT){ C1 = SAT; sat = true; }
      if (C2 >= SAT){ C2 = SAT; sat = true; }
    }
    const casc = p.mode === 'casc', wl = casc ? w2 : w1, al = casc ? a2 : a1;
    r.P1.push([d, C1]); r.P2.push([d, C2]); r.PW.push([d, wl]); r.PA.push([d, al]);
    r.max1 = Math.max(r.max1, C1); r.max2 = Math.max(r.max2, C2);
    if (Math.abs(wl - w0) > Math.abs(r.wX - w0)) r.wX = wl;
    r.aMin = Math.min(r.aMin, al); r.a1Min = Math.min(r.a1Min, a1);
    if (r.cross1 < 0 && C1 >= LIM) r.cross1 = d;
    if (r.cross2 < 0 && casc && C2 >= LIM) r.cross2 = d;
    if (sat) r.sat.push(d);
    if (p.mode === 'dump' && d % p.dd === 0){
      r.reps.push(d);
      C1 = 0; w1 = w0; a1 = 1;
      r.P1.push([d, 0]); r.PW.push([d, w0]); r.PA.push([d, 1]);
    }
  }
  r.use = p.mode === 'dump' ? V * Math.ceil(DAYS / p.dd) : b * V * DAYS;           // 한 달 새 액 (L)
  r.last = p.mode === 'casc' ? r.max2 : r.max1;                                    // 웨이퍼가 마지막에 만나는 탱크의 최고
  r.tau = 1 + r.max1 / 100;                                                        // 클리어 시간 배수 (PR 대부분을 녹이는 탱크 기준)
  r.daLoss = (ALPHA * (p.mode === 'casc' ? PHI * g : g) + cA) * 100;              // 알칼리 하루 소모 %p (탱크 1)
  return r;
}

(window.EngrStripChapters = window.EngrStripChapters || []).push({
  no: '06', id: 'bath', part: 2, short: '액 수명', scale: '탱크 · 수십 L · 일',
  title: '액 수명 — 스트리퍼는 왜 지치고, 언제 바꿀까?',
  hook: '한 장마다 PR 약 1~4 g',
  one: '웨이퍼 한 장마다 수 그램의 PR이 스트리퍼에 녹거나 조각으로 쌓입니다. 녹은 PR이 늘수록 액은 덜 녹이고, 물 함량이 바뀌고, 알칼리가 줄고, 성분이 날아가거나 분해되어 점점 지칩니다. 언제 바꾸고 무엇을 볼지가 액 관리입니다.',
  ana: '<b>설거지 물</b> — 처음엔 기름때가 잘 빠지지만 그릇을 씻을수록 물에 기름이 차서 덜 빠지고, 결국 깨끗한 그릇에 기름이 다시 묻습니다. 그래서 헹굼 물을 따로 두고 더러운 물부터 버립니다. <i>(한계: 스트리퍼는 \'꽉 차기\' 전에도 속도가 서서히 떨어지고, 물 함량 변화 · 알칼리 감소 · 성분 증발처럼 웨이퍼를 넣지 않아도 시간이 지나며 변하는 몫이 있습니다.)</i>',
  steps: [
    {id: 'load', t: '녹은 PR이 쌓인다', d: '웨이퍼 한 장(300 mm, PR 35 µm, 개구율 20 % 예시)은 PR 약 2.2 g을 액에 넘깁니다(60 µm면 3.8 g, 코어 다이 예시 22 µm면 1.4 g). 40 L 탱크에 하루 200장이면 녹은 PR이 하루 약 11 g/L씩 늡니다. 녹은 PR이 늘수록 녹이는 속도가 떨어지고 잔여 · 재부착이 늘어납니다.', viewN: VN_TANK},
    {id: 'age', t: '물 · 알칼리 · 증발 — 시간도 액을 바꾼다', d: '물은 늘기도 줄기도 합니다. 물이 거의 없는 용제는 공기 중 물을 빨아들이고, 물이 몇 % 든 액은 데우면 물이 먼저 날아갑니다. 알칼리는 녹은 PR · 공기 중 이산화탄소와 반응하거나 분해되어 줄어듭니다. 그래서 물 · 알칼리를 재서 보충하거나 바꿉니다.', viewN: VN_TANK},
    {id: 'cascade', t: '두 탱크 캐스케이드와 보충', d: '첫 탱크가 PR 대부분을 받고 마무리 탱크는 깨끗하게 둡니다. 새 액을 마무리 탱크에 넣어 첫 탱크로 넘치게 하면(역류 캐스케이드) 웨이퍼가 마지막에 만나는 액이 깨끗합니다. 웨이퍼가 첫 탱크 액을 묻혀 오므로(드래그아웃) 물기 빼기도 중요합니다.', viewN: VN_TANK},
    {id: 'rule', t: '언제 바꾸나 — 기준과 분석', d: '교체는 처리 장수 · 사용 일수 · 분석값(물, 알칼리, 녹은 PR, 녹은 금속) 가운데 먼저 닿는 기준으로 정합니다. 클리어 시간이 늘거나 필터 차압 · 잔여 · 금속 손실 불량이 오르면 액 나이부터 봅니다.', viewN: VN_TABLE}
  ],
  icon(K){
    const {R, P, L, C} = K;
    return R(4, 14, 40, 40, 'st06-iliq', {rx: 3}) + R(4, 34, 40, 20, 'st06-iliq2') + P('M4,8 L4,54 L44,54 L44,8', 'f-tank') +
      P('M50,46 A10,10 0 0 1 64,46', 'st06-igauge') + L(57, 46, 62, 38, 'st06-ineedle') + C(57, 46, 2.4, 'k-warn');
  },
  draw(K){
    const {R, L, P, T, G, tip, only, W} = K;
    let s = '';
    // ---------- 왼쪽: 탱크 ----------
    s += R(36, 128, 672, 984, 'pl-panel', {rx: 16});
    s += T(60, 166, '탱크 — 지금 설정 (위젯 값)', 't-acc', 'start');
    s += `<g data-v="cap"></g>`;                                                 // 단계마다 한 줄 설명 (위젯 값)
    s += `<g data-v="tank2"></g><g data-v="tank1"></g>`;
    [T1, T2].forEach((t, i) => { s += P(`M${t.x},${TY0} L${t.x},${TY1} L${t.x + TW},${TY1} L${t.x + TW},${TY0}`, 'f-tank', tip(i ? '탱크 2 — 마무리 탱크 (역류 캐스케이드에서 씀)' : '탱크 1 — PR 대부분을 녹이는 탱크')); });
    s += `<g data-v="inner"></g><g data-v="flows"></g><g data-v="air"></g>`;
    s += R(52, 852, 640, 246, 'pl-box', {rx: 12});
    s += `<g data-v="box"></g>`;
    // ---------- 오른쪽: 그래프 ----------
    s += R(728, 128, 844, 984, 'pl-panel', {rx: 16});
    s += R(742, 138, 816, 536, 'pl-hlbox', W({rx: 12}, only('load cascade')));
    s += R(742, 680, 816, 422, 'pl-hlbox', W({rx: 12}, only('age rule')));
    // 그래프 1 — 녹은 PR
    s += T(756, 174, '① 녹은 PR (g/L) — 30일', 't-acc', 'start');
    let g1 = '';
    for (let c = 30; c <= SAT; c += 30) g1 += L(GX0, gy1(c), GX1, gy1(c), 'st06-grid');
    g1 += L(GX0, G1Y1 - 6, GX0, G1Y0, 's-axis') + L(GX0, G1Y0, GX1 + 8, G1Y0, 's-axis');
    for (let c = 0; c <= SAT; c += 30) g1 += T(GX0 - 12, gy1(c) + 7, String(c), 't-dim', 'end');
    for (let d = 0; d <= DAYS; d += 5) g1 += T(dx(d), G1Y0 + 30, d === DAYS ? '30일' : String(d), 't-dim');
    g1 += L(GX0, gy1(LIM), GX1, gy1(LIM), 'st06-lim', tip('관리 한계 (가정) — 이 값은 액 · 제품 · 회사마다 다르다'));
    g1 += G(L(GX0, gy1(LIM), GX1, gy1(LIM), 'pl-peak', {filter: K.url('glow')}) + L(GX0, gy1(LIM), GX1, gy1(LIM), 'pl-peak'), only('rule'));
    s += G(g1) + `<g data-v="g1"></g>`;
    // 그래프 2 — 물 · 알칼리 (rule 단계에서는 표로 바뀐다)
    let g2 = T(756, 716, '② 물 (%) · 알칼리 남은 비율 (%) — 30일', 't-acc', 'start');
    for (let w = 2; w <= 6; w += 2) g2 += L(GX0, gyw(w), GX1, gyw(w), 'st06-grid');
    g2 += L(GX0, G2Y1 - 6, GX0, G2Y0, 's-axis') + L(GX0, G2Y0, GX1 + 8, G2Y0, 's-axis') + L(GX1, G2Y1 - 6, GX1, G2Y0, 'st06-raxis');
    for (let w = 0; w <= 6; w += 2) g2 += T(GX0 - 12, gyw(w) + 7, w + ' %', 't-dim', 'end');
    [[0.5, '50 %'], [0.75, '75 %'], [1, '100 %']].forEach(([a, t]) => { g2 += T(GX1 + 10, gya(a) + 7, t, 'st06-at', 'start'); });
    for (let d = 0; d <= DAYS; d += 5) g2 += T(dx(d), G2Y0 + 30, d === DAYS ? '30일' : String(d), 't-dim');
    s += G(g2 + `<g data-v="g2"></g>`, {'data-off': 'rule'});
    // rule 단계: 교체 기준 · 분석 표
    const ROWS = [
      ['처리 장수 · PR 무게', '장수 × 웨이퍼당 PR(g) — 제품마다 다르다'],
      ['사용 일수', '새 액 뒤 지난 날 — 안 써도 물 · 알칼리가 변한다'],
      ['물', '칼 피셔 적정 · 인라인 농도계(흡광 · 전도도)'],
      ['알칼리', '산염기 적정 → 보충 또는 교체'],
      ['녹은 PR (로딩)', '흡광 · 굴절률 · 밀도 — 액마다 검량선'],
      ['녹은 금속 Cu · Sn', 'ICP — 부식 신호, 녹은 Cu는 부식을 더 키운다'],
      ['클리어 시간', '표준 시편이 다 걷히는 시간 — 늘면 액이 지침'],
      ['필터 차압 (ΔP)', '조각 · 덜 녹은 PR이 쌓인다 — 박리형 약품']
    ];
    let tb = T(756, 716, '교체 기준 · 분석 — 먼저 닿는 기준에서 바꾼다', 't-acc', 'start');
    tb += T(764, 752, '무엇을', 'pl-hdg', 'start') + T(1010, 752, '어떻게 재나 · 왜', 'pl-hdg', 'start') + L(756, 764, 1544, 764, 's-axis');
    ROWS.forEach(([a, b], i) => {
      const y = 796 + i * 36;
      tb += G(T(764, y, a, 'st06-tc1', 'start') + T(1010, y, b, 't-sub', 'start'), tip(a + ' — ' + b));
      tb += L(756, y + 12, 1544, y + 12, 'st06-grid');
    });
    tb += T(764, 1090, '기준값은 액 · 제품마다 다릅니다 — 이 장의 60 g/L는 가정', 'st06-foot', 'start');
    s += G(tb, only('rule'));
    return s;
  },
  body(K){
    return `<div class="pl-w st06-w"><div class="hd">직접 해 보기 — 30일 액 나이</div>
      ${K.ctl('n', '하루 처리량 (장)', 50, 500, 10, 200)}${K.ctl('V', '탱크 부피 (L)', 20, 80, 5, 40)}
      ${K.seg('pr', [['22', '22 µm · 1.4 g (코어 다이 예시)'], ['35', '35 µm · 2.2 g'], ['60', '60 µm · 3.8 g'], ['100', '100 µm · 6.3 g']], '35', '웨이퍼당 PR (01장 어림)')}
      ${K.seg('mode', [['dump', '정해진 날 통째 교체'], ['bf', '매일 일부 보충'], ['casc', '두 탱크 역류 + 보충']], 'dump', '관리 방식')}
      ${K.ctl('dd', '통째 교체 주기 (일)', 1, 14, 1, 5)}${K.ctl('b', '하루 보충률 (%)', 5, 50, 1, 20)}
      ${K.seg('cov', [['open', '덮개 없음'], ['n2', '덮개 + 질소']], 'n2', '액면')}
      ${K.seg('wt', [['dry', '물이 거의 없는 액 (새 액 물 0.5 %)'], ['aq', '물이 몇 % 든 액 (새 액 물 5 %)']], 'dry', '액의 물 (예시)')}
      ${K.kpis([['최고 녹은 PR', 'k-cmax', 'g/L · 웨이퍼가 마지막에 만나는 탱크'], ['클리어 시간', 'k-tx', '새 액 대비 배수 (최고일 때)'], ['물', 'k-w', '% — 30일 동안'], ['알칼리 남은 비율', 'k-a', '최저 (가정 모델)'], ['한 달 새 액', 'k-use', 'L']])}
      <p class="pl-msg st06-msg" data-o="msg"></p>
      ${K.model('웨이퍼당 PR = 밀도 1.15 g/cm³(예시) × 웨이퍼 면적(가장자리 2 mm 뺌) × (1 − 개구율 20 %) × PR 두께 — 01장과 같은 어림입니다. 첫 탱크가 받는 PR 몫 90 %, 드래그아웃 3 mL/장, 클리어 시간 배수 1 + C/100(C: 녹은 PR g/L), 관리 한계 60 g/L, 포화 상한 150 g/L, 평형 물 함량 3 %(덮개 없음) · 1 %(덮개 + 질소)와 다가가는 빠르기 0.3/일, 알칼리 소모(녹은 PR 1 g/L당 0.2 %p · 공기 중 이산화탄소와 분해 하루 1 · 0.2 %p)는 모두 가정값입니다. 보충 모델은 <a href="#go-plating-11">전해도금 11장</a>의 분해산물 모델과 같은 꼴(C* = g/b)입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, PL, T, G, tip, only, W, rng} = K;
    const st = {n: 200, V: 40, pr: '35', mode: 'dump', dd: 5, b: 20, cov: 'n2', wt: 'dry'};
    let touched = false;
    const kpiBox = id => ctx.card.querySelector(`[data-o="${id}"]`).parentNode;
    const kpiSub = (id, s) => { const e = kpiBox(id).querySelector('.s'); if (e) e.textContent = s; };
    const grade = (id, c) => { const k = kpiBox(id); k.classList.toggle('ok', c < LIM); k.classList.toggle('warn', c >= LIM && c < NG); k.classList.toggle('ng', c >= NG); };
    // 녹은 PR이 많을수록 액 색이 옅은 보라(새 액) → 호박색 → 짙은 갈색으로
    const STOPS = [[0, [196, 181, 253], 0.2], [0.25, [251, 191, 36], 0.3], [0.6, [217, 119, 6], 0.5], [1, [124, 45, 18], 0.78]];
    function tint(c){
      const t = K.clamp(c / 120);
      let k = 1; while (k < STOPS.length - 1 && t > STOPS[k][0]) k++;
      const [a, ca, oa] = STOPS[k - 1], [b, cb, ob] = STOPS[k], u = K.clamp((t - a) / (b - a));
      return `rgba(${ca.map((v, i) => Math.round(K.lerp(v, cb[i], u))).join(',')},${K.lerp(oa, ob, u).toFixed(2)})`;
    }
    // 탱크 액 + 녹은 PR 점 (점 수 ∝ 녹은 PR) + 포화면 바닥의 녹지 못한 조각
    function liquid(t, c, seed, name){
      const x0 = t.x + 3, w = TW - 6, y0 = LY, h = TY1 - 3 - LY, g = rng(seed);
      let s = R(x0, y0, w, h, 'st06-tint', {style: `fill:${tint(c)}`});
      const nd = Math.round(Math.min(c, SAT) / SAT * 54);
      let dots = '';
      for (let i = 0; i < nd; i++) dots += C(x0 + 10 + g() * (w - 20), y0 + 12 + g() * (h - 24), 3 + g() * 2.2, 'st06-dot');
      s += G(dots, tip('녹은 PR — 점이 많을수록 액 1 L에 녹은 PR(g/L)이 많다'));
      if (c >= SAT){
        let fl = '';
        for (let i = 0; i < 9; i++){ const fx = x0 + 18 + i * 24 + g() * 8, fy = TY1 - 18 - g() * 14; fl += R(fx, fy, 18, 7, 'f-pr', {transform: `rotate(${Math.round(g() * 50 - 25)} ${q(fx + 9)} ${q(fy + 3)})`}); }
        s += G(fl, tip('포화 — 더 녹지 못한 PR 조각이 가라앉고 웨이퍼에 다시 붙는다'));
      }
      return G(s, tip(`${name} — 녹은 PR ${fC(c)} g/L`));
    }
    const q = v => Math.round(v * 10) / 10;
    const plate = (cx, y0, y1) => R(cx - 112, y0, 224, y1 - y0, 'st06-plate', {rx: 10});
    // 탱크 위 공기: 물이 들어오면 물방울(아래로), 나가면 김(위로). 덮개가 있으면 덮개 아래에서만
    function airOver(t, upDir, gap, lid){
      let a = '';
      const n = Math.max(2, Math.min(lid ? 3 : 6, Math.round(gap * 2.4)));
      for (let i = 0; i < n; i++){
        const x = t.x + 50 + i * (lid ? 70 : 34);
        a += upDir ? K.mover(x, lid ? 306 : 230 + (i % 2) * 16, x, 348, lid ? 5 : 7, 'st06-h2o', lid ? 1.8 : 2.4, i * 0.45)
          : `<path d="M${x},334 q-9,-14 0,-28 q9,-14 0,-28" class="st06-steam"><animateTransform attributeName="transform" type="translate" values="0 0;0 -${lid ? 24 : 80}" dur="2.6s" begin="-${q(i * 0.7)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.9;0" dur="2.6s" begin="-${q(i * 0.7)}s" repeatCount="indefinite"/></path>`;
      }
      return a;
    }
    function render(){
      const r = sim(st), casc = st.mode === 'casc', dump = st.mode === 'dump', b = st.b / 100;
      const up = r.weq > r.w0;                                                   // 물이 평형보다 적으면 빨아들인다
      const other = sim(Object.assign({}, st, {wt: st.wt === 'dry' ? 'aq' : 'dry'}));   // 다른 액(물 적음 ↔ 몇 %)이라면
      const oUp = other.weq > other.w0;
      // ---- 탱크 ----  (age 단계에서 탱크 2를 안 쓰면 '다른 액' 비교 탱크로 보여 준다)
      ctx.$('[data-v="tank1"]').innerHTML = liquid(T1, r.max1, 11, casc ? '탱크 1' : '탱크');
      ctx.$('[data-v="tank2"]').innerHTML = casc ? liquid(T2, r.max2, 23, '탱크 2') :
        G(liquid(T2, 0, 23, '탱크 2'), {class: 'dim', 'data-st': 'load cascade rule'}) + G(liquid(T2, other.max1, 23, '비교 탱크'), only('age'));
      // 탱크 안 글 (이름 · 농도 · 단계별 아래 칸) — 글 뒤에 어두운 판을 깔아 액 색과 상관없이 읽히게
      let inn = '';
      inn += plate(T1.cx, 352, 522);
      inn += G(T(T1.cx, 380, casc ? '탱크 1 · 첫 탱크' : '탱크 (하나만 씀)', 't-sub'), casc ? null : {'data-st': 'load cascade rule'});
      if (!casc) inn += G(T(T1.cx, 380, `지금 — 새 액 물 ${f1(r.w0)} %`, 't-sub'), only('age'));
      inn += T(T1.cx, 432, dump ? '녹은 PR (교체 직전)' : '녹은 PR (최고)', 't-dim') + T(T1.cx, 474, `${fC(r.max1)} g/L`, r.max1 >= LIM ? 'st06-cvw' : 'st06-cv') + T(T1.cx, 508, `클리어 시간 ×${r.tau.toFixed(2)}`, 't-dim');
      if (casc) inn += plate(T2.cx, 352, 522) + T(T2.cx, 380, '탱크 2 · 마무리', 't-sub') + T(T2.cx, 432, '녹은 PR (최고)', 't-dim') + T(T2.cx, 474, `${fC(r.max2)} g/L`, r.max2 >= LIM ? 'st06-cvw' : 'st06-cv') + T(T2.cx, 508, '웨이퍼가 마지막에 만남', 't-dim');
      else {
        inn += G(T(T2.cx, 380, '탱크 2', 't-dim') + T(T2.cx, 520, '역류 캐스케이드에서 씀', 't-dim'), {'data-st': 'load cascade rule'});
        inn += G(plate(T2.cx, 352, 522) + T(T2.cx, 380, `비교 — 새 액 물 ${f1(other.w0)} %`, 't-sub') + T(T2.cx, 432, '같은 조건 · 다른 액이면', 't-dim') +
          T(T2.cx, 474, `${fC(other.max1)} g/L`, other.max1 >= LIM ? 'st06-cvw' : 'st06-cv') + T(T2.cx, 508, '녹은 PR은 같다', 't-dim'), only('age'));
      }
      // load: 카세트 속 웨이퍼에서 PR이 녹아 나온다
      let cas = P('M138,550 L138,744 L274,744 L274,550', 'st06-cas');
      for (let i = 0; i < 7; i++) cas += R(149 + i * 18, 560, 7, 176, 'f-wafer');
      const gm = rng(5);
      let wisp = '';
      for (let i = 0; i < 8; i++){ const x = 152 + gm() * 116; wisp += K.mover(x, 720 - gm() * 40, x + (gm() - 0.5) * 50, 548, 3.6, 'st06-dot', 2.6 + gm() * 1.6, gm() * 3); }
      inn += G(G(cas, tip('카세트 속 웨이퍼 — 한 장마다 PR 수 g이 녹거나 떨어져 나온다')) + G(wisp, {'data-noov': '1'}), only('load'));
      // load: 날마다 액 색 (탱크 1) — 1일부터 교체 직전(또는 30일)까지
      const days = dump ? Array.from({length: Math.min(st.dd, 14)}, (_, i) => i + 1) : [1, 2, 3, 5, 7, 10, 15, 20, 30];
      const sw = (690 - 404) / days.length;
      let swg = T(404, 794, `탱크 액 색 — ${days[0]}일 → ${days[days.length - 1]}일`, 't-dim', 'start');
      days.forEach((d, i) => { const v = (r.P1.find(p => p[0] === d) || [d, 0])[1]; swg += R(404 + i * sw, 806, sw - 4, 30, 'st06-tint', W({rx: 4, style: `fill:${tint(v)}`}, tip(`${d}일째 — 녹은 PR ${fC(v)} g/L`))); });
      inn += G(swg, only('load'));
      // age: 물 · 알칼리 상태 (역류면 마무리 탱크 값 — 그래프 ②와 같은 탱크)
      const lidOn = st.cov === 'n2';
      const ageTxt = (cx, s, u) => plate(cx, 562, 716) + T(cx, 592, `물 ${f1(s.w0)} → ${f1(s.wX)} %`, 't-sub') + T(cx, 624, u ? (lidOn ? '틈으로 조금씩 늘어남 ↑' : '공기에서 빨아들임 ↑') : (lidOn ? '질소에 실려 날아감 ↓' : '데우는 동안 날아감 ↓'), 'st06-wat') +
        T(cx, 670, `알칼리 → ${Math.round(s.aMin * 100)} %`, 't-sub') + T(cx, 700, '녹은 PR · CO₂ · 분해로 ↓', 't-dim');
      inn += G(casc ? ageTxt(T2.cx, r, up) : ageTxt(T1.cx, r, up) + ageTxt(T2.cx, other, oUp), only('age'));
      // cascade: PR이 어디로 가나
      inn += G(plate(T1.cx, 584, 656) + T(T1.cx, 612, casc ? 'PR의 90 %가' : 'PR 전부가', 't-sub') + T(T1.cx, 642, '여기서 녹는다', 't-dim') +
        (casc ? plate(T2.cx, 584, 656) + T(T2.cx, 612, 'PR 10 %', 't-sub') + T(T2.cx, 642, '+ 묻어 온 탱크 1 액', 't-dim') : ''), only('cascade'));
      // rule: 인라인 농도계
      inn += G(G(L(88, 290, 88, 636, 'st06-probe') + C(88, 642, 8, 'st06-phead'), tip('인라인 농도계 — 흡광 · 전도도로 물 · 알칼리를 재서 자동 보충 (장비에 따라)')) +
        R(T1.cx - 82, 646, 198, 70, 'st06-plate', {rx: 10}) + T(T1.cx + 17, 674, '인라인 농도계', 't-sub') + T(T1.cx + 17, 702, '→ 물 · 알칼리 보충', 't-dim'), only('rule'));
      ctx.$('[data-v="inner"]').innerHTML = inn;
      // ---- 드나드는 액 (관리 방식) · 웨이퍼 흐름 ----
      let fl = '';
      if (casc){
        fl += G(K.arrow(620, 252, 604, 334, 's-arrg') + T(690, 238, `새 액 ${st.b} %/일`, 't-sub', 'end'), tip('새 액은 마무리 탱크(2)에 넣는다'));
        fl += G(K.arrow(398, 354, 336, 354, 's-arrg') + T(365, 394, '넘침', 't-dim'), tip('탱크 2가 넘쳐 탱크 1로 — 액은 웨이퍼와 반대 방향(역류)'));
        fl += G(K.arrow(140, 764, 140, 828, 's-arr2') + T(156, 816, b * st.V > r.dn ? `버림 (bleed) — 탱크 1에서 하루 ${f1(b * st.V - r.dn)} L` : '버림 거의 없음 — 묻어 나가는 양이 더 많음', 't-dim', 'start'), tip('가장 지친 액(탱크 1)을 버린다 — 넘쳐 온 양에서 웨이퍼가 탱크 2로 묻혀 간 양을 뺀 만큼'));
      } else {
        fl += G(K.arrowP('M470,268 C430,268 362,276 326,334', 's-arrg') + T(480, 262, '새 액', 't-sub', 'start') + T(480, 290, dump ? `${st.dd}일마다 전량` : `${st.b} %/일 보충`, 't-dim', 'start'), tip(dump ? '정해진 날 통째로 새 액' : '매일 일부를 새 액으로 (feed)'));
        fl += G(K.arrow(140, 764, 140, 828, dump ? 's-arrr' : 's-arr2') + T(156, 816, dump ? `${st.dd}일마다 전량 버림` : `버림 (bleed) — ${st.b} %/일`, 't-dim', 'start'), tip(dump ? '통째 교체 — 다 버리고 새 액으로' : 'bleed & feed — 일부를 버리고 같은 양의 새 액'));
      }
      let wf = '';
      if (casc){
        // 웨이퍼가 탱크 1 → 2로 옮겨 가며 첫 탱크 액을 묻혀 간다 (드래그아웃)
        const path = `M${T1.cx},316 L${T1.cx},252 L${T2.cx},252 L${T2.cx},316`;
        wf += P(path, 'st06-wpath') + K.arrow(T2.cx - 40, 252, T2.cx - 8, 252, 's-arr');
        wf += `<g data-noov="1"><g>${R(-5, -34, 10, 68, 'f-wafer')}${C(0, 40, 7, 'st06-drop')}<animateMotion dur="5s" repeatCount="indefinite" path="${path}"/></g></g>`;
        wf += `<g data-noov="1">${K.mover(T2.cx, 300, T2.cx, 350, 6, 'st06-drop', 5, 0.2)}</g>`;
      }
      fl = G(fl, only('load cascade rule')) + G(wf, only('cascade'));
      ctx.$('[data-v="flows"]').innerHTML = fl;
      // ---- 액면: 물 · 이산화탄소 · 덮개 (age) ----
      let air = '', lab = '';
      const lid = st.cov === 'n2', T2air = casc ? [up, r] : [oUp, other];
      air += airOver(T1, up, Math.abs(r.weq - r.w0), lid) + airOver(T2, T2air[0], Math.abs(T2air[1].weq - T2air[1].w0), lid);
      if (lid){
        lab += G(R(72, 286, 266, 14, 'st06-lid', {rx: 3}) + R(392, 286, 266, 14, 'st06-lid', {rx: 3}), tip('덮개 — 산소 · 이산화탄소 · 습기를 대부분 막는다\n(틈 · 웨이퍼 출입으로 습기가 조금은 들어온다 — 그래서 평형 물 함량이 0이 아니다)'));
        lab += G(K.arrow(100, 230, 100, 322, 's-arr') + T(112, 252, '질소', 't-sub', 'start'), tip('질소로 덮기 — 산소 · CO₂는 막지만 흐르는 질소가 물 · 휘발 성분을 실어 낸다'));
        lab += G(K.arrow(318, 284, 370, 240, 's-arr3') + T(380, 236, '배기 — 물 · 휘발 성분도', 't-dim', 'start') + T(380, 262, '함께 나간다', 't-dim', 'start'), tip('배기 — 질소와 함께 증기가 빠져나간다'));
      } else {
        lab += T(60, 246, '열린 액면', 't-dim', 'start');
        [[T1.x + 196, 0], [T1.x + 120, 1.7], [T2.x + 196, 0.8], [T2.x + 120, 2.5]].forEach(([x, dl]) => { air += `<g class="st06-co2">${T(0, 0, 'CO₂', 'st06-co2t')}<animateMotion dur="3.4s" begin="-${dl}s" repeatCount="indefinite" path="M${x},236 L${x - 12},330"/><animate attributeName="opacity" values="0;1;1;0" dur="3.4s" begin="-${dl}s" repeatCount="indefinite"/></g>`; });
      }
      ctx.$('[data-v="air"]').innerHTML = G(G(air, {'data-noov': '1'}) + lab, only('age'));
      // ---- 단계마다 한 줄 (위젯 값) ----
      const cap = [
        ['load', `웨이퍼 1장 → PR ${f1(r.m)} g · 하루 ${st.n}장 → ${Math.round(r.m * st.n)} g`],
        ['age', `물은 평형 ${r.weq} % 쪽으로 — 적으면 들어오고 많으면 날아간다`],
        ['cascade', casc ? '웨이퍼 1 → 2 — 첫 탱크 액이 묻어 간다(드래그아웃)' : '역류 캐스케이드를 고르면 두 탱크가 이어진다'],
        ['rule', '재는 법 — 인라인 농도계 · 샘플 분석(오른쪽 표)']
      ];
      ctx.$('[data-v="cap"]').innerHTML = cap.map(([sid, t]) => G(T(60, 206, t, 'st06-cap', 'start'), only(sid))).join('');
      // ---- 아래 상자: 하루 드나드는 양 (rule 단계에서는 '먼저 닿는 기준') ----
      const BY = [924, 960, 996, 1032, 1068], X = 72;
      let bx = T(X, 888, '하루 드나드는 양 (지금 설정 · 개념 모델)', 't-acc', 'start');
      const lines = [
        `+ 녹은 PR ${f1(r.g)} g/L · 일  (${st.n}장 × ${f1(r.m)} g ÷ ${st.V} L)`,
        dump ? `− 통째 교체 ${st.dd}일마다 → 교체 직전 ${fC(r.max1)} g/L` : casc ? `− 새 액 ${st.b} %/일: 탱크 2 → 넘쳐 1 → 버림` : (r.g / b >= SAT ? `− 매일 ${st.b} % 빼고 새 액 → g/b ${fC(r.g / b)} g/L (포화 150에서 막힘)` : `− 매일 ${st.b} % 빼고 새 액 → ${fC(r.g / b)} g/L에서 멈춤`),
        `물 ${f1(r.w0)} % → 평형 ${r.weq} % 쪽으로 (차이를 하루 30 %씩 좁힘)`,
        `알칼리 −${f1(r.daLoss)} %p/일 (녹은 PR ${f1(r.daLoss - r.cA * 100)} + CO₂ · 분해 ${f1(r.cA * 100)})`,
        casc ? `드래그아웃 3 mL/장 → 하루 ${f1(r.dn)} L가 탱크 1 → 2로` : `한 달 새 액 ${Math.round(r.use)} L (웨이퍼당 ${Math.round(r.use * 1000 / (st.n * DAYS))} mL)`
      ];
      const HL = {load: [0], age: [2, 3], cascade: [1, 4]};
      Object.keys(HL).forEach(sid => HL[sid].forEach(i => { bx += R(62, BY[i] - 25, 620, 34, 'st06-rowhl', W({rx: 6}, only(sid))); }));
      lines.forEach((t, i) => { bx += T(X, BY[i], t, 't-sub', 'start'); });
      bx = G(bx, {'data-off': 'rule'});
      // rule: 이 설정에서 먼저 닿는 기준
      let rb = T(X, 888, '이 설정에서 먼저 닿는 기준은? (가정 기준값)', 't-acc', 'start');
      const crossTxt = r.cross1 > 0 ? `${r.cross1}일째 한계(60 g/L)를 넘음` : '한계(60 g/L) 안';
      const rl = [
        [`${casc ? '첫 탱크 ' : ''}녹은 PR 최고 ${fC(r.max1)} g/L — ${crossTxt}`, r.cross1 > 0 ? 'st06-bad' : 'st06-good'],
        [dump ? `한 번 쓰는 동안 ${st.n * st.dd}장 · PR ${f1(r.m * st.n * st.dd / 1000)} kg` : `웨이퍼당 새 액 ${Math.round(r.use * 1000 / (st.n * DAYS))} mL · 한 달 ${Math.round(r.use)} L`, 't-sub'],
        [`물 ${f1(r.w0)} → ${f1(r.wX)} % · 알칼리 최저 ${Math.round(r.aMin * 100)} %`, 't-sub'],
        [`클리어 시간 ×${r.tau.toFixed(2)} — 표준 시편으로 늘었는지 확인`, r.tau >= 1 + LIM / 100 ? 'st06-bad' : 't-sub'],
        ['→ 이 가운데 먼저 닿는 것에서 교체 · 보충', 't-dim']
      ];
      rl.forEach(([t, c], i) => { rb += T(X, BY[i], t, c, 'start'); });
      ctx.$('[data-v="box"]').innerHTML = bx + G(rb, only('rule'));
      // ---- 그래프 1: 녹은 PR ----
      const pts = arr => arr.map(([d, v]) => [dx(d), gy1(v)]);
      let g1 = '', satLab = '';
      const boxes = [];                                                          // 글 자리를 고를 때 피할 상자
      // 포화 띠
      if (r.sat.length){
        // 포화에 닿은 날들(이어진 구간마다 따로) 위에 빨간 띠, 글은 띠 바로 아래 오른쪽 (그래프 아래 줄은 관리 방식 글 자리)
        const runs = [];
        r.sat.forEach(d => { const L0 = runs[runs.length - 1]; if (L0 && d === L0[1] + 1) L0[1] = d; else runs.push([d, d]); });
        runs.forEach(([a, b2]) => { g1 += R(dx(a - 1), G1Y1 - 12, Math.max(10, dx(b2) - dx(a - 1)), 24, 'st06-sat', tip('포화 상한 150 g/L (가정) — 이 날들은 더 녹지 못한다')); });
        satLab = R(GX1 - 392, G1Y1 + 22, 388, 30, 'st06-tplate', {rx: 6}) + T(GX1 - 8, G1Y1 + 44, '빨간 띠: 포화 — 현실에서 쓰지 않는 조건', 'st06-satt', 'end');
        boxes.push({x: GX0, y: G1Y1 - 12, w: GX1 - GX0, h: 24}, {x: GX1 - 392, y: G1Y1 + 22, w: 388, h: 30});
      }
      // 통째 교체한 날
      r.reps.forEach(d => { g1 += PL([[dx(d) - 8, G1Y0 + 12], [dx(d), G1Y0], [dx(d) + 8, G1Y0 + 12]], 'st06-rep'); });
      if (dump) g1 += T(GX0, 660, `▲ 통째 교체한 날 (${st.dd}일마다)`, 'st06-rept', 'start');
      else if (st.mode === 'bf') g1 += r.g / b >= SAT ? T(GX0, 660, `멈추는 수준 g/b = ${fC(r.g / b)} g/L — 그래프 밖`, 'st06-satt', 'start') : L(GX0, gy1(r.g / b), GX1, gy1(r.g / b), 'pl-ss') + T(GX0, 660, `초록 점선: 멈추는 수준 g/b = ${fC(r.g / b)} g/L`, 'pl-sst', 'start');
      else g1 += r.max2 >= SAT ? T(GX0, 660, '마무리 탱크도 포화 — 보충 부족', 'st06-satt', 'start') : T(GX0, 660, `마무리 탱크가 첫 탱크보다 약 ${(r.max1 / Math.max(0.1, r.max2)).toFixed(1)}배 깨끗`, 'pl-sst', 'start');
      if (casc) g1 += PL(pts(r.P2), 's-curve', tip('탱크 2 (마무리) — 웨이퍼가 마지막에 만나는 액'));
      g1 += PL(pts(r.P1), 'st06-c1', tip(casc ? '탱크 1 (첫 탱크) — PR의 90 %를 받는다' : '탱크 — 녹은 PR'));
      // 글 자리 고르기: 곡선 · 다른 글을 가리지 않는 첫 후보, 다 가리면 가장 덜 가리는 후보
      // (곡선을 3 px 간격으로 훑어 판(+ 여유 pad) 안에 드는 점을 센다)
      const curves = casc ? [pts(r.P1), pts(r.P2)] : [pts(r.P1)];
      const clash = (bx, pad = 6) => {
        let n = (bx.y < G1Y1 - 2 || bx.y + bx.h > G1Y0 - 6 || bx.x < GX0 + 2 || bx.x + bx.w > GX1 + 40) ? 1e4 : 0;
        boxes.forEach(o => { if (o.x < bx.x + bx.w + pad && bx.x < o.x + o.w + pad && o.y < bx.y + bx.h + pad && bx.y < o.y + o.h + pad) n += 1e3; });
        curves.forEach(ps => { for (let i = 1; i < ps.length; i++){
          const [x0, y0] = ps[i - 1], [x1, y1] = ps[i], k = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3));
          for (let j = 0; j <= k; j++){ const px = x0 + (x1 - x0) * j / k, py = y0 + (y1 - y0) * j / k; if (px > bx.x - pad && px < bx.x + bx.w + pad && py > bx.y - pad && py < bx.y + bx.h + pad) n++; }
        } });
        return n;
      };
      const pick = (cs, w, h, pad) => cs.reduce((a, c) => { const o = Object.assign({w, h}, c), n = clash(o, pad); return n < a.n ? Object.assign({n}, o) : a; }, {n: Infinity});
      // 곡선 위 빈 띠 (가장 높은 봉우리보다 14 g/L 위) — 선 바로 옆이 막히면 여기에 두고 지시선으로 잇는다
      const top = Math.max(LIM, r.max1, casc ? r.max2 : 0), limY = gy1(LIM), bandY = top + 14 <= SAT - 4 ? gy1(top + 14) : null;
      // 관리 한계 글: 오른쪽 선 바로 위 → 바로 아래 → 빈 띠 → 왼쪽 · 가운데
      const LW = 242, LH = 30, lx = GX1 - LW - 4, mx = (GX0 + GX1 - LW) / 2;
      const limC = [{x: lx, y: limY - LH - 3}, {x: lx, y: limY + 4}];
      if (bandY != null) limC.push({x: lx, y: bandY - LH, lead: 1});
      limC.push({x: GX0 + 8, y: limY - LH - 3}, {x: GX0 + 8, y: limY + 4}, {x: mx, y: limY - LH - 3}, {x: mx, y: limY + 4});
      const lp = pick(limC, LW, LH, 10);                                         // 여유 10: 한계 바로 밑을 기는 곡선(역류 첫 탱크 ≈ 59 g/L)도 피한다
      let labs = '';
      if (lp.lead){
        // 지시선은 곡선을 가로지르지 않는 x에 (판 오른쪽부터 찾고, 없으면 오른쪽 끝)
        let ldx = lp.x + LW - 18;
        for (let x = ldx; x >= lp.x + 18; x -= 6) if (!clash({x: x - 1, y: lp.y + LH, w: 2, h: limY + 8 - lp.y - LH}, 4)){ ldx = x; break; }
        labs += L(ldx, lp.y + LH, ldx, limY - 4, 'st06-limld') + C(ldx, limY, 4, 'st06-limk');
        boxes.push({x: ldx - 2, y: lp.y + LH, w: 4, h: limY - lp.y - LH});
      }
      labs += R(lp.x, lp.y, LW, LH, 'st06-tplate', {rx: 6}) + T(lp.x + LW - 4, lp.y + 22, '관리 한계 60 g/L (가정)', 'st06-limt', 'end');
      boxes.push({x: lp.x, y: lp.y, w: LW, h: LH});
      // 한계에 처음 닿는 날: 점 + 'N일째 한계' (점 왼쪽 위 → 오른쪽 위 → 빈 띠(지시선) → 아래)
      [[r.cross1, r.P1], [r.cross2, r.P2]].forEach(([cd, P], i) => {
        if (cd < 0) return;
        const v = (P.find(p => p[0] === cd) || [0, LIM])[1], cx = dx(cd), cy = gy1(v);
        g1 += C(cx, cy, 8, 'k-ng');
        if (i) return;
        const CW = 116, CH = 28, cc = [{x: cx - CW - 12, y: cy - CH - 10}, {x: cx + 12, y: cy - CH - 10}];
        if (bandY != null) cc.push({x: cx - CW / 2, y: bandY - CH, lead: 1}, {x: cx - CW / 2, y: bandY - CH - 36, lead: 1});
        cc.push({x: cx + 12, y: cy + 10}, {x: cx - CW - 12, y: cy + 10});
        const cp = pick(cc, CW, CH);
        if (cp.lead) labs += L(cx, cp.y + CH, cx, cy - 10, 'st06-crld');
        labs += R(cp.x, cp.y, CW, CH, 'st06-tplate', {rx: 6}) + T(cp.x + CW / 2, cp.y + 20, `${cd}일째 한계`, 'st06-crt');
      });
      // 글 (선 위에 겹쳐도 읽히게 판을 깐다) — 선보다 나중에 그린다
      g1 += satLab + labs;
      // 범례
      g1 += L(1190, 166, 1222, 166, 'st06-c1') + T(1230, 173, casc ? '탱크 1' : '탱크', 't-dim', 'start');
      if (casc) g1 += L(1316, 166, 1348, 166, 's-curve') + T(1356, 173, '탱크 2 · 마무리', 't-dim', 'start');
      ctx.$('[data-v="g1"]').innerHTML = g1;
      // ---- 그래프 2: 물 · 알칼리 ----
      let g2 = '';
      g2 += L(GX0, gyw(r.weq), GX1, gyw(r.weq), 'st06-eq');
      const eqLab = R(GX1 - 150, gyw(r.weq) - 34, 146, 28, 'st06-tplate', {rx: 6}) + T(GX1 - 10, gyw(r.weq) - 13, `평형 ${r.weq} % (가정)`, 'st06-eqt', 'end');
      // 다른 액(물 적음 ↔ 몇 %)이면 — 늘기도 줄기도 한다
      g2 += PL(other.PW.map(([d, w]) => [dx(d), gyw(w)]), 'st06-ghost', tip(st.wt === 'dry' ? '물이 몇 % 든 액이었다면 — 날아가 줄어든다' : '물이 거의 없는 액이었다면 — 빨아들여 늘어난다'));
      g2 += PL(r.PA.map(([d, a]) => [dx(d), gya(a)]), 'st06-alk', tip('알칼리 남은 비율 (오른쪽 눈금) — 녹은 PR · CO₂ · 분해로 준다'));
      g2 += PL(r.PW.map(([d, w]) => [dx(d), gyw(w)]), 's-curve', tip(`물 (%) — 평형 ${r.weq} % 쪽으로 다가간다`)) + eqLab;
      // 범례 줄
      const ly = 748;
      g2 += L(GX0, ly - 6, GX0 + 30, ly - 6, 's-curve') + T(GX0 + 38, ly, casc ? '물 (마무리 탱크)' : '물', 't-dim', 'start');
      const x2 = casc ? GX0 + 210 : GX0 + 90;
      g2 += L(x2, ly - 6, x2 + 30, ly - 6, 'st06-alk') + T(x2 + 38, ly, '알칼리 (오른쪽 눈금)', 'st06-at', 'start');
      const x3 = x2 + 250;
      g2 += L(x3, ly - 6, x3 + 30, ly - 6, 'st06-ghost') + T(x3 + 38, ly, st.wt === 'dry' ? '물이 몇 % 든 액이면' : '물이 거의 없는 액이면', 't-dim', 'start');
      ctx.$('[data-v="g2"]').innerHTML = g2;
      ctx.refresh();
      // ---- 숫자 ----
      ctx.out('k-cmax', `${fC(r.last)} g/L`); grade('k-cmax', r.last);
      kpiSub('k-cmax', casc ? `마무리 탱크 (첫 탱크 ${fC(r.max1)} g/L)` : 'g/L · 웨이퍼가 마지막에 만나는 탱크');
      ctx.out('k-tx', `×${r.tau.toFixed(2)}`); grade('k-tx', r.max1);
      kpiSub('k-tx', casc ? '첫 탱크(PR 대부분을 녹이는 곳) 기준' : '새 액 대비 배수 (최고일 때)');
      ctx.out('k-w', `${f1(r.w0)}→${f1(r.wX)}\u00a0%`); kpiSub('k-w', `${up ? '늘어남' : '줄어듦'} — 평형 ${r.weq} % 쪽으로`);
      ctx.out('k-a', `${Math.round(r.aMin * 100)} %`); kpiSub('k-a', casc ? `최저 · 마무리 탱크 (첫 탱크 ${Math.round(r.a1Min * 100)} %)` : '최저 (가정 모델)');
      ctx.out('k-use', `${Math.round(r.use)} L`); kpiSub('k-use', `웨이퍼당 약 ${Math.round(r.use * 1000 / (st.n * DAYS))} mL`);
      if (r.sat.length) kpiBox('k-cmax').classList.add('ng');
      // 쓰지 않는 손잡이는 흐리게
      const ctlOf = id => { const i = ctx.card.querySelector(`input[data-i="${id}"]`); return i && i.closest('.ctl'); };
      const cdd = ctlOf('dd'), cb = ctlOf('b');
      if (cdd) cdd.classList.toggle('st06-off', !dump);
      if (cb) cb.classList.toggle('st06-off', dump);
      // ---- 메시지 ----
      const m = [];
      if (dump) m.push(`<b>통째 교체 ${st.dd}일</b>: 녹은 PR이 하루 ${f1(r.g)} g/L씩 쌓여 교체 직전 ${fC(r.max1)} g/L — 클리어 시간 ×${r.tau.toFixed(2)}. ` + (r.cross1 > 0 ? `관리 한계(60 g/L, 가정)를 ${r.cross1}일째 넘습니다 → 주기를 줄이거나 보충을 씁니다.` : '관리 한계(60 g/L, 가정) 안입니다.'));
      else if (!casc) m.push(r.g / b >= SAT ? `<b>매일 ${st.b} % 보충</b>: 멈추는 수준 g/b = ${fC(r.g / b)} g/L가 포화 상한(150 g/L, 가정)보다 높아 액이 포화됩니다 → 보충률을 올리거나 처리량을 줄입니다.` :
        `<b>매일 ${st.b} % 보충</b>: 녹은 PR이 g/b = ${fC(r.g / b)} g/L 근처에서 멈춥니다(95 %까지 약 ${Math.round(3 / b)}일${3 / b > DAYS ? ' — 30일 동안은 아직 오르는 중' : ''}). 보충률을 두 배로 하면 수준은 절반, 새 액도 두 배입니다.`);
      else if (r.max2 >= SAT) m.push(`<b>역류</b>: 보충이 너무 적어 마무리 탱크까지 ${fC(r.max2)} g/L로 차 버렸습니다 — 캐스케이드의 이점이 없습니다. 보충률을 올리거나 처리량을 줄입니다.`);
      else m.push(`<b>역류</b>: 첫 탱크는 ${fC(r.max1)} g/L로 지치지만 웨이퍼가 마지막에 만나는 탱크는 ${fC(r.max2)} g/L로 약 ${(r.max1 / Math.max(0.1, r.max2)).toFixed(1)}배 깨끗합니다. 새 액은 한 달 ${Math.round(r.use)} L로 한 탱크 보충과 같습니다. 드래그아웃(3 mL/장, 가정)을 줄이면 마무리 탱크가 더 깨끗해집니다.`);
      m.push(`물: ${f1(r.w0)} % → ${f1(r.wX)} %(${up ? '늘어남' : '줄어듦'}) — 액의 물은 평형(${r.weq} %, 가정) 쪽으로 다가갑니다. 알칼리는 최저 ${Math.round(r.aMin * 100)} %.`);
      if (r.sat.length) m.push('<b>포화</b> — 이 조건은 현실에서 쓰지 않습니다(녹지 못한 PR이 잔여 · 재부착으로).');
      ctx.q('[data-o=msg]').innerHTML = m.join(' ');
    }
    ctx.range('n', v => { st.n = v; render(); return v + '장'; });
    ctx.range('V', v => { st.V = v; render(); return v + ' L'; });
    ctx.range('dd', v => { st.dd = v; render(); return v + '일'; });
    ctx.range('b', v => { st.b = v; render(); return v + ' %'; });
    ctx.seg('pr', v => { st.pr = v; render(); });
    ctx.seg('mode', v => { st.mode = v; render(); });
    ctx.seg('cov', v => { st.cov = v; render(); });
    ctx.seg('wt', v => { st.wt = v; render(); });
    ctx.card.querySelectorAll('.st06-w input, .st06-w .pl-seg button').forEach(el => el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(bt => bt.setAttribute('aria-pressed', bt.dataset.v === v ? 'true' : 'false'));
    const setRange = (id, v, txt) => { const i = ctx.card.querySelector(`input[data-i="${id}"]`); if (i) i.value = v; ctx.out(id, txt); };
    ctx.demo = sid => {
      const d = DEMO[sid];
      if (touched || !d) return ctx.refresh();
      Object.assign(st, d);
      ['mode', 'cov', 'wt'].forEach(k => setSeg(k, st[k]));
      setRange('dd', st.dd, st.dd + '일'); setRange('b', st.b, st.b + ' %');
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['액 나이 (배스 라이프)', '새 액을 넣은 뒤 처리한 장수 · 지난 일수'],
      ['로딩 (녹은 PR 양)', '액 1 L에 녹아 있는 PR 무게(g/L)'],
      ['bleed & feed', '액 일부를 빼고(bleed) 새 액을 넣는(feed) 보충'],
      ['캐스케이드 (역류)', '새 액을 마무리 탱크에 넣고 앞 탱크로 넘기는 구조. 액은 웨이퍼와 반대 방향으로 흐른다'],
      ['칼 피셔 적정', '액 속 물 함량을 재는 표준 분석'],
      ['평형 물 함량', '액이 공기 중 물을 빨아들이는 빠르기와 내보내는 빠르기가 같아지는 물 함량. 온도 · 실내 습도 · 덮개가 정한다'],
      ['클리어 시간', '눈에 보이는 PR이 다 걷힐 때까지 걸린 시간'],
      ['드래그아웃', '웨이퍼 · 카세트에 묻어 다음 탱크로 넘어가는 액']
    ]) + K.field([
      '액 교체 직후와 교체 직전의 결과를 비교하면 액 나이 효과가 바로 보입니다. lot 기록에 <b>액 사용 일수 · 처리 장수</b>를 남겨 두어야 나중에 불량과 맞춰 볼 수 있습니다.',
      '제품마다 PR 두께 · 개구율이 달라 웨이퍼당 PR 양이 다릅니다(35 µm면 약 2.2 g, 60 µm면 약 3.8 g, 코어 다이 예시 22 µm면 약 1.4 g — <a data-go="why">01장</a>). 교체 기준을 \'장수\'보다 <b>\'PR 무게 환산\'</b>으로 보면 더 정확합니다. 보충만으로는 물 · 분해산물이 쌓이는 액은 정기 전량 교체를 함께 씁니다.',
      '물 함량은 한쪽으로만 가지 않습니다. 물이 몇 % 든 액은 데우는 동안 물이 날아가 줄 수 있어, 장비에 따라 인라인 농도계로 물을 자동 보충합니다. 질소 덮기는 산소 · 이산화탄소는 막지만 물 · 휘발 성분 증발은 키울 수 있습니다.',
      '박리형 약품에서 가교 PR 조각은 바로 녹지 않고 필터에 쌓이므로, 분석값보다 <b>필터 차압 · 필터 교체 주기</b>가 먼저 한계에 닿을 수 있습니다(<a data-go="resist.lift">02장</a>). 알칼리 액에서는 조각도 천천히 녹아 녹은 PR 양을 늘립니다.',
      '액에 녹은 Cu(ICP)가 늘면 부식이 있었다는 뜻이자, 그 Cu가 다시 Cu를 녹이는 산화제가 될 수 있다는 뜻입니다 → <a data-go="metal.cu">07장</a>. 잔여 · 재부착 불량이 늘면 액 나이와 마무리 탱크 상태부터 봅니다 → <a data-go="residue.redep">08장</a>.'
    ]) + K.deep(`<p>매일 일부를 바꾸는 보충(bleed & feed)과 역류 캐스케이드는 같은 물질 수지(收支 — 들어오고 나가는 양의 셈)로 풉니다. g는 하루에 들어오는 녹은 PR(g/L), b는 하루 보충 비율입니다.</p>
      ${K.eq('C(다음 날) = C · (1 − b) + g   →   C* = g / b')}
      <ul><li><b>보충 모델</b> — 95 %까지 약 3/b일 걸립니다(<a href="#go-plating-11">전해도금 11장</a>의 분해산물 모델과 같은 꼴). 예: 200장/일 · 40 L · 2.2 g/장 → g ≈ 11 g/L/일, b 20 %면 C* ≈ 55 g/L(15일쯤 거의 도달). 보충률을 두 배로 하면 수준은 절반, 새 액도 두 배입니다. 웨이퍼당 약품 사용량 = 한 달 새 액 ÷ 한 달 장수(240 L ÷ 6,000장 = 40 mL/장)로 비용을 비교합니다.</li>
      <li><b>역류 캐스케이드</b> — 드래그아웃이 없으면 마무리 탱크 C₂* = (1 − φ)g/b, 첫 탱크 C₁* = C₂* + φg/b(φ 0.9 → 5.5 · 55 g/L, 10배). 실제로는 웨이퍼 양면의 끌어올림 액막 · 범프 숲에 고인 액 · 카세트 몫이 웨이퍼당 수 mL를 첫 탱크에서 마무리 탱크로 옮깁니다. 웨이퍼당 3 mL(가정)면 하루 0.6 L × 약 59 g/L ≈ 35 g으로 마무리 탱크에 바로 들어오는 PR(44 g)과 맞먹어 C₂* ≈ 9 g/L — 같은 새 액으로 마지막 액이 약 6배(드래그아웃에 따라 5~10배) 깨끗합니다(PR 60 µm면 16 · 101 g/L). <b>물기 빼는 시간 · 들어 올리는 속도로 드래그아웃을 줄이는 것</b>도 마무리 탱크를 지키는 손잡이입니다.</li>
      <li><b>물의 평형</b> — 액의 물 증기압 p_w = x_w · γ_w · p_sat(T)가 실내 공기의 물 분압(22 °C · 45 %RH에서 약 1.2 kPa)과 같아지는 곳이 평형입니다. 물의 포화 증기압은 60 · 70 · 80 °C에서 약 20 · 31 · 47 kPa로 공기보다 훨씬 커서, 데운 액의 평형 물 함량은 DMSO–물의 음의 편차(γ_w &lt; 1)를 감안해도 몇 % 수준(대략 추정)이고 온도가 높을수록 낮습니다. 그래서 물이 적은 액은 빨아들이고, 물이 많은 배합은 오히려 물을 잃습니다. 물은 금속 부식 · 재석출을 키우므로(<a data-go="chem.water">04장</a>) 어느 쪽이든 재서 맞춥니다.</li>
      <li><b>왜 느려지나</b> — 녹은 고분자가 많으면 점도가 올라 겉면 공급이 줄고, 용제의 '빈자리'가 줄어 사슬이 풀려 나가는 힘이 약해집니다(위젯의 1 + C/100은 이 경향의 가정). 물이 들어오면 녹아 있던 PR이 뿌옇게 석출될 수 있고, 반대로 물을 넣어 PR을 석출시켜 거르는 재생 방법도 특허로 알려져 있습니다.</li>
      <li><b>알칼리가 줄어드는 길과 분석</b> — 녹은 PR의 산성기(페놀 · 카복실산)와의 중화, 공기 중 이산화탄소 흡수, 열 분해, 드래그아웃. 물(칼 피셔), 알칼리(산염기 적정), 녹은 PR(흡광 · 굴절률 · 밀도 — 액마다 검량선), 녹은 금속(ICP — 녹은 Cu는 부식의 결과이자 원인이라 교체 기준 후보), 클리어 시간(표준 시편)을 함께 봅니다. 공개 특허에는 흡광 · 전도도로 물 · 알칼리를 자동 보충하는 액 관리 장치가 있습니다.</li>
      <li><b>헹굼 탱크도 지친다</b> — 카세트 · 웨이퍼에 묻어 IPA 등 중간 헹굼 탱크로 넘어간 스트리퍼는 그 탱크도 지치게 합니다(헹굼 효과 ↓, 물을 만나면 석출 ↑). 헹굼 탱크에도 교체 기준이 필요합니다(<a data-go="tool.rinse">05장</a>).</li>
      <li><b>공개 연구</b> — DMSO + 4차 암모늄 수산화물 액으로 두꺼운 네거티브 PR을 걷으며 새 액과 묵은 액으로 시편의 부풂 · 녹음을 비교해, 300 mm 매엽에서 액 수명을 7일 넘게 쓸 수 있는지 평가한 학회 논문이 있습니다. 온도를 올리면 클리어는 빨라지지만 물 · 휘발 성분 증발과 분해도 빨라져 액 수명이 줄 수 있습니다.</li></ul>`);
  },
  css: `.pl-svg .st06-iliq{fill:rgba(192,132,252,.25)}
.pl-svg .st06-iliq2{fill:rgba(180,83,9,.55)}
.pl-svg .st06-igauge{fill:none;stroke:#94a3b8;stroke-width:2.4}
.pl-svg .st06-ineedle{stroke:#fbbf24;stroke-width:2.4}
.pl-svg .st06-tint{stroke:none}
.pl-svg .st06-plate{fill:rgba(5,10,20,.62);stroke:rgba(148,163,184,.18);stroke-width:1}
.pl-svg .st06-tplate{fill:rgba(8,15,30,.88);stroke:none}
.pl-svg .st06-dot{fill:#9a3412;stroke:#fed7aa;stroke-width:.8;opacity:.9}
.pl-svg .st06-cas{fill:none;stroke:#94a3b8;stroke-width:3}
.pl-svg .st06-cv{font-size:32px;font-weight:900;fill:#fde68a !important}
.pl-svg .st06-cvw{font-size:32px;font-weight:900;fill:#fca5a5 !important}
.pl-svg .st06-cap{font-size:21px;font-weight:800;fill:#fde68a !important}
.pl-svg .st06-wat{font-size:21px;font-weight:800;fill:#5eead4 !important}
.pl-svg .st06-lid{fill:#334155;stroke:#94a3b8;stroke-width:1.6}
.pl-svg .st06-h2o{fill:#5eead4;stroke:#99f6e4;stroke-width:1}
.pl-svg .st06-steam{fill:none;stroke:#e2e8f0;stroke-width:2.4;stroke-linecap:round}
.pl-svg .st06-co2t{font-size:19px;font-weight:800;fill:#cbd5e1 !important}
.pl-svg .st06-drop{fill:#fbbf24;stroke:#92400e;stroke-width:1.4}
.pl-svg .st06-wpath{fill:none;stroke:#7dd3fc;stroke-width:2;stroke-dasharray:4 6;opacity:.7}
.pl-svg .st06-probe{stroke:#cbd5e1;stroke-width:6;stroke-linecap:round}
.pl-svg .st06-phead{fill:#4ade80;stroke:#14532d;stroke-width:2}
.pl-svg .st06-rowhl{fill:rgba(56,189,248,.12);stroke:#38bdf8;stroke-width:1.6}
.pl-svg .st06-good{font-size:21px;font-weight:800;fill:#86efac !important}
.pl-svg .st06-bad{font-size:21px;font-weight:800;fill:#fca5a5 !important}
.pl-svg .st06-grid{fill:none;stroke:rgba(148,163,184,.16);stroke-width:1}
.pl-svg .st06-raxis{fill:none;stroke:#a78bfa;stroke-width:1.4;opacity:.7}
.pl-svg .st06-at{font-size:19px;fill:#c4b5fd !important}
.pl-svg .st06-lim{fill:none;stroke:#fbbf24;stroke-width:2;stroke-dasharray:10 6}
.pl-svg .st06-limt{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .st06-limld{stroke:#fbbf24;stroke-width:1.6;opacity:.85}
.pl-svg .st06-limk{fill:#fbbf24;stroke:none}
.pl-svg .st06-crld{stroke:#fca5a5;stroke-width:1.6;opacity:.85}
.pl-svg .st06-c1{fill:none;stroke:#f59e0b;stroke-width:3.4;stroke-linejoin:round}
.pl-svg .st06-alk{fill:none;stroke:#a78bfa;stroke-width:3;stroke-dasharray:9 6}
.pl-svg .st06-ghost{fill:none;stroke:rgba(148,163,184,.6);stroke-width:2;stroke-dasharray:5 6}
.pl-svg .st06-eq{fill:none;stroke:#5eead4;stroke-width:1.8;stroke-dasharray:3 6}
.pl-svg .st06-eqt{font-size:19px;font-weight:800;fill:#5eead4 !important}
.pl-svg .st06-sat{fill:rgba(248,113,113,.25);stroke:none}
.pl-svg .st06-satt{font-size:19px;font-weight:800;fill:#fca5a5 !important}
.pl-svg .st06-rep{fill:#4ade80;stroke:none}
.pl-svg .st06-rept{font-size:19px;font-weight:700;fill:#86efac !important}
.pl-svg .st06-crt{font-size:19px;font-weight:800;fill:#fca5a5 !important}
.pl-svg .st06-tc1{font-size:21px;font-weight:700;fill:#e2e8f0 !important}
.pl-svg .st06-foot{font-size:19px;fill:#94a3b8 !important}
.jc .st06-w .ctl.st06-off{opacity:.42}
.jc .st06-msg{min-height:96px}`
});
})();
