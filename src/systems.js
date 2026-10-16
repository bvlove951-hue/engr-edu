/* ================================================================
 * engr-edu · 사내 시스템 지도 — 반도체 공장을 돌리는 사내 시스템을 한 장의 지도로 (고등학생 눈높이)
 *
 * 구조
 *  - 무대(1600×1080 SVG): 가운데 FAB 현장(장비 · lot)과 그 위아래를 감싼 EAP 띠(장비 ↔ 시스템 통역),
 *    위에 기준정보(GMDM → MMDM) · 생산 지휘(MES) · 고장 신고(EES) · 정비(GIPMS),
 *    왼쪽에 물류(RTD → MCS), 아래에 공정 조건(PCS: RMS · EC · APC) · 감시·분석(FDC · TAS) · 품질(SPC · YES).
 *    화살표는 시스템끼리 주고받는 정보. 맨 아래 줄: 데이터 분석은 IPA · Python.
 *  - 상태(ORDER): 지도 → 용어 → 시스템별 설명(PCS는 RMS · EC · APC 세 단계) → 이야기 9단계 → 정리.
 *    상태마다 밝힐 시스템(hl) · 화살표(ed) · 장비 상태등(eq) · 우리 lot의 위치와 상태(lot)가 정해져 있다.
 *    그림 요소는 data-st(이 상태들에서만) / data-xst(이 상태들에서는 숨김) 로 보이고 사라진다.
 *  - 카드: 오른쪽 열. 스크롤하면 상태가 바뀐다. 지도의 상자를 누르면 그 시스템 카드로. ← → 키, 발표 모드.
 *  - 시스템 이름과 역할은 우리 현장의 설명을 따랐다. 회사마다 이름과 나뉘는 방식은 다를 수 있다.
 * ================================================================ */
