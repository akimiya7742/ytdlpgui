# Maintainer: akimiya <akimiya7742@github>

pkgname=youtube-downloader-git
pkgver=0
pkgrel=1
pkgdesc="Youtube Downloader using yt-dlp (Tauri GUI)"
arch=('x86_64')
url="https://github.com/akimiya7742/ytdlpgui"
license=('MIT')
depends=(
  'webkit2gtk-4.1'
  'openssl'
  'icu'
  'libnm'
  'yt-dlp'
)
makedepends=(
  'git'
  'cargo'
)
provides=('youtube-downloader')
conflicts=('youtube-downloader')
source=("git+https://github.com/akimiya7742/ytdlpgui.git")
sha256sums=('SKIP')

pkgver() {
  cd "$srcdir/ytdlpgui"
  git describe --long --tags --abbrev=7 2>/dev/null | \
    sed 's/^v//;s/-/./g' || \
    printf "r%s.%s" "$(git rev-list --count HEAD)" "$(git rev-parse --short HEAD)"
}

build() {
  cd "$srcdir/ytdlpgui"

  export NODE_ENV=production
  npm ci --omit=dev

  npx tauri build --release --no-bundle
}

package() {
  cd "$srcdir/ytdlpgui"

  # Detect actual binary name from Cargo.toml
  _binname=$(grep '^name =' src-tauri/Cargo.toml | head -n1 | cut -d '"' -f2)

  install -Dm755 "src-tauri/target/release/$_binname" \
    "$pkgdir/usr/bin/youtube-downloader"

  install -Dm644 "icons/128x128.png" \
    "$pkgdir/usr/share/icons/hicolor/128x128/apps/youtube-downloader.png"

  install -Dm644 LICENSE \
    "$pkgdir/usr/share/licenses/$pkgname/LICENSE"

  install -dm755 "$pkgdir/usr/share/applications"

  cat <<EOF > "$pkgdir/usr/share/applications/youtube-downloader.desktop"
[Desktop Entry]
Name=YT Downloader
Comment=Youtube Downloader using yt-dlp
Exec=/usr/bin/youtube-downloader
Icon=youtube-downloader
Terminal=false
Type=Application
Categories=Network;Video;
EOF
}
