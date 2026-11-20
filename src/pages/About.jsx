import Cities from '../components/home/Cities.jsx'
import Faq from '../components/home/Faq.jsx'
import FeaturePanel from '../components/home/FeaturePanel.jsx'
import Button from '../components/ui/Button.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import PageMeta from '../components/ui/PageMeta.jsx'
import copy from '../data/copy.js'
import seo from '../data/seo.js'

// Aucun fait sur l'agence n'est inventé (histoire, chiffres, récompenses, avis) : ces cartes décrivent uniquement
// le fonctionnement du site de démonstration.
const REASONS = [
  { title: 'Un large choix', text: 'SUV, berlines, citadines, vans et sportives, à comparer avec des filtres simples.' },
  { title: 'Avec ou sans chauffeur', text: 'Vous indiquez votre choix dans la demande, selon ce que propose le véhicule.' },
  { title: 'Une demande simple', text: 'Un court formulaire, une durée et une estimation calculées sur le site.' },
  { title: 'La réponse de l’agence', text: 'Votre demande est envoyée sur WhatsApp ; elle n’est acceptée qu’après la réponse de l’agence.' },
]

export default function About() {
  return (
    <>
      <PageMeta title={seo.about.title} description={seo.about.description} />
      <PageHero
        title="À propos de YAMOO DRIVE"
        accent="YAMOO DRIVE"
        intro="Une expérience de location de véhicules pensée pour être claire : choisir, préciser, envoyer."
        image="/vehicles/jetour-x90-plus-lg.webp"
      />

      <section aria-labelledby="approche" className="mt-16 overflow-hidden bg-brand-deep">
        <div className="mx-auto grid max-w-[1400px] items-center gap-16 px-4 py-24 md:grid-cols-2 md:py-32 lg:px-[11vw]">
          <div className="relative mx-auto w-full max-w-md md:mx-0">
            <span aria-hidden="true" className="absolute -top-6 left-10 h-full w-full bg-ivory/10" />
            <img
              src="/images/portrait.webp"
              alt="Pick-up JMC vu de l’arrière devant une ville"
              width="900"
              height="1200"
              loading="lazy"
              decoding="async"
              className="relative aspect-[3/4] w-full object-cover"
            />
          </div>
          <div className="md:pl-8">
            <p className="text-[0.6875rem] tracking-[0.1em] text-ivory/70">Notre approche</p>
            <h2 id="approche" className="mt-3 font-display text-[clamp(1.5rem,2.2vw,2rem)] leading-tight font-light text-ivory">
              Le trajet commence <span className="text-gold">avant la route.</span>
            </h2>
            <div className="mt-6 max-w-xl space-y-4 text-body-sm leading-relaxed text-ivory/85">
              <p>
                YAMOO DRIVE vous propose une façon simple de louer un véhicule au Cameroun : un catalogue lisible, une fiche claire
                pour chaque véhicule et une demande préparée en quelques étapes.
              </p>
              <p>
                L’agence garde la main : elle reçoit votre demande sur WhatsApp, vérifie ce qui doit l’être et vous répond. Rien n’est
                considéré comme acquis avant cette réponse.
              </p>
              <p>
                Choisissez votre véhicule, indiquez vos dates et la ville de prise en charge : l’agence vous répond avec la
                disponibilité et le tarif.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="pourquoi" className="bg-black">
        <div className="mx-auto max-w-[1900px] px-4 py-24 md:px-[4.9vw] md:py-32">
          <h2 id="pourquoi" className="font-display text-[clamp(1.5rem,2.4vw,2.125rem)] font-light text-ivory">
            Pourquoi demander <span className="text-gold">en ligne ?</span>
          </h2>
          <ul className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
            {REASONS.map(({ title, text }) => (
              <li key={title} className="border-t border-ivory/40 pt-6">
                <h3 className="text-[0.6875rem] font-semibold tracking-[0.15em] text-ivory uppercase">{title}</h3>
                <p className="mt-4 text-body-sm leading-relaxed text-ivory/75">{text}</p>
              </li>
            ))}
          </ul>
          <div className="mt-16 flex flex-wrap gap-3">
            <Button to="/vehicules">Explorer nos véhicules</Button>
            <Button to="/contact" variant="ghost">
              Nous contacter
            </Button>
          </div>
        </div>
      </section>
      <Cities />
      <Faq />
      <FeaturePanel
        id="panneau-fin"
        image="/vehicles/jmc-grand-avenue-lg.webp"
        label={copy.closing.about.label}
        title={copy.closing.about.title}
        text={copy.closing.about.text}
        cta={{ label: copy.closing.about.cta, to: '/vehicules' }}
        align="center"
      />
    </>
  )
}
