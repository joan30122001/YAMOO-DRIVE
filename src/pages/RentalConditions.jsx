import LegalPage, { ConfigValue } from '../components/ui/LegalPage.jsx'
import agencyConfig from '../data/agency.config.js'
import seo from '../data/seo.js'

const rental = agencyConfig.rental ?? {}

const TERMS = [
  ['Caution', rental.deposit],
  ['Kilométrage', rental.mileage],
  ['Carburant', rental.fuel],
]

const SECTIONS = [
  {
    id: 'demande',
    title: 'Une demande, pas une réservation',
    content: (
      <p>
        Le site prépare votre demande et l’envoie à l’agence sur WhatsApp. Une demande n’est acceptée qu’après la réponse de
        l’agence, qui confirme la disponibilité du véhicule et le tarif. Les prix affichés sont indicatifs, en FCFA.
      </p>
    ),
  },
  {
    id: 'conducteur',
    title: 'Conducteur et documents',
    content: (
      <>
        <p>Un permis de conduire valide est exigé pour la location sans chauffeur.</p>
        <p>L’agence peut demander d’autres documents au moment de la remise du véhicule.</p>
      </>
    ),
  },
  {
    id: 'modalites',
    title: 'Caution, kilométrage et carburant',
    content: (
      <>
        <p>Ces conditions sont fixées par l’agence et valables pour tous les véhicules, sauf indication contraire sur la fiche.</p>
        <dl className="divide-y divide-line border-y border-line">
          {TERMS.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="text-silver">{label}</dt>
              <dd>
                <ConfigValue value={value} />
              </dd>
            </div>
          ))}
        </dl>
      </>
    ),
  },
  {
    id: 'chauffeur',
    title: 'Avec ou sans chauffeur',
    content: (
      <p>
        Lorsque le véhicule le permet, vous choisissez dans votre demande la location avec ou sans chauffeur. Le supplément
        chauffeur est indiqué sur la fiche du véhicule.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Une question ?',
    content: <p>Pour toute précision avant de réserver, contactez l’agence depuis la page Contact.</p>,
  },
]

export default function RentalConditions() {
  return (
    <LegalPage
      meta={seo.conditions}
      title="Conditions de location"
      accent="location"
      intro="Ce qu’il faut savoir avant d’envoyer votre demande."
      sections={SECTIONS}
    />
  )
}
