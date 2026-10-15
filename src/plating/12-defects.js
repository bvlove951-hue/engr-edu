/* 전해도금 12 — 불량 도감: 이 불량은 어디서 왔을까 (범프 단면 · µm) */
(function(){
// 원인 꼬리표: 도금 인자 셋 + 비도금 인자 둘
const CATS = ['eq', 'bath', 'cond', 'up', 'dn'];
const TAG = {eq: '도금-장비', bath: '도금-액', cond: '도금-조건', up: '앞 공정', dn: '뒤 공정'};
const TS = {eq: '장비', bath: '액', cond: '조건', up: '앞', dn: '뒤'};          // 타일 꼬리표 (짧게)
const TD = {eq: '장비', bath: '액', cond: '조건', up: '앞 공정', dn: '뒤 공정'};  // 상세 꼬리표
// 처음 보이는 단계 (그 공정 뒤 검사)
const STG = ['도금 직후', 'PR 제거 뒤', '시드 식각 뒤', '리플로우 뒤', '적층 뒤', '고온 시험 뒤'];
const COMMON = '공통점 찾기 — 장비 · 셀 · 액 나이(Ah) · PM 이력 · PR lot · PVD 챔버';
// 타일: id · 이름(nm) · 타일 이름(sn) · 생김새(def) · 처음 보이는 단계(st) · 맵 모양(map) · 원인 후보(c: [꼬리표, 글]) · 확인(k) · 대책(f)
const DEF = [
  {id: 'normal', nm: '정상', def: '고른 높이의 Cu 기둥 위에 얇은 Ni, 둥근 SnAg 솔더 모자', st: [], map: '비교 기준 — 같은 lot의 정상 범프를 늘 함께 본다',
    c: [], k: ['높이 → 광학(레이저 · 공초점 · 백색광 간섭)', '두께 · Ag % → XRF (전용 패턴)', '솔더 속 보이드 → X-ray', '계면 · IMC → 단면 SEM · FIB + 성분 분석(SEM-EDS)', '접합 강도 → 전단 시험', '누락 · 브리지 → AOI', '도금 전 시드 → 4탐침 면저항'], f: ''},
  {id: 'height', nm: '높이 산포', def: '범프 높이가 세 크기에서 다르다 — 웨이퍼 안 · 다이 안(밀집 vs 고립) · 범프 안(윗면)', st: [0, 3],
    map: '고리(셀에 고정된 부품) · 부채꼴 · 한쪽(콘택트 · 립씰) · 다이 반복(패턴) · 앞 공정 맵은 보통 고리, 치우치면 한쪽',
    c: [['eq', '실드 · 고저항판 · 회전 · 콘택트 · 립씰 상태 (07 · 09장)'], ['cond', '전류밀도 · 교반'], ['bath', '전도도 · 첨가제'],
      ['up', 'PVD 시드 두께 분포 · PR 두께 · CD · EBR 폭 · 가장자리 부분 다이(열린 면적이 바뀜) · 패턴 밀도(설계)'], ['dn', '리플로우 뒤 높이는 솔더 양 + 젖음(Ni 옆면으로 흘러내림) · 플럭스 조건']],
    k: [COMMON, '패턴 없는 모니터 웨이퍼의 두께 맵 → 장비 몫만 따로', 'Cu · Ni · SnAg 층별 두께 · 시드 면저항 맵 · PR 두께 · CD 맵', '콘택트 저항 · 정류기 로그'],
    f: '장비 원인과 앞 공정 원인을 먼저 나눈 뒤 각각 — 실드 · 고저항판 · 전류밀도, 더미 패턴, 하드웨어 점검'},
  {id: 'shape', nm: '윗면 모양 이상', sn: '윗면 모양', def: '윗면이 볼록(돔) · 오목(접시) · 한쪽으로 기움 · 가장자리 솟음', st: [0, 1],
    map: '고립 · 가장자리에 몰림 / 기운 방향이 웨이퍼 전체에서 같음(흐름)',
    c: [['bath', '평탄제 부족 · 첨가제 균형 이탈 — 평탄제가 적고 전류밀도가 높으면 보통 볼록 (05장)'], ['cond', '전류밀도'], ['eq', '흐름이 한쪽으로 치우침(패들 방향 · 한쪽 흐름) → 윗면이 기운다'], ['up', 'PR 옆벽 모양(아래가 넓은지 좁은지) · 구멍 크기와 깊이']],
    k: [COMMON, '단면 SEM · 3D 프로파일 — 중심 · 가장자리 · 고립 위치별', 'CVS 추세 · 흐름 · 회전 로그', '주의: 방향은 도금액마다 다르다 ("전류밀도↑ = 늘 볼록"이 아님)'],
    f: '첨가제 농도 · bleed & feed, 전류밀도 · 흐름 조정'},
  {id: 'void', nm: '보이드', def: '범프나 솔더 속 빈 구멍 — "어디에, 언제" 생겼는지로 나눈다', st: [0, 3, 5],
    map: '무작위 · 무리(기포) / 액 나이와 함께 늘어남(유기물)',
    c: [['cond', '① 도금 직후 바닥: 구멍에 갇힌 기포(프리웻 · 탈기 부족) · 핀홀'], ['cond', '② 층 사이 계면: 앞 층 표면 산화 · 부동태, 헹굼 부족, 긴 대기'],
      ['bath', '③ 리플로우 뒤 솔더 속: 막에 갇힌 유기물(첨가제 조각)이 가스로 · Ag가 공정점(共晶) 조성보다 많아도 늘었다는 보고'], ['dn', '③ 플럭스 가스 · 리플로우 조건 / ④ 고온 시험 뒤 계면: IMC 성장 · 커켄달 보이드 (도금 Cu 속 S — 촉진제 유래, Ni 없는 Cu 쪽, 06장)']],
    k: [COMMON, '도금 직후 단면 vs 리플로우 뒤 단면', '수 µm 보이드는 2D X-ray로 놓치기 쉽다 → 단면 · FIB', '솔더 속 탄소 · 황, 액 나이 · 분해산물 추세'],
    f: '프리웻 · 탈기, 첨가제 · 분해산물 관리, 층 사이 헹굼 · 대기 시간, 리플로우 조건'},
  {id: 'missing', nm: '누락 · 미도금', sn: '누락', def: '범프가 없거나 아주 작다 — 처음부터 안 쌓였나, 쌓였다 떨어졌나를 먼저 가른다', st: [0, 1, 2],
    map: '무리 → 기포 · 흐름 / 흩어짐 → 입자 · PR 찌꺼기 / 가장자리 → 시드 · 접점',
    c: [['cond', '안 쌓임(바닥 시드가 그대로): 구멍 속 기포 — 프리웻 · 탈기 부족, 입수 기포, 거품'], ['cond', '담글 때 전류 없이 시드가 녹음 → 입수 전류 · 기울여 넣기'],
      ['up', '안 쌓임: PR 찌꺼기(현상 덜 됨 · 디스컴 부족) · 구멍이 안 열림 · 시드 결함 · 산화 · 오염'], ['dn', '떨어짐(밑동 흔적 · 시드 뜯김): PR 제거 · 시드 식각 · 세정 중 탈락 — 밀착 불량 · 언더컷 과다']],
    k: [COMMON, '도금 직후 검사 vs PR 제거 뒤 검사 — 어디서 처음 보였나', '위치 분포 — 무리 · 흩어짐 · 가장자리', 'SEM · SEM-EDS로 바닥 상태 (시드 · PR 찌꺼기)'],
    f: '프리웻 · 탈기 · 기울여 넣기 · 입수 전류, 디스컴 조건, 밀착 · 식각 조건'},
  {id: 'pit', nm: '핀홀 · 피트', def: '표면에 작은 구멍이나 움푹 팬 자리 — 기포가 붙어 있던 자리다', st: [0],
    map: '무작위 · 기포가 모이는 쪽(웨이퍼 위쪽 · 흐름 아래쪽)',
    c: [['bath', 'Ni 액의 습윤제 부족 · 거품 · 유기 오염'], ['cond', '수소 발생이 많음(높은 전류밀도 · 낮은 pH) · 교반 부족'], ['eq', '펌프 · 배관 · 필터로 공기가 빨려 들어감, 액위 낮음'], ['up', '표면 이물 · PR 찌꺼기에 기포가 붙음']],
    k: [COMMON, '표면장력(습윤제) · 거품 상태', '피트 위치와 흐름 방향', '펌프 · 배관 공기 흡입, 액위'],
    f: '습윤제 보충 · 탈기, 공기 흡입 차단, 전류밀도 · 교반 조정'},
  {id: 'nodule', nm: '노듈 (혹)', sn: '노듈', def: '표면에 솟은 혹 — 현장에서는 액 속 입자가 씨앗인 경우가 많다', st: [0, 1],
    map: '무작위(입자) · 같은 액을 쓰는 셀에서 함께 늘어남',
    c: [['bath', '액 속 입자 — Cu 양극(애노드, +) 피막 조각 · Cu⁺에서 생긴 구리 가루 · Sn⁴⁺가 만든 산화주석 미세 입자 · 첨가제 분해물'], ['bath', '첨가제 부족 — 억제 · 평탄이 약해 튀어나온 곳이 더 빨리 자람'], ['eq', '필터 막힘 · 파손, 분리막 손상'], ['cond', '한계전류에 가까운 전류밀도'], ['up', '시드 · PR 표면의 입자']],
    k: [COMMON, '노듈을 잘라 가운데 씨앗 입자의 성분을 SEM-EDS로', '액의 입자 수 · 탁도, 필터 ΔP · 교체 이력', 'Sn⁴⁺ · 첨가제 분석값, 같은 액의 다른 셀과 비교'],
    f: '필터 · 순환 점검, 양극 · 분리막 관리, 액 나이 관리(bleed · 교체)'},
  {id: 'burnt', nm: '탄 도금 (거친 면)', sn: '탄 도금', def: '불에 탄 것이 아니다 — 전류가 너무 세서(한계전류 근처 · 초과) 금속이 가루처럼 어둡고 거칠게 쌓인 것', st: [0],
    map: '고립 범프 · 가장자리에 몰림 / 웨이퍼 전체(조건 · 액)',
    c: [['cond', '전류 과다 · 교반 · 회전 부족'], ['bath', '낮은 금속 농도 · 낮은 온도 · 첨가제 이탈 / Ni는 표면 pH가 올라 수산화물이 섞임 → 붕산 · pH 관리'], ['eq', '접점에 전류가 몰림 · 흐름 막힘'],
      ['up', '실제 열린 면적이 계산보다 작음 → 실제 전류밀도↑ (레시피 전류는 열린 면적으로 정함)']],
    k: [COMMON, '실제 열린 면적으로 전류밀도를 다시 계산', '고립 범프 · 가장자리에 몰리는지', '금속 농도 · 온도 · 유량 로그'],
    f: '전류밀도↓ · 교반↑ · 농도 보정, 면적 정보(마스크 · 개구율) 확인'},
  {id: 'lifting', nm: 'PR 들뜸 · 밑동 번짐', sn: 'PR 들뜸', def: 'PR과 시드 사이로 액이 스며 범프 밑동 둘레에 얇은 "치마"가 생긴다', st: [1],
    map: '가장자리에 몰림 → PR 가장자리 처리 · EBR / 무작위 → 시드 표면 오염',
    c: [['up', '시드 표면 오염 · 산화, PR 굽기 · 현상 조건, PR 두께 · 응력, 노광 뒤 긴 대기'], ['cond', '높은 온도 · 긴 도금 시간 · 프리웻 · 산 담금 조건'], ['bath', '액(계면활성제 · pH)과 PR의 상성 — 따뜻한 Ni 액 · 산성 SnAg 액이 PR을 붓게 함']],
    k: [COMMON, 'PR 제거 뒤 SEM으로 밑동 둘레', '단면 · PR 밀착 시험 · 시드 표면 상태(접촉각)', '새 PR · PR 조건 변경 이력'],
    f: 'PR 밀착(탈수 굽기 · 표면 처리), 도금 온도 · 시간 · 전처리 확인'},
  {id: 'prfoot', nm: 'PR 발 · 밑동 좁음', sn: 'PR 발', def: '구멍 바닥 모서리에 PR이 남아(푸팅 · 찌꺼기) 밑동이 오히려 좁아지고 홈(노치)이 생긴다', st: [1, 2],
    map: '샷 · 노광 무늬 / 웨이퍼 전체(현상 · 디스컴)',
    c: [['up', '포토: 노광 · 현상 부족으로 PR 발(푸팅)'], ['up', '디스컴(플라즈마로 찌꺼기 제거) 부족'], ['dn', '밑동이 좁으면 시드 식각 뒤 언더컷과 겹쳐 범프가 약해진다']],
    k: [COMMON, 'PR 제거 뒤 SEM · 단면으로 밑동 모양', '노광 · 현상 · 디스컴 조건과 lot', '전단 시험 — 계면에서 끊기는지'],
    f: '노광 · 현상 · 디스컴 조건 최적화'},
  {id: 'undercut', nm: '언더컷 과다', def: '범프 밑 시드(Cu · Ti)가 옆으로 많이 파여 범프가 "목이 가는" 모양', st: [2],
    map: '시드가 얇은 구역 · 외톨이 범프 — 먼저 지워져 과식각을 가장 오래 받는다 (두꺼운 구역은 잔여 쪽)',
    c: [['dn', '시드 식각 과다 — 시간 · 온도 · 농도 · 액 나이'], ['up', 'PVD 시드가 두껍거나 두께 산포가 큼 → 가장 두꺼운 곳을 지우는 동안 얇은 곳이 과식각'],
      ['dn', '갈바닉(전지 효과) — 범프 사이 Ti가 끊긴 뒤 밑동 Ti 고리가 넓은 Cu 범프에 붙어 빨리 녹음 · 도금 Cu와 스퍼터 Cu의 식각 속도 차이(결정 · 풀림 상태에 따라)'], ['up', 'PR 발로 밑동이 이미 좁음 → 피해가 겹침']],
    k: [COMMON, '단면 SEM · FIB로 Cu · Ti가 각각 얼마나 파였나', '범프 크기별 · 위치별, 식각 시간 · 액 나이', '전단 강도 시험'],
    f: '식각 조건 · 시간 최적화, 시드 두께 · 균일도 개선'},
  {id: 'nicrack', nm: 'Ni 크랙 · 박리', def: 'Ni 층이 갈라지거나 Cu · SnAg와 떨어졌다 — 어느 계면인지 먼저 본다', st: [1, 3, 4],
    map: '웨이퍼 전체(액) / 특정 시간대 lot(대기 시간)',
    c: [['bath', '① Ni 막 갈라짐: 당기는 응력↑ — 설파민산이 높은 온도 · 낮은 pH에서 분해(황산염 · 암모늄), 불순물, 응력 조절제 부족'], ['cond', '① 전류밀도 · 온도 이탈, Ni가 너무 두꺼움'],
      ['cond', '② Cu/Ni 박리: Cu 표면 산화(헹굼 · 대기 김) / ③ Ni/SnAg 박리: Ni 표면 부동태(헹굼 뒤 오래 둠)'], ['dn', '④ 리플로우 · 적층의 열응력이 약한 곳을 벌린다']],
    k: [COMMON, '단면 SEM — 어느 계면에서 떨어졌나', '응력(굽힘 시편 · 웨이퍼 휨) · Ni 액 pH · 온도 · 분해산물', '층 사이 시간 로그 · 계면 산화막(XPS · 오제)'],
    f: 'Ni 액 · 조건 관리, 층 사이 시간 단축 · 헹굼 · 표면 활성화'},
  {id: 'agcomp', nm: 'Ag 조성 이상', def: '솔더의 Ag %가 목표(보통 1.5~2.5 wt%)를 벗어났다 — 녹는 온도 · Ag₃Sn이 함께 흔들린다', st: [0, 3],
    map: '고리 · 가장자리(전류밀도 분포) / 셀별 차이(흐름)',
    c: [['cond', '전류밀도↑ → Ag %↓, 교반 · 흐름↓ → Ag %↓ (Ag 공급이 확산에 좌우되는 액에서 보통)'], ['bath', '액의 Ag 농도 · 착화제 · 온도 · 액 나이'], ['eq', '회전 · 노즐 · 필터 막힘으로 유량 저하'], ['up', '실제 열린 면적이 다름 → 실제 전류밀도가 바뀜']],
    k: [COMMON, 'XRF(전용 패턴) · ICP · SEM-EDS로 Ag % 맵', '액 Ag 농도(ICP) 추세, 유량 · 회전 로그', '맵 무늬를 전류밀도 분포와 겹쳐 보기 (07 · 10장)'],
    f: '액 Ag 농도 · 흐름 · 전류밀도 조정'},
  {id: 'nonmelt', nm: '비용융 (덜 녹음)', sn: '비용융', def: '리플로우 뒤에도 원기둥 모양 그대로이거나 일부만 둥글고, 표면이 쭈글쭈글하다', st: [3],
    map: '웨이퍼 가장자리(온도 낮음) / 무작위(표면 산화) / 오래 둔 lot',
    c: [['dn', '① 리플로우 최고 온도 · 녹는점 위 시간 부족(가장자리), 분위기 산소↑, 플럭스 · 포름산 환원 부족'], ['cond', '② 솔더 표면 산화막 — 헹굼 · 건조 불량, 오래 보관 (수십 nm로도 둥글어지지 못함) · 얼룩 · 변색(남은 산 · SRD 불량)'],
      ['bath', '③ 노화된 액의 산화주석 미세 입자 · 유기물 혼입'], ['bath', '④ Ag가 공정점(共晶) 조성(3.5 wt%)보다 많음 → 일부만 녹은 "죽" — 목표가 공정점보다 적으니 조성이 벗어났을 때 의심']],
    k: [COMMON, '리플로우 온도 프로파일(측정용 웨이퍼) · 산소 농도', '표면 산화막(XPS · 오제) · 도금 → 리플로우 대기 시간', 'Ag %(XRF · ICP) · DSC로 실제 녹는 온도 · 액 나이'],
    f: '리플로우 프로파일 · 분위기 · 환원, 헹굼 · 건조 · 대기 시간, 조성 관리'},
  {id: 'ag3sn', nm: '굵은 Ag₃Sn 판', def: '솔더 속에 길고 굵은 Ag₃Sn 판이 자라 균열이 지나가는 길이 된다', st: [3, 5],
    map: 'Ag %가 높은 곳(전류밀도가 낮은 곳 — 보통 웨이퍼 중심 쪽 · 빽빽한 패턴 · 특정 셀, XRF 맵으로 확인)과 겹친다',
    c: [['bath', 'Ag %가 높음 — 액 Ag 농도↑ (Ag가 많을수록 큰 판)'], ['cond', '낮은 전류밀도 · 강한 흐름 → Ag %↑'], ['dn', '리플로우 뒤 느린 냉각 · 여러 번의 리플로우']],
    k: [COMMON, '단면 SEM — 판 크기 · 방향', 'Ag %(XRF) 맵과 겹쳐 보기', '리플로우 냉각 속도 · 횟수'],
    f: 'Ag 목표를 공정점보다 낮게(보통 1.5~2.5 wt%), 냉각 속도 관리'},
  {id: 'bridge', nm: '브리지 (붙음)', sn: '브리지', def: '이웃한 범프끼리 붙어 버린 것 — 전기가 이어지는 단락', st: [1, 2, 3, 4],
    map: '고립 · 가장자리 범프에서 먼저 / 무작위(노듈)',
    c: [['cond', '오버 도금 — PR 높이를 넘어 버섯 머리가 옆으로 퍼짐 (고립 · 가장자리 범프 먼저)'], ['bath', '노듈, PR 들뜸으로 번진 밑동이 이어짐'], ['up', 'PR이 얇거나 무너짐 · 패턴 결함'],
      ['dn', '시드가 덜 지워져 이어짐(눈에 안 보일 수 있음) · 리플로우 · 적층(TCB)에서 솔더가 많거나 눌려 넘침']],
    k: [COMMON, 'PR 제거 전 높이를 PR 두께와 비교 · 솔더 양(높이 · 조성)', '시드 잔여를 SEM-EDS로 · 전기 누설 시험', '고립 · 가장자리에 몰리는지'],
    f: '높이 산포 개선 · 도금 시간(전기량) 조정, 시드 식각 확인'}
];
const BY = Object.fromEntries(DEF.map(d => [d.id, d]));
const cats = d => CATS.filter(c => d.c.some(x => x[0] === c));
const GROUPS = {size: ['height', 'shape'], hole: ['void', 'missing', 'pit'], surf: ['nodule', 'burnt'], intf: ['lifting', 'prfoot', 'undercut', 'nicrack'], melt: ['agcomp', 'nonmelt', 'ag3sn', 'bridge']};
const TW = 247, TH = 230, TG = 10, GX = 40, GY = 130;
const tilePos = i => ({x: GX + (i % 4) * (TW + TG), y: GY + Math.floor(i / 4) * (TH + TG)});
const DX0 = 1098, DX1 = 1562;                                    // 오른쪽 상세 패널 안쪽

// 작은 범프 그림. (cx, base) = 패드 윗면 가운데, k = 배율. 로컬 좌표는 x ±115, y −165(위) ~ +30(아래)
function bump(K, id, cx, base, k){
  const {R, C, P, E, L, PG} = K;
  const X = x => cx + x * k, Y = y => base + y * k;
  const rect = (x, y, w, h, c) => R(X(x), Y(y), w * k, h * k, c);
  const path = (pts, c, close = true) => P('M' + pts.map(([x, y]) => `${K.q1(X(x))},${K.q1(Y(y))}`).join(' L') + (close ? ' Z' : ''), c);
  const si = (x0, x1) => rect(x0, 8, x1 - x0, 22, 'f-si');
  const pad = (x, w = 110) => rect(x - w / 2, 0, w, 8, 'f-al');
  const dome = (x, w, y0, dm = 46) => P(`M${X(x - w / 2)},${Y(y0)} C${X(x - w / 2 - 4)},${Y(y0 - dm * 0.7)} ${X(x - w * 0.3)},${Y(y0 - dm)} ${X(x)},${Y(y0 - dm)} C${X(x + w * 0.3)},${Y(y0 - dm)} ${X(x + w / 2 + 4)},${Y(y0 - dm * 0.7)} ${X(x + w / 2)},${Y(y0)} Z`, 'f-sn2');
  // 기둥 하나: 시드 → Cu → Ni → 솔더. top: 'dome'(기본) · 'flat'(솔더 없음) · 'cu'(Cu만)
  const col = (x, o = {}) => {
    const w = o.w || 70, h = o.h || 80, y1 = -4 - h, y2 = y1 - 10;
    let s = rect(x - w / 2, -4, w, 4, 'f-seed2') + rect(x - w / 2, y1, w, h, 'f-cu2');
    if (o.top !== 'cu') s += rect(x - w / 2, y2, w, 10, 'f-ni') + (o.top === 'flat' ? '' : dome(x, w, y2));
    return s;
  };
  const base1 = si(-100, 100) + pad(0);
  switch (id){
    case 'height': return si(-115, 115) + pad(-55, 90) + pad(55, 90) + col(-55) + col(55, {h: 104}) + L(X(-90), Y(-140), X(108), Y(-140), 's-dash') + L(X(104), Y(-140), X(104), Y(-164), 'p12-dim');
    case 'shape': return si(-115, 115) + pad(-72, 70) + pad(0, 70) + pad(72, 70) + rect(-97, -4, 50, 4, 'f-seed2') + rect(-25, -4, 50, 4, 'f-seed2') + rect(47, -4, 50, 4, 'f-seed2')
      + P(`M${X(-97)},${Y(-4)} L${X(-97)},${Y(-84)} Q${X(-72)},${Y(-112)} ${X(-47)},${Y(-84)} L${X(-47)},${Y(-4)} Z`, 'f-cu2')
      + P(`M${X(-25)},${Y(-4)} L${X(-25)},${Y(-92)} Q${X(0)},${Y(-62)} ${X(25)},${Y(-92)} L${X(25)},${Y(-4)} Z`, 'f-cu2')
      + path([[47, -4], [47, -100], [97, -76], [97, -4]], 'f-cu2');
    case 'void': return base1 + col(0) + E(X(20), Y(-14), 9 * k, 6 * k, 'f-hole2') + C(X(8), Y(-94), 3.2 * k, 'f-hole2') + C(X(19), Y(-94), 3.6 * k, 'f-hole2') + C(X(29), Y(-94), 3.2 * k, 'f-hole2')
      + E(X(-12), Y(-116), 9 * k, 7 * k, 'f-hole2') + E(X(15), Y(-127), 6 * k, 5 * k, 'f-hole2');
    case 'missing': return si(-115, 115) + pad(-75, 80) + pad(0, 80) + pad(75, 80) + col(-75, {w: 56})
      + rect(-28, -4, 56, 4, 'f-seed2') + rect(-28, -142, 56, 138, 'pl-ghost') + C(X(0), Y(-16), 11 * k, 'pl-air')
      + rect(47, -4, 22, 4, 'f-seed2') + path([[47, -4], [47, -13], [53, -9], [59, -17], [65, -10], [69, -4]], 'f-cu2') + rect(47, -142, 56, 138, 'pl-ghost');
    case 'pit': return base1 + col(0) + C(X(-12), Y(-139), 5 * k, 'f-hole2') + C(X(20), Y(-128), 4 * k, 'f-hole2') + C(X(-35), Y(-50), 4.5 * k, 'f-hole2') + C(X(46), Y(-112), 9 * k, 'pl-air');
    case 'nodule': return base1 + col(0) + C(X(22), Y(-134), 13 * k, 'f-sn2') + C(X(22), Y(-134), 4 * k, 'p12-seedp') + C(X(41), Y(-52), 9 * k, 'f-cu2') + C(X(41), Y(-52), 3 * k, 'p12-seedp');
    case 'burnt': { let s = base1 + rect(-35, -4, 70, 4, 'f-seed2') + rect(-35, -84, 70, 80, 'f-cu2'); const pts = [[-35, -84]]; for (let i = 0; i <= 10; i++) pts.push([-35 + i * 7, i % 2 ? -100 : -88]); pts.push([35, -84]);
      return s + path(pts, 'pl-burnt') + C(X(-10), Y(-110), 3 * k, 'pl-burnt') + C(X(18), Y(-114), 2.5 * k, 'pl-burnt') + C(X(4), Y(-106), 2 * k, 'pl-burnt'); }
    case 'lifting': return si(-110, 110) + pad(0) + col(0, {top: 'flat'}) + rect(-35, -104, 70, 10, 'f-sn2') + path([[-62, -4], [-35, -4], [-35, -12], [-62, -6]], 'f-cu2') + path([[62, -4], [35, -4], [35, -12], [62, -6]], 'f-cu2')
      + path([[-110, -4], [-110, -108], [-35, -108], [-35, -14], [-64, -7], [-64, -4]], 'p12-prg') + path([[110, -4], [110, -108], [35, -108], [35, -14], [64, -7], [64, -4]], 'p12-prg');
    case 'prfoot': return base1 + rect(-25, -4, 50, 4, 'f-seed2') + path([[-25, -4], [-25, -10], [-35, -24], [-35, -84], [35, -84], [35, -24], [25, -10], [25, -4]], 'f-cu2') + rect(-35, -94, 70, 10, 'f-ni') + rect(-35, -104, 70, 10, 'f-sn2')
      + path([[-100, -4], [-25, -4], [-25, -10], [-35, -24], [-35, -108], [-100, -108]], 'p12-prg') + path([[100, -4], [25, -4], [25, -10], [35, -24], [35, -108], [100, -108]], 'p12-prg');
    case 'undercut': return base1 + rect(-35, -12, 70, 12, 'p12-gap') + rect(-11, -3, 22, 3, 'p12-ti') + rect(-15, -12, 30, 9, 'f-seed2') + rect(-35, -92, 70, 80, 'f-cu2') + rect(-35, -102, 70, 10, 'f-ni') + dome(0, 70, -102);
    case 'nicrack': return base1 + col(0) + P(`M${X(-35)},${Y(-89)} l${12 * k},${-4 * k} l${10 * k},${7 * k} l${12 * k},${-6 * k} l${10 * k},${5 * k} l${12 * k},${-5 * k}`, 'pl-crack') + rect(4, -85, 31, 3, 'f-hole2');
    case 'agcomp': { let s = base1 + col(0); [[-18, -102], [-6, -100], [6, -103], [18, -101], [-12, -112], [0, -114], [12, -111], [-20, -114], [22, -113], [-6, -124], [6, -125], [0, -134], [-14, -122], [15, -122]].forEach(([x, y]) => { s += C(X(x), Y(y), 2.6 * k, 'p12-agd'); });
      return s + rect(56, -104, 14, 84, 'p12-gauge') + rect(56, -60, 14, 18, 'p12-band') + L(X(50), Y(-88), X(76), Y(-88), 'p12-mark'); }
    case 'nonmelt': { const top = [[-35, -94], [-35, -134], [-22, -138], [-10, -133], [4, -139], [18, -134], [35, -137], [35, -94]];
      return base1 + rect(-35, -4, 70, 4, 'f-seed2') + rect(-35, -84, 70, 80, 'f-cu2') + rect(-35, -94, 70, 10, 'f-ni') + path(top, 'f-sn2') + path(top.slice(0, -1), 'p12-ox', false); }
    case 'ag3sn': return base1 + col(0) + PG([[X(-24), Y(-95)], [X(-17), Y(-97)], [X(17), Y(-134)], [X(10), Y(-132)]], 'pl-ag3') + PG([[X(8), Y(-95)], [X(12), Y(-96)], [X(26), Y(-113)], [X(22), Y(-112)]], 'pl-ag3')
      + P(`M${X(12)},${Y(-133)} L${X(19)},${Y(-139)}`, 'pl-crack');
    case 'bridge': return si(-115, 115) + pad(-50, 80) + pad(50, 80) + col(-50, {top: 'flat'}) + col(50, {top: 'flat'})
      + P(`M${X(-85)},${Y(-94)} L${X(-85)},${Y(-110)} C${X(-104)},${Y(-112)} ${X(-104)},${Y(-142)} ${X(-60)},${Y(-144)} L${X(60)},${Y(-144)} C${X(104)},${Y(-142)} ${X(104)},${Y(-112)} ${X(85)},${Y(-110)} L${X(85)},${Y(-94)} L${X(15)},${Y(-94)} L${X(15)},${Y(-110)} L${X(-15)},${Y(-110)} L${X(-15)},${Y(-94)} Z`, 'f-sn2')
      + L(X(-115), Y(-110), X(115), Y(-110), 's-dash') + rect(-15, -3, 30, 3, 'p12-res');
    default: return base1 + col(0);
  }
}
// 상세 그림의 지시선 [x, y, 글] (bump 로컬 좌표)
const NOTE = {
  height: [[104, -152, 'Δh — 높이 차이']], shape: [[-72, -104, '볼록 (돔)'], [0, -78, '오목 (접시)'], [72, -88, '기움']],
  void: [[15, -127, '③ 솔더 속\n리플로우 뒤'], [29, -94, '② 층 사이 계면'], [20, -14, '① 바닥 기포\n도금 직후']],
  missing: [[0, -60, '안 쌓임\n기포 · 찌꺼기'], [58, -14, '떨어짐\n밑동 흔적']], pit: [[20, -128, '피트 (기포 자리)'], [46, -112, '붙은 기포']],
  nodule: [[22, -134, '혹 속 씨앗 입자'], [41, -52, '옆면 혹']], burnt: [[0, -98, '어둡고 거친 가루']],
  lifting: [[72, -60, 'PR (도금 중 · 들뜸)'], [50, -7, '밑동 둘레 얇은 치마']], prfoot: [[68, -60, 'PR (도금 중)'], [30, -12, 'PR 발 → 홈 (노치)']],
  undercut: [[-26, -6, '시드(Cu · Ti)가\n안쪽으로 파임']], nicrack: [[20, -91, 'Ni 갈라짐'], [24, -84, 'Cu/Ni 계면 박리']],
  agcomp: [[70, -88, 'Ag % 계기 — 목표 밖'], [30, -112, 'Ag가 많은 솔더']], nonmelt: [[4, -137, '원기둥 그대로 · 쭈글쭈글'], [35, -112, '표면 산화막']],
  ag3sn: [[13, -130, '굵은 Ag₃Sn 판\n→ 균열 길']], bridge: [[0, -144, '버섯 머리가 붙음'], [110, -110, 'PR 높이'], [0, -2, '남은 시드 (안 보임)']]
};

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '12', id: 'defects', part: 3, short: '불량 도감', scale: '범프 단면 · µm',
  title: '불량 도감 — 이 불량은 어디서 왔을까?',
  hook: '언제 · 어디서 · 어떤 모양',
  one: '불량이 처음 보인 단계, 생김새(단면 · 표면), 위치(웨이퍼 맵 무늬)가 원인 후보를 좁혀 줍니다. 원인은 도금만이 아니므로 도금-장비 · 도금-액 · 도금-조건 · 앞 공정 · 뒤 공정으로 나눠서 봅니다.',
  ana: '<b>의사의 진찰</b> — 언제부터(처음 보인 단계), 어떤 증상이(생김새), 어디가 아픈지(맵 무늬)를 듣고 후보 질환을 몇 개로 좁힌 뒤 검사(단면 · 분석 · 로그)로 확인합니다. 한 번에 확진하려 하지 않습니다. 한계: 우리는 환자 한 명이 아니라 같은 증상의 웨이퍼들이 무엇을 함께 겪었는지(공통점)를 봅니다.',
  steps: [
    {id: 'size', t: '높이와 모양', d: '높이 산포는 웨이퍼 · 다이 · 범프 세 크기에서 봅니다. 맵 무늬와 패턴 없는 모니터 웨이퍼로 장비 원인과 앞 공정 원인을 먼저 나눕니다. 윗면 모양은 첨가제 · 흐름 · PR 벽을 봅니다.'},
    {id: 'hole', t: '빈자리 — 보이드 · 누락 · 핀홀', d: '보이드는 "어디에, 언제" 생겼는지로 나눕니다. 누락은 처음부터 안 쌓였는지(기포 · PR 찌꺼기), 쌓였다 떨어졌는지(PR 제거 · 식각 중 탈락)부터 가릅니다. 핀홀은 기포가 붙어 있던 자리입니다.'},
    {id: 'surf', t: '표면 — 노듈 · 탄 도금', d: '혹(노듈)은 잘라서 가운데 씨앗 입자의 성분(SEM-EDS)부터 봅니다. 탄 도금은 불이 아니라 전류가 한계를 넘은 흔적입니다. 실제 열린 면적으로 전류밀도를 다시 계산합니다.'},
    {id: 'intf', t: '계면과 밑동', d: 'PR 들뜸은 밑동 둘레에 얇은 치마를, PR 발(찌꺼기)은 오히려 좁은 밑동과 홈을 남깁니다. 언더컷은 시드 식각(뒤 공정), Ni 크랙 · 박리는 어느 계면에서 떨어졌는지가 핵심입니다.'},
    {id: 'melt', t: '녹인 뒤 — 조성 · 비용융 · Ag₃Sn · 브리지', d: '주로 리플로우 뒤에 드러나는 불량입니다. Ag 조성은 도금 직후 XRF로 먼저 잡을 수 있습니다. 비용융은 리플로우 온도 · 산화막부터 보고, Ag 과다는 조성이 벗어났을 때 의심합니다. 브리지는 오버 도금과 눈에 안 보이는 시드 잔여까지 봅니다.'}
  ],
  icon(K){
    const {R, P, E} = K;
    return R(20, 30, 26, 30, 'f-cu2') + R(20, 26, 26, 4, 'f-ni') + P('M20,26 C20,10 46,10 46,26 Z', 'f-sn2') + E(30, 20, 4, 3, 'f-hole2') + P('M50,8 L62,20 M62,8 L50,20', 's-arrr');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip} = K;
    let s = '';
    DEF.forEach((d, i) => {
      const {x, y} = tilePos(i), cs = cats(d);
      let g = R(x, y, TW, TH, 'pl-tile2', {rx: 14}) + T(x + 14, y + 32, `${String(i).padStart(2, '0')} ${d.sn || d.nm}`, 't-sub', 'start');
      g += bump(K, d.id, x + TW / 2, y + 172, 0.78);
      // 꼬리표 다섯 칸: 해당하는 칸만 색
      if (d.c.length) CATS.forEach((c, j) => { const on = cs.includes(c), px = x + 12 + j * 45.4; g += R(px, y + TH - 30, 41, 24, 'p12-tg ' + (on ? c : 'off'), {rx: 6}) + T(px + 20.5, y + TH - 12, TS[c], 'p12-tgt' + (on ? '' : ' off')); });
      g += R(x, y, TW, TH, 'pl-pick', {rx: 14});
      s += G(g, {class: 'pl-def', 'data-def': d.id, 'data-tip': `${d.nm} — ${d.def}` + (d.st.length ? `\n처음 보이는 단계: ${d.st.map(k => STG[k]).join(' · ')}` : '') + (cs.length ? `\n원인 꼬리표: ${cs.map(c => TAG[c]).join(' · ')}` : '')});
    });
    // 꼬리표 범례
    let lg = T(GX + 4, 1108, '원인 꼬리표', 'p12-lgt', 'start'), lx = GX + 110;
    CATS.forEach(c => { lg += R(lx, 1089, 41, 24, 'p12-tg ' + c, {rx: 6}) + T(lx + 20.5, 1107, TS[c], 'p12-tgt') + T(lx + 48, 1108, TAG[c], 't-dim', 'start'); lx += 48 + [...TAG[c]].length * 18 + 26; });
    s += LB(lg, tip('도금 인자: 도금-장비 · 도금-액 · 도금-조건\n비도금 인자: 앞 공정 · 뒤 공정\n원인을 나누면 누구와 상의할지가 바로 보인다'));
    s += R(1078, 130, 502, 990, 'pl-panel', {rx: 16}) + `<g data-v="detail"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 불량을 골라 보세요 (장면의 타일을 눌러도 됩니다)</div>
      <div class="pl-seg pl-chips" data-g="def">${DEF.map(d => `<button data-v="${d.id}" aria-pressed="false">${d.sn || d.nm.split(' (')[0]}</button>`).join('')}</div>
      <div class="pl-pcard p12-card" data-o="dcard"></div>
      <p class="hint">${CATS.map(c => `<span class="p12-tag ${c}">${TAG[c]}</span>`).join('')} — 원인 꼬리표. 앞의 셋은 도금 인자, 뒤의 둘은 비도금 인자입니다. 도금 인자와 비도금 인자를 나눠 DOE를 짭니다.</p></div>`;
  },
  mount(K, ctx){
    const {R, T, G, L, C, LB, wrap} = K;
    let picked = false;
    ctx.card.classList.add('p12-card2');                         // 단계 설명 높이를 고정해 단계가 바뀌어도 카드 길이가 그대로이게
    // 오른쪽 상세 패널: 그림 + 지시선 → 이름 · 생김새 → 처음 보이는 단계 → 맵 → 원인 후보 → 확인 → 대책 (넘치면 글자를 줄이고, 그래도 넘치면 대책 · 확인 끝을 카드로 미룬다)
    function detail(d){
      let s = R(DX0, 142, DX1 - DX0, 212, 'pl-lane', {rx: 12});
      const cx = NOTE[d.id] ? 1218 : 1330, base = 316;
      s += bump(K, d.id, cx, base, 1);
      const ns = (NOTE[d.id] || []).slice().sort((a, b) => a[1] - b[1]);
      ns.forEach(([lx, ly, tx], j) => {
        const px = cx + lx, py = base + ly, ty = ns.length === 1 ? Math.max(176, Math.min(330, py + 6)) : 186 + j * (130 / Math.max(1, ns.length - 1));
        s += LB(L(px, py, 1360, ty - 6, 's-lead') + C(px, py, 3.5, 'k-lead') + K.TT(1368, ty, tx.split('\n').flatMap(t => wrap(t, 10.8)), 'p12-note', 'start', 21));
      });
      let y = 392;
      s += T(DX0, y, d.nm, 't-lbl', 'start'); y += 30;
      wrap(d.def, 24).forEach(l => { s += T(DX0, y, l, 'p12-def', 'start'); y += 24; });
      y += 8;
      if (d.st.length){
        s += T(DX0, y + 4, '처음 보이는 단계', 'p12-h', 'start'); y += 16;
        STG.forEach((t, j) => { const on = d.st.includes(j), x = DX0 + (j % 3) * 156, yy = y + Math.floor(j / 3) * 34; s += R(x, yy, 148, 28, 'p12-stc' + (on ? ' on' : ''), {rx: 8}) + T(x + 74, yy + 20, t, 'p12-stt' + (on ? ' on' : '')); });
        y += 92;
      }
      const mp = wrap('맵 무늬 — ' + d.map, 24);
      mp.forEach(l => { s += T(DX0, y, l, 'p12-map', 'start'); y += 24; });
      y += 12;
      // 아래 블록은 남은 높이에 맞춰 글자 크기를 고른다
      const room = 1110 - y;
      const plan = (fs, lh, withFix, kMax) => {
        const cw = (DX1 - DX0 - 78) / fs, kw = (DX1 - DX0 - 12) / fs;
        const cl = d.c.map(([tg, tx]) => wrap(tx, cw)), kl = d.k.slice(0, kMax).map(tx => wrap('· ' + tx, kw));
        const fl = withFix && d.f ? wrap(d.f, kw) : [];
        const n = cl.flat().length + kl.flat().length + fl.length + d.c.length * 0.25;
        const h = (d.c.length ? 32 : 0) + 32 + (fl.length ? 32 : 0) + n * lh + 8;
        return {fs, lh, cl, kl, fl, h};
      };
      // 다 싣는 것을 먼저: 글자를 17 px까지 줄여 보고, 그래도 넘칠 때만 대책 → 확인 끝을 카드로 미룬다 (미루면 맨 아래 한 줄은 안내 자리)
      let best = null;
      for (const [fix, kMax] of [[true, 9], [false, 9], [false, 4], [false, 3]]){
        for (const [fs, lh] of [[19, 24], [18, 22.5], [17, 21], [17, 20]]){
          const p = plan(fs, lh, fix, kMax), cut = (d.f && !fix) || kMax < d.k.length;
          if (p.h + (cut ? 24 : 0) <= room){ best = p; break; }
        }
        if (best) break;
      }
      if (!best) best = plan(17, 20, false, 2);
      const fc = 'p12-tx f' + best.fs;
      if (d.c.length){
        s += T(DX0, y + 4, '원인 후보', 'pl-hdg2', 'start'); y += 32;
        d.c.forEach(([tg], j) => { s += R(DX0, y - best.fs + 1, 70, best.fs + 6, 'p12-tg ' + tg, {rx: 6}) + T(DX0 + 35, y + 1, TD[tg], 'p12-tgt'); best.cl[j].forEach(l => { s += T(DX0 + 78, y, l, fc, 'start'); y += best.lh; }); y += best.lh * 0.25; });
      }
      s += T(DX0, y + 4, d.c.length ? '확인' : '무엇으로 재나', 'pl-hdg', 'start'); y += 32;
      best.kl.forEach((ls, j) => ls.forEach((l, i) => { s += T(DX0 + (i ? 14 : 0), y, l, fc + (j === 0 && d.c.length ? ' p12-com' : ''), 'start'); y += best.lh; }));
      if (best.fl.length){ y += 6; s += T(DX0, y + 4, '대책 방향', 'pl-hdg3', 'start'); y += 32; best.fl.forEach(l => { s += T(DX0, y, l, fc, 'start'); y += best.lh; }); }
      else if (d.f || best.kl.length < d.k.length) s += T(DX1, Math.min(1112, y + 4), '… 나머지는 카드의 「직접 해 보기」에', 'p12-more', 'end');
      return s;
    }
    function show(id, user){
      const d = BY[id]; if (!d) return;
      if (user) picked = true;
      ctx.$$('.pl-def').forEach(g => g.classList.toggle('pl-sel', g.getAttribute('data-def') === id));
      ctx.card.querySelectorAll('[data-g="def"] button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === id ? 'true' : 'false'));
      ctx.$('[data-v="detail"]').innerHTML = detail(d);
      // 카드: 전체 내용
      const st = d.st.length ? `<div class="p12-row"><b>처음 보이는 단계</b> ${STG.map((t, j) => `<span class="p12-st${d.st.includes(j) ? ' on' : ''}">${t}</span>`).join('')}</div>` : '';
      ctx.q('[data-o=dcard]').innerHTML = `<b>${d.nm}</b> — ${d.def}.` + st + `<div class="p12-row"><b>맵 무늬</b> ${d.map}</div>`
        + (d.c.length ? `<div class="p12-row"><b>원인 후보</b>${d.c.map(([tg, tx]) => `<div class="p12-li"><span class="p12-tag ${tg}">${TAG[tg]}</span>${tx}</div>`).join('')}</div>` : '')
        + `<div class="p12-row"><b>${d.c.length ? '확인' : '무엇으로 재나'}</b><ol>${d.k.map(t => `<li>${t}</li>`).join('')}</ol></div>`
        + (d.f ? `<div class="p12-row"><b>대책 방향</b> ${d.f}</div>` : '');
    }
    ctx.card.querySelector('[data-g="def"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b){ show(b.dataset.v, true); syncGroup(b.dataset.v); } });
    ctx.scene.addEventListener('click', ev => { const g = ev.target.closest && ev.target.closest('.pl-def'); if (g){ show(g.getAttribute('data-def'), true); syncGroup(g.getAttribute('data-def')); } });
    function syncGroup(id){ const sid = Object.keys(GROUPS).find(k => GROUPS[k].includes(id)); if (sid && ctx.step() !== sid) ctx.go(sid); }
    ctx.onStepDef = sid => {
      const grp = GROUPS[sid] || [];
      ctx.$$('.pl-def').forEach(g => { const id = g.getAttribute('data-def'); g.classList.toggle('dim', id !== 'normal' && !grp.includes(id)); });
      const cur = ctx.card.querySelector('[data-g="def"] [aria-pressed="true"]');
      if (!picked || !cur || (cur.dataset.v !== 'normal' && !grp.includes(cur.dataset.v))) show(grp[0]);
    };
    show('height');
  },
  onStep(K, ctx, sid){ if (ctx.onStepDef) ctx.onStepDef(sid); },
  notes(K){
    return K.terms([
      ['처음 보이는 단계', '불량이 처음 검출된 검사 시점 (도금 직후 · PR 제거 뒤 · 시드 식각 뒤 · 리플로우 뒤 · 적층 뒤 · 고온 시험 뒤). 원인 공정을 가장 빨리 좁힌다'],
      ['맵 무늬', '불량이 웨이퍼의 어디에 있나 — 고리 · 부채꼴 · 한쪽 · 다이/샷 반복 · 직선 줄무늬 · 무작위 · 무리'],
      ['공통점 찾기', '불량 웨이퍼끼리 무엇을 함께 겪었나 — 장비 · 셀 · 액 나이(Ah) · PM 이력 · PR lot · PVD 챔버'],
      ['탄 도금 (burnt)', '불에 탄 것이 아니라, 전류가 너무 세서(한계전류 근처 · 초과) 가루처럼 어둡고 거칠게 쌓인 것'],
      ['브리지', '이웃한 범프끼리 붙어 버린 것 (단락)'],
      ['단면 분석', '범프를 잘라 속(보이드 · 계면 · 층 두께)을 본다. SEM · FIB, 성분은 SEM-EDS(전자현미경의 X선 성분 분석 — 웨이퍼 전기 검사 EDS와 다름)'],
      ['XRF', 'X선 형광으로 두께 · 조성(Ag 함량 등)을 재는 비파괴 측정'],
      ['전단 시험 (shear)', '범프를 옆에서 밀어 떨어지는 힘과 끊어진 면(솔더 속 = 정상, 계면 = 의심)을 본다'],
      ['DOE (실험 계획)', '조건 몇 개를 계획적으로 바꿔 원인과 효과를 확인하는 작은 실험']
    ]) + K.field([
      '첫 질문 두 개: <b>어디서 처음 보였나</b>, <b>어디에 있나</b>. 같은 누락도 도금 직후에 처음 보이면 기포 · PR 찌꺼기, PR 제거 뒤에 처음 보이면 탈락입니다.',
      '맵 무늬 읽기 (회전 셀): <b>고리</b> → 셀에 고정된 부품(실드 · 고저항판 · 양극(애노드)), <b>부채꼴 · 한쪽</b> → 웨이퍼와 함께 도는 것(콘택트 · 립씰 · 앉음새)이나 앞 공정 맵의 치우침(앞 공정 맵 자체는 보통 고리), <b>다이 · 샷 반복</b> → 패턴 · 노광, <b>직선 줄무늬</b> → 노광 · PR 도포 · 패들 · 기포, <b>무작위</b> → 입자 · 기포 (<a data-go="wafer.map">07장</a>).',
      '패턴 없는 모니터(블랭킷) 웨이퍼의 두께 맵을 따로 재면 패턴 · 앞 공정 효과를 빼고 장비 상태만 볼 수 있습니다. 높이 산포를 장비 쪽과 제품 쪽으로 나누는 가장 기본적인 실험입니다.',
      '확인 방법의 첫 줄은 늘 <b>공통점 찾기</b>입니다(8D의 D4 근본 원인 분석). 원인을 [도금-장비] · [도금-액] · [도금-조건] · [앞 공정] · [뒤 공정]으로 나누면 누구와 상의할지 바로 보입니다 (<a href="#go-edu-5">05 제조기술의 기초 — 8D</a> · <a href="#go-edu-2">02 자주 부딪히는 업무 상황</a>).',
      '측정도 산포를 만듭니다. 측정 장비 · 측정 위치 정의(중심 vs 최고점) · 리플로우 전후가 다르면 숫자가 달라지니, 불량 판정 전에 측정부터 확인합니다.',
      '판정이 끝나면 증상 → 확인 → 원인 → 대책을 <a href="#go-map">업무 알고리즘 맵</a>으로 남겨 두면 다음 사람이 같은 길을 빨리 갑니다.'
    ]) + K.deep(`<p><b>무엇으로 재나</b></p>
      <table class="pl-tb p12-tb"><tr><th>보는 것</th><th>측정</th><th>주의</th></tr>
      <tr><td>범프 높이</td><td>광학 (레이저 삼각측량 · 공초점 · 백색광 간섭)</td><td>무광 SnAg 면에서 흔들릴 수 있음</td></tr>
      <tr><td>두께 · Ag&nbsp;%</td><td>XRF</td><td>측정 점이 범프만 하거나 커서 전용 패턴에서 잼</td></tr>
      <tr><td>솔더 속 보이드</td><td>X-ray</td><td>수 µm 보이드는 놓치기 쉬움 → 단면</td></tr>
      <tr><td>계면 · IMC · Ni 잔량</td><td>단면 SEM · FIB + SEM-EDS</td><td>파괴 분석, 위치 선정이 중요</td></tr>
      <tr><td>접합 강도</td><td>전단 시험</td><td>끊어진 면: 솔더 속 = 정상, 계면 = 의심</td></tr>
      <tr><td>누락 · 브리지 · 이물</td><td>외관 검사 (AOI)</td><td>시드 잔여 단락은 안 보일 수 있음 → 누설 시험</td></tr>
      <tr><td>도금 전 시드</td><td>4탐침 면저항</td><td>두께 맵 → 언더컷 · 터미널 효과와 연결</td></tr></table>
      <ul><li><b>보이드의 네 얼굴</b> — ① 도금 직후 바닥(기포) ② 층 사이 계면(산화 · 헹굼 · 대기) ③ 리플로우 뒤 솔더 속(유기물 가스 · 플럭스) ④ 고온 시험 뒤 계면(IMC 성장 · 커켄달). 도금 직후 단면과 열처리 뒤 단면을 함께 봅니다.</li>
      <li><b>비용융 판정</b> — 겉모양만으로 산화막 · 온도 부족 · Ag 과다를 가르기 어렵습니다. 같은 웨이퍼를 나눠 리플로우 조건 · 표면 처리만 바꿔 보는 교차 실험이 빠릅니다. 수십 nm 산화막만으로도 녹은 솔더가 둥글어지지 못할 수 있습니다.</li>
      <li><b>노화된 SnAg 액</b> — Sn²⁺가 산화되어 생긴 SnO₂ 미세 입자가 막에 섞이면 노듈과 리플로우 불량(무너짐 · 젖음 불량)이 함께 늘어납니다. 그래서 액 나이(Ah)를 공통점 분석에 넣습니다 (<a data-go="bath.byp">11장</a>).</li>
      <li><b>언더컷과 갈바닉</b> — 시드 식각액 속에서 서로 다른 금속이 전기적으로 이어져 있으면 한쪽이 더 빨리 녹습니다. HF로 Ti를 지운 공개 특허 사례(큰 범프 · 예전 공정)에는 언더컷이 범프 밑으로 약 10 µm까지 들어가 범프가 들뜬 예가 소개됩니다. 언더컷과 갈바닉은 <a href="#go-etch-04">시드 식각 04장</a> · <a href="#go-etch-05">05장</a>에서 자세히 다룹니다.</li>
      <li><b>높이 산포 → 동일평면성</b> — 리플로우하면 솔더가 둥글어지므로 높이보다 솔더 부피가 같아야 합니다. 다이 안 최고–최저 차이가 크면 적층 본딩 때 낮은 범프가 닿지 않아 접합 누락이 생깁니다. 도금 직후 높이와 리플로우 뒤 높이를 나눠 기록합니다.</li>
      <li><b>IMC와 Ni 소모</b> — 리플로우 · 본딩 때 Sn이 Ni와 반응해 Ni₃Sn₄(Cu가 섞이면 (Cu,Ni)₆Sn₅) 층이 생기며 Ni를 조금씩 먹습니다. 여러 층을 쌓으며 열을 여러 번 받으면 아래쪽 다이일수록 더 진행되므로, Ni 두께는 모든 열 이력 뒤에도 남아 있어야 할 양으로 정합니다.</li></ul>`);
  },
  css: `.pl-svg .p12-tg.off{fill:none;stroke:rgba(148,163,184,.28);stroke-width:1.2}
.pl-svg .p12-tg.eq{fill:rgba(248,113,113,.34)}
.pl-svg .p12-tg.bath{fill:rgba(56,189,248,.34)}
.pl-svg .p12-tg.cond{fill:rgba(45,212,191,.32)}
.pl-svg .p12-tg.up{fill:rgba(167,139,250,.38)}
.pl-svg .p12-tg.dn{fill:rgba(245,158,11,.34)}
.pl-svg .p12-tgt{font-size:16px;font-weight:800;fill:#f1f5f9 !important;text-anchor:middle;stroke:none !important}
.pl-svg .p12-tgt.off{fill:#475569 !important}
.pl-svg .p12-lgt{font-size:18px;font-weight:800;fill:#cbd5e1 !important}
.pl-svg .p12-def{font-size:19px;fill:#e2e8f0 !important}
.pl-svg .p12-map{font-size:19px;fill:#c4b5fd !important}
.pl-svg .p12-h{font-size:19px;font-weight:800;fill:#fcd34d !important}
.pl-svg .p12-stc{fill:none;stroke:rgba(148,163,184,.3);stroke-width:1.2}
.pl-svg .p12-stc.on{fill:rgba(245,158,11,.85);stroke:#fbbf24}
.pl-svg .p12-stt{font-size:17px;font-weight:700;fill:#64748b !important;text-anchor:middle;stroke:none !important}
.pl-svg .p12-stt.on{fill:#1b1203 !important;font-weight:900}
.pl-svg .p12-tx{fill:#cbd5e1 !important}
.pl-svg .p12-tx.f19{font-size:19px}.pl-svg .p12-tx.f18{font-size:18px}.pl-svg .p12-tx.f17{font-size:17px}
.pl-svg .p12-com{fill:#fde68a !important;font-weight:700}
.pl-svg .p12-more{font-size:17px;fill:#94a3b8 !important}
.jz.pl.pres .pl-svg .p12-more{display:none}
.pl-svg .p12-note{font-size:17px;font-weight:700;fill:#fde68a !important}
.pl-svg .p12-dim{fill:none;stroke:#fbbf24;stroke-width:2.6}
.pl-svg .p12-seedp{fill:#1e293b;stroke:#f87171;stroke-width:1.4}
.pl-svg .p12-prg{fill:rgba(139,123,224,.18);stroke:#a99cf0;stroke-width:1.2;stroke-dasharray:5 4}
.pl-svg .p12-gap{fill:rgba(248,113,113,.28)}
.pl-svg .p12-ti{fill:#94a3b8}
.pl-svg .p12-agd{fill:#334155;stroke:#0f172a;stroke-width:.6}
.pl-svg .p12-gauge{fill:rgba(15,23,42,.9);stroke:#94a3b8;stroke-width:1}
.pl-svg .p12-band{fill:rgba(34,197,94,.55)}
.pl-svg .p12-mark{fill:none;stroke:#f87171;stroke-width:3.4}
.pl-svg .p12-ox{fill:none;stroke:#f59e0b;stroke-width:2.6}
.pl-svg .p12-res{fill:rgba(248,113,113,.75)}
.jc .p12-tag{display:inline-block;font-size:11px;font-weight:800;border-radius:6px;padding:0 6px;margin-right:4px;vertical-align:1px}
.jc .p12-tag.eq{background:rgba(248,113,113,.2);color:#fca5a5}
.jc .p12-tag.bath{background:rgba(56,189,248,.2);color:#7dd3fc}
.jc .p12-tag.cond{background:rgba(45,212,191,.2);color:#5eead4}
.jc .p12-tag.up{background:rgba(167,139,250,.22);color:#c4b5fd}
.jc .p12-tag.dn{background:rgba(245,158,11,.2);color:#fcd34d}
.jc.p12-card2 .steps li.open em{min-height:72px}
.jc .p12-card{min-height:540px}
.jc .p12-card .p12-row{margin-top:5px}
.jc .p12-card .p12-li{margin:2px 0 2px 2px}
.jc .p12-card ol{margin:2px 0 0;padding-left:18px}
.jc .p12-card ol li:first-child{color:#fde68a}
.jc .p12-st{display:inline-block;font-size:11px;border:1px solid rgba(148,163,184,.3);border-radius:6px;padding:0 5px;margin:1px 2px;color:#64748b}
.jc table.p12-tb th,.jc table.p12-tb td{word-break:keep-all}
.jc .p12-st.on{background:rgba(245,158,11,.85);border-color:#fbbf24;color:#1b1203;font-weight:800}`
});
})();
