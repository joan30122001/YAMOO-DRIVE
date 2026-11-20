import Button from '../components/ui/Button.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import PageMeta from '../components/ui/PageMeta.jsx'
import seo from '../data/seo.js'

export default function NotFound() {
  return (
    <>
      <PageMeta title={seo.notFound.title} description={seo.notFound.description} />
      <PageHero title="Page introuvable" accent="introuvable" intro="Cette page n'existe pas ou a été déplacée.">
        <div className="mt-6">
          <Button to="/">Retour à l'accueil</Button>
        </div>
      </PageHero>
    </>
  )
}
