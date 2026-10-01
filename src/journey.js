/* ================================================================
 * engr-edu · HBM 역추적 — AI에서 DRAM 셀까지 스크롤 줌 스토리
 *
 * 구조
 *  - 장면(SCENES): 1600×1000 좌표의 SVG. 다음 장면이 들어갈 자리(초점 f)를 갖는다.
 *  - 카메라: 스크롤 위치 → 연속 값 u(장면 번호 + 전환 진행도) → 두 장면의 변환 행렬.
 *    큰 장면을 초점 쪽으로 Z^e 배 확대하고, 작은 장면은 초점 안에 1/Z 배로 넣어 함께 움직인다.
 *  - 카드: 오른쪽 열. 카드(또는 카드 안의 단계)가 활성화되면 장면 상태(state)가 바뀐다.
 *  - 모드: 역추적(AI → DRAM, 줌인) / 제조 순서(DRAM → AI, 같은 화면을 거꾸로 재생 = 줌아웃).
 *  - 발표 모드: 전체 화면, ← → 키로 한 단계씩, 장면 전환은 애니메이션으로.
 * ================================================================ */
(function(){
'use strict';
const VIEW = document.getElementById('view-hbm');
if (!VIEW) return;

/* ---------------- 1. 도구 ---------------- */
const W0 = 1600, H0 = 1000, CX = 800, CY = 500;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const q1 = v => Math.round(v * 10) / 10;
const at = o => o ? Object.keys(o).filter(k => o[k] != null && o[k] !== false).map(k => ` ${k}="${esc(o[k])}"`).join('') : '';
const R = (x, y, w, h, c, o) => `<rect x="${q1(x)}" y="${q1(y)}" width="${q1(Math.max(0, w))}" height="${q1(Math.max(0, h))}" class="${c}"${at(o)}/>`;
const C = (x, y, r, c, o) => `<circle cx="${q1(x)}" cy="${q1(y)}" r="${q1(r)}" class="${c}"${at(o)}/>`;
const L = (x1, y1, x2, y2, c, o) => `<line x1="${q1(x1)}" y1="${q1(y1)}" x2="${q1(x2)}" y2="${q1(y2)}" class="${c}"${at(o)}/>`;
const P = (d, c, o) => `<path d="${d}" class="${c}"${at(o)}/>`;
const PG = (pts, c, o) => `<polygon points="${pts.map(p => q1(p[0]) + ',' + q1(p[1])).join(' ')}" class="${c}"${at(o)}/>`;
const T = (x, y, s, c = 't-lbl', a = 'middle', o) => `<text x="${q1(x)}" y="${q1(y)}" class="${c}" text-anchor="${a}"${at(o)}>${esc(s)}</text>`;
const G = (inner, o) => `<g${at(o)}>${inner}</g>`;
const LB = (inner, o) => G(inner, Object.assign({class: 'lbl'}, o || {}));
const st = list => ({'data-st': list});
const tip = s => ({'data-tip': s});
function lead(px, py, tx, ty, s, a = 'start', c = 't-sub', o){
  return LB(P(`M${q1(px)},${q1(py)} L${q1(tx)},${q1(ty)}`, 's-lead') + C(px, py, 3.5, 'k-lead') + T(tx + (a === 'end' ? -8 : 8), ty + 6, s, c, a), o);
}
// 다음 장면이 들어갈 자리(점선 상자). pos: above | below | left | right | {x, y, a} (지시선 끝에 라벨)
function callout(f, label, pos){
  const h = f.w / 1.6, x = f.x - f.w / 2, y = f.y - h / 2, rx = Math.min(14, f.w / 8);
  let s = R(x, y, f.w, h, 'co-box', {rx}) + R(x, y, f.w, h, 'co-ring', {rx});
  // 아주 작은 상자는 도면의 '상세 원'을 함께 그려 눈에 띄게
  let bx = x, by = y, bw = f.w, bh = h;
  if (f.w < 40){ const r = 44; s += C(f.x, f.y, r, 'co-detail'); bx = f.x - r; by = f.y - r; bw = bh = 2 * r; }
  if (pos && typeof pos === 'object'){
    const ang = Math.atan2(pos.y - f.y, pos.x - f.x), r0 = f.w < 40 ? 44 : Math.hypot(f.w, h) / 2;
    s += P(`M${q1(f.x + Math.cos(ang) * r0)},${q1(f.y + Math.sin(ang) * r0)} L${q1(pos.x)},${q1(pos.y)}`, 'co-lead');
    s += T(pos.x + (pos.a === 'end' ? -8 : 8), pos.y + 7, label, 't-co', pos.a || 'start');
  } else if (pos === 'below') s += T(f.x, by + bh + 28, label, 't-co');
  else if (pos === 'left') s += T(bx - 14, f.y + 7, label, 't-co', 'end');
  else if (pos === 'right') s += T(bx + bw + 14, f.y + 7, label, 't-co', 'start');
  else s += T(f.x, by - 12, label, 't-co');
  return `<g class="callout" data-go="next">${s}</g>`;
}
function rng(seed){ let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; }
const ISO_C = Math.cos(Math.PI / 6);
function iso(ox, oy, s, zs){ return (x, y, z = 0) => [ox + (x - y) * ISO_C * s, oy + (x + y) * 0.5 * s - z * zs]; }
function isoBox(Pj, x0, y0, x1, y1, z0, z1, cT, cL, cR, o){
  const top = [Pj(x0, y0, z1), Pj(x1, y0, z1), Pj(x1, y1, z1), Pj(x0, y1, z1)];
  const fl = [Pj(x0, y1, z1), Pj(x1, y1, z1), Pj(x1, y1, z0), Pj(x0, y1, z0)];
  const fr = [Pj(x1, y0, z1), Pj(x1, y1, z1), Pj(x1, y1, z0), Pj(x1, y0, z0)];
  return G(PG(fl, cL) + PG(fr, cR) + PG(top, cT), o);
}
function h(tag, cls, html){ const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

/* ---------------- 2. 장면 ---------------- */
// 단면 장면의 층은 장면 틀(0~1600) 밖까지 그린다 → 넓은 화면·발표 모드에서도 끊기지 않는다.
// 다른 장면의 초점 상자 안에 작게 들어갈 때는 틀 크기로 잘라 보인다 (renderCamera의 clip).
const XL = -1000, XR = 2600, XW = XR - XL;
const CHAPS = ['AI', '서버', 'HBM 역할', 'CoWoS 실장', '출하', '스택 웨이퍼', '적층', '후면 범프', '전면·캐리어', 'DRAM'];
const PROC = ['DRAM 웨이퍼', '전면 범프', '캐리어 본딩', '후면 범프', '적층·몰드', '웨이퍼 테스트', '다이싱', '출하', 'CoWoS 실장', '서버·AI'];

/* 장면 1 — AI 데이터센터 (위에서 본 랙 열), 화면 폭 12 m */
function drawAI(){
  let s = R(60, 130, 1480, 830, 'f-floor', {rx: 18});
  const aisles = [[90, 'cold'], [410, 'hot'], [730, 'cold'], [1050, 'hot'], [1370, 'cold']];
  for (const [x, k] of aisles){
    s += R(x, 140, 160, 810, k === 'cold' ? 'f-cold' : 'f-hot', tip(k === 'cold' ? '찬 공기 통로\n서버 앞면으로 냉기를 넣는다' : '더운 공기 통로\n서버 뒤로 나온 열을 모아 뺀다'));
    s += LB(T(x + 80, 950, k === 'cold' ? '찬 공기' : '더운 공기', 't-dim'));
  }
  const rnd = rng(11);
  const rows = [250, 570, 890, 1210];
  rows.forEach((rx, ri) => {
    for (let k = 0; k < 10; k++){
      const y = 150 + k * 78, hot = ri === 1 && k === 5, load = 0.3 + rnd() * 0.7;
      const front = ri % 2 === 0 ? rx + 10 : rx + 150;
      let g = R(rx + 3, y + 3, 154, 72, hot ? 'f-rackhot' : 'f-rack', {rx: 4});
      if (!hot) g += R(rx + 22, y + 32, 116 * load, 10, 'k-led', {rx: 3, opacity: (0.15 + load * 0.35).toFixed(2)});
      for (let d = 0; d < 6; d++) g += C(front, y + 14 + d * 10, 2.3, d % 3 === 0 ? 'k-led2' : 'k-led');
      s += G(g, tip('AI 서버 랙\nGPU 서버 여러 대 · 랙 하나에 수십 kW (대략)'));
    }
  });
  // 초점 랙: 뚜껑을 연 서버 (다음 장면을 1/15로 줄인 모습)
  const m2 = (X, Y) => [650 + (X - 800) / 15, 579 + (Y - 500) / 15];
  let ch = '';
  let [a, b] = m2(50, 50); ch += R(a, b, 100, 60, 'f-chassis', {rx: 2});
  [a, b] = m2(810, 70); ch += R(a, b, 44, 57.3, 'f-board');
  for (const mx of [830, 1190]) for (const my of [90, 290, 490, 690]){ [a, b] = m2(mx, my); ch += R(a, b, 18, 10.7, 'f-module'); }
  for (const cy of [220, 650]){ [a, b] = m2(365, cy); ch += R(a, b, 8.7, 8.7, 'f-cpu'); }
  s += G(ch, tip('뚜껑을 연 AI 서버 한 대'));
  // 크기 비교: 사람
  s += G(C(170, 880, 13, 'k-acc2') + LB(T(170, 916, '사람', 't-dim')), tip('크기 비교: 사람 어깨 폭 ≈ 0.5 m'));
  s += LB(L(253, 141, 407, 141, 's-edge') + T(330, 136, '랙 깊이 ≈ 1.2 m', 't-dim'));
  // AI 답변 패널 + 토큰 흐름
  s += R(280, 16, 1040, 96, 'f-part', {rx: 14});
  s += T(310, 50, '질문 ▸ HBM은 왜 필요해?', 't-sub', 'start');
  s += `<clipPath id="jzc-type"><rect x="300" y="60" width="0" height="46"><animate attributeName="width" values="0;1010;1010" keyTimes="0;0.72;1" dur="7s" repeatCount="indefinite"/></rect></clipPath>`;
  s += G(T(310, 92, 'AI ▸ 토큰 하나를 만들 때마다 수백 GB의 가중치를 메모리에서 읽어야 해서…', 't-lbl', 'start'), {'clip-path': 'url(#jzc-type)'});
  const ax = [170, 490, 810, 1130, 1450];
  for (let k = 0; k < 14; k++){
    const x = ax[k % 5], y0 = 300 + ((k * 7) % 9) * 70, d = (k * 0.29).toFixed(2);
    s += `<circle r="5" class="k-acc"><animateMotion dur="3s" begin="-${d}s" repeatCount="indefinite" path="M${x},${y0} L${x},116"/><animate attributeName="opacity" values="0;1;1;0" dur="3s" begin="-${d}s" repeatCount="indefinite"/></circle>`;
  }
  s += callout({x: 650, y: 579, w: 106.7}, '서버 한 대 →');
  return s;
}

/* GPU 패키지를 위에서 본 모습 (장면 3 좌표). map 함수로 줄여서 장면 2에도 그린다 */
function pkgTop(map, k, p){
  const r = (x, y, w, hh, c, o) => { const [a, b] = map(x, y); return R(a, b, w * k, hh * k, c, o); };
  const rows = p.stacks === 6 ? [217, 412, 607] : [120, 315, 510, 705];
  let s = r(64, -60, 1472, 1120, 'f-sub', {rx: 18 * k});
  s += r(272, 100, 1056, 800, 'f-ipz', {rx: 6 * k});
  s += r(496, 180, 296, 640, 'f-gpu', {rx: 4 * k}) + r(808, 180, 296, 640, 'f-gpu', {rx: 4 * k});
  for (const x of [288, 1136]) for (const y of rows){ s += r(x, y, 176, 176, 'f-hbm', {rx: 6 * k}) + r(x + 12, y + 12, 152, 152, 'f-hbmtop', {rx: 3 * k}); }
  return s;
}

/* 장면 2 — AI 서버 내부, 화면 폭 0.8 m */
function drawServer(){
  let s = R(50, 50, 1500, 900, 'f-chassis', {rx: 16});
  for (let k = 0; k < 8; k++) s += R(70, 80 + k * 54, 112, 46, 'f-part', Object.assign({rx: 4}, tip('SSD — 모델·데이터 저장')));
  for (let k = 0; k < 2; k++) s += R(70, 545 + k * 175, 122, 150, 'f-part', Object.assign({rx: 6}, tip('네트워크 카드 — 다른 서버와 연결 (수백 Gb/s급)')));
  for (let k = 0; k < 6; k++){
    const cx = 262, cy = 125 + k * 140;
    let f = C(cx, cy, 36, 'f-fan');
    for (let b = 0; b < 4; b++){ const a = b * Math.PI / 2; f += P(`M${cx},${cy} q${q1(26 * Math.cos(a) - 12 * Math.sin(a))},${q1(26 * Math.sin(a) + 12 * Math.cos(a))} ${q1(30 * Math.cos(a))},${q1(30 * Math.sin(a))}`, 's-edge'); }
    s += G(f, tip('냉각 팬 — 8-GPU 서버 한 대가 10 kW 안팎을 쓴다 (대략)'));
  }
  for (const cy of [220, 650]){
    s += R(365, cy, 130, 130, 'f-cpu', Object.assign({rx: 6}, tip('CPU — 데이터 준비·작업 관리')));
    for (let k = 0; k < 8; k++) s += R(522 + k * 28, cy - 70, 12, 270, 'f-dimm', Object.assign({rx: 2}, tip('DDR5 메모리 — 용량은 크지만 대역폭은 HBM보다 한참 낮다')));
  }
  s += R(810, 70, 660, 860, 'f-board', {rx: 10});
  for (const mx of [830, 1190]) for (const my of [90, 290, 490, 690]){
    const cx = mx + 135, cy = my + 80;
    s += G(R(mx, my, 270, 160, 'f-module', {rx: 8}) + pkgTop((X, Y) => [cx + (X - 800) / 8, cy + (Y - 500) / 8], 1 / 8, {stacks: 8}),
      tip('GPU 가속기 모듈\n패키지 안에 GPU 칩과 HBM 스택'));
  }
  for (const cy of [170, 370, 570, 770]) s += R(1117, cy - 28, 56, 56, 'f-sw', Object.assign({rx: 6}, tip('GPU 간 스위치 — 8개 GPU를 고속으로 묶어 한 덩어리처럼')));
  s += P('M1145,120 L1145,820', 'flowline');
  for (let k = 0; k < 4; k++) s += R(1484, 100 + k * 205, 52, 170, 'f-psu', Object.assign({rx: 6}, tip('전원 공급 장치')));
  s += LB(T(60, 36, '앞면 ▸ SSD·네트워크', 't-sub', 'start') + T(1540, 36, '뒷면 ▸ 전원', 't-sub', 'end'));
  s += LB(T(262, 985, '냉각 팬', 't-dim') + T(430, 985, 'CPU ×2', 't-dim') + T(620, 985, 'DDR5 메모리', 't-dim') + T(1140, 985, 'GPU 8개 + GPU 간 스위치', 't-dim'));
  s += callout({x: 965, y: 570, w: 200}, 'GPU 패키지 →');
  return s;
}

/* 장면 3 — GPU 패키지 위에서 본 모습 (HBM의 역할), 화면 폭 100 mm */
const GENS = {HBM3: {pins: 1024, gbps: 6.4}, HBM3E: {pins: 1024, gbps: 9.6}, HBM4: {pins: 2048, gbps: 8.0}};
function drawRole(p){
  const ident = (X, Y) => [X, Y];
  let s = pkgTop(ident, 1, p);
  // 마우스 영역은 아래(큰 것)부터: 기판 → 인터포저 → GPU → HBM
  s += R(64, -60, 1472, 1120, 'hit', Object.assign({rx: 18}, tip('패키지 기판 — 칩의 신호·전원을 서버 보드로 넓혀 준다')));
  s += R(272, 100, 1056, 800, 'hit', Object.assign({rx: 6}, tip('실리콘 인터포저 — 칩 사이를 잇는 미세 배선이 있는 실리콘 판')));
  for (let x = 496 + 37; x < 1104; x += 37) s += L(x, 180, x, 820, 'f-gpugrid');
  for (let y = 180 + 40; y < 820; y += 40) s += L(496, y, 1104, y, 'f-gpugrid');
  s += LB(T(800, 510, 'GPU 칩', 't-big'));
  s += R(496, 180, 608, 640, 'hit', Object.assign({rx: 4}, tip('GPU 칩 — 계산 담당 (다이 2개를 붙인 예)')));
  const rows = p.stacks === 6 ? [217, 412, 607] : [120, 315, 510, 705];
  const g = GENS[p.gen], n = g.pins === 2048 ? 32 : 16;
  for (const x of [288, 1136]) for (const y of rows){
    const x1 = x < 800 ? 464 : 1104, x2 = x < 800 ? 496 : 1136;
    for (let i = 0; i < n; i++){ const yy = y + 14 + (148 * i) / (n - 1); s += L(x1, yy, x2, yy, 'lane'); }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) s += R(x + 22 + i * 8, y + 22 + j * 8, 6, 6, 'f-chip-id');
    s += LB(T(x + 88, y + 152, 'HBM', 't-sub'));
    s += R(x, y, 176, 176, 'hit', Object.assign({rx: 6}, tip(`HBM 스택 (${p.gen})\n데이터선 ${g.pins.toLocaleString()}개 × ${g.gbps} Gb/s`)));
  }
  const bw = g.pins * g.gbps / 8;
  s += LB(T(1224, 80, `스택당 ≈ ${bw >= 1000 ? (bw / 1000).toFixed(1) + ' TB/s' : Math.round(bw) + ' GB/s'} · ${g.pins.toLocaleString()}선`, 't-acc'));
  s += LB(T(376, 80, `HBM ×${p.stacks}`, 't-acc'));
  // 패키지 밖 DDR
  s += P('M272,500 L96,500', 's-acc2') + PG([[80, 500], [98, 490], [98, 510]], 'k-acc2');
  s += LB(T(176, 470, 'CPU 메모리(DDR5)', 't-sub') + T(176, 540, '패키지 밖 수십 cm', 't-dim'));
  // 단면 A–A′
  const cy = p.stacks === 6 ? 500 : 403;
  s += P(`M990,${cy} L1404,${cy}`, 's-acc', {'stroke-dasharray': '10 6'});
  s += LB(T(976, cy + 8, 'A', 't-co', 'end') + T(1418, cy + 8, 'A′', 't-co', 'start'));
  s += callout({x: 1180, y: cy, w: 480}, '단면 A–A′ →');
  return s;
}

/* 장면 4 — CoWoS 단면, 화면 폭 30 mm (얇은 층 과장). 상태 1~5 = 조립 단계
   단면 A–A′는 오른쪽 GPU 다이와 오른쪽 HBM을 지난다 → 왼쪽으로는 GPU·인터포저가 계속 이어진다 */
function drawCowos(){
  const SUBR = 1990;                       // 기판 오른쪽 끝 (리드 벽 바깥)
  let s = '';
  // 보드 + BGA (5)
  let b = R(XL, 812, XW, 88, 'f-pcb') + LB(T(800, 870, '서버 모듈 보드', 't-sub'));
  for (let x = -1050; x < SUBR - 20; x += 110) b += C(x, 790, 21, 'f-ball');
  s += G(b, Object.assign(st('5'), {'data-hlk': '5'}, tip('BGA 볼 — 패키지를 보드에 붙이는 큰 땜납 볼 (피치 ≈ 1 mm, 대략)')));
  // 기판 (4)
  let sb = R(XL, 600, SUBR - XL, 168, 'f-sub');
  for (const y of [628, 656, 684, 712, 740]) sb += L(XL, y, SUBR, y, 's-faint');
  for (let x = -990; x < SUBR; x += 180) sb += L(x, 600, x, 768, 's-faint');
  sb += LB(T(1400, 694, '패키지 기판', 't-sub'));
  s += G(sb, Object.assign(st('4 5'), {'data-hlk': '4'}, tip('패키지 기판 — 여러 층의 배선으로 신호·전원을 보드로')));
  // C4 (3)
  let c4 = '';
  for (let x = -1010; x <= 1230; x += 70) c4 += C(x, 585, 14, 'f-ball');
  s += G(c4, Object.assign(st('3 4 5'), {'data-hlk': '3'}, tip('C4 범프 — 인터포저와 기판을 잇는 범프 (피치 100~200 µm, 대략)')));
  // 인터포저 (1) + TSV (3)
  let ip = R(XL, 500, 1250 - XL, 70, 'f-ipz');
  for (let k = 0; k < 4; k++) ip += L(XL, 504 + k * 4, 1250, 504 + k * 4, 's-faint');
  s += G(ip, Object.assign(st('1 2 3 4 5'), tip('실리콘 인터포저 — 위쪽 RDL 배선으로 HBM과 GPU를 잇는다')));
  let itsv = '';
  for (let x = -1050; x < 1250; x += 140) itsv += R(x - 4, 514, 8, 56, 'f-cu');
  s += G(itsv, Object.assign(st('3 4 5'), {'data-hlk': '3'}));
  // 마이크로범프 (1)
  let mb = '';
  for (let x = -1010; x <= 545; x += 30) mb += R(x - 9, 478, 18, 22, 'f-sn', {rx: 4});
  for (let x = 640; x <= 1190; x += 30) mb += R(x - 9, 478, 18, 22, 'f-sn', {rx: 4});
  s += G(mb, Object.assign(st('1 2 3 4 5'), {'data-hlk': '1'}, tip('마이크로범프 — HBM·GPU를 인터포저에 붙인다 (피치 수십 µm)')));
  // 언더필 (2)
  s += G(PG([[XL, 478], [560, 478], [585, 500], [XL, 500]], 'f-uf') + PG([[620, 478], [1207, 478], [1232, 500], [598, 500]], 'f-uf'),
    Object.assign(st('2 3 4 5'), {'data-hlk': '2'}, tip('언더필 — 범프 사이를 채워 기계적으로 보강')));
  // GPU 다이
  let gp = R(XL, 170, 560 - XL, 308, 'f-gpu');
  for (let x = -988; x < 560; x += 36) gp += L(x, 172, x, 460, 'f-gpugrid');
  gp += R(XL, 462, 560 - XL, 16, 'f-sid') + LB(T(290, 330, 'GPU 칩', 't-big'));
  s += G(gp, Object.assign(st('1 2 3 4 5'), {'data-hlk': '1'}, tip('GPU 칩 (단면의 일부)')));
  // HBM 스택
  let hb = R(620, 170, 587, 308, 'f-mold') + R(636, 440, 555, 36, 'f-base');
  for (let k = 0; k < 12; k++) hb += R(652, 418 - k * 19.6, 523, 15, 'f-core');
  for (const x of [760, 880, 1000, 1120]){
    hb += L(x, 200, x, 476, 'tsvline');
    for (let k = 0; k < 12; k++) hb += C(x, 436 - k * 19.6, 3, 'k-e');
  }
  hb += LB(T(913, 193, 'HBM — 베이스 + 코어 12단', 't-sub'));
  s += G(hb, Object.assign(st('1 2 3 4 5'), {'data-hlk': '1'}, tip('HBM 스택 — 코어 다이(DRAM) 12단 + 베이스 다이, TSV로 연결')));
  // HBM ↔ GPU 경로
  s += G(P('M668,486 L668,509 L520,509 L520,486', 'glowpath') + LB(T(330, 552, 'HBM ↔ GPU 연결: 인터포저 배선 수 mm', 't-dim')), st('1 2 3 4 5'));
  // TIM + 리드 (4)
  s += G(R(XL, 152, 1207 - XL, 18, 'f-tim') + P(`M${XL},90 L1600,90 L1600,600 L1530,600 L1530,152 L${XL},152 Z`, 'f-lid') + LB(T(760, 130, '리드 (덮개·방열)', 't-sub')),
    Object.assign(st('4 5'), {'data-hlk': '4'}, tip('리드와 열전달재(TIM) — 칩의 열을 위로 빼낸다')));
  // 오른쪽 라벨
  s += G(lead(1100, 161, 1290, 214, '열전달재 (TIM)'), st('4 5'));
  s += lead(1207, 300, 1290, 290, 'HBM 스택');
  s += lead(1190, 489, 1290, 364, '마이크로범프');
  s += lead(1246, 532, 1290, 436, '인터포저 (RDL·TSV)');
  s += G(lead(1230, 585, 1290, 512, 'C4 범프'), st('3 4 5'));
  s += G(lead(1480, 790, 1356, 742, 'BGA', 'end'), st('5'));
  s += callout({x: 913, y: 324, w: 600}, '◀◀ 이 HBM의 출하 순간', 'below');
  return s;
}

/* 장면 5 — 출하되는 HBM 큐브 (KGSD), 화면 폭 30 mm (높이 과장) */
function drawShip(){
  let s = '';
  const Pj = iso(800, 300, 36, 180);           // z: mm → 180 u (두께 과장)
  const lift = 0.28, Hh = 0.72;
  const rnd = rng(5);
  // 트레이 포켓과 이웃 큐브 (뒤에서 앞으로)
  const cells = [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) cells.push([i, j]);
  cells.sort((p, q) => (p[0] + p[1]) - (q[0] + q[1]));
  for (const [i, j] of cells){
    const ox = i * 14, oy = j * 14;
    s += PG([Pj(ox - 1.2, oy - 1.2, -0.05), Pj(ox + 12.2, oy - 1.2, -0.05), Pj(ox + 12.2, oy + 12.2, -0.05), Pj(ox - 1.2, oy + 12.2, -0.05)], 'f-tray');
    if (i === 0 && j === 0){
      s += PG([Pj(-0.4, -0.4, 0), Pj(11.4, -0.4, 0), Pj(11.4, 11.4, 0), Pj(-0.4, 11.4, 0)], 'f-hole', {opacity: 0.5});
      continue;
    }
    s += isoBox(Pj, ox, oy, ox + 11, oy + 11, 0, Hh, 'f-hbmtop', 'f-coreL', 'f-coreR', {opacity: 0.55});
  }
  // 들어 올린 큐브
  const z0 = lift, z1 = lift + Hh;
  s += isoBox(Pj, 0, 0, 11, 11, z0, z1, 'f-hbm', 'f-coreL', 'f-coreR', tip('HBM 스택 (KGSD)\n가로·세로 1 cm 남짓 · 높이 1 mm 미만'));
  // 옆면 층 줄무늬: 베이스 + 코어 12단
  const zs = [0.11];
  for (let k = 1; k <= 12; k++) zs.push(0.11 + k * 0.047);
  for (const z of zs){
    const a = Pj(0, 11, z0 + z), b = Pj(11, 11, z0 + z), c = Pj(11, 0, z0 + z);
    s += P(`M${q1(a[0])},${q1(a[1])} L${q1(b[0])},${q1(b[1])} L${q1(c[0])},${q1(c[1])}`, z === 0.11 ? 's-acc' : 's-faint');
  }
  // 윗면: 맨 위 코어 다이 + ID
  s += PG([Pj(0.6, 0.6, z1), Pj(10.4, 0.6, z1), Pj(10.4, 10.4, z1), Pj(0.6, 10.4, z1)], 'f-hbmtop');
  let id = '';
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++){
    if (rnd() < 0.5 && !(i === 0 || j === 0 || i === 6 || j === 6) ) continue;
    const x = 1.3 + i * 0.32, y = 1.3 + j * 0.32;
    id += PG([Pj(x, y, z1), Pj(x + 0.27, y, z1), Pj(x + 0.27, y + 0.27, z1), Pj(x, y + 0.27, z1)], 'f-chip-id');
  }
  s += G(id, tip('ID 마킹 (예시)\nLOT A1B2 · WAFER 07 · SITE (12, 08)\n12단 · 적층 #3 · 몰드 #1 · 테스트 BIN 1'));
  // 그림자
  const sh = [Pj(0.3, 0.3, 0), Pj(11.3, 0.3, 0), Pj(11.3, 11.3, 0), Pj(0.3, 11.3, 0)];
  s = PG(sh, 'f-hole', {opacity: 0.35}) + s;
  // 검사 라벨
  const idc = Pj(2.2, 2.2, z1), lf = Pj(1.5, 11, z0 + 0.5), rf = Pj(11, 5.5, z0 + 0.35), corner = Pj(11, 11, z1);
  s += lead(idc[0], idc[1], 470, 150, '◀◀ ID → LOT · 웨이퍼 · 좌표', 'end', 't-acc');
  s += lead(lf[0], lf[1], 330, 330, '전기 테스트 — 속도·기능', 'end');
  s += lead(rf[0], rf[1], 1210, 820, '외관 — 범프·몰드 결함');
  s += lead(corner[0], corner[1], 1210, 640, '높이·휨 (평탄도)');
  // 치수선 — 앞-왼쪽 모서리와 나란히, 글자도 모서리 방향으로
  const a0 = Pj(0, 11.5, z0), a1 = Pj(11, 11.5, z0), d0 = Pj(0, 12.9, z0), d1 = Pj(11, 12.9, z0);
  const mx = (d0[0] + d1[0]) / 2 - 14, my = (d0[1] + d1[1]) / 2 + 26, ang = Math.atan2(d1[1] - d0[1], d1[0] - d0[0]) * 180 / Math.PI;
  s += LB(L(a0[0], a0[1], d0[0] - 4, d0[1] + 7, 's-edge') + L(a1[0], a1[1], d1[0] - 4, d1[1] + 7, 's-edge') + L(d0[0], d0[1], d1[0], d1[1], 's-acc2') +
    T(mx, my, '≈ 1 cm 남짓', 't-warn', 'middle', {transform: `rotate(${q1(ang)} ${q1(mx)} ${q1(my)})`}));
  s += LB(T(800, 965, 'KGSD — 검증된 HBM 스택 하나가 출하 단위 · 높이 < 1 mm (그림은 두께 과장)', 't-sub'));
  return s;
}

/* 장면 6 — 스택 웨이퍼, 화면 폭 520 mm. 상태: plain / map / analysis / dice */
const WAFER = {k: 1600 / 520, pitch: 12, size: 11};
const SITE = {c: 12, r: 8};
function siteXY(c, r){ const pk = WAFER.pitch * WAFER.k; return [800 + (c - 12.5) * pk, 500 + (r - 12.5) * pk]; }
function waferSites(pattern){
  const k = WAFER.k, Rw = 150 * k, edge = (150 - 3) * k, pk = WAFER.pitch * k, half = WAFER.size * k / 2;
  const rnd = rng({edge: 3, local: 17, random: 29}[pattern] || 3);
  const out = [];
  for (let c = 0; c < 26; c++) for (let r = 0; r < 26; r++){
    const [x, y] = siteXY(c, r);
    const far = Math.hypot(Math.abs(x - 800) + half, Math.abs(y - 500) + half);
    if (far > edge) continue;
    const d = Math.hypot(x - 800, y - 500) / Rw;
    let pf = 0.03;
    if (pattern === 'edge') pf = d > 0.8 ? 0.34 : 0.018;
    else if (pattern === 'local') pf = Math.hypot(c - 6.5, r - 7.5) < 3.3 ? 0.62 : 0.015;
    else pf = 0.05;
    let ng = rnd() < pf;
    if (c === SITE.c && r === SITE.r) ng = false;
    out.push({c, r, x, y, ng});
  }
  return out;
}
function drawWafer(p){
  const k = WAFER.k, Rw = 150 * k, sz = WAFER.size * k;
  let s = C(800, 500, Rw, 'f-car') + C(800, 500, Rw - 5, 'f-mold');
  s += PG([[791, 500 + Rw + 1], [800, 500 + Rw - 13], [809, 500 + Rw + 1]], 'f-hole');
  const sites = waferSites(p.pattern);
  p.stats = {total: sites.length, fail: sites.filter(x => x.ng).length};
  // 프로버가 지그재그로 한 칸씩 찍어 가는 순서대로 색이 바뀐다 (plain → map)
  const probe = sites.slice().sort((a, b) => a.r - b.r || (a.r % 2 ? b.c - a.c : a.c - b.c));
  probe.forEach((t, n) => { t.d = Math.round(n / probe.length * 1600); });
  let g = '';
  for (const t of sites){
    g += R(t.x - sz / 2, t.y - sz / 2, sz, sz, 'site', {rx: 3, 'data-s': t.ng ? 'ng' : 'ok', style: `transition-delay:${t.d}ms`, 'data-tip': `SITE (${t.c}, ${String(t.r).padStart(2, '0')}) · ${t.ng ? '✗ 불합격' : '✓ 합격'} (예시)`});
  }
  s += g;
  let xs = '';
  for (const t of sites) if (t.ng) xs += P(`M${q1(t.x - 9)},${q1(t.y - 9)} L${q1(t.x + 9)},${q1(t.y + 9)} M${q1(t.x + 9)},${q1(t.y - 9)} L${q1(t.x - 9)},${q1(t.y + 9)}`, 's-ng');
  s += G(xs, st('analysis'));
  // 다이싱 길
  let streets = '';
  const pk = WAFER.pitch * k;
  for (let i = 0; i <= 26; i++){
    const v = 800 + (i - 13) * pk;
    const dx = Math.abs(v - 800);
    if (dx < Rw - 8){ const hh = Math.sqrt(Rw * Rw - dx * dx) - 8; streets += L(v, 500 - hh, v, 500 + hh, 'street'); }
    const w = 500 + (i - 13) * pk, dy = Math.abs(w - 500);
    if (dy < Rw - 8){ const hw = Math.sqrt(Rw * Rw - dy * dy) - 8; streets += L(800 - hw, w, 800 + hw, w, 'street'); }
  }
  s += G(streets, st('dice'));
  // 프로브 카드
  let pc = R(1290, 70, 240, 120, 'f-part', {rx: 12});
  for (let i = 0; i < 12; i++) pc += L(1314 + i * 18, 190, 1318 + i * 18, 214, 's-edge');
  pc += LB(T(1410, 246, '프로브 카드 — 웨이퍼 테스트', 't-dim'));
  s += G(pc, st('map analysis'));
  // 블레이드
  s += G(C(170, 160, 70, 'f-part') + C(170, 160, 12, 'k-acc') + LB(T(170, 262, '블레이드 / 레이저로 절단', 't-dim')), st('dice'));
  // 분석 콜아웃
  const ng = sites.filter(x => x.ng).sort((a, b) => b.x - a.x)[0];
  if (ng){
    s += G(C(ng.x, ng.y, 26, 's-acc2') + lead(ng.x + 26, ng.y, 1330, 560, '분석 요청 (예시)', 'start', 't-warn') +
      LB(T(1338, 600, 'X-ray → 범프 접합·void', 't-sub', 'start') + T(1338, 632, '초음파(SAT) → 박리', 't-sub', 'start') + T(1338, 664, '단면 FIB·SEM → 계면·IMC', 't-sub', 'start')), st('analysis'));
  }
  // 그 큐브의 자리
  const [sx, sy] = siteXY(SITE.c, SITE.r);
  s += R(sx - sz / 2 - 5, sy - sz / 2 - 5, sz + 10, sz + 10, 'k-me', {rx: 5});
  s += LB(T(sx, sy - sz / 2 - 14, '(12, 08) 그 큐브', 't-acc'));
  s += LB(T(800, 24, '300 mm 스택 웨이퍼 — 위에서 본 모습 (몰드 아래 스택 수백 개)', 't-sub'));
  s += callout({x: sx, y: sy, w: 49.2}, '스택 하나 →', 'below');
  return s;
}

/* 장면 7 — 적층 (아이소메트릭 분해도), 화면 폭 16 mm. 상태: assembled / exploded */
function stackGeom(N, exploded){
  // 조립: 다이 16, 접합부 6 / 분해: 다이 14, 간격 18 (z 단위 = 화면 단위, 두께 과장)
  const g = exploded ? 18 : 6, dz = exploded ? 14 : 16, base = 26;
  const zTop = base + g + (N - 1) * (dz + g) + dz;
  const oy = 302 + zTop / 2;
  return {g, dz, base, zTop, oy, Pj: iso(800, oy, 36, 1), zOf: k => base + g + k * (dz + g)};
}
const CUT = 5.5, TSV_AT = [6.1, 6.7, 7.3, 7.9];   // 앞쪽 1/4을 잘라 낸 절단면 위치, 절단면 위 TSV 자리 (mm)
/* 조립된 스택 — 앞쪽 모서리 1/4을 잘라 낸 아이소메트릭 절단도 */
function drawStackCut(N){
  const sg = stackGeom(N, false), Pj = sg.Pj, c = CUT;
  const poly = (pts, cls, o) => PG(pts.map(q => Pj(q[0], q[1], q[2])), cls, o);
  // 한 층: 바깥 두 면, 절단 두 면, L자 윗면 (그리는 순서 = 뒤에서 앞)
  const slab = (a0, a1, z0, z1, cls, o) => G(
    poly([[a0, a1, z1], [c, a1, z1], [c, a1, z0], [a0, a1, z0]], cls[1]) +
    poly([[a1, a0, z1], [a1, c, z1], [a1, c, z0], [a1, a0, z0]], cls[2]) +
    poly([[c, c, z1], [c, a1, z1], [c, a1, z0], [c, c, z0]], cls[3]) +
    poly([[c, c, z1], [a1, c, z1], [a1, c, z0], [c, c, z0]], cls[4]) +
    poly([[a0, a0, z1], [a1, a0, z1], [a1, c, z1], [c, c, z1], [c, a1, z1], [a0, a1, z1]], cls[0]), o);
  // 절단면 위의 띠 (TSV, 범프): 면 x = c 에서는 y 방향, 면 y = c 에서는 x 방향
  const band = (t, w, z0, z1, cls) =>
    poly([[c, t - w, z1], [c, t + w, z1], [c, t + w, z0], [c, t - w, z0]], cls) +
    poly([[t - w, c, z1], [t + w, c, z1], [t + w, c, z0], [t - w, c, z0]], cls);
  const DIE = ['f-core', 'f-coreL', 'f-coreR', 'f-cutR', 'f-cutL'];
  const GAP = ['f-mufT', 'f-muf', 'f-muf', 'f-muf', 'f-muf'];
  let s = slab(0, 11, 0, sg.base, ['f-base', 'f-baseS', 'f-baseS', 'f-baseC', 'f-baseC'], tip('베이스 다이 — 로직·인터페이스\n(HBM4부터 파운드리 로직 공정을 쓰는 사례)'));
  s += G(TSV_AT.map(t => band(t, 0.11, 2, sg.base, 'f-cu')).join(''));
  for (let k = 0; k < N; k++){
    const z = sg.zOf(k), zg = z - sg.g;
    // 접합부: 채움재 + 마이크로범프 (아래 다이 후면 패드 → 솔더 → 위 다이 Cu 기둥)
    let jn = slab(0.15, 10.85, zg, z, GAP);
    jn += TSV_AT.map(t => band(t, 0.24, zg, zg + 1.2, 'f-ni') + band(t, 0.24, zg + 1.2, zg + 3.4, 'f-sn') + band(t, 0.2, zg + 3.4, z, 'f-cu')).join('');
    s += G(jn, tip('접합부 — 마이크로범프 + 빈틈 채움재\n(MR-MUF는 몰드, TC-NCF는 필름으로 채운다)'));
    s += slab(0.3, 10.7, z, z + sg.dz, DIE, tip(`코어 다이 #${k + 1} (DRAM)\n두께 수십 µm · TSV 수천 개`));
    s += G(TSV_AT.map(t => band(t, 0.11, z, z + sg.dz, 'f-cu')).join(''), tip('TSV — 다이를 관통한 Cu 기둥'));
  }
  // 몰드: 바깥을 반투명 껍질로
  const zm = sg.zTop + 3;
  s += G(poly([[0, 11, zm], [c, 11, zm], [c, 11, sg.base], [0, 11, sg.base]], 'f-moldT') + poly([[11, 0, zm], [11, c, zm], [11, c, sg.base], [11, 0, sg.base]], 'f-moldT') +
    poly([[0, 0, zm], [11, 0, zm], [11, c, zm], [c, c, zm], [c, 11, zm], [0, 11, zm]], 'f-moldT'), tip('몰드 — 스택을 감싸 보호한다'));
  // 라벨
  const pb = Pj(11, 2.75, sg.base / 2), pt = Pj(11, 2.75, sg.zTop - sg.dz / 2), pv = Pj(c + 0.5, c, sg.zOf(N - 2) + sg.dz / 2), pj = Pj(TSV_AT[3], c, sg.zOf(N - 4) - sg.g / 2);
  const pm = Pj(2.75, 11, sg.zTop * 0.62);
  s += lead(pb[0], pb[1], 1240, pb[1] + 40, '베이스 다이 (로직)');
  s += lead(pt[0], pt[1], 1240, pt[1] - 60, `코어 다이 ${N}단 (DRAM)`);
  s += lead(pv[0], pv[1], 1240, pv[1] + 40, 'TSV (Cu)', 'start', 't-acc');
  s += lead(pj[0], pj[1], 1240, pj[1] + 70, '마이크로범프 + 채움재');
  s += lead(pm[0], pm[1], 360, pm[1] + 40, '몰드', 'end');
  return s;
}
/* 분해도 — 층 사이를 벌려 TSV와 범프를 보인다 */
function drawStackExploded(N){
  const sg = stackGeom(N, true), Pj = sg.Pj;
  const tsv = [[5.5, 2.5], [5.5, 4], [5.5, 5.5], [5.5, 7], [5.5, 8.5]];
  let s = isoBox(Pj, 0, 0, 11, 11, 0, sg.base, 'f-base', 'f-baseS', 'f-baseS', tip('베이스 다이 — 로직·인터페이스\n(HBM4부터 파운드리 로직 공정을 쓰는 사례)'));
  for (let k = 0; k < N; k++){
    const z = sg.zOf(k);
    for (const [x, y] of tsv){
      const a = Pj(x, y, z - sg.g), b = Pj(x, y, z);
      s += L(a[0], a[1], b[0], b[1], 'tsvline');
      s += `<ellipse cx="${q1(a[0])}" cy="${q1(a[1] - 4)}" rx="7" ry="3.5" class="f-sn"/>`;
    }
    s += isoBox(Pj, 0.3, 0.3, 10.7, 10.7, z, z + sg.dz, 'f-core', 'f-coreL', 'f-coreR', tip(`코어 다이 #${k + 1} (DRAM)\n두께 수십 µm · TSV 수천 개`));
    if (k === 0 || k === N - 1 || k % 4 === 3){
      const lp = Pj(0.3, 10.7, z + sg.dz / 2);
      s += LB(T(lp[0] - 14, lp[1] + 6, `#${k + 1}`, 't-dim', 'end'));
    }
  }
  const pb = Pj(11, 5.5, sg.base / 2), pt = Pj(11, 3, sg.zTop - 6);
  s += lead(pb[0], pb[1], 1240, pb[1] + 40, '베이스 다이 (로직)');
  s += lead(pt[0], pt[1], 1240, pt[1] - 30, `코어 다이 ${N}단 (DRAM)`);
  return s;
}
function stackFocus(N, exploded){
  const sg = stackGeom(N, !!exploded), k = Math.min(5, N - 2);
  // 다이 k와 k+1 사이 접합부 (조립: 절단면 위 범프 / 분해: TSV 줄)
  const p = exploded ? sg.Pj(5.5, 8.5, sg.zOf(k) + sg.dz + sg.g / 2) : sg.Pj(CUT, TSV_AT[1], sg.zOf(k + 1) - sg.g / 2);
  return {x: p[0], y: p[1], w: 20};
}
function drawStack(p){
  let s = G(drawStackCut(p.N), st('assembled')) + G(drawStackExploded(p.N), st('exploded'));
  const fa = stackFocus(p.N, false), fe = stackFocus(p.N, true);
  s += G(callout(fa, '범프 접합부 →', {x: 360, y: fa.y - 70, a: 'end'}), st('assembled'));
  s += G(callout(fe, 'TSV + 마이크로범프 접합부 →', {x: 380, y: fe.y + 90, a: 'end'}), st('exploded'));
  return s;
}

/* 장면 8 — 후면 공정 (캐리어 위에 뒤집힌 코어 웨이퍼), 화면 폭 200 µm. 상태 0~5 */
function drawBack(){
  const xs = [-400, 0, 400, 800, 1200, 1600, 2000];     // TSV·범프 자리 (피치 ≈ 50 µm, 예시)
  const each = f => xs.map(f).join('');
  let s = '';
  s += G(R(XL, 880, XW, 520, 'f-car') + LB(T(1580, 955, '캐리어 웨이퍼', 't-sub', 'end')), tip('캐리어 웨이퍼 — 얇아진 웨이퍼를 받치는 받침 (유리 또는 Si)'));
  s += G(R(XL, 690, XW, 190, 'f-adh') + LB(T(1580, 862, '임시 접착제', 't-sub', 'end')), tip('임시 접착제 — 후면 공정이 끝나면 떼어 낸다 (디본딩)'));
  s += G(each(x => R(x - 80, 690, 160, 80, 'f-cu') + R(x - 80, 770, 160, 16, 'f-ni') +
    P(`M${x - 80},786 L${x + 80},786 L${x + 80},800 Q${x + 80},852 ${x},852 Q${x - 80},852 ${x - 80},800 Z`, 'f-sn')),
    tip('앞면 범프 (뒤집힌 상태)\nCu 기둥 + Ni + SnAg'));
  let beol = R(XL, 640, XW, 50, 'f-beol');
  for (let x = -1080; x < XR; x += 110) beol += R(x, 652, 60, 7, 'f-metal') + R(x + 40, 670, 50, 7, 'f-metal');
  s += G(beol, tip('회로층(BEOL) — 앞면. 지금은 아래를 보고 있다'));
  s += G(R(XL, -400, XW, 1040, 'f-si') + T(800, 150, '원래 두께 ≈ 775 µm — 화면 위로 계속', 't-sub') + P('M800,170 L800,110 M786,124 L800,110 L814,124', 's-edge'), st('0'));
  s += G(R(XL, 232, XW, 408, 'f-si') + R(240, 110, 1120, 70, 'f-part', {rx: 35}) + T(800, 154, '연삭 휠 (그라인더)', 't-sub') +
    P('M300,200 l20,18 M520,204 l14,20 M760,206 l-6,22 M1010,203 l-16,18 M1250,200 l-20,16', 's-edge'), st('1'));
  s += G(R(XL, 271, XW, 369, 'f-si'), st('2 3 4 5'));
  // TSV
  const tsv = () => each(x => R(x - 28, 255, 4, 385, 'f-ox') + R(x + 24, 255, 4, 385, 'f-ox') + R(x - 24, 255, 48, 385, 'f-cu'));
  s += G(tsv(), Object.assign(st('0 1'), {opacity: 0.5}));
  s += G(tsv(), Object.assign(st('2 3 4 5'), tip('TSV — 실리콘을 관통한 Cu 기둥 (지름 수 µm, 길이 수십 µm)')));
  s += G(each(x => R(x - 28, 251, 56, 4, 'f-ox')), st('0 1 2 3'));
  s += G(R(XL, 263, XW, 8, 'f-pas') + each(x => R(x - 36, 243, 72, 8, 'f-pas') + R(x - 36, 243, 8, 28, 'f-pas') + R(x + 28, 243, 8, 28, 'f-pas')), st('3'));
  s += G(R(XL, 255, XW, 16, 'f-pas') + each(x => R(x - 24, 255, 48, 16, 'f-cu')), st('4 5'));
  s += G(each(x => R(x - 88, 235, 176, 20, 'f-ni') + R(x - 88, 231, 176, 4, 'f-au')), Object.assign(st('5'), tip('후면 패드 — 위 다이의 범프가 여기에 붙는다')));
  s += G(lead(1224, 400, 1320, 400, 'TSV (Cu)'), st('2 3 4 5'));
  s += lead(1280, 810, 1340, 730, '앞면 범프 (뒤집힘)');
  s += lead(1590, 665, 1500, 600, '회로층', 'end');
  s += G(lead(1290, 236, 1360, 196, '후면 패드'), st('5'));
  s += callout({x: 800, y: 770, w: 480}, '◀◀ 뒤집어서 앞면으로', 'below');
  return s;
}

/* 장면 9 — 앞면 범프 도금 + 캐리어 본딩, 화면 폭 60 µm. 상태 0~8
   가운데 범프(533~1067)와 양옆 이웃 범프 (피치 ≈ 40 µm, 예시) */
function drawFront(){
  const BX = [-1067, 0, 1067];
  const each = f => BX.map(f).join('');
  let s = '';
  s += G(R(XL, 860, XW, 540, 'f-si') + each(d => R(720 + d, 820, 8, 580, 'f-ox') + R(872 + d, 820, 8, 580, 'f-ox') + R(728 + d, 820, 144, 580, 'f-cu')),
    tip('실리콘과 그 속의 TSV — 범프는 TSV 바로 위에 선다'));
  let beol = R(XL, 760, XW, 100, 'f-beol');
  for (let x = -1090; x < XR; x += 140) beol += R(x, 784, 80, 10, 'f-metal') + R(x + 50, 816, 70, 10, 'f-metal');
  beol += each(d => R(770 + d, 760, 60, 60, 'f-metal'));
  s += G(beol, tip('회로층(BEOL) — 금속 배선'));
  s += G(R(XL, 748, XW, 12, 'f-pas'), tip('보호막(패시베이션)'));
  s += G(each(d => R(600 + d, 748, 400, 12, 'f-al')), tip('패드 — 범프가 서는 금속'));
  s += G(R(XL, 742, XW, 6, 'f-cu'), st('1 2 3 4 5'));
  s += G(each(d => R(533 + d, 742, 534, 6, 'f-cu')), st('6 7 8'));
  const pr = [[XL, -534], [0, 533], [1067, 1600], [2134, XR]];      // 감광막: 범프 자리만 비운다
  s += G(pr.map(([a, b]) => R(a, 210, b - a, 532, 'f-pr')).join(''), Object.assign(st('2 3 4 5'), tip('감광막(PR) — 도금할 자리만 연 틀')));
  s += G(each(d => R(533 + d, 482, 534, 260, 'f-cu')), Object.assign(st('3 4 5 6 7 8'), tip('Cu 기둥 — 전기가 흐르는 몸통, 높이를 만든다')));
  s += G(each(d => R(533 + d, 428, 534, 54, 'f-ni')), Object.assign(st('4 5 6 7 8'), tip('Ni — 솔더와 Cu가 과하게 반응하지 않게 막는다')));
  s += G(each(d => R(533 + d, 228, 534, 200, 'f-sn')), Object.assign(st('5 6'), tip('SnAg 솔더 — 녹아서 붙는 접합재')));
  s += G(each(d => P(`M${533 + d},428 L${533 + d},330 C${533 + d},168 ${1067 + d},168 ${1067 + d},330 L${1067 + d},428 Z`, 'f-sn') + R(533 + d, 420, 534, 8, 'f-imc')),
    Object.assign(st('7 8'), tip('리플로우 후 솔더 + IMC(금속간화합물)')));
  s += G(R(XL, 160, XW, 588, 'f-adh') + R(XL, -400, XW, 560, 'f-car') + LB(T(1580, 120, '캐리어 웨이퍼', 't-sub', 'end') + T(1580, 210, '임시 접착제', 't-sub', 'end')), st('8'));
  s += G(R(1110, 300, 360, 56, 'f-part', {rx: 28}) + T(1290, 336, '★ 전해도금 (ECD)', 't-warn'), st('3 4 5'));
  s += G(lead(1067, 600, 1180, 640, 'Cu 기둥'), st('3 4 5 6 7 8'));
  s += G(lead(1067, 455, 1180, 470, 'Ni'), st('4 5 6 7 8'));
  s += G(lead(1067, 300, 1180, 230, 'SnAg 솔더'), st('5 6 7'));
  s += G(lead(1067, 424, 1180, 410, 'IMC'), st('7'));
  s += G(lead(300, 742, 260, 690, '시드층', 'end'), st('1 2'));
  s += G(lead(300, 600, 260, 560, '감광막 틀', 'end'), st('2'));
  s += lead(980, 754, 1180, 720, '패드');
  s += lead(1400, 812, 1460, 900, '회로층 (BEOL)');
  s += lead(872, 950, 960, 960, 'TSV');
  s += callout({x: 800, y: 800, w: 800}, '칩 속으로 →', 'left');
  return s;
}

/* 장면 10 — DRAM 다이 단면, 화면 폭 30 µm. 상태 t0~t5 (TSV 형성), final
   그림은 아래로 100 내려 그린다 → 앞 장면의 패드(y 748)·TSV 자리와 겹쳐 이어진다 */
function drawDie(){
  let s = '';
  s += G(T(800, 250, '(아직 배선·범프 없음)', 't-dim'), st('t0 t1 t2 t3 t4'));
  s += G(R(266, -500, 1068, 784, 'f-cu') + R(266, 284, 1068, 12, 'f-cu') + R(400, 296, 800, 24, 'f-al') + R(XL, 296, 400 - XL, 24, 'f-pas') + R(1200, 296, XR - 1200, 24, 'f-pas'),
    Object.assign(st('final'), tip('범프 바닥(Cu)과 패드 — 앞 장면에서 내려온 곳')));
  let beol = R(XL, 320, XW, 120, 'f-beol');
  for (let x = -1030; x < XR; x += 130) beol += R(x, 330, 90, 16, 'f-metal');
  for (let x = -1030; x < XR; x += 90) beol += R(x, 364, 50, 11, 'f-metal');
  for (let x = -1000; x < XR; x += 60) beol += R(x, 394, 30, 8, 'f-metal');
  for (let x = -1010; x < XR; x += 40) beol += R(x, 420, 18, 7, 'f-metal');
  s += G(beol, Object.assign(st('t5 final'), tip('금속 배선층(BEOL) — 여러 층의 Cu·Al 배선')));
  let cell = R(XL, 440, 450 - XL, 80, 'f-plate');
  for (let x = -997; x < 446; x += 5.5) cell += R(x, 446, 3, 64, 'f-cap');
  s += G(cell, tip('셀 어레이 — 커패시터가 빽빽한 숲 (다음 장면)'));
  let peri = R(1150, 440, XR - 1150, 80, 'f-beol');
  for (let x = 1170; x < XR; x += 60) peri += R(x, 498, 22, 22, 'f-w') + R(x + 8, 440, 6, 58, 'f-w');
  s += G(peri, tip('주변 회로 — 셀을 읽고 쓰는 트랜지스터'));
  s += G(R(XL, 520, XW, 800, 'f-si'), tip('실리콘 기판'));
  s += G(R(640, 440, 320, 880, 'f-hole'), st('t1'));
  s += G(R(640, 440, 320, 880, 'f-ox') + R(652, 452, 296, 868, 'f-hole'), st('t2'));
  s += G(R(640, 440, 320, 880, 'f-ox') + R(652, 452, 296, 868, 'f-ni') + R(658, 458, 284, 862, 'f-hole'), st('t3'));
  s += G(R(640, 440, 320, 880, 'f-ox') + R(652, 452, 296, 868, 'f-ni') + R(658, 458, 284, 862, 'f-cu') + R(XL, 418, XW, 22, 'f-cu') +
    R(1120, 140, 380, 56, 'f-part', {rx: 28}) + T(1310, 176, '★ 여기서도 전해도금', 't-warn'), st('t4'));
  s += G(R(640, 440, 320, 880, 'f-ox') + R(652, 452, 296, 868, 'f-ni') + R(658, 458, 284, 862, 'f-cu'),
    Object.assign(st('t5 final'), tip('TSV (via-middle) — 트랜지스터를 만든 뒤, 배선 전에 뚫어 Cu로 채운다')));
  s += G(P('M480,440 L1120,440 L1120,1320 M480,440 L480,1320', 's-acc2', {'stroke-dasharray': '10 7'}) + LB(T(1136, 940, 'KOZ — TSV 주변 소자 금지 구역', 't-dim', 'start')), st('t5 final'));
  s += G(lead(1334, 140, 1400, 120, '범프 바닥 (Cu)') + lead(1200, 308, 1420, 262, '패드·보호막'), st('final'));
  s += G(lead(1590, 380, 1500, 360, '금속 배선 (BEOL)', 'end'), st('t5 final'));
  s += lead(200, 520, 150, 640, '셀 어레이', 'start');
  s += lead(1400, 510, 1430, 640, '주변 회로');
  s += G(lead(960, 760, 1040, 820, 'TSV'), st('t4 t5 final'));
  return G(s, {transform: 'translate(0 100)'}) + callout({x: 210, y: 578, w: 106.7}, '셀 어레이 →', 'below');
}

/* 장면 11 — 커패시터 숲, 화면 폭 2 µm */
function drawCells(){
  let s = R(XL, -500, XW, 1400, 'f-plate', tip('플레이트 전극 — 모든 셀이 공유한다'));
  for (let i = -23; i < 60; i++){
    const x = 7 + i * 44;
    s += G(R(x, 34, 30, 868, 'f-cap', {rx: 13}) + R(x + 6, 34, 18, 846, 'f-capin', {rx: 8}), tip('커패시터 — 높이가 폭의 수십 배인 원통'));
    s += R(x - 2, 900, 34, 32, 'f-w');
  }
  s += R(XL, 0, XW, 34, 'f-metal', {opacity: 0.6});
  let si = R(XL, 930, XW, 500, 'f-sip');
  for (let i = -23; i < 60; i++) si += R(7 + i * 44 + 32, 944, 10, 56, 'f-w');
  s += G(si, tip('실리콘 — 속에 워드라인(게이트)이 묻혀 있다'));
  s += lead(52, 300, 140, 240, '커패시터 — 높이 ≈ 폭의 수십 배', 'start', 't-lbl');
  s += lead(1560, 500, 1440, 560, '플레이트 전극', 'end');
  s += lead(1280, 960, 1220, 880, '실리콘 속 워드라인', 'end');
  s += LB(P('M7,130 L51,130', 's-acc2') + T(29, 116, '셀 피치 수십 nm', 't-warn', 'start'));
  s += callout({x: 814, y: 915, w: 120}, '셀 하나 →');
  return s;
}

/* 장면 12 — 셀 하나 (1T1C), 화면 폭 150 nm. 상태 hold / on
   커패시터(원통) 아래 스토리지 노드 콘택 → 트랜지스터(묻힌 워드라인) → 비트라인 콘택. 양옆은 이웃 셀의 커패시터 */
function drawCell(){
  const cap = d => `M${300 + d},-400 L${300 + d},380 Q${300 + d},420 ${340 + d},420 L${660 + d},420 Q${700 + d},420 ${700 + d},380 L${700 + d},-400 L${670 + d},-400 L${670 + d},370 Q${670 + d},390 ${650 + d},390 L${350 + d},390 Q${330 + d},390 ${330 + d},370 L${330 + d},-400 Z`;
  let s = '';
  s += R(XL, -400, XW, 820, 'f-plate', tip('플레이트 전극 — 커패시터 안팎을 감싸는 공통 전극'));
  s += G([-587, 587].map(d => P(cap(d), 'f-cap') + R(330 + d, -400, 340, 790, 'f-capin')).join(''), Object.assign({opacity: 0.55}, tip('이웃 셀의 커패시터')));
  s += G(P(cap(0), 'f-cap') + R(330, -400, 340, 790, 'f-capin'), tip('커패시터 아랫부분 — 여기에 전하가 저장된다'));
  s += P('M340,-400 L340,368 Q340,382 354,382 L646,382 Q660,382 660,368 L660,-400', 's-acc2');
  let ch = '';
  for (let i = 0; i < 9; i++) ch += C(370 + i * 33, 356, 9, 'charge') + C(352, 120 + i * 26, 7, 'charge') + C(648, 120 + i * 26, 7, 'charge');
  s += G(ch, tip('저장된 전하 — 있으면 1, 없으면 0'));
  s += R(XL, 420, XW, 130, 'f-ild', tip('절연막 — 전극·배선 사이를 막는다'));
  s += G(R(940, 440, XR - 940, 50, 'f-metal') + R(1040, 490, 160, 60, 'f-w'), tip('비트라인과 콘택 — 셀의 값을 읽어 내는 길 (커패시터 아래를 지난다)'));
  s += G(R(420, 420, 160, 130, 'f-w'), tip('스토리지 노드 콘택'));
  s += R(XL, 550, XW, 850, 'f-sip', tip('실리콘 (p형)'));
  s += G(R(110, 550, 140, 270, 'f-ox') + R(1350, 550, 140, 270, 'f-ox'), tip('소자 분리(STI) — 이웃 트랜지스터와 전기적으로 떼어 놓는 절연막'));
  s += G(R(260, 550, 420, 110, 'f-n') + R(920, 550, 420, 110, 'f-n'), tip('n+ — 소스·드레인'));
  s += G(R(700, 560, 200, 440, 'f-ox') + R(714, 760, 172, 240, 'f-w') + R(714, 574, 172, 186, 'f-sid'), tip('워드라인 = 게이트 (실리콘 속에 묻힌 구조)'));
  s += G(P('M688,640 L692,948 Q800,1012 908,948 L912,640', 'chan') +
    P('M600,600 L680,600 M920,600 L1000,600', 's-acc') + PG([[1000, 590], [1018, 600], [1000, 610]], 'k-acc'), st('on'));
  s += lead(300, 250, 230, 200, '커패시터', 'end', 't-lbl');
  s += lead(420, 485, 230, 470, '스토리지 노드 콘택', 'end');
  s += lead(800, 880, 760, 990, '워드라인 (게이트)', 'end');
  s += lead(1340, 600, 1400, 700, 'n+ (소스·드레인)');
  s += lead(1500, 465, 1530, 380, '비트라인');
  s += LB(P('M300,40 L700,40', 's-edge') + P('M300,30 L300,50 M700,30 L700,50', 's-edge') + T(500, 22, '≈ 수십 nm', 't-warn'));
  return s;
}

/* ---- 단계 제목 (무대 왼쪽 위 HUD에 표시) ---- */
const TITLES = {
  cowos: {'1': '① Chip on Wafer — GPU·HBM을 인터포저에 접합', '2': '② 언더필 — 범프 사이 빈틈 채우기', '3': '③ 인터포저 박화 · TSV 노출 · C4 범프',
    '4': '④ on Substrate — 기판 접합, 열전달재(TIM)·리드', '5': '완성 — 서버 모듈 보드에 실장된 CoWoS 패키지 (단면)'},
  wafer: {plain: '테스트 전 — 몰드로 덮인 스택 수백 개', map: '웨이퍼 테스트 — 스택마다 합격·불합격 (예시 맵)', analysis: '불량 분석 — 맵 모양으로 원인 후보를 좁힌다',
    dice: '다이싱 — 스택 사이 길을 따라 하나씩 잘라 낸다'},
  stack: {assembled: '적층 완료 — 앞쪽 모서리를 잘라 낸 모습 (TSV·범프가 보인다)', exploded: '분해도 — 층마다 TSV와 마이크로범프로 연결'},
  back: {'0': '⓪ 캐리어에 붙인 직후 — 웨이퍼는 아직 두껍다', '1': '① 백그라인딩 — 뒷면을 갈아 수십 µm만 남긴다', '2': '② 실리콘 식각 — TSV 끝이 드러난다 (TSV reveal)',
    '3': '③ 절연막(SiN·SiO₂)으로 덮기', '4': '④ CMP — TSV 머리만 연다', '5': '⑤ 후면 패드 형성 (예: Ni/Au)'},
  front: {'0': '⓪ 패드가 열린 웨이퍼 (앞면이 위)', '1': '① 시드층 — 전기가 흐를 얇은 금속막', '2': '② 감광막 패턴 — 범프 자리만 연 틀', '3': '③ Cu 도금 — 기둥',
    '4': '④ Ni 도금 — 확산 방지층', '5': '⑤ SnAg 도금 — 솔더', '6': '⑥ 감광막 제거 · 시드 식각', '7': '⑦ 리플로우 — 솔더를 녹여 둥글게, 계면에 IMC',
    '8': '⑧ 캐리어 본딩 — 임시 접착제로 붙인다'},
  die: {t0: '⓪ 트랜지스터·셀 완성 직후', t1: '① 깊은 실리콘 식각 — 폭 수 µm, 깊이 수십 µm', t2: '② 절연막(라이너)', t3: '③ 배리어·시드',
    t4: '④ Cu 전해도금 — void 없이 채운다', t5: '⑤ CMP 평탄화 → 그 위에 금속 배선(BEOL)', final: 'DRAM 다이 단면 — 범프 아래 칩 속'},
  cell: {hold: '저장: 전하가 있으면 1 — 조금씩 새므로 주기적으로 다시 채운다 (리프레시)', on: '읽기·쓰기: 워드라인 ON → 채널이 열려 비트라인과 연결'}
};

/* ---- 장면 목록 ---- */
const SCENES = [
  {id: 'ai', chap: 0, name: 'AI 데이터센터', W: 12, draw: drawAI, def: null, proc: 9,
    next: {type: 'zoom', into: true, f: {x: 650, y: 579, w: 106.7}, badge: {rev: '×15 확대 · 랙 속 서버로', fwd: '×15 축소 · 데이터센터로'}}},
  {id: 'server', chap: 1, name: 'AI 서버', W: 0.8, draw: drawServer, def: null, proc: 9,
    next: {type: 'zoom', into: true, f: {x: 965, y: 570, w: 200}, badge: {rev: '×8 확대 · GPU 패키지로', fwd: '×8 축소 · 서버로'}}},
  {id: 'role', chap: 2, name: 'GPU 패키지 (위)', W: 0.1, draw: drawRole, p: {gen: 'HBM3E', stacks: 8}, def: null, proc: 9,
    next: {type: 'section', into: true, get f(){ return {x: 1180, y: SCENES[2].p.stacks === 6 ? 500 : 403, w: 480}; }, badge: {rev: '단면 A–A′ 자르기 · ×3.3', fwd: '위에서 보기 · 줌 아웃'}}},
  {id: 'cowos', chap: 3, name: 'CoWoS 단면', W: 0.03, draw: drawCowos, def: '5', proc: 8, note: '단면 개념도 — 얇은 층 과장',
    next: {type: 'rewind', into: true, f: {x: 913, y: 324, w: 600}, badge: {rev: '◀◀ 실장 전으로 되감기', fwd: '▶▶ TSMC에서 GPU 옆에 실장'}}},
  {id: 'ship', chap: 4, name: 'HBM 큐브 (출하)', W: 0.03, draw: drawShip, def: null, proc: 7, note: '두께 방향 과장',
    next: {type: 'rewind', into: false, get f(){ const [x, y] = siteXY(SITE.c, SITE.r); return {x, y, w: 92.3}; }, badge: {rev: '◀◀ 잘리기 전 웨이퍼로 되감기 · 줌 아웃 ×17', fwd: '▶▶ 다이싱한 큐브 하나로 · ×17'}}},
  {id: 'wafer', chap: 5, name: '스택 웨이퍼', W: 0.52, draw: drawWafer, p: {pattern: 'edge'}, def: 'map', procOf: s => s === 'dice' ? 6 : 5,
    next: {type: 'zoom', into: true, get f(){ const [x, y] = siteXY(SITE.c, SITE.r); return {x, y, w: 49.2}; }, badge: {rev: '×32 확대 · 스택 하나로', fwd: '줌 아웃 · 스택 웨이퍼로'}}},
  {id: 'stack', chap: 6, name: '적층 (분해도)', W: 0.016, draw: drawStack, p: {N: 12}, def: 'assembled', proc: 4, note: '두께 방향 과장',
    next: {type: 'rewind', into: true, get f(){ return stackFocus(SCENES[6].p.N, SCENES[6]._state === 'exploded'); }, badge: {rev: '◀◀ 적층 전으로 되감기 · ×80', fwd: '▶▶ 다 만든 코어 다이를 쌓는다'}}},
  {id: 'back', chap: 7, name: '후면 공정 (캐리어 위)', W: 2e-4, draw: drawBack, def: '5', proc: 3,
    next: {type: 'rewind', into: true, rot: 180, f: {x: 800, y: 770, w: 480}, badge: {rev: '◀◀ 캐리어를 떼고 뒤집기', fwd: '▶▶ 캐리어에 붙여 뒤집기'}}},
  {id: 'front', chap: 8, name: '앞면 범프 · 캐리어', W: 6e-5, draw: drawFront, def: '8', procOf: s => s === '8' ? 2 : 1,
    next: {type: 'zoom', into: true, f: {x: 800, y: 800, w: 800}, badge: {rev: '×2 확대 · 칩 속으로', fwd: '줌 아웃 · 범프로'}}},
  {id: 'die', chap: 9, name: 'DRAM 다이 단면', W: 3e-5, draw: drawDie, def: 'final', proc: 0,
    next: {type: 'zoom', into: true, f: {x: 210, y: 578, w: 106.7}, badge: {rev: '×15 확대 · 셀 어레이로', fwd: '줌 아웃 · 다이 단면으로'}}},
  {id: 'cells', chap: 9, name: '커패시터 숲', W: 2e-6, draw: drawCells, def: null, proc: 0, note: '개념도',
    next: {type: 'zoom', into: true, f: {x: 814, y: 915, w: 120}, badge: {rev: '×13 확대 · 셀 하나로', fwd: '줌 아웃 · 셀 어레이로'}}},
  {id: 'cell', chap: 9, name: '셀 하나 (1T1C)', W: 1.5e-7, draw: drawCell, def: 'hold', proc: 0, note: '개념도'}
];
const SI = Object.fromEntries(SCENES.map((s, i) => [s.id, i]));

/* ---------------- 3. 카드 내용 ---------------- */
const chip = (b, t) => `<span class="chip"><b>${b}</b> ${t}</span>`;
const steps = arr => `<ol class="steps">${arr.map((x, k) => `<li data-k="${k}"><span class="n">${x[0]}</span><span><b>${x[1]}</b>${x[2] ? `<em>${x[2]}</em>` : ''}</span></li>`).join('')}</ol>`;
const CARDS = {
  ai: [
    {t: 'AI는 왜 메모리에 목마를까?', html: `<p>대형 언어 모델(LLM)은 답을 <b>토큰</b>(글자 조각) 하나씩 만듭니다. 토큰 하나를 만들 때마다 <b>모델의 가중치 전체를 메모리에서 읽어</b> 계산기로 보내야 합니다 (동시에 처리하는 요청이 적을 때).</p>
      <div class="chips">${chip('700억', '파라미터')}${chip('× 2바이트', '(FP16)')}${chip('= 140 GB', '토큰 1개마다 읽기')}</div>
      <p>그래서 답이 나오는 속도의 상한은 대략 <b>메모리 대역폭 ÷ 모델 크기</b>입니다. 계산 능력보다 메모리가 먼저 막히는 현상을 <b>메모리 벽(memory wall)</b>이라고 부릅니다.</p>`},
    {t: '토큰 레이스 — 대역폭이 속도를 정한다', w: 'race', cap: '모델 크기와 대역폭을 바꾸면 답을 쓰는 속도가 달라진다'}
  ],
  server: [
    {t: 'AI 서버 한 대 안에는', html: `<ul class="jl"><li><b>GPU(가속기) 8개</b> — 실제 계산</li><li><b>GPU 간 스위치</b> — 8개를 한 덩어리처럼 묶는 고속 연결</li><li><b>CPU 2개 + DDR5</b> — 데이터 준비·관리. 용량은 크지만 대역폭은 낮다</li><li><b>SSD·네트워크</b> — 데이터와 다른 서버로 가는 길</li><li><b>팬·전원</b> — 서버 한 대가 10 kW 안팎 (대략)</li></ul><p class="hint">화면의 부품에 마우스를 올려 보세요.</p>`},
    {t: '서버 한 대 = HBM 몇 개?', w: 'count', cap: 'GPU 수 × GPU당 HBM × 스택 용량'}
  ],
  role: [
    {t: 'GPU 바로 옆, 수천 개의 길', html: `<p>HBM은 GPU와 <b>같은 패키지 안</b>, 몇 mm 거리에 붙어 있습니다.</p>
      <ul class="jl"><li><b>넓고 느리게</b> — 핀 하나의 속도는 아주 빠르지 않지만, 데이터선이 1,024개 (HBM4는 2,048개)</li><li><b>짧은 거리 + 많은 선</b> = 큰 대역폭, 비트당 전력은 작게</li><li>CPU 쪽 DDR5는 패키지 밖 수십 cm, 채널 하나가 64비트</li></ul>`},
    {t: '스택 하나의 대역폭 계산', w: 'bw', cap: '데이터선 수 × 핀당 속도 ÷ 8 = 스택 대역폭'},
    {t: '메모리 계층 — 가까울수록 빠르고 작다', w: 'pyr', cap: 'SRAM → HBM → DDR → SSD'}
  ],
  cowos: [
    {t: 'HBM은 어디서 GPU 옆에 붙나?', state: {rev: '5', fwd: '1'}, html: `<p>GPU 칩과 HBM을 <b>실리콘 인터포저</b> 위에 나란히 올리는 <b>2.5D 패키징</b>입니다. 대표적인 것이 TSMC의 <b>CoWoS</b>(Chip on Wafer on Substrate)입니다.</p>
      <ul class="jl"><li>메모리 회사는 완성된 HBM을 공급</li><li>파운드리(TSMC 등)가 GPU와 HBM을 함께 패키징</li><li>완성된 패키지를 서버 모듈 보드에 실장</li></ul>
      <p class="hint">종류: CoWoS-S(실리콘 인터포저) · CoWoS-R(RDL 인터포저) · CoWoS-L(작은 실리콘 브리지)</p>`},
    {t: '조립 순서 — 스크롤하면 한 단계씩', states: ['1', '2', '3', '4', '5'], html: steps([
      ['①', 'Chip on Wafer', 'GPU·HBM을 인터포저 웨이퍼에 마이크로범프로 접합'], ['②', '언더필', '범프 사이 빈틈을 채워 보강'],
      ['③', '인터포저 박화 · C4', '얇게 갈아 TSV를 드러내고 C4 범프 → 개별 절단'], ['④', 'on Substrate', '패키지 기판에 접합, 열전달재(TIM)·리드'],
      ['⑤', '보드 실장', '서버 모듈 보드에 BGA로']])},
    {t: '여기서 HBM 범프가 중요해지는 이유', state: '5', html: `<p>HBM 바닥의 범프 수천 개가 인터포저에 <b>한 번에</b> 붙습니다. 범프 높이가 고르지 않거나(산포) 패키지가 휘면(warpage) 일부가 덜 붙고, 그러면 <b>비싼 GPU 패키지 전체</b>가 불량이 됩니다.</p>
      <div class="chips">${chip('수십 µm', '마이크로범프 피치')}${chip('100~200 µm', 'C4 피치')}${chip('≈ 1 mm', 'BGA 피치')}</div><p class="hint">모두 대략값입니다.</p>`}
  ],
  ship: [
    {t: '검증된 스택만 나간다 — KGSD', html: `<p>출하 단위는 HBM 스택 하나, <b>KGSD</b>(Known Good Stacked Die)입니다.</p>
      <ul class="jl"><li><b>전기 테스트</b> — 동작 속도·기능</li><li><b>외관</b> — 범프·몰드 결함</li><li><b>높이·휨</b> — 평탄도</li></ul>
      <div class="chips">${chip('1 cm 남짓', '가로·세로')}${chip('< 1 mm', '높이')}${chip('720 → 775 µm', 'JEDEC 높이 (HBM3E → HBM4)')}</div>`},
    {t: 'ID 하나로 역추적', html: `<p>스택 윗면의 <b>ID</b>로 lot·웨이퍼·좌표·공정 이력을 찾습니다. 불량이 나면 같은 웨이퍼, 같은 위치의 스택을 바로 찾아 격리하고 원인을 좁힙니다.</p>
      <div class="trace">LOT A1B2 · WAFER 07 · SITE (12, 08) · 12단 · 적층 #3 · 몰드 #1 · BIN 1 <span>(예시)</span></div><p class="hint">화면의 ID 무늬에 마우스를 올려 보세요.</p>`}
  ],
  wafer: [
    {t: '큐브가 잘려 나온 자리', state: {rev: 'dice', fwd: 'plain'}, html: `<p>베이스 다이 웨이퍼 위에 코어 다이를 쌓고 몰드로 덮은 <b>300 mm 웨이퍼</b>입니다. 위에서 보면 스택 수백 개가 바둑판처럼 놓여 있습니다.</p><p>빛나는 칸이 방금 본 큐브의 자리 <b>(12, 08)</b>입니다.</p>`},
    {t: '자르기 전에 테스트한다', states: ['plain', 'map'], html: `<p>웨이퍼 상태로 스택마다 전기 테스트를 하면 <b>웨이퍼 맵</b>이 생깁니다. 스크롤하면 테스트 전 → 후로 바뀝니다.</p>
      <div class="legend"><span class="lg ok">✓ 합격</span><span class="lg ng">✗ 불합격</span><span class="lg me">그 큐브</span></div>`},
    {t: '맵 모양이 원인을 말해 준다', state: 'analysis', w: 'pattern', cap: '가장자리형 · 국부형 · 랜덤형 — 분석 방법'},
    {t: '왜 자르기 전에 걸러야 하나 — 패키지 수율', state: 'map', w: 'yield', cap: '패키지 수율 = GPU 수율 × HBM 수율^스택 수'},
    {t: 'Slice — 스택을 하나씩 잘라 낸다', state: 'dice', html: `<p>블레이드나 레이저로 스택 사이의 길(스크라이브 라인)을 따라 잘라 개별 큐브로 나눕니다. 잘린 면의 칩핑·크랙, 몰드 박리도 검사합니다.</p>`}
  ],
  stack: [
    {t: '코어 다이를 쌓는다', state: {rev: 'assembled', fwd: 'exploded'}, html: `<ul class="jl"><li>맨 아래 <b>베이스 다이</b>(로직·인터페이스) 위에 <b>코어 다이</b>(DRAM) 8~16장</li><li>다이마다 <b>TSV</b> 수천 개가 위아래를 잇는다</li><li>다이 사이는 <b>마이크로범프</b>로 접합</li></ul>`},
    {t: '한 층씩 떼어 보기 — 접합 방식', state: 'exploded', html: `<ul class="jl"><li><b>TC-NCF</b> — 한 층씩 열·압력으로 접합, 비전도성 필름으로 빈틈을 채움</li><li><b>MR-MUF</b> — 층을 쌓은 뒤 한 번에 리플로우하고 액상 몰드로 빈틈을 채움 (방열 유리)</li><li><b>하이브리드 본딩</b> — 범프 없이 Cu–Cu 직접 접합 (차세대)</li></ul><p class="hint">업체·세대마다 방식이 다릅니다.</p>`},
    {t: '높이 예산 — 왜 더 얇게 갈아야 하나', state: 'assembled', w: 'height', cap: '단수가 늘수록 코어 다이는 얇아진다'}
  ],
  back: [
    {t: '다이 뒷면의 패드는 이렇게 생겼다', state: {rev: '5', fwd: '0'}, html: `<p>적층 전, 코어 웨이퍼는 앞면이 <b>캐리어 웨이퍼</b>에 붙어 뒤집힌 상태로 뒷면을 가공합니다.</p><p>원래 웨이퍼 두께는 약 775 µm — 쌓으려면 수십 µm로 얇게 해야 하는데, 그렇게 얇으면 혼자 버티지 못해 캐리어가 받칩니다.</p>`},
    {t: '후면 공정 — 스크롤하면 한 단계씩', states: ['0', '1', '2', '3', '4', '5'], html: steps([
      ['⓪', '캐리어에 붙인 직후', 'Si 두께 그대로'], ['①', '백그라인딩', '뒷면을 갈아 수십 µm만 남김'], ['②', '실리콘 식각', 'TSV 끝을 드러냄 (TSV reveal)'],
      ['③', '절연막', 'SiN·SiO₂로 덮기'], ['④', 'CMP', 'TSV 머리만 열기'], ['⑤', '후면 패드', '시드·감광막·도금(예: Ni/Au)·제거']])},
    {t: '관리 포인트', state: '5', html: `<div class="chips">${chip('두께 편차', '(TTV)')}${chip('TSV 돌출 높이', '')}${chip('휨', '')}${chip('패드 높이·표면', '')}</div><p>모두 다음 단계인 <b>적층 접합 품질</b>로 이어집니다.</p>`}
  ],
  front: [
    {t: '앞면에 범프를 도금하고, 캐리어에 붙인다', state: {rev: '8', fwd: '7'}, star: true, html: `<p>회로가 있는 앞면의 패드 위에 마이크로범프를 <b>전해도금(ECD)</b>으로 쌓습니다: <b>Cu 기둥 → Ni(확산 방지) → SnAg(솔더)</b>.</p><p>범프를 다 만든 뒤 <b>임시 접착제</b>로 앞면을 캐리어 웨이퍼에 붙이고 뒤집어 후면 공정으로 보냅니다.</p>`},
    {t: '범프 도금 순서 — 스크롤하면 한 단계씩', states: ['0', '1', '2', '3', '4', '5', '6', '7', '8'], html: steps([
      ['⓪', '패드가 열린 웨이퍼', ''], ['①', '시드층', '전기가 흐를 얇은 금속막'], ['②', '감광막 패턴', '범프 자리만 연 틀'], ['③', 'Cu 도금', '기둥'],
      ['④', 'Ni 도금', '확산 방지층'], ['⑤', 'SnAg 도금', '솔더'], ['⑥', '감광막 제거 · 시드 식각', ''], ['⑦', '리플로우', '솔더를 녹여 둥글게, 계면에 IMC'],
      ['⑧', '캐리어 본딩', '임시 접착제로 붙이고 뒤집는다']])},
    {t: '도금 공정 관리 포인트', state: {rev: '7', fwd: '8'}, html: `<div class="chips">${chip('두께', '전류 × 시간')}${chip('조성', 'Ag 함량 → 녹는 거동')}${chip('높이 산포', '→ 적층·실장 접합')}${chip('void', '')}</div>
      <p class="hint">12단계 전체를 웨이퍼·다이·범프로 보려면 <a href="#go-bump">범프 공정 탭</a>. 계산은 <a href="#go-edu-3">03 모듈의 도금 두께 계산기</a>, 순서는 <a href="#go-edu-5">05 모듈의 범프 도금 순서</a>.</p>`}
  ],
  die: [
    {t: '범프 아래 칩 속', state: 'final', html: `<ul class="jl"><li>위에서부터 <b>패드·보호막 → 금속 배선층(BEOL) → 셀·트랜지스터 → 실리콘</b></li><li>가운데 굵은 기둥이 <b>TSV</b> — 셀 수만 개가 들어갈 자리를 차지할 만큼 크다</li><li>TSV 주변은 소자를 두지 않는 <b>KOZ</b>(금지 구역)</li></ul>`},
    {t: 'TSV는 이렇게 만든다 (via-middle)', states: ['t0', 't1', 't2', 't3', 't4', 't5', 'final'], html: steps([
      ['⓪', '트랜지스터·셀 완성 직후', ''], ['①', '깊은 실리콘 식각', '폭 수 µm, 깊이 수십 µm'], ['②', '절연막(라이너)', ''], ['③', '배리어·시드', ''],
      ['④', 'Cu 전해도금', 'void 없이 채운다 — 여기서도 도금!'], ['⑤', 'CMP 평탄화', '그 위에 금속 배선'], ['⑥', '패드·범프', '앞 장면으로 이어진다']])}
  ],
  cells: [
    {t: '커패시터 숲', html: `<p>DRAM 셀 = <b>트랜지스터 1개 + 커패시터 1개</b>. 전하를 충분히 담으려고 커패시터를 <b>폭의 수십 배 높이</b>로 세워 빽빽하게 늘어놓습니다.</p><ul class="jl"><li>아래: 실리콘 속에 묻힌 <b>워드라인</b>(트랜지스터 게이트)</li><li>위: 모든 셀이 공유하는 <b>플레이트 전극</b></li></ul>`}
  ],
  cell: [
    {t: '셀 하나 — 수십 나노미터', states: ['hold', 'on'], html: `<p>워드라인이 켜지면 트랜지스터가 열려 <b>비트라인 ↔ 커패시터</b>가 연결되고, 전하를 쓰거나 읽습니다. 전하가 있으면 <b>1</b>, 없으면 <b>0</b>.</p><p>전하는 조금씩 새어 나가기 때문에 주기적으로 다시 채웁니다 — <b>리프레시</b>. 스크롤하면 저장 → 읽기로 바뀝니다.</p>`}
  ]
};
const LINKS = {
  ai: {rev: '이 대역폭은 어디에 있을까? → 데이터센터의 서버 한 대로 ×15'},
  server: {rev: 'GPU 하나를 확대하면, HBM은 그 옆에서 무엇을 할까? → ×8', fwd: '서버 수천 대가 모이면 → AI 데이터센터 (줌 아웃 ×15)'},
  role: {rev: 'HBM은 어떻게 GPU 옆에 붙었을까? → 단면 A–A′', fwd: 'GPU 패키지 8개가 → 서버 한 대 (줌 아웃 ×8)'},
  cowos: {rev: '이 HBM은 어떤 상태로 TSMC에 도착했을까? → 출하 순간으로 되감기 ◀◀', fwd: '완성된 패키지를 위에서 보면 → 줌 아웃'},
  ship: {rev: '이 큐브는 어디서 잘려 나왔을까? → 웨이퍼의 (12, 08) 자리로 되감기 ◀◀', fwd: '큐브는 TSMC로 가서 → GPU 옆에 실장 ▶▶'},
  wafer: {rev: '스택 하나는 어떻게 쌓였을까? → 이 칸 안으로 ×32', fwd: '테스트·다이싱을 마친 큐브 하나를 → 출하 ▶▶'},
  stack: {rev: '다이와 다이를 잇는 TSV와 범프는? → 접합부로, 적층 전으로 되감기 ◀◀', fwd: '쌓은 스택 수백 개가 → 스택 웨이퍼로 (줌 아웃)'},
  back: {rev: '캐리어에 붙기 전, 앞면에는? → 뒤집어서 앞면으로 ◀◀', fwd: '패드까지 만든 코어 다이를 → 쌓는다 ▶▶'},
  front: {rev: '범프 아래, 칩 속에는? → DRAM 다이 안으로 ×2', fwd: '캐리어에 붙여 뒤집고 → 뒷면을 가공한다 ▶▶'},
  die: {rev: '셀 어레이로 ×15', fwd: '다이 앞면에 범프를 도금한다 → 줌 아웃 ×2'},
  cells: {rev: '셀 하나로 ×13', fwd: '셀 어레이 옆에 TSV를 뚫는다 → 다이 단면으로 (줌 아웃 ×15)'},
  cell: {fwd: '셀이 모여 커패시터 숲이 된다 → 줌 아웃 ×13'}
};

/* ---------------- 4. 카드 위젯 ---------------- */
const fmtTok = v => v >= 100 ? Math.round(v) + ' 토큰/s' : v >= 10 ? v.toFixed(0) + ' 토큰/s' : v.toFixed(1) + ' 토큰/s';
const WIDGETS = {
  race(el){
    el.insertAdjacentHTML('beforeend', `
      <div class="ctl"><label>모델 크기 <output data-o="m"></output></label><input type="range" data-i="m" min="7" max="400" step="1" value="70"></div>
      <div class="btns" data-g="bpp"><button class="jb" data-v="2" aria-pressed="true">FP16 · 2바이트</button><button class="jb" data-v="1">FP8 · 1바이트</button><button class="jb" data-v="0.5">INT4 · 0.5바이트</button></div>
      <div class="ctl"><label>AI 가속기의 HBM 대역폭 <output data-o="bw"></output></label><input type="range" data-i="bw" min="1" max="10" step="0.1" value="4.8"></div>
      <div class="race"><div class="lane"><div class="hd"><span>HBM을 쓰는 AI 가속기</span><b data-o="t1"></b></div><div class="bar"><i data-o="b1"></i></div><div class="tx" data-o="x1"></div></div>
      <div class="lane slow"><div class="hd"><span>DDR5만 쓰는 CPU 서버 (≈ 0.4 TB/s)</span><b data-o="t2"></b></div><div class="bar"><i data-o="b2"></i></div><div class="tx" data-o="x2"></div></div></div>
      <p class="note">단순 상한: 요청 1개, 가중치 읽기만 계산. 실제 속도는 KV 캐시·연산·통신·배치 크기에 따라 다릅니다.</p>`);
    const q = s => el.querySelector(s);
    let bpp = 2, rates = [0, 0];
    const text = '메모리 대역폭이 클수록 가중치를 빨리 읽어 와서 토큰이 빨리 나옵니다. HBM은 GPU 바로 옆에서 수천 개의 선으로 데이터를 보냅니다. ';
    const lanes = [{x: q('[data-o=x1]'), pos: 0}, {x: q('[data-o=x2]'), pos: 0}];
    const calc = () => {
      const m = +q('[data-i=m]').value, bw = +q('[data-i=bw]').value, bytes = m * 1e9 * bpp;
      rates = [bw * 1e12 / bytes, 0.4e12 / bytes];
      q('[data-o=m]').textContent = `${m}B 파라미터 · ${bytes >= 1e12 ? (bytes / 1e12).toFixed(2) + ' TB' : Math.round(bytes / 1e9) + ' GB'}`;
      q('[data-o=bw]').textContent = bw.toFixed(1) + ' TB/s';
      q('[data-o=t1]').textContent = fmtTok(rates[0]); q('[data-o=t2]').textContent = fmtTok(rates[1]);
      const mx = Math.max(...rates);
      q('[data-o=b1]').style.width = (100 * rates[0] / mx) + '%'; q('[data-o=b2]').style.width = (100 * rates[1] / mx) + '%';
    };
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', calc));
    el.querySelectorAll('[data-g=bpp] button').forEach(b => b.addEventListener('click', () => {
      bpp = +b.dataset.v; el.querySelectorAll('[data-g=bpp] button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); calc();
    }));
    calc();
    let last = performance.now();
    const tick = now => {
      if (!document.contains(el)) return;
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (VIEW.classList.contains('active') && el.closest('.jc').classList.contains('active')){
        lanes.forEach((ln, k) => {
          ln.pos += Math.min(rates[k], 40) * 1.3 * dt;
          if (ln.pos > text.length + 30) ln.pos = 0;
          ln.x.textContent = text.slice(0, Math.floor(Math.min(ln.pos, text.length)));
        });
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  count(el){
    const g = (name, opts, v) => `<div class="ctl"><label>${name}</label><div class="btns" data-g="${name}">${opts.map(o => `<button class="jb" data-v="${o[0]}" aria-pressed="${o[0] === v}">${o[1]}</button>`).join('')}</div></div>`;
    el.insertAdjacentHTML('beforeend', g('GPU 수', [[4, '4개'], [8, '8개']], 8) + g('GPU당 HBM', [[4, '4개'], [6, '6개'], [8, '8개']], 8) +
      g('스택 용량', [[24, '24 GB (8단)'], [36, '36 GB (12단)'], [48, '48 GB (16단)']], 36) +
      `<div class="kpis"><div class="kpi"><div class="k">HBM 스택</div><div class="v" data-o="n"></div><div class="s">서버 한 대</div></div><div class="kpi"><div class="k">HBM 용량</div><div class="v" data-o="c"></div><div class="s">서버 한 대</div></div></div><p class="note">제품마다 다릅니다 (예시).</p>`);
    const val = name => +el.querySelector(`[data-g="${name}"] [aria-pressed=true]`).dataset.v;
    const calc = () => {
      const n = val('GPU 수') * val('GPU당 HBM'), c = n * val('스택 용량');
      el.querySelector('[data-o=n]').textContent = n + '개';
      el.querySelector('[data-o=c]').textContent = c >= 1000 ? (c / 1000).toFixed(2) + ' TB' : c + ' GB';
    };
    el.querySelectorAll('.btns button').forEach(b => b.addEventListener('click', () => {
      b.parentElement.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); calc();
    }));
    calc();
  },
  bw(el, api){
    const sc = SCENES[SI.role];
    el.insertAdjacentHTML('beforeend', `<div class="btns" data-g="gen">${Object.keys(GENS).map(k => `<button class="jb" data-v="${k}" aria-pressed="${k === sc.p.gen}">${k}</button>`).join('')}</div>
      <div class="btns" data-g="st"><button class="jb" data-v="6" aria-pressed="${sc.p.stacks === 6}">GPU당 6개</button><button class="jb" data-v="8" aria-pressed="${sc.p.stacks === 8}">GPU당 8개</button></div>
      <div class="kpis"><div class="kpi"><div class="k">스택 하나</div><div class="v" data-o="s"></div><div class="s" data-o="f"></div></div><div class="kpi"><div class="k">GPU 하나</div><div class="v" data-o="g"></div><div class="s">스택 수 × 스택 대역폭</div></div></div>
      <p class="note">예시 속도입니다. HBM3E 제품은 9.2~9.6 Gb/s급, JEDEC HBM4 표준은 2,048선 · 최대 8 Gb/s(2 TB/s). 화면의 데이터선 개수도 함께 바뀝니다.</p>`);
    const calc = () => {
      const g = GENS[sc.p.gen], bw = g.pins * g.gbps / 8;
      el.querySelector('[data-o=s]').textContent = bw >= 1000 ? (bw / 1000).toFixed(2) + ' TB/s' : Math.round(bw) + ' GB/s';
      el.querySelector('[data-o=f]').textContent = `${g.pins.toLocaleString()}선 × ${g.gbps} Gb/s ÷ 8`;
      el.querySelector('[data-o=g]').textContent = (bw * sc.p.stacks / 1000).toFixed(1) + ' TB/s';
    };
    el.querySelectorAll('[data-g=gen] button').forEach(b => b.addEventListener('click', () => {
      el.querySelectorAll('[data-g=gen] button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      api.param('role', {gen: b.dataset.v}); calc();
    }));
    el.querySelectorAll('[data-g=st] button').forEach(b => b.addEventListener('click', () => {
      el.querySelectorAll('[data-g=st] button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      api.param('role', {stacks: +b.dataset.v}); calc();
    }));
    calc();
  },
  pyr(el){
    const tiers = [['GPU 안 SRAM·캐시', '수십~수백 MB · 가장 빠름', '#38bdf8'], ['HBM', '수십~수백 GB · TB/s', '#7dd3fc'], ['DDR5 (CPU 쪽)', '수백 GB~TB · 수백 GB/s', '#f59e0b'], ['SSD·네트워크', 'TB 이상 · GB/s', '#94a3b8']];
    let svg = '<svg class="pyr" viewBox="0 0 400 200" role="img" aria-label="메모리 계층">';
    tiers.forEach((t, i) => {
      const y = 8 + i * 47, w0 = 90 + i * 70, w1 = 90 + (i + 1) * 70;
      svg += `<polygon points="${200 - w0 / 2},${y} ${200 + w0 / 2},${y} ${200 + w1 / 2},${y + 42} ${200 - w1 / 2},${y + 42}" fill="${t[2]}" fill-opacity="${0.22 + (i === 1 ? 0.35 : 0)}" stroke="${t[2]}"/>`;
      svg += `<text x="200" y="${y + 18}" text-anchor="middle" font-size="12.5" font-weight="800" fill="#f1f5f9">${t[0]}</text><text x="200" y="${y + 34}" text-anchor="middle" font-size="11" fill="#a7b6cc">${t[1]}</text>`;
    });
    el.insertAdjacentHTML('beforeend', svg + '</svg><p class="note">위로 갈수록 빠르고 작고, 계산하는 곳에 가깝다. 대략값.</p>');
  },
  pattern(el, api){
    const sc = SCENES[SI.wafer];
    const info = {edge: '가장자리에 몰림 → 도금·몰드의 웨이퍼 안 균일도, 웨이퍼 휨, 가장자리 공정을 먼저 의심', local: '한 영역에 뭉침 → 특정 장비·척(chuck) 위치, 이물, 국부 손상', random: '흩어짐 → 입자, 재료 lot, 무작위 결함 — 전반적인 청정도'};
    el.insertAdjacentHTML('beforeend', `<div class="btns" data-g="pt"><button class="jb" data-v="edge">가장자리형</button><button class="jb" data-v="local">국부형</button><button class="jb" data-v="random">랜덤형</button></div>
      <p data-o="i"></p><div class="kpis"><div class="kpi"><div class="k">불합격</div><div class="v" data-o="f"></div><div class="s" data-o="y"></div></div></div>
      <ul class="jl"><li><b>X-ray</b> — 범프 접합·void</li><li><b>초음파(SAT)</b> — 박리</li><li><b>단면 FIB·SEM</b> — 계면·IMC</li><li><b>전기 불량 위치 추적</b></li></ul><p class="note">예시 맵입니다. 불량 칸에 마우스를 올려 보세요.</p>`);
    const sync = () => {
      el.querySelectorAll('[data-g=pt] button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === sc.p.pattern ? 'true' : 'false'));
      el.querySelector('[data-o=i]').textContent = info[sc.p.pattern];
      const s = sc.p.stats || {total: 1, fail: 0};
      el.querySelector('[data-o=f]').textContent = `${s.fail} / ${s.total}`;
      el.querySelector('[data-o=y]').textContent = `웨이퍼 수율 ${(100 * (1 - s.fail / s.total)).toFixed(1)}%`;
    };
    el.querySelectorAll('[data-g=pt] button').forEach(b => b.addEventListener('click', () => { api.param('wafer', {pattern: b.dataset.v}); sync(); }));
    sync();
  },
  yield(el){
    el.insertAdjacentHTML('beforeend', `<div class="ctl"><label>HBM 스택 수율 <output data-o="h"></output></label><input type="range" data-i="h" min="95" max="99.9" step="0.1" value="99"></div>
      <div class="ctl"><label>GPU 칩 수율 <output data-o="g"></output></label><input type="range" data-i="g" min="90" max="99.9" step="0.1" value="98"></div>
      <div class="btns" data-g="n"><button class="jb" data-v="6">HBM 6개</button><button class="jb" data-v="8" aria-pressed="true">HBM 8개</button></div>
      <div class="kpis"><div class="kpi"><div class="k">패키지 수율</div><div class="v" data-o="p"></div><div class="s" data-o="ps"></div></div><div class="kpi"><div class="k">HBM 때문에 잃는 몫</div><div class="v" data-o="l"></div><div class="s">1 − HBM 수율^스택 수</div></div></div>
      <p>HBM 하나가 불량이면 <b>GPU와 나머지 HBM까지</b> 함께 버려집니다. 그래서 스택 웨이퍼에서 미리 걸러 <b>검증된 스택(KGSD)</b>만 보냅니다.</p><p class="note">단순 곱셈 모델 (접합 수율 등 다른 손실은 제외).</p>`);
    let n = 8;
    const calc = () => {
      const hy = +el.querySelector('[data-i=h]').value / 100, gy = +el.querySelector('[data-i=g]').value / 100;
      const hb = Math.pow(hy, n), py = gy * hb;
      el.querySelector('[data-o=h]').textContent = (hy * 100).toFixed(1) + '%';
      el.querySelector('[data-o=g]').textContent = (gy * 100).toFixed(1) + '%';
      el.querySelector('[data-o=p]').textContent = (py * 100).toFixed(1) + '%';
      el.querySelector('[data-o=ps]').textContent = `100개 중 약 ${Math.round((1 - py) * 100)}개 불량`;
      el.querySelector('[data-o=l]').textContent = ((1 - hb) * 100).toFixed(1) + '%';
    };
    el.querySelectorAll('input').forEach(i => i.addEventListener('input', calc));
    el.querySelectorAll('[data-g=n] button').forEach(b => b.addEventListener('click', () => {
      n = +b.dataset.v; el.querySelectorAll('[data-g=n] button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); calc();
    }));
    calc();
  },
  height(el, api){
    const sc = SCENES[SI.stack];
    el.insertAdjacentHTML('beforeend', `<div class="btns" data-g="N">${[8, 12, 16].map(v => `<button class="jb" data-v="${v}" aria-pressed="${v === sc.p.N}">${v}단</button>`).join('')}</div>
      <div class="btns" data-g="H"><button class="jb" data-v="720" aria-pressed="true">높이 720 µm (HBM3E)</button><button class="jb" data-v="775">775 µm (HBM4)</button></div>
      <div class="ctl"><label>접합부 두께 (층마다) <output data-o="b"></output></label><input type="range" data-i="b" min="0" max="25" step="1" value="15"></div>
      <div class="kpis"><div class="kpi"><div class="k">코어 다이 두께</div><div class="v" data-o="t"></div><div class="s" data-o="ts"></div></div></div>
      <p class="note">가정: 베이스 다이·여유 60 µm, 층마다 접합부(범프+채움재) 두께가 같다. 0 µm는 하이브리드 본딩에 가깝다. 실제 값과 다릅니다. 화면의 단수도 바뀝니다.</p>`);
    let H = 720;
    const calc = () => {
      const N = sc.p.N, b = +el.querySelector('[data-i=b]').value;
      const t = (H - 60 - N * b) / N;
      el.querySelector('[data-o=b]').textContent = b + ' µm' + (b === 0 ? ' (하이브리드 본딩)' : '');
      el.querySelector('[data-o=t]').textContent = t > 0 ? '≈ ' + t.toFixed(0) + ' µm' : '불가능';
      el.querySelector('[data-o=ts]').textContent = t > 0 ? `종이 한 장(≈ 100 µm)의 ${(t / 100).toFixed(2)}배` : '높이 예산 초과';
    };
    el.querySelectorAll('[data-g=N] button').forEach(btn => btn.addEventListener('click', () => {
      el.querySelectorAll('[data-g=N] button').forEach(x => x.setAttribute('aria-pressed', x === btn ? 'true' : 'false'));
      api.param('stack', {N: +btn.dataset.v}); calc();
    }));
    el.querySelectorAll('[data-g=H] button').forEach(btn => btn.addEventListener('click', () => {
      H = +btn.dataset.v; el.querySelectorAll('[data-g=H] button').forEach(x => x.setAttribute('aria-pressed', x === btn ? 'true' : 'false')); calc();
    }));
    el.querySelector('[data-i=b]').addEventListener('input', calc);
    calc();
  }
};

/* ---------------- 5. 엔진 ---------------- */
let built = false, mode = 'rev', root, stage, svg, groups = [], blocks = [], beats = [], pres = null, lastPos = null, anim = null;
const reduced = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e){ return false; } })();
const order = () => mode === 'rev' ? SCENES.map((_, i) => i) : SCENES.map((_, i) => SCENES.length - 1 - i);
const resolveState = s => (s && typeof s === 'object') ? s[mode] : s;
function cardStates(sc, cd){ if (cd.states) return cd.states; const s = resolveState(cd.state); return [s != null ? s : sc.def]; }
function entryState(i){ const sc = SCENES[i], cs = CARDS[sc.id]; return cardStates(sc, cs[0])[0]; }
function exitState(i){ const sc = SCENES[i], cs = CARDS[sc.id], last = cardStates(sc, cs[cs.length - 1]); return last[last.length - 1]; }

function setSceneState(i, s){
  const sc = SCENES[i];
  if (s == null) s = sc.def;
  if (sc._state === s) return;
  sc._state = s;
  const g = groups[i];
  if (!g) return;
  g.dataset.state = s == null ? '' : s;
  g.querySelectorAll('[data-st]').forEach(el => {
    const on = s != null && el.getAttribute('data-st').split(' ').includes(s);
    el.style.opacity = on ? '' : '0';
    el.style.pointerEvents = on ? '' : 'none';
  });
  g.querySelectorAll('[data-hlk]').forEach(el => el.classList.toggle('hl-on', el.getAttribute('data-hlk') === s));
  syncStepLists(i, s);
}
function redraw(i){
  const sc = SCENES[i], g = groups[i];
  g.innerHTML = sc.draw(sc.p || {});
  const s = sc._state; sc._state = undefined; setSceneState(i, s);
}
const api = {
  param(id, obj){ const i = SI[id]; Object.assign(SCENES[i].p, obj); redraw(i); if (lastPos) renderCamera(lastPos.u); }
};

function build(){
  built = true;
  VIEW.innerHTML = '';
  VIEW.tabIndex = -1;
  root = h('div', 'jz');
  stage = h('div', 'jz-stage');
  svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'jz-svg');
  svg.setAttribute('viewBox', `0 0 ${W0} ${H0}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  // 장면마다 자르기 상자: 다른 장면의 초점 상자 안에 작게 들어갈 때 장면 틀(1600×1000)만 보이게
  const clips = SCENES.map((_, i) => `<clipPath id="jz-cp-${i}" clipPathUnits="userSpaceOnUse"><rect x="${-CLIP_FREE}" y="${-CLIP_FREE}" width="${W0 + 2 * CLIP_FREE}" height="${H0 + 2 * CLIP_FREE}"/></clipPath>`).join('');
  svg.innerHTML = `<defs><filter id="jz-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>${clips}</defs><g id="jz-scenes"></g>`;
  const holder = svg.querySelector('#jz-scenes');
  groups = SCENES.map((sc, i) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'jz-scene');
    g.setAttribute('clip-path', `url(#jz-cp-${i})`);
    g._clip = svg.querySelector(`#jz-cp-${i} rect`);
    g._m = CLIP_FREE;
    g.dataset.i = i;
    g.style.display = 'none';
    g.innerHTML = sc.draw(sc.p || {});
    holder.appendChild(g);
    return g;
  });
  SCENES.forEach((sc, i) => { sc._state = undefined; setSceneState(i, sc.def); });
  stage.appendChild(svg);
  const hud = h('div', 'jz-hud', `
    <nav class="jz-crumbs" aria-label="장 이동"></nav>
    <div class="jz-step" aria-live="polite"></div>
    <div class="jz-tools"><button data-mode="rev" aria-pressed="true" title="AI에서 DRAM으로 (줌인)"><span class="tl">역추적 AI → DRAM</span><span class="ts">역추적</span></button><button data-mode="fwd" aria-pressed="false" title="DRAM에서 AI로 (줌아웃)"><span class="tl">제조 순서 DRAM → AI</span><span class="ts">제조 순서</span></button><button class="pres" data-act="pres" title="전체 화면, ← → 키로 넘기기"><span class="tl">▶ 발표 모드</span><span class="ts">▶ 발표</span></button></div>
    <div class="jz-gauge" aria-hidden="true"><div class="in"><div class="rail"></div></div></div>
    <div class="jz-scale" aria-live="polite"><div class="row"><span class="bl" data-o="len"></span><span class="mag" data-o="mag"></span></div><div class="bar" data-o="bar"></div><div data-o="w"></div><div data-o="real"></div><div class="nt" data-o="note"></div></div>
    <div class="jz-proc" aria-hidden="true"></div>
    <div class="jz-warp"></div><div class="jz-scan"></div><div class="jz-cut"></div><div class="jz-badge"></div>
    <div class="jz-tip" role="tooltip"></div>
    <div class="jz-cap"><div class="k"></div><div class="t"></div><div class="d"></div></div>
    <div class="jz-pres"><span class="cnt"></span><button data-act="prev">◀ 이전</button><button data-act="next">다음 ▶</button><button data-act="exit">✕ 닫기</button></div>`);
  stage.appendChild(hud);
  // 게이지 눈금
  const gauge = hud.querySelector('.jz-gauge .in');
  ['10 m', '1 m', '10 cm', '1 cm', '1 mm', '100 µm', '10 µm', '1 µm', '100 nm'].forEach((t, k) => {
    const d = h('div', 'tk', t); d.style.top = (k / 8 * 100) + '%'; gauge.appendChild(d);
  });
  gauge.appendChild(h('div', 'mk'));
  // 장 이동 버튼
  const crumbs = hud.querySelector('.jz-crumbs');
  CHAPS.forEach((c, k) => {
    if (k) crumbs.appendChild(h('span', 'sep', '▸'));
    const b = h('button', null, esc(c)); b.dataset.chap = k;
    b.addEventListener('click', () => gotoChap(k));
    crumbs.appendChild(b);
  });
  // 공정 타임라인
  const proc = hud.querySelector('.jz-proc');
  proc.appendChild(h('b', 'dir'));
  PROC.forEach((p, k) => { if (k) proc.appendChild(h('i', null, '▸')); const s = h('span', null, esc(p)); s.dataset.k = k; proc.appendChild(s); });
  hud.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  hud.querySelector('[data-act=pres]').addEventListener('click', enterPres);
  hud.querySelector('[data-act=prev]').addEventListener('click', () => presGo(pres.k - 1));
  hud.querySelector('[data-act=next]').addEventListener('click', () => presGo(pres.k + 1));
  hud.querySelector('[data-act=exit]').addEventListener('click', exitPres);
  // 툴팁
  const tipEl = hud.querySelector('.jz-tip');
  svg.addEventListener('pointermove', ev => {
    const t = ev.target.closest && ev.target.closest('[data-tip]');
    const g = t && t.closest('.jz-scene');
    if (!t || !g || g.style.display === 'none' || +g.style.opacity < 0.5 || t.style.opacity === '0' || (t.closest('[data-st]') && t.closest('[data-st]').style.opacity === '0')){ tipEl.style.display = 'none'; return; }
    tipEl.textContent = t.getAttribute('data-tip');
    tipEl.style.display = 'block';
    const r = stage.getBoundingClientRect();
    const x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14;
    tipEl.style.left = Math.min(x, r.width - tipEl.offsetWidth - 8) + 'px';
    tipEl.style.top = Math.min(y, r.height - tipEl.offsetHeight - 8) + 'px';
  });
  svg.addEventListener('pointerleave', () => { tipEl.style.display = 'none'; });
  svg.addEventListener('click', ev => {
    const co = ev.target.closest && ev.target.closest('.callout');
    if (!co) return;
    const i = +co.closest('.jz-scene').dataset.i;
    if (pres){ const k = beats.findIndex(b => b.si === i + 1); if (k >= 0) presGo(k); return; }
    gotoScene(i + 1);
  });
  root.appendChild(stage);
  const col = h('div', 'jz-cards');
  root.appendChild(col);
  VIEW.appendChild(root);
  buildCards();
  VIEW.addEventListener('scroll', onScroll, {passive: true});
  ['wheel', 'touchstart', 'mousedown'].forEach(t => VIEW.addEventListener(t, cancelScrollAnim, {passive: true}));
  window.addEventListener('resize', () => { if (VIEW.classList.contains('active')){ measure(); onScroll(); } });
  // 카드 높이가 바뀌면(위젯 글 길이, 글꼴 로딩) 블록 위치를 다시 잰다
  if (window.ResizeObserver){
    new ResizeObserver(() => { if (VIEW.classList.contains('active') && !pres){ measure(); onScroll(); } }).observe(col);
    new ResizeObserver(() => { fitView(); if (lastPos) renderCamera(lastPos.u); }).observe(stage);
  }
  fitView();
  document.addEventListener('keydown', onKey);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && pres) exitPres(true); });
}

