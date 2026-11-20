import { useId } from 'react'
import { DRIVER_OPTIONS } from '../../utils/catalogueFilters.js'
import { formatPrice } from '../../utils/format.js'

function Group({ legend, children }) {
  return (
    <fieldset className="border-t border-line pt-4">
      <legend className="mb-3 font-display text-body-md font-semibold text-ivory">{legend}</legend>
      <div className="flex flex-col gap-1">{children}</div>
    </fieldset>
  )
}

function Check({ name, label, checked, onChange, type = 'checkbox' }) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-body-sm text-silver has-[:checked]:text-ivory">
      <input id={id} type={type} name={name} checked={checked} onChange={onChange} className="size-5 shrink-0 accent-gold" />
      {label}
    </label>
  )
}

const toggle = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

/**
 * Panneau de filtres (FR-5) : catégorie, marque, transmission, chauffeur, budget. Contrôlé : l'état est
 * porté par la page (adresse URL). Les listes viennent des données, jamais écrites en dur.
 */
export default function FilterPanel({ filters, options, priceCeiling, onChange, onReset, canReset }) {
  const set = (patch) => onChange({ ...filters, ...patch })
  const budget = filters.maxPrice || priceCeiling
  const budgetId = useId()

  return (
    <form aria-label="Filtres" onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-title-md text-ivory">Filtres</h2>
        {canReset && (
          <button type="button" onClick={onReset} className="min-h-11 px-2 text-body-sm text-gold underline underline-offset-4 hover:text-gold-light">
            Réinitialiser
          </button>
        )}
      </div>

      <Group legend="Catégorie">
        {options.categories.map((category) => (
          <Check
            key={category}
            name="categorie"
            label={category}
            checked={filters.categories.includes(category)}
            onChange={() => set({ categories: toggle(filters.categories, category) })}
          />
        ))}
      </Group>

      <Group legend="Marque">
        {options.brands.map((brand) => (
          <Check
            key={brand}
            name="marque"
            label={brand}
            checked={filters.brands.includes(brand)}
            onChange={() => set({ brands: toggle(filters.brands, brand) })}
          />
        ))}
      </Group>

      <Group legend="Transmission">
        {options.transmissions.map((transmission) => (
          <Check
            key={transmission}
            name="transmission"
            label={transmission}
            checked={filters.transmissions.includes(transmission)}
            onChange={() => set({ transmissions: toggle(filters.transmissions, transmission) })}
          />
        ))}
      </Group>

      <Group legend="Chauffeur">
        {DRIVER_OPTIONS.map((option) => (
          <Check
            key={option}
            type="radio"
            name="chauffeur"
            label={option === 'avec' ? 'Avec chauffeur' : 'Sans chauffeur'}
            checked={filters.driver === option}
            onChange={() => set({ driver: option })}
          />
        ))}
        <Check type="radio" name="chauffeur" label="Indifférent" checked={filters.driver === ''} onChange={() => set({ driver: '' })} />
      </Group>

      <fieldset className="border-t border-line pt-4">
        <legend className="mb-3 font-display text-body-md font-semibold text-ivory">Budget par jour</legend>
        <label htmlFor={budgetId} className="mb-2 block text-body-sm text-silver">
          Jusqu’à <span className="text-ivory">{formatPrice(budget)}</span>
        </label>
        <input
          id={budgetId}
          type="range"
          min={options.priceMin}
          max={priceCeiling}
          step={5000}
          value={budget}
          onChange={(event) => {
            const value = Number(event.target.value)
            set({ maxPrice: value >= priceCeiling ? 0 : value })
          }}
          className="h-11 w-full accent-gold"
        />
      </fieldset>
    </form>
  )
}
