import { useId, useRef, useState } from 'react'

/**
 * Onglets accessibles (motif WAI-ARIA) : flèches gauche/droite, Début, Fin ; un seul onglet dans l'ordre de tabulation.
 * `tabs` : [{ id, label, content }]. Le panneau actif est seul rendu.
 */
export default function Tabs({ tabs, label }) {
  const base = useId()
  const [active, setActive] = useState(tabs[0]?.id)
  const refs = useRef({})

  function onKeyDown(event) {
    const index = tabs.findIndex((tab) => tab.id === active)
    const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key]
    if (target === undefined) return
    event.preventDefault()
    const next = tabs[(target + tabs.length) % tabs.length]
    setActive(next.id)
    refs.current[next.id]?.focus()
  }

  const current = tabs.find((tab) => tab.id === active) ?? tabs[0]

  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((tab) => {
          const selected = tab.id === current.id
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[tab.id] = el
              }}
              role="tab"
              type="button"
              id={`${base}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`-mb-px min-h-11 shrink-0 border-b-2 px-3 text-body-md sm:px-4 transition-colors ${
                selected ? 'border-gold text-gold' : 'border-transparent text-silver hover:text-ivory'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel-${current.id}`}
        aria-labelledby={`${base}-tab-${current.id}`}
        tabIndex={0}
        className="pt-6"
      >
        {current.content}
      </div>
    </div>
  )
}