/* 무대 맞춤 — 장면 틀(1600×1000)이 HUD(왼쪽 눈금, 위쪽 버튼, 아래 축척·타임라인)를 피한 안전 영역에 들어가게
   viewBox를 무대 비율 그대로 잡아서, 줌으로 커진 장면은 무대 전체를 채운다 */
let VB = {k: 1, ox: 0, oy: 0};
function fitView(){
  const r = stage.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const ins = stacked() ? {l: 8, t: 112, r: 8, b: 40} : pres ? {l: 112, t: 112, r: 28, b: 196} : {l: 112, t: 116, r: 16, b: 104};
  const sw = Math.max(80, r.width - ins.l - ins.r), sh = Math.max(80, r.height - ins.t - ins.b);
  const k = Math.min(sw / W0, sh / H0);
  VB = {k, ox: ins.l + (sw - W0 * k) / 2, oy: ins.t + (sh - H0 * k) / 2};
  svg.setAttribute('viewBox', `${q1(-VB.ox / k)} ${q1(-VB.oy / k)} ${q1(r.width / k)} ${q1(r.height / k)}`);
}
function kicker(sc){
  return mode === 'rev' ? `역추적 ${sc.chap + 1} · ${CHAPS[sc.chap]}` : `제조 ${10 - sc.chap} · ${CHAPS[sc.chap]}`;
}
function buildCards(){
  const col = root.querySelector('.jz-cards');
  col.innerHTML = '';
  blocks = [];
  const ord = order();
  // 도입 카드
  const intro = h('div', 'jcw');
  intro.innerHTML = mode === 'rev'
    ? `<div class="jc intro"><div class="kick">HBM 역추적</div><div class="big">×1억 줌인</div><h3>AI에서 DRAM 셀까지 스케일 다운</h3><p>스크롤할 때마다 한 단계씩 작아집니다. <b>"이건 어디서 왔지?"</b>를 거꾸로 따라가며 데이터센터(12 m)에서 DRAM 셀 하나(수십 nm)까지 약 1억 배를 내려갑니다.</p><ul class="jl"><li>스크롤 — 다음 장면으로 줌인</li><li>화면의 <b>점선 상자</b> 클릭 — 그 안으로</li><li>부품에 마우스 — 이름·크기·역할</li><li>위쪽 장 버튼 — 바로 이동 · <b>▶ 발표 모드</b> — 전체 화면, ← → 키</li></ul></div>`
    : `<div class="jc intro"><div class="kick">제조 순서</div><div class="big">×1억 줌아웃</div><h3>DRAM 셀에서 AI까지</h3><p>같은 장면을 반대로 재생합니다. 셀 하나에서 시작해 다이, 범프, 적층, 스택 웨이퍼, 출하, CoWoS, 서버, 데이터센터까지 <b>만드는 순서대로</b> 올라갑니다.</p></div>`;
  col.appendChild(intro);
  blocks.push({kind: 'card', si: ord[0], j: -1, el: intro, n: 1, states: [entryState(ord[0])]});
  ord.forEach((si, k) => {
    const sc = SCENES[si], cs = CARDS[sc.id];
    cs.forEach((cd, j) => {
      const wrap = h('div', 'jcw');
      const card = h('div', 'jc');
      const sts = cardStates(sc, cd);
      card.innerHTML = `<div class="kick">${esc(kicker(sc))}${cd.star ? '<span class="star">★ 범프 도금 공정</span>' : ''}</div><h3>${esc(cd.t)}</h3>${cd.html || ''}`;
      if (cd.w) WIDGETS[cd.w](card, api);
      const link = LINKS[sc.id] && LINKS[sc.id][mode];
      if (j === cs.length - 1 && link && k < ord.length - 1){
        const nx = h('div', 'next', esc(link) + ' ↓');
        nx.addEventListener('click', () => gotoScene(ord[k + 1]));
        card.appendChild(nx);
      }
      if (sts.length > 1){ wrap.classList.add('multi'); wrap.style.minHeight = (sts.length * 26 + 30) + 'vh'; }
      wrap.appendChild(card);
      col.appendChild(wrap);
      const b = {kind: 'card', si, j, el: wrap, card, n: sts.length, states: sts, cd};
      blocks.push(b);
      card.querySelectorAll('.steps li').forEach(li => li.addEventListener('click', () => gotoSub(b, +li.dataset.k)));
    });
    if (k < ord.length - 1){
      const gap = h('div', 'jgap');
      const nxt = ord[k + 1];
      const tr = SCENES[Math.min(si, nxt)].next;
      gap.style.height = (reduced ? 60 : 115) + 'vh';
      gap.dataset.label = (tr.badge && tr.badge[mode]) || '';
      col.appendChild(gap);
      blocks.push({kind: 'gap', from: si, to: nxt, el: gap});
    }
  });
  // 마무리 카드
  const last = ord[ord.length - 1];
  const outro = h('div', 'jcw');
  outro.innerHTML = `<div class="jc"><div class="kick">정리</div><h3>한 장으로 다시 보기 — 만드는 순서</h3>
    <ol class="flow"><li>DRAM 웨이퍼 — 셀·트랜지스터·TSV <span>(nm ~ µm)</span></li><li>앞면 범프 도금 → 캐리어 본딩 <span>(수십 µm)</span></li><li>후면 그라인딩·TSV 노출·후면 패드 <span>(수십 µm)</span></li><li>코어 다이 적층·몰드 <span>(mm)</span></li><li>스택 웨이퍼 테스트·분석 → 다이싱 <span>(300 mm)</span></li><li>출하 (KGSD) <span>(1 cm)</span></li><li>TSMC CoWoS — GPU 옆에 실장 <span>(수 cm)</span></li><li>서버 → AI 데이터센터 <span>(1 m ~ 수백 m)</span></li></ol>
    <div class="btns"><button class="jb primary" data-act="mode">${mode === 'rev' ? '제조 순서로 다시 보기 (줌아웃)' : '역추적으로 다시 보기 (줌인)'}</button><button class="jb" data-act="top">처음으로</button><button class="jb" data-act="pres">▶ 발표 모드</button></div>
    <p><b>스스로 점검</b></p><ul class="jl"><li>토큰 생성 속도는 왜 메모리 대역폭에 묶일까?</li><li>HBM이 "넓고 느리게" 동작한다는 뜻은?</li><li>HBM 스택 하나의 불량이 왜 GPU 패키지 전체의 손실이 될까?</li><li>16단에서 코어 다이를 더 얇게 해야 하는 이유는?</li><li>캐리어 웨이퍼는 왜 필요할까?</li><li>내 공정은 이 흐름의 어디에 있고, 앞뒤 공정에 무엇을 넘겨주나?</li></ul>
    <p class="hint">더 보기: <a href="https://news.skhynix.co.kr/hbm_pakage_interview_2024/" target="_blank" rel="noopener noreferrer">SK하이닉스 뉴스룸 — HBM 패키징</a> · <a href="https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/cowos.htm" target="_blank" rel="noopener noreferrer">TSMC CoWoS</a> · <a href="https://www.trendforce.com/news/2025/04/21/news-jedec-finalizes-hbm4-standard-potentially-easing-pressure-on-hybrid-bonding-adoption/" target="_blank" rel="noopener noreferrer">JEDEC HBM4 표준 (TrendForce)</a> · <a href="https://www.eamesoffice.com/the-work/powers-of-ten/" target="_blank" rel="noopener noreferrer">Powers of Ten (Eames)</a> · <a href="#go-edu-4">04 반도체의 기초</a></p></div>`;
  outro.querySelector('[data-act=mode]').addEventListener('click', () => setMode(mode === 'rev' ? 'fwd' : 'rev'));
  outro.querySelector('[data-act=top]').addEventListener('click', () => scrollViewTo(0, true));
  outro.querySelector('[data-act=pres]').addEventListener('click', enterPres);
  col.appendChild(outro);
  blocks.push({kind: 'card', si: last, j: -2, el: outro, card: outro.querySelector('.jc'), n: 1, states: [exitState(last)]});
  intro.card = intro.querySelector('.jc');
  blocks[0].card = intro.card;
  beats = [];
  blocks.forEach(b => { if (b.kind === 'card') for (let k = 0; k < b.n; k++) beats.push({b, sub: k, si: b.si}); });
  measure();
}
function measure(){
  const vr = VIEW.getBoundingClientRect();
  blocks.forEach(b => { const r = b.el.getBoundingClientRect(); b.top = r.top - vr.top + VIEW.scrollTop; b.h = r.height; });
}
function stacked(){ return getComputedStyle(root).display === 'block'; }
function anchorOffset(){
  if (stacked()){ const sh = stage.offsetHeight; return sh + (VIEW.clientHeight - sh) * 0.45; }
  return VIEW.clientHeight * 0.5;
}
function resolvePos(){
  const a = VIEW.scrollTop + anchorOffset();
  let b = blocks.find(x => a >= x.top && a < x.top + x.h);
  if (!b){
    // 블록 사이 빈틈이면 가장 가까운 블록
    let best = Infinity;
    for (const x of blocks){ const d = a < x.top ? x.top - a : a - (x.top + x.h); if (d < best){ best = d; b = x; } }
  }
  if (b.kind === 'gap'){ const p = clamp((a - b.top) / b.h); return {u: b.from + (b.to - b.from) * p, gap: b, p}; }
  const sub = b.n > 1 ? Math.min(b.n - 1, Math.floor(clamp((a - b.top) / b.h) * b.n)) : 0;
  return {u: b.si, card: b, sub};
}
let ticking = false;
function onScroll(){
  if (ticking || pres) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; if (!pres) update(resolvePos()); });
}
let activeCard = null;
function activate(b, sub){
  if (activeCard !== b){ if (activeCard && activeCard.card) activeCard.card.classList.remove('active'); activeCard = b; if (b && b.card) b.card.classList.add('active'); }
  if (b) setSceneState(b.si, b.states[sub]);
}
function update(pos){
  lastPos = pos;
  if (pos.gap){
    setSceneState(pos.gap.from, exitState(pos.gap.from));
    setSceneState(pos.gap.to, entryState(pos.gap.to));
    activate(null);
  } else activate(pos.card, pos.sub);
  renderCamera(pos.u);
}
function syncStepLists(i, s){
  if (!blocks.length) return;
  blocks.forEach(b => {
    if (b.kind !== 'card' || b.si !== i || b.n < 2 || !b.card) return;
    const k = b.states.indexOf(s);
    b.card.querySelectorAll('.steps li').forEach((li, j) => { li.classList.toggle('on', j === k); li.classList.toggle('done', k >= 0 && j < k); });
  });
}