(function(){
'use strict';
const VIEW = document.getElementById('view-sys');
if (!VIEW) return;

/* ---------------- 1. 도구 ---------------- */
const W0 = 1600, H0 = 1080;
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const q1 = v => Math.round(v * 10) / 10;
const at = o => o ? Object.keys(o).filter(k => o[k] != null && o[k] !== false).map(k => ` ${k}="${esc(o[k])}"`).join('') : '';
const R = (x, y, w, h, c, o) => `<rect x="${q1(x)}" y="${q1(y)}" width="${q1(Math.max(0, w))}" height="${q1(Math.max(0, h))}" class="${c}"${at(o)}/>`;
const C = (x, y, r, c, o) => `<circle cx="${q1(x)}" cy="${q1(y)}" r="${q1(r)}" class="${c}"${at(o)}/>`;
const L = (x1, y1, x2, y2, c, o) => `<line x1="${q1(x1)}" y1="${q1(y1)}" x2="${q1(x2)}" y2="${q1(y2)}" class="${c}"${at(o)}/>`;
const P = (d, c, o) => `<path d="${d}" class="${c}"${at(o)}/>`;
const PG = (pts, c, o) => `<polygon points="${pts.map(p => q1(p[0]) + ',' + q1(p[1])).join(' ')}" class="${c}"${at(o)}/>`;
const T = (x, y, s, c = 't-lbl', a = 'middle', o) => `<text x="${q1(x)}" y="${q1(y)}" class="${c}" text-anchor="${a}"${at(o)}>${esc(s)}</text>`;
const G = (inner, o) => `<g${at(o)}>${inner}</g>`;
const only = list => ({'data-st': list});       // 이 상태들에서만 보인다
const except = list => ({'data-xst': list});    // 이 상태들에서는 숨는다
function h(tag, cls, html){ const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
// 글자 폭 어림 (한글은 글자 크기만큼, 영문은 그보다 좁게)
function tw(s, fs){
  let w = 0;
  for (const ch of String(s)){
    const c = ch.codePointAt(0);
    w += c > 0x2e80 ? fs : /[A-Z0-9]/.test(ch) ? fs * 0.66 : ch === ' ' ? fs * 0.3 : /[·.,:()\-/'|]/.test(ch) ? fs * 0.36 : fs * 0.56;
  }
  return w;
}
// 칸보다 길면 글자 크기를 줄인다
function FT(x, y, s, c, fs, maxW, a = 'start'){
  const w = tw(s, fs), f = w > maxW ? Math.max(9, Math.floor(fs * maxW / w * 10) / 10) : fs;
  return T(x, y, s, c, a, {style: `font-size:${f}px`});
}

/* ---------------- 2. 시스템 ---------------- */
const FAM = {
  base: {name: '기준정보', c: '#a78bfa'},
  mes: {name: '생산 관리', c: '#38bdf8'},
  log: {name: '물류', c: '#a3e635'},
  eap: {name: '장비 연결', c: '#cbd5e1'},
  pcs: {name: '공정 조건', c: '#34d399'},
  watch: {name: '감시·분석', c: '#fbbf24'},
  maint: {name: '정비', c: '#fb923c'},
  qual: {name: '품질', c: '#f472b6'}
};
// box: [x, y, 폭, 높이] · kind: 상자 모양(top 위 줄 · mes · bot 아래 줄 · sub PCS 안 · eap FAB 위아래 띠)
const SYS = {
  mes: {fam: 'mes', kind: 'mes', box: [650, 50, 300, 200], icon: 'tower', ac: 'MES', nick: '공장의 관제탑',
    lines: ['lot · 장비 상태 · lot 이력', 'lot flow · lot hold'], like: '택배 배송 조회 + 내비',
    tip: 'MES (Manufacturing Execution System)\nlot과 장비의 상태, lot flow(공정 순서대로 보내기), lot hold(멈춰 세우기),\nlot 이력(언제 · 어느 장비 · 어떤 recipe로 진행했나)을 관리\n아래 칸: 장비 상태 (초록 가동 · 노랑 대기 · 빨강 고장 · 파랑 PM)'},
  mmdm: {fam: 'base', kind: 'top', box: [330, 78, 200, 150], icon: 'db', ac: 'MMDM', nick: 'MES 기준정보',
    lines: ['제품 · 공정 순서 · recipe', '장비 · FOUP · stocker'], like: '내비의 지도 데이터',
    tip: 'MMDM — MES 기준정보 setup\n제품 설명, lot 코드, 제품별 공정, 공정별 recipe,\n장비 이름 · 장비 기준정보, FOUP, stocker 등'},
  gmdm: {fam: 'base', kind: 'top', box: [30, 78, 180, 150], icon: 'globe', ac: 'GMDM', nick: '최초 기준정보',
    lines: ['MMDM보다 먼저', '기준 코드를 처음 생성'], like: '도로명 주소 원본',
    tip: 'GMDM — MMDM에 필요한 최초 기준정보\n모든 시스템이 같은 이름(코드)을 쓰게 하는 원본'},
  ees: {fam: 'watch', kind: 'top', box: [1070, 78, 190, 150], icon: 'siren', ac: 'EES', nick: '고장 자동 신고',
    lines: ['ALID 알람이 울리면', 'MES에 장비 DOWN'], like: '화재경보기 자동 신고',
    tip: 'EES — 장비가 낸 알람(ALID, Alarm ID)이 울리면\nMES로 장비 DOWN 신호를 보낸다 → 그 장비로 lot이 더 가지 않음'},
  gipms: {fam: 'maint', kind: 'top', box: [1380, 78, 190, 150], icon: 'wrench', ac: 'GIPMS', nick: '장비 건강 수첩',
    lines: ['down inform note', 'PM 주기 · part 관리'], like: '자동차 정비 수첩',
    tip: 'GIPMS — 장비 정비 관리\n장비 down에 대한 inform note, PM 주기 관리,\npart(부품) 출고 · 수리'},
  rtd: {fam: 'log', kind: 'top', box: [30, 300, 170, 150], icon: 'list', ac: 'RTD', nick: '배차 담당',
    lines: ['다음에 넣을 lot과', '장비를 정한다'], like: '택시 배차 앱',
    tip: 'RTD (Real-Time Dispatching)\nMES의 lot · 장비 상태를 보고\n다음에 어떤 lot을 어느 장비에 넣을지 정한다'},
  mcs: {fam: 'log', kind: 'top', box: [30, 482, 170, 150], icon: 'truck', ac: 'MCS', nick: '물류 관제',
    lines: ['FOUP 반송 명령', 'OHT · stocker 관제'], like: '물류센터 로봇 관제실',
    tip: 'MCS (Material Control System)\nOHT · stocker(= AMHS, 자동 반송 설비)에 반송 명령을 내리고\nFOUP이 지금 어디 있는지 추적'},
  eap: {fam: 'eap', kind: 'eap', box: [230, 290, 1340, 356], ac: 'EAP / EIF', nick: '장비 통역사',
    lines: ['장비 말 ↔ 시스템 말', ''], like: '통역사',
    tip: 'EAP / EIF — 장비와 시스템 사이 통신(통역)\n장비가 쓰는 말(SECS/GEM)을 시스템이 알아듣게 바꾼다\n작업 지시 · 진행 보고 · ALID · 센서 값 · DCOL · recipe · ECID가 모두 이 띠를 지난다'},
  fdc: {fam: 'watch', kind: 'bot', box: [30, 716, 236, 300], icon: 'gauge', ac: 'FDC', nick: '센서 경고등',
    lines: ['source data에 spec', '벗어나면 알람이 울린다'], like: '자동차 계기판 경고등',
    tip: 'FDC (Fault Detection and Classification)\n장비 센서 값(source data)에 spec(허용 범위)을 걸어\n벗어나면 알람'},
  tas: {fam: 'watch', kind: 'bot', box: [285, 716, 236, 300], icon: 'chart', ac: 'TAS', nick: '장비 데이터 차트',
    lines: ['DCOL(장비 data)을', '차트로 그려 본다'], like: '스마트워치 건강 그래프',
    tip: 'TAS — DCOL(Data Collection, 장비 data)을 차트로 보는 시스템\n추세 · 장비끼리 비교 · PM 전후 비교'},
  rms: {fam: 'pcs', kind: 'sub', box: [556, 762, 152, 240], icon: 'doc', ac: 'RMS', nick: 'recipe 관리',
    lines: ['원본 보관 · 버전', '장비 recipe와 비교'], like: '요리책 원본',
    tip: 'RMS (Recipe Management System)\nrecipe 원본을 관리하고 장비 안의 recipe와 비교'},
  ec: {fam: 'pcs', kind: 'sub', box: [715, 762, 152, 240], icon: 'slider', ac: 'EC', nick: '장비 상수 관리',
    lines: ['ECID 값을', '기준대로 유지'], like: '오븐 기본 설정',
    tip: 'EC — 장비 상수(ECID, Equipment Constant ID) 관리\n장비마다 정해 둔 설정값이 기준과 같은지'},
  apc: {fam: 'pcs', kind: 'sub', box: [874, 762, 152, 240], icon: 'cycle', ac: 'APC', nick: '자동 recipe 보정',
    lines: ['앞 결과를 보고', '다음 조건을 보정'], like: '간 보고 다시 맞추기',
    tip: 'APC (Advanced Process Control) — 자동 recipe 보정\n앞 lot의 계측 결과를 보고 다음 lot의 조건을 조금씩 조정'},
  spc: {fam: 'qual', kind: 'bot', box: [1057, 716, 236, 300], icon: 'ctrl', ac: 'SPC', nick: '결과 성적표',
    lines: ['계측값을 관리도로', '평소 범위를 벗어나면 알림'], like: '성적표 추이 그래프',
    tip: 'SPC (Statistical Process Control)\n계측값(두께 등 공정 결과)을 관리도로 보고\n관리 한계를 벗어나거나 이상한 패턴이면 알림'},
  yes: {fam: 'qual', kind: 'bot', box: [1312, 716, 258, 300], icon: 'lens', ac: 'YES', nick: '불량 지도 · 사진',
    lines: ['defect data와', 'defect image를 본다'], like: '건강검진 결과지 + X-ray',
    tip: 'YES — defect(불량) data와 defect image를 보는 시스템\n웨이퍼 맵에서 위치 · 개수, 사진으로 종류'}
};
const PCS = {box: [540, 716, 498, 300], tip: 'PCS — 공정 조건 관리\nRMS(recipe 관리) · EC(장비 상수 관리) · APC(자동 recipe 보정)'};
const FAB = {box: [230, 314, 1340, 308]};

// 화살표: pts(꺾이는 점), lbl(글), at(글 위치), a(글 정렬), both(양방향)
const EDGES = [
  {id: 'g-m', fam: 'base', pts: [[210, 153], [330, 153]], lbl: ['최초 기준정보'], at: [270, 153], tip: 'GMDM → MMDM: 최초 기준정보 (예: 제품 코드)'},
  {id: 'm-mes', fam: 'base', pts: [[530, 153], [650, 153]], lbl: ['MES용 기준정보'], at: [590, 153], tip: 'MMDM → MES: 제품 · 공정 순서 · recipe · 장비 · FOUP · stocker'},
  {id: 'ees-mes', fam: 'watch', pts: [[1070, 153], [950, 153]], lbl: ['장비 DOWN'], at: [1010, 153], tip: 'EES → MES: 이 장비 DOWN (lot 보내지 마세요)'},
  {id: 'mes-gi', fam: 'maint', pts: [[900, 50], [900, 26], [1475, 26], [1475, 78]], both: true, lbl: ['장비 상태 (DOWN · PM)'], at: [1188, 26], tip: 'MES ↔ GIPMS: 장비 DOWN · PM 상태'},
  {id: 'mes-rtd', fam: 'log', pts: [[60, 300], [60, 270], [610, 270], [610, 200], [650, 200]], both: true, lbl: ['lot · 장비 상태 ↔ 다음 lot 순서'], at: [340, 270], tip: 'MES → RTD: lot · 장비 상태\nRTD → MES: 다음에 넣을 lot과 장비'},
  {id: 'rtd-mcs', fam: 'log', pts: [[115, 450], [115, 482]], lbl: ['반송 요청'], at: [126, 466], a: 'start', tip: 'RTD → MCS: 이 lot을 저 장비로 (반송 요청)'},
  {id: 'mcs-fab', fam: 'log', pts: [[200, 520], [252, 520]], lbl: ['반송', '명령'], at: [226, 520], tip: 'MCS → OHT · stocker: 반송 명령'},
  {id: 'mes-fab', fam: 'mes', pts: [[740, 250], [740, 290]], lbl: ['작업 지시 (lot · recipe)'], at: [751, 270], a: 'start', tip: 'MES → EAP → 장비: 이 lot을, 이 recipe로'},
  {id: 'fab-mes', fam: 'mes', pts: [[930, 290], [930, 250]], lbl: ['진행 보고 (시작 · 끝)'], at: [941, 270], a: 'start', tip: '장비 → EAP → MES: 작업 시작 · 끝 보고 (track in / out)'},
  {id: 'fab-ees', fam: 'watch', pts: [[1130, 290], [1130, 228]], lbl: ['ALID (장비 알람)'], at: [1141, 262], a: 'start', tip: '장비 → EAP → EES: 장비가 스스로 낸 알람 번호(ALID)'},
  {id: 'gi-fab', fam: 'maint', pts: [[1475, 228], [1475, 314]], lbl: ['PM · 수리 · 부품'], at: [1464, 262], a: 'end', tip: 'GIPMS → 장비: PM · 수리 · 부품 교체 (사람이 직접)'},
  {id: 'fab-fdc', fam: 'watch', pts: [[250, 646], [250, 716]], lbl: ['센서 값 (source data)'], at: [261, 681], a: 'start', tip: '장비 → EAP → FDC: 온도 · 압력 · 전류 · 유량 같은 센서 값'},
  {id: 'fab-tas', fam: 'watch', pts: [[450, 646], [450, 716]], lbl: ['DCOL (장비 data)'], at: [461, 681], a: 'start', tip: '장비 → EAP → TAS: DCOL(장비 data)'},
  {id: 'rms', fam: 'pcs', pts: [[632, 716], [632, 646]], both: true, lbl: ['recipe'], at: [642, 681], a: 'start', tip: 'RMS ↔ EAP ↔ 장비: recipe 원본과 장비 recipe 비교'},
  {id: 'ec', fam: 'pcs', pts: [[791, 716], [791, 646]], both: true, lbl: ['ECID'], at: [801, 681], a: 'start', tip: 'EC ↔ EAP ↔ 장비: 장비 상수(ECID) 값'},
  {id: 'apc-fab', fam: 'pcs', pts: [[930, 716], [930, 646]], lbl: ['보정값'], at: [920, 681], a: 'end', tip: 'APC → 장비: 다음 lot의 보정된 조건'},
  {id: 'fab-apc', fam: 'pcs', pts: [[990, 646], [990, 716]], lbl: ['계측 결과'], at: [1001, 681], a: 'start', tip: '계측 장비 → APC: 앞 lot의 결과(예: 두께)'},
  {id: 'fab-spc', fam: 'qual', pts: [[1175, 646], [1175, 716]], lbl: ['계측값'], at: [1186, 681], a: 'start', tip: '계측 장비 → SPC: 계측값(두께 등)'},
  {id: 'fab-yes', fam: 'qual', pts: [[1440, 646], [1440, 716]], lbl: ['defect · 사진'], at: [1451, 681], a: 'start', tip: '검사 장비 → YES: defect 위치와 사진'}
];
const EQS = [
  {id: 'dep', name: '증착 장비', x: 400, fx: 'dep'},
  {id: 'photo', name: '포토 장비', x: 632, fx: 'photo'},
  {id: 'etch', name: '식각 장비', x: 864, fx: 'etch'},
  {id: 'plate', name: '도금 장비', x: 1096, fx: 'plate', me: true},
  {id: 'insp', name: '계측 · 검사 장비', x: 1328, fx: 'insp'}
];
const EQ0 = {dep: 'run', photo: 'run', etch: 'idle', plate: 'run', insp: 'run'};
const LAMP = {run: '가동', idle: '대기', down: '고장', pm: 'PM'};
const LOTPOS = {stocker: [279, 514], rail: [650, 386], plate: [1114, 514], insp: [1346, 514], next: [1420, 386]};

/* ---------------- 3. 상태 ---------------- */
// tag: 머리 표시 · c: 그 색 · k/t/d: 발표 모드 자막
const ST = {
  intro: {tag: '지도', c: '#38bdf8', hl: 'all', ed: 'all', lot: ['stocker', 'WAIT'],
    k: '사내 시스템 지도', t: '반도체 공장을 돌리는 사내 시스템',
    d: '가운데 FAB 현장에서 장비가 lot(웨이퍼 묶음)을 가공하고, 위아래 EAP 띠가 장비와 시스템 사이를 통역합니다. 위는 기준정보 · MES · 고장 신고 · 정비, 왼쪽은 물류, 아래는 공정 조건 · 감시 · 품질입니다.'},
  words: {tag: '용어', c: '#7dd3fc', hl: ['fab'], ed: [], lot: ['rail', 'MOVE'],
    k: '먼저 알아 둘 말', t: 'lot · FOUP · 장비 · recipe',
    d: 'lot = 함께 움직이는 웨이퍼 25장 묶음(FOUP 통에 담김). 장비는 recipe(요리법)대로 공정을 합니다. OHT가 천장 레일로 lot을 옮기고, stocker는 자동 창고입니다.'},
  mes: {sys: 'mes', hl: ['mes', 'fab'], ed: ['mes-fab', 'fab-mes', 'm-mes', 'ees-mes', 'mes-gi', 'mes-rtd'], lot: ['plate', 'RUN'],
    k: '생산 관리 · MES', t: 'MES — 공장의 관제탑',
    d: '모든 lot이 지금 어디서 무엇을 하는지, 모든 장비가 가동 · 대기 · 고장 · PM 중 어느 상태인지 압니다. 공정 순서(flow)대로 lot을 보내고, 이상이 있으면 hold로 멈춰 세우며, 지나온 기록(lot 이력)을 남깁니다.'},
  rtd: {sys: 'rtd', hl: ['rtd', 'mes', 'mcs'], ed: ['mes-rtd', 'rtd-mcs'], lot: ['stocker', 'WAIT'],
    k: '물류 · RTD', t: 'RTD — 다음 lot을 정하는 배차 담당',
    d: 'MES의 lot · 장비 상태를 실시간으로 보고 "다음에 어떤 lot을 어느 장비에 넣을지" 정합니다. 납기가 급한 lot, 같은 recipe끼리 묶기 같은 규칙으로 순서를 매깁니다.'},
  mcs: {sys: 'mcs', hl: ['mcs', 'rtd', 'fab'], ed: ['rtd-mcs', 'mcs-fab'], lot: ['rail', 'MOVE'],
    k: '물류 · MCS', t: 'MCS — lot을 실제로 옮기는 물류 관제',
    d: 'OHT(천장 운반 로봇)와 stocker(자동 창고)에 "이 FOUP을 저기로" 반송 명령을 내리고, FOUP이 지금 어디 있는지 추적합니다.'},
  mmdm: {sys: 'mmdm', hl: ['mmdm', 'mes'], ed: ['m-mes', 'g-m'], lot: ['stocker', 'WAIT'],
    k: '기준정보 · MMDM', t: 'MMDM — MES의 지도 데이터',
    d: 'MES가 일하는 데 필요한 기준정보를 등록합니다: 제품 설명, lot 코드, 제품별 공정 순서, 공정별 recipe, 장비 이름과 기준정보, FOUP, stocker.'},
  gmdm: {sys: 'gmdm', hl: ['gmdm', 'mmdm'], ed: ['g-m'], lot: ['stocker', 'WAIT'],
    k: '기준정보 · GMDM', t: 'GMDM — 기준정보의 원본',
    d: 'MMDM에 등록하기 전에 필요한 최초 기준정보를 만듭니다. 모든 시스템이 같은 이름(코드)을 써야 서로 말이 통합니다.'},
  eap: {sys: 'eap', hl: ['eap', 'fab', 'mes', 'ees', 'fdc', 'tas', 'pcs', 'rms', 'ec'], ed: ['mes-fab', 'fab-mes', 'fab-ees', 'fab-fdc', 'fab-tas', 'rms', 'ec'], lot: ['plate', 'RUN'],
    k: '장비 연결 · EAP / EIF', t: 'EAP / EIF — 장비와 시스템 사이의 통역사',
    d: '장비는 장비만의 말(SECS/GEM)을 씁니다. EAP가 이를 시스템이 알아듣게 바꿉니다. 작업 지시 · 진행 보고 · ALID · 센서 값 · DCOL · recipe · ECID가 모두 FAB 위아래의 EAP 띠를 지납니다.'},
  rms: {sys: 'rms', hl: ['pcs', 'rms', 'eap', 'fab'], ed: ['rms'], lot: ['plate', 'RUN'],
    k: '공정 조건 · PCS ① RMS', t: 'RMS — recipe 원본 관리',
    d: 'recipe(장비의 요리법) 원본을 보관하고 버전을 관리합니다. 장비 안의 recipe가 원본과 같은지 비교해, 잘못 바뀐 recipe로 일하는 것을 막습니다.'},
  ec: {sys: 'ec', hl: ['pcs', 'ec', 'eap', 'fab'], ed: ['ec'], lot: ['plate', 'RUN'],
    k: '공정 조건 · PCS ② EC', t: 'EC — 장비 상수(ECID) 관리',
    d: '장비마다 정해 둔 설정값(장비 상수, ECID)이 기준값과 같게 유지되는지 관리합니다. recipe가 "무엇을 어떻게"라면 장비 상수는 "이 장비의 기본 설정"입니다.'},
  apc: {sys: 'apc', hl: ['pcs', 'apc', 'eap', 'fab'], ed: ['fab-apc', 'apc-fab'], lot: ['plate', 'RUN'],
    k: '공정 조건 · PCS ③ APC', t: 'APC — 자동 recipe 보정',
    d: '앞 lot의 결과(계측값)를 보고 다음 lot의 조건을 조금씩 자동으로 고칩니다. 두께가 조금 얇게 나왔으면 다음엔 시간을 약간 늘리는 식입니다.'},
  fdc: {sys: 'fdc', hl: ['fdc', 'eap', 'fab'], ed: ['fab-fdc'], lot: ['plate', 'RUN'],
    k: '감시 · 분석 · FDC', t: 'FDC — 센서 경고등',
    d: '장비 센서 값(온도 · 압력 · 전류 · 유량 = source data)에 spec(허용 범위)을 걸어 두고, 벗어나면 알람을 울립니다. 공정 중에 실시간으로, 웨이퍼마다 봅니다.'},
  tas: {sys: 'tas', hl: ['tas', 'eap', 'fab'], ed: ['fab-tas'], lot: ['plate', 'RUN'],
    k: '감시 · 분석 · TAS', t: 'TAS — 장비 데이터 차트',
    d: '장비 데이터(DCOL)를 시간 순서대로 차트로 그려 봅니다. 추세, 장비끼리 비교, PM 전후 비교, "언제부터 달라졌나"를 찾을 때 씁니다.'},
  ees: {sys: 'ees', hl: ['ees', 'eap', 'mes', 'fab'], ed: ['fab-ees', 'ees-mes'], eq: {plate: 'down'}, lot: ['stocker', 'WAIT'],
    k: '감시 · 분석 · EES', t: 'EES — 고장 자동 신고',
    d: '장비가 스스로 낸 알람(ALID)이 울리면 EES가 MES에 "장비 DOWN" 신호를 보냅니다. MES는 그 장비로 lot을 더 보내지 않습니다.'},
  gipms: {sys: 'gipms', hl: ['gipms', 'mes', 'fab'], ed: ['mes-gi', 'gi-fab'], eq: {plate: 'pm'}, lot: ['stocker', 'WAIT'],
    k: '정비 · GIPMS', t: 'GIPMS — 장비 건강 수첩',
    d: '장비 down 때 무슨 일이 있었는지(inform note), PM(정기 점검) 주기, 부품(part) 출고와 수리를 관리합니다.'},
  spc: {sys: 'spc', hl: ['spc', 'eap', 'fab'], ed: ['fab-spc'], lot: ['insp', 'RUN'],
    k: '품질 · SPC', t: 'SPC — 결과의 성적표 그래프',
    d: '계측 장비가 잰 공정 결과(두께 같은 계측값)를 관리도에 차례로 찍어, 평소 범위(관리 한계)를 벗어나거나 이상한 패턴이 보이면 알립니다. FDC가 장비 상태를 본다면 SPC는 만들어진 결과를 봅니다.'},
  yes: {sys: 'yes', hl: ['yes', 'eap', 'fab'], ed: ['fab-yes'], lot: ['insp', 'RUN'],
    k: '품질 · YES', t: 'YES — 불량 지도와 사진',
    d: '검사 장비가 찾은 defect의 위치(웨이퍼 맵)와 사진(image)을 봅니다. 모양과 종류로 원인을 좁히고, lot을 보낼지 멈출지 판단하는 근거가 됩니다.'},
  s1: {tag: '이야기 1', c: '#a78bfa', hl: ['gmdm', 'mmdm', 'mes'], ed: ['g-m', 'm-mes'], lot: null,
    k: '이야기 1/9 · 준비', t: '새 제품이 생겼다',
    d: 'GMDM에 제품 코드가 처음 만들어지고, MMDM에서 공정 순서 · recipe · 장비를 연결합니다. 이제 MES가 이 제품을 알게 됩니다. 아직 lot은 없습니다.'},
  s2: {tag: '이야기 2', c: '#a3e635', hl: ['mes', 'rtd', 'mcs', 'fab'], ed: ['mes-rtd', 'rtd-mcs', 'mcs-fab'], lot: ['rail', 'MOVE'],
    k: '이야기 2/9 · 출발', t: 'lot이 출발한다',
    d: 'MES가 lot(LOT-001)을 만들고 flow에 따라 다음 공정(도금)을 정합니다. RTD가 "LOT-001을 도금 장비로" 순서를 정하면, MCS가 OHT에 반송 명령을 내려 stocker에서 도금 장비로 옮깁니다.'},
  s3: {tag: '이야기 3', c: '#34d399', hl: ['mes', 'eap', 'pcs', 'rms', 'ec', 'apc', 'fab'], ed: ['mes-fab', 'rms', 'ec', 'fab-apc', 'apc-fab'], lot: ['plate', 'WAIT'],
    k: '이야기 3/9 · 시작 전 확인', t: '일하기 전에 조건부터',
    d: 'MES가 EAP를 통해 "이 lot은 이 recipe로" 지시합니다. RMS는 장비 recipe가 원본과 같은지, EC는 장비 상수가 기준값인지 확인하고, APC는 앞 lot 결과를 보고 값을 살짝 보정합니다.'},
  s4: {tag: '이야기 4', c: '#fbbf24', hl: ['eap', 'fdc', 'tas', 'mes', 'fab'], ed: ['fab-fdc', 'fab-tas', 'fab-mes'], lot: ['plate', 'RUN'],
    k: '이야기 4/9 · 가공 중', t: '센서가 쉬지 않고 말한다',
    d: '도금하는 동안 장비 센서 값이 EAP를 거쳐 쏟아집니다. FDC는 spec으로 실시간 감시하고, TAS에는 차트로 쌓입니다. 장비는 MES에 진행 상황을 보고합니다.'},
  s5: {tag: '이야기 5', c: '#ef4444', hl: ['fdc', 'tas', 'mes', 'fab'], ed: ['fab-fdc', 'fab-tas'], eq: {plate: 'idle'}, lot: ['plate', 'HOLD'],
    k: '이야기 5/9 · FDC 알람', t: '온도가 spec 밖으로!',
    d: 'FDC 알람이 울립니다. 엔지니어가 TAS 차트로 언제부터 변했는지 확인하고, 영향을 받았을지 모르는 LOT-001을 MES에서 hold 합니다.'},
  s6: {tag: '이야기 6', c: '#ef4444', hl: ['eap', 'ees', 'mes', 'fab'], ed: ['fab-ees', 'ees-mes'], eq: {plate: 'down'}, lot: ['plate', 'HOLD'],
    k: '이야기 6/9 · 장비 고장', t: '장비가 스스로 알람(ALID)을 냈다',
    d: '펌프 이상 알람(ALID)이 EAP를 거쳐 EES로 가고, EES가 MES에 "장비 DOWN"을 보냅니다. MES는 도금 장비 상태를 DOWN으로 바꾸고 다른 lot을 보내지 않습니다.'},
  s7: {tag: '이야기 7', c: '#fb923c', hl: ['gipms', 'mes', 'fab'], ed: ['mes-gi', 'gi-fab'], eq: {plate: 'pm'}, lot: ['plate', 'HOLD'],
    k: '이야기 7/9 · 수리', t: '고치고, 기록한다',
    d: '엔지니어가 GIPMS에 inform note(무슨 일 · 어떻게 조치)를 쓰고, 부품을 출고해 교체합니다. PM과 확인이 끝나면 장비는 다시 가동 상태가 됩니다.'},
  s8: {tag: '이야기 8', c: '#f472b6', hl: ['spc', 'yes', 'eap', 'mes', 'fab'], ed: ['fab-spc', 'fab-yes', 'fab-mes'], lot: ['insp', 'HOLD'],
    k: '이야기 8/9 · 검사와 판정', t: '웨이퍼는 괜찮을까?',
    d: 'hold 된 LOT-001을 계측 · 검사합니다. SPC에서 두께가 관리 한계 안인지, YES에서 defect 위치와 사진을 보고 이상이 없다고 판정하면, MES에서 hold를 풀어(release) 줍니다.'},
  s9: {tag: '이야기 9', c: '#38bdf8', hl: 'all', ed: ['mes-rtd', 'rtd-mcs', 'mcs-fab'], lot: ['next', 'MOVE'],
    k: '이야기 9/9 · 다음 공정', t: '다음 공정으로',
    d: 'RTD가 다음 장비를 정하고 MCS가 옮깁니다. 지나온 기록(언제 · 어느 장비 · 어떤 recipe · 알람과 판정)은 MES의 lot 이력에 남습니다. 마지막 공정까지 이 과정이 수백 번 되풀이됩니다.'},
  all: {tag: '정리', c: '#38bdf8', hl: 'all', ed: 'all', lot: ['next', 'MOVE'],
    k: '정리', t: '한 장으로 다시 보기',
    d: '기준정보(GMDM → MMDM) → 지휘(MES) · 물류(RTD → MCS) → 장비 연결(EAP) → 조건(PCS) → 감시(FDC · TAS · EES) → 정비(GIPMS) → 품질(SPC · YES). 데이터 분석은 IPA · Python으로.'}
};
const ORDER = Object.keys(ST);
const STORY = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'];
const NAV = [
  {lb: '지도', s: 'intro', c: '#38bdf8'}, {lb: '용어', s: 'words', c: '#7dd3fc'},
  {lb: 'MES', s: 'mes'}, {lb: 'RTD', s: 'rtd'}, {lb: 'MCS', s: 'mcs'}, {lb: 'MMDM', s: 'mmdm'}, {lb: 'GMDM', s: 'gmdm'}, {lb: 'EAP', s: 'eap'},
  {lb: 'PCS', s: 'rms', grp: ['rms', 'ec', 'apc'], c: FAM.pcs.c},
  {lb: 'FDC', s: 'fdc'}, {lb: 'TAS', s: 'tas'}, {lb: 'EES', s: 'ees'}, {lb: 'GIPMS', s: 'gipms'}, {lb: 'SPC', s: 'spc'}, {lb: 'YES', s: 'yes'},
  {lb: '이야기', s: 's1', grp: STORY, c: '#e2e8f0'}, {lb: '정리', s: 'all', c: '#38bdf8'}
];
NAV.forEach(n => { if (!n.c) n.c = FAM[SYS[n.s].fam].c; if (!n.grp) n.grp = [n.s]; });

/* ---------------- 4. 그림 ---------------- */
const ICON = {
  tower: 'M16,41 L19,19 H25 L28,41 Z M9,19 H35 L31,8 H13 Z M13,13.5 H31 M22,8 V2',
  db: 'M8,10 A14,5 0 0 0 36,10 A14,5 0 0 0 8,10 Z M8,10 V34 A14,5 0 0 0 36,34 V10 M8,22 A14,5 0 0 0 36,22',
  globe: 'M6,22 A16,16 0 1 0 38,22 A16,16 0 1 0 6,22 Z M22,6 C13,14 13,30 22,38 C31,30 31,14 22,6 Z M6,22 H38 M9,14 H35 M9,30 H35',
  doc: 'M10,4 H28 L36,12 V40 H10 Z M28,4 V12 H36 M15,20 H31 M15,26 H31 M15,32 H25',
  slider: 'M12,6 V38 M22,6 V38 M32,6 V38',
  cycle: 'M35,17 A14,14 0 1 0 36,27 M35,8 V17 H26',
  gauge: 'M6,34 A16,16 0 0 1 38,34 M22,34 L31,19',
  chart: 'M6,6 V38 H40 M10,30 L17,21 L23,26 L30,13 L38,18',
  ctrl: 'M6,6 V38 H40 M6,12 H40 M6,32 H40 M10,22 L16,19 L22,25 L28,20 L34,23 L38,10',
  siren: 'M12,32 V22 A10,10 0 0 1 32,22 V32 Z M8,32 H36 V38 H8 Z',
  wrench: 'M29,5 A9.5,9.5 0 0 0 21,18 L7,32 A3.6,3.6 0 0 0 12,37 L26,23 A9.5,9.5 0 0 0 39,15 L33,19 L28,17 L27,11 Z',
  lens: 'M6,18 A12,12 0 1 0 30,18 A12,12 0 1 0 6,18 Z M27,27 L39,39',
  list: 'M15,9 H38 M15,22 H38 M15,35 H38',
  truck: 'M4,8 H40 M10,8 V14 M34,8 V14 M8,14 H36 V22 H8 Z M14,22 V28 M30,22 V28 M10,28 H34 V40 H10 Z M14,34 H30',
  bell: 'M13,30 V20 A9,9 0 0 1 31,20 V30 L34,33 H10 Z M19,37 A3,3 0 0 0 25,37'
};
function icon(kind, x, y, s, cls){
  let extra = '';
  if (kind === 'slider') extra = C(12, 28, 4, 'sy-icf') + C(22, 14, 4, 'sy-icf') + C(32, 24, 4, 'sy-icf');
  if (kind === 'gauge') extra = C(22, 34, 3, 'sy-icf') + P('M33,22 L37,19', 'sy-ic sy-icr');
  if (kind === 'lens') extra = C(14, 15, 2.2, 'sy-icf') + C(21, 20, 2.2, 'sy-icf') + C(15, 23, 1.6, 'sy-icf');
  if (kind === 'siren') extra = P('M22,1 V7 M6,8 L10,12 M38,8 L34,12', 'sy-ic sy-ray');
  if (kind === 'list') extra = C(8, 9, 2.6, 'sy-icf') + C(8, 22, 2.6, 'sy-icf') + C(8, 35, 2.6, 'sy-icf');
  if (kind === 'ctrl') extra = C(38, 10, 2.8, 'sy-icf');
  const inner = P(ICON[kind], 'sy-ic') + extra;
  // 흔들리는 아이콘은 안쪽 그룹에 애니메이션을 건다 (CSS transform 이 transform 속성을 덮어쓰지 않게)
  return `<g transform="translate(${q1(x)},${q1(y)}) scale(${Math.round(s / 44 * 1000) / 1000})">${cls ? `<g class="${cls}">${inner}</g>` : inner}</g>`;
}
// 0~1 사이 매끈한 흔들림 (같은 그림이 매번 같게 나오도록 난수 대신)
const wob = k => (Math.sin(k * 1.7) * 0.5 + Math.sin(k * 3.1 + 1) * 0.3 + Math.sin(k * 5.3 + 2) * 0.2);
const path = pts => 'M' + pts.map(p => q1(p[0]) + ',' + q1(p[1])).join(' L');

// 작은 화면: 지도 안(작게)과 카드(크게)에서 같이 쓴다
const MINI = {
  fdc(x, y, w, hh, mode){
    const top = y + 26, bot = y + hh - 22, mid = (top + bot) / 2, n = 28, x0 = x + 40, x1 = x + w - 44;
    let s = R(x, y, w, hh, 'm-scr', {rx: 8});
    s += T(x + 10, y + 16, '온도 (센서 값)', 'm-txt', 'start');
    s += L(x + 8, top, x + w - 8, top, 'm-spec') + T(x + 9, top + 13, 'USL', 'm-spt', 'start');
    s += L(x + 8, bot, x + w - 8, bot, 'm-spec') + T(x + 9, bot - 5, 'LSL', 'm-spt', 'start');
    const norm = [], bad = [];
    for (let k = 0; k < n; k++){
      const xx = lerp(x0, x1, k / (n - 1)), v = mid + wob(k) * (bot - top) * 0.22;
      norm.push([xx, v]);
      bad.push([xx, k < 19 ? v : v - (k - 18) * (bot - top) * 0.07]);
    }
    const peak = bad[n - 1];
    const ok = P(path(norm), 'm-line'), ng = P(path(bad), 'm-line') + C(peak[0], peak[1], 5, 'm-bad') + C(peak[0], peak[1], 10, 'm-ring') +
      G(R(peak[0] + 8, peak[1] - 2, 34, 17, 'm-badbox', {rx: 4}) + T(peak[0] + 25, peak[1] + 10.5, '알람', 'm-badt'));
    if (mode === 'alarm') return s + ng;
    return s + G(ok, except('fdc s5')) + G(ng, only('fdc s5'));
  },
  spc(x, y, w, hh, mode){
    const top = y + 26, bot = y + hh - 14, ucl = lerp(top, bot, 0.16), lcl = lerp(top, bot, 0.84), cl = (ucl + lcl) / 2, n = 13, x0 = x + 42, x1 = x + w - 44;
    let s = R(x, y, w, hh, 'm-scr', {rx: 8});
    s += T(x + 10, y + 16, '두께 (계측값) · lot마다 한 점', 'm-txt', 'start');
    s += L(x + 8, ucl, x + w - 8, ucl, 'm-ucl') + T(x + 9, ucl - 4, 'UCL', 'm-uclt', 'start');
    s += L(x + 8, cl, x + w - 8, cl, 'm-cl') + T(x + 9, cl - 4, 'CL', 'm-clt', 'start');
    s += L(x + 8, lcl, x + w - 8, lcl, 'm-ucl') + T(x + 9, lcl - 5, 'LCL', 'm-uclt', 'start');
    const pts = [];
    for (let k = 0; k < n; k++) pts.push([lerp(x0, x1, k / (n - 1)), cl + wob(k + 3) * (lcl - ucl) * 0.3]);
    const dots = list => list.map(p => C(p[0], p[1], 3, 'm-pt')).join('');
    const ok = P(path(pts), 'm-line m-thin') + dots(pts);
    const out = [x1 + 0, ucl - (lcl - ucl) * 0.12];
    const ng = P(path(pts.slice(0, n - 1).concat([out])), 'm-line m-thin') + dots(pts.slice(0, n - 1)) + C(out[0], out[1], 5, 'm-bad') + C(out[0], out[1], 10, 'm-ring') +
      G(R(out[0] + 8, out[1] - 2, 34, 17, 'm-badbox', {rx: 4}) + T(out[0] + 25, out[1] + 10.5, '이탈', 'm-badt'));
    if (mode === 'alarm') return s + ng;
    return s + G(ok, except('spc')) + G(ng, only('spc'));
  },
  tas(x, y, w, hh){
    const top = y + 30, bot = y + hh - 14, n = 30, x0 = x + 12, x1 = x + w - 12, pm = Math.round(n * 0.58);
    let s = R(x, y, w, hh, 'm-scr', {rx: 8});
    for (let k = 1; k < 4; k++) s += L(x + 8, lerp(top, bot, k / 4), x + w - 8, lerp(top, bot, k / 4), 'm-grid');
    const a = [], b = [];
    for (let k = 0; k < n; k++){
      const xx = lerp(x0, x1, k / (n - 1));
      a.push([xx, lerp(top, bot, 0.62) + wob(k) * 6]);
      b.push([xx, lerp(top, bot, k < pm ? 0.42 : 0.25) + wob(k + 7) * 6]);
    }
    const px = lerp(x0, x1, (pm - 0.5) / (n - 1));
    s += L(px, top - 6, px, bot, 'm-pm') + T(px + 4, top + 2, 'PM', 'm-pmt', 'start');
    s += P(path(a), 'm-line') + P(path(b), 'm-line2');
    s += C(x + 12, y + 14, 4, 'm-dota') + T(x + 20, y + 18, '장비 A', 'm-txt', 'start') + C(x + 78, y + 14, 4, 'm-dotb') + T(x + 86, y + 18, '장비 B', 'm-txt', 'start');
    return s;
  },
  yes(x, y, w, hh){
    const r = Math.min(hh / 2 - 8, 52), cx = x + r + 10, cy = y + hh / 2;
    let s = R(x, y, w, hh, 'm-scr', {rx: 8}) + C(cx, cy, r, 'm-wafer');
    const st = r / 4.2;
    for (let k = -4; k <= 4; k++){
      const d = k * st; if (Math.abs(d) >= r) continue;
      const hl = Math.sqrt(r * r - d * d);
      s += L(cx + d, cy - hl, cx + d, cy + hl, 'm-die') + L(cx - hl, cy + d, cx + hl, cy + d, 'm-die');
    }
    s += P(`M${q1(cx - 5)},${q1(cy + r - 1)} A5,5 0 0 1 ${q1(cx + 5)},${q1(cy + r - 1)}`, 'm-notch');
    const cl = [[0.38, -0.42], [0.46, -0.3], [0.3, -0.33], [0.42, -0.52], [0.52, -0.4], [0.35, -0.22]];
    cl.forEach(([u, v]) => { s += C(cx + u * r, cy + v * r, 2.6, 'm-def'); });
    for (let k = 0; k < 7; k++){ const t = k / 6; s += C(cx - r * 0.62 + t * r * 0.7, cy + r * 0.15 + Math.sin(t * 2.6) * r * 0.3, 2.1, 'm-def'); }
    [[-0.2, -0.7], [0.75, 0.35], [-0.55, -0.15]].forEach(([u, v]) => { s += C(cx + u * r, cy + v * r, 2, 'm-def'); });
    const tx = cx + r + 14, tw2 = (x + w - 10 - tx - 8) / 2, th = Math.min(52, hh - 46);
    if (tw2 > 30){
      const t1 = tx, t2 = tx + tw2 + 8, ty = y + 12;
      s += L(cx + 0.42 * r, cy - 0.38 * r, t1, ty + th / 2, 'm-lead') + L(cx + 0.05 * r, cy + 0.42 * r, t2, ty + th, 'm-lead');
      s += R(t1, ty, tw2, th, 'm-thumb', {rx: 4}) + P(`M${q1(t1 + tw2 * 0.38)},${q1(ty + th * 0.4)} q${q1(tw2 * 0.12)},-${q1(th * 0.22)} ${q1(tw2 * 0.24)},0 q${q1(tw2 * 0.1)},${q1(th * 0.3)} -${q1(tw2 * 0.1)},${q1(th * 0.34)} q-${q1(tw2 * 0.2)},${q1(th * 0.06)} -${q1(tw2 * 0.14)},-${q1(th * 0.34)}Z`, 'm-blob');
      s += R(t2, ty, tw2, th, 'm-thumb', {rx: 4}) + P(`M${q1(t2 + tw2 * 0.12)},${q1(ty + th * 0.78)} Q${q1(t2 + tw2 * 0.5)},${q1(ty + th * 0.2)} ${q1(t2 + tw2 * 0.9)},${q1(ty + th * 0.35)}`, 'm-scratch');
      s += T(t1 + tw2 / 2, ty + th + 15, '입자', 'm-txt') + T(t2 + tw2 / 2, ty + th + 15, '긁힘', 'm-txt');
      s += T((t1 + t2 + tw2) / 2, y + hh - 10, 'defect 16개', 'm-txtb');
    }
    return s;
  },
  rms(x, y, w, hh){
    const dw = Math.min(hh * 0.6, (w - 40) / 2), dh = hh - 30, y0 = y + 6, xa = x + 8, xb = x + w - 8 - dw;
    const doc = (dx, lb, cls) => R(dx, y0, dw, dh, cls, {rx: 4}) + [0.25, 0.42, 0.59, 0.76].map((f, k) => L(dx + 6, y0 + dh * f, dx + dw - (k === 3 ? dw * 0.45 : 6), y0 + dh * f, 'm-docl')).join('') + T(dx + dw / 2, y + hh - 8, lb, 'm-txt');
    return R(x, y, w, hh, 'm-scr', {rx: 8}) + doc(xa, '원본', 'm-doc') + doc(xb, '장비 안', 'm-doc2') + T(x + w / 2, y0 + dh / 2 + 8, '=', 'm-eq') + (xb - xa - dw > 60 ? T(x + w / 2, y0 + dh / 2 + 28, '같다 ✔', 'm-okt') : '');
  },
  ec(x, y, w, hh){
    let s = R(x, y, w, hh, 'm-scr', {rx: 8});
    const rows = [['ECID 101', '✔'], ['ECID 102', '✔'], ['ECID 205', '✔']], lh = (hh - 12) / rows.length;
    rows.forEach(([a, b], k) => { const yy = y + 6 + lh * (k + 0.5) + 4.5; s += T(x + 10, yy, a, 'm-mono', 'start') + T(x + w - 12, yy, b, 'm-okt', 'end'); });
    return s;
  },
  apc(x, y, w, hh){
    let s = R(x, y, w, hh, 'm-scr', {rx: 8});
    const top = y + 12, bot = y + hh - 26, tgt = lerp(top, bot, 0.35), n = 5, x0 = x + 14, x1 = x + w * 0.62;
    s += L(x + 8, tgt, x + w - 8, tgt, 'm-tgt') + T(x + 8, tgt - 6, '목표', 'm-spt2', 'start');
    const pts = [];
    for (let k = 0; k < n; k++) pts.push([lerp(x0, x1, k / (n - 1)), tgt + (k / (n - 1)) * (bot - tgt) * 0.85]);
    s += P(path(pts), 'm-line') + pts.map(p => C(p[0], p[1], 3, 'm-pt')).join('');
    const nx = x + w - 22;
    s += P(`M${q1(x1 + 8)},${q1(pts[n - 1][1])} Q${q1(nx - 6)},${q1(bot + 4)} ${q1(nx)},${q1(tgt + 6)}`, 'm-arrow') + C(nx, tgt, 4, 'm-ptn');
    s += T(x + 10, y + hh - 8, w < 200 ? '→ 다음 lot +2초' : '두께 ↓ → 다음 lot 도금 시간 +2초', 'm-txtb', 'start');
    return s;
  }
};

function sysBox(id){
  const s = SYS[id], [x, y, w, hh] = s.box;
  const lay = {
    top: {ic: [14, 16, 40], ac: [62, 44, 28], nk: [62, 68, 16], ln: [16, 96, 117, 15], lk: [16, 140, 14]},
    mes: {ic: [16, 16, 46], ac: [72, 50, 34], nk: [72, 76, 17], ln: [18, 104, 125, 15.5], lk: [18, 150, 14]},
    bot: {ic: [16, 16, 44], ac: [70, 46, 30], nk: [70, 70, 16], ln: [18, 102, 124, 15], lk: [18, 150, 14]},
    sub: {ic: [10, 12, 32], ac: [48, 38, 24], nk: [12, 66, 15], ln: [12, 90, 110, 13.5], lk: [12, 134, 13]}
  }[s.kind];
  let g = R(x - 4, y - 4, w + 8, hh + 8, 'sy-halo', {rx: 17}) + R(x, y, w, hh, 'sy-card', {rx: 14}) + R(x + 1.5, y + 16, 4, hh - 32, 'sy-stripe', {rx: 2});
  g += icon(s.icon, x + lay.ic[0], y + lay.ic[1], lay.ic[2]);
  g += FT(x + lay.ac[0], y + lay.ac[1], s.ac, 't-ac', lay.ac[2], w - lay.ac[0] - 12);
  g += FT(x + lay.nk[0], y + lay.nk[1], s.nick, 't-nick', lay.nk[2], w - lay.nk[0] - 10);
  g += FT(x + lay.ln[0], y + lay.ln[1], s.lines[0], 't-line', lay.ln[3], w - lay.ln[0] - 10);
  g += FT(x + lay.ln[0], y + lay.ln[2], s.lines[1], 't-line', lay.ln[3], w - lay.ln[0] - 10);
  g += FT(x + lay.lk[0], y + lay.lk[1], '≈ ' + s.like, 't-like', lay.lk[2], w - lay.lk[0] - 10);
  if (s.kind === 'mes'){
    const cw = (w - 32 - 4 * 5) / 5;
    EQS.forEach((e, i) => { const cx = x + 16 + i * (cw + 5); g += R(cx, y + 164, cw, 20, 'sy-chip', {rx: 6, 'data-lamp': e.id}) + T(cx + cw / 2, y + 178.5, e.name.slice(0, 2), 't-chip'); });
  }
  if (s.kind === 'bot') g += MINI[id](x + 14, y + 166, w - 28, 118, 'map');
  if (s.kind === 'sub') g += MINI[id](x + 10, y + 146, w - 20, 84, 'map');
  // 경보 효과
  if (id === 'fdc') g += R(x - 6, y - 6, w + 12, hh + 12, 'sy-alarm', Object.assign({rx: 18}, only('fdc s5'))) + G(icon('bell', x + w - 52, y + 12, 38, 'sy-bell'), only('fdc s5'));
  if (id === 'ees') g += R(x - 6, y - 6, w + 12, hh + 12, 'sy-alarm', Object.assign({rx: 18}, only('ees s6')));
  // 상태에 따라 상자 윗변에 붙는 꼬리표
  const tag = (s2, list) => { const tw2 = tw(s2, 12.5) + 20, tx = x + w - tw2 - 10; return G(R(tx, y - 11, tw2, 22, 'sy-tag', {rx: 11}) + T(tx + tw2 / 2, y + 4.5, s2, 't-tag'), only(list)); };
  if (id === 'gipms') g += tag('inform note ✎', 'gipms s7');
  if (id === 'yes') g += tag('판정 → MES release', 's8');
  if (id === 'spc') g += tag('관리 한계 안 ✔', 's8');
  if (id === 'apc') g += tag('보정 +2초', 'apc s3');
  if (id === 'rtd') g += tag('1순위 LOT-001', 'rtd s2');
  return G(g, {class: 'sy-sys', 'data-sys': id, 'data-go': id, style: `--c:${FAM[s.fam].c}`, 'data-tip': s.tip});
}
function pcsBox(){
  const [x, y, w, hh] = PCS.box;
  let g = R(x - 4, y - 4, w + 8, hh + 8, 'sy-halo', {rx: 17}) + R(x, y, w, hh, 'sy-card sy-pcs', {rx: 14}) + R(x + 1.5, y + 16, 4, hh - 32, 'sy-stripe', {rx: 2});
  g += T(x + 18, y + 34, 'PCS', 't-ac', 'start', {style: 'font-size:26px'}) + FT(x + 82, y + 33, '공정 조건 관리 — 장비가 정해진 조건대로', 't-nick', 16, w - 96);
  return G(g, {class: 'sy-sys', 'data-sys': 'pcs', 'data-go': 'rms', style: `--c:${FAM.pcs.c}`, 'data-tip': PCS.tip});
}
// EAP: FAB 위아래의 띠. 장비로 들고 나는 데이터는 모두 이 띠를 지난다
function eapBars(){
  const [x, , w] = SYS.eap.box, bars = [290, 628], bh = 18;
  let g = '';
  bars.forEach(by => {
    g += R(x - 4, by - 4, w + 8, bh + 8, 'sy-halo', {rx: 12}) + R(x, by, w, bh, 'sy-eapbar', {rx: 9}) + L(x + 10, by + bh / 2, x + w - 10, by + bh / 2, 'sy-eapflow');
    g += R(x + 14, by + 1.5, 296, bh - 3, 'sy-eaplb', {rx: 7.5}) + T(x + 24, by + 13.5, 'EAP / EIF · 장비 말 ↔ 시스템 말 통역', 't-eap', 'start');
  });
  return G(g, {class: 'sy-sys', 'data-sys': 'eap', 'data-go': 'eap', style: `--c:${FAM.eap.c}`, 'data-tip': SYS.eap.tip});
}
function head(a, b){
  const dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1, ux = dx / ln, uy = dy / ln, s = 12, wv = 6.5;
  return PG([b, [b[0] - ux * s - uy * wv, b[1] - uy * s + ux * wv], [b[0] - ux * s + uy * wv, b[1] - uy * s - ux * wv]], 'sy-ah');
}
function pill(x, y, lines, a){
  const fs = 13.5, lh = 17, wm = Math.max(...lines.map(s => tw(s, fs))), w = wm + 16, hh = lines.length * lh + 8;
  const x0 = a === 'start' ? x - 8 : a === 'end' ? x - w + 8 : x - w / 2;
  let s = R(x0, y - hh / 2, w, hh, 'sy-pill', {rx: 8});
  lines.forEach((ln, i) => { s += T(x, y - hh / 2 + lh * (i + 1), ln, 't-pill', a || 'middle'); });
  return G(s, {class: 'sy-elbl'});
}
function edge(e){
  const d = path(e.pts);
  let len = 0; for (let k = 1; k < e.pts.length; k++) len += Math.hypot(e.pts[k][0] - e.pts[k - 1][0], e.pts[k][1] - e.pts[k - 1][1]);
  const dur = q1(Math.max(1.1, len / 70));
  let s = P(d, 'sy-hit') + P(d, 'sy-line') + head(e.pts[e.pts.length - 2], e.pts[e.pts.length - 1]);
  if (e.both) s += head(e.pts[1], e.pts[0]);
  s += `<circle r="5" class="sy-pk"><animateMotion dur="${dur}s" repeatCount="indefinite" path="${d}"/></circle>`;
  if (e.both) s += `<circle r="5" class="sy-pk"><animateMotion dur="${dur}s" begin="-${q1(dur / 2)}s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear" path="${d}"/></circle>`;
  s += pill(e.at[0], e.at[1], e.lbl, e.a);
  return G(s, {class: 'sy-edge', 'data-edge': e.id, style: `--c:${FAM[e.fam].c}`, 'data-tip': e.tip});
}
function foup(x, y, cls){
  return G(R(x + 18, y - 5, 22, 6, 'sy-fh', {rx: 2}) + R(x, y, 58, 32, 'sy-foupb', {rx: 6}) + L(x + 8, y + 10, x + 50, y + 10, 'sy-foupl') + L(x + 8, y + 17, x + 50, y + 17, 'sy-foupl') + L(x + 8, y + 24, x + 50, y + 24, 'sy-foupl'), {class: cls});
}
function bubble(cx, cy, s, states, cls){
  const w = tw(s, 14.5) + 26;
  return G(R(cx - w / 2, cy - 13, w, 26, 'sy-bubr', {rx: 13}) + T(cx, cy + 5, s, 't-bub'), Object.assign({class: 'sy-bub' + (cls ? ' ' + cls : '')}, only(states)));
}
function eqFx(kind, x, y){
  // 장비 창 안의 모습 (x, y: 창 왼쪽 위, 84×62)
  if (kind === 'dep') return [0, 1, 2, 3, 4].map(k => C(x + 14 + k * 14, y + 16 + (k % 2) * 12, 2.5, 'sy-fxdot')).join('') + R(x + 8, y + 50, 68, 5, 'sy-fxw');
  if (kind === 'photo') return PG([[x + 42, y + 6], [x + 22, y + 48], [x + 62, y + 48]], 'sy-fxlight') + R(x + 8, y + 50, 68, 5, 'sy-fxw');
  if (kind === 'etch') return `<ellipse cx="${x + 42}" cy="${y + 28}" rx="32" ry="13" class="sy-fxplasma"/>` + R(x + 8, y + 50, 68, 5, 'sy-fxw');
  if (kind === 'plate') return R(x + 6, y + 22, 72, 34, 'sy-fxbath', {rx: 4}) + R(x + 12, y + 14, 60, 5, 'sy-fxw');
  return P(`M${x + 30},${y + 6} h24 l-4,16 h-16 z`, 'sy-fxlens') + L(x + 42, y + 22, x + 42, y + 48, 'sy-fxscan') + R(x + 8, y + 50, 68, 5, 'sy-fxw');
}
function drawFab(){
  const [fx, fy, fw, fh] = FAB.box;
  let s = R(fx, fy, fw, fh, 'sy-fab', {rx: 18});
  s += T(fx + 24, fy + 32, 'FAB 현장 · 클린룸', 't-fab', 'start') + T(fx + 202, fy + 31, '장비가 공정을 하고, lot(웨이퍼 묶음)이 장비 사이를 옮겨 다닌다', 't-fabsub', 'start');
  // 상태등 범례
  let lx = 1192;
  s += T(lx, fy + 31, '상태등', 't-fabsub', 'start'); lx += 52;
  ['run', 'idle', 'down', 'pm'].forEach(k => { s += C(lx + 6, fy + 26, 6, 'sy-lamp', {'data-s': k, 'data-legend': 1}) + T(lx + 16, fy + 31, LAMP[k], 't-fabsub', 'start'); lx += 26 + tw(LAMP[k], 15) + 10; });
  // OHT 레일과 운반 로봇
  s += L(fx + 18, 374, fx + fw - 18, 374, 'sy-rail', {'data-tip': 'OHT 레일 — 천장을 달리는 운반 로봇의 길'});
  for (let k = 0; k < 2; k++){
    s += `<g class="sy-ohtg">${R(fx + 22, 365, 40, 18, 'sy-ohtv', {rx: 4})}${L(fx + 42, 383, fx + 42, 392, 'sy-ohth')}<animateMotion dur="20s" begin="-${k * 10}s" repeatCount="indefinite" path="M0,0 H${fw - 84}"/><animate attributeName="opacity" values="0;1;1;1;0" dur="20s" begin="-${k * 10}s" repeatCount="indefinite"/></g>`;
  }
  // stocker
  const sx = fx + 22;
  s += R(sx, 406, 112, 176, 'sy-stk', {rx: 8, 'data-tip': 'stocker — lot(FOUP)을 보관하는 자동 창고'});
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) s += R(sx + 8 + c * 34, 416 + r * 32, 28, 20, 'sy-stkf', {rx: 3});
  s += T(sx + 56, 604, 'stocker', 't-eq');
  // 장비
  EQS.forEach(e => {
    const x = e.x;
    let g = R(x, 434, 200, 140, 'sy-eq', {rx: 10}) + R(x + 100, 448, 84, 62, 'sy-win', {rx: 6}) + eqFx(e.fx, x + 100, 448);
    g += R(x + 8, 546, 82, 8, 'sy-port', {rx: 2}) + R(x + 100, 522, 84, 40, 'sy-panel', {rx: 4}) + L(x + 108, 532, x + 150, 532, 'sy-panl') + L(x + 108, 542, x + 170, 542, 'sy-panl') + L(x + 108, 552, x + 140, 552, 'sy-panl');
    g += C(x + 20, 452, 8, 'sy-lamp', {'data-lamp': e.id});
    if (!e.me && e.id !== 'insp') g += foup(x + 18, 514, 'sy-foup');
    g += T(x + 100, 604, (e.me ? '★ ' : '') + e.name, e.me ? 't-eq t-eqme' : 't-eq');
    s += G(g, {'data-tip': `${e.name}${e.me ? ' — 이야기의 주인공' : ''}\n상태등: 초록 가동 · 노랑 대기 · 빨강 고장 · 파랑 PM`});
  });
  // 상태에 따라 뜨는 말풍선 (레일과 장비 사이)
  const by = 405, pc = 1196, ic = 1400;
  s += bubble(880, by, 'lot = 웨이퍼 25장 묶음 (FOUP 통에 담김)', 'words', 'info');
  s += bubble(1300, by, 'OHT = 천장 레일을 달리는 운반 로봇', 'words', 'info');
  s += bubble(880, by, 'RTD: 다음은 도금 장비 → MCS가 OHT로 반송', 's2 mcs');
  s += bubble(pc, by, 'recipe ✔ · 장비 상수 ✔ · APC 보정 +2초', 's3');
  s += bubble(pc, by, '도금 중 — 센서 값이 EAP를 거쳐 쉬지 않고 나온다', 's4 fdc tas eap');
  s += bubble(pc, by, '온도 spec 이탈! → FDC 알람 → lot hold', 's5', 'ng');
  s += bubble(pc, by, 'ALID 2301 · 펌프 이상 (예) → 장비 DOWN', 's6 ees', 'ng');
  s += bubble(pc, by, 'PM · 부품 교체 · 수리 중', 's7 gipms');
  s += bubble(ic, by, '두께 · defect 확인 → SPC · YES', 's8 yes spc');
  s += bubble(1325, by, '다음 공정으로 →', 's9');
  s += bubble(pc, by, '이 lot은 이 recipe로 (작업 지시)', 'mes rms');
  return G(s, {class: 'sy-fabg', 'data-sys': 'fab', 'data-go': 'words'});
}
function drawLot(){
  const g = foup(0, 0, 'sy-foupme') + R(-4, -32, 128, 24, 'sy-lotb', {rx: 12}) + T(10, -15, 'LOT-001', 't-lot', 'start') +
    R(70, -29, 50, 18, 'sy-lst', {rx: 9}) + T(95, -15.5, 'WAIT', 't-lst');
  return G(g, {class: 'sy-lot', id: 'sy-lot', 'data-sys': 'fab', 'data-go': 'words', 'data-tip': 'LOT-001 — 이야기에서 따라가는 lot (웨이퍼 25장)'});
}
function drawLegend(){
  let s = '', x = 34;
  Object.keys(FAM).forEach(k => { s += R(x, 40, 13, 13, 'sy-lg', {rx: 3, style: `fill:${FAM[k].c}`}) + T(x + 18, 51.5, FAM[k].name, 't-lg', 'start'); x += 18 + tw(FAM[k].name, 13.5) + 14; });
  return G(s, {class: 'sy-legend'});
}
// 맨 아래 줄: 데이터 분석은 별도 시스템이 아니라 IPA · Python으로
function drawFooter(){
  const s = '데이터 분석 — IPA · Python으로 MES · FDC · TAS · SPC · YES의 데이터를 모아 직접 분석합니다 (lot 이력은 MES에)';
  const w = tw(s, 15) + 70;
  return G(R(30, 1034, w, 34, 'sy-foot', {rx: 17}) + icon('chart', 44, 1039, 24) + T(78, 1056, s, 't-foot', 'start'),
    {class: 'sy-footg', 'data-tip': '데이터 분석: IPA나 Python으로 여러 시스템의 데이터를 모아 직접 분석\nlot 이력(언제 · 어느 장비 · 어떤 recipe)은 MES에서 본다', style: '--c:#7dd3fc'});
}
function drawStage(){
  let s = drawLegend();
  s += drawFab() + eapBars();
  EDGES.forEach(e => { s += edge(e); });
  ['gmdm', 'mmdm', 'mes', 'ees', 'gipms', 'rtd', 'mcs', 'fdc', 'tas'].forEach(id => { s += sysBox(id); });
  s += pcsBox();
  ['rms', 'ec', 'apc', 'spc', 'yes'].forEach(id => { s += sysBox(id); });
  s += drawLot() + drawFooter();
  return s;
}

/* ---------------- 5. 카드 ---------------- */
const fam = id => FAM[SYS[id].fam].c;
const mini = (id, w, hh, mode) => `<svg class="sy-mini" viewBox="0 0 ${w} ${hh}" role="img">${MINI[id](0, 0, w, hh, mode)}</svg>`;
const like = s => `<div class="sy-like"><b>비유</b> ${s}</div>`;
const io = (a, b) => `<div class="sy-io"><div><b>받는 것</b>${a}</div><div><b>주는 것</b>${b}</div></div>`;
const kick = id => `<div class="kick" style="color:${fam(id)}">${esc(FAM[SYS[id].fam].name)}</div>`;
const st = (s, cls) => `<span class="sy-st ${cls}">${s}</span>`;
const ANALYSIS = '<p class="hint"><b>데이터 분석</b>은 따로 시스템이 있는 것이 아니라, <b>IPA나 Python</b>으로 MES · FDC · TAS · SPC · YES의 데이터를 모아 직접 분석합니다.</p>';
function sysCard(id){
  switch (id){
    case 'mes': return `${kick('mes')}<h3>MES — 공장의 관제탑</h3>
      <p>공장에는 웨이퍼 묶음(lot)이 수천 개 돌아다닙니다. MES는 모든 lot이 <b>지금 어디서 무엇을 하는지</b>, 모든 장비가 <b>일하는 중인지, 쉬는 중인지, 고장인지</b>를 실시간으로 아는 시스템입니다.</p>
      ${like('<b>택배 배송 조회 + 내비게이션</b> — 내 택배가 지금 어느 터미널에 있는지(위치 · 상태), 다음에 어디로 가는지(흐름), 주소가 이상하면 배송을 멈추는 것(hold), 지나온 터미널 기록(이력).')}
      <ul class="jl"><li><b>lot 상태</b>: 대기(WAIT) · 진행(RUN) · 멈춤(HOLD)</li><li><b>장비 상태</b>: 가동 · 대기 · 고장(DOWN) · 점검(PM)</li><li><b>lot flow</b>: 제품마다 정해진 공정 순서대로 다음 공정으로 보낸다</li><li><b>lot hold</b>: 이상이 있으면 그 lot을 멈춰 세운다 → 엔지니어가 확인한 뒤 풀어 준다(release)</li><li><b>lot 이력</b>: 언제, 어느 장비에서, 어떤 recipe로 진행했고 어떤 hold · 판정이 있었는지 — 문제가 생기면 가장 먼저 보는 기록</li></ul>
      <table class="sy-t"><tr><th>lot</th><th>지금 공정</th><th>상태</th></tr>
        <tr><td>LOT-001</td><td>40 도금</td><td>${st('RUN', 'run')}</td></tr><tr><td>LOT-002</td><td>20 포토</td><td>${st('WAIT', 'wait')}</td></tr><tr><td>LOT-003</td><td>30 식각</td><td>${st('HOLD', 'hold')}</td></tr></table>
      <p class="hint">예시 화면입니다 (실제 화면과 다릅니다).</p>
      ${io('기준정보(MMDM), 다음 lot 순서(RTD), 장비 DOWN 신호(EES), 진행 보고(EAP)', '작업 지시(EAP → 장비), lot · 장비 상태(RTD), 장비 상태(GIPMS)')}
      <p class="note">MES가 없다면? lot이 어디 있는지 사람이 종이에 적어야 하고, 고장 난 장비에 lot을 넣는 실수도 막기 어렵습니다.</p>`;
    case 'rtd': return `${kick('rtd')}<h3>RTD — 다음 lot을 정하는 배차 담당</h3>
      <p>장비 하나 앞에 기다리는 lot이 여러 개라면, 어느 lot부터 넣어야 할까요? RTD(Real-Time Dispatching)는 MES의 lot · 장비 상태를 실시간으로 보고 <b>다음에 어떤 lot을 어느 장비에 넣을지</b> 정합니다.</p>
      ${like('<b>택시 배차 앱</b> — 기다리는 손님(lot)과 빈 택시(장비)를 보고, 누가 어느 택시를 탈지 순서를 정해 줍니다.')}
      <table class="sy-t"><tr><th>순서</th><th>도금 장비 앞 대기 lot</th><th>이유 (예)</th></tr>
        <tr><td>1</td><td>LOT-001</td><td>납기가 가장 급하다</td></tr><tr><td>2</td><td>LOT-007</td><td>같은 recipe라 이어서 하면 빠르다</td></tr><tr><td>3</td><td>LOT-004</td><td>오래 기다렸다</td></tr></table>
      <p class="hint">순서를 정하는 규칙은 공정과 회사마다 다릅니다.</p>
      ${io('lot · 장비 상태(MES)', '다음 lot 순서(MES), 반송 요청(MCS)')}`;
    case 'mcs': return `${kick('mcs')}<h3>MCS — lot을 실제로 옮기는 물류 관제</h3>
      <p>FOUP을 장비까지 옮기는 것은 천장 레일을 달리는 <b>OHT</b>와 자동 창고 <b>stocker</b>입니다 (이런 자동 반송 설비를 <b>AMHS</b>라고 부릅니다). MCS는 이 설비들에게 <b>"이 FOUP을 저기로"</b> 반송 명령을 내리고, FOUP이 지금 어디 있는지 압니다.</p>
      ${like('<b>물류센터 로봇 관제실</b> — 주문이 들어오면 로봇에게 "이 상자를 3번 출구로" 지시하고, 상자가 지금 어디 있는지 추적합니다.')}
      <div class="sy-chain"><div style="--c:${FAM.log.c}"><b>RTD</b>LOT-001을 도금 장비로</div><i>→</i><div style="--c:${FAM.log.c}"><b>MCS</b>경로를 정해 반송 명령</div><i>→</i><div style="--c:#94a3b8"><b>OHT · stocker</b>꺼내서 장비 앞까지</div></div>
      <ul class="jl"><li>반송 명령: stocker → OHT → 장비 앞(load port)</li><li>경로 정하기: 막힌 길 · 붐비는 길 피하기</li><li>위치 추적: 지금 FOUP이 레일 위인지, 창고 안인지, 장비 앞인지</li><li>보관: stocker에 넣고 꺼내기</li></ul>
      ${io('반송 요청(RTD)', '반송 명령(OHT · stocker), 도착 · 위치 보고')}`;
    case 'mmdm': return `${kick('mmdm')}<h3>MMDM — MES의 지도 데이터</h3>
      <p>MES가 "이 lot은 다음에 어디로?"를 판단하려면 <b>미리 정해 둔 규칙</b>이 있어야 합니다. MMDM은 MES가 쓰는 <b>기준정보를 등록(setup)</b>하는 시스템입니다.</p>
      ${like('<b>내비게이션의 지도 데이터</b> — 길과 건물이 지도에 없으면 내비(MES)는 안내를 못 하고, 지도가 틀리면 엉뚱한 길로 안내합니다.')}
      <table class="sy-t"><tr><th>무엇을</th><th>예</th></tr>
        <tr><td>제품</td><td>제품 설명, lot 코드</td></tr><tr><td>제품별 공정</td><td>10 증착 → 20 포토 → 30 식각 → 40 도금 → 50 검사</td></tr>
        <tr><td>공정별 recipe</td><td>40 도금 → recipe PLT_A</td></tr><tr><td>장비</td><td>장비 이름, 장비 기준정보 (어느 공정을 할 수 있나)</td></tr><tr><td>물류</td><td>FOUP(웨이퍼 통), stocker(자동 창고)</td></tr></table>
      <p class="hint">공정 번호 · recipe 이름은 설명용 예시입니다.</p>
      ${io('최초 기준정보(GMDM)', 'MES용 기준정보(MES)')}
      <p class="note">기준정보가 틀리면 MES가 틀린 recipe나 장비로 lot을 보낼 수 있습니다. 그래서 기준정보 변경은 꼼꼼히 확인하고 승인받습니다.</p>`;
    case 'gmdm': return `${kick('gmdm')}<h3>GMDM — 기준정보의 원본</h3>
      <p>MMDM에 무언가를 등록하려면 먼저 그 <b>이름(코드)</b>이 회사에 있어야 합니다. GMDM은 MMDM에 필요한 <b>최초 기준정보</b>를 만드는 시스템입니다.</p>
      ${like('<b>도로명 주소 원본</b> — 나라가 정한 공식 주소가 있어야 내비 지도(MMDM)에 건물을 올릴 수 있습니다. 모두가 같은 이름을 써야 시스템끼리 말이 통합니다.')}
      <div class="sy-chain"><div style="--c:${FAM.base.c}"><b>GMDM</b>제품 코드를 처음 만든다</div><i>→</i><div style="--c:${FAM.base.c}"><b>MMDM</b>공정 순서 · recipe · 장비를 붙인다</div><i>→</i><div style="--c:${FAM.mes.c}"><b>MES</b>lot을 만들고 보낸다</div></div>
      ${io('새 제품 · 새 코드 요청', '최초 기준정보(MMDM)')}
      <p class="note">순서가 거꾸로 될 수 없습니다: GMDM에 없는 코드는 MMDM에 등록할 수 없고, MMDM에 없는 정보로는 MES가 lot을 움직일 수 없습니다.</p>`;
    case 'eap': return `${kick('eap')}<h3>EAP / EIF — 장비와 시스템 사이의 통역사</h3>
      <p>장비는 장비만의 말(통신 규약, 반도체에서는 <b>SECS/GEM</b>)을 씁니다. MES · FDC 같은 시스템과 바로 이야기할 수 없어서, 장비마다 붙은 <b>EAP(EIF)</b>가 <b>통역</b>합니다. 지도에서 <b>FAB 위아래의 띠</b>가 EAP입니다 — 장비로 들어가고 나오는 데이터는 모두 이 띠를 지납니다.</p>
      ${like('<b>통역사</b> — 외국인 선수(장비)와 감독(시스템) 사이에서, 장비가 "알람 2301!"이라고 하면 "ALID 2301 발생"으로 바꿔 EES에 전합니다.')}
      <table class="sy-t"><tr><th>방향</th><th>지나가는 것</th></tr>
        <tr><td>MES → 장비</td><td>작업 지시 (이 lot을 이 recipe로)</td></tr><tr><td>장비 → MES</td><td>진행 보고 (시작 · 끝)</td></tr>
        <tr><td>장비 → EES</td><td>ALID (장비 알람)</td></tr><tr><td>장비 → FDC · TAS</td><td>센서 값(source data) · DCOL</td></tr>
        <tr><td>RMS · EC ↔ 장비</td><td>recipe · 장비 상수(ECID)</td></tr><tr><td>계측 장비 → APC · SPC</td><td>계측 결과</td></tr></table>
      <p class="note">EAP 통신이 끊기면 시스템이 장비를 볼 수 없어 작업에 지장이 생깁니다. 장비가 멀쩡해도 "통역사"가 없으면 일이 멈춥니다.</p>`;
    case 'fdc': return `${kick('fdc')}<h3>FDC — 장비 센서의 경고등</h3>
      <p>장비 안에는 온도 · 압력 · 전류 · 유량 같은 센서가 있고 1초에도 여러 번 값을 냅니다(<b>source data</b>). FDC는 이 값에 <b>spec(허용 범위)</b>을 걸어 두고, 벗어나면 <b>알람</b>을 울립니다.</p>
      ${like('<b>자동차 계기판 경고등 · 체온계</b> — 정상 범위를 벗어나면 빨간불이 켜집니다.')}
      ${mini('fdc', 360, 150, 'alarm')}
      <ul class="jl"><li><b>spec</b>: 위 한계(USL) · 아래 한계(LSL) — "여기까지는 괜찮다"</li><li>공정 중에 <b>실시간으로, 웨이퍼마다</b> 본다 → 이상을 빨리 잡는다</li><li>알람이 울리면: 엔지니어 확인 → 필요하면 MES에서 lot hold</li><li>spec이 너무 좁으면 거짓 알람이 많고, 너무 넓으면 진짜 이상을 놓친다</li></ul>
      ${io('센서 값(장비 → EAP)', '알람(엔지니어)')}
      <p class="hint">SPC와 함께 쓰는 법: <a href="#go-edu-5">05 제조기술의 기초 — SPC와 FDC</a></p>`;
    case 'tas': return `${kick('tas')}<h3>TAS — 장비 데이터를 그래프로</h3>
      <p>장비가 내보내는 데이터(<b>DCOL</b>, data collection)를 시간 순서대로 <b>차트</b>로 그려 보는 시스템입니다. FDC가 자동으로 지키는 <b>경비원</b>이라면, TAS는 엔지니어가 직접 들여다보는 <b>돋보기</b>입니다.</p>
      ${like('<b>스마트워치 건강 앱</b> — 심박수 기록을 그래프로 보면 "언제부터 달라졌는지"가 보입니다.')}
      ${mini('tas', 360, 150)}
      <ul class="jl"><li>시간에 따른 변화(추세) 보기</li><li>장비끼리, 챔버끼리 비교</li><li>PM · 부품 교체 전후 비교 (위 그림: PM 뒤 장비 B의 값이 달라졌다)</li><li>FDC 알람이 울렸을 때 "언제부터 이상했나" 찾기</li></ul>
      ${io('DCOL(장비 → EAP)', '차트 → 엔지니어의 판단')}
      ${ANALYSIS}`;
    case 'ees': return `${kick('ees')}<h3>EES — 장비 고장 자동 신고</h3>
      <p>장비는 스스로 이상을 느끼면 정해진 번호의 알람을 냅니다. 이 번호를 <b>ALID</b>(Alarm ID)라고 합니다. EES는 ALID가 울리면 <b>MES에 "장비 DOWN" 신호</b>를 보내, 고장 난 장비에 lot이 더 들어가지 않게 합니다.</p>
      ${like('<b>화재경보기</b> — 연기를 감지하면 사람이 전화하지 않아도 자동으로 신고되고 엘리베이터가 멈춥니다.')}
      <div class="sy-chain"><div style="--c:#94a3b8"><b>도금 장비</b>ALID 2301 펌프 이상</div><i>→</i><div style="--c:${FAM.eap.c}"><b>EAP</b>통역</div><i>→</i><div style="--c:${FAM.watch.c}"><b>EES</b>DOWN 신호</div><i>→</i><div style="--c:${FAM.mes.c}"><b>MES</b>도금 장비 ${st('DOWN', 'down')}</div></div>
      <table class="sy-t"><tr><th></th><th>FDC</th><th>EES</th></tr><tr><td>누가 판단?</td><td>우리가 정한 spec</td><td>장비가 스스로 (ALID)</td></tr><tr><td>무엇을?</td><td>센서 값이 범위 밖</td><td>장비 알람 발생</td></tr><tr><td>그다음</td><td>알람 → 엔지니어</td><td>MES에 장비 DOWN</td></tr></table>
      <p class="hint">ALID 번호와 내용은 설명용 예시입니다.</p>
      ${io('ALID(장비 → EAP)', '장비 DOWN 신호(MES)')}`;
    case 'gipms': return `${kick('gipms')}<h3>GIPMS — 장비 건강 수첩</h3>
      <p>장비가 멈추면 고쳐야 하고, 고장 나기 전에 정기 점검(<b>PM</b>, Preventive Maintenance)도 해야 합니다. GIPMS는 장비 정비에 관한 일을 기록하고 관리합니다.</p>
      ${like('<b>자동차 정비 수첩 + 부품 창고</b> — 언제 무엇이 고장 났고 어떻게 고쳤는지, 엔진오일 교환 주기, 부품을 꺼내 쓰고 고장 난 부품은 수리 보내기.')}
      <div class="sy-note"><div class="hd">inform note · 도금 장비</div><div><b>현상</b> ALID 2301 펌프 이상으로 DOWN</div><div><b>조치</b> 펌프 부품 교체, 동작 확인</div><div><b>결과</b> 장비 UP · 다음 PM D-12</div></div>
      <ul class="jl"><li><b>inform note</b>: 장비 down 때 무슨 일이 있었고 어떻게 조치했는지 기록</li><li><b>PM 주기 관리</b>: 시간 · 사용량마다 돌아오는 점검 일정</li><li><b>part</b>: 부품 출고(창고에서 꺼내기), 고장 부품 수리 보내기</li></ul>
      ${io('장비 DOWN · PM 상태(MES)', 'PM · 수리 · 부품 교체(장비), 정비 기록')}
      <p class="note">inform note를 잘 써 두면 다음에 같은 고장이 났을 때 빨리 고칠 수 있습니다 — 팀의 기억입니다.</p>`;
    case 'spc': return `${kick('spc')}<h3>SPC — 결과의 성적표 그래프</h3>
      <p>계측 장비가 잰 공정 <b>결과</b>(두께, 크기 같은 계측값)를 <b>관리도</b>에 차례로 찍어, 평소의 흔들림 범위(<b>관리 한계</b>)를 벗어나거나 이상한 패턴이 보이면 알립니다. FDC가 <b>장비 상태</b>를 본다면 SPC는 <b>만들어진 결과</b>를 봅니다.</p>
      ${like('<b>성적표 추이 그래프</b> — 시험 점수를 매번 그래프로 그려, 평소 범위를 벗어나면 "무슨 일이 있었지?" 하고 이유를 찾습니다.')}
      ${mini('spc', 360, 150, 'alarm')}
      <ul class="jl"><li><b>관리 한계(UCL · LCL)</b>: 평소 흔들림의 범위. 고객 규격(spec)과는 다르다</li><li>규칙: 한 점이 한계 밖, 한쪽으로 여러 점 연속, 계속 오르거나 내림 → 이상 신호</li><li>이상 신호 → 엔지니어 확인 → 필요하면 MES에서 lot hold</li></ul>
      ${io('계측값(계측 장비 → EAP)', '관리도 · 이상 신호(엔지니어 → MES hold)')}
      <p class="hint">관리도 규칙을 직접 해 보기: <a href="#go-edu-3">03 공학의 기초 — 관리도</a> · <a href="#go-edu-5">05 — SPC와 FDC</a></p>`;
    case 'yes': return `${kick('yes')}<h3>YES — 불량 지도와 사진첩</h3>
      <p>검사 장비는 웨이퍼 표면을 훑어 작은 흠(<b>defect</b>: 입자, 긁힘, 패턴 불량)을 찾고 위치와 사진을 남깁니다. YES는 이 <b>defect data와 image</b>를 보는 시스템입니다.</p>
      ${like('<b>건강검진 결과지 + X-ray 사진</b> — 몸(웨이퍼)의 어디에 이상이 있는지 지도로 보고, 눌러서 사진으로 확인합니다.')}
      ${mini('yes', 360, 150)}
      <ul class="jl"><li>웨이퍼 맵에서 defect 위치 · 개수 보기</li><li>사진으로 종류 구분 (입자? 긁힘?)</li><li>모양으로 원인 추적: 한쪽에 몰림, 선 모양(긁힘), 가장자리</li><li>결과에 따라 MES에서 lot을 hold 하거나 다음 공정으로 보낸다</li></ul>
      ${io('defect 위치 · 사진(검사 장비)', '판정 근거(엔지니어 → MES hold / release)')}
      <p class="hint">웨이퍼 맵 패턴 읽기: <a href="#go-hbm">HBM 역추적</a> 6장 웨이퍼 맵 위젯</p>`;
  }
  return '';
}
function pcsCard(){
  const steps = [['RMS — recipe 관리', '요리책 원본 보관함'], ['EC — 장비 상수(ECID) 관리', '오븐 자체의 기본 설정'], ['APC — 자동 recipe 보정', '맛을 보고 다음번 간 맞추기']];
  return `<div class="kick" style="color:${FAM.pcs.c}">공정 조건 · PCS</div><h3>PCS — 장비가 "정해진 대로" 일하게</h3>
    <p>장비는 <b>recipe</b>(공정 조건의 묶음 = 요리법)대로 일합니다. PCS는 장비의 조건을 지키고 다듬는 시스템 묶음으로, 세 가지가 들어 있습니다.</p>
    <ol class="steps">${steps.map((s, k) => `<li data-k="${k}"><span class="n">${k + 1}</span><span><b>${esc(s[0])}</b><em>${esc(s[1])}</em></span></li>`).join('')}</ol>
    <div class="sy-sub" data-k="0"><p><b>RMS</b>는 recipe <b>원본</b>을 보관하고 버전을 관리합니다. 장비 안의 recipe가 원본과 <b>같은지 비교</b>해, 잘못 바뀐 recipe로 일하는 것을 막습니다.</p>${mini('rms', 300, 110)}${like('주방의 <b>요리책 원본</b> — 누가 몰래 레시피를 바꾸면 바로 들킵니다.')}</div>
    <div class="sy-sub" data-k="1"><p><b>EC</b>는 장비마다 정해 둔 설정값인 <b>장비 상수(ECID)</b>가 기준값과 같은지 관리합니다. recipe가 "무엇을 어떻게"라면, 장비 상수는 "이 장비의 기본 설정"입니다.</p>${mini('ec', 300, 96)}${like('<b>오븐 자체의 기본 설정</b>(온도 보정값 같은 것) — 레시피가 같아도 오븐 설정이 다르면 결과가 달라집니다.')}</div>
    <div class="sy-sub" data-k="2"><p><b>APC</b>는 앞 lot의 결과(계측값)를 보고 다음 lot의 조건을 <b>자동으로 조금씩</b> 고칩니다. 아래 그림: 두께가 목표보다 얇아지는 추세 → 다음 lot은 도금 시간을 2초 늘린다 (예).</p>${mini('apc', 300, 120)}${like('<b>빵이 덜 익었으면 다음엔 1분 더</b> — 맛을 보고 다음번 간을 맞추는 것.')}<p class="note">보정량이 계속 커지면 장비 열화나 약품 소모 같은 <b>근본 원인</b>을 찾아야 합니다. 보정은 문제를 가릴 수도 있습니다 (<a href="#go-edu-5">05 — Run-to-Run</a>).</p></div>
    ${io('recipe 원본 · 기준값 · 계측 결과', 'recipe 비교 결과 · 장비 상수 · 보정값(EAP → 장비)')}`;
}
function storyCard(){
  return `<div class="kick">이야기로 따라가기</div><h3>LOT-001의 하루 — 알람이 울린 날</h3>
    <p>지금까지 본 시스템들이 실제로 어떻게 이어지는지, lot 하나를 따라가 봅니다. 스크롤하거나 단계를 누르세요.</p>
    <ol class="steps">${STORY.map((s, k) => `<li data-k="${k}"><span class="n">${k + 1}</span><span><b>${esc(ST[s].t)}</b><em>${esc(ST[s].d)}</em></span></li>`).join('')}</ol>
    <p class="note">알람 번호 · 보정값 같은 숫자는 설명용 예시입니다.</p>`;
}

/* ---------------- 6. 무대 · 스크롤 · 발표 ---------------- */
let built = false, root, stage, svg, lotEl, blocks = [], beats = [], pres = null, auto = null, cur = null, fanim = null;
const FULL = {x: 0, y: 0, w: W0, h: H0};
let fcur = Object.assign({}, FULL);
const reduced = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e){ return false; } })();
const stacked = () => getComputedStyle(root).display === 'block';

