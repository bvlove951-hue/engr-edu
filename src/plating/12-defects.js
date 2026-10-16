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
  {id: 'normal', nm: '정상', def: '베이스 다이는 Cu 기둥 → Ni → 상부 Cu → 둥근 SnAg 모자, 코어 다이는 Ni 몸통 위 SnAg (Cu 기둥 없음)', st: [], map: '비교 기준 — 같은 lot의 정상 범프를 늘 함께 본다 (어느 다이의 웨이퍼인지 먼저 적는다)',
    c: [], k: ['높이 → 광학(레이저 · 공초점 · 백색광 간섭)', '두께 · Ag % → XRF (전용 패턴) · 상부 Cu는 단면 (Cu 기둥과 같은 원소라 XRF로 가르기 어려움)', '솔더 속 보이드 → X-ray', '계면 · IMC → 단면 SEM · FIB + 성분 분석(SEM-EDS)', '접합 강도 → 전단 시험', '누락 · 브리지 → AOI', '도금 전 시드 → 4탐침 면저항'], f: ''},
  {id: 'height', nm: '높이 산포', def: '범프 높이가 세 크기에서 다르다 — 웨이퍼 안 · 다이 안(밀집 vs 고립) · 범프 안(윗면)', st: [0, 3],
    map: '고리(셀에 고정된 부품) · 부채꼴 · 한쪽(콘택트 · 립씰) · 다이 반복(패턴) · 앞 공정 맵은 보통 고리, 치우치면 한쪽',
    c: [['eq', '실드 · 고저항판 · 회전 · 콘택트 · 립씰 상태 (07 · 09장)'], ['cond', '전류밀도 · 교반'], ['bath', '전도도 · 첨가제'],
      ['up', 'PVD 시드 두께 분포 · PR 두께 · CD · EBR 폭 · 가장자리 부분 다이(열린 면적이 바뀜) · 패턴 밀도(설계)'], ['dn', '리플로우 뒤 높이는 솔더 양 + 젖음(베이스 다이는 솔더가 상부 Cu 옆면을 조금 타고 내려가 Ni에서 멈출 수 있음) · 플럭스 조건']],
    k: [COMMON, '패턴 없는 모니터 웨이퍼의 두께 맵 → 장비 몫만 따로', '층별 두께(베이스 Cu 기둥 · Ni · 상부 Cu · SnAg, 코어 Ni · SnAg) · 시드 면저항 · PR 두께 · CD 맵', '콘택트 저항 · 정류기 로그'],
    f: '장비 원인과 앞 공정 원인을 먼저 나눈 뒤 각각 — 실드 · 고저항판 · 전류밀도, 더미 패턴, 하드웨어 점검'},
  {id: 'shape', nm: '윗면 모양 이상', sn: '윗면 모양', def: '윗면이 볼록(돔) · 오목(접시) · 한쪽으로 기움 · 가장자리 솟음 — 위 층들이 그 모양을 따라간다', st: [0, 1],
    map: '고립 · 가장자리에 몰림 / 기운 방향이 웨이퍼 전체에서 같음(흐름)',
    c: [['bath', '평탄제 부족 · 첨가제 균형 이탈 — 평탄제가 적고 전류밀도가 높으면 보통 볼록 (05장)'], ['cond', '전류밀도'], ['eq', '흐름이 한쪽으로 치우침(패들 방향 · 한쪽 흐름) → 윗면이 기운다'], ['up', 'PR 옆벽 모양(아래가 넓은지 좁은지) · 구멍 크기와 깊이']],
    k: [COMMON, '단면 SEM · 3D 프로파일 — 중심 · 가장자리 · 고립 위치별', 'CVS 추세 · 흐름 · 회전 로그', '주의: 방향은 도금액마다 다르다 ("전류밀도↑ = 늘 볼록"이 아님)'],
    f: '첨가제 농도 · bleed & feed, 전류밀도 · 흐름 조정'},
  {id: 'topcu', nm: '상부 Cu 두께 산포', sn: '상부 Cu 두께', def: '베이스 다이의 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu, 예시 3 µm)가 목표보다 얇거나 두껍다 — 리플로우 · 고온 시험 뒤 계면 IMC가 달라진다', st: [0, 3, 5],
    map: '고리 · 가장자리(셀 전류 분포) / 다이 반복(열린 면적 · 밀집도) — Cu 기둥 높이 맵과 겹쳐 본다',
    c: [['cond', '짧은 단계라 시작 · 끝 구간(입수 · 램프)의 몫이 커서 두께 %가 흔들리기 쉽다 — 시간 · 전류 레시피'], ['eq', '상부 Cu를 올리는 셀의 분포 — 같은 Cu 액이라도 셀마다 실드 · 고저항판 · 콘택트 상태가 다를 수 있다'],
      ['up', '열린 면적 · 패턴 밀도 — 외톨이 범프가 두꺼워진다 (08장)'], ['dn', '얇으면 상부 Cu가 열 이력 초반에 다 쓰여 Ni 소모가 일찍 시작되고(Cu가 모자라면 Ni₃Sn₄ 쪽), 두꺼우면 Cu가 남아 Cu₃Sn · 커켄달 보이드 쪽 — 목표는 열 이력 끝 무렵 다 쓰이는 양']],
    k: [COMMON, '단면 SEM · FIB로 층별 두께 — Cu가 두 층(기둥 · 상부)이라 XRF로는 가르기 어려울 수 있다', '리플로우 · 고온 시험 뒤 단면 — 상부 Cu가 남았나, IMC 종류(SEM-EDS)', '셀 · 레시피별 상부 Cu 두께 추세'],
    f: '목표를 열 이력 끝 무렵 솔더가 다 쓸 양으로 두고(예시: Cu 3 µm는 Sn 약 5.7 µm와 반응) 위아래 규격으로 — 시간 · 전류 · 셀 분포 관리'},
  {id: 'void', nm: '보이드', def: '범프나 솔더 속 빈 구멍 — "어디에, 언제" 생겼는지로 나눈다', st: [0, 3, 5],
    map: '무작위 · 무리(기포) / 액 나이와 함께 늘어남(유기물)',
    c: [['cond', '① 도금 직후 바닥: 구멍에 갇힌 기포(프리웻 · 탈기 부족) · 핀홀'], ['cond', '② 층 사이 계면: 앞 층 표면 산화 · 부동태(특히 Ni 다음 층), 헹굼 부족, 긴 대기'],
      ['bath', '③ 리플로우 뒤 솔더 속: 막에 갇힌 유기물(첨가제 조각)이 가스로 · Ag가 공정점(共晶) 조성보다 많아도 늘었다는 보고'], ['dn', '③ 플럭스 가스 · 리플로우 조건 / ④ 고온 시험 뒤 계면: IMC 성장 · 커켄달 보이드 — 남은 Cu 위 Cu₃Sn 쪽(베이스는 상부 Cu가 두꺼울 때 · 도금 Cu 속 S가 키움, 06장)']],
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
    c: [['up', '시드 표면 오염 · 산화, PR 굽기 · 현상 조건, PR 두께 · 응력, 노광 뒤 긴 대기'], ['cond', '높은 온도 · 긴 도금 시간 · 프리웻 · 산 담금 조건 — 베이스 다이는 셀을 네 번 거쳐 PR이 액에 더 오래 닿는다'], ['bath', '액(계면활성제 · pH)과 PR의 상성 — 따뜻한 Ni 액 · 산성 SnAg 액이 PR을 붓게 함']],
    k: [COMMON, 'PR 제거 뒤 SEM으로 밑동 둘레', '단면 · PR 밀착 시험 · 시드 표면 상태(접촉각)', '새 PR · PR 조건 변경 이력'],
    f: 'PR 밀착(탈수 굽기 · 표면 처리), 도금 온도 · 시간 · 전처리 확인'},
  {id: 'prfoot', nm: 'PR 발 · 밑동 좁음', sn: 'PR 발', def: '구멍 바닥 모서리에 PR이 남아(푸팅 · 찌꺼기) 밑동이 오히려 좁아지고 홈(노치)이 생긴다', st: [1, 2],
    map: '샷 · 노광 무늬 / 웨이퍼 전체(현상 · 디스컴)',
    c: [['up', '포토: 노광 · 현상 부족으로 PR 발(푸팅)'], ['up', '디스컴(플라즈마로 찌꺼기 제거) 부족'], ['dn', '밑동이 좁으면 시드 식각 뒤 언더컷과 겹쳐 범프가 약해진다']],
    k: [COMMON, 'PR 제거 뒤 SEM · 단면으로 밑동 모양', '노광 · 현상 · 디스컴 조건과 lot', '전단 시험 — 계면에서 끊기는지'],
    f: '노광 · 현상 · 디스컴 조건 최적화'},
  {id: 'undercut', nm: '언더컷 과다', def: '범프 밑 시드(Cu · Ti)가 옆으로 많이 파여 범프가 "목이 가는" 모양', st: [2],
    map: '시드가 얇은 구역 · 외톨이 범프 — 먼저 지워져 과식각을 가장 오래 받는다 (두꺼운 구역은 잔여 쪽)',
    c: [['dn', '시드 식각 과다 — 시간 · 온도 · 농도 · 액 나이 (베이스 다이는 Cu 기둥 옆면 · 상부 Cu 띠도 함께 깎여 Ni와 SnAg 사이에 홈)'], ['up', 'PVD 시드가 두껍거나 두께 산포가 큼 → 가장 두꺼운 곳을 지우는 동안 얇은 곳이 과식각'],
      ['dn', '갈바닉(전지 효과) — 범프 사이 Ti가 끊긴 뒤 밑동 Ti 고리(녹는 쪽)가 넓은 범프 겉면(받는 쪽)에 이어져 빨리 녹음(HF 속) · 도금 Cu와 스퍼터 Cu의 식각 속도 차이(결정 · 풀림 상태에 따라)'], ['up', 'PR 발로 밑동이 이미 좁음 → 피해가 겹침']],
    k: [COMMON, '단면 SEM · FIB로 Cu · Ti가 각각 얼마나 파였나', '베이스: 상부 Cu 띠 옆 홈 · Cu 기둥 지름 / 코어: Ni 발 아래 시드 언더컷', '범프 크기별 · 위치별, 식각 시간 · 액 나이', '전단 강도 시험'],
    f: '식각 조건 · 시간 최적화, 시드 두께 · 균일도 개선'},
  {id: 'nicrack', nm: 'Ni 크랙 · 박리', def: 'Ni 막이 갈라지거나 아래 Cu 기둥과 떨어졌다 — 어느 계면인지 먼저 본다 (Ni 위 계면은 상부 Cu 들뜸, 코어 시드/Ni는 코어 Ni 들뜸 타일)', st: [1, 3, 4],
    map: '웨이퍼 전체(액) / 대기가 길었던 lot',
    c: [['bath', '① Ni 막 갈라짐: 당기는 응력↑ — 설파민산이 높은 온도 · 낮은 pH에서 분해(황산염 · 암모늄), 불순물, 응력 조절제 부족'], ['cond', '① 전류밀도 · 온도 이탈, Ni가 너무 두꺼움'],
      ['cond', '② Cu 기둥/Ni 박리: Cu 표면 산화(헹굼 · 대기 김) / ③ Ni 위 계면: Ni 부동태(헹굼 뒤 오래 둠) · 전류 없이 담가 Cu · Ag 치환 석출 — 베이스 Ni/상부 Cu · 코어 Ni/SnAg'], ['dn', '④ 리플로우 · 적층의 열응력이 약한 곳을 벌린다']],
    k: [COMMON, '단면 SEM — 어느 계면에서 떨어졌나 (베이스: Cu 기둥/Ni · Ni/상부 Cu · 상부 Cu/SnAg, 코어: 시드/Ni · Ni/SnAg)', '응력(굽힘 시편 · 웨이퍼 휨) · Ni 액 pH · 온도 · 분해산물', '층 사이 시간 로그 · 계면 산화막(XPS · 오제)'],
    f: 'Ni 액 · 조건 관리, 층 사이 시간 단축 · 헹굼 · 표면 활성화'},
  {id: 'cuni', nm: '상부 Cu 들뜸 (Ni/상부 Cu 계면)', sn: '상부 Cu 들뜸', def: '베이스 다이에서 Ni 위 상부 Cu가 Ni와 잘 붙지 않아 계면이 벌어진다 — Ni 표면에 금방 생기는 얇은 산화막(부동태)이 흔한 원인', st: [1, 2, 3, 5],
    map: '특정 시간대 · lot(셀 사이 대기 · 장비 멈춤) / 웨이퍼 전체(헹굼 · 활성화 조건)',
    c: [['cond', 'Ni 셀 → 상부 Cu 셀 사이 대기가 김 · 헹굼 뒤 마름 — Ni는 공기 · 물에서 금방 부동태가 된다 (코어 다이 Ni → SnAg도 같은 이유)'], ['cond', '산 담금(활성화) 생략 · 약함, 헹굼 물 오염, 입수 전류 없이 담금(전류 없이 치환 Cu가 먼저 붙으면 밀착이 약할 수 있음)'],
      ['eq', '셀 사이 이송 지연 · 장비 멈춤(알람) 뒤 다시 시작한 웨이퍼'], ['bath', 'Ni 막 표면 상태(Ni 액 pH · 불순물) · 상부 Cu 액의 첫 핵 생성'], ['dn', 'PR 제거 · 시드 식각 액이 계면 틈으로 스밈 · 리플로우 열응력이 틈을 벌림']],
    k: [COMMON, '단면 SEM · FIB — Ni/상부 Cu 계면 틈, 가장자리부터 벌어졌나', '셀 사이 시간 로그 · 장비 멈춤 이력과 겹쳐 보기', '계면 산화막(XPS · 오제) · 전단 시험의 끊어진 면'],
    f: 'Ni 헹굼 뒤 지체 없이 상부 Cu로(마르지 않게), 필요하면 산 담금, 대기 시간 한도 · 멈춘 웨이퍼 처리 기준'},
  {id: 'coreni', nm: '코어 Ni 들뜸 · 응력', sn: '코어 Ni 들뜸', def: '코어 다이는 Cu 기둥 없이 시드 위에 바로 Ni 몸통(예시 5 µm)을 올린다 — 그 Ni가 시드에서 들뜨거나 응력으로 갈라진다', st: [1, 2, 4],
    map: '웨이퍼 전체(Ni 액 응력) / 가장자리(시드 · 콘택트) / 시드 식각 뒤 밑동(언더컷과 겹침)',
    c: [['bath', '당기는 응력↑ — 설파민산 분해(높은 온도 · 낮은 pH) · 불순물 · 응력 조절제 부족. Ni가 두꺼울수록 모서리가 잘 들린다'], ['cond', '시드 위 첫 핵 생성 — 입수 · 시작 전류, 시드 산화(프리웻 · 산 담금)'],
      ['up', '시드 표면 오염 · 산화, PVD 시드(Ti/Cu) 밀착'], ['dn', 'Ni 발 아래 Cu 시드 언더컷(시드 식각) · 적층 본딩의 열응력']],
    k: [COMMON, '단면 SEM — 시드/Ni 계면 틈 · Ni 막 속 균열', 'Ni 응력(굽힘 시편 · 웨이퍼 휨) · Ni 액 pH · 온도 · 분해산물', 'PR 제거 · 시드 식각 뒤 밑동 SEM · 전단 시험의 끊어진 면'],
    f: 'Ni 액 응력 관리(저응력 설파민산 조건 · pH · 붕산 · 온도), 시드 전처리 · 입수 조건, 언더컷 관리'},
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
const GROUPS = {size: ['height', 'shape', 'topcu'], hole: ['void', 'missing', 'pit'], surf: ['nodule', 'burnt'], intf: ['lifting', 'prfoot', 'undercut', 'nicrack', 'cuni', 'coreni'], melt: ['agcomp', 'nonmelt', 'ag3sn', 'bridge']};
// 타일 4칸 × 5줄 (19장 + 마지막 칸은 꼬리표 범례), TK = 타일 안 범프 배율
const TW = 247, TH = 192, TG = 10, TGV = 8, GX = 40, GY = 112, TK = 0.64;
const tilePos = i => ({x: GX + (i % 4) * (TW + TG), y: GY + Math.floor(i / 4) * (TH + TGV)});
const PY = GY + 5 * TH + 4 * TGV;                                // 타일 아래 끝 (1104)
const DX0 = 1098, DX1 = 1562;                                    // 오른쪽 상세 패널 안쪽