const CLIP_FREE = 4000;
function setT(i, tf, op, lo, m = CLIP_FREE){
  const g = groups[i];
  g.style.display = '';
  g.setAttribute('transform', tf);
  g.style.opacity = op.toFixed(3);
  g.style.setProperty('--lo', lo.toFixed(3));
  m = Math.round(m);
  if (g._m !== m){
    g._m = m;
    const r = g._clip;
    r.setAttribute('x', -m); r.setAttribute('y', -m); r.setAttribute('width', W0 + 2 * m); r.setAttribute('height', H0 + 2 * m);
  }
}
function renderCamera(u){
  const N = SCENES.length;
  u = clamp(u, 0, N - 1);
  const i = Math.min(N - 1, Math.floor(u + 1e-6)), p = u - i;
  const moving = p > 1e-4 && i < N - 1;
  groups.forEach((g, k) => { if (k !== i && !(moving && k === i + 1)) g.style.display = 'none'; });
  const hud = stage.querySelector('.jz-hud');
  const badge = hud.querySelector('.jz-badge'), scan = hud.querySelector('.jz-scan'), cut = hud.querySelector('.jz-cut'), warp = hud.querySelector('.jz-warp');
  let Wvis, curScene = i, fade = 1;
  if (!moving){
    setT(i, '', 1, 1);
    groups[i].style.setProperty('--co', '1');
    Wvis = SCENES[i].W;
    badge.style.opacity = 0; scan.style.opacity = 0; cut.style.opacity = 0; warp.style.opacity = 0;
  } else {
    const tr = SCENES[i].next, f = tr.f, into = tr.into !== false;
    const big = into ? i : i + 1, small = into ? i + 1 : i;
    // 작은 장면(초점 상자 안의 장면)이 항상 위에 그려지게
    const holder = groups[small].parentNode;
    if (holder.lastChild !== groups[small]) holder.appendChild(groups[small]);
    const t = into ? p : 1 - p;
    const e = reduced ? (t < 0.5 ? 0 : 1) : smooth(t);
    const Z = W0 / f.w, z = Math.pow(Z, e);
    const Sx = lerp(f.x, CX, e), Sy = lerp(f.y, CY, e), rot = (tr.rot || 0) * e;
    setT(big, `translate(${Sx.toFixed(2)} ${Sy.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${z.toFixed(5)}) translate(${(-f.x).toFixed(2)} ${(-f.y).toFixed(2)})`,
      1 - clamp((e - 0.55) / 0.35), 1 - clamp(e / 0.28));
    // 작은 장면은 초점 상자 안에서는 틀로 잘리고, 화면을 거의 채울 즈음 틀 밖의 층이 드러난다
    setT(small, `translate(${Sx.toFixed(2)} ${Sy.toFixed(2)}) rotate(${(rot + (tr.rot || 0)).toFixed(2)}) scale(${(z / Z).toFixed(5)}) translate(${-CX} ${-CY})`,
      clamp((e - 0.1) / 0.35), clamp((e - 0.62) / 0.3), 1400 * smooth(clamp((e - 0.8) / 0.2)));
    groups[big].style.setProperty('--co', '0'); groups[small].style.setProperty('--co', '0');
    Wvis = Math.exp(lerp(Math.log(SCENES[big].W), Math.log(SCENES[small].W), e));
    curScene = p < 0.5 ? i : i + 1;
    const pulse = Math.sin(Math.PI * p);
    fade = clamp(1 - pulse * 3);
    badge.textContent = tr.badge[mode];
    badge.classList.toggle('rw', tr.type === 'rewind');
    badge.style.opacity = (pulse * 0.95).toFixed(3);
    scan.style.opacity = tr.type === 'rewind' ? (pulse * 0.9).toFixed(3) : 0;
    if (tr.type === 'section'){ cut.style.opacity = pulse.toFixed(3); cut.style.left = (8 + 84 * p) + '%'; } else cut.style.opacity = 0;
    // 줌 방향으로 빨려 들어가는 빛줄기 (초점 = 화면 위 S 위치)
    if (tr.type === 'zoom' && !reduced){
      warp.style.setProperty('--fx', (VB.ox + Sx * VB.k).toFixed(1) + 'px');
      warp.style.setProperty('--fy', (VB.oy + Sy * VB.k).toFixed(1) + 'px');
      warp.style.setProperty('--wa', (e * 14).toFixed(2) + 'deg');
      warp.style.opacity = (pulse * 0.9).toFixed(3);
    } else warp.style.opacity = 0;
  }
  hudUpdate(curScene, Wvis, fade);
}
function fmtLen(m){
  const t = v => { const r = v >= 100 ? Math.round(v) : v >= 10 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100; return String(r); };
  if (m >= 1) return t(m) + ' m';
  if (m >= 0.01) return t(m * 100) + ' cm';
  if (m >= 1e-3) return t(m * 1e3) + ' mm';
  if (m >= 1e-6) return t(m * 1e6) + ' µm';
  return t(m * 1e9) + ' nm';
}
function fmtBig(x){
  if (x >= 1e8) return (x / 1e8).toFixed(x >= 1e9 ? 0 : 1) + '억';
  if (x >= 1e4) return Math.round(x / 1e4).toLocaleString() + '만';
  return Math.round(x).toLocaleString();
}
function hudUpdate(si, Wvis, fade){
  const hud = stage.querySelector('.jz-hud');
  const sc = SCENES[si];
  const stepEl = hud.querySelector('.jz-step'), title = (TITLES[sc.id] || {})[sc._state] || '';
  if (stepEl.textContent !== title) stepEl.textContent = title;
  stepEl.style.opacity = title ? (fade == null ? 1 : fade).toFixed(3) : 0;
  hud.querySelectorAll('.jz-crumbs button').forEach(b => { const c = +b.dataset.chap; b.classList.toggle('on', c === sc.chap); b.classList.toggle('done', mode === 'rev' ? c < sc.chap : c > sc.chap); });
  hud.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false'));
  // 게이지
  const frac = clamp((1 - Math.log10(Wvis)) / 8);
  const mk = hud.querySelector('.jz-gauge .mk');
  mk.style.top = (frac * 100) + '%';
  mk.textContent = fmtLen(Wvis);
  // 축척 막대
  const pxPerM = W0 * VB.k / Wvis;
  const raw = 130 / pxPerM, e10 = Math.pow(10, Math.floor(Math.log10(raw)));
  let L = e10;
  for (const m of [1, 2, 5, 10]) if (m * e10 <= raw) L = m * e10;
  hud.querySelector('[data-o=bar]').style.width = Math.max(20, L * pxPerM) + 'px';
  hud.querySelector('[data-o=len]').textContent = fmtLen(L);
  hud.querySelector('[data-o=mag]').textContent = '×' + fmtBig(SCENES[0].W / Wvis) + ' 확대';
  hud.querySelector('[data-o=w]').textContent = `화면 폭 ≈ ${fmtLen(Wvis)} · 상세 ${si + 1}/${SCENES.length}`;
  const real = pxPerM / 3779.5;
  hud.querySelector('[data-o=real]').textContent = real >= 1 ? `실물의 ×${fmtBig(real)}` : `실물의 1/${fmtBig(1 / real)}`;
  hud.querySelector('[data-o=note]').textContent = sc.note || '';
  // 공정 타임라인
  const pk = sc.procOf ? sc.procOf(sc._state) : sc.proc;
  hud.querySelector('.jz-proc .dir').textContent = mode === 'rev' ? '◀◀ 역추적' : '제조 순서 ▶▶';
  hud.querySelectorAll('.jz-proc span').forEach(s => { const j = +s.dataset.k; s.classList.toggle('on', j === pk); s.classList.toggle('past', mode === 'rev' ? j > pk : j < pk); });
}

