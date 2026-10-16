/* ================================================================
 * engr-edu · 범프 공정 — 앞면 범프 도금 흐름을 웨이퍼 · 다이 · 범프 세 단위로 한 화면에
 *
 * 구조
 *  - 무대(1600×1000 SVG)에 세 화면: ① 웨이퍼(장비 안의 웨이퍼 + 위에서 본 웨이퍼) ② 다이(위에서 본 범프 배열) ③ 범프 단면
 *  - 상태(ORDER): 공정 단계(하위 단계 포함). 그림 요소는 data-on(이 상태부터) / data-off(이 상태부터 사라짐) /
 *    data-st(이 상태에서만) / data-step(이 공정에서만) 으로 보이고, CSS 전환으로 쌓이고 사라진다.
 *  - 카드: 오른쪽 열. 스크롤하면 상태가 바뀐다. ← → 키, 발표 모드(전체 화면 · 자동 재생).
 *  - 범프 구조는 두 가지 — 베이스 다이 Cu 기둥 / Ni / 상부 Cu / SnAg (기본) · 코어 다이 Ni / SnAg (Cu 기둥 없음).
 *    「범프 구조」 버튼(무대 · 06 카드)이 die 를 바꾸고, 다이마다 다른 그림은 data-die 로, 다른 글은 {base, core} 값으로 둔다.
 *    도금 하위 단계는 두 다이 모두 넷(Cu 기둥 → Ni → 상부 Cu → SnAg) — 코어 다이에서는 Cu 두 단계를 '건너뜀'으로 보여 준다.
 *  - 수치는 층 두께 예시(공개 문헌 수준)만 06 카드에 적는다 (공개 저장소 · 일반적인 수준의 설명).
 * ================================================================ */
