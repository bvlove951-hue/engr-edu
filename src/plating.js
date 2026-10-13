/* ================================================================
 * engr-edu · 전해도금 — 원리부터 현장까지 13장 (범프 공정 탭과 같은 '도면 극장' 화면)
 *
 * 구조
 *  - 장(章)은 src/plating/NN-*.js 에 한 파일씩 있고 window.EngrPlatingChapters 에 정의를 넣는다.
 *    이 파일(엔진)은 빌드 때 장 파일들 뒤에 붙어, 장을 모아 무대 · 카드 · HUD를 만든다.
 *  - 장 정의
 *      {no, id, part(1~3), title, short, scale, hook, one, ana, icon(K), css, steps:[{id, t, d, view?}],
 *       draw(K) → 장면 SVG, body(K) → 단계 카드에 붙는 HTML(위젯), notes(K) → 노트 카드 HTML,
 *       mount(K, ctx) → 위젯 연결, onStep(K, ctx, 단계id) → 단계가 바뀔 때}
 *  - 무대(1600×1000 SVG): 장마다 <g class="pl-scene">, 지금 장만 보인다. 장면 요소는
 *      data-st="a b"(이 단계들에서만) · data-on="b"(이 단계부터) · data-off="d"(이 단계부터 사라짐) 으로 나타나고 사라진다.
 *  - 카드: 장마다 ① 단계 카드(따라 붙음 · 스크롤하면 단계가 바뀜 · 위젯) ② 노트 카드(용어 · 현장에서는 · 한 걸음 더)
 *  - 수치는 교과서 수준의 예시, 계산 위젯은 경향을 보여 주는 개념 모델이다 (사내 조건 없음).
 * ================================================================ */
