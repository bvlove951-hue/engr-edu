/* PR 스트립 05 — 장비 해부: 배치와 매엽은 무엇이 다를까? (장비 · m) */
(function(){
// ── 개념 모델: 스트립 시간은 03장과 같은 식 · 같은 가정값 (배치 = 순환 흐름, 매엽 = 분사 · 메가소닉, 혼합 = 고압 분사)
const EA = 50000, RG = 8.314;                                               // Ea 50 kJ/mol (예시)
const AT = T => Math.exp(-(EA / RG) * (1 / (T + 273.15) - 1 / 343.15));      // 70 °C 기준 빨라지는 배수
const N_SW = 0.75;                                                           // 부풀어 떨어지는 PR: 스며드는 방식 '중간' (가정)
const tsw = (L, T) => 5 * Math.pow(L / 30, 1 / N_SW) / AT(T);               // 스며드는 시간(분): 30 µm · 70 °C에서 5분 (가정)
const RM = {batch: 8, single: 30, hyb: 60};                                  // 겉면 공급 µm/분 (가정)
function stripTime(tool, pr, L, T){
  if (pr === 'dis') return L * (1 / (6 * AT(T)) + 1 / RM[tool]);             // 녹는 PR: 겉 풀림 6 µm/분 × A(T) 와 공급이 직렬
  // 고압 분사: 부푼 층 20 µm씩 떼기, 보통 분사보다 느리지는 않게 (03장과 같은 식) — 챔버에서 불리기 · 분사를 되풀이할 때의 값
  if (tool === 'hyb') return Math.min(L <= 20 ? tsw(L, T) : (L / 20) * tsw(20, T), tsw(L, T) * 0.85) + 0.5;
  return tool === 'batch' ? tsw(L, T) + 2 : tsw(L, T) * 0.85 + 0.5;          // + 조각 치움 2 · 0.5분
}
const B_N = 50, B_OH = 15, C_N = 4, C_OH = 2, HP = 3;                        // 배치 50장 · 부대 15분, 챔버 4개 · 부대 2분, 혼합 분사 3분 (가정)
// 혼합의 처리량: 탱크에서 담가 둔 뒤 챔버에서 3분 분사 한 번으로 끝낸다고 둔다. 그러려면 탱크(분사 없음)에서 —
//   부풀어 떨어지는 PR: 바닥까지 다 불어야 한다 = 03장 순환 흐름의 스며드는 시간 tsw(L, T) (층째 떼기 시간보다 길다)
//   녹는 PR: 3분 분사가 녹일 몫만 남을 때까지 탱크(순환 흐름 공급)에서 녹인다
const rDis = (T, rm) => 1 / (1 / (6 * AT(T)) + 1 / rm);                     // 녹는 PR이 녹는 속도 µm/분 (겉 풀림 + 공급 직렬)
const soakHyb = (pr, L, T) => pr === 'swl' ? tsw(L, T) : Math.max(0, L - HP * rDis(T, RM.hyb)) / rDis(T, RM.batch);
const capHyb = (pr, L, T) => [B_N * 60 / (soakHyb(pr, L, T) + B_OH), C_N * 60 / (HP + C_OH)];   // [탱크, 분사 챔버] 장/시간
function wph(tool, t, pr, L, T){
  if (tool === 'batch') return B_N * 60 / (t + B_OH);
  if (tool === 'single') return C_N * 60 / (t + C_OH);
  return Math.min(...capHyb(pr, L, T));                                        // 불리기는 탱크에서 함께, 챔버는 분사 몫만 — 느린 쪽이 정한다
}
const TOOLS = ['batch', 'single', 'hyb'];
const NAME = {batch: '배치 담금', single: '매엽 분사', hyb: '혼합 (담금 + 고압 분사)'};
// 카드 결과 글: [짧은 값, 아랫줄 설명]
const LIQ = {batch: ['나눠 쓴 액', '앞서 녹은 PR이 든 액 — 마무리 탱크로 보완'], single: ['늘 비슷한 액', '회수 · 보충한 액을 한 장씩 뿌림'], hyb: ['탱크 + 분사 액', '불리기는 탱크 액, 떼기는 새로 뿌린 액']};
const FLK = {batch: ['탱크 순환 필터', '가라앉은 조각은 배수 · 필터로'], single: ['회수 필터', '컵으로 튀어 나가 회수 필터로'], hyb: ['회수 필터', '분사로 떼어 낸 큰 조각 — 필터 부담이 크다']};
// 손대지 않았을 때 두께 · 온도는 세 탭 공통 그림 기준 PR 35 µm · 70 °C (plans/shared.md (a), 01~03장과 같음)
const DEMO = {batch: ['batch', 'dis'], single: ['single', 'swl'], agit: ['hyb', 'swl'], rinse: ['batch', 'dis'], dry: ['single', 'dis']};
const L0 = 35, T0 = 70;
const T_REF = stripTime('batch', 'dis', L0, T0);                            // 카세트가 한 바퀴 12 s 도는 기준 (약 10.2분)

// ── 장면 치수: 배치 벤치 (탱크 다섯: 스트리퍼 1 · 스트리퍼 2 · 중간 용제 · 물 · 건조)
const TK = [[50, 240], [280, 470], [510, 650], [690, 830], [870, 1060]];
const CX = TK.map(([a, b]) => (a + b) / 2);
const TY0 = 424, TY1 = 640, LQ = 444;                                        // 탱크 위 · 아래, 액면
const CW = 80, CH = 110, UP = 312, DN = 432;                                 // 카세트 크기, 옮길 때 · 담갔을 때 위쪽 y
const CAX = CX.map(c => c - CW / 2);
const BAND = [124, 154, 184];                                                // 위젯 막대 줄 (가운데 y)
// 좁은(세로) 화면 전용 확대: 단계마다 핵심 자리만
const VN = {batch: {x: 30, y: 206, w: 654, h: 566}, single: {x: 1090, y: 204, w: 490, h: 552}, agit: {x: 30, y: 206, w: 480, h: 550}, rinse: {x: 490, y: 206, w: 370, h: 550}, dry: {x: 30, y: 766, w: 760, h: 346}};

// 카세트 (0,0 기준): 웨이퍼가 세로로 선 모습 (옆에서)
function cas(K){
  const {R, P} = K;
  let s = P(`M26,0 L26,-8 L54,-8 L54,0`, 'st05-hook') + R(0, 0, CW, CH, 'st05-cas', {rx: 6});
  for (let k = 0; k < 8; k++) s += R(8 + k * 9, 9, 4, CH - 18, 'f-wafer');
  return s;
}
// 카세트가 탱크를 차례로 지나는 움직임 (담가 두는 몫은 탱크마다 다름). 되돌아가는 길은 보이지 않게
function travel(K, dur){
  const dwell = [0.20, 0.12, 0.06, 0.10, 0.07], seq = [[CAX[0], UP, 0]];
  let t = 0;
  CAX.forEach((x, i) => {
    if (i){ t += 0.045; seq.push([x, UP, t]); }
    t += 0.025; seq.push([x, DN, t]);
    t += dwell[i]; seq.push([x, DN, t]);
    t += 0.025; seq.push([x, UP, t]);
  });
  const tr = t; t += 0.08; seq.push([CAX[0], UP, t]);
  let d = '', len = 0, prev = null;
  const cum = seq.map(([x, y]) => {
    if (!prev) d = `M${x},${y}`;
    else if (prev[0] !== x || prev[1] !== y){ len += Math.hypot(x - prev[0], y - prev[1]); d += ` L${x},${y}`; }
    prev = [x, y];
    return len;
  });
  const kp = cum.map(c => (c / len).toFixed(4)).join(';'), kt = seq.map(s => (s[2] / t).toFixed(4)).join(';');
  const a = (tr / t).toFixed(3), b = (tr / t + 0.01).toFixed(3);
  return `<g class="st05-mv" data-tip="카세트 — 로봇이 탱크에서 탱크로 옮긴다\n(300 mm 장비는 보통 FOUP에서 꺼낸 웨이퍼를 탱크용 받침(웨이퍼 가이드)에 옮겨 담근다)\n(시간 비율은 그림 예시)">${cas(K)}<animateMotion dur="${dur.toFixed(2)}s" repeatCount="indefinite" calcMode="linear" keyPoints="${kp}" keyTimes="${kt}" path="${d}"/><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;${a};${b};0.99;1" dur="${dur.toFixed(2)}s" repeatCount="indefinite"/></g>`;
}
// 히터 지그재그 (탱크 바닥)
const zig = (x0, x1, y) => { let d = `M${x0},${y}`; for (let x = x0 + 8, k = 0; x <= x1; x += 8, k++) d += ` L${x},${y + (k % 2 ? -5 : 5)}`; return d; };
// 날아가는 PR 조각 (경로를 따라 돌며)
function flyer(x0, y0, x1, y1, dur, delay, w = 14, h = 6, lift = 40){
  const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - lift;
  return `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" class="f-pr"><animateMotion dur="${dur}s" begin="-${delay}s" repeatCount="indefinite" rotate="auto" path="M${x0},${y0} Q${cx},${cy} ${x1},${y1}"/><animate attributeName="opacity" values="0;1;1;0" dur="${dur}s" begin="-${delay}s" repeatCount="indefinite"/></rect>`;
}
// 작은 범프 — 세 탭 공통 기준 범프(베이스 다이: 높이 ≈ 1.2 × 폭, Cu 기둥 12 : Ni 3 : 상부 Cu 3 : SnAg 12), 바닥 y.
// 얇은 Ni · 상부 Cu는 작은 그림에서도 보이게 같은 두께로 과장 (최소 8 px — 무대 배율에서도 보이게)
function mini(K, x, base, w){
  const {R} = K, h = 1.2 * w, th = Math.max(8, h * 0.1), cu = (h - 2 * th) / 2;
  return R(x, base - cu, w, cu, 'f-cu2') + R(x, base - cu - th, w, th, 'f-ni') + R(x, base - cu - 2 * th, w, th, 'f-cu2') + R(x, base - h, w, cu, 'f-sn2', {rx: 3});
}

(window.EngrStripChapters = window.EngrStripChapters || []).push({
  no: '05', id: 'tool', part: 2, short: '장비 해부', scale: '장비 · m',
  title: '장비 해부 — 배치와 매엽은 무엇이 다를까?',
  hook: '담가 둘까, 한 장씩 뿌릴까',
  one: '스트립 장비는 크게 두 가지입니다. 여러 장을 한꺼번에 뜨거운 탱크에 담그는 배치(웻벤치)와, 한 장씩 돌리며 데운 액을 뿌리는 매엽입니다. 어느 쪽이든 \'녹이기 → 조각 치우기 → 헹굼 → 건조\'를 거칩니다.',
  ana: '<b>큰 들통 vs 샤워기</b>로 냄비 닦기 — 들통에 여러 개를 담가 두면 한 번에 많이 하지만 물이 점점 더러워지고, 샤워기로 하나씩 씻으면 늘 새 물을 쓰지만 시간이 걸립니다. <i>(한계: 실제 매엽 장비도 액을 회수해 다시 쓰는 경우가 많고, 배치 장비도 탱크를 둘로 나눠 마지막 탱크는 깨끗하게 유지합니다. 또 헹굼 순서(약품이 정한 순서)가 금속에 큰 영향을 줍니다 → <a data-go="metal.rinse">07장</a>.)</i>',
  steps: [
    {id: 'batch', t: '배치 — 뜨거운 탱크에 함께 담근다', d: '카세트에 담긴 웨이퍼 수십 장을 데운 스트리퍼 탱크에 함께 담급니다. 히터 · 순환 펌프 · 필터가 온도와 깨끗함을 지키고, 탱크를 둘로 나눠 첫 탱크가 대부분의 PR을 받게 합니다. 한 번에 많이 하지만 액을 여러 장이 나눠 씁니다.', viewN: VN.batch},
    {id: 'single', t: '매엽 — 한 장씩 돌리며 뿌린다', d: '웨이퍼를 한 장씩 돌리며 데운 스트리퍼를 뿌리거나, 고여 두었다가(퍼들) 세게 분사해 조각을 떼어 냅니다. 늘 비슷한 액이 닿아 웨이퍼마다 고르지만, 한 장씩이라 처리량과 액 사용량이 과제입니다.', viewN: VN.single},
    {id: 'agit', t: '흔들고, 뿌리고, 거른다', d: '카세트 오르내림 · 순환 흐름 · 질소 거품 · 메가소닉(약 1 MHz 음파)은 겉면에 새 액을 대고, 매엽의 고압 분사는 부푼 막을 깨서 떼어 냅니다. 떨어진 조각은 필터가 걸러야 다시 붙지 않습니다. 너무 센 힘은 가는 범프를 기울게 할 수 있습니다.', viewN: VN.agit},
    {id: 'rinse', t: '헹굼 — 약품이 정한 순서로', d: '묻은 스트리퍼를 빨리, 남김없이 걷어 냅니다. 약품에 따라 중간 용제(IPA 등)로 먼저 헹구거나 물로 바로 헹굽니다. 물은 채웠다 쏟기를 되풀이하고(퀵 덤프), 물의 깨끗함(비저항 — 이온만 봄)과 시간으로 끝을 정합니다. 순서가 왜 중요한지는 → <a data-go="metal.rinse">07장</a>', viewN: VN.rinse},
    {id: 'dry', t: '건조 — 물자국 없이', d: '스핀 건조나 IPA 증기 건조로 물을 남김없이 걷습니다. 물방울이 그대로 마르면 자국(워터마크)이 남고, 젖은 채 오래 두면 솔더 · Cu 표면이 더 산화됩니다. 건조 뒤 시드 식각까지 대기 시간도 관리합니다.', viewN: VN.dry}
  ],
  icon(K){
    const {R, P, C} = K;
    return R(3, 30, 22, 24, 'f-strip') + P('M2,28 L2,55 L26,55 L26,28', 'f-tank') + R(30, 30, 20, 24, 'f-rinse') + P('M29,28 L29,55 L51,55 L51,28', 'f-tank')
      + R(7, 6, 15, 20, 'st05-cas', {rx: 2}) + R(52, 2, 9, 9, 'st05-noz') + C(56, 18, 2.6, 'st05-drop') + C(53, 28, 2.6, 'st05-drop') + C(59, 36, 2.6, 'st05-drop');
  },
  draw(K){
    const {R, C, E, L, P, PG, T, G, LB, tip, only} = K;
    let s = '';
    // ── 위젯 막대 띠 (y 110~200, 위젯이 그린다) + 범례
    s += `<g data-v="band"></g>`;
    s += LB(T(1290, 128, '직접 해 보기 결과 · 개념 모델', 't-dim', 'start') + T(1290, 156, '막대 = 스트립 시간 (분)', 't-dim', 'start') + T(1290, 184, '● 1개 = 시간당 10장', 't-dim', 'start'));

    // ── 배치 벤치 (x 30~1086, y 208~752)
    s += R(30, 208, 1056, 544, 'pl-panel', {rx: 14, 'data-v': 'bf'});
    let b = T(50, 238, '배치 (웻벤치) — 카세트째 담근다', 't-acc', 'start');
    const HEAD = ['스트리퍼 1', '스트리퍼 2', '중간 용제', '물 헹굼', '건조'];
    HEAD.forEach((h, i) => { b += T(CX[i], 270, h, 't-sub'); });
    b += G(T(CX[0], 294, '먼저 · 70 °C', 't-dim', 'middle', {'data-v': 't1'}) + T(CX[1], 294, '마무리 · 70 °C', 't-dim', 'middle', {'data-v': 't2'}), only('batch single rinse dry'));
    b += G(T(CX[0], 294, '질소 거품 · 오르내림', 't-dim') + T(CX[1], 294, '메가소닉 (바닥 판)', 't-dim'), only('agit'));
    b += T(CX[2], 294, '(IPA 등)', 't-dim') + T(CX[3], 294, '퀵 덤프', 't-dim') + T(CX[4], 294, '스핀 · IPA 증기', 't-dim');
    b += L(44, 306, 1072, 306, 'st05-rail', tip('로봇 레일 — 카세트를 탱크에서 탱크로 옮긴다'));
    // 탱크와 액
    const TIP = ['스트리퍼 탱크 1 (먼저) — 데운 스트리퍼. PR 대부분을 받아 녹은 PR이 많다 (지친 액)', '스트리퍼 탱크 2 (마무리) — 새 액을 여기에 넣는다. 넘친 액이 탱크 1로 간다 (역류)', '중간 용제 헹굼 (IPA 등) — 약품에 따라. 물로 바로 헹구는 라인에는 없다', '물 헹굼 — 채웠다 쏟기를 되풀이하는 퀵 덤프 (QDR)', '건조기 — 스핀 건조 또는 IPA 증기 건조'];
    const LQC = ['f-strip', 'f-strip', 'st05-ipa', 'f-rinse', 'f-gas'];
    TK.forEach(([x0, x1], i) => {
      if (i === 3) b += G(R(x0 + 3, LQ, x1 - x0 - 6, TY1 - LQ - 3, LQC[i]), only('batch single agit dry'));
      else if (i === 4) b += R(x0 + 3, TY0 + 4, x1 - x0 - 6, TY1 - TY0 - 7, 'f-gas') + R(x0 + 3, 612, x1 - x0 - 6, 25, 'st05-ipa', tip('데운 IPA — 증기를 만든다'));
      else b += R(x0 + 3, LQ, x1 - x0 - 6, TY1 - LQ - 3, LQC[i]);
      b += P(`M${x0},${TY0} L${x0},${TY1} L${x1},${TY1} L${x1},${TY0}`, 'f-tank', tip(TIP[i]));
    });
    // 녹은 PR이 든 정도 (탱크 1 > 탱크 2)
    b += R(53, LQ, 184, TY1 - LQ - 3, 'st05-dis', tip('탱크 1 — 녹은 PR이 많다 (지친 액)')) + R(283, LQ, 184, TY1 - LQ - 3, 'st05-dis2');
    // 히터 (색 = 온도, 위젯)
    b += P(zig(60, 212, 627), 'st05-heat', {'data-v': 'h1', 'data-tip': '히터 — 독립된 과열 · 저수위 차단 장치가 함께 있어야 한다'}) + P(zig(290, 434, 627), 'st05-heat', {'data-v': 'h2', 'data-tip': '히터 — 독립된 과열 · 저수위 차단 장치가 함께 있어야 한다'});
    // 순환 고리 (탱크 x 범위 안, y 640~745): 배수 → 펌프 → 필터 → 되돌림
    const loop = (xd, xr) => {
      const pth = `M${xd},${TY1} L${xd},700 L${xr},700 L${xr},500`;
      return G(P(pth, 'pl-pipe') + P(pth, 's-flow') + C(xd + 30, 700, 15, 'pl-pump') + P(`M${xd + 24},692 L${xd + 38},700 L${xd + 24},708 Z`, 'k-acc')
        + R(xd + 56, 678, 30, 44, 'pl-filt', {rx: 5}) + L(xd + 62, 690, xd + 80, 690, 's-faint') + L(xd + 62, 700, xd + 80, 700, 's-faint') + L(xd + 62, 710, xd + 80, 710, 's-faint'),
        tip('펌프 · 필터 — 탱크 액을 돌려 조각을 걸러 되돌린다\n필터 앞뒤 압력차(ΔP)로 막힘을 본다'));
    };
    b += loop(90, 222) + loop(300, 444);
    b += T(160, 742, '펌프 · 필터', 't-dim') + T(372, 742, '펌프 · 필터', 't-dim');
    // 역류: 새 액은 탱크 2로, 넘친 액은 탱크 1로, 탱크 1에서 버림
    b += G(K.arrow(456, 306, 456, LQ - 4, 's-arrg') + T(464, 472, '새 액', 't-dim', 'end'), tip('새 액은 마무리 탱크(2)에 넣는다'));
    b += G(K.arrowP('M292,452 C278,402 254,402 238,450', 's-arrg') + T(236, 478, '넘침', 't-dim', 'end'), tip('넘침(역류) — 탱크 2에서 넘친 액이 탱크 1로 간다\n웨이퍼는 1 → 2, 액은 2 → 1 (반대 방향)'));
    b += K.arrow(62, TY1 + 2, 62, 706, 's-arr2') + T(62, 730, '버림', 't-dim');
    // 부풀어 떨어진 PR 조각 (위젯: 부풀어 떨어지는 PR일 때만)
    let fk = '';
    [[118, 0], [150, 1.1], [176, 2.3], [134, 3.1], [200, 1.7]].forEach(([x, d]) => { fk += flyer(x, 548, 96, 634, 4.2, d, 12, 5, -10); });
    [[352, 0.6], [398, 2.4]].forEach(([x, d]) => { fk += flyer(x, 552, 306, 634, 4.6, d, 10, 4, -10); });
    b += G(fk, {'data-v': 'flk', 'data-tip': '부풀어 떨어진 PR 조각 — 가라앉아 배수 · 필터로 간다 (녹지 않음)'});
    // 카세트: 옮기며 담그기 (batch · single) / 오르내림 (agit) / 물 탱크 (rinse) / 건조기 (dry)
    b += G(`<g data-v="mv"></g>`, only('batch single'));
    b += G(G(G(cas(K) + `<animateTransform attributeName="transform" type="translate" values="0 0;0 -16;0 0" dur="2s" repeatCount="indefinite"/>`), {transform: `translate(${CAX[0]} ${DN})`}), K.W(only('agit'), tip('카세트 오르내림 — 겉면에 새 액을 댄다')));
    b += G(G(cas(K), {transform: `translate(${CAX[3]} ${DN})`}), only('rinse'));
    b += G(G(cas(K), {transform: `translate(${CAX[4]} ${DN})`}), only('dry'));
    // agit: 질소 거품 (탱크 1) · 메가소닉 (탱크 2)
    let ag = L(66, 614, 214, 614, 'st05-sparg', tip('질소 거품관 — 작은 구멍에서 질소가 올라온다'));
    for (let k = 0; k < 8; k++) ag += K.bubble(70 + k * 16, 608, 4 + (k % 3), 160, 2.2 + (k % 3) * 0.4, k * 0.33);
    ag += R(318, TY1 + 2, 110, 8, 'st05-mega', tip('메가소닉 판 — 약 1 MHz 음파를 액에 보낸다'));
    for (let k = 0; k < 3; k++) ag += P(`M312,${612 - k * 26} Q375,${592 - k * 26} 438,${612 - k * 26}`, 'st05-wave', {style: `animation-delay:${(-k * 0.4).toFixed(1)}s`});
    b += G(ag, only('agit'));
    // rinse: 물 탱크 퀵 덤프 — 액면이 뚝 떨어졌다 다시 찬다
    const [dx0, dx1] = TK[3];
    let qd = `<rect x="${dx0 + 3}" y="${LQ}" width="${dx1 - dx0 - 6}" height="${TY1 - LQ - 3}" class="f-rinse st05-qdr"><animate attributeName="y" values="${LQ};${LQ};618;618;${LQ};${LQ}" keyTimes="0;.3;.42;.5;.85;1" dur="3s" repeatCount="indefinite"/><animate attributeName="height" values="${TY1 - LQ - 3};${TY1 - LQ - 3};19;19;${TY1 - LQ - 3};${TY1 - LQ - 3}" keyTimes="0;.3;.42;.5;.85;1" dur="3s" repeatCount="indefinite"/></rect>`;
    for (let k = 0; k < 4; k++) qd += K.mover(dx0 + 8, 452, dx0 + 40 + k * 8, 520 + k * 10, 3, 'st05-wdrop', 1.2, k * 0.3) + K.mover(dx1 - 8, 452, dx1 - 40 - k * 8, 520 + k * 10, 3, 'st05-wdrop', 1.2, k * 0.3 + 0.15);
    qd += K.arrow(760, TY1 + 2, 760, 704, 's-arr') + T(760, 728, '한 번에 쏟기', 't-dim');
    b += G(qd, K.W(only('rinse'), tip('퀵 덤프 — 채웠다 한 번에 쏟기를 되풀이한다\n쏟는 동안 위에서 물을 뿌려 마르지 않게')));
    // dry: IPA 증기 (건조기)
    let vp = '';
    for (let k = 0; k < 5; k++){ const x = 888 + k * 40; vp += P(`M${x},608 C${x - 12},560 ${x + 12},510 ${x},450`, 'st05-vap', {style: `animation-delay:${(-k * 0.25).toFixed(2)}s`}); }
    b += G(vp, K.W(only('dry'), tip('IPA 증기 — 물 막에 녹아 표면장력 차이로 물을 끌어내린다 (마랑고니)')));
    s += G(b, {'data-v': 'bench'});

    // ── 매엽 챔버 (x 1096~1574, y 208~752)
    s += R(1096, 208, 478, 544, 'pl-panel', {rx: 14, 'data-v': 'cf'});
    let c = T(1114, 238, '매엽 — 한 장씩 돌리며 뿌린다', 't-acc', 'start');
    c += G(T(1114, 298, '퍼들(고여 두기) 또는 계속 뿌리기', 't-sub', 'start'), only('single'));
    c += G(T(1114, 298, '고압 분사 — 부푼 막을 깨서 떼어 냄', 't-warn', 'start'), only('agit'));
    c += G(T(1114, 298, '같은 챔버에서 바로 헹굼 (약품이 정한 순서)', 't-sub', 'start'), only('rinse'));
    c += G(T(1114, 298, '빨리 돌려 털고 질소로 말림 (스핀 건조)', 't-sub', 'start'), only('dry'));
    // 노즐 팔 · 공급관
    c += P('M1436,329 L1556,329 L1556,316', 'st05-pipe') + R(1186, 312, 14, 40, 'st05-arm') + R(1186, 322, 250, 14, 'st05-arm', tip('노즐 팔 — 웨이퍼 위를 오가며 뿌린다 (스캔)'));
    c += G(T(1366, 366, '노즐', 't-sub', 'start'), only('batch single rinse dry'));
    c += G(T(1366, 392, '데운 스트리퍼 · 70 °C', 't-dim', 'start', {'data-v': 'tn'}), only('batch single'));
    c += G(T(1366, 392, '헹굼 액', 't-dim', 'start'), only('rinse')) + G(T(1366, 392, '질소 (말림)', 't-dim', 'start'), only('dry'));
    // 컵 · 척 · 웨이퍼
    c += P('M1152,470 L1140,490 L1140,690 L1530,690 L1530,490 L1518,470', 'f-tank', tip('컵 — 돌며 튄 액 · 조각을 받아 아래로 모은다'));
    c += R(1317, 606, 36, 84, 'st05-chuck') + R(1305, 692, 60, 22, 'st05-chuck', tip('회전 척 · 모터'));
    c += E(1335, 596, 172, 22, 'f-wafer', tip('웨이퍼 — PR 면이 위, 돌며 액을 받는다'));
    c += G(`<g data-v="coat"></g>`, only('batch single agit'));
    let wb = E(1335, 590, 166, 18, 'st05-wseed');
    for (let r = -2; r <= 2; r++) for (let q = -7; q <= 7; q++){ const x = 1335 + q * 20 + (r % 2 ? 10 : 0), y = 590 + r * 6.5; if (((x - 1335) / 160) ** 2 + ((y - 590) / 16) ** 2 < 1) wb += C(x, y, 2.6, 'st05-bump'); }
    c += G(wb, K.W(only('rinse dry'), tip('PR이 걷힌 웨이퍼 — 시드 위에 범프만 남았다')));
    c += P('M1335,586 Q1256,582 1172,594', 's-flow') + P('M1335,586 Q1414,582 1498,594', 's-flow');
    c += LB(T(1156, 652, '컵 — 튄 액을 받음', 't-dim', 'start') + T(1370, 652, '회전 척', 't-dim', 'start') + T(1370, 680, '웨이퍼가 돈다', 't-dim', 'start'));
    const RIM = 'M1163,596 A172,22 0 1 0 1507,596 A172,22 0 1 0 1163,596';
    c += G(`<circle r="6" class="k-acc2"><animateMotion dur="1.2s" repeatCount="indefinite" path="${RIM}"/></circle>`, only('batch single agit rinse'));
    c += G(`<circle r="6" class="k-acc2"><animateMotion dur="0.35s" repeatCount="indefinite" path="${RIM}"/></circle>`, only('dry'));
    // 노즐 + 방울 (batch · single: 스트리퍼, rinse: 물)
    const noz = R(1330, 336, 20, 34, 'st05-noz');
    let dr = '', dw = '';
    for (let k = 0; k < 8; k++){ const x = 1222 + k * 32; dr += K.mover(1340, 372, x, 586, 4, 'st05-drop', 0.9, k * 0.11); dw += K.mover(1340, 372, x, 586, 4, 'st05-wdrop', 0.9, k * 0.11); }
    c += G(noz + dr, only('batch single')) + G(noz + dw, only('rinse'));
    // agit: 고압 분사 부채꼴 — 노즐이 오가며(스캔) 웨이퍼 위를 쓸고 간다
    let fan = PG([[1334, 370], [1346, 370], [1430, 584], [1250, 584]], 'st05-fan');
    for (let k = 0; k < 6; k++) fan += K.mover(1340, 372, 1262 + k * 32, 584, 3, 'st05-drop', 0.45, k * 0.07);
    c += G(G(noz + fan + `<animateTransform attributeName="transform" type="translate" values="-40 0;40 0;-40 0" dur="3s" repeatCount="indefinite"/>`), K.W(only('agit'), tip('고압 분사 — 부푼 가교 막을 깨서 떼어 낸다\n압력 · 노즐 거리 · 스캔 속도가 손잡이')));
    // dry: 질소 노즐 + 털려 나가는 물방울
    let dy = R(1330, 336, 20, 34, 'st05-noz2') + P('M1340,372 L1290,584', 'st05-n2') + P('M1340,372 L1340,584', 'st05-n2') + P('M1340,372 L1390,584', 'st05-n2');
    [[1172, 590, 1146, 548], [1200, 604, 1146, 612], [1498, 590, 1524, 548], [1470, 606, 1524, 612], [1260, 600, 1146, 580], [1410, 600, 1524, 580]].forEach(([a, bb, cc, dd], k) => { dy += K.mover(a, bb, cc, dd, 3.5, 'st05-wdrop', 0.7, k * 0.12); });
    c += G(dy, only('dry'));
    // 조각이 바깥으로 튐 (부풀어 떨어지는 PR일 때만 — 위젯)
    let fr = '';
    [[1180, 590, 1146, 540, 1.6, 0], [1490, 590, 1524, 540, 1.6, 0.8], [1210, 606, 1150, 600, 1.4, 0.4], [1460, 606, 1522, 600, 1.4, 1.2]].forEach(([a, bb, cc, dd, du, de]) => { fr += flyer(a, bb, cc, dd, du, de); });
    c += G(G(fr, {'data-v': 'frag'}), only('batch single'));
    let fr2 = '';
    [[1180, 590, 1146, 520, 1.0, 0], [1490, 590, 1524, 520, 1.0, 0.5], [1230, 600, 1148, 580, 0.9, 0.25], [1440, 600, 1522, 580, 0.9, 0.7], [1300, 592, 1150, 500, 1.2, 0.6], [1370, 592, 1520, 500, 1.2, 0.1]].forEach(([a, bb, cc, dd, du, de]) => { fr2 += flyer(a, bb, cc, dd, du, de, 18, 7, 70); });
    c += G(G(fr2, {'data-v': 'frag2', 'data-tip': '떼어 낸 PR 조각 — 컵으로 튀어 회수 필터로'}), only('agit'));
    // 배수 → 회수
    c += K.arrow(1500, 692, 1500, 728, 's-arr') + T(1156, 742, '회수 → 필터 → 다시 씀 (또는 버림)', 't-dim', 'start');
    s += G(c, {'data-v': 'cham'});
    // 혼합형: 탱크에서 불린 웨이퍼가 매엽 챔버로 (위젯이 '혼합'일 때만)
    s += G(K.arrow(1062, 262, 1110, 262, 's-arr3') + T(1116, 270, '혼합: 탱크에서 불린 웨이퍼를 받아 고압 분사', 't-dim', 'start'), {'data-v': 'hyb', class: 'hide'});

    // ── 단계 강조 테두리 (흐리게 하지 않는 층)
    s += G(R(38, 250, 444, 406, 'st05-hl2', {rx: 12}), only('agit'));
    s += G(R(500, 250, 340, 400, 'pl-hlbox', {rx: 12}), only('rinse'));
    s += G(R(860, 250, 210, 400, 'pl-hlbox', {rx: 12}), only('dry'));

    // ── 아래 패널 (x 30~1574, y 766~1112)
    s += R(30, 766, 1544, 346, 'pl-panel', {rx: 14});
    // batch: 역류 그림 + 배치의 특징
    let bp = T(56, 802, '역류(캐스케이드) — 새 액은 마무리 탱크로', 't-acc', 'start');
    const tk2 = (x, a, bb, dirty) => P(`M${x},872 L${x},1010 L${x + 200},1010 L${x + 200},872`, 'f-tank') + R(x + 3, 886, 194, 121, 'f-strip') + (dirty ? R(x + 3, 886, 194, 121, 'st05-dis') : '') + T(x + 100, 932, a, 't-sub') + T(x + 100, 962, bb, 't-dim');
    bp += tk2(90, '탱크 1 (먼저)', '녹은 PR 많음', true) + tk2(420, '탱크 2 (마무리)', '녹은 PR 적음', false);
    bp += K.arrow(664, 852, 606, 884, 's-arrg') + T(670, 856, '새 액', 't-sub', 'start');
    bp += K.arrowP('M432,884 C410,830 316,830 296,882', 's-arrg') + T(364, 836, '넘침', 't-sub');
    bp += K.arrow(110, 1010, 110, 1054, 's-arr2') + T(126, 1050, '버림', 't-dim', 'start');
    bp += K.arrow(220, 1046, 540, 1046, 's-arr') + T(380, 1084, '웨이퍼는 1 → 2, 액은 2 → 1 (반대 방향)', 't-dim');
    bp += T(760, 802, '배치의 특징', 't-acc', 'start');
    const ico1 = x => { let q = R(x, 0, 44, 52, 'st05-cas', {rx: 4}); for (let k = 0; k < 5; k++) q += R(x + 6 + k * 7, 5, 3, 42, 'f-wafer'); return q; };
    const FEAT = [['한 번에 수십 장', '카세트째 담가 처리량이 높다 (위젯: 한 번에 50장 가정)'], ['웨이퍼마다 만나는 액 나이가 다르다', '앞 lot이 녹인 PR이 든 액 — 마무리 탱크로 보완'], ['카세트 슬롯 위치 차이', '위 · 아래 · 처음 · 끝 슬롯 — 슬롯 번호를 기록 (09장 맵)']];
    FEAT.forEach(([h, d], k) => {
      const y = 846 + k * 88;
      if (k === 0) bp += G(ico1(776), {transform: `translate(0 ${y - 30})`});
      if (k === 1) bp += C(790, y - 4, 16, 'st05-old') + C(824, y - 4, 16, 'f-strip st05-new');
      if (k === 2) bp += G(ico1(776) + R(780, 3, 36, 4, 'k-acc2') + R(780, 45, 36, 4, 'k-acc2'), {transform: `translate(0 ${y - 30})`});
      bp += T(850, y, h, 'pl-hdg', 'start') + T(850, y + 30, d, 't-dim', 'start');
    });
    s += G(bp, only('batch'));
    // single: 비교표 (선택한 장비 열을 강조 — 위젯)
    let sp = T(56, 802, '배치 vs 매엽 — 한눈에 비교', 't-acc', 'start');
    sp += `<g data-v="tcol"></g>`;
    sp += T(60, 848, '항목', 't-dim', 'start') + T(610, 848, '배치 (웻벤치)', 't-acc') + T(1237, 848, '매엽', 't-acc');
    const ROWS = [['한 번에', '카세트째 수십 장 (위젯: 50장)', '한 장씩 — 챔버 여러 개 (위젯: 4개)'], ['만나는 액', '여러 장이 나눠 쓴 액 · 나이가 다름', '늘 비슷한 액 (회수 · 보충)'], ['웨이퍼 사이 차이', '슬롯 위치 · 탱크 순서 차이', '작다 — 대신 챔버끼리 맞추기'], ['조각 처리', '탱크 순환 필터 (가라앉기도)', '컵으로 튀어 나가 회수 필터로'], ['처리량 · 액 사용', '높음 · 액을 나눠 써 적게 듦', '과제 · 한 장마다 액이 듦']];
    ROWS.forEach(([a, bb, cc], k) => {
      const y = 862 + k * 48;
      sp += L(50, y, 1554, y, 'st05-tl') + T(60, y + 31, a, 'pl-hdg', 'start') + T(316, y + 31, bb, 't-sub', 'start') + T(936, y + 31, cc, 't-sub', 'start');
    });
    sp += L(300, 826, 300, 1102, 'st05-tl') + L(920, 826, 920, 1102, 'st05-tl');
    s += G(sp, only('single'));
    // agit: 필터 단면 · ΔP 계기 + 겉면 vs 떼어 내기
    let ap = T(56, 802, '필터 — 떨어진 조각을 걸러야 다시 안 붙는다', 't-acc', 'start');
    ap += R(96, 830, 384, 190, 'st05-fhouse', {rx: 18});
    let pl = 'M262,846';
    for (let k = 0; k < 10; k++) pl += ` L${k % 2 ? 262 : 318},${846 + (k + 1) * 16}`;
    ap += P(pl, 'st05-pleat', tip('필터 막 (주름) — 넓은 면적으로 조각을 걸러 낸다'));
    for (let k = 0; k < 3; k++){ const y = 880 + k * 50; ap += P(`M110,${y} L248,${y}`, 's-flow') + P(`M334,${y} L470,${y}`, 's-flow'); }
    [[248, 868, 30], [244, 902, -20], [250, 940, 45], [246, 976, 10], [240, 996, -35], [230, 884, 60], [226, 958, -10]].forEach(([x, y, a]) => { ap += R(x - 8, y - 3, 16, 6, 'f-pr', {transform: `rotate(${a} ${x} ${y})`}); });
    for (let k = 0; k < 3; k++) ap += flyer(110, 900 + k * 40, 236, 890 + k * 44, 2.4, k * 0.8, 14, 6, 6);
    ap += T(100, 1048, '조각 섞인 액 →', 't-dim', 'start') + T(480, 1048, '→ 깨끗한 액', 't-dim', 'end');
    // ΔP 계기 (고정 그림 — 오름)
    const GX = 620, GY = 960, GR = 62, pt = a => [(GX + GR * Math.cos(a * Math.PI / 180)).toFixed(1), (GY - GR * Math.sin(a * Math.PI / 180)).toFixed(1)];
    ap += P(`M${GX - GR},${GY} A${GR},${GR} 0 0 1 ${GX + GR},${GY}`, 'st05-gauge') + P(`M${pt(40).join(',')} A${GR},${GR} 0 0 1 ${GX + GR},${GY}`, 'st05-gaugeh');
    ap += L(GX, GY, +(GX + 50 * Math.cos(25 * Math.PI / 180)).toFixed(1), +(GY - 50 * Math.sin(25 * Math.PI / 180)).toFixed(1), 'st05-needle') + C(GX, GY, 6, 'k-acc2');
    ap += T(GX, 992, 'ΔP (필터 앞뒤 압력차)', 't-sub') + T(GX, 1050, '오름 = 조각이 쌓임', 't-dim') + T(GX, 1078, '갑자기 떨어짐 = 파손 의심', 't-dim');
    ap += T(770, 802, '겉면만 돕는 것 vs 막을 떼어 내는 것', 't-acc', 'start');
    ap += T(770, 846, '메가소닉 (약 1 MHz 음파)', 'pl-hdg', 'start') + T(770, 874, '겉면 경계층을 약 0.6 µm(물)로 얇게 → 새 액이 빨리 닿는다', 't-dim', 'start') + T(770, 900, '막 속 스며들기는 못 바꾼다 · 센 세기는 가는 구조에 주의', 't-dim', 'start');
    ap += T(770, 942, '질소 거품 · 카세트 오르내림 · 순환', 'pl-hdg', 'start') + T(770, 970, '겉면에 새 액을 대 준다 — 막 속은 그대로', 't-dim', 'start');
    ap += T(770, 1012, '고압 분사 (매엽 · 혼합)', 'pl-hdg2', 'start') + T(770, 1040, '부푼 막을 깨서 떼어 냄 → 남은 두께 ↓', 't-dim', 'start') + T(770, 1066, '압력 · 노즐 거리 · 스캔 = [스트립-조건] 손잡이', 't-dim', 'start') + T(770, 1092, '세게 할수록 가는 범프가 기울거나 찍힘', 't-dim', 'start');
    ap += G(R(1380, 1098, 170, 12, 'f-si') + R(1380, 1096, 170, 2, 'f-ti') + R(1380, 1092, 170, 4, 'f-seed2') + mini(K, 1400, 1092, 34) + G(mini(K, 1480, 1092, 34), {transform: 'rotate(14 1497 1092)'}) + K.arrow(1560, 1032, 1532, 1052, 's-arr2') + K.arrow(1564, 1058, 1530, 1072, 's-arr2') + T(1466, 1024, '세면 기울어짐', 't-warn'), tip('너무 센 분사 · 메가소닉은 가는 범프를 기울이거나 찍을 수 있다 (그림은 과장)\n그림은 베이스 다이 범프(Cu 기둥 · Ni · 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu) · SnAg, 높이 ÷ 지름 약 1.2). 낮은 코어 다이 범프(Ni / SnAg, 약 0.7)는 지렛대가 짧아 보통 덜 기운다'));
    s += G(ap, only('agit'));
    // rinse: ① 퀵 덤프 rⁿ ② 넘침 헹굼 비저항 ③ 옮기는 순서
    let rp = T(60, 802, '퀵 덤프 — 쏟을 때마다 남는 몫 r', 't-acc', 'start');
    rp += L(150, 830, 150, 1040, 's-axis') + L(150, 1040, 610, 1040, 's-axis');
    const ly = k => 840 + k * 200 / 7;                                           // 로그 눈금 1 ~ 10⁻⁷ (6번째 막대도 보이게)
    [['1', 0], ['10⁻²', 2], ['10⁻⁴', 4], ['10⁻⁶', 6]].forEach(([t, k]) => { rp += T(140, ly(k) + 7, t, 't-dim', 'end') + L(146, ly(k), 154, ly(k), 's-axis'); });
    for (let n = 0; n <= 6; n++){
      const x = 190 + n * 64;
      rp += R(x - 18, ly(n), 36, Math.max(3, 1040 - ly(n)), 'st05-rbar', tip(`퀵 덤프 ${n}번 뒤 남는 몫 ≈ 0.1^${n} (예시)`)) + T(x, 1066, String(n), 't-dim');
    }
    rp += T(160, 832, '남은 스트리퍼 몫 (로그)', 't-dim', 'start') + T(600, 864, 'n번 뒤 rⁿ', 'pl-eqn', 'end') + T(600, 892, '(r = 0.1 예시 · 가정)', 't-dim', 'end') + T(380, 1096, '퀵 덤프 횟수 n', 't-dim');
    rp += T(680, 802, '넘침 헹굼 — 비저항 · 시간으로 끝', 't-acc', 'start');
    rp += L(720, 830, 720, 1040, 's-axis') + L(720, 1040, 1112, 1040, 's-axis');
    let cv = '', xe = 0;
    for (let k = 0; k <= 40; k++){ const u = k / 40, x = 720 + 380 * u, y = 1040 - 180 * (1 - Math.exp(-3.2 * u)) * (u < 0.08 ? u / 0.08 * 0.5 + 0.5 : 1); cv += (k ? ' L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1); }
    xe = 720 + 380 * (-Math.log(0.15) / 3.2);
    rp += P(cv, 's-curve', tip('넘침 헹굼 물의 비저항 — 이온이 빠질수록 올라가 평평해진다')) + L(720, 887, 1110, 887, 's-dash') + T(1110, 914, '종점', 't-warn', 'end') + T(1110, 940, '(장비 · 기준에 따라)', 't-dim', 'end');
    rp += C(xe, 887, 7, 'k-acc2') + T(xe - 14, 874, '끝', 't-warn', 'end') + T(730, 836, '비저항 ↑', 't-dim', 'start') + T(1110, 1066, '시간 →', 't-dim', 'end') + T(900, 1096, '이온이 적을수록 비저항 ↑ (중성 용제는 안 잡힘)', 't-dim');
    rp += T(1180, 802, '옮기는 순서', 't-acc', 'start');
    const rbox = (y, t, cls) => R(1186, y, 360, 44, cls, {rx: 8}) + T(1366, y + 29, t, 't-sub');
    rp += rbox(822, '스트리퍼 탱크', 'pl-mod') + K.arrow(1206, 868, 1206, 902, 's-arr2') + T(1224, 892, '이동: 마르지 않게 · 짧게', 't-dim', 'start');
    rp += rbox(908, '중간 용제 (약품에 따라)', 'pl-mod st05-opt') + K.arrow(1206, 954, 1206, 988, 's-arr2') + T(1224, 978, '약품이 정한 순서', 't-dim', 'start');
    rp += rbox(994, '물 — 첫 물은 빠르고 많이', 'pl-mod st05-wat');
    rp += T(1186, 1070, '왜 순서가 중요한지 → 07장', 't-dim', 'start') + T(1186, 1096, '(물로 바로 헹구게 만든 약품도 많다)', 't-dim', 'start');
    s += G(rp, only('rinse'));
    // dry: 물자국 웨이퍼 vs 깨끗한 웨이퍼 + 대기 시간
    let dp = T(56, 802, '물자국(워터마크) — 물방울이 마르며 남긴 고리', 't-acc', 'start');
    const wafer = (cx, cy) => C(cx, cy, 110, 'f-wafer') + P(`M${cx - 8},${cy + 110} L${cx},${cy + 100} L${cx + 8},${cy + 110}`, 'st05-notch');
    dp += wafer(230, 948);
    [[180, 900], [262, 884], [292, 960], [214, 990], [150, 950], [250, 1022]].forEach(([x, y], k) => { dp += E(x, y, 14 - (k % 3) * 2, 11 - (k % 3) * 2, 'st05-mark') + C(x, y, 3, 'st05-markd'); });
    dp += T(230, 1092, '물방울이 그대로 마르면', 't-sub');
    dp += K.arrow(366, 948, 474, 948, 's-arrg') + T(420, 926, '빨리 · 남김없이', 't-dim');
    dp += wafer(610, 948) + T(610, 1092, '깨끗 (스핀 · IPA 증기)', 't-sub');
    dp += C(830, 872, 32, 'st05-clock') + L(830, 872, 830, 850, 'st05-hand') + L(830, 872, 846, 880, 'st05-hand');
    dp += T(880, 866, '건조 → 시드 식각까지 대기 시간', 'pl-hdg', 'start') + T(880, 894, '(산화 · 흡착)', 't-dim', 'start');
    dp += T(800, 950, '젖은 채 오래 두면 솔더 · Cu 표면 산화 ↑', 't-dim', 'start') + T(800, 978, '공기 중 유기물 · 수분이 다시 붙는다', 't-dim', 'start') + T(800, 1006, '→ 다음 공정까지 시간 한도(Q-time)를 정해 관리', 't-dim', 'start');
    dp += T(800, 1046, 'IPA 증기 건조 (마랑고니)', 'pl-hdg2', 'start') + T(800, 1074, '물 막에 IPA가 녹아 표면장력 차이로 물을 끌어내림', 't-dim', 'start') + T(800, 1100, 'IPA 인화점 약 12 °C — 화재 안전 설계가 따로 필요', 't-dim', 'start');
    s += G(dp, only('dry'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 배치 vs 매엽 vs 혼합</div>
      ${K.seg('tool', [['batch', '배치 담금'], ['single', '매엽 분사'], ['hyb', '담금(배치) + 매엽 고압 분사 (혼합)']], 'batch', '장비')}
      ${K.seg('pr', [['dis', '녹는 PR'], ['swl', '부풀어 떨어지는 PR']], 'dis', 'PR 거동')}
      ${K.ctl('L', 'PR 두께 (µm)', 20, 100, 5, 35)}${K.ctl('T', '온도 (°C)', 50, 85, 1, 70)}
      <div class="st05-kp">${K.kpis([['스트립 시간', 'k-t', '분 (개념 모델)'], ['처리량', 'k-wph', '장 / 시간 (예시)'], ['웨이퍼가 만나는 액', 'k-liq', '<span data-o="k-liq2"></span>'], ['조각 처리', 'k-fl', '<span data-o="k-fl2"></span>']])}</div>
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('처리량 = 한 번에 넣는 장수 × 60 ÷ (스트립 + 부대 시간, 분). 부대 시간은 헹굼 · 건조 · 옮기기처럼 스트립 말고 드는 시간입니다. 배치 50장 · 부대 15분, 매엽 챔버 4개 · 부대 2분, 혼합의 고압 분사 3분은 가정값입니다. 혼합의 스트립 시간(층째 떼기)은 한 챔버에서 불리기 · 분사를 되풀이할 때의 값이고, 처리량은 탱크에서 끝까지 담가 둔 뒤(부풀어 떨어지는 PR은 바닥까지 다 불 때까지 = 03장 순환 흐름의 스며드는 시간, 녹는 PR은 3분 분사가 녹일 몫만 남을 때까지) 챔버에서 3분 분사한다고 둔 가정입니다 — 탱크 · 분사 챔버 가운데 느린 쪽이 정합니다. 스트립 시간은 <a data-go="soak.stir">03장</a> 개념 모델 값입니다 — 배치 = 순환 흐름, 매엽 = 분사 · 메가소닉, 혼합 = 고압 분사(층 20 µm), 가교 PR은 중간 방식(n 0.75), Ea 50 kJ/mol 예시. 실제 배치 벤치는 탱크마다 다른 lot을 동시에 처리해 더 높을 수 있습니다. 기본 두께 35 µm는 세 탭이 함께 그리는 범프의 PR(예시)이고, 전해도금 탭의 예시 60 µm는 슬라이더로 볼 수 있습니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, E, T, G} = K;
    const st = {tool: 'batch', pr: 'dis', L: L0, T: T0};
    let touched = false, lastDur = 0;
    const Lin = ctx.card.querySelector('input[data-i=L]'), Tin = ctx.card.querySelector('input[data-i=T]');
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(bt => bt.setAttribute('aria-pressed', bt.dataset.v === v ? 'true' : 'false'));
    const f1 = x => x.toFixed(1);
    function render(){
      const sid = ctx.step();
      const tt = {}, ww = {};
      TOOLS.forEach(k => { tt[k] = stripTime(k, st.pr, st.L, st.T); ww[k] = wph(k, tt[k], st.pr, st.L, st.T); });
      // 위젯 막대 띠: 세 장비의 스트립 시간 막대 + 시간당 웨이퍼 아이콘 (● 1개 = 10장)
      let band = '';
      TOOLS.forEach((k, i) => {
        const cy = BAND[i], on = k === st.tool, bw = Math.min(80, tt[k]) * 5;
        let r = on ? R(48, cy - 14, 1222, 28, 'st05-rowsel', {rx: 6}) : '';
        r += T(60, cy + 7, NAME[k], on ? 't-sub st05-on' : 't-sub', 'start');
        r += R(330, cy - 8, bw, 16, 'st05-bar', {rx: 3}) + T(330 + bw + 12, cy + 7, `${f1(tt[k])}분`, 't-sub', 'start');
        r += T(975, cy + 7, `${Math.round(ww[k])}장/시간`, 't-sub', 'end');
        const n = Math.round(ww[k] / 10);
        for (let q = 0; q < Math.min(12, n); q++) r += C(1000 + q * 21, cy, 7, 'st05-wi');
        if (n > 12) r += T(1254, cy + 7, '+', 't-sub', 'start');
        band += G(r, on ? {'data-tip': `${NAME[k]} — 스트립 ${f1(tt[k])}분, 시간당 약 ${Math.round(ww[k])}장 (개념 모델)`} : {class: 'st05-rowdim'});
      });
      ctx.$('[data-v="band"]').innerHTML = band;
      // 고른 장비 쪽을 강조, 장비 단계(배치 · 매엽 · 흔들기)에서는 다른 쪽을 흐리게
      const act = !sid || sid === 'batch' || sid === 'single' || sid === 'agit';
      const useB = st.tool !== 'single', useC = st.tool !== 'batch';
      ctx.$('[data-v="bf"]').setAttribute('class', useB ? 'pl-hlbox' : 'pl-panel');
      ctx.$('[data-v="cf"]').setAttribute('class', useC ? 'pl-hlbox' : 'pl-panel');
      ctx.$('[data-v="bench"]').classList.toggle('st05-dim', act && !useB);
      ctx.$('[data-v="cham"]').classList.toggle('st05-dim', act && !useC);
      ctx.$('[data-v="hyb"]').classList.toggle('hide', st.tool !== 'hyb');
      // 조각: 부풀어 떨어지는 PR일 때만
      ['flk', 'frag', 'frag2'].forEach(v => ctx.$(`[data-v="${v}"]`).classList.toggle('hide', st.pr !== 'swl'));
      // 온도: 히터 색 · 글
      const hc = K.heat((st.T - 40) / 50);
      ctx.$$('[data-v="h1"],[data-v="h2"]').forEach(el => { el.style.stroke = hc; });
      ctx.$('[data-v="t1"]').textContent = `먼저 · ${st.T} °C`;
      ctx.$('[data-v="t2"]').textContent = `마무리 · ${st.T} °C`;
      ctx.$('[data-v="tn"]').textContent = `데운 스트리퍼 · ${st.T} °C`;
      // 두께: 웨이퍼 위 PR 막 (두께 과장)
      const th = st.L * 0.13;
      ctx.$('[data-v="coat"]').innerHTML = G(E(1335, 590, 166, 18, 'st05-wpr') + R(1169, 590 - th, 332, th, 'st05-wpr') + E(1335, 590 - th, 166, 18, 'st05-wpr2'), {'data-tip': `PR 막 ${st.L} µm (두께는 과장)`});
      // 카세트가 도는 빠르기 = 배치 스트립 시간에 비례 (6~24 s, 녹는 PR 35 µm · 70 °C = 12 s)
      const dur = K.clamp(12 * tt.batch / T_REF, 6, 24);
      if (Math.abs(dur - lastDur) > 0.05){ ctx.$('[data-v="mv"]').innerHTML = travel(K, dur); lastDur = dur; }
      // 비교표: 고른 장비의 열
      const cols = {batch: [[300, 620]], single: [[920, 634]], hyb: [[300, 620], [920, 634]]}[st.tool];
      ctx.$('[data-v="tcol"]').innerHTML = cols.map(([x, w]) => R(x, 822, w, 282, 'pl-hlbox', {rx: 8})).join('');
      ctx.refresh();
      // 카드 결과
      const t = tt[st.tool], w = ww[st.tool];
      ctx.out('k-t', f1(t)); ctx.out('k-wph', String(Math.round(w)));
      ctx.out('k-liq', LIQ[st.tool][0]); ctx.out('k-liq2', LIQ[st.tool][1]);
      const fk = st.pr === 'dis' ? ['거의 없음', '녹아서 액에 쌓인다 (액이 지침)'] : FLK[st.tool];
      ctx.out('k-fl', fk[0]); ctx.out('k-fl2', fk[1]);
      ctx.card.querySelector('[data-o="k-t"]').parentNode.classList.toggle('warn', t > 40);
      let gen = {batch: '배치는 한 번에 많이 처리하지만 액을 여러 장이 나눠 씁니다(마무리 탱크로 보완).',
        single: '매엽은 웨이퍼마다 고르지만 한 장씩이라 처리량이 과제입니다(챔버 수로 보완).',
        hyb: ''}[st.tool];
      if (st.tool === 'hyb'){
        const sk = soakHyb(st.pr, st.L, st.T), [capT, capC] = capHyb(st.pr, st.L, st.T);
        const swl = st.pr === 'swl', t0 = tt.hyb;
        gen = `혼합형은 탱크에서 담가 ${swl ? '바닥까지 불린' : '3분 분사로 끝낼 만큼 녹인'} 뒤(약 ${f1(sk)}분, 여러 장이 함께) 매엽 챔버에서 3분 고압 분사로 떼어 냅니다. `
          + (capT >= capC ? `챔버는 분사 몫(3분 + 부대 2분, 가정)만 쓰므로 탱크가 따라오는 동안은 분사 챔버 수가 처리량을 정합니다(4개 → ${Math.round(capC)}장/시간).`
            : `이 두께 · 온도에서는 탱크 담금이 길어 탱크(50장 · 부대 15분, 가정)가 처리량을 정합니다(약 ${Math.round(capT)}장/시간 < 분사 챔버 ${Math.round(capC)}장/시간).`)
          + (sk > t0 ? ` 탱크 담금이 위 스트립 시간(${f1(t0)}분 — 한 챔버에서 불리기 · 분사를 되풀이할 때)보다 긴 것은 분사 없이 ${swl ? '바닥까지 불려야' : '순환 흐름만으로 녹여야'} 하기 때문입니다.` : '')
          + ' 분사를 세게 할수록 범프 손상 위험도 봅니다.';
      }
      const prm = st.pr === 'dis' ? '녹는 PR은 조각이 거의 없고 녹은 PR이 액에 쌓입니다(→ <a data-go="bath.load">06장</a>).' : '부풀어 떨어지는 PR은 판 · 조각으로 떨어져 필터가 받아야 합니다.';
      let msg = `<b>${NAME[st.tool]}</b> — 스트립 약 ${f1(t)}분, 시간당 약 ${Math.round(w)}장. 같은 조건에서 배치 ${Math.round(ww.batch)} · 매엽 ${Math.round(ww.single)} · 혼합 ${Math.round(ww.hyb)}장/시간. ${gen} ${prm}`;
      if (st.tool === 'hyb' && st.pr === 'dis') msg += ' 다만 녹는 PR에는 떼어 낼 부푼 막이 없어 고압 분사의 이점이 작습니다 — 혼합형은 주로 두꺼운 가교 PR용입니다.';
      if (t > 40) msg += ' 담그는 시간이 길면 금속 손실도 늘어납니다 → <a data-go="metal.cu">07장</a>.';
      if (st.T > 78) msg += ` <b>⚠ 온도 ${st.T} °C — DMSO 인화점(약 88 °C)까지 ${88 - st.T} °C, 예시 경고선(인화점 − 10 °C, 가정) 안쪽입니다.</b> 실제 여유는 장비 · 사내 안전 기준을 따릅니다.`;
      ctx.q('[data-o=msg]').innerHTML = msg;
    }
    ctx.seg('tool', v => { st.tool = v; render(); });
    ctx.seg('pr', v => { st.pr = v; render(); });
    ctx.range('L', v => { st.L = v; render(); return v + ' µm'; });
    ctx.range('T', v => { st.T = v; render(); return v + ' °C'; });
    ctx.card.querySelectorAll('.pl-w input, .pl-w .pl-seg button').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    // 손대기 전에는 단계마다 예시 값으로. 발표 모드에서는 위젯을 만질 수 없으므로 늘 예시 값으로 되돌린다
    ctx.demo = sid => {
      const tp = window.EngrTheatres && window.EngrTheatres.strip;
      if (tp && tp.state && tp.state.pres != null) touched = false;
      const d = DEMO[sid];
      if (touched || !d) return render();
      st.tool = d[0]; st.pr = d[1]; st.L = L0; st.T = T0;
      setSeg('tool', st.tool); setSeg('pr', st.pr);
      Lin.value = L0; ctx.out('L', L0 + ' µm'); Tin.value = T0; ctx.out('T', T0 + ' °C');
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    const tg = (c, t) => `<span class="pl-tag ${c}">${t}</span>`;
    return K.terms([
      ['웻벤치 (배치)', '약품 탱크를 줄지어 놓고 웨이퍼 묶음째 담갔다 옮기는 장비. 300 mm 장비는 보통 FOUP(웨이퍼 운반 통)에서 꺼낸 웨이퍼를 탱크용 받침(웨이퍼 가이드)에 옮겨 담근다 — 이 탭 그림의 \'카세트\'는 그 받침까지 함께 뜻한다'],
      ['매엽', '웨이퍼를 한 장씩 처리하는 방식 (돌리며 뿌리거나 고여 둠)'],
      ['퍼들', '웨이퍼 위에 액을 고여 두고 기다리는 방식'],
      ['캐스케이드 (넘침 · 역류)', '새 액을 마무리 탱크에 넣고, 넘친 액을 앞 탱크로 보내는 구조. 웨이퍼와 액이 반대 방향으로 간다'],
      ['퀵 덤프 린스 (QDR)', '물을 채웠다가 한 번에 쏟아 버리기를 되풀이해 빨리 헹구는 탱크'],
      ['메가소닉', '약 1 MHz 음파로 겉면 경계층을 얇게 하고 입자를 떼어 내는 장치'],
      ['IPA 증기 건조 (마랑고니)', '물 막에 IPA 증기를 녹여 표면장력 차이로 물을 끌어내리는 건조'],
      ['워터마크', '물방울이 마르며 남긴 얼룩 — 물에 녹아 있던 것이 고리로 남는다']
    ]) + K.field([
      `${tg('hw', '스트립-장비')} 배치는 카세트 안 위치(위 · 아래 · 처음 · 끝 슬롯)와 탱크 순서마다 결과가 다를 수 있습니다. 위아래 차이는 흐름 방향(아래 입구 = 새 · 따뜻한 액) · 가라앉는 조각 · 옮길 때 위쪽이 먼저 마르는 것에서 옵니다. 슬롯 번호를 기록하면 맵 분석이 쉬워집니다 → <a data-go="defects.map">09장</a>.`,
      `${tg('hw', '스트립-장비')} 필터 차압(ΔP)이 오르면 조각이 쌓인 것이고, 갑자기 떨어지면 필터 파손을 의심합니다. 부풀어 떨어지는 PR로 바뀌거나 PR이 두꺼워지면 필터 교체 주기를 다시 잡습니다.`,
      `${tg('st05-cond', '스트립-조건')} 매엽 · 혼합 장비는 분사 압력 · 노즐 거리 · 스캔 속도, 그리고 회전 속도 · 유량 · 퍼들(고여 두는) 시간 · 액 온도(배관 속 히터)가 손잡이입니다. 분사를 세게 하면 부푼 가교 막은 잘 떼지만, 가는 범프가 기울거나 찍힐 수 있어 지름이 작고 높이 ÷ 지름이 큰 제품일수록 창을 다시 잡습니다 — 예시로 베이스 다이 범프(Cu / Ni / Cu / SnAg, 30 ÷ 25 ≈ 1.2)가 코어 다이 범프(Ni / SnAg, 17 ÷ 25 ≈ 0.7)보다 지렛대가 깁니다 → <a data-go="defects.tiles">09장</a>.`,
      `${tg('st05-cond', '스트립-조건')} 헹굼 순서(중간 용제를 쓸지, 물로 바로 헹굴지)는 <b>약품 공급사가 검증한 순서</b>를 따릅니다 → <a data-go="metal.rinse">07장</a>. 중간 용제 탱크(IPA 인화점 약 12 °C)는 데운 스트리퍼 옆에 두는 가연성 액이라 화재 안전 · 비용 · 드래그아웃까지 함께 따집니다.`,
      `${tg('st05-cond', '스트립-조건')} 웨이퍼를 넣는 순간 탱크 온도가 잠깐 떨어집니다 — 레시피 시간이 회복 시간을 포함하는지 확인합니다. 스트리퍼 탱크에서 헹굼 탱크로 옮기는 시간이 길면 표면이 마르며 잔여가 굳을 수 있습니다. 가열 액조는 독립된 과열 · 저수위 차단 장치가 기본입니다.`
    ]) + K.deep(`<ul>
      <li><b>혼합형 (담금 + 매엽 고압 분사)</b> — 담금(soak)이 가교 막을 부풀려 깨지기 쉽게 하면, 고압 분사가 위층을 깨서 떼어 내 용제가 새 면에 바로 닿게 합니다. 그래서 한 번의 L²/D가 아니라 층째 깎는 꼴(시간 ∝ 두께)에 가까워집니다(<a data-go="soak.stir">03장</a>). 공개 특허는 분사 압력 · 노즐 거리를 관리해야 한다고 적고, 공개 학회 논문은 300 mm 매엽에서 담금 + 고압 분사로 DMSO + 4차 암모늄 수산화물 액을 써 두꺼운 네거티브 PR을 걷으며 액 수명 7일 이상을 평가했습니다. 위젯 예(35 µm · 70 °C): 혼합 6.4분(녹는 PR) · 5.6분(부풀어 떨어지는 PR), 60 µm면 11 · 9.2분 — 한 챔버에서 불리기 · 분사를 되풀이할 때의 값입니다.</li>
      <li><b>처리량 계산</b> ${K.eq('처리량 [장/시간] = 한 번에 넣는 장수 × 60 ÷ (스트립 + 부대 시간 [분])')} 녹는 PR 35 µm · 70 °C: 배치 50 × 60 ÷ (10.2 + 15) ≈ 119, 매엽 4 × 60 ÷ (7.0 + 2) ≈ 27, 혼합 min(탱크 50 × 60 ÷ (담금 5.4 + 15) ≈ 147, 분사 챔버 4 × 60 ÷ (3 + 2) = 48) = 48 (모두 가정값 · 60 µm면 92 · 17 · 48). 혼합의 탱크 담금은 3분 분사 한 번으로 끝낼 만큼이어야 합니다 — 분사 없이 담가 두는 탱크에서 부풀어 떨어지는 PR은 바닥까지 다 불어야 하므로(<a data-go="soak.square">03장</a> 순환 흐름) 35 µm 약 6.1분 · 100 µm 약 25분으로, 같은 막의 층째 떼기 시간(5.6 · 15.1분)보다 깁니다. 그래서 두껍고 차가울수록 탱크가 처리량을 정합니다(예: 100 µm · 50 °C — 담금 약 74분 → 약 34장/시간). 탱크마다 다른 lot이 동시에 들어가는 배치 벤치는 가장 긴 탱크 체류 시간이 상한을 정해 이보다 높을 수 있고, 매엽은 챔버 수에 비례합니다. 액 사용은 반대로 매엽 · 분사가 웨이퍼당 더 많습니다(회수 · 재사용으로 줄임).</li>
      <li><b>캐스케이드 계산</b> — 첫 탱크가 PR의 대부분(예: 90 %)을 받고, 새 액을 둘째 탱크에 넣어 첫 탱크로 넘기면 마무리 탱크의 녹은 PR 농도는 한 탱크만 쓸 때보다 훨씬 낮게 유지됩니다(<a data-go="bath.cascade">06장</a> 예시: 약 6배, 5~10배). 웨이퍼 · 카세트가 첫 탱크의 지친 액을 웨이퍼당 수 mL 묻혀 오는 드래그아웃이 그 차이를 줄이므로, 물기 빼는 시간 · 들어 올리는 속도도 손잡이입니다.</li>
      <li><b>메가소닉 vs 초음파</b> — 진동 경계층 δ ≈ √(2ν/ω): 물(ν ≈ 1.0×10⁻⁶ m²/s)에서 1 MHz는 약 0.56 µm, 40 kHz 초음파는 약 2.8 µm입니다. 경계층이 얇을수록 겉면 공급이 빨라지지만 막 속 확산은 그대로입니다. 초음파(수십 kHz)는 공동(캐비테이션)이 터지는 충격이 커서 가는 구조 손상 위험이 더 크고, 메가소닉은 큰 공동이 덜 생기지만 조건에 따라 미세 공동이 생길 수 있습니다.</li>
      <li><b>녹지 않는 조각과 필터</b> — 부풀어 떨어지는 가교 PR은 조각이 되고(<a data-go="resist.lift">02장</a> 가정: 조각 ≈ 두께의 약 4배 → 35 µm 막이면 약 0.14 mm, 범프 자리가 뚫린 판), 알칼리가 그물을 천천히 잘라도 다 녹기 전에 필터에 닿습니다. 조각을 흐름으로 잘게 부수고 탱크 밖으로 끌어내 거른 뒤 되돌리는 설계가 특허로 나와 있고, 조각이 많으면 필터가 먼저 한계에 닿습니다(ΔP 추세 · 교체 주기).</li>
      <li><b>헹굼 설계</b> — 퀵 덤프는 물을 여러 번 갈아 남은 농도를 지수적으로 줄입니다: 매번 남는 몫 r이면 n번 뒤 rⁿ (r은 웨이퍼 · 카세트 · 탱크 벽에 남는 액막과 섞임 효율이 정함 — 그림 r = 0.1은 가정). 넘침 헹굼은 비저항(초순수 25 °C 18.2 MΩ·cm에 다가감)으로 끝을 정하기도 하지만, 비저항은 <b>이온(알칼리 · 염)</b>만 봅니다 — DMSO · NMP 같은 중성 용제는 거의 안 잡히므로 종점은 시간 · 유기물 측정과 함께 약품에 맞춰 검증합니다.</li>
      <li><b>건조와 안전</b> — IPA 증기 건조는 물 막에 IPA가 녹아 표면장력 차이가 생기면(마랑고니 효과) 물이 웨이퍼에서 끌려 내려가 물방울 자국이 줄어듭니다. IPA 인화점은 약 12 °C라 증기 건조기 · 중간 용제 탱크는 화재 안전 설계가 따로 필요합니다. 탱크 · 배관은 용제 · 알칼리에 견디는 재질(불소수지 · 스테인리스 등, 액에 따라)을 쓰고, 가열 용제 + 플라스틱 탱크 조합은 화재 위험 평가 대상입니다(가열 액조 안전 지침의 취지 — 독립 과열 · 저수위 차단). 용제 벤치는 보통 불꽃 감지 · 자동 소화(CO₂ 등) · 배기 감시 인터록(배기가 약해지면 가열 · 공급을 멈춤)을 함께 갖추고, 탱크 · 벤치 몸체는 난연(불이 잘 번지지 않는) 재질을 씁니다. 건조 뒤 솔더 표면 산화막은 <a href="#go-reflow-03">리플로우 03장</a>, 남은 유기막이 식각을 막는 이야기는 <a href="#go-etch-01">시드 식각 01장</a>.</li></ul>`);
  },
  css: `.pl-svg .st05-cas{fill:rgba(30,41,59,.88);stroke:#94a3b8;stroke-width:1.6}
.pl-svg .st05-hook{fill:none;stroke:#94a3b8;stroke-width:2.4}
.pl-svg .st05-rail{stroke:#64748b;stroke-width:4;stroke-dasharray:14 6}
.pl-svg .st05-ipa{fill:rgba(134,239,172,.13)}
.pl-svg .st05-dis{fill:rgba(139,123,224,.20)}
.pl-svg .st05-dis2{fill:rgba(139,123,224,.07)}
.pl-svg .st05-heat{fill:none;stroke:#fb923c;stroke-width:3;stroke-linejoin:round}
.pl-svg .st05-dim{opacity:.4;transition:opacity .4s}
.pl-svg .st05-rowdim{opacity:.42}
.pl-svg .st05-rowsel{fill:rgba(56,189,248,.10);stroke:#38bdf8;stroke-width:1.6}
.pl-svg .st05-on{font-weight:800;fill:#f8fafc !important}
.pl-svg .st05-bar{fill:#38bdf8}
.pl-svg .st05-wi{fill:#94a3b8;stroke:#e2e8f0;stroke-width:1}
.pl-svg .st05-arm{fill:#334155;stroke:#94a3b8;stroke-width:1.4}
.pl-svg .st05-pipe{fill:none;stroke:#475569;stroke-width:6}
.pl-svg .st05-noz{fill:#64748b;stroke:#e2e8f0;stroke-width:1.2}
.pl-svg .st05-noz2{fill:#475569;stroke:#cbd5e1;stroke-width:1.2;stroke-dasharray:3 2}
.pl-svg .st05-chuck{fill:#26354f;stroke:#6b84ad;stroke-width:1.4}
.pl-svg .st05-drop{fill:#c4b5fd}
.pl-svg .st05-wdrop{fill:#7dd3fc}
.pl-svg .st05-fan{fill:rgba(245,158,11,.18);stroke:#f59e0b;stroke-width:1.2;stroke-dasharray:5 4}
.pl-svg .st05-wseed{fill:#b9734a;stroke:#e0904f;stroke-width:1}
.pl-svg .st05-bump{fill:#cdd7e3;stroke:#64748b;stroke-width:.6}
.pl-svg .st05-wpr{fill:rgba(139,123,224,.6);stroke:#a99cf0;stroke-width:1}
.pl-svg .st05-wpr2{fill:rgba(167,139,250,.75);stroke:#c4b5fd;stroke-width:1}
.pl-svg .st05-n2{fill:none;stroke:#e2e8f0;stroke-width:1.8;stroke-dasharray:4 7;animation:jzflow .5s linear infinite;opacity:.8}
.pl-svg .st05-sparg{stroke:#e2e8f0;stroke-width:4;stroke-dasharray:3 5}
.pl-svg .st05-mega{fill:#475569;stroke:#a78bfa;stroke-width:1.5}
.pl-svg .st05-wave{fill:none;stroke:#a78bfa;stroke-width:2.4;animation:st05w 1.2s ease-in-out infinite}
@keyframes st05w{0%,100%{opacity:.15}50%{opacity:.95}}
.pl-svg .st05-vap{fill:none;stroke:#86efac;stroke-width:2.2;stroke-dasharray:9 8;animation:jzflow 1.1s linear infinite;opacity:.85}
.pl-svg .st05-hl2{fill:rgba(245,158,11,.05);stroke:#f59e0b;stroke-width:2.2;stroke-dasharray:10 6}
.pl-svg .st05-old{fill:rgba(139,123,224,.55);stroke:#a99cf0;stroke-width:1.2}
.pl-svg .st05-new{stroke:#c4b5fd;stroke-width:1.2}
.pl-svg .st05-tl{stroke:rgba(148,163,184,.28);stroke-width:1}
.pl-svg .st05-fhouse{fill:rgba(15,26,46,.9);stroke:#94a3b8;stroke-width:1.6}
.pl-svg .st05-pleat{fill:none;stroke:#cbd5e1;stroke-width:3;stroke-linejoin:round}
.pl-svg .st05-gauge{fill:none;stroke:#334155;stroke-width:14}
.pl-svg .st05-gaugeh{fill:none;stroke:#ef4444;stroke-width:14;opacity:.8}
.pl-svg .st05-needle{stroke:#fbbf24;stroke-width:4;stroke-linecap:round}
.pl-svg .st05-rbar{fill:rgba(125,211,252,.55);stroke:#7dd3fc;stroke-width:1}
.pl-svg .st05-opt{stroke-dasharray:7 5}
.pl-svg .st05-wat{fill:rgba(14,165,233,.18)}
.pl-svg .st05-mark{fill:none;stroke:#e2e8f0;stroke-width:2.2;opacity:.85}
.pl-svg .st05-markd{fill:#cbd5e1;opacity:.6}
.pl-svg .st05-notch{fill:#0b1222;stroke:#94a3b8;stroke-width:1}
.pl-svg .st05-clock{fill:#0f1a2e;stroke:#fbbf24;stroke-width:3}
.pl-svg .st05-hand{stroke:#fbbf24;stroke-width:3.5;stroke-linecap:round}
.jc .pl-tag.st05-cond{background:rgba(45,212,191,.18);color:#5eead4}
.jc .st05-kp .kpi:nth-child(n+3){flex:1 1 40%}
.jc .st05-kp .kpi:nth-child(n+3) .v{font-size:15px;line-height:1.35}`
});
})();
