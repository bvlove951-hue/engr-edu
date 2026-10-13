/* 전해도금 05 — 첨가제: 아주 적은 약품이 어떻게 모양을 바꿀까? (분자 · nm) */
(function(){
const SB = 820, XL = 60, XR = 1060;                     // 표면 기준선, 가로 범위
// 매끈한 표면 높이 (오목한 곳 x 220~380, 볼록한 곳 x 660~860)
function yS(x){
  if (x > 236 && x < 364) return SB + 70;
  if (x >= 220 && x <= 236) return SB + 70 * (x - 220) / 16;
  if (x >= 364 && x <= 380) return SB + 70 * (380 - x) / 16;
  if (x > 690 && x < 830) return SB - 60;
  if (x >= 660 && x <= 690) return SB - 60 * (x - 660) / 30;
  if (x >= 830 && x <= 860) return SB - 60 * (860 - x) / 30;
  return SB;
}
const PROBES = [[140, '평평한 곳'], [300, '오목한 곳'], [520, '평평한 곳'], [760, '볼록한 곳'], [960, '평평한 곳']];
// 자리별로 쌓이는 속도 (상대값). 정전류이므로 평균은 늘 1 — 첨가제는 "어디로 가는지"만 바꾼다
function rates(e){
  const S = e.sup && e.cl;
  const f = (S ? [1, 0.95, 1, 1.15, 1] : e.sup ? [1, 0.85, 1.02, 1.32, 0.98] : [1, 0.72, 1.06, 1.55, 0.94]).slice();
  if (S && e.acc) f[1] *= 1.8;                                  // 촉진제가 모인 오목한 곳은 억제가 풀린다
  if (e.lev){
    f[3] *= S ? (e.lev === 2 ? 0.3 : 0.55) : 0.85;             // 평탄제는 잘 배달되는 볼록한 곳을 누른다
    if (e.lev === 2 && S){ f[0] *= 0.9; f[2] *= 0.9; f[4] *= 0.9; }
  }
  const m = f.reduce((a, b) => a + b, 0) / f.length;
  return f.map(v => v / m);
}
// 결과 (산성 Cu, 범프 전류밀도에서 보통 보이는 경향 — 개념 예시)
// shape: rough · dome1(살짝 볼록) · dome · flatish · flat · dish,  sheen: 0 무광 · 1 반광 · 2 광택,  gn: 결정 씨앗 수(그림)
function result(e){
  const S = e.sup && e.cl;
  if (!S){
    const r = {shape: 'rough', g: '굵음', s: '무광 · 거침', t: '울퉁불퉁 · 높은 전류에서 혹', v: '낮음', w: '튀어나온 곳 · 결정 끝으로 몰린다', h: '큼', sheen: 0, gn: 14};
    if (e.sup) return Object.assign(r, {v: '조금 큼', s: '무광 · 조금 거침', gn: 22, n: 'Cl⁻가 없으면 억제제(담요)가 표면에 잘 붙지 않아 억제가 약합니다. Cl⁻(수십 ppm)는 담요를 표면에 고정하는 집게입니다.'});
    if (e.lev) return Object.assign(r, {v: '조금 큼', n: '평탄제만으로는 바탕(억제)이 약해 효과가 작습니다. 평탄제는 보통 억제제 · Cl⁻ 바탕 위에서 씁니다.'});
    if (e.acc) return Object.assign(r, {n: '촉진제만 넣으면 "없음"과 거의 같습니다 — 걷어 낼 담요(억제제)가 없어 할 일이 적습니다.'});
    return Object.assign(r, {n: '첨가제가 없으면 조금만 밀어도 쉽게 쌓여 새 씨앗(핵)이 적고, 이온이 붙기 쉬운 자리(결정 끝 · 튀어나온 곳)에 계속 붙어 결정이 굵고 거칩니다. 범프처럼 전류밀도가 높으면 혹 · 탄 도금이 되기 쉽습니다.'});
  }
  if (e.lev === 2) return {shape: 'dish', g: e.acc ? '아주 고움' : '고움', s: (e.acc ? '광택' : '반광') + ' · 불순물↑', t: '이 예시에서는 가운데 오목 (접시)', v: '아주 큼', w: '잘 배달되는 가운데가 지나치게 눌린다', h: '작음', sheen: e.acc ? 2 : 1, gn: e.acc ? 110 : 60, n: '평탄제가 너무 많으면 막에 갇히는 불순물이 늘어납니다 (06장). 이 예시 조건에서는 가장 잘 배달되는 가운데(흐름이 센 곳)까지 지나치게 눌러, 덜 배달되는 PR 벽 쪽이 상대적으로 더 자라 가운데가 오목(접시)해졌습니다. 늘 그런 것은 아닙니다 (08장).'};
  if (e.acc && e.lev) return {shape: 'flat', g: '아주 고움', s: '광택', t: '평평', v: '큼', w: '고르게 — 볼록한 곳은 눌리고 오목한 곳은 풀린다', h: '작음', sheen: 2, gn: 110, n: '보통 쓰는 조합입니다. 억제제가 바탕을 깔고, 촉진제가 자리별로 억제를 풀고, 평탄제가 튀어나온 곳을 눌러 윗면이 평평하고 범프끼리 높이 차도 줄어듭니다.'};
  if (e.acc) return {shape: 'dome', g: '아주 고움', s: '광택', t: '볼록(돔)해지기 쉽다', v: '큼', w: '전류 · 흐름이 센 가운데 위쪽으로', h: '보통', sheen: 2, gn: 110, n: '결정이 아주 곱고 광택이 나지만, 윗면을 잡아 줄 평탄제가 없어 높은 전류에서는 가운데가 볼록(돔)해지기 쉽습니다.'};
  if (e.lev) return {shape: 'flatish', g: '고움', s: '반광 · 매끈', t: '평평에 가깝다', v: '큼', w: '볼록한 곳이 눌려 고르게', h: '작음', sheen: 1, gn: 60, n: '평탄제가 튀어나온 곳을 눌러 윗면이 평평해집니다. 촉진제가 없어 광택은 덜합니다.'};
  return {shape: 'dome1', g: '고움', s: '반광 · 매끈', t: '전류 · 흐름을 따라간다 (높은 전류에서 볼록)', v: '큼', w: '고르게 퍼진다 (곡선이 눕는다)', h: '보통', sheen: 1, gn: 60, n: '억제제 + Cl⁻가 표면을 덮어 같은 전류에 더 큰 과전압이 걸리고(04장), 결정이 곱고 매끈해집니다. 윗면은 전류 · 흐름이 센 곳을 따라가 높은 전류에서는 볼록해지기 쉽습니다.'};
}

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '05', id: 'additive', part: 2, short: '첨가제', scale: '분자 · nm',
  title: '첨가제 — 아주 적은 약품이 어떻게 모양을 바꿀까?',
  hook: '아주 적은 분자가 모양을 정한다',
  one: '도금액에 아주 적은 양(ppm, 100만 분의 1 수준)을 넣는 분자들이 표면에 붙었다 떨어지며, 어디를 빨리 키우고 어디를 늦출지 정합니다. 평균 두께는 전류 × 시간이 정하고, 첨가제는 전압과 "전류가 어디로 가는지"를 바꿔 결정 크기 · 매끈함 · 윗면 모양을 정합니다.',
  ana: '<b>담요 · 집게 · 손 · 브레이크</b> — 억제제는 표면을 덮는 얇은 <b>담요</b>, Cl⁻는 담요를 표면에 고정하는 <b>집게</b>(없으면 담요가 잘 붙지 않음)입니다. 촉진제는 담요를 비집고 들어가 걷어 내는 <b>손</b>, 평탄제는 흐름이 잘 닿는 튀어나온 곳에 더 많이 붙는 <b>브레이크</b>입니다. <i>한계</i>: 담요는 분자 한 겹이고, 전류를 막지 않고 늦출 뿐이며, 계속 붙었다 떨어집니다. 효과는 농도와 조합에 따라 달라집니다.',
  steps: [
    {id: 'none', t: '첨가제가 없으면', d: '조금만 밀어도 쉽게 쌓여 새 씨앗(핵)이 적게 생깁니다. 이온은 붙기 쉬운 자리(자라는 결정 끝 · 튀어나온 곳)에 계속 붙어 결정이 굵고 표면이 무광으로 거칩니다. 범프처럼 전류밀도가 높으면 혹 · 탄 도금이 되기 쉽습니다(혹은 액 속 입자가 씨앗인 경우도 많습니다 → 12장).'},
    {id: 'sup', t: '억제제 + Cl⁻ — 담요와 집게', d: '긴 사슬 분자가 Cl⁻를 집게 삼아 표면을 덮습니다. 같은 전류를 흘리려면 더 세게 밀어야 해서(과전압↑) 결정이 곱고, 곡선이 누워 전류가 고르게 퍼집니다. 정류기는 전류를 일정하게 주므로 평균 두께 · 속도는 그대로입니다.'},
    {id: 'acc', t: '촉진제 — 담요를 걷는 손', d: '작은 분자가 담요를 비집고 들어가 그 자리의 억제를 풀어 줍니다. 억제제가 없으면 혼자서는 할 일이 적습니다. 범프에서 촉진제가 바꾸는 "속도"는 전체 속도가 아니라 자리별 속도 차이이고, 결정이 더 곱고 광택이 납니다.'},
    {id: 'lev', t: '평탄제 — 튀어나온 곳의 브레이크', d: '평탄제는 아주 묽어서 분자 자신이 확산으로 겨우 도착합니다. 그래서 잘 배달되는 곳(튀어나온 곳 · 모서리 · 흐름 센 곳)에 더 붙어 그곳을 늦춥니다 → 윗면이 평평. 흐름이 바뀌면 모양도 바뀝니다. 너무 많으면 막 속 불순물이 늘고, 액 · 조건에 따라 가운데가 오목(접시)해지기도 합니다(일반 법칙은 아닙니다 → <a data-go="pattern.shape">08장</a>).'},
    {id: 'wear', t: '소모와 분해 — 쓰면 줄고 바뀐다', d: '첨가제는 주로 전기(Ah)를 쓸수록 줄지만, 쉬는 동안에도 분해되고 웨이퍼에 묻어 나가며 막 속에 갇히기도 합니다. 분해 조각이 쌓이면 효과가 흐려집니다 → Ah 몫 + 시간 몫으로 보충하고 분석(CVS)으로 보정 (11장).'}
  ],
  icon(K){
    const {P, C} = K;
    return P('M2,50 L64,50 L64,62 L2,62 Z', 'f-cu2') + P('M4,44 q6,-8 12,0 t12,0 t12,0 t12,0 t12,0', 'f-sup') + C(20, 30, 4, 'f-acc') + C(44, 26, 4, 'f-lev') + C(34, 14, 4, 'f-acc');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT, rng, wrap} = K;
    let s = '';
    s += R(40, 130, 1040, 990, 'pl-panel', {rx: 16}) + R(56, 146, 1008, SB - 120, 'f-bath');
    s += `<g data-v="surf"></g><g data-v="rate"></g>`;
    s += G(LB(T(1046, 178, '화살표 = 자리별로 쌓이는 속도 (평균은 전류 × 시간이 정해 늘 같다)', 't-dim', 'end')), on('none'));
    // 억제제(PEG 계열 사슬) — 표면을 따라. Cl⁻(집게)는 따로 묶어 켜고 끈다
    let sup = '', cl = '';
    for (let x = XL + 8; x < XR - 60; x += 92){
      if (x > 200 && x < 390) continue;
      const y = yS(x + 36) - 14;
      sup += P(`M${x},${y} q9,-12 18,0 t18,0 t18,0 t18,0`, 'f-sup');
      cl += C(x + 18, y + 9, 5, 'f-cl') + C(x + 54, y + 9, 5, 'f-cl');
    }
    sup += P(`M250,${SB + 56} q9,-12 18,0 t18,0`, 'f-sup') + P(`M318,${SB + 56} q9,-12 18,0 t18,0`, 'f-sup');
    cl += C(259, SB + 65, 5, 'f-cl') + C(327, SB + 65, 5, 'f-cl');
    let supF = '';
    for (let k = 0; k < 5; k++){ const x = 120 + k * 200, y = 300 + (k % 2) * 120; supF += G(P(`M0,0 q9,-12 18,0 t18,0 t18,0 t18,0`, 'f-sup'), {transform: `translate(${x} ${y}) rotate(${k * 23 - 30})`}); }
    s += G(G(sup, {class: 'p05-sup'}) + supF, W(on('sup'), {class: 'm-sup'}, tip('억제제(긴 사슬 분자) — 표면을 덮는 담요. 전체를 늦춘다')));
    s += G(cl, W(on('sup'), {class: 'm-cl'}, tip('Cl⁻(연두) — 담요를 표면에 고정하는 집게')));
    // 촉진제 — 오목한 곳에 많이
    let acc = '';
    for (const x of [252, 276, 300, 324, 348]) acc += C(x, SB + 58, 7, 'f-acc');
    for (const x of [130, 470, 580, 930, 1010]) acc += C(x, yS(x) - 10, 7, 'f-acc');
    for (let k = 0; k < 6; k++) acc += C(180 + k * 150, 260 + (k % 3) * 90, 7, 'f-acc');
    s += G(acc, W(on('acc'), {class: 'm-acc'}, tip('촉진제(작은 분자) — 담요를 비집고 들어가 그 자리의 억제를 푼다')));
    // 평탄제 — 볼록한 곳에 많이 (과다면 평평한 곳에도. 오목한 곳은 배달이 약해 적게 붙는다)
    const levM = (x, y) => G(C(0, 0, 8, 'f-lev') + T(0, 5, '+', 'pl-levt'), {transform: `translate(${x} ${y})`});
    let lev = '', lev2 = '';
    for (let x = 676; x <= 846; x += 17) lev += levM(x, yS(x) - 12);
    for (const x of [150, 520, 980]) lev += levM(x, yS(x) - 34);
    for (const x of [100, 190, 430, 490, 560, 620, 900, 1000]) lev2 += levM(x, yS(x) - 12);
    s += G(lev, W(on('lev'), {class: 'm-lev'}, tip('평탄제(+ 전하) — 잘 배달되는 볼록한 곳에 많이 붙어 그곳을 늦춘다')));
    s += G(lev2, W(on('lev'), {class: 'm-lev2'}, tip('평탄제 과다 — 다른 곳까지 덮고 막에 더 많이 갇힌다')));
    // 분해 조각 (아래쪽 액 속)
    const rr = rng(4);
    let fr = '';
    for (let k = 0; k < 16; k++){ const x = 100 + rr() * 900, y = 500 + rr() * 140; fr += G(P('M0,0 l10,-6 l8,6', 'pl-frag') + C(16, 2, 4, 'f-frag'), {transform: `translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${Math.round(rr() * 180)})`}); }
    s += G(fr, W(only('wear'), tip('분해 조각 — 쓰면서 바뀌고 쪼개진 첨가제. 쌓이면 효과가 흐려진다')));
    // 이름표 (화살표 위쪽 빈 곳에)
    s += G(LB(T(80, 214, '첨가제 없음 — 붙기 쉬운 자리(결정 끝 · 튀어나온 곳)에 계속 붙는다', 't-warn', 'start')), only('none'));
    s += G(K.lead(440, SB - 14, 420, 500, '억제제 + Cl⁻ — 담요와 집게 (표면 전체를 덮는다)', 'start', 't-sub'), only('sup'));
    s += G(K.lead(330, SB + 52, 420, 500, '촉진제가 모인 오목한 곳은 억제가 풀려 빨리', 'start', 't-sub'), only('acc'));
    let lv = K.lead(780, SB - 74, 900, 500, '평탄제 — 흐름 · 확산이 잘 닿는 볼록한 곳에 더 붙는다', 'end', 't-sub');
    lv += K.arrow(626, 690, 684, 744, 's-arr') + K.arrow(894, 690, 836, 744, 's-arr');
    s += G(lv, only('lev'));
    // 소모 · 분해 상자 (wear)
    let wr = R(70, 196, 980, 290, 'p05-box', {rx: 12}) + T(92, 232, '줄어드는 길 — Ah 몫이 가장 크지만 그것만이 아니다', 't-warn', 'start');
    [['① 전기(Ah) — 음극(캐소드) · 양극(애노드) 반응', 92, 270], ['② 시간 — 쉬는 동안 산소 · Cu⁺와 반응', 580, 270], ['③ 묻어 나감 (드래그아웃)', 92, 304], ['④ 막 속에 갇힘 (불순물 → 06장)', 580, 304]].forEach(([t, x, y]) => { wr += T(x, y, t, 't-sub', 'start'); });
    // SPS → MPS → PDS
    const chip = (x, w, t1, t2, c) => R(x, 336, w, 74, c, {rx: 10}) + T(x + w / 2, 366, t1, 't-lbl') + T(x + w / 2, 396, t2, 't-dim');
    wr += chip(92, 200, 'SPS', '넣는 꼴', 'p05-chip') + chip(400, 250, 'MPS', '일하는 꼴 (Cu⁺와 묶임)', 'p05-chip') + chip(758, 270, 'PDS', '효과 없음 · 쌓인다', 'p05-chip2');
    wr += K.arrow(296, 373, 394, 373, 's-arr2') + T(345, 360, '음극', 't-dim') + K.arrow(654, 373, 752, 373, 's-arr2') + T(703, 360, '산화', 't-dim');
    wr += T(92, 448, '→ 보충 = Ah 몫 + 시간 몫, CVS로 보정 · 분해 조각은 덜어 내기 · 활성탄 · 교체 (11장)', 't-sub', 'start');
    s += G(wr, only('wear'));
    // 오른쪽: 결과
    s += R(1110, 130, 450, 990, 'pl-panel', {rx: 16}) + T(1134, 172, '결과 — 범프 단면 (개념)', 't-acc', 'start');
    s += `<clipPath id="p05-bclip"><path data-v="bclip" d="M0,0"/></clipPath><g data-v="res"></g>`;
    s += TT(1134, 1062, wrap('개념 예시 — 실제 모양은 액 · 전류밀도 · 흐름에 따라 다르다', 19), 't-dim', 'start', 26);
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 첨가제 넣고 빼기</div>
      <div class="pl-seg" data-g="adds" role="group" aria-label="첨가제 켜고 끄기"><span class="lb">넣기</span><button data-k="sup" aria-pressed="true">억제제</button><button data-k="cl" aria-pressed="true">Cl⁻</button><button data-k="acc" aria-pressed="true">촉진제</button></div>
      ${K.seg('lev', [['0', '없음'], ['1', '적정'], ['2', '과다']], '1', '평탄제')}
      <div class="p05-kp">${K.kpis([['결정', 'k-g', ''], ['표면', 'k-s', ''], ['윗면', 'k-t', ''], ['과전압', 'k-v', '같은 전류에서']])}</div>
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('산성 Cu · 범프 전류밀도에서 보통 보이는 경향의 예시입니다. 어느 경우나 평균 두께 · 속도는 같습니다(정전류). 1~3단계에서는 버튼이 그 단계 그림(그때까지 나온 첨가제)을 그대로 보여 줍니다. 누르면 평탄제 단계로 넘어가 네 가지를 직접 켜고 끌 수 있습니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, TT, rng, tip, wrap, voronoi, PG} = K;
    const tog = {sup: true, cl: true, acc: true, lev: 1};
    const box = ctx.card.querySelector('[data-g="adds"]'), levBox = ctx.card.querySelector('.pl-seg[data-g="lev"]');
    // 스크롤 단계에서는 그 단계까지 소개된 첨가제만, 앞 단계(없음 · 억제제 · 촉진제)는 버튼과 상관없이 늘 같은 그림.
    //  버튼(tog)은 평탄제 단계부터 듣는다
    const early = () => { const sid = ctx.step(); return !!sid && ctx.ch._idx[sid] < 3; };
    function eff(){ const sid = ctx.step() || 'wear', k = ctx.ch._idx[sid]; return {sup: k >= 1 && (k < 3 || tog.sup), cl: k >= 1 && (k < 3 || tog.cl), acc: k >= 2 && (k < 3 || tog.acc), lev: k >= 3 ? tog.lev : 0}; }
    // 버튼은 늘 지금 그림의 조합을 보여 준다 (1~3단계는 그 단계까지 나온 첨가제, 평탄제 단계부터는 고른 값)
    function sync(e){
      box.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', e[b.dataset.k] ? 'true' : 'false'));
      if (levBox) levBox.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.v === e.lev ? 'true' : 'false'));
    }
    function render(){
      const e = eff(), rs = result(e), g = rng(9), S = e.sup && e.cl;
      sync(e);
      // 표면 (억제가 약하면 거칠다)
      const amp = S ? 0 : e.sup ? 0.5 : 1;
      let d = `M${XL},${SB}`;
      for (let x = XL; x <= XR; x += 8){ const y = yS(x) - amp * (g() * 22 + (x % 48 < 24 ? 8 : 0)); d += ` L${x},${y.toFixed(1)}`; }
      d += ` L${XR},1100 L${XL},1100 Z`;
      ctx.$('[data-v="surf"]').innerHTML = P(d, 'f-cu2', tip(S ? '매끈한 표면' : '억제가 없거나 약해 거친 표면'));
      // 자리별로 쌓이는 속도 화살표
      const rt = rates(e);
      let a = '';
      PROBES.forEach(([x, nm], k) => {
        const len = 40 + rt[k] * 70, y1 = yS(x) - 16;
        a += P(`M${x},${(y1 - len).toFixed(0)} L${x},${y1.toFixed(0)}`, 'pl-rate', {'marker-end': 'url(#pl-arr-a)', style: `stroke-width:${(3 + rt[k] * 5).toFixed(1)}px`});
        a += TT(x, y1 - len - 38, [nm, '×' + rt[k].toFixed(1)], 't-dim', 'middle', 22);
      });
      ctx.$('[data-v="rate"]').innerHTML = G(a, {'data-tip': '화살표 = 그 자리에서 쌓이는 속도 (굵고 길수록 빠르다). 평균은 늘 1 — 전류 × 시간이 정한다'});
      // 결과 그림 — 범프 단면
      const bx = 1170, bw = 330, by = 520, cx = bx + bw / 2;
      let top;
      if (rs.shape === 'rough'){ top = `M${bx},330`; for (let x = 0; x <= bw; x += 22) top += ` L${bx + x},${(318 + Math.sin(x * 0.7) * 14 + g() * 18).toFixed(0)}`; }
      else {
        const [ye, ym] = {dome1: [334, 300], dome: [346, 262], flatish: [322, 314], flat: [318, 318], dish: [300, 348]}[rs.shape];
        top = `M${bx},${ye} Q${cx},${2 * ym - ye} ${bx + bw},${ye}`;
      }
      const body = `${top} L${bx + bw},${by} L${bx},${by} Z`;
      ctx.$('[data-v="bclip"]').setAttribute('d', body);
      let r = R(bx - 30, by, bw + 60, 16, 'f-seed2') + R(bx - 30, by + 16, bw + 60, 40, 'f-si');
      // 결정 (씨앗 수가 많을수록 곱다)
      const gr = rng(rs.gn * 7 + 3), pts = [];
      for (let k = 0; k < rs.gn; k++) pts.push([bx + gr() * bw, 250 + gr() * (by - 250)]);
      const cells = voronoi(pts, bx, 240, bx + bw, by).map((p, k) => PG(p, 'f-grain', {style: `fill:hsl(${22 + (k % 5) * 3},${48 + Math.round(gr() * 14)}%,${40 + Math.round(gr() * 22)}%);stroke-width:${rs.gn > 80 ? 0.6 : 1.2}px`})).join('');
      r += G(P(body, 'f-cu2') + cells + (rs.sheen ? R(bx, 240, bw, 70, rs.sheen === 2 ? 'p05-sheen' : 'p05-semi') : ''), {'clip-path': 'url(#p05-bclip)', 'data-tip': 'PR 구멍 안에서 자란 범프 (단면). 칸 = 결정'});
      if (rs.shape === 'rough') for (const [nx, ny, nr] of [[bx + 70, 316, 14], [bx + 230, 312, 11]]) r += C(nx, ny, nr, 'f-cu2', tip('혹(노듈) — 높은 전류 · 입자'));
      r += P(top, 'p05-top') + R(bx - 30, 220, 30, by - 220, 'f-pr') + R(bx + bw, 220, 30, by - 220, 'f-pr');
      // 결과 줄
      const rows = [['결정', rs.g], ['표면', rs.s], ['윗면', rs.t], ['과전압', rs.v], ['전류가 가는 곳', rs.w], ['범프끼리 높이 차', rs.h]];
      let yy = 616;
      rows.forEach(([k, v]) => { const ls = wrap(`${k}: ${v}`, 19); r += TT(1134, yy, ls, 't-sub', 'start', 28); yy += ls.length * 28 + 8; });
      r += TT(1134, yy + 14, wrap('평균 두께 · 속도: 같음 — 전류 × 시간이 정한다', 19), 't-acc', 'start', 28);
      ctx.$('[data-v="res"]').innerHTML = r;
      ctx.out('k-g', rs.g); ctx.out('k-s', rs.s.split(' · ')[0]); ctx.out('k-t', {rough: '울퉁불퉁', dome1: '살짝 볼록', dome: '볼록 (돔)', flatish: '거의 평평', flat: '평평', dish: '오목 (접시)'}[rs.shape]); ctx.out('k-v', rs.v);
      ctx.q('[data-o=msg]').innerHTML = rs.n;
      // 이 단계에서 빠진 분자는 장면에서 감추고, Cl⁻가 없으면 담요가 들뜬다 (버튼이 아니라 eff 기준)
      ctx.$$('.m-sup').forEach(el => el.classList.toggle('hide', !e.sup));
      ctx.$$('.m-cl').forEach(el => el.classList.toggle('hide', !e.cl));
      ctx.$$('.m-acc').forEach(el => el.classList.toggle('hide', !e.acc));
      ctx.$$('.m-lev').forEach(el => el.classList.toggle('hide', !e.lev));
      ctx.$$('.m-lev2').forEach(el => el.classList.toggle('hide', e.lev !== 2));
      ctx.$$('.p05-sup').forEach(el => el.classList.toggle('p05-loose', e.sup && !e.cl));
      ctx.refresh();
    }
    // 1~3단계에서 누르면: 버튼이 보여 주던 조합(그 단계 그림)에서 출발해 하나를 바꾸고, 모든 첨가제가 보이는 평탄제 단계로 간다
    const adopt = () => { if (early()) Object.assign(tog, eff()); };
    const toLev = () => { if (early()) ctx.go('lev'); };
    box.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      adopt();
      tog[b.dataset.k] = !tog[b.dataset.k];
      toLev(); render();
    });
    ctx.seg('lev', (v, user) => { if (user) adopt(); tog.lev = +v; if (user) toLev(); render(); });
    // 발표 모드에서는 위젯을 만질 수 없으므로 기본 조합(모두 넣고 평탄제 적정)으로 되돌려 자막과 맞춘다 (버튼 표시는 render가 맞춘다)
    ctx.reset = () => { Object.assign(tog, {sup: true, cl: true, acc: true, lev: 1}); };
    ctx.render = render;
    render();
  },
  onStep(K, ctx){
    const ep = window.EngrPlating;
    if (ctx.reset && ep && ep.state.pres != null) ctx.reset();
    if (ctx.render) ctx.render();
  },
  notes(K){
    return K.terms([
      ['ppm', '100만 분의 1. 묽은 수용액에서 1 ppm ≈ 1 mg/L'],
      ['억제제 (suppressor)', '표면을 덮어 석출을 늦추는 큰 분자(PEG 계열). Cl⁻가 있어야 잘 붙는다'],
      ['Cl⁻ (염화 이온)', '억제제를 표면에 고정하는 집게. 보통 수십 ppm'],
      ['촉진제 (accelerator)', '담요를 비집고 들어가 그 자리의 억제를 푸는 작은 분자(SPS 계열). 광택제(brightener)라고도'],
      ['평탄제 (leveler)', '아주 묽게 넣어, 잘 배달되는 곳(튀어나온 곳 · 흐름 센 곳)에 더 붙어 그곳을 늦추는 분자'],
      ['분해 산물', '쓰면서 바뀌고 쪼개진 첨가제 조각(예: PDS). 쌓이면 효과를 흐리고 막에 갇힌다'],
      ['CVS', '첨가제의 "양"이 아니라 "효과"(도금을 얼마나 늦추고 빠르게 하나)를 재서 농도로 바꾸는 분석법']
    ]) + K.field([
      '첨가제는 <b>평균 두께를 바꾸지 않습니다</b>. 같은 전류 · 시간이면 평균 두께는 같고, 바뀌는 것은 전압과 전류가 가는 곳입니다. 같은 전류에서 전압 기록이 오르내리면 첨가제 상태를 의심해 볼 단서입니다.',
      '보충은 보통 <b>Ah 몫 + 시간 몫</b>으로 잡고 분석(CVS)으로 보정합니다. 오래 쉬었다 다시 돌릴 때는 분석하고 더미 도금으로 상태를 맞춘 뒤 제품을 넣습니다 (<a data-go="bath.add">11장</a>).',
      '첨가제 보충량을 바꾸면 <b>범프 윗면 모양과 표면 거칠기부터</b> 바뀝니다. 바꾼 날짜와 양을 변경 기록으로 남겨 두면 나중에 원인을 찾기 쉽습니다.',
      '윗면 모양(돔 · 평평 · 접시)이나 기울어짐이 바뀌었다면 첨가제 농도 · 분해산물 · 전류밀도 · <b>흐름</b>(펌프 유량 · 패들 · 회전)을 함께 봅니다. 평탄제는 흐름에 따라 붙는 양이 달라, 액이 그대로여도 흐름이 바뀌면 모양이 바뀌고, 흐름이 한쪽으로 치우치면 윗면이 기웁니다.',
      '모양만 보고 평탄제를 늘리면 막 속 불순물(S · Cl · C · N)이 늘어 신뢰성에서 대가를 치를 수 있습니다 (06장).',
      '범프용 Cu 액도 억제 · 촉진 · 평탄 3종 계열이지만, 목적은 바닥부터 채우기가 아니라 "빠르게(높은 전류밀도) · 평평하게 · 고르게 · 불순물 적게"입니다. Ni · SnAg 액은 다른 종류(습윤제, 응력 조절제, 착화제, 결정 미세화제)를 씁니다 (<a data-go="chem">10장</a>).'
    ]) + K.deep(`<ul>
      <li><b>억제제</b>: 폴리에틸렌글리콜(PEG) · 폴리프로필렌글리콜 계열 고분자가 Cl⁻ · Cu⁺와 함께 표면에 막을 만들어 석출을 늦춥니다. Cl⁻가 다리 역할을 해서, 없으면 잘 붙지 않습니다. 곡선을 옮기면서 눕혀(04장) 전류를 고르게 폅니다.</li>
      <li><b>촉진제</b>: SPS(bis(3-sulfopropyl) disulfide)는 음극(캐소드, −)에서 MPS(3-mercapto-1-propanesulfonate)로 바뀌며 Cu⁺와 묶여 촉진합니다 — 이것은 고장이 아니라 일하는 과정입니다. 양극(애노드, +) 반응이나 녹아 있는 산소로 더 산화되면 PDS(프로판다이설폰산) 같은 효과 없는 조각이 되어 쌓입니다. MPS가 너무 많이 쌓이면 촉진이 지나쳐 모양이 나빠질 수 있습니다.</li>
      <li><b>평탄제</b>: 질소를 가진 양이온성 분자. 아주 묽어 공급(확산)에 좌우되므로, 확산 거리가 짧은 튀어나온 곳 · 흐름이 센 곳에 더 많이 도착합니다. 그래서 교반을 올리면 평탄제가 더 붙어 곡선이 오히려 더 밀리는(억제↑) 경우도 있습니다. 과다하면 막 속 불순물이 늘고 고온 보관 뒤 솔더 계면 보이드가 늘었다는 보고가 있으며, 일부 액 · 조건에서는 접시 모양이 됩니다(08장).</li>
      <li><b>소모 경로</b>: ① 음극 · 양극 반응(Ah에 비례) ② 쉬는 동안 산소 · Cu⁺와의 반응(시간에 비례, 특히 촉진제) ③ 드래그아웃 ④ 막 속 혼입. 그래서 보충은 Ah 몫 + 시간 몫입니다.</li>
      <li><b>다마신 바닥 채우기</b>(참고): 좁은 구멍이 아래부터 차오르며 바닥 면적이 줄면, 바닥에 모인 촉진제의 표면 농도가 올라가 바닥이 더 빨리 자랍니다(곡률 효과). 범프는 이 "바닥부터 채우기"가 목적이 아닙니다.</li>
      <li><b>CVS (cyclic voltammetric stripping)</b>: 회전하는 작은 백금 전극에서 전위를 오르내리며, 구리를 살짝 도금했다 벗겨 내기를 반복합니다. 벗겨질 때 나온 전기량(스트리핑 면적)이 크면 그사이 도금이 빨랐다는 뜻입니다 — 억제제가 많으면 작아지고, 촉진제가 많으면 커집니다. 표준 용액을 조금씩 더해 보는 방법(희석 적정 · 표준 첨가)으로 농도로 바꿉니다. 재는 것은 "효과"라서, 바뀐 꼴(MPS)이나 분해 조각(PDS 등), PR에서 녹아 나온 유기물도 값에 섞일 수 있습니다.</li>
      <li><b>회전 원판 전극 · 헐셀</b>: 회전 원판 전극은 회전 속도로 확산층 두께를 정확히 정하는 실험 전극입니다(δ ∝ 회전 속도<sup>−½</sup>, CVS도 이 원리). 헐셀은 비스듬한 판 하나에 낮은~높은 전류밀도를 한 번에 걸어, 탄 자리 · 무광 자리로 액 상태를 눈으로 빠르게 보는 시험입니다(웨이퍼 라인에서는 보조 도구).</li></ul>`);
  },
  css: `.p05-box{fill:#060b15;stroke:rgba(148,163,184,.3);stroke-width:1.2}
.p05-chip{fill:rgba(251,191,36,.14);stroke:#fbbf24;stroke-width:1.4}
.p05-chip2{fill:rgba(100,116,139,.25);stroke:#94a3b8;stroke-width:1.4;stroke-dasharray:5 4}
.p05-sheen{fill:rgba(255,255,255,.30)}
.p05-semi{fill:rgba(255,255,255,.13)}
.p05-top{fill:none;stroke:#fde2c4;stroke-width:2.4}
.pl-svg .p05-loose{transform:translateY(-30px);opacity:.5;transition:transform .5s,opacity .5s}
.pl-svg .p05-sup{transition:transform .5s,opacity .5s}
.jc .p05-kp .kpi .v{font-size:16px;white-space:nowrap}
.pl-svg .pl-levt{font-size:17px}`
});
})();