/* ---- 이동 ---- */
// 브라우저 기본 부드러운 스크롤은 너무 빨라 줌이 스쳐 지나간다 → 거리에 맞춘 시간으로 직접 굴린다
let scrollAnim = null;
function cancelScrollAnim(){ if (scrollAnim){ cancelAnimationFrame(scrollAnim); scrollAnim = null; } }
function scrollViewTo(top, animate){
  cancelScrollAnim();
  top = clamp(top, 0, Math.max(0, VIEW.scrollHeight - VIEW.clientHeight));
  const from = VIEW.scrollTop, dist = top - from, screens = Math.abs(dist) / Math.max(1, VIEW.clientHeight);
  if (!animate || reduced || Math.abs(dist) < 4 || screens > 6){
    // 멀리 건너뛸 때는 장면이 번쩍이며 지나가지 않게 바로 이동
    if (screens > 6 && stage){ stage.classList.remove('jump'); void stage.offsetWidth; stage.classList.add('jump'); }
    VIEW.scrollTop = top; return;
  }
  const dur = clamp(screens * 520, 450, 2200), t0 = performance.now();
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const step = now => {
    const t = clamp((now - t0) / dur);
    VIEW.scrollTop = from + dist * ease(t);
    scrollAnim = t < 1 ? requestAnimationFrame(step) : null;
  };
  scrollAnim = requestAnimationFrame(step);
}
function scrollToBlock(b, frac, smoothScroll){
  measure();
  scrollViewTo(b.top + (frac == null ? 0.5 : frac) * b.h - anchorOffset(), smoothScroll !== false);
}
function gotoScene(si){ const b = blocks.find(x => x.kind === 'card' && x.si === si && x.j >= 0); if (b) scrollToBlock(b, b.n > 1 ? 0.5 / b.n : 0.5); }
function gotoChap(c){
  if (pres){ const k = beats.findIndex(x => SCENES[x.si].chap === c); if (k >= 0) presGo(k, true); return; }
  const b = blocks.find(x => x.kind === 'card' && SCENES[x.si].chap === c && x.j >= 0); if (b) scrollToBlock(b, b.n > 1 ? 0.5 / b.n : 0.5);
}
function gotoSub(b, k){ scrollToBlock(b, (k + 0.5) / b.n); }
function setMode(m){
  if (m === mode) return;
  mode = m;
  SCENES.forEach((sc, i) => { sc._state = undefined; setSceneState(i, sc.def); });
  buildCards();
  VIEW.scrollTop = 0;
  if (pres){ pres.k = 0; presApply(); } else update(resolvePos());
}

