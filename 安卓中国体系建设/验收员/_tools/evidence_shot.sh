#!/usr/bin/env bash
# evidence_shot.sh — 真机证据采集一条龙：adb 截图 → png 落盘 → Windows OCR → txt 落盘
# 用法: bash evidence_shot.sh <场景目录> <证据名> [延迟秒]
# 例:   bash evidence_shot.sh A1-cloudrelay A1-01-set-relay
# 产出: MOV真机测验数据/<日期>/<场景目录>/<证据名>.png + <证据名>.ocr.txt
set -u
ADB="/c/Users/Administrator/platform-tools/platform-tools/adb.exe"
DEV="21770d7d"
BASE="C:/Users/Administrator/Desktop/MOV/工单流转中心/验收员"
TOOLS="$BASE/_tools"
DAY=$(date +%F)
SCENE="$1"
NAME="$2"
WAIT="${3:-1}"
OUTDIR="$BASE/$DAY/$SCENE"
mkdir -p "$OUTDIR"

echo "═══ 证据采集: $SCENE/$NAME ═══"
"$ADB" -s "$DEV" shell input keyevent KEYCODE_WAKEUP
sleep 1
[ "$WAIT" -gt 1 ] && sleep "$((WAIT-1))"
"$ADB" -s "$DEV" exec-out screencap -p > "$OUTDIR/$NAME.png"
echo "📸 截图: $OUTDIR/$NAME.png"
python "$TOOLS/ocr_shot.py" "$OUTDIR/$NAME.png"
echo "✅ 证据就绪: $OUTDIR/$NAME.png + $OUTDIR/$NAME.png.ocr.txt"
