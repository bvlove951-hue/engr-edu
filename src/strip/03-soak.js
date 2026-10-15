/* PR 스트립 03 — 스며들기: 두꺼운 PR은 왜 훨씬 오래 걸릴까? (PR 막 · 수십 µm · 분) */
(function(){
// ── 개념 모델 (기획 03장 · 5절). 모든 상수는 분 단위 시간이 나오도록 고른 예시 · 가정값 ──
const EA = 50000, RG = 8.314, TREF = 343.15;                  // Ea 50 kJ/mol (예시), 기준 70 °C
const A = T => Math.exp(-(EA / RG) * (1 / (T + 273.15) - 1 / TREF));   // 반응 · 막 속 확산 배수 (70 °C = 1)
const RS0 = 6;                                                  // 녹는 PR: 겉에서 풀리는 속도 6 µm/분 (70 °C, 가정)
const RM = {none: 2, flow: 8, spray: 30, hp: 60};               // 겉면 공급(녹은 성분 치우기) µm/분 (가정, 온도와 무관하다고 둔다)
const MU = {none: 1.15, flow: 1, spray: 0.85};                  // 가교 PR: 스며드는 시간 배수 (가정)
const CLR = {none: 5, flow: 2, spray: 0.5, hp: 0.5};            // 가교 PR: 들뜬 막을 떼고 치우는 시간 (분, 가정)
const NX = {f: 0.5, a: 0.75, c: 1};                             // 스며드는 방식 지수 n (t ∝ L^(1/n))
const DC = 20;                                                  // 고압 분사가 한 번에 깨서 떼는 부푼 층 20 µm (가정)
const FP = 88, FPN = 91;                                        // 인화점 DMSO 약 88 · NMP 약 91 °C (밀폐식, 자료에 따라 다름)
const tSoak = (L, T, n) => 5 * Math.pow(L / 30, 1 / NX[n]) / A(T);   // 30 µm · 70 °C에서 5분 = (30 µm)²/D, D = 3×10⁻¹² m²/s
// 걸리는 시간 = a + b. 녹는 PR: a 겉 풀림(반응) · b 겉면 공급 (직렬: 1/r = 1/r_겉 + 1/r_공급 → t = L/r_겉 + L/r_공급)
//                   가교 PR: a 막 속 스며들기 · b 떼고 치우기. 고압 분사: 층(20 µm)마다 스며들어 떼어 냄
// 고압 분사는 적어도 보통 분사만큼은 겉을 새로 대 준다고 둔다 → 층째 떼기와 보통 분사 가운데 빠른 쪽
// (기획의 60 µm 예 9.2분 · 두께 2배 ×1.95는 그대로. 케이스 II · 얇은 막에서 고압 분사가 보통 분사보다 느려지는 모순만 없앤다)
function parts(m, L, T, ag, n){
  if (m === 'dis') return {a: L / (RS0 * A(T)), b: L / RM[ag]};
  if (ag === 'hp') return {a: Math.min(L <= DC ? tSoak(L, T, n) : L / DC * tSoak(DC, T, n), tSoak(L, T, n) * MU.spray), b: CLR.hp};
  return {a: tSoak(L, T, n) * MU[ag], b: CLR[ag]};
}
const tTot = (m, L, T, ag, n) => { const p = parts(m, L, T, ag, n); return p.a + p.b; };
const AGN = {none: '담금만', flow: '순환 흐름', spray: '분사 · 메가소닉', hp: '고압 분사 (박리)'};
const NNM = {f: '확산 (픽)', a: '중간', c: '케이스 II'};
// 손대지 않았을 때 단계마다 보여 줄 예시 (그림 기준 PR 35 µm · square는 '30 µm에 5분' 글과 맞춰 30 → 60 µm · stir는 기획 예와 같은 60 µm)
const DEMO = {
  front: {m: 'swl', L: 35, T: 70, ag: 'flow', n: 'a'},
  square: {m: 'swl', L: 30, T: 70, ag: 'flow', n: 'a'},
  heat: {m: 'swl', L: 35, T: 80, ag: 'flow', n: 'a'},
  stir: {m: 'swl', L: 60, T: 70, ag: 'hp', n: 'a'}     // 고압 분사의 층째 떼기 이득이 보이는 두께 (35 µm에서는 보통 분사와 거의 같다)
};
// ── 장면 치수 ──
const LX0 = 40, LX1 = 780, LY0 = 120, FT = 380;                 // 왼쪽: 액 띠 (y 120~380) · 막 윗면 y 380
const FX0 = 80, FX1 = 600, CA = 80, CB = 360, CW = 240;         // 막 가로 · 두 칸(front · square) 왼쪽 끝과 폭
const HM = 480;                                                  // 막 최대 높이 (px)
const SUB = [[8, 'f-seed2', '시드 Cu — 예시 300 nm (실제 수백 nm — 그림은 과장)'], [5, 'f-ti', 'Ti(접착 · 방벽층) — 예시 100 nm (그림은 과장)'], [8, 'f-pas', '보호막(패시베이션) — 스트립 동안은 시드가 덮고 있어 액에 닿지 않는다'], [36, 'f-si', '실리콘 웨이퍼']];
const SUBH = 57;
const PX0 = 800, PX1 = 1560, PY0 = 120, PY1 = 1100;             // 오른쪽 패널
const VN = {x: 24, y: 112, w: 776, h: 1000};                   // 좁은 세로 화면: 왼쪽(막 · 액 · 설명)만 크게 — 숫자는 카드의 KPI로
const f1 = v => v >= 99.5 ? v.toFixed(0) : v.toFixed(1);
const f2 = v => v.toFixed(2);
// erfc 근사 (Abramowitz–Stegun 7.1.26)
function erfc(x){ const t = 1 / (1 + 0.3275911 * x); return t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x); }
// 눈금 간격: 대략 5칸
function niceStep(max){ const raw = max / 5, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }

(window.EngrStripChapters = window.EngrStripChapters || []).push({
  no: '03', id: 'soak', part: 1, short: '스며들기', scale: 'PR 막 · 수십 µm · 분',
  title: '스며들기 — 두꺼운 PR은 왜 훨씬 오래 걸릴까?',
  hook: '두께 2배면 시간 2~4배',
  one: '스트리퍼는 PR 겉에서 안쪽으로 조금씩 스며듭니다. 부풀어 떨어지는 가교 PR은 두께가 2배면 시간이 2~4배입니다(순수한 확산이면 제곱, 앞면이 일정한 속도로 들어가면 비례 — 실제 PR은 보통 그 사이). 겉부터 녹는 포지티브 PR은 두께에 비례하는 쪽에 가깝고, 온도를 올리면 빨라지지만 금속도 함께 빨리 먹힙니다.',
  ana: '<b>두꺼운 카스텔라에 시럽 스미기</b> — 얇은 조각은 금방 젖지만 두꺼운 덩어리 가운데는 한참 걸려, 두께가 두 배면 두 배보다 오래(많게는 네 배) 걸립니다. 데운 시럽은 더 빨리 스밉니다. <i>(한계: 카스텔라에는 구멍이 있어 시럽이 흘러 들어가지만, PR에는 구멍이 없어 분자가 사슬 사이를 비집고 들어갑니다(확산). 단단한 막에서는 젖은 앞면이 일정한 속도로 들어가 시간이 두께에 비례하기도 합니다. 또 겉부터 녹아 없어지는 포지티브 PR은 젖으면서 동시에 사라지므로, 시간은 두께에 비례하는 쪽에 더 가깝습니다.)</i>',
  steps: [
    {id: 'front', t: '스며드는 앞면 — 흐릿하게, 또는 날카롭게', d: '용제 분자는 PR 사슬 사이를 비집고 들어갑니다(확산). 무른 막에서는 젖은 정도가 흐릿하게 퍼지며 내려가고, 단단한 막에서는 날카로운 앞면이 일정한 속도로 내려갑니다(케이스 II). 실제 PR은 보통 그 사이입니다.', viewN: VN},
    {id: 'square', t: '두께와 시간 — 두 배면 2~4배', d: '순수한 확산으로 거리 L을 가는 시간은 대략 L²/D입니다(D: 확산계수, 퍼지는 빠르기). 예시로 30 µm에 5분이면 60 µm는 많게는 약 20분, 앞면이 일정한 속도면 10분입니다. 겉부터 녹아 없어지는 PR은 두께에 비례하는 쪽에 가깝습니다.', viewN: VN},
    {id: 'heat', t: '온도 — 반응은 10 °C마다 약 1.6배', d: '따뜻할수록 분자가 활발해 스며들고 녹는 속도가 빨라집니다(아레니우스). 예시 값으로 10 °C마다 약 1.6배지만, 겉면 공급 · 조각 치우기 몫은 거의 안 빨라져 전체 시간은 덜 줄어듭니다. 금속 부식 · 증발도 빨라지고 인화점에 가까워집니다.', viewN: VN},
    {id: 'stir', t: '교반이 돕는 것과 못 돕는 것', d: '흐름 · 질소 거품 · 메가소닉(약 1 MHz 음파)은 PR 겉의 녹은 성분을 치워 늘 새 액을 대 줍니다(전해도금의 확산층과 같은 원리). 그러나 막 속으로 스며드는 속도는 거의 못 바꿉니다. 녹는 PR엔 이런 교반이 바로 듣고, 부푼 가교 막은 고압 분사가 층째 깨서 떼어 내 남은 두께를 줄입니다.', viewN: VN}
  ],
  icon(K){
    const {R, L} = K;
    return R(6, 14, 52, 40, 'f-pr') + R(6, 14, 52, 14, 'st03-wet') + L(6, 28, 58, 28, 's-dash');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only} = K;
    let s = '';
    // 막 속 젖은 정도 그라데이션 (위 진함 → 앞면에서 0). 픽: 넓게 흐릿 · 중간: 아래쪽에서 더 빨리 사라짐
    s += `<defs><linearGradient id="${K.id('st03-wg')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc" stop-opacity=".58"/><stop offset=".55" stop-color="#7dd3fc" stop-opacity=".22"/><stop offset="1" stop-color="#7dd3fc" stop-opacity="0"/></linearGradient>`;
    s += `<linearGradient id="${K.id('st03-wg2')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc" stop-opacity=".5"/><stop offset=".7" stop-color="#7dd3fc" stop-opacity=".34"/><stop offset="1" stop-color="#7dd3fc" stop-opacity=".04"/></linearGradient></defs>`;
    // 왼쪽: 스트리퍼 액 띠
    s += R(LX0, LY0, LX1 - LX0, FT - LY0, 'f-bath', tip('스트리퍼 액 (예: DMSO · NMP 계 + 알칼리, 보통 60~80 °C로 데움)'));
    s += R(LX0, LY0, LX1 - LX0, FT - LY0, 'f-strip');
    s += `<g data-v="heatglow"></g>`;
    s += LB(T(LX1 - 20, 152, '스트리퍼', 't-dim', 'end'));
    s += `<g data-v="mol"></g>`;
    s += `<g data-v="front"></g><g data-v="sq"></g><g data-v="heat"></g><g data-v="stir"></g>`;
    // 오른쪽 패널
    s += R(PX0, PY0, PX1 - PX0, PY1 - PY0, 'pl-panel', {rx: 14});
    // front 단계의 오른쪽: 깊이–농도 그래프 두 개 (모양만) + 이 막은 어디?
    let fr = T(PX0 + 30, 162, '깊이에 따라 용제가 얼마나 들어왔나 (모양만)', 't-acc', 'start');
    const GW = 280, GH = 420, GY = 270, GXs = [870, 1220];
    const gxs = [['픽 확산', 's-curve', '흐릿한 앞면 — 깊이 ∝ √시간'], ['케이스 II', 's-curve2', '날카로운 앞면 — 깊이 ∝ 시간']];
    gxs.forEach(([nm, cls, sub], gi) => {
      const gx = GXs[gi];
      let g = T(gx, 208, nm, gi ? 'pl-warn' : 'pl-hdg', 'start') + T(gx, 236, sub, 't-dim', 'start');
      g += L(gx, GY, gx + GW + 10, GY, 's-axis') + L(gx, GY, gx, GY + GH + 10, 's-axis') + L(gx, GY + GH, gx + GW, GY + GH, 's-dash');
      g += LB(T(gx + GW, GY + GH + 30, '막 바닥', 't-dim', 'end') + T(gx + 8, GY + GH + 30, '깊이 ↓', 't-dim', 'start'));
      g += LB(T(gx, GY - 8, '0', 't-dim', 'middle') + T(gx + GW, GY - 8, '다 젖음', 't-dim', 'end'));
      const xs = c => gx + c * GW, ys = z => GY + z * GH;
      if (!gi){
        [[1, 0.22, 0.1], [2, 0.311, 0.1], [4, 0.44, 0.1]].forEach(([k, w, cl]) => {
          let d = '';
          for (let z = 0; z <= 1.0001; z += 0.01){ const c = erfc(z / w); d += (d ? ' L' : 'M') + xs(c).toFixed(1) + ',' + ys(z).toFixed(1); }
          g += P(d, cls, tip(`픽 확산 — 시간 ${k}: 겉은 다 젖고 안쪽으로 갈수록 흐릿하게 줄어든다 (erfc 꼴)`));
          // 이름표: 농도 cl인 깊이 옆
          let zl = 0; for (let z = 0; z <= 1; z += 0.002) if (erfc(z / w) <= cl){ zl = z; break; }
          g += LB(C(xs(cl), ys(zl), 5, 'k-acc') + T(xs(cl) + 12, ys(zl) + 16, String(k), 'pl-hdg', 'start'));
        });
      } else {
        [[1, 0.2], [2, 0.4], [4, 0.8]].forEach(([k, zf]) => {
          const d = `M${xs(0.9)},${ys(0)} L${xs(0.9)},${ys(zf)} L${xs(0.06)},${ys(zf) + 3} Q${xs(0.01)},${ys(zf) + 8} ${xs(0)},${ys(zf) + 18}`;
          g += P(d, cls, tip(`케이스 II — 시간 ${k}: 앞면 뒤는 고르게 부풀고(젖고), 앞면에서 뚝 떨어진다`));
          g += LB(T(xs(0.32), ys(zf) - 9, String(k), 'pl-warn', 'middle'));
        });
      }
      fr += g;
    });
    fr += LB(T(GXs[0], 772, '시간 4배 → 깊이 2배', 't-sub', 'start') + T(GXs[1], 772, '시간 4배 → 깊이 4배', 't-sub', 'start'));
    fr += LB(T(PX0 + 30, 816, '숫자 1 · 2 · 4 = 시간. 스며든 양 ∝ 시간ⁿ — n 0.5 픽 · 1 케이스 II', 't-dim', 'start') + T(PX0 + 30, 842, '그 사이(0.5 < n < 1)를 이상 확산이라 하고, 실제 PR은 보통 여기', 't-dim', 'start'));
    // 이 막은 어디? — 기준 범프(지름 25 · 피치 55 · 높이 30 µm, PR 35 µm)를 같은 배율로
    const S = 3.0, IY = 942 + 35 * S, IX0 = 830, IX1 = 1530;
    let ins = T(PX0 + 30, 884, '이 막은 어디? — 범프 사이 PR 틀을 크게 본 것', 'pl-hdg', 'start') + T(PX0 + 30, 910, '그림 기준 (예시): PR 35 µm · 범프 30 µm · 지름 25 µm · 틈 30 µm', 't-dim', 'start');
    ins += R(IX0, IY - 35 * S, IX1 - IX0, 35 * S, 'f-pr', tip('PR 틀 (예시 35 µm) — 위에서만 액이 닿는다'));
    [0, 1, 2, 3].forEach(i => {
      const cx = 900 + i * 55 * S, bx = cx - 12.5 * S;
      ins += R(bx, IY - 15 * S, 25 * S, 15 * S, 'f-cu2') + R(bx, IY - 18 * S, 25 * S, 3 * S, 'f-ni') + R(bx, IY - 30 * S, 25 * S, 12 * S, 'f-sn2');
    });
    ins += R(IX0, IY, IX1 - IX0, 3, 'f-seed2') + R(IX0, IY + 3, IX1 - IX0, 2, 'f-ti') + R(IX0, IY + 5, IX1 - IX0, 4, 'f-pas') + R(IX0, IY + 9, IX1 - IX0, 16, 'f-si');
    const hx0 = 900 + 55 * S + 12.5 * S, hx1 = 900 + 2 * 55 * S - 12.5 * S;
    ins += R(hx0, IY - 35 * S, hx1 - hx0, 35 * S, 'pl-hlbox', W2({rx: 3}, tip('왼쪽 그림의 막 — 이 틈의 PR을 두께 방향으로 크게 본 것. 액은 위에서 아래로 스며든다')));
    ins += K.arrow((hx0 + hx1) / 2, IY - 35 * S - 26, (hx0 + hx1) / 2, IY - 35 * S - 4, 's-arr');
    fr += ins;
    s += G(fr, only('front'));
    s += `<g data-v="rgraph"></g><g data-v="rheat"></g><g data-v="rstir"></g>`;
    return s;
    function W2(a, b){ return Object.assign({}, a, b); }
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 두께 · 온도 · 교반과 시간</div>
      ${K.seg('mode', [['dis', '녹는 PR (포지티브)'], ['swl', '부풀어 떨어지는 PR (가교)']], 'swl', 'PR 거동')}
      ${K.ctl('L', 'PR 두께 (µm)', 20, 100, 5, 35)}${K.ctl('T', '온도 (°C)', 40, 90, 1, 70)}
      ${K.seg('ag', [['none', '담금만'], ['flow', '순환 흐름'], ['spray', '분사 · 메가소닉'], ['hp', '고압 분사 (박리)']], 'flow', '교반')}
      ${K.seg('n', [['f', '확산 (픽)'], ['a', '중간'], ['c', '앞면 일정 속도 (케이스 II)']], 'a', '스며드는 방식 (가교 PR)')}
      ${K.kpis([['걸리는 시간', 'k-t', '분 (예시)'], ['두께 2배면', 'k-x2', '시간 배수'], ['10 °C 올리면', 'k-x10', '전체 시간이 빨라지는 배수'], ['인화점까지', 'k-fp', 'DMSO 약 88 °C 기준']])}
      <p class="pl-msg" data-o="msg"></p>
      <p class="note st03-fpn">인화점 경고는 예시 경고선(인화점 − 10 °C, 가정)입니다. 실제 여유는 장비 · 사내 안전 기준을 따릅니다.</p>
      ${K.model('D(70 °C) = 3×10⁻¹² m²/s(30 µm에 5분), 스며드는 방식 지수 n(0.5 · 0.75 · 1, t ∝ L^(1/n)), 겉 풀림 6 µm/분, 겉면 공급 2 · 8 · 30 · 60 µm/분, 스며드는 시간 배수 1.15 · 1 · 0.85(담금만 · 순환 · 분사 — 겉 액이 새로울수록 조금 빠름), 고압 분사 층 20 µm(층째 떼기와 보통 분사 가운데 빠른 쪽), 조각 치움 5 · 2 · 0.5분은 분 단위 시간이 나오도록 고른 <b>가정값</b>입니다. Ea 50 kJ/mol은 예시입니다(겉면 공급 · 조각 치움은 온도와 무관하다고 둠). 실제 시간은 PR · 스트리퍼 · 굽기 · 도금 이력마다 크게 다르니 클리어 시간을 직접 재세요.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip, TT, W, clamp} = K;
    const st = Object.assign({}, DEMO.front);
    let touched = false, ready = false;
    const lIn = ctx.card.querySelector('input[data-i=L]'), tIn = ctx.card.querySelector('input[data-i=T]');
    const nSeg = ctx.card.querySelector('.pl-seg[data-g="n"]');
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    const now = (L = st.L, T = st.T, ag = st.ag, n = st.n, m = st.m) => tTot(m, L, T, ag, n);
    const anim = (attr, vals, kt, dur, extra) => `<animate attributeName="${attr}" values="${vals}" keyTimes="${kt}" dur="${dur}s" repeatCount="indefinite"${extra || ''}/>`;
    const animT = (vals, kt, dur, extra) => `<animateTransform attributeName="transform" type="translate" values="${vals}" keyTimes="${kt}" dur="${dur}s" repeatCount="indefinite"${extra || ''}/>`;
    // 시간 표본: 반복의 85 % 동안 진행, 나머지 15 %는 끝 상태로 멈춤. extra 시점(도착)을 끼워 넣는다
    function samples(extra){
      let ts = []; for (let k = 0; k <= 20; k++) ts.push(k / 20);
      (extra || []).forEach(t => { if (t > 0 && t < 1) ts.push(t); });
      ts.sort((a, b) => a - b);
      ts = ts.filter((t, i) => !i || t - ts[i - 1] > 1e-4);
      return ts;
    }
    // 가교 PR: 젖는 앞면 (깊이 = Hb·τⁿ, 이 막의 높이 h에서 멈춤)
    function wetAnim(x0, w, h, Hb, n, dur, ta0){
      const nn = NX[n];
      if (ta0 != null && ta0 > 0 && ta0 < 1) Hb = h / Math.pow(ta0, nn);    // 도착 시점을 직접 정할 때 (고압 분사: 전체 시간 비)
      const ta = h < Hb ? Math.pow(h / Hb, 1 / nn) : 1, ts = samples([ta]);
      const dep = t => Math.min(h, Hb * Math.pow(t, nn));
      const kt = ts.map(t => (0.85 * t).toFixed(4)).concat(['1']).join(';');
      const ds = ts.map(t => dep(t).toFixed(1)).concat([dep(1).toFixed(1)]);
      let g = '';
      if (n === 'c') g += `<rect x="${x0}" y="${FT}" width="${w}" height="0" class="st03-wet">${anim('height', ds.join(';'), kt, dur)}</rect>`;
      else g += `<rect x="${x0}" y="${FT}" width="${w}" height="0" fill="${K.url(n === 'f' ? 'st03-wg' : 'st03-wg2')}">${anim('height', ds.join(';'), kt, dur)}</rect>`;
      if (n !== 'f') g += `<g>${L(x0, FT, x0 + w, FT, n === 'c' ? 'st03-front' : 'st03-front2')}${animT(ds.map(d => '0 ' + d).join(';'), kt, dur)}</g>`;
      return {g: G(g, W(tip(n === 'c' ? '케이스 II — 날카로운 앞면이 일정한 속도로 내려간다' : n === 'f' ? '픽 확산 — 젖은 정도가 흐릿하게 퍼지며, 갈수록 느려진다 (√시간)' : '중간(이상 확산) — 픽과 케이스 II 사이'), {'data-noov': '1'})), ta};
    }
    // 녹는 PR: 윗면이 일정한 속도로 내려감 (Hb를 반복의 85 %에 다 녹임)
    function dissAnim(x0, w, h, Hb, dur){
      const ta = Math.min(1, h / Hb), k1 = (0.85 * ta).toFixed(4);
      const kt = `0;${k1};1`;
      let g = R(x0, FT, w, h, 'pl-ghost') + `<rect x="${x0}" y="${FT}" width="${w}" height="${h}" class="f-pr">${anim('y', `${FT};${FT + h};${FT + h}`, kt, dur)}${anim('height', `${h};0;0`, kt, dur)}</rect>`;
      g += `<rect x="${x0}" y="${FT}" width="${w}" height="9" class="st03-gel">${anim('y', `${FT};${FT + h - 9};${FT + h - 9}`, kt, dur)}${anim('opacity', '1;1;0;0', `0;${k1};${(0.85 * ta + 0.002).toFixed(4)};1`, dur)}</rect>`;
      return {g: G(g, W(tip('녹는 PR — 겉이 풀려(얇은 겔층) 녹아 나가며 윗면이 일정한 속도로 내려간다'), {'data-noov': '1'})), ta};
    }
    function filmBase(x0, w, h, swl){ return R(x0, FT, w, h, 'f-pr', tip(st.m === 'dis' && !swl ? 'PR (녹는 포지티브 — 예: 노볼락/DNQ)' : 'PR (부풀어 떨어지는 가교 PR — 예: 두꺼운 네거티브)')); }
    function subst(x0, w, y){ let s = '', yy = y; SUB.forEach(([hh, c, t]) => { s += R(x0, yy, w, hh, c, tip(t)); yy += hh; }); return s; }
    // 막 하나 (모드에 따라 젖는 앞면 또는 녹아 내려감)
    function film(x0, w, h, Hb, dur, ta0){
      if (st.m === 'dis'){ const d = dissAnim(x0, w, h, Hb, dur); return {g: d.g, ta: d.ta}; }
      const a = wetAnim(x0, w, h, Hb, st.n, dur, ta0);
      return {g: filmBase(x0, w, h) + a.g, ta: a.ta};
    }
    const doneMark = (x, y, k, dur, txt) => `<g opacity="0">${anim('opacity', '0;0;1;1', `0;${k.toFixed(4)};${Math.min(0.999, k + 0.002).toFixed(4)};1`, dur)}${C(x, y, 13, 'k-ok')}${T(x, y + 6, '✓', 'st03-ck')}${txt ? T(x + 20, y + 7, txt, 'pl-hdg3', 'start') : ''}</g>`;

    function render(){
      if (!ready) return;
      const sid = ctx.step();
      const rT = A(st.T), dur = clamp(6 / rT, 1.6, 24);       // 온도가 높을수록 빨리 (반응 · 막 속 확산 배수)
      // ── 액 속 용제 분자 (온도가 높을수록 빨리 흔들린다) + 데운 기운
      const rg = K.rng(9), jd = clamp(2.8 / Math.sqrt(rT), 0.9, 7);
      let mo = '';
      for (let k = 0; k < 22; k++){
        const x = 70 + rg() * 680, y = 214 + rg() * 140, a = 7 + 6 * Math.sqrt(rT);
        const pts = []; for (let q = 0; q < 4; q++) pts.push(`${(x + (rg() - 0.5) * 2 * a).toFixed(0)},${(y + (rg() - 0.5) * 2 * a).toFixed(0)}`);
        mo += `<circle r="5.5" class="st03-mol"><animateMotion dur="${(jd * (0.8 + rg() * 0.5)).toFixed(2)}s" begin="-${(rg() * 4).toFixed(2)}s" repeatCount="indefinite" path="M${x.toFixed(0)},${y.toFixed(0)} L${pts.join(' L')} Z"/></circle>`;
      }
      // front 단계: 막 안으로 들어가는 분자 몇 개
      let mi = '';
      for (let k = 0; k < 6; k++){
        const x = (k < 3 ? CA : CB) + 40 + (k % 3) * 70, d0 = 300 + (k % 3) * 18;
        mi += K.mover(x, d0, x + (k % 2 ? 12 : -12), FT + 40 + (k % 3) * 30, 5, 'st03-mol', 3.2, k * 0.9);
      }
      ctx.$('[data-v="mol"]').innerHTML = G(mo, W(tip('용제 분자 (그림은 크게) — 따뜻할수록 활발하다'), {'data-noov': '1'})) + G(mi, W(K.only('front'), {'data-noov': '1'}));
      ctx.$('[data-v="heatglow"]').innerHTML = G(R(LX0, LY0, LX1 - LX0, FT - LY0, 'f-heat', {opacity: clamp((st.T - 40) / 40, 0.05, 1).toFixed(2)}), K.only('heat'));

      // ── front: 두 칸 (픽 · 케이스 II), 막 높이는 두께 L
      {
        const px = Math.min(10, HM / st.L), H = st.L * px, by = FT + H;
        let g = LB(T(CA + CW / 2, 160, '픽 확산', 'pl-hdg') + T(CA + CW / 2, 190, '경계가 흐릿함', 't-dim') + T(CB + CW / 2, 160, '케이스 II', 'pl-warn') + T(CB + CW / 2, 190, '날카로운 앞면', 't-dim'));
        [[CA, 'f'], [CB, 'c']].forEach(([x0, n]) => {
          g += filmBase(x0, CW, H, true) + wetAnim(x0, CW, H, H, n, 6).g + subst(x0, CW, by);
          // 같은 시간 간격(1 · 2 · 3 · 4)마다 앞면 위치
          [1, 2, 3, 4].forEach(k => {
            const yk = FT + H * Math.pow(k / 4, NX[n]);
            g += L(x0 + CW, yk, x0 + CW + 9, yk, n === 'c' ? 'st03-tk2' : 'st03-tk') + LB(T(x0 + CW + 13, yk + 7, String(k), n === 'c' ? 'st03-tn2' : 'st03-tn', 'start'));
          });
        });
        const cy = by + SUBH + 36;
        g += LB(TT(CA + CW / 2, cy, ['깊이 ∝ √시간', '갈수록 느려진다'], 't-sub', 'middle', 27) + TT(CB + CW / 2, cy, ['깊이 ∝ 시간', '일정한 속도'], 't-sub', 'middle', 27));
        g += LB(T(LX0 + 20, cy + 76, `막 두께 ${st.L} µm · 오른쪽 숫자 1~4 = 같은 시간 간격마다 앞면 자리`, 't-dim', 'start'));
        g += LB(T(LX0 + 20, cy + 108, '실제 PR은 보통 그 사이(이상 확산) — 경계도 칼같이 나뉘지 않는다', 't-acc', 'start'));
        ctx.$('[data-v="front"]').innerHTML = G(g, K.only('front'));
      }

      // ── square: 두께 L과 2L (같은 배율)
      {
        const px = Math.min(10, HM / (2 * st.L)), Ha = st.L * px, Hb = 2 * st.L * px;
        let g = LB(T((CA + CB + CW) / 2, 152, '같은 PR · 같은 액 — 두께만 2배', 't-acc'));
        g += LB(T(CA + CW / 2, 200, `${st.L} µm`, 't-lbl') + T(CB + CW / 2, 200, `${2 * st.L} µm`, 't-lbl'));
        const p1 = parts(st.m, st.L, st.T, st.ag, st.n), p2 = parts(st.m, 2 * st.L, st.T, st.ag, st.n);
        const t1 = p1.a + p1.b, t2 = p2.a + p2.b, cy = FT + Hb + SUBH + 36;
        // 얇은 막이 끝나는 시점: 가교 PR은 스며들기 비, 고압 분사는 전체 시간 비 (이름표와 같은 기준)
        const fa = film(CA, CW, Ha, Hb, dur, st.m === 'swl' && st.ag === 'hp' ? t1 / t2 : null), fb = film(CB, CW, Hb, Hb, dur);
        g += fa.g + subst(CA, CW, FT + Ha) + fb.g + subst(CB, CW, FT + Hb);
        g += doneMark(CA + CW / 2, FT + Ha - 22, 0.85 * fa.ta, dur, '') + doneMark(CB + CW / 2, FT + Hb - 22, 0.85, dur, '');
        let la, lb;
        if (st.m === 'dis'){ la = [`녹아 없어짐 ${f1(t1)}분`, '겉부터 — 두께에 비례']; lb = [`${f1(t2)}분 (×${f2(t2 / t1)})`, '두께 2배 → 시간 2배']; }
        else if (st.ag === 'hp'){ la = [`층째 떼기 ${f1(t1)}분`, '고압 분사']; lb = [`${f1(t2)}분 (×${f2(t2 / t1)})`, '두께에 비례하는 쪽']; }
        else { la = [`스며들기 ${f1(p1.a)}분`, `전체 ${f1(t1)}분`]; lb = [`스며들기 ${f1(p2.a)}분 (×${f2(p2.a / p1.a)})`, `전체 ${f1(t2)}분 (×${f2(t2 / t1)})`]; }
        g += LB(TT(CA + CW / 2, cy, la, 't-sub', 'middle', 28) + TT(CB + CW / 2, cy, lb, 't-sub', 'middle', 28));
        // 시간 막대: 두꺼운 막이 끝날 때까지 = 한 번 반복
        const bx0 = CA, bx1 = CB + CW, byy = cy + 74, ka = st.m === 'dis' ? 0.5 : fa.ta, xa = bx0 + (bx1 - bx0) * ka;
        g += R(bx0, byy - 5, bx1 - bx0, 10, 'st03-bar', {rx: 5}) + L(xa, byy - 14, xa, byy + 14, 'st03-tk') + L(bx1, byy - 14, bx1, byy + 14, 'st03-tk2');
        g += `<g data-noov="1">${C(bx0, byy, 9, 'k-acc2')}${animT(`0 0;${bx1 - bx0} 0;${bx1 - bx0} 0`, '0;.85;1', dur)}</g>`;
        const lbA = `${st.L} µm 끝 (${Math.round(ka * 100)} %)`;
        g += LB(T(Math.max(bx0 + 4, Math.min(xa, bx1 - 250)), byy + 38, lbA, 'pl-hdg', 'middle') + T(bx1, byy + 38, `${2 * st.L} µm 끝`, 'pl-warn', 'end'));
        g += LB(T(bx0, byy - 22, '시간 →', 't-dim', 'start'));
        // 오른쪽 작은 표: 두꺼운 막(2L)이 걸리는 시간 — 방식마다
        const qx = 614, qy = 430;
        if (st.m === 'swl' && st.ag !== 'hp'){
          g += LB(T(qx, qy, `${2 * st.L} µm`, 'pl-hdg', 'start') + T(qx, qy + 26, '스며들기', 't-dim', 'start'));
          ['f', 'a', 'c'].forEach((n, i) => {
            const v = parts('swl', 2 * st.L, st.T, st.ag, n).a, r = v / parts('swl', st.L, st.T, st.ag, n).a, on = n === st.n;
            g += LB(T(qx, qy + 70 + i * 62, n === 'f' ? '픽' : n === 'a' ? '중간' : '케이스 II', on ? 'pl-warn' : 't-sub', 'start') + T(qx, qy + 96 + i * 62, `${f1(v)}분 ×${r.toFixed(1)}`, on ? 'pl-warn' : 't-dim', 'start'));
          });
          g += LB(T(qx, qy + 270, '(예시)', 't-dim', 'start'));
        } else {
          g += LB(T(qx, qy, '두께 2배', 'pl-hdg', 'start') + T(qx, qy + 34, `×${f2(t2 / t1)}`, 'pl-warn', 'start') + T(qx, qy + 66, st.m === 'dis' ? '겉부터 녹아' : '층째 떼어', 't-dim', 'start') + T(qx, qy + 92, '두께에 비례', 't-dim', 'start'));
        }
        ctx.$('[data-v="sq"]').innerHTML = G(g, K.only('square'));
      }

      // ── heat: 막 하나 + 온도계
      {
        const px = Math.min(10, HM / st.L), H = st.L * px, by = FT + H;
        const fm = film(FX0, FX1 - FX0, H, H, dur);
        let g = fm.g + subst(FX0, FX1 - FX0, by);
        // 온도계 x 636~660, y 380(100 °C)~860(40 °C)
        const ty = t => 860 - (t - 40) * 8, tx = 636;
        g += R(tx + 26, ty(Math.min(100, FP)), 7, ty(FP - 10) - ty(Math.min(100, FP)), 'st03-wz', tip('예시 경고선: 인화점 − 10 °C (가정) — 실제 여유는 장비 · 사내 안전 기준'));
        g += R(tx, 380, 24, 480, 'st03-th', {rx: 12}) + C(tx + 12, 884, 22, 'st03-hg') + R(tx + 6, ty(st.T), 12, 884 - ty(st.T), 'st03-hg', {rx: 6});
        for (let t = 40; t <= 100; t += 10) g += L(tx - 8, ty(t), tx, ty(t), 's-axis') + (t < 100 ? LB(T(tx - 12, ty(t) + 7, String(t), 't-dim', 'end')) : '');
        [[FP, 'DMSO 약 88'], [FPN, 'NMP 약 91']].forEach(([t, nm], i) => { g += L(tx + 24, ty(t), tx + 40, ty(t), 'st03-fp') + LB(T(tx + 44, ty(t) + (i ? -2 : 16), nm, 'st03-fpt', 'start')); });
        g += LB(T(tx + 12, 360, `${st.T} °C`, st.T > FP - 10 ? 'pl-warn' : 't-acc'));
        g += LB(T(tx + 44, ty(FP) + 44, '인화점', 't-dim', 'start'));
        g += LB(T(LX0 + 20, 152, '따뜻할수록 용제 분자가 활발하다 → 빨리 스며든다', 't-acc', 'start'));
        const t70 = now(st.L, 70), tn = now(), cy = by + SUBH + 36;
        const l1 = `${st.T} °C — 걸리는 시간 ${f1(tn)}분 (70 °C면 ${f1(t70)}분)`;
        const l2 = `반응 · 막 속 확산 ×${f2(rT)} · 전체 ×${f2(t70 / tn)} (70 °C 대비)`;
        g += LB(T(LX0 + 20, cy, l1, 't-sub', 'start') + T(LX0 + 20, cy + 30, l2, 't-dim', 'start') + T(LX0 + 20, cy + 58, '겉면 공급 · 조각 치우기 몫은 온도로 거의 안 빨라진다', 't-dim', 'start'));
        ctx.$('[data-v="heat"]').innerHTML = G(g, K.only('heat'));
      }

      // ── stir: 막 하나 + 경계층 + 흐름 · 분사 (고압 분사는 층째 떼어 냄)
      {
        const px = Math.min(10, HM / st.L), H = st.L * px, by = FT + H, w = FX1 - FX0;
        const DL = {none: 60, flow: 30, spray: 8, hp: 4}[st.ag];
        let g = '';
        const hpS = st.ag === 'hp' && st.m === 'swl';
        let hpTop = null, disTop = null;
        const dlLbl = L(FX1, FT - DL / 2, FX1 + 14, FT - DL / 2, 's-dash') + LB(T(FX1 + 18, FT - DL / 2 + 7, '경계층', 'pl-warn', 'start') + T(FX1 + 18, FT + 30, '겉면 공급이', 't-dim', 'start') + T(FX1 + 18, FT + 54, '건너는 층', 't-dim', 'start'));
        if (st.m === 'dis'){
          // 녹는 PR: 윗면이 내려가고 경계층(과 그 이름표)도 따라간다. 내려가는 빠르기 = 전체 시간 (교반에 따라 다름)
          const dd = clamp(6 * now() / now(st.L, 70, 'flow'), 1.6, 24), kt = '0;.85;1';
          disTop = {dd, kt};
          g += R(FX0, FT, w, H, 'pl-ghost', tip('처음 막 두께')) + `<rect x="${FX0}" y="${FT}" width="${w}" height="${H}" class="f-pr">${anim('y', `${FT};${by};${by}`, kt, dd)}${anim('height', `${H};0;0`, kt, dd)}</rect>`;
          g += `<g data-noov="1">${R(FX0, FT - DL, w, DL, 'f-dl') + R(FX0, FT - DL, w, DL, 'st03-haze') + L(FX0, FT - DL, FX1, FT - DL, 's-dash') + R(FX0, FT, w, 9, 'st03-gel') + dlLbl}${animT(`0 0;0 ${H};0 ${H}`, kt, dd)}</g>`;
        } else if (hpS){
          // 부푼 층(20 µm)을 깨서 떼어 내고, 다음 층이 부풀고 … (단계마다 2초)
          const lay = DC * px, nL = Math.ceil(st.L / DC), dd = 2 * nL + 1;    // 층마다 2초 + 다 걷힌 뒤 1초
          const ys = [], hs = [], tr = [], lh = [], kt = [];
          for (let k = 0; k <= nL; k++){ const c = Math.min(H, k * lay); ys.push((FT + c).toFixed(1)); hs.push((H - c).toFixed(1)); tr.push(`0 ${c.toFixed(1)}`); lh.push(Math.max(0, Math.min(lay, H - c)).toFixed(1)); kt.push((2 * k / dd).toFixed(4)); }
          const ktS = kt.join(';'), disc = ' calcMode="discrete"';
          g += R(FX0, FT, w, H, 'pl-ghost', tip('처음 막 두께')) + `<rect x="${FX0}" y="${FT}" width="${w}" height="${H}" class="f-pr">${anim('y', ys.join(';'), ktS, dd, disc)}${anim('height', hs.join(';'), ktS, dd, disc)}</rect>`;
          hpTop = {ys, ktS, dd, nL};
          g += `<g opacity="0" data-noov="1">${anim('opacity', '0;'.repeat(nL) + '1', ktS, dd, disc)}${C(FX0 + w / 2 - 70, FT + H / 2, 15, 'k-ok')}${T(FX0 + w / 2 - 70, FT + H / 2 + 6, '✓', 'st03-ck')}${T(FX0 + w / 2 - 46, FT + H / 2 + 8, '다 떼어 냄', 'pl-hdg3', 'start')}</g>`;
          let ly = `<rect x="${FX0}" y="${FT}" width="${w}" height="${Math.min(lay, H)}" class="f-prs">${anim('height', lh.join(';'), ktS, dd, disc)}</rect>`, lf = '';
          const cy0 = FT, ch = Math.min(lay, H);
          ly += P(`M${FX0 + 70},${cy0} l18,${ch * 0.4} l-10,${ch * 0.3} M${FX0 + 230},${cy0} l-14,${ch * 0.45} l16,${ch * 0.25} M${FX0 + 400},${cy0} l12,${ch * 0.6} M${FX0 + 150},${cy0 + ch * 0.5} l60,6 M${FX0 + 320},${cy0 + ch * 0.35} l50,-4`, 'pl-crack st03-crk');
          // 떨어져 나가는 조각: 층마다 끝 0.9초 동안 위로 튀어 나간다 (전체 반복 dd초에 맞춘 시각)
          [[110, -1], [250, 1], [360, -1], [470, 1]].forEach(([dx, sgn], i) => {
            const tk = [0], tv = ['0 0'], ok = [0], ov = ['0'];
            for (let k = 0; k < nL; k++){
              const t1 = (2 * k + 1.1) / dd, t2 = (2 * k + 1.95) / dd, t3 = (2 * k + 2) / dd;
              tk.push(t1, t2, t3); tv.push('0 0', `${sgn * 40} -170`, '0 0');
              ok.push(t1, t1 + 0.04 / dd, t2); ov.push('0', '1', '0');
            }
            tk.push(1); tv.push('0 0'); ok.push(1); ov.push('0');
            const ks = a => a.map(t => (+t).toFixed(4)).join(';');
            lf += `<g transform="translate(${FX0 + dx} ${cy0 + 8})"><g opacity="0">${anim('opacity', ov.join(';'), ks(ok), dd)}${animT(tv.join(';'), ks(tk), dd)}<rect x="-16" y="-6" width="32" height="12" class="st03-flk" transform="rotate(${sgn * (20 + i * 9)})"/></g></g>`;
          });
          lf += L(FX1, FT + Math.min(lay, H) / 2, FX1 + 14, FT + Math.min(lay, H) / 2, 's-dash') + T(FX1 + 18, FT + Math.min(lay, H) / 2 + 7, '부푼 층', 'pl-warn', 'start') + T(FX1 + 18, FT + Math.min(lay, H) / 2 + 33, `(약 ${DC} µm,`, 't-dim', 'start') + T(FX1 + 18, FT + Math.min(lay, H) / 2 + 57, '가정)', 't-dim', 'start');
          // 부푼 층 · 금은 막 안으로 자르고(마지막 얇은 층), 조각 · 이름표는 자르지 않는다
          const mv = animT(tr.join(';'), ktS, dd, disc) + anim('opacity', '1;'.repeat(nL) + '0', ktS, dd, disc);
          g += `<clipPath id="${K.id('st03-hpc')}"><rect x="${FX0}" y="${FT}" width="${w}" height="${H}"/></clipPath>`;
          g += `<g clip-path="${K.url('st03-hpc')}" data-noov="1"><g>${ly}${mv}</g></g><g data-noov="1">${lf}${mv}</g>`;
        } else {
          const fm = film(FX0, w, H, H, dur);
          g += fm.g;
          g += G(R(FX0, FT - DL, w, DL, 'f-dl') + L(FX0, FT - DL, FX1, FT - DL, 's-dash'), tip('경계층 — 액이 흐르는 바깥과 PR 겉 사이, 흐름이 느려지는 층. 교반이 셀수록 얇다 (그림은 개념)'));
          g += LB(T(FX0 + w / 2, by - 24, '막 속 앞면 — 흐름 · 메가소닉과 거의 무관', 't-sub'));
        }
        g += subst(FX0, w, by);
        // 경계층 이름표 (오른쪽)
        if (!hpS && st.m !== 'dis') g += dlLbl;
        // 액 쪽: 흐름 · 분사 · 메가소닉
        let fl = '';
        const desc = {none: '담금만 — 액이 가만히, 녹은 성분이 겉에 쌓인다', flow: '순환 흐름 — 겉의 녹은 성분을 치운다', spray: '분사 · 메가소닉 — 경계층이 아주 얇다', hp: '고압 분사 — 센 분사가 부푼 층을 깨서 뗀다'}[st.ag];
        fl += LB(T(LX0 + 20, 152, desc, 't-acc', 'start'));
        if (st.ag === 'flow'){
          [236, 278, 320].forEach((y, i) => { fl += P(`M${LX0 + 30},${y} C${LX0 + 230},${y - 14} ${LX0 + 470},${y + 14} ${LX1 - 40},${y}`, 's-flow st03-fs' + i, K.mk('s-arr')); });
        } else if (st.ag === 'spray'){
          // 분사 노즐 (왼쪽) + 메가소닉 진동판 (오른쪽)
          fl += R(196, 184, 70, 26, 'st03-noz', {rx: 6}) + P(`M231,210 L150,${FT - DL - 4} M231,210 L231,${FT - DL - 4} M231,210 L312,${FT - DL - 4}`, 'st03-spr');
          fl += R(440, 196, 200, 16, 'st03-noz', {rx: 4}) + LB(T(540, 240, '메가소닉 (약 1 MHz)', 't-dim'));
          [0, 1, 2].forEach(i => { fl += P(`M450,${262 + i * 30} Q540,${276 + i * 30} 630,${262 + i * 30}`, 'st03-wav', {style: `animation-delay:-${i * 0.3}s`}); });
        } else if (st.ag === 'hp'){
          fl += R(290, 178, 100, 32, 'st03-noz', {rx: 6});
          let jt = '';
          [-60, -20, 20, 60].forEach(dx => {
            const ye = hpTop ? hpTop.ys.map(y => (+y - 6).toFixed(1)).join(';') : null;
            const ya = ye ? anim('y2', ye, hpTop.ktS, hpTop.dd, ' calcMode="discrete"') : disTop ? anim('y2', `${FT - 6};${by - 6};${by - 6}`, disTop.kt, disTop.dd) : '';
            jt += `<line x1="${340 + dx * 0.3}" y1="210" x2="${340 + dx * 2.2}" y2="${FT - 6}" class="st03-jet">${ya}</line>`;
          });
          fl += hpTop ? `<g>${jt}${anim('opacity', '1;'.repeat(hpTop.nL) + '0', hpTop.ktS, hpTop.dd, ' calcMode="discrete"')}</g>` : jt;
        } else {
          // 담금만: 녹은 성분이 겉에 쌓여 짙어진 층
          fl += R(FX0, FT - DL, w, DL, 'st03-haze');
        }
        g = G(fl, {'data-noov': '1'}) + g;
        const cy = by + SUBH + 36, p = parts(st.m, st.L, st.T, st.ag, st.n);
        let c1, c2;
        if (st.m === 'dis'){ c1 = `녹는 PR — 겉 풀림 ${f1(p.a)}분 + 겉면 공급 ${f1(p.b)}분 = ${f1(p.a + p.b)}분`; c2 = '교반은 겉면 공급 몫만 줄인다 (경계층이 얇아짐)'; }
        else if (hpS){ c1 = `고압 분사 — 층(약 ${DC} µm)째 떼어 ${f1(p.a + p.b)}분 (두께에 비례하는 쪽)`; c2 = '세게 할수록 가는 범프가 기울거나 찍힐 위험 (05장)'; }
        else { c1 = `스며들기 ${f1(p.a)}분 — 교반으로는 조금만(±15 %, 가정) 바뀜`; c2 = `교반이 크게 줄이는 것: 떼고 치우기 ${f1(p.b)}분 · 겉면 공급`; }
        g += LB(T(LX0 + 20, cy, c1, 't-sub', 'start') + T(LX0 + 20, cy + 30, c2, st.ag === 'hp' && st.m === 'swl' ? 'pl-warn' : 't-dim', 'start'));
        ctx.$('[data-v="stir"]').innerHTML = G(g, K.only('stir'));
      }

      // ── 오른쪽: 두께–시간 그래프 (square 크게 · stir 작게)
      ctx.$('[data-v="rgraph"]').innerHTML = G(graph(880, 268, 1500, 900, 'st03-gq', true), K.only('square')) + G(graph(880, 712, 1500, 980, 'st03-gs', false), K.only('stir'));
      ctx.$('[data-v="rheat"]').innerHTML = G(heatGraph(), K.only('heat'));
      ctx.$('[data-v="rstir"]').innerHTML = G(bars(), K.only('stir'));
      ctx.refresh();
      // ── KPI · 메시지
      const t = now(), x2 = now(2 * st.L) / t, x10 = t / now(st.L, st.T + 10), fp = FP - st.T;
      ctx.out('k-t', `${f1(t)}분`); ctx.out('k-x2', `×${f2(x2)}`); ctx.out('k-x10', `×${f2(x10)}`);
      ctx.out('k-fp', fp > 0 ? `${fp} °C 남음` : `${-fp} °C 넘음`);
      const kf = ctx.card.querySelector('[data-o="k-fp"]').parentNode;
      kf.classList.toggle('ok', fp >= 10); kf.classList.toggle('warn', fp > 0 && fp < 10); kf.classList.toggle('ng', fp <= 0);
      nSeg.classList.toggle('st03-dim', st.m === 'dis');
      let msg;
      if (st.m === 'dis'){
        const pd = parts('dis', st.L, st.T, st.ag), t0 = now(st.L, st.T, 'none'), t3 = now(st.L, st.T, 'hp');
        msg = `<b>녹는 PR</b> — 겉에서 풀리는 속도와 겉면 공급이 직렬로 막습니다(겉 풀림 ${f1(pd.a)}분 + 공급 ${f1(pd.b)}분). 두께 2배면 ×${f2(x2)} — 두께에 비례합니다. 교반만 바꿔도 ${f1(t0)}분(담금만) ~ ${f1(t3)}분(고압 분사)으로 ×${f2(t0 / t3)} 차이가 납니다.`;
        if (st.ag === 'flow') msg += ' 10 °C 올려도 약 ×' + f2(x10) + ' — 겉면 공급 몫은 온도로 거의 빨라지지 않으니 교반을 함께 보세요.';
      } else if (st.ag === 'hp'){
        msg = `<b>고압 분사</b> — 부푼 층을 깨서 떼어 내 스며들 거리가 짧아집니다. 두께 2배면 ×${f2(x2)}로 두께에 비례하는 쪽에 가까워집니다. 세게 할수록 범프 손상 위험 → <a data-go="tool.agit">05장</a>.`;
      } else {
        const p = parts('swl', st.L, st.T, st.ag, st.n);
        msg = `<b>부풀어 떨어지는 PR</b> — 스며드는 시간(${f1(p.a)}분)이 대부분입니다. 두께 2배면 ×${f2(x2)}(방식: ${NNM[st.n]}). 흐름 · 메가소닉은 스며드는 시간을 조금(±15 %, 가정)만 바꾸고, 들뜬 막을 떼고 치우는 시간(지금 ${f1(p.b)}분 — 담금만 5 · 순환 2 · 분사 0.5분)을 크게 줄입니다.`;
      }
      if (fp <= 0) msg += ' <b>⚠ 인화점(DMSO 약 88 °C)을 넘었습니다 — 예시 모델에서도 이 온도는 쓰지 않습니다.</b>';
      else if (fp < 10) msg += ` <b>⚠ 인화점까지 ${fp} °C — 예시 경고선(인화점 − 10 °C) 안쪽입니다.</b>`;
      ctx.q('[data-o=msg]').innerHTML = msg;
    }

    // 두께–시간 그래프 (가교 PR 픽~케이스 II 띠 · 지금 방식 · 녹는 PR 직선 · 고압 분사)
    function graph(gx0, gy0, gx1, gy1, cid, big){
      const xm = 2 * st.L <= 120 ? 120 : 200, agB = st.ag === 'hp' ? 'flow' : st.ag;
      const act = L => tTot(st.m, L, st.T, st.ag, st.n), dis = L => tTot('dis', L, st.T, st.ag, 'a');
      const fk = L => tTot('swl', L, st.T, agB, 'f'), c2 = L => tTot('swl', L, st.T, agB, 'c');
      const top = Math.max(act(2 * st.L), dis(2 * st.L), c2(2 * st.L), act(xm) * 0.6) * 1.18;
      const step = niceStep(top), tmax = Math.ceil(top / step) * step;
      const X = L => gx0 + L / xm * (gx1 - gx0), Y = t => gy1 - Math.min(t, tmax * 1.02) / tmax * (gy1 - gy0);
      let g = '';
      if (big) g += LB(T(PX0 + 30, 162, '두께와 걸리는 시간 (개념 모델)', 't-acc', 'start') + T(PX0 + 30, 192, `${st.T} °C · ${AGN[st.ag]} · ${st.m === 'dis' ? '녹는 PR' : '가교 PR — ' + NNM[st.n]}`, 't-dim', 'start'));
      else g += LB(T(PX0 + 30, 660, `두께와 걸리는 시간 (${st.T} °C · ${AGN[st.ag]})`, 'pl-hdg', 'start'));
      // 축 · 눈금
      g += L(gx0, gy1, gx1 + 10, gy1, 's-axis') + L(gx0, gy1, gx0, gy0 - 10, 's-axis');
      const xs = xm === 120 ? 20 : 40;
      for (let v = 0; v <= xm; v += xs) g += L(X(v), gy1, X(v), gy1 + 7, 's-axis') + LB(T(X(v), gy1 + 28, String(v), 't-dim'));
      for (let v = 0; v <= tmax + 1e-6; v += step) g += L(gx0 - 7, Y(v), gx0, Y(v), 's-axis') + (v > 0 && big ? L(gx0, Y(v), gx1, Y(v), 'st03-grid') : '') + LB(T(gx0 - 12, Y(v) + 7, String(+v.toFixed(1)), 't-dim', 'end'));
      g += LB(T(gx1, gy1 + (big ? 58 : 54), 'PR 두께 (µm)', 't-sub', 'end') + T(gx0 - 12, gy0 - 22, '분', 't-dim', 'end'));
      // 곡선 (그래프 영역 밖은 자른다)
      const line = f => { let d = ''; for (let i = 0; i <= 80; i++){ const L0 = xm * i / 80; d += (d ? ' L' : 'M') + X(L0).toFixed(1) + ',' + Y(f(L0)).toFixed(1); } return d; };
      const band = (() => { const up = [], dn = []; for (let i = 0; i <= 80; i++){ const L0 = xm * i / 80; up.push([X(L0), Y(fk(L0))]); dn.push([X(L0), Y(c2(L0))]); } return up.concat(dn.reverse()); })();
      let cv = `<clipPath id="${K.id(cid)}"><rect x="${gx0}" y="${gy0 - 4}" width="${gx1 - gx0 + 4}" height="${gy1 - gy0 + 4}"/></clipPath>`;
      cv += K.PG(band, 'st03-band', tip('부풀어 떨어지는 PR — 픽 확산(위, 상한)과 케이스 II(아래) 사이. 실제 PR은 보통 이 띠 안')) + P(line(fk), 'st03-fl') + P(line(c2), 'st03-fl');
      cv += P(line(dis), st.m === 'dis' ? 's-curve2 st03-bold' : 's-curve2', tip('녹는 PR — 두께에 비례 (직선)'));
      if (st.m === 'swl' && st.ag === 'hp') cv += P(line(act), 'st03-hp', tip('고압 분사 — 층째 떼어 내 두께에 비례하는 쪽'));
      else if (st.m === 'swl') cv += P(line(act), 's-curve', tip(`지금 방식 (${NNM[st.n]})`));
      g += G(cv, {'clip-path': K.url(cid)});
      { let le = null; for (let i = 0; i <= 200; i++){ const L0 = xm * i / 200; if (fk(L0) >= tmax){ le = L0; break; } }
        if (le != null && X(le) < gx1 - 120) g += LB(T(X(le) - 6, gy0 + 22, '픽 (상한) ↑', 't-dim', 'end')); }
      // 지금 두께 L과 2L
      const ta = act(st.L), tb = act(2 * st.L);
      g += L(X(st.L), gy1, X(st.L), Y(ta), 'st03-guide') + L(X(2 * st.L), gy1, X(2 * st.L), Y(tb), 'st03-guide');
      g += C(X(st.L), Y(ta), 9, 'k-acc2') + C(X(st.L), Y(ta), 16, 'co-ring') + C(X(2 * st.L), Y(tb), 9, 'st03-pt2');
      const lx = X(2 * st.L), right = lx < gx1 - 200;
      g += LB(T(right ? lx + 16 : lx - 16, Y(tb) - 10, `두께 2배 → ×${f2(tb / ta)}`, 't-warn st03-halo', right ? 'start' : 'end'));
      // 범례
      if (big){
        const ly = 980;
        const items = [
          [st.m === 'swl' ? (st.ag === 'hp' ? 'st03-hp' : 's-curve') : 's-curve2 st03-bold', st.m === 'swl' ? (st.ag === 'hp' ? '고압 분사 (지금)' : `가교 PR — 지금 방식 (${NNM[st.n]})`) : '녹는 PR (지금)'],
          ['st03-bandl', `가교 PR — 픽(위) ~ 케이스 II(아래)${st.ag === 'hp' ? ', 순환 기준' : ''}`],
          [st.m === 'dis' ? '' : 's-curve2', st.m === 'dis' ? '' : '녹는 PR — 두께에 비례']
        ].filter(x => x[0]);
        items.forEach(([c, t], i) => { const yy = ly + i * 32; g += (c === 'st03-bandl' ? R(PX0 + 40, yy - 12, 44, 14, 'st03-band') : L(PX0 + 40, yy - 5, PX0 + 84, yy - 5, c)) + LB(T(PX0 + 96, yy + 2, t, 't-dim', 'start')); });
      }
      return g;
    }
    // 온도 그래프: 빨라지는 배수 (70 °C = ×1)
    function heatGraph(){
      const gx0 = 880, gx1 = 1500, gy0 = 260, gy1 = 900, T0 = 40, T1 = 95, FM = 3.5;
      const X = t => gx0 + (t - T0) / (T1 - T0) * (gx1 - gx0), Y = f => gy1 - Math.min(f, FM) / FM * (gy1 - gy0);
      const t70 = now(st.L, 70), tot = t => t70 / now(st.L, t);
      let g = LB(T(PX0 + 30, 162, '온도를 올리면 얼마나 빨라지나 (70 °C = ×1)', 't-acc', 'start') + T(PX0 + 30, 192, `${st.L} µm · ${AGN[st.ag]} · ${st.m === 'dis' ? '녹는 PR' : '가교 PR — ' + NNM[st.n]} (개념 모델)`, 't-dim', 'start'));
      g += R(X(FP - 10), gy0, X(T1) - X(FP - 10), gy1 - gy0, 'f-heat', tip('예시 경고선 안쪽: 인화점(DMSO 약 88 °C) − 10 °C 위 (가정) — 실제 여유는 장비 · 사내 안전 기준'));
      g += LB(T(X(FP - 10) - 12, gy0 + 26, '경고 구역 →', 'pl-warn', 'end') + T(X(FP - 10) - 12, gy0 + 52, '인화점 − 10 °C (예시 · 가정)', 't-dim', 'end'));
      g += L(gx0, gy1, gx1 + 10, gy1, 's-axis') + L(gx0, gy1, gx0, gy0 - 10, 's-axis');
      for (let t = 40; t <= 90; t += 10) g += L(X(t), gy1, X(t), gy1 + 7, 's-axis') + LB(T(X(t), gy1 + 28, String(t), 't-dim'));
      for (let f = 0; f <= FM; f += 0.5) g += L(gx0 - 7, Y(f), gx0, Y(f), 's-axis') + (f % 1 === 0 ? LB(T(gx0 - 12, Y(f) + 7, '×' + f, 't-dim', 'end')) : '');
      g += L(gx0, Y(1), gx1, Y(1), 's-dash') + LB(T(gx0 + 8, Y(1) + 26, '70 °C 기준 ×1', 't-dim', 'start'));
      g += LB(T(gx1, gy1 + 58, '스트리퍼 온도 (°C)', 't-sub', 'end') + T(gx0 - 12, gy0 - 22, '빨라지는 배수', 't-dim', 'start'));
      [[FP, 'DMSO 약 88', 'end', -6], [FPN, 'NMP 약 91', 'start', 6]].forEach(([t, nm, an, dx]) => { g += L(X(t), gy0 - 6, X(t), gy1, 'pl-peak') + LB(T(X(t) + dx, gy0 - 12, nm, 'pl-pkt', an)); });
      let da = '', dt = '';
      for (let t = T0; t <= T1 + 1e-6; t += 0.5){ da += (da ? ' L' : 'M') + X(t).toFixed(1) + ',' + Y(A(t)).toFixed(1); dt += (dt ? ' L' : 'M') + X(t).toFixed(1) + ',' + Y(tot(t)).toFixed(1); }
      g += P(da, 's-curve', tip('반응 · 막 속 확산 — 아레니우스 (Ea 50 kJ/mol, 예시): 10 °C마다 약 ×1.6')) + P(dt, 's-curve2', tip('전체 시간이 빨라지는 배수 — 겉면 공급 · 조각 치우기 몫은 온도와 무관하다고 둔 개념 모델'));
      // 지금 온도
      const fa = A(st.T), ft = tot(st.T), xT = X(st.T);
      g += L(xT, gy1, xT, Y(Math.max(fa, ft)) - 14, 'st03-guide') + C(xT, Y(fa), 9, 'k-acc') + C(xT, Y(ft), 9, 'k-acc2') + C(xT, Y(fa), 16, 'co-ring');
      const left = st.T > 70, an = left ? 'end' : 'start', dx = left ? -16 : 16;
      let ya = Y(fa) - 8, yt = Y(ft) + 22;
      if (yt - ya < 30){ const mid = (ya + yt) / 2; ya = mid - 15; yt = mid + 15; }
      g += LB(T(xT + dx, ya, `×${f2(fa)}`, 'pl-hdg st03-halo', an) + T(xT + dx, yt, `×${f2(ft)}`, 'pl-warn st03-halo', an));
      // 범례 + 10 °C 올리면
      const fa10 = A(st.T + 10) / A(st.T), ft10 = now() / now(st.L, st.T + 10);
      g += L(PX0 + 40, 974, PX0 + 84, 974, 's-curve') + LB(T(PX0 + 96, 981, '반응 · 막 속 확산 (아레니우스, Ea 50 kJ/mol 예시)', 't-dim', 'start'));
      g += L(PX0 + 40, 1008, PX0 + 84, 1008, 's-curve2') + LB(T(PX0 + 96, 1015, '전체 시간이 빨라지는 배수 (지금 설정)', 't-dim', 'start'));
      g += LB(T(PX0 + 40, 1054, `${st.T} → ${st.T + 10} °C: 반응 ×${f2(fa10)}, 전체는 ×${f2(ft10)}만`, 't-sub', 'start') + (st.T + 10 > FP - 10 ? T(PX0 + 40, 1084, `(${st.T + 10} °C는 경고 구역${st.T + 10 > FP ? ' · 인화점 넘음' : ''} — 계산만 보임)`, 'pl-warn', 'start') : ''));
      return g;
    }
    // stir 오른쪽: 교반 네 가지의 걸리는 시간 (두 몫으로 나눠)
    function bars(){
      const rows = ['none', 'flow', 'spray', 'hp'].map(ag => Object.assign({ag}, parts(st.m, st.L, st.T, ag, st.n)));
      const mx = Math.max(...rows.map(r => r.a + r.b)), step = niceStep(mx), sm = Math.ceil(mx * 1.05 / step) * step;
      const bx0 = 1040, bw = 380, X = v => bx0 + v / sm * bw;
      let g = LB(T(PX0 + 30, 162, `교반에 따라 걸리는 시간 — ${st.L} µm · ${st.T} °C`, 't-acc', 'start') + T(PX0 + 30, 192, st.m === 'dis' ? '녹는 PR — 겉 풀림(반응) + 겉면 공급' : '가교 PR — 막 속 스며들기 + 떼고 치우기', 't-dim', 'start'));
      rows.forEach((r, i) => {
        const y = 232 + i * 82, on = r.ag === st.ag;
        if (on) g += R(PX0 + 16, y - 10, PX1 - PX0 - 32, 70, 'pl-hlbox', {rx: 10});
        g += LB(T(PX0 + 36, y + 32, AGN[r.ag], on ? 'pl-warn' : 't-sub', 'start'));
        g += R(bx0, y + 6, X(r.a) - bx0, 36, 'st03-ba', tip(st.m === 'dis' ? `겉 풀림(반응) ${f1(r.a)}분 — 온도로 빨라진다` : r.ag === 'hp' ? `층마다 스며들기 ${f1(r.a)}분 — 떼어 낸 만큼 짧아진다` : `막 속 스며들기 ${f1(r.a)}분 — 교반으로는 조금만(±15 %, 가정) 바뀐다`));
        g += R(X(r.a), y + 6, X(r.a + r.b) - X(r.a), 36, 'st03-bb', tip(st.m === 'dis' ? `겉면 공급 ${f1(r.b)}분 — 교반이 줄인다` : `떼고 치우기 ${f1(r.b)}분 — 교반이 줄인다`));
        g += LB(T(X(r.a + r.b) + 10, y + 32, `${f1(r.a + r.b)}분`, on ? 'pl-warn' : 't-sub', 'start'));
      });
      const ly = 584;
      g += R(PX0 + 40, ly - 14, 30, 16, 'st03-ba') + LB(T(PX0 + 80, ly + 1, st.m === 'dis' ? '겉 풀림 (반응)' : '막 속 스며들기', 't-dim', 'start'));
      g += R(PX0 + 300, ly - 14, 30, 16, 'st03-bb') + LB(T(PX0 + 340, ly + 1, st.m === 'dis' ? '겉면 공급 — 교반이 줄인다' : '떼고 치우기 — 교반이 줄인다', 't-dim', 'start'));
      return g;
    }

    const goFromFront = to => { const s = ctx.step(); if (s === 'front') ctx.go(to); };
    ctx.seg('mode', (v, user) => { st.m = v; if (user){ touched = true; goFromFront('square'); } render(); });
    ctx.range('L', v => { st.L = v; render(); return `${v} µm`; });
    ctx.range('T', v => { st.T = v; render(); return `${v} °C`; });
    ctx.seg('ag', (v, user) => { st.ag = v; if (user){ touched = true; goFromFront('stir'); } render(); });
    ctx.seg('n', (v, user) => { st.n = v; if (user){ touched = true; goFromFront('square'); } render(); });
    lIn.addEventListener('input', () => { touched = true; });
    tIn.addEventListener('input', () => { touched = true; goFromFront('heat'); });
    ready = true;
    render();
    // 손대기 전에는 단계마다 예시 값으로. 발표 모드에서는 위젯을 만질 수 없으므로 늘 예시 값으로 되돌린다
    ctx.demo = sid => {
      const ep = window.EngrTheatres && window.EngrTheatres.strip;
      if (ep && ep.state && ep.state.pres != null) touched = false;
      const d = DEMO[sid];
      if (touched || !d) return ctx.refresh();
      Object.assign(st, d);
      lIn.value = d.L; ctx.out('L', `${d.L} µm`);
      tIn.value = d.T; ctx.out('T', `${d.T} °C`);
      setSeg('mode', d.m); setSeg('ag', d.ag); setSeg('n', d.n);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['확산', '진한 곳에서 묽은 곳으로 분자가 저절로 퍼지는 움직임. 막 속에서는 용제 분자가 PR 사슬 사이를 비집고 들어간다'],
      ['확산계수 (D)', '퍼지는 빠르기(m²/s). 막 속에서는 액 속보다 훨씬 작다 (이 장 예시 3×10⁻¹² m²/s — 가정)'],
      ['앞면', '용제에 젖은 곳과 마른 곳의 경계. 케이스 II에서는 날카롭고, 픽 확산에서는 흐릿하다'],
      ['케이스 II · 이상 확산', '단단한(유리 상태) 고분자에서 날카로운 앞면이 일정한 속도로 내려가는 확산 — 시간이 두께에 비례. 픽과 케이스 II 사이를 이상 확산이라 한다'],
      ['경계층 (확산층)', '액이 흐르는 바깥과 PR 겉 사이, 흐름이 느려지는 얇은 층. 교반이 셀수록 얇다 (<a href="#go-plating-03">전해도금 03장</a>과 같은 개념)'],
      ['고압 분사 (기계적 박리)', '센 분사로 부푼 막을 깨서 떼어 내는 것. 남은 두께를 줄여 스며들 거리를 짧게 한다'],
      ['아레니우스 · 활성화 에너지 (Ea)', '온도가 오르면 반응 · 확산이 지수적으로 빨라진다는 관계. Ea가 클수록 온도에 민감하다 (예시 50 kJ/mol → 10 °C마다 약 1.6배)'],
      ['인화점', '액 위 증기에 불꽃을 대면 불이 붙는 가장 낮은 온도. DMSO 약 87~89 °C, NMP 약 91 °C(밀폐식, 자료에 따라 다름)']
    ]) + K.field([
      '스트립 시간은 <b>가장 두꺼운 곳</b>(웨이퍼 가장자리 EBR 경계의 PR 턱 · 노치 포함) · <b>가장 좁은 틈</b> · <b>가장 낮은 온도 자리</b> 기준으로 잡고 여유(오버 스트립)를 둡니다 → <a data-go="residue.find">08장</a>.',
      '온도를 올리면 시간은 줄지만 금속 손실 · 증발 · 액 분해가 빨라지고 인화점 여유가 줄어듭니다 [스트립-조건] → <a data-go="metal.cu">07장</a> · <a data-go="chem.safety">04장</a>.',
      '제품이 바뀌어 PR이 두꺼워지면(<b>[앞 공정]</b> 포토 · 도금 조건 변경) 가교 PR은 시간이 두께 비율보다 더(많게는 제곱으로) 늘 수 있습니다. 두께에 비례해서만 늘리면 잔여가 생길 수 있으니 클리어 시간을 다시 잽니다.',
      '<b>두 두께로 재면 방식이 보입니다.</b> 같은 PR · 같은 액에서 두께만 다른 블랭킷 시편 두 장(예: 35 · 70 µm)이 들뜨기 시작하는(또는 바닥이 드러나는) 시간의 비가 r이면 n ≈ ln 2 / ln r입니다(r ≈ 2 → 케이스 II 쪽, r ≈ 4 → 픽 쪽). 같은 시편을 두 온도에서 재면 그 PR · 액의 온도 민감도도 압니다.',
      '고압 분사의 압력 · 노즐 거리 · 스캔 속도는 [스트립-조건] 손잡이입니다. 부푼 가교 막에는 크게 듣지만, 세게 할수록 가는 범프가 기울거나 찍힐 수 있습니다 → <a data-go="tool.agit">05장</a> · <a data-go="defects.tiles">09장</a>.'
    ]) + K.deep(`<ul>
      <li><b>픽의 2법칙</b> ∂C/∂t = D·∂²C/∂x². 겉 농도가 일정한 두꺼운 막에서 C/C₀ = erfc(x / 2√(Dt)) → 젖은 깊이 ∝ √(Dt), 경계는 erfc 꼴로 흐릿합니다. 두께 L을 다 적시는 시간 t ≈ L²/D(정의에 따라 계수 0.2~1). 이 탭은 크기 감각으로 t ≈ L²/D를 씁니다: 30 µm에 5분이면 D = (30×10⁻⁶)² / 300 s = 3×10⁻¹² m²/s(가정). 픽 법칙은 원래 고무 상태(무른) 고분자에 잘 맞습니다.</li>
      <li><b>유리 상태 고분자는 '이상 확산'이 흔합니다</b> — 60~80 °C의 가교 네거티브 막이나 하드베이크된 노볼락처럼 스트립 온도가 막의 유리 전이 온도(Tg — 단단한 유리 상태와 무른 고무 상태의 경계 온도)보다 낮은 막에서는, 마른 안쪽은 단단하고 용제가 들어간 쪽만 Tg가 낮아져 무릅니다. 그래서 그 경계가 날카로운 앞면이 되어 일정 속도 v로 내려가는 케이스 II(시간 ∝ L)나, 이것과 픽 확산(시간 ∝ L²)의 중간이 흔합니다. 스며든 양 M_t ∝ tⁿ로 쓰면 n = 0.5 픽 · n = 1 케이스 II · 그 사이 이상 확산이고, 위젯은 다 적시는 시간을 t ∝ L^(1/n)으로 씁니다. 그래서 '두께 2배 → 4배'는 <b>상한</b>이지 기대값이 아닙니다. 공개 연구 예: NMP가 폴리이미드 막(4~8 µm)에 스밀 때 이상 확산, 22 °C에서 유효 D 약 3~6×10⁻¹⁶ m²/s, 앞면 속도 약 8×10⁻¹¹ m/s, 활성화 에너지 약 56 kJ/mol. 같은 막에서 DMSO는 케이스 II로 앞면이 약 10배 빨랐습니다(레이저 간섭 연구, 1989). 폴리이미드는 PR보다 훨씬 단단해 숫자 크기를 그대로 쓰지 않고, 활성화 에너지의 크기 감각만 빌립니다.</li>
      <li><b>아레니우스</b> k = A·exp(−Ea/RT). Ea 50 kJ/mol → 60 → 70 °C 약 ×1.7, 70 → 80 °C 약 ×1.6. Ea 40이면 ×1.5, 60이면 ×1.8~1.9 — "10 °C마다 1.5~2배". 단, 이것은 반응 · 막 속 확산의 배수입니다. 액 속 확산(겉면 공급)의 활성화 에너지는 보통 15~25 kJ/mol로 작고, 조각 치우기는 거의 온도와 무관해 <b>전체 시간은 이보다 덜 줄어듭니다</b>(위젯 예: 70 → 80 °C에서 녹는 PR · 순환 ×1.29, 가교 PR(중간) · 순환 60 µm ×1.51).</li>
      <li><b>녹는 PR의 직렬 저항</b> 1/r = 1/r_겉 + 1/r_공급, 즉 t = L/r_겉 + L/r_공급 — 전해도금의 '반응 지배 vs 물질전달 지배'(<a href="#go-plating-04">전해도금 04장</a>)와 같은 꼴입니다. 교반은 r_공급만 키웁니다. 녹은 고분자는 액 속 확산계수가 작아(작은 분자보다 10~100배 느림) 겉면 공급이 생각보다 자주 발목을 잡습니다. 위젯 예(60 µm · 70 °C): 담금만 40분 · 순환 17.5분 · 분사 12분 · 고압 분사 11분 — 모두 두께에 비례(×2).</li>
      <li><b>메가소닉(약 1 MHz)</b>의 진동 경계층(스토크스 층) 두께 √(2ν/ω)는 물에서 약 0.6 µm로 아주 얇아 겉면 공급을 크게 돕지만, 막 속 확산은 바꾸지 못합니다(<a data-go="tool.agit">05장</a>).</li>
      <li><b>고압 분사는 '기계적 박리'</b> — 센 분사는 부푼 가교 막을 힘으로 깨서 떼어 냅니다. 위층이 떨어지면 용제가 새 면에 바로 닿아 남은 스며들 거리가 계속 짧아지므로, 한 번의 L²/D가 아니라 층째 깎는 꼴(시간 ∝ L)에 가까워집니다(위젯: 층 20 µm 가정 → 60 µm · 70 °C 약 9분, 두께 2배 ×1.9~2.0). 02장의 '부풀기만 하고 남는' 얇은 가교 막에 분사가 대책이 되는 까닭이고(<a data-go="resist.lift">02장</a>), 담금으로 불린 뒤 매엽 고압 분사로 떼는 혼합형 장비가 두꺼운 네거티브 PR에 흔한 까닭입니다(<a data-go="tool.agit">05장</a>).</li>
      <li><b>좁은 틈(깊이/폭 > 2)</b> 속은 흐름이 잘 안 들어가 '깊은 구멍 속 확산'(<a href="#go-plating-08">전해도금 08장</a>)과 같은 문제가 됩니다 → 틈 바닥 PR이 가장 늦게 걷힙니다(<a data-go="residue.gap">08장</a>). 이 탭 그림 기준(PR 35 µm · 틈 30 µm)은 깊이 : 폭 약 1.2, 피치 40 µm 예시(틈 18 µm)는 약 1.9입니다.</li></ul>`);
  },
  css: `.pl-svg .st03-wet{fill:rgba(125,211,252,.35)}
.pl-svg .st03-front{fill:none;stroke:#fbbf24;stroke-width:3.4;stroke-dasharray:10 6}
.pl-svg .st03-front2{fill:none;stroke:#fbbf24;stroke-width:2;stroke-dasharray:4 7;opacity:.6}
.pl-svg .st03-mol{fill:#7dd3fc;stroke:#e0f2fe;stroke-width:1}
.pl-svg .st03-gel{fill:rgba(196,181,253,.7)}
.pl-svg .st03-haze{fill:rgba(167,139,250,.28)}
.pl-svg .st03-tk{stroke:#7dd3fc;stroke-width:3}
.pl-svg .st03-tk2{stroke:#fbbf24;stroke-width:3}
.pl-svg .st03-tn{font-size:19px;font-weight:800;fill:#7dd3fc !important}
.pl-svg .st03-tn2{font-size:19px;font-weight:800;fill:#fbbf24 !important}
.pl-svg .st03-ck{font-size:17px;font-weight:900;fill:#052e16 !important;stroke:none !important;text-anchor:middle}
.pl-svg .st03-bar{fill:rgba(148,163,184,.22);stroke:rgba(148,163,184,.4);stroke-width:1}
.pl-svg .st03-th{fill:#0b1222;stroke:#94a3b8;stroke-width:2}
.pl-svg .st03-hg{fill:#ef4444}
.pl-svg .st03-wz{fill:rgba(245,158,11,.55)}
.pl-svg .st03-fp{stroke:#f87171;stroke-width:3}
.pl-svg .st03-fpt{font-size:19px;font-weight:700;fill:#fca5a5 !important}
.pl-svg .st03-noz{fill:#334155;stroke:#94a3b8;stroke-width:1.4}
.pl-svg .st03-spr{fill:none;stroke:#bae6fd;stroke-width:2.4;stroke-dasharray:3 9;animation:jzflow .6s linear infinite}
.pl-svg .st03-jet{stroke:#e0f2fe;stroke-width:5;stroke-dasharray:14 6;animation:jzflow .25s linear infinite}
.pl-svg .st03-wav{fill:none;stroke:#a5f3fc;stroke-width:2.2;opacity:.7;animation:st03-pulse .9s ease-in-out infinite}
@keyframes st03-pulse{0%,100%{opacity:.2}50%{opacity:.85}}
.pl-svg .st03-fs0{animation-duration:1.2s}
.pl-svg .st03-fs1{animation-duration:1.6s;opacity:.6}
.pl-svg .st03-fs2{animation-duration:2.2s;opacity:.4}
.pl-svg .st03-crk{stroke:#1e1b4b;stroke-width:3.2}
.pl-svg .st03-flk{fill:#a99cf0;stroke:#ede9fe;stroke-width:1.4}
.pl-svg .st03-band{fill:rgba(125,211,252,.13)}
.pl-svg .st03-fl{fill:none;stroke:#7dd3fc;stroke-width:1.6;stroke-dasharray:3 6;opacity:.8}
.pl-svg .st03-hp{fill:none;stroke:#4ade80;stroke-width:3.6}
.pl-svg .st03-bold{stroke-width:4.4}
.pl-svg text.st03-halo{paint-order:stroke;stroke:#0b1222 !important;stroke-width:7px !important;stroke-linejoin:round}
.pl-svg .st03-grid{stroke:rgba(148,163,184,.12);stroke-width:1}
.pl-svg .st03-guide{fill:none;stroke:#8fa6c6;stroke-width:1.3;stroke-dasharray:3 5}
.pl-svg .st03-pt2{fill:#0b1222;stroke:#f59e0b;stroke-width:3}
.pl-svg .st03-ba{fill:rgba(125,211,252,.6)}
.pl-svg .st03-bb{fill:rgba(245,158,11,.7)}
.jc .pl-seg.st03-dim{opacity:.4}
.jc .note.st03-fpn{font-size:11.5px}`
});
})();
