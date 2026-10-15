/* 시드 식각 09 — 불량 도감: 이 불량은 어디서 왔을까? (범프 · 웨이퍼) */
(function(){
// 원인 꼬리표: 식각 인자 셋 + 비식각 인자 둘 (타일 · 상세 · 인자 지도 모두 같은 다섯 개)
const CATS = ['eq', 'bath', 'cond', 'up', 'dn'];
const TAG = {eq: '식각-장비', bath: '식각-액', cond: '식각-조건', up: '앞 공정', dn: '뒤 공정'};
const T1 = {eq: '장', bath: '액', cond: '조', up: '앞', dn: '뒤'};                 // 타일 꼬리표 (한 글자)
const TD = {eq: '장비', bath: '액', cond: '조건', up: '앞 공정', dn: '뒤 공정'};    // 상세 꼬리표
// 처음 보이는 검사 단계 (무대는 짧게, 카드는 길게)
const STG = ['식각 직후', '누설 시험', '리플로우 뒤', '본딩 · 적층 뒤', '신뢰성 시험 뒤'];
const STGL = ['식각 직후 (외관 · 표본 단면)', '누설(전기) 시험', '리플로우 뒤', '본딩 · 적층 뒤', '신뢰성 시험 뒤 (HAST 등)'];
const COMMON = '공통점 찾기 — 식각 장비 · 액 나이 · 단계 사이 시간 · PVD 챔버 · 도금 · 스트립 lot';
// 불량 14종: sn 타일 이름 · nm 이름 · def 생김새 · st 처음 보이는 단계 · map 맵 무늬(m: 웨이퍼 그림 종류) · c 원인 [꼬리표, 짧게, 더] · k 확인 · f 대책 · go 더 보기
const DEF = [
  {id: 'normal', sn: '정상', nm: '정상 (비교 기준)', def: '범프 사이에는 보호막만 남고, 밑동은 살짝 둥글게 깎였으며, 솔더 표면이 고릅니다. 같은 lot · 같은 자리의 정상 범프를 늘 함께 봅니다.',
    st: [], map: '비교 기준 — 불량 웨이퍼와 같은 lot · 같은 자리의 정상 범프를 함께 잰다', m: ['ok'], c: [],
    k: ['외관 · AOI(자동 광학 검사) — 두꺼운 잔여 · 얼룩 · 탈락', '누설 시험 패턴 — 눈에 안 보이는 얇은 잔여', '표본 FIB 단면 · 기울인 SEM — Cu · Ti 언더컷을 따로', '전단 시험 — 끊어진 면 (솔더 속 = 정상, 계면 = 의심)', 'XPS · AES — 솔더 표면 산화막 · 얇은 Ti'], f: '', go: [['end.time', '07장 끝점']]},
  {id: 'resid', sn: '시드 잔여', nm: '시드 잔여 (누설)', def: '범프 사이에 Cu · Ti가 얇은 막이나 섬으로 남았습니다. 몇 nm는 눈 · 보통 SEM-EDS로 안 보여 누설 시험에서 처음 드러납니다.',
    st: [0, 1, 4], map: '시드가 두꺼운 구역(가운데 · 고리) · 빽빽한 다이 · 장비 속도가 느린 쪽', m: ['center', 'dies'],
    c: [['cond', '과식각 부족 — 가장 늦은 곳을 다 못 지움', '레시피 시간을 블랭킷(패턴 없는 막) 계산으로만 잡으면 두꺼운 곳 · 빽빽한 곳이 남는다'], ['bath', '액 나이(과산화수소↓ · Cu²⁺↑) · 온도↓ → 속도↓'],
      ['eq', '유량 · 노즐 · 회전 — 속도 맵이 시드 맵과 어긋남'], ['up', 'PVD 두께 맵(두꺼운 곳) · 시드 표면 산화']],
    k: ['얇은 것 → 누설 · 절연 시험, AES · XPS', '두꺼운 것 → 외관 · AOI · SEM-EDS', '블랭킷 속도 · 장비 속도 맵 모니터'], f: '가장 늦은 곳 기준으로 시간 재설정, 속도 맵을 시드 맵에 맞추기, 액 교체 · 보충 주기',
    go: [['end.map', '07장 끝점 맵'], ['why.keep', '01장']]},
  {id: 'bridge', sn: '브리지', nm: '브리지 (단락)', def: '이웃 범프가 금속으로 이어졌습니다 — 바닥의 잔여 줄기, 또는 PR 위로 넘친 버섯 머리 · 노듈이 닿은 것입니다.',
    st: [0, 1, 2], map: '고립 · 가장자리 범프(오버 도금) / 빽빽한 곳(잔여 줄기)', m: ['edge', 'dies'],
    c: [['cond', '시드 잔여가 줄기로 이어짐'], ['up', '오버 도금 버섯 머리 · 노듈 · PR 들뜸으로 번진 밑동'], ['dn', '리플로우 · 본딩에서 솔더가 많거나 눌려 넘침', '솔더가 기둥 옆면으로 흘러내린 옆면 젖음도 이웃과 붙는 길이 된다']],
    k: ['위치 · 높이 — 버섯 머리면 PR 두께와 비교', '잇는 물질 — 두꺼우면 EDS, 얇으면 AES · 누설 시험'], f: '잔여면 식각 시간 · 속도 맵, 오버 도금이면 도금 시간 · 높이 산포 (→ 전해도금 12장)',
    go: [['#go-plating-12', '전해도금 12장']]},
  {id: 'local', sn: '가린 자리', nm: '국부 미식각 (가린 자리)', def: 'PR 찌꺼기 · 입자 · 붙은 거품에 가려 그 자리만 시드가 점 · 얼룩 모양으로 남았습니다.',
    st: [0, 1], map: '무작위 — PR lot · 스트립 장비와 함께 움직인다', m: ['random'],
    c: [['up', 'PR 스트립 찌꺼기 · 입자 · 얇은 유기막'], ['eq', '노즐 막힘 · 거품 · 처음 젖음 불량'], ['bath', '과산화수소가 분해된 O₂ 거품이 표면에 붙음']],
    k: ['광학 · SEM — 점 모양, 가운데 이물', 'EDS · AES — C · O가 나오면 유기물, 스트립 뒤 검사와 같은 자리인지'], f: '스트립 조건 · 세정, 식각 전 미리 적시기, 노즐 · 거품 점검 (→ PR 스트립 08장)',
    go: [['#go-strip-08', 'PR 스트립 08장']]},
  {id: 'tires', sn: 'Ti 잔여', nm: 'Ti 잔여 · 얇은 막', def: 'Cu는 다 지웠는데 Ti(또는 Ti 산화물 · 반응층)가 얇게 남았습니다. 색 차이가 작아 눈으로는 잘 안 보입니다.',
    st: [1, 4], map: '웨이퍼 전체 · Ti가 두꺼운 곳 · Cu가 먼저 지워진 곳', m: ['all'],
    c: [['cond', 'Ti 과식각 부족 · Cu 과식각이 길어 Ti 산화막↑', 'Ti가 Cu 식각액(과산화수소) 속에 오래 드러나면 산화막이 자라 Ti 식각의 유도 시간이 길어진다'], ['bath', '과산화수소계 Ti 식각액 분해(액 나이) · 온도'],
      ['up', 'PVD Ti 두께 · 산화 · 폴리이미드 위 Ti 반응층', '보호막이 폴리이미드면 스퍼터 Ti가 표면과 반응한 전도성 층(탄화물 등)이나 막 속으로 스민 Ti가 생길 수 있고, 보통 Ti 식각액으로 잘 안 지워진다 (공개 특허)']],
    k: ['누설 시험 · 시험 패턴 저항', 'AES · XPS (Ti), 단면 TEM(투과 전자 현미경) — 반응층'], f: 'Ti 과식각 · Cu 과식각 함께 재설정, 단계 사이 시간 일정, 액 관리, PVD 전처리 · 보호막 표면 처리 확인',
    go: [['ti.oxide', '06장 산화막']]},
  {id: 'undercut', sn: '언더컷', nm: '언더컷 과다', def: '밑동이 목처럼 가늘어졌습니다 — Cu 계면 홈과 Ti 언더컷. 위에서는 Ni · SnAg 모자(처마)에 가려 안 보입니다.',
    st: [0, 3], map: '시드가 얇은 구역 · 외톨이 범프 · 먼저 지워진 곳 — 잔여와 반대쪽', m: ['ring', 'iso'],
    c: [['cond', '과식각 과다 · 온도↑'], ['bath', '새 액(속도↑) · HF 갈바닉 — Ti가 끊긴 뒤', '범프 사이 Ti가 끊기는 순간 밑동 Ti 고리(좁은 애노드)가 넓은 Cu 범프(캐소드)에 붙어 빨리 녹는다'], ['eq', '헹굼 지연 — 고인 곳에서 더 깎임'],
      ['up', '시드 두께 산포 · 도금 Cu 결정 · PR 발', 'PR 발로 밑동이 이미 좁으면 피해가 겹친다']],
    k: ['표본 FIB · 기울인 SEM 단면 — Cu · Ti 따로 (위에서 잰 지름 CD로는 안 보임)', '위치별 전단 강도 · 떼어 낸 자리의 Ti 발자국'], f: '두께 맵 · 속도 맵 · 로딩부터 고친 뒤 과식각 줄이기, Ti 식각액 선택, 헹굼 지연 단축',
    go: [['under.over', '04장 과식각'], ['galv.bump', '05장 갈바닉'], ['ti.hf', '06장 HF']]},
  {id: 'lift', sn: '범프 탈락', nm: '범프 탈락 · 들뜸', def: '범프가 떨어지거나 기울었습니다. 떨어진 자리에 밑동 흔적과 뜯긴 시드가 남습니다.',
    st: [0, 3, 4], map: '외톨이 · 가장자리 · 큰 힘을 받는 곳', m: ['edge', 'iso'],
    c: [['cond', '언더컷 — 밑면적↓'], ['eq', '스프레이 압력 · 회전'], ['up', 'Ti–패드 밀착 · PVD 전처리'], ['dn', '스크러버 브러시 · 본딩 힘']],
    k: ['떨어진 자리의 면 — 어느 계면인지 EDS로', '전단 시험 — 힘과 끊어진 면'], f: '언더컷 줄이기, 밀착 개선(앞 공정), 뒤 공정 힘 확인',
    go: [['under.area', '04장 밑면적']]},
  {id: 'neck', sn: '기둥 목', nm: '기둥 얇아짐 · 목', def: 'Cu 기둥 지름이 줄거나 아래쪽이 잘록해졌습니다. Ni · SnAg 모자는 그대로라 처마가 생깁니다.',
    st: [0], map: '웨이퍼 전체(시간) · 도금 조건이 바뀐 lot', m: ['all'],
    c: [['cond', 'Cu 식각 시간 · 온도'], ['up', '도금 Cu 결정(풀림 전 · 잔 결정) · 전류밀도', '공개 보고: 풀림 전 도금 Cu가 스퍼터 Cu보다 빨리 녹았다 (이 탭 예시 1.3배)']],
    k: ['FIB · 기울인 SEM 단면 — 식각 전후 같은 자리', '위에서 잰 지름(CD)은 모자를 잰다 — 기둥은 안 보임'], f: '시간 최적화, 도금 뒤 대기(자기 풀림) · 도금 조건 확인 (→ 전해도금 06장)',
    go: [['under.pillar', '04장 기둥'], ['#go-plating-06', '전해도금 06장']]},
  {id: 'snox', sn: 'SnAg 변색', nm: 'SnAg 변색 · 산화', def: '솔더 표면이 어둡고 얼룩졌습니다. 리플로우에서 덜 젖거나(비젖음) 모양이 나빠질 수 있습니다.',
    st: [0, 2], map: '웨이퍼 전체 · 헹굼 · 건조가 늦은 쪽', m: ['all', 'side'],
    c: [['bath', '산화제 · pH · 조성, 늙은 Cu 식각액', '산화제가 모자란 늙은 Cu 식각액에서는 녹은 Cu가 Sn 위에 다시 석출될 수 있다'], ['eq', '헹굼 · 건조 지연'], ['dn', '플라즈마 처리 · 리플로우 분위기 · 대기 시간']],
    k: ['외관 색 · XPS · AES — 산화막 두께', '리플로우 뒤 모양 · 젖음'], f: '식각액 조성 · 시간, 헹굼 · 건조, 리플로우 전 처리 (→ 리플로우 03장)',
    go: [['#go-reflow-03', '리플로우 03장']]},
  {id: 'nier', sn: 'Ni 침식', nm: 'Ni 옆면 침식', def: 'Cu와 SnAg 사이의 Ni 띠가 안쪽으로 파여 단면에 홈이 생겼습니다. 리플로우 때 솔더가 흘러내리는 길이 됩니다.',
    st: [0, 2], map: '웨이퍼 전체 — 액 조성 · 시간과 함께 움직인다', m: ['all'],
    c: [['bath', '산성 · 산화제 조성'], ['cond', '시간 · 온도'], ['up', 'Ni 도금 조건 (응력 · 불순물)']],
    k: ['단면 SEM · EDS — Ni 띠 두께와 홈 깊이'], f: '식각액 · 시간 조정, Ni 도금 확인',
    go: [['ti.sel', '06장 선택비']]},
  {id: 'sidewet', sn: '옆면 젖음', nm: '솔더 옆면 젖음 (흘러내림)', def: '리플로우 · 본딩 때 솔더가 Ni를 넘어 Cu 기둥 옆면으로 흘러내립니다 — 범프가 낮아지고, 이웃과 붙거나 옆면 IMC가 생깁니다.',
    st: [2, 3], map: '웨이퍼 전체 · Cu 식각이 길었던 lot · 리플로우 조건과 함께', m: ['all'],
    c: [['bath', 'Ni 옆면 침식 — 경계가 무너짐'], ['cond', '기둥 옆면이 깨끗하게 드러남 · 시간', '시드 식각이 옆면의 산화막 · 유기막을 걷어 내 젖기 쉬운 Cu가 드러난다'], ['dn', '리플로우 분위기 · 시간 · 온도']],
    k: ['단면 — 옆면 IMC · 솔더 높이', '범프 높이 분포 · 누설 시험'], f: 'Ni 손상 줄이기, 리플로우 조건 (→ 리플로우 04장)',
    go: [['#go-reflow-04', '리플로우 04장']]},
  {id: 'pas', sn: '보호막 손상', nm: '보호막 손상', def: '범프 사이 보호막이 얇아졌습니다 — 산화막 · PECVD 질화막은 HF에, 폴리이미드 표면은 높은 pH · 온도에 약합니다.',
    st: [0, 4], map: '웨이퍼 전체 · 가장자리', m: ['all', 'edge'],
    c: [['bath', 'HF 농도 · pH'], ['cond', '시간 · 온도'], ['up', '보호막 재료 · 경화 · 막질 (PECVD 조건)']],
    k: ['막 두께 — 엘립소미터 · 단면', '표면 상태'], f: 'Ti 식각액 선택, 시간 · 온도, 막질 확인(앞 공정)',
    go: [['ti.sel', '06장 선택비']]},
  {id: 'stain', sn: '물자국', nm: '물자국 · 얼룩', def: '헹굼 · 건조에서 남은 점 · 고리 자국과 변색 얼룩입니다. 남은 약품은 뒤에 산화 · 부식으로 번질 수 있습니다.',
    st: [0], map: '위아래(배치 넣고 빼기) · 한쪽(노즐 · 팔) · 가장자리(건조)', m: ['updown'],
    c: [['eq', '헹굼 유량 · 건조(회전 · N₂) · 지연'], ['bath', '남은 약품 (헹굼 부족)']],
    k: ['광학 검사 — 고리 · 점 모양과 위치', '이온 분석 — 남은 황산 · 불소'], f: '헹굼 · 건조 조건, 식각 → 헹굼 지연 단축',
    go: [['tool.rinse', '08장 헹굼']]},
  {id: 'redep', sn: '재부착', nm: '재부착 · 치환 석출 · 입자', def: '녹았던 금속이 다시 붙었습니다. 액 속 Cu 이온이 더 잘 녹는 Ti · Sn에서 전자를 받아 Cu 점으로 내려앉기도 합니다(치환 석출). 필터를 지난 입자 · 거품 자국도 여기에 듭니다.',
    st: [0, 1], map: '무작위 — 액 나이와 함께 늘어난다', m: ['random'],
    c: [['eq', 'Cu → Ti 식각 사이 헹굼 · 회수 경로 부족', 'Cu²⁺가 Ti 식각액(HF)으로 넘어가 Ti 위에 Cu로 치환 석출된다'], ['bath', '늙은 Cu 식각액(산화제 부족) → Sn 위 Cu 석출'],
      ['eq', '필터 · 순환 · 컵 오염'], ['up', '앞 공정 입자']],
    k: ['SEM · EDS 맵 — Cu 점이 Ti · Sn 자리에', '액 입자 수 · 필터 앞뒤 압력 차(ΔP)'], f: '단계 사이 헹굼 · 회수 경로 분리, 액 교체 · 필터, 컵 세정',
    go: [['tool.rinse', '08장 헹굼'], ['tool.bath', '08장 식각액']]}
];
const BY = Object.fromEntries(DEF.map(d => [d.id, d]));
const cats = d => CATS.filter(c => d.c.some(x => x[0] === c));
const GROUPS = {resid: ['resid', 'bridge', 'local', 'tires'], over: ['undercut', 'lift', 'neck'], hurt: ['snox', 'nier', 'sidewet', 'pas'], stain: ['stain', 'redep']};
const GCAP = {resid: '덜 지운 것 — 잔여 · 누설 · 브리지', over: '너무 지운 것 — 언더컷 · 탈락', hurt: '다치게 한 것 — 솔더 · Ni · 보호막', stain: '얼룩 · 재부착 · 입자'};
const DEMO = {resid: 'resid', over: 'undercut', hurt: 'snox', stain: 'stain'};
const groupOf = id => Object.keys(GROUPS).find(k => GROUPS[k].includes(id));
// 타일 배치: 2줄 × 7칸
const TW = 206, TH = 210, GX = 40, GY = 128, TP = 222;
const tilePos = i => ({x: GX + (i % 7) * TP, y: GY + Math.floor(i / 7) * TP});
// 상세: 왼쪽 그림 · 오른쪽 글
// 좁은 세로 화면: 왼쪽 상세 그림 · 맵 무늬만 크게 (글은 카드에)
const VN = {x: 44, y: 612, w: 568, h: 494};
const DCX = 330, DBY = 832, DK = 2.35, DX0 = 640, DX1 = 1540, WCX = 120, WCY = 1036, WR = 54;

// 범프 두 개 단면. (cx, by) = 범프 사이 가운데의 보호막 윗면, k = 배율. 로컬 좌표: 범프 지름 25 µm = 55, 피치 55 µm = 120 (1 µm ≈ 2.2)
// 층: 보호막 y 0~12 · Ti −3~0 · Cu 시드 −7~−3 · Cu 기둥 −40~−7 · Ni −47~−40 · SnAg −73~−47 (리플로우 전 원기둥). 시드 두께는 크게 과장
function bump(K, id, cx, by, k, mk){
  const {R, E, P, PG, L, G} = K, q = K.q1;
  const X = x => cx + x * k, Y = y => by + y * k;
  const rect = (x0, y0, x1, y1, c, o) => R(X(x0), Y(y0), (x1 - x0) * k, (y1 - y0) * k, c, o);
  const poly = (pts, c, o) => PG(pts.map(([x, y]) => [X(x), Y(y)]), c, o);
  const W = 27.5;
  const pas = () => rect(-100, 0, 100, 12, 'f-pas');
  const cyl = bx => P(`M${q(X(bx - W))},${q(Y(-47))} L${q(X(bx - W))},${q(Y(-70))} Q${q(X(bx - W))},${q(Y(-73))} ${q(X(bx - W + 3))},${q(Y(-73))} L${q(X(bx + W - 3))},${q(Y(-73))} Q${q(X(bx + W))},${q(Y(-73))} ${q(X(bx + W))},${q(Y(-70))} L${q(X(bx + W))},${q(Y(-47))} Z`, 'f-sn2');
  const dome = (bx, top) => P(`M${q(X(bx - W))},${q(Y(-47))} C${q(X(bx - W - 1))},${q(Y(top + 8))} ${q(X(bx - W * 0.55))},${q(Y(top))} ${q(X(bx))},${q(Y(top))} C${q(X(bx + W * 0.55))},${q(Y(top))} ${q(X(bx + W + 1))},${q(Y(top + 8))} ${q(X(bx + W))},${q(Y(-47))} Z`, 'f-sn2');
  // 기둥 하나 (o.sd Cu 시드 안쪽 들어감 · o.ti Ti 들어감 · o.neck 기둥 잘록 · o.ni Ni 들어감 · o.sa 'cyl' | 'dome' | 'none')
  const col = (bx, o = {}) => {
    const sd = o.sd == null ? 1.4 : o.sd, ti = o.ti == null ? 0.8 : o.ti, ni = o.ni || 0;
    let s = rect(bx - W + ti, -3, bx + W - ti, 0, 'f-ti') + rect(bx - W + sd, -7, bx + W - sd, -3, 'f-seed2');
    s += o.neck ? poly([[bx - W + 3, -40], [bx + W - 3, -40], [bx + W - 3, -29], [bx + W - 8.5, -14], [bx + W - 8, -7], [bx - W + 8, -7], [bx - W + 8.5, -14], [bx - W + 3, -29]], 'f-cu2') : rect(bx - W, -40, bx + W, -7, 'f-cu2');
    s += rect(bx - W + ni, -47, bx + W - ni, -40, 'f-ni');
    if (o.sa === 'dome') s += dome(bx, o.top || -64);
    else if (o.sa !== 'none') s += cyl(bx);
    return s;
  };
  const ring = (x, y, rx, ry) => mk ? E(X(x), Y(y), rx * k, ry * k, 'et09-mk') : '';
  switch (id){
    case 'resid':
      return pas() + col(-60) + col(60) + rect(-32.5, -2.5, 32.5, 0, 'et09-tif') + rect(-27, -6.5, -15, -2.5, 'f-seed2') + rect(-7, -6, 4, -2.5, 'f-seed2') + rect(12, -6.5, 23, -2.5, 'f-seed2') + ring(0, -3, 38, 8);
    case 'bridge':
      return pas() + col(-60, {sa: 'none'}) + col(60, {sa: 'none'}) + rect(-87.5, -77, -32.5, -47, 'f-sn2') + rect(32.5, -77, 87.5, -47, 'f-sn2')
        + E(X(-42), Y(-79), 43 * k, 6.5 * k, 'f-sn2') + E(X(42), Y(-79), 43 * k, 6.5 * k, 'f-sn2')
        + rect(-32.5, -2.5, 32.5, 0, 'et09-tif') + rect(-32.5, -5.5, 32.5, -2.5, 'f-seed2') + ring(0, -79, 10, 9) + ring(0, -3, 37, 7);
    case 'local':
      return pas() + col(-60) + col(60) + rect(-13, -2.5, 9, 0, 'et09-tif') + rect(-12, -6, 8, -2.5, 'f-seed2')
        + poly([[-11, -6], [-9, -12], [-3, -15.5], [4, -14], [8, -9], [6, -6]], 'f-res') + ring(-2, -8, 18, 11);
    case 'tires':
      return pas() + col(-60) + col(60) + rect(-32.5, -2.8, 32.5, 0, 'et09-tif') + ring(0, -1.5, 38, 6);
    case 'undercut':
      return pas() + col(-60, {sd: 9, ti: 12.5}) + col(60, {sd: 9, ti: 12.5}) + ring(-32.5, -4, 9, 8) + ring(32.5, -4, 9, 8);
    case 'lift': {
      let s = pas() + col(-60) + rect(32.5, -73, 87.5, 0, 'pl-ghost');
      s += rect(35, -2.5, 46, 0, 'f-ti') + rect(56, -2.5, 63, 0, 'f-ti') + rect(71, -2.5, 84, 0, 'f-ti') + rect(37, -5, 43, -2.5, 'f-seed2') + rect(74, -5.5, 81, -2.5, 'f-seed2');
      return s + G(col(60), {transform: `rotate(-17 ${q(X(60))} ${q(Y(-36))}) translate(${q(-4 * k)} ${q(-14 * k)})`}) + ring(60, -2, 31, 6);
    }
    case 'neck':
      return pas() + col(-60, {neck: 1, sd: 9, ti: 10}) + col(60, {neck: 1, sd: 9, ti: 10})
        + L(X(-87.5), Y(-40), X(-87.5), Y(-3), 'pl-ghost') + L(X(-32.5), Y(-40), X(-32.5), Y(-3), 'pl-ghost') + L(X(32.5), Y(-40), X(32.5), Y(-3), 'pl-ghost') + L(X(87.5), Y(-40), X(87.5), Y(-3), 'pl-ghost')
        + ring(-36, -18, 7, 15) + ring(36, -18, 7, 15);
    case 'snox': {
      let s = pas() + col(-60) + col(60);
      [-60, 60].forEach(bx => { s += rect(bx - W, -73, bx + W, -69.5, 'f-snox') + rect(bx - W, -69.5, bx - W + 2.2, -50, 'f-snox') + rect(bx + W - 2.2, -69.5, bx + W, -50, 'f-snox')
        + E(X(bx - 10), Y(-64), 6 * k, 3 * k, 'et09-spot') + E(X(bx + 9), Y(-58), 5 * k, 2.6 * k, 'et09-spot'); });
      return s + ring(-60, -71, 32, 6) + ring(60, -71, 32, 6);
    }
    case 'nier':
      return pas() + col(-60, {ni: 6}) + col(60, {ni: 6}) + ring(-32.5, -43.5, 8, 7) + ring(32.5, -43.5, 8, 7);
    case 'sidewet': {
      let s = pas() + col(-60, {sa: 'dome', ni: 2.5, top: -62}) + col(60, {sa: 'dome', ni: 2.5, top: -62});
      [-60, 60].forEach(bx => { s += rect(bx - W - 3.4, -46, bx - W, -6, 'f-sn2') + rect(bx + W, -46, bx + W + 3.4, -6, 'f-sn2') + rect(bx - W - 0.9, -45, bx - W, -7, 'f-imc') + rect(bx + W, -45, bx + W + 0.9, -7, 'f-imc'); });
      s += E(X(-29), Y(-6.5), 5.5 * k, 4.5 * k, 'f-sn2') + E(X(29), Y(-6.5), 5.5 * k, 4.5 * k, 'f-sn2');
      return s + ring(-30, -26, 7, 22) + ring(30, -26, 7, 22);
    }
    case 'pas':
      return poly([[-100, 0], [-32.5, 0], [-29, 5], [29, 5], [32.5, 0], [100, 0], [100, 12], [-100, 12]], 'f-pas') + rect(-29, 0, 29, 5, 'et09-lost')
        + col(-60) + col(60) + ring(0, 3, 36, 7);
    case 'stain': {
      let s = pas() + col(-60) + col(60);
      s += E(X(-13), Y(-0.8), 11 * k, 2.6 * k, 'et09-ring') + E(X(14), Y(-0.8), 7.5 * k, 2.2 * k, 'et09-ring') + E(X(52), Y(-73.6), 9 * k, 2.4 * k, 'et09-ring') + E(X(-66), Y(-73.6), 7 * k, 2 * k, 'et09-ring')
        + E(X(70), Y(-60), 4.2 * k, 2.8 * k, 'et09-stn') + E(X(-79), Y(-24), 2.6 * k, 3.6 * k, 'et09-stn');
      return s + ring(0, -1, 33, 6) + ring(60, -74, 30, 6);
    }
    case 'redep': {
      let s = pas() + col(-60) + col(60);
      [[45, -74], [53, -74.6], [63, -74.2], [72, -74.6], [-8, -1.3], [4, -1.4], [18, -1.3]].forEach(([x, y]) => { s += E(X(x), Y(y), 2.6 * k, 1.8 * k, 'f-cu2'); });
      s += poly([[-24, 0], [-22, -3.4], [-17, -4.2], [-15, 0]], 'et09-part');
      return s + ring(60, -74, 27, 6) + ring(0, -1.5, 33, 6);
    }
    default:
      return pas() + col(-60) + col(60);
  }
}
// 상세 그림의 번호 [특징 x, y (로컬), 번호 자리 dx, dy (px), 글]
const NOTE = {
  normal: [[-32, -4, 50, -86, '밑동은 살짝 둥글게 — 작은 언더컷'], [0, 0, 0, -64, '범프 사이에는 보호막만']],
  resid: [[-21, -5, 10, -96, '남은 Cu 섬'], [17, -1.2, -10, -56, '얇은 Ti 막 — 눈에 잘 안 보임']],
  bridge: [[0, -79, 0, 50, '버섯 머리가 닿음 (PR 높이를 넘긴 오버 도금)'], [0, -4, 0, -60, '바닥 잔여 줄기']],
  local: [[-2, -12, -2, -84, 'PR 찌꺼기 · 입자에 가림'], [8, -4, 34, -40, '그 밑만 안 녹은 시드']],
  tires: [[0, -1.5, 0, -70, 'Ti(산화물 · 반응층)만 얇게 남음']],
  undercut: [[-34, -4, 34, -60, 'Cu 계면 홈 · Ti 언더컷'], [-60, -73, 100, 30, '위에서는 모자에 가려 안 보임']],
  lift: [[60, -2, -60, -54, '밑동 흔적 · 뜯긴 시드'], [44, -60, -70, 0, '기울어 떨어진 범프']],
  neck: [[-35, -18, 34, -40, '아래쪽이 잘록 — 기둥 얇아짐'], [-34, -44, 34, -64, 'Ni · SnAg 모자는 그대로 → 처마']],
  snox: [[-60, -71, 100, 22, '어둡고 얼룩진 솔더 표면 (산화막)']],
  nier: [[-34, -43.5, 36, -46, 'Ni 띠가 안쪽으로 파임']],
  sidewet: [[-31, -26, 36, -40, '솔더가 기둥 옆면으로 흘러내림'], [-60, -62, 0, -36, '꼭대기 솔더가 줄어 범프가 낮아짐']],
  pas: [[0, 3, 0, -86, '범프 사이 보호막이 얇아짐 (HF 등)']],
  stain: [[-12, -0.6, -6, -70, '헹굼 · 건조 물자국 (고리 · 점)'], [52, -73, -100, 30, '솔더 위 얼룩']],
  redep: [[58, -74, -110, 40, 'Sn 위 Cu 점 (석출)'], [4, -1.4, 6, -70, 'Ti · 보호막 위 Cu 점 · 입자']]
};
// 작은 웨이퍼 맵 (예시 무늬)
function wmap(K, kinds, cx, cy, r){
  const {C, R, P} = K, q = K.q1, g = K.rng(7);
  let s = C(cx, cy, r, 'et09-waf');
  const n = 7, p = 2 * r / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
    const x = cx - r + (i + 0.5) * p, y = cy - r + (j + 0.5) * p;
    if (Math.hypot(Math.abs(x - cx) + p / 2, Math.abs(y - cy) + p / 2) <= r) s += R(x - p / 2 + 1, y - p / 2 + 1, p - 2, p - 2, 'et09-die');
  }
  const ann = (r1, r2) => `M${q(cx + r1)},${cy} A${r1},${r1} 0 1 0 ${q(cx - r1)},${cy} A${r1},${r1} 0 1 0 ${q(cx + r1)},${cy} Z M${q(cx + r2)},${cy} A${r2},${r2} 0 1 1 ${q(cx - r2)},${cy} A${r2},${r2} 0 1 1 ${q(cx + r2)},${cy} Z`;
  kinds.forEach(kd => {
    if (kd === 'ok') s += C(cx, cy, r * 0.96, 'et09-wok');
    if (kd === 'ring') s += P(ann(r * 0.97, r * 0.7), 'et09-wbad');
    if (kd === 'center') s += C(cx, cy, r * 0.42, 'et09-wbad');
    if (kd === 'all') s += C(cx, cy, r * 0.96, 'et09-wall');
    if (kd === 'side') s += P(`M${cx},${cy} L${q(cx + r * 0.96 * Math.cos(-0.9))},${q(cy + r * 0.96 * Math.sin(-0.9))} A${q(r * 0.96)},${q(r * 0.96)} 0 0 1 ${q(cx + r * 0.96 * Math.cos(0.9))},${q(cy + r * 0.96 * Math.sin(0.9))} Z`, 'et09-wbad');
    if (kd === 'updown') s += P(`M${q(cx - r * 0.83)},${q(cy - r * 0.55)} A${q(r * 0.995)},${q(r * 0.995)} 0 0 1 ${q(cx + r * 0.83)},${q(cy - r * 0.55)} Z`, 'et09-wbad') + P(`M${q(cx - r * 0.9)},${q(cy + r * 0.42)} A${q(r * 0.995)},${q(r * 0.995)} 0 0 0 ${q(cx + r * 0.9)},${q(cy + r * 0.42)} Z`, 'et09-wbad2');
    if (kd === 'dies') for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
      const x = cx - r + (i + 0.5) * p, y = cy - r + (j + 0.5) * p;
      if (Math.hypot(Math.abs(x - cx) + p / 2, Math.abs(y - cy) + p / 2) <= r) s += R(x - p / 2 + 2, y - p / 2 + 2, p * 0.42, p * 0.42, 'et09-wdot');
    }
    if (kd === 'edge') for (let a = 0; a < 14; a++){ const t = a / 14 * Math.PI * 2 + 0.2; s += C(cx + r * 0.88 * Math.cos(t), cy + r * 0.88 * Math.sin(t), 3.2, 'et09-wdot'); }
    if (kd === 'iso') [[0.25, -0.35], [-0.3, 0.2], [0.5, 0.35]].forEach(([a, b]) => { s += C(cx + a * r, cy + b * r, 4.5, 'et09-wdot'); });
    if (kd === 'random') for (let a = 0; a < 16; a++){ const t = g() * Math.PI * 2, rr = Math.sqrt(g()) * r * 0.9; s += C(cx + rr * Math.cos(t), cy + rr * Math.sin(t), 2.6 + g() * 1.6, 'et09-wdot'); }
  });
  return s + P(`M${q(cx - 6)},${q(cy + r)} L${cx},${q(cy + r - 7)} L${q(cx + 6)},${q(cy + r)}`, 'et09-notch');
}

