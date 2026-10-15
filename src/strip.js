/* ================================================================
 * engr-edu · PR 스트립 (탭 설정) — 장(章)은 src/strip/NN-*.js, 화면은 공용 엔진(src/theatre.js)
 * ================================================================ */
(function(){
'use strict';
if (!window.EngrTheatre) return;
window.EngrTheatre({
  key: 'strip', idp: 'st', name: 'PR 스트립',
  chapters: window.EngrStripChapters,
  parts: {1: '원리', 2: '문제와 품질', 3: '현장'},
  headTitle: 'PR 스트립 — 쉽게, 그러나 깊게',
  cover: {title: 'PR 스트립', sub: '', panel: K => K.flow('strip', '도금이 끝난 웨이퍼에서 PR 틀을 녹여 벗긴다')},
  intro: `<div class="kick">PR 스트립</div><div class="big">PR 스트립</div>`,
});
})();
