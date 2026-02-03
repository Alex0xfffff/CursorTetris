import { useEffect, useRef } from 'react'
import type { TetrisEngine, SoundEvent } from '@/logic/TetrisEngine'
import { resumeAudio } from '@/utils/audio'

export function useGameInput(
  engineRef: React.RefObject<TetrisEngine | null>,
  enabled: boolean,
  onSound?: (event: SoundEvent) => void
): void {
  const downHeld = useRef(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const onSoundRef = useRef(onSound)
  onSoundRef.current = onSound

  useEffect(() => {
    if (!enabled) return
    const engine = engineRef.current
    if (!engine) return
    const play = (e: SoundEvent) => onSoundRef.current?.(e)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      resumeAudio()
      const state = engine.getState()
      if (state.gameOver) {
        if (e.code === 'KeyR') {
          e.preventDefault()
          engine.restart()
        }
        return
      }
      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault()
          play('move')
          engine.move(-1)
          break
        case 'ArrowRight':
          e.preventDefault()
          play('move')
          engine.move(1)
          break
        case 'ArrowDown':
          e.preventDefault()
          if (!downHeld.current) {
            downHeld.current = true
            engine.setFastDrop(true)
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          play('rotate')
          engine.rotate()
          break
        case 'Space':
          e.preventDefault()
          play('harddrop')
          engine.hardDrop()
          break
        case 'KeyP':
          e.preventDefault()
          play('click')
          engine.togglePause()
          break
        case 'KeyR':
          e.preventDefault()
          engine.restart()
          break
        default:
          break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        e.preventDefault()
        downHeld.current = false
        engineRef.current?.setFastDrop(false)
      }
    }

    const SWIPE_THRESHOLD = 40
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) {
        touchStartX.current = t.clientX
        touchStartY.current = t.clientY
      }
    }
    const handleTouchEnd = (e: TouchEvent) => {
      resumeAudio()
      const t = e.changedTouches[0]
      if (!t || engine.getState().gameOver) return
      const dx = t.clientX - touchStartX.current
      const dy = t.clientY - touchStartY.current
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > SWIPE_THRESHOLD) {
          play('move')
          engine.move(1)
        } else if (dx < -SWIPE_THRESHOLD) {
          play('move')
          engine.move(-1)
        }
      } else {
        if (dy > SWIPE_THRESHOLD) {
          engine.setFastDrop(true)
          setTimeout(() => engineRef.current?.setFastDrop(false), 400)
        } else if (dy < -SWIPE_THRESHOLD) {
          play('rotate')
          engine.rotate()
        }
      }
    }

    let gamepadPoll = 0
    let lastGamepadMove = 0
    const GAMEPAD_THROTTLE = 120
    const pollGamepad = (now: number) => {
      const pads = navigator.getGamepads?.()
      if (!pads) {
        gamepadPoll = requestAnimationFrame(pollGamepad)
        return
      }
      for (let i = 0; i < pads.length; i++) {
        const pad = pads[i]
        if (!pad) continue
        const state = engine.getState()
        if (state.gameOver) {
          if (pad.buttons[0]?.pressed) engine.restart()
          gamepadPoll = requestAnimationFrame(pollGamepad)
          return
        }
        if (now - lastGamepadMove > GAMEPAD_THROTTLE) {
          const axisX = pad.axes[0] ?? 0
          const axisY = pad.axes[1] ?? 0
          if (axisX < -0.5) {
            play('move')
            engine.move(-1)
            lastGamepadMove = now
          } else if (axisX > 0.5) {
            play('move')
            engine.move(1)
            lastGamepadMove = now
          }
          if (axisY > 0.5) engine.setFastDrop(true)
          else if (axisY < -0.5) {
            play('rotate')
            engine.rotate()
            lastGamepadMove = now
          }
        }
        if (pad.buttons[0]?.pressed) {
          play('harddrop')
          engine.hardDrop()
        }
        if (pad.buttons[1]?.pressed) {
          play('rotate')
          engine.rotate()
        }
        if (pad.buttons[9]?.pressed) {
          play('click')
          engine.togglePause()
        }
      }
      gamepadPoll = requestAnimationFrame(pollGamepad)
    }
    if (navigator.getGamepads) {
      gamepadPoll = requestAnimationFrame(pollGamepad)
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    window.addEventListener('keyup', handleKeyUp, { capture: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('keyup', handleKeyUp, { capture: true })
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      if (gamepadPoll) cancelAnimationFrame(gamepadPoll)
      downHeld.current = false
      engineRef.current?.setFastDrop(false)
    }
  }, [enabled, engineRef])
}
