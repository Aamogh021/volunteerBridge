#!/bin/bash

# Exit on error
set -e

# 1. Install Flutter if not exists
if [ ! -d "flutter" ]; then
  echo "Installing Flutter..."
  git clone https://github.com/flutter/flutter.git -b stable --depth 1
fi

# 2. Add Flutter to PATH
export PATH="$PATH:`pwd`/flutter/bin"

# 3. Enable Web
flutter config --enable-web

# 4. Get dependencies
flutter pub get

# 5. Build Web
flutter build web --release --base-href /
