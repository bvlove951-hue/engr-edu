/* 리플로우 07 — 보이드: 솔더 속 빈 구멍은 어디서 와서 왜 남을까? (기체 출처 · 붙은 기포 · 진공의 한계 · 자리로 출처 읽기 — 범프 속 · µm) */
(function(){
// ── 개념 모델 (기획 rev.2 · 07장 — 상수는 가정값, K.model 에 밝힌다)
//  떠 있는 기포는 셈하지 않는다: 스토크스 속도 약 50 µm/s(지름 5 µm) → 15.7 µm 돔을 약 0.3초에 빠져나감
//  붙는 기체 V_g = 4.44 % × (G + 0.25·플럭스),  G: 적음 0.5 · 보통 1 · 많음 2  (지름 5 µm 기포 4개 = 솔더 5,890 µm³의 4.44 %)
//  붙은 기포 N₀ = V_g·V_솔더 ÷ (π/6·b³),  빠지는 시간 규모 τ(r) = 40 s × (2.5 µm / r)²  (붙은 기포가 커지거나 합쳐져 겉에 닿기까지)
//  진공 P(mbar): (P + P_d + 2γ/r)·r³ = (P₀ + P_d + 2γ/r₀)·r₀³ (영–라플라스, P₀ 1,013 mbar, P_d = 2γ/R_돔 ≈ 0.78 bar, γ 0.5 N/m)
//  녹은 시간 앞 절반은 1기압, 뒤 절반은 진공:  f = e^(−(TAL/2)/τ(r₀)) · e^(−(TAL/2)/τ(r_P)),  보이드 % = V_g · f,  남은 기포 = N₀ · f
const VS = 5890, P0 = 101325, PDOME = 78000, GAM = 0.5;
const GSRC = {lo: 0.5, mid: 1, hi: 2};
const vb = d => Math.PI / 6 * d * d * d;                       // 지름 d µm 기포의 부피 (µm³)
const VG1 = 4 * vb(5) / VS * 100;                               // 4.44 % (보통 = 지름 5 µm 기포 4개)
const tau = r => 40 * Math.pow(2.5 / r, 2);                     // r(µm) → 초
function rVac(r0, P){                                           // 반지름 r0(µm) 기포가 바깥 P(mbar)에서 → r(µm)
  if (P >= 1013) return r0;
  const a = r0 * 1e-6, C = (P0 + PDOME + 2 * GAM / a) * a * a * a, p = P * 100;
  let lo = a, hi = a * 10;
  for (let k = 0; k < 80; k++){ const m = (lo + hi) / 2; if ((p + PDOME + 2 * GAM / m) * m * m * m < C) lo = m; else hi = m; }
  return (lo + hi) / 2 * 1e6;
}
function model(s){
  const G = GSRC[s.src] || 1, fx = s.fx === '1' ? 1 : 0, b = +s.bs, r0 = b / 2, P = +s.vac;
  const per = VS / vb(b) / 100;                                 // 솔더 1 %에 해당하는 기포 수
  const vg = VG1 * (G + 0.25 * fx), N0s = VG1 * G * per, N0f = VG1 * 0.25 * fx * per;
  const rp = rVac(r0, P), f = Math.exp(-(s.tal / 2) / tau(r0)) * Math.exp(-(s.tal / 2) / tau(rp));
  const v = vg * f, lv = v < 0.5 ? 'ok' : v <= 2 ? 'warn' : 'ng';
  const pin = (P0 + PDOME + 2 * GAM / (r0 * 1e-6)) / 1e5;      // 1기압에서 기포 속 압력 (bar)
  return {G, fx, b, r0, P, vg, N0: N0s + N0f, N0s, N0f, rp, ratio: rp / r0, f, v, lv, N: (N0s + N0f) * f, Ns: N0s * f, Nf: N0f * f, pin};
}
// 50 mbar에서 지름 배수 (비교 막대 — 위젯 값과 무관, 계산값)
const CMP = [['범프 속 5 µm', 1.09], ['모여 커진 10 µm', 1.14], ['보드 · 파워 200 µm', 2.3]];
// 발표 모드 · 손대기 전: 위젯 기본값 + 단계마다 이 값만 덮어쓴다
const DEF = {src: 'mid', fx: '0', tal: 60, vac: '1000', bs: '5'};
const DEMO = {gas: {src: 'hi'}, stay: {tal: 20}, vac: {vac: '50'}, where: {fx: '1'}};
const fV = v => v < 0.1 ? v.toFixed(3) : v.toFixed(2);
const fN = n => n < 0.0005 ? '0' : n < 0.1 ? n.toPrecision(1) : n.toFixed(1);
const pc = x => Math.round(x * 100) + ' %';
const fI = n => Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1);   // 개수: 정수면 소수점 없이

// ── 무대 배치 (1600 × 1140)
//  왼쪽 위(x 60~960, y 140~560): 단계별 그림 · 왼쪽 아래: 두 범프(12 px/µm) — '녹아 있는 동안'(CXL) · '굳은 뒤'(CXR)
//  오른쪽 패널(x 1000~1560): 위 X-ray 개념 그림, 아래 '자리 → 출처' 표
const PX = 12, CXL = 240, CXR = 600, YN = 842, YI = 834, A = 150, H = 189;   // Ni 윗면 y, IMC 윗면 y, 돔 반폭 · 높이 (px)
const RD = (A * A + H * H) / (2 * H), CYD = YN - H + RD;                  // 돔(구 모자)의 구 반지름 · 중심 y
const surfY = dx => CYD - Math.sqrt(Math.max(0, RD * RD - dx * dx));     // 가운데에서 dx 떨어진 곳의 돔 겉 y
const cap = (cx, y0, a, h) => { const R = (a * a + h * h) / (2 * h); return `M${cx - a},${y0} A${R.toFixed(1)},${R.toFixed(1)} 0 ${h > a ? 1 : 0} 1 ${cx + a},${y0} Z`; };
const arc = (cx, y0, a, h) => cap(cx, y0, a, h).slice(0, -2);              // 같은 돔의 겉 곡선만 (바닥선 없이)
const XR = [1100, 1280, 1460], XRY = 300, XRR = 70, XPX = XRR / 12.5;      // X-ray 원 (위에서 본 범프, 반지름 12.5 µm → 70 px)
const ROWS = [
  ['① Ni 계면에 붙음', '층 사이 오염 · 계면 찌꺼기', '앞 공정 — 도금 층 사이 · 스트립 · 식각'],
  ['② 솔더 속 작은 무리', '막 속 유기물 (분해산물)', '앞 공정 — 도금액 나이'],
  ['③ 겉 가까이', '플럭스 기체 · 늦게 나온 기체', '리플로우 — 플럭스 양 · 예열'],
  ['④ Cu 쪽 빈자리 줄', '커켄달 (Cu₃Sn 속)', '고온 시효 뒤 — Cu 옆면 · 상대 Cu 패드']
];
const TY0 = 604, TRH = 112;                                               // 표 첫 줄 y, 줄 높이
const VN = {x: 40, y: 128, w: 940, h: 992}, VN_W = {x: 50, y: 140, w: 920, h: 440};   // 좁은 세로 화면 확대 (where 는 위 그림만)

(window.EngrReflowChapters = window.EngrReflowChapters || []).push({
  no: '07', id: 'void', part: 3, short: '보이드', scale: '범프 속 · µm',
  title: '보이드 — 솔더 속 빈 구멍은 어디서 와서 왜 남을까?',
  hook: '남는 기포는 바닥에 붙어 있다',
  one: '보이드는 솔더 속에 갇힌 기체 방울이 그대로 굳은 자리입니다. 기체는 도금막 속 유기물, 도금 층 사이 · 계면 찌꺼기, 플럭스의 용제 · 활성제에서 나옵니다. 마이크로범프에서 떠 있는 기포는 금방 표면으로 빠지지만, Ni · IMC 계면에 붙어 생긴 기포는 부력이 너무 약해 떨어지지 못하고 남습니다.',
  ana: '<b>컵 벽에 붙은 탄산 거품</b> — 탄산수 속을 떠다니는 거품은 금방 올라가 터지지만, 컵 벽 · 바닥의 흠에 붙어 생긴 거품은 한참 붙어 있습니다. 보이드도 대부분 계면에 붙은 기포가 남은 것입니다. <i>(비유의 한계: 탄산 거품은 mm 크기로 커지면 떨어지지만, 범프는 25 µm 남짓이라 기포가 그만큼 클 수 없어 겉에 닿거나 이웃과 합쳐져야 빠집니다. 또 기체는 녹아 있던 것이 아니라 막 속 유기물 · 계면 찌꺼기 · 플럭스에서 나옵니다.)</i>',
  steps: [
    {id: 'gas', t: '기체는 어디서 오나', d: '기체 출처는 세 곳입니다. 도금막 속 유기물(첨가제 조각)은 솔더 전체에서, 도금 층 사이 오염(Ni → SnAg 대기 · 헹굼)은 Ni 바닥에서, 플럭스 용제 · 반응으로 생긴 물은 솔더 겉에서 나옵니다. 바닥 가까운 보이드는 앞 공정을 먼저 의심합니다.', viewN: VN},
    {id: 'stay', t: '왜 갇히나 — 붙은 기포', d: '녹은 솔더는 물처럼 묽어(점도 약 2배), 떠 있는 작은 기포는 1초도 안 돼 표면에 닿아 빠집니다. 남는 것은 Ni · IMC 계면이나 찌꺼기에 붙어 생긴 기포입니다. 부력은 붙드는 힘(표면장력)의 백만분의 일이라, 커지거나 합쳐져 표면에 닿기 전에는 떨어지지 않습니다.', viewN: VN},
    {id: 'vac', t: '빼내기 — 시간 · 진공의 한계', d: '녹아 있을 때 진공을 걸면 기포가 부풀어 표면에 닿기 쉬워집니다. 다만 수 µm 기포는 속 압력이 이미 몇 기압(라플라스 압력)이라 지름이 10 % 안팎만 커집니다. 진공은 합쳐진 큰 기포 · 큰 접합에 잘 듣고, 급히 걸면 솔더가 튑니다. 작은 범프는 기체를 덜 만드는 것이 먼저입니다.', viewN: VN},
    {id: 'where', t: '자리로 출처 읽기', d: '보이드가 어디 붙어 있는지 보면 출처가 좁혀집니다(보통). Ni 계면에 붙은 것은 계면 찌꺼기 · 산화(앞 공정), 솔더 속에 흩어진 작은 무리는 막 속 유기물, 겉 가까이는 플럭스 기체입니다. Cu 쪽 빈자리 줄은 고온 시효 뒤의 커켄달입니다(<a data-go="imc.cu">05장</a>).', viewN: VN_W}
  ],
  icon(K){
    const {P, C, R} = K;
    return P('M6,54 A27,27 0 0 1 60,54 Z', 'f-sn2') + C(22, 49, 5, 'f-void') + C(38, 50, 3.5, 'f-void') + C(42, 36, 2.5, 'f-void') + R(6, 54, 54, 6, 'f-ni');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, W, wrap} = K;
    const domeL = cap(CXL, YN, A, H), domeR = cap(CXR, YN, A, H), domeW = cap(260, 520, A, H);
    let s = '<defs>' +
      `<clipPath id="${K.id('rf07-cl')}"><path d="${domeL}"/></clipPath>` +
      `<clipPath id="${K.id('rf07-cr')}"><path d="${domeR}"/></clipPath>` +
      `<clipPath id="${K.id('rf07-cw')}"><path d="${domeW}"/></clipPath>` +
      `<filter id="${K.id('rf07-blur')}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2"/></filter>` +
      '</defs>';

    // ════ 왼쪽 위: 단계별 그림 ════
    // gas — 기체 출처 세 칸
    let gs = '';
    const LANE = [
      ['① 막 속 유기물', '→ 솔더 전체에서', '도금 첨가제 조각이 막에 갇힌 것 — 액이 오래될수록 늘어남'],
      ['② 층 사이 · 계면', '→ Ni 바닥에서', 'Ni → SnAg 사이 대기 · 헹굼, 스트립 · 식각 뒤 찌꺼기'],
      ['③ 플럭스', '→ 솔더 겉에서', '용제 · 반응으로 생긴 물 — 겉에서 생겨 대부분 바로 빠짐']
    ];
    LANE.forEach(([t1, t2, d], i) => {
      const x = 70 + i * 300;
      gs += R(x, 146, 280, 356, 'pl-lane', {rx: 12});
      gs += T(x + 16, 182, t1, 'pl-hdg', 'start') + T(x + 16, 210, t2, 't-dim', 'start');
      let pic = '';
      if (i === 0){
        pic += R(x + 20, 228, 240, 140, 'f-sn2', W({rx: 8}, tip('도금한 SnAg 막 (단면)')));
        const g = K.rng(31);
        for (let k = 0; k < 11; k++){
          const px = x + 36 + g() * 208, py = 244 + g() * 112;
          pic += C(px, py, 5, 'rf07-org', tip('막 속 유기물 — 도금 첨가제(광택제 · 억제제)의 조각 · 분해산물'));
          if (k % 3 === 0 && py > 270) pic += K.bubble(px, py - 6, 4 + (k % 2) * 2, py - 250, 1.8 + g() * 0.6, g() * 2);
        }
      } else if (i === 1){
        pic += R(x + 20, 228, 240, 96, 'f-sn2', W({rx: 6}, tip('SnAg 솔더')));
        pic += R(x + 20, 324, 240, 44, 'f-ni', tip('Ni 3 µm — 이 위에 SnAg를 바로 도금한다'));
        pic += T(x + 140, 354, 'Ni', 'rf07-dk');
        const g = K.rng(41);
        for (let k = 0; k < 7; k++){
          const px = x + 36 + k * 34 + g() * 8;
          pic += C(px, 321, 4.5, 'rf07-res', tip('층 사이 찌꺼기 · 산화 — Ni 도금 뒤 대기 · 헹굼 물기, 앞 공정(스트립 · 식각)이 남긴 것'));
          if (k % 2 === 0) pic += `<circle cx="${(px + 6).toFixed(1)}" cy="310" r="0" class="pl-air"><animate attributeName="r" values="0;10;10;0" keyTimes="0;.55;.92;1" dur="${(3 + k * 0.3).toFixed(1)}s" begin="-${(k * 0.7).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
        }
        pic += E2(K, x + 70, 300, 'rf07-h2o') + E2(K, x + 196, 296, 'rf07-h2o');
      } else {
        pic += R(x + 40, 366, 200, 12, 'f-ni');
        pic += P(cap(x + 140, 366, 100, 94), 'f-sn2', tip('솔더 (리플로우 중)'));
        pic += P(arc(x + 140, 366, 106, 101), 'rf07-flx', tip('플럭스 층 — 겉에 바른다 (Ni 계면에는 없다)'));
        for (let k = 0; k < 3; k++){
          const sx = x + 100 + k * 40, sy = 262 + (k === 1 ? -4 : 6);
          pic += P(`M${sx},${sy} q-7,-8 0,-16 q7,-8 0,-16`, 'rf07-steam', tip('용제 · 반응으로 생긴 물이 김으로 빠져나감'));
        }
        pic += K.mover(x + 214, 300, x + 254, 270, 5, 'pl-air', 1.8, 0) + K.mover(x + 66, 300, x + 30, 272, 4, 'pl-air', 2.2, 1);
      }
      gs += pic + TT(x + 16, 400, wrap(d, 12.2), 't-sub', 'start', 26);
    });
    gs += T(80, 536, '바닥(Ni 계면) 가까운 보이드는 앞 공정을 먼저 의심합니다', 't-warn', 'start');
    s += G(gs, only('gas'));

    // stay — 떠 있는 기포 vs 붙은 기포
    let sy = T(80, 172, '떠 있는 기포는 금방 빠지고, 붙은 기포는 남는다', 't-acc', 'start');
    const tx = t => 120 + t / 90 * 780;
    sy += T(80, 212, '① 떠 있는 기포 — 표면까지 약 0.3초', 'pl-hdg', 'start');
    sy += R(tx(30), 228, tx(90) - tx(30), 34, 'rf07-talz', tip('녹아 있는 시간 — 보통 30~90초 (예시)')) + T((tx(30) + tx(90)) / 2, 252, '녹아 있는 시간 (보통 30~90초)', 't-dim');
    sy += R(tx(0), 228, 6, 34, 'rf07-fast', tip('떠 있는 지름 5 µm 기포가 15.7 µm 돔을 빠져나가는 시간 — 약 0.3초')) + T(tx(0) + 16, 252, '← 0.3초', 't-warn', 'start');
    sy += L(tx(0), 268, tx(90), 268, 's-axis');
    [0, 30, 60, 90].forEach(t => { sy += L(tx(t), 268, tx(t), 276, 's-axis') + T(tx(t), 296, t === 90 ? '90초' : String(t), 't-dim'); });
    sy += T(80, 326, '스토크스 속도 약 50 µm/s (지름 5 µm · 점도 약 2 mPa·s, 물의 약 2배)', 't-dim', 'start');
    sy += T(80, 370, '② 붙은 기포 — 부력 : 붙드는 힘(표면장력) ≈ 1 : 1,000,000', 'pl-hdg', 'start');
    sy += T(214, 404, '붙드는 힘', 't-sub', 'end') + R(226, 386, 674, 26, 'rf07-bten', tip('기포를 계면에 붙드는 힘 — 표면장력 × 둘레'));
    sy += T(214, 442, '부력', 't-sub', 'end') + R(226, 424, 2, 26, 'rf07-buoy', tip('부력 — 붙드는 힘의 약 백만분의 일 (지름 5 µm)')) + T(240, 442, '← 백만분의 1 — 그림에 안 보일 만큼 작다', 't-dim', 'start');
    sy += T(80, 486, '기포 속 압력 ≈ 5.8 bar = 바깥 1 + 돔 0.8 + 라플라스 4.0 → 진공의 한계 (다음 단계)', 't-dim', 'start');
    sy += T(80, 532, '남는 것은 붙은 기포 — 계면이 깨끗할수록 붙을 자리가 적다', 't-warn', 'start');
    s += G(sy, only('stay'));

    // vac — 압력–시간 그래프(위젯) + 50 mbar 지름 배수 비교 (계산값)
    let vc = T(80, 166, '녹아 있는 동안만 진공 — 압력 (mbar, 세로 로그)', 't-acc', 'start');
    vc += L(200, 190, 200, 352, 's-axis') + L(200, 352, 910, 352, 's-axis');
    [[1000, 190], [100, 271], [10, 352]].forEach(([p, y]) => { vc += L(194, y, 200, y, 's-axis') + T(188, y + 7, String(p), 't-dim', 'end'); });
    vc += '<g data-v="vg"></g>';
    vc += T(80, 414, '데울 때는 기체 속에서, 녹은 동안만 진공, 굳기 전에 되돌린다', 't-dim', 'start');
    vc += T(80, 450, '50 mbar에서 기포 지름은? — 작을수록 속 압력이 커서 덜 부푼다 (계산)', 'pl-hdg', 'start');
    CMP.forEach(([nm, k], i) => {
      const x0 = 90 + i * 290, cx = x0 + 52, cy = 506, r0 = 17;
      vc += C(cx, cy, r0 * k, i === 2 ? 'pl-air rf07-big' : 'pl-air', tip(`${nm} 기포 — 1,013 → 50 mbar에서 지름 ×${k} (영–라플라스 + 돔 압력 계산)`)) + C(cx, cy, r0, 'pl-ghost');
      if (i === 2) vc += C(cx, cy, r0 * 2.73, 'rf07-ideal', tip('이상 기체만 보면(라플라스 압력 무시) ×2.7'));
      vc += T(x0 + 112, 498, nm, 't-dim', 'start') + T(x0 + 112, 528, `×${k}` + (i === 2 ? ' (점선 ×2.7)' : ''), i === 2 ? 't-warn' : 't-sub', 'start');
    });
    s += G(vc, only('vac'));

    // where — 큰 돔 단면 + 자리 ①②③ · Cu 쪽 ④
    let wh = T(80, 172, '보이드가 붙은 자리로 출처를 좁힌다', 't-acc', 'start') + T(80, 200, '자리 판단은 보통의 경향 — 단면 · FIB로 확인합니다', 't-dim', 'start');
    wh += R(110, 520, 300, 22, 'f-ni', tip('Ni'));
    wh += P(domeW, 'f-sn2', tip('굳은 SnAg 솔더 단면 (지름 25 µm, 12 px/µm)'));
    let wv = C(196, 504, 16, 'f-void', tip('① Ni 계면에 붙은 보이드')) + C(316, 507, 12, 'f-void', tip('① Ni 계면에 붙은 보이드'));
    const g2 = K.rng(77);
    for (let k = 0; k < 9; k++) wv += C(226 + g2() * 54, 424 + g2() * 34, 3.5 + g2() * 2, 'f-void', tip('② 솔더 속에 흩어진 작은 보이드 무리 (샴페인 보이드)'));
    wv += C(330, 372, 10, 'f-void', tip('③ 겉 가까이의 보이드'));
    wh += G(wv, {'clip-path': K.url('rf07-cw')}) + R(110, 513, 300, 7, 'f-imc', tip('Ni₃Sn₄ (IMC)'));
    wh += LB(P('M342,372 L440,372 M284,440 L440,446 M330,503 L440,514', 's-lead') + C(342, 372, 3.5, 'k-lead') + C(284, 440, 3.5, 'k-lead') + C(330, 503, 3.5, 'k-lead'));
    wh += T(448, 380, '③ 겉 가까이 → 플럭스 기체', 't-sub', 'start') + T(448, 406, '늦게 나온 기체도 (대부분은 바로 빠짐)', 't-dim', 'start');
    wh += T(448, 452, '② 솔더 속 작은 무리 → 막 속 유기물', 't-sub', 'start') + T(448, 478, '도금액이 오래될수록 늘어남', 't-dim', 'start');
    wh += T(448, 520, '① Ni 계면에 붙음 → 계면 찌꺼기 · 산화', 't-sub', 'start') + T(448, 546, '앞 공정: 도금 층 사이 · 스트립 · 식각', 't-dim', 'start');
    // ④ Cu 쪽 (다른 자리 — Ni 방벽이 없는 Cu)
    wh += R(450, 222, 500, 116, 'pl-lane', {rx: 10});
    wh += R(464, 236, 156, 30, 'f-sn2') + P(scal(464, 620, 276, 14, 5), 'f-imc', tip('Cu₆Sn₅ (가리비 모양 IMC)'));
    wh += R(464, 276, 156, 18, 'pl-imc3', tip('Cu₃Sn — 고온에서 Cu 쪽 빈자리가 모이는 층'));
    for (let k = 0; k < 10; k++) wh += C(472 + k * 15.5, 291, 2.8, 'f-void', tip('④ 커켄달 보이드 줄 — Cu가 Sn보다 빨리 빠져나가 남은 빈자리'));
    wh += R(464, 294, 156, 32, 'f-cu2', tip('Cu (기둥 옆면 · 상대 Cu 패드)'));
    wh += T(636, 256, '④ Cu 쪽 빈자리 줄 → 커켄달', 't-sub', 'start') + T(636, 284, '고온 시효 뒤 (Cu₃Sn 속)', 't-dim', 'start') + T(636, 312, 'Cu 옆면 · 상대 Cu 패드 (05장)', 't-dim', 'start');
    s += G(wh, only('where'));

    // ════ 왼쪽 아래: 두 범프 (where 에서 흐리게) ════
    let bp = '';
    [[CXL, domeL, 'rf07-cl', '녹아 있는 동안'], [CXR, domeR, 'rf07-cr', '굳은 뒤 (단면)']].forEach(([cx, dome, cl, ttl], i) => {
      const x0 = cx - A, x1 = cx + A;
      let zz = `M${x0},878 L${x1},878 L${x1},958`;
      for (let k = 1; k <= 12; k++) zz += ` L${(x1 - k * 25).toFixed(0)},${k % 2 ? 970 : 958}`;
      bp += P(zz + ' Z', 'f-cu2', tip('Cu 기둥 15 µm (위쪽 일부만 그림)'));
      bp += R(x0, YN, 2 * A, 36, 'f-ni', tip('Ni 3 µm — 솔더와 Cu 사이 방벽'));
      bp += P(dome, 'f-sn2', tip(i ? '굳은 SnAg 솔더 — 보이드는 굳기 전 기포가 남은 자리' : '녹은 SnAg 솔더 (돔, 지름 25 µm · 꼭대기 약 15.7 µm)'));
      if (!i) bp += P(arc(cx, YN, A, H), 'rf07-liq');
      bp += G(`<g data-v="${i ? 'br' : 'bl'}"></g>`, {'clip-path': K.url(cl)});
      bp += R(x0, YI, 2 * A, YN - YI, 'f-imc', tip('Ni₃Sn₄ (IMC) — 기포 · 보이드가 주로 붙는 계면'));
      bp += T(cx, 604, ttl, 'pl-hdg');
    });
    bp += '<g data-v="pop"></g>';
    bp += K.arrow(366, 716, 474, 716, 's-arr2') + T(420, 698, '식으면', 't-dim');
    bp += K.lead(CXR + A - 6, YI + 3, 772, 836, 'IMC (Ni₃Sn₄)', 'start', 't-dim') + K.lead(CXR + A - 6, YN + 20, 772, 874, 'Ni 3 µm', 'start', 't-dim') + K.lead(CXR + A - 6, 920, 772, 920, 'Cu 기둥 (일부)', 'start', 't-dim');
    bp += '<g data-v="lead"></g><g data-v="cap"></g>';
    s += `<g data-v="bumps">${bp}</g>`;

    // ════ 오른쪽 패널 ════
    s += R(1000, 130, 560, 970, 'pl-panel', {rx: 14});
    s += T(1024, 170, 'X-ray로 위에서 보면 (개념 그림)', 't-acc', 'start') + T(1024, 198, '범프 셋 · 밝은 점 = 남은 보이드', 't-dim', 'start');
    s += R(1018, 216, 524, 168, 'rf07-xbg', W({rx: 8}, tip('X-ray 투과 영상 (개념) — 솔더가 X선을 막아 어둡고, 빈 곳은 밝게 보인다')));
    XR.forEach(x => { s += C(x, XRY, XRR, 'rf07-xb', tip('위에서 본 범프 (지름 25 µm)')); });
    s += '<g data-v="xr"></g>';
    s += TT(1024, 484, wrap('지름 5 µm는 2D X-ray 해상도에 가까운 크기 — 단면 · FIB · 3D X-ray로 확인합니다', 24), 't-dim', 'start', 26);
    // 자리 → 출처 표
    s += R(1014, 548, 532, 540, 'pl-hlbox', W({rx: 12}, only('where')));
    s += T(1024, 584, '자리 → 출처 (보통)', 't-acc', 'start');
    ROWS.forEach(([a, b, c], i) => {
      const y = TY0 + i * TRH;
      if (i) s += L(1024, y, 1536, y, 's-faint');
      s += mini(K, i, 1072, y + 86) + T(1128, y + 34, a, 'pl-hdg', 'start') + T(1128, y + 62, b, 't-sub', 'start') + T(1128, y + 90, c, 't-dim', 'start');
    });
    s += T(1024, 1076, '「보이드의 네 얼굴」은 전해도금 12장 (노트의 링크)', 't-dim', 'start');
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 기포 빼기</div>
      ${K.seg('src', [['lo', '적음 — 깨끗한 막 · 계면'], ['mid', '보통'], ['hi', '많음 — 막 속 유기물 · 층 사이 오염']], 'mid', '솔더 속 · Ni 계면 기체 (앞 공정)')}
      ${K.ctl('tal', '녹아 있는 시간 (초)', 10, 150, 5, 60)}
      ${K.seg('vac', [['1000', '진공 없음'], ['300', '300 mbar'], ['50', '50 mbar']], '1000', '녹아 있을 때 진공')}
      <div class="pl-chips rf07-two">${K.seg('fx', [['0', '없음 (포름산 · 질소)'], ['1', '있음 — 겉에 바름']], '0', '플럭스')}${K.seg('bs', [['5', '지름 5 µm'], ['10', '10 µm (모여 커진 기포)']], '5', '붙은 기포 크기')}</div>
      ${K.kpis([['생긴 기체', 'k-g', '솔더 부피의 % (붙는 몫, 1기압)'], ['남은 보이드', 'k-v', '솔더 부피의 %'], ['남은 기포', 'k-n', '범프당 평균 개수'], ['진공에서 지름', 'k-r', '배 (라플라스 압력 때문에 조금)']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('붙은 기포의 수 · 크기 · 빠지는 시간(40초)과 그 크기 의존성(1/r²), 플럭스 기체의 붙는 몫(0.25)은 경향을 보이는 가정값입니다. 떠 있는 기포는 스토크스 속도로 1초 안에 빠진다고 보고 셈하지 않았습니다. 진공에서의 크기는 기포 속 압력 = 바깥 + 돔 압력 + 2γ/r(영–라플라스)로 계산했습니다. 공개된 진공 효과(50 mbar 미만, 10 mbar에서 보이드 2 % 미만)는 기포가 수백 µm인 보드 · 파워 접합 자료라 마이크로범프에 그대로 옮기지 않습니다. 판정 경계(0.5 · 2 %)도 개념 예시입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip, W} = K;
    let touched = false;
    const st = Object.assign({}, DEF);
    const inp = ctx.card.querySelector('input[data-i=tal]');
    const ab = (n, d = 1) => n.toFixed(d);
    // 붙은 기포 자리: n개를 가운데 cx 기준 dx 로 고르게 (지름 r px), 남는 것의 번호
    function spots(n, r){
      const Wd = Math.max(0, 2 * (A - 1.05 * r)), g = K.rng(4), out = [];
      for (let i = 0; i < n; i++) out.push(n === 1 ? (g() - 0.5) * 30 : -Wd / 2 + (i + 0.5) * Wd / n + (g() - 0.5) * Math.min(14, Wd / n * 0.3));
      return out;
    }
    const stayIdx = (n, k) => { const s = new Set(); for (let j = 0; j < k; j++) s.add(Math.min(n - 1, Math.floor((j + 0.5) * n / k))); return s; };
    const cnt = x => x >= 0.2 && x < 1 ? 1 : Math.min(10, Math.round(x));      // 그릴 개수 (0.2~1이면 하나)
    const B = (dur, d) => `dur="${dur}s" begin="-${d.toFixed(2)}s" repeatCount="indefinite"`;
    // 붙어 있다가 커져 떨어져 올라가 겉에서 터지는 기포 (반복)
    function escB(x, yb, ys, r, dur, d){
      const b = B(dur, d);
      return `<circle cx="${x.toFixed(1)}" cy="${yb.toFixed(1)}" r="${r}" class="pl-air"><animate attributeName="r" values="${(r * .25).toFixed(1)};${r};${(r * 1.3).toFixed(1)};${(r * 1.3).toFixed(1)}" keyTimes="0;.15;.5;1" ${b}/><animate attributeName="cy" values="${yb.toFixed(1)};${yb.toFixed(1)};${ys.toFixed(1)};${ys.toFixed(1)}" keyTimes="0;.52;.64;1" ${b}/><animate attributeName="opacity" values="0;1;1;1;0;0" keyTimes="0;.06;.52;.63;.65;1" ${b}/></circle>`;
    }
    function popR(x, ys, dur, d, kt = .64){
      const b = B(dur, d);
      return `<circle cx="${x.toFixed(1)}" cy="${ys.toFixed(1)}" r="3" class="rf07-pop"><animate attributeName="r" values="3;3;24;24" keyTimes="0;${kt};${(kt + .12).toFixed(2)};1" ${b}/><animate attributeName="opacity" values="0;0;.95;0;0" keyTimes="0;${(kt - .01).toFixed(2)};${kt};${(kt + .12).toFixed(2)};1" ${b}/></circle>`;
    }
    // 생겨나는 기포 (gas 단계)
    const nucB = (x, y, r, dur, d) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="0" class="pl-air"><animate attributeName="r" values="0;${r};${r};0" keyTimes="0;.5;.92;1" ${B(dur, d)}/></circle>`;
    // 남는 기포 — 제자리에서 아주 작게 흔들림
    const stayB = (x, y, r, k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" class="pl-air rf07-st"><animate attributeName="cx" values="${x.toFixed(1)};${(x + 1.6).toFixed(1)};${(x - 1.6).toFixed(1)};${x.toFixed(1)}" ${B(2.4 + k * .3, k * .5)}/></circle>`;
    // 진공에서 조금 부풀었다 되돌아오는 기포 + 1기압 크기 점선
    const vacB = (x, y, r, rp, k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" class="pl-air rf07-st"><animate attributeName="r" values="${r};${r};${rp.toFixed(1)};${rp.toFixed(1)};${r}" keyTimes="0;.25;.4;.85;1" ${B(5, k * .4)}/></circle>` + C(x, y, r, 'rf07-ring0');

    function bumpsL(m){
      const r = m.b / 2 * PX, n = cnt(m.N0s), ns = Math.min(n, Math.round(m.Ns)), dx = spots(n, r), keep = stayIdx(n, ns);
      const yb = YI - 0.6 * r;
      let gas = '', stay = '', vac = '', pops = '', popsV = '';
      dx.forEach((d, i) => {
        const x = CXL + d, ys = surfY(d) + 2, dl = i * 1.3 + 0.4;
        gas += nucB(x, yb, r, 4 + i * 0.25, i * 0.6);
        if (keep.has(i)){ stay += stayB(x, yb, r, i); vac += vacB(x, yb, r, r * m.ratio, i); }
        else { const e = escB(x, yb, ys, r, 5.5, dl); stay += e; vac += e; pops += popR(x, ys, 5.5, dl); }
      });
      // 플럭스 기체 — 겉 가까이 (대부분 바로 빠짐)
      const nf = cnt(m.N0f), nfs = Math.min(nf, Math.round(m.Nf));
      for (let k = 0; k < nf; k++){
        const d = 92 - k * 40, rr = Math.min(r, 26), x = CXL + d, y = surfY(d) + rr + 8, ys = surfY(d) + 2;
        gas += nucB(x, y, rr, 3.6, 1.2);
        if (k < nfs){ stay += stayB(x, y, rr, 7); vac += vacB(x, y, rr, rr * m.ratio, 7); }
        else { const e = escB(x, y, ys, rr, 3.4, 0.8 + k); stay += e; vac += e; pops += popR(x, ys, 3.4, 0.8 + k); }
      }
      // 떠 있는 작은 기포 — 빨리 올라가 터진다 (0.3초면 빠진다)
      let fl = '';
      [[-40, 806, 0], [52, 790, 1.1]].forEach(([d, y0, dl]) => {
        const x = CXL + d, ys = surfY(d) + 2, b = B(2.2, dl);
        fl += `<circle cx="${x}" cy="${y0}" r="8" class="pl-air rf07-fl"><animate attributeName="cy" values="${y0};${y0};${ys.toFixed(1)};${ys.toFixed(1)}" keyTimes="0;.12;.36;1" ${b}/><animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.1;.35;.37;1" ${b}/></circle>`;
        popsV += popR(x, ys, 2.2, dl, .37);
      });
      ctx.$('[data-v="bl"]').innerHTML = G(gas, K.only('gas')) + G(stay, K.only('stay where')) + G(vac, K.only('vac')) + G(fl, K.only('stay vac')) +
        G(srcMarks(), K.only('gas'));
      ctx.$('[data-v="pop"]').innerHTML = G(pops, K.only('stay vac where')) + G(popsV, K.only('stay vac')) + G(gasOut(), K.only('gas'));
      return {n, ns, dx, r, yb, nf};
    }
    // gas 단계: 범프 속 출처 표시 ① 솔더 속 유기물 ② Ni 바닥 찌꺼기 (돔 안 — 잘림 묶음)
    function srcMarks(){
      let s = '';
      [[198, 760], [236, 712], [284, 748], [306, 792], [178, 806], [262, 676]].forEach(([x, y]) => { s += C(x, y, 5, 'rf07-org'); });
      [-118, -58, 6, 66, 122].forEach(d => { s += C(CXL + d, YI - 3, 4.5, 'rf07-res'); });
      return s;
    }
    // gas 단계: 돔 밖 — 플럭스 층 · 김 · 번호
    function gasOut(){
      let s = P(arc(CXL, YN, A + 5, H + 6), 'rf07-flx rf07-flxd', tip('③ 플럭스를 쓸 때 겉에 바른 층 (그림은 위젯 설정과 무관하게 보임)'));
      for (let k = 0; k < 3; k++){ const sx = CXL + 70 + k * 22, sy = surfY(70 + k * 22) - 6; s += P(`M${sx.toFixed(0)},${sy.toFixed(0)} q-8,-10 0,-20 q8,-10 0,-20`, 'rf07-steam'); }
      s += LB(T(98, 698, '①', 'rf07-num') + L(110, 704, 190, 756, 's-lead') + T(62, 870, '②', 'rf07-num') + L(76, 862, 116, 838, 's-lead') + T(396, 650, '③', 'rf07-num'));
      return s;
    }
    function bumpsR(m, L0){
      const r = L0.r, ns = L0.ns, keep = stayIdx(L0.n, ns), yb = L0.yb;
      let s = '', lead = null;
      L0.dx.forEach((d, i) => { if (keep.has(i)){ const x = CXR + d; s += C(x, yb, r, 'f-void', tip(`보이드 — Ni 계면에 붙은 채 굳음 (지름 ${m.b} µm)`)); if (!lead || x > lead[0]) lead = [x, yb]; } });
      let ghost = false;
      if (!ns && m.Ns >= 0.15){ ghost = true; s += C(CXR + 30, yb, r, 'rf07-gv', tip(`범프 약 ${Math.round(1 / m.Ns)}개 중 1개꼴로 생기는 보이드 (평균 ${fN(m.Ns)}개)`)); lead = [CXR + 30, yb]; }
      // 플럭스 몫 — 겉 가까이
      const nfs = Math.round(m.Nf), rr = Math.min(r, 26), xf = CXR + 92, yf = surfY(92) + rr + 8;
      let flead = null;
      if (nfs >= 1){ s += C(xf, yf, rr, 'f-void', tip('③ 겉 가까이 보이드 — 플럭스 기체가 밑동 · 틈에 말려 든 몫')); flead = [xf, yf]; }
      else if (m.Nf >= 0.15){ ghost = true; s += C(xf, yf, rr, 'rf07-gv', tip(`③ 겉 가까이 보이드 — 범프 약 ${Math.round(1 / m.Nf)}개 중 1개꼴 (평균 ${fN(m.Nf)}개)`)); flead = [xf, yf]; }
      ctx.$('[data-v="br"]').innerHTML = s;
      let ld = '';
      if (lead) ld += K.lead(lead[0] + r * 0.55, lead[1] - r * 0.45, 772, 782, ghost && !ns ? '보이드 (일부 범프)' : '보이드', 'start', 't-warn');
      else ld += LB(T(780, 788, '보이드 거의 없음', 't-dim', 'start'));
      if (flead) ld += K.lead(flead[0] + rr * 0.6, flead[1] - rr * 0.5, 772, 724, '겉 가까이 (③)', 'start', 't-dim');
      ctx.$('[data-v="lead"]').innerHTML = ld;
      return ghost;
    }
    function caps(m, ghost){
      const xL = CXL - 170, xR = CXR - 160;
      const n0 = m.N0 < 1 ? `붙은 기포 범프 ${Math.max(2, Math.round(1 / m.N0))}개에 1개꼴` : `붙은 기포 약 ${fI(m.N0)}개`;
      let s = T(xL, 1006, `${n0} (지름 ${m.b} µm)`, 't-sub', 'start');
      s += T(xL, 1036, `${st.tal}초에 ${pc(1 - m.f)} 빠지고 ${fN(m.N)}개 남음`, 't-sub', 'start');
      s += G(T(xL, 1066, '①~③ 기체가 나오는 세 자리', 't-dim', 'start'), K.only('gas'));
      s += G(T(xL, 1066, '작은 떠 있는 기포: 약 0.3초 만에 빠짐', 't-dim', 'start'), K.only('stay'));
      s += G(T(xL, 1066, m.P < 1000 ? `진공 ${m.P} mbar → 지름 ×${m.ratio.toFixed(2)}뿐` : '진공 없음 — 1기압 그대로', m.P < 1000 ? 't-warn' : 't-dim', 'start'), K.only('vac'));
      s += T(xR, 1006, `남은 보이드 ${fV(m.v)} %`, {ok: 'rf07-ok', warn: 't-warn', ng: 'rf07-ng'}[m.lv], 'start');
      s += T(xR, 1036, `범프당 약 ${fN(m.N)}개 · 지름 ${m.b} µm`, 't-sub', 'start');
      s += T(xR, 1066, ghost ? '점선 = 일부 범프에만 생김 (평균)' : 'Ni 계면에 붙은 채 굳음', 't-dim', 'start');
      ctx.$('[data-v="cap"]').innerHTML = s;
    }
    // vac 단계: 압력–시간 (가로 = 데움 20 s + 녹은 시간 + 식힘 20 s)
    function vgraph(m){
      const T0 = 20, Tt = st.tal + 40, gx = t => 200 + t / Tt * 700, gy = p => 352 - (Math.log10(p) - 1) / 2 * 162;
      const t1 = T0, t2 = T0 + st.tal;
      let s = R(gx(t1), 190, gx(t2) - gx(t1), 162, 'pl-liqz', tip(`녹아 있는 시간 ${st.tal}초 (221 °C 위)`));
      s += L(gx(t1), 186, gx(t1), 356, 's-dash') + L(gx(t2), 186, gx(t2), 356, 's-dash');
      s += T(gx(t1) - 8, 380, '녹음', 't-dim', 'end') + T(gx(t2) + 8, 380, '굳음', 't-dim', 'start');
      s += T((gx(t1) + gx(t2)) / 2, 380, `녹은 시간 ${st.tal}초`, 't-sub');
      let pts;
      if (m.P < 1000){
        const v0 = t1 + st.tal / 2, rd = Math.max(1, Math.min(10, st.tal / 2 - 6)), rs = Math.max(v0 + rd + 1, t2 - 5), re = Math.min(t2, rs + 3);
        pts = [[0, 1000], [v0, 1000], [v0 + rd, m.P], [rs, m.P], [re, 1000], [Tt, 1000]];
        s += P('M' + pts.map(([t, p]) => `${gx(t).toFixed(1)},${gy(p).toFixed(1)}`).join(' L'), 'rf07-pl', tip(`압력: 녹은 시간의 절반이 지나면 ${m.P} mbar로 내리고, 굳기 5초 전에 1기압으로 되돌린다 (개념)`));
        s += T((gx(v0 + rd) + gx(rs)) / 2, gy(m.P) - 12, `${m.P} mbar`, 't-warn');
        s += T(gx(v0) - 6, 214, '진공 시작', 't-dim', 'end');
      } else {
        s += L(gx(0), gy(1000), gx(Tt), gy(1000), 'rf07-pl') + T((gx(t1) + gx(t2)) / 2, 262, '진공 없음 — 1기압 그대로', 't-warn');
      }
      ctx.$('[data-v="vg"]').innerHTML = s;
    }
    // X-ray: 세 범프에 남은 보이드 (평균 N개 → 모두 round(3N)개를 결정적으로 나눔)
    function xray(m){
      const tot = Math.min(24, Math.round(3 * m.N)), g = K.rng(11), per = [0, 0, 0], vr = m.r0 * XPX;
      let s = '';
      for (let i = 0; i < tot; i++){
        const k = Math.floor(g() * 3) % 3, rho = Math.sqrt(g()) * (XRR - vr - 6), th = g() * Math.PI * 2;
        per[k]++;
        s += C(XR[k] + rho * Math.cos(th), XRY + rho * Math.sin(th), vr, 'rf07-xv');
      }
      s = G(s, {filter: K.url('rf07-blur')});
      per.forEach((c, k) => { s += T(XR[k], 410, c ? `보이드 ${c}개` : '없음', c ? 't-sub' : 't-dim'); });
      s += T(1024, 448, `세 범프에 ${tot}개 — 범프마다 다르다 (평균 ${fN(m.N)}개)`, 't-sub', 'start');
      ctx.$('[data-v="xr"]').innerHTML = s;
    }
    function render(){
      const m = model(st), sid = ctx.step();
      const L0 = bumpsL(m), ghost = bumpsR(m, L0);
      caps(m, ghost); vgraph(m); xray(m);
      ctx.$('[data-v="bumps"]').classList.toggle('rf07-dim', sid === 'where');
      ctx.out('k-g', `${ab(m.vg)} %`); ctx.out('k-v', `${fV(m.v)} %`); ctx.out('k-n', `${fN(m.N)}개`);
      ctx.out('k-r', m.P < 1000 ? `×${m.ratio.toFixed(2)}` : '진공 없음');
      const kv = ctx.card.querySelector('[data-o="k-v"]').parentNode;
      ['ok', 'warn', 'ng'].forEach(c => kv.classList.toggle(c, m.lv === c));
      const n0 = m.N0 < 1 ? `약 ${ab(m.N0)}개(범프 ${Math.max(2, Math.round(1 / m.N0))}개에 1개꼴)` : `약 ${fI(m.N0)}개`;
      let msg = `범프 하나에 붙은 기포 ${n0}(솔더의 ${ab(m.vg)} %)가 생겨, ${st.tal}초 동안 ${pc(1 - m.f)} 빠지고 약 ${fN(m.N)}개(<b>${fV(m.v)} %</b>)가 남습니다. 떠 있는 기포는 약 0.3초 만에 표면으로 빠져 계산에서 뺐습니다.`;
      if (m.b === 10) msg += ' 모여 커진 10 µm 기포는 겉에 닿기 쉬워 훨씬 빨리 빠집니다(빠지는 시간 규모 10초 — 가정).';
      if (m.P < 1000) msg += ` 진공 ${m.P} mbar에서 지름 ×${m.ratio.toFixed(2)} — 기포 속이 이미 약 ${ab(m.pin)} bar(라플라스 압력)라 조금만 커집니다. 굳기 전에 되돌리면 원래 크기로 줄어듭니다.`;
      if (m.fx) msg += ' 플럭스 기체는 대부분 겉에서 바로 빠지고, 밑동 · 겉의 틈에 말려 든 몫(가정 0.25)만 겉 가까이 남습니다(③).';
      if (m.v > 1) msg += ' 2D X-ray는 지름 5 µm를 놓치기 쉬워 단면 · FIB로 확인합니다.';
      if (st.src === 'hi') msg += ' <b>기체 출처를 줄이는 것(도금 층 사이 · 액 관리)이 시간 · 진공보다 먼저입니다.</b>';
      ctx.q('[data-o=msg]').innerHTML = msg;
      ctx.refresh();
    }
    ctx.range('tal', v => { st.tal = v; render(); return `${v}초`; });
    ['src', 'fx', 'vac', 'bs'].forEach(id => ctx.seg(id, (v, user) => {
      st[id] = v;
      if (user){ touched = true; if (id === 'vac' && ctx.step() && ctx.step() !== 'vac'){ ctx.go('vac'); return; } }
      render();
    }));
    inp.addEventListener('input', () => { touched = true; });
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    ctx.demo = sid => {
      if (!touched){
        const o = Object.assign({}, DEF, DEMO[sid] || {});
        ['src', 'fx', 'vac', 'bs'].forEach(id => { st[id] = o[id]; setSeg(id, o[id]); });
        st.tal = o.tal; inp.value = o.tal; ctx.out('tal', `${o.tal}초`);
      }
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['보이드', '솔더 속에 갇힌 기체가 그대로 굳어 남은 빈 구멍'],
      ['기체 방출 (아웃개싱)', '데울 때 막 속 유기물 · 계면 찌꺼기 · 플럭스에서 기체가 나오는 것'],
      ['스토크스 속도', '묽은 액체 속 작은 기포 · 입자가 떠오르거나 가라앉는 빠르기. 녹은 솔더 속 지름 5 µm 기포는 약 50 µm/s — 돔을 약 0.3초에 빠져나간다'],
      ['붙은 기포', '계면 · 찌꺼기 · 덜 젖은 자리에 붙어 생긴 기포. 부력(크기의 세제곱에 비례)이 붙드는 표면장력의 약 백만분의 일이라 떨어지지 못한다. 남는 보이드는 대부분 이것'],
      ['라플라스 압력', '굽은 겉면 때문에 기포 속 압력이 바깥보다 높아지는 몫(2γ/r). 작을수록 크다 — 지름 5 µm 기포는 약 4 bar'],
      ['진공 리플로우', '녹아 있을 때 챔버 압력을 낮춰 기포를 키워 빼는 방식. 수백 µm 기포에는 잘 듣지만 수 µm 기포는 지름이 10 % 안팎만 커진다'],
      ['커켄달 보이드', 'Cu₃Sn 층에서 Cu가 Sn보다 빨리 빠져나가 남은 빈자리 줄 (고온 시효 뒤, Cu 쪽)'],
      ['샴페인 보이드', '수 µm 크기의 작은 보이드 무리. 2D X-ray로 잘 안 보인다']
    ]) + K.field([
      '보이드를 판정하기 전에 <b>측정법</b>부터: 수 µm 보이드는 2D X-ray로 놓치기 쉽습니다. 표본을 정해 단면 · FIB · 3D X-ray로 확인하고, 보이드의 <b>자리</b>(Ni 계면 · 솔더 속 · 겉 가까이)를 함께 기록합니다 → <a data-go="void.where">이 장 4단계</a> · <a href="#go-plating-12">전해도금 12장 「보이드의 네 얼굴」</a>.',
      '보이드가 <b>도금액 나이(Ah)와 함께</b> 늘면 막 속 유기물(분해산물)을 의심합니다 [앞 공정] → <a href="#go-plating-11">전해도금 11장</a> · <a href="#go-plating-12">12장</a>.',
      '진공을 쓸 때는 <b>진공 시작 시점 · 내리는 기울기 · 되돌리는 시점</b>을 레시피로 관리합니다(급하면 튐 → 솔더 볼 · 브리지) [리플로우-장비 · 조건] → <a data-go="tool.vac">08장</a>. 다만 마이크로범프의 수 µm 보이드에는 진공이 잘 듣지 않으므로, 보이드가 늘면 <b>기체 출처(도금 층 사이 · 액 나이 · 플럭스 양)</b>부터 봅니다.',
      'Ni 계면에 붙은 보이드가 늘면 도금 층 사이(Ni → SnAg) 대기 · 헹굼과 스트립 · 식각 뒤 찌꺼기를 먼저 의심합니다 [앞 공정]. 계면이 깨끗하면 기포가 붙을 자리 자체가 줄어듭니다 → <a href="#go-plating-12">전해도금 12장</a> · <a href="#go-strip-08">PR 스트립 8장</a>.',
      '플럭스 두께(양)가 많으면 기체도 많습니다 [리플로우-분위기]. 겉에서 생긴 기체는 대부분 바로 빠지지만, 범프 밑동 · 겉의 틈에 말려 들면 겉 가까이 보이드가 됩니다. 도포 두께 · 균일도와 예열(용제 날리기)을 함께 봅니다 → <a data-go="profile.soak">02장</a>.'
    ]) + K.deep(`<ul>
      <li><b>크기의 물리 — 붙은 기포와 떠 있는 기포</b> — 지름 5 µm 기포의 부력/표면장력 ≈ ρgr²/γ ≈ 7,000 × 9.8 × (2.5×10⁻⁶)² / 0.5 ≈ 10⁻⁶ — 계면에 붙은 기포를 부력이 떼어 내지 못한다는 뜻입니다. 그러나 떠 있는 기포는 다릅니다: 녹은 Sn 점도 약 2 mPa·s(물의 약 2배)에서 스토크스 속도는 ${K.eq('v = 2Δρ·g·r² / (9μ) ≈ 48 µm/s')} (Δρ 약 7,000 kg/m³ · r 2.5 µm · μ 2×10⁻³ Pa·s, 겉이 자유로운 기포면 약 1.5배)라, 15.7 µm 돔을 약 0.3초에 빠져나갑니다(벽 효과로 느려져도 1초 안팎). 공개 보고도 '현실 크기 기포는 1초 안에 접합을 빠져나가고, 단면 보이드는 거의 모두 어떤 겉면에 붙어 있다', '덜 젖은 자리가 기포가 붙는 곳'이라고 씁니다. 보이드가 남는 까닭은 '끈적임'도 '떠오를 힘이 없음'도 아니라 <b>붙어 있음</b>입니다.</li>
      <li><b>기포 속 압력</b> — 1기압(1.013 bar) + 돔 속 압력 2γ/R_돔(R_돔 12.8 µm, 약 0.78 bar) + 라플라스 압력 2γ/r(지름 5 µm면 약 4.0 bar) ≈ <b>5.8 bar</b>(γ 0.5 N/m). 지름 10 µm면 약 3.8 bar입니다.</li>
      <li><b>진공의 원리와 한계</b> — 기체량이 같으면 아래 값이 일정합니다(P_d = 돔 속 압력). ${K.eq('(P + P_d + 2γ/r)·r³ = 일정')} 부피 ∝ 1/P는 기포 속 라플라스 압력이 1기압보다 훨씬 작을 때(지름 수십 µm 이상, 보드 · 파워 접합)만 맞습니다. 1,013 → 50 mbar에서 지름 배수: 5 µm ×1.09(부피 ×1.28) · 10 µm ×1.14 · (돔 압력이 없는 큰 접합에서) 20 µm ×1.37 · 50 µm ×1.7 · 200 µm ×2.3(이상 기체만 보면 ×2.7). 진공을 더 깊게(10 · 1 mbar) 해도 5 µm 기포는 ×1.09 그대로입니다. 공개 예(보드 · 파워 접합): 50 mbar 미만에서 효과가 크고, 10 mbar에서 보이드 2 % 미만, 녹고 약 30초 뒤에 진공을 거는 권고, 압력을 급히 내리면 튐. 이 자료를 마이크로범프에 그대로 옮기지 않습니다 — 마이크로범프 대책은 <b>기체 출처 줄이기 > 액상 시간 > 진공</b> 순서입니다.</li>
      <li><b>도금 유기물</b> — 도금 공정 찌꺼기에서 나온 기체는 양이 적어 수 µm '샴페인' 보이드가 되고, 2D X-ray 해상도 밖이라는 보고가 있습니다. 굳을 때 기체 성분이 보이드 안벽에 유기막으로 응축된다는 관찰도 있습니다. 스트립 · 식각 뒤 Sn 표면의 산화물 · 수산화물과 거친 표면에 낀 유기 찌꺼기도 출처입니다(<a href="#go-strip-08">PR 스트립 8장</a>).</li>
      <li><b>위젯 식 (가정값)</b> — ${K.eq('V_g = 4.4 % × (G + 0.25·플럭스),  G = 0.5 · 1 · 2')}${K.eq('N₀ = V_g ÷ (π/6·b³ ÷ 5,890 µm³),  τ(r) = 40 s × (2.5 µm / r)²')}${K.eq('f = e^(−(TAL/2)/τ(r₀)) · e^(−(TAL/2)/τ(r_P)),  보이드 % = V_g × f')} 예: 보통 · 60초 · 진공 없음 → 0.99 %, 많음 → 2.0 %, 20초 → 2.7 %, 90초 → 0.47 %, 50 mbar → 0.87 %, 10 µm 기포 → 0.011 %.</li>
      <li><b>커켄달 · 수축</b> — Cu/Cu₃Sn 계면 · Cu₃Sn 속 빈자리 줄은 고온 시효(예: 150 °C 수백~수천 시간)에서 보고되고, 도금 Cu 속 S가 키웁니다(<a href="#go-plating-06">전해도금 6장</a> · <a data-go="imc.cu">05장</a>). 전해 Ni 위 Ni₃Sn₄ 계면은 240 °C 20분 뒤에도 미세 보이드가 없었고 무전해 Ni(P) 위에서는 많았다는 보고가 있습니다. Sn은 녹을 때 부피가 약 2~3 % 늘고 굳을 때 그만큼 줄어(액체 약 7.0 g/cm³ · 고체 약 7.18 g/cm³) 마지막에 굳는 곳(보통 꼭대기 · 겉 가까이)에 수축 주름 · 구멍이 생길 수 있습니다.</li>
      <li><b>Cu 위 마이크로범프의 다른 보이드</b> — SnAg가 Cu와 직접 닿는 마이크로범프(Ni 방벽이 없는 구조)에서는 Cu₆Sn₅로 바뀔 때의 부피 줄어듦이 계면 보이드의 주원인이라는 보고도 있습니다.</li></ul>`);
  },
  css: `.pl-svg .rf07-liq{fill:none;stroke:#fbbf24;stroke-width:7;opacity:.35;filter:var(--th-glow);animation:rf07sh 2.6s ease-in-out infinite}
@keyframes rf07sh{0%,100%{opacity:.22}50%{opacity:.5}}
.pl-svg .rf07-org{fill:#a3e635;stroke:#1a2e05;stroke-width:1}
.pl-svg .rf07-res{fill:#9a5b2e;stroke:#fcd9b6;stroke-width:1.2}
.pl-svg .rf07-h2o{fill:rgba(125,211,252,.55);stroke:#e0f2fe;stroke-width:1.2}
.pl-svg .rf07-flx{fill:none;stroke:#facc15;stroke-width:7;opacity:.6}
.pl-svg .rf07-flxd{stroke-dasharray:14 8;opacity:.5}
.pl-svg .rf07-steam{fill:none;stroke:#fde68a;stroke-width:2.4;stroke-dasharray:6 6;opacity:.75;animation:jzflow 1.2s linear infinite}
.pl-svg .rf07-dk{font-size:21px;font-weight:800;fill:#0b1222 !important;stroke:none !important}
.pl-svg .rf07-num{font-size:28px;font-weight:900;fill:#fbbf24 !important;text-anchor:middle}
.pl-svg .rf07-talz{fill:rgba(148,163,184,.2);stroke:rgba(148,163,184,.55);stroke-width:1.2}
.pl-svg .rf07-fast{fill:#38bdf8}
.pl-svg .rf07-bten{fill:rgba(125,211,252,.5)}
.pl-svg .rf07-buoy{fill:#f59e0b}
.pl-svg .rf07-big{fill:rgba(226,232,240,.14)}
.pl-svg .rf07-ideal{fill:none;stroke:#f59e0b;stroke-width:1.6;stroke-dasharray:4 5}
.pl-svg .rf07-pl{fill:none;stroke:#f59e0b;stroke-width:3.4;stroke-linejoin:round}
.pl-svg .rf07-pop{fill:none;stroke:#e2e8f0;stroke-width:1.6}
.pl-svg .rf07-st{stroke:#fde68a;stroke-width:2}
.pl-svg .rf07-fl{fill:rgba(125,211,252,.35);stroke:#7dd3fc}
.pl-svg .rf07-ring0{fill:none;stroke:#94a3b8;stroke-width:1.4;stroke-dasharray:4 4}
.pl-svg .rf07-gv{fill:rgba(7,13,24,.35);stroke:#94a3b8;stroke-width:1.6;stroke-dasharray:5 4}
.pl-svg .rf07-xbg{fill:rgba(203,213,225,.16);stroke:rgba(148,163,184,.3);stroke-width:1}
.pl-svg .rf07-xb{fill:#0f172a;stroke:#475569;stroke-width:1.4}
.pl-svg .rf07-xv{fill:#cbd5e1;opacity:.9}
.pl-svg .rf07-dim{opacity:.4;transition:opacity .4s}
.pl-svg .rf07-ok{font-size:23px;font-weight:800;fill:#4ade80 !important}
.pl-svg .rf07-ng{font-size:23px;font-weight:800;fill:#f87171 !important}
.jc .rf07-two{display:block;margin:0}
.jc .rf07-two .pl-seg{margin:4px 0}`
});
// 작은 물방울 (타원 둘)
function E2(K, x, y, cls){ return K.E(x, y, 7, 5, cls) + K.E(x + 14, y + 6, 5, 3.6, cls); }
// 가리비 줄 (Cu₆Sn₅) — 바닥 yb, 높이 h, 폭 w마다
function scal(x0, x1, yb, h, n){
  const w = (x1 - x0) / n;
  let d = `M${x0},${yb}`;
  for (let k = 0; k < n; k++) d += ` A${(w / 2).toFixed(1)},${h} 0 0 1 ${(x0 + (k + 1) * w).toFixed(1)},${yb}`;
  return d + ' Z';
}
// 표의 작은 그림: 자리 ①~④
function mini(K, i, cx, yb){
  const {R, C, P, G} = K;
  if (i === 3){
    return R(cx - 40, yb - 58, 80, 18, 'f-sn2') + P(scal(cx - 40, cx + 40, yb - 34, 8, 3), 'f-imc') + R(cx - 40, yb - 34, 80, 12, 'pl-imc3') +
      [0, 1, 2, 3, 4, 5].map(k => C(cx - 34 + k * 13.6, yb - 26, 2.4, 'f-void')).join('') + R(cx - 40, yb - 22, 80, 22, 'f-cu2');
  }
  let s = R(cx - 40, yb, 80, 8, 'f-ni') + P(cap(cx, yb, 40, 50), 'f-sn2');
  if (i === 0) s += C(cx - 16, yb - 4, 8, 'f-void') + C(cx + 14, yb - 3, 6, 'f-void');
  if (i === 1) [[-8, -24], [-2, -18], [6, -26], [2, -32], [-12, -30], [10, -19]].forEach(([dx, dy]) => { s += C(cx + dx, yb + dy, 2.6, 'f-void'); });
  if (i === 2) s += C(cx + 20, yb - 34, 6, 'f-void');
  return G(s);
}
})();
