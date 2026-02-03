import type { SoundEvent } from '@/logic/TetrisEngine'

const SAMPLE_RATE = 44100

/** Build WAV file bytes (PCM 16-bit mono) for one or more tone segments */
function buildWav(
  segments: { freq: number; duration: number; type?: 'sine' | 'square' }[]
): ArrayBuffer {
  let numSamples = 0
  for (const s of segments) {
    numSamples += Math.round(SAMPLE_RATE * s.duration)
  }
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)
  const samples = new Int16Array(buffer, 44, numSamples)

  let offset = 0
  for (const seg of segments) {
    const freq = seg.freq
    const duration = seg.duration
    const type = seg.type ?? 'sine'
    const n = Math.round(SAMPLE_RATE * duration)
    for (let i = 0; i < n; i++) {
      const t = (offset + i) / SAMPLE_RATE
      const phase = 2 * Math.PI * freq * t
      const val =
        type === 'square'
          ? (Math.sin(phase) >= 0 ? 0.2 : -0.2)
          : Math.sin(phase) * 0.2
      samples[offset + i] = Math.max(
        -32768,
        Math.min(32767, Math.floor(val * 32768))
      )
    }
    offset += n
  }

  const dataLength = numSamples * 2
  view.setUint32(0, 0x52494646, false)
  view.setUint32(4, 36 + dataLength, true)
  view.setUint32(8, 0x57415645, false)
  view.setUint32(12, 0x666d7420, false)
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  view.setUint32(36, 0x64617461, false)
  view.setUint32(40, dataLength, true)

  return buffer
}

type Segment = { freq: number; duration: number; type?: 'sine' | 'square' }

const SOUNDS: Record<SoundEvent, Segment[]> = {
  drop: [{ freq: 180, duration: 0.06 }],
  rotate: [
    { freq: 264, duration: 0.04 },
    { freq: 330, duration: 0.03 },
  ],
  move: [{ freq: 200, duration: 0.025, type: 'sine' }],
  softdrop: [{ freq: 120, duration: 0.02, type: 'sine' }],
  harddrop: [
    { freq: 80, duration: 0.08 },
    { freq: 60, duration: 0.1 },
  ],
  levelup: [
    { freq: 523, duration: 0.08 },
    { freq: 659, duration: 0.08 },
    { freq: 784, duration: 0.08 },
    { freq: 1047, duration: 0.15 },
  ],
  lineclear: [
    { freq: 440, duration: 0.08 },
    { freq: 554, duration: 0.1 },
  ],
  lineclear1: [
    { freq: 440, duration: 0.08 },
    { freq: 554, duration: 0.1 },
  ],
  lineclear2: [
    { freq: 440, duration: 0.07 },
    { freq: 554, duration: 0.07 },
    { freq: 659, duration: 0.12 },
  ],
  lineclear3: [
    { freq: 440, duration: 0.06 },
    { freq: 554, duration: 0.06 },
    { freq: 659, duration: 0.06 },
    { freq: 784, duration: 0.14 },
  ],
  lineclear4: [
    { freq: 523, duration: 0.07 },
    { freq: 659, duration: 0.07 },
    { freq: 784, duration: 0.07 },
    { freq: 1047, duration: 0.2 },
  ],
  gameover: [
    { freq: 200, duration: 0.25 },
    { freq: 160, duration: 0.25 },
    { freq: 120, duration: 0.4 },
  ],
  click: [{ freq: 400, duration: 0.03 }],
  start: [
    { freq: 523, duration: 0.08 },
    { freq: 659, duration: 0.08 },
    { freq: 784, duration: 0.12 },
  ],
}

const urlCache: Partial<Record<SoundEvent, string>> = {}

function getBlobUrl(id: SoundEvent): string {
  const cached = urlCache[id]
  if (cached) return cached
  const segments = SOUNDS[id] ?? [{ freq: 300, duration: 0.05 }]
  const buffer = buildWav(segments)
  const blob = new Blob([buffer], { type: 'audio/wav' })
  const url = URL.createObjectURL(blob)
  urlCache[id] = url
  return url
}

/**
 * Play sound via HTML Audio + Blob URL.
 * Must be called directly from a user gesture (click/keydown/touchend).
 */
export function playSound(id: SoundEvent, muted: boolean): void {
  if (muted) return
  try {
    const url = getBlobUrl(id)
    const audio = new Audio(url)
    audio.volume = 0.4
    const p = audio.play()
    if (p !== undefined) p.catch(() => {})
  } catch {
    // ignore
  }
}

export function resumeAudio(): void {
  // No-op; kept for API compatibility
}

export async function loadSound(_id: SoundEvent, _url: string): Promise<void> {}
export function playMusic(_url: string, _muted: boolean): void {}
export function stopMusic(): void {}
export function setMasterVolume(_volume: number): void {}
