/* 전해도금 07 — 웨이퍼 전류 분포: 왜 가장자리가 두꺼워지나 (웨이퍼 · 300 mm) */
(function(){
const RW = 0.15;                                            // 웨이퍼 반지름 (m)
const WX0 = 170, WX1 = 790, WY = 236;                        // 단면에서 웨이퍼 (아래가 앞면)
const CX0 = 980, CX1 = 1530, CY0 = 500, CY1 = 200, TMIN = 0.6, TMAX = 1.4;   // 두께 그래프
const MAP = {x: 1255, y: 800, r: 180};
const KAPPA = {lo: 5, mid: 20, hi: 60};                      // 액 전도도 (S/m) 예시
function I0(x){ let s = 1, t = 1; for (let k = 1; k < 30; k++){ t *= (x / 2) * (x / 2) / (k * k); s += t; if (t < 1e-12) break; } return s; }
// 개념 모델: 가장자리에서 전류를 받는 얇은 시드(면저항 Rs)가 면적당 저항 Rp로 액에 전류를 흘린다 → V(r) ∝ I₀(r/λ)
function profile(p){
  const Rs = 2.0e-8 / (p.seed * 1e-6), Rp = 0.03 / KAPPA[p.k] + (p.hrva ? 0.012 : 0) + 1.0e-3 / (p.f / 100);
  const lam = Math.sqrt(Rp / Rs), E = 0.2 * (p.shield ? 0.2 : 1) * (p.hrva ? 0.45 : 1), w = 0.008;
  const N = 120, r = [], t = [];
  for (let i = 0; i <= N; i++){ const rr = RW * i / N; r.push(rr); t.push(I0(rr / lam) / I0(RW / lam) * (1 + E * Math.exp(-(RW - rr) / w))); }
  let num = 0, den = 0;
  for (let i = 1; i <= N; i++){ const rm = (r[i] + r[i - 1]) / 2, tm = (t[i] + t[i - 1]) / 2, dr = r[i] - r[i - 1]; num += tm * rm * dr; den += rm * dr; }
  const mean = num / den, tn = t.map(v => v / mean);
  const mx = Math.max(...tn), mn = Math.min(...tn);
  return {r, t: tn, lam, center: tn[0], edge: tn[N], unif: (mx - mn) / 2 * 100, at: rr => tn[Math.min(N, Math.round(Math.abs(rr) / RW * N))]};
}
const DEMO = {prim: {seed: 1.0, hrva: false, shield: false}, term: {seed: 0.08, hrva: false, shield: false}, fix: {seed: 0.08, hrva: true, shield: true}};

(window.EngrPlatingChapters = window.EngrPlatingChapters || []).push({
  no: '07', id: 'wafer', part: 2, short: '웨이퍼 분포', scale: '웨이퍼 · 300 mm',
  title: '웨이퍼 전류 분포 — 왜 가장자리가 두꺼워지나',
  hook: '전기는 가장자리로 들어온다',
  one: '전류는 웨이퍼 가장자리의 접점으로 들어와 아주 얇은 시드층을 타고 중심까지 가야 합니다. 게다가 전기력선은 모서리에 모입니다. 그래서 아무것도 하지 않으면 가장자리가 두껍고 중심이 얇습니다.',
  ana: '<b>긴 호스</b> — 수도꼭지(접점)는 가장자리에 있고, 물(전류)은 얇은 호스(시드층)를 타고 중심까지 갑니다. 호스가 가늘고 길수록 끝에서는 물살이 약합니다. 시드가 얇을수록 중심이 얇게 도금되는 이유입니다.',
  steps: [
    {id: 'prim', t: '1차 분포 — 모서리에 몰린다', d: '전기력선은 가까운 길과 모서리로 몰립니다. 웨이퍼 가장자리는 옆쪽 액에서도 전류가 들어와 두꺼워지기 쉽습니다(가장자리 효과).'},
    {id: 'term', t: '터미널 효과 — 긴 호스', d: '전기는 가장자리 접점에서 들어와 얇은 시드를 따라 중심까지 갑니다. 시드가 얇을수록(저항이 클수록) 가는 동안 전압을 잃어 중심이 얇아집니다.'},
    {id: 'fix', t: '고르게 만드는 방법', d: '실드(가림판)로 가장자리 전류를 가리고, 구멍 뚫린 고저항판(HRVA)으로 모든 길의 저항을 크게 해 차이를 묻습니다. 웨이퍼를 돌려 둘레 방향을 평균하고, 애노드를 구역으로 나눠 따로 전류를 주기도 합니다.'},
    {id: 'map', t: '웨이퍼 맵 읽기', d: '동심원 무늬는 전류 분포(시드 · 실드 · 액), 한쪽 치우침은 하드웨어(접점 · 립씰 · 기울어짐), 줄무늬 · 부채꼴은 흐름을 먼저 의심합니다.'}
  ],
  icon(K){
    const {P, E} = K;
    return E(33, 33, 30, 30, 'pl-ic-edge') + E(33, 33, 20, 20, 'pl-ic-mid') + E(33, 33, 10, 10, 'pl-ic-cen');
  },
  draw(K){
    const {R, C, L, P, T, G, LB, tip, only, on, W, TT} = K;
    let s = '';
    s += R(40, 130, 880, 640, 'pl-panel', {rx: 16});
    s += T(64, 172, '도금 셀 단면 — 웨이퍼 앞면이 아래', 't-acc', 'start');
    // 셀
    s += P('M130,250 L130,720 L830,720 L830,250', 'f-tank') + R(133, 246, 694, 472, 'f-bath', tip('도금액'));
    s += R(140, 182, 680, 46, 'pl-headb', W({rx: 10}, tip('헤드 — 웨이퍼를 잡고 돈다'))) + R(612, 140, 36, 42, 'pl-headb') + P('M690,160 A80,12 0 0 1 850,160', 's-arr', K.mk('s-arr')) + LB(T(770, 150, '회전', 't-dim'));
    s += R(WX0, 228, WX1 - WX0, 8, 'f-wafer', tip('웨이퍼 (300 mm, 앞면이 아래)')) + R(WX0, WY, WX1 - WX0, 4, 'f-seed2', tip('시드층 — 아주 얇은 금속막. 전류가 가장자리에서 중심까지 이 막을 타고 간다'));
    s += R(WX0 - 8, 226, 14, 18, 'f-contact', tip('접점(콘택트) — 전류가 들어오는 입구. 가장자리에 있다')) + R(WX1 - 6, 226, 14, 18, 'f-contact');
    s += R(WX0 - 18, 244, 34, 10, 'f-seal', tip('립씰 — 액이 접점으로 새지 않게 막는다')) + R(WX1 - 16, 244, 34, 10, 'f-seal');
    s += `<g data-v="lines"></g>`;
    s += G(R(140, 300, 680, 18, 'pl-hrva', tip('고저항판(HRVA) — 작은 구멍이 많은 판. 모든 길의 저항을 크게 해 차이를 묻는다')) + LB(T(812, 336, '고저항판', 't-dim', 'end')), {class: 'w-hrva'});
    s += G(R(140, 262, 110, 14, 'f-shield', tip('실드(가림판) — 가장자리로 가는 전류를 가린다')) + R(710, 262, 110, 14, 'f-shield') + LB(T(148, 352, '실드 (가장자리 가림판)', 't-dim', 'start')), {class: 'w-shield'});
    s += R(290, 640, 380, 30, 'f-anode', tip('애노드(양극)'));
    s += LB(T(480, 708, '애노드 (+)', 't-dim'));
    // 터미널 효과: 시드를 따라 가며 약해지는 화살표
    let te = '';
    for (let k = 0; k < 5; k++){ const x0 = WX0 + 14 + k * 58, w = 7 - k * 1.3; te += P(`M${x0},${WY + 14} L${x0 + 46},${WY + 14}`, 'pl-hose', W(K.mk('s-arr2'), {style: `stroke-width:${w.toFixed(1)}px`})); te += P(`M${WX1 - 14 - k * 58},${WY + 14} L${WX1 - 60 - k * 58},${WY + 14}`, 'pl-hose', W(K.mk('s-arr2'), {style: `stroke-width:${w.toFixed(1)}px`})); }
    te += LB(T(480, WY + 64, '가장자리에서 들어와 중심으로 갈수록 약해진다', 't-warn'));
    s += G(te, W(only('term'), tip('시드를 따라 가는 전류 — 가는 동안 전압을 잃는다')));
    s += G(LB(T(150, 400, '전기력선이 가장자리로 몰린다', 't-warn', 'start')), only('prim'));
    // 오른쪽: 두께 그래프와 웨이퍼 맵
    s += R(940, 130, 640, 980, 'pl-panel', {rx: 16}) + T(964, 172, '반지름 방향 두께 (평균 = 1)', 't-acc', 'start');
    s += L(CX0, CY0, CX1, CY0, 's-axis') + L((CX0 + CX1) / 2, CY0, (CX0 + CX1) / 2, CY1, 's-faint');
    for (const v of [0.8, 1.0, 1.2]){ const y = CY0 - (v - TMIN) / (TMAX - TMIN) * (CY0 - CY1); s += L(CX0, y, CX1, y, v === 1 ? 's-dash' : 's-faint') + T(CX0 - 8, y + 6, v.toFixed(1), 't-dim', 'end'); }
    s += LB(T(CX0, CY0 + 32, '−150', 't-dim') + T((CX0 + CX1) / 2, CY0 + 32, '중심', 't-dim') + T(CX1, CY0 + 32, '+150 mm', 't-dim'));
    s += `<g data-v="curve"></g><g data-v="map"></g><g data-v="read"></g>`;
    // 아래 왼쪽: 단계마다
    s += R(40, 800, 880, 310, 'pl-panel', {rx: 16});
    s += G(TT(64, 846, ['1차 분포 — 전류는 저항이 가장 작은 길을 택한다', '· 웨이퍼 가장자리는 옆쪽 액에서도 전류를 받는다', '· 웨이퍼를 돌려도 반지름 방향 차이는 남는다', '· 고칠 곳: 실드, 셀 모양, 애노드 크기 · 거리'], 't-sub', 'start', 40), only('prim'));
    s += G(TT(64, 846, ['터미널 효과 — 시드가 얇을수록 크다', '· 시드 두께는 PVD(앞 공정)가 정한다 → 비도금 인자', '· 액 전도도가 높으면 오히려 커진다 (액 쪽 저항이 작아져', '  시드 저항이 상대적으로 커지므로)', '· 개구율이 클수록 시드로 흐르는 전류가 많아 커진다'], 't-sub', 'start', 40), only('term'));
    s += G(TT(64, 846, ['고르게 만드는 도구', '· 실드: 가장자리 전류를 직접 가린다', '· 고저항판(HRVA): 길마다 같은 큰 저항 → 차이가 묻힌다', '· 회전: 둘레 방향 평균 · 구역 애노드: 반지름별 전류 조절', '· 처음엔 약하게 시작(램프업) — 얇은 시드 보호'], 't-sub', 'start', 40), only('fix'));
    // map 단계: 패턴 세 가지
    const mini = (cx, kind, t1, t2) => {
      let g = `<clipPath id="pl7-m${kind}"><circle cx="${cx}" cy="950" r="78"/></clipPath>`;
      let f = '';
      if (kind === 'ring') for (let r = 78; r > 0; r -= 6) f += C(cx, 950, r, 'pl-hm', {style: `fill:${K.heat(0.25 + 0.7 * Math.pow(r / 78, 3))}`});
      if (kind === 'side') for (let x = -78; x < 78; x += 6) f += R(cx + x, 872, 6, 156, 'pl-hm', {style: `fill:${K.heat(0.75 - (x + 78) / 156 * 0.6)}`});
      if (kind === 'swirl') for (let k = 0; k < 12; k++) f += P(`M${cx},950 L${cx + 90 * Math.cos(k * 0.5236)},${950 + 90 * Math.sin(k * 0.5236)} L${cx + 90 * Math.cos(k * 0.5236 + 0.5236)},${950 + 90 * Math.sin(k * 0.5236 + 0.5236)} Z`, 'pl-hm', {style: `fill:${K.heat(k % 2 ? 0.35 : 0.7)}`});
      g += G(f, {'clip-path': `url(#pl7-m${kind})`}) + C(cx, 950, 78, 's-edge', {style: 'fill:none'});
      return g + T(cx, 1060, t1, 't-sub') + T(cx, 1090, t2, 't-dim');
    };
    s += G(mini(180, 'ring', '동심원', '전류 분포 · 시드 · 실드') + mini(480, 'side', '한쪽 치우침', '접점 · 립씰 누액 · 기울어짐') + mini(780, 'swirl', '부채꼴 · 줄무늬', '흐름 · 회전 · 패들'), only('map'));
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 웨이퍼 두께 분포</div>
      ${K.ctl('seed', '시드 두께 (µm) — 비도금 인자', 0, 100, 1, 50)}
      ${K.seg('k', [['lo', '낮음'], ['mid', '보통'], ['hi', '높음']], 'mid', '액 전도도')}
      ${K.ctl('f', '개구율 (%) — 비도금 인자', 5, 60, 1, 20)}
      ${K.seg('hrva', [['0', '없음'], ['1', '있음']], '0', '고저항판')}
      ${K.seg('shield', [['0', '없음'], ['1', '있음']], '0', '실드')}
      ${K.kpis([['중심', 'k-c', '평균 대비'], ['가장자리', 'k-e', '평균 대비'], ['균일도', 'k-u', '±(최대−최소)/2']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('가장자리에서 전류를 받는 얇은 저항판 모델(V ∝ I₀(r/λ), λ = √(Rp/Rs)) + 가장자리 꼬리. 값은 경향을 보기 위한 예시입니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip} = K;
    const st = {seed: 0.3, k: 'mid', f: 20, hrva: false, shield: false};
    let touched = false;
    const seedOf = v => 0.05 * Math.pow(20, v / 100);          // 0.05 ~ 1 µm
    const sIn = ctx.card.querySelector('input[data-i=seed]');
    const setSeg = (id, v) => ctx.card.querySelectorAll(`.pl-seg[data-g="${id}"] button`).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v ? 'true' : 'false'));
    function render(){
      const pr = profile(st);
      // 전기력선: 두께(= 전류밀도) 분포에 따라 웨이퍼 쪽 끝을 배치
      const xs = [];
      const cum = [0];
      for (let i = 1; i <= 200; i++){ const x = -RW + 2 * RW * i / 200; cum.push(cum[i - 1] + pr.at(x)); }
      const tot = cum[200];
      for (let k = 0; k < 15; k++){ const q = (k + 0.5) / 15 * tot; let i = cum.findIndex(c => c >= q); xs.push(WX0 + (WX1 - WX0) * i / 200); }
      let ln = '';
      xs.forEach((wx, k) => {
        const ax = 300 + k * (360 / 14);
        if (st.hrva) ln += P(`M${ax.toFixed(0)},640 C${ax.toFixed(0)},500 ${wx.toFixed(0)},420 ${wx.toFixed(0)},318 L${wx.toFixed(0)},${WY + 4}`, 's-field');
        else ln += P(`M${ax.toFixed(0)},640 C${ax.toFixed(0)},460 ${wx.toFixed(0)},430 ${wx.toFixed(0)},${WY + 4}`, 's-field');
      });
      if (!st.shield) ln += P(`M290,650 C150,600 150,400 ${WX0 + 4},${WY + 4}`, 's-field2') + P(`M670,650 C810,600 810,400 ${WX1 - 4},${WY + 4}`, 's-field2');
      ctx.$('[data-v="lines"]').innerHTML = G(ln, {'data-tip': '전기력선 — 촘촘한 곳에 전류가 많이 간다 (= 두껍게 쌓인다)'});
      ctx.$$('.w-hrva').forEach(e => e.classList.toggle('hide', !st.hrva));
      ctx.$$('.w-shield').forEach(e => e.classList.toggle('hide', !st.shield));
      // 그래프
      const ty = v => CY0 - (Math.max(TMIN, Math.min(TMAX, v)) - TMIN) / (TMAX - TMIN) * (CY0 - CY1);
      let d = '';
      for (let i = -120; i <= 120; i++){ const x = CX0 + (i + 120) / 240 * (CX1 - CX0); d += (d ? ' L' : 'M') + x.toFixed(1) + ',' + ty(pr.t[Math.abs(i)]).toFixed(1); }
      ctx.$('[data-v="curve"]').innerHTML = P(d, 's-curve', tip('반지름 방향 두께 — 가운데가 웨이퍼 중심'));
      // 웨이퍼 맵 (동심원 색)
      let mp = '';
      for (let i = 30; i >= 1; i--){ const rr = MAP.r * i / 30, v = pr.t[Math.round(i / 30 * 120)]; mp += C(MAP.x, MAP.y, rr, 'pl-hm', {style: `fill:${K.heat((v - 0.8) / 0.4)}`}); }
      mp += C(MAP.x, MAP.y, MAP.r, 's-edge', {style: 'fill:none'}) + T(MAP.x, MAP.y - MAP.r - 20, '웨이퍼 맵 (예시) — 색 눈금 −20 % ~ +20 %', 't-dim');
      for (let k = 0; k <= 8; k++) mp += R(1470, MAP.y + 140 - k * 35, 26, 35, 'pl-hm', {style: `fill:${K.heat(k / 8)}`});
      mp += T(1504, MAP.y + 172, '−20 %', 't-dim', 'start') + T(1504, MAP.y + 26, '0', 't-dim', 'start') + T(1504, MAP.y - 140, '+20 %', 't-dim', 'start');
      ctx.$('[data-v="map"]').innerHTML = G(mp, {'data-tip': '웨이퍼 맵 — 색은 평균 대비 두께'});
      const pc = v => `${v >= 1 ? '+' : ''}${((v - 1) * 100).toFixed(1)} %`;
      ctx.$('[data-v="read"]').innerHTML = LB(T(964, 1030, `중심 ${pc(pr.center)} · 가장자리 ${pc(pr.edge)} · 균일도 ±${pr.unif.toFixed(1)} %`, 't-warn', 'start') + T(964, 1066, `λ = ${(pr.lam * 1000).toFixed(0)} mm (클수록 고르다 · 웨이퍼 반지름 150 mm)`, 't-dim', 'start'));
      ctx.out('k-c', pc(pr.center)); ctx.out('k-e', pc(pr.edge)); ctx.out('k-u', `±${pr.unif.toFixed(1)} %`);
      ctx.q('[data-o=msg]').innerHTML = pr.unif < 3 ? '고른 편입니다.' : pr.center < 0.95 ? '<b>중심이 얇습니다</b> — 시드가 얇거나 전도도 · 개구율이 커서 터미널 효과가 큽니다.' : pr.edge > 1.08 ? '<b>가장자리가 두껍습니다</b> — 가장자리 효과. 실드 · 고저항판을 써 보세요.' : '가장자리와 중심의 차이가 조금 있습니다.';
      ctx.refresh();
    }
    ctx.range('seed', v => { st.seed = seedOf(v); render(); return st.seed.toFixed(2) + ' µm'; });
    ctx.seg('k', v => { st.k = v; render(); });
    ctx.range('f', v => { st.f = v; render(); return v + ' %'; });
    ctx.seg('hrva', v => { st.hrva = v === '1'; render(); });
    ctx.seg('shield', v => { st.shield = v === '1'; render(); });
    ctx.card.querySelectorAll('input, .pl-seg button').forEach(i => i.addEventListener(i.tagName === 'INPUT' ? 'input' : 'click', () => { touched = true; }));
    ctx.demo = sid => {
      const d = DEMO[sid];
      if (touched || !d) return ctx.refresh();
      st.seed = d.seed; st.hrva = d.hrva; st.shield = d.shield;
      sIn.value = Math.round(Math.log(d.seed / 0.05) / Math.log(20) * 100); ctx.out('seed', d.seed.toFixed(2) + ' µm');
      setSeg('hrva', d.hrva ? '1' : '0'); setSeg('shield', d.shield ? '1' : '0');
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['1차 분포', '모양(기하)만으로 정해지는 전류 분포. 모서리 · 가까운 곳에 몰린다'],
      ['터미널 효과', '얇은 시드의 저항 때문에 접점(가장자리)에서 멀수록 전류가 줄어드는 것'],
      ['면저항', '얇은 막의 저항. 두께가 반이면 두 배'],
      ['실드 (shield)', '가장자리로 가는 전류를 가리는 절연판'],
      ['고저항판 (HRVA)', '작은 구멍이 많은 절연판. 액의 길을 좁혀 모든 길에 큰 저항을 더한다'],
      ['램프업', '도금 초기 전류를 천천히 올리는 것. 얇은 시드 보호 · 급격한 분포 차이 완화']
    ]) + K.field([
      '<b>도금 인자와 비도금 인자를 나눠 봅니다.</b> 시드 두께(PVD) · 개구율(설계 · 포토)은 도금 공정이 바꿀 수 없는 인자입니다. 분포가 바뀌었다면 앞 공정 변경 이력부터 확인합니다.',
      '맵에서 <b>한쪽만</b> 얇거나 두꺼우면 전류 분포보다 하드웨어(접점 오염 · 립씰 누액 · 헤드 기울어짐 · 실드 위치)를 먼저 의심합니다 → <a data-go="tool.head">09장</a>.',
      '범프 도금은 PR 아래 시드가 두꺼워지지 않으므로(도금은 구멍 안에만) 터미널 효과가 도금 내내 남습니다. 막 전체가 두꺼워지는 블랭킷 도금과 다른 점입니다.'
    ]) + K.deep(`<p>얇은 원판(반지름 R)의 가장자리에서 전류를 넣고, 면적마다 저항 Rp로 액에 전류가 빠져나간다고 보면 시드의 전위는 변형 베셀 함수 I₀를 따릅니다:</p>
      ${K.eq('V(r) / V(R) = I₀(r/λ) / I₀(R/λ),   λ = √(Rp / Rs)')}
      <ul><li>Rs = 시드 비저항 / 두께 (얇을수록 큼). Rp = 액 저항 + 고저항판 + 분극 저항 / 개구율.</li>
      <li>R/λ가 작을수록(λ가 클수록) 고릅니다. 시드를 두껍게, 고저항판을 넣고, 분극(억제제)을 크게 하면 λ가 커집니다.</li>
      <li>전도도가 높은 액은 1차 분포(모양 효과)에는 유리하지만 터미널 효과에는 불리합니다 — 그래서 얇은 시드에는 전도도를 낮춘 액(산 농도를 낮춤)을 쓰기도 합니다.</li>
      <li>고른 정도는 바그너 수 Wa = κ·(dη/di) / L — (표면의 분극 저항) ÷ (크기 L만큼의 액 저항) — 로 요약됩니다. 클수록 고릅니다. 고저항판은 모든 길에 같은 저항을 직렬로 더해 분극 저항을 키운 것과 같은 효과를 냅니다.</li></ul>`);
  }
});
})();
