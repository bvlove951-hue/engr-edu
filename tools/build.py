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


def load_modules():
    mods = []
    for p in sorted(EDU.glob("*.md")):
        md = p.read_text(encoding="utf-8")
        m = re.search(r"^#\s+(.+)$", md, re.M)
        mods.append({"file": p.name, "title": m.group(1).strip() if m else p.stem, "md": md})
    return mods


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
    payload = json.dumps(mods, ensure_ascii=False).replace("</", "<\\/")
    pattern = re.compile(r'(<script type="application/json" id="edu-data">)(.*?)(</script>)', re.S)
    if not pattern.search(html):
        sys.exit("src/app.html 에서 edu-data 자리를 찾지 못했습니다")
    html = pattern.sub(lambda m: m.group(1) + payload + m.group(3), html, count=1)
    check_self_contained(html)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}  ({OUT.stat().st_size / 1024:.0f} KB, 교육 모듈 {len(mods)}개)")


if __name__ == "__main__":
    main()
