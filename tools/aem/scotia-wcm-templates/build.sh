#!/usr/bin/env bash
# Builds scotia:scotia-wcm-templates and optionally installs it. Filters: /conf/scotia/settings/wcm (replace),
# /content/experience-fragments/scotia and /content/scotia/metadata (merge: only adds missing nodes, never
# overwrites authored XF / metadata content). Independent of scotia:scotia-xwalk-content.
#   tools/aem/scotia-wcm-templates/build.sh             # -> import-work/ue/scotia-wcm-templates-1.1.0.zip
#   tools/aem/scotia-wcm-templates/build.sh --install   # + upload/install on AEM_URL (default 4802)
set -euo pipefail
SRC="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$SRC/../../.." && pwd)"
AEM_URL="${AEM_URL:-http://localhost:4802}"
AUTH="${AEM_USER:-admin}:${AEM_PASS:-admin}"
OUT="$REPO/import-work/ue/scotia-wcm-templates-1.1.0.zip"

mkdir -p "$(dirname "$OUT")"
rm -f "$OUT"
(cd "$SRC" && zip -qr -X "$OUT" META-INF jcr_root -x '*.DS_Store')
echo "Package: $OUT"

if [ "${1:-}" = "--install" ]; then
  curl -sS -u "$AUTH" -F "file=@$OUT" -F "force=true" -F "install=true" \
    "$AEM_URL/crx/packmgr/service.jsp" | grep -o '<status code="[0-9]*">[^<]*' || true
fi
