import agencyConfig from '../../data/agency.config.js'

// Dimensions du fichier public/images/logo.png (rapport 616 x 191) : réservent la place avant le chargement.
const LOGO_WIDTH = 616
const LOGO_HEIGHT = 191

/**
 * Logo de l'agence, posé directement sur le fond noir, sans contour ni pastille. Ses couleurs sont celles du logo
 * d'origine, strictement intactes (bleu marine et or) ; seul le fond blanc a été retiré
 * (voir public/vehicles/LICENSES.md).
 * Le lien qui l'entoure porte le nom accessible (« YAMOO DRIVE, accueil ») ; seul, l'`alt` nomme l'image.
 */
export default function Wordmark({ name = agencyConfig.name, className = '' }) {
  const text = typeof name === 'string' ? name.trim() : ''
  if (!text) return null

  return (
    <span className={`inline-flex items-center ${className}`}>
      <img src="/images/logo.png" alt={text} width={LOGO_WIDTH} height={LOGO_HEIGHT} decoding="async" className="h-9 w-auto min-[400px]:h-11 md:h-12" />
    </span>
  )
}
