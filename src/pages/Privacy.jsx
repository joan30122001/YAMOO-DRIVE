import LegalPage from '../components/ui/LegalPage.jsx'
import agencyConfig from '../data/agency.config.js'
import seo from '../data/seo.js'

const SECTIONS = [
  {
    id: 'donnees',
    title: 'Données que vous saisissez',
    content: (
      <>
        <p>
          Les formulaires de réservation et de contact vous demandent les informations nécessaires à votre demande : nom, e-mail
          ou téléphone, dates, ville de prise en charge, message.
        </p>
        <p>
          Ces informations servent uniquement à préparer le message que vous envoyez à l’agence par WhatsApp ou par e-mail. Le site
          ne les enregistre pas : elles ne sont transmises que lorsque vous envoyez vous-même le message.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies et suivi',
    content: <p>Le site n’utilise ni cookie publicitaire ni outil de mesure d’audience.</p>,
  },
  {
    id: 'tiers',
    title: 'Services tiers',
    content: (
      <p>
        Une fois dans WhatsApp, votre messagerie ou un réseau social, les règles de ces services s’appliquent. {agencyConfig.name}{' '}
        conserve les échanges reçus le temps nécessaire pour répondre à votre demande.
      </p>
    ),
  },
  {
    id: 'droits',
    title: 'Vos droits',
    content: (
      <p>
        Vous pouvez demander l’accès, la correction ou la suppression des informations que vous avez transmises à l’agence en
        écrivant à {agencyConfig.email || 'l’agence'} depuis la page Contact.
      </p>
    ),
  },
]

export default function Privacy() {
  return (
    <LegalPage
      meta={seo.privacy}
      title="Politique de confidentialité"
      accent="confidentialité"
      intro="Ce que devient ce que vous saisissez sur le site."
      sections={SECTIONS}
    />
  )
}
