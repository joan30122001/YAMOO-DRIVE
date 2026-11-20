import { MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import agencyConfig from '../../data/agency.config.js'
import { CATEGORIES } from '../../data/vehicleSchema.js'
import { buildCatalogueUrl, todayISO, validateSearch } from '../../utils/search.js'
import Button from '../ui/Button.jsx'
import Field from '../ui/Field.jsx'
import { LINE_FIELDS } from '../ui/lineFields.js'

const TABS = [
  { value: '', label: 'Tous les véhicules' },
  { value: 'avec', label: 'Avec chauffeur' },
  { value: 'sans', label: 'Sans chauffeur' },
]

/**
 * Module de recherche rapide de l'accueil (FR-2), à la manière des grands sites de location : onglets de type de
 * location, puis ville, prise en charge, retour, catégorie. Valide la cohérence des dates puis ouvre le catalogue ;
 * ne vérifie JAMAIS la disponibilité réelle.
 */
export default function SearchBar() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ city: agencyConfig.cities[0] ?? '', from: '', to: '', category: '', driver: '' })
  const [errors, setErrors] = useState({})
  const today = todayISO()

  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  function onSubmit(event) {
    event.preventDefault()
    const found = validateSearch(values, todayISO())
    setErrors(found)
    if (Object.keys(found).length === 0) navigate(buildCatalogueUrl(values))
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label="Recherche rapide de véhicule"
      className={`text-left ${LINE_FIELDS}`}
    >
      <fieldset className="flex flex-wrap gap-x-1 -ml-3">
        <legend className="sr-only">Type de location</legend>
        {TABS.map(({ value, label }) => {
          const selected = values.driver === value
          return (
            <label
              key={label}
              className={`relative flex min-h-11 cursor-pointer items-center px-3 text-[0.6875rem] uppercase tracking-[0.15em] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-4 has-[:focus-visible]:outline-gold ${
                selected ? 'text-ivory' : 'text-ivory/60 hover:text-ivory'
              }`}
            >
              <input type="radio" name="chauffeur" value={value} checked={selected} onChange={update('driver')} className="sr-only" />
              {label}
              {selected && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-px bg-ivory" />}
            </label>
          )
        })}
      </fieldset>

      <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field as="select" label="Ville de départ" name="ville" value={values.city} onChange={update('city')}>
          {agencyConfig.cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Field>

        <Field type="date" label="Prise en charge" name="du" min={today} value={values.from} onChange={update('from')} error={errors.from} />

        <Field type="date" label="Retour" name="au" min={values.from || today} value={values.to} onChange={update('to')} error={errors.to} />

        <Field as="select" label="Catégorie" name="categorie" value={values.category} onChange={update('category')}>
          <option value="">Tout type</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Field>

        <div className="flex sm:col-span-2">
          <Button type="submit" variant="ghost" iconStart={<Search aria-hidden="true" className="size-4" />}>
            Rechercher
          </Button>
        </div>
      </div>

      <p className="mt-6 flex items-center gap-2 text-[0.6875rem] text-ivory/70">
        <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
        La recherche ne vérifie pas la disponibilité : l’agence confirme chaque demande.
      </p>
    </form>
  )
}
