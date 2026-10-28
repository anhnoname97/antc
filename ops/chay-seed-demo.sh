#!/usr/bin/env bash
# =============================================================================
# chay-seed-demo.sh - Goi ops/chay-seed-demo.ps1 tu Git Bash tren Windows (cung tham so, dang PowerShell).
#
#   ./ops/chay-seed-demo.sh -Reset -PreDraw 2
#
# Agent chay lenh qua Git Bash va khong goi duoc powershell truc tiep, nen khai file nay (khong phai .ps1)
# trong cau hinh du an neu muon agent chay duoc buoc nap du lieu demo.
# =============================================================================
set -euo pipefail
exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(dirname "${BASH_SOURCE[0]}")/chay-seed-demo.ps1" "$@"
