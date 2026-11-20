import { splitTitle } from './PageHeader.jsx'

/**
 * Bandeau de page, construit comme le hero de l'accueil : la barre de navigation (transparente) passe par-dessus ;
 * fond = la photo, floutée et assombrie ; au-dessus, la photo nette dans un panneau encadré ; en bas du panneau, le
 * titre léger et l'introduction. Un seul <h1> ; un mot clé du titre est doré. Les photos sont décoratives.
 * `children` : contenu additionnel sous l'introduction (ex. avis important).
 */
export default function PageHero({ title, accent, intro, image = '/images/header.webp', children }) {
  const parts = splitTitle(title, accent)

  return (
    <section className="relative isolate -mt-20 overflow-hidden bg-black pt-28 pb-10 md:-mt-24 md:pt-32 md:pb-14">
      <img src={image} alt="" aria-hidden="true" width="1280" height="720" decoding="async" className="absolute inset-0 -z-20 size-full scale-110 object-cover blur-2xl brightness-[0.7]" />

      <div className="relative mx-4 flex h-[62svh] min-h-[26rem] items-end overflow-hidden bg-black md:mx-[4.9vw]">
        <img src={image} alt="" width="1280" height="720" fetchPriority="high" decoding="async" className="absolute inset-0 size-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />
        <div className="relative w-full px-6 pb-8 md:px-10 md:pb-10">
          <h1 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-light text-ivory">
            {parts.before}
            {parts.accent && <span className="text-gold">{parts.accent}</span>}
            {parts.after}
          </h1>
          {intro ? <p className="mt-3 max-w-xl text-body-sm text-ivory/80">{intro}</p> : null}
          {children}
        </div>
      </div>
    </section>
  )
}
