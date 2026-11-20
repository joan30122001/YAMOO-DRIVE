import agencyConfig from '../../data/agency.config.js'
import { DEFAULT_DESCRIPTION, SITE_NAME } from '../../data/seo.js'

/**
 * Métadonnées natives React 19 (remontées dans <head>). `noindex` piloté par la configuration.
 */
export default function PageMeta({ title, description, config = agencyConfig }) {
  const desc = description || DEFAULT_DESCRIPTION
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Location de véhicules`

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:locale" content="fr_CM" />
      {config?.noindex && <meta name="robots" content="noindex, nofollow" />}
    </>
  )
}
