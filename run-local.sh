#!/usr/bin/env bash
# =============================================================================
# run-local.sh - Chay website tren may ca nhan (macOS/Linux/Git Bash). Chi can .NET 10 SDK.
#
#   ./run-local.sh               # build App + chay (http://localhost:11000)
#   ./run-local.sh --reset       # xoa CSDL local roi chay -> tao lai tu dau
#   ./run-local.sh --build-core  # da sua code trong src/ANTC.Portal.Core -> build lai core truoc
#   ./run-local.sh --no-run      # chi chuan bi va build
# =============================================================================
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
ROOT="$(pwd)"
APP="$ROOT/src/ANTC.Portal.App"
HOST_DIR="$APP/Umbraco.Web.UI"
LOCAL="$HOST_DIR/appsettings.Local.json"
DEFAULT_PASSWORD="Antc@Local2026"

RESET=0; BUILD_CORE=0; NO_RUN=0
while [ $# -gt 0 ]; do
  case "$1" in
    --reset) RESET=1; shift ;;
    --build-core) BUILD_CORE=1; shift ;;
    --no-run) NO_RUN=1; shift ;;
    *) echo "Tham so khong biet: $1"; exit 1 ;;
  esac
done
step() { echo ""; echo "==> $1"; }

step "Kiem tra .NET SDK"
dotnet --list-sdks | grep -q '^10\.' || { echo "Chua co .NET 10 SDK: https://dotnet.microsoft.com/download/dotnet/10.0"; exit 1; }

if [ ! -f "$LOCAL" ]; then
  step "Tao appsettings.Local.json (chi tren may nay, khong commit)"
  sed "s/__DOI_MAT_KHAU__/$DEFAULT_PASSWORD/" "$HOST_DIR/appsettings.Local.template.json" > "$LOCAL"
fi

if [ "$RESET" = "1" ]; then
  step "Xoa CSDL local"
  rm -rf "$HOST_DIR/umbraco/Data" "$HOST_DIR/umbraco/Logs" "$HOST_DIR/App_Data"
fi

if [ "$BUILD_CORE" = "1" ]; then
  step "Build lai core"
  "$ROOT/core_build.sh" --skip-validate
fi

step "Build App"
( cd "$APP" && dotnet build ANTC.Portal.App.slnx -c Debug --verbosity quiet -nologo )

if [ "$NO_RUN" = "1" ]; then step "Xong (khong chay vi --no-run)"; exit 0; fi

step "Chay website"
echo "  Trang web:   http://localhost:11000"
echo "  Quan tri:    http://localhost:11000/umbraco"
echo "  Tai khoan:   admin@antc.local / $DEFAULT_PASSWORD"
cd "$HOST_DIR" && dotnet run --no-build
