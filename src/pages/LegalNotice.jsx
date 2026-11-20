import LegalPage, { ConfigValue } from '../components/ui/LegalPage.jsx'
import agencyConfig from '../data/agency.config.js'
import seo from '../data/seo.js'

const legal = agencyConfig.legal ?? {}

const IDENTITY = [
  ['Nom commercial', agencyConfig.name],
  ['Raison sociale', legal.companyName],
  ['Immatriculation (RCCM / NIU)', legal.registration],
  ['Directeur de la publication', legal.publisher],
  ['Adresse', agencyConfig.address],
  ['E-mail', agencyConfig.email],
  ['Téléphone', agencyConfig.phone],
  ['Hébergeur du site', legal.host],
]

const SECTIONS = [
  {
    id: 'editeur',
    title: 'Éditeur du site',
    content: (
      <dl className="divide-y divide-line border-y border-line">
        {IDENTITY.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr]">
            <dt className="text-silver">{label}</dt>
            <dd>
              <ConfigValue value={value} />
            </dd>
          </div>
        ))}
      </dl>
    ),
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    content: (
      <p>
        Le nom, le logo et les contenus du site appartiennent à {agencyConfig.name} ou à leurs titulaires respectifs. Toute
        reproduction sans autorisation est interdite.
      </p>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Informations et responsabilité',
    content: (
      <p>
        Les tarifs, disponibilités et caractéristiques des véhicules sont indicatifs. Seule la réponse de l’agence fait foi. Le
        site peut contenir des liens vers des réseaux sociaux dont {agencyConfig.name} ne contrôle pas le contenu.
      </p>
    ),
  },
]

export default function LegalNotice() {
  return (
    <LegalPage
      meta={seo.legalNotice}
      title="Mentions légales"
      accent="légales"
      intro="Qui édite ce site et comment joindre l’agence."
      sections={SECTIONS}
    />
  )
}
