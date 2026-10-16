/* 리플로우 08 — 장비 해부: 리플로우 장비 안에서는 무슨 일이 일어날까? (장비 · m) */
(function(){
// ── 개념 모델 (기획 rev.2 · 08장 · 사실 #42 · #44 · #52)
//  웨이퍼 열용량 C = ρ·c·t = 2,330 kg/m³ × 750 J/(kg·K) × 775 µm ≈ 1,354 J/(m²·K)
//  판(근접 가열, 웨이퍼는 늘 핀 위): h = k_N₂ / (틈 + 5λ) + h_rad, k_N₂ 0.037 W/(m·K)(약 200 °C), h_rad 10 W/(m²·K)(예시)
//    λ = N₂ 평균 자유 경로 ≈ 0.112 µm × 1013 / P[mbar] (약 250 °C) — 1기압 0.11 · 50 mbar 2.3 · 1 mbar 113 µm
//    가운데 틈 = g + max(0, −w) · 가장자리 틈 = g + max(0, w)   (w > 0 가장자리 들림 · w < 0 가운데 들림)
//  대류 오븐: h = 100 W/(m²·K)(양면 합, 예시) → τ ≈ 13.5 s, 가장자리는 0.95배 (휨 영향 거의 없음)
//  τ = C / h,  승온 중 온도 차 ΔT = 두 곡선 차이의 최댓값 (꾸준히 오르면 ≈ r·|τ_e − τ_c|),  녹임 끝 부족 = r·τ·e^(−30/τ) (머무름 30 s 가정, 메시지만)
//  산소 퍼지(완전 혼합): 210,000 → 20 ppm = ln(10,500)/n 분 ≈ 9.26/n
//  검산: 판 1기압 · 틈 100 → τ 3.6 s / 휨 +100 → 7.0 s · 6.8 °C / +150 → 8.6 s · 10.0 °C / +300 → 13.2 s · 19.3 °C
//        휨 −150 → 가운데 8.6 s / 틈 300 → 10.2 s / 대류 13.5 s / 50 mbar 4.0 s(+100 → 7.3 s) / 1 mbar 20.7 s(+100 → 23.3 s) / n 5 → 1.85분 · n 2 → 4.6분
const CW = 2330 * 750 * 775e-6, KN = 0.037, HRAD = 10, LAM0 = 0.112, HCV = 100;
const PRS = {ov: 1013, hp: 1013, v50: 50, v1: 1};
const MN = {ov: '대류 오븐', hp: '판 — 질소 1기압', v50: '판 — 진공 50 mbar', v1: '판 — 진공 1 mbar'};
const DEF = {m: 'hp', g: 100, w: 0, r: 2, n: 5};
// 발표 모드 · 손대기 전 단계마다 보여 줄 값 (기본값 + 적힌 값만 덮어씀)
const DEMO = {oven: {m: 'ov'}, plate: {w: 150}, gas: {n: 2}, vac: {m: 'v1'}, clean: {}};
const LNP = Math.log(210000 / 20);                                   // 공기 21 % → 20 ppm: 약 9.26번의 부피 교환
const f1 = v => v.toFixed(1), f0 = v => String(Math.round(v));
const fmin = t => t < 2 ? t.toFixed(2) : t.toFixed(1);
const f2s = v => v >= 10 ? String(Math.round(v / (v >= 100 ? 10 : 1)) * (v >= 100 ? 10 : 1)) : v.toFixed(1);   // λ 표시: 유효숫자 둘 (113 → 110)
const lamOf = m => LAM0 * 1013 / PRS[m];
function calc(s){
  const gc = s.g + Math.max(0, -s.w), ge = s.g + Math.max(0, s.w);
  let tc, te, lam = null;
  if (s.m === 'ov'){ tc = CW / HCV; te = 0.95 * tc; }
  else {
    lam = lamOf(s.m);
    const h = g => KN / ((g + 5 * lam) * 1e-6) + HRAD;
    tc = CW / h(gc); te = CW / h(ge);
  }
  const dT = s.r * Math.abs(te - tc), slow = te > tc + 1e-9 ? 'e' : tc > te + 1e-9 ? 'c' : '';
  const ts = Math.max(tc, te), def = s.r * ts * Math.exp(-30 / ts), tO2 = LNP / s.n;
  // 틈 전도의 몫 (1기압 대비, 가운데 틈)
  const cond = lam == null ? null : (gc + 5 * LAM0) / (gc + 5 * lam);
  return {gc, ge, tc, te, lam, dT, slow, def, tO2, cond};
}
// 설정: 승온 r 로 255 °C까지 올린 뒤 유지. 가운데 · 가장자리 웨이퍼 온도 = 1차 지연 (dt 0.25 s, 0.5 s마다 기록)
function sim(s, c){
  const tr = 230 / s.r, t0 = Math.max(0, Math.floor((95 / s.r - 5) / 10) * 10);
  // 끝: 늦은 쪽이 거의 따라잡을 때까지 (설정이 255 °C에 닿는 자리가 가로 77 % 안에 오게)
  const tE = Math.max(t0 + 60, Math.ceil(Math.max(tr + 3 * Math.max(c.tc, c.te) + 10, t0 + (tr - t0) / 0.77) / 10) * 10);
  const S = t => Math.min(255, 25 + s.r * t), pts = [];
  let Tc = 25, Te = 25, k = 0, dmax = 0, tmax = tr, lmax = 0;
  for (let t = 0; t <= tE + 1e-9; t += 0.25, k++){
    if (k % 2 === 0) pts.push([t, S(t), Tc, Te]);
    if (k % 2 === 0 && Math.abs(Tc - Te) > dmax + 1e-9){ dmax = Math.abs(Tc - Te); tmax = t; }
    lmax = Math.max(lmax, S(t) - Math.min(Tc, Te));                   // 설정보다 가장 많이 늦은 °C (꾸준히 오르면 ≈ r·τ)
    Tc += (S(t) - Tc) / c.tc * 0.25; Te += (S(t) - Te) / c.te * 0.25;
  }
  return {tr, t0, tE, pts, dmax, tmax, lmax};
}
const at = (sm, t) => sm.pts.find(p => p[0] >= t - 1e-9) || sm.pts[sm.pts.length - 1];
// 대류 오븐 그림: 구역마다 20 s 머문다고 가정(예시), τ = 대류 13.5 s
const ZT = [150, 180, 230, 265, 60], ZN = ['예열 1', '예열 2', '녹임 1', '녹임 2', '냉각'];
function ovenSim(){
  const tau = CW / HCV, pts = [];
  let T = 25;
  for (let k = 0; k < 5; k++) for (let i = 0; i < 80; i++){ pts.push([k * 20 + i * 0.25, T]); T += (ZT[k] - T) / tau * 0.25; }
  pts.push([100, T]);
  return pts;
}
// 온도 → 색 (25 °C 파랑 → 265 °C 빨강)
const tcol = (K, T) => K.heat(K.clamp((T - 25) / 240));
// 돌아가는 날개 (송풍기 · 펌프)
function fan(K, cx, cy, r, cls, dur){
  const b = r * 0.78, q = K.q1;
  const blade = a => { const s = Math.sin(a), c = Math.cos(a); return `M${q(cx)},${q(cy)} L${q(cx + b * s)},${q(cy - b * c)} A${q(b * 0.42)},${q(b * 0.42)} 0 0 1 ${q(cx + b * 0.55 * Math.sin(a + 1.1))},${q(cy - b * 0.55 * Math.cos(a + 1.1))} Z`; };
  return K.C(cx, cy, r, cls) + `<g><path d="${blade(0)} ${blade(2.094)} ${blade(4.189)}" class="rf08-blade"/><animateTransform attributeName="transform" type="rotate" from="0 ${q(cx)} ${q(cy)}" to="360 ${q(cx)} ${q(cy)}" dur="${dur}s" repeatCount="indefinite"/></g>`;
}
// 제자리에서 흔들리는 작은 분자 (글자 없는 점)
function jig(K, x, y, cls, seed, amp = 8, r = 6){
  const g = K.rng(seed * 31 + 7), q = K.q1;
  let d = `M${q(x)},${q(y)}`;
  for (let k = 0; k < 4; k++) d += ` L${q(x + (g() - 0.5) * 2 * amp)},${q(y + (g() - 0.5) * 2 * amp)}`;
  return `<circle r="${r}" class="${cls}"><animateMotion dur="${q(2.6 + g() * 1.6)}s" begin="-${q(g() * 3)}s" repeatCount="indefinite" path="${d} Z"/></circle>`;
}
// 구형 모자 (돔): 가운데 cx, 바닥선 y0, 바닥 반폭 a(px), 높이 h(px)
const cap = (cx, y0, a, h) => { const R = (a * a + h * h) / (2 * h); return `M${cx - a},${y0} A${R.toFixed(1)},${R.toFixed(1)} 0 ${h > a ? 1 : 0} 1 ${cx + a},${y0} Z`; };

// 좁은 세로 화면 전용 확대 (위쪽 장비 그림의 핵심 자리)
//  (상자 경계가 글자를 가로지르지 않게 고른 자리)
const VN = {
  oven: {x: 640, y: 190, w: 612, h: 386},      // 녹임 구역 둘 + 작은 프로파일 (웨이퍼 최고 < 설정)
  plate: {x: 600, y: 126, w: 420, h: 420},     // 틈 확대 + 녹임판
  gas: {x: 40, y: 186, w: 900, h: 380},        // 버블러 + 챔버
  vac: {x: 716, y: 182, w: 836, h: 320},       // 압력–시간 + 틈 속 분자 (50 · 1 mbar)
  clean: {x: 50, y: 172, w: 890, h: 256}       // 바르기 → 리플로우 → 세정
};
// 아래 그래프 축
const GX0 = 880, GX1 = 1530, GY0 = 990, GY1 = 690;
const gy = T => GY0 - (T - 120) / 150 * (GY0 - GY1);                  // 120~270 °C (승온 후반 · 녹임 구간을 크게)
const gyl = ppm => GY0 - Math.log10(Math.max(1, ppm)) / 5.5 * (GY0 - GY1);   // 1 ~ 316,000 ppm (로그)

(window.EngrReflowChapters = window.EngrReflowChapters || []).push({
  no: '08', id: 'tool', part: 3, short: '장비 해부', scale: '장비 · m',
  title: '장비 해부 — 리플로우 장비 안에서는 무슨 일이 일어날까?',
  hook: '웨이퍼는 설정을 늦게 따른다',
  one: '웨이퍼 리플로우 장비는 크게 뜨거운 기체로 데우는 대류 오븐과, 뜨거운 판 위에서 데우는 판(전도) 방식이 있습니다. 어느 쪽이든 질소로 산소를 밀어내고, 필요하면 포름산을 넣거나 진공을 겁니다. 웨이퍼 온도는 설정 온도를 늦게 따라가며, 휨 · 간격이 그 늦음을 바꿉니다.',
  ana: '<b>오븐과 프라이팬</b> — 오븐(대류)은 뜨거운 공기로 천천히 고르게, 프라이팬(판)은 맞닿은 면으로 빠르게 데웁니다. 팬에서 들뜬 부분은 늦게 익습니다. <i>(비유의 한계: 웨이퍼는 보통 판에 직접 닿지 않고 아주 얇은 기체 틈(약 0.1 mm)을 두고 데워져, 틈의 폭이 데우는 빠르기를 정합니다. 수십 mbar 진공에서도 그 틈의 기체는 열을 거의 그대로 나르지만, 아주 높은 진공(약 1 mbar 아래)에서는 그 기체도 열을 거의 못 나릅니다.)</i>',
  steps: [
    {id: 'oven', t: '대류 오븐 — 구역을 지나며', d: '웨이퍼가 이송 장치를 타고 온도가 다른 구역(예열 · 녹임 · 냉각)을 차례로 지납니다. 뜨거운 질소를 불어 데우므로 고르지만 느리고(열 지연이 큼), 구역 온도 · 이송 속도 · 바람 세기로 프로파일을 맞춥니다.', viewN: VN.oven},
    {id: 'plate', t: '판(전도) 방식 — 판에서 판으로', d: '온도가 다른 판 여러 개 위로 웨이퍼를 옮기거나 한 판의 온도를 바꿉니다. 웨이퍼는 핀 위에 떠 얇은 기체 틈으로 데워져 빠르고, 판보다 뜨거워지지 않습니다. 대신 웨이퍼가 휘면 틈이 달라져 가운데와 가장자리 온도가 벌어집니다.', viewN: VN.plate},
    {id: 'gas', t: '분위기 — 질소 · 산소 · 포름산', d: '문을 닫고 질소로 공기를 밀어내(진공 챔버는 빼고 채우기를 되풀이) 산소를 수십 ppm 아래로 낮춥니다(산소 센서로 확인). 포름산은 질소에 실어 넣고, 반응한 기체와 남은 증기는 배기로 빼서 처리합니다. 배관 · 배기에 찌꺼기가 쌓이면 웨이퍼에 떨어질 수 있습니다.', viewN: VN.gas},
    {id: 'vac', t: '진공 — 기포를 빼는 단계', d: '진공 챔버는 솔더가 녹아 있을 때 압력을 낮춥니다. 판 방식은 수십 mbar에서도 0.1 mm 틈의 질소가 열을 거의 그대로 나르고 약 1 mbar 아래에서야 크게 줄지만, 뜨거운 기체를 불어 데우는 방식은 압력과 함께 바로 줄어듭니다. 그래서 보통 기체 속에서 데우고, 녹은 구간에서만 압력을 낮췄다가 굳기 전에 되돌립니다.', viewN: VN.vac},
    {id: 'clean', t: '플럭스를 쓰면 — 바르고 씻기', d: '플럭스 방식에서는 리플로우 전에 플럭스를 얇게 바르고(스핀 · 분사), 리플로우 뒤 물이나 약품으로 찌꺼기를 씻어 냅니다. 범프 사이 좁은 틈의 찌꺼기는 잘 안 빠져 다음 공정의 접착 · 접합 불량이 됩니다. 이어 후처리 플라즈마와 세정을 거칩니다.', viewN: VN.clean}
  ],
  icon(K){
    const {R, L, P} = K;
    return R(4, 40, 58, 8, 'rf08-plate', {style: 'fill:#ef4444'}) + R(8, 30, 50, 4, 'f-wafer') + L(14, 34, 14, 40, 's-edge') + L(52, 34, 52, 40, 's-edge') + P('M12,24 q4,-6 0,-12 M33,24 q4,-6 0,-12 M54,24 q4,-6 0,-12', 's-arr2');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, TT, tip, only, W, wrap, arrow, arrowP} = K;
    let s = '';
    // ════════ 위: 장비 그림 (단계마다)
    s += R(40, 118, 1520, 462, 'pl-panel', {rx: 16});

    // ── oven: 대류 오븐 터널 (옆 단면)
    {
      let o = T(64, 158, '대류 오븐 — 구역을 지나며 (옆 단면 · 예시)', 't-acc', 'start') + T(1536, 158, '손잡이: 구역 온도 · 이송 속도 · 바람 세기', 't-dim', 'end');
      o += G(arrow(780, 190, 780, 148, 's-arr') + arrow(880, 190, 880, 148, 's-arr') + LB(T(830, 176, '배기', 't-dim')), tip('배기 — 데우며 나온 기체 · 용제 증기를 뺀다'));
      o += R(60, 192, 1480, 240, 'rf08-tun', W({rx: 18}, tip('대류 오븐 터널 — 뜨거운 질소를 불어 웨이퍼를 데운다')));
      for (let k = 0; k < 5; k++){
        const x = 60 + 296 * k, cool = k === 4;
        o += R(x + 3, 196, 290, 232, 'rf08-zone', W({style: `fill:${K.heat(ZT[k] / 300)}`}, tip(`${ZN[k]} 구역 — 설정 ${ZT[k]} °C (예시)\n웨이퍼는 이 온도를 늦게 따라간다`)));
        if (k) o += L(x, 198, x, 426, 'rf08-zl');
        o += G(fan(K, x + 148, 224, 17, 'rf08-fan', cool ? 1.6 : 1.1), tip(cool ? '송풍기 — 차가운 질소로 식힌다' : '송풍기 — 뜨거운 질소를 아래로 분다'));
        for (let j = 0; j < 3; j++){ const xa = x + 78 + 70 * j; o += arrow(xa, 250, xa, 298, cool ? 's-arr' : 's-arr2'); }
        o += LB(T(x + 148, 338, ZN[k], 't-sub') + T(x + 148, 364, ZT[k] + ' °C', cool ? 't-acc' : 't-warn'));
      }
      o += G(L(70, 198, 70, 426, 's-flow') + L(1530, 198, 1530, 426, 's-flow'), tip('질소 커튼 — 입구 · 출구에서 질소를 세로로 흘려 바깥 공기가 들어오지 못하게 막는다'));
      o += LB(T(84, 396, '입구 · N₂ 커튼', 't-dim', 'start') + T(1516, 396, 'N₂ 커튼 · 출구', 't-dim', 'end'));
      o += L(66, 418, 1534, 418, 'rf08-belt');
      for (let x = 96; x < 1530; x += 60) o += C(x, 424, 5.5, 'rf08-roll');
      // 이송 장치 위를 지나가는 웨이퍼 — 색 = 웨이퍼 온도 (늦게 따라간다)
      const op = ovenSim(), Tat = t => { const p = op.find(q => q[0] >= t) || op[op.length - 1]; return p[1]; };
      const cols = [];
      for (let i = 0; i <= 12; i++){ const xc = 130 + 1330 * i / 12; cols.push(tcol(K, Tat((xc - 60) / 14.8))); }
      o += `<rect x="0" y="406" width="120" height="10" rx="2" class="rf08-wv" fill="${cols[0]}" data-tip="웨이퍼 — 색이 웨이퍼 온도 (구역 온도를 늦게 따라간다)"><animate attributeName="fill" values="${cols.join(';')}" dur="12s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" from="70 0" to="1400 0" dur="12s" repeatCount="indefinite"/></rect>`;
      // 작은 프로파일: 구역 설정(계단) vs 웨이퍼 (구역마다 20 s, τ 13.5 s 예시)
      const my = Tv => 562 - (Tv - 25) / 245 * 104, ox = t => 60 + t * 14.8;
      o += R(60, 446, 1480, 124, 'rf08-mg', {rx: 10});
      let dz = `M60,${f1(my(ZT[0]))}`;
      ZT.forEach((v, k) => { dz += ` L${60 + 296 * k},${f1(my(v))} L${60 + 296 * (k + 1)},${f1(my(v))}`; });
      o += P(dz, 's-curve2', tip('구역 설정 온도 (계단)'));
      let dw = '', pk = 0, tpk = 0;
      op.forEach(([t, Tv], i) => { dw += (i ? ' L' : 'M') + f1(ox(t)) + ',' + f1(my(Tv)); if (Tv > pk){ pk = Tv; tpk = t; } });
      o += P(dw, 's-curve', tip('웨이퍼 온도 — 구역마다 20초 머문다고 가정 (τ 13.5초, 예시)'));
      o += C(ox(tpk), my(pk), 6, 'k-acc2');
      o += LB(L(76, 470, 112, 470, 's-curve2') + T(120, 477, '구역 설정', 't-dim', 'start') + L(76, 494, 112, 494, 's-curve') + T(120, 501, '웨이퍼 (예시)', 't-dim', 'start'));
      o += LB(T(1096, 530, `웨이퍼 최고 ≈ ${f0(pk)} °C`, 't-warn') + T(1096, 556, '(설정 265 °C보다 낮다)', 't-dim'));
      s += G(o, only('oven'));
    }

    // ── plate: 판 세 장 + 옮기는 팔 + 틈 확대
    {
      let o = T(64, 158, '판(전도) 방식 — 판에서 판으로 (예시)', 't-acc', 'start');
      o += LB(T(64, 206, '좋은 점', 'pl-hdg', 'start') + T(64, 234, '· 빠르다 — 얇은 기체 틈으로 데운다', 't-dim', 'start') + T(64, 260, '· 판보다 뜨거워지지 않는다', 't-dim', 'start'));
      o += LB(T(64, 298, '조심할 점', 'pl-hdg2', 'start') + T(64, 326, '· 휘면 틈이 달라진다 → 아래 그림', 't-dim', 'start'));
      o += LB(T(1040, 206, '구성 (예시)', 'pl-hdg3', 'start') + TT(1040, 234, ['· 온도마다 판을 따로 두고 옮긴다', '· 한 판의 온도를 바꾸는 방식도 있다', '· 판 여러 장으로 함께 처리 (처리량)'], 't-dim', 'start', 26));
      const PX = [100, 610, 1120], PT = [170, 255, 40], PN = ['예열판', '녹임판', '냉각판'], PD = ['용제 · 온도 맞춤', '녹임 · 머무름', '굳힘'];
      PX.forEach((x, k) => {
        o += R(x, 430, 380, 40, 'rf08-plate', W({rx: 6, style: `fill:${K.heat(PT[k] / 300)}`}, tip(`${PN[k]} ${PT[k]} °C (예시)\n웨이퍼는 판 위 핀에 떠서 기체 틈으로 데워진다`)));
        [60, 187, 314].forEach(dx => { o += R(x + dx, 410, 6, 20, 'rf08-pin'); });
        o += R(x + 20, 401, 340, 9, 'pl-ghost', {rx: 2});
        o += LB(T(x + 190, 504, `${PN[k]} · ${PT[k]} °C`, 't-sub') + T(x + 190, 530, PD[k], 't-dim'));
      });
      o += G(arrowP('M470,384 Q545,318 620,384', 's-arr3') + arrowP('M980,384 Q1055,318 1130,384', 's-arr3'), tip('옮기는 팔 — 웨이퍼를 다음 판으로 옮긴다'));
      o += LB(T(545, 304, '옮기는 팔', 't-dim'));
      // 판에서 판으로 옮겨 다니는 웨이퍼 (색 = 웨이퍼 온도)
      const c1 = tcol(K, 170), c2 = tcol(K, 255), c3 = tcol(K, 40);
      o += `<rect x="120" y="401" width="340" height="9" rx="2" class="rf08-wv" fill="${c1}" data-tip="웨이퍼 — 판에서 판으로 옮겨 가며 데우고 식힌다"><animate attributeName="fill" values="${[c1, c1, c2, c2, c3, c3].join(';')}" keyTimes="0;.18;.34;.6;.76;1" dur="9s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;0 0;128 -38;255 -50;382 -38;510 0;510 0;638 -38;765 -50;892 -38;1020 0;1020 0" keyTimes="0;.18;.22;.26;.30;.34;.6;.64;.68;.72;.76;1" dur="9s" repeatCount="indefinite"/></rect>`;
      // 틈 확대 말풍선 (녹임판)
      let b = R(620, 132, 380, 212, 'pl-box', {rx: 14}) + L(810, 344, 800, 398, 's-dash');
      b += T(636, 162, '틈 확대 — 녹임판 (과장)', 't-acc', 'start');
      b += R(636, 180, 348, 14, 'f-wafer', tip('웨이퍼 (Si 775 µm)'));
      b += R(636, 244, 348, 26, 'rf08-plate', W({style: `fill:${K.heat(255 / 300)}`}, tip('녹임판 255 °C (예시)')));
      b += R(662, 194, 10, 50, 'rf08-pin', tip('핀 — 웨이퍼를 판에서 띄운다 (핀 높이 = 틈)'));
      for (const xa of [730, 800, 860]) b += arrow(xa, 240, xa, 200, 's-arr2');
      [[702, 222], [764, 210], [830, 228], [700, 236], [880, 208], [790, 232]].forEach(([x, y], k) => { b += jig(K, x, y, 'rf08-n2', k + 1, 7, 5); });
      b += L(960, 196, 960, 242, 'rf08-dim') + L(952, 196, 968, 196, 'rf08-dim') + L(952, 242, 968, 242, 'rf08-dim');
      b += `<g data-v="pgap"></g>`;
      b += LB(T(636, 298, '틈의 질소가 열을 나른다', 't-dim', 'start') + T(636, 324, '틈이 넓을수록 늦게 데워진다', 't-dim', 'start'));
      o += G(b, tip('틈 확대 — 판 → (질소가 든 틈) → 웨이퍼로 열이 건너간다.\n틈이 넓을수록 늦게 데워진다'));
      s += G(o, only('plate'));
    }

    // ── gas: 질소 · 포름산 · 산소 센서 · 배기 처리
    {
      let o = T(64, 158, '분위기 — 질소 · 산소 · 포름산 (구성 예시)', 't-acc', 'start');
      o += LB(T(64, 214, 'N₂ 공급', 't-sub', 'start'));
      o += P('M60,236 L300,236', 'pl-pipe') + P('M60,236 L300,236', 's-flow', tip('질소 — 챔버 속 공기(산소)를 밀어낸다'));
      o += P('M120,236 L120,452', 'rf08-tube') + P('M120,236 L120,452', 's-flow');
      o += R(84, 320, 112, 152, 'rf08-bub', W({rx: 10}, tip('포름산 버블러 — 액체 포름산에 질소를 불어 넣어 증기를 실어 보낸다')));
      o += R(88, 372, 104, 96, 'rf08-liq', {rx: 6});
      for (let k = 0; k < 6; k++) o += K.bubble(110 + (k % 3) * 28, 462, 4 + (k % 2) * 2, 84, 1.8 + (k % 3) * 0.4, k * 0.33);
      o += P('M172,320 L172,290 L300,290', 'pl-pipe') + P('M172,320 L172,290 L300,290', 's-flow2 rf08-faf', tip('질소 + 포름산 증기 → 챔버'));
      o += LB(T(140, 500, '포름산 버블러', 't-sub') + T(140, 526, 'HCOOH를 질소에 실어', 't-dim'));
      // 챔버
      o += R(300, 186, 620, 300, 'rf08-ch', W({rx: 16}, tip('챔버 — 문을 닫고 질소로 채운다')));
      o += LB(T(320, 216, '챔버 (문 닫힘)', 't-dim', 'start'));
      for (const y of [270, 322]) o += P(`M312,${y} C500,${y - 20} 700,${y + 20} 908,${y - 6}`, 's-flow');
      o += R(360, 424, 500, 30, 'rf08-plate', W({rx: 5, style: `fill:${K.heat(220 / 300)}`}, tip('판 (예시)')));
      [420, 610, 800].forEach(x => { o += R(x, 411, 6, 13, 'rf08-pin'); });
      o += R(380, 402, 460, 9, 'f-wafer', tip('웨이퍼'));
      const g = K.rng(81);
      for (let k = 0; k < 7; k++){ const y = 250 + g() * 110; o += K.mover(312, y, 908, y - 8 + g() * 16, 8, 'rf08-n2', 3.2 + g() * 1.4, g() * 4); }
      for (let k = 0; k < 3; k++){ const y = 255 + g() * 90; o += K.mover(330 + g() * 200, y, 912, 238 + g() * 10, 9, 'rf08-o2', 3 + g(), g() * 3); }
      for (let k = 0; k < 4; k++){ const y = 372 + g() * 18; o += K.mover(312, 292, 380 + k * 130, y, 8, 'rf08-hc', 2.6 + g(), g() * 2.6); }
      o += LB(C(316, 538, 7, 'rf08-n2') + T(330, 545, '질소 N₂', 't-dim', 'start') + C(470, 538, 7, 'rf08-o2') + T(484, 545, '산소 O₂ (밀려 나감)', 't-dim', 'start') + C(724, 538, 7, 'rf08-hc') + T(738, 545, '포름산 HCOOH', 't-dim', 'start'));
      // 배기 · 산소 센서 · 찌꺼기 · 배기 처리
      o += P('M920,236 L1190,236', 'pl-pipe') + P('M920,236 L1190,236', 's-flow', tip('배기 — 반응한 기체 · 남은 포름산 증기 · 밀려난 공기'));
      [944, 966, 1092, 1118, 1160].forEach((x, k) => { o += C(x, 238 + (k % 2), 4.2, 'rf08-fres'); });
      o += G(C(1040, 236, 20, 'rf08-sens') + C(1040, 236, 7, 'k-ok'), tip('산소 센서 — 챔버 · 배기의 산소 농도(ppm)'));
      o += LB(T(1040, 202, 'O₂ 센서', 't-sub'));
      o += R(950, 262, 190, 40, 'rf08-rob', {rx: 8}) + `<g data-v="o2r"></g>`;
      o += R(1190, 186, 350, 140, 'rf08-abate', W({rx: 12}, tip('배기 처리 장치 — 산 · 유기물 · 미세 입자를 걸러 낸다')));
      o += LB(T(1206, 220, '배기 처리 장치', 't-sub', 'start') + TT(1206, 252, ['산 · 유기물 · 미세 입자를', '걸러 낸다'], 't-dim', 'start', 25));
      o += C(966, 370, 6, 'rf08-fres');
      o += LB(T(982, 377, '찌꺼기 — 정기 점검(PM) 주기의 핵심', 'pl-hdg2', 'start') + TT(966, 408, ['포름산 주석 · 주석 안개가 배관 · 배기에 쌓이고,', '떨어지면 웨이퍼의 입자 · 얼룩이 된다 (09장)'], 't-dim', 'start', 25));
      o += LB(T(966, 474, 'O₂가 갑자기 오르면', 'pl-hdg', 'start') + TT(966, 502, ['문 실링 · 질소 공급 압력 · 배기 균형 ·', '센서 교정부터 본다'], 't-dim', 'start', 25));
      s += G(o, only('gas'));
    }

    // ── vac: 진공 챔버 · 펌프 · 압력계 · 압력–시간 · 틈 속 분자
    {
      let o = T(64, 158, '진공 — 녹아 있는 동안만 압력을 낮춘다', 't-acc', 'start');
      o += R(64, 190, 520, 290, 'rf08-ch', W({rx: 16}, tip('진공 챔버')));
      o += LB(T(84, 220, '진공 챔버', 't-dim', 'start'));
      o += R(104, 414, 440, 30, 'rf08-plate', W({rx: 5, style: `fill:${K.heat(255 / 300)}`}, tip('판 (예시)')));
      [150, 320, 490].forEach(x => { o += R(x, 401, 6, 13, 'rf08-pin'); });
      o += R(124, 392, 400, 9, 'f-wafer', tip('웨이퍼 — 솔더가 녹아 있는 동안만 진공'));
      [[180, 300], [300, 260], [420, 330], [250, 360], [480, 270]].forEach(([x, y], k) => { o += jig(K, x, y, 'rf08-n2', k + 11, 14, 6); });
      o += P('M584,282 L614,282', 'pl-pipe');
      o += G(C(652, 282, 38, 'rf08-gauge'), tip('압력계'));
      for (const a of [-120, -60, 0, 60, 120]){ const r = a * Math.PI / 180; o += L(652 + 29 * Math.sin(r), 282 - 29 * Math.cos(r), 652 + 36 * Math.sin(r), 282 - 36 * Math.cos(r), 's-edge'); }
      o += LB(T(652, 346, '압력계', 't-dim'));
      o += P('M584,428 L620,428', 'pl-pipe');
      o += G(fan(K, 654, 428, 32, 'pl-pump', 0.8), tip('진공 펌프'));
      o += LB(T(654, 484, '진공 펌프', 't-dim'));
      // 압력–시간 띠
      o += R(724, 190, 370, 290, 'pl-box', {rx: 12});
      o += T(740, 220, '압력 (예시) — 시간 →', 't-sub', 'start');
      o += R(840, 236, 170, 214, 'f-heat', tip('솔더가 녹아 있는 구간 (액상선 위)'));
      o += LB(T(925, 256, '솔더 녹음', 't-dim'));
      o += L(760, 450, 1076, 450, 's-axis') + LB(T(770, 260, '1기압', 't-dim', 'start'));
      o += LB(T(800, 470, '데움', 't-dim') + T(925, 470, '진공', 't-dim') + T(1040, 470, '되돌림', 't-dim'));
      // 틈 속 분자 — 50 mbar vs 1 mbar
      const gapPanel = (y0, title, foot, many) => {
        let p = R(1120, y0, 420, 150, 'pl-lane', {rx: 10});
        p += T(1136, y0 + 28, title, 't-sub', 'start');
        p += R(1136, y0 + 42, 250, 8, 'f-wafer') + R(1136, y0 + 100, 250, 12, 'rf08-plate', {style: `fill:${K.heat(255 / 300)}`});
        if (many){
          for (let k = 0; k < 5; k++){
            const x0 = 1160 + k * 44;
            let d = `M${x0},${y0 + 98}`;
            for (let j = 0; j < 8; j++) d += ` l${(j % 2 ? -1 : 1) * (6 + (j * 3 + k) % 5)},-6`;
            p += `<circle r="4" class="rf08-n2"><animateMotion dur="${(2.4 + k * 0.3).toFixed(1)}s" begin="-${(k * 0.5).toFixed(1)}s" repeatCount="indefinite" path="${d}"/></circle>`;
          }
        } else {
          for (let k = 0; k < 2; k++) p += K.mover(1200 + k * 110, y0 + 98, 1230 + k * 110, y0 + 52, 4, 'rf08-n2', 1.1, k * 0.55);
        }
        p += L(1400, y0 + 50, 1400, y0 + 100, 'rf08-dim') + L(1392, y0 + 50, 1408, y0 + 50, 'rf08-dim') + L(1392, y0 + 100, 1408, y0 + 100, 'rf08-dim');
        p += T(1416, y0 + 82, '틈 100 µm', 't-dim', 'start');
        p += T(1136, y0 + 136, foot, 't-dim', 'start');
        return p;
      };
      o += G(gapPanel(186, '50 mbar · 부딪히는 거리 λ ≈ 2 µm', '자주 부딪히며 건넌다 → 틈 전도 약 90 %', true), tip('50 mbar — 분자가 틈을 건너며 여러 번 부딪힌다 (λ ≪ 틈).\n분자 수는 줄어도 열 전달은 거의 그대로'));
      o += G(gapPanel(344, '1 mbar · λ ≈ 110 µm (틈보다 길다)', '분자가 모자라 열이 덜 건넌다 → 약 15 %', false), tip('1 mbar — 분자가 거의 부딪히지 않고 틈을 가로지른다 (λ > 틈).\n이제는 분자 수만큼 열 전달이 줄어든다'));
      o += `<g data-v="vacd"></g>`;
      o += LB(T(64, 530, '바람(대류) 가열은 압력과 함께 준다 → 보통 기체 속에서 데우고, 녹은 구간에서만 진공 (07장)', 't-sub', 'start'));
      o += LB(T(64, 558, '수 µm 기포는 속 압력이 이미 몇 기압 — 50 mbar로 낮춰도 지름은 약 1.09배뿐 (07장)', 't-dim', 'start'));
      s += G(o, only('vac'));
    }

    // ── clean: 플럭스 바르기 → 리플로우 → 세정 → 후처리 플라즈마 → 스크러버 · 건조
    {
      let o = T(64, 158, '플럭스 방식이면 — 바르고, 녹이고, 씻는다 (예시 순서)', 't-acc', 'start');
      const TL = [['① 플럭스 바르기', '스핀 · 분사', '얇고 고르게 (리플로우 전)'], ['② 리플로우', '판 · 오븐', '활성제가 산화막을 걷는다'], ['③ 세정', '물 · 약품', '예: 따뜻한 순수로 씻기'], ['④ 후처리 플라즈마', '얇은 유기막 정리', '표면을 다음 공정에 맞춤'], ['⑤ 스크러버 · 건조', '브러시 · 물 · 회전', '입자 · 물기 없애기']];
      TL.forEach(([h, sub, cp], k) => {
        const x = 60 + 300 * k, cx = x + 135;
        let t = R(x, 182, 270, 238, 'pl-tile2', {rx: 12}) + T(x + 16, 214, h, 'pl-hdg', 'start') + T(x + 16, 240, sub, 't-dim', 'start') + T(cx, 404, cp, 't-dim');
        if (k < 4) t += arrow(x + 272, 300, x + 297, 300, 's-arr');
        if (k === 0){
          t += R(cx - 16, 352, 32, 22, 'rf08-chuck') + R(cx - 95, 344, 190, 8, 'f-wafer') + R(cx - 95, 338, 190, 6, 'f-flux', tip('플럭스 — 얇고 고르게'));
          t += R(cx - 8, 262, 16, 34, 'rf08-noz', {rx: 3});
          for (let j = 0; j < 3; j++) t += K.mover(cx, 300, cx + (j - 1) * 6, 334, 4, 'rf08-fdrop', 1.2, j * 0.4);
          t += arrowP(`M${cx - 66},368 A70,9 0 0 0 ${cx + 66},368`, 's-arr');
        } else if (k === 1){
          t += R(cx - 95, 360, 190, 16, 'rf08-plate', {style: `fill:${K.heat(255 / 300)}`}) + R(cx - 85, 346, 170, 8, 'f-wafer') + R(cx - 85, 341, 170, 5, 'f-flux');
          for (let j = 0; j < 3; j++) t += P(`M${cx - 50 + j * 50},328 q7,-10 0,-20 q-7,-10 0,-20`, 'rf08-heat');
        } else if (k === 2){
          t += R(cx - 16, 352, 32, 22, 'rf08-chuck') + R(cx - 95, 344, 190, 8, 'f-wafer');
          t += R(cx - 8, 262, 16, 30, 'rf08-noz', {rx: 3});
          for (let j = 0; j < 6; j++) t += K.mover(cx, 296, cx - 75 + j * 30, 340, 4, 'rf08-drop', 1.0, j * 0.17);
        } else if (k === 3){
          t += R(cx - 95, 266, 190, 10, 'rf08-elec') + `<ellipse cx="${cx}" cy="310" rx="88" ry="24" class="rf08-plz"><animate attributeName="opacity" values=".55;1;.55" dur="1.6s" repeatCount="indefinite"/></ellipse>`;
          t += R(cx - 95, 348, 190, 8, 'f-wafer') + R(cx - 100, 356, 200, 14, 'rf08-chuck');
          for (let j = 0; j < 4; j++) t += K.mover(cx - 60 + j * 40, 290, cx - 60 + j * 40, 344, 3.5, 'rf08-ion', 1.1, j * 0.27);
        } else {
          t += R(cx - 16, 352, 32, 22, 'rf08-chuck') + R(cx - 95, 344, 190, 8, 'f-wafer');
          t += R(cx - 70, 312, 140, 26, 'rf08-brush', {rx: 13});
          for (let j = 0; j < 9; j++) t += L(cx - 60 + j * 15, 338, cx - 60 + j * 15, 344, 'rf08-brl');
          t += arrowP(`M${cx + 74},300 A20,20 0 0 1 ${cx + 84},328`, 's-arr');
          for (let j = 0; j < 3; j++) t += K.mover(cx - 40 + j * 40, 280, cx - 40 + j * 40, 310, 3.5, 'rf08-drop', 0.9, j * 0.3);
        }
        o += t;
      });
      // 범프 사이 확대 — 밑동의 찌꺼기
      let z = R(60, 436, 1480, 136, 'pl-box', {rx: 12});
      z += R(76, 552, 340, 14, 'f-si', tip('웨이퍼 (보호막 위)'));
      [160, 325].forEach(cx => {
        // 베이스 다이 범프 (3 px/µm): Cu 기둥 12 · Ni 3 · 상부 Cu 3 µm 위 돔
        z += R(cx - 37.5, 516, 75, 36, 'f-cu2', tip('Cu 기둥 12 µm — 높이 · 전기')) + R(cx - 37.5, 507, 75, 9, 'f-ni', tip('Ni 3 µm — Cu 기둥과 솔더 사이 방벽')) + R(cx - 37.5, 498, 75, 9, 'f-cu2', tip('상부 Cu 3 µm — Ni 위에 얇게 한 번 더 올린 Cu. 솔더가 처음 만나는 면'));
        z += P(cap(cx, 498, 37.5, 47), 'f-sn2', tip('굳은 솔더 돔'));
        z += P(`M${cx - 37.5},552 L${cx - 37.5},532 Q${cx - 42},548 ${cx - 54},552 Z`, 'rf08-fres', tip('플럭스 찌꺼기 — 범프 밑동 구석'));
        z += P(`M${cx + 37.5},552 L${cx + 37.5},532 Q${cx + 42},548 ${cx + 54},552 Z`, 'rf08-fres');
      });
      z += R(214, 546, 56, 6, 'rf08-fres', {rx: 3});
      z += L(198, 470, 287, 470, 'rf08-dim') + L(198, 462, 198, 478, 'rf08-dim') + L(287, 462, 287, 478, 'rf08-dim') + LB(T(242, 460, '틈 30 µm', 't-dim'));
      z += LB(T(440, 474, '좁은 틈 · 범프 밑동의 플럭스 찌꺼기는 잘 안 빠진다', 'pl-hdg2', 'start')
        + T(440, 504, '→ 다음 공정(본딩 등)의 접착 · 접합 불량 (09장)', 't-dim', 'start')
        + T(440, 532, '바른 뒤 오래 두지 않고 리플로우, 리플로우 뒤 곧 씻는다 (공급사 권고 예)', 't-dim', 'start')
        + T(440, 560, '무플럭스(포름산 증기 · 플라즈마)면 ①과 ③의 플럭스 세정이 없다', 't-dim', 'start'));
      o += G(z, tip('범프 사이 확대 — 베이스 다이 범프(Cu / Ni / Cu / SnAg), 피치 55 µm · 틈 30 µm (예시)\n코어 다이 범프(Ni / SnAg)는 더 낮다 — 밑동 구석은 같은 이야기'));
      s += G(o, only('clean'));
    }

    // ════════ 아래: 직접 해 보기 그림 (모든 단계 — 위젯이 그린다)
    s += R(40, 598, 740, 512, 'pl-box', {rx: 12});
    s += LB(T(60, 634, '판과 웨이퍼 — 가운데에서 가장자리까지', 't-acc', 'start') + T(760, 634, '(틈 · 휨 크게 과장)', 't-dim', 'end'));
    s += `<g data-v="wl"></g>`;
    s += R(800, 598, 760, 512, 'pl-box', {rx: 12});
    s += `<clipPath id="${K.id('rf08-gclip')}"><rect x="${GX0}" y="${GY1 - 10}" width="${GX1 - GX0 + 2}" height="${GY0 - GY1 + 12}"/></clipPath>`;
    s += `<g data-v="gr"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 웨이퍼는 얼마나 늦게 따라올까</div>
      ${K.seg('m', [['ov', '대류 오븐'], ['hp', '판 — 질소 1기압'], ['v50', '판 — 진공 50 mbar'], ['v1', '판 — 진공 1 mbar']], DEF.m, '가열 방식 · 압력')}
      ${K.ctl('g', '핀 높이 · 틈 (µm)', 50, 300, 10, DEF.g)}${K.ctl('w', '웨이퍼 휨 (+ 가장자리 들림 · − 가운데 들림)', -300, 300, 10, DEF.w)}${K.ctl('r', '승온 속도 (°C/초)', 0.5, 4, 0.5, DEF.r)}${K.ctl('n', '질소 교환 (분당 챔버 부피의 몇 배)', 1, 20, 1, DEF.n)}
      ${K.kpis([['가운데 열 지연', 'k-tc', 'τ — 설정을 따라가는 늦음'], ['가장자리 열 지연', 'k-te', 'τ — 설정을 따라가는 늦음'], ['승온 중 온도 차', 'k-dt', '늦은 쪽이 덜 데워진 만큼'], ['산소 20 ppm까지', 'k-o2', '공기에서, 흘려 밀어낼 때']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('웨이퍼를 두께 방향으로 온도가 같은 한 덩어리로 보고(열용량 약 1,354 J/(m²·K), 300 mm · 775 µm), 틈의 질소 전도(낮은 압력은 온도 점프 근사 k/(g + 5λ)) · 복사 · 대류를 열 전달 계수 하나로 나타낸 개념 모델입니다. 질소 전도도(0.037 W/(m·K)) · 복사(10) · 대류(100 W/(m²·K)) 값은 예시이고, 산소 퍼지는 흘려 밀어내며 완전히 섞인다고 가정했습니다(실제로는 구석 · 틈이 더 늦음, 진공 챔버의 빼고 채우기는 「한 걸음 더」). 승온 중 온도 차는 계산한 두 곡선 차이의 최댓값이고(꾸준히 오를 때 ≈ 승온 속도 × τ 차이), 판정(5 · 15 °C)도 예시입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, TT, tip, only, W, arrow} = K;
    const st = Object.assign({}, DEF);
    let touched = false, ready = false;
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const OUT = {g: v => v + ' µm', w: v => v > 0 ? `+${v} µm` : v < 0 ? `−${-v} µm` : '0 µm (평평)', r: v => v.toFixed(1) + ' °C/초', n: v => `×${v} /분`};
    const lagCol = lag => K.heat(K.clamp(0.95 - lag / 50));
    // ── 아래 왼쪽: 판 · 웨이퍼 · 틈 (가운데 → 가장자리 반쪽 단면)
    function drawWL(c){
      const ov = st.m === 'ov', sC = c.slow === 'c' && c.dT >= 3, sE = c.slow === 'e' && c.dT >= 3;
      let o = '';
      o += T(60, 674, '가운데', 'pl-hdg', 'start') + T(760, 674, '가장자리', 'pl-hdg', 'end');
      const lab = (g, t) => ov ? `τ ${f1(t)}초 · 바람으로` : `틈 ${g} µm · τ ${f1(t)}초`;
      o += T(60, 704, lab(c.gc, c.tc), sC ? 'rf08-slow' : 't-sub', 'start') + T(760, 704, lab(c.ge, c.te), sE ? 'rf08-slow' : 't-sub', 'end');
      const bw = t => Math.max(4, 320 * Math.min(1, t / 25));
      o += G(R(60, 716, 320, 14, 'rf08-bt', {rx: 4}) + R(60, 716, bw(c.tc), 14, 'rf08-bf', {rx: 4, style: `fill:${lagCol(st.r * c.tc)}`}), tip(`열 지연 τ — 가운데 ${f1(c.tc)}초 (막대 끝 = 25초)`));
      o += G(R(440, 716, 320, 14, 'rf08-bt', {rx: 4}) + R(760 - bw(c.te), 716, bw(c.te), 14, 'rf08-bf', {rx: 4, style: `fill:${lagCol(st.r * c.te)}`}), tip(`열 지연 τ — 가장자리 ${f1(c.te)}초 (막대 끝 = 25초)`));
      o += LB(T(410, 750, '색 = 승온 중 늦음 (빨강: 거의 없음 → 초록 → 파랑: 많이 늦음)', 't-dim'));
      // 웨이퍼 모양: 가운데(x 100) → 가장자리(x 720), 이차 곡선 (가운데 접선 수평)
      const base = ov ? 950 : 1000, px = 0.4;
      const yc = ov ? base - px * Math.max(0, -st.w) : base - px * c.gc, ye = ov ? base - px * Math.max(0, st.w) : base - px * c.ge;
      const yAt = x => yc + Math.pow((x - 100) / 620, 2) * (ye - yc);
      o += `<linearGradient id="${K.id('rf08-wg')}" gradientUnits="userSpaceOnUse" x1="100" y1="0" x2="720" y2="0"><stop offset="0" stop-color="${lagCol(st.r * c.tc)}"/><stop offset="1" stop-color="${lagCol(st.r * c.te)}"/></linearGradient>`;
      o += L(100, 762, 100, 1040, 's-dash', tip('웨이퍼 중심'));
      if (ov){
        for (const x of [180, 330, 480, 630]){
          const y = yAt(x);
          o += arrow(x, Math.max(766, y - 70), x, y - 14, 's-arr2') + arrow(x, Math.min(1036, y + 70), x, y + 14, 's-arr2');
        }
        o += LB(T(410, 1062, '판 없음 — 위아래에서 뜨거운 질소를 불어 데운다', 't-dim'));
        o += LB(T(60, 1094, '휨 · 틈 영향은 거의 없지만 느리다 (τ 약 13.5초, 예시)', 't-dim', 'start'));
      } else {
        o += R(80, 1000, 660, 34, 'rf08-plate', W({rx: 4, style: `fill:${K.heat(255 / 300)}`}, tip('판 (녹임판 예: 255 °C)')));
        o += LB(T(410, 1024, '판 (예: 255 °C)', 'rf08-pt'));
        for (const x of [130, 400, 690]) o += R(x - 4, 1000 - px * st.g, 8, px * st.g, 'rf08-pin', tip(`핀 ${st.g} µm — 웨이퍼를 판에서 띄운다`));
        // 틈 치수
        const dim = (x, y) => y < 994 ? L(x, y + 6, x, 1000, 'rf08-dim') + L(x - 6, y + 6, x + 6, y + 6, 'rf08-dim') : '';
        o += dim(116, yc) + dim(706, ye);
        // 판 → 웨이퍼 열 흐름: 굵기 = 그 자리의 열 전달 (틈 · 압력에 따라)
        let hf = '';
        for (const x of [210, 300, 510, 600]){
          const y = yAt(x), gl = (1000 - y) / px, hh = KN / ((gl + 5 * c.lam) * 1e-6) + HRAD;
          if (1000 - y >= 26) hf += arrow(x, 994, x, y + 10, 's-arr2', {style: `stroke-width:${K.clamp(hh / 400 * 4.6, 1, 5).toFixed(1)};opacity:${K.clamp(0.35 + hh / 400, 0.4, 1).toFixed(2)}`});
        }
        o += G(hf, tip('판 → 웨이퍼로 건너가는 열 (화살표 굵기 = 그 자리의 열 전달)\n틈이 넓거나 압력이 아주 낮으면 가늘어진다'));
        o += LB(T(100, 1062, `↑ 가운데 틈 ${c.gc} µm`, 't-dim', 'start') + T(740, 1062, `가장자리 틈 ${c.ge} µm ↑`, 't-dim', 'end'));
        // 분자가 부딪히는 거리 λ (자) — 진공에서만
        if (c.lam != null && c.lam * px >= 4){
          const hl = Math.min(250, c.lam * px);
          o += G(R(158, 1000 - hl, 8, hl, 'rf08-lam') + T(162, 1000 - hl - 8, 'λ', 'rf08-lt'), tip(`분자가 부딪히는 거리 λ ≈ ${f2s(c.lam)} µm — 같은 배율로 그림`));
        }
        const pct = Math.round(c.cond * 100);
        let nt, cl = 't-dim';
        if (st.m === 'hp') nt = '질소 1기압 · 부딪히는 거리 λ ≈ 0.1 µm ≪ 틈 → 틈의 질소가 열을 나른다';
        else if (st.m === 'v50') nt = `50 mbar · λ ≈ ${f1(c.lam)} µm ≪ 틈 → 틈 전도 약 ${pct} % (거의 그대로)`;
        else { nt = `1 mbar · λ ≈ ${f2s(c.lam)} µm ${c.lam > 1.1 * c.gc ? '>' : c.lam < 0.9 * c.gc ? '<' : '≈'} 틈 ${c.gc} µm → 틈 전도 약 ${pct} %`; cl = pct < 50 ? 'rf08-wn' : 't-dim'; }
        o += LB(T(60, 1094, nt, cl, 'start'));
      }
      o += P(`M100,${f1(yc)} Q410,${f1(yc)} 720,${f1(ye)}`, 'rf08-waf', W({style: `stroke:${K.url('rf08-wg')}`}, tip(`웨이퍼 — 가운데 τ ${f1(c.tc)}초 · 가장자리 τ ${f1(c.te)}초`)));
      return o;
    }
    // ── 아래 오른쪽: 설정 vs 웨이퍼 온도 (gas 단계는 산소 퍼지 곡선)
    function drawGR(c, sm){
      const X = t => GX0 + (t - sm.t0) / (sm.tE - sm.t0) * (GX1 - GX0);
      let o = '';
      // 온도 그래프
      let g = T(820, 634, `설정 vs 웨이퍼 온도 — 승온 ${f1(st.r)} °C/초 (120 °C 위만)`, 't-acc', 'start');
      for (let v = 150; v <= 250; v += 50) g += L(GX0, gy(v), GX1, gy(v), 's-faint') + T(GX0 - 10, gy(v) + 7, String(v), 't-dim', 'end');
      g += L(GX0, gy(221), GX1, gy(221), 'rf08-221', tip('221 °C — 솔더가 녹기 시작 (공정점(共晶))')) + T(GX0 - 10, gy(221) + 7, '221', 'rf08-tw', 'end');
      g += LB(T(GX0 - 10, 676, '°C', 't-dim', 'end') + T(GX0 - 10, 1016, '초', 't-dim', 'end'));
      const span = sm.tE - sm.t0, stp = span <= 120 ? 20 : span <= 240 ? 40 : span <= 480 ? 60 : 120;
      for (let t = Math.ceil(sm.t0 / stp) * stp; t <= sm.tE + 1e-6; t += stp) g += L(X(t), GY0, X(t), GY0 + 8, 's-axis') + (X(t) > GX0 + 24 ? T(X(t), 1016, String(t), 't-dim') : '');
      g += L(GX0, GY0, GX1 + 6, GY0, 's-axis') + L(GX0, GY0, GX0, GY1 - 8, 's-axis');
      let ds = '', dc = '', de = '';
      sm.pts.forEach(([t, S, Tc, Te], i) => { const x = f1(X(t)), k = i ? ' L' : 'M'; ds += k + x + ',' + f1(gy(S)); dc += k + x + ',' + f1(gy(Tc)); de += k + x + ',' + f1(gy(Te)); });
      g += G(P(ds, 's-curve2', tip('설정 온도 (장비)')) + P(de, 'rf08-edge', tip(`웨이퍼 가장자리 — τ ${f1(c.te)}초`)) + P(dc, 's-curve', tip(`웨이퍼 가운데 — τ ${f1(c.tc)}초`)), {'clip-path': K.url('rf08-gclip')});
      // 열 지연: 설정이 170 °C를 지난 뒤 가운데가 170 °C에 닿기까지 (가로 화살표)
      //  라벨은 화살표 위 왼쪽 빈 곳에 — y축 안쪽, 비스듬한 설정선 왼쪽, 200 · 221 °C 격자선 사이를 피해 첫 자리를 고른다
      {
        const ts = 145 / st.r, x0 = X(ts), x1 = X(ts + c.tc), yy = gy(170);
        const sl = st.r * (GY0 - GY1) / 150 * (sm.tE - sm.t0) / (GX1 - GX0);          // 설정선 기울기 (세로 px / 가로 px)
        const wd = s2 => [...s2].reduce((a, ch) => a + (/[가-힣]/.test(ch) ? 23 : /[ .]/.test(ch) ? 6.5 : 12.8), 0);   // t-warn 23px 글 폭 어림
        const full = `늦음 τ ${f1(c.tc)}초`, short = `τ ${f1(c.tc)}초`;
        let lab = null;
        for (const [ly, tx] of [[yy - 32, full], [gy(200) - 14, full], [yy - 32, short], [gy(200) - 14, short]]){
          const lx = Math.max(x0 - 10, GX0 + 14 + wd(tx)), xr = x0 + (yy - ly - 5) / sl - 8;   // 글 아래 끝 높이에서 설정선보다 8 px 왼쪽까지
          if (lx <= xr){ lab = [lx, ly, tx]; break; }
        }
        if (!lab) lab = [Math.max(x0 - 10, GX0 + 14 + wd(short)), yy - 32, short];
        g += G((x1 - x0 >= 16 ? arrow(x0 + 2, yy, x1 - 2, yy, 's-arr2') : L(x0, yy, x1, yy, 'rf08-lag')) + LB(T(lab[0], lab[1], lab[2], 't-warn', 'end')), tip(`열 지연 — 웨이퍼(가운데)는 설정을 τ ${f1(c.tc)}초 늦게 따라간다`));
      }
      // 가운데 · 가장자리 차이가 가장 큰 때 (보통 설정이 255 °C에 닿는 때) — 세로 화살표 + 아래 글
      const pr = at(sm, sm.tr), tA = Math.abs(pr[2] - pr[3]) >= 0.9 * sm.dmax ? sm.tr : sm.tmax;   // 보통 설정이 255 °C에 닿는 때, 늦음이 아주 크면 차이가 가장 큰 때
      const p = at(sm, tA), xa = X(p[0]), y1 = gy(p[2]), y2 = gy(p[3]), d = Math.abs(p[2] - p[3]), yLo = Math.max(y1, y2);
      if (Math.abs(y1 - y2) >= 12){
        const ym = (y1 + y2) / 2;
        g += arrow(xa, ym, xa, Math.min(y1, y2) + 3, 's-arrr') + arrow(xa, ym, xa, yLo - 3, 's-arrr');
      }
      let lb = yLo + 40;
      if (Math.abs(lb - 7 - gy(221)) < 16) lb = gy(221) + 30;                // 221 °C 점선을 피해
      lb = Math.min(lb, 972);
      g += L(xa, yLo + 5, xa, lb - 19, 's-lead') + LB(T(xa + 6, lb, d < 0.5 ? '가운데 = 가장자리' : `차이 ${f1(d)} °C`, d >= 3 ? 't-warn' : 't-dim', 'start'));
      { const q = at(sm, sm.tr); g += C(X(q[0]), gy(q[1]), 6, 'k-acc2', tip(`설정이 255 °C에 닿는 때 (${f0(q[0])}초)`)); }
      g += LB(L(1300, 920, 1340, 920, 's-curve2') + T(1350, 927, '설정 (장비)', 't-dim', 'start') + L(1300, 946, 1340, 946, 's-curve') + T(1350, 953, '웨이퍼 가운데', 't-dim', 'start') + L(1300, 972, 1340, 972, 'rf08-edge') + T(1350, 979, '웨이퍼 가장자리', 't-dim', 'start'));
      // 아래 띠: 산소 퍼지 막대
      g += LB(T(820, 1052, `산소 21 % → 20 ppm: ${fmin(c.tO2)}분`, 't-sub', 'start') + T(1540, 1052, `질소 교환 ×${st.n}/분 · 완전 혼합 가정`, 't-dim', 'end'));
      g += G(R(820, 1066, 720, 16, 'rf08-bt', {rx: 5}) + R(820, 1066, Math.max(5, 720 * Math.min(1, c.tO2 / 10)), 16, 'rf08-o2b', {rx: 5}), tip(`산소 20 ppm까지 ${fmin(c.tO2)}분 (막대 끝 = 10분)`));
      g += LB(T(820, 1102, '0', 't-dim', 'start') + T(1540, 1102, '10분', 't-dim', 'end'));
      o += G(g, only('oven plate vac clean'));
      // gas 단계: 산소 퍼지 곡선 (로그)
      const Xm = t => GX0 + t / 10 * (GX1 - GX0);
      let q = T(820, 634, '챔버 산소 — 흘려 밀어내기 (완전 혼합 가정)', 't-acc', 'start');
      [[1, '1'], [10, '10'], [100, '100'], [1e3, '10³'], [1e4, '10⁴'], [1e5, '10⁵']].forEach(([v, lb]) => { q += L(GX0, gyl(v), GX1, gyl(v), 's-faint') + T(GX0 - 10, gyl(v) + 7, lb, 't-dim', 'end'); });
      q += LB(T(GX0 - 10, 664, 'ppm', 't-dim', 'end') + T(GX0 - 10, 1016, '분', 't-dim', 'end'));
      for (let t = 0; t <= 10; t += 2) q += L(Xm(t), GY0, Xm(t), GY0 + 8, 's-axis') + T(Xm(t), 1016, String(t), 't-dim');
      q += L(GX0, GY0, GX1 + 6, GY0, 's-axis') + L(GX0, GY0, GX0, GY1 - 8, 's-axis');
      q += L(GX0, gyl(210000), GX1, gyl(210000), 's-dash') + LB(T(1520, 690, '공기 21 % = 210,000 ppm', 't-dim', 'end'));
      q += L(GX0, gyl(20), GX1, gyl(20), 'rf08-221', tip('목표 20 ppm (예시 — 웨이퍼 범프 플럭스 리플로우에서 흔히 권하는 값)')) + LB(T(1250, gyl(20) + 26, '목표 20 ppm (예시)', 'rf08-tw', 'start'));
      const curve = n => { const t1 = Math.min(10, Math.log(210000) / n); let dd = ''; for (let k = 0; k <= 100; k++){ const t = t1 * k / 100; dd += (dd ? ' L' : 'M') + f1(Xm(t)) + ',' + f1(gyl(210000 * Math.exp(-n * t))); } return dd; };
      let cv = '';
      [1, 2, 5].forEach(n => { if (n !== st.n) cv += P(curve(n), 'rf08-ref', tip(`질소 교환 ×${n}/분 — 20 ppm까지 ${fmin(LNP / n)}분`)); });
      cv += P(curve(st.n), 'rf08-cur', tip(`지금: ×${st.n}/분 — 20 ppm까지 ${fmin(c.tO2)}분`));
      q += G(cv, {'clip-path': K.url('rf08-gclip')});
      q += L(Xm(c.tO2), gyl(20), Xm(c.tO2), GY0, 's-dash') + C(Xm(c.tO2), gyl(20), 7, 'k-acc2') + C(Xm(c.tO2), gyl(20), 16, 'co-ring');
      const refs = [1, 2, 5].filter(n => n !== st.n).map(n => '×' + n).join(' · ');
      q += LB(T(1520, 720 + 14, `질소 교환 ×${st.n}/분`, 't-sub', 'end') + T(1520, 762, `→ 20 ppm까지 ${fmin(c.tO2)}분`, 't-warn', 'end') + T(1520, 790, `흐린 선: ${refs} (비교)`, 't-dim', 'end'));
      o += G(q, only('gas'));
      return o;
    }
    // ── 위쪽 그림 중 위젯 값에 따라 바뀌는 곳
    function drawTop(c){
      ctx.$('[data-v="pgap"]').innerHTML = LB(T(946, 226, `${st.g} µm`, 't-dim', 'end'));
      ctx.$('[data-v="o2r"]').innerHTML = LB(T(1045, 289, `20 ppm까지 ${fmin(c.tO2)}분`, 'rf08-ro'));
      // 진공: 압력계 바늘 · 압력–시간 · 틈 그림 강조
      const Pm = PRS[st.m], vac = st.m === 'v50' || st.m === 'v1';
      const a = (-120 + 240 * Math.log10(Pm) / Math.log10(1013)) * Math.PI / 180;
      let v = L(652, 282, 652 + 30 * Math.sin(a), 282 - 30 * Math.cos(a), 'rf08-needle') + C(652, 282, 5, 'rf08-hub');
      v += LB(T(652, 374, vac ? `${Pm} mbar` : '1기압 (진공 안 씀)', vac ? 't-warn' : 't-dim'));
      const yA = 270, yL = vac ? 430 : yA;
      v += P(`M760,${yA} L846,${yA} L874,${yL} L976,${yL} L1004,${yA} L1076,${yA}`, vac ? 'rf08-pcur' : 'rf08-pnone', tip(vac ? `녹은 동안만 ${Pm} mbar로 낮췄다가 굳기 전에 되돌린다 (예시)` : '진공을 쓰지 않음 — 기체 속에서 그대로'));
      v += LB(vac ? T(925, 420, `${Pm} mbar`, 't-warn') : T(925, 330, '진공 안 씀', 't-dim'));
      if (st.m === 'v50') v += R(1120, 186, 420, 150, 'pl-hlbox', {rx: 10});
      if (st.m === 'v1') v += R(1120, 344, 420, 150, 'pl-hlbox', {rx: 10});
      ctx.$('[data-v="vacd"]').innerHTML = v;
    }
    function render(){
      const c = calc(st), sm = sim(st, c);
      c.dT = sm.dmax;                                                   // 승온 중 온도 차 = 계산한 두 곡선 차이의 최댓값
      ctx.$('[data-v="wl"]').innerHTML = drawWL(c);
      ctx.$('[data-v="gr"]').innerHTML = drawGR(c, sm);
      drawTop(c);
      // 카드: 결과 칸 · 메시지
      ctx.out('k-tc', f1(c.tc) + ' 초'); ctx.out('k-te', f1(c.te) + ' 초');
      const side = c.slow === 'e' ? '가장자리' : c.slow === 'c' ? '가운데' : '';
      ctx.out('k-dt', f1(c.dT) + ' °C' + (side && c.dT >= 0.5 ? ' · ' + side : ''));
      ctx.out('k-o2', fmin(c.tO2) + ' 분');
      const kc = (id, lv) => { const e = ctx.card.querySelector(`[data-o="${id}"]`).parentNode; ['ok', 'warn', 'ng'].forEach((cl, i) => e.classList.toggle(cl, lv === i)); };
      const r1 = v => Math.round(v * 10) / 10, dTr = r1(c.dT);              // 판정은 화면에 보이는 값(소수 한 자리)으로
      kc('k-dt', dTr < 5 ? 0 : dTr < 15 ? 1 : 2);
      kc('k-tc', r1(c.tc) < 8 ? 0 : r1(c.tc) < 15 ? 1 : 2); kc('k-te', r1(c.te) < 8 ? 0 : r1(c.te) < 15 ? 1 : 2);
      const other = side === '가장자리' ? '가운데' : '가장자리';
      let msg = `<b>${MN[st.m]}</b>: 웨이퍼는 설정을 가운데 <b>${f1(c.tc)}초</b>, 가장자리 <b>${f1(c.te)}초</b> 늦게 따라옵니다. ${f1(st.r)} °C/초로 올리는 동안 ${dTr >= 3 ? side : '웨이퍼'}는 설정보다 최대 약 <b>${f0(sm.lmax)} °C</b> 낮습니다. `;
      if (dTr >= 3) msg += `${side}가 ${other}보다 <b>${f1(c.dT)} °C</b> 덜 데워져, 녹임 구간이 짧으면 ${side === '가장자리' ? '가장자리 고리' : '가운데 무늬'}(덜 녹음)가 생길 수 있습니다.`;
      else msg += `가운데와 가장자리는 거의 같이 따라와 둘 사이 차이는 ${f1(c.dT)} °C 정도입니다.`;
      if (c.def >= 1) msg += ` 녹임 구간에 30초 머물러도 ${dTr >= 3 ? side : '웨이퍼'}는 설정보다 약 ${f0(c.def)} °C 낮게 끝납니다(최고 온도 여유를 그만큼 씀).`;
      if (st.w < 0 && st.m !== 'ov') msg += ' 가운데가 들린 휨에서는 가운데가 늦습니다 — 맵 무늬를 휨 방향 · 크기(가열 중 변화 포함)와 함께 봅니다.';
      if (st.m === 'ov') msg += ' 대류는 휨 · 틈의 영향이 거의 없지만, 기체로 데우므로 판 방식보다 느립니다.';
      // 같은 틈 · 휨에서 압력만 바꾸면 (진공 선택지끼리 견주기)
      const tauAt = m => f1(Math.max(...(cc => [cc.tc, cc.te])(calc(Object.assign({}, st, {m})))));
      if (st.m === 'v50') msg += ` 50 mbar에서도 틈의 질소는 열을 거의 그대로 나릅니다(분자가 부딪히는 거리 약 2 µm ≪ 틈 · 같은 틈과 휨에서 1기압이면 ${tauAt('hp')}초, 1 mbar면 ${tauAt('v1')}초).`;
      if (st.m === 'v1') msg += ` 약 1 mbar에서는 분자가 부딪히는 거리(약 110 µm)가 ${c.lam >= 0.8 * c.gc ? '틈만큼' : '틈에 견줄 만큼'} 길어져 열이 잘 안 건너갑니다(같은 틈과 휨에서 50 mbar면 ${tauAt('v50')}초, 1기압이면 ${tauAt('hp')}초) → 보통 기체 속에서 데우고 녹은 구간에서만 진공 (<a data-go="void.vac">07장</a>).`;
      msg += ` 질소 교환 ×${st.n}/분이면 공기에서 산소 20 ppm까지 약 ${fmin(c.tO2)}분입니다(완전 혼합 가정).`;
      ctx.q('[data-o=msg]').innerHTML = msg;
      ctx.refresh();
    }
    ['g', 'w', 'r', 'n'].forEach(id => ctx.range(id, v => { st[id] = v; if (ready) render(); return OUT[id](v); }));
    ['g', 'w', 'r', 'n'].forEach(id => inp(id).addEventListener('input', () => { touched = true; }));
    ctx.seg('m', (v, user) => { st.m = v; if (user) touched = true; if (ready) render(); });
    ready = true;
    render();
    // 발표 모드 · 손대기 전: 단계에 맞는 예시 값 (기본값 + DEMO만 덮어씀)
    ctx.demo = sid => {
      if (touched || !DEMO[sid]) return render();
      Object.assign(st, DEF, DEMO[sid]);
      ['g', 'w', 'r', 'n'].forEach(id => { inp(id).value = st[id]; ctx.out(id, OUT[id](st[id])); });
      ctx.card.querySelectorAll('.pl-seg[data-g="m"] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === st.m)));
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['대류 오븐', '뜨거운 기체(질소)를 불어 데우는 장비. 온도가 다른 구역을 지나며 프로파일을 만든다'],
      ['판(전도) 방식 · 근접 가열', '뜨거운 판 위 핀에 웨이퍼를 띄워, 얇은 기체 틈(약 0.1 mm)을 건너는 열로 데우는 방식'],
      ['열 지연 (τ)', '웨이퍼 열용량 ÷ 열 전달. 클수록 설정 온도를 늦게 따라간다 (예시: 판 수 초 · 대류 십여 초)'],
      ['평균 자유 경로 (λ)', '기체 분자가 다른 분자와 부딪히기 전까지 날아가는 평균 거리. 압력이 낮을수록 길다 (약 250 °C 질소: 1기압 0.1 µm · 1 mbar 약 110 µm)'],
      ['퍼지 · 빼고 채우기', '질소를 흘려 챔버 속 공기(산소)를 밀어내는 것. 진공 챔버는 뺐다가 질소로 채우기를 되풀이한다'],
      ['산소 센서', '챔버 · 배기의 산소 농도(ppm)를 재는 센서'],
      ['버블러', '액체(포름산)에 질소를 불어 넣어 증기를 실어 보내는 통'],
      ['측정용 웨이퍼', '열전대(온도 센서)를 여러 곳에 붙여 실제 웨이퍼 온도를 재는 웨이퍼']
    ]) + K.field([
      '<span class="pl-tag hw">리플로우-장비</span> PM(정기 점검) · 판 교체 뒤에는 측정용 웨이퍼로 <b>판 온도 ↔ 웨이퍼 온도 차, 가운데 ↔ 가장자리 차</b>를 다시 확인합니다 → <a data-go="profile.peak">02장</a>.',
      '<span class="pl-tag up">앞 공정</span> 휨이 큰 제품(두꺼운 막 · TSV · 앞면 구조 — 앞면 범프 리플로우는 보통 얇게 갈기 전 웨이퍼에서 합니다)은 판 방식에서 틈이 큰 쪽 온도가 늦게 오릅니다 — 가장자리가 들리면 가장자리, 가운데가 들리면 가운데입니다. 휨 방향 · 크기는 앞 공정(막 응력 · 범프 부피)이 정하고 가열 중에도 바뀌므로, 맵 무늬를 휨 측정과 함께 봅니다. 이 장비에서 바꿀 수 있는 것은 핀 높이 · 흡착 · 승온 속도 · 녹임 시간입니다 → <a data-go="defects.map">09장</a>.',
      '<span class="pl-tag hw">리플로우-장비</span> 포름산 배관 · 배기의 찌꺼기(포름산 주석 · 주석 안개)는 <b>PM 주기의 핵심</b>입니다. 쌓이면 떨어져 입자 · 얼룩이 됩니다 → <a data-go="defects.tiles">09장</a>.',
      '<span class="pl-tag ep">리플로우-분위기</span> 산소가 갑자기 오르면 문 실링 · 질소 공급 압력 · 배기 균형 · 센서 교정부터 봅니다. 진공 챔버라면 빼고 채우기의 <b>펌프 다운 압력 · 반복 횟수 · 새는 곳(압력 상승률)</b>도 봅니다.',
      '처리량은 가장 긴 구간(예열 · 녹임)이 정합니다. 판을 여러 개로 나눠 동시에 처리하는 구성이 흔합니다. 범프 공정의 앞뒤 순서(플라즈마 처리 → 리플로우 → 후처리 플라즈마 · 세정)는 <a href="#go-bump">범프 공정</a> 탭에서 봅니다.'
    ]) + K.deep(`<ul>
      <li><b>덩어리 열 모델</b> — ${K.eq('τ = ρ·c·t / h,   h ≈ k_N₂ / g + h_rad')} ρct ≈ 2,330 × 750 × 775×10⁻⁶ ≈ 1,350 J/(m²·K)(300 mm Si 775 µm). 근접 가열: k_N₂ 약 0.037 W/(m·K)(약 200 °C), g 100 µm → 약 370 W/(m²·K) → τ ≈ 3.6초. 휨 300 µm(가장자리 틈 400 µm) → τ ≈ 13초, 2 °C/초 승온이면 차이 약 19 °C. 대류는 한쪽 h 약 25~100 W/(m²·K)(예시, 위아래 두 면이면 그 합)라 τ가 수 초~수십 초입니다(위젯은 두 면 합 100 → 13.5초). 일정한 속도 r로 오를 때 웨이퍼는 r·τ만큼 늦습니다(<a data-go="profile.ramp">02장</a>).</li>
      <li><b>진공과 열</b> — ${K.eq('λ = k·T / (√2·π·d²·P)')}${K.eq('h_gap ≈ k / (g + 5λ)')} N₂(d ≈ 3.7 Å)의 λ는 약 250 °C에서 1기압 0.11 µm · 50 mbar 2.3 µm · 10 mbar 11 µm · 1 mbar 110 µm입니다. 5λ는 벽에서 생기는 온도 점프의 근사(적응 계수 약 0.8)라, 틈 100 µm에서 대기압 대비 50 mbar 약 0.90 · 10 mbar 약 0.64 · 1 mbar 약 0.15배(틈 400 µm면 50 mbar 0.97배)입니다. 즉 <b>수십 mbar 진공은 판 가열을 거의 바꾸지 않고</b>, 수 Torr(수 mbar) 아래에서 급히 줄어 복사(250 °C에서 약 10 W/(m²·K) 수준)만 남습니다. 크게 주는 것은 뜨거운 기체를 불어 데우는 대류 가열입니다. 그래서 데울 때는 기체, 녹은 동안만 진공이 흔한 순서입니다(<a data-go="void.vac">07장</a>).</li>
      <li><b>판 방식의 장단점 (공개 특허 서술)</b> — 웨이퍼가 열 덩어리(판) 위에 있어 판보다 뜨거워지지 않음(과열 없음), 여러 온도를 위해 판을 따로 두고 옮겨야 함, 분위기 관리가 안 되면 산화 · 플럭스 찌꺼기 쌓임. 움직이는 뜨거운 띠로 전도 가열하는 방식도 특허에 보입니다.</li>
      <li><b>퍼지</b> — ${K.eq('C(t) = C₀ · e^(−n·t)   (완전 혼합)')} 공기(21 % = 210,000 ppm) → 20 ppm은 ln(10,500) ≈ 9.3번의 부피 교환입니다(분당 5배면 약 1.9분). 실제는 구석 · 틈 · 문 쪽이 늦어 센서 값과 웨이퍼 근처 값이 다를 수 있습니다. 진공 챔버는 <b>빼고 채우기</b>를 되풀이합니다: 10 mbar까지 뺐다가 질소로 채우면 한 번에 산소가 약 1/100(21 % → 약 2,100 ppm), 두 번이면 약 20 ppm, 세 번이면 이론상 1 ppm 아래입니다. 흐름 퍼지보다 빠르고 예측하기 쉽지만, 실제 바닥값은 새는 곳 · 벽과 부품에서 나오는 기체가 정합니다.</li>
      <li><b>포름산 취급</b> — 노출 기준 5 ppm(시간 가중), 단시간 10 ppm, 인화점 약 50~60 °C(농도에 따라), 폭발 하한 약 14~18 vol%. 부식성이 커 배관 · 밀봉 재질, 누출 감지, 배기 처리를 갖춥니다. 질소에 실어 넣고 챔버 압력 · 배기 균형을 지킵니다. 보통 산소를 충분히 뺀 뒤, 웨이퍼가 정한 온도(산화막과 반응하는 약 150~200 °C 근처)에 이르면 넣고, 녹임이 끝나면 배기와 질소로 걷어 냅니다. 산화막과의 반응은 <a data-go="oxide.formic">03장</a>.</li>
      <li><b>수용성 웨이퍼 플럭스</b> — 활성제로 옥살산 · 말론산 · 숙신산 · 글루타르산 · 아디프산 같은 디카복실산을 쓰는 예가 특허에 보이고, 상온 ~ 따뜻한(약 65 °C) 순수로 씻으며, 바른 뒤 오래 두지 말고(예: 2시간 안 리플로우) 리플로우 뒤 곧 씻으라는 공급사 권고가 있습니다. 과열 · 긴 시간에는 물에 안 녹는 고분자 찌꺼기가 생길 수 있습니다(<a data-go="oxide.flux">03장</a>).</li></ul>`);
  },
  css: `.pl-svg .rf08-tun{fill:#111c30;stroke:#4a6390;stroke-width:2}
.pl-svg .rf08-zone{fill-opacity:.24;stroke:none}
.pl-svg .rf08-zl{stroke:#4a6390;stroke-width:1.5;stroke-dasharray:6 5}
.pl-svg .rf08-fan{fill:#1e293b;stroke:#7dd3fc;stroke-width:2}
.pl-svg .rf08-blade{fill:#7dd3fc;opacity:.85}
.pl-svg .pl-pump + g .rf08-blade{fill:#a78bfa}
.pl-svg .rf08-belt{stroke:#64748b;stroke-width:3}
.pl-svg .rf08-roll{fill:#334155;stroke:#94a3b8;stroke-width:1.2}
.pl-svg .rf08-wv{stroke:#e2e8f0;stroke-width:1.2}
.pl-svg .rf08-mg{fill:rgba(5,10,20,.45);stroke:rgba(148,163,184,.22);stroke-width:1}
.pl-svg .rf08-plate{fill-opacity:.6;stroke:#fca5a5;stroke-width:1.4}
.pl-svg .rf08-pin{fill:#94a3b8}
.pl-svg .rf08-ch{fill:rgba(14,25,45,.78);stroke:#7dd3fc;stroke-width:2.4}
.pl-svg .rf08-bub{fill:rgba(30,41,59,.85);stroke:#4ade80;stroke-width:2}
.pl-svg .rf08-liq{fill:rgba(74,222,128,.2)}
.pl-svg .rf08-faf{stroke:#4ade80}
.pl-svg .rf08-tube{fill:none;stroke:#475569;stroke-width:5}
.pl-svg .rf08-sens{fill:#0f172a;stroke:#4ade80;stroke-width:3}
.pl-svg .rf08-rob{fill:#04140b;stroke:#4ade80;stroke-width:1.5}
.pl-svg .rf08-ro{font-size:19px;font-weight:800;fill:#4ade80 !important}
.pl-svg .rf08-abate{fill:rgba(30,41,59,.85);stroke:#a78bfa;stroke-width:2}
.pl-svg .rf08-fres{fill:#a16207;stroke:#fde68a;stroke-width:.8}
.pl-svg .rf08-n2{fill:#94a3b8;stroke:#e2e8f0;stroke-width:1}
.pl-svg .rf08-o2{fill:#f87171;stroke:#fecaca;stroke-width:1}
.pl-svg .rf08-hc{fill:#4ade80;stroke:#dcfce7;stroke-width:1}
.pl-svg .rf08-gauge{fill:#0f172a;stroke:#e2e8f0;stroke-width:2.4}
.pl-svg .rf08-needle{stroke:#f87171;stroke-width:3.4;stroke-linecap:round}
.pl-svg .rf08-hub{fill:#e2e8f0}
.pl-svg .rf08-pcur{fill:none;stroke:#f87171;stroke-width:3.2;stroke-linejoin:round}
.pl-svg .rf08-pnone{fill:none;stroke:#94a3b8;stroke-width:3;stroke-dasharray:9 7}
.pl-svg .rf08-dim{stroke:#fde68a;stroke-width:2}
.pl-svg .rf08-waf{fill:none;stroke-width:10;stroke-linecap:round}
.pl-svg .rf08-bt{fill:rgba(148,163,184,.14);stroke:rgba(148,163,184,.35);stroke-width:1}
.pl-svg .rf08-bf{stroke:none}
.pl-svg .rf08-o2b{fill:#38bdf8;stroke:none}
.pl-svg .rf08-slow{font-size:21px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .rf08-pt{font-size:19px;font-weight:800;fill:#fff7ed !important}
.pl-svg .rf08-wn{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .rf08-tw{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .rf08-lt{font-size:21px;font-weight:900;fill:#fca5a5 !important}
.pl-svg .rf08-lam{fill:#f87171;opacity:.85}
.pl-svg .rf08-lag{stroke:#f59e0b;stroke-width:3}
.pl-svg .rf08-edge{fill:none;stroke:#f472b6;stroke-width:3}
.pl-svg .rf08-221{fill:none;stroke:#fbbf24;stroke-width:1.6;stroke-dasharray:7 6}
.pl-svg .rf08-ref{fill:none;stroke:#64748b;stroke-width:2.2;opacity:.8}
.pl-svg .rf08-cur{fill:none;stroke:#38bdf8;stroke-width:3.4}
.pl-svg .rf08-heat{fill:none;stroke:#f59e0b;stroke-width:2.6;stroke-linecap:round}
.pl-svg .rf08-noz{fill:#475569;stroke:#94a3b8;stroke-width:1.2}
.pl-svg .rf08-fdrop{fill:#facc15}
.pl-svg .rf08-drop{fill:#7dd3fc}
.pl-svg .rf08-chuck{fill:#334155;stroke:#64748b;stroke-width:1.2}
.pl-svg .rf08-elec{fill:#475569;stroke:#a78bfa;stroke-width:1.4}
.pl-svg .rf08-plz{fill:rgba(167,139,250,.28);stroke:#a78bfa;stroke-width:1.4}
.pl-svg .rf08-ion{fill:#c4b5fd}
.pl-svg .rf08-brush{fill:#1e3a5f;stroke:#7dd3fc;stroke-width:1.4}
.pl-svg .rf08-brl{stroke:#7dd3fc;stroke-width:2}`
});
})();
