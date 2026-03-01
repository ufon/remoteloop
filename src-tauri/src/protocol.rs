use serde::{Deserialize, Serialize};

/// Messages sent from the phone to the desktop
#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    Move { dx: f64, dy: f64 },
    Click { button: MouseButton, action: ClickAction },
    Scroll { #[allow(dead_code)] dx: f64, dy: f64 },
    Ping,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MouseButton {
    Left,
    Right,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ClickAction {
    Down,
    Up,
    Click,
}

/// Messages sent from the desktop to the phone
#[derive(Debug, Serialize)]
#[serde(tag = "type")]
pub enum ServerMessage {
    Connected,
    Pong,
    Error { message: String },
}
