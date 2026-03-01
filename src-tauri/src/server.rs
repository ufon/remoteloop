use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use std::sync::Arc;
use tauri::Emitter;
use tauri_plugin_notification::NotificationExt;

use crate::{
    input::InputHandler,
    mobile_page,
    protocol::{ClientMessage, ServerMessage},
};

pub async fn run_server<R: tauri::Runtime>(port: u16, app: tauri::AppHandle<R>) {
    let (input_tx, input_rx) = std::sync::mpsc::channel::<ClientMessage>();

    // InputHandler on a dedicated OS thread (enigo may be !Send).
    // If initialisation fails on macOS the user likely hasn't granted
    // Accessibility access — surface a notification with guidance.
    #[cfg(target_os = "macos")]
    let app_for_thread = app.clone();
    std::thread::spawn(move || {
        let mut handler = match InputHandler::new() {
            Ok(h) => h,
            Err(e) => {
                eprintln!("remoteloop: input init failed: {e}");
                #[cfg(target_os = "macos")]
                app_for_thread
                    .notification()
                    .builder()
                    .title("remoteloop — Accessibility Required")
                    .body("Grant Accessibility access in System Settings → Privacy & Security → Accessibility, then restart.")
                    .show()
                    .ok();
                return;
            }
        };
        while let Ok(msg) = input_rx.recv() {
            handler.handle(msg);
        }
    });

    let input_tx = Arc::new(input_tx);

    let router = Router::new()
        .route("/", get(serve_mobile_page))
        .route(
            "/ws",
            get({
                let input_tx = input_tx.clone();
                let app = app.clone();
                move |ws: WebSocketUpgrade| {
                    let input_tx = input_tx.clone();
                    let app = app.clone();
                    async move {
                        ws.on_upgrade(move |socket| handle_socket(socket, input_tx, app))
                    }
                }
            }),
        );

    let addr = format!("0.0.0.0:{}", port);
    let listener = match tokio::net::TcpListener::bind(&addr).await {
        Ok(l) => l,
        Err(e) => {
            eprintln!("remoteloop: failed to bind port {port}: {e}");
            app.notification()
                .builder()
                .title("remoteloop — Port In Use")
                .body(&format!(
                    "Port {port} is already in use. Close the conflicting app and restart remoteloop."
                ))
                .show()
                .ok();
            return;
        }
    };
    println!("remoteloop server listening on http://{}", addr);

    axum::serve(listener, router).await.unwrap();
}

async fn serve_mobile_page() -> impl IntoResponse {
    Html(mobile_page::MOBILE_HTML)
}

async fn handle_socket<R: tauri::Runtime>(
    mut socket: WebSocket,
    input_tx: Arc<std::sync::mpsc::Sender<ClientMessage>>,
    app: tauri::AppHandle<R>,
) {
    // Send connected message to phone
    let connected = serde_json::to_string(&ServerMessage::Connected).unwrap();
    let _ = socket.send(Message::Text(connected.into())).await;

    // Notify QR window and show OS notification
    let _ = app.emit("phone-connected", ());
    app.notification()
        .builder()
        .title("remoteloop")
        .body("Phone connected")
        .show()
        .ok();

    while let Some(Ok(msg)) = socket.recv().await {
        match msg {
            Message::Text(text) => {
                match serde_json::from_str::<ClientMessage>(&text) {
                    Ok(client_msg) => {
                        if matches!(client_msg, ClientMessage::Ping) {
                            let pong = serde_json::to_string(&ServerMessage::Pong).unwrap();
                            let _ = socket.send(Message::Text(pong.into())).await;
                        } else {
                            let _ = input_tx.send(client_msg);
                        }
                    }
                    Err(e) => {
                        let err = ServerMessage::Error {
                            message: format!("Invalid message: {}", e),
                        };
                        let _ = socket
                            .send(Message::Text(serde_json::to_string(&err).unwrap().into()))
                            .await;
                    }
                }
            }
            Message::Close(_) => break,
            _ => {}
        }
    }
}