function apply(s){
  if (!svg || !ST[s]) return;
  cur = s;
  const S = ST[s];
  svg.dataset.state = s;
  const hl = S.hl === 'all' ? null : new Set(S.hl);
  svg.querySelectorAll('[data-sys]').forEach(e => {
    const on = !hl || hl.has(e.dataset.sys);
    e.classList.toggle('dim', !on); e.classList.toggle('hl', !!hl && on);
  });
  const ed = S.ed === 'all' ? null : new Set(S.ed);
  svg.querySelectorAll('[data-edge]').forEach(e => { const on = !ed || ed.has(e.dataset.edge); e.classList.toggle('on', on); e.classList.toggle('dim', !on); });
  svg.querySelectorAll('[data-st],[data-xst]').forEach(e => {
    const a = e.getAttribute('data-st'), b = e.getAttribute('data-xst');
    e.classList.toggle('off', (a != null && !a.split(' ').includes(s)) || (b != null && b.split(' ').includes(s)));
  });
  const eq = Object.assign({}, EQ0, S.eq || {});
  svg.querySelectorAll('[data-lamp]').forEach(e => e.setAttribute('data-s', eq[e.dataset.lamp]));
  if (S.lot){
    const p = LOTPOS[S.lot[0]];
    lotEl.style.transform = `translate(${p[0]}px,${p[1]}px)`;
    lotEl.style.opacity = '';
    lotEl.setAttribute('data-lot', S.lot[1]);
    lotEl.querySelector('.t-lst').textContent = S.lot[1];
  } else lotEl.style.opacity = '0';
  hud();
  syncCards();
  if (stacked() && !pres) setFocus(focusRect(S));
}
function sysOf(s){ return ST[s].sys || null; }
function hud(){
  const S = ST[cur], id = sysOf(cur), c = id ? fam(id) : S.c;
  const hd = stage.querySelector('.sy-head');
  hd.style.setProperty('--hc', c);
  hd.querySelector('.no').textContent = id ? SYS[id].ac : S.tag;
  hd.querySelector('.nm').textContent = S.t;
  hd.querySelector('.sb').textContent = id ? SYS[id].lines.join(' · ') + '  ≈ ' + SYS[id].like : S.k;
  stage.querySelectorAll('.sy-nav button').forEach(b => b.classList.toggle('on', NAV[+b.dataset.k].grp.includes(cur)));
}
function syncCards(){
  blocks.forEach(b => {
    if (!b.card || b.n < 2) return;
    const k = b.states.indexOf(cur);
    b.card.querySelectorAll('.steps li').forEach((li, j) => { li.classList.toggle('on', j === k); li.classList.toggle('done', k >= 0 && j < k); });
    b.card.querySelectorAll('.sy-sub').forEach(d => d.classList.toggle('on', +d.dataset.k === Math.max(0, k)));
  });
}
// 전화기처럼 좁은 화면: 밝힌 시스템 쪽으로 확대
function focusRect(S){
  if (S.hl === 'all') return FULL;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = b => { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[0] + b[2]); y1 = Math.max(y1, b[1] + b[3]); };
  // FAB 현장과 EAP 띠는 거의 화면 폭이라, 다른 시스템이 함께 밝혀지면 그 시스템 쪽만 확대한다
  const narrow = S.hl.filter(id => id !== 'fab' && id !== 'eap'), ids = narrow.length ? narrow : S.hl;
  ids.forEach(id => add(id === 'fab' ? FAB.box : id === 'pcs' ? PCS.box : SYS[id].box));
  const pad = 30;
  return {x: Math.max(0, x0 - pad), y: Math.max(0, y0 - pad), w: Math.min(W0, x1 + pad) - Math.max(0, x0 - pad), h: Math.min(H0, y1 + pad) - Math.max(0, y0 - pad)};
}
function fitView(){
  const r = stage.getBoundingClientRect();
  if (!r.width || !r.height) return;
  // 아래 이동 칩은 넓은 화면에서 두 줄이 될 수 있다
  const ins = stacked() ? {l: 4, t: 58, r: 4, b: 46} : pres ? {l: 20, t: 132, r: 20, b: 212} : {l: 10, t: 70, r: 10, b: 90};
  const f = fcur, sw = Math.max(80, r.width - ins.l - ins.r), sh = Math.max(80, r.height - ins.t - ins.b);
  const k = Math.min(sw / f.w, sh / f.h);
  const ox = ins.l + (sw - f.w * k) / 2 - f.x * k, oy = ins.t + (sh - f.h * k) / 2 - f.y * k;
  svg.setAttribute('viewBox', `${q1(-ox / k)} ${q1(-oy / k)} ${q1(r.width / k)} ${q1(r.height / k)}`);
}
function setFocus(to){
  if (fanim) cancelAnimationFrame(fanim);
  const from = Object.assign({}, fcur), t0 = performance.now();
  const f = now => {
    const t = reduced ? 1 : clamp((now - t0) / 600), e = t * t * (3 - 2 * t);
    for (const k of ['x', 'y', 'w', 'h']) fcur[k] = lerp(from[k], to[k], e);
    fitView();
    fanim = t < 1 ? requestAnimationFrame(f) : null;
  };
  fanim = requestAnimationFrame(f);
}

