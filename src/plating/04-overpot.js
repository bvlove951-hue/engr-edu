/* 전해도금 04 — 과전압: 얼마나 세게 밀어야 할까? (분극 곡선 · 기울기와 균일도) */
(function(){
const GX0 = 130, GX1 = 1040, GY0 = 800, GY1 = 170, EMAX = 0.6, IMAX = 1.75;   // 그래프 영역, 과전압 0~600 mV, 전류 0~1.75 iL
const gx = e => GX0 + e / EMAX * (GX1 - GX0), gy = i => GY0 - Math.min(i, IMAX) / IMAX * (GY0 - GY1);
// 개념 모델 — 곡선 세 가지 (b: 기울기, i0: 교환전류, rf: 억제막이 더하는 표면 저항 몫)
//  none: 억제제 없음 · sup: 억제제 있음(옮겨지고 눕는다) · shift: 가상 — 모양 그대로 옆으로만 옮김(기울기 = none)
const CV = {
  none: {b: 0.045, i0: 0.012, rf: 0, nm: '억제제 없음'},
  sup: {b: 0.052, i0: 0.006, rf: 0.13, nm: '억제제 있음'},
  shift: {b: 0.045, i0: 0.012, rf: 0, dx: 0.132, nm: '옮기기만 (가상)'}       // none 곡선을 그대로 dx 만큼 옆으로
};
const R1 = 0.1, R2 = 0.3;                                   // 두 길의 액 저항 (짧은 길 : 긴 길 = 1 : 3, 상대값)
// 반응 속도(버틀러-볼머, 양쪽 항) + 공급 한계(1/i = 1/ik + 1/iL)를 합친 곡선의 역함수: 금속 전류 i → 필요한 과전압
function etaOf(i, c, iL){ const ik = i / (1 - i / iL); return c.b * Math.asinh(ik / (2 * c.i0)) + c.rf * i + (c.dx || 0); }
// 과전압 e(+ 길의 액 저항 R) → 금속 전류 (이분법)
function imOf(e, c, iL, R = 0){
  if (e <= (c.dx || 0)) return 0;
  let lo = 0, hi = iL * (1 - 1e-9);
  for (let k = 0; k < 46; k++){ const m = (lo + hi) / 2; if (etaOf(m, c, iL) + m * R > e) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
const ihOf = e => 0.002 * Math.exp((e - 0.42) / 0.04);      // 수소 발생 전류 (따로 더한다)
function model(e, c, iL){ const im = imOf(e, c, iL), ih = ihOf(e); return {im, ih, i: im + ih, iL}; }
function zone(r){ return r.ih > 0.08 * r.i && r.ih > 0.01 * r.iL ? 3 : r.im > 0.93 * r.iL ? 2 : r.im > 0.7 * r.iL ? 1 : 0; }
// 두 길(짧은 길 · 긴 길)에 같은 전압을 걸고, 평균 금속 전류가 i 가 되게 나눈다 → [짧은 길, 긴 길]
function split(i, c, iL){
  let lo = 0, hi = 4;
  for (let k = 0; k < 46; k++){ const V = (lo + hi) / 2; if ((imOf(V, c, iL, R1) + imOf(V, c, iL, R2)) / 2 > i) hi = V; else lo = V; }
  const V = (lo + hi) / 2;
  return [imOf(V, c, iL, R1), imOf(V, c, iL, R2)];
}
const ZN = [
  {t: '① 반응 지배', d: '미는 만큼 전류가 는다(처음엔 비례, 수십 mV를 넘으면 지수적으로 — 타펠). 공급에 여유가 있어 막이 고르고 촘촘하다', c: 'k-ok'},
  {t: '② 한계 근처', d: '공급이 슬슬 모자란다. 튀어나온 곳이 이온을 먼저 잡아 거칠어지기 시작한다(무광 · 울퉁불퉁)', c: 'k-warn'},
  {t: '③ 공급 한계', d: '물질전달 지배. 더 밀어도 금속 전류가 늘지 않는다(한계전류). 튀어나온 곳만 자라 덴드라이트(나뭇가지)가 된다', c: 'k-ng'},
  {t: '④ 수소 발생', d: '금속은 한계만큼만 쌓이고 남는 전류로 수소가 함께 나온다 → 효율↓ · 가루(탄 도금) · 핀홀 · 피트', c: 'k-ng'}
];
// 발표 모드 · 손대기 전: 단계마다 보여 줄 [과전압, 억제제]
const DEMO = {eq: [0, 'none'], kin: [0.16, 'none'], mt: [0.4, 'none'], h2: [0.59, 'none'], slope: [0.3, 'sup']};

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '04', id: 'overpot', part: 1, short: '과전압', scale: '분극 곡선',
  title: '과전압 — 얼마나 세게 밀어야 할까?',
  hook: '미는 힘과 흐르는 양의 관계',
  one: '금속을 쌓으려면 전류가 0일 때의 제자리 전압(평형 전위)보다 조금 더 걸어 줘야 합니다 — 이 "더 건 만큼"이 과전압입니다. 더 걸수록 빨리 쌓이지만 이온 공급이 바닥나면 멈추고, 남는 몫은 물(수소)이 가져갑니다. 이 관계를 그린 그래프가 분극 곡선입니다.',
  ana: '<b>웃돈</b> — 과전압은 창구에 얹는 웃돈입니다. 얹을수록 빨리 처리되지만(반응 지배), 창고(이온 공급)가 비면 더 얹어도 소용없고(한계전류), 그래도 더 얹으면 다른 손님(수소)이 그 몫을 가져갑니다. <i>한계</i>: 미는 힘은 이온을 표면으로 끌어오지 않습니다. 이미 도착한 이온이 전자를 받도록 재촉할 뿐이고, 이온이 오는 속도는 흐름 · 확산이 정합니다(03장).',
  steps: [
    {id: 'eq', t: '평형 — 제자리 전압에서 오가는 양이 같다', d: '전류가 0이면 전극은 평형 전위라는 제자리 전압에 머뭅니다(0 V가 아닙니다). 녹는 반응과 쌓이는 반응이 같은 속도로 오가 겉보기 변화가 없습니다(교환전류). 다만 실제 얇은 Cu 시드는 산성 액에서 조금씩 녹으므로, 전류를 건 채 넣습니다(핫 엔트리).'},
    {id: 'kin', t: '반응 지배 — 처음엔 비례, 곧 지수적으로', d: '아주 조금 밀 때(수 mV)는 전류가 미는 만큼 비례해서 늡니다. 수십 mV를 넘게 밀면 지수적으로 늡니다(타펠 구역). 결정이 가장 고운 곳은 충분히 세게 밀되 한계전류와는 거리를 둔 곳이고, 너무 약하게 밀면 씨앗이 적어 결정이 굵어집니다.'},
    {id: 'mt', t: '물질전달 지배 — 공급 한계', d: '더 밀어도 확산층이 실어 오는 만큼만 흐릅니다(한계전류). 한계에 다가가면 먼저 거칠어지고(무광 · 울퉁불퉁), 한계에서는 튀어나온 곳만 이온을 잡아 나뭇가지(덴드라이트)처럼 자랍니다.'},
    {id: 'h2', t: '수소 발생 — 함께 일어나는 반응', d: '한계를 넘겨 밀면 금속은 한계만큼만 쌓이고, 남는 전류로 물(H⁺)이 함께 반응해 수소 거품이 나옵니다. 효율이 떨어지고 표면 pH가 오르며, 거품 자리에 핀홀 · 피트, 심하면 가루 · 탄 도금이 생깁니다. Ni는 평소에도 수소가 조금 함께 나옵니다.'},
    {id: 'slope', t: '기울기 — 고르게 퍼지는 이유', d: '균일도는 곡선의 기울기가 정합니다. 전류를 조금 더 흘리려면 훨씬 더 밀어야 하는(완만한) 곡선일수록, 전류가 저항이 작은 길(가장자리 · 튀어나온 곳)로 쏠리지 않습니다. 모양 그대로 옆으로 옮기기만 하면 쏠림은 그대로입니다.'}
  ],
  icon(K){
    const {P} = K;
    return P('M4,58 L64,58 M4,58 L4,4', 's-axis') + P('M6,56 C22,54 26,20 38,18 L52,18 C56,18 58,10 62,4', 's-curve');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, TT, tip, only, on, W, wrap} = K;
    let s = '';
    s += R(60, 120, 1020, 1000, 'pl-panel', {rx: 16});
    s += `<g data-v="zones"></g>`;
    // 축과 눈금
    s += L(GX0, GY0, GX1 + 10, GY0, 's-axis') + L(GX0, GY0, GX0, GY1 - 20, 's-axis');
    for (let e = 0; e <= EMAX + 1e-9; e += 0.1) s += L(gx(e), GY0, gx(e), GY0 + 8, 's-axis') + T(gx(e), GY0 + 32, `${Math.round(e * 1000)}`, 't-dim');
    s += LB(T((GX0 + GX1) / 2, GY0 + 66, 'Cu 반응의 과전압 — 음극 쪽으로 민 정도 (mV) →', 't-sub'));
    s += LB(T(GX0 - 24, GY1 - 34, '↑ 전류밀도 (석출 속도)', 't-sub', 'start'));
    // 평형: 가로축 0 = 평형 전위
    s += G(LB(K.lead(GX0, GY0, GX0 + 40, 300, 'η = 0 → 평형 전위 (전류 0 · 0 V가 아님)', 'start', 't-warn')), only('eq'));
    s += `<g data-v="curves"></g><g data-v="dot"></g>`;
    // 아래: 구역별 막 모양
    const MX = [90, 335, 580, 825], MW = 230, BY = 1062;
    const MT = ['① 반응 지배', '② 한계 근처', '③ 공급 한계', '④ 수소 발생'], MS = ['고르고 촘촘', '거칠어지기 시작', '덴드라이트(나뭇가지)', '가루(탄 도금) · 핀홀'];
    MX.forEach((x, k) => {
      let g = R(x, 888, MW, 222, 'pl-box', {rx: 12, 'data-v': 'mbox' + k}) + T(x + 12, 918, MT[k], 't-sub', 'start') + T(x + 12, 946, MS[k], 't-dim', 'start');
      g += R(x + 14, BY, MW - 28, 34, 'f-si');
      if (k === 0){ for (let i = 0; i < 16; i++) g += R(x + 14 + i * 12.6, BY - 34, 12, 34, 'f-cu2'); }
      if (k === 1){ let d = `M${x + 14},${BY}`; for (let i = 0; i <= 10; i++) d += ` L${x + 14 + i * 20.2},${BY - 34 - (i % 2 ? 9 : 0) - (i % 3 === 0 ? 5 : 0)}`; g += P(d + ` L${x + MW - 14},${BY} Z`, 'f-cu2'); }
      if (k === 2){
        g += R(x + 14, BY - 14, MW - 28, 14, 'f-cu2');
        // 나뭇가지: 줄기 + 곁가지
        [[44, 70], [100, 82], [158, 66]].forEach(([cx, hh], j) => {
          const bx = x + cx, top = BY - 14 - hh;
          let d = `M${bx},${BY - 14} L${bx + (j - 1) * 4},${top}`;
          for (let t = 1; t <= 3; t++){ const yy = BY - 14 - hh * t / 4, ll = 22 - t * 4; d += ` M${bx + (j - 1) * t},${yy} l${-ll},${-ll * 0.8} M${bx + (j - 1) * t},${yy - 8} l${ll},${-ll * 0.8}`; }
          g += P(d, 'p04-den');
        });
      }
      if (k === 3){
        g += R(x + 14, BY - 22, MW - 28, 22, 'f-cu2');
        for (const [cx, rr] of [[52, 12], [128, 9], [182, 11]]) g += P(`M${x + cx - rr},${BY - 22} a${rr},${rr} 0 0 0 ${2 * rr},0`, 'f-hole2') + K.bubble(x + cx, BY - 34, rr * 0.7, 46, 2.2, cx / 60);
        const rp = K.rng(7);
        for (let i = 0; i < 26; i++){ const px = x + 20 + rp() * (MW - 40); if ([52, 128, 182].some(c => Math.abs(px - x - c) < 14)) continue; g += C(px, BY - 26 - rp() * 26, 3 + rp() * 4, 'pl-burnt'); }
      }
      s += G(g, tip(ZN[k].t + ' — ' + ZN[k].d));
    });
    // 오른쪽: 단계별 그림 (그림 y 200~620, 글 y 660~)
    const RX = 1100, TX = RX + 24, TW = 20;                     // TW: 한 줄 글자 폭(em)
    const para = (y, list, cls = 't-sub', lh = 30) => { let out = '', yy = y; list.forEach(t => { if (t === ''){ yy += lh * 0.5; return; } const ls = wrap(t, TW); out += TT(TX, yy, ls, cls, 'start', lh); yy += ls.length * lh; }); return out; };
    s += R(RX, 120, 480, 1000, 'pl-panel', {rx: 16});
    // eq: 오가는 화살표
    let eq = T(TX, 166, '평형 — 오가는 양이 같다', 't-acc', 'start');
    eq += R(RX + 40, 210, 400, 330, 'f-bath') + R(RX + 40, 540, 400, 70, 'f-cu2') + T(RX + 240, 584, '금속 (전극)', 't-lbl');
    for (let k = 0; k < 4; k++){
      const x = RX + 80 + k * 90;
      eq += K.ionPath(`M${x},300 L${x},520`, 'cu', 2.8, k * 0.7, null) + K.ionPath(`M${x + 30},520 L${x + 30},300`, 'cu', 2.8, k * 0.7 + 1.4, null);
    }
    eq += K.arrow(RX + 466, 470, RX + 466, 320, 's-arr2') + K.arrow(RX + 452, 320, RX + 452, 470, 's-arr');
    eq += para(660, ['전류가 0이면 전극은 평형 전위(제자리 전압)에 머문다. 0 V가 아니다.', '쌓이는 속도 = 녹는 속도 → 겉보기 변화 0', '이때 오가는 양 = 교환전류 i₀. 클수록 조금만 밀어도 많이 흐른다 (Sn · Ag > Cu > Ni)']);
    eq += para(960, ['실제 얇은 Cu 시드는 산 · 녹은 산소에 조금씩 녹는다 → 닿는 순간부터 전류를 건다 (핫 엔트리, 09장)'], 't-warn', 30);
    s += G(eq, only('eq'));
    // kin: 언덕 그림
    let kn = T(TX, 166, '언덕 넘기 — 밀면 장벽이 낮아진다', 't-acc', 'start');
    kn += L(RX + 40, 560, RX + 450, 560, 's-axis') + LB(T(RX + 40, 594, '이온 (액 속)', 't-dim', 'start') + T(RX + 450, 594, '원자 (금속)', 't-dim', 'end'));
    kn += P(`M${RX + 50},400 C${RX + 120},400 ${RX + 170},250 ${RX + 245},250 C${RX + 320},250 ${RX + 360},410 ${RX + 440},410`, 's-dash', tip('밀기 전'));
    kn += P(`M${RX + 50},400 C${RX + 120},400 ${RX + 170},300 ${RX + 245},310 C${RX + 320},320 ${RX + 360},510 ${RX + 440},520`, 's-curve', tip('밀었을 때 — 오른쪽(금속 쪽)이 내려가고 장벽이 낮아진다'));
    kn += `<circle r="16" class="k-acc2"><animateMotion dur="3s" repeatCount="indefinite" path="M${RX + 60},386 C${RX + 120},386 ${RX + 170},286 ${RX + 245},296 C${RX + 320},306 ${RX + 360},496 ${RX + 430},506"/></circle>`;
    kn += K.arrow(RX + 400, 420, RX + 400, 500, 's-arr2') + T(RX + 392, 466, 'η', 't-warn', 'end');
    kn += para(660, ['아주 조금 밀면(수 mV) 전류는 미는 만큼 비례해서 는다.', '수십 mV를 넘으면 넘는 이온이 지수적으로 는다 (타펠 구역).', '', '가장 고운 결정: 충분히 밀되 한계와 거리를 둔 곳. 너무 약하면 씨앗(핵)이 적어 굵다 → 06장', '', '억제제는 언덕을 높여 "더 밀어야" 흐르게 한다 → 05장']);
    s += G(kn, only('kin'));
    // mt: 공급 한계 (깔때기)
    let mt = T(TX, 166, '공급 한계 — 골목길만큼만', 't-acc', 'start');
    mt += P(`M${RX + 70},220 L${RX + 410},220 L${RX + 270},420 L${RX + 270},560 L${RX + 210},560 L${RX + 210},420 Z`, 'f-bath') + P(`M${RX + 70},220 L${RX + 210},420 L${RX + 210},560 M${RX + 410},220 L${RX + 270},420 L${RX + 270},560`, 's-edge');
    for (let k = 0; k < 9; k++) mt += K.jiggle(RX + 120 + (k % 5) * 55, 256 + Math.floor(k / 5) * 54, 'cu', k + 40, 8);
    for (let k = 0; k < 3; k++) mt += K.ionPath(`M${RX + 240},420 L${RX + 240},578`, 'cu', 2.4, k * 0.8, null);
    mt += R(RX + 120, 580, 240, 36, 'f-cu2') + LB(T(RX + 290, 490, '확산층', 't-warn', 'start'));
    mt += para(660, ['위(벌크)에 이온이 아무리 많아도 좁은 확산층을 걸어오는 만큼만 표면에 닿는다 → 전류가 평평해진다', '', '미는 힘은 이온을 끌어오지 않는다. 이미 도착한 이온을 재촉할 뿐이다.', '', '교반을 세게 → 골목이 짧아져 평평한 높이(한계전류)가 올라간다']);
    s += G(mt, only('mt'));
    // h2: 수소
    let hh = T(TX, 166, '수소 발생 — 함께 일어나는 반응', 't-acc', 'start');
    hh += R(RX + 40, 210, 400, 330, 'f-bath') + R(RX + 40, 540, 400, 70, 'f-cu2');
    for (let k = 0; k < 12; k++) hh += K.bubble(RX + 70 + (k % 6) * 66, 530, 8 + (k % 3) * 5, 300, 2 + (k % 4) * 0.4, k * 0.3);
    for (let k = 0; k < 3; k++) hh += K.ionPath(`M${RX + 120 + k * 120},240 L${RX + 120 + k * 120},520`, 'h', 2.6, k * 0.8, null);
    hh += LB(T(RX + 430, 516, '표면 pH↑', 't-warn', 'end'));
    hh += para(660, ['2H⁺ + 2e⁻ → H₂ (거품)', '', '금속은 한계전류만큼 쌓이고, 남는 전류가 수소를 만든다 → 효율↓', '', '거품이 붙은 자리는 도금이 덜 된다 → 핀홀 · 피트', '', '표면 H⁺가 줄어 pH↑ → Ni는 수산화물이 섞여 단단 · 잘 깨짐 → 붕산(pH 완충) · 습윤제(거품 떼기)', '', 'Cu는 아주 세게 밀어야 나오지만, Ni는 평소에도 조금 함께 나온다']);
    s += G(hh, only('h2'));
    // slope: 두 길과 톨게이트 (막대 · 수치는 위젯이 그린다)
    let sl = T(TX, 166, '고르게 퍼지려면 — 기울기', 't-acc', 'start');
    sl += R(RX + 60, 206, 130, 24, 'f-anode', tip('양극 (애노드, +)')) + T(RX + 200, 224, '양극 (애노드, +)', 't-dim', 'start');
    sl += P(`M${RX + 125},232 L${RX + 125},400`, 's-flow') + P(`M${RX + 160},232 C${RX + 240},250 ${RX + 330},300 ${RX + 355},400`, 's-flow');
    sl += LB(T(RX + 110, 330, '짧은 길', 't-sub', 'end') + T(RX + 300, 286, '긴 길 (액 저항 ×3)', 't-sub', 'start'));
    sl += R(RX + 40, 520, 400, 30, 'f-cu2') + T(RX + 240, 572, '음극 (캐소드, −) — 도금되는 표면', 't-dim');
    sl += `<g data-v="paths"></g>`;
    sl += para(720, ['완만한 곡선 = 전류를 조금 더 흘리려면 훨씬 더 밀어야 한다 = 모든 길 입구에 같은 톨게이트(표면 저항) → 길 길이 차이가 덜 중요 → 고르게', '모양 그대로 옆으로 옮기기만 하면 → 쏠림 그대로']);
    sl += para(954, ['크기에 따라 주역이 다르다 (바그너 수)'], 't-warn');
    sl += para(988, ['웨이퍼 150 mm: Wa ≈ 0.2 → 하드웨어 (실드 · 고저항판 = 인공 분극)', '범프 50 µm: Wa ≈ 500 → 첨가제 · 공급'], 't-sub', 28);
    s += G(sl, only('slope'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 곡선 위를 걸어 보기</div>
      ${K.ctl('e', '미는 힘 — Cu 반응의 과전압 (mV)', 0, 600, 5, 160)}
      ${K.ctl('a', '교반 (한계전류 배수)', 0.6, 1.6, 0.05, 1)}
      ${K.seg('sup', [['none', '없음'], ['sup', '있음'], ['shift', '옮기기만 (가상)']], 'none', '억제제')}
      <div class="p04-kp">${K.kpis([['구역', 'k-z', ''], ['금속 석출', 'k-m', '한계전류 대비'], ['전류효율', 'k-eff', '금속 몫'], ['전류 쏠림', 'k-sk', '짧은 길 ÷ 긴 길 (1 = 고름)']])}</div>
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('i_k = i₀(e^(η/b) − e^(−η/b)) + 억제막 몫, 1/i = 1/i_k + 1/iL, 수소 전류는 따로 더함. 쏠림은 액 저항이 1 : 3인 두 길에 같은 평균 전류를 흘려 비교한 값. 축 값은 상대값 · 예시이며 금속 · 액마다 다릅니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip} = K;
    let touched = false;
    const RX_ = 1100;                                          // 오른쪽 판 x (draw 와 같게)
    const st = {e: 0.16, a: 1, sup: 'none'};
    const ein = ctx.card.querySelector('input[data-i=e]'), sbox = ctx.card.querySelector('.pl-seg[data-g="sup"]');
    function render(){
      const cv = CV[st.sup], cn = st.sup === 'none' ? 'sup' : 'none', cc = CV[cn];
      // 구역 띠 (현재 조건에서 경계 계산)
      const bd = [0, 0, 0];
      for (let e = 0; e <= EMAX; e += 0.0025){ const z = zone(model(e, cv, st.a)); for (let k = 0; k < 3; k++) if (z > k && !bd[k]) bd[k] = e; }
      const xs = [GX0, gx(bd[0] || EMAX), gx(bd[1] || EMAX), gx(bd[2] || EMAX), GX1];
      const zc = ['pl-z0', 'pl-z1', 'pl-z2', 'pl-z3'];
      let zs = '';
      for (let k = 0; k < 4; k++) if (xs[k + 1] > xs[k] + 1) zs += R(xs[k], GY1 - 10, xs[k + 1] - xs[k], GY0 - GY1 + 10, zc[k]) + T((xs[k] + xs[k + 1]) / 2, GY1 + 18, ['①', '②', '③', '④'][k], 't-dim');
      ctx.$('[data-v="zones"]').innerHTML = G(zs, K.on('kin'));
      // 곡선: 금속(굵게), 전체(수소 포함), 비교 곡선(점선)
      const pts = (f, e0 = 0) => { let d = ''; for (let e = e0; e <= EMAX + 1e-9; e += 0.005){ d += (d ? ' L' : 'M') + gx(e).toFixed(1) + ',' + gy(f(e)).toFixed(1); } return d; };
      const at = (c, frac) => { const e = etaOf(frac * st.a, c, st.a); return [gx(e), gy(frac * st.a)]; };     // 곡선 위 '한계의 frac' 지점
      let cv2 = P(pts(e => imOf(e, cv, st.a)), 's-curve', tip('금속 석출 전류 — ' + cv.nm));
      // 이름표: 왼쪽에 있는 곡선(억제제 없음)은 왼쪽 위, 오른쪽 곡선은 오른쪽 아래에
      const left = st.sup === 'none', [mx, my] = at(cv, 0.8);
      cv2 += G(LB(left ? T(mx - 16, my - 12, cv.nm, 't-acc', 'end') : T(mx + 16, my + 30, cv.nm, 't-acc', 'start')), K.on('kin'));
      const ly = gy(st.a) - 46 > GY1 + 44 ? gy(st.a) - 12 : gy(st.a) + 30;                     // 한계전류 이름표 (위가 좁으면 아래로)
      const eh = 0.42 + 0.04 * Math.log(0.0025 * st.a / 0.002);                                  // 수소가 눈에 띄기 시작하는 곳부터
      cv2 += G(P(pts(e => model(e, cv, st.a).i, eh), 's-curve2', tip('전체 전류 = 금속 + 수소')) + LB(T(GX0 + 10, ly > gy(st.a) ? gy(st.a) + 60 : gy(st.a) - 46, '주황 점선 = 전체 (금속 + 수소)', 't-warn', 'start')), K.only('h2'));
      const [qx, qy] = at(cc, 0.5);
      cv2 += G(P(pts(e => imOf(e, cc, st.a)), 'pl-cmp', tip(cn === 'sup' ? '억제제가 있을 때 — 오른쪽으로 옮겨지고 완만해진다(기울기가 눕는다)' : '억제제가 없을 때')) + LB(left ? T(qx + 16, qy + 30, cc.nm, 'pl-cmpt', 'start') : T(qx - 16, qy - 10, cc.nm, 'pl-cmpt', 'end')), K.on('kin'));
      cv2 += L(GX0, gy(st.a), GX1, gy(st.a), 's-dash') + LB(T(GX0 + 10, ly, '한계전류 iL', 't-warn', 'start'));
      // 가장 고운 결정 근처 (반응 지배 안, 한계와 거리를 둔 곳)
      const [fx, fy] = at(cv, 0.5);
      cv2 += G(C(fx, fy, 8, 'p04-star') + LB(left ? T(fx - 18, fy - 8, '결정이 가장 고운 근처 ★', 't-sub', 'end') : T(fx + 18, fy + 30, '★ 결정이 가장 고운 근처', 't-sub', 'start')), K.only('kin'));
      ctx.$('[data-v="curves"]').innerHTML = cv2;
      // 지금 점
      const r = model(st.e, cv, st.a), z = zone(r), x = gx(st.e), y = gy(r.i);
      let dt = L(x, GY0, x, y, 's-dash') + C(x, gy(r.im), 9, 'k-acc') + C(x, y, 13, ZN[z].c) + C(x, y, 22, 'co-ring');
      const eq0 = st.e < 0.0025;                                 // 미는 힘 0 = 평형
      dt += LB(T(Math.min(x + 20, GX1 - 190), Math.max(GY1 + 50, y - 26), eq0 ? '평형 (알짜 전류 0)' : ZN[z].t, 't-warn', 'start'));
      ctx.$('[data-v="dot"]').innerHTML = dt;
      ctx.$$('[data-v^="mbox"]').forEach((b, k) => b.setAttribute('class', k === z && !eq0 ? 'pl-box pl-on' : 'pl-box'));
      // 두 길 비교 (같은 평균 금속 전류에서) — 한계 근처는 공급이 분포를 정하므로 계산하지 않는다
      const iop = Math.max(0.02 * st.a, r.im), lim = z >= 2;
      const [a1, a2] = lim ? [0, 0] : split(iop, cv, st.a), [b1, b2] = lim ? [0, 0] : split(iop, cc, st.a);
      const sk = a2 > 0 ? a1 / a2 : 1, skc = b2 > 0 ? b1 / b2 : 1;
      let pa = '';
      const toll = (x0, c) => { const h = 12 + 50 * Math.min(1, (c.b * 2 + c.rf * iop) / 0.24); return R(x0 - 44, 440 - h, 88, h, 'p04-toll', tip('톨게이트 = 표면 저항 (곡선이 완만할수록 높다)')); };
      pa += toll(RX_ + 125, cv) + toll(RX_ + 355, cv) + LB(T(RX_ + 240, 432, '톨게이트', 't-dim'));
      if (lim) pa += LB(K.TT(RX_ + 240, 470, ['한계 근처 — 공급(확산층)이 분포를 정한다', '→ 튀어나온 곳이 앞선다'], 't-warn', 'middle', 28));
      else {
        const hA = 56 * a1 / iop, hB = 56 * a2 / iop;
        pa += R(RX_ + 85, 520 - hA, 80, hA, 'f-cu2', tip('짧은 길 쪽에 쌓인 양')) + R(RX_ + 315, 520 - hB, 80, hB, 'f-cu2', tip('긴 길 쪽에 쌓인 양'));
        pa += LB(T(RX_ + 172, 526 - hA / 2, (a1 / iop).toFixed(2), 'pl-val', 'start') + T(RX_ + 402, 526 - hB / 2, (a2 / iop).toFixed(2), 'pl-val', 'start'));
        pa += LB(T(RX_ + 24, 620, `쏠림 ×${sk.toFixed(2)} (${cv.nm})`, 't-acc', 'start') + T(RX_ + 24, 652, `비교: ${cc.nm} ×${skc.toFixed(2)}`, 'pl-cmpt', 'start'));
      }
      ctx.$('[data-v="paths"]').innerHTML = pa;
      ctx.out('k-z', eq0 ? '평형' : ZN[z].t);
      ctx.out('k-m', `${Math.round(r.im / r.iL * 100)} %`);
      ctx.out('k-eff', r.i < 1e-4 ? '–' : `${Math.round(r.im / r.i * 100)} %`);
      ctx.out('k-sk', eq0 ? '–' : lim ? '공급이 정함' : `×${sk.toFixed(2)}`);
      let msg = `<b>${ZN[z].t}</b> — ${ZN[z].d}.`;
      if (z === 0 && st.e < 0.04) msg = `<b>${ZN[0].t} — 아주 약하게 민 구간</b> — 전류가 미는 만큼 비례해서 늡니다. 이렇게 약하면 씨앗(핵)이 적어 결정이 굵어질 수 있습니다 (06장).`;
      if (z === 2) msg += ' 이 구간은 곡선이 평평해 보여도 공급이 분포를 정해, 튀어나온 곳이 더 빨리 자랍니다.';
      else if (z === 3) msg += ' 분포는 공급이 정하고, 거품이 붙은 자리는 덜 쌓입니다.';
      else msg += st.sup === 'shift' ? ` 같은 전류에서 쏠림 ×${sk.toFixed(2)} = 억제제 없음 ×${skc.toFixed(2)} — 옆으로 옮기기만 해서는 고르게 되지 않습니다(기울기가 같다).`
        : st.sup === 'sup' ? ` 같은 전류에서 쏠림 ×${sk.toFixed(2)} (없음 ×${skc.toFixed(2)}) — 억제제는 곡선을 옮기면서 눕혀서 쏠림을 줄입니다.`
        : ` 같은 전류에서 쏠림 ×${sk.toFixed(2)} — 억제제를 켜면 곡선이 누워 ×${skc.toFixed(2)}로 줄어듭니다.`;
      if (eq0) msg = '<b>평형</b> — 미는 힘이 0이면 알짜 전류도 0입니다. 녹는 반응과 쌓이는 반응이 같은 속도로 오갈 뿐입니다(교환전류). 실제 얇은 Cu 시드는 이때 산 · 녹은 산소에 조금씩 녹을 수 있어, 전류를 건 채 넣습니다(핫 엔트리).';
      ctx.q('[data-o=msg]').innerHTML = msg;
      ctx.refresh();
    }
    const setSup = v => { st.sup = v; sbox.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false')); };
    ctx.range('e', v => { st.e = v / 1000; render(); return v + ' mV'; });
    ctx.range('a', v => { st.a = v; render(); return '×' + v.toFixed(2); });
    ctx.seg('sup', v => { st.sup = v; render(); });
    ctx.card.querySelectorAll('input, .pl-seg button').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    ctx.demo = sid => {
      if (touched) return ctx.refresh();
      const [e, sp] = DEMO[sid] || DEMO.kin;
      ein.value = Math.round(e * 1000); st.e = e; ctx.out('e', Math.round(e * 1000) + ' mV');
      setSup(sp);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['평형 전위', '전류가 0일 때 전극이 머무는 제자리 전압. 0 V가 아니다'],
      ['과전압 (η)', '평형 전위보다 더 건 만큼. 반응마다 따로 잰다 (Cu 반응의 과전압, 수소 반응의 과전압)'],
      ['분극 곡선', '전류가 흐르며 전극 전압이 제자리에서 벗어나는 모습을 그린 그래프. 도금액의 "성격표"'],
      ['교환전류 (i₀)', '평형에서 쌓이고 녹는 반응이 오가는 양. 클수록 조금만 밀어도 많이 흐른다'],
      ['타펠 구역', '전류가 과전압에 지수적으로 느는 구간 (보통 수십 mV 이상 밀었을 때)'],
      ['한계전류 (iL)', '공급(확산)이 따라갈 수 있는 최대 전류 → 03장'],
      ['바그너 수 (Wa)', '곡선의 완만함 ÷ 크기만큼의 액 저항. 클수록 전류가 고르게 퍼진다(균일전착성이 좋다)']
    ]) + K.field([
      '실무에서는 <b>반응 지배 구역</b>, 한계전류보다 충분히 낮은 곳에서 운전합니다. 처리량을 늘리려고 전류를 올릴 때는 먼저 한계전류와의 거리를 봅니다.',
      '<b>균일도는 곡선의 기울기가 정합니다.</b> 기울기가 완만할수록 전류가 저항이 작은 길(가장자리 · 튀어나온 곳)로 쏠리지 않습니다. 억제제는 곡선을 옮기면서 눕혀서 돕습니다 — 모양 그대로 옆으로만 옮겨지면 거의 도움이 되지 않습니다.',
      '<b>크기에 따라 주역이 다릅니다.</b> 웨이퍼 전체(150 mm)는 Wa가 1보다 작아 실드 · 고저항판(일부러 저항을 더한 "인공 분극") 같은 하드웨어가 맡고, 범프 하나(수십 µm)는 Wa가 매우 커서 첨가제 · 공급이 맡습니다 (<a data-go="wafer">07장</a>). 첨가제로 웨이퍼 중심–가장자리 차이를 잡으려 하지 않습니다.',
      '첨가제 분석(CVS)은 이 곡선이 얼마나 옮겨 가고 기울어졌는지를 재는 일입니다 (<a data-go="bath">11장</a>).',
      '같은 전류인데 전압이 오른다면, 곡선이 바뀌었거나(첨가제 · 농도 · 온도) 곡선 밖의 저항(접점 · 액 · 분리막)이 커진 것입니다.',
      '웨이퍼가 액에 닿는 순간부터 작은 전류(전압)를 거는 핫 엔트리는 얇은 시드가 녹지 않게 하는 설정입니다 (<a data-go="tool">09장</a>).'
    ]) + K.deep(`<p><b>버틀러-볼머 식</b> — 음극 전류를 (+), 음극 쪽으로 민 정도를 η(+)로 쓰면:</p>
      ${K.eq('i = i₀·[exp(α_c·Fη/RT) − exp(−α_a·Fη/RT)]')}
      <ul><li>η ≪ RT/F(25 °C에서 25.7 mV)이면 i ≈ i₀·Fη/RT — 비례. η ≳ 50~100 mV이면 한쪽 항만 남아 <b>η = a + b·log i</b> (타펠).</li>
      <li><b>타펠 기울기</b> b = 2.303RT/(αF) — α = 0.5, 25 °C이면 약 118 mV/decade. "전류를 10배로 늘리려면 약 0.12 V를 더 밀어야 한다"는 뜻이고, 클수록 곡선이 완만합니다.</li>
      <li><b>공급 한계 합치기</b>: 1/i = 1/i_k + 1/iL, 표면 농도 C_s = C_bulk·(1 − i/iL). 위젯 곡선이 이 식입니다.</li>
      <li><b>금속마다 다른 i₀</b>: Sn · Ag(단순한 액)는 크고, Cu는 중간, Ni는 아주 작습니다. Ni는 세게 밀어야 해서 수소도 함께 나오기 쉽습니다.</li>
      <li><b>바그너 수</b> Wa = κ·(dη/di)/L. 타펠 구역에서 dη/di = b/(2.303·i) 로 i₀와 무관 → <b>평행 이동(i₀만 줄임)으로는 Wa가 그대로</b>입니다. 예: κ 50 S/m, b 0.12 V/dec, 1 ASD → dη/di ≈ 5.2×10⁻⁴ Ω·m² → L 0.15 m에서 Wa ≈ 0.17, L 50 µm에서 ≈ 500. 전류밀도를 올리면 dη/di가 작아져 분포가 나빠지기 쉽습니다.</li>
      <li>교반은 보통 iL만 바꾸지만, 평탄제처럼 공급에 좌우되는 첨가제가 있으면 교반이 곡선(억제)도 바꿉니다 (05장).</li>
      <li><b>펄스 · 역펄스</b>: 전류를 끈 동안 확산층이 회복되고, 잠깐 거꾸로 흘리면 튀어나온 곳이 먼저 녹아 평평해집니다. 대신 평균 속도가 줄고 첨가제 거동이 달라져 쓰는 공정과 안 쓰는 공정이 있습니다.</li>
      <li>분극 곡선은 회전 원판 전극(RDE)에서 전위를 훑으며 잽니다(선형 주사). 논문은 음극 전류를 (−)로 그리는 경우가 많아 그림이 뒤집혀 보일 수 있습니다.</li></ul>`);
  },
  css: `.p04-den{fill:none;stroke:#e0904f;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}
.p04-toll{fill:rgba(167,139,250,.28);stroke:#a78bfa;stroke-width:1.6}
.p04-star{fill:#fde68a;stroke:#92400e;stroke-width:1.2}
.jc .p04-kp .kpi .v{font-size:16px;white-space:nowrap}`
});
})();
