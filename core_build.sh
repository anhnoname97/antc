#!/usr/bin/env bash
# =============================================================================
# core_build.sh - Build lai core Umbraco tu src/ANTC.Portal.Core -> feed noi bo
#                 (src/ANTC.Portal.Lib/Build.Core) -> App nhan core moi.
# Ban bash cua core_build.ps1 (macOS/Linux/Git Bash). Chi chay khi da SUA core.
#
#   ./core_build.sh
#   ./core_build.sh --build-spa                    # build lai backoffice/login (can Node)
#   ./core_build.sh --version 18.2.1-antc.20261101 # dong dau version phat hanh
# =============================================================================
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
ROOT="$(pwd)"
CORE="$ROOT/src/ANTC.Portal.Core"
SLN="$CORE/umbraco.sln"
FEED="$ROOT/src/ANTC.Portal.Lib/Build.Core"
APP="$ROOT/src/ANTC.Portal.App"
BUILD_PROPS="$APP/Directory.Build.props"
STATIC="$CORE/src/Umbraco.Cms.StaticAssets/wwwroot/umbraco"

VERSION=""; BUILD_SPA=0; SKIP_VALIDATE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="$2"; shift 2 ;;
    --build-spa) BUILD_SPA=1; shift ;;
    --skip-validate) SKIP_VALIDATE=1; shift ;;
    *) echo "Tham so khong biet: $1"; exit 1 ;;
  esac
done
[ -f "$SLN" ] || { echo "Khong thay $SLN"; exit 1; }

if [ -z "$VERSION" ]; then
  VERSION=$(grep -oE '<UmbracoCoreVersion[^>]*>[^<]+</UmbracoCoreVersion>' "$BUILD_PROPS" | sed -E 's/<[^>]+>//g' | tr -d '[:space:]')
  [ -n "$VERSION" ] || { echo "Khong doc duoc UmbracoCoreVersion tu $BUILD_PROPS"; exit 1; }
else
  sed -i.bak -E "s#(<UmbracoCoreVersion[^>]*>)[^<]+(</UmbracoCoreVersion>)#\1${VERSION}\2#" "$BUILD_PROPS" && rm -f "$BUILD_PROPS.bak"
  echo "==> Da dat UmbracoCoreVersion = $VERSION"
fi
echo "==> Core version: $VERSION"

if [ "$BUILD_SPA" = "1" ]; then
  echo "==> Xoa backoffice/login da build de build lai..."
  rm -rf "$STATIC/backoffice" "$STATIC/login"
fi

echo "==> Pack core -> feed..."
mkdir -p "$FEED"
rm -f "$FEED"/*.nupkg "$FEED"/*.snupkg 2>/dev/null || true
dotnet pack "$SLN" -c Release -o "$FEED" -p:Version="$VERSION" -p:EnablePackageValidation=false -p:IncludeSymbols=false --verbosity minimal

echo "==> Xoa cache NuGet cua version $VERSION..."
NUGET_CACHE="$HOME/.nuget/packages"
if [ -d "$NUGET_CACHE" ]; then
  find "$NUGET_CACHE" -maxdepth 1 -iname "umbraco.cms*" -type d | while read -r d; do
    if [ -d "$d/$VERSION" ]; then rm -rf "$d/$VERSION"; fi
  done
fi

if [ "$SKIP_VALIDATE" != "1" ]; then
  echo "==> Restore + build App..."
  ( cd "$APP" && dotnet restore ANTC.Portal.App.slnx --force --verbosity quiet && dotnet build ANTC.Portal.App.slnx -c Release --no-restore --verbosity minimal )
  echo "==> BUILD OK - App dang dung core $VERSION"
fi
