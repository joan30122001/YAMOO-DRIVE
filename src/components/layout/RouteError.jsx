import { Component } from 'react'
import Button from '../ui/Button.jsx'

export function RouteErrorMessage({ onRetry }) {
  return (
    <section role="alert" className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-4 py-24">
      <h1 className="font-display text-3xl font-bold">Impossible de charger cette page</h1>
      <p className="text-silver">Vérifiez votre connexion, puis réessayez.</p>
      <Button variant="outline" onClick={onRetry}>
        Réessayer
      </Button>
    </section>
  )
}

/** Intercepte un échec de chargement de page (réseau coupé, version déployée obsolète). */
export default class RouteError extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    // Garde une trace pour le diagnostic : toute erreur de rendu n'est pas un problème de réseau.
    console.error('Erreur de chargement de page :', error)
  }

  retry = () => {
    // Une nouvelle version déployée invalide les anciens fichiers : on recharge la page.
    window.location.reload()
  }

  render() {
    return this.state.hasError ? <RouteErrorMessage onRetry={this.retry} /> : this.props.children
  }
}
