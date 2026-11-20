import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PRELOAD_TIMEOUT_MS, startApp } from './startApp.js'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('startApp : le préchargement précède le rendu', () => {
  it('précharge la page de l’adresse courante PUIS rend, une seule fois', async () => {
    const order = []
    const preload = vi.fn(async (pathname) => {
      order.push(`préchargement ${pathname}`)
    })
    const render = vi.fn(() => order.push('rendu'))

    await startApp({ pathname: '/vehicules', render, preload })

    expect(preload).toHaveBeenCalledTimes(1)
    expect(preload).toHaveBeenCalledWith('/vehicules')
    expect(render).toHaveBeenCalledTimes(1)
    expect(order).toEqual(['préchargement /vehicules', 'rendu'])
  })

  it('attend la fin du préchargement : pas de rendu tant que la page n’est pas arrivée', async () => {
    let release
    const preload = () => new Promise((resolve) => (release = resolve))
    const render = vi.fn()

    const started = startApp({ pathname: '/', render, preload })
    await vi.advanceTimersByTimeAsync(PRELOAD_TIMEOUT_MS - 1)
    expect(render).not.toHaveBeenCalled()

    release()
    await started
    expect(render).toHaveBeenCalledTimes(1)
  })
})

describe('startApp : jamais de page blanche', () => {
  it('un chargement qui ne se termine jamais n’empêche pas le rendu (délai maximal)', async () => {
    const render = vi.fn()
    const started = startApp({ pathname: '/', render, preload: () => new Promise(() => {}) })

    await vi.advanceTimersByTimeAsync(PRELOAD_TIMEOUT_MS)
    await started
    expect(render).toHaveBeenCalledTimes(1)
  })

  it('le délai maximal est de 3 secondes et personnalisable', async () => {
    expect(PRELOAD_TIMEOUT_MS).toBe(3000)
    const render = vi.fn()
    const started = startApp({ pathname: '/', render, preload: () => new Promise(() => {}), timeoutMs: 50 })
    await vi.advanceTimersByTimeAsync(50)
    await started
    expect(render).toHaveBeenCalledTimes(1)
  })

  it('un préchargement qui échoue (promesse rejetée) n’empêche pas le rendu', async () => {
    const render = vi.fn()
    await startApp({ pathname: '/', render, preload: async () => Promise.reject(new Error('réseau coupé')) })
    expect(render).toHaveBeenCalledTimes(1)
  })

  it('un préchargement qui lève une exception synchrone n’empêche pas le rendu', async () => {
    const render = vi.fn()
    await startApp({
      pathname: '/%E0%A4%A',
      render,
      preload: () => {
        throw new URIError('adresse mal encodée')
      },
    })
    expect(render).toHaveBeenCalledTimes(1)
  })

  it('le minuteur est annulé quand le préchargement réussit (aucun minuteur en attente)', async () => {
    await startApp({ pathname: '/', render: () => {}, preload: async () => {} })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('utilise le vrai préchargement par défaut, sans lever d’erreur sur une adresse mal encodée', async () => {
    vi.useRealTimers()
    const render = vi.fn()
    await expect(startApp({ pathname: '/%E0%A4%A', render })).resolves.toBeUndefined()
    expect(render).toHaveBeenCalledTimes(1)
  })
})
