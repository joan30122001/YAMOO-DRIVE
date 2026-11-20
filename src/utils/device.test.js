import { describe, expect, it } from 'vitest'
import { detectLowPower } from './device.js'

describe('detectLowPower', () => {
  it.each([
    [{ hardwareConcurrency: 4 }, true],
    [{ hardwareConcurrency: 2 }, true],
    [{ deviceMemory: 4 }, true],
    [{ deviceMemory: 0.5 }, true],
    [{ connection: { saveData: true } }, true],
  ])('%j -> %s (faible puissance)', (info, expected) => {
    expect(detectLowPower(info)).toBe(expected)
  })

  it.each([
    [{ hardwareConcurrency: 8, deviceMemory: 8 }],
    [{ hardwareConcurrency: 5 }],
    [{ deviceMemory: 8 }],
    [{ connection: { saveData: false } }],
    [{ connection: {} }],
    [{}],
    [undefined],
    [null],
  ])('%j -> false (puissance suffisante ou inconnue)', (info) => {
    expect(detectLowPower(info)).toBe(false)
  })

  it('ignore les valeurs invalides', () => {
    expect(detectLowPower({ hardwareConcurrency: 0, deviceMemory: -1 })).toBe(false)
    expect(detectLowPower({ hardwareConcurrency: NaN, deviceMemory: '2' })).toBe(false)
  })

  it('un seul critère suffit', () => {
    expect(detectLowPower({ hardwareConcurrency: 16, deviceMemory: 2 })).toBe(true)
    expect(detectLowPower({ hardwareConcurrency: 16, deviceMemory: 16, connection: { saveData: true } })).toBe(true)
  })
})
