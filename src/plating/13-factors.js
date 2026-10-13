/* 전해도금 13 — 인자 지도: 무엇을 바꾸면 무엇이 바뀔까 (한 장 정리) */
(function(){
const OUTS = [
  ['th', '두께 · 속도'], ['wiw', '웨이퍼 균일도'], ['wid', '다이 안 균일도'], ['shape', '윗면 모양'], ['grain', '결정 · 표면'],
  ['comp', '조성 (Ag %)'], ['stress', '응력 · 밀착'], ['imp', '막 속 불순물'], ['defect', '결함 (노듈 · 탄 도금 · 보이드)']
];
// [id, 이름, 꼬리표(ep 도금 · up 비도금 · hw 장비), 묶음, [[결과, 방향(good · bad · up · down · chg), 확신(L 법칙 · T 보통 · D 조건 따라), 설명]]]
const INS = [
  ['cd', '전류밀도 ↑', 'ep', 0, [['th', 'up', 'L', '빨라진다 — 쌓이는 양 ∝ 전류 × 시간 (효율이 같을 때)'], ['wiw', 'bad', 'T', '보통 나빠진다 — 분극 효과↓ · 시드에서 잃는 전압↑'], ['wid', 'bad', 'T', '고립 · 밀집 차이(패턴 효과)가 커진다'],
    ['shape', 'chg', 'D', '윗면 모양이 바뀐다 — 방향은 도금액에 따라'], ['grain', 'chg', 'D', '보통 고와지지만 한계전류 근처면 거칠어진다'], ['comp', 'down', 'T', 'Ag 공급이 확산에 좌우되는 액이면 Ag %↓'], ['defect', 'bad', 'T', '한계전류에 가까워져 노듈 · 탄 도금 · 피트↑']]],
  ['time', '시간 (전기량) ↑', 'ep', 0, [['th', 'up', 'L', '두께 = 전류 × 시간 (패러데이 법칙)'], ['defect', 'bad', 'T', 'PR 높이를 넘기면 버섯 머리 → 브리지']]],
  ['agit', '교반 · 흐름 ↑', 'ep', 0, [['defect', 'good', 'T', '확산층↓ → 한계전류↑, 기포가 잘 빠져 탐 · 피트↓'], ['comp', 'up', 'T', 'Ag 공급↑ → Ag %↑'], ['shape', 'chg', 'T', '세기보다 고르기 — 한쪽 흐름이면 윗면이 기운다'],
    ['wiw', 'chg', 'D', '흐름 모양에 따라 좋아지기도, 나빠지기도']]],
  ['temp', '온도 ↑', 'ep', 0, [['defect', 'chg', 'D', '한계전류↑(좋음) 대신 첨가제 분해 · Sn⁴⁺ · PR 들뜸↑(나쁨)'], ['grain', 'chg', 'D', '결정 크기 · 첨가제 흡착이 달라진다'], ['stress', 'chg', 'D', 'Ni 응력 보통↓, 너무 높거나 pH↓면 설파민산 분해로 오히려↑ (pH · 붕산 관리, 11장)'],
    ['comp', 'chg', 'D', 'Ag %는 도금액에 따라 다르다']]],
  ['qtime', '대기 시간 (Q-time) ↑', 'ep', 0, [['stress', 'bad', 'T', '층 사이 산화 · 부동태 → Cu/Ni · Ni/SnAg 밀착↓'], ['defect', 'bad', 'T', '시드 산화 → 누락 · 보이드, 솔더 산화막 → 비용융']]],
  ['metal', '금속 농도 ↑', 'ep', 1, [['defect', 'good', 'L', '한계전류 ∝ 농도 → 탐까지 여유↑ (너무 진하면 결정 석출)'], ['comp', 'chg', 'T', '액의 Ag↑ → Ag %↑ · Sn↑ → Ag %↓ (확산 지배면 Ag 농도에 거의 비례)']]],
  ['sup', '억제제 ↑', 'ep', 1, [['wiw', 'good', 'T', '분극 저항(곡선 기울기)↑ → 전류가 고르게 (04장)'], ['wid', 'good', 'T', '패턴 효과가 줄어든다'], ['grain', 'good', 'T', '결정이 곱고 매끈']]],
  ['acc', '촉진제 ↑', 'ep', 1, [['shape', 'chg', 'T', '그 자리 속도↑ — 지나치면 볼록 · 거칠어짐'], ['grain', 'chg', 'D', '결정 · 광택이 달라진다'], ['imp', 'bad', 'T', 'S 혼입↑ → 고온에서 커켄달 보이드 (Cu, 06장)']]],
  ['lev', '평탄제 ↑', 'ep', 1, [['shape', 'good', 'T', '윗면이 평평해진다 (과하면 오목 등 다른 모양)'], ['imp', 'bad', 'T', '지나치면 막 속 불순물↑'], ['stress', 'bad', 'T', '지나치면 막이 잘 깨진다 (취성↑)']]],
  ['byp', '분해산물 (액 나이) ↑', 'ep', 1, [['grain', 'bad', 'T', '첨가제 효과가 흐려진다'], ['shape', 'chg', 'T', '윗면 모양이 흔들린다'], ['imp', 'bad', 'T', '유기물 혼입↑'], ['defect', 'bad', 'T', '노듈 · 보이드 · 젖음(비용융) 불량↑']]],
  ['kappa', '액 전도도 ↑', 'ep', 1, [['wid', 'good', 'T', '다이 · 범프 크기 균일도는 좋아진다 (바그너 수↑)'], ['wiw', 'bad', 'T', '얇은 시드에선 터미널 효과↑ (고저항판이 있으면 줄어듦)']]],
  ['seed', '시드 두께 ↑', 'up', 2, [['wiw', 'good', 'L', '시드 저항↓ → 터미널 효과↓ (시드 산포는 도금 산포로)'], ['stress', 'bad', 'T', '[뒤 공정] 식각 시간↑ → 언더컷↑ → 밑동이 약해짐'], ['defect', 'bad', 'T', '[뒤 공정] 시드 잔여 → 브리지(단락) 위험']]],
  ['open', '개구율 · 패턴', 'up', 2, [['th', 'chg', 'L', '레시피 전류 = 목표 전류밀도 × 열린 면적 → 실제 면적(CD · EBR)이 다르면 두께가 바뀐다'], ['comp', 'chg', 'T', '실제 전류밀도가 바뀌어 Ag %도 바뀐다'],
    ['defect', 'bad', 'T', '면적이 계산보다 작으면 실제 전류밀도↑ → 탐'], ['wid', 'chg', 'T', '고립 · 밀집 차이 → 다이 안 높이 산포'], ['wiw', 'chg', 'T', '총 열린 면적↑ → 총전류↑ → 터미널 효과↑']]],
  ['prth', 'PR 두께 · 구멍 깊이 ↑', 'up', 2, [['defect', 'bad', 'T', '깊은 구멍에 기포가 갇혀 누락 · 보이드↑'], ['shape', 'chg', 'D', '구멍 속 확산 거리↑ → 초기 공급↓, 모양이 달라질 수 있다']]],
  ['shield', '실드 · 고저항판 · 보조 음극', 'hw', 3, [['wiw', 'good', 'T', '가장자리 두께 · 터미널 효과를 맞춘다 (설정 · 상태가 맞을 때)'], ['comp', 'chg', 'D', '가장자리 전류밀도가 바뀌면 Ag %도'], ['defect', 'chg', 'T', '상태가 나쁘면(막힘 · 기포) 국부 얇음 · 무늬']]],
  ['contact', '콘택트 · 립씰 · 양극 상태', 'hw', 3, [['wiw', 'bad', 'T', '접촉 저항 차이 → 부채꼴 · 한쪽 치우침 · 가장자리 이상'],
    ['imp', 'bad', 'T', '양극(애노드, +) · 분리막 이상 → 첨가제 분해↑ → 분해산물 · 유기물↑'], ['defect', 'bad', 'T', '립씰 누액 → 콘택트 도금 · 가장자리 결함, 양극 피막 조각 · 분리막 손상 → 입자 · 노듈']]]
];
const TAG = {ep: '도금', up: '비도금', hw: '장비'};
const EFF = {good: ['좋아짐', 'pl-eg'], bad: ['나빠짐', 'pl-eb'], up: ['늘어남', 'pl-eu'], down: ['줄어듦', 'pl-ed'], chg: ['달라짐', 'pl-ec']};
const CONF = {L: '물리 법칙', T: '보통 경향', D: '액 · 조건에 따라'};
const IX = 50, IW = 412, IH = 50, IG = 6, GG = 14, IY = 160, OX = 1120, OW = 440, OH = 94, OG = 10, OY = 160;
const iTop = k => IY + k * (IH + IG) + INS[k][3] * GG;
const iy = k => iTop(k) + IH / 2, oy = k => OY + k * (OH + OG) + OH / 2;
// 선 가운데 (3차 베지에의 t = 0.5)
const mid = (k, j) => [(IX + IW + OX) / 2, (iy(k) + oy(j)) / 2];
const DEMO = {map: ['in', 'cd'], you: ['out', 'wiw']};

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '13', id: 'factors', part: 3, short: '인자 지도', scale: '한 장 정리',
  title: '인자 지도 — 무엇을 바꾸면 무엇이 바뀔까?',
  hook: '조건 → 결과를 한 장에',
  one: '지금까지의 내용을 한 장에 모았습니다. 왼쪽은 바꿀 수 있는 조건(인자), 오른쪽은 결과입니다. 인자를 누르면 어떤 결과가 보통 어느 쪽으로 움직이는지, 결과를 누르면 거꾸로 어떤 인자들이 그 결과를 움직이는지 보입니다.',
  ana: '<b>요리의 불 · 간 · 젓기</b> — 불(전류밀도)을 세게 하면 빨리 익지만 겉이 타기 쉽고, 젓기(교반)를 하면 고르게 익고, 양념(첨가제)은 맛과 모양을 정합니다. 어떤 손잡이가 무엇을 바꾸는지 알면 레시피를 고칠 수 있습니다. 한계: 도금에서는 같은 손잡이가 크기마다 반대로 작용하기도 합니다(전도도↑ → 다이 안은 좋아지고, 얇은 시드의 웨이퍼 중심은 나빠짐).',
  steps: [
    {id: 'map', t: '전체 지도', d: '인자(왼쪽)를 누르면 결과(오른쪽)로 선이 이어집니다. 색은 방향(초록 좋아짐 · 빨강 나빠짐 · 보라 달라짐 · 파랑 늘/줄), 선 모양은 확신 정도(실선 = 물리 법칙, 점선 = 보통 경향, ? = 액 · 조건에 따라)입니다.'},
    {id: 'you', t: '내 공정에 대입하기 — 결과에서 거꾸로', d: '문제 결과를 누르면 그 결과로 모이는 선이 보입니다. 내가 바꿀 수 있는 인자(도금)와 다른 공정이 정하는 인자(비도금), 장비 상태를 나눠 원인 후보를 세우고 작은 DOE로 확인합니다.'}
  ],
  icon(K){
    const {R, P} = K;
    return R(2, 6, 18, 10, 'pl-inb') + R(2, 26, 18, 10, 'pl-inb') + R(2, 46, 18, 10, 'pl-inb') + R(46, 16, 18, 10, 'pl-outb') + R(46, 38, 18, 10, 'pl-outb') + P('M20,11 C34,11 32,21 46,21 M20,31 C34,31 32,43 46,43 M20,51 C34,51 32,21 46,21', 'pl-edge');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only} = K;
    let s = '';
    s += T(IX, 140, '조건 (인자)', 't-acc', 'start') + T(OX, 140, '결과', 't-acc', 'start');
    // 선 (모든 인자 → 결과, 흐리게)
    INS.forEach(([id, nm, tg, grp, eff], k) => eff.forEach(([o, e, cf]) => {
      const j = OUTS.findIndex(x => x[0] === o), y1 = iy(k), y2 = oy(j);
      s += P(`M${IX + IW},${y1} C${IX + IW + 260},${y1} ${OX - 260},${y2} ${OX},${y2}`, 'pl-edge', {'data-in': id, 'data-out': o, 'data-e': e, 'data-c': cf});
    }));
    s += `<g data-v="marks"></g>`;
    INS.forEach(([id, nm, tg], k) => {
      const y = iTop(k);
      s += G(R(IX, y, IW, IH, 'pl-inb', {rx: 12}) + T(IX + 18, y + 33, nm, 't-sub', 'start') + R(IX + IW - 84, y + 11, 72, 28, 'pl-tg ' + tg, {rx: 6}) + T(IX + IW - 48, y + 31, TAG[tg], 'p13-tgt'),
        {class: 'pl-in', 'data-in': id, 'data-tip': nm + ' — 누르면 영향선이 보입니다'});
    });
    OUTS.forEach(([id, nm], k) => {
      const y = OY + k * (OH + OG);
      s += G(R(OX, y, OW, OH, 'pl-outb', {rx: 12}) + T(OX + 18, y + 30, nm, 't-sub', 'start') + `<g data-ot="${id}" data-y="${y}"></g>`, {class: 'pl-out', 'data-out': id, 'data-tip': nm + ' — 누르면 거꾸로, 이 결과를 움직이는 인자들'});
    });
    // 범례: 색 = 방향, 선 모양 = 확신 정도
    let lg = R(520, 102, 560, 64, 'pl-box', {rx: 10});
    [['pl-egc', '좋아짐'], ['pl-ebc', '나빠짐'], ['pl-ecc', '달라짐'], ['pl-euc', '늘/줄']].forEach(([c, t], j) => { lg += C(546 + j * 132, 121, 8, c) + T(560 + j * 132, 128, t, 'p13-lg', 'start'); });
    lg += L(538, 151, 578, 151, 'p13-ls') + T(586, 157, '법칙', 'p13-lg', 'start') + L(660, 151, 700, 151, 'p13-ls p13-T') + T(708, 157, '보통 경향', 'p13-lg', 'start')
      + C(818, 150, 11, 'p13-qc') + T(818, 156, '?', 'p13-qt') + T(836, 157, '액 · 조건에 따라', 'p13-lg', 'start');
    s += LB(lg, tip('색 = 어느 쪽으로 움직이나\n선 모양 = 얼마나 확실한가 (실선: 물리 법칙 · 점선: 보통 경향 · ?: 도금액 · 조건에 따라 다름)'));
    s += G(LB(R(536, 958, 528, 130, 'pl-box p13-ybox', {rx: 12}) + K.TT(558, 994, ['도금 = 내가 바꿀 수 있다', '비도금 = 앞 공정 · 설계가 정한다 → 그 팀과 함께', '장비 = PM · 부품 상태 → 장비 담당과 함께', '결과를 누르면 거꾸로 원인 후보가 모인다'], 'p13-you', 'start', 25)), only('you'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 인자를 눌러 보세요 (장면의 상자도 눌러집니다)</div>
      <div class="pl-seg pl-chips" data-g="in">${INS.map(([id, nm]) => `<button data-v="${id}" aria-pressed="false">${nm}</button>`).join('')}</div>
      <div class="pl-seg pl-chips" data-g="out"><span class="lb">결과에서 거꾸로</span>${OUTS.map(([id, nm]) => `<button data-v="${id}" aria-pressed="false">${nm.split(' (')[0]}</button>`).join('')}</div>
      <div class="pl-pcard p13-fcard" data-o="fcard"></div>
      ${K.note('선 모양 = 확신 정도: 실선은 물리 법칙, 점선은 보통 경향, ?는 도금액 · 조건에 따라 방향이 바뀝니다. 경향을 법칙으로 외우지 말고, 바꾸기 전에 작은 DOE로 확인합니다.')}</div>`;
  },
  mount(K, ctx){
    const {T, C, G} = K;
    let touched = false, cur = null;
    ctx.card.classList.add('p13-card');                          // 단계 설명 높이를 고정해 단계가 바뀌어도 카드 길이가 그대로이게
    const setChips = (g, v) => ctx.card.querySelectorAll(`[data-g="${g}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const effOf = (o, f) => K.TT(OX + 18, (+o.getAttribute('data-y')) + 58, K.wrap(`${EFF[f[0]][0]} — ${f[2]}`, 24.5).slice(0, 2), 'pl-ot ' + EFF[f[0]][1] + 't', 'start', 22);
    const badge = (o, cf) => { const y = +o.getAttribute('data-y') + 22, x = OX + OW - 16; return cf === 'D' ? C(x - 10, y, 11, 'p13-qc') + T(x - 10, y + 6, '?', 'p13-qt') : K.L(x - 40, y, x, y, 'p13-ls' + (cf === 'T' ? ' p13-T' : '')); };
    // 인자 하나 → 결과들
    function showIn(id){
      cur = ['in', id];
      const inp = INS.find(x => x[0] === id), k = INS.indexOf(inp);
      ctx.$$('.pl-in').forEach(g => { g.classList.toggle('pl-sel', g.getAttribute('data-in') === id); g.classList.remove('dim'); });
      ctx.$$('.pl-out').forEach(g => g.classList.remove('pl-sel'));
      setChips('in', id); setChips('out', '');
      const hit = new Set();
      let mk = '';
      ctx.$$('.pl-edge').forEach(e => {
        const on = e.getAttribute('data-in') === id, cf = e.getAttribute('data-c');
        e.setAttribute('class', on ? `pl-edge on ${EFF[e.getAttribute('data-e')][1]} p13-${cf}` : 'pl-edge');
        if (on){ hit.add(e.getAttribute('data-out')); if (cf === 'D'){ const [mx, my] = mid(k, OUTS.findIndex(x => x[0] === e.getAttribute('data-out'))); mk += C(mx, my, 13, 'p13-qc') + T(mx, my + 7, '?', 'p13-qt'); } }
      });
      ctx.$('[data-v="marks"]').innerHTML = mk;
      ctx.$$('.pl-out').forEach(g => g.classList.toggle('dim', !hit.has(g.getAttribute('data-out'))));
      ctx.$$('[data-ot]').forEach(g => { const f = inp[4].find(x => x[0] === g.getAttribute('data-ot')); g.innerHTML = f ? effOf(g, [f[1], f[2], f[3]]) + badge(g, f[2]) : ''; });
      ctx.q('[data-o=fcard]').innerHTML = `<b>${inp[1]}</b> <span class="pl-tag ${inp[2]}">${TAG[inp[2]]}</span><br>` + inp[4].map(([o, e, cf, tx]) => `· ${OUTS.find(x => x[0] === o)[1]}: <span class="${EFF[e][1]}t">${EFF[e][0]}</span> <span class="p13-cf ${cf}">${CONF[cf]}</span> — ${tx}`).join('<br>');
    }
    // 결과 하나 ← 인자들 (거꾸로)
    function showOut(id){
      cur = ['out', id];
      const out = OUTS.find(x => x[0] === id), j = OUTS.indexOf(out), from = INS.filter(x => x[4].some(f => f[0] === id));
      ctx.$$('.pl-out').forEach(g => { g.classList.toggle('pl-sel', g.getAttribute('data-out') === id); g.classList.toggle('dim', g.getAttribute('data-out') !== id); });
      ctx.$$('.pl-in').forEach(g => { g.classList.remove('pl-sel'); g.classList.toggle('dim', !from.some(x => x[0] === g.getAttribute('data-in'))); });
      setChips('out', id); setChips('in', '');
      let mk = '';
      ctx.$$('.pl-edge').forEach(e => {
        const on = e.getAttribute('data-out') === id, cf = e.getAttribute('data-c');
        e.setAttribute('class', on ? `pl-edge on ${EFF[e.getAttribute('data-e')][1]} p13-${cf}` : 'pl-edge');
        if (on && cf === 'D'){ const [mx, my] = mid(INS.findIndex(x => x[0] === e.getAttribute('data-in')), j); mk += C(mx, my, 13, 'p13-qc') + T(mx, my + 7, '?', 'p13-qt'); }
      });
      ctx.$('[data-v="marks"]').innerHTML = mk;
      const cnt = {ep: 0, up: 0, hw: 0};
      from.forEach(x => cnt[x[2]]++);
      ctx.$$('[data-ot]').forEach(g => { g.innerHTML = g.getAttribute('data-ot') === id ? K.TT(OX + 18, +g.getAttribute('data-y') + 58, [`인자 ${from.length}개가 움직인다`, `도금 ${cnt.ep} · 비도금 ${cnt.up} · 장비 ${cnt.hw}`], 'pl-ot p13-rev', 'start', 22) : ''; });
      ctx.q('[data-o=fcard]').innerHTML = `<b>${out[1]}</b>을(를) 움직이는 인자 ${from.length}개 — 원인 후보를 꼬리표별로 나눠 봅니다.<br>` + ['ep', 'up', 'hw'].map(tg => from.filter(x => x[2] === tg).map(x => { const f = x[4].find(y => y[0] === id); return `<span class="pl-tag ${tg}">${TAG[tg]}</span>${x[1]}: <span class="${EFF[f[1]][1]}t">${EFF[f[1]][0]}</span> <span class="p13-cf ${f[2]}">${CONF[f[2]]}</span> — ${f[3]}`; }).join('<br>')).filter(Boolean).join('<br>');
    }
    const user = fn => v => { touched = true; fn(v); };
    ctx.card.querySelector('[data-g="in"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) user(showIn)(b.dataset.v); });
    ctx.card.querySelector('[data-g="out"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) user(showOut)(b.dataset.v); });
    ctx.scene.addEventListener('click', ev => {
      const t = ev.target.closest && ev.target;
      const gi = t && t.closest('.pl-in'), go = t && t.closest('.pl-out');
      if (gi) user(showIn)(gi.getAttribute('data-in'));
      else if (go) user(showOut)(go.getAttribute('data-out'));
    });
    // 손대기 전에는 단계마다 예시 (전체 지도: 전류밀도, 내 공정: 웨이퍼 균일도에서 거꾸로)
    ctx.demo = sid => { const d = DEMO[sid]; if (touched || !d || (cur && cur[0] === d[0] && cur[1] === d[1])) return; (d[0] === 'in' ? showIn : showOut)(d[1]); };
    showIn('cd');
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return `<h3>정리 — 전해도금 한 장</h3>
      <ol class="flow"><li>전자를 건네면 이온이 금속이 된다 — 액 속은 이온이 나른다 <span>(01)</span></li><li>흘린 전기량만큼 쌓인다 — 열린 면적 기준 <span>(02)</span></li><li>공급의 상한은 확산층이 정한다 <span>(03)</span></li><li>곡선이 완만할수록 전류가 고르게 퍼진다 <span>(04)</span></li><li>아주 적은 첨가제가 어디가 빨리 자랄지 정한다 <span>(05)</span></li><li>막의 속(결정 · 불순물 · 응력)도 품질이다 <span>(06)</span></li><li>가장자리 접점 · 얇은 시드 → 중심이 얇다 <span>(07)</span></li><li>외로운 범프가 키가 크다 <span>(08)</span></li><li>부품마다 증상이 있다 — 맵 무늬로 찾는다 <span>(09)</span></li><li>금속마다 액이 다르다 — SnAg의 Ag는 공급에 민감하다 <span>(10)</span></li><li>액은 매일 변한다 — 재고, 보충하고, 덜어 낸다 <span>(11)</span></li><li>처음 보인 단계 · 생김새 · 위치가 원인을 좁힌다 <span>(12)</span></li><li>인자는 도금 · 비도금 · 장비로 나누고, 경향은 확인한다 <span>(13)</span></li></ol>
      <p><b>스스로 점검</b></p>
      <ul class="jl"><li><b>1부</b> — 1 ASD로 Cu를 20 µm 쌓으려면 대략 몇 분? <i>(약 90분 — 1 ASD에서 약 0.22 µm/분, 02장)</i></li>
      <li><b>1부</b> — 같은 전류인데 열린 면적이 절반인 제품이 왔다. 같은 시간에 높이는? <i>(약 2배 — 전류밀도가 2배, 02장)</i></li>
      <li><b>1부</b> — 액 속에서 전기를 나르는 것은 전자일까? <i>(아니다 — 이온이 나른다. 전자는 금속 안에서만, 01장)</i></li>
      <li><b>1부</b> — 교반을 4배로 세게 하면 확산층과 한계전류는? <i>(모델 δ ∝ 1/√교반: 확산층 약 절반, 한계전류 약 2배, 03장)</i></li>
      <li><b>1부</b> — 같은 레시피인데 정류기 전압이 평소보다 높다. 의심할 순서는? <i>(접점 · 립씰 → 시드 → 액(산 · 온도) → 분리막 · 고저항판 → 양극(애노드), 04 · 09장)</i></li>
      <li><b>2부</b> — 시드가 얇아진 lot에서 어디가 얇아질까? 도금 인자인가? <i>(중심 — 터미널 효과. 비도금 인자, 07장)</i></li>
      <li><b>2부</b> — 억제제가 곡선을 옆으로만 옮기고 기울기는 그대로라면 균일도는? <i>(거의 그대로 — 균일도를 돕는 것은 기울기, 04 · 05장)</i></li>
      <li><b>2부</b> — 외톨이 범프가 높은 이유와 대책 두 가지는? <i>(주변 전류를 혼자 받음 · 더미 범프 · 전류밀도↓, 08장)</i></li>
      <li><b>3부</b> — 웨이퍼 맵에서 한쪽만 두껍다. 먼저 볼 곳은? <i>(콘택트 · 립씰 · 웨이퍼 기울어짐 같은 하드웨어, 07 · 09장)</i></li>
      <li><b>3부</b> — 필터가 막혀 순환 유량이 줄었다. SnAg의 Ag %는? <i>(보통 내려간다 — 확산층↑ → Ag 공급↓, 03 · 10장)</i></li>
      <li><b>3부</b> — bleed & feed 비율을 2배로 올리면 분해산물이 멈추는 수준은? <i>(약 절반 — 정상 수준 = g · Ah / b, 11장)</i></li>
      <li><b>3부</b> — 생산량이 2배인데 첨가제를 시간 기준으로만 보충하면? <i>(모자라 규격을 벗어나기 쉽다 → Ah + 시간, 분석 보정, 11장)</i></li>
      <li><b>3부</b> — 누락이 도금 직후 검사에서 처음 보였다 vs PR 제거 뒤 처음 보였다 — 차이는? <i>(기포 · PR 찌꺼기 vs 쌓였다 떨어짐, 12장)</i></li>
      <li><b>3부</b> — 리플로우 뒤 솔더가 덜 둥글다. 확인할 세 가지는? <i>(리플로우 온도 · 표면 산화막 · Ag %, 10 · 12장)</i></li>
      <li><b>3부</b> — 액 전도도를 올리면 균일도는 좋아질까? <i>(다이 안은 보통 좋아지지만, 얇은 시드에서는 웨이퍼 중심이 더 얇아질 수 있다, 07 · 13장)</i></li></ul>
      <div class="btns"><button class="jb primary" data-act="top">처음부터 다시</button><button class="jb" data-act="pres">▶ 발표 모드</button></div>
      <p class="hint">더 보기: 범프 만드는 순서 <a href="#go-bump">범프 공정</a> · HBM에서의 자리 <a href="#go-hbm">HBM 역추적</a> · 공식과 계산기 <a href="#go-edu-3">03 공학의 기초</a> · 관리 포인트 · SPC · 8D <a href="#go-edu-5">05 제조기술의 기초</a> · 판정 절차 남기기 <a href="#go-map">업무 알고리즘 맵</a></p>`;
  },
  css: `.pl-svg .pl-edge.on.p13-T{stroke-dasharray:14 9}
.pl-svg .pl-edge.on.p13-D{stroke-dasharray:4 8}
.pl-svg .p13-tgt{font-size:16px;font-weight:800;fill:#f1f5f9 !important;text-anchor:middle;stroke:none !important}
.pl-svg .p13-lg{font-size:18px;fill:#cbd5e1 !important}
.pl-svg .p13-ls{fill:none;stroke:#e2e8f0;stroke-width:4}
.pl-svg .p13-ls.p13-T{stroke-dasharray:10 7}
.pl-svg .p13-qc{fill:#2e1065;stroke:#c4b5fd;stroke-width:2}
.pl-svg .p13-qt{font-size:18px;font-weight:900;fill:#ede9fe !important;text-anchor:middle;stroke:none !important}
.pl-svg .p13-you{font-size:19px;fill:#e2e8f0 !important}
.pl-svg .pl-box.p13-ybox{fill:#0a1222;fill-opacity:.97}
.pl-svg .p13-rev{fill:#fde68a !important;font-weight:700}
.pl-svg .pl-out{cursor:pointer}
.pl-svg .pl-out.pl-sel .pl-outb{stroke:#f59e0b;stroke-width:3;fill:rgba(40,30,10,.7)}
.jc.p13-card .steps li.open em{min-height:72px}
.jc .p13-fcard{height:250px;overflow-y:auto;padding-right:4px;overscroll-behavior:contain}
.jc .p13-cf{font-size:10.5px;border-radius:5px;padding:0 4px;border:1px solid rgba(148,163,184,.35);color:#cbd5e1}
.jc .p13-cf.L{border-style:solid;color:#f1f5f9}
.jc .p13-cf.T{border-style:dashed}
.jc .p13-cf.D{border-style:dotted;color:#c4b5fd}`
});
})();
