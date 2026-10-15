/* 시드 식각 02 — 녹는 원리: 금속은 식각액 속에서 어떻게 녹을까? (표면 · 원자) */
(function(){
const SURF = 624, AX = k => 74 + k * 34, AY = [640, 674, 708];         // 표면 y(맨 윗줄 원자 꼭대기), 원자 자리 (r 16, 간격 34)
const SITES = [4, 10, 17, 23];                                         // ox 단계에서 Cu²⁺가 떠나는 원자 자리 (윗줄 k)
const PATCH = [110, 300, 480, 650, 820];                               // dis 단계 산화막 조각 x (폭 90)
const DEMO = {ox: [0.15, 2], dis: [0.15, 2], bal: [1, 0.2], fam: [0.15, 2]};   // 손대지 않았을 때 단계마다 보여 줄 (H₂O₂, 산) wt%
// 개념 모델 (기획 rev.2 — 03장 '반응 문'과 같은 눈금): 산화와 녹이기가 차례로 → 직렬, 산이 모자라면 부동태 몫 g 로 느려진다
function rates(cox, cac){
  const rox = 8300 * cox, rdis = 2500 * cac + 50, rs = rox * rdis / (rox + rdis), th = rox / (rox + rdis);
  const g = th <= 0.7 ? 1 : 1 - 1.5 * (th - 0.7);
  return {rox, rdis, rs, th, g, r: rs * g};
}
const fmt = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// 오른쪽 막대 (로그 눈금 10 ~ 20,000 nm/분 → 0 ~ 380 px, 바닥 y 600)
const BY0 = 600, BH = 380, LMIN = 1, LMAX = Math.log10(20000);
const bh = v => BH * Math.max(0, Math.min(1, (Math.log10(Math.max(v, 1)) - LMIN) / (LMAX - LMIN)));
const BARX = [1156, 1290, 1424], BARW = 84;
// viewN: 좁은(세로) 무대에서만 쓰는 확대 — 왼쪽 패널(표면 · 범프 단면) / 오른쪽 패널(세 빠르기 막대)
const VN_L = {x: 30, y: 120, w: 980, h: 660}, VN_R = {x: 1030, y: 120, w: 540, h: 660};
// 움직임 조각 (엔진 이온과 같은 꼴: 경로 + 투명도, 단계 안에서 서로 박자를 맞춘다)
const MO = (path, dur, delay, kt, kp) => `<animateMotion dur="${dur}s" begin="-${delay}s" repeatCount="indefinite" path="${path}"${kt ? ` keyTimes="${kt}" keyPoints="${kp}" calcMode="linear"` : ''}/>`;
const OP = (vals, kt, dur, delay) => `<animate attributeName="opacity" values="${vals}" keyTimes="${kt}" dur="${dur}s" begin="-${delay}s" repeatCount="indefinite"/>`;
// 이 탭 설정에 없는 분자(H₂O₂ · H₂O · NH₃)는 이온 꼴을 빌려 직접 그린다 (색은 장 css)
const MOL = {pox: ['H₂O₂', 21], h2o: ['H₂O', 17], nh3: ['NH₃', 16]};
const molG = (kind, inner, x, y, tp) => `<g class="pl-ion et02-${kind}"${x != null ? ` transform="translate(${x} ${y})"` : ''}${tp ? ` data-tip="${tp}"` : ''}><circle r="${MOL[kind][1]}"/><text y="4.5" text-anchor="middle">${MOL[kind][0]}</text>${inner || ''}</g>`;
// 제자리 흔들림 경로 (엔진 jiggle 과 같은 방식, 결정적)
function jigPath(K, x, y, seed, amp = 9){
  const r = K.rng(seed * 97 + 13);
  let d = `M${x},${y}`;
  for (let k = 0; k < 5; k++) d += ` L${K.q1(x + (r() - 0.5) * 2 * amp)},${K.q1(y + (r() - 0.5) * 2 * amp)}`;
  return {d: d + ' Z', dur: (3.4 + r() * 2).toFixed(2), delay: (r() * 4).toFixed(2)};
}
const molJig = (K, kind, x, y, seed, tp) => { const j = jigPath(K, x, y, seed); return molG(kind, MO(j.d, j.dur, j.delay), null, null, tp); };
const TIP_POX = '과산화수소 H₂O₂ — 산화제. 표면에서 Cu의 전자 2개를 받아 물 2개가 된다';

const CHIPS = [['① 산화 — 전자 빼앗기', '산화제: H₂O₂ · 과황산염 · O₂', 'ox bal'], ['② 녹이기 — 물에 녹는 꼴로', '산 (H⁺) · 착화제 (NH₃ 등)', 'dis bal'], ['③ 실어 내기 — 흐름', '흐름 · 확산 — 03장에서 자세히', 'dis']];
const CHX = [80, 580, 1080];
const FAM = [
  {h: '과산화수소 + 산', eq: 'Cu + H₂O₂ + 2H⁺ → Cu²⁺ + 2H₂O', tag: '기준 액', b: ['묽게 쓴다 — 산(황산 · 인산 등)과 H₂O₂ 모두 수 wt% 이하', 'H₂O₂는 저절로, Cu²⁺가 있으면 더 빨리 분해 → 안정제', '황산계는 순수 Sn을 공격하기 쉽다 (인쇄회로기판 경험) → 범프용은 조성 · 억제제로']},
  {h: '과황산염 + 황산', eq: 'Cu + S₂O₈²⁻ → Cu²⁺ + 2SO₄²⁻', b: ['속도가 비교적 안정하다', '인쇄회로기판에서 표면을 얇게 깎는 \'마이크로 식각\'에 오래 써 온 계열', '녹은 Cu가 늘면 속도 · 표면이 변한다']},
  {h: '암모니아 계열 (알칼리)', eq: 'Cu + Cu(NH₃)₄²⁺ → 2Cu(NH₃)₂⁺', b: ['착이온 Cu(NH₃)₄²⁺가 Cu를 녹이고, 공기 산소가 다시 되살린다', '인쇄회로기판에서 Sn · Ni 금속 마스크와 함께 써 온 계열', '냄새 · 배기, 암모니아 증발 · pH 관리']},
  {h: '염화물 계열 (참고)', eq: 'Cu + CuCl₂ → 2CuCl', ref: true, b: ['빠르고 싸다 (인쇄회로기판)', 'Sn 계열을 공격하고 염화물이 남기 쉬워 웨이퍼 범프에는 보통 쓰지 않는다']}
];
const PICK = [['① Ti에서 멈춘다', 'Cu만 녹이고 아래 Ti는 거의 안 녹인다 — Ti는 다른 액으로 따로 지운다 (06장)'],
  ['② 범프를 덜 다치게', 'Cu 기둥 옆면 · Ni · SnAg 모자 — 조성 · 억제제 · pH로 고른다'],
  ['③ 속도가 안정하게', '과산화수소가 분해되고 녹은 Cu가 늘어도 속도가 덜 변하게 (08장)'],
  ['④ 밝고 고르게', '산화막 · 얼룩 · 남는 염 없이 — 산과 산화제의 균형 (이 장 3단계)'],
  ['⑤ 다루기', '배기 · 안전 · 폐액 · 비용']];

(window.EngrEtchChapters = window.EngrEtchChapters || []).push({
  no: '02', id: 'chem', part: 1, short: '녹는 원리', scale: '표면 · 원자',
  title: '녹는 원리 — 금속은 식각액 속에서 어떻게 녹을까?',
  hook: '빼앗고, 녹이고, 실어 낸다',
  one: '금속은 그대로는 물에 녹지 않습니다. 식각액은 먼저 금속에서 전자를 빼앗아(산화) 이온이나 산화물로 바꾸고, 산이나 착화제가 그것을 물에 녹는 꼴로 만들어 실어 냅니다. 식각액마다 이 두 일을 맡는 약품이 다릅니다.',
  ana: '<b>벽돌 담 허물기</b> — 한 사람(산화제)은 벽돌을 떼어 내고, 다른 사람(산 · 착화제)은 떼어 낸 벽돌을 수레로 실어 갑니다. 실어 가는 사람이 모자라면 떼어 낸 벽돌이 담 앞에 쌓여(산화막), 더 빨리 떼어도 일은 빨라지지 않고 쌓인 벽돌이 길을 막아 오히려 느려지기도 합니다(부동태). 실어 가는 사람이 빨라도 떼는 사람이 느리면 그만큼만 됩니다. <i>(비유의 한계: 실제로는 두 일이 원자 크기에서 동시에 일어나고, 얇은 산화막이 있는 편이 오히려 고르게 녹이는 데 도움이 되기도 합니다. \'사람 수\'가 아니라 농도 · 온도 · 흐름이 빠르기를 정합니다.)</i>',
  steps: [
    {id: 'ox', t: '산화 — 전자를 빼앗는다', d: 'Cu 원자가 액에 녹으려면 전자 2개를 내놓아야 합니다. 과산화수소(H₂O₂) · 과황산염 같은 산화제가 표면에서 이 전자를 받아 갑니다. 전해도금을 거꾸로 돌린 것과 같지만, 전선 없이 같은 표면에서 일어납니다.', viewN: VN_L},
    {id: 'dis', t: '녹여 실어 내기', d: '산화된 Cu는 표면에 얇은 산화막(CuO · Cu₂O)이 되기 쉽습니다. 산(H⁺)이 이것을 물에 녹는 Cu²⁺로 바꾸거나, 암모니아 같은 착화제가 감싸 녹입니다. 녹은 이온은 흐름을 타고 표면에서 멀어집니다.', viewN: VN_L},
    {id: 'bal', t: '산화제와 산의 균형', d: '산화가 녹이기보다 빠르면 녹이기가 속도를 정합니다. 산화제를 더 넣어도 거의 안 빨라지고, 못 녹인 산화막이 쌓여 표면이 거무스름하게 얼룩지며 오히려 느려지기도 합니다(부동태). 산이 넉넉하면 밝고 고르게 녹습니다.', viewN: VN_R},
    {id: 'fam', t: 'Cu 식각액의 네 계열', d: '과산화수소 + 산, 과황산염 + 황산, 암모니아 계열(알칼리), 염화물 계열이 있습니다. 범프에서는 빠르기보다 \'무엇을 안 녹이나\'(Ti · Ni · SnAg)가 먼저입니다. 그래서 묽게 쓰고 첨가제로 조절합니다.', viewN: VN_L}
  ],
  icon(K){
    const {R, C, P} = K;
    let s = '';
    for (let i = 0; i < 5; i++) s += C(10 + i * 11, 48, 5, 'f-atom');
    return s + R(6, 38, 30, 5, 'f-cuox') + P('M40,42 Q41,32 44,26', 's-arr2') + C(48, 18, 7, 'et02-cuic');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, W, wrap, arrow} = K;
    let s = '';
    // ───────── 왼쪽 패널: 표면 확대 (ox · dis · bal) / 범프 단면 (fam)
    s += R(40, 130, 960, 640, 'pl-panel', {rx: 14});
    s += G(LB(T(60, 166, '표면 확대 — 원자 크기 (개념도)', 't-acc', 'start')), only('ox dis bal'));
    s += G(LB(T(60, 166, '범프 단면 — Cu 식각액이 닿는 것들 (두께 과장)', 't-acc', 'start')), only('fam'));

    let a = R(44, 180, 952, SURF - 180, 'f-etl', tip('Cu 식각액 (예: 묽은 과산화수소 + 황산)'));
    let at = '';
    AY.forEach((y, row) => { for (let k = 0; k < 27; k++) if (row || !SITES.includes(k)) at += C(AX(k), y, 16, 'f-atom'); });
    a += G(at, tip('Cu 원자 (실제 지름 약 0.26 nm — 그림은 개념)'));
    a += R(44, 724, 952, 42, 'f-cu2', tip('Cu 시드 — 이 장면에서 녹는 쪽 (애노드)'));
    a += LB(T(60, 752, 'Cu 시드 — 녹는 쪽', 'et02-on', 'start') + T(980, 752, '원자 크기 그림 (개념도)', 'et02-on', 'end'));
    // 바뀌는 윗줄 원자 4개: ox 에서는 Cu²⁺로 떠났다가 다시 채워지고(반복 그림), 다른 단계에서는 그대로
    a += G(SITES.map(k => C(AX(k), AY[0], 16, 'f-atom')).join(''), only('dis bal'));
    // ox: 산화제가 내려와 닿는 순간 전자 2개가 건너가고(액 속을 떠다니지 않는다), 원자 하나가 Cu²⁺로 떠난다
    let ox = LB(T(60, 318, '산화제(H₂O₂)가 표면에 닿는 순간 전자 2개가 건너가고, Cu 원자 하나가 Cu²⁺로 떠납니다', 't-sub', 'start'));
    [[130, 420], [300, 380], [530, 470], [760, 400], [950, 486]].forEach(([x, y], i) => { ox += K.jiggle(x, y, 'h', 40 + i, 9, tip('H⁺ — 산. 산화제가 전자를 받을 때 함께 쓰여 물이 된다')); });
    [[100, 500], [330, 560], [540, 380], [740, 520], [960, 380]].forEach(([x, y], i) => { ox += molJig(K, 'pox', x, y, 50 + i, TIP_POX); });
    SITES.forEach((k, i) => {
      const x = AX(k), dur = 4.8, dl = (i * 1.2 + 0.3).toFixed(2);
      ox += `<circle cx="${x}" cy="${AY[0]}" r="16" class="f-atom">${OP('1;1;0;0;1', '0;.66;.7;.95;1', dur, dl)}</circle>`;
      ox += molG('pox', MO(`M${x},340 L${x},600`, dur, dl, '0;.55;1', '0;1;1') + OP('0;1;1;1;0;0', '0;.08;.55;.64;.7;1', dur, dl), null, null, TIP_POX);
      [-11, 11].forEach(dx => { ox += K.ionG('e', MO(`M${x + dx},634 L${x + dx * 0.6},604`, dur, dl, '0;.55;.68;1', '0;0;1;1') + OP('0;0;1;1;0;0', '0;.54;.57;.68;.72;1', dur, dl), tip('전자는 금속에서 표면에 닿은 산화제로 바로 건너간다 — 액 속을 떠다니지 않는다')); });
      [-16, 16].forEach(dx => { ox += molG('h2o', MO(`M${x + dx},596 C${x + dx},540 ${x + dx * 3},480 ${x + dx * 4},430`, dur, dl, '0;.66;1', '0;0;1') + OP('0;0;.85;0', '0;.66;.72;1', dur, dl), null, null, '물 — 산화제가 전자를 받고 남은 것'); });
      ox += K.ionG('cu', MO(`M${x},${AY[0]} C${x},560 ${x + 30},470 ${x + 70},380`, dur, dl, '0;.68;1', '0;0;1') + OP('0;0;1;1;0', '0;.67;.71;.93;1', dur, dl), tip('Cu²⁺ — 전자 2개를 내놓고 녹아 나간 Cu'));
    });
    a += G(ox, only('ox'));
    // dis: 산화막 조각에 H⁺가 닿으면 녹아 Cu²⁺가 되고 흐름을 타고 떠난다 (조각은 다시 생기고 녹기를 되풀이)
    let ds = LB(T(60, 318, '산화막(갈색 조각)에 H⁺가 닿으면 녹아 Cu²⁺가 되고, 흐름을 타고 떠납니다', 't-sub', 'start'));
    ds += P('M60,392 C300,372 620,412 980,388', 's-flow', tip('흐름 — 녹은 이온을 실어 낸다 (03장)')) + P('M60,446 C320,428 640,466 980,442', 's-flow');
    [[392, 0], [446, 2.2], [420, 4.1]].forEach(([y, dl]) => { ds += K.ionPath(`M80,${y} C380,${y - 20} 680,${y + 20} 980,${y}`, 'so4', 6.4, dl, tip('SO₄²⁻ — 황산의 짝 이온. 반응에 쓰이지 않고 Cu²⁺와 함께 실려 간다')); });
    PATCH.forEach((px, i) => {
      const dur = 4.4, dl = (i * 0.88).toFixed(2), cx = px + 45;
      ds += `<rect x="${px}" y="606" width="90" height="18" class="f-cuox" data-tip="산화막 조각 (CuO · Cu₂O) — 산이 녹이면 사라지고, 산화가 이어져 다시 생긴다">${OP('1;1;0;0;1', '0;.5;.62;.9;1', dur, dl)}</rect>`;
      [-14, 14].forEach((dx, j) => { ds += K.ionG('h', MO(`M${cx + dx},360 L${cx + dx},594`, dur, dl, `0;${j ? .48 : .46};1`, '0;1;1') + OP('0;1;1;0;0', '0;.08;.5;.56;1', dur, dl), tip('H⁺ — 산. 산화막을 녹여 Cu²⁺와 물로 바꾼다')); });
      ds += K.ionG('cu', MO(`M${cx},604 C${cx},500 ${cx + 40},440 ${Math.min(cx + 190, 960)},405`, dur, dl, '0;.56;1', '0;0;1') + OP('0;0;1;1;0', '0;.55;.6;.92;1', dur, dl), tip('Cu²⁺ — 물에 녹아 흐름을 타고 떠난다'));
    });
    a += G(ds, only('dis'));
    // bal: 위젯이 산화막 · 분자 수 · 녹아 나가는 Cu²⁺ 수를 그린다
    a += G('', W({'data-v': 'film'}, only('bal')));
    s += G(a, only('ox dis bal'));

    // fam: 범프 단면 — 지울 것 · 지킬 것 · 멈출 곳 (1 µm = 7 px, 시드 두께는 과장)
    const BC = [210, 595], BR = 87.5, BASE = 690;
    let b = R(44, 180, 952, BASE - 180, 'f-etl', tip('Cu 식각액'));
    b += LB(T(60, 318, '시드 두께는 크게 과장 — 실제는 Ti 100 nm + Cu 300 nm로 범프 높이(30 µm)의 약 1/100', 't-dim', 'start'));
    [[110, 380], [330, 420], [520, 370], [760, 410], [930, 380], [640, 440]].forEach(([x, y], i) => { b += molJig(K, 'pox', x, y, 60 + i, TIP_POX); });
    b += R(44, 714, 952, 52, 'f-pas', tip('보호막 (산화막 · 질화막 · 폴리이미드 등)'));
    BC.forEach(cx => { b += R(cx - 70, 714, 140, 12, 'f-al', tip('패드')); });
    b += R(44, 704, 952, 10, 'f-ti', tip('Ti (실제 약 100 nm — 그림은 과장). Cu 식각액에는 거의 안 녹아 Cu 식각이 여기서 멈춘다'));
    b += R(44, BASE, 952, 14, 'f-seed2', tip('Cu 시드 (실제 약 300 nm — 그림은 과장)'));
    [[44, BC[0] - BR], [BC[0] + BR, BC[1] - BR], [BC[1] + BR, 996]].forEach(([x0, x1]) => { b += R(x0, BASE, x1 - x0, 14, 'et02-tgt', tip('지울 곳 — 범프 사이 Cu 시드')); });
    BC.forEach(cx => {
      b += R(cx - BR, 585, 2 * BR, BASE - 585, 'f-cu2', tip('Cu 기둥 (15 µm, 예시) — 같은 Cu라 옆면이 조금 깎인다 (04장)'));
      b += R(cx - BR, 564, 2 * BR, 21, 'f-ni', tip('Ni (3 µm, 예시) — 지킬 것'));
      b += P(`M${cx - BR},564 L${cx - BR},486 Q${cx - BR},480 ${cx - BR + 6},480 L${cx + BR - 6},480 Q${cx + BR},480 ${cx + BR},486 L${cx + BR},564 Z`, 'f-sn2', tip('SnAg (12 µm, 리플로우 전 원기둥) — 지킬 것'));
    });
    // 범프 사이: 시드가 녹아 나가고, 기둥 옆면도 조금 공격받는다
    [[360, 0], [445, 1.4], [400, 2.6]].forEach(([x, dl]) => { b += K.ionPath(`M${x},686 L${x + 6},600`, 'cu', 3.2, dl, tip('녹아 나가는 Cu²⁺')); });
    [616, 652].forEach(y => { b += arrow(330, y, 303, y, 's-arr2') + arrow(475, y, 502, y, 's-arr2'); });
    b += LB(T(402, 530, '지울 것', 't-warn') + T(402, 558, '범프 사이 Cu 시드', 't-sub')) + arrow(402, 572, 402, 684, 's-arr2');
    b += K.lead(682, 510, 712, 500, 'SnAg 모자 — 지킬 것', 'start', 't-sub');
    b += K.lead(682, 575, 712, 566, 'Ni — 지킬 것', 'start', 't-sub');
    b += K.lead(682, 630, 712, 628, 'Cu 기둥 옆면', 'start', 't-sub') + LB(T(720, 662, '같은 Cu라 조금은 깎인다 (04장)', 't-dim', 'start'));
    b += LB(T(210, 752, '↑ 범프 밑 시드는 남긴다', 'et02-onp') + T(700, 752, '↑ Ti — Cu 식각은 여기서 멈춘다', 'et02-onp', 'start'));
    s += G(b, only('fam'));

    // 식 상자 (단계마다)
    s += K.box(60, 190, 920, 90);
    const row = (y, eq, ex, cls = 'pl-eqn') => T(84, y, eq, cls, 'start') + (ex ? T(530, y, ex, 't-dim', 'start') : '');
    s += G(LB(row(226, 'Cu → Cu²⁺ + 2e⁻', '금속이 전자를 내놓음 — 산화 (애노드 반응)') + row(264, 'H₂O₂ + 2H⁺ + 2e⁻ → 2H₂O', '산화제가 전자를 받음 — 환원 (캐소드 반응)')), only('ox'));
    s += G(LB(row(226, 'CuO + 2H⁺ → Cu²⁺ + H₂O', '산이 산화막을 물에 녹는 Cu²⁺로') + row(264, 'Cu + H₂O₂ + H₂SO₄ → CuSO₄ + 2H₂O', '합치면 (과산화수소 + 황산)')), only('dis'));
    s += G(LB(T(84, 226, 'r = 산화 × 녹이기 ÷ (산화 + 녹이기) × 부동태 몫', 'pl-eqn', 'start') + T(964, 226, '(개념 모델)', 't-dim', 'end')), only('bal'));
    s += G('', W({'data-v': 'eqn'}, only('bal')));
    s += G(LB(T(84, 228, '고를 때: 빠르기보다 \'무엇을 안 녹이나\'가 먼저', 't-acc', 'start') + T(84, 262, '범프 둘레의 Cu 기둥 옆면 · Ni · SnAg 모자 · Ti가 시드와 함께 액에 닿습니다', 't-dim', 'start')), only('fam'));

    // ───────── 오른쪽 패널
    s += R(1040, 130, 520, 640, 'pl-panel', {rx: 14});
    // ox: 도금과 식각 — 같은 반응을 거꾸로, 그러나 전선이 없다
    let rp = LB(T(1064, 166, '도금을 거꾸로 — 그러나 전선이 없다', 't-acc', 'start'));
    rp += R(1060, 186, 480, 272, 'pl-box', {rx: 12}) + LB(T(1076, 216, '전해도금 — 쌓기', 'pl-hdg', 'start'));
    rp += R(1080, 236, 104, 56, 'f-psu', W({rx: 8}, tip('정류기 — 전선으로 전자를 밀어 넣는다'))) + LB(T(1132, 271, '정류기', 't-dim'));
    rp += P('M1132,292 L1132,396', 's-wire') + [0, 1.1].map(dl => K.ionG('e', MO('M1132,300 L1132,388', 2.2, dl) + OP('0;1;1;0', '0;.15;.85;1', 2.2, dl), tip('전자는 전선 · 금속 안에서만 움직인다'))).join('');
    rp += LB(T(1206, 262, 'Cu²⁺ + 2e⁻ → Cu', 'pl-eqn', 'start') + T(1206, 292, '전자는 전선으로 들어온다', 't-dim', 'start'));
    rp += K.ionPath('M1470,312 L1470,382', 'cu', 2.6, 0, tip('Cu²⁺가 와서 전자를 받고 쌓인다'));
    rp += R(1070, 396, 460, 22, 'f-cu2', tip('도금되는 웨이퍼 — 캐소드 (받는 쪽)')) + LB(T(1300, 446, '웨이퍼(캐소드)에 Cu가 쌓인다', 't-sub'));
    rp += R(1060, 474, 480, 286, 'pl-box', {rx: 12}) + LB(T(1076, 504, '식각 — 녹이기', 'pl-hdg', 'start'));
    rp += LB(T(1076, 544, 'Cu → Cu²⁺ + 2e⁻', 'pl-eqn', 'start') + T(1076, 574, '전자는 같은 표면의 산화제에게', 't-dim', 'start'));
    rp += P('M1478,590 L1478,694', 's-dash') + L(1462, 626, 1494, 658, 'et02-x') + L(1494, 626, 1462, 658, 'et02-x') + LB(T(1478, 546, '전선 없음', 't-warn'));
    rp += molG('pox', MO('M1210,606 L1210,676', 3.2, 0, '0;.6;1', '0;1;1') + OP('0;1;1;0;0', '0;.1;.62;.72;1', 3.2, 0), null, null, TIP_POX);
    rp += K.ionG('e', MO('M1210,700 L1210,684', 3.2, 0, '0;.58;.7;1', '0;0;1;1') + OP('0;0;1;0;0', '0;.57;.6;.72;1', 3.2, 0), tip('전자는 표면에서 산화제로 바로 건너간다'));
    rp += K.ionG('cu', MO('M1340,690 C1340,650 1360,620 1384,598', 3.2, 0, '0;.68;1', '0;0;1') + OP('0;0;1;1;0', '0;.66;.72;.94;1', 3.2, 0), tip('Cu²⁺ — 녹아 나간다'));
    rp += R(1070, 700, 460, 22, 'f-cu2', tip('Cu 시드 — 녹는 쪽 (애노드). 받는 쪽(캐소드)도 같은 표면')) + LB(T(1300, 748, 'Cu 시드가 녹는다 — 받는 쪽도 같은 표면', 't-sub'));
    s += G(rp, only('ox'));
    // dis: 녹이는 두 길 — 산 또는 착화제
    let rd = LB(T(1064, 166, '녹이는 두 길 — 산 또는 착화제', 't-acc', 'start'));
    rd += R(1060, 186, 480, 272, 'pl-box', {rx: 12}) + LB(T(1076, 216, '산 (H⁺) — 산성 액', 'pl-hdg', 'start'));
    rd += R(1084, 266, 88, 24, 'f-cuox', tip('CuO 산화막')) + LB(T(1128, 316, 'CuO (산화막)', 't-dim'));
    rd += LB(T(1192, 286, '+', 't-lbl')) + K.ion(1226, 266, 'h') + K.ion(1250, 292, 'h');
    rd += arrow(1280, 280, 1346, 280) + K.ion(1382, 280, 'cu') + LB(T(1418, 288, '+', 't-lbl')) + molG('h2o', '', 1458, 280);
    rd += LB(T(1076, 372, 'CuO + 2H⁺ → Cu²⁺ + H₂O', 'pl-eqn', 'start') + T(1076, 404, '예: 과산화수소 + 황산 · 과황산염 + 황산', 't-dim', 'start') + T(1076, 432, 'Cu²⁺는 물에 잘 녹아 흐름을 타고 떠난다', 't-dim', 'start'));
    rd += R(1060, 474, 480, 286, 'pl-box', {rx: 12}) + LB(T(1076, 504, '착화제 (NH₃) — 알칼리 액', 'pl-hdg', 'start'));
    rd += C(1160, 582, 60, 'pl-cplx', tip('착이온 — 암모니아 4개가 Cu²⁺를 감싸 물에 녹게 한다')) + K.ion(1160, 582, 'cu');
    [[0, -40], [40, 0], [0, 40], [-40, 0]].forEach(([dx, dy]) => { rd += molG('nh3', '', 1160 + dx, 582 + dy); });
    rd += arrow(1236, 582, 1290, 582) + LB(T(1304, 574, 'Cu(NH₃)₄²⁺', 'pl-eqn', 'start') + T(1304, 604, '감싸서 녹인 착이온', 't-dim', 'start'));
    rd += LB(T(1076, 680, 'Cu²⁺ + 4NH₃ → Cu(NH₃)₄²⁺', 'pl-eqn', 'start') + T(1076, 712, '중성 물에서는 산화막이 녹지 않고 남는다', 't-dim', 'start') + T(1076, 740, '→ 액은 산성이거나 착화제가 있어야 한다', 't-dim', 'start'));
    s += G(rd, only('dis'));
    // bal: 세 빠르기 막대 (위젯이 그린다)
    let rb = LB(T(1064, 166, '세 빠르기 비교 (로그 눈금)', 't-acc', 'start') + T(1064, 192, 'nm/분 · 표면 반응만 (흐름이 넉넉할 때)', 't-dim', 'start'));
    rb += L(1124, BY0, 1124, BY0 - BH - 6, 's-axis') + L(1124, BY0, 1540, BY0, 's-axis');
    [[10, '10'], [100, '100'], [1000, '1,000'], [10000, '10,000']].forEach(([v, t]) => { const y = BY0 - bh(v); rb += L(1126, y, 1540, y, 's-faint') + L(1116, y, 1124, y, 's-axis') + LB(T(1112, y + 7, t, 't-dim', 'end')); });
    rb += LB(T(BARX[0] + BARW / 2, 630, '산화 (H₂O₂)', 't-dim') + T(BARX[1] + BARW / 2, 630, '녹이기 (산)', 't-dim') + T(BARX[2] + BARW / 2, 630, '표면 반응', 't-sub'));
    rb += `<g data-v="bars"></g>`;
    s += G(rb, only('bal'));
    // fam: 고르는 기준
    let rf = LB(T(1064, 166, '식각액을 고르는 기준 (보통)', 't-acc', 'start'));
    PICK.forEach(([h, d], i) => { const y = 214 + i * 108; rf += LB(T(1064, y, h, 'pl-hdg', 'start') + TT(1064, y + 30, wrap(d, 22.5), 't-dim', 'start', 25)); });
    s += G(rf, only('fam'));

    // ───────── 아래 패널: 세 일 (ox · dis · bal) / 네 계열 카드 (fam)
    s += R(40, 800, 1520, 310, 'pl-panel', {rx: 14});
    let ch = '';
    CHIPS.forEach(([t1, t2, hl], i) => {
      const x = CHX[i];
      ch += R(x, 826, 440, 110, 'pl-tile2', {rx: 12}) + R(x, 826, 440, 110, 'pl-hlbox', W({rx: 12}, only(hl)));
      ch += LB(T(x + 22, 868, t1, 't-lbl', 'start') + T(x + 22, 906, t2, 't-dim', 'start'));
    });
    ch += arrow(526, 881, 574, 881) + arrow(1026, 881, 1074, 881);
    ch += `<g data-v="slow"></g>`;
    ch += G(LB(T(80, 984, '전자는 금속에서 표면에 닿은 산화제로 바로 건너갑니다 — 액 속을 떠다니지 않습니다.', 't-sub', 'start') +
      T(80, 1018, '한 표면 안에 전자를 내놓는 자리(애노드 · 녹는 쪽)와 받는 자리(캐소드)가 함께 있는 \'전선 없는 작은 전지\'입니다.', 't-dim', 'start') +
      T(80, 1052, 'Cu 하나에 H₂O₂ 하나 (전자 2개씩). 이 탭의 기준 액: H₂O₂ 0.15 wt% + 황산 약 2 wt% · 25 °C (예시)', 't-dim', 'start')), only('ox'));
    ch += G(LB(T(80, 984, '녹은 Cu²⁺는 흐름을 타고 떠나고, 새 산화제와 산이 와야 다음 원자가 녹습니다.', 't-sub', 'start') +
      T(80, 1018, '산화막이 생기고 녹기를 되풀이합니다. 산이 모자라면 녹이기가 밀려 막이 쌓입니다 (다음 단계).', 't-dim', 'start') +
      T(80, 1052, '약품이 오고 녹은 이온이 가는 길(공급)이 실제 속도를 얼마나 정하는지는 03장에서 봅니다.', 't-dim', 'start')), only('dis'));
    ch += G('', W({'data-v': 'read'}, only('bal')));
    s += G(ch, only('ox dis bal'));
    let fc = '';
    FAM.forEach((f, i) => {
      const x = 56 + i * 376, y = 816;                                 // 4장 × 360 + 사이 16 → 아래 패널(40~1560) 안쪽 16 여백
      fc += R(x, y, 360, 280, f.ref ? 'pl-lane' : 'pl-box', {rx: 12});
      fc += LB(T(x + 16, y + 34, f.h, f.ref ? 't-sub' : 'pl-hdg', 'start') + T(x + 16, y + 66, f.eq, 'et02-eq', 'start'));
      if (f.tag) fc += G(R(x + 266, y + 14, 82, 28, 'et02-tag', {rx: 7}) + T(x + 307, y + 34, f.tag, 'et02-tagt'), tip('이 탭의 기준 액 — H₂O₂ 0.15 wt% + 황산 약 2 wt% · 25 °C (예시)'));
      let yy = y + 100;
      f.b.forEach(t => { const ln = wrap('· ' + t, 16.8); fc += LB(TT(x + 16, yy, ln, 't-dim', 'start', 25)); yy += ln.length * 25 + 6; });
    });
    s += G(fc, only('fam'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 산화제와 산의 균형</div>
      ${K.ctl('ox', '산화제 H₂O₂ (wt%, 예시)', 0.05, 1.5, 0.05, 0.15)}${K.ctl('ac', '산 H₂SO₄ (wt%, 예시)', 0, 3, 0.05, 2)}
      ${K.kpis([['표면 반응 빠르기', 'k-r', 'nm/분 · 흐름이 넉넉할 때'], ['느린 단계', 'k-slow', '느린 쪽이 속도를 정함'], ['표면 산화막', 'k-film', '산화막 지표 θ <span data-o="k-th">–</span>'], ['부동태로 준 몫', 'k-pass', '산화막이 덮어서']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('r_산화 = 8,300 × H₂O₂(wt%), r_녹이기 = 2,500 × 산(wt%) + 50 (nm/분, 예시 상수). 두 일이 차례로 일어나므로 r = r_산화·r_녹이기 ÷ (r_산화 + r_녹이기) × g. 산화막 지표 θ = r_산화 ÷ (r_산화 + r_녹이기), 부동태 몫 g = 1 (θ ≤ 0.7), 1 − 1.5(θ − 0.7) — \'산이 모자라면 산화막이 덮어 오히려 느려진다\'는 개념 가정입니다(공개 Cu 연마액 연구의 경향을 단순화). 기본값(0.15 · 2 wt%)의 약 1,000 nm/분은 표면 반응만의 값(03장의 \'반응 문\')이고, 공급과 합친 기준 액의 실제 속도는 약 300 nm/분입니다. 과산화수소 분해 · 물질 전달 · 첨가제는 뺐습니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, E, L, T, G, LB, tip} = K;
    const st = {ox: DEMO.ox[0], ac: DEMO.ox[1]};
    let touched = false;
    const inOx = ctx.card.querySelector('input[data-i=ox]'), inAc = ctx.card.querySelector('input[data-i=ac]');
    const FN = ['얇음', '중간', '두꺼움'], SL = ['산화', '녹이기', '비슷'], SLL = ['산화 (산화제)', '녹이기 (산)', '비슷 (두 일)'], SW = ['밝은 구리색 — 고르게', '갈색 기운', '어두운 얼룩'];
    const swatch = t => { const c0 = [224, 144, 79], c1 = [91, 52, 35]; return `rgb(${c0.map((c, i) => Math.round(K.lerp(c, c1[i], t))).join(',')})`; };
    const kcls = (id, c) => { const el = ctx.card.querySelector(`[data-o="${id}"]`); if (!el) return; ['ok', 'warn', 'ng'].forEach(k => el.parentNode.classList.toggle(k, k === c)); };
    function render(){
      const m = rates(st.ox, st.ac), th = m.th;
      const film = th < 0.45 ? 0 : th <= 0.7 ? 1 : 2, slow = th < 0.45 ? 0 : th > 0.55 ? 1 : 2, pass = Math.round((1 - m.g) * 100);
      // 왼쪽: 산화막 띠 (두께 ∝ θ) · 얼룩 · 분자 수(농도의 개념 표시) · 녹아 나가는 Cu²⁺ 수(빠르기의 개념 표시)
      const fh = 40 * th, fy = SURF - fh;
      let f = LB(T(60, 318, `H₂O₂ ${st.ox.toFixed(2)} wt% · 산 ${st.ac.toFixed(2)} wt% — 분자 수는 농도를, 떠나는 Cu²⁺ 수는 빠르기를 나타낸 개념 표시`, 't-dim', 'start'));
      f += R(44, fy, 952, fh, 'f-cuox', {opacity: (0.3 + 0.7 * th).toFixed(2), 'data-tip': `표면 산화막 — 약 ${(th * 10).toFixed(0)} nm (그림 두께는 θ에 비례, 예시)`});
      if (th > 0.7){ const g = K.rng(9); for (let k = 0; k < 9; k++) f += E(80 + g() * 880, fy + fh / 2, 18 + g() * 30, fh * 0.42, 'et02-blot', tip('얼룩 — 못 녹인 산화막이 두껍게 쌓인 곳')); }
      f += LB(T(60, fy - 14, `표면 산화막 — ${FN[film]} (약 ${Math.max(1, Math.round(th * 10))} nm, 예시)`, film ? 't-warn' : 't-sub', 'start'));
      const nOx = Math.round(2 + 10 * Math.log(st.ox / 0.05) / Math.log(30)), nH = Math.round(12 * st.ac / 3);
      const slots = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) slots.push([100 + c * 115 + (r % 2) * 40, 384 + r * 60]);
      const g = K.rng(21);
      for (let i = slots.length - 1; i > 0; i--){ const j = Math.floor(g() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
      slots.slice(0, nOx).forEach(([x, y], i) => { f += molJig(K, 'pox', x, y, 80 + i, TIP_POX); });
      slots.slice(nOx, nOx + nH).forEach(([x, y], i) => { f += K.jiggle(x, y, 'h', 120 + i, 9, tip('H⁺ — 산. 산화막을 녹인다')); });
      const nCu = Math.round(1 + 7 * K.clamp((Math.log10(Math.max(m.r, 1)) - 1.5) / 2.2));
      // 떠나는 Cu²⁺는 산화막 이름표(x 60~500) 오른쪽에서만 올라간다 — 움직이는 이온이 글자를 가리지 않게
      for (let i = 0; i < nCu; i++){ const x = 540 + (i + 0.5) * 380 / nCu; f += K.ionPath(`M${x.toFixed(0)},${(fy - 6).toFixed(0)} C${x.toFixed(0)},${(fy - 80).toFixed(0)} ${(x + 30).toFixed(0)},${(fy - 140).toFixed(0)} ${(x + 50).toFixed(0)},${(fy - 200).toFixed(0)}`, 'cu', 3.2, i * 3.2 / nCu, tip('녹아 나가는 Cu²⁺')); }
      ctx.$('[data-v="film"]').innerHTML = f;
      // 식 상자 둘째 줄: 지금 값
      ctx.$('[data-v="eqn"]').innerHTML = LB(T(84, 264, `= ${fmt(m.rox)} × ${fmt(m.rdis)} ÷ ${fmt(m.rox + m.rdis)} × ${m.g.toFixed(2)} ≈ ${fmt(m.r)} nm/분`, 'pl-eqn', 'start'));
      // 오른쪽 막대 (로그) — 느린 쪽 표시 · 부동태로 준 몫 빗금 · 표면 색 견본
      const V = [m.rox, m.rdis, m.r], CL = ['et02-bar', 'et02-bar2', 'et02-bar3'];
      let br = '';
      V.forEach((v, i) => {
        const hgt = Math.max(3, bh(v)), x = BARX[i];
        const mark = i < 2 && (slow === i || slow === 2);                 // 느린 쪽 (비슷하면 둘 다)
        br += R(x, BY0 - hgt, BARW, hgt, CL[i] + (mark ? ' et02-slowb' : ''), tip(['산화 빠르기 — 산화제가 표면의 Cu에서 전자를 빼앗는 빠르기', '녹이기 빠르기 — 산이 산화막을 녹여 내는 빠르기', '표면 반응 빠르기 — 두 일을 차례로 + 부동태'][i] + ` · ${fmt(v)} nm/분`));
        const top = i === 2 ? Math.max(bh(m.rs), hgt) : hgt;            // 결과 막대는 빗금 칸 위에 값을 쓴다
        br += LB(T(x + BARW / 2, BY0 - top - 12, fmt(v), 'pl-val'));
        if (mark) br += LB(T(x + BARW / 2, BY0 - hgt - 42, slow === 2 ? '비슷' : '느린 쪽', 't-warn'));
      });
      if (m.g < 1){
        const h1 = bh(m.r), h2 = bh(m.rs);
        br += R(BARX[2], BY0 - h2, BARW, Math.max(2, h2 - h1), 'et02-pass', tip(`부동태로 줄어든 몫 — 산화막이 덮지 않았다면 ${fmt(m.rs)} nm/분`));
        br += LB(T(1540, 664, `점선 칸 = 부동태로 줄어든 ${pass} %`, 'pl-warn', 'end'));
      }
      br += C(1096, 716, 30, 'et02-sw', {style: `fill:${swatch(K.clamp((th - 0.15) / 0.8))}`, 'data-tip': '표면 색 (개념) — 산화막이 두꺼울수록 어둡고 얼룩진다'});
      br += LB(T(1140, 708, '표면 색 (개념)', 't-dim', 'start') + T(1140, 738, SW[film], film ? 't-warn' : 't-sub', 'start'));
      ctx.$('[data-v="bars"]').innerHTML = br;
      // 아래 패널: 느린 쪽 칩 꼬리표 + 지금 값 읽기
      let sl = '';
      (slow === 2 ? [0, 1] : [slow]).forEach(i => { const x = CHX[i]; sl += R(x, 826, 440, 110, 'et02-slowc', {rx: 12}) + G(R(x + 318, 898, 108, 30, 'et02-tag', {rx: 7}) + T(x + 372, 920, slow === 2 ? '비슷' : '느린 쪽', 'et02-tagt')); });
      ctx.$('[data-v="slow"]').innerHTML = G(sl, K.only('bal'));
      const adv = th > 0.7 ? '산이 모자랍니다 — 산화제를 더 넣어도 빨라지지 않고 산화막만 쌓여 얼룩지며 오히려 느려집니다. 산을 늘려 보세요.'
        : th > 0.55 ? '녹이기(산)가 조금 더 느립니다 — 산화막이 쌓이기 시작합니다. 산화제만 더 넣으면 곧 부동태 쪽으로 넘어갑니다.'
        : th >= 0.45 ? '두 일이 비슷합니다 — 산화막이 조금 쌓이기 시작합니다. 산화제만 더 넣으면 곧 산이 모자라는 쪽으로 넘어갑니다.'
        : th >= 0.3 ? '산화가 조금 더 느려 산화제가 빠르기를 정합니다 — 다만 산의 여유가 크지 않아, 산화제를 늘리면 곧 두 일이 비슷해집니다.'
        : st.ox < 0.1 ?'산화제가 묽어 밝고 고르지만 느립니다 — 산화제가 표면 반응 빠르기를 정합니다.'
        : '산은 넉넉하고 산화제가 표면 반응 빠르기를 정합니다 — 표면이 밝고 고르게 녹습니다.';
      ctx.$('[data-v="read"]').innerHTML = LB(T(80, 984, `지금: 산화 ${fmt(m.rox)} · 녹이기 ${fmt(m.rdis)} nm/분 → 느린 쪽: ${SLL[slow]} → 표면 반응 약 ${fmt(m.r)} nm/분`, 't-sub', 'start') +
        T(80, 1018, `산화막 ${FN[film]} (θ ${th.toFixed(2)}) · 부동태로 준 몫 ${pass} % — 실제 식각 속도는 공급(흐름)과 함께 정해져 기준 액에서 약 300 nm/분 (03장)`, 't-dim', 'start') +
        T(80, 1052, adv, th > 0.7 ? 'pl-warn' : 't-dim', 'start'));
      // 카드
      ctx.out('k-r', fmt(m.r)); ctx.out('k-slow', SL[slow]); ctx.out('k-film', FN[film]); ctx.out('k-th', th.toFixed(2)); ctx.out('k-pass', `${pass} %`);
      kcls('k-film', ['ok', 'warn', 'ng'][film]); kcls('k-pass', pass === 0 ? 'ok' : pass < 20 ? 'warn' : 'ng'); kcls('k-r', m.r < 100 ? 'ng' : null);
      let msg = `산화 <b>${fmt(m.rox)}</b> · 녹이기 <b>${fmt(m.rdis)}</b> nm/분 → 표면 반응 <b>${fmt(m.r)} nm/분</b>. `;
      if (th > 0.7) msg += `<b>산화제에 비해 산이 모자랍니다</b> — 산화제를 더 넣어도 빨라지지 않고 산화막만 쌓여 얼룩지며, 오히려 느려집니다(부동태로 ${pass} % 줆). 산을 늘려 보세요.`;
      else if (th < 0.45 && th >= 0.3) msg += '산화가 조금 더 느려 산화제가 표면 반응 빠르기를 정합니다 — 다만 산의 여유가 크지 않아, 산화제를 늘리면 곧 두 일이 비슷해지고 산화막이 쌓이기 시작합니다. 실제 식각 속도는 흐름(공급)과 함께 정해집니다 (<a data-go="rate.which">03장</a>).';
      else if (th < 0.45) msg += '산은 넉넉하고 산화제가 표면 반응 빠르기를 정합니다 — 표면이 밝고 고릅니다. 실제 식각 속도는 흐름(공급)과 함께 정해집니다 (<a data-go="rate.which">03장</a>).';
      else if (th > 0.55) msg += '녹이기(산)가 조금 더 느립니다 — 못 녹인 산화막이 쌓이기 시작합니다(중간). 산화제만 더 넣으면 곧 부동태 쪽(θ > 0.7)으로 넘어가니 산을 함께 늘립니다.';
      else msg += '두 일이 비슷합니다 — 산화막이 조금 쌓이기 시작합니다(중간). 산화제만 더 넣으면 곧 산이 모자라는 쪽으로 넘어갑니다.';
      if (st.ac < 0.05) msg += ' 산이 없으면 녹이기가 막힙니다 (물 · 녹은 Cu 몫 50 nm/분뿐).';
      ctx.q('[data-o=msg]').innerHTML = msg;
      ctx.refresh();
    }
    ctx.range('ox', v => { st.ox = v; render(); return v.toFixed(2) + ' wt%'; });
    ctx.range('ac', v => { st.ac = v; render(); return v.toFixed(2) + ' wt%'; });
    // 손으로 움직이면 그 값을 그대로 두고, 균형이 보이는 단계로
    [inOx, inAc].forEach(i => i && i.addEventListener('input', () => { touched = true; const sid = ctx.step(); if (sid && sid !== 'bal') ctx.go('bal'); }));
    ctx.demo = sid => {
      if (touched) return ctx.refresh();
      const d = DEMO[sid] || DEMO.ox;
      inOx.value = d[0]; inAc.value = d[1]; st.ox = d[0]; st.ac = d[1];
      ctx.out('ox', d[0].toFixed(2) + ' wt%'); ctx.out('ac', d[1].toFixed(2) + ' wt%');
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['산화 · 환원', '산화 = 전자를 잃음, 환원 = 전자를 얻음. 식각에서 금속(Cu)은 산화되어 녹고, 산화제는 환원된다'],
      ['산화제', '전자를 받아 가는 약품 — 과산화수소(H₂O₂) · 과황산염(S₂O₈²⁻) · 산소 · Fe³⁺ 등'],
      ['착화제 · 킬레이트', '금속 이온을 감싸 물에 녹게 하거나 붙잡아 두는 분자 — 암모니아, EDTA 계열, 에틸렌디아민 계열 등'],
      ['산화막 (Cu)', 'CuO · Cu₂O. 갈색~검은색의 얇은 막. 산이 모자라면 녹지 못하고 쌓인다'],
      ['부동태', '표면을 덮은 얇은 산화막이 반응을 막아 잘 녹지 않는 상태'],
      ['애노드 · 캐소드 (식각에서)', '같은 표면에서 전자를 내놓는 자리(애노드 · 녹는 쪽)와 받는 자리(캐소드 · 산화제가 환원되는 쪽). 저절로 일어나는 전지와 도금(전기분해)은 +/− 가 반대로 보여 헷갈리므로, 이 탭은 \'양극 · 음극\' 대신 이 이름을 쓴다'],
      ['안정제', '과산화수소가 저절로 분해되는 것을 늦추는 첨가제'],
      ['식각 속도 (nm/분)', '1분에 녹아 없어지는 두께. 이 탭의 기준 액(H₂O₂ 0.15 wt% + 황산 약 2 wt% · 25 °C · 회전 스프레이)은 Cu 시드에서 약 300 nm/분 (예시)']
    ]) + K.field([
      '식각 직후 Cu 표면이 거무스름하거나 얼룩지면 <b>산화제에 비해 산이 모자라거나</b>, 헹굼이 늦어 표면에서 반응이 이어진 것을 의심합니다 → <a data-go="tool.rinse">08장</a>.',
      '식각액은 \'지울 것을 빨리\'보다 <b>\'남길 것을 안 다치게\'</b>로 고릅니다. 범프에는 Cu 기둥 · Ni · SnAg가 함께 있습니다 → <a data-go="ti.sel">06장</a>.',
      '과산화수소 계열은 시간이 지나면 저절로, 녹은 Cu²⁺가 있으면 더 빨리 분해됩니다. 같은 레시피에서 점점 덜 지워지면 <b>액 나이</b>부터 봅니다 → <a data-go="tool.bath">08장</a>.',
      '안전: 과산화수소(분해할 때 가스 · 열), 산 · 알칼리, 암모니아(배기), 불산(피부로 스며 뼈 · 칼슘에 해로움 — 전용 보호구 · 해독제). 사내 안전 규정을 따릅니다.'
    ]) + K.deep(`<ul>
      <li><b>전선 없는 전지</b> — 식각은 같은 표면에서 금속 산화(애노드 반응)와 산화제 환원(캐소드 반응)이 같은 크기의 전류로 함께 일어나는 일입니다(혼합 전위 이론, Wagner–Traud 1938). 식각 속도는 이 '부식 전류'로 나타낼 수 있고, 패러데이 법칙으로 1 A/m² ≈ Cu 2.2 nm/분입니다. 300 nm/분 식각은 약 1.4 ASD 도금을 거꾸로 돌리는 것과 같습니다(→ <a href="#go-plating-02">전해도금 02장</a>).</li>
      <li><b>반응식</b> — 과산화수소 + 산: Cu + H₂O₂ → CuO + H₂O, CuO + H₂SO₄ → CuSO₄ + H₂O. 과황산염: Cu + S₂O₈²⁻ → Cu²⁺ + 2SO₄²⁻. 암모니아: Cu + Cu(NH₃)₄²⁺ → 2Cu(NH₃)₂⁺, 공기 산소가 다시 Cu(NH₃)₄²⁺로 되돌립니다.</li>
      <li><b>얼마나 쓰나</b> — Cu 1 mol(63.5 g)에 H₂O₂ 1 mol(34 g). 300 mm 웨이퍼에서 300 nm 시드를 면적의 약 90 % 지운다면(예시) Cu 약 0.17 g → H₂O₂ 약 0.09 g(화학양론). 실제로는 분해되는 몫이 더해집니다.</li>
      <li><b>산화제가 많다고 늘 빠르지 않다</b> — Cu 연마(CMP) 액 연구들은 과산화수소를 늘리면 Cu 용해가 어느 농도(pH · 착화제에 따라 약 0.25~3 %)까지 늘다가, 그 뒤 표면 산화막이 막아 줄어든다고 보고합니다. 위젯의 부동태 몫 g(θ)는 이 경향을 단순화한 개념 가정입니다(산 0.2 wt%에서 H₂O₂ 약 0.16 wt% 근처 최대 → 1 wt%에서 약 330 nm/분). 산 · 착화제가 넉넉하면 최대가 높은 농도 쪽으로 밀립니다.</li>
      <li><b>전위–pH 그림(푸르베)</b> — Cu는 산성 · 산화 조건에서 Cu²⁺가 안정해 녹고, 중성 근처에서는 CuO · Cu₂O가 안정해 막이 됩니다. 알칼리에서는 암모니아 같은 착화제가 있어야 녹습니다. 액을 'Cu²⁺(또는 착이온)가 안정한 구역'에 두는 것이 기본입니다.</li>
      <li><b>과산화수소 분해</b> — 2H₂O₂ → 2H₂O + O₂. Cu²⁺ · Fe³⁺ 같은 금속 이온이 빠르게 합니다. 그래서 안정제를 넣고, 녹은 Cu가 쌓이는 순환 액은 수명이 있습니다. O₂ 거품이 표면에 붙으면 국부 미식각 · 얼룩이 됩니다(→ <a data-go="tool.bath">08장</a>).</li>
      <li><b>Sn과의 궁합</b> — 인쇄회로기판 경험에서 과산화수소 + 황산 식각은 순수 Sn 마스크를 공격하기 쉽고, 암모니아(알칼리) 계열은 Sn · Ni 금속 마스크와 함께 쓰며, 염화제2구리는 금속 마스크와 맞지 않습니다. 범프의 SnAg 모자도 같은 이유로 식각액 조성 · 억제제 · pH를 고릅니다(조건에 따라 → <a data-go="ti.sel">06장</a>).</li></ul>`);
  },
  css: `.et02-cuic{fill:#f59e0b}
.pl-ion.et02-pox circle{fill:#5eead4;stroke:#ccfbf1}
.pl-ion.et02-pox text{font-size:11.5px;fill:#042f2e !important}
.pl-ion.et02-h2o circle{fill:#bae6fd;stroke:#f0f9ff}
.pl-ion.et02-h2o text{font-size:10.5px;fill:#0c2a3d !important}
.pl-ion.et02-nh3 circle{fill:#fda4af;stroke:#ffe4e6}
.pl-ion.et02-nh3 text{font-size:10px;fill:#4c0519 !important}
.et02-bar{fill:#38bdf8}
.et02-bar2{fill:#a78bfa}
.et02-bar3{fill:#fbbf24}
.pl-svg .et02-slowb{stroke:#f59e0b;stroke-width:4}
.pl-svg .et02-slowc{fill:none;stroke:#f59e0b;stroke-width:3}
.pl-svg .et02-pass{fill:rgba(245,158,11,.14);stroke:#f59e0b;stroke-width:2;stroke-dasharray:4 4}
.pl-svg .et02-sw{stroke:#e2e8f0;stroke-width:1.6}
.pl-svg .et02-onp{font-size:19px;font-weight:700;fill:#ecfdf5 !important;stroke:rgba(4,30,24,.75) !important}
.pl-svg .et02-on{font-size:20px;font-weight:800;fill:#2a1606 !important;stroke:none !important}
.pl-svg .et02-eq{font-family:var(--mono) !important;font-size:16.5px;font-weight:800;fill:#fde68a !important}
.pl-svg .et02-tgt{fill:rgba(251,191,36,.25);stroke:#fbbf24;stroke-width:2.4;stroke-dasharray:7 5}
.pl-svg .et02-x{stroke:#f87171;stroke-width:4;stroke-linecap:round}
.pl-svg .et02-blot{fill:#24130b;opacity:.8}
.et02-tag{fill:rgba(245,158,11,.22);stroke:#f59e0b;stroke-width:1.4}
.pl-svg .et02-tagt{font-size:18px;font-weight:800;fill:#fcd34d !important;text-anchor:middle}`
});
})();
