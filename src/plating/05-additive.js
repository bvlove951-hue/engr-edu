/* 전해도금 05 — 첨가제: 보이지 않는 조절자 (분자 · nm) */
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
function rates(e){
  return PROBES.map(([x]) => {
    if (!e.sup) return [1.7, 1.2, 1.9, 1.5, 1.3][PROBES.findIndex(p => p[0] === x)];
    let r = 0.6;
    if (e.acc) r *= x === 300 ? 2.3 : 1.35;
    if (e.lev && x === 760) r *= 0.35;
    return r;
  });
}
function result(e){
  if (!e.sup) return {shape: 'rough', g: '굵음', s: '거침 · 노듈 · 무광', t: '울퉁불퉁', v: '빠르지만 고르지 않다', n: (e.acc || e.lev) ? '억제제(바탕)가 없으면 촉진제 · 평탄제도 제 역할을 못 합니다.' : '아무 데나 빨리 붙어 결정이 굵고 거칩니다.'};
  if (e.acc && e.lev) return {shape: 'flat', g: '고움', s: '매끈 · 광택', t: '평평', v: '빠르다', n: '보통 쓰는 조합 — 억제제가 바탕을 깔고, 촉진제가 속도를, 평탄제가 모양을 잡습니다.'};
  if (e.lev) return {shape: 'flat', g: '고움', s: '매끈', t: '평평해진다', v: '느리다', n: '평탄제가 볼록한 곳을 눌러 평평해집니다. 촉진제가 없으면 느립니다.'};
  if (e.acc) return {shape: 'dome', g: '고움', s: '매끈', t: '굴곡이 그대로 (볼록한 곳은 더 볼록해질 수 있다)', v: '빠르다', n: '빨라지지만 모양을 잡아 줄 평탄제가 없습니다.'};
  return {shape: 'dome', g: '고움', s: '매끈', t: '굴곡이 그대로', v: '느리다', n: '억제제가 표면을 고르게 늦춰 결정이 곱고 매끈해집니다.'};
}

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '05', id: 'additive', part: 2, short: '첨가제', scale: '분자 · nm',
  title: '첨가제 — 보이지 않는 조절자',
  hook: 'ppm 분자가 모양을 정한다',
  one: '도금액에 아주 조금(ppm 수준) 넣는 분자들이 표면을 덮고, 비키고, 골라 붙으며 어디가 빨리 자랄지 정합니다. 그래서 결정의 크기, 표면의 매끈함, 윗면의 모양이 첨가제로 결정됩니다.',
  ana: '<b>교통 정리</b> — 억제제는 모든 차선에 깔린 <b>과속 방지턱</b>(전체를 천천히 · 고르게), 촉진제는 방지턱을 걷어 내는 <b>급행 차선</b>(여기는 빨리), 평탄제는 붐비는 곳에만 서는 <b>교통 경찰</b>(튀어나온 곳을 늦춤)입니다.',
  steps: [
    {id: 'none', t: '첨가제가 없으면', d: '이온이 아무 데나 빨리 붙어 결정이 굵고 표면이 거칩니다(노듈 · 무광). 튀어나온 곳이 이온을 먼저 잡아 더 튀어나옵니다.'},
    {id: 'sup', t: '억제제 + Cl⁻ — 담요', d: '긴 사슬 분자가 Cl⁻와 함께 표면을 덮어 전체를 늦춥니다. 과전압이 커지고(04장 곡선이 오른쪽으로) 전류가 고르게 퍼지며 결정이 곱습니다. Cl⁻가 있어야 제대로 붙습니다.'},
    {id: 'acc', t: '촉진제 — 담요 걷기', d: '작은 분자가 억제제를 밀어내고 그 자리를 빨리 자라게 합니다. 구멍을 메우는 다마신에서는 바닥부터 채우는(bottom-up) 핵심이고, 범프에서는 속도 · 결정 · 모양을 조절합니다.'},
    {id: 'lev', t: '평탄제 — 튀어나온 곳 누르기', d: '이온이 잘 오는 곳(튀어나온 곳 · 가장자리)에 더 많이 붙어 그곳을 늦춥니다. 그래서 윗면이 평평해집니다. 지나치면 다른 곳까지 늦추거나 막에 더 많이 갇힐 수 있습니다.'},
    {id: 'wear', t: '소모와 분해 — 쓰면 쪼개진다', d: '첨가제는 전기를 쓸수록(Ah) 쪼개집니다. 분해 조각이 쌓이면 효과가 흐려지고 막에 갇히기도 합니다 → 분석(CVS) · 보충 · 덜어 내기 · 교체 (11장).'}
  ],
  icon(K){
    const {P, C} = K;
    return P('M2,50 L64,50 L64,62 L2,62 Z', 'f-cu2') + P('M4,44 q6,-8 12,0 t12,0 t12,0 t12,0 t12,0', 'f-sup') + C(20, 30, 4, 'f-acc') + C(44, 26, 4, 'f-lev') + C(34, 14, 4, 'f-acc');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT, rng} = K;
    let s = '';
    s += R(40, 130, 1040, 990, 'pl-panel', {rx: 16}) + R(56, 146, 1008, SB - 120, 'f-bath');
    s += `<g data-v="surf"></g><g data-v="rate"></g>`;
    // 억제제(PEG 계열 사슬) + Cl⁻ — 표면을 따라
    let sup = '';
    for (let x = XL + 8; x < XR - 60; x += 92){
      if (x > 200 && x < 390) continue;
      const y = yS(x + 36) - 14;
      sup += P(`M${x},${y} q9,-12 18,0 t18,0 t18,0 t18,0`, 'f-sup') + C(x + 18, y + 9, 5, 'f-cl') + C(x + 54, y + 9, 5, 'f-cl');
    }
    sup += P(`M250,${SB + 56} q9,-12 18,0 t18,0`, 'f-sup') + P(`M318,${SB + 56} q9,-12 18,0 t18,0`, 'f-sup');
    for (let k = 0; k < 5; k++){ const x = 120 + k * 200, y = 300 + (k % 2) * 120; sup += G(P(`M0,0 q9,-12 18,0 t18,0 t18,0 t18,0`, 'f-sup'), {transform: `translate(${x} ${y}) rotate(${k * 23 - 30})`}); }
    s += G(sup, W(on('sup'), {class: 'm-sup'}, tip('억제제(긴 사슬 분자) + Cl⁻(연두) — 표면을 덮어 전체를 늦춘다')));
    // 촉진제 — 오목한 곳에 많이
    let acc = '';
    for (const x of [252, 276, 300, 324, 348]) acc += C(x, SB + 58, 7, 'f-acc');
    for (const x of [130, 470, 580, 930, 1010]) acc += C(x, yS(x) - 10, 7, 'f-acc');
    for (let k = 0; k < 6; k++) acc += C(180 + k * 150, 260 + (k % 3) * 90, 7, 'f-acc');
    s += G(acc, W(on('acc'), {class: 'm-acc'}, tip('촉진제(작은 분자) — 억제제를 밀어내고 그 자리를 빠르게')));
    // 평탄제 — 볼록한 곳에 많이
    let lev = '';
    for (let x = 676; x <= 846; x += 17) lev += G(C(0, 0, 8, 'f-lev') + T(0, 5, '+', 'pl-levt'), {transform: `translate(${x} ${yS(x) - 12})`});
    for (const x of [150, 520, 980]) lev += G(C(0, 0, 8, 'f-lev') + T(0, 5, '+', 'pl-levt'), {transform: `translate(${x} ${yS(x) - 34})`});
    s += G(lev, W(on('lev'), {class: 'm-lev'}, tip('평탄제(+ 전하) — 이온이 잘 오는 볼록한 곳에 많이 붙어 그곳을 늦춘다')));
    // 분해 조각
    const rr = rng(4);
    let fr = '';
    for (let k = 0; k < 16; k++){ const x = 100 + rr() * 900, y = 240 + rr() * 380; fr += G(P('M0,0 l10,-6 l8,6', 'pl-frag') + C(16, 2, 4, 'f-frag'), {transform: `translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${Math.round(rr() * 180)})`}); }
    s += G(fr, W(only('wear'), tip('분해 조각 — 쓰면서 쪼개진 첨가제. 쌓이면 효과가 흐려진다')));
    // 이름표
    s += G(LB(K.lead(520, SB - 22, 560, 700, '억제제 + Cl⁻ — 담요', 'start', 't-sub')), only('sup'));
    s += G(LB(K.lead(300, SB + 50, 230, 640, '촉진제가 모인 오목한 곳은 빨리', 'start', 't-sub')), only('acc'));
    s += G(LB(K.lead(760, SB - 74, 640, 620, '평탄제 — 볼록한 곳을 늦춘다', 'start', 't-sub')), only('lev'));
    s += G(LB(T(80, 200, '분해 조각이 쌓인다 → 효과가 흐려진다 → 분석 · 보충 · 덜어 내기 · 교체', 't-warn', 'start')), only('wear'));
    s += G(LB(T(80, 200, '첨가제 없음 — 아무 데나 빨리 붙는다', 't-warn', 'start')), only('none'));
    // 오른쪽: 결과
    s += R(1110, 130, 450, 990, 'pl-panel', {rx: 16}) + T(1134, 172, '결과 — 범프 윗면 (개념)', 't-acc', 'start');
    s += `<g data-v="res"></g>`;
    // 다마신 바닥 채우기 (acc 단계)
    let dm = T(1134, 790, '참고: 다마신 구멍 메우기', 't-warn', 'start');
    dm += R(1180, 820, 70, 240, 'pl-diel') + R(1390, 820, 70, 240, 'pl-diel') + R(1180, 1060, 280, 20, 'pl-diel');
    for (let k = 0; k < 5; k++) dm += P(`M1250,${1050 - k * 46} L1390,${1050 - k * 46}`, 'pl-front', {style: `opacity:${(0.35 + k * 0.15).toFixed(2)}`});
    dm += K.arrow(1320, 1040, 1320, 860, 's-arr2') + TT(1134, 1100, ['촉진제가 바닥에 모여 아래부터 채운다'], 't-dim', 'start');
    s += G(dm, only('acc'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 첨가제 켜고 끄기</div>
      <div class="pl-seg" data-g="adds"><span class="lb">첨가제</span><button data-k="sup" aria-pressed="true">억제제 + Cl⁻</button><button data-k="acc" aria-pressed="true">촉진제</button><button data-k="lev" aria-pressed="true">평탄제</button></div>
      ${K.kpis([['결정', 'k-g', ''], ['표면', 'k-s', ''], ['윗면', 'k-t', '']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('켜고 끈 결과는 일반적인 경향의 예시입니다. 실제 효과는 약품 계열 · 농도 · 전류밀도에 따라 다르고, 단계(스크롤)에 따라 그 단계까지 소개된 첨가제만 적용됩니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, TT, rng, tip} = K;
    const tog = {sup: true, acc: true, lev: true};
    const box = ctx.card.querySelector('[data-g="adds"]');
    function eff(){ const sid = ctx.step() || 'wear', k = ctx.ch._idx[sid]; return {sup: tog.sup && k >= 1, acc: tog.acc && k >= 2, lev: tog.lev && k >= 3}; }
    function render(){
      const e = eff(), rs = result(e), g = rng(9);
      // 표면
      let d = `M${XL},${SB}`;
      for (let x = XL; x <= XR; x += 8){ const y = yS(x) + (e.sup ? 0 : -(g() * 22 + (x % 48 < 24 ? 8 : 0))); d += ` L${x},${y.toFixed(1)}`; }
      d += ` L${XR},1100 L${XL},1100 Z`;
      ctx.$('[data-v="surf"]').innerHTML = P(d, 'f-cu2', tip(e.sup ? '매끈한 표면' : '첨가제가 없거나 억제제가 없어 거친 표면'));
      // 쌓이는 속도 화살표
      const rt = rates(e);
      let a = '';
      PROBES.forEach(([x, nm], k) => { const len = 40 + rt[k] * 70, y1 = yS(x) - 16; a += P(`M${x},${(y1 - len).toFixed(0)} L${x},${y1.toFixed(0)}`, 'pl-rate', {'marker-end': 'url(#pl-arr-a)', style: `stroke-width:${(3 + rt[k] * 5).toFixed(1)}px`}) + T(x, y1 - len - 12, nm, 't-dim'); });
      ctx.$('[data-v="rate"]').innerHTML = G(a, {'data-tip': '화살표 = 그 자리에서 쌓이는 속도 (굵고 길수록 빠르다)'});
      // 결과 그림
      let r = '';
      const bx = 1170, bw = 330, by = 560;
      r += R(bx - 30, by, bw + 60, 16, 'f-seed2') + R(bx - 30, by + 16, bw + 60, 40, 'f-si');
      const top = rs.shape === 'flat' ? `M${bx},330 L${bx + bw},330` : rs.shape === 'dome' ? `M${bx},360 Q${bx + bw / 2},250 ${bx + bw},360` : (() => { let q = `M${bx},340`; for (let x = 0; x <= bw; x += 22) q += ` L${bx + x},${(320 + Math.sin(x * 0.7) * 16 + g() * 18).toFixed(0)}`; return q; })();
      r += P(`${top} L${bx + bw},${by} L${bx},${by} Z`, 'f-cu2', tip('PR 구멍 안에서 자란 범프 (단면)')) + R(bx - 30, 240, 30, by - 240, 'f-pr') + R(bx + bw, 240, 30, by - 240, 'f-pr');
      r += TT(1134, 640, [`결정: ${rs.g}`, `표면: ${rs.s}`, `윗면: ${rs.t}`, `속도: ${rs.v}`], 't-sub', 'start', 36);
      ctx.$('[data-v="res"]').innerHTML = r;
      ctx.out('k-g', rs.g); ctx.out('k-s', rs.s.split(' · ')[0]); ctx.out('k-t', rs.t.split(' (')[0]);
      ctx.q('[data-o=msg]').innerHTML = rs.n;
      // 꺼 둔 분자는 장면에서 감춘다
      ['sup', 'acc', 'lev'].forEach(k => ctx.$$('.m-' + k).forEach(el => el.classList.toggle('hide', !tog[k])));
      ctx.refresh();
    }
    box.addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      tog[b.dataset.k] = !tog[b.dataset.k];
      b.setAttribute('aria-pressed', tog[b.dataset.k] ? 'true' : 'false');
      if (ctx.step() && ctx.ch._idx[ctx.step()] < 3) ctx.go('lev');      // 세 가지가 모두 보이는 단계로
      render();
    });
    ctx.render = render;
    render();
  },
  onStep(K, ctx){ if (ctx.render) ctx.render(); },
  notes(K){
    return K.terms([
      ['억제제 (suppressor)', '표면을 덮어 전체 석출을 늦추는 큰 분자. Cl⁻와 함께 작동'],
      ['촉진제 (accelerator)', '억제제를 밀어내 그 자리를 빠르게 하는 작은 분자. 광택제(brightener)라고도'],
      ['평탄제 (leveler)', '이온이 잘 오는 곳에 더 많이 붙어 그곳을 늦추는 분자'],
      ['분해 산물', '쓰면서 쪼개진 첨가제 조각. 쌓이면 효과를 흐리고 막에 갇힌다'],
      ['CVS', '첨가제가 석출을 얼마나 늦추고 빠르게 하는지로 농도를 재는 분석법']
    ]) + K.field([
      '첨가제는 <b>쓰는 전기량(Ah)만큼</b> 줄어듭니다. 그래서 보충도 시간보다 Ah 기준이 정확합니다 (<a data-go="bath.add">11장</a>).',
      '범프 윗면 모양(돔 · 평평 · 접시)이 바뀌었다면 첨가제 농도 · 분해산물 · 전류밀도 · 흐름을 함께 봅니다. 하나만 바꾸고 결론 내리지 않습니다.',
      'Cu에서 쓰는 3종(억제 · 촉진 · 평탄)은 산성 황산구리 계열 이야기입니다. Ni · SnAg 액은 다른 종류(습윤제, 응력 조절제, 착화제, 결정 미세화제)를 씁니다 (<a data-go="chem">10장</a>).'
    ]) + K.deep(`<ul>
      <li><b>억제제</b>: 폴리에틸렌글리콜(PEG) · 폴리프로필렌글리콜 계열 고분자가 Cl⁻ · Cu⁺와 함께 표면에 막을 만들어 석출을 늦춥니다. Cl⁻가 없으면 잘 붙지 않습니다.</li>
      <li><b>촉진제</b>: SPS(bis(3-sulfopropyl) disulfide) 계열. 표면에서 억제제 막을 깨뜨립니다. 분해되면 MPS 등이 생겨 효과가 달라집니다.</li>
      <li><b>평탄제</b>: 질소를 가진 양이온성 분자. 확산으로 공급되므로 이온이 잘 오는 곳(볼록한 곳 · 가장자리)에 더 많이 붙습니다 — 그래서 "튀어나온 곳만" 늦출 수 있습니다.</li>
      <li><b>다마신 바닥 채우기</b>: 구멍이 좁아지며 바닥의 면적이 줄면 그곳에 모인 촉진제의 표면 농도가 올라가 바닥이 더 빨리 자랍니다(곡률 효과).</li>
      <li><b>CVS (cyclic voltammetric stripping)</b>: 백금 전극에 짧게 도금하고 벗겨 내며, 벗겨지는 전기량(= 도금된 양)이 표준액 대비 얼마나 변하는지로 억제제 · 촉진제 농도를 구합니다.</li></ul>`);
  }
});
})();
