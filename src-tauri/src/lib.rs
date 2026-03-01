mod input;
mod mobile_page;
mod protocol;
mod server;

use local_ip_address::local_ip;
use tauri::{
    menu::{CheckMenuItemBuilder, MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Manager, PhysicalPosition, WebviewUrl, WebviewWindowBuilder,
};
use tauri_plugin_autostart::ManagerExt;

const SERVER_PORT: u16 = 9876;

#[derive(Clone, serde::Serialize)]
struct QrData {
    svg: String,
    url: String,
    error: Option<String>,
}

#[tauri::command]
fn get_qr_data(state: tauri::State<'_, QrData>) -> QrData {
    state.inner().clone()
}

#[tauri::command]
fn hide_window(window: tauri::WebviewWindow) {
    let _ = window.hide();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(|app| {
            // 1. Discover LAN IP — graceful fallback if offline
            let qr_data = match local_ip() {
                Ok(ip) => {
                    let url = format!("http://{}:{}", ip, SERVER_PORT);
                    let qr_code = qrcode::QrCode::new(url.as_bytes()).unwrap();
                    let svg = qr_code
                        .render::<qrcode::render::svg::Color>()
                        .min_dimensions(200, 200)
                        .build();
                    QrData { svg, url, error: None }
                }
                Err(_) => QrData {
                    svg: String::new(),
                    url: String::new(),
                    error: Some(
                        "No network detected. Connect to Wi-Fi and restart.".into(),
                    ),
                },
            };
            app.manage(qr_data);

            // 2. Start axum server
            tauri::async_runtime::spawn(server::run_server(SERVER_PORT, app.handle().clone()));

            // 3. Pre-create the QR window hidden so the WebView finishes
            //    loading before the user ever clicks the tray icon.
            //    This eliminates the race where a freshly-created WebView
            //    fires Focused(false) during initialisation and instantly
            //    hides the window on its very first open.
            let qr_window = WebviewWindowBuilder::new(
                app,
                "qr-window",
                WebviewUrl::App("index.html".into()),
            )
            .title("remoteloop")
            .inner_size(320.0, 400.0)
            .resizable(false)
            .decorations(false)
            .always_on_top(true)
            .skip_taskbar(true)
            .visible(false)
            .build()?;

            // Register focus-loss handler once, while the window is still hidden.
            let win_clone = qr_window.clone();
            qr_window.on_window_event(move |event| {
                if let tauri::WindowEvent::Focused(false) = event {
                    let _ = win_clone.hide();
                }
            });

            // 4. Build tray menu (right-click)
            let is_autostart = app.autolaunch().is_enabled().unwrap_or(false);
            let autostart_item = CheckMenuItemBuilder::new("Launch at Login")
                .id("autostart")
                .checked(is_autostart)
                .build(app)?;
            let sep = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItemBuilder::new("Quit").id("quit").build(app)?;
            let menu = MenuBuilder::new(app)
                .item(&autostart_item)
                .item(&sep)
                .item(&quit_item)
                .build()?;

            // 5. Build system tray
            let autostart_item_clone = autostart_item.clone();
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("remoteloop")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "autostart" => {
                        let mgr = app.autolaunch();
                        let new_state = !mgr.is_enabled().unwrap_or(false);
                        if new_state {
                            mgr.enable().ok();
                        } else {
                            mgr.disable().ok();
                        }
                        let _ = autostart_item_clone.set_checked(new_state);
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    use tauri::tray::{MouseButton, MouseButtonState, TrayIconEvent};
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        position,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("qr-window") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let scale = window.scale_factor().unwrap_or(1.0);
                                let win_w = 320.0_f64;
                                let win_h = 400.0_f64;
                                let x = position.x - win_w * scale / 2.0;
                                // macOS: tray is in the menu bar at the top — drop window down.
                                // Windows/Linux: tray is in the taskbar at the bottom — pop window up.
                                #[cfg(target_os = "macos")]
                                let y = position.y + 8.0;
                                #[cfg(not(target_os = "macos"))]
                                let y = position.y - win_h * scale - 8.0;
                                let _ = window.set_position(PhysicalPosition::new(
                                    x as i32,
                                    y as i32,
                                ));
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_qr_data, hide_window])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app_handle, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();
            }
        });
}
