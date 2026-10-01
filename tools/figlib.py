"""교육자료 그림(SVG)용 작은 도형 라이브러리.

- 모든 색은 CSS 변수(--fig-*)를 쓰고, 변수가 없을 때 쓸 밝은 테마 기본값을 같이 적는다.
  앱 안에서는 앱 테마(밝게/어둡게)를 따르고, GitHub 등에서 이미지로 볼 때는 기본값으로 보인다.
- 글자 폭은 대략 계산해서 상자를 넘치면 경고를 출력한다 (빌드 전에 겹침을 잡기 위함).
"""
import math
from xml.sax.saxutils import escape

FONT = "Pretendard,'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',system-ui,-apple-system,'Segoe UI',sans-serif"

STYLE = f"""
text{{font-family:{FONT}}}
.bg{{fill:var(--fig-bg,#fcfcfb)}}
.pn{{fill:var(--fig-panel,#f1f2f4)}}
.ink{{fill:var(--fig-ink,#1c2230)}}
.sub{{fill:var(--fig-sub,#52514e)}}
.mut{{fill:var(--fig-mut,#898781)}}
.ax{{stroke:var(--fig-axis,#c3c2b7);fill:none}}
.gr{{stroke:var(--fig-grid,#e1e0d9);fill:none}}
.ed{{stroke:var(--fig-edge,#7d8797);fill:none}}
.ah{{fill:var(--fig-edge,#7d8797)}}
.ring{{stroke:var(--fig-bg,#fcfcfb)}}
.f0{{fill:var(--fig-0w,#eef0f3)}} .s0{{stroke:var(--fig-0,#8a94a6)}} .k0{{fill:var(--fig-0,#8a94a6)}} .l0{{stroke:var(--fig-0,#8a94a6);fill:none}}
.f1{{fill:var(--fig-1w,#dbe8fa)}} .s1{{stroke:var(--fig-1,#2a78d6)}} .k1{{fill:var(--fig-1,#2a78d6)}} .l1{{stroke:var(--fig-1,#2a78d6);fill:none}}
.f2{{fill:var(--fig-2w,#fbe1d5)}} .s2{{stroke:var(--fig-2,#eb6834)}} .k2{{fill:var(--fig-2,#eb6834)}} .l2{{stroke:var(--fig-2,#eb6834);fill:none}}
.f3{{fill:var(--fig-3w,#d3f1e5)}} .s3{{stroke:var(--fig-3,#1baf7a)}} .k3{{fill:var(--fig-3,#1baf7a)}} .l3{{stroke:var(--fig-3,#1baf7a);fill:none}}
.f4{{fill:var(--fig-4w,#fcefcc)}} .s4{{stroke:var(--fig-4,#eda100)}} .k4{{fill:var(--fig-4,#eda100)}} .l4{{stroke:var(--fig-4,#eda100);fill:none}}
.f5{{fill:var(--fig-5w,#e3dff7)}} .s5{{stroke:var(--fig-5,#4a3aa7)}} .k5{{fill:var(--fig-5,#4a3aa7)}} .l5{{stroke:var(--fig-5,#4a3aa7);fill:none}}
.q1{{fill:var(--fig-q1,#cde2fb)}} .q2{{fill:var(--fig-q2,#9ec5f4)}} .q3{{fill:var(--fig-q3,#6da7ec)}}
.good{{fill:#0ca30c}} .crit{{fill:#d03b3b}} .critl{{stroke:#d03b3b;fill:none}} .critw{{fill:#d03b3b;fill-opacity:.28}}
.m-si{{fill:var(--m-si,#c7ccd6)}} .m-ox{{fill:var(--m-ox,#cfe3f4)}} .m-pr{{fill:var(--m-pr,#cbbbe9)}}
.m-cu{{fill:var(--m-cu,#e09a5f)}} .m-ni{{fill:var(--m-ni,#a9b1bd)}} .m-sn{{fill:var(--m-sn,#dfe5ec)}}
.m-imc{{fill:var(--m-imc,#8f7b66)}} .m-al{{fill:var(--m-al,#b7c4d6)}} .m-emc{{fill:var(--m-emc,#4c5363)}}
.m-sub{{fill:var(--m-sub,#7f9c78)}} .m-n{{fill:var(--m-n,#9fc3f0)}} .m-p{{fill:var(--m-p,#f2d2c2)}} .m-gate{{fill:var(--m-gate,#8b93a7)}}
.m-bath{{fill:var(--m-bath,#e7f1fb)}}
.nterm{{fill:var(--n-term-fill,#e8f6ee);stroke:var(--n-term-stroke,#2e9e5b)}}
.nproc{{fill:var(--n-process-fill,#ffffff);stroke:var(--n-process-stroke,#8a94a6)}}
.ndec{{fill:var(--n-decision-fill,#fff6e3);stroke:var(--n-decision-stroke,#d9921a)}}
.nio{{fill:var(--n-io-fill,#edf2ff);stroke:var(--n-io-stroke,#5b7bd5)}}
.mono{{font-family:ui-monospace,'D2Coding',Consolas,monospace}}
"""

