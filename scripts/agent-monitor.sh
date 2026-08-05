#!/usr/bin/env bash
# Polls the OKX agent's online status and logs only state changes (online <-> offline).
# Cheap: one short-lived onchainos call every 5 minutes via systemd timer.

set -euo pipefail

AGENT_ID="6282"
LOG_FILE="/root/logs/agent-status.log"
STATE_FILE="/root/logs/agent-status.state"

ONCHAINOS="/root/.local/bin/onchainos"
result=$("$ONCHAINOS" agent get-agents --agent-ids "$AGENT_ID" 2>/dev/null) || {
  echo "$(date -u '+%Y-%m-%d %H:%M:%S UTC') CHECK_FAILED could not reach onchainos/OKX" >> "$LOG_FILE"
  exit 0
}

online=$(echo "$result" | python3 -c "
import json,sys
try:
    d = json.load(sys.stdin)
    print(d['data'][0]['onlineStatus'])
except Exception:
    print('unknown')
")

prev="unknown"
[ -f "$STATE_FILE" ] && prev=$(cat "$STATE_FILE")

if [ "$online" != "$prev" ]; then
  ts=$(date -u '+%Y-%m-%d %H:%M:%S UTC')
  if [ "$online" = "1" ]; then
    echo "$ts ONLINE (agent #$AGENT_ID came back online)" >> "$LOG_FILE"
  elif [ "$online" = "0" ]; then
    echo "$ts OFFLINE (agent #$AGENT_ID went offline)" >> "$LOG_FILE"
  else
    echo "$ts UNKNOWN status=$online" >> "$LOG_FILE"
  fi
  echo "$online" > "$STATE_FILE"
fi
