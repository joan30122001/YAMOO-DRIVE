import copy from '../../data/copy.js'
import Button from '../ui/Button.jsx'

/**
 * Section « À propos » sur fond bleu profond : une photo en hauteur avec un cadre décalé à gauche, titre, texte et
 * deux boutons à contour à droite. Texte descriptif uniquement (aucune histoire ni chiffre inventé).
 */
export default function AboutBand() {
  const { title, text, explore, contact } = copy.home.about
  return (
    <section aria-labelledby="apropos" className="overflow-hidden bg-brand-deep">
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
          <h2 id="apropos" className="font-display text-[clamp(1.5rem,2.2vw,2rem)] font-light text-ivory">
            {title}
          </h2>
          <p className="mt-5 max-w-xl text-body-sm leading-relaxed text-ivory/85">{text}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/a-propos" variant="ghost">
              {explore}
            </Button>
            <Button to="/contact" variant="ghost">
              {contact}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
