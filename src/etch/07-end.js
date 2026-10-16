/* 시드 식각 07 — 끝점: 언제 멈춰야 할까? (웨이퍼 · 다이) */
(function(){
// 개념 모델 상수 (모두 예시): Cu 시드 두께 (nm), 기준 액 블랭킷 속도 (nm/분), 로딩 계수, 도금 Cu 배수 · 약한 계면 계수 (04장), 국부 산포, 꼬리 σ 배수 (칸 10⁶개)
//  로딩 계수: 베이스 다이(Cu / Ni / Cu / SnAg) 1.0 — 범프 사이 액 교환 + Cu 기둥 · 상부 Cu 옆면이 약품을 함께 씀,
//            코어 다이(Ni / SnAg) 0.5 — 범프에 Cu가 없어 액 교환 몫만 남는다고 둔 이 장의 개념 예시 값 (구조는 plans/stack.md)
const H0 = 300, R0 = 300, LD = 1.0, LDC = 0.5, KP = 1.3, NF = 1.5, SIG = 0.03, NZ = 5;
const TB = H0 / R0 * 60;                                        // 블랭킷 지움 시간 60 s
const MX = 370, MY = 478, MR = 270, PIT = 36, HW = 17;          // 웨이퍼 맵: 중심 · 반지름(= 150 mm) · 다이 피치 · 다이 반 폭 (px)
const CX0 = 800, CX1 = 1520, CY0 = 520, CY1 = 250, CT = 120;    // 지움 곡선: 가로 0~120 s, 세로 0~100 %
const GX0 = 830, GX1 = 1500, GY = 840, GH = 140, GR = 15;       // 단면 그래프: 가로 −150~+150 mm, 세로 ±15 %
const BX0 = 800, BX1 = 1500, BT = 150;                           // 시간 쌓기 막대 0~150 s · 저울 0~100 %
const SX0 = 800, SX1 = 1500;                                     // 반사율 그래프 0~120 s
const DEF = {u: 5, shape: 'center', rp: 0, d: 20, die: 'base', oe: 30, basis: 'blanket'};
// 손대지 않았을 때 단계마다 보여 줄 값 (발표 모드 대비)
const DEMO = {map: {u: 8, d: 0}, load: {d: 30}, time: {}, see: {basis: 'map'}};
// 좁은 세로 화면 전용 확대
const VN_MAP = {x: 30, y: 120, w: 690, h: 700}, VN_BR = {x: 730, y: 590, w: 840, h: 530};
// 다이 15×15: 중심이 반지름 262 px 안이면 그린다. 네 모서리 중 하나라도 웨이퍼 밖이면 가장자리 부분 다이 (169개 중 20개)
const DIES = (() => {
  const o = [];
  for (let i = 0; i < 15; i++) for (let j = 0; j < 15; j++){
    const x = MX + (i - 7) * PIT, y = MY + (j - 7) * PIT, r = Math.hypot(x - MX, y - MY);
    if (r > 262) continue;
    const part = [[-1, -1], [1, -1], [1, 1], [-1, 1]].some(([a, b]) => Math.hypot(x + a * HW - MX, y + b * HW - MY) > MR);
    o.push({x, y, rho: r / MR, part});
  }
  return o;
})();
const f0 = v => String(Math.round(v + 1e-9)), f1 = v => (Math.round(v * 10) / 10).toFixed(1);
const sgn = v => v > 0 ? '+' : v < 0 ? '−' : '';
// 글 폭 어림 (한글 1em, 영문 · 숫자 약 0.56em)
const tw = (s, px) => [...String(s)].reduce((a, ch) => a + (/[ㄱ-힝]/.test(ch) ? 1 : /[A-Za-z0-9 .,:;'()\-+%]/.test(ch) ? 0.56 : 0.9), 0) * px;
// 개념 모델 (기획 07장): h(ρ) = h₀(1 ± u(1 − 2ρ²)), r(ρ) = r₀(1 + a(2ρ² − 1)), 빽빽한 블록 r(1 − L·d) · 외톨이 r
function calc(s){
  const u = s.u / 100, sg = s.shape === 'center' ? 1 : -1, a = s.rp / 100, d = s.d / 100, core = s.die === 'core', L = core ? LDC : LD;
  const hOf = rho => H0 * (1 + sg * u * (1 - 2 * rho * rho));
  const rOf = rho => R0 * (1 + a * (2 * rho * rho - 1));
  const ds = DIES.map(D => { const h = hOf(D.rho), r = rOf(D.rho), dd = D.part ? d / 2 : d; return {D, h, r, tI: h / r * 60, tD: h / (r * (1 - L * dd)) * 60}; });
  let late = ds[0], first = ds[0];
  ds.forEach(o => { if (o.tD > late.tD + 1e-9) late = o; if (o.tI < first.tI - 1e-9) first = o; });
  const tmax = late.tD, tmin = first.tI;
  const tend = s.basis === 'map' ? tmax * (1 + s.oe / 100) : TB * (1 + s.oe / 100);
  const nres = ds.filter(o => o.tD > tend + 1e-9).length, resid = nres / ds.length * 100;
  // 기둥 옆면은 레시피 시간 내내 어디서나 녹는다(04장 s_p = k_p·r·t) — 먼저 지워진 곳에서만 더 자라는 것은 계면 홈(약할 때, 04장 n = f·k_p·r·(t − t₀))
  // 코어 다이는 범프에 Cu가 없어 기둥 옆 · 계면 홈이 없다(04장 코어: s_p = n = 0) — Ni 발 밑 시드 언더컷만 레시피 내내 자란다
  const early = Math.max(0, tend - tmin), side = core ? 0 : NF * KP * first.r / 60 * early;
  const tneed = tmax * (1 + NZ * SIG), need = (tneed / TB - 1) * 100, oeB = (tend / TB - 1) * 100;
  return {core, ds, hOf, rOf, late, first, tmax, tmin, tend, nres, resid, early, side, indie: late.tD - late.tI, tneed, need, oeB};
}
// 다 지워진 다이 비율 (다이마다 지움 시간 ±국부 3 % 사이에서 차례로 지워진다고 보고 부드럽게, 가장자리 부분 다이는 넓이 ½)
function cleared(c, t, key){
  let s = 0, w = 0;
  c.ds.forEach(o => { const tc = o[key], wt = o.D.part ? 0.5 : 1; s += wt * Math.max(0, Math.min(1, (t - tc * (1 - SIG)) / (2 * SIG * tc))); w += wt; });
  return s / w;
}
// 이 모델에서 두께 맵을 정확히 상쇄하는 속도 맵 값 (슬라이더 ±10 % 밖이면 그렇게 적는다)
const wantTxt = w => `${sgn(w)}${f1(Math.abs(w))} %${Math.abs(w) > 10 ? ' — 슬라이더(±10 %) 밖이라 일부만 맞출 수 있음' : ''}`;
const where = rho => rho < 0.35 ? '가운데' : rho > 0.7 ? '가장자리' : '중간 고리';
const TAG = {up: '<span class="pl-tag up">앞 공정</span>', eq: '<span class="pl-tag hw">식각-장비</span>', cond: '<span class="pl-tag et07-cond">식각-조건</span>'};
const tagC = (html, tg) => html.replace(/<label>([^<]*?)\s*<output/, (m, t) => `<label><span>${t} ${TAG[tg]}</span><output`);
const tagS = (html, tg) => html.replace('</span>', ` ${TAG[tg]}</span>`);

(window.EngrEtchChapters = window.EngrEtchChapters || []).push({
  no: '07', id: 'end', part: 3, short: '끝점 · 과식각', scale: '웨이퍼 · 다이',
  title: '끝점 — 언제 멈춰야 할까?',
  hook: '가장 늦은 곳이 시간을 정한다',
  one: '시드는 어디서나 같은 순간에 다 지워지지 않습니다. 시드가 두꺼운 곳, 장비의 식각 속도가 느린 곳, 범프가 빽빽해 액이 잘 안 바뀌는 곳은 늦게 지워집니다. 그래서 \'가장 늦은 곳이 지워지는 시간 + 여유(과식각)\'로 레시피 시간을 정하고, 그동안 먼저 지워진 곳은 밑동 · 계면이 더 오래 깎입니다.',
  ana: '<b>단체 사진 기다리기</b> — 가장 늦게 오는 사람(가장 두껍고 빽빽한 곳)이 올 때까지 기다리는 동안, 먼저 온 사람들은 땡볕에 서 있습니다(먼저 지워진 곳의 밑동 · 계면 깎임). 늦게 오는 사람을 줄이는 것(두께 · 속도 맵 · 흐름 고르게)이 기다림을 줄이는 길입니다. <i>(비유의 한계: 사람과 달리 누가 얼마나 늦을지를 미리 잴 수 있고(시드 두께 맵 · 속도 측정), 다 왔는지는 빛 · 전기로 확인합니다. 또 몇 명이 늦는지가 아니라 \'한 명이라도 안 오면\' 불량입니다.)</i>',
  steps: [
    {id: 'map', viewN: VN_MAP, t: '시드 두께 맵 ÷ 장비 속도 맵', d: 'PVD 시드는 웨이퍼 안에서 보통 몇 % 두께 차이가 있고 고리 무늬가 흔합니다. 장비의 식각 속도도 노즐 · 팔 · 회전에 따라 가운데와 가장자리가 다릅니다. 지움 시간 맵(끝점 맵)은 두께 맵 ÷ 속도 맵이라, 둘을 맞추면 기다림이 줄어듭니다.'},
    {id: 'load', viewN: VN_BR, t: '빽빽한 곳이 늦다 — 로딩', d: '범프가 빽빽한 곳은 범프 사이로 액이 덜 바뀌고, 베이스 다이는 시드와 비슷한 넓이의 Cu 기둥 · 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu) 옆면도 녹아 약품을 빨리 씁니다. 그래서 빽빽한 곳이 늦게 지워집니다(범프에 Cu가 없는 코어 다이는 보통 덜함). 외톨이 범프는 먼저 지워져 밑동이 더 깎입니다.'},
    {id: 'time', viewN: VN_BR, t: '시간 = 가장 늦은 곳 × (1 + 과식각)', d: '레시피 시간은 가장 늦은 곳의 지움 시간에 여유를 더해 정합니다. 블랭킷 웨이퍼의 속도로만 계산하면 두께 · 로딩 차이만큼 잔여가 남을 수 있습니다. 과식각을 늘리면 잔여는 줄고 언더컷은 늘어납니다.'},
    {id: 'see', viewN: VN_BR, t: '다 지워졌는지 보기', d: 'Cu는 붉은 금속빛, Ti는 회색, 다 지우면 보호막 색이 드러납니다. 장비에 따라 반사율(빛) 변화로 끝점을 봅니다. 몇 nm 잔여는 눈에도, 전자 현미경 원소 분석(SEM-EDS)에도 잘 안 잡혀 누설 시험 패턴으로 먼저 보고, 표면 분석(AES · XPS)으로 성분을 확인합니다.'}
  ],
  icon(K){
    const {C, P} = K;
    return C(33, 33, 28, 'f-wafer') + C(33, 33, 22, 'et07-early') + C(33, 33, 12, 'et07-late') + P('M33,33 L33,16 M33,33 L44,38', 'et07-hand');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only} = K;
    let s = '';
    // ── 왼쪽 위: 지움 시간 맵
    s += R(40, 130, 660, 676, 'pl-panel', {rx: 14});
    s += LB(T(60, 166, '지움 시간 맵 — 다이마다 (개념 모델)', 't-acc', 'start') + T(684, 166, `다이 ${DIES.length}개 (예시)`, 't-dim', 'end'));
    s += `<clipPath id="${K.id('et07-wc')}"><circle cx="${MX}" cy="${MY}" r="${MR}"/></clipPath>`;
    s += C(MX, MY, MR, 'f-wafer', tip('웨이퍼 300 mm — 다이 사이 회색 줄은 다이를 자를 길(스크라이브 선)'));
    s += `<g data-v="map"></g>`;
    s += P(`M${MX - 8},${MY + MR + 1} L${MX},${MY + MR - 7} L${MX + 8},${MY + MR + 1} Z`, 'et07-notch', tip('노치 — 웨이퍼 방향 표시'));
    // 네 귀퉁이 범례 (웨이퍼 원 밖)
    // 칸 색 범례 — 밀도 0 이면 render()가 글 · 설명을 '다이 지움 시간'으로 바꾸고 점을 감춘다
    s += G(R(56, 182, 22, 22, 'et07-die', {style: `fill:${K.heat(0.85)}`}) + C(73, 187, 5, 'et07-dot', {style: `fill:${K.heat(0.15)}`}) + LB(T(86, 200, '칸 색 = 빽빽한 블록', 't-dim', 'start')), K.W({class: 'et07-cleg'}, tip('다이 칸의 색 — 그 다이에서 늦은 쪽(빽빽한 블록)의 지움 시간')));
    s += G(C(67, 220, 6, 'et07-dot', {style: `fill:${K.heat(0.15)}`}) + LB(T(86, 227, '점 = 외톨이 범프 옆', 't-dim', 'start')), K.W({class: 'et07-dleg'}, tip('칸 귀퉁이의 점 — 같은 다이의 외톨이 범프 옆 (밀도 0) 지움 시간')));
    s += G(R(662, 182, 22, 22, 'et07-die', {style: `fill:${K.heat(0.9)}`}) + P('M662,201 L681,182 M662,204 L684,182 M665,204 L684,185', 'et07-hatch') + LB(T(652, 200, '빗금 = 잔여', 't-dim', 'end')), tip('빗금 — 레시피 끝에 빽빽한 블록이 아직 덜 지워진 다이 (잔여)'));
    s += G(R(662, 210, 22, 22, 'et07-pd') + LB(T(652, 227, '점선 = 부분 다이', 't-dim', 'end')), tip('가장자리 부분 다이 — 웨이퍼 밖으로 걸쳐 범프가 적다 (밀도 ½, 예시)'));
    s += `<g data-v="leg"></g><g data-v="mapx"></g>`;
    // ── 왼쪽 아래: 결과
    s += R(40, 826, 660, 284, 'pl-panel', {rx: 14}) + `<g data-v="res"></g>`;
    // ── 오른쪽 위: 지움 곡선
    s += R(740, 130, 820, 440, 'pl-panel', {rx: 14});
    s += LB(T(760, 166, '시간에 따라 다 지워진 다이 (%)', 't-acc', 'start'));
    const cx = t => CX0 + t / CT * (CX1 - CX0), cy = f => CY0 - f * (CY0 - CY1);
    [0.25, 0.5, 0.75, 1].forEach(f => { s += L(CX0, cy(f), CX1, cy(f), 's-faint'); });
    s += L(CX0, CY0, CX1, CY0, 's-axis') + L(CX0, CY0, CX0, CY1, 's-axis');
    s += LB(T(CX0 - 8, CY0 + 6, '0', 't-dim', 'end') + T(CX0 - 8, cy(0.5) + 6, '50', 't-dim', 'end') + T(CX0 - 8, CY1 + 6, '100', 't-dim', 'end'));
    [0, 30, 60, 90, 120].forEach(t => { s += L(cx(t), CY0, cx(t), CY0 + 7, 's-axis') + LB(T(cx(t), CY0 + 28, t === 120 ? '120 s' : String(t), 't-dim')); });
    s += `<g data-v="curve"></g>`;
    // ── 오른쪽 아래: 단계마다
    s += R(740, 600, 820, 510, 'pl-panel', {rx: 14});
    s += `<clipPath id="${K.id('et07-gc')}"><rect x="${GX0}" y="${GY - GH}" width="${GX1 - GX0}" height="${2 * GH}"/></clipPath>`;
    // map: 단면 그래프 틀
    let g = LB(T(760, 636, '반지름 방향 단면 — 지움 시간 ∝ 두께 ÷ 속도', 'pl-hdg', 'start'));
    [-10, -5, 5, 10].forEach(v => { g += L(GX0, GY - v / GR * GH, GX1, GY - v / GR * GH, 's-faint'); });
    g += L(GX0, GY - GH, GX0, GY + GH, 's-axis') + L(GX0, GY + GH, GX1, GY + GH, 's-axis') + L(GX0, GY, GX1, GY, 's-dash') + L((GX0 + GX1) / 2, GY - GH, (GX0 + GX1) / 2, GY + GH, 's-faint');
    g += LB(T(GX0 - 8, GY - GH + 6, '+15 %', 't-dim', 'end') + T(GX0 - 8, GY + 6, '0', 't-dim', 'end') + T(GX0 - 8, GY + GH + 6, '−15 %', 't-dim', 'end'));
    g += LB(T(GX0, GY + GH + 28, '−150', 't-dim') + T((GX0 + GX1) / 2, GY + GH + 28, '중심', 't-dim') + T(GX1, GY + GH + 28, '+150 mm', 't-dim'));
    g += LB(T(760, 1100, '시드 면저항 맵 · 도금 두께 맵과 겹쳐 본다 (→ 전해도금 07장)', 't-dim', 'start'));
    s += G(g, only('map'));
    // load: 다이 확대 틀
    g = LB(T(760, 636, '다이 하나 확대 — 빽빽한 블록 vs 외톨이 범프 (위에서 봄)', 'pl-hdg', 'start'));
    g += LB(T(760, 1100, '공개 보고: 빽빽한 패턴 구역은 과식각이 더 필요했다 (묽은 황산 + 과산화수소)', 't-dim', 'start'));
    s += G(g, only('load'));
    // time: 식
    g = LB(T(760, 636, '레시피 시간 = 가장 늦은 곳 × (1 + 여유)', 'pl-hdg', 'start') +
      K.TT(760, 674, ['· 블랭킷 속도만 믿으면 → 두께 · 로딩 차이만큼 잔여', '· 범프 사이 칸이 수십만 개면 평균이 아니라 꼬리(약 5σ)가 시간을 정한다', '· 여유↑ → 잔여↓ · 언더컷↑ (04장)'], 't-sub', 'start', 32));
    s += G(g, only('time'));
    // see: 색 견본 + 반사율 틀
    g = LB(T(760, 636, '다 지워졌는지 보기 — 색 · 빛 · 전기', 'pl-hdg', 'start'));
    const SW = [['et07-sw-cu', 'Cu 시드', '', 'Cu 시드 — 붉은 금속빛 (반사율 높음)'], ['et07-sw-thin', '얇아진 Cu', '', '얇아진 Cu — 어둡고 얼룩져 보인다 (아래 Ti가 비침)'], ['f-ti', '회색 Ti', '', 'Ti — 회색 (Cu 식각액에 거의 안 녹는 멈춤층, 06장에서 지운다)'], ['et07-sw-pas', '보호막', '(재료마다 색이 다름)', '보호막 — 산화막 · 질화막 · 폴리이미드 등. 두께 · 재료에 따라 색이 다르다']];
    SW.forEach(([cl, a, b, tp], i) => { const x = 800 + i * 170; g += R(x, 650, 150, 50, cl, {rx: 6, 'data-tip': tp}) + LB(T(x + 75, 726, a, 't-sub') + (b ? T(x + 75, 750, b, 't-dim') : '')); });
    g += L(SX0, 980, SX1, 980, 's-axis') + L(SX0, 800, SX0, 980, 's-axis');
    [0, 30, 60, 90, 120].forEach(t => { const x = SX0 + t / 120 * (SX1 - SX0); g += L(x, 980, x, 987, 's-axis') + LB(T(x, 1006, t === 120 ? '120 s' : String(t), 't-dim')); });
    g += LB(T(760, 788, '반사율 — 웨이퍼 평균 (개념)', 't-dim', 'start'));
    g += LB(T(760, 1094, '몇 nm 잔여는 눈 · SEM-EDS로 잘 안 잡힌다 → 누설 시험 · AES · XPS', 't-warn', 'start'));
    s += G(g, only('see'));
    s += `<g data-v="br"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w et07-w"><div class="hd">직접 해 보기 — 언제 멈출까</div>
      ${tagC(K.ctl('u', '시드 두께 산포 (±)', 0, 15, 0.5, 5), 'up')}
      ${tagS(K.seg('shape', [['center', '가운데 두꺼움'], ['edge', '가장자리 두꺼움']], 'center', '두께 맵'), 'up')}
      ${tagC(K.ctl('rp', '장비 속도 맵 (− 가운데 · + 가장자리 빠름)', -10, 10, 0.5, 0), 'eq')}
      ${tagC(K.ctl('d', '빽빽한 블록 밀도 (블록 넓이 중 범프)', 0, 50, 1, 20), 'up')}
      ${tagS(K.seg('die', [['base', '베이스 — Cu / Ni / Cu / SnAg'], ['core', '코어 — Ni / SnAg']], 'base', '다이'), 'up')}
      ${tagC(K.ctl('oe', '과식각', 0, 100, 5, 30), 'cond')}
      ${K.seg('basis', [['blanket', '블랭킷 계산'], ['map', '패턴 맵 확인']], 'blanket', '시간 기준')}
      ${K.kpis([['레시피 시간', 'k-t', '<span data-o="k-tb">블랭킷 60 s × 1.30</span>'], ['잔여 다이', 'k-r', '레시피 끝에 덜 지워짐'], ['먼저 지워진 곳', 'k-e', '과식각 · <span data-o="k-sn">계면 홈(약할 때)</span> <span data-o="k-side">–</span>'], ['다이 안 차이', 'k-i', '빽빽한 블록 − 외톨이'], ['필요한 과식각', 'k-n', '블랭킷 기준 · 칸 10⁶개 5σ']])}
      <p class="pl-msg et07-msg" data-o="msg"></p>
      ${K.model('시드 두께 h(ρ) = 300 nm × (1 ± u(1 − 2ρ²)), 장비 속도 r(ρ) = 300 nm/분 × (1 + a(2ρ² − 1)) (기준 액 · 블랭킷, ρ = 반지름 ÷ 150 mm). 다이마다 두 점 — 빽빽한 블록은 r × (1 − L × 밀도)(로딩 계수 L: 베이스 다이 1 · 코어 다이 0.5 — 범프에 Cu가 없어 옆면이 약품을 안 쓴다고 둔 예시, 가장자리 부분 다이는 밀도 ½), 외톨이 범프 옆은 r. 칸 색은 빽빽한 블록의 지움 시간입니다. 레시피 = 60 s × (1 + 과식각)(블랭킷 계산) 또는 가장 늦은 곳 × (1 + 과식각)(패턴 맵 확인). 기둥 옆면은 레시피 시간 내내 어디서나 녹으므로(04장) 먼저 지워진 곳에서 더 자라는 것만 셉니다 — 계면 홈(계면이 약할 때) = 1.5 × 1.3 × 그 자리 속도 × 먼저 지워진 곳의 과식각 시간(04장 식) — 코어 다이는 범프에 Cu가 없어 0(Ni 발 밑 시드 언더컷은 레시피 내내 자란다). 필요한 과식각 = 가장 늦은 곳 × (1 + 5 × 3 %) ÷ 60 s − 1 (국부 산포 3 % · 칸 10⁶개 → 약 5σ). 모든 상수는 예시이고, 실제 맵은 블랭킷 · 패턴 웨이퍼 측정으로 확인합니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, TT, G, LB, tip, only} = K;
    const st = Object.assign({}, DEF);
    let touched = false;
    const IDS = ['u', 'rp', 'd', 'oe'];
    const FMT = {u: v => `±${(+v).toFixed(1)} %`, rp: v => `${sgn(v)}${Math.abs(v).toFixed(1)} %`, d: v => `${v} %`, oe: v => `${v} %`};
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const put = (sel, html) => { const e = ctx.$(sel); if (e) e.innerHTML = html; };
    const cx = t => CX0 + K.clamp(t / CT) * (CX1 - CX0), cy = f => CY0 - f * (CY0 - CY1);
    const kls = (id, cls) => { const e = ctx.card.querySelector(`[data-o="${id}"]`); if (!e) return; const p = e.closest('.kpi'); ['ok', 'warn', 'ng'].forEach(k => p.classList.toggle(k, k === cls)); };
    function render(){
      const c = calc(st);
      const lo = c.tmin, hi = Math.max(c.tmax, c.tmin + 6), hv = t => K.heat((t - lo) / (hi - lo));
      // ── 웨이퍼 맵
      let mp = '', pp = '';
      c.ds.forEach(o => {
        const D = o.D, res = o.tD > c.tend + 1e-9, x0 = D.x - HW, y0 = D.y - HW;
        let g = R(x0, y0, 2 * HW, 2 * HW, 'et07-die', {style: `fill:${hv(o.tD)}`});
        if (res) g += P(`M${x0},${D.y + 3} L${D.x + 3},${y0} M${x0},${y0 + 2 * HW} L${x0 + 2 * HW},${y0} M${D.x - 3},${y0 + 2 * HW} L${x0 + 2 * HW},${D.y - 3}`, 'et07-hatch');
        if (D.part) g += R(x0 + 1, y0 + 1, 2 * HW - 2, 2 * HW - 2, 'et07-pd');
        if (st.d > 0) g += C(D.x + 9, D.y - 9, 5, 'et07-dot', {style: `fill:${hv(o.tI)}`});
        const tp = `다이 — 중심에서 ${f0(D.rho * 150)} mm${D.part ? ' · 가장자리 부분 다이 (범프가 적어 밀도 ½)' : ''}\n시드 ${f0(o.h)} nm · 장비 속도 ${f0(o.r)} nm/분\n빽빽한 블록 ${f1(o.tD)} s · 외톨이 범프 옆 ${f1(o.tI)} s` + (res ? `\n레시피 끝(${f0(c.tend)} s)에 아직 남음 — 잔여` : '');
        if (D.part) pp += G(g, tip(tp)); else mp += G(g, tip(tp));
      });
      put('[data-v="map"]', mp + G(pp, {'clip-path': K.url('et07-wc')}));
      const dl = ctx.$('.et07-dleg'); if (dl) dl.classList.toggle('hide', !(st.d > 0));   // 밀도 0 이면 점이 없다
      const cl = ctx.$('.et07-cleg');   // 밀도 0 이면 빽빽한 블록이 없다 — 칸 색은 그 다이의 지움 시간(두께 ÷ 속도)
      if (cl){
        const tx = cl.querySelector('text'), dt = cl.querySelector('circle');
        if (tx) tx.textContent = st.d > 0 ? '칸 색 = 빽빽한 블록' : '칸 색 = 다이 지움 시간';
        if (dt) dt.classList.toggle('hide', !(st.d > 0));
        cl.setAttribute('data-tip', st.d > 0 ? '다이 칸의 색 — 그 다이에서 늦은 쪽(빽빽한 블록)의 지움 시간' : '다이 칸의 색 — 그 다이의 지움 시간 (밀도 0 % — 두께 ÷ 속도만으로 정해짐)');
      }
      // 색 막대 (먼저 → 늦게)
      let lg = '';
      for (let k = 0; k < 54; k++) lg += R(100 + k * 10, 760, 10.5, 13, 'et07-die', {style: `fill:${K.heat(k / 53)}`});
      lg += LB(T(100, 798, `${f0(lo)} s · 먼저 지워짐 (과식각 오래 받음)`, 't-dim', 'start') + T(640, 798, `늦게 지워짐 · ${f0(hi)} s`, 't-dim', 'end'));
      put('[data-v="leg"]', G(lg, tip('칸 색 = 지움 시간. 파랑 = 먼저 지워져 과식각을 오래 받는 곳(밑동 · 계면이 더 파임), 빨강 = 가장 늦게 지워지는 곳')));
      // 단계별 맵 위 표시: 가장 늦은 다이 · 가장 이른 다이
      const lt = c.late.D, ft = c.first.D;
      let mx = G(R(lt.x - HW - 5, lt.y - HW - 5, 2 * HW + 10, 2 * HW + 10, 'et07-ring', {rx: 4}) + P(`M${lt.x + HW + 5},${lt.y} L726,760`, 'et07-lead'), K.W(only('load'), tip('가장 늦은 다이 — 오른쪽 아래에 확대')));
      mx += G(R(lt.x - HW - 5, lt.y - HW - 5, 2 * HW + 10, 2 * HW + 10, 'et07-ring', {rx: 4}) + R(ft.x - HW - 5, ft.y - HW - 5, 2 * HW + 10, 2 * HW + 10, 'et07-ring2', {rx: 4}), K.W(only('time see'), tip(`노란 테두리 = 가장 늦은 다이 (${f1(c.tmax)} s)\n파란 테두리 = 외톨이 범프 옆이 가장 먼저 지워지는 다이 (${f1(c.tmin)} s)`)));
      mx += G(L(MX - MR + 8, MY, MX + MR - 8, MY, 'et07-cut') + P(`M${MX + MR - 8},${MY - 7} L${MX + MR + 6},${MY} L${MX + MR - 8},${MY + 7}`, 'et07-cut'), K.W(only('map'), tip('단면 자리 — 이 선을 따라 본 두께 · 속도 · 지움 시간이 오른쪽 아래 그래프')));
      put('[data-v="mapx"]', mx);
      // ── 결과 표
      const oeTxt = (1 + st.oe / 100).toFixed(2);
      const rows = [
        [`레시피 시간 (${st.basis === 'map' ? `가장 늦은 곳 ${f1(c.tmax)} s` : `블랭킷 ${TB} s`} × ${oeTxt})`, `${f0(c.tend)} s`, 'time see', ''],
        ['가장 늦은 곳 · 잔여 다이', `${f1(c.tmax)} s · ${f0(c.resid)} %`, 'map time', c.nres ? ' et07-ngt' : ''],
        c.core ? ['먼저 지워진 곳 과식각 (계면 홈 없음 · 코어)', `${f0(c.early)} s`, 'see', ''] : ['먼저 지워진 곳 과식각 → 계면 홈 (약할 때)', `${f0(c.early)} s → +${f0(c.side)} nm`, 'see', ''],
        ['다이 안 차이 (빽빽한 블록 − 외톨이)', `${f0(c.indie)} s`, 'load', ''],
        ['필요한 과식각 (칸 10⁶개 · 5σ)', `${f0(c.need)} %`, 'time', c.oeB + 0.5 < c.need ? ' et07-wnt' : '']
      ];
      let rs = LB(T(60, 862, `결과 — 시간 기준: ${st.basis === 'map' ? '패턴 맵 확인' : '블랭킷 계산'}`, 't-acc', 'start'));
      rows.forEach(([nm, v, sids, vc], i) => {
        const y = 904 + i * 40;
        rs += G(R(50, y - 28, 640, 38, 'et07-row', {rx: 8}), only(sids));
        rs += LB(T(64, y, nm, 't-sub', 'start') + T(684, y, v, 'pl-val' + vc, 'end'));
        if (i < 4) rs += L(56, y + 12, 684, y + 12, 's-faint');
      });
      put('[data-v="res"]', rs);
      // ── 지움 곡선
      const path = key => { let d = ''; for (let t = 0; t <= CT + 1e-9; t += 0.5) d += (d ? ' L' : 'M') + cx(t).toFixed(1) + ',' + cy(cleared(c, t, key)).toFixed(1); return d; };
      let cv = '';
      if (c.tend > c.tmin + 0.5){
        cv += R(cx(c.tmin), CY1, cx(c.tend) - cx(c.tmin), CY0 - CY1, 'et07-band', tip(c.core ? '먼저 지워진 곳(외톨이 범프 옆)이 레시피 끝까지 과식각을 받는 시간 — Ni 발 밑 시드가 바닥 구석까지 파이고 Ti가 산화제에 닿는다.\n코어 다이는 범프에 Cu가 없어 기둥 옆 · 계면 홈이 없다 (04장)' : '먼저 지워진 곳(외톨이 범프 옆)이 레시피 끝까지 과식각을 받는 시간 — 밑동 발이 사라진 뒤 밑동 · 계면 홈이 더 파이고 Ti가 산화제에 닿는다.\n기둥 옆면은 이 시간과 상관없이 레시피 내내 어디서나 녹는다 (04장)'));
        const xa = cx(c.tmin), xb = cx(c.tend);
        cv += P(`M${xa.toFixed(1)},228 L${xa.toFixed(1)},242 M${xa.toFixed(1)},235 L${xb.toFixed(1)},235 M${xb.toFixed(1)},228 L${xb.toFixed(1)},242`, 'et07-brk');
        cv += LB(T(xa - 10, 242, `먼저 지워진 곳 과식각 ${f0(c.early)} s`, 't-warn', 'end'));
      }
      // 세로선: 블랭킷 계산 · 레시피 끝 · 가장 늦은 곳
      const vline = (t, cls) => L(cx(t), CY1, cx(t), CY0, cls) + (t > CT ? P(`M${CX1 - 12},${CY1 + 8} L${CX1},${CY1 + 16} L${CX1 - 12},${CY1 + 24}`, 'et07-over') : '');
      cv += vline(TB, 's-dash') + vline(c.tmax, 's-curve2') + vline(c.tend, 'pl-peak');
      cv += P(path('tI'), 'et07-iso', tip('외톨이 범프 옆이 지워진 다이 비율 — 먼저 지워진다'));
      cv += P(path('tD'), 's-curve', tip('다이가 다 지워진 비율 — 그 다이의 빽빽한 블록까지 지워져야 다 지워진 것'));
      // 범례 (위 한 줄)
      let x = 762;
      [['s-dash', `블랭킷 계산 ${TB} s`], ['pl-peak', `레시피 끝 ${f0(c.tend)} s`], ['s-curve2', `가장 늦은 곳 ${f0(c.tmax)} s`]].forEach(([cl, t]) => { cv += L(x, 198, x + 28, 198, cl) + LB(T(x + 36, 205, t, 't-sub', 'start')); x += 36 + tw(t, 21) + 26; });
      cv += L(816, 290, 846, 290, 's-curve') + LB(T(854, 297, '다이가 다 지워짐 (빽빽한 블록까지)', 't-dim', 'start'));
      cv += L(816, 320, 846, 320, 'et07-iso') + LB(T(854, 327, '외톨이 범프 옆이 지워짐', 't-dim', 'start'));
      if (c.nres){
        const fe = cleared(c, c.tend, 'tD');
        cv += C(cx(c.tend), cy(fe), 7, 'k-ng') + LB(T(816, 368, `레시피 끝에 잔여 다이 ${f0(c.resid)} %`, 'pl-warn', 'start'));
      } else cv += LB(T(816, 368, '레시피 끝에 잔여 없음', 'et07-okt', 'start'));
      put('[data-v="curve"]', cv);
      // ── 오른쪽 아래 (단계마다)
      let br = '';
      // map: 반지름 방향 단면 — 두께 · 속도 · 지움 시간 (외톨이 기준)
      {
        const gx = mm => GX0 + (mm + 150) / 300 * (GX1 - GX0), gy = v => GY - (v - 1) * 100 / GR * GH;
        const line = fn => { let d = ''; for (let mm = -150; mm <= 150; mm += 3){ const rho = Math.abs(mm) / 150; d += (d ? ' L' : 'M') + gx(mm).toFixed(1) + ',' + gy(fn(rho)).toFixed(1); } return d; };
        let g = '';
        let xl = 760;
        [['s-curve', '시드 두께', '[앞 공정]'], ['s-curve2', '식각 속도', '[식각-장비]'], ['et07-tl', '지움 시간', '']].forEach(([cl, a, b]) => { g += L(xl + 4, 662, xl + 30, 662, cl) + LB(T(xl + 42, 669, (a + ' ' + b).trim(), 't-sub', 'start')); xl += 42 + tw(a + ' ' + b, 21) + 26; });
        g += G(P(line(rho => c.hOf(rho) / c.rOf(rho) * R0 / H0), 'et07-tl', tip('지움 시간 ∝ 두께 ÷ 속도 (외톨이 범프 옆 기준, 블랭킷 60 s = 0)')) + P(line(rho => c.hOf(rho) / H0), 's-curve', tip('시드 두께 h ÷ 300 nm — PVD(앞 공정)가 정한다')) + P(line(rho => c.rOf(rho) / R0), 's-curve2', tip('장비 식각 속도 r ÷ 300 nm/분 — 노즐 · 팔 · 회전 · 유량(식각-장비)')), {'clip-path': K.url('et07-gc')});
        let tmn = 9, tmx = -9;
        for (let k = 0; k <= 50; k++){ const rho = k / 50, v = c.hOf(rho) / c.rOf(rho) * R0 / H0; tmn = Math.min(tmn, v); tmx = Math.max(tmx, v); }
        const spread = (tmx - tmn) * 100;
        const shp = st.shape === 'center' ? '가운데 두꺼움' : '가장자리 두꺼움';
        g += LB(T(760, 1042, `두께 맵(${st.u === 0 ? '고름' : shp + ' ±' + f1(st.u) + ' %'}) ÷ 속도 맵(${sgn(st.rp)}${f1(Math.abs(st.rp))} %) → 지움 시간 차이 ${f1(spread)} %`, 't-sub', 'start'));
        const want = st.shape === 'center' ? -st.u : st.u, now = `지금 ${sgn(st.rp)}${f1(Math.abs(st.rp))} %`;
        const hint = st.u === 0 && st.rp === 0 ? '두께 · 속도 모두 고르다 — 지움 시간이 평평합니다'
          : spread < 0.6 ? '속도 맵이 두께 맵을 상쇄 — 지움 시간이 평평합니다'
          : st.u === 0 ? `두께가 고르니 속도 맵도 0 %(고르게)로 맞춘다 — ${now}`
          : `맞추려면 속도 맵 ${sgn(want)}${f1(Math.abs(want))} % (${want < 0 ? '가운데' : '가장자리'} 빠르게) — ${now}${Math.abs(want) > 10 ? ' (슬라이더 ±10 %)' : ''}`;
        g += LB(T(760, 1072, hint, spread < 0.6 ? 'et07-okt' : 't-warn', 'start'));
        br += G(g, only('map'));
      }
      // load: 다이 확대 — 빽빽한 블록 vs 외톨이 범프. 범프 크기(지름 25 µm)는 그대로, 밀도가 높을수록 간격이 좁다: 피치 = D·√(π / 4d)
      {
        const d = st.d / 100, rb = 11, BCX = 950, BCY = 800, S = 216;
        const rr = K.rng(7);
        let g = '';
        if (d > 0) g += K.E(BCX, BCY, 160, 128, 'et07-cloud', K.W({style: `opacity:${K.clamp(0.3 + d * 2.4, 0.3, 1).toFixed(2)}`}, tip(c.core ? '산화제 · 산이 모자란 곳 — 범프 사이로 액이 덜 바뀐다.\n코어 다이는 범프에 Cu가 없어 옆면이 약품을 쓰지 않는다 — 로딩이 약하다 (예시 L 0.5)' : '산화제 · 산이 모자란 곳 — 범프 사이로 액이 덜 바뀌고 Cu 기둥 · 상부 Cu 옆면도 함께 녹아 약품을 빨리 쓴다 (베이스 다이).\n녹은 Cu²⁺가 길을 막는 것은 아니다 (잘 녹아 있다)')));
        g += P('M770,690 C860,640 1040,640 1130,690', 's-flow') + P('M770,910 C860,948 1040,948 1130,910', 's-flow') + P(`M770,${BCY} L1130,${BCY}`, 's-flow et07-weak');
        // 블록 안 범프 자리 (블록 넓이 S×S 는 그대로, 밀도에 따라 개수가 바뀐다)
        const bp = [];
        if (d > 0){
          const pitch = rb * Math.sqrt(Math.PI / d), n = Math.max(1, Math.floor((S - 2 * rb) / pitch) + 1), o = (n - 1) * pitch / 2;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) bp.push([BCX - o + i * pitch, BCY - o + j * pitch]);
        }
        // 약품 분자: 블록 안은 드물게 (범프와 겹치지 않는 자리)
        const nIn = Math.max(1, Math.round(10 * (1 - 1.5 * d)));
        for (let k = 0, tries = 0; k < nIn && tries < 400; tries++){
          const x = BCX - S / 2 + 8 + rr() * (S - 16), y = BCY - S / 2 + 8 + rr() * (S - 16);
          if (bp.some(([bx, by]) => Math.hypot(x - bx, y - by) < rb + 7) || (!bp.length && Math.abs(y - BCY) < 24 && Math.abs(x - BCX) < 100)) continue;
          g += C(x, y, 5, 'et07-mol'); k++;
        }
        if (d > 0){
          let bl = R(BCX - S / 2, BCY - S / 2, S, S, 'et07-blk', {rx: 10});
          bp.forEach(([x, y]) => { bl += C(x, y, rb, 'f-sn2'); });
          g += G(bl, tip(`빽빽한 블록 — 블록 넓이의 ${st.d} %가 범프\n범프 크기는 같고 간격이 좁다 (위에서 보면 SnAg 모자)`));
        } else g += R(BCX - S / 2, BCY - S / 2, S, S, 'pl-ghost', K.W({rx: 10}, tip('빽빽한 블록 없음 (밀도 0 %)'))) + LB(T(BCX, BCY + 8, '블록 없음 (밀도 0 %)', 't-dim'));
        // 외톨이 범프
        const IX = 1360, IY = 800;
        g += P(`M1170,${IY - 70} L1540,${IY - 70}`, 's-flow') + P(`M1170,${IY + 70} L1540,${IY + 70}`, 's-flow') + P(`M1170,${IY} L1300,${IY}`, 's-flow');
        const ri = K.rng(11);
        for (let k = 0; k < 14; k++){ const a = ri() * Math.PI * 2, r = 34 + ri() * 60; g += C(IX + Math.cos(a) * r * 1.5, IY + Math.sin(a) * r * 0.9, 5, 'et07-mol'); }
        g += C(IX, IY, rb, 'f-sn2', tip('외톨이 범프 — 둘레에 새 액이 잘 온다 (범프 크기는 블록 안과 같다)'));
        // 값 · 설명
        const L0 = c.late;
        g += LB(T(BCX, 976, d > 0 ? `빽빽한 블록 — ${f1(L0.tD)} s` : `블록 없음 — ${f1(L0.tD)} s`, 't-warn') + T(IX, 976, `외톨이 범프 옆 — ${f1(L0.tI)} s`, 't-acc'));
        g += LB(TT(BCX, 1010, d <= 0 ? ['밀도 0 % — 로딩이 없어', '외톨이와 같은 때 지워짐'] : c.core ? ['액이 덜 바뀜 (범프에 Cu 없음)', '로딩이 약함 → 조금 늦게 지워짐'] : ['액이 덜 바뀌고 Cu 옆면도 녹아', '약품을 빨리 씀 → 늦게 지워짐'], 't-sub', 'middle', 30) + TT(IX, 1010, ['로딩이 없어 빨리 녹고 먼저 지워짐', c.core ? '→ Ni 발 밑 언더컷 ↑' : '→ 기둥 옆 · 밑동 깎임 ↑'], 't-sub', 'middle', 30));
        g += LB(T(1540, 702, c.core ? '코어 다이 (Ni / SnAg)' : '베이스 다이 (Cu / Ni / Cu / SnAg)', 't-dim', 'end'));
        g += G(C(1170, 662, 6, 'et07-mol') + LB(T(1184, 669, '산화제 · 산 (H₂O₂ · H⁺)', 't-dim', 'start')), tip('식각액의 산화제(과산화수소)와 산 — 녹이는 데 쓰인다'));
        br += G(g, only('load'));
      }
      // time: 필요한 시간 쌓기 + 여유의 저울
      {
        const bx = t => BX0 + K.clamp(t / BT) * (BX1 - BX0);
        let g = LB(T(760, 786, `필요한 시간 쌓기 (0 ~ ${BT} s)`, 't-dim', 'start'));
        g += R(bx(0), 798, bx(TB) - bx(0), 28, 'et07-sb', tip(`블랭킷 계산 ${TB} s — 시드 ${H0} nm ÷ ${R0} nm/분`));
        if (c.tmax > TB) g += R(bx(TB), 798, bx(c.tmax) - bx(TB), 28, 'et07-sm', tip(`두께 · 속도 맵 · 로딩 +${f1(c.tmax - TB)} s — 가장 늦은 곳 ${f1(c.tmax)} s`));
        g += R(bx(Math.max(TB, c.tmax)), 798, bx(c.tneed) - bx(Math.max(TB, c.tmax)), 28, 'et07-st', tip(`꼬리 5σ +${f1(c.tneed - Math.max(TB, c.tmax))} s — 국부 산포 3 % × 5 (칸 10⁶개)`));
        g += R(BX0, 798, BX1 - BX0, 28, 'et07-bar');
        if (c.tneed > BT) g += P(`M${BX1 + 4},804 L${BX1 + 16},812 L${BX1 + 4},820`, 'et07-over');
        const xr = bx(c.tend), rgt = xr > 1330;
        g += P(`M${xr.toFixed(1)},828 L${(xr - 9).toFixed(1)},846 L${(xr + 9).toFixed(1)},846 Z`, 'et07-mk') + LB(T(rgt ? xr - 14 : xr + 14, 864, `레시피 ${f0(c.tend)} s`, 't-warn', rgt ? 'end' : 'start'));
        let xl = 760;
        const leg = (cl, t, y) => { g += R(xl, y - 15, 18, 18, cl) + LB(T(xl + 26, y, t, 't-sub', 'start')); xl += 26 + tw(t, 21) + 26; };
        leg('et07-sb', `블랭킷 계산 ${TB} s`, 900);
        leg('et07-sm', `두께 · 속도 맵 · 로딩 +${f0(Math.max(0, c.tmax - TB))} s`, 900);
        xl = 760;
        leg('et07-st', `꼬리 5σ +${f0(c.tneed - Math.max(TB, c.tmax))} s`, 932);
        g += LB(T(xl, 932, `= 필요 ${f0(c.tneed)} s (과식각 ${f0(c.need)} %)`, 't-warn', 'start'));
        // 저울: 과식각 0~100 % (블랭킷 기준)
        const ox = v => BX0 + K.clamp(v / 100) * (BX1 - BX0), xn = ox(c.need), xo = ox(c.oeB);
        g += LB(T(BX0, 974, '← 잔여 위험', 't-dim', 'start') + T((BX0 + BX1) / 2, 974, '과식각 (블랭킷 기준 0 ~ 100 %)', 't-dim') + T(BX1, 974, '언더컷 ↑ →', 't-dim', 'end'));
        g += R(BX0, 984, xn - BX0, 24, 'et07-zr', tip('이보다 짧으면 꼬리(가장 늦은 칸)가 남을 수 있다')) + R(xn, 984, BX1 - xn, 24, 'et07-zu', tip(c.core ? '이보다 길면 잔여는 없지만 Ni 발 밑 언더컷이 늘어난다 (코어 다이, 04장)' : '이보다 길면 잔여는 없지만 기둥 옆 · 밑동 깎임(언더컷)이 늘어난다 — 먼저 지워진 곳일수록 더 (04장)')) + R(BX0, 984, BX1 - BX0, 24, 'et07-bar');
        // 필요 · 지금 표시가 가까우면 글을 서로 반대쪽으로 비켜 놓는다 (겹침 방지: 왼쪽 표시의 글은 왼쪽으로, 오른쪽 표시의 글은 오른쪽으로)
        const tN = c.need > 100 ? `필요 ${f0(c.need)} % →` : `필요 ${f0(c.need)} %`, tO = `지금 ${f0(c.oeB)} %`;
        let nx = K.clamp(xn, 850, 1450), na = 'middle', ox2 = K.clamp(xo, 850, 1450), oa = 'middle';
        if (Math.abs(xn - xo) < 120){
          const nl = xn <= xo, wl = nl ? tw(tN, 19) : tw(tO, 23), wr = nl ? tw(tO, 23) : tw(tN, 19);
          let xl = Math.max(Math.min(xn, xo) + 6, 776 + wl), xr = Math.min(Math.max(xn, xo) - 6, 1540 - wr);
          if (xr < xl + 12){ if (xr < 1540 - wr - 1) xr = xl + 12; else xl = xr - 12; }
          if (nl){ nx = xl; na = 'end'; ox2 = xr; oa = 'start'; } else { ox2 = xl; oa = 'end'; nx = xr; na = 'start'; }
        }
        g += L(xn, 978, xn, 1014, 'et07-need') + LB(T(nx, 1034, tN, 'pl-pkt', na));
        g += P(`M${xo.toFixed(1)},1010 L${(xo - 9).toFixed(1)},1026 L${(xo + 9).toFixed(1)},1026 Z`, 'et07-mk');
        g += LB(T(ox2, 1058, tO, 't-warn', oa));
        g += LB(T(760, 1096, `→ 잔여 다이 ${f0(c.resid)} % · 먼저 지워진 곳 과식각 ${f0(c.early)} s ` + (c.core ? '(코어: Ni 발 밑 언더컷 쪽)' : `(약한 계면 홈 +${f0(c.side)} nm)`), c.nres ? 'pl-warn' : 't-sub', 'start'));
        br += G(g, only('time'));
      }
      // see: 반사율 (웨이퍼 평균, 개념) — 외톨이 쪽 · 빽빽한 블록 쪽이 지워지는 대로 떨어진다
      {
        const sx = t => SX0 + K.clamp(t / 120) * (SX1 - SX0), YH = 824, YL = 952;
        const sig = t => 1 - 0.5 * (cleared(c, t, 'tI') + cleared(c, t, 'tD'));
        let d = '', tep = 120;
        for (let t = 0; t <= 120 + 1e-9; t += 0.5){ const v = sig(t); d += (d ? ' L' : 'M') + sx(t).toFixed(1) + ',' + (YL - v * (YL - YH)).toFixed(1); if (v <= 0.005 && tep === 120) tep = t; }
        let g = P(d, 's-curve', tip('반사율 (웨이퍼 평균, 개념) — Cu가 지워지는 대로 떨어지고, 다 지워지면 Ti 수준에서 평평해진다'));
        g += LB(T(SX0 + 10, YH - 10, 'Cu (높음)', 't-dim', 'start') + T(SX1 - 4, YL + 22, 'Ti (낮음)', 't-dim', 'end'));
        const xe = sx(tep);
        g += P(`M${xe.toFixed(1)},${YL - 8} L${(xe - 9).toFixed(1)},${YL - 24} L${(xe + 9).toFixed(1)},${YL - 24} Z`, 'et07-mk');
        const el = `▼ 끝점 ${f0(tep)} s`, ew = tw(el, 23);
        g += P(`M${(812 + ew + 8).toFixed(1)},${YH + 66} L${xe.toFixed(1)},${YL - 28}`, 's-lead') + LB(T(812, YH + 74, el, 't-warn', 'start') + T(812, YH + 102, '반사율이 더 안 바뀌는 때', 't-dim', 'start'));
        const xr = sx(c.tend), rgt = xr > 1330;
        g += L(xr, 800, xr, 980, 'pl-peak') + LB(T(rgt ? xr - 8 : xr + 8, 812, `레시피 끝 ${f0(c.tend)} s`, 'pl-pkt', rgt ? 'end' : 'start'));
        // 화면에 보이는 반올림 값끼리 뺀다 (102 s − 81 s = 21 s). 끝점 뒤 시간은 '끝점 + 과식각 %' 레시피로 읽으면 몇 %인지 함께
        const tE = Math.round(c.tend + 1e-9), tP = Math.round(tep + 1e-9), gap = tE - tP, gpc = tP > 0 ? gap / tP * 100 : 0;
        g += LB(T(760, 1046, gap >= 0 ? `레시피가 끝점보다 ${gap} s 길다 (끝점 + ${f0(gpc)} %) → 잔여 없음` : `레시피가 끝점보다 ${-gap} s 이르다 → 잔여 다이 ${f0(c.resid)} %`, gap >= 0 ? 't-sub' : 'pl-warn', 'start'));
        br += G(g, only('see'));
      }
      put('[data-v="br"]', br);
      ctx.refresh();
      // ── KPI · 설명
      ctx.out('k-t', `${f0(c.tend)} s`);
      ctx.out('k-tb', st.basis === 'map' ? `가장 늦은 곳 ${f1(c.tmax)} s × ${oeTxt}` : `블랭킷 ${TB} s × ${oeTxt}`);
      ctx.out('k-r', `${f0(c.resid)} %`); kls('k-r', c.nres ? 'ng' : 'ok');
      ctx.out('k-e', `${f0(c.early)} s`); ctx.out('k-sn', c.core ? '계면 홈 없음 (코어)' : '계면 홈(약할 때)'); ctx.out('k-side', c.core ? '' : `+${f0(c.side)} nm`);
      ctx.out('k-i', `${f0(c.indie)} s`);
      ctx.out('k-n', `${f0(c.need)} %`); kls('k-n', c.oeB + 0.5 >= c.need ? 'ok' : 'warn');
      let tmn = 9, tmx = -9;
      for (let k = 0; k <= 50; k++){ const v = c.hOf(k / 50) / c.rOf(k / 50); tmn = Math.min(tmn, v); tmx = Math.max(tmx, v); }
      const flat = (tmx - tmn) / (H0 / R0) * 100 < 0.6 && st.u > 0;
      const want = st.shape === 'center' ? -st.u : st.u, over = st.u > 0 && Math.sign(st.rp) === Math.sign(want) && Math.abs(st.rp) > Math.abs(want) + 0.5;
      const lateAt = where(c.late.D.rho), tail = c.oeB + 0.5 < c.need;
      const dir = over ? `속도 맵이 두께 맵보다 더 기울어(과보정) 이번에는 ${lateAt} 쪽이 늦습니다 — 이 모델에서 맞는 값은 ${wantTxt(want)}입니다.`
        : st.u === 0 ? `두께는 고른데 속도 맵(${sgn(st.rp)}${f1(Math.abs(st.rp))} %)이 기울어 ${lateAt} 쪽이 늦습니다 — 과식각을 늘리기 전에 속도 맵을 고르게(0 %) 맞춥니다.`
        : `과식각을 늘리기 전에 속도 맵을 시드 맵에 맞추거나(${want < 0 ? '가운데' : '가장자리'} 빠르게, 이 모델에서 ${wantTxt(want)}), 두께 · 밀도 차이를 줄일 수 있는지 봅니다.`;
      const m = ctx.q('[data-o="msg"]');
      if (!m) return;
      if (c.nres) m.innerHTML = `<b>블랭킷 계산 ${st.oe} %로는 ${lateAt} 쪽 다이 ${f0(c.resid)} %의 빽빽한 블록이 덜 지워집니다</b> — 필요한 과식각 약 ${f0(c.need)} %. ` + (flat ? '속도 맵은 이미 두께 맵을 상쇄했습니다 — 남은 차이는 로딩(빽빽한 블록)과 국부 산포입니다.' : st.u === 0 && st.rp === 0 ? '두께 · 속도 맵은 고릅니다 — 남은 차이는 로딩(빽빽한 블록)과 국부 산포입니다. 밀도를 고르게(더미 범프) 하거나 흐름을 세게 하는 것이 먼저입니다.' : dir);
      else if (flat) m.innerHTML = `<b>속도 맵이 두께 맵을 상쇄했습니다.</b> ${c.indie >= 0.5 ? `남은 차이는 로딩(빽빽한 블록 +${f0(c.indie)} s)과 국부 산포입니다` : '남은 것은 국부 산포뿐입니다'} — 필요한 과식각 약 ${f0(c.need)} %(블랭킷 기준 · 지금 ${f0(c.oeB)} %${tail ? ' — 꼬리가 남을 수 있음' : ''}).`;
      else if (st.basis === 'map') m.innerHTML = tail ? `패턴 맵의 가장 늦은 곳 ${f1(c.tmax)} s × ${oeTxt} = ${f0(c.tend)} s — 맵에서는 다 지워지지만, <b>여유 ${st.oe} %로는 국부 산포의 꼬리(5σ ≈ 15 %)를 못 덮습니다</b>. 범프 사이 칸이 수십만 개라 드문 칸이 남을 수 있습니다.` : `패턴 맵의 가장 늦은 곳 ${f1(c.tmax)} s × ${oeTxt} = ${f0(c.tend)} s — <b>잔여는 없지만</b> 먼저 지워진 곳은 과식각을 ${f0(c.early)} s 받습니다. ` + (c.core ? '코어 다이는 범프에 Cu가 없어 기둥 옆 · 계면 홈은 없고, 그 자리는 Ni 발 밑 시드가 바닥 구석까지 파이며 Ti가 산화제에 오래 닿습니다(<a data-go="under.core">04장</a> · <a data-go="ti.oxide">06장</a>).' : `Cu 기둥 · 상부 Cu 옆면은 레시피 내내 어디서나 녹고(<a data-go="under.pillar">04장</a>), 그 자리는 밑동 발이 먼저 사라지고 계면이 약하면 홈이 약 +${f0(c.side)} nm 더 파이며 Ti가 산화제에 오래 닿습니다(<a data-go="ti.oxide">06장</a>).`) + ' 늦은 곳을 줄이면(두께 · 속도 맵 · 밀도) 레시피도 이 시간도 줄어듭니다.';
      else m.innerHTML = tail ? `맵 기준으로는 다 지워집니다(가장 늦은 곳 ${f1(c.tmax)} s &lt; 레시피 ${f0(c.tend)} s). 다만 범프 사이 칸이 수십만 개라 국부 산포의 꼬리(5σ)까지 덮으려면 <b>약 ${f0(c.need)} %</b>가 필요합니다(지금 ${st.oe} %).` : `<b>꼬리(5σ)까지 덮습니다</b> — 잔여 없음. 대신 먼저 지워진 곳은 과식각을 ${f0(c.early)} s 받아, ` + (c.core ? 'Ni 발 밑 시드 언더컷이 커지고 Ti가 산화제에 오래 닿습니다(<a data-go="under.core">04장</a> · <a data-go="ti.oxide">06장</a>). 코어 다이는 범프에 Cu가 없어 기둥 옆 · 계면 홈은 없습니다.' : `계면이 약하면 홈이 약 +${f0(c.side)} nm 더 파이고 Ti가 산화제에 오래 닿습니다(<a data-go="under.pillar">04장</a> · <a data-go="ti.oxide">06장</a>). Cu 기둥 · 상부 Cu 옆면은 레시피 내내 어디서나 녹습니다.`);
    }
    IDS.forEach(id => ctx.range(id, v => { st[id] = v; render(); return FMT[id](v); }));
    ctx.seg('shape', (v, user) => { st.shape = v; if (user) touched = true; render(); });
    ctx.seg('basis', (v, user) => { st.basis = v; if (user) touched = true; render(); });
    ctx.seg('die', (v, user) => { st.die = v; if (user) touched = true; render(); });
    IDS.forEach(id => { const i = inp(id); if (i) i.addEventListener('input', () => { touched = true; }); });
    ctx.demo = sid => {
      if (touched) return ctx.refresh();
      Object.assign(st, DEF, DEMO[sid] || {});
      IDS.forEach(id => { const i = inp(id); if (i) i.value = st[id]; ctx.out(id, FMT[id](st[id])); });
      setSeg('shape', st.shape); setSeg('basis', st.basis); setSeg('die', st.die);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['끝점 (엔드포인트)', '지울 막이 다 지워진 때. 시간 · 빛(반사율 · 색) · 전기 신호로 판단한다'],
      ['블랭킷 웨이퍼', '패턴 없이 막만 입힌 시험 웨이퍼. 식각 속도와 장비 속도 맵을 재는 데 쓴다'],
      ['로딩 (패턴 밀도) 효과', '녹일 면적 · 패턴 밀도에 따라 국부 식각 속도가 달라지는 현상. 빽빽한 곳이 보통 느리다'],
      ['시드 두께 맵', '웨이퍼 위 시드 두께 분포. 면저항(4탐침) 맵으로 대신 본다 — 면저항 = 비저항 ÷ 두께'],
      ['장비 속도 맵', '같은 액이라도 노즐 위치 · 팔 움직임 · 회전 · 유량 · 온도에 따라 웨이퍼 안에서 달라지는 식각 속도 분포. 블랭킷 웨이퍼로 잰다'],
      ['과식각 %', '(레시피 시간 − 기준 지움 시간) ÷ 기준 지움 시간. 기준이 블랭킷 계산인지 실제 끝점(가장 늦은 곳)인지 함께 적는다'],
      ['꼬리 (σ) · 칸', '분포에서 평균과 먼 쪽. 표준편차 σ의 몇 배인지로 말한다. 칸(범프 사이 시드 한 토막)이 웨이퍼 한 장에 수십만~수백만 개라 드문 꼬리도 실제로 나타난다'],
      ['SEM-EDS · AES · XPS', 'SEM-EDS = 전자 현미경에서 X선으로 원소를 보는 분석 (신호 깊이 수백 nm~1 µm라 몇 nm 막은 잘 안 잡힘). AES · XPS = 표면 몇 nm의 성분 · 산화 상태를 보는 분석. 공정 현장에서 \'EDS\'는 웨이퍼 전기 검사(Electrical Die Sorting)를 뜻하기도 해서, 이 탭은 성분 분석을 늘 \'SEM-EDS\'로 적는다']
    ]) + K.field([
      '레시피 시간은 \'블랭킷 속도 × 시드 두께\'로 시작하되, 실제 패턴 웨이퍼의 <b>가장 늦은 곳</b>(두꺼운 곳 · 빽빽한 다이)에서 확인해 정합니다. 과식각 %를 적을 때는 기준(블랭킷 계산 · 실제 끝점)을 함께 적습니다.',
      '끝점 센서가 있는 낱장 장비는 레시피를 <b>\'끝점 + 과식각 %\'</b>로 짜기도 합니다. 액 나이 · 온도로 속도가 바뀌어도 시간이 따라가 잔여가 덜 생기고, 장마다 기록되는 끝점 시간을 추세로 보면 액 나이(→ <a data-go="tool.bath">08장</a>) · 시드 두께 · 장비 변화를 가장 먼저 잡습니다. 다만 센서는 한 자리(또는 평균)를 보므로, 과식각 %는 가장 늦은 곳(맵 · 로딩)으로 정합니다.',
      `식각 엔지니어가 가장 많이 맞추는 손잡이는 <b>장비 속도 맵</b>입니다 ${TAG.eq}. 블랭킷 웨이퍼로 속도 맵을 재고, 노즐 위치 · 팔 흔들기 · 회전 · 유량으로 시드 두께 맵에 맞추면 필요한 과식각이 줄어듭니다.`,
      `PVD 챔버 · 타깃 수명 · 레시피가 바뀌면 시드 두께 맵이, 새 제품이 오면 범프 밀도 · 열린 면적(로딩)이 바뀌어 식각 끝점도 바뀝니다 ${TAG.up}. 시드 면저항 맵을 식각 결과와 겹쳐 보고(→ <a href="#go-plating-07">전해도금 07장</a>; PR 스트립 중 Cu 시드가 얇아져도 맵이 바뀜 → <a href="#go-strip-07">PR 스트립 07장</a>), 같은 레시피를 그대로 쓰기 전에 빽빽한 블록의 잔여와 외톨이 범프의 언더컷을 함께 다시 봅니다 → <a data-go="under.over">04장</a>.`,
      '\'눈으로 다 지워졌다\'는 시작점입니다. 몇 nm 잔여는 보통 SEM-EDS에도 잘 안 잡히므로 누설 시험 패턴으로 먼저 보고, 성분은 AES · XPS로 확인합니다 → <a data-go="defects.resid">09장</a>.'
    ]) + K.deep(`<p>이 장 위젯의 식 (개념 모델, ρ = 반지름 ÷ 150 mm, d = 빽빽한 블록 밀도, L = 로딩 계수):</p>
      ${K.eq('h(ρ) = h₀ (1 ± u (1 − 2ρ²))')}${K.eq('r(ρ) = r₀ (1 + a (2ρ² − 1))')}${K.eq('t_블록 = h ÷ [r (1 − L·d)]')}${K.eq('t_외톨이 = h ÷ r')}${K.eq('t_레시피 = t_b × (1 + OE)')}${K.eq('    또는 max t_블록 × (1 + OE)')}${K.eq('필요 OE = max t_블록 × 1.15 ÷ t_b − 1')}${K.eq('  1.15 = 1 + 5σ (국부 산포 σ 3 %) · 블랭킷 기준')}${K.eq('n = 1.5 · k_p · r · (t_레시피 − min t_외톨이)')}${K.eq('  먼저 지워진 곳의 계면 홈 (약할 때 · 04장 식)')}
      <ul><li><b>시간과 언더컷</b> — 이미 지워진 곳의 과식각 시간 = t_레시피 − min t_외톨이. 두께 맵 h와 속도 맵 r이 같은 모양이면 지움 시간 맵이 평평해집니다. 이 모델에서는 가운데 두꺼움 u %에 속도 맵 a = −u를 주면 h ÷ r = h₀ ÷ r₀로 정확히 상쇄됩니다(실제 두 맵은 모양이 완전히 같지 않아 일부만 상쇄). 남는 차이는 로딩(1 − L·d)과 국부 산포입니다. 예: 기본값에서 가장 늦은 곳 78.8 s, 외톨이 범프 옆이 가장 먼저 57.5 s → 과식각 30 %(78 s)에서 잔여 다이 약 12 %, 먼저 지워진 곳은 약 21 s 과식각을 더 받습니다. 기둥 옆 깎임은 레시피 시간이 정해 어디서나 생기고(04장 s_p = k_p · r · t, 기본값 약 507 nm), 그 자리에서 더 커지는 것은 밑동 발이 사라진 뒤의 밑동 · 계면 홈(계면이 약하면 1.5 × 1.3 × 300 nm/분 × 20.6 s ≈ +200 nm, 04장 식) · Ti 노출(<a data-go="ti.oxide">06장</a>)입니다. 외톨이 범프는 로딩이 없어 국부 속도가 빨라 기둥 옆도 빽빽한 블록보다 약 100 nm 더 깎입니다(1.3 × 300 nm/분 × 20 % × 78 s). 여기까지는 베이스 다이(Cu / Ni / Cu / SnAg) 이야기이고, 코어 다이(Ni / SnAg)는 범프에 Cu가 없어 기둥 옆 · 계면 홈이 없으며 과식각은 Ni 발 밑 시드 언더컷으로 갑니다(<a data-go="under.core">04장</a>).</li>
      <li><b>꼬리가 시간을 정한다</b> — 범프 사이 칸이 N 개이고 칸마다 국부 산포 σ가 정규분포를 따르면, 가장 늦은 칸은 평균보다 약 √(2 ln N) σ 늦습니다. N = 10⁶ 이면 √27.6 ≈ 5.3 → 약 5σ, 국부 산포 3 %면 15 % 여유가 더 필요합니다. 300 mm 웨이퍼 한 장에 범프가 수십만~수백만 개라 평균으로 정한 시간은 늘 모자랍니다. 기본값의 '필요한 과식각 51 %'는 맵 · 로딩(×1.31)과 꼬리(×1.15)를 곱한 값입니다.</li>
      <li><b>로딩의 진짜 원인</b> — 빽빽한 곳은 범프 사이 시드 넓이는 적지만 베이스 다이는 Cu 옆면이 넓습니다. 블록의 범프 밀도 d, 지름 D, 옆면에 드러난 Cu 높이 H(베이스 다이: Cu 기둥 12 + 상부 Cu 3 = 15 µm, 예시)이면 옆면 넓이 ÷ 블록 넓이 = d·4H/D (d 20 % · D 25 µm · H 15 µm → 약 0.5, 범프 사이 시드 넓이 1 − d = 0.8과 같은 자릿수; d 30 %면 0.72 대 0.70으로 거의 같음). 옆면도 수백 nm 녹으므로 산화제 · 산 수요가 범프 사이 시드만큼 큽니다. 코어 다이(Ni / SnAg)는 범프에 Cu가 없어(H = 0) 이 몫이 없고, 범프가 낮아(17 대 30 µm) 같은 피치라면 범프 사이 액도 더 잘 바뀝니다 — 위젯의 코어 다이 L 0.5는 이를 나타낸 예시 값입니다. 여기에 범프 사이로 액이 덜 바뀌어 공급이 줄어듭니다(→ <a data-go="rate.which">03장</a>). 녹은 Cu²⁺는 잘 녹아 있어(황산구리는 물에 1 mol/L 넘게 녹음) 그 자체로 길을 막지는 않습니다.</li>
      <li><b>공개 보고</b> — 묽은 황산 + 과산화수소로 Cu 시드를 지운 연구에서 빽빽한 패턴 구역은 과식각이 더 필요했다는 보고가 있습니다. 재배선 공정의 과식각 사례(눈으로 다 지워진 뒤 50~200 %)는 <a data-go="under.over">04장</a> 「한 걸음 더」에 있습니다.</li>
      <li><b>끝점 보기</b> — 광학(반사율 · 색) 센서, 블랭킷 모니터 웨이퍼의 정기 속도 · 속도 맵 측정, 시험 패턴 저항. 센서가 보는 자리가 가장 늦은 곳이 아닐 수 있어 끝점 신호 뒤에도 여유를 둡니다. 끝점을 인식해 과식각 시간을 줄여 언더컷을 줄이는 장치가 공개 특허에 있습니다. SEM-EDS는 신호 깊이가 수백 nm~1 µm라 몇 nm 잔여가 아래 보호막 신호에 묻히기 쉽습니다(낮은 가속 전압으로도 한계).</li>
      <li><b>시드 면저항 맵</b> — Rs = ρ ÷ t 이므로 두께 맵 대용입니다(Cu 300 nm · 1.9×10⁻⁸ Ω·m → 약 0.063 Ω/□; 아래 Ti 100 nm는 약 5 Ω/□라 병렬로 1 % 남짓만 보탭니다). 도금 전에 잰 맵이 식각 끝점 맵의 첫 단서이고, 도금 두께 맵(터미널 효과)과도 이어집니다(→ <a href="#go-plating-07">전해도금 07장</a>).</li>
      <li><b>위젯 상수</b> — h₀ 300 nm, r₀ 300 nm/분(기준 액), L 1.0(베이스 다이) · 0.5(코어 다이), 가장자리 부분 다이 밀도 ½, 국부 산포 3 %, 칸 10⁶ 개(5σ), 도금 Cu 배수 1.3 · 약한 계면 계수 1.5(04장), 속도 맵 ±10 %, 다이 ${DIES.length}개(그중 가장자리 부분 다이 ${DIES.filter(D => D.part).length}개) — 모두 예시입니다.</li></ul>`);
  },
  css: `.et07-late{fill:#f59e0b}
.et07-early{fill:none;stroke:#38bdf8;stroke-width:3;opacity:.6}
.et07-hand{fill:none;stroke:#f8fafc;stroke-width:2.6;stroke-linecap:round}
.et07-die{stroke:none}
.pl-svg .et07-hatch{fill:none;stroke:#140808;stroke-width:2.4;opacity:.85}
.et07-pd{fill:none;stroke:#e2e8f0;stroke-width:1.6;stroke-dasharray:4 3}
.et07-dot{stroke:#0b1222;stroke-width:1.4}
.et07-notch{fill:#08101e;stroke:#94a3b8;stroke-width:1}
.et07-ring{fill:none;stroke:#fde68a;stroke-width:3.4}
.et07-ring2{fill:none;stroke:#7dd3fc;stroke-width:3.4}
.pl-svg .et07-lead{fill:none;stroke:#fde68a;stroke-width:1.8;stroke-dasharray:6 5;opacity:.8}
.et07-row{fill:rgba(56,189,248,.10);stroke:#38bdf8;stroke-width:1.6}
.pl-svg .et07-ngt{fill:#f87171 !important}
.pl-svg .et07-wnt{fill:#fbbf24 !important}
.pl-svg .et07-okt{font-size:21px;font-weight:800;fill:#4ade80 !important}
.et07-band{fill:rgba(245,158,11,.14)}
.et07-iso{fill:none;stroke:#a5f3fc;stroke-width:2.4;stroke-dasharray:3 6;stroke-linecap:round}
.et07-tl{fill:none;stroke:#f87171;stroke-width:9;opacity:.6;stroke-linecap:round}
.pl-svg .et07-cut{fill:none;stroke:#f8fafc;stroke-width:2.4;stroke-dasharray:10 6}
.et07-brk{fill:none;stroke:#fbbf24;stroke-width:2.2}
.et07-over{fill:none;stroke:#f87171;stroke-width:3}
.et07-blk{fill:rgba(148,163,184,.06);stroke:#94a3b8;stroke-width:1.4;stroke-dasharray:5 5;opacity:.7}
.et07-cloud{fill:rgba(245,158,11,.18);stroke:rgba(245,158,11,.5);stroke-width:1.5;stroke-dasharray:6 5}
.pl-svg .et07-weak{opacity:.28}
.et07-mol{fill:#5eead4;stroke:#ccfbf1;stroke-width:1}
.et07-sb{fill:#38bdf8}
.et07-sm{fill:#f59e0b}
.et07-st{fill:#f87171}
.et07-bar{fill:none;stroke:#8fa6c6;stroke-width:1.2}
.et07-zr{fill:rgba(239,68,68,.32)}
.et07-zu{fill:rgba(245,158,11,.22)}
.et07-need{fill:none;stroke:#f87171;stroke-width:3}
.et07-mk{fill:#fbbf24}
.et07-sw-cu{fill:#d4874a;stroke:#f3b07a;stroke-width:1}
.et07-sw-thin{fill:#7a4a32;opacity:.85;stroke:#a0703f;stroke-width:1}
.et07-sw-pas{fill:#7c6a3a;stroke:#a8945a;stroke-width:1}
.jc .pl-tag.et07-cond{background:rgba(45,212,191,.2);color:#5eead4}
.jc .et07-w .kpi{flex:1 1 30%;min-width:0;padding:5px 8px}
.jc .et07-w .kpi .v{font-size:17px;white-space:nowrap}
.jc .et07-w .kpi .s{font-size:10.5px;line-height:1.3}
.jc .et07-w .ctl label output{white-space:nowrap;margin-left:6px}
.jc .et07-msg{min-height:82px}
@media (max-width:1280px){.jc .et07-msg{min-height:102px}}`
});
})();
