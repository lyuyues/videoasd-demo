#!/usr/bin/env python3
"""VideoASD study server (2026-10-17).

Serves the web demo (index.html = PRR, baseline.html, quiz/) and stores study data
POSTed by the pages to session_data/. Same deployment model as the SENSE server
(SENSE-Unity /web-demo/server.py): home desktop, bound to 127.0.0.1 behind a
Cloudflare tunnel, STUDY_TOKEN gate. No AI endpoints, so no API key needed.

/studio/ (2026-10-20) forwards to the expert generation studio (VIDEOASD-backend/
expert_ui.py) running separately on 127.0.0.1, behind the same token, so a
researcher can demo scene authoring from the iPad. The API key lives with the
studio process, never here. Its clips are served straight from disk (with Range,
for iOS) rather than through the proxy.

Env: STUDY_TOKEN (unset = open, for local testing), HOST, PORT, USE_HTTPS,
     STUDIO_URL (default http://127.0.0.1:5055), STUDIO_VIDEOS (studio's videos/ dir).
"""

import hashlib
import http.server
import json
import os
import posixpath
import re
import ssl
import threading
import time
import urllib.error
import urllib.request
from http.cookies import SimpleCookie
from urllib.parse import parse_qs, unquote, urlsplit

DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIR, 'session_data')
# Threaded server: the page's autosave and its pagehide beacon can land together.
# Both used to write the same .tmp (one 500'd) and the older could win the replace.
_save_lock = threading.Lock()
COOKIE = 'videoasd_k'
MAX_BODY = 50 * 1024 * 1024   # a full session snapshot with gaze points stays far below this

# STUDY_TOKEN set -> every request needs ?k=<token> once (then a cookie). Without it,
# anyone who finds the tunnel hostname could read the pages or write session data.
STUDY_TOKEN = os.environ.get('STUDY_TOKEN', '')
# Never served as static files, token or not: participant data, secrets, code.
BLOCKED_PREFIXES = ('/session_data', '/.git', '/.env', '/__pycache__', '/deploy', '/docs', '/tools')
BLOCKED_SUFFIXES = ('.pem', '.py', '.env', '.pyc', '.sh', '.service', '.yml', '.yaml', '.md')
STUDIO_URL = os.environ.get('STUDIO_URL', 'http://127.0.0.1:5055').rstrip('/')
STUDIO_VIDEOS = os.environ.get('STUDIO_VIDEOS', '')
# Loopback only: never route the studio call through an http_proxy from the env.
_studio_opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def _clean(value, default, extra=''):
    s = ''.join(c for c in str(value or '') if c.isalnum() or c in extra)
    return s or default


# ---------- offline package (2026-10-28) ----------
# offline.js downloads every file listed here into the iPad's Cache Storage and sw.js
# serves the study from it, so a slow or dropped connection never stalls a clip.
# The list is built from disk on each request, so it always matches what is deployed;
# `version` is a hash over every file's sha, so any changed byte shows up as an update.
OFFLINE_DIRS = ('assets/videos/clips/', 'assets/videos/reward/', 'assets/aoi/', 'assets/zones/',
                'assets/scene_art/', 'assets/actions/', 'assets/vendor/')
OFFLINE_PAGES = ('index.html', 'baseline.html', 'backup.html', 'style.css')
# FilesetResolver picks the SIMD build, or nosimd on old iPads; the *_module_* build is unused.
OFFLINE_MEDIAPIPE = ('face_landmarker.task', 'vision_wasm_internal.js', 'vision_wasm_internal.wasm',
                     'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm')
OFFLINE_SKIP = ('.DS_Store', '.nextcloud', '_noaudio.mp4', '_backup.html', '.md', '.py')
_sha_cache = {}   # path -> ((size, mtime_ns), sha)


def _file_sha(path):
    st = os.stat(path)
    sig = (st.st_size, st.st_mtime_ns)
    hit = _sha_cache.get(path)
    if hit and hit[0] == sig:
        return hit[1], st.st_size
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(1 << 20):
            h.update(chunk)
    _sha_cache[path] = (sig, h.hexdigest())
    return _sha_cache[path][1], st.st_size


