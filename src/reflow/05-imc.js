/* 리플로우 05 — 계면 IMC: 솔더와 Ni 사이에는 무엇이 자랄까? (계면 · µm) */
(function(){
// ── 개념 모델 (기획 rev.2 · 05장 — 상수는 가정값, K.model 에 밝힌다)
//  녹은 동안(최고 250 °C 가정): x_l = (n · t_l · f / 60)^(1/3) µm   (k_l = 1/60 µm³/s: 250 °C 60초 → 1 µm)
//  굳은 뒤(150 °C 환산): x = √(x_l² + k_s · t_h · f), k_s = 3.4×10⁻³ µm²/h (1,000시간 → 약 +1 µm). 125 °C 비교선 k_s × 0.29 (Q 70 kJ/mol)
//  솔더 속 Cu 배수 f: 없음 1 · 조금 1.3 · 많이 2. 소모 비율(IMC 1 µm당 µm): Ni₃Sn₄ Ni 0.26 · Sn 0.87(밀도 계산),
//  (Ni,Cu)₃Sn₄ 0.22 · 0.85(가정), (Cu,Ni)₆Sn₅ 0.07(Ni가 금속 자리 약 20 % 가정) · 0.69
//  계면 2개(본딩 뒤): 위(상대 패드, Ni 가정) 계면은 본딩부터 — x₂ = √(((n − 1)·t_l·f/60)^(2/3) + k_s·t_h·f)
//  Sn 소모 % = c_sn · (x + x₂) / 12 µm × 100 (12 µm = 도금 원기둥과 같은 부피의 솔더 두께). 남은 Ni = Ni − c_ni · x
const KL = 1 / 60, KS = 3.4e-3, K125 = 0.29, SN0 = 12;
const TYPE = {
  '0': {f: 1, ni: 0.26, sn: 0.87, nm: 'Ni₃Sn₄', cls: 'f-imc rf05-ie', shape: 'facet'},
  lo: {f: 1.3, ni: 0.22, sn: 0.85, nm: '(Ni,Cu)₃Sn₄', cls: 'f-imc rf05-ie rf05-nc', shape: 'facet'},
  hi: {f: 2, ni: 0.07, sn: 0.69, nm: '(Cu,Ni)₆Sn₅', cls: 'f-imc rf05-ie rf05-cn', shape: 'scallop'}   // 세 탭 공통: f-imc = Ni₃Sn₄ · Cu₆Sn₅, pl-imc3 = Cu₃Sn
};
function calc(s){
  const ty = TYPE[s.cu] || TYPE['0'], f = ty.f;
  const xl = Math.cbrt(s.n * s.tl * f * KL), x = Math.sqrt(xl * xl + KS * s.ht * f);
  const two = s.side === '2';
  const xl2 = two ? Math.cbrt(Math.max(0, s.n - 1) * s.tl * f * KL) : 0, x2 = two ? Math.sqrt(xl2 * xl2 + KS * s.ht * f) : 0;
  const niUsed = ty.ni * x, niLeft = s.ni - niUsed;
  const snLo = ty.sn * x / SN0 * 100, snUp = ty.sn * x2 / SN0 * 100;
  return {ty, f, xl, x, xl2, x2, two, niUsed, niLeft, snLo, snUp, snPct: snLo + snUp};
}
// ── 무대 배치: 왼쪽 확대 단면(1 µm = 60 px) · 오른쪽 패널(위: 단계별, 아래: 예산 막대)
const X0 = 60, X1 = 1000, WY = 250, YC = 1050, YB = 1110, PX = 60;
const GR = {x0: 1110, x1: 1510, y0: 470, y1: 214, tmax: 2000, vmax: 5};
const gx = t => GR.x0 + t / GR.tmax * (GR.x1 - GR.x0), gy = v => GR.y0 - Math.min(v, GR.vmax + 0.5) / GR.vmax * (GR.y0 - GR.y1);
const BX0 = 1080, BX1 = 1520, BW = BX1 - BX0, NIPX = BW / 5;
const DEF = {n: 3, tl: 60, ht: 0, ni: 3, cu: '0', side: '2'};
// 발표 모드 · 손대기 전: 단계마다 기본값 + 이 값만 덮어쓴다 (앞 단계 값을 이어 받지 않음)
// dissolve · ni3sn4 는 웨이퍼 리플로우 한 번 이야기라 계면 1개로 보인다 (1회면 위 계면은 어차피 0 — 숫자는 같다)
const DEMO = {dissolve: {n: 1, tl: 30, side: '1'}, ni3sn4: {n: 1, tl: 60, side: '1'}, cu: {cu: 'hi'}, grow: {ht: 1000}, budget: {n: 8, ht: 1000}};
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
// 둥근 가리비 층((Cu,Ni)₆Sn₅ · Cu₆Sn₅): 폭 80~120 px 반타원 이음
function scallop(K, x0, x1, yb, X, seed, dir = -1, wmin = 80, wr = 40){
  const g = K.rng(seed), v = 0.45 * X;
  let d = `M${x0},${yb} L${x0},${(yb + dir * v).toFixed(1)}`, x = x0, ext = v;
  while (x < x1 - 0.5){
    let w = wmin + g() * wr;
    if (x1 - x - w < wmin * 0.4) w = x1 - x;
    const p = X * 1.2 * (1 + 0.15 * (2 * g() - 1));
    ext = Math.max(ext, p);
    d += ` A${(w / 2).toFixed(1)},${(p - v).toFixed(1)} 0 0 ${dir < 0 ? 1 : 0} ${(x + w).toFixed(1)},${(yb + dir * v).toFixed(1)}`;
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
  title: '계면 IMC — 솔더와 Ni 사이에는 무엇이 자랄까?',
  hook: '이어 주지만 Ni를 먹는다',
  one: '녹은 솔더 속 Sn은 Ni와 만나 새 화합물(금속간 화합물, IMC)을 만듭니다. Ni 위에서는 주로 Ni₃Sn₄가 자라고, 솔더에 Cu가 섞이면 (Cu,Ni)₆Sn₅가 됩니다. 얇은 IMC는 단단히 이어졌다는 증거지만, 열을 받을수록 두꺼워지며 Ni와 Sn을 먹습니다.',
  ana: '<b>쇠에 스는 녹</b> — 쇠와 산소가 만나는 자리에 녹 층이 생기며 쇠가 줄듯, Ni와 Sn이 만나는 자리에 IMC 층이 생기며 Ni(와 Sn)가 줄어듭니다. 층이 두꺼워질수록 원자가 층을 건너기 어려워 자라는 속도가 느려지는 것도 닮았습니다. <i>(비유의 한계: 쇠의 녹은 푸석해서 아무것도 잇지 못하지만, IMC는 솔더와 Ni를 금속으로 이어 주는 꼭 필요한 층입니다. 다만 너무 두꺼우면 단단하고 잘 깨지는 층이 됩니다.)</i>',
  steps: [
    {id: 'dissolve', t: '녹으면 반응이 시작된다', d: '솔더가 녹으면 Ni 표면의 원자가 조금 녹아들고, 곧 계면에 Ni와 Sn의 화합물이 생겨 덮습니다. 도금 직후에는 거의 없던 반응층이 리플로우 한 번에 보통 1 µm 안팎으로 자랍니다(온도 · 시간 · Ni 종류에 따라 몇 µm까지).', viewN: {x: 1040, y: 130, w: 520, h: 490}},
    {id: 'ni3sn4', t: 'Ni₃Sn₄ — 각진 조각 층', d: 'Ni 위 SnAg에서는 Ni₃Sn₄가 자랍니다. 녹은 솔더 쪽으로 각진 바늘 · 조각 모양으로 솟고, 굳은 뒤 이 층이 솔더와 Ni를 잇습니다. Ag는 IMC에 거의 들어가지 않고 솔더 속 작은 Ag₃Sn으로 남습니다.', viewN: {x: 1040, y: 130, w: 520, h: 490}},
    {id: 'cu', t: 'Cu가 오면 — (Cu,Ni)₆Sn₅', d: '솔더에 Cu가 조금만 섞여도(약 0.6 wt% 넘으면) Ni 위 IMC가 (Cu,Ni)₆Sn₅로 바뀝니다. 솔더가 옆면을 타고 Cu 기둥에 닿거나 상대 칩이 Cu 패드면 Cu가 들어옵니다. Cu 쪽에서는 Cu₆Sn₅와 Cu₃Sn이 자랍니다.', viewN: {x: 1040, y: 130, w: 520, h: 490}},
    {id: 'grow', t: '자라는 속도 — 시간과 온도', d: '굳은 뒤에는 원자가 IMC 층을 건너야 해서 두꺼울수록 느리게 자랍니다. 두께의 제곱이 시간에 비례해 늘어, 처음 IMC가 없었다면 시간 4배 → 두께 2배입니다. 리플로우에서 생긴 IMC 위에 더해지므로 실제로 늘어나는 양은 이와 다릅니다. 온도가 오르면 빨라지고, 녹아 있는 동안은 훨씬 빠릅니다.', viewN: {x: 1040, y: 130, w: 520, h: 490}},
    {id: 'budget', t: 'Ni · Sn 예산 — 여러 번의 열', d: '웨이퍼 리플로우 · 적층 본딩 · 고온 공정 · 시험을 거칠 때마다 IMC가 자라 Ni와 Sn이 줄어듭니다. 본딩 뒤에는 위 · 아래 두 계면에서 IMC가 자라 솔더가 두 배 빨리 줄어듭니다. 마이크로범프는 솔더가 적어 큰 몫이 IMC로 바뀔 수 있어, Ni 두께와 솔더 양을 마지막 열 이력 뒤에도 남을 만큼 넉넉히 잡습니다.', viewN: {x: 1040, y: 622, w: 520, h: 478}}
  ],
  icon(K){
    const {R, PG} = K;
    return R(4, 44, 58, 16, 'f-ni') + PG([[4, 44], [10, 34], [16, 44], [22, 30], [28, 44], [34, 36], [40, 44], [46, 32], [52, 44], [58, 38], [62, 44]], 'f-imc') + R(4, 8, 58, 22, 'f-sn2');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, W, wrap} = K;
    let s = `<defs><clipPath id="${K.id('rf05-cw')}"><rect x="${X0}" y="${WY}" width="${X1 - X0}" height="${YB - WY}"/></clipPath>` +
      `<linearGradient id="${K.id('rf05-nig')}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#334155" stop-opacity="1"/><stop offset="1" stop-color="#64748b" stop-opacity="0"/></linearGradient>` +
      `<clipPath id="${K.id('rf05-gc')}"><rect x="${GR.x0}" y="${GR.y1 - 4}" width="${GR.x1 - GR.x0 + 4}" height="${GR.y0 - GR.y1 + 4}"/></clipPath></defs>`;
    // 왼쪽: 단계 머리글 + 확대 단면 (위젯이 그린다)
    s += `<g data-v="head"></g><g data-v="sec"></g><g data-v="inset"></g>`;
    // 오른쪽 패널
    s += R(1040, 130, 520, 970, 'pl-panel', {rx: 14}) + L(1060, 622, 1540, 622, 'rf05-div');
    // ① dissolve: 녹고 나서 몇 초 — 세 장면
    let dz = T(1064, 170, '녹고 나서 — 몇 초 만에 계면이 덮인다', 't-acc', 'start');
    const FX = [1064, 1222, 1380], FW = 150, FY = 196;
    FX.forEach((x, i) => {
      let f = R(x, FY, FW, 152, 'f-sn2') + R(x, FY + 152, FW, 48, 'f-ni');
      if (i === 1){
        const g = K.rng(31);
        for (let k = 0; k < 5; k++){ const cx = x + 16 + k * 29 + g() * 6, hh = 7 + g() * 8; f += K.PG([[cx - 9, FY + 152], [cx - 3, FY + 152 - hh], [cx + 4, FY + 152 - hh * 0.8], [cx + 9, FY + 152]], 'f-imc rf05-ie'); }
        for (let k = 0; k < 6; k++) f += C(x + 18 + g() * 114, FY + 84 + g() * 52, 6, 'rf05-nia');
      }
      if (i === 2) f += P(facet(K, x, x + FW, FY + 152, 22, 1, 33).d, 'f-imc rf05-ie');
      f += R(x, FY, FW, 200, 'rf05-frame');
      const tp = ['도금 직후 — 계면에 반응층이 거의 없다', '녹고 몇 초 — Ni가 조금 녹아들고, 계면에 작은 조각(핵)이 생겨 곧 이어진다', '약 1분 뒤(250 °C) — 이어진 층이 자라 보통 1 µm 안팎 (위젯: 1회 · 60 s → 1.00 µm)'][i];
      dz += G(f, tip(tp)) + T(x + FW / 2, FY + 230, ['도금 직후', '녹고 몇 초', '약 1분 뒤'][i], 't-sub') + T(x + FW / 2, FY + 256, ['반응층 거의 없음', '조각(핵)이 생김', '1 µm 안팎'][i], 't-dim');
    });
    dz += TT(1064, 502, wrap('녹은 솔더로 Ni가 아주 조금 녹아들면 계면 바로 앞이 Ni로 진해지고, 그 자리에 Ni₃Sn₄ 조각이 생겨 계면을 덮습니다.', 22), 't-sub', 'start', 28);
    dz += T(1064, 598, '덮인 뒤에는 원자가 IMC를 건너야 해서 느려진다', 't-dim', 'start');
    s += G(dz, only('dissolve'));
    // ② ni3sn4: 종류 · 원자 비율 · 소모 비율
    let nb = T(1064, 170, 'IMC 종류 — Ni 위 SnAg', 't-acc', 'start') + T(1064, 204, 'Ni₃Sn₄ — Ni 3 : Sn 4, 각진 조각', 'pl-hdg', 'start');
    [0, 1, 2].forEach(k => { nb += C(1084 + k * 40, 244, 15, 'rf05-nia'); });
    nb += T(1210, 253, ':', 't-lbl');
    [0, 1, 2, 3].forEach(k => { nb += C(1244 + k * 40, 244, 15, 'rf05-sna'); });
    nb += T(1124, 290, 'Ni ×3', 't-dim') + T(1304, 290, 'Sn ×4', 't-dim');
    nb += T(1064, 334, 'IMC 1 µm가 생기려면 (밀도로 계산)', 't-sub', 'start');
    const SY = 524, U = 120;
    nb += G(R(1084, SY - 0.26 * U, 80, 0.26 * U, 'f-ni') + R(1084, SY - 1.13 * U, 80, 0.87 * U, 'f-sn2') + R(1084, SY - 1.13 * U, 80, 1.13 * U, 'rf05-frame'), tip('반응 전: Ni 0.26 µm + Sn 0.87 µm = 1.13 µm'));
    nb += T(1176, SY - 0.13 * U + 7, 'Ni 0.26 µm', 't-sub', 'start') + T(1176, SY - 0.695 * U + 7, 'Sn 0.87 µm', 't-sub', 'start');
    nb += K.arrow(1312, SY - 62, 1372, SY - 62, 's-arr2');
    nb += G(P(facet(K, 1390, 1480, SY, U, 0.35, 12).d, 'f-imc rf05-ie'), tip('Ni₃Sn₄ 1 µm (밀도 약 8.65 g/cm³)'));
    nb += T(1435, SY + 30, 'IMC 1.00 µm', 't-sub') + T(1124, SY + 30, '반응 전 1.13 µm', 't-dim');
    nb += T(1064, 600, '부피는 약 11 % 줄어든다 · Ag는 거의 안 들어간다', 't-dim', 'start');
    s += G(nb, only('ni3sn4'));
    // ③ cu: 세 경우 비교 (지금 위젯 칸 강조) · ④ grow · budget: 두께 곡선 — 위젯이 그린다
    s += G(`<g data-v="lanes"></g>`, only('cu')) + G(`<g data-v="graph"></g>`, only('grow budget'));
    // 아래: Ni · Sn 예산 막대 (모든 단계, budget 에서 강조)
    s += R(1050, 632, 500, 460, 'pl-hlbox', W({rx: 12}, only('budget'))) + `<g data-v="bud"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — IMC 예산</div>
      ${K.ctl('n', '녹이는 횟수 (웨이퍼 리플로우 · 적층 본딩 · 재작업)', 1, 10, 1, DEF.n)}${K.ctl('tl', '한 번에 녹아 있는 시간 (초)', 20, 180, 5, DEF.tl)}
      ${K.ctl('ht', '고체 상태 고온 시간 (캐리어 본딩 · 뒷면 공정 · 시험을 150 °C로 환산, 시간)', 0, 2000, 50, DEF.ht)}${K.ctl('ni', 'Ni 두께 (µm)', 1, 5, 0.5, DEF.ni)}
      ${K.seg('cu', [['0', '없음 (Ni 위 SnAg)'], ['lo', '조금 (0.4 % 미만)'], ['hi', '많이 (0.6 % 넘음)']], DEF.cu, '솔더 속 Cu').replace('class="pl-seg"', 'class="pl-seg pl-chips"')}
      ${K.seg('side', [['1', '웨이퍼 리플로우만 (계면 1개)'], ['2', '본딩 뒤 (아래 · 위 계면 2개)']], DEF.side, '계면 수').replace('class="pl-seg"', 'class="pl-seg pl-chips"')}
      ${K.kpis([['IMC 두께', 'k-x', '이 칩 Ni 계면'], ['Ni 소모', 'k-ni', '남은 Ni <span data-o="k-nil">–</span>'], ['Sn 소모', 'k-sn', '도금 솔더 대비 · 고른 계면 합'], ['IMC 종류', 'k-t', '']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('녹은 동안 x³ ∝ 시간, 굳은 뒤 x² − x₀² ∝ 시간인 개념 모델입니다. 본딩 뒤에는 위 계면(상대 패드, Ni로 가정)도 본딩부터 같은 식으로 자랍니다. 속도 상수(250 °C 60초 → 1 µm — 보고값의 낮은 쪽, 150 °C 1,000시간 → +1 µm)와 Cu 배수(조금 ×1.3 · 많이 ×2)는 가정값이고, 보고된 속도 · 활성화 에너지는 Ni 종류 · 솔더 양 · 측정법에 따라 크게 흩어집니다. 소모 비율은 Ni₃Sn₄ · Cu₆Sn₅ 밀도로 계산했고, Cu가 섞인 IMC의 Ni 몫((Cu,Ni)₆Sn₅에서 금속 자리의 약 20 % 등)은 가정값입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip, only, on, W} = K;
    const st = Object.assign({}, DEF);
    let touched = false, ready = false, lastSid = 'dissolve';
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const LBL = {n: v => v + '회', tl: v => v + '\u00a0s', ht: v => v.toLocaleString('en-US') + '\u00a0h', ni: v => f1(v) + '\u00a0µm'};   // 줄바꿈되지 않게
    const kpiBox = id => { const o = ctx.card.querySelector(`[data-o="${id}"]`); return o && o.closest('.kpi'); };
    const mark = (id, c) => { const b = kpiBox(id); if (b) ['ok', 'warn', 'ng'].forEach(k => b.classList.toggle(k, k === c)); };

    // ── 단계 머리글 (왼쪽 위, 어두운 바탕)
    function head(sid, m){
      const sc = m.ty.shape === 'scallop';
      const H = {
        dissolve: ['녹은 솔더 — Ni가 조금 녹아들고, 곧 계면에 화합물이 생긴다', '회색 점: Ni 원자 (솔더로 녹아듦) · 흰 점: Sn 원자 (계면으로) — 개념 그림'],
        ni3sn4: sc ? ['지금 위젯: 솔더 속 Cu 많이 — 가리비 모양 (Cu,Ni)₆Sn₅', 'Cu가 없으면 Ni 위에는 각진 조각 Ni₃Sn₄가 자란다 (다음 단계에서 비교)']
          : ['Ni₃Sn₄ — 녹은 솔더 쪽으로 각진 조각이 솟는다', '굳은 뒤 이 층이 솔더와 Ni를 금속으로 잇는다 · Ag는 거의 안 들어간다'],
        cu: st.cu === 'hi' ? ['솔더에 Cu가 섞이면 — 둥근 가리비 (Cu,Ni)₆Sn₅', 'Cu는 옆면을 타고 닿은 Cu 기둥 · 상대 Cu 패드에서 온다 · Ni는 덜 먹는다']
          : st.cu === 'lo' ? ['Cu 조금 (0.4 % 미만) — (Ni,Cu)₃Sn₄, 아직 각진 조각', 'Cu가 약 0.6 % 넘으면 둥근 가리비 (Cu,Ni)₆Sn₅로 바뀐다 (위젯 "많이")']
          : ['솔더 속 Cu 없음 — 아직 각진 조각 Ni₃Sn₄', '위젯에서 솔더 속 Cu "많이"를 고르면 가리비 (Cu,Ni)₆Sn₅로 바뀐다'],
        grow: st.ht > 0 ? ['굳은 뒤 고온 시간 — IMC가 천천히 더 자란다', '하늘 점선: 리플로우 직후 IMC 윗면(평균) · 두꺼울수록 느리게 자란다']
          : ['고온 시간 0 h — 리플로우에서 생긴 IMC 그대로', '위젯의 고체 상태 고온 시간을 늘리면 IMC가 천천히 더 자란다'],
        budget: ['열을 받을 때마다 — Ni와 Sn이 IMC로 바뀐다', m.two ? '왼쪽 위: 본딩 뒤 접합 전체(계면 둘) · 오른쪽 아래: 예산 막대' : '왼쪽 위: 웨이퍼 리플로우만(계면 하나) · 오른쪽 아래: 예산 막대']
      }[sid];
      return LB(T(X0, 176, H[0], 't-acc', 'start') + T(X0, 210, H[1], 't-dim', 'start'));
    }

    // ── 왼쪽 확대 단면
    function section(sid, m){
      const yN0 = YC - st.ni * PX, yN = Math.min(YC, yN0 + m.niUsed * PX), X = m.x * PX;
      const sc = m.ty.shape === 'scallop';
      // 굳은 뒤 고온에 오래 두면 조각이 뭉툭해지며 층이 고르게 된다(보고된 경향) → 리플로우 몫 비율만큼만 각지게
      const shp = sc ? scallop(K, X0, X1, yN, X, 7) : facet(K, X0, X1, yN, X, sid === 'dissolve' ? 0.3 : Math.max(0.45, Math.min(1, m.xl / m.x)), 5);
      const ytop = shp.top;
      let w = R(X0, WY, X1 - X0, yN - WY, 'f-sn2', tip(sid === 'dissolve' ? '녹은 SnAg 솔더 (약 250 °C)' : '굳은 SnAg 솔더 — 확대 단면 (범프 가운데)'));
      w += R(X0, WY, X1 - X0, yN - WY, 'rf05-hot', only('dissolve'));
      w += R(X0, yN - X - 190, X1 - X0, 190 + X * 0.5, 'rf05-nirich', W(only('dissolve'), {fill: K.url('rf05-nig')}, tip('Ni가 녹아든 솔더 — 계면 바로 앞이 Ni로 진해진다 (개념 그림)')));
      // 솔더 속 작은 Ag₃Sn (굳은 뒤)
      const g = K.rng(9);
      let ag = '';
      for (let k = 0; k < 80; k++){
        const x = X0 + 24 + g() * (X1 - X0 - 48), y = WY + 70 + g() * 760, rr = 4 + g() * 5, an = Math.round(g() * 180);
        if (y < ytop - 26 && !(x > 900 && y < 350)) ag += K.E(x, y, rr * 1.5, rr * 0.7, 'pl-ag3', {transform: `rotate(${an} ${x.toFixed(1)} ${y.toFixed(1)})`});
      }
      w += G(ag, W(on('ni3sn4'), tip('Ag₃Sn 알갱이 — Ag는 IMC에 거의 들어가지 않고 솔더 속에 남는다')));
      w += P(shp.d, m.ty.cls, tip(`IMC — ${m.ty.nm} ${f2(m.x)} µm (평균)\n${sc ? '둥근 가리비 모양' : '각진 조각 모양'} · 아래 Ni와 위 솔더를 함께 먹으며 자란다${st.ht > 0 && !sc ? '\n고온에 오래 두면 조각이 뭉툭해지고 층이 고르게 된다 (보고된 경향)' : ''}`));
      if (yN < YC) w += R(X0, yN, X1 - X0, YC - yN, 'f-ni', tip(`Ni 방벽 — 남은 ${f2(Math.max(0, m.niLeft))} µm (도금 ${f1(st.ni)} µm)`));
      w += R(X0, YC, X1 - X0, YB - YC, 'f-cu2', tip('Cu 기둥'));
      w += L(X0, yN0, X1, yN0, 'rf05-orig', tip('처음 계면 — 도금 직후 Ni 윗면'));
      const yXl = yN0 - (1 - m.ty.ni) * m.xl * PX;          // 리플로우 직후 윗면: 처음 계면 위로 (1 − Ni 몫) × x_l
      w += L(X0, yXl, X1, yXl, 'rf05-xl', W(only('grow'), tip(`리플로우 직후 IMC 윗면 (평균 ${f2(m.xl)} µm 두께일 때) — 그래프의 출발점`)));
      if (m.niUsed * PX > 3) w += P(`M954,${yN0.toFixed(1)} L968,${yN0.toFixed(1)} L968,${yN.toFixed(1)} L954,${yN.toFixed(1)}`, 'rf05-brk', tip(`먹힌 Ni ${f2(m.niUsed)} µm`));
      // 녹는 동안의 원자 움직임 (개념)
      let mv = '';
      for (let k = 0; k < 6; k++){
        const x = 120 + k * 150;
        mv += K.mover(x, yN + 12, x + 18, yN - X - 180, 11, 'rf05-nia', 2.8, k * 0.47);
        mv += K.mover(x + 70, WY + 150, x + 64, yN - X * 0.6, 11, 'rf05-sna', 3.3, k * 0.55);
      }
      w += G(mv, only('dissolve'));
      w = G(w, {'clip-path': K.url('rf05-cw')}) + R(X0, WY, X1 - X0, YB - WY, 'rf05-frame');
      // 두께 자 (1 µm)
      w += LB(P(`M968,266 L980,266 M974,266 L974,326 M968,326 L980,326`, 'rf05-ruler') + tag(K, 956, 303, '1 µm', 't-dim', 'end'));
      // 꼬리표: 솔더 · Ag₃Sn · IMC · Ni · Cu
      w += G(tag(K, X0 + 22, 298, sid === 'dissolve' ? '녹은 SnAg 솔더 (약 250 °C)' : '굳은 SnAg 솔더', 't-sub'), only('dissolve ni3sn4 cu grow'));
      w += G(tag(K, X0 + 22, Math.max(360, yN - X - 120), '계면 바로 앞 — Ni가 녹아들어 진해진 솔더', 't-dim'), only('dissolve'));
      if (ytop > 470){
        const ax = 560, ay = Math.min(450, ytop - 50);
        w += G(K.E(ax, ay, 14, 6, 'pl-ag3', {transform: `rotate(-20 ${ax} ${ay})`}) + C(ax, ay, 22, 'rf05-ring') + L(ax - 20, ay - 12, 470, 360, 'rf05-lead') +
          tag(K, X0 + 22, 352, 'Ag₃Sn — Ag는 IMC에 거의 안 들어가고 솔더에 남는다', 't-sub'), only('ni3sn4'));
      }
      const l1 = (sid === 'dissolve' ? '막 생긴 IMC — ' : 'IMC — ') + `${m.ty.nm} ${f2(m.x)} µm`;
      const eat = m.niLeft <= 0 ? ['Ni 다 먹힘 → 실제로는 Cu까지 반응 (모델 밖)', 'rf05-ng'] : [`Ni ${f2(m.niUsed)} µm 먹힘 (노란 점선 = 처음 계면)`, 't-dim'];
      const lines = sid === 'grow' ? [[l1, 't-sub'], [`리플로우 직후 ${f2(m.xl)} µm (하늘 점선 = 그때 윗면)`, 't-dim'], [`+ 고온 시간 ${f2(m.x - m.xl)} µm`, 't-dim'], eat] : [[l1, 't-sub'], eat];
      const ty0 = Math.max(372, Math.min(ytop - 24 - (lines.length - 1) * 27, 900));
      const tyEnd = ty0 + (lines.length - 1) * 27 + 10;
      w += L(900, Math.min(tyEnd, yN - X), 900, yN - X, 'rf05-lead') + tagN(K, 984, ty0, lines, 'end');
      // Ni · Cu
      const niPx = YC - yN;
      const niT = `Ni 방벽 — 남은 ${f2(Math.max(0, m.niLeft))} µm`;
      if (niPx >= 46) w += tag(K, X0 + 22, (yN + YC) / 2 + 8, niT, 't-sub');
      else w += tag(K, 984, YC + 38, '↑ ' + niT, 't-sub', 'end');
      w += tag(K, X0 + 22, YC + 38, 'Cu 기둥', 't-sub');
      return w;
    }

    // ── 본딩 뒤 접합 전체 (budget 단계, 왼쪽 위)
    function inset(m){
      const bx = 80, by = 266, bw = 490, bh = 340, dx0 = bx + 26, dx1 = bx + 206;
      let s = R(bx, by, bw, bh, 'rf05-ibox', {rx: 12}) + T(bx + 18, by + 32, m.two ? '본딩 뒤 — 솔더 하나에 계면 둘' : '웨이퍼 리플로우만 — 계면 하나', 'pl-hdg', 'start');
      const nl = Math.max(0, m.niLeft), remUm = Math.max(0, SN0 - m.ty.sn * (m.x + m.x2));
      const tot = remUm + m.x + m.x2 + nl + (m.two ? 2 : 1.5);
      const sc = Math.min(13, 232 / tot);
      let y = by + bh - 14;
      const lab = [];
      s += R(dx0, y - 20, dx1 - dx0, 20, 'f-cu2'); lab.push([y - 10, 'Cu 기둥 (이 칩)']); y -= 20;
      if (nl > 0){ s += R(dx0, y - nl * sc, dx1 - dx0, nl * sc, 'f-ni'); lab.push([y - nl * sc / 2, `Ni 남음 ${f2(nl)} µm`]); y -= nl * sc; }
      const yI1 = y, X1p = m.x * sc, ySolTop = yI1 - X1p - remUm * sc, X2p = m.x2 * sc, yP = ySolTop - X2p;
      const sol = m.two ? R(dx0, yP, dx1 - dx0, yI1 - yP, 'f-sn2')
        : P(`M${dx0},${yI1} L${dx0},${(ySolTop + 18).toFixed(1)} Q${(dx0 + dx1) / 2},${(ySolTop - 18).toFixed(1)} ${dx1},${(ySolTop + 18).toFixed(1)} L${dx1},${yI1} Z`, 'f-sn2');
      s += sol + P(facet(K, dx0, dx1, yI1, X1p, 1, 21).d, m.ty.cls);
      lab.push([yI1 - X1p / 2, `아래 계면 IMC ${f2(m.x)} µm`]);
      lab.push([(ySolTop + yI1 - X1p) / 2, `남은 솔더 ${pc(100 - m.snPct)}`]);
      if (m.two){
        if (X2p > 0.5) s += P(facet(K, dx0, dx1, yP, X2p, 1, 23, 1).d, m.ty.cls);
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
      lab.sort((a, b) => a[0] - b[0]);
      const ys = lab.map(l => l[0] + 7), lo = by + 62, hi = by + bh - 10;
      ys[0] = Math.max(ys[0], lo);
      for (let k = 1; k < ys.length; k++) ys[k] = Math.max(ys[k], ys[k - 1] + 27);
      const over = ys[ys.length - 1] - hi;
      if (over > 0) for (let k = ys.length - 1; k >= 0; k--){ ys[k] = Math.min(ys[k], k === ys.length - 1 ? hi : ys[k + 1] - 27); }
      lab.forEach(([yl, t], k) => { s += L(dx1 + 4, yl, dx1 + 30, ys[k] - 7, 'rf05-lead') + T(dx1 + 36, ys[k], t, 't-dim', 'start'); });
      return G(s, only('budget'));
    }

    // ── 오른쪽 위 ③: 세 경우 비교 (지금 위젯의 경우 강조)
    function lanes(){
      const act = st.cu === 'hi' ? 1 : 0, LY = [182, 322, 462], LH = 132, mx0 = 1066, mx1 = 1214;
      const TX = [
        ['Ni 위 SnAg', st.cu === 'lo' ? '(Ni,Cu)₃Sn₄ — 각진 조각' : 'Ni₃Sn₄ — 각진 조각', 'Ni 3 : Sn 4', 'Cu 0.4 % 아래면 (Ni,Cu)₃Sn₄'],
        ['Ni 위 + 솔더 속 Cu', '(Cu,Ni)₆Sn₅ — 둥근 가리비', 'Cu 약 0.6 wt% 넘으면 연속층', 'Ni 소모는 줄어드는 경향'],
        ['Cu 위 (옆면 · Cu 패드)', 'Cu₆Sn₅ + 얇은 Cu₃Sn', '고온 뒤 Cu 쪽에 빈자리 줄', '(커켄달 보이드 → 07장)']
      ];
      let s = T(1064, 166, '솔더 속 Cu에 따라 IMC가 바뀐다', 't-acc', 'start');
      LY.forEach((y, i) => {
        s += R(1056, y, 488, LH, i === act ? 'pl-hlbox' : 'pl-lane', {rx: 10});
        let d = R(mx0, y + 12, mx1 - mx0, i === 2 ? 76 : 80, 'f-sn2');
        if (i === 0) d += R(mx0, y + 92, mx1 - mx0, 28, 'f-ni') + P(facet(K, mx0, mx1, y + 92, 15, 1, 41 + (st.cu === 'lo' ? 1 : 0)).d, st.cu === 'lo' ? TYPE.lo.cls : TYPE['0'].cls);
        if (i === 1) d += R(mx0, y + 92, mx1 - mx0, 28, 'f-ni') + P(scallop(K, mx0, mx1, y + 92, 17, 43, -1, 34, 14).d, TYPE.hi.cls);
        if (i === 2){
          d += R(mx0, y + 98, mx1 - mx0, 22, 'f-cu2') + R(mx0, y + 88, mx1 - mx0, 10, 'pl-imc3 rf05-c3s') + P(scallop(K, mx0, mx1, y + 88, 15, 45, -1, 34, 14).d, 'f-imc rf05-ie');
          for (let k = 0; k < 7; k++) d += C(mx0 + 12 + k * 21, y + 98, 3.2, 'f-void');
        }
        d += R(mx0, y + 12, mx1 - mx0, 108, 'rf05-frame');
        const tp = ['Ni 위 SnAg — Ni₃Sn₄ (각진 조각). Cu가 0.4 % 아래로 조금 섞이면 (Ni,Cu)₃Sn₄', 'Ni 위 + 솔더 속 Cu 약 0.6 wt% 넘음 — (Cu,Ni)₆Sn₅ (둥근 가리비)', 'Cu 위 — Cu₆Sn₅(가리비) 아래에 얇은 Cu₃Sn(진한 띠), 고온 뒤 Cu 쪽에 빈자리(커켄달 보이드) 줄'][i];
        s += G(d, tip(tp));
        s += T(1228, y + 30, TX[i][0], 'pl-hdg', 'start') + T(1228, y + 58, TX[i][1], 't-sub', 'start') + T(1228, y + 84, TX[i][2], 't-dim', 'start') + T(1228, y + 108, TX[i][3], 't-dim', 'start');
        if (i === act) s += T(1532, y + 30, '지금', 'rf05-now', 'end');
      });
      return s;
    }

    // ── 오른쪽 위 ④: 고체 상태 고온 시간 → IMC 두께 (150 °C 곡선 · 125 °C 점선 · 지금 점)
    function graph(m){
      let s = T(1064, 166, 'IMC 두께 — 고체 상태 고온 시간', 't-acc', 'start') + T(1064, 194, '150 °C 환산 · 이 칩 Ni 계면 · 위젯 값', 't-dim', 'start');
      for (let v = 1; v <= GR.vmax; v++) s += L(GR.x0, gy(v), GR.x1, gy(v), 'rf05-grid');
      s += L(GR.x0, GR.y0, GR.x1 + 8, GR.y0, 's-axis') + L(GR.x0, GR.y0, GR.x0, GR.y1 - 8, 's-axis');
      [0, 500, 1000, 1500, 2000].forEach(t => { s += L(gx(t), GR.y0, gx(t), GR.y0 + 7, 's-axis') + T(gx(t), GR.y0 + 28, t.toLocaleString('en-US'), 't-dim'); });
      for (let v = 0; v <= GR.vmax; v++) s += T(GR.x0 - 10, gy(v) + 7, v === GR.vmax ? '5 µm' : String(v), 't-dim', 'end');
      s += T(GR.x1, GR.y0 + 54, '시간 (h)', 't-dim', 'end');
      let c1 = '', c2 = '';
      for (let t = 0; t <= GR.tmax; t += 20){
        c1 += (c1 ? ' L' : 'M') + gx(t).toFixed(1) + ',' + gy(Math.sqrt(m.xl * m.xl + KS * t * m.f)).toFixed(1);
        c2 += (c2 ? ' L' : 'M') + gx(t).toFixed(1) + ',' + gy(Math.sqrt(m.xl * m.xl + KS * K125 * t * m.f)).toFixed(1);
      }
      s += G(P(c2, 's-curve2', tip('125 °C — 같은 시간에 덜 자란다 (속도 × 0.29, 가정)')) + P(c1, 's-curve', tip('150 °C — 두께² − 처음 두께² ∝ 시간')), {'clip-path': K.url('rf05-gc')});
      s += LB(L(1300, 432, 1336, 432, 's-curve') + T(1344, 439, '150 °C (지금 조건)', 't-dim', 'start') + L(1300, 458, 1336, 458, 's-curve2') + T(1344, 465, '125 °C', 't-dim', 'start'));
      s += C(gx(0), gy(m.xl), 6, 'k-acc', tip(`리플로우 뒤 출발점 ${f2(m.xl)} µm`));
      const px = gx(st.ht), py = gy(Math.min(m.x, GR.vmax + 0.1));                 // 축 위로 넘치면 맨 위에 붙인다
      s += C(px, py, 18, 'co-ring') + C(px, py, 9, 'k-acc2', tip(`지금: ${hrs(st.ht)} → ${f2(m.x)} µm`));
      s += LB(C(1072, 524, 8, 'k-acc2') + T(1088, 531, `지금: ${hrs(st.ht)} → ${f2(m.x)} µm`, 't-warn', 'start'));
      s += T(1064, 566, '두께² − 처음 두께² ∝ 시간', 't-sub', 'start') + T(1064, 594, '처음 IMC가 없을 때만 시간 4배 → 두께 2배', 't-dim', 'start');
      return s;
    }

    // ── 오른쪽 아래: Ni · Sn 예산 막대
    function budget(m){
      const nl = Math.max(0, m.niLeft), nu = Math.min(st.ni, m.niUsed);
      let s = T(1064, 666, 'Ni · Sn 예산 — 위젯 값 (예시)', 't-acc', 'start');
      s += T(BX0, 706, `Ni 방벽 (도금 ${f1(st.ni)} µm)`, 't-sub', 'start') + T(BX1, 706, m.niLeft <= 0 ? 'Ni 다 먹힘' : `IMC로 ${f2(nu)} µm`, m.niLeft < 0.5 ? 'pl-warn' : 't-warn', 'end');
      s += R(BX0, 720, BW, 40, 'rf05-bar0') + R(BX0, 720, nl * NIPX, 40, 'f-ni', tip(`남은 Ni ${f2(nl)} µm`)) + R(BX0 + nl * NIPX, 720, nu * NIPX, 40, 'rf05-used', tip(`IMC로 먹힌 Ni ${f2(nu)} µm`));
      if (nl * NIPX > 190) s += T(BX0 + 0.5 * NIPX + 10, 747, `남음 ${f2(nl)} µm`, 'rf05-bt', 'start');
      s += L(BX0 + 0.5 * NIPX, 712, BX0 + 0.5 * NIPX, 768, 'rf05-thr', tip('경고선: 남은 Ni 0.5 µm'));
      for (let v = 0; v <= 5; v++) s += L(BX0 + v * NIPX, 760, BX0 + v * NIPX, 767, 's-axis') + T(BX0 + v * NIPX, 790, v === 5 ? '5 µm' : String(v), 't-dim', v === 0 ? 'start' : v === 5 ? 'end' : 'middle');
      // 솔더 (도금 12 µm 원기둥 = 100 %)
      const rem = Math.max(0, 100 - m.snPct), wR = rem / 100 * BW, wL = m.snLo / 100 * BW, wU = m.snUp / 100 * BW;
      s += T(BX0, 836, 'Sn — 솔더 (도금 12 µm 원기둥 = 100 %)', 't-sub', 'start');
      s += R(BX0, 850, BW, 40, 'rf05-bar0') + R(BX0, 850, wR, 40, 'f-sn2', tip(`남은 솔더 ${pc(rem)}`)) + R(BX0 + wR, 850, wL, 40, 'f-imc', tip(`아래(이 칩 Ni) 계면 IMC로 간 Sn ${f1(m.snLo)} %`));
      if (m.two && wU > 0) s += R(BX0 + wR + wL, 850, wU, 40, 'pl-imc3', tip(`위(상대 패드) 계면 IMC로 간 Sn ${f1(m.snUp)} %`));
      if (wR > 150) s += T(BX0 + 10, 877, `Sn 남음 ${pc(rem)}`, 'rf05-bt', 'start');
      const xT = BX0 + 0.7 * BW;
      s += L(xT, 842, xT, 898, 'rf05-thr', tip('경고선: Sn 소모 30 %'));
      s += T(BX0, 918, '0', 't-dim', 'start') + T(BX0 + BW / 2, 918, '50 %', 't-dim') + T(BX1, 918, '100 %', 't-dim', 'end') + T(xT, 918, '30 % 소모', 'rf05-thrt');
      // 범례
      let lx = BX0;
      [['f-sn2', `남음 ${pc(rem)}`], ['f-imc', `아래 계면 ${pc(m.snLo)}`]].concat(m.two ? [['pl-imc3', `위 계면 ${pc(m.snUp)}`]] : []).forEach(([c, t]) => {
        s += R(lx, 936, 18, 18, c) + T(lx + 25, 952, t, 't-dim', 'start'); lx += 25 + tw(t, 19) + 14;   // 셋째 칸이 강조 테두리(x 1550) 안에
      });
      // 경고 줄
      const W2 = [];
      if (m.niLeft < 0.5) W2.push(['⚠ Ni < 0.5 µm — 더 가면 Cu까지 반응', 'rf05-ng']);
      if (m.snPct > 30) W2.push(['⚠ Sn 소모 > 30 % — 잘 깨질 수 있음', 'rf05-wn']);
      if (m.x > 3) W2.push(['⚠ IMC > 3 µm — 두꺼움', 'rf05-wn']);
      if (!W2.length) W2.push(['✓ 경고 없음 — Ni · 솔더 모두 여유', 'rf05-ok']);
      if (m.snPct > 15) W2.push([`예: Ag 2.5 % → 남은 솔더 ${f1(2.5 / (1 - m.snPct / 100))} % (06장)`, 't-dim']);
      W2.slice(0, 4).forEach(([t, c], k) => { s += T(BX0, 996 + k * 28, t, c, 'start'); });
      return s;
    }

    function render(){
      if (!ready) return;
      const sid = ctx.step() || lastSid;
      lastSid = sid;
      const m = calc(st);
      ctx.$('[data-v="head"]').innerHTML = head(sid, m);
      ctx.$('[data-v="sec"]').innerHTML = section(sid, m);
      ctx.$('[data-v="inset"]').innerHTML = inset(m);
      ctx.$('[data-v="lanes"]').innerHTML = lanes();
      ctx.$('[data-v="graph"]').innerHTML = graph(m);
      ctx.$('[data-v="bud"]').innerHTML = budget(m);
      // 결과 칸
      ctx.out('k-x', `${f2(m.x)} µm`); ctx.out('k-ni', `${f2(Math.min(st.ni, m.niUsed))} µm`);
      ctx.out('k-nil', m.niLeft <= 0 ? '0 µm (다 먹힘)' : `${f2(m.niLeft)} µm`);
      ctx.out('k-sn', pc(m.snPct)); ctx.out('k-t', m.ty.nm);
      mark('k-x', m.x > 3 ? 'warn' : 'ok'); mark('k-ni', m.niLeft < 0.5 ? 'ng' : 'ok'); mark('k-sn', m.snPct > 30 ? 'warn' : 'ok');
      let msg = `녹은 동안 <b>${f2(m.xl)} µm</b>`;
      msg += st.ht > 0 ? ` + 고온 시간 <b>${f2(m.x - m.xl)} µm</b> = <b>${f2(m.x)} µm</b>` : '';
      msg += ` (${m.ty.nm}). Ni ${f2(Math.min(st.ni, m.niUsed))} µm 먹힘 → 남은 Ni <b>${m.niLeft <= 0 ? '0 — 다 먹힘(더 가면 Cu까지 반응)' : f2(m.niLeft) + ' µm'}</b>. 솔더 Sn의 <b>${pc(m.snPct)}</b>가 IMC로`;
      msg += m.two && m.x2 > 0.005 ? `(위 계면 ${f2(m.x2)} µm 몫 ${pc(m.snUp)} 포함).` : '.';
      if (m.snPct > 15) msg += ` 남은 솔더의 Ag가 진해집니다(실효 Ag = Ag₀ ÷ (1 − 소모): 2.5 % → ${f1(2.5 / (1 - m.snPct / 100))} %) → <a data-go="solid.ag3sn">06장</a>.`;
      if (st.cu === 'hi') msg += ' Cu가 섞이면 IMC는 빨리 자라지만 Ni는 덜 먹는 경향이 보고됩니다.';
      if (m.two && st.n === 1) msg += ' (녹이는 횟수 1회 = 본딩에서는 녹지 않았다고 봅니다 — 위 계면은 고온 시간만큼만 자랍니다.)';
      ctx.q('[data-o=msg]').innerHTML = msg;
      ctx.refresh();
    }
    ['n', 'tl', 'ht', 'ni'].forEach(id => ctx.range(id, v => { st[id] = v; render(); return LBL[id](v); }));
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
        ['n', 'tl', 'ht', 'ni'].forEach(id => { const i = inp(id); if (i) i.value = st[id]; ctx.out(id, LBL[id](st[id])); });
        setSeg('cu', st.cu); setSeg('side', st.side);
      }
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['IMC (금속간 화합물)', '두 금속이 정해진 원자 비율로 결합한 결정. 솔더와 금속을 잇지만 단단하고 잘 깨진다'],
      ['Ni₃Sn₄', 'Ni 위 SnAg에서 자라는 IMC. Ni 3 : Sn 4, 각진 조각 모양'],
      ['(Cu,Ni)₆Sn₅', '솔더에 Cu가 섞이면 생기는 IMC. Cu₆Sn₅의 Cu 자리 일부를 Ni가 차지. 둥근 가리비 모양'],
      ['Cu₃Sn', 'Cu와 Cu₆Sn₅ 사이에 얇게 자라는 IMC. 고온에서 빈자리(커켄달 보이드)가 생기는 곳'],
      ['확산 지배 성장', '원자가 IMC 층을 건너는 빠르기가 성장 속도를 정하는 것 → 두께² − 처음 두께² ∝ 시간'],
      ['아레니우스', '반응 · 확산 속도가 온도에 따라 지수로 빨라지는 관계 (이 장의 가정으로는 150 °C 근처에서 10 °C마다 약 1.6배)'],
      ['커켄달 보이드', '두 원자의 확산 빠르기가 달라 한쪽에 빈자리가 모여 생긴 작은 구멍 줄'],
      ['열 이력', '웨이퍼가 겪은 모든 가열(리플로우 · 본딩 · 고온 공정 · 시험)의 온도 × 시간 기록']
    ]) + K.field([
      '<b>열 이력 표</b>를 만듭니다: 솔더가 녹는 일(웨이퍼 리플로우 · 재작업 · 적층 본딩 — 아래 다이일수록 여러 번)과 녹지 않는 고온(캐리어 본딩 · 뒷면 공정 · 고온 시험)을 나눠 적습니다. IMC · Ni 예산은 이 합으로 보고, 본딩 뒤에는 위 · 아래 두 계면을 함께 셉니다.',
      '단면에서 IMC 두께는 <b>평균</b>과 <b>가장 두꺼운 곳</b>을 함께 적습니다(조각 · 가리비 모양이라 한 점으로는 흔들립니다).',
      'Ni 두께 산포(도금)가 Ni 예산의 아래 끝을 정합니다. <b>가장 얇은 Ni</b>(웨이퍼 가장자리 · 패턴 차이)가 모든 열 이력 뒤에도 남아야 합니다 → <a href="#go-plating-07">전해도금 7장</a>(분포) · <a href="#go-plating-10">10장</a>(Ni 방벽).',
      'IMC 종류가 (Cu,Ni)₆Sn₅로 바뀌어 있으면 Cu가 어디서 왔는지(옆면 흘러내림 · Ni 결함 · 상대 Cu 패드)를 먼저 찾습니다 → <a data-go="wet.edge">04장</a>.',
      'IMC · Ni 예산을 정하는 손잡이를 나눠 봅니다: <span class="pl-tag up">앞 공정</span> Ni 도금 두께 · 산포, 솔더 부피 · <span class="pl-tag rf05-cond">리플로우-조건</span> 액상선 위 시간 · 최고 온도 · 재작업 횟수(<a data-go="profile.tal">02장</a>) · <span class="pl-tag dn">뒤 공정</span> 적층 본딩 횟수 · 고온 공정 · 신뢰성 시험.'
    ]) + K.deep(`${K.eq('녹은 동안: x³ = n · k_l · t_l')}${K.eq('굳은 뒤: x² = x_l² + k_s · t')}
      <ul><li><b>소모 비율 (계산)</b> — Ni₃Sn₄ 밀도 약 8.65 g/cm³(격자 상수로 계산해도 같음), 몰 부피 약 75.3 cm³/mol(식 단위) → 1 µm Ni₃Sn₄ = Ni 0.26 µm + Sn 0.87 µm(반응 전 부피 합 1.13 µm → 약 11 % 줄어듦). Cu₆Sn₅(약 8.3 g/cm³) → Cu 0.36 µm + Sn 0.69 µm. 일부 문헌의 Cu₃Sn 밀도 11.3 g/cm³은 격자 계산(약 9.0 g/cm³)과 맞지 않아 쓰지 않습니다.</li>
      <li><b>녹은 상태 성장</b> — 순수 Sn · Sn-2Ag가 전해 Ni와 250 °C에서 1분 닿으면 각진 Ni₃Sn₄가 평균 약 1.35~3.6 µm 생긴다는 보고가 있습니다(Ni 종류 · 솔더 양 · 측정법에 따라 크게 흩어집니다. 위젯은 낮은 쪽인 1 µm를 씁니다). Sn-3.5Ag에서는 활성화 에너지가 전해 Ni 25 kJ/mol · 무전해 Ni(P) 38 kJ/mol로 보고되었고, 같은 조건에서 전해 Ni 위 IMC가 더 느리게 자랐으며 240 °C 20분 뒤에도 계면 미세 보이드가 없었다는 보고가 있습니다. 시간 지수는 약 1/3(결정 커짐 · 녹아 나감과 겹침)이 흔히 보고됩니다.</li>
      <li><b>굳은 상태 성장</b> — x² = x₀² + k·t, k = k₀·exp(−Q/RT). Sn-3.5Ag/Ni 150~200 °C 보관에서 지수 약 0.5(확산 지배)가 보고되었지만, Q는 연구마다 16~172 kJ/mol로 넓게 흩어집니다(시편 · Ni 종류 · 솔더 양). Q 70 kJ/mol이면 150 °C 근처에서 10 °C마다 약 1.6배 빨라지고, 125 °C는 150 °C의 약 0.29배입니다(위젯 점선).</li>
      <li><b>Cu 임계</b> — 솔더 Cu가 약 0.4 wt% 아래면 (Ni,Cu)₃Sn₄ 연속층, 약 0.6 wt% 넘으면 (Cu,Ni)₆Sn₅ 연속층이 생긴다는 보고가 있습니다. (Cu,Ni)₆Sn₅ 층이 생기면 Ni 소모가 줄어드는 경향이 있지만, 성장 · 계면 모양 · 떨어져 나감(스폴링) 거동이 달라집니다.</li>
      <li><b>마이크로범프의 솔더 소진</b> — Ni/Sn-2.5Ag/Ni 마이크로범프를 150 °C에 오래 두면 솔더가 모두 Ni₃Sn₄로 바뀌었다는 보고가 있습니다(포물선 법칙, 그 시편 Q 약 172 kJ/mol). 이 시편은 <b>위 · 아래 두 Ni 계면</b>에서 동시에 먹는 구조라, 계면 하나로 계산하면 위험을 절반으로 봅니다(위젯: 8회 + 1,000 h → 계면 1개 약 20 %, 2개 약 39 %). 상대가 Cu 패드면 그쪽에 Cu₆Sn₅ + Cu₃Sn이 더 빨리 자라고 커켄달 보이드도 생길 수 있습니다. 접합이 IMC로만 이어지면 녹는점은 높아지지만 단단하고 잘 깨집니다.</li>
      <li><b>Ag의 행방</b> — Ag는 Ni–Sn IMC에 거의 들어가지 않고 솔더 속 Ag₃Sn으로 남습니다. Sn이 IMC로 빠지면 남은 솔더의 Ag 농도가 높아져(실효 Ag = Ag₀ ÷ (1 − 소모)), 처음 2.5 %였어도 큰 Ag₃Sn 판이 생길 수 있습니다(<a data-go="solid.ag3sn">06장</a>).</li>
      <li><b>커켄달은 Cu 쪽</b> — Cu/Cu₃Sn에서 Cu가 Sn보다 빨리 빠져나가 빈자리가 모이고, 도금 Cu 속 S(촉진제 유래)가 이를 키웁니다(<a href="#go-plating-06">전해도금 6장</a>). Ni 방벽 범프에서는 Ni가 없는 Cu 옆면 · 상대 Cu 패드 쪽 이야기입니다(<a data-go="void.where">07장</a>).</li></ul>`);
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
.pl-svg .rf05-sna{fill:#f8fafc;stroke:#334155;stroke-width:1.8}
.pl-svg .rf05-used{fill:rgba(239,68,68,.45);stroke:#f87171;stroke-width:1}
.pl-svg .rf05-bar0{fill:rgba(15,23,42,.6);stroke:rgba(148,163,184,.35);stroke-width:1}
.pl-svg .rf05-thr{stroke:#f87171;stroke-width:2.4;stroke-dasharray:5 4}
.pl-svg .rf05-grid{stroke:rgba(143,166,198,.16);stroke-width:1}
.pl-svg .rf05-thrt{font-size:18px;font-weight:700;fill:#fca5a5 !important;text-anchor:middle}
.pl-svg .rf05-bt{font-size:18px;font-weight:800;fill:#0b1222 !important;stroke:none !important}
.pl-svg .rf05-snt{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .rf05-ng{font-size:20px;font-weight:800;fill:#fca5a5 !important}
.pl-svg .rf05-wn{font-size:20px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .rf05-ok{font-size:20px;font-weight:800;fill:#86efac !important}
.pl-svg .rf05-now{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.jc .pl-tag.rf05-cond{background:rgba(45,212,191,.18);color:#5eead4}`
});
})();
