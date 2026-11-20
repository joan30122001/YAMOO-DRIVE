// Durées, easings et décalages d'animation centralisés (AD-6, AD-7). Aucune valeur en dur dans les composants.

export const duration = {
  fast: 0.18,
  base: 0.32,
  slow: 0.6,
}

export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
}

// Décalages de déplacement et d'apparition.
export const offset = {
  slide: '8%',
  rise: 12,
}

const STAGGER_STEP = 0.06

/** Délai d'apparition du n-ième élément d'une liste. */
export function stagger(index, base = duration.fast) {
  return base + index * STAGGER_STEP
}

/** Transition par défaut ; durée nulle quand l'utilisateur réduit les animations. */
export function transition(reduced, { d = duration.base, e = ease.out, delay = 0 } = {}) {
  return reduced ? { duration: 0 } : { duration: d, ease: e, delay }
}
