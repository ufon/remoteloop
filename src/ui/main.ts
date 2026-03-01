import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

interface QrData {
  svg: string
  url: string
  error?: string
}

function hideWindow(): void {
  invoke('hide_window')
}

async function init(): Promise<void> {
  try {
    const data = await invoke<QrData>('get_qr_data')
    if (data.error) {
      const el = document.getElementById('error')!
      el.style.display = 'block'
      el.textContent = data.error
      return
    }
    document.getElementById('qr-container')!.innerHTML = data.svg
    document.getElementById('url-text')!.textContent = data.url
  } catch (e) {
    const el = document.getElementById('error')!
    el.style.display = 'block'
    el.textContent = 'Error: ' + e
  }
}

document.getElementById('close-btn')!.addEventListener('click', hideWindow)

listen('phone-connected', () => {
  document.getElementById('connected-banner')!.classList.add('show')
  setTimeout(hideWindow, 2000)
})

init()