def offline_manifest():
    rels = set(OFFLINE_PAGES) | {f'assets/mediapipe/{n}' for n in OFFLINE_MEDIAPIPE}
    rels |= {n for n in os.listdir(DIR) if n.endswith('.js') and n != 'sw.js'}
    loose = []   # other assets/ files: only those some page or script names (skips old drafts)
    for root, dirs, files in os.walk(os.path.join(DIR, 'assets')):
        dirs[:] = [d for d in dirs if not d.startswith(('.', 'archive', 'kaykit')) and d != 'mediapipe']
        for n in files:
            rel = os.path.relpath(os.path.join(root, n), DIR).replace(os.sep, '/')
            (rels.add if rel.startswith(OFFLINE_DIRS) else loose.append)(rel)
    for d in ('quiz', 'recognition_check'):
        for root, dirs, files in os.walk(os.path.join(DIR, d)):
            rels |= {os.path.relpath(os.path.join(root, n), DIR).replace(os.sep, '/') for n in files}
    rels = {r for r in rels if not r.endswith(OFFLINE_SKIP) and os.path.isfile(os.path.join(DIR, r))}
    text = ''.join(open(os.path.join(DIR, r), encoding='utf-8', errors='ignore').read()
                   for r in rels if r.endswith(('.html', '.js')))
    # Whole name only: 'happy.png' must not ride along on 'sam_happy.png'.
    rels |= {r for r in loose if not r.endswith(OFFLINE_SKIP)
             and re.search(r'(?<![\w-])' + re.escape(posixpath.basename(r)), text)}
    files = []
    for rel in sorted(rels):
        sha, size = _file_sha(os.path.join(DIR, rel))
        files.append({'url': rel, 'sha': sha, 'size': size})
    version = hashlib.sha256(''.join(f['url'] + f['sha'] for f in files).encode()).hexdigest()[:12]
    built = max(os.stat(os.path.join(DIR, f['url'])).st_mtime for f in files)
    return {'version': version, 'built': time.strftime('%Y-%m-%d %H:%M', time.localtime(built)), 'files': files}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIR, **kwargs)

    # ---------- access control ----------
    def _authorized(self):
        if not STUDY_TOKEN:
            return True
        if parse_qs(urlsplit(self.path).query).get('k', [''])[0] == STUDY_TOKEN:
            self._set_token_cookie = True
            return True
        c = SimpleCookie(self.headers.get('Cookie', ''))
        return COOKIE in c and c[COOKIE].value == STUDY_TOKEN

    def _deny(self, code, msg):
        body = msg.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def _guard_static(self):
        raw = unquote(urlsplit(self.path).path).lower()
        # Normalise (collapse //, /./, ..) before matching.
        path = posixpath.normpath('/' + raw.lstrip('/'))
        if raw.endswith('/') and path != '/':
            path += '/'
        if path.startswith(BLOCKED_PREFIXES) or path.endswith(BLOCKED_SUFFIXES) or '/.' in path or '/.' in raw:
            self._deny(404, 'Not found')
            return False
        if not self._authorized():
            self._deny(403, '需要访问口令：请使用研究团队提供的完整链接打开。')
            return False
        return True

    # ---------- static files ----------
    def do_GET(self):
        if self._is_studio():
            return self._studio()
        if not self._guard_static():
            return
        p = urlsplit(self.path).path
        if p == '/offline-manifest.json':
            return self._json(200, offline_manifest(), no_store=True)
        # The worker and the sync code must never come from a stale cache (browser or
        # Cloudflare), or an iPad could keep checking against an old file list.
        self._no_store = p in ('/sw.js', '/offline.js')
        if self.headers.get('Range') and self._serve_range():
            return
        super().do_GET()

    def do_HEAD(self):
        if self._guard_static():
            super().do_HEAD()

    def _serve_range(self, path=None):
        # iOS Safari won't play <video> from a server that ignores Range
        # (SimpleHTTPRequestHandler always answers 200 with the whole file).
        m = re.match(r'bytes=(\d*)-(\d*)$', self.headers['Range'].strip())
        path = path or self.translate_path(self.path)
        if not m or not os.path.isfile(path):
            return False
        size = os.path.getsize(path)
        a, b = m.groups()
        if a == '':  # suffix range: last N bytes
            start, end = max(0, size - int(b or 0)), size - 1
        else:
            start, end = int(a), min(int(b) if b else size - 1, size - 1)
        if start >= size or start > end:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return True
        length = end - start + 1
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(length))
        self.end_headers()
        try:
            with open(path, 'rb') as f:
                f.seek(start)
                while length > 0:
                    chunk = f.read(min(65536, length))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    length -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass  # player aborted the request (seek) -- normal
        return True

    # ---------- expert studio (/studio/) ----------
    def _is_studio(self):
        p = urlsplit(self.path).path
        return p == '/studio' or p.startswith('/studio/')

    def _studio(self):
        if not self._authorized():
            return self._deny(403, '需要访问口令：请使用研究团队提供的完整链接打开。')
        u = urlsplit(self.path)
        if u.path == '/studio':   # the page fetches relative URLs, so it needs the slash
            self.send_response(301)
            self.send_header('Location', '/studio/' + (f'?{u.query}' if u.query else ''))
            self.send_header('Content-Length', '0')
            return self.end_headers()
        if u.path.startswith('/studio/clips/') and STUDIO_VIDEOS:
            return self._studio_clip(unquote(u.path[len('/studio/clips/'):]))
        body = None
        if self.command == 'POST':
            n = int(self.headers.get('Content-Length') or 0)
            if not 0 <= n <= 1024 * 1024:
                return self._deny(413, 'too large')
            body = self.rfile.read(n)
        req = urllib.request.Request(STUDIO_URL + u.path[len('/studio'):] + (f'?{u.query}' if u.query else ''),
                                     data=body, method=self.command,
                                     headers={'Content-Type': self.headers.get('Content-Type', 'application/json')})
        try:
            with _studio_opener.open(req, timeout=120) as r:   # /complete waits on the LLM
                code, ctype, data = r.status, r.headers.get('Content-Type', 'application/octet-stream'), r.read()
        except urllib.error.HTTPError as e:
            code, ctype, data = e.code, e.headers.get('Content-Type', 'text/plain'), e.read()
        except (urllib.error.URLError, OSError):
            return self._deny(502, '制作工具没有运行（台式机上的 videoasd-studio 服务）。')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)

    def _studio_clip(self, rel):
        root = os.path.realpath(STUDIO_VIDEOS)
        path = os.path.realpath(os.path.join(root, rel))
        if not (path.startswith(root + os.sep) and path.endswith('.mp4') and os.path.isfile(path)):
            return self._deny(404, 'Not found')
        if self.headers.get('Range') and self._serve_range(path):
            return
        size = os.path.getsize(path)
        self.send_response(200)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(size))
        self.end_headers()
        try:
            with open(path, 'rb') as f:
                while chunk := f.read(65536):
                    self.wfile.write(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass

    # ---------- data sink ----------
    def do_POST(self):
        if self._is_studio():
            return self._studio()
        if not self._authorized():
            self._deny(403, 'forbidden')
            return
        if urlsplit(self.path).path.rstrip('/').endswith('/api/save-session'):
            self._save_session()
        else:
            self._deny(404, 'Not found')

    def _json(self, code, obj, no_store=False):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        if no_store:
            self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def _save_session(self):
        # One file per (kind, participant, condition, session); each newer snapshot of
        # the same session overwrites the last, so the file is always the latest state.
        # kind: 'system' (index.html / baseline.html) or 'quiz' (quiz/*.html).
        try:
            length = int(self.headers.get('Content-Length') or 0)
            if not 0 < length <= MAX_BODY:
                return self._json(413, {'error': 'bad length'})
            body = json.loads(self.rfile.read(length))
            kind = _clean(body.get('kind'), 'data')
            pid = _clean(body.get('participantId'), 'NO-PID', '-_')
            cond = _clean(body.get('condition'), 'unknown', '-_')
            session = _clean(body.get('sessionId'), str(int(time.time() * 1000)), '_')
            fname = f'videoasd-{kind}-{pid}-{cond}-{session}.json'
            os.makedirs(DATA_DIR, exist_ok=True)
            path = os.path.join(DATA_DIR, fname)
            with _save_lock:
                # Snapshots of one session only grow; never let an older one replace a newer.
                # savedAt is an ISO timestamp from the same device, so strings compare in order.
                if os.path.exists(path):
                    try:
                        with open(path, encoding='utf-8') as f:
                            prev = json.load(f).get('savedAt') or ''
                    except (OSError, ValueError):
                        prev = ''
                    if prev and str(body.get('savedAt') or '') < prev:
                        print(f'kept newer {fname}', flush=True)
                        return self._json(200, {'status': 'ok', 'file': fname, 'kept': 'newer'})
                tmp = path + '.tmp'
                with open(tmp, 'w', encoding='utf-8') as f:
                    json.dump(body, f, ensure_ascii=False, indent=1)
                os.replace(tmp, path)   # atomic: never a half-written file
            print(f'saved {fname}', flush=True)
            self._json(200, {'status': 'ok', 'file': fname})
        except Exception as e:  # noqa: BLE001 -- report any failure to the page
            print(f'save error: {e}', flush=True)
            self._json(500, {'error': str(e)})

    def end_headers(self):
        if getattr(self, '_set_token_cookie', False):
            self.send_header('Set-Cookie', f'{COOKIE}={STUDY_TOKEN}; Path=/; Max-Age=15552000; SameSite=Lax; HttpOnly')
            self._set_token_cookie = False
        if getattr(self, '_no_store', False):
            self.send_header('Cache-Control', 'no-store')
            self._no_store = False
        super().end_headers()


def main():
    port = int(os.environ.get('PORT', 8767))
    use_https = os.environ.get('USE_HTTPS', '0') != '0'
    # HOST=127.0.0.1 behind a tunnel: reachable only via the tunnel, not the LAN.
    host = os.environ.get('HOST', '127.0.0.1')
    server = http.server.ThreadingHTTPServer((host, port), Handler)
    cert, key = os.path.join(DIR, 'cert.pem'), os.path.join(DIR, 'key.pem')
    if use_https and os.path.exists(cert) and os.path.exists(key):
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(cert, key)
        server.socket = ctx.wrap_socket(server.socket, server_side=True)
        print(f'HTTPS server at https://{host}:{port}', flush=True)
    else:
        print(f'HTTP server at http://{host}:{port}' + (' (token required)' if STUDY_TOKEN else ''), flush=True)
    server.serve_forever()


if __name__ == '__main__':
    main()
