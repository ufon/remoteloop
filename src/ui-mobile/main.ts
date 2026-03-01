type ClientMessage =
  | { type: 'Move'; dx: number; dy: number }
  | { type: 'Click'; button: 'left' | 'right'; action: 'click' | 'down' | 'up' }
  | { type: 'Scroll'; dx: number; dy: number }
  | { type: 'Ping' }

type ServerMessage =
  | { type: 'Connected' }
  | { type: 'Pong' }
  | { type: 'Error'; message: string }

const touchpad = document.getElementById('touchpad')!
const statusEl = document.getElementById('status')!

// ── WebSocket ─────────────────────────────────────────────────────────────────

let ws: WebSocket

function connect(): void {
  ws = new WebSocket('ws://' + location.host + '/ws')

  ws.onopen = () => {
    statusEl.textContent = 'Connected'
    statusEl.className = 'connected'
  }
  ws.onclose = () => {
    statusEl.textContent = 'Disconnected — reconnecting…'
    statusEl.className = 'disconnected'
    setTimeout(connect, 2000)
  }
  ws.onerror = () => ws.close()
  ws.onmessage = (e: MessageEvent) => {
    const msg = JSON.parse(e.data as string) as ServerMessage
    if (msg.type === 'Connected') {
      statusEl.textContent = 'Connected'
      statusEl.className = 'connected'
    }
  }
}

function send(msg: ClientMessage): void {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
}

// ── Touchpad — Pointer Events API ─────────────────────────────────────────────

// Map from pointerId → last position
const ptrs = new Map<number, { x: number; y: number }>()
let tapStart = 0
let tapMoved = 0

touchpad.addEventListener('pointerdown', (e: PointerEvent) => {
  touchpad.setPointerCapture(e.pointerId)
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (ptrs.size === 1) {
    tapStart = Date.now()
    tapMoved = 0
  }
  touchpad.classList.add('active')
})

touchpad.addEventListener('pointermove', (e: PointerEvent) => {
  if (!ptrs.has(e.pointerId)) return
  const last = ptrs.get(e.pointerId)!
  const dx = e.clientX - last.x
  const dy = e.clientY - last.y
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })

  tapMoved += Math.abs(dx) + Math.abs(dy)

  if (ptrs.size === 1) {
    send({ type: 'Move', dx, dy })
  } else if (ptrs.size === 2) {
    send({ type: 'Scroll', dx: 0, dy: dy * 3 })
  }
})

touchpad.addEventListener('pointerup', (e: PointerEvent) => {
  ptrs.delete(e.pointerId)
  if (ptrs.size === 0) {
    touchpad.classList.remove('active')
    if (Date.now() - tapStart < 250 && tapMoved < 12) {
      send({ type: 'Click', button: 'left', action: 'click' })
    }
  }
})

touchpad.addEventListener('pointercancel', (e: PointerEvent) => {
  ptrs.delete(e.pointerId)
  if (ptrs.size === 0) touchpad.classList.remove('active')
})

// ── Click buttons ─────────────────────────────────────────────────────────────

document.getElementById('btn-left')!.addEventListener('pointerdown', (e) => {
  e.preventDefault()
  send({ type: 'Click', button: 'left', action: 'click' })
})

document.getElementById('btn-right')!.addEventListener('pointerdown', (e) => {
  e.preventDefault()
  send({ type: 'Click', button: 'right', action: 'click' })
})

connect()
