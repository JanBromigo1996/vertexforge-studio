#!/usr/bin/env python3
"""Sammelt öffentliche Zahlen für die Website (docs/stats.json).

Läuft automatisch per GitHub Actions (siehe .github/workflows/stats.yml), kann aber auch lokal laufen.
Besucher der Website laden nur diese eine Datei von der eigenen Domain – keine Anfragen an Dritte.
Fällt eine Quelle aus, bleiben ihre letzten Werte erhalten.
"""
import json, os, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.environ.get('VF_REPO', 'JanBromigo1996/vertexforge-studio')
OUT = os.path.join(ROOT, 'docs', 'stats.json')
CFG = json.load(open(os.path.join(ROOT, 'site', 'community.json'), encoding='utf-8'))
UA = 'VertexForge-stats/1.0 (+https://vertexforge.pages.dev)'

def get(url, headers=None):
    h = {'User-Agent': UA, 'Accept': 'application/json'}
    h.update(headers or {})
    with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=20) as r:
        return json.loads(r.read().decode('utf-8'))

def platform(name):
    n = name.lower()
    if n.endswith('.exe') or n.endswith('portable.zip'): return 'windows'
    if n.endswith('.dmg'): return 'macos'
    if n.endswith('.deb') or n.endswith('.tar.gz'): return 'linux'
    if n.endswith('.html'): return 'browser'
    return None

def github():
    gh = {'Accept': 'application/vnd.github+json'}
    tok = os.environ.get('GITHUB_TOKEN')
    if tok: gh['Authorization'] = 'Bearer ' + tok
    rels = get(f'https://api.github.com/repos/{REPO}/releases?per_page=100', gh)
    plat = {'windows': 0, 'macos': 0, 'linux': 0, 'browser': 0}
    for r in rels:
        for a in r.get('assets', []):
            p = platform(a['name'])
            if p: plat[p] += a.get('download_count', 0)
    repo = get(f'https://api.github.com/repos/{REPO}', gh)
    return {'downloads': sum(plat.values()), 'platforms': plat, 'stars': repo.get('stargazers_count', 0),
            'latest': rels[0]['tag_name'] if rels else None}

def itch():
    key = os.environ.get('ITCH_API_KEY')
    if not key: return None
    games = get(f'https://itch.io/api/1/{key}/my-games').get('games', [])
    want = (CFG['links'].get('itch') or '').rstrip('/')
    g = next((g for g in games if g.get('url', '').rstrip('/') == want), games[0] if games else None)
    if not g: return None
    return {'downloads': g.get('downloads_count', 0), 'views': g.get('views_count', 0), 'url': want or g.get('url')}

def blenderartists():
    url = (CFG['links'].get('blenderartists') or '').split('?')[0].rstrip('/')
    if not url: return None
    t = get(url + '.json')
    return {'views': t.get('views', 0), 'likes': t.get('like_count', 0), 'replies': max(0, t.get('posts_count', 1) - 1), 'url': url}

def reddit():
    url = (CFG['links'].get('reddit') or '').split('?')[0].rstrip('/')
    if not url: return None
    d = get(url + '.json?raw_json=1')[0]['data']['children'][0]['data']
    return {'upvotes': d.get('score', 0), 'comments': d.get('num_comments', 0), 'ratio': d.get('upvote_ratio'), 'url': url}

def main():
    try: old = json.load(open(OUT, encoding='utf-8'))
    except Exception: old = {}
    out = {'updated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'since': old.get('since') or datetime.now(timezone.utc).strftime('%Y-%m-%d')}
    for name, fn in [('github', github), ('itch', itch), ('blenderartists', blenderartists), ('reddit', reddit)]:
        try:
            v = fn()
            out[name] = v if v is not None else old.get(name)
        except Exception as e:
            print(f'{name}: {e}', file=sys.stderr)
            out[name] = old.get(name)
    out['links'] = CFG.get('links', {})
    out['quotes'] = CFG.get('quotes', [])
    # Nur schreiben, wenn sich etwas außer der Uhrzeit geändert hat (keine leeren Commits)
    same = {k: v for k, v in out.items() if k != 'updated'} == {k: v for k, v in old.items() if k != 'updated'}
    if same and '--force' not in sys.argv:
        print('unchanged'); return
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('written', json.dumps({k: out[k] for k in ('github', 'itch', 'blenderartists', 'reddit')}))

if __name__ == '__main__':
    main()