// ---------------- 인자 지도 ----------------
const OUTS = [['resid', '잔여 · 누설'], ['under', '언더컷 · 밑동'], ['lift', '밀착 · 범프 탈락'], ['metal', '기둥 · Ni · 솔더 손상 · 옆면 젖음'], ['pas', '보호막 손상'], ['unif', '웨이퍼 · 다이 균일도'], ['stain', '얼룩 · 재부착 · 입자']];
// [id, 상자 이름, 긴 이름, 꼬리표, [[결과, 방향(good · bad · chg), 확신(L 법칙 · T 보통 경향 · D 조건에 따라), 설명]]]
const INS = [
  ['oe', '과식각 % ↑', '과식각 % ↑ (다 지운 뒤 더 담그는 시간)', 'cond', [['resid', 'good', 'L', '더 오래 → 가장 늦은 곳까지 지운다'], ['under', 'bad', 'L', '먼저 지워진 곳이 그만큼 더 옆으로 녹는다'], ['lift', 'bad', 'T', '밑면적↓ → 밀착 여유↓'], ['metal', 'bad', 'T', '기둥 · Ni · 솔더가 액에 더 오래 닿는다'], ['pas', 'bad', 'T', 'HF로 Ti를 지우면 산화막 보호막 손실↑']]],
  ['temp', '온도 ↑', '식각액 온도 ↑', 'cond', [['resid', 'good', 'T', '속도↑ → 같은 시간에 더 지운다'], ['unif', 'chg', 'D', '반응 지배면 속도가 크게 올라 1초 오차의 무게↑'], ['under', 'bad', 'T', '같은 시간이면 더 깎인다'], ['metal', 'bad', 'T', '부식 · 변색이 빨라진다'], ['stain', 'chg', 'D', '과산화수소 분해 · 거품↑']]],
  ['tiexp', 'Ti 노출 · 대기 ↑', 'Ti 노출 (Cu 과식각 · 단계 사이 대기) ↑', 'cond', [['resid', 'bad', 'T', 'Ti 산화막↑ → 유도 시간↑ → Ti 잔여'], ['unif', 'bad', 'D', 'Cu가 먼저 지워진 곳일수록 Ti 식각이 늦게 시작']]],
  ['conc', '산화제 농도 ↑', '산화제(과산화수소) 농도 ↑', 'bath', [['resid', 'good', 'T', '속도↑ → 같은 시간에 더 지운다'], ['under', 'bad', 'T', '같은 시간이면 더 깎인다 (시간을 줄여 맞추면 상쇄)'], ['stain', 'bad', 'T', '산이 모자라면 산화막 · 얼룩 · 부동태'], ['metal', 'bad', 'T', '솔더 · Ni 표면 산화↑']]],
  ['age', '액 나이 ↑', '액 나이 ↑ (Cu²⁺↑ · 과산화수소↓, 앞 단계에서 넘어온 Cu²⁺ 포함)', 'bath', [['resid', 'bad', 'T', '속도↓ → 같은 시간에 덜 지운다'], ['under', 'good', 'T', '같은 시간이면 덜 깎인다 — 새 액으로 바꾼 직후가 가장 많이 깎인다'], ['unif', 'bad', 'T', '장 사이 · 날 사이 차이'], ['stain', 'bad', 'T', '재부착 · 치환 석출 · 거품']]],
  ['hf', '묽은 HF로 Ti 식각', 'Ti 식각액을 묽은 HF로 (과산화수소계 대신)', 'bath', [['under', 'bad', 'T', '빠르고, 범프 사이 Ti가 끊긴 뒤 갈바닉 → Ti 언더컷↑'], ['pas', 'bad', 'L', '산화물 보호막 · PECVD 질화막을 녹인다'], ['metal', 'good', 'T', 'Cu 보호제 없는 과산화수소계보다 Cu 공격이 적은 편']]],
  ['flow', '흐름 · 회전 · 노즐 맵', '흐름 · 회전 · 유량 · 노즐(속도) 맵', 'eq', [['resid', 'good', 'T', '공급 지배면 빨라지고 빽빽한 곳이 덜 늦다'], ['under', 'bad', 'D', '같은 시간이면 더 깎인다 — 좁은 틈 속 옆면은 조건에 따라'], ['unif', 'good', 'T', '속도 맵을 시드 맵에 맞추면 끝점 맵이 평평해진다']]],
  ['delay', '헹굼 지연 ↑', '식각 → 헹굼 전환 지연 ↑', 'eq', [['under', 'bad', 'L', '고인 곳에서 지연 × 속도만큼 더 깎인다'], ['stain', 'bad', 'T', '마른 자리 · 얼룩 · 산화'], ['unif', 'bad', 'T', '배치 위아래 · 웨이퍼 안 차이']]],
  ['midr', '단계 사이 헹굼 부족', 'Cu 식각 → Ti 식각 사이 헹굼 · 회수 경로 부족', 'eq', [['stain', 'bad', 'T', 'Cu²⁺가 Ti 식각액으로 → Ti · Sn 위 Cu 치환 석출'], ['resid', 'bad', 'D', '석출된 Cu가 Ti를 가려 국부 잔여'], ['unif', 'bad', 'T', 'Ti 식각액이 빨리 지친다']]],
  ['seed', '시드 두께 · 산포 ↑', 'PVD 시드 두께 · 산포 ↑', 'up', [['resid', 'bad', 'T', '시간을 그대로 두면 두꺼운 곳에 잔여'], ['under', 'bad', 'L', '시간을 늘리면 얇은 곳 · 기둥 깎임↑'], ['unif', 'bad', 'T', '끝점 맵이 시드 맵을 닮는다 (속도 맵으로 상쇄 가능)']]],
  ['dens', '패턴 밀도 차이 ↑', '패턴 밀도 차이 (빽빽한 블록 vs 외톨이) ↑', 'up', [['resid', 'bad', 'T', '빽빽한 곳이 늦게 지워진다'], ['under', 'bad', 'T', '외톨이 · 성긴 곳이 오래 녹는다'], ['unif', 'bad', 'T', '다이 안 · 다이 사이 차이']]],
  ['prres', 'PR 찌꺼기 · 입자', 'PR 스트립 찌꺼기 · 입자', 'up', [['resid', 'bad', 'T', '가린 자리만 안 녹는다 (점 · 섬)'], ['stain', 'bad', 'T', '얼룩 · 입자']]],
  ['ecdcu', '도금 Cu 결정', '도금 Cu 결정 (풀림 전 · 잔 결정)', 'up', [['metal', 'bad', 'D', '기둥이 더 빨리 얇아진다'], ['under', 'bad', 'D', '계면 홈']]],
  ['pasf', '보호막 재료 · 막질', '보호막 재료 · 막질 (폴리이미드 · PECVD)', 'up', [['resid', 'bad', 'D', '폴리이미드 위 Ti 반응층 — 보통 Ti 식각액으로 잘 안 지워짐'], ['pas', 'chg', 'D', 'PECVD 막질에 따라 HF 손실이 다르다']]],
  ['down', '뒤 공정 힘 · 열', '뒤 공정의 힘 · 열 · 분위기 (스크러버 · 리플로우 · 본딩)', 'dn', [['lift', 'bad', 'T', '같은 언더컷도 탈락 · 균열로 드러난다'], ['metal', 'bad', 'D', '드러난 기둥 옆면 · Ni 침식 자리로 솔더가 흘러내림']]]
];
const GIX = {cond: 0, bath: 1, eq: 2, up: 3, dn: 4};
const EFF = {good: ['좋아짐', 'pl-eg'], bad: ['나빠짐', 'pl-eb'], chg: ['달라짐', 'pl-ec']};
const CONF = {L: '법칙', T: '보통 경향', D: '조건에 따라'};
const IX = 50, IW = 412, IH = 44, IG = 5, GG = 12, IY = 170, OX = 1120, OW = 440, OH = 98, OG = 10, OY = 170;
const iTop = k => IY + k * (IH + IG) + GIX[INS[k][3]] * GG, iy = k => iTop(k) + IH / 2;
const oTop = j => OY + j * (OH + OG), oy = j => oTop(j) + OH / 2;
const mid = (k, j) => [(IX + IW + OX) / 2, (iy(k) + oy(j)) / 2];

