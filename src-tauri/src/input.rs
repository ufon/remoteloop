use enigo::{Button, Coordinate, Direction, Enigo, Mouse, Settings};

use crate::protocol::{ClickAction, ClientMessage, MouseButton};

pub struct InputHandler {
    enigo: Enigo,
    sensitivity: f64,
}

impl InputHandler {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            enigo: Enigo::new(&Settings::default()).map_err(|e| e.to_string())?,
            sensitivity: 1.5,
        })
    }

    pub fn handle(&mut self, msg: ClientMessage) {
        match msg {
            ClientMessage::Move { dx, dy } => {
                let dx = (dx * self.sensitivity) as i32;
                let dy = (dy * self.sensitivity) as i32;
                let _ = self.enigo.move_mouse(dx, dy, Coordinate::Rel);
            }
            ClientMessage::Click { button, action } => {
                let btn = match button {
                    MouseButton::Left => Button::Left,
                    MouseButton::Right => Button::Right,
                };
                let dir = match action {
                    ClickAction::Down => Direction::Press,
                    ClickAction::Up => Direction::Release,
                    ClickAction::Click => Direction::Click,
                };
                let _ = self.enigo.button(btn, dir);
            }
            ClientMessage::Scroll { dx: _, dy } => {
                let lines = (dy / 20.0) as i32;
                if lines != 0 {
                    let _ = self.enigo.scroll(lines, enigo::Axis::Vertical);
                }
            }
            ClientMessage::Ping => {}
        }
    }
}