/* ---- 발표 모드 ---- */
function beatAtScroll(){
  const pos = resolvePos();
  if (pos.gap){ const k = beats.findIndex(x => x.si === pos.gap.to); return Math.max(0, k); }
  const k = beats.findIndex(x => x.b === pos.card && x.sub === pos.sub);
  return Math.max(0, k);
}
function enterPres(){
  if (pres) return;
  pres = {k: beatAtScroll()};
  root.classList.add('pres');
  try { if (root.requestFullscreen) root.requestFullscreen().catch(() => {}); } catch (e){}
  presApply();
}
function exitPres(fromFs){
  if (!pres) return;
  const bt = beats[pres.k];
  if (anim){ cancelAnimationFrame(anim); anim = null; }
  pres = null;
  root.classList.remove('pres');
  if (!fromFs && document.fullscreenElement) try { document.exitFullscreen(); } catch (e){}
  requestAnimationFrame(() => { measure(); if (bt) scrollToBlock(bt.b, (bt.sub + 0.5) / bt.b.n, false); setTimeout(() => update(resolvePos()), 60); });
}
function caption(bt){
  const cap = stage.querySelector('.jz-cap');
  const sc = SCENES[bt.si];
  const cd = bt.b.cd;
  cap.querySelector('.k').textContent = bt.b.j === -1 ? (mode === 'rev' ? 'HBM 역추적' : '제조 순서') : bt.b.j === -2 ? '정리' : kicker(sc);
  let title = cd ? cd.t : (bt.b.j === -1 ? (mode === 'rev' ? 'AI에서 DRAM 셀까지 — 약 1억 배 줌인' : 'DRAM 셀에서 AI까지 — 약 1억 배 줌아웃') : '한 장으로 다시 보기');
  let desc = '';
  if (cd && bt.b.n > 1){
    const li = bt.b.card.querySelectorAll('.steps li')[bt.sub];
    if (li){
      const part = sel => { const e = li.querySelector(sel); return e ? e.textContent.trim() : ''; };
      desc = [part('.n'), part('b'), part('em') && '— ' + part('em')].filter(Boolean).join(' ');
    }
    else desc = (bt.b.card.querySelector('p') || {}).textContent || '';
  } else if (cd && cd.cap) desc = cd.cap;
  else { const p = bt.b.card && bt.b.card.querySelector('p, li'); desc = p ? p.textContent : ''; }
  if (desc.length > 170) desc = desc.slice(0, 168) + '…';
  cap.querySelector('.t').textContent = title;
  cap.querySelector('.d').textContent = desc;
  stage.querySelector('.jz-pres .cnt').textContent = `${pres.k + 1} / ${beats.length}`;
}
function presApply(){
  const bt = beats[pres.k];
  setSceneState(bt.si, bt.b.states[bt.sub]);
  lastPos = {u: bt.si};
  renderCamera(bt.si);
  caption(bt);
}
function presGo(k, jump){
  if (!pres) return;
  k = clamp(k, 0, beats.length - 1);
  if (k === pres.k) return;
  const from = beats[pres.k], to = beats[k];
  if (anim){ cancelAnimationFrame(anim); anim = null; }
  pres.k = k;
  if (from.si === to.si || jump || Math.abs(order().indexOf(from.si) - order().indexOf(to.si)) !== 1 || reduced){ presApply(); return; }
  setSceneState(from.si, exitState(from.si));
  setSceneState(to.si, entryState(to.si));
  const t0 = performance.now(), dur = 1900;
  const step = now => {
    const p = clamp((now - t0) / dur);
    renderCamera(from.si + (to.si - from.si) * p);
    if (p < 1) anim = requestAnimationFrame(step);
    else { anim = null; presApply(); }
  };
  anim = requestAnimationFrame(step);
  caption(to);
}
// 스크롤 모드에서도 ← → 로 한 단계씩 (전체 화면 없이 발표할 때)
function gotoBeat(k){
  k = clamp(k, 0, beats.length - 1);
  const bt = beats[k];
  scrollToBlock(bt.b, (bt.sub + 0.5) / bt.b.n);
}
function navBeat(dir){
  const pos = resolvePos();
  if (pos.gap) return gotoBeat(dir > 0 ? beats.findIndex(x => x.si === pos.gap.to) : beats.map(x => x.si).lastIndexOf(pos.gap.from));
  gotoBeat(beats.findIndex(x => x.b === pos.card && x.sub === pos.sub) + dir);
}
function onKey(ev){
  if (!VIEW.classList.contains('active')) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
  if (typing || ev.ctrlKey || ev.metaKey || ev.altKey || document.querySelector('#modal-back.open')) return;
  if (!pres){
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft'){ ev.preventDefault(); navBeat(ev.key === 'ArrowRight' ? 1 : -1); }
    return;
  }
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(ev.key)){ ev.preventDefault(); presGo(pres.k + 1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(ev.key)){ ev.preventDefault(); presGo(pres.k - 1); }
  else if (ev.key === 'Home'){ ev.preventDefault(); presGo(0, true); }
  else if (ev.key === 'End'){ ev.preventDefault(); presGo(beats.length - 1, true); }
  else if (ev.key === 'Escape'){ ev.preventDefault(); exitPres(); }
}

/* ---- 탭 연결 ---- */
function activateTab(){
  if (!built) build();
  // 키보드(↓ PageDown Space ← →)가 바로 먹도록 스크롤 영역에 초점
  if (!VIEW.contains(document.activeElement)) try { VIEW.focus({preventScroll: true}); } catch (e){}
  requestAnimationFrame(() => { fitView(); measure(); update(resolvePos()); });
}
document.addEventListener('engr:tab', ev => { if (ev.detail === 'hbm') activateTab(); });
if (VIEW.classList.contains('active')) activateTab();
window.EngrJourney = {
  get state(){ return {mode, pos: lastPos, pres: pres ? pres.k : null, beats: beats.length, scenes: SCENES.map(s => ({id: s.id, state: s._state}))}; },
  setMode: m => setMode(m), gotoScene: i => gotoScene(i), gotoBeat: k => gotoBeat(k), enterPres: () => enterPres(), presGo: k => presGo(k), exitPres: () => exitPres(),
  scenes: SCENES, blocks: () => blocks
};
})();
