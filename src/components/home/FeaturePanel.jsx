import { m, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import useMotionPolicy from '../../hooks/useMotionPolicy.js'
import Button from '../ui/Button.jsx'

const ALIGN = {
  left: 'justify-start md:pl-[7vw]',
  center: 'justify-center',
  right: 'justify-end md:pr-[5vw]',
}
const TEXT_ALIGN = { left: 'text-left', center: 'text-center', right: 'text-left' }

/**
 * Panneau plein écran : une photo, une boîte vitrée (petit libellé, titre léger, texte, bouton) placée à gauche, au
 * centre ou à droite, avec un second calque décalé derrière. `children` remplace le bouton (ex. module de réservation).
 * Au défilement, la photo glisse et grossit légèrement (parallaxe) ; ce mouvement est coupé si l'utilisateur réduit les
 * animations ou sur appareil peu puissant (le contenu reste identique). Le libellé est décoratif ; le titre est un <h2>.
 */
export default function FeaturePanel({ id, image, label, title, text, cta, align = 'left', wide = false, children }) {
  const { reduced, lowPower } = useMotionPolicy()
  const animate = !reduced && !lowPower
  const section = useRef(null)
  const { scrollYProgress } = useScroll({ target: section, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.12, 1.18, 1.24])

  return (
    <section ref={section} aria-labelledby={id} className="relative isolate flex min-h-[34rem] items-center overflow-hidden bg-black md:h-[clamp(34rem,35vw,46rem)]">
      {/* key : si la préférence « réduire les animations » est détectée après le premier rendu, l'élément est recréé et perd le mouvement déjà posé. */}
      <m.img
        key={animate ? 'anime' : 'statique'}
        src={image}
        alt=""
        width="1200"
        height="675"
        loading="lazy"
        decoding="async"
        style={animate ? { y, scale } : undefined}
        className="absolute inset-0 -z-10 size-full object-cover"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/25" />

      <div className={`flex w-full px-4 py-12 ${ALIGN[align]}`}>
        <div className={`relative w-full ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
          <span aria-hidden="true" className="absolute -top-8 left-12 h-24 w-1/4 bg-ivory/20 backdrop-blur-sm" />
          <div className={`relative bg-black/55 p-8 backdrop-blur-md md:p-12 ${TEXT_ALIGN[align]}`}>
            <p className="text-[0.6875rem] tracking-[0.1em] text-ivory/80">{label}</p>
            <h2 id={id} className="mt-3 font-display text-[clamp(1.5rem,2.4vw,2.125rem)] leading-tight font-light text-ivory">
              {title}
            </h2>
            {text && <p className="mt-4 text-body-sm leading-relaxed text-ivory/85">{text}</p>}
            {children ? (
              <div className="mt-8">{children}</div>
            ) : (
              cta && (
                <div className="mt-8">
                  <Button to={cta.to}>{cta.label}</Button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
