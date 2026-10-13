/* 전해도금 11 — 도금액 관리: 약품은 어떻게 변하고 어떻게 지킬까 (날짜 · 주) */
(function(){
const DAYS = 30, X0 = 620, X1 = 1550;
const dx = d => X0 + d / DAYS * (X1 - X0);
const LANES = [
  {id: 'metal', y: 178, h: 200, t: '① 금속 농도', u: '목표 = 1', lo: 0.9, hi: 1.1, min: 0.8, max: 1.2},
  {id: 'add', y: 428, h: 200, t: '② 첨가제 농도', u: '목표 = 1', lo: 0.9, hi: 1.1, min: 0.7, max: 1.3},
  {id: 'byp', y: 678, h: 200, t: '③ 분해산물', u: '교체 기준 = 1', lo: null, hi: 1, min: 0, max: 1.4}
];
const PY = 918, PH = 96;                                       // 생산량 막대
const QUIET = [11, 17];                                         // 한가한 주 (생산량이 적은 날)
// 개념 모델 계수 (상대값): 첨가제 소모 = CA × Ah + CI(쉬는 동안의 분해, 하루), 분해산물 생성 = G × Ah
const CA = 0.07, CI = 0.025, G = 0.04;
// 양극 종류별 금속 변화 (하루): a × Ah + idle(쉬는 동안 양극이 산에 녹는 몫)
const AN = {
  cu: {a: 0.0015, idle: 0.001, lb: 'Cu (가용성) — 조금씩 ↑'},
  ni: {a: 0.0045, idle: 0.0005, lb: 'Ni (가용성) — 금속 · pH ↑'},
  ins: {a: -0.03, idle: 0, lb: '불용성 — ↓ → 분석 뒤 보충 (산 ↑)'},
  pas: {a: -0.007, idle: 0, lb: '양극 부동태 — ↓ · 전압 ↑'}
};
const DOSE = {time: '시간 기준', ah: 'Ah 기준', mix: 'Ah + 시간'};
const BG = [0, 4, 8];                                           // 분해산물 비교용 bleed (%/일)
// 발표 모드 · 손대기 전: 단계에 맞는 예시 값 (분해산물 단계는 bleed를 켜 정상 수준과 시간 상수를, 분석 단계는 흔들림 없는 액에서 한 점만 튀는 모습을)
const DEMO = {metal: {dose: 'time', bleed: 0}, add: {dose: 'time', bleed: 0}, byp: {dose: 'time', bleed: 5}, ana: {dose: 'mix', bleed: 5}};
const em = s => [...String(s)].reduce((a, c) => a + (/[ㄱ-힝]/.test(c) ? 1 : /[A-Za-z0-9 .,()=\-]/.test(c) ? 0.55 : 0.85), 0);

function production(v, K){
  const r = K.rng(77), prod = [];
  for (let d = 0; d < DAYS; d++){ const q = d >= QUIET[0] && d <= QUIET[1]; const x = r(); prod.push(!v ? 1 : q ? 0.35 + x * 0.2 : 0.7 + x * 0.9); }
  return prod;
}
function sim(p, K){
  const prod = production(p.var, K), b = p.bleed / 100, an = AN[p.an];
  const M = [1], A = [1], B = [0.15];
  let metalDose = 0;
  for (let d = 0; d < DAYS; d++){
    const ah = prod[d];
    // 금속: 양극 종류별 변화 + bleed & feed(목표 농도의 새 액)가 1로 당김. 불용성은 2일마다 분석해 모자라면 보충
    let m = M[d] + an.a * ah + an.idle - b * (M[d] - 1);
    if (p.an === 'ins' && d % 2 === 1 && m < 0.97){ m = 1; metalDose++; }
    M.push(m);
    // 첨가제: 소모 = Ah 몫 + 시간 몫. 보충은 고른 방식대로 (계수는 평균 생산량 1에 맞춰 둠)
    const use = CA * ah + CI;
    const dose = p.dose === 'time' ? CA + CI : p.dose === 'ah' ? (CA + CI) * ah : CA * ah + CI;
    A.push(A[d] - use + dose - b * (A[d] - 1));
    B.push(B[d] * (1 - b) + G * ah);
  }
  const out = A.filter(v => v < 0.9 || v > 1.1).length;
  const cross = B.findIndex(v => v >= 1);
  const avg = prod.reduce((a, v) => a + v, 0) / DAYS;
  return {prod, M, A, B, out, cross, ss: b > 0 ? G * avg / b : Infinity, metalDose};
}

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '11', id: 'bath', part: 3, short: '도금액 관리', scale: '날짜 · 주',
  title: '도금액 관리 — 약품은 어떻게 변하고 어떻게 지킬까?',
  hook: '쓰고, 쪼개지고, 쌓인다',
  one: '도금액은 매일 변합니다. 금속은 양극에 따라 늘거나 줄고, 첨가제는 쓰이고 쪼개지며, 분해산물은 쌓입니다. 그래서 재고, 보충하고, 덜어 내는 일이 도금 공정 관리의 절반입니다.',
  ana: '<b>국물 요리</b> — 끓이면 국물이 졸고(증발 → 모든 농도↑), 양념 맛은 날아가고(첨가제 분해), 찌꺼기는 쌓입니다(분해산물). 맛을 보고(분석) 간을 맞추고(보충), 너무 탁해지면 일부를 덜어 내고 새 육수를 붓습니다(bleed & feed). 한계: 도금액은 혀가 아니라 분석기로 재고, 그 값에도 오차가 있어 한 번에 크게 간을 바꾸지 않습니다.',
  steps: [
    {id: 'metal', t: '금속 — 양극에 따라 늘거나 준다', d: '가용성 양극(애노드, +)이면 금속은 보통 서서히 늡니다. 양극은 거의 100 % 녹는데 음극(캐소드, −)인 웨이퍼에는 수소 몫만큼 덜 쌓이고, 쉬는 동안에도 양극이 조금 녹기 때문입니다(Ni는 pH도 ↑). 불용성 양극은 쓴 만큼 줄고 산이 늡니다.'},
    {id: 'add', t: '첨가제 — 전기량 몫 + 시간 몫', d: '첨가제는 대부분 흘린 전기량(Ah)만큼 줄고, 쉬는 동안에도 조금씩 분해됩니다. 그래서 Ah 기준과 시간 기준을 함께 쓰고(Ah + 시간), 분석값으로 작게 보정합니다.'},
    {id: 'byp', t: '분해산물 — 쌓이면 덜어 낸다', d: '분해 조각은 계속 쌓입니다. bleed & feed는 정상 수준(g·Ah/b)에서 멈추게 하지만 거기까지 약 3/b일이 걸립니다. 활성탄 처리는 좋은 첨가제도 빼앗으므로 처리 뒤 첨가제를 다시 맞춥니다.'},
    {id: 'ana', t: '분석과 판정', d: '액마다 적정 · CVS · ICP · HPLC로 재어 관리도에 찍습니다. 한 점이 튀었다고 크게 보충하지 않습니다(과보정). 다시 재고 추세와 관리도 규칙으로 보충 · 홀드 · 원인 분석을 정합니다.'}
  ],
  icon(K){
    const {P, PL} = K;
    return P('M2,60 L64,60 M2,60 L2,4', 's-axis') + PL([[4, 30], [14, 22], [14, 34], [26, 26], [26, 36], [38, 28], [38, 38], [50, 30], [50, 40], [62, 32]], 's-curve');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, wrap} = K;
    let s = '';
    // ---- 왼쪽: 탱크와 드나드는 것 ----
    s += R(40, 130, 440, 990, 'pl-panel', {rx: 16}) + T(64, 172, '탱크에 드나드는 것', 't-acc', 'start');
    s += P('M120,380 L120,620 L400,620 L400,380', 'f-tank') + R(123, 410, 274, 207, 'f-bath', tip('도금액'));
    const io = (d, cls, t, sub, x, y) => G(K.arrowP(d, cls) + T(x, y, t, 't-sub', 'start') + T(x, y + 28, sub, 't-dim', 'start'), tip(t + ' — ' + sub));
    s += io('M170,266 L170,400', 's-arrg', '보충 (도징)', '첨가제 · 금속', 64, 220);
    s += io('M350,266 L350,400', 's-arr', '새 액 (feed)', '목표 농도의 새 액', 262, 220);
    s += io('M350,620 L350,700', 's-arrr', '덜어 냄 (bleed)', '분해산물째 버림', 262, 736);
    s += io('M120,540 L72,540 L72,700', 's-arr3', '샘플 → 분석', '적정 · CVS · ICP', 56, 736);
    s += G(K.arrow(260, 404, 260, 346, 's-arr3') + T(260, 332, '증발 (물)', 't-dim'), tip('물이 증발하면 금속 · 산 · 첨가제가 함께 진해진다\n→ DI수로 액위를 맞춘다. 셋이 함께 오르면 증발부터 의심'));
    s += G(R(180, 446, 160, 56, 'pl-box', {rx: 10}) + T(260, 483, '도금 (Ah)', 't-sub'), tip('웨이퍼를 도금하면서 금속과 첨가제를 쓴다 (흘린 전기량 Ah에 비례)'));
    // 분해산물: 바닥에 쌓이는 조각
    const rf = K.rng(19);
    let fr = '';
    for (let k = 0; k < 16; k++) fr += C(140 + rf() * 240, 528 + rf() * 40, 3 + rf() * 3, 'p11-frag');
    s += G(fr + T(260, 600, '분해산물이 쌓인다', 't-warn'), W(on('byp'), tip('첨가제가 쪼개진 조각 · 양극 · PR에서 녹아 나온 유기물')));
    // 단계별 요점 상자 (발표 모드에서도 장면만 보고 이해되게)
    s += R(56, 792, 408, 314, 'pl-box', {rx: 12});
    const note = (st, title, items, eq) => {
      let g = T(78, 828, title, 't-acc', 'start'), y = 864;
      if (eq){ g += T(78, y + 4, eq, 'pl-eqn', 'start'); y += 38; }
      items.forEach(it => { wrap(it, 18.6).forEach((ln, j) => { g += T(j ? 96 : 78, y, (j ? '' : '· ') + ln, 't-dim', 'start'); y += 26; }); y += 4; });
      return G(g, only(st));
    };
    s += note('metal', '왜 늘거나 줄까?', [
      '가용성 양극: 양극은 거의 100\u00a0% 녹고, 웨이퍼(음극)에는 수소 몫만큼 덜 쌓인다 → 보통 ↑',
      '쉬는 동안에도 양극이 산에 조금 녹는다 → ↑',
      'Ni는 pH도 함께 ↑ · Sn 양극을 쓰는 SnAg도 Sn ↑ (Ag는 따로 보충)',
      '불용성 양극: 쌓인 만큼 정확히 ↓, 대신 산(H⁺) ↑'
    ]);
    s += note('add', '보충 방식 세 가지', [
      '시간 기준: 하루 정량 → 생산량이 변하면 틀린다',
      'Ah 기준: 쓴 전기량만큼 → 쉬는 동안의 분해는 못 따라가 한가할 때 모자란다',
      'Ah + 시간: 두 몫을 모두 → 그래도 분석값으로 작게 보정'
    ]);
    s += note('byp', 'bleed & feed — 어디서, 얼마나 빨리', [
      '1/b일 → 남은 차이의 63\u00a0%, 3/b일 → 95\u00a0% (b\u00a0=\u00a05\u00a0%/일이면 20일 · 60일)',
      'bleed를 Ah에 묶으면 생산량과 상관없이 일정',
      '활성탄 처리는 좋은 첨가제도 빼앗는다 → 처리 뒤 다시 맞춤'
    ], 'B* = g · Ah / b');
    s += note('ana', '분석값 읽기', [
      '분석에도 오차(CVS 수\u00a0%)와 지연이 있다',
      '한 점이 튀면 다시 재고 추세를 본다 — 바로 크게 보충하면 과보정',
      '금속 · 산 · 첨가제가 함께 오르면 증발부터',
      '분석값은 정상인데 막이 이상하면 헐셀 · 불순물(ICP)'
    ]);
    // ---- 오른쪽: 30일 그래프 ----
    s += R(500, 130, 1080, 990, 'pl-panel', {rx: 16});
    // 한가한 주 띠 (첨가제 단계에서)
    s += G(R(dx(QUIET[0]), LANES[0].y, dx(QUIET[1] + 1) - dx(QUIET[0]), PY + PH - LANES[0].y, 'p11-qband') + T((dx(QUIET[0]) + dx(QUIET[1] + 1)) / 2, PY + 36, '한가한 주', 'p11-qt'), only('add'));
    LANES.forEach(l => {
      const yv = v => l.y + l.h - (v - l.min) / (l.max - l.min) * l.h;
      let g = R(X0, l.y, X1 - X0, l.h, 'pl-lane', {rx: 6});
      if (l.lo != null) g += R(X0, yv(l.hi), X1 - X0, yv(l.lo) - yv(l.hi), 'pl-spec', tip('관리 범위 (예시 ±10 %)'));
      g += L(X0, yv(1), X1, yv(1), l.id === 'byp' ? 'pl-peak' : 's-dash');
      g += T(X0 + 2, l.y - 10, l.t, 't-sub', 'start') + T(X0 + 14 + em(l.t) * 21, l.y - 10, '(' + l.u + ')', 't-dim', 'start');
      // 눈금 글 (왼쪽)
      if (l.lo != null) g += T(X0 - 10, yv(l.hi) + 6, '+10 %', 'p11-tick', 'end') + T(X0 - 10, yv(1) + 6, '목표', 'p11-tick', 'end') + T(X0 - 10, yv(l.lo) + 6, '−10 %', 'p11-tick', 'end');
      else g += T(X0 - 10, yv(1) + 6, '기준', 'p11-tick', 'end') + T(X0 - 10, yv(0) - 2, '0', 'p11-tick', 'end');
      g += `<g data-v="${l.id}"></g>`;
      g += R(X0 - 96, l.y - 38, X1 - X0 + 108, l.h + 44, 'pl-hlbox', W({rx: 10}, only(l.id)));
      s += g;
    });
    s += T(X0 + 2, PY - 10, '생산량 (Ah)', 't-sub', 'start') + `<g data-v="prod"></g>`;
    for (let d = 0; d <= DAYS; d += 5) s += T(dx(d), PY + PH + 30, `${d}일`, 't-dim');
    s += `<g data-v="ana"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 한 달 운영</div>
      ${K.seg('dose', [['time', '시간 기준'], ['ah', 'Ah 기준'], ['mix', 'Ah + 시간']], 'time', '첨가제 보충')}
      ${K.seg('prod', [['flat', '일정'], ['var', '들쭉날쭉 (한가한 주 포함)']], 'var', '생산량')}
      ${K.ctl('b', 'bleed & feed (%/일)', 0, 10, 0.5, 0)}
      ${K.seg('an', [['cu', 'Cu 가용성'], ['ni', 'Ni 가용성'], ['ins', '불용성'], ['pas', '양극 부동태']], 'cu', '양극')}
      ${K.kpis([['첨가제 이탈', 'k-out', '30일 중'], ['분해산물 30일째', 'k-b', '교체 기준 대비'], ['정상 수준', 'k-ss', 'bleed가 멈추는 곳'], ['정상 수준의 95 %', 'k-t95', '도달까지 · 약 3/b일']])}
      <p class="pl-msg p11-msg" data-o="msg"></p>
      ${K.model('첨가제 소모 = Ah 몫 + 쉬는 동안의 시간 몫(작게). 보충은 고른 방식대로 넣고, bleed & feed는 목표 농도의 새 액으로 당깁니다. 분해산물 B(다음 날) = B × (1 − b) + g × Ah. 금속은 양극 종류별 하루 변화를 가정했습니다. 숫자는 상대값 · 예시입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, T, G, LB, PL, tip, only} = K;
    const st = {dose: 'time', var: true, bleed: 0, an: 'cu'};
    ctx.card.classList.add('p11-card');                          // 단계 설명 · 메시지 높이를 고정해 예시 값이 바뀌어도 카드 길이가 그대로이게
    const yOf = (id, v) => { const l = LANES.find(x => x.id === id); return l.y + l.h - (K.clamp(v, l.min, l.max) - l.min) / (l.max - l.min) * l.h; };
    const pts = (id, arr) => arr.map((v, d) => [dx(d), yOf(id, v)]);
    // 같은 레인에 다른 선택지를 색 점선으로 겹쳐 그리고, 레인 안 위(늘어나는 것) · 아래(줄어드는 것)에 범례
    function ghosts(id, list, sel){
      const l = LANES.find(x => x.id === id);
      let g = '';
      const xs = {top: X0 + 14, bot: X0 + 14};
      list.forEach(([k, arr, lb, row = 'top'], i) => {
        g += PL(pts(id, arr), 'p11-ghost p11-c' + i);
        const on = k === sel, y = row === 'top' ? l.y + 26 : l.y + l.h - 14, x = xs[row];
        g += L(x, y - 6, x + 26, y - 6, 'p11-lg p11-c' + i + (on ? ' on' : '')) + T(x + 34, y, lb, 'p11-glt p11-c' + i + (on ? ' on' : ''), 'start');
        xs[row] += 34 + em(lb) * 18.5 + 26;
      });
      // 지금 설정 (위젯 값) — 굵은 선. 범례가 모두 아래 줄이면 같은 줄에 (위쪽은 곡선이 지나가는 자리)
      const cur = id === 'byp' ? `지금 설정 (${st.bleed} %/일)` : '지금 설정';
      const row = list.every(x => x[3] === 'bot') ? 'bot' : 'top', cy = row === 'top' ? l.y + 26 : l.y + l.h - 14;
      g += L(xs[row], cy - 6, xs[row] + 26, cy - 6, id === 'byp' ? 's-curve2' : 's-curve') + T(xs[row] + 34, cy, cur, 'p11-glt p11-cur', 'start');
      return G(g, only(id));
    }
    function render(){
      const r = sim(st, K);
      const b = st.bleed / 100;
      // ① 금속
      const gm = ghosts('metal', Object.keys(AN).map(k => [k, sim(Object.assign({}, st, {an: k}), K).M, AN[k].lb, AN[k].a > 0 ? 'top' : 'bot']), st.an);
      ctx.$('[data-v="metal"]').innerHTML = gm + PL(pts('metal', r.M), 's-curve', tip('금속 농도 — ' + AN[st.an].lb));
      // ② 첨가제
      const ga = ghosts('add', Object.keys(DOSE).map(k => [k, sim(Object.assign({}, st, {dose: k}), K).A, DOSE[k], 'bot']), st.dose);
      ctx.$('[data-v="add"]').innerHTML = ga + PL(pts('add', r.A), 's-curve', tip('첨가제 농도 — ' + DOSE[st.dose])) + r.A.map((v, d) => (v < 0.9 || v > 1.1) ? C(dx(d), yOf('add', v), 6, 'k-ng') : '').join('');
      // ③ 분해산물
      let bb = ghosts('byp', BG.map(v => ['b' + v, sim(Object.assign({}, st, {bleed: v}), K).B, v ? `bleed ${v} %/일` : 'bleed 없음']), 'b' + st.bleed);
      bb += PL(pts('byp', r.B), 's-curve2', tip('분해산물'));
      // 기준선에 닿는 날: 글은 점의 왼쪽 위 (위쪽 범례 줄과 겹치지 않게, 곡선은 닿기 전까지 기준선 아래)
      if (r.cross >= 0) bb += C(dx(r.cross), yOf('byp', 1), 9, 'k-ng') + T(dx(r.cross) - 14, yOf('byp', 1) - 7, `${r.cross}일째 교체 기준`, 'p11-crt', 'end');
      // 정상 수준: 교체 기준보다 낮으면 선, 높으면(그래프 위쪽 범례 자리이거나 그래프 밖) 기준선 아래에 경고 글
      if (isFinite(r.ss) && r.ss < 1){ const ys = yOf('byp', r.ss), up = ys - yOf('byp', 1) > 32;          // 기준선에 가까우면 글을 선 아래로
        bb += L(X0, ys, X1, ys, 'pl-ss') + T(X0 + 10, up ? ys - 8 : ys + 22, `정상 수준 ${(r.ss * 100).toFixed(0)} %`, 'pl-sst', 'start'); }
      else if (isFinite(r.ss)) bb += T(X0 + 10, yOf('byp', 1) + 26, `정상 수준 ${(r.ss * 100).toFixed(0)} % ↑ — 교체 기준보다 높음 (bleed 부족)`, 'p11-ssng', 'start');
      // 시간 상수: 1/b일(남은 차이의 63 %), 3/b일(95 %). 선은 범례 줄 아래에서 시작, 글은 오른쪽 끝에 가까우면 선의 왼쪽에
      if (b > 0) [[1, '1/b일 · 차이 63 %'], [3, '3/b일 · 차이 95 %']].forEach(([n, t]) => { const d = n / b; if (d > DAYS) return; const e = dx(d) > X1 - 230;
        bb += L(dx(d), LANES[2].y + 34, dx(d), LANES[2].y + LANES[2].h - 4, 'p11-tau') + T(e ? dx(d) - 6 : dx(d) + 6, LANES[2].y + LANES[2].h - 10, `${t} (${Math.round(d)}일)`, 'p11-taut', e ? 'end' : 'start'); });
      ctx.$('[data-v="byp"]').innerHTML = bb;
      // 생산량
      let pr = '';
      r.prod.forEach((v, d) => { pr += R(dx(d) + 4, PY + PH - v / 1.6 * PH, (X1 - X0) / DAYS - 8, v / 1.6 * PH, 'pl-bar', tip(`${d + 1}일째 생산량 ×${v.toFixed(2)}`)); });
      ctx.$('[data-v="prod"]').innerHTML = pr;
      // 분석 점 (2일마다): 측정값 = 실제 + 조금의 흔들림. 21일째 첨가제는 한 번 튄 값(오차)
      const rr = K.rng(5);
      let an = '';
      for (let d = 1; d <= DAYS; d += 2){
        const vm = r.M[d] + (rr() - 0.5) * 0.02, va = r.A[d] + (rr() - 0.5) * 0.03 + (d === 21 ? 0.12 : 0);
        an += C(dx(d), yOf('metal', vm), 7, vm < 0.9 || vm > 1.1 ? 'pl-anang' : 'pl-anaok') + C(dx(d), yOf('add', va), 7, va < 0.9 || va > 1.1 ? 'pl-anang' : 'pl-anaok');
      }
      const ya = yOf('add', r.A[21] + 0.12);
      an += LB(K.lead(dx(21) - 6, ya - 6, dx(21) - 70, LANES[1].y + 26, '한 점만 튐 → 다시 재기 (과보정 주의)', 'end', 'p11-call'));
      ctx.$('[data-v="ana"]').innerHTML = G(an + LB(T(X1, PY + PH + 66, '● 분석값 (2일마다) · 빨강 = 이탈 → 다시 재고 → 보충 · 홀드 · 원인 분석', 't-dim', 'end')), only('ana'));
      // 숫자 · 글
      ctx.out('k-out', `${r.out}일`); ctx.out('k-b', `${Math.round(r.B[DAYS] * 100)} %`);
      ctx.out('k-ss', isFinite(r.ss) ? `${Math.round(r.ss * 100)} %` : '계속 증가'); ctx.out('k-t95', b > 0 ? `${Math.round(3 / b)}일` : '—');
      const ko = ctx.card.querySelector('[data-o="k-out"]').parentNode; ko.classList.toggle('ok', r.out === 0); ko.classList.toggle('ng', r.out > 0);
      const kb = ctx.card.querySelector('[data-o="k-b"]').parentNode; kb.classList.toggle('ok', r.B[DAYS] < 0.8); kb.classList.toggle('ng', r.B[DAYS] >= 1);
      const ks = ctx.card.querySelector('[data-o="k-ss"]').parentNode; ks.classList.toggle('ok', r.ss < 0.8); ks.classList.toggle('ng', r.ss >= 1);
      const msgs = [];
      msgs.push(st.dose === 'time' ? (st.var ? '<b>시간 기준</b>은 바쁜 날 모자라고 한가한 주에 남아 첨가제가 크게 흔들립니다.' : '생산량이 일정하면 시간 기준도 맞습니다.')
        : st.dose === 'ah' ? (st.var ? '<b>Ah 기준</b>은 생산량을 따라가지만, 쉬는 동안의 분해(시간 몫)를 못 따라가 한가한 주에 조금씩 모자랍니다.' : 'Ah 기준: 생산량이 일정하면 맞습니다.')
        : '<b>Ah + 시간</b>은 두 몫을 모두 따라가 목표에 머뭅니다(실제로는 오차가 있어 분석값으로 작게 보정).');
      const tau = `정상 수준까지 남은 차이의 63 %를 메우는 데 약 ${Math.round(1 / b)}일, 95 %는 약 ${Math.round(3 / b)}일`;
      msgs.push(st.bleed <= 0 ? '분해산물은 덜어 내지 않으면 계속 쌓여 결국 교체 기준에 닿습니다.'
        : r.ss >= 1 ? `bleed ${st.bleed} %/일 → 분해산물이 ${Math.round(r.ss * 100)} % 근처에서 멈춥니다 — 교체 기준보다 높아 이 bleed로는 부족합니다(교체 · bleed↑). ${tau}.`
        : `bleed ${st.bleed} %/일 → 분해산물이 ${Math.round(r.ss * 100)} % 근처에서 멈춥니다. ${tau} — 처음 한동안 오르는 것은 정상입니다.`);
      msgs.push({cu: 'Cu 가용성 양극: 거의 균형이지만 쉬는 동안의 용해로 Cu가 조금씩 늡니다.', ni: 'Ni 가용성 양극: 음극 효율이 100 %보다 낮아 Ni와 pH가 함께 오릅니다(희석 · bleed, pH는 설파민산).', ins: `불용성 양극: 금속이 쌓인 만큼 줄어 분석 뒤 ${r.metalDose}번 보충했습니다. 대신 산이 늡니다.`, pas: '양극 부동태: 양극이 덜 녹아 금속(Ni는 pH도)이 내려가고 전압이 오릅니다 → 양극 · 염화물 점검.'}[st.an]);
      ctx.q('[data-o=msg]').innerHTML = msgs.join(' ');
      ctx.refresh();
    }
    ctx.seg('dose', v => { st.dose = v; render(); });
    ctx.seg('prod', v => { st.var = v === 'var'; render(); });
    ctx.range('b', v => { st.bleed = v; render(); return v.toFixed(1) + ' %'; });
    ctx.seg('an', v => { st.an = v; render(); });
    // 손대기 전에는 단계마다 예시 값으로 (발표 모드 대비)
    let touched = false;
    ctx.card.querySelectorAll('.pl-w input, .pl-w .pl-seg button').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    const bIn = ctx.card.querySelector('input[data-i=b]');
    ctx.demo = sid => {
      const d = DEMO[sid];
      if (touched || !d || (d.dose === st.dose && d.bleed === st.bleed)) return ctx.refresh();
      st.dose = d.dose; st.bleed = d.bleed;
      ctx.card.querySelectorAll('.pl-seg[data-g="dose"] button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === d.dose ? 'true' : 'false'));
      if (bIn) bIn.value = d.bleed;
      ctx.out('b', d.bleed.toFixed(1) + ' %');
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['도징 (dosing)', '정해진 양을 자동으로 넣는 것. Ah(전기량) 기준 · 시간 기준 · 둘을 합친 방식'],
      ['bleed & feed', '매일 일부를 버리고(bleed) 새 액을 넣는(feed) 운전. 쌓이는 것을 일정 수준에서 멈춘다'],
      ['활성탄 처리', '유기 분해산물을 활성탄에 흡착시켜 걸러 내는 것. 좋은 첨가제도 함께 빠지므로 처리 뒤 다시 맞춘다'],
      ['CVS', '첨가제가 Cu 석출 속도를 얼마나 바꾸는지 재어 첨가제의 "효과"를 농도로 바꿔 읽는 분석'],
      ['액 나이 (Ah/L)', '지금까지 흘린 전기량 ÷ 액 부피. 액 수명 · 교체 기준을 이 값으로 말한다'],
      ['더미 도금', '새 액 · 오래 쉰 뒤 더미 판으로 먼저 도금해 양극 피막 · 첨가제를 안정시키거나(컨디셔닝), 낮은 전류로 불순물 금속을 걷어 내는 것'],
      ['헐셀 (Hull cell)', '비스듬한 판 한 장에 낮은~높은 전류밀도를 한 번에 도금해 액 상태를 눈으로 보는 시험']
    ]) + K.field([
      '분석값 하나에 크게 반응하지 않습니다. CVS · 적정에도 오차(수 %)와 시간 지연이 있어, 튈 때마다 보충량을 크게 바꾸면 오히려 흔들림이 커집니다(<b>과보정</b>). 관리도 규칙으로 판단하고 보충은 작게 나눠 넣습니다 (<a href="#go-edu-3">03 관리도</a> · <a href="#go-edu-5">05 SPC · R2R</a>).',
      '관리도에서는 <b>추세</b>를 봅니다. 꾸준히 한쪽으로 가는 것이 보충 방식 · 양극 · 분석 문제를 먼저 알려 줍니다. 금속 · 산 · 첨가제가 한꺼번에 오르면 보충 과다보다 <b>물 증발</b>을 먼저 의심합니다(액위는 DI수로).',
      '새 액을 만든 뒤(make-up)나 오래 쉰 뒤에는 더미 도금으로 액을 길들입니다(인 함유 Cu 양극의 검은 피막 · 첨가제 안정). PM · 정지 직후 첫 lot 이상은 이 단계를 건너뛴 탓일 수 있습니다.',
      'Cu → Ni → SnAg를 한 장비에서 이어 도금하면 웨이퍼가 앞 액을 묻혀 옵니다(drag-in). Ni 액에 Cu가 쌓이면 낮은 전류밀도 자리가 검게 도금되고 밀착이 나빠집니다 → 낮은 전류로 더미 도금해 걷어 냅니다(더 귀한 Cu가 먼저 석출, <a data-go="cell">01장</a>). 린스 · 누액 · 노즐도 함께 봅니다.',
      'PR 벽에서 유기물이 녹아 나와 액에 쌓이기도 합니다(거품, CVS 흔들림, 막 속 불순물↑). PR 종류 · 베이크 조건이 바뀌면 [앞 공정] 변경이 도금액에 주는 영향부터 확인합니다.',
      '약품 lot이 바뀐 뒤 두께 · 조성이 변했다면 4M1E 중 Material 변경입니다. lot 이력과 분석값을 함께 기록해 두어야 원인을 좁힐 수 있습니다.'
    ]) + K.deep(`<p>bleed & feed의 정상 수준: 하루 생성량 g · Ah, 하루에 덜어 내는 비율 b이면</p>
      ${K.eq('B(다음 날) = B · (1 − b) + g · Ah')}${K.eq('정상 수준 B* = g · Ah / b')}
      <ul><li>정상 수준에 다가가는 시간 상수는 약 1/b일입니다. 1/b일이면 남은 차이의 약 63 %, 3/b일이면 약 95 %를 따라잡습니다(b = 5 %/일이면 20일 · 60일). 새 액을 만든 뒤 한동안 분해산물이 계속 오르는 것은 정상입니다.</li>
      <li>b를 두 배로 하면 정상 수준이 반으로 줄지만, 버리는 약품 · 폐수도 두 배입니다. 정상 수준이 교체 기준보다 충분히 낮은 가장 작은 b를 찾습니다. bleed를 Ah에 묶으면(Ah당 b′ L) 정상 수준 B* = g / b′ 가 생산량과 상관없이 일정해집니다.</li>
      <li>활성탄은 분해 조각만 골라 잡지 못하고 좋은 첨가제도 빨아들입니다. 웨이퍼 도금 라인은 보통 bleed & feed와 정해진 수명(Ah/L)에 따른 교체를 씁니다.</li></ul>
      <p><b>액마다 무엇으로 재나</b> (항목 → 방법)</p>
      <table class="pl-tb"><tr><th>액</th><th>항목 → 방법</th></tr>
      <tr><td>Cu</td><td>Cu²⁺ · 황산 → 적정 · Cl⁻ → 질산은 전위차 적정 · 억제제 · 촉진제 · 평탄제 → CVS</td></tr>
      <tr><td>Ni</td><td>Ni → 적정 · 붕산 → 만니톨을 넣은 적정 · pH → pH 측정기 · 습윤제 → 표면장력</td></tr>
      <tr><td>SnAg</td><td>Sn²⁺ → 요오드 적정 · Sn⁴⁺ = 전체 Sn − Sn²⁺ · Ag와 불순물 금속 → ICP · 유리산 → 적정 · 유기 첨가제 · 착화제 → HPLC 등</td></tr>
      <tr><td>막</td><td>Ag wt% → 웨이퍼에서 XRF (전용 패턴)</td></tr></table>
      <p>SnAg 시료는 공기 중에서 Sn²⁺가 Sn⁴⁺로 산화되므로 받자마자 분석합니다.</p>
      <ul><li><b>가용성 양극의 금속 증가</b> — 양극은 거의 100 % 녹고, 음극은 수소 몫만큼 덜 쌓입니다(Ni 음극 효율은 설파민산 Ni 대략 95~99 %, 일반 Ni 90~97 %). Ni는 pH도 함께 오르므로 설파민산으로 낮춥니다. 양극이 부동태가 되면(예: Ni 액의 염화물 부족) 금속과 pH가 내려가고 전압이 오릅니다. 불용성 양극은 2H₂O → O₂ + 4H⁺ + 4e⁻ 이라 금속이 준 만큼 산이 늡니다.</li>
      <li><b>전류효율 추적</b> — 실측 두께 ÷ 패러데이 예측 두께(또는 µm/Ah)를 추세로 봅니다. 이 값이 변하면 효율 변화(Sn⁴⁺ 증가 · Ni pH 변화), 열린 면적 입력 오류, 계측 이상 중 하나입니다 (<a data-go="faraday.eff">02장</a>).</li>
      <li><b>액 나이와 물 수지</b> — Ah/L로 수명을 말합니다. 증발 · 드래그아웃 · 보충으로 부피가 변하므로 분석 때 액위도 함께 봅니다. 불용성 양극 SnAg는 Sn을 어떤 형태로 보충하느냐에 따라 산(MSA)이 쌓일 수 있습니다.</li>
      <li><b>헐셀</b> — 표준 헐셀(267 mL, 2 A)은 판 한 장에서 약 0.5~12 ASD(헐셀 식으로 계산한 예시)를 한 번에 보여 줍니다. 탐 · 무광 · 검은 부분의 위치로 첨가제 균형과 오염을 분석값보다 먼저 알아챕니다.</li></ul>`);
  },
  css: `.jc.p11-card .steps li.open em{min-height:90px}
.jc .p11-msg{min-height:140px}
.pl-svg .p11-ghost{fill:none;stroke:rgba(148,163,184,.5);stroke-width:2;stroke-dasharray:7 6}
.pl-svg .p11-glt{font-size:18px;font-weight:700;fill:#94a3b8 !important;stroke-width:5px}
.pl-svg .p11-glt.on{font-weight:900;text-decoration:underline}
.pl-svg .p11-glt.p11-cur{fill:#e2e8f0 !important}
.pl-svg .p11-lg{fill:none;stroke-width:3;stroke-dasharray:7 5}
.pl-svg .p11-lg.on{stroke-width:5;stroke-dasharray:none}
.pl-svg .p11-ghost.p11-c0,.pl-svg .p11-lg.p11-c0{stroke:rgba(251,191,36,.75)}.pl-svg .p11-glt.p11-c0{fill:#fcd34d !important}
.pl-svg .p11-ghost.p11-c1,.pl-svg .p11-lg.p11-c1{stroke:rgba(196,181,253,.85)}.pl-svg .p11-glt.p11-c1{fill:#c4b5fd !important}
.pl-svg .p11-ghost.p11-c2,.pl-svg .p11-lg.p11-c2{stroke:rgba(94,234,212,.85)}.pl-svg .p11-glt.p11-c2{fill:#5eead4 !important}
.pl-svg .p11-ghost.p11-c3,.pl-svg .p11-lg.p11-c3{stroke:rgba(252,165,165,.8)}.pl-svg .p11-glt.p11-c3{fill:#fca5a5 !important}
.pl-svg .p11-tick{font-size:16px;fill:#7c8da8 !important}
.pl-svg .p11-qband{fill:rgba(167,139,250,.09)}
.pl-svg .p11-qt{font-size:18px;font-weight:800;fill:#c4b5fd !important}
.pl-svg .p11-tau{fill:none;stroke:#86efac;stroke-width:1.8;stroke-dasharray:3 5}
.pl-svg .p11-taut{font-size:16px;font-weight:700;fill:#86efac !important}
.pl-svg .p11-ssng{font-size:18px;font-weight:800;fill:#fca5a5 !important}
.pl-svg .p11-crt{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .p11-frag{fill:#8a6a4e;stroke:#c4a07c;stroke-width:.8}
.pl-svg .p11-call{font-size:18px;font-weight:800;fill:#fca5a5 !important}`
});
})();
