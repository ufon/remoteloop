# remoteloop

A Tauri v2 desktop app that turns your phone into a wireless touchpad/mouse for your PC.

## How It Works

1. App starts silently in the system tray
2. Left-click tray icon → opens a small window with a QR code
3. Phone scans QR → opens a touch-enabled web page served from the PC
4. Phone sends touch events over WebSocket → desktop simulates mouse movement and clicks
5. Right-click tray icon → Quit

## Architecture

```
[Phone browser]                     [PC - Tauri app]
  mobile/index.html  ←── HTTP ───   axum server :9876
  touch events       ──── WS ────→  WebSocket handler
                                         │
                                    InputHandler (enigo)
                                         │
                                    move mouse / click
```

## Project Structure

```
remoteloop/
├── dist/
│   └── index.html          # Desktop QR viewer (shown in Tauri window)
├── mobile/
│   └── index.html          # Mobile touchpad page (embedded in binary via include_str!)
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs           # Tauri setup: tray icon, QR generation, server spawn
│   │   ├── main.rs          # Entry point — calls lib::run()
│   │   ├── server.rs        # axum HTTP + WebSocket server
│   │   ├── input.rs         # Mouse simulation wrapper (enigo)
│   │   ├── protocol.rs      # WebSocket message types (serde)
│   │   └── mobile_page.rs   # include_str! of mobile/index.html
│   ├── capabilities/
│   │   └── default.json     # Tauri IPC permissions for "qr-window"
│   ├── Cargo.toml
│   ├── tauri.conf.json      # Tray-only mode, no default window
│   └── build.rs
├── Cargo.toml               # Workspace root (resolver = "2")
└── CLAUDE.md
```

## Key Crates

| Crate | Purpose |
|-------|---------|
| `tauri` v2 | Desktop app shell, system tray, webview window |
| `axum` v0.8 | HTTP server (serves mobile page) + WebSocket handler |
| `enigo` v0.6 | Cross-platform mouse/keyboard simulation |
| `qrcode` v0.14 | Generates QR code as SVG string |
| `local-ip-address` | Detects the machine's LAN IP |
| `tokio` | Async runtime (shared with Tauri) |

## WebSocket Protocol

All messages are JSON with a `"type"` discriminant field.

**Phone → Desktop:**
```json
{ "type": "Move", "dx": 12.5, "dy": -3.0 }
{ "type": "Click", "button": "left", "action": "click" }
{ "type": "Scroll", "dx": 0, "dy": -50 }
{ "type": "Ping" }
```

**Desktop → Phone:**
```json
{ "type": "Connected" }
{ "type": "Pong" }
{ "type": "Error", "message": "..." }
```

## Build & Run

**Requirements:** Rust (stable-x86_64-pc-windows-msvc) + VS Build Tools with C++ workload.

```bash
# Dev mode (hot reload on src-tauri changes)
cargo tauri dev

# Production build
cargo tauri build
```

Cargo and tauri-cli are installed at `C:\Users\apast\.cargo\bin\`.

## Configuration

- **Server port:** `9876` — defined as `SERVER_PORT` in `src-tauri/src/lib.rs`
- **Mouse sensitivity:** `1.5×` multiplier — defined in `src-tauri/src/input.rs`
- **Window size:** 320×400px — set in `WebviewWindowBuilder` in `lib.rs`

## Notes

- Windows Firewall will prompt on first run — allow access for the app to be reachable on LAN
- No authentication — anyone on the same Wi-Fi can connect (by design for simplicity)
- The mobile page is embedded in the binary at compile time (`include_str!`), so no external files needed at runtime
- The axum server binds to `0.0.0.0:9876` but the QR code encodes the specific LAN IP
