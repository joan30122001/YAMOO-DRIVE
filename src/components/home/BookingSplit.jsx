import copy from '../../data/copy.js'
import SearchBar from './SearchBar.jsx'

/**
 * Section de réservation en deux moitiés : la photo en entier à gauche, un panneau plein et net à droite (aucune
 * transparence, aucun calque posé sur la photo). Sur mobile, la photo passe au-dessus du panneau.
 * Le titre est un <h2> ; la photo est décorative.
 */
export default function BookingSplit({ image }) {
  const { label, title, text } = copy.home.panels.booking
  return (
    <section aria-labelledby="panneau-reservation" className="grid bg-carbon md:grid-cols-2">
      <img
        src={image}
        alt=""
        width="1200"
        height="675"
        loading="lazy"
        decoding="async"
        className="h-72 w-full object-cover md:h-full md:min-h-[38rem]"
      />
      <div className="flex items-center px-4 py-14 md:px-[5vw] md:py-20">
        <div className="mx-auto w-full max-w-xl">
          <p className="text-[0.6875rem] tracking-[0.1em] text-ivory/70">{label}</p>
          <h2 id="panneau-reservation" className="mt-3 font-display text-[clamp(1.5rem,2.4vw,2.125rem)] leading-tight font-light text-ivory">
            {title}
          </h2>
          <p className="mt-4 text-body-sm leading-relaxed text-ivory/80">{text}</p>
          <div className="mt-10">
            <SearchBar />
          </div>
        </div>
      </div>
    </section>
  )
}
