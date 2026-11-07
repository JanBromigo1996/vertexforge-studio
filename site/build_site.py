#!/usr/bin/env python3
"""Baut die Website: site/*.body.html + common.css/js  →  docs/index.html, docs/install.html
   sowie site/index.html (Fragment für die Vorschau)."""
import os
H = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(H, '..', 'docs')
css = open(os.path.join(H,'common.css'), encoding='utf-8').read()
js = open(os.path.join(H,'common.js'), encoding='utf-8').read()
FONTS = '<link rel="stylesheet" href="assets/site-fonts.css">'
PAGES = {
  'index': ('VertexForge Studio', 'VertexForge Studio – a free, open-source planning tool for 3D artists: pipeline, deadlines, mind board, shot list and story in one place.'),
  'install': ('VertexForge Install Guide', 'Step-by-step installation guide for VertexForge Studio on Windows, macOS and Linux.'),
}
for name, (title, desc) in PAGES.items():
    body = open(os.path.join(H, name + '.body.html'), encoding='utf-8').read().replace('/*@COMMONJS*/', js)
    head = f'<title>{title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<meta name="description" content="{desc}">\n<meta property="og:title" content="{title}">\n<meta property="og:description" content="{desc}">\n<meta property="og:image" content="https://vertexforge.pages.dev/assets/shot-hero.webp">\n<meta property="og:url" content="https://vertexforge.pages.dev/">\n<link rel="icon" href="assets/favicon.png">\n{FONTS}\n<style>\n{css}\n</style>\n'
    frag = head + body
    open(os.path.join(H, name + '.html'), 'w', encoding='utf-8').write(frag)
    full = '<!doctype html>\n<html lang="en" data-l="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + head + '</head>\n<body>\n' + body + '\n</body>\n</html>\n'
    open(os.path.join(D, name + '.html'), 'w', encoding='utf-8').write(full)
    print(name, len(full))

# Browser-Version für die Website: die Variante mit lokal abgelegten Schriften (keine Anfragen an Google).
import shutil
APP = os.path.join(H, '..', 'app')
if os.path.exists(os.path.join(APP, 'index.html')):
    dst = os.path.join(D, 'app')
    shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(APP, dst)
    print('app copied (self-hosted fonts)')