(function(){
'use strict';
const VIEW = document.getElementById('view-bump');
if (!VIEW) return;

/* ---------------- 1. 도구 ---------------- */
const W0 = 1600, H0 = 1000;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const q1 = v => Math.round(v * 10) / 10;
const at = o => o ? Object.keys(o).filter(k => o[k] != null && o[k] !== false).map(k => ` ${k}="${esc(o[k])}"`).join('') : '';
const R = (x, y, w, h, c, o) => `<rect x="${q1(x)}" y="${q1(y)}" width="${q1(Math.max(0, w))}" height="${q1(Math.max(0, h))}" class="${c}"${at(o)}/>`;
const C = (x, y, r, c, o) => `<circle cx="${q1(x)}" cy="${q1(y)}" r="${q1(r)}" class="${c}"${at(o)}/>`;
const E = (x, y, rx, ry, c, o) => `<ellipse cx="${q1(x)}" cy="${q1(y)}" rx="${q1(rx)}" ry="${q1(ry)}" class="${c}"${at(o)}/>`;
const L = (x1, y1, x2, y2, c, o) => `<line x1="${q1(x1)}" y1="${q1(y1)}" x2="${q1(x2)}" y2="${q1(y2)}" class="${c}"${at(o)}/>`;
const P = (d, c, o) => `<path d="${d}" class="${c}"${at(o)}/>`;
const PG = (pts, c, o) => `<polygon points="${pts.map(p => q1(p[0]) + ',' + q1(p[1])).join(' ')}" class="${c}"${at(o)}/>`;
const T = (x, y, s, c = 't-lbl', a = 'middle', o) => `<text x="${q1(x)}" y="${q1(y)}" class="${c}" text-anchor="${a}"${at(o)}>${esc(s)}</text>`;
const G = (inner, o) => `<g${at(o)}>${inner}</g>`;
const LB = (inner, o) => G(inner, Object.assign({class: 'lbl'}, o || {}));
const tip = s => ({'data-tip': s});
const on = (a, b) => ({'data-on': a, 'data-off': b});           // a 상태부터 b 상태 전까지
const only = list => ({'data-st': list});                        // 이 상태들에서만
const during = list => ({'data-step': list});                    // 이 공정들에서만
const W = (o, extra) => Object.assign({}, o, extra || {});
const DD = (n, o) => W(o, {'data-die': n});                      // 이 범프 구조(base · core)에서만
function lead(px, py, tx, ty, s, a = 'start', c = 't-sub', o){
  return LB(P(`M${q1(px)},${q1(py)} L${q1(tx)},${q1(ty)}`, 's-lead') + C(px, py, 3.5, 'k-lead') + T(tx + (a === 'end' ? -8 : 8), ty + 6, s, c, a), o);
}
// 떨어지거나 오르는 점 (원자·이온·물방울)
function mover(x0, y0, x1, y1, r, cls, dur, delay, o){
  return `<circle r="${r}" class="${cls}"${at(o)}><animateMotion dur="${dur}s" begin="-${q1(delay)}s" repeatCount="indefinite" path="M${q1(x0)},${q1(y0)} L${q1(x1)},${q1(y1)}"/><animate attributeName="opacity" values="0;1;1;0" dur="${dur}s" begin="-${q1(delay)}s" repeatCount="indefinite"/></circle>`;
}
function h(tag, cls, html){ const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

/* ---------------- 2. 공정 단계 ---------------- */
// 상태 순서 (하위 단계 포함)
const ORDER = ['in', 'pvd-ti', 'pvd-cu', 'coat', 'expose', 'develop', 'descum', 'ecd-cu', 'ecd-ni', 'ecd-cu2', 'ecd-sn', 'strip', 'etch-cu', 'etch-ti', 'plt', 'reflow', 'post', 'scrub'];
const IDX = Object.fromEntries(ORDER.map((s, i) => [s, i]));
// 다이마다 다른 글은 {base, core} 로 둔다 (base = 베이스 다이 Cu/Ni/Cu/SnAg, core = 코어 다이 Ni/SnAg)
const STEPS = [
  {id: 'pvd', no: '01', name: 'PVD Ti/Cu 증착', short: 'PVD Ti/Cu', tool: '스퍼터 (PVD)', states: ['pvd-ti', 'pvd-cu'],
    why: '도금 전류가 흐를 길(시드층)을 웨이퍼 전면에 깝니다. 먼저 Ti(접착·확산 방지), 이어서 Cu(도금이 붙는 시드). 증착 전 패드 표면의 산화막을 걷어 내야 잘 붙습니다.',
    check: ['막 두께·면저항 균일도', '입자', '패드와의 밀착 (박리 없음)'], defect: ['두께 불균일 → 도금 불균일', '입자 → 범프 결함', '밀착 불량 → 박리'],
    out: '전면이 금속(Ti/Cu)으로 덮인 웨이퍼'},
  {id: 'coat', no: '02', name: 'PR 코팅', short: 'PR coat', tool: '코터 (트랙)', states: ['coat'],
    why: '범프 높이만큼 두꺼운 감광막(PR)을 스핀으로 고르게 바르고 소프트 베이크로 굳힙니다. 가장자리 PR은 걷어 내(EBR) 도금 접점 자리를 비웁니다.',
    check: ['PR 두께·균일도', '기포·줄무늬', '가장자리 제거(EBR) 폭'], defect: ['두께 불균일 → 범프 높이 산포', '기포 → 패턴 결함', 'EBR 불량 → 도금 접점 문제'],
    out: '두꺼운 PR로 덮인 웨이퍼'},
  {id: 'expose', no: '03', name: '노광', short: 'Expose', tool: '노광기 (스테퍼)', states: ['expose'],
    why: '마스크(레티클)의 범프 패턴을 빛으로 PR에 옮깁니다. 한 번에 한 샷씩, 웨이퍼 위를 차례로 옮겨 가며 찍습니다 (스텝 & 리피트).',
    check: ['초점·노광량', '정렬 — 패드 위에 정확히'], defect: ['초점 이탈 → 벽 기울기·크기 이상', '정렬 어긋남 → 패드와 범프 어긋남'],
    out: '눈에 안 보이는 패턴(잠상)이 든 PR'},
  {id: 'develop', no: '04', name: '현상', short: 'Develop', tool: '현상기 (트랙)', states: ['develop'],
    why: '현상액으로 빛 받은 PR을 녹여 범프 자리에 구멍을 엽니다 (포지티브 PR 예시). 구멍 바닥에 아주 얇은 찌꺼기(스컴)가 남을 수 있습니다.',
    check: ['구멍 크기·벽 모양', '바닥 잔막(스컴)'], defect: ['덜 열림 → 범프 없음·작음', '스컴 → 도금 미착·밀착 불량'],
    out: '범프 자리만 열린 PR 틀'},
  {id: 'descum', no: '05', name: '디스컴', short: 'Descum', tool: '플라즈마 장비', states: ['descum'],
    why: 'O₂ 플라즈마로 구멍 바닥의 PR 찌꺼기를 태워 없애고 표면을 깨끗하게 합니다. 도금액이 바닥까지 고르게 닿아야 범프가 고르게 자랍니다.',
    check: ['처리 시간·파워 (과하면 PR 손상)', '표면 젖음성'], defect: ['부족 → 도금 미착·보이드', '과다 → PR 벽 손상·구멍 크기 변화'],
    out: '바닥이 깨끗한 구멍'},
  {id: 'ecd', no: '06', name: '전해도금', short: 'Plating', tool: '전해도금 장비 (ECD)', states: ['ecd-cu', 'ecd-ni', 'ecd-cu2', 'ecd-sn'], star: true,
    why: {base: '웨이퍼를 도금액에 담그고 시드층에 전류를 흘리면 PR 구멍 안에만 금속이 쌓입니다. 베이스 다이는 Cu 기둥 → Ni → 상부 Cu → SnAg 네 번 도금합니다. 두께는 전류 × 시간에 비례합니다.',
      core: '웨이퍼를 도금액에 담그고 시드층에 전류를 흘리면 PR 구멍 안에만 금속이 쌓입니다. 코어 다이는 Cu 기둥 없이 시드 위에 바로 Ni → SnAg 두 번 도금합니다. 두께는 전류 × 시간에 비례합니다.'},
    check: {base: ['범프 높이 (웨이퍼 안·다이 안)', '상부 Cu 두께 · Ni 위 밀착', 'SnAg 조성 (Ag 함량)', '도금액 농도·첨가제·온도', '전류·시간'],
      core: ['범프 높이 (웨이퍼 안·다이 안)', 'Ni 두께 · 막 응력 · 시드 위 밀착', 'SnAg 조성 (Ag 함량)', '도금액 농도·첨가제·온도', '전류·시간']},
    defect: {base: ['높이 산포 (가장자리가 두꺼워지기 쉬움)', '상부 Cu/Ni 계면 들뜸', '상부 Cu 두께 산포 (얇으면 일찍 다 쓰여 IMC가 바뀌고, 두꺼우면 Cu₃Sn · 보이드가 늘기 쉬움)', '보이드·노듈(혹)', '조성 이탈 → 녹는 거동 변화'],
      core: ['높이 산포 (가장자리가 두꺼워지기 쉬움)', 'Ni 밀착 불량 · 응력 → 들뜸', '보이드·노듈(혹)', '조성 이탈 → 녹는 거동 변화']},
    out: {base: 'PR 틀 안에 쌓인 Cu / Ni / Cu / SnAg 범프 (베이스 다이)', core: 'PR 틀 안에 쌓인 Ni / SnAg 범프 (코어 다이)'}},
  {id: 'strip', no: '07', name: 'PR 스트립', short: 'PR strip', tool: '습식 스트립 장비', states: ['strip'],
    why: '용제(스트리퍼)로 PR 틀을 녹이거나 부풀려 떼어 없앱니다 (가교된 PR은 녹지 않고 조각으로 떨어지기도 합니다 — PR 스트립 탭). 범프가 시드층 위에 서 있는 상태가 됩니다. 솔더 표면에는 얇은 산화막이 생깁니다.',
    check: {base: ['PR 잔여물', '범프 쓰러짐·손상', '범프 옆면 — Cu 기둥 · 얇은 상부 Cu 띠'], core: ['PR 잔여물', '범프 쓰러짐·손상', '범프 옆면 — Ni · SnAg 손상']},
    defect: {base: ['잔여물 → 시드 식각 방해·범프 간 단락', '상부 Cu 띠가 먹힘 → 옆 홈'], core: ['잔여물 → 시드 식각 방해·범프 간 단락', 'SnAg 옆면 손상 (알칼리에 약함)']},
    out: '시드층 위에 선 범프'},
  {id: 'etch', no: '08', name: '시드 식각', short: 'Seed etch', tool: '습식 식각 장비', states: ['etch-cu', 'etch-ti'],
    why: {base: '범프 사이의 시드층을 녹여 범프끼리 전기적으로 떼어 놓습니다: Cu 식각 → Ti 식각. Cu 식각액은 시드만 고르지 않아 베이스 다이는 Cu 기둥 · 상부 Cu 옆면도 조금 깎입니다 (Ni와 SnAg 사이 홈). 범프 아래 Ti는 가장자리가 조금 깎입니다(언더컷).',
      core: '범프 사이의 시드층을 녹여 범프끼리 전기적으로 떼어 놓습니다: Cu 식각 → Ti 식각. 코어 다이는 범프 안에 Cu가 없어 옆면 손실이 거의 없고, Ni 아래 Cu 시드의 가장자리가 조금 깎입니다(언더컷).'},
    check: {base: ['시드 잔여 없음 (단락 방지)', '상부 Cu 옆 홈 · Cu 기둥 지름', '언더컷 양', '범프 표면 손상'], core: ['시드 잔여 없음 (단락 방지)', 'Ni 아래 시드 언더컷 양', 'Ni · SnAg 표면 손상 (선택비)']},
    defect: {base: ['잔여 → 범프 간 단락', '과식각 → 상부 Cu 홈 · 언더컷 커짐'], core: ['잔여 → 범프 간 단락', '과식각 → 언더컷 커짐·범프 들뜸']},
    out: '서로 떨어진 범프'},
  {id: 'plt', no: '09', name: '플라즈마 처리', short: 'PLT', tool: '플라즈마 장비 (디스컴과 비슷)', states: ['plt'],
    why: '리플로우 전에 솔더 표면의 산화막과 유기물을 플라즈마로 걷어 냅니다 (기체에 따라 다릅니다 — Ar · H₂ 같은 기체는 산화막을 줄이고, O₂는 유기물만 태우며 Sn은 오히려 산화시킬 수 있습니다 → 리플로우 탭 03장). 표면이 깨끗해야 녹을 때 고르게 둥글어집니다.',
    check: ['처리 조건', '표면 상태'], defect: ['산화막 남음 → 모양 불량·젖음 불량'],
    out: '산화막이 걷힌 솔더'},
  {id: 'reflow', no: '10', name: '리플로우', short: 'Reflow', tool: '리플로우 장비', states: ['reflow'],
    why: {base: '솔더를 녹는점 위로 올렸다가 식혀 둥근 모양으로 만듭니다. 베이스 다이는 솔더가 상부 Cu를 적셔 계면에 금속간화합물(IMC) Cu₆Sn₅가 생깁니다. 산화를 막는 분위기(예: 질소)에서 합니다.',
      core: '솔더를 녹는점 위로 올렸다가 식혀 둥근 모양으로 만듭니다. 코어 다이는 솔더가 Ni를 적셔 계면에 금속간화합물(IMC) Ni₃Sn₄가 생깁니다 — Ni 표면 산화막이 남으면 잘 젖지 않습니다. 산화를 막는 분위기(예: 질소)에서 합니다.'},
    check: {base: ['온도 프로파일 (예열·최고 온도·냉각)', '범프 높이·모양', '보이드', 'IMC 두께 (상부 Cu가 얼마나 남았나)'], core: ['온도 프로파일 (예열·최고 온도·냉각)', '범프 높이·모양', '보이드', 'IMC(Ni₃Sn₄) 두께 · 남은 Ni']}, defect: ['보이드', '브리지 (이웃 범프와 붙음)', '모양 불량·범프 누락'],
    out: '둥근 솔더 범프'},
  {id: 'post', no: '11', name: '후처리 플라즈마', short: 'Post PLT', tool: '플라즈마 장비', states: ['post'],
    why: '리플로우 뒤 남은 잔여물·유기물을 플라즈마로 정리해 다음 공정(검사·캐리어 본딩)에 깨끗한 표면을 넘깁니다.',
    check: ['잔여물', '범프 표면 상태'], defect: ['잔여물 → 접착·접합 불량'],
    out: '잔여물이 정리된 표면'},
  {id: 'scrub', no: '12', name: '스크러버 세정', short: 'Scrubber', tool: '스크러버 (DI 세정)', states: ['scrub'],
    why: '브러시와 DI 물 분사로 입자를 떨어내고 스핀으로 말립니다. 이어서 외관·높이 검사 → 캐리어 본딩(HBM 역추적 9장)으로 갑니다.',
    check: ['입자 수', '물자국(워터마크)', '범프 손상 없음'], defect: ['입자 → 접합 불량', '물자국 → 외관 불량'],
    out: '깨끗한 범프 웨이퍼 → 검사 → 캐리어 본딩'}
];
const STEP_OF = {in: 'in'};
STEPS.forEach(sp => sp.states.forEach(s => { STEP_OF[s] = sp.id; }));
const SI = Object.fromEntries(STEPS.map((s, i) => [s.id, i]));
const SUBN = {in: '패드가 열린 웨이퍼 (회로 완성, 앞면이 위)', 'pvd-ti': 'Ti 증착 — 접착·확산 방지층', 'pvd-cu': 'Cu 증착 — 도금 시드',
  'ecd-cu': {base: 'Cu 기둥 — 높이 · 전기를 맡는 몸통', core: 'Cu 기둥 (건너뜀) — 코어 다이는 Cu 기둥이 없습니다'},
  'ecd-ni': {base: 'Ni — Cu 기둥과 솔더 사이 방벽', core: 'Ni — 몸통 겸 방벽 (시드 위에 바로, 두껍게)'},
  'ecd-cu2': {base: '상부 Cu — Ni 위에 얇게 한 번 더 올린 Cu · 솔더가 처음 만나는 면', core: '상부 Cu (건너뜀) — 코어 다이는 Ni 위에 바로 SnAg'},
  'ecd-sn': 'SnAg — 녹아서 붙는 솔더',
  'etch-cu': {base: 'Cu 시드 식각 — Cu 기둥 · 상부 Cu 옆면도 조금 깎임', core: 'Cu 시드 식각 — Ni 아래 시드 언더컷'}, 'etch-ti': 'Ti 식각'};
const SKIP = {core: ['ecd-cu', 'ecd-cu2']};                       // 그 다이에는 없는 하위 단계
let die = 'base';                                                 // 지금 고른 범프 구조
const dv = v => v && typeof v === 'object' && !Array.isArray(v) ? v[die] : v;
const subn = s => dv(SUBN[s]);

/* ---------------- 3. 그림 ---------------- */
// ① 웨이퍼 단위 — 위: 장비 안의 웨이퍼(옆에서), 아래: 웨이퍼(위에서). 장비 그림은 (40,170)부터 360×330
const TX = 40, TY = 168;
function toolWafer(y = 250){ return R(70, y, 220, 7, 'tl-wafer', tip('웨이퍼 (300 mm)')) + R(80, y + 7, 200, 22, 'tl-chuck'); }
function spin(y){ return E(180, y, 118, 13, 'tl-spin'); }
function chamber(gas, label, ions){
  let s = R(10, 10, 340, 300, 'tl-ch', {rx: 14}) + R(60, 40, 240, 12, 'tl-elec') + R(60, 52, 240, 150, 'tl-plasma2', tip(label));
  for (let k = 0; k < 7; k++) s += mover(80 + k * 33, 70, 80 + k * 33, 245, 3, 'tl-ion', 1.1, k * 0.16);
  s += toolWafer() + LB(T(180, 130, gas, 't-sub') + T(24, 300, label, 't-dim', 'start'));
  return s + (ions || '');
}
function drawTools(){
  let s = '';
  // 01 PVD
  let pv = R(10, 10, 340, 300, 'tl-ch', Object.assign({rx: 14}, tip('진공 챔버 — 아르곤 플라즈마로 타깃 원자를 떼어 낸다')));
  pv += R(90, 20, 180, 14, 'tl-mag') + R(80, 34, 200, 16, 'tl-tgt', tip('타깃 — 증착할 금속 판'));
  pv += E(180, 110, 132, 34, 'tl-plasma', tip('아르곤 플라즈마'));
  for (let k = 0; k < 5; k++) pv += mover(110 + k * 35, 120, 116 + k * 35, 54, 3, 'tl-ion', 0.9, k * 0.18);
  let ti = '', cu = '';
  for (let k = 0; k < 11; k++){
    const x = 92 + k * 18, dx = (k - 5) * 4;
    ti += mover(x, 54, x + dx, 246, 3.5, 'tl-at-ti', 1.3, k * 0.12);
    cu += mover(x, 54, x + dx, 246, 3.5, 'tl-at-cu', 1.3, k * 0.12);
  }
  pv += G(ti, only('pvd-ti')) + G(cu, only('pvd-cu')) + toolWafer();
  pv += G(R(70, 245, 220, 5, 'f-ti'), on('pvd-ti')) + G(R(70, 241, 220, 4, 'f-seed'), on('pvd-cu'));
  pv += LB(G(T(24, 76, '타깃 Ti', 't-dim', 'start'), only('pvd-ti')) + G(T(24, 76, '타깃 Cu', 't-dim', 'start'), only('pvd-cu')) + T(180, 160, 'Ar 플라즈마', 't-sub') + T(24, 300, '진공 챔버', 't-dim', 'start'));
  s += G(pv, during('pvd'));
  // 02 PR coat
  let co = P('M30,190 L30,292 Q30,306 44,306 L316,306 Q330,306 330,292 L330,190', 'tl-cup') + toolWafer(250);
  co += R(170, 20, 20, 80, 'tl-noz', tip('PR 노즐')) + `<circle r="8" class="f-pr"><animate attributeName="cy" values="104;240" dur="1.2s" repeatCount="indefinite"/><animate attributeName="cx" values="180;180" dur="1.2s" repeatCount="indefinite"/></circle>`;
  co += R(76, 236, 208, 14, 'f-pr gy', tip('두꺼운 PR — 범프 높이만큼'));
  co += spin(226) + R(286, 196, 10, 34, 'tl-noz', tip('EBR 노즐 — 가장자리 PR 제거')) + P('M291,232 l-6,12 M291,232 l0,13 M291,232 l6,12', 'tl-spray');
  co += R(222, 120, 116, 20, 'tl-hot', {rx: 4}) + LB(T(280, 112, '소프트 베이크', 't-dim') + T(24, 76, '스핀 → 고르게 퍼짐', 't-dim', 'start') + T(296, 186, 'EBR', 't-dim'));
  s += G(co, during('coat'));
  // 03 expose
  let ex = E(180, 28, 40, 14, 'tl-lamp', tip('광원 (UV)')) + P('M180,40 L70,100 M180,40 L290,100 M180,40 L180,100', 'tl-ray');
  ex += R(60, 100, 240, 12, 'tl-glass', tip('마스크(레티클) — 범프 자리만 빛이 지나간다'));
  for (let k = 0; k < 6; k++) ex += R(60 + k * 40, 100, 26, 12, 'tl-chrome');
  ex += E(180, 160, 104, 14, 'tl-lens', tip('렌즈 — 패턴을 줄여 웨이퍼에 맺는다'));
  for (let k = 0; k < 5; k++) ex += L(100 + k * 40, 174, 140 + k * 20, 236, 'tl-ray2');
  ex += toolWafer(240) + R(70, 233, 220, 7, 'f-pr') + R(140, 233, 80, 7, 'bp-latent');
  ex += P('M100,292 L60,292 M66,286 L60,292 L66,298 M260,292 L300,292 M294,286 L300,292 L294,298', 's-edge');
  ex += LB(T(180, 316, '스텝 & 리피트 — 샷마다 옮겨 찍기', 't-dim') + T(312, 112, '마스크', 't-dim', 'start') + T(24, 34, 'UV', 't-dim', 'start'));
  s += G(ex, during('expose'));
  // 04 develop
  let dv = P('M30,190 L30,292 Q30,306 44,306 L316,306 Q330,306 330,292 L330,190', 'tl-cup') + toolWafer(250) + R(70, 243, 220, 7, 'f-pr');
  dv += R(170, 20, 20, 80, 'tl-noz', tip('현상액 노즐'));
  for (let k = 0; k < 6; k++) dv += mover(172 + k * 3, 104, 110 + k * 28, 236, 3, 'tl-drop-dev', 0.9, k * 0.15);
  dv += E(180, 240, 112, 8, 'tl-puddle', tip('현상액 퍼들 — 빛 받은 PR이 녹는다')) + spin(222);
  dv += LB(T(24, 76, '현상액 (예: TMAH 계열)', 't-dim', 'start') + T(180, 322, '린스 → 스핀 건조', 't-dim'));
  s += G(dv, during('develop'));
  // 05 descum / 09 PLT / 11 post — 플라즈마 장비
  s += G(chamber('O₂ 플라즈마', '디스컴 — 바닥 PR 찌꺼기 태우기'), during('descum'));
  s += G(chamber('플라즈마', '표면 산화막·유기물 제거'), during('plt'));
  s += G(chamber('플라즈마', '리플로우 뒤 잔여물 정리'), during('post'));
  // 06 ECD
  let ec = P('M30,92 L30,296 Q30,310 44,310 L316,310 Q330,310 330,296 L330,92', 'tl-tank') + R(34, 94, 292, 212, 'tl-bath', tip('도금액 — 금속 이온과 첨가제'));
  ec += R(70, 36, 220, 46, 'tl-head', Object.assign({rx: 8}, tip('헤드 — 웨이퍼를 앞면이 아래로 잡고 돈다')));
  ec += R(80, 82, 200, 8, 'tl-wafer', tip('웨이퍼 (앞면이 아래) — 시드층이 음극')) + R(74, 80, 10, 14, 'tl-contact') + R(276, 80, 10, 14, 'tl-contact');
  ec += P('M100,28 A80,10 0 0 1 260,28', 'tl-spin2') + PG([[260, 28], [250, 22], [252, 33]], 'k-acc');
  ec += R(90, 268, 180, 18, 'tl-anode', tip('양극 — 녹아 나오며 이온을 보충 (가용성 양극 예시 · 불용성 양극이면 약품으로 보충 · 금속마다 다른 액·양극)'));
  const ionG = (cls) => { let g = ''; for (let k = 0; k < 9; k++) g += mover(100 + k * 20, 262, 102 + k * 20 + (k % 3 - 1) * 6, 96, 4, cls, 1.6, k * 0.18); return g; };
  // 베이스 다이는 Cu 셀을 두 번(Cu 기둥 · 상부 Cu), 코어 다이는 Cu 셀을 건너뛴다
  ec += G(ionG('tl-at-cu'), DD('base', only('ecd-cu ecd-cu2'))) + G(ionG('tl-at-ni'), only('ecd-ni')) + G(ionG('tl-at-sn'), only('ecd-sn'));
  ec += LB(T(300, 60, '−', 't-big', 'middle') + T(300, 284, '+', 't-big', 'middle') +
    G(T(180, 300, 'Cu²⁺ 이온 → 음극(웨이퍼)에서 Cu', 't-dim'), DD('base', only('ecd-cu'))) + G(T(180, 300, 'Cu 셀 한 번 더 — Ni 헹군 뒤 바로', 't-dim'), DD('base', only('ecd-cu2'))) +
    G(T(180, 300, '코어 다이 — Cu 셀은 건너뜀', 't-dim'), DD('core', only('ecd-cu ecd-cu2'))) + G(T(180, 300, 'Ni²⁺ → Ni', 't-dim'), only('ecd-ni')) + G(T(180, 300, 'Sn²⁺·Ag⁺ → SnAg', 't-dim'), only('ecd-sn')));
  ec += R(196, 132, 132, 30, 'tl-star', {rx: 15}) + T(262, 153, '★ 전해도금', 't-warn');
  s += G(ec, during('ecd'));
  // 07 strip
  let stp = P('M30,190 L30,292 Q30,306 44,306 L316,306 Q330,306 330,292 L330,190', 'tl-cup') + toolWafer(250) + R(70, 243, 220, 7, 'f-pr', on('coat', 'strip'));
  stp += R(110, 20, 16, 80, 'tl-noz') + R(234, 20, 16, 80, 'tl-noz');
  for (let k = 0; k < 6; k++) stp += mover(118, 104, 90 + k * 16, 236, 3, 'tl-drop-str', 0.9, k * 0.15) + mover(242, 104, 210 + k * 16, 236, 3, 'tl-drop-str', 0.9, k * 0.15 + 0.07);
  for (let k = 0; k < 4; k++) stp += `<rect width="12" height="5" class="f-pr"><animateMotion dur="1.8s" begin="-${k * 0.45}s" repeatCount="indefinite" path="M${150 + k * 20},240 Q${k % 2 ? 340 : 20},${200 - k * 10} ${k % 2 ? 360 : 0},${150 + k * 12}"/></rect>`;
  stp += spin(226) + LB(T(24, 76, '스트리퍼 (용제) → 린스', 't-dim', 'start'));
  s += G(stp, during('strip'));
  // 08 seed etch
  let et = P('M30,190 L30,292 Q30,306 44,306 L316,306 Q330,306 330,292 L330,190', 'tl-cup') + toolWafer(250) + R(170, 20, 20, 80, 'tl-noz');
  let ecu = '', eti = '';
  for (let k = 0; k < 7; k++){ ecu += mover(180, 104, 90 + k * 30, 236, 3, 'tl-drop-cu', 0.9, k * 0.13); eti += mover(180, 104, 90 + k * 30, 236, 3, 'tl-drop-ti', 0.9, k * 0.13); }
  et += G(ecu, only('etch-cu')) + G(eti, only('etch-ti')) + spin(226);
  et += LB(G(T(24, 76, 'Cu 식각액', 't-dim', 'start'), only('etch-cu')) + G(T(24, 76, 'Ti 식각액', 't-dim', 'start'), only('etch-ti')) + T(180, 322, '린스 → 스핀 건조', 't-dim'));
  s += G(et, during('etch'));
  // 10 reflow
  let rf = R(10, 30, 340, 270, 'tl-oven', Object.assign({rx: 14}, tip('리플로우 챔버 — 산화를 막는 분위기(예: 질소)')));
  rf += P('M30,52 l20,12 l20,-12 l20,12 l20,-12 l20,12 l20,-12 l20,12 l20,-12 l20,12 l20,-12 l20,12 l20,-12 l20,12 l20,-12', 'tl-heat');
  rf += toolWafer(250) + R(60, 278, 240, 10, 'tl-hot');
  rf += R(40, 84, 280, 130, 'tl-chart', {rx: 8}) + P('M50,200 L310,200 M50,200 L50,94', 's-edge');
  const prof = 'M52,196 C90,180 110,166 140,160 L190,156 C215,150 225,106 240,102 C252,100 262,130 275,160 L308,190';
  rf += P(prof, 'tl-prof') + L(52, 128, 310, 128, 's-acc2', {'stroke-dasharray': '6 5'}) + LB(T(312, 124, '녹는점', 't-warn', 'end'));
  rf += `<circle r="7" class="k-acc2"><animateMotion dur="4s" repeatCount="indefinite" path="${prof}"/></circle>`;
  rf += LB(T(56, 110, '온도', 't-dim', 'start') + T(306, 214, '시간', 't-dim', 'end') + T(24, 318, '예열 → 녹임 → 냉각', 't-dim', 'start'));
  s += G(rf, during('reflow'));
  // 12 scrubber
  let sc = P('M30,190 L30,292 Q30,306 44,306 L316,306 Q330,306 330,292 L330,190', 'tl-cup') + toolWafer(250);
  sc += R(96, 214, 168, 24, 'tl-brush', Object.assign({rx: 12}, tip('롤 브러시 — 입자를 쓸어 낸다'))) + L(104, 226, 256, 226, 'tl-bristle');
  sc += R(276, 40, 14, 70, 'tl-noz', tip('DI 물 분사'));
  for (let k = 0; k < 7; k++) sc += mover(283, 112, 120 + k * 26, 244, 3, 'tl-drop-di', 0.8, k * 0.11);
  for (let k = 0; k < 4; k++) sc += mover(150 + k * 30, 246, k % 2 ? 340 : 20, 170 + k * 14, 2.6, 'bp-part', 1.4, k * 0.35);
  sc += spin(204) + LB(T(24, 76, 'DI 물 + 브러시 → 스핀 건조', 't-dim', 'start'));
  s += G(sc, during('scrub'));
  // 00 입고
  s += G(R(10, 10, 340, 300, 'tl-ch', {rx: 14}) + toolWafer(200) + LB(T(180, 120, '앞 공정에서 온 웨이퍼', 't-sub') + T(180, 150, '회로 완성 · 패드가 열려 있다', 't-dim')), only('in'));
  return G(s, {transform: `translate(${TX} ${TY})`});
}

// ① 아래: 위에서 본 웨이퍼
const WC = {x: 220, y: 712, r: 150};
const DIE_AT = {x: 231, y: 679, s: 22};                         // 다이 화면으로 확대하는 다이
function drawWaferTop(){
  const {x, y, r} = WC;
  let s = C(x, y, r, 'wf-si', tip('웨이퍼 (위에서) — 300 mm'));
  s += C(x, y, r, 'wf-ti', on('pvd-ti', 'etch-ti')) + C(x, y, r, 'wf-cu', on('pvd-cu', 'etch-cu'));
  s += C(x, y, r - 5, 'wf-pr', W(on('coat', 'strip'), tip('PR — 가장자리 몇 mm는 EBR로 비운다')));
  // 다이 격자
  let grid = '';
  for (let k = -7; k <= 7; k++){ const v = k * 22 + 11; grid += L(x + v, y - r, x + v, y + r, 'wf-grid') + L(x - r, y + v, x + r, y + v, 'wf-grid'); }
  s += G(grid, {'clip-path': 'url(#bp-wclip)'});
  // 노광 샷 (2×2 다이) — 지그재그 순서로 번쩍
  let shots = '', n = 0;
  for (let j = -4; j < 4; j++){
    const row = [];
    for (let i = -4; i < 4; i++){ const sx = x + i * 44 + 11, sy = y + j * 44 + 11; if (Math.hypot(Math.abs(sx - x) + 22, Math.abs(sy - y) + 22) < r + 26) row.push([sx, sy]); }
    if (j % 2) row.reverse();
    for (const [sx, sy] of row) shots += R(sx, sy, 44, 44, 'shot', {style: `animation-delay:${(n++ * 0.09).toFixed(2)}s`});
  }
  s += G(shots, W(only('expose'), {'clip-path': 'url(#bp-wclip)'}));
  // 맨 위 금속이 보인다 — 베이스: Cu → Ni → 상부 Cu → SnAg, 코어: (구멍) → Ni → SnAg
  const niFill = {style: 'fill:url(#bp-p-ni)'};
  s += C(x, y, r - 5, 'wf-holes', DD('base', on('develop', 'ecd-cu'))) + C(x, y, r - 5, 'wf-holes', DD('core', on('develop', 'ecd-ni')));
  s += C(x, y, r - 5, 'wf-bcu', DD('base', only('ecd-cu ecd-cu2'))) + C(x, y, r - 5, 'wf-bcu', W(niFill, only('ecd-ni'))) + C(x, y, r - 5, 'wf-bcu', W(niFill, DD('core', only('ecd-cu2'))));
  s += C(x, y, r - 5, 'wf-bsn', on('ecd-sn'));
  s += C(x, y, r - 5, 'wf-dome', on('reflow'));
  s += C(x, y, r, 'wf-map', only('ecd-cu ecd-ni ecd-cu2 ecd-sn'));
  s += C(x, y, r, 'wf-glow', during('descum plt post')) + C(x, y, r, 'wf-wet', during('develop strip etch scrub'));
  s += PG([[x - 7, y + r + 1], [x, y + r - 9], [x + 7, y + r + 1]], 'f-hole');
  s += R(DIE_AT.x, DIE_AT.y, DIE_AT.s, DIE_AT.s, 'k-me', {rx: 3});
  s += LB(P(`M${x - r},${y + r + 26} L${x + r},${y + r + 26} M${x - r},${y + r + 18} L${x - r},${y + r + 34} M${x + r},${y + r + 18} L${x + r},${y + r + 34}`, 's-edge') + T(x, y + r + 54, '300 mm', 't-dim'));
  s += G(LB(T(x, y - r - 14, '웨이퍼 안 범프 높이 (예시) — 가장자리가 높아지기 쉽다', 't-warn')), W(only('ecd-cu ecd-ni ecd-cu2 ecd-sn'), {class: 'wf-maplbl'}));
  return s;
}

// ② 다이 단위 — 위에서 본 범프 배열 (범프 수는 줄여 그림)
const DIE = {x: 475, y: 215, s: 360}, BUMP_N = 9, BUMP_P = 36, BUMP_R = 11;
const DCX = DIE.x + DIE.s / 2, DCY = DIE.y + DIE.s / 2;
function bumpSites(){ const out = [], o = (BUMP_N - 1) / 2; for (let r = 0; r < BUMP_N; r++) for (let c = 0; c < BUMP_N; c++) out.push([DCX + (c - o) * BUMP_P, DCY + (r - o) * BUMP_P]); return out; }
function drawDie(){
  const sites = bumpSites(), {x, y, s: sz} = DIE;
  const each = f => sites.map(([a, b]) => f(a, b)).join('');
  let s = R(x - 8, y - 8, sz + 16, sz + 16, 'dp-scribe', {rx: 4}) + R(x, y, sz, sz, 'dp-pas', tip('보호막(패시베이션) — 패드 자리만 열려 있다'));
  s += each((a, b) => R(a - 8, b - 8, 16, 16, 'dp-pad'));
  s += R(x, y, sz, sz, 'dp-ti', on('pvd-ti', 'etch-ti')) + R(x, y, sz, sz, 'dp-cu', W(on('pvd-cu', 'etch-cu'), tip('Cu 시드층 — 전면을 덮는다')));
  s += R(x, y, sz, sz, 'dp-pr gy', W(on('coat', 'strip'), tip('PR')));
  s += G(each((a, b) => C(a, b, BUMP_R + 3, 'dp-latent')) + R(x, y, sz, sz, 'dp-shot'), only('expose'));
  const holes = each((a, b) => C(a, b, BUMP_R + 3, 'dp-hole')), holeTip = tip('PR에 열린 범프 자리 — 바닥에 Cu 시드');
  s += G(holes, DD('base', W(on('develop', 'ecd-cu'), holeTip))) + G(holes, DD('core', W(on('develop', 'ecd-ni'), holeTip)));
  s += G(each((a, b) => C(a - 4, b + 3, 2.2, 'dp-scum') + C(a + 5, b - 2, 1.8, 'dp-scum')), on('develop', 'descum'));
  // 위에서 보면 맨 위에 올라온 금속 — 베이스: Cu → Ni → 상부 Cu → SnAg, 코어: Ni → SnAg
  s += G(each((a, b) => C(a, b, BUMP_R + 3, 'dp-bcu')), DD('base', W(on('ecd-cu'), tip('범프 (위에서) — Cu 기둥'))));
  s += G(each((a, b) => C(a, b, BUMP_R + 3, 'dp-bni')), W(on('ecd-ni'), tip('범프 (위에서) — Ni')));
  s += G(each((a, b) => C(a, b, BUMP_R + 3, 'dp-bcu')), DD('base', W(on('ecd-cu2'), tip('범프 (위에서) — 상부 Cu'))));
  s += G(each((a, b) => C(a, b, BUMP_R + 1, 'dp-bsn')), W(on('ecd-sn'), tip('범프 (위에서) — SnAg 솔더')));
  s += G(each((a, b) => C(a, b, BUMP_R + 1, 'dp-ox')), on('strip', 'plt'));
  s += G(each((a, b) => C(a, b, BUMP_R + 3, 'dp-dome')), on('reflow'));
  s += G(each((a, b) => C(a + 13, b + 11, 2, 'bp-res')), on('reflow', 'post'));
  s += G(C(x + 60, y + 70, 3, 'bp-part') + C(x + 250, y + 120, 2.5, 'bp-part') + C(x + 150, y + 300, 3, 'bp-part') + C(x + 300, y + 260, 2.5, 'bp-part'), on('reflow', 'scrub'));
  s += R(x, y, sz, sz, 'dp-glow', during('descum plt post')) + R(x, y, sz, sz, 'dp-wet', during('develop strip etch scrub'));
  s += R(x, y, sz, sz, 'dp-bath', during('ecd'));
  // 단면 A–A′, 상세 원
  const cy = DCY;
  s += P(`M${x - 4},${cy} L${x + sz + 4},${cy}`, 's-acc', {'stroke-dasharray': '9 6'}) + LB(T(x - 10, cy + 7, 'A', 't-co', 'end') + T(x + sz + 10, cy + 7, 'A′', 't-co', 'start'));
  s += C(DCX, cy, 26, 'co-detail');
  s += LB(T(DCX, y + sz + 34, '범프 수는 줄여 그림 (실제는 수천 개)', 't-dim'));
  return s;
}
// ② 아래: 이 단계에서 보는 것
function checkBox(step){
  const sp = STEPS[SI[step]];
  let s = R(455, 640, 400, 268, 'bp-box', {rx: 12});
  if (!sp){ return s + T(475, 680, '입고 — 앞 공정에서 온 웨이퍼', 't-sub', 'start') + T(475, 714, '회로가 완성되고 패드가 열린 상태', 't-dim', 'start'); }
  s += T(475, 676, '관리 포인트', 't-acc', 'start');
  const ck = dv(sp.check), df = dv(sp.defect);
  ck.slice(0, 3).forEach((c, k) => { s += T(475, 708 + k * 28, '· ' + c, 't-sub', 'start'); });
  const y0 = 708 + Math.min(3, ck.length) * 28 + 14;
  s += T(475, y0, '자주 보는 불량', 't-warn', 'start');
  df.slice(0, 2).forEach((c, k) => { s += T(475, y0 + 30 + k * 28, '· ' + c, 't-sub', 'start'); });
  return s;
}

// ③ 범프 단위 — 단면. 지역 좌표 690×700, (890,165)에 놓는다
const BX0 = 890, BY0 = 165, BW = 690, BH = 700, BC = 345, PITCH = 330, HALF = 90;
const BXS = [-PITCH, 0, PITCH];                  // 가운데 범프와 양옆 이웃
const PAS = 524, PAD = 536, SEED = 511, ATM = PAS;
const OPEN = BXS.map(d => [BC + d - 50, BC + d + 50]);
// 범프 층의 위쪽 끝 y (세로 1 µm ≈ 8.7 — 개념도, 가로는 다른 배율). 예시 두께 (공개 문헌 수준, 다른 탭과 같은 값):
//  베이스 다이: Cu 기둥 12 + Ni 3 + 상부 Cu 3 + SnAg 12 = 30 µm, PR 35 µm (범프보다 5 µm 높게)
//  코어 다이: Ni 5 + SnAg 12 = 17 µm (Cu 기둥 없음), PR도 범프보다 조금 높게
//  top = 솔더가 앉는 면(베이스 = 상부 Cu, 코어 = Ni), ti · cs = 범프 아래 Ti · Cu 시드가 범프 가장자리에서 들어간 폭(시드 식각 뒤 보임)
const GEO = {
  base: {pr: 208, cu: 407, ni: 381, cu2: 355, sn: 251, top: 355, ti: 8, cs: 5},
  core: {pr: 320, ni: 468, sn: 364, top: 468, ti: 4, cs: 6}
};
const DIES = ['base', 'core'];
const DOME = 136;   // 리플로우 뒤 돔 높이: SnAg 원기둥 12 µm(104) → 꼭대기 약 15.7 µm (리플로우 탭 04장 계산, 두 다이 같은 부피)
const RR = 5;       // 베이스 다이: Cu 식각액이 Cu 기둥 · 상부 Cu 옆면을 깎는 폭 (과장) — Ni · SnAg는 그대로라 상부 Cu 자리에 홈
// 표면을 따라 붙는 얇은 층 (a~b: 표면에서 위로 떨어진 거리), [xa, xb] 안만
function conf(a, b, xa, xb, cls){
  let s = '';
  const seg = (x0, x1, y0, y1) => { x0 = Math.max(x0, xa); x1 = Math.min(x1, xb); if (x1 > x0 + 0.1) s += R(x0, y0, x1 - x0, y1 - y0, cls); };
  let x = -200;
  for (const [o0, o1] of OPEN){
    seg(x, o0 + b, PAS - b, PAS - a);
    seg(o0 + a, o0 + b, PAS - b, PAD - a);
    seg(o0 + b, o1 - b, PAD - b, PAD - a);
    seg(o1 - b, o1 - a, PAS - b, PAD - a);
    x = o1 - b;
  }
  seg(x, 900, PAS - b, PAS - a);
  return s;
}
// 맨 아래 도금층 — 패드 위 오목한 자리(시드 안쪽)까지 채운다
function body(d, y, cls){
  const x0 = BC + d - HALF, x1 = BC + d + HALF, i0 = BC + d - 37, i1 = BC + d + 37;
  return PG([[x0, y], [x1, y], [x1, SEED], [i1, SEED], [i1, PAD - 13], [i0, PAD - 13], [i0, SEED], [x0, SEED]], cls);
}
function solderPath(d, m, g){
  const x0 = BC + d - HALF, x1 = BC + d + HALF, b = g.top, top = lerp(g.sn, b - DOME, m), r = Math.min(HALF, lerp(4, HALF, m)), bulge = 8 * m;
  return `M${q1(x0)},${b} C${q1(x0 - bulge)},${q1(b - 30)} ${q1(x0 - bulge)},${q1(top + r)} ${q1(x0)},${q1(top + r)} Q${q1(x0)},${q1(top)} ${q1(x0 + r)},${q1(top)} L${q1(x1 - r)},${q1(top)} Q${q1(x1)},${q1(top)} ${q1(x1)},${q1(top + r)} C${q1(x1 + bulge)},${q1(top + r)} ${q1(x1 + bulge)},${q1(b - 30)} ${q1(x1)},${b} Z`;
}
function drawBump(){
  const each = f => BXS.map(f).join('');
  let s = '';
  // 위쪽 분위기 (도금액·현상액·플라즈마 등) — 액은 PR 구멍 · 범프 사이까지 닿는다
  s += R(0, 0, BW, ATM, 'bp-bath', W(during('ecd'), tip('도금액 — 금속 이온이 구멍 바닥으로')));
  s += R(0, 0, BW, ATM, 'bp-dev', during('develop')) + R(0, 0, BW, ATM, 'bp-strip', during('strip'));
  s += R(0, 0, BW, ATM, 'bp-etchant', only('etch-cu')) + R(0, 0, BW, ATM, 'bp-etchant2', only('etch-ti'));
  s += R(0, 0, BW, 70, 'bp-plasma', W(during('descum plt post'), tip('플라즈마')));
  s += R(0, 0, BW, 205, 'bp-heat', during('reflow')) + R(0, 0, BW, ATM, 'bp-di', during('scrub'));
  // 실리콘 · 회로층 · 패드 · 보호막
  s += G(R(-200, 610, 1100, 200, 'f-si') + each(d => d ? '' : R(BC - 22, 610, 44, 200, 'f-cu')), tip('실리콘 (그 속에 TSV)'));
  let beol = R(-200, 548, 1100, 62, 'f-beol');
  for (let x = -190; x < 900; x += 70) beol += R(x, 562, 40, 7, 'f-metal') + R(x + 26, 584, 34, 7, 'f-metal');
  s += G(beol + each(d => R(BC + d - 14, 548, 28, 50, 'f-metal')), tip('회로층(BEOL) — 금속 배선'));
  // PR (보호막 아래로 그려서 구멍 안만 보이게) — 범프가 낮은 코어 다이는 PR도 얇다
  for (const n of DIES){
    const pr = GEO[n].pr;
    s += R(-200, pr, 1100, PAD - pr, 'f-pr gy', DD(n, W(on('coat', 'develop'), tip('PR — 범프 높이보다 조금 두껍게'))));
    s += G(each(d => R(BC + d - HALF, pr, 2 * HALF, PAD - pr, 'bp-latent')), DD(n, W(only('expose'), tip('빛 받은 PR — 현상액에 녹게 바뀌었다 (잠상)'))));
    let prOpen = '', x = -200;
    for (const d of BXS){ prOpen += R(x, pr, BC + d - HALF - x, PAD - pr, 'f-pr'); x = BC + d + HALF; }
    prOpen += R(x, pr, 900 - x, PAD - pr, 'f-pr');
    s += G(prOpen, DD(n, W(on('develop', 'strip'), tip('PR 틀 — 범프 자리만 열렸다'))));
  }
  s += G(each(d => R(BC + d - 70, PAD, 140, 12, 'f-al')), tip('패드'));
  let pas = '', px = -200;
  for (const [o0, o1] of OPEN){ pas += R(px, PAS, o0 - px, 24, 'f-pas'); px = o1; }
  pas += R(px, PAS, 900 - px, 24, 'f-pas');
  s += G(pas, tip('보호막(패시베이션) — 패드 자리만 열려 있다'));
  // 시드층: 전면(식각 전까지) + 범프 아래(남는다, 가장자리 조금 깎임 — 다이마다 깎인 모양이 다르다)
  s += G(conf(0, 5, -200, 900, 'f-ti'), W(on('pvd-ti', 'etch-ti'), tip('Ti — 접착·확산 방지')));
  for (const n of DIES){ const k = GEO[n].ti; s += G(each(d => conf(0, 5, BC + d - HALF + k, BC + d + HALF - k, 'f-ti')), DD(n, on('pvd-ti'))); }
  s += G(conf(5, 13, -200, 900, 'f-seed'), W(on('pvd-cu', 'etch-cu'), tip('Cu 시드 — 도금 전류가 흐르는 길')));
  for (const n of DIES){ const k = GEO[n].cs; s += G(each(d => conf(5, 13, BC + d - HALF + k, BC + d + HALF - k, 'f-seed')), DD(n, on('pvd-cu'))); }
  // 스컴, 노광 마스크·빛
  s += G(each(d => P(`M${BC + d - 46},${PAD - 13} q12,-9 24,0 q12,-8 22,0 q12,-9 24,0 q10,-7 22,0 Z`, 'f-pr') + R(BC + d - 86, SEED - 5, 32, 5, 'f-pr') + R(BC + d + 54, SEED - 5, 32, 5, 'f-pr')),
    W(on('develop', 'descum'), tip('스컴 — 구멍 바닥에 남은 얇은 PR')));
  let mask = R(-200, 120, 1100, 14, 'tl-glass'), x = -200;
  for (const d of BXS){ mask += R(x, 120, BC + d - HALF - x, 14, 'tl-chrome'); x = BC + d + HALF; }
  mask += R(x, 120, 900 - x, 14, 'tl-chrome');
  const uv = y1 => { let u = ''; for (const d of BXS) for (let k = 0; k < 4; k++){ const lx = BC + d - 60 + k * 40; u += L(lx, 30, lx, 118, 'bp-uv') + L(lx, 136, lx, y1, 'bp-uv'); } return u; };
  for (const n of DIES) mask += G(uv(GEO[n].pr + 92), DD(n));
  s += G(mask, W(only('expose'), tip('마스크 — 범프 자리로만 빛(UV)이 지나간다')));
  // 디스컴·PLT 이온
  let ions = '';
  for (const d of BXS) for (let k = 0; k < 3; k++) ions += mover(BC + d - 50 + k * 50, 60, BC + d - 50 + k * 50, PAD - 18, 4, 'tl-ion', 1, k * 0.3);
  s += G(ions, only('descum'));
  let ions2 = '';
  for (const d of BXS) for (let k = 0; k < 3; k++) ions2 += mover(BC + d - 60 + k * 60, 60, BC + d - 60 + k * 60, 200, 4, 'tl-ion', 0.9, k * 0.3);
  s += G(ions2, only('plt post'));
  // 도금 이온 (구멍 안으로) — 코어 다이는 Cu 단계가 없다
  const pi = (cls, y1) => each(d => [0, 1, 2].map(k => mover(BC + d - 50 + k * 50, 20, BC + d - 40 + k * 40, y1, 4.5, cls, 1.4, k * 0.4)).join(''));
  const yb = GEO.base.pr + 20, yc = GEO.core.pr + 20;
  s += G(pi('tl-at-cu', yb), DD('base', only('ecd-cu ecd-cu2'))) + G(pi('tl-at-ni', yb), DD('base', only('ecd-ni'))) + G(pi('tl-at-sn', yb), DD('base', only('ecd-sn')));
  s += G(pi('tl-at-ni', yc), DD('core', only('ecd-ni'))) + G(pi('tl-at-sn', yc), DD('core', only('ecd-sn')));
  // 범프 (아래에서 자란다)
  //  베이스: Cu 기둥 → Ni → 상부 Cu → SnAg. Cu 두 층은 시드 식각 때 옆면이 조금 깎인다 — 마스크로 옆을 덜어 낸다
  const B = GEO.base, C0 = GEO.core;
  let notch = '';
  for (const d of BXS) notch += R(BC + d - HALF - 2, 300, RR + 2, 230, '', {fill: '#000'}) + R(BC + d + HALF - RR, 300, RR + 2, 230, '', {fill: '#000'});
  s += `<mask id="bp-m-cu" maskUnits="userSpaceOnUse" x="-200" y="0" width="1100" height="${BH}"><rect x="-200" y="0" width="1100" height="${BH}" fill="#fff"/>${G(notch, on('etch-cu'))}</mask>`;
  s += G(G(each(d => body(d, B.cu, 'f-cu gy')), W(on('ecd-cu'), tip('Cu 기둥 — 높이 · 전기 (베이스 다이)'))) +
    G(each(d => R(BC + d - HALF, B.cu2, 2 * HALF, B.ni - B.cu2, 'f-cu gy')), W(on('ecd-cu2'), tip('상부 Cu — 솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로 (Ni 위에 얇게 한 번 더 올린 Cu)'))),
    DD('base', {mask: 'url(#bp-m-cu)'}));
  s += G(each(d => R(BC + d - HALF, B.ni, 2 * HALF, B.cu - B.ni, 'f-ni gy')), DD('base', W(on('ecd-ni'), tip('Ni — Cu 기둥과 솔더 사이 방벽'))));
  //  코어: Cu 기둥 없이 시드 위에 바로 Ni(두껍게) → SnAg
  s += G(each(d => body(d, C0.ni, 'f-ni gy')), DD('core', W(on('ecd-ni'), tip('Ni — 몸통 겸 방벽 (Cu 기둥 없음)'))));
  for (const n of DIES){
    const g = GEO[n];
    s += G(each(d => R(BC + d - HALF, g.sn, 2 * HALF, g.top - g.sn, 'f-sn gy')), DD(n, W(on('ecd-sn', 'reflow'), tip('SnAg — 녹아서 붙는 솔더 (리플로우 전, 원기둥)'))));
    s += G(each(d => P(solderPath(d, 1, g), 'f-sn bp-dome', {'data-d': d, 'data-g': n})), DD(n, W(on('reflow'), tip('리플로우 후 솔더 — 둥글어졌다'))));
    s += G(each(d => R(BC + d - HALF, g.top - 5, 2 * HALF, 5, 'f-imc')), DD(n, W(on('reflow'), tip(n === 'base'
      ? 'IMC (금속간화합물) — 상부 Cu와 솔더 계면의 Cu₆Sn₅. 열을 더 받아 상부 Cu가 다 쓰이면 Ni 위 (Cu,Ni)₆Sn₅로 안정'
      : 'IMC (금속간화합물) — Ni와 솔더 계면의 Ni₃Sn₄. 열을 더 받을수록 자라며 Ni가 줄어든다'))));
    s += G(each(d => R(BC + d - HALF, g.sn - 6, 2 * HALF, 6, 'bp-oxide')), DD(n, W(on('strip', 'plt'), tip('산화막 — 공기 중에서 솔더 표면에 생긴다'))));
    s += G(each(d => C(BC + d + 30, g.top - 2, 3.5, 'bp-res')), DD(n, W(on('reflow', 'post'), tip('잔여물 (유기물 등)'))));
  }
  // 잔여물 · 입자 · DI 물방울
  s += G(each(d => C(BC + d - HALF - 14, PAS - 8, 5, 'bp-res') + C(BC + d + HALF + 12, PAS - 6, 4, 'bp-res')), W(on('reflow', 'post'), tip('잔여물 (유기물 등)')));
  s += G(C(BC - 150, PAS - 10, 6, 'bp-part') + C(BC + 160, PAS - 12, 5, 'bp-part') + C(BC + 40, 186, 5, 'bp-part'), W(on('reflow', 'scrub'), tip('입자')));
  let di = '';
  for (let k = 0; k < 8; k++) di += mover(40 + k * 85, 0, 30 + k * 85, 200, 5, 'tl-drop-di', 0.9, k * 0.12);
  s += G(di, during('scrub'));
  // 라벨 (가운데 범프 오른쪽 틈 450~580)
  const LX = 452, c = BC;
  s += G(lead(c + 40, PAS - 2, LX, 470, 'Ti (접착·배리어)'), on('pvd-ti', 'coat'));
  s += G(lead(c + 70, PAS - 9, LX, 430, 'Cu 시드'), on('pvd-cu', 'coat'));
  s += G(lead(c + HALF + 60, 127, LX + 10, 168, '마스크'), only('expose'));
  s += G(lead(c, 400, LX, 380, '빛 받은 PR', 'start', 't-acc'), only('expose'));
  s += G(lead(c + 30, PAD - 16, LX, 392, '스컴', 'start', 't-warn'), on('develop', 'descum'));
  //  베이스 다이: SnAg 270 · IMC 302 · 상부 Cu 334 · Ni 368 · Cu 기둥 420 · 언더컷 466
  s += G(G(lead(c + HALF - 6, 462, LX, 420, 'Cu 기둥'), on('ecd-cu')) + G(lead(c + HALF, 394, LX, 368, 'Ni'), on('ecd-ni')) +
    G(lead(c + HALF - 6, 368, LX, 334, '상부 Cu'), on('ecd-cu2', 'etch-cu')) + G(lead(c + HALF - 6, 368, LX, 334, '상부 Cu'), on('plt')) +
    G(lead(c + HALF - 3, 368, LX, 334, '상부 Cu 홈', 'start', 't-warn'), on('etch-cu', 'plt')) +
    G(lead(c + HALF - 4, 300, LX, 270, 'SnAg 솔더'), on('ecd-sn')) + G(lead(c + 40, B.sn - 4, LX, 200, '산화막', 'start', 't-warn'), on('strip', 'plt')) +
    G(lead(c + HALF - 6, SEED + 10, LX, 466, '언더컷', 'start', 't-warn'), on('etch-ti', 'plt')) + G(lead(c + HALF - 2, B.top - 3, LX, 302, 'IMC (Cu₆Sn₅)'), on('reflow')),
    DD('base'));
  //  PR 이름표는 왼쪽 PR 기둥(이웃 범프와 가운데 범프 사이)에 — 오른쪽 범프 층 이름표와 겹치지 않게
  s += G(G(lead(c - HALF - 40, 300, 118, 250, 'PR (감광막)'), on('coat', 'strip')), DD('base'));
  //  코어 다이: SnAg 382 · IMC 414 · Ni 446 · 언더컷 478. Cu 두 단계는 건너뛴다
  s += G(G(lead(c - HALF - 40, 430, 118, 380, 'PR (감광막)'), on('coat', 'strip')) +
    G(lead(c + HALF, 490, LX, 446, 'Ni (몸통)'), on('ecd-ni')) + G(lead(c + HALF - 4, 416, LX, 382, 'SnAg 솔더'), on('ecd-sn')) +
    G(lead(c + 40, C0.sn - 4, LX, 316, '산화막', 'start', 't-warn'), on('strip', 'plt')) + G(lead(c + HALF - 3, SEED + 4, LX, 478, '언더컷', 'start', 't-warn'), on('etch-cu', 'plt')) +
    G(lead(c + HALF - 2, C0.top - 3, LX, 414, 'IMC (Ni₃Sn₄)'), on('reflow')) +
    G(LB(T(c, 290, '코어 다이: Cu 기둥 없음 → 건너뜀', 't-warn')), only('ecd-cu')) + G(LB(T(c, 290, '코어 다이: 상부 Cu 없음 → 건너뜀', 't-warn')), only('ecd-cu2')),
    DD('core'));
  s += G(lead(c + HALF + 12, PAS - 6, LX, 500, '잔여물', 'start', 't-warn'), on('reflow', 'post'));
  s += G(lead(c + 160, PAS - 12, LX + 30, 548, '입자', 'start', 't-warn'), on('reflow', 'scrub'));
  s += LB(T(110, 504, '보호막', 't-dim', 'start') + T(110, 600, '회로층', 't-dim', 'start') + T(110, 650, '실리콘 · TSV', 't-dim', 'start'));
  return G(s, {transform: `translate(${BX0} ${BY0})`, 'clip-path': 'url(#bp-bclip)'});
}

function drawStage(){
  let s = '';
  // 패널 틀과 제목
  s += R(20, 100, 400, 836, 'bp-panel', {rx: 16}) + R(445, 100, 420, 836, 'bp-panel', {rx: 16}) + R(888, 100, 694, 836, 'bp-panel', {rx: 16});
  s += T(40, 140, '① 웨이퍼 단위', 't-acc', 'start') + T(400, 140, '300 mm · 장비 안', 't-dim', 'end');
  s += T(465, 140, '② 다이 단위', 't-acc', 'start') + T(845, 140, '수 mm~1 cm대 · 위에서', 't-dim', 'end');
  s += T(908, 140, '③ 범프 단위', 't-acc', 'start') + G(T(1562, 140, '베이스 다이 범프 (Cu/Ni/Cu/SnAg) · 단면 A–A′', 't-sub', 'end'), DD('base')) + G(T(1562, 140, '코어 다이 범프 (Ni/SnAg) · 단면 A–A′', 't-sub', 'end'), DD('core'));
  s += drawTools() + drawWaferTop() + drawDie() + `<g id="bp-check"></g>` + drawBump();
  // 상세 연결선: 웨이퍼의 다이 → 다이 화면, 다이의 범프 → 범프 화면
  s += P(`M${DIE_AT.x + DIE_AT.s},${DIE_AT.y} L${DIE.x},${DIE.y} M${DIE_AT.x + DIE_AT.s},${DIE_AT.y + DIE_AT.s} L${DIE.x},${DIE.y + DIE.s}`, 'bp-conn');
  s += P(`M${DCX + 18},${DCY - 19} L${BX0},${BY0 + 120} M${DCX + 18},${DCY + 19} L${BX0},${BY0 + 600}`, 'bp-conn');
  s += LB(P('M908,912 L1008,912 M908,904 L908,920 M1008,904 L1008,920', 's-edge') + T(1018, 918, '≈ 수십 µm · 두께 과장한 개념도', 't-dim', 'start'));
  return s;
}

/* ---------------- 4. 카드 ---------------- */
const chip = (b, t) => `<span class="chip"><b>${esc(b)}</b> ${esc(t)}</span>`;
// 범프 구조 고르기 (무대 위 · 06 카드). 다이마다 다른 설명
const DIE_NAME = {base: '베이스 다이 · Cu/Ni/Cu/SnAg', core: '코어 다이 · Ni/SnAg'};
const dieBtns = cls => DIES.map(n => `<button${cls ? ` class="${cls}"` : ''} data-dsel="${n}" aria-pressed="${n === die}">${esc(DIE_NAME[n])}</button>`).join('');
const DNOTE = {
  base: '<b>베이스 다이</b>(맨 아래 로직 · 인터페이스 다이)의 범프는 아래 인터포저 쪽에 붙습니다. Cu 기둥이 높이 · 전기 · 열을, Ni가 Cu 기둥과 솔더 사이 방벽을 맡고, <b>상부 Cu</b>(Ni 위에 얇게 한 번 더 올린 Cu)가 솔더가 처음 만나는 면이 됩니다 — 잘 젖고, 계면 IMC가 Ni₃Sn₄ 대신 Cu₆Sn₅ 쪽으로 갑니다 (흔히 드는 이유). 그래서 Cu 도금액을 두 번 씁니다(Cu 기둥 · 상부 Cu). 보통 한 장비 안에서 Ni를 헹군 뒤 마르지 않게 바로 상부 Cu 셀로 옮깁니다 — Ni 표면에는 금방 얇은 산화막(부동태)이 생겨 그 위 Cu의 밀착이 약해질 수 있기 때문입니다 (필요하면 산 담금으로 활성화).',
  core: '<b>코어 다이</b>(DRAM 다이, 여러 장 쌓임)의 범프는 아래 다이의 후면 패드에 붙습니다. 12~16단을 정해진 높이 안에 넣어야 해서 접합부가 낮을수록 좋아, Cu 기둥 없이 시드 위에 바로 Ni를 두껍게 올려 몸통 겸 방벽으로 씁니다 (흔히 드는 이유). 도금이 두 단계라 짧고, 시드 위 첫 밀착과 Ni 막 응력이 중요합니다. Ni는 Sn과 반응해 Ni₃Sn₄가 되므로 다 먹히지 않을 만큼은 있어야 합니다.'
};
function subHtml(s){
  const t = subn(s), k = t.indexOf(' — '), skip = (SKIP[die] || []).includes(s);
  return `<span class="st"${skip ? ' style="opacity:.6"' : ''}><b>${esc(k < 0 ? t : t.slice(0, k))}</b>${k < 0 ? '' : `<em>${esc(t.slice(k + 3))}</em>`}</span>`;
}
const chipsHtml = sp => dv(sp.check).map(c => chip('관리', c)).join('');
const defHtml = sp => `<b>자주 보는 불량</b> ${dv(sp.defect).map(esc).join(' · ')}`;
function stepCard(sp){
  const subs = sp.states.length > 1 ? `<ol class="steps">${sp.states.map((s, k) => `<li data-k="${k}"><span class="n">${k + 1}</span>${subHtml(s)}</li>`).join('')}</ol>` : '';
  let extra = '';
  if (sp.id === 'ecd') extra = `<div class="btns" role="group" aria-label="범프 구조">${dieBtns('jb')}</div><p class="bp-dnote">${DNOTE[die]}</p>
    <p class="hint">예시 두께 (공개 문헌 수준) — 베이스 다이: Cu 기둥 12 + Ni 3 + 상부 Cu 3 + SnAg 12 = 30 µm · 코어 다이: Ni 5 + SnAg 12 = 17 µm. ③ 단면의 범프 층도 이 비율로 그렸습니다 (시드층 두께와 가로 배율은 과장).</p>
    <div class="btns"><button class="jb" data-act="map" aria-pressed="false">웨이퍼 안 높이 분포 보기 (예시)</button></div><p class="hint">두께 계산은 <a href="#go-edu-3">03 모듈의 도금 두께 계산기</a>, 관리 포인트는 <a href="#go-edu-5">05 모듈 10절</a>, 도금의 원리 · 장비 · 불량은 <a href="#go-plating">전해도금</a> 탭.</p>`;
  if (sp.id === 'reflow') extra = `<div class="bp-rf"><svg viewBox="0 0 400 150" class="bp-rfsvg"><path d="M20,130 L390,130 M20,130 L20,10" class="s-edge"/><path class="tl-prof" d="M22,126 C60,110 90,96 130,90 L200,86 C230,80 246,36 262,32 C276,30 290,62 306,92 L388,124"/><line x1="22" y1="58" x2="390" y2="58" class="s-acc2" stroke-dasharray="6 5"/><text x="388" y="52" class="t-warn" text-anchor="end" style="font-size:14px">녹는점</text><text x="24" y="146" class="t-dim" style="font-size:13px">예열</text><text x="250" y="146" class="t-dim" style="font-size:13px">녹임</text><text x="340" y="146" class="t-dim" style="font-size:13px">냉각</text><circle class="k-acc2 bp-rfdot" r="7" cx="22" cy="126"/></svg>
    <div class="ctl"><label>시간을 움직여 보기 <output data-o="rf"></output></label><input type="range" data-i="rf" min="0" max="100" value="100"></div><p class="note">녹는점을 넘는 순간 솔더가 둥글어진다 (범프 단면에 바로 보임). 프로파일 모양은 예시.</p></div>`;
  return `<div class="kick">공정 ${sp.no} / 12 · ${esc(sp.tool)}${sp.star ? '<span class="star">★ 도금</span>' : ''}</div><h3>${esc(sp.name)}</h3><p class="bp-why">${esc(dv(sp.why))}</p>${subs}
    <div class="chips">${chipsHtml(sp)}</div>
    <p class="bp-def">${defHtml(sp)}</p><p class="bp-out">→ 다음 공정으로: ${esc(dv(sp.out))}</p>${extra}`;
}
// 범프 구조를 바꾸면 카드 글만 다시 쓴다 (버튼 · 슬라이더는 그대로)
function refreshCards(){
  blocks.forEach(b => {
    const sp = b.sp, c = b.card;
    if (!sp) return;
    c.querySelector('.bp-why').textContent = dv(sp.why);
    c.querySelectorAll('.steps li').forEach((li, k) => { li.querySelector('.st').outerHTML = subHtml(sp.states[k]); });
    c.querySelector('.chips').innerHTML = chipsHtml(sp);
    c.querySelector('.bp-def').innerHTML = defHtml(sp);
    c.querySelector('.bp-out').textContent = '→ 다음 공정으로: ' + dv(sp.out);
    const n = c.querySelector('.bp-dnote');
    if (n) n.innerHTML = DNOTE[die];
  });
}

/* ---------------- 5. 엔진 ---------------- */
let built = false, root, stage, svg, els = [], blocks = [], beats = [], pres = null, auto = null, cur = null, VB = {k: 1, ox: 0, oy: 0}, solderAnim = null;
const reduced = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e){ return false; } })();
const stacked = () => getComputedStyle(root).display === 'block';