// ---------------- 크기 막대: 앞 장 식을 그대로 (개념 모델 · 예시) ----------------
// 07장 끝점 맵: 다이 15 × 15 (피치 36, 웨이퍼 반지름 270), 두께 h = 300(1 + u(1 − 2ρ²)) nm, 빽빽한 블록 속도 r(1 − d) (부분 다이는 d/2), 레시피 시간 60(1 + 과식각) s
function dies(o){
  const m = o.m == null ? 1 : o.m, u = o.u == null ? 5 : o.u, d = o.d == null ? 20 : o.d, oe = o.oe == null ? 30 : o.oe;
  const r0 = 300 * m, tend = 60 * (1 + oe / 100), out = [];
  for (let i = 0; i < 15; i++) for (let j = 0; j < 15; j++){
    const cx = (i - 7) * 36, cy = (j - 7) * 36, dist = Math.hypot(cx, cy);
    if (dist > 262) continue;
    const part = ![-1, 1].every(sx => [-1, 1].every(sy => Math.hypot(cx + sx * 17, cy + sy * 17) <= 270));
    const rho = dist / 270, h = 300 * (1 + u / 100 * (1 - 2 * rho * rho)), dd = d / 100 * (part ? 0.5 : 1);
    out.push({i, j, bad: h / (r0 * (1 - dd)) * 60 > tend});
  }
  return out;
}
const resPct = ds => 100 * ds.filter(x => x.bad).length / ds.length;
// 04장: 기둥 밑동 깎임 = 1.3 × 300 nm/분 × 속도 배수 × 레시피 시간 + 헹굼 지연(고인 곳 상한)
const pillar = o => 1.3 * 300 * (o.m == null ? 1 : o.m) * (1 + (o.oe == null ? 30 : o.oe) / 100) + 1.3 * 300 * (o.dl || 0) / 60;
// 06장: Ti 언더컷 u = h + G·r·(t − t₀), 묽은 HF 600 nm/분 · 유도 3 s · G 4 (과산화수소계 30 nm/분 · 유도 10 s · G 1.5), Ti 100 nm, 과식각 30 %
function tiU(o){
  const px = o.perox, r = (px ? 30 : 600) * (o.mt || 1), t0 = (px ? 10 : 3) + 100 / r * 60, t = o.fixed ? o.fixed : t0 * (1 + (o.oe == null ? 30 : o.oe) / 100);
  return t < t0 ? {u: 100, left: true} : {u: 100 + (px ? 1.5 : 4) * r * (t - t0) / 60};
}
const arr = (Ea, dT) => Math.exp(Ea / 8.314 * (1 / 298.15 - 1 / (298.15 + dT)));
const f2 = v => (Math.round(v * 100) / 100).toFixed(2).replace(/0$/, '').replace(/\.0$/, '');
const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v);
const eul = w => { const c = w.charCodeAt(w.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '을' : '를'; };
// 손잡이 한 칸 = 기획의 '한 칸'. 슬라이더 k(−2 ~ +2 칸)만큼 돌린다
const KNOB = {
  oe: k => { const oe = Math.max(0, 30 + 10 * k); return {lab: `과식각 30 → ${oe} %`, res: {oe}, pil: {oe}, ti: {oe}}; },
  temp: k => { const dT = 5 * k; return {lab: `온도 25 → ${25 + dT} °C → Cu 속도 ×${f2(Math.pow(1.2, k))}`, fx: 1, res: {m: Math.pow(1.2, k)}, pil: {m: Math.pow(1.2, k)}, ti: {mt: arr(30000, dT), fixed: 16.9}}; },
  conc: k => ({lab: `산화제 ×${f2(Math.pow(1.2, k))} → Cu 속도 ×${f2(Math.pow(1.2, k))}`, fx: 1, res: {m: Math.pow(1.2, k)}, pil: {m: Math.pow(1.2, k)}}),
  age: k => { const a = Math.max(0, k), m = Math.pow(0.8, a); return {lab: k > 0 ? `새 액 → 나이 ${f2(a)} 칸 → Cu 속도 ×${f2(m)}` : '새 액 그대로' + (k < 0 ? ' (기준이 새 액)' : ''), fx: 1, res: {m}, pil: {m}}; },
  hf: k => k > 0 ? {lab: 'Ti 식각액: 과산화수소계 → 묽은 HF', ti0: {perox: 1}, ti: {}} : k < 0 ? {lab: 'Ti 식각액: 묽은 HF → 과산화수소계', ti: {perox: 1}} : {lab: 'Ti 식각액 그대로 (0 칸)', ti: {}},
  flow: k => ({lab: `흐름 ×${f2(Math.pow(2, k))} → Cu 속도 ×${f2(Math.pow(1.25, k))}`, fx: 1, res: {m: Math.pow(1.25, k)}, pil: {m: Math.pow(1.25, k)}}),
  delay: k => { const dl = Math.max(0, 2 * k); return {lab: `헹굼 지연 0 → ${dl} s` + (k < 0 ? ' (기준이 0 s)' : ''), fx: 1, pil: {dl}}; },
  seed: k => { const u = Math.max(0, 5 + 2 * k); return {lab: `시드 두께 산포 ±5 → ±${u} %`, fx: 1, res: {u}}; },
  dens: k => { const d = Math.min(50, Math.max(0, 20 + 10 * k)); return {lab: `빽빽한 블록 밀도 20 → ${d} %`, fx: 1, res: {d}}; }
};
function sizeOf(id, k){
  const kn = KNOB[id];
  if (!kn) return null;
  const s = kn(k), out = {lab: s.lab, fx: !!s.fx};
  const d0 = dies({}), r0 = resPct(d0);
  out.dies = s.res ? dies(s.res) : d0;
  out.res = s.res ? [r0, resPct(out.dies)] : null;
  out.pil = s.pil ? [pillar({}), pillar(s.pil)] : null;
  if (s.ti){ const a = tiU(s.ti0 || {}), b = tiU(s.ti); out.ti = [a.u, b.u, b.left]; }
  return out;
}

(window.EngrEtchChapters = window.EngrEtchChapters || []).push({
  no: '09', id: 'defects', part: 3, short: '불량 · 인자', scale: '범프 · 웨이퍼',
  title: '불량 도감 — 이 불량은 어디서 왔을까?',
  hook: '잔여와 언더컷은 한 줄의 양 끝',
  one: '시드 식각 불량은 크게 셋입니다. 덜 지운 것(잔여 → 누설 · 단락), 너무 지운 것(언더컷 → 밑동 약함 · 범프 탈락), 다른 것을 다치게 한 것(솔더 · Ni · 보호막 손상, 얼룩)입니다. 처음 보인 검사 단계 · 웨이퍼 무늬 · 원인 꼬리표로 식각 원인과 앞뒤 공정 원인을 가르고, 고칠 손잡이가 다른 불량을 키우지 않는지 거꾸로 확인합니다.',
  ana: '<b>진찰</b> — 증상(불량 모양) + 언제부터(처음 보인 단계) + 어디에(맵 무늬)로 원인 후보를 좁히고, 검사로 확인합니다. 약을 고를 때는 부작용(다른 불량)도 봅니다. <i>(비유의 한계: 한 불량에 원인이 여럿 겹치는 경우가 많고(예: PR 발 + 과식각 = 가는 밑동), 같은 장비 · 액 나이 · lot 의 \'공통점\' 데이터가 있어야 좁혀집니다.)</i>',
  steps: [
    {id: 'resid', viewN: VN, t: '덜 지운 것 — 잔여 · 누설 · 브리지', d: '범프 사이에 Cu · Ti가 얇게 · 섬처럼 남거나, PR 찌꺼기 · 입자에 가려 안 녹은 자리입니다. 시드가 두꺼운 곳 · 빽빽한 곳 · 가린 자리에서 먼저 나옵니다. 몇 nm는 눈 · 보통 EDS로 안 잡혀 누설 시험으로 봅니다.'},
    {id: 'over', viewN: VN, t: '너무 지운 것 — 언더컷 · 탈락', d: '밑동이 파이면 접촉 면적과 밀착이 줄어 세정 · 리플로우 · 본딩 · 시험 중 범프가 떨어지거나 금이 갑니다. 먼저 지워진 곳 · 외톨이 범프에서 먼저 나옵니다. 위에서는 모자에 가려 안 보여 표본 단면으로 Cu와 Ti를 따로 잽니다.'},
    {id: 'hurt', viewN: VN, t: '다치게 한 것 — 솔더 · Ni · 보호막', d: 'SnAg 표면 산화 · 변색은 리플로우 비젖음으로, Ni 옆면 침식은 솔더가 기둥 옆면으로 흘러내리는 옆면 젖음으로, 보호막 손상은 신뢰성 문제로 이어질 수 있습니다. 식각액 · 시간 · 온도와 헹굼 지연을 봅니다.'},
    {id: 'stain', viewN: VN, t: '얼룩 · 재부착 · 입자', d: '물자국 · 건조 얼룩, 녹았던 Cu가 Ti · Sn 위에 다시 내려앉은 점(치환 석출), 거품 자국, 필터를 지난 입자입니다. 헹굼 · 건조 · 액 나이 · 필터를 봅니다. 무늬가 위아래면 배치 넣고 빼기, 한쪽이면 노즐 · 팔 위치를 의심합니다.'},
    {id: 'map', viewN: {x: 650, y: 104, w: 920, h: 830}, t: '거꾸로 — 이 손잡이를 돌리면 어느 불량이?', d: '원인을 찾았으면, 고칠 손잡이가 다른 불량을 키우지 않는지 봅니다. 과식각 · 온도 · 흐름 · 액 나이 · 헹굼은 식각 엔지니어가, 시드 두께 · 패턴 밀도 · PR 잔여 · 도금 Cu 결정 · 보호막은 앞 공정이 정합니다.'}
  ],
  icon(K){
    const {R, P, E} = K;
    return R(2, 46, 62, 7, 'f-pas') + R(8, 22, 18, 22, 'f-cu2') + R(8, 18, 18, 4, 'f-ni') + R(8, 8, 18, 10, 'f-sn2') + R(42, 22, 18, 22, 'f-cu2') + R(42, 18, 18, 4, 'f-ni') + R(42, 8, 18, 10, 'f-sn2')
      + R(8, 44, 18, 2, 'f-seed2') + R(46, 44, 10, 2, 'f-seed2') + R(26, 43, 16, 3, 'f-seed2') + E(34, 44.5, 11, 5, 'et09-mk');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only} = K;
    let s = '';
    // ---- 위: 불량 타일 14개 (map 단계에서는 사라짐) ----
    let tl = '';
    DEF.forEach((d, i) => {
      const {x, y} = tilePos(i), cs = cats(d), grp = groupOf(d.id);
      let g = R(x, y, TW, TH, 'pl-tile2', {rx: 12});
      g += bump(K, d.id, x + TW / 2, y + 100, 1, true);
      g += T(x + TW / 2, y + 146, d.sn, 't-sub');
      if (d.c.length) CATS.forEach((c, j) => { const on = cs.includes(c), px = x + 7 + j * 39; g += R(px, y + 164, 34, 30, 'et09-tg ' + (on ? c : 'off'), {rx: 7}) + T(px + 17, y + 186, T1[c], 'et09-tgt' + (on ? '' : ' off')); });
      else g += T(x + TW / 2, y + 186, '비교 기준', 't-dim');
      if (grp) g += R(x - 3, y - 3, TW + 6, TH + 6, 'pl-hlbox', K.W(only(grp), {rx: 14}));
      g += R(x, y, TW, TH, 'pl-pick', {rx: 12});
      tl += G(g, {class: 'pl-def', 'data-def': d.id, 'data-tip': `${d.nm} — ${d.def}` + (d.st.length ? `\n처음 보이는 단계: ${d.st.map(k => STG[k]).join(' · ')}` : '') + (cs.length ? `\n원인 꼬리표: ${cs.map(c => TAG[c]).join(' · ')}` : '')});
    });
    // 꼬리표 범례 + 지금 묶음
    let lg = T(GX + 2, 591, '원인 꼬리표', 'et09-h', 'start'), lx = GX + 124;
    CATS.forEach(c => { lg += R(lx, 568, 34, 30, 'et09-tg ' + c, {rx: 7}) + T(lx + 17, 590, T1[c], 'et09-tgt') + T(lx + 42, 591, TAG[c], 't-dim', 'start'); lx += 42 + [...TAG[c]].length * 19 + 24; });
    tl += LB(lg, tip('식각 인자: 식각-장비 · 식각-액 · 식각-조건 (이 공정 엔지니어가 바꿀 수 있는 것)\n비식각 인자: 앞 공정(PVD · 도금 · 스트립) · 뒤 공정(플라즈마 · 리플로우 · 본딩)\n원인을 나누면 누구와 상의할지가 바로 보인다'));
    Object.keys(GCAP).forEach(k => { tl += LB(T(1556, 592, GCAP[k], 't-acc', 'end'), only(k)); });
    // 아래 상세 판 (위젯이 그린다)
    tl += R(40, 608, 1520, 502, 'pl-panel', {rx: 14}) + R(56, 620, 548, 262, 'pl-lane', {rx: 10}) + `<g data-v="detail"></g>`;
    s += G(tl, {'data-off': 'map'});
    // ---- map 단계: 인자 지도 (15 × 7) + 크기 막대 ----
    let mp = T(IX, 152, '손잡이 (인자)', 't-acc', 'start') + T(OX, 152, '결과 (불량 · 품질)', 't-acc', 'start') + `<g data-v="sel"></g>`;
    INS.forEach(([id, nm, , tg, eff], k) => eff.forEach(([o, e, cf]) => {
      const j = OUTS.findIndex(x => x[0] === o), y1 = iy(k), y2 = oy(j);
      mp += P(`M${IX + IW},${y1} C${IX + IW + 260},${y1} ${OX - 260},${y2} ${OX},${y2}`, 'pl-edge', {'data-in': id, 'data-out': o, 'data-e': e, 'data-c': cf});
    }));
    mp += `<g data-v="marks"></g>`;
    INS.forEach(([id, nm, full, tg], k) => {
      const y = iTop(k);
      mp += G(R(IX, y, IW, IH, 'pl-inb', {rx: 10}) + T(IX + 16, y + 30, nm, 't-sub', 'start') + R(IX + IW - 90, y + 7, 80, 30, 'et09-tg ' + tg, {rx: 7}) + T(IX + IW - 50, y + 29, TD[tg], 'et09-tgt'),
        {class: 'pl-in', 'data-in': id, 'data-tip': `${full} — ${TAG[tg]}\n누르면 영향선과 크기 막대가 보입니다`});
    });
    OUTS.forEach(([id, nm], j) => {
      const y = oTop(j);
      mp += G(R(OX, y, OW, OH, 'pl-outb', {rx: 10}) + T(OX + 16, y + 30, nm, 't-sub', 'start') + `<g data-ot="${id}" data-y="${y}"></g>`, {class: 'et09-out', 'data-out': id, 'data-tip': nm + ' — 누르면 거꾸로, 이 결과를 움직이는 인자들'});
    });
    // 범례: 색 = 방향, 선 모양 = 확신
    let lm = R(492, 104, 596, 60, 'pl-box', {rx: 10});
    [['pl-egc', '좋아짐'], ['pl-ebc', '나빠짐'], ['pl-ecc', '달라짐']].forEach(([c, t], j) => { lm += C(514 + j * 116, 125, 8, c) + T(528 + j * 116, 131, t, 'et09-lg', 'start'); });
    lm += T(870, 131, '색 = 방향', 'et09-lg2', 'start');
    lm += L(510, 151, 550, 151, 'et09-ls') + T(558, 157, '법칙', 'et09-lg', 'start') + L(624, 151, 664, 151, 'et09-ls et09-T') + T(672, 157, '보통 경향', 'et09-lg', 'start')
      + L(776, 151, 816, 151, 'et09-ls et09-D') + T(824, 157, '조건에 따라 ?', 'et09-lg', 'start');
    mp += LB(lm, tip('색 = 어느 쪽으로 움직이나 (좋아짐 · 나빠짐 · 달라짐)\n선 모양 = 얼마나 확실한가 (실선: 법칙 · 긴 점선: 보통 경향 · 짧은 점선 + ?: 액 · 조건에 따라 다름)'));
    mp += R(40, 962, 1520, 148, 'pl-panel', {rx: 14}) + `<g data-v="size"></g>`;
    s += G(mp, only('map'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 불량 카드와 인자 지도 (장면의 타일 · 상자를 눌러도 됩니다)</div>
      ${K.seg('mode', [['def', '불량 → 원인'], ['map', '인자 → 결과']], 'def', '보기')}
      <div class="et09-sw"><div class="et09-defc">
        <div class="pl-seg pl-chips" data-g="def">${DEF.map(d => `<button data-v="${d.id}" aria-pressed="false">${d.sn}</button>`).join('')}</div>
        <div class="pl-pcard et09-card" data-o="dcard"></div>
      </div><div class="et09-mapc et09-hid">
        <div class="pl-seg pl-chips" data-g="in"><span class="lb">손잡이</span>${INS.map(([id, nm]) => `<button data-v="${id}" aria-pressed="false">${nm}</button>`).join('')}</div>
        <div class="pl-seg pl-chips" data-g="out"><span class="lb">결과에서 거꾸로</span>${OUTS.map(([id, nm]) => `<button data-v="${id}" aria-pressed="false">${nm}</button>`).join('')}</div>
        ${K.ctl('amt', '손잡이 크기 (한 칸 단위)', -2, 2, 0.5, 1)}
        ${K.kpis([['잔여 다이', 'k-res', '07장 끝점 맵'], ['기둥 밑동 깎임', 'k-pil', '04장 식'], ['Ti 언더컷', 'k-ti', '06장 식 (HF)']])}
        <div class="pl-pcard et09-fcard" data-o="fcard"></div>
      </div></div>
      ${K.model('영향 지도 — 방향(좋아짐 · 나빠짐 · 달라짐) × 확신(법칙 · 보통 경향 · 조건에 따라). 크기 막대는 앞 장의 식을 그대로 씁니다: 잔여 다이 = 07장 끝점 맵(다이마다 지움 시간 h ÷ [r(1 − d)] 이 레시피 시간보다 긴 다이의 %, 기준 과식각 30 % · 두께 ±5 % 가운데 두꺼움 · 빽빽한 블록 밀도 20 %), 기둥 밑동 = 04장 1.3 × 300 nm/분 × 시간(계면 고름), Ti 언더컷 = 06장 h + G·r·(t − t₀) (묽은 HF 600 nm/분 · G 4, Ti 100 nm). 레시피 시간은 과식각으로만 바뀌고(Cu · Ti 단계 모두) 나머지는 같은 시간에서 셉니다 — 실제로는 속도가 바뀌면 시간도 다시 맞춥니다. 한 칸 = 과식각 +10 %p · 온도 +5 °C(Cu 속도 ×1.2) · 산화제 ×1.2 · 흐름 ×2(Cu 속도 ×1.25) · 액 나이(새 액 기준, 속도 ×0.8) · 헹굼 지연 +2 s · 시드 산포 +2 %p · 밀도 +10 %p (예시). 수식이 없는 인자는 방향만 — 크기는 내 데이터 · 분할 실험으로.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, T, G, LB, E, wrap, tip} = K;
    let mode = 'def', curDef = null, cur = null, amt = 1, pickedDef = false, pickedIn = false;
    ctx.card.classList.add('et09-card2');
    const amtIn = ctx.card.querySelector('input[data-i="amt"]');
    const setChips = (g, v) => ctx.card.querySelectorAll(`[data-g="${g}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    function setMode(m){
      mode = m; setChips('mode', m);
      ctx.card.querySelector('.et09-defc').classList.toggle('et09-hid', m !== 'def');
      ctx.card.querySelector('.et09-mapc').classList.toggle('et09-hid', m !== 'map');
    }
    // ---- 상세 판 ----
    const tagChip = (x, y, tg, txt) => R(x, y - 22, 92, 30, 'et09-tg ' + tg, {rx: 7}) + T(x + 46, y, txt, 'et09-tgt');
    function detail(d){
      let s = bump(K, d.id, DCX, DBY, DK, false);
      // 번호 표시 + 아래 설명
      const ns = NOTE[d.id] || [];
      ns.forEach(([fx, fy, dx, dy], j) => {
        const px = DCX + fx * DK, py = DBY + fy * DK, mx = px + dx, my = py + dy;
        s += L(px, py, mx, my + (dy < 0 ? 14 : -14), 'et09-ld') + C(px, py, 4, 'et09-ldk') + C(mx, my, 15, 'et09-nb') + T(mx, my + 7, String(j + 1), 'et09-nbt');
      });
      s += T(70, 648, d.sn, 'et09-h', 'start') + T(598, 879, '두께 · 깎임은 크게 과장', 't-dim', 'end');
      ns.forEach(([, , , , tx], j) => { s += C(74, 904 + j * 32, 12, 'et09-nb') + T(74, 910 + j * 32, String(j + 1), 'et09-nbt') + T(94, 911 + j * 32, tx, 'et09-tx', 'start'); });
      // 맵 무늬
      s += wmap(K, d.m, WCX, WCY, WR);
      s += T(194, 1000, '어디에 — 맵 무늬 (예)', 'et09-h', 'start');
      let ml = wrap(d.map, 18.3);
      if (ml.length > 3){ ml = ml.slice(0, 3); ml[2] += ' …'; }
      ml.forEach((l, j) => { s += T(194, 1030 + j * 26, l, 'et09-tx2', 'start'); });
      // 오른쪽: 이름 · 생김새 · 처음 보이는 단계 · 원인 · 확인 · 대책
      let y = 654;
      s += T(DX0, y, d.nm, 't-lbl', 'start');
      const cs = cats(d);
      cs.forEach((c, j) => { const x = DX1 - (cs.length - j) * 40; s += R(x, y - 24, 34, 30, 'et09-tg ' + c, {rx: 7}) + T(x + 17, y - 2, T1[c], 'et09-tgt'); });
      y += 36;
      let dl = wrap(d.def, 41.5);
      if (dl.length > 2){ dl = dl.slice(0, 2); dl[1] += ' …'; }
      dl.forEach(l => { s += T(DX0, y, l, 'et09-tx', 'start'); y += 27; });
      y += 10;
      if (d.st.length){
        s += T(DX0, y + 18, '처음 보이는 단계', 'et09-h', 'start');
        STG.forEach((t, j) => { const on = d.st.includes(j), x = 812 + j * 146; s += R(x, y - 4, 140, 32, 'et09-stc' + (on ? ' on' : ''), {rx: 8}) + T(x + 70, y + 18, t, 'et09-stt' + (on ? ' on' : '')); });
        y += 50;
      }
      const cut = (t, em) => { const w = wrap(t, em); return w.length > 1 ? w[0] + ' …' : w[0]; };
      if (d.c.length){
        s += T(DX0, y + 6, '원인 후보 — 꼬리표로 누구와 상의할지', 'pl-hdg2', 'start'); y += 40;
        d.c.forEach(([tg, tx]) => { s += tagChip(DX0, y, tg, TD[tg]) + T(DX0 + 104, y, cut(tx, 37.5), 'et09-tx', 'start'); y += 34; });
        y += 4;
        const kl = wrap(d.k.join(' · '), 37.5), kk = kl.length > 2 ? [kl[0], kl[1] + ' …'] : kl;
        s += tagChip(DX0, y, 'lc', '확인'); kk.forEach(l => { s += T(DX0 + 104, y, l, 'et09-tx2', 'start'); y += 27; });
        y += 8;
        const fl = wrap(d.f, 37.5), ff = fl.length > 2 ? [fl[0], fl[1] + ' …'] : fl;
        s += tagChip(DX0, y, 'fx', '대책'); ff.forEach(l => { s += T(DX0 + 104, y, l, 'et09-tx2', 'start'); y += 27; });
      } else {
        s += T(DX0, y + 6, '무엇으로 재나', 'pl-hdg', 'start'); y += 40;
        d.k.forEach(t => { s += T(DX0, y, '· ' + t, 'et09-tx', 'start'); y += 32; });
      }
      return s;
    }
    function showDef(id, user){
      const d = BY[id]; if (!d) return;
      if (user) pickedDef = true;
      curDef = id;
      ctx.$$('.pl-def').forEach(g => g.classList.toggle('pl-sel', g.getAttribute('data-def') === id));
      setChips('def', id);
      ctx.$('[data-v="detail"]').innerHTML = detail(d);
      const st = d.st.length ? `<div class="et09-row"><b>처음 보이는 단계</b> ${STGL.map((t, j) => `<span class="et09-st${d.st.includes(j) ? ' on' : ''}">${t}</span>`).join('')}</div>` : '';
      ctx.q('[data-o=dcard]').innerHTML = `<b>${d.nm}</b> — ${d.def}` + st + `<div class="et09-row"><b>맵 무늬</b> ${d.map}</div>`
        + (d.c.length ? `<div class="et09-row"><b>원인 후보</b>${d.c.map(([tg, tx, more]) => `<div class="et09-li"><span class="et09-tag ${tg}">${TAG[tg]}</span>${tx}${more ? ` — <span class="et09-more">${more}</span>` : ''}</div>`).join('')}</div>` : '')
        + `<div class="et09-row"><b>${d.c.length ? '확인' : '무엇으로 재나'}</b><ol>${(d.c.length ? [COMMON] : []).concat(d.k).map(t => `<li>${t}</li>`).join('')}</ol></div>`
        + (d.f ? `<div class="et09-row"><b>대책 방향</b> ${d.f}</div>` : '')
        + (d.go && d.go.length ? `<div class="et09-row"><b>더 보기</b> ${d.go.map(([g, t]) => g[0] === '#' ? `<a href="${g}">${t}</a>` : `<a data-go="${g}">${t}</a>`).join(' · ')}</div>` : '');
      ctx.refresh();
    }
    // ---- 인자 지도 ----
    const effOf = (o, f) => K.TT(OX + 16, (+o.getAttribute('data-y')) + 60, wrap(`${EFF[f[0]][0]} — ${f[2]}`, 21.5).slice(0, 2), 'et09-ot ' + EFF[f[0]][1] + 't', 'start', 25);
    const badge = (o, cf) => { const y = +o.getAttribute('data-y') + 24, x = OX + OW - 18; return cf === 'D' ? C(x - 12, y, 13, 'et09-qc') + T(x - 12, y + 7, '?', 'et09-qt') : L(x - 46, y, x, y, 'et09-ls' + (cf === 'T' ? ' et09-T' : '')); };
    const amtTxt = () => { const z = cur && cur[0] === 'in' ? sizeOf(cur[1], amt) : null; return `${sg(amt)} 칸 — ` + (z ? z.lab : cur && cur[0] === 'in' ? '이 손잡이는 크기 모델 없음' : '손잡이를 고르면 크기가 보입니다'); };
    function bars(k){
      const id = cur && cur[0] === 'in' ? cur[1] : null, inp = id && INS.find(x => x[0] === id);
      const z = sizeOf(id, k);
      const BXs = [196, 664, 1112], BW = 230;
      let s = '';
      ['k-res', 'k-pil', 'k-ti'].forEach(o => { ctx.out(o, '—'); const e = ctx.card.querySelector(`[data-o="${o}"]`); if (e) e.parentNode.classList.remove('ok', 'warn', 'ng'); });
      if (!id){
        const out = OUTS.find(x => x[0] === cur[1]), from = INS.filter(x => x[4].some(f => f[0] === cur[1])), cnt = {};
        from.forEach(x => { cnt[x[3]] = (cnt[x[3]] || 0) + 1; });
        s += T(70, 1010, `거꾸로 보기 — '${out[1]}'${eul(out[1])} 움직이는 인자 ${from.length}개`, 't-acc', 'start');
        s += T(70, 1048, CATS.filter(c => cnt[c]).map(c => `${TAG[c]} ${cnt[c]}`).join(' · '), 'et09-tx', 'start');
        s += T(70, 1082, '식각 인자(장비 · 액 · 조건)는 분할 실험으로, 앞 · 뒤 공정 인자는 그 팀과 함께 확인합니다', 'et09-tx2', 'start');
        return s;
      }
      if (!z){
        s += T(70, 1010, `${inp[1]} — 크기 모델 없음`, 't-acc', 'start');
        s += T(70, 1048, '앞 장에 이 인자의 식이 없어 방향과 확신만 보입니다.', 'et09-tx', 'start');
        s += T(70, 1082, '크기는 내 데이터 · 분할 실험으로 확인하고, 양산 조건은 한 번에 하나씩 바꿉니다', 'et09-tx2', 'start');
        return s;
      }
      // 작은 웨이퍼: 지금 손잡이 위치의 잔여 다이 (07장 끝점 맵, 15 × 15 다이)
      const wx = 112, wy = 1036, pr = 56 / 270 * 36;
      s += K.C(wx, wy, 58, 'et09-waf', tip('07장 끝점 맵 (15 × 15 다이) — 빨강: 레시피 시간 안에 다 못 지운 다이 (잔여) · 초록: 다 지운 다이'));
      z.dies.forEach(dd => { s += R(wx + (dd.i - 7) * pr - pr / 2 + 0.7, wy + (dd.j - 7) * pr - pr / 2 + 0.7, pr - 1.4, pr - 1.4, dd.bad ? 'et09-wbadd' : 'et09-wokd'); });
      s += T(196, 996, `이 손잡이를 ${sg(k)} 칸: ${z.lab}`, 't-acc', 'start') + T(1544, 996, z.fx ? '레시피 시간 그대로 · 앞 장 식 · 예시' : '앞 장 식 그대로 · 예시', 't-dim', 'end');
      const col = (x, ttl, v, unit, mx, kid) => {
        let c = T(x, 1032, ttl, 'et09-h', 'start');
        if (!v) return c + T(x, 1072, '이 손잡이로는 안 움직임', 't-dim', 'start') + T(x, 1098, '(이 모델 안에서)', 't-dim', 'start');
        const [a, b, left] = v, cls = left ? 'ng' : Math.abs(b - a) < 0.5 ? 'eq' : b < a ? 'ok' : 'ng';
        const w = vv => Math.max(3, Math.min(1, vv / mx) * BW);
        c += T(x, 1061, '지금', 't-dim', 'start') + R(x + 48, 1046, w(a), 18, 'et09-bar0') + T(x + 56 + w(a), 1062, `${Math.round(a)} ${unit}`, 'et09-bt', 'start');
        c += T(x, 1093, '뒤', 't-dim', 'start') + R(x + 48, 1076, w(b), 22, 'et09-bar1 ' + cls) + T(x + 56 + w(b), 1094, left ? 'Ti 덜 지움 (잔여)' : `${Math.round(b)} ${unit}`, 'et09-bt ' + cls, 'start');
        ctx.out(kid, left ? `${Math.round(a)} nm → 덜 지움` : `${Math.round(a)} → ${Math.round(b)} ${unit}`);
        const e = ctx.card.querySelector(`[data-o="${kid}"]`); if (e && cls !== 'eq') e.parentNode.classList.add(cls);
        return c;
      };
      s += col(BXs[0], '잔여 다이 — 07장 맵 (왼쪽 웨이퍼)', z.res, '%', 100, 'k-res');
      s += col(BXs[1], '기둥 밑동 깎임 — 04장 식', z.pil, 'nm', 900, 'k-pil');
      s += col(BXs[2], 'Ti 언더컷 — 06장 식 (HF)', z.ti, 'nm', 600, 'k-ti');
      return s;
    }
    function showIn(id, user){
      if (user) pickedIn = true;
      cur = ['in', id];
      const inp = INS.find(x => x[0] === id), k = INS.indexOf(inp);
      ctx.$$('.pl-in').forEach(g => { g.classList.toggle('pl-sel', g.getAttribute('data-in') === id); g.classList.remove('dim'); });
      ctx.$$('.et09-out').forEach(g => g.classList.remove('pl-sel'));
      setChips('in', id); setChips('out', '');
      const hit = new Set();
      let mk = '';
      ctx.$$('.pl-edge').forEach(e => {
        const on = e.getAttribute('data-in') === id, cf = e.getAttribute('data-c');
        e.setAttribute('class', on ? `pl-edge on ${EFF[e.getAttribute('data-e')][1]} et09-${cf}` : 'pl-edge');
        if (on){ hit.add(e.getAttribute('data-out')); if (cf === 'D'){ const [mx, my] = mid(k, OUTS.findIndex(x => x[0] === e.getAttribute('data-out'))); mk += C(mx, my, 14, 'et09-qc') + T(mx, my + 7, '?', 'et09-qt'); } }
      });
      ctx.$('[data-v="marks"]').innerHTML = mk;
      ctx.$$('.et09-out').forEach(g => g.classList.toggle('dim', !hit.has(g.getAttribute('data-out'))));
      ctx.$$('[data-ot]').forEach(g => { const f = inp[4].find(x => x[0] === g.getAttribute('data-ot')); g.innerHTML = f ? effOf(g, [f[1], f[2], f[3]]) + badge(g, f[2]) : ''; });
      ctx.$('[data-v="size"]').innerHTML = bars(amt);
      ctx.$('[data-v="sel"]').innerHTML = T(OX, 121, `손잡이: ${inp[1]}`, 't-warn', 'start');
      ctx.out('amt', amtTxt());
      const z = sizeOf(id, amt);
      ctx.q('[data-o=fcard]').innerHTML = `<b>${inp[2]}</b> <span class="et09-tag ${inp[3]}">${TAG[inp[3]]}</span><br>`
        + inp[4].map(([o, e, cf, tx]) => `· ${OUTS.find(x => x[0] === o)[1]}: <span class="${EFF[e][1]}t">${EFF[e][0]}</span> <span class="et09-cf ${cf}">${CONF[cf]}</span> — ${tx}`).join('<br>')
        + (z ? `<div class="et09-row"><b>크기 (${sg(amt)} 칸: ${z.lab})</b> ` + [z.res && `잔여 다이 ${Math.round(z.res[0])} → ${Math.round(z.res[1])} %`, z.pil && `기둥 밑동 ${Math.round(z.pil[0])} → ${Math.round(z.pil[1])} nm`, z.ti && `Ti 언더컷 ${Math.round(z.ti[0])} → ${z.ti[2] ? 'Ti 덜 지움' : Math.round(z.ti[1]) + ' nm'}`].filter(Boolean).join(' · ') + '</div>'
          : '<div class="et09-row"><b>크기</b> 이 인자는 앞 장에 식이 없어 방향과 확신만 봅니다 — 분할 실험으로 내 공정의 크기를 잽니다.</div>');
      ctx.refresh();
    }
    function showOut(id, user){
      if (user) pickedIn = true;
      cur = ['out', id];
      const out = OUTS.find(x => x[0] === id), j = OUTS.indexOf(out), from = INS.filter(x => x[4].some(f => f[0] === id));
      ctx.$$('.et09-out').forEach(g => { g.classList.toggle('pl-sel', g.getAttribute('data-out') === id); g.classList.toggle('dim', g.getAttribute('data-out') !== id); });
      ctx.$$('.pl-in').forEach(g => { g.classList.remove('pl-sel'); g.classList.toggle('dim', !from.some(x => x[0] === g.getAttribute('data-in'))); });
      setChips('out', id); setChips('in', '');
      let mk = '';
      ctx.$$('.pl-edge').forEach(e => {
        const on = e.getAttribute('data-out') === id, cf = e.getAttribute('data-c');
        e.setAttribute('class', on ? `pl-edge on ${EFF[e.getAttribute('data-e')][1]} et09-${cf}` : 'pl-edge');
        if (on && cf === 'D'){ const [mx, my] = mid(INS.findIndex(x => x[0] === e.getAttribute('data-in')), j); mk += C(mx, my, 14, 'et09-qc') + T(mx, my + 7, '?', 'et09-qt'); }
      });
      ctx.$('[data-v="marks"]').innerHTML = mk;
      const cnt = {};
      from.forEach(x => { cnt[x[3]] = (cnt[x[3]] || 0) + 1; });
      ctx.$$('[data-ot]').forEach(g => { g.innerHTML = g.getAttribute('data-ot') === id ? K.TT(OX + 16, +g.getAttribute('data-y') + 60, [`인자 ${from.length}개가 움직인다`, `식각 ${(cnt.eq || 0) + (cnt.bath || 0) + (cnt.cond || 0)} · 앞 공정 ${cnt.up || 0} · 뒤 공정 ${cnt.dn || 0}`], 'et09-ot et09-rev', 'start', 25) : ''; });
      ctx.$('[data-v="size"]').innerHTML = bars(amt);
      ctx.$('[data-v="sel"]').innerHTML = T(OX, 121, `거꾸로 — 인자 ${from.length}개 (왼쪽 밝은 상자)`, 't-warn', 'start');
      ctx.out('amt', amtTxt());
      ctx.q('[data-o=fcard]').innerHTML = `<b>${out[1]}</b>${eul(out[1])} 움직이는 인자 ${from.length}개 — 꼬리표별로 나눠 원인 후보를 세웁니다.<br>`
        + CATS.map(tg => from.filter(x => x[3] === tg).map(x => { const f = x[4].find(y => y[0] === id); return `<span class="et09-tag ${tg}">${TAG[tg]}</span>${x[1]}: <span class="${EFF[f[1]][1]}t">${EFF[f[1]][0]}</span> <span class="et09-cf ${f[2]}">${CONF[f[2]]}</span> — ${f[3]}`; }).join('<br>')).filter(Boolean).join('<br>');
      ctx.refresh();
    }
    // ---- 입력 ----
    const goGroup = id => { const sid = groupOf(id); if (sid && ctx.step() !== sid) ctx.go(sid); };
    ctx.seg('mode', (v, user) => {
      if (!user) return;
      setMode(v);
      if (v === 'map'){ if (!cur) showIn('oe'); if (ctx.step() !== 'map') ctx.go('map'); }
      else { showDef(curDef || 'resid'); if (ctx.step() === 'map' || !ctx.step()) ctx.go(groupOf(curDef) || 'resid'); }
    });
    ctx.card.querySelector('[data-g="def"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b){ showDef(b.dataset.v, true); goGroup(b.dataset.v); } });
    ctx.card.querySelector('[data-g="in"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b){ showIn(b.dataset.v, true); if (ctx.step() !== 'map') ctx.go('map'); } });
    ctx.card.querySelector('[data-g="out"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b){ showOut(b.dataset.v, true); if (ctx.step() !== 'map') ctx.go('map'); } });
    showDef('resid');
    showIn('oe');
    ctx.range('amt', v => { amt = v; if (cur && cur[0] === 'in') showIn(cur[1]); return amtTxt(); });
    amtIn.addEventListener('input', () => { pickedIn = true; });
    ctx.scene.addEventListener('click', ev => {
      const t = ev.target;
      const gd = t.closest && t.closest('.pl-def'), gi = t.closest && t.closest('.pl-in'), go = t.closest && t.closest('.et09-out');
      if (gd){ showDef(gd.getAttribute('data-def'), true); goGroup(gd.getAttribute('data-def')); }
      else if (gi) showIn(gi.getAttribute('data-in'), true);
      else if (go) showOut(go.getAttribute('data-out'), true);
    });
    // 손대기 전에는 단계마다 예시 (발표 모드 대비)
    ctx.demo = sid => {
      if (sid === 'map'){
        if (mode !== 'map') setMode('map');
        if (!pickedIn){ amt = 1; amtIn.value = 1; showIn('oe'); }
        return;
      }
      if (mode !== 'def') setMode('def');
      const grp = GROUPS[sid] || [];
      ctx.$$('.pl-def').forEach(g => { const id = g.getAttribute('data-def'); g.classList.toggle('dim', id !== 'normal' && !grp.includes(id)); });
      if (!pickedDef || !curDef || (curDef !== 'normal' && !grp.includes(curDef))) showDef(DEMO[sid] || 'resid');
    };
    setMode('def');
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['처음 보이는 단계', '불량이 처음 검출된 검사 시점 (식각 직후 외관 · 표본 단면 · 누설 시험 · 리플로우 뒤 · 본딩 · 적층 뒤 · 신뢰성 시험 뒤). 원인 공정을 가장 빨리 좁힌다'],
      ['공통점 분석', '불량 웨이퍼들이 함께 지나간 장비 · 챔버 · 액 나이 · lot 을 찾는 분석'],
      ['EDS · XPS · AES', 'EDS는 전자 현미경에서 원소(Cu · Ti · Sn · O · C)를 보는 분석 — 신호 깊이가 수백 nm~1 µm라 몇 nm 막은 잘 안 잡힌다. XPS · AES는 표면 몇 nm의 성분 · 산화 상태를 봐서 얇은 잔여 확인에 쓴다'],
      ['FIB 단면 · 기울인 SEM', '집속 이온빔으로 원하는 자리를 잘라 단면을 보거나, 시료를 기울여 옆모습을 보는 방법 — 모자(처마)에 가린 밑동을 본다'],
      ['누설 시험 (절연 저항)', '떨어져 있어야 할 패턴 사이에 전압을 걸어 흐르는 전류를 재는 시험 (판정 예: 10⁸ Ω 이상이면 분리)'],
      ['전단 시험', '범프를 옆으로 밀어 떨어지는 힘과 끊어진 면을 보는 시험 (솔더 속에서 끊기면 정상, 계면이면 의심)'],
      ['HAST 등 신뢰성 시험', '온도 · 습도 · 전압을 함께 걸어 오래 쓴 효과를 앞당겨 보는 시험'],
      ['치환 석출', '액 속 Cu 이온이 더 잘 녹는 금속(Ti · Sn)에서 전자를 받아 그 표면에 Cu로 내려앉고, 그만큼 그 금속이 녹는 일. 전원 없이 저절로 일어난다 (Cu 식각액이 Ti 식각액으로 넘어갈 때 · 늙은 Cu 식각액에서)']
    ]) + K.field([
      '먼저 <b>식각 원인 vs 앞 공정 원인</b>을 가릅니다: 같은 PVD · 같은 도금 · 같은 스트립 lot 이 다른 식각 장비에서도 같은 불량을 내는지 봅니다.',
      '맵 무늬 읽기: <b>고리</b> → 시드 두께 · 장비 속도 맵 · 회전, <b>한쪽 · 부채꼴</b> → 노즐 · 팔 위치, <b>위아래</b> → 배치 넣고 빼기, <b>다이 반복</b> → 패턴 밀도, <b>무작위</b> → 입자 · PR 찌꺼기 (<a href="#go-strip-08">PR 스트립 08장</a>).',
      '잔여와 언더컷은 한 줄의 양 끝입니다. 과식각을 늘려 잔여를 없애면 먼저 지워진 곳의 밑동이 그만큼 더 파입니다. 시간을 바꾸기 전에 두께 맵 · 속도 맵 · 로딩부터 줄여 "가장 늦은 곳"을 앞당깁니다 → <a data-go="end.time">07장</a>.',
      '기록에 <b>처음 보인 단계</b>를 꼭 남깁니다. 리플로우 뒤에 처음 보인 브리지 · 비젖음 · 옆면 젖음도 시드 식각에서 시작됐을 수 있습니다 → <a href="#go-plating-12">전해도금 12장</a> · <a href="#go-reflow-04">리플로우 04장</a>.',
      '인자 지도의 화살표는 "보통 이쪽"이라는 경향입니다. 손잡이를 바꿀 때는 분할 실험으로 내 공정의 크기를 확인하고(여러 인자를 함께 보려면 실험 계획법 DOE), 양산 조건은 한 번에 하나씩 바꿉니다.'
    ]) + K.deep(`<p><b>무엇으로 재나</b></p>
      <table class="pl-tb et09-tb"><tr><th>보는 것</th><th>측정</th><th>주의</th></tr>
      <tr><td>잔여 (두꺼운 것)</td><td>외관 · AOI(자동 광학 검사) · SEM-EDS</td><td>EDS 신호 깊이 수백 nm~1 µm — 몇 nm 막은 놓친다</td></tr>
      <tr><td>잔여 (얇은 것)</td><td>누설 시험 패턴 · AES · XPS</td><td>판정 예 10⁸ Ω (개념 예시 · 실제는 제품 규격)</td></tr>
      <tr><td>언더컷 · 기둥 지름</td><td>표본 FIB 단면 · 기울인 SEM</td><td>위에서 잰 지름(CD)은 Ni · SnAg 모자를 잰다</td></tr>
      <tr><td>솔더 표면</td><td>외관 색 · XPS · AES</td><td>산화막 두께 · 섞인 Cu</td></tr>
      <tr><td>보호막</td><td>엘립소미터(빛 반사로 막 두께) · 단면</td><td>HF를 쓰면 산화막 · PECVD 질화막 손실</td></tr>
      <tr><td>밀착</td><td>전단 시험</td><td>끊어진 면: 솔더 속 = 정상, 계면 = 의심</td></tr></table>
      <ul><li><b>잔여의 네 얼굴</b> — ① 넓고 얇게(시간 · 속도 부족, 맵 무늬) ② 점 · 섬(가림 — PR 찌꺼기 · 입자 · 거품, 또는 치환 석출된 Cu 점) ③ 밑동 둘레 고리(Cu 꼬리, 좁은 틈 · 빽빽한 곳) ④ 지워지지 않는 반응층(폴리이미드 위 Ti 반응층 — 시간을 늘려도 잘 안 풀리는 앞 공정 + 재료 원인, 공개 특허). Ti는 공기 중에서 수 nm 산화막을 만들며 그 두께의 약 0.6배만큼 금속을 먹습니다(Pilling–Bedworth 비 약 1.7). 그래서 약 3 nm보다 얇은 Ti 잔여는 금속 길이 아닌 산화물이라, 분석(XPS · AES)에는 Ti가 보여도 저항은 '분리'로 나올 수 있습니다 (<a data-go="why.keep">01장</a>). <b>시간이 지나서 드러나는 잔여</b>도 있습니다 — 몇 nm 잔여나 남은 이온(황산 · 불소)은 전압과 습기가 함께 걸리는 신뢰성 시험(HAST 등)에서 누설이 커지거나 금속 이온이 옮겨 가 가지(덴드라이트)가 자라는 것으로 처음 보일 수 있습니다. 헹굼 · 건조와 잔여를 함께 봅니다.</li>
      <li><b>언더컷의 세 얼굴</b> — ① 기둥 옆이 고르게 얇음(Cu 식각 시간 · 도금 Cu 결정) ② 계면 홈(계면 · 미세 갈바닉) ③ Ti 언더컷(Ti 식각 · HF 갈바닉, Ti가 끊긴 뒤의 과식각). 공개 연구: 지름 25 µm · 피치 55 µm Cu 기둥에서 도금 전류밀도를 올리자 기둥–시드 계면 언더컷이 약 0.43 → 1.72 µm로 커졌습니다(결정 방향에 따라 녹는 빠르기가 다름). 공개 특허는 Ti 언더컷이 Ti 두께의 5~10배인 경우가 흔하고, 묽은 HF로 Ti를 지우면 약 1 µm를 넘는다고 적습니다.</li>
      <li><b>솔더 표면</b> — 식각에서 생긴 Sn 산화 · 변색은 리플로우 전 플라즈마 처리 · 리플로우 분위기(포름산 등)로 대부분 걷어 내지만, 두껍거나 Cu가 섞인 막은 비젖음 · 모양 불량으로 남습니다 (<a href="#go-reflow-03">리플로우 03장</a>).</li>
      <li><b>옆면 젖음</b> — 시드 식각 뒤 Cu 기둥 옆면은 산화막이 걷힌 깨끗한 Cu로 드러나고, Ni 옆면이 침식되면 경계가 무너집니다. 그러면 리플로우 · 본딩 때 솔더가 기둥 옆면으로 흘러내려 이웃과 브리지 · 솔더 높이 부족 · 옆면 IMC가 생길 수 있습니다(공개 특허: 기둥 옆면으로 솔더가 흘러 이웃 기둥과 단락 → 옆면을 젖지 않게 처리). 리플로우 탭에서 처음 보이는 불량이 시드 식각 결과와 이어지는 대표 사례입니다.</li>
      <li><b>범프 탈락 = 언더컷 × 힘</b> — 같은 언더컷이라도 스크러버 브러시 · 고압 분사 · 본딩 힘이 크면 먼저 드러납니다. 공개 보고: 미세 피치(15 µm) 범프의 Ti 시드를 습식으로 지울 때 많은 범프가 함께 떨어진 사례, HF로 Ti를 지운 예전 공정(큰 범프)에서 언더컷이 약 10 µm까지 들어가 범프가 들떠 식각 → 헹굼 전환을 약 1초 안으로 줄인 특허 사례가 있습니다.</li>
      <li><b>인자 지도의 크기 막대</b> — 앞 장 식으로 "한 칸"의 크기를 봅니다(예시): 과식각 +10 %p → 잔여 다이 12 → 0 % · 기둥 밑동 507 → 546 nm · Ti 언더컷 256 → 308 nm, 액 나이(속도 ×0.8, 같은 레시피 시간) → 잔여 다이 12 → 100 %, 빽빽한 블록 밀도 20 → 30 % → 잔여 다이 12 → 88 %. 속도를 올리는 손잡이(온도 · 산화제 · 흐름)는 같은 시간이면 잔여를 줄이는 만큼 밑동도 더 깎습니다 — 잔여와 언더컷이 한 줄의 양 끝인 까닭입니다. 끝점이 레시피 시간 근처에 몰려 있으면 작은 속도 변화가 잔여 다이를 0 %에서 100 %로 뒤집습니다 — 그래서 07장의 여유(가장 늦은 곳 기준 과식각)가 필요합니다.</li></ul>`);
  },
  css: `.pl-svg .et09-tg.off{fill:none;stroke:rgba(148,163,184,.34);stroke-width:1.2}
.pl-svg .et09-tg.eq{fill:rgba(248,113,113,.46)}
.pl-svg .et09-tg.bath{fill:rgba(56,189,248,.44)}
.pl-svg .et09-tg.cond{fill:rgba(45,212,191,.42)}
.pl-svg .et09-tg.up{fill:rgba(167,139,250,.5)}
.pl-svg .et09-tg.dn{fill:rgba(245,158,11,.46)}
.pl-svg .et09-tg.lc{fill:rgba(148,163,184,.32)}
.pl-svg .et09-tg.fx{fill:rgba(34,197,94,.36)}
.pl-svg .et09-tgt{font-size:19px;font-weight:800;fill:#f8fafc !important;text-anchor:middle;stroke:none !important}
.pl-svg .et09-tgt.off{fill:#4b5a70 !important}
.pl-svg .et09-mk{fill:none;stroke:#f87171;stroke-width:2.2;stroke-dasharray:5 4}
.pl-svg .et09-tif{fill:#b4bdcf;stroke:#f1f5f9;stroke-width:.8}
.pl-svg .et09-lost{fill:rgba(239,68,68,.32);stroke:#fca5a5;stroke-width:1;stroke-dasharray:4 3}
.pl-svg .et09-ring{fill:rgba(241,245,249,.38);stroke:#ffffff;stroke-width:1.5}
.pl-svg .et09-stn{fill:rgba(120,83,40,.55);stroke:rgba(251,191,36,.5);stroke-width:1}
.pl-svg .et09-spot{fill:#334155;stroke:#0f172a;stroke-width:.6}
.pl-svg .et09-part{fill:#64748b;stroke:#e2e8f0;stroke-width:1}
.pl-svg .et09-tx{font-size:21px;fill:#e2e8f0 !important}
.pl-svg .et09-tx2{font-size:21px;fill:#b8c6d9 !important}
.pl-svg .et09-h{font-size:19px;font-weight:800;fill:#fcd34d !important}
.pl-svg .et09-stc{fill:none;stroke:rgba(148,163,184,.35);stroke-width:1.2}
.pl-svg .et09-stc.on{fill:rgba(245,158,11,.88);stroke:#fbbf24}
.pl-svg .et09-stt{font-size:19px;font-weight:700;fill:#64748b !important;text-anchor:middle;stroke:none !important}
.pl-svg .et09-stt.on{fill:#1b1203 !important;font-weight:900}
.pl-svg .et09-ld{fill:none;stroke:#fbbf24;stroke-width:1.6}
.pl-svg .et09-ldk{fill:#fbbf24}
.pl-svg .et09-nb{fill:#fbbf24;stroke:#422006;stroke-width:1.5}
.pl-svg .et09-nbt{font-size:19px;font-weight:900;fill:#1b1203 !important;text-anchor:middle;stroke:none !important}
.pl-svg .et09-waf{fill:#16202f;stroke:#94a3b8;stroke-width:1.6}
.pl-svg .et09-die{fill:rgba(148,163,184,.10);stroke:rgba(148,163,184,.3);stroke-width:.8}
.pl-svg .et09-wbad{fill:rgba(239,68,68,.45);fill-rule:evenodd}
.pl-svg .et09-wbad2{fill:rgba(239,68,68,.2)}
.pl-svg .et09-wall{fill:rgba(245,158,11,.32)}
.pl-svg .et09-wok{fill:rgba(34,197,94,.18)}
.pl-svg .et09-wdot{fill:#f87171}
.pl-svg .et09-notch{fill:none;stroke:#94a3b8;stroke-width:1.6}
.pl-svg .et09-wbadd{fill:#ef4444}
.pl-svg .et09-wokd{fill:rgba(74,222,128,.42)}
.pl-svg .pl-edge.on.et09-T{stroke-dasharray:14 9}
.pl-svg .pl-edge.on.et09-D{stroke-dasharray:4 8}
.pl-svg .et09-lg{font-size:19px;fill:#cbd5e1 !important}
.pl-svg .et09-lg2{font-size:19px;fill:#94a3b8 !important}
.pl-svg .et09-ls{fill:none;stroke:#e2e8f0;stroke-width:4}
.pl-svg .et09-ls.et09-T{stroke-dasharray:10 7}
.pl-svg .et09-ls.et09-D{stroke-dasharray:3 6}
.pl-svg .et09-qc{fill:#2e1065;stroke:#c4b5fd;stroke-width:2}
.pl-svg .et09-qt{font-size:19px;font-weight:900;fill:#ede9fe !important;text-anchor:middle;stroke:none !important}
.pl-svg .et09-ot{font-size:19px}
.pl-svg .et09-rev{fill:#fde68a !important;font-weight:700}
.pl-svg .et09-out{cursor:pointer}
.pl-svg .et09-out.pl-sel .pl-outb{stroke:#f59e0b;stroke-width:3;fill:rgba(40,30,10,.7)}
.pl-svg .et09-bar0{fill:rgba(148,163,184,.5)}
.pl-svg .et09-bar1.ok{fill:rgba(34,197,94,.8)}
.pl-svg .et09-bar1.ng{fill:rgba(239,68,68,.8)}
.pl-svg .et09-bar1.eq{fill:rgba(148,163,184,.7)}
.pl-svg .et09-bt{font-size:19px;font-weight:700;fill:#cbd5e1 !important}
.pl-svg .et09-bt.ok{fill:#86efac !important}
.pl-svg .et09-bt.ng{fill:#fca5a5 !important}
.jc .et09-sw{display:grid}
.jc .et09-sw > div{grid-area:1/1;min-width:0}
.jc .et09-sw > .et09-hid{visibility:hidden}
.jc .et09-tag{display:inline-block;font-size:11px;font-weight:800;border-radius:6px;padding:0 6px;margin-right:4px;vertical-align:1px}
.jc .et09-tag.eq{background:rgba(248,113,113,.2);color:#fca5a5}
.jc .et09-tag.bath{background:rgba(56,189,248,.2);color:#7dd3fc}
.jc .et09-tag.cond{background:rgba(45,212,191,.2);color:#5eead4}
.jc .et09-tag.up{background:rgba(167,139,250,.22);color:#c4b5fd}
.jc .et09-tag.dn{background:rgba(245,158,11,.2);color:#fcd34d}
.jc.et09-card2 .steps li.open em{min-height:72px}
.jc .et09-card{height:300px;overflow-y:auto;padding-right:4px;overscroll-behavior:contain}
.jc .et09-fcard{height:150px;overflow-y:auto;padding-right:4px;overscroll-behavior:contain}
.jc .et09-mapc .ctl label{display:block}
.jc .et09-mapc .ctl label output{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.jc .et09-mapc .kpi .v{min-height:2.5em;line-height:1.25}
.jc .et09-card .et09-row,.jc .et09-fcard .et09-row{margin-top:5px}
.jc .et09-card .et09-li{margin:2px 0 2px 2px}
.jc .et09-card .et09-more{color:#94a3b8}
.jc .et09-card ol{margin:2px 0 0;padding-left:18px}
.jc .et09-card ol li:first-child{color:#fde68a}
.jc .et09-st{display:inline-block;font-size:11px;border:1px solid rgba(148,163,184,.3);border-radius:6px;padding:0 5px;margin:1px 2px;color:#64748b}
.jc .et09-st.on{background:rgba(245,158,11,.85);border-color:#fbbf24;color:#1b1203;font-weight:800}
.jc .et09-cf{font-size:10.5px;border-radius:5px;padding:0 4px;border:1px solid rgba(148,163,184,.35);color:#cbd5e1}
.jc .et09-cf.L{border-style:solid;color:#f1f5f9}
.jc .et09-cf.T{border-style:dashed}
.jc .et09-cf.D{border-style:dotted;color:#c4b5fd}
.jc table.et09-tb th,.jc table.et09-tb td{word-break:keep-all}`
});
})();
