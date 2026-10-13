/* 전해도금 07 — 웨이퍼 전류 분포: 왜 가장자리가 두꺼워질까 (웨이퍼 · 300 mm) */
(function(){
const RW = 0.15;                                            // 웨이퍼 반지름 (m)
const WX0 = 170, WX1 = 790, WY = 236;                        // 단면에서 웨이퍼 (아래가 앞면)
const CX0 = 980, CX1 = 1530, CY0 = 500, CY1 = 200, TMIN = 0.5, TMAX = 1.5;   // 두께 그래프
const MAP = {x: 1250, y: 776, r: 160};
// 개념 모델의 값 (공개 문헌 수준의 예시)
const KAPPA = {lo: 5, mid: 20, hi: 50};                      // 액 전도도 (S/m) — 저산 ≈ 5, 고산 ≈ 50
const GAP = 0.02, RHO = 1.9e-8, TAFEL = 0.12, HOLE = 30e-6;  // 양극(또는 고저항판)까지 거리 (m), 시드 비저항 (Ω·m), 타펠 기울기 (V/dec), PR 구멍 깊이 (m)
const PLATE = 2e-3, TAIL = 0.010;                            // 고저항판이 더하는 저항 (Ω·m²), 가장자리 꼬리 길이 (m)
function I0(x){ let s = 1, t = 1; for (let k = 1; k < 40; k++){ t *= (x / 2) * (x / 2) / (k * k); s += t; if (t < 1e-12) break; } return s; }
// 1차원 개념 모델: 가장자리에서 전류를 받는 얇은 시드(면저항 Rs)가 면적당 저항 Rp로 액에 전류를 흘린다 → V(r) ∝ I₀(r/λ)
//  Rp = 간격/κ + 고저항판 + (R_pol + 구멍 속 액 저항) ÷ 개구율   — 개구율로 나누는 것은 범프 자리에서만 생기는 저항뿐
//  R_pol = b / (2.303·J) : 타펠 곡선을 지금 전류밀도에서 직선으로 본 기울기 (J가 작을수록 크다)
function profile(p){
  const k = KAPPA[p.k], f = p.f / 100, J = p.j * 100;      // ASD → A/m²
  const Rs = RHO / (p.seed * 1e-6), Rpol = TAFEL / (2.303 * J), Rint = (Rpol + HOLE / k) / f;
  const Rp = GAP / k + (p.plate ? PLATE : 0) + Rint, lam = Math.sqrt(Rp / Rs);
  // 가장자리 꼬리: '모든 길에 같은 저항(반응 · 고저항판)' ÷ '길마다 다른 저항(액)' 이 클수록 작다. 실드는 꼬리를 직접 가린다
  const wa = (Rint + (p.plate ? PLATE : 0)) / (GAP / k), E = 0.4 / (1 + 4 * wa) * (p.shield ? 0.3 : 1);
  const N = 120, r = [], t = [];
  for (let i = 0; i <= N; i++){
    const rr = RW * i / N;
    let v = I0(rr / lam) / I0(RW / lam) * (1 + E * Math.exp(-(RW - rr) / TAIL));
    if (p.shield) v *= 1 - 0.12 * Math.exp(-(RW - rr) / 0.03);   // 실드는 바깥 몇 cm의 전류를 줄인다
    r.push(rr); t.push(v);
  }
  let num = 0, den = 0;
  for (let i = 1; i <= N; i++){ const rm = (r[i] + r[i - 1]) / 2, tm = (t[i] + t[i - 1]) / 2, dr = r[i] - r[i - 1]; num += tm * rm * dr; den += rm * dr; }
  const mean = num / den, tn = t.map(v => v / mean);
  const mx = Math.max(...tn), mn = Math.min(...tn);
  return {r, t: tn, lam, Rpol, E, ce: 1 / I0(RW / lam), center: tn[0], edge: tn[N], unif: (mx - mn) / 2 * 100, at: rr => tn[Math.min(N, Math.round(Math.abs(rr) / RW * N))]};
}
// 2.6×10⁻⁴ 처럼 (가수 1자리 소수 × 10의 거듭제곱)
const SUP = {'-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹'};
function sci(v){
  let e = Math.floor(Math.log10(Math.abs(v))), m = +(v / Math.pow(10, e)).toFixed(1);
  if (m >= 10){ m = +(m / 10).toFixed(1); e += 1; }
  return `${m.toFixed(1)}×10${String(e).split('').map(c => SUP[c]).join('')}`;
}
// 위젯이 권하는 손잡이: 지금 꺼져 있거나 더 움직일 수 있는 것 중, 이 모델에서 실제로 균일도가 좋아지는 것만
const KDN = {hi: 'mid', mid: 'lo'}, KUP = {lo: 'mid', mid: 'hi'};
function levers(st, now, kind){
  // 터미널 효과가 큰데 전도도↑ 를 권할 때는 왜 그런지 함께 적는다 (전도도↑ 는 터미널 효과를 키우지만 가장자리 꼬리를 더 줄인다)
  const why = kind === 'terminal' ? '(중심은 조금 더 얇아지지만 가장자리 꼬리가 더 줄어 전체 범위는 줄어듭니다)' : '';
  const L = [
    [!st.plate, {plate: true}, ['고저항판을 넣거나', '고저항판을 넣어 보세요']],
    [!st.shield, {shield: true}, ['실드를 켜거나', '실드를 켜 보세요']],
    [st.j > 2, {j: Math.max(2, Math.round(st.j / 2))}, ['전류밀도를 낮추거나', '전류밀도를 낮춰 보세요']],
    [!!KDN[st.k], {k: KDN[st.k]}, ['전도도를 낮추거나', '전도도를 낮춰 보세요']],
    [!!KUP[st.k], {k: KUP[st.k]}, ['전도도를 높이거나' + why, '전도도를 높여 보세요' + why]]
  ];
  const good = L.filter(l => l[0]).map(l => [l[2], profile(Object.assign({}, st, l[1])).unif]).filter(x => x[1] < now - 0.3).sort((a, b) => a[1] - b[1]).slice(0, 2);
  return good.length ? good.map((x, i) => x[0][i < good.length - 1 ? 0 : 1]).join(' ') + '.'
    : '위젯의 손잡이로는 더 나아지지 않습니다 — 시드 두께(앞 공정) · 구역 양극(애노드) 같은 다른 수단이 필요합니다.';
}
// 발표 모드 · 처음 볼 때 단계마다 보여 줄 예시 값 (사용자가 손대면 멈춘다)
const DEMO = {prim: {seed: 1.0, plate: false, shield: false}, term: {seed: 0.1, plate: false, shield: false}, fix: {seed: 0.1, plate: true, shield: true}, map: {seed: 0.3, plate: true, shield: true}};
// [비도금] 꼬리표 — 장면용 · 카드용
const tagS = (K, x, y) => K.G(K.R(x, y - 20, 74, 28, 'p07-bdg', {rx: 7}) + K.T(x + 37, y + 1, '비도금', 'p07-bdgt'), K.tip('비도금 인자 — 앞 공정 · 설계가 정한다 (도금 공정이 바꿀 수 없다)'));
const VN_XS = {x: 30, y: 120, w: 900, h: 670}, VN_MAP = {x: 30, y: 330, w: 900, h: 790};
const tagC = '<span class="pl-tag up" title="비도금 인자 — 앞 공정 · 설계가 정한다">비도금</span>';

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '07', id: 'wafer', part: 2, short: '웨이퍼 분포', scale: '웨이퍼 · 300 mm',
  title: '웨이퍼 분포 — 왜 가장자리가 두꺼워질까?',
  hook: '전기는 가장자리로 들어온다',
  one: '도금되는 웨이퍼, 곧 음극(캐소드, −)의 가장자리는 전기가 들어오는 입구인 접점(콘택트)과 가깝고, 전류가 모이기 쉬운 모서리라서 두꺼워지기 쉽습니다. 시드가 얇을수록 중심까지 가는 동안 전압을 잃어 차이가 커집니다. 고르게 만들려면 모든 길에 같은 큰 저항을 더하거나, 몰리는 가장자리 전류를 덜어 냅니다.',
  ana: '<b>구멍이 숭숭 뚫린 물호스</b> — 수도꼭지(가장자리 접점)에서 들어온 물(전류)이 가는 내내 구멍(도금액 쪽)으로 샙니다. 꼭지에 가까운 구멍은 세게, 먼 끝(웨이퍼 중심)은 약하게 나옵니다. 호스가 굵으면(시드가 두꺼우면) 끝까지 고르고, 구멍마다 좁은 노즐(고저항판 · 억제제)을 달아도 고르게 됩니다. <i>한계: 중요한 것은 시드 저항과 "새는 길" 저항의 비율이고, 모서리로 몰리는 가장자리 효과는 이 비유에 없습니다.</i>',
  // viewN: 좁은(세로) 무대에서만 쓸 확대 영역 — 단면(왼쪽 위) · 맵 읽기(왼쪽 아래). 엔진이 step.viewN을 읽을 때만 쓰인다
  steps: [
    {id: 'prim', t: '1차 분포 — 모서리에 몰린다', d: '반응 저항(04장의 톨게이트 — 곡선이 완만할수록 큽니다)이 없는 최악의 경우(1차 분포)에는 전류선이 웨이퍼 모서리로 몰려 가장자리가 두꺼워집니다. 억제제 · 낮은 전류밀도로 반응 저항이 크면 덜 몰립니다. 범프 웨이퍼에서는 가장자리 다이가 외톨이 범프처럼 전류를 더 받기도 합니다.', viewN: VN_XS},
    {id: 'term', t: '터미널 효과 — 구멍 뚫린 호스', d: '전류는 가장자리 접점에서 들어와 얇은 시드를 타고 중심으로 가면서 내내 액 쪽으로 새어 나갑니다. 시드가 얇을수록(저항이 클수록) 중심에 닿기 전에 전압을 잃어 중심이 얇아집니다.', viewN: VN_XS},
    {id: 'fix', t: '고르게 만드는 방법', d: '두 가지 원리입니다. 모든 길에 같은 큰 저항을 더하거나(고저항판 · 억제제 · 낮은 전류밀도), 몰리는 가장자리 전류를 직접 덜어 냅니다 — 실드 · 보조 음극 · 구역 양극(애노드, +). 회전은 둘레 방향만 평균하고 반지름 방향 차이는 못 고칩니다.', viewN: VN_XS},
    {id: 'map', t: '웨이퍼 맵 읽기', d: '웨이퍼는 돌면서 도금되므로 무늬 모양이 원인 자리를 알려 줍니다. ① 고리 — 셀에 고정된 부품, 또는 시드 · PR 두께처럼 둘레 방향으로 고른 원인. ② 한쪽 · 부채꼴 — 웨이퍼와 함께 도는 것의 치우침(접점 하나 · 립씰 · 비뚤게 앉은 웨이퍼). ③ 직선 줄무늬 — 노광 · PR 도포 · 패들 · 기포. 먼저 앞 공정 맵과 겹쳐 봅니다.', viewN: VN_MAP}
  ],
  css: `
.p07-plate{fill:#475569;stroke:#cbd5e1;stroke-width:1;stroke-dasharray:3 5}
.p07-thief{fill:#a78bfa;stroke:#ede9fe;stroke-width:1.2}
.p07-bdg{fill:rgba(167,139,250,.28);stroke:#a78bfa;stroke-width:1.4}
.pl-svg .p07-bdgt{font-size:18px;font-weight:800;fill:#ddd6fe !important}
.p07-num{fill:#f59e0b;stroke:#1b1203;stroke-width:1.5}
.pl-svg .p07-numt{font-size:18px;font-weight:900;fill:#1b1203 !important;stroke:none !important}
.p07-seg{fill:none;stroke:#fbbf24;stroke-width:3}
.pl-svg .p07-segt{font-size:18px;font-weight:800;fill:#1b1203 !important;stroke:none !important}
.p07-boxr{fill:rgba(10,16,32,.93);stroke:#a78bfa;stroke-width:2}
.p07-boxf{fill:rgba(10,16,32,.93);stroke:#38bdf8;stroke-width:2}
.p07-lines{transition:opacity .5s}
.pl-scene[data-step="map"] .p07-lines{opacity:.18}
.pl-scene[data-step="fix"] .p07-plbl,.pl-scene[data-step="map"] .p07-plbl{opacity:0}
.pl-svg .p07-hdgr{font-size:22px;font-weight:800;fill:#c4b5fd !important}
.jc .p07-two{display:grid;grid-template-columns:1fr 1fr;column-gap:14px}
.jc .p07-row{display:flex;flex-wrap:wrap;column-gap:16px}
.jc .p07-row .pl-seg{margin:4px 0}
.jc .p07-w .kpi{flex:1 1 64px;min-width:0;padding:5px 7px}
.jc .p07-w .kpi .v{font-size:16px;white-space:nowrap}
.jc .p07-w .kpi .s{font-size:10px;line-height:1.3;letter-spacing:-.3px}
.jc .p07-msg{min-height:80px}
@media (max-width:520px){.jc .p07-two{grid-template-columns:1fr}.jc .p07-w .kpi{flex:1 1 40%}}
@media (min-width:1001px) and (max-width:1280px){.jc .p07-two{grid-template-columns:1fr}.jc .p07-w .kpi{flex:1 1 40%}}
.pl-svg .p07-b{font-weight:800}`,
  icon(K){
    const {P, E} = K;
    return E(33, 33, 30, 30, 'pl-ic-edge') + E(33, 33, 20, 20, 'pl-ic-mid') + E(33, 33, 10, 10, 'pl-ic-cen');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT} = K;
    const num = (x, y, n, o) => G(C(x, y, 15, 'p07-num') + T(x, y + 6, n, 'p07-numt'), o);
    let s = '';
    s += R(40, 130, 880, 640, 'pl-panel', {rx: 16});
    s += T(64, 172, '도금 셀 단면 — 컵형 예시 (웨이퍼 앞면이 아래)', 't-acc', 'start');
    // 셀
    s += P('M130,250 L130,720 L830,720 L830,250', 'f-tank') + R(133, 246, 694, 472, 'f-bath', tip('도금액 — 액 속에서는 이온이 전기를 나른다'));
    s += R(140, 182, 680, 46, 'pl-headb', W({rx: 10}, tip('헤드 — 웨이퍼를 잡고 돈다 (접점 · 립씰도 함께 돈다)'))) + R(612, 140, 36, 42, 'pl-headb') + P('M690,160 A80,12 0 0 1 850,160', 's-arr', K.mk('s-arr')) + LB(T(860, 168, '회전', 't-dim', 'start'));
    s += LB(T(480, 212, '헤드 (웨이퍼를 잡고 돈다)', 't-dim'));
    s += LB(T(480, 268, '↑ 웨이퍼 = 음극(캐소드, −)', 't-dim'), only('prim fix map'));
    s += R(WX0, 228, WX1 - WX0, 8, 'f-wafer', tip('웨이퍼 (300 mm, 앞면이 아래) — 음극(캐소드, −): 전자를 받아 금속이 쌓인다')) + R(WX0, WY, WX1 - WX0, 4, 'f-seed2', tip('시드층 — 아주 얇은 금속막. 전류가 가장자리에서 중심까지 이 막을 타고 간다'));
    s += R(WX0 - 8, 226, 14, 18, 'f-contact', tip('접점(콘택트) — 전류가 들어오는 입구. 가장자리에 있고 웨이퍼와 함께 돈다')) + R(WX1 - 6, 226, 14, 18, 'f-contact');
    s += R(WX0 - 18, 244, 34, 10, 'f-seal', tip('립씰 — 액이 접점으로 새지 않게 막는 고무 테두리. 웨이퍼와 함께 돈다')) + R(WX1 - 16, 244, 34, 10, 'f-seal');
    s += `<g data-v="lines" class="p07-lines"></g>`;
    s += G(R(140, 300, 680, 18, 'p07-plate', tip('고저항판 — 작은 구멍이 많은 절연판. 모든 길에 똑같이 큰 저항을 더해 길마다 다른 저항의 차이를 상대적으로 작게 한다')) + LB(T(812, 340, '고저항판', 't-dim', 'end'), {class: 'lbl p07-plbl'}) + num(480, 309, '1', W(only('fix'), tip('① 고저항판 — 모든 길에 같은 큰 저항을 더한다'))), {class: 'w-plate'});
    s += G(R(148, 262, 102, 14, 'f-shield', tip('실드(가림판) — 가장자리로 가는 전류를 가린다. 셀에 고정')) + R(710, 262, 102, 14, 'f-shield') + LB(T(124, 276, '실드', 't-dim', 'end'), {class: 'lbl p07-plbl'}) + num(199, 269, '2', W(only('fix'), tip('② 실드 — 가장자리로 가는 전류를 가린다'))), {class: 'w-shield'});
    s += R(290, 640, 380, 30, 'f-anode', tip('양극(애노드, +) — 산화가 일어나는 쪽. 셀에 고정'));
    s += LB(T(480, 708, '양극(애노드, +)', 't-dim'));
    s += LB(T(64, 754, '장비마다 다릅니다 — 웨이퍼를 세워 담그는 수직형(패들로 젓기)도 있습니다', 't-dim', 'start'));
    // 1차 분포: 모서리로 몰리는 전류선
    s += G(LB(T(150, 420, '전류선이 가장자리로 몰린다', 't-warn', 'start')), only('prim'));
    // 터미널 효과: 시드를 따라 가며 약해지는 화살표 + 가는 내내 액으로 새는 물방울(아래 화살표)
    let te = '';
    for (let k = 0; k < 5; k++){
      const x0 = WX0 + 14 + k * 58, w = 7 - k * 1.3, dl = 46 - k * 8;
      te += P(`M${x0},${WY + 14} L${x0 + 46},${WY + 14}`, 'pl-hose', W(K.mk('s-arr2'), {style: `stroke-width:${w.toFixed(1)}px`}));
      te += P(`M${WX1 - 14 - k * 58},${WY + 14} L${WX1 - 60 - k * 58},${WY + 14}`, 'pl-hose', W(K.mk('s-arr2'), {style: `stroke-width:${w.toFixed(1)}px`}));
      te += K.arrow(x0 + 23, WY + 24, x0 + 23, WY + 24 + dl, 's-arr2', {style: `stroke-width:${Math.max(1.5, w * 0.6).toFixed(1)}px`});
      te += K.arrow(WX1 - 37 - k * 58, WY + 24, WX1 - 37 - k * 58, WY + 24 + dl, 's-arr2', {style: `stroke-width:${Math.max(1.5, w * 0.6).toFixed(1)}px`});
    }
    te += LB(T(480, WY + 120, '가장자리에서 들어와 가는 내내 액으로 샌다', 't-warn') + T(480, WY + 152, '→ 중심에 닿을 때는 약하다 (구멍 뚫린 호스)', 't-sub'));
    s += G(te, W(only('term'), tip('시드를 따라 가는 전류 — 가는 동안 액 쪽으로 새며 전압을 잃는다')));
    // 고르게 만드는 도구: 보조 음극 · 구역 양극(애노드) + 번호 (①②는 고저항판 · 실드 묶음 안에)
    let fx = '';
    fx += R(134, 252, 10, 44, 'p07-thief', tip('보조 음극(thief) — 가장자리 전류를 대신 받아 가는 전극')) + R(816, 252, 10, 44, 'p07-thief');
    fx += P('M300,646 C190,600 150,420 142,298', 's-field2') + P('M660,646 C770,600 810,420 818,298', 's-field2');
    fx += R(290, 640, 112, 30, 'p07-seg', {rx: 3}) + R(404, 640, 152, 30, 'p07-seg', {rx: 3}) + R(558, 640, 112, 30, 'p07-seg', {rx: 3});
    fx += LB(T(346, 662, '바깥', 'p07-segt') + T(480, 662, '안쪽', 'p07-segt') + T(614, 662, '바깥', 'p07-segt'));
    fx += L(88, 274, 134, 274, 's-lead') + num(76, 274, '3') + num(262, 655, '4');
    s += G(fx, W(only('fix'), tip('③ 보조 음극 ④ 구역 양극(애노드) — 몰리는 가장자리 전류를 덜어 낸다\n(① 고저항판은 모든 길에 같은 저항을 더한다)')));
    // 맵 읽기: 함께 도는 것 vs 셀에 고정된 것
    let mr = '';
    mr += R(180, 342, 600, 84, 'p07-boxr', {rx: 12}) + T(200, 376, '함께 도는 것의 치우침 → 한쪽 · 부채꼴', 'p07-hdgr', 'start') + T(200, 408, '접점 하나 · 립씰 누액 · 비뚤게 앉음 · 앞 공정 맵 치우침', 't-sub', 'start');
    mr += K.arrow(214, 342, WX0 + 2, 252, 's-arr3') + K.arrow(746, 342, WX1 - 2, 252, 's-arr3');
    mr += R(180, 500, 600, 84, 'p07-boxf', {rx: 12}) + T(200, 534, '셀에 고정된 것 · 둘레로 고른 것 → 고리', 'pl-hdg', 'start') + T(200, 566, '실드 · 고저항판 · 양극 · 흐름 · 온도 · 시드 · PR 맵', 't-sub', 'start');
    mr += K.arrow(480, 584, 480, 632, 's-arr');
    s += G(mr, only('map'));
    // 오른쪽: 두께 그래프와 웨이퍼 맵
    s += R(940, 130, 640, 980, 'pl-panel', {rx: 16}) + T(964, 172, '반지름 방향 두께 (평균 = 1)', 't-acc', 'start');
    s += L(CX0, CY0, CX1, CY0, 's-axis') + L((CX0 + CX1) / 2, CY0, (CX0 + CX1) / 2, CY1, 's-faint');
    for (const v of [0.6, 0.8, 1.0, 1.2, 1.4]){ const y = CY0 - (v - TMIN) / (TMAX - TMIN) * (CY0 - CY1); s += L(CX0, y, CX1, y, v === 1 ? 's-dash' : 's-faint') + T(CX0 - 8, y + 6, v.toFixed(1), 't-dim', 'end'); }
    s += LB(T(CX0, CY0 + 32, '−150', 't-dim') + T((CX0 + CX1) / 2, CY0 + 32, '중심', 't-dim') + T(CX1, CY0 + 32, '+150 mm', 't-dim'));
    s += `<g data-v="curve"></g><g data-v="map"></g><g data-v="read"></g>`;
    // 아래 왼쪽: 단계마다
    s += R(40, 800, 880, 310, 'pl-panel', {rx: 16});
    s += G(T(64, 846, '1차 분포 — 반응 저항이 없을 때의 "최악의 경우"', 'pl-hdg', 'start') + TT(64, 886, ['· 전류선이 웨이퍼 모서리로 몰린다 (가장자리 효과)', '· 억제제 · 낮은 전류밀도(반응 저항↑)일수록 덜 몰린다', '· 립씰 · 실드 같은 벽이 있으면 맨 끝 몇 mm는 오히려 얇아지기도', '· 범프 웨이퍼: 바깥 PR 띠에는 구멍이 없다', '   → 가장자리 다이가 외톨이 범프처럼 전류를 더 받는다 (08장)', '· 회전은 둘레 방향만 평균한다 — 반지름 방향 차이는 남는다'], 't-sub', 'start', 35), only('prim'));
    s += G(T(64, 846, '터미널 효과 — 시드가 얇을수록 크다', 'pl-hdg', 'start') + tagS(K, 452, 846) + TT(64, 886, ['· 시드 두께는 PVD(앞 공정)가 정한다 → 비도금 인자', '· 전류는 시드를 타고 가며 내내 액 쪽으로 샌다 (구멍 뚫린 호스)', '· 전도도는 양날의 칼: 높으면 가장자리 효과↓, 터미널 효과↑', '   → 얇은 시드에는 산을 줄인 저산(낮은 전도도) 액을 쓰기도', '· 개구율(비도금)이 작으면 새는 길의 저항이 커져 터미널 효과↓', '· 전류밀도↓ · 억제제↑ → 반응 저항↑ → 더 고름 (대신 느림)'], 't-sub', 'start', 35), only('term'));
    s += G(T(64, 846, '두 원리 — 같은 저항 더하기 · 가장자리 전류 덜기', 'pl-hdg', 'start') + TT(64, 886, ['① 고저항판: 모든 길에 똑같이 큰 저항을 더한다', '② 실드(가림판): 가장자리로 가는 전류를 가린다', '③ 보조 음극(thief): 가장자리 전류를 대신 받아 간다', '④ 구역 양극(애노드): 반지름 구역마다 전류를 따로 준다', '· 회전은 둘레 방향만 평균 · 제품 · 시드가 바뀌면 다시 맞춘다', '· 처음엔 약하게 시작(램프업) — 얇은 시드 보호'], 't-sub', 'start', 35), only('fix'));
    // map 단계: 무늬 세 가지
    const MY = 956, MR = 54;
    const mini = (cx, kind, t0, t1, tp) => {
      let g = `<clipPath id="pl7-m${kind}"><circle cx="${cx}" cy="${MY}" r="${MR}"/></clipPath>`;
      let f = '';
      if (kind === 'ring') for (let r = MR; r > 0; r -= 4) f += C(cx, MY, r, 'pl-hm', {style: `fill:${K.heat(0.25 + 0.7 * Math.pow(r / MR, 3))}`});
      if (kind === 'side'){
        // 한쪽으로 기운 바탕 + 접점 하나가 나쁜 부채꼴
        f += `<defs><linearGradient id="pl7-gside" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${K.heat(0.66)}"/><stop offset="1" stop-color="${K.heat(0.3)}"/></linearGradient></defs>`;
        f += C(cx, MY, MR, 'pl-hm', {style: 'fill:url(#pl7-gside)'});
        const a0 = -0.5, a1 = 0.5;
        f += P(`M${cx},${MY} L${(cx + 70 * Math.cos(a0)).toFixed(1)},${(MY + 70 * Math.sin(a0)).toFixed(1)} A70,70 0 0 1 ${(cx + 70 * Math.cos(a1)).toFixed(1)},${(MY + 70 * Math.sin(a1)).toFixed(1)} Z`, 'pl-hm', {style: `fill:${K.heat(0.08)};opacity:.85`});
      }
      if (kind === 'stripe') for (let x = -MR, k = 0; x < MR; x += 10, k++) f += R(cx + x, MY - MR, 10, 2 * MR, 'pl-hm', {style: `fill:${K.heat(k % 2 ? 0.32 : 0.62)}`});
      g += G(f, {'clip-path': `url(#pl7-m${kind})`}) + C(cx, MY, MR, 's-edge', {style: 'fill:none'});
      return G(g + T(cx, MY + MR + 34, t0, 't-sub p07-b') + T(cx, MY + MR + 64, t1, 't-sub'), tip(tp));
    };
    let mp = T(64, 838, '웨이퍼는 돌면서 도금된다 → 무늬 모양이 원인 자리를 알려 준다', 'pl-hdg', 'start');
    mp += T(64, 870, '먼저 시드 · PR 두께 맵(앞 공정)과 겹쳐 본다. 다이 · 샷마다 반복되면 → 패턴 · 노광', 't-sub', 'start');
    mp += mini(186, 'ring', '① 고리 (동심원)', '셀 고정 · 둘레로 고른 것', '고리 — 셀에 고정된 것(실드 · 고저항판 · 양극 · 흐름 · 온도)과\n둘레 방향으로 고른 것(고르게 닿은 접점의 터미널 효과 · 시드 · PR 두께 맵)');
    mp += mini(480, 'side', '② 한쪽 · 부채꼴', '함께 도는 것의 치우침', '한쪽 · 부채꼴 — 웨이퍼와 함께 도는 것의 치우침\n접점 하나의 오염 · 립씰 누액 · 웨이퍼가 기울게 앉음 · 앞 공정 맵의 치우침');
    mp += mini(774, 'stripe', '③ 직선 줄무늬', '노광 · PR 도포 · 패들 · 기포', '직선 줄무늬 — 노광 · PR 도포(앞 공정)\n또는 웨이퍼가 돌지 않는 수직형의 패들 · 흐름 · 기포 흔적');
    s += G(mp, only('map'));
    return s;
  },
  body(K){
    // 비도금 인자 슬라이더: 이름 바로 뒤에 꼬리표
    const tagged = html => html.replace(/<label>([^<]*?)\s*<output/, (m, t) => `<label><span>${t} ${tagC}</span><output`);
    return `<div class="pl-w p07-w"><div class="hd">직접 해 보기 — 웨이퍼 두께 분포</div>
      ${tagged(K.ctl('seed', '시드 두께', 0, 100, 1, 60))}
      <div class="p07-two">${tagged(K.ctl('f', '개구율', 5, 60, 1, 20))}${K.ctl('j', '전류밀도 (범프 기준)', 2, 20, 1, 10)}</div>
      ${K.seg('k', [['lo', '5 · 저산'], ['mid', '20 · 보통'], ['hi', '50 · 고산']], 'mid', '액 전도도 (S/m)')}
      <div class="p07-row">${K.seg('plate', [['0', '없음'], ['1', '있음']], '0', '고저항판')}${K.seg('shield', [['0', '없음'], ['1', '있음']], '0', '실드')}</div>
      ${K.kpis([['중심', 'k-c', '평균 대비'], ['가장자리', 'k-e', '평균 대비'], ['균일도', 'k-u', '범위/(2·평균)'], ['λ', 'k-l', '들어가는 거리']])}
      <p class="pl-msg p07-msg" data-o="msg"></p>
      ${K.model('<b>1차원 개념 모델 — 실제 장비보다 과장될 수 있습니다.</b> λ = √(Rp/Rs), Rp = 간격/κ + 고저항판 + (R_pol + h/κ) ÷ 개구율 (h = PR 구멍 깊이), R_pol = b/(2.303·J). 개구율을 바꿔도 범프 기준 전류밀도(J)는 그대로 둡니다. 가장자리 꼬리(약 10 mm)는 실드 · 고저항판 · 낮은 전류밀도 · 높은 전도도에서 작아집니다. 값은 예시 (식은 「한 걸음 더」).')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip} = K;
    const st = {seed: 0.3, k: 'mid', f: 20, j: 10, plate: false, shield: false};
    let touched = false;
    const seedOf = v => 0.05 * Math.pow(20, v / 100);          // 0.05 ~ 1 µm (로그 눈금)
    const sIn = ctx.card.querySelector('input[data-i=seed]');
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const kU = ctx.card.querySelector('[data-o="k-u"]');
    function render(){
      const pr = profile(st);
      // 전류선: 두께(= 전류밀도) 분포에 따라 웨이퍼 쪽 끝을 배치
      const xs = [];
      const cum = [0];
      for (let i = 1; i <= 200; i++){ const x = -RW + 2 * RW * i / 200; cum.push(cum[i - 1] + pr.at(x)); }
      const tot = cum[200];
      for (let k = 0; k < 15; k++){ const q = (k + 0.5) / 15 * tot; let i = cum.findIndex(c => c >= q); xs.push(WX0 + (WX1 - WX0) * i / 200); }
      let ln = '';
      xs.forEach((wx, k) => {
        const ax = 300 + k * (360 / 14);
        if (st.plate) ln += P(`M${ax.toFixed(0)},640 C${ax.toFixed(0)},500 ${wx.toFixed(0)},420 ${wx.toFixed(0)},318 L${wx.toFixed(0)},${WY + 4}`, 's-field');
        else ln += P(`M${ax.toFixed(0)},640 C${ax.toFixed(0)},460 ${wx.toFixed(0)},430 ${wx.toFixed(0)},${WY + 4}`, 's-field');
      });
      if (!st.shield) ln += P(`M290,650 C150,600 150,400 ${WX0 + 4},${WY + 4}`, 's-field2') + P(`M670,650 C810,600 810,400 ${WX1 - 4},${WY + 4}`, 's-field2');
      ctx.$('[data-v="lines"]').innerHTML = G(ln, {'data-tip': '전류선 — 촘촘한 곳에 전류가 많이 간다 (= 두껍게 쌓인다)\n빨간 점선: 옆쪽 액에서 가장자리로 돌아 들어오는 전류'});
      ctx.$$('.w-plate').forEach(e => e.classList.toggle('hide', !st.plate));
      ctx.$$('.w-shield').forEach(e => e.classList.toggle('hide', !st.shield));
      // 그래프
      const ty = v => CY0 - (Math.max(TMIN, Math.min(TMAX, v)) - TMIN) / (TMAX - TMIN) * (CY0 - CY1);
      let d = '';
      for (let i = -120; i <= 120; i++){ const x = CX0 + (i + 120) / 240 * (CX1 - CX0); d += (d ? ' L' : 'M') + x.toFixed(1) + ',' + ty(pr.t[Math.abs(i)]).toFixed(1); }
      ctx.$('[data-v="curve"]').innerHTML = P(d, 's-curve', tip('반지름 방향 두께 — 가운데가 웨이퍼 중심')) + (pr.edge > TMAX ? LB(T(CX1 - 6, CY1 - 8, `가장자리 ×${pr.edge.toFixed(2)} ↑`, 't-warn', 'end')) : '');
      // 웨이퍼 맵 (동심원 색) — 이 모델은 둘레 방향으로 고른(축대칭) 원인만 넣어서 늘 고리 무늬
      let mp = '';
      for (let i = 30; i >= 1; i--){ const rr = MAP.r * i / 30, v = pr.t[Math.round(i / 30 * 120)]; mp += C(MAP.x, MAP.y, rr, 'pl-hm', {style: `fill:${K.heat((v - 0.8) / 0.4)}`}); }
      mp += C(MAP.x, MAP.y, MAP.r, 's-edge', {style: 'fill:none'}) + T(MAP.x, MAP.y - MAP.r - 20, '웨이퍼 맵 (예시) — 색 눈금 −20 % ~ +20 %', 't-dim');
      const bh = 2 * MAP.r / 9, bx = MAP.x + MAP.r + 46;
      for (let k = 0; k <= 8; k++) mp += R(bx, MAP.y + MAP.r - (k + 1) * bh, 26, bh, 'pl-hm', {style: `fill:${K.heat(k / 8)}`});
      mp += T(bx + 34, MAP.y + MAP.r, '−20 %', 't-dim', 'start') + T(bx + 34, MAP.y + 6, '0', 't-dim', 'start') + T(bx + 34, MAP.y - MAP.r + 18, '+20 %', 't-dim', 'start');
      ctx.$('[data-v="map"]').innerHTML = G(mp, {'data-tip': '웨이퍼 맵 — 색은 평균 대비 두께\n이 모델은 둘레 방향으로 고른(축대칭) 원인 — 시드 · 접점 링 · 실드 · 고저항판 — 만 넣어 늘 고리(동심원) 무늬다'});
      const f1 = x => x.toFixed(Math.abs(x) >= 99.95 ? 0 : 1);      // 100 % 넘으면 소수점 없이 (KPI 칸이 두 줄로 넘치지 않게)
      const pc = v => `${v >= 1 ? '+' : '−'}${f1(Math.abs((v - 1) * 100))} %`;
      const lmm = (pr.lam * 1000).toFixed(0);
      ctx.$('[data-v="read"]').innerHTML = LB(
        T(964, 990, `중심 ${pc(pr.center)} · 가장자리 ${pc(pr.edge)} · 균일도 ±${f1(pr.unif)} %`, 't-warn', 'start') +
        T(964, 1024, `λ = ${lmm} mm — 전류가 시드를 타고 안쪽으로 들어가는 거리`, 't-sub', 'start') +
        T(964, 1054, `터미널 효과만: 중심/가장자리 = 1/I₀(a/λ) = ${pr.ce.toFixed(2)}`, 't-sub', 'start') +
        T(964, 1086, `a = 150 mm · R_pol = ${sci(pr.Rpol)} Ω·m² (${st.j} ASD) · 1차원 개념 모델`, 't-dim', 'start'));
      ctx.out('k-c', pc(pr.center)); ctx.out('k-e', pc(pr.edge)); ctx.out('k-u', `±${f1(pr.unif)} %`); ctx.out('k-l', `${lmm} mm`);
      if (kU){ const box = kU.closest('.kpi'); box.classList.toggle('ok', pr.unif < 3); box.classList.toggle('warn', pr.unif >= 3 && pr.unif < 10); box.classList.toggle('ng', pr.unif >= 10); }
      // 어느 효과가 큰가: 터미널 효과만의 (가장자리/중심 − 1) vs 가장자리 꼬리 E
      const tc = 1 / pr.ce - 1, tp = Math.round(tc * 100), ep = Math.round(pr.E * 100);
      //  두 %는 '그 효과 하나만 있을 때 가장자리가 중심보다 두꺼운 정도' — 위 칸(평균 대비)과 기준이 달라 함께 밝힌다
      const tT = `터미널 효과 +${tp}&nbsp;%`, tE = `가장자리 효과 +${ep}&nbsp;%`;
      const basis = (a, b) => `효과 하나만 있을 때 가장자리가 중심보다 두꺼운 정도는 ${a} · ${b}입니다(위 칸의 %는 평균 대비라 다릅니다).`;
      ctx.q('[data-o=msg]').innerHTML = pr.unif < 3 ? '고른 편입니다 (이 모델 기준). 시드가 바뀌거나 개구율이 다른 제품이 오면 다시 확인합니다.'
        : st.shield && pr.edge < Math.min(pr.center, 0.97) ? '<b>가장자리가 얇습니다</b> — 실드가 너무 많이 가립니다(과보정). 시드 · 개구율이 바뀌면 실드 설정도 다시 맞춰야 합니다.'
        : tc > 1.5 * pr.E ? `<b>중심이 얇습니다</b> — 터미널 효과가 더 큽니다. ${basis(tT, tE)} ${levers(st, pr.unif, 'terminal')}`
        : pr.E > 1.5 * tc ? `<b>가장자리가 두껍습니다</b> — 가장자리 효과가 더 큽니다. ${basis(tE, tT)} ${levers(st, pr.unif, 'edge')}`
        : `<b>두 효과가 비슷합니다.</b> ${basis(tT, tE)} ${levers(st, pr.unif, 'both')}`;
      ctx.refresh();
    }
    ctx.range('seed', v => { st.seed = seedOf(v); render(); return st.seed.toFixed(2) + ' µm'; });
    ctx.range('f', v => { st.f = v; render(); return v + ' %'; });
    ctx.range('j', v => { st.j = v; render(); return v + ' ASD'; });
    ctx.seg('k', v => { st.k = v; render(); });
    ctx.seg('plate', v => { st.plate = v === '1'; render(); });
    ctx.seg('shield', v => { st.shield = v === '1'; render(); });
    ctx.card.querySelectorAll('.pl-w input, .pl-w .pl-seg button').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    ctx.demo = sid => {
      const d = DEMO[sid];
      if (touched || !d) return ctx.refresh();
      st.seed = d.seed; st.plate = d.plate; st.shield = d.shield;
      sIn.value = Math.round(Math.log(d.seed / 0.05) / Math.log(20) * 100); ctx.out('seed', d.seed.toFixed(2) + ' µm');
      setSeg('plate', d.plate ? '1' : '0'); setSeg('shield', d.shield ? '1' : '0');
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['반응 저항 (= 표면 저항 · 분극 저항)', '전류를 조금 더 흘리려면 얼마나 더 밀어야 하는지(dη/di). 곡선이 완만할수록 크고, 클수록 전류가 고르게 퍼진다 (04장의 톨게이트)'],
      ['1차 분포', '반응 저항 없이 모양(기하)과 액 저항만으로 정해지는 분포. 가장 고르지 않은 "최악의 경우"'],
      ['터미널 효과', '얇은 시드의 저항 때문에 접점(가장자리)에서 멀수록 전류가 줄어드는 것'],
      ['λ (들어가는 거리)', '전류가 시드를 타고 안쪽으로 들어가는 거리. 웨이퍼 반지름보다 길수록 고르다'],
      ['면저항', '얇은 막의 저항. 두께가 반이면 두 배'],
      ['립씰', '액이 접점으로 새지 않게 막는 고무 테두리. 웨이퍼와 함께 돈다 (→ 09장)'],
      ['실드 (shield)', '가장자리로 가는 전류를 가리는 절연판'],
      ['고저항판', '작은 구멍이 많은 절연판(이온 저항판). 모든 길에 똑같이 큰 저항을 더한다'],
      ['보조 음극 (thief)', '웨이퍼 둘레에 두어 가장자리 전류를 대신 받아 가는 전극'],
      ['균일전착성', '전류가 고르게 퍼져 두께가 고르게 되는 성질 (throwing power). 바그너 수가 클수록 좋다 (→ 04장)'],
      ['램프업', '도금 초기 전류를 천천히 올리는 것. 얇은 시드 보호 · 급격한 분포 차이 완화']
    ]) + K.field([
      `<b>도금 인자와 비도금 인자를 나눠 봅니다.</b> 시드 두께(PVD)와 개구율(설계 · 포토)은 도금 공정이 바꿀 수 없는 인자입니다 ${tagC}. 분포가 바뀌었다면 앞 공정 변경 이력부터 확인합니다.`,
      '<b>맵은 회전을 생각하며 읽습니다.</b> 셀에 고정된 것(실드 · 고저항판 · 양극 · 흐름 · 온도)과 둘레 방향으로 고른 것(고르게 닿은 접점의 터미널 효과 · 시드 두께)은 고리로, 웨이퍼와 함께 도는 것의 치우침(접점 하나의 오염 · 립씰 누액 · 웨이퍼가 기울게 앉음)은 한쪽 · 부채꼴로 보입니다. 회전축 자체가 기울면 돌면서 평균되어 주로 고리로 보입니다. 앞 공정 맵(시드 · PR 두께 · CD)은 보통 고리이고, 치우침이 있으면 한쪽으로 보입니다 — 먼저 겹쳐 봅니다. 접점 · 립씰은 → <a data-go="tool.head">09장</a>. "먼저 의심"은 원인 확정이 아닙니다.',
      '<b>제품이나 앞 공정이 바뀌면 다시 맞춥니다.</b> 시드 두께(PVD 변경)나 개구율(새 제품)이 바뀌면 λ가 바뀌어, 같은 실드 · 양극 설정이라도 결과가 달라집니다 — 변경관리 대상입니다. 매일 블랭킷 모니터 웨이퍼로 반지름 방향 두께를 보고, 셀끼리도 비교합니다(챔버 매칭).',
      '범프 웨이퍼에서 가장자리가 높은 원인은 <b>가장자리 다이 효과</b>인 경우가 많습니다. 마지막 다이 바깥은 구멍 없는 PR 띠라서 가장자리 다이 범프가 외톨이처럼 전류를 더 받습니다. 실드만 조정하지 말고 가장자리 부분 다이 패턴 채우기 · 더미 패턴도 봅니다 → <a data-go="pattern">08장</a>.',
      '범프 도금은 PR 아래 시드가 두꺼워지지 않으므로(도금은 구멍 안에만) 터미널 효과가 도금 내내 남습니다. 막 전체가 두꺼워지는 블랭킷 도금과 다른 점입니다.',
      '이 장의 그림은 웨이퍼를 아래로 향해 담그는 <b>컵형</b> 예시입니다. 웨이퍼를 세워 담그고 패들로 젓는 <b>수직형</b>도 있습니다. 웨이퍼가 돌지 않으면 줄무늬 · 한쪽 무늬가 평균되지 않고 그대로 남습니다.'
    ]) + K.deep(`<p><b>터미널 효과 모델.</b> 얇은 원판(반지름 a)의 가장자리에서 전류를 넣고, 웨이퍼 면적마다 저항 Rp로 액에 전류가 빠져나간다고 보면 시드의 전위는 변형 베셀 함수 I₀를 따릅니다:</p>
      ${K.eq('V(r) / V(a) = I₀(r/λ) / I₀(a/λ)')}${K.eq('λ = √(Rp / Rs)')}${K.eq('Rp = 간격/κ + R_판 + (R_pol + h/κ) ÷ f')}
      <p>모두 웨이퍼 면적 기준(Ω·m²)입니다. R_판 = 고저항판, h/κ = PR 구멍(깊이 h) 속 액 저항(κ = 액 전도도), f = 개구율.</p>
      <ul><li>Rs = 시드 비저항 ÷ 두께 (얇을수록 큼). 예: ρ 1.9 µΩ·cm → 100 nm 0.19 Ω/□, 300 nm 0.063 Ω/□.</li>
      <li><b>개구율로 나누는 것은 범프 자리에서만 생기는 저항뿐</b>입니다(반응 저항 · 구멍 속 액 저항). 액과 고저항판은 웨이퍼 전체 면적에 걸리므로 나누지 않습니다. 위젯에서 개구율을 바꿀 때는 범프 기준 전류밀도를 같게 둡니다.</li>
      <li>분극 저항은 고정값이 아닙니다. 타펠 구역에서 R_pol = dη/dJ = b/(2.303·J) — 전류밀도가 낮을수록, 억제제가 셀수록 큽니다. 예: b 0.12 V/dec, 10 ASD → 5.2×10⁻⁵ Ω·m². 대신 느려지고(생산성) 첨가제 소모 · 조성이 바뀌는 대가가 있습니다.</li>
      <li>예시(간격 20 mm, κ 50 S/m, 개구율 20 %, 10 ASD): 시드 300 nm → λ ≈ 100 mm, 중심/가장자리 ≈ 0.62 · 100 nm → 0.29 · 500 nm → 0.74 · 고저항판 +2×10⁻³ Ω·m² → 0.88 · 개구율 5 % → 0.79. 1차원 액 근사라 실제 장비보다 과장됩니다.</li>
      <li>차이가 작을 때(a/λ ≲ 1)의 어림: (가장자리 − 중심)/중심 ≈ Rs·a² / (4·Rp).</li></ul>
      <p><b>전도도는 양날의 칼 — 그러나 설명은 하나.</b> "모든 길에 똑같이 걸리는 저항"이 "길마다 다른 저항"보다 클수록 전류가 고르게 퍼집니다. 가장자리 효과에서는 액 저항이 길마다 달라서, 전도도가 높을수록(바그너 수 Wa = κ·(dη/di)/L ↑, → <a data-go="overpot">04장</a>) 고릅니다. 터미널 효과에서는 시드 저항이 길마다 달라서, 액 쪽 저항(Rp)이 작아지는 높은 전도도가 불리합니다. 그래서 얇은 시드에는 산을 줄인 저산 액(약 0.05 S/cm, 고산 액은 약 0.5 S/cm)을 쓰기도 합니다. 고저항판 · 억제제 · 낮은 전류밀도 · 두꺼운 시드(터미널 효과에는 낮은 전도도도)는 모두 이 원리의 다른 얼굴입니다. 실드 · 보조 음극 · 구역 양극(애노드)은 다른 방법 — 몰리는 가장자리 전류를 직접 덜어 냅니다.</p>
      <p><b>1차 분포의 모서리 규칙</b>(Newman): 전극과 절연면이 만나는 각(액 쪽)이 90°보다 크면 1차 전류밀도는 무한대(같은 높이의 원판 = 180°), 90°면 유한, 90°보다 작으면 0입니다. 웨이퍼 옆에 선 립씰 · 실드 벽은 이 각을 줄여 맨 끝 몇 mm를 오히려 얇게 만들기도 합니다. 회전 원판은 확산층이 어디서나 같아 물질 전달은 고르지만(Levich), 전기적인 가장자리 쏠림은 그대로 남습니다.</p>
      <p><b>균일도 숫자는 정의부터 확인합니다.</b> (최대−최소)/(2×평균) · (최대−최소)/평균 · 3σ/평균은 같은 데이터에서도 값이 크게 다릅니다. WIW(웨이퍼 안) · WID(다이 안) · WTW(웨이퍼 사이)도 나눕니다. 균일도의 크기는 셋 — 웨이퍼(시드 · 실드 · 고저항판), 다이 · 패턴(개구율, 08장), 범프 하나(첨가제 · 구멍 깊이) — 이고, 웨이퍼 맵 하나에 셋이 겹쳐 보입니다. HBM에서는 적층 접합 때문에 다이 안 높이 차이(동일평면성)가 특히 중요합니다.</p>`);
  }
});
})();
