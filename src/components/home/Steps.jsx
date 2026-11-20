import copy from '../../data/copy.js'
import Eyebrow from '../ui/Eyebrow.jsx'

const pad = (n) => String(n).padStart(2, '0')

/** Le parcours en quatre gestes : numéros fins et filets. Texte descriptif du fonctionnement du site, sans promesse. */
export default function Steps() {
  const { eyebrow, title, items } = copy.home.steps
  return (
    <section aria-labelledby="parcours" className="bg-surface">
      <div className="mx-auto max-w-[1900px] px-4 py-24 md:px-[4.9vw] md:py-32">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 id="parcours" className="mt-4 max-w-3xl font-display text-[clamp(1.5rem,2.4vw,2.125rem)] font-light text-ivory">
          {title}
        </h2>
        <ol className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {items.map((item, index) => (
            <li key={item.title}>
              <span aria-hidden="true" className="block font-display text-[2.5rem] leading-none font-light text-gold">
                {pad(index + 1)}
              </span>
              <span aria-hidden="true" className="mt-6 block h-px w-full bg-ivory/40" />
              <h3 className="mt-6 text-[0.6875rem] font-semibold tracking-[0.15em] text-ivory uppercase">{item.title}</h3>
              <p className="mt-4 text-body-sm leading-relaxed text-ivory/75">{item.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
