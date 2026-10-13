/* 전해도금 03 — 표면 가까이: 이온은 어떻게 도착하나 (표면 · 수십 µm) */
(function(){
const SURF = 1000, X0 = 40, X1 = 1090, PXUM = 4;       // 표면 y, 장면 가로 범위, 1 µm = 4 px
const GX0 = 1170, GX1 = 1520;                          // 농도 그래프 가로 (0 → 벌크 농도)
const D = 7e-10, F = 96485, N = 2, D0 = 60;            // 확산계수(m²/s), 교반 ×1일 때 확산층 60 µm (예시)
const DEMO = {bulk: 5, diff: 5, surf: 5, limit: 16};   // 손대지 않았을 때 단계마다 보여 줄 전류밀도

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '03', id: 'surface', part: 1, short: '이온이 오는 길', scale: '표면 · 수십 µm',
  title: '표면 가까이 — 이온은 어떻게 도착하나',
  hook: '확산층이 공급의 상한을 정한다',
  one: '멀리서는 흐름이 이온을 실어 나르고, 표면 바로 앞의 얇은 층은 이온이 스스로 퍼져서(확산) 건넙니다. 이 얇은 층이 "얼마나 빨리 쌓을 수 있나"의 상한을 정합니다.',
  ana: '<b>고속도로와 골목길</b> — 이온은 흐름(고속도로)을 타고 빠르게 오다가, 표면 앞 확산층(골목길)부터는 걸어서 갑니다. 아무리 차를 많이 보내도 골목길을 걸어 들어오는 속도 이상으로는 배달할 수 없습니다. 교반을 세게 하면 골목길이 짧아집니다.',
  steps: [
    {id: 'bulk', t: '대류 — 흐름이 실어 나른다', d: '펌프 · 웨이퍼 회전 · 패들로 섞인 액이 이온을 표면 가까이까지 실어 나릅니다. 여기서는 농도가 어디나 같습니다.'},
    {id: 'diff', t: '확산층 — 걸어서 건너는 구간', d: '표면 바로 앞(δ, 보통 수~수십 µm)은 흐름이 거의 멎어 이온이 진한 곳 → 묽은 곳으로 퍼져서만 건넙니다. 표면이 이온을 쓰므로 표면 농도가 낮아 기울기가 생깁니다.'},
    {id: 'surf', t: '표면 — 전자를 받고 자리 찾기', d: '이온은 표면에 붙은 얇은 전기이중층(수 nm)을 건너며 전자를 받고, 원자는 표면을 옮겨 다니다 계단 모서리 · 꺾인 자리에 자리 잡습니다.', view: {x: 524, y: 812, w: 560, h: 300}},
    {id: 'limit', t: '한계전류 — 더는 못 따라온다', d: '전류를 올려 표면 농도가 0이 되면 더 빨리 쌓을 수 없습니다(한계전류). 한계에 가까울수록 튀어나온 곳이 이온을 먼저 잡아 거칠어지고(노듈), 넘기면 수소가 나오고 가루처럼 타거나 나뭇가지(덴드라이트)처럼 자랍니다.'}
  ],
  icon(K){
    const {R, P} = K;
    return R(2, 4, 62, 30, 'f-bath') + R(2, 34, 62, 18, 'f-dl') + R(2, 52, 62, 10, 'f-cu2') + P('M6,14 L58,14 M6,24 L58,24', 's-flow');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W} = K;
    let s = '';
    s += R(X0, 120, X1 - X0, SURF - 120, 'f-bath', tip('도금액'));
    s += `<g data-v="dl"></g>`;                                          // 확산층 띠 (위젯이 그린다)
    s += `<g data-v="flow"></g><g data-v="ions"></g>`;
    s += R(X0, SURF - 14, X1 - X0, 14, 'pl-edl', tip('전기이중층 — 표면에 붙은 이온 · 물 분자의 얇은 층 (실제는 수 nm, 크게 과장)'));
    s += `<g data-v="metal"></g>`;
    s += R(X0, SURF, X1 - X0, 120, 'f-cu2', tip('음극 표면 (금속)'));
    // 단계별 설명
    s += G(LB(T(X0 + 24, 168, '대류 — 흐름이 이온을 실어 나른다 (농도가 어디나 같다)', 't-acc', 'start')), only('bulk'));
    s += G(LB(T(X0 + 24, 168, '확산층 안에서는 걸어서 — 진한 곳에서 묽은 곳으로', 't-acc', 'start')), only('diff'));
    s += `<g data-v="brk"></g>`;
    // 표면 확대 (surf 단계) — x 530~1080, 글자는 확대에 맞춰 작게
    const AX = i => 532 + i * 23, ED = 12;                             // 위 계단은 ED번째 원자까지
    let z = '';
    for (let i = 0; i < 24; i++) z += C(AX(i), SURF + 14, 11.5, 'f-atom');
    for (let i = 0; i < ED; i++) z += C(AX(i) + 11, SURF - 8, 11.5, 'f-atom');
    const xi = AX(19), xk = AX(ED) + 11;
    z += `<circle r="11.5" class="f-atom2"><animateMotion dur="3.6s" repeatCount="indefinite" keyTimes="0;.35;.9;1" keyPoints="0;0;1;1" calcMode="linear" path="M${xi},${SURF - 8} L${xk},${SURF - 8}"/></circle>`;
    z += K.ionPath(`M${xi},${SURF - 150} L${xi},${SURF - 10}`, 'cu', 3.6, 0, null, false).replace('<animateMotion', '<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.33;.36;1" dur="3.6s" repeatCount="indefinite"/><animateMotion keyTimes="0;.35;1" keyPoints="0;1;1" calcMode="linear"');
    for (const dx of [-1, 1]) z += `<circle r="6" class="k-e"><animateMotion dur="3.6s" repeatCount="indefinite" keyTimes="0;.33;1" keyPoints="0;1;1" calcMode="linear" path="M${xi + dx * 30},${SURF + 40} L${xi + dx * 6},${SURF - 6}"/></circle>`;
    const zl = (px, py, tx, ty, t) => LB(P(`M${px},${py} L${tx},${ty}`, 's-lead') + C(px, py, 3, 'k-lead') + T(tx + 6, ty + 5, t, 'pl-zt', 'start'));
    z += zl(xi - 16, SURF - 40, 548, 836, '① 이중층을 건너며 전자 2개를 받는다 (전하 이동)');
    z += zl(xi - 40, SURF - 14, 548, 870, '② 원자가 표면을 옮겨 다닌다');
    z += zl(xk + 2, SURF - 18, 548, 904, '③ 계단 모서리 · 꺾인 자리에 자리 잡는다');
    z += LB(T(1076, SURF - 20, '이중층 (수 nm, 과장)', 'pl-zt', 'end'));
    s += G(z, only('surf'));
    // 오른쪽: 농도 그래프 (세로 = 표면에서의 거리, 무대와 같은 눈금)
    s += R(GX0 - 40, 120, GX1 - GX0 + 80, SURF - 120 + 110, 'pl-panel', {rx: 14});
    s += LB(T(GX0 - 20, 156, '이온 농도', 't-acc', 'start') + T(GX0 - 20, 184, '(무대와 같은 높이 눈금)', 't-dim', 'start'));
    s += L(GX0, 200, GX0, SURF, 's-axis') + L(GX0, SURF, GX1 + 10, SURF, 's-axis');
    s += LB(T(GX0, SURF + 36, '0', 't-dim') + T(GX1, SURF + 36, '벌크 농도', 't-dim') + T(GX0 + 10, SURF + 72, '표면', 't-dim', 'start'));
    s += `<g data-v="prof"></g>`;
    s += `<g data-v="msg"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 공급의 상한</div>
      ${K.ctl('a', '교반 세기 (흐름 · 회전)', 0, 100, 1, 33)}${K.ctl('j', '전류밀도 (ASD)', 1, 40, 0.5, 5)}${K.ctl('c', 'Cu²⁺ 농도 (mol/L, 예시)', 0.2, 1.0, 0.05, 0.6)}
      ${K.kpis([['확산층 δ', 'k-d', ''], ['한계전류', 'k-il', 'ASD'], ['J / 한계', 'k-r', ''], ['표면 농도', 'k-cs', '벌크 대비']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('δ = 60 µm / √(교반 배수), iL = n·F·D·C / δ, D ≈ 7×10⁻¹⁰ m²/s. 실제 δ는 장비 · 흐름 방식 · 위치마다 다릅니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip, rng} = K;
    let touched = false;
    const st = {a: 33, j: 5, c: 0.6};
    const ain = ctx.card.querySelector('input[data-i=a]'), jin = ctx.card.querySelector('input[data-i=j]');
    const mult = v => 0.25 * Math.pow(64, v / 100);                  // 교반 배수 ×0.25 ~ ×16
    function morph(r){
      // 표면 모양: r = J / iL
      const g = rng(11);
      let d = `M${X0},${SURF}`, extra = '';
      if (r < 0.5){ for (let x = X0; x <= X1; x += 30) d += ` L${x},${SURF - 1.5 - g() * 2}`; }
      else if (r < 0.8){ const a = 4 + (r - 0.5) / 0.3 * 10; for (let x = X0; x <= X1; x += 22) d += ` L${x},${(SURF - a * (0.5 + 0.5 * Math.sin(x / 37)) - g() * a * 0.6).toFixed(1)}`; }
      else {
        const a = r < 1 ? 14 + (r - 0.8) / 0.2 * 18 : 30;
        for (let x = X0; x <= X1; x += 40){ const hh = a * (0.5 + g()); d += ` L${x},${SURF} Q${x + 20},${(SURF - hh * 1.6).toFixed(1)} ${x + 40},${SURF}`; }
        if (r >= 1){
          for (let k = 0; k < 13; k++){
            const x = X0 + 40 + k * 80 + g() * 30, hgt = 70 + g() * 90 * Math.min(2, r);
            let br = `M${x.toFixed(0)},${SURF} L${(x + (g() - 0.5) * 20).toFixed(0)},${(SURF - hgt).toFixed(0)}`;
            for (let b = 1; b <= 3; b++){ const yb = SURF - hgt * b / 4, sx = x + (g() - 0.5) * 10; br += ` M${sx.toFixed(0)},${yb.toFixed(0)} l${(b % 2 ? 1 : -1) * (14 + g() * 16)},${-(12 + g() * 14)}`; }
            extra += P(br, 'pl-dend');
          }
          for (let k = 0; k < 10; k++) extra += K.bubble(X0 + 60 + k * 100, SURF - 10, 6 + (k % 3) * 3, 300, 2.2 + (k % 3) * 0.4, k * 0.31);
        }
      }
      d += ` L${X1},${SURF} L${X1},${SURF + 6} L${X0},${SURF + 6} Z`;
      return P(d, 'f-cu2', tip(r < 0.5 ? '고르고 촘촘한 막' : r < 0.8 ? '튀어나온 곳이 조금씩 앞서 자란다' : r < 1 ? '노듈 — 튀어나온 곳이 이온을 먼저 잡는다' : '한계 초과 — 덴드라이트 · 가루 · 수소')) + extra;
    }
    function render(){
      const m = mult(st.a), delta = D0 / Math.sqrt(m), iL = N * F * D * st.c * 1000 / (delta * 1e-6) / 100;   // ASD
      const r = st.j / iL, cs = Math.max(0, 1 - r), top = SURF - delta * PXUM;
      // 확산층 띠와 괄호
      ctx.$('[data-v="dl"]').innerHTML = G(R(X0, top, X1 - X0, SURF - top, 'f-dl', tip(`확산층 δ ≈ ${delta.toFixed(0)} µm — 흐름이 거의 멎은 층`)) + P(`M${X0},${top} L${X1},${top}`, 's-dash'), K.on('diff'));
      ctx.$('[data-v="brk"]').innerHTML = G(LB(P(`M${X0 + 16},${top} l-10,0 l0,${SURF - top} l10,0`, 's-acc2') + T(X0 + 20, top + 30, `δ ≈ ${delta.toFixed(0)} µm`, 't-warn', 'start')), K.on('diff', 'surf')) +
        G(LB(T(X0 + 20, top + 30, `δ ≈ ${delta.toFixed(0)} µm`, 't-warn', 'start')), K.only('limit'));
      // 흐름과 이온
      let fl = '';
      for (let k = 0; k < 6; k++){ const y = 230 + k * (top - 290) / 5; if (y > top - 30) continue; fl += P(`M${X0 + 10},${y.toFixed(0)} C${X0 + 300},${(y - 30).toFixed(0)} ${X0 + 600},${(y + 30).toFixed(0)} ${X1 - 10},${y.toFixed(0)}`, 's-flow'); }
      ctx.$('[data-v="flow"]').innerHTML = G(fl, W2(K.on('bulk'), tip('대류 — 흐르는 액이 이온을 실어 나른다')));
      const g = rng(5);
      let io = '';
      for (let k = 0; k < 12; k++){ const y = 220 + g() * Math.max(20, top - 270); io += K.ionPath(`M${X0 + 20},${y.toFixed(0)} C${X0 + 350},${(y - 40).toFixed(0)} ${X0 + 700},${(y + 40).toFixed(0)} ${X1 - 20},${(y + 10).toFixed(0)}`, 'cu', 5 + g() * 3, g() * 6, null); }
      // 확산층 안: 아래로 느리게 (아래로 갈수록 드물다 — 표면 농도)
      let io2 = '';
      const nIn = Math.round(3 + 9 * (0.4 + 0.6 * cs));
      for (let k = 0; k < nIn; k++){ const x = X0 + 60 + g() * (X1 - X0 - 120); io2 += K.ionPath(`M${x.toFixed(0)},${(top + 6).toFixed(0)} L${(x + (g() - 0.5) * 60).toFixed(0)},${SURF - 18}`, 'cu', 4 + g() * 2.5, g() * 6); }
      ctx.$('[data-v="ions"]').innerHTML = G(io, K.on('bulk')) + G(io2, K.only('bulk diff limit'));
      // 표면 모양 (한계 단계에서만 위젯 값, 그 전에는 매끈)
      ctx.$('[data-v="metal"]').innerHTML = G(morph(r), K.only('limit')) + G(morph(0.2), K.on('bulk', 'limit'));
      // 농도 그래프
      const xs = GX0 + cs * (GX1 - GX0);
      let pf = P(`M${GX1},200 L${GX1},${top.toFixed(0)} L${xs.toFixed(0)},${SURF}`, 's-curve', tip('농도 — 벌크에서는 일정, 확산층 안에서 표면 쪽으로 줄어든다'));
      pf += L(GX0, top, GX1 + 10, top, 's-dash') + LB(T(GX1 + 6, top - 10, 'δ', 't-warn', 'end'));
      pf += C(xs, SURF, 8, cs <= 0 ? 'k-ng' : 'k-acc2') + LB(T(Math.max(GX0 + 70, xs), SURF - 20, cs <= 0 ? '표면 농도 0 — 한계' : `표면 ${Math.round(cs * 100)} %`, cs <= 0 ? 'pl-warn' : 't-warn', 'middle'));
      ctx.$('[data-v="prof"]').innerHTML = G(pf, K.on('diff'));
      const msg = r < 0.5 ? ['고운 막 — 공급에 여유가 충분합니다', 'k-ok'] : r < 0.8 ? ['주의 — 튀어나온 곳이 앞서 자라기 시작', 'k-warn'] : r < 1 ? ['거칠어짐 — 노듈이 생기기 쉬운 구간', 'k-warn'] : ['한계 초과 — 수소 · 가루 · 덴드라이트 (탄 도금)', 'k-ng'];
      ctx.$('[data-v="msg"]').innerHTML = G(R(X0 + 180, SURF - 88 - (r >= 1 ? 160 : 0), 600, 52, 'pl-box', {rx: 10}) + C(X0 + 212, SURF - 62 - (r >= 1 ? 160 : 0), 10, msg[1]) + T(X0 + 234, SURF - 54 - (r >= 1 ? 160 : 0), msg[0], 't-sub', 'start'), K.only('limit'));
      ctx.refresh();
      ctx.out('k-d', `${delta.toFixed(0)} µm`); ctx.out('k-il', iL.toFixed(1)); ctx.out('k-r', `${Math.round(r * 100)} %`); ctx.out('k-cs', `${Math.round(cs * 100)} %`);
      const kr = ctx.card.querySelector('[data-o="k-r"]').parentNode;
      kr.classList.toggle('ok', r < 0.5); kr.classList.toggle('warn', r >= 0.5 && r < 1); kr.classList.toggle('ng', r >= 1);
      ctx.q('[data-o=msg]').innerHTML = `${msg[0]}. 교반 ×${m.toFixed(2)} → δ ${delta.toFixed(0)} µm, 한계전류 ${iL.toFixed(1)} ASD. 실무에서는 한계보다 <b>충분히 낮게</b> 운전합니다.`;
    }
    const W2 = (...os) => Object.assign({}, ...os);
    ctx.range('a', v => { st.a = v; render(); return '×' + mult(v).toFixed(2); });
    ctx.range('j', v => { st.j = v; render(); return v.toFixed(1); });
    ctx.range('c', v => { st.c = v; render(); return v.toFixed(2); });
    // 손으로 움직이면 그 값을 그대로 둔다. 표면 모양이 보이도록 한계 단계로 (확산층 단계에서는 그대로)
    [ain, jin, ctx.card.querySelector('input[data-i=c]')].forEach(i => i.addEventListener('input', () => { touched = true; const sid = ctx.step(); if (sid && sid !== 'diff' && sid !== 'limit') ctx.go('limit'); }));
    ctx.demo = sid => {
      if (touched) return ctx.refresh();
      const j = DEMO[sid] || 5;
      jin.value = j; st.j = j; ctx.out('j', j.toFixed(1));
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['대류', '흐르는 액이 이온을 실어 나르는 것 (펌프 · 회전 · 패들)'],
      ['확산', '진한 곳에서 묽은 곳으로 저절로 퍼지는 것'],
      ['이동 (전기 이동)', '전기장이 이온을 끄는 것. 산이 많으면 전류 대부분을 H⁺가 나르고 Cu²⁺의 몫은 작다'],
      ['확산층 (δ)', '표면 앞에서 흐름이 거의 멎어 확산으로만 건너는 층. 교반이 셀수록 얇다'],
      ['전기이중층', '표면에 붙은 이온 · 물 분자의 수 nm 층. 전하 이동이 일어나는 곳'],
      ['한계전류밀도 (iL)', '표면 농도가 0이 될 때의 전류밀도. 공급이 낼 수 있는 최대 속도']
    ]) + K.field([
      '교반(흐름 · 회전 · 패들)이 달라지면 δ가 달라지고, 한계전류뿐 아니라 <b>합금 조성</b>(SnAg의 Ag)도 달라집니다 → <a data-go="chem.comp">10장</a>. 장비마다 흐름 방식이 다르면 같은 레시피도 결과가 다를 수 있습니다.',
      '온도가 오르면 확산이 빨라져 한계전류가 오르지만, 첨가제 분해 · 증발 · Sn 산화도 빨라집니다.',
      'PR 구멍 속은 <b>구멍 깊이만큼 확산 거리가 길어집니다</b>. 그래서 구멍이 가장 깊은 도금 초기가 가장 불리합니다 → <a data-go="pattern.deep">08장</a>.'
    ]) + K.deep(`<p>확산층을 건너는 이온의 흐름(픽의 법칙)과 전류는 같습니다:</p>
      ${K.eq('i = n·F·D·(C_bulk − C_surface) / δ   →   C_surface = 0 일 때 iL = n·F·D·C_bulk / δ')}
      <ul><li>예: Cu²⁺ 0.6 mol/L, D ≈ 7×10⁻¹⁰ m²/s, δ = 60 µm → iL ≈ 2 × 96485 × 7×10⁻¹⁰ × 600 / 6×10⁻⁵ ≈ 1,350 A/m² ≈ 13.5 ASD.</li>
      <li>δ는 흐름이 셀수록 얇아집니다. 회전 원판 전극(RDE)에서는 δ ∝ 1/√(회전 속도) — 그래서 위젯도 √로 줄였습니다.</li>
      <li>J/iL이 커질수록 튀어나온 곳(확산 거리가 짧은 곳)이 이온을 먼저 잡아 더 튀어나옵니다(불안정 성장). 노듈 · 덴드라이트가 생기는 이유입니다.</li>
      <li>산(지지 전해질)이 많으면 전기장에 끌려오는 몫(이동)이 작아져, 공급은 주로 확산 · 대류로 정해집니다.</li></ul>`);
  }
});
})();
