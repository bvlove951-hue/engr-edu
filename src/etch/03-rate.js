/* 시드 식각 03 — 속도의 열쇠: 무엇이 식각 속도를 정할까? (공급 vs 반응 · 표면 · 수십 µm) */
(function(){
// ── 개념 모델 (기획 rev.2): 두 문을 차례로 — r = 1 / (1/r_반응 + 1/r_공급)
//  r_공급 = D·C/δ × V_Cu (H₂O₂ 1개가 Cu 1개), D = 1.5×10⁻⁹ m²/s (E_a 18 kJ/mol), C = wt% × 294 mol/m³
//  r_반응 = 2,000 nm/분 × C/0.3 wt% (E_a 55 kJ/mol) — 기본(δ 60 µm · 25 °C · 0.15 wt%) ≈ 320 nm/분 = 탭의 기준 액
const RG = 8.314, T0 = 298.15, VCU = 7.1e-6, DIF = 1.5e-9, EAD = 18000, EAR = 55000;
const dOf = f => 200 * Math.pow(0.05, f / 100);                     // 흐름 0~100 → δ 200 → 10 µm (40 → 60 µm)
const arr = (E, T) => Math.exp(-(E / RG) * (1 / (T + 273.15) - 1 / T0));   // 25 °C 대비 배수
function rates(dl, T, c){
  const mt = DIF * arr(EAD, T) * c * 294 / (dl * 1e-6) * VCU * 6e10;   // m/s → nm/분
  const rx = 2000 * (c / 0.3) * arr(EAR, T);
  return {mt, rx, r: 1 / (1 / mt + 1 / rx)};
}
// 진단: 공급 몫 · 흐름 ×2(δ ÷ √2) 효과 · +10 °C 효과와 두 끝(공급만 · 반응만)
function diag(dl, T, c){
  const a = rates(dl, T, c);
  const fl = rates(dl / Math.SQRT2, T, c).r / a.r - 1, tu = rates(dl, T + 10, c).r / a.r - 1;
  const tMt = arr(EAD, T + 10) / arr(EAD, T) - 1, tRx = arr(EAR, T + 10) / arr(EAR, T) - 1;
  return Object.assign(a, {dl, sh: a.r / a.mt, fl, fs: fl / (Math.SQRT2 - 1), tu, tMt, tRx, tp: (tu - tMt) / (tRx - tMt)});
}
const REG = sh => sh > 0.8 ? '공급 지배' : sh > 0.55 ? '공급 지배 쪽' : sh >= 0.45 ? '섞인 지배 (반반)' : sh >= 0.2 ? '반응 지배 쪽' : '반응 지배';
const fmt = v => Math.round(v).toLocaleString('en-US');
const pc = v => Math.round(v * 100);
// 무대 배치
const BX0 = 44, BX1 = 896, SURF = 960, PX = 2;                        // 왼쪽 액 · 표면 y · δ 1 µm = 2 px
const G1 = {x0: 1040, x1: 1530, y1: 214, y0: 466};                    // ① 속도 vs δ (δ 200 → 10, 로그)
const G2 = {x0: 1040, x1: 1530, y1: 674, y0: 922};                    // ② 속도 vs 온도 (20 → 50 °C)
const RLO = Math.log10(20), RHI = Math.log10(20000);                  // 세로: 20 ~ 20,000 nm/분 (로그)
const ry = (g, r) => g.y0 - (Math.log10(Math.max(r, 1e-3)) - RLO) / (RHI - RLO) * (g.y0 - g.y1);
const dx = d => G1.x0 + Math.log(200 / d) / Math.log(20) * (G1.x1 - G1.x0);
const tx = T => G2.x0 + (T - 20) / 30 * (G2.x1 - G2.x0);
const DIM = 150, DSP = 15;                                            // 비교 예: 가만히 담금 · 회전 스프레이의 δ (µm)
const VN = {x: 34, y: 136, w: 872, h: 880};                          // 좁은 세로 화면: 왼쪽 판만 크게 (그래프 값은 카드의 결과 칸에)
// 그래프 이름표: 곡선 · 점선이 글자를 가로지르지 않게 어두운 바탕을 깐다 (글자 폭 어림: 한글 1em, 그 밖 약 0.58em)
const FSZ = {'t-warn': 23, 't-sub': 21, 't-dim': 19, 'et03-lt1': 19, 'et03-lt2': 19};
const tw = (s, fs) => [...s].reduce((a, ch) => a + (/[ㄱ-힝]/.test(ch) ? 1 : ch === ' ' ? 0.3 : 0.58), 0) * fs;
const tag = (K, x, y, s, cls, an = 'middle') => {
  const fs = FSZ[cls] || 21, w = tw(s, fs) + 14, x0 = an === 'start' ? x - 7 : an === 'end' ? x - w + 7 : x - w / 2;
  return K.R(x0, y - fs * 0.95, w, fs * 1.3, 'et03-tag', {rx: 6}) + K.T(x, y, s, cls, an);
};
// 발표 모드 · 손대기 전: 단계마다 보여 줄 [흐름, 온도]
const DEMO = {supply: [40, 25], react: [40, 35], which: [0, 25], spray: [86, 25]};
// H₂O₂ 분자 (엔진 이온 목록에 없어 직접 그린다)
const molIn = '<circle r="20"/><text y="5" text-anchor="middle">H₂O₂</text>';
const mol = (x, y) => `<g class="pl-ion et03-pox" transform="translate(${x} ${y})">${molIn}</g>`;
const molPath = (d, dur, delay) => `<g class="pl-ion et03-pox">${molIn}<animateMotion dur="${dur.toFixed(2)}s" begin="-${delay.toFixed(2)}s" repeatCount="indefinite" path="${d}"/><animate attributeName="opacity" values="0;1;1;1;0" dur="${dur.toFixed(2)}s" begin="-${delay.toFixed(2)}s" repeatCount="indefinite"/></g>`;

(window.EngrEtchChapters = window.EngrEtchChapters || []).push({
  no: '03', id: 'rate', part: 1, short: '속도의 열쇠', scale: '표면 · 수십 µm',
  title: '속도의 열쇠 — 무엇이 식각 속도를 정할까?',
  hook: '느린 쪽이 속도를 정한다',
  one: '식각은 두 단계를 차례로 지나야 합니다. 약품이 표면까지 오는 \'공급\'과 표면에서 일어나는 \'반응\'입니다. 둘 중 느린 쪽이 전체 속도를 정합니다. 어느 쪽이 느린지 알아야 흐름 · 온도 · 농도 중 무엇을 바꿀지 고를 수 있습니다.',
  ana: '<b>두 개의 문을 차례로 지나는 줄</b> — 앞 문(공급)과 뒷 문(반응) 가운데 좁은 문이 줄의 빠르기를 정합니다. 이미 넓은 문을 더 넓혀도 별 소용이 없습니다. 흐름을 세게 하면 앞 문이, 온도를 올리면 주로 뒷 문이 넓어집니다. <i>(비유의 한계: 실제로는 두 문이 함께 조금씩 영향을 주어(저항처럼 더해짐) \'한쪽만\'인 경우는 드뭅니다. 온도를 올리면 두 문이 모두 넓어지지만 넓어지는 정도가 다릅니다.)</i>',
  steps: [
    {id: 'supply', t: '공급 — 흐름과 확산층', d: '멀리서는 액의 흐름이 산화제를 실어 오고, 표면 바로 앞 확산층(δ)에서는 확산으로 건넙니다. 녹은 Cu²⁺도 같은 길로 빠져나갑니다. <a href="#go-plating-03">전해도금 03장</a>과 같은 그림이고, 흐름이 셀수록 δ가 얇아집니다.', viewN: VN},
    {id: 'react', t: '반응 — 온도에 민감하다', d: '표면에 온 약품이 Cu와 반응하는 빠르기입니다. 표면 반응은 온도에 아주 민감해 10 °C에 보통 1.5~3배 빨라지고, 확산(공급)은 약 1.2~1.3배 빨라집니다. 그래서 온도를 바꿔 보면 누가 느린지 알 수 있습니다.', viewN: VN},
    {id: 'which', t: '누가 정하나', d: '흐름을 2배로 했을 때 최대(약 +40 %)에 가깝게 빨라지면 공급 지배, 거의 안 변하면 반응 지배입니다. 온도는 공급 지배여도 10 °C에 약 1.3배는 빨라지므로, 얼마나 빨라졌는지를 이 기준과 비교해 읽습니다.', viewN: VN},
    {id: 'spray', t: '담금 vs 회전 스프레이', d: '가만히 담그면 확산층이 두껍고, 돌리며 뿌리면 얇아집니다. 공개 보고(블랭킷 웨이퍼)에서 같은 묽은 액이 담금보다 흘려 붓기에서 약 4배, 회전 + 스프레이에서 약 7배 빨랐습니다. 빨라질수록 1초 오차의 무게도 커집니다.', viewN: VN}
  ],
  icon(K){
    const {R, P} = K;
    return R(2, 4, 62, 30, 'f-bath') + R(2, 34, 62, 14, 'f-dl') + R(2, 48, 62, 12, 'f-cu2') + P('M6,14 L58,14', 's-flow') + R(20, 20, 4, 10, 'f-ti') + R(40, 20, 4, 10, 'f-ti');
  },
  draw(K){
    const {R, C, L, P, T, TT, G, LB, tip, only, W} = K;
    let s = `<defs><clipPath id="et03-c1"><rect x="${G1.x0}" y="${G1.y1}" width="${G1.x1 - G1.x0}" height="${G1.y0 - G1.y1}"/></clipPath>` +
      `<clipPath id="et03-c2"><rect x="${G2.x0}" y="${G2.y1}" width="${G2.x1 - G2.x0}" height="${G2.y0 - G2.y1}"/></clipPath>` +
      `<linearGradient id="et03-gg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f59e0b" stop-opacity=".75"/><stop offset="1" stop-color="#a78bfa" stop-opacity=".75"/></linearGradient></defs>`;
    // ── 왼쪽: 식각액 · 확산층 · Cu 시드 (spray 단계에서는 두 작은 장면으로 바뀐다)
    s += R(40, 130, 860, 880, 'pl-panel', {rx: 14});
    let tk = R(BX0, 140, BX1 - BX0, SURF - 140, 'f-etl', tip('식각액 — 예: 묽은 과산화수소(H₂O₂) + 황산 (이 탭의 기준 액)'));
    tk += '<g data-v="dl"></g><g data-v="flow"></g><g data-v="rx"></g>';
    tk += R(BX0, SURF, BX1 - BX0, 46, 'f-cu2', tip('Cu 시드 — 녹는 쪽. 실제 두께는 약 0.3 µm (그림은 크게 과장)'));
    tk += LB(T(60, 991, 'Cu 시드 — 녹는 쪽 (실제 약 0.3 µm · 두께 과장)', 'et03-cut', 'start'));
    tk += G(LB(T(BX1 - 16, 991, '↑ 표면 반응 — 온도에 민감', 'et03-cut2', 'end')), only('react'));
    s += G(tk, {'data-off': 'spray'});
    // supply: 길 안내
    let su = T(64, 172, '공급 — 약품이 표면까지 오는 길', 't-acc', 'start');
    su += P('M70,208 C100,198 130,218 170,208', 's-flow') + T(186, 215, '① 대류 — 흐르는 액이 실어 온다 (멀리서 · 빠름)', 't-sub', 'start');
    su += R(70, 238, 100, 28, 'f-dl') + T(186, 259, '② 확산 — 확산층 δ를 걸어서 건넌다 (표면 앞)', 't-sub', 'start');
    su += mol(92, 300) + T(122, 307, '산화제 H₂O₂ — 들어온다', 't-sub', 'start');
    su += K.ion(470, 300, 'cu') + T(498, 307, '녹은 Cu²⁺ — 같은 길로 나간다', 't-sub', 'start');
    su += T(64, 352, '흐름이 셀수록 δ가 얇아져 공급이 빨라진다 → 오른쪽 위 그래프', 't-dim', 'start');
    su += T(64, 384, '도금(전해도금 03장)과 같은 그림 — 도금은 Cu²⁺가 들어오고, 식각은 Cu²⁺가 나간다', 't-dim', 'start');
    s += G(su, only('supply'));
    s += G('<g data-v="react"></g>', only('react'));
    s += G('<g data-v="which"></g>', only('which'));
    // spray: 가만히 담금 vs 회전 + 스프레이 (같은 웨이퍼 높이, δ 1 µm = 1 px)
    let sp = T(64, 172, '담금 vs 회전 스프레이 — 같은 액, 다른 확산층', 't-acc', 'start');
    sp += R(60, 196, 400, 580, 'pl-box', {rx: 12}) + T(260, 232, '가만히 담금', 't-lbl');
    sp += R(98, 290, 324, 319, 'f-etl') + P('M95,262 L95,600 Q95,612 107,612 L413,612 Q425,612 425,600 L425,262', 'f-tank', tip('담금 탱크 — 흐름이 거의 없다'));
    sp += R(98, 416, 324, 150, 'f-dl', tip('확산층 약 150 µm — 가만히 담그면 두껍다')) + L(98, 416, 422, 416, 's-dash') + T(110, 444, 'δ ≈ 150 µm', 't-warn', 'start');
    sp += R(118, 566, 284, 8, 'f-seed2') + R(118, 574, 284, 20, 'f-wafer', tip('웨이퍼 (위를 봄) — Cu 시드는 과장'));
    sp += mol(170, 340) + mol(330, 372);
    [292, 336, 380].forEach((x, k) => { sp += molPath(`M${x},430 L${x + 14},500 L${x - 8},552`, 6.5, k * 2.1); });
    sp += T(260, 676, '흐름이 거의 없어 δ가 두껍다', 't-sub');
    sp += R(490, 196, 390, 580, 'pl-box', {rx: 12}) + T(685, 232, '회전 + 스프레이', 't-lbl');
    sp += P('M682,316 L536,551 L834,551 L688,316 Z', 'et03-cone') + R(700, 262, 170, 14, 'f-plate') + R(672, 256, 26, 44, 'f-plate', W({rx: 4}, tip('노즐 — 새 액을 뿌린다')));
    sp += P('M676,300 L694,300 L689,312 L681,312 Z', 'f-plate');
    for (let k = 0; k < 7; k++) sp += K.mover(685, 316, 560 + k * 40, 548, 5, 'et03-drop', 1.2, k * 0.17);
    sp += R(530, 551, 310, 15, 'f-dl', tip('확산층 약 15 µm — 돌리며 뿌리면 얇은 액막이 늘 바뀐다')) + R(530, 566, 310, 8, 'f-seed2') + R(530, 574, 310, 20, 'f-wafer', tip('돌아가는 웨이퍼'));
    sp += K.arrow(660, 543, 560, 543, 's-arr') + K.arrow(710, 543, 810, 543, 's-arr');
    sp += R(675, 594, 20, 46, 'f-plate') + K.arrowP('M650,618 A40,11 0 1 0 724,616', 's-arr2', tip('회전'));
    sp += T(626, 628, '회전', 't-dim', 'end') + L(820, 600, 812, 572, 's-lead') + T(870, 628, 'δ ≈ 15 µm', 't-warn', 'end');
    sp += T(685, 676, '돌리며 뿌려 δ가 얇다', 't-sub');
    sp += '<g data-v="spray"></g>';
    sp += TT(470, 862, ['공개 보고 (같은 묽은 액 · 블랭킷 웨이퍼): 담금 대비', '흘려 붓기 약 4배 · 회전 + 스프레이 약 7배'], 't-sub', 'middle', 32);
    sp += T(470, 936, '패턴 웨이퍼의 범프 사이는 흐름이 약해 블랭킷보다 느릴 수 있다', 't-dim');
    sp += T(470, 968, '빨라질수록 1 초 오차의 무게도 커진다 → 끝점 (07장)', 't-dim');
    s += G(sp, only('spray'));

    // ── 오른쪽 위: ① 속도 vs 흐름
    const legend = y => L(962, y - 6, 1000, y - 6, 's-curve2') + T(1008, y, '공급 한계', 't-dim', 'start') + L(1122, y - 6, 1160, y - 6, 'et03-rxl') + T(1168, y, '반응 한계', 't-dim', 'start') + L(1282, y - 6, 1320, y - 6, 's-curve') + T(1328, y, '실제 속도 (둘을 차례로)', 't-dim', 'start');
    let g1 = R(940, 130, 620, 430, 'pl-panel', {rx: 14}) + R(940, 130, 620, 430, 'pl-hlbox', W({rx: 14}, only('supply which spray')));
    g1 += T(960, 164, '① 속도 vs 흐름 (확산층 δ)', 't-acc', 'start') + T(1540, 164, 'nm/분 · 로그 눈금', 't-dim', 'end') + legend(198);
    g1 += '<g data-v="g1z"></g>';
    [100, 1000, 10000].forEach(v => { g1 += L(G1.x0, ry(G1, v), G1.x1, ry(G1, v), 'et03-grid') + T(G1.x0 - 10, ry(G1, v) + 7, fmt(v), 't-dim', 'end'); });
    g1 += L(G1.x0, G1.y0, G1.x1, G1.y0, 's-axis') + L(G1.x0, G1.y0, G1.x0, G1.y1, 's-axis');
    [200, 100, 50, 20, 10].forEach(d => { g1 += L(dx(d), G1.y0, dx(d), G1.y0 + 7, 's-axis') + T(dx(d), G1.y0 + 28, String(d), 't-dim'); });
    g1 += T((G1.x0 + G1.x1) / 2, G1.y0 + 62, '확산층 δ (µm) — 오른쪽일수록 흐름이 세다', 't-dim');
    g1 += '<g data-v="g1"></g>';
    s += g1;
    // ── 오른쪽 아래: ② 속도 vs 온도
    let g2 = R(940, 590, 620, 420, 'pl-panel', {rx: 14}) + R(940, 590, 620, 420, 'pl-hlbox', W({rx: 14}, only('react which')));
    g2 += T(960, 624, '② 속도 vs 온도', 't-acc', 'start') + T(1540, 624, 'nm/분 · 로그 눈금', 't-dim', 'end') + legend(658);
    g2 += '<g data-v="g2z"></g>';
    [100, 1000, 10000].forEach(v => { g2 += L(G2.x0, ry(G2, v), G2.x1, ry(G2, v), 'et03-grid') + T(G2.x0 - 10, ry(G2, v) + 7, fmt(v), 't-dim', 'end'); });
    g2 += L(G2.x0, G2.y0, G2.x1, G2.y0, 's-axis') + L(G2.x0, G2.y0, G2.x0, G2.y1, 's-axis');
    for (let t = 20; t <= 50; t += 5) g2 += L(tx(t), G2.y0, tx(t), G2.y0 + (t % 10 ? 4 : 7), 's-axis') + (t % 10 ? '' : T(tx(t), G2.y0 + 28, String(t), 't-dim'));
    g2 += T((G2.x0 + G2.x1) / 2, G2.y0 + 62, '액 온도 (°C)', 't-dim');
    g2 += '<g data-v="g2"></g>';
    s += g2;
    // ── 아래 한 줄: 지금 판정
    s += R(40, 1026, 1520, 90, 'pl-box', {rx: 12}) + R(40, 1026, 1520, 90, 'pl-hlbox', W({rx: 12}, only('which')));
    s += '<g data-v="sum"></g>';
    return s;
  },
  body(K){
    return `<div class="pl-w"><div class="hd">직접 해 보기 — 공급과 반응</div>
      ${K.ctl('f', '흐름 세기 (교반 · 회전 · 분사)', 0, 100, 1, 40)}${K.ctl('T', '온도 (°C)', 20, 50, 1, 25)}${K.ctl('c', '산화제 H₂O₂ (wt%, 예시)', 0.05, 1, 0.05, 0.15)}
      ${K.kpis([['식각 속도', 'k-r', 'nm/분 (블랭킷)'], ['300 nm 지우는 시간', 'k-t', 'Cu 시드 300 nm'], ['1 초 오차', 'k-1s', '1 초에 녹는 두께'], ['공급 몫', 'k-sh', '속도 ÷ 공급 한계'], ['흐름 민감도', 'k-fs', '흐름 ×2 효과 ÷ 41 %'], ['온도 위치', 'k-tp', '0 공급만 · 1 반응만']])}
      <p class="pl-msg" data-o="msg"></p>
      ${K.model('r = 1 ÷ (1/r_반응 + 1/r_공급) (직렬 저항처럼). r_공급 = D·C/δ × V_Cu (H₂O₂ 1개가 Cu 1개를 녹임), D = 1.5×10⁻⁹ m²/s (E_a 18 kJ/mol), C = wt% × 294 mol/m³, V_Cu 7.1×10⁻⁶ m³/mol. r_반응 = 2,000 nm/분 × C/0.3 wt% (E_a 55 kJ/mol). δ = 200 × 0.05^(흐름/100) µm, 흐름 ×2 = δ ÷ √2 (회전 속도의 제곱근 경향). 기본(δ 60 µm · 25 °C · 0.15 wt%) ≈ 320 nm/분 — 이 탭의 기준 액(약 300 nm/분)에 맞춘 예시 상수입니다. 두 문 모두 농도에 비례한다고 두어 농도는 속도만 바꾸고 몫은 바꾸지 않습니다. 실제 값은 액 · 장비마다 달라 블랭킷 속도 측정으로 확인합니다.')}</div>`;
  },
  mount(K, ctx){
    const {R, C, L, P, T, G, LB, tip, W} = K;
    let touched = false;
    const st = {f: 40, T: 25, c: 0.15};
    const fin = ctx.card.querySelector('input[data-i=f]'), tin = ctx.card.querySelector('input[data-i=T]'), cin = ctx.card.querySelector('input[data-i=c]');
    const set = (sel, html) => { const el = ctx.$(sel); if (el) el.innerHTML = html; };
    // 왼쪽 액: δ 띠 · 흐름 · 분자 · 표면 반응 빛
    function tank(dg){
      const top = SURF - dg.dl * PX, h = SURF - top;
      let d = R(BX0, top, BX1 - BX0, h, 'f-dl', tip(`확산층 δ ≈ ${Math.round(dg.dl)} µm — 흐름이 표면 쪽으로 느려져 주로 확산으로 건너는 층 (등가 두께)`)) + L(BX0, top, BX1, top, 's-dash');
      let dfl = '';
      if (h > 50) [[0.3, 'et03-s1'], [0.62, 'et03-s2']].forEach(([q, cl]) => { const y = top + q * h; dfl += P(`M${BX0 + 30},${y.toFixed(0)} C${BX0 + 300},${(y - 8).toFixed(0)} ${BX0 + 560},${(y + 8).toFixed(0)} ${BX1 - 10},${y.toFixed(0)}`, 's-flow ' + cl); });
      if (dfl) d += G(dfl, K.only('supply react'));                 // which 단계에서는 δ 안에 식 · δ ÷ √2 선을 쓰므로 감춘다
      d += P(`M${BX0 + 18},${top.toFixed(1)} l-10,0 l0,${h.toFixed(1)} l10,0`, 's-acc2');
      d += LB(T(BX0 + 26, h >= 64 ? top + 32 : top - 12, `δ ≈ ${Math.round(dg.dl)} µm (등가 두께)`, 't-warn', 'start'));
      set('[data-v="dl"]', d);
      // 대류 흐름 (위 설명 아래 y 480부터 δ 위까지 — react 단계의 설명 줄(y 422)과 분자가 겹치지 않게)
      const yA = 480, yB = Math.max(yA, top - 34), n = Math.max(1, Math.min(5, Math.floor((yB - yA) / 70) + 1));
      let fl = '';
      for (let q = 0; q < n; q++){ const y = n === 1 ? yA : yA + q * (yB - yA) / (n - 1); fl += P(`M${BX0 + 10},${y.toFixed(0)} C${BX0 + 280},${(y - 24).toFixed(0)} ${BX0 + 560},${(y + 24).toFixed(0)} ${BX1 - 10},${y.toFixed(0)}`, 's-flow'); }
      const g = K.rng(11);
      let mo = '';
      for (let q = 0; q < 5; q++){ const y = yA + g() * (yB - yA); mo += molPath(`M${BX0 + 30},${y.toFixed(0)} C${BX0 + 300},${(y - 30).toFixed(0)} ${BX0 + 560},${(y + 30).toFixed(0)} ${BX1 - 30},${(y + 6).toFixed(0)}`, 6 + g() * 3, g() * 8); }
      // δ 안: 산화제는 아래로 천천히, Cu²⁺는 위로 나가 흐름을 탄다 (δ가 두꺼울수록 오래 걸린다)
      const dur = 1.6 + h / 55;
      for (let q = 0; q < 5; q++){ const x = 350 + q * 110 + g() * 30; mo += molPath(`M${x.toFixed(0)},${(top + 4).toFixed(0)} Q${(x + (g() - 0.5) * 60).toFixed(0)},${((top + SURF) / 2).toFixed(0)} ${(x + (g() - 0.5) * 40).toFixed(0)},${SURF - 22}`, dur, g() * dur); }
      for (let q = 0; q < 3; q++){ const x = 390 + q * 150 + g() * 30, y2 = Math.max(yA, top - 20); mo += K.ionPath(`M${x.toFixed(0)},${SURF - 20} Q${(x + 24).toFixed(0)},${((top + SURF) / 2).toFixed(0)} ${(x + 10).toFixed(0)},${top.toFixed(0)} C${(x + 90).toFixed(0)},${(y2 - 20).toFixed(0)} ${(x + 150).toFixed(0)},${(y2 - 10).toFixed(0)} ${Math.min(870, x + 220).toFixed(0)},${(y2 - 24).toFixed(0)}`, 'cu', dur + 2.5, g() * (dur + 2.5)); }
      set('[data-v="flow"]', G(G(fl, tip('대류 — 흐르는 액이 산화제를 실어 온다')) + mo, K.only('supply react')));
      // 표면 반응 빛: 반응이 빠를수록 두껍고 밝다
      const lr = K.clamp(Math.log10(dg.rx / 300) / 1.3), hh = 8 + 26 * lr;
      let rx = R(BX0, SURF - hh, BX1 - BX0, hh, 'et03-rx', {opacity: (0.35 + 0.6 * lr).toFixed(2), filter: K.url('glow')}) + R(BX0, SURF - hh, BX1 - BX0, hh, 'et03-rx', W({opacity: (0.3 + 0.5 * lr).toFixed(2)}, tip(`표면 반응 한계 ≈ ${fmt(dg.rx)} nm/분 — 온도가 오를수록 빨라진다`)));
      const gs = K.rng(29), ns = Math.round(4 + 12 * lr);
      for (let q = 0; q < ns; q++){ const x = BX0 + 20 + gs() * (BX1 - BX0 - 40), d2 = (0.8 + gs() * 1.2).toFixed(2); rx += `<circle cx="${x.toFixed(0)}" cy="${(SURF - hh / 2).toFixed(0)}" r="${(4 + gs() * 4).toFixed(1)}" class="et03-spark"><animate attributeName="opacity" values="0;1;0" dur="${d2}s" begin="-${(gs() * 2).toFixed(2)}s" repeatCount="indefinite"/></circle>`; }
      set('[data-v="rx"]', G(rx, K.only('react')));
    }
    // react: 25 °C 대비 몇 배
    function react(){
      // 지금 온도가 25 °C(기준)이면 막대가 ×1 둘뿐이라 뜻이 없다 → 그때는 '10 °C 올리면(25 → 35 °C)'을 보인다
      const hyp = Math.abs(st.T - 25) < 0.5, T1 = hyp ? 35 : st.T, fa = arr(EAD, T1), fb = arr(EAR, T1), U = 118, X = 250;
      const val = (f, y, cl) => X + U * f + 96 < 884 ? T(X + U * f + 12, y, `×${f.toFixed(2)}`, cl, 'start') : T(X + U * f - 10, y, `×${f.toFixed(2)}`, 'et03-bt', 'end');
      let s = T(64, 172, '반응 — 표면에서 Cu를 녹이는 빠르기', 't-acc', 'start');
      s += T(64, 210, hyp ? '10 °C 올리면(25 → 35 °C) 몇 배 빨라지나 (개념 모델)' : `25 °C 대비 지금 ${st.T} °C에서 몇 배 빨라지나 (개념 모델)`, 't-sub', 'start');
      s += T(64, 266, '공급 (확산)', 't-sub', 'start') + R(X, 242, U * fa, 34, 'et03-bmt', W({rx: 6}, tip('확산(공급) — E_a 약 18 kJ/mol, 10 °C에 약 ×1.27')));
      s += val(fa, 268, 't-warn');
      s += T(64, 320, '반응 (표면)', 't-sub', 'start') + R(X, 296, U * fb, 34, 'et03-brx', W({rx: 6}, tip('표면 반응 — E_a 약 55 kJ/mol, 10 °C에 약 ×2.05')));
      s += val(fb, 322, 'et03-bv');
      s += L(X + U, 232, X + U, 340, 'et03-tick') + T(X + U, 360, '×1 (25 °C)', 't-dim');
      s += T(64, 392, '활성화 에너지(E_a) 예: 확산 18 · 표면 반응 55 kJ/mol → 10 °C에 ×1.27 · ×2.05', 't-dim', 'start');
      s += T(64, 422, '온도를 올리면 반응 문이 더 많이 넓어져 공급 지배 쪽으로 기운다', 't-dim', 'start');
      set('[data-v="react"]', s);
    }
    // which: 두 문 + 두 눈금 (각 손잡이의 최대 효과와 비교)
    function which(dg){
      const PY = 226, PH = 96, XS = [330, 610], rr = [dg.mt, dg.rx], mx = Math.max(dg.mt, dg.rx), ratio = dg.mt / dg.rx;
      let s = T(64, 172, '누가 정하나 — 좁은 문이 줄의 빠르기를 정한다', 't-acc', 'start');
      s += T(XS[0], 208, '① 공급 문 — 흐름 · 확산', 't-sub') + T(XS[1], 208, '② 반응 문 — 표면 · 온도', 't-sub');
      s += R(80, PY - 4, 800, PH + 8, 'et03-pipe', {rx: 14});
      const dur = K.clamp(7 * 320 / dg.r, 2.2, 16);
      for (let k = 0; k < 10; k++) s += K.mover(96, PY + PH / 2, 864, PY + PH / 2, 9, 'et03-dot', dur, k * dur / 10);
      const TIPS = ['공급 문 — 흐름이 셀수록(δ 얇음) · 산화제가 진할수록 넓다', '반응 문 — 온도가 높을수록 · 산화제가 진할수록 넓다'];
      XS.forEach((x, i) => {
        const gap = Math.max(8, PH * rr[i] / mx), bh = (PH - gap) / 2;
        let d = R(x - 14, PY, 28, bh, 'et03-door') + R(x - 14, PY + PH - bh, 28, bh, 'et03-door') + R(x - 17, PY - 8, 34, PH + 16, i ? 'et03-d2' : 'et03-d1', {rx: 4});
        s += G(d, tip(TIPS[i]));
      });
      const nar = ratio < 0.8 ? 0 : ratio > 1.25 ? 1 : -1;
      s += T(XS[0], 352, `${fmt(dg.mt)} nm/분`, nar === 0 ? 't-warn' : 't-sub') + T(XS[1], 352, `${fmt(dg.rx)} nm/분`, nar === 1 ? 't-warn' : 't-sub');
      s += nar < 0 ? T(470, 384, '두 문이 비슷 — 둘 다 속도를 정한다', 't-warn') : T(XS[nar], 384, '▲ 좁은 문 = 지금 속도를 정함', 't-warn');
      // 눈금: 왼쪽 끝 = 완전 공급 지배, 오른쪽 끝 = 완전 반응 지배
      const BX = 360, BW = 380;
      s += T(BX, 420, '◀ 공급 지배', 't-dim', 'start') + T(BX + BW, 420, '반응 지배 ▶', 't-dim', 'end');
      const gauge = (y, lab, sub, pos, val, tp) => {
        const mx2 = BX + BW * K.clamp(pos);
        return T(64, y + 14, lab, 't-sub', 'start') + T(64, y + 38, sub, 't-dim', 'start') + R(BX, y, BW, 16, 'et03-gbar', W({rx: 8}, tip(tp))) +
          C(mx2, y + 8, 12, 'k-acc2') + C(mx2, y + 8, 12, 'et03-mk') + T(BX + BW + 16, y + 16, val, 't-warn', 'start');
      };
      s += gauge(436, `흐름 ×2 → +${pc(dg.fl)} %`, '공급만 +41 % · 반응만 0 %', 1 - dg.fs, `민감도 ${dg.fs.toFixed(2)}`, '흐름 민감도 = 흐름 ×2 효과 ÷ 41 % (완전 공급 지배일 때). 1이면 공급 지배, 0이면 반응 지배');
      s += gauge(496, `+10 °C → +${pc(dg.tu)} %`, `공급만 +${pc(dg.tMt)} % · 반응만 +${pc(dg.tRx)} %`, dg.tp, `위치 ${dg.tp.toFixed(2)}`, '온도 위치 = +10 °C 효과가 공급만(0) ~ 반응만(1) 사이 어디인지');
      // δ 띠 안: 흐름 ×2 가 하는 일 (δ ÷ √2)
      const tp0 = SURF - dg.dl * PX, tp2 = SURF - dg.dl / Math.SQRT2 * PX;
      if (tp2 - tp0 > 40){
        s += L(BX0, tp2, BX1, tp2, 'et03-half') + K.arrow(860, tp0 + 6, 860, tp2 - 6, 's-arr');
        s += T(844, tp2 - 12, `흐름 ×2 → δ ÷ √2 ≈ ${Math.round(dg.dl / Math.SQRT2)} µm (공급 문 ×1.41)`, 't-sub', 'end');
      }
      // 줄의 빠르기 (δ 이름표 · δ ÷ √2 이름표와 겹치지 않는 높이에)
      const busy = [tp0 - 0 < SURF - 64 ? tp0 + 32 : tp0 - 12].concat(tp2 - tp0 > 40 ? [tp2 - 12] : []);
      const fy = [800, 880, 700, 620].find(y => busy.every(b => b < y - 30 || b > y + 66)) || 880;
      s += T(470, fy, `줄의 빠르기 = 1 ÷ (1/${fmt(dg.mt)} + 1/${fmt(dg.rx)}) ≈ ${fmt(dg.r)} nm/분`, 't-lbl');
      s += T(470, fy + 36, '이미 넓은 문을 더 넓혀도 거의 그대로 — 좁은 문을 넓혀야 빨라진다', 't-sub');
      set('[data-v="which"]', s);
    }
    // 그래프 ①: 속도 vs δ
    function graph1(dg){
      const {T: Tc, c} = st, a60 = rates(60, Tc, c), dstar = 60 * a60.mt / dg.rx, xs = K.clamp(dx(dstar), G1.x0, G1.x1);
      let z = R(G1.x0, G1.y1, xs - G1.x0, G1.y0 - G1.y1, 'pl-z1', tip('공급 지배 쪽 — 공급 한계가 반응 한계보다 낮다')) + R(xs, G1.y1, G1.x1 - xs, G1.y0 - G1.y1, 'pl-z0', tip('반응 지배 쪽 — 반응 한계가 공급 한계보다 낮다'));
      if (xs > G1.x0 + 1 && xs < G1.x1 - 1) z += L(xs, G1.y1, xs, G1.y0, 's-dash');
      if (xs - G1.x0 > 170) z += LB(T(G1.x0 + 10, G1.y1 + 26, '공급 지배 쪽', 'et03-zt1', 'start'));
      if (G1.x1 - xs > 150) z += LB(T(G1.x1 - 10, G1.y1 + 26, '반응 지배 쪽', 'et03-zt0', 'end'));
      set('[data-v="g1z"]', z);
      let pm = '', pt = '';
      for (let k = 0; k <= 60; k++){ const d = 200 * Math.pow(0.05, k / 60), a = rates(d, Tc, c), x = dx(d).toFixed(1); pm += (k ? ' L' : 'M') + x + ',' + ry(G1, a.mt).toFixed(1); pt += (k ? ' L' : 'M') + x + ',' + ry(G1, a.r).toFixed(1); }
      let cv = P(pm, 's-curve2', tip('공급 한계 — 공급 문만 있을 때의 속도 (∝ 1/δ)')) + L(G1.x0, ry(G1, dg.rx), G1.x1, ry(G1, dg.rx), 'et03-rxl', tip('반응 한계 — 흐름과 무관 (온도 · 농도만)')) + P(pt, 's-curve', tip('실제 속도 — 두 문을 차례로: 1 ÷ (1/공급 + 1/반응)'));
      // which: 지금 점을 지나는 두 한계 점선
      const lim = [];
      const far = dx(dg.dl) < (G1.x0 + G1.x1) / 2 ? 10 : 200, xe = far === 10 ? G1.x1 - 6 : G1.x0 + 6, an = far === 10 ? 'end' : 'start';
      lim.push(P(`M${dx(200).toFixed(1)},${ry(G1, dg.r * dg.dl / 200).toFixed(1)} L${dx(10).toFixed(1)},${ry(G1, dg.r * dg.dl / 10).toFixed(1)}`, 'et03-lim1'));
      lim.push(L(G1.x0, ry(G1, dg.r), G1.x1, ry(G1, dg.r), 'et03-lim2'));
      let s = G(cv + G(lim.join(''), K.only('which')), {'clip-path': 'url(#et03-c1)'});
      if (dg.rx > 20000) s += LB(T(G1.x1 - 10, G1.y0 - 12, '반응 한계 ▲ (20,000 넘음)', 'et03-lt2', 'end'));
      const cy1 = y => K.clamp(y, G1.y1 + 48, G1.y0 - 10), yS = ry(G1, dg.r * dg.dl / far), yR = ry(G1, dg.r);
      s += G(LB(tag(K, xe, cy1(far === 10 ? yS - 10 : yS + 26), '공급만이면', 'et03-lt1', an) + tag(K, xe, cy1(far === 10 ? yR + 26 : yR - 10), '반응만이면 평평', 'et03-lt2', an)), K.only('which'));
      // 지금 점 — 이름표는 점 아래(두 한계 선은 늘 실제 곡선 위에 있다), 바닥에 닿으면 위로
      const x = dx(dg.dl), y = ry(G1, dg.r), nowS = `지금 ${fmt(dg.r)} nm/분`, nw = tw(nowS, 23) / 2 + 10, fw = tw('반응만이면 평평', 19) + 16;
      s += C(x, y, 9, 'k-acc2', tip(`지금: δ ${Math.round(dg.dl)} µm → ${fmt(dg.r)} nm/분`)) + C(x, y, 18, 'co-ring');
      const vy = y + 42 <= G1.y0 - 8 ? y + 42 : y - 26;
      const nx = K.clamp(x, G1.x0 + nw, G1.x1 - nw), nx2 = ctx.step() === 'which' ? (far === 10 ? Math.min(nx, G1.x1 - 6 - fw - nw) : Math.max(nx, G1.x0 + 6 + fw + nw)) : nx;
      s += G(LB(tag(K, nx2, vy, nowS, 't-warn')), K.only('supply react which'));
      // spray: 담금 · 회전 스프레이 두 점
      const aI = rates(DIM, Tc, c), aS = rates(DSP, Tc, c), xI = dx(DIM), yI = ry(G1, aI.r), xS = dx(DSP), yS2 = ry(G1, aS.r);
      let sp = K.arrow(xI + 14, yI - 3, xS - 16, yS2 + 4, 's-arr2') + C(xI, yI, 12, 'et03-ref') + C(xS, yS2, 13, 'et03-ref');
      const spLow = yS2 - 22 < G1.y1 + 58;
      sp += LB(tag(K, xI, yI + 36 > G1.y0 - 8 ? yI - 22 : yI + 36, `담금 (δ ${DIM}) ${fmt(aI.r)}`, 't-sub', 'start')) + LB(tag(K, xS - (spLow ? 24 : 14), spLow ? yS2 + 7 : yS2 - 22, `회전 스프레이 (δ ${DSP}) ${fmt(aS.r)}`, 't-sub', 'end'));
      sp += LB(tag(K, (xI + xS) / 2 + 10, (yI + yS2) / 2 + 30, `×${(aS.r / aI.r).toFixed(1)}`, 't-warn', 'start'));
      s += G(sp, K.only('spray'));
      set('[data-v="g1"]', s);
    }
    // 그래프 ②: 속도 vs 온도
    function graph2(dg){
      const {T: Tc, c} = st, dl = dg.dl, a25 = rates(dl, 25, c);
      const Ts = 1 / (1 / T0 + Math.log(a25.rx / a25.mt) * RG / (EAR - EAD)) - 273.15, xs = K.clamp(tx(Ts), G2.x0, G2.x1);
      let z = R(G2.x0, G2.y1, xs - G2.x0, G2.y0 - G2.y1, 'pl-z0', tip('반응 지배 쪽 — 차가우면 반응 문이 좁다')) + R(xs, G2.y1, G2.x1 - xs, G2.y0 - G2.y1, 'pl-z1', tip('공급 지배 쪽 — 뜨거우면 반응 문이 넓어져 공급 문이 좁은 쪽이 된다'));
      if (xs > G2.x0 + 1 && xs < G2.x1 - 1) z += L(xs, G2.y1, xs, G2.y0, 's-dash');
      if (xs - G2.x0 > 170) z += LB(T(G2.x0 + 10, G2.y1 + 26, '반응 지배 쪽', 'et03-zt0', 'start'));
      if (G2.x1 - xs > 170) z += LB(T(G2.x1 - 10, G2.y1 + 26, '공급 지배 쪽', 'et03-zt1', 'end'));
      set('[data-v="g2z"]', z);
      let pm = '', px = '', pt = '';
      for (let t = 20; t <= 50.001; t += 1){ const a = rates(dl, t, c), x = tx(t).toFixed(1), k = t === 20 ? 'M' : ' L'; pm += k + x + ',' + ry(G2, a.mt).toFixed(1); px += k + x + ',' + ry(G2, a.rx).toFixed(1); pt += k + x + ',' + ry(G2, a.r).toFixed(1); }
      let cv = P(pm, 's-curve2', tip('공급 한계 — 확산이 빨라지는 만큼만 (10 °C에 약 ×1.27)')) + P(px, 'et03-rxl', tip('반응 한계 — 가파르다 (10 °C에 약 ×2.05)')) + P(pt, 's-curve', tip('실제 속도'));
      // which: 지금 점을 지나는 두 한계 점선 (공급만 · 반응만이었다면)
      const far = Tc <= 35 ? 50 : 20, xe = far === 50 ? G2.x1 - 6 : G2.x0 + 6, an = far === 50 ? 'end' : 'start';
      let lm = '', lx = '';
      for (let t = 20; t <= 50.001; t += 2){ const x = tx(t).toFixed(1), k = t === 20 ? 'M' : ' L'; lm += k + x + ',' + ry(G2, dg.r * arr(EAD, t) / arr(EAD, Tc)).toFixed(1); lx += k + x + ',' + ry(G2, dg.r * arr(EAR, t) / arr(EAR, Tc)).toFixed(1); }
      cv += G(P(lm, 'et03-lim1') + P(lx, 'et03-lim2'), K.only('which'));
      let s = G(cv, {'clip-path': 'url(#et03-c2)'});
      const cy2 = y => K.clamp(y, G2.y1 + 48, G2.y0 - 10), yM = ry(G2, dg.r * arr(EAD, far) / arr(EAD, Tc)), yX = ry(G2, dg.r * arr(EAR, far) / arr(EAR, Tc));
      const up = far === 50;                                     // 오른쪽 끝: 반응만 선이 위, 공급만 선이 아래
      let lX = cy2(up ? yX - 10 : yX + 26), lM = cy2(up ? yM + 26 : yM - 10);
      if (Math.abs(lX - lM) < 26){ if (up) lM = Math.min(G2.y0 - 10, lX + 26); else lX = Math.min(G2.y0 - 10, lM + 26); if (Math.abs(lX - lM) < 26){ if (up) lX = lM - 26; else lM = lX - 26; } }
      s += G(LB(tag(K, xe, lX, '반응만이면', 'et03-lt2', an) + tag(K, xe, lM, '공급만이면', 'et03-lt1', an)), K.only('which'));
      // 지금 점 — 이름표는 점 아래(한계 곡선은 늘 실제 곡선 위), 바닥에 닿으면 위로
      const x = tx(Tc), y = ry(G2, dg.r), nowS = `지금 ${Tc} °C · ${fmt(dg.r)} nm/분`, nw = tw(nowS, 23) / 2 + 10, fw = tw('반응만이면', 19) + 16;
      s += C(x, y, 9, 'k-acc2', tip(`지금: ${Tc} °C → ${fmt(dg.r)} nm/분`)) + C(x, y, 18, 'co-ring');
      const vy = y + 42 <= G2.y0 - 8 ? y + 42 : y - 26;
      const nx = K.clamp(x, G2.x0 + nw, G2.x1 - nw), nx2 = ctx.step() === 'which' ? (far === 50 ? Math.min(nx, G2.x1 - 6 - fw - nw) : Math.max(nx, G2.x0 + 6 + fw + nw)) : nx;
      s += LB(tag(K, nx2, vy, nowS, 't-warn'));
      set('[data-v="g2"]', s);
    }
    function spray(){
      const aI = rates(DIM, st.T, st.c), aS = rates(DSP, st.T, st.c);
      let s = T(260, 716, `모델 ≈ ${fmt(aI.r)} nm/분`, 't-warn') + T(260, 748, `1 초에 약 ${(aI.r / 60).toFixed(1)} nm`, 't-dim');
      s += T(685, 716, `모델 ≈ ${fmt(aS.r)} nm/분`, 't-warn') + T(685, 748, `1 초에 약 ${(aS.r / 60).toFixed(1)} nm`, 't-dim');
      s += T(470, 818, `모델: 회전 스프레이 ≈ 담금 × ${(aS.r / aI.r).toFixed(1)} (δ는 ${DIM / DSP}배 얇지만 반응 문이 막는다)`, 't-warn');
      set('[data-v="spray"]', s);
    }
    function render(){
      const dg = diag(dOf(st.f), st.T, st.c);
      tank(dg); react(); which(dg); graph1(dg); graph2(dg); spray();
      const reg = REG(dg.sh), t300 = 300 / dg.r * 60;
      set('[data-v="sum"]', `<text x="60" y="1062" class="t-sub" text-anchor="start">지금: <tspan class="et03-hl">${K.esc(reg)}</tspan> — 공급 몫 ${pc(dg.sh)} % · 속도 ${fmt(dg.r)} nm/분 · Cu 300 nm를 약 ${Math.round(t300)} 초에 (1 초에 ${(dg.r / 60).toFixed(1)} nm)</text>` +
        T(60, 1096, `흐름 ×2 → +${pc(dg.fl)} % (최대 +41 %의 ${dg.fs.toFixed(2)}) · +10 °C → +${pc(dg.tu)} % (공급만 +${pc(dg.tMt)} % ~ 반응만 +${pc(dg.tRx)} % 사이, 위치 ${dg.tp.toFixed(2)})`, 't-dim', 'start'));
      ctx.refresh();
      ctx.out('k-r', fmt(dg.r)); ctx.out('k-t', `${Math.round(t300)} 초`); ctx.out('k-1s', `${(dg.r / 60).toFixed(1)} nm`);
      ctx.out('k-sh', `${pc(dg.sh)} %`); ctx.out('k-fs', dg.fs.toFixed(2)); ctx.out('k-tp', dg.tp.toFixed(2));
      const lead = dg.sh > 0.55 ? '흐름(회전 · 유량)과 산화제 농도가 잘 듣습니다. 흐름이 다른 곳(가장자리 · 범프 사이 좁은 틈 · 빽빽한 다이)마다 속도가 달라지기 쉽습니다'
        : dg.sh < 0.45 ? '흐름은 잘 안 듣고 온도 · 농도가 듣습니다. 액 온도가 1~2 °C만 흔들려도 속도가 몇 %씩 바뀝니다'
        : '흐름과 온도가 모두 조금씩 듣습니다';
      ctx.q('[data-o=msg]').innerHTML = `<b>${reg}</b> (공급 몫 ${pc(dg.sh)} %) — 흐름 ×2 → +${pc(dg.fl)} % (최대 +41 %의 ${dg.fs.toFixed(2)}), +10 °C → +${pc(dg.tu)} % (공급만 +${pc(dg.tMt)} % ~ 반응만 +${pc(dg.tRx)} % 사이, 위치 ${dg.tp.toFixed(2)}). ${lead}.`;
    }
    ctx.range('f', v => { st.f = v; render(); return `δ ${Math.round(dOf(v))} µm`; });
    ctx.range('T', v => { st.T = v; render(); return `${v} °C`; });
    ctx.range('c', v => { st.c = v; render(); return `${v.toFixed(2)} wt%`; });
    [fin, tin, cin].forEach(i => i && i.addEventListener('input', () => { touched = true; }));
    ctx.demo = sid => {
      if (touched || !DEMO[sid]) return render();                   // 손댄 값은 그대로 두되, 단계별 이름표 자리는 다시 잡는다
      const [f, T2] = DEMO[sid];
      fin.value = f; tin.value = T2; st.f = f; st.T = T2;
      ctx.out('f', `δ ${Math.round(dOf(f))} µm`); ctx.out('T', `${T2} °C`);
      render();
    };
  },
  onStep(K, ctx, sid){ if (ctx.demo) ctx.demo(sid); },
  notes(K){
    return K.terms([
      ['대류', '흐르는 액이 약품을 실어 나르는 것 (펌프 · 회전 · 분사)'],
      ['확산층 (δ)', '표면 앞에서 흐름이 느려져 주로 확산으로 건너는 층. 가만히 담그면 두껍고(100 µm 이상), 회전 스프레이면 얇다(수~수십 µm). 계산하기 쉽게 정한 등가 두께'],
      ['공급(물질 전달) 지배', '약품이 표면까지 오는 빠르기가 전체 속도를 정하는 상태 — 흐름에 민감'],
      ['반응 지배', '표면 반응이 느려 전체 속도를 정하는 상태 — 온도에 민감'],
      ['공급 몫', '지금 속도 ÷ 공급 한계(공급 문만 있을 때의 속도). 1에 가까울수록 공급 지배'],
      ['활성화 에너지 (E_a)', '반응이 일어나려고 넘어야 하는 에너지 문턱. 클수록 온도에 민감'],
      ['아레니우스 식', '속도 ∝ exp(−E_a/RT) — 온도와 속도의 관계'],
      ['블랭킷 웨이퍼', '패턴 없이 전면에 막만 입힌 시험 웨이퍼. 식각 속도를 재는 기준 (패턴 웨이퍼와 결과가 다를 수 있다)']
    ]) + K.field([
      '진단법: 같은 조건에서 흐름(회전 · 유량)만 크게(예: 4배) 바꿔 봅니다. 속도가 최대(완전 공급 지배면 4배 흐름에 약 2배)에 가깝게 변하면 공급 지배, 거의 안 변하면 반응 지배입니다. 온도 실험은 \'공급만이면 10 °C에 약 1.3배, 반응만이면 약 2배\' 사이 어디인지로 읽습니다. 같은 그림이 도금에도 있습니다 → <a href="#go-plating-04">전해도금 04장</a>.',
      '공급 지배 식각은 흐름이 다른 곳마다 속도가 다릅니다 — 웨이퍼 중심 · 가장자리, 범프 사이 좁은 틈, 빽빽한 다이 → <a data-go="end.load">07장</a>.',
      '반응 지배 식각은 온도에 민감합니다. 액 온도 1~2 °C 흔들림도 시간 여유를 갉아먹으니 온도 로그를 식각 결과와 함께 봅니다.',
      '전해도금 03장과 같은 그림입니다. 도금에서는 Cu²⁺가 표면으로 오고, 식각에서는 산화제가 표면으로 오고 Cu²⁺가 떠납니다 → <a href="#go-plating-03">전해도금 03장</a>.',
      '장비를 바꾸거나(담금 → 회전 스프레이) 회전 · 유량을 바꾸면 블랭킷 속도부터 다시 잽니다. 속도가 빨라질수록 1 초 오차가 지우는 두께도 커져, 끝점과 식각 → 헹굼 전환 시간이 더 중요해집니다 → <a data-go="end.time">07장</a>.'
    ]) + K.deep(`<ul>
      <li><b>직렬 저항</b> — 두 문을 차례로 지나므로 저항(1/속도)이 더해집니다.${K.eq('r = 1 / (1/r_반응 + 1/r_공급),  r_공급 = D·C/δ × V_m / ν')}ν = Cu 1 mol 당 산화제 mol (H₂O₂ 는 1). 예: H₂O₂ 0.15 wt%(≈ 44 mol/m³), D ≈ 1.5×10⁻⁹ m²/s, δ 60 µm → 약 1.1×10⁻³ mol/m²·s ≈ 470 nm/분. δ 200 µm(가만히 담금)면 약 140, 15 µm(회전 스프레이)면 약 1,900 nm/분.</li>
      <li><b>민감도는 몫과 같다</b> — 직렬 저항에서 d ln r / d ln(1/δ) = r ÷ r_공급 = 공급 몫입니다. 흐름 ×2(δ ÷ √2)의 효과를 최대 +41 %로 나눈 값이 대략 공급 몫이 되는 까닭입니다(유한한 변화라 조금 작게 나옵니다 — 기본 0.60 vs 몫 0.68).</li>
      <li><b>온도</b> — k ∝ exp(−E_a/RT). 25 → 35 °C 에서 E_a 15~20 kJ/mol(확산 정도)이면 약 1.2~1.3배, 50~60 kJ/mol(표면 반응)이면 약 1.9~2.2배. 겉보기 E_a 가 20 kJ/mol 아래면 보통 공급 지배, 40 kJ/mol 위면 반응 지배 쪽으로 읽는 경험칙이 있지만, E_a 만으로 단정하지 않고 흐름 실험과 함께 봅니다. 온도를 올리면 반응 문이 더 빨리 넓어져 같은 장비라도 공급 지배 쪽으로 기웁니다(위젯: 25 → 35 °C 에서 공급 몫 68 → 78 %).</li>
      <li><b>회전과 δ</b> — 회전 원판에서 δ ∝ ω^(−1/2)(레비치). 공급 지배면 속도 ∝ √회전. 공개 연구(Cu 회전 원판, 구연산 + 과산화수소)에서 속도가 √회전에 비례하고 E_a ≈ 33 kJ/mol 로 섞인 지배를 보였습니다(산화제 차수 약 0.92 — 위젯은 1로 둡니다).</li>
      <li><b>장비 차이</b> — 공개 보고(묽은 황산 + 과산화수소, 1:1:100): 단일 웨이퍼 장비의 흘려 붓기가 담금보다 약 4배, 회전 + 스프레이가 약 7배 빨랐습니다. 위젯 모델은 반응 문(1,000 nm/분)이 위를 막아 δ 150 → 15 µm 에서 약 4배입니다 — 배수는 액의 반응 빠르기에 따라 다릅니다. 블랭킷 웨이퍼의 빠른 속도가 곧 패턴 웨이퍼의 결과는 아니라는 점도 함께 보고되었습니다.</li>
      <li><b>산도 함께 모자란다</b> — Cu 하나를 녹이는 데 H⁺ 2개가 듭니다(Cu + H₂O₂ + 2H⁺ → Cu²⁺ + 2H₂O). 범프 사이처럼 좁은 곳은 산화제와 산이 함께 모자라 느려지고, 산이 모자라면 산화막이 생겨 얼룩이 됩니다(<a data-go="chem.bal">02장</a>) → 로딩(<a data-go="end.load">07장</a>). 녹은 Cu²⁺는 잘 녹아 있어(황산구리는 1 M 넘게 녹음) 그 자체로 길을 막지는 않지만, 과산화수소 분해를 거들어 산화제를 더 줄입니다.</li>
      <li><b>위젯 상수</b> — D 1.5×10⁻⁹ m²/s(물 속 작은 분자의 일반 값, 예시), r_반응 1,000 nm/분 @ 0.15 wt% · 25 °C (= 2,000 × C/0.3, 02장 위젯의 \'산 넉넉\' 쪽과 같은 눈금), E_a 반응 55 · 확산 18 kJ/mol. 실제 값은 액 · 장비 · 첨가제마다 다르므로 블랭킷 속도 측정으로 확인합니다.</li></ul>`);
  },
  css: `.pl-svg .et03-s1{opacity:.5;animation-duration:2.2s}
.pl-svg .et03-s2{opacity:.28;animation-duration:4.5s}
.et03-rx{fill:#c084fc}
.et03-pipe{fill:rgba(56,189,248,.08);stroke:#38bdf8;stroke-width:1.5}
.et03-door{fill:#334155;stroke:#94a3b8;stroke-width:1.2}
.et03-d1{fill:none;stroke:#f59e0b;stroke-width:2.6}
.et03-d2{fill:none;stroke:#a78bfa;stroke-width:2.6}
.et03-dot{fill:#5eead4}
.pl-ion.et03-pox circle{fill:#5eead4;stroke:#ccfbf1}
.et03-rxl{fill:none;stroke:#a78bfa;stroke-width:3;stroke-dasharray:9 7}
.et03-lim1{fill:none;stroke:#fdba74;stroke-width:2.2;stroke-dasharray:2 7;stroke-linecap:round}
.et03-lim2{fill:none;stroke:#c4b5fd;stroke-width:2.2;stroke-dasharray:2 7;stroke-linecap:round}
.et03-grid{stroke:rgba(148,163,184,.14);stroke-width:1}
.pl-svg .et03-lt1{font-size:19px;font-weight:800;fill:#fdba74 !important}
.pl-svg .et03-lt2{font-size:19px;font-weight:800;fill:#c4b5fd !important}
.pl-svg .et03-bv{font-size:23px;font-weight:800;fill:#c4b5fd !important}
.pl-svg .et03-zt1{font-size:19px;font-weight:700;fill:#fcd34d !important}
.pl-svg .et03-zt0{font-size:19px;font-weight:700;fill:#86efac !important}
.pl-svg tspan.et03-hl{fill:#fbbf24 !important;font-weight:800}
.et03-bmt{fill:#f59e0b}
.et03-brx{fill:#a78bfa}
.et03-tick{stroke:#e2e8f0;stroke-width:2;stroke-dasharray:4 3}
.et03-gbar{fill:url(#et03-gg)}
.et03-mk{fill:none;stroke:#fff;stroke-width:2}
.et03-ref{fill:none;stroke:#e2e8f0;stroke-width:2.6}
.et03-tag{fill:rgba(11,18,34,.8)}
.et03-drop{fill:#5eead4}
.et03-cone{fill:rgba(94,234,212,.07)}
.et03-spark{fill:#f5d0fe}
.et03-half{fill:none;stroke:#7dd3fc;stroke-width:2;stroke-dasharray:10 6}
.pl-svg .et03-cut{font-size:21px;font-weight:800;fill:#2a1405 !important;stroke:none !important}
.pl-svg .et03-cut2{font-size:21px;font-weight:900;fill:#2a1405 !important;stroke:none !important}
.pl-svg .et03-bt{font-size:21px;font-weight:900;fill:#0b1222 !important;stroke:none !important}`
});
})();
