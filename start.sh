#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

SESSION="shoppinglist"
PORT="${PORT:-5173}"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is required. Install it (e.g. 'sudo pacman -S tmux') and try again." >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies…"
  npm install
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Attaching to existing '$SESSION' session…"
  exec tmux attach -t "$SESSION"
fi

tmux new-session -d -s "$SESSION" -n dev -x 220 -y 50 \
  "npm run dev -- --port $PORT"

tmux split-window -t "$SESSION:dev" -h -p 40 \
  "vue-tsc -w --noEmit || read -rp 'type-check exited, press enter to close…'"

tmux split-window -t "$SESSION:dev.1" -v -p 50 \
  "echo 'Shell ready in $(pwd)'; exec \${SHELL:-bash}"

tmux select-pane -t "$SESSION:dev.0"
tmux set-option -t "$SESSION" mouse on >/dev/null

exec tmux attach -t "$SESSION"