function build(){
  built = true;
  VIEW.innerHTML = '';
  VIEW.tabIndex = -1;
  root = h('div', 'jz sy');
  stage = h('div', 'jz-stage');
  svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'jz-svg sy-svg');
  svg.setAttribute('viewBox', `0 0 ${W0} ${H0}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', '반도체 공장의 사내 시스템 지도');
  svg.innerHTML = `<defs><filter id="sy-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter></defs><g id="sy-scene">${drawStage()}</g>`;
  lotEl = svg.querySelector('#sy-lot');
  stage.appendChild(svg);
  const hudEl = h('div', 'jz-hud', `
    <div class="sy-head"><div class="no"></div><div class="tx"><div class="nm"></div><div class="sb"></div></div></div>
    <div class="jz-tools"><button data-act="auto" title="한 단계씩 자동으로 넘기기"><span class="tl">⏵ 자동 재생</span><span class="ts">⏵ 자동</span></button><button class="pres" data-act="pres" title="전체 화면, ← → 키로 넘기기"><span class="tl">▶ 발표 모드</span><span class="ts">▶ 발표</span></button></div>
    <div class="sy-nav"></div>
    <div class="jz-tip" role="tooltip"></div>
    <div class="jz-cap"><div class="k"></div><div class="t"></div><div class="d"></div></div>
    <div class="jz-pres"><span class="cnt"></span><button data-act="auto2">⏵ 자동</button><button data-act="prev">◀ 이전</button><button data-act="next">다음 ▶</button><button data-act="exit">✕ 닫기</button></div>`);
  stage.appendChild(hudEl);
  const nav = hudEl.querySelector('.sy-nav');
  NAV.forEach((n, k) => { const b = h('button', null, `<i style="background:${n.c}"></i>${esc(n.lb)}`); b.dataset.k = k; b.style.setProperty('--c', n.c); b.addEventListener('click', () => gotoState(n.s)); nav.appendChild(b); });
  hudEl.querySelector('[data-act=pres]').addEventListener('click', enterPres);
  hudEl.querySelector('[data-act=auto]').addEventListener('click', () => { if (!pres) enterPres(); toggleAuto(true); });
  hudEl.querySelector('[data-act=auto2]').addEventListener('click', () => toggleAuto());
  hudEl.querySelector('[data-act=prev]').addEventListener('click', () => presGo(pres.k - 1));
  hudEl.querySelector('[data-act=next]').addEventListener('click', () => presGo(pres.k + 1));
  hudEl.querySelector('[data-act=exit]').addEventListener('click', () => exitPres());
  // 툴팁 · 상자를 누르면 그 카드로
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
  svg.addEventListener('click', ev => {
    const t = ev.target.closest && ev.target.closest('[data-go]');
    if (!t) return;
    const s = t.dataset.go;
    if (pres){ const k = beats.findIndex(x => x.s === s); if (k >= 0) presGo(k); } else gotoState(s);
  });
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
  apply('intro');
}

