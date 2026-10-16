/* 리플로우 09 — 불량 도감: 이 불량은 어디서 왔고, 무엇을 바꿀까? (범프 · 웨이퍼 맵)
   타일 그림은 베이스 다이 범프(Cu 기둥 / Ni / 상부 Cu / SnAg). 코어 다이(Ni / SnAg)와 다른 점은 글(원인 · 생김새)에서 짚는다 */
(function(){
const q = v => Math.round(v * 10) / 10;
// 원인 꼬리표: 리플로우 인자 셋(이 공정에서 바꿀 수 있는 것) + 앞뒤 공정 둘(받은 것 · 넘긴 것)
const CATS = ['eq', 'atm', 'cond', 'up', 'dn'];
const TAG = {eq: '리플로우-장비', atm: '리플로우-분위기', cond: '리플로우-조건', up: '앞 공정', dn: '뒤 공정'};
const TS = {eq: '장비', atm: '분위기', cond: '조건', up: '앞', dn: '뒤'};          // 타일 · 상자 꼬리표 (짧게)
const TD = {eq: '장비', atm: '분위기', cond: '조건', up: '앞 공정', dn: '뒤 공정'};  // 상세 꼬리표
const TGW = {eq: 42, atm: 58, cond: 42, up: 34, dn: 34};                         // 타일 꼬리표 칸 폭
const MINE = new Set(['eq', 'atm', 'cond']);
// 처음 보이는 단계 (그 검사에서 처음 검출)
const STG = ['리플로우 직후 외관', '높이 · 3D 측정', 'X-ray · 단면', '적층 · 본딩 뒤', '신뢰성 시험 뒤'];
const STS = ['외관', '높이', '단면', '본딩 뒤', '신뢰성'];                                  // 타일 둘째 줄
const STB = ['리플로우 직후', '높이 · 3D 측정', 'X-ray · 단면', '적층 · 본딩 뒤', '신뢰성 시험 뒤'];   // 상세 칸
const COMMON = '공통점 찾기 — 장비 · 판 · 챔버 · 슬롯 · 도금 장비 · 액 나이 · 대기 시간';
// 맵 무늬 6가지 (map 단계의 웨이퍼 순서)
const MAPS = [
  {nm: '가장자리 고리', ds: '판 틈 · 휨(가장자리 들림) · 가장자리 열 손실 → 덜 녹음 · 변색. 가운데가 들린 휨이면 가운데(점선 원)',
    tp: '가장자리 고리 — 판 방식에서 가장자리가 들린 휨 · 핀 높이 · 판 틈이 크면 가장자리가 늦게 데워져 덜 녹는다.\n가운데가 들린(돔 모양) 휨이면 거꾸로 가운데가 늦다 (점선 원).'},
  {nm: '한쪽 치우침', ds: '기체 흐름 · 판 기울기 · 이송 방향', tp: '한쪽 치우침 — 기체가 들어오는 쪽 · 판이 기운 쪽 · 웨이퍼가 들어가는 방향과 맞춰 본다'},
  {nm: '문 쪽 · 첫 장', ds: '산소 · 퍼지 부족 → 변색 · 덜 둥긂', tp: '문 쪽 · 첫 장 — 문을 연 뒤 산소가 덜 빠진 쪽, 장비가 쉬고 난 뒤 첫 웨이퍼들'},
  {nm: '다이 반복', ds: '솔더 부피 · 패턴 밀도 → 높이 · 브리지', tp: '다이마다 같은 자리 — 패턴(빽빽한 곳 · 고립 범프)과 솔더 부피(도금)를 먼저 본다'},
  {nm: '무작위 점', ds: '찌꺼기 낙하 · 입자 · 튐', tp: '흩어진 점 — 챔버 · 배기에서 떨어진 찌꺼기, 입자, 튄 솔더'},
  {nm: '도금 맵과 같은 고리', ds: '앞 공정(높이 · Ag %) — 도금 맵과 겹쳐 보기', tp: '도금 높이 · Ag % 맵과 같은 동심 무늬 — 리플로우 전 높이 맵에 이미 있으면 도금(앞 공정) 쪽'}
];
// 불량 타일: id · 이름 nm · 타일 이름 sn · 생김새 def · 처음 보이는 단계 st(STG 번호) · 맵 무늬 map · 맵 그림 pm(MAPS 번호) · 이어진 결과 out(OUTS) · 원인 후보 c [꼬리표, 글] · 확인 k · 대책 f
const DEF = [
  {id: 'normal', nm: '정상', sn: '정상', def: '매끈하고 광택 있는 돔, 맨 위 금속(베이스 상부 Cu · 코어 Ni) 위 얇은 IMC, 속에 보이드 없음', st: [], map: '비교 기준 · 같은 lot의 정상 범프를 늘 함께 본다', pm: [], out: [],
    c: [], k: ['외관 · 광택 → 광학 검사', '돔 높이 · 동일평면성 → 3D 측정(공초점 · 백색광 간섭)', '보이드 → X-ray (수 µm는 단면 · FIB)', 'IMC · 결정 · Ag₃Sn → 단면 SEM · SEM-EDS · EBSD', '접합 강도 → 전단 시험'], f: ''},
  {id: 'nonmelt', nm: '비용융처럼 보임', sn: '덜 둥긂', def: '원기둥 모양 그대로이거나 쭈글쭈글하고 흐린 돔', st: [0, 1],
    map: '가장자리 고리(온도 부족 · 휨, 가운데가 들린 휨이면 가운데) / 무작위 · lot 전체(산화막 · 대기 시간) / 장비 정지 뒤 첫 웨이퍼들', pm: [0, 2, 4], out: ['wet'],
    c: [['cond', '최고 온도 · 액상선 위 시간 부족 — 가장 차가운 곳(가장자리 · 휜 웨이퍼의 틈 큰 쪽)'], ['atm', '산소 높음 · 포름산 · 플럭스 부족 · 플럭스 지침(예열 김)'],
      ['up', '두꺼운 산화막 — 긴 대기 시간 · 건조 불량 얼룩 · 플라즈마 처리 뒤 오래 둠'], ['up', '전처리 플라즈마 기체 · 레시피 — O₂ 위주면 산화막이 오히려 늘어남 (03장)'],
      ['up', '막 속 유기물 · 산화주석 입자(노화된 SnAg 액) · Ag가 크게 벗어남 (전해도금 12장)']],
    k: [COMMON, '측정용 웨이퍼로 가운데 · 가장자리 실제 프로파일', '산소 ppm · 포름산 공급 · 플럭스 두께 로그', '표면 산화막(XPS · 오제) · 대기 시간 이력', 'Ag %(XRF) · DSC로 실제 녹는 온도'],
    f: '프로파일 여유 · 분위기 · 환원 조정, 대기 시간 관리, 앞 공정 표면(헹굼 · 건조) 확인'},
  {id: 'dewet', nm: '디웨팅 · 덜 덮임', sn: '디웨팅', def: '솔더가 맨 위 금속(베이스 상부 Cu · 코어 Ni) 윗면 일부에서 물러나 바닥이 드러나거나, 공처럼 뭉쳐 있다', st: [0, 2],
    map: '무작위 · 특정 lot / 도금 층 사이 대기 시간이 긴 웨이퍼 · 셀', pm: [4], out: ['wet'],
    c: [['up', '맨 위 금속 표면 산화 — 상부 Cu(코어는 Ni, 부동태가 더 단단함) 도금 → SnAg 도금 사이 대기 · 헹굼 (전해도금 12장)'], ['up', '솔더 양이 적음(얇은 SnAg) — 젖음이 조금만 나빠도 다 덮지 못함 (04장)'],
      ['cond', '액상선 위 시간이 길수록 약한 계면에서 솔더가 더 물러나 드러난 자리가 커짐']],
    k: [COMMON, '드러난 바닥 표면 SEM-EDS(산소 · 탄소)', '단면에서 IMC가 끊긴 곳', 'SnAg 두께 맵 · 상부 Cu(코어 Ni) → SnAg 대기 시간', '비용융(덜 둥긂)과 구분 — 바닥 금속이 드러났는가 (분위기 · 환원은 솔더 겉 산화막만 바꿈)'],
    f: '도금 층 사이 시간 · 헹굼 관리(Ni 부동태), 솔더 부피 확인 — 환원 분위기로는 SnAg 밑에 묻힌 계면을 고치지 못한다 (04장)'},
  {id: 'wick', nm: '옆면 흘러내림', sn: '흘러내림', def: '솔더가 상부 Cu 옆면을 지나 Ni · Cu 기둥 옆면까지 타고 내려가 돔이 낮아지고, 기둥 옆에 IMC가 생겼다 (코어 다이는 Ni 옆면)', st: [1, 2],
    map: '웨이퍼 전체(분위기 · 플럭스) / 솔더가 많은 곳(도금 맵과 겹침)', pm: [5], out: ['wick', 'shape'],
    c: [['atm', '강한 환원(플럭스 양 · 포름산)이 옆면 산화막까지 걷음'], ['cond', '긴 액상선 위 시간 · 높은 최고 온도'],
      ['up', '솔더 부피 과다 · 시드 식각 언더컷으로 드러난 옆면 · 옆면이 깨끗한 채로 넘어옴'],
      ['up', '베이스 다이: 스트립 · 시드 식각에서 파인 상부 Cu 홈(노치) — 솔더가 홈을 메우며 Ni 옆면을 바로 만남 (시드 식각 09장)'], ['dn', '열압착(TC) 본딩 때 눌려 더 흘러내림']],
    k: [COMMON, '리플로우 전후 높이 차', '단면 SEM-EDS — 옆면 IMC · Cu 섞임', '단면 — 상부 Cu 홈 · 가장자리 계면 (베이스 다이)', '솔더 부피(도금 두께 · 지름)'],
    f: '환원 세기 · 액상선 위 시간 조정, 솔더 부피 · 옆면 상태(언더컷) 관리'},
  {id: 'bridge', nm: '브리지 · 솔더 튐', sn: '브리지 · 튐', def: '이웃 범프의 솔더가 이어져 붙었거나(단락), 범프 옆 바닥에 작은 솔더 알갱이가 흩어져 있다', st: [0, 3],
    map: '솔더가 많은 곳 · 좁은 피치 영역 / 튄 솔더 · 찌꺼기 자리(무작위) / 진공 단계 · 빠른 승온 레시피의 lot', pm: [3, 4, 5], out: ['wick', 'surf'],
    c: [['up', '솔더 부피 과다(오버 도금) · 시드 잔여(시드 식각)'], ['atm', '흘러내림 + 좁은 피치 · 플럭스 과다 · 물기'], ['cond', '진공을 급하게 · 승온이 빨라 플럭스 용제가 끓어 솔더가 튐'],
      ['up', '솔더 속 유기물 · 기포가 터지며 튐'], ['dn', '본딩 때 눌림 · 넘침']],
    k: [COMMON, 'AOI(자동 광학 검사) · 전기 누설 시험', '시드 잔여 SEM-EDS (시드 식각 9장)', '튄 솔더 알갱이 위치 · 크기 · 개수', '승온 · 진공 기울기 로그'],
    f: '솔더 부피 · 피치 여유, 진공 · 승온 기울기 완화, 예열로 용제 날리기, 시드 식각 확인'},
  {id: 'void', nm: '보이드', sn: '보이드', def: '솔더 속 둥근 빈 구멍(수 µm), 주로 바닥 계면(IMC)에 붙어 있다', st: [2, 4],
    map: '무작위 / 도금액 나이 · lot과 함께 / 도금 층 사이 대기 시간과 함께 / 플럭스 양과 함께', pm: [4], out: ['void'],
    c: [['up', '층 사이 · 계면 찌꺼기(SnAg 전 대기 · 헹굼, 스트립 · 식각 찌꺼기) — 기포가 붙을 자리 (전해도금 12장)'], ['up', '막 속 유기물(액 나이) — 기체 출처'],
      ['cond', '액상선 위 시간 짧음 · 예열 짧음(용제 남음)'], ['atm', '플럭스 기체 · 분해물 — 겉에서 생겨 대부분 빠짐'], ['eq', '진공 — 수 µm 기포에는 효과 작음 (07장)'], ['dn', '고온 시험 뒤 커켄달 보이드 — Ni 없는 두꺼운 Cu 쪽 (베이스 상부 Cu는 다 쓰이면 줄어듦, 07장)']],
    k: [COMMON, '단면 · FIB · 3D X-ray (2D X-ray는 수 µm를 놓치기 쉬움)', '보이드 자리 기록 — 바닥 계면 · 솔더 속 · 겉 가까이 (07장)', '솔더 속 탄소 · 황 분석, 액 나이 추세', '도금 층 사이 대기 시간 · 액상선 위 시간 로그'],
    f: '기체 출처 먼저(도금 층 사이 · 액 관리 · 플럭스 양), 그다음 액상선 위 시간 · 예열 · 진공'},
  {id: 'height', nm: '높이 · 동일평면성 이상', sn: '높이 산포', def: '다이 안 · 웨이퍼 안 돔 꼭대기 높이가 고르지 않다 (동일평면성 = 꼭대기가 한 평면에 고른 정도)', st: [1, 3],
    map: '고리(도금 두께 · 리플로우 온도) / 다이 반복(패턴 · 개구율) / 한쪽(판 기울기 · 휨)', pm: [0, 1, 3, 5], out: ['shape'],
    c: [['up', '솔더 부피 산포(도금 두께 · 지름) — 돔 높이는 부피가 정함 (04장). 그 아래 도금 높이(베이스 Cu 기둥 · Ni · 상부 Cu, 코어 Ni)의 산포도 더해짐'], ['cond', '가장자리 덜 녹음 · 흘러내림 정도 차이'], ['eq', '판 기울기 · 핀 높이 차 · 휨'], ['dn', '측정 정의(꼭대기 · 평균) · 측정 장비 차']],
    k: [COMMON, '리플로우 전후 높이 맵 겹쳐 보기', '도금 높이 · XRF 두께 맵', '가운데 · 가장자리 실제 프로파일'],
    f: '앞 공정 부피 산포 개선, 프로파일 여유 · 휨 관리, 측정 정의 통일'},
  {id: 'ag3sn', nm: '굵은 Ag₃Sn 판', sn: 'Ag₃Sn 판', def: '솔더 속에 길고 굵은 Ag₃Sn 판이 범프를 가로지른다 — 균열이 지나가는 길', st: [2, 4],
    map: 'Ag %가 높은 곳(전류밀도가 낮은 곳 — 보통 웨이퍼 중심 쪽 · 빽빽한 패턴 · 특정 셀, XRF 맵으로 확인)과 겹침 / 냉각이 느린 구역', pm: [5], out: ['micro'],
    c: [['up', 'Ag % 높음(도금 조건 · 액 Ag 농도) — 작은 범프는 목표 범위 위쪽(2.5 % 근처)이어도 여러 번 녹여 Sn이 IMC로 빠지면 큰 판이 보고됨 (06장)'], ['cond', '느린 냉각 · 긴 액상선 위 시간 · 재작업으로 여러 번 녹임'],
      ['dn', '본딩에서 다시 녹음(코어 적층 · 베이스 → 인터포저) → 위 · 아래 계면으로 Sn이 빠져 Ag가 진해짐, Sn을 더 먹는 베이스 다이가 보통 더 빠름 (05장)']],
    k: [COMMON, '단면 SEM — 판 길이 · 방향', 'Ag %(XRF) 맵과 겹쳐 보기', '냉각 속도 · 녹인 횟수'],
    f: 'Ag 목표를 공정점(共晶)보다 충분히 낮게(작은 범프일수록 범위 낮은 쪽), 녹이는 횟수 · 액상선 위 시간 관리, 냉각 관리'},
  {id: 'imc', nm: 'IMC 과다 · 금속 소모', sn: 'IMC 과다', def: 'IMC가 두껍게 자라 아래 금속이 줄었다 — 코어 다이는 Ni가 얇아짐. 베이스 다이는 상부 Cu가 다 쓰이는 것까지는 설계대로(Ni 위 (Cu,Ni)₆Sn₅로 안정, Ni는 거의 그대로 — 05장)이고, 열 이력이 넘쳐 IMC가 솔더를 많이 먹고 두꺼워지면 과다 / IMC 조각이 솔더 속으로 떨어져 나감(스폴링)', st: [2, 4],
    map: '뜨거운 구역 · 여러 번 리플로우 · 재작업한 lot', pm: [], out: ['imc'],
    c: [['cond', '최고 온도 · 액상선 위 시간 과다 · 리플로우 반복 · 재작업'], ['up', '코어 다이: Ni 얇음(도금 산포) — 몸통 겸 방벽이라 다 먹히면 안 됨'],
      ['up', '베이스 다이: 상부 Cu 두께 산포 — 얇으면 일찍 다 쓰여 IMC가 Ni 위로, 두꺼우면 Cu₃Sn · 보이드 쪽'], ['dn', '본딩 · 적층 · 고온 시험 열 이력']],
    k: [COMMON, '단면 IMC 두께(평균 · 최대) · 남은 Ni · 남은 상부 Cu', '열 이력 합계(횟수 × 시간 · 온도)'],
    f: '프로파일 상한 · 재작업 횟수 관리, 다이별 금속 예산 — 코어 Ni · 베이스 상부 Cu (05장)'},
  {id: 'discolor', nm: '산화 · 변색', sn: '변색', def: '솔더 표면이 흐리거나 누렇게 · 무지개빛으로 변했다 · Cu 기둥 옆면이 갈색 · 무지개빛으로 변색(베이스 다이 — 코어 다이는 Cu 기둥이 없다)', st: [0],
    map: '가장자리 · 문 쪽 · 첫 장(산소) / 무작위 얼룩', pm: [0, 2, 4], out: ['surf'],
    c: [['atm', '산소 · 습기 높음 — 퍼지 부족 · 문 · 실 · 배관 새는 곳 (드러난 Cu 옆면은 얇게 산화돼도 색이 눈에 띔)'], ['eq', '냉각 구간 산소 · 습기 · 너무 뜨거운 채로 꺼냄'],
      ['up', '물기 얼룩 · 남은 산 (시드 식각 · 스트립 헹굼)'], ['dn', '옆면 산화 → 접착 필름(NCF) · 언더필 접착 저하로 드러남']],
    k: [COMMON, '산소 센서 기록 · 퍼지 시간 · 센서 교정', '변색 위치 vs 웨이퍼 넣는 방향 · 슬롯', 'Cu 옆면 산화막(XPS · SEM-EDS)'],
    f: '퍼지 · 실링 · 꺼내는 온도 관리, 앞 공정 건조 확인 — 옆면 산화는 흘러내림을 막지만 접착에는 나쁨(맞바꿈, 04장)'},
  {id: 'residue', nm: '플럭스 · 포름산 찌꺼기', sn: '찌꺼기', def: '범프 사이 · 밑동에 남은 플럭스 찌꺼기 · 포름산 주석 · 얼룩', st: [0, 3],
    map: '범프가 빽빽한 곳 · 웨이퍼 가운데(세정 흐름) / 장비 천장 · 배기 아래(떨어짐)', pm: [3, 4], out: ['surf'],
    c: [['atm', '플럭스 과다 · 탄화(과열)'], ['eq', '세정 부족 · 배기 막힘 · 챔버 벽 찌꺼기가 떨어짐'], ['cond', '높은 최고 온도 · 긴 시간 → 플럭스가 타서 안 씻김'], ['dn', '언더필 · 접착 · 본딩 불량으로 드러남']],
    k: [COMMON, '세정 뒤 외관 · 이온 오염', '챔버 · 배기 PM(정기 점검) 주기 · 찌꺼기 성분'],
    f: '플럭스 양 · 프로파일, 세정 조건, PM 주기'},
  {id: 'lift', nm: '범프 누락 · 들뜸', sn: '누락 · 들뜸', def: '범프가 통째로 없거나, 기둥 밑이 들떠 기울었다 / 보호막이 부풀었다 — 처음 보인 곳 ≠ 원인 공정의 대표 사례', st: [0, 1],
    map: '가장자리 · 언더컷 큰 곳(시드 식각 맵과 겹침) / 고립 범프 · 다이 반복 / 이송 · 핀 자리', pm: [0, 3], out: ['shape'],
    c: [['up', '시드 식각 언더컷 과다 · 시드 / 보호막 접착 약함 (시드 식각 4장)'], ['up', '보호막(폴리이미드) 흡습 — 습식 공정 뒤 리플로우까지 시간 · 건조 → 가열 때 기체로 부풂'],
      ['up', '도금 층 밀착 — 베이스: 상부 Cu/Ni(Ni 부동태 · 도금 사이 지체) → 솔더 모자째 떨어짐 · 코어: 시드 위 Ni 몸통 밀착 · 막 응력 (전해도금 12장)'],
      ['cond', '빠른 승온 · 냉각 — 열응력 · 휨'], ['eq', '이송 팔 · 핀 · 흡착 충격'], ['dn', '스크러버 브러시 · 세정에서 떨어짐']],
    k: [COMMON, '리플로우 전 · 후 같은 자리 AOI 비교 (원래 있던 것인지)', '빠진 자리 바닥 SEM-EDS (Ti · Cu 시드 · 보호막 · Ni — Ni가 보이면 상부 Cu/Ni 계면)', '전단 강도 · 언더컷 단면'],
    f: '언더컷 · 접착(앞 공정) 확인, 보호막 건조 · 대기 시간 관리, 승온 · 냉각 기울기 완화, 이송 점검'}
];
const BY = Object.fromEntries(DEF.map(d => [d.id, d]));
const cats = d => CATS.filter(c => d.c.some(x => x[0] === c));
const mineOf = d => d.c.filter(x => MINE.has(x[0])).length;

// 인자 지도 — 결과 8 · 인자 16 ([id, 상자 이름, 꼬리표, [[결과, 방향, 확신, 설명]], 긴 이름])
const OUTS = [['shape', '모양 · 높이'], ['wet', '젖음 (덜 둥긂 · 디웨팅)'], ['wick', '흘러내림 · 브리지'], ['void', '보이드'], ['imc', 'IMC · 금속 소모'], ['micro', '속 구조 (Ag₃Sn · 결정)'], ['surf', '표면 (변색 · 찌꺼기 · 튐)'], ['thru', '처리량']];
const OI = Object.fromEntries(OUTS.map(([id], j) => [id, j]));
const INS = [
  ['gap', '핀 높이 · 판 틈 ↑', 'eq', [['shape', 'bad', 'T', '틈이 큰 곳이 덜 녹음 · 높이 차 (08장)'], ['wet', 'bad', 'T', '가장자리 · 가운데 온도 부족']]],
  ['vac', '진공 (녹은 동안)', 'eq', [['void', 'good', 'D', '수 µm 기포는 지름 10 % 안팎만 커져 효과 작음, 모여 커진 기포엔 듣는다'], ['surf', 'bad', 'T', '급하게 걸면 솔더가 튐'], ['thru', 'bad', 'T', '펌프 · 되돌림 시간']]],
  ['o2', '남은 산소 ↑', 'atm', [['wet', 'bad', 'T', '녹는 동안 산화막이 다시 자람'], ['surf', 'bad', 'T', '변색 · 흐림 · Cu 옆면 산화']]],
  ['red', '환원 ↑ (플럭스 · 포름산)', 'atm', [['wet', 'good', 'T', '솔더 겉 산화막이 걷힘 (SnAg 밑 계면의 디웨팅은 못 고침)'], ['wick', 'bad', 'T', '옆면 산화막까지 걷혀 흘러내림'], ['surf', 'chg', 'D', '플럭스 찌꺼기 ↔ 포름산 주석 찌꺼기 · 옆면 산화↓(접착↑)'], ['void', 'bad', 'D', '플럭스 양↑ → 겉 기체↑ (대부분 빠짐)']], '환원 세기 ↑ (플럭스 · 포름산)'],
  ['pk', '최고 온도 ↑', 'cond', [['wet', 'good', 'T', '녹음 여유↑ — 가장자리 덜 녹음↓'], ['imc', 'bad', 'L', '온도↑ → 반응 · 확산이 지수적으로 빨라짐 (아레니우스)'], ['surf', 'bad', 'T', '플럭스 탄화 · 남은 산소로 산화'], ['wick', 'bad', 'T', '젖음↑ → 옆면까지']]],
  ['tal', '액상선 위 시간 ↑', 'cond', [['void', 'good', 'T', '붙은 기포가 커지고 합쳐져 빠질 시간↑'], ['imc', 'bad', 'L', '녹은 동안 IMC가 두꺼워짐 (두께는 대략 시간^⅓에 비례)'], ['wick', 'bad', 'T', '옆면으로 흘러내릴 시간↑'], ['wet', 'chg', 'D', '겉 산화막이 걷힐 여유(덜 둥긂↓) vs 약한 계면은 더 물러남(디웨팅↑)'], ['thru', 'bad', 'L', '시간↑']]],
  ['soak', '예열 시간 ↑', 'cond', [['void', 'good', 'T', '용제 · 기체가 녹기 전에 빠짐'], ['wet', 'chg', 'D', '환원 시작(좋음) vs 플럭스 지침 · 산화(나쁨)'], ['thru', 'bad', 'L', '시간↑']]],
  ['ramp', '승온 속도 ↑', 'cond', [['surf', 'bad', 'T', '플럭스가 끓어 튐 · 솔더 볼'], ['shape', 'bad', 'T', '가운데–가장자리 온도 차↑ (08장)'], ['thru', 'good', 'L', '시간↓']]],
  ['cool', '냉각 속도 ↑', 'cond', [['micro', 'good', 'D', 'Ag₃Sn 판 · 결정이 작아지는 쪽 — 작은 범프에선 효과 작을 수 있음 (06장)'], ['shape', 'chg', 'D', '휨 · 응력이 달라짐']]],
  ['rw', '리플로우 반복 · 재작업 ↑', 'cond', [['imc', 'bad', 'L', '열 이력 합↑'], ['micro', 'bad', 'T', 'Sn이 IMC로 빠져 Ag 진해짐 → 판'], ['surf', 'bad', 'T', '산화 · 변색 기회↑']]],
  ['vol', '솔더 부피 산포 · 과다', 'up', [['shape', 'bad', 'L', '돔 높이 = 부피가 정함 (04장)'], ['wick', 'bad', 'L', '겉보기 각↑ → 가장자리를 넘침 (깁스 조건)']]],
  ['ag', 'Ag % ↑', 'up', [['micro', 'bad', 'T', 'Ag₃Sn 판 — 작은 범프일수록 (06장)'], ['wet', 'chg', 'D', '녹는 범위가 바뀜. Ag가 공정점 조성보다 크게 많으면 액상선이 올라 덜 녹음']]],
  ['org', '막 속 유기물 (액 나이) ↑', 'up', [['void', 'bad', 'T', '기체가 나와 솔더 속에 작은 보이드 무리 (계면 위 한 줄이면 샴페인 보이드, 07장)'], ['wet', 'bad', 'T', '덜 둥긂 · 젖음 불량'], ['surf', 'bad', 'D', '찌꺼기 · 얼룩']], '막 속 유기물 (도금액 나이) ↑'],
  ['qt', '대기 시간 · 건조 불량 ↑', 'up', [['wet', 'bad', 'T', '산화막이 두꺼워짐 (03장)'], ['surf', 'bad', 'T', '얼룩 · 변색'], ['void', 'bad', 'D', '헹굼 · 건조 얼룩 · 찌꺼기가 기포가 붙을 자리가 됨']]],
  ['warp', '웨이퍼 휨 ↑', 'up', [['shape', 'bad', 'T', '휨 쪽(가장자리 · 가운데) 덜 녹음 · 높이 차'], ['wet', 'bad', 'T', '틈이 큰 곳 온도 부족 (08장)']], '웨이퍼 휨 ↑ (막 응력 · TSV · 범프 부피)'],
  ['nre', '본딩 때 다시 녹이는 횟수 ↑', 'dn', [['imc', 'bad', 'L', '본딩 열 이력 · 위 계면 IMC (05장)'], ['micro', 'bad', 'T', '위 · 아래 계면으로 Sn 소모 → Ag 진해짐 → 판 (06장)']], '본딩에서 다시 녹이는 횟수 ↑ (코어 적층 · 베이스 → 인터포저)']
];
const FI = Object.fromEntries(INS.map((x, k) => [x[0], k]));
const fname = f => f[4] || f[1];
// 앞 장 위젯의 예시 계산 (개념 모델 · 예시 값)
const NUM = {
  gap: '판 틈 100 → 300 µm → 웨이퍼 열 지연 3.6 → 10.2초 (08장 모델)',
  vac: '50 mbar → 보이드 0.99 → 0.87 % — 지름 5 µm 기포는 ×1.09, 거의 그대로 (07장 모델)',
  o2: '산소 10 → 1,000 ppm (질소만) → 녹는 동안 더 자라는 막 0.5 → 4.7 nm (03장 모델)',
  red: '플라즈마 없이 30일 · 얼룩 막(약 19 nm): 질소만 19 nm(덜 둥긂) → 포름산 7 nm(주름) → 플럭스 0 nm (03장 모델)',
  pk: '최고 +10 °C → 액상선 위 64 → 74초 · IMC +7 % — 코어 Ni₃Sn₄ 1.01 → 1.08 · 베이스 Cu₆Sn₅ 2.01 → 2.16 µm (02장 모델)',
  tal: '액상선 위 60 → 90초 → IMC 약 +14 % · 보이드 0.99 → 0.47 % (05 · 07장 모델)',
  soak: '예열 창 · 플럭스 지침은 02 · 03장 위젯으로 — 숫자보다 용제가 날아갈 시간을 확인합니다',
  ramp: '승온 2 → 4 °C/초 → 휨 +100 µm 웨이퍼의 가운데–가장자리 차 6.8 → 13.6 °C (08장 모델)',
  cool: '냉각 2 → 10 °C/초 (Ag 2.5 % · 25 µm) → Ag₃Sn 판 7.2 → 2.0 µm (06장 모델 — 실제 효과는 더 작을 수 있음)',
  rw: '녹이는 횟수 1 → 2회 → IMC 코어(Ni₃Sn₄) 1.0 → 1.26 · 베이스(Cu₆Sn₅) 2.0 → 2.5 µm (05장 모델)',
  vol: '솔더 부피 ±5 % → 돔 꼭대기 ±0.47 µm(±3 %) (04장 모델)',
  ag: 'Ag 2.0 → 2.5 % → Ag₃Sn 판 2.6 → 7.2 µm (06장 모델, 25 µm · 2 °C/초)',
  org: '솔더 속 · 계면 기체 보통 → 많음 → 보이드 0.99 → 2.0 % (07장 모델)',
  qt: '대기 1 → 30일(플라즈마 없음) → 공기 중 산화막 2.4 → 3.6 nm (03장 모델)',
  warp: '휨 0 → +150 µm → 가장자리 열 지연 3.6 → 8.6초 (−150 µm면 가운데가 8.6초, 08장 모델)',
  nre: '본딩 2회 더(1 → 3회, 두 계면) → Sn 소모 코어 7 → 20 % · 베이스 12 → 26 % → Ag₃Sn 판 코어 9 → 13 · 베이스 10 → 15 µm (05 · 06장 모델)'
};
const EFF = {good: ['좋아짐', 'pl-eg'], bad: ['나빠짐', 'pl-eb'], chg: ['달라짐', 'pl-ec'], up: ['늘어남', 'pl-eu'], down: ['줄어듦', 'pl-ed']};
const CONF = {L: '물리 법칙', T: '보통 경향', D: '조건에 따라'};
// 확인 순서 — 나눠 흘리기 결과 가정 (행: 프로파일 기본 / +10 °C · +20초, 열: 표면 그대로 / 새 플라즈마 · 대기 0)
const EX = {
  prof: {g: [[0, 0], [1, 1]], t: ['프로파일 줄만 좋아짐 (표면은 상관없음)', '→ 리플로우 조건 — 온도 여유 · 가장 차가운 곳'], tg: 'cond'},
  surf: {g: [[0, 1], [0, 1]], t: ['새 플라즈마 칸만 좋아짐 (프로파일은 상관없음)', '→ 표면 산화막 · 대기 시간 — 앞 공정 · 전처리'], tg: 'up'},
  none: {g: [[0, 0], [0, 0]], t: ['어느 칸도 그대로', '→ 솔더 자체(유기물 · Ag %) — 도금 쪽 (전해도금 12장)'], tg: 'up'}
};
const EXK = ['prof', 'surf', 'none'];
const EXN = {prof: '프로파일만 좋아짐', surf: '새 플라즈마만 좋아짐', none: '둘 다 그대로'};
// 손대지 않았을 때 단계마다 보여 줄 것 (발표 모드 대비)
const DEMO = {tiles: {d: 'nonmelt'}, map: {d: null}, factor: {f: 'tal'}, check: {x: 'prof'}};
// 좁은 세로 화면 전용 확대: 타일 · 웨이퍼 · 나눠 흘리기 그림만 크게 (상세는 카드에)
const VN = {tiles: {x: 32, y: 124, w: 1036, h: 900}, map: {x: 30, y: 128, w: 1040, h: 870}, check: {x: 762, y: 140, w: 806, h: 960}};

// 배치
const TW = 247, TH = 290, TG = 10, GX = 40, GY = 130;
const tilePos = i => ({x: GX + (i % 4) * (TW + TG), y: GY + Math.floor(i / 4) * (TH + 10)});
const DX0 = 1098, DX1 = 1562;                                         // 오른쪽 패널 안쪽
const MX = [200, 540, 880], MY = [335, 745], MR = 125;                // 웨이퍼 맵 6개
const IX = 50, IW = 412, IH = 46, IG = 6, GG = 14, IY = 136, OX = 1120, OW = 440, OH = 100, OG = 10, OY = 136;
const iTop = k => IY + k * (IH + IG) + CATS.indexOf(INS[k][2]) * GG;
const iy = k => iTop(k) + IH / 2, oy = j => OY + j * (OH + OG) + OH / 2;
const mid = (k, j) => [(IX + IW + OX) / 2, (iy(k) + oy(j)) / 2];
// 글 폭 어림 (px) — 한글 1em, 영문 · 숫자 약 0.55em
// 장면 글 줄바꿈: '·'는 앞말에, 숫자는 단위에 붙여 줄 머리에 '·' · 단위만 남지 않게 (붙임 = 줄바꿈 없는 빈칸)
const glue = t => String(t).replace(/ · /g, '\u00a0· ').replace(/(\d) (°C|µm|nm|%|초|ppm|mbar)/g, '$1\u00a0$2');
const tw = (t, fs) => [...String(t)].reduce((a, ch) => a + (/[ㄱ-힝]/.test(ch) ? 1 : /[A-Za-z0-9 .,:;'()\-]/.test(ch) ? 0.55 : 0.85), 0) * fs;

// 구형 모자: 가운데 cx, 바닥선 y0, 바닥 반폭 a, 높이 h. h > a 이면 반구보다 큰 호
const cap = (cx, y0, a, h) => { const R = (a * a + h * h) / (2 * h); return `M${q(cx - a)},${q(y0)} A${q(R)},${q(R)} 0 ${h > a ? 1 : 0} 1 ${q(cx + a)},${q(y0)} Z`; };
// 범프 단면 그림 — 베이스 다이 (로컬 좌표, 1 µm ≈ 2.8): 보호막 0~6 · Si 6~22, 시드 −4~0, Cu 기둥 −38~−4(12 µm), Ni −46~−38 · 상부 Cu −54~−46(각 3 µm, 같은 두께),
// 정상 돔 높이 44(15.7 µm), 기둥 폭 70(25 µm)
const YN = -54, YU = -46, YC = -38;
function fig(K, id){
  const {R, C, P, E, L, PG, G} = K;
  const base = (x0, x1) => R(x0, 6, x1 - x0, 16, 'f-si') + R(x0, 0, x1 - x0, 6, 'f-pas');
  const seed = (x, hw) => R(x - hw, -4, 2 * hw, 4, 'f-seed2') + R(x - hw, -1.4, 2 * hw, 1.4, 'f-ti');
  const cu = (x, hw) => R(x - hw, YC, 2 * hw, -4 - YC, 'f-cu2');
  const ni = (x, hw, t = 8) => R(x - hw, YC - t, 2 * hw, t, 'f-ni');
  const tc = (x, hw) => R(x - hw, YN, 2 * hw, YU - YN, 'f-cu2');               // 상부 Cu (Ni 위 얇은 Cu)
  const dome = (x, hw, h, cls = 'f-sn2', y0 = YN) => P(cap(x, y0, hw, h), cls);
  const imc = (x, hw, y0 = YN, t = 2.4) => R(x - hw, y0 - t, 2 * hw, t, 'f-imc');
  const gl = (x, hw, h, y0 = YN) => P(`M${q(x - hw * 0.62)},${q(y0 - h * 0.45)} Q${q(x - hw * 0.5)},${q(y0 - h * 0.86)} ${q(x - hw * 0.08)},${q(y0 - h * 0.95)}`, 'rf09-gl');
  const stem = (x, hw, uc = 0) => seed(x, hw - uc) + cu(x, hw) + ni(x, hw) + tc(x, hw);
  const col = (x, hw, h) => stem(x, hw) + dome(x, hw, h) + imc(x, hw) + gl(x, hw, h);
  switch (id){
    case 'nonmelt': {
      const top = [[-35, YN], [-35, -86], [-26, -90], [-17, -85], [-8, -91], [1, -86], [10, -92], [19, -86], [28, -90], [35, -87], [35, YN]];
      const d = 'M' + top.map(p => p.join(',')).join(' L');
      return base(-62, 62) + stem(0, 35) + P(d + ' Z', 'rf09-dull') + P(d, 'rf09-oxl') + imc(0, 35);
    }
    case 'dewet': return base(-62, 62) + stem(0, 35) + dome(0, 22, 50) + imc(0, 22) + R(-35, -56.4, 13, 2.4, 'rf09-bare') + R(22, -56.4, 13, 2.4, 'rf09-bare') + gl(0, 22, 50);
    case 'wick': return base(-62, 62) + stem(0, 35) + dome(0, 39, 34) + P('M-39,-54 L-35,-54 L-35,-12 Q-36,-6 -39,-12 Z', 'f-sn2') + P('M39,-54 L35,-54 L35,-12 Q36,-6 39,-12 Z', 'f-sn2')
      + L(-35, -54, -35, -14, 'rf09-imcd') + L(35, -54, 35, -14, 'rf09-imcd') + imc(0, 35) + gl(0, 39, 34);
    case 'bridge': {
      const d = 'M-74,-54 C-76,-74 -64,-86 -50,-86 C-36,-86 -28,-80 -18,-79 C-7,-78 7,-78 18,-79 C28,-80 36,-86 50,-86 C64,-86 76,-74 74,-54 L26,-54 C22,-64 12,-68 0,-68 C-12,-68 -22,-64 -26,-54 Z';
      return base(-92, 96) + stem(-50, 24) + stem(50, 24) + P(d, 'f-sn2') + P(d, 'rf09-ngl') + imc(-50, 24) + imc(50, 24) + C(83, -3.6, 3.6, 'f-sn2') + C(92, -2.8, 2.8, 'f-sn2');
    }
    case 'void': return base(-62, 62) + col(0, 35, 44) + C(-14, -61.8, 5.5, 'f-void') + C(9, -60.6, 4.2, 'f-void') + C(21, -59.6, 3.2, 'f-void');
    case 'height': {
      let s = base(-94, 94);
      [[-64, 17], [0, 25], [64, 33]].forEach(([x, h]) => { s += col(x, 20, h); });
      return s + L(-92, -79, 92, -79, 's-dash') + L(-90, -79, -90, -71, 'rf09-dim') + L(90, -79, 90, -87, 'rf09-dim');
    }
    case 'ag3sn': return base(-62, 62) + col(0, 35, 44) + G(R(-30, -2.6, 60, 5.2, 'pl-ag3'), {transform: 'translate(0 -72) rotate(-15)'}) + P('M28,-80 L33,-86', 'pl-crack');
    case 'imc': {
      // 베이스 다이: 상부 Cu가 다 쓰여 (Cu,Ni)₆Sn₅가 Ni 위에 바로 — 여기까지는 설계대로(05장). 열 이력이 넘쳐 IMC가 솔더를 많이 먹고 두꺼워진 모습.
      // Ni는 거의 그대로 (IMC 1 µm에 Ni 약 0.07 µm, 05장 모델). 코어 다이는 Ni₃Sn₄ 아래 Ni가 줄어든다 (글로)
      let sc = 'M-35,-46 L-35,-56';                                                   // 두꺼운 층 + 둥근 가리비 윗면 ((Cu,Ni)₆Sn₅ — 05 · 07장과 같은 모양)
      for (let i = 1; i <= 7; i++) sc += ` A5,7 0 0 1 ${-35 + i * 10},-56`;
      return base(-62, 62) + seed(0, 35) + cu(0, 35) + ni(0, 35) + dome(0, 35, 44, 'f-sn2', -46) + P(sc + ' L35,-46 Z', 'f-imc')
        + PG([[-15, -75], [-9, -78], [-7, -72], [-13, -70]], 'f-imc') + PG([[11, -82], [17, -84], [18, -78], [12, -77]], 'f-imc') + gl(0, 35, 44, -46);
    }
    case 'discolor': {
      const a1 = (r, t1, t2) => { const cy = -62.1, x1 = r * Math.cos(t1), y1 = cy + r * Math.sin(t1), x2 = r * Math.cos(t2), y2 = cy + r * Math.sin(t2); return `M${q(x1)},${q(y1)} A${r},${r} 0 0 1 ${q(x2)},${q(y2)}`; };
      return base(-62, 62) + stem(0, 35) + R(-35, YC, 4, -4 - YC, 'rf09-cuox') + R(31, YC, 4, -4 - YC, 'rf09-cuox') + dome(0, 35, 44, 'rf09-tarn') + P(a1(32, -2.6, -0.6), 'rf09-ir1') + P(a1(28.5, -2.4, -0.9), 'rf09-ir2') + imc(0, 35);
    }
    case 'residue': return base(-72, 72) + col(0, 35, 44) + P(cap(0, YN, 37, 46.5), 'rf09-film')
      + E(-44, -2.5, 8, 4, 'rf09-char') + E(46, -3, 9, 5, 'rf09-char') + E(-60, -1.8, 5, 2.6, 'rf09-char') + E(63, -1.6, 6, 2.6, 'rf09-char') + P('M35,-4 Q41,-14 38,-24 L35,-24 Z', 'rf09-char') + P('M-35,-4 Q-40,-10 -38,-16 L-35,-16 Z', 'rf09-char');
    case 'lift': return base(-96, 90) + P('M-94,0 Q-85,-10 -76,0 Z', 'f-pas') + R(-60, -4, 30, 4, 'f-seed2') + R(-60, -1.4, 30, 1.4, 'f-ti')
      + PG([[-70, -4], [-18, -4], [-69.5, -11.2]], 'f-void')
      + G(cu(-44, 26) + ni(-44, 26) + tc(-44, 26) + dome(-44, 26, 33) + imc(-44, 26) + gl(-44, 26, 33), {transform: 'rotate(8 -18 -4)'})
      + R(26, -90, 52, 90, 'pl-ghost') + R(30, -2.5, 9, 2.5, 'f-seed2') + R(46, -1.6, 6, 1.6, 'f-ti') + R(60, -2.5, 10, 2.5, 'f-seed2');
    default: return base(-62, 62) + col(0, 35, 44);
  }
}
// 상세 그림의 지시선 [로컬 x, y, 글]
const NOTE = {
  normal: [[0, -98, '매끈한 돔 · 광택'], [30, -56, '얇은 IMC']],
  nonmelt: [[10, -91, '원기둥 · 쭈글쭈글'], [35, -70, '산화막 테두리']],
  dewet: [[0, -104, '공처럼 뭉침'], [30, -55, '드러난 상부 Cu']],
  wick: [[0, -88, '낮아진 돔'], [-37, -30, '옆면 솔더 막 · IMC']],
  bridge: [[0, -78, '솔더 다리 (단락)'], [92, -3, '튄 솔더 알갱이']],
  void: [[-14, -62, '바닥 계면에 붙은 보이드']],
  height: [[64, -87, '높은 범프'], [-64, -71, '낮은 범프']],
  ag3sn: [[18, -77, '굵은 Ag₃Sn 판 → 균열 길']],
  imc: [[-10, -81, '떨어져 나간 조각'], [-25, -60, '열 이력 과다 → 두꺼운 IMC'], [30, -42, 'Ni는 거의 그대로 (코어는 줄어듦)']],
  discolor: [[10, -92, '누렇게 · 흐림'], [33, -25, 'Cu 옆면 변색']],
  residue: [[0, -100, '얇은 찌꺼기 막'], [46, -3, '플럭스 찌꺼기']],
  lift: [[-64, -8, '들뜬 틈'], [52, -50, '빠진 자리']]
};

(window.EngrReflowChapters = window.EngrReflowChapters || []).push({
  no: '09', id: 'defects', part: 3, short: '불량 · 인자', scale: '범프 · 웨이퍼 맵',
  title: '불량 도감 — 이 불량은 어디서 왔고, 무엇을 바꿀까?',
  hook: '처음 보인 단계와 무늬로 좁힌다',
  one: '리플로우 뒤 불량은 생김새, 웨이퍼 맵 무늬, 처음 보인 검사 단계로 원인을 좁힙니다. 원인은 리플로우만이 아니어서 리플로우-장비 · 리플로우-분위기 · 리플로우-조건(이 공정에서 바꿀 수 있는 것)과 앞 공정 · 뒤 공정으로 나눠 봅니다. 타일 그림은 베이스 다이 범프(Cu 기둥 / Ni / 상부 Cu — Ni 위에 얇게 한 번 더 올린 Cu / SnAg)이고, 코어 다이(Ni / SnAg)와 다른 점은 생김새 · 원인 글에서 짚습니다.',
  ana: '<b>의사의 진찰</b> — 증상(생김새), 아픈 곳(맵 무늬), 언제부터(처음 보인 단계)를 함께 들어야 병(원인)을 좁힐 수 있습니다. <i>(비유의 한계: 공정 불량은 원인 하나보다 여럿이 겹친 경우가 많아, 공통점 찾기와 나눠 흘리는 실험으로 확인해야 합니다. 또 리플로우에서 처음 보였다고 원인이 리플로우인 것은 아닙니다.)</i>',
  steps: [
    {id: 'tiles', viewN: VN.tiles, t: '불량 타일 — 생김새로 고르기', d: '정상과 대표 불량 11가지를 범프 단면 그림으로 비교합니다. 타일마다 처음 보이는 단계와 원인 꼬리표(장비 · 분위기 · 조건 · 앞 공정 · 뒤 공정)가 붙어 있습니다. 타일을 누르면 확인 방법과 대책이 나옵니다.'},
    {id: 'map', viewN: VN.map, t: '맵 무늬 — 어디에 몰렸나', d: '가장자리 고리는 온도(휨 · 판 틈 · 가장자리 열 손실 — 가운데가 들린 휨이면 가운데 무늬), 한쪽 치우침은 기체 흐름 · 판 기울기 · 이송 방향, 다이 반복은 패턴 · 솔더 부피, 무작위 점은 입자 · 찌꺼기를 먼저 의심합니다. 도금 높이 · Ag % 맵과 겹쳐 봅니다.'},
    {id: 'factor', t: '인자 지도 — 바꿀 것과 받는 것', d: '최고 온도 · 액상선 위 시간 · 예열 · 냉각 · 산소 · 환원 · 진공처럼 리플로우에서 바꿀 수 있는 인자와, 솔더 부피 · Ag % · 막 속 유기물 · 대기 시간처럼 앞 공정이 정한 인자를 나눕니다. 인자를 누르면 영향받는 결과가 보입니다.'},
    {id: 'check', viewN: VN.check, t: '확인 순서 — 나눠서 바꿔 보기', d: '먼저 측정용 웨이퍼로 실제 온도 프로파일과 산소를 확인합니다. 그다음 같은 lot(함께 흘리는 웨이퍼 묶음)을 나눠 리플로우 조건만 바꾸거나, 표면 처리 · 대기 시간만 바꿔 흘리면 리플로우 원인과 앞 공정 원인이 빨리 갈립니다.'}
  ],
  icon(K){
    const {R, P} = K;
    return R(10, 46, 26, 14, 'f-cu2') + R(10, 43, 26, 3, 'f-ni') + R(10, 40, 26, 3, 'f-cu2') + P('M10,40 A13,13 0 0 1 36,40 Z', 'f-sn2') + P('M44,20 L60,36 M60,20 L44,36', 's-arrr');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, rng} = K;
    const wrap = (t, em) => K.wrap(glue(t), em);
    let s = '';
    // ── 1. 불량 타일 12개 (4 × 3) + 꼬리표 범례
    let tl = '';
    DEF.forEach((d, i) => {
      const {x, y} = tilePos(i), cs = cats(d);
      let g = R(x, y, TW, TH, 'pl-tile2', {rx: 14}) + T(x + 14, y + 32, `${String(i).padStart(2, '0')} ${d.sn}`, 't-sub', 'start')
        + T(x + 14, y + 58, d.st.length ? '처음: ' + d.st.map(k => STS[k]).join(' · ') : '비교 기준 — 늘 함께 본다', 't-dim', 'start');
      g += G(fig(K, d.id), {transform: `translate(${x + TW / 2} ${y + 228}) scale(1.25)`});
      if (d.c.length){
        let px = x + 12;
        CATS.forEach(c => { const on = cs.includes(c), w = TGW[c]; g += R(px, y + TH - 32, w, 26, 'rf09-tg ' + (on ? c : 'rf09-off'), {rx: 6}) + T(px + w / 2, y + TH - 13, TS[c], 'rf09-tgt' + (on ? '' : ' rf09-off')); px += w + 3; });
      }
      g += R(x, y, TW, TH, 'pl-pick', {rx: 14});
      tl += G(g, {class: 'pl-def', 'data-def': d.id, 'data-tip': `${d.nm} — ${d.def}` + (d.st.length ? `\n처음 보이는 단계: ${d.st.map(k => STG[k]).join(' · ')}` : '') + (cs.length ? `\n원인 꼬리표: ${cs.map(c => TAG[c]).join(' · ')}` : '') + '\n누르면 오른쪽에 확인 방법 · 대책'});
    });
    let lg = T(GX + 2, 1066, '원인 꼬리표', 'rf09-lgt', 'start'), lx = GX + 118;
    CATS.forEach(c => { lg += R(lx, 1049, 22, 22, 'rf09-tg ' + c, {rx: 5}) + T(lx + 30, 1066, TAG[c], 't-dim', 'start'); lx += 30 + tw(TAG[c], 19) + 26; });
    lg += T(GX + 2, 1100, '앞의 셋 = 리플로우에서 바꿀 수 있는 것 · 앞 공정 · 뒤 공정 = 그 팀과 함께 본다', 't-dim', 'start');
    s += G(tl + LB(lg, tip('리플로우 인자: 리플로우-장비 · 리플로우-분위기 · 리플로우-조건\n비리플로우 인자: 앞 공정(도금 · 스트립 · 시드 식각 · 플라즈마 처리) · 뒤 공정(세정 · 본딩 · 시험)')), only('tiles'));
    // 오른쪽 패널 (tiles: 고른 불량의 상세, map: 처음 보이는 단계 띠)
    s += R(1078, 130, 502, 990, 'pl-panel', K.W({rx: 16}, only('tiles map')));
    s += G('<g data-v="detail"></g>', only('tiles'));
    // ── 2. 맵 무늬 6개
    let mp = T(GX, 150, '맵 무늬 — 불량이 웨이퍼 어디에 몰렸나', 't-acc', 'start') + '<g data-v="msel"></g>';
    MAPS.forEach((m, i) => {
      const cx = MX[i % 3], cy = MY[Math.floor(i / 3)], g0 = rng(31 + i * 7);
      let w = '';
      if (i === 5){ [125, 100, 75, 50, 25].forEach((r, k) => { w += C(cx, cy, r, 'rf09-ring', {style: `fill:${K.heat(0.92 - k * 0.2)}`}); }); w += C(cx, cy, MR, 'rf09-waf2'); }
      else w += C(cx, cy, MR, 'rf09-waf');
      // 다이 격자
      for (let k = -2; k <= 2; k++){
        const dx = k * 50 + 25, hy = Math.sqrt(Math.max(0, MR * MR - dx * dx)) - 3;
        if (hy > 10){ w += L(cx + dx, cy - hy, cx + dx, cy + hy, 'rf09-grid') + L(cx - hy, cy + dx, cx + hy, cy + dx, 'rf09-grid'); }
      }
      w += P(`M${cx - 9},${cy + MR - 1} L${cx},${cy + MR - 11} L${cx + 9},${cy + MR - 1} Z`, 'rf09-notch');
      const dot = (x, y, r = 4.5) => C(x, y, r, 'k-ng rf09-dot');
      const polar = (r0, r1, a0, a1, n) => { let o = ''; for (let j = 0; j < n; j++){ const a = a0 + g0() * (a1 - a0), r = r0 + g0() * (r1 - r0); o += dot(cx + r * Math.cos(a), cy + r * Math.sin(a)); } return o; };
      if (i === 0) w += polar(100, 118, 0, Math.PI * 2, 30) + C(cx, cy, 40, 'rf09-alt');
      if (i === 1){ for (let j = 0; j < 26; j++){ const a = Math.PI * (0.55 + g0() * 0.9), r = 30 + g0() * 88; w += dot(cx + r * Math.cos(a), cy + r * Math.sin(a)); } }
      if (i === 2) w += polar(78, 118, -Math.PI * 0.85, -Math.PI * 0.15, 24) + K.arrow(cx, cy - MR - 64, cx, cy - MR - 14, 's-arr2') + T(cx + 14, cy - MR - 40, '문 (넣는 쪽)', 'rf09-door', 'start');
      if (i === 3){ for (let a = -2; a <= 1; a++) for (let b = -2; b <= 1; b++){ const x = cx + a * 50 + 25 + 14, y = cy + b * 50 + 25 + 12; if (Math.hypot(x - cx, y - cy) < 108) w += dot(x, y); } }
      if (i === 4){ for (let j = 0; j < 22; j++){ const a = g0() * Math.PI * 2, r = Math.sqrt(g0()) * 112; w += dot(cx + r * Math.cos(a), cy + r * Math.sin(a), 3.6 + g0() * 2); } }
      w += C(cx, cy, MR + 10, 'rf09-mring');
      const ds = wrap(m.ds, 15);
      w += T(cx, cy + MR + 38, m.nm, 'rf09-mn') + K.TT(cx, cy + MR + 66, ds, 't-dim', 'middle', 24);
      mp += G(w, {class: 'rf09-wm', 'data-m': i, 'data-tip': m.tp + '\n누르면 이 무늬가 잘 나오는 불량을 차례로 보여 줍니다'});
    });
    mp += LB(K.TT(GX, 1048, wrap('같은 고리라도 리플로우 전 높이 맵에 이미 있으면 도금(앞 공정) 쪽입니다 — 도금 높이 · Ag % · 대기 시간 · 장비 슬롯 맵과 겹쳐 봅니다.', 48), 't-sub', 'start', 30));
    s += G(mp + '<g data-v="strip"></g>', only('map'));
    // ── 3. 인자 지도
    let fs = T(IX, 122, '인자 — 바꿀 수 있는 것 · 받는 것', 't-acc', 'start') + T(OX, 122, '결과', 't-acc', 'start');
    INS.forEach(([id, nm, tg, eff], k) => eff.forEach(([o, e, cf]) => {
      const y1 = iy(k), y2 = oy(OI[o]);
      fs += P(`M${IX + IW},${y1} C${IX + IW + 260},${y1} ${OX - 260},${y2} ${OX},${y2}`, 'pl-edge', {'data-in': id, 'data-out': o, 'data-e': e, 'data-c': cf});
    }));
    fs += '<g data-v="marks"></g>';
    INS.forEach((f, k) => {
      const [id, nm, tg] = f, y = iTop(k);
      fs += G(R(IX, y, IW, IH, 'pl-inb', {rx: 10}) + R(IX + 1, y + 6, 6, IH - 12, 'rf09-tg ' + tg, {rx: 3}) + T(IX + 20, y + 31, nm, 't-sub', 'start')
        + R(IX + IW - 74, y + 10, 64, 26, 'rf09-tg ' + tg, {rx: 6}) + T(IX + IW - 42, y + 29, TS[tg], 'rf09-tgt'),
        {class: 'pl-in', 'data-in': id, 'data-tip': `${fname(f)} — ${TAG[tg]}\n누르면 영향선이 보입니다`});
    });
    OUTS.forEach(([id, nm], j) => {
      const y = OY + j * (OH + OG);
      fs += G(R(OX, y, OW, OH, 'pl-outb', {rx: 12}) + T(OX + 18, y + 32, nm, 't-sub', 'start') + `<g data-ot="${id}" data-y="${y}"></g>`, {class: 'rf09-out', 'data-out': id, 'data-tip': nm + ' — 누르면 거꾸로, 이 결과를 움직이는 인자들'});
    });
    let fl = R(40, 1030, 660, 84, 'pl-box', {rx: 10}) + T(56, 1062, '색 = 방향', 'rf09-lg', 'start') + T(56, 1098, '선 = 확신', 'rf09-lg', 'start');
    [['pl-egc', '좋아짐'], ['pl-ebc', '나빠짐'], ['pl-ecc', '달라짐']].forEach(([c, t], j) => { fl += C(172 + j * 130, 1056, 8, c) + T(186 + j * 130, 1063, t, 'rf09-lg', 'start'); });
    fl += L(164, 1092, 204, 1092, 'rf09-ls') + T(212, 1099, '법칙', 'rf09-lg', 'start') + L(276, 1092, 316, 1092, 'rf09-ls rf09-T') + T(324, 1099, '보통 경향', 'rf09-lg', 'start')
      + C(436, 1092, 11, 'rf09-qc') + T(436, 1098, '?', 'rf09-qt') + T(454, 1099, '조건에 따라', 'rf09-lg', 'start');
    fs += LB(fl, tip('색 = 어느 쪽으로 움직이나\n선 모양 = 얼마나 확실한가 (실선: 물리 법칙 · 점선: 보통 경향 · ?: 분위기 · 조건에 따라 다름)'));
    fs += R(716, 1030, 844, 84, 'pl-box rf09-nbox', {rx: 10}) + '<g data-v="num"></g>';
    s += G(fs, only('factor'));
    // ── 4. 확인 순서 (왼쪽 순서도 · 오른쪽 나눠 흘리기)
    const FLOWS = [['측정용 웨이퍼', '가운데 · 가장자리 실제 프로파일 — 설정이 아니라 웨이퍼 온도'], ['분위기 로그', '산소 ppm · 포름산 · 진공 · 퍼지 시간'], ['공통점 찾기', '장비 · 판 · 슬롯 · 도금 장비 · 액 나이 · 대기 시간'], ['나눠 흘리기', '리플로우 조건 vs 앞 공정 표면 → 오른쪽 그림']];
    let ck = '';
    FLOWS.forEach(([t, d], i) => {
      const y = 150 + i * 172;
      ck += R(60, y, 640, 138, i === 3 ? 'pl-hlbox' : 'pl-tile2', {rx: 12}) + C(100, y + 48, 24, 'rf09-numc') + T(100, y + 56, String(i + 1), 'rf09-numt')
        + T(140, y + 56, t, 't-lbl', 'start') + K.TT(140, y + 92, wrap(d, 25), 't-sub', 'start', 28);
      if (i < 3) ck += K.arrow(380, y + 140, 380, y + 168, 's-arr');
    });
    ck += R(60, 838, 640, 270, 'pl-box', {rx: 12}) + T(80, 874, '설계 예 — 2 × 2 + 중심점', 't-acc', 'start')
      + K.TT(80, 912, ['· lot 25장 = 4칸 × 6장 + 중심점 1장'].concat(wrap('· 측정용 웨이퍼를 같은 묶음에 함께 흘린다', 28), wrap('· 같은 자리(가운데 · 가장자리 · 고립 다이)의 같은 범프를 외관 · 높이 · 단면으로 읽는다', 28), wrap('· 리플로우 전 · 후 같은 범프를 추적한다', 28)), 't-sub', 'start', 30);
    ck += T(770, 172, '④ lot 25장을 2 × 2로 나눠 흘리기 — 예: 덜 둥긂이 늘었을 때', 't-acc', 'start');
    ck += T(1105, 224, '표면 그대로', 't-sub') + T(1405, 224, '새 플라즈마 · 대기 0', 't-sub');
    [['프로파일 기본', '(지금 레시피)'], ['+10 °C · +20초', '(온도 여유↑)']].forEach(([a, b], r) => { const y0 = 240 + r * 210; ck += T(776, y0 + 96, a, 't-sub', 'start') + T(776, y0 + 124, b, 't-dim', 'start'); });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++){
      const x0 = 960 + c * 300, y0 = 240 + r * 210;
      ck += R(x0, y0, 290, 200, 'pl-lane', {rx: 10});
      for (let j = 0; j < 6; j++) ck += C(x0 + 55 + (j % 3) * 90, y0 + 52 + Math.floor(j / 3) * 66, 24, 'rf09-wd', {'data-r': r, 'data-c': c});
    }
    ck += '<g data-v="cres"></g>';
    ck += C(790, 688, 14, 'rf09-wd mid') + T(814, 695, '+ 중심점 1장 (+5 °C · +10초 · 표면 그대로) · 측정용 웨이퍼 함께', 't-dim', 'start');
    ck += T(770, 742, '결과 읽기', 't-acc', 'start');
    EXK.forEach((x, i) => {
      const y = 760 + i * 116, e = EX[x];
      let rw = R(770, y, 790, 104, 'pl-lane', {rx: 10, 'data-xr': x});
      e.g.forEach((row, r) => row.forEach((v, c) => { rw += R(790 + c * 30, y + 24 + r * 30, 26, 26, 'rf09-sq ' + (v ? 'ok' : 'ng'), {rx: 4}); }));
      rw += T(870, y + 42, e.t[0], 't-sub', 'start') + T(870, y + 76, e.t[1], 'rf09-concl', 'start');
      ck += G(rw, {'data-tip': '왼쪽 작은 칸: 2 × 2 결과 (초록 = 좋아짐 · 빨강 = 그대로)'});
    });
    s += G(ck, only('check'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 불량 고르기 · 인자 하나 바꾸기 (장면의 타일 · 상자를 눌러도 됩니다)</div>
      ${K.seg('k', [['def', '불량으로 보기'], ['fac', '인자로 보기']], 'def', '보는 방법')}
      <div class="pl-seg pl-chips" data-g="dpick">${DEF.map(d => `<button data-v="${d.id}" aria-pressed="false">${d.sn}</button>`).join('')}</div>
      <div class="pl-seg pl-chips rf09-hide" data-g="fpick">${INS.map(f => `<button data-v="${f[0]}" aria-pressed="false">${f[1]}</button>`).join('')}</div>
      <div class="pl-seg pl-chips rf09-hide" data-g="opick"><span class="lb">결과에서 거꾸로</span>${OUTS.map(([id, nm]) => `<button data-v="${id}" aria-pressed="false">${nm.split(' (')[0]}</button>`).join('')}</div>
      <div class="rf09-ex">${K.seg('ex', EXK.map(x => [x, EXN[x]]), 'prof', '나눠 흘린 결과 (가정)')}</div>
      ${K.kpis([['고른 것', 'k-s', ''], ['영향 결과 수', 'k-n', '법칙 · 경향 · 조건'], ['내가 바꿀 수 있는 원인', 'k-mine', '장비 · 분위기 · 조건 몫']])}
      <div class="pl-pcard rf09-sel" data-o="sel"></div>
      <div class="rf09-tb" data-o="tb"></div>
      ${K.model('선의 방향 · 확신은 공개 자료와 앞 장 모델의 경향을 모은 것이고, 숫자 줄은 각 장 위젯의 예시 계산(가정값)입니다. 꼬리표 몫은 원인 후보 수를 센 것이지 확률이 아닙니다. 실제 크기는 내 장비 · 제품 데이터로 확인합니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, T, G, LB, clamp} = K;
    const wrap = (t, em) => K.wrap(glue(t), em);
    const st = {mode: 'def', d: 'nonmelt', f: 'tal', o: null, x: 'prof'};
    const touched = {d: false, f: false, x: false};
    ctx.card.classList.add('rf09-card');                         // 단계 설명 높이를 고정해 단계가 바뀌어도 카드 길이가 그대로이게
    const setChips = (g, v) => ctx.card.querySelectorAll(`[data-g="${g}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const kpiCls = (id, c) => { const k = ctx.card.querySelector(`[data-o="${id}"]`).parentNode; ['ok', 'warn', 'ng'].forEach(x => k.classList.toggle(x, x === c)); };
    const kpiLbl = (id, k, sub) => { const n = ctx.card.querySelector(`[data-o="${id}"]`).parentNode; n.querySelector('.k').textContent = k; const s = n.querySelector('.s'); if (s) s.textContent = sub; };
    const tagH = tg => `<span class="rf09-tag ${tg}">${TAG[tg]}</span>`;

    // ── 오른쪽 상세 패널 (tiles): 그림 + 지시선 → 이름 · 생김새 → 처음 보이는 단계 → 맵 → 원인 후보 → 확인 → 대책 (넘치면 카드로 미룬다)
    function detail(d){
      if (!d) return T((DX0 + DX1) / 2, 600, '타일을 누르면 여기에 확인 방법 · 대책', 't-dim');
      const fx = 1236, fy = 302, fk = 1.3;
      let s = R(DX0 - 6, 142, DX1 - DX0 + 12, 196, 'pl-lane', {rx: 12}) + G(fig(K, d.id), {transform: `translate(${fx} ${fy}) scale(${fk})`});
      const ns = (NOTE[d.id] || []).slice().sort((a, b) => a[1] - b[1]);
      ns.forEach(([lx, ly, tx], j) => {
        const px = fx + lx * fk, py = fy + ly * fk, ls = wrap(tx, 8.4);
        const ty = ns.length === 1 ? clamp(py + 6, 184, 300) : 184 + j * (118 / (ns.length - 1));
        s += LB(L(px, py, 1384, ty - 6, 's-lead') + C(px, py, 3.5, 'k-lead') + K.TT(1392, ty, ls, 'rf09-note', 'start', 22));
      });
      let y = 378;
      s += T(DX0, y, d.nm, 't-lbl', 'start'); y += 30;
      wrap(d.def, 23.5).forEach(l => { s += T(DX0, y, l, 'rf09-def', 'start'); y += 25; });
      y += 6;
      if (d.st.length){
        s += T(DX0, y + 4, '처음 보이는 단계', 'rf09-h', 'start'); y += 16;
        STB.forEach((t, j) => { const on = d.st.includes(j), x = DX0 + (j % 3) * 156, yy = y + Math.floor(j / 3) * 36; s += R(x, yy, 150, 30, 'rf09-stc' + (on ? ' on' : ''), {rx: 8}) + T(x + 75, yy + 21, t, 'rf09-stt' + (on ? ' on' : '')); });
        y += 96;
      }
      wrap('맵 무늬 — ' + d.map, 23.5).forEach(l => { s += T(DX0, y, l, 'rf09-map', 'start'); y += 24; });
      y += 10;
      // 아래 블록: 19 px 글자로 남은 높이에 맞춰 싣고, 넘치면 대책 → 확인 끝을 카드로 미룬다
      const room = 1112 - y, lh = 24, cw = (DX1 - DX0 - 82) / 19, kw = (DX1 - DX0 - 14) / 19;
      const plan = (withFix, kMax) => {
        const cl = d.c.map(([, tx]) => wrap(tx, cw)), kl = d.k.slice(0, kMax).map(tx => wrap('· ' + tx, kw));
        const fl = withFix && d.f ? wrap(d.f, kw) : [];
        const n = cl.flat().length + kl.flat().length + fl.length + d.c.length * 0.25;
        return {cl, kl, fl, h: (d.c.length ? 32 : 0) + 32 + (fl.length ? 34 : 0) + n * lh + 6};
      };
      let best = null;
      for (const [fix, kMax] of [[true, 9], [false, 9], [false, 4], [false, 3], [false, 2], [false, 1]]){
        const p = plan(fix, kMax), cut = (d.f && !fix) || kMax < d.k.length;
        if (p.h + (cut ? 26 : 0) <= room){ best = p; break; }
      }
      if (!best) best = plan(false, 1);
      if (d.c.length){
        s += T(DX0, y + 4, '원인 후보', 'pl-hdg2', 'start'); y += 32;
        d.c.forEach(([tg], j) => { s += R(DX0, y - 18, 74, 25, 'rf09-tg ' + tg, {rx: 6}) + T(DX0 + 37, y, TD[tg], 'rf09-tgt'); best.cl[j].forEach(l => { s += T(DX0 + 82, y, l, 'rf09-tx', 'start'); y += lh; }); y += lh * 0.25; });
      }
      s += T(DX0, y + 4, d.c.length ? '확인' : '무엇으로 재나', 'pl-hdg', 'start'); y += 32;
      best.kl.forEach((ls, j) => ls.forEach((l, i) => { s += T(DX0 + (i ? 14 : 0), y, l, 'rf09-tx' + (j === 0 && d.c.length ? ' rf09-com' : ''), 'start'); y += lh; }));
      if (best.fl.length){ y += 6; s += T(DX0, y + 4, '대책 방향', 'pl-hdg3', 'start'); y += 32; best.fl.forEach(l => { s += T(DX0, y, l, 'rf09-tx', 'start'); y += lh; }); }
      else if (d.f || best.kl.length < d.k.length) s += T(DX1, Math.min(1112, y + 2), '… 나머지는 카드의 「직접 해 보기」에', 'rf09-more', 'end');
      return s;
    }
    // ── 처음 보이는 단계 띠 (map)
    function strip(){
      const sel = st.d && st.d !== 'normal' ? BY[st.d] : null;
      let s = T(DX0, 170, '처음 보이는 단계 → 그때 보이는 불량', 't-acc', 'start');
      STG.forEach((t, j) => {
        const y = 192 + j * 152, on = sel && sel.st.includes(j);
        s += R(DX0 - 4, y, DX1 - DX0 + 8, 140, on ? 'pl-hlbox' : 'pl-lane', {rx: 10}) + T(DX0 + 10, y + 32, `${j + 1}  ${t}`, 'rf09-h2', 'start');
        let x = DX0 + 10, yy = y + 50;
        DEF.filter(d => d.st.includes(j)).forEach(d => {
          const w = tw(d.sn, 19) + 22;
          if (x + w > DX1 - 6){ x = DX0 + 10; yy += 40; }
          const me = sel && sel.id === d.id;
          s += G(R(x, yy, w, 32, 'rf09-chip' + (me ? ' on' : ''), {rx: 8}) + T(x + w / 2, yy + 23, d.sn, 'rf09-chipt' + (me ? ' on' : '')), {'data-tip': `${d.nm} — 꼬리표: ${cats(d).map(c => TD[c]).join(' · ')}`});
          x += w + 8;
        });
      });
      s += K.TT(DX0, 974, wrap('리플로우에서 처음 보였다고 원인이 리플로우는 아닙니다 — 꼬리표를 봅니다. 같은 불량이 여러 단계에서 처음 보일 수 있어, 리플로우 전 · 후 같은 범프를 추적합니다.', 23.5), 't-dim', 'start', 25);
      return s;
    }
    // ── 인자 지도
    const effOf = (o, f) => K.TT(OX + 18, +o.getAttribute('data-y') + 60, wrap(`${EFF[f[0]][0]} — ${f[2]}`, 21.3).slice(0, 2), 'rf09-ot ' + EFF[f[0]][1] + 't', 'start', 23);
    const badge = (o, cf) => { const y = +o.getAttribute('data-y') + 24, x = OX + OW - 16; return cf === 'D' ? C(x - 10, y, 11, 'rf09-qc') + T(x - 10, y + 6, '?', 'rf09-qt') : L(x - 40, y, x, y, 'rf09-ls' + (cf === 'T' ? ' rf09-T' : '')); };
    function numBox(lbl, text){                                    // 한 줄이면 21 px, 두 줄이면 19 px로 상자(y 1030~1114) 안에
      let ls = wrap(text, 38), cls = 't-sub', lh = 26, y0 = 1086;
      if (ls.length > 1){ ls = wrap(text, 42); cls = 'rf09-n19'; lh = 23; y0 = 1081; }
      return T(732, 1056, lbl, 'rf09-nl', 'start') + K.TT(732, y0, ls.slice(0, 2), cls, 'start', lh);
    }
    function factor(){
      let mk = '';
      if (st.o){
        const id = st.o, j = OI[id], from = INS.filter(x => x[3].some(f => f[0] === id));
        ctx.$$('.rf09-out').forEach(g => { g.classList.toggle('pl-sel', g.getAttribute('data-out') === id); g.classList.toggle('dim', g.getAttribute('data-out') !== id); });
        ctx.$$('.pl-in').forEach(g => { g.classList.remove('pl-sel'); g.classList.toggle('dim', !from.some(x => x[0] === g.getAttribute('data-in'))); });
        ctx.$$('.pl-edge').forEach(e => {
          const on = e.getAttribute('data-out') === id, cf = e.getAttribute('data-c');
          e.setAttribute('class', on ? `pl-edge on ${EFF[e.getAttribute('data-e')][1]} rf09-${cf}` : 'pl-edge');
          if (on && cf === 'D'){ const [mx, my] = mid(FI[e.getAttribute('data-in')], j); mk += C(mx, my, 13, 'rf09-qc') + T(mx, my + 7, '?', 'rf09-qt'); }
        });
        const cnt = {}; CATS.forEach(c => { cnt[c] = from.filter(x => x[2] === c).length; });
        ctx.$$('[data-ot]').forEach(g => { g.innerHTML = g.getAttribute('data-ot') === id ? K.TT(OX + 18, +g.getAttribute('data-y') + 60, [`인자 ${from.length}개가 움직인다`, `리플로우 ${cnt.eq + cnt.atm + cnt.cond} · 앞 ${cnt.up} · 뒤 ${cnt.dn}`], 'rf09-ot rf09-rev', 'start', 23) : ''; });
        ctx.$('[data-v="num"]').innerHTML = numBox(`${OUTS[j][1]} ← 인자 ${from.length}개 (꼬리표별)`, `장비 ${cnt.eq} · 분위기 ${cnt.atm} · 조건 ${cnt.cond} · 앞 공정 ${cnt.up} · 뒤 공정 ${cnt.dn} → 리플로우 손잡이 ${cnt.eq + cnt.atm + cnt.cond}/${from.length} (손잡이 개수 — 원인 확률 아님)`);
      } else {
        const k = FI[st.f], inp = INS[k], hit = new Set();
        ctx.$$('.pl-in').forEach(g => { g.classList.toggle('pl-sel', g.getAttribute('data-in') === st.f); g.classList.remove('dim'); });
        ctx.$$('.rf09-out').forEach(g => g.classList.remove('pl-sel'));
        ctx.$$('.pl-edge').forEach(e => {
          const on = e.getAttribute('data-in') === st.f, cf = e.getAttribute('data-c');
          e.setAttribute('class', on ? `pl-edge on ${EFF[e.getAttribute('data-e')][1]} rf09-${cf}` : 'pl-edge');
          if (on){ hit.add(e.getAttribute('data-out')); if (cf === 'D'){ const [mx, my] = mid(k, OI[e.getAttribute('data-out')]); mk += C(mx, my, 13, 'rf09-qc') + T(mx, my + 7, '?', 'rf09-qt'); } }
        });
        ctx.$$('.rf09-out').forEach(g => g.classList.toggle('dim', !hit.has(g.getAttribute('data-out'))));
        ctx.$$('[data-ot]').forEach(g => { const f = inp[3].find(x => x[0] === g.getAttribute('data-ot')); g.innerHTML = f ? effOf(g, [f[1], f[2], f[3]]) + badge(g, f[2]) : ''; });
        ctx.$('[data-v="num"]').innerHTML = numBox(`앞 장 모델로 본 크기 (예시) — ${inp[1]}`, NUM[st.f]);
      }
      ctx.$('[data-v="marks"]').innerHTML = mk;
    }
    // ── 맵 강조 (고른 불량이 잘 몰리는 무늬)
    function maps(){
      const d = st.d && st.d !== 'normal' ? BY[st.d] : null;
      ctx.$$('.rf09-wm').forEach(g => { const i = +g.getAttribute('data-m'), on = !!d && d.pm.includes(i); g.classList.toggle('rf09-mon', on); g.classList.toggle('dim', !!d && !on); });
      ctx.$('[data-v="msel"]').innerHTML = d ? T(GX, 182, d.pm.length ? `고른 불량: ${d.sn} → 잘 몰리는 무늬 ${d.pm.length}가지 강조` : `고른 불량: ${d.sn} → 맵보다 열 이력 · lot으로 본다`, 't-warn', 'start')
        : T(GX, 182, '웨이퍼를 누르거나 카드에서 불량을 고르면, 그 불량이 잘 몰리는 무늬가 강조됩니다', 't-dim', 'start');
      ctx.$('[data-v="strip"]').innerHTML = strip();
    }
    // ── 확인 순서 (나눠 흘리기 결과 가정)
    function check(){
      const e = EX[st.x];
      ctx.$$('.rf09-wd[data-r]').forEach(c => { const v = e.g[+c.getAttribute('data-r')][+c.getAttribute('data-c')]; c.setAttribute('class', 'rf09-wd ' + (v ? 'ok' : 'ng')); });
      let cr = '';
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++){ const v = e.g[r][c]; cr += T(960 + c * 300 + 145, 240 + r * 210 + 182, v ? '좋아짐 6/6' : '그대로 (덜 둥긂)', v ? 'rf09-cok' : 'rf09-cng'); }
      ctx.$('[data-v="cres"]').innerHTML = cr;
      ctx.$$('[data-xr]').forEach(r => r.setAttribute('class', r.getAttribute('data-xr') === st.x ? 'pl-hlbox' : 'pl-lane'));
    }
    // 확인 순서 단계의 카드: 결과 가정 → 결론 · 칸별 결과 · 다음에 할 일
    const MSG = {
      prof: '+10 °C · +20초 줄만 좋아졌습니다 → <b>리플로우 조건(온도 여유)</b> 쪽입니다. 측정용 웨이퍼로 가장 차가운 곳(가장자리 · 휜 곳)의 실제 프로파일부터 고칩니다 (<a data-go="profile.peak">02장</a> · <a data-go="tool.plate">08장</a>).',
      surf: '새 플라즈마 · 대기 0 칸만 좋아졌습니다 → <b>표면 산화막 · 대기 시간(앞 공정 · 전처리)</b> 쪽입니다. 플라즈마 기체 · 대기 시간 · 건조를 봅니다 (<a data-go="oxide.plasma">03장</a>).',
      none: '어느 칸도 좋아지지 않았습니다 → <b>솔더 자체(막 속 유기물 · Ag %)</b> — 도금 쪽을 의심합니다 (<a href="#go-plating-12">전해도금 12장</a>).'
    };
    const NEXT = {
      prof: ['측정용 웨이퍼로 가운데 · 가장자리 실제 온도를 재고, 최고 온도 · 액상선 위 시간 여유를 가장 차가운 곳 기준으로 다시 잡습니다.', '휨 · 핀 높이 · 판 틈을 점검합니다 — 가장자리(또는 가운데)만 늦게 데워지는지 봅니다.'],
      surf: ['플라즈마 기체 · 레시피 변경 이력과 플라즈마 → 리플로우 대기 시간을 봅니다 — 대기 시간 한도를 정합니다.', '헹굼 · 건조 얼룩, 공기 중에 둔 시간을 lot마다 남깁니다. 표면 산화막은 XPS로 확인합니다.'],
      none: ['DSC로 실제 녹는 온도, 단면의 탄소 · 황(막 속 유기물), Ag % 맵, 도금액 나이 추세를 봅니다.', '도금 팀과 함께 봅니다 — 리플로우 조건을 더 올리면 IMC · 흘러내림만 늘 수 있습니다.']
    };
    const CELL = [['프로파일 기본', '+10 °C · +20초'], ['표면 그대로', '새 플라즈마 · 대기 0']];
    function ckCard(sel, tb){
      const e = EX[st.x], n = e.g.flat().filter(Boolean).length * 6, mine = MINE.has(e.tg);
      kpiLbl('k-s', '좋아진 쪽 (가정)', ''); ctx.out('k-s', {prof: '프로파일', surf: '새 플라즈마', none: '없음'}[st.x]); kpiCls('k-s', '');
      kpiLbl('k-n', '좋아진 웨이퍼', '중심점 빼고'); ctx.out('k-n', `${n} / 24장`); kpiCls('k-n', '');
      kpiLbl('k-mine', '원인 쪽', mine ? '리플로우-조건 — 내가 바꾼다' : st.x === 'none' ? '앞 공정(도금) — 그 팀과 함께' : '앞 공정 · 전처리 — 그 팀과 함께');
      ctx.out('k-mine', mine ? '리플로우' : '앞 공정'); kpiCls('k-mine', mine ? 'ok' : 'warn');
      sel.innerHTML = MSG[st.x];
      tb.innerHTML = `<div class="rf09-row"><b>칸별 결과 (이 가정에서)</b><table class="pl-tb rf09-ctb"><tr><th></th><th>${CELL[1][0]}</th><th>${CELL[1][1]}</th></tr>`
        + e.g.map((row, r) => `<tr><th>${CELL[0][r]}</th>${row.map(v => `<td class="${v ? 'ok' : 'ng'}">${v ? '좋아짐 6/6' : '그대로'}</td>`).join('')}</tr>`).join('') + '</table></div>'
        + `<div class="rf09-row"><b>읽는 법</b> 위 · 아래 줄을 견주면 리플로우 조건의 효과, 왼쪽 · 오른쪽 열을 견주면 표면(앞 공정 · 전처리)의 효과입니다. 둘 다 조금씩 좋아지면 원인이 겹친 것이고, 오른쪽 아래 칸만 좋아지면 둘을 함께 바꿔야 풀리는 경우입니다.</div>`
        + `<div class="rf09-row"><b>다음에 할 일</b><ol>${NEXT[st.x].map(t => `<li>${t}</li>`).join('')}</ol></div>`
        + '<div class="rf09-row"><b>설계 주의</b> 네 칸을 같은 장비 · 같은 판에서 순서를 섞어 흘리고, 측정용 웨이퍼를 함께 넣습니다. 같은 자리의 같은 범프를 리플로우 전 · 후로 읽습니다.</div>';
    }
    // ── 카드 (보는 방법에 따라)
    function card(){
      const m = st.mode, ck = ctx.step() === 'check';
      ctx.card.classList.toggle('rf09-ck', ck);                    // 확인 순서 단계: 고르기 칩 대신 결과 가정 버튼 · 칸별 결과
      ctx.card.querySelector('[data-g="dpick"]').classList.toggle('rf09-hide', m !== 'def');
      ctx.card.querySelector('[data-g="fpick"]').classList.toggle('rf09-hide', m === 'def');
      ctx.card.querySelector('[data-g="opick"]').classList.toggle('rf09-hide', m === 'def');
      setChips('k', ck ? '' : m === 'def' ? 'def' : 'fac');
      setChips('dpick', st.d || ''); setChips('fpick', m === 'fac' ? st.f : ''); setChips('opick', m === 'out' ? st.o : '');
      const sel = ctx.q('[data-o=sel]'), tb = ctx.q('[data-o=tb]');
      if (ck){ ckCard(sel, tb); return; }
      kpiLbl('k-s', '고른 것', ''); kpiCls('k-s', ''); kpiCls('k-n', '');
      if (m === 'def'){
        const d = st.d ? BY[st.d] : null;
        kpiLbl('k-n', '관련 인자 수', '그 불량의 결과로 이어진 인자');
        if (!d){ sel.innerHTML = '불량을 고르면 생김새 · 처음 보이는 단계 · 원인 후보가 나옵니다. 맵 무늬 단계에서는 그 불량이 잘 몰리는 무늬가 강조됩니다.'; tb.innerHTML = ''; ctx.out('k-s', '–'); ctx.out('k-n', '–'); ctx.out('k-mine', '–'); kpiLbl('k-mine', '내가 바꿀 수 있는 원인', '장비 · 분위기 · 조건 몫'); kpiCls('k-mine', ''); return; }
        const rel = INS.filter(f => f[3].some(e => d.out.includes(e[0])));
        ctx.out('k-s', d.sn); ctx.out('k-n', d.out.length ? `${rel.length}개` : '–');
        if (d.c.length){ const n = mineOf(d), p = Math.round(n / d.c.length * 100); ctx.out('k-mine', `${p} %`); kpiLbl('k-mine', '내가 바꿀 수 있는 원인', `후보 ${d.c.length}개 중 ${n}개`); kpiCls('k-mine', p >= 50 ? 'ok' : 'warn'); }
        else { ctx.out('k-mine', '–'); kpiLbl('k-mine', '내가 바꿀 수 있는 원인', '장비 · 분위기 · 조건 몫'); kpiCls('k-mine', ''); }
        sel.innerHTML = `<b>${d.nm}</b> — ${d.def}.` + (d.c.length ? ` 원인 후보 ${d.c.length}개 중 리플로우에서 바꿀 수 있는 것 ${mineOf(d)}개${mineOf(d) * 2 < d.c.length ? ' — <span class="bad">앞 · 뒤 공정과 함께 봅니다</span>' : ''}.` : '');
        const stH = d.st.length ? `<div class="rf09-row"><b>처음 보이는 단계</b> ${STG.map((t, j) => `<span class="rf09-st${d.st.includes(j) ? ' on' : ''}">${t}</span>`).join('')}</div>` : '';
        tb.innerHTML = stH + `<div class="rf09-row"><b>맵 무늬</b> ${d.map}</div>`
          + (d.c.length ? `<div class="rf09-row"><b>원인 후보</b>${d.c.map(([tg, tx]) => `<div class="rf09-li">${tagH(tg)}${tx}</div>`).join('')}</div>` : '')
          + `<div class="rf09-row"><b>${d.c.length ? '확인' : '무엇으로 재나'}</b><ol>${d.k.map(t => `<li>${t}</li>`).join('')}</ol></div>`
          + (d.f ? `<div class="rf09-row"><b>대책 방향</b> ${d.f}</div>` : '')
          + (rel.length ? `<div class="rf09-row"><b>관련 인자</b> (누르면 인자 지도로) <div class="rf09-rel">${rel.map(f => `<button data-rel="${f[0]}"><span class="rf09-tag ${f[2]}">${TS[f[2]]}</span>${f[1]}</button>`).join('')}</div></div>` : '');
      } else if (m === 'fac'){
        const f = INS[FI[st.f]], cnt = {L: 0, T: 0, D: 0};
        f[3].forEach(e => { cnt[e[2]]++; });
        kpiLbl('k-n', '영향 결과 수', `법칙 ${cnt.L} · 경향 ${cnt.T} · 조건 ${cnt.D}`);
        ctx.out('k-s', f[1]); ctx.out('k-n', `${f[3].length}개`);
        ctx.out('k-mine', MINE.has(f[2]) ? '예' : '아니오'); kpiLbl('k-mine', '내가 바꿀 수 있는 손잡이?', `꼬리표: ${TAG[f[2]]}`); kpiCls('k-mine', MINE.has(f[2]) ? 'ok' : 'warn');
        sel.innerHTML = `<b>${fname(f)}</b> ${tagH(f[2])} — 결과 ${f[3].length}개로 이어집니다.` + (MINE.has(f[2]) ? '' : ' <span class="bad">리플로우에서 바꾸는 손잡이가 아니라 받는 조건입니다 — 그 공정과 함께 봅니다.</span>');
        tb.innerHTML = `<div class="rf09-row">${f[3].map(([o, e, cf, tx]) => `<div class="rf09-li">· ${OUTS[OI[o]][1]}: <span class="${EFF[e][1]}t">${EFF[e][0]}</span> <span class="rf09-cf ${cf}">${CONF[cf]}</span> — ${tx}</div>`).join('')}</div>`
          + `<div class="rf09-row rf09-num"><b>앞 장 모델로 본 크기 (예시)</b> ${NUM[st.f]}</div>`;
      } else {
        const id = st.o, from = INS.filter(x => x[3].some(f => f[0] === id)), n = from.filter(x => MINE.has(x[2])).length;
        kpiLbl('k-n', '움직이는 인자 수', '꼬리표 5종으로 나눔');
        ctx.out('k-s', OUTS[OI[id]][1].split(' (')[0]); ctx.out('k-n', `${from.length}개`);
        // 손잡이 개수일 뿐 원인 확률이 아니므로 색 판정을 하지 않는다 (예: 보이드는 손잡이는 리플로우 쪽이 많아도 기체 출처는 앞 공정이 먼저)
        ctx.out('k-mine', `${n} / ${from.length}`); kpiLbl('k-mine', '리플로우 손잡이 수', '바꿀 수 있는 인자 개수 — 원인 확률 아님'); kpiCls('k-mine', '');
        sel.innerHTML = `<b>${OUTS[OI[id]][1]}</b> — 이 결과를 움직이는 인자는 ${from.length}개입니다. 꼬리표로 나눠 원인 후보를 세우고, 어느 것이 원인인지는 불량 타일의 원인 후보 · 맵 무늬 · 처음 보인 단계로 좁힙니다.`;
        tb.innerHTML = '<div class="rf09-row">' + CATS.map(tg => from.filter(x => x[2] === tg).map(x => { const e = x[3].find(y => y[0] === id); return `<div class="rf09-li">${tagH(tg)}${fname(x)}: <span class="${EFF[e[1]][1]}t">${EFF[e[1]][0]}</span> <span class="rf09-cf ${e[2]}">${CONF[e[2]]}</span> — ${e[3]}</div>`; }).join('')).join('') + '</div>';
      }
    }
    function render(){
      const d = st.d ? BY[st.d] : null;
      ctx.$$('.pl-def').forEach(g => g.classList.toggle('pl-sel', !!d && g.getAttribute('data-def') === d.id));
      ctx.$('[data-v="detail"]').innerHTML = detail(d);
      maps(); factor(); check(); card();
      ctx.refresh();
    }
    // 고르기 — 사용자가 누르면 그 단계로 옮긴다
    const pickD = id => { touched.d = true; st.d = id; st.mode = 'def'; const sid = ctx.step(); if (sid !== 'tiles' && sid !== 'map') ctx.go('tiles'); render(); };
    const pickF = id => { touched.f = true; st.f = id; st.o = null; st.mode = 'fac'; if (ctx.step() !== 'factor') ctx.go('factor'); render(); };
    const pickO = id => { touched.f = true; st.o = id; st.mode = 'out'; if (ctx.step() !== 'factor') ctx.go('factor'); render(); };
    ctx.card.querySelector('[data-g="dpick"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) pickD(b.dataset.v); });
    ctx.card.querySelector('[data-g="fpick"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) pickF(b.dataset.v); });
    ctx.card.querySelector('[data-g="opick"]').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) pickO(b.dataset.v); });
    ctx.card.querySelector('[data-o="tb"]').addEventListener('click', ev => { const b = ev.target.closest('button[data-rel]'); if (b) pickF(b.dataset.rel); });
    ctx.seg('k', (v, user) => {
      if (!user) return;
      if (v === 'def'){ st.mode = 'def'; if (ctx.step() === 'factor' || ctx.step() === 'check') ctx.go('tiles'); }
      else { st.mode = st.o ? 'out' : 'fac'; if (ctx.step() !== 'factor') ctx.go('factor'); }
      render();
    });
    ctx.seg('ex', (v, user) => { st.x = v; if (user){ touched.x = true; if (ctx.step() !== 'check') ctx.go('check'); } render(); });
    ctx.scene.addEventListener('click', ev => {
      const t = ev.target;
      const gd = t.closest && t.closest('.pl-def'), gi = t.closest && t.closest('.pl-in'), go = t.closest && t.closest('.rf09-out'), gm = t.closest && t.closest('.rf09-wm');
      if (gd) pickD(gd.getAttribute('data-def'));
      else if (gi) pickF(gi.getAttribute('data-in'));
      else if (go) pickO(go.getAttribute('data-out'));
      else if (gm){ /* 웨이퍼를 누르면 그 무늬가 잘 나오는 불량을 차례로 */ const i = +gm.getAttribute('data-m'), list = DEF.filter(d => d.pm.includes(i)); if (list.length) pickD(list[(list.findIndex(d => d.id === st.d) + 1) % list.length].id); }
    });
    // 손대지 않았으면 단계마다 예시 (tiles: 덜 둥긂 · map: 없음 · factor: 액상선 위 시간 · check: 프로파일만 좋아짐)
    ctx.demo = sid => {
      const dm = DEMO[sid] || {};
      if (!touched.d && 'd' in dm) st.d = dm.d;
      if (!touched.f && dm.f){ st.f = dm.f; st.o = null; }
      if (!touched.x && dm.x){ st.x = dm.x; setChips('ex', dm.x); }
      if (sid === 'tiles' || sid === 'map') st.mode = 'def';
      else if (sid === 'factor') st.mode = st.o ? 'out' : 'fac';
      render();
    };
    render();
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['처음 보이는 단계', '불량이 처음 검출된 검사 시점 — 리플로우 직후 외관 · 높이(3D) 측정 · X-ray · 단면 · 적층 뒤 · 신뢰성 시험 뒤. 원인 공정을 가장 빨리 좁힌다'],
      ['맵 무늬', '웨이퍼 위 불량 자리의 모양 — 가장자리 고리 · 한쪽 치우침 · 문 쪽 · 다이 반복 · 무작위'],
      ['공통점 찾기', '불량 웨이퍼가 함께 거친 장비 · 판 · 챔버 · 슬롯 · 도금 장비 · 액 · 대기 시간을 찾는 일'],
      ['나눠 흘리기 (DOE)', '같은 lot(함께 흘리는 웨이퍼 묶음, 보통 25장)을 나눠 한 가지씩만 바꿔 흘려 원인을 가르는 실험'],
      ['비용융처럼 보임', '리플로우 뒤에도 덜 녹은 듯 원기둥 · 쭈글쭈글한 모양. 실제로는 산화막 · 온도 부족 탓이 많다'],
      ['디웨팅', '한 번 젖었던 솔더가 물러나 아래 금속(베이스 상부 Cu · 코어 Ni)이 드러나는 것. 처음부터 안 젖은 것(비젖음, <a data-go="wet.angle">04장</a>)과 구분한다'],
      ['범프 누락 · 들뜸', '범프가 통째로 떨어졌거나 기둥 밑이 떠 기운 것. 리플로우 뒤 외관에서 처음 보여도 원인은 앞 공정(언더컷 · 접착 · 흡습)인 경우가 많다'],
      ['스폴링', 'IMC 조각이 계면에서 떨어져 솔더 속으로 들어간 것. Ni가 얇아져 거의 다 먹힐 무렵(코어 다이)이나, 얇은 Cu가 다 쓰여 솔더 속 Cu 양이 바뀔 때(베이스 다이 상부 Cu) 잘 보고된다']
    ]) + K.field([
      '같은 lot의 <b>정상 범프와 늘 함께</b> 보고, 리플로우 전 · 후 <b>같은 범프를 추적</b>합니다 — 원기둥일 때 이미 있던 것인지 가릅니다.',
      '리플로우에서 처음 보였어도 원인은 앞 공정인 경우가 많습니다(산화막 · 유기물 · 부피 · Ag %). 꼬리표로 나눠 생각합니다 → <a href="#go-plating-12">전해도금 12장</a> · <a href="#go-etch-09">시드 식각 9장</a> · <a href="#go-strip-08">PR 스트립 8장</a>.',
      '신뢰성 불량(IMC · Ag₃Sn · 커켄달)은 몇 주 뒤에 드러납니다. 리플로우 · 본딩 열 이력(녹인 횟수 · 시간 · 온도)을 lot마다 남겨 둡니다 → <a data-go="imc.budget">05장</a>.',
      '웨이퍼 맵은 도금 높이 · Ag % · 대기 시간 · 장비 슬롯 맵과 <b>겹쳐</b> 봅니다. 고리는 도금에서도, 리플로우 온도(휨 · 판 틈)에서도 생깁니다 → <a data-go="tool.plate">08장</a>.'
    ]) + K.deep(`<p><b>무엇으로 재나</b></p>
      <table class="pl-tb rf09-tbl"><tr><th>보는 것</th><th>측정</th><th>주의</th></tr>
      <tr><td>모양 · 광택 · 변색</td><td>자동 광학 검사 (AOI)</td><td>변색 · 흐림은 높이 측정값도 흔든다</td></tr>
      <tr><td>돔 높이 · 동일평면성</td><td>3D (공초점 · 백색광 간섭)</td><td>꼭대기 vs 평균 — 측정 정의를 통일</td></tr>
      <tr><td>보이드</td><td>X-ray → 단면 · FIB(이온빔으로 깎은 단면) · 3D X-ray</td><td>2D X-ray는 수 µm를 놓치기 쉬움</td></tr>
      <tr><td>IMC · 남은 금속(Ni · 상부 Cu) · Ag₃Sn</td><td>단면 SEM · SEM-EDS(X선 성분 분석) · EBSD(결정 방향)</td><td>한 범프의 한 면 — 표본 위치를 정해 둔다</td></tr>
      <tr><td>Ag % · 도금 두께</td><td>XRF (X선 형광)</td><td>도금 맵 · 불량 맵과 겹쳐 본다</td></tr>
      <tr><td>표면 산화막</td><td>XPS · 오제 (겉 몇 nm의 성분)</td><td>공기에 둔 시간에 따라 값이 바뀐다 — 대기 시간을 함께 적는다</td></tr>
      <tr><td>실제 녹는 온도</td><td>DSC (열 흐름으로 녹는 온도를 잼)</td><td>범프 여러 개를 모아야 신호가 나온다</td></tr></table>
      <ul><li><b>비용융 세 원인 가르기</b> — ① 온도 부족: 가장자리 · 휜 웨이퍼에 몰림, 측정용 웨이퍼로 확인, 같은 웨이퍼를 +10 °C로 다시 녹이면 둥글어짐. ② 산화막: lot · 대기 시간과 함께, 새로 플라즈마 처리 · 환원을 세게 하면 둥글어짐, XPS로 산화막 두께(<a data-go="oxide.film">03장</a>). ③ 조성 · 유기물: 도금액 나이 · Ag % 맵과 겹침, 다시 녹여도 잘 안 됨, DSC로 실제 녹는 온도 · 단면 탄소. 겉모양만으로는 가르기 어려워 교차 실험이 가장 빠릅니다.</li>
      <li><b>가장자리 고리 세분</b> — 판 방식: 휨(가장자리 틈↑ → 열 지연↑) · 핀 높이 · 판 가장자리 온도 낮음. 휨 방향에 따라 늦게 데워지는 곳이 가장자리일 수도, 가운데일 수도 있습니다(가운데가 들린 돔 모양 휨 → 가운데 무늬 · 변색). 휨은 막 종류에 따라 방향이 정해지고 가열 중에도 바뀌므로, 맵 무늬를 휨 측정(방향 · 크기 · 가열 중 변화)과 함께 봅니다. 대류 방식은 가장자리 바람 · 이송 방향, 도금 쪽은 가장자리 두께(<a href="#go-plating-07">전해도금 7장</a>) · Ag %(<a href="#go-plating-10">10장</a> — 가장자리는 보통 두껍고 Ag가 낮음). 같은 고리라도 리플로우 전 높이 맵에 이미 있으면 도금 쪽입니다.</li>
      <li><b>판정 측정의 한계</b> — 2D X-ray는 수 µm 보이드를 놓치기 쉽고, 광학 높이 측정은 광택(변색) · 돔 기울기에 따라 값이 흔들립니다. 단면은 범프 하나의 한 면만 봅니다 — 표본 위치(가운데 · 가장자리 · 다이 안 고립 · 밀집)를 정해 둡니다.</li>
      <li><b>IMC · Ag₃Sn은 열 이력의 함수</b> — 웨이퍼 리플로우 단독(예시 IMC — 코어 다이 Ni₃Sn₄ 약 1 µm · 베이스 다이 Cu₆Sn₅ 약 2 µm)으로는 문제없어도 본딩 · 적층 · 시험을 더하면 넘을 수 있습니다. 본딩 뒤에는 위 · 아래 두 계면에서 Sn이 줄어 남은 솔더의 Ag가 진해집니다(예시: 녹이는 횟수 1 → 3회면 Sn 소모 코어 약 7 → 20 % · 베이스 약 12 → 26 %, 실효 Ag 코어 약 2.7 → 3.1 % · 베이스 약 2.8 → 3.4 %). 05 · 06장 위젯에 '녹이는 횟수'를 실제 공정 수로 넣어 예산을 미리 봅니다(<a data-go="imc.budget">05장</a> · <a data-go="solid.ag3sn">06장</a>).</li>
      <li><b>보이드는 자리로 출처를 읽는다</b> — 떠 있는 기포는 몇 초 안에(지름 5 µm 약 0.3초) 빠지므로 남은 보이드는 거의 모두 어딘가에 붙어 있던 것입니다. 바닥 계면에 붙어 있으면 층 사이 찌꺼기 · 대기(앞 공정), 솔더 속에 흩어져 있으면 막 속 유기물, 겉 가까이면 플럭스 기체를 먼저 봅니다. 수 µm 기포는 진공에서 지름이 10 % 안팎만 커지므로 대책 순서는 기체 출처 줄이기 > 액상선 위 시간 > 진공입니다(<a data-go="void.where">07장</a>).</li>
      <li><b>위스커를 뺀 이유</b> — Sn 위스커는 주로 순수 Sn 무광 도금 마감의 문제입니다. 리플로우된 SnAg 마이크로범프는 합금이고, 녹았다 굳었으며, 언더필 · 몰드로 덮여 위험이 낮은 편이라 이 장 불량 목록에서 뺐습니다(<a href="#go-plating-10">전해도금 10장</a>).</li>
      <li><b>교차 실험 설계 예</b> — lot 25장을 2 × 2(프로파일 기본 / +10 °C · +20초 × 표면 그대로 / 새 플라즈마 · 대기 0) × 6장 + 중심점 1장으로 나누고, 같은 위치(가운데 · 가장자리 · 고립 다이)의 같은 범프를 외관 · 높이 · 단면으로 읽습니다. 측정용 웨이퍼를 같은 묶음에 함께 흘립니다. 네 칸을 모두 같은 장비 · 같은 판에서 순서를 섞어 흘려야 장비 차이 · 시간 순서가 조건 효과에 섞이지 않습니다. 위 · 아래 줄 차이가 리플로우 조건의 효과, 왼쪽 · 오른쪽 열 차이가 표면의 효과이고, 둘 다 조금씩 있으면 원인이 겹친 것입니다.</li></ul>`);
  },
  css: `.pl-svg .rf09-tg.rf09-off{fill:none;stroke:rgba(148,163,184,.45);stroke-width:1.2;stroke-dasharray:3 3}
.pl-svg .rf09-tg.eq{fill:rgba(248,113,113,.38)}
.pl-svg .rf09-tg.atm{fill:rgba(56,189,248,.36)}
.pl-svg .rf09-tg.cond{fill:rgba(45,212,191,.34)}
.pl-svg .rf09-tg.up{fill:rgba(167,139,250,.40)}
.pl-svg .rf09-tg.dn{fill:rgba(245,158,11,.36)}
.pl-svg .rf09-tgt{font-size:17px;font-weight:800;fill:#f1f5f9 !important;text-anchor:middle;stroke:none !important}
.pl-svg .rf09-tgt.rf09-off{fill:#5b6b82 !important;font-weight:600}
.pl-svg .rf09-lgt{font-size:19px;font-weight:800;fill:#cbd5e1 !important}
.pl-svg .rf09-def{font-size:19px;fill:#e2e8f0 !important}
.pl-svg .rf09-map{font-size:19px;fill:#c4b5fd !important}
.pl-svg .rf09-h{font-size:19px;font-weight:800;fill:#fcd34d !important}
.pl-svg .rf09-h2{font-size:21px;font-weight:800;fill:#fcd34d !important}
.pl-svg .rf09-stc{fill:none;stroke:rgba(148,163,184,.3);stroke-width:1.2}
.pl-svg .rf09-stc.on{fill:rgba(245,158,11,.85);stroke:#fbbf24}
.pl-svg .rf09-stt{font-size:18px;font-weight:700;fill:#64748b !important;text-anchor:middle;stroke:none !important}
.pl-svg .rf09-stt.on{fill:#1b1203 !important;font-weight:900}
.pl-svg .rf09-tx{font-size:19px;fill:#cbd5e1 !important}
.pl-svg .rf09-com{fill:#fde68a !important;font-weight:700}
.pl-svg .rf09-more{font-size:19px;fill:#94a3b8 !important}
.jz.pl.pres .pl-svg .rf09-more{display:none}
.pl-svg .rf09-note{font-size:19px;font-weight:700;fill:#fde68a !important}
.pl-svg .rf09-gl{fill:none;stroke:rgba(255,255,255,.75);stroke-width:2.2;stroke-linecap:round}
.pl-svg .rf09-dull{fill:#8b95a5;stroke:#64748b;stroke-width:.8}
.pl-svg .rf09-oxl{fill:none;stroke:#cbd5e1;stroke-width:2.6;stroke-dasharray:4 2}
.pl-svg .rf09-bare{fill:#f1f5f9;stroke:#38bdf8;stroke-width:1}
.pl-svg .rf09-imcd{fill:none;stroke:#b98a4e;stroke-width:2.4;stroke-dasharray:3 3}
.pl-svg .rf09-ngl{fill:none;stroke:#f87171;stroke-width:2.6}
.pl-svg .rf09-dim{fill:none;stroke:#fbbf24;stroke-width:2.6}
.pl-svg .rf09-tarn{fill:#c9b37a;stroke:#8a7444;stroke-width:.8}
.pl-svg .rf09-ir1{fill:none;stroke:#a78bfa;stroke-width:2.4;opacity:.9}
.pl-svg .rf09-ir2{fill:none;stroke:#2dd4bf;stroke-width:2.2;opacity:.85}
.pl-svg .rf09-cuox{fill:#a0522d;opacity:.9}
.pl-svg .rf09-film{fill:none;stroke:rgba(217,160,90,.9);stroke-width:2.6}
.pl-svg .rf09-char{fill:#7a4b22;stroke:#d4a15a;stroke-width:1}
.pl-svg .rf09-waf{fill:#1c2a40;stroke:#64748b;stroke-width:1.6}
.pl-svg .rf09-waf2{fill:none;stroke:#64748b;stroke-width:1.6}
.pl-svg .rf09-ring{fill-opacity:.42;stroke:rgba(15,23,42,.5);stroke-width:1}
.pl-svg .rf09-grid{fill:none;stroke:rgba(148,163,184,.22);stroke-width:1}
.pl-svg .rf09-notch{fill:#0b1222;stroke:#64748b;stroke-width:1}
.pl-svg .rf09-dot{stroke:#fecaca;stroke-width:.6}
.pl-svg .rf09-alt{fill:none;stroke:#fbbf24;stroke-width:2;stroke-dasharray:6 5;opacity:.85}
.pl-svg .rf09-door{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .rf09-mring{fill:none;stroke:none}
.pl-svg .rf09-wm.rf09-mon .rf09-mring{stroke:#f59e0b;stroke-width:4}
.pl-svg .rf09-wm.rf09-mon .rf09-mn{fill:#fcd34d !important}
.pl-svg .rf09-wm{cursor:pointer}
.pl-svg .rf09-mn{font-size:22px;font-weight:800;fill:#e2e8f0 !important}
.pl-svg .rf09-chip{fill:rgba(30,41,59,.85);stroke:rgba(148,163,184,.35);stroke-width:1}
.pl-svg .rf09-chip.on{fill:rgba(245,158,11,.85);stroke:#fbbf24}
.pl-svg .rf09-chipt{font-size:19px;font-weight:700;fill:#e2e8f0 !important;text-anchor:middle;stroke:none !important}
.pl-svg .rf09-chipt.on{fill:#1b1203 !important;font-weight:900}
.pl-svg .rf09-out{cursor:pointer}
.pl-svg .rf09-out.pl-sel .pl-outb{stroke:#f59e0b;stroke-width:3;fill:rgba(40,30,10,.7)}
.pl-svg .rf09-ot{font-size:19px}
.pl-svg .rf09-rev{fill:#fde68a !important;font-weight:700}
.pl-svg .pl-edge.on.rf09-T{stroke-dasharray:14 9}
.pl-svg .pl-edge.on.rf09-D{stroke-dasharray:4 8}
.pl-svg .rf09-lg{font-size:19px;fill:#cbd5e1 !important}
.pl-svg .rf09-ls{fill:none;stroke:#e2e8f0;stroke-width:4}
.pl-svg .rf09-ls.rf09-T{stroke-dasharray:10 7}
.pl-svg .rf09-qc{fill:#2e1065;stroke:#c4b5fd;stroke-width:2}
.pl-svg .rf09-qt{font-size:18px;font-weight:900;fill:#ede9fe !important;text-anchor:middle;stroke:none !important}
.pl-svg .pl-box.rf09-nbox{fill:#0a1222;fill-opacity:.97;stroke:rgba(245,158,11,.45)}
.pl-svg .rf09-nl{font-size:19px;font-weight:800;fill:#fcd34d !important}
.pl-svg .rf09-n19{font-size:19px;fill:#e2e8f0 !important}
.pl-svg .rf09-numc{fill:rgba(56,189,248,.18);stroke:#38bdf8;stroke-width:2}
.pl-svg .rf09-numt{font-size:24px;font-weight:900;fill:#7dd3fc !important}
.pl-svg .rf09-wd{fill:#334155;stroke:#94a3b8;stroke-width:1.4;transition:fill .4s}
.pl-svg .rf09-wd.ok{fill:rgba(34,197,94,.75);stroke:#86efac}
.pl-svg .rf09-wd.ng{fill:rgba(239,68,68,.6);stroke:#fca5a5}
.pl-svg .rf09-wd.mid{fill:#64748b;stroke:#cbd5e1}
.pl-svg .rf09-sq.ok{fill:rgba(34,197,94,.75)}
.pl-svg .rf09-sq.ng{fill:rgba(239,68,68,.6)}
.pl-svg .rf09-cok{font-size:21px;font-weight:800;fill:#86efac !important}
.pl-svg .rf09-cng{font-size:21px;font-weight:700;fill:#fca5a5 !important}
.pl-svg .rf09-concl{font-size:21px;font-weight:800;fill:#fde68a !important}
.jc .rf09-hide{display:none}
.jc.rf09-ck [data-g="dpick"],.jc.rf09-ck [data-g="fpick"],.jc.rf09-ck [data-g="opick"]{display:none}
.jc:not(.rf09-ck) .rf09-ex{display:none}
.jc table.rf09-ctb{margin-top:4px;font-size:12px}
.jc table.rf09-ctb th,.jc table.rf09-ctb td{text-align:center;word-break:keep-all;padding:3px 6px}
.jc table.rf09-ctb td.ok{background:rgba(34,197,94,.22);color:#86efac;font-weight:800}
.jc table.rf09-ctb td.ng{background:rgba(239,68,68,.18);color:#fca5a5}
.jc .rf09-tag{display:inline-block;font-size:11px;font-weight:800;border-radius:6px;padding:0 6px;margin-right:4px;vertical-align:1px}
.jc .rf09-tag.eq{background:rgba(248,113,113,.2);color:#fca5a5}
.jc .rf09-tag.atm{background:rgba(56,189,248,.2);color:#7dd3fc}
.jc .rf09-tag.cond{background:rgba(45,212,191,.2);color:#5eead4}
.jc .rf09-tag.up{background:rgba(167,139,250,.22);color:#c4b5fd}
.jc .rf09-tag.dn{background:rgba(245,158,11,.2);color:#fcd34d}
.jc.rf09-card .steps li.open em{min-height:72px}
.jc .rf09-tb{font-size:12.6px;line-height:1.6;color:#e2e8f0;height:300px;overflow-y:auto;padding-right:4px;overscroll-behavior:contain;margin-top:4px}
.jc .rf09-tb b{color:#fde68a}
.jc .rf09-row{margin-top:5px}
.jc .rf09-li{margin:2px 0 2px 2px}
.jc .rf09-tb ol{margin:2px 0 0;padding-left:18px}
.jc .rf09-tb ol li:first-child{color:#fde68a}
.jc .rf09-st{display:inline-block;font-size:11px;border:1px solid rgba(148,163,184,.3);border-radius:6px;padding:0 5px;margin:1px 2px;color:#64748b}
.jc .rf09-st.on{background:rgba(245,158,11,.85);border-color:#fbbf24;color:#1b1203;font-weight:800}
.jc .rf09-cf{font-size:10.5px;border-radius:5px;padding:0 4px;border:1px solid rgba(148,163,184,.35);color:#cbd5e1}
.jc .rf09-cf.L{border-style:solid;color:#f1f5f9}
.jc .rf09-cf.T{border-style:dashed}
.jc .rf09-cf.D{border-style:dotted;color:#c4b5fd}
.jc .rf09-num{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.3);border-radius:8px;padding:4px 8px}
.jc .rf09-rel{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
.jc .rf09-rel button{font:inherit;font-size:11.8px;border:1px solid var(--j-line);background:rgba(30,41,59,.8);color:#dbe5f2;border-radius:8px;padding:2px 7px;cursor:pointer}
.jc .rf09-rel button:hover{border-color:var(--j-acc)}
.jc .rf09-sel{min-height:42px}
.jc table.rf09-tbl th,.jc table.rf09-tbl td{word-break:keep-all}`
});
})();