// 그림 두께 (로컬 단위) — 베이스 다이 Cu 기둥 12 : Ni 3 : 상부 Cu 3 : SnAg 12 µm(예시) = 40 · 10 · 10 · 40 %.
// 얇은 Ni · 상부 Cu는 과장하되 둘은 같게, 타일 배율 0.64에서도 8 px 넘게. 코어 다이는 시드 위 Ni 5 µm(몸통) + SnAg → 같은 축척이면 베이스보다 낮다 (17 : 30)
const SD = 4, CU = 52, NI = 13, TC = 13, CNI = 22, DM = 56;
const YC = -SD - CU, YN = YC - NI, YT = YN - TC;                 // Cu 기둥 윗면 −56 · Ni 윗면 −69 · 상부 Cu 윗면(솔더 바닥) −82
// 층 재질 · 툴팁 (툴팁은 오른쪽 상세 그림에서만)
const LT = {seed: ['f-seed2', 'Cu 시드 — 실제 수백 nm (그림은 과장)'], cu: ['f-cu2', 'Cu 기둥 — 높이 · 전기'], ni: ['f-ni', 'Ni — Cu 기둥과 솔더 사이 방벽'],
  tc: ['f-cu2', '상부 Cu — Ni 위에 얇게 한 번 더 올린 Cu\n솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로'], sn: ['f-sn2', 'SnAg — 녹아서 붙는 솔더'], cni: ['f-ni', 'Ni — 몸통 겸 방벽 (코어 다이, Cu 기둥 없음)']};

