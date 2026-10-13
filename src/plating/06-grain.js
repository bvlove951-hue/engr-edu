/* 전해도금 06 — 막의 속: 도금막 속은 어떻게 생겼을까? (결정 · 불순물 · 응력, nm~µm) */
(function(){
const TV = {x: 70, y: 200, w: 660, h: 450};            // 위에서 본 표면
const CS = {x: 830, y: 300, w: 700, h: 260};            // 단면 (막은 y 300~560, 위쪽 y 200~300은 액)
const cuFill = (r, k) => `fill:hsl(${22 + (k % 5) * 3},${48 + Math.round(r() * 14)}%,${40 + Math.round(r() * 22)}%)`;
// 전류밀도(한계전류 대비) → 씨앗 수와 표면 상태 (개념 모델)
//  한계보다 충분히 낮으면: 세게 밀수록(과전압↑) 씨앗이 많아 결정이 곱다
//  한계에 가까우면: 공급이 모자라 튀어나온 곳이 앞서 거칠어지고, 더 가까우면 가루 · 나뭇가지
function regime(cd){ return cd > 0.92 ? 'dend' : cd > 0.75 ? 'rough' : 'fine'; }
function seeds(cd, add){ return Math.round((8 + 46 * Math.min(cd, 0.75) / 0.75) * (add ? 1.5 : 1)); }
// 발표 모드 · 손대기 전: 단계마다 보여 줄 [전류밀도 %, 첨가제, 자기 풀림 뒤]
const DEMO = {nuc: {cd: 40, add: true, age: false}, grain: {cd: 40, add: true, age: false}, imp: {cd: 40, add: true, age: false}, stress: {cd: 40, add: true, age: true}};

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '06', id: 'grain', part: 2, short: '막의 속', scale: '결정 · nm~µm',
  title: '막의 속 — 도금막 속은 어떻게 생겼을까?',
  hook: '같은 두께, 다른 속',
  one: '도금막은 아주 작은 결정 조각이 모인 모자이크입니다. 조각의 크기, 섞여 들어간 불순물, 막 속에 남은 힘(응력)이 같은 두께의 막이라도 성질을 다르게 만듭니다.',
  ana: '<b>얼음이 어는 모습</b> — 차가운 유리창에 여기저기 얼음 씨앗이 생겨 자라다가 서로 만나면 한 장의 얼음이 됩니다. 씨앗이 많으면 무늬가 잘고, 적으면 큼직합니다. 도금도 표면 여기저기 생긴 씨앗(핵)이 자라 만나서 막이 됩니다. <i>한계</i>: 같은 금속 위(Cu 시드 위 Cu)에서는 새 씨앗보다 아래 결정을 이어서 자라는 몫이 큽니다 — 얼음 위에 얼음이 이어 얼 듯이.',
  steps: [
    {id: 'nuc', t: '핵생성과 성장', d: '다른 금속 위(Cu 위 Ni, Ni 위 SnAg)에서는 씨앗(핵)이 새로 생겨 자라 만나야 하므로 표면 상태(산화막)가 중요합니다. 같은 금속 위(Cu 위 Cu)는 시드 결정을 이어 자라는 몫이 큽니다. 한계보다 충분히 낮은 범위에서는 세게 밀수록 씨앗이 많아 결정이 곱습니다.'},
    {id: 'grain', t: '결정립 — 막 속의 모자이크', d: '결정은 기둥 모양(주상)으로 자라기도 하고 작은 알갱이로 자라기도 합니다. 첨가제가 있으면 자라는 중에도 새 씨앗이 생겨 결정이 작게 유지됩니다. 결정 크기에 따라 굳기 · 전기 저항 · 식각 속도 · 솔더와의 반응이 달라집니다.'},
    {id: 'imp', t: '불순물 — 막에 갇힌 것들', d: '첨가제 조각(S · Cl · C 등)이 결정 사이에 갇힐 수 있습니다. 갇힌 S(촉진제에서 옴)는, Cu가 솔더와 직접 붙는 곳(Ni 방벽이 없는 곳)을 고온에 오래 두면 계면에 작은 구멍(커켄달 보이드)을 키운다는 보고가 있습니다. 그래서 첨가제는 "많을수록 좋다"가 아닙니다.'},
    {id: 'stress', t: '응력과 자기 풀림', d: '막에 남은 힘(내부 응력)은 웨이퍼 전체에 깔린 막에서는 휨으로, 섬처럼 나뉜 범프에서는 크랙(당김) · 들뜸(밂)으로 나타납니다(Ni에서 특히 관리). Cu는 도금 뒤 상온에서도 결정이 커집니다(자기 풀림, 수 시간~수 주, 저항 약 10~20 %↓).'}
  ],
  icon(K){
    const pts = [[10, 12], [40, 8], [58, 30], [22, 40], [48, 54], [8, 56], [32, 26]];
    return K.voronoi(pts, 2, 2, 64, 62).map((p, k) => K.PG(p, 'f-grain', {style: `fill:hsl(${22 + k * 3},55%,${42 + (k % 3) * 8}%)`})).join('');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT, voronoi, rng, wrap} = K;
    let s = '';
    s += R(40, 130, 720, 570, 'pl-panel', {rx: 16}) + T(64, 172, '위에서 본 표면 — 씨앗이 자라 만난다', 't-acc', 'start');
    s += R(40, 130, 720, 570, 'pl-hlbox', W({rx: 16}, only('nuc')));
    s += `<clipPath id="pl5-tv"><rect x="${TV.x}" y="${TV.y}" width="${TV.w}" height="${TV.h}" rx="8"/></clipPath>`;
    s += R(TV.x, TV.y, TV.w, TV.h, 'f-seed2', {rx: 8}) + `<g data-v="tv" clip-path="url(#pl5-tv)"></g>` + R(TV.x, TV.y, TV.w, TV.h, 's-edge', {rx: 8, style: 'fill:none'});
    s += R(800, 130, 760, 570, 'pl-panel', {rx: 16}) + T(824, 172, '단면 — 막 속의 결정', 't-acc', 'start');
    s += R(800, 130, 760, 570, 'pl-hlbox', W({rx: 16}, only('grain imp')));
    s += R(CS.x, 200, CS.w, CS.h + 100, 'f-bath') + R(CS.x, CS.y + CS.h, CS.w, 12, 'f-seed2') + R(CS.x, CS.y + CS.h + 12, CS.w, 60, 'f-si');
    s += `<clipPath id="pl5-cs"><rect x="${CS.x}" y="200" width="${CS.w}" height="${CS.y + CS.h - 200}"/></clipPath><g data-v="cs" clip-path="url(#pl5-cs)"></g>`;
    s += LB(T(CS.x + CS.w - 10, 236, '도금액', 't-dim', 'end') + T(CS.x + CS.w - 10, CS.y + CS.h + 52, '시드 · 바닥', 't-dim', 'end'));
    s += `<g data-v="imp"></g>`;
    s += LB(T(CS.x, 664, '', 't-sub', 'start', {'data-v': 'cslbl'}));
    // 아래 패널 — 단계마다
    s += R(40, 740, 1520, 380, 'pl-panel', {rx: 16});
    const grains = (x, y, w, h, n, seed, sy = 1) => { const r = rng(seed), pts = []; for (let k = 0; k < n; k++) pts.push([x + 4 + r() * (w - 8), y + 4 + r() * (h - 8)]); return voronoi(pts, x, y, x + w, y + h, sy).map((p, k) => K.PG(p, 'f-grain', {style: cuFill(r, k)})).join(''); };
    // nuc: 약하게 · 세게 · 한계 근처 + 어디 위에 쌓나
    let nu = T(64, 784, '미는 힘에 따라 — 씨앗 수가 결정 크기를 정한다', 't-acc', 'start');
    nu += grains(70, 812, 300, 150, 9, 3) + grains(440, 812, 300, 150, 46, 4);
    // 한계 근처: 거친 윗면 + 나뭇가지 + 가루
    let mc = grains(810, 892, 300, 70, 14, 5);
    const rd = rng(11);
    let dd = '';
    for (let k = 0; k < 6; k++){ const bx = 830 + k * 50 + rd() * 14, h = 40 + rd() * 36; dd += `M${bx},892 L${bx + 3},${892 - h}`; for (let t = 1; t <= 2; t++){ const yy = 892 - h * t / 3; dd += ` M${bx + 1},${yy} l-12,-10 M${bx + 2},${yy - 6} l12,-10`; } }
    mc += P(dd, 'p06-den');
    for (let k = 0; k < 18; k++) mc += C(816 + rd() * 288, 820 + rd() * 64, 2.5 + rd() * 3, 'pl-burnt');
    nu += mc;
    nu += TT(70, 996, ['약하게 밀면 (낮은 전류)', '씨앗이 적다 → 결정이 굵다'], 't-sub', 'start', 30);
    nu += TT(440, 996, ['세게 밀면 · 첨가제', '씨앗이 많다 → 결정이 곱다'], 't-sub', 'start', 30);
    nu += TT(810, 996, ['한계전류에 가까우면', '곱지 않고 거칠다 · 가루 · 나뭇가지'], 't-sub', 'start', 30);
    nu += T(70, 1086, '정전류 장비에서 과전압은 결과값 — 전류밀도 · 첨가제 · 온도 · 농도가 정한다', 't-dim', 'start');
    // 어디 위에 쌓나 — 이어 자라기 vs 새 씨앗
    nu += T(1180, 784, '어디 위에 쌓나', 't-warn', 'start');
    const cols = [[1180, 'hsl(24,58%,46%)'], [1214, 'hsl(28,52%,56%)'], [1252, 'hsl(20,60%,40%)'], [1284, 'hsl(26,50%,60%)']];
    cols.forEach(([x, f], k) => { const w = (k < 3 ? cols[k + 1][0] : 1330) - x; nu += R(x, 856, w, 44, 'f-grain', {style: `fill:${f}`}) + R(x, 812, w, 44, 'f-grain', {style: `fill:${f};opacity:.75`}); });
    nu += R(1370, 856, 150, 44, 'f-cu2');
    for (const [x, rr] of [[1388, 12], [1420, 9], [1452, 13], [1490, 10]]) nu += P(`M${x - rr},856 a${rr},${rr * 0.9} 0 0 1 ${2 * rr},0 Z`, 'f-ni');
    nu += LB(T(1255, 920, 'Cu 위 Cu', 't-dim') + T(1445, 920, 'Cu 위 Ni', 't-dim'));
    nu += TT(1180, 956, [...wrap('Cu 위 Cu: 시드 결정을 이어 자란다', 17), ...wrap('Cu 위 Ni · Ni 위 SnAg: 새 씨앗이 필요 → 산화막 · 표면 상태가 중요', 17)], 't-sub', 'start', 28);
    s += G(nu, only('nuc'));
    // grain: 기둥 vs 알갱이 + 결정 크기가 바꾸는 것
    let gn = T(64, 784, '결정의 모양과 크기', 't-acc', 'start');
    gn += grains(70, 812, 300, 170, 16, 13, 0.3) + grains(440, 812, 300, 170, 70, 14);
    gn += TT(70, 1016, ['기둥 모양 (주상정)', '첨가제가 적거나 느린 성장'], 't-sub', 'start', 30);
    gn += TT(440, 1016, ['작은 알갱이', '첨가제가 새 씨앗을 계속 만든다'], 't-sub', 'start', 30);
    gn += TT(820, 790, ['결정 크기는 다음 성질을 바꾼다', '· 굳기 (작을수록 단단)', '· 전기 저항 (경계가 많으면 ↑)', '· 식각 · 반응 속도', '· 솔더와 IMC가 자라는 모양'], 't-sub', 'start', 34);
    gn += TT(820, 970, [...wrap('SnAg 막 속 Ag는 작은 Ag₃Sn 알갱이로 들어 있다. Ag가 공정점(共晶) 조성(약 3.5 wt%)보다 많고 천천히 식으면 큰 판 모양 Ag₃Sn → 균열 길', 34)], 't-dim', 'start', 28);
    s += G(gn, only('grain'));
    // imp: 커켄달 보이드 (Cu가 솔더와 직접 만나는 계면)
    let im = T(64, 784, '고온에 오래 두면 — Cu가 솔더와 직접 만나는 계면 (개념도)', 't-acc', 'start');
    const IY = 892, IH = 150, cl = [['Cu (도금)', 'f-cu2', 90, 300], ['Cu₃Sn', 'pl-imc3', 390, 110], ['Cu₆Sn₅', 'f-imc', 500, 150], ['솔더 (Sn)', 'f-sn2', 650, 300]];
    cl.forEach(([t, c, x, w]) => { im += R(x, IY, w, IH, c, tip(t)) + T(x + w / 2, IY + IH + 30, t, 't-sub'); });
    const ri = rng(21);
    for (let k = 0; k < 26; k++) im += C(100 + ri() * 270, IY + 10 + ri() * (IH - 20), 3.5, 'pl-impd');
    for (let k = 0; k < 10; k++) im += C(385 + ri() * 6, IY + 8 + k * 14, 3.2, 'f-acc');
    for (let k = 0; k < 7; k++) im += K.E(390 + 7 + ri() * 8, IY + 14 + k * 21, 6 + ri() * 4, 5, 'f-hole2');
    // 이름표는 층 위에, 짧은 세로 지시선으로 (층을 가로지르지 않게)
    im += LB(L(396, 826, 396, IY + 2, 's-lead') + C(396, IY + 2, 3.5, 'k-lead') + T(410, 842, '커켄달 보이드 — Cu/Cu₃Sn 계면', 't-sub', 'start') + T(410, 872, 'S (촉진제에서 옴)가 이 계면에 모인다', 't-sub', 'start'));
    im += LB(L(232, 880, 232, IY + 22, 's-lead') + C(232, IY + 22, 3.5, 'k-lead') + T(96, 872, '막 속 불순물 (S · Cl · C 등)', 't-sub', 'start'));
    im += TT(1000, 880, [...wrap('리플로우 한 번보다 고온에 오래 둘 때(예: 150 °C 시효 · 신뢰성 시험) 자란다', 26), ...wrap('Ni 방벽 범프는 솔더가 Ni와 만난다(Ni–Sn) → 주로 상대 Cu 패드 · Ni 없는 곳의 이야기', 26)], 't-dim', 'start', 26);
    s += G(im, only('imp'));
    // stress: 휨(블랭킷 막) · 크랙과 들뜸(범프) · 자기 풀림
    let ss = T(64, 784, '내부 응력 — 막이 줄어들거나(당김) 늘어나려(밂) 한다', 't-acc', 'start');
    // 인장: 막이 줄어들려 함 → 막 쪽이 오목 (U)
    ss += P('M80,880 Q205,950 330,880', 'pl-waf') + P('M80,870 Q205,940 330,870', 'pl-film') + K.arrow(96, 850, 160, 876, 's-arrr') + K.arrow(314, 850, 250, 876, 's-arrr');
    ss += R(370, 932, 110, 18, 'f-cu2') + R(384, 862, 82, 70, 'f-ni', tip('Ni 범프 — 당기는 응력이 크면 갈라진다')) + P('M420,862 l6,14 l-8,12 l7,14 l-5,12', 'pl-crack');
    ss += TT(70, 990, ['인장(당김) — 막이 줄어들려 한다', '블랭킷 막: 웨이퍼가 막 쪽으로 오목', '범프: 크랙'], 't-sub', 'start', 30);
    // 압축: 막이 늘어나려 함 → 막 쪽이 볼록 (∩)
    ss += P('M540,940 Q665,870 790,940', 'pl-waf') + P('M540,930 Q665,860 790,930', 'pl-film') + K.arrow(640, 868, 566, 892, 's-arr2') + K.arrow(690, 868, 764, 892, 's-arr2');
    ss += R(830, 932, 110, 18, 'f-cu2') + G(R(846, 864, 82, 66, 'f-ni'), {transform: 'rotate(-7 928 930)', 'data-tip': 'Ni 범프 — 미는 응력이 크면 들뜨거나 떨어진다'}) + P('M846,930 L846,920 L880,930 Z', 'f-hole2');
    ss += TT(540, 990, ['압축(밂) — 막이 늘어나려 한다', '블랭킷 막: 막 쪽으로 볼록', '범프: 들뜸 · 박리'], 't-sub', 'start', 30);
    ss += T(70, 1090, 'Ni 응력 손잡이: 전류밀도 · 온도 · pH · 염화물 · 액 분해 · 응력 조절제 → 정기 측정', 't-dim', 'start');
    // 자기 풀림 시간선
    const ann = (x, n, seed, t) => { const r = rng(seed), pts = []; for (let k = 0; k < n; k++) pts.push([x + 4 + r() * 132, 830 + r() * 102]); return voronoi(pts, x, 826, x + 140, 936, 0.6).map((p, k) => K.PG(p, 'f-grain', {style: cuFill(r, k)})).join('') + T(x + 70, 966, t, 't-sub'); };
    ss += T(1040, 804, 'Cu 자기 풀림 (상온)', 't-warn', 'start') + ann(1040, 40, 7, '도금 직후') + ann(1210, 14, 8, '수 시간~수 일') + ann(1380, 5, 9, '수 일~수 주');
    ss += K.arrow(1184, 880, 1206, 880, 's-arr') + K.arrow(1354, 880, 1376, 880, 's-arr');
    ss += TT(1040, 1004, ['결정이 커지며 저항 약 10~20 %↓ · 굳기↓', '두꺼운 막은 빠르고, 아주 얇은 막은 느리다', '→ 측정은 도금 후 정한 시간에'], 't-dim', 'start', 28);
    s += G(ss, only('stress'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 결정 만들기</div>
      ${K.ctl('cd', '전류밀도 (→ 과전압)', 5, 98, 1, 40)}
      ${K.seg('add', [['0', '없음'], ['1', '있음']], '1', '첨가제')}
      ${K.seg('age', [['0', '도금 직후'], ['1', '수 시간~수 주 뒤 (Cu 자기 풀림)']], '0', '시간')}
      ${K.kpis([['씨앗(결정) 수', 'k-n', '같은 면적에서'], ['평균 크기', 'k-s', '상대값'], ['표면', 'k-r', '']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('전류밀도는 한계전류 대비 %입니다. 한계보다 충분히 낮으면 전류(→ 과전압)가 클수록 씨앗이 많아지고, 한계에 가까우면 거칠어지는 경향만 그린 그림입니다. 실제 결정 크기 · 모양은 금속 · 첨가제 · 전류 파형 · 온도에 따라 다릅니다.')}</div>`;
  },
  mount(K, ctx){
    const {voronoi, rng, PG, C, G, P} = K;
    const st = {cd: 0.4, add: true, age: false};
    function render(){
      const rg = regime(st.cd), n = seeds(st.cd, st.add), rough = rg === 'fine' ? 0 : (st.cd - 0.75) / 0.25;
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
      // 한계 근처: 혹(거칠어짐) → 가루 · 탄 자국
      if (rg !== 'fine'){
        const rn = rng(77), m = Math.round(10 + rough * 50);
        for (let k = 0; k < m; k++){ const x = TV.x + rn() * TV.w, y = TV.y + rn() * TV.h; tv += rg === 'dend' && k % 2 ? C(x, y, 3 + rn() * 4, 'pl-burnt') : C(x, y, 6 + rn() * 9, 'p06-nod'); }
      }
      ctx.$('[data-v="tv"]').innerHTML = tv;
      // 단면: 첨가제가 없으면 기둥 모양, 있으면 잘게. 자기 풀림 뒤는 굵게. 한계 근처는 윗면이 거칠다
      const nc = Math.max(4, Math.round(n * 0.8 / (st.age ? 3.2 : 1))), r2 = rng(57), p2 = [];
      const y0 = CS.y + (rg === 'dend' ? 40 : 0);
      for (let k = 0; k < nc; k++) p2.push([CS.x + r2() * CS.w, y0 + r2() * (CS.y + CS.h - y0)]);
      const sy = st.add && !st.age ? 0.8 : 0.32;
      const c2 = voronoi(p2, CS.x, CS.y - 60, CS.x + CS.w, CS.y + CS.h, sy);
      // 윗면 (fine: 평평, rough: 울퉁불퉁, dend: 낮은 바닥 + 가지)
      const rt = rng(91);
      let top = `M${CS.x},${CS.y + CS.h}`;
      for (let x = 0; x <= CS.w; x += 14){ const yy = rg === 'fine' ? CS.y : rg === 'rough' ? CS.y + 14 - rough * (rt() * 34) - (x % 70 < 35 ? 8 * rough : 0) : y0 - rt() * 14; top += ` L${CS.x + x},${yy.toFixed(1)}`; }
      top += ` L${CS.x + CS.w},${CS.y + CS.h} Z`;
      let cs = `<clipPath id="p06-csr"><path d="${top}"/></clipPath>`;
      cs += G(c2.map((p, k) => PG(p, 'f-grain', {style: cuFill(r2, k)})).join(''), {'clip-path': 'url(#p06-csr)'});
      if (rg === 'dend'){
        const rb = rng(13);
        let d = '';
        for (let k = 0; k < 11; k++){ const bx = CS.x + 30 + k * 62 + rb() * 20, h = 50 + rb() * 50; d += `M${bx},${y0} L${bx + 4},${y0 - h}`; for (let t = 1; t <= 3; t++){ const yy = y0 - h * t / 4; d += ` M${bx + 2},${yy} l-14,-12 M${bx + 3},${yy - 6} l14,-12`; } }
        cs += P(d, 'p06-den');
      }
      ctx.$('[data-v="cs"]').innerHTML = cs;
      // 불순물: 결정 경계(꼭짓점)에
      const seen = new Set();
      let im = '';
      c2.forEach(p => p.forEach(([x, y], j) => { const kx = Math.round(x / 6) + ',' + Math.round(y / 6); if (seen.has(kx) || j % 2 || x <= CS.x + 2 || x >= CS.x + CS.w - 2 || y <= y0 + 4 || y >= CS.y + CS.h - 2) return; seen.add(kx); im += C(x, y, 5, 'pl-impd'); }));
      ctx.$('[data-v="imp"]').innerHTML = G(im + K.lead(CS.x + CS.w - 120, CS.y + 40, CS.x + CS.w - 200, 260, '결정 경계에 갇힌 불순물', 'end', 't-sub'), K.only('imp'));
      ctx.$('[data-v="cslbl"]').textContent = rg === 'dend' ? '한계 바로 앞 — 가지처럼 뻗고 가루가 붙는다' : rg === 'rough' ? '한계에 가까움 — 곱지 않고 거칠어진다' : st.age ? '수 시간~수 주 뒤 — 결정이 커졌다 (자기 풀림)' : st.add ? '첨가제 있음 — 고른 알갱이 결정 (기둥 모양을 막는다)' : '첨가제 없음 — 굵은 기둥 모양 결정';
      const size = 100 / Math.sqrt(n);
      ctx.out('k-n', `${n}개`); ctx.out('k-s', st.age ? '커짐' : size > 16 ? '굵음' : size > 12 ? '보통' : '고움');
      ctx.out('k-r', rg === 'dend' ? '가루 · 가지' : rg === 'rough' ? '거칠어짐' : '매끈');
      let msg = `씨앗 ${n}개 → 결정 하나의 면적은 약 1/${n}. ${st.add ? '첨가제가 과전압을 키워 씨앗을 늘리고, 기둥 모양 성장을 막습니다.' : '첨가제가 없으면 적은 씨앗이 굵게, 기둥 모양으로 자라기 쉽습니다.'}`;
      if (rg === 'rough') msg = '<b>한계전류에 가까워졌습니다.</b> 씨앗이 더 늘어 고와지는 대신, 공급이 모자라 튀어나온 곳이 이온을 먼저 잡아 거칠어집니다(혹 · 무광). 더 고운 결정을 원하면 전류보다 첨가제 · 공급(교반)을 봅니다.';
      if (rg === 'dend') msg = '<b>한계 바로 앞입니다.</b> 튀어나온 곳만 자라 나뭇가지(덴드라이트)처럼 뻗고, 넘기면 수소와 함께 가루 · 탄 도금이 됩니다 (04장).';
      if (st.age && rg === 'fine') msg += ' 첨가제가 든 Cu는 도금 뒤 상온에서도 결정이 커집니다(수 시간~수 주) — 그래서 측정 시점을 맞춥니다.';
      ctx.q('[data-o=msg]').innerHTML = msg;
      ctx.refresh();
    }
    const cdLbl = v => { const rg = regime(v / 100); return `한계의 ${v} %` + (rg === 'dend' ? ' (한계 바로 앞)' : rg === 'rough' ? ' (한계 근처)' : v < 30 ? ' (약하게)' : ''); };
    ctx.range('cd', v => { st.cd = v / 100; render(); return cdLbl(v); });
    ctx.seg('add', v => { st.add = v === '1'; render(); });
    ctx.seg('age', (v, user) => { st.age = v === '1'; render(); if (user && st.age) ctx.go('stress'); });
    // 손대기 전에는 단계마다 예시 값으로 (응력 단계는 자기 풀림 뒤 모습). 발표 모드에서는 늘 예시 값으로 되돌린다
    let touched = false;
    ctx.card.querySelectorAll('.pl-w input, .pl-w .pl-seg button').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    const cdIn = ctx.card.querySelector('input[data-i="cd"]');
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    ctx.demo = sid => {
      const ep = window.EngrPlating;
      if (ep && ep.state.pres != null) touched = false;
      if (touched) return ctx.refresh();
      const d = DEMO[sid] || DEMO.nuc;
      st.cd = d.cd / 100; st.add = d.add; st.age = d.age;
      if (cdIn) cdIn.value = d.cd;
      ctx.out('cd', cdLbl(d.cd)); setSeg('add', d.add ? '1' : '0'); setSeg('age', d.age ? '1' : '0');
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['핵생성', '표면에 원자 몇 개짜리 새 결정 씨앗이 생기는 것. 다른 금속 위에서 특히 중요'],
      ['이어 자라기 (에피택시)', '아래 결정의 원자 배열을 그대로 이어서 자라는 것. Cu 시드 위 Cu에서 많다'],
      ['결정립 · 결정 경계', '한 방향으로 원자가 늘어선 작은 결정 · 그 결정들이 만나는 선'],
      ['주상정 (기둥 결정)', '바닥에서 위로 길게 자란 결정. 첨가제가 적거나 느리게 쌓일 때 흔하다'],
      ['내부 응력', '막이 줄어들려는(인장, 당김) 또는 늘어나려는(압축, 밂) 힘'],
      ['자기 풀림', '첨가제가 든 Cu 도금막의 결정이 상온에서 수 시간~수 주에 걸쳐 커지는 현상'],
      ['커켄달 보이드', '원자들이 서로 다른 빠르기로 확산해, 빈자리가 한쪽에 모여 생긴 구멍']
    ]) + K.field([
      'Cu 경도와 저항은 도금 후 시간이 지나며 바뀝니다. <b>측정까지 걸리는 시간(도금 후 몇 시간)을 정해 두고 기록</b>합니다. 범프는 뒤의 리플로우가 어차피 열처리 역할을 합니다.',
      'Ni 응력은 얇은 시편이 휘는 정도로 <b>정기적으로 재서</b> 관리도로 봅니다. 손잡이는 전류밀도 · 온도 · pH · 염화물(많으면 당김↑) · 액 분해 · 오염(당김↑) · 황 든 응력 조절제입니다.',
      '다른 금속 위에 쌓을 때(Cu → Ni → SnAg)는 표면 상태가 씨앗 생성을 좌우합니다. 층 사이 대기 시간과 린스를 지킵니다.',
      '첨가제를 늘리면 결정이 곱고 매끈해지지만, <b>막에 갇히는 불순물도 늘 수 있습니다</b>. "많을수록 좋다"가 아닙니다.',
      '고온 보관 뒤 계면 보이드 문제를 볼 때는, 그 계면이 Cu–솔더(상대 Cu 패드 · Ni 없는 곳)인지 Ni–솔더인지부터 확인하고, 도금 조건과 첨가제 이력을 함께 봅니다.'
    ]) + K.deep(`<ul>
      <li><b>핵생성 속도</b>는 과전압에 매우 민감합니다(지수보다 더 가파르게). 그래서 반응 지배 구역에서는 과전압을 조금 올려도 씨앗 수가 크게 늘어 결정이 곱게 됩니다. 펄스 도금으로 순간 과전압을 크게 하는 것도 같은 원리입니다. 다만 한계전류에 가까워지면 공급이 모자라 가루 · 덴드라이트가 됩니다. 정전류 장비에서 과전압은 직접 고르는 값이 아니라 전류밀도 · 첨가제 · 온도 · 농도가 정하는 결과입니다.</li>
      <li><b>어디 위에 쌓나</b>: 다른 금속 위에서는 섬처럼 핵이 생겨 자라다 합쳐지고(섬 성장), 같은 금속 위에서는 아래 결정을 이어 자랍니다(에피택시). 성장 중에도 첨가제 때문에 새 핵이 계속 생겨 결정이 작게 유지됩니다.</li>
      <li>결정 성장 방식은 표면 원자가 계단 모서리를 찾아가는 속도(표면 확산)와 새 원자가 쌓이는 속도의 경쟁입니다. 억제제는 표면을 덮어 이 경쟁을 바꿉니다.</li>
      <li><b>자기 풀림</b>은 첨가제가 많이 들어간 Cu 막에서 두드러집니다. 결정이 수십 nm에서 µm 크기로 커지며 저항이 보통 10~20 % 내려갑니다. 두꺼운 막은 빨리 진행되고, 아주 얇은 막(약 0.75 µm 미만)은 거의 진행되지 않는다는 보고도 있습니다.</li>
      <li><b>커켄달 보이드</b>: S가 든 도금 Cu와 Sn-3.5Ag를 150 °C에서 시효하면 Cu₃Sn/Cu 계면에 보이드가 몰리고 그 계면에 S가 모인다는 연구가 있습니다. 평탄제에서 온 오염이 보이드를 늘렸다는 보고도 있습니다. 도금막 유기물이 리플로우 때 기체가 되어 보이드를 만든다는 보고도 있지만, 이 경우는 플럭스 · 솔더 조성과 함께 따져야 합니다.</li>
      <li><b>Ni 응력</b>: 설파민산 Ni는 보통 0~55 MPa 인장(잘 관리하면 0 근처)으로 낮고, 와트 Ni는 125~185 MPa 인장 정도입니다. 염화물이 많거나, 높은 온도 · 낮은 pH에서 설파민산이 분해되면 인장 응력이 커집니다. 사카린 같은 황 든 응력 조절제는 응력을 낮추지만 Ni에 황이 들어가, 약 200 °C 이상에서 Ni가 약해지는(황 취화) 보고가 있습니다.</li>
      <li><b>Ni 위 솔더</b>: Ni 위에서는 Ni₃Sn₄ 등이 자랍니다. Ni가 Cu와 솔더 사이에서 반응을 늦추는 방벽 역할을 하는 이유입니다(10장).</li></ul>`);
  },
  css: `.p06-den{fill:none;stroke:#e0904f;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}
.p06-nod{fill:#e9a56b;stroke:#5a3417;stroke-width:1.4}`
});
})();
