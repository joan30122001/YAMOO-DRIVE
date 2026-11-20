import { describe, expect, it, vi } from 'vitest'

// matchPath simulé en échec : aucune adresse réelle ne le fait lever, mais le démarrage ne doit jamais en dépendre.
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal()),
  matchPath: () => {
    throw new Error('motif de route invalide')
  },
}))

describe('preloadRoute : jamais d’exception, même si la recherche de route échoue', () => {
  it('renvoie null au lieu de lever (le démarrage ne dépend pas de matchPath)', async () => {
    const { preloadRoute } = await import('./preloadRoute.js')
    await expect(preloadRoute('/vehicules')).resolves.toBeNull()
  })

  it('startApp rend quand même l’application', async () => {
    const { startApp } = await import('./startApp.js')
    const render = vi.fn()
    await startApp({ pathname: '/vehicules', render })
    expect(render).toHaveBeenCalledTimes(1)
  })
})
