#!/usr/bin/env bash
# Standalone heartbeat + online/offline logger for OKX agent #6282.
# Run in foreground:  bash heartbeat-loop.sh
# Run in background:  nohup bash heartbeat-loop.sh >/root/logs/heartbeat-loop.out 2>&1 &
# Stop background:    pkill -f heartbeat-loop.sh

set -uo pipefail

ONCHAINOS="/root/.local/bin/onchainos"
AGENT_ID="6282"
CHAIN_INDEX="196"
INTERVAL_SEC="60"          # how often to ping — 60s matches the official daemon
LOG_FILE="/root/logs/agent-status.log"
STATE_FILE="/root/logs/agent-status.state"

mkdir -p /root/logs
prev="unknown"
[ -f "$STATE_FILE" ] && prev=$(cat "$STATE_FILE")

echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') heartbeat-loop started (interval=${INTERVAL_SEC}s)" >> "$LOG_FILE"

while true; do
  if "$ONCHAINOS" agent heartbeat --chain-index "$CHAIN_INDEX" >/dev/null 2>&1; then
    result=$("$ONCHAINOS" agent get-agents --agent-ids "$AGENT_ID" 2>/dev/null)
    online=$(echo "$result" | python3 -c "
import json,sys
try:
    print(json.load(sys.stdin)['data'][0]['onlineStatus'])
except Exception:
    print('unknown')
" 2>/dev/null)

    if [ "$online" != "$prev" ]; then
      ts=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
      case "$online" in
        1) echo "$ts ONLINE (agent #$AGENT_ID came back online)" >> "$LOG_FILE" ;;
        0) echo "$ts OFFLINE (agent #$AGENT_ID went offline)" >> "$LOG_FILE" ;;
        *) echo "$ts UNKNOWN status=$online" >> "$LOG_FILE" ;;
      esac
      echo "$online" > "$STATE_FILE"
      prev="$online"
    fi
  else
    echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') HEARTBEAT_FAILED (network or session issue)" >> "$LOG_FILE"
  fi

  sleep "$INTERVAL_SEC"
done
