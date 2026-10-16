/* PR 스트립 01 — 왜 걷어 내나: PR 틀은 어디까지 없애야 할까 (웨이퍼 · 범프 · 수십 µm) */
(function(){
// 그림 예시 범프 (plans/stack.md · shared.md (a)): 베이스 다이 범프 — 지름 25 · 피치 55 µm (틈 30),
//   Cu 기둥 12 + Ni 3 + 상부 Cu 3 + SnAg 12 µm (= 30 µm), PR 35 µm. 코어 다이 범프(Ni 5 + SnAg 12 = 17 µm)는 글로만 짚는다
const S = 7;                                             // 1 µm = 7 px (단면 그림)
const DIA = 25, PITCH = 55, GAP = 30, HCU = 12, HNI = 3, HUC = 3, HSN = 12, HPR = 35;
const X0 = 60, X1 = 830;                                 // 단면 가로 범위 (반 틈 + 범프 + 틈 + 범프 + 반 틈)
const BX = [X0 + GAP / 2 * S, X0 + (GAP / 2 + PITCH) * S]; // 범프 왼쪽 x (165 · 550)
const BW = DIA * S;                                      // 범프 폭 175
const CX = BX.map(x => x + BW / 2);                      // 범프 가운데 (252.5 · 637.5)
const BASE = 1006;                                       // 시드 Cu 윗면
const YCU = BASE - HCU * S, YNI = YCU - HNI * S, YUC = YNI - HUC * S, YSN = YUC - HSN * S, PRT = BASE - HPR * S;   // 922 · 901 · 880 · 796 · 761
const PRSEG = [[X0, BX[0]], [BX[0] + BW, BX[1]], [BX[1] + BW, X1]];                    // PR 세 토막
const RX = 1120, RW = 450, RY = 120, RH = 680;           // 오른쪽 패널
const MB = {x: 1120, y: 816, w: 450, h: 290};            // 계량 상자 (위젯이 그린다)
const RHO = 1.15;                                        // PR 밀도 (g/cm³, 예시 — 수지에 따라 약 1.1~1.25)
const PIT = {n: [40, 22], m: [55, 25], w: [100, 50]};    // 범프 간격 예시: [피치, 지름] µm
// 손대지 않았을 때 단계마다 보여 줄 위젯 값 (발표 모드 대비)
const DEMO = {frame: {t: 35, f: 20, e: 2, p: 'm'}, next: {t: 35, f: 20, e: 2, p: 'n'}, keep: {t: 35, f: 20, e: 2, p: 'm'}, handoff: {t: 60, f: 20, e: 2, p: 'm'}};
const STEPS = ['frame', 'next', 'keep', 'handoff'];
// 좁은 세로 화면 전용 확대: 단면(+층 이름) 또는 오른쪽 패널
const VN_SEC = {x: 30, y: 130, w: 1080, h: 994}, VN_PAN = {x: 1110, y: 112, w: 470, h: 696};

(window.EngrStripChapters = window.EngrStripChapters || []).push({
  no: '01', id: 'why', part: 1, short: '왜 걷어 내나', scale: '웨이퍼 · 범프 · 수십 µm',
  title: '왜 걷어 내나 — PR 틀은 어디까지 없애야 할까?',
  hook: '틀은 식각 전에 다 사라져야',
  one: '전해도금이 끝나면 범프 모양을 잡아 준 두꺼운 PR 틀은 할 일을 다 했습니다. 이 틀을 남김없이 걷어 내야 범프 사이 시드를 식각해 범프끼리 떼어 놓을 수 있습니다. 걷어 내는 동안 이미 만든 범프와 얇은 시드는 다치지 않아야 합니다.',
  ana: '<b>콘크리트 거푸집</b>과 같습니다. 거푸집(PR) 안에 콘크리트(금속)를 부어 기둥을 세운 뒤, 거푸집을 떼어 내야 다음 일(시드 식각)을 할 수 있습니다. <i>(비유의 한계: 거푸집은 손으로 뜯지만 PR은 약품으로 녹이거나 부풀려 떼고, 그 약품이 기둥(금속)도 조금 건드릴 수 있습니다. 또 기둥 아래 얇은 시드는 범프끼리 이어 주는 전기 길이라, PR이 걷힌 뒤 따로 지워야 합니다.)</i>',
  steps: [
    {id: 'frame', t: '틀의 일 — 도금 동안 모양을 잡았다', d: '도금 동안 PR은 범프 자리만 뚫린 틀이었습니다. 금속은 열린 구멍에만 쌓였고, 나머지 시드는 PR이 액에서 가려 주었습니다. 이제 틀은 할 일을 다 했고, 다음 공정을 위해 비켜 줘야 합니다.', viewN: VN_SEC},
    {id: 'next', t: '걷어 내는 이유 — 다음은 시드 식각', d: '범프들은 아직 얇은 시드(Cu · Ti)로 모두 이어져 있습니다. 시드 식각액이 범프 사이 시드에 닿으려면 PR이 남김없이 없어져야 합니다. PR이 남은 자리는 그 아래 시드가 식각되지 않고 남을 수 있고, 남은 시드가 이웃 범프까지 이어지면 단락입니다.', viewN: VN_PAN},
    {id: 'keep', t: '없앨 것과 지킬 것', d: 'PR만 없애고 범프와 시드는 지켜야 합니다. 범프 금속은 베이스 다이 Cu 기둥 · Ni · 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu) · SnAg, 코어 다이 Ni · SnAg입니다. 한쪽만 골라 없애는 정도가 선택비(PR 제거 속도 ÷ 금속 손실 속도)이고, 녹이는 힘과 지키는 힘은 자주 부딪힙니다.', viewN: VN_SEC},
    {id: 'handoff', t: '앞뒤로 주고받는 것', d: '받는 것은 도금을 거친 PR 틀과 도금액 흔적, 넘기는 것은 깨끗한 시드와 다치지 않은 범프입니다. 스트립 결과는 시드 식각(잔여 · 단락 · 언더컷)과 리플로우(젖음 · 모양)에서 다시 드러납니다.', viewN: VN_PAN}
  ],
  icon(K){
    const {R, P} = K;
    return R(8, 38, 48, 14, 'f-si') + R(8, 36, 48, 3, 'f-seed2') + P('M8,36 L8,18 L20,16 L20,36 Z', 'f-pr') + R(24, 27, 16, 9, 'f-cu2') + R(24, 24, 16, 3, 'f-ni') + R(24, 21, 16, 3, 'f-cu2') + R(24, 12, 16, 9, 'f-sn2') +
      R(44, 10, 12, 20, 'f-pr', {transform: 'rotate(25 50 20)'}) + P('M44,34 L50,30 M48,36 L56,32', 's-arr');
  },
  draw(K){
    const {R, C, L, P, PG, T, TT, G, LB, tip, only, on, W, wrap, arrow, ionPath} = K;
    let s = '';
    /* ---------- 왼쪽 단면 — 액(단계별)은 PR · 범프 뒤에 ---------- */
    // 도금 동안의 도금액 (frame)
    s += G(R(X0, 226, X1 - X0, YSN - 226 + 4, 'f-bath', tip('도금액 — 도금 동안 웨이퍼가 담겨 있던 액')) + T(X0 + 18, 258, '도금액 (도금 동안)', 't-dim', 'start'), only('frame'));
    // 스트리퍼 (next · keep) — PR이 옅어지면 PR 자리까지 액이 보인다
    s += G(R(X0, 226, X1 - X0, BASE - 226, 'f-strip', tip('스트리퍼 — PR을 녹이거나 부풀려 떼어 내는 약품 (보통 60~80 °C로 데워 쓴다 → 04장)')) + T(X0 + 18, 258, '스트리퍼 — PR을 녹이거나 부풀려 떼어 낸다 (보통 60~80 °C)', 't-dim', 'start'), only('next keep'));
    // 바닥: Si · 보호막 · 패드 · Ti · 시드 Cu
    s += R(X0, 1034, X1 - X0, 54, 'f-si', tip('칩 (실리콘) — 안에 회로와 배선이 있다'));
    s += R(X0, 1022, X1 - X0, 12, 'f-pas', tip('보호막(패시베이션) — 스트립 동안은 시드가 덮고 있어 액에 닿지 않는다'));
    BX.forEach(x => { s += R(x + 18, 1022, BW - 36, 12, 'f-al', tip('패드 — 범프 아래 보호막이 열린 자리 (칩 안 배선과 이어진다)')); });
    s += R(X0, 1016, X1 - X0, 6, 'f-ti', tip('Ti — 시드 아래 접착 · 방벽층 (예시 100 nm — 그림은 크게 과장)'));
    s += R(X0, BASE, X1 - X0, 10, 'f-seed2', tip('시드 Cu (예시 300 nm) — 범프끼리 아직 이어 주는 전기 길. 스트립 뒤 시드 식각으로 지운다.\n실제 수백 nm — 그림은 과장'));
    // 범프 둘 — 베이스 다이 범프 (Cu 기둥 · Ni · 상부 Cu · SnAg, 실제 비율)
    BX.forEach(x => {
      s += R(x, YCU, BW, BASE - YCU, 'f-cu2', tip('Cu 기둥 — 높이 · 전기 (예시 12 µm) · 열도 나른다'));
      s += R(x, YNI, BW, YCU - YNI, 'f-ni', tip('Ni — Cu 기둥과 솔더 사이 방벽 (예시 3 µm)'));
      s += R(x, YUC, BW, YNI - YUC, 'f-cu2', tip('상부 Cu — 솔더가 처음 만나는 면 · IMC를 Cu₆Sn₅ 쪽으로 (예시 3 µm)\nNi 위에 얇게 한 번 더 올린 Cu. PR이 걷히면 Ni와 SnAg 사이 얇은 띠로 액에 닿는다'));
      s += R(x, YSN, BW, YUC - YSN, 'f-sn2', tip('SnAg — 녹아서 붙는 솔더 (예시 12 µm, 리플로우 전 원기둥) — 리플로우 때 녹아 둥글어진다'));
    });
    s += T(X0, 1112, '그림 = 베이스 다이 범프 (예시) · 코어 다이 범프는 Ni · SnAg (Cu 기둥 없음)', 't-dim', 'start', tip('베이스 다이 Cu 기둥 12 + Ni 3 + 상부 Cu 3 + SnAg 12 = 30 µm\n코어 다이 Ni 5 + SnAg 12 = 17 µm (같은 지름 25 µm, 예시)'));
    // PR 틀 — frame · keep 은 그대로, next 는 반복해서 옅어짐, handoff 에서는 없음
    const prTip = tip('PR 틀 (예시 35 µm) — 도금 동안 범프 자리만 열려 있었다. 이제 걷어 낼 차례');
    const prs = PRSEG.map(([a, b]) => R(a, PRT, b - a, BASE - PRT, 'f-pr', prTip)).join('');
    s += G(prs, only('frame keep'));
    s += G(G(prs + '<animate attributeName="opacity" values="1;1;.12;.12;1" keyTimes="0;.3;.5;.85;1" dur="6s" repeatCount="indefinite"/>'), only('next'));
    // keep: 없앨 것(빨강 점선) · 지킬 것(초록 테두리)
    let kp = PRSEG.map(([a, b]) => R(a + 3, PRT + 3, b - a - 6, BASE - PRT - 6, 'st01-kill')).join('');
    BX.forEach(x => { kp += R(x + 2, YSN + 2, BW - 4, BASE - YSN - 4, 'st01-keep'); });
    kp += R(X0 + 2, BASE + 1, X1 - X0 - 4, 30, 'st01-keep');
    PRSEG.forEach(([a, b]) => { kp += T((a + b) / 2, 985, '✕', 'st01-x'); });     // 층 이름 지시선(오른쪽 토막을 지나감) 아래
    s += G(kp, W(only('keep'), tip('빨간 점선 = 없앨 것 (PR) · 초록 테두리 = 지킬 것 (범프 · 시드 · 보호막)')));

    /* ---------- 단계별: 단면 위 빈자리 ---------- */
    // frame — 열린 구멍에만 금속이 쌓였다 (마지막 층 SnAg 가 쌓이는 모습)
    let f = T(70, 158, '도금 동안 — 열린 구멍에만 금속이 쌓였다', 't-acc', 'start') + T(70, 190, 'PR이 덮은 곳의 시드는 액에 닿지 않아 도금되지 않았다', 't-dim', 'start');
    let io = '';
    CX.forEach((cx, i) => {
      io += arrow(cx, 330, cx, 700, 's-arr', {opacity: .55});
      [-1, 0, 1].forEach((d, k) => {
        const x0 = cx + d * 60, kind = k === 1 && i === 0 ? 'ag' : 'sn';
        io += ionPath(`M${x0},${300 + k * 22} C${x0 + d * 30},${450} ${cx + d * 24},${640} ${cx + d * 34},${YSN - 14}`, kind, 3.6 + k * 0.5, k * 1.1 + i * 0.6, tip(kind === 'ag' ? 'Ag⁺ — SnAg 솔더의 Ag (보통 1.5~2.5 wt%)' : 'Sn²⁺ — 도금의 마지막 층(SnAg)이 열린 구멍에만 쌓인다'));
      });
    });
    // PR 위로 온 이온은 쌓일 곳이 없다 (되돌아감)
    [[445, 2], [112, 3], [778, 4]].forEach(([x, k]) => { io += ionPath(`M${x - 20},${330} Q${x},${PRT - 40} ${x},${PRT - 22} Q${x + 10},${PRT - 60} ${x + 34},${360}`, 'sn', 4.2, k * 0.7, tip('PR 위에는 금속이 쌓이지 않는다 — 아래 시드가 가려져 전기가 닿지 않는다')); });
    f += G(io);
    // 치수 (그림 예시)
    const dimH = (x1, x2, y, label) => P(`M${x1 + 4},${y} L${x2 - 4},${y}`, 's-arr2', W(K.mk('s-arr2'), {'marker-start': K.url('arr-a')})) + P(`M${x1},${y - 10} L${x1},${y + 10} M${x2},${y - 10} L${x2},${y + 10}`, 's-acc2') + LB(T((x1 + x2) / 2, y - 12, label, 't-warn'));
    f += dimH(BX[0], BX[0] + BW, 738, '지름 25 µm');
    f += dimH(BX[0] + BW, BX[1], 738, '틈 30 µm');
    f += P(`M74,${PRT + 6} L74,${BASE - 6}`, 's-arr2', W(K.mk('s-arr2'), {'marker-start': K.url('arr-a')})) + LB(T(88, 870, 'PR', 't-lbl', 'start') + T(88, 900, '35 µm', 't-sub', 'start'));
    f += LB(T(445, 900, 'PR이 가림', 't-sub'));
    s += G(f, only('frame'));

    // next — 범프들은 아직 시드로 이어져 있다
    let n = T(70, 158, '다음은 시드 식각 — 범프들은 아직 시드로 모두 이어져 있다', 't-acc', 'start') + T(70, 190, 'PR이 남김없이 걷혀야 식각액이 범프 사이 시드에 닿는다', 't-dim', 'start');
    n += R(X0 - 2, BASE - 3, X1 - X0 + 4, 22, 'st01-seedhl');
    n += P(`M${X0 + 6},${BASE + 5} L${X1 - 6},${BASE + 5}`, 's-flow2', tip('시드 = 전기 길 — 이웃 범프가 모두 시드로 이어져 있다 (전기로는 아직 한 덩어리)'));
    n += arrow(445, 470, 445, BASE - 8, 's-arr2', {'stroke-dasharray': '10 7'});
    n += LB(T(445, 420, '다음 공정의 식각액이', 't-warn') + T(445, 450, '닿아야 할 곳 — 범프 사이 시드', 't-warn'));
    s += G(n, only('next'));

    // keep — 시드는 얼마나 얇은가 (발밑 확대)
    let kz = T(70, 158, '없앨 것은 PR 하나 — 나머지는 모두 지킨다', 't-acc', 'start') + T(70, 190, '한쪽만 골라 없애는 정도 = 선택비 (오른쪽 시소)', 't-dim', 'start');
    kz += TT(78, 330, wrap('시드는 Ti 100 nm 위 Cu 300 nm (예시). Cu 시드는 범프 높이 30 µm의 1/100입니다.', 14), 't-sub', 'start', 30);
    kz += TT(78, 450, wrap('PR은 수십 µm를 없애야 하고, 시드는 nm 단위로 지켜야 합니다.', 14), 't-sub', 'start', 30);
    kz += T(78, 556, '→ 아주 큰 선택비가 필요', 't-warn', 'start');
    // 지킬 범프 금속은 다이마다 다르다 (PR이 걷히면 범프 옆면이 처음 액에 닿는다 → 07장)
    kz += G(T(78, 626, '지킬 범프 옆면 — 다이마다 다르다', 't-sub', 'start') + T(78, 656, '베이스: Cu 기둥 · Ni · 상부 Cu 띠 · SnAg', 't-dim', 'start') + T(78, 682, '코어: Ni · SnAg (범프에 Cu 없음)', 't-dim', 'start'),
      tip('PR이 걷히면 범프 옆면이 처음 액에 닿는다.\n베이스 다이: Cu 기둥 옆면, 그리고 Ni와 SnAg 사이의 얇은 상부 Cu 띠(3 µm)가 아민 · 알칼리에 먹힐 수 있다 — 띠가 얇아 조금만 먹혀도 홈\n코어 다이: 옆면은 Ni(비교적 강함) · SnAg(알칼리에 약함)뿐\n두 다이 모두 범프 사이 Cu 시드는 드러난다 (→ 07장)'));
    const Z = {x: 600, y: 452, r: 168}, ZS = 470, ZPX = 100;        // 확대 원: 1 µm = 100 px, 시드 Cu 윗면 y 470, 범프 왼쪽 벽 x 600
    let zi = R(Z.x - Z.r, Z.y - Z.r, Z.r, ZS - (Z.y - Z.r), 'f-pr') + R(Z.x, Z.y - Z.r, Z.r, ZS - (Z.y - Z.r), 'f-cu2');
    zi += R(Z.x - Z.r, ZS, 2 * Z.r, 0.3 * ZPX, 'f-seed2') + R(Z.x - Z.r, ZS + 0.3 * ZPX, 2 * Z.r, 0.1 * ZPX, 'f-ti') + R(Z.x - Z.r, ZS + 0.4 * ZPX, 2 * Z.r, Z.r, 'f-pas');
    let zoom = `<clipPath id="${K.id('st01-zc')}"><circle cx="${Z.x}" cy="${Z.y}" r="${Z.r}"/></clipPath>` + G(zi, {'clip-path': K.url('st01-zc')}) + C(Z.x, Z.y, Z.r, 'co-detail');
    zoom += LB(T(Z.x - 84, 380, 'PR', 't-lbl') + T(Z.x + 84, 380, 'Cu 기둥', 't-lbl') + T(Z.x + 84, 410, '밑동', 't-sub'));
    zoom += P(`M${Z.x - 110},${ZS + 80} L${Z.x - 10},${ZS + 80}`, 's-wire') + LB(T(Z.x - 60, ZS + 108, '1 µm', 't-sub'));
    zoom += K.lead(Z.x + 120, ZS + 15, 820, 438, '시드 Cu 300 nm', 'start', 't-sub') + K.lead(Z.x + 140, ZS + 35, 820, 500, 'Ti 100 nm', 'start', 't-sub');
    zoom += P(`M${Z.x - 50},${Z.y + Z.r - 8} L${BX[1] + 2},${BASE - 2}`, 's-dash');
    kz += G(zoom, tip('범프 발밑 확대 — 시드 Cu(300 nm)는 범프 높이(30 µm)의 1/100. 조금만 먹혀도 티가 난다 (그림 배율: 1 µm = 100 px)'));
    s += G(kz, only('keep'));

    // handoff — PR 없이 시드 위에 선 범프
    let hf = T(70, 158, '스트립 뒤 — PR 없이 시드 위에 선 범프', 't-acc', 'start') + T(70, 190, '넘기는 것: 깨끗한 시드 · 다치지 않은 범프 · 깨끗한 솔더 표면', 't-dim', 'start');
    PRSEG.forEach(([a, b]) => { hf += R(a + 2, BASE - 4, b - a - 4, 22, 'st01-cut'); });
    // PR 이 있던 자리 (점선) + 스트립 한 공정의 순서 (스트리퍼 → 헹굼 → 건조) → 다음 탭
    hf += PRSEG.map(([a, b]) => R(a + 1, PRT, b - a - 2, BASE - PRT - 2, 'pl-ghost')).join('') + LB(T(400, 748, 'PR이 있던 자리', 't-dim'));
    const FL = [['스트리퍼', 'PR을 없앤다', 'f-strip'], ['헹굼', '약품을 씻어 낸다', 'f-rinse'], ['건조', '물자국 없이', 'pl-tile2'], ['시드 식각', '다음 탭 →', 'st01-nx']];
    FL.forEach(([a, b, c], i) => {
      const x = 70 + i * 190, g = R(x, 236, 160, 96, c, {rx: 10}) + R(x, 236, 160, 96, 'st01-fl', {rx: 10}) + T(x + 80, 276, a, 't-lbl') + T(x + 80, 310, b, 't-dim');
      hf += i === 3 ? `<a href="#go-etch-01" class="pl-tablink" data-tip="시드 식각 탭 01장으로">${g}</a>` : g;
      if (i < 3) hf += arrow(x + 164, 284, x + 186, 284, 's-arr');
    });
    hf += P('M70,350 L70,360 L640,360 L640,350', 's-acc') + T(355, 390, 'PR 스트립 = 스트리퍼 · 헹굼 · 건조까지 한 공정 (장비 → 05장)', 't-dim');
    hf += P(`M500,${BASE - 6} L500,540`, 's-lead') + C(500, BASE - 6, 4, 'k-lead');
    hf += LB(T(500, 480, '다음: 시드 식각이 지울 곳', 't-warn') + T(500, 512, '범프 사이 시드 (빨간 점선)', 't-dim'));
    // 보이지 않는 얇은 막 — 왼쪽 토막 자리 (층 이름 지시선과 엇갈리지 않게)
    hf += R(X0 + 8, BASE - 6, 84, 6, 'f-res', tip('보이지 않는 얇은 유기막 — 눈으로는 안 보이다가 시드 식각 뒤(시드 잔여 · 단락)나 리플로우 뒤(젖음 불량)에 드러날 수 있다 → 08장\n(그림은 과장)'));
    hf += P(`M${X0 + 50},${BASE - 8} L${X0 + 50},650`, 's-lead') + C(X0 + 50, BASE - 8, 4, 'k-lead');
    hf += LB(T(X0 + 10, 600, '보이지 않는 얇은 막 —', 't-sub', 'start') + T(X0 + 10, 630, '뒤 공정에서 드러날 수 있다', 't-sub', 'start'));
    CX.forEach(cx => { hf += T(cx, YSN - 16, '✓', 'st01-ck'); });
    s += G(hf, only('handoff'));

    /* ---------- 층 이름 (오른쪽 세로 줄 · 단계마다 둘째 줄이 바뀐다) ---------- */
    const LBX = 850;
    // [이름, 끝점 x, y, 글 y, [frame, next, keep, handoff] 둘째 줄, 클래스]
    const LAY = [
      ['PR 틀 (35 µm, 예시)', 770, 790, 700, ['범프 자리만 열린 틀', '걷어 내는 중 — 남김없이', '없앤다 ✕', null], ['t-dim', 'st01-wt', 'st01-ng', null]],
      ['SnAg 솔더 (12 µm)', 705, 830, 756, ['녹아서 붙는 솔더 · 원기둥', null, '지킨다 ✓', '깨끗한 표면 → 리플로우'], ['t-dim', null, 'st01-ok', 'st01-ok']],
      ['상부 Cu (3 µm)', 705, (YUC + YNI) / 2, 813, ['솔더가 처음 만나는 면', null, '지킨다 ✓ (얇은 띠)', '홈 없는 띠 그대로'], ['t-dim', null, 'st01-ok', 'st01-ok']],
      ['Ni 방벽 (3 µm)', 705, (YNI + YCU) / 2, 870, ['Cu 기둥과 솔더 사이 방벽', null, '지킨다 ✓', '그대로'], ['t-dim', null, 'st01-ok', 't-dim']],
      ['Cu 기둥 (12 µm)', 705, 950, 927, ['높이 · 전기 · 열의 길', null, '지킨다 ✓', '다치지 않은 기둥'], ['t-dim', null, 'st01-ok', 'st01-ok']],
      ['시드 Cu · Ti', 800, BASE + 5, 984, ['수백 nm · 도금 전류의 길', '아직 모든 범프를 잇는다', '지킨다 ✓ (식각 전까지)', '깨끗하게 → 시드 식각'], ['t-dim', 'st01-wt', 'st01-ok', 'st01-ok']],
      ['보호막 · Si (칩)', 790, 1028, 1041, ['스트립 때는 시드가 덮음', null, '지킨다 ✓', '그대로'], ['t-dim', null, 'st01-ok', 't-dim']]
    ];
    let lb = '';
    LAY.forEach(([nm, px, py, ty, v, c], i) => {
      const isPR = i === 0;
      lb += G(P(`M${px},${py} L${LBX},${ty}`, 's-lead') + C(px, py, 3.5, 'k-lead') + T(LBX + 8, ty + 6, nm, 't-sub', 'start'), isPR ? on('frame', 'handoff') : null);
      // 둘째 줄: 같은 글이 이어지는 단계는 묶는다 (null = 앞 단계와 같음)
      let k = 0;
      while (k < 4){
        let j = k + 1;
        while (j < 4 && v[j] === null && !(isPR && j === 3)) j++;
        if (v[k] != null) lb += G(T(LBX + 8, ty + 32, v[k], c[k], 'start'), only(STEPS.slice(k, j).join(' ')));
        k = j;
      }
    });
    lb += G(T(LBX + 8, 706, 'PR 틀 — 걷어 냄', 't-dim', 'start'), only('handoff'));
    s += LB(lb);

    /* ---------- 오른쪽 패널 (단계별) ---------- */
    s += R(RX, RY, RW, RH, 'pl-panel', {rx: 14});
    // frame: 도금 동안 PR 틀이 한 일
    let p1 = T(RX + 20, RY + 40, '도금 동안 PR 틀이 한 일', 't-acc', 'start');
    const ITEMS = [
      ['① 모양을 잡았다', '구멍의 지름이 곧 범프의 지름입니다. 높이는 도금한 양이 정하고, PR보다 조금 낮게 둡니다.'],
      ['② 시드를 가렸다', 'PR 아래 시드는 액에 닿지 않아, 범프 자리에만 금속이 쌓였습니다.'],
      ['③ 범프끼리 떼어 두었다', '도금 동안 벽이 되어 범프끼리 옆으로 붙지 않게 했습니다.']
    ];
    ITEMS.forEach(([h, d], k) => {
      const y = RY + 70 + k * 196, ix = RX + 18;
      let ic = R(ix, y, 112, 120, 'pl-lane', {rx: 8});
      if (k === 0){ ic += R(ix + 8, y + 26, 28, 80, 'f-pr') + R(ix + 76, y + 26, 28, 80, 'f-pr') + R(ix + 36, y + 78, 40, 28, 'f-cu2') + R(ix + 36, y + 71, 40, 7, 'f-ni') + R(ix + 36, y + 64, 40, 7, 'f-cu2') + R(ix + 36, y + 36, 40, 28, 'f-sn2') + P(`M${ix + 40},${y + 18} L${ix + 72},${y + 18}`, 's-arr2', W(K.mk('s-arr2'), {'marker-start': K.url('arr-a')})); }
      if (k === 1){ ic += R(ix + 6, y + 100, 100, 6, 'f-seed2') + R(ix + 6, y + 50, 64, 50, 'f-pr') + R(ix + 72, y + 64, 34, 36, 'f-cu2'); [0, 1].forEach(q => { ic += C(ix + 22 + q * 28, y + 30, 7, 'k-acc2') + P(`M${ix + 16 + q * 28},${y + 42} l12,-6 m-12,0 l12,6`, 's-arrr'); }); ic += C(ix + 89, y + 46, 7, 'k-acc2'); }
      if (k === 2){ ic += R(ix + 6, y + 100, 100, 6, 'f-seed2') + R(ix + 44, y + 30, 24, 70, 'f-pr'); [ix + 10, ix + 68].forEach(bx => { ic += R(bx, y + 72, 34, 28, 'f-cu2') + R(bx, y + 65, 34, 7, 'f-ni') + R(bx, y + 58, 34, 7, 'f-cu2') + R(bx, y + 30, 34, 28, 'f-sn2'); }); }
      p1 += ic + T(RX + 146, y + 26, h, 't-lbl', 'start') + TT(RX + 146, y + 62, wrap(d, 13), 't-sub', 'start', 28);
    });
    p1 += T(RX + 20, RY + 652, '→ 할 일을 다 한 틀 — 이제 걷어 낼 차례', 't-warn', 'start');
    s += G(p1, only('frame'));

    // next: A 다 걷힘 / B 작은 잔여 — 작은 그림 세 칸씩
    const mini = (x, y, kind) => {
      // kind: clean · etch · sep · res · etchres · short
      let m = R(x, y, 130, 132, 'pl-lane', {rx: 8});
      const sy = y + 110, b1 = x + 9, b2 = x + 88, bw = 36;     // 본 단면과 같은 비율: 높이 = 폭 × 30/25, 틈 = 폭 × 30/25 (얇은 Ni · 상부 Cu는 조금 과장)
      if (kind === 'etch' || kind === 'etchres') m += R(x + 2, y + 20, 126, sy - y - 20, 'f-etl');
      m += R(x + 2, sy + 6, 126, 14, 'f-si');
      const seedAll = kind === 'clean' || kind === 'res';
      if (seedAll) m += R(x + 2, sy, 126, 6, 'f-seed2');
      else {
        m += R(b1, sy, bw, 6, 'f-seed2') + R(b2, sy, bw, 6, 'f-seed2');
        if (kind === 'etch') m += R(x + 2, sy + 2, 126, 2, 'f-seed2', {opacity: .5});
        if (kind === 'etchres' || kind === 'short') m += R(b1 + bw, sy, b2 - b1 - bw, 6, 'f-seed2');
      }
      [b1, b2].forEach(bx => { m += R(bx, sy - 16, bw, 16, 'f-cu2') + R(bx, sy - 21, bw, 5, 'f-ni') + R(bx, sy - 26, bw, 5, 'f-cu2') + R(bx, sy - 43, bw, 17, 'f-sn2'); });
      if (kind === 'res' || kind === 'etchres') m += R(b1 + bw, sy - 9, b2 - b1 - bw, 9, 'f-res');
      if (kind === 'sep') m += T(x + 65, y + 34, '✓', 'st01-ck');
      if (kind === 'short') m += P(`M${b1 + 4},${sy + 3} L${b2 + bw - 4},${sy + 3}`, 'st01-short') + T(x + 65, y + 34, '✗', 'st01-bad');
      return m;
    };
    let p2 = T(RX + 20, RY + 40, 'PR이 다 걷히면 / 조금 남으면', 't-acc', 'start');
    const MX = [RX + 16, RX + 160, RX + 304];
    p2 += T(RX + 20, RY + 82, 'A — 다 걷힘', 'pl-hdg3', 'start');
    ['clean', 'etch', 'sep'].forEach((k, i) => { p2 += mini(MX[i], RY + 96, k); });
    ['① 스트립 뒤', '② 시드 식각', '③ 서로 나뉨'].forEach((t, i) => { p2 += T(MX[i] + 65, RY + 254, t, i === 2 ? 'st01-ok' : 't-dim'); });
    p2 += T(RX + 20, RY + 312, 'B — 틈 바닥에 얇은 잔여', 'pl-hdg2', 'start');
    ['res', 'etchres', 'short'].forEach((k, i) => { p2 += mini(MX[i], RY + 326, k); });
    ['① 잔여', '② 시드 남음', '③ 단락'].forEach((t, i) => { p2 += T(MX[i] + 65, RY + 484, t, i === 2 ? 'st01-ng' : 't-dim'); });
    p2 += TT(RX + 20, RY + 548, wrap('식각은 보통 정해진 시간(+여유)으로 끝나, 잔여가 덮은 자리의 시드는 남기 쉽습니다. 남은 시드가 이웃 범프를 이으면 단락입니다.', 19), 't-sub', 'start', 28);
    s += G(p2, W(only('next'), tip('잔여(연보라)가 덮은 시드는 식각액이 늦게 닿는다 → 시드가 남아 범프 둘을 잇는다 (그림은 과장)')));

    // keep: 시소 — 녹이는 힘 vs 지키는 힘
    const FX = RX + 225, FY = RY + 250;
    let p3 = T(RX + 20, RY + 40, '녹이는 힘 vs 지키는 힘', 't-acc', 'start') + T(RX + 20, RY + 72, '조건(손잡이) 대부분이 두 힘을 함께 움직인다', 't-dim', 'start');
    let beam = R(RX + 24, FY - 8, RW - 48, 10, 'st01-beam', {rx: 4});
    beam += R(RX + 24, FY - 108, 172, 100, 'st01-pan1', {rx: 10}) + LB(T(RX + 110, FY - 64, '녹이는 힘', 't-lbl') + T(RX + 110, FY - 32, 'PR을 없앤다', 't-sub'));
    beam += R(RX + RW - 196, FY - 108, 172, 100, 'st01-pan2', {rx: 10}) + LB(T(RX + RW - 110, FY - 64, '지키는 힘', 't-lbl') + T(RX + RW - 110, FY - 32, '금속을 지킨다', 't-sub'));
    p3 += G(G(beam, {'data-noov': '1'}) + `<animateTransform attributeName="transform" type="rotate" values="-3 ${FX} ${FY};3 ${FX} ${FY};-3 ${FX} ${FY}" dur="7s" repeatCount="indefinite"/>`);
    p3 += PG([[FX, FY + 2], [FX - 34, FY + 58], [FX + 34, FY + 58]], 'st01-fulc');
    p3 += TT(RX + 40, FY + 100, ['온도 ↑', '알칼리 ↑', '시간 ↑'], 't-sub', 'start', 30);
    p3 += TT(RX + 262, FY + 100, ['억제제', '물 관리', '낮은 온도', '짧은 시간', '헹굼 순서'], 't-sub', 'start', 30);
    p3 += TT(RX + 20, RY + 530, wrap('온도 · 알칼리를 올리거나 시간을 늘리면 PR은 더 잘 없어지지만 금속도 더 먹힙니다. 한쪽 힘만 키울 수는 없습니다.', 19), 't-dim', 'start', 26);
    p3 += T(RX + RW / 2, RY + 616, '선택비 = PR 제거 속도 ÷ 금속 손실 속도', 'st01-eq');
    p3 += T(RX + RW / 2, RY + 650, '클수록 좋다 — 예(가정) 약 2.5×10⁴ (한 걸음 더)', 't-dim');
    s += G(p3, only('keep'));

    // handoff: 앞뒤 공정 흐름
    let p4 = T(RX + 20, RY + 40, '앞뒤로 주고받는 것', 't-acc', 'start');
    const FLOWB = [
      ['전해도금', '앞 공정', 'up', ['PR 틀 속 범프 · 도금액 흔적', '들뜬 PR · 버섯 머리도 함께 온다'], '#go-plating', '전해도금 탭으로'],
      ['PR 스트립 ★', '이 탭', 'me', ['PR만 남김없이 없애고', '금속 · 시드는 지킨다'], null, ''],
      ['시드 식각', '뒤 공정', 'dn', ['깨끗한 시드 → 고른 식각', '잔여 → 시드 남음 · 단락'], '#go-etch-01', '시드 식각 탭 01장으로'],
      ['리플로우', '뒤 공정', 'dn', ['깨끗한 솔더 표면 → 고른 젖음', '유기막 · 산화막 → 젖음 불량'], '#go-reflow-01', '리플로우 탭 01장으로\n(시드 식각 뒤 플라즈마 처리로 산화막 · 유기물을 정리하고 리플로우)']
    ];
    const ARR = ['받는 것: PR 틀 속 범프', '넘기는 것: 깨끗한 시드 위 범프', '서로 나뉜 범프 (사이에 플라즈마 처리)'];
    FLOWB.forEach(([nm, tg, cl, d, href, tt], k) => {
      const y = RY + 64 + k * 154, bx = RX + 20, bw = RW - 40, bh = 112;
      let g = R(bx, y, bw, bh, cl === 'me' ? 'pl-hlbox' : 'pl-tile2', {rx: 10});
      g += T(bx + 16, y + 34, nm, cl === 'me' ? 'st01-now' : 't-lbl', 'start');
      g += R(bx + bw - 104, y + 12, 90, 30, 'st01-tg ' + cl, {rx: 8}) + T(bx + bw - 59, y + 34, tg, 'st01-tgt');
      g += TT(bx + 16, y + 68, d, 't-dim', 'start', 26);
      p4 += href ? `<a href="${href}" class="pl-tablink" data-tip="${K.esc(tt)}">${g}</a>` : g;
      if (k < 3){ p4 += arrow(bx + 40, y + bh + 4, bx + 40, y + 150, 's-arr') + T(bx + 62, y + bh + 30, ARR[k], 't-dim', 'start'); }
    });
    s += G(p4, only('handoff'));

    /* ---------- 계량 상자 (모든 단계, 위젯이 그린다) ---------- */
    s += `<g data-v="meter"></g>`;
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 웨이퍼 한 장에서 걷어 낼 PR</div>
      ${K.ctl('t', 'PR 두께 (µm, 예시)', 20, 100, 1, 35)}${K.ctl('f', '개구율 — 범프 자리 면적 비율 (%)', 5, 60, 1, 20)}${K.ctl('e', '가장자리 PR 없는 폭 (EBR, mm)', 0, 5, 0.5, 2)}
      ${K.seg('p', [['n', '좁게 40 · 22'], ['m', '보통 55 · 25'], ['w', '넓게 100 · 50']], 'm', '범프 간격 (피치 · 지름 µm, 예시)')}
      ${K.kpis([['PR 부피', 'k-v', 'cm³ = mL / 장'], ['PR 무게', 'k-m', 'g / 장'], ['25장 한 lot', 'k-l', 'g'], ['틈 깊이 : 폭', 'k-ar', 'PR 두께 ÷ 범프 사이 틈']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('부피 = 웨이퍼 면적(300 mm, 가장자리 EBR 폭을 뺌) × (1 − 개구율) × PR 두께, 무게 = 밀도(예시 1.15 g/cm³, 수지에 따라 약 1.1~1.25) × 부피. 범프 안 금속 · 다이 사이 무늬 · 가장자리 PR 턱은 무시한 어림입니다. 기본값(PR 35 µm · 개구율 20 % · EBR 2 mm)과 범프 간격 세 가지는 그림 예시이고, 전해도금 탭 예시 PR 60 µm면 약 3.8 g/장입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, P, T, G, LB, tip} = K;
    const st = Object.assign({}, DEMO.frame);
    let touched = false;
    const inp = id => ctx.card.querySelector(`input[data-i="${id}"]`);
    const setSeg = v => ctx.card.querySelectorAll('.pl-seg[data-g="p"] button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    function calc(){
      const A = Math.PI * Math.pow((150 - st.e) / 10, 2);            // cm²
      const V = A * (1 - st.f / 100) * st.t * 1e-4;                  // cm³
      const m = RHO * V, [p, d] = PIT[st.p], g = p - d;
      return {A, V, m, lot: 25 * m, p, d, g, ar: st.t / g};
    }
    function render(){
      const c = calc();
      let s = R(MB.x, MB.y, MB.w, MB.h, 'pl-panel', {rx: 14});
      const tag = st.t === 60 ? '전해도금 탭 예시' : st.p === 'n' ? '좁은 피치' : '위젯 값';
      s += T(MB.x + 20, MB.y + 36, `웨이퍼 한 장의 PR (${tag})`, 't-acc', 'start');
      // 1 g = 정사각형 한 칸 (끝 칸은 소수만큼)
      const qx = MB.x + 22, qy = MB.y + 56, n = Math.floor(c.m), fr = c.m - n;
      let q = '';
      for (let k = 0; k < n; k++) q += R(qx + k * 32, qy, 26, 26, 'f-pr', {rx: 3});
      if (fr > 0.04) q += R(qx + n * 32, qy, 26 * fr, 26, 'f-pr') + R(qx + n * 32, qy, 26, 26, 'st01-gq', {rx: 3});
      s += G(q, tip(`PR 무게 — 한 칸 = 1 g (끝 칸은 소수만큼)\n웨이퍼 면적 ${c.A.toFixed(0)} cm² × (1 − ${st.f} %) × ${st.t} µm = ${c.V.toFixed(2)} cm³`));
      s += T(MB.x + 22, MB.y + 116, `약 ${c.m.toFixed(1)} g / 장`, 't-lbl', 'start') + T(MB.x + 178, MB.y + 116, '(한 칸 = 1 g)', 't-dim', 'start');
      s += T(MB.x + 22, MB.y + 150, `25장 lot ≈ ${c.lot.toFixed(0)} g`, 't-sub', 'start');
      s += T(MB.x + 22, MB.y + 184, `PR ${st.t} µm · 개구율 ${st.f} %`, 't-dim', 'start') + T(MB.x + 22, MB.y + 210, `EBR ${st.e} mm · ρ ${RHO} g/cm³`, 't-dim', 'start');
      const warn = c.ar > 3;
      s += T(MB.x + 22, MB.y + 252, `틈 깊이 : 폭 = ${c.ar.toFixed(1)}`, warn ? 'pl-warn' : 't-sub', 'start');
      // 틈 미니 그림 — 가로 · 세로 같은 배율 (1 µm = 1.8 px), 범프 벽은 PR 높이의 30/35 (베이스 다이 범프 — PR이 30 µm보다 얇으면 코어 다이 범프). 얇은 Ni · 상부 Cu는 보이게 6 px 이상
      const k = 1.8, gx = MB.x + 370, gb = MB.y + MB.h - 46, gw = c.g * k, gh = st.t * k, ww = 24, hb = gh * 30 / 35;
      let fg = R(gx - gw / 2 - ww - 8, gb, gw + 2 * ww + 16, 5, 'f-seed2') + R(gx - gw / 2 - ww - 8, gb + 5, gw + 2 * ww + 16, 10, 'f-si');
      fg += R(gx - gw / 2, gb - gh, gw, gh, 'f-pr');
      // PR이 30 µm보다 얇으면 베이스 다이 범프(30 µm)는 들어가지 않으므로 코어 다이 범프(Ni 5 : SnAg 12)로 그린다
      const core = st.t < 30, th = Math.max(6, hb * 3 / 30), hc = (hb - 2 * th) / 2;   // 베이스: Ni = 상부 Cu 두께, Cu 기둥 = SnAg
      [gx - gw / 2 - ww, gx + gw / 2].forEach(x => { fg += core ? R(x, gb - hb * 5 / 17, ww, hb * 5 / 17, 'f-ni') + R(x, gb - hb, ww, hb * 12 / 17, 'f-sn2') : R(x, gb - hc, ww, hc, 'f-cu2') + R(x, gb - hc - th, ww, th, 'f-ni') + R(x, gb - hc - 2 * th, ww, th, 'f-cu2') + R(x, gb - hb, ww, hc, 'f-sn2'); });
      fg += P(`M${gx - gw / 2},${gb + 24} L${gx + gw / 2},${gb + 24}`, 's-acc2') + T(gx, gb + 42, `${c.g} µm`, 't-dim');
      fg += T(gx, gb - gh - 10, `${st.t} µm`, 't-dim');
      s += G(fg, tip(`틈 단면 (그림 예시 · 가로 세로 같은 배율)\n폭 ${c.g} µm (피치 ${c.p} − 지름 ${c.d}) · 깊이 ${st.t} µm → 깊이 : 폭 ${c.ar.toFixed(1)}\n깊고 좁을수록 틈 바닥이 늦게 걷힌다 (→ 08장)\n${core ? '범프: 코어 다이 Ni / SnAg (PR이 베이스 다이 범프 30 µm보다 얇음, 예시)' : '범프: 베이스 다이 Cu / Ni / Cu / SnAg (예시)'}`));
      ctx.$('[data-v="meter"]').innerHTML = s;
      ctx.refresh();
      ctx.out('k-v', `${c.V.toFixed(2)} mL`); ctx.out('k-m', `${c.m.toFixed(1)} g`); ctx.out('k-l', `${c.lot.toFixed(0)} g`); ctx.out('k-ar', `${c.ar.toFixed(1)} : 1`);
      const ka = ctx.card.querySelector('[data-o="k-ar"]').closest('.kpi');
      ka.classList.toggle('ok', c.ar <= 2); ka.classList.toggle('warn', c.ar > 3);
      ctx.q('[data-o=msg]').innerHTML = `웨이퍼 한 장(300 mm)이 PR 약 <b>${c.m.toFixed(1)} g</b>(${c.V.toFixed(2)} mL)을 스트리퍼에 넘깁니다 — 25장 lot이면 약 ${c.lot.toFixed(0)} g. 이 무게가 쌓여 액이 지칩니다 → <a data-go="bath.load">06장</a>. 틈 깊이 : 폭 ${c.ar.toFixed(1)} (깊이 ${st.t} µm · 폭 ${c.g} µm) — 깊고 좁을수록 틈 바닥이 늦게 걷힙니다 → <a data-go="residue.gap">08장</a>.` +
        (warn ? ' <b>깊이 : 폭이 3을 넘습니다</b> — 틈 바닥 · 밑동 잔여를 특히 확인합니다.' : '');
    }
    ctx.range('t', v => { st.t = v; render(); return v + ' µm'; });
    ctx.range('f', v => { st.f = v; render(); return v + ' %'; });
    ctx.range('e', v => { st.e = v; render(); return v.toFixed(1) + ' mm'; });
    ctx.seg('p', v => { st.p = v; render(); });
    ctx.card.querySelectorAll('.pl-w input, .pl-w .pl-seg button').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    ctx.demo = sid => {
      const d = DEMO[sid];
      if (touched || !d) return ctx.refresh();
      Object.assign(st, d);
      [['t', d.t + ' µm'], ['f', d.f + ' %'], ['e', d.e.toFixed(1) + ' mm']].forEach(([id, o]) => { const i = inp(id); if (i) i.value = d[id]; ctx.out(id, o); });
      setSeg(d.p);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['PR (감광막)', '빛으로 무늬를 새기는 고분자 막(포토레지스트). 범프 도금에서는 수십 µm 두께의 틀'],
      ['스트립', 'PR을 약품으로 벗겨 없애는 공정. 이 탭은 액으로 하는 습식 스트립'],
      ['스트리퍼', 'PR을 없애는 약품. 용제가 몸통이고 알칼리 · 부식 억제제 등이 조금씩 들어간다 (→ <a data-go="chem">04장</a>)'],
      ['시드', '도금 전류가 흐를 길로 웨이퍼 전면에 깐 얇은 금속(Ti 위 Cu, 수백 nm). 스트립 뒤 범프 사이 시드는 식각으로 지운다'],
      ['선택비', '없앨 것(PR)과 지킬 것(금속)이 없어지는 속도의 비. 클수록 좋다'],
      ['단락 (브리지)', '이웃 범프끼리 전기로 이어진 불량'],
      ['개구율', '웨이퍼에서 PR이 뚫린(범프 자리) 면적 비율'],
      ['EBR (가장자리 PR 제거)', '코팅 직후 웨이퍼 가장자리 몇 mm의 PR을 걷어 낸 것. 도금 때 전극 접점이 시드에 닿는 자리이고, 그 경계에는 PR 턱이 남기 쉽다 (→ <a data-go="residue">08장</a>)']
    ]) + K.field([
      '스트립이 잘 됐는지는 눈으로 보기 어렵습니다. 얇은 유기막은 보이지 않다가 시드 식각 뒤 시드 잔여 · 단락으로 드러납니다 → <a data-go="residue.find">08장</a>.',
      '\'PR 제거 뒤\'에 처음 보이는 불량(밑동 치마 · PR 발 · 버섯 머리 아래 잔여 · 범프 떨어짐)은 원인이 도금 · 포토에 있는 경우가 많습니다. 스트립은 불량을 \'만드는\' 단계일 수도, \'드러내는\' 단계일 수도 있습니다 → <a href="#go-plating-12">전해도금 12장</a>.',
      '스트립 조건을 바꿀 때는 시드 식각 · 리플로우 담당과 함께 봅니다. 시드 표면 상태(산화 · 유기막 · 얇아짐)가 식각 속도와 언더컷을 바꿉니다 → <a href="#go-etch-04">시드 식각 04장</a>.',
      'PR 종류 · 두께 · 굽기 조건이 바뀌면(포토 변경) 스트립 조건도 다시 확인합니다 — 변경 관리 항목입니다.',
      '이 탭 그림은 세 탭이 함께 쓰는 예시 범프 — 베이스 다이 범프(Cu 기둥 12 + Ni 3 + 상부 Cu 3 + SnAg 12 = 30 µm, 지름 25 · 피치 55 µm, PR 35 µm)입니다. 실제 HBM은 피치가 40 µm 안팎까지 좁아져 틈 깊이 : 폭이 2 가까이 되기도 합니다(위젯의 \'좁게\'). <b>코어 다이</b> 범프(Ni 5 + SnAg 12 = 17 µm, 예시)는 낮아서, 같은 여유(범프 + 5 µm)라면 PR을 약 22 µm로 얇게 쓸 수 있습니다(위젯: 약 1.4 g/장 · 깊이 : 폭 약 0.7) — PR 두께가 다르면 스트립 시간 · 액 수명도 다이마다 따로 잡습니다(<a data-go="soak.square">03장</a> · <a data-go="bath.load">06장</a>). 내 제품의 PR 두께 · 피치로 위젯 값을 바꿔 보세요.'
    ]) + K.deep(`<ul>
      <li><b>선택비</b> S = (PR이 없어지는 속도) ÷ (금속이 없어지는 속도). 예(가정): 35 µm PR을 약 10분에 걷고(약 3.5 µm/분) 억제제가 든 액에서 Cu 손실이 0.14 nm/분(<a data-go="chem">04</a> · <a data-go="metal">07장</a> 위젯 기본값)이면 S ≈ 2.5×10⁴. 숫자는 커 보여도 시드는 수백 nm뿐이라, 오버 스트립(다 걷힌 뒤 더 담가 두는 여유 시간)과 헹굼 순간의 손실까지 더하면 여유가 빠르게 줄어듭니다(<a data-go="metal.rinse">07장</a>).</li>
      <li><b>PR 무게</b> m = ρ · π(R − e)² · (1 − f) · t. 300 mm, EBR 2 mm(면적 약 688 cm²), 개구율 20 %, ρ 1.15 g/cm³ → PR 35 µm면 약 2.2 g/장(25장 약 55 g), 60 µm면 약 3.8 g/장(25장 약 95 g). 제품마다 PR 두께 · 개구율이 달라 같은 장수라도 액이 다르게 지칩니다(<a data-go="bath.load">06장</a>).</li>
      <li><b>왜 플라즈마(건식)로 다 태우지 않나</b> — 수십 µm PR을 산소 플라즈마로 태우면 오래 걸리고, 빨리 태우려 웨이퍼를 데우면 SnAg(공정점(共晶) 221 °C에서 녹기 시작)와 솔더 표면 산화가 문제가 됩니다. 플라즈마는 디스컴 · 얇은 잔여 정리처럼 얇은 막에 씁니다(<a href="#go-bump">범프 공정 탭</a> 05 디스컴 · 09 플라즈마).</li>
      <li><b>리프트오프와의 차이</b> — 리프트오프는 PR 위에 올라간 금속까지 함께 떼어 내는 공정입니다. 범프 스트립에서는 금속이 PR 구멍 안에만 있어야 정상이고, PR 위로 넘친 '버섯 머리'(오버 도금)는 그 아래 PR을 가려 잔여의 원인이 됩니다(<a data-go="residue.foot">08장</a> · 오버 도금과 브리지는 <a href="#go-plating-12">전해도금 12장</a>, 외톨이 범프가 먼저 높이 자라는 까닭은 <a href="#go-plating-08">전해도금 08장</a>).</li>
      <li><b>시드 식각과의 짝</b> — 시드 식각은 보통 정해진 시간(+여유)으로 끝내므로, 스트립이 남긴 얇은 막 자리만 늦게 식각되어 국부 잔여가 생길 수 있습니다(<a href="#go-etch-01">시드 식각 01장</a> · <a href="#go-etch-07">07장</a>). 거꾸로 스트립에서 시드 Cu가 이미 얇아진 곳은 과식각 · 언더컷이 커지기 쉽습니다(<a href="#go-etch-04">시드 식각 04장</a>).</li>
      <li><b>포지티브 PR의 다른 길</b> — 노광하지 않은 DNQ는 수지가 알칼리에 녹지 않게 막지만, 빛을 받으면 알칼리에 녹는 산으로 바뀝니다. 그래서 전면 노광 뒤 현상액으로 걷는 방법도 원리상 가능하지만, 도금 이력 · 굽기에 따라 잔여 위험이 있어 보통은 용제 스트리퍼를 씁니다.</li></ul>`);
  },
  css: `.st01-kill{fill:none;stroke:#f87171;stroke-width:3;stroke-dasharray:9 6}
.st01-keep{fill:none;stroke:#4ade80;stroke-width:2.6}
.st01-seedhl{fill:rgba(251,191,36,.10);stroke:#fbbf24;stroke-width:3}
.st01-cut{fill:rgba(248,113,113,.10);stroke:#f87171;stroke-width:2.4;stroke-dasharray:7 5}
.st01-short{fill:none;stroke:#ef4444;stroke-width:5;stroke-linecap:round}
.st01-beam{fill:#94a3b8}
.st01-fl{fill:none;stroke:rgba(125,211,252,.35);stroke-width:1.4}
.st01-nx{fill:rgba(245,158,11,.16)}
.st01-fulc{fill:#475569;stroke:#94a3b8;stroke-width:1.4}
.st01-pan1{fill:rgba(248,113,113,.14);stroke:#f87171;stroke-width:2}
.st01-pan2{fill:rgba(74,222,128,.12);stroke:#4ade80;stroke-width:2}
.st01-gq{fill:none;stroke:#a99cf0;stroke-width:1.4;stroke-dasharray:3 3}
.st01-tg.up{fill:rgba(167,139,250,.3)}
.st01-tg.dn{fill:rgba(245,158,11,.28)}
.st01-tg.me{fill:rgba(56,189,248,.28)}
.pl-svg .st01-tgt{font-size:17px;font-weight:800;fill:#e2e8f0 !important;text-anchor:middle}
.pl-svg .st01-ok{font-size:19px;font-weight:800;fill:#86efac !important}
.pl-svg .st01-ng{font-size:19px;font-weight:800;fill:#fca5a5 !important}
.pl-svg .st01-wt{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .st01-x{font-size:56px;font-weight:900;fill:#f87171 !important;opacity:.85}
.pl-svg .st01-eq{font-size:22px;font-weight:800;fill:#fde68a !important;text-anchor:middle}
.pl-svg .st01-ck{font-size:34px;font-weight:900;fill:#4ade80 !important}
.pl-svg .st01-bad{font-size:34px;font-weight:900;fill:#f87171 !important}
.pl-svg .st01-now{font-size:26px;font-weight:800;fill:#7dd3fc !important}`
});
})();