(function(){
'use strict';
const VIEW = document.getElementById('view-plating');
if (!VIEW) return;
const CHS = (window.EngrPlatingChapters || []).slice().sort((a, b) => String(a.no).localeCompare(String(b.no)));
const PARTS = {1: '원리', 2: '모양과 품질', 3: '현장'};
const NCH = CHS.length;

/* ---------------- 1. 그림 도구 (장 파일이 K 로 받아 쓴다) ---------------- */
const W0 = 1600, H0 = 1140;
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
const PL = (pts, c, o) => `<polyline points="${pts.map(p => q1(p[0]) + ',' + q1(p[1])).join(' ')}" class="${c}"${at(o)}/>`;
const T = (x, y, s, c = 't-lbl', a = 'middle', o) => `<text x="${q1(x)}" y="${q1(y)}" class="${c}" text-anchor="${a}"${at(o)}>${esc(s)}</text>`;
// 여러 줄 글 (줄 간격 lh)
const TT = (x, y, lines, c = 't-sub', a = 'start', lh = 26, o) => lines.map((s, k) => T(x, y + k * lh, s, c, a, k ? null : o)).join('');
const G = (inner, o) => `<g${at(o)}>${inner}</g>`;
const LB = (inner, o) => G(inner, Object.assign({class: 'lbl'}, o || {}));
const tip = s => ({'data-tip': s});
const only = list => ({'data-st': list});                        // 이 단계들에서만
const on = (a, b) => ({'data-on': a, 'data-off': b});           // a 단계부터 b 단계 전까지
const W = (...os) => Object.assign({}, ...os.filter(Boolean));
// 0~1 사이 결정적 난수 (그림이 매번 같게)
function rng(seed){ let k = (seed | 0) % 2147483647; if (k <= 0) k += 2147483646; return () => ((k = (k * 16807) % 2147483647) - 1) / 2147483646; }
function lead(px, py, tx, ty, s, a = 'start', c = 't-sub', o){
  return LB(P(`M${q1(px)},${q1(py)} L${q1(tx)},${q1(ty)}`, 's-lead') + C(px, py, 3.5, 'k-lead') + T(tx + (a === 'end' ? -8 : 8), ty + 6, s, c, a), o);
}
// 직선으로 오가는 점 (원자 · 이온 · 물방울)
function mover(x0, y0, x1, y1, r, cls, dur, delay, o){
  return `<circle r="${r}" class="${cls}"${at(o)}><animateMotion dur="${dur}s" begin="-${q1(delay)}s" repeatCount="indefinite" path="M${q1(x0)},${q1(y0)} L${q1(x1)},${q1(y1)}"/><animate attributeName="opacity" values="0;1;1;0" dur="${dur}s" begin="-${q1(delay)}s" repeatCount="indefinite"/></circle>`;
}
// 이온 (글자가 든 동그라미). kind: cu ni sn ag so4 h cl ms
const ION = {cu: 'Cu²⁺', ni: 'Ni²⁺', sn: 'Sn²⁺', sn4: 'Sn⁴⁺', ag: 'Ag⁺', so4: 'SO₄²⁻', h: 'H⁺', cl: 'Cl⁻', ms: 'MS⁻', e: 'e⁻'};
const ION_R = {cu: 18, ni: 18, sn: 18, sn4: 18, ag: 16, so4: 20, h: 13, cl: 13, ms: 17, e: 9};
function ionG(kind, inner, o){
  const r = ION_R[kind] || 14;
  return `<g class="pl-ion ${kind}"${at(o)}><circle r="${r}"/><text y="${kind === 'e' ? 4 : 5.5}" text-anchor="middle">${esc(ION[kind] || kind)}</text>${inner || ''}</g>`;
}
const ion = (x, y, kind, o) => ionG(kind, '', W({transform: `translate(${q1(x)} ${q1(y)})`}, o));
// 경로를 따라 움직이는 이온. path 는 (0,0) 기준이 아니라 무대 좌표
function ionPath(path, kind, dur, delay, o, fade = true){
  const fadeA = fade ? `<animate attributeName="opacity" values="0;1;1;1;0" dur="${dur}s" begin="-${q1(delay)}s" repeatCount="indefinite"/>` : '';
  return ionG(kind, `<animateMotion dur="${dur}s" begin="-${q1(delay)}s" repeatCount="indefinite" path="${path}"/>` + fadeA, o);
}
// 제자리에서 흔들리는 이온 (브라운 운동 느낌)
function jiggle(x, y, kind, seed, amp = 9, o){
  const r = rng(seed * 97 + 13), pts = [];
  for (let k = 0; k < 5; k++) pts.push([q1(x + (r() - 0.5) * 2 * amp), q1(y + (r() - 0.5) * 2 * amp)]);
  const d = `M${q1(x)},${q1(y)} ` + pts.map(p => `L${p[0]},${p[1]}`).join(' ') + ` Z`;
  return ionPath(d, kind, 3.4 + r() * 2, r() * 4, o, false);
}
// 떠오르는 거품
function bubble(x, y, r, rise, dur, delay, o){
  return `<circle cx="${q1(x)}" r="${r}" class="pl-bub"${at(o)}><animate attributeName="cy" values="${q1(y)};${q1(y - rise)}" dur="${dur}s" begin="-${q1(delay)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.9;.9;0" dur="${dur}s" begin="-${q1(delay)}s" repeatCount="indefinite"/></circle>`;
}
// 화살표 (끝에 촉). 촉 색은 선 종류에 맞춘 marker (오래된 브라우저도 보이게 context-stroke 를 쓰지 않는다)
const MK = {'s-arr': 'pl-arr', 's-arr2': 'pl-arr-a', 's-arrg': 'pl-arr-g', 's-arrr': 'pl-arr-r', 's-arr3': 'pl-arr-p', 'pl-rate': 'pl-arr-a'};
const mk = c => ({'marker-end': `url(#${MK[String(c).split(' ')[0]] || 'pl-arr'})`});
const arrow = (x1, y1, x2, y2, c = 's-arr', o) => P(`M${q1(x1)},${q1(y1)} L${q1(x2)},${q1(y2)}`, c, W(mk(c), o));
const arrowP = (d, c = 's-arr', o) => P(d, c, W(mk(c), o));
// 둥근 상자 + 제목 (장면 안 설명 상자)
function box(x, y, w, h, title, o){ return R(x, y, w, h, 'pl-box', W({rx: 12}, o)) + (title ? T(x + 16, y + 30, title, 't-acc', 'start') : ''); }
// 0~1 값을 색으로 (파랑 → 초록 → 노랑 → 빨강)
function heat(v){
  const stops = [[0, [37, 99, 235]], [0.4, [34, 197, 94]], [0.7, [245, 158, 11]], [1, [239, 68, 68]]];
  v = clamp(v);
  for (let k = 1; k < stops.length; k++) if (v <= stops[k][0]){
    const [a, ca] = stops[k - 1], [b, cb] = stops[k], t = (v - a) / (b - a);
    return `rgb(${ca.map((c, i) => Math.round(lerp(c, cb[i], t))).join(',')})`;
  }
  return 'rgb(239,68,68)';
}
// 보로노이 칸 (결정립 그림): 씨앗 pts 마다 상자 [x0,y0,x1,y1] 안의 다각형. sy < 1 이면 세로로 길쭉한 칸
function voronoi(pts, x0, y0, x1, y1, sy = 1){
  const P2 = pts.map(([x, y]) => [x, y * sy]), box = [[x0, y0 * sy], [x1, y0 * sy], [x1, y1 * sy], [x0, y1 * sy]];
  return P2.map((s, i) => {
    let poly = box;
    for (let j = 0; j < P2.length && poly.length; j++){
      if (j === i) continue;
      const q = P2[j], nx = q[0] - s[0], ny = q[1] - s[1], mx = (q[0] + s[0]) / 2, my = (q[1] + s[1]) / 2;
      const inside = p => (p[0] - mx) * nx + (p[1] - my) * ny <= 0, out = [];
      for (let k = 0; k < poly.length; k++){
        const a = poly[k], b = poly[(k + 1) % poly.length], ia = inside(a), ib = inside(b);
        if (ia) out.push(a);
        if (ia !== ib){ const da = (a[0] - mx) * nx + (a[1] - my) * ny, db = (b[0] - mx) * nx + (b[1] - my) * ny, t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
      }
      poly = out;
    }
    return poly.map(([x, y]) => [x, y / sy]);
  });
}
// 글을 폭(em)에 맞춰 줄로 나눈다 (한글 1em, 영문 · 숫자 약 0.55em)
function wrap(text, maxEm){
  const w = ch => /[\u3131-\uD79D]/.test(ch) ? 1 : /[A-Za-z0-9 .,:;'()\-]/.test(ch) ? 0.55 : 0.85;
  const lines = [];
  let line = '', lw = 0;
  for (const word of String(text).split(' ')){
    const ww = [...word].reduce((a, c) => a + w(c), 0);
    if (line && lw + 0.3 + ww > maxEm){ lines.push(line); line = word; lw = ww; }
    else { line = line ? line + ' ' + word : word; lw += (line === word ? 0 : 0.3) + ww; }
  }
  if (line) lines.push(line);
  return lines;
}
function h(tag, cls, html){ const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

/* 카드 조각 */
const ana = html => `<div class="pl-ana"><span class="ic">비유</span><div>${html}</div></div>`;
const terms = list => `<div class="pl-terms"><div class="hd">용어 풀이</div><dl>${list.map(([t, d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('')}</dl></div>`;
const field = list => `<div class="pl-field"><div class="hd">현장에서는</div><ul>${list.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
const deep = (html, title = '한 걸음 더 — 전문') => `<details class="pl-deep"><summary>${title}</summary><div class="in">${html}</div></details>`;
const eq = s => `<div class="pl-eq">${s}</div>`;
const ctl = (id, label, min, max, step, value) => `<div class="ctl"><label>${label} <output data-o="${id}"></output></label><input type="range" data-i="${id}" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${esc(label)}"></div>`;
const seg = (id, opts, value, label) => `<div class="pl-seg" data-g="${id}" role="group"${label ? ` aria-label="${esc(label)}"` : ''}>${label ? `<span class="lb">${label}</span>` : ''}${opts.map(([v, t]) => `<button data-v="${esc(v)}" aria-pressed="${String(v) === String(value)}">${t}</button>`).join('')}</div>`;
const kpis = list => `<div class="kpis">${list.map(([k, id, s]) => `<div class="kpi"><div class="k">${k}</div><div class="v" data-o="${id}">–</div>${s ? `<div class="s">${s}</div>` : ''}</div>`).join('')}</div>`;
const note = s => `<p class="note">${s}</p>`;
const model = s => `<p class="note pl-model">⚙ 개념 모델 — ${s}</p>`;

const K = {W0, H0, esc, clamp, lerp, q1, at, R, C, E, L, P, PG, PL, T, TT, G, LB, tip, only, on, W, rng, lead, voronoi, mk, wrap, mover, ion, ionG, ionPath, jiggle, bubble, arrow, arrowP, box, heat, ION,
  ana, terms, field, deep, eq, ctl, seg, kpis, note, model, h};

/* ---------------- 2. 상태 ---------------- */
// 상태 키: 'intro' 또는 '장id.단계id'
const key = (ch, sid) => ch.id + '.' + sid;
const ORDER = ['intro'], ST = {intro: {ch: null, k: 0}};
CHS.forEach(ch => {
  ch._idx = {};
  ch.steps.forEach((s, k) => { ch._idx[s.id] = k; const kk = key(ch, s.id); ORDER.push(kk); ST[kk] = {ch, k}; });
});
const BYID = Object.fromEntries(CHS.map(c => [c.id, c]));

/* ---------------- 3. 표지 (차례 + 크기 사다리) ---------------- */
const TILE = {w: 488, h: 132, gap: 14, x: [36, 556, 1076], y: 360};
function drawCover(){
  let s = '';
  s += T(40, 196, '전해도금', 'pl-ttl', 'start') + T(42, 246, '전기로 금속을 한 층씩 — 원리부터 현장까지 13장', 't-sub', 'start');
  s += T(42, 284, '쉬운 말 · 그림 · 직접 해 보기, 그리고 「한 걸음 더」에서 전문 지식', 't-dim', 'start');
  // 크기 사다리 (로그 눈금): 1 nm ~ 10 m
  const X0 = 840, X1 = 1550, Y = 222, lg = v => X0 + (Math.log10(v) + 9) / 10 * (X1 - X0);
  s += R(806, 118, 772, 186, 'pl-box', {rx: 12}) + T(826, 152, '이 탭에서 오가는 크기 — 분자에서 장비까지 약 10억 배', 't-dim', 'start');
  s += L(X0, Y, X1, Y, 's-edge');
  [[1e-9, '1 nm'], [1e-6, '1 µm'], [1e-3, '1 mm'], [1, '1 m']].forEach(([v, t]) => { s += L(lg(v), Y - 8, lg(v), Y + 8, 's-edge') + T(lg(v), Y + 30, t, 't-dim'); });
  // [장id, 크기(m), 이름, 위(true) / 아래] — 가까운 표시끼리 위아래로 엇갈리게
  const marks = [['additive', 2e-9, '분자', true], ['grain', 2e-7, '결정', false], ['surface', 2e-5, '표면', true], ['defects', 6e-5, '범프 단면', false], ['pattern', 4e-3, '다이', true], ['cell', 0.08, '비커', true], ['wafer', 0.3, '웨이퍼', false], ['tool', 2.2, '장비', true]];
  marks.forEach(([id, v, t, up]) => {
    const ch = BYID[id]; if (!ch) return;
    const x = lg(v);
    s += G(C(x, Y, 7, 'k-acc') + L(x, Y + (up ? -9 : 9), x, Y + (up ? -26 : 26), 's-acc') + T(x, up ? Y - 32 : Y + 56, `${ch.no} ${t}`, 'pl-mk'), {class: 'pl-go', 'data-go': id, 'data-tip': `${ch.no} ${ch.title}`});
  });
  // 차례 타일 (부마다 한 열)
  [1, 2, 3].forEach((p, col) => {
    const list = CHS.filter(c => c.part === p), x = TILE.x[col];
    s += T(x + 4, TILE.y - 14, `${p}부 ${PARTS[p]}`, 't-warn', 'start');
    list.forEach((ch, k) => {
      const y = TILE.y + k * (TILE.h + TILE.gap);
      let t = R(x, y, TILE.w, TILE.h, 'pl-tile', {rx: 14});
      t += T(x + 20, y + 56, ch.no, 'pl-tno', 'start') + T(x + 88, y + 48, ch.short || ch.title, 't-lbl', 'start') + T(x + 88, y + 80, ch.scale || '', 't-dim', 'start');
      t += T(x + 22, y + 114, ch.hook || '', 'pl-hook', 'start');
      if (ch.icon) t += G(ch.icon(K), {transform: `translate(${x + TILE.w - 92} ${y + 18}) scale(1.1)`});
      s += G(t, {class: 'pl-go', 'data-go': ch.id, 'data-tip': ch.title + '\n' + (ch.one || ''), tabindex: '0', role: 'link', 'aria-label': `${ch.no} ${ch.title}`});
    });
  });
  return s;
}

/* ---------------- 4. 엔진 ---------------- */
let tipEl = null;
function hideTip(){ if (tipEl) tipEl.style.display = 'none'; }
function showTip(ev){
  const t = ev.target.closest && ev.target.closest('[data-tip]');
  if (!t || t.closest('.off')) return hideTip();
  tipEl.textContent = t.getAttribute('data-tip');
  tipEl.style.display = 'block';
  const r = stage.getBoundingClientRect();
  tipEl.style.left = Math.max(8, Math.min(ev.clientX - r.left + 14, r.width - tipEl.offsetWidth - 8)) + 'px';
  tipEl.style.top = Math.max(8, Math.min(ev.clientY - r.top + 14, r.height - tipEl.offsetHeight - 8)) + 'px';
}
let built = false, root, stage, svg, SC = {}, blocks = [], beats = [], pres = null, auto = null, cur = null, VB = {k: 1, ox: 0, oy: 0};
const CTX = {};
const reduced = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e){ return false; } })();
const stacked = () => getComputedStyle(root).display === 'block';
const store = {get(k, d){ try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e){ return d; } }, set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch (e){} }};

