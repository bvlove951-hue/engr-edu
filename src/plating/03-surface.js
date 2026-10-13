/* 전해도금 03 — 이온이 오는 길: 이온은 어떻게 표면까지 올까 (표면 · 수십 µm) */
(function(){
const SURF = 1000, X0 = 40, X1 = 1090, PXUM = 4;       // 표면 y, 장면 가로 범위, 1 µm = 4 px
const GX0 = 1170, GX1 = 1520;                          // 농도 그래프 가로 (0 → 벌크 농도)
const D = 7e-10, F = 96485, N = 2, D0 = 60;            // 확산계수(m²/s, 묽은 용액 25 °C 예시), 교반 ×1일 때 확산층 60 µm (예시)
const DEMO = {bulk: 5, diff: 5, surf: 5, limit: 16};   // 손대지 않았을 때 단계마다 보여 줄 전류밀도
// 표면 모양 단계 (r = J / iL, 개념 예시): 고움 → 거칠어짐 → 덴드라이트(한계) → 가루 · 탄 도금(넘김, 수소 많이)
const STAGE = r => r < 0.7 ? 0 : r < 1 ? 1 : r < 1.3 ? 2 : 3;

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '03', id: 'surface', part: 1, short: '이온이 오는 길', scale: '표면 · 수십 µm',
  title: '이온이 오는 길 — 이온은 어떻게 표면까지 올까?',
  hook: '확산층이 공급의 상한을 정한다',
  one: '이온은 멀리서는 액의 흐름을 타고 오고, 표면 바로 앞 얇은 층에서는 주로 확산(진한 곳에서 묽은 곳으로 저절로 퍼지는 움직임)으로 건넙니다. 이 층이 얇을수록 이온이 빨리 도착합니다.',
  ana: '<b>공항 무빙워크</b>와 같습니다. 멀리서는 무빙워크(액의 흐름)가 이온을 실어 오고, 표면 앞 마지막 구간은 걸어서(확산) 갑니다. 교반을 세게 하면 무빙워크가 표면 가까이까지 늘어나 걷는 구간(확산층)이 짧아집니다. 전류를 올려 손님(이온)을 아무리 재촉해도, 걷는 구간(확산층)을 지나는 속도 이상으로는 도착하지 못합니다(한계전류). <i>(비유의 한계: 실제로는 무빙워크가 끝나는 선이 뚜렷하지 않고, 흐름이 표면에 가까울수록 점점 느려집니다. 확산층 두께 δ는 계산하기 쉽게 정한 "등가 두께"입니다.)</i>',
  steps: [
    {id: 'bulk', t: '대류 — 흐름이 실어 나른다', d: '펌프 · 웨이퍼 회전 · 패들로 섞인 액이 이온을 표면 가까이까지 실어 나릅니다. 여기서는 농도가 어디나 같습니다. 산이 많은 액에서 전기에 끌려오는 몫(이동)은 작습니다.'},
    {id: 'diff', t: '확산층 — 걸어서 건너는 구간', d: '표면 바로 앞(δ, 보통 10~100 µm)은 흐름이 점점 느려져 이온이 주로 확산으로 건넙니다. 표면이 이온을 쓰므로 표면 농도가 낮아지고, 그 기울기만큼 이온이 들어옵니다.'},
    {id: 'surf', t: '표면 — 전자를 받고 자리 찾기', d: '표면에 도착한 이온은 금속 바로 앞의 아주 얇은 층(약 1 nm)을 건너며 전자를 받습니다. 원자가 된 뒤에는 표면에서 조금 움직이다 자리 잡기 좋은 곳에 앉습니다.', view: {x: 524, y: 812, w: 560, h: 300}},
    {id: 'limit', t: '한계전류 — 더는 못 따라온다', d: '표면 농도가 0이 되면 공급이 더는 못 따라옵니다(한계전류). 정류기는 전류를 고정하므로 모자라는 몫은 수소가 가져가고 전압이 갑자기 오릅니다. 다가가면 먼저 거칠어지고, 한계에서는 나뭇가지 같은 덴드라이트, 넘기면 검은 가루 같은 "탄 도금"(불에 탄 게 아니라 전류가 너무 세서 생긴 막)이 됩니다.'}
  ],
  icon(K){
    const {R, P} = K;
    return R(2, 4, 62, 30, 'f-bath') + R(2, 34, 62, 18, 'f-dl') + R(2, 52, 62, 10, 'f-cu2') + P('M6,14 L58,14 M6,24 L58,24', 's-flow');
  },
  draw(K){
    const {R, C, P, T, G, LB, tip, only} = K;
    let s = '';
    s += R(X0, 120, X1 - X0, SURF - 120, 'f-bath', tip('도금액'));
    s += `<g data-v="dl"></g>`;                                          // 확산층 띠 (위젯이 그린다)
    s += `<g data-v="flow"></g><g data-v="ions"></g>`;
    s += R(X0, SURF - 14, X1 - X0, 14, 'pl-edl', tip('전기이중층 — 금속 바로 앞, 이온 · 물 분자가 늘어선 얇은 층 (실제는 약 1 nm — 그림은 크게 과장)'));
    s += `<g data-v="metal"></g>`;
    s += R(X0, SURF, X1 - X0, 120, 'f-cu2', tip('음극 표면 (금속)'));
    // 단계별 설명
    s += G(LB(T(X0 + 24, 168, '대류 — 흐름이 이온을 실어 나른다 (농도가 어디나 같다)', 't-acc', 'start') + T(X0 + 24, 200, '전기에 끌려오는 몫(이동)은 작다 — 산(H⁺ · 음이온)이 전류 대부분을 나른다', 't-dim', 'start')), only('bulk'));
    s += G(LB(T(X0 + 24, 168, '확산층 안에서는 주로 확산으로 — 진한 곳에서 묽은 곳으로', 't-acc', 'start') + T(X0 + 24, 200, '경계는 칼같이 나뉘지 않는다 — 흐름이 표면 쪽으로 점점 느려진다', 't-dim', 'start')), only('diff'));
    s += `<g data-v="brk"></g>`;
    // 표면 확대 (surf 단계) — x 530~1080, 글자는 확대에 맞춰 작게
    const AX = i => 532 + i * 23, ED = 12;                             // 위 계단은 ED번째 원자까지
    let z = '';
    for (let i = 0; i < 24; i++) z += C(AX(i), SURF + 14, 11.5, 'f-atom');
    for (let i = 0; i < ED; i++) z += C(AX(i) + 11, SURF - 8, 11.5, 'f-atom');
    const xi = AX(19), xk = AX(ED) + 11;
    z += `<circle r="11.5" class="f-atom2"><animateMotion dur="3.6s" repeatCount="indefinite" keyTimes="0;.35;.9;1" keyPoints="0;0;1;1" calcMode="linear" path="M${xi},${SURF - 8} L${xk},${SURF - 8}"/></circle>`;
    z += K.ionPath(`M${xi + 30},${SURF - 84} Q${xi - 14},${SURF - 50} ${xi},${SURF - 10}`, 'cu', 3.6, 0, null, false).replace('<animateMotion', '<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;.33;.36;1" dur="3.6s" repeatCount="indefinite"/><animateMotion keyTimes="0;.35;1" keyPoints="0;1;1" calcMode="linear"');
    for (const dx of [-1, 1]) z += `<circle r="6" class="k-e"><animateMotion dur="3.6s" repeatCount="indefinite" keyTimes="0;.33;1" keyPoints="0;1;1" calcMode="linear" path="M${xi + dx * 30},${SURF + 40} L${xi + dx * 6},${SURF - 6}"/></circle>`;
    // 설명 상자 (번호) + 장면 속 번호 표시 — 지시선이 글자를 가로지르지 않게
    z += R(536, 822, 404, 96, 'pl-box', {rx: 8});
    z += LB(T(548, 844, '① 아주 얇은 층(약 1 nm)을 건너며 전자 2개를 받는다', 'pl-zt', 'start') + T(548, 870, '② 원자가 된 뒤 표면에서 조금 움직인다', 'pl-zt', 'start') + T(548, 896, '③ 자리 잡기 좋은 곳(계단 모서리)에 앉는다', 'pl-zt', 'start'));
    z += LB(T(xi + 26, SURF - 40, '①', 'pl-zt', 'start') + T((xi + xk) / 2 + 20, SURF - 26, '②', 'pl-zt') + T(xk - 22, SURF - 26, '③', 'pl-zt'));
    z += LB(T(1076, SURF + 46, '↑ 이중층: 실제는 약 1 nm (크게 과장 · 실제 비율 아님)', 'pl-zt', 'end') + T(1076, SURF + 68, '확산층(수십 µm)보다 만 배 넘게 얇다', 'pl-zt', 'end'));
    s += G(z, only('surf'));
    // 오른쪽: 농도 그래프 (세로 = 표면에서의 거리, 무대와 같은 눈금)
    s += R(GX0 - 40, 120, GX1 - GX0 + 80, SURF - 120 + 110, 'pl-panel', {rx: 14});
    s += LB(T(GX0 - 20, 156, '이온 농도', 't-acc', 'start') + T(GX0 - 20, 184, '(무대와 같은 높이 눈금)', 't-dim', 'start'));
    s += K.L(GX0, 200, GX0, SURF, 's-axis') + K.L(GX0, SURF, GX1 + 10, SURF, 's-axis');
    s += LB(T(GX0, SURF + 36, '0', 't-dim') + T(GX1, SURF + 36, '벌크 농도', 't-dim') + T(GX0 + 10, SURF + 72, '표면', 't-dim', 'start'));
    s += `<g data-v="prof"></g>`;
    // 한계 단계: 모양 사다리 + 정전류에서 전류의 몫 (위젯이 그린다)
    s += `<g data-v="lad"></g><g data-v="share"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 공급의 상한</div>
      ${K.ctl('a', '교반 세기 (흐름 · 회전)', 0, 99, 1, 33)}${K.ctl('j', '전류밀도 (ASD)', 1, 40, 0.5, 5)}${K.ctl('c', 'Cu²⁺ 농도 (mol/L, 예시)', 0.2, 1.0, 0.05, 0.6)}
      ${K.kpis([['확산층 δ', 'k-d', ''], ['한계전류', 'k-il', 'ASD'], ['J / 한계', 'k-r', ''], ['표면 농도', 'k-cs', '멀리 있는 액(벌크) 대비']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('δ = 60 µm / √(교반 배수), iL = n·F·D·C / δ, D = 7×10⁻¹⁰ m²/s (묽은 용액 25 °C 예시 · 실제 도금액은 5~7×10⁻¹⁰). 0.6 mol/L · δ 60 µm면 iL ≈ 13.5 ASD — 이 예시 조건에서 약 10~14 ASD입니다. 모양이 바뀌는 경계(J/iL 0.7 · 1 · 1.3)도 개념 예시이고, 실제 δ는 장비 · 흐름 방식 · 위치마다 다릅니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip, rng} = K;
    let touched = false;
    const st = {a: 33, j: 5, c: 0.6};
    const ain = ctx.card.querySelector('input[data-i=a]'), jin = ctx.card.querySelector('input[data-i=j]');
    const mult = v => 0.25 * Math.pow(64, v / 99);                   // 교반 배수 ×0.25 ~ ×16 (기본 33 → ×1)
    // 작은 그림: 모양 단계 k (0 고움 · 1 거칠어짐 · 2 덴드라이트 · 3 가루 · 탄 도금), 바닥 y, 가로 x0~x1, 크기 sc
    function shape(k, x0, x1, y, sc, seed){
      const g = rng(seed);
      let d = `M${x0},${y}`, extra = '';
      if (k === 0){ for (let x = x0; x <= x1; x += 30 * sc) d += ` L${x.toFixed(0)},${(y - (1.5 + g() * 2) * sc).toFixed(1)}`; }
      else if (k === 1){ for (let x = x0; x <= x1 - 30 * sc; x += 30 * sc){ const hh = (10 + g() * 14) * sc; d += ` L${x.toFixed(0)},${y} Q${(x + 15 * sc).toFixed(0)},${(y - hh * 1.6).toFixed(1)} ${(x + 30 * sc).toFixed(0)},${y}`; } }
      else {
        for (let x = x0; x <= x1 - 24 * sc; x += 24 * sc){ const hh = (6 + g() * 8) * sc; d += ` L${x.toFixed(0)},${y} Q${(x + 12 * sc).toFixed(0)},${(y - hh).toFixed(1)} ${(x + 24 * sc).toFixed(0)},${y}`; }
        if (k === 2){
          const n = Math.max(3, Math.round((x1 - x0) / (80 * sc)));
          for (let i = 0; i < n; i++){
            const x = x0 + (i + 0.5) * (x1 - x0) / n + (g() - 0.5) * 20 * sc, hgt = (70 + g() * 90) * sc;
            let br = `M${x.toFixed(0)},${y} L${(x + (g() - 0.5) * 20 * sc).toFixed(0)},${(y - hgt).toFixed(0)}`;
            for (let b = 1; b <= 3; b++){ const yb = y - hgt * b / 4, sx = x + (g() - 0.5) * 10 * sc; br += ` M${sx.toFixed(0)},${yb.toFixed(0)} l${((b % 2 ? 1 : -1) * (14 + g() * 16) * sc).toFixed(0)},${(-(12 + g() * 14) * sc).toFixed(0)}`; }
            extra += P(br, sc < 1 ? 'pl-dend p03-thin' : 'pl-dend');
          }
        } else {
          // 가루 · 탄 도금: 검고 푸석한 알갱이 더미
          const n = Math.round((x1 - x0) / (5 * sc));
          for (let i = 0; i < n; i++){ const x = x0 + g() * (x1 - x0), hgt = g() * g() * 70 * sc; extra += C(x, y - 3 * sc - hgt, (2.5 + g() * 3.5) * sc, 'p03-pow'); }
        }
      }
      d += ` L${x1},${y} L${x1},${y + 6} L${x0},${y + 6} Z`;
      return P(d, k === 3 ? 'p03-pow' : 'f-cu2') + extra;
    }
    const NAME = ['고르고 촘촘한 막', '거칠어짐 — 울퉁불퉁 · 무광', '덴드라이트 — 나뭇가지처럼 뻗는다', '가루 · 탄 도금 — 수소가 많이 나온다'];
    function morph(r){
      const k = STAGE(r);
      // 0.7~0.85 는 조금, 0.85~1 은 더 거칠게 (같은 '거칠어짐' 단계 안에서)
      let out = k === 1 && r < 0.85 ? shape(1, X0, X1, SURF, 0.45 + (r - 0.7) / 0.15 * 0.4, 11) : shape(k, X0, X1, SURF, 1, 11);
      if (k >= 2) for (let i = 0; i < (k === 3 ? 18 : 8); i++) out += K.bubble(X0 + 40 + i * (k === 3 ? 58 : 130), SURF - 10, 5 + (i % 3) * 3, 300, 2.0 + (i % 3) * 0.4, i * 0.27);
      return G(out, tip(NAME[k]));
    }
    function render(){
      const m = mult(st.a), delta = D0 / Math.sqrt(m), iL = N * F * D * st.c * 1000 / (delta * 1e-6) / 100;   // ASD
      const r = Math.round(st.j / iL * 100) / 100, cs = Math.max(0, 1 - r), top = SURF - delta * PXUM, k = STAGE(r);
      // 확산층 띠와 괄호. 띠 안의 흐름은 표면 쪽으로 갈수록 느리고 흐리다
      let slow = '';
      [[0.25, 'p03-s1'], [0.55, 'p03-s2']].forEach(([f, c]) => { const y = top + f * (SURF - top); slow += P(`M${X0 + 10},${y.toFixed(0)} C${X0 + 300},${(y - 12).toFixed(0)} ${X0 + 600},${(y + 12).toFixed(0)} ${X1 - 10},${y.toFixed(0)}`, 's-flow ' + c); });
      ctx.$('[data-v="dl"]').innerHTML = G(R(X0, top, X1 - X0, SURF - top, 'f-dl', tip(`확산층 δ ≈ ${delta.toFixed(0)} µm — 흐름이 표면 쪽으로 점점 느려져 주로 확산으로 건너는 층`)) + P(`M${X0},${top} L${X1},${top}`, 's-dash') + slow, K.on('diff'));
      ctx.$('[data-v="brk"]').innerHTML = G(LB(P(`M${X0 + 16},${top} l-10,0 l0,${SURF - top} l10,0`, 's-acc2') + T(X0 + 20, top + 30, `δ ≈ ${delta.toFixed(0)} µm (등가 두께)`, 't-warn', 'start')), K.on('diff', 'surf')) +
        G(LB(T(X0 + 20, top + 30, `δ ≈ ${delta.toFixed(0)} µm`, 't-warn', 'start')), K.only('limit'));
      // 흐름과 이온
      let fl = '';
      for (let q = 0; q < 6; q++){ const y = 230 + q * (top - 290) / 5; if (y > top - 30) continue; fl += P(`M${X0 + 10},${y.toFixed(0)} C${X0 + 300},${(y - 30).toFixed(0)} ${X0 + 600},${(y + 30).toFixed(0)} ${X1 - 10},${y.toFixed(0)}`, 's-flow'); }
      ctx.$('[data-v="flow"]').innerHTML = G(fl, Object.assign(K.on('bulk'), tip('대류 — 흐르는 액이 이온을 실어 나른다')));
      const g = rng(5);
      let io = '';
      for (let q = 0; q < 12; q++){ const y = 220 + g() * Math.max(20, top - 270); io += K.ionPath(`M${X0 + 20},${y.toFixed(0)} C${X0 + 350},${(y - 40).toFixed(0)} ${X0 + 700},${(y + 40).toFixed(0)} ${X1 - 20},${(y + 10).toFixed(0)}`, 'cu', 5 + g() * 3, g() * 6, null); }
      // 확산층 안: 아래로 느리게 (아래로 갈수록 드물다 — 표면 농도)
      let io2 = '';
      const nIn = Math.round(3 + 9 * (0.4 + 0.6 * cs));
      for (let q = 0; q < nIn; q++){ const x = X0 + 60 + g() * (X1 - X0 - 120); io2 += K.ionPath(`M${x.toFixed(0)},${(top + 6).toFixed(0)} Q${(x + (g() - 0.5) * 90).toFixed(0)},${((top + SURF) / 2).toFixed(0)} ${(x + (g() - 0.5) * 60).toFixed(0)},${SURF - 18}`, 'cu', 4 + g() * 2.5, g() * 6); }
      ctx.$('[data-v="ions"]').innerHTML = G(io, K.on('bulk')) + G(io2, K.only('bulk diff limit'));
      // 표면 모양 (한계 단계에서만 위젯 값, 그 전에는 매끈)
      ctx.$('[data-v="metal"]').innerHTML = G(morph(r), K.only('limit')) + G(morph(0.2), K.on('bulk', 'limit'));
      // 농도 그래프 — C_표면 = C_액 × (1 − J/iL)
      const xs = GX0 + cs * (GX1 - GX0);
      let pf = P(`M${GX1},200 L${GX1},${top.toFixed(0)} L${xs.toFixed(0)},${SURF}`, 's-curve', tip('농도 — 벌크에서는 일정, 확산층 안에서 표면 쪽으로 줄어든다.\n표면 농도 = 벌크 × (1 − J/한계)'));
      pf += L(GX0, top, GX1 + 10, top, 's-dash') + LB(T(GX1 + 6, top - 10, 'δ', 't-warn', 'end'));
      pf += C(xs, SURF, 8, cs <= 0 ? 'k-ng' : 'k-acc2') + LB(T(GX1 + 30, SURF + 72, cs <= 0 ? '표면 농도 0 — 한계' : `표면 ${Math.round(cs * 100)} %`, cs <= 0 ? 'pl-warn' : 't-warn', 'end'));
      // 대류 단계에서만: 흐름이 섞는 구역은 농도가 어디나 같다 (평평한 선). 확산층 단계부터는 아래 곡선
      const flat = P(`M${GX1},200 L${GX1},${SURF}`, 's-curve', tip('대류 구역의 농도 — 흐름이 섞어 어디나 같다.\n표면 바로 앞에서 줄어드는 모습은 다음 단계(확산층)에서')) + LB(T(GX1 - 14, 600, '어디나 같은 농도', 't-warn', 'end'));
      ctx.$('[data-v="prof"]').innerHTML = G(flat, K.on('bulk', 'diff')) + G(pf, K.on('diff'));
      // 한계 단계 ①: 모양 사다리 — 지금 어디인지 강조
      const TW = 240, TX = q => 70 + q * (TW + 10);
      const LAD = [['고운 막', 'J/한계 < 0.7'], ['거칠어짐 (무광)', '0.7 ~ 1 · 다가감'], ['덴드라이트', '≈ 1 ~ 1.3 · 한계'], ['가루 · 탄 도금', '> 1.3 · 수소 많이']];
      let ld = R(56, 128, 1020, 222, 'p03-pan', {rx: 12}) + T(72, 160, '한계에 가까워질수록 모양이 이렇게 바뀐다 (J / 한계, 개념 예시)', 't-acc', 'start');
      LAD.forEach(([nm, rg], q) => {
        const x = TX(q);
        ld += R(x, 174, TW, 160, q === k ? 'pl-hlbox' : 'pl-lane', {rx: 10});
        ld += T(x + TW / 2, 202, nm, q === k ? 't-warn' : 't-sub') + T(x + TW / 2, 228, rg, 't-dim');
        ld += `<clipPath id="pl3-t${q}"><rect x="${x + 4}" y="236" width="${TW - 8}" height="94"/></clipPath>`;
        ld += G(R(x + 4, 312, TW - 8, 18, 'f-cu2') + shape(q, x + 4, x + TW - 4, 312, 0.42, 20 + q) + (q === 3 ? [0, 1, 2, 3, 4].map(i => C(x + 30 + i * 46, 270 - (i % 2) * 22, 5 + (i % 3) * 2, 'pl-bub')).join('') : ''), {'clip-path': `url(#pl3-t${q})`});
      });
      ctx.$('[data-v="lad"]').innerHTML = G(ld, K.only('limit'));
      // 한계 단계 ②: 정전류 — 흘린 전류 가운데 Cu 몫과 수소 몫
      const BX0 = 76, BX1 = 1050, jmax = Math.max(st.j, iL) * 1.25, bx = v => BX0 + v / jmax * (BX1 - BX0);
      const cu = Math.min(st.j, iL), h2 = Math.max(0, st.j - iL);
      let sh = R(56, 350, 1020, 170, 'p03-pan', {rx: 12}) + T(72, 384, '정류기는 전류를 고정한다 — 흘린 전류의 몫', 't-acc', 'start');
      sh += R(BX0, 398, bx(cu) - BX0, 36, 'p03-cu', tip('Cu를 쌓는 몫 — 한계전류보다 클 수 없다'));
      if (h2 > 0) sh += R(bx(cu), 398, bx(st.j) - bx(cu), 36, 'p03-h2', tip('모자라는 몫 — 수소 발생이 가져간다. 전압이 갑자기 오른다'));
      if (bx(cu) - BX0 > 90) sh += T((BX0 + bx(cu)) / 2, 423, 'Cu 몫', 'p03-bt');
      if (h2 > 0 && bx(st.j) - bx(cu) > 70) sh += T((bx(cu) + bx(st.j)) / 2, 423, '수소', 't-sub');
      sh += L(bx(iL), 390, bx(iL), 442, 'p03-il') + T(bx(iL), 466, `한계 ${iL.toFixed(1)} ASD`, 't-warn');
      const smsg = r < 0.7 ? `J ${st.j.toFixed(1)} ASD — 전부 Cu. 공급에 여유가 충분합니다` : r < 1 ? `J ${st.j.toFixed(1)} ASD — 아직 전부 Cu지만 표면 농도가 낮아 거칠어지기 시작` : `J ${st.j.toFixed(1)} ASD — Cu ${Math.round(cu / st.j * 100)} % · 수소 ${Math.round(h2 / st.j * 100)} % · 전압이 갑자기 오른다`;
      sh += T(72, 504, smsg, r >= 1 ? 'pl-warn' : 't-sub', 'start');
      ctx.$('[data-v="share"]').innerHTML = G(sh, K.only('limit'));
      ctx.refresh();
      ctx.out('k-d', `${delta.toFixed(0)} µm`); ctx.out('k-il', iL.toFixed(1)); ctx.out('k-r', `${Math.round(r * 100)} %`); ctx.out('k-cs', `${Math.round(cs * 100)} %`);
      const kr = ctx.card.querySelector('[data-o="k-r"]').parentNode;
      kr.classList.toggle('ok', r < 0.7); kr.classList.toggle('warn', r >= 0.7 && r < 1); kr.classList.toggle('ng', r >= 1);
      const msg = ['고운 막 — 공급에 여유가 충분합니다', '거칠어짐 — 한계에 다가가며 울퉁불퉁 · 무광', '한계 — 모자라는 몫은 수소, 전압이 오르고 덴드라이트', '한계를 넘김 — 수소가 많이 나오고 가루 · 탄 도금'][k];
      ctx.q('[data-o=msg]').innerHTML = `${msg}. 교반 ×${m.toFixed(2)} → δ ${delta.toFixed(0)} µm, 한계전류 ${iL.toFixed(1)} ASD. 실무에서는 한계보다 <b>충분히 낮게</b> 운전합니다.`;
    }
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
      ['벌크', '표면에서 멀리 떨어진, 잘 섞인 액. 농도가 어디나 같다'],
      ['대류', '흐르는 액이 이온을 실어 나르는 것 (펌프 · 회전 · 패들)'],
      ['확산', '진한 곳에서 묽은 곳으로 저절로 퍼지는 움직임'],
      ['이동 (전기 이동)', '전기장이 이온을 끄는 것. 산이 많으면 전류 대부분을 H⁺ · 음이온이 나르고 Cu²⁺의 몫은 작다'],
      ['확산층 (δ)', '표면 앞에서 흐름이 점점 느려져 주로 확산으로 건너는 층. 보통 10~100 µm, 교반이 셀수록 얇다'],
      ['전기이중층', '금속 바로 앞, 이온 · 물 분자가 늘어선 약 1 nm 층. 전자를 주고받는 곳'],
      ['한계전류밀도 (iL)', '표면 농도가 0이 될 때의 전류밀도. 공급이 낼 수 있는 최대 속도 (이 장의 예시 조건에서 약 10~14 ASD)'],
      ['덴드라이트 · 노듈', '덴드라이트 = 나뭇가지처럼 뻗은 석출(한계에서). 노듈 = 표면의 작은 혹 — 현장에서는 액 속 입자가 씨앗인 경우가 많다']
    ]) + K.field([
      '교반(흐름 · 회전 · 패들)이 달라지면 δ가 달라지고, 한계전류뿐 아니라 <b>합금 조성</b>(SnAg의 Ag)도 달라집니다 → <a data-go="chem.comp">10장</a>. 장비마다 흐름 방식이 다르면 같은 레시피도 결과가 다를 수 있습니다.',
      '정류기는 전류를 고정하므로 한계를 넘기면 <b>전압이 갑자기 오릅니다</b>. 같은 레시피에서 전압이 튀거나 표면이 무광 · 거칠어지면 교반(유량 · 회전) · Cu 농도 · 온도부터 확인합니다. 거칠어짐은 한계보다 꽤 아래서 시작될 수 있어 보통 한계보다 충분히 낮게 운전합니다.',
      '노듈(혹)은 전류가 높아서도 생기지만, 현장에서는 양극(애노드, +) 찌꺼기나 필터 문제로 생긴 <b>액 속 입자</b>가 씨앗인 경우가 많습니다 → <a data-go="defects.surf">12장</a>.',
      '온도가 1 °C 오르면 확산계수 D(이온이 퍼지는 빠르기)가 약 2~3 % 커져 한계전류가 오르지만, 첨가제 분해 · 증발 · Sn 산화도 빨라집니다.',
      'PR 구멍 속은 <b>구멍 깊이만큼 확산 거리가 길어집니다</b>. 그래서 구멍이 가장 깊은 도금 초기가 가장 불리합니다 → <a data-go="pattern.deep">08장</a>.'
    ]) + K.deep(`<p>확산층을 건너는 이온의 흐름(픽의 법칙)과 전류는 같습니다:</p>
      ${K.eq('i = n·F·D·(C_액 − C_표면) / δ')}${K.eq('C_표면 = 0 → iL = n·F·D·C_액 / δ')}
      ${K.eq('C_표면 = C_액 × (1 − i / iL)')}
      <ul><li>전류를 한계의 절반으로 흘리면 표면 농도는 액의 절반입니다. 위젯의 '표면 농도'가 이 식입니다.</li>
      <li>예: Cu²⁺ 0.6 mol/L, D = 7×10⁻¹⁰ m²/s(묽은 용액 25 °C 예시), δ = 60 µm → iL ≈ 2 × 96485 × 7×10⁻¹⁰ × 600 / 6×10⁻⁵ ≈ 1,350 A/m² ≈ 13.5 ASD. 실제 도금액은 진하고 끈적해 D가 5~7×10⁻¹⁰이라, 이 예시 조건에서 약 10~14 ASD입니다. δ가 20 µm면 약 40 ASD, 10 µm면 약 80 ASD(D 7×10⁻¹⁰).</li>
      <li><b>δ와 교반</b> — 회전 원판 전극(RDE)에서는 δ ≈ 1.61·D^⅓·ν^⅙·ω^−½, 즉 회전 속도의 제곱근에 반비례합니다(예: 100 rpm 약 44 µm, 1000 rpm 약 14 µm). 그래서 위젯도 √로 줄였습니다. 첨가제 분석(CVS)도 이 전극을 씁니다(→ <a data-go="bath.ana">11장</a>). 아주 세게 돌려도 δ는 수 µm보다 얇아지기 어렵습니다.</li>
      <li><b>Cu²⁺는 전자 2개를 한꺼번에 받지 않습니다</b> — 먼저 1개를 받아 Cu⁺가 되고(느린 단계), 다시 1개를 받아 Cu가 됩니다. 원자가 된 뒤에는 평평한 면(테라스)을 옮겨 다니다 계단을 만나고, 계단이 꺾인 자리(킹크)에 앉습니다 — 이웃이 가장 많아 가장 안정한 자리입니다(→ <a data-go="grain.nuc">06장</a>).</li>
      <li><b>전기이중층</b>은 진한 액에서 약 1 nm 이하(물 분자 몇 개 두께)로, 확산층보다 만~십만 배 얇습니다. 이 얇은 층에 수백 mV가 걸려 전기장이 아주 세고, 이 센 전기장이 전자를 건네는 반응을 밀어 줍니다(→ <a data-go="overpot">04장</a>).</li>
      <li><b>지지 전해질</b> — 액 속(벌크)에서 전류를 주로 나르는 것은 H⁺와 음이온입니다. 하지만 표면에서 전자를 받는 것은 Cu²⁺입니다. H⁺는 표면에 와도 (수소가 나오기 전까지는) 반응하지 않고, 표면 쪽 순 흐름은 거의 0입니다. 이렇게 전류를 대신 날라 주는 이온(여기서는 황산)을 지지 전해질이라 하고, 산이 많을수록 Cu²⁺가 끌려오는 몫(이동)은 작습니다. 산이 적고 Cu가 많은 액에서는 그 몫이 무시할 만큼 작지 않아 한계전류를 조금 키웁니다.</li>
      <li><b>고속 도금액</b>은 Cu를 높이고 산을 낮춘 경우가 많습니다. 한계전류가 농도에 비례하니 같은 교반에서 더 빨리 쌓을 수 있기 때문입니다(산이 많으면 녹일 수 있는 Cu도 줄어듭니다). 대신 전도도가 낮아집니다.</li>
      <li><b>큰 모양 vs 작은 모양</b> — 확산층보다 훨씬 큰 높낮이(웨이퍼 두께 분포, mm 이상)는 전기 저항과 분극이 정하고(→ 07장), 확산층과 비슷하거나 작은 높낮이(범프 윗면 굴곡 · 거칠기)는 공급과 첨가제가 정합니다(→ 05 · 08장).</li>
      <li>J/iL이 커질수록 튀어나온 곳(확산 거리가 짧은 곳)이 이온을 먼저 잡아 더 튀어나옵니다(불안정 성장). 그래서 한계에 다가가면 거칠어지고, 한계에서 덴드라이트가 뻗습니다.</li>
      <li>헐셀 — 비스듬한 판 하나에 낮은~높은 전류밀도가 한 번에 걸려, 탄 자리 · 무광 자리로 액 상태를 눈으로 빠르게 보는 시험입니다(일반 도금에서 널리 쓰고, 웨이퍼 라인에서는 보조 도구).</li></ul>`);
  },
  css: `.pl-svg .p03-thin{stroke-width:2.6}
.pl-svg .p03-s1{opacity:.5;animation-duration:2.2s}
.pl-svg .p03-s2{opacity:.28;animation-duration:4.5s}
.p03-cu{fill:#d4874a;stroke:#f3b07a;stroke-width:1}
.p03-pan{fill:#060c18;stroke:rgba(148,163,184,.3);stroke-width:1.2}
.p03-pow{fill:#4a2f1f;stroke:#a0703f;stroke-width:1}
.p03-h2{fill:rgba(226,232,240,.30);stroke:#e2e8f0;stroke-width:1.4;stroke-dasharray:6 4}
.p03-il{stroke:#fbbf24;stroke-width:3;stroke-dasharray:6 5}
.pl-svg .p03-bt{font-size:19px;font-weight:800;fill:#0b1222 !important;stroke:none !important;text-anchor:middle}`
});
})();
