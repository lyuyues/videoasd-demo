#!/usr/bin/env bash
# One-shot setup of the VideoASD study server on the home Linux desktop (systemd),
# exposed at https://<hostname> through Cloudflare Tunnel — same model as SENSE
# (SENSE-Unity /web-demo/deploy/setup_linux.sh).
#
#   bash deploy/setup_linux.sh videoasd.example.com
#
# If the SENSE tunnel is already set up on this machine, VideoASD is added to it as a
# second hostname (one cloudflared service, two ingress rules). Otherwise a new tunnel
# is created. Safe to re-run: every step checks whether it's already done.
set -euo pipefail

HOSTNAME_PUBLIC="${1:?usage: bash deploy/setup_linux.sh <hostname, e.g. videoasd.example.com>}"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_USER="$(id -un)"
PORT=8767                       # SENSE uses 8766
SERVICE=videoasd-server
ENV_FILE="$APP_DIR/deploy/study.env"
CF_CONFIG=/etc/cloudflared/config.yml

say() { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m!! %s\033[0m\n' "$*"; exit 1; }

# --- 1. Python (stdlib only, no venv needed) ----------------------------------
say "1/6 检查 python3"
command -v python3 >/dev/null || die "需要 python3 (sudo apt install python3)"
[ -f "$APP_DIR/server.py" ] || die "找不到 $APP_DIR/server.py"
[ -d "$APP_DIR/assets/videos" ] || die "找不到视频目录 $APP_DIR/assets/videos"

# --- 2. Access token + runtime config ----------------------------------------
say "2/6 访问口令"
if [ ! -f "$ENV_FILE" ]; then
  TOKEN="$(python3 -c 'import secrets; print(secrets.token_urlsafe(12))')"
  cat > "$ENV_FILE" <<EOF
STUDY_TOKEN=$TOKEN
HOST=127.0.0.1
PORT=$PORT
USE_HTTPS=0
EOF
  chmod 600 "$ENV_FILE"
fi
TOKEN="$(grep '^STUDY_TOKEN=' "$ENV_FILE" | cut -d= -f2-)"
mkdir -p "$APP_DIR/session_data" && chmod 700 "$APP_DIR/session_data"

# --- 3. systemd service --------------------------------------------------------
say "3/6 开机自启服务 $SERVICE"
sudo tee /etc/systemd/system/$SERVICE.service >/dev/null <<EOF
[Unit]
Description=VideoASD study server
After=network-online.target
Wants=network-online.target

[Service]
User=$RUN_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/env python3 $APP_DIR/server.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now $SERVICE
sudo systemctl restart $SERVICE
sleep 2
curl -fs -o /dev/null "http://127.0.0.1:$PORT/index.html?k=$TOKEN" \
  || die "server.py 没起来: journalctl -u $SERVICE -n 50"

# --- 4. cloudflared ----------------------------------------------------------
say "4/6 安装 cloudflared"
if ! command -v cloudflared >/dev/null; then
  if command -v apt-get >/dev/null; then
    ARCH="$(dpkg --print-architecture)"
    curl -fsSL -o /tmp/cloudflared.deb \
      "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-$ARCH.deb"
    sudo dpkg -i /tmp/cloudflared.deb
  else
    die "非 Debian/Ubuntu：请手动安装 cloudflared 后重跑 (https://pkg.cloudflare.com)"
  fi
fi
[ -f "$HOME/.cloudflared/cert.pem" ] || { echo "需要登录一次 Cloudflare：用浏览器打开下面的链接并选择你的域名授权。"; cloudflared tunnel login; }

# --- 5. Tunnel: reuse SENSE's if present, else create one --------------------
say "5/6 Cloudflare 隧道 → https://$HOSTNAME_PUBLIC"
if sudo test -f "$CF_CONFIG"; then
  TUNNEL_ID="$(sudo awk '/^tunnel:/ {print $2}' "$CF_CONFIG")"
  [ -n "$TUNNEL_ID" ] || die "$CF_CONFIG 里没有 tunnel: 行"
  echo "沿用已有隧道 $TUNNEL_ID（SENSE），加一条 $HOSTNAME_PUBLIC 规则"
  if ! sudo grep -q "hostname: $HOSTNAME_PUBLIC\$" "$CF_CONFIG"; then
    # Insert our rule before the catch-all "- service: http_status:404".
    sudo cp "$CF_CONFIG" "$CF_CONFIG.bak.$(date +%s)"
    sudo python3 - "$CF_CONFIG" "$HOSTNAME_PUBLIC" "$PORT" <<'PY'
import sys
path, host, port = sys.argv[1], sys.argv[2], sys.argv[3]
lines = open(path).read().splitlines()
rule = [f"  - hostname: {host}", f"    service: http://127.0.0.1:{port}"]
idx = next((i for i, l in enumerate(lines) if l.strip() == "- service: http_status:404"), None)
if idx is None:
    sys.exit("config.yml has no catch-all '- service: http_status:404' rule")
lines[idx:idx] = rule
open(path, "w").write("\n".join(lines) + "\n")
PY
  fi
  cloudflared tunnel route dns "$TUNNEL_ID" "$HOSTNAME_PUBLIC" || true  # already-exists is fine
else
  TUNNEL_NAME=videoasd-study
  cloudflared tunnel list 2>/dev/null | grep -qw "$TUNNEL_NAME" || cloudflared tunnel create "$TUNNEL_NAME"
  TUNNEL_ID="$(cloudflared tunnel list 2>/dev/null | awk -v n="$TUNNEL_NAME" '$2==n {print $1}')"
  [ -n "$TUNNEL_ID" ] || die "找不到隧道 $TUNNEL_NAME"
  cloudflared tunnel route dns "$TUNNEL_NAME" "$HOSTNAME_PUBLIC" || true
  sudo mkdir -p /etc/cloudflared
  sudo cp "$HOME/.cloudflared/$TUNNEL_ID.json" /etc/cloudflared/
  sudo tee "$CF_CONFIG" >/dev/null <<EOF
tunnel: $TUNNEL_ID
credentials-file: /etc/cloudflared/$TUNNEL_ID.json
ingress:
  - hostname: $HOSTNAME_PUBLIC
    service: http://127.0.0.1:$PORT
  - service: http_status:404
EOF
  systemctl list-unit-files | grep -q '^cloudflared.service' || sudo cloudflared service install
fi
sudo systemctl restart cloudflared
sudo systemctl enable cloudflared >/dev/null

# --- 6. Never sleep ----------------------------------------------------------
say "6/6 关闭睡眠/休眠（实验期间台机必须一直在线）"
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target >/dev/null

say "完成。等 ~30 秒 DNS 生效后测试："
cat <<EOF

  互动视频 (PRR):   https://$HOSTNAME_PUBLIC/index.html?k=$TOKEN
  Baseline:         https://$HOSTNAME_PUBLIC/baseline.html?k=$TOKEN
  Quiz:             https://$HOSTNAME_PUBLIC/quiz/index.html?k=$TOKEN
                    (另外三个: make_friends_post / join_activity_pre / join_activity_post)

  不带 ?k= 打开应显示"需要访问口令"（403）—— 这是对的。第一次带 ?k= 打开后，
  这台平板会记住口令，之后同一网站的其他页面不用再带。
  数据目录: $APP_DIR/session_data/
  日志:     journalctl -u $SERVICE -f
  口令存放: $ENV_FILE（别提交到 git）

  注意：以后如果重跑 SENSE 的 setup_linux.sh，它会重写 $CF_CONFIG，
  VideoASD 这条规则会被去掉——重跑本脚本即可加回来。

EOF
