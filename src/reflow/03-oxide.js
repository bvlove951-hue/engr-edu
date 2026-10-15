/* 리플로우 03 — 산화막: 솔더 겉의 얇은 껍질은 어떻게 걷어 낼까 (표면 · nm) */
(function(){
// 왼쪽 확대 단면: 솔더 겉면 y SURF, 산화막은 위로 쌓인다 (1 nm = 6 px, 30 nm에서 자름)
const LX0 = 60, LX1 = 1000, SURF = 760, PXNM = 6, XMAX = 30;
// 오른쪽 위 작은 범프 (8 px/µm): 지름 25 µm = 200 px, 도금 원기둥 12 µm = 96 px, 같은 부피의 돔 15.7 µm = 126 px
const BX = 1300, BY = 470, BA = 100, HC = 96, HD = 126;
const STEPS = ['film', 'plasma', 'flux', 'formic', 'atmos'];
// 위젯 기본값과 단계별 예시(DEMO: 기본값 + 적힌 값만 덮어씀). qv · ov 는 슬라이더 값
const BASE = {qv: 48, wet: 'dry', pl: 'now', m: 'n2', ov: 43};
const DEMO = {
  film: {pl: 'no', qv: 100, wet: 'stain', m: 'n2'},
  plasma: {pl: 'now'},
  flux: {pl: 'no', wet: 'stain', m: 'flux'},
  formic: {pl: 'no', qv: 78, m: 'fa'},
  atmos: {pl: 'now', m: 'n2', ov: 100}
};
// 개념 모델 (모두 가정값)
const qDays = v => 0.04 * Math.pow(750, v / 100);                      // 0 → 약 1시간, 48 → 약 1일, 100 → 30일
const ppmOf = v => Math.pow(10, 3 * v / 100);                          // 0 → 1 ppm, 43 → 약 20 ppm, 100 → 1000 ppm
const STAIN = {dry: 0, stain: 15, heavy: 30};
const airOx = q => 1.0 + 0.35 * Math.log(1 + q / 0.02);               // 공기 중 자람 (로그 법칙, nm)
const REGROW = 0.35 * Math.log(1 + 0.33 / 0.02);                       // 플라즈마 뒤 8시간 다시 자람 ≈ 1.0 nm
const RM = {n2: 0, flux: 30, fa: 12, h2: 0.3};                         // 방법별 걷는 힘 (nm)
const DXF = {n2: 1, flux: 0.2, fa: 0.3, h2: 1};                        // 가열 중 다시 자람 배수 (플럭스는 덮고, 포름산은 새 막도 걷는다)
const MNAME = {n2: '질소만', flux: '플럭스', fa: '포름산 증기', h2: '수소 (250 °C)'};
const PLNAME = {no: '플라즈마 없음', now: '플라즈마 → 바로', wait: '플라즈마 → 8시간 뒤', o2: 'O₂ 플라즈마'};
function calc(st){
  const q = qDays(st.qv), ppm = ppmOf(st.ov), xd = airOx(q), xa = xd + STAIN[st.wet];
  let x0 = xa;
  if (st.pl === 'now') x0 = Math.max(0.5, xa - 10);
  else if (st.pl === 'wait') x0 = Math.max(0.5, xa - 10) + REGROW;
  else if (st.pl === 'o2') x0 = xa + 1;
  const dx = 0.15 * Math.sqrt(ppm) * DXF[st.m], R = RM[st.m];
  const xr = Math.max(0, x0 + dx - R), rm = Math.min(R, x0 + dx);
  const k = xr <= 4 ? 0 : xr <= 10 ? 1 : xr <= 25 ? 2 : 3;
  return {q, ppm, xd, xa, x0, dx, R, rm, xr, k};
}
const VERD = ['매끈한 돔 — 얇은 막은 녹을 때 깨진다', '돔이지만 주름 · 흐린 표면', '덜 둥긂 — 쭈글쭈글', '원기둥 그대로 — 비용융처럼 보임'];
const VSHORT = ['매끈', '주름', '덜 둥긂', '원기둥'];
const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
const fq = q => { const h = q * 24; return h < 20 ? `${Math.max(1, Math.round(h))}시간` : q < 1.5 ? '약 1일' : `약 ${q < 10 ? Math.round(q) : Math.round(q / 5) * 5}일`; };
const fppm = p => { if (p >= 100) return String(Number(p.toPrecision(2))); const e = Math.pow(10, Math.floor(Math.log10(p))); return String(Math.round(p / e) * e); };
const VN = {x: 40, y: 128, w: 980, h: 992};                             // 좁은 세로 화면: 왼쪽 확대 단면만 크게 (모양 판정은 카드의 결과 칸에)

(window.EngrReflowChapters = window.EngrReflowChapters || []).push({
  no: '03', id: 'oxide', part: 1, short: '산화막', scale: '표면 · nm',
  title: '산화막 — 솔더 겉의 얇은 껍질은 어떻게 걷어 낼까?',
  hook: '수 nm 껍질이 모양을 막는다',
  one: 'Sn은 공기 · 물에 닿자마자 얇은 산화막(SnO · SnO₂)으로 덮입니다. 이 껍질은 녹은 솔더가 둥글어지고 젖는 것을 막습니다. 그래서 리플로우 직전 · 리플로우 동안 산화막을 걷어 내고(플라즈마 · 플럭스 · 포름산), 다시 생기지 않게 산소를 막습니다(질소).',
  ana: '<b>물풍선을 감싼 랩</b> — 안의 물(녹은 솔더)은 둥글어지려 하지만, 겉을 감싼 질긴 랩(산화막)이 원래 모양을 붙잡습니다. 랩이 아주 얇으면 찢어지며 둥글어지고, 두꺼우면 쭈글쭈글한 채 남습니다. <i>(비유의 한계: 산화막은 따로 벗겨 내는 막이 아니라 Sn 원자가 산소와 결합한 층이라, 걷어 내려면 화학 반응(녹이기 · 환원)이 필요합니다. 또 걷어 낸 뒤에도 산소가 있으면 다시 생깁니다.)</i>',
  steps: [
    {id: 'film', t: '산화막 — 금방 생기는 껍질', d: 'Sn 표면은 공기에 닿자마자 수 nm 산화막(아래 SnO, 겉 SnO₂)으로 덮입니다. 시간 · 습도 · 남은 물기가 많을수록 두꺼워집니다. 녹을 때 얇은 막은 깨지지만, 두꺼운 막은 솔더를 원래 모양에 가둡니다.', viewN: VN},
    {id: 'plasma', t: '전처리 플라즈마 — 리플로우 직전에', d: '리플로우 바로 앞에 플라즈마로 유기물 · 산화막을 정리합니다. 기체가 중요합니다: O₂ 플라즈마는 유기물은 태우지만 Sn을 오히려 산화시켜, 산화막에는 Ar · H₂나 불소가 든 기체를 씁니다(조건에 따라). 처리 뒤 오래 두면 산화막이 다시 자라므로 대기 시간(Q-time)을 관리합니다.', viewN: VN},
    {id: 'flux', t: '플럭스 — 유기산이 녹여 낸다', d: '플럭스는 유기산(활성제) · 용제 · 점성 성분으로 된 약품입니다. 데우면 활성제가 산화막을 녹여 주석 염으로 바꾸고, 플럭스 층이 녹은 솔더를 공기에서 덮어 줍니다. 리플로우 뒤 남은 찌꺼기는 세정으로 없애야 합니다.', viewN: VN},
    {id: 'formic', t: '포름산 증기 — 플럭스 없이', d: '질소에 포름산(HCOOH) 증기를 섞어 넣으면 보통 150~200 °C에서 산화막과 반응해 포름산 주석이 되고, 더 뜨거워지면 분해되어 금속이 드러납니다. 씻을 찌꺼기가 거의 없지만, 배기 · 부식 · 안전 관리가 필요합니다.', viewN: VN},
    {id: 'atmos', t: '분위기 — 질소 · 산소 · 수소', d: '질소는 산화막을 없애지 못하고, 산소를 밀어내 다시 자라는 것을 늦출 뿐입니다. 남은 산소(ppm = 백만분의 1)가 많을수록 녹는 동안 더 자랍니다. 수소는 Sn 산화막을 약 350 °C가 넘어야 걷어, 솔더 리플로우 온도에서는 거의 일하지 못합니다.', viewN: VN}
  ],
  icon(K){
    const {R, C} = K;
    return R(4, 40, 58, 22, 'f-sn2') + R(4, 34, 58, 6, 'f-snox') + C(20, 16, 6, 'rf03-o2i') + C(42, 20, 6, 'rf03-fai');
  },
  draw(K){
    const {R, L, P, T, TT, G, LB, tip, only, wrap, W} = K;
    let s = '';
    // ── 왼쪽: 솔더 겉면 확대 단면
    s += R(LX0, 140, LX1 - LX0, SURF - 140, 'f-gas', tip('솔더 겉에 닿는 기체 · 약품 (단계마다: 공기 · 플라즈마 · 플럭스 · 포름산 증기 · 질소)'));
    s += `<g data-v="mols"></g>`;
    s += `<defs><linearGradient id="${K.id('rf03-slab')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e8f0"/><stop offset=".4" stop-color="#b4bfcf"/><stop offset="1" stop-color="#56627a"/></linearGradient></defs>`;
    s += R(LX0, SURF, LX1 - LX0, 340, 'rf03-slab', W({fill: K.url('rf03-slab')}, tip('SnAg 솔더 — 아래로 수 µm가 더 이어진다')));
    s += `<g data-v="ox"></g>`;
    s += R(LX0, 1036, LX1 - LX0, 64, 'rf03-cap');
    s += LB(T(84, 1077, 'SnAg 솔더', 't-lbl', 'start') + T(232, 1076, '(아래로 수 µm 더 이어짐)', 't-dim', 'start'));
    s += LB(T(984, 1076, '1 nm = 6 px — 크게 과장 (솔더 높이의 수천 분의 1)', 't-dim', 'end'), tip('산화막 수 nm는 솔더 높이(약 12 µm)의 수천 분의 1 — 실제 비율로 그리면 보이지 않을 만큼 얇다'));
    // 단계 머리글 (왼쪽 위)
    const head = (t1, lines, st) => G(LB(T(84, 184, t1, 't-acc', 'start') + TT(84, 214, lines, 't-dim', 'start', 26)), only(st));
    s += head('공기 · 물에 닿자마자 — 수 nm의 껍질', ['도금 · 세정 뒤 리플로우를 기다리는 동안 (공기 중)', '시간 · 습도 · 남은 물기 → 더 두껍게'], 'film');
    s += head('전처리 플라즈마 — 기체에 따라 다르다', wrap('Ar · H₂는 걷고, 불소는 녹을 때 쉽게 깨지는 얇은 막으로 바꾸고, O₂는 유기물만 태우며 Sn은 오히려 산화시킨다', 44), 'plasma');
    s += head('플럭스 층 — 산화막을 녹이고, 녹은 솔더를 덮는다', ['유기산(활성제, 그림의 R-COOH) + 용제 + 점성 성분 · 데우면 활성제가 일한다'], 'flux');
    s += head('포름산 증기 — 산화막 → 포름산 주석 → (더 뜨겁게) 금속', ['질소에 섞어 넣는다 · 플럭스 없음(무플럭스) · 나가는 기체: CO₂ · H₂O · H₂'], 'formic');
    s += head('질소는 늦출 뿐 못 걷는다 · 수소도 이 온도에서는 거의 못 걷는다', [], 'atmos');

    // ── 오른쪽 패널
    s += R(1040, 130, 520, 980, 'pl-panel', {rx: 14});
    s += LB(T(1064, 170, '녹은 뒤 모양 (위젯 값)', 'pl-hdg', 'start'));
    s += G(L(1068, 258, 1104, 258, 'pl-ghost') + LB(T(1114, 265, '도금한 원기둥 (12 µm)', 't-dim', 'start')));
    // 작은 범프: Ni · Cu 기둥(일부)
    s += R(BX - BA, BY, 2 * BA, 24, 'f-ni', tip('Ni 3 µm — 솔더가 젖는 바닥'));
    s += R(BX - BA, BY + 24, 2 * BA, 50, 'f-cu2', tip('Cu 기둥 (일부만 그림)'));
    s += P(`M${BX - BA - 6},${BY + 80} l20,-8 l20,8 l20,-8 l20,8 l20,-8 l20,8 l20,-8 l20,8 l20,-8 l20,8 l20,-8 l12,4`, 'rf03-brk');
    s += LB(T(1414, 442, 'SnAg', 't-dim', 'start') + T(1414, 489, 'Ni', 't-dim', 'start') + T(1414, 528, 'Cu 기둥', 't-dim', 'start'));
    s += `<g data-v="shape"></g>`;
    s += L(1060, 618, 1540, 618, 's-dash');
    s += `<g data-v="low"></g>`;

    // 플럭스: 말로 쓴 반응 (정적)
    const pill = (x, w, lab, cls) => G(R(x, 690, w, 36, 'rf03-pill ' + cls, {rx: 18}) + T(x + w / 2, 715, lab, 'rf03-pt'));
    let fx = LB(T(1064, 658, '플럭스가 하는 일 (말로 쓴 반응)', 'pl-hdg', 'start'));
    fx += pill(1064, 116, 'SnO · SnO₂', 'ox') + LB(T(1194, 716, '+', 't-sub')) + pill(1208, 92, 'R-COOH', 'ac') + LB(T(1316, 716, '→', 't-sub')) + pill(1332, 92, '주석 염', 'salt') + LB(T(1438, 716, '+', 't-sub')) + pill(1452, 66, 'H₂O', 'h2o');
    let fy = 776;
    [[['① 산화주석 + 유기산 → 주석 염 + 물', '    (주석 염은 플럭스에 녹아 떠난다)'], 't-sub'],
      ['② 활성제 예: 아디프산 · 숙신산 · 글루타르산 같은 유기산', 't-sub'],
      ['③ 녹은 솔더를 덮어 공기(산소)를 막는다', 't-sub'],
      ['④ 남은 찌꺼기 → 물 · 약품으로 세정 (08장)', 't-sub']].forEach(([t, c]) => { const ln = Array.isArray(t) ? t : wrap(t, 21.6); fx += LB(TT(1064, fy, ln, c, 'start', 27)); fy += ln.length * 27 + 12; });
    fx += LB(T(1064, fy + 12, '맞바꿈', 'pl-hdg2', 'start') + TT(1064, fy + 42, wrap('많이 바르거나 예열이 짧으면 튐 · 보이드(07장), 너무 뜨겁고 오래면 탄 찌꺼기', 24.5), 't-dim', 'start', 25));
    s += G(fx, only('flux'));

    // 포름산: 온도 띠 + 두 단계 (정적)
    const tx = t => 1080 + (t - 100) / 160 * 440;
    let fa = LB(T(1064, 658, '포름산 증기 — 두 단계 (보통 · 조건에 따라)', 'pl-hdg', 'start'));
    fa += R(tx(100), 680, tx(260) - tx(100), 34, 'pl-lane') + R(tx(150), 680, tx(200) - tx(150), 34, 'rf03-fz1', tip('약 150~200 °C — 산화막 + 포름산 → 포름산 주석 (공개 특허 서술)'));
    fa += `<defs><linearGradient id="${K.id('rf03-fzg')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#86efac" stop-opacity="0"/><stop offset=".55" stop-color="#86efac" stop-opacity=".5"/><stop offset="1" stop-color="#86efac" stop-opacity=".5"/></linearGradient></defs>`;
    fa += R(tx(190), 680, tx(260) - tx(190), 34, 'rf03-fz2', W({fill: K.url('rf03-fzg')}, tip('더 뜨겁게 — 포름산 주석이 분해되어 금속이 드러난다\n분해 온도는 조건에 따라 달라 숫자로 정하지 않았다 (흐린 경계)')));
    fa += L(tx(221), 672, tx(221), 722, 'pl-peak');
    [100, 150, 200, 250].forEach(t => { fa += L(tx(t), 714, tx(t), 722, 's-axis') + LB(T(tx(t), 744, String(t), 't-dim')); });
    fa += LB(T(tx(175), 704, '① 포름산 주석', 'rf03-bt') + T(tx(242), 704, '② 분해', 'rf03-bt') + T(1530, 744, '°C', 't-dim', 'end') + T(tx(221), 770, '221 °C — 솔더가 녹기 시작', 'pl-pkt'));
    let fyy = 812;
    [['① 약 150~200 °C: 산화주석 + 포름산 → 포름산 주석 + 물', 't-sub', 21.6],
      [['겉의 SnO₂는 포름산이 환원해야 해 더 어렵다', '(이때 CO₂가 나온다)'], 't-dim', 24.5],
      ['② 더 뜨겁게: 포름산 주석 → 주석 + CO₂ + H₂', 't-sub', 21.6],
      [['분해가 덜 되면 → 찌꺼기 · 뿌연 안개', '   (배기 · 온도로 관리)'], 'rf03-wt', 21.6],
      ['노출 기준 5 ppm — 배기 · 누출 감지', 'rf03-wt', 21.6]].forEach(([t, c, em]) => { const ln = Array.isArray(t) ? t : wrap(t, em); fa += LB(TT(1064, fyy, ln, c, 'start', 26)); fyy += ln.length * 26 + 10; });
    s += G(fa, only('formic'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 산화막 계산기</div>
      ${K.ctl('q', '공기 중 대기 시간 (도금 · 세정 → 리플로우)', 0, 100, 1, BASE.qv)}
      ${K.seg('wet', [['dry', '잘 마름'], ['stain', '물기 · 얼룩'], ['heavy', '얼룩 심함']], BASE.wet, '세정 · 건조')}
      ${K.seg('pl', [['no', '없음'], ['now', 'Ar · H₂ · 불소 — 바로 리플로우'], ['wait', '같은 처리 — 8시간 뒤'], ['o2', 'O₂ 위주 — 유기물만']], BASE.pl, '전처리 플라즈마')}
      ${K.seg('m', [['n2', '질소만'], ['flux', '플럭스'], ['fa', '포름산 증기'], ['h2', '수소 (250 °C)']], BASE.m, '걷는 방법')}
      ${K.ctl('o2', '남은 산소 (리플로우 중)', 0, 100, 1, BASE.ov)}
      ${K.kpis([['처음 산화막', 'k-x0', '리플로우에 들어갈 때'], ['가열 중 더 자람', 'k-dx', '녹을 때까지 · 남은 산소 때문'], ['걷어 냄', 'k-rm', '걷는 힘 최대 <span data-o="k-rmx"></span>'], ['남은 산화막 → 모양', 'k-v', '판정 경계 4 · 10 · 25 nm']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('공기 중 자람 x = 1.0 + 0.35·ln(1 + 일/0.02) nm(로그 법칙, 얼룩 +15 · 심하면 +30), 플라즈마(Ar · H₂ · 불소)는 10 nm까지 걷어 0.5 nm 남김 · 8시간 뒤 +1.0 · O₂ 위주 +1.0, 가열 중 +0.15·√ppm nm(플럭스 ×0.2 · 포름산 ×0.3), 걷는 힘 질소 0 · 플럭스 30 · 포름산 12 · 수소 0.3 nm. 모두 경향을 보이는 가정값입니다. 실제 두께는 표면 분석(XPS · 오제)으로, 판정 경계(4 · 10 · 25 nm)도 내 공정 데이터로 정합니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, TT, G, LB, tip, only, rng, wrap} = K;
    const st = Object.assign({}, BASE);
    const q1 = v => Math.round(v * 10) / 10;
    // 움직이는 분자 (둥근 알약 + 글자). path 를 따라 반복, 처음 · 끝에서 흐려진다
    const pillW = lab => Math.max(40, [...lab].reduce((a, c) => a + (/[ㄱ-힝]/.test(c) ? 17 : /[₀-₉]/.test(c) ? 7 : 10.8), 0) + 18);
    function molP(path, lab, cls, dur, delay, fade = true){
      const w = pillW(lab);
      const fa = fade ? `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.85;1" dur="${dur}s" begin="-${q1(delay)}s" repeatCount="indefinite"/>` : '';
      return `<g class="rf03-mol ${cls}" data-noov="1"><rect x="${q1(-w / 2)}" y="-18" width="${q1(w)}" height="36" rx="18"/><text y="6" text-anchor="middle">${lab}</text><animateMotion dur="${dur}s" begin="-${q1(delay)}s" repeatCount="indefinite" path="${path}"/>${fa}</g>`;
    }
    const mol = (x0, y0, x1, y1, lab, cls, dur, delay) => molP(`M${q1(x0)},${q1(y0)} L${q1(x1)},${q1(y1)}`, lab, cls, dur, delay);
    // 제자리 흔들림 (N₂ · R-COOH)
    function jig(x, y, lab, cls, seed, amp = 10){
      const r = rng(seed * 31 + 7);
      let d = `M${q1(x)},${q1(y)}`;
      for (let k = 0; k < 5; k++) d += ` L${q1(x + (r() - 0.5) * 2 * amp)},${q1(y + (r() - 0.5) * 2 * amp)}`;
      return molP(d + ' Z', lab, cls, 3.6 + r() * 2, r() * 4, false);
    }
    // 산화막 두 층 (아래 80 % SnO, 겉 20 % SnO₂). 겉이 조금 거칠다
    function film(nm, seed){
      const t = Math.min(nm, XMAX) * PXNM;
      if (t < 0.6) return '';
      const g = rng(seed), rough = Math.min(2.5, t * 0.1);
      let top = `M${LX0},${SURF - 0.8 * t}`;
      for (let x = LX0; x <= LX1; x += 20) top += ` L${x},${q1(SURF - t + (g() - 0.5) * 2 * rough)}`;
      top += ` L${LX1},${SURF - 0.8 * t} Z`;
      // 산소 자리 무늬 (막이 두꺼울 때만): SnO 는 성기게, SnO₂ 는 촘촘하게
      let dots = '';
      if (t >= 14){
        for (let y = SURF - 7; y > SURF - 0.8 * t + 4; y -= 14) for (let x = LX0 + 14 + ((SURF - y) / 14 % 2) * 11; x < LX1 - 6; x += 22) dots += `M${q1(x)},${q1(y)}h0.01`;
        for (let y = SURF - 0.8 * t - 5; y > SURF - t + 3; y -= 10) for (let x = LX0 + 9; x < LX1 - 6; x += 13) dots += `M${q1(x)},${q1(y)}h0.01`;
      }
      return R(LX0, SURF - 0.8 * t, LX1 - LX0, 0.8 * t, 'rf03-sno', tip('SnO — 아래쪽 두꺼운 층 (Sn²⁺)')) + P(top, 'rf03-sno2', tip('SnO₂ — 겉의 얇은 층 (Sn⁴⁺). 걷기가 더 어렵다')) + (dots ? P(dots, 'rf03-oat') : '');
    }
    const tpx = nm => Math.min(nm, XMAX) * PXNM;
    // 왼쪽 산화막 + 이름표: 지금 막(nm), 처리 전 막(nm, 점선), 앞말
    // 글자 폭 어림 (한글 1em, 아래첨자 0.4em, 나머지 0.56em)
    const tw = (str, px) => [...str].reduce((a, ch) => a + (/[ㄱ-힝]/.test(ch) ? px : /[₀-₉]/.test(ch) ? px * 0.4 : px * 0.56), 0);
    const plate = (x, y, str, px, anchor) => { const w = tw(str, px) + 16, x0 = anchor === 'end' ? x - w + 8 : x - 8; return R(q1(x0), y - px - 3, q1(w), px + 11, 'rf03-lbg', {rx: 6}); };
    function oxView(nm, ghost, pre, seed, o = {}){
      const t = tpx(nm), hasG = ghost != null && Math.abs(ghost - nm) > 0.05, tg = hasG ? tpx(ghost) : 0;
      const ly = SURF - Math.max(t, tg) - 12 - (o.lift || 0);      // 이름표는 두 막 가운데 높은 쪽 위에
      let s = film(nm, seed);
      if (hasG){
        const gw = pre === '처리 뒤' ? '처리 전' : '걷기 전', gl = `점선 = ${gw} ${f1(ghost)} nm`;
        s += R(LX0 + 2, SURF - tg, LX1 - LX0 - 4, tg, 'rf03-ghost', tip(`${gw} 산화막 ${f1(ghost)} nm`));
        s += LB((o.bg ? plate(84, ly, gl, 19, 'start') : '') + T(84, ly, gl, o.bg ? 'rf03-gl' : 't-dim rf03-hl', 'start'));
      }
      const lab = nm < 0.05 ? `${pre} 산화막 거의 없음 — 걷혔다` : `${pre} 산화막 ${f1(nm)} nm` + (nm > XMAX ? ' (그림은 30 nm에서 자름)' : t >= 54 ? '' : ' (겉 SnO₂ · 아래 SnO)');
      // 이름표는 내려오는 분자 위에 그려지므로 짙은 테두리(rf03-hl)로 글자가 끊기지 않게
      s += LB((o.bg ? plate(984, ly, lab, nm < 0.05 ? 21 : 23, 'end') : '') + T(984, ly, lab, (nm < 0.05 ? 'pl-hdg3' : 't-warn') + (o.bg ? '' : ' rf03-hl'), 'end'));
      if (t >= 54) s += LB(T(984, SURF - 0.4 * t + 7, 'SnO (아래)', 'rf03-lt', 'end') + T(984, SURF - 0.9 * t + 7, 'SnO₂ (겉)', 'rf03-dk', 'end'));
      return s;
    }
    // 오른쪽 위: 녹은 뒤 모양 — 도금 원기둥 높이 프로필과 돔 프로필 사이 (같은 부피), 주름은 남은 막이 두꺼울수록
    function shapeSvg(c){
      const xr = c.xr, k = c.k;
      const rho = xr <= 10 ? 1 : xr <= 25 ? 0.8 - 0.6 * (xr - 10) / 15 : 0;
      const amp = xr <= 4 ? 0 : xr <= 10 ? 1.5 + 3.5 * (xr - 4) / 6 : xr <= 25 ? 6 + 3 * (xr - 10) / 15 : 9;
      const Rs = (BA * BA + HD * HD) / (2 * HD);
      const hAt = u => { const x = u * BA, hd = Math.sqrt(Math.max(0, Rs * Rs - x * x)) - (Rs - HD); return rho * hd + (1 - rho) * HC; };
      const wr = u => amp * (0.6 * Math.sin(u * 9 * Math.PI + 0.7) + 0.4 * Math.sin(u * 23 * Math.PI + 2.1)) * (rho > 0.9 ? Math.sqrt(Math.max(0, 1 - u * u)) : 1);
      let d = `M${BX - BA},${BY}`;
      for (let i = 0; i <= 60; i++){ const u = -1 + 2 * i / 60; d += ` L${q1(BX + u * BA)},${q1(BY - hAt(u) + wr(u))}`; }
      const open = d + ` L${BX + BA},${BY}`;
      const topY = BY - hAt(0) + wr(0);
      let s = R(BX - BA, BY - HC, 2 * BA, HC, 'pl-ghost', tip('도금한 모양 — 원기둥 12 µm (리플로우 전)'));
      s += P(open + ' Z', 'f-sn2' + (k >= 2 ? ' rf03-matte' : ''), tip(`녹은 뒤 모양 (개념 그림) — 남은 산화막 ${f1(xr)} nm\n${VERD[k]}`));
      if (k === 0) s += P(`M${BX - 62},${BY - 92} Q${BX - 30},${BY - 120} ${BX + 6},${BY - 118}`, 'rf03-gloss');
      const sw = Math.min(10, xr * 0.4);
      if (sw > 0.3) s += P(open, 'rf03-oxl', {'stroke-width': q1(sw)});
      // 왼쪽 그림이 확대한 곳
      s += C(BX, topY, 16, 'rf03-mag') + LB(P(`M${BX - 40},304 L${BX - 12},${q1(topY - 12)}`, 's-lead') + T(1064, 298, '◀ 왼쪽 그림 = 꼭대기 겉면 확대', 't-dim', 'start'));
      s += LB(T(1064, 200, `남은 산화막 ${f1(xr)} nm`, 't-sub', 'start') + T(1064, 228, `방법: ${MNAME[st.m]} · ${PLNAME[st.pl]}`, 't-dim', 'start'));
      s += LB(T(BX, 590, VERD[k], k === 0 ? 'pl-hdg3' : 'pl-warn'));
      return s;
    }
    // 아래 패널 — 단계별 (위젯 값이 들어가는 것)
    function lowSvg(c){
      let s = '';
      // film: 공기 중 시간 → 산화막 그래프 (로그 시간)
      const GX0 = 1112, GX1 = 1520, GY0 = 1000, GY1 = 700;
      const gx = q => GX0 + Math.log(q / 0.04) / Math.log(750) * (GX1 - GX0), gy = x => GY0 - Math.min(x, 6) / 6 * (GY0 - GY1);
      let f = LB(T(1064, 658, '공기 중 시간 → 산화막 (개념 예시)', 'pl-hdg', 'start') + T(1112, 688, 'nm', 't-dim', 'start'));
      f += L(GX0, GY0, GX1 + 8, GY0, 's-axis') + L(GX0, GY0, GX0, GY1 - 6, 's-axis');
      [0, 2, 4, 6].forEach(v => { f += L(GX0 - 7, gy(v), GX0, gy(v), 's-axis') + LB(T(GX0 - 12, gy(v) + 7, String(v), 't-dim', 'end')); });
      [[1 / 24, '1시간'], [1, '1일'], [7, '7일'], [30, '30일']].forEach(([q, lb]) => { f += L(gx(q), GY0, gx(q), GY0 + 7, 's-axis') + LB(T(Math.min(gx(q), 1530), GY0 + 30, lb, 't-dim', q === 30 ? 'end' : 'middle')); });
      f += LB(T((GX0 + GX1) / 2, GY0 + 58, '공기 중 시간 (로그 눈금)', 't-dim'));
      let cv = '';
      for (let i = 0; i <= 60; i++){ const q = 0.04 * Math.pow(750, i / 60); cv += (i ? ' L' : 'M') + q1(gx(q)) + ',' + q1(gy(airOx(q))); }
      f += P(cv, 's-curve', tip('공기 중 자람 (가정): 1.0 + 0.35·ln(1 + 일/0.02) nm\n처음엔 빠르고 점점 느려진다'));
      const px = gx(c.q), py = gy(c.xd);
      f += L(px, GY0, px, py, 's-dash') + C(px, py, 8, 'k-acc2');
      const lx = px > 1400 ? px - 14 : px + 14, la = px > 1400 ? 'end' : 'start';
      if (STAIN[st.wet]){
        f += K.arrow(px, py - 12, px, GY1 + 14, 's-arr2');
        f += LB(T(px > 1300 ? px - 14 : px + 14, GY0 - 18, `물기 없이 ${f1(c.xd)} nm`, 't-dim', px > 1300 ? 'end' : 'start') + T(px > 1400 ? px - 14 : px + 14, GY1 + 26, `+ 얼룩 ${STAIN[st.wet]} → ${f1(c.xa)} nm`, 't-warn', la));
      } else f += LB(T(lx, py - 16, `지금 ${f1(c.xd)} nm (${fq(c.q)})`, 't-warn', la));
      f += LB(T(1064, 1088, '물기 · 얼룩이 남으면 + 수십 nm까지 (예시 +15 nm)', 't-dim', 'start'));
      s += G(f, only('film'));
      // plasma: 처리 방법별 리플로우 들어갈 때의 막 (지금 대기 시간 · 건조 조건으로)
      const xa = c.xa, now = Math.max(0.5, xa - 10);
      const vals = [['no', '없음', xa], ['now', '바로', now], ['wait', '8시간 뒤', now + REGROW], ['o2', 'O₂ 위주', xa + 1]];
      const vmax = Math.max(4, ...vals.map(v => v[2])), BH = 170, base = 900;
      let pz = LB(T(1064, 658, '리플로우에 들어갈 때의 막 — 처리별 (예시)', 'pl-hdg', 'start'));
      pz += L(1070, base, 1530, base, 's-axis');
      vals.forEach(([id, nm, v], i) => {
        const cx = 1126 + i * 118, h = Math.max(3, v / vmax * BH), on = id === st.pl;
        pz += R(cx - 40, base - h, 80, h, (id === 'o2' ? 'rf03-baro2' : on ? 'rf03-baron' : 'rf03-bar') + (on ? ' rf03-barsel' : ''), tip(`${PLNAME[id]}: ${f1(v)} nm`));
        pz += LB(T(cx, base - h - 10, `${f1(v)} nm`, on ? 't-warn' : 't-sub') + T(cx, base + 28, nm, on ? 'pl-hdg' : 't-dim'));
      });
      pz += P(`M1206,940 l0,8 L1400,948 l0,-8`, 's-axis') + LB(T(1303, 974, '같은 기체 (Ar · H₂ · 불소 계)', 't-dim'));
      // 시간 띠: 플라즈마 → 대기 → 리플로우
      const wait = st.pl === 'wait' ? 236 : st.pl === 'no' ? 150 : 84;
      const b1 = st.pl === 'no' ? 'rf03-tbx0' : st.pl === 'o2' ? 'rf03-tbx2' : 'rf03-tbx1';
      pz += R(1066, 994, 104, 40, b1, {rx: 8}) + R(1178, 994, wait, 40, 'rf03-tbxw', {rx: 8}) + R(1186 + wait, 994, 104, 40, 'rf03-tbxr', {rx: 8});
      pz += LB(T(1118, 1021, st.pl === 'no' ? '(없음)' : st.pl === 'o2' ? 'O₂' : '플라즈마', st.pl === 'no' ? 'rf03-bt0' : 'rf03-bt') +T(1178 + wait / 2, 1021, st.pl === 'wait' ? '대기 8시간 (다시 자람)' : st.pl === 'no' ? '공기 중 대기' : '바로', 'rf03-bt') + T(1238 + wait, 1021, '리플로우', 'rf03-bt'));
      pz += LB(T(1064, 1078, '대기가 길면 효과가 준다 — 장비 정지 · 재작업 때 주의', 't-dim', 'start'));
      s += G(pz, only('plasma'));
      // atmos: 걷는 방법 비교 표 (지금 고른 방법의 줄을 강조)
      // 칸마다 줄을 직접 나눈다 (자동 줄바꿈은 '· 탄화'처럼 어색하게 끊긴다)
      const ROWS = [['n2', ['질소만'], ['없음', '(늦출 뿐)'], ['없음'], ['산소 ppm', '대기 시간']],
        ['flux', ['플럭스'], ['강함'], ['있음', '→ 세정'], ['튐 · 보이드', '탄화']],
        ['fa', ['포름산 증기'], ['중간', '(150 °C부터)'], ['거의 없음'], ['배기 · 부식', '안전']],
        ['h2', ['수소 250 °C'], ['거의 없음', '(350 °C 아래)'], ['없음'], ['Cu 산화막은', '걷음']],
        ['pl', ['플라즈마', '전처리'], ['기체에 따라', 'O₂는 유기물만'], ['없음'], ['대기 시간', '기체 · 손상']]];
      const CW = [[1058, 128], [1186, 140], [1326, 98], [1424, 124]], LH = 23;
      let tb = LB(T(1064, 658, '걷는 방법 비교 (보통 · 테두리 = 위젯 선택)', 'pl-hdg', 'start'));
      let y = 676;
      tb += R(1056, y, 492, 36, 'rf03-th');
      ['방법', '걷는 힘', '찌꺼기', '주의'].forEach((h, j) => { tb += LB(T(CW[j][0] + 8, y + 25, h, 'rf03-tht', 'start')); });
      y += 36;
      ROWS.forEach(r => {
        const cells = r.slice(1);
        const n = Math.max(...cells.map(x => x.length)), hgt = n * LH + 16, on = r[0] === st.m || (r[0] === 'pl' && st.pl !== 'no');
        tb += R(1056, y, 492, hgt, on ? 'rf03-tron' : 'rf03-tr');
        cells.forEach((ln, j) => { tb += LB(TT(CW[j][0] + 8, y + 26, ln, j === 0 ? (on ? 'rf03-tdon' : 'rf03-td0') : on ? 'rf03-tdc on' : 'rf03-tdc', 'start', LH)); });
        y += hgt;
      });
      s += G(tb, only('atmos'));
      return s;
    }
    // 왼쪽 분자들 — 단계마다, 지금 막 높이에 내려앉는다
    function molSvg(c, tops){
      let s = '';
      // film: O₂ · H₂O 가 내려와 겉에 붙는다 (+ 물기 · 얼룩)
      let a = '';
      const yF = tops.film - 18;
      [130, 290, 450, 610, 770, 930].forEach((x, i) => { a += mol(x, 290, x + 20, yF, 'O₂', 'rf03-o2', 4.4 + (i % 3) * 0.5, i * 0.9); });
      [210, 380, 690, 850].forEach((x, i) => { a += mol(x, 300, x - 16, yF, 'H₂O', 'rf03-h2o', 5 + (i % 2) * 0.6, 0.6 + i * 1.3); });
      if (STAIN[st.wet]){
        const yS = tops.film;
        [170, 410, 640].forEach((x, i) => { a += P(`M${x - 58},${yS} Q${x - 50},${yS - 22} ${x},${yS - 24} Q${x + 52},${yS - 22} ${x + 60},${yS} Z`, 'rf03-drop', tip('남은 물기 · 얼룩 — 그 자리 산화막을 두껍게 한다')); });
        a += LB(P(`M${410},${yS - 26} L${450},${yS - 70}`, 's-lead') + T(456, yS - 74, `남은 물기 · 얼룩 → 막 +${STAIN[st.wet]} nm (예시)`, 't-warn rf03-hl', 'start'));
      }
      s += G(a, only('film'));
      // plasma: 빛나는 띠 + 아래로 내려오는 활성 입자 (기체에 따라 색)
      let b = '';
      const yP = tops.plasma - 10, red = st.pl === 'o2';
      const gtip = K.esc(red ? 'O₂ 플라즈마 — 유기물은 태우지만 Sn 겉을 더 산화시킨다' : st.pl === 'no' ? '전처리 플라즈마 없음 — 위젯에서 고르면 켜진다' : '플라즈마 — 기체에 전기 에너지를 주어 만든 이온 · 활성 입자');
      const blink = st.pl === 'now' || st.pl === 'o2' ? '<animate attributeName="opacity" values=".45;1;.45" dur="1.6s" repeatCount="indefinite"/>' : '';
      b += `<rect x="${LX0 + 1}" y="268" width="${LX1 - LX0 - 2}" height="76" class="rf03-glow${red ? ' o2' : st.pl === 'now' ? '' : ' off2'}" data-tip="${gtip}">${blink}</rect>`;
      const pt = {no: '전처리 플라즈마 없음 (위젯) — 공기 중 막 그대로', now: 'Ar · H₂ · 불소 계 플라즈마 (예시) — 막을 걷는다', wait: '같은 처리 뒤 8시간 대기 — 다시 자란다', o2: 'O₂ 위주 플라즈마 — 유기물만 태우고 Sn은 산화'}[st.pl];
      b += LB(T((LX0 + LX1) / 2, 314, pt, st.pl === 'o2' || st.pl === 'no' ? 'pl-warn' : 't-sub'));
      if (st.pl === 'now' || st.pl === 'o2'){
        const g = rng(17);
        for (let i = 0; i < 16; i++){ const x = 100 + i * 56 + (g() - 0.5) * 24; b += K.mover(x, 350, x + (g() - 0.5) * 40, yP, 7, red ? 'rf03-ionr' : 'rf03-ion', 1.1 + g() * 0.4, g() * 1.5); }
      }
      if (st.pl === 'wait') [230, 520, 790].forEach((x, i) => { b += mol(x, 360, x + 18, tops.plasma - 18, 'O₂', 'rf03-o2', 6 + i * 0.6, i * 2); });
      s += G(b, only('plasma'));
      // flux: 노란 플럭스 층 + 그 안에서 흔들리는 유기산 + 떠오르는 주석 염 + 겉에서 튕겨 나가는 O₂
      const fTop = Math.min(540, tops.fluxG - 90);
      let fl = R(LX0, fTop, LX1 - LX0, SURF - fTop, 'f-flux', tip('플럭스 층 — 산화막을 녹이고, 녹은 솔더를 공기에서 덮는다'));
      [150, 330, 500, 680, 860].forEach((x, i) => { fl += jig(x, fTop + 32 + (i % 2) * 22, 'R-COOH', 'rf03-ac', i + 3, 10); });
      [240, 420, 600, 780].forEach((x, i) => { fl += mol(x, SURF - 14, x + 10, fTop + 18, '주석 염', 'rf03-salt', 3.8 + i * 0.3, i * 0.9); });
      [150, 300, 450, 600].forEach((x, i) => { fl += molP(`M${x},300 L${x},${fTop - 20} L${x + 40},310`, 'O₂', 'rf03-o2', 4.6, i * 1.15); });
      fl += LB(T(984, fTop - 16, '공기의 O₂는 플럭스 층에 막힌다', 't-dim', 'end'));
      s += G(fl, only('flux'));
      // formic: HCOOH 가 내려오고 CO₂ · H₂O 가 빠져나간다 (질소에 섞여)
      let fo = '';
      const yA = tops.formic - 18, tgA = tpx(tops.formicG), hF = Math.max(12, Math.min(48, tgA * 0.6));
      // 중간 단계: 포름산 주석 층이 잠깐 생겼다 분해된다 (반복)
      if (tgA > 4) fo += `<rect x="${LX0 + 2}" y="${q1(tops.formic - hF)}" width="${LX1 - LX0 - 4}" height="${q1(hF)}" class="rf03-fmt" data-tip="포름산 주석 — 산화막과 포름산이 만든 중간 물질. 더 뜨거워지면 분해되어 금속이 드러난다"><animate attributeName="opacity" values="0;.9;.9;0;0" keyTimes="0;.25;.6;.85;1" dur="4.5s" repeatCount="indefinite"/></rect>`;
      [[150, 330], [320, 520], [470, 360], [640, 560], [790, 420], [920, 600]].forEach(([x, y], i) => { fo += jig(x, y, 'N₂', 'rf03-n2', 40 + i, 9); });
      [130, 290, 450, 610, 770, 900].forEach((x, i) => { fo += mol(x, 290, x + 14, yA, 'HCOOH', 'rf03-fa', 4.2 + (i % 3) * 0.5, i * 0.75); });
      [[210, 'CO₂', 'rf03-co2'], [530, 'CO₂', 'rf03-co2'], [850, 'CO₂', 'rf03-co2'], [370, 'H₂O', 'rf03-h2o'], [700, 'H₂O', 'rf03-h2o'], [610, 'H₂', 'rf03-h2']].forEach(([x, lab, cls], i) => { fo += mol(x, yA, x - 20, 290, lab, cls, 4.6, 1 + i * 0.9); });
      // 이름표는 분자 다음에 (분자가 글자 위로 지나가지 않게)
      if (tgA > 4) fo += LB(T(84, Math.min(SURF - tgA, tops.formic - hF) - 44, '초록 띠 = 잠깐 생기는 포름산 주석 (곧 분해)', 'rf03-fgt rf03-hl', 'start'));
      s += G(fo, only('formic'));
      // atmos: 질소 가득 (흐리게) + 산소 n개가 겉으로 + 수소는 닿았다 튕겨 나감
      let at = '';
      const yT = tops.atmos - 18, nO2 = Math.round(8 * Math.log10(c.ppm) / 3);
      for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++){ const x = 130 + k * 152 + (r % 2) * 60, y = 330 + r * Math.max(40, (yT - 380) / 2); at += jig(x, y, 'N₂', 'rf03-n2', r * 6 + k + 1, 10); }
      for (let i = 0; i < nO2; i++){ const x = 170 + i * 100; at += mol(x, 290, x + 10, yT, 'O₂', 'rf03-o2', 4.2 + (i % 3) * 0.5, i * 0.6); }
      [260, 500, 740, 900].forEach((x, i) => { at += molP(`M${x},300 L${x},${yT} L${x + 40},320`, 'H₂', 'rf03-h2', 4.4, i * 1.1); });
      at += LB(T(84, 214, `남은 산소 ${fppm(c.ppm)} ppm → 그림의 O₂ ${nO2}개 · 수소는 겉에 닿고 그냥 돌아간다`, 't-dim', 'start'));
      s += G(at, only('atmos'));
      return s;
    }
    function render(){
      const c = calc(st);
      // 단계별 왼쪽 막: film = 공기 중 막, plasma = 처리 뒤(리플로우 전) 막, flux · formic = 그 방법으로 걷은 뒤(다른 조건은 위젯 값), atmos = 녹을 때까지 다시 자란 막
      const cF = calc(Object.assign({}, st, {m: 'flux'})), cA = calc(Object.assign({}, st, {m: 'fa'}));
      const atm = c.x0 + c.dx;
      let ox = G(oxView(c.xa, null, '공기 중', 3, {lift: STAIN[st.wet] ? 20 : 0}), only('film'));
      ox += G(oxView(c.x0, c.xa, '처리 뒤', 5), only('plasma'));
      ox += G(oxView(cF.xr, cF.x0 + cF.dx, '플럭스로 걷은 뒤', 7, {bg: true}), only('flux'));
      ox += G(oxView(cA.xr, cA.x0 + cA.dx, '포름산으로 걷은 뒤', 9), only('formic'));
      // atmos: 처음 막(x0) 위에 가열 중 다시 자란 몫(dx)을 다른 색으로
      let am = film(c.x0, 11);
      const t0 = tpx(c.x0), t1 = tpx(atm);
      if (t1 - t0 > 0.4) am += R(LX0, SURF - t1, LX1 - LX0, t1 - t0, 'rf03-regrow', tip(`녹을 때까지 다시 자란 막 +${f1(c.dx)} nm (남은 산소 ${fppm(c.ppm)} ppm)`));
      am += LB(T(984, SURF - t1 - 12, `녹을 때 산화막 ${f1(atm)} nm`, 't-warn rf03-hl', 'end') + T(84, SURF - t1 - 12, `가열 중 다시 자람 +${f1(c.dx)} nm`, 'rf03-rgt rf03-hl', 'start'));
      ox += G(am, only('atmos'));
      ctx.$('[data-v="ox"]').innerHTML = ox;
      const tops = {film: SURF - tpx(c.xa), plasma: SURF - tpx(c.x0), fluxG: SURF - tpx(cF.x0 + cF.dx), formic: SURF - tpx(cA.xr), formicG: cA.x0 + cA.dx, atmos: SURF - t1};
      ctx.$('[data-v="mols"]').innerHTML = molSvg(c, tops);
      ctx.$('[data-v="shape"]').innerHTML = shapeSvg(c);
      ctx.$('[data-v="low"]').innerHTML = lowSvg(c);
      ctx.refresh();
      // 카드
      ctx.out('k-x0', f1(c.x0) + ' nm'); ctx.out('k-dx', '+' + f1(c.dx) + ' nm'); ctx.out('k-rm', c.rm >= 0.05 ? '−' + f1(c.rm) + ' nm' : '0 nm'); ctx.out('k-rmx', c.R + ' nm (가정)');
      ctx.out('k-v', `${f1(c.xr)} nm · ${VSHORT[c.k]}`);
      const kv = ctx.card.querySelector('[data-o="k-v"]').parentNode;
      kv.classList.toggle('ok', c.k === 0); kv.classList.toggle('warn', c.k === 1); kv.classList.toggle('ng', c.k >= 2);
      const res = {flux: '찌꺼기 있음 → 세정 필요 (<a data-go="tool.clean">08장</a>).', fa: '찌꺼기 거의 없음 — 포름산 주석 분해 · 배기 관리 (<a data-go="tool.gas">08장</a>).', h2: '이 온도(250 °C)에서 수소는 Sn 산화막을 거의 그대로 둡니다 — 약 350 °C 넘어야 걷습니다 (Cu 산화막은 걷음).', n2: '질소는 다시 자라는 것을 늦출 뿐 걷지 못합니다.'}[st.m];
      let msg = `처음 <b>${f1(c.x0)} nm</b> + 가열 중 <b>${f1(c.dx)} nm</b> − 걷어 냄 <b>${f1(c.rm)} nm</b> = 남은 <b>${f1(c.xr)} nm</b> → ${VERD[c.k]}. ${res}`;
      if (st.pl === 'o2') msg += ' O₂ 플라즈마는 유기물은 태우지만 Sn 산화막은 오히려 늘립니다 — 산화막은 리플로우 중 환원(플럭스 · 포름산)이 맡아야 합니다.';
      else if (st.pl === 'wait') msg += ` 처리 뒤 8시간 기다리는 동안 약 ${f1(REGROW)} nm 다시 자랐습니다 (가정).`;
      else if (st.pl === 'now' && c.xa - 10 > 0.5) msg += ' 얼룩으로 두꺼워진 막은 플라즈마로 다 걷히지 않습니다 (10 nm까지 걷는다고 가정).';
      if (STAIN[st.wet] && st.m === 'n2' && st.pl === 'no') msg += ' 물기 · 얼룩은 그 자리 막을 두껍게 해 국부 비용융을 만듭니다.';
      ctx.q('[data-o=msg]').innerHTML = msg;
    }
    // 컨트롤
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const qIn = ctx.card.querySelector('input[data-i="q"]'), oIn = ctx.card.querySelector('input[data-i="o2"]');
    let ready = false, touched = false;
    const rr = () => { if (ready) render(); };
    const STEP_OF = {n2: 'atmos', h2: 'atmos', flux: 'flux', fa: 'formic'};
    ctx.range('q', v => { st.qv = v; rr(); return fq(qDays(v)); });
    ctx.range('o2', v => { st.ov = v; rr(); return '약 ' + fppm(ppmOf(v)) + ' ppm'; });
    ctx.seg('wet', v => { st.wet = v; rr(); });
    ctx.seg('pl', v => { st.pl = v; rr(); });
    let userM = st.m;                                                     // 사용자가 마지막으로 고른 걷는 방법
    ctx.seg('m', (v, user) => {
      st.m = v; if (user) userM = v; rr();
      // 걷는 방법 단계에 있으면 고른 방법의 단계로 (장면과 위젯이 같은 방법을 보이게)
      const sid = ctx.step();
      if (user && (sid === 'flux' || sid === 'formic' || sid === 'atmos') && STEP_OF[v] !== sid) ctx.go(STEP_OF[v]);
    });
    ready = true;
    render();
    ctx.card.querySelectorAll('.pl-w input').forEach(i => i.addEventListener('input', () => { touched = true; }));
    ctx.card.querySelectorAll('.pl-w .pl-seg button').forEach(b => b.addEventListener('click', () => { touched = true; }));
    // 손대기 전 · 발표 모드에서는 단계마다 예시 값으로
    ctx.demo = sid => {
      const ep = window.EngrTheatres && window.EngrTheatres.reflow;
      if (ep && ep.state.pres != null) touched = false;
      const d = DEMO[sid];
      if (touched || !d){
        // 손댄 뒤: 플럭스 · 포름산 단계는 그 방법을 보이고(장면과 위젯이 같은 방법), 다른 단계에서는 사용자가 고른 방법으로 돌아간다
        const want = sid === 'flux' ? 'flux' : sid === 'formic' ? 'fa' : userM;
        if (touched && want !== st.m){ st.m = want; setSeg('m', want); }
        return render();
      }
      Object.assign(st, BASE, d);
      ['wet', 'pl', 'm'].forEach(k => setSeg(k, st[k]));
      if (qIn) qIn.value = st.qv;
      if (oIn) oIn.value = st.ov;
      ctx.out('q', fq(qDays(st.qv))); ctx.out('o2', '약 ' + fppm(ppmOf(st.ov)) + ' ppm');
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['산화막', 'Sn이 산소와 결합한 얇은 막. 실온에서는 아래 SnO, 겉 SnO₂로 수 nm'],
      ['환원', '산화된 금속에서 산소를 떼어 금속으로 되돌리는 반응'],
      ['플럭스', '산화막을 녹여 없애고 녹은 솔더를 덮어 주는 약품. 유기산(활성제) + 용제 + 점성 성분'],
      ['활성제', '플럭스에서 산화막을 녹이는 성분. 보통 아디프산 · 숙신산 같은 유기산'],
      ['포름산 (HCOOH)', '가장 간단한 유기산. 증기로 넣어 플럭스 없이(무플럭스) 산화막을 걷는다'],
      ['ppm', '백만분의 1. 산소 20 ppm = 기체 분자 백만 개 가운데 산소가 20개'],
      ['대기 시간 (Q-time)', '앞 처리에서 다음 처리까지 기다리는 시간. 길면 산화막이 다시 자란다'],
      ['플라즈마', '기체에 전기 에너지를 주어 만든 이온 · 활성 입자 상태. 표면을 깎거나 화학적으로 바꾼다 — 효과는 기체가 정한다']
    ]) + K.field([
      '<span class="pl-tag ep">리플로우-분위기</span><span class="pl-tag rf03-cond">리플로우-조건</span><span class="pl-tag up">앞 공정</span> 비용융처럼 보이는 불량이 나오면 <b>대기 시간 이력 · 산소 로그 · 환원 공급(플럭스 양 · 포름산 유량) · 표면 얼룩</b>부터 확인합니다 → <a data-go="defects.tiles">09장</a> · <a href="#go-plating-12">전해도금 12장</a>.',
      '<span class="pl-tag up">앞 공정</span> 시드 식각 · 스트립 뒤 <b>헹굼 · 건조 불량 얼룩</b>(남은 산 · 물기)은 그 자리 산화막을 두껍게 해 국부 비용융을 만듭니다 → <a href="#go-etch-08">시드 식각 08장</a> · <a href="#go-strip-05">PR 스트립 05장</a>.',
      '<span class="pl-tag ep">리플로우-분위기</span> 플럭스 ↔ 포름산 방식을 바꾸면 찌꺼기 · 세정 · 배기 · 안전(포름산 노출 기준 5 ppm)과 보이드 경향이 함께 바뀝니다 → <a data-go="tool.gas">08장</a> · <a data-go="void.where">07장</a>.',
      '<span class="pl-tag up">앞 공정</span> 전처리 플라즈마의 <b>기체 · 레시피</b>가 바뀌면(특히 O₂ 비율) 산화막이 오히려 늘 수 있습니다. 전처리 뒤 덜 둥긂이 늘면 장비 정지 · 대기 시간과 함께 기체 · 레시피 변경 이력을 봅니다 → <a href="#go-bump">범프 공정 탭</a>.',
      '<span class="pl-tag hw">리플로우-장비</span> 산소 센서도 교정 · 설치 위치가 중요합니다. 챔버 구석 · 문 쪽은 산소가 늦게 빠지므로, 웨이퍼 자리의 산소와 센서 값이 다를 수 있습니다 → <a data-go="tool.gas">08장</a>.'
    ]) + K.deep(`<ul>
      <li><b>반응식</b> — 플럭스: SnO + 2 RCOOH → Sn(RCOO)₂ + H₂O, 겉의 SnO₂ + 4 RCOOH → Sn(RCOO)₄ + 2 H₂O (주석 염은 플럭스에 녹아 떠남). 포름산: SnO + 2 HCOOH → Sn(HCOO)₂ + H₂O (공개 특허 서술: 약 150~200 °C에서 포름산 주석 생성, 공급사 설명의 활성화 온도 '약 180 °C'). 겉의 SnO₂(Sn⁴⁺)는 녹이기만으로는 안 되고 포름산이 환원제로 일해야 합니다: SnO₂ + 3 HCOOH → Sn(HCOO)₂ + CO₂ + 2 H₂O — 그래서 SnO₂ 쪽이 더 걷기 어렵고, 장면의 CO₂도 여기서 나옵니다. 더 높은 온도에서 Sn(HCOO)₂ → Sn + 2 CO₂ + H₂. 포름산 자체는 기체에서 CO + H₂O 또는 CO₂ + H₂로 분해됩니다. 분해가 덜 된 포름산 주석이 웨이퍼 · 챔버에 붙었다 높은 온도에서 분해되면 Sn · SnO₂ · 유기물이 섞인 뿌연 안개(tin fog)가 된다는 보고가 있습니다. 포름산 주석의 분해 온도 숫자는 조건에 따라 달라 여기서는 쓰지 않습니다.</li>
      <li><b>수소의 한계</b> — 순수 H₂로 Sn 계열 솔더의 산화물을 걷으려면 약 350 °C 넘게 필요하고, 보통 납땜 온도(&lt; 250 °C)에서는 느리다는 공개 자료가 많습니다(Cu 산화물은 납땜 온도에서도 H₂로 환원됨). 그래서 320 °C 넘게 녹이는 고납 솔더는 H₂, Sn 계열 범프는 포름산을 써 왔습니다. 전자 부착 · 플라즈마로 수소를 활성화해 온도를 낮추는 방식도 있습니다.</li>
      <li><b>질소와 산소 ppm</b> — 질소는 이미 있는 산화막을 없애지 못합니다(Sn 산화물은 아주 안정해, 남은 산소 수 ppm에서도 열역학적으로는 Sn이 산화되는 쪽입니다). 산소 ppm은 '다시 자라는 속도'를 정합니다. 공개 예: 웨이퍼 범프 플럭스 리플로우는 산소 보통 20 ppm 미만 권장(공급사 자료), 보드 실장에서는 합금에 따라 수천 ppm에서도 질소의 이점이 보고됩니다. 공기(21 %)에서 20 ppm까지 완전 혼합으로 바꾸려면 챔버 부피의 약 9배(ln 10,500 ≈ 9.3)를 흘려야 합니다(<a data-go="tool.gas">08장</a>).</li>
      <li><b>기체에 따라 반대 효과</b> — O₂가 든 플라즈마는 유기물은 잘 태우지만 Sn 계 솔더를 심하게 산화시킨다는 공개 특허 서술이 있습니다(겉 산화막이 수 nm 더 자랄 수 있음). 산화막을 줄이는 쪽은 Ar(물리적으로 깎음) · Ar/H₂(수소 라디칼로 환원) · 불소 계(녹을 때 깨지는 불화물 · 산불화물로 바꿈)입니다. 유기물 제거에 O₂를 쓰면 산화막은 리플로우 중 환원(포름산 · 플럭스)이 맡아야 합니다. 불소 계의 예: SF₆ · CF₄ 플라즈마로 산화막을 주석 불화물 · 산불화물로 바꾸면 녹을 때 쉽게 깨져 플럭스 없이 리플로우할 수 있다는 방식이 1980~90년대 특허로 알려져 있고(플라즈마 보조 건식 솔더링), 처리 뒤 공기에 오래 두면 효과가 줄어 처리와 리플로우를 이어서 하라고 권합니다.</li>
      <li><b>포름산과 Cu 산화물</b> — Cu 산화물은 Sn 산화물보다 쉽게 환원됩니다(H₂로도 납땜 온도에서 걷힘). 포름산 · 강한 환원은 드러난 Cu 기둥 옆면의 산화막까지 걷어 옆면 젖음(흘러내림)을 늘릴 수 있습니다(<a data-go="wet.edge">04장</a>). 반대로 옆면이 산화된 채 남으면 뒤 공정의 접착에 불리하다는 서술도 있어 맞바꿈입니다.</li>
      <li><b>산화막 두께 규모</b> — 실온 공기에서 수 nm(예: Sn-1Bi 합금 72시간 약 2.3 nm, 아래 두꺼운 SnO 위 얇은 SnO₂, 물속에서는 약 3.3 nm). 처음엔 직선, 막이 두꺼워지면 포물선 법칙으로 느려진다는 보고가 있고, 습기 · 남은 산 · 높은 온도에서 빠르게 자랍니다. 전해도금 탭은 "수십 nm 산화막만으로도 둥글어지지 못할 수 있다"고 썼고(<a href="#go-plating-12">전해도금 12장</a>), 이 장의 판정 경계(25 nm)도 그와 맞춥니다. 두께는 XPS(X선 광전자 분광) · 오제 전자 분광의 깊이 분석이나, 산화물을 차례로 전기화학 환원해 재는 방법으로 확인합니다.</li>
      <li><b>위젯 식</b> — 실온의 얇은 산화막은 처음 빠르고 곧 느려집니다(보고마다 로그 · 직선 → 포물선 법칙 등으로 맞춤). 위젯은 이를 로그 법칙 하나로 단순화했습니다: x_공기 = 1.0 + 0.35·ln(1 + 일/0.02) nm (+15 · +30 얼룩), 플라즈마 x₀ = max(0.5, x − 10) (8시간 뒤 +1.0, O₂ 위주 x + 1), dx = 0.15·√ppm nm (플럭스 × 0.2 · 포름산 × 0.3), 걷는 힘 R = 0 · 30 · 12 · 0.3 nm, 남은 막 = max(0, x₀ + dx − R). 예: 기본(1일 · 바로 · 질소 · 20 ppm) 1.2 nm 매끈, 플라즈마 없이 30일 · 얼룩 · 질소 약 19 nm 덜 둥긂, 같은 조건 + 플럭스 0 nm, 질소 1,000 ppm 5.2 nm 주름, O₂ 위주 · 1일 약 4.0 nm(경계). 모두 가정값입니다.</li></ul>`);
  },
  css: `.pl-svg .rf03-sno{fill:#5d6b80}
.pl-svg .rf03-cap{fill:rgba(8,15,30,.72)}
.pl-svg .rf03-lt{font-size:21px;font-weight:800;fill:#f1f5f9 !important}
.pl-svg .rf03-fmt{fill:rgba(74,222,128,.45);stroke:#86efac;stroke-width:1.2}
.pl-svg .rf03-fgt{font-size:19px;font-weight:700;fill:#86efac !important}
.pl-svg .rf03-sno2{fill:#a7b4c6;stroke:#cbd5e1;stroke-width:.8}
.pl-svg .rf03-regrow{fill:rgba(248,113,113,.55);stroke:#fca5a5;stroke-width:1}
.pl-svg .rf03-ghost{fill:none;stroke:#e2e8f0;stroke-width:2;stroke-dasharray:8 6;opacity:.75}
.pl-svg .rf03-oxl{fill:none;stroke:#94a3b8;stroke-linejoin:round;stroke-linecap:round;opacity:.95}
.pl-svg .rf03-matte{opacity:.82}
.pl-svg .rf03-gloss{fill:none;stroke:rgba(255,255,255,.7);stroke-width:6;stroke-linecap:round}
.pl-svg .rf03-mag{fill:none;stroke:#fbbf24;stroke-width:2.4;stroke-dasharray:5 4}
.pl-svg .rf03-brk{fill:none;stroke:#0b1222;stroke-width:5}
.pl-svg .rf03-glow{fill:rgba(167,139,250,.30);stroke:rgba(196,181,253,.6);stroke-width:1}
.pl-svg .rf03-glow.o2{fill:rgba(248,113,113,.30);stroke:rgba(252,165,165,.6)}
.pl-svg .rf03-ion{fill:#ddd6fe;stroke:#a78bfa;stroke-width:1.5}
.pl-svg .rf03-oat{fill:none;stroke:rgba(254,202,202,.55);stroke-width:5;stroke-linecap:round}
.pl-svg .rf03-ionr{fill:#f87171;stroke:#fecaca;stroke-width:1.5}
.pl-svg .rf03-drop{fill:rgba(125,211,252,.30);stroke:#7dd3fc;stroke-width:1.6}
.pl-svg .rf03-mol rect{stroke-width:1.4}
.pl-svg .rf03-mol text{font-size:17px;font-weight:900;fill:#1b1203 !important;stroke:none !important;paint-order:normal}
.pl-svg .rf03-o2 rect{fill:#f87171;stroke:#fecaca}
.pl-svg .rf03-h2o rect{fill:#7dd3fc;stroke:#e0f2fe}
.pl-svg .rf03-fa rect{fill:#4ade80;stroke:#dcfce7}
.pl-svg .rf03-ac rect{fill:#facc15;stroke:#fef9c3}
.pl-svg .rf03-n2{opacity:.5}
.pl-svg .rf03-n2 rect{fill:#94a3b8;stroke:#e2e8f0}
.pl-svg .rf03-h2 rect{fill:#f1f5f9;stroke:#ffffff}
.pl-svg .rf03-co2 rect{fill:#cbd5e1;stroke:#f1f5f9}
.pl-svg .rf03-salt rect{fill:#b7791f;stroke:#fde68a}
.pl-svg .rf03-salt text{fill:#fff7ed !important}
.pl-svg .rf03-glow.off2{opacity:.28}
.pl-svg .rf03-bt0{font-size:19px;font-weight:800;fill:#e2e8f0 !important;text-anchor:middle}
.pl-svg .rf03-pill{stroke-width:1.4}
.pl-svg .rf03-pill.ox{fill:#94a3b8;stroke:#e2e8f0}
.pl-svg .rf03-pill.ac{fill:#facc15;stroke:#fef9c3}
.pl-svg .rf03-pill.salt{fill:#b7791f;stroke:#fde68a}
.pl-svg .rf03-pill.h2o{fill:#7dd3fc;stroke:#e0f2fe}
.pl-svg .rf03-pt{font-size:19px;font-weight:800;fill:#111827 !important;stroke:none !important;text-anchor:middle}
.pl-svg .rf03-bt{font-size:19px;font-weight:800;fill:#0b1222 !important;stroke:none !important;text-anchor:middle}
.pl-svg .rf03-dk{font-size:19px;font-weight:800;fill:#0b1222 !important;stroke:none !important}
.pl-svg .rf03-rgt{font-size:21px;font-weight:800;fill:#fca5a5 !important}
.pl-svg .rf03-wt{font-size:21px;font-weight:700;fill:#fcd34d !important}
.pl-svg .rf03-fz1{fill:rgba(74,222,128,.75)}
.pl-svg .rf03-bar{fill:rgba(148,163,184,.55)}
.pl-svg .rf03-baron{fill:#f59e0b}
.pl-svg .rf03-baro2{fill:rgba(248,113,113,.75)}
.pl-svg .rf03-barsel{stroke:#fde68a;stroke-width:3}
.pl-svg .rf03-tbx0{fill:none;stroke:#94a3b8;stroke-width:1.6;stroke-dasharray:6 5}
.pl-svg .rf03-tbx1{fill:#a78bfa}
.pl-svg .rf03-tbx2{fill:#f87171}
.pl-svg .rf03-tbxw{fill:#94a3b8}
.pl-svg .rf03-tbxr{fill:#f59e0b}
.pl-svg .rf03-th{fill:rgba(15,23,42,.9);stroke:rgba(125,211,252,.35);stroke-width:1}
.pl-svg .rf03-tht{font-size:19px;font-weight:800;fill:#7dd3fc !important}
.pl-svg .rf03-tr{fill:rgba(5,10,20,.45);stroke:rgba(148,163,184,.25);stroke-width:1}
.pl-svg .rf03-tron{fill:rgba(245,158,11,.10);stroke:#f59e0b;stroke-width:2.6}
.pl-svg .rf03-td0{font-size:19px;font-weight:800;fill:#e2e8f0 !important}
.pl-svg .rf03-tdon{font-size:19px;font-weight:800;fill:#fcd34d !important}
.pl-svg .rf03-tdc{font-size:19px;font-weight:600;fill:#cbd5e1 !important}
.pl-svg .rf03-tdc.on{fill:#f1f5f9 !important}
.pl-svg .rf03-lbg{fill:rgba(8,15,30,.78)}
.pl-svg .rf03-gl{font-size:19px;font-weight:700;fill:#e2e8f0 !important}
.pl-svg .rf03-hl{paint-order:stroke;stroke:#0b1222;stroke-width:7px;stroke-linejoin:round}
.jc .pl-tag.rf03-cond{background:rgba(45,212,191,.18);color:#5eead4}
.rf03-o2i{fill:#f87171}
.rf03-fai{fill:#4ade80}`
});
})();