// 작은 범프 그림. (cx, base) = 패드 윗면 가운데, k = 배율, big = 상세 패널(층 툴팁 · 그림 속 글). 로컬 좌표는 x ±115, y −165(위) ~ +30(아래)
function bump(K, id, cx, base, k, big){
  const {R, C, P, E, L, PG} = K;
  const X = x => cx + x * k, Y = y => base + y * k;
  const tp = t => big ? K.tip(LT[t][1]) : null;
  const rect = (x, y, w, h, c, o) => R(X(x), Y(y), w * k, h * k, c, o);
  const lay = (t, x, y, w, h) => rect(x, y, w, h, LT[t][0], tp(t));
  const path = (pts, c, close = true, o) => P('M' + pts.map(([x, y]) => `${K.q1(X(x))},${K.q1(Y(y))}`).join(' L') + (close ? ' Z' : ''), c, o);
  const lpath = (t, pts) => path(pts, LT[t][0], true, tp(t));
  const lab = (x, y, lines, a = 'start', c = 'p12-note') => big ? K.TT(X(x), Y(y), lines, c, a, 20) : '';
  const ld = (x1, y1, x2, y2) => big ? L(X(x1), Y(y1), X(x2), Y(y2), 's-lead') + C(X(x1), Y(y1), 3, 'k-lead') : '';
  const si = (x0, x1) => rect(x0, 8, x1 - x0, 22, 'f-si');
  const pad = (x, w = 110) => rect(x - w / 2, 0, w, 8, 'f-al');
  const dome = (x, w, y0, dm = DM) => P(`M${X(x - w / 2)},${Y(y0)} C${X(x - w / 2 - 4)},${Y(y0 - dm * 0.7)} ${X(x - w * 0.3)},${Y(y0 - dm)} ${X(x)},${Y(y0 - dm)} C${X(x + w * 0.3)},${Y(y0 - dm)} ${X(x + w / 2 + 4)},${Y(y0 - dm * 0.7)} ${X(x + w / 2)},${Y(y0)} Z`, 'f-sn2', tp('sn'));
  // 기둥 하나 — 베이스: 시드 → Cu 기둥 → Ni → 상부 Cu → 솔더, core: 시드 → Ni(몸통) → 솔더.
  // top: 없으면 둥근 솔더 · 'flat' 솔더 없음 · 'cu' Cu 기둥만 · 숫자 = 아직 원기둥인 솔더 높이
  const col = (x, o = {}) => {
    const w = o.w || 70, x0 = x - w / 2;
    let y = -SD, s = lay('seed', x0, y, w, SD);
    const up = (t, h) => { y -= h; s += lay(t, x0, y, w, h); };
    if (o.core) up('cni', CNI);
    else { up('cu', o.h || CU); if (o.top === 'cu') return s; up('ni', NI); up('tc', TC); }
    if (o.top === 'flat') return s;
    if (typeof o.top === 'number'){ up('sn', o.top); return s; }
    return s + dome(x, w, y);
  };
  const base1 = si(-100, 100) + pad(0);
  switch (id){
    case 'normal': return si(-115, 115) + pad(-55, 90) + pad(45, 90) + col(-55, {core: true}) + col(45)
      + lab(-96, -64, ['코어 다이', 'Ni / SnAg', 'Cu 기둥 없음'], 'end', 'p12-bl') + lab(45, -148, ['베이스 다이'], 'middle', 'p12-bl')
      + ld(80, -108, 92, -112) + ld(80, YT + TC / 2, 92, -86) + ld(80, YN + NI / 2, 92, -60) + ld(80, -30, 92, -33)
      + lab(96, -107, ['SnAg — 솔더']) + lab(96, -81, ['상부 Cu']) + lab(96, -55, ['Ni — 방벽']) + lab(96, -28, ['Cu 기둥']);
    case 'height': return si(-115, 115) + pad(-55, 90) + pad(55, 90) + col(-55) + col(55, {h: CU + 24})
      + L(X(-90), Y(YT - DM), X(108), Y(YT - DM), 's-dash') + L(X(104), Y(YT - DM), X(104), Y(YT - DM - 24), 'p12-dim');
    case 'shape': {   // Cu 기둥 윗면 모양을 위 층들이 따라간다 (볼록 · 오목 · 기움)
      const us = [...Array(13)].map((_, i) => i / 12);
      const stack = (x0, w, f) => {
        const band = (lo, hi, t) => lpath(t, us.map(u => [x0 + u * w, lo(u)]).concat(us.slice().reverse().map(u => [x0 + u * w, hi(u)])));
        const t0 = u => YC + f(u), t1 = u => t0(u) - NI, t2 = u => t1(u) - TC, t3 = u => t2(u) - 34;
        return lay('seed', x0, -SD, w, SD) + band(() => -SD, t0, 'cu') + band(t0, t1, 'ni') + band(t1, t2, 'tc') + band(t2, t3, 'sn');
      };
      return si(-115, 115) + pad(-72, 70) + pad(0, 70) + pad(72, 70)
        + stack(-97, 50, u => -22 * (1 - (2 * u - 1) ** 2)) + stack(-25, 50, u => -16 * (2 * u - 1) ** 2) + stack(47, 50, u => -12 + 24 * u)
        + lab(-72, -148, ['볼록'], 'middle', 'p12-bl') + lab(0, -148, ['오목'], 'middle', 'p12-bl') + lab(72, -148, ['기움'], 'middle', 'p12-bl'); }
    case 'topcu': {   // 열 이력 뒤: 왼쪽 = 너무 얇은 상부 Cu가 일찍 다 쓰여 Ni 소모가 일찍 시작(Ni가 얇아지고 각진 Ni₃Sn₄), 오른쪽 = 두꺼운 상부 Cu가 남아 Cu₃Sn · 보이드
      // 다 쓰이는 것 자체는 설계 목표(Ni 위 (Cu,Ni)₆Sn₅) — 왼쪽의 문제는 '너무 이른 것'
      const a = -55, b = 55, yr = YN - 24, yn = YN + 4;
      let s = si(-115, 115) + pad(a, 90) + pad(b, 90);
      const fac = [[a - 35, yn]];
      for (let i = 0; i <= 7; i++) fac.push([a - 35 + i * 10, i % 2 ? yn - 7 : yn - 2]);
      fac.push([a + 35, yn]);
      s += lay('seed', a - 35, -SD, 70, SD) + lay('cu', a - 35, YC, 70, CU) + lay('ni', a - 35, yn, 70, YC - yn)
        + rect(a - 35, YN - 9, 70, yn - YN + 9, 'f-imc', big ? K.tip('(Cu,Ni)₆Sn₅ — 너무 얇아 리플로우 · 본딩 몇 번 만에 상부 Cu가 일찍 다 쓰였다\n다 쓰이는 것 자체는 설계 목표 — 문제는 너무 이른 것: Ni 소모가 일찍 시작되고\n솔더 속 Cu가 모자라면 Ni₃Sn₄ 쪽으로 바뀔 수 있다') : null)
        + path(fac, 'f-imc p12-ni34', true, big ? K.tip('Ni₃Sn₄ (각진 조각) — 남은 열 이력 동안 Cu가 모자라면 Ni 위에 자라며 Ni를 먹을 수 있다') : null)
        + (big ? L(X(a - 35), Y(YN), X(a + 35), Y(YN), 'p12-ni0', K.tip('원래 Ni 윗면 — 그 아래까지 Ni가 먹혔다')) : '') + dome(a, 70, YN - 9);
      s += lay('seed', b - 35, -SD, 70, SD) + lay('cu', b - 35, YC, 70, CU) + lay('ni', b - 35, YN, 70, NI) + lay('tc', b - 35, yr, 70, YN - yr)
        + rect(b - 35, yr - 5, 70, 5, 'pl-imc3', big ? K.tip('Cu₃Sn — 남은 Cu 위에서 자란다') : null) + rect(b - 35, yr - 12, 70, 7, 'f-imc', big ? K.tip('Cu₆Sn₅') : null) + dome(b, 70, yr - 12);
      [-26, -12, 2, 16, 28].forEach(dx => { s += C(X(b + dx), Y(yr - 0.5), 2.4 * k, 'f-hole2'); });
      return s + lab(-96, -96, ['너무 얇음', '일찍 다 쓰여', 'Ni 소모 시작'], 'end') + lab(96, -96, ['두꺼움', 'Cu가 남아', 'Cu₃Sn · 보이드']); }
    case 'void': return base1 + col(0) + E(X(20), Y(-14), 9 * k, 6 * k, 'f-hole2') + C(X(8), Y(YN), 3.2 * k, 'f-hole2') + C(X(19), Y(YN), 3.6 * k, 'f-hole2') + C(X(29), Y(YN), 3.2 * k, 'f-hole2')
      + E(X(-12), Y(-104), 9 * k, 7 * k, 'f-hole2') + E(X(15), Y(-118), 6 * k, 5 * k, 'f-hole2');
    case 'missing': return si(-115, 115) + pad(-75, 80) + pad(0, 80) + pad(75, 80) + col(-75, {w: 56})
      + rect(-28, -4, 56, 4, 'f-seed2') + rect(-28, YT - DM, 56, DM - YT - SD, 'pl-ghost') + C(X(0), Y(-16), 11 * k, 'pl-air')
      + rect(47, -4, 22, 4, 'f-seed2') + path([[47, -4], [47, -13], [53, -9], [59, -17], [65, -10], [69, -4]], 'f-cu2') + rect(47, YT - DM, 56, DM - YT - SD, 'pl-ghost');
    case 'pit': return base1 + col(0) + C(X(-12), Y(-135), 5 * k, 'f-hole2') + C(X(20), Y(-125), 4 * k, 'f-hole2') + C(X(-35), Y(-36), 4.5 * k, 'f-hole2') + C(X(46), Y(-100), 9 * k, 'pl-air');
    case 'nodule': return base1 + col(0) + C(X(22), Y(-131), 13 * k, 'f-sn2') + C(X(22), Y(-131), 4 * k, 'p12-seedp') + C(X(41), Y(-34), 9 * k, 'f-cu2') + C(X(41), Y(-34), 3 * k, 'p12-seedp');
    case 'burnt': { const pts = [[-35, YC]]; for (let i = 0; i <= 10; i++) pts.push([-35 + i * 7, i % 2 ? YC - 16 : YC - 4]); pts.push([35, YC]);
      return base1 + col(0, {top: 'cu'}) + path(pts, 'pl-burnt') + C(X(-10), Y(YC - 26), 3 * k, 'pl-burnt') + C(X(18), Y(YC - 30), 2.5 * k, 'pl-burnt') + C(X(4), Y(YC - 22), 2 * k, 'pl-burnt'); }
    case 'lifting': return si(-110, 110) + pad(0) + col(0, {top: 14}) + path([[-62, -4], [-35, -4], [-35, -12], [-62, -6]], 'f-cu2') + path([[62, -4], [35, -4], [35, -12], [62, -6]], 'f-cu2')
      + path([[-110, -4], [-110, -112], [-35, -112], [-35, -14], [-64, -7], [-64, -4]], 'p12-prg') + path([[110, -4], [110, -112], [35, -112], [35, -14], [64, -7], [64, -4]], 'p12-prg');
    case 'prfoot': return base1 + rect(-25, -4, 50, 4, 'f-seed2') + lpath('cu', [[-25, -4], [-25, -10], [-35, -24], [-35, YC], [35, YC], [35, -24], [25, -10], [25, -4]]) + lay('ni', -35, YN, 70, NI) + lay('tc', -35, YT, 70, TC) + lay('sn', -35, YT - 14, 70, 14)
      + path([[-100, -4], [-25, -4], [-25, -10], [-35, -24], [-35, -112], [-100, -112]], 'p12-prg') + path([[100, -4], [25, -4], [25, -10], [35, -24], [35, -112], [100, -112]], 'p12-prg');
    case 'undercut': { const b = -12, yc = b - CU, yn = yc - NI, yt = yn - TC;     // 밑동 시드가 파여 기둥이 12 위에 · Cu 기둥 옆면 조금 · 상부 Cu 띠에 홈
      return base1 + rect(-35, b, 70, 12, 'p12-gap') + rect(-11, -3, 22, 3, 'p12-ti') + rect(-15, b, 30, 9, 'f-seed2') + lay('cu', -33, yc, 66, CU) + lay('ni', -35, yn, 70, NI)
        + lpath('tc', [[-35, yn], [-29, yn - TC / 2], [-35, yt], [35, yt], [29, yn - TC / 2], [35, yn]]) + dome(0, 70, yt); }
    case 'nicrack': return base1 + col(0) + P(`M${X(-35)},${Y(YN + 7)} l${12 * k},${-4 * k} l${10 * k},${7 * k} l${12 * k},${-6 * k} l${10 * k},${5 * k} l${12 * k},${-5 * k}`, 'pl-crack') + rect(4, YC - 1.5, 31, 3, 'f-hole2');
    case 'cuni': return base1 + col(0) + L(X(-35), Y(YN), X(35), Y(YN), 'p12-pass') + path([[36, YN + 0.5], [-18, YN + 0.5], [36, YN - 8]], 'f-hole2') + path([[36, YN + 0.5], [-18, YN + 0.5], [36, YN - 8]], 'p12-gap');
    case 'coreni': {   // 코어 다이: Cu 기둥 없이 시드 위 Ni 몸통 — 가장자리가 들리고 막 속에 균열 (상세 그림만 1.35배로 키움 · 타일은 다른 범프와 같은 지름)
      const z = big ? 1.35 : 1, hw = 35 * z, yt = -SD - CNI * z, e = 11 * z, lf = 9 * z, cx0 = hw - 9;
      return base1 + lay('seed', -hw, -SD, 2 * hw, SD) + lpath('cni', [[-hw, -SD - lf], [-hw + e, -SD - 0.5], [hw - e, -SD - 0.5], [hw, -SD - lf], [hw, yt], [-hw, yt]])
        + path([[-hw, -SD], [-hw + e, -SD], [-hw, -SD - lf]], 'p12-gap') + path([[hw, -SD], [hw - e, -SD], [hw, -SD - lf]], 'p12-gap')
        + P(`M${X(cx0)},${Y(yt)} l${3 * z * k},${7 * z * k} l${-3 * z * k},${6 * z * k} l${3 * z * k},${6 * z * k}`, 'pl-crack') + dome(0, 2 * hw, yt, DM * z) + lab(0, yt - DM * z - 16, ['코어 다이 Ni / SnAg (확대)'], 'middle', 'p12-bl'); }
    case 'agcomp': { let s = base1 + col(0); [[-18, -90], [-6, -88], [6, -91], [18, -89], [-12, -100], [0, -102], [12, -99], [-20, -102], [22, -101], [-6, -112], [6, -113], [0, -122], [-14, -110], [15, -110]].forEach(([x, y]) => { s += C(X(x), Y(y), 2.6 * k, 'p12-agd'); });
      return s + rect(56, -104, 14, 84, 'p12-gauge') + rect(56, -60, 14, 18, 'p12-band') + L(X(50), Y(-88), X(76), Y(-88), 'p12-mark'); }
    case 'nonmelt': { const top = [[-35, YT], [-35, -126], [-22, -130], [-10, -125], [4, -131], [18, -126], [35, -129], [35, YT]];
      return base1 + col(0, {top: 'flat'}) + lpath('sn', top) + path(top.slice(0, -1), 'p12-ox', false); }
    case 'ag3sn': return base1 + col(0) + PG([[X(-24), Y(-83)], [X(-17), Y(-85)], [X(17), Y(-122)], [X(10), Y(-120)]], 'pl-ag3') + PG([[X(8), Y(-83)], [X(12), Y(-84)], [X(26), Y(-101)], [X(22), Y(-100)]], 'pl-ag3')
      + P(`M${X(12)},${Y(-121)} L${X(19)},${Y(-127)}`, 'pl-crack');
    case 'bridge': return si(-115, 115) + pad(-50, 80) + pad(50, 80) + col(-50, {top: 'flat'}) + col(50, {top: 'flat'})
      + P(`M${X(-85)},${Y(YT)} L${X(-85)},${Y(-116)} C${X(-104)},${Y(-118)} ${X(-104)},${Y(-148)} ${X(-60)},${Y(-150)} L${X(60)},${Y(-150)} C${X(104)},${Y(-148)} ${X(104)},${Y(-118)} ${X(85)},${Y(-116)} L${X(85)},${Y(YT)} L${X(15)},${Y(YT)} L${X(15)},${Y(-116)} L${X(-15)},${Y(-116)} L${X(-15)},${Y(YT)} Z`, 'f-sn2', tp('sn'))
      + L(X(-115), Y(-116), X(115), Y(-116), 's-dash') + rect(-15, -3, 30, 3, 'p12-res');
    default: return base1 + col(0);
  }
}
// 상세 그림의 지시선 [x, y, 글] (bump 로컬 좌표). 없는 장(정상 · 윗면 모양 · 상부 Cu 두께)은 그림이 가운데에 서고 글을 그림 속에 단다
const NOTE = {
  height: [[104, -150, 'Δh — 높이 차이']],
  void: [[15, -118, '③ 솔더 속\n리플로우 뒤'], [29, YN, '② 층 사이 계면\n(Ni/상부 Cu)'], [20, -14, '① 바닥 기포\n도금 직후']],
  missing: [[0, -60, '안 쌓임\n기포 · 찌꺼기'], [58, -14, '떨어짐\n밑동 흔적']], pit: [[20, -125, '피트 (기포 자리)'], [46, -100, '붙은 기포']],
  nodule: [[22, -131, '혹 속 씨앗 입자'], [41, -34, '옆면 혹']], burnt: [[0, YC - 12, '어둡고 거친 가루\n(Cu 기둥 도금 중)']],
  lifting: [[72, -60, 'PR (도금 중 · 들뜸)'], [50, -7, '밑동 둘레 얇은 치마']], prfoot: [[68, -60, 'PR (도금 중)'], [30, -12, 'PR 발 → 홈 (노치)']],
  undercut: [[31, -83.5, '상부 Cu 옆 홈\n(베이스 다이)'], [-26, -6, '시드(Cu · Ti)가\n안쪽으로 파임']], nicrack: [[20, -63, 'Ni 갈라짐'], [24, YC, 'Cu 기둥/Ni 박리']],
  cuni: [[30, YN - 4, 'Ni/상부 Cu\n계면 틈'], [-26, YN, 'Ni 표면 산화막\n(부동태)']], coreni: [[38.5, -26, 'Ni 몸통 균열\n(당기는 응력)'], [44, -8, '시드에서 들뜸\n(가장자리)']],
  agcomp: [[70, -88, 'Ag % 계기 — 목표 밖'], [30, -100, 'Ag가 많은 솔더']], nonmelt: [[4, -131, '원기둥 그대로 · 쭈글쭈글'], [35, -104, '표면 산화막']],
  ag3sn: [[13, -118, '굵은 Ag₃Sn 판\n→ 균열 길']], bridge: [[0, -150, '버섯 머리가 붙음'], [110, -116, 'PR 높이'], [0, -2, '남은 시드 (안 보임)']]
};

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '12', id: 'defects', part: 3, short: '불량 도감', scale: '범프 단면 · µm',
  title: '불량 도감 — 이 불량은 어디서 왔을까?',
  hook: '언제 · 어디서 · 어떤 모양',
  one: '불량이 처음 보인 단계, 생김새(단면 · 표면), 위치(웨이퍼 맵 무늬)가 원인 후보를 좁혀 줍니다. 원인은 도금만이 아니므로 도금-장비 · 도금-액 · 도금-조건 · 앞 공정 · 뒤 공정으로 나눠서 봅니다. 그림은 베이스 다이 범프(Cu 기둥 / Ni / 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu) / SnAg)가 기준이고, 코어 다이(Ni / SnAg)에서 다른 점은 따로 짚습니다.',
  ana: '<b>의사의 진찰</b> — 언제부터(처음 보인 단계), 어떤 증상이(생김새), 어디가 아픈지(맵 무늬)를 듣고 후보 질환을 몇 개로 좁힌 뒤 검사(단면 · 분석 · 로그)로 확인합니다. 한 번에 확진하려 하지 않습니다. 한계: 우리는 환자 한 명이 아니라 같은 증상의 웨이퍼들이 무엇을 함께 겪었는지(공통점)를 봅니다.',
  steps: [
    {id: 'size', t: '높이 · 두께 · 모양', d: '높이 산포는 웨이퍼 · 다이 · 범프 세 크기에서 봅니다. 맵 무늬와 모니터 웨이퍼로 장비 원인과 앞 공정 원인을 먼저 나눕니다. 윗면 모양은 첨가제 · 흐름 · PR 벽을, 베이스 다이의 얇은 상부 Cu는 두께가 리플로우 뒤 IMC를 바꾸니 따로 봅니다.'},
    {id: 'hole', t: '빈자리 — 보이드 · 누락 · 핀홀', d: '보이드는 "어디에, 언제" 생겼는지로 나눕니다. 누락은 처음부터 안 쌓였는지(기포 · PR 찌꺼기), 쌓였다 떨어졌는지(PR 제거 · 식각 중 탈락)부터 가릅니다. 핀홀은 기포가 붙어 있던 자리입니다.'},
    {id: 'surf', t: '표면 — 노듈 · 탄 도금', d: '혹(노듈)은 잘라서 가운데 씨앗 입자의 성분(SEM-EDS)부터 봅니다. 탄 도금은 불이 아니라 전류가 한계를 넘은 흔적입니다. 실제 열린 면적으로 전류밀도를 다시 계산합니다.'},
    {id: 'intf', t: '계면과 밑동', d: 'PR 들뜸은 밑동 둘레에 치마를, PR 발은 좁은 밑동과 홈을 남기고, 언더컷은 시드 식각(뒤 공정) 몫입니다. 층 사이 박리는 어느 계면인지가 핵심 — Ni 위 계면(베이스 Ni/상부 Cu · 코어 Ni/SnAg)은 Ni 부동태를, 코어는 시드 위 Ni 몸통의 밀착 · 응력도 봅니다.'},
    {id: 'melt', t: '녹인 뒤 — 조성 · 비용융 · Ag₃Sn · 브리지', d: '주로 리플로우 뒤에 드러나는 불량입니다. Ag 조성은 도금 직후 XRF로 먼저 잡을 수 있습니다. 비용융은 리플로우 온도 · 산화막부터 보고, Ag 과다는 조성이 벗어났을 때 의심합니다. 브리지는 오버 도금과 눈에 안 보이는 시드 잔여까지 봅니다.'}
  ],
  icon(K){
    const {R, P, E} = K;
    return R(20, 38, 26, 22, 'f-cu2') + R(20, 34, 26, 4, 'f-ni') + R(20, 30, 26, 4, 'f-cu2') + P('M20,30 C20,13 46,13 46,30 Z', 'f-sn2') + E(30, 23, 4, 3, 'f-hole2') + P('M50,8 L62,20 M62,8 L50,20', 's-arrr');
  },
  draw(K){
    const {R, L, T, G, LB, tip} = K;
    let s = '';
    DEF.forEach((d, i) => {
      const {x, y} = tilePos(i), cs = cats(d);
      let g = R(x, y, TW, TH, 'pl-tile2', {rx: 14}) + T(x + 14, y + 29, `${String(i).padStart(2, '0')} ${d.sn || d.nm}`, 't-sub', 'start');
      g += bump(K, d.id, x + TW / 2, y + 140, TK);
      // 꼬리표 다섯 칸: 해당하는 칸만 색 (정상 타일은 그 자리에 다이 이름)
      if (d.c.length) CATS.forEach((c, j) => { const on = cs.includes(c), px = x + 12 + j * 45.4; g += R(px, y + TH - 28, 41, 24, 'p12-tg ' + (on ? c : 'off'), {rx: 6}) + T(px + 20.5, y + TH - 10, TS[c], 'p12-tgt' + (on ? '' : ' off')); });
      else g += T(x + TW / 2 - 55 * TK, y + TH - 10, '코어', 'p12-die') + T(x + TW / 2 + 45 * TK, y + TH - 10, '베이스', 'p12-die');
      g += R(x, y, TW, TH, 'pl-pick', {rx: 14});
      s += G(g, {class: 'pl-def', 'data-def': d.id, 'data-tip': `${d.nm} — ${d.def}` + (d.st.length ? `\n처음 보이는 단계: ${d.st.map(k => STG[k]).join(' · ')}` : '') + (cs.length ? `\n원인 꼬리표: ${cs.map(c => TAG[c]).join(' · ')}` : '')});
    });
    // 꼬리표 범례 (마지막 칸): 앞의 셋 = 도금 인자, 뒤의 둘 = 비도금 인자
    const {x: lx, y: ly} = tilePos(DEF.length);
    let lg = R(lx, ly, TW, TH, 'p12-lgbox', {rx: 14}) + T(lx + 14, ly + 29, '원인 꼬리표', 'p12-lgt', 'start');
    CATS.forEach((c, j) => { const yy = ly + 44 + j * 28; lg += R(lx + 14, yy, 41, 24, 'p12-tg ' + c, {rx: 6}) + T(lx + 34.5, yy + 18, TS[c], 'p12-tgt') + T(lx + 63, yy + 18, TAG[c], 'p12-lgn', 'start'); });
    lg += L(lx + 170, ly + 46, lx + 170, ly + 122, 'p12-brk') + K.TT(lx + 180, ly + 80, ['도금', '인자'], 'p12-lgs', 'start', 18)
      + L(lx + 170, ly + 130, lx + 170, ly + 178, 'p12-brk') + K.TT(lx + 180, ly + 150, ['비도금', '인자'], 'p12-lgs', 'start', 18);
    s += LB(lg, tip('도금 인자: 도금-장비 · 도금-액 · 도금-조건\n비도금 인자: 앞 공정 · 뒤 공정\n원인을 나누면 누구와 상의할지가 바로 보인다'));
    s += R(1078, GY, 502, PY - GY, 'pl-panel', {rx: 16}) + `<g data-v="detail"></g>`;
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
      let s = R(DX0, 124, DX1 - DX0, 212, 'pl-lane', {rx: 12});
      const cx = NOTE[d.id] ? 1218 : 1330, base = 298;
      s += bump(K, d.id, cx, base, 1, true);
      const ns = (NOTE[d.id] || []).slice().sort((a, b) => a[1] - b[1]);
      ns.forEach(([lx, ly, tx], j) => {
        const px = cx + lx, py = base + ly, ty = ns.length === 1 ? Math.max(158, Math.min(312, py + 6)) : 168 + j * (130 / Math.max(1, ns.length - 1));
        s += LB(L(px, py, 1360, ty - 6, 's-lead') + C(px, py, 3.5, 'k-lead') + K.TT(1368, ty, tx.split('\n').flatMap(t => wrap(t, 10.8)), 'p12-note', 'start', 21));
      });
      let y = 374;
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
      const room = PY - 8 - y;
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
      else if (d.f || best.kl.length < d.k.length) s += T(DX1, Math.min(PY - 4, y + 4), '… 나머지는 카드의 「직접 해 보기」에', 'p12-more', 'end');
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
      ['DOE (실험 계획)', '조건 몇 개를 계획적으로 바꿔 원인과 효과를 확인하는 작은 실험'],
      ['상부 Cu', 'Ni 위에 얇게 한 번 더 올린 Cu (베이스 다이, 예시 3 µm). 솔더가 처음 만나는 면 — 리플로우 · 본딩의 열 이력 동안 조금씩 Cu₆Sn₅로 바뀌고, 다 쓰이면 Ni 위 (Cu,Ni)₆Sn₅로 안정된다. 아래쪽 두꺼운 Cu는 Cu 기둥'],
      ['부동태 (Ni)', 'Ni 표면에 공기 · 물에서 금방 생기는 아주 얇은 산화막. 그 위에 올리는 층(상부 Cu · SnAg)의 밀착을 떨어뜨릴 수 있다']
    ]) + K.field([
      '먼저 <b>어느 다이의 웨이퍼인지</b> 적습니다. 베이스 다이(Cu 기둥 / Ni / 상부 Cu / SnAg)는 서로 다른 금속이 만나는 계면이 셋(Cu 기둥/Ni · Ni/상부 Cu · 상부 Cu/SnAg), 코어 다이(Ni / SnAg)는 둘(시드/Ni · Ni/SnAg)입니다. 같은 "박리"라도 볼 계면과 원인 후보가 다릅니다.',
      '첫 질문 두 개: <b>어디서 처음 보였나</b>, <b>어디에 있나</b>. 같은 누락도 도금 직후에 처음 보이면 기포 · PR 찌꺼기, PR 제거 뒤에 처음 보이면 탈락입니다.',
      '맵 무늬 읽기 (회전 셀): <b>고리</b> → 셀에 고정된 부품(실드 · 고저항판 · 양극(애노드)), <b>부채꼴 · 한쪽</b> → 웨이퍼와 함께 도는 것(콘택트 · 립씰 · 앉음새)이나 앞 공정 맵의 치우침(앞 공정 맵 자체는 보통 고리), <b>다이 · 샷 반복</b> → 패턴 · 노광, <b>직선 줄무늬</b> → 노광 · PR 도포 · 패들 · 기포, <b>무작위</b> → 입자 · 기포 (<a data-go="wafer.map">07장</a>).',
      '패턴 없는 모니터(블랭킷) 웨이퍼의 두께 맵을 따로 재면 패턴 · 앞 공정 효과를 빼고 장비 상태만 볼 수 있습니다. 높이 산포를 장비 쪽과 제품 쪽으로 나누는 가장 기본적인 실험입니다.',
      '확인 방법의 첫 줄은 늘 <b>공통점 찾기</b>입니다(8D의 D4 근본 원인 분석). 원인을 [도금-장비] · [도금-액] · [도금-조건] · [앞 공정] · [뒤 공정]으로 나누면 누구와 상의할지 바로 보입니다 (<a href="#go-edu-5">05 제조기술의 기초 — 8D</a> · <a href="#go-edu-2">02 자주 부딪히는 업무 상황</a>).',
      '측정도 산포를 만듭니다. 측정 장비 · 측정 위치 정의(중심 vs 최고점) · 리플로우 전후가 다르면 숫자가 달라지니, 불량 판정 전에 측정부터 확인합니다.',
      '판정이 끝나면 증상 → 확인 → 원인 → 대책을 <a href="#go-map">업무 알고리즘 맵</a>으로 남겨 두면 다음 사람이 같은 길을 빨리 갑니다.'
    ]) + K.deep(`<p><b>무엇으로 재나</b></p>
      <table class="pl-tb p12-tb"><tr><th>보는 것</th><th>측정</th><th>주의</th></tr>
      <tr><td>범프 높이</td><td>광학 (레이저 삼각측량 · 공초점 · 백색광 간섭)</td><td>무광 SnAg 면에서 흔들릴 수 있음</td></tr>
      <tr><td>두께 · Ag&nbsp;%</td><td>XRF</td><td>측정 점이 범프만 하거나 커서 전용 패턴에서 잼 · Cu가 두 층(베이스)이면 층별로 가르기 어려울 수 있음</td></tr>
      <tr><td>솔더 속 보이드</td><td>X-ray</td><td>수 µm 보이드는 놓치기 쉬움 → 단면</td></tr>
      <tr><td>계면 · IMC · Ni · 상부 Cu 잔량</td><td>단면 SEM · FIB + SEM-EDS</td><td>파괴 분석, 위치 선정이 중요</td></tr>
      <tr><td>접합 강도</td><td>전단 시험</td><td>끊어진 면: 솔더 속 = 정상, 계면 = 의심</td></tr>
      <tr><td>누락 · 브리지 · 이물</td><td>외관 검사 (AOI)</td><td>시드 잔여 단락은 안 보일 수 있음 → 누설 시험</td></tr>
      <tr><td>도금 전 시드</td><td>4탐침 면저항</td><td>두께 맵 → 언더컷 · 터미널 효과와 연결</td></tr></table>
      <ul><li><b>보이드의 네 얼굴</b> — ① 도금 직후 바닥(기포) ② 층 사이 계면(산화 · 헹굼 · 대기) ③ 리플로우 뒤 솔더 속(유기물 가스 · 플럭스) ④ 고온 시험 뒤 계면(IMC 성장 · 커켄달). 도금 직후 단면과 열처리 뒤 단면을 함께 봅니다.</li>
      <li><b>비용융 판정</b> — 겉모양만으로 산화막 · 온도 부족 · Ag 과다를 가르기 어렵습니다. 같은 웨이퍼를 나눠 리플로우 조건 · 표면 처리만 바꿔 보는 교차 실험이 빠릅니다. 수십 nm 산화막만으로도 녹은 솔더가 둥글어지지 못할 수 있습니다.</li>
      <li><b>노화된 SnAg 액</b> — Sn²⁺가 산화되어 생긴 SnO₂ 미세 입자가 막에 섞이면 노듈과 리플로우 불량(무너짐 · 젖음 불량)이 함께 늘어납니다. 그래서 액 나이(Ah)를 공통점 분석에 넣습니다 (<a data-go="bath.byp">11장</a>).</li>
      <li><b>언더컷과 갈바닉</b> — 시드 식각액 속에서 서로 다른 금속이 전기적으로 이어져 있으면 한쪽이 더 빨리 녹습니다. HF로 Ti를 지운 공개 특허 사례(큰 범프 · 예전 공정)에는 언더컷이 범프 밑으로 약 10 µm까지 들어가 범프가 들뜬 예가 소개됩니다. 언더컷과 갈바닉은 <a href="#go-etch-04">시드 식각 04장</a> · <a href="#go-etch-05">05장</a>에서 자세히 다룹니다.</li>
      <li><b>높이 산포 → 동일평면성</b> — 리플로우하면 솔더가 둥글어지므로 높이보다 솔더 부피가 같아야 합니다. 다이 안 최고–최저 차이가 크면 적층 본딩 때 낮은 범프가 닿지 않아 접합 누락이 생깁니다. 도금 직후 높이와 리플로우 뒤 높이를 나눠 기록합니다.</li>
      <li><b>IMC는 다이마다 다르다</b> — 베이스 다이는 솔더가 상부 Cu 위에 Cu₆Sn₅(+ 얇은 Cu₃Sn)를 만들고, 상부 Cu가 다 쓰이면 Ni 위 (Cu,Ni)₆Sn₅로 안정됩니다(아래 Cu 기둥의 공급은 Ni가 막음). 코어 다이는 Ni 위에 Ni₃Sn₄(상대 쪽 Cu가 들어오면 (Cu,Ni)₆Sn₅)가 자라며 Ni를 조금씩 먹습니다. 여러 층을 쌓으며 열을 여러 번 받으면(먼저 쌓인 아래쪽 다이일수록 열 이력이 많을 수 있음) IMC가 더 자라므로, 코어 다이 Ni 두께(예시 5 µm)는 보통 모든 열 이력 뒤에도 남을 만큼으로 잡습니다. Ni₃Sn₄는 Cu₆Sn₅보다 잘 깨지는 편이라는 보고가 많습니다.</li>
      <li><b>상부 Cu 두께의 계산 감</b> — 6Cu + 5Sn → Cu₆Sn₅에서 Cu 3 µm는 Sn 약 5.7 µm와 반응합니다(몰 부피 Cu 7.1 · Sn 16.3 cm³/mol). SnAg 12 µm면 다 쓰일 수 있는 양입니다. 얇은 Cu를 솔더가 다 쓰도록 설계한 Cu/Ni/Cu/SnAg 마이크로범프가 고온 보관에서 계면 보이드가 거의 없었다는 공개 연구가 있습니다. 그래서 상부 Cu는 목표 두께만큼 <b>산포</b>도 중요합니다 — 두꺼운 쪽은 Cu가 남아 Cu₃Sn · 커켄달 보이드 쪽으로, 얇은 쪽은 상부 Cu가 너무 일찍 다 쓰여 Ni 소모가 일찍 시작됩니다(다 쓰이는 것 자체는 설계 목표입니다).</li>
      <li><b>Ni → 상부 Cu 사이</b> — 베이스 다이는 Cu 액을 두 번(Cu 기둥 · 상부 Cu) 씁니다. 보통 한 장비의 여러 셀을 헹굼만 거쳐 마르지 않게 옮기는데, Ni 표면은 금방 부동태가 되므로 헹굼 뒤 지체 없이 · 필요하면 산 담금(활성화)을 거칩니다. 장비가 멈춰 셀 사이에서 오래 기다린 웨이퍼를 따로 표시해 두면 「상부 Cu 들뜸」의 공통점 찾기가 빨라집니다.</li></ul>`);
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
.pl-svg .p12-lgbox{fill:rgba(10,20,38,.45);stroke:rgba(148,163,184,.28);stroke-width:1.2;stroke-dasharray:6 5}
.pl-svg .p12-lgn{font-size:17px;fill:#cbd5e1 !important}
.pl-svg .p12-lgs{font-size:15px;font-weight:700;fill:#94a3b8 !important}
.pl-svg .p12-brk{fill:none;stroke:#64748b;stroke-width:1.6}
.pl-svg .p12-die{font-size:16px;font-weight:700;fill:#94a3b8 !important;text-anchor:middle}
.pl-svg .p12-bl{font-size:17px;font-weight:800;fill:#f1f5f9 !important}
.pl-svg .p12-pass{fill:none;stroke:#7dd3fc;stroke-width:2.4;stroke-dasharray:4 3}
.pl-svg .p12-ni34{stroke:#2f2116;stroke-width:1.2}
.pl-svg .p12-ni0{fill:none;stroke:#cbd5e1;stroke-width:1.2;stroke-dasharray:4 3;opacity:.85}
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
