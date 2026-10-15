/* 시드 식각 04 — 언더컷: 범프 밑동은 왜 파일까? (범프 밑동 · µm) */
(function(){
const RS = 300;                                    // 스퍼터 Cu 시드 식각 속도 (nm/분, 기준 액 · 블랭킷 예시)
const XO = 520, YT = 886, PX = 0.06, PY = 0.12;    // 처음 기둥 테두리 x, Ti 윗면 y, 가로 1 nm = 0.06 px(1 µm = 60 px), 세로 0.12 px(2배 과장)
const X0 = 60, X1 = 980, PTOP = 262;               // 단면 가로 범위, 기둥 위 끊김
const NH = 12;                                     // 계면 홈의 반 높이 (px)
const ZB = {x: 662, y: 292, w: 312, h: 268};       // 밑동 확대 상자 (왼쪽 패널 안 식각액 자리)
const TMAX = 250, BX0 = 1060, BW = 480;            // 시간 막대 0~250 s
const DEF = {h: 300, oe: 30, kp: 1.3, d: 25, itf: 'ok'};
// 손대지 않았을 때 단계마다 보여 줄 값 (발표 모드 대비)
const DEMO = {iso: {}, clear: {}, over: {oe: 100}, pillar: {kp: 2.0, itf: 'weak', oe: 30}, area: {d: 10, oe: 30}};
// 좁은 세로 화면 전용 확대: 오른쪽 위 판 / 밑동 둘레
const VN_RT = {x: 1030, y: 120, w: 540, h: 470}, VN_FOOT = {x: 420, y: 250, w: 580, h: 690};
// 단면 그림 3벌: t = 0 (iso) · t = t₀ (clear) · t = t₀(1 + 과식각) (나머지)
const VARS = [{k: 'iso', st: 'iso'}, {k: 'clear', st: 'clear'}, {k: 'end', st: 'over pillar area'}];
const fmt = v => Math.round(v).toLocaleString('en-US');
const judge = a => a >= 92 ? 'ok' : a >= 85 ? 'wn' : 'ng';
const areaOf = (sb, D) => Math.pow(Math.max(0, 1 - 2 * sb / 1000 / D), 2);
// 개념 모델 (기획 04장): t₀ = h/r_s, t = t₀(1+OE), s_p = k_p·r_s·t, n = f·k_p·r_s·(t − t₀), 밑면적 = (1 − 2(s_p+n)/D)²
function calc(s){
  const t0 = s.h / RS * 60, t = t0 * (1 + s.oe / 100), f = s.itf === 'weak' ? 1.5 : 0;
  const at = tau => { const sp = s.kp * RS * tau / 60, n = f * s.kp * RS * Math.max(0, tau - t0) / 60; return {tau, d: RS * tau / 60, sp, n, sb: sp + n}; };
  const fin = at(t), A = areaOf(fin.sb, s.d);
  return {t0, t, f, at, fin, A, Ar: Math.round(A * 100)};
}
// 앞면이 퍼지는 움직임 (k번째 앞면이 차례로 나타나 머문다)
const ANI = k => `<animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;${(k / 3.6).toFixed(3)};${(k / 3.6 + 0.03).toFixed(3)};0.94;1" dur="3.6s" repeatCount="indefinite"/>`;

// 단면 (기둥 + 시드 + Ti + 보호막). st = calc().at(τ). 둥근 구석은 이상적 등방성(옆 k_p배 · 아래 1배)을 단순화한 그림
function profile(K, s, st, fronts){
  const {R, L, P, PG, G, tip} = K;
  const ys = YT - PY * s.h, xw = XO - PX * st.sp, xn = xw - PX * st.n, rx = XO - xw, ry = PY * st.d, notch = st.n > 0.5;
  let o = R(X0, PTOP - 14, X1 - X0, YT - PTOP + 14, 'et04-liq', tip('식각액 — 기준 액 (과산화수소 0.15 wt% + 산, 예시). 범프 사이 틈 30 µm 가운데 기둥 가까운 쪽'));
  // 기둥 (위는 끊김 무늬, 아래 계면 홈)
  const pil = [[X0, ys], [X0, PTOP]];
  for (let x = X0 + 23, q = 1; x < xw - 6; x += 23, q++) pil.push([x, PTOP + (q % 2 ? -7 : 0)]);
  pil.push([xw, PTOP]);
  if (notch){ pil.push([xw, ys - NH]); pil.push([xn, ys]); } else pil.push([xw, ys]);
  o += PG(pil, 'f-cu2', tip(`Cu 기둥 (도금 Cu) — Cu 식각액에 처음부터 끝까지 옆으로 녹는다.\n지금 한쪽 ${fmt(st.sp)} nm 얇아짐 (그림은 가로 1 µm = 60 px)`));
  // 기둥 밑 시드 + 범프 사이 시드 (사분 타원 구석)
  const hp = YT - ys, nh2 = Math.min(NH, hp * 0.6), sd = [[X0, ys]];
  if (notch) sd.push([xn, ys]);
  const ph0 = notch && ry > 0 ? Math.asin(Math.min(1, nh2 / ry)) : 0;
  const phE = st.d > s.h ? Math.asin(s.h / st.d) : Math.PI / 2;
  for (let k = 0; k <= 16; k++){ const ph = ph0 + (phE - ph0) * k / 16; sd.push([XO - rx * Math.cos(ph), ys + ry * Math.sin(ph)]); }
  if (st.d <= s.h){ sd.push([X1, ys + ry]); sd.push([X1, YT]); }
  sd.push([X0, YT]);
  o += PG(sd, 'f-seed2', tip(st.d < s.h ? `스퍼터 Cu 시드 — 기둥과 한 몸. 범프 사이 시드는 아래로 녹아 ${fmt(s.h - st.d)} nm 남음 (실제 수백 nm — 그림은 과장)` : '스퍼터 Cu 시드 — 범프 사이는 다 녹고 기둥 밑에만 남는다.\n맨 아래 구석은 액에서 가장 멀어 가장 늦게 녹는다 (→ 03장: 좁은 구석은 액도 늦게 바뀐다)'));
  o += L(X0, ys, notch ? xn : xw, ys, 'et04-if');
  o += R(X0, YT, X1 - X0, 14, 'f-ti', tip('Ti — Cu 식각액에서는 거의 안 녹는다 (멈춤층). Ti는 06장에서 따로 지운다'));
  o += R(X0, YT + 14, X1 - X0, 80, 'f-pas', tip('보호막 (산화막 · 질화막 · 폴리이미드 등)'));
  o += L(XO, PTOP - 14, XO, YT, 'pl-ghost', tip('처음 테두리 — 도금 직후 기둥 옆면 자리'));
  // 치수선 (기둥 옆 · 밑동)
  if (st.sp > 1){
    o += L(xw, 600, XO, 600, 'et04-dim') + L(xw, 588, xw, 612, 'et04-dim') + L(XO, 588, XO, 612, 'et04-dim');
    o += L(xn, ys, XO, ys, 'et04-dim') + L(xn, ys - 9, xn, ys + 9, 'et04-dim') + L(XO, ys - 9, XO, ys + 9, 'et04-dim');
  }
  // 녹는 앞면 (t₀의 ⅓마다)
  if (fronts) [1, 2, 3].forEach((q, k) => {
    const d = s.h * q / 3, fx = XO - PX * s.kp * d, frx = XO - fx, fry = PY * d;
    o += `<g opacity="0">${P(`M${K.q1(fx)},${PTOP - 4} L${K.q1(fx)},${K.q1(ys)} A${K.q1(frx)},${K.q1(fry)} 0 0 0 ${XO},${K.q1(ys + fry)} L${X1},${K.q1(ys + fry)}`, 'et04-fr')}${ANI(k)}</g>`;
  });
  return o;
}

(window.EngrEtchChapters = window.EngrEtchChapters || []).push({
  no: '04', id: 'under', part: 2, short: '언더컷', scale: '범프 밑동 · µm',
  title: '언더컷 — 범프 밑동은 왜 파일까?',
  hook: '아래로 녹는 만큼 옆으로도',
  one: '식각액은 방향을 가리지 않고 닿는 곳마다 비슷한 빠르기로 녹입니다(등방성). 그래서 시드를 아래로 지우는 동안 Cu 기둥의 옆면과 밑동도 옆으로 녹습니다. 다 지운 뒤 더 담가 두는 시간(과식각)만큼 밑동이 더 파입니다.',
  ana: '<b>각설탕 위의 동전</b> — 동전을 얹은 각설탕에 물을 부으면, 드러난 설탕이 녹는 동안 동전 가장자리 밑으로도 설탕이 녹아 들어갑니다. 동전이 안 녹는 재료일 때가 교과서의 언더컷 그림입니다(Ti 식각에서 Cu 기둥 밑의 Ti가 이렇습니다). <i>(비유의 한계: Cu 시드 식각에서는 \'동전\'인 기둥도 같은 Cu라 기둥 자체가 함께 얇아집니다. 또 금속은 결정 · 표면 상태에 따라 녹는 빠르기가 달라 완전한 사분원으로 파이지 않고, 좁은 틈 속은 액이 잘 안 바뀌어 느려지기도 합니다.)</i>',
  steps: [
    {id: 'iso', viewN: VN_RT, t: '등방성 — 사방으로 같은 빠르기', d: '안 녹는 막(마스크)이 일부를 덮은 금속막을 녹이면, 마스크 가장자리 아래로 둥글게(사분원 모양) 파고듭니다. 막 두께만큼 아래로 녹는 동안 옆으로도 거의 같은 거리를 녹습니다. 액에는 \'아래\'라는 방향이 없기 때문입니다.'},
    {id: 'clear', viewN: VN_FOOT, t: '다 지워지는 순간', d: '범프 사이 Cu 시드가 다 녹아 Ti가 드러날 때까지 걸리는 시간을 지움 시간이라 합니다(시드 두께 ÷ 속도). 그동안 기둥 옆면도 액에 닿아 있었으므로 이미 조금 얇아졌습니다. 밑동 맨 아래 구석은 액에서 가장 멀고 액도 잘 안 바뀌어 가장 늦게 녹습니다.'},
    {id: 'over', viewN: VN_FOOT, t: '과식각 — 더 담가 두는 시간', d: '웨이퍼 안 두께 차이 · 빽빽한 곳 때문에 가장 늦은 곳까지 지우려면 시간을 더 줍니다(과식각, 예: 지움 시간의 30~100 %). 이미 깨끗한 곳에서는 그 시간 내내 밑동과 기둥이 옆으로만 녹습니다.'},
    {id: 'pillar', viewN: VN_RT, t: '기둥도 같은 Cu', d: 'Cu 식각액은 시드와 기둥을 가리지 못해 기둥 옆면이 처음부터 끝까지 얇아집니다. 풀림(결정이 자라 안정되는 것) 전의 도금 Cu가 스퍼터 Cu보다 빨리 녹았다는 공개 보고(약 2.5배)가 있고, 계면이 먼저 파여 홈이 생기기도 합니다. 위의 Ni · SnAg는 덜 녹아 처마가 됩니다.'},
    {id: 'area', viewN: VN_RT, t: '남는 밑면적', d: '지름이 작을수록 같은 깎임이 넓이에서 더 큰 몫이 됩니다. 한쪽 0.5 µm씩 깎이면 지름 40 µm는 밑면적이 5 %, 10 µm는 19 % 줄어듭니다. 범프가 작을수록 같은 언더컷이 무겁습니다.'}
  ],
  icon(K){
    const {R, P} = K;
    return R(14, 6, 30, 42, 'f-cu2') + R(18, 48, 22, 6, 'f-seed2') + R(4, 54, 58, 4, 'f-ti') + P('M48,6 L48,54', 'pl-ghost');
  },
  draw(K){
    const {R, L, P, T, G, LB, tip, only} = K;
    let s = '';
    // ── 왼쪽: 범프 밑동 단면 확대
    s += R(40, 130, 960, 980, 'pl-panel', {rx: 14});
    s += LB(T(60, 166, '범프 밑동 확대 — 오른쪽 절반', 't-acc', 'start') + T(60, 196, '가로 1 µm = 60 px · 세로(막 두께)는 2배 과장', 't-dim', 'start'));
    s += `<g data-v="prof"></g>`;
    s += LB(T(70, 238, '↑ Cu 기둥은 위로 15 µm · Ni · SnAg 모자는 그림 밖', 't-dim', 'start'));
    s += LB(T(XO + 8, 288, '처음 테두리', 't-dim', 'start') + T(XO + 14, 470, '식각액', 't-dim', 'start'));
    s += LB(T(72, 968, '↑ Ti(회색) — Cu 식각액에 거의 안 녹는 멈춤층 · 초록 = 보호막', 't-sub', 'start'));
    s += R(56, 998, 928, 100, 'pl-box', {rx: 10});     // 자막 상자 (글보다 먼저 그려 글을 덮지 않게)
    s += `<g data-v="seedl"></g><g data-v="zoom"></g><g data-v="lbl"></g>`;
    s += `<clipPath id="${K.id('et04-zc')}"><rect x="${ZB.x}" y="${ZB.y}" width="${ZB.w}" height="${ZB.h}"/></clipPath>`;
    // ── 오른쪽 위: 단계마다 바뀌는 판
    s += R(1040, 130, 520, 450, 'pl-panel', {rx: 14});
    // iso: 일반 그림 — 마스크 + 막 + 사분원 앞면 3개
    let g = LB(T(1060, 170, '등방성 식각 — 방향이 없다', 'pl-hdg', 'start'));
    g += R(1080, 226, 440, 100, 'et04-liq', tip('식각액'));
    g += R(1080, 326, 440, 64, 'f-seed2', tip('녹는 막'));
    [20, 42, 64].forEach((r, k) => {
      const arc = `M${1300 - r},326 A${r},${r} 0 0 0 1300,${326 + r}`;
      g += `<g opacity="0">${P(arc + ` L1520,${326 + r} L1520,326 Z`, 'et04-liq')}${P(arc + ` L1520,${326 + r}`, 'et04-fr')}${ANI(k)}</g>`;
    });
    g += R(1080, 300, 220, 26, 'f-ni', tip('안 녹는 막 — 마스크'));
    g += R(1080, 390, 440, 40, 'f-pas', tip('바닥 (안 녹음)'));
    g += L(1536, 326, 1536, 390, 'et04-dim') + L(1528, 326, 1544, 326, 'et04-dim') + L(1528, 390, 1544, 390, 'et04-dim');
    g += L(1236, 410, 1300, 410, 'et04-dim') + L(1236, 402, 1236, 418, 'et04-dim') + L(1300, 402, 1300, 418, 'et04-dim');
    g += LB(T(1190, 288, '마스크 (안 녹는 막)', 't-dim') + T(1430, 288, '식각액', 't-dim') + T(1180, 366, '녹는 막', 'et04-on2') + T(1550, 368, 'h', 't-warn') + T(1226, 416, '≈ h', 't-warn', 'end'));
    g += LB(T(1060, 476, '아래로 h 녹는 동안 옆으로도 약 h', 't-sub', 'start') + T(1060, 508, '(결정 · 좁은 틈 때문에 완전한 사분원은 아니다)', 't-dim', 'start') + T(1060, 548, '왼쪽 단면 — 기둥 옆면과 시드가 함께 녹는다', 't-dim', 'start'));
    s += G(g, only('iso'));
    s += `<g data-v="rt"></g>`;
    // ── 오른쪽 가운데: 시간 막대 · 오른쪽 아래: 식
    s += R(1040, 600, 520, 180, 'pl-panel', {rx: 14}) + `<g data-v="tb"></g>`;
    s += R(1040, 800, 520, 310, 'pl-panel', {rx: 14}) + `<g data-v="eq"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 과식각과 밑동</div>
      ${K.ctl('h', 'Cu 시드 두께', 100, 500, 10, 300)}${K.ctl('oe', '과식각 (블랭킷 지움 시간 기준)', 0, 150, 5, 30)}${K.ctl('kp', '도금 Cu 속도 (스퍼터 Cu 대비 배수, 예시)', 0.8, 2.5, 0.05, 1.3)}${K.ctl('d', '범프 지름', 8, 40, 1, 25)}
      ${K.seg('itf', [['ok', '고름'], ['weak', '약함 (홈)']], 'ok', '시드–기둥 계면')}
      ${K.kpis([['전체 시간', 'k-t', '지움 t₀ + 과식각'], ['기둥 옆 깎임', 'k-sp', '한쪽'], ['밑동 깎임', 'k-sb', '옆 깎임 + 계면 홈'], ['남은 밑면적', 'k-a', '처음 대비 (92 · 85 % 경계, 예시)']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('스퍼터 Cu 속도 r_s = 300 nm/분(기준 액 · 블랭킷, 예시). t₀ = 시드 두께 ÷ r_s, t = t₀ × (1 + 과식각). 기둥 옆 깎임 = 배수 × r_s × t (기둥은 처음부터 끝까지 옆으로), 계면 홈 = 1.5 × 배수 × r_s × (t − t₀)(\'약함\'일 때, 예시), 남은 밑면적 = (1 − 2 × 밑동 깎임 ÷ 지름)². 단면의 둥근 구석은 이상적 등방성을 단순화한 그림이고, 실제 모양은 결정 · 좁은 틈의 액 교환에 따라 다릅니다. 판정 경계 92 · 85 %도 개념 예시입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, PG, T, TT, G, LB, tip, only, wrap, lead} = K;
    const st = Object.assign({}, DEF);
    let touched = false;
    const IDS = ['h', 'oe', 'kp', 'd'];
    const FMT = {h: v => `${v} nm`, oe: v => `${v} %`, kp: v => `×${(+v).toFixed(2)}`, d: v => `${v} µm`};
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const setSeg = v => ctx.card.querySelectorAll('.pl-seg[data-g="itf"] button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const put = (sel, html) => { const e = ctx.$(sel); if (e) e.innerHTML = html; };
    function render(){
      const c = calc(st), S = {iso: c.at(0), clear: c.at(c.t0), end: c.fin}, ys = YT - PY * st.h, oeS = Math.round(c.t - c.t0);
      // ── 단면 3벌
      put('[data-v="prof"]', VARS.map(v => G(profile(K, st, S[v.k], v.k === 'iso'), only(v.st))).join(''));
      // 범프 중심 · 이름표 (지름 위젯을 따른다 — 중심이 패널 안에 들어오면 중심선을 긋는다)
      const hp = PY * st.h, xc = XO - PX * st.d * 500, axis = xc > X0 + 30, xwE = XO - PX * c.fin.sp;
      const narrow = axis && xwE - xc < 180, lx = narrow ? (X0 + xc) / 2 : ((axis ? xc : X0) + xwE) / 2;
      let sl = '';
      if (axis) sl += L(xc, PTOP - 14, xc, YT, 'et04-ax', tip(`범프 중심 — 지름 ${st.d} µm 범프의 가운데. 왼쪽은 반대쪽 절반`)) + LB(T(narrow ? xc - 8 : xc + 8, 300, '범프 중심', 'et04-on2', narrow ? 'end' : 'start') + T(narrow ? xc - 8 : xc + 8, 324, `(지름 ${st.d} µm)`, 'et04-on2', narrow ? 'end' : 'start'));
      else sl += LB(T(80, 330, `← 범프 중심까지 ${+(st.d / 2).toFixed(1)} µm (지름 ${st.d} µm)`, 'et04-on2', 'start'));
      sl += LB(T(lx, 520, 'Cu 기둥', 'et04-on') + T(lx, 548, '(도금 Cu)', 'et04-on2'));
      if (hp >= 24) sl += LB(T(lx, ys + hp / 2 + 7, '시드 Cu (스퍼터)', 'et04-on2'));
      put('[data-v="seedl"]', sl);
      // ── 밑동 확대 (마지막 상태가 들어가는 크기로 세 단계 같은 틀)
      const xl = XO - PX * c.fin.sb - 40, xr = XO + 45, yl = ys - 34, yr = YT + 26;
      const k = K.clamp(Math.min(ZB.w / (xr - xl), ZB.h / (yr - yl)), 1.5, 4), zw = ZB.w / k, zh = ZB.h / k;
      const zx0 = (xl + xr) / 2 - zw / 2, zy0 = (yl + yr) / 2 - zh / 2, tx = ZB.x - zx0 * k, ty = ZB.y - zy0 * k;
      const mp = (x, y) => [tx + x * k, ty + y * k];
      let z = R(ZB.x - 2, ZB.y - 2, ZB.w + 4, ZB.h + 4, 'et04-zb', {rx: 6}) + LB(T(ZB.x, ZB.y - 12, `밑동 확대 ×${k.toFixed(1)} (점선 상자)`, 't-dim', 'start'));
      z += VARS.map(v => G(G(G(profile(K, st, S[v.k], v.k === 'iso'), {transform: `translate(${K.q1(tx)} ${K.q1(ty)}) scale(${k.toFixed(3)})`}), {'clip-path': K.url('et04-zc')}), only(v.st))).join('');
      z += R(zx0, zy0, zw, zh, 'et04-zr');
      // 확대 상자 안 짚어 주기: clear → 남는 구석, pillar → 계면 홈
      const cl = S.clear, cxw = XO - PX * cl.sp, crx = XO - cxw, cry = PY * cl.d, ph = Math.PI / 3;
      const [fx, fy] = mp(XO - crx * Math.cos(ph) * 0.92, ys + cry * Math.sin(ph) * 0.96);
      z += G(lead(fx, fy, ZB.x + ZB.w - 16, ZB.y + ZB.h - 16, '가장 늦게 녹는 구석', 'end', 't-warn'), only('clear'));
      if (c.fin.n > 0.5){
        const [nx, ny] = mp(XO - PX * (c.fin.sp + c.fin.n * 0.5), ys);
        z += G(lead(nx, ny, ZB.x + ZB.w - 16, ZB.y + ZB.h - 16, `계면 홈 ${fmt(c.fin.n)} nm`, 'end', 't-warn'), only('pillar'));
      }
      put('[data-v="zoom"]', z);
      // ── 단계별 글 (왼쪽)
      let lb = '';
      const tlab = {iso: 't = 0 (시작)', clear: `t = t₀ = ${fmt(c.t0)} s`, end: `t = ${fmt(c.t)} s (과식각 ${st.oe} %)`};
      VARS.forEach(v => {
        const q = S[v.k];
        let g = T(X1, 166, tlab[v.k], 't-warn', 'end');
        if (q.sp > 1) g += T(XO + 14, 607, `기둥 옆 깎임 ${fmt(q.sp)} nm`, 't-warn', 'start') + P(`M${XO},${K.q1(ys)} L${XO + 64},${K.q1(ys - 16)}`, 's-lead') + T(XO + 70, ys - 12, `밑동 깎임 ${fmt(q.sb)} nm`, 't-warn', 'start');
        lb += G(LB(g), only(v.st));
      });
      lb += G(LB(T(XO + 14, 720, '파란 선 — 녹는 앞면 (t₀의 ⅓마다)', 't-sub', 'start') + T(XO + 14, 752, '구석에서는 둥글게 파고든다', 't-dim', 'start')), only('iso'));
      lb += G(LB(T(XO + 14, 720, 't₀ — 범프 사이 시드 끝, Ti 드러남', 't-sub', 'start') + T(XO + 14, 752, '시드 맨 아래 구석이 가장 늦게 녹는다', 't-dim', 'start')), only('clear'));
      lb += G(LB(T(XO + 14, 720, `과식각 +${oeS} s 동안 옆으로만 녹는다`, 't-sub', 'start') + T(XO + 14, 752, '범프 사이에는 더 녹을 Cu 시드가 없다', 't-dim', 'start')), only('over'));
      lb += G(LB(T(XO + 14, 720, `도금 Cu 기둥 — 시드의 ×${st.kp.toFixed(2)} 빠르기`, 't-sub', 'start') + T(XO + 14, 752, st.itf === 'weak' ? '계면이 약해 밑동에 홈이 먼저 파인다' : '계면이 고르면 홈은 없다', 't-dim', 'start')), only('pillar'));
      lb += G(LB(T(XO + 14, 720, `지름 ${st.d} µm → 남은 밑면적 ${c.Ar} %`, 't-sub', 'start') + T(XO + 14, 752, '오른쪽 위: 같은 깎임, 다른 지름', 't-dim', 'start')), only('area'));
      const cap = {
        iso: 't = 0 — 식각액이 막 닿았습니다. 기둥 옆면과 범프 사이 시드가 동시에 녹기 시작합니다.',
        clear: `t = t₀ = ${fmt(c.t0)} s — 범프 사이 시드가 다 녹았습니다. 기둥은 이미 한쪽 ${fmt(S.clear.sp)} nm 얇아졌습니다.`,
        over: `과식각 ${st.oe} % (+${oeS} s) — 범프 사이에는 더 녹을 Cu 시드가 없고, 그동안 밑동과 기둥만 옆으로 녹습니다.`,
        pillar: `기둥(도금 Cu)이 시드보다 ×${st.kp.toFixed(2)} 빨리 녹아 한쪽 ${fmt(c.fin.sp)} nm 얇아졌습니다.` + (c.fin.n > 0.5 ? ` 계면 홈 ${fmt(c.fin.n)} nm가 더해집니다.` : ' 계면이 고르면 홈은 없습니다.'),
        area: `밑동 깎임 ${fmt(c.fin.sb)} nm — 지름 ${st.d} µm 범프의 밑면적은 처음의 ${c.Ar} %입니다 (${c.A <= 0 ? '밑동이 끊김 — 범프가 떨어짐' : c.Ar >= 92 ? '여유' : c.Ar >= 85 ? '경계' : '많이 줄어듦'}).`
      };
      Object.keys(cap).forEach(sid => { lb += G(LB(TT(76, 1038, wrap(cap[sid], 42), 'et04-cap', 'start', 32)), only(sid)); });
      put('[data-v="lbl"]', lb);
      // ── 오른쪽 위 (clear · over: 결과 표, pillar: 처마, area: 위에서 본 원 3개)
      let rt = '';
      const jc = judge(c.Ar);
      [['clear', S.clear, '다 지워진 순간 — t = t₀'], ['over', c.fin, `과식각 끝 — t = t₀ × ${(1 + st.oe / 100).toFixed(2)}`]].forEach(([sid, q, hd]) => {
        const a = Math.round(areaOf(q.sb, st.d) * 100);
        const rows = [['지움 시간 t₀', `${fmt(c.t0)} s`], ['지금까지 식각 시간', sid === 'clear' ? `${fmt(c.t0)} s` : `${fmt(c.t)} s`], ['범프 사이 시드', '0 nm (Ti 드러남)'], ['기둥 옆 깎임', `${fmt(q.sp)} nm`], ['계면 홈', `${fmt(q.n)} nm`], ['밑동 깎임', `${fmt(q.sb)} nm`], [`남은 밑면적 (지름 ${st.d} µm)`, `${a} %`]];
        let g = T(1060, 170, hd, 'pl-hdg', 'start');
        rows.forEach(([nm, v], i) => { const y = 224 + i * 42; g += T(1066, y, nm, 't-sub', 'start') + T(1538, y, v, 'pl-val' + (i === 6 ? ' et04-' + judge(a) : ''), 'end'); if (i < 6) g += L(1060, y + 15, 1540, y + 15, 's-faint'); });
        g += T(1060, 534, '블랭킷(평평한 막) 계산 — 가장 늦은 곳의 차이는 07장', 't-dim', 'start');
        rt += G(LB(g), only(sid));
      });
      // pillar: 범프 전체 옆모습 (처마). 공통 범프(지름 25 µm · Cu 15 + Ni 3 + SnAg 12 µm)를 1 µm = 7 px 실제 비율로, 옆 깎임만 2배 과장(1 µm = 14 px)
      {
        const U = 7, A = 1088, B = A + 25 * U, ySn = 232, yNi = ySn + 12 * U, yCu = yNi + 3 * U, yS = yCu + 15 * U, yT = yS + 6, cx = (A + B) / 2;
        const e = K.clamp(c.fin.sp / 1000 * 2 * U, 2, 44), en = K.clamp(c.fin.n / 1000 * 2 * U, 0, 34), nb = en ? yS - 8 : yS;
        let g = T(1060, 170, '범프 전체 옆모습 — 처마', 'pl-hdg', 'start');
        g += R(A, ySn, B - A, yNi - ySn, 'f-sn2', K.W({rx: 10}, tip('SnAg 솔더 12 µm — 보통 Cu 식각액에 덜 녹는다 (조성에 따라 다름 · 리플로우 전 원기둥)')));
        g += R(A, yNi, B - A, yCu - yNi, 'f-ni', tip('Ni 3 µm — 보통 Cu 식각액에 덜 녹는다'));
        g += PG([[A + e, yCu], [B - e, yCu], [B - e, nb], [B - e - en, yS], [A + e + en, yS], [A + e, nb]], 'f-cu2', tip('Cu 기둥 15 µm — 옆면이 처음부터 끝까지 녹아 얇아졌다'));
        g += PG([[A + e + en, yS], [B - e - en, yS], [B - e, yT], [A + e, yT]], 'f-seed2', tip('Cu 시드 (두께 과장)'));
        g += R(A - 20, yT, B - A + 40, 6, 'f-ti') + R(A - 20, yT + 6, B - A + 40, 14, 'f-pas');
        g += L(A, yCu, A, yT, 'pl-ghost') + L(B, yCu, B, yT, 'pl-ghost');
        g += L(A, 214, B, 214, 's-acc') + L(A, 206, A, 222, 's-acc') + L(B, 206, B, 222, 's-acc') + K.arrow(cx, 200, cx, 228, 's-arr');
        g += L(A + e, yS - 30, B - e, yS - 30, 'et04-dim') + L(A + e, yS - 38, A + e, yS - 22, 'et04-dim') + L(B - e, yS - 38, B - e, yS - 22, 'et04-dim');
        g += T(cx, 198, '위에서 재는 지름 = 모자', 't-dim') + T(cx, (ySn + yNi) / 2 + 7, 'SnAg', 'et04-on2') + T(cx, yS - 48, '실제 기둥', 'et04-on2');
        g += T(cx, yT + 50, '높이 · 지름 비율 그대로', 't-dim') + T(cx, yT + 74, '옆 깎임만 2배 과장', 't-dim');
        const tl = ['위의 Ni · SnAg는 Cu', '식각액에 덜 녹아', '기둥보다 넓어진다(처마).', '위에서 잰 지름(CD)으로는', '기둥 · 밑동 깎임이', '거의 안 보인다', '→ 기울인 SEM · 단면으로'];
        g += TT(1290, 226, tl, 't-sub', 'start', 30);
        g += T(1290, 226 + tl.length * 30 + 14, `기둥 옆 ${fmt(c.fin.sp)} · 홈 ${fmt(c.fin.n)} nm`, 't-warn', 'start');
        rt += G(LB(g), only('pillar'));
      }
      // area: 위에서 본 원 3개 (같은 크기로 그려 비율만 비교)
      {
        let ds = [10, 25, 40], hi = ds.indexOf(st.d);
        if (hi < 0){ hi = ds.reduce((b, v, i) => Math.abs(v - st.d) < Math.abs(ds[b] - st.d) ? i : b, 0); ds[hi] = st.d; }
        let g = T(1060, 170, '위에서 본 밑동 — 같은 깎임, 다른 지름', 'pl-hdg', 'start');
        ds.forEach((D, i) => {
          const x = 1140 + i * 160, a = areaOf(c.fin.sb, D), r = 66 * Math.max(0, 1 - 2 * c.fin.sb / 1000 / D), ar = Math.round(a * 100);
          if (i === hi) g += R(x - 78, 200, 156, 290, 'pl-hlbox', {rx: 10}) + T(x, 480, '← 위젯 지름', 't-dim');
          g += T(x, 232, `지름 ${D} µm`, 't-sub');
          g += C(x, 330, 66, 'et04-lost', tip(`깎여 나간 테두리 — 지름 ${D} µm, 한쪽 ${fmt(c.fin.sb)} nm`)) + C(x, 330, r, 'f-cu2', tip(`남은 밑면 ${ar} %`));
          g += T(x, 440, `${ar} %`, 't-lbl et04-' + judge(ar));
        });
        g += T(1300, 524, `남은 밑면적 — 밑동 깎임 ${fmt(c.fin.sb)} nm로 같을 때`, 't-sub') + T(1300, 556, '같은 크기로 그림 — 깎인 비율만 비교', 't-dim');
        rt += G(LB(g), only('area'));
      }
      put('[data-v="rt"]', rt);
      // ── 시간 막대 (0~250 s)
      const bx = v => BX0 + K.clamp(v / TMAX) * BW;
      let tb = LB(T(1060, 636, '시간 막대', 't-acc', 'start') + T(1540, 636, `전체 ${fmt(c.t)} s`, 'pl-val', 'end'));
      tb += R(BX0, 680, bx(c.t0) - BX0, 30, 'et04-tc', tip(`지움 시간 t₀ = ${fmt(c.t0)} s — 시드 ${st.h} nm ÷ ${RS} nm/분`)) + R(bx(c.t0), 680, bx(c.t) - bx(c.t0), 30, 'et04-toe', tip(`과식각 +${oeS} s (${st.oe} %)`)) + R(BX0, 680, BW, 30, 'et04-bar');
      for (let v = 0; v <= TMAX; v += 50) tb += L(bx(v), 710, bx(v), 718, 's-axis') + LB(T(bx(v), 738, v === TMAX ? `${v} s` : String(v), 't-dim', v === TMAX ? 'end' : 'middle'));
      tb += R(1062, 754, 18, 18, 'et04-tc') + R(1300, 754, 18, 18, 'et04-toe') + LB(T(1088, 770, `지움 t₀ ${fmt(c.t0)} s`, 't-sub', 'start') + T(1326, 770, `과식각 +${oeS} s (${st.oe} %)`, 't-sub', 'start'));
      [['iso', 0, '지금 t = 0'], ['clear', c.t0, '지금 t₀'], ['over pillar area', c.t, '지금 (끝)']].forEach(([sid, tv, lab]) => {
        const x = bx(tv), right = x > 1400;
        tb += G(P(`M${K.q1(x - 9)},652 L${K.q1(x + 9)},652 L${K.q1(x)},670 Z`, 'et04-mk') + LB(T(right ? x - 14 : x + 14, 668, lab, 't-warn', right ? 'end' : 'start')), only(sid));
      });
      put('[data-v="tb"]', tb);
      // ── 식 (지금 단계에 해당하는 줄 강조)
      const EQ = [['① 지움 t₀ = 시드 두께 ÷ 속도', `${fmt(c.t0)} s`, 'clear'], ['② 전체 t = t₀ × (1 + 과식각)', `${fmt(c.t)} s`, 'over'], ['③ 기둥 옆 = 도금 Cu 속도 × t', `${fmt(c.fin.sp)} nm`, 'pillar'], ['④ 밑동 = 기둥 옆 + 계면 홈', `${fmt(c.fin.sb)} nm`, 'over pillar'], ['⑤ 남은 밑면적 — 지름 작을수록 ↓', `${c.Ar} %`, 'area']];
      let eq = LB(T(1060, 840, '계산 — 개념 모델 (블랭킷 기준)', 't-acc', 'start'));
      EQ.forEach(([nm, v, sids], i) => {
        const y = 886 + i * 44;
        eq += G(R(1050, y - 30, 500, 42, 'et04-row', {rx: 8}), only(sids));
        eq += LB(T(1064, y, nm, 't-sub', 'start') + T(1536, y, v, 'pl-val' + (i === 4 ? ' et04-' + jc : ''), 'end'));
      });
      put('[data-v="eq"]', eq);
      ctx.refresh();
      // ── 결과 (KPI · 설명)
      ctx.out('k-t', `${fmt(c.t)} s`); ctx.out('k-sp', `${fmt(c.fin.sp)} nm`); ctx.out('k-sb', `${fmt(c.fin.sb)} nm`); ctx.out('k-a', `${c.Ar} %`);
      const ka = ctx.card.querySelector('[data-o="k-a"]');
      if (ka){ const p = ka.parentNode; p.classList.toggle('ok', jc === 'ok'); p.classList.toggle('warn', jc === 'wn'); p.classList.toggle('ng', jc === 'ng'); }
      const verdict = c.A <= 0 ? '밑동이 다 깎여 범프가 떨어집니다' : jc === 'ok' ? '여유가 있습니다' : jc === 'wn' ? '경계입니다' : '많이 줄었습니다';
      const m = ctx.q('[data-o="msg"]');
      if (m) m.innerHTML = `과식각 ${st.oe} %로 기둥이 한쪽 약 ${fmt(Math.round(c.fin.sp / 10) * 10)} nm 얇아져${c.fin.n > 0.5 ? ` (계면 홈 ${fmt(c.fin.n)} nm 더해 밑동 ${fmt(c.fin.sb)} nm)` : ''}, 지름 ${st.d} µm 범프의 밑면적이 처음의 ${c.Ar} %입니다 — ${verdict}. 과식각을 줄이려면 '왜 그만큼 필요한가'(가장 늦은 곳, <a data-go="end.time">07장</a>)를 먼저 봅니다.`;
    }
    // 손으로 움직이면 그 값을 그대로 둔다. 바뀐 것이 보이는 단계로 넘긴다
    function jump(id){
      const sid = ctx.step();
      if (!sid) return;
      if (id === 'oe' && (sid === 'iso' || sid === 'clear')) ctx.go('over');
      else if (id === 'd' && sid !== 'area' && sid !== 'clear' && sid !== 'over') ctx.go('area');
      else if (id === 'itf' && (sid === 'iso' || sid === 'clear' || sid === 'area')) ctx.go('pillar');
    }
    IDS.forEach(id => ctx.range(id, v => { st[id] = v; render(); return FMT[id](v); }));
    ctx.seg('itf', (v, user) => { st.itf = v; render(); if (user){ touched = true; jump('itf'); } });
    IDS.forEach(id => { const i = inp(id); if (i) i.addEventListener('input', () => { touched = true; jump(id); }); });
    ctx.demo = sid => {
      if (touched) return ctx.refresh();
      Object.assign(st, DEF, DEMO[sid] || {});
      IDS.forEach(id => { const i = inp(id); if (i) i.value = st[id]; ctx.out(id, FMT[id](st[id])); });
      setSeg(st.itf);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['등방성 식각', '모든 방향으로 비슷한 빠르기로 녹이는 식각 (습식 금속 식각 대부분)'],
      ['이방성 식각', '한 방향(보통 아래)으로 더 빨리 녹이는 식각 (플라즈마 · 이온빔, 결정 방향을 타는 일부 습식)'],
      ['언더컷', '위 막 가장자리 아래로 파여 들어간 거리. 여기서는 범프 밑동이 처음 테두리보다 안쪽으로 들어간 거리'],
      ['지움 시간 · 과식각', '지움 시간 = 막이 다 녹을 때까지, 과식각(오버에치) = 그 뒤 더 주는 시간. 과식각 % = (레시피 시간 − 기준 지움 시간) ÷ 기준 지움 시간 — 기준이 블랭킷 계산(이 장)인지 실제 끝점(가장 늦은 곳, <a data-go="end.time">07장</a>)인지 함께 적는다'],
      ['블랭킷', '무늬 없이 웨이퍼 전체에 고르게 깔린 막. 블랭킷 속도 = 무늬 · 틈의 영향이 없는 기준 속도'],
      ['처마', '식각 뒤 Cu 기둥보다 넓게 남은 Ni · SnAg 모자 가장자리'],
      ['계면 홈 (노치)', '두 막이 만나는 경계가 먼저 파여 생긴 좁은 홈. 여기서는 도금 Cu 기둥과 스퍼터 Cu 시드 사이'],
      ['자기 풀림 (셀프 어닐)', '도금 Cu 결정이 상온에서 몇 시간~몇 주 사이 저절로 커지는 현상 (→ <a href="#go-plating-06">전해도금 06장</a>)']
    ]) + K.field([
      '언더컷과 기둥 얇아짐은 위에서 보면 SnAg 모자 · Ni에 가려 거의 안 보입니다. 식각 뒤에는 모자가 기둥보다 조금 넓어지기 때문입니다(처마). 표본을 골라 <b>기울인 SEM · FIB 단면</b>으로 Cu 기둥 · Cu 시드 · Ti를 따로 잽니다. 범프를 밀어 떼어 낸 자리에 남은 Ti 발자국으로도 봅니다. 위에서 본 지름(CD)은 모자 쪽 손상만 알려 줍니다.',
      '과식각 %를 바꾸기 전에 \'왜 그만큼 필요한가\'(가장 늦은 곳)를 먼저 봅니다. 레시피 시간이 정해져 있으면 시드가 얇은 곳(PVD 두께 산포 · PR 스트립에서 얇아진 곳, <span class="pl-tag up">앞 공정</span>)이 먼저 지워져 과식각을 가장 오래 받습니다 → <a href="#go-strip-07">PR 스트립 07장</a>. 시드 두께 산포와 장비의 웨이퍼 안 속도 차이(<span class="pl-tag hw">식각-장비</span>)를 줄이면 과식각을 줄일 수 있습니다 → <a data-go="end.time">07장</a>.',
      '범프가 작아질수록 같은 깎임이 면적에서 더 큽니다. 새 제품의 범프 지름 · 피치가 작아지면 식각 조건(시드 두께 · 과식각 · 식각액)을 다시 봅니다.',
      '도금 Cu 결정(전류밀도 · 첨가제 · 도금 뒤 대기 시간)이 바뀌면 기둥 얇아짐 · 계면 홈이 달라질 수 있습니다(<span class="pl-tag up">앞 공정</span>) → <a href="#go-plating-06">전해도금 06장</a>. Ti를 지울 때 기둥 밑 Ti가 더 파이는 것(Ti 언더컷)은 <a data-go="galv.bump">05장</a> · <a data-go="ti.hf">06장</a>.',
      '언더컷이 커지면 세정 · 리플로우 · 본딩의 힘과 열에서 밑동 균열 · 범프 탈락이 늘 수 있습니다(<span class="pl-tag dn">뒤 공정</span>) → <a data-go="defects.over">09장</a>. 식각으로 겉이 새로 드러난 Cu 기둥 옆면은 리플로우에서 솔더가 흘러내리는 길이 되기도 합니다 → <a href="#go-reflow-04">리플로우 04장</a>.'
    ]) + K.deep(`<p>이 장 위젯의 식 (개념 모델, r_s = 스퍼터 Cu 속도, k_p = 도금 Cu 배수, f = 계면 계수):</p>
      ${K.eq('t₀ = h ÷ r_s,   t = t₀ × (1 + 과식각)')}${K.eq('s_p = k_p · r_s · t')}${K.eq('n = f · k_p · r_s · (t − t₀)')}${K.eq('남은 밑면적 = (1 − 2(s_p + n) ÷ D)²')}
      <p><b>위젯 상수</b> — 스퍼터 Cu 300 nm/분(기준 액 · 블랭킷), 도금 Cu 배수 1.3(예시, 범위 0.8~2.5), 계면 '약함' = 과식각 동안 계면이 기둥 옆면보다 1.5배 더 옆으로(예시), 밑면적 판정 92 · 85 %(예시). 기본값(300 nm · 30 % · ×1.3 · 25 µm)에서 t₀ 60 s, t 78 s, 옆 깎임 약 507 nm, 밑면적 약 92 %입니다. 식각액은 첨가제 없는 등방성 액으로 가정합니다.</p>
      <ul><li><b>등방성 단면</b> — 이상적 등방성 식각에서 마스크 가장자리 아래 단면은 반지름 = 식각 깊이인 사분원입니다. 막을 다 뚫은 뒤에는 옆으로만 나아가, 언더컷 ≈ 막 두께 + 옆 속도 × 과식각 시간입니다. Cu 기둥처럼 '마스크'도 같은 금속이면, 기둥 옆면은 전체 시간 동안 줄어듭니다. 기둥과 시드가 같은 빠르기라면 아래로 d 만큼 녹았을 때 기둥 옆면은 d, Ti 위 시드 맨 아래 구석은 √(d² − h²)만큼만 물러나 작은 발이 남습니다(예: h 300 nm, d 390 nm → 발 폭 약 140 nm). 그림의 둥근 구석이 이것이고, 좁은 구석은 액도 늦게 바뀌어 실제로는 더 남기도 합니다(→ <a data-go="rate.which">03장</a>).</li>
      <li><b>옆 식각을 줄이는 식각액</b> — 미세 재배선 · 기판 미세 배선 · 범프용으로, 억제제(첨가제)가 뿌린 액을 정면으로 세게 받는 바닥(범프 사이 시드)보다 흐름이 약한 기둥 옆면 · 구석에 더 오래 붙어 옆 식각을 늦추도록 만든 Cu 식각액이 공개 연구 · 특허에 있습니다. 이런 액은 완전한 등방성이 아니어서 스프레이 세기 · 회전 · 유량과 첨가제 농도가 함께 언더컷을 바꾸고, 첨가제가 쓰이거나 분해되면(액 나이, <a data-go="tool.bath">08장</a>) 언더컷이 다시 커질 수 있습니다.</li>
      <li><b>도금 Cu vs 스퍼터 Cu</b> — 공개 보고: 풀림 안 된 도금 Cu가 스퍼터 Cu보다 약 2.5배 빨리 녹았습니다(묽은 황산 + 과산화수소, 블랭킷). 풀림 · 결정 · 조건에 따라 차이는 줄어들 수 있어 위젯 기본값 1.3은 예시입니다. 결정이 잘고 결함 · 불순물이 많을수록 빠르고, (111) 방향 결정이 많은 면은 느리다는 보고가 있습니다. 그래서 도금 조건이 식각 모양을 바꿉니다.</li>
      <li><b>계면 언더컷 보고</b> — 지름 25 µm · 피치 55 µm Cu 기둥(황산 + 과산화수소 식각)에서 기둥–시드 계면 언더컷이 도금 전류밀도를 올림에 따라 약 0.4 µm → 1.7 µm로 커졌다는 공개 연구가 있습니다(결정 방향 차이). 위젯의 '약함'(f = 1.5)은 이런 경향을 보이려는 예시 값입니다.</li>
      <li><b>작은 범프일수록</b> — 남은 밑면적 = (1 − 2s/D)². 계산 예: 지름 4 µm 범프는 한쪽 0.27 µm만 깎여도 밑면적이 약 25 % 줄어듭니다. 6 µm 피치에서는 습식 시드 식각이 언더컷 때문에 실용적이지 않아 이온빔 제거가 연구되었다는 보고가 있습니다.</li>
      <li><b>재배선(RDL) 사례</b> — 눈으로 다 지워진 뒤 50~200 % 과식각이 필요하고, 300 nm 시드에 100 % 과식각이면 도금 Cu도 약 600 nm 깎인다는 공개 자료가 있습니다. 그래서 시드를 얇게 하려는 연구가 있지만, 얇은 시드는 도금 균일도(터미널 효과)에 불리합니다 (→ <a href="#go-plating-07">전해도금 07장</a>).</li>
      <li><b>신뢰성</b> — 큰 솔더 범프(C4) 공개 특허에는 약 4 µm를 넘는 언더컷이 이른 피로 파괴로 이어졌다는 기술이 있습니다. 밑동의 날카로운 홈은 응력이 모이는 자리가 됩니다.</li>
</ul>`);
  },
  css: `.et04-tc{fill:#38bdf8}
.et04-toe{fill:#f59e0b}
.et04-bar{fill:none;stroke:#8fa6c6;stroke-width:1.2}
.et04-mk{fill:#fbbf24}
.pl-svg .et04-dim{fill:none;stroke:#fbbf24;stroke-width:2}
.pl-svg .et04-fr{fill:none;stroke:#38bdf8;stroke-width:3.2}
.et04-liq{fill:#0e2a33}
.et04-if{fill:none;stroke:rgba(70,34,10,.75);stroke-width:1.5;stroke-dasharray:7 5}
.et04-lost{fill:rgba(239,68,68,.4);stroke:#94a3b8;stroke-width:1.5;stroke-dasharray:5 4}
.et04-zb{fill:#060c18;stroke:#7dd3fc;stroke-width:1.6}
.et04-zr{fill:none;stroke:#7dd3fc;stroke-width:1.6;stroke-dasharray:5 4}
.et04-row{fill:rgba(56,189,248,.10);stroke:#38bdf8;stroke-width:1.6}
.pl-svg .et04-on{font-size:24px;font-weight:800;fill:#2a1606 !important;stroke:none !important}
.pl-svg .et04-on2{font-size:19px;font-weight:700;fill:#2a1606 !important;stroke:none !important}
.pl-svg .et04-cap{font-size:21px;font-weight:600;fill:#dbe4f0 !important}
.pl-svg .et04-ax{fill:none;stroke:#2a1606;stroke-width:1.8;stroke-dasharray:16 6 3 6;opacity:.75}
.pl-svg .et04-ok{fill:#4ade80 !important}
.pl-svg .et04-wn{fill:#fbbf24 !important}
.pl-svg .et04-ng{fill:#f87171 !important}`
});
})();
