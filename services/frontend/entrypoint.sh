#!/bin/busybox sh
set -eu

BB="/bin/busybox"
CONFIG_PATH="/usr/share/nginx/html/config.js"
MAPBOX_TOKEN="${MAPBOX_ACCESS_TOKEN:-}"
API_BASE_URL="${PUBLIC_API_BASE_URL:-http://api.photo.local}"

if [ -z "$MAPBOX_TOKEN" ]; then
  echo "MAPBOX_ACCESS_TOKEN environment variable is required" >&2
  exit 1
fi

escape_js() {
  printf '%s' "$1" | "$BB" sed 's/\\/\\\\/g; s/"/\\"/g'
}

"$BB" cat >"$CONFIG_PATH" <<EOF
window.__APP_CONFIG__ = {
  mapboxToken: "$(escape_js "$MAPBOX_TOKEN")",
  apiBaseUrl: "$(escape_js "$API_BASE_URL")"
};
EOF

exec /usr/sbin/nginx -g "daemon off;"
