import copy from '../../data/copy.js'
import Button from '../ui/Button.jsx'

/**
 * Bloc de présentation centré sur fond noir : un titre léger, deux paragraphes, deux boutons.
 * Textes descriptifs du fonctionnement du site ; aucune histoire, statistique ni promesse inventée.
 */
export default function Intro() {
  const { title, paragraphs, about, book } = copy.home.intro
  return (
    <section aria-labelledby="presentation" className="bg-black">
      <div className="mx-auto max-w-3xl px-4 py-24 text-center md:py-32">
        <h2 id="presentation" className="font-display text-[clamp(1.75rem,2.6vw,2.25rem)] font-light text-ivory">
          {title}
        </h2>
        <div className="mt-10 space-y-6 text-body-sm leading-relaxed text-ivory/85">
          {paragraphs.map((text) => (
            <p key={text}>{text}</p>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button to="/a-propos">{about}</Button>
          <Button to="/reservation" variant="ghost">
            {book}
          </Button>
        </div>
      </div>
    </section>
  )
}
