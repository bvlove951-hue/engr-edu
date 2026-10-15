/* ================================================================
 * engr-edu · 시드 식각 (탭 설정) — 장(章)은 src/etch/NN-*.js, 화면은 공용 엔진(src/theatre.js)
 * ================================================================ */
(function(){
'use strict';
if (!window.EngrTheatre) return;
window.EngrTheatre({
  key: 'etch', idp: 'et', name: '시드 식각',
  chapters: window.EngrEtchChapters,
  parts: {1: '원리', 2: '문제와 품질', 3: '현장'},
  headTitle: '시드 식각 — 쉽게, 그러나 깊게',
  cover: {title: '시드 식각', sub: '', panel: K => K.flow('etch', '범프 사이에 남은 얇은 시드 금속을 녹여 지운다')},
  intro: `<div class="kick">시드 식각</div><div class="big">시드 식각</div>`,
});
})();
