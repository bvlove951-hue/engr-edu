/* 전해도금 08 — 패턴 효과: 왜 외톨이 범프가 키가 클까 (다이 · mm / 범프 · µm) */
(function(){
const BASE = 600, PRT = 404, OW = 34;                              // 단면: 시드 위치, PR 윗면, 구멍 폭
const OPEN = [110, 172, 234, 296, 358, 420, 700, 870, 932];         // 밀집 6 · 외톨이 1 · 작은 묶음 2
const DUMMY = [560, 622, 778];
const DIE = {x: 1070, y: 210, n: 9, p: 44};                          // 위에서 본 다이
// 위에서 본 범프 배치: 가운데 위쪽을 비우고 외톨이 범프 두 개
function diePts(){
  const out = [];
  for (let r = 0; r < DIE.n; r++) for (let c = 0; c < DIE.n; c++){
    const empty = r < 5 && c >= 3 && c <= 7, iso = (r === 1 && c === 5) || (r === 3 && c === 6);
    out.push({x: DIE.x + c * DIE.p, y: DIE.y + r * DIE.p, kind: iso ? 'iso' : empty ? 'gap' : 'bump'});
  }
  return out;
}
// 범프 하나의 윗면 모양 (아래 왼쪽 판)
const SHAPES = [['dome', '돔 (볼록)'], ['flat', '평평'], ['dish', '접시 (오목)'], ['tilt', '기움']];
// [비도금] 꼬리표 — 장면용 · 카드용
const tagS = (K, x, y) => K.G(K.R(x, y - 20, 74, 28, 'p08-bdg', {rx: 7}) + K.T(x + 37, y + 1, '비도금', 'p08-bdgt'), K.tip('비도금 인자 — 설계(마스크) · 포토가 정한다 (도금 공정이 바꿀 수 없다)'));
const tagC = '<span class="pl-tag up" title="비도금 인자 — 설계 · 포토가 정한다">비도금</span>';

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '08', id: 'pattern', part: 2, short: '패턴 효과', scale: '다이 · mm / 범프 · µm',
  title: '패턴 효과 — 왜 외톨이 범프가 키가 클까?',
  hook: '외로운 범프가 키가 크다',
  one: '주변에 다른 범프가 없는 외톨이 범프는 주변의 전류를 혼자 받아 더 높이 자랍니다. 그래서 같은 다이 안에서도 범프 높이가 달라집니다. 범프 하나의 윗면 모양(볼록 · 평평 · 오목 · 기움)은 조건에 따라 달라집니다.',
  ana: '<b>마당의 배수구</b> — 비가 오면 마당에 떨어진 물은 가장 가까운 배수구로 흘러갑니다. 배수구가 촘촘한 곳은 물을 나눠 받고, 넓은 마당에 혼자 있는 배수구는 주변 물을 모두 받아 가장 많이 흘러듭니다. 외톨이 범프가 그 배수구입니다. <i>한계: 전류는 "가장 가까운 곳"으로만 가지 않고 액 저항 · 반응 저항에 따라 퍼집니다. 반응 저항(억제제 · 낮은 전류밀도)이 크면 차이가 줄어듭니다.</i>',
  steps: [
    {id: 'dens', t: '밀집 vs 외톨이', d: '주변에 다른 범프가 없는 외톨이(고립) 범프는 넓은 곳의 전류를 혼자 받아 높이 자랍니다. 밀집 구역은 전류를 나눠 가져 낮습니다 → 다이 안 높이 산포. 웨이퍼 가장자리 다이도 바깥 PR 띠(구멍 없음) 때문에 외톨이처럼 높아지기 쉽습니다.'},
    {id: 'dummy', t: '대책 — 더미 범프 · 설계', d: '빈 곳에 회로와 연결되지 않은 더미 범프를 두거나, 설계에서 개구율을 고르게 합니다. HBM에서 더미 범프는 다이를 받치고 열을 빼는 역할도 해서 아무렇게나 빼거나 옮길 수 없습니다. 전류밀도를 낮추면 차이가 줄지만 느려집니다.'},
    {id: 'shape', t: '범프 하나의 윗면', d: '윗면 모양에 정해진 답은 없습니다. 평탄제가 적고 전류밀도가 높으면 보통 볼록(돔), 흐름이 한쪽으로 치우치면 기웁니다. 접시(오목)는 일부 조건이나 도금 후반에 보고됩니다. 높이를 어디서 잴지(중심 vs 최고점)도 정해 둡니다.'},
    {id: 'deep', t: '깊은 구멍 — 기포와 확산 거리', d: '도금 초기에 구멍이 가장 깊어 이온이 걸어올 거리(확산층 + 구멍 깊이)가 깁니다. 기포가 끼면 그 자리는 도금되지 않습니다 → 진공에서 탈기한 물로 구멍을 먼저 채우는 프리웻. 담글 때는 시드가 녹지 않게 전류를 건 채 넣습니다(핫 엔트리).'}
  ],
  css: `
.p08-bdg{fill:rgba(167,139,250,.28);stroke:#a78bfa;stroke-width:1.4}
.pl-svg .p08-bdgt{font-size:17px;font-weight:800;fill:#ddd6fe !important}
.pl-svg .p08-ap{font-size:19px;font-weight:700;fill:#fde68a !important;stroke:rgba(5,10,20,.8) !important;stroke-width:4px !important}`,
  icon(K){
    const {R} = K;
    return R(2, 40, 8, 22, 'f-cu2') + R(14, 40, 8, 22, 'f-cu2') + R(26, 40, 8, 22, 'f-cu2') + R(50, 22, 10, 40, 'f-cu2') + R(0, 60, 64, 4, 'f-seed2');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT} = K;
    let s = '';
    // 위 왼쪽: 단면
    s += R(40, 130, 980, 530, 'pl-panel', {rx: 16}) + R(40, 130, 980, 530, 'pl-hlbox', W({rx: 16}, only('dens dummy'))) + T(64, 172, '다이 단면 — 전류는 가까운 열린 자리로 모인다', 't-acc', 'start');
    s += tagS(K, 640, 172) + LB(T(724, 172, '개구율 = 설계 · 포토', 't-dim', 'start'));
    s += R(60, 200, 940, PRT - 200, 'f-bath') + R(60, BASE + 4, 940, 22, 'f-si') + R(60, BASE, 940, 4, 'f-seed2');
    s += `<g data-v="lines"></g><g data-v="xs"></g>`;
    s += LB(T(265, 650, '밀집 구역', 't-dim') + T(700, 650, '외톨이 범프', 't-dim') + T(900, 650, '작은 묶음', 't-dim'));
    // 위 오른쪽: 다이 높이 지도
    s += R(1040, 130, 540, 530, 'pl-panel', {rx: 16}) + R(1040, 130, 540, 530, 'pl-hlbox', W({rx: 16}, only('dens dummy'))) + T(1064, 172, '위에서 본 다이 — 범프 높이 (예시)', 't-acc', 'start');
    s += R(DIE.x - 24, DIE.y - 24, DIE.p * (DIE.n - 1) + 48, DIE.p * (DIE.n - 1) + 48, 'dp-pas', {rx: 6});
    s += `<g data-v="die"></g>`;
    s += LB(T(1064, 616, '빨강 = 높다 · 점선 = 더미 범프', 't-dim', 'start'));
    s += G(LB(T(1064, 644, '가장자리 다이도 바깥 PR 띠 때문에 외톨이처럼 높다', 't-dim', 'start')), only('dens'));
    s += G(LB(T(1064, 644, '더미: 회로와 연결 안 됨 · HBM에선 지지 · 열 길', 't-dim', 'start')), only('dummy'));
    // 아래 왼쪽: 윗면 모양
    s += R(40, 690, 760, 430, 'pl-panel', {rx: 16}) + R(40, 690, 760, 430, 'pl-hlbox', W({rx: 16}, only('shape'))) + T(64, 732, '범프 하나의 윗면 — 조건에 따라 다르다 · 어디서 재나?', 't-acc', 'start');
    SHAPES.forEach(([k, nm], i) => {
      const x = 76 + i * 182, w = 130, b = 1010, top = 840;
      const d = k === 'dome' ? `M${x},${b} L${x},${top + 30} Q${x + w / 2},${top - 30} ${x + w},${top + 30} L${x + w},${b} Z`
        : k === 'flat' ? `M${x},${b} L${x},${top} L${x + w},${top} L${x + w},${b} Z`
        : k === 'dish' ? `M${x},${b} L${x},${top - 18} Q${x + 10},${top - 22} ${x + 26},${top} Q${x + w / 2},${top + 26} ${x + w - 26},${top} Q${x + w - 10},${top - 22} ${x + w},${top - 18} L${x + w},${b} Z`
        : `M${x},${b} L${x},${top + 24} Q${x + w / 2},${top + 4} ${x + w},${top - 14} L${x + w},${b} Z`;
      let g = R(x - 16, b, w + 32, 14, 'f-seed2') + P(d, 'f-cu2');
      // 파랑 점: 가운데 높이 · 주황 점: 최고점
      const cy = k === 'dish' ? top + 13 : k === 'tilt' ? top + 4.5 : top;
      const mx = k === 'dish' ? x + 6 : k === 'tilt' ? x + w - 6 : x + w / 2, my = k === 'dish' ? top - 20 : k === 'tilt' ? top - 12 : top;
      g += C(x + w / 2, cy, 6, 'k-acc') + C(mx, my, 6, 'k-acc2');
      g += T(x + w / 2, 1060, nm, 't-sub') + R(x - 22, 780, w + 44, 300, 'pl-pick', {'data-shape': k});
      s += G(g, W({class: 'pl-shp', 'data-shape': k}, tip(nm + ' — 파랑 점: 중심 높이, 주황 점: 최고점')));
    });
    s += LB(C(82, 1100, 6, 'k-acc') + T(94, 1106, '중심 높이', 't-dim', 'start') + C(250, 1100, 6, 'k-acc2') + T(262, 1106, '최고점 — 무엇을 재는지 정해 둔다', 't-dim', 'start'));
    // 아래 오른쪽: 깊은 구멍
    s += R(830, 690, 750, 430, 'pl-panel', {rx: 16}) + R(830, 690, 750, 430, 'pl-hlbox', W({rx: 16}, only('deep'))) + T(854, 732, '깊은 구멍 — 처음이 가장 불리하다', 't-acc', 'start');
    const HX = 1110, HW = 90, HT = 800, HB = 1060;
    s += R(870, 760, 680, HT - 760, 'f-bath') + R(870, HT, HX - HW / 2 - 870, HB - HT, 'f-pr') + R(HX + HW / 2, HT, 1250 - HX - HW / 2, HB - HT, 'f-pr') + R(870, HB, 380, 12, 'f-seed2');
    s += `<g data-v="hole"></g>`;
    s += LB(P(`M884,770 l-8,0 l0,${HT - 770} l8,0`, 's-acc2') + T(896, (770 + HT) / 2 + 8, '확산층', 't-warn', 'start') + P(`M884,${HT + 4} l-8,0 l0,${HB - HT - 4} l8,0`, 's-acc2') + T(896, (HT + HB) / 2 + 8, '+ 구멍 깊이', 't-warn', 'start') + T(896, (HT + HB) / 2 + 38, '(근사)', 'p08-ap', 'start'));
    s += `<g data-v="deepmsg"></g>`;
    s += LB(T(854, 1102, '담글 때: 시드가 산에 녹지 않게 전류를 건 채 넣는다 (핫 엔트리)', 't-dim', 'start'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 패턴과 모양</div>
      ${K.ctl('j', '전류밀도 (패턴 효과의 크기)', 0, 100, 1, 60)}
      ${K.seg('dummy', [['0', '없음'], ['1', '있음']], '0', '더미 범프')}
      ${K.kpis([['외톨이 / 밀집 높이', 'k-r', ''], ['다이 안 산포', 'k-u', '(최고−최저)/평균']])}
      ${K.seg('shape', SHAPES.map(([k, nm]) => [k, nm.split(' ')[0]]), 'flat', '윗면')}
      <p class="pl-msg" data-o="shape"></p>
      ${K.seg('pw', [['0', '프리웻 없이'], ['1', '탈기 프리웻']], '1', '도금 전')}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('전류를 "가장 가까운 열린 자리"로 나눠 받는다고 보고 높이 ∝ (받는 폭)^α 로 그렸습니다. α는 전류밀도가 높을수록(반응 저항이 작을수록) 큽니다. 값은 경향을 보기 위한 예시입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip, rng} = K;
    let touched = false;
    const st = {j: 60, dummy: false, shape: 'flat', pw: true};
    const SHAPE_MSG = {
      dome: '<b>돔(볼록)</b> — 가운데가 볼록. 평탄제가 적고 전류밀도가 높을 때 흔히 보고됩니다. 가운데에서 재면 중심 높이 = 최고점입니다.',
      flat: '<b>평평</b> — 보통 목표로 하는 모양. 평탄제 · 전류밀도 · 흐름이 균형을 이룬 상태입니다.',
      dish: '<b>접시(오목)</b> — 가장자리가 높고 가운데가 낮음. 일부 첨가제 · 조건이나 도금 후반(구멍이 얕아졌을 때) 보고됩니다. "평탄제가 많으면 접시"는 일반 법칙이 아닙니다. 최고점이 가장자리라 재는 위치에 따라 높이가 달라집니다.',
      tilt: '<b>기움</b> — 한쪽이 높음. 흐름(교반)이 한쪽으로 치우치면 생깁니다. 첨가제보다 셀의 흐름 · 패들 · 웨이퍼 기울어짐을 먼저 봅니다. 최고점이 한쪽 끝에 있습니다.'};
    function render(){
      const alpha = 0.06 + st.j / 100 * 0.3;
      const opens = OPEN.concat(st.dummy ? DUMMY : []).sort((a, b) => a - b);
      // 1D 보로노이: 열린 자리마다 받는 폭
      const edges = opens.map((x, i) => [i ? (opens[i - 1] + x) / 2 : 60, i < opens.length - 1 ? (x + opens[i + 1]) / 2 : 1000]);
      const catchW = edges.map(([a, b]) => Math.min(b - a, 260));
      const h = catchW.map(c => 120 * Math.pow(c / 62, alpha));
      // 전류선: 위쪽 점에서 가장 가까운 열린 자리로
      let ln = '';
      for (let x = 75; x <= 990; x += 26){ let best = 0; opens.forEach((o, i) => { if (Math.abs(o - x) < Math.abs(opens[best] - x)) best = i; }); const o = opens[best], hy = BASE - h[best] - 4; ln += P(`M${x},214 C${x},300 ${o},${PRT - 60} ${o},${Math.max(PRT, hy)}`, DUMMY.includes(o) ? 's-field pl-dum' : 's-field'); }
      ctx.$('[data-v="lines"]').innerHTML = G(ln, {'data-tip': '전류선 — 전류는 가까운 열린 자리로 간다. 넓은 곳의 전류를 혼자 받는 외톨이 범프가 높다'});
      let xs = '', px = 60;
      opens.forEach((o, i) => { xs += R(px, PRT, o - OW / 2 - px, BASE - PRT, 'f-pr'); px = o + OW / 2; });
      xs += R(px, PRT, 1000 - px, BASE - PRT, 'f-pr');
      opens.forEach((o, i) => {
        const dm = DUMMY.includes(o);
        xs += R(o - OW / 2, BASE - h[i], OW, h[i], dm ? 'pl-dumb' : 'f-cu2', tip(dm ? '더미 범프 — 회로와 연결되지 않음. 전류를 나눠 갖고, HBM에서는 다이를 받치고 열을 빼는 길도 된다' : `범프 높이 ${(h[i] / 120).toFixed(2)} (밀집 = 1)`));
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
        if (p.kind === 'gap') dg += C(p.x, p.y, 14, 'pl-dumc', tip('더미 범프 — 회로와 연결되지 않음 (지지 · 열 길 역할도)'));
        else dg += C(p.x, p.y, 14, 'pl-hm', W2(tip(p.kind === 'iso' ? '외톨이(고립) 범프 — 가장 높다' : '범프'), {style: `fill:${K.heat(0.25 + tone * 0.75)}`}));
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
      ctx.$('[data-v="deepmsg"]').innerHTML = K.TT(1270, 816, st.pw ? ['탈기한 물로 프리웻 →', '구멍이 액으로 차서', '바닥까지 이온이 간다', '', '처음엔 확산 거리가', '가장 길다 → 초기 전류를', '낮게 시작하기도 한다'] : ['기포가 바닥을 막으면', '그 자리는 도금되지 않는다', '→ 범프 누락 · 보이드', '', '예: 탈기 없이 적신', '한 사례에서 구멍의', '약 15 %에 기포가 남음'], 't-sub', 'start', 33);
      ctx.q('[data-o=msg]').innerHTML = st.dummy ? `더미 범프가 빈 곳의 전류를 나눠 가져 외톨이 범프가 밀집 대비 <b>×${iso.toFixed(2)}</b>로 줄었습니다.` : `외톨이 범프는 밀집 범프보다 <b>×${iso.toFixed(2)}</b> 높습니다. 전류밀도를 낮추거나 더미 범프를 켜 보세요.`;
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
      ['개구율', `PR이 열린 면적의 비율. 다이 전체 · 국부(주변)로 나눠 본다. 설계 · 포토가 정한다 ${tagC}`],
      ['WID · WIW · WTW', '다이 안(Within Die) · 웨이퍼 안(Within Wafer) · 웨이퍼 사이(Wafer To Wafer) 산포'],
      ['외톨이 범프', '(고립 범프) 주변에 다른 범프가 없는 범프. 주변 전류를 혼자 받아 높다'],
      ['더미 범프', '회로와 전기적으로 연결되지 않은 범프. 도금 높이를 고르게 하고, HBM 적층에서는 다이를 받치고 열을 빼는 길도 된다'],
      ['동일평면성', '(coplanarity) 다이 안 범프 꼭대기들의 높이 차. 적층 · 접합 품질에 직결'],
      ['프리웻', '도금 전 진공에서 탈기한 물(또는 액)로 구멍을 먼저 채워 기포를 없애는 것'],
      ['핫 엔트리', '작은 전류를 건 채 웨이퍼를 담그는 것. 얇은 시드가 산성 액에 녹는 것을 막는다']
    ]) + K.field([
      `다이 안 높이 산포는 <b>마스크 설계(개구율 · 더미 패턴)</b> ${tagC}가 정하는 몫이 큽니다. 설계 단계에서 도금 엔지니어가 의견을 내는 것이 가장 싼 대책입니다. 대책안을 비교할 때 <b>패턴 치수 조정 vs 도금 조건 조정</b>의 대가를 함께 적습니다.`,
      '<b>HBM에서는 다이 안 높이 산포가 곧 접합 품질입니다.</b> 높이 차이(동일평면성)가 크면 열압착(TC) 본딩 때 낮은 범프가 닿지 않아 비접합이 생길 수 있습니다. 리플로우하면 솔더가 둥글어지므로 높이보다 솔더 부피가 같아야 합니다 — 도금 직후 높이와 리플로우 뒤 높이를 나눠 기록합니다.',
      '다이 안 산포가 크면 <b>어느 범프가 높은지</b>부터 봅니다. 외톨이 · 가장자리 다이 범프가 높으면 패턴 효과, 무작위면 다른 원인(입자 · 기포 · PR)일 가능성이 큽니다. 가장자리 다이는 바깥 PR 띠 때문에 외톨이처럼 높아지기 쉬워, 부분 다이 패턴 채우기 · 더미 패턴으로 줄입니다 → <a data-go="wafer">07장</a>.',
      'SnAg는 외톨이 범프와 밀집 범프의 <b>Ag 함량</b>도 다를 수 있고, 범프 높이 방향(도금 초기와 후기)으로도 달라질 수 있습니다(조건에 따라) → <a data-go="chem.comp">10장</a>.',
      '누락 · 부분 범프의 원인은 세 갈래입니다: ① 기포(도금 — 프리웻 · 입수 각도) ② PR 현상 찌꺼기(포토 — 디스컴) ③ 시드 산화 · 녹음(앞 공정 대기 시간 · 입수 조건). 누락 위치 맵과 PR 제거 후 바닥 관찰로 나눕니다 → <a data-go="defects">12장</a>.',
      '범프 높이 측정은 <b>어디를 재는지</b>(중심 · 최고점 · 평균)와 장비 원리(광학 · 레이저 · 촉침)를 맞춰야 비교가 됩니다. 윗면 모양은 도금하는 동안 변하니 같은 높이 · 같은 단계끼리 비교합니다.'
    ]) + K.deep(`<ul>
      <li>패턴 효과의 크기는 바그너 수(→ <a data-go="overpot">04장</a>)와 같은 원리로, <b>패턴 크기(L)에 비해 분극 저항이 클수록</b> 작아집니다. 전류밀도를 낮추거나 억제제 · 평탄제로 분극을 키우면 줄어듭니다(대신 느려짐).</li>
      <li>구멍 안(범프 하나 안)의 분포는 세 가지가 겨룹니다. ① 전기의 길(1차 분포) — PR 벽과 바닥은 90°로 만나 모서리 전류가 유한하므로, "구멍 가장자리로 몰린다"는 일반 법칙이 아닙니다. 구멍이 얕아질수록 입구 모양의 영향이 커집니다. ② 위에서 확산으로 오는 이온의 공급. ③ 첨가제의 흡착 — 평탄제는 공급이 잘 되는 튀어나온 곳에 많이 붙어 그곳을 늦춥니다.</li>
      <li>공개 연구의 경향: 평탄제가 적고 전류밀도가 높으면 돔, 교반이 고르지 않으면 기운 면, 5~10 ASD에서 약간 볼록이 보고됩니다. 접시는 특정 평탄제 · 조건에서 보고되고, 모양 시뮬레이션은 "고름 → 볼록 → 접시"처럼 도금하는 동안 바뀌는 단계를 보여 줍니다.</li>
      <li><b>확산 거리 = 확산층 + 구멍 깊이</b>는 좁고 깊고 촘촘한 구멍에 잘 맞는 근사입니다. 구멍이 듬성듬성하면 입구 위로 반구 모양 공급이 더해져(정지 액에서 유효 거리 ≈ 깊이 + π·반지름/4) 더 짧고, 구멍이 넓으면 흐름이 일부 안으로 들어와 역시 짧습니다. 예(Cu²⁺ 0.6 mol/L, D 7×10⁻¹⁰ m²/s): 확산층 20 µm만이면 한계 약 40 ASD, 20 µm + 구멍 30 µm면 약 16 ASD. 결론은 같습니다 — 초기 공급이 가장 느려 시작 전류를 낮게 잡는 경우가 많습니다.</li>
      <li>프리웻: 30 µm 구멍 속 물이 확산으로 바뀌는 시간은 약 h²/D ≈ 1 s로 짧습니다. 문제는 기포입니다 — 탈기하지 않은 물로 적신 한 특허 실시예에서 구멍의 약 15 %에 기포가 남았습니다. 종횡비가 클수록 기포 · 젖음 · 확산 문제가 커져 습윤제 · 기울여 넣기 · 초기 저전류를 함께 씁니다.</li>
      <li>시드 녹음: 얇은 Cu 시드(수십~백수십 nm)는 전류 없이 산성 액에 닿으면(특히 녹은 산소가 있을 때) 분당 수~수백 Å씩 녹을 수 있습니다. 그래서 핫 엔트리로 담그고 담근 뒤 대기 시간을 짧게 관리합니다. 녹은 자리는 범프 누락 · 바닥 빈틈의 원인이 됩니다.</li>
      <li>(개념) 고저항판을 웨이퍼에 아주 가깝게 두면 웨이퍼 전체 균일도에는 유리하지만, 전류가 옆으로 옮겨 갈 여유가 줄어 다이 안 패턴 차이(외톨이 / 밀집)가 커질 수 있습니다 — 크기 사이의 트레이드오프입니다.</li></ul>`);
  }
});
})();
