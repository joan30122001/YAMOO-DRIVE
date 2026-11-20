import { Link } from 'react-router'
import agencyConfig from '../../data/agency.config.js'
import copy from '../../data/copy.js'
import { CATEGORIES } from '../../data/vehicleSchema.js'
import { bookingLink, navLinks } from '../../navigation.js'
import { buildContactHref, hasValue } from '../../utils/contact.js'
import ContactLink from '../ui/ContactLink.jsx'
import SocialIcon from '../ui/SocialIcon.jsx'
import Wordmark from '../ui/Wordmark.jsx'

const SOCIALS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
]

const LEGAL_LINKS = [
  { to: '/conditions-de-location', label: 'Conditions de location' },
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/confidentialite', label: 'Confidentialité' },
]

const topLink = 'inline-flex min-h-11 min-w-11 items-center text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ivory hover:text-gold'
const heading = 'mb-4 font-display text-body-md font-light text-ivory'
const smallLink = 'inline-flex min-h-11 min-w-11 items-center text-[0.6875rem] text-ivory/90 hover:text-gold'

/**
 * Pied de page sur fond bleu profond : liens autour du logo, réseaux (seulement ceux qui sont renseignés), cinq colonnes
 * de liens minuscules, puis la ligne de mentions. Aucune coordonnée n'est inventée : vide, elle s'affiche « à compléter ».
 */
export default function Footer({ config = agencyConfig }) {
  const socials = SOCIALS.filter(({ key }) => buildContactHref('url', config.socials?.[key]))

  return (
    <footer className="bg-brand-deep text-ivory">
      <div className="mx-auto max-w-[1900px] px-4 md:px-[4.9vw]">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 pt-14">
          <Link to={bookingLink.to} className={topLink}>
            {bookingLink.label}
          </Link>
          <Link to="/vehicules" className={topLink}>
            Véhicules
          </Link>
          <Link to="/" aria-label={`${config.name}, accueil`} className="inline-flex min-h-11 items-center px-4">
            <Wordmark name={config.name} />
          </Link>
          <Link to="/a-propos" className={topLink}>
            À propos
          </Link>
          <Link to="/contact" className={topLink}>
            Contact
          </Link>
        </div>

        {socials.length > 0 && (
          <ul aria-label="Réseaux sociaux" className="mt-6 flex justify-center gap-3">
            {socials.map(({ key, label }) => (
              <li key={key}>
                <a
                  href={buildContactHref('url', config.socials[key])}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center text-white transition-colors hover:text-gold"
                >
                  <SocialIcon name={key} className="size-4" />
                  <span className="sr-only"> {copy.opensNewTab}</span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <hr className="mt-10 border-ivory/70" />

        <div className="grid gap-10 px-0 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-[4.5vw]">
          <nav aria-label="Véhicules">
            <p className={heading}>Véhicules</p>
            <ul>
              <li>
                <Link to="/vehicules" className={smallLink}>
                  Tous les véhicules
                </Link>
              </li>
              {CATEGORIES.map((category) => (
                <li key={category}>
                  <Link to={`/vehicules?categorie=${encodeURIComponent(category)}`} className={smallLink}>
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Liens du pied de page">
            <p className={heading}>L’agence</p>
            <ul>
              {navLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className={smallLink}>
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to={bookingLink.to} className={smallLink}>
                  {bookingLink.label}
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <p className={heading}>Contact</p>
            <ul aria-label="Coordonnées" className="text-[0.6875rem]">
              <li>
                <ContactLink kind="whatsapp" value={config.whatsappNumber} label="WhatsApp" className="!text-ivory/90 !text-[0.6875rem]" />
              </li>
              <li>
                <ContactLink kind="phone" value={config.phone} label="Téléphone" className="!text-ivory/90 !text-[0.6875rem]" />
              </li>
              <li>
                <ContactLink kind="email" value={config.email} label="E-mail" className="!text-ivory/90 !text-[0.6875rem]" />
              </li>
              <li className="py-3 text-ivory/90">
                Adresse : {hasValue(config.address) ? config.address : <em>{copy.toComplete}</em>}
              </li>
            </ul>
          </div>

          <div>
            <p className={heading}>Informations</p>
            <p className="max-w-[16rem] text-[0.6875rem] leading-relaxed text-ivory/90">{copy.footerInfo}</p>
          </div>

          <div>
            <p className={heading}>Langue et devise</p>
            <p className="text-[0.6875rem] text-ivory/90">Français · FCFA</p>
          </div>
        </div>

        <hr className="border-ivory/70" />

        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 py-5 text-[0.625rem] text-ivory">
          <p>
            © Copyright {config.name} {new Date().getFullYear()}
          </p>
          <ul className="flex flex-wrap gap-x-6">
            <li>
              <Link to="/contact" className="inline-flex min-h-11 items-center uppercase hover:text-gold">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/a-propos" className="inline-flex min-h-11 items-center uppercase hover:text-gold">
                À propos
              </Link>
            </li>
            {LEGAL_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="inline-flex min-h-11 items-center uppercase hover:text-gold">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
