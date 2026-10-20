#!/usr/bin/env bash
# One-time setup of the expert generation studio on the study desktop (2026-10-20).
# The studio (VIDEOASD-backend/expert_ui.py) is a demo for teachers, reached from
# the study link at /studio/ (server.py forwards it, same token). It is not part of
# the study: the PRR app never loads its scenes on the study link.
#
# Before running: the studio code + reference/ + a .env holding only GOOGLE_API_KEY
# must already be in $STUDIO_DIR, with a venv at $STUDIO_DIR/.venv (Claude copies
# those over ssh; the key never goes into git).
#
# Run on the desktop:  sudo bash ~/videoasd-demo/deploy/setup_studio.sh
set -euo pipefail
APP_USER=${SUDO_USER:-theresa}
STUDIO_DIR=/home/$APP_USER/videoasd-studio
APP_DIR=/home/$APP_USER/videoasd-demo
say() { printf '\n\033[1;36m%s\033[0m\n' "$*"; }

say "1/4 安装 ffmpeg（制作工具剪辑视频要用）"
command -v ffmpeg >/dev/null || { apt-get update -qq && apt-get install -y -qq ffmpeg; }

say "2/4 制作工具服务 videoasd-studio"
[ -f "$STUDIO_DIR/expert_ui.py" ] && [ -x "$STUDIO_DIR/.venv/bin/python" ] || { echo "缺少 $STUDIO_DIR 或 venv"; exit 1; }
cat > /etc/systemd/system/videoasd-studio.service <<UNIT
[Unit]
Description=VideoASD expert generation studio (demo, /studio/ behind the study server)
After=network-online.target

[Service]
User=$APP_USER
WorkingDirectory=$STUDIO_DIR
Environment=STUDIO_HOST=127.0.0.1
Environment=STUDIO_PORT=5055
Environment=STUDIO_GENERATE=1
ExecStart=$STUDIO_DIR/.venv/bin/python $STUDIO_DIR/expert_ui.py
Restart=on-failure

[Install]
WantedBy=multi-user.target
UNIT

say "3/4 研究服务器转发 /studio/"
SVC=$(systemctl list-units --type=service --all --no-legend | awk '{print $1}' | while read -r u; do
  systemctl cat "$u" 2>/dev/null | grep -q "$APP_DIR/server.py" && echo "$u"; done | head -1)
[ -n "$SVC" ] || { echo "找不到运行 $APP_DIR/server.py 的服务"; exit 1; }
mkdir -p "/etc/systemd/system/$SVC.d"
cat > "/etc/systemd/system/$SVC.d/studio.conf" <<CONF
[Service]
Environment=STUDIO_URL=http://127.0.0.1:5055
Environment=STUDIO_VIDEOS=$STUDIO_DIR/videos
CONF

say "4/4 启动"
systemctl daemon-reload
systemctl enable --now videoasd-studio
systemctl restart "$SVC"
sleep 2
systemctl --no-pager --lines=0 status videoasd-studio "$SVC" | grep -E "●|Active:"
echo "完成。打开实验链接 → 设置页「制作」，或直接 /studio/"
