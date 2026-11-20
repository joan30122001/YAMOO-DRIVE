import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import FeaturePanel from '../components/home/FeaturePanel.jsx'
import Button from '../components/ui/Button.jsx'
import Select from '../components/ui/Select.jsx'
import Notice from '../components/ui/Notice.jsx'
import PageHero from '../components/ui/PageHero.jsx'
import PageMeta from '../components/ui/PageMeta.jsx'
import FilterPanel from '../components/vehicles/FilterPanel.jsx'
import VehicleCard from '../components/vehicles/VehicleCard.jsx'
import copy from '../data/copy.js'
import seo from '../data/seo.js'
import { getVehicles } from '../data/vehicleRepository.js'
import {
  applyFilters,
  distinctValues,
  hasActiveFilters,
  parseFilters,
  SORTS,
  writeFilters,
} from '../utils/catalogueFilters.js'

// Seule la première image est chargée en priorité (LCP). Les suivantes sont différées : si elles sont déjà
// visibles (grand écran), le navigateur les charge dès la mise en page, sans gaspiller de données sur mobile.
const PRIORITY_COUNT = 1

export default function Catalogue() {
  const all = useMemo(() => getVehicles(), [])
  const [params, setParams] = useSearchParams()
  const [panelOpen, setPanelOpen] = useState(false)

  const filters = parseFilters(params)
  const results = applyFilters(all, filters)
  const active = hasActiveFilters(filters)

  const prices = all.map((v) => v.dailyRateXAF).filter(Number.isFinite)
  const priceCeiling = Math.ceil(Math.max(...prices, 0) / 5000) * 5000
  const options = {
    categories: distinctValues(all, 'category'),
    brands: distinctValues(all, 'brand'),
    transmissions: distinctValues(all, 'transmission'),
    priceMin: Math.floor(Math.min(...prices, 0) / 5000) * 5000,
  }

  // `replace` : chaque frappe ou case cochée ne pollue pas l'historique du navigateur.
  const update = (next) => setParams(writeFilters(params, next), { replace: true })
  const reset = () => update({ ...filters, query: '', categories: [], brands: [], transmissions: [], driver: '', maxPrice: 0 })

  return (
    <>
      <PageMeta title={seo.catalogue.title} description={seo.catalogue.description} />
      <PageHero title="Nos véhicules" accent="véhicules" intro={copy.catalogueIntro} image="/vehicles/jmc-grand-avenue-lg.webp">
        <Notice className="mt-5 max-w-prose">{copy.catalogueNotice}</Notice>
      </PageHero>

      <div className="bg-surface">
      <section className="mx-auto grid max-w-[1900px] grid-cols-[minmax(0,1fr)] gap-10 px-4 py-16 md:px-[4.9vw] lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div>
          <button
            type="button"
            aria-expanded={panelOpen}
            aria-controls="filtres"
            onClick={() => setPanelOpen((open) => !open)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-line px-4 text-body-md text-ivory lg:hidden"
          >
            <SlidersHorizontal aria-hidden="true" className="size-4 text-gold" />
            Filtres{active ? ' (actifs)' : ''}
          </button>
          <div id="filtres" className={`${panelOpen ? 'mt-4 block' : 'hidden'} lg:block`}>
            <FilterPanel
              filters={filters}
              options={options}
              priceCeiling={priceCeiling}
              onChange={update}
              onReset={reset}
              canReset={active}
            />
          </div>
        </div>

        <div>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label htmlFor="recherche" className="sr-only">
                Rechercher un véhicule
              </label>
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-silver" />
              <input
                id="recherche"
                type="search"
                value={filters.query}
                onChange={(event) => update({ ...filters, query: event.target.value })}
                placeholder="Rechercher un véhicule…"
                className="min-h-11 w-full rounded-md border border-line bg-field pr-3 pl-9 text-body-md text-ivory placeholder:text-silver focus-visible:border-gold"
              />
            </div>
            <label className="flex items-center gap-2 text-body-sm text-silver">
              Trier par
              <Select
                value={filters.sort}
                onChange={(event) => update({ ...filters, sort: event.target.value })}
                className="min-w-48"
              >
                {SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <p role="status" className="mb-4 text-body-sm text-silver">
            {results.length} {results.length > 1 ? 'véhicules' : 'véhicule'}
            {active ? ' correspondent à votre recherche' : ' dans le catalogue'}
          </p>

          {results.length === 0 ? (
            <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-carbon p-6">
              <p className="text-silver">{all.length === 0 ? copy.catalogueEmpty : 'Aucun véhicule ne correspond à ces critères.'}</p>
              {all.length === 0 ? (
                <Button variant="outline" to="/contact">
                  {copy.catalogueEmptyAction}
                </Button>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={reset}>
                    Réinitialiser les filtres
                  </Button>
                  <Button variant="ghost" to="/contact">
                    {copy.catalogueEmptyAction}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((vehicle, index) => (
                <li key={vehicle.slug}>
                  <VehicleCard vehicle={vehicle} priority={index < PRIORITY_COUNT} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      </div>
      <FeaturePanel
        id="panneau-fin"
        image="/vehicles/jetour-dashing-lg.webp"
        label={copy.closing.catalogue.label}
        title={copy.closing.catalogue.title}
        text={copy.closing.catalogue.text}
        cta={{ label: copy.closing.catalogue.cta, to: '/contact' }}
        align="left"
      />
    </>
  )
}
