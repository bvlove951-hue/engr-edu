/* 전해도금 06 — 막의 속: 결정, 불순물, 응력 (결정 · nm~µm) */
(function(){
const TV = {x: 70, y: 200, w: 660, h: 450};            // 위에서 본 표면
const CS = {x: 830, y: 300, w: 700, h: 260};            // 단면
const cuFill = (r, k) => `fill:hsl(${22 + (k % 5) * 3},${48 + Math.round(r() * 14)}%,${40 + Math.round(r() * 22)}%)`;

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '06', id: 'grain', part: 2, short: '막의 속', scale: '결정 · nm~µm',
  title: '막의 속 — 결정, 불순물, 응력',
  hook: '같은 두께, 다른 속',
  one: '도금막은 아주 작은 결정들이 모인 모자이크입니다. 결정이 얼마나 곱고, 무엇이 섞여 있고, 얼마나 당기고 있는지에 따라 같은 두께라도 성질이 달라집니다.',
  ana: '<b>얼음이 어는 모습</b> — 차가운 유리창에 여기저기 얼음 씨앗이 생겨 자라다가 서로 만나면 한 장의 얼음이 됩니다. 씨앗이 많으면 무늬가 잘고, 적으면 큼직합니다. 도금도 표면 여기저기 생긴 씨앗(핵)이 자라 만나서 막이 됩니다.',
  steps: [
    {id: 'nuc', t: '핵생성과 성장', d: '처음에는 표면 여기저기에 원자 몇 개짜리 씨앗(핵)이 생기고, 자라서 서로 만나 막이 됩니다. 세게 밀면(과전압↑) 씨앗이 많아 결정이 곱고, 약하게 밀면 적어서 굵습니다.'},
    {id: 'grain', t: '결정립 — 막 속의 모자이크', d: '결정은 기둥 모양(주상)으로 자라기도 하고 작은 알갱이로 자라기도 합니다. 결정 크기에 따라 굳기 · 전기 저항 · 식각 속도 · 솔더와의 반응이 달라집니다.'},
    {id: 'imp', t: '불순물 — 막에 갇힌 것들', d: '첨가제 조각(C · S · Cl 등)이 결정 사이에 갇힐 수 있습니다. 많으면 리플로우 · 고온에서 기체가 나오거나, Cu와 솔더 사이 계면에 작은 빈틈(커켄달 보이드)이 늘어난다는 보고가 있습니다.'},
    {id: 'stress', t: '응력과 자기 풀림', d: '막에는 당기거나 미는 힘(내부 응력)이 남아 웨이퍼를 휘게 하거나 막을 갈라지게 합니다(Ni에서 특히 관리). Cu는 도금 뒤 상온에서도 결정이 서서히 커집니다(자기 풀림, 수 시간~수 일).'}
  ],
  icon(K){
    const pts = [[10, 12], [40, 8], [58, 30], [22, 40], [48, 54], [8, 56], [32, 26]];
    return K.voronoi(pts, 2, 2, 64, 62).map((p, k) => K.PG(p, 'f-grain', {style: `fill:hsl(${22 + k * 3},55%,${42 + (k % 3) * 8}%)`})).join('');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT, voronoi, rng} = K;
    let s = '';
    s += R(40, 130, 720, 570, 'pl-panel', {rx: 16}) + T(64, 172, '위에서 본 표면 — 씨앗이 자라 만난다', 't-acc', 'start');
    s += R(40, 130, 720, 570, 'pl-hlbox', W({rx: 16}, only('nuc')));
    s += `<clipPath id="pl5-tv"><rect x="${TV.x}" y="${TV.y}" width="${TV.w}" height="${TV.h}" rx="8"/></clipPath>`;
    s += R(TV.x, TV.y, TV.w, TV.h, 'f-seed2', {rx: 8}) + `<g data-v="tv" clip-path="url(#pl5-tv)"></g>` + R(TV.x, TV.y, TV.w, TV.h, 's-edge', {rx: 8, style: 'fill:none'});
    s += R(800, 130, 760, 570, 'pl-panel', {rx: 16}) + T(824, 172, '단면 — 막 속의 결정', 't-acc', 'start');
    s += R(800, 130, 760, 570, 'pl-hlbox', W({rx: 16}, only('grain imp')));
    s += R(CS.x, 200, CS.w, CS.y - 200, 'f-bath') + R(CS.x, CS.y + CS.h, CS.w, 12, 'f-seed2') + R(CS.x, CS.y + CS.h + 12, CS.w, 60, 'f-si');
    s += `<clipPath id="pl5-cs"><rect x="${CS.x}" y="${CS.y}" width="${CS.w}" height="${CS.h}"/></clipPath><g data-v="cs" clip-path="url(#pl5-cs)"></g>`;
    s += LB(T(CS.x + CS.w - 10, 236, '도금액', 't-dim', 'end') + T(CS.x + CS.w - 10, CS.y + CS.h + 52, '시드 · 바닥', 't-dim', 'end'));
    s += `<g data-v="imp"></g>`;
    s += LB(T(CS.x, 660, '', 't-sub', 'start', {'data-v': 'cslbl'}));
    // 아래 패널 — 단계마다
    s += R(40, 740, 1520, 380, 'pl-panel', {rx: 16});
    // nuc: 약하게 / 세게
    let nu = T(64, 784, '미는 힘에 따라 — 씨앗의 수가 결정 크기를 정한다', 't-acc', 'start');
    const mini = (x, n, seed) => { const r = rng(seed), pts = []; for (let k = 0; k < n; k++) pts.push([x + 10 + r() * 280, 830 + r() * 220]); return voronoi(pts, x, 820, x + 300, 1060).map((p, k) => K.PG(p, 'f-grain', {style: cuFill(r, k)})).join(''); };
    nu += mini(90, 9, 3) + mini(560, 46, 4);
    nu += TT(400, 880, ['약하게 밀면', '씨앗이 적다', '→ 결정이 굵다'], 't-sub', 'start', 32) + TT(870, 880, ['세게 밀면 · 첨가제', '씨앗이 많다', '→ 결정이 곱다'], 't-sub', 'start', 32);
    nu += TT(1110, 820, ['결정 크기는 다음 성질을 바꾼다', '· 굳기 (작을수록 단단)', '· 전기 저항 (경계가 많으면 ↑)', '· 식각 · 반응 속도', '· 솔더와 IMC가 자라는 모양'], 't-sub', 'start', 34);
    s += G(nu, only('nuc grain'));
    // imp: 커켄달 보이드
    let im = T(64, 784, '열을 받으면 — Cu와 솔더 사이 계면 (개념도)', 't-acc', 'start');
    const IY = 830, IH = 200, cols = [['Cu (도금)', 'f-cu2', 90, 300], ['Cu₃Sn', 'pl-imc3', 390, 120], ['Cu₆Sn₅', 'f-imc', 510, 160], ['솔더 (Sn)', 'f-sn2', 670, 300]];
    cols.forEach(([t, c, x, w]) => { im += R(x, IY, w, IH, c, tip(t)) + T(x + w / 2, IY + IH + 34, t, 't-sub'); });
    const ri = rng(21);
    for (let k = 0; k < 26; k++) im += C(100 + ri() * 270, IY + 10 + ri() * (IH - 20), 3.5, 'pl-impd');
    for (let k = 0; k < 9; k++) im += E2(390 + 6 + ri() * 10, IY + 14 + k * 21, 6 + ri() * 4, 5, 'f-hole2');
    im += K.lead(398, IY + 60, 1000, 850, '커켄달 보이드 — 원자가 한쪽으로 더 빨리 빠져나간 빈자리', 'start', 't-sub');
    im += K.lead(200, IY + 120, 1000, 930, '도금막 속 불순물 (S · Cl · C 등)', 'start', 't-sub');
    im += TT(1000, 990, ['불순물이 많을수록 이런 빈틈이 늘어난다는', '연구가 있다 → 첨가제 관리 · 분해산물 관리'], 't-dim', 'start', 30);
    s += G(im, only('imp'));
    // stress: 휨과 자기 풀림
    let ss = T(64, 784, '내부 응력 — 막이 웨이퍼를 당기거나 민다', 't-acc', 'start');
    ss += P('M90,960 Q290,880 490,960', 'pl-waf') + P('M90,950 Q290,870 490,950', 'pl-film') + K.arrow(150, 925, 230, 900, 's-arrr') + K.arrow(430, 925, 350, 900, 's-arrr');
    ss += TT(90, 1010, ['인장 — 막이 줄어들려 한다', '→ 막 쪽이 오목 · 심하면 갈라짐'], 't-sub', 'start', 30);
    ss += P('M570,900 Q770,980 970,900', 'pl-waf') + P('M570,890 Q770,970 970,890', 'pl-film') + K.arrow(730, 930, 640, 905, 's-arr2') + K.arrow(810, 930, 900, 905, 's-arr2');
    ss += TT(570, 1010, ['압축 — 막이 늘어나려 한다', '→ 막 쪽이 볼록 · 심하면 들뜸'], 't-sub', 'start', 30);
    // 자기 풀림 시간선
    const ann = (x, n, seed, t) => { const r = rng(seed), pts = []; for (let k = 0; k < n; k++) pts.push([x + 4 + r() * 152, 840 + r() * 112]); return voronoi(pts, x, 836, x + 160, 956, 0.6).map((p, k) => K.PG(p, 'f-grain', {style: cuFill(r, k)})).join('') + T(x + 80, 990, t, 't-sub'); };
    ss += T(1060, 822, 'Cu 자기 풀림 (상온)', 't-warn', 'start') + ann(1060, 40, 7, '도금 직후') + ann(1240, 14, 8, '수 시간') + ann(1400, 5, 9, '수 일');
    ss += K.arrow(1222, 896, 1238, 896, 's-arr') + K.arrow(1402, 896, 1398, 896, 's-arr');
    ss += TT(1060, 1036, ['결정이 커지며 저항↓ · 굳기 · 응력이 바뀐다', '→ 도금 후 대기 시간도 변수'], 't-dim', 'start', 30);
    s += G(ss, only('stress'));
    function E2(x, y, rx, ry, c){ return K.E(x, y, rx, ry, c); }
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 결정 만들기</div>
      ${K.ctl('e', '미는 힘 (과전압)', 0, 100, 1, 40)}
      ${K.seg('add', [['0', '없음'], ['1', '있음']], '1', '첨가제')}
      ${K.seg('age', [['0', '도금 직후'], ['1', '며칠 뒤 (Cu 자기 풀림)']], '0', '시간')}
      ${K.kpis([['씨앗(결정) 수', 'k-n', '같은 면적에서'], ['평균 크기', 'k-s', '상대값']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('씨앗 수만 바꾼 그림입니다. 실제 결정 크기 · 모양은 금속 · 첨가제 · 전류 파형 · 온도에 따라 다릅니다.')}</div>`;
  },
  mount(K, ctx){
    const {voronoi, rng, PG, C, G} = K;
    const st = {e: 40, add: true, age: false};
    function render(){
      const n = Math.round((8 + st.e / 100 * 46) * (st.add ? 1.5 : 1));
      // 위에서 본 표면: 같은 주기로 자라 만나는 칸
      const r = rng(31), pts = [];
      for (let k = 0; k < n; k++) pts.push([TV.x + r() * TV.w, TV.y + r() * TV.h]);
      const cells = voronoi(pts, TV.x, TV.y, TV.x + TV.w, TV.y + TV.h);
      let tv = '';
      cells.forEach((poly, k) => {
        if (!poly.length) return;
        const [sx, sy] = pts[k], t0 = (r() * 0.35).toFixed(2), t1 = Math.min(0.85, +t0 + 0.4).toFixed(2);
        const rel = poly.map(([x, y]) => [x - sx, y - sy]);
        tv += `<g transform="translate(${sx.toFixed(1)} ${sy.toFixed(1)})"><g><animateTransform attributeName="transform" type="scale" values="0;0;1;1" keyTimes="0;${t0};${t1};1" dur="6s" repeatCount="indefinite"/>${PG(rel, 'f-grain', {style: cuFill(r, k)})}</g></g>`;
      });
      ctx.$('[data-v="tv"]').innerHTML = tv;
      // 단면: 첨가제가 없으면 기둥 모양, 있으면 잘게. 며칠 뒤는 굵게
      const nc = Math.max(4, Math.round(n * 0.8 / (st.age ? 3.2 : 1))), r2 = rng(57), p2 = [];
      for (let k = 0; k < nc; k++) p2.push([CS.x + r2() * CS.w, CS.y + r2() * CS.h]);
      const sy = st.add && !st.age ? 0.8 : 0.32;
      const c2 = voronoi(p2, CS.x, CS.y, CS.x + CS.w, CS.y + CS.h, sy);
      ctx.$('[data-v="cs"]').innerHTML = c2.map((p, k) => PG(p, 'f-grain', {style: cuFill(r2, k)})).join('');
      // 불순물: 결정 경계(꼭짓점)에
      const seen = new Set();
      let im = '';
      c2.forEach(p => p.forEach(([x, y], j) => { const kx = Math.round(x / 6) + ',' + Math.round(y / 6); if (seen.has(kx) || j % 2 || x <= CS.x + 2 || x >= CS.x + CS.w - 2 || y <= CS.y + 2 || y >= CS.y + CS.h - 2) return; seen.add(kx); im += C(x, y, 5, 'pl-impd'); }));
      ctx.$('[data-v="imp"]').innerHTML = G(im + K.lead(CS.x + CS.w - 120, CS.y + 40, CS.x + CS.w - 200, 260, '결정 경계에 갇힌 불순물', 'end', 't-sub'), K.only('imp'));
      ctx.$('[data-v="cslbl"]').textContent = st.age ? '며칠 뒤 — 결정이 커졌다 (자기 풀림)' : st.add ? '첨가제 있음 — 잘고 고른 결정' : '첨가제 없음 — 굵은 기둥 모양 결정';
      const size = 100 / Math.sqrt(n);
      ctx.out('k-n', `${n}개`); ctx.out('k-s', size > 18 ? '굵음' : size > 11 ? '보통' : '고움');
      ctx.q('[data-o=msg]').innerHTML = `씨앗 ${n}개 → 결정 하나의 면적은 1/${n}. ${st.add ? '첨가제가 씨앗을 늘리고 기둥 모양 성장을 막습니다.' : '첨가제가 없으면 적은 씨앗이 굵게, 기둥 모양으로 자라기 쉽습니다.'}`;
      ctx.refresh();
    }
    ctx.range('e', v => { st.e = v; render(); return v < 33 ? '약하게' : v < 67 ? '보통' : '세게'; });
    ctx.seg('add', v => { st.add = v === '1'; render(); });
    ctx.seg('age', (v, user) => { st.age = v === '1'; render(); if (user && st.age) ctx.go('stress'); });
  },
  notes(K){
    return K.terms([
      ['핵생성', '표면에 원자 몇 개짜리 새 결정 씨앗이 생기는 것'],
      ['결정립 · 결정 경계', '한 방향으로 원자가 늘어선 작은 결정 · 그 결정들이 만나는 선'],
      ['주상정 (기둥 결정)', '바닥에서 위로 길게 자란 결정. 첨가제가 적거나 느리게 쌓일 때 흔하다'],
      ['내부 응력', '막이 줄어들거나(인장) 늘어나려(압축) 하는 힘'],
      ['자기 풀림', 'Cu 도금막의 결정이 상온에서도 시간이 지나며 커지는 현상'],
      ['커켄달 보이드', '두 금속이 섞일 때 한쪽 원자가 더 빨리 빠져나가 남는 빈자리']
    ]) + K.field([
      '도금막의 성질(굳기 · 저항 · 응력)은 <b>도금 직후와 며칠 뒤가 다를 수 있습니다</b>. 비교 실험에서는 측정 시점을 맞춥니다.',
      'Ni은 얇아도 응력이 크면 갈라지거나(크랙) 들뜰 수 있습니다. 응력은 전류밀도 · 온도 · pH · 첨가제 · 불순물에 따라 바뀝니다.',
      '첨가제를 늘리면 결정이 곱고 매끈해지지만, <b>막에 갇히는 불순물도 늘 수 있습니다</b>. "많을수록 좋다"가 아닙니다.'
    ]) + K.deep(`<ul>
      <li><b>핵생성 속도</b>는 과전압에 매우 민감합니다(지수보다 더 가파르게). 그래서 과전압을 조금 올려도 씨앗 수가 크게 늘어 결정이 곱게 됩니다. 펄스 도금으로 순간 과전압을 크게 하는 것도 같은 원리입니다.</li>
      <li>결정 성장 방식은 표면의 원자가 계단 모서리를 찾아가는 속도(표면 확산)와 새 원자가 쌓이는 속도의 경쟁입니다. 억제제는 표면을 덮어 이 경쟁을 바꿉니다.</li>
      <li>Cu 막의 <b>자기 풀림</b>은 첨가제가 많이 들어간 막에서 두드러지고, 결정 경계에 갇힌 불순물이 많으면 늦어지거나 덜 일어납니다.</li>
      <li>Cu–Sn 계면은 고온에서 Cu₆Sn₅와 Cu₃Sn이 자랍니다. 도금 Cu의 불순물(특히 S)이 Cu/Cu₃Sn 계면의 커켄달 보이드를 늘린다는 연구가 있어, 범프 신뢰성 문제를 볼 때 도금 조건과 첨가제 이력을 함께 봅니다.</li>
      <li>Ni 위에서는 Ni₃Sn₄ 등이 자랍니다. Ni이 Cu와 솔더 사이에서 반응을 늦추는 방벽 역할을 하는 이유입니다(10장).</li></ul>`);
  }
});
})();
