#!/usr/bin/env bash
# Lean-session wrapper: run a noisy command, keep the full log, print a short summary.
# Usage: scripts/quiet.sh <label> -- <command...>   (TAIL=N to change tail length)
label=${1:?label}; shift; [ "$1" = "--" ] && shift
dir="$(dirname "$0")/../.nfl/quiet-logs"; mkdir -p "$dir"
log="$dir/${label}-$(date +%Y%m%d-%H%M%S).log"
start=$(date +%s); "$@" >"$log" 2>&1; rc=$?; dur=$(( $(date +%s)-start ))
echo "[$label] exit=$rc ${dur}s lines=$(wc -l <"$log") GAP=$(grep -c 'GAP' "$log") ERROR=$(grep -ci 'error' "$log") WARN=$(grep -ci 'warn' "$log")"
echo "[$label] full log: $log"; tail -n "${TAIL:-25}" "$log"; exit $rc
