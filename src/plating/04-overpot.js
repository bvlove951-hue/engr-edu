/* 전해도금 04 — 과전압: 얼마나 세게 밀어야 하나 (분극 곡선) */
(function(){
const GX0 = 130, GX1 = 1040, GY0 = 800, GY1 = 170, EMAX = 0.6, IMAX = 1.75;   // 그래프 영역, 과전압 0~600 mV, 전류 0~1.75 iL
const gx = e => GX0 + e / EMAX * (GX1 - GX0), gy = i => GY0 - Math.min(i, IMAX) / IMAX * (GY0 - GY1);
// 개념 모델: 금속 석출(반응 속도 + 공급 한계) + 수소 발생
function model(e, sup, agit){
  const b = sup ? 0.07 : 0.045, i0 = sup ? 0.0008 : 0.004, iL = agit;
  const ik = i0 * Math.exp(e / b), im = ik / (1 + ik / iL);
  const ih = 0.002 * Math.exp((e - 0.3) / 0.05);
  return {im, ih, i: im + ih, iL};
}
function zone(r){ return r.ih > 0.12 * r.i ? 3 : r.im > 0.88 * r.iL ? 2 : r.im > 0.3 * r.iL ? 1 : 0; }
const ZN = [
  {t: '① 반응 지배', d: '미는 만큼 전류가 지수적으로 는다. 고르고 촘촘한 막', c: 'k-ok'},
  {t: '② 혼합', d: '공급이 슬슬 모자라기 시작. 결정이 커지고 튀어나온 곳이 앞선다', c: 'k-warn'},
  {t: '③ 물질전달 지배 (한계)', d: '더 밀어도 전류가 늘지 않는다. 노듈 · 가루 · 탄 도금', c: 'k-ng'},
  {t: '④ 수소 발생', d: '물(H⁺)이 대신 반응 → 거품 · 효율↓ · 핀홀 · 피트', c: 'k-ng'}
];
const DEMO = {eq: 0, kin: 0.16, mt: 0.4, h2: 0.56};

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '04', id: 'overpot', part: 1, short: '과전압', scale: '분극 곡선',
  title: '과전압 — 얼마나 세게 밀어야 하나',
  hook: '미는 힘과 흐르는 양의 관계',
  one: '반응을 일으키려면 평형보다 조금 더 "밀어야" 합니다(과전압). 미는 만큼 전류가 늘다가, 이온 공급이 못 따라오면 멈추고, 더 밀면 엉뚱하게 물이 반응합니다. 이 관계를 그린 것이 분극 곡선입니다.',
  ana: '<b>언덕 넘기</b> — 이온이 금속이 되려면 작은 언덕(에너지 장벽)을 넘어야 합니다. 전압으로 조금 더 밀면 언덕이 낮아져 넘는 이온이 훨씬 많아집니다. 하지만 언덕 앞까지 오는 이온(공급)이 모자라면 아무리 밀어도 소용없습니다.',
  steps: [
    {id: 'eq', t: '평형 — 오가는 속도가 같다', d: '전압을 걸지 않으면 쌓이는 반응과 녹는 반응이 같은 속도로 오가서 겉보기 변화가 없습니다. 이때 오가는 양을 교환전류라고 합니다.'},
    {id: 'kin', t: '반응 지배 — 밀수록 지수적으로', d: '조금 밀면 전류가 지수적으로 늘어납니다(타펠 구역). 공급에 여유가 있어 고르고 촘촘한 막을 얻는 구역입니다.'},
    {id: 'mt', t: '물질전달 지배 — 공급 한계', d: '더 밀어도 확산층이 실어 오는 만큼만 흐릅니다(한계전류). 한계에 가까울수록 튀어나온 곳이 이온을 먼저 잡아 거칠어집니다.'},
    {id: 'h2', t: '수소 발생 — 엉뚱한 반응', d: '아주 세게 밀면 물(H⁺)이 대신 전자를 받아 수소 거품이 나옵니다. 전류효율이 떨어지고, 거품이 붙은 자리는 도금이 안 되어 핀홀 · 피트가 생깁니다.'}
  ],
  icon(K){
    const {P} = K;
    return P('M4,58 L64,58 M4,58 L4,4', 's-axis') + P('M6,56 C22,54 26,20 38,18 L52,18 C56,18 58,10 62,4', 's-curve');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W} = K;
    let s = '';
    s += R(60, 120, 1020, 1000, 'pl-panel', {rx: 16});
    s += `<g data-v="zones"></g>`;
    // 축과 눈금
    s += L(GX0, GY0, GX1 + 10, GY0, 's-axis') + L(GX0, GY0, GX0, GY1 - 20, 's-axis');
    for (let e = 0; e <= EMAX + 1e-9; e += 0.1) s += L(gx(e), GY0, gx(e), GY0 + 8, 's-axis') + T(gx(e), GY0 + 32, `${Math.round(e * 1000)}`, 't-dim');
    s += LB(T((GX0 + GX1) / 2, GY0 + 66, '과전압 η — 평형보다 더 미는 정도 (mV, 음극 쪽) →', 't-sub'));
    s += LB(T(GX0 - 24, GY1 - 34, '↑ 전류밀도 (석출 속도)', 't-sub', 'start'));
    s += `<g data-v="curves"></g><g data-v="dot"></g>`;
    // 아래: 구역별 막 모양
    const MX = [90, 335, 580, 825], MW = 230;
    MX.forEach((x, k) => {
      let g = R(x, 900, MW, 200, 'pl-box', {rx: 12, 'data-v': 'mbox' + k}) + T(x + 12, 930, ['① 반응 지배', '② 혼합', '③ 공급 한계', '④ 수소 발생'][k], 't-sub', 'start');
      const by = 1040;
      g += R(x + 14, by, MW - 28, 44, 'f-si');
      if (k === 0){ for (let i = 0; i < 12; i++) g += R(x + 14 + i * 17, by - 40, 16, 40, 'f-cu2'); }
      if (k === 1){ let d = `M${x + 14},${by}`; for (let i = 0; i <= 8; i++) d += ` L${x + 14 + i * 25},${by - 40 - (i % 2 ? 10 : 0) - (i % 3 === 0 ? 6 : 0)}`; g += P(d + ` L${x + MW - 14},${by} Z`, 'f-cu2'); }
      if (k === 2){ let d = `M${x + 14},${by} L${x + 14},${by - 30}`; for (let i = 0; i < 5; i++) d += ` Q${x + 34 + i * 40},${by - 80 - (i % 2) * 20} ${x + 54 + i * 40},${by - 30}`; g += P(d + ` L${x + MW - 14},${by} Z`, 'f-cu2') + C(x + 60, by - 96, 4, 'f-atom') + C(x + 150, by - 104, 3, 'f-atom') + C(x + 120, by - 120, 3, 'f-atom'); }
      if (k === 3){ g += R(x + 14, by - 36, MW - 28, 36, 'f-cu2'); for (const [cx, rr] of [[60, 14], [120, 10], [175, 13]]) g += P(`M${x + cx - rr},${by - 36} a${rr},${rr} 0 0 0 ${2 * rr},0`, 'f-hole2') + K.bubble(x + cx, by - 46, rr * 0.7, 120, 2.2, cx / 60); }
      g += T(x + 12, 962, ['고르고 촘촘', '결정이 커짐', '노듈 · 가루', '거품 · 핀홀'][k], 't-dim', 'start');
      s += G(g, tip(ZN[k].t + ' — ' + ZN[k].d));
    });
    // 오른쪽: 단계별 그림
    const RX = 1100;
    s += R(RX, 120, 480, 1000, 'pl-panel', {rx: 16});
    // eq: 오가는 화살표
    let eq = T(RX + 24, 166, '평형 — 오가는 양이 같다', 't-acc', 'start');
    eq += R(RX + 40, 700, 400, 120, 'f-cu2') + R(RX + 40, 260, 400, 440, 'f-bath');
    for (let k = 0; k < 4; k++){
      const x = RX + 90 + k * 95;
      eq += K.ionPath(`M${x},420 L${x},680`, 'cu', 2.8, k * 0.7, null) + K.ionPath(`M${x + 30},680 L${x + 30},420`, 'cu', 2.8, k * 0.7 + 1.4, null);
    }
    eq += K.arrow(RX + 470, 600, RX + 470, 450, 's-arr2') + K.arrow(RX + 455, 450, RX + 455, 600, 's-arr');
    eq += K.TT(RX + 24, 880, ['쌓이는 속도 = 녹는 속도', '→ 겉보기 변화 0', '이때 오가는 양 = 교환전류 i₀', '(i₀가 클수록 반응이 쉬운 금속)'], 't-sub', 'start', 34);
    s += G(eq, only('eq'));
    // kin: 언덕 그림
    let kn = T(RX + 24, 166, '언덕 넘기 — 밀면 장벽이 낮아진다', 't-acc', 'start');
    kn += L(RX + 40, 640, RX + 450, 640, 's-axis') + LB(T(RX + 40, 676, '이온 (액 속)', 't-dim', 'start') + T(RX + 450, 676, '원자 (금속)', 't-dim', 'end'));
    kn += P(`M${RX + 50},460 C${RX + 120},460 ${RX + 170},300 ${RX + 245},300 C${RX + 320},300 ${RX + 360},470 ${RX + 440},470`, 's-dash', tip('밀기 전'));
    kn += P(`M${RX + 50},460 C${RX + 120},460 ${RX + 170},360 ${RX + 245},370 C${RX + 320},380 ${RX + 360},590 ${RX + 440},600`, 's-curve', tip('조금 밀었을 때 — 오른쪽(금속 쪽)이 내려가고 장벽이 낮아진다'));
    kn += `<circle r="16" class="k-acc2"><animateMotion dur="3s" repeatCount="indefinite" path="M${RX + 60},446 C${RX + 120},446 ${RX + 170},346 ${RX + 245},356 C${RX + 320},366 ${RX + 360},576 ${RX + 430},586"/></circle>`;
    kn += K.arrow(RX + 400, 480, RX + 400, 580, 's-arr2') + T(RX + 392, 530, 'η', 't-warn', 'end');
    kn += K.TT(RX + 24, 760, ['장벽이 조금 낮아져도 넘는 이온은', '지수적으로 늘어난다 (타펠 구역)', '', '억제제는 언덕을 높여', '"더 밀어야" 흐르게 만든다 → 05장'], 't-sub', 'start', 34);
    s += G(kn, only('kin'));
    // mt: 공급 한계 (깔때기)
    let mt = T(RX + 24, 166, '공급 한계 — 골목길만큼만', 't-acc', 'start');
    mt += P(`M${RX + 70},240 L${RX + 410},240 L${RX + 270},470 L${RX + 270},620 L${RX + 210},620 L${RX + 210},470 Z`, 'f-bath') + P(`M${RX + 70},240 L${RX + 210},470 L${RX + 210},620 M${RX + 410},240 L${RX + 270},470 L${RX + 270},620`, 's-edge');
    for (let k = 0; k < 9; k++) mt += K.jiggle(RX + 120 + (k % 5) * 55, 280 + Math.floor(k / 5) * 60, 'cu', k + 40, 8);
    for (let k = 0; k < 3; k++) mt += K.ionPath(`M${RX + 240},470 L${RX + 240},640`, 'cu', 2.4, k * 0.8, null);
    mt += R(RX + 120, 650, 240, 40, 'f-cu2') + LB(T(RX + 300, 540, '확산층', 't-warn', 'start'));
    mt += K.TT(RX + 24, 780, ['위(벌크)에 이온이 아무리 많아도', '좁은 확산층을 걸어오는 만큼만', '표면에 닿는다 → 전류가 평평해진다', '', '교반을 세게 → 골목이 짧아져', '평평한 높이(한계전류)가 올라간다'], 't-sub', 'start', 34);
    s += G(mt, only('mt'));
    // h2: 수소
    let hh = T(RX + 24, 166, '수소 발생 — 물이 대신 반응', 't-acc', 'start');
    hh += R(RX + 40, 620, 400, 100, 'f-cu2') + R(RX + 40, 260, 400, 360, 'f-bath');
    for (let k = 0; k < 12; k++) hh += K.bubble(RX + 70 + (k % 6) * 66, 610, 8 + (k % 3) * 5, 330, 2 + (k % 4) * 0.4, k * 0.3);
    for (let k = 0; k < 3; k++) hh += K.ionPath(`M${RX + 120 + k * 120},300 L${RX + 120 + k * 120},600`, 'h', 2.6, k * 0.8, null);
    hh += K.TT(RX + 24, 790, ['2H⁺ + 2e⁻ → H₂ (거품)', '전자가 금속 대신 수소에 쓰인다 → 효율↓', '거품이 붙은 자리는 도금이 안 된다', '→ 핀홀 · 피트 · 보이드'], 't-sub', 'start', 34);
    s += G(hh, only('h2'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 곡선 위를 걸어 보기</div>
      ${K.ctl('e', '미는 힘 — 과전압 (mV)', 0, 600, 5, 160)}
      ${K.ctl('a', '교반 (한계전류 배수)', 0.6, 1.6, 0.05, 1)}
      ${K.seg('sup', [['0', '없음'], ['1', '있음']], '0', '억제제')}
      ${K.kpis([['구역', 'k-z', ''], ['금속 석출', 'k-m', '한계전류 대비'], ['전류효율', 'k-eff', '금속 몫']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('i = i₀e^(η/b) / (1 + i₀e^(η/b)/iL) + 수소. 축 값은 상대값이며 금속 · 액마다 다릅니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip} = K;
    let touched = false;
    const st = {e: 0.16, a: 1, sup: false};
    const ein = ctx.card.querySelector('input[data-i=e]');
    function render(){
      // 구역 띠 (현재 조건에서 경계 계산)
      const bd = [0, 0, 0];
      for (let e = 0; e <= EMAX; e += 0.0025){ const z = zone(model(e, st.sup, st.a)); for (let k = 0; k < 3; k++) if (z > k && !bd[k]) bd[k] = e; }
      const xs = [GX0, gx(bd[0] || EMAX), gx(bd[1] || EMAX), gx(bd[2] || EMAX), GX1];
      const zc = ['pl-z0', 'pl-z1', 'pl-z2', 'pl-z3'];
      let zs = '';
      for (let k = 0; k < 4; k++) if (xs[k + 1] > xs[k] + 1) zs += R(xs[k], GY1 - 10, xs[k + 1] - xs[k], GY0 - GY1 + 10, zc[k]) + T((xs[k] + xs[k + 1]) / 2, GY1 + 18, ['①', '②', '③', '④'][k], 't-dim');
      ctx.$('[data-v="zones"]').innerHTML = G(zs, K.on('kin'));
      // 곡선: 금속(굵게), 전체(수소 포함), 억제제 비교(점선)
      const pts = (f) => { let d = ''; for (let e = 0; e <= EMAX + 1e-9; e += 0.005){ d += (d ? ' L' : 'M') + gx(e).toFixed(1) + ',' + gy(f(e)).toFixed(1); } return d; };
      let cv = P(pts(e => model(e, st.sup, st.a).im), 's-curve', tip('금속 석출 전류'));
      cv += G(P(pts(e => model(e, st.sup, st.a).i), 's-curve2', tip('전체 전류 = 금속 + 수소')), K.on('h2'));
      cv += G(P(pts(e => model(e, !st.sup, st.a).im), 'pl-cmp', tip(st.sup ? '억제제가 없을 때' : '억제제가 있을 때 — 오른쪽으로 밀리고 완만해진다')) + LB(T(gx(st.sup ? 0.12 : 0.36), gy(model(st.sup ? 0.12 : 0.36, !st.sup, st.a).im) - 16, st.sup ? '억제제 없음' : '억제제 있음', 'pl-cmpt', 'middle')), K.on('kin'));
      cv += L(GX0, gy(st.a), GX1, gy(st.a), 's-dash') + LB(T(GX1 - 6, gy(st.a) - 12, '한계전류 iL', 't-warn', 'end'));
      ctx.$('[data-v="curves"]').innerHTML = cv;
      // 지금 점
      const r = model(st.e, st.sup, st.a), z = zone(r), x = gx(st.e), y = gy(r.i);
      let dt = L(x, GY0, x, y, 's-dash') + C(x, gy(r.im), 9, 'k-acc') + C(x, y, 13, ZN[z].c) + C(x, y, 22, 'co-ring');
      dt += LB(T(Math.min(x + 20, GX1 - 260), Math.max(GY1 + 40, y - 26), `${ZN[z].t}`, 't-warn', 'start'));
      ctx.$('[data-v="dot"]').innerHTML = dt;
      ctx.$$('[data-v^="mbox"]').forEach((b, k) => b.setAttribute('class', k === z ? 'pl-box pl-on' : 'pl-box'));
      ctx.out('k-z', ZN[z].t.split(' ')[0] + ' ' + ZN[z].t.split(' ')[1]);
      ctx.out('k-m', `${Math.round(r.im / r.iL * 100)} %`);
      ctx.out('k-eff', `${Math.round(r.im / r.i * 100)} %`);
      ctx.q('[data-o=msg]').innerHTML = `<b>${ZN[z].t}</b> — ${ZN[z].d}.`;
      ctx.refresh();
    }
    ctx.range('e', v => { st.e = v / 1000; render(); return v + ' mV'; });
    ctx.range('a', v => { st.a = v; render(); return '×' + v.toFixed(2); });
    ctx.seg('sup', v => { st.sup = v === '1'; render(); });
    ctx.card.querySelectorAll('input, .pl-seg button').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    ctx.demo = sid => {
      if (touched) return ctx.refresh();
      const e = DEMO[sid] != null ? DEMO[sid] : 0.16;
      ein.value = Math.round(e * 1000); st.e = e; ctx.out('e', Math.round(e * 1000) + ' mV');
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['과전압 (η)', '반응을 원하는 속도로 일으키려고 평형보다 더 거는 전압'],
      ['분극 곡선', '과전압과 전류의 관계를 그린 곡선. 도금액의 "성격표"'],
      ['교환전류 (i₀)', '평형에서 쌓이고 녹는 반응이 오가는 양. 클수록 반응이 쉽다'],
      ['타펠 구역', '전류가 과전압에 지수적으로 느는 구간 (반응 지배)'],
      ['한계전류 (iL)', '공급(확산)이 따라갈 수 있는 최대 전류 → 03장']
    ]) + K.field([
      '실무에서는 <b>반응 지배 ~ 혼합 구역</b>, 한계전류보다 충분히 낮은 곳에서 운전합니다. 전류를 올려 처리량을 늘리고 싶을 때 먼저 한계전류와의 거리를 봅니다.',
      '<b>곡선이 완만할수록 전류가 고르게 퍼집니다.</b> 가까운 곳으로 조금 더 흘리려면 훨씬 더 밀어야 하므로 전류가 한곳에 쏠리지 않기 때문입니다. 억제제가 균일도를 돕는 이유입니다 (07장 · 08장).',
      '같은 전류인데 전압이 오른다면, 곡선이 바뀌었거나(첨가제 · 농도 · 온도) 곡선 밖의 저항(접점 · 액 · 분리막)이 커진 것입니다.'
    ]) + K.deep(`<p>버틀러-볼머 식을 음극 쪽만 남기고 공급 한계를 넣으면:</p>
      ${K.eq('i = i₀·exp(αnFη/RT) / (1 + i₀·exp(αnFη/RT) / iL)')}
      <ul><li><b>타펠 기울기</b> — 전류를 10배 늘리는 데 필요한 과전압(mV/decade). 기울기가 클수록 곡선이 완만합니다.</li>
      <li><b>바그너 수</b> Wa = κ·(dη/di) / L — 액의 전도도 κ와 곡선의 완만함(dη/di)이 클수록, 크기 L이 작을수록 분포가 고릅니다. 타펠 구역에서 dη/di ≈ (타펠 기울기)/(2.3·i) 이므로 전류밀도를 올리면 Wa가 작아져 분포가 나빠지기 쉽습니다.</li>
      <li>억제제(PEG + Cl⁻ 계열)는 곡선을 오른쪽으로 밀고 완만하게 만듭니다 — 같은 전류에 더 큰 과전압, 대신 분포가 고르게.</li>
      <li>실제 분극 곡선은 회전 원판 전극 등으로 전위를 훑으며 측정합니다(선형 주사 전압전류법). 액 상태 진단에도 씁니다.</li></ul>`);
  }
});
})();