WARNINGS = []


def tw(text, size):
    """대략적인 글자 폭(px)."""
    w = 0.0
    for ch in str(text):
        o = ord(ch)
        if o >= 0x1100:
            w += size * 0.96
        elif ch in "MW@%":
            w += size * 0.85
        elif ch.isupper() or ch.isdigit():
            w += size * 0.62
        elif ch in " .,:;'|!il()[]·":
            w += size * 0.32
        else:
            w += size * 0.54
    return w


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


class Fig:
    def __init__(self, name, w, h, title, desc=""):
        self.name, self.w, self.h, self.title, self.desc = name, w, h, title, desc
        self.el = [f'<rect class="bg" x="0" y="0" width="{w}" height="{h}" rx="12"/>']

    # ---- 기본 요소 ----
    def add(self, s):
        self.el.append(s)
        return self

    def rect(self, x, y, w, h, cls, rx=8, sw=None, dash=None, extra=""):
        a = f' stroke-width="{sw}"' if sw else ""
        a += f' stroke-dasharray="{dash}"' if dash else ""
        return self.add(f'<rect class="{cls}" x="{f(x)}" y="{f(y)}" width="{f(w)}" height="{f(h)}" rx="{rx}"{a}{extra}/>')

    def circle(self, cx, cy, r, cls, sw=None, extra=""):
        a = f' stroke-width="{sw}"' if sw else ""
        return self.add(f'<circle class="{cls}" cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}"{a}{extra}/>')

    def text(self, x, y, t, cls="ink", size=13, anchor="middle", weight=None, lh=1.35, maxw=None, extra=""):
        lines = t if isinstance(t, (list, tuple)) else [t]
        wa = f' font-weight="{weight}"' if weight else ""
        if maxw:
            for ln in lines:
                if tw(ln, size) > maxw + 1:
                    WARNINGS.append(f"{self.name}: '{ln}' {tw(ln, size):.0f}px > {maxw:.0f}px")
        widest = max(tw(ln, size) for ln in lines)
        left = x - widest / 2 if anchor == "middle" else x - widest if anchor == "end" else x
        if left < -2 or left + widest > self.w + 2:
            WARNINGS.append(f"{self.name}: 그림 밖으로 나감 '{lines[0]}' ({left:.0f}~{left + widest:.0f})")
        out = []
        for i, ln in enumerate(lines):
            out.append(f'<text class="{cls}" x="{f(x)}" y="{f(y + i * size * lh)}" font-size="{size}" text-anchor="{anchor}"{wa}{extra}>{escape(ln)}</text>')
        return self.add("".join(out))

    def line(self, x1, y1, x2, y2, cls="ed", sw=1.5, dash=None, arrow=False, start_arrow=False):
        a = f' stroke-dasharray="{dash}"' if dash else ""
        if arrow:
            a += f' marker-end="url(#ah-{self.name})"'
        if start_arrow:
            a += f' marker-start="url(#ah-{self.name})"'
        return self.add(f'<line class="{cls}" x1="{f(x1)}" y1="{f(y1)}" x2="{f(x2)}" y2="{f(y2)}" stroke-width="{sw}"{a}/>')

    def path(self, d, cls, sw=None, dash=None, arrow=False, extra=""):
        a = f' stroke-width="{sw}"' if sw else ""
        a += f' stroke-dasharray="{dash}"' if dash else ""
        if arrow:
            a += f' marker-end="url(#ah-{self.name})"'
        return self.add(f'<path class="{cls}" d="{d}"{a}{extra}/>')

    def poly(self, pts, cls, sw=None, closed=True, arrow=False, dash=None, extra=""):
        p = " ".join(f"{f(x)},{f(y)}" for x, y in pts)
        tag = "polygon" if closed else "polyline"
        a = f' stroke-width="{sw}"' if sw else ""
        a += f' stroke-dasharray="{dash}"' if dash else ""
        if arrow:
            a += f' marker-end="url(#ah-{self.name})"'
        return self.add(f'<{tag} class="{cls}" points="{p}"{a}{extra}/>')

    # ---- 조합 요소 ----
    def box(self, x, y, w, h, lines, tone=1, size=13, weight=600, sub=None, subsize=11.5, rx=10, sw=1.5, cls=None):
        """옅은 바탕 + 진한 테두리 상자. lines는 굵은 제목, sub는 보조 줄."""
        self.rect(x, y, w, h, cls or f"f{tone} s{tone}", rx=rx, sw=sw)
        lines = lines if isinstance(lines, (list, tuple)) else [lines]
        subs = sub if isinstance(sub, (list, tuple)) else ([sub] if sub else [])
        total = len(lines) * size * 1.3 + len(subs) * subsize * 1.35 + (4 if subs else 0)
        if total > h - 6:
            WARNINGS.append(f"{self.name}: 상자 높이 부족 '{lines[0]}' ({total:.0f} > {h - 6})")
        ty = y + h / 2 - total / 2 + size * 0.95
        self.text(x + w / 2, ty, lines, "ink", size, "middle", weight, lh=1.3, maxw=w - 12)
        if subs:
            self.text(x + w / 2, ty + len(lines) * size * 1.3 + 4, subs, "sub", subsize, "middle", None, maxw=w - 12)
        return self

    def pill(self, x, y, t, tone=0, size=11.5, anchor="start", weight=700):
        w = tw(t, size) + 14
        x0 = x if anchor == "start" else x - w / 2 if anchor == "middle" else x - w
        self.rect(x0, y - size - 3, w, size + 9, f"f{tone} s{tone}", rx=(size + 9) / 2, sw=1)
        self.text(x0 + w / 2, y + 1, t, "ink", size, "middle", weight)
        return w

    def arrow(self, x1, y1, x2, y2, cls="ed", sw=1.6, dash=None):
        return self.line(x1, y1, x2, y2, cls, sw, dash, arrow=True)

    def label_bg(self, x, y, t, size=11.5, cls="sub", anchor="middle", weight=600):
        w = tw(t, size) + 10
        x0 = x - w / 2 if anchor == "middle" else x if anchor == "start" else x - w
        self.rect(x0, y - size, w, size + 7, "bg", rx=4)
        self.text(x0 + w / 2, y + 1, t, cls, size, "middle", weight)

    def svg(self):
        head = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" '
                f'role="img" aria-labelledby="t-{self.name}">')
        defs = (f'<title id="t-{self.name}">{escape(self.title)}</title>'
                + (f"<desc>{escape(self.desc)}</desc>" if self.desc else "")
                + f"<defs><style>{STYLE}</style>"
                f'<marker id="ah-{self.name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
                f'<path d="M0,0 L10,5 L0,10 z" class="ah"/></marker></defs>')
        return head + defs + "".join(self.el) + "</svg>\n"


# ---- 차트 도우미 ----
def normal_pdf(x, mu, sd):
    return math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * math.sqrt(2 * math.pi))


def curve_path(fn, x0, x1, sx, sy, n=120):
    pts = []
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        pts.append((sx(x), sy(fn(x))))
    return "M" + " L".join(f"{f(a)},{f(b)}" for a, b in pts)


def area_path(fn, x0, x1, sx, sy, base_y, n=80):
    pts = [(sx(x0), base_y)]
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        pts.append((sx(x), sy(fn(x))))
    pts.append((sx(x1), base_y))
    return "M" + " L".join(f"{f(a)},{f(b)}" for a, b in pts) + " Z"
