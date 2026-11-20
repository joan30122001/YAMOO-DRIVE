import Button from '../components/ui/Button.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import PageMeta from '../components/ui/PageMeta.jsx'
import seo from '../data/seo.js'

/** Affichée à `/vehicules/:slug` quand le véhicule n'existe pas : renvoie vers le catalogue. */
export default function VehicleNotFound() {
  return (
    <>
      <PageMeta title={seo.vehicleNotFound.title} description={seo.vehicleNotFound.description} />
      <PageHero title="Véhicule introuvable" accent="introuvable" intro="Ce véhicule n'existe pas ou n'est plus proposé.">
        <div className="mt-6">
          <Button to="/vehicules">Retour au catalogue</Button>
        </div>
      </PageHero>
    </>
  )
}