function buildCards(){
  const col = root.querySelector('.jz-cards');
  col.innerHTML = '';
  blocks = [];
  const add = (html, states, cls) => {
    const wrap = h('div', 'jcw'), card = h('div', 'jc' + (cls ? ' ' + cls : ''), html);
    if (states.length > 1){ wrap.classList.add('multi'); wrap.style.minHeight = (states.length * 34 + 40) + 'vh'; }
    wrap.appendChild(card); col.appendChild(wrap);
    const b = {el: wrap, card, states, n: states.length};
    blocks.push(b);
    card.querySelectorAll('.steps li').forEach(li => li.addEventListener('click', () => scrollToBlock(b, (+li.dataset.k + 0.5) / b.n)));
    return card;
  };
  add(`<div class="kick">반도체 공장의 사내 시스템</div><div class="big">시스템 지도</div><h3>공장은 시스템들이 손을 맞춰 돌린다</h3>
    <p>반도체 공장에서는 사람만큼 많은 <b>컴퓨터 시스템</b>이 함께 일합니다. 이 화면은 그 시스템들을 <b>한 장의 지도</b>로 그린 것입니다.</p>
    <ul class="jl"><li><b>가운데</b>: FAB 현장 — 장비와 lot(웨이퍼 묶음)</li><li><b>FAB 위아래 띠</b>: EAP — 장비와 시스템 사이 통역사</li><li><b>위</b>: 생산을 지휘하는 MES, 기준정보(GMDM → MMDM), 고장 신고(EES), 정비(GIPMS)</li><li><b>왼쪽</b>: 물류 — 다음 lot을 정하는 RTD, 실제로 옮기는 MCS</li><li><b>아래</b>: 공정 조건(PCS: RMS · EC · APC), 감시 · 분석(FDC · TAS), 품질(SPC · YES)</li><li><b>화살표</b> = 시스템끼리 주고받는 정보 (움직이는 점이 정보)</li><li>상자를 누르면 그 시스템 설명으로 · 스크롤 또는 ← → 키 · <b>▶ 발표 모드</b></li></ul>
    <div class="sy-fams">${Object.keys(FAM).map(k => `<span><i style="background:${FAM[k].c}"></i>${esc(FAM[k].name)}</span>`).join('')}</div>
    <p class="hint">시스템마다 고등학생도 알 수 있는 <b>비유</b>를 붙였습니다. 시스템 이름과 나뉘는 방식은 회사마다 다를 수 있고, 화면의 숫자 · 코드는 설명용 예시입니다.</p>`, ['intro'], 'intro');
  add(`<div class="kick">시작하기 전에</div><h3>먼저 알아 둘 말</h3>
    <dl class="sy-dl">
      <dt>웨이퍼</dt><dd>반도체를 만드는 둥근 판 (지름 300 mm). 한 장에 칩 수백 개.</dd>
      <dt>lot</dt><dd>함께 움직이는 웨이퍼 묶음 (보통 25장). <i>한 반 학생들이 같이 이동하는 것</i></dd>
      <dt>FOUP</dt><dd>lot을 담는 밀폐 상자. 공기 중 먼지로부터 웨이퍼를 지킨다.</dd>
      <dt>OHT · stocker</dt><dd>천장 레일을 달리는 운반 로봇 · lot을 보관하는 자동 창고 (둘을 합쳐 AMHS, 자동 반송 설비)</dd>
      <dt>장비</dt><dd>공정을 하는 기계 (증착, 포토, 식각, 도금, 계측 · 검사 …)</dd>
      <dt>recipe</dt><dd>장비가 따르는 공정 조건의 묶음 (온도, 시간, 전류 …). <i>요리법</i></dd>
      <dt>spec</dt><dd>허용 범위. 위 한계 · 아래 한계 사이면 정상.</dd>
      <dt>알람</dt><dd>이상이 생겼다는 신호</dd>
      <dt>hold · release</dt><dd>lot을 멈춰 세우기 · 확인 후 다시 보내기</dd>
      <dt>DOWN · PM</dt><dd>장비 고장으로 멈춤 · 정기 점검 (Preventive Maintenance)</dd>
      <dt>기준정보</dt><dd>시스템들이 일하려고 미리 등록해 둔 이름과 규칙 (제품, 공정 순서, recipe, 장비 …)</dd>
    </dl>
    <p class="hint">지도 가운데 노란 FOUP이 이야기에서 따라갈 <b>LOT-001</b>입니다.</p>`, ['words']);
  ['mes', 'rtd', 'mcs', 'mmdm', 'gmdm', 'eap'].forEach(id => add(sysCard(id), [id]));
  add(pcsCard(), ['rms', 'ec', 'apc']);
  ['fdc', 'tas', 'ees', 'gipms', 'spc', 'yes'].forEach(id => add(sysCard(id), [id]));
  add(storyCard(), STORY);
  const outro = add(`<div class="kick">정리</div><h3>한 장으로 다시 보기</h3>
    <table class="sy-t sy-sum"><tr><th>시스템</th><th>하는 일</th><th>비유</th></tr>
      ${['gmdm', 'mmdm', 'mes', 'rtd', 'mcs', 'eap', 'rms', 'ec', 'apc', 'fdc', 'tas', 'ees', 'gipms', 'spc', 'yes'].map(id => `<tr><td><i style="background:${fam(id)}"></i><b>${esc((['rms', 'ec', 'apc'].includes(id) ? 'PCS · ' : '') + SYS[id].ac)}</b></td><td>${esc(SYS[id].lines.join(' ').trim())}</td><td>${esc(SYS[id].like)}</td></tr>`).join('')}</table>
    ${ANALYSIS}
    <div class="btns"><button class="jb primary" data-act="top">처음부터 다시</button><button class="jb" data-act="pres">▶ 발표 모드</button></div>
    <p><b>스스로 점검</b></p><ul class="jl"><li>FDC 알람과 EES의 ALID는 무엇이 다를까? FDC와 SPC는?</li><li>RTD와 MCS는 각각 무엇을 정하고, 무엇을 할까?</li><li>EAP가 끊기면 왜 장비가 멀쩡해도 일이 멈출까?</li><li>MMDM에 recipe가 잘못 등록되면 무슨 일이 생길까?</li><li>TAS와 FDC는 같은 장비 데이터를 쓰는데 무엇이 다를까?</li><li>APC 보정량이 점점 커진다면 무엇을 의심해야 할까?</li><li>장비를 고쳤다는 사실은 어느 시스템들에 남을까?</li><li>내 업무에서 하루에 가장 자주 여는 시스템은 무엇이고, 그 시스템은 지도의 어디에 있나?</li></ul>
    <p class="hint">관련 교육: <a href="#go-edu-5">05 제조기술의 기초</a> (SPC · FDC · R2R · 변경관리) · 이상 대응 흐름 <a href="#go-edu-2">02 자주 부딪히는 업무 상황</a></p>`, ['all']);
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
let scrollAnim = null;
function cancelScrollAnim(){ if (scrollAnim){ cancelAnimationFrame(scrollAnim); scrollAnim = null; } }
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
function gotoState(s){ const k = beats.findIndex(x => x.s === s); if (k >= 0) gotoBeat(k); }
function curBeat(){
  if (pres) return pres.k;
  const {b, sub} = resolvePos();
  return Math.max(0, beats.findIndex(x => x.b === b && x.sub === sub));
}

/* ---- 발표 모드 ---- */
function enterPres(){
  if (pres) return;
  pres = {k: curBeat()};
  root.classList.add('pres');
  fcur = Object.assign({}, FULL);
  try { if (root.requestFullscreen) root.requestFullscreen().catch(() => {}); } catch (e){}
  presApply();
  requestAnimationFrame(fitView);
}
function exitPres(fromFs){
  if (!pres) return;
  const bt = beats[pres.k];
  toggleAuto(false);
  pres = null;
  root.classList.remove('pres');
  if (!fromFs && document.fullscreenElement) try { document.exitFullscreen(); } catch (e){}
  requestAnimationFrame(() => { fitView(); measure(); if (bt){ VIEW.scrollTop = Math.max(0, bt.b.top + (bt.sub + 0.5) / bt.b.n * bt.b.h - anchorOffset()); } });
}
function presApply(){
  const bt = beats[pres.k], S = ST[bt.s];
  apply(bt.s);
  const cap = stage.querySelector('.jz-cap');
  cap.querySelector('.k').textContent = S.k;
  cap.querySelector('.t').textContent = S.t;
  cap.querySelector('.d').textContent = S.d;
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
  if (want && pres) auto = setInterval(() => { if (!pres) return toggleAuto(false); if (pres.k >= beats.length - 1) return toggleAuto(false); presGo(pres.k + 1); }, 4200);
  stage.querySelectorAll('[data-act=auto],[data-act=auto2]').forEach(b => b.classList.toggle('on', !!auto));
}
function onKey(ev){
  if (!VIEW.classList.contains('active')) return;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName);
  if (typing || ev.ctrlKey || ev.metaKey || ev.altKey || document.querySelector('#modal-back.open')) return;
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
document.addEventListener('engr:tab', ev => { if (ev.detail === 'sys') activateTab(); });
if (VIEW.classList.contains('active')) activateTab();
window.EngrSys = {
  get state(){ return {state: cur, pres: pres ? pres.k : null, beats: beats.length, auto: !!auto}; },
  apply: s => apply(s), gotoBeat: k => gotoBeat(k), gotoState: s => gotoState(s), enterPres: () => enterPres(), exitPres: () => exitPres(), order: ORDER, blocks: () => blocks
};
})();
