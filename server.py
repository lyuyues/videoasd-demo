#!/usr/bin/env python3
"""VideoASD study server (2026-10-17).

Serves the web demo (index.html = PRR, baseline.html, quiz/) and stores study data
POSTed by the pages to session_data/. Same deployment model as the SENSE server
(SENSE-Unity /web-demo/server.py): home desktop, bound to 127.0.0.1 behind a
Cloudflare tunnel, STUDY_TOKEN gate. No AI endpoints, so no API key needed.

Env: STUDY_TOKEN (unset = open, for local testing), HOST, PORT, USE_HTTPS.
"""

import http.server
import json
import os
import posixpath
import re
import ssl
import time
from http.cookies import SimpleCookie
from urllib.parse import parse_qs, unquote, urlsplit

DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIR, 'session_data')
COOKIE = 'videoasd_k'
MAX_BODY = 50 * 1024 * 1024   # a full session snapshot with gaze points stays far below this

# STUDY_TOKEN set -> every request needs ?k=<token> once (then a cookie). Without it,
# anyone who finds the tunnel hostname could read the pages or write session data.
STUDY_TOKEN = os.environ.get('STUDY_TOKEN', '')
# Never served as static files, token or not: participant data, secrets, code.
BLOCKED_PREFIXES = ('/session_data', '/.git', '/.env', '/__pycache__', '/deploy', '/docs', '/tools')
BLOCKED_SUFFIXES = ('.pem', '.py', '.env', '.pyc', '.sh', '.service', '.yml', '.yaml', '.md')


def _clean(value, default, extra=''):
    s = ''.join(c for c in str(value or '') if c.isalnum() or c in extra)
    return s or default


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
        if not self._guard_static():
            return
        if self.headers.get('Range') and self._serve_range():
            return
        super().do_GET()

    def do_HEAD(self):
        if self._guard_static():
            super().do_HEAD()

    def _serve_range(self):
        # iOS Safari won't play <video> from a server that ignores Range
        # (SimpleHTTPRequestHandler always answers 200 with the whole file).
        m = re.match(r'bytes=(\d*)-(\d*)$', self.headers['Range'].strip())
        path = self.translate_path(self.path)
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

    # ---------- data sink ----------
    def do_POST(self):
        if not self._authorized():
            self._deny(403, 'forbidden')
            return
        if urlsplit(self.path).path.rstrip('/').endswith('/api/save-session'):
            self._save_session()
        else:
            self._deny(404, 'Not found')

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
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
            tmp = os.path.join(DATA_DIR, fname + '.tmp')
            with open(tmp, 'w', encoding='utf-8') as f:
                json.dump(body, f, ensure_ascii=False, indent=1)
            os.replace(tmp, os.path.join(DATA_DIR, fname))   # atomic: never a half-written file
            print(f'saved {fname}', flush=True)
            self._json(200, {'status': 'ok', 'file': fname})
        except Exception as e:  # noqa: BLE001 -- report any failure to the page
            print(f'save error: {e}', flush=True)
            self._json(500, {'error': str(e)})

    def end_headers(self):
        if getattr(self, '_set_token_cookie', False):
            self.send_header('Set-Cookie', f'{COOKIE}={STUDY_TOKEN}; Path=/; Max-Age=15552000; SameSite=Lax; HttpOnly')
            self._set_token_cookie = False
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
