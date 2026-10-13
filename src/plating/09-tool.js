/* 전해도금 09 — 도금 장비 해부: 셀 한 대 (장비 · m) */
(function(){
// 부품 카드: 이름 · 하는 일 · 나빠지면 보이는 것
const PARTS = {
  rect: ['정류기', '정해진 전류를 정확히 흘리고 전압 · 전류를 기록한다', '출력 이상 → 두께 이상. 같은 전류에 전압이 오르면 접점 · 액 · 분리막 상태를 의심'],
  head: ['헤드 (회전 · 기울기)', '웨이퍼를 앞면이 아래로 잡고 돌린다. 기울여 넣어 기포가 빠지게 한다', '회전 · 기울기 · 수평 이상 → 줄무늬 · 기포 결함 · 한쪽 치우친 두께'],
  seal: ['립씰', '웨이퍼 가장자리를 눌러 액이 접점으로 새지 않게 막는다', '닳음 · 오염 · 결정 석출 → 누액: 접점에 도금, 접점 저항↑, 가장자리 이상 도금, 뒷면 오염'],
  contact: ['콘택트 (핑거)', '시드층에 전류를 넣는 입구. 립씰 안쪽 마른 곳에 있다', '오염 · 도금이 붙음 → 접촉 저항이 고르지 않음 → 한쪽 치우친 두께 · 탄 자국(아크)'],
  shield: ['실드 (가림판)', '웨이퍼 가장자리로 가는 전류를 가려 가장자리 두께를 맞춘다', '위치 어긋남 · 마모 · 도금이 붙음 → 가장자리 두께 변화'],
  hrva: ['고저항판 (디퓨저)', '작은 구멍이 많은 판. 전류와 흐름을 웨이퍼 전체로 고르게 편다', '구멍 막힘 · 기포 걸림 → 국부 두께 이상 (무늬)'],
  weir: ['넘침 둑 (오버플로)', '넘친 액을 받아 탱크로 돌려보내 액면 높이를 일정하게 한다', '흐름 이상 → 액면 변화 · 거품 · 젖음 불량'],
  membrane: ['분리막 (멤브레인)', '음극액(첨가제 있음)과 양극액을 나눈다. 첨가제가 양극에서 분해되거나 양극 찌꺼기가 넘어오는 것을 막는다', '막힘 → 전압↑, 손상 → 첨가제 소모↑ · 입자 · 농도 변동'],
  anode: ['애노드 (양극)', '가용성은 녹아서 금속 이온을 보충, 불용성은 전류만 넘긴다', '소모 · 피막 이상 → 슬러지 · 입자(노듈), 농도 변동, 전류 분포 변화'],
  tank: ['탱크', '도금액을 담아 두고 셀로 보냈다가 돌려받는다', '액량 · 온도 · 오염 관리. 교체 때 세정 상태가 첫 웨이퍼 품질을 좌우'],
  pump: ['펌프', '액을 돌려 흐름(대류)을 만든다', '유량↓ → 확산층↑ → 한계전류↓ · 조성(Ag) 변화 · 두께 분포 변화'],
  filter: ['필터', '액 속 입자를 걸러 낸다', '막힘 → 유량↓, 교체 지연 · 파손 → 입자 · 노듈'],
  hx: ['열교환기', '액 온도를 일정하게 유지한다', '온도 변동 → 속도 · 조성 · 첨가제 소모 · 응력 변화'],
  dosing: ['도징 (자동 보충)', '쓴 전기량(Ah)만큼 첨가제 · 보충액을 넣는다', '펌프 · 배관 · 약품 lot 이상 → 농도 이탈'],
  analyzer: ['분석기', '금속 · 산 · 첨가제 농도를 잰다 (적정 · CVS)', '시약 · 교정 이상 → 잘못된 보충 결정']
};
const STEP_PARTS = {head: ['head', 'seal', 'contact'], cell: ['membrane', 'anode'], uni: ['hrva', 'shield', 'head'], loop: ['pump', 'filter', 'hx', 'dosing', 'analyzer', 'tank'], seq: []};

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '09', id: 'tool', part: 3, short: '장비 해부', scale: '장비 · m',
  title: '도금 장비 해부 — 셀 한 대',
  hook: '부품마다 증상이 있다',
  one: '도금 장비는 웨이퍼를 잡고, 전기를 넣고, 액을 고르게 흘리고, 액을 깨끗하게 지키는 부품들의 합입니다. 부품마다 나빠졌을 때 보이는 "증상"이 있어서, 불량 모양을 보고 부품을 떠올릴 수 있어야 합니다.',
  ana: '<b>자동차 정비</b> — 엔진(정류기), 바퀴와 손잡이(헤드 · 립씰 · 콘택트), 연료 계통(펌프 · 필터 · 탱크), 배기(넘침 둑) — 소리와 증상으로 어디가 나쁜지 짐작하듯, 두께 맵 · 불량 모양으로 부품을 짐작합니다.',
  steps: [
    {id: 'head', t: '웨이퍼 잡기 — 헤드 · 립씰 · 콘택트', d: '헤드가 웨이퍼를 앞면이 아래로 잡고 돌립니다. 립씰이 가장자리를 눌러 액을 막고, 그 안쪽 마른 곳의 콘택트가 시드층에 전류를 넣습니다.'},
    {id: 'cell', t: '두 방과 분리막', d: '분리막이 셀을 음극액(첨가제가 든 쪽, 웨이퍼 쪽)과 양극액(애노드 쪽)으로 나눕니다. 첨가제가 양극에서 분해되거나 양극 찌꺼기가 웨이퍼로 오는 것을 막습니다.'},
    {id: 'uni', t: '고르게 — 고저항판 · 실드 · 회전', d: '구멍 뚫린 고저항판이 전류와 흐름을 고르게 펴고, 실드가 가장자리 전류를 가리며, 회전이 둘레 방향을 평균합니다 (07장).'},
    {id: 'loop', t: '액 순환 — 펌프 · 필터 · 온도 · 보충 · 분석', d: '탱크 → 펌프 → 필터 → 열교환기 → 셀 → 넘침 둑 → 탱크로 돕니다. 도징이 쓴 만큼 보충하고, 분석기가 농도를 잽니다 (11장).'},
    {id: 'seq', t: '한 장이 지나가는 길', d: '로드포트 → 프리웻(진공 적심) → Cu → 린스 → Ni → 린스 → SnAg → 린스 → 스핀 건조 → 로드포트. 층 사이 시간과 린스가 계면 품질을 정합니다.'}
  ],
  icon(K){
    const {R, P} = K;
    return R(10, 4, 46, 10, 'pl-headb') + R(14, 14, 38, 3, 'f-wafer') + P('M6,20 L6,60 L60,60 L60,20', 'f-tank') + R(8, 22, 50, 36, 'f-bath') + P('M8,40 L58,40', 'f-mem') + R(20, 48, 26, 6, 'f-anode');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT} = K;
    const part = (id, inner) => G(inner, {class: 'pl-part', 'data-part': id, 'data-tip': PARTS[id][0] + '\n' + PARTS[id][1]});
    let s = '';
    s += R(40, 130, 1060, 990, 'pl-panel', {rx: 16});
    // 정류기와 케이블
    s += part('rect', R(70, 150, 200, 80, 'f-psu', {rx: 10}) + T(170, 186, '정류기', 't-lbl') + T(170, 216, '(−) 접점 · (+) 애노드', 't-dim'));
    s += P('M270,176 L340,176 L340,270 L352,270', 'pl-cab') + P('M270,206 L292,206 L292,760 L420,760', 'pl-cab2');
    // 헤드 · 웨이퍼 · 립씰 · 콘택트
    s += part('head', R(560, 140, 40, 52, 'pl-headb') + R(330, 192, 500, 72, 'pl-headb', {rx: 12}) + P('M640,160 A80,12 0 0 1 800,160', 's-arr', K.mk('s-arr')) + T(814, 168, '회전', 't-dim', 'start'));
    s += R(350, 266, 460, 12, 'f-wafer', tip('웨이퍼 — 앞면(시드)이 아래')) + R(350, 278, 460, 4, 'f-seed2');
    s += part('contact', R(352, 262, 16, 22, 'f-contact') + R(792, 262, 16, 22, 'f-contact'));
    s += part('seal', R(338, 284, 38, 14, 'f-seal') + R(784, 284, 38, 14, 'f-seal'));
    // 음극액 방
    s += P('M300,300 L300,640 M860,300 L860,640', 'f-tank') + R(303, 300, 554, 340, 'f-bath', tip('음극액 — 첨가제가 든 도금액 (웨이퍼 쪽)'));
    s += part('weir', P('M286,300 L286,334 M874,300 L874,334', 'pl-weir') + P('M300,300 C270,300 262,320 262,360', 's-flow') + P('M860,300 C890,300 898,320 898,360', 's-flow') + R(236, 340, 50, 90, 'pl-gutter') + R(874, 340, 50, 90, 'pl-gutter'));
    s += part('shield', R(306, 312, 76, 12, 'f-shield') + R(778, 312, 76, 12, 'f-shield'));
    s += part('hrva', R(306, 372, 548, 18, 'pl-hrva'));
    for (let k = 0; k < 6; k++) s += P(`M${360 + k * 90},620 L${360 + k * 90},400`, 's-flow');
    // 분리막 · 양극액 · 애노드
    s += part('membrane', R(303, 636, 554, 8, 'f-mem'));
    s += P('M300,644 L300,820 L860,820 L860,644', 'f-tank') + R(303, 644, 554, 174, 'pl-anolyte', tip('양극액 — 애노드 쪽 액 (첨가제 없음)'));
    s += part('anode', R(420, 740, 320, 40, 'f-anode', {rx: 6}));
    // 순환계
    s += part('tank', P('M110,900 L110,1080 L400,1080 L400,900', 'f-tank') + R(113, 930, 284, 147, 'f-bath') + T(255, 1010, '탱크', 't-lbl'));
    s += part('pump', C(500, 1010, 36, 'pl-pump') + P('M484,1000 L516,1010 L484,1020 Z', 'k-acc') + T(500, 1072, '펌프', 't-dim'));
    s += part('filter', R(580, 960, 60, 110, 'pl-filt', {rx: 10}) + L(590, 980, 630, 980, 's-faint') + L(590, 1000, 630, 1000, 's-faint') + L(590, 1020, 630, 1020, 's-faint') + T(610, 1096, '필터', 't-dim'));
    s += part('hx', R(690, 960, 110, 110, 'pl-hx', {rx: 10}) + P('M705,980 q15,15 0,30 q-15,15 0,30 q15,15 0,30', 'pl-coil') + P('M745,980 q15,15 0,30 q-15,15 0,30 q15,15 0,30', 'pl-coil') + T(745, 1096, '열교환기', 't-dim'));
    s += P('M400,1010 L464,1010 M536,1010 L580,1010 M640,1010 L690,1010 M800,1010 L960,1010 L960,520 L860,520', 'pl-pipe') + P('M800,1010 L960,1010 L960,520 L860,520', 's-flow');
    s += P('M261,430 L261,900', 'pl-pipe') + P('M261,430 L261,900', 's-flow');
    s += part('dosing', R(120, 790, 46, 80, 'pl-bottle', {rx: 8}) + R(180, 790, 46, 80, 'pl-bottle', {rx: 8}) + P('M143,870 L143,930 M203,870 L203,930', 'pl-pipe') + T(173, 780, '도징', 't-dim'));
    s += part('analyzer', R(420, 840, 170, 70, 'pl-ana', {rx: 10}) + T(505, 870, '분석기', 't-sub') + T(505, 896, '적정 · CVS', 't-dim') + P('M420,880 L398,880 L398,935', 'pl-pipe'));
    // 이름표 (단계별)
    s += G(LB(K.lead(560, 230, 900, 200, '헤드', 'start') + K.lead(810, 276, 920, 250, '웨이퍼 (앞면 아래)', 'start') + K.lead(800, 290, 940, 300, '립씰 · 콘택트', 'start')), only('head'));
    s += G(LB(K.lead(700, 640, 910, 600, '분리막', 'start') + K.lead(700, 760, 910, 760, '애노드', 'start') + K.lead(600, 500, 910, 420, '음극액 (첨가제)', 'start') + K.lead(600, 700, 910, 690, '양극액', 'start')), only('cell'));
    s += G(LB(K.lead(800, 381, 910, 380, '고저항판', 'start') + K.lead(820, 318, 930, 320, '실드', 'start')), only('uni'));
    s += G(LB(T(980, 500, '셀로', 't-dim', 'end') + T(250, 460, '넘친 액 → 탱크', 't-dim', 'end')), only('loop'));
    // 오른쪽 패널: 부품 카드 또는 장비 평면
    s += R(1130, 130, 450, 990, 'pl-panel', {rx: 16});
    s += `<g data-v="card"></g>`;
    let lay = T(1154, 172, '장비 평면 — 한 장이 지나가는 길', 't-acc', 'start');
    const mod = (x, y, n, t, sub) => R(x, y, 176, 92, 'pl-mod', {rx: 10}) + T(x + 14, y + 34, n, 't-warn', 'start') + T(x + 50, y + 34, t, 't-sub', 'start') + T(x + 14, y + 70, sub, 't-dim', 'start');
    lay += R(1340, 200, 30, 600, 'pl-track') + T(1355, 830, '로봇', 't-dim');
    lay += mod(1150, 200, '①', '프리웻', '진공 적심') + mod(1150, 310, '②', 'Cu 셀', '몸통') + mod(1150, 420, '③', '린스', '층 사이 세정') + mod(1150, 530, '④', 'Ni 셀', '방벽');
    lay += mod(1384, 200, '⑤', '린스', '') + mod(1384, 310, '⑥', 'SnAg 셀', '솔더') + mod(1384, 420, '⑦', '린스', '') + mod(1384, 530, '⑧', '스핀 건조', '돌려서 말림');
    lay += R(1170, 880, 150, 80, 'pl-foup', {rx: 8}) + T(1245, 928, '로드포트', 't-sub') + R(1400, 880, 150, 80, 'pl-foup', {rx: 8}) + T(1475, 928, '로드포트', 't-sub');
    lay += TT(1154, 1010, ['실제 모듈 수 · 순서는 장비마다 다르다', '층 사이 시간이 길면 표면이 산화된다'], 't-dim', 'start', 30);
    s += G(lay, only('seq'));
    return s;
  },
  body(K){
    const chips = Object.keys(PARTS).map(k => `<button data-v="${k}" aria-pressed="false">${PARTS[k][0].split(' (')[0]}</button>`).join('');
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 부품을 눌러 보세요 (장면의 부품도 눌러집니다)</div>
      <div class="pl-seg pl-chips" data-g="part">${chips}</div>
      <div class="pl-pcard" data-o="pcard"></div></div>`;
  },
  mount(K, ctx){
    const {R, T, G, wrap, TT} = K;
    let sel = null;
    function show(id){
      sel = id;
      ctx.$$('.pl-part').forEach(g => g.classList.toggle('pl-psel', g.getAttribute('data-part') === id));
      ctx.card.querySelectorAll('[data-g="part"] button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === id ? 'true' : 'false'));
      const p = PARTS[id];
      const box = ctx.$('[data-v="card"]');
      if (!p){ box.innerHTML = ''; ctx.q('[data-o=pcard]').innerHTML = ''; return; }
      let s = T(1154, 172, '부품 카드', 't-acc', 'start') + T(1154, 222, p[0], 't-lbl', 'start');
      s += T(1154, 280, '하는 일', 'pl-hdg', 'start') + TT(1154, 314, wrap(p[1], 18.5), 't-sub', 'start', 32);
      const y2 = 314 + wrap(p[1], 18.5).length * 32 + 40;
      s += T(1154, y2, '나빠지면 보이는 것', 'pl-hdg2', 'start') + TT(1154, y2 + 34, wrap(p[2], 18.5), 't-sub', 'start', 32);
      box.innerHTML = G(s, K.on('head', 'seq'));
      ctx.q('[data-o=pcard]').innerHTML = `<b>${p[0]}</b> — ${p[1]}.<br><span class="bad">나빠지면: ${p[2]}</span>`;
      ctx.refresh();
    }
    ctx.card.querySelector('[data-g="part"]').addEventListener('click', ev => {
      const b = ev.target.closest('button'); if (!b) return;
      show(b.dataset.v);
      const sid = ctx.step();
      if (sid === 'seq') ctx.go('head');
    });
    ctx.scene.addEventListener('click', ev => {
      const g = ev.target.closest && ev.target.closest('.pl-part'); if (!g || g.closest('.off')) return;
      show(g.getAttribute('data-part'));
      if (ctx.step() === 'seq') ctx.go('head');
    });
    ctx.show = show;
    ctx.picked = false;
    ctx.card.querySelector('[data-g="part"]').addEventListener('click', () => { ctx.picked = true; });
    ctx.scene.addEventListener('click', () => { ctx.picked = true; });
    show('head');
  },
  onStep(K, ctx, sid){
    if (!ctx.show) return;
    const list = STEP_PARTS[sid] || [];
    if (sid === 'seq'){ ctx.$$('.pl-part').forEach(g => g.classList.remove('pl-psel')); return; }
    // 단계를 넘기면 그 단계의 첫 부품을 보여 준다 (손으로 고른 부품이 그 단계에 속하면 그대로)
    const cur = ctx.card.querySelector('[data-g="part"] [aria-pressed="true"]');
    if (!ctx.picked || !cur || !list.includes(cur.dataset.v)) ctx.show(list[0]);
    ctx.$$('.pl-part').forEach(g => g.classList.toggle('pl-pstep', list.includes(g.getAttribute('data-part'))));
  },
  notes(K){
    return K.terms([
      ['컵(분수)형 셀', '웨이퍼를 앞면이 아래로 액면에 대는 방식. 아래에서 올라온 액이 넘쳐 흐른다'],
      ['수직형 셀', '웨이퍼를 세워서 담그는 방식. 패들(왕복 날개)로 교반하기도 한다'],
      ['음극액 · 양극액', '분리막으로 나뉜 웨이퍼 쪽 액 · 애노드 쪽 액'],
      ['넘침 둑 (weir)', '넘친 액을 받아 돌려보내는 둑. 액면 높이를 일정하게'],
      ['스핀 건조 (SRD)', '돌리며 물로 헹구고 말리는 모듈']
    ]) + K.field([
      '<b>증상 → 부품</b>: 한쪽만 얇다 → 콘택트 · 립씰 · 헤드 수평. 무작위 노듈 → 필터 · 애노드 · 입자. 전압 상승 → 분리막 · 접점 · 액. 줄무늬 → 흐름 · 회전 · 고저항판.',
      '립씰 · 콘택트는 웨이퍼와 직접 닿는 소모품입니다. 세정 · 점검 · 교체 주기와 <b>교체 직후 첫 웨이퍼</b>(시즈닝 · 더미 도금)를 관리합니다.',
      'PM(예방 정비) 뒤에는 무엇을 바꿨는지와 첫 lot 결과를 함께 기록해 두면, 다음 이상 때 비교 기준이 됩니다 (<a href="#go-edu-6">06 업무 알고리즘 작성법</a>).'
    ]) + K.deep(`<ul>
      <li><b>콘택트 디플레이팅</b> — 누액으로 콘택트에 붙은 금속은 접촉 저항을 흐트러뜨립니다. 장비에 따라 역전류로 벗겨 내거나(디플레이팅) 세정 모듈에서 씻어 냅니다.</li>
      <li><b>기울여 넣기 · 회전</b> — 웨이퍼를 비스듬히 액에 넣고 돌리면 앞면의 기포가 한쪽으로 빠져나갑니다. 넣는 순간 전류를 걸지(hot entry) 말지는 시드 보호 · 표면 산화와 관련된 장비 설정입니다.</li>
      <li><b>분리막</b> — 이온은 통과시키고 첨가제 · 입자는 막습니다. 막히면 같은 전류에 전압이 오르고 양극액 · 음극액 농도가 따로 변할 수 있어, 두 방의 농도를 각각 관리하기도 합니다.</li>
      <li><b>정류기 FDC</b> — 전류 · 전압 · 전기량(Ah)을 웨이퍼마다 기록하면, 전압 추세로 접점 · 분리막 · 액 상태를 미리 알아챌 수 있습니다 (<a href="#go-edu-5">05 제조기술의 기초</a>).</li></ul>`);
  }
});
})();
