/* 전해도금 13 — 인자 지도: 무엇을 바꾸면 무엇이 바뀌나 (한 장 정리) */
(function(){
const OUTS = [
  ['th', '두께 · 속도'], ['wiw', '웨이퍼 균일도'], ['wid', '다이 안 균일도'], ['shape', '윗면 모양'],
  ['grain', '결정 · 표면'], ['comp', '조성 (Ag %)'], ['defect', '결함 위험 (노듈 · 탄 도금 · 보이드)']
];
// [id, 이름, 꼬리표, [[결과, 효과(good · bad · up · down · chg), 설명]]]
const INS = [
  ['cd', '전류밀도 ↑', 'ep', [['th', 'up', '빨라진다'], ['wiw', 'bad', '분포가 나빠지기 쉽다 (분극 효과↓)'], ['wid', 'bad', '패턴 효과가 커진다'], ['comp', 'down', 'Ag %가 내려간다'], ['defect', 'bad', '한계전류에 가까워져 거칠어짐 · 탄 도금 위험']]],
  ['agit', '교반 · 흐름 ↑', 'ep', [['comp', 'up', 'Ag %가 올라간다'], ['defect', 'good', '한계전류↑ · 기포가 잘 빠진다'], ['shape', 'chg', '구멍 안 공급이 바뀌어 윗면 모양이 달라질 수 있다']]],
  ['temp', '온도 ↑', 'ep', [['defect', 'chg', '한계전류↑ 대신 첨가제 분해 · Sn 산화가 빨라진다'], ['grain', 'chg', '결정 · 응력이 달라진다'], ['comp', 'chg', '조성이 달라질 수 있다']]],
  ['metal', '금속 농도 ↑', 'ep', [['defect', 'good', '한계전류 여유가 커진다'], ['comp', 'chg', 'Ag 농도를 올리면 Ag %가 오른다']]],
  ['add', '억제 · 평탄 첨가제 ↑', 'ep', [['wiw', 'good', '분극이 커져 고르게'], ['wid', 'good', '패턴 효과가 줄어든다'], ['shape', 'chg', '평평해진다 (과하면 다른 모양)'], ['grain', 'good', '결정이 곱고 매끈'], ['defect', 'chg', '지나치면 막 속 불순물 · 보이드']]],
  ['byp', '분해산물 ↑', 'ep', [['grain', 'bad', '첨가제 효과가 흐려진다'], ['shape', 'chg', '윗면 모양이 흔들린다'], ['defect', 'bad', '불순물 · 보이드 · 노듈 위험']]],
  ['seed', '시드 두께 ↑', 'up', [['wiw', 'good', '터미널 효과가 줄어 중심이 덜 얇다']]],
  ['open', '개구율 · 패턴', 'up', [['wid', 'chg', '고립 · 밀집 차이 → 다이 안 높이 산포'], ['wiw', 'chg', '개구율이 크면 터미널 효과가 커진다'], ['th', 'chg', '같은 전류면 개구율이 작을수록 빨리 자란다']]],
  ['kappa', '액 전도도 ↑', 'ep', [['wiw', 'chg', '1차 분포는 좋아지지만 얇은 시드에서는 터미널 효과가 커진다']]],
  ['hw', '하드웨어 상태', 'hw', [['wiw', 'bad', '접점 · 립씰 · 실드 이상 → 한쪽 치우침 · 가장자리 이상'], ['defect', 'bad', '누액 · 입자 · 기포 결함']]]
];
const TAG = {ep: '도금', up: '비도금', hw: '장비'};
const EFF = {good: ['좋아짐', 'pl-eg'], bad: ['나빠짐', 'pl-eb'], up: ['늘어남', 'pl-eu'], down: ['줄어듦', 'pl-ed'], chg: ['달라짐', 'pl-ec']};
const IX = 60, IW = 400, IH = 80, IG = 13, IY = 150, OX = 1110, OW = 440, OH = 104, OG = 32, OY = 160;
const iy = k => IY + k * (IH + IG) + IH / 2, oy = k => OY + k * (OH + OG) + OH / 2;

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '13', id: 'factors', part: 3, short: '인자 지도', scale: '한 장 정리',
  title: '인자 지도 — 무엇을 바꾸면 무엇이 바뀌나',
  hook: '조건 → 결과를 한 장에',
  one: '지금까지의 내용을 한 장에 모았습니다. 왼쪽은 바꿀 수 있는 조건(인자), 오른쪽은 결과입니다. 인자를 누르면 보통 어떤 결과가 어느 쪽으로 움직이는지 보입니다.',
  ana: '<b>요리의 불 · 간 · 젓기</b> — 불(전류밀도)을 세게 하면 빨리 익지만 겉이 타기 쉽고, 젓기(교반)를 하면 고르게 익고, 양념(첨가제)은 맛과 모양을 정합니다. 어떤 손잡이가 무엇을 바꾸는지 알면 레시피를 고칠 수 있습니다.',
  steps: [
    {id: 'map', t: '전체 지도', d: '인자(왼쪽)를 누르면 영향을 주는 결과(오른쪽)로 선이 이어집니다. 초록 = 좋아짐, 빨강 = 나빠짐, 보라 = 달라짐(조건에 따라). "보통 경향"이므로 내 공정 데이터로 확인합니다.'},
    {id: 'you', t: '내 공정에 대입하기', d: '내가 바꿀 수 있는 인자(도금)와 다른 공정이 정하는 인자(비도금)를 나누고, 문제 결과에서 거꾸로 선을 따라가 원인 후보를 세웁니다.'}
  ],
  icon(K){
    const {R, P} = K;
    return R(2, 6, 18, 10, 'pl-inb') + R(2, 26, 18, 10, 'pl-inb') + R(2, 46, 18, 10, 'pl-inb') + R(46, 16, 18, 10, 'pl-outb') + R(46, 38, 18, 10, 'pl-outb') + P('M20,11 C34,11 32,21 46,21 M20,31 C34,31 32,43 46,43 M20,51 C34,51 32,21 46,21', 'pl-edge');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W} = K;
    let s = '';
    s += T(IX, 132, '조건 (인자)', 't-acc', 'start') + T(OX, 132, '결과', 't-acc', 'start');
    // 선 (모든 인자 → 결과, 흐리게)
    INS.forEach(([id, nm, tg, eff], k) => eff.forEach(([o, e]) => {
      const j = OUTS.findIndex(x => x[0] === o), y1 = iy(k), y2 = oy(j);
      s += P(`M${IX + IW},${y1} C${IX + IW + 260},${y1} ${OX - 260},${y2} ${OX},${y2}`, 'pl-edge', {'data-in': id, 'data-out': o, 'data-e': e});
    }));
    INS.forEach(([id, nm, tg], k) => {
      const y = IY + k * (IH + IG);
      s += G(R(IX, y, IW, IH, 'pl-inb', {rx: 12}) + T(IX + 20, y + 50, nm, 't-sub', 'start') + R(IX + IW - 92, y + 26, 76, 28, 'pl-tg ' + (tg === 'up' ? 'up' : tg), {rx: 6}) + T(IX + IW - 54, y + 46, TAG[tg], 'pl-tgt'),
        {class: 'pl-in', 'data-in': id, 'data-tip': nm + ' — 누르면 영향선이 보입니다'});
    });
    OUTS.forEach(([id, nm], k) => {
      const y = OY + k * (OH + OG);
      s += G(R(OX, y, OW, OH, 'pl-outb', {rx: 12}) + T(OX + 20, y + 36, nm, 't-sub', 'start') + `<g data-ot="${id}" data-y="${y}"></g>`, {class: 'pl-out', 'data-out': id});
    });
    s += `<g data-v="labels"></g>`;
    s += LB(R(560, 1060, 480, 46, 'pl-box', {rx: 10}) + C(590, 1083, 8, 'pl-egc') + T(604, 1090, '좋아짐', 't-dim', 'start') + C(700, 1083, 8, 'pl-ebc') + T(714, 1090, '나빠짐', 't-dim', 'start') + C(810, 1083, 8, 'pl-ecc') + T(824, 1090, '달라짐', 't-dim', 'start') + C(920, 1083, 8, 'pl-euc') + T(934, 1090, '늘/줄', 't-dim', 'start'));
    s += G(LB(R(560, 140, 480, 120, 'pl-box', {rx: 12}) + K.TT(584, 182, ['도금 = 내가 바꿀 수 있다', '비도금 = 앞 공정 · 설계가 정한다', '장비 = PM · 부품 상태'], 't-dim', 'start', 30)), only('you'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 인자를 눌러 보세요 (장면의 상자도 눌러집니다)</div>
      <div class="pl-seg pl-chips" data-g="in">${INS.map(([id, nm]) => `<button data-v="${id}" aria-pressed="false">${nm}</button>`).join('')}</div>
      <div class="pl-pcard" data-o="fcard"></div>
      ${K.note('"보통 경향"입니다. 약품 계열 · 장비 · 범프 크기에 따라 방향이 달라질 수 있으니, 바꾸기 전에 작은 DOE로 확인합니다.')}</div>`;
  },
  mount(K, ctx){
    const {T, G, LB} = K;
    function show(id){
      const inp = INS.find(x => x[0] === id);
      ctx.$$('.pl-in').forEach(g => g.classList.toggle('pl-sel', g.getAttribute('data-in') === id));
      ctx.card.querySelectorAll('[data-g="in"] button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === id ? 'true' : 'false'));
      const hit = new Set();
      ctx.$$('.pl-edge').forEach(e => {
        const on = e.getAttribute('data-in') === id;
        e.setAttribute('class', on ? 'pl-edge on ' + EFF[e.getAttribute('data-e')][1] : 'pl-edge');
        if (on) hit.add(e.getAttribute('data-out'));
      });
      ctx.$$('.pl-out').forEach(g => g.classList.toggle('dim', !hit.has(g.getAttribute('data-out'))));
      ctx.$$('[data-ot]').forEach(g => { const f = inp[3].find(x => x[0] === g.getAttribute('data-ot')), y = +g.getAttribute('data-y'); g.innerHTML = f ? K.TT(OX + 20, y + 66, K.wrap(`${EFF[f[1]][0]} — ${f[2]}`, 24).slice(0, 2), 'pl-ot ' + EFF[f[1]][1] + 't', 'start', 24) : ''; });
      ctx.q('[data-o=fcard]').innerHTML = `<b>${inp[1]}</b> <span class="pl-tag ${inp[2]}">${TAG[inp[2]]}</span><br>` + inp[3].map(([o, e, tx]) => `· ${OUTS.find(x => x[0] === o)[1]}: <span class="${EFF[e][1]}t">${EFF[e][0]}</span> — ${tx}`).join('<br>');
    }
    ctx.card.querySelector('[data-g="in"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) show(b.dataset.v); });
    ctx.scene.addEventListener('click', ev => { const g = ev.target.closest && ev.target.closest('.pl-in'); if (g) show(g.getAttribute('data-in')); });
    show('cd');
  },
  notes(K){
    return `<h3>정리 — 전해도금 한 장</h3>
      <ol class="flow"><li>전자를 건네면 이온이 금속이 된다 <span>(01)</span></li><li>흘린 전기량만큼 쌓인다 — 열린 면적 기준 <span>(02)</span></li><li>공급의 상한은 확산층이 정한다 <span>(03)</span></li><li>곡선이 완만할수록 전류가 고르게 퍼진다 <span>(04)</span></li><li>막의 속(결정 · 불순물 · 응력)도 품질이다 <span>(05)</span></li><li>첨가제가 어디가 빨리 자랄지 정한다 <span>(06)</span></li><li>가장자리 접점 · 얇은 시드 → 중심이 얇다 <span>(07)</span></li><li>외로운 범프가 키가 크다 <span>(08)</span></li><li>SnAg의 Ag는 공급에 민감하다 <span>(09)</span></li><li>부품마다 증상이 있다 <span>(10)</span></li><li>액은 매일 변한다 — 재고, 보충하고, 덜어 낸다 <span>(11)</span></li><li>생김새와 위치가 원인을 좁힌다 <span>(12)</span></li></ol>
      <p><b>스스로 점검</b></p>
      <ul class="jl"><li><b>1부</b> — 같은 레시피인데 정류기 전압이 평소보다 높다. 무엇을 의심할까? <i>(접점 · 분리막 · 액 상태, 01 · 04장)</i></li>
      <li><b>1부</b> — 개구율이 절반인 제품에 같은 전류를 흘리면 두께는? <i>(전류밀도 2배 → 약 2배, 02장)</i></li>
      <li><b>1부</b> — 교반을 세게 하면 한계전류는 왜 오를까? <i>(확산층이 얇아짐, 03장)</i></li>
      <li><b>2부</b> — 시드가 얇아진 lot에서 중심이 얇아졌다. 도금 인자인가? <i>(비도금 인자 — 터미널 효과, 07장)</i></li>
      <li><b>2부</b> — 억제제가 균일도를 돕는 이유를 한 문장으로? <i>(분극을 키워 전류가 쏠리지 않게, 04 · 05장)</i></li>
      <li><b>2부</b> — 고립 범프가 높은 이유와 대책 두 가지는? <i>(넓은 곳의 전류를 혼자 받음 · 더미 범프 · 전류밀도↓, 08장)</i></li>
      <li><b>3부</b> — 리플로우 뒤 솔더가 덜 둥글다. 확인할 세 가지는? <i>(Ag 함량 · 산화막 · 리플로우 온도, 10 · 12장)</i></li>
      <li><b>3부</b> — 웨이퍼 한쪽만 두껍다. 먼저 볼 부품은? <i>(콘택트 · 립씰 · 헤드 수평, 09장)</i></li>
      <li><b>3부</b> — 생산량이 들쭉날쭉한데 첨가제가 흔들린다. 왜? <i>(시간 기준 보충, 11장)</i></li></ul>
      <div class="btns"><button class="jb primary" data-act="top">처음부터 다시</button><button class="jb" data-act="pres">▶ 발표 모드</button></div>
      <p class="hint">더 보기: 범프 만드는 순서 <a href="#go-bump">범프 공정</a> · HBM에서의 자리 <a href="#go-hbm">HBM 역추적</a> · 공식과 계산기 <a href="#go-edu-3">03 공학의 기초</a> · 관리 포인트 <a href="#go-edu-5">05 제조기술의 기초</a> · 판정 절차 남기기 <a href="#go-map">업무 알고리즘 맵</a></p>`;
  }
});
})();
