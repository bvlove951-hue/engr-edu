/* 전해도금 11 — 도금액 관리: 매일 변하는 약품 (날짜 · 주) */
(function(){
const DAYS = 30, X0 = 540, X1 = 1530;
const dx = d => X0 + d / DAYS * (X1 - X0);
const LANES = [
  {id: 'metal', y: 150, h: 230, t: '① 금속 농도 (목표 = 1)', lo: 0.9, hi: 1.1, min: 0.8, max: 1.2},
  {id: 'add', y: 420, h: 230, t: '② 첨가제 농도 (목표 = 1)', lo: 0.9, hi: 1.1, min: 0.7, max: 1.3},
  {id: 'byp', y: 690, h: 230, t: '③ 분해산물 (교체 기준 = 1)', lo: null, hi: 1, min: 0, max: 1.4}
];
const PY = 960, PH = 120;                                       // 생산량 막대
function sim(p, K){
  const r = K.rng(77), prod = [], M = [1], A = [1], B = [0.15];
  for (let d = 0; d < DAYS; d++) prod.push(p.var ? 0.45 + r() * 1.1 : 1);
  const b = p.bleed / 100, c = 0.08, g = 0.04;
  let metalDose = 0;
  for (let d = 0; d < DAYS; d++){
    const ah = prod[d];
    // 금속: 가용성 양극은 조금씩 늘고, 불용성은 줄어 분석 때 보충
    let m = M[d] + (p.sol ? 0.003 * ah : -0.03 * ah) - b * (M[d] - 1);
    if (!p.sol && d % 2 === 1 && m < 0.97){ m = 1; metalDose++; }
    M.push(m);
    const dose = p.ah ? c * ah : c;                               // Ah 기준 / 시간 기준
    A.push(A[d] - c * ah + dose - b * (A[d] - 1));
    B.push(B[d] * (1 - b) + g * ah);
  }
  const out = A.filter(v => v < 0.9 || v > 1.1).length, mOut = M.filter(v => v < 0.9 || v > 1.1).length;
  const cross = B.findIndex(v => v >= 1);
  return {prod, M, A, B, out, mOut, cross, ss: b > 0 ? g / b : Infinity, metalDose};
}

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '11', id: 'bath', part: 3, short: '도금액 관리', scale: '날짜 · 주',
  title: '도금액 관리 — 매일 변하는 약품',
  hook: '쓰고, 쪼개지고, 쌓인다',
  one: '도금액은 매일 변합니다. 금속은 쓰는 만큼 줄고(또는 양극에서 늘고), 첨가제는 쪼개지고, 분해산물은 쌓입니다. 그래서 재고, 보충하고, 덜어 내는 일이 도금 공정 관리의 절반입니다.',
  ana: '<b>국물 요리</b> — 끓일수록 물은 졸고(금속 소모), 양념 맛은 날아가고(첨가제 분해), 찌꺼기는 쌓입니다(분해산물). 맛을 보고(분석) 간을 맞추고(보충), 너무 탁해지면 일부를 덜어 내고 새 육수를 붓습니다(bleed & feed).',
  steps: [
    {id: 'metal', t: '금속 — 쓰는 만큼 변한다', d: '불용성 양극이면 금속은 쓰는 만큼 줄어 분석 뒤 보충합니다. 가용성 양극은 스스로 보충하지만, 양극에서 녹는 양과 웨이퍼에 쌓이는 양이 조금 달라 서서히 늘거나 줄 수 있습니다.'},
    {id: 'add', t: '첨가제 — 전기량만큼 소모', d: '첨가제는 흘린 전기량(Ah)만큼 줄어듭니다. 생산량이 들쭉날쭉하면 시간 기준 보충은 틀리고, Ah 기준 보충이 맞습니다.'},
    {id: 'byp', t: '분해산물 — 쌓이면 덜어 낸다', d: '분해 조각은 계속 쌓입니다. 일부를 버리고 새 액을 넣는 bleed & feed는 쌓이는 양을 일정 수준에서 멈추게 합니다. 없으면 기준에 닿을 때 활성탄 처리나 교체를 합니다.'},
    {id: 'ana', t: '분석과 판정', d: '적정(금속 · 산 · Cl), CVS(첨가제), ICP(불순물 금속)로 정기 분석해 관리도에 찍고, 이탈이면 보충 · 홀드 · 원인 분석으로 넘어갑니다.'}
  ],
  icon(K){
    const {P, PL} = K;
    return P('M2,60 L64,60 M2,60 L2,4', 's-axis') + PL([[4, 30], [14, 22], [14, 34], [26, 26], [26, 36], [38, 28], [38, 38], [50, 30], [50, 40], [62, 32]], 's-curve');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT} = K;
    let s = '';
    // 왼쪽: 탱크와 드나드는 것
    s += R(40, 130, 380, 990, 'pl-panel', {rx: 16}) + T(64, 172, '탱크에 드나드는 것', 't-acc', 'start');
    s += P('M110,470 L110,800 L350,800 L350,470', 'f-tank') + R(113, 510, 234, 287, 'f-bath', tip('도금액'));
    const io = (d, cls, t, sub, x, y, anchor, st) => G(K.arrowP(d, cls) + T(x, y, t, 't-sub', anchor) + T(x, y + 28, sub, 't-dim', anchor), W(tip(t + ' — ' + sub), st ? only(st) : null));
    s += io('M160,300 L160,500', 's-arrg', '보충 (도징)', '첨가제 · 금속', 70, 250, 'start');
    s += io('M300,300 L300,500', 's-arr', '새 액 (feed)', '목표 농도의 새 액', 250, 250, 'start');
    s += io('M300,800 L300,940', 's-arrr', '덜어 냄 (bleed)', '분해산물째 버림', 220, 990, 'start');
    s += io('M110,640 L60,640 L60,900', 's-arr3', '샘플 → 분석', '적정 · CVS · ICP', 60, 940, 'start');
    s += G(R(150, 560, 160, 60, 'pl-box', {rx: 10}) + T(230, 598, '도금 (Ah)', 't-sub'), tip('웨이퍼를 도금하면서 금속과 첨가제를 쓴다 (흘린 전기량 Ah에 비례)'));
    s += G(K.lead(230, 700, 130, 850, '분해산물이 쌓인다', 'start', 't-warn'), on('byp'));
    // 오른쪽: 30일 그래프
    s += R(440, 130, 1140, 990, 'pl-panel', {rx: 16});
    LANES.forEach(l => {
      const yv = v => l.y + l.h - (v - l.min) / (l.max - l.min) * l.h;
      let g = R(X0, l.y, X1 - X0, l.h, 'pl-lane', {rx: 6});
      if (l.lo != null) g += R(X0, yv(l.hi), X1 - X0, yv(l.lo) - yv(l.hi), 'pl-spec', tip('관리 범위 (예시 ±10 %)'));
      g += L(X0, yv(l.id === 'byp' ? 1 : 1), X1, yv(1), l.id === 'byp' ? 'pl-peak' : 's-dash');
      g += T(464, l.y + 30, l.t.split(' (')[0], 't-sub', 'start') + T(464, l.y + 58, '(' + l.t.split(' (')[1], 't-dim', 'start');
      g += `<g data-v="${l.id}"></g>`;
      g += R(X0 - 6, l.y - 6, X1 - X0 + 12, l.h + 12, 'pl-hlbox', W({rx: 8}, only(l.id === 'metal' ? 'metal' : l.id === 'add' ? 'add' : 'byp')));
      s += g;
    });
    s += T(464, PY + 30, '생산량 (Ah)', 't-sub', 'start') + `<g data-v="prod"></g>`;
    for (let d = 0; d <= DAYS; d += 5) s += T(dx(d), PY + PH + 30, `${d}일`, 't-dim');
    s += `<g data-v="ana"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 한 달 운영</div>
      ${K.seg('dose', [['time', '시간 기준'], ['ah', 'Ah 기준']], 'time', '첨가제 보충')}
      ${K.seg('prod', [['flat', '일정'], ['var', '들쭉날쭉']], 'var', '생산량')}
      ${K.ctl('b', 'bleed & feed (%/일)', 0, 10, 0.5, 0)}
      ${K.seg('an', [['sol', '가용성'], ['ins', '불용성']], 'sol', '양극')}
      ${K.kpis([['첨가제 이탈', 'k-out', '30일 중'], ['분해산물 30일째', 'k-b', '교체 기준 대비'], ['정상 수준', 'k-ss', 'bleed가 멈추는 곳']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('첨가제는 Ah × 소모율만큼 줄고, 보충과 bleed & feed(목표 농도로 당김)로 돌아옵니다. 분해산물 B(다음 날) = B × (1 − bleed) + 생성량. 숫자는 상대값입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, PL, tip} = K;
    const st = {ah: false, var: true, bleed: 0, sol: true};
    function lane(id, arr, cls){
      const l = LANES.find(x => x.id === id), yv = v => l.y + l.h - (Math.max(l.min, Math.min(l.max, v)) - l.min) / (l.max - l.min) * l.h;
      return {pts: arr.map((v, d) => [dx(d), yv(v)]), yv};
    }
    function render(){
      const r = sim(st, K);
      const m = lane('metal', r.M), a = lane('add', r.A), b = lane('byp', r.B);
      ctx.$('[data-v="metal"]').innerHTML = PL(m.pts, 's-curve', tip('금속 농도'));
      ctx.$('[data-v="add"]').innerHTML = PL(a.pts, 's-curve', tip('첨가제 농도')) + r.A.map((v, d) => (v < 0.9 || v > 1.1) ? C(dx(d), a.yv(v), 6, 'k-ng') : '').join('');
      let bb = PL(b.pts, 's-curve2', tip('분해산물'));
      if (r.cross >= 0) bb += C(dx(r.cross), b.yv(1), 9, 'k-ng') + T(dx(r.cross), b.yv(1) - 18, `${r.cross}일째 교체 기준`, 'pl-warn', r.cross > 24 ? 'end' : 'middle');
      if (isFinite(r.ss) && r.ss < 1.4) bb += L(X0, b.yv(r.ss), X1, b.yv(r.ss), 'pl-ss') + T(X1 - 6, b.yv(r.ss) - 8, `정상 수준 ${(r.ss * 100).toFixed(0)} %`, 'pl-sst', 'end');
      ctx.$('[data-v="byp"]').innerHTML = bb;
      let pr = '';
      r.prod.forEach((v, d) => { pr += R(dx(d) + 4, PY + PH - v / 1.6 * PH, (X1 - X0) / DAYS - 8, v / 1.6 * PH, 'pl-bar', tip(`${d + 1}일째 생산량 ×${v.toFixed(2)}`)); });
      ctx.$('[data-v="prod"]').innerHTML = pr;
      // 분석 점 (2일마다): 측정값 = 실제 + 조금의 흔들림
      const rr = K.rng(5);
      let an = '';
      for (let d = 1; d <= DAYS; d += 2){
        const vm = r.M[d] + (rr() - 0.5) * 0.02, va = r.A[d] + (rr() - 0.5) * 0.03;
        an += C(dx(d), m.yv(vm), 7, vm < 0.9 || vm > 1.1 ? 'pl-anang' : 'pl-anaok') + C(dx(d), a.yv(va), 7, va < 0.9 || va > 1.1 ? 'pl-anang' : 'pl-anaok');
      }
      ctx.$('[data-v="ana"]').innerHTML = G(an + LB(T(X1, LANES[0].y - 12, '● 분석값 (2일마다) · 빨강 = 이탈 → 보충 · 홀드', 't-dim', 'end')), K.only('ana'));
      ctx.out('k-out', `${r.out}일`); ctx.out('k-b', `${Math.round(r.B[DAYS] * 100)} %`); ctx.out('k-ss', isFinite(r.ss) ? `${Math.round(r.ss * 100)} %` : '계속 증가');
      const ko = ctx.card.querySelector('[data-o="k-out"]').parentNode; ko.classList.toggle('ok', r.out === 0); ko.classList.toggle('ng', r.out > 0);
      const kb = ctx.card.querySelector('[data-o="k-b"]').parentNode; kb.classList.toggle('ok', r.B[DAYS] < 0.8); kb.classList.toggle('ng', r.B[DAYS] >= 1);
      const msgs = [];
      msgs.push(st.ah ? 'Ah 기준 보충은 쓴 만큼 정확히 넣어 생산량이 흔들려도 첨가제가 목표에 머뭅니다.' : st.var ? '<b>시간 기준 보충</b>은 생산량이 많은 날 모자라고 적은 날 남아, 첨가제가 흔들립니다.' : '생산량이 일정하면 시간 기준 보충도 맞습니다.');
      msgs.push(st.bleed > 0 ? `bleed & feed ${st.bleed} %/일 → 분해산물이 ${isFinite(r.ss) ? Math.round(r.ss * 100) + ' %' : ''} 근처에서 멈춥니다.` : '분해산물은 덜어 내지 않으면 계속 쌓여 결국 교체 기준에 닿습니다.');
      if (st.sol) msgs.push('가용성 양극: 금속이 서서히 늘어 bleed · 희석으로 맞춥니다.'); else msgs.push(`불용성 양극: 금속이 줄어 분석 뒤 ${r.metalDose}번 보충했습니다.`);
      ctx.q('[data-o=msg]').innerHTML = msgs.join(' ');
      ctx.refresh();
    }
    ctx.seg('dose', v => { st.ah = v === 'ah'; render(); });
    ctx.seg('prod', v => { st.var = v === 'var'; render(); });
    ctx.range('b', v => { st.bleed = v; render(); return v.toFixed(1) + ' %'; });
    ctx.seg('an', v => { st.sol = v === 'sol'; render(); });
  },
  notes(K){
    return K.terms([
      ['도징 (dosing)', '정해진 양을 자동으로 넣는 것. Ah(전기량) 기준 · 시간 기준'],
      ['bleed & feed', '매일 일부를 버리고(bleed) 새 액을 넣는(feed) 운전. 쌓이는 것을 일정 수준에서 멈춘다'],
      ['활성탄 처리', '유기 분해산물을 활성탄에 흡착시켜 걸러 내는 것. 첨가제도 함께 빠지므로 다시 넣는다'],
      ['적정 · CVS · ICP', '금속 · 산 · Cl 농도 · 첨가제 효과 · 불순물 금속을 재는 분석법'],
      ['액 수명 (bath life)', '교체까지 쓸 수 있는 기간이나 전기량 (Ah/L로 말하기도)']
    ]) + K.field([
      '관리도에서 <b>추세</b>를 봅니다. 한 점 이탈보다 꾸준히 한쪽으로 가는 것이 보충 방식 · 양극 · 분석 문제를 먼저 알려 줍니다 (<a href="#go-edu-3">03 관리도</a>).',
      '약품 lot이 바뀐 뒤 두께 · 조성이 변했다면 4M1E 중 Material 변경입니다. lot 이력과 분석값을 함께 기록해 두어야 원인을 좁힐 수 있습니다.',
      '새 액을 만든 직후(make-up)나 교체 직후에는 더미 도금(전해 더미)으로 액을 길들이고 첫 lot을 확인하는 경우가 많습니다.'
    ]) + K.deep(`<p>bleed & feed의 정상 수준: 매일 생성량 g, 덜어 내는 비율 b이면</p>
      ${K.eq('B(다음 날) = B · (1 − b) + g   →   정상 수준 B* = g / b')}
      <ul><li>b를 두 배로 하면 정상 수준이 반으로 줄지만, 버리는 약품 · 폐수가 두 배입니다. 정상 수준이 교체 기준보다 충분히 낮은 가장 작은 b를 찾습니다.</li>
      <li>정상 수준에 다가가는 속도는 약 1/b일 정도입니다(b = 5 %/일이면 약 20일).</li>
      <li>첨가제는 소모 외에 분해산물과의 상호작용으로 "효과"가 변할 수 있어, 농도(CVS)와 함께 실제 도금 결과(두께 · 모양 · 조성)를 추적합니다.</li>
      <li>가용성 Cu 양극에서는 양극 효율이 웨이퍼 쪽 효율보다 조금 높아 Cu가 서서히 늘기 쉽습니다. 반대로 SnAg처럼 불용성 양극이면 금속을 약품으로 보충합니다.</li></ul>`);
  }
});
})();
