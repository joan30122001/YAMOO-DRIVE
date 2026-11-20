import { describe, expect, it } from 'vitest'
import { duration, ease, stagger, transition } from './motion.js'

describe('transition', () => {
  it('durée nulle quand les animations sont réduites', () => {
    expect(transition(true)).toEqual({ duration: 0 })
    expect(transition(true, { delay: 1, d: 5 })).toEqual({ duration: 0 })
  })

  it('transition animée sinon, avec options personnalisables', () => {
    expect(transition(false)).toEqual({ duration: duration.base, ease: ease.out, delay: 0 })
    expect(transition(false, { delay: 0.1, d: duration.slow })).toEqual({
      duration: duration.slow,
      ease: ease.out,
      delay: 0.1,
    })
  })
})

describe('stagger', () => {
  it('décale chaque élément après le délai de base', () => {
    expect(stagger(0)).toBe(duration.fast)
    expect(stagger(2)).toBeCloseTo(duration.fast + 0.12)
    expect(stagger(1)).toBeGreaterThan(stagger(0))
  })
})
