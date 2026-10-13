/* 전해도금 10 — 금속별 도금액: Cu · Ni · SnAg (도금액 3종) */
(function(){
// Sn–Ag 액상선 (wt% Ag, °C) — 개략. Sn 231.9 °C, 공정점 약 3.5 wt% · 221 °C, Ag가 많은 쪽은 가파르게 오른다
const LIQ = [[0, 231.9], [1, 228.8], [2, 225.7], [3, 222.6], [3.5, 221], [4, 229], [5, 244], [6, 257], [7, 268], [8, 278]];
const liq = x => { x = Math.max(0, Math.min(8, x)); for (let k = 1; k < LIQ.length; k++) if (x <= LIQ[k][0]){ const [a, ta] = LIQ[k - 1], [b, tb] = LIQ[k]; return ta + (tb - ta) * (x - a) / (b - a); } return LIQ[LIQ.length - 1][1]; };
// 개념 모델: Ag 부분 전류 = 반응 몫 + 공급 한계 몫(교반의 제곱근에 비례), 나머지는 Sn
function agWt(J, agit, conc){
  const iAg = 0.004 * J * conc + 0.0595 * Math.sqrt(agit) * conc * J / (J + 1);
  const mAg = iAg * 107.87, mSn = Math.max(1e-9, J - iAg) * 118.71 / 2;
  return 100 * mAg / (mAg + mSn);
}
const PD = {x0: 520, x1: 1130, y0: 1060, y1: 740, t0: 200, t1: 300, a1: 8};   // 상태도 영역
const px = a => PD.x0 + a / PD.a1 * (PD.x1 - PD.x0), py = t => PD.y0 - (t - PD.t0) / (PD.t1 - PD.t0) * (PD.y0 - PD.y1);
const BATHS = [
  {id: 'cu', x: 40, nm: 'Cu 도금액', ions: ['cu', 'so4', 'h', 'cl'], lines: ['황산구리 + 황산 + Cl⁻ (ppm)', '+ 첨가제 3종 (05장)', '양극: 인 함유 구리 — 녹아서 보충', '역할: 범프의 몸통 · 높이 · 전기 길', '관리: Cu · 산 · Cl · 첨가제 · 양극'], layer: 'cu'},
  {id: 'ni', x: 560, nm: 'Ni 도금액', ions: ['ni', 'h', 'cl'], lines: ['설파민산 니켈 + 붕산 (pH 완충)', '+ 소량 염화물 · 습윤제', '양극: 니켈 — 녹아서 보충', '역할: Cu와 솔더 사이 방벽', '관리: pH · 온도 · 응력 · 표면 산화'], layer: 'ni'},
  {id: 'snag', x: 1080, nm: 'SnAg 도금액', ions: ['sn', 'ag', 'ms', 'sn4'], lines: ['메탄설폰산(MSA) + Sn²⁺ + Ag⁺', '+ 착화제 (Ag를 붙잡아 둔다)', '양극: 불용성 + 분리막 (약품 보충)', '역할: 녹아서 붙는 솔더', '관리: Sn²⁺ · Ag · 산 · Sn⁴⁺ · 착화제'], layer: 'sn'}
];
const DEMO = {comp: null};

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '10', id: 'chem', part: 3, short: 'Cu · Ni · SnAg', scale: '도금액 3종',
  title: '금속별 도금액 — Cu · Ni · SnAg',
  hook: 'Ag 몇 %가 녹는 온도를 바꾼다',
  one: '범프의 세 층은 각자 맡은 일이 있고, 도금액도 관리할 것도 다릅니다. 특히 SnAg는 두 금속이 함께 쌓이는 합금이라, 조건이 조금만 달라져도 조성(Ag %)과 녹는 온도가 달라집니다.',
  ana: '<b>세 층 케이크</b> — Cu는 키를 세우는 시트, Ni는 시트에 크림이 스며들지 않게 막는 얇은 막, SnAg는 녹아서 다른 칩에 붙는 맨 위 크림입니다. 크림 배합(Ag %)이 바뀌면 녹는 온도가 바뀝니다.',
  steps: [
    {id: 'cu', t: 'Cu — 몸통', d: '황산구리 + 황산 + 아주 적은 Cl⁻ + 첨가제. 인이 조금 든 구리 양극이 녹아 이온을 보충하고, 양극 표면의 검은 피막이 고르게 녹도록 돕습니다. 범프의 높이와 전기 · 열의 길을 만듭니다.'},
    {id: 'ni', t: 'Ni — 방벽', d: '설파민산 니켈 + 붕산(pH 완충). Cu가 솔더와 지나치게 반응(IMC 과성장)하는 것을 늦추는 방벽입니다. pH · 온도 · 응력을 관리하고, Ni 표면이 산화되면 다음 층이 잘 붙지 않으니 빨리 넘깁니다.'},
    {id: 'snag', t: 'SnAg — 솔더', d: 'Ag는 Sn보다 훨씬 귀한 금속이라 그냥 두면 Ag만 먼저 · 저절로 석출됩니다 → 착화제로 붙잡아 둡니다. Sn²⁺는 공기 · 양극에서 Sn⁴⁺로 산화되어 뿌연 슬러지가 됩니다.'},
    {id: 'comp', t: 'SnAg 조성과 녹는 온도', d: 'Ag는 농도가 낮아 공급(확산)에 좌우되고 Sn은 전류에 좌우됩니다 → 전류밀도↑ Ag %↓, 교반↑ Ag %↑. Ag가 공정 조성(약 3.5 %)보다 많으면 다 녹는 온도가 빠르게 올라 리플로우에서 덜 녹을 수 있습니다.'}
  ],
  icon(K){
    const {R} = K;
    return R(16, 30, 36, 32, 'f-cu2') + R(16, 22, 36, 8, 'f-ni') + R(14, 4, 40, 18, 'f-sn2');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT} = K;
    let s = '';
    BATHS.forEach((b, i) => {
      let g = R(b.x, 130, 500, 520, 'pl-panel', {rx: 16}) + R(b.x, 130, 500, 520, 'pl-hlbox', W({rx: 16}, only(b.id === 'snag' ? 'snag comp' : b.id)));
      g += T(b.x + 24, 172, b.nm, 't-acc', 'start');
      // 비커
      g += P(`M${b.x + 30},200 L${b.x + 30},378 Q${b.x + 30},392 ${b.x + 44},392 L${b.x + 276},392 Q${b.x + 290},392 ${b.x + 290},378 L${b.x + 290},200`, 'f-tank') + R(b.x + 33, 230, 254, 159, 'f-bath');
      b.ions.forEach((k, j) => { for (let n = 0; n < 2; n++) g += K.jiggle(b.x + 70 + ((j * 2 + n) % 4) * 58, 268 + Math.floor((j * 2 + n) / 4) * 62, k, i * 20 + j * 3 + n, 8); });
      if (b.id === 'snag') g += C(b.x + 70 + 116, 268, 26, 'pl-cplx', tip('착화제가 Ag⁺를 감싸 붙잡아 둔다'));
      // 범프 (이 층 강조)
      const bx = b.x + 330, bw = 120;
      g += R(bx, 330, bw, 60, 'f-cu2' + (b.layer === 'cu' ? ' pl-lyon' : ' pl-lyoff')) + R(bx, 314, bw, 16, 'f-ni' + (b.layer === 'ni' ? ' pl-lyon' : ' pl-lyoff')) + P(`M${bx},314 L${bx},262 Q${bx + bw / 2},226 ${bx + bw},262 L${bx + bw},314 Z`, 'f-sn2' + (b.layer === 'sn' ? ' pl-lyon' : ' pl-lyoff'));
      g += R(bx - 10, 390, bw + 20, 8, 'f-seed2') + T(bx + bw / 2, 424, '범프에서 이 층', 't-dim');
      g += TT(b.x + 24, 456, b.lines, 't-sub', 'start', 38);
      s += G(g, tip(b.nm));
    });
    // 아래: SnAg 조성
    s += R(40, 680, 1540, 440, 'pl-panel', {rx: 16}) + R(40, 680, 1540, 440, 'pl-hlbox', W({rx: 16}, only('comp')));
    s += T(64, 722, 'SnAg 조성 → 녹는 온도 (개략 상태도)', 't-acc', 'start');
    // 상태도 축
    s += L(PD.x0, PD.y0, PD.x1 + 10, PD.y0, 's-axis') + L(PD.x0, PD.y0, PD.x0, PD.y1 - 10, 's-axis');
    for (let a = 0; a <= 8; a += 1) s += L(px(a), PD.y0, px(a), PD.y0 + 8, 's-axis') + T(px(a), PD.y0 + 30, String(a), 't-dim');
    for (let t = 200; t <= 300; t += 20) s += L(PD.x0 - 8, py(t), PD.x0, py(t), 's-axis') + T(PD.x0 - 14, py(t) + 7, String(t), 't-dim', 'end');
    s += LB(T((PD.x0 + PD.x1) / 2, PD.y0 + 54, 'Ag (무게 %)', 't-sub') + T(PD.x0 - 14, PD.y1 - 22, '°C', 't-dim', 'end'));
    let lq = '';
    for (let a = 0; a <= 8.0001; a += 0.1) lq += (lq ? ' L' : 'M') + px(a).toFixed(1) + ',' + py(liq(a)).toFixed(1);
    s += P(lq + ` L${px(8)},${py(PD.t1)} L${px(0)},${py(PD.t1)} Z`, 'pl-liqz') + P(lq, 's-curve', tip('액상선 — 이 온도 위에서 다 녹는다 (개략)'));
    s += L(px(0), py(221), px(8), py(221), 's-dash') + C(px(3.5), py(221), 7, 'k-acc2', tip('공정점 — 약 3.5 % Ag, 221 °C. 한 온도에서 한꺼번에 녹는다'));
    s += LB(T(px(0.3), py(290), '다 녹음 (액체)', 't-sub', 'start') + T(px(6.4), py(230), '고체 Ag₃Sn + 액체', 't-dim', 'middle') + T(px(1.6), py(212), '고체', 't-dim') + T(px(3.5), py(221) + 30, '3.5 % · 221 °C', 't-warn'));
    s += `<g data-v="pd"></g><g data-v="bump"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — SnAg 조성</div>
      ${K.ctl('j', '전류밀도 (ASD)', 1, 15, 0.5, 5)}${K.ctl('a', '교반 (배수)', 0, 100, 1, 50)}${K.ctl('c', '액의 Ag 농도 (목표 대비)', 0.6, 1.4, 0.05, 1)}${K.ctl('pk', '리플로우 최고 온도 (°C, 예시)', 230, 270, 1, 250)}
      ${K.kpis([['Ag', 'k-ag', '무게 %'], ['다 녹는 온도', 'k-tl', '액상선'], ['판정', 'k-v', '']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('Ag 부분 전류 = 작은 반응 몫 + 공급 한계 몫(√교반에 비례) × J/(J+1). 상태도는 개략입니다. 실제 경향 · 값은 약품 · 장비마다 다르니 사내 데이터로 확인하세요.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip} = K;
    const st = {j: 5, a: 50, c: 1, pk: 250};
    const agMul = v => 0.25 * Math.pow(16, v / 100);          // ×0.25 ~ ×4
    function render(){
      const ag = agWt(st.j, agMul(st.a), st.c), tl = liq(ag), margin = st.pk - tl;
      const v = margin >= 15 ? ['다 녹음 — 여유 있음', 'ok'] : margin >= 0 ? ['다 녹음 — 여유 적음', 'warn'] : ['덜 녹음 — 비용융 위험', 'ng'];
      let pd = L(px(Math.min(8, ag)), PD.y0, px(Math.min(8, ag)), py(tl), 's-dash') + L(px(0), py(st.pk), px(8), py(st.pk), 'pl-peak');
      pd += LB(T(px(8) - 4, py(st.pk) - 10, `리플로우 최고 ${st.pk} °C`, 'pl-pkt', 'end'));
      pd += C(px(Math.min(8, ag)), py(tl), 11, v[1] === 'ok' ? 'k-ok' : v[1] === 'warn' ? 'k-warn' : 'k-ng') + C(px(Math.min(8, ag)), py(tl), 20, 'co-ring');
      pd += LB(T(px(Math.min(8, ag)) + (ag > 6 ? -18 : 18), py(tl) - 22, `${ag.toFixed(1)} % → ${tl.toFixed(0)} °C`, 't-warn', ag > 6 ? 'end' : 'start'));
      ctx.$('[data-v="pd"]').innerHTML = pd;
      // 범프 단면: 녹았는가
      const bx = 140, bw = 200, by = 1000;
      let b = R(bx - 30, by + 50, bw + 60, 14, 'f-seed2') + R(bx, by - 60, bw, 110, 'f-cu2') + R(bx, by - 78, bw, 18, 'f-ni');
      if (v[1] !== 'ng') b += P(`M${bx},${by - 78} C${bx - 10},${by - 120} ${bx},${by - 190} ${bx + bw / 2},${by - 196} C${bx + bw},${by - 190} ${bx + bw + 10},${by - 120} ${bx + bw},${by - 78} Z`, 'f-sn2', tip('다 녹아 둥글어진 솔더'));
      else { b += P(`M${bx},${by - 78} L${bx},${by - 170} L${bx + 40},${by - 182} L${bx + 70},${by - 168} L${bx + 120},${by - 186} L${bx + 160},${by - 170} L${bx + bw},${by - 178} L${bx + bw},${by - 78} Z`, 'f-sn2', tip('덜 녹은 솔더 — 모양이 둥글지 않다')); for (let k = 0; k < 4; k++) b += R(bx + 24 + k * 44, by - 160 + (k % 2) * 30, 30, 8, 'pl-ag3', W2(tip('고체로 남은 Ag₃Sn 판'), {transform: `rotate(${k * 25 - 30} ${bx + 39 + k * 44} ${by - 156 + (k % 2) * 30})`})); }
      b += T(bx + bw / 2, 760, v[0], v[1] === 'ng' ? 'pl-warn' : 't-sub') + T(bx + bw / 2, 790, '리플로우 뒤 (예시)', 't-dim');
      ctx.$('[data-v="bump"]').innerHTML = b;
      ctx.out('k-ag', ag.toFixed(1) + ' %'); ctx.out('k-tl', tl.toFixed(0) + ' °C'); ctx.out('k-v', v[0].split(' — ')[0]);
      const kv = ctx.card.querySelector('[data-o="k-v"]').parentNode;
      ['ok', 'warn', 'ng'].forEach(c => kv.classList.toggle(c, v[1] === c));
      ctx.q('[data-o=msg]').innerHTML = `전류밀도를 올리면 Ag %가 내려가고, 교반을 세게 하면 올라갑니다. ${ag > 3.5 ? `Ag가 공정 조성(3.5 %)보다 많아 <b>다 녹는 온도가 ${tl.toFixed(0)} °C</b>로 올랐습니다.` : `공정 조성(3.5 %)보다 적은 쪽은 녹는 온도가 천천히 변합니다(Sn 232 °C → 221 °C).`}`;
      ctx.refresh();
    }
    const W2 = (...os) => Object.assign({}, ...os);
    const go = () => { if (ctx.step() && ctx.step() !== 'comp') ctx.go('comp'); };
    ctx.range('j', v => { st.j = v; render(); return v.toFixed(1); });
    ctx.range('a', v => { st.a = v; render(); return '×' + agMul(v).toFixed(2); });
    ctx.range('c', v => { st.c = v; render(); return '×' + v.toFixed(2); });
    ctx.range('pk', v => { st.pk = v; render(); return v + ' °C'; });
    ctx.card.querySelectorAll('input').forEach(i => i.addEventListener('input', go));
  },
  notes(K){
    return K.terms([
      ['인 함유 구리 양극', '인(P)이 아주 조금 든 구리. 표면에 검은 피막이 생겨 고르게 녹고 찌꺼기가 줄어든다'],
      ['설파민산 니켈', '응력이 낮은 Ni 도금액. 붕산이 표면 근처 pH가 오르는 것을 막는다'],
      ['MSA', '메탄설폰산. SnAg 도금액의 산. 금속염이 잘 녹고 비교적 다루기 쉽다'],
      ['착화제', '금속 이온을 감싸 붙잡아 두는 분자. Ag가 혼자 먼저 석출되는 것을 막는다'],
      ['치환 석출', '전류 없이 귀한 금속(Ag)이 덜 귀한 금속(Sn) 위에 저절로 석출되는 것'],
      ['공정 조성', '한 온도에서 한꺼번에 녹는 조성. Sn–Ag는 약 3.5 % Ag, 221 °C'],
      ['액상선', '이 온도 위에서는 다 녹는 선. 공정 조성에서 멀어질수록 오른다']
    ]) + K.field([
      '<b>Ag 함량은 공급(확산)에 민감합니다.</b> 장비마다 흐름 방식이 다르거나 같은 웨이퍼 안에서도 흐름이 다르면 Ag가 달라질 수 있습니다. 비용융(덜 녹음)이 보이면 Ag 분포와 흐름 · 전류밀도를 함께 봅니다.',
      'Sn²⁺가 Sn⁴⁺로 산화되면 Sn이 줄고 슬러지(입자)가 생깁니다. 공기 접촉 · 온도 · 양극 반응을 줄이고, 필터와 Sn⁴⁺ 분석을 관리합니다.',
      'Ni 도금 뒤 시간이 지나면 Ni 표면이 산화(부동태)되어 SnAg가 잘 붙지 않을 수 있습니다. 층 사이 린스 · 대기 시간 · 활성화를 관리합니다.',
      'Cu → Ni → SnAg 순서는 같아도 층마다 두께 목적이 다릅니다: Cu는 높이, Ni는 방벽 두께(소모량 고려), SnAg는 접합에 필요한 솔더 양.'
    ]) + K.deep(`<ul>
      <li><b>왜 Ag가 공급에 민감한가</b> — Ag는 Sn보다 훨씬 쉽게 석출되는(귀한) 금속인데 액 속 농도는 Sn보다 훨씬 낮습니다. 그래서 Ag는 표면에 오는 대로 거의 다 쌓이는 "공급 한계"에 가깝고, Sn은 전류가 정합니다. 전류를 올리면 Sn만 늘어 Ag 비율이 줄고, 교반을 세게 하면 Ag 공급이 늘어 비율이 오릅니다. 착화제는 이 민감도를 줄이는 쪽으로 작용합니다.</li>
      <li><b>Sn–Ag 상태도</b> — Sn 쪽에서 Ag가 늘면 녹는 온도가 232 → 221 °C로 내려가고(공정점 약 3.5 %), 그보다 많아지면 고체 Ag₃Sn이 먼저 생기며 다 녹는 온도가 가파르게 오릅니다. 리플로우 최고 온도가 액상선보다 낮으면 Ag₃Sn이 고체로 남아 모양이 덜 둥글고 접합이 나빠질 수 있습니다.</li>
      <li><b>Ag₃Sn 판</b> — Ag가 많으면 냉각 중 큰 판 모양 Ag₃Sn이 자라 기계적 성질에 영향을 줄 수 있습니다.</li>
      <li><b>Ni의 역할과 소모</b> — Ni는 Sn과 반응해 Ni₃Sn₄ 등을 만들며 조금씩 소모됩니다. 다 소모되면 Cu가 솔더와 직접 반응하므로, 리플로우 횟수 · 고온 이력을 고려해 두께를 정합니다.</li>
      <li><b>양극과 분리막</b> — SnAg에서 불용성 양극을 쓰면 Sn · Ag를 약품으로 보충합니다. 분리막은 Ag가 양극 쪽에서 반응하거나 첨가제 · Sn²⁺가 양극에서 산화되는 것을 줄입니다.</li></ul>`);
  }
});
})();
