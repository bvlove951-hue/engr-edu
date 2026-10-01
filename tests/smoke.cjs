// 브라우저 스모크 테스트: node tests/smoke.cjs  (playwright 필요)
// 빌드 결과물(dist/engr-edu.html)을 실제 Chromium으로 열어 주요 기능을 확인한다.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const FILE = 'file://' + path.join(ROOT, 'dist', 'engr-edu.html');
const OUT = process.env.SHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'engr-edu-'));
let failed = 0;
const setRange = (loc, v) => loc.evaluate((el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const ok = (cond, msg) => { console.log((cond ? '  ✔ ' : '  ✘ ') + msg); if (!cond) failed++; };

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(FILE);
  await page.waitForFunction(() => window.EngrEdu && window.EngrEdu.state.maps.length > 0);

  console.log('교육과정');
  const toc = await page.$$eval('.toc-item', els => els.map(e => e.textContent));
  ok(toc.length === 8, `목차 8개 (${toc.length})`);
  let flowTotal = 0, figTotal = 0, brokenTotal = 0; const widgetNames = [];
  for (let i = 0; i < toc.length; i++) {
    await page.click(`.toc-item >> nth=${i}`);
    const n = await page.$$eval('.flowblock svg .node', els => els.length);
    const blocks = await page.$$eval('.flowblock', els => els.length);
    flowTotal += blocks;
    const tables = await page.$$eval('#edu-doc table', els => els.length);
    const figs = await page.$$eval('#edu-doc figure.fig svg', els => els.length);
    const widgets = await page.$$eval('#edu-doc .widget', els => els.map(e => e.dataset.widget));
    const broken = await page.$$eval('#edu-doc .hint', els => els.filter(e => /그림 없음|알 수 없는 도구|그리지 못했습니다/.test(e.textContent)).length);
    figTotal += figs; widgetNames.push(...widgets); brokenTotal += broken;
    console.log(`    ${toc[i]}: 그림 ${figs}개, 도구 ${widgets.length}개, 흐름도 ${blocks}개 (노드 ${n}), 표 ${tables}개`);
  }
  ok(flowTotal >= 10, `흐름도 렌더링 ${flowTotal}개`);
  ok(figTotal >= 46, `그림 렌더링 ${figTotal}개`);
  await page.click('.toc-item >> nth=1');
  const ex = await page.$$eval('#edu-doc blockquote.example', els => els.length);
  ok(ex === 10, `원칙 10개 모두 예시 상자 (${ex})`);
  await page.click('.toc-item >> nth=7');
  const links = await page.$$eval('#edu-doc a.ext', els => els.map(a => ({ href: a.href, t: a.target, k: a.dataset.kind })));
  ok(links.length >= 40 && links.every(l => l.t === '_blank' && /^https:/.test(l.href)), `참고 자료 링크 ${links.length}개, 모두 새 창·https`);
  ok(['video', 'paper', 'course', 'wiki', 'web'].every(k => links.some(l => l.k === k)), '링크 종류 표시 (영상·논문·강의·위키·글)');
  await page.screenshot({ path: path.join(OUT, '01c-refs.png') });
  ok(['cpk', 'control', 'cte', 'diffusion', 'faraday', 'yield'].every(w => widgetNames.includes(w)), '직접 해 보기 도구 6종: ' + widgetNames.join(', '));
  ok(brokenTotal === 0, '깨진 그림·도구 없음');

  console.log('직접 해 보기 도구');
  await page.click('.toc-item >> nth=3');
  const cpkBox = page.locator('.widget[data-widget="cpk"]');
  const cpkBefore = await cpkBox.locator('.w-tile .v').nth(1).textContent();
  await setRange(cpkBox.locator('input[type=range]').first(), '10.0');
  const cpkAfter = await cpkBox.locator('.w-tile .v').nth(1).textContent();
  ok(cpkBefore !== cpkAfter && cpkAfter === '1.33', `Cpk 슬라이더 반영 (${cpkBefore} → ${cpkAfter})`);
  const fdy = page.locator('.widget[data-widget="faraday"]');
  await setRange(fdy.locator('input[type=range]').nth(0), '1');
  await setRange(fdy.locator('input[type=range]').nth(1), '1');
  await setRange(fdy.locator('input[type=range]').nth(2), '100');
  const rate = await fdy.locator('.w-tile .v').nth(1).textContent();
  ok(/^0\.22\d µm\/분$/.test(rate), `Cu 1 ASD 도금 속도 ≈ 0.22 µm/분 (${rate})`);
  const ctl = page.locator('.widget[data-widget="control"]');
  await ctl.getByRole('button', { name: '평균 이동' }).click();
  ok(/✗/.test(await ctl.locator('.w-list').textContent()), '관리도: 평균 이동 시 규칙 위반 표시');
  await ctl.locator('.pt').nth(20).hover();
  ok(await ctl.locator('.w-tip').isVisible(), '관리도 점에 마우스 → 값 표시');
  await page.click('.toc-item >> nth=4');
  const yw = page.locator('.widget[data-widget="yield"]');
  await setRange(yw.locator('input[type=range]').nth(0), '99');
  await setRange(yw.locator('input[type=range]').nth(1), '12');
  ok((await yw.locator('.w-tile .v').first().textContent()) === '88.6%', '적층 수율 99%^12 = 88.6%');
  await page.click('.toc-item >> nth=1');
  await page.screenshot({ path: path.join(OUT, '01-edu.png') });

  console.log('흐름 문법 파서');
  const pf = await page.evaluate(() => {
    const src = `# 예
시작: 알람
1. 확인
2. ? 재측정 동일한가
  아니오 → 계측기 점검 → 끝
  예 → 3
3. 추세 확인
4. ? 추세 하락인가
  아니오 → 5
5. 단발 원인
  > 상세
  ! 주의
끝: 기록`;
    const r = window.EngrEdu.parseFlow(src);
    const t = id => r.nodes.find(n => n.id === id).title;
    return { title: r.title, n: r.nodes.length, types: r.nodes.map(n => n.type).join(','),
      edges: r.edges.map(e => `${t(e.from)}>${t(e.to)}:${e.label}`), d5: r.nodes.find(n => n.title === '단발 원인') };
  });
  ok(pf.title === '예', '제목 파싱');
  ok(pf.n === 8, `노드 8개 (${pf.n}: ${pf.types})`);
  ok(pf.edges.includes('계측기 점검>기록:'), '→ 끝 이 끝 노드로 연결');
  ok(pf.edges.includes('재측정 동일한가>3. 추세 확인:예') || pf.edges.includes('재측정 동일한가>추세 확인:예'), '예 → 3 번호 참조');
  ok(pf.edges.includes('추세 하락인가>단발 원인:아니오') && pf.edges.includes('추세 하락인가>단발 원인:아니오'), '분기 1개일 때 다음 단계 연결');
  ok(pf.d5 && pf.d5.detail === '상세\n⚠ 주의', '글 > / 주의 ! 파싱 (' + JSON.stringify(pf.d5 && pf.d5.detail) + ')');
  const legacy = await page.evaluate(() => window.EngrEdu.normalizeMap({nodes: [{id: 'a', title: 't', summary: '요약', detail: '설명', caution: '조심', tags: ['x']}], edges: []}).nodes[0]);
  ok(legacy.detail === '요약\n설명\n⚠ 조심' && !('tags' in legacy) && !('summary' in legacy), '예전 형식(요약·주의점) → 글로 합침');
  ok(!pf.edges.some(e => e.startsWith('기록>')), '끝 노드에서 자동 연결 없음');

  console.log('알고리즘 맵');
  await page.click('[data-tab="map"]');
  await page.waitForTimeout(200);
  const nodeCount = await page.$$eval('#canvas .node', els => els.length);
  ok(nodeCount > 5, `예시 맵 노드 렌더링 (${nodeCount})`);
  await page.screenshot({ path: path.join(OUT, '02-map.png') });

  // 규칙 변환
  await page.click('#btn-new-map');
  await page.fill('#src-text', `# PM 후 확인
시작: PM 완료
1. 소모품 교체 이력 기록
2. ? Qual 웨이퍼 두께가 기준 안인가
  아니오 → 조정 후 재측정 → 2
3. 생산 투입
끝: 이력 등록`);
  await page.click('#btn-rule');
  await page.waitForTimeout(150);
  const after = await page.evaluate(() => ({ n: window.EngrEdu.state.cur.nodes.length, e: window.EngrEdu.state.cur.edges.length, t: window.EngrEdu.state.cur.title }));
  ok(after.n === 6 && after.e === 6, `규칙 변환 노드 6 / 연결 6 (${after.n}/${after.e})`);
  ok(after.t === 'PM 후 확인', '규칙 변환이 맵 제목 설정');

  // 노드 선택 → 이미지 붙이기
  const firstNode = await page.$('#canvas .node.t-process');
  await firstNode.click();
  const png = path.join(OUT, 'tiny.png');
  fs.writeFileSync(png, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
  await page.setInputFiles('#file-img', png);
  await page.waitForTimeout(300);
  const imgs = await page.evaluate(() => { const S = window.EngrEdu.state; return S.cur.nodes.find(n => n.id === S.sel.id).images.length; });
  ok(imgs === 1, '노드에 이미지 첨부');
  const panelLabels = await page.$$eval('#panel-props .field > label', els => els.map(e => e.textContent.split(' ')[0]));
  ok(panelLabels.join(',') === '종류,제목,글,사진', '노드 패널 = 종류·제목·글·사진 (' + panelLabels.join(',') + ')');

  // 마우스를 올리면 사진이 뜬다
  const imgNodeId = await page.evaluate(() => window.EngrEdu.state.sel.id);
  await page.mouse.move(5, 5);
  await page.locator(`#canvas [data-node="${imgNodeId}"]`).hover();
  await page.waitForSelector('#hovercard.show img.hc-main', { timeout: 2000 }).catch(() => {});
  ok(await page.isVisible('#hovercard.show img.hc-main'), '노드에 마우스 → 사진 미리보기');
  await page.screenshot({ path: path.join(OUT, '02b-hover.png') });
  await page.mouse.move(5, 5);
  await page.waitForTimeout(100);
  ok(!(await page.isVisible('#hovercard.show')), '마우스를 떼면 미리보기 닫힘');

  // 아무것도 선택하지 않고 붙여넣기 → 사진이 든 새 단계
  const pngB64 = fs.readFileSync(png).toString('base64');
  await page.keyboard.press('Escape');
  const beforePaste = await page.evaluate(() => window.EngrEdu.state.cur.nodes.length);
  await page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const dt = new DataTransfer(); dt.items.add(new File([bin], 'p.png', { type: 'image/png' }));
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  }, pngB64);
  await page.waitForTimeout(400);
  const pasted = await page.evaluate(() => { const S = window.EngrEdu.state; const n = S.cur.nodes[S.cur.nodes.length - 1]; return { count: S.cur.nodes.length, imgs: n.images.length, title: n.title, sel: S.sel && S.sel.id === n.id }; });
  ok(pasted.count === beforePaste + 1 && pasted.imgs === 1 && pasted.sel, `선택 없이 붙여넣기 → 사진 든 새 단계 (${JSON.stringify(pasted)})`);
  // 선택한 노드에 붙여넣기
  await page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const dt = new DataTransfer(); dt.items.add(new File([bin], 'p.png', { type: 'image/png' }));
    document.body.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }));
  }, pngB64);
  await page.waitForTimeout(400);
  const pasted2 = await page.evaluate(() => { const S = window.EngrEdu.state; return { count: S.cur.nodes.length, imgs: S.cur.nodes.find(n => n.id === S.sel.id).images.length }; });
  ok(pasted2.count === pasted.count && pasted2.imgs === 2, `선택한 노드에 붙여넣기 (${JSON.stringify(pasted2)})`);
  // 노드 위로 끌어다 놓기
  const dropTarget = await page.evaluate(() => window.EngrEdu.state.cur.nodes.find(n => n.type === 'end').id);
  const box = await page.locator(`#canvas [data-node="${dropTarget}"]`).boundingBox();
  await page.evaluate(async ({ b64, x, y }) => {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const dt = new DataTransfer(); dt.items.add(new File([bin], 'd.png', { type: 'image/png' }));
    const wrap = document.getElementById('canvas-wrap');
    wrap.dispatchEvent(new DragEvent('dragover', { dataTransfer: dt, clientX: x, clientY: y, bubbles: true }));
    wrap.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, clientX: x, clientY: y, bubbles: true, cancelable: true }));
  }, { b64: pngB64, x: box.x + box.width / 2, y: box.y + box.height / 2 });
  await page.waitForTimeout(400);
  ok(await page.evaluate(id => window.EngrEdu.state.cur.nodes.find(n => n.id === id).images.length === 1, dropTarget), '노드 위로 사진 끌어다 놓기');
  // 테스트용으로 늘어난 노드를 지워 이후 단계 기준을 맞춘다
  await page.evaluate(() => { const S = window.EngrEdu.state; const extra = S.cur.nodes[S.cur.nodes.length - 1]; S.cur.nodes = S.cur.nodes.filter(n => n !== extra); S.cur.nodes.find(n => n.type === 'end').images = []; });
  await page.locator(`#canvas [data-node="${imgNodeId}"]`).click();
  ok(await page.$$eval('#canvas .badge', els => els.some(e => e.textContent.includes('📷1'))), '이미지 배지 표시');

  // 삭제 → 되돌리기
  const sel = await page.evaluate(() => window.EngrEdu.state.cur.nodes.find(n => n.type === 'process').id);
  await page.locator(`#canvas [data-node="${sel}"]`).click();
  await page.keyboard.press('Delete');
  const afterDel = await page.evaluate(() => window.EngrEdu.state.cur.nodes.length);
  await page.keyboard.press('Control+z');
  const afterUndo = await page.evaluate(() => window.EngrEdu.state.cur.nodes.length);
  ok(afterDel === 5 && afterUndo === 6, `삭제 후 되돌리기 (${afterDel} → ${afterUndo})`);

  // 따라가기
  await page.click('#btn-walk');
  const walkTitle = await page.textContent('#modal-title');
  ok(walkTitle === 'PM 완료', `따라가기 시작점 (${walkTitle})`);
  await page.click('.walk-next button');
  ok((await page.textContent('#modal-title')) === '소모품 교체 이력 기록', '따라가기 다음 단계 이동');
  ok(!/null|undefined/.test(await page.textContent('#modal-body')), '따라가기 화면에 null 표시 없음');
  await page.click('#modal-close');

  console.log('LLM 변환 (모의 응답)');
  let sent = null;
  await page.route('https://api.anthropic.com/v1/messages', async route => {
    sent = { headers: route.request().headers(), body: JSON.parse(route.request().postData()) };
    const result = { title: '모의 결과', nodes: [
      { id: 'n1', type: 'start', title: '시작', text: '' },
      { id: 'n2', type: 'decision', title: '두께가 기준 안인가', text: '[확인 필요] 판단 기준이 원문에 없음' },
      { id: 'n3', type: 'end', title: '끝', text: '' }],
      edges: [{ from: 'n1', to: 'n2', label: '' }, { from: 'n2', to: 'n3', label: '예' }, { from: 'n2', to: 'zz', label: '아니오' }] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      id: 'msg_test', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_reason: 'end_turn', stop_details: null,
      content: [{ type: 'thinking', thinking: '', signature: 'x' }, { type: 'text', text: JSON.stringify(result) }] }) });
  });
  await page.evaluate(() => localStorage.setItem('engr-edu.settings', JSON.stringify({ apiKey: 'sk-ant-test', remember: true })));
  await page.click('[data-ptab="text"]');
  await page.fill('#src-text', '두께를 재고 기준 안이면 끝낸다');
  await page.click('#btn-llm');
  await page.waitForSelector('#llm-status .status.ok, #llm-status .status.err');
  const st = await page.textContent('#llm-status');
  ok(/완료/.test(st), 'LLM 변환 완료 메시지: ' + st.split('\n')[0]);
  ok(sent && sent.body.output_config.format.type === 'json_schema', '구조화 출력(json_schema) 요청');
  ok(sent && sent.body.model === 'claude-opus-5-5' && sent.body.fallbacks === 'default', '모델·fallback 설정');
  ok(sent && sent.headers['anthropic-dangerous-direct-browser-access'] === 'true' && sent.headers['anthropic-version'] === '2023-06-01', '필수 헤더');
  const llmMap = await page.evaluate(() => ({ n: window.EngrEdu.state.cur.nodes.length, e: window.EngrEdu.state.cur.edges.length }));
  ok(llmMap.n === 3 && llmMap.e === 2, `LLM 결과 적용, 잘못된 간선 제거 (${llmMap.n}/${llmMap.e})`);
  ok(await page.evaluate(() => window.EngrEdu.state.cur.nodes[1].detail.startsWith('[확인 필요]')), 'LLM text → 노드 글');
  ok(JSON.stringify(sent.body.output_config.format.schema.properties.nodes.items.required) === '["id","type","title","text"]', 'LLM 스키마 = 종류·제목·글');

  // 거절 응답 처리
  await page.unroute('https://api.anthropic.com/v1/messages');
  await page.route('https://api.anthropic.com/v1/messages', route => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ stop_reason: 'refusal', stop_details: { type: 'refusal', category: null, explanation: '테스트 거절' }, content: [] }) }));
  await page.click('#btn-llm');
  await page.waitForSelector('#llm-status .status.err');
  ok(/처리하지 않았습니다/.test(await page.textContent('#llm-status')), '거절(refusal) 응답 처리');

  console.log('공유용 HTML');
  const share = await page.evaluate(() => window.EngrEdu.buildShareHTML([window.EngrEdu.state.maps.find(m => m.title === 'PM 후 확인')]));
  ok(!share.includes('sk-ant-test'), '공유 HTML에 API 키 없음');
  const sharePath = path.join(OUT, 'share.html');
  fs.writeFileSync(sharePath, share);
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p2 = await ctx2.newPage();
  const errors2 = [];
  p2.on('pageerror', e => errors2.push(e.message));
  await p2.goto('file://' + sharePath);
  await p2.waitForFunction(() => window.EngrEdu && window.EngrEdu.state.cur);
  const shared = await p2.evaluate(() => ({ tab: window.EngrEdu.state.tab, title: window.EngrEdu.state.cur.title, imgs: window.EngrEdu.state.cur.nodes.reduce((a, n) => a + n.images.length, 0) }));
  ok(shared.tab === 'map' && shared.title === 'PM 후 확인', `공유 HTML이 맵을 열고 시작 (${shared.tab}, ${shared.title})`);
  ok(shared.imgs === 1, '공유 HTML에 이미지 포함');
  ok(errors2.length === 0, '공유 HTML 오류 없음 ' + errors2.join(' | '));
  await ctx2.close();

  console.log('HBM 역추적');
  await page.click('[data-tab="edu"]');
  await page.click('.toc-item >> nth=4');
  await page.click('#edu-doc a[href="#go-hbm"]');
  await page.waitForSelector('#view-hbm.active .jz-svg');
  ok(await page.evaluate(() => window.EngrEdu.state.tab) === 'hbm', '04 모듈의 링크로 HBM 역추적 탭 열기');
  const jz = await page.evaluate(() => ({ scenes: document.querySelectorAll('#view-hbm .jz-scene').length, beats: window.EngrJourney.state.beats }));
  ok(jz.scenes === 12 && jz.beats > 40, `장면 12개, 단계 ${jz.beats}개`);
  const holes = await page.evaluate(() => { const b = window.EngrJourney.blocks(); let n = 0; for (let k = 1; k < b.length; k++) if (Math.abs(b[k - 1].top + b[k - 1].h - b[k].top) > 1) n++; return n; });
  ok(holes === 0, '스크롤 블록이 빈틈 없이 이어짐');
  // 조건에 맞는 블록의 frac 위치를 화면 가운데(기준선)에 둔다
  const jzGo = async (cond, frac) => {
    await page.evaluate(([cond, frac]) => {
      const V = document.getElementById('view-hbm'), b = window.EngrJourney.blocks().find(new Function('b', 'return ' + cond));
      V.scrollTop = b.top + frac * b.h - V.clientHeight * 0.5;
    }, [cond, frac]);
    await page.waitForTimeout(120);
  };
  const visible = () => page.evaluate(() => [...document.querySelectorAll('#view-hbm .jz-scene')].filter(g => g.style.display !== 'none').map(g => ({ i: +g.dataset.i, tf: g.getAttribute('transform') || '' })));
  let sceneOk = 0;
  for (let si = 0; si < 12; si++) {
    await jzGo(`b.kind === 'card' && b.si === ${si} && b.j === 0`, 0.02);
    const u = await page.evaluate(() => window.EngrJourney.state.pos.u), vis = await visible();
    if (u === si && vis.length === 1 && vis[0].i === si) sceneOk++;
  }
  ok(sceneOk === 12, `스크롤하면 12개 장면이 차례로 나온다 (${sceneOk}/12)`);
  await jzGo(`b.kind === 'gap' && b.from === 4 && b.to === 5`, 0.5);
  const tr = await visible();
  ok(tr.length === 2 && tr.every(t => /scale\(/.test(t.tf)), '장면 사이에서는 두 장면이 줌으로 겹친다 (출하 → 웨이퍼)');
  ok(/되감기/.test(await page.textContent('.jz-badge')), '되감기 전환 표시');
  await jzGo(`b.kind === 'card' && b.si === 11 && b.j === 0`, 0.02);
  const hud = await page.evaluate(() => ({ mag: document.querySelector('.jz-scale [data-o=mag]').textContent, mk: document.querySelector('.jz-gauge .mk').textContent }));
  ok(/[만억]/.test(hud.mag) && /nm/.test(hud.mk), `배율·눈금 표시 (${hud.mag}, ${hud.mk})`);
  const race = page.locator('#view-hbm .jc:has(.race)');
  const tok0 = await race.locator('[data-o="t1"]').textContent();
  await setRange(race.locator('input[data-i="bw"]'), '9.6');
  const tok1 = await race.locator('[data-o="t1"]').textContent();
  ok(tok0 === '34 토큰/s' && tok1 === '69 토큰/s', `토큰 레이스: 대역폭 ×2 → 속도 ×2 (${tok0} → ${tok1})`);
  const lanes = () => page.evaluate(() => document.querySelectorAll('#view-hbm .jz-scene[data-i="2"] .lane').length);
  const ln0 = await lanes();
  await page.click('#view-hbm .jc [data-g="gen"] button[data-v="HBM4"]');
  const ln1 = await lanes();
  ok(ln0 === 128 && ln1 === 256, `대역폭 위젯: HBM4 → 화면의 데이터선 ${ln0} → ${ln1}`);
  await page.click('#view-hbm .jc [data-g="pt"] button[data-v="local"]');
  const wp = await page.evaluate(() => window.EngrJourney.scenes[5].p);
  ok(wp.pattern === 'local' && wp.stats.fail > 0 && wp.stats.total > 300, `웨이퍼 맵 패턴 바꾸기 (불합격 ${wp.stats.fail}/${wp.stats.total})`);
  await page.click('#view-hbm .jc [data-g="N"] button[data-v="16"]');
  const die16 = await page.evaluate(() => document.querySelectorAll('#view-hbm .jz-scene[data-i="6"] [data-tip^="코어 다이 #16"]').length);
  const thick = await page.locator('#view-hbm .jc:has([data-g="N"]) [data-o="t"]').textContent();
  ok(die16 > 0 && thick === '≈ 26 µm', `높이 예산: 16단 → 화면도 16단, 코어 다이 ${thick}`);
  await jzGo(`b.kind === 'card' && b.si === 3 && b.j === 1`, 0.5 / 5);
  const st0 = await page.evaluate(() => window.EngrJourney.scenes[3]._state);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(900);
  const st1 = await page.evaluate(() => window.EngrJourney.scenes[3]._state);
  ok(st0 === '1' && st1 === '2', `카드 안 단계 스크롤 · → 키로 다음 단계 (CoWoS ${st0} → ${st1})`);
  await page.screenshot({ path: path.join(OUT, '05-hbm.png') });
  await page.click('.jz-tools [data-mode="fwd"]');
  const fwd = await page.evaluate(() => window.EngrJourney.blocks().filter(b => b.kind === 'card' && b.j === 0).map(b => b.si).join(','));
  ok(fwd === '11,10,9,8,7,6,5,4,3,2,1,0', '제조 순서 모드: DRAM → AI 순서로 다시 재생');
  await page.click('.jz-tools [data-mode="rev"]');
  await page.click('.jz-tools .pres');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(2200);
  const pk = await page.evaluate(() => window.EngrJourney.state.pres);
  await page.screenshot({ path: path.join(OUT, '06-hbm-pres.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  ok(pk === 1 && (await page.evaluate(() => window.EngrJourney.state.pres)) === null, '발표 모드: → 키로 다음, Esc로 닫기');
  await page.click('#view-hbm a[href="#go-edu-3"]');
  const back = await page.evaluate(() => ({ tab: window.EngrEdu.state.tab, idx: window.EngrEdu.state.eduIdx }));
  ok(back.tab === 'edu' && back.idx === 3, '카드의 링크로 교육 03 모듈 열기');

  console.log('범프 공정');
  await page.click('.toc-item >> nth=5');
  await page.click('#edu-doc a[href="#go-bump"]');
  await page.waitForSelector('#view-bump.active .bp-svg');
  ok(await page.evaluate(() => window.EngrEdu.state.tab) === 'bump', '05 모듈의 링크로 범프 공정 탭 열기');
  const bp = await page.evaluate(() => ({ chips: document.querySelectorAll('#view-bump .bp-line button').length, beats: window.EngrBump.state.beats, panels: document.querySelectorAll('#view-bump .bp-panel').length }));
  ok(bp.chips === 12 && bp.panels === 3 && bp.beats === 18, `공정 12개 · 웨이퍼/다이/범프 3화면 · 단계 ${bp.beats}개`);
  // 각 상태로 스크롤해서 그 상태가 되는지, 보이는 층이 맞는지
  const bpAt = async s => {
    await page.evaluate(s => { const b = window.EngrBump.blocks().find(x => x.states.includes(s)); const V = document.getElementById('view-bump'); V.scrollTop = b.top + (b.states.indexOf(s) + 0.5) / b.n * b.h - V.clientHeight * 0.5; }, s);
    await page.waitForTimeout(150);
    return page.evaluate(() => window.EngrBump.state.state);
  };
  const order = await page.evaluate(() => window.EngrBump.order);
  let reached = 0;
  for (const s of order) if (await bpAt(s) === s) reached++;
  ok(reached === order.length, `스크롤하면 ${order.length}개 상태를 차례로 지난다 (${reached}/${order.length})`);
  const vis = sel => page.evaluate(sel => [...document.querySelectorAll('#view-bump ' + sel)].some(e => !e.closest('.off')), sel);
  await bpAt('develop');
  const dv = [await vis('.f-seed'), await vis('[data-tip^="PR 틀"]'), await vis('.f-cu.gy')];
  await bpAt('etch-ti');
  const et = [await vis('[data-tip^="PR 틀"]'), await vis('[data-tip^="Cu 시드 — 도금"]'), await vis('.f-cu.gy')];
  ok(dv.join() === 'true,true,false' && et.join() === 'false,false,true', `층이 공정에 따라 쌓이고 사라진다 (현상: 시드·PR 틀 / 시드 식각 후: 범프만)`);
  await bpAt('reflow');
  await page.waitForTimeout(1900);
  const dome = await page.evaluate(() => document.querySelector('#view-bump .bp-dome').getAttribute('d'));
  ok(/Q/.test(dome) && (await page.textContent('.bp-head .nm')) === '리플로우', '리플로우: 솔더가 둥글어지고 단계 표시가 바뀜');
  await page.click('#view-bump .bp-views [data-v="bump"]');
  await page.waitForTimeout(800);
  const vb = await page.evaluate(() => document.querySelector('#view-bump .bp-svg').getAttribute('viewBox').split(' ').map(Number));
  ok(vb[0] > 500 && vb[0] + vb[2] / 2 > 1100, `③ 범프 보기로 확대 (화면 가운데 x ${Math.round(vb[0] + vb[2] / 2)})`);
  await page.screenshot({ path: path.join(OUT, '07-bump.png') });
  await page.click('#view-bump .bp-views [data-v="all"]');
  await page.click('#view-bump .bp .jz-tools .pres');
  const k0 = await page.evaluate(() => window.EngrBump.state.pres);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const k1 = await page.evaluate(() => window.EngrBump.state);
  await page.screenshot({ path: path.join(OUT, '08-bump-pres.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  ok(k1.pres === k0 + 1 && (await page.evaluate(() => window.EngrBump.state.pres)) === null, `발표 모드: → 로 다음 (${k1.state}), Esc로 닫기`);
  await page.click('.bp-line button >> nth=5');
  await page.waitForTimeout(1600);
  ok((await page.evaluate(() => window.EngrBump.state.step)) === 'ecd', '공정 칩을 누르면 그 공정으로 이동 (06 도금)');
  await page.click('[data-tab="map"]');

  console.log('다크 모드 화면');
  await page.click('#btn-theme');
  await page.click('#btn-layout');
  await page.screenshot({ path: path.join(OUT, '03-map-dark.png') });
  await page.click('[data-tab="edu"]');
  await page.click('.toc-item >> nth=4');
  await page.screenshot({ path: path.join(OUT, '04-edu-dark.png') });

  ok(errors.length === 0, '페이지 오류 없음 ' + errors.join(' | '));
  await browser.close();
  console.log(`\n스크린샷: ${OUT}`);
  console.log(failed ? `실패 ${failed}건` : '모두 통과');
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
