#!/usr/bin/env python3
"""교육 콘텐츠(education/*.md)를 앱(src/app.html)에 넣어 단일 HTML(dist/engr-edu.html)로 만든다.

사용법:  python3 tools/build.py            (dist/engr-edu.html)
        python3 tools/build.py --out 경로  (다른 곳에 만들기 — 작업 중 비교용)
        python3 tools/build.py --out 경로 --only 03,07  (전해도금 탭에 그 장만 넣기)
        python3 tools/build.py --no-min    (코드를 줄이지 않고 교육 콘텐츠도 압축하지 않은 읽기 쉬운 결과물 — 디버깅용)
결과물은 외부 파일·CDN 없이 더블클릭만으로 열리는 하나의 HTML 파일이다.
코드의 주석 · 빈칸은 tools/minify.cjs 로 덜어 내고(Node.js + typescript 필요, 없으면 그대로 두고 알린다),
교육 콘텐츠(JSON)는 DEFLATE 로 압축해 base64 로 넣는다(앱의 inflateRaw 가 푼다).
일부 앱 보기 화면은 HTML 파일의 앞 1 MB 정도만 읽으므로 결과물을 1,000,000 바이트 아래로 유지한다.
"""
import base64
import json
import re
import shutil
import subprocess
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src" / "app.html"
EDU = ROOT / "education"
OUT = ROOT / "dist" / "engr-edu.html"
SIZE_LIMIT = 1_000_000          # 앞부분만 읽는 보기 화면에서도 끝까지 들어오도록 (바이트)
# 앱 원본의 자리 표시(주석)를 별도 파일의 내용으로 바꿔 넣는다
PARTS = {
    "/*@JOURNEY_CSS@*/": ROOT / "src" / "journey.css",   # HBM 역추적 탭 스타일
    "/*@JOURNEY_JS@*/": ROOT / "src" / "journey.js",     # HBM 역추적 탭 (스크롤 줌 스토리)
    "/*@BUMP_CSS@*/": ROOT / "src" / "bump.css",         # 범프 공정 탭 스타일
    "/*@BUMP_JS@*/": ROOT / "src" / "bump.js",           # 범프 공정 탭 (웨이퍼·다이·범프 한 화면)
    "/*@SYS_CSS@*/": ROOT / "src" / "systems.css",       # 사내 시스템 지도 탭 스타일
    "/*@SYS_JS@*/": ROOT / "src" / "systems.js",         # 사내 시스템 지도 탭 (MES·FDC·… 한 장 지도)
    "/*@PLATING_CSS@*/": ROOT / "src" / "plating.css",   # 전해도금 탭 스타일
    # 전해도금 탭: 장(章)마다 한 파일(src/plating/NN-*.js)을 번호 순으로 싣고, 마지막에 엔진(src/plating.js)
    "/*@PLATING_JS@*/": [*sorted((ROOT / "src" / "plating").glob("*.js")), ROOT / "src" / "plating.js"],
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
            # 속성 따옴표를 ' 로: JSON 에 넣을 때 \" 로 늘어나지 않게 (값에 ' 가 없을 때만)
            figs[name] = ATTR_DQ.sub(r"\1='\2'", p.read_text(encoding="utf-8").strip())
    return figs


ATTR_DQ = re.compile(r'(\s[\w:.-]+)="([^"\'<>]*)"')


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


def inject_parts(html, only=None):
    """src/journey.*, bump.*, plating.* 를 <style>·<script> 자리에 넣는다.
    여러 파일(전해도금 장 파일들)은 파일마다 따로 <script>에 넣어, 한 파일의 오류가 다른 장을 멈추지 않게 한다.
    only: 전해도금 장 번호 목록(예: ['03', '07']) — 그 장만 넣는다 (작업 중 확인용)."""
    for marker, paths in PARTS.items():
        if html.count(marker) != 1:
            sys.exit(f"src/app.html 에서 {marker} 자리를 찾지 못했습니다")
        codes = []
        for path in paths if isinstance(paths, list) else [paths]:
            if only and path.parent.name == "plating" and path.name[:2] not in only:
                continue
            code = path.read_text(encoding="utf-8")
            # 인라인 <script>/<style> 안에서 HTML 파서를 깨뜨리는 문자열 금지
            if re.search(r"</(script|style)|<!--", code, re.I):
                sys.exit(f"{path.name}: '</script', '</style', '<!--' 는 인라인으로 넣을 수 없습니다")
            codes.append(code)
        html = html.replace(marker, "\n</script>\n<script>\n".join(codes) if isinstance(paths, list) else codes[0], 1)
    return html


def check_self_contained(html):
    """외부 스크립트·스타일·폰트 참조가 있으면 실패시킨다 (사내망 CDN 차단 대비)."""
    bad = re.findall(r"<(?:script|link|img|iframe)[^>]+(?:src|href)\s*=\s*[\"']?(?:https?:)?//", html, re.I)
    bad += re.findall(r"@import\s+url\(\s*[\"']?(?:https?:)?//", html, re.I)
    bad += re.findall(r"url\(\s*[\"']?(?:https?:)?//", html, re.I)
    if bad:
        sys.exit("외부 참조가 있습니다: " + ", ".join(bad[:5]))


def main():
    out = Path(sys.argv[sys.argv.index("--out") + 1]).resolve() if "--out" in sys.argv else OUT
    only = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else None
    html = SRC.read_text(encoding="utf-8")
    mods = load_modules()
    figs = load_figures(mods)
    fig_style = split_style(figs)
    payload = json.dumps({"modules": mods, "figures": figs, "figStyle": fig_style}, ensure_ascii=False).replace("</", "<\\/")
    pattern = re.compile(r'(<script type="application/json" id="edu-data">)(.*?)(</script>)', re.S)
    if not pattern.search(html):
        sys.exit("src/app.html 에서 edu-data 자리를 찾지 못했습니다")
    if "--no-min" in sys.argv:
        html = pattern.sub(lambda m: m.group(1) + payload + m.group(3), html, count=1)
    else:
        # 교육 콘텐츠(글 · 그림)는 압축해 base64 로 넣는다 — 앱(loadEdu)이 inflateRaw 로 푼다
        z = zlib.compressobj(9, zlib.DEFLATED, -15, 9)
        packed = base64.b64encode(z.compress(payload.replace("<\\/", "</").encode("utf-8")) + z.flush()).decode("ascii")
        html = pattern.sub(lambda m: '<script type="application/octet-stream" id="edu-data" data-z="deflate">' + packed + m.group(3), html, count=1)
    html = inject_parts(html, only)
    check_self_contained(html)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    if "--no-min" not in sys.argv:
        minify(out)
    shown = out.relative_to(ROOT) if out.is_relative_to(ROOT) else out
    size = out.stat().st_size
    print(f"{shown}  ({size / 1024:.0f} KB, 교육 모듈 {len(mods)}개, 그림 {len(figs)}개)")
    if size >= SIZE_LIMIT:
        print(f"⚠ {size:,} 바이트 — {SIZE_LIMIT:,} 바이트를 넘었습니다. 일부 앱 보기 화면은 파일 앞부분만 읽어 뒤쪽 탭(전해도금)이 까맣게 보일 수 있습니다.")


def minify(path):
    """tools/minify.cjs 로 코드의 주석 · 빈칸을 덜어 낸다. Node.js · typescript 가 없으면 그대로 둔다."""
    node = shutil.which("node")
    if not node:
        print("(Node.js 가 없어 코드를 줄이지 않았습니다)")
        return
    env = None
    try:
        root = subprocess.run(["npm", "root", "-g"], capture_output=True, text=True, timeout=30).stdout.strip()
        if root:
            import os
            env = dict(os.environ, NODE_PATH=root)
    except (OSError, subprocess.SubprocessError):
        pass
    r = subprocess.run([node, str(ROOT / "tools" / "minify.cjs"), str(path), str(path)], capture_output=True, text=True, env=env)
    msg = (r.stdout or r.stderr).strip()
    if r.returncode:
        print(f"(코드를 줄이지 못했습니다: {msg})")
    elif "그대로 둔" in msg:
        print(msg)


if __name__ == "__main__":
    main()
