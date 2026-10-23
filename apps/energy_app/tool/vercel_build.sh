#!/usr/bin/env bash
# Vercel has no Flutter, so fetch the pinned SDK and build the web app.
set -euo pipefail
FLUTTER_VERSION=3.47.7
if [ ! -x .flutter/bin/flutter ]; then
  git clone --depth 1 --branch "$FLUTTER_VERSION" https://github.com/flutter/flutter.git .flutter
fi
export PATH="$PWD/.flutter/bin:$PATH"
flutter config --no-analytics >/dev/null
flutter pub get
flutter build web --release --no-web-resources-cdn