function setSolder(m){
  svg.querySelectorAll('.bp-dome').forEach(p => p.setAttribute('d', solderPath(+p.getAttribute('data-d'), m, GEO[p.getAttribute('data-g')])));
}
function apply(s, opts){
  if (!svg || !(s in IDX)) return;
  const prev = cur;
  cur = s;
  const i = IDX[s], step = STEP_OF[s];
  svg.dataset.state = s; svg.dataset.step = step;
  els.forEach(el => {
    let v = true;
    const a = el.getAttribute('data-on'), b = el.getAttribute('data-off'), sts = el.getAttribute('data-st'), sp = el.getAttribute('data-step'), dn = el.getAttribute('data-die');
    if (dn != null && dn !== die) v = false;
    if (a != null && i < IDX[a]) v = false;
    if (b != null && i >= IDX[b]) v = false;
    if (sts != null && !sts.split(' ').includes(s)) v = false;
    if (sp != null && !sp.split(' ').includes(step)) v = false;
    el.classList.toggle('off', !v);
  });
  // 리플로우에 처음 들어오면 솔더가 녹아 둥글어지는 모습
  if (solderAnim){ cancelAnimationFrame(solderAnim); solderAnim = null; }
  if (s === 'reflow' && prev && IDX[prev] < IDX.reflow && !reduced && !(opts && opts.keepSolder)){
    const t0 = performance.now();
    const f = now => { const p = clamp((now - t0 - 350) / 1300); setSolder(p * p * (3 - 2 * p)); solderAnim = p < 1 ? requestAnimationFrame(f) : null; };
    setSolder(0); solderAnim = requestAnimationFrame(f);
  } else if (!(opts && opts.keepSolder)) setSolder(1);
  if (prev == null || STEP_OF[prev] !== step) svg.querySelector('#bp-check').innerHTML = checkBox(step);
  hud();
  syncCards();
}
function hud(){
  const step = STEP_OF[cur], sp = STEPS[SI[step]];
  const head = stage.querySelector('.bp-head');
  head.querySelector('.no').textContent = sp ? sp.no : '00';
  head.querySelector('.nm').textContent = sp ? sp.name : '입고';
  head.querySelector('.tl2').textContent = sp ? sp.tool : '앞 공정에서';
  head.querySelector('.sb').textContent = subn(cur) || (sp ? dv(sp.why).split('. ')[0] + '.' : '');
  stage.querySelectorAll('.bp-line button').forEach(b => {
    const k = +b.dataset.k, si = sp ? SI[step] : -1;
    b.classList.toggle('on', k === si); b.classList.toggle('past', k < si);
  });
  const pr = stage.querySelector('.bp-line .bar i');
  pr.style.width = (100 * IDX[cur] / (ORDER.length - 1)) + '%';
}
function syncCards(){
  blocks.forEach(b => {
    if (!b.card || b.n < 2) return;
    const k = b.states.indexOf(cur);
    b.card.querySelectorAll('.steps li').forEach((li, j) => { li.classList.toggle('on', j === k); li.classList.toggle('done', k >= 0 && j < k); });
  });
}

