/* 리플로우 06 — 굳기: 식으면서 솔더 속은 어떻게 짜일까? (과냉 · β-Sn 결정 · Ag₃Sn 판 · 냉각 속도 — 솔더 속 · µm) */
(function(){
// ── 개념 모델 (기획 rev.2 · 모두 가정값 — 공개 보고의 경향에 맞춘 것)
//  실효 Ag  c = Ag₀ / (1 − Sn 소모)               Ag는 IMC에 거의 안 들어가 Sn이 빠진 만큼 남은 솔더에서 진해진다
//  과냉     ΔT = 15 + 12·log₁₀(500/D) + 8·log₁₀(r) °C (5~80)   작을수록 · 빨리 식힐수록 크다
//  β-Sn 굳기 시작 T_N = T_L,Sn(c) − ΔT,  Ag₃Sn이 생길 수 있는 온도 T_A = 221 + 15.6·(c − 3.5)
//  창 W = max(0, T_A − T_N) °C,  t_w = W / r,  판 길이 L = min(0.9·D, 1 µm/s × t_w)
const LIQ = [[0, 231.9], [1, 229], [1.8, 226], [2.5, 224], [3, 222], [3.5, 221]];   // 전해도금 10장 액상선 표 (Sn 쪽)
const tlSn = c => { if (c >= 3.5) return 221 - 3 * (c - 3.5); for (let k = 1; k < LIQ.length; k++) if (c <= LIQ[k][0]){ const [a, ta] = LIQ[k - 1], [b, tb] = LIQ[k]; return ta + (tb - ta) * (c - a) / (b - a); } return 221; };
const tA = c => 221 + 15.6 * (c - 3.5);
const VG = 1;                                                                      // 유효 판 성장 속도 µm/s (가정)
function model(ag0, sn, r, D){
  const c = ag0 / (1 - sn / 100);
  const dT = Math.max(5, Math.min(80, 15 + 12 * Math.log10(500 / D) + 8 * Math.log10(r)));
  const TL = tlSn(c), TN = TL - dT, TA = tA(c), W = Math.max(0, TA - TN), tw = W / r, L = Math.min(0.9 * D, VG * tw);
  const lv = L < 3 ? 'ok' : (L >= 10 || L >= 0.5 * D) ? 'ng' : 'warn';
  return {ag0, sn, r, D, c, dT, TL, TN, TA, W, tw, L, lv};
}
const crOf = v => +(0.2 * Math.pow(10, v / 50)).toPrecision(2);                    // 0~100 → 0.2~20 °C/초 (로그, 50 → 2)
const dOf = v => { const d = 10 * Math.pow(50, v / 100); return d < 100 ? Math.round(d) : Math.round(d / 10) * 10; };   // 0~100 → 10~500 µm (23 → 25)
const f1 = v => v.toFixed(1), f0 = v => v.toFixed(0);
// 장면 글 줄바꿈: '·'는 앞 낱말에, 숫자는 단위에 붙여 줄 머리에 '·' · 단위만 남지 않게 (붙이는 칸 = U+00A0)
const wr = (K, t, em) => K.wrap(String(t).replace(/ · /g, '\u00a0· ').replace(/(\d) (°C|µm|nm|%|초|ppm)/g, '$1\u00a0$2'), em);
const VERD = {ok: 'Ag₃Sn은 작은 알갱이 · 그물 (위험 낮음)', warn: '판이 생길 수 있음 (경계) — 단면으로 확인', ng: '큰 판 위험 (높음) — 범프를 가로지를 수 있음'};
// 판정 글: 1~3 µm는 장면에 작은 판이 그려지므로 '알갱이'가 아니라 '작은 판'이라고 쓴다 (판정 기준은 그대로)
const verd = m => m.lv === 'ok' && m.L >= 1 ? '작은 판 정도 — 3 µm 미만 (위험 낮음)' : VERD[m.lv];
// 발표 모드 · 손대기 전: 위젯 기본값 + 단계마다 덮어쓸 값만
const DEF = {ag: 2.5, sn: 0, cr: 50, d: 23, g: '1'};
const DEMO = {under: {}, grain: {g: '3'}, ag3sn: {sn: 20}, rate: {cr: 85}};
// ── 무대 배치
const GR = {x0: 120, x1: 750, y0: 600};                                           // 냉각 곡선: 150~260 °C → y 600~160 (4 px/°C)
const gy = t => GR.y0 - (t - 150) * 4;
const TENDS = [[5, 1], [10, 2], [15, 5], [20, 5], [30, 5], [40, 10], [60, 10], [80, 20], [120, 20], [160, 40], [240, 40], [320, 80], [480, 80], [600, 100]];
const BX = 420, BY = 1000, BA = 150, BH = 189;                                    // 범프 단면: 12 px/µm, 지름 25 µm 돔 (그림 크기 고정)
const cap = (cx, y0, a, h) => { const R = (a * a + h * h) / (2 * h); return `M${cx - a},${y0} A${R.toFixed(1)},${R.toFixed(1)} 0 ${h > a ? 1 : 0} 1 ${cx + a},${y0} Z`; };
const DOME = cap(BX, BY, BA, BH);
// 쌍정 셋(②): 한 점 J에서 120°씩 갈라지는 세 영역, c축은 60°씩 돌아감
const J = [420, 930], PLp = [304.4, 863.2], PRp = [535.6, 863.2];
const SECT = [
  [J, [74, 730], [74, 520], [766, 520], [766, 730]],
  [J, [74, 730], [74, 1200], [420, 1200]],
  [J, [420, 1200], [766, 1200], [766, 730]]
];
const GRAINS = {
  '1': [{th: 10, cx: 420, cy: 912, hl: 46, col: 'hsla(205,85%,55%,.22)'}],
  '3': [{th: 10, cx: 420, cy: 868, hl: 30, col: 'hsla(205,85%,55%,.24)', clip: 'rf06-s0'}, {th: 70, cx: 346, cy: 952, hl: 30, col: 'hsla(140,70%,42%,.24)', clip: 'rf06-s1'}, {th: 130, cx: 494, cy: 952, hl: 30, col: 'hsla(30,95%,55%,.26)', clip: 'rf06-s2'}],
  'h': [{th: 80, cx: 420, cy: 912, hl: 46, col: 'hsla(320,75%,62%,.22)'}]
};
const GNAME = {'1': '① 결정 하나 · c축이 거의 세로', '3': '② 결정 셋 — 약 60°씩 돌아간 쌍정 (비치볼 단면)', 'h': '③ 결정 하나 · c축이 거의 가로'};
// Sn 쪽 상태도 (ag3sn 단계): Ag 0~5 wt% → x 880~1500, 170~250 °C → y 600~200
const PD = {x0: 880, x1: 1500, y0: 600, y1: 200};
const px = a => PD.x0 + Math.min(5, Math.max(0, a)) / 5 * (PD.x1 - PD.x0), py = t => PD.y0 - (t - 170) * 5;
// 냉각 vs Ag 2 × 2 (rate 단계, 지름 25 µm)
const RCELL = [[1.5, 1, 900, 262], [1.5, 10, 1230, 262], [2.5, 1, 900, 552], [2.5, 10, 1230, 552]];
const RW = 310, RH = 270;
const cellTxt = m => m.W <= 0 ? '판 없음 (창 닫힘)' : m.L < 1 ? `거의 없음 (${f1(m.L)} µm)` : m.L < 3 ? `작은 판 약 ${f0(m.L)} µm` : m.lv === 'ng' ? `판 위험 높음 — 약 ${f0(m.L)} µm` : `판 생길 수 있음 — 약 ${f0(m.L)} µm`;
const VN_L = {x: 60, y: 130, w: 720, h: 990}, VN_R = {x: 795, y: 125, w: 770, h: 985};   // 좁은 세로 화면: 왼쪽(곡선 · 범프) 또는 오른쪽 패널만

// c축 표시 (양쪽 촉, 축이라 방향 부호는 없다)
function cax(K, cx, cy, th, hl, cls){
  const a = th * Math.PI / 180, ux = Math.sin(a), uy = -Math.cos(a);
  const head = (x, y, sx, sy) => { const bx = x - sx * 13, by = y - sy * 13, nx = -sy * 6.5, ny = sx * 6.5; return K.PG([[x, y], [bx + nx, by + ny], [bx - nx, by - ny]], cls + 'h'); };
  return K.L(cx - ux * (hl - 10), cy - uy * (hl - 10), cx + ux * (hl - 10), cy + uy * (hl - 10), cls) + head(cx + ux * hl, cy + uy * hl, ux, uy) + head(cx - ux * hl, cy - uy * hl, -ux, -uy);
}
// 결: c축 방향의 잔선 (간격 14 px)
function hatch(K, th, cx, cy, n, clip){
  const a = th * Math.PI / 180, ux = Math.sin(a), uy = -Math.cos(a), nx = Math.cos(a), ny = Math.sin(a);
  let d = '';
  for (let k = -n; k <= n; k++){ const qx = cx + nx * k * 14, qy = cy + ny * k * 14; d += `M${(qx - ux * 260).toFixed(1)},${(qy - uy * 260).toFixed(1)} L${(qx + ux * 260).toFixed(1)},${(qy + uy * 260).toFixed(1)} `; }
  return K.P(d, 'rf06-hatch', clip ? {'clip-path': K.url(clip)} : null);
}

(window.EngrReflowChapters = window.EngrReflowChapters || []).push({
  no: '06', id: 'solid', part: 2, short: '굳기 · 속', scale: '솔더 속 · µm',
  title: '굳기 — 식으면서 솔더 속은 어떻게 짜일까?',
  hook: '221 °C에서 바로 굳지 않는다',
  one: '녹은 솔더는 221 °C에 닿아도 바로 굳지 않고, 수십 °C 더 식은 뒤 한꺼번에 굳습니다(과냉). 그래서 마이크로범프 하나는 보통 몇 개 안 되는 큰 β-Sn 결정이 되고, 결정 방향에 따라 성질이 달라집니다. Ag가 많거나 과냉이 크면(여러 번 녹여 남은 솔더의 Ag가 진해져도) 굳기 전에 큰 Ag₃Sn 판이 먼저 자랄 수 있습니다.',
  ana: '<b>과냉각된 물</b> — 아주 깨끗한 물은 0 °C 아래로 식어도 한동안 얼지 않다가, 계기가 생기면 순식간에 얼어 버립니다. 물이 적을수록(작은 물방울) 얼음 씨앗이 생길 기회가 적어 더 오래 버팁니다. <i>(비유의 한계: 물은 얼면 한 가지 결정이지만, SnAg는 Sn 결정과 Ag₃Sn 결정 두 가지가 생기고, 둘이 생기는 순서와 그 사이 시간이 속 구조를 정합니다. 또 Sn 결정은 방향에 따라 성질이 크게 다릅니다.)</i>',
  steps: [
    {id: 'under', t: '과냉 — 녹는점 아래에서도 액체', d: 'β-Sn 결정은 씨앗(핵)이 생기기 어려워 보통 액상선보다 수십 °C 낮아져야 굳기 시작합니다. 범프가 작을수록 씨앗이 생길 기회가 적어 과냉이 커집니다. 한번 씨앗이 생기면 범프 전체가 순식간에 굳습니다.', viewN: VN_L},
    {id: 'grain', t: 'β-Sn 결정 — 몇 개뿐, 방향이 중요', d: '과냉 뒤 씨앗 하나에서 순식간에 굳기 때문에, 마이크로범프 하나는 보통 하나~몇 개의 큰 β-Sn 결정이 됩니다(약 60°씩 돌아간 짝 결정 — 쌍정 — 도 흔합니다). 결정의 한 방향(c축)과 다른 방향 사이에 열팽창은 약 2배, Ni가 퍼지는 빠르기는 수만 배(Cu는 수십~수백 배) 다릅니다.', viewN: VN_R},
    {id: 'ag3sn', t: 'Ag₃Sn 판 — 굳기 전에 먼저 자란다', d: 'Ag₃Sn은 씨앗이 쉽게 생겨, β-Sn이 과냉으로 머뭇거리는 동안 액체 속에서 판 모양으로 먼저 자랄 수 있습니다. Ag가 많을수록 · 과냉이 클수록, 여러 번 녹여 남은 솔더의 Ag가 진해질수록(<a data-go="imc.budget">05장</a>) 판이 커집니다. 큰 판은 균열 길이 됩니다.', viewN: VN_R},
    {id: 'rate', t: '냉각 속도 — 무엇이 바뀌나', d: '빨리 식히면 판이 짧아지지만, 판이 자랄 수 있는 온도 구간(창)은 남습니다. 냉각판(<a data-go="tool.plate">08장</a>)으로 더 빨리 식힐 수는 있어도 휨 · 열 응력이 커지고, 작은 범프에서는 빠른 냉각의 효과가 작았다는 보고도 있습니다. 그래서 Ag를 공정점(共晶, 3.5 %)보다 충분히 낮게(보통 1.5~2.5 %, 범프가 작을수록 낮은 쪽) 잡는 것이 더 확실합니다.', viewN: VN_R}
  ],
  icon(K){
    const {P, L, R} = K;
    return P('M6,52 A27,27 0 0 1 60,52 Z', 'f-sn2') + L(33, 52, 20, 30, 'rf06-gb') + L(33, 52, 48, 30, 'rf06-gb') + R(14, 40, 24, 3, 'pl-ag3', {transform: 'rotate(-20 26 41)'});
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, on, W, wrap, PG} = K;
    let s = '<defs>' +
      `<clipPath id="${K.id('rf06-clip')}"><path d="${DOME}"/></clipPath>` +
      SECT.map((pts, k) => `<clipPath id="${K.id('rf06-s' + k)}"><polygon points="${pts.map(p => p.join(',')).join(' ')}"/></clipPath>`).join('') +
      `<clipPath id="${K.id('rf06-m1')}"><path d="${cap(1010, 856, 95, 120)}"/></clipPath><clipPath id="${K.id('rf06-m2')}"><path d="${cap(1370, 856, 95, 120)}"/></clipPath>` +
      '</defs>';

    // ── 왼쪽 위: 냉각 곡선 (위젯이 곡선 · 선 · 이름표를 그린다)
    s += R(70, 140, 700, 500, 'pl-box', {rx: 12}) + R(70, 140, 700, 500, 'pl-hlbox', W({rx: 12}, only('under')));
    s += T(94, 178, '냉각 곡선 — 솔더 온도(°C) · 시간(초)', 't-acc', 'start');
    s += L(GR.x0, GR.y0, GR.x1 + 10, GR.y0, 's-axis') + L(GR.x0, GR.y0, GR.x0, 196, 's-axis');
    [160, 180, 200, 220, 240].forEach(t => { s += L(GR.x0 - 7, gy(t), GR.x0, gy(t), 's-axis') + T(GR.x0 - 12, gy(t) + 7, String(t), 't-dim', 'end'); });
    s += '<g data-v="gr"></g>';

    // ── 왼쪽 아래: 범프 단면 (12 px/µm, 그림 크기 고정)
    s += R(70, 660, 700, 450, 'pl-box', {rx: 12}) + R(70, 660, 700, 450, 'pl-hlbox', W({rx: 12}, only('grain')));
    s += R(BX - BA, BY + 36, BA * 2, 60, 'f-cu2', tip('Cu 기둥 (일부만)')) + R(BX - BA, BY, BA * 2, 36, 'f-ni', tip('Ni 3 µm — 솔더와 Cu 사이 방벽'));
    s += P(DOME, 'f-sn2', tip('SnAg 솔더 (리플로우 뒤 돔, 지름 25 µm · 꼭대기 약 15.7 µm)'));
    s += '<g data-v="bump"></g>';
    s += P(DOME, 'rf06-dome') + R(BX - BA, BY - 8, BA * 2, 8, 'f-imc', tip('Ni₃Sn₄ (IMC) — 05장. 리플로우 한 번에 약 1 µm'));
    s += K.lead(BX - BA + 12, BY - 4, 256, 990, 'Ni₃Sn₄ (05장)', 'end', 't-dim') + K.lead(BX - BA + 12, BY + 18, 256, 1032, 'Ni', 'end', 't-dim') + K.lead(BX - BA + 12, BY + 66, 256, 1078, 'Cu 기둥', 'end', 't-dim');

    // ── 오른쪽 패널
    s += R(800, 130, 760, 970, 'pl-panel', {rx: 16});

    // under: 크기와 과냉 막대(위젯) + 큰 시편 vs 범프의 굳는 열
    let un = T(830, 178, '크기와 과냉 — 작을수록 더 낮은 온도까지 액체로 버틴다', 't-acc', 'start') + T(830, 208, '개념 모델 · 냉각 2 °C/초 기준 · 막대 = 과냉 (°C)', 't-dim', 'start');
    un += '<g data-v="und"></g>';
    un += TT(830, 600, wr(K, '작을수록 씨앗이 생길 기회가 적어 더 낮은 온도까지 액체로 버틴다 — 순수 Sn은 100 °C 넘게 과냉되기도 한다 (보고). 빨리 식혀도 과냉이 조금 커진다.', 33), 't-sub', 'start', 28);
    un += T(830, 712, '굳을 때 나오는 열 — 큰 시편과 범프는 다르다', 't-acc', 'start');
    // 미니 그래프 둘 (같은 냉각, 굳기 시작에서 무엇이 보이나)
    const mini = (x0, title, bump) => {
      let g = R(x0, 760, 330, 176, 'pl-lane', {rx: 10}) + T(x0, 748, title, 't-sub', 'start');
      g += L(x0 + 16, 920, x0 + 316, 920, 's-axis') + L(x0 + 16, 920, x0 + 16, 772, 's-axis');
      if (!bump){
        g += P(`M${x0 + 22},784 L${x0 + 150},880 L${x0 + 160},836 L${x0 + 216},840 L${x0 + 300},912`, 's-curve', tip('큰 시편(DSC, mg 크기): 과냉 뒤 한꺼번에 굳으며 나온 열로 온도가 잠깐 튀어 오른다'));
        g += C(x0 + 150, 880, 6, 'k-ng') + K.arrow(x0 + 176, 892, x0 + 160, 846, 's-arr2') + T(x0 + 186, 902, '튀어 오름', 't-dim', 'start');
      } else {
        g += P(`M${x0 + 22},784 L${x0 + 300},912`, 's-curve', tip('웨이퍼 위 범프: 굳는 열(약 2.4 µJ)이 Cu 기둥 · 웨이퍼로 바로 퍼져 약 0.06 °C — 곡선에 거의 안 보인다'));
        g += L(x0 + 150, 828, x0 + 150, 858, 'rf06-tk') + C(x0 + 150, 843, 6, 'k-ng') + C(x0 + 150, 843, 14, 'co-ring') + T(x0 + 164, 820, '거의 그대로', 't-dim', 'start');
      }
      return g;
    };
    un += mini(840, 'DSC 시편 (mg 덩어리)', false) + mini(1200, '웨이퍼 위 범프 (약 41 ng)', true);
    un += T(840, 962, '굳는 열로 잠깐 튀어 오른다', 't-dim', 'start') + T(1200, 962, '열 약 2.4 µJ → 바로 퍼져 약 0.06 °C', 't-dim', 'start');
    un += TT(830, 1016, wr(K, '범프는 열이 Cu 기둥 · 웨이퍼로 바로 빠져 튀어 오름이 거의 없다 — 그래서 왼쪽 곡선에도 그리지 않았다. 재료 자료의 DSC 과냉은 큰 시편 값이라 범프보다 작다.', 33), 't-sub', 'start', 28);
    s += G(un, only('under'));

    // grain: 정방 단위 칸 + 방향별 성질 + 전류와 c축
    let gp = T(830, 178, 'β-Sn 결정 — 방향마다 성질이 다르다', 't-acc', 'start') + T(830, 222, 'β-Sn 단위 칸 (체심 정방)', 't-sub', 'start');
    const F0 = [866, 290], FW = 200, FH = 109, DX = 64, DY = -46;           // a = 5.83 Å → 200 px, c = 3.18 Å → 109 px
    const fr = [[F0[0], F0[1]], [F0[0] + FW, F0[1]], [F0[0] + FW, F0[1] + FH], [F0[0], F0[1] + FH]], bk = fr.map(([x, y]) => [x + DX, y + DY]);
    let cell = P(`M${bk[3][0]},${bk[3][1]} L${bk[0][0]},${bk[0][1]} M${bk[3][0]},${bk[3][1]} L${bk[2][0]},${bk[2][1]} M${bk[3][0]},${bk[3][1]} L${fr[3][0]},${fr[3][1]}`, 'rf06-cellb');
    cell += P(`M${bk[0][0]},${bk[0][1]} L${bk[1][0]},${bk[1][1]} L${bk[2][0]},${bk[2][1]} M${fr[0][0]},${fr[0][1]} L${bk[0][0]},${bk[0][1]} M${fr[1][0]},${fr[1][1]} L${bk[1][0]},${bk[1][1]} M${fr[2][0]},${fr[2][1]} L${bk[2][0]},${bk[2][1]}`, 'rf06-celle');
    cell += R(F0[0], F0[1], FW, FH, 'rf06-cellf');
    bk.concat(fr).forEach(([x, y]) => { cell += C(x, y, 10, 'rf06-at'); });
    cell += C(F0[0] + FW / 2 + DX / 2, F0[1] + FH / 2 + DY / 2, 11, 'rf06-at2', tip('가운데 격자점 (체심)'));
    gp += G(cell, tip('β-Sn 단위 칸 — 정방(가로 a = b, 세로 c가 짧다).\n그림은 격자점(모서리 + 가운데)만 — 실제로는 한 칸에 원자 4개'));
    gp += cax(K, 846, F0[1] + FH / 2, 0, FH / 2, 'rf06-cx2') + T(828, F0[1] + FH / 2 + 8, 'c', 'rf06-ct2', 'end');
    gp += K.arrow(F0[0] + FW / 2, 424, F0[0] + 2, 424, 's-arr') + K.arrow(F0[0] + FW / 2, 424, F0[0] + FW - 2, 424, 's-arr') + T(F0[0] + FW / 2, 452, 'a', 't-acc');
    gp += T(830, 490, 'a = 5.83 Å', 't-sub', 'start') + T(830, 518, 'c = 3.18 Å (c가 짧다)', 't-sub', 'start');
    // 방향별 성질 표
    gp += R(1160, 206, 380, 316, 'pl-box', {rx: 10}) + T(1180, 238, 'c축 vs a축', 'pl-hdg', 'start');
    const ROWS = [['열팽창', ['c축이 a축의 약 2배']], ['단단함 (영률)', ['c축이 약 3배']], ['Ni가 퍼지는 빠르기', ['c축이 수만 배', '(Cu는 수십~수백 배)']]];
    let ty = 284;
    ROWS.forEach(([nm, vals], k) => {
      if (k) gp += L(1176, ty - 30, 1524, ty - 30, 's-faint');
      gp += T(1180, ty, nm, 't-lbl', 'start') + TT(1180, ty + 30, vals, k === 2 ? 't-warn' : 't-sub', 'start', 28);
      ty += 30 + vals.length * 28 + 20;
    });
    // 전류와 c축 (전자이동)
    gp += T(830, 574, '전류와 c축 — 전자이동이 빨라지는 길', 't-acc', 'start');
    gp += T(830, 606, 'Ni · Cu 원자는 Sn 원자 사이 틈으로 움직인다 — c축 방향으로 통로가 열려 있다', 't-dim', 'start');
    gp += C(1052, 640, 6, 'k-e') + T(1066, 647, '전자', 't-dim', 'start') + C(1140, 640, 6, 'rf06-nid') + T(1154, 647, 'Ni · Cu 원자 (그림 예)', 't-dim', 'start') + L(1392, 640, 1432, 640, 'rf06-cx2') + T(1444, 647, 'c축', 't-dim', 'start');
    [[1010, 0, 'rf06-m1', true], [1370, 90, 'rf06-m2', false]].forEach(([cx, th, clip, fast]) => {
      let b = R(cx - 95, 872, 190, 70, 'f-cu2') + R(cx - 95, 856, 190, 16, 'f-ni') + P(cap(cx, 856, 95, 120), 'f-sn2');
      b += hatch(K, th, cx, 800, 9, clip) + cax(K, cx, 800, th, 44, 'rf06-cx');
      for (let k = 0; k < 3; k++) b += K.mover(cx - 50 + k * 50, 944, cx - 50 + k * 50, 724, 6, 'k-e', 2.6, k * 0.85);
      b += fast ? K.mover(cx + 22, 852, cx + 22, 752, 6, 'rf06-nid', 1.6, 0) + K.mover(cx - 26, 852, cx - 26, 762, 6, 'rf06-nid', 1.6, 0.8) : K.mover(cx + 22, 852, cx + 22, 840, 6, 'rf06-nid', 2.4, 0);
      b += T(cx, 700, '전자 흐름 ↑ (기둥 → 솔더)', 't-dim');
      gp += G(b, tip(fast ? 'c축이 전류와 나란함 — Ni · Cu가 c축 통로로 빨리 옮겨 간다\n음극(전자가 들어오는 Ni · Cu 쪽)의 소모가 빠르다 (보고)' : 'c축이 전류와 수직 — 옮겨 가는 길이 느리다'));
    });
    gp += T(840, 976, '① c축 ∥ 전류 — 빠른 길', 'pl-warn', 'start') + TT(840, 1004, wr(K, 'Ni · Cu가 c축 길로 빨리 빠져나가 음극(전자가 들어오는 쪽) 소모가 빠르다 (보고)', 17), 't-dim', 'start', 22);
    gp += T(1200, 976, '③ c축 ⊥ 전류 — 느린 길', 'pl-hdg3', 'start') + TT(1200, 1004, wr(K, '옮겨 가는 길이 느려 소모가 느리다', 17), 't-dim', 'start', 22);
    gp += T(830, 1084, '같은 조건에서도 범프마다 방향이 달라 수명이 흩어진다', 't-sub', 'start');
    s += G(gp, only('grain'));

    // ag3sn: Sn 쪽 상태도 확대 + 창 → 판 길이
    let pd = T(830, 178, 'Sn 쪽 상태도 확대 — 판이 자라는 창', 't-acc', 'start');
    pd += R(px(1.5), PD.y1, px(2.5) - px(1.5), PD.y0 - PD.y1, 'rf06-tgt', tip('범프 SnAg의 Ag 목표 — 보통 1.5~2.5 wt% (작은 범프일수록 낮은 쪽)')) + T(px(2), 220, '목표 1.5~2.5 %', 'rf06-tgl');
    pd += L(PD.x0, PD.y0, PD.x1 + 10, PD.y0, 's-axis') + L(PD.x0, PD.y0, PD.x0, PD.y1 - 6, 's-axis');
    for (let a = 0; a <= 5; a++) pd += L(px(a), PD.y0, px(a), PD.y0 + 7, 's-axis') + T(px(a), PD.y0 + 28, String(a), 't-dim');
    [180, 200, 220, 240].forEach(t => { pd += L(PD.x0 - 7, py(t), PD.x0, py(t), 's-axis') + T(PD.x0 - 12, py(t) + 7, String(t), 't-dim', 'end'); });
    pd += T((PD.x0 + PD.x1) / 2, PD.y0 + 56, 'Ag (wt%) — 남은 솔더의 실효 조성', 't-dim');
    let lq = '';
    LIQ.forEach(([a, t], k) => { lq += (k ? ' L' : 'M') + px(a).toFixed(1) + ',' + py(t).toFixed(1); });
    pd += P(lq, 's-curve', tip('Sn 쪽 액상선 — 이 온도 위에서 다 녹는다 (전해도금 10장 표)'));
    pd += P(`M${px(3.5)},${py(221)} L${px(4)},${py(230)} L${px(5)},${py(243)}`, 's-curve', tip('Ag₃Sn 쪽 액상선 — 공정점(共晶)보다 Ag가 많으면 Ag₃Sn이 먼저 생긴다'));
    pd += L(PD.x0, py(221), PD.x1, py(221), 's-dash') + C(px(3.5), py(221), 7, 'k-acc2', tip('공정점(共晶) — Ag 3.5 %, 221 °C'));
    pd += P(`M${px(3.5 - 51 / 15.6)},${py(170)} L${px(3.5)},${py(221)}`, 'rf06-ta', tip('Ag₃Sn이 생길 수 있는 선 — Ag₃Sn 쪽 액상선을 221 °C 아래로 늘인 근사 (T_A = 221 + 15.6 × (Ag − 3.5))'));
    pd += LB(T(1492, 208, 'Ag₃Sn 액상선', 't-dim', 'end'));                         // β-Sn 액상선 · 221 °C 이름표는 위젯이 (지금 Ag 선을 피해) 그린다
    pd += '<g data-v="pd"></g>';
    pd += L(840, 676, 880, 676, 'rf06-ta') + T(892, 683, 'Ag₃Sn이 생길 수 있는 선 (Ag₃Sn 쪽 액상선을 221 °C 아래로 늘임)', 'rf06-lg', 'start');
    pd += L(840, 706, 880, 706, 'rf06-tn') + T(892, 713, 'β-Sn 굳기 시작 (지금 범프 — 액상선보다 과냉만큼 아래)', 'rf06-lg', 'start');
    pd += '<g data-v="len"></g>';
    s += G(pd, only('ag3sn'));

    // rate: 2 × 2 비교 (지름 25 µm, Sn 소모 0)
    let rt = T(830, 178, '냉각 속도 vs Ag — 무엇이 더 확실한가 (지름 25 µm)', 't-acc', 'start') + T(830, 208, '개념 모델 · 판 길이 = 1 µm/초 (가정) × 창 시간', 't-dim', 'start');
    rt += T(1055, 248, '냉각 1 °C/초', 'pl-hdg') + T(1385, 248, '냉각 10 °C/초', 'pl-hdg');
    rt += TT(852, 384, ['Ag', '1.5 %'], 't-lbl', 'middle', 32) + TT(852, 674, ['Ag', '2.5 %'], 't-lbl', 'middle', 32);
    const rr = K.rng(23);
    RCELL.forEach(([ag, r, x, y]) => {
      const m = model(ag, 0, r, 25), cx = x + RW / 2, cls = {ok: 'rf06-cok', warn: 'rf06-cwarn', ng: 'rf06-cng'}[m.lv];
      let c = R(x, y, RW, RH, cls, {rx: 12});
      c += T(cx, y + 36, m.W > 0 ? `창 ${f1(m.W)} °C · ${f1(m.tw)}초` : '창 닫힘 — β-Sn이 먼저', 't-dim') + T(cx, y + 62, `과냉 ${f0(m.dT)} °C`, 't-dim');
      c += R(cx - 60, y + 200, 120, 36, 'f-cu2') + R(cx - 60, y + 190, 120, 10, 'f-ni') + P(cap(cx, y + 190, 60, 75), 'f-sn2');
      for (let k = 0; k < 12; k++){ const a = rr() * Math.PI, rad = 18 + rr() * 34; c += C(cx + Math.cos(a) * rad * 1.15, y + 186 - Math.sin(a) * rad * 0.95, 2.4, 'pl-ag3 rf06-dot'); }
      if (m.L >= 0.5){ const len = Math.max(6, m.L * 4.8), th = Math.max(3.5, len / 12); c += R(cx + 2 - len / 2, y + 166 - th / 2, len, th, 'pl-ag3 rf06-plate', {transform: `rotate(-15 ${cx + 2} ${y + 166})`}); }
      c += T(cx, y + 262, cellTxt(m), {ok: 't-sub', warn: 'rf06-vwarn2', ng: 'rf06-vng2'}[m.lv]);
      rt += G(c, tip(`Ag ${ag} % · 냉각 ${r} °C/초 · 지름 25 µm\n과냉 ${f0(m.dT)} °C → β-Sn 굳기 시작 ${f0(m.TN)} °C, Ag₃Sn ${f1(m.TA)} °C부터\n판 약 ${f1(m.L)} µm (추정)`));
    });
    rt += '<g data-v="rt"></g>';
    rt += TT(830, 862, wr(K, 'Ag를 낮추면 창이 거의 닫힌다 — 냉각은 판을 짧게 할 뿐 창은 남는다. 냉각판(08장)이면 초당 10 °C 넘게도 식힐 수 있지만 휨 · 열 응력이 커지고, 작은 범프에서는 빠른 냉각의 효과가 작았다는 보고도 있다.', 33), 't-sub', 'start', 28);
    s += G(rt, only('rate'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 굳는 순서</div>
      ${K.ctl('ag', '도금한 솔더 Ag (wt%)', 0.5, 4, 0.1, DEF.ag)}${K.ctl('sn', 'Sn 소모 — 여러 번 녹여 IMC로 빠진 몫 (%, 05장)', 0, 40, 1, DEF.sn)}
      ${K.ctl('cr', '냉각 속도 (°C/초)', 0, 100, 1, DEF.cr)}${K.ctl('d', '솔더 크기 (지름 µm)', 0, 100, 1, DEF.d)}
      ${K.seg('g', [['1', '① 하나 · c축 세로'], ['3', '② 셋 (쌍정)'], ['h', '③ 하나 · c축 가로']], DEF.g, '다시 굳혀 보기 (결정 모양 예)')}
      ${K.kpis([['과냉', 'k-dt', 'β-Sn 굳기 시작까지'], ['판이 자라는 창', 'k-w', '실효 Ag <span data-o="k-c">2.5</span> % 기준'], ['판이 자랄 수 있는 길이', 'k-l', '추정'], ['β-Sn 결정', 'k-g', '보통 1~몇 개']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('과냉 식 · Ag₃Sn 선 · 유효 성장 속도(1 µm/초)는 공개 보고의 경향(작을수록 과냉↑, 50 µm 아래 범프 과냉 31~55 °C, 판이 생기면 5 µm/초 넘게 자람, SnAg2.5 마이크로범프의 큰 판은 긴 액상 시간 · 여러 번 녹임으로 Ag가 진해진 뒤 보고)에 맞춘 가정값입니다. 길이는 \'자랄 수 있는 길이\'의 대략입니다. 성장 속도를 일정하게 두어 빠른 냉각의 효과를 실제보다 크게 보일 수 있습니다 — 작은 Cu 기둥 범프에서는 Ag를 낮추는 것은 효과가 있었고 빠른 냉각은 효과가 작았다는 보고가 있습니다. 실제 판 크기는 Ni · IMC 표면 · 미량 원소 · 다시 녹인 횟수에 따라 달라집니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, TT, G, LB, tip, W, wrap, PG} = K;
    let touched = false;
    const st = {ag: DEF.ag, sn: DEF.sn, cr: DEF.cr, d: DEF.d, g: DEF.g};
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const FMT = {ag: v => v.toFixed(1) + ' %', sn: v => v + ' %', cr: v => crOf(v) + ' °C/초', d: v => dOf(v) + ' µm'};
    // 미세 Ag₃Sn 그물 (공정(共晶) 조직) — 돔 속 작은 점, 결정적 난수
    const DOTS = [];
    {
      const r = K.rng(17);
      while (DOTS.length < 30){ const x = 285 + r() * 270, y = 830 + r() * 160; if (Math.hypot(x - BX, y - (BY - BH + (BA * BA + BH * BH) / (2 * BH))) < 140 && y < 988) DOTS.push([x, y]); }
      DOTS.push([524, 936]);                                                             // 지시선이 가리키는 점
    }
    // ── 냉각 곡선
    function graph(m, showA){
      const [tEnd, tStep] = TENDS.find(([t]) => t >= 100 / m.r - 1e-9) || TENDS[TENDS.length - 1];
      const sx = (GR.x1 - GR.x0) / tEnd, xt = t => GR.x0 + t * sx, xT = tc => xt((250 - tc) / m.r);
      let s = '';
      for (let t = 0; t <= tEnd + 1e-9; t += tStep) s += L(xt(t), GR.y0, xt(t), GR.y0 + 8, 's-axis') + T(xt(t), GR.y0 + 28, String(t), 't-dim');
      if (m.W > 0){
        const top = Math.min(250, m.TA), bot = Math.max(150, m.TN);
        s += G(R(GR.x0, gy(top), GR.x1 - GR.x0, gy(bot) - gy(top), 'rf06-win', tip(`판이 자라는 창 — Ag₃Sn은 생길 수 있고 β-Sn은 아직 액체인 온도 구간 (${f1(m.W)} °C · ${f1(m.tw)}초)`)), K.on('ag3sn'));
      }
      s += L(GR.x0, gy(221), GR.x1, gy(221), 's-dash', tip('공정점(共晶) 221 °C — 상태도에서 여기서 다 굳어야 하지만 실제로는 더 내려간다'));
      if (m.c <= 3.5) s += L(GR.x0, gy(m.TL), GR.x1, gy(m.TL), 'rf06-tl', tip(`액상선 ${f0(m.TL)} °C (Ag ${f1(m.c)} %) — 이 아래부터 상태도로는 굳기 시작할 온도`));
      if (m.TA > 150 && m.TA < 258) s += G(L(GR.x0, gy(m.TA), GR.x1, gy(m.TA), 'rf06-ta'), K.on('ag3sn'));
      s += L(GR.x0, gy(m.TN), GR.x1, gy(m.TN), 'rf06-tn');
      // 곡선: 250 °C에서 r로 곧게 내려간다 — 굳기 시작에서 튀어 오르지 않는다 (범프의 굳는 열은 바로 빠져나감)
      const p0 = [xt(0), gy(250)], pL = [xT(m.TL), gy(m.TL)], pN = [xT(m.TN), gy(m.TN)], pE = [xt(100 / m.r), gy(150)];
      if (m.W > 0){ const a = Math.min(250, m.TA); s += G(L(xT(a), gy(a), pN[0], pN[1], 'rf06-wseg'), K.on('ag3sn')); }
      if (m.TL < 250) s += L(p0[0], p0[1], pL[0], pL[1], 's-curve', tip(m.c <= 3.5 ? '녹은 솔더 — 액상선 위' : '녹은 솔더 — Ag가 공정점(共晶)보다 많아, 보라 선 아래에서는 Ag₃Sn이 먼저 생길 수 있다'));
      s += L(pL[0], pL[1], pN[0], pN[1], 'rf06-sc', tip(`과냉 액체 — 액상선보다 ${f0(m.dT)} °C 낮아질 때까지 아직 액체`));
      s += L(pN[0], pN[1], pE[0], pE[1], 'rf06-sol', tip('굳은 솔더 (β-Sn + Ag₃Sn)'));
      s += L(pN[0], pN[1] - 15, pN[0], pN[1] + 15, 'rf06-tk') + C(pN[0], pN[1], 7, 'k-ng', tip(`β-Sn 굳기 시작 ${f0(m.TN)} °C — 씨앗 하나가 생기면 범프 전체가 순식간에 굳는다`)) + C(pN[0], pN[1], 16, 'co-ring');
      // 범례 (오른쪽 위 — 곡선이 지나지 않는 자리)
      let lg = L(300, 199, 340, 199, 'rf06-sc') + T(352, 206, `과냉 액체 ${f0(m.dT)} °C — 액상선 아래인데 아직 액체`, 'rf06-lg', 'start');
      lg += C(320, 226, 6, 'k-ng') + C(320, 226, 13, 'co-ring') + T(352, 233, '굳기 시작 — 씨앗 하나로 순식간에', 'rf06-lg', 'start');
      lg += G(R(300, 245, 40, 16, 'rf06-win') + T(352, 260, m.W > 0 ? `판이 자라는 창 ${f1(m.W)} °C · ${f1(m.tw)}초` : '창 닫힘 — β-Sn이 먼저 굳는다', 'rf06-lab rf06-lta', 'start'), K.on('ag3sn'));
      s += LB(lg);
      // 선 이름표: 오른쪽 끝, 제 선 바로 위나 아래 — 다른 가로선이 글자를 지나지 않는 쪽을 고른다 (색으로 선과 짝)
      // 액상선과 221 °C 선이 32 px(8 °C)보다 가까우면 사이에 이름표가 못 들어가므로 한 줄로 합친다
      const aOn = showA && m.TA > 150 && m.TA < 258;
      const hz = [gy(221), gy(m.TN)].concat(m.c <= 3.5 ? [gy(m.TL)] : [], aOn ? [gy(m.TA)] : []);   // 지금 보이는 가로선
      const labs = [];                                                                   // [선 위 y, 선 아래 y, 글, 클래스, 속성, 먼저 볼 쪽]
      if (m.c <= 3.5 && m.TL - 221 < 8) labs.push([gy(m.TL), gy(221), `액상선 ${f0(m.TL)} °C · 공정점(共晶) 221 °C`, 'rf06-ltl', null, 'up']);
      else {
        if (m.c <= 3.5) labs.push([gy(m.TL), gy(m.TL), `액상선 ${f0(m.TL)} °C`, 'rf06-ltl', null, 'up']);
        labs.push([gy(221), gy(221), '공정점(共晶) 221 °C', 'rf06-l221', null, 'dn']);
      }
      if (aOn) labs.push([gy(m.TA), gy(m.TA), `Ag₃Sn 생길 수 있음 ${f0(m.TA)} °C`, 'rf06-lta', K.on('ag3sn'), m.TA > 221 ? 'up' : 'dn']);
      labs.push([gy(m.TN), gy(m.TN), `β-Sn 굳기 시작 ${f0(m.TN)} °C`, 'rf06-ltn', null, 'dn']);
      labs.sort((a, b) => a[0] - b[0]);
      const Y0 = showA ? 290 : 262, Y1 = 594, GAP = 25, ys = [];                        // 범례(창 줄은 ag3sn부터) 아래 · 가로축 위, 이름표끼리 25 px
      const clear = b => hz.every(v => v < b - 19 || v > b + 6);                         // 글자 높이(기준선 위 19 · 아래 6 px)에 가로선이 없다
      const fits = b => b >= Y0 && b <= Y1 && ys.every(v => Math.abs(v - b) >= GAP);
      labs.forEach(l => {
        const up = l[0] - 9, dn = l[1] + 23, cand = l[5] === 'up' ? [up, dn] : [dn, up];
        // 선이 셋 이상 몰리면(큰 솔더 · 아주 느린 냉각) 바로 아래 가까운 선 밑으로, 그래도 안 되면 앞 이름표 밑에 쌓는다
        const more = hz.filter(v => v > l[1] && v - l[1] < 40).sort((a, b) => a - b).map(v => v + 23).concat(ys.length ? [Math.max(...ys) + GAP] : []);
        let y = cand.concat(more).find(b => fits(b) && clear(b));
        if (y == null) y = cand.find(fits);
        if (y == null) y = Math.min(Y1, Math.max(cand[0], Y0, ys.length ? Math.max(...ys) + GAP : 0));
        ys.push(y); l.push(y);
      });
      // 빨리 식히면 곡선이 오른쪽 아래 모서리로 가서 이름표를 가로지른다 → 곡선 · 굳기 시작 점과 겹치는 이름표는 세로축 옆(왼쪽)으로
      const wEst = t => [...t].reduce((a, ch) => a + (/[가-힣一-鿿]/.test(ch) ? 20 : 11.5), 0);
      const xAt = y => xT(150 + (GR.y0 - y) / 4);                                   // 그 높이에서 곡선의 x (곧은 선)
      const hit = (x0, x1, y) => { const a = xAt(y - 19), b = xAt(y + 5); return (Math.max(x0, Math.min(a, b)) <= Math.min(x1, Math.max(a, b))) || (pN[0] + 18 > x0 && pN[0] - 18 < x1 && pN[1] + 18 > y - 19 && pN[1] - 18 < y + 5); };
      const leftY = [];
      labs.forEach(([, , t, c, o, , y]) => {
        const w = wEst(t);
        let x = 756, an = 'end';
        if (hit(756 - w - 6, 762, y) && !hit(GR.x0 + 6, GR.x0 + 20 + w, y) && leftY.every(v => Math.abs(v - y) > 25)){ x = GR.x0 + 12; an = 'start'; leftY.push(y); }
        s += LB(T(x, y, t, 'rf06-lab ' + c, an), o);
      });
      return s;
    }
    // ── 범프 단면
    function bump(m, g, sid){
      let cl = '';                                                                       // 돔 모양으로 자르는 묶음
      // under: 과냉 액체 + 씨앗 하나에서 번지는 굳는 앞면
      cl += G(P(DOME, 'rf06-liq') + `<circle cx="500" cy="990" r="0" class="rf06-front"><animate attributeName="r" values="0;0;300;300" keyTimes="0;.3;.72;1" dur="4.5s" repeatCount="indefinite"/></circle>`, K.only('under'));
      // grain~: 결정 (색 = 방향, 결 = c축 방향)
      let gr = '';
      GRAINS[g].forEach(q => { gr += R(260, 790, 320, 220, 'rf06-tint', W({style: 'fill:' + q.col}, q.clip ? {'clip-path': K.url(q.clip)} : null)) + hatch(K, q.th, q.cx, q.cy, 14, q.clip); });
      cl += G(gr, K.on('grain'));
      cl += G(DOTS.map(([x, y]) => C(x, y, 3.4, 'pl-ag3 rf06-dot')).join(''), W(K.on('grain'), tip('미세 Ag₃Sn 그물 — 공정(共晶) 조직. β-Sn 사이의 아주 작은 Ag₃Sn. 정상 모습')));
      // ag3sn~: Ag₃Sn 판 (길이 = 위젯, 지름 대비 비율)
      const len = m.L * 2 * BA / m.D, th = Math.max(4, len / 12);
      if (m.L >= 1) cl += G(R(425 - len / 2, 958 - th / 2, len, th, 'pl-ag3 rf06-plate', W({transform: 'rotate(-15 425 958)'}, tip(`Ag₃Sn 판 약 ${f1(m.L)} µm (추정) — 굳기 전에 액체 속에서 자랐다. 균열이 지나가기 쉬운 길`))), K.on('ag3sn'));
      let s = G(cl, {'clip-path': K.url('rf06-clip')});
      // 결정 경계 · c축 (자르지 않아 촉이 보이게)
      let gb = '';
      if (g === '3') gb += P(`M${PLp[0]},${PLp[1]} L${J[0]},${J[1]} L${PRp[0]},${PRp[1]} M${J[0]},${J[1]} L420,1000`, 'rf06-gb', tip('결정 경계 — 쌍정 셋이 만나는 곳'));
      GRAINS[g].forEach(q => { const a = q.th * Math.PI / 180; gb += cax(K, q.cx, q.cy, q.th, q.hl, 'rf06-cx') + T(q.cx + Math.sin(a) * (q.hl + 15), q.cy - Math.cos(a) * (q.hl + 15) + 7, 'c', 'rf06-ct'); });
      s += G(gb, K.on('grain'));
      // 씨앗 (under)
      s += G(C(500, 990, 6, 'k-ng') + C(500, 990, 16, 'co-ring'), K.only('under'));
      // 머리글 · 지시선
      s += T(94, 696, '범프 단면 — 솔더 속', 't-acc', 'start') + T(750, 696, `지름 ${m.D} µm (그림 크기 고정)`, 't-dim', 'end');
      s += G(T(94, 726, `씨앗 하나가 생기면 굳는 앞면이 범프 전체를 휩쓴다`, 't-dim', 'start'), K.only('under'));
      s += G(T(94, 726, GNAME[g], 't-dim', 'start'), K.only('grain'));
      s += G(T(94, 726, '회색 판 = Ag₃Sn 판 (지름 대비 비율로 그림)', 't-dim', 'start'), K.on('ag3sn'));
      s += G(K.lead(330, 900, 250, 866, '과냉 액체', 'end', 't-sub') + LB(T(242, 900, `${f0(m.TN)} °C까지`, 't-dim', 'end')), K.only('under'));
      s += G(K.lead(500, 990, 592, 948, '씨앗 (핵)', 'start', 't-sub'), K.only('under'));
      s += G(K.lead(g === '3' ? 325 : 360, g === '3' ? 945 : 880, 250, 866, 'β-Sn 결정', 'end', 't-sub'), K.on('grain'));
      if (g === '3') s += G(K.lead(480, 895, 584, 866, '결정 경계', 'start', 't-sub'), K.on('grain'));
      const dy = g === '3' ? 932 : 912;
      s += G(K.lead(524, 936, 584, dy, '미세 Ag₃Sn', 'start', 't-dim') + LB(T(592, dy + 31, '그물 (정상)', 't-dim', 'start')), K.on('grain'));
      if (m.L >= 1){ const ex = 425 - len / 2 * Math.cos(15 * Math.PI / 180), ey = 958 + len / 2 * Math.sin(15 * Math.PI / 180); s += G(K.lead(ex + 4, ey - 1, 250, 922, 'Ag₃Sn 판', 'end', 'rf06-lab rf06-lta') + LB(T(242, 954, `약 ${f1(m.L)} µm`, 'rf06-lab rf06-lta', 'end')), K.on('ag3sn')); }
      else s += G(LB(T(242, 928, 'Ag₃Sn 판 없음', 't-dim', 'end') + T(242, 954, '(작은 알갱이만)', 't-dim', 'end')), K.on('ag3sn'));
      return s;
    }
    // ── under 패널: 크기별 과냉 막대 + 지금 설정
    function underP(m){
      const BS = 4.5, X0 = 1080, refs = [['솔더 볼', 500], ['범프', 100], ['마이크로범프', 25]];
      const near = refs.reduce((b, x, i) => Math.abs(Math.log(x[1] / m.D)) < Math.abs(Math.log(refs[b][1] / m.D)) ? i : b, 0);
      let s = '';
      refs.forEach(([nm, d], i) => {
        const y = 236 + i * 80, q = model(2.5, 0, 2, d).dT;
        s += T(840, y + 28, `${nm} ${d} µm`, i === near ? 't-acc' : 't-sub', 'start');
        s += R(X0, y + 8, q * BS, 30, i === near ? 'rf06-barhl' : 'pl-bar', tip(`지름 ${d} µm · 2 °C/초 → 과냉 약 ${f0(q)} °C (개념 모델)`)) + T(X0 + q * BS + 10, y + 31, `약 ${f0(q)} °C`, 't-sub', 'start');
      });
      const y = 486;
      s += R(826, y - 6, 712, 80, 'pl-hlbox', {rx: 10});
      s += T(840, y + 26, '지금 설정', 'pl-hdg', 'start') + T(840, y + 56, `${m.D} µm · ${m.r} °C/초`, 't-dim', 'start');
      s += R(X0, y + 10, m.dT * BS, 30, 'rf06-barnow') + T(X0 + m.dT * BS + 10, y + 33, `${f0(m.dT)} °C`, 't-warn', 'start');
      return s;
    }
    // ── ag3sn 패널: 상태도 위 지금 값
    function pdP(m){
      let s = '';
      const xc = px(m.c), out = m.c > 5;
      // T_N이 그래프 아래(170 °C 밑)로 가면 선은 그리지 않고 축 위에 이름표만 — 창은 그래프 안에서 자른다
      const lowN = m.TN < 170, tn = Math.max(170, m.TN), yN = py(tn), nUp = yN + 24 > 586;   // nUp: 이름표를 선 위로
      // 고정 이름표 (β-Sn 액상선 · 221 °C): 지금 Ag 세로선 · 과냉 화살표와 겹치면 그 오른쪽으로
      const vx = [xc].concat(m.sn > 0 ? [px(m.ag0)] : []);
      const lxOf = (x0, w) => { let x = x0; for (let k = 0; k < 3; k++){ const inZ = vx.filter(v => v > x - 22 && v < x + w + 10); if (!inZ.length) break; x = Math.max(...inZ) + 24; } return x; };
      const lxS = lxOf(890, 118), lx221 = lxOf(890, 200), m221 = lx221 !== 890;
      // 옮긴 221 °C 이름표는 선 아래에 (선 위는 β-Sn 액상선이 지나간다). 늘인 Ag₃Sn 선에 닿으면 짧게
      const y221 = !m221 ? py(221) - 9 : (yN > py(221) - 4 && yN < py(221) + 34) ? yN + 22 : py(221) + 22;   // 굳기 시작 선이 바로 아래면 그 밑으로
      const t221 = m221 && lx221 > 1040 ? '221 °C' : '221 °C 공정점(共晶)';
      s += LB(T(lxS, 282, 'β-Sn 액상선', 't-dim', 'start') + T(lx221, y221, t221, 't-dim', 'start'));
      // 창: T_N과 늘인 Ag₃Sn 선 사이 (Ag가 많을수록 넓다)
      if (m.TN < 244){
        const xw = Math.max(0, 3.5 + (tn - 221) / 15.6);
        const pts = [[px(xw), yN], [px(5), yN], [px(5), py(tA(5))]];
        if (xw <= 0) pts.push([px(0), py(Math.max(170, tA(0)))]);
        s += PG(pts, 'rf06-win', tip('판이 자랄 수 있는 곳 — Ag₃Sn은 생길 수 있고 β-Sn은 아직 액체'));
        // 이름표: 창 막대 이름표(지금 Ag 오른쪽) · 굳기 시작 이름표와 겹치면 위로 올리고, 보라 선 밖으로 나가면 뺀다
        const rx0 = 1492 - 205, wy = (py(Math.min(250, m.TA)) + yN) / 2 + 8;
        let ry = nUp ? yN - 38 : yN - 12;
        if (m.W > 0 && !out && xc + 137 > rx0 && Math.abs(wy - ry) < 28) ry = wy - 30;
        if (m.c < 4 && xc + 17 < rx0 && ry - 22 > py(tA((rx0 - PD.x0) / (PD.x1 - PD.x0) * 5))) s += LB(T(1492, ry, '판이 자랄 수 있는 곳', 'rf06-lab rf06-lta', 'end'));
      }
      if (!lowN) s += L(PD.x0, yN, PD.x1, yN, 'rf06-tn');
      // 굳기 시작 이름표: 오른쪽 끝 — 지금 Ag 세로선(과냉 화살표 · 창 막대)이 그 자리를 지나면 세로선 왼쪽으로
      const tnT = `굳기 시작 ${f0(m.TN)} °C` + (lowN ? ' (그래프 아래)' : ''), tnW = lowN ? 280 : 175;
      const tnX = !out && xc > 1492 - tnW - 24 ? xc - 26 : 1492;
      s += LB(T(tnX, nUp ? yN - 10 : yN + 24, tnT, 'rf06-lab rf06-ltn', 'end'));
      // 처음 Ag · 실효 Ag
      if (m.sn > 0){
        s += L(px(m.ag0), PD.y0, px(m.ag0), PD.y1 + 40, 's-dash') + LB(T(px(m.ag0) - 6, 256, `도금 ${f1(m.ag0)} %`, 'rf06-agl', 'end'));
        if (xc - px(m.ag0) > 14) s += K.arrow(px(m.ag0) + 2, 268, xc - 3, 268, 's-arr2');
      }
      const hiC = xc > 1380;                                                         // 오른쪽 끝: 이름표를 선 왼쪽 · 한 줄 위로
      s += L(xc, PD.y0, xc, PD.y1 + 40, 'rf06-cl') + LB(T(hiC ? xc - 6 : xc + 6, hiC && m.sn > 0 ? 234 : 256, (m.sn > 0 ? '실효 ' : 'Ag ') + f1(m.c) + ' %' + (out ? ' (그래프 밖)' : ''), 'rf06-agl2', hiC ? 'end' : 'start'));
      // 과냉 화살표 (액상선 → T_N) · 창 막대 (T_A → T_N)
      if (!out){
        s += C(xc, py(m.TL), 6, 'k-acc', tip(`β-Sn 액상선 ${f0(m.TL)} °C`));
        const left = xc - 150 > PD.x0;                                                  // Ag가 아주 적으면 과냉 이름표를 오른쪽으로
        let ym = (py(m.TL) + py(m.TN)) / 2 + 8;
        if (!left && m221 && Math.abs(ym - y221) < 26) ym = y221 + 30;                  // 옮긴 221 °C 이름표와 겹치면 그 아래로
        s += K.arrow(xc - 12, py(m.TL) + 6, xc - 12, py(m.TN) - 3, 's-arrr') + LB(T(left ? xc - 22 : xc + 22, ym, `과냉 ${f0(m.dT)} °C`, 'rf06-lab rf06-ltn', left ? 'end' : 'start'));
        if (m.W > 0){ const ta = Math.min(250, m.TA), wy = (py(ta) + py(m.TN)) / 2 + 8; s += L(xc + 9, py(ta), xc + 9, py(m.TN), 'rf06-wseg2') + LB(T(xc + 22, left || Math.abs(wy - ym) > 26 ? wy : ym + 28, `창 ${f1(m.W)} °C`, 'rf06-lab rf06-lta', 'start')); }
      }
      return s;
    }
    // ── ag3sn 패널 아래: 창 → 판 길이
    function lenP(m){
      let s = T(830, 762, '창 → 판 길이 (개념 모델 · 성장 1 µm/초 가정)', 't-acc', 'start');
      const ls = [];
      if (m.sn > 0) ls.push(`실효 Ag = ${f1(m.ag0)} ÷ (1 − ${(m.sn / 100).toFixed(2)}) = ${f1(m.c)} %`);
      if (m.W > 0){ ls.push(`창 ${f1(m.W)} °C ÷ ${m.r} °C/초 = ${f1(m.tw)}초`); ls.push(`판 ≈ 1 µm/초 × ${f1(m.tw)}초 = ${f1(m.L)} µm` + (m.L >= 0.9 * m.D - 1e-9 ? ' (지름의 0.9배에서 멈춤)' : '')); }
      else { ls.push(`창 없음 — β-Sn이 ${f0(m.TN)} °C에서 먼저 굳는다`); ls.push('판 ≈ 0 µm (작은 알갱이 · 그물만)'); }
      ls.forEach((t, k) => { s += T(840, 800 + k * 34, t, 'pl-eqn', 'start'); });
      const yb = 800 + ls.length * 34 - 4, BW = 660, sc = BW / m.D;
      s += R(840, yb, BW, 26, 'rf06-dbar') + T(852, yb + 20, `범프 지름 ${m.D} µm`, 'rf06-dbt', 'start');
      s += R(840, yb + 32, Math.max(0, Math.min(BW, m.L * sc)), 18, 'pl-ag3 rf06-plate', tip(`판 약 ${f1(m.L)} µm (추정)`));
      const m3 = 840 + 3 * sc, mh = 840 + BW / 2;
      s += L(m3, yb - 4, m3, yb + 56, 'rf06-mk') + L(mh, yb - 4, mh, yb + 56, 'rf06-mk');
      s += LB(T(m3 + 6, yb + 76, '3 µm', 't-dim', 'start') + T(mh + 6, yb + 76, '지름의 절반', 't-dim', 'start'));
      s += T(840, yb + 112, verd(m), {ok: 'rf06-vok', warn: 'rf06-vwarn', ng: 'rf06-vng'}[m.lv], 'start');
      s += T(830, 1078, '판은 Ag가 많을수록 · 과냉이 클수록 · 천천히 식을수록 길어진다', 't-sub', 'start');
      return s;
    }
    // ── rate 패널: 지금 설정과 맞는 칸 강조 + 지금 값
    function rateP(m){
      let s = '';
      RCELL.forEach(([ag, r, x, y]) => { if (Math.abs(m.c - ag) < 0.05 && m.r === r && m.D === 25) s += R(x - 4, y - 4, RW + 8, RH + 8, 'pl-hlbox', {rx: 14}) + R(x + RW - 84, y - 16, 72, 30, 'rf06-pill', {rx: 15}) + T(x + RW - 48, y + 6, '지금', 'rf06-pillt'); });
      s += R(826, 966, 712, 120, 'pl-box', {rx: 10});
      s += T(846, 1000, `지금 설정: Ag ${f1(m.c)} % · ${m.r} °C/초 · 지름 ${m.D} µm → 판 약 ${f1(m.L)} µm`, 'pl-hdg', 'start');
      s += T(846, 1032, verd(m), {ok: 'rf06-vok2', warn: 'rf06-vwarn2', ng: 'rf06-vng2'}[m.lv], 'start');
      s += T(846, 1066, '모델은 성장 속도를 일정하게 두어 빠른 냉각의 효과를 크게 보일 수 있다', 't-dim', 'start');
      return s;
    }
    function render(){
      const r = crOf(st.cr), D = dOf(st.d), m = model(st.ag, st.sn, r, D), sid = ctx.step();
      const showA = !sid || sid === 'ag3sn' || sid === 'rate';
      ctx.$('[data-v="gr"]').innerHTML = graph(m, showA);
      ctx.$('[data-v="bump"]').innerHTML = bump(m, st.g, sid);
      ctx.$('[data-v="und"]').innerHTML = underP(m);
      ctx.$('[data-v="pd"]').innerHTML = pdP(m);
      ctx.$('[data-v="len"]').innerHTML = lenP(m);
      ctx.$('[data-v="rt"]').innerHTML = rateP(m);
      ctx.out('k-dt', f0(m.dT) + ' °C'); ctx.out('k-c', f1(m.c));
      ctx.out('k-w', m.W > 0 ? `${f1(m.W)} °C · ${f1(m.tw)}초` : '닫힘');
      ctx.out('k-l', (m.L < 0.05 ? '0' : f1(m.L)) + ' µm'); ctx.out('k-g', st.g === '3' ? '3개 (쌍정)' : '1개');
      const kl = ctx.card.querySelector('[data-o="k-l"]').parentNode;
      ['ok', 'warn', 'ng'].forEach(c => kl.classList.toggle(c, m.lv === c));
      const kw = ctx.card.querySelector('[data-o="k-w"]').parentNode;
      kw.classList.toggle('ok', m.W <= 0); kw.classList.toggle('warn', m.W > 0);
      let msg = `<b>${verd(m)}.</b> β-Sn은 <b>${f0(m.TN)} °C</b>에서 굳기 시작합니다(과냉 ${f0(m.dT)} °C). `;
      msg += m.W > 0 ? `Ag₃Sn은 ${f1(m.TA)} °C부터 생길 수 있어, 그 사이 <b>${f1(m.W)} °C · ${f1(m.tw)}초</b> 동안 판이 자랄 수 있습니다 → 약 <b>${f1(m.L)} µm</b>(추정).` : `Ag₃Sn이 생길 온도(${f1(m.TA)} °C)보다 β-Sn이 먼저 굳어 큰 판이 자랄 틈이 없습니다.`;
      if (m.ag0 >= 1.5 - 1e-9 && m.ag0 <= 2.5 + 1e-9 && m.W > 0) msg += ' 보통 목표 범위 안이지만 이 크기 · 냉각에서는 판이 자랄 수 있는 창이 열립니다. 작은 범프일수록 범위의 낮은 쪽이 안전하고, 실제 판은 단면으로 확인합니다(<a href="#go-plating-10">전해도금 10장</a>의 \'목표\'는 공정점(共晶)보다 낮게라는 뜻).';
      if (m.sn > 0) msg += ` Sn이 IMC로 ${m.sn} % 빠져 남은 솔더의 Ag가 ${f1(m.ag0)} → <b>${f1(m.c)} %</b>로 진해졌습니다.`;
      ctx.q('[data-o=msg]').innerHTML = msg;
      ctx.refresh();
    }
    ['ag', 'sn', 'cr', 'd'].forEach(k => ctx.range(k, v => { st[k] = v; render(); return FMT[k](v); }));
    ctx.seg('g', (v, user) => {
      st.g = v;
      if (user){ touched = true; if (ctx.step() === 'under'){ ctx.go('grain'); return; } }
      render();
    });
    // 손으로 움직이면 그 값을 그대로 둔다. Ag · Sn 소모는 판이 보이는 단계로
    ['ag', 'sn', 'cr', 'd'].forEach(k => inp(k).addEventListener('input', () => {
      touched = true;
      const sid = ctx.step();
      if ((k === 'ag' || k === 'sn') && (sid === 'under' || sid === 'grain')) ctx.go('ag3sn');
    }));
    const setSeg = v => ctx.card.querySelectorAll('.pl-seg[data-g="g"] button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    ctx.demo = sid => {
      if (!touched){
        const o = Object.assign({}, DEF, DEMO[sid] || {});
        ['ag', 'sn', 'cr', 'd'].forEach(k => { inp(k).value = o[k]; st[k] = +o[k]; ctx.out(k, FMT[k](+o[k])); });
        st.g = o.g; setSeg(o.g);
      }
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['과냉', '녹는 온도(액상선)보다 낮아졌는데도 굳지 않고 액체로 있는 상태. 또는 그 온도 차(°C)'],
      ['핵생성 (씨앗)', '새 결정이 처음 생기는 일. β-Sn은 씨앗이 잘 생기지 않아 과냉이 크고, Ag₃Sn은 쉽게 생긴다'],
      ['β-Sn', '실온 · 사용 온도에서의 주석 결정(체심 정방). 방향에 따라 성질이 다르다'],
      ['c축', '정방 결정에서 길이가 다른 한 축(β-Sn은 짧은 축). 열팽창 · 단단함 · 확산이 이 방향에서 크게 다르다'],
      ['쌍정', '한 결정이 일정한 각도(β-Sn은 약 60°)로 돌아간 이웃 결정과 짝을 이룬 것. 셋이 모이면 단면이 비치볼처럼 보인다'],
      ['Ag₃Sn 판 · 공정(共晶) 조직', '판 = 굳기 전에 액체 속에서 판 모양으로 길게 자란 Ag₃Sn. 정상 모습은 공정(共晶) 조직 — β-Sn 사이에 아주 작은 Ag₃Sn이 그물처럼 흩어진 것'],
      ['굳는 열', '액체가 굳을 때 나오는 열. 큰 시편(DSC — 열 출입을 재며 데우고 식히는 시험)에서는 온도가 잠깐 튀어 오르지만, 웨이퍼 위 범프는 열이 바로 Cu 기둥 · 웨이퍼로 빠져 거의 보이지 않는다'],
      ['전자이동', '큰 전류가 흐를 때 전자가 원자를 밀어 옮기는 현상. Sn 속 Ni · Cu는 c축을 따라 빨리 옮겨 간다']
    ]) + K.field([
      '큰 Ag₃Sn 판이 보이면 <span class="pl-tag up">앞 공정</span> Ag %(XRF — X선 형광으로 잰 조성) 맵, <span class="pl-tag rf06-cond">리플로우-조건</span> 냉각 속도 · 녹아 있던 시간, <span class="pl-tag dn">뒤 공정</span> 다시 녹인 횟수(적층 본딩)를 함께 봅니다. 여러 번 · 오래 녹이면 Sn이 IMC로 빠져 남은 솔더의 Ag가 진해집니다(위 · 아래 두 계면이면 두 배 빨리) → <a data-go="imc.budget">05장</a> · <a href="#go-plating-10">전해도금 10장</a>.',
      '같은 조건에서도 범프마다 결정 방향이 달라 신뢰성 시험(열 순환 · 전자이동) 결과가 흩어집니다. 표본 수를 넉넉히 잡고, 불량 범프의 결정 방향(EBSD — 전자선으로 결정 방향을 재는 분석)을 함께 봅니다.',
      '냉각 장치(냉각판 · 질소 바람 · 이송 속도)가 바뀌면 냉각 속도가 바뀝니다. 측정용 웨이퍼로 냉각 구간도 잽니다 → <a data-go="profile.cool">02장</a>. 다만 작은 범프에서는 냉각보다 Ag가 판을 더 크게 좌우한다는 보고가 있어, 냉각만으로 판을 잡으려 하지 않습니다.',
      '재료 자료의 DSC 과냉 값은 mg 크기 시편이라 마이크로범프보다 작게 나옵니다. 범프는 그보다 더 낮은 온도까지 액체로 남을 수 있다고 생각하고, Ag₃Sn 판은 실제 범프 단면(연마 · 가벼운 식각 · 전자 현미경)으로 확인합니다.'
    ]) + K.deep(`<ul>
      <li><b>β-Sn 이방성</b> — 체심 정방, a = b = 5.83 Å, c = 3.18 Å. 열팽창과 영률이 c축 방향에서 a축의 약 2배 · 3배입니다. Ni가 c축으로 퍼지는 빠르기는 a축보다 약 3×10⁴배(150 °C) ~ 7×10⁴배(120 °C) 빠르다는 보고가 있습니다 — c축 방향으로 열린 통로를 따라 Ni · Cu가 원자 사이 틈으로 빠르게 움직이기 때문입니다. Cu도 c축을 따라 더 빠르지만 차이는 훨씬 작습니다(보고 수십~수백 배, 온도에 따라 — 수만 배는 Ni 이야기). 그래서 전자 흐름이 c축과 나란한 범프에서 음극(전자가 들어오는 쪽)의 Cu · Ni 소모가 빠르다는 전자이동 보고가 있습니다(Ni 쪽은 (Cu,Ni)₆Sn₅ 층이 있으면 덜함).</li>
      <li><b>결정 수</b> — SAC 접합은 보통 결정 1개 또는 60° 쌍정 셋(단면이 비치볼처럼 보임)으로 굳고, 다섯 방향이 섞인 경우도 보고됩니다. Ni/Sn-2.5Ag/Ni 마이크로범프에서는 작은 Sn 결정이 많이 생겼다는 보고도 있어, '몇 개'는 조건에 따라 다릅니다.</li>
      <li><b>과냉 크기</b> — Sn 계 무연 솔더 약 15~30 °C(볼 크기, 납 많은 솔더보다 훨씬 큼), 순수 Sn은 100 °C 넘게도 보고됩니다. 크기가 작을수록 커져, 50 µm 아래 SAC 범프의 현장 관찰에서 31~55 °C. 미량 원소(Zn · Co · Fe 등)를 넣으면 과냉이 줄어든다는 연구가 있습니다(합금 · 도금액 변경이라 앞 공정 · 재료의 일).</li>
      <li><b>Ag₃Sn 판의 순서</b> — Ag₃Sn은 거의 과냉 없이 생기고 β-Sn은 15~30 °C 과냉이 필요해, 그 사이 액체 속에서 판이 자라 천천히 식히면 접합 단면 전체를 가로지른다는 고전 보고가 있습니다(공정점(共晶)에 가까운 조성의 SAC). 공정점(共晶, 3.5 %)보다 Ag가 적어도, 과냉이 크면 늘인 Ag₃Sn 선(T_A) 아래로 내려가 판이 생길 수 있습니다 — 작은 범프에서 '3 % 미만이면 안전'이라는 일반 기준이 맞지 않는 이유입니다.</li>
      <li><b>작은 범프 대책 보고</b> — 50 µm 아래 Cu 기둥 범프에서 리플로우 냉각을 빠르게 하는 것보다 Ag 함량을 낮추는 것이 판 억제에 효과적이었다는 보고가 있습니다. 더 큰 Sn-3.5Ag 접합에서는 수랭에서만 판이 없었다는 보고도 있어, 크기에 따라 냉각의 효과가 다릅니다.</li>
      <li><b>여러 번 녹인 뒤의 큰 판</b> — Ni 위 SnAg2.5 마이크로범프(솔더 4 µm)를 10분 리플로우하면 큰 Ag₃Sn이 생겼고, Sn이 Ni와 반응해 남은 솔더의 Ag가 진해진 것이 주원인으로 제시되었습니다(같은 조건의 플립칩 범프에는 없음). Cu 위 얇은 솔더(2 µm)에서는 약 1.5~2분 만에 남은 솔더의 Ag가 공정점(共晶) 조성(3.5 %)에 이른다는 추정도 있습니다. 위젯의 'Sn 소모'가 이 경로입니다.</li>
      <li><b>위젯 식</b> (모두 가정값) — ${K.eq('c = Ag₀ / (1 − s)')}${K.eq('ΔT = 15 + 12·log(500/D) + 8·log(r)')}${K.eq('T_N = T_L,Sn(c) − ΔT')}${K.eq('T_A = 221 + 15.6·(c − 3.5)')}${K.eq('L = min(0.9·D, 1 µm/초 × W / r)')} (s = Sn 소모 비율, D = 지름 µm, r = 냉각 °C/초, log = 상용로그, W = T_A − T_N) 예: 25 µm · 2 °C/초 · Ag 2.5 % → 과냉 33 °C, T_N 191 °C, T_A 205.4 °C, 창 14.4 °C · 7.2초 → 약 7.2 µm(경계). Ag 2.0 % → 2.6 µm, 1.5 % → 창 없음, Sn 소모 20 % → 실효 3.1 % → 약 13 µm. 25 µm 범프 솔더는 약 41 ng, 굳는 열 약 2.4 µJ(Sn 약 59 J/g)이라 곡선에 튀어 오름을 그리지 않았습니다.</li></ul>`);
  },
  css: `.pl-svg .rf06-tn{fill:none;stroke:#f87171;stroke-width:2.6;stroke-dasharray:3 5}
.pl-svg .rf06-ta{fill:none;stroke:#a78bfa;stroke-width:2.6;stroke-dasharray:8 6}
.pl-svg .rf06-tl{fill:none;stroke:#cbd5e1;stroke-width:1.4}
.pl-svg .rf06-win{fill:rgba(167,139,250,.2)}
.pl-svg .rf06-sc{fill:none;stroke:#f59e0b;stroke-width:4.5;stroke-dasharray:11 6}
.pl-svg .rf06-sol{fill:none;stroke:#94a3b8;stroke-width:3.4}
.pl-svg .rf06-tk{fill:none;stroke:#f87171;stroke-width:2.4}
.pl-svg .rf06-wseg{fill:none;stroke:#a78bfa;stroke-width:12;stroke-linecap:round;opacity:.5}
.pl-svg .rf06-wseg2{fill:none;stroke:#a78bfa;stroke-width:8;stroke-linecap:round;opacity:.85}
.pl-svg .rf06-gb{fill:none;stroke:#0b1222;stroke-width:2.8}
.pl-svg .rf06-hatch{fill:none;stroke:rgba(15,23,42,.30);stroke-width:1.4}
.pl-svg .rf06-tint{stroke:none}
.pl-svg .rf06-dome{fill:none;stroke:#e2e8f0;stroke-width:1.6}
.pl-svg .rf06-liq{fill:rgba(56,189,248,.30)}
.pl-svg .rf06-front{fill:var(--th-sn);stroke:#f87171;stroke-width:3}
.pl-svg .rf06-plate{stroke:#1e293b;stroke-width:1.4}
.pl-svg .rf06-dot{stroke:none}
.pl-svg .rf06-cx{fill:none;stroke:#5b21b6;stroke-width:3.2}
.pl-svg .rf06-cxh{fill:#5b21b6}
.pl-svg .rf06-cx2{fill:none;stroke:#a78bfa;stroke-width:3}
.pl-svg .rf06-cx2h{fill:#a78bfa}
.pl-svg .rf06-ct{font-size:21px;font-weight:900;fill:#4c1d95 !important;paint-order:stroke;stroke:#f1f5f9;stroke-width:4px;stroke-linejoin:round;text-anchor:middle}
.pl-svg .rf06-ct2{font-size:24px;font-weight:900;fill:#c4b5fd !important}
.pl-svg .rf06-at{fill:#cbd5e1;stroke:#475569;stroke-width:1.2}
.pl-svg .rf06-at2{fill:#a78bfa;stroke:#ede9fe;stroke-width:1.2}
.pl-svg .rf06-cellb{fill:none;stroke:#64748b;stroke-width:1.4;stroke-dasharray:5 4}
.pl-svg .rf06-celle{fill:none;stroke:#94a3b8;stroke-width:1.6}
.pl-svg .rf06-cellf{fill:rgba(148,163,184,.08);stroke:#94a3b8;stroke-width:1.8}
.pl-svg .rf06-nid{fill:#e2e8f0;stroke:#475569;stroke-width:1}
.pl-svg .rf06-lab{font-size:20px;font-weight:800;paint-order:stroke;stroke:#0b1220;stroke-width:5px;stroke-linejoin:round}
.pl-svg .rf06-lg{font-size:19px;fill:#cbd5e1 !important;paint-order:stroke;stroke:#0b1220;stroke-width:5px;stroke-linejoin:round}
.pl-svg .rf06-ltl{fill:#e2e8f0 !important}
.pl-svg .rf06-l221{fill:#94a3b8 !important}
.pl-svg .rf06-lta{fill:#c4b5fd !important}
.pl-svg .rf06-ltn{fill:#fca5a5 !important}
.pl-svg .rf06-barhl{fill:rgba(125,211,252,.85)}
.pl-svg .rf06-barnow{fill:#f59e0b}
.pl-svg .rf06-tgt{fill:rgba(34,197,94,.10)}
.pl-svg .rf06-tgl{font-size:19px;font-weight:800;fill:#86efac !important}
.pl-svg .rf06-cl{fill:none;stroke:#f59e0b;stroke-width:2.6}
.pl-svg .rf06-agl{font-size:19px;font-weight:700;fill:#94a3b8 !important;paint-order:stroke;stroke:#0b1220;stroke-width:5px}
.pl-svg .rf06-agl2{font-size:20px;font-weight:800;fill:#fbbf24 !important;paint-order:stroke;stroke:#0b1220;stroke-width:5px}
.pl-svg .rf06-dbar{fill:rgba(148,163,184,.22);stroke:#94a3b8;stroke-width:1}
.pl-svg .rf06-dbt{font-size:19px;font-weight:700;fill:#e2e8f0 !important}
.pl-svg .rf06-mk{fill:none;stroke:#fbbf24;stroke-width:1.8;stroke-dasharray:4 4}
.pl-svg .rf06-vok,.pl-svg .rf06-vwarn,.pl-svg .rf06-vng{font-size:23px;font-weight:900}
.pl-svg .rf06-vok{fill:#4ade80 !important}
.pl-svg .rf06-vwarn{fill:#fbbf24 !important}
.pl-svg .rf06-vng{fill:#f87171 !important}
.pl-svg .rf06-vok2,.pl-svg .rf06-vwarn2,.pl-svg .rf06-vng2{font-size:21px;font-weight:800}
.pl-svg .rf06-vok2{fill:#4ade80 !important}
.pl-svg .rf06-vwarn2{fill:#fbbf24 !important}
.pl-svg .rf06-vng2{fill:#f87171 !important}
.pl-svg .rf06-cok{fill:rgba(34,197,94,.06);stroke:#4ade80;stroke-width:1.6}
.pl-svg .rf06-cwarn{fill:rgba(245,158,11,.06);stroke:#fbbf24;stroke-width:1.6}
.pl-svg .rf06-cng{fill:rgba(239,68,68,.07);stroke:#f87171;stroke-width:1.6}
.pl-svg .rf06-pill{fill:#f59e0b;stroke:#fde68a;stroke-width:1.4}
.pl-svg .rf06-pillt{font-size:20px;font-weight:900;fill:#1b1203 !important;text-anchor:middle}
.jc .pl-tag.rf06-cond{background:rgba(45,212,191,.18);color:#5eead4}`
});
})();
