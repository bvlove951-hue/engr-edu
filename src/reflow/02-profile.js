/* 리플로우 02 — 온도 프로파일: 몇 도까지, 얼마 동안 올렸다 내려야 할까? (웨이퍼 · 분) */
(function(){
// ── 개념 모델 (기획 rev.2 · 5절)
//  설정 온도 S(t): 25 °C → 승온 r_u → 예열 170 °C(고정) t_s 동안 → 승온 r_u → 최고 설정 T_set t_p 동안 → 냉각 r_c
//  웨이퍼 온도: dT/dt = (S − T)/τ (1차 지연, dt 0.25 s).  TAL = 221 °C 위 시간 · 예열 창 = 150~200 °C (최고 설정에 닿기 전)
//  IMC x = (Σ k(T)·dt)^(1/3), k = (1/60)·exp[−(25000/8.314)(1/(T+273.15) − 1/523.15)] µm³/s, T ≥ 221 °C (05장과 같은 예시 상수)
//  검산(기본): 최고 255.0 °C · TAL 64 s(224 °C 위 61 s) · 예열 창 115 s · IMC 1.01 µm · 시간 축 끝 약 328 s
const TS = 170, DT = 0.25, TE = 221, TL = 224;                      // 예열 온도 · 계산 간격 · 공정점(共晶) · 액상선(Ag 2.5 % 예시)
const DEF = {ts: 90, pk: 255, tp: 30, rc: 2, ru: 2, tau: 5};
// 발표 모드 · 손대기 전 단계마다 보여 줄 값 (기본값 + 적힌 값만 덮어씀)
const DEMO = {ramp: {tau: 20}, soak: {}, tal: {}, peak: {pk: 232}, cool: {rc: 0.5}};
const kI = T => Math.exp(-(25000 / 8.314) * (1 / (T + 273.15) - 1 / 523.15)) / 60;
// 06장 모델 (Ag 2.5 % · 지름 25 µm): 과냉 ΔT = 15 + 12·log(500/D) + 8·log(r), 굳기 시작 T_N = 224 − ΔT,
//   Ag₃Sn이 생길 수 있는 온도 T_A = 221 + 15.6 × (2.5 − 3.5) = 205.4 °C, 판이 자랄 수 있는 길이 L = min(0.9·D, 1 µm/s × (T_A − T_N)/r)
function solid(r){
  const dU = Math.max(5, Math.min(80, 15 + 12 * Math.log10(500 / 25) + 8 * Math.log10(r)));
  const tn = TL - dU, w = Math.max(0, 221 + 15.6 * (2.5 - 3.5) - tn);
  return {dU, tn, L: Math.min(22.5, w / r)};
}
function sim(p){
  const {ts, pk, tp, rc, ru, tau} = p;
  const t1 = (TS - 25) / ru, t2 = t1 + ts, t3 = t2 + (pk - TS) / ru, t4 = t3 + tp;
  const S = t => t < t1 ? 25 + ru * t : t < t2 ? TS : t < t3 ? TS + ru * (t - t2) : t < t4 ? pk : Math.max(25, pk - rc * (t - t4));
  const so = solid(rc);
  const r = {t1, t2, t3, t4, tal: 0, t224: 0, sk: 0, Tmax: 25, tmax: 0, tin: null, tout: null, w0: null, w1: null, tN: null, so, pts: [[0, 25, 25]]};
  let T = 25, t = 0, x3 = 0, k = 0;
  while (t < 1000 - 1e-9){
    const Tn = T + (S(t) - T) / tau * DT;
    T = Tn; t += DT; k++;
    if (T >= TE){ r.tal += DT; x3 += kI(T) * DT; if (r.tin == null) r.tin = t; r.tout = t; }
    if (T >= TL) r.t224 += DT;
    if (t < t3 && T >= 150 && T <= 200){ r.sk += DT; if (r.w0 == null) r.w0 = t; r.w1 = t; }
    if (T > r.Tmax){ r.Tmax = T; r.tmax = t; }
    if (r.tN == null && r.tout != null && t > t4 && T <= so.tn) r.tN = t;
    const end = t > t4 && T < 100;
    if (k % 4 === 0 || end) r.pts.push([t, S(t), T]);                  // 1초마다 기록 (끝점 포함)
    if (end) break;
  }
  r.t100 = t;
  r.tend = Math.min(1000, t + 10);                                      // 최고점 뒤 100 °C 아래 + 10 s (최대 1,000 s)
  r.imc = Math.cbrt(x3);
  return r;
}
// 시간 t의 웨이퍼 · 설정 온도 (1초 기록에서 직선 보간)
function at(r, t){
  const P = r.pts;
  for (let i = 1; i < P.length; i++) if (P[i][0] >= t){ const a = P[i - 1], b = P[i], f = (t - a[0]) / Math.max(1e-9, b[0] - a[0]); return [a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  const z = P[P.length - 1]; return [z[1], z[2]];
}
// 판정 (개념 예시) — [수준 0 ok · 1 warn · 2 ng, 이름, 까닭]
function judge(r){
  const pk = r.Tmax, tal = Math.round(r.tal);
  let P, Q;
  if (pk < TE) P = [2, '안 녹음', '웨이퍼가 221 °C(공정점(共晶))에 닿지 못해 솔더가 녹지 않습니다'];
  else if (pk < TL) P = [2, '다 녹지 않음', 'Ag 2.5 % 액상선(224 °C) 아래 — 고체 Sn이 남습니다'];
  else if (pk < 231) P = [2, '여유 부족', '최고가 액상선 + 7 °C 미만 — 가장자리 · 차가운 곳은 비용융 위험'];
  else if (pk < 239) P = [1, '여유 적음', '최고가 액상선 + 15 °C 미만 — 가장자리 · 휜 웨이퍼는 덜 녹을 수 있음, 가장 차가운 곳을 재 볼 것'];
  else if (pk <= 265) P = [0, '', '최고 온도 여유 충분 (액상선 + 15 °C 이상, 265 °C 이하)'];
  else P = [1, '온도 높음', '최고가 265 °C 넘음 — IMC · 산화 · 플럭스 탄화 · 휨 부담↑'];
  if (pk < TE) Q = [2, '', ''];
  else if (tal < 20) Q = [2, '너무 짧음', '221 °C 위 20초 미만 — 덜 둥긂 · 보이드'];
  else if (tal < 30) Q = [1, '짧은 편', '221 °C 위 20~30초 — 둥글어짐 · 기포 빠짐이 빠듯'];
  else if (tal <= 90) Q = [0, '보통 범위', '221 °C 위 30~90초 — 보통 범위'];
  else Q = [1, '녹은 시간 김', '221 °C 위 90초 넘음 — IMC · 산화 · 플럭스 탄화 · 흘러내림↑'];
  const lv = Math.max(P[0], Q[0]);
  let word = P[0] > Q[0] ? P[1] : Q[0] > P[0] ? Q[1] : (P[0] && P[1] && Q[1] ? P[1] + ' · ' + Q[1] : (P[1] || Q[1]));
  if (!word) word = '보통 범위';
  return {lv, word, P, Q};
}
// 무대 배치
const GX0 = 130, GX1 = 1100, yT = T => 780 - 2 * T;                   // 그래프: 온도 0~300 °C → y 780~180
const BY = 832, BW = 182, BX = k => 130 + k * 197;                     // 작은 범프 줄
const PX = 1164;                                                       // 오른쪽 패널 글 시작 x
const L221 = 340;                                                      // 왼쪽 '221 °C — 녹기 시작' 글이 끝나는 x (어림)
const SID = ['ramp', 'soak', 'tal', 'peak', 'cool'];
const VN = {x: 36, y: 118, w: 1090, h: 990};                           // 좁은 세로 화면: 그래프 + 작은 범프 줄 (판정은 카드의 결과 칸에)
// 오른쪽 패널: 단계별 '이 구간의 일 · 모자라면 · 지나치면' (기획 장면 배치)
const PAN = {
  ramp: ['① 승온 — 천천히 올리기', '보통 초당 1~3 °C (예시)', [['pl-hdg', '이 구간의 일', '용제를 천천히 날리고 웨이퍼 전체를 고르게 데운다'], ['pl-hdg2', '너무 느리면', '시간이 늘고 산화가 자랄 틈이 생긴다 · 처리량↓'], ['pl-hdg2', '너무 빠르면', '용제가 끓어 튐 · 솔더 볼, 가운데–가장자리 온도 차↑']]],
  soak: ['② 예열 — 고르게, 표면 준비', '보통 150~200 °C (녹는점 아래)', [['pl-hdg', '이 구간의 일', '웨이퍼 온도를 맞추고, 플럭스 · 포름산이 산화막과 반응하기 시작'], ['pl-hdg2', '모자라면', '용제 · 기체가 남아 녹은 뒤 튐 · 보이드, 산화막 덜 걷힘'], ['pl-hdg2', '지나치면', '플럭스가 지침 · 산소가 있으면 산화가 자람']]],
  tal: ['③ 녹임 — 액상선 위 시간', '보통 30~90초 (221 °C 위로 셈)', [['pl-hdg', '이 구간의 일', '둥글어짐 · 젖음 · 기포 빠짐 · IMC 자람이 함께 일어난다'], ['pl-hdg2', '짧으면', '덜 둥긂 · 보이드가 남음'], ['pl-hdg2', '길면', 'IMC 두꺼움 · 옆면 흘러내림 · 산화']]],
  peak: ['④ 최고 온도 — 여유와 상한', '보통 240~260 °C (액상선 + 20~40 °C)', [['pl-hdg', '이 구간의 일', '웨이퍼에서 가장 차가운 곳까지 다 녹이기'], ['pl-hdg2', '낮으면', '가장자리 · 휜 곳이 덜 녹음 (비용융 고리)'], ['pl-hdg2', '높으면', 'IMC · 산화 · 플럭스 탄화 · 휨 · 보호막 부담']]],
  cool: ['⑤ 냉각 — 굳는 빠르기', '예: 2 °C/초 (J-STD-020 상한 6 °C/초)', [['pl-hdg', '이 구간의 일', '굳히기 — 솔더 속 구조(결정 · Ag₃Sn)가 정해진다'], ['pl-hdg2', '너무 느리면', '큰 Ag₃Sn 판 · 녹아 있는 시간↑'], ['pl-hdg2', '너무 빠르면', '열 충격 · 휨 변화']]]
};
// 구형 모자: 가운데 cx, 바닥선 y0, 바닥 반폭 a(px), 높이 h(px)
const cap = (cx, y0, a, h) => { const R = (a * a + h * h) / (2 * h); return `M${cx - a},${y0} A${R.toFixed(1)},${R.toFixed(1)} 0 ${h > a ? 1 : 0} 1 ${cx + a},${y0} Z`; };
const f1 = v => v.toFixed(1), f0 = v => String(Math.round(v));

(window.EngrReflowChapters = window.EngrReflowChapters || []).push({
  no: '02', id: 'profile', part: 1, short: '온도 프로파일', scale: '웨이퍼 · 분',
  title: '온도 프로파일 — 몇 도까지, 얼마 동안 올렸다 내려야 할까?',
  hook: '언제 · 몇 도 · 얼마 동안',
  one: '리플로우는 온도를 시간에 따라 그린 곡선(프로파일)으로 관리합니다. 천천히 올리고(승온), 고르게 데우고(예열), 녹는점 위에 알맞게 머물고(액상선 위 시간 · 최고 온도), 정해진 빠르기로 식힙니다(냉각). 구간마다 하는 일이 다릅니다.',
  ana: '<b>빵 굽기</b> — 오븐을 예열해 속까지 고르게 데우고, 정해진 온도 · 시간만큼 굽고(덜 구우면 설익고 오래 구우면 딱딱해짐), 꺼낸 뒤 식히는 빠르기가 속결을 바꿉니다. <i>(비유의 한계: 빵은 온도에 따라 서서히 익지만 솔더는 액상선(약 224 °C)이라는 문턱이 뚜렷해, 그 아래에서는 아무리 오래 데워도 다 녹지 않습니다. 또 웨이퍼 온도는 장비 설정 온도를 늦게 따라가므로, 설정값이 아니라 웨이퍼에서 잰 곡선을 봐야 합니다.)</i>',
  steps: [
    {id: 'ramp', t: '승온 — 천천히 올리기', d: '처음에는 보통 초당 1~3 °C로 올립니다. 너무 빠르면 플럭스(산화막을 녹이는 약품, <a data-go="oxide.flux">03장</a>) 속 용제가 끓어 솔더가 튀거나 웨이퍼 안 온도 차가 커집니다. 웨이퍼 온도는 장비 설정 온도를 늦게 따라갑니다(열 지연).', viewN: VN},
    {id: 'soak', t: '예열 — 고르게, 표면 준비', d: '녹는점 아래(보통 150~200 °C)에서 잠시 머물러 웨이퍼 전체 온도를 맞춥니다. 이 구간에서 용제가 날아가고 플럭스 · 포름산(산화막을 걷는 약품 · 기체, <a data-go="oxide.formic">03장</a>)이 산화막과 반응하기 시작합니다. 너무 길면 플럭스가 지치고, 산소가 있으면 산화가 자랍니다.', viewN: VN},
    {id: 'tal', t: '녹임 — 액상선 위 시간', d: '솔더가 녹아 있는 시간(이 탭은 221 °C 위 시간으로 셈)에 둥글어지기 · 젖음 · 기포 빠지기 · IMC 성장이 함께 일어납니다. 보통 30~90초 정도로 잡습니다. 짧으면 덜 둥글고 기포가 남고, 길면 IMC가 두꺼워지고 옆면으로 흘러내리기 쉽습니다.', viewN: VN},
    {id: 'peak', t: '최고 온도 — 여유와 상한', d: '최고 온도는 보통 액상선보다 20~40 °C 높게(SnAg 범프 약 240~260 °C) 잡습니다. 웨이퍼에서 가장 차가운 곳도 충분히 녹아야 하고, 가장 뜨거운 곳은 IMC · 산화 · 플럭스 탄화가 지나치지 않아야 합니다.', viewN: VN},
    {id: 'cool', t: '냉각 — 굳는 빠르기', d: '식히는 빠르기가 굳은 솔더의 속(결정 크기 · 판 모양 화합물, <a data-go="solid.rate">06장</a>)을 바꿉니다. 너무 느리면 녹아 있는 시간도 길어지고 판이 자랄 시간이 늘며, 너무 빠르면 웨이퍼 휨 · 열 충격이 커질 수 있습니다. 실제로 굳는 온도는 221 °C보다 수십 °C 낮습니다.', viewN: VN}
  ],
  icon(K){
    const {P, L} = K;
    return P('M6,58 L22,40 L36,38 L46,14 L54,22 L62,58', 's-curve') + L(6, 24, 62, 24, 's-dash');
  },
  draw(K){
    const {R, L, T, G, LB, TT, tip, only, W, wrap} = K;
    let s = '';
    // ── 그래프 판과 축
    s += R(40, 120, 1080, 698, 'pl-panel', {rx: 16});
    s += `<clipPath id="${K.id('rf02-clip')}"><rect x="${GX0}" y="176" width="${GX1 - GX0 + 2}" height="606"/></clipPath>`;
    s += `<g data-v="bands"></g>`;                                                      // 구간 띠 · 단계 강조 (위젯이 그린다)
    for (let v = 50; v <= 300; v += 50) s += L(GX0, yT(v), GX1, yT(v), 's-faint') + T(GX0 - 8, yT(v) + 7, String(v), 't-dim', 'end');
    s += LB(T(GX0 - 8, 160, '온도 (°C)', 't-dim', 'end') + T(GX0 - 18, 806, '시간 (초)', 't-dim', 'end'));
    s += `<g data-v="win"></g>`;                                                        // 예열 창 띠
    s += G(L(GX0, yT(TE), GX1, yT(TE), 's-dash') + T(GX0 - 8, yT(TE) + 7, '221', 'rf02-tw', 'end'), tip('221 °C — Sn–Ag 공정점(共晶). 솔더가 녹기 시작하는 온도.\nAg 2.5 % 솔더는 약 224 °C(액상선)에서 다 녹는다 (전해도금 10장)'));
    s += `<g data-v="xax"></g><g data-v="curves" clip-path="${K.url('rf02-clip')}"></g><g data-v="ann"></g>`;
    s += L(GX0, 780, GX1 + 6, 780, 's-axis') + L(GX0, 780, GX0, 172, 's-axis');
    // 범례 (그래프 오른쪽 아래 — 곡선은 100 °C에서 끝나 이 자리는 늘 비어 있다)
    s += G(L(800, 684, 852, 684, 's-curve2') + T(864, 691, '설정 온도 (장비)', 't-dim', 'start'), tip('장비 설정 온도 — 가열판 · 오븐이 맞추려는 값'));
    s += G(L(800, 714, 852, 714, 's-curve') + T(864, 721, '웨이퍼 온도 (잰 값)', 't-dim', 'start'), tip('웨이퍼에서 잰 온도 — 설정을 열 지연 τ만큼 늦게 따라간다'));
    // ── 작은 범프 줄 (위젯이 그린다)
    s += `<g data-v="bumps"></g>`;
    // ── 오른쪽 패널: 단계별 설명 + 지금 값 + 판정
    s += R(1140, 120, 420, 978, 'pl-panel', {rx: 16});
    SID.forEach(id => {
      const [h, sub, secs] = PAN[id];
      let g = T(PX, 162, h, 't-acc', 'start') + T(PX, 192, sub, 't-dim', 'start');
      let y = 236;
      secs.forEach(([c, hd, tx]) => {
        const ln = wrap(tx, 17);
        g += T(PX, y, hd, c, 'start') + TT(PX, y + 30, ln, 't-sub', 'start', 26);
        y += 30 + ln.length * 26 + 20;
      });
      s += G(LB(g), only(id));
    });
    s += LB(T(PX, 574, '지금 (직접 해 보기 값)', 'pl-hdg3', 'start'));
    s += `<g data-v="now"></g>`;
    s += R(1156, 664, 388, 422, 'pl-box', {rx: 12}) + LB(T(1176, 698, '판정 (개념 예시)', 'pl-hdg', 'start'));
    s += `<g data-v="verdict"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 프로파일 그려 보기</div>
      ${K.ctl('ts', '예열 시간 (초)', 0, 180, 5, DEF.ts)}${K.ctl('pk', '최고 설정 온도 (°C)', 225, 285, 1, DEF.pk)}${K.ctl('tp', '최고 온도에 머무는 시간 (초)', 0, 120, 5, DEF.tp)}${K.ctl('rc', '냉각 속도 (°C/초)', 0.5, 6, 0.5, DEF.rc)}
      ${K.seg('ru', [['1', '1'], ['2', '2'], ['4', '4 °C/초']], String(DEF.ru), '승온 속도')}
      ${K.seg('tau', [['5', '판 · 전도 (τ 5초)'], ['20', '대류 (τ 20초)']], String(DEF.tau), '웨이퍼 열 지연')}
      ${K.kpis([['최고 온도', 'k-pk', '웨이퍼 실제 °C (여유 = 최고 − 224)'], ['액상선 위 시간 (TAL)', 'k-tal', '221 °C 위, 초 (224 °C 위는 몇 초 짧음)'], ['예열 창', 'k-sk', '150~200 °C, 초'], ['IMC (예시)', 'k-imc', 'µm, 05장 모델']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('웨이퍼 온도 = 설정 온도를 1차 지연 τ로 따라가는 개념 모델입니다(예열 170 °C 고정). 판정 경계(액상선 + 7 · 15 °C, 30~90초, 265 °C)는 공개 자료 범위를 바탕으로 한 예시이고, 실제 창은 솔더 · 분위기 · 장비마다 다릅니다. IMC는 05장의 예시 상수(250 °C 60초 → 약 1 µm), 굳기 시작 온도 · Ag₃Sn 판은 06장 모델(Ag 2.5 % · 지름 25 µm)입니다. J-STD-020 프로파일은 부품 분류용 표준이라 웨이퍼 범프에 그대로 쓰지 않습니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, TT, tip, only, W, wrap} = K;
    const st = Object.assign({}, DEF);
    let touched = false, ready = false;
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const OUT = {ts: v => v + ' 초', pk: v => v + ' °C', tp: v => v + ' 초', rc: v => v.toFixed(1) + ' °C/초'};
    function render(){
      const r = sim(st), te = r.tend, X = t => GX0 + t / te * (GX1 - GX0), J = judge(r);
      const melted = r.tin != null, tal = Math.round(r.tal), imc = r.imc, m = r.Tmax - TL;
      const imT = melted ? `약 ${imc.toFixed(2)} µm` : '없음 (안 녹음)';
      // ── 시간 축 눈금 (자동: 480 s까지 60 s, 960 s까지 120 s, 그 위 200 s)
      const stp = te <= 180 ? 30 : te <= 480 ? 60 : te <= 960 ? 120 : 200;
      let xa = '';
      for (let t = 0; t <= te + 1e-6; t += stp) xa += L(X(t), 780, X(t), 788, 's-axis') + T(X(t), 806, String(t), 't-dim');
      ctx.$('[data-v="xax"]').innerHTML = LB(xa);
      // ── 구간 띠 + 이름 + 단계 강조 상자
      const band = (a, b, c, nm, tp) => {
        if (b - a <= 0.01) return '';
        const x0 = X(a), x1 = X(b);
        return G(R(x0, 180, x1 - x0, 600, c), tip(tp)) + (x1 - x0 >= 46 ? LB(T((x0 + x1) / 2, 768, nm, 'rf02-bt')) : '');
      };
      const tin = melted ? r.tin : r.t4, tout = melted ? r.tout : r.t4;
      let bd = band(0, r.t1, 'pl-z0', '승온', '승온 — 설정 온도를 일정한 속도로 올린다');
      bd += band(r.t1, r.t2, 'pl-z1', '예열', '예열 — 170 °C(예시)에 머물러 웨이퍼 온도를 맞춘다');
      bd += band(r.t2, tin, 'pl-z0', '승온', '다시 승온 — 최고 설정 온도까지');
      if (melted) bd += band(r.tin, r.tout, 'pl-z2', '녹임', `녹임 — 웨이퍼가 221 °C 위에 있는 ${tal}초 (액상선 위 시간)`);
      bd += band(tout, te, 'pl-z3', '냉각', '냉각 — 굳는 빠르기가 솔더 속을 정한다');
      const hl = (a, b, id) => { const x0 = X(a), x1 = Math.max(X(a) + 8, X(b)); return R(x0, 178, x1 - x0, 604, 'pl-hlbox', W({rx: 8}, only(id))); };
      bd += hl(0, r.t1, 'ramp') + hl(r.t2, Math.max(r.t2 + 1, melted ? r.tin : r.t3), 'ramp') + hl(r.t1, r.t2, 'soak');
      if (melted) bd += hl(r.tin, r.tout, 'tal');
      bd += hl(Math.min(r.t3, r.tmax - 4), Math.max(r.t4, r.tmax + 4), 'peak') + hl(r.t4, te, 'cool');
      ctx.$('[data-v="bands"]').innerHTML = bd;
      // ── 예열 창 (150~200 °C) — 예열 단계에서 강조
      let wn = R(GX0, yT(200), GX1 - GX0, yT(150) - yT(200), 'rf02-win', tip('150~200 °C 예열 창 — 녹기 전에 온도를 맞추고 표면을 준비하는 온도 범위 (예시)'));
      wn += R(GX0, yT(200), GX1 - GX0, yT(150) - yT(200), 'rf02-win2', only('soak'));
      // 고정 글은 곡선이 지나지 않는 자리에: 보통 왼쪽, 곡선이 지나가면(예열 0 · 빠른 승온 · 긴 냉각 등) 오른쪽 끝
      const segs = r.pts.map(([t, sv, tv]) => [X(t), tv, t > r.t4 && sv < 100 ? null : sv]);
      const clear = (x0, x1, lo, hi) => !segs.some(([x, tv, sv]) => x >= x0 - 8 && x <= x1 + 8 && ((tv >= lo && tv <= hi) || (sv != null && sv >= lo && sv <= hi)));
      const side = (w, lo, hi) => clear(GX0 + 10, GX0 + 10 + w, lo, hi) || !clear(GX1 - 8 - w, GX1 - 8, lo, hi);   // true = 왼쪽
      const wl = side(180, 182, 197);
      wn += LB(T(wl ? GX0 + 10 : GX1 - 8, yT(200) + 30, '150~200 °C 예열 창', 't-dim', wl ? 'start' : 'end'));
      const left = side(L221 - GX0, 223, 247), lx2 = left ? GX0 + 10 : GX1 - 8, la = left ? 'start' : 'end';
      wn += LB(T(lx2, yT(TE) - 32, '221 °C — 녹기 시작', 't-warn', la) + T(lx2, yT(TE) - 8, '(Sn–Ag 공정점(共晶))', 't-dim', la));
      ctx.$('[data-v="win"]').innerHTML = wn;
      // ── 곡선 (축 상자로 자름). 설정 곡선도 냉각에서는 100 °C까지만
      let ds = '', dw = '';
      r.pts.forEach(([t, sv, tv], i) => {
        if (!(t > r.t4 && sv < 100)) ds += (ds ? ' L' : 'M') + X(t).toFixed(1) + ',' + yT(sv).toFixed(1);
        dw += (i ? ' L' : 'M') + X(t).toFixed(1) + ',' + yT(tv).toFixed(1);
      });
      let cv = P(ds, 's-curve2', tip('장비 설정 온도'));
      // 냉각 단계: 221 °C 아래에서도 아직 액체(과냉)인 구간을 곡선 위에 굵게
      if (melted && r.tN != null){
        let dsu = '';
        r.pts.forEach(([t, , tv]) => { if (t >= r.tout && t <= r.tN + 0.5) dsu += (dsu ? ' L' : 'M') + X(t).toFixed(1) + ',' + yT(tv).toFixed(1); });
        if (dsu) cv += P(dsu, 'rf02-sup', W(only('cool'), tip(`아직 액체 — 과냉 (221 °C 아래에서도 약 ${f0(r.so.tn)} °C까지 굳지 않는다, 06장)`)));
      }
      cv += P(dw, 's-curve', tip('웨이퍼에서 잰 온도 — 설정을 열 지연 τ만큼 늦게 따라간다'));
      cv += `<circle r="9" class="k-acc2"><animateMotion dur="9s" repeatCount="indefinite" path="${dw}"/></circle>`;
      ctx.$('[data-v="curves"]').innerHTML = cv;
      // ── 단계별 표시
      let an = '';
      // 승온: 설정과 웨이퍼 사이의 열 지연 (세로 괄호)
      {
        const ta = Math.max(4, Math.round(0.6 * r.t1)), [sa, wa] = at(r, ta), xq = X(ta), gap = sa - wa;
        let g = L(xq, yT(sa), xq, yT(wa), 'rf02-lag') + L(xq - 7, yT(sa), xq + 7, yT(sa), 'rf02-lag') + L(xq - 7, yT(wa), xq + 7, yT(wa), 'rf02-lag');
        const ly = Math.min(676, yT(wa) + 34), lx = Math.max(xq + 16, X(r.t1) + 12);
        g += LB(T(lx, ly, `열 지연 — 웨이퍼가 약 ${f0(gap)} °C 늦다`, 't-warn', 'start') + T(lx, ly + 26, `(꾸준히 오르면 승온 ${st.ru} °C/초 × τ ${st.tau}초 = ${st.ru * st.tau} °C)`, 't-dim', 'start'));
        an += G(g, W(only('ramp'), tip('열 지연 — 웨이퍼는 열을 받아 데워지는 데 시간이 걸려 설정 온도를 늦게 따라간다.\nτ = 웨이퍼 열용량 ÷ 열 전달 (판 · 전도는 작고, 대류는 크다)')));
      }
      // 예열: 150~200 °C에 머문 시간 (가로 괄호)
      if (r.w0 != null){
        const x0 = X(r.w0), x1 = Math.max(X(r.w0) + 6, X(r.w1)), y = yT(150) + 14;
        let g = P(`M${x0.toFixed(1)},${y - 8} L${x0.toFixed(1)},${y} L${x1.toFixed(1)},${y} L${x1.toFixed(1)},${y - 8}`, 'rf02-brk');
        const lt = `예열 창 ${f0(r.sk)}초 (150~200 °C)`, lw = 230;
        if (x1 - x0 >= lw - 20){ const cx = Math.max(GX0 + 8 + lw / 2, Math.min(GX1 - 8 - lw / 2, (x0 + x1) / 2)); g += LB(T(cx, y + 28, lt, 't-warn')); }
        else g += LB(T(x1 + 14, y + 6, lt, 't-warn', 'start'));                      // 괄호가 좁으면 오른쪽 옆에
        an += G(g, only('soak'));
      }
      // 녹임: 221 °C 위 시간 (선 바로 아래 가로 괄호 — 이 자리엔 곡선이 지나지 않는다)
      if (melted){
        const x0 = X(r.tin), x1 = X(r.tout), y = yT(TE) + 12;
        let g = P(`M${x0.toFixed(1)},${y - 8} L${x0.toFixed(1)},${y} L${x1.toFixed(1)},${y} L${x1.toFixed(1)},${y - 8}`, 'rf02-brk');
        // 글은 오르는 웨이퍼 곡선과 내려가는 설정 곡선 사이에 (곡선을 피해). 자리가 좁으면 조금 더 아래로
        const lt = `액상선 위 ${tal}초`, lw = 120 + 13 * String(tal).length;
        const room = Ttop => {
          let a = r.tin, b = r.tout;
          r.pts.forEach(([t, , tv]) => { if (t <= r.tmax && tv < Ttop) a = t; });
          for (const [t, sv] of r.pts) if (t > r.t4 && sv <= Ttop){ b = t; break; }
          return [X(a), X(b)];
        };
        let ly = y + 30, ab = room((780 - (ly - 20)) / 2);
        for (const dy of [54, 78, 102]){
          if (ab[1] - ab[0] >= lw + 16) break;
          const nb = room((780 - (y + dy - 20)) / 2);
          if (nb[1] - nb[0] > ab[1] - ab[0]){ ly = y + dy; ab = nb; }
        }
        const cx = Math.max(GX0 + 8 + lw / 2, Math.min(GX1 - 8 - lw / 2, (ab[0] + ab[1]) / 2));
        g += LB(T(cx, ly, lt, 't-warn'), only('tal cool'));                          // 최고 단계에서는 괄호만 (여유 화살표가 주인공)
        an += G(g, W(K.on('tal'), tip(`액상선 위 시간(TAL) — 이 탭은 221 °C 위로 셈.\n224 °C(Ag 2.5 % 액상선) 위는 ${f0(r.t224)}초`)));
      }
      // 최고 온도: 가로 점선 + 봉우리에서 액상선(224 °C)까지 여유 화살표(봉우리 안쪽은 늘 비어 있다) + 봉우리 위 글
      {
        const yp = yT(r.Tmax), xp = X(r.tmax), y1 = yT(TL);
        let g = L(left && r.Tmax < 252 ? L221 + 12 : GX0, yp, GX1, yp, 'pl-peak') + L(GX0 - 6, yp, GX0 + 6, yp, 'rf02-mar');   // 왼쪽 221 °C 글을 지나지 않게
        if (m > 0.5){
          if (y1 - yp > 24) g += K.arrow(xp, (yp + y1) / 2, xp, yp + 5, 's-arrr') + K.arrow(xp, (yp + y1) / 2, xp, y1 - 2, 's-arrr');
          else g += L(xp, yp, xp, y1, 'rf02-mar');
          g += L(xp - 16, y1, xp + 16, y1, 'rf02-mar');
        }
        g += C(xp, yp, 8, 'k-acc2') + C(xp, yp, 18, 'co-ring');
        const lt = `최고 ${f1(r.Tmax)} °C · ` + (m > 0.5 ? `여유 ${f0(m)} °C` : '여유 없음 (224 °C 아래)'), lw = lt.length * 10.8;
        g += LB(T(Math.max(GX0 + 8 + lw / 2, Math.min(GX1 - 8 - lw / 2, xp)), yp - 18, lt, m >= 15 ? 'pl-pkt' : 'rf02-mng'));
        an += G(g, W(only('peak'), tip('여유 = 웨이퍼 최고 온도 − 액상선 224 °C (Ag 2.5 % 예시).\n웨이퍼 안 온도 차가 있으므로 가장 차가운 곳이 액상선 + 15~20 °C 이상이 되게 잡는다 (예시)')));
      }
      // 냉각: 굳기 시작 (과냉) 마름모
      if (melted && r.tN != null){
        const [, wN] = at(r, r.tN), xN = X(r.tN), yN = yT(wN);
        let g = P(`M${xN.toFixed(1)},${yN - 10} l10,10 l-10,10 l-10,-10 Z`, 'rf02-dia');
        const l1 = `굳기 시작 ≈ ${f0(r.so.tn)} °C`, l2 = `(과냉 ${f0(r.so.dU)} °C · 06장)`;
        if (xN + 14 + 186 <= GX1 - 4) g += LB(T(xN + 14, yN - 28, l1, 't-warn', 'start') + T(xN + 14, yN - 5, l2, 't-dim', 'start'));
        else g += LB(T(xN - 14, yN + 30, l1, 't-warn', 'end') + T(xN - 14, yN + 54, l2, 't-dim', 'end'));
        an += G(g, W(only('cool'), tip('굳기 시작 — 솔더는 221 °C 아래에서도 수십 °C 동안 액체(과냉)로 남았다가 한꺼번에 굳는다 (06장 모델: Ag 2.5 % · 25 µm)')));
      }
      ctx.$('[data-v="ann"]').innerHTML = an;
      // ── 작은 범프 줄
      ctx.$('[data-v="bumps"]').innerHTML = bumps(r);
      // ── 오른쪽 패널: 지금 값 (단계마다)
      const [sa0, wa0] = at(r, Math.max(4, Math.round(0.6 * r.t1)));
      const NOW = {
        ramp: [`승온 ${st.ru} °C/초 · τ ${st.tau}초`, `→ 웨이퍼가 약 ${f0(sa0 - wa0)} °C 늦다`],
        soak: [`예열 설정 ${st.ts}초`, `→ 150~200 °C에 ${f0(r.sk)}초`],
        tal: [`221 °C 위 ${tal}초 (224 °C 위 ${f0(r.t224)}초)`, `IMC ${imT} (05장 모델)`],
        peak: [`최고 ${f1(r.Tmax)} °C (설정 ${st.pk} °C)`, m > 0.5 ? `여유 ${f0(m)} °C (최고 − 224 °C)` : '여유 없음 (224 °C 아래)'],
        cool: [`냉각 ${st.rc.toFixed(1)} °C/초 → 굳기 ≈ ${f0(r.so.tn)} °C`, `Ag₃Sn 판 ≈ ${f1(r.so.L)} µm (06장 모델)`]
      };
      let nw = '';
      SID.forEach(id => { nw += G(LB(TT(PX, 608, NOW[id], 'rf02-now', 'start', 28)), only(id)); });
      ctx.$('[data-v="now"]').innerHTML = nw;
      // ── 판정 상자
      const vc = ['rf02-vok', 'rf02-vwn', 'rf02-vng'][J.lv] + (J.word.length > 10 ? ' rf02-vsm' : '');
      let v = T(1176, 742, J.word, vc, 'start'), vy = 780;
      const line = (t, c, lh = 25) => { const ln = wrap(t, c === 't-sub' ? 16.4 : 18); v += TT(1176, vy, ln, c, 'start', lh); vy += ln.length * lh + 6; };
      line(`최고 ${f1(r.Tmax)} °C · 221 °C 위 ${tal}초`, 't-sub', 26);
      line(`예열 창 ${f0(r.sk)}초 · IMC ${imT}`, 't-sub', 26);
      vy += 4;
      [J.P, J.Q].forEach(([lv, , why]) => { if (why) line((lv ? '⚠ ' : '✓ ') + why, lv ? 'rf02-wn' : 'rf02-okt'); });
      const extra = [];
      if (st.ru >= 4) extra.push('빠른 승온 — 플럭스 튐 · 온도 차');
      if (st.ts < 30) extra.push('예열 짧음 — 녹은 뒤 튐 · 보이드');
      else if (st.ts > 150) extra.push('예열 김 — 플럭스 지침 · 산화');
      if (st.rc <= 1) extra.push('느린 냉각 — Ag₃Sn 판 · 녹은 시간↑');
      extra.forEach(t => line('+ ' + t, 't-dim'));
      if (vy < 1000) v += TT(1176, 1036, ['보통 (예시): 최고 240~260 °C', '221 °C 위 30~90초 · 승온 1~3 °C/초'], 't-dim', 'start', 24);
      ctx.$('[data-v="verdict"]').innerHTML = LB(v);
      // ── 카드: 결과 칸 · 메시지
      ctx.out('k-pk', f1(r.Tmax) + ' °C'); ctx.out('k-tal', tal + ' 초'); ctx.out('k-sk', f0(r.sk) + ' 초'); ctx.out('k-imc', melted ? imc.toFixed(2) + ' µm' : '0 (안 녹음)');
      const kc = (id, lv) => { const e = ctx.card.querySelector(`[data-o="${id}"]`).parentNode; ['ok', 'warn', 'ng'].forEach((c, i) => e.classList.toggle(c, lv === i)); };
      kc('k-pk', J.P[0]); kc('k-tal', J.Q[0]);
      let msg = `웨이퍼 최고 <b>${f1(r.Tmax)} °C</b>(설정 ${st.pk} °C${m > 0.5 ? ` · 여유 ${f0(m)} °C` : ''}) · 221 °C 위 <b>${tal}초</b> · 예열 창 ${f0(r.sk)}초 · IMC ${imT} → <b>${J.word}</b>. `;
      msg += (J.P[0] >= J.Q[0] ? J.P[2] : J.Q[2]) + '.';
      if (st.tau >= 20) msg += ' 대류 방식은 웨이퍼가 늦게 따라와, 같은 설정에서도 최고 온도가 낮고 녹아 있는 시간이 짧습니다.';
      if (st.ru >= 4) msg += ' 빠른 승온 — 플럭스 용제가 끓어 튀거나 웨이퍼 안 온도 차가 커질 수 있습니다.';
      if (st.ts < 30) msg += ' 예열이 짧아 용제 · 기체가 녹은 뒤에 나와 튐 · 보이드가 생기기 쉽습니다(플럭스 방식).';
      else if (st.ts > 150) msg += ' 예열이 길어 플럭스가 지치고, 산소가 있으면 산화가 자랄 수 있습니다.';
      if (st.rc <= 1) msg += ' 천천히 식히면 221 °C 위에 머무는 시간도 늘고(냉각도 TAL에 들어감), 큰 Ag₃Sn 판이 자랄 시간도 늘어납니다(06장).';
      ctx.q('[data-o=msg]').innerHTML = msg;
      if (ready) ctx.refresh();
    }
    // 작은 범프 5칸 (3.2 px/µm: 지름 80 px, Cu 48 · Ni 10 · 솔더 원기둥 38 / 돔 50 px)
    function bumps(r){
      const NM = ['① 승온', '② 예열', '③ 녹임', '④ 최고', '⑤ 냉각'];
      const melted = r.tin != null, full = r.Tmax >= TL, tal = Math.round(r.tal);
      let out = '';
      for (let k = 0; k < 5; k++){
        const x = BX(k), cx = x + BW / 2, y0 = BY + 124, yb = BY + 182, id = SID[k];
        let g = R(x, BY, BW, 266, 'pl-lane', {rx: 12}) + R(x, BY, BW, 266, 'pl-hlbox', W({rx: 12}, only(id)));
        g += T(x + 14, BY + 30, NM[k], 'pl-hdg', 'start');
        g += R(cx - 76, yb, 152, 14, 'f-si', tip('Si 웨이퍼')) + R(cx - 40, yb - 48, 80, 48, 'f-cu2', tip('Cu 기둥 15 µm')) + R(cx - 40, y0, 80, 10, 'f-ni', tip('Ni 방벽 3 µm'));
        const cyl = `M${cx - 40},${y0} L${cx - 40},${y0 - 36} L${cx - 26},${y0 - 40} L${cx - 12},${y0 - 35} L${cx + 2},${y0 - 41} L${cx + 16},${y0 - 36} L${cx + 30},${y0 - 40} L${cx + 40},${y0 - 37} L${cx + 40},${y0} Z`;
        const dome = cap(cx, y0, 40, 50);
        const solidP = (d, t) => P(d, 'f-sn2', tip(t));
        let cpt = '', warn = false;
        if (k === 0){
          g += solidP(cyl, 'SnAg 솔더 — 아직 도금한 원기둥 (12 µm)') + P(cyl, 'rf02-ox', tip('산화막 · 유기물 (그림은 과장)'));
          for (let q = 0; q < 3; q++){
            const vx = cx - 26 + q * 26;
            g += `<path d="M${vx},${y0 - 46} q7,-9 0,-18 q-7,-9 0,-18" class="rf02-vap"><animateTransform attributeName="transform" type="translate" values="0 6;0 -10" dur="2.4s" begin="-${(q * 0.8).toFixed(1)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.85;0" dur="2.4s" begin="-${(q * 0.8).toFixed(1)}s" repeatCount="indefinite"/></path>`;
          }
          if (st.ru >= 4){
            [[-1, -60], [1, -70], [-1, -38]].forEach(([sg, dy], q) => { g += `<circle r="4.5" class="rf02-spat"><animateMotion dur="1.6s" begin="-${(q * 0.5).toFixed(1)}s" repeatCount="indefinite" path="M${cx + sg * 20},${y0 - 40} q${sg * 30},${dy} ${sg * 62},${dy + 30}"/></circle>`; });
            cpt = '빠르면 솔더 · 플럭스가 튄다'; warn = true;
          } else cpt = '용제가 천천히 날아간다';
        } else if (k === 1){
          const thin = st.ts >= 30;
          g += solidP(cyl, 'SnAg 솔더 — 아직 고체') + P(cyl, thin ? 'rf02-ox2' : 'rf02-ox', tip(thin ? '산화막 — 플럭스 · 포름산과 반응해 얇아지는 중' : '산화막 — 예열이 짧아 아직 두껍다'));
          [[-18, -62], [20, -54]].forEach(([dx, dy], q) => {
            g += G(`<circle r="10" class="rf02-mol"><animateMotion dur="${(3 + q * 0.7).toFixed(1)}s" repeatCount="indefinite" path="M${cx + dx},${y0 + dy} l8,-6 l6,8 l-10,4 Z"/></circle>`, tip('플럭스 · 포름산(HCOOH) — 산화막과 반응해 걷어 낸다 (03장)'));
          });
          if (!thin){ cpt = '예열 짧음 — 산화막이 남는다'; warn = true; }
          else if (st.ts > 150){ cpt = '예열 김 — 플럭스가 지친다'; warn = true; }
          else cpt = '산화막 걷기 시작 · 온도 맞춤';
        } else if (k === 2){
          if (!melted){ g += solidP(cyl, '녹지 않은 솔더'); cpt = '221 °C에 못 닿아 안 녹음'; warn = true; }
          else if (!full){ g += solidP(`M${cx - 40},${y0} L${cx - 40},${y0 - 34} Q${cx - 20},${y0 - 46} ${cx},${y0 - 40} Q${cx + 20},${y0 - 46} ${cx + 40},${y0 - 34} L${cx + 40},${y0} Z`, '덜 녹은 솔더 — 고체 Sn이 남아 둥글어지지 못함'); cpt = '덜 녹음 — 고체 Sn이 남는다'; warn = true; }
          else {
            g += solidP(dome, '녹은 솔더 — 표면장력으로 둥근 돔') + P(dome, 'rf02-liq', tip('녹아 있는 동안 (액체)'));
            if (tal < 30){ g += C(cx - 14, y0 - 7, 7, 'pl-air', tip('바닥에 붙은 기포 — 녹아 있는 시간이 짧아 커지거나 합쳐져 빠져나갈 틈이 없었다 (07장)')); cpt = '짧으면 덜 둥긂 · 기포가 남는다'; warn = true; }
            else {
              g += `<circle r="6" class="pl-air"><animateMotion dur="2.6s" repeatCount="indefinite" path="M${cx - 8},${y0 - 8} L${cx - 4},${y0 - 50}"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;.85;1" dur="2.6s" repeatCount="indefinite"/></circle>`;
              g += C(cx - 4, y0 - 52, 9, 'co-ring');
              cpt = '둥글어짐 · 젖음 · 기포 빠짐';
            }
          }
        } else if (k === 3){
          g += melted && full ? solidP(dome, '녹은 솔더 (돔)') : solidP(cyl, melted ? '덜 녹은 솔더' : '녹지 않은 솔더');
          if (melted){
            const h = Math.max(1.5, r.imc * 5);
            g += R(cx - 40, y0 - h, 80, h, 'f-imc', tip(`Ni₃Sn₄ (IMC) — 약 ${r.imc.toFixed(2)} µm (05장 모델, 그림 두께는 과장)`));
            cpt = r.Tmax > 265 ? `IMC 약 ${r.imc.toFixed(2)} µm · 산화 · 탄화↑` : `IMC 자람 — 약 ${r.imc.toFixed(2)} µm`;
            if (r.Tmax > 265) warn = true;
          } else { cpt = '안 녹아 IMC도 거의 없다'; warn = true; }
        } else {
          g += melted && full ? solidP(dome, '굳은 솔더 (돔)') : solidP(cyl, melted ? '덜 녹은 채 굳은 솔더' : '녹지 않은 솔더 — 도금한 모양 그대로');
          if (melted) g += R(cx - 40, y0 - Math.max(1.5, r.imc * 5), 80, Math.max(1.5, r.imc * 5), 'f-imc');
          if (melted && full){
            g += P(`M${cx - 6},${y0 - 2} L${cx - 22},${y0 - 40} M${cx + 4},${y0 - 2} L${cx + 26},${y0 - 36}`, 'rf02-gb', tip('β-Sn 결정 경계 — 범프 하나에 결정이 몇 개뿐 (06장)'));
            const Lp = r.so.L * 3.2;
            if (Lp >= 4) g += R(cx - Lp / 2, y0 - 22, Lp, 4.5, 'pl-ag3', W(tip(`Ag₃Sn 판 — 자랄 수 있는 길이 약 ${f1(r.so.L)} µm (06장 모델)`), {transform: `rotate(-15 ${cx} ${y0 - 20})`}));
            cpt = ['굳음 · Ag₃Sn 판', `≈ ${r.so.L >= 10 ? f0(r.so.L) : f1(r.so.L)} µm${r.so.L >= 10 ? ' · 큰 판' : ''}`];
            if (r.so.L >= 10) warn = true;
          } else { cpt = melted ? '덜 녹은 채 굳음' : '안 녹음 — 원기둥 그대로'; warn = true; }
        }
        g += TT(x + 12, BY + 222, Array.isArray(cpt) ? cpt : wrap(cpt, 8.4), warn ? 'rf02-cw' : 't-dim', 'start', 24);
        out += G(g);
      }
      return out;
    }
    // 컨트롤
    ['ts', 'pk', 'tp', 'rc'].forEach(id => ctx.range(id, v => { st[id] = v; if (ready) render(); return OUT[id](v); }));
    ['ru', 'tau'].forEach(id => ctx.seg(id, (v, user) => { st[id] = +v; if (user) touched = true; if (ready) render(); }));
    ['ts', 'pk', 'tp', 'rc'].forEach(id => inp(id).addEventListener('input', () => { touched = true; }));
    ready = true;
    render();
    // 발표 모드 · 손대기 전: 단계에 맞는 예시 값 (기본값 + DEMO만 덮어씀)
    ctx.demo = sid => {
      if (touched || !DEMO[sid]) return render();
      Object.assign(st, DEF, DEMO[sid]);
      ['ts', 'pk', 'tp', 'rc'].forEach(id => { inp(id).value = st[id]; ctx.out(id, OUT[id](st[id])); });
      ['ru', 'tau'].forEach(id => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === st[id]))));
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['프로파일', '시간에 따른 온도 곡선. 장비 설정값이 아니라 웨이퍼에서 잰 값이 기준'],
      ['승온 속도', '1초에 몇 °C 오르나 (보통 1~3 °C/초)'],
      ['예열 (소크)', '녹는점 아래(보통 150~200 °C)에서 잠시 머물러 온도를 고르게 하고 표면을 준비하는 구간'],
      ['액상선 위 시간 (TAL)', '솔더가 녹아 있는 시간의 기준. 이 탭에서는 녹기 시작하는 221 °C 위 시간으로 셈(J-STD-020이 SAC에 217 °C를 쓰는 것과 같은 방식). Ag 2.5 %가 다 녹는 224 °C 위 시간은 몇 초 짧고, 식을 때 과냉 액체로 남는 시간(06장)은 들어가지 않음'],
      ['최고 온도 (피크)', '웨이퍼가 닿는 가장 높은 온도. 보통 240~260 °C'],
      ['열 지연 (τ)', '웨이퍼 온도가 설정 온도를 따라잡는 데 걸리는 시간의 크기. 판 · 전도 가열은 작고(수 초), 바람(대류) 가열은 크다'],
      ['플럭스 · 포름산', '산화막을 걷는 것들. 플럭스는 바르는 약품, 포름산은 증기(기체)로 쓰는 가장 간단한 유기산 (03장)'],
      ['측정용 웨이퍼', '열전대(온도 센서) 여러 개를 붙여 실제 프로파일을 재는 웨이퍼']
    ]) + K.field([
      '설정 온도 ≠ 웨이퍼 온도입니다. 판 교체 · PM · 레시피 변경 뒤에는 측정용 웨이퍼로 <b>가운데 · 가장자리</b> 실제 프로파일을 다시 잽니다 → <a data-go="tool.plate">08장</a>.',
      '웨이퍼 가장자리에 덜 녹은 고리가 보이면 <b>가장 차가운 곳의 최고 온도 여유</b>부터 봅니다(휨 · 판 간격 · 가장자리 열 손실) → <a data-go="defects.map">09장</a>.',
      '플럭스 방식은 예열이 너무 짧으면 용제가 덜 빠져 튐 · 보이드, 너무 길면 활성제가 지쳐 젖음이 나빠집니다. 포름산 방식은 예열 구간의 온도 · 시간이 환원량을 정합니다 → <a data-go="oxide.formic">03장</a>.',
      '냉각 속도는 Ag₃Sn · 결정뿐 아니라 <b>액상선 위 시간에도</b> 들어갑니다(천천히 식히면 녹아 있는 시간이 늘어남). 냉각만 바꿔도 TAL · IMC가 함께 바뀌는 까닭입니다.'
    ]) + K.deep(`<ul>
      <li><b>웨이퍼 열 모델</b> — ${K.eq('dT/dt = (T_set − T) / τ,  τ = ρ·c·t / h')} 300 mm Si(두께 775 µm): ρct ≈ 2,330 × 750 × 775×10⁻⁶ ≈ 1,350 J/(m²·K). 일정한 속도 r로 오를 때 웨이퍼는 r·τ만큼 늦습니다(2 °C/초 · τ 5초 → 10 °C, τ 20초 → 40 °C). 그래서 τ가 큰 대류 방식은 최고 설정을 더 높이거나 머무름을 길게 잡습니다. 위젯 예: 같은 설정 255 °C에서 τ 5초 → 최고 255.0 °C · TAL 64초, τ 20초 → 247.9 °C · 62초.</li>
      <li><b>공개 기준 모양 — J-STD-020(E) 무연 분류 프로파일</b> — 예열 150~200 °C에서 60~120초, T_L 217 °C, T_L 위 60~150초, 최고 ≤ 260 °C(패키지 두께 · 부피별 245~260 °C), 분류 온도 −5 °C 안 30초, 승온 ≤ 3 °C/초(T_L → T_p), 냉각 ≤ 6 °C/초. 부품이 견뎌야 할 리플로우를 정한 표준이며(T_L 217 °C는 SAC 기준), SnAg 웨이퍼 범프는 보통 최고 240~260 °C · 액상선 위 30~90초로 따로 정합니다.</li>
      <li><b>IMC 지표</b> — ${K.eq('x³ = ∫ k(T) dt   (T ≥ 221 °C)')}${K.eq('k(250 °C) = 1/60 µm³/s')} 활성화 에너지 25 kJ/mol(전해 Ni 위 Ni₃Sn₄ 보고값 하나)을 가정했습니다. 이 개념 모델에서는 같은 시간이면 최고 온도 20 °C 차이가 두께를 몇 %만 바꿉니다. 하지만 보고값이 넓게 흩어져 있고(Q 16~172 kJ/mol), 최고 온도를 올리면 Ni가 녹아드는 양 · 빠르기와 액상선 위 시간도 함께 늘어나므로 <b>최고 온도의 효과를 작다고 단정하지 않습니다</b>. 굳은 뒤 성장(Q 수십 kJ/mol 이상)은 온도에 더 민감합니다(<a data-go="imc.grow">05장</a>).</li>
      <li><b>온도 여유 잡기</b> — Ag 1.5~2.5 wt%의 액상선은 약 224~227 °C입니다. 웨이퍼 안 온도 차가 ±5 °C(예시)라면 가장 차가운 곳의 최고 온도가 액상선 + 15~20 °C 이상 되게 잡고, 가장 뜨거운 곳이 상한(IMC · 플럭스 · 보호막 · 휨)을 넘지 않는지 함께 봅니다. 위젯 판정의 '여유 적음(+15 °C 미만)'이 이 기준입니다.</li>
      <li><b>최고 온도가 너무 높으면</b> — 플럭스가 타서(탄화) 물에 안 녹는 찌꺼기, 남은 산소로 산화 · 변색, IMC · Ni 소모, 보호막(폴리이미드 등) · 웨이퍼 휨 · 다른 재료의 열 한계에 부담이 갑니다.</li>
      <li><b>측정 오차</b> — 열전대를 붙이는 방법(접착제 · 고정 금속) · 위치 · 선이 끌어가는 열이 수 °C 차이를 만듭니다. 측정용 웨이퍼는 소모품이라 교정 · 사용 횟수를 관리합니다.</li></ul>`);
  },
  css: `.pl-svg .rf02-win{fill:rgba(250,204,21,.07)}
.pl-svg .rf02-win2{fill:rgba(250,204,21,.13);stroke:#facc15;stroke-width:1.6;stroke-dasharray:7 5}
.pl-svg .rf02-tw{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .rf02-bt{font-size:19px;font-weight:800;fill:#cbd5e1 !important}
.pl-svg .rf02-brk{fill:none;stroke:#fbbf24;stroke-width:2.4}
.pl-svg .rf02-lag{fill:none;stroke:#f59e0b;stroke-width:2.6}
.pl-svg .rf02-mar{fill:none;stroke:#f87171;stroke-width:2.4}
.pl-svg .rf02-sup{fill:none;stroke:#fbbf24;stroke-width:9;stroke-linecap:round;opacity:.5}
.pl-svg .rf02-dia{fill:#f87171;stroke:#fff;stroke-width:1.4}
.pl-svg .rf02-vap{fill:none;stroke:#cbd5e1;stroke-width:2.2;stroke-linecap:round}
.pl-svg .rf02-mol{fill:#4ade80;stroke:#dcfce7;stroke-width:1.2}
.pl-svg .rf02-ox{fill:none;stroke:#94a3b8;stroke-width:4;stroke-linejoin:round}
.pl-svg .rf02-ox2{fill:none;stroke:#94a3b8;stroke-width:2;stroke-dasharray:4 4}
.pl-svg .rf02-liq{fill:none;stroke:#fbbf24;stroke-width:2.6;opacity:.85}
.pl-svg .rf02-gb{fill:none;stroke:#0b1222;stroke-width:2}
.pl-svg .rf02-spat{fill:#e2e8f0;stroke:#f87171;stroke-width:1.6}
.pl-svg .rf02-now{font-size:21px;font-weight:800;fill:#fde68a !important}
.pl-svg .rf02-vok{font-size:30px;font-weight:900;fill:#4ade80 !important}
.pl-svg .rf02-vwn{font-size:30px;font-weight:900;fill:#fbbf24 !important}
.pl-svg .rf02-vng{font-size:30px;font-weight:900;fill:#f87171 !important}
.pl-svg .rf02-vsm{font-size:24px}
.pl-svg .rf02-wn{font-size:19px;font-weight:700;fill:#fca5a5 !important}
.pl-svg .rf02-okt{font-size:19px;font-weight:700;fill:#86efac !important}
.pl-svg .rf02-cw{font-size:19px;font-weight:700;fill:#fca5a5 !important}
.pl-svg .rf02-mng{font-size:19px;font-weight:800;fill:#fbbf24 !important}`
});
})();
