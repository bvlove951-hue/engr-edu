#!/usr/bin/env python3
"""교육 콘텐츠(education/*.md)를 앱(src/app.html)에 넣어 단일 HTML(dist/engr-edu.html)로 만든다.

사용법:  python3 tools/build.py
결과물은 외부 파일·CDN 없이 더블클릭만으로 열리는 하나의 HTML 파일이다.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "app.html"
EDU = ROOT / "education"
OUT = ROOT / "dist" / "engr-edu.html"
# 앱 원본의 자리 표시(주석)를 별도 파일의 내용으로 바꿔 넣는다
PARTS = {
    "/*@JOURNEY_CSS@*/": ROOT / "src" / "journey.css",   # HBM 역추적 탭 스타일
    "/*@JOURNEY_JS@*/": ROOT / "src" / "journey.js",     # HBM 역추적 탭 (스크롤 줌 스토리)
    "/*@BUMP_CSS@*/": ROOT / "src" / "bump.css",         # 범프 공정 탭 스타일
    "/*@BUMP_JS@*/": ROOT / "src" / "bump.js",           # 범프 공정 탭 (웨이퍼·다이·범프 한 화면)
}


FIG_REF = re.compile(r"^!\[[^\]]*\]\(figures/([\w.-]+)\.svg\)\s*$", re.M)


def load_modules():
    mods = []
    for p in sorted(EDU.glob("*.md")):
        md = p.read_text(encoding="utf-8")
        m = re.search(r"^#\s+(.+)$", md, re.M)
        mods.append({"file": p.name, "title": m.group(1).strip() if m else p.stem, "md": md})
    return mods


def load_figures(mods):
    """본문에서 참조한 그림(education/figures/*.svg)만 넣는다. 없는 그림을 참조하면 실패."""
    figs = {}
    for mod in mods:
        for name in FIG_REF.findall(mod["md"]):
            p = EDU / "figures" / f"{name}.svg"
            if not p.exists():
                sys.exit(f"{mod['file']}: 그림 {p.name} 이 없습니다 (python3 tools/make_figures.py 실행)")
            figs[name] = p.read_text(encoding="utf-8").strip()
    return figs


STYLE_RE = re.compile(r"<style>(.*?)</style>", re.S)


def split_style(figs):
    """모든 그림에 똑같이 들어 있는 <style>을 한 번만 싣는다 (앱이 문서에 한 번 넣는다)."""
    style = ""
    for name, svg in figs.items():
        m = STYLE_RE.search(svg)
        if m:
            style = style or m.group(1)
            if m.group(1) != style:
                continue
            figs[name] = STYLE_RE.sub("", svg, count=1)
    return style


def inject_parts(html):
    """src/journey.*, bump.* 를 <style>·<script> 자리에 넣는다."""
    for marker, path in PARTS.items():
        if html.count(marker) != 1:
            sys.exit(f"src/app.html 에서 {marker} 자리를 찾지 못했습니다")
        code = path.read_text(encoding="utf-8")
        # 인라인 <script>/<style> 안에서 HTML 파서를 깨뜨리는 문자열 금지
        if re.search(r"</(script|style)|<!--", code, re.I):
            sys.exit(f"{path.name}: '</script', '</style', '<!--' 는 인라인으로 넣을 수 없습니다")
        html = html.replace(marker, code, 1)
    return html


def check_self_contained(html):
    """외부 스크립트·스타일·폰트 참조가 있으면 실패시킨다 (사내망 CDN 차단 대비)."""
    bad = re.findall(r"<(?:script|link|img|iframe)[^>]+(?:src|href)\s*=\s*[\"']?(?:https?:)?//", html, re.I)
    bad += re.findall(r"@import\s+url\(\s*[\"']?(?:https?:)?//", html, re.I)
    bad += re.findall(r"url\(\s*[\"']?(?:https?:)?//", html, re.I)
    if bad:
        sys.exit("외부 참조가 있습니다: " + ", ".join(bad[:5]))


def main():
    html = SRC.read_text(encoding="utf-8")
    mods = load_modules()
    figs = load_figures(mods)
    fig_style = split_style(figs)
    payload = json.dumps({"modules": mods, "figures": figs, "figStyle": fig_style}, ensure_ascii=False).replace("</", "<\\/")
    pattern = re.compile(r'(<script type="application/json" id="edu-data">)(.*?)(</script>)', re.S)
    if not pattern.search(html):
        sys.exit("src/app.html 에서 edu-data 자리를 찾지 못했습니다")
    html = pattern.sub(lambda m: m.group(1) + payload + m.group(3), html, count=1)
    html = inject_parts(html)
    check_self_contained(html)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}  ({OUT.stat().st_size / 1024:.0f} KB, 교육 모듈 {len(mods)}개, 그림 {len(figs)}개)")


if __name__ == "__main__":
    main()
