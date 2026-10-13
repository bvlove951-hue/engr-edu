/* 전해도금 02 — 패러데이 법칙: 얼마나 흘리면 얼마나 쌓일까 (범프 하나 · µm) */
(function(){
const F = 96485;
// 금속별 상수: 몰질량 M(g/mol), 이온 전하수 n, 밀도 ρ(g/cm³), 효율 기본값(예시 %), 소모량 g/Ah
const MET = {
  cu: {nm: 'Cu', ion: 'Cu²⁺', M: 63.55, n: 2, rho: 8.96, cls: 'f-cu2', e0: 100, gAh: 1.19, eff: '산성 Cu: 보통 98~100 %'},
  ni: {nm: 'Ni', ion: 'Ni²⁺', M: 58.69, n: 2, rho: 8.91, cls: 'f-ni', e0: 96, gAh: 1.10, eff: 'Ni(설파민산): 보통 95~99 % — 수소가 조금씩 함께 나온다'},
  sn: {nm: 'SnAg', ion: 'Sn²⁺', M: 118.71, n: 2, rho: 7.29, cls: 'f-sn2', e0: 95, gAh: 2.21, eff: 'SnAg(MSA): 보통 90 % 이상 — Sn 기준으로 계산 (Ag는 전기의 약 1~2 %)'}
};
const PR_UM = 60, PX = 10;                 // PR 높이(예시) 60 µm, 1 µm = 10 px
const OX = 1270, OW = 250, BASE = 1000, PRT = BASE - PR_UM * PX;
const WAF = 7.07;                          // 300 mm 웨이퍼 면적 (dm²)
const WX = 300, WY = 452, WR = 214, WS = 24;   // 레시피 단계: 웨이퍼 윗면 그림 (중심 · 반지름 · 구멍 간격)
const sci = v => { if (!isFinite(v) || v === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return `${m.toFixed(2)}×10${String(e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '02', id: 'faraday', part: 1, short: '패러데이 법칙', scale: '범프 하나 · µm',
  title: '패러데이 법칙 — 얼마나 흘리면 얼마나 쌓일까?',
  hook: '흘린 전기만큼 쌓인다',
  one: '흘린 전기량(전류 × 시간)만큼 금속이 쌓입니다. 그래서 두께는 계산으로 미리 알 수 있고, 계산과 실측이 다르면 무언가 새고 있다는 뜻입니다.',
  ana: '<b>수도꼭지와 컵</b> — 전류는 수도꼭지에서 1초에 나오는 물의 양, 시간은 틀어 둔 시간, 전기량은 받은 물의 총량입니다. 같은 양의 물이라도 <b>바닥이 좁은 컵</b>에 부으면 더 높이 찹니다. 범프 도금에서 컵 바닥 넓이는 <b>PR이 열린 면적</b>입니다. 옆으로 튄 물(수소 같은 곁반응)은 높이에 보태지지 않습니다 — 이것이 전류효율입니다. <i>(비유의 한계: 금속은 물처럼 컵 안에서 저절로 평평해지지 않습니다. 어디에 얼마나 쌓이는지는 전류 분포가 정합니다 → 07 · 08장.)</i>',
  steps: [
    {id: 'q', t: '전류 × 시간 = 전기량', d: '흘린 전기의 총량(쿨롱, C)이 쌓이는 양을 정합니다. 범프에서는 면적당 전류인 <b>전류밀도</b>로 말합니다. ASD = A/dm²(가로세로 10 cm 면적에 흐르는 암페어), 1 ASD = 10 mA/cm².'},
    {id: 'n', t: '전자 n개마다 원자 하나', d: 'Cu²⁺ · Ni²⁺ · Sn²⁺는 전자 2개, Ag⁺는 1개를 받아 원자 하나가 됩니다. 전기량 ÷ 패러데이 상수(96,485 C/mol) ÷ n = 쌓인 원자의 몰수.'},
    {id: 't', t: '원자 수 → 두께', d: '몰수 × 몰질량 ÷ 밀도 = 부피, 부피 ÷ 면적 = 두께. 한 줄로 쓰면 속도 v = J·M / (n·F·ρ). 1 ASD에서 1분에 Cu는 약 0.22 µm, SnAg는 약 0.51 µm 자랍니다.'},
    {id: 'eff', t: '전류효율 — 새는 전기', d: '전기의 일부는 수소 발생처럼 금속이 아닌 반응에 쓰입니다. 산성 Cu는 거의 100 %, Ni는 보통 90 % 대 중후반, SnAg는 보통 90 % 이상. 계산값 × 효율 = 실제 두께.'},
    {id: 'recipe', t: '레시피 전류 = 목표 전류밀도 × 열린 면적', d: '정류기는 웨이퍼 전체에 전류(A)를 줍니다. 도금은 PR이 열린 곳에만 쌓이므로 전류 = 목표 전류밀도 × 열린 면적. 열린 면적이 절반인 제품은 같은 전류로 두 배 빨리 자랍니다. 제품(마스크)이 바뀌면 전류를 다시 계산합니다.'}
  ],
  icon(K){
    const {R, P} = K;
    return R(4, 4, 18, 56, 'f-pr') + R(46, 4, 18, 56, 'f-pr') + R(22, 26, 24, 34, 'f-cu2') + P('M30,20 L34,6 L38,20 M34,6 L34,24', 's-arr2');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, on, W, ion, arrow, wrap} = K;
    let s = '';
    // 왼쪽: 계산 기계 (다섯 줄) — 레시피 단계에서는 숨김
    const rows = [
      {st: 'q', y: 150, h: 'Q = J × t', t: '① 전기량', sub: '전류밀도 × 시간 (1 cm²당)', v: 'q'},
      {st: 'n', y: 330, h: '÷ F', t: '② 전자의 몰수', sub: 'F = 96,485 C/mol (전자 1몰의 전기량)', v: 'e'},
      {st: 'n', y: 510, h: '÷ n', t: '③ 원자의 몰수', sub: '', v: 'a'},
      {st: 't', y: 690, h: '× M ÷ ρ', t: '④ 두께', sub: '', v: 'th'},
      {st: 'eff', y: 870, h: '× 효율', t: '⑤ 실제 두께', sub: '나머지 전기는 수소 거품 등 곁반응으로 샌다', v: 'real'}
    ];
    let calc = '';
    rows.forEach((r, k) => {
      let g = R(40, r.y, 880, 150, 'pl-box', {rx: 14});
      g += R(40, r.y, 880, 150, 'pl-hlbox', W({rx: 14}, only(r.st)));
      g += R(62, r.y + 26, 168, 98, 'pl-op', {rx: 12}) + T(146, r.y + 88, r.h, 'pl-opt');
      g += T(256, r.y + 48, r.t, 't-lbl', 'start') + T(256, r.y + 80, r.sub, 't-dim', 'start', {'data-v': r.v + '-sub'});
      g += T(256, r.y + 124, '', 'pl-val', 'start', {'data-v': r.v});
      if (k < rows.length - 1) g += arrow(146, r.y + 150, 146, r.y + 180, 's-arr');
      calc += G(g, tip(r.t + ' — ' + r.h));
    });
    // ③ 옆: 전자 2개 + 이온 → 원자
    calc += G(ion(700, 552, 'e') + ion(726, 552, 'e') + T(756, 559, '+', 't-lbl') + `<g data-v="ion">${ion(794, 552, 'cu')}</g>` + T(830, 559, '→', 't-lbl') + C(868, 552, 15, 'f-atom'), on('n'));
    // 오른쪽: PR 구멍 속에서 자라는 범프 (단면)
    calc += R(960, 130, 620, 960, 'pl-panel', {rx: 16}) + T(984, 172, '범프 하나 (단면) — 계산한 두께만큼 자란다', 't-acc', 'start');
    calc += R(990, BASE + 16, 560, 60, 'f-si') + R(990, BASE + 4, 560, 12, 'f-pas') + R(OX - OW / 2 - 20, BASE + 4, OW + 40, 12, 'f-al');
    calc += R(990, BASE, 560, 4, 'f-seed2', tip('시드층 — 여기서부터 도금이 쌓인다'));
    calc += R(1010, PRT, OX - OW / 2 - 1010, BASE - PRT, 'f-pr', tip(`PR(포토레지스트, 감광막) 틀 — 범프 자리만 구멍을 뚫어 둔 틀. 높이 예시 ${PR_UM} µm`)) + R(OX + OW / 2, PRT, 1530 - OX - OW / 2, BASE - PRT, 'f-pr');
    // 범프 (높이는 위젯이 정한다)
    calc += `<g data-v="bump">${R(OX - OW / 2, BASE - 100, OW, 100, 'f-cu2', W({'data-v': 'col'}, tip('도금된 금속 — 위로 자란다')))}<path data-v="cap" class="f-cu2" d=""/></g>`;
    // 금속 이온이 구멍으로, 거품이 위로 (범프 윗면을 따라 움직인다)
    calc += `<g data-v="ions"></g>`;
    let bub = '';
    for (let k = 0; k < 9; k++) bub += `<g data-v="b${k}">${K.bubble(OX - 100 + k * 25, -6, 6 + (k % 3) * 2, 360, 2.4 + (k % 4) * 0.3, k * 0.29)}</g>`;
    calc += `<g data-v="bubs" transform="translate(0 ${BASE - 100})">${bub}</g>`;
    // 눈금 (µm)
    let sc = L(992, PRT - 60, 992, BASE, 's-edge');
    for (let u = 0; u <= PR_UM + 5; u += 10) sc += L(986, BASE - u * PX, 998, BASE - u * PX, 's-edge') + T(980, BASE - u * PX + 7, String(u), 't-dim', 'end');
    calc += LB(sc + T(980, PRT - 70, 'µm', 't-dim', 'end'));
    calc += LB(T(1006, PRT - 18, `PR ${PR_UM} µm (예시)`, 't-dim', 'start') + T(OX - OW / 2 - 70, PRT + 50, 'PR', 't-lbl') + T(OX + OW / 2 + 70, PRT + 50, 'PR', 't-lbl'));
    calc += T(OX, BASE + 112, '', 'pl-warn', 'middle', {'data-v': 'warn'});
    calc += G(LB(T(OX, 208, '거품 = 수소 · 효율을 낮추면 늘어난다 (산성 Cu는 거의 없다)', 't-dim')), only('eff'));
    s += G(calc, on('q', 'recipe'));

    /* ---- 레시피 단계: 웨이퍼 윗면 · 공식 · 좁은 컵 · 여러 단계 ---- */
    let rc = '';
    // ① 웨이퍼 윗면 — 열린 곳(구멍)만 도금된다. 구멍 크기는 개구율에 맞춰 위젯이 바꾼다
    rc += R(40, 130, 520, 640, 'pl-panel', {rx: 16}) + T(64, 172, '웨이퍼를 위에서 보면', 't-acc', 'start') + T(64, 202, '보라 = PR로 덮인 곳 · 주황 점 = 열린 곳', 't-dim', 'start');
    rc += `<clipPath id="pl2-wf"><circle cx="${WX}" cy="${WY}" r="${WR}"/></clipPath>`;
    let holes = '';
    for (let y = WY - WR + WS / 2; y < WY + WR; y += WS) for (let x = WX - WR + WS / 2; x < WX + WR; x += WS){
      if (Math.hypot(x - WX, y - WY) > WR - 8) continue;
      holes += C(x, y, 6, 'f-seed2');
    }
    let grid = '';
    for (let k = -3; k <= 3; k++) grid += L(WX + k * 64, WY - WR, WX + k * 64, WY + WR, 'p02-grid') + L(WX - WR, WY + k * 64, WX + WR, WY + k * 64, 'p02-grid');
    rc += G(C(WX, WY, WR, 'f-pr') + `<g data-v="holes">${holes}</g>` + grid, W({'clip-path': 'url(#pl2-wf)'}, tip('웨이퍼 윗면 — 다이(네모)마다 범프 자리만 PR이 열려 있다. 점 크기는 개구율(예시)에 맞춘 그림')));
    rc += C(WX, WY, WR, 's-edge');
    rc += T(WX, WY + WR + 40, '', 't-sub', 'middle', {'data-v': 'wlbl'});
    rc += T(WX, WY + WR + 70, '정류기 전류는 이 열린 면적에만 나뉘어 흐른다', 't-dim');
    // ② 공식 (위젯 값으로 숫자가 바뀐다)
    rc += R(590, 130, 970, 410, 'pl-panel', {rx: 16}) + T(616, 176, '레시피 전류 = 목표 전류밀도 × 열린 면적', 't-acc', 'start');
    rc += T(616, 232, 'I = J × A(열린)', 'p02-eq', 'start');
    rc += T(616, 290, '', 'pl-val', 'start', {'data-v': 'r-a'}) + T(616, 334, '', 'pl-val', 'start', {'data-v': 'r-i'});
    rc += T(616, 386, '', 't-warn', 'start', {'data-v': 'r-x'});
    rc += T(616, 432, '', 't-sub', 'start', {'data-v': 'r-ah'});
    rc += T(616, 470, '', 't-dim', 'start', {'data-v': 'r-g'});
    rc += T(616, 512, '개구율 · 전류밀도 · 시간은 카드의 직접 해 보기 값 (예시)', 't-dim', 'start');
    // ③ 좁은 컵 — 같은 물이라도 바닥이 좁으면 더 높이 찬다
    rc += R(40, 800, 760, 312, 'pl-panel', {rx: 16}) + T(64, 840, '같은 물(전기량)이라도 좁은 컵은 더 높이 찬다', 't-acc', 'start');
    const cup = (x, w, lvl, nm, sub) => {
      let g = R(x, 1066 - lvl, w, lvl, 'p02-water') + P(`M${x - 4},930 L${x - 4},1070 L${x + w + 4},1070 L${x + w + 4},930`, 'p02-cup');
      g += L(x + w / 2, 900, x + w / 2, 1066 - lvl, 'p02-pour');
      g += T(x + w / 2, 890, nm, 't-sub') + T(x + w + 16, 1072 - lvl, sub, 't-warn', 'start');
      return g;
    };
    rc += cup(90, 240, 60, '열린 면적 넓음', '높이 1');
    rc += cup(430, 120, 120, '열린 면적 절반', '높이 2배');
    // 튄 물 = 곁반응 (높이에 보태지지 않음)
    for (let k = 0; k < 4; k++) rc += C(566 + k * 16, 914 - k * 10 + (k % 2) * 8, 4 + (k % 2), 'p02-drop');
    rc += T(640, 880, '튄 물 = 곁반응(수소)', 't-dim', 'start') + T(640, 906, '→ 높이에 안 보탬', 't-dim', 'start');
    rc += T(420, 1098, '컵 바닥 = PR이 열린 면적 · 물 = 전기량', 't-dim');
    // ④ 레시피는 보통 여러 단계 (예시 · Cu)
    rc += R(830, 570, 730, 542, 'pl-panel', {rx: 16}) + T(856, 612, '레시피는 보통 여러 단계 (예시 · Cu)', 't-acc', 'start');
    const AX0 = 900, AX1 = 1520, AY0 = 920, AY1 = 660, mx = m => AX0 + m / 14 * (AX1 - AX0), my = j => AY0 - j / 10 * (AY0 - AY1);
    rc += L(AX0, AY0, AX1, AY0, 's-axis') + L(AX0, AY0, AX0, AY1, 's-axis');
    rc += T(AX0 - 10, AY1 + 6, 'ASD', 't-dim', 'end');
    [0, 3, 13].forEach(m => { rc += L(mx(m), AY0, mx(m), AY0 + 8, 's-axis') + T(mx(m), AY0 + 30, m ? m + '분' : '0', 't-dim'); });
    [1, 8].forEach(j => { rc += L(AX0 - 8, my(j), AX0, my(j), 's-axis') + T(AX0 - 14, my(j) + 7, String(j), 't-dim', 'end'); });
    rc += R(mx(0), my(1), mx(3) - mx(0), AY0 - my(1), 'pl-bar', tip('① 낮은 전류로 시작 — 바닥을 고르게 덮는다'));
    rc += R(mx(3), my(8), mx(13) - mx(3), AY0 - my(8), 'pl-bar', tip('② 본 전류 — 빠르게 쌓는다'));
    rc += T(mx(1.5), my(1) - 14, '①', 't-lbl') + T(mx(8), my(8) + 40, '② 본 전류 8 ASD × 10분', 't-sub');
    rc += TT(856, 980, ['① 0.22 µm/분 × 1 ASD × 3분 = 0.66 µm', '② 0.22 µm/분 × 8 ASD × 10분 = 17.6 µm'], 't-sub', 'start', 30);
    rc += T(856, 1046, '합 ≈ 18.3 µm (효율 100 %) — 단계마다 전류 × 시간을 더한다', 't-warn', 'start');
    rc += T(856, 1080, '흔히 처음은 낮은 전류로 고르게 덮고, 다음에 본 전류로 빠르게', 't-dim', 'start');
    s += G(rc, only('recipe'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 두께 계산기</div>
      ${K.seg('m', [['cu', 'Cu'], ['ni', 'Ni'], ['sn', 'SnAg']], 'cu', '금속')}
      ${K.ctl('j', '전류밀도 (ASD)', 0.5, 20, 0.5, 5)}${K.ctl('t', '시간 (분)', 1, 60, 1, 10)}${K.ctl('eff', '전류효율 (%, 금속별 예시 기본값)', 70, 100, 1, 100)}
      ${K.kpis([['두께', 'k-th', '계산 × 효율'], ['속도', 'k-v', 'µm/분'], ['전기량', 'k-q', 'C/cm²'], ['정류기 전류', 'k-i', 'A · 300 mm']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.ctl('f', '개구율 — PR이 열린 면적 비율 (%)', 5, 60, 1, 20)}
      <p class="pl-msg" data-o="amp"></p>
      ${K.model('수치는 순수 금속의 교과서 값이고, 효율 기본값(Cu 100 · Ni 96 · SnAg 95 %)은 예시입니다. 실제 두께는 계측으로 확인하고, 계산과 꾸준히 다르면 효율 · 전류 · 면적 중 무엇이 다른지 찾습니다.')}</div>`;
  },
  mount(K, ctx){
    let m = 'cu';
    const st = {};
    const effIn = ctx.card.querySelector('input[data-i=eff]');
    const upd = () => {
      const M = MET[m], J = st.j || 5, tm = st.t || 10, eff = (st.eff || 100) / 100;
      const q = J / 100 * tm * 60;                         // C/cm²
      const ne = q / F, na = ne / M.n, th = na * M.M / M.rho * 1e4;   // µm (효율 100 %)
      const real = th * eff, v = real / tm;
      const $ = sel => ctx.$(`[data-v="${sel}"]`);
      $('q').textContent = `${J} ASD = ${(J / 100).toFixed(3)} A/cm² × ${tm * 60} s = ${q.toFixed(1)} C/cm²`;
      $('e').textContent = `${q.toFixed(1)} ÷ 96,485 = ${sci(ne)} mol/cm²`;
      $('a-sub').textContent = `${M.ion} 하나에 전자 ${M.n}개 → n = ${M.n}`;
      $('a').textContent = `${sci(ne)} ÷ ${M.n} = ${sci(na)} mol/cm²`;
      $('th-sub').textContent = `M = ${M.M} g/mol, ρ = ${M.rho} g/cm³ (${M.nm})`;
      $('th').textContent = `${sci(na)} × ${M.M} ÷ ${M.rho} = ${th.toFixed(1)} µm`;
      $('real').textContent = `${th.toFixed(1)} µm × ${Math.round(eff * 100)} % = ${real.toFixed(1)} µm`;
      ctx.$('[data-v="ion"]').innerHTML = K.ion(794, 552, m);
      // 범프 그림
      const hpx = Math.min(real, PR_UM) * PX, col = ctx.$('[data-v="col"]'), cap = ctx.$('[data-v="cap"]');
      col.setAttribute('y', BASE - hpx); col.setAttribute('height', hpx); col.setAttribute('class', M.cls);
      cap.setAttribute('class', M.cls);
      const over = Math.max(0, real - PR_UM), c = Math.min(over * PX, 170);
      cap.setAttribute('d', over > 0 ? `M${OX - OW / 2},${PRT} L${OX - OW / 2 - c},${PRT} Q${OX - OW / 2 - c},${PRT - c} ${OX},${PRT - c * 1.05} Q${OX + OW / 2 + c},${PRT - c} ${OX + OW / 2 + c},${PRT} L${OX + OW / 2},${PRT} Z` : '');
      const top = BASE - hpx - (over > 0 ? c : 0);
      let fall = '';
      for (let k = 0; k < 6; k++){ const x0 = OX - 60 + k * 24, x1 = OX - 50 + k * 20, y1 = Math.max(240, top - 24); fall += K.ionPath(`M${x0},200 Q${x0 + (k % 2 ? 46 : -46)},${((200 + y1) / 2).toFixed(0)} ${x1},${y1}`, m, 2.6, k * 0.43, null); }
      ctx.$('[data-v="ions"]').innerHTML = fall;
      ctx.$('[data-v="bubs"]').setAttribute('transform', `translate(0 ${top})`);
      const nb = Math.round(K.clamp((1 - eff) / 0.3) * 9);
      for (let k = 0; k < 9; k++) ctx.$(`[data-v="b${k}"]`).style.display = k < nb ? '' : 'none';
      ctx.$('[data-v="warn"]').textContent = over > 0 ? `⚠ PR 높이를 넘었습니다 → 옆으로 퍼진 버섯 모양 (오버 도금)` : `범프 높이 ${real.toFixed(1)} µm / PR ${PR_UM} µm`;
      const v1 = 1 / 100 * 60 / F / M.n * M.M / M.rho * 1e4;           // 1 ASD, 효율 100 %일 때 µm/분
      ctx.q('[data-o=msg]').innerHTML = `${M.eff}. 1 ASD당 ${v1.toFixed(3)} µm/분 (효율 100 %). 1 Ah마다 ${M.nm === 'SnAg' ? 'Sn' : M.nm} 약 <b>${M.gAh.toFixed(2)} g</b>이 액에서 빠져 쌓입니다.`;
      // 레시피: 전류 = 목표 전류밀도 × 열린 면적
      const f = (st.f || 20) / 100, A = WAF * f, I = J * A, ah = I * tm / 60, grams = ah * M.gAh * eff;
      ctx.out('k-th', `${real.toFixed(1)} µm`); ctx.out('k-v', v.toFixed(3)); ctx.out('k-q', q.toFixed(0)); ctx.out('k-i', I.toFixed(1));
      ctx.q('[data-o=amp]').innerHTML = `300 mm 웨이퍼(약 ${WAF} dm²)에서 개구율 ${Math.round(f * 100)} % → 열린 면적 ${A.toFixed(2)} dm² → 레시피 전류 ≈ <b>${I.toFixed(1)} A</b>. 같은 전류를 개구율 ${Math.round(f * 50)} % 제품에 흘리면 전류밀도가 2배 → <b>2배 빨리</b> 자랍니다.`;
      const rr = WS * Math.sqrt(f / Math.PI);                            // 점 넓이 비율 = 개구율
      ctx.$$('[data-v="holes"] circle').forEach(e => e.setAttribute('r', rr.toFixed(2)));
      $('wlbl').textContent = `300 mm 웨이퍼 ≈ ${WAF} dm² · 개구율 ${Math.round(f * 100)} %`;
      $('r-a').textContent = `A = ${WAF} dm² × ${Math.round(f * 100)} % = ${A.toFixed(2)} dm²`;
      $('r-i').textContent = `I = ${J} ASD × ${A.toFixed(2)} dm² = ${I.toFixed(1)} A`;
      $('r-x').textContent = `같은 ${I.toFixed(1)} A를 개구율 ${Math.round(f * 50)} % 제품에 → ${(J * 2).toFixed(1)} ASD → 2배 빨리`;
      $('r-ah').textContent = `${I.toFixed(1)} A × ${tm}분 = ${ah.toFixed(2)} Ah → ${M.nm === 'SnAg' ? 'Sn' : M.nm} 약 ${grams.toFixed(2)} g이 액에서 빠진다`;
      $('r-g').textContent = `(${M.nm === 'SnAg' ? 'Sn' : M.nm} ${M.gAh.toFixed(2)} g/Ah × 효율 ${Math.round(eff * 100)} % · 웨이퍼 한 장 · 한 단계)`;
    };
    ctx.seg('m', (v, user) => {
      m = v;
      // 금속을 바꾸면 효율 기본값(예시)도 바꾼다
      if (user && effIn){ effIn.value = MET[m].e0; st.eff = MET[m].e0; ctx.out('eff', MET[m].e0 + ' %'); }
      upd();
    });
    ctx.range('j', v => { st.j = v; upd(); return v.toFixed(1); });
    ctx.range('t', v => { st.t = v; upd(); return v + ' 분'; });
    ctx.range('eff', v => { st.eff = v; upd(); return v + ' %'; });
    ctx.range('f', v => { st.f = v; upd(); return v + ' %'; });
    // 개구율을 손으로 움직이면 레시피 단계를 보여 준다
    const fin = ctx.card.querySelector('input[data-i=f]');
    if (fin) fin.addEventListener('input', () => { const sid = ctx.step(); if (sid && sid !== 'recipe') ctx.go('recipe'); });
  },
  notes(K){
    return K.terms([
      ['전기량 (C, 쿨롱)', '전류(A) × 시간(s). 1 A를 1초 흘리면 1 C'],
      ['전류밀도 (ASD)', '면적당 전류. A/dm² = 가로세로 10 cm 면적에 흐르는 암페어. 1 ASD = 10 mA/cm² = 100 A/m²'],
      ['패러데이 상수 F', '전자 1몰이 가진 전기량, 약 96,485 C/mol'],
      ['몰질량 M · 밀도 ρ', 'Cu 63.55 g/mol · 8.96 g/cm³, Ni 58.69 · 8.91, Sn 118.71 · 7.29'],
      ['전류효율', '흘린 전기 중 목표 금속을 쌓는 데 쓰인 비율'],
      ['PR (포토레지스트)', '범프 자리만 구멍을 뚫어 둔 감광막 틀'],
      ['개구율', '웨이퍼 면적 가운데 PR이 열려 도금되는 면적의 비율']
    ]) + K.field([
      '<b>레시피 전류 = 목표 전류밀도 × 열린 면적</b>입니다. 실측 두께가 계산보다 작으면, 효율을 의심하기 전에 <b>면적 정보(마스크 · 개구율)</b>부터 확인합니다.',
      '<b>µm/Ah 추세</b> — 실측 두께 ÷ 패러데이 예측(또는 Ah당 µm)을 추세로 봅니다. 이 값이 움직이면 효율 변화(Sn⁴⁺ 증가, Ni pH 변화), 열린 면적 입력 오류, 계측 이상 중 하나입니다. 한 번만 다르면 계측부터 다시 봅니다.',
      '레시피는 보통 <b>여러 단계 전류</b>로 짭니다. 흔히 처음은 낮은 전류로 고르게 덮고, 다음에 본 전류로 빠르게 쌓습니다. 단계마다 전류 × 시간을 더하면 전체 두께입니다.',
      '단위 실수가 가장 흔합니다. "1분에 22 µm" 같은 값이 나오면 ASD와 A/cm²를 섞었는지 먼저 봅니다 (<a href="#go-edu-1">01 엔지니어의 마인드</a> 원칙 2).'
    ]) + K.deep(`<p>한 줄 공식: <b>두께 = J · t · M · 효율 / (n · F · ρ)</b>, 속도 v = J·M/(n·F·ρ).</p>
      ${K.eq('Cu: 100 × 63.55 ÷ (2 × 96485 × 8.96×10⁶)')}${K.eq('  ≈ 3.7×10⁻⁹ m/s ≈ 0.22 µm/분 (1 ASD)')}
      <ul><li>같은 ASD라도 속도는 같지 않습니다. 1 ASD에서 Cu ≈ 0.22, Ni ≈ 0.20, SnAg ≈ 0.51 µm/분(효율 100 %). Sn은 원자 하나가 차지하는 부피가 크고 전자는 똑같이 2개라서, SnAg는 Cu보다 약 2.3배 빨리 자랍니다.</li>
      <li><b>합금(SnAg)</b>은 금속마다 몫(부분 전류)을 나눠 계산합니다: i = i(Sn) + i(Ag). Ag 2.5 wt%는 전기의 약 1.4 %만 씁니다. 그래서 Ag 함량은 전기량보다 Ag 공급(확산)에 좌우됩니다 (→ <a data-go="chem.comp">10장</a>).</li>
      <li><b>전기량당 금속 소모량</b> — Cu 1.19 · Ni 1.10 · Sn 2.21 · Ag 4.03 g/Ah (= M ÷ (n × 26.8 Ah/mol)). 가용성 양극이면 양극이 이만큼 닳고, 불용성 양극이면 이만큼을 약품으로 보충합니다 (→ <a data-go="bath.metal">11장</a>).</li>
      <li>효율을 깎는 것은 수소만이 아닙니다. 액에 녹은 산소의 환원, Sn⁴⁺ → Sn²⁺처럼 한 단계만 일어나는 반응도 전기를 조금 씁니다.</li>
      <li>개구율이 작을수록 같은 전류에서 국부 전류밀도가 올라갑니다. 그러면 한계전류(→ <a data-go="surface.limit">03장</a>)에 가까워져 거칠어짐 · 조성 변화 · 탄 도금 위험도 커집니다. 제품이 바뀔 때 전류를 면적 비례로만 바꾸면 안 되는 이유입니다.</li>
      <li>효율 100 % 계산값은 <b>상한</b>입니다. 실측이 그보다 크면 계측 · 면적 · 전류 중 무언가가 틀렸습니다.</li>
      <li>다른 계산기: <a href="#go-edu-3">03 공학의 기초 7절</a>의 도금 두께 계산기.</li></ul>`);
  },
  css: `.pl-svg .p02-eq{font-family:var(--mono) !important;font-size:32px;font-weight:900;fill:#7dd3fc !important}
.p02-grid{stroke:rgba(15,23,42,.55);stroke-width:2}
.p02-water{fill:rgba(56,189,248,.45);stroke:#7dd3fc;stroke-width:1}
.p02-cup{fill:none;stroke:#cbd5e1;stroke-width:4;stroke-linejoin:round}
.p02-pour{stroke:#7dd3fc;stroke-width:5;stroke-dasharray:10 8;animation:jzflow .9s linear infinite;opacity:.8}
.p02-drop{fill:#7dd3fc;opacity:.85}`
});
})();
