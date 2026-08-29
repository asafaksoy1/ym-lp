#!/usr/bin/env python3
"""
Render 4:5 (1080x1350) Meta ad creatives from ads/creatives.json.

  python3 ads/build.py

Reads   ads/creatives.json   — a list of creative objects (see ads/README.md)
Writes  ads/creatives/<market>-<n>-<id>.png

Each creative is laid out by one of three visual variants so a set of five does
not read as the same ad five times. The variant is chosen per creative via its
"variant" key (a|b|c).
"""

import base64
import html
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(ROOT)
OUT = os.path.join(ROOT, "creatives")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

PHOTOS = {
    "group": "hero-group.webp",
    "mascot": "mascot-group.webp",
    "auditorium": "auditorium.webp",
    "winners": "winners.webp",
    "exam": "exam-desk.webp",
    "london": "london-final.webp",
    "certificates": "certificates.webp",
    "corridor": "corridor.webp",
}


def data_uri(path):
    ext = path.rsplit(".", 1)[1].lower()
    mime = {"webp": "image/webp", "png": "image/png"}[ext]
    with open(path, "rb") as fh:
        return "data:%s;base64,%s" % (mime, base64.b64encode(fh.read()).decode())


def esc(s):
    """Escape, then let a single |highlight| pair become <em>."""
    out = html.escape(s or "")
    while out.count("|") >= 2:
        out = out.replace("|", "<em>", 1).replace("|", "</em>", 1)
    return out


def body_block(c):
    return f"""
      <span class="badge">{esc(c['badge'])}</span>
      <h1>{esc(c['headline'])}</h1>
      <p class="sub">{esc(c['subhead'])}</p>
      <div class="proof"><span class="tick">✓</span>{esc(c['proof'])}</div>
      <div><span class="cta">{esc(c['cta'])}</span></div>
    """


def card_html(c, photo, logo):
    v = c.get("variant", "a")
    top = f"""<div class="topbar"><img src="{logo}" alt=""><span class="rule"></span></div>"""
    if v == "b":
        inner = f"""
          <div class="photo" style="background-image:url('{photo}')"></div>
          {top}
          <div class="panel">{body_block(c)}</div>
        """
    elif v == "c":
        inner = f"""
          <div class="mesh"></div>
          {top}
          <div class="frame"><div class="photo" style="background-image:url('{photo}')"></div></div>
          <div class="body">{body_block(c)}</div>
        """
    else:
        inner = f"""
          <div class="photo" style="background-image:url('{photo}')"></div>
          <div class="shade"></div>
          {top}
          <div class="body">{body_block(c)}</div>
        """
    return f'<div class="card v-{v}">{inner}<div class="accent"></div></div>'


def main():
    src = os.path.join(ROOT, "creatives.json")
    if not os.path.exists(src):
        sys.exit("ads/creatives.json not found — write the copy there first.")
    creatives = json.load(open(src, encoding="utf-8"))

    if not os.path.exists(CHROME):
        sys.exit("Google Chrome not found at %s" % CHROME)

    template = open(os.path.join(ROOT, "template.html"), encoding="utf-8").read()
    fonts = open(os.path.join(ROOT, "_fonts.css"), encoding="utf-8").read()
    template = template.replace('@import url("_fonts.css");', fonts)
    logo = data_uri(os.path.join(REPO, "assets", "img", "logo-light.png"))

    os.makedirs(OUT, exist_ok=True)
    work = os.path.join(ROOT, ".work")
    os.makedirs(work, exist_ok=True)

    made = []
    for c in creatives:
        photo_file = PHOTOS.get(c.get("photo", "group"), PHOTOS["group"])
        photo = data_uri(os.path.join(REPO, "assets", "img", photo_file))
        page, n = re.subn(r'<div class="card" id="card">.*?</div>',
                          lambda _m: card_html(c, photo, logo), template, count=1, flags=re.S)
        if n != 1:
            sys.exit("template placeholder not found — did template.html change?")

        name = "%s-%s-%s" % (c["market"].lower(), c["n"], c["id"])
        tmp = os.path.join(work, name + ".html")
        open(tmp, "w", encoding="utf-8").write(page)

        png = os.path.join(OUT, name + ".png")
        subprocess.run([
            CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
            "--force-device-scale-factor=1", "--virtual-time-budget=8000",
            "--window-size=1080,1350", "--screenshot=" + png, "file://" + tmp,
        ], check=True, capture_output=True)
        made.append((name, os.path.getsize(png) // 1024))

    shutil.rmtree(work, ignore_errors=True)
    for name, kb in made:
        print("  %-34s %4d KB" % (name + ".png", kb))
    print("\n%d creatives -> %s" % (len(made), OUT))


if __name__ == "__main__":
    main()
