/* ================================================================
 * engr-edu · 리플로우 (탭 설정) — 장(章)은 src/reflow/NN-*.js, 화면은 공용 엔진(src/theatre.js)
 * ================================================================ */
(function(){
'use strict';
if (!window.EngrTheatre) return;
window.EngrTheatre({
  key: 'reflow', idp: 'rf', name: '리플로우',
  chapters: window.EngrReflowChapters,
  parts: {1: '원리', 2: '문제와 품질', 3: '현장'},
  headTitle: '리플로우 — 쉽게, 그러나 깊게',
  cover: {title: '리플로우', sub: '', panel: K => K.flow('reflow', '솔더 모자를 녹여 둥글게 — 산화막을 걷고 계면을 잇는다')},
  intro: `<div class="kick">리플로우</div><div class="big">리플로우</div>`,
});
})();
