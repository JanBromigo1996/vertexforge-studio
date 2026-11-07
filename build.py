#!/usr/bin/env python3
"""Baut VertexForge Studio:
   dist/vertexforge_studio.html  – Browser-Version (Schriften von Google Fonts)
   app/index.html + app/fonts/   – Desktop-Version (Schriften offline eingebettet)"""
import base64, json, os, re, sys, hashlib, urllib.request
ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
rd = lambda p: open(os.path.join(SRC, p), encoding='utf-8').read()
fonts = json.load(open(os.path.join(ROOT, 'fonts.json'), encoding='utf-8'))
fonts_js = json.dumps([f[:3] for f in fonts], ensure_ascii=False)
js = "'use strict';\n" + "\n".join(rd(f) for f in ['i18n.js','guide.js','core.js','hub.js','pipeline.js','board.js','design.js','tour.js','versions.js','modules.js'])
js = js.replace('/*@FONTS*/', fonts_js)
css = rd('styles.css')
icon = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(ROOT,'winres','icon_64.png'),'rb').read()).decode()
gurl = 'https://fonts.googleapis.com/css2?' + '&'.join('family=' + f[3] for f in fonts) + '&display=swap'
tpl = rd('template.html')
def build(font_tag):
    return tpl.replace('/*@CSS*/', css).replace('/*@JS*/', js).replace('/*@ICON*/', icon).replace('<!--@FONTS-->', font_tag)
os.makedirs(os.path.join(ROOT,'dist'), exist_ok=True)
web = build('<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="%s">' % gurl.replace('&','&amp;'))
open(os.path.join(ROOT,'dist','vertexforge_studio.html'),'w',encoding='utf-8').write(web)
print('web', len(web))
if '--desktop' in sys.argv:
    app = os.path.join(ROOT,'app'); fdir = os.path.join(app,'fonts'); os.makedirs(fdir, exist_ok=True)
    ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
    req = urllib.request.Request(gurl, headers={'User-Agent': ua})
    cssf = urllib.request.urlopen(req, timeout=60).read().decode()
    out = []; n = 0; size = 0
    for comment, block in re.findall(r'/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{[^}]*\})', cssf):
        if comment not in ('latin', 'latin-ext'): continue
        m = re.search(r'url\((https://[^)]+)\)', block)
        url = m.group(1); name = hashlib.md5(url.encode()).hexdigest()[:16] + '.woff2'
        dest = os.path.join(fdir, name)
        if not os.path.exists(dest):
            data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': ua}), timeout=60).read()
            open(dest,'wb').write(data)
        size += os.path.getsize(dest); n += 1
        out.append('/* %s */\n%s' % (comment, block.replace(url, name)))
    open(os.path.join(fdir,'fonts.css'),'w',encoding='utf-8').write('\n'.join(out))
    desk = build('<link rel="stylesheet" href="fonts/fonts.css">')
    open(os.path.join(app,'index.html'),'w',encoding='utf-8').write(desk)
    print('desktop fonts', n, 'files', size//1024, 'KB')
