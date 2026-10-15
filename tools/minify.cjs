#!/usr/bin/env node
/* 빌드 결과(dist/engr-edu.html)의 <script>(코드) · <style> 을 줄인다 — 주석 · 들여쓰기 · 토큰 사이 빈칸.
 * 일부 앱 보기 화면은 HTML 파일의 앞 1 MB 정도만 읽어서, 끝에 있는 전해도금 엔진이 잘리면 그 탭이 까맣게 나온다.
 * 그래서 내용(글 · 그림)은 그대로 두고 코드의 빈칸만 덜어 낸다.
 *
 * 사용법: node tools/minify.cjs <입력.html> <출력.html>   (TypeScript 가 있어야 한다: npm i -g typescript)
 * 안전장치
 *  - JS 는 TypeScript 파서로 토큰을 나눠 다시 잇는다. 문자열 · 템플릿 · 정규식은 그대로, 줄바꿈도 그대로(자동 세미콜론 규칙 보존).
 *  - 줄인 코드를 다시 파싱해 "주석 없이 다시 찍은 원본"과 글자 하나까지 같은지 확인한다. 다르면 그 블록은 줄이지 않는다.
 *  - type 이 있는 <script>(JSON 데이터)는 건드리지 않는다. 묶음(<script data-part> · <style data-part>)은 줄인 뒤 빌드가 압축한다.
 */
'use strict';
const fs = require('fs');
let ts;
try { ts = require('typescript'); }
catch (e){
  try { ts = require(require('path').join(require('child_process').execSync('npm root -g').toString().trim(), 'typescript')); }
  catch (e2){ console.error('typescript 를 찾지 못했습니다 (npm i -g typescript)'); process.exit(2); }
}

const parse = code => ts.createSourceFile('x.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const WORD = /[A-Za-z0-9_$\u0080-￿]/;

const isDoc = n => n.kind >= ts.SyntaxKind.FirstJSDocNode && n.kind <= ts.SyntaxKind.LastJSDocNode;
function tokens(sf){
  const out = [];
  (function walk(n){
    if (isDoc(n)) return;                                   // /** */ 주석은 버린다
    const kids = n.getChildren(sf);
    if (!kids.length){ if (n.kind !== ts.SyntaxKind.EndOfFileToken) out.push(n); return; }
    kids.forEach(walk);
  })(sf);
  return out;
}
// 줄바꿈을 빼도 문장이 이어지는 자리(앞 토큰이 ; { , ( [ 연산자 …이거나 뒤 토큰이 } ) ] , . …)
const JOIN_AFTER = new Set([';', '{', ',', '(', '[', '=', '=>', '&&', '||', '??', '?', ':', '+', '-', '*', '%', '<', '>', '<=', '>=', '===', '!==', '==', '!=', '+=', '-=', '*=', '|', '&', '^', '!', '.']);
const JOIN_BEFORE = new Set(['}', ')', ']', ',', '.', ';', '?', ':', '&&', '||', '??', '=', '===', '!==', '==', '!=', '+', '-', '*', '%', '=>']);
function minJs(code){
  return minJsMode(code, true) || minJsMode(code, false);   // 줄바꿈까지 줄인 판이 검증에 실패하면 줄바꿈을 남긴 판
}
function minJsMode(code, join){
  const sf = parse(code);
  if (sf.parseDiagnostics && sf.parseDiagnostics.length) return null;
  const toks = tokens(sf);
  let s = '', prev = null;
  for (const t of toks){
    const txt = t.getText(sf);
    if (!txt) continue;
    if (prev){
      const gap = code.slice(prev.end, t.getStart(sf));
      const a = s[s.length - 1], b = txt[0];
      const nl = /[\r\n\u2028\u2029]/.test(gap) && !(join && (JOIN_AFTER.has(prev.getText(sf)) || JOIN_BEFORE.has(txt)));
      if (nl) s += '\n';                                                    // 줄바꿈이 문장 끝을 정할 수 있는 자리는 남긴다 (자동 세미콜론)
      else if ((WORD.test(a) && WORD.test(b))
        || (a === '+' && b === '+') || (a === '-' && b === '-')
        || (a === '/' && (b === '/' || b === '*'))
        || (a === '<' && b === '!') || (a === '-' && b === '>')
        || (prev.kind === ts.SyntaxKind.NumericLiteral && b === '.')) s += ' ';
    }
    s += txt;
    prev = t;
  }
  // 빈칸을 빼서 HTML 이 <script> 를 일찍 닫거나 주석으로 읽을 글자가 새로 생기면 쓰지 않는다
  const risky = /<\/script|<!--|-->/i;
  if (risky.test(s) && !risky.test(code)) return null;
  // 같은 프로그램인지 확인: 두 코드의 구문 나무(노드 종류 + 토큰 글자)가 하나도 다르지 않아야 한다
  const p = parse(s);
  if (p.parseDiagnostics && p.parseDiagnostics.length) return null;
  return sig(p) === sig(sf) ? s : null;
}
function sig(sf){
  const out = [];
  (function walk(n){
    if (isDoc(n)) return;
    const kids = n.getChildren(sf);
    if (!kids.length){ out.push(n.kind + ':' + n.getText(sf)); return; }
    out.push('(' + n.kind);
    kids.forEach(walk);
    out.push(')');
  })(sf);
  return out.join('\u0001');
}
function minCss(css){
  // 문자열 안은 건드리지 않는다
  const parts = css.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/);
  return parts.map((p, i) => i % 2 ? p : p
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n+/g, '\n')
    .replace(/[ \t]*([{};])[ \t\n]*/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')).join('').trim();
}

if (require.main === module){
  const [inp, outp] = process.argv.slice(2);
  if (!inp || !outp){ console.error('사용법: node tools/minify.cjs <입력.html> <출력.html>'); process.exit(2); }
  const html = fs.readFileSync(inp, 'utf8');
  let kept = 0;
  const res = html
    .replace(/<script((?: data-part="\w+")?)>([\s\S]*?)<\/script>/g, (m, attr, code) => { const r = minJs(code); if (r == null){ kept++; return m; } return '<script' + attr + '>' + r + '</script>'; })
    .replace(/<style((?: data-part="\w+")?)>([\s\S]*?)<\/style>/g, (m, attr, css) => '<style' + attr + '>' + minCss(css) + '</style>');
  fs.writeFileSync(outp, res);
  const b0 = Buffer.byteLength(html), b1 = Buffer.byteLength(res);
  console.log(`minify: ${b0} → ${b1} bytes (${Math.round((1 - b1 / b0) * 100)} % 줄임)${kept ? ` · 검증에 실패해 그대로 둔 <script> ${kept}개` : ''}`);
}
module.exports = {minJs, minCss};