function apply(s){
  if (!svg || !(s in ST)) return;
  const prev = cur, st = ST[s], ch = st.ch;
  cur = s;
  const sid = ch ? ch.id : 'intro';
  if (!prev || ST[prev].ch !== ch){
    hideTip();
    // 지금 장면만 SVG에 둔다: 숨은 장면의 움직임(SMIL · CSS)이 돌지 않게. 위젯은 떼어 둔 장면도 그대로 고칠 수 있다
    Object.keys(SC).forEach(id => {
      const sc = SC[id], on = id === sid;
      sc.g.classList.toggle('cur', on);
      if (!sc.ph) sc.ph = document.createComment('pl-scene ' + id);
      if (on && !sc.g.isConnected && sc.ph.isConnected) sc.ph.replaceWith(sc.g);
      else if (!on && sc.g.isConnected) sc.g.replaceWith(sc.ph);
    });
  }
  if (ch){
    const sc = SC[ch.id], k = st.k, step = ch.steps[k];
    sc.g.dataset.step = step.id;
    vis(ch, k);
    if (ch.onStep) try { ch.onStep(K, CTX[ch.id], step.id); } catch (e){ console.error(e); }
    setFocus(focusOf(ch, step));
  } else setFocus(null);
  hud();
  syncCards();
}
// 장면 요소의 보임 상태 (위젯이 다시 그린 요소도 포함하도록 매번 찾는다)
function vis(ch, k){
  const id = ch.steps[k].id;
  SC[ch.id].g.querySelectorAll('[data-on],[data-off],[data-st]').forEach(el => {
    let v = true;
    const a = el.getAttribute('data-on'), b = el.getAttribute('data-off'), sts = el.getAttribute('data-st');
    if (a != null && k < ch._idx[a]) v = false;
    if (b != null && k >= ch._idx[b]) v = false;
    if (sts != null && !sts.split(' ').includes(id)) v = false;
    el.classList.toggle('off', !v);
  });
}
function hud(){
  const st = ST[cur], ch = st.ch, head = stage.querySelector('.pl-head');
  head.querySelector('.no').textContent = ch ? ch.no : '00';
  head.querySelector('.nm').textContent = ch ? ch.title : '전해도금 — 쉽게, 그러나 깊게';
  head.querySelector('.tl2').textContent = ch ? `${ch.part}부 ${PARTS[ch.part]} · ${ch.scale}` : `13장 · 3부`;
  head.querySelector('.sb').textContent = ch ? `${st.k + 1}/${ch.steps.length} ${ch.steps[st.k].t}` : '아래 차례 타일이나 칩을 누르거나 스크롤하세요';
  const ci = ch ? CHS.indexOf(ch) : -1;
  stage.querySelectorAll('.pl-line button').forEach(b => { const k = +b.dataset.k; b.classList.toggle('on', k === ci); b.classList.toggle('past', k < ci); });
  stage.querySelector('.pl-line .bar i').style.width = (100 * ORDER.indexOf(cur) / (ORDER.length - 1)) + '%';
  // 칩 줄이 옆으로 넘치면(좁은 화면) 지금 장 칩을 가운데로
  const row = stage.querySelector('.pl-line .chipsr'), onb = row && row.querySelector('button.on');
  if (onb && row.scrollWidth > row.clientWidth + 2){ const rr = row.getBoundingClientRect(), br = onb.getBoundingClientRect(); row.scrollLeft += (br.left + br.width / 2) - (rr.left + rr.width / 2); }
}
function syncCards(){
  const st = ST[cur];
  blocks.forEach(b => {
    if (b.note || !b.ch) return;
    const k = st.ch === b.ch ? st.k : (CHS.indexOf(b.ch) < CHS.indexOf(st.ch) ? b.n : -1);
    b.card.querySelectorAll('.steps li').forEach((li, j) => { const act = st.ch === b.ch; li.classList.toggle('on', act && j === k); li.classList.toggle('open', act ? j === k : j === 0); li.classList.toggle('done', j < k); });
  });
  pinCards();
}
// 단계 카드 블록의 높이: 카드가 화면에 붙어 있는 구간에서 단계마다 0.36 화면씩 + 카드를 다 펼친 높이 + 카드 아래 여백 + 여유
const SLACK = 0.1;
function sizeWraps(){
  if (pres) return;                                   // 발표 모드에서는 카드가 숨어 있어 잴 수 없다
  const vh = VIEW.clientHeight;
  blocks.forEach(b => {
    if (b.n < 2) return;
    b.card.classList.add('pl-all');
    b.hMax = b.card.offsetHeight;
    b.card.classList.remove('pl-all');
    b.mb = parseFloat(getComputedStyle(b.card).marginBottom) || 0;
    // 붙기 시작하는 높이 t0: 보통 화면 위 11 %, 머리가 긴 카드는 1단계 글이 화면 안에 다 들어오는 높이까지 올라간 뒤
    const lis = [...b.card.querySelectorAll('.steps li')];
    b.t0 = vh * 0.11;
    if (lis.length){
      const saved = lis.map(li => li.className);
      lis.forEach((li, j) => li.classList.toggle('open', j === 0));
      b.t0 = Math.min(b.t0, vh - 20 - (lis[0].getBoundingClientRect().bottom - b.card.getBoundingClientRect().top));
      lis.forEach((li, j) => { li.className = saved[j]; });
    }
    b.el.style.minHeight = Math.round(b.hMax + b.mb + Math.max(vh * b.n * 0.36, b.hMax - vh * 0.89 + 34) + vh * (SLACK + 0.11) - b.t0) + 'px';
  });
}
// 따라 붙는 카드의 위치: 붙어 있는 동안 진행에 맞춰 천천히 올라가(긴 카드는 아래쪽 위젯까지 보이게) 지금 단계 글은 늘 화면 안에 둔다
function pinCards(){
  if (pres || !blocks.length) return;
  const vh = VIEW.clientHeight, st = stacked();
  const tops = blocks.map(b => {
    if (b.n < 2 || st) return null;
    const c = b.card.offsetHeight, r = stuckR(b), p = r ? clamp((VIEW.scrollTop - r.s0) / r.len) : 0;
    const t0 = b.t0 == null ? vh * 0.11 : b.t0;
    let t = lerp(t0, Math.min(t0, vh - c - 14), p);
    const li = b.card.querySelector('.steps li.on');
    if (li){
      const o = li.getBoundingClientRect().top - b.card.getBoundingClientRect().top;
      t = Math.max(Math.min(t, vh - 20 - o - li.offsetHeight), 8 - o);
    }
    return Math.round(Math.min(t, vh * 0.11));
  });
  blocks.forEach((b, i) => {
    if (b.n < 2) return;
    if (tops[i] == null){ b.pinTop = null; b.card.style.top = ''; return; }
    b.pinTo = tops[i];
    if (b.pinTop == null || reduced || Math.abs(b.pinTo - b.pinTop) <= 24){ b.pinTop = b.pinTo; b.card.style.top = b.pinTo + 'px'; return; }
    if (b.pinAnim) return;                                   // 한 번에 크게 바뀌면(단계 글 길이 차이) 0.2초쯤에 걸쳐 따라간다
    const step = () => {
      b.pinTop += (b.pinTo - b.pinTop) * 0.3;
      if (Math.abs(b.pinTo - b.pinTop) < 1) b.pinTop = b.pinTo;
      b.card.style.top = Math.round(b.pinTop) + 'px';
      b.pinAnim = b.pinTop !== b.pinTo ? requestAnimationFrame(step) : null;
    };
    b.pinAnim = requestAnimationFrame(step);
  });
}