// 보기: 세 단위를 한 화면에(all) 또는 한 단위만 크게
const FOCUS = {all: {x: 14, y: 96, w: 1574, h: 846}, wafer: {x: 16, y: 96, w: 408, h: 846}, die: {x: 441, y: 96, w: 428, h: 846}, bump: {x: 884, y: 96, w: 702, h: 846}};
let focus = 'all', fcur = Object.assign({}, FOCUS.all), fanim = null;
function fitView(){
  const r = stage.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const ins = stacked() ? {l: 4, t: 56, r: 4, b: 116} : pres ? {l: 20, t: 124, r: 20, b: 176} : {l: 10, t: 108, r: 10, b: 70};   // 위 · 아래 여백에 「범프 구조」 버튼 줄
  const f = fcur, sw = Math.max(80, r.width - ins.l - ins.r), sh = Math.max(80, r.height - ins.t - ins.b);
  const k = Math.min(sw / f.w, sh / f.h);
  const ox = ins.l + (sw - f.w * k) / 2 - f.x * k, oy = ins.t + (sh - f.h * k) / 2 - f.y * k;
  VB = {k, ox, oy};
  svg.setAttribute('viewBox', `${q1(-ox / k)} ${q1(-oy / k)} ${q1(r.width / k)} ${q1(r.height / k)}`);
}
function setFocus(name){
  focus = name;
  stage.querySelectorAll('.bp-views button[data-v]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === name ? 'true' : 'false'));
  if (fanim) cancelAnimationFrame(fanim);
  const from = Object.assign({}, fcur), to = FOCUS[name], t0 = performance.now();
  const f = now => {
    const t = reduced ? 1 : clamp((now - t0) / 650), e = t * t * (3 - 2 * t);
    for (const k of ['x', 'y', 'w', 'h']) fcur[k] = lerp(from[k], to[k], e);
    fitView();
    fanim = t < 1 ? requestAnimationFrame(f) : null;
  };
  fanim = requestAnimationFrame(f);
}

// 「범프 구조」 버튼 줄 — 보기 버튼(.bp-views) 아래 · 발표 모드는 위 가운데 · 전화기는 보기 버튼 위
// .off 인 요소의 무한 애니메이션(bpPulse 등)을 멈춘다 — 그대로 두면 Chromium이 사라진 리플로우 열기 · 플라즈마 띠를 화면에 남겨 두기도 한다
// .bp-uv 는 세로선이라 상자 폭이 0 — bp-glow 필터를 걸면 아예 그려지지 않아 필터를 뺀다
const DIE_CSS = `.bp-svg .off,.bp-svg .off *{animation:none}
.bp-svg .bp-uv{filter:none}
.bp-head .tx{min-width:0}
.bp-die{position:absolute;right:14px;top:80px;display:flex;gap:4px;align-items:center}
.bp-die .lb{font-size:11.5px;color:#8193ad;margin-right:2px}
.bp-die button{font:inherit;font-size:12px;border:1px solid rgba(245,158,11,.4);background:rgba(10,18,34,.78);color:#e2d3b0;border-radius:8px;padding:3px 9px;cursor:pointer}
.bp-die button[aria-pressed="true"]{background:var(--j-acc2);border-color:var(--j-acc2);color:#1b1203;font-weight:800}
.jz.pres.bp .bp-die{top:40px;right:auto;left:50%;transform:translateX(-50%)}
@media (max-width:1000px){.bp-die,.jz.pres.bp .bp-die{top:auto;bottom:76px;left:8px;right:auto;transform:none;z-index:2}.bp-die button{font-size:11px;padding:3px 7px}
.jz.pres.bp .bp-views,.jz.pres.bp .jz-tools{top:auto;bottom:52px}.jz.pres.bp .bp-die{bottom:84px}
.jz.pres.bp .jz-cap{left:8px;width:calc(100% - 16px);transform:none;bottom:116px;padding:8px 12px}.jz.pres.bp .jz-cap .t{font-size:17px}.jz.pres.bp .jz-cap .d{font-size:13px;line-height:1.5}}`;   // 전화기 발표 모드: 보기 버튼이 위아래로 늘어나고 설명 상자가 좁아지던 것을 바로잡는다
function build(){
  built = true;
  if (!document.getElementById('bp-die-css')){ const st = document.createElement('style'); st.id = 'bp-die-css'; st.textContent = DIE_CSS; document.head.appendChild(st); }
  VIEW.innerHTML = '';
  VIEW.tabIndex = -1;
  root = h('div', 'jz bp');
  stage = h('div', 'jz-stage');
  svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'jz-svg bp-svg');
  svg.setAttribute('viewBox', `0 0 ${W0} ${H0}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.dataset.die = die;
  svg.innerHTML = `<defs>
    <filter id="bp-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <clipPath id="bp-wclip"><circle cx="${WC.x}" cy="${WC.y}" r="${WC.r}"/></clipPath>
    <clipPath id="bp-bclip"><rect x="0" y="0" width="${BW}" height="${BH}" rx="10"/></clipPath>
    <pattern id="bp-p-hole" width="22" height="22" patternUnits="userSpaceOnUse" x="${WC.x + 11}" y="${WC.y + 11}"><rect width="22" height="22" fill="#5d4a9c"/>${[5, 11, 17].map(a => [5, 11, 17].map(b => `<circle cx="${a}" cy="${b}" r="1.6" fill="#c98b55"/>`).join('')).join('')}</pattern>
    <pattern id="bp-p-cu" width="22" height="22" patternUnits="userSpaceOnUse" x="${WC.x + 11}" y="${WC.y + 11}">${[5, 11, 17].map(a => [5, 11, 17].map(b => `<circle cx="${a}" cy="${b}" r="2.2" fill="#e08a45"/>`).join('')).join('')}</pattern>
    <pattern id="bp-p-ni" width="22" height="22" patternUnits="userSpaceOnUse" x="${WC.x + 11}" y="${WC.y + 11}">${[5, 11, 17].map(a => [5, 11, 17].map(b => `<circle cx="${a}" cy="${b}" r="2.2" fill="#aab4c3"/>`).join('')).join('')}</pattern>
    <pattern id="bp-p-sn" width="22" height="22" patternUnits="userSpaceOnUse" x="${WC.x + 11}" y="${WC.y + 11}">${[5, 11, 17].map(a => [5, 11, 17].map(b => `<circle cx="${a}" cy="${b}" r="2.4" fill="#e2e8f0"/>`).join('')).join('')}</pattern>
    <radialGradient id="bp-g-map"><stop offset="0" stop-color="#2563eb" stop-opacity=".55"/><stop offset=".6" stop-color="#22c55e" stop-opacity=".45"/><stop offset=".85" stop-color="#f59e0b" stop-opacity=".6"/><stop offset="1" stop-color="#ef4444" stop-opacity=".75"/></radialGradient>
    <radialGradient id="bp-g-dome" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".45" stop-color="#cbd5e1" stop-opacity=".5"/><stop offset="1" stop-color="#64748b" stop-opacity="0"/></radialGradient>
  </defs><g id="bp-scene">${drawStage()}</g>`;
  els = [...svg.querySelectorAll('[data-on],[data-off],[data-st],[data-step],[data-die]')];
  stage.appendChild(svg);
  const hudEl = h('div', 'jz-hud', `
    <div class="bp-head"><div class="no"></div><div class="tx"><div class="nm"></div><div class="tl2"></div><div class="sb"></div></div></div>
    <div class="bp-views" role="group" aria-label="보기"><button data-v="all" aria-pressed="true">한 화면</button><button data-v="wafer" aria-pressed="false">① 웨이퍼</button><button data-v="die" aria-pressed="false">② 다이</button><button data-v="bump" aria-pressed="false">③ 범프</button></div>
    <div class="bp-die" role="group" aria-label="범프 구조"><span class="lb">범프 구조</span>${dieBtns('')}</div>
    <div class="jz-tools"><button data-act="auto" title="한 단계씩 자동으로 넘기기"><span class="tl">⏵ 자동 재생</span><span class="ts">⏵ 자동</span></button><button class="pres" data-act="pres" title="전체 화면, ← → 키로 넘기기"><span class="tl">▶ 발표 모드</span><span class="ts">▶ 발표</span></button></div>
    <div class="bp-line"><div class="bar"><i></i></div><div class="chipsr"></div></div>
    <div class="jz-tip" role="tooltip"></div>
    <div class="jz-cap"><div class="k"></div><div class="t"></div><div class="d"></div></div>
    <div class="jz-pres"><span class="cnt"></span><button data-act="auto2">⏵ 자동</button><button data-act="prev">◀ 이전</button><button data-act="next">다음 ▶</button><button data-act="exit">✕ 닫기</button></div>`);
  stage.appendChild(hudEl);
  const line = hudEl.querySelector('.bp-line .chipsr');
  STEPS.forEach((sp, k) => { const b = h('button', null, `<b>${sp.no}</b> ${esc(sp.short)}`); b.dataset.k = k; b.title = sp.name; b.addEventListener('click', () => gotoState(sp.states[0])); line.appendChild(b); });
  hudEl.querySelector('[data-act=pres]').addEventListener('click', enterPres);
  hudEl.querySelectorAll('.bp-views button').forEach(b => b.addEventListener('click', () => setFocus(b.dataset.v)));
  hudEl.querySelectorAll('[data-dsel]').forEach(b => b.addEventListener('click', () => setDie(b.dataset.dsel)));
  hudEl.querySelector('[data-act=auto]').addEventListener('click', () => { if (!pres) enterPres(); toggleAuto(true); });
  hudEl.querySelector('[data-act=auto2]').addEventListener('click', () => toggleAuto());
  hudEl.querySelector('[data-act=prev]').addEventListener('click', () => presGo(pres.k - 1));
  hudEl.querySelector('[data-act=next]').addEventListener('click', () => presGo(pres.k + 1));
  hudEl.querySelector('[data-act=exit]').addEventListener('click', () => exitPres());
  // 툴팁
  const tipEl = hudEl.querySelector('.jz-tip');
  svg.addEventListener('pointermove', ev => {
    const t = ev.target.closest && ev.target.closest('[data-tip]');
    if (!t || t.closest('.off')){ tipEl.style.display = 'none'; return; }
    tipEl.textContent = t.getAttribute('data-tip');
    tipEl.style.display = 'block';
    const r = stage.getBoundingClientRect();
    tipEl.style.left = Math.min(ev.clientX - r.left + 14, r.width - tipEl.offsetWidth - 8) + 'px';
    tipEl.style.top = Math.min(ev.clientY - r.top + 14, r.height - tipEl.offsetHeight - 8) + 'px';
  });
  svg.addEventListener('pointerleave', () => { tipEl.style.display = 'none'; });
  root.appendChild(stage);
  const col = h('div', 'jz-cards');
  root.appendChild(col);
  VIEW.appendChild(root);
  buildCards();
  VIEW.addEventListener('scroll', onScroll, {passive: true});
  ['wheel', 'touchstart', 'mousedown'].forEach(t => VIEW.addEventListener(t, cancelScrollAnim, {passive: true}));
  window.addEventListener('resize', () => { if (VIEW.classList.contains('active')){ fitView(); measure(); onScroll(); } });
  if (window.ResizeObserver){
    new ResizeObserver(() => { if (VIEW.classList.contains('active') && !pres){ measure(); onScroll(); } }).observe(col);
    new ResizeObserver(() => fitView()).observe(stage);
  }
  document.addEventListener('keydown', onKey);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && pres) exitPres(true); });
  fitView();
  apply('in');
}

function buildCards(){
  const col = root.querySelector('.jz-cards');
  col.innerHTML = '';
  blocks = [];
  const add = (html, states, cls, sp) => {
    const wrap = h('div', 'jcw'), card = h('div', 'jc' + (cls ? ' ' + cls : ''), html);
    if (states.length > 1){ wrap.classList.add('multi'); wrap.style.minHeight = (states.length * 34 + 40) + 'vh'; }
    wrap.appendChild(card); col.appendChild(wrap);
    const b = {el: wrap, card, states, n: states.length, sp};
    blocks.push(b);
    card.querySelectorAll('.steps li').forEach(li => li.addEventListener('click', () => scrollToBlock(b, (+li.dataset.k + 0.5) / b.n)));
    return card;
  };
  add(`<div class="kick">앞면 범프 공정</div><div class="big">웨이퍼 · 다이 · 범프</div><h3>도금 범프는 이렇게 만든다 — 12단계</h3>
    <p>한 화면에서 <b>세 단위</b>를 동시에 봅니다. ① 장비 안의 웨이퍼와 위에서 본 웨이퍼, ② 다이 위의 범프 배열, ③ 범프 하나의 단면. 스크롤하면 공정이 한 단계씩 진행됩니다.</p>
    <p>③ 단면은 <b>베이스 다이 범프(Cu / Ni / Cu / SnAg)</b>를 기준으로 그립니다 — 아래부터 Cu 기둥, Ni, <b>상부 Cu</b>(Ni 위에 얇게 한 번 더 올린 Cu), SnAg. <b>코어 다이(Ni / SnAg)</b>는 「범프 구조」 버튼으로 바꿔 다른 점을 따로 짚습니다 — Cu 기둥 없이 Ni → SnAg 두 번만 도금합니다.</p>
    <ul class="jl"><li>처음 모습: 회로가 완성되고 <b>패드가 열린 웨이퍼</b> (앞면이 위)</li><li>아래 공정 칩을 누르면 바로 이동 · ← → 키로 한 단계씩</li><li>「한 화면 · ① ② ③」으로 한 단위만 크게 (키 0~3)</li><li>「범프 구조」 — 베이스 다이 ↔ 코어 다이 범프로 바꿔 보기</li><li><b>▶ 발표 모드</b> — 전체 화면 · <b>⏵ 자동 재생</b></li><li>부품에 마우스 — 이름·역할</li></ul>
    <p class="hint">HBM 전체 흐름에서 이 공정의 자리는 <a href="#go-hbm">HBM 역추적</a> 9장(앞면 범프·캐리어 — 코어 다이 웨이퍼를 따라감)입니다. 일반적인 수준의 설명이며 특정 회사의 조건이 아닙니다.</p>`, ['in'], 'intro');
  STEPS.forEach(sp => {
    const card = add(stepCard(sp), sp.states, null, sp);
    card.querySelectorAll('[data-dsel]').forEach(b => b.addEventListener('click', () => setDie(b.dataset.dsel)));
    const mb = card.querySelector('[data-act=map]');
    if (mb) mb.addEventListener('click', () => { const v = !svg.classList.contains('show-map'); svg.classList.toggle('show-map', v); mb.setAttribute('aria-pressed', v ? 'true' : 'false'); });
    const rf = card.querySelector('[data-i=rf]');
    if (rf){
      const dot = card.querySelector('.bp-rfdot'), path = card.querySelector('.tl-prof'), out = card.querySelector('[data-o=rf]');
      const upd = () => {
        const t = +rf.value / 100, len = path.getTotalLength(), pt = path.getPointAtLength(t * len);
        dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
        // 녹는점 선(y 58) 위로 올라간 구간을 지나면 둥글어진다
        let melt = 0; for (let k = 0; k <= 40; k++){ const q = path.getPointAtLength(k / 40 * t * len); if (q.y < 58){ melt = 1; break; } }
        out.textContent = melt ? '녹음 → 둥근 모양' : '아직 고체 (원기둥)';
        if (cur !== 'reflow') apply('reflow', {keepSolder: true});
        if (solderAnim){ cancelAnimationFrame(solderAnim); solderAnim = null; }
        setSolder(melt);
      };
      rf.addEventListener('input', upd);
      requestAnimationFrame(() => { try { const len = path.getTotalLength(), pt = path.getPointAtLength(len); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); out.textContent = '녹음 → 둥근 모양'; } catch (e){} });
    }
  });
  const outro = add(`<div class="kick">정리</div><h3>한 장으로 다시 보기</h3>
    <ol class="flow">${STEPS.map(sp => `<li>${esc(sp.name)} <span>(${esc(sp.tool)})</span></li>`).join('')}</ol>
    <div class="btns"><button class="jb primary" data-act="top">처음부터 다시</button><button class="jb" data-act="pres">▶ 발표 모드</button></div>
    <p><b>스스로 점검</b></p><ul class="jl"><li>Ti와 Cu 시드는 각각 왜 필요할까?</li><li>디스컴이 부족하면 도금에서 무엇이 생길까?</li><li>범프 높이가 웨이퍼 가장자리에서 높아지기 쉬운 이유는?</li><li>코어 다이 범프에는 왜 Cu 기둥이 없고, 베이스 다이 범프에는 왜 상부 Cu가 있을까?</li><li>시드 식각이 덜 되면 / 너무 되면?</li><li>리플로우 전 플라즈마 처리는 왜 할까?</li><li>내 장비는 이 흐름의 어디에 있고, 앞뒤 공정에 무엇을 넘겨주나?</li></ul>
    <p class="hint">다음: 외관·높이 검사 → 캐리어 본딩 → 후면 공정 (<a href="#go-hbm">HBM 역추적</a>) · 관리 포인트 <a href="#go-edu-5">05 제조기술의 기초</a></p>`, ['scrub']);
  outro.querySelector('[data-act=top]').addEventListener('click', () => scrollViewTo(0, false));
  outro.querySelector('[data-act=pres]').addEventListener('click', enterPres);
  beats = [];
  blocks.forEach(b => b.states.forEach((s, k) => beats.push({b, sub: k, s})));
  measure();
}
function measure(){
  const vr = VIEW.getBoundingClientRect();
  blocks.forEach(b => { const r = b.el.getBoundingClientRect(); b.top = r.top - vr.top + VIEW.scrollTop; b.h = r.height; });
}
function anchorOffset(){
  if (stacked()){ const sh = stage.offsetHeight; return sh + (VIEW.clientHeight - sh) * 0.2; }
  return VIEW.clientHeight * 0.5;
}
function resolvePos(){
  const a = VIEW.scrollTop + anchorOffset();
  let b = blocks.find(x => a >= x.top && a < x.top + x.h);
  if (!b){ let best = Infinity; for (const x of blocks){ const d = a < x.top ? x.top - a : a - (x.top + x.h); if (d < best){ best = d; b = x; } } }
  const sub = b.n > 1 ? Math.min(b.n - 1, Math.floor(clamp((a - b.top) / b.h) * b.n)) : 0;
  return {b, sub};
}
let ticking = false, activeCard = null;
function onScroll(){
  if (ticking || pres) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    if (pres) return;
    const {b, sub} = resolvePos();
    if (activeCard !== b){ if (activeCard) activeCard.card.classList.remove('active'); activeCard = b; b.card.classList.add('active'); }
    if (b.states[sub] !== cur) apply(b.states[sub]);
  });
}
let scrollAnim = null, restoreTok = 0;
function cancelScrollAnim(){ restoreTok++; if (scrollAnim){ cancelAnimationFrame(scrollAnim); scrollAnim = null; } }
function scrollViewTo(top, animate){
  cancelScrollAnim();
  top = clamp(top, 0, Math.max(0, VIEW.scrollHeight - VIEW.clientHeight));
  const from = VIEW.scrollTop, dist = top - from;
  if (!animate || reduced || Math.abs(dist) < 4){ VIEW.scrollTop = top; return; }
  const dur = clamp(Math.abs(dist) / Math.max(1, VIEW.clientHeight) * 400, 350, 1400), t0 = performance.now();
  const step = now => { const t = clamp((now - t0) / dur); VIEW.scrollTop = from + dist * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); scrollAnim = t < 1 ? requestAnimationFrame(step) : null; };
  scrollAnim = requestAnimationFrame(step);
}
function scrollToBlock(b, frac){ measure(); scrollViewTo(b.top + frac * b.h - anchorOffset(), true); }
function gotoBeat(k){
  k = clamp(k, 0, beats.length - 1);
  if (pres) return presGo(k);
  const bt = beats[k]; scrollToBlock(bt.b, (bt.sub + 0.5) / bt.b.n);
}
function gotoState(s){ const k = beats.findIndex(x => x.s === s && x.b !== blocks[blocks.length - 1]); if (k >= 0) gotoBeat(k); }
function curBeat(){
  if (pres) return pres.k;
  const {b, sub} = resolvePos();
  return Math.max(0, beats.findIndex(x => x.b === b && x.sub === sub));
}

/* ---- 범프 구조 (베이스 · 코어) ---- */
function setDie(n){
  if (!(n in GEO)) return;
  if (!svg){ die = n; return; }                                   // 탭을 열기 전: 처음 그릴 때 쓴다
  root.querySelectorAll('[data-dsel]').forEach(b => b.setAttribute('aria-pressed', b.dataset.dsel === n ? 'true' : 'false'));
  if (n === die) return;
  // 지금 보던 카드가 제자리에 있도록: 바꾸기 전 카드 위치를 기억했다가 글이 바뀐 뒤 맞춘다
  const keep = !pres && blocks.length ? resolvePos().b : null, off = keep ? keep.top - VIEW.scrollTop : 0;
  die = n;
  svg.dataset.die = n;
  refreshCards();
  if (cur) svg.querySelector('#bp-check').innerHTML = checkBox(STEP_OF[cur]);
  if (cur) apply(cur, {keepSolder: !solderAnim});                // 녹는 중이었으면 다 녹은 모양으로, 아니면 슬라이더로 정한 모양 그대로
  if (pres) presApply();
  else if (keep){ measure(); VIEW.scrollTop = Math.max(0, keep.top - off); }
}

/* ---- 발표 모드 ---- */
function enterPres(){
  if (pres) return;
  pres = {k: curBeat()};
  root.classList.add('pres');
  try { if (root.requestFullscreen) root.requestFullscreen().catch(() => {}); } catch (e){}
  presApply();
}
function exitPres(fromFs){
  if (!pres) return;
  const bt = beats[pres.k];
  toggleAuto(false);
  pres = null;
  root.classList.remove('pres');
  if (!bt) return;
  // 전체 화면이 다 풀린 뒤에 제자리로 (풀리는 중에는 스크롤 영역 높이가 0이라 맨 위로 잘린다)
  if (!fromFs && document.fullscreenElement){
    let p = null;
    try { p = document.exitFullscreen(); } catch (e){}
    if (p && p.then) p.then(() => restoreBeat(bt), () => restoreBeat(bt)); else restoreBeat(bt);
  } else restoreBeat(bt);
}
function restoreBeat(bt){
  // 몇 프레임 동안 자리가 그대로인지 확인한다. 사용자가 스크롤하면 그만둔다
  const tok = ++restoreTok;
  let n = 0, same = 0;
  const tick = () => {
    if (pres || tok !== restoreTok) return;
    fitView(); measure();
    const top = Math.max(0, bt.b.top + (bt.sub + 0.5) / bt.b.n * bt.b.h - anchorOffset());
    if (Math.abs(VIEW.scrollTop - top) > 2){ VIEW.scrollTop = top; same = 0; } else same++;
    if (same < 6 && ++n < 90) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function presApply(){
  const bt = beats[pres.k];
  apply(bt.s);
  const sp = STEPS[SI[STEP_OF[bt.s]]];
  const cap = stage.querySelector('.jz-cap');
  cap.querySelector('.k').textContent = sp ? `공정 ${sp.no} / 12 · ${sp.tool}` : (bt.b === blocks[blocks.length - 1] ? '정리' : '앞면 범프 공정');
  const sn = subn(bt.s), k = sn ? sn.indexOf(' — ') : -1;
  cap.querySelector('.t').textContent = sp ? sp.name + (sn ? ' — ' + (k < 0 ? sn : sn.slice(0, k)) : '') : '웨이퍼 · 다이 · 범프를 한 화면에';
  let d = sp ? (k >= 0 ? sn.slice(k + 3) + '. ' : '') + dv(sp.why) : SUBN.in + ' — 여기서 12단계를 거쳐 둥근 솔더 범프가 됩니다.';
  if (d.length > 180) d = d.slice(0, 178) + '…';
  cap.querySelector('.d').textContent = d;
  stage.querySelector('.jz-pres .cnt').textContent = `${pres.k + 1} / ${beats.length}`;
}
function presGo(k){
  if (!pres) return;
  k = clamp(k, 0, beats.length - 1);
  if (k === pres.k){ if (auto && k === beats.length - 1) toggleAuto(false); return; }
  pres.k = k; presApply();
}
function toggleAuto(v){
  const want = v == null ? !auto : v;
  if (auto){ clearInterval(auto); auto = null; }
  if (want && pres) auto = setInterval(() => { if (!pres) return toggleAuto(false); if (pres.k >= beats.length - 1) return toggleAuto(false); presGo(pres.k + 1); }, 3400);
  stage.querySelectorAll('[data-act=auto],[data-act=auto2]').forEach(b => b.classList.toggle('on', !!auto));
}
function onKey(ev){
  if (!VIEW.classList.contains('active')) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
  if (typing || ev.ctrlKey || ev.metaKey || ev.altKey || document.querySelector('#modal-back.open')) return;
  const vk = {'0': 'all', '1': 'wafer', '2': 'die', '3': 'bump'}[ev.key];
  if (vk){ ev.preventDefault(); setFocus(vk); return; }
  if (!pres){
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft'){ ev.preventDefault(); gotoBeat(curBeat() + (ev.key === 'ArrowRight' ? 1 : -1)); }
    return;
  }
  if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(ev.key)){ ev.preventDefault(); toggleAuto(false); presGo(pres.k + 1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(ev.key)){ ev.preventDefault(); toggleAuto(false); presGo(pres.k - 1); }
  else if (ev.key === 'Home'){ ev.preventDefault(); presGo(0); }
  else if (ev.key === 'End'){ ev.preventDefault(); presGo(beats.length - 1); }
  else if (ev.key === 'Escape'){ ev.preventDefault(); exitPres(); }
}

/* ---- 탭 연결 ---- */
function activateTab(){
  if (!built) build();
  if (!VIEW.contains(document.activeElement)) try { VIEW.focus({preventScroll: true}); } catch (e){}
  requestAnimationFrame(() => { fitView(); measure(); onScroll(); });
}
document.addEventListener('engr:tab', ev => { if (ev.detail === 'bump') activateTab(); });
if (VIEW.classList.contains('active')) activateTab();
window.EngrBump = {
  get state(){ return {state: cur, step: STEP_OF[cur], pres: pres ? pres.k : null, beats: beats.length, auto: !!auto, die}; },
  apply: s => apply(s), setFocus: v => setFocus(v), setDie: n => setDie(n), gotoBeat: k => gotoBeat(k), enterPres: () => enterPres(), exitPres: () => exitPres(), order: ORDER, blocks: () => blocks
};
})();
