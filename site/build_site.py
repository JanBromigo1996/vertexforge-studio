#!/usr/bin/env python3
"""Baut die Website: site/*.body.html + common.css/js  →  docs/index.html, docs/install.html
   sowie site/index.html (Fragment für die Vorschau)."""
import os
H = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(H, '..', 'docs')
css = open(os.path.join(H,'common.css'), encoding='utf-8').read()
js = open(os.path.join(H,'common.js'), encoding='utf-8').read()
FONTS = '<link rel="stylesheet" href="assets/site-fonts.css">'
PAGES = {
  'index': ('VertexForge Studio – free 3D project planner for Blender artists', 'VertexForge Studio is a free, open-source planner for 3D projects: pipeline with deadlines, mind board, shot list and story. Offline, no account – for Blender, ZBrush and Substance artists on Windows, macOS and Linux.'),
  'install': ('Install VertexForge Studio – Windows, macOS, Linux', 'Step-by-step installation guide for VertexForge Studio, the free 3D project planner, on Windows, macOS and Linux – with checksums and antivirus results.'),
}
SITE = 'https://vertexforge.pages.dev/'
LD = '''<script type="application/ld+json">{"@context":"https://schema.org","@type":"SoftwareApplication","name":"VertexForge Studio","alternateName":"VertexForge","url":"https://vertexforge.pages.dev/","image":"https://vertexforge.pages.dev/assets/og-card.jpg","description":"Free, open-source planner for 3D projects: pipeline with deadlines, mind board, shot list and story. Offline, no account.","applicationCategory":"DesignApplication","operatingSystem":"Windows 10, Windows 11, macOS 11+, Linux, Web browser","softwareVersion":"@VER@","license":"https://opensource.org/licenses/MIT","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"EUR"},"author":{"@type":"Person","name":"Jan Bromigo","url":"https://github.com/JanBromigo1996"},"downloadUrl":"https://github.com/JanBromigo1996/vertexforge-studio/releases/latest","sameAs":["https://github.com/JanBromigo1996/vertexforge-studio","https://jan-bromigo.itch.io/vertexforge-studio"]}</script>'''
import re
VER = re.search(r"APP_VERSION = '([0-9.]+)'", open(os.path.join(H,'..','src','core.js'), encoding='utf-8').read()).group(1)
for name, (title, desc) in PAGES.items():
    url = SITE + ('' if name=='index' else name + '.html')
    body = open(os.path.join(H, name + '.body.html'), encoding='utf-8').read().replace('/*@COMMONJS*/', js)
    head = f'<title>{title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<meta name="description" content="{desc}">\n<link rel="canonical" href="{url}">\n<meta property="og:url" content="{url}">\n<meta property="og:site_name" content="VertexForge Studio">\n<meta property="og:title" content="{title}">\n<meta property="og:description" content="{desc}">\n<meta property="og:image" content="https://vertexforge.pages.dev/assets/og-card.jpg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:type" content="website">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="theme-color" content="#141316">\n<meta property="og:url" content="https://vertexforge.pages.dev/">\n<link rel="icon" href="assets/favicon.png">\n{FONTS}\n<style>\n{css}\n</style>\n'
    if name=='index': head += '\n' + LD.replace('@VER@', VER) + '\n'
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

# Für Suchmaschinen: Sitemap, robots.txt, IndexNow-Schlüssel
from datetime import date
open(os.path.join(D,'sitemap.xml'),'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{SITE}{p}</loc><lastmod>{date.today().isoformat()}</lastmod></url>\n' for p in ['', 'install.html']) + '</urlset>\n')
open(os.path.join(D,'robots.txt'),'w').write('User-agent: *\nAllow: /\nSitemap: ' + SITE + 'sitemap.xml\n')
INDEXNOW = 'b7c2e9f04a1d4e6c8f35a2d9c1e0f7a4'
open(os.path.join(D, INDEXNOW + '.txt'),'w').write(INDEXNOW)