// 보기 영역 (단계마다 확대할 수 있다)
const FULL = {x: 14, y: 90, w: 1572, h: 1040};                 // 장면 영역: x 20~1580, y 100~1120
let fcur = Object.assign({}, FULL), fto = FULL, fanim = null;
function fitView(){
  const r = stage.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const st = stacked();
  const ins = pres ? (st ? {l: 6, t: 112, r: 6, b: 70} : {l: 20, t: 124, r: 20, b: 176}) : st ? {l: 4, t: 56, r: 4, b: 84} : {l: 10, t: 74, r: 10, b: 70};
  // 위쪽 제목(· 넓은 화면의 도구 · 발표 모드의 칩 줄), 아래쪽 칩 줄 · 좁은 화면의 도구 · 발표 자막이 실제로 차지한 만큼 비운다
  const q = sel => stage.querySelector(sel);
  ['.pl-head'].concat(st ? [] : ['.jz-tools']).concat(pres ? ['.pl-line'] : []).map(q).filter(Boolean)
    .forEach(e => { if (e.offsetHeight) ins.t = Math.max(ins.t, e.offsetTop + e.offsetHeight + 8); });
  (pres ? ['.jz-cap'] : ['.pl-line'].concat(st ? ['.jz-tools'] : [])).map(q).filter(Boolean)
    .forEach(e => { if (e.offsetHeight) ins.b = Math.max(ins.b, r.height - e.offsetTop + 8); });
  const f = fcur, sw = Math.max(80, r.width - ins.l - ins.r), sh = Math.max(80, r.height - ins.t - ins.b);
  const k = Math.min(sw / f.w, sh / f.h);
  const ox = ins.l + (sw - f.w * k) / 2 - f.x * k, oy = ins.t + (sh - f.h * k) / 2 - f.y * k;
  VB = {k, ox, oy};
  svg.setAttribute('viewBox', `${q1(-ox / k)} ${q1(-oy / k)} ${q1(r.width / k)} ${q1(r.height / k)}`);
  // 확대 상자 밖 자르기 (viewN 일 때만)
  const cr = svg.querySelector('#pl-fclip rect'), cg = cur && SC[ST[cur].ch ? ST[cur].ch.id : 'intro'];
  Object.keys(SC).forEach(id => { if (!cg || SC[id] !== cg || !fto.clip) SC[id].g.removeAttribute('clip-path'); });
  if (cr && cg && fto.clip){
    cr.setAttribute('x', q1(f.x)); cr.setAttribute('y', q1(f.y)); cr.setAttribute('width', q1(f.w)); cr.setAttribute('height', q1(f.h));
    cg.g.setAttribute('clip-path', 'url(#pl-fclip)');
  }
}
// 단계의 확대 영역. 세로로 긴 무대(좁은 화면)에서는 장 파일이 따로 준 viewN 을 먼저 쓴다
function focusOf(ch, step){
  const vn = stacked() && stage.clientWidth / Math.max(1, stage.clientHeight) < 1.15 && (step.viewN || ch.viewN);
  if (vn){ vn.clip = true; return vn; }       // 좁은 화면 전용 확대: 상자 밖은 잘라 HUD 밑으로 글이 깔리지 않게
  return step.view || ch.view || null;
}
function setFocus(v){
  const to = v || FULL;
  if (to === fto) return;
  fto = to;
  if (fanim) cancelAnimationFrame(fanim);
  const from = Object.assign({}, fcur), t0 = performance.now();
  const f = now => {
    const t = reduced ? 1 : clamp((now - t0) / 700), e = t * t * (3 - 2 * t);
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
  root = h('div', 'jz pl');
  stage = h('div', 'jz-stage');
  svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'jz-svg pl-svg');
  svg.setAttribute('viewBox', `0 0 ${W0} ${H0}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  let scenes = `<g class="pl-scene" data-ch="intro">${drawCover()}</g>`;
  CHS.forEach(ch => {
    let inner = '';
    try { inner = ch.draw(K); } catch (e){ console.error(e); inner = T(800, 500, `${ch.no} 장면을 그리지 못했습니다`, 't-warn'); }
    scenes += `<g class="pl-scene" data-ch="${esc(ch.id)}">${inner}</g>`;
  });
  svg.innerHTML = `<defs>
    <clipPath id="pl-fclip"><rect x="0" y="0" width="${W0}" height="${H0}"/></clipPath>
    <filter id="pl-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="pl-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="pl-hi" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="4" result="d"/><feFlood flood-color="#fbbf24"/><feComposite in2="d" operator="in" result="o"/><feGaussianBlur in="o" stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    ${[['pl-arr', '#7dd3fc'], ['pl-arr-a', '#f59e0b'], ['pl-arr-g', '#4ade80'], ['pl-arr-r', '#f87171'], ['pl-arr-p', '#a78bfa']].map(([id, c]) => `<marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerUnits="userSpaceOnUse" markerWidth="17" markerHeight="17" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="${c}"/></marker>`).join('')}
    <linearGradient id="pl-g-bath" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0ea5e9" stop-opacity=".22"/><stop offset="1" stop-color="#0369a1" stop-opacity=".30"/></linearGradient>
    <linearGradient id="pl-g-dl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f59e0b" stop-opacity=".30"/><stop offset="1" stop-color="#f59e0b" stop-opacity=".02"/></linearGradient>
    <radialGradient id="pl-g-sn" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#cbd5e1"/><stop offset="1" stop-color="#7c8aa0"/></radialGradient>
  </defs>${scenes}`;
  svg.querySelectorAll('.pl-scene').forEach(g => {
    SC[g.dataset.ch] = {g};
  });
  stage.appendChild(svg);
  // 장 파일이 따로 둔 스타일 (ch.css)
  const css = CHS.map(c => c.css || '').filter(Boolean).join('\n');
  if (css && !document.getElementById('pl-chcss')){ const st = document.createElement('style'); st.id = 'pl-chcss'; st.textContent = css; document.head.appendChild(st); }
  const hudEl = h('div', 'jz-hud', `
    <div class="pl-head"><div class="no"></div><div class="tx"><div class="nm"></div><div class="tl2"></div><div class="sb"></div></div></div>
    <div class="jz-tools"><button data-act="deep" aria-pressed="false" title="카드의 「한 걸음 더(전문)」를 모두 펼치기"><span class="tl">📖 깊게 보기</span><span class="ts">깊게</span></button><button data-act="auto" title="한 단계씩 자동으로 넘기기"><span class="tl">⏵ 자동 재생</span><span class="ts">⏵ 자동</span></button><button class="pres" data-act="pres" title="전체 화면, ← → 키로 넘기기"><span class="tl">▶ 발표 모드</span><span class="ts">▶ 발표</span></button></div>
    <div class="pl-line"><div class="bar"><i></i></div><div class="chipsr"></div></div>
    <div class="jz-tip" role="tooltip"></div>
    <div class="jz-cap"><div class="k"></div><div class="t"></div><div class="d"></div></div>
    <div class="jz-pres"><span class="cnt"></span><button data-act="auto2">⏵ 자동</button><button data-act="prev">◀ 이전</button><button data-act="next">다음 ▶</button><button data-act="exit">✕ 닫기</button></div>`);
  stage.appendChild(hudEl);
  const line = hudEl.querySelector('.pl-line .chipsr');
  let lastPart = 0;
  CHS.forEach((ch, k) => {
    if (ch.part !== lastPart){ lastPart = ch.part; line.appendChild(h('span', 'pt', `${ch.part}부 ${PARTS[ch.part]}`)); }
    const b = h('button', null, `<b>${esc(ch.no)}</b><span class="cs"> ${esc(ch.short)}</span>`); b.dataset.k = k; b.title = ch.title;
    b.addEventListener('click', () => gotoChapter(ch.id)); line.appendChild(b);
  });
  hudEl.querySelector('[data-act=pres]').addEventListener('click', enterPres);
  hudEl.querySelector('[data-act=deep]').addEventListener('click', () => setDeep(!root.classList.contains('deep')));
  hudEl.querySelector('[data-act=auto]').addEventListener('click', () => { if (pres && auto) return toggleAuto(false); if (!pres) enterPres(); toggleAuto(true); });
  hudEl.querySelector('[data-act=auto2]').addEventListener('click', () => toggleAuto());
  hudEl.querySelector('[data-act=prev]').addEventListener('click', () => presGo(pres.k - 1));
  hudEl.querySelector('[data-act=next]').addEventListener('click', () => presGo(pres.k + 1));
  hudEl.querySelector('[data-act=exit]').addEventListener('click', () => exitPres());
  // 툴팁: 마우스는 올리면, 터치는 누르면
  tipEl = hudEl.querySelector('.jz-tip');
  svg.addEventListener('pointermove', ev => { if (ev.pointerType === 'mouse') showTip(ev); });
  svg.addEventListener('pointerdown', ev => { if (ev.pointerType !== 'mouse') showTip(ev); });
  svg.addEventListener('pointerleave', ev => { if (ev.pointerType === 'mouse') hideTip(); });
  root.appendChild(stage);
  root.appendChild(h('div', 'jz-cards'));
  VIEW.appendChild(root);
  buildCards();
  // 장으로 가는 링크: 무대(차례 타일)와 카드의 [data-go="장id"] 또는 "장id.단계id"
  root.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const a = ev.target.closest && ev.target.closest('.pl-go[data-go]');
    if (!a) return;
    ev.preventDefault(); ev.stopPropagation();
    gotoChapter(a.getAttribute('data-go'));
    if (!a.isConnected) try { VIEW.focus({preventScroll: true}); } catch (e){}   // 차례 장면이 떼어지면 초점을 보기 영역으로
  });
  root.addEventListener('click', ev => {
    const a = ev.target.closest && ev.target.closest('[data-go]');
    if (!a || !root.contains(a)) return;
    ev.preventDefault();
    const [cid, sid] = a.getAttribute('data-go').split('.');
    gotoChapter(cid, sid);
  });
  VIEW.addEventListener('scroll', onScroll, {passive: true});
  ['wheel', 'touchstart', 'mousedown'].forEach(t => VIEW.addEventListener(t, ev => { if (ev.type !== 'wheel' && ev.target.closest && ev.target.closest('.jz-tools,.jz-pres')) return; cancelScrollAnim(); }, {passive: true}));
  VIEW.addEventListener('keydown', ev => { if (['PageUp', 'PageDown', 'Home', 'End', ' ', 'ArrowUp', 'ArrowDown'].includes(ev.key)) cancelScrollAnim(); });
  window.addEventListener('resize', relayout);
  if (window.ResizeObserver){
    new ResizeObserver(() => {
      if (!VIEW.classList.contains('active') || pres) return;
      if (blocks.some(b => b.n > 1 && b.hMax && b.card.offsetHeight > b.hMax)) sizeWraps();   // 위젯 글이 길어져 카드가 잰 높이를 넘으면 다시 잰다
      measure(); onScroll();
    }).observe(root.querySelector('.jz-cards'));
    new ResizeObserver(() => fitView()).observe(stage);
  }
  document.addEventListener('keydown', onKey);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && pres) exitPres(true); });
  setDeep(!!store.get('engr-edu.plating.deep', false));
  fitView();
  apply('intro');
  if (reduced) try { svg.pauseAnimations(); svg.setCurrentTime(5.5); } catch (e){}   // 움직임 줄이기: 이온 · 거품도 멈춘다 (결정이 다 자란 뒤의 한 장면)
}

function chapterCard(ch){
  const n = CHS.indexOf(ch) + 1;
  const steps = `<ol class="steps">${ch.steps.map((s, k) => `<li data-k="${k}"><span class="n">${k + 1}</span><span><b>${esc(s.t)}</b><em>${s.d}</em></span></li>`).join('')}</ol>`;
  let body = '';
  try { body = ch.body ? ch.body(K) : ''; } catch (e){ console.error(e); }
  return `<div class="kick">${ch.part}부 ${PARTS[ch.part]} · ${esc(ch.no)} / ${NCH} · ${esc(ch.scale)}</div><h3>${esc(ch.title)}</h3>
    <p class="pl-one">${ch.one}</p>${ch.ana ? ana(ch.ana) : ''}${steps}${body}`;
}
function noteCard(ch){
  let html = '';
  try { html = ch.notes ? ch.notes(K) : ''; } catch (e){ console.error(e); }
  return html ? `<div class="kick">${esc(ch.no)} 노트 · ${esc(ch.short)}</div>${html}` : '';
}
function buildCards(){
  const col = root.querySelector('.jz-cards');
  col.innerHTML = '';
  blocks = [];
  const add = (html, states, cls, extra) => {
    const wrap = h('div', 'jcw'), card = h('div', 'jc' + (cls ? ' ' + cls : ''), html);
    if (states.length > 1){ wrap.classList.add('multi'); wrap.style.minHeight = (states.length * 36 + 44) + 'vh'; }
    wrap.appendChild(card); col.appendChild(wrap);
    const b = Object.assign({el: wrap, card, states, n: states.length}, extra || {});
    blocks.push(b);
    card.querySelectorAll('.steps li').forEach(li => {
      li.tabIndex = 0; li.setAttribute('role', 'button');
      li.addEventListener('click', () => gotoSub(b, +li.dataset.k));
      li.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' '){ ev.preventDefault(); ev.stopPropagation(); gotoSub(b, +li.dataset.k); } });
    });
    return card;
  };
  add(`<div class="kick">전해도금 · 13장</div><div class="big">전기로 금속을 쌓는다</div><h3>원리부터 현장까지, 쉽게 — 그러나 깊게</h3>
    <p>도금은 <b>전자를 건네 금속 이온을 금속 원자로 바꾸는 일</b>입니다. 이 탭은 그 한 문장에서 출발해, 왜 가장자리가 두꺼운지, 왜 Ag 함량이 흔들리는지, 이 불량은 어디서 왔는지를 스스로 추론할 수 있게 13장으로 나눠 설명합니다.</p>
    <ul class="jl"><li><b>1부 원리</b> — 도금조, 패러데이 법칙, 이온이 오는 길, 과전압</li><li><b>2부 모양과 품질</b> — 첨가제, 막의 속, 웨이퍼 분포, 패턴 효과</li><li><b>3부 현장</b> — 장비 해부, Cu · Ni · SnAg 도금액, 도금액 관리, 불량 도감, 인자 지도</li></ul>
    <ul class="jl"><li>스크롤 · ← → 키로 한 단계씩, 아래 칩이나 차례 타일로 바로 이동</li><li>카드의 <b>직접 해 보기</b>를 움직이면 장면이 바뀝니다</li><li><b>📖 깊게 보기</b> — 「한 걸음 더(전문)」를 모두 펼침 · <b>▶ 발표 모드</b> · <b>⏵ 자동 재생</b></li><li>장면의 이온 · 부품 · 층에 마우스를 올리거나 누르면 이름과 역할</li></ul>
    <p class="hint">수치는 교과서 · 공개 문헌 수준의 예시이고, 계산은 경향을 보여 주는 개념 모델입니다 (사내 공정 조건 아님). 범프를 만드는 전체 순서는 <a href="#go-bump">범프 공정</a> 탭, 공식과 계산기는 <a href="#go-edu-3">03 공학의 기초 7절</a>.</p>`, ['intro'], 'intro');
  CHS.forEach(ch => {
    const card = add(chapterCard(ch), ch.steps.map(s => key(ch, s.id)), 'pl-card', {ch});
    const nh = noteCard(ch);
    const ncard = nh ? add(nh, [key(ch, ch.steps[ch.steps.length - 1].id)], 'pl-note', {ch, note: true}) : null;
    const scene = SC[ch.id].g;
    const ctx = CTX[ch.id] = {
      ch, card, note: ncard, scene, svg, root,
      $: sel => scene.querySelector(sel), $$: sel => [...scene.querySelectorAll(sel)],
      q: sel => card.querySelector(sel) || (ncard && ncard.querySelector(sel)),
      step: () => (ST[cur] && ST[cur].ch === ch) ? ch.steps[ST[cur].k].id : null,
      go: sid => goState(key(ch, sid)),
      range(id, fn){
        const inp = card.querySelector(`input[data-i="${id}"]`), out = card.querySelector(`output[data-o="${id}"]`);
        if (!inp) return () => 0;
        const upd = () => { const r = fn(+inp.value); if (out && r != null) out.textContent = r; };
        inp.addEventListener('input', upd); upd();
        return () => +inp.value;
      },
      seg(id, fn){
        const g = card.querySelector(`.pl-seg[data-g="${id}"]`) || (ncard && ncard.querySelector(`.pl-seg[data-g="${id}"]`));
        if (!g) return () => null;
        let v = (g.querySelector('[aria-pressed="true"]') || g.querySelector('button')).dataset.v;
        g.addEventListener('click', ev => {
          const b = ev.target.closest('button'); if (!b) return;
          v = b.dataset.v;
          g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
          fn(v, true);
        });
        fn(v, false);
        return () => v;
      },
      out(id, text){ card.querySelectorAll(`[data-o="${id}"]`).forEach(o => { o.textContent = text; }); },
      refresh(){ const st = ST[cur]; if (st && st.ch === ch) vis(ch, st.k); }       // 장면을 다시 그린 뒤 보임 상태 맞추기
    };
    if (ch.mount) try { ch.mount(K, ctx); } catch (e){ console.error(e); }
  });
  col.querySelectorAll('[data-act=top]').forEach(b => b.addEventListener('click', () => scrollViewTo(0, false)));
  col.querySelectorAll('[data-act=pres]').forEach(b => b.addEventListener('click', enterPres));
  beats = [];
  blocks.forEach(b => { if (!b.note) b.states.forEach((s, k) => beats.push({b, sub: k, s})); });
  sizeWraps();
  measure();
}
function setDeep(v){
  // 카드 길이가 크게 바뀌므로 지금 보던 단계를 기억했다가 같은 자리로 돌아온다
  const keep = built && cur && !pres && blocks.length ? (scrollAnim && navTo ? navTo : (measure(), resolvePos())) : null;   // 처음 만들 때는 지킬 자리가 없다
  root.classList.toggle('deep', v);
  root.querySelectorAll('details.pl-deep').forEach(d => { d.open = v; });
  const b = stage.querySelector('[data-act=deep]');
  if (b) b.setAttribute('aria-pressed', v ? 'true' : 'false');
  store.set('engr-edu.plating.deep', v);
  if (built) requestAnimationFrame(() => {
    sizeWraps(); pinCards(); measure();
    if (keep){ cancelScrollAnim(); VIEW.scrollTop = beatPos(keep.b, keep.sub); }
    onScroll();
  });
}
function measure(){
  const vr = VIEW.getBoundingClientRect();
  blocks.forEach(b => { const r = b.el.getBoundingClientRect(); b.top = r.top - vr.top + VIEW.scrollTop; b.h = r.height; });
}
function anchorOffset(){
  if (stacked()){ const sh = stage.offsetHeight; return sh + (VIEW.clientHeight - sh) * 0.2; }
  return VIEW.clientHeight * 0.5;
}
// 데스크톱: 카드가 실제로 붙어 있는 스크롤 구간 [s0, s0 + len] 을 단계 수로 고르게 나눈다 (다 펼친 높이 기준이라 단계가 바뀌어도 구간이 그대로)
function stuckR(b){
  if (b.n < 2 || !b.hMax || stacked()) return null;
  const vh = VIEW.clientHeight, t0 = b.t0 == null ? vh * 0.11 : b.t0;
  const len = b.h - b.hMax - (b.mb || 0) - vh * (SLACK + 0.11) + t0;
  return len > 40 ? {s0: b.top - t0, len} : null;
}
// 좁은 화면(카드가 장면 아래로 흐른다): 장면 아래 보이는 영역의 45 % 줄을 넘은 마지막 단계가 지금 단계
function liLine(){ const sh = stage.offsetHeight; return sh + (VIEW.clientHeight - sh) * 0.45; }
function liSub(b){
  const line = VIEW.getBoundingClientRect().top + liLine();
  let sub = 0;
  b.card.querySelectorAll('.steps li').forEach((li, j) => { if (j < b.n && li.getBoundingClientRect().top <= line) sub = j; });
  return sub;
}
// 블록 b 에서 frac(0~1) 자리의 스크롤 위치. 좁은 화면에서는 sub 단계 글이 기준 줄에 오는 자리, 한 칸짜리 카드는 카드 머리가 보이는 자리
function posFor(b, frac, sub){
  if (b.n < 2) return Math.max(0, b.top - (stacked() ? stage.offsetHeight + 8 : VIEW.clientHeight * 0.08));
  if (stacked()){
    const li = b.card.querySelectorAll('.steps li')[sub == null ? Math.min(b.n - 1, Math.floor(clamp(frac) * b.n)) : sub];
    if (li) return VIEW.scrollTop + li.getBoundingClientRect().top - VIEW.getBoundingClientRect().top - liLine() + 2;
  }
  const r = stuckR(b);
  return r ? r.s0 + frac * r.len : b.top + frac * b.h - anchorOffset();
}
const beatPos = (b, sub) => Math.max(0, posFor(b, (sub + 0.5) / b.n, sub));
// sub 단계로 인정되는 스크롤 구간 (위젯이 단계를 바꿀 때 가장 짧게 옮기려고)
function subRange(b, sub){
  if (b.n < 2){ const q = posFor(b, 0); return [q, q]; }
  if (stacked()){ const lo = posFor(b, 0, sub); return [lo, sub + 1 < b.n ? posFor(b, 0, sub + 1) - 4 : lo + VIEW.clientHeight * 0.3]; }
  return [posFor(b, sub / b.n) + 2, posFor(b, (sub + 1) / b.n) - 2];
}
function resolvePos(){
  const a = VIEW.scrollTop + anchorOffset();
  let b = blocks.find(x => a >= x.top && a < x.top + x.h);
  if (!b){ let best = Infinity; for (const x of blocks){ const d = a < x.top ? x.top - a : a - (x.top + x.h); if (d < best){ best = d; b = x; } } }
  let sub = 0;
  if (b.n > 1){
    if (stacked()) sub = liSub(b);
    else { const r = stuckR(b), f = r ? (VIEW.scrollTop - r.s0) / r.len : (a - b.top) / b.h; sub = Math.min(b.n - 1, Math.floor(clamp(f) * b.n)); }
  }
  return {b, sub};
}
let ticking = false, activeCard = null;
let lastTop = -1;
function onScroll(){
  if (!VIEW.classList.contains('active') || !VIEW.clientHeight) return;   // 다른 탭에 있는 동안(보이지 않음)은 자리를 셈하지 않는다
  if (VIEW.scrollTop !== lastTop){ lastTop = VIEW.scrollTop; hideTip(); }
  if (ticking || pres || scrollAnim) return;          // 코드가 스크롤을 옮기는 중에는 지나가는 단계를 켜지 않는다 (목표 단계는 이미 켜 둠)
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    if (pres || scrollAnim) return;
    const {b, sub} = resolvePos();
    if (activeCard !== b){ if (activeCard) activeCard.card.classList.remove('active'); activeCard = b; b.card.classList.add('active'); }
    if (b.states[sub] !== cur) apply(b.states[sub]); else pinCards();
  });
}
let scrollAnim = null, restoreTok = 0, navTo = null;   // navTo: 코드가 옮겨 가는 중인 목표 (그동안 ← → 는 여기서부터 센다)
function cancelScrollAnim(){ restoreTok++; if (scrollAnim){ cancelAnimationFrame(scrollAnim); scrollAnim = null; onScroll(); } }   // 멈춘 자리에 맞춘다
function scrollViewTo(top, animate){
  cancelScrollAnim();
  top = clamp(top, 0, Math.max(0, VIEW.scrollHeight - VIEW.clientHeight));
  const from = VIEW.scrollTop, dist = top - from;
  if (!animate || reduced || Math.abs(dist) < 4){ VIEW.scrollTop = top; return; }
  const dur = clamp(Math.abs(dist) / Math.max(1, VIEW.clientHeight) * 300, 350, 1400), t0 = performance.now();
  const step = now => { const t = clamp((now - t0) / dur); VIEW.scrollTop = from + dist * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); scrollAnim = t < 1 ? requestAnimationFrame(step) : null; pinCards(); if (t >= 1){ navTo = null; onScroll(); } };
  scrollAnim = requestAnimationFrame(step);
}
// 블록 b 의 sub 단계로: 그 단계를 바로 보여 주고, 스크롤은 뒤따라간다
function gotoSub(b, sub){
  const st = b.states[sub];
  if (st !== cur) apply(st);
  measure();
  scrollViewTo(beatPos(b, sub), true);
  if (scrollAnim) navTo = {b, sub};
}
// ← → : 노트 카드까지 포함해 한 칸씩
function navStep(d){
  const seq = [];
  blocks.forEach(b => { for (let j = 0; j < b.n; j++) seq.push({b, sub: j}); });
  const now = scrollAnim && navTo ? navTo : resolvePos();
  const i = Math.max(0, seq.findIndex(x => x.b === now.b && x.sub === now.sub));
  const t = seq[clamp(i + d, 0, seq.length - 1)];
  gotoSub(t.b, t.sub);
}
function gotoBeat(k){
  k = clamp(k, 0, beats.length - 1);
  if (pres) return presGo(k);
  const bt = beats[k];
  gotoSub(bt.b, bt.sub);
}
function gotoChapter(cid, sid){
  const ch = BYID[cid]; if (!ch) return;
  const s = key(ch, sid && sid in ch._idx ? sid : ch.steps[0].id);
  const k = beats.findIndex(x => x.s === s);
  if (k >= 0) gotoBeat(k);
}
// 위젯이 그 장의 특정 단계를 보여 줄 때: 바로 그 단계로 바꾸고, 스크롤도 그 단계 자리로 옮겨 둘이 어긋나지 않게
function goState(s){
  if (!(s in ST) || s === cur) return;
  const k = beats.findIndex(x => x.s === s);
  if (pres){ if (k >= 0){ pres.k = k; presApply(); } return; }
  apply(s);
  if (k < 0) return;
  // 그 단계 구간 안으로 가장 짧게 옮긴다 (위젯을 쥐고 있는 손 아래에서 카드가 크게 움직이지 않게)
  const bt = beats[k]; measure();
  const [lo, hi] = subRange(bt.b, bt.sub);
  const m = Math.max(0, hi - lo) * 0.25;
  scrollViewTo(clamp(VIEW.scrollTop, lo + m, Math.max(lo + m, hi - m)), true);
  if (scrollAnim) navTo = {b: bt.b, sub: bt.sub};
}
function curBeat(){
  if (pres) return pres.k;
  const {b, sub} = scrollAnim && navTo ? navTo : resolvePos();
  const k = beats.findIndex(x => x.b === b && x.sub === sub);
  if (k >= 0) return k;
  return Math.max(0, beats.findIndex(x => x.s === b.states[sub]));
}

/* ---- 발표 모드 ---- */
function enterPres(){
  if (pres) return;
  pres = {k: curBeat()};
  root.classList.add('pres');
  const nx = stage.querySelector('.jz-pres [data-act=next]');
  if (nx) try { nx.focus({preventScroll: true}); } catch (e){}
  try { if (root.requestFullscreen) root.requestFullscreen().catch(() => {}); } catch (e){}
  presApply();
}
function exitPres(fromFs){
  if (!pres) return;
  const bt = beats[pres.k];
  toggleAuto(false);
  pres = null;
  root.classList.remove('pres');
  try { VIEW.focus({preventScroll: true}); } catch (e){}   // 닫은 뒤에도 ↑ ↓ · PageDown 이 스크롤에 먹도록
  if (!bt) return;
  // 전체 화면이 다 풀린 뒤에 제자리로 (풀리는 중에는 스크롤 영역 높이가 0이라 맨 위로 잘린다)
  if (!fromFs && document.fullscreenElement){
    let p = null;
    try { p = document.exitFullscreen(); } catch (e){}
    if (p && p.then) p.then(() => restoreBeat(bt), () => restoreBeat(bt)); else restoreBeat(bt);
  } else restoreBeat(bt);
}
function restoreBeat(bt){
  // 몇 프레임 동안 자리가 그대로인지 확인한다 (전체 화면이 풀린 뒤 늦게 오는 배치 변경에도 제자리). 사용자가 스크롤하면 그만둔다
  const tok = ++restoreTok;
  let n = 0, same = 0;
  const tick = () => {
    if (pres || tok !== restoreTok) return;
    if (!n){ sizeWraps(); if (document.activeElement === document.body) try { VIEW.focus({preventScroll: true}); } catch (e){} }
    fitView(); measure();
    const top = beatPos(bt.b, bt.sub);
    if (Math.abs(VIEW.scrollTop - top) > 2){ VIEW.scrollTop = top; same = 0; } else same++;
    if (bt.s !== cur) apply(bt.s); else pinCards();
    if (same < 6 && ++n < 90) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function presApply(){
  const bt = beats[pres.k];
  apply(bt.s);
  const st = ST[bt.s], ch = st.ch, cap = stage.querySelector('.jz-cap');
  if (ch){
    const s = ch.steps[st.k];
    cap.querySelector('.k').textContent = `${ch.part}부 ${PARTS[ch.part]} · ${ch.no} / ${NCH} · ${s.t ? `단계 ${st.k + 1}/${ch.steps.length}` : ''}`;
    cap.querySelector('.t').textContent = `${ch.short} — ${s.t}`;
    const tmp = h('div', null, s.d);
    let d = tmp.textContent;
    if (d.length > 200) d = d.slice(0, 198) + '…';
    cap.querySelector('.d').textContent = d;
  } else {
    cap.querySelector('.k').textContent = '전해도금 · 13장';
    cap.querySelector('.t').textContent = '전기로 금속을 한 층씩 — 원리부터 현장까지';
    cap.querySelector('.d').textContent = '1부 원리 → 2부 모양과 품질 → 3부 현장. ← → 키로 넘기고 Esc로 닫습니다.';
  }
  stage.querySelector('.jz-pres .cnt').textContent = `${pres.k + 1} / ${beats.length}`;
  fitView();
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
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName) && document.activeElement.type !== 'range';
  if (typing || ev.ctrlKey || ev.metaKey || ev.altKey || document.querySelector('#modal-back.open')) return;
  if (!pres){
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft'){
      if (document.activeElement && document.activeElement.type === 'range') return;   // 슬라이더는 ← → 로 값을 바꾼다
      ev.preventDefault(); navStep(ev.key === 'ArrowRight' ? 1 : -1);
    }
    return;
  }
  const ctrl = document.activeElement && root.contains(document.activeElement) && /^(BUTTON|A|INPUT|SUMMARY)$/.test(document.activeElement.tagName);
  if ((ev.key === ' ' || ev.key === 'Enter') && ctrl) return;   // 단추에 초점이 있으면 그 단추를 누른다
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
  if (svg && !reduced) try { svg.unpauseAnimations(); } catch (e){}
  requestAnimationFrame(relayout);
}
// 크기가 바뀌어도(창 크기 · 확대 · 탭 전환) 보던 단계 그대로
function relayout(){
  if (!built || !VIEW.classList.contains('active')) return;
  if (pres){ const sc = ST[cur]; if (sc) setFocus(sc.ch ? focusOf(sc.ch, sc.ch.steps[sc.k]) : null); fitView(); return; }
  let keep = scrollAnim && navTo ? navTo : null;
  if (!keep && activeCard && activeCard.note) keep = {b: activeCard, sub: 0};
  if (!keep){ const bt = beats.find(x => x.s === cur); if (bt) keep = {b: bt.b, sub: bt.sub}; }
  const sc = ST[cur];
  if (sc) setFocus(sc.ch ? focusOf(sc.ch, sc.ch.steps[sc.k]) : null);
  fitView(); pinCards(); sizeWraps(); measure();          // pinCards 먼저: 좁은 화면으로 바뀌면 데스크톱 top 값을 지운 뒤 잰다
  if (keep){ cancelScrollAnim(); VIEW.scrollTop = beatPos(keep.b, keep.sub); }
  pinCards(); onScroll();
}
document.addEventListener('engr:tab', ev => {
  if (ev.detail === 'plating') return activateTab();
  if (scrollAnim){ cancelAnimationFrame(scrollAnim); scrollAnim = null; navTo = null; }   // 옮겨 가던 중이면 목표 단계(cur)를 그대로 두고 멈춘다
  if (svg) try { svg.pauseAnimations(); } catch (e){}                                    // 다른 탭에서는 움직임을 멈춘다
});
if (VIEW.classList.contains('active')) activateTab();
window.EngrPlating = {
  get state(){ const st = ST[cur] || {}; return {state: cur, chapter: st.ch ? st.ch.id : 'intro', step: st.ch ? st.ch.steps[st.k].id : null, pres: pres ? pres.k : null, beats: beats.length, auto: !!auto, deep: !!(root && root.classList.contains('deep'))}; },
  chapters: CHS.map(c => ({id: c.id, no: c.no, part: c.part, title: c.title, steps: c.steps.map(s => s.id)})),
  apply: s => apply(s), gotoChapter: (c, s) => gotoChapter(c, s), gotoBeat: k => gotoBeat(k), enterPres: () => enterPres(), exitPres: () => exitPres(),
  order: ORDER, blocks: () => blocks, ctx: id => CTX[id], kit: K,
  scenes: () => Object.keys(SC), pos: st => { const bt = beats.find(x => x.s === st); if (!bt) return null; measure(); return beatPos(bt.b, bt.sub); }
};
})();
