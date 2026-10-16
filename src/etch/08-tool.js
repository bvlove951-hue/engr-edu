/* 시드 식각 08 — 장비와 식각액: 장비 안에서 무슨 일이 일어날까? (장비 · m) */
(function(){
// ── 개념 모델 (기획 rev.2 · 모든 상수 예시): 식각액 나이 — 순환 액 60 L, 기준 액 H₂O₂ 0.15 wt% (C₀ = 1.5 g/L), 1시간 간격 168 칸
//  웨이퍼 한 장이 다 녹이는 Cu 0.17 g (300 mm · 300 nm · 면적 90 %), H₂O₂ 0.09 g × 1.5 (분해 몫 포함) = 0.135 g
//  속도 ∝ H₂O₂ (03장 모델: 두 문 모두 농도에 비례), 실제로 녹인 몫 f = min(1, 1.3·C/C₀) (과식각 여유 30 %)
//  분해 k = 0.2 %/h + 1 %/h × Cu(g/L), C ≥ 0. 보충 · 교체 = 4 h마다 H₂O₂ 를 C₀ 로, 하루 40 % 를 버리고 새 액
const VOL = 60, C0 = 1.5, CU1 = 0.17, PX1 = 0.135, OE = 0.3, RISK = 1 / (1 + OE), BLEED = 0.4;
const RS = 300, KPL = 1.3, FILM = 6.2;            // 기준 액 블랭킷 속도 nm/분 · 도금 Cu / 스퍼터 Cu 속도비 · 털어 낸 액막(20 µm)이 더 녹일 수 있는 Cu (nm)
const MODE = {single: '한 번 쓰고 버림', recirc: '순환 · 보충 없음', dose: '순환 + 보충 · 일부 교체'};
const DEMO = {single: {mode: 'single', n: 300, dl: 2}, batch: {mode: 'recirc', n: 300, dl: 2}, rinse: {mode: 'single', n: 300, dl: 3}, bath: {mode: 'dose', n: 300, dl: 2}};
function sim(mode, n){
  const w = n / 24, r = [1], f = [1], cu = [0];
  let C = C0, Cu = 0, add = 0, risk = null, dead = null;
  for (let i = 0; i < 168; i++){
    if (mode === 'single'){ r.push(1); f.push(1); cu.push(0); continue; }
    const fi = Math.min(1, KPL * C / C0);
    Cu += CU1 * fi * w / VOL;
    const k = 0.002 + 0.01 * Cu;
    C = Math.max(0, C - (PX1 * fi * w / VOL + k * C));
    const t = i + 1;
    if (mode === 'dose'){
      if (t % 24 === 0){ Cu *= 1 - BLEED; C = (1 - BLEED) * C + BLEED * C0; }
      if (t % 4 === 0){ add += (C0 - C) * VOL; C = C0; }
    }
    r.push(C / C0); f.push(Math.min(1, KPL * C / C0)); cu.push(Cu);
    if (risk == null && C / C0 < RISK) risk = t;
    if (dead == null && C / C0 < 0.05) dead = t;
  }
  const mn = (a, b) => Math.min(...r.slice(a, b + 1));
  const use = mode === 'single' ? `${n} L/일` : mode === 'recirc' ? '60 L/교체' : `${Math.round(BLEED * VOL)} L/일`;
  return {r, f, cu, risk, dead, d1: mn(0, 24), d3: mn(48, 72), d7: mn(144, 168), cuMax: Math.max(...cu), h2o2: add / 7, use};
}
const pc = v => Math.round(v * 100);
const lvl = v => v >= 0.85 ? 'ok' : v >= RISK ? 'warn' : 'ng';
const hrs = t => t == null ? '없음 (7일 안)' : t < 48 ? `약 ${t} h 째` : `약 ${(t / 24).toFixed(1)}일 째`;
const extra = dl => KPL * RS * dl / 60;                   // 헹굼 지연 동안 고인 곳의 Cu 기둥 옆 깎임 (nm, 상한 · 베이스 다이 — 코어 다이는 범프에 Cu가 없어 Ni 발 밑 시드 몫)
// 바닥 그래프 (7일)
const GX0 = 130, GX1 = 960, GY0 = 1040, GY1 = 772, YMAX = 1.2;
const gx = t => GX0 + t / 168 * (GX1 - GX0), gy = v => GY0 - v / YMAX * (GY0 - GY1);
// 배치 카세트 (액조 안 자리) · 들어 올리는 높이 · 헹굼조까지 거리
const CX = 950, CY = 404, CW = 180, CH = 136, LIFT = 194, DX = 365;
// 좁은 세로 화면: 단계마다 한 판만 크게 (나머지 값은 카드의 결과 칸에)
const VN = {single: {x: 32, y: 122, w: 776, h: 536}, batch: {x: 812, y: 122, w: 756, h: 536}, rinse: {x: 784, y: 688, w: 768, h: 420}, bath: {x: 34, y: 688, w: 1008, h: 424}};

(window.EngrEtchChapters = window.EngrEtchChapters || []).push({
  no: '08', id: 'tool', part: 3, short: '장비 · 식각액', scale: '장비 · m',
  title: '장비와 식각액 — 장비 안에서 무슨 일이 일어날까?',
  hook: '멈추는 것도 식각의 일부다',
  one: '요즘 미세 범프의 시드 식각은 주로 웨이퍼를 한 장씩 돌리며 식각액을 뿌리는 낱장 장비에서 합니다(곧바로 헹궈 멈추고 웨이퍼 안 고르기를 맞추기 쉽다). 여러 장을 액조에 담그거나 함께 돌리며 뿌리는 배치 장비는 큰 범프 · 예전 공정에서 써 왔습니다. 어느 쪽이든 식각 → 곧바로 헹굼(멈춤) → 건조가 한 묶음이고, 쓰는 동안 식각액이 변하므로 농도 · 온도 · 나이를 지킵니다.',
  ana: '<b>샤워와 욕조</b> — 한 장씩 샤워(회전 스프레이)는 늘 새 물이 닿아 빠르고 고르지만 한 번에 한 장이고, 욕조(배치)는 여러 장을 한꺼번에 하지만 물이 덜 바뀌고 꺼낼 때 위아래 시간 차가 납니다. <i>(비유의 한계: 실제 장비는 여러 장을 돌리며 뿌리는 방식처럼 둘을 섞기도 하고, 식각액은 물과 달리 쓰면서 성분이 바뀝니다(과산화수소 분해 · 녹은 금속).)</i>',
  steps: [
    {id: 'single', viewN: VN.single, t: '한 장씩 — 회전 스프레이', d: '척이 웨이퍼를 돌리고, 팔이 오가며 노즐로 식각액을 뿌립니다. 회전 · 유량 · 노즐 위치 · 온도가 흐름(확산층)과 고르기를 정합니다. 컵이 튄 액을 모아 되돌리거나 버리고, 뒷면은 따로 막거나 헹굽니다.'},
    {id: 'batch', viewN: VN.batch, t: '여러 장 — 담금', d: '카세트에 여러 장(보통 25장)을 세워 액조에 담급니다. 넘쳐 흐르기 · 순환 · 흔들기로 섞습니다. 한꺼번에 많이 하지만 장 사이 · 위아래 흐름이 다르고 넣고 빼는 동안 시간 차가 생겨, 미세 범프에서는 낱장 장비를 더 많이 씁니다.'},
    {id: 'rinse', viewN: VN.rinse, t: '멈추고, 헹구고, 말리기', d: '식각은 액이 남아 있는 한 계속됩니다. 곧바로 많은 물로 헹궈 멈추고 회전 · 질소로 말립니다. 몇 초의 지연도 밑동을 더 깎습니다. Cu 식각과 Ti 식각 사이 헹굼은 Cu²⁺를 다음 액으로 넘기지 않는 일도 합니다. 늦은 건조는 물자국 · 변색을 남깁니다.'},
    {id: 'bath', viewN: VN.bath, t: '식각액은 늙는다', d: '과산화수소는 Cu를 녹이는 데 쓰이고, 저절로도 분해되어 줄어듭니다. 녹은 Cu²⁺는 쌓이면서 이 분해를 더 빠르게 합니다. 한 번 쓰고 버리거나, 순환하며 보충 · 일부 교체로 지킵니다. 처리 매수 · 시간 · 온도 · 농도를 함께 봅니다.'}
  ],
  icon(K){
    const {R, C, P} = K;
    return P('M6,26 L6,52 Q6,58 12,58 L54,58 Q60,58 60,52 L60,26', 'f-tank') + R(14, 40, 38, 4, 'f-wafer') + R(30, 8, 6, 12, 'f-plate') + C(33, 26, 2.5, 'et08-drop') + C(28, 32, 2, 'et08-drop');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, W} = K;
    const md = (modes, inner) => G(inner, {'data-mode': modes});
    let s = `<defs><clipPath id="et08-cl"><rect x="822" y="208" width="736" height="440"/></clipPath></defs>`;

    // ══ ① 왼쪽 위: 낱장(매엽) 장비 — 회전 스프레이 ══
    s += R(40, 130, 760, 520, 'pl-panel', {rx: 14}) + R(40, 130, 760, 520, 'pl-hlbox', W({rx: 14}, only('single')));
    s += LB(T(60, 166, '① 한 장씩 — 회전 스프레이', 't-acc', 'start') + T(60, 194, '낱장(매엽) 장비 · 개념도', 't-dim', 'start'));
    // 컵 · 척 · 축 · 모터
    s += G(P('M120,300 L120,500 Q120,520 140,520 L660,520 Q680,520 680,500 L680,300', 'f-tank') + P('M120,300 L162,326 M680,300 L638,326', 'f-tank'), tip('컵(보울) — 튄 액을 받아 되돌리거나 버린다.\n높이를 바꿔 액마다 회수 경로를 나누기도 한다'));
    s += LB(T(128, 290, '컵 (보울)', 't-dim', 'start'));
    s += R(390, 444, 20, 80, 'f-plate') + R(372, 522, 56, 30, 'f-psu', W({rx: 5}, tip('모터 — 척을 돌린다 (회전 속도 = 액막 두께 · 확산층)')));
    s += R(300, 428, 200, 16, 'f-plate', tip('척 — 웨이퍼를 잡고 돌린다'));
    s += R(200, 420, 400, 8, 'f-wafer', tip('웨이퍼 — 앞면(범프 · 시드)이 위')) + R(200, 416, 400, 4, 'f-seed2', tip('시드 — 실제 수백 nm (그림은 과장)'));
    s += R(200, 409, 400, 7, 'et08-film', W(only('single batch bath'), tip('식각액 액막 — 돌면서 얇게 퍼진다 (확산층이 얇다)')));
    s += R(200, 409, 400, 7, 'et08-wfilm', W(only('rinse'), tip('헹굼물 — 식각액을 묽혀 반응을 멈춘다')));
    s += `<circle r="5" class="et08-spin"><animateMotion dur="1.3s" repeatCount="indefinite" path="M200,423 A200,6 0 1 0 600,423 A200,6 0 1 0 200,423"/></circle>`;
    s += K.arrowP('M318,462 A82,14 0 0 0 482,462', 's-arr', tip('회전')) + LB(T(496, 476, '회전', 't-dim', 'start'));
    s += K.arrow(548, 506, 548, 440, 's-arr', tip('뒷면 노즐 — 뒷면을 헹구거나 막아 지킨다')) + LB(T(560, 500, '뒷면 노즐', 't-dim', 'start'));
    // 가장자리에서 튀어 나가는 액 (식각액 · 헹굼물)
    let fl = '', fw = '';
    for (let k = 0; k < 3; k++){
      fl += K.mover(204, 410, 132, 372 - k * 14, 4, 'et08-drop', 0.9, k * 0.3) + K.mover(596, 410, 668, 372 - k * 14, 4, 'et08-drop', 0.9, k * 0.3 + 0.15);
      fw += K.mover(204, 410, 132, 372 - k * 14, 4, 'et08-wdrop', 0.9, k * 0.3) + K.mover(596, 410, 668, 372 - k * 14, 4, 'et08-wdrop', 0.9, k * 0.3 + 0.15);
    }
    s += G(fl, only('single bath')) + G(fw, only('rinse'));
    // DI · N₂ 노즐 (헹굼 단계에서 일한다)
    s += R(576, 298, 16, 32, 'et08-di', W({rx: 3}, tip('DI 노즐 — 많은 물로 헹궈 식각을 멈춘다'))) + LB(T(584, 288, 'DI', 't-dim'));
    s += R(226, 298, 16, 32, 'et08-n2', W({rx: 3}, tip('N₂ 노즐 — 돌리며 질소로 말린다'))) + LB(T(234, 288, 'N₂', 't-dim'));
    let rn = R(568, 292, 32, 44, 'et08-hi', {rx: 6}) + R(218, 292, 32, 44, 'et08-hi', {rx: 6});
    for (let k = 0; k < 6; k++) rn += K.mover(584, 334, 380 + k * 34, 406, 4, 'et08-wdrop', 0.8, k * 0.13);
    for (let k = 0; k < 3; k++) rn += P(`M${238 + k * 6},334 L${300 + k * 60},404`, 'et08-wind');
    s += G(rn, only('rinse'));
    // 팔 · 노즐: 일할 때는 오가며 뿌린다 (옆에서 본 그림이라 좌우로 오간다), 쉴 때는 컵 밖에 둔다
    let arm = `<line x1="750" y1="252" x2="290" y2="252" class="et08-arm"><animate attributeName="x2" values="290;540;290" dur="5s" repeatCount="indefinite"/></line>`;
    let nz = R(-11, 252, 22, 36, 'f-plate', {rx: 3}) + P('M-11,288 L11,288 L5,298 L-5,298 Z', 'f-plate');
    for (let k = 0; k < 5; k++) nz += K.mover(0, 300, (k - 2) * 20, 404, 4, 'et08-drop', 0.7, k * 0.14);
    arm += `<g>${nz}<animateTransform attributeName="transform" type="translate" values="290 0;540 0;290 0" dur="5s" repeatCount="indefinite"/></g>`;
    s += G(arm, W(only('single bath'), tip('팔 · 식각액 노즐 — 오가며 뿌려 중심 · 가장자리를 고르게')));
    s += G(L(750, 252, 712, 252, 'et08-arm') + R(701, 252, 22, 36, 'f-plate', {rx: 3}), W(only('batch rinse'), tip('식각액 노즐 — 헹굼 때는 컵 밖에서 쉰다')));
    s += C(750, 252, 11, 'f-plate', tip('팔 축 — 팔이 이 축을 중심으로 웨이퍼 위를 오간다'));
    s += LB(T(736, 240, '팔 · 노즐 — 오가며 식각액을 뿌린다', 't-dim', 'end'));
    // 순환: 컵 → 탱크 → 펌프 → 필터 → 팔 (운영 방식에 따라 바뀐다)
    s += `<g data-v="tank"></g>`;
    s += P('M320,598 L454,598 M486,598 L528,598 M556,598 L770,598 L770,252 L761,252', 'pl-pipe');
    s += G(P('M320,598 L770,598 L770,252 L762,252', 's-flow'), only('single bath'));
    s += C(470, 598, 16, 'pl-pump', tip('펌프 — 액을 노즐로 보낸다')) + P('M462,590 L480,598 L462,606 Z', 'k-acc') + LB(T(470, 640, '펌프', 't-dim'));
    s += R(528, 580, 28, 36, 'pl-filt', W({rx: 4}, tip('필터 — 입자 · 석출물을 거른다'))) + LB(T(542, 640, '필터', 't-dim'));
    s += md('recirc dose', P('M240,520 L240,566', 'pl-pipe') + P('M240,522 L240,566', 's-flow', tip('컵에 모인 액이 탱크로 돌아간다 (순환)')));
    s += md('single', P('M150,520 L150,556 L66,556', 'pl-pipe') + K.arrow(70, 556, 46, 556, 's-arrr') + LB(T(52, 541, '폐액', 't-dim', 'start')) + K.arrow(46, 600, 156, 600, 's-arrg', tip('새 액 — 한 장에 한 번 쓰고 버린다')) + LB(T(52, 590, '새 액', 't-dim', 'start')));
    s += md('dose', R(54, 516, 26, 40, 'pl-bottle', W({rx: 5}, tip('H₂O₂ 보충 — 4 h마다 처음 농도로 (예시)'))) + LB(T(88, 544, 'H₂O₂', 't-dim', 'start')) + K.arrowP('M67,558 L67,574 L156,574', 's-arr3') +
      K.arrow(46, 594, 156, 594, 's-arrg', tip('새 액 — 버린 만큼 채운다')) + K.arrow(160, 612, 48, 612, 's-arrr', tip('일부 교체 — 하루 40 %를 버린다 (예시)')) + LB(T(50, 640, '하루 40 % 교체', 't-dim', 'start')));

    // ══ ② 오른쪽 위: 배치 장비 — 담금 ══
    s += R(820, 130, 740, 520, 'pl-panel', {rx: 14}) + R(820, 130, 740, 520, 'pl-hlbox', W({rx: 14}, only('batch')));
    s += LB(T(840, 166, '② 여러 장 — 담금 (배치)', 't-acc', 'start') + T(840, 194, '카세트째 담그는 장비 · 개념도', 't-dim', 'start'));
    s += L(850, 206, 1540, 206, 'et08-rail', tip('로봇 레일 — 카세트를 들어 올려 옮긴다'));
    // 식각액조 (넘침 둑) · 헹굼조
    s += R(860, 350, 360, 222, 'pl-weir', tip('넘침 둑 — 액조를 넘친 액이 모여 순환으로 돌아간다'));
    s += R(882, 382, 316, 180, 'f-etl', tip('식각액 — 예: 묽은 과산화수소 + 황산 (기준 액)')) + R(880, 368, 320, 196, 'f-tank');
    s += P('M880,370 C872,360 866,366 866,382', 's-flow') + P('M1200,370 C1208,360 1214,366 1214,382', 's-flow');
    s += LB(T(862, 338, '식각액조', 't-sub', 'start'));
    s += R(1302, 382, 226, 180, 'f-rinse', tip('헹굼조 — 물을 채웠다 한꺼번에 빼기를 되풀이한다 (퀵 덤프, QDR)')) + R(1300, 368, 230, 196, 'f-tank');
    s += LB(T(1300, 340, '헹굼조', 't-sub', 'start') + T(1546, 602, '퀵 덤프 (QDR)', 't-dim', 'end') + T(1546, 628, '빠른 배수 · 채움', 't-dim', 'end'));
    // 순환: 넘침 → 펌프 → 필터 → 히터 → 액조 바닥
    s += P('M870,572 L870,606 L944,606 M976,606 L1004,606 M1030,606 L1062,606 M1102,606 L1186,606 L1186,566', 'pl-pipe');
    s += G(P('M870,574 L870,606 L1186,606 L1186,566', 's-flow') + P('M912,556 L912,394 M1166,556 L1166,394', 's-flow'), only('batch bath'));
    s += C(960, 606, 16, 'pl-pump', tip('펌프 — 넘친 액을 돌린다')) + P('M952,598 L970,606 L952,614 Z', 'k-acc') + LB(T(960, 642, '펌프', 't-dim'));
    s += R(1004, 590, 26, 32, 'pl-filt', W({rx: 4}, tip('필터'))) + LB(T(1017, 642, '필터', 't-dim'));
    s += R(1062, 590, 40, 32, 'pl-hx', W({rx: 4}, tip('히터 — 액 온도를 지킨다 (03장: 표면 반응은 온도에 민감)'))) + LB(T(1082, 642, '히터', 't-dim'));
    // 카세트 (웨이퍼를 세워 담는다). 위로 이어진 걸이는 레일 아래만 보이게 자른다
    const cas = (drip) => {
      let c = L(CX + CW / 2, CY - 230, CX + CW / 2, CY - 8, 'et08-hang') + R(CX + CW / 2 - 22, CY - 10, 44, 10, 'f-plate', {rx: 3});
      c += R(CX, CY, CW, CH, 'et08-cas', {rx: 6});
      for (let k = 0; k < 6; k++) c += R(CX + 16 + k * 30, CY + 6, 6, CH - 12, 'f-wafer');
      // 옮기는 동안만 떨어지는 방울 (헹굼조에 잠긴 뒤에는 감춘다)
      if (drip){
        let d = '';
        for (let k = 0; k < 4; k++) d += K.mover(CX + 30 + k * 40, CY + CH + 4, CX + 30 + k * 40, CY + CH + 70, 3.5, 'et08-drop', 0.8, k * 0.2);
        c += `<g opacity="0">${d}<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.2;.8;1" dur="2.6s" begin="indefinite" fill="freeze" data-et08="rinse"/></g>`;
      }
      return c;
    };
    const car = x => R(x + CX + CW / 2 - 24, 198, 48, 16, 'f-plate', {rx: 4});
    // single · bath: 액조 안에 가만히
    s += G(G(cas(false), {'clip-path': 'url(#et08-cl)'}) + car(0), W(only('single bath'), tip('카세트 — 여러 장을 세워 담는다 (그림은 6장)')));
    // batch: 내려가 담긴 뒤 위아래로 흔든다 (단계에 들어올 때 한 번)
    s += G(G(G(`<g>${cas(false)}<animateTransform attributeName="transform" type="translate" values="0 -5;0 5;0 -5" dur="2.4s" repeatCount="indefinite"/></g>` +
      `<animateTransform attributeName="transform" type="translate" values="0 -${LIFT};0 0" keyTimes="0;1" keySplines=".3 0 .3 1" calcMode="spline" dur="1.5s" begin="indefinite" fill="freeze" data-et08="batch"/>`), {'clip-path': 'url(#et08-cl)'}) + car(0), W(only('batch'), tip('카세트째 담그고 위아래로 흔든다')));
    // rinse: 들어 올려 헹굼조로 (그동안에도 액이 묻어 녹는다)
    s += G(G(G(cas(true) + `<animateTransform attributeName="transform" type="translate" values="0 0;0 -${LIFT};${DX} -${LIFT};${DX} 0" keyTimes="0;.3;.7;1" dur="2.6s" begin="indefinite" fill="freeze" data-et08="rinse"/>`, {transform: `translate(${DX} 0)`}), {'clip-path': 'url(#et08-cl)'}) +
      G(car(0) + `<animateTransform attributeName="transform" type="translate" values="0 0;0 0;${DX} 0;${DX} 0" keyTimes="0;.3;.7;1" dur="2.6s" begin="indefinite" fill="freeze" data-et08="rinse"/>`, {transform: `translate(${DX} 0)`}), only('rinse'));
    s += G(K.arrow(1330, 568, 1330, 614, 's-arr', tip('퀵 덤프 — 헹굼물을 한꺼번에 뺀다')) + LB(T(1540, 164, '들어 올려 옮기는 몇 초에도 녹는다', 't-warn', 'end') + T(1540, 190, '아래쪽이 더 오래 젖는다 → 위아래 시간 차', 't-dim', 'end')), only('rinse'));
    s += G(LB(T(1150, 256, '카세트째 담근다', 't-sub', 'start') + T(1150, 284, '보통 25장 · 그림은 6장', 't-dim', 'start')), only('batch'));
    // bath: 두 액 모두 과산화수소가 분해되며 O₂ 거품
    let bb = '';
    for (let k = 0; k < 5; k++) bb += K.bubble(900 + k * 6, 552 - k * 18, 4 + (k % 2) * 2, 160 - k * 18, 2.6 + k * 0.3, k * 0.6) + K.bubble(1180 - k * 4, 552 - k * 16, 4 + (k % 3), 160 - k * 16, 2.4 + k * 0.35, k * 0.5);
    s += G(bb, W(only('bath'), tip('O₂ 거품 — 과산화수소가 분해되며 나온다')));
    // 비활성 장비는 흐리게 (가림막)
    s += R(820, 130, 740, 520, 'et08-veil', W({rx: 14}, only('single')));
    s += R(40, 130, 760, 520, 'et08-veil', W({rx: 14}, only('batch')));
    // 액 나이 계기 (모든 단계 · 위젯 값)
    s += '<g data-v="gauge"></g>';

    // ══ 아래 패널 ══
    s += R(40, 680, 1520, 430, 'pl-panel', {rx: 14}) + R(40, 680, 1520, 430, 'pl-hlbox', W({rx: 14}, only('rinse bath')));
    const items = (x, y0, list) => list.map(([h, d], k) => T(x, y0 + k * 66, h, 't-sub', 'start') + T(x + 18, y0 + k * 66 + 27, d, 't-dim', 'start')).join('');
    const foot = T(64, 1094, '장비 일반(배치 · 낱장, 헹굼 · 건조)은 PR 스트립 05장과 같다 — 이 장은 식각에만 있는 것을 본다', 't-dim', 'start');
    s += G(LB(T(64, 718, '흐름과 고르기 — 결과를 정하는 손잡이', 'pl-hdg', 'start') + items(64, 762, [
      ['회전 속도', '빠를수록 액막 · 확산층이 얇아져 빨라진다 (03장)'],
      ['유량 · 노즐 위치 · 팔 움직임', '중심 · 가장자리 고르기 → 장비 속도 맵 (07장)'],
      ['온도', '표면 반응 속도 · 과산화수소 분해 빠르기'],
      ['한 번 쓰고 버림 / 순환', '쓸수록 액이 늙는다 → 위 계기 · 마지막 단계']]) +
      T(800, 718, '식각 장비에서 함께 챙기는 것', 'pl-hdg2', 'start') + items(800, 762, [
      ['뒷면 · 가장자리', '뒷면 노즐로 헹구거나 막아 지킨다'],
      ['식각 → 헹굼 → 건조를 한 챔버에서', '헹굼으로 멈추기까지 걸리는 시간이 짧다 (다음 단계)'],
      ['Cu 액 · Ti 액 회수 경로를 따로', '컵 높이로 나눈다 — Cu²⁺가 다음 액에 섞이지 않게'],
      ['오래 쉬었다 시작한 첫 장', '배관 속 액의 온도 · 농도가 다르다 → 미리 흘려보내기'],
      ['배기', '미스트 · 분해 가스(O₂)를 빼낸다 — 암모니아 · HF 액은 전용 배기']]) + foot), only('single'));
    s += G(LB(T(64, 718, '배치 — 많이, 한꺼번에', 'pl-hdg', 'start') + items(64, 762, [
      ['넘쳐 흐르기 · 순환 · 흔들기', '아래에서 올라온 액이 넘쳐 돈다 — 확산층을 맞춘다'],
      ['카세트째 여러 장 (보통 25장)', '장마다 · 위아래로 흐름이 조금씩 다르다'],
      ['넣고 빼는 시간 차', '먼저 잠기고 늦게 나오는 아래쪽이 더 녹는다 → 위아래 무늬'],
      ['액 부피가 크다', '농도는 천천히 변하지만, 바뀌면 많은 웨이퍼에 영향']]) +
      T(800, 718, '낱장과 다른 점', 'pl-hdg2', 'start') + items(800, 762, [
      ['담금은 확산층이 두껍다', '같은 액이라도 회전 스프레이보다 느리다 (03장)'],
      ['옮기는 동안 마르면', '얼룩 · 물자국 — 젖은 채로 빨리 옮긴다'],
      ['헹굼조로 옮겨 멈춘다', '퀵 덤프(빠른 배수 · 채움)를 되풀이 (다음 단계)'],
      ['배치 스프레이도 있다', '여러 장을 돌리며 뿌리는 방식 — 범프 하부 금속 식각에 써 왔다']]) + foot), only('batch'));
    s += G('<g data-v="rinse"></g>', only('rinse'));
    s += G('<g data-v="graph"></g>', only('bath'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 식각액 나이와 헹굼 지연</div>
      ${K.seg('mode', [['single', '한 번 쓰고 버림'], ['recirc', '순환 · 보충 없음'], ['dose', '순환 + 보충 · 일부 교체']], 'recirc', '식각액 운영')}
      ${K.ctl('n', '하루 처리 매수', 50, 600, 10, 300)}${K.ctl('dl', '헹굼까지 지연 (s)', 0, 10, 0.5, 2)}
      ${K.kpis([['하루 동안 최저 속도', 'k-d1', '처음 대비 · 장면 위 계기'], ['3일째 속도', 'k-d3', '그날 최저 · 처음 대비'], ['잔여 위험 시작', 'k-risk', '속도 < 77 % (과식각 여유 30 %)'], ['Cu 쌓임', 'k-cu', '7일 중 최고 (g/L)'], ['약품 사용량', 'k-use', '새 액 (보충 H₂O₂ 따로)'], ['지연의 추가 옆 깎임', 'k-dl', 'nm · 새 액 · 고인 곳의 상한']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('식각액 60 L, 처음 H₂O₂ 1.5 g/L(기준 액 0.15 wt%). 웨이퍼 한 장이 다 녹이는 Cu 0.17 g(300 mm · 300 nm · 면적 90 %), 쓰는 H₂O₂ 0.09 g × 1.5(분해 몫 포함). 속도 ∝ H₂O₂ 농도(03장 모델에서 공급 · 반응 모두 농도에 비례). 실제로 녹인 몫 f = min(1, 1.3 × C/C₀) — 속도가 과식각 여유(30 %)보다 떨어지면 그 장은 덜 녹인다(잔여). 매 시간 Cu += 0.17 g × f × 매수/24 ÷ 60 L, H₂O₂ −= 0.135 g × f × 매수/24 ÷ 60 L + k·C (C ≥ 0), 분해 k = 0.2 %/h + 1 %/h × Cu(g/L). 보충 · 교체: 4 h마다 H₂O₂를 처음 농도로, 하루 40 %를 버리고 새 액. 한 번 쓰고 버림: 웨이퍼당 새 액 1 L. 지연 깎임 = 1.3 × 300 nm/분 × 지연 (도금 Cu 기둥, 액이 고여 바뀌지 않는 곳의 상한). 모든 상수는 예시이고, 실제 액은 분석값과 블랭킷 속도로 관리합니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, PG, PL, T, TT, G, LB, tip, W} = K;
    const st = {mode: 'recirc', n: 300, dl: 2};
    const touched = {};
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const press = v => ctx.card.querySelectorAll('.pl-seg[data-g="mode"] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === v)));
    const cls = (id, c) => { const k = ctx.card.querySelector(`[data-o="${id}"]`).parentNode; ['ok', 'warn', 'ng'].forEach(x => k.classList.toggle(x, x === c)); };
    const set = (sel, html) => { const el = ctx.$(sel); if (el) el.innerHTML = html; };
    let memo = {};
    const run = () => { const key = st.mode + st.n; return memo[key] || (memo[key] = sim(st.mode, st.n)); };
    // 위쪽 계기: 운영 방식 · 하루 동안 최저 속도
    function gauge(m){
      const v = m.d1, c = lvl(v);
      let g = R(452, 142, 336, 72, 'et08-gauge', W({rx: 10}, tip('식각액 나이 계기 (위젯 값)\n하루(24 h) 동안 가장 낮은 식각 속도 — 처음 대비\n77 % 아래면 같은 레시피 시간으로 잔여 위험')));
      g += T(468, 168, '식각액: ' + MODE[st.mode], 't-dim', 'start');
      g += T(468, 200, '하루 동안 최저 속도', 't-sub', 'start') + T(774, 202, `${pc(v)} %`, 'et08-gv et08-' + c, 'end');
      g += R(452, 208, 336 * Math.max(0.01, Math.min(1, v)), 6, 'et08-gb' + c);
      return LB(g);
    }
    // 낱장 장비의 탱크 (Cu 가 쌓일수록 푸르게) · 거품 · 운영 방식
    function tank(m){
      const cu = st.mode === 'single' ? 0 : m.cu[24], q = Math.min(1, cu / 2.2);
      const col = `rgba(${Math.round(45 + 14 * q)},${Math.round(212 - 82 * q)},${Math.round(191 + 55 * q)},${(0.28 + 0.3 * q).toFixed(2)})`;
      let g = R(160, 566, 160, 52, 'et08-tank', W({rx: 6}, tip(st.mode === 'single' ? `새 액 탱크 — 데워서 노즐로 보낸다\n쓴 액은 버린다: 하루 ${st.n} L (웨이퍼당 1 L, 예시)` : `순환 탱크 · 히터 — 컵에서 돌아온 액을 데워 다시 보낸다\n하루 뒤 Cu 약 ${cu.toFixed(2)} g/L (위젯 · 예시)`)));
      g += R(164, 576, 152, 38, 'et08-liq', {style: `fill:${col}`});
      g += LB(T(240, 602, st.mode === 'single' ? `새 액 ${st.n} L/일` : '순환 탱크', 't-dim'));
      let bb = '';
      const nb = st.mode === 'single' ? 1 : 2 + Math.round(cu * 2.5);
      for (let k = 0; k < nb; k++) bb += K.bubble(k % 2 ? 300 - (k * 7) % 18 : 176 + (k * 7) % 18, 612, 3 + (k % 3), 34, 1.8 + (k % 4) * 0.3, k * 0.37);
      g += G(bb, K.only('bath'));
      return g;
    }
    // 헹굼 단계: 왼쪽 설명 · 오른쪽 상자 = 시간 막대 + 범프 사이 고인 액
    function rinse(){
      const PS = 28, x0 = 966, dl = st.dl, wd = PS * dl, xr = x0 + wd, xd = xr + 150, ex = extra(dl), op = Math.min(FILM, ex);
      let g = T(64, 716, '멈추는 것도 식각의 일부 — 헹굼까지의 몇 초', 't-acc', 'start');
      g += TT(64, 774, [
        `① 지연 ${dl} s → 고인 곳 Cu 기둥 옆 약 ${Math.round(ex)} nm 더 (상한)`,
        '② 털어 낸 얇은 액막은 산화제가 금방 바닥나 수 nm에서 멈춘다',
        '③ Cu 식각 → Ti 식각 사이 헹굼 = Cu²⁺를 다음 액으로 넘기지 않기',
        '④ 배치: 들어 올리는 몇 초 — 위 · 아래 시간 차 → 위아래 무늬',
        '⑤ 건조가 늦거나 고르지 않으면 물자국 · 산화(변색)',
        '⑥ 다음 공정까지 대기 시간(Q-time) 관리 → 리플로우 03장'], 't-sub', 'start', 52);
      // 시간 막대 (식각 · 헹굼 · 건조는 줄여 그림, 지연만 실제 비율)
      g += R(790, 694, 756, 408, 'pl-box', {rx: 12});
      g += T(806, 726, '한 장의 끝 — 식각 → 헹굼 → 건조', 't-sub', 'start') + T(1530, 726, '지연만 실제 비율 (1 칸 = 1 s)', 't-dim', 'end');
      const brk = x => P(`M${x - 6},790 L${x + 6},740`, 'et08-brk');
      g += R(806, 742, 160, 46, 'et08-bet', tip('식각 — Cu 시드 레시피 예: 300 nm ÷ 300 nm/분 × 1.3 = 78 s (막대 길이는 실제 비율 아님)')) + brk(950) + T(874, 773, '식각 78 s', 't-sub');
      if (wd > 0){
        g += R(x0, 742, wd, 46, 'et08-delay', tip(`지연 ${dl} s — 노즐 바꾸기 · 밸브 · 팔 이동. 액이 남아 계속 녹는다`));
        for (let k = 1; k < dl; k++) g += L(x0 + PS * k, 742, x0 + PS * k, 788, 'et08-tick');
      }
      g += R(xr, 742, 150, 46, 'et08-bri', tip('DI 헹굼 — 많은 물로 식각액을 묽혀 멈춘다 (막대 길이는 실제 비율 아님)')) + brk(xr + 134) + T(xr + 66, 773, 'DI 헹굼', 't-sub');
      g += R(xd, 742, 130, 46, 'et08-dry', tip('회전 · N₂ 건조 — 물자국 없이 (막대 길이는 실제 비율 아님)')) + T(xd + 65, 773, 'N₂ 건조', 't-sub');
      g += wd > 0 ? T(wd >= 70 ? x0 + wd / 2 : x0, 816, `지연 ${dl} s`, 't-warn', wd >= 70 ? 'middle' : 'start') + T(x0, 842, '↑ 액이 남아 계속 녹는다', 't-dim', 'start') : T(x0, 816, '지연 0 s — 곧바로 헹굼', 't-warn', 'start');
      // 범프 사이에 고인 액 (단면, 1 µm = 5 px: 지름 25 · 틈 30 · 베이스 다이 Cu 기둥 12 + Ni 3 + 상부 Cu 3 + SnAg 12 µm)
      const BY = 1068, XL = 1010, XR = 1285;
      const bump = x => R(x, BY - 60, 125, 60, 'f-cu2', tip('Cu 기둥 — 높이 · 전기 (12 µm, 베이스 다이 예시)')) + R(x, BY - 75, 125, 15, 'f-ni', tip('Ni — Cu 기둥과 솔더 사이 방벽 (3 µm)')) +
        R(x, BY - 90, 125, 15, 'f-cu2', tip('상부 Cu — 솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로 (Ni 위에 얇게 한 번 더 올린 Cu, 3 µm)\n트인 옆면이라 얇은 액막만 닿는다')) + R(x, BY - 150, 125, 60, 'f-sn2', tip('SnAg — 녹아서 붙는 솔더 (12 µm)'));
      let z = T(806, 878, '범프 사이에 고인 액 (베이스 다이 단면 · 예시)', 't-dim', 'start');
      z += R(990, BY + 4, 450, 14, 'f-wafer') + R(990, BY, 450, 4, 'f-ti');
      z += P(`M${XL + 125},${BY} L${XL + 125},${BY - 58} Q1210,${BY - 28} ${XR},${BY - 58} L${XR},${BY} Z`, 'et08-pool', tip(`고인 액 — 헹굼물이 닿을 때까지 계속 녹는다 (지연 ${dl} s → 약 ${Math.round(ex)} nm, 상한)`));
      z += P(`M${XL},${BY} L${XL - 18},${BY} Q${XL - 4},${BY - 4} ${XL},${BY - 18} Z M${XR + 125},${BY} L${XR + 143},${BY} Q${XR + 129},${BY - 4} ${XR + 125},${BY - 18} Z`, 'et08-pool');
      z += bump(XL) + bump(XR);
      const ew = ex > 0 ? Math.max(2, Math.min(10, ex / 6)) : 0;
      if (ew) z += R(XL + 125 - ew, BY - 58, ew, 58, 'et08-eat', tip('더 깎이는 Cu 기둥 옆 (폭 과장) — 코어 다이(Ni / SnAg)는 범프에 Cu가 없어 Ni 발 밑 시드만 더 파인다')) + R(XR, BY - 58, ew, 58, 'et08-eat');
      z += R(XL, BY - 153, 125, 3, 'et08-film') + R(XR, BY - 153, 125, 3, 'et08-film') + R(990, BY - 3, XL - 990 - 18, 3, 'et08-film') + R(XR + 143, BY - 3, 1440 - XR - 143, 3, 'et08-film');
      z += R(XL - 3, BY - 150, 3, 132, 'et08-film', tip('트인 옆면의 얇은 액막 — 산화제가 금방 바닥나 수 nm에서 멈춘다')) + R(XR + 125, BY - 150, 3, 132, 'et08-film');
      z += L(992, 968, XL - 5, BY - 40, 's-lead') + T(806, 944, '트인 옆면 — 얇은 액막', 't-dim', 'start') +
        T(806, 972, ex > FILM ? `약 ${Math.round(FILM)} nm에서 멈춤` : `약 ${Math.round(op)} nm`, 'et08-val2', 'start');
      z += T(1210, 966, `≤ ${Math.round(ex)} nm`, 'et08-val') + T(1210, 994, '고인 액', 't-dim');
      z += L(1458, 1040, 1508, 1040, 'et08-scl') + T(1483, 1030, '10 µm', 't-dim');
      g += z;
      return LB(g);
    }
    // 식각액 나이 그래프 (7일) + 오른쪽 '지금' 요약
    function graph(m){
      const cmax = Math.max(3, Math.ceil(m.cuMax)), gc = c => GY0 - c / cmax * (GY0 - GY1);
      let g = T(64, 716, '식각액의 나이 — 7일', 't-acc', 'start') + T(1020, 716, `하루 ${st.n}장 · ${MODE[st.mode]}`, 't-dim', 'end');
      const leg = (x, cl, t) => L(x, 742, x + 36, 742, cl) + T(x + 44, 748, t, 't-dim', 'start');
      g += leg(64, 's-curve', '식각 속도 ∝ H₂O₂') + leg(300, 'et08-fl', '레시피 안에 지운 몫') + leg(546, 's-curve2', 'Cu g/L (오른쪽)') + leg(762, 'pl-peak', '여유 끝 77 %');
      // 축 · 눈금
      [0.25, 0.5, 0.75, 1].forEach(v => { g += L(GX0, gy(v), GX1, gy(v), 'et08-grid'); });
      g += L(GX0, GY0, GX1, GY0, 's-axis') + L(GX0, GY1, GX0, GY0, 's-axis') + L(GX1, GY1, GX1, GY0, 's-axis');
      [0, 0.5, 1].forEach(v => { g += T(GX0 - 10, gy(v) + 7, `${pc(v)} %`, 't-dim', 'end'); });
      for (let c = 0; c <= cmax; c++) g += T(GX1 + 10, gc(c) + 7, String(c), 'et08-cuv', 'start');
      for (let d = 0; d <= 7; d++) g += L(gx(24 * d), GY0, gx(24 * d), GY0 + 7, 's-axis') + T(gx(24 * d), GY0 + 28, String(d), 't-dim');
      g += T((GX0 + GX1) / 2, 1096, '날짜 (일)', 't-dim');
      // 더 지울 수 없는 구간 · 잔여 위험 시작
      if (m.dead != null){
        g += R(gx(m.dead), GY1, GX1 - gx(m.dead), GY0 - GY1, 'et08-deadz', tip('H₂O₂가 처음의 5 % 아래 — 이 액으로는 더 지울 수 없다'));
        g += T(GX1 - 10, 806, '더 지울 수 없음', 't-warn', 'end');
      }
      g += L(GX0, gy(RISK), GX1, gy(RISK), 'pl-peak', tip('속도 77 % = 1 ÷ (1 + 과식각 30 %)\n이 아래면 같은 레시피 시간으로 가장 늦은 곳에 잔여가 남기 시작한다'));
      if (m.risk != null){
        const xr = gx(m.risk), far = xr > 640;
        g += L(xr, GY1, xr, GY0, 'et08-rk') + T(far ? xr - 10 : xr + 10, m.dead != null && far ? 840 : 806, `잔여 위험 — ${hrs(m.risk)}`, 't-warn', far ? 'end' : 'start');
      }
      if (st.mode === 'single') g += T(GX0 + 14, 800, '늘 새 액 — 속도가 일정하다', 't-sub', 'start');
      if (st.mode === 'dose'){
        const cs = CU1 * st.n / VOL / BLEED;
        g += L(GX0, gc(cs), GX1, gc(cs), 'et08-cs', tip(`Cu 정상 상태 — 교체 직전 ≈ 하루 증가 ÷ 40 % ≈ ${cs.toFixed(1)} g/L`));
        for (let d = 1; d <= 7; d++) g += PG([[gx(24 * d) - 8, GY0], [gx(24 * d) + 8, GY0], [gx(24 * d), GY0 - 14]], 'et08-tri', tip('하루 40 % 교체'));
      }
      // 곡선 (보충 · 버림 방식이면 '보충 없이 순환'을 흐리게 함께 — 비교)
      const pts = arr => arr.map((v, t) => [gx(t), v]);
      if (st.mode !== 'recirc'){
        const ref = memo['recirc' + st.n] || (memo['recirc' + st.n] = sim('recirc', st.n));
        g += PL(pts(ref.r.map(gy)), 'et08-ref', tip('비교: 같은 매수를 보충 없이 순환하면'));
        g += T(gx(84), 1012, '↙ 비교: 보충 없이 순환하면', 'et08-reft', 'start');
      }
      g += PL(pts(m.cu.map(gc)), 's-curve2', tip('녹은 Cu (g/L, 오른쪽 눈금) — 과산화수소 분해를 거든다'));
      g += PL(pts(m.f.map(gy)), 'et08-fl', tip('레시피 시간 안에 지운 몫 f = min(1, 1.3 × 속도)\n1 아래면 그 장은 덜 지워져 잔여'));
      g += PL(pts(m.r.map(gy)), 's-curve', tip('식각 속도 (처음 대비) — H₂O₂ 농도에 비례'));
      // 오른쪽: 지금 (위젯 값) — 발표 모드에서도 숫자가 보이게
      let sm = R(1050, 694, 496, 408, 'pl-box', {rx: 12}) + T(1066, 726, '지금 (위젯 값 · 예시)', 't-acc', 'start');
      const rows = [['하루 동안 최저 속도', `${pc(m.d1)} %`, lvl(m.d1)], ['3일째 최저 속도', `${pc(m.d3)} %`, lvl(m.d3)], ['잔여 위험 시작', m.risk == null ? '없음 (7일)' : hrs(m.risk).replace(' 째', ''), m.risk == null ? 'ok' : 'ng'],
        ['더 지울 수 없음', m.dead == null ? '없음 (7일)' : hrs(m.dead).replace(' 째', ''), m.dead == null ? 'ok' : 'ng'], ['Cu 쌓임 (7일 중 최고)', st.mode === 'single' ? '0 g/L' : `${m.cuMax.toFixed(2)} g/L`, 'cu'], ['새 액', m.use + (st.mode === 'dose' ? ' + 보충' : ''), 'nt']];
      rows.forEach(([a, b, c], k) => { const y = 774 + k * 44; sm += T(1066, y, a, 't-sub', 'start') + T(1530, y, b, 'et08-sv et08-' + c, 'end'); });
      const note = st.mode === 'single' ? '늘 새 액이라 속도는 일정하지만, 약품을 처리 매수만큼 쓴다' : st.mode === 'recirc' ? '녹은 Cu가 과산화수소 분해를 거들어 늙을수록 더 빨리 늙는다' : `톱니 = 4 h마다 H₂O₂ 보충 · ▲ 하루 40 % 교체 · 주황 점선 = Cu 정상 상태 ≈ ${(CU1 * st.n / VOL / BLEED).toFixed(1)} g/L`;
      sm += TT(1066, 1046, K.wrap(note, 23), 't-dim', 'start', 26);
      return LB(g + sm);
    }
    function render(){
      const m = run();
      set('[data-v="gauge"]', gauge(m));
      set('[data-v="tank"]', tank(m));
      ctx.$$('[data-mode]').forEach(g => g.classList.toggle('hide', !g.getAttribute('data-mode').split(' ').includes(st.mode)));
      set('[data-v="rinse"]', rinse());
      set('[data-v="graph"]', graph(m));
      ctx.refresh();
      const ex = extra(st.dl);
      ctx.out('k-d1', `${pc(m.d1)} %`); ctx.out('k-d3', `${pc(m.d3)} %`); ctx.out('k-risk', m.risk == null ? '없음' : hrs(m.risk).replace(' 째', ''));
      ctx.out('k-cu', st.mode === 'single' ? '0 (늘 새 액)' : `${m.cuMax.toFixed(2)} g/L`); ctx.out('k-use', m.use); ctx.out('k-dl', `약 ${Math.round(ex)} nm`);
      cls('k-d1', lvl(m.d1)); cls('k-d3', lvl(m.d3)); cls('k-risk', m.risk == null ? 'ok' : 'ng'); cls('k-dl', ex < 10 ? 'ok' : ex < 30 ? 'warn' : 'ng');
      let msg;
      if (st.mode === 'single') msg = `<b>한 번 쓰고 버림</b> — 늘 새 액이라 속도가 일정합니다(100 %). 대신 새 액을 하루 <b>${st.n} L</b> 씁니다(웨이퍼당 1 L, 예시).`;
      else if (st.mode === 'recirc') msg = m.risk != null ? `<b>보충 없이 순환</b>하면 묽은 기준 액은 ${hrs(m.risk)}부터 속도가 여유(30 %)를 다 씁니다(하루 동안 최저 ${pc(m.d1)} %, 3일째 ${pc(m.d3)} %). 녹은 Cu가 과산화수소 분해를 거들어 점점 더 빨리 약해집니다${m.dead != null ? ` — ${hrs(m.dead)}에는 이 액으로 더 지울 수 없습니다` : ''}. 같은 레시피에서 잔여가 늘면 <b>액 나이</b>부터 봅니다.`
        : `하루 ${st.n}장이면 7일 동안 여유(77 %) 안에 머뭅니다(7일째 최저 ${pc(m.d7)} %). 그래도 Cu가 쌓여(${m.cuMax.toFixed(2)} g/L) 분해가 점점 빨라집니다.`;
      else msg = `<b>보충(4 h마다)과 하루 40 % 교체</b>로 Cu가 약 ${(CU1 * st.n / VOL / BLEED).toFixed(1)} g/L 근처에 묶이고, 속도는 ${pc(m.d7)} % 위에 머뭅니다(7일째 최저). 새 액 24 L/일에 H₂O₂ 보충 약 ${Math.round(m.h2o2)} g/일(예시).${m.risk != null ? ` 하루 ${st.n}장이면 보충 사이에 여유 아래로 내려갑니다 — 보충을 더 자주 하거나 교체를 늘립니다.` : m.d7 < 0.85 ? ` 하루 ${st.n}장이면 Cu가 많이 쌓여 분해가 빨라, 보충 직전 속도가 여유 끝(77 %)에 가깝습니다 — 보충을 더 자주 하거나 교체를 늘립니다.` : ''}`;
      msg += ` 헹굼까지 ${st.dl} s 지연 → 고인 곳 Cu 기둥 옆 약 ${Math.round(ex)} nm 더(베이스 다이 · 새 액 속도 기준 · 상한).`;
      ctx.q('[data-o=msg]').innerHTML = msg;
    }
    ctx.range('n', v => { st.n = v; render(); return v + ' 장'; });
    ctx.range('dl', v => { st.dl = v; render(); return v.toFixed(1) + ' s'; });
    inp('n').addEventListener('input', () => { touched.n = true; });
    // 지연은 헹굼 단계에서만 장면에 보이므로, 손으로 움직이면 그 단계로 간다
    inp('dl').addEventListener('input', () => { touched.dl = true; const s = ctx.step(); if (s && s !== 'rinse') ctx.go('rinse'); });
    ctx.seg('mode', (v, user) => { st.mode = v; if (user) touched.mode = true; render(); });
    // 손대지 않은 값은 단계마다 예시 값으로 (발표 모드 대비)
    ctx.demo = sid => {
      const d = DEMO[sid];
      if (!d) return;
      if (!touched.mode) st.mode = d.mode;
      if (!touched.n){ st.n = d.n; inp('n').value = d.n; ctx.out('n', d.n + ' 장'); }
      if (!touched.dl){ st.dl = d.dl; inp('dl').value = d.dl; ctx.out('dl', d.dl.toFixed(1) + ' s'); }
      press(st.mode);
      render();
    };
  },
  onStep(K, ctx, sid){
    if (ctx.demo) ctx.demo(sid);
    // 카세트 움직임은 그 단계에 들어올 때 한 번
    ctx.$$(`[data-et08="${sid}"]`).forEach(a => { try { a.beginElement(); } catch (e){} });
  },
  notes(K){
    return K.terms([
      ['낱장 장비 (매엽)', '웨이퍼를 한 장씩 처리하는 장비. 척이 돌리고 노즐이 뿌려 흐름을 만든다'],
      ['배치 장비', '여러 장을 카세트째 액조에 담가 한꺼번에 처리하는 장비'],
      ['컵 (보울)', '도는 웨이퍼 둘레에서 튄 액을 받는 그릇. 높이를 바꿔 액마다 회수 경로를 나누기도 한다'],
      ['헹굼 (퀀치)', '많은 물로 식각액을 묽혀 반응을 멈추는 일. 멈출 때까지 걸린 시간도 식각 시간이다'],
      ['단일 통과 · 순환', '한 번 쓰고 버림 / 모아서 거르고 데워 다시 씀'],
      ['bleed & feed', '순환 액의 일부를 버리고(bleed) 새 액을 넣어(feed), 쌓이는 것을 일정한 값에 묶어 두는 운영'],
      ['미리 흘려보내기 (더미 디스펜스)', '쉬었다 시작할 때 배관 속 액을 먼저 버려 온도 · 농도를 맞추는 일'],
      ['물자국 (워터마크)', '물방울이 마르며 녹아 있던 성분을 남긴 점 · 고리 자국']
    ]) + K.field([
      '식각 결과가 흔들리면 레시피보다 먼저 <b>온도 · 유량 · 회전 · 노즐 위치 · 액 나이(처리 매수 · 시간)</b> 로그를 봅니다. 오래 쉬었다 시작한 첫 장은 배관 속 액의 온도 · 농도가 달라 속도가 다를 수 있어, 미리 흘려보내기(더미 디스펜스)로 맞춥니다.',
      '헹굼까지의 지연(팔 이동 · 밸브 · 배치의 들어 올리기)은 레시피 시간 밖의 <b>숨은 식각</b>입니다. 장비 · 레시피를 바꾸면 이 지연도 확인합니다. 배치는 넣고 빼는 동안 위 · 아래 시간 차가 위아래 무늬로 나타날 수 있습니다 → <a data-go="defects.stain">09장</a>.',
      'Cu 식각과 Ti 식각을 한 장비에서 이어 할 때는 <b>단계 사이 헹굼과 회수 경로(컵 높이)</b>를 따로 둡니다. Cu²⁺가 과산화수소계 Ti 식각액에 섞이면 분해가 빨라져 액이 빨리 지치고, HF에 섞이면 맨몸 Ti 위에 Cu가 석출합니다 → <a data-go="galv.bump">05장</a>.',
      '과산화수소 계열은 분해할 때 가스(O₂)와 열이 나므로 순환 · 배기 · 보관 온도를 관리합니다. HF · 암모니아는 전용 배기 · 누출 감지를 둡니다. 장비 일반(배치 · 낱장, 헹굼 · 건조)은 PR 스트립 탭과 같습니다 → <a href="#go-strip-05">PR 스트립 05장</a>.',
      '시드 식각 뒤 플라즈마 처리 · 리플로우까지 대기 시간(Q-time: 한 공정이 끝나고 다음 공정을 시작하기까지 기다린 시간)이 길면 SnAg · Cu 표면 산화가 늘어납니다 → <a href="#go-reflow-03">리플로우 03장</a>.'
    ]) + K.deep(`<ul>
      <li><b>회전 스프레이의 흐름</b> — 원심력이 얇은 액막을 만들어 확산층이 얇습니다(수~수십 µm). 중심은 노즐 바로 아래, 가장자리는 선속도가 커서 흐름이 다르므로 팔을 흔들어 고르게 합니다(→ <a data-go="end.map">07장</a> 장비 속도 맵). 회전이 너무 빠르면 가장자리 액막이 얇아지거나 끊기는 자리가 생길 수 있습니다. 공개 보고(블랭킷)에서 같은 묽은 액이 담금보다 회전 + 스프레이에서 약 7배 빨랐습니다(→ <a data-go="rate.spray">03장</a>).</li>
      <li><b>배치</b> — 액 부피가 커 농도 변화는 느리지만, 장마다 · 위아래 흐름이 다르고 들어 올리는 동안에도 식각이 이어집니다. 넘침 · 순환 유량 · 흔들기로 확산층을 맞춥니다. 넣고 빼는 데 몇 초 차이가 나면 아래쪽(먼저 잠기고 늦게 나옴)이 그만큼 더 녹습니다 — 기준 액에서 베이스 다이의 도금 Cu 기둥 옆으로 초당 약 6.5 nm(1.3 × 300 nm/분, 예시 · 고인 곳의 상한). 여러 장을 돌리며 뿌리는 배치 스프레이 장비도 범프 하부 금속(UBM) 식각에 써 왔습니다.</li>
      <li><b>식각액 나이 모델</b> (위젯) — Cu 증가 = 매수 × 0.17 g/장 × f ÷ 60 L, H₂O₂ 감소 = 매수 × 0.135 g/장 × f ÷ 60 L(화학양론 Cu 1 mol당 H₂O₂ 1 mol = 0.09 g × 분해 몫 1.5) + 분해 k·C, k = 0.2 %/h + 1 %/h × Cu(g/L), f = min(1, 1.3·C/C₀) (모두 예시). 묽은 기준 액(1.5 g/L)을 하루 300장 보충 없이 순환하면 약 11 h 째 여유(30 %)를 다 쓰고, 24 h 째 49 %(Cu 0.76 g/L), 약 3.5일에 더 지울 수 없게 됩니다. 녹은 Cu가 분해를 거들어 <b>늙을수록 더 빨리 늙습니다</b>. 그래서 보충 · 분석 주기가 레시피만큼 중요합니다. 실제 순환 액이 이보다 진하면 그만큼 늦어집니다. 산도 함께 줄어듭니다(Cu + H₂O₂ + 2H⁺ → Cu²⁺ + 2H₂O, Cu 1 mol에 산 2 mol). 산화제가 모자라고 Cu²⁺가 많은 늙은 액에서는 녹은 Cu가 SnAg 위에 다시 붙어 얼룩 · 변색이 될 수 있습니다(→ <a data-go="galv.bump">05장</a>).</li>
      <li><b>bleed & feed</b> — 하루 b 만큼 버리고 새 액을 넣으면 Cu는 교체 직전 C* = 하루 증가량 ÷ b 에서 멈춥니다(전해도금 11장의 분해산물 식과 같은 꼴). 하루 300장 · b 40 % → 0.85 ÷ 0.4 ≈ 2.1 g/L. 새 액에서 시작하면 하루에 (1 − b) 배씩 다가가므로 b 가 작을수록 정상 상태까지 오래 걸립니다(95 %까지 b 25 %면 약 10일, 40 %면 약 6일) → <a href="#go-plating-11">전해도금 11장</a>.</li>
      <li><b>헹굼 · 건조</b> — 식각액이 물로 1/100 이하로 묽어질 때까지 식각이 이어집니다. 지연 3 s → 베이스 다이 Cu 기둥 옆 약 20 nm(도금 Cu 1.3 × 300 nm/분, 액이 고인 곳의 상한 — 범프에 Cu가 없는 코어 다이는 Ni 발 밑 시드가 약 15 nm 더 파이는 정도). 털어 낸 얇은 액막은 산화제가 금방 바닥납니다: 액막 20 µm · H₂O₂ 0.15 wt%(44 mol/m³)면 약 0.9 mmol/m², Cu로 약 6 nm(1 wt%면 약 40 nm)만 더 녹일 수 있습니다. 그래서 트인 면의 숨은 식각은 수~수십 nm에서 멈추지만, 액이 두껍게 고이고 늦게 바뀌는 범프 사이 · 밑동은 헹굼물이 닿을 때까지 계속 녹습니다(→ <a data-go="under.pillar">04장</a>). 건조는 회전 + 질소이고, 물이 증발하며 녹은 것이 남으면 물자국이 됩니다. 이소프로필알코올(IPA) 증기 건조를 쓰기도 합니다.</li>
      <li><b>단계 사이 헹굼</b> — Cu 식각 → Ti 식각 사이 헹굼은 '다음 액으로 Cu²⁺를 넘기지 않기'입니다. 넘어간 Cu²⁺는 Ti 위 치환 석출(05장) · 과산화수소 분해 촉매가 됩니다(공개 특허: 미량 Cu 이온이 과산화수소를 빠르게 분해해 식각 속도를 떨어뜨려 킬레이트로 안정화한 기술, TiW 액은 성분 열화와 녹은 금속 이온이 성능을 떨어뜨린다는 기술). 낱장 장비는 컵 높이를 바꿔 액마다 회수 경로를 나누고 헹굼물은 따로 빼냅니다(→ <a data-go="ti.sel">06장</a>).</li>
      <li><b>분석 · 감시</b> — 과산화수소(적정), 산(적정), Cu(적정 · 분광), 비중 · 전도도 · 근적외선 같은 온라인 감시. 장비 · 액마다 다르고, 분석 주기와 보충 규칙이 레시피만큼 중요합니다. 블랭킷 모니터 웨이퍼의 식각 속도를 정기적으로 재면 액 나이 · 온도 · 흐름의 변화를 한 숫자로 잡을 수 있습니다.</li></ul>`);
  },
  css: `.pl-svg .et08-drop{fill:#5eead4}
.pl-svg .et08-wdrop{fill:#7dd3fc}
.pl-svg .et08-di{fill:#7dd3fc;stroke:#e0f2fe;stroke-width:1}
.pl-svg .et08-n2{fill:#cbd5e1;stroke:#f1f5f9;stroke-width:1}
.pl-svg .et08-delay{fill:#f59e0b;stroke:#fbbf24;stroke-width:1}
.pl-svg .et08-dry{fill:rgba(203,213,225,.25);stroke:#cbd5e1;stroke-width:1}
.pl-svg .et08-dead{fill:rgba(148,163,184,.15)}
.pl-svg .et08-veil{fill:rgba(4,8,16,.66);stroke:none}
.pl-svg .et08-arm{stroke:#94a3b8;stroke-width:7;stroke-linecap:round}
.pl-svg .et08-film{fill:rgba(45,212,191,.75)}
.pl-svg .et08-wfilm{fill:rgba(125,211,252,.8)}
.pl-svg .et08-spin{fill:#fde68a}
.pl-svg .et08-rail{stroke:#64748b;stroke-width:6;stroke-linecap:round}
.pl-svg .et08-hang{stroke:#94a3b8;stroke-width:4}
.pl-svg .et08-cas{fill:rgba(148,163,184,.08);stroke:#cbd5e1;stroke-width:2}
.pl-svg .et08-tank{fill:#0b1424;stroke:#4a6390;stroke-width:3}
.pl-svg .et08-gauge{fill:rgba(10,20,38,.94);stroke:rgba(125,211,252,.45);stroke-width:1.4}
.pl-svg .et08-gv{font-size:28px;font-weight:900}
.pl-svg .et08-ok{fill:#4ade80 !important}
.pl-svg .et08-warn{fill:#fbbf24 !important}
.pl-svg .et08-ng{fill:#f87171 !important}
.pl-svg .et08-gbok{fill:#22c55e}
.pl-svg .et08-gbwarn{fill:#f59e0b}
.pl-svg .et08-gbng{fill:#ef4444}
.pl-svg .et08-wind{fill:none;stroke:#e2e8f0;stroke-width:2.2;stroke-dasharray:6 8;animation:jzflow .7s linear infinite;opacity:.8}
.pl-svg .et08-hi{fill:none;stroke:#fbbf24;stroke-width:2.6;stroke-dasharray:6 4}
.pl-svg .et08-bet{fill:rgba(45,212,191,.32);stroke:#2dd4bf;stroke-width:1.4}
.pl-svg .et08-bri{fill:rgba(125,211,252,.28);stroke:#7dd3fc;stroke-width:1.4}
.pl-svg .et08-tick{stroke:#1c1206;stroke-width:1.6}
.pl-svg .et08-brk{fill:none;stroke:#e2e8f0;stroke-width:3}
.pl-svg .et08-pool{fill:rgba(45,212,191,.42);stroke:#2dd4bf;stroke-width:1.2}
.pl-svg .et08-eat{fill:#f59e0b}
.pl-svg .et08-fl{fill:none;stroke:#fde047;stroke-width:2.6;stroke-dasharray:4 5}
.pl-svg .et08-grid{stroke:rgba(148,163,184,.16);stroke-width:1}
.pl-svg .et08-deadz{fill:rgba(148,163,184,.16)}
.pl-svg .et08-rk{stroke:#f87171;stroke-width:2;stroke-dasharray:5 5}
.pl-svg .et08-tri{fill:#c084fc}
.pl-svg .et08-cs{stroke:#f59e0b;stroke-width:1.8;stroke-dasharray:3 6;opacity:.75}
.pl-svg .et08-cuv{font-size:19px;font-weight:700;fill:#fbbf24 !important}
.pl-svg .et08-val{font-size:23px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .et08-val2{font-size:23px;font-weight:800;fill:#5eead4 !important}
.pl-svg .et08-scl{stroke:#e2e8f0;stroke-width:3}
.pl-svg .et08-sv{font-size:25px;font-weight:900}
.pl-svg .et08-cu{fill:#fbbf24 !important}
.pl-svg .et08-ref{fill:none;stroke:#94a3b8;stroke-width:2.2;stroke-dasharray:3 5;opacity:.85}
.pl-svg .et08-reft{font-size:19px;font-weight:700;fill:#94a3b8 !important}`
});
})();
