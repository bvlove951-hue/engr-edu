/* 전해도금 08 — 패턴 효과: 다이 안, 범프 하나 안 (다이 · mm / 범프 · µm) */
(function(){
const BASE = 600, PRT = 404, OW = 34;                              // 단면: 시드 위치, PR 윗면, 구멍 폭
const OPEN = [110, 172, 234, 296, 358, 420, 700, 870, 932];         // 밀집 6 · 고립 1 · 작은 묶음 2
const DUMMY = [560, 622, 778];
const DIE = {x: 1070, y: 210, n: 9, p: 44};                          // 위에서 본 다이
// 위에서 본 범프 배치: 가운데 위쪽을 비우고 고립 범프 두 개
function diePts(){
  const out = [];
  for (let r = 0; r < DIE.n; r++) for (let c = 0; c < DIE.n; c++){
    const empty = r < 5 && c >= 3 && c <= 7, iso = (r === 1 && c === 5) || (r === 3 && c === 6);
    out.push({x: DIE.x + c * DIE.p, y: DIE.y + r * DIE.p, kind: iso ? 'iso' : empty ? 'gap' : 'bump'});
  }
  return out;
}

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '08', id: 'pattern', part: 2, short: '패턴 효과', scale: '다이 · mm / 범프 · µm',
  title: '패턴 효과 — 다이 안, 범프 하나 안',
  hook: '외로운 범프가 키가 크다',
  one: '전류는 열린 자리를 찾아 모입니다. 그래서 주변이 비어 있는 범프는 넓은 곳의 전류를 혼자 받아 더 높이 자라고, 같은 다이 안에서도 범프 높이가 달라집니다.',
  ana: '<b>비 오는 날의 깔때기</b> — 넓은 마당에 깔때기가 촘촘히 놓여 있으면 빗물을 나눠 받아 조금씩 찹니다. 혼자 떨어진 깔때기는 주변 빗물까지 받아 가장 빨리 찹니다. 고립 범프가 그 깔때기입니다.',
  steps: [
    {id: 'dens', t: '밀집 vs 고립', d: '주변에 열린 자리가 없는 고립 범프는 넓은 곳의 전류를 혼자 받아 높이 자랍니다. 밀집 구역은 전류를 나눠 가져 낮습니다 → 다이 안 높이 산포.'},
    {id: 'dummy', t: '대책 — 더미 범프', d: '빈 곳에 전류만 나눠 갖는 가짜 범프(더미)를 두거나, 설계에서 개구율을 고르게 합니다. 전류밀도를 낮추면 차이가 줄지만 느려집니다.'},
    {id: 'shape', t: '범프 하나의 윗면', d: '윗면은 볼록(돔) · 평평 · 접시(가장자리가 높음)가 될 수 있습니다. 첨가제(평탄제) · 전류밀도 · 흐름 · 구멍 크기가 정합니다. 높이를 어디서 재는지(중심 vs 최고점)도 정해 둬야 합니다.'},
    {id: 'deep', t: '깊은 구멍 — 기포와 확산 거리', d: '도금 초기가 구멍이 가장 깊어, 이온이 걸어와야 할 거리가 확산층 + 구멍 깊이로 깁니다. 구멍에 기포가 끼면 그 자리는 도금되지 않아 범프가 빠집니다 → 도금 전에 진공에서 구멍을 물로 먼저 채우는 프리웻.'}
  ],
  icon(K){
    const {R} = K;
    return R(2, 40, 8, 22, 'f-cu2') + R(14, 40, 8, 22, 'f-cu2') + R(26, 40, 8, 22, 'f-cu2') + R(50, 22, 10, 40, 'f-cu2') + R(0, 60, 64, 4, 'f-seed2');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT} = K;
    let s = '';
    // 위 왼쪽: 단면
    s += R(40, 130, 980, 530, 'pl-panel', {rx: 16}) + R(40, 130, 980, 530, 'pl-hlbox', W({rx: 16}, only('dens dummy'))) + T(64, 172, '다이 단면 — 전류는 열린 자리로 모인다', 't-acc', 'start');
    s += R(60, 200, 940, PRT - 200, 'f-bath') + R(60, BASE + 4, 940, 22, 'f-si') + R(60, BASE, 940, 4, 'f-seed2');
    s += `<g data-v="lines"></g><g data-v="xs"></g>`;
    s += LB(T(265, 650, '밀집 구역', 't-dim') + T(700, 650, '고립 범프', 't-dim') + T(900, 650, '작은 묶음', 't-dim'));
    // 위 오른쪽: 다이 높이 지도
    s += R(1040, 130, 540, 530, 'pl-panel', {rx: 16}) + R(1040, 130, 540, 530, 'pl-hlbox', W({rx: 16}, only('dens dummy'))) + T(1064, 172, '위에서 본 다이 — 범프 높이 (예시)', 't-acc', 'start');
    s += R(DIE.x - 24, DIE.y - 24, DIE.p * (DIE.n - 1) + 48, DIE.p * (DIE.n - 1) + 48, 'dp-pas', {rx: 6});
    s += `<g data-v="die"></g>`;
    s += LB(T(1064, 640, '빨강 = 높다 · 점선 = 더미 범프', 't-dim', 'start'));
    // 아래 왼쪽: 윗면 모양
    s += R(40, 690, 760, 430, 'pl-panel', {rx: 16}) + R(40, 690, 760, 430, 'pl-hlbox', W({rx: 16}, only('shape'))) + T(64, 732, '범프 하나의 윗면 — 어디서 재나?', 't-acc', 'start');
    const shapes = [['dome', '돔 (볼록)'], ['flat', '평평'], ['dish', '접시 (가장자리↑)']];
    shapes.forEach(([k, nm], i) => {
      const x = 80 + i * 240, w = 170, b = 1010, top = 840;
      const d = k === 'dome' ? `M${x},${b} L${x},${top + 30} Q${x + w / 2},${top - 30} ${x + w},${top + 30} L${x + w},${b} Z` : k === 'flat' ? `M${x},${b} L${x},${top} L${x + w},${top} L${x + w},${b} Z` : `M${x},${b} L${x},${top - 18} Q${x + 12},${top - 22} ${x + 30},${top} Q${x + w / 2},${top + 26} ${x + w - 30},${top} Q${x + w - 12},${top - 22} ${x + w},${top - 18} L${x + w},${b} Z`;
      let g = R(x - 20, b, w + 40, 14, 'f-seed2') + P(d, 'f-cu2');
      const cy = k === 'dome' ? top - 0 : k === 'flat' ? top : top + 13, my = k === 'dome' ? top - 0 : k === 'flat' ? top : top - 20, mx = k === 'dish' ? x + 6 : x + w / 2;
      g += C(x + w / 2, cy, 6, 'k-acc') + C(mx, my, 6, 'k-acc2');
      g += T(x + w / 2, 1060, nm, 't-sub') + R(x - 24, 790, w + 48, 290, 'pl-pick', {'data-shape': k});
      s += G(g, W({class: 'pl-shp', 'data-shape': k}, tip(nm + ' — 파랑 점: 중심 높이, 주황 점: 최고점')));
    });
    s += LB(C(82, 1100, 6, 'k-acc') + T(94, 1106, '중심 높이', 't-dim', 'start') + C(250, 1100, 6, 'k-acc2') + T(262, 1106, '최고점 — 무엇을 재는지 정해 둔다', 't-dim', 'start'));
    // 아래 오른쪽: 깊은 구멍
    s += R(830, 690, 750, 430, 'pl-panel', {rx: 16}) + R(830, 690, 750, 430, 'pl-hlbox', W({rx: 16}, only('deep'))) + T(854, 732, '깊은 구멍 — 처음이 가장 불리하다', 't-acc', 'start');
    const HX = 1110, HW = 90, HT = 800, HB = 1060;
    s += R(870, 760, 680, HT - 760, 'f-bath') + R(870, HT, HX - HW / 2 - 870, HB - HT, 'f-pr') + R(HX + HW / 2, HT, 1250 - HX - HW / 2, HB - HT, 'f-pr') + R(870, HB, 380, 12, 'f-seed2');
    s += `<g data-v="hole"></g>`;
    s += LB(P(`M884,770 l-8,0 l0,${HT - 770} l8,0`, 's-acc2') + T(896, (770 + HT) / 2 + 8, '확산층', 't-warn', 'start') + P(`M884,${HT + 4} l-8,0 l0,${HB - HT - 4} l8,0`, 's-acc2') + T(896, (HT + HB) / 2 + 8, '+ 구멍 깊이', 't-warn', 'start'));
    s += `<g data-v="deepmsg"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 패턴과 모양</div>
      ${K.ctl('j', '전류밀도 (패턴 효과의 크기)', 0, 100, 1, 60)}
      ${K.seg('dummy', [['0', '없음'], ['1', '있음']], '0', '더미 범프')}
      ${K.kpis([['고립 / 밀집 높이', 'k-r', ''], ['다이 안 산포', 'k-u', '(최고−최저)/평균']])}
      ${K.seg('shape', [['dome', '돔'], ['flat', '평평'], ['dish', '접시']], 'flat', '윗면')}
      <p class="pl-msg" data-o="shape"></p>
      ${K.seg('pw', [['0', '프리웻 없이'], ['1', '프리웻']], '1', '도금 전')}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('전류를 "가장 가까운 열린 자리"로 나눠 받는다고 보고 높이 ∝ (받는 폭)^α 로 그렸습니다. α는 전류밀도가 높을수록 큽니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip, rng} = K;
    let touched = false;
    const st = {j: 60, dummy: false, shape: 'flat', pw: true};
    const SHAPE_MSG = {
      dome: '<b>돔</b> — 가운데가 볼록. 평탄제가 부족하거나 가운데로 이온이 잘 오는 조건에서 흔합니다. 중심 높이 = 최고점.',
      flat: '<b>평평</b> — 보통 목표로 하는 모양. 평탄제 · 전류밀도 · 흐름이 균형을 이룬 상태입니다.',
      dish: '<b>접시</b> — 가장자리가 높고 가운데가 낮음. PR 벽 근처로 전류가 몰리거나 평탄화가 과하면 생길 수 있습니다. 최고점이 가장자리에 있어 측정 위치에 따라 높이가 다르게 나옵니다.'};
    function render(){
      const alpha = 0.06 + st.j / 100 * 0.3;
      const opens = OPEN.concat(st.dummy ? DUMMY : []).sort((a, b) => a - b);
      // 1D 보로노이: 열린 자리마다 받는 폭
      const edges = opens.map((x, i) => [i ? (opens[i - 1] + x) / 2 : 60, i < opens.length - 1 ? (x + opens[i + 1]) / 2 : 1000]);
      const catchW = edges.map(([a, b]) => Math.min(b - a, 260));
      const h = catchW.map(c => 120 * Math.pow(c / 62, alpha));
      // 전기력선: 위쪽 점에서 가장 가까운 열린 자리로
      let ln = '';
      for (let x = 75; x <= 990; x += 26){ let best = 0; opens.forEach((o, i) => { if (Math.abs(o - x) < Math.abs(opens[best] - x)) best = i; }); const o = opens[best], hy = BASE - h[best] - 4; ln += P(`M${x},214 C${x},300 ${o},${PRT - 60} ${o},${Math.max(PRT, hy)}`, DUMMY.includes(o) ? 's-field pl-dum' : 's-field'); }
      ctx.$('[data-v="lines"]').innerHTML = G(ln, {'data-tip': '전류는 가장 가까운 열린 자리로 — 넓은 곳의 전류를 혼자 받는 범프가 높다'});
      let xs = '', px = 60;
      opens.forEach((o, i) => { xs += R(px, PRT, o - OW / 2 - px, BASE - PRT, 'f-pr'); px = o + OW / 2; });
      xs += R(px, PRT, 1000 - px, BASE - PRT, 'f-pr');
      opens.forEach((o, i) => {
        const dm = DUMMY.includes(o);
        xs += R(o - OW / 2, BASE - h[i], OW, h[i], dm ? 'pl-dumb' : 'f-cu2', tip(dm ? '더미 범프 — 전류만 나눠 갖는다 (회로와 연결되지 않음)' : `범프 높이 ${(h[i] / 120).toFixed(2)} (밀집 = 1)`));
      });
      ctx.$('[data-v="xs"]').innerHTML = xs;
      const iso = h[opens.indexOf(700)] / 120, real = OPEN.map(o => h[opens.indexOf(o)]);
      const mean = real.reduce((a, b) => a + b, 0) / real.length, unif = (Math.max(...real) - Math.min(...real)) / mean * 100;
      // 위에서 본 다이: 이웃 수로 높이
      const pts = diePts();
      const act = pts.filter(p => p.kind !== 'gap' || st.dummy);
      let dg = '';
      pts.forEach(p => {
        if (p.kind === 'gap' && !st.dummy) return;
        let nb = 0;
        act.forEach(q => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d > 0 && d < DIE.p * 2.6) nb++; });
        const v = Math.pow(Math.max(1, 20 - nb) / 4, alpha * 1.6), tone = K.clamp((v - 1) / 0.9);
        if (p.kind === 'gap') dg += C(p.x, p.y, 14, 'pl-dumc', tip('더미 범프'));
        else dg += C(p.x, p.y, 14, 'pl-hm', W2(tip(p.kind === 'iso' ? '고립 범프 — 가장 높다' : '범프'), {style: `fill:${K.heat(0.25 + tone * 0.75)}`}));
      });
      ctx.$('[data-v="die"]').innerHTML = dg;
      ctx.out('k-r', `× ${iso.toFixed(2)}`); ctx.out('k-u', `${unif.toFixed(0)} %`);
      // 윗면 모양 선택
      ctx.$$('.pl-shp').forEach(g => g.classList.toggle('pl-sel', g.getAttribute('data-shape') === st.shape));
      ctx.q('[data-o=shape]').innerHTML = SHAPE_MSG[st.shape];
      // 깊은 구멍: 기포 또는 액
      const HX = 1110, HW = 90, HT = 800, HB = 1060;
      let hb = '';
      if (st.pw){
        hb += R(HX - HW / 2, HT, HW, HB - HT, 'f-bath', tip('구멍 안이 액으로 차 있다'));
        for (let k = 0; k < 3; k++) hb += K.ionPath(`M${HX - 20 + k * 20},760 L${HX - 20 + k * 20},${HB - 20}`, 'cu', 3.2 + k * 0.5, k * 0.9, null);
      } else {
        hb += R(HX - HW / 2, HT, HW, 90, 'f-bath') + P(`M${HX - HW / 2 + 2},${HB} L${HX - HW / 2 + 2},${HT + 120} Q${HX},${HT + 70} ${HX + HW / 2 - 2},${HT + 120} L${HX + HW / 2 - 2},${HB} Z`, 'pl-air', tip('갇힌 기포 — 액이 바닥에 닿지 못한다'));
        hb += LB(T(HX, HB - 50, '기포', 't-warn'));
      }
      ctx.$('[data-v="hole"]').innerHTML = hb;
      ctx.$('[data-v="deepmsg"]').innerHTML = K.TT(1270, 820, st.pw ? ['프리웻 → 구멍이 액으로 차서', '바닥까지 이온이 간다', '', '그래도 처음엔 확산 거리가', '가장 길다 → 초기 전류를', '낮게 시작하기도 한다'] : ['기포가 바닥을 막으면', '그 자리는 도금되지 않는다', '→ 범프 누락 · 보이드', '', '구멍이 깊고 좁을수록', '기포가 잘 빠지지 않는다'], 't-sub', 'start', 34);
      ctx.q('[data-o=msg]').innerHTML = st.dummy ? `더미 범프가 빈 곳의 전류를 나눠 가져 고립 범프가 밀집 대비 <b>×${iso.toFixed(2)}</b>로 줄었습니다.` : `고립 범프는 밀집 범프보다 <b>×${iso.toFixed(2)}</b> 높습니다. 전류밀도를 낮추거나 더미 범프를 켜 보세요.`;
      ctx.refresh();
    }
    const W2 = (...os) => Object.assign({}, ...os);
    ctx.range('j', v => { st.j = v; render(); return v < 34 ? '낮음' : v < 67 ? '보통' : '높음'; });
    const dummy = ctx.seg('dummy', v => { st.dummy = v === '1'; render(); });
    ctx.seg('shape', (v, user) => { st.shape = v; render(); if (user) ctx.go('shape'); });
    ctx.seg('pw', (v, user) => { st.pw = v === '1'; render(); if (user) ctx.go('deep'); });
    ctx.card.querySelectorAll('[data-g="dummy"] button, input[data-i=j]').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    // 장면의 윗면 모양을 눌러도 고른다
    ctx.scene.addEventListener('click', ev => {
      const g = ev.target.closest && ev.target.closest('.pl-shp'); if (!g) return;
      const b = ctx.card.querySelector(`[data-g="shape"] button[data-v="${g.getAttribute('data-shape')}"]`); if (b) b.click();
    });
    ctx.demo = sid => {
      if (!touched && (sid === 'dens' || sid === 'dummy')){
        const v = sid === 'dummy' ? '1' : '0';
        if ((st.dummy ? '1' : '0') !== v){ st.dummy = v === '1'; ctx.card.querySelectorAll('[data-g="dummy"] button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false')); render(); return; }
      }
      ctx.refresh();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['개구율', 'PR이 열린 면적의 비율. 다이 전체 · 국부(주변)로 나눠 본다'],
      ['WID · WIW', '다이 안(Within Die) · 웨이퍼 안(Within Wafer) 산포'],
      ['더미 범프', '회로와 연결되지 않고 전류만 나눠 갖는 가짜 범프'],
      ['동일평면성 (coplanarity)', '다이 안 범프 꼭대기들의 높이 차. 적층 · 접합 품질에 직결'],
      ['프리웻', '도금 전 진공에서 물(또는 액)로 구멍을 먼저 채워 기포를 없애는 것']
    ]) + K.field([
      '다이 안 산포가 크면 <b>어느 범프가 높은지</b>부터 봅니다. 가장자리 · 고립 범프가 높으면 패턴 효과, 무작위면 다른 원인(입자 · 기포 · PR)일 가능성이 큽니다.',
      '패턴 효과는 설계(개구율) · 포토(구멍 크기) · 도금(전류 · 첨가제)이 함께 정합니다. 대책안을 비교할 때 <b>패턴 치수 조정 vs 도금 조건 조정</b>의 대가를 함께 적습니다.',
      '범프 높이 측정은 <b>어디를 재는지</b>(중심 · 최고점 · 평균)와 장비 원리(광학 · 레이저 · 촉침)를 맞춰야 비교가 됩니다.'
    ]) + K.deep(`<ul>
      <li>패턴 효과의 크기는 07장의 바그너 수와 같은 원리로, <b>패턴 크기(L)에 비해 분극 저항이 클수록</b> 작아집니다. 전류밀도를 낮추거나 억제제 · 평탄제로 분극을 키우면 줄어듭니다.</li>
      <li>구멍 안(범프 하나 안)의 분포는 세 가지가 겨룹니다: 구멍 입구 모서리로 몰리는 전기(1차 분포), 위에서 확산으로 오는 이온의 공급(물질 전달), 첨가제의 흡착(평탄제는 공급이 잘 되는 곳에 많이 붙음).</li>
      <li>PR 구멍이 깊고 좁을수록(종횡비가 클수록) 기포 · 젖음 · 확산 문제가 커집니다. 프리웻 · 액 표면장력(습윤제) · 웨이퍼 기울여 넣기 · 초기 저전류가 함께 쓰입니다.</li>
      <li>높이 산포는 적층(TC 본딩) 때 접합 불량 · 범프 찢어짐으로 이어질 수 있어, 웨이퍼 휨(warpage)과 함께 평가합니다.</li></ul>`);
  }
});
})();
