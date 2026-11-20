// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import useMotionPolicy from './useMotionPolicy.js'

let listeners
let reducedNow
function mockMatchMedia(reduced) {
  listeners = new Set()
  reducedNow = reduced
  window.matchMedia = (query) => ({
    get matches() {
      return query.includes('prefers-reduced-motion') ? reducedNow : false
    },
    media: query,
    addEventListener: (_t, fn) => listeners.add(fn),
    removeEventListener: (_t, fn) => listeners.delete(fn),
  })
}

function setNavigator(values) {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(navigator, key, { value, configurable: true })
  }
}

const original = {}
beforeEach(() => {
  for (const key of ['hardwareConcurrency', 'deviceMemory', 'connection']) {
    original[key] = Object.getOwnPropertyDescriptor(navigator, key)
  }
  setNavigator({ hardwareConcurrency: 8, deviceMemory: 8, connection: undefined })
  mockMatchMedia(false)
})
afterEach(() => {
  cleanup()
  for (const [key, descriptor] of Object.entries(original)) {
    if (descriptor) Object.defineProperty(navigator, key, descriptor)
    else delete navigator[key]
  }
})

describe('useMotionPolicy', () => {
  it('appareil standard : ni reduced ni lowPower', () => {
    const { result } = renderHook(() => useMotionPolicy())
    expect(result.current).toEqual({ reduced: false, lowPower: false })
  })

  it('prefers-reduced-motion: reduce -> reduced', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useMotionPolicy())
    expect(result.current.reduced).toBe(true)
    expect(result.current.lowPower).toBe(false)
  })

  it.each([
    ['hardwareConcurrency', { hardwareConcurrency: 4 }],
    ['deviceMemory', { deviceMemory: 2 }],
    ['saveData', { connection: { saveData: true } }],
  ])('%s -> lowPower', (_name, values) => {
    setNavigator(values)
    const { result } = renderHook(() => useMotionPolicy())
    expect(result.current.lowPower).toBe(true)
    expect(result.current.reduced).toBe(false)
  })

  it('réagit en direct à un changement de préférence', () => {
    const { result } = renderHook(() => useMotionPolicy())
    expect(result.current.reduced).toBe(false)
    act(() => {
      reducedNow = true
      listeners.forEach((fn) => fn())
    })
    expect(result.current.reduced).toBe(true)
  })

  it('se désabonne au démontage', () => {
    const { unmount } = renderHook(() => useMotionPolicy())
    expect(listeners.size).toBe(1)
    unmount()
    expect(listeners.size).toBe(0)
  })

  it('sans matchMedia : reduced = false, sans erreur', () => {
    delete window.matchMedia
    const { result } = renderHook(() => useMotionPolicy())
    expect(result.current.reduced).toBe(false)
  })
})
