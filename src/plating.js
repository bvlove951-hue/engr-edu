/* ================================================================
 * engr-edu · 전해도금 — 원리부터 현장까지 13장 (탭 설정)
 *  - 장(章)은 src/plating/NN-*.js 에 한 파일씩 있고 window.EngrPlatingChapters 에 정의를 넣는다.
 *  - 화면 · 스크롤 · 발표 모드는 공용 엔진(src/theatre.js, window.EngrTheatre)이 만든다.
 * ================================================================ */
(function(){
'use strict';
if (!window.EngrTheatre) return;
window.EngrPlating = window.EngrTheatre({
  key: 'plating', idp: 'pl', name: '전해도금',
  chapters: window.EngrPlatingChapters,
  parts: {1: '원리', 2: '모양과 품질', 3: '현장'},
  headTitle: '전해도금 — 쉽게, 그러나 깊게',
  cover: {
    title: '전해도금', sub: '전기로 금속을 한 층씩 — 원리부터 현장까지 13장',
    // 크기 사다리 (로그 눈금): 1 nm ~ 10 m
    panel(K, BYID){
      const {R, C, L, T, G} = K;
      const X0 = 840, X1 = 1550, Y = 222, lg = v => X0 + (Math.log10(v) + 9) / 10 * (X1 - X0);
      let s = R(806, 118, 772, 186, 'pl-box', {rx: 12}) + T(826, 152, '이 탭에서 오가는 크기 — 분자에서 장비까지 약 10억 배', 't-dim', 'start');
      s += L(X0, Y, X1, Y, 's-edge');
      [[1e-9, '1 nm'], [1e-6, '1 µm'], [1e-3, '1 mm'], [1, '1 m']].forEach(([v, t]) => { s += L(lg(v), Y - 8, lg(v), Y + 8, 's-edge') + T(lg(v), Y + 30, t, 't-dim'); });
      // [장id, 크기(m), 이름, 위(true) / 아래] — 가까운 표시끼리 위아래로 엇갈리게
      const marks = [['additive', 2e-9, '분자', true], ['grain', 2e-7, '결정', false], ['surface', 2e-5, '표면', true], ['defects', 6e-5, '범프 단면', false], ['pattern', 4e-3, '다이', true], ['cell', 0.08, '비커', true], ['wafer', 0.3, '웨이퍼', false], ['tool', 2.2, '장비', true]];
      marks.forEach(([id, v, t, up]) => {
        const ch = BYID[id]; if (!ch) return;
        const x = lg(v);
        s += G(C(x, Y, 7, 'k-acc') + L(x, Y + (up ? -9 : 9), x, Y + (up ? -26 : 26), 's-acc') + T(x, up ? Y - 32 : Y + 56, `${ch.no} ${t}`, 'pl-mk'), {class: 'pl-go', 'data-go': id, 'data-tip': `${ch.no} ${ch.title}`});
      });
      return s;
    },
  },
  intro: `<div class="kick">전해도금 · 13장</div><div class="big">전기로 금속을 쌓는다</div><h3>원리부터 현장까지, 쉽게 — 그러나 깊게</h3>
    <p>도금은 <b>전자를 건네 금속 이온을 금속 원자로 바꾸는 일</b>입니다. 이 탭은 그 한 문장에서 출발해, 왜 가장자리가 두꺼운지, 왜 Ag 함량이 흔들리는지, 이 불량은 어디서 왔는지를 스스로 추론할 수 있게 13장으로 나눠 설명합니다.</p>
    <p>앞면 범프는 다이마다 층이 다릅니다 — <b>베이스 다이</b>는 Cu 기둥 → Ni → 상부 Cu(Ni 위에 얇게 한 번 더 올린 Cu) → SnAg, <b>코어 다이</b>는 Ni → SnAg. 이 탭의 범프 그림은 베이스 다이 범프(Cu / Ni / Cu / SnAg)를 기준으로 하고, 코어 다이(Ni / SnAg)는 다른 점을 따로 짚습니다.</p>
    <ul class="jl"><li><b>1부 원리</b> — 도금조, 패러데이 법칙, 이온이 오는 길, 과전압</li><li><b>2부 모양과 품질</b> — 첨가제, 막의 속, 웨이퍼 분포, 패턴 효과</li><li><b>3부 현장</b> — 장비 해부, Cu · Ni · SnAg 도금액, 도금액 관리, 불량 도감, 인자 지도</li></ul>
    <ul class="jl"><li>스크롤 · ← → 키로 한 단계씩, 아래 칩이나 차례 타일로 바로 이동</li><li>카드의 <b>직접 해 보기</b>를 움직이면 장면이 바뀝니다</li><li><b>📖 깊게 보기</b> — 「한 걸음 더(전문)」를 모두 펼침 · <b>▶ 발표 모드</b> · <b>⏵ 자동 재생</b></li><li>장면의 이온 · 부품 · 층에 마우스를 올리거나 누르면 이름과 역할</li></ul>
    <p class="hint">수치는 교과서 · 공개 문헌 수준의 예시이고, 계산은 경향을 보여 주는 개념 모델입니다 (사내 공정 조건 아님). 범프를 만드는 전체 순서는 <a href="#go-bump">범프 공정</a> 탭, 도금 다음 공정은 <a href="#go-strip">PR 스트립</a> · <a href="#go-etch">시드 식각</a> · <a href="#go-reflow">리플로우</a> 탭, 공식과 계산기는 <a href="#go-edu-3">03 공학의 기초 7절</a>.</p>`,
  presIntro: {k: '전해도금 · 13장', t: '전기로 금속을 한 층씩 — 원리부터 현장까지', d: '1부 원리 → 2부 모양과 품질 → 3부 현장.'},
});
})();
