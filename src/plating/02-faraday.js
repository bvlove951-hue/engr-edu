/* 전해도금 02 — 패러데이 법칙: 전기량이 곧 두께 (범프 하나 · µm) */
(function(){
const F = 96485;
// 금속별 상수: 몰질량 M(g/mol), 이온 전하수 n, 밀도 ρ(g/cm³)
const MET = {
  cu: {nm: 'Cu', ion: 'Cu²⁺', M: 63.55, n: 2, rho: 8.96, cls: 'f-cu2', eff: '산성 Cu: 거의 100 %'},
  ni: {nm: 'Ni', ion: 'Ni²⁺', M: 58.69, n: 2, rho: 8.91, cls: 'f-ni', eff: 'Ni: 수소가 함께 나와 보통 95 % 안팎'},
  sn: {nm: 'SnAg', ion: 'Sn²⁺', M: 118.71, n: 2, rho: 7.29, cls: 'f-sn2', eff: 'SnAg: Sn 기준으로 계산 (Ag는 몇 % 뿐)'}
};
const PR_UM = 60, PX = 10;                 // PR 높이(예시) 60 µm, 1 µm = 10 px
const OX = 1270, OW = 250, BASE = 1000, PRT = BASE - PR_UM * PX;
const sci = v => { if (!isFinite(v) || v === 0) return '0'; const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e); return `${m.toFixed(2)}×10${String(e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '02', id: 'faraday', part: 1, short: '패러데이 법칙', scale: '범프 하나 · µm',
  title: '패러데이 법칙 — 전기량이 곧 두께',
  hook: '흘린 전기만큼 쌓인다',
  one: '흘린 전기량(전류 × 시간)만큼 금속이 쌓입니다. 그래서 두께는 계산으로 미리 알 수 있고, 계산과 실측이 다르면 무언가 새고 있다는 뜻입니다.',
  ana: '<b>수도꼭지와 양동이</b> — 틀어 둔 세기(전류)와 시간을 곱하면 받은 물(전기량)이 나옵니다. 도금에서는 받은 전기량이 곧 쌓인 금속의 양입니다. 물이 조금 새면(수소 거품) 양동이는 덜 찹니다.',
  steps: [
    {id: 'q', t: '전류 × 시간 = 전기량', d: '흘린 전기의 총량(쿨롱, C)이 쌓이는 양을 정합니다. 범프에서는 면적당 전류인 <b>전류밀도</b>로 말합니다. ASD = A/dm², 1 ASD = 10 mA/cm².'},
    {id: 'n', t: '전자 n개마다 원자 하나', d: 'Cu²⁺ · Ni²⁺ · Sn²⁺는 전자 2개, Ag⁺는 1개를 받아 원자 하나가 됩니다. 전기량 ÷ 패러데이 상수(96,485 C/mol) ÷ n = 쌓인 원자의 몰수.'},
    {id: 't', t: '원자 수 → 두께', d: '몰수 × 몰질량 ÷ 밀도 = 부피, 부피 ÷ 면적 = 두께. 한 줄로 쓰면 속도 v = J·M / (n·F·ρ). Cu는 1 ASD에서 1분에 약 0.22 µm 자랍니다.'},
    {id: 'eff', t: '전류효율 — 새는 전기', d: '전기의 일부는 수소 거품처럼 다른 반응에 쓰입니다. 산성 Cu는 거의 100 %, Ni는 조금 낮습니다. 계산값 × 효율 = 실제 두께.'}
  ],
  icon(K){
    const {R, P} = K;
    return R(4, 4, 18, 56, 'f-pr') + R(46, 4, 18, 56, 'f-pr') + R(22, 26, 24, 34, 'f-cu2') + P('M30,20 L34,6 L38,20 M34,6 L34,24', 's-arr2');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, ionPath, lead, ion} = K;
    let s = '';
    // 왼쪽: 계산 기계 (다섯 줄)
    const rows = [
      {st: 'q', y: 150, h: 'Q = J × t', t: '① 전기량', sub: '전류밀도 × 시간 (1 cm²당)', v: 'q'},
      {st: 'n', y: 330, h: '÷ F', t: '② 전자의 몰수', sub: 'F = 96,485 C/mol (전자 1몰의 전기량)', v: 'e'},
      {st: 'n', y: 510, h: '÷ n', t: '③ 원자의 몰수', sub: '', v: 'a'},
      {st: 't', y: 690, h: '× M ÷ ρ', t: '④ 두께', sub: '', v: 'th'},
      {st: 'eff', y: 870, h: '× 효율', t: '⑤ 실제 두께', sub: '나머지 전기는 수소 거품 등으로 샌다', v: 'real'}
    ];
    rows.forEach((r, k) => {
      let g = R(40, r.y, 880, 150, 'pl-box', {rx: 14});
      g += R(40, r.y, 880, 150, 'pl-hlbox', W({rx: 14}, only(r.st)));
      g += R(62, r.y + 26, 168, 98, 'pl-op', {rx: 12}) + T(146, r.y + 88, r.h, 'pl-opt');
      g += T(256, r.y + 48, r.t, 't-lbl', 'start') + T(256, r.y + 80, r.sub, 't-dim', 'start', {'data-v': r.v + '-sub'});
      g += T(256, r.y + 124, '', 'pl-val', 'start', {'data-v': r.v});
      if (k < rows.length - 1) g += K.arrow(146, r.y + 150, 146, r.y + 180, 's-arr');
      s += G(g, tip(r.t + ' — ' + r.h));
    });
    // ③ 옆: 전자 2개 + 이온 → 원자
    s += G(ion(700, 552, 'e') + ion(726, 552, 'e') + T(756, 559, '+', 't-lbl') + `<g data-v="ion">${ion(794, 552, 'cu')}</g>` + T(830, 559, '→', 't-lbl') + C(868, 552, 15, 'f-atom'), on('n'));
    // 오른쪽: PR 구멍 속에서 자라는 범프 (단면)
    s += R(960, 130, 620, 960, 'pl-panel', {rx: 16}) + T(984, 172, '범프 하나 (단면) — 계산한 두께만큼 자란다', 't-acc', 'start');
    s += R(990, BASE + 16, 560, 60, 'f-si') + R(990, BASE + 4, 560, 12, 'f-pas') + R(OX - OW / 2 - 20, BASE + 4, OW + 40, 12, 'f-al');
    s += R(990, BASE, 560, 4, 'f-seed2', tip('시드층 — 여기서부터 도금이 쌓인다'));
    s += R(1010, PRT, OX - OW / 2 - 1010, BASE - PRT, 'f-pr', tip(`PR(감광막) 틀 — 높이 예시 ${PR_UM} µm`)) + R(OX + OW / 2, PRT, 1530 - OX - OW / 2, BASE - PRT, 'f-pr');
    // 범프 (높이는 위젯이 정한다)
    s += `<g data-v="bump">${R(OX - OW / 2, BASE - 100, OW, 100, 'f-cu2', W({'data-v': 'col'}, tip('도금된 금속 — 위로 자란다')))}<path data-v="cap" class="f-cu2" d=""/></g>`;
    // 금속 이온이 구멍으로, 거품이 위로 (범프 윗면을 따라 움직인다)
    s += `<g data-v="ions"></g>`;
    let bub = '';
    for (let k = 0; k < 9; k++) bub += `<g data-v="b${k}">${K.bubble(OX - 100 + k * 25, -6, 6 + (k % 3) * 2, 360, 2.4 + (k % 4) * 0.3, k * 0.29)}</g>`;
    s += `<g data-v="bubs" transform="translate(0 ${BASE - 100})">${bub}</g>`;
    // 눈금 (µm)
    let sc = L(992, PRT - 60, 992, BASE, 's-edge');
    for (let u = 0; u <= PR_UM + 5; u += 10) sc += L(986, BASE - u * PX, 998, BASE - u * PX, 's-edge') + T(980, BASE - u * PX + 7, String(u), 't-dim', 'end');
    s += LB(sc + T(980, PRT - 70, 'µm', 't-dim', 'end'));
    s += LB(T(1006, PRT - 18, `PR ${PR_UM} µm (예시)`, 't-dim', 'start') + T(OX - OW / 2 - 70, PRT + 50, 'PR', 't-lbl') + T(OX + OW / 2 + 70, PRT + 50, 'PR', 't-lbl'));
    s += T(OX, BASE + 112, '', 'pl-warn', 'middle', {'data-v': 'warn'});
    s += G(LB(T(OX, 260, '거품 = 수소 (효율이 낮을수록 많다)', 't-dim')), only('eff'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 두께 계산기</div>
      ${K.seg('m', [['cu', 'Cu'], ['ni', 'Ni'], ['sn', 'SnAg']], 'cu', '금속')}
      ${K.ctl('j', '전류밀도 (ASD)', 0.5, 20, 0.5, 5)}${K.ctl('t', '시간 (분)', 1, 60, 1, 10)}${K.ctl('eff', '전류효율 (%)', 70, 100, 1, 100)}
      ${K.kpis([['두께', 'k-th', '계산 × 효율'], ['속도', 'k-v', 'µm/분'], ['전기량', 'k-q', 'C/cm²']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.ctl('f', '개구율 — PR이 열린 면적 비율 (%)', 5, 60, 1, 20)}
      <p class="pl-msg" data-o="amp"></p>
      ${K.model('수치는 순수 금속의 교과서 값입니다. 실제 두께는 계측으로 확인하고, 계산과 꾸준히 다르면 효율 · 전류 · 면적 중 무엇이 다른지 찾습니다.')}</div>`;
  },
  mount(K, ctx){
    let m = 'cu';
    const st = {};
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
      for (let k = 0; k < 6; k++) fall += K.ionPath(`M${OX - 60 + k * 24},200 L${OX - 50 + k * 20},${Math.max(240, top - 24)}`, m, 2.6, k * 0.43, null);
      ctx.$('[data-v="ions"]').innerHTML = fall;
      ctx.$('[data-v="bubs"]').setAttribute('transform', `translate(0 ${top})`);
      const nb = Math.round(K.clamp((1 - eff) / 0.3) * 9);
      for (let k = 0; k < 9; k++) ctx.$(`[data-v="b${k}"]`).style.display = k < nb ? '' : 'none';
      ctx.$('[data-v="warn"]').textContent = over > 0 ? `⚠ PR 높이를 넘었습니다 → 옆으로 퍼진 버섯 모양 (오버 도금)` : `범프 높이 ${real.toFixed(1)} µm / PR ${PR_UM} µm`;
      ctx.out('k-th', `${real.toFixed(1)} µm`); ctx.out('k-v', v.toFixed(3)); ctx.out('k-q', q.toFixed(0));
      ctx.q('[data-o=msg]').innerHTML = `${MET[m].eff}. 1 ASD당 ${(1 / 100 * 60 / F / M.n * M.M / M.rho * 1e4).toFixed(3)} µm/분 (효율 100 %).`;
      const f = (st.f || 20) / 100, I = J * 7.07 * f;
      ctx.q('[data-o=amp]').innerHTML = `300 mm 웨이퍼(약 7.07 dm²)에서 개구율 ${Math.round(f * 100)} % → 정류기 전류 ≈ <b>${I.toFixed(1)} A</b>. 같은 전류를 개구율 ${Math.round(f * 50)} % 제품에 흘리면 전류밀도가 2배 → <b>2배 빨리</b> 자랍니다.`;
    };
    ctx.seg('m', v => { m = v; upd(); });
    ctx.range('j', v => { st.j = v; upd(); return v.toFixed(1); });
    ctx.range('t', v => { st.t = v; upd(); return v + ' 분'; });
    ctx.range('eff', v => { st.eff = v; upd(); return v + ' %'; });
    ctx.range('f', v => { st.f = v; upd(); return v + ' %'; });
  },
  notes(K){
    return K.terms([
      ['전기량 (C, 쿨롱)', '전류(A) × 시간(s). 1 A를 1초 흘리면 1 C'],
      ['전류밀도 (ASD)', '면적당 전류. A/dm², 1 ASD = 10 mA/cm² = 100 A/m²'],
      ['패러데이 상수 F', '전자 1몰이 가진 전기량, 약 96,485 C/mol'],
      ['몰질량 M · 밀도 ρ', 'Cu 63.55 g/mol · 8.96 g/cm³, Ni 58.69 · 8.91, Sn 118.71 · 7.29'],
      ['전류효율', '흘린 전기 중 목표 금속을 쌓는 데 쓰인 비율']
    ]) + K.field([
      '<b>범프는 열린 곳에만 쌓입니다.</b> 전류밀도 = 정류기 전류 ÷ (웨이퍼 면적 × 개구율). 제품마다 개구율이 달라 레시피 전류가 다른 이유입니다.',
      '계산 두께와 실측이 <b>꾸준히</b> 다르면 효율(수소 · 부반응), 실제 전류(정류기 · 접점), 실제 면적(PR 구멍 크기)을 차례로 의심합니다. 한 번만 다르면 계측부터 다시.',
      '단위 실수가 가장 흔합니다. "1분에 22 µm" 같은 값이 나오면 ASD와 A/cm²를 섞었는지 먼저 봅니다 (<a href="#go-edu-1">01 엔지니어의 마인드</a> 원칙 2).'
    ]) + K.deep(`<p>한 줄 공식: <b>두께 = J · t · M · 효율 / (n · F · ρ)</b>, 속도 v = J·M/(n·F·ρ).</p>
      ${K.eq('Cu, 1 ASD = 100 A/m²: v = 100 × 63.55 / (2 × 96485 × 8.96×10⁶) ≈ 3.7×10⁻⁹ m/s ≈ 0.22 µm/분')}
      <ul><li>같은 전기량이면 Sn은 Cu보다 약 2.3배 두껍게 쌓입니다 (원자가 무겁고 덜 빽빽하므로 M/ρ가 큼).</li>
      <li><b>합금(SnAg)</b>은 금속마다 몫(부분 전류)을 나눠 계산합니다: i = i(Sn) + i(Ag). Ag는 전자 1개로 원자 하나지만 전체 전류에서 차지하는 몫이 작습니다 (10장).</li>
      <li>효율 100 % 계산값은 <b>상한</b>입니다. 실측이 그보다 크면 계측 · 면적 · 전류 중 무언가가 틀렸습니다.</li>
      <li>다른 계산기: <a href="#go-edu-3">03 공학의 기초 7절</a>의 도금 두께 계산기.</li></ul>`);
  }
});
})();
