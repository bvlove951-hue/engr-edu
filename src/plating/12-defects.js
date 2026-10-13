/* 전해도금 12 — 불량 도감: 모양을 보면 원인이 보인다 (범프 단면 · µm) */
(function(){
const TAG = {ep: '도금', up: '앞 공정', dn: '뒤 공정', hw: '장비'};
// [id, 이름, 생김새, 원인 후보 [[꼬리표, 글]], 확인 방법, 대책 방향]
const DEF = [
  ['normal', '정상', '고른 높이의 Cu 기둥 위에 얇은 Ni, 둥근 SnAg 솔더', [], ['비교 기준 — 같은 lot의 정상 범프 단면을 늘 함께 본다'], ''],
  ['height', '높이 산포', '범프 높이가 웨이퍼 · 다이 안에서 고르지 않다', [['ep', '전류 분포 — 시드 · 실드 · 고저항판 · 전류밀도 (07장)'], ['ep', '패턴 효과 — 고립 · 가장자리 범프 (08장)'], ['hw', '접점 · 립씰 이상 — 한쪽 치우침'], ['up', '시드 두께 · PR 두께 · 구멍 크기']], ['웨이퍼 맵 무늬 (동심원 · 한쪽 · 다이 안)', '셀 · 장비 · 시점별 비교', '같은 lot의 PVD · PR 이력'], '실드 · 고저항판 · 전류밀도 조정, 더미 패턴, 하드웨어 점검'],
  ['shape', '윗면 모양 이상', '윗면이 볼록(돔)하거나 오목(접시)하다', [['ep', '첨가제 균형 · 분해산물 (05장)'], ['ep', '전류밀도 · 흐름'], ['up', '구멍 크기 · PR 벽 모양']], ['3D 형상 · 단면 측정 (어디를 재는지 정의)', 'CVS 분석 추세', '전류밀도별 비교'], '첨가제 농도 · bleed & feed, 전류밀도 · 흐름 조정'],
  ['void', '보이드', '솔더나 범프 속에 빈 구멍', [['ep', '도금 중 기포 · 수소 (한계 근처)'], ['ep', '유기물 혼입 — 첨가제 과다 · 분해산물'], ['dn', '리플로우 조건 · 분위기'], ['dn', '고온에서 IMC 성장 · 커켄달 보이드 (06장)']], ['X-ray · 단면', '도금 직후 vs 리플로우 후 비교', '첨가제 · 분해산물 이력'], '전류밀도 · 교반 · 첨가제 관리, 리플로우 조건 확인'],
  ['missing', '누락 · 미도금', '범프가 없거나 아주 작다', [['ep', '구멍 속 기포 — 프리웻 · 젖음 부족 (08장)'], ['up', '현상 덜 됨 · 스컴 — 디스컴 부족'], ['up', '시드 손상 · 산화'], ['hw', '국부 접점 불량']], ['위치 무늬 (무작위 · 모여 있음 · 가장자리)', '단면에서 바닥(시드 · 스컴) 상태', '프리웻 조건 · 대기 시간'], '프리웻 · 기울여 넣기 · 습윤제 점검, 디스컴 조건 확인'],
  ['nodule', '노듈 (혹)', '범프 표면에 혹 · 돌기가 붙었다', [['ep', '액 속 입자 — 필터 · 양극 찌꺼기 · Sn⁴⁺ 슬러지'], ['ep', '국부 고전류 · 한계전류 근처'], ['up', '표면 이물 · PR 잔여']], ['혹을 자른 단면 — 속에 입자가 있는지', '필터 차압 · 교체 이력', '양극 · 분리막 상태'], '필터 · 순환 점검, 양극 관리, 전류밀도 낮추기'],
  ['burnt', '탄 도금 (거친 면)', '거칠고 어두운 가루 같은 표면', [['ep', '한계전류 초과 — 전류↑ · 교반↓ · 금속↓ · 온도↓ (03장)'], ['ep', '첨가제 부족 · 분해산물 과다'], ['hw', '유량 저하 · 국부 고전류']], ['전류밀도와 한계전류의 여유', '유량 · 온도 로그', '분석값 추세'], '전류밀도↓ · 교반↑ · 농도 보정'],
  ['footing', '도금 번짐 (밑동)', '범프 밑동이 PR 밑으로 번져 넓다', [['up', 'PR 밀착 불량 — 시드 표면 · 베이크'], ['up', 'PR 들뜸 · 크랙'], ['ep', '전처리 · 프리웻이 PR 가장자리를 손상']], ['위에서 본 밑동 · 단면', 'PR 공정 이력 (코팅 · 노광 · 현상)', '시드 표면 상태 · 대기 시간'], 'PR 밀착 조건 · 전처리 조건 확인'],
  ['undercut', '언더컷 과다', '범프 아래 시드가 안쪽으로 많이 깎였다', [['dn', '시드 식각 과다 — 시간 · 농도 · 온도'], ['dn', '다른 금속이 닿은 곳에서 식각이 빨라짐 (갈바닉)'], ['ep', '범프 밑동 모양']], ['단면 · 전단 강도', '식각 조건 · 액 상태'], '시드 식각 조건 최적화'],
  ['nicrack', 'Ni 크랙 · 박리', 'Ni 층이 갈라지거나 Cu · SnAg와 떨어졌다', [['ep', 'Ni 응력 과다 — 전류밀도 · 온도 · pH · 첨가제 · 불순물'], ['ep', 'Cu 표면 산화 · 오염 뒤 Ni 도금'], ['ep', 'Ni 표면 산화 뒤 SnAg — 층 사이 시간 · 린스']], ['박리 위치 — 어느 계면인지', '응력 측정 (굽힘 시편)', '층 사이 대기 시간 · 린스'], 'Ni 액 · 조건 관리, 층 사이 시간 단축 · 표면 활성화'],
  ['nonmelt', '비용융 (덜 녹음)', '리플로우 뒤에도 솔더가 둥글지 않고 울퉁불퉁하다', [['ep', 'Ag 함량 과다 · 산포 → 다 녹는 온도↑ (10장)'], ['dn', '솔더 표면 산화막 — 플라즈마 처리 부족'], ['dn', '리플로우 최고 온도 · 시간 부족'], ['ep', '유기물 혼입']], ['Ag 함량(XRF) 맵 · 장비 · 셀 비교', '리플로우 프로파일', '표면 산화 · 플라즈마 조건'], '전류밀도 · 흐름 · Ag 농도 조정, 리플로우 · 전처리 확인'],
  ['bridge', '브리지 (붙음)', '이웃 솔더끼리 붙었다 (단락)', [['ep', '솔더 양 과다 — 높이 산포 · 고립 · 가장자리'], ['up', '도금 번짐 (밑동)'], ['dn', '리플로우 중 쏠림 · 이물']], ['위치 (가장자리 · 고립)', '솔더 높이 맵', '밑동 상태'], '높이 산포 개선, 솔더 두께 조정']
];
const BY = Object.fromEntries(DEF.map(d => [d[0], d]));
const GROUPS = {size: ['height', 'shape'], hole: ['void', 'missing'], surf: ['nodule', 'burnt'], intf: ['footing', 'undercut', 'nicrack'], melt: ['nonmelt', 'bridge']};
const TW = 246, TH = 318, TG = 12, GX = 40, GY = 130;
const tilePos = i => ({x: GX + (i % 4) * (TW + TG), y: GY + Math.floor(i / 4) * (TH + TG)});

// 작은 범프 그림: (cx, base)가 바닥 가운데, k는 배율
function bump(K, id, cx, base, k){
  const {R, C, P, E, G} = K;
  const w = 70 * k, cu = 80 * k, ni = 10 * k, dm = 46 * k;
  const pad = R(cx - 55 * k, base, 110 * k, 8 * k, 'f-al') + R(cx - 90 * k, base + 8 * k, 180 * k, 22 * k, 'f-si');
  const col = (x, hgt = cu, top = 'dome', extra = '') => {
    let s = R(x - w / 2, base - 4 * k, w, 4 * k, 'f-seed2') + R(x - w / 2, base - 4 * k - hgt, w, hgt, 'f-cu2') + R(x - w / 2, base - 4 * k - hgt - ni, w, ni, 'f-ni');
    const y0 = base - 4 * k - hgt - ni;
    if (top === 'dome') s += P(`M${x - w / 2},${y0} C${x - w / 2 - 4 * k},${y0 - dm * 0.7} ${x - w * 0.3},${y0 - dm} ${x},${y0 - dm} C${x + w * 0.3},${y0 - dm} ${x + w / 2 + 4 * k},${y0 - dm * 0.7} ${x + w / 2},${y0} Z`, 'f-sn2');
    return s + extra;
  };
  const y0 = base - 4 * k - cu - ni;
  switch (id){
    case 'height': return pad + R(cx - 140 * k, base, 110 * k, 8 * k, 'f-al') + col(cx - 85 * k) + col(cx + 45 * k, cu * 1.35);
    case 'shape': return pad + R(cx - w / 2, base - 4 * k, w, 4 * k, 'f-seed2') + P(`M${cx - w / 2},${base - 4 * k} L${cx - w / 2},${base - cu - 12 * k} Q${cx - w / 2 + 6 * k},${base - cu - 16 * k} ${cx - w / 2 + 14 * k},${base - cu - 6 * k} Q${cx},${base - cu + 14 * k} ${cx + w / 2 - 14 * k},${base - cu - 6 * k} Q${cx + w / 2 - 6 * k},${base - cu - 16 * k} ${cx + w / 2},${base - cu - 12 * k} L${cx + w / 2},${base - 4 * k} Z`, 'f-cu2');
    case 'void': return pad + col(cx) + E(cx - 12 * k, y0 - 18 * k, 9 * k, 7 * k, 'f-hole2') + E(cx + 16 * k, y0 - 28 * k, 6 * k, 5 * k, 'f-hole2') + E(cx + 4 * k, y0 - 8 * k, 4 * k, 3 * k, 'f-hole2');
    case 'missing': return pad + R(cx - 140 * k, base, 110 * k, 8 * k, 'f-al') + col(cx - 85 * k) + R(cx + 45 * k - w / 2, base - 4 * k, w, 4 * k, 'f-seed2') + R(cx + 45 * k - w / 2, base - 18 * k, w, 14 * k, 'f-cu2') + R(cx + 45 * k - w / 2, base - 4 * k - cu - ni - dm, w, cu + ni + dm - 14 * k, 'pl-ghost');
    case 'nodule': return pad + col(cx) + C(cx + 22 * k, y0 - 38 * k, 13 * k, 'f-sn2') + C(cx - w / 2 - 6 * k, base - 50 * k, 9 * k, 'f-cu2');
    case 'burnt': { let s = pad + R(cx - w / 2, base - 4 * k, w, 4 * k, 'f-seed2') + R(cx - w / 2, base - 4 * k - cu, w, cu, 'f-cu2'); let d = `M${cx - w / 2},${base - 4 * k - cu}`; for (let i = 0; i <= 10; i++) d += ` L${cx - w / 2 + i * w / 10},${base - 4 * k - cu - (i % 2 ? 14 : 4) * k}`; return s + P(d + ` L${cx + w / 2},${base - 4 * k - cu} Z`, 'pl-burnt') + C(cx - 10 * k, base - cu - 26 * k, 3 * k, 'pl-burnt') + C(cx + 18 * k, base - cu - 30 * k, 2.5 * k, 'pl-burnt'); }
    case 'footing': return pad + P(`M${cx - w / 2 - 22 * k},${base - 4 * k} L${cx - w / 2},${base - 14 * k} L${cx + w / 2},${base - 14 * k} L${cx + w / 2 + 22 * k},${base - 4 * k} Z`, 'f-cu2') + col(cx);
    case 'undercut': return pad + R(cx - w / 2 + 12 * k, base - 4 * k, w - 24 * k, 4 * k, 'f-seed2') + R(cx - w / 2, base - 4 * k - cu, w, cu, 'f-cu2') + R(cx - w / 2, y0, w, ni, 'f-ni') + P(`M${cx - w / 2},${y0} C${cx - w / 2},${y0 - dm * 0.7} ${cx - w * 0.3},${y0 - dm} ${cx},${y0 - dm} C${cx + w * 0.3},${y0 - dm} ${cx + w / 2},${y0 - dm * 0.7} ${cx + w / 2},${y0} Z`, 'f-sn2');
    case 'nicrack': return pad + col(cx) + P(`M${cx - w / 2},${y0 + ni / 2} l${12 * k},${-5 * k} l${10 * k},${8 * k} l${12 * k},${-7 * k} l${10 * k},${6 * k} l${12 * k},${-6 * k}`, 'pl-crack') + R(cx + 10 * k, y0 + ni - 1, w / 2 - 10 * k, 3 * k, 'f-hole2');
    case 'nonmelt': { let s = pad + R(cx - w / 2, base - 4 * k, w, 4 * k, 'f-seed2') + R(cx - w / 2, base - 4 * k - cu, w, cu, 'f-cu2') + R(cx - w / 2, y0, w, ni, 'f-ni'); s += P(`M${cx - w / 2},${y0} L${cx - w / 2},${y0 - 36 * k} L${cx - 18 * k},${y0 - 42 * k} L${cx - 2 * k},${y0 - 34 * k} L${cx + 16 * k},${y0 - 46 * k} L${cx + w / 2},${y0 - 38 * k} L${cx + w / 2},${y0} Z`, 'f-sn2'); for (let i = 0; i < 3; i++) s += R(cx - 24 * k + i * 18 * k, y0 - 30 * k + (i % 2) * 10 * k, 16 * k, 4 * k, 'pl-ag3'); return s; }
    case 'bridge': { const x1 = cx - 50 * k, x2 = cx + 50 * k; let s = pad + R(cx - 140 * k, base, 280 * k, 8 * k, 'f-al'); s += R(x1 - w / 2, base - 4 * k - cu, w, cu, 'f-cu2') + R(x2 - w / 2, base - 4 * k - cu, w, cu, 'f-cu2') + R(x1 - w / 2, y0, w, ni, 'f-ni') + R(x2 - w / 2, y0, w, ni, 'f-ni'); s += P(`M${x1 - w / 2},${y0} C${x1 - w / 2},${y0 - 50 * k} ${x2 + w / 2},${y0 - 50 * k} ${x2 + w / 2},${y0} L${x2 - w / 2},${y0} Q${cx},${y0 + 14 * k} ${x1 + w / 2},${y0} Z`, 'f-sn2'); return s; }
    default: return pad + col(cx);
  }
}

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '12', id: 'defects', part: 3, short: '불량 도감', scale: '범프 단면 · µm',
  title: '불량 도감 — 모양을 보면 원인이 보인다',
  hook: '생김새와 위치가 단서',
  one: '불량의 생김새(단면 · 표면)와 위치(웨이퍼 맵의 무늬)가 원인 후보를 좁혀 줍니다. 원인은 도금만이 아니므로, 도금 · 앞 공정 · 뒤 공정 · 장비로 나눠서 봅니다.',
  ana: '<b>의사의 진찰</b> — 증상(생김새)과 아픈 곳의 위치(맵 무늬)를 보고 후보 질환(원인)을 몇 개로 좁힌 뒤, 검사(단면 · 분석 · 로그)로 확인합니다. 한 번에 확진하려 하지 않습니다.',
  steps: [
    {id: 'size', t: '높이와 모양', d: '높이 산포는 전류 분포 · 패턴 효과 · 하드웨어를, 윗면 모양 이상은 첨가제 · 전류밀도 · 흐름을 먼저 봅니다. 웨이퍼 맵의 무늬가 첫 단서입니다.'},
    {id: 'hole', t: '빈자리 — 보이드 · 누락', d: '속이 빈 곳(보이드)은 기포 · 유기물 · 리플로우를, 범프가 아예 없는 곳(누락)은 기포 · 스컴 · 시드를 의심합니다. 위치가 무작위인지 모여 있는지 봅니다.'},
    {id: 'surf', t: '표면 — 노듈 · 탄 도금', d: '혹(노듈)은 입자 · 국부 고전류, 거칠고 어두운 면(탄 도금)은 한계전류 초과를 먼저 의심합니다. 혹을 잘라 속에 입자가 있는지 봅니다.'},
    {id: 'intf', t: '계면과 밑동', d: '밑동 번짐은 PR 밀착(앞 공정), 언더컷은 시드 식각(뒤 공정), Ni 크랙 · 박리는 응력과 층 사이 표면 상태를 봅니다. 어느 계면에서 떨어졌는지가 핵심입니다.'},
    {id: 'melt', t: '녹는 문제 — 비용융 · 브리지', d: '덜 녹음은 Ag 함량 · 산화막 · 리플로우 온도를, 이웃과 붙음은 솔더 양 · 밑동 번짐을 봅니다.'}
  ],
  icon(K){
    const {R, P, E} = K;
    return R(20, 30, 26, 30, 'f-cu2') + R(20, 26, 26, 4, 'f-ni') + P('M20,26 C20,10 46,10 46,26 Z', 'f-sn2') + E(30, 20, 4, 3, 'f-hole2') + P('M50,8 L62,20 M62,8 L50,20', 's-arrr');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT} = K;
    let s = '';
    DEF.forEach((d, i) => {
      const {x, y} = tilePos(i);
      let g = R(x, y, TW, TH, 'pl-tile2', {rx: 14}) + T(x + 16, y + 34, `${String(i).padStart(2, '0')} ${d[1]}`, 't-sub', 'start');
      g += bump(K, d[0], x + TW / 2, y + TH - 70, 1);
      const tags = [...new Set(d[3].map(c => c[0]))];
      tags.forEach((t, j) => { g += R(x + 14 + j * 58, y + TH - 34, 54, 24, 'pl-tg ' + t, {rx: 6}) + T(x + 41 + j * 58, y + TH - 16, TAG[t], 'pl-tgt'); });
      g += R(x, y, TW, TH, 'pl-pick', {rx: 14});
      s += G(g, {class: 'pl-def', 'data-def': d[0], 'data-tip': `${d[1]} — ${d[2]}`});
    });
    s += R(1090, 130, 490, 990, 'pl-panel', {rx: 16}) + `<g data-v="detail"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 불량을 골라 보세요 (장면의 타일도 눌러집니다)</div>
      <div class="pl-seg pl-chips" data-g="def">${DEF.map(d => `<button data-v="${d[0]}" aria-pressed="false">${d[1].split(' (')[0]}</button>`).join('')}</div>
      <div class="pl-pcard" data-o="dcard"></div>
      <p class="hint"><span class="pl-tag ep">도금</span><span class="pl-tag up">앞 공정</span><span class="pl-tag dn">뒤 공정</span><span class="pl-tag hw">장비</span> — 원인 후보의 꼬리표. 도금 인자와 비도금 인자를 나눠 DOE를 짭니다.</p></div>`;
  },
  mount(K, ctx){
    const {R, T, G, TT, wrap} = K;
    let picked = false;
    function show(id, user){
      const d = BY[id]; if (!d) return;
      if (user) picked = true;
      ctx.$$('.pl-def').forEach(g => g.classList.toggle('pl-sel', g.getAttribute('data-def') === id));
      ctx.card.querySelectorAll('[data-g="def"] button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === id ? 'true' : 'false'));
      // 오른쪽 상세
      let s = R(1110, 150, 450, 300, 'pl-lane', {rx: 12}) + bump(K, id, 1335, 395, 1.75);
      s += T(1114, 492, d[1], 't-lbl', 'start');
      let y = 530;
      const block = (title, cls, lines) => { let b = T(1114, y, title, cls, 'start'); y += 30; lines.forEach(l => { b += T(1114, y, l, 't-dim', 'start'); y += 27; }); y += 8; return b; };
      s += block('생김새', 'pl-hdg', wrap(d[2], 22));
      if (d[3].length){
        let b = T(1114, y, '원인 후보', 'pl-hdg2', 'start'); y += 30;
        d[3].forEach(([tg, tx]) => { const ls = wrap(tx, 18.5); b += R(1114, y - 19, 70, 24, 'pl-tg ' + tg, {rx: 5}) + T(1149, y - 1, TAG[tg], 'pl-tgt'); ls.forEach((l, j) => { b += T(1194, y, l, 't-dim', 'start'); y += 27; }); });
        s += b; y += 8;
      }
      s += block('확인 방법', 'pl-hdg', d[4].flatMap(t => wrap('· ' + t, 22)));
      if (d[5]) s += block('대책 방향', 'pl-hdg3', wrap(d[5], 22));
      ctx.$('[data-v="detail"]').innerHTML = s;
      ctx.q('[data-o=dcard]').innerHTML = `<b>${d[1]}</b> — ${d[2]}.` + (d[3].length ? `<br>${d[3].map(([tg, tx]) => `<span class="pl-tag ${tg}">${TAG[tg]}</span>${tx}`).join('<br>')}` : '') + `<br><span class="bad">확인: ${d[4].join(' · ')}</span>`;
    }
    ctx.card.querySelector('[data-g="def"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b){ show(b.dataset.v, true); syncGroup(b.dataset.v); } });
    ctx.scene.addEventListener('click', ev => { const g = ev.target.closest && ev.target.closest('.pl-def'); if (g){ show(g.getAttribute('data-def'), true); syncGroup(g.getAttribute('data-def')); } });
    function syncGroup(id){ const sid = Object.keys(GROUPS).find(k => GROUPS[k].includes(id)); if (sid && ctx.step() !== sid) ctx.go(sid); }
    ctx.onStepDef = sid => {
      const grp = GROUPS[sid] || [];
      ctx.$$('.pl-def').forEach(g => { const id = g.getAttribute('data-def'); g.classList.toggle('dim', id !== 'normal' && !grp.includes(id)); });
      const cur = ctx.card.querySelector('[data-g="def"] [aria-pressed="true"]');
      if (!picked || !cur || !grp.includes(cur.dataset.v)) show(grp[0]);
    };
    show('height');
  },
  onStep(K, ctx, sid){ if (ctx.onStepDef) ctx.onStepDef(sid); },
  notes(K){
    return K.terms([
      ['맵 무늬', '불량이 웨이퍼의 어디에 있는지 — 동심원 · 한쪽 · 무작위 · 모여 있음 · 샷 단위'],
      ['단면 분석', '범프를 잘라 속(보이드 · 계면 · 층 두께)을 본다. SEM · FIB'],
      ['XRF', 'X선 형광으로 두께 · 조성(Ag 함량 등)을 재는 비파괴 측정'],
      ['X-ray 검사', '투과 X선으로 솔더 속 보이드를 본다'],
      ['전단 시험 (shear)', '범프를 옆에서 밀어 떨어지는 힘과 떨어진 면을 본다']
    ]) + K.field([
      '첫 질문은 "어디에 있나"입니다. <b>동심원</b> → 전류 분포, <b>한쪽</b> → 하드웨어, <b>샷 모양</b> → 포토, <b>무작위</b> → 입자 · 기포, <b>특정 장비 · 셀</b> → 그 장비.',
      '가설은 하나만 세우지 않습니다. 원인 후보를 [도금] · [앞 공정] · [뒤 공정] · [장비]로 나누고, 각각을 가르는 확인 방법(단면 · 분석 · 로그 · 교차 실험)을 정합니다 (<a href="#go-edu-2">02 자주 부딪히는 업무 상황</a>).',
      '판정이 끝나면 증상 → 확인 → 원인 → 대책을 <a href="#go-map">업무 알고리즘 맵</a>으로 남겨 두면 다음 사람이 같은 길을 빨리 갑니다.'
    ]) + K.deep(`<ul>
      <li><b>보이드의 두 얼굴</b> — 도금 직후부터 있는 보이드(기포 · 유기물)와 리플로우 · 고온 보관 뒤 생기는 보이드(IMC 성장 · 커켄달)는 원인이 다릅니다. 도금 직후 단면과 열처리 뒤 단면을 함께 봅니다.</li>
      <li><b>비용융 판정</b> — 겉모양만으로 Ag 과다와 산화막을 가르기 어렵습니다. XRF 조성 · 플라즈마 처리 조건 · 리플로우 프로파일을 함께 비교하는 교차 실험(같은 웨이퍼를 나눠 처리)이 빠릅니다.</li>
      <li><b>언더컷과 갈바닉</b> — 시드 식각액 속에서 서로 다른 금속이 전기적으로 닿아 있으면 한쪽이 더 빨리 녹을 수 있습니다. 범프 밑동 근처의 시드가 예상보다 많이 깎이는 이유 중 하나입니다.</li>
      <li><b>높이 산포의 결과</b> — 적층 · 접합에서 높은 범프가 먼저 눌려 찢어지거나 낮은 범프가 덜 붙습니다. 산포와 휨(warpage)을 함께 봐야 접합 불량을 설명할 수 있습니다.</li></ul>`);
  }
});
})();
