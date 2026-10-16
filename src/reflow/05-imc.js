/* 리플로우 05 — 계면 IMC: 솔더와 금속 사이에는 무엇이 자랄까? (계면 · µm)
   베이스 다이 범프(Cu 기둥 / Ni / 상부 Cu / SnAg): 솔더가 상부 Cu를 먼저 만나 Cu₆Sn₅(+ 얇은 Cu₃Sn) → 상부 Cu가 다 쓰이면 Ni 위 (Cu,Ni)₆Sn₅
   코어 다이 범프(Ni / SnAg, Cu 기둥 없음): 솔더가 Ni를 만나 Ni₃Sn₄ (Cu가 오면 (Cu,Ni)₆Sn₅) */
(function(){
// ── 개념 모델 (기획 rev.2 · 05장 + 범프 구조 v2 — 상수는 가정값, K.model 에 밝힌다)
//  코어(Ni 위): 녹은 동안 x_l = (n · t_l · f / 60)^(1/3) µm   (k_l = 1/60 µm³/s: 250 °C 60초 → 1 µm)
//    굳은 뒤(150 °C 환산): x = √(x_l² + k_s · t_h · f), k_s = 3.4×10⁻³ µm²/h (1,000시간 → 약 +1 µm). 125 °C 비교선 k_s × 0.29 (Q 70 kJ/mol)
//    솔더 속 Cu 배수 f: 없음 1 · 조금 1.3 · 많이 2. 소모 비율(IMC 1 µm당 µm): Ni₃Sn₄ Ni 0.26 · Sn 0.87(밀도 계산),
//    (Ni,Cu)₃Sn₄ 0.22 · 0.85(가정), (Cu,Ni)₆Sn₅ 0.07(Ni가 금속 자리 약 20 % 가정) · 0.69
//  베이스(상부 Cu 위 Cu₆Sn₅): 녹은 동안 k = 8/60 µm³/s (250 °C 60초 → 2 µm), 굳은 뒤 k_s × 10 (가정). 소모 Cu 0.36 · Sn 0.69 (밀도 계산, 얇은 Cu₃Sn 몫은 무시)
//    상부 Cu(t_c)가 다 쓰이면 (Cu가 끝없을 때 두께 x_c > x_m = t_c / 0.36): x = √(x_m² + r · x_n²), r = 1 − x_m²/x_c²,
//    x_n = 같은 열 이력에서 Ni 위 (Cu,Ni)₆Sn₅ 두께 → 그 뒤로는 Ni만 0.07 µm/µm 먹으며 아주 천천히 자란다
//  계면 2개(본딩 뒤): 위(상대 패드, Ni 가정) 계면은 본딩부터 — x₂ = √(((n − 1)·t_l·f/60)^(2/3) + k_s·t_h·f)
//    (베이스는 상부 Cu에서 녹아든 Cu 때문에 위 계면도 (Cu,Ni)₆Sn₅ 속도로 센다)
//  Sn 소모 % = c_sn · (x + x₂) / 12 µm × 100 (12 µm = 도금 원기둥과 같은 부피의 솔더 두께 — 두 다이 같은 예시). 남은 Ni = Ni − 먹힌 Ni
const KL = 1 / 60, KS = 3.4e-3, K125 = 0.29, SN0 = 12, KLC = 8 / 60, KSC = 10 * KS, CUC = 0.36;
const TYPE = {
  '0': {f: 1, ni: 0.26, sn: 0.87, nm: 'Ni₃Sn₄', cls: 'f-imc rf05-ie', shape: 'facet'},
  lo: {f: 1.3, ni: 0.22, sn: 0.85, nm: '(Ni,Cu)₃Sn₄', cls: 'f-imc rf05-ie rf05-nc', shape: 'facet'},
  hi: {f: 2, ni: 0.07, sn: 0.69, nm: '(Cu,Ni)₆Sn₅', cls: 'f-imc rf05-ie rf05-cn', shape: 'scallop'},   // 세 탭 공통: f-imc = Ni₃Sn₄ · Cu₆Sn₅, pl-imc3 = Cu₃Sn
  cu: {f: 1, ni: 0, sn: 0.69, nm: 'Cu₆Sn₅', cls: 'f-imc rf05-ie', shape: 'scallop'}
};
const NI_EX = {b: 3, c: 5};                // 다이별 예시 Ni 두께 (µm)
// 아래(이 칩) 계면 두께: 코어는 Ni 위, 베이스는 상부 Cu 위 → 다 쓰이면 Ni 위
function lowC(s, ht){
  const ty = TYPE[s.cu] || TYPE['0'], xl = Math.cbrt(s.n * s.tl * ty.f * KL);
  return {x: Math.sqrt(xl * xl + KS * ht * ty.f), ty, used: false, xm: 0};
}
function lowB(s, ht){
  const xl = Math.cbrt(s.n * s.tl * KLC), xc = Math.sqrt(xl * xl + KSC * ht), xm = s.tc / CUC;
  if (xc <= xm) return {x: xc, ty: TYPE.cu, used: false, xm};
  const xn = Math.cbrt(s.n * s.tl * TYPE.hi.f * KL), xn2 = xn * xn + KS * ht * TYPE.hi.f;
  return {x: Math.sqrt(xm * xm + (1 - xm * xm / (xc * xc)) * xn2), ty: TYPE.hi, used: true, xm};
}
const lowAt = (s, ht) => (s.die === 'b' ? lowB : lowC)(s, ht);
function calc(s){
  const b = s.die === 'b', lo = lowAt(s, s.ht), ty = lo.ty, x = lo.x, xl = lowAt(s, 0).x;
  const t2 = b ? TYPE.hi : ty, two = s.side === '2';
  const xl2 = two ? Math.cbrt(Math.max(0, s.n - 1) * s.tl * t2.f * KL) : 0, x2 = two ? Math.sqrt(xl2 * xl2 + KS * s.ht * t2.f) : 0;
  const cuUsed = b ? Math.min(s.tc, CUC * x) : 0, niUsed = b ? (lo.used ? TYPE.hi.ni * (x - lo.xm) : 0) : ty.ni * x;
  const snLo = ty.sn * x / SN0 * 100, snUp = t2.sn * x2 / SN0 * 100;
  return {b, ty, t2, xl, x, xm: lo.xm, used: lo.used, cuUsed, cuLeft: b ? s.tc - cuUsed : 0, cm: b ? CUC : ty.ni,
    xl2, x2, two, niUsed, niLeft: s.ni - niUsed, snLo, snUp, snPct: snLo + snUp, share: b ? Math.min(100, TYPE.cu.sn * lo.xm / SN0 * 100) : 0};
}
// ── 무대 배치: 왼쪽 확대 단면(1 µm = 50 px, 두꺼우면 줄임) · 오른쪽 패널(위: 단계별, 아래: 예산 막대)
const X0 = 60, X1 = 1000, WY = 250, YC = 1050, YB = 1110;
const GR = {x0: 1110, x1: 1510, y0: 470, y1: 214, tmax: 2000};
const gx = t => GR.x0 + t / GR.tmax * (GR.x1 - GR.x0);
const BX0 = 1080, BX1 = 1520, BW = BX1 - BX0;
const DEF = {die: 'b', n: 3, tl: 60, ht: 0, ni: NI_EX.b, tc: 3, cu: '0', side: '2'};
// 발표 모드 · 손대기 전: 단계마다 기본값(베이스 다이) + 이 값만 덮어쓴다 (앞 단계 값을 이어 받지 않음)
// dissolve · topcu · ni3sn4 는 웨이퍼 리플로우 한 번 이야기라 계면 1개로 보인다 (1회면 위 계면은 어차피 0 — 숫자는 같다)
// cu 는 웨이퍼 리플로우 1회 + 150 °C 2,000 h (계면 1개) → 상부 Cu가 막 다 쓰여 Sn 소모 = 상부 Cu 몫 약 48 %
const DEMO = {dissolve: {n: 1, tl: 30, side: '1'}, topcu: {n: 1, tl: 60, side: '1'}, ni3sn4: {die: 'c', ni: NI_EX.c, n: 1, tl: 60, side: '1'},
  cu: {n: 1, side: '1', ht: 2000}, grow: {ht: 1000}, budget: {die: 'c', ni: NI_EX.c, n: 8, ht: 1000}};
const VN = {x: 1040, y: 130, w: 520, h: 490};
const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2), pc = v => Math.round(v) + ' %', hrs = v => v.toLocaleString('en-US') + ' h';
// 글자 폭 어림 (px): 한글 1em, 영문 · 숫자 약 0.56em, 그 밖 약 0.75em
const tw = (s, fs) => [...s].reduce((a, c) => a + (/[ㄱ-힝]/.test(c) ? 1 : /[A-Za-z0-9 .,:;'()%\-+=<>]/.test(c) ? 0.56 : 0.75), 0) * fs;
const FS = {'t-sub': 21, 't-dim': 19, 't-acc': 23, 't-warn': 23, 'pl-warn': 22, 'pl-hdg': 21};

// 각진 조각 층(Ni₃Sn₄): 바닥 yb에서 dir(−1 위 · +1 아래)으로, 평균 두께 X(px). a: 각진 정도(0 = 납작한 띠 ~ 1). → {d, top}
function facet(K, x0, x1, yb, X, a, seed, dir = -1){
  const g = K.rng(seed), v = X * (1 - 0.3 * a), pts = [[x0, yb + dir * v]];
  let x = x0, ext = v;
  while (x < x1 - 0.5){
    let w = (30 + g() * 30) * Math.max(1, X / 60);
    if (x1 - x - w < 16) w = x1 - x;
    const p = Math.max(v, (X - 0.375 * v) / 0.584 * (1 + 0.25 * a * (2 * g() - 1)));
    ext = Math.max(ext, p);
    pts.push([x + w * (0.22 + 0.12 * g()), yb + dir * p * 0.85], [x + w * 0.55, yb + dir * p], [x + w, yb + dir * v]);
    x += w;
  }
  return {d: `M${x0},${yb} ` + pts.map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${x1},${yb} Z`, top: yb + dir * ext};
}
// 둥근 가리비 층((Cu,Ni)₆Sn₅ · Cu₆Sn₅): 반타원 이음, 평균 두께 ≈ X. a: 둥근 정도(1 = 리플로우 직후 가리비 ~ 0.3 = 오래 두어 고른 층)
function scallop(K, x0, x1, yb, X, seed, dir = -1, wmin = 80, wr = 40, a = 1){
  const g = K.rng(seed), v = X * (1 - 0.55 * a), sw = Math.max(1, X / 150);
  let d = `M${x0},${yb} L${x0},${(yb + dir * v).toFixed(1)}`, x = x0, ext = v;
  while (x < x1 - 0.5){
    let w = (wmin + g() * wr) * sw;
    if (x1 - x - w < wmin * sw * 0.4) w = x1 - x;
    const p = X * (1 + 0.2 * a) * (1 + 0.15 * (2 * g() - 1));
    ext = Math.max(ext, p);
    d += ` A${(w / 2).toFixed(1)},${Math.max(0.5, p - v).toFixed(1)} 0 0 ${dir < 0 ? 1 : 0} ${(x + w).toFixed(1)},${(yb + dir * v).toFixed(1)}`;
    x += w;
  }
  return {d: d + ` L${x1},${yb} Z`, top: yb + dir * ext};
}
// 어두운 바탕 꼬리표 (밝은 솔더 위 글자가 읽히게)
function tag(K, x, y, s, cls = 't-sub', a = 'start'){
  const fs = FS[cls] || 20, w = tw(s, fs) + 18, h = fs * 1.3 + 8;
  const rx = a === 'end' ? x - w + 9 : a === 'middle' ? x - w / 2 : x - 9;
  return K.LB(K.R(rx, y - fs * 0.95 - 4, w, h, 'rf05-tag', {rx: 7}) + K.T(x, y, s, cls, a));
}
function tagN(K, x, y, lines, a = 'start', lh = 27){
  const w = Math.max(...lines.map(([s, c]) => tw(s, FS[c] || 20))) + 18, fs0 = FS[lines[0][1]] || 20;
  const rx = a === 'end' ? x - w + 9 : x - 9, top = y - fs0 * 0.95 - 4, h = (lines.length - 1) * lh + fs0 * 1.3 + 8;
  return K.LB(K.R(rx, top, w, h, 'rf05-tag', {rx: 7}) + lines.map(([s, c], k) => K.T(x, y + k * lh, s, c, a)).join(''));
}

(window.EngrReflowChapters = window.EngrReflowChapters || []).push({
  no: '05', id: 'imc', part: 2, short: '계면 IMC', scale: '계면 · µm',
  title: '계면 IMC — 솔더와 금속 사이에는 무엇이 자랄까?',
  hook: '이어 주지만 금속을 먹는다',
  one: '녹은 솔더 속 Sn은 맞닿은 금속과 만나 새 화합물(금속간 화합물, IMC)을 만듭니다. 베이스 다이 범프(Cu/Ni/Cu/SnAg)는 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu) 위에 Cu₆Sn₅가, 코어 다이 범프(Ni/SnAg)는 Ni 위에 Ni₃Sn₄가 자랍니다. 얇은 IMC는 단단히 이어졌다는 증거지만, 열을 받을수록 두꺼워지며 금속과 Sn을 먹습니다.',
  ana: '<b>쇠에 스는 녹</b> — 쇠와 산소가 만나는 자리에 녹 층이 생기며 쇠가 줄듯, 금속(상부 Cu · Ni)과 Sn이 만나는 자리에 IMC 층이 생기며 금속(과 Sn)이 줄어듭니다. <i>(비유의 한계: 쇠의 녹은 푸석해 공기 · 물이 스며들어 계속 자라고 아무것도 잇지 못하지만, IMC는 빽빽한 층이라 두꺼워질수록 원자가 건너기 어려워 점점 느리게 자랍니다. 또 IMC는 솔더와 금속을 이어 주는 꼭 필요한 층입니다 — 다만 너무 두꺼우면 단단하고 잘 깨지는 층이 됩니다.)</i>',
  steps: [
    {id: 'dissolve', t: '녹으면 반응이 시작된다', d: '솔더가 녹으면 맞닿은 금속(베이스 다이는 상부 Cu, 코어 다이는 Ni)이 조금 녹아들고, 곧 계면에 Sn과의 화합물이 생겨 덮습니다. Cu는 Ni보다 훨씬 빨리 녹아들고 반응해, 리플로우 한 번에 Ni 쪽 IMC가 보통 1 µm 안팎일 때 Cu 쪽은 그보다 두껍게 자랍니다.', viewN: VN},
    {id: 'topcu', t: '베이스 다이 — 상부 Cu 위 Cu₆Sn₅', d: '베이스 다이의 솔더는 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu)를 먼저 만납니다. 둥근 가리비 모양 Cu₆Sn₅와 그 아래 얇은 Cu₃Sn이 자라며 상부 Cu를 먹습니다. 아래 Cu 기둥의 Cu는 Ni가 막아 올라오지 못합니다.', viewN: VN},
    {id: 'ni3sn4', t: '코어 다이 — Ni 위 Ni₃Sn₄', d: '코어 다이 범프는 Cu 기둥 없이 Ni / SnAg라 솔더가 바로 Ni를 만납니다. Ni₃Sn₄가 녹은 솔더 쪽으로 각진 바늘 · 조각 모양으로 솟고, 굳은 뒤 솔더와 Ni를 잇습니다. 이 층이 자라며 Ni를 먹으므로 Ni는 다 먹히지 않을 만큼(예시 5 µm) 잡습니다.', viewN: VN},
    {id: 'cu', t: 'Cu가 오면 — (Cu,Ni)₆Sn₅', d: 'Ni 위 IMC에 Cu가 섞이면(솔더 속 Cu 약 0.6 wt% 넘게) 둥근 가리비 (Cu,Ni)₆Sn₅가 됩니다. 베이스 다이는 상부 Cu가 다 쓰이면 이 층이 Ni 위에 남아 안정되고, 코어 다이는 상대 패드가 Cu면 그렇습니다. 두꺼운 Cu 위에서는 Cu₃Sn이 자랍니다.', viewN: VN},
    {id: 'grow', t: '자라는 속도 — 시간과 온도', d: '굳은 뒤에는 원자가 IMC 층을 건너야 해서 두꺼울수록 느리게 자랍니다(두께² − 처음 두께² ∝ 시간). 온도가 오르면 빨라지고, Cu 쪽 IMC는 보통 Ni 쪽보다 빨리 자랍니다. 베이스 다이는 상부 Cu가 다 쓰이면 곡선이 거의 멈춥니다.', viewN: VN},
    {id: 'budget', t: '금속 · Sn 예산 — 여러 번의 열', d: '리플로우 · 적층 본딩 · 고온 공정 · 시험마다 IMC가 자라 금속과 Sn이 줄어듭니다. 코어 다이는 Ni(예시 5 µm)가 마지막 열 이력 뒤에도 남아야 하고, 베이스 다이는 상부 Cu가 쓸 Sn(예시 약 48 %)을 미리 셉니다. 본딩 뒤에는 두 계면에서 솔더가 두 배 빨리 줄어듭니다.', viewN: {x: 1040, y: 622, w: 520, h: 478}}
  ],
  icon(K){
    const {R, P} = K;
    return R(4, 8, 58, 34, 'f-sn2') + P('M4,40 L4,36 A7,6 0 0 1 18,36 A8,8 0 0 1 33,36 A7,7 0 0 1 47,36 A8,6 0 0 1 62,36 L62,40 Z', 'f-imc') + R(4, 40, 58, 8, 'f-cu2') + R(4, 48, 58, 8, 'f-ni');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, tip, only, W, wrap} = K;
    let s = `<defs><clipPath id="${K.id('rf05-cw')}"><rect x="${X0}" y="${WY}" width="${X1 - X0}" height="${YB - WY}"/></clipPath>` +
      `<linearGradient id="${K.id('rf05-nig')}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#334155" stop-opacity="1"/><stop offset="1" stop-color="#64748b" stop-opacity="0"/></linearGradient>` +
      `<linearGradient id="${K.id('rf05-cug')}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9a4a17" stop-opacity=".9"/><stop offset="1" stop-color="#c2763a" stop-opacity="0"/></linearGradient>` +
      `<clipPath id="${K.id('rf05-gc')}"><rect x="${GR.x0}" y="${GR.y1 - 4}" width="${GR.x1 - GR.x0 + 4}" height="${GR.y0 - GR.y1 + 4}"/></clipPath></defs>`;
    // 왼쪽: 단계 머리글 + 확대 단면 (위젯이 그린다)
    s += `<g data-v="head"></g><g data-v="sec"></g><g data-v="inset"></g>`;
    // 오른쪽 패널
    s += R(1040, 130, 520, 970, 'pl-panel', {rx: 14}) + L(1060, 622, 1540, 622, 'rf05-div');
    // ① dissolve: 두 다이 × 세 장면 (위: 베이스 상부 Cu · 아래: 코어 Ni)
    let dz = T(1064, 170, '녹고 나서 — 몇 초 만에 계면이 덮인다', 't-acc', 'start');
    const FX = [1150, 1282, 1414], FW = 124, FH = 120;
    ['도금 직후', '녹고 몇 초', '약 1분 뒤'].forEach((t, i) => { dz += T(FX[i] + FW / 2, 206, t, 't-sub'); });
    [[218, 'b'], [352, 'c']].forEach(([y, d], r) => {
      const b = d === 'b', yI = y + (b ? 80 : 84), g = K.rng(31 + r);
      dz += T(1062, y + 52, b ? '베이스' : '코어', 't-sub', 'start') + T(1062, y + 80, b ? '상부 Cu' : 'Ni', 't-dim', 'start');
      FX.forEach((x, i) => {
        let f = R(x, y, FW, yI - y, 'f-sn2') + (b ? R(x, yI, FW, 20, 'f-cu2') + R(x, yI + 20, FW, 20, 'f-ni') : R(x, yI, FW, y + FH - yI, 'f-ni'));
        if (i === 1){
          if (b) for (let k = 0; k < 5; k++){ const cx = x + 14 + k * 24 + g() * 5, rw = 8 + g() * 3, hh = 6 + g() * 5; f += P(`M${(cx - rw).toFixed(1)},${yI} A${rw.toFixed(1)},${hh.toFixed(1)} 0 0 1 ${(cx + rw).toFixed(1)},${yI} Z`, TYPE.cu.cls); }
          else for (let k = 0; k < 4; k++){ const cx = x + 16 + k * 30 + g() * 6, hh = 5 + g() * 5; f += K.PG([[cx - 7, yI], [cx - 2, yI - hh], [cx + 3, yI - hh * 0.8], [cx + 7, yI]], TYPE['0'].cls); }
          for (let k = 0; k < (b ? 9 : 4); k++) f += C(x + 12 + g() * (FW - 24), y + 20 + g() * 40, 5, b ? 'rf05-cua' : 'rf05-nia');
        }
        if (i === 2) f += P(b ? scallop(K, x, x + FW, yI, 22, 33, -1, 26, 10).d : facet(K, x, x + FW, yI, 12, 1, 34).d, b ? TYPE.cu.cls : TYPE['0'].cls);
        f += R(x, y, FW, FH, 'rf05-frame');
        const tp = b ? ['도금 직후 — 상부 Cu 위에는 실온에서 자란 아주 얇은 Cu₆Sn₅ 정도 (Ni 위는 거의 없음)', '녹고 몇 초 — Cu가 빨리 녹아들고, 계면에 Cu₆Sn₅ 알갱이(핵)가 생긴다', '약 1분 뒤(250 °C) — Cu₆Sn₅ 가리비 층 약 2 µm (위젯 예시)']
          : ['도금 직후 — Ni 위에 반응층이 거의 없다', '녹고 몇 초 — Ni가 조금 녹아들고, 계면에 Ni₃Sn₄ 조각(핵)이 생긴다', '약 1분 뒤(250 °C) — Ni₃Sn₄ 층 보통 1 µm 안팎 (위젯: 1회 · 60초 → 1.00 µm)'];
        dz += G(f, tip(tp[i]));
      });
    });
    dz += TT(1064, 506, wrap('Cu는 Ni보다 훨씬 빨리 녹아들고 반응해, 같은 시간에 IMC가 더 두껍게 자랍니다 (위젯 예시: 1분 → Cu₆Sn₅ 약 2 µm · Ni₃Sn₄ 약 1 µm).', 22), 't-sub', 'start', 28);
    dz += T(1064, 600, '덮인 뒤에는 원자가 IMC를 건너야 해서 느려진다', 't-dim', 'start');
    s += G(dz, only('dissolve'));
    // ② topcu: 베이스 다이 — 상부 Cu 위 Cu₆Sn₅ · 원자 비율 · 소모 비율 · 상부 Cu 3 µm 셈
    let tb = T(1064, 170, 'IMC 종류 — 베이스 다이: 상부 Cu 위 SnAg', 't-acc', 'start') + T(1064, 204, 'Cu₆Sn₅ — Cu 6 : Sn 5, 둥근 가리비', 'pl-hdg', 'start');
    for (let k = 0; k < 6; k++) tb += C(1082 + k * 34, 240, 13, 'rf05-cua');
    tb += T(1272, 249, ':', 't-lbl');
    for (let k = 0; k < 5; k++) tb += C(1300 + k * 34, 240, 13, 'rf05-sna');
    tb += T(1167, 282, 'Cu ×6', 't-dim') + T(1368, 282, 'Sn ×5', 't-dim');
    tb += T(1064, 322, 'IMC 1 µm가 생기려면 (밀도로 계산)', 't-sub', 'start');
    const SY2 = 476, U = 120;
    tb += G(R(1084, SY2 - 0.36 * U, 80, 0.36 * U, 'f-cu2') + R(1084, SY2 - 1.05 * U, 80, 0.69 * U, 'f-sn2') + R(1084, SY2 - 1.05 * U, 80, 1.05 * U, 'rf05-frame'), tip('반응 전: Cu 0.36 µm + Sn 0.69 µm = 1.05 µm'));
    tb += T(1176, SY2 - 0.18 * U + 7, 'Cu 0.36 µm', 't-sub', 'start') + T(1176, SY2 - 0.705 * U + 7, 'Sn 0.69 µm', 't-sub', 'start');
    tb += K.arrow(1312, SY2 - 62, 1372, SY2 - 62, 's-arr2');
    tb += G(P(scallop(K, 1390, 1480, SY2, U, 14, -1, 90, 0, 0.5).d, TYPE.cu.cls), tip('Cu₆Sn₅ 1 µm (밀도 약 8.3 g/cm³)'));
    tb += T(1435, SY2 + 28, 'IMC 1.00 µm', 't-sub') + T(1124, SY2 + 28, '반응 전 1.05 µm', 't-dim');
    tb += G(TT(1064, 540, ['예시: 상부 Cu 3 µm는 Sn 약 5.7 µm와 반응해', 'Cu₆Sn₅ 약 8.3 µm가 되고 다 쓰인다'], 't-sub', 'start', 28), tip('6Cu + 5Sn → Cu₆Sn₅ (몰 부피 Cu 7.1 · Sn 16.3 cm³/mol)\nSnAg 12 µm면 상부 Cu 3 µm를 다 쓸 수 있는 양'));
    tb += T(1064, 598, '그다음은 Ni가 Cu 기둥의 Cu를 막는다', 't-dim', 'start');
    s += G(tb, only('topcu'));
    // ③ ni3sn4: 코어 다이 — 종류 · 원자 비율 · 소모 비율
    let nb = T(1064, 170, 'IMC 종류 — 코어 다이: Ni 위 SnAg', 't-acc', 'start') + T(1064, 204, 'Ni₃Sn₄ — Ni 3 : Sn 4, 각진 조각', 'pl-hdg', 'start');
    [0, 1, 2].forEach(k => { nb += C(1084 + k * 40, 244, 15, 'rf05-nia'); });
    nb += T(1210, 253, ':', 't-lbl');
    [0, 1, 2, 3].forEach(k => { nb += C(1244 + k * 40, 244, 15, 'rf05-sna'); });
    nb += T(1124, 290, 'Ni ×3', 't-dim') + T(1304, 290, 'Sn ×4', 't-dim');
    nb += T(1064, 334, 'IMC 1 µm가 생기려면 (밀도로 계산)', 't-sub', 'start');
    const SY = 524;
    nb += G(R(1084, SY - 0.26 * U, 80, 0.26 * U, 'f-ni') + R(1084, SY - 1.13 * U, 80, 0.87 * U, 'f-sn2') + R(1084, SY - 1.13 * U, 80, 1.13 * U, 'rf05-frame'), tip('반응 전: Ni 0.26 µm + Sn 0.87 µm = 1.13 µm'));
    nb += T(1176, SY - 0.13 * U + 7, 'Ni 0.26 µm', 't-sub', 'start') + T(1176, SY - 0.695 * U + 7, 'Sn 0.87 µm', 't-sub', 'start');
    nb += K.arrow(1312, SY - 62, 1372, SY - 62, 's-arr2');
    nb += G(P(facet(K, 1390, 1480, SY, U, 0.35, 12).d, TYPE['0'].cls), tip('Ni₃Sn₄ 1 µm (밀도 약 8.65 g/cm³)'));
    nb += T(1435, SY + 30, 'IMC 1.00 µm', 't-sub') + T(1124, SY + 30, '반응 전 1.13 µm', 't-dim');
    nb += T(1064, 600, '부피는 약 11 % 줄어든다 · Ag는 거의 안 들어간다', 't-dim', 'start');
    s += G(nb, only('ni3sn4'));
    // ④ cu: 세 경우 비교 (지금 위젯 칸 강조) · ⑤ grow · budget: 두께 곡선 — 위젯이 그린다
    s += G(`<g data-v="lanes"></g>`, only('cu')) + G(`<g data-v="graph"></g>`, only('grow budget'));
    // 아래: 금속 · Sn 예산 막대 (모든 단계, budget 에서 강조)
    s += R(1050, 632, 500, 460, 'pl-hlbox', W({rx: 12}, only('budget'))) + `<g data-v="bud"></g>`;
    return s;
  },
  body(K){
    const chips = h => h.replace('class="pl-seg"', 'class="pl-seg pl-chips"');
    return `<div class="pl-w"><div class="hd">직접 해 보기 — IMC 예산</div>
      ${chips(K.seg('die', [['b', '베이스 다이 (Cu/Ni/Cu/SnAg)'], ['c', '코어 다이 (Ni/SnAg)']], DEF.die, '다이'))}
      ${K.ctl('n', '녹이는 횟수 (웨이퍼 리플로우 · 본딩 · 재작업)', 1, 10, 1, DEF.n)}${K.ctl('tl', '한 번에 녹아 있는 시간 (초)', 20, 180, 5, DEF.tl)}
      ${K.ctl('ht', '고체 상태 고온 시간 (캐리어 본딩 · 뒷면 공정 · 시험을 150 °C로 환산, 시간)', 0, 2000, 50, DEF.ht)}${K.ctl('ni', 'Ni 두께 (µm)', 1, 6, 0.5, DEF.ni)}${K.ctl('tc', '상부 Cu 두께 (µm, 베이스 다이)', 1, 5, 0.5, DEF.tc)}
      ${chips(K.seg('cu', [['0', '없음 (Ni 위 SnAg)'], ['lo', '조금 (0.4 % 미만)'], ['hi', '많이 (0.6 % 넘음)']], DEF.cu, '솔더 속 Cu (코어 다이)'))}
      ${chips(K.seg('side', [['1', '웨이퍼 리플로우만 (계면 1개)'], ['2', '본딩 뒤 (아래 · 위 계면 2개)']], DEF.side, '계면 수'))}
      ${K.kpis([['IMC 두께', 'k-x', '이 칩 계면'], ['Ni 소모', 'k-ni', '남은 <span data-o="k-nil">–</span>'], ['Sn 소모', 'k-sn', '도금 솔더 대비 · 계면 수만큼 합'], ['IMC 종류', 'k-t', '']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('녹은 동안 x³ ∝ 시간, 굳은 뒤 x² − x₀² ∝ 시간인 개념 모델입니다. 코어 다이(Ni 위)의 속도 상수(250 °C 60초 → 1 µm — 보고값의 낮은 쪽, 150 °C 1,000시간 → +1 µm)와 솔더 속 Cu 배수(조금 ×1.3 · 많이 ×2)는 가정값입니다. 베이스 다이(상부 Cu 위 Cu₆Sn₅)는 250 °C 60초 → 2 µm, 굳은 뒤 Ni 쪽의 10배로 가정했고, 소모는 Cu₆Sn₅ 비율로만 셉니다(얇은 Cu₃Sn 몫은 무시). 상부 Cu가 다 쓰이면 그 뒤로는 Ni 위 (Cu,Ni)₆Sn₅ 속도로 아주 천천히 자란다고 봅니다. 본딩 뒤에는 위 계면(상대 패드, Ni로 가정)도 본딩부터 자라고, 베이스 다이는 솔더에 녹아든 Cu 때문에 (Cu,Ni)₆Sn₅ 속도로 셉니다. 다이를 바꾸면 Ni 두께가 그 다이의 예시 값(베이스 3 · 코어 5 µm)으로 바뀝니다. 보고된 속도 · 활성화 에너지는 금속 종류 · 솔더 양 · 측정법에 따라 크게 흩어집니다. 소모 비율은 Ni₃Sn₄ · Cu₆Sn₅ 밀도로 계산했고, Cu가 섞인 IMC의 Ni 몫((Cu,Ni)₆Sn₅에서 금속 자리의 약 20 % 등)은 가정값입니다. Sn 소모 경고선(코어 30 % · 베이스 60 %)도 예시입니다 — 베이스는 상부 Cu 몫(약 48 %)을 설계에서 미리 세는 양으로 보고, 코어는 Ni₃Sn₄가 Cu₆Sn₅보다 잘 깨지는 편이라는 보고가 많아 낮게 잡았습니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip, only, on, W} = K;
    const st = Object.assign({}, DEF);
    let touched = false, ready = false, lastSid = 'dissolve';
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const LBL = {n: v => v + '회', tl: v => v + ' 초', ht: v => v.toLocaleString('en-US') + ' h', ni: v => f1(v) + ' µm', tc: v => f1(v) + ' µm'};   // 줄바꿈되지 않게
    const RG = ['n', 'tl', 'ht', 'ni', 'tc'];
    const kpiBox = id => { const o = ctx.card.querySelector(`[data-o="${id}"]`); return o && o.closest('.kpi'); };
    const mark = (id, c) => { const b = kpiBox(id); if (b) ['ok', 'warn', 'ng'].forEach(k => b.classList.toggle(k, k === c)); };
    // 다이에 따라 쓰지 않는 손잡이는 흐리게 (베이스: 솔더 속 Cu는 상부 Cu에서 이미 들어온다 · 코어: 상부 Cu가 없다)
    function dieUI(){
      const b = st.die === 'b', tc = inp('tc'), cuG = ctx.card.querySelector('.pl-seg[data-g="cu"]'), k = kpiBox('k-ni');
      if (tc){ tc.disabled = !b; tc.closest('.ctl').classList.toggle('rf05-na', !b); }
      if (cuG){ cuG.classList.toggle('rf05-na', b); cuG.querySelectorAll('button').forEach(x => { x.disabled = b; }); }
      if (k) k.querySelector('.k').textContent = b ? '상부 Cu 소모' : 'Ni 소모';
    }

    // ── 단계 머리글 (왼쪽 위, 어두운 바탕)
    function head(sid, m){
      const b = m.b, sc = m.ty.shape === 'scallop';
      const H = {
        dissolve: b ? ['녹은 솔더 — 상부 Cu가 빨리 녹아들고, 곧 계면에 Cu₆Sn₅가 생긴다', '구리색 점: Cu 원자 (솔더로 녹아듦) · 흰 점: Sn 원자 (계면으로) — 개념 그림']
          : ['녹은 솔더 — Ni가 조금 녹아들고, 곧 계면에 Ni₃Sn₄가 생긴다', '회색 점: Ni 원자 (솔더로 녹아듦) · 흰 점: Sn 원자 (계면으로) — 개념 그림'],
        topcu: !b ? ['지금 위젯: 코어 다이 — 상부 Cu가 없어 솔더가 Ni를 만난다', '위젯에서 베이스 다이를 고르면 상부 Cu 위 Cu₆Sn₅를 본다']
          : m.used ? ['지금 위젯: 상부 Cu가 다 쓰였다 — Ni 위 (Cu,Ni)₆Sn₅', '열 이력을 줄이면 상부 Cu 위 Cu₆Sn₅ + 얇은 Cu₃Sn을 본다']
          : ['베이스 다이 — 상부 Cu 위 Cu₆Sn₅ 가리비, 그 아래 얇은 Cu₃Sn', '상부 Cu는 양이 정해진 Cu 공급원 · 아래 Cu 기둥의 Cu는 Ni가 막는다'],
        ni3sn4: b ? ['지금 위젯: 베이스 다이 — 솔더는 상부 Cu를 먼저 만난다', '위젯에서 코어 다이를 고르면 Ni 위 Ni₃Sn₄를 본다']
          : sc ? ['지금 위젯: 솔더 속 Cu 많이 — 가리비 모양 (Cu,Ni)₆Sn₅', 'Cu가 없으면 Ni 위에는 각진 조각 Ni₃Sn₄가 자란다 (다음 단계에서 비교)']
          : ['코어 다이 — Ni 위 Ni₃Sn₄, 녹은 솔더 쪽으로 각진 조각이 솟는다', 'Cu 기둥 없이 Ni가 몸통 겸 방벽 · 굳은 뒤 이 층이 솔더와 Ni를 잇는다'],
        cu: b ? (m.used ? ['상부 Cu가 다 쓰이면 — Ni 위에 (Cu,Ni)₆Sn₅', 'Ni가 Cu 기둥의 Cu를 막아 Cu₃Sn이 더 자라지 않는다 · 아주 천천히 자라며 안정']
            : ['베이스 다이 — 아직 상부 Cu 위 Cu₆Sn₅ (+ 얇은 Cu₃Sn)', `상부 Cu ${f2(m.cuLeft)} µm 남음 — 다 쓰이면 Ni 위 (Cu,Ni)₆Sn₅로 바뀐다`])
          : st.cu === 'hi' ? ['코어 다이 + 솔더 속 Cu — 둥근 가리비 (Cu,Ni)₆Sn₅', 'Cu는 상대 Cu 패드 등에서 온다 · Ni는 덜 먹는다']
          : st.cu === 'lo' ? ['Cu 조금 (0.4 % 미만) — (Ni,Cu)₃Sn₄, 아직 각진 조각', 'Cu가 약 0.6 % 넘으면 둥근 가리비 (Cu,Ni)₆Sn₅로 바뀐다 (위젯 "많이")']
          : ['코어 다이, 솔더 속 Cu 없음 — 각진 조각 Ni₃Sn₄', '위젯에서 솔더 속 Cu "많이"를 고르면 가리비 (Cu,Ni)₆Sn₅로 바뀐다'],
        grow: st.ht > 0 ? ['굳은 뒤 고온 시간 — IMC가 천천히 더 자란다', '하늘 점선: 리플로우 직후 IMC 윗면(평균) · 두꺼울수록 느리게 자란다']
          : ['고온 시간 0 h — 리플로우에서 생긴 IMC 그대로', '위젯의 고체 상태 고온 시간을 늘리면 IMC가 천천히 더 자란다'],
        budget: [b ? '열을 받을 때마다 — 상부 Cu와 Sn이 IMC로 바뀐다' : '열을 받을 때마다 — Ni와 Sn이 IMC로 바뀐다', m.two ? '왼쪽 위: 본딩 뒤 접합 전체(계면 둘) · 오른쪽 아래: 예산 막대' : '왼쪽 위: 웨이퍼 리플로우만(계면 하나) · 오른쪽 아래: 예산 막대']
      }[sid];
      return LB(T(X0, 176, H[0], 't-acc', 'start') + T(X0, 210, H[1], 't-dim', 'start'));
    }

    // ── 왼쪽 확대 단면 (범프 가운데) — 베이스: Cu 기둥 / Ni / 상부 Cu / IMC / 솔더 · 코어: 시드 · 패드 / Ni / IMC / 솔더
    function section(sid, m){
      const b = m.b, sc = m.ty.shape === 'scallop', dis = sid === 'dissolve';
      // 배율: 1 µm = 50 px, 층 · IMC가 두꺼우면 창 안에 들어가게 줄인다 (1 µm 자도 함께)
      //   budget 단계는 왼쪽 위 상자(y 266~606) 아래에 IMC 윗면이 오게 더 줄인다
      const PX = Math.min(50, (sid === 'budget' ? 430 : 640) / Math.max(1, Math.max(0, m.niLeft) + m.cuLeft + (sc ? 1.4 : 1.6) * m.x));
      const yNi0 = YC - st.ni * PX, yN0 = yNi0 - (b ? st.tc * PX : 0);
      const yN = Math.min(YC, b && !m.used ? yNi0 - m.cuLeft * PX : yNi0 + m.niUsed * PX), X = m.x * PX;
      // 굳은 뒤 고온에 오래 두면 조각 · 가리비가 뭉툭해지며 층이 고르게 된다(보고된 경향) → 리플로우 몫 비율만큼만 각지게 · 둥글게
      const ar = Math.min(1, m.xl / m.x);
      const shp = sc ? scallop(K, X0, X1, yN, X, 7, -1, 80, 40, dis ? 1 : Math.max(0.35, ar)) : facet(K, X0, X1, yN, X, dis ? 0.3 : Math.max(0.45, ar), 5);
      const ytop = shp.top, mel = b ? 'Cu' : 'Ni';
      let w = R(X0, WY, X1 - X0, yN - WY, 'f-sn2', tip(dis ? 'SnAg — 녹아서 붙는 솔더 (지금 녹은 상태, 약 250 °C)' : 'SnAg — 녹아서 붙는 솔더 (굳은 뒤) · 확대 단면 (범프 가운데)'));
      w += R(X0, WY, X1 - X0, yN - WY, 'rf05-hot', only('dissolve'));
      w += R(X0, yN - X - 190, X1 - X0, 190 + X * 0.5, 'rf05-nirich', W(only('dissolve'), {fill: K.url(b ? 'rf05-cug' : 'rf05-nig')}, tip(`${mel}가 녹아든 솔더 — 계면 바로 앞이 ${mel}로 진해진다 (개념 그림)`)));
      // 솔더 속 작은 Ag₃Sn (굳은 뒤)
      const g = K.rng(9);
      let ag = '';
      for (let k = 0; k < 80; k++){
        const x = X0 + 24 + g() * (X1 - X0 - 48), y = WY + 70 + g() * 760, rr = 4 + g() * 5, an = Math.round(g() * 180);
        if (y < ytop - 26 && !(x > 900 && y < 350)) ag += K.E(x, y, rr * 1.5, rr * 0.7, 'pl-ag3', {transform: `rotate(${an} ${x.toFixed(1)} ${y.toFixed(1)})`});
      }
      w += G(ag, W(on('topcu'), tip('Ag₃Sn 알갱이 — Ag는 IMC에 거의 들어가지 않고 솔더 속에 남는다')));
      const ward = b ? (m.used ? '상부 Cu를 다 쓰고 Ni 위에 — Ni는 아주 조금만 먹는다' : '아래 상부 Cu와 위 솔더를 함께 먹으며 자란다') : '아래 Ni와 위 솔더를 함께 먹으며 자란다';
      w += P(shp.d, m.ty.cls, tip(`IMC — ${m.ty.nm} ${f2(m.x)} µm (평균)\n${sc ? '둥근 가리비 모양' : '각진 조각 모양'} · ${ward}${st.ht > 0 ? '\n고온에 오래 두면 ' + (sc ? '가리비가' : '조각이') + ' 뭉툭해지고 층이 고르게 된다 (보고된 경향)' : ''}`));
      if (b && !m.used && !dis){
        const h3 = Math.max(14, (0.05 * m.xl + 0.25 * (m.x - m.xl)) * PX);
        w += R(X0, yN - h3, X1 - X0, h3, 'pl-imc3 rf05-c3s', tip('Cu₃Sn — Cu₆Sn₅와 상부 Cu 사이 얇은 층 (두께는 개념 그림)\n상부 Cu가 다 쓰이면 이 층도 Cu₆Sn₅ 쪽으로 바뀐다 (보고된 경향)'));
      }
      if (b){
        if (!m.used) w += R(X0, yN, X1 - X0, yNi0 - yN, 'f-cu2', tip(`상부 Cu — 솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로\n남은 ${f2(m.cuLeft)} µm (도금 ${f1(st.tc)} µm)`));
        const yT = Math.max(yN, yNi0);
        w += R(X0, yT, X1 - X0, YC - yT, 'f-ni', tip(`Ni — Cu 기둥과 솔더 사이 방벽\n남은 ${f2(Math.max(0, m.niLeft))} µm (도금 ${f1(st.ni)} µm)`));
        w += R(X0, YC, X1 - X0, YB - YC, 'f-cu2', tip('Cu 기둥 — 높이 · 전기'));
      } else {
        if (yN < YC) w += R(X0, yN, X1 - X0, YC - yN, 'f-ni', tip(`Ni — 몸통 겸 방벽 (Cu 기둥 없음)\n남은 ${f2(Math.max(0, m.niLeft))} µm (도금 ${f1(st.ni)} µm)`));
        w += G(R(X0, YC, X1 - X0, 10, 'f-seed2') + R(X0, YC + 10, X1 - X0, 6, 'f-ti') + R(X0, YC + 16, X1 - X0, YB - YC - 16, 'f-al'), tip('Cu 시드(Ti 위) · 칩 패드 — 시드는 실제 수백 nm, 그림은 과장'));
      }
      w += L(X0, yN0, X1, yN0, 'rf05-orig', tip(b ? '처음 계면 — 도금 직후 상부 Cu 윗면' : '처음 계면 — 도금 직후 Ni 윗면'));
      const yXl = yN0 - (1 - m.cm) * m.xl * PX;          // 리플로우 직후 윗면: 처음 계면 위로 (1 − 금속 몫) × x_l
      w += L(X0, yXl, X1, yXl, 'rf05-xl', W(only('grow'), tip(`리플로우 직후 IMC 윗면 (평균 ${f2(m.xl)} µm 두께일 때) — 그래프의 출발점`)));
      if (yN - yN0 > 3) w += P(`M954,${yN0.toFixed(1)} L968,${yN0.toFixed(1)} L968,${yN.toFixed(1)} L954,${yN.toFixed(1)}`, 'rf05-brk', tip(b ? `먹힌 상부 Cu ${f2(m.cuUsed)} µm${m.used ? ` + Ni ${f2(m.niUsed)} µm` : ''}` : `먹힌 Ni ${f2(m.niUsed)} µm`));
      // 녹는 동안의 원자 움직임 (개념)
      let mv = '';
      for (let k = 0; k < 6; k++){
        const x = 120 + k * 150;
        mv += K.mover(x, yN + 12, x + 18, yN - X - 180, 11, b ? 'rf05-cua' : 'rf05-nia', 2.8, k * 0.47);
        mv += K.mover(x + 70, WY + 150, x + 64, yN - X * 0.6, 11, 'rf05-sna', 3.3, k * 0.55);
      }
      w += G(mv, only('dissolve'));
      w = G(w, {'clip-path': K.url('rf05-cw')}) + R(X0, WY, X1 - X0, YB - WY, 'rf05-frame');
      // 두께 자 (1 µm)
      w += LB(P(`M968,266 L980,266 M974,266 L974,${(266 + PX).toFixed(1)} M968,${(266 + PX).toFixed(1)} L980,${(266 + PX).toFixed(1)}`, 'rf05-ruler') + tag(K, 956, 273 + PX / 2, '1 µm', 't-dim', 'end'));
      // 꼬리표: 솔더 · Ag₃Sn · IMC · 상부 Cu · Ni · 아래
      w += G(tag(K, X0 + 22, 298, dis ? '녹은 SnAg 솔더 (약 250 °C)' : '굳은 SnAg 솔더', 't-sub'), only('dissolve topcu ni3sn4 cu grow'));
      w += G(tag(K, X0 + 22, Math.max(360, yN - X - 120), `계면 바로 앞 — ${mel}가 녹아들어 진해진 솔더`, 't-dim'), only('dissolve'));
      if (ytop > 470){
        const ax = 560, ay = Math.min(450, ytop - 50);
        w += G(K.E(ax, ay, 14, 6, 'pl-ag3', {transform: `rotate(-20 ${ax} ${ay})`}) + C(ax, ay, 22, 'rf05-ring') + L(ax - 20, ay - 12, 470, 360, 'rf05-lead') +
          tag(K, X0 + 22, 352, 'Ag₃Sn — Ag는 IMC에 거의 안 들어가고 솔더에 남는다', 't-sub'), only('topcu ni3sn4'));
      }
      const nm = b && !m.used && !dis ? 'Cu₆Sn₅ (+ 얇은 Cu₃Sn)' : m.ty.nm;
      const l1 = (dis ? '막 생긴 IMC — ' : 'IMC — ') + `${nm} ${f2(m.x)} µm`;
      const eat = m.niLeft <= 0 ? [b ? 'Ni 다 먹힘 → 실제로는 Cu 기둥까지 반응 (모델 밖)' : 'Ni 다 먹힘 → 실제로는 시드 · 패드까지 반응 (모델 밖)', 'rf05-ng']
        : b ? (m.used ? [m.niUsed < 0.005 ? '상부 Cu 다 쓰임 → Ni는 거의 그대로' : `상부 Cu 다 쓰임 → Ni ${f2(m.niUsed)} µm 먹힘`, 't-dim'] : [`상부 Cu ${f2(m.cuUsed)} µm 먹힘 (노란 점선 = 처음 계면)`, 't-dim'])
        : [`Ni ${f2(m.niUsed)} µm 먹힘 (노란 점선 = 처음 계면)`, 't-dim'];
      const lines = sid === 'grow' ? [[l1, 't-sub'], [`리플로우 직후 ${f2(m.xl)} µm (하늘 점선 = 그때 윗면)`, 't-dim'], [`+ 고온 시간 ${f2(m.x - m.xl)} µm`, 't-dim'], eat] : [[l1, 't-sub'], eat];
      let ty0 = Math.max(372, Math.min(ytop - 24 - (lines.length - 1) * 27, 900));
      // budget 단계: 왼쪽 위 상자(x 80~570, y 266~606)와 겹치면 상자 아래로 내린다
      const lw = Math.max(...lines.map(([t, c]) => tw(t, FS[c] || 20))) + 18;
      if (sid === 'budget' && 993 - lw < 580 && ty0 - 26 < 616) ty0 = 646;
      const tyEnd = ty0 + (lines.length - 1) * 27 + 10;
      w += L(900, Math.min(tyEnd, yN - X), 900, yN - X, 'rf05-lead') + tagN(K, 984, ty0, lines, 'end');
      // 금속 층 이름표
      const yT = Math.max(yN, yNi0), niPx = YC - yT, niT = `${b ? 'Ni 방벽' : 'Ni 몸통 겸 방벽'} — 남은 ${f2(Math.max(0, m.niLeft))} µm`;
      let yNiTag = (yT + YC) / 2 + 8;
      if (b){
        const cuPx = m.used ? 0 : yNi0 - yN;
        if (cuPx >= 40) w += tag(K, X0 + 22, (yN + yNi0) / 2 + 8, `상부 Cu — 남은 ${f2(m.cuLeft)} µm`, 't-sub');
        if (cuPx >= 70 && sid !== 'dissolve') w += tag(K, 984, yN + 32, '↑ Cu₃Sn — 진한 얇은 띠 (개념 그림)', 't-dim', 'end');
        else if (niPx >= 84){                                            // budget 단계는 배율이 작아 Ni가 얇게 그려진다 (3 µm ≈ 96 px)
          w += tag(K, X0 + 22, yT + 30, m.used ? '↑ 상부 Cu 다 쓰임 — IMC가 Ni 위에 바로' : `↑ 상부 Cu — 남은 ${f2(m.cuLeft)} µm`, 't-dim');
          yNiTag = Math.max(yNiTag, yT + 72);
        }
      }
      if (niPx >= 46) w += tag(K, X0 + 22, Math.min(yNiTag, YC - 12), niT, 't-sub');
      else w += tag(K, 984, YC + 38, '↑ ' + niT, 't-sub', 'end');
      w += tag(K, X0 + 22, YC + 38, b ? 'Cu 기둥' : 'Cu 시드 · 칩 패드 (Cu 기둥 없음)', 't-sub');
      return w;
    }

    // ── 본딩 뒤 접합 전체 (budget 단계, 왼쪽 위)
    function inset(m){
      const b = m.b, bx = 80, by = 266, bw = 490, bh = 340, dx0 = bx + 26, dx1 = bx + 206;
      let s = R(bx, by, bw, bh, 'rf05-ibox', {rx: 12}) + T(bx + 18, by + 32, m.two ? '본딩 뒤 — 솔더 하나에 계면 둘' : '웨이퍼 리플로우만 — 계면 하나', 'pl-hdg', 'start');
      const nl = Math.max(0, m.niLeft), cl = Math.max(0, m.cuLeft), remUm = Math.max(0, SN0 - m.ty.sn * m.x - m.t2.sn * m.x2);
      const tot = remUm + m.x + m.x2 + nl + cl + (m.two ? 2 : 1.5);
      const sc = Math.min(13, 232 / tot);
      let y = by + bh - 14;
      const lab = [];
      s += R(dx0, y - 20, dx1 - dx0, 20, b ? 'f-cu2' : 'f-al'); lab.push([y - 10, b ? 'Cu 기둥 (이 칩)' : '시드 · 패드 (이 칩)']); y -= 20;
      if (nl > 0){ s += R(dx0, y - nl * sc, dx1 - dx0, nl * sc, 'f-ni'); lab.push([y - nl * sc / 2, `Ni 남음 ${f2(nl)} µm`]); y -= nl * sc; }
      if (cl > 0.005){ s += R(dx0, y - cl * sc, dx1 - dx0, cl * sc, 'f-cu2'); lab.push([y - cl * sc / 2, `상부 Cu 남음 ${f2(cl)} µm`]); y -= cl * sc; }
      const yI1 = y, X1p = m.x * sc, ySolTop = yI1 - X1p - remUm * sc, X2p = m.x2 * sc, yP = ySolTop - X2p;
      const sol = m.two ? R(dx0, yP, dx1 - dx0, yI1 - yP, 'f-sn2')
        : P(`M${dx0},${yI1} L${dx0},${(ySolTop + 18).toFixed(1)} Q${(dx0 + dx1) / 2},${(ySolTop - 18).toFixed(1)} ${dx1},${(ySolTop + 18).toFixed(1)} L${dx1},${yI1} Z`, 'f-sn2');
      const shape = (ty, yb, X, seed, dir, a) => ty.shape === 'scallop' ? scallop(K, dx0, dx1, yb, X, seed, dir, 56, 14, a) : facet(K, dx0, dx1, yb, X, 1, seed, dir);
      s += sol + P(shape(m.ty, yI1, X1p, 21, -1, Math.max(0.35, Math.min(1, m.xl / m.x))).d, m.ty.cls);
      lab.push([yI1 - X1p / 2, `아래 계면 IMC ${f2(m.x)} µm`]);
      lab.push([(ySolTop + yI1 - X1p) / 2, `남은 솔더 ${pc(100 - m.snPct)}`]);
      if (m.two){
        if (X2p > 0.5) s += P(shape(m.t2, yP, X2p, 23, 1, Math.max(0.35, Math.min(1, m.xl2 / m.x2))).d, m.t2.cls);
        s += R(dx0, yP - 24, dx1 - dx0, 24, 'f-ni');
        lab.push([ySolTop - X2p / 2, `위 계면 IMC ${f2(m.x2)} µm`]);
        lab.push([yP - 12, '상대 패드 Ni (가정)']);
      } else lab.push([ySolTop - 4, '솔더 겉 (본딩 전)']);
      // Sn이 계면으로 빠져나가는 화살표
      const cx = (dx0 + dx1) / 2, ym = (ySolTop + yI1 - X1p) / 2;
      if (yI1 - X1p - ySolTop > 56){
        s += K.arrow(cx, ym + 8, cx, yI1 - X1p - 6, 's-arr2');
        if (m.two) s += K.arrow(cx, ym - 8, cx, ySolTop + 6, 's-arr2');
        s += T(cx + 12, ym + 7, 'Sn', 'rf05-snt', 'start');
      }
      const yTopS = m.two ? yP - 24 : ySolTop - 20;
      s += R(dx0, yTopS, dx1 - dx0, by + bh - 14 - yTopS, 'rf05-frame');
      // 이름표 (글자 기준선 = 층 가운데 + 7): 위에서부터 27 px 간격을 지키고, 아래로 넘치면 위로 민다
      lab.sort((a, c) => a[0] - c[0]);
      const ys = lab.map(l => l[0] + 7), lo = by + 62, hi = by + bh - 10;
      ys[0] = Math.max(ys[0], lo);
      for (let k = 1; k < ys.length; k++) ys[k] = Math.max(ys[k], ys[k - 1] + 27);
      const over = ys[ys.length - 1] - hi;
      if (over > 0) for (let k = ys.length - 1; k >= 0; k--){ ys[k] = Math.min(ys[k], k === ys.length - 1 ? hi : ys[k + 1] - 27); }
      lab.forEach(([yl, t], k) => { s += L(dx1 + 4, yl, dx1 + 30, ys[k] - 7, 'rf05-lead') + T(dx1 + 36, ys[k], t, 't-dim', 'start'); });
      return G(s, only('budget'));
    }

    // ── 오른쪽 위 ④: 세 경우 비교 (지금 위젯의 경우 강조)
    function lanes(m){
      const act = m.b ? (m.used ? 1 : 2) : (st.cu === 'hi' ? 1 : 0), LY = [182, 322, 462], LH = 132, mx0 = 1066, mx1 = 1214;
      const TX = [
        ['코어: Ni 위 SnAg', !m.b && st.cu === 'lo' ? '(Ni,Cu)₃Sn₄ — 각진 조각' : 'Ni₃Sn₄ — 각진 조각', 'Ni 3 : Sn 4', 'Cu 0.4 % 아래면 (Ni,Cu)₃Sn₄'],
        ['Ni 위 + Cu', '(Cu,Ni)₆Sn₅ — 둥근 가리비', '베이스: 상부 Cu 다 쓰인 뒤', '코어: 솔더 속 Cu 약 0.6 % 넘게'],
        ['Cu 위 (상부 Cu · Cu 패드)', 'Cu₆Sn₅ + 얇은 Cu₃Sn', '두꺼운 Cu에 오래 → 빈자리 줄', '(커켄달 보이드 → 07장)']
      ];
      let s = T(1064, 166, 'IMC는 밑 금속과 솔더 속 Cu가 정한다', 't-acc', 'start');
      LY.forEach((y, i) => {
        s += R(1056, y, 488, LH, i === act ? 'pl-hlbox' : 'pl-lane', {rx: 10});
        let d = R(mx0, y + 12, mx1 - mx0, i === 2 ? 76 : 80, 'f-sn2');
        if (i === 0) d += R(mx0, y + 92, mx1 - mx0, 28, 'f-ni') + P(facet(K, mx0, mx1, y + 92, 15, 1, 41 + (st.cu === 'lo' ? 1 : 0)).d, !m.b && st.cu === 'lo' ? TYPE.lo.cls : TYPE['0'].cls);
        if (i === 1) d += R(mx0, y + 92, mx1 - mx0, 28, 'f-ni') + P(scallop(K, mx0, mx1, y + 92, 17, 43, -1, 34, 14).d, TYPE.hi.cls);
        if (i === 2){
          d += R(mx0, y + 98, mx1 - mx0, 22, 'f-cu2') + R(mx0, y + 88, mx1 - mx0, 10, 'pl-imc3 rf05-c3s') + P(scallop(K, mx0, mx1, y + 88, 15, 45, -1, 34, 14).d, TYPE.cu.cls);
          for (let k = 0; k < 7; k++) d += C(mx0 + 12 + k * 21, y + 98, 3.2, 'f-void');
        }
        d += R(mx0, y + 12, mx1 - mx0, 108, 'rf05-frame');
        const tp = ['코어 다이: Ni 위 SnAg — Ni₃Sn₄ (각진 조각). Cu가 0.4 % 아래로 조금 섞이면 (Ni,Cu)₃Sn₄',
          'Ni 위 + Cu — (Cu,Ni)₆Sn₅ (둥근 가리비)\n베이스 다이: 상부 Cu가 다 쓰인 뒤 · 코어 다이: 솔더 속 Cu 약 0.6 wt% 넘게(상대 Cu 패드 등)',
          'Cu 위 — Cu₆Sn₅(가리비) 아래에 얇은 Cu₃Sn(진한 띠)\n두꺼운 Cu에 고온으로 오래 두면 Cu 쪽에 빈자리(커켄달 보이드) 줄 — 얇은 상부 Cu는 다 쓰이면 멈춘다'][i];
        s += G(d, tip(tp));
        s += T(1228, y + 30, TX[i][0], 'pl-hdg', 'start') + T(1228, y + 58, TX[i][1], 't-sub', 'start') + T(1228, y + 84, TX[i][2], 't-dim', 'start') + T(1228, y + 108, TX[i][3], 't-dim', 'start');
        if (i === act) s += T(1532, y + 30, '지금', 'rf05-now', 'end');
      });
      return s;
    }

    // ── 오른쪽 위 ⑤: 고체 상태 고온 시간 → IMC 두께 (150 °C 곡선 · 125 °C 점선 · 지금 점 · 베이스는 '상부 Cu 다 쓰임' 선)
    function graph(m){
      const vm = m.b ? 10 : 5, dv = m.b ? 2 : 1, gy = v => GR.y0 - Math.min(v, vm + 0.5) / vm * (GR.y0 - GR.y1);
      let s = T(1064, 166, 'IMC 두께 — 고체 상태 고온 시간', 't-acc', 'start') + T(1064, 194, `150 °C 환산 · ${m.b ? '베이스 다이 (상부 Cu 위)' : '코어 다이 (Ni 위)'} · 위젯 값`, 't-dim', 'start');
      for (let v = dv; v <= vm; v += dv) s += L(GR.x0, gy(v), GR.x1, gy(v), 'rf05-grid');
      s += L(GR.x0, GR.y0, GR.x1 + 8, GR.y0, 's-axis') + L(GR.x0, GR.y0, GR.x0, GR.y1 - 8, 's-axis');
      [0, 500, 1000, 1500, 2000].forEach(t => { s += L(gx(t), GR.y0, gx(t), GR.y0 + 7, 's-axis') + T(gx(t), GR.y0 + 28, t.toLocaleString('en-US'), 't-dim'); });
      for (let v = 0; v <= vm; v += dv) s += T(GR.x0 - 10, gy(v) + 7, v === vm ? vm + ' µm' : String(v), 't-dim', 'end');
      s += T(GR.x1, GR.y0 + 54, '시간 (h)', 't-dim', 'end');
      if (m.b && m.xm < vm + 0.3) s += LB(L(GR.x0, gy(m.xm), GR.x1, gy(m.xm), 'rf05-cap', tip(`상부 Cu ${f1(st.tc)} µm가 다 쓰이는 IMC 두께 ≈ ${f1(m.xm)} µm (Cu 0.36 µm/µm)\n그 뒤로는 Ni가 막아 아주 천천히 자란다`)) +
        T(GR.x0 + 10, gy(m.xm) - 9, `상부 Cu 다 쓰임 ≈ ${f1(m.xm)} µm`, 'rf05-capt', 'start'));
      let c1 = '', c2 = '';
      for (let t = 0; t <= GR.tmax; t += 20){
        c1 += (c1 ? ' L' : 'M') + gx(t).toFixed(1) + ',' + gy(lowAt(st, t).x).toFixed(1);
        c2 += (c2 ? ' L' : 'M') + gx(t).toFixed(1) + ',' + gy(lowAt(st, t * K125).x).toFixed(1);
      }
      s += G(P(c2, 's-curve2', tip('125 °C — 같은 시간에 덜 자란다 (속도 × 0.29, 가정)')) + P(c1, 's-curve', tip('150 °C — 두께² − 처음 두께² ∝ 시간')), {'clip-path': K.url('rf05-gc')});
      s += LB(L(1300, 432, 1336, 432, 's-curve') + T(1344, 439, '150 °C (지금 조건)', 't-dim', 'start') + L(1300, 458, 1336, 458, 's-curve2') + T(1344, 465, '125 °C', 't-dim', 'start'));
      s += C(gx(0), gy(m.xl), 6, 'k-acc', tip(`리플로우 뒤 출발점 ${f2(m.xl)} µm`));
      const px = gx(st.ht), py = gy(Math.min(m.x, vm + 0.1));                 // 축 위로 넘치면 맨 위에 붙인다
      s += C(px, py, 18, 'co-ring') + C(px, py, 9, 'k-acc2', tip(`지금: ${hrs(st.ht)} → ${f2(m.x)} µm`));
      s += LB(C(1072, 524, 8, 'k-acc2') + T(1088, 531, `지금: ${hrs(st.ht)} → ${f2(m.x)} µm`, 't-warn', 'start'));
      s += T(1064, 566, '두께² − 처음 두께² ∝ 시간', 't-sub', 'start') + T(1064, 594, m.b ? '상부 Cu가 다 쓰이면 거의 멈춘다 (Ni가 Cu를 막음)' : '처음 IMC가 없을 때만 시간 4배 → 두께 2배', 't-dim', 'start');
      return s;
    }

    // ── 오른쪽 아래: 금속(상부 Cu · Ni) · Sn 예산 막대
    function budget(m){
      const b = m.b, nl = Math.max(0, m.niLeft), nu = Math.min(st.ni, m.niUsed), cl = Math.max(0, m.cuLeft), cu = m.cuUsed;
      const MX0 = Math.max(6, Math.ceil(st.ni + (b ? st.tc : 0) - 1e-9)), MX = MX0 > 8 ? MX0 + MX0 % 2 : MX0, U = BW / MX;   // 막대: 왼쪽 = 아래(Ni) → 오른쪽 = 솔더 쪽
      let s = T(1064, 666, b ? '상부 Cu · Ni · Sn 예산 — 위젯 값 (예시)' : 'Ni · Sn 예산 — 위젯 값 (예시)', 't-acc', 'start');
      const rt = b ? (m.used ? '상부 Cu 다 쓰임' : `IMC로 Cu ${f2(cu)} µm`) : (m.niLeft <= 0 ? 'Ni 다 먹힘' : `IMC로 ${f2(nu)} µm`);
      s += T(BX0, 706, b ? `상부 Cu ${f1(st.tc)} + Ni ${f1(st.ni)} µm` : `Ni (도금 ${f1(st.ni)} µm)`, 't-sub', 'start') + T(BX1, 706, rt, m.niLeft < 0.5 ? 'rf05-ng' : 'rf05-wn', 'end');
      s += R(BX0, 720, BW, 40, 'rf05-bar0') + R(BX0, 720, nl * U, 40, 'f-ni', tip(`남은 Ni ${f2(nl)} µm`));
      if (nu > 0.005) s += R(BX0 + nl * U, 720, nu * U, 40, 'rf05-used', tip(`IMC로 먹힌 Ni ${f2(nu)} µm`));
      if (b){
        const xc = BX0 + st.ni * U;
        if (cl > 0.005) s += R(xc, 720, cl * U, 40, 'f-cu2', tip(`남은 상부 Cu ${f2(cl)} µm`));
        if (cu > 0.005) s += R(xc + cl * U, 720, cu * U, 40, 'rf05-usedc', tip(`IMC로 간 상부 Cu ${f2(cu)} µm — 다 쓰이도록 잡은 몫`));
        s += L(xc, 714, xc, 766, 'rf05-sep');
        if (nl * U > 70) s += T(BX0 + 0.5 * U + 10, 747, 'Ni', 'rf05-bt', 'start');
        if (cl * U > 96) s += T(xc + 10, 747, '상부 Cu', 'rf05-bt', 'start');
      } else if (nl * U > 190) s += T(BX0 + 0.5 * U + 10, 747, `남음 ${f2(nl)} µm`, 'rf05-bt', 'start');
      s += L(BX0 + 0.5 * U, 712, BX0 + 0.5 * U, 768, 'rf05-thr', tip('경고선: 남은 Ni 0.5 µm'));
      const dt = MX > 8 ? 2 : 1;
      for (let v = 0; v <= MX; v += dt) s += L(BX0 + v * U, 760, BX0 + v * U, 767, 's-axis') + T(BX0 + v * U, 790, v === MX ? MX + ' µm' : String(v), 't-dim', v === 0 ? 'start' : v === MX ? 'end' : 'middle');
      // 솔더 (도금 12 µm 원기둥 = 100 %)
      const rem = Math.max(0, 100 - m.snPct), wR = rem / 100 * BW, wL = Math.min(m.snLo, 100) / 100 * BW, wU = Math.max(0, Math.min(m.snUp, 100 - m.snLo)) / 100 * BW;
      s += T(BX0, 836, 'Sn — 솔더 (도금 12 µm 원기둥 = 100 %)', 't-sub', 'start');
      s += R(BX0, 850, BW, 40, 'rf05-bar0') + R(BX0, 850, wR, 40, 'f-sn2', tip(`남은 솔더 ${pc(rem)}`)) + R(BX1 - wL, 850, wL, 40, 'f-imc', tip(`아래(이 칩) 계면 IMC로 간 Sn ${f1(m.snLo)} %`));
      if (m.two && wU > 0) s += R(BX0 + wR, 850, wU, 40, 'pl-imc3', tip(`위(상대 패드) 계면 IMC로 간 Sn ${f1(m.snUp)} %`));   // 막대: 남음 | 위 계면 | 아래(이 칩) 계면
      if (wR > 150) s += T(BX0 + 10, 877, `Sn 남음 ${pc(rem)}`, 'rf05-bt', 'start');
      const xT = BX0 + (1 - (b ? m.share : 30) / 100) * BW;
      s += b ? L(xT, 842, xT, 898, 'rf05-mk', tip(`상부 Cu ${f1(st.tc)} µm를 다 쓰면 그것만으로 Sn 약 ${pc(m.share)}가 IMC로 — 설계에서 미리 세는 몫`))
        : L(xT, 842, xT, 898, 'rf05-thr', tip('경고선: Sn 소모 30 %'));
      if (b){   // '상부 Cu 몫' 이름표는 막대 안쪽으로 붙이고, 가까운 끝 숫자는 뺀다
        const mw = tw(`상부 Cu 몫 ${pc(m.share)}`, 18) / 2, mx = Math.max(BX0 + mw, Math.min(BX1 - mw, xT));
        s += T(mx, 918, `상부 Cu 몫 ${pc(m.share)}`, 'rf05-mkt') + (mx - mw > BX0 + 30 ? T(BX0, 918, '0', 't-dim', 'start') : '') + (mx + mw < BX1 - 70 ? T(BX1, 918, '100 %', 't-dim', 'end') : '');
      } else s += T(BX0, 918, '0', 't-dim', 'start') + T(BX1, 918, '100 %', 't-dim', 'end') + T(BX0 + BW / 2, 918, '50 %', 't-dim') + T(xT, 918, '30 % 소모', 'rf05-thrt');
      // 범례
      let lx = BX0;
      [['f-sn2', `남음 ${pc(rem)}`]].concat(m.two ? [['pl-imc3', `위 계면 ${pc(m.snUp)}`]] : [], [['f-imc', `아래 계면 ${pc(m.snLo)}`]]).forEach(([c, t]) => {
        s += R(lx, 936, 18, 18, c) + T(lx + 25, 952, t, 't-dim', 'start'); lx += 25 + tw(t, 19) + 14;   // 셋째 칸이 강조 테두리(x 1550) 안에
      });
      // 경고 줄
      const W2 = [];
      if (m.niLeft < 0.5) W2.push([b ? '⚠ Ni < 0.5 µm — 더 가면 Cu 기둥까지 반응' : '⚠ Ni < 0.5 µm — 더 가면 시드 · 패드까지 반응', 'rf05-ng']);
      if (b){
        if (m.used && m.niLeft >= 0.5) W2.push(['✓ 상부 Cu 다 쓰임 → Ni 위 (Cu,Ni)₆Sn₅로 안정', 'rf05-ok']);
        if (!m.used) W2.push(['✓ Ni 그대로 — 솔더는 상부 Cu만 먹는 중', 'rf05-ok'], [`상부 Cu ${f2(cl)} µm 남음 — 아직 Cu₆Sn₅ 쪽`, 't-dim']);
        if (m.snPct > 60) W2.push(['⚠ Sn 소모 > 60 % — 접합의 대부분이 IMC', 'rf05-wn']);
        if (m.share > 60) W2.push(['⚠ 상부 Cu 몫 > 60 % — 두꺼움 (Cu₃Sn 쪽)', 'rf05-wn']);
      } else {
        if (m.snPct > 30) W2.push(['⚠ Sn 소모 > 30 % — 잘 깨질 수 있음', 'rf05-wn']);
        if (m.x > 3) W2.push(['⚠ IMC > 3 µm — 두꺼움', 'rf05-wn']);
        if (!W2.length) W2.push(['✓ 경고 없음 — Ni · 솔더 모두 여유', 'rf05-ok']);
      }
      if (m.snPct > 15) W2.push([`예: Ag 2.5 % → 남은 솔더 ${f1(2.5 / Math.max(0.01, 1 - m.snPct / 100))} % (06장)`, 't-dim']);
      W2.slice(0, 4).forEach(([t, c], k) => { s += T(BX0, 996 + k * 28, t, c, 'start'); });
      return s;
    }

    function render(){
      if (!ready) return;
      const sid = ctx.step() || lastSid;
      lastSid = sid;
      const m = calc(st);
      dieUI();
      ctx.$('[data-v="head"]').innerHTML = head(sid, m);
      ctx.$('[data-v="sec"]').innerHTML = section(sid, m);
      ctx.$('[data-v="inset"]').innerHTML = inset(m);
      ctx.$('[data-v="lanes"]').innerHTML = lanes(m);
      ctx.$('[data-v="graph"]').innerHTML = graph(m);
      ctx.$('[data-v="bud"]').innerHTML = budget(m);
      // 결과 칸
      const nl = Math.max(0, m.niLeft);
      ctx.out('k-x', `${f2(m.x)} µm`); ctx.out('k-ni', `${f2(m.b ? m.cuUsed : Math.min(st.ni, m.niUsed))} µm`);
      ctx.out('k-nil', m.b ? (m.used ? `상부 Cu 0 · Ni ${f2(nl)} µm` : `상부 Cu ${f2(m.cuLeft)} µm`) : (m.niLeft <= 0 ? '0 µm (다 먹힘)' : `${f2(m.niLeft)} µm`));
      ctx.out('k-sn', pc(m.snPct)); ctx.out('k-t', m.b && !m.used ? 'Cu₆Sn₅ (+ Cu₃Sn)' : m.ty.nm);
      mark('k-x', !m.b && m.x > 3 ? 'warn' : 'ok'); mark('k-ni', m.niLeft < 0.5 ? 'ng' : 'ok'); mark('k-sn', m.snPct > (m.b ? 60 : 30) ? 'warn' : 'ok');
      let msg = `${m.b ? '베이스 다이' : '코어 다이'} — 녹은 동안 <b>${f2(m.xl)} µm</b>`;
      msg += st.ht > 0 ? ` + 고온 시간 <b>${f2(m.x - m.xl)} µm</b> = <b>${f2(m.x)} µm</b>` : '';
      msg += ` (${m.ty.nm}). `;
      if (m.b) msg += m.used ? `상부 Cu ${f1(st.tc)} µm가 <b>다 쓰여</b> IMC가 Ni 위 (Cu,Ni)₆Sn₅로 바뀌었습니다 — Ni가 Cu 기둥의 Cu를 막아 거의 멈추고, Ni는 ${m.niUsed < 0.005 ? '거의 먹히지 않았습니다' : f2(m.niUsed) + ' µm만 먹혔습니다'}. `
        : `상부 Cu ${f2(m.cuUsed)} µm 먹힘 → 남은 상부 Cu <b>${f2(m.cuLeft)} µm</b> (다 쓰이면 IMC 약 ${f1(m.xm)} µm에서 거의 멈춤). `;
      else msg += `Ni ${f2(Math.min(st.ni, m.niUsed))} µm 먹힘 → 남은 Ni <b>${m.niLeft <= 0 ? '0 — 다 먹힘(더 가면 시드 · 패드까지 반응)' : f2(m.niLeft) + ' µm'}</b>. `;
      msg += `솔더 Sn의 <b>${pc(m.snPct)}</b>가 IMC로`;
      msg += m.two && m.x2 > 0.005 ? `(위 계면 ${f2(m.x2)} µm 몫 ${pc(m.snUp)} 포함).` : '.';
      if (m.b) msg += ` 상부 Cu를 다 쓰면 그것만으로 Sn 약 ${pc(m.share)}가 IMC가 되므로, 솔더 양은 이 몫을 미리 셉니다.`;
      if (m.b && m.share > 60) msg += ' 상부 Cu가 두꺼우면 다 쓰이기까지 Sn이 더 들고 오래 걸려, 그동안 Cu₃Sn이 계속 자라 커켄달 보이드 쪽으로 기울 수 있습니다(<a data-go="void.kirk">07장</a>).';
      if (m.snPct > 15) msg += ` 남은 솔더의 Ag가 진해집니다(실효 Ag = Ag₀ ÷ (1 − 소모): 2.5 % → ${f1(2.5 / Math.max(0.01, 1 - m.snPct / 100))} %) → <a data-go="solid.ag3sn">06장</a>.`;
      if (!m.b && st.cu === 'hi') msg += ' Cu가 섞이면 IMC는 빨리 자라지만 Ni는 덜 먹는 경향이 보고됩니다.';
      if (m.two && st.n === 1) msg += ' (녹이는 횟수 1회 = 본딩에서는 녹지 않았다고 봅니다 — 위 계면은 고온 시간만큼만 자랍니다.)';
      ctx.q('[data-o=msg]').innerHTML = msg;
      ctx.refresh();
    }
    RG.forEach(id => ctx.range(id, v => { st[id] = v; render(); return LBL[id](v); }));
    ctx.seg('die', (v, user) => {
      st.die = v;
      if (user){ st.ni = NI_EX[v]; const i = inp('ni'); if (i) i.value = st.ni; ctx.out('ni', LBL.ni(st.ni)); }   // 다이를 바꾸면 Ni를 그 다이의 예시 두께로
      render();
    });
    ctx.seg('cu', v => { st.cu = v; render(); });
    ctx.seg('side', v => { st.side = v; render(); });
    ctx.card.querySelectorAll('.pl-w input, .pl-w .pl-seg button').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    ready = true;
    render();
    // 손대기 전(그리고 발표 모드)에는 단계마다 예시 값으로
    ctx.demo = sid => {
      const api = window.EngrTheatres && window.EngrTheatres.reflow;
      if (api && api.state.pres != null) touched = false;
      if (!touched){
        Object.assign(st, DEF, DEMO[sid] || {});
        RG.forEach(id => { const i = inp(id); if (i) i.value = st[id]; ctx.out(id, LBL[id](st[id])); });
        setSeg('die', st.die); setSeg('cu', st.cu); setSeg('side', st.side);
      }
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['IMC (금속간 화합물)', '두 금속이 정해진 원자 비율로 결합한 결정. 솔더와 금속을 잇지만 단단하고 잘 깨진다'],
      ['상부 Cu', 'Ni 위에 얇게 한 번 더 올린 Cu(베이스 다이, 예시 3 µm). 솔더가 처음 만나는 면이고, 양이 정해져 있어 다 쓰이면 IMC가 Ni 위로 옮겨 간다'],
      ['Cu₆Sn₅ · Cu₃Sn', 'Cu 위 SnAg에서 자라는 IMC. Cu₆Sn₅(Cu 6 : Sn 5)는 둥근 가리비, 그 아래 Cu₃Sn은 얇은 띠. 두꺼운 Cu 위에 고온으로 오래 두면 Cu₃Sn이 계속 자란다'],
      ['Ni₃Sn₄', 'Ni 위 SnAg에서 자라는 IMC(코어 다이의 계면). Ni 3 : Sn 4, 각진 조각 모양. Cu 쪽 IMC보다 잘 깨지는 편이라는 보고가 많다'],
      ['(Cu,Ni)₆Sn₅', 'Cu₆Sn₅의 Cu 자리 일부를 Ni가 차지한 IMC. 솔더에 Cu가 섞이거나, 베이스 다이의 상부 Cu가 다 쓰인 뒤 Ni 위에 생긴다. 둥근 가리비 모양'],
      ['확산 지배 성장', '원자가 IMC 층을 건너는 빠르기가 성장 속도를 정하는 것 → 두께² − 처음 두께² ∝ 시간. 온도가 오르면 지수로 빨라진다(아레니우스 — 이 장의 가정으로는 150 °C 근처에서 10 °C마다 약 1.6배)'],
      ['커켄달 보이드', '두 원자의 확산 빠르기가 달라 한쪽에 빈자리가 모여 생긴 작은 구멍 줄 (Cu/Cu₃Sn 계면에서 흔히 보고)'],
      ['열 이력', '웨이퍼가 겪은 모든 가열(리플로우 · 본딩 · 고온 공정 · 시험)의 온도 × 시간 기록']
    ]) + K.field([
      '<b>열 이력 표</b>를 다이별로 만듭니다: 솔더가 녹는 일(웨이퍼 리플로우 · 재작업 · 본딩 — 코어 다이 범프는 적층에서 아래 다이일수록 여러 번(본딩 방식에 따라), 베이스 다이 범프는 인터포저 쪽에 붙일 때)과 녹지 않는 고온(캐리어 본딩 · 뒷면 공정 · 고온 시험)을 나눠 적습니다. IMC 예산은 이 합으로 보고, 본딩 뒤에는 위 · 아래 두 계면을 함께 셉니다.',
      '단면에서 IMC 두께는 <b>평균</b>과 <b>가장 두꺼운 곳</b>을 함께 적습니다(조각 · 가리비 모양이라 한 점으로는 흔들립니다).',
      '도금 두께 산포가 예산의 아래 끝을 정합니다. 코어 다이는 <b>가장 얇은 Ni</b>가 모든 열 이력 뒤에도 남아야 하고, 베이스 다이는 <b>상부 Cu 두께 산포</b>가 IMC가 Ni 위로 넘어가는 시점을 바꿉니다(얇으면 일찍 (Cu,Ni)₆Sn₅로, 두꺼우면 Cu₃Sn이 더 자라는 쪽). 가장 얇은 곳은 도금 전류가 덜 간 곳 — 보통 웨이퍼 중심 쪽 · 범프가 빽빽한 곳이지만 실드 · 립씰 조건에 따라 맨 가장자리 몇 mm일 수도 있어, 두께 맵에서 찾아 그 자리 단면을 봅니다 → <a href="#go-plating-07">전해도금 7장</a>(웨이퍼 분포) · <a href="#go-plating-08">8장</a>(패턴 차이) · <a href="#go-plating-10">10장</a>(Ni 방벽).',
      '단면 SEM-EDS로 IMC 종류를 다이별 기대와 맞춰 봅니다: 베이스 다이는 상부 Cu 위 Cu₆Sn₅(상부 Cu가 다 쓰였으면 Ni 위 (Cu,Ni)₆Sn₅), 코어 다이는 Ni₃Sn₄. 베이스 다이 계면에 Ni₃Sn₄가 보이면 상부 Cu가 빠졌거나 아주 얇았는지(도금 순서 · 두께)를, 코어 다이 IMC에 Cu가 함께 잡히면 Cu가 어디서 왔는지(상대 Cu 패드 · Ni 결함으로 드러난 시드 등)를 먼저 찾습니다(보통). 베이스 다이에서 솔더가 옆면을 타고 Cu 기둥까지 내려갔는지도 봅니다 → <a data-go="wet.edge">04장</a>.',
      'IMC 예산을 정하는 손잡이를 나눠 봅니다: <span class="pl-tag up">앞 공정</span> Ni · 상부 Cu 도금 두께 · 산포, 솔더 부피 · <span class="pl-tag rf05-cond">리플로우-조건</span> 액상선 위 시간 · 최고 온도 · 재작업 횟수(<a data-go="profile.tal">02장</a>) · <span class="pl-tag dn">뒤 공정</span> 적층 본딩 횟수 · 고온 공정 · 신뢰성 시험.'
    ]) + K.deep(`${K.eq('녹은 동안: x³ = n · k_l · t_l')}${K.eq('굳은 뒤: x² = x_l² + k_s · t')}
      <ul><li><b>소모 비율 (계산)</b> — Ni₃Sn₄ 밀도 약 8.65 g/cm³(격자 상수로 계산해도 같음), 몰 부피 약 75.3 cm³/mol(식 단위) → 1 µm Ni₃Sn₄ = Ni 0.26 µm + Sn 0.87 µm(반응 전 부피 합 1.13 µm → 약 11 % 줄어듦). Cu₆Sn₅(약 8.3 g/cm³) → Cu 0.36 µm + Sn 0.69 µm(약 5 % 줄어듦). 6Cu + 5Sn → Cu₆Sn₅ 에서 상부 Cu 3 µm는 Sn 약 5.7 µm와 반응해 Cu₆Sn₅ 약 8.3 µm가 됩니다(몰 부피 Cu 7.1 · Sn 16.3 cm³/mol) — SnAg 12 µm면 다 쓰일 수 있는 양입니다. 일부 문헌의 Cu₃Sn 밀도 11.3 g/cm³은 격자 계산(약 9.0 g/cm³)과 맞지 않아 쓰지 않습니다.</li>
      <li><b>녹은 상태 성장</b> — 순수 Sn · Sn-2Ag가 전해 Ni와 250 °C에서 1분 닿으면 각진 Ni₃Sn₄가 평균 약 1.35~3.6 µm 생긴다는 보고가 있습니다(Ni 종류 · 솔더 양 · 측정법에 따라 크게 흩어집니다. 위젯은 낮은 쪽인 1 µm를 씁니다). Sn-3.5Ag에서는 활성화 에너지가 전해 Ni 25 kJ/mol · 무전해 Ni(P) 38 kJ/mol로 보고되었고, 같은 조건에서 전해 Ni 위 IMC가 더 느리게 자랐으며 240 °C 20분 뒤에도 계면 미세 보이드가 없었다는 보고가 있습니다. Cu는 녹은 Sn에 Ni보다 훨씬 빨리 녹아들고 반응해, 같은 조건이면 Cu 위 IMC가 보통 더 두껍습니다(위젯 가정: 250 °C 60초 → Cu₆Sn₅ 2 µm). 시간 지수는 약 1/3(결정 커짐 · 녹아 나감과 겹침)이 흔히 보고됩니다.</li>
      <li><b>굳은 상태 성장</b> — x² = x₀² + k·t, k = k₀·exp(−Q/RT). Sn-3.5Ag/Ni 150~200 °C 보관에서 지수 약 0.5(확산 지배)가 보고되었지만, Q는 연구마다 16~172 kJ/mol로 넓게 흩어집니다(시편 · Ni 종류 · 솔더 양). Q 70 kJ/mol이면 150 °C 근처에서 10 °C마다 약 1.6배 빨라지고, 125 °C는 150 °C의 약 0.29배입니다(위젯 점선). Cu 위 Cu₆Sn₅ + Cu₃Sn은 보통 Ni 위 Ni₃Sn₄보다 빨리 자랍니다(위젯은 10배로 가정).</li>
      <li><b>Cu 임계</b> — 솔더 Cu가 약 0.4 wt% 아래면 (Ni,Cu)₃Sn₄ 연속층, 약 0.6 wt% 넘으면 (Cu,Ni)₆Sn₅ 연속층이 생긴다는 보고가 있습니다. (Cu,Ni)₆Sn₅ 층이 생기면 Ni 소모가 줄어드는 경향이 있지만, 성장 · 계면 모양 · 떨어져 나감(스폴링) 거동이 달라집니다. 베이스 다이는 상부 Cu가 녹아들어 솔더 속 Cu가 늘 넉넉한 쪽입니다.</li>
      <li><b>상부 Cu를 다 쓰게 하는 설계 · 커켄달</b> — 두꺼운 Cu 위에서는 Cu₃Sn이 계속 자라며 Cu/Cu₃Sn 계면에 커켄달 보이드가 생길 수 있습니다(Cu가 Sn보다 빨리 빠져나가 빈자리가 모임, 도금 Cu 속 S(촉진제 유래)가 키움 — <a href="#go-plating-06">전해도금 6장</a> · <a data-go="void.kirk">07장</a>). 얇은 Cu 약 3 µm를 SnAg가 다 써 버리도록 설계한 Cu/Ni/Cu/Sn-1.8Ag 마이크로범프가 고온 보관에서 계면 보이드가 거의 없었다는 공개 연구가 있습니다 — 상부 Cu가 다 쓰이면 IMC는 Ni 위 (Cu,Ni)₆Sn₅로 안정되고, Ni가 Cu 기둥의 Cu를 막아 Cu₃Sn이 더 자랄 Cu가 없기 때문으로 설명됩니다(보통 드는 이유). 그래서 Ni 방벽 범프의 커켄달 이야기는 주로 Ni가 없는 Cu 옆면 · 상대 Cu 패드 · 두껍게 남은 Cu 쪽입니다.</li>
      <li><b>마이크로범프의 솔더 소진</b> — Ni/Sn-2.5Ag/Ni 마이크로범프를 150 °C에 오래 두면 솔더가 모두 Ni₃Sn₄로 바뀌었다는 보고가 있습니다(포물선 법칙, 그 시편 Q 약 172 kJ/mol). 이 시편은 <b>위 · 아래 두 Ni 계면</b>에서 동시에 먹는 구조라, 계면 하나로 계산하면 위험을 절반으로 봅니다(위젯 코어 다이 · Ni 5 µm: 8회 + 1,000 h → 계면 1개 약 20 %, 2개 약 39 %). 상대가 Cu 패드면 그쪽에 Cu₆Sn₅ + Cu₃Sn이 더 빨리 자라고 커켄달 보이드도 생길 수 있습니다. 접합이 IMC로만 이어지면 녹는점은 높아지지만 단단하고 잘 깨집니다.</li>
      <li><b>Ag의 행방</b> — Ag는 IMC에 거의 들어가지 않고 솔더 속 Ag₃Sn으로 남습니다. Sn이 IMC로 빠지면 남은 솔더의 Ag 농도가 높아져(실효 Ag = Ag₀ ÷ (1 − 소모)), 처음 2.5 %였어도 큰 Ag₃Sn 판이 생길 수 있습니다(<a data-go="solid.ag3sn">06장</a>). 베이스 다이는 상부 Cu 몫만큼 Sn이 IMC로 가므로 이 효과를 함께 셉니다.</li></ul>`);
  },
  css: `.pl-svg .rf05-tag{fill:rgba(5,10,20,.8);stroke:rgba(148,163,184,.3);stroke-width:1}
.pl-svg .rf05-ibox{fill:rgba(5,10,20,.92);stroke:rgba(125,211,252,.4);stroke-width:1.4}
.pl-svg .rf05-hot{fill:rgba(239,68,68,.16)}
.pl-svg .rf05-frame{fill:none;stroke:rgba(148,163,184,.45);stroke-width:1.2}
.pl-svg .rf05-div{stroke:rgba(125,211,252,.22);stroke-width:1.2}
.pl-svg .rf05-orig{fill:none;stroke:#fde68a;stroke-width:2.4;stroke-dasharray:10 7}
.pl-svg .rf05-xl{fill:none;stroke:#38bdf8;stroke-width:3;stroke-dasharray:14 8}
.pl-svg .rf05-brk{fill:none;stroke:#fbbf24;stroke-width:2.6}
.pl-svg .rf05-ruler{fill:none;stroke:#0f172a;stroke-width:3}
.pl-svg .rf05-lead{stroke:#cbd5e1;stroke-width:1.6}
.pl-svg .rf05-ring{fill:none;stroke:#fbbf24;stroke-width:2.4}
.pl-svg .rf05-ie{stroke:#2f2116;stroke-width:1.2}
.pl-svg .rf05-nc{fill:#9b7655}
.pl-svg .rf05-c3s{stroke:#1c120a;stroke-width:1.2}
.pl-svg .rf05-cn{fill:#93603f}
.pl-svg .rf05-nia{fill:#9aa6b5;stroke:#1e293b;stroke-width:1.8}
.pl-svg .rf05-cua{fill:#e8a36a;stroke:#4a2a12;stroke-width:1.8}
.pl-svg .rf05-sna{fill:#f8fafc;stroke:#334155;stroke-width:1.8}
.pl-svg .rf05-used{fill:rgba(239,68,68,.45);stroke:#f87171;stroke-width:1}
.pl-svg .rf05-usedc{fill:rgba(251,191,36,.3);stroke:#fbbf24;stroke-width:1}
.pl-svg .rf05-sep{stroke:#0b1222;stroke-width:2.4}
.pl-svg .rf05-bar0{fill:rgba(15,23,42,.6);stroke:rgba(148,163,184,.35);stroke-width:1}
.pl-svg .rf05-thr{stroke:#f87171;stroke-width:2.4;stroke-dasharray:5 4}
.pl-svg .rf05-mk{stroke:#fbbf24;stroke-width:2.4;stroke-dasharray:5 4}
.pl-svg .rf05-cap{stroke:#34d399;stroke-width:2.4;stroke-dasharray:2 6;stroke-linecap:round}
.pl-svg .rf05-grid{stroke:rgba(143,166,198,.16);stroke-width:1}
.pl-svg .rf05-thrt{font-size:18px;font-weight:700;fill:#fca5a5 !important;text-anchor:middle}
.pl-svg .rf05-mkt{font-size:18px;font-weight:700;fill:#fcd34d !important;text-anchor:middle}
.pl-svg .rf05-capt{font-size:18px;font-weight:700;fill:#6ee7b7 !important}
.pl-svg .rf05-bt{font-size:18px;font-weight:800;fill:#0b1222 !important;stroke:none !important}
.pl-svg .rf05-snt{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .rf05-ng{font-size:20px;font-weight:800;fill:#fca5a5 !important}
.pl-svg .rf05-wn{font-size:20px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .rf05-ok{font-size:20px;font-weight:800;fill:#86efac !important}
.pl-svg .rf05-now{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.jc .rf05-na{opacity:.4}
.jc .pl-tag.rf05-cond{background:rgba(45,212,191,.18);color:#5eead4}`
});
})();
