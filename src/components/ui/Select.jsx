import { Check, ChevronDown } from 'lucide-react'
import { Children, isValidElement, useEffect, useId, useRef, useState } from 'react'

// Liste déroulante aux couleurs du thème, à la place de la liste native du navigateur (non stylable).
// Même contrat que `<select>` : `value`, `onChange(event)` avec `event.target.value` et `event.target.name`,
// options passées en `children` (`<option value>`). Schéma d'accessibilité : bouton `combobox` + `listbox`.
// Clavier : flèches, Début/Fin, Entrée ou Espace pour choisir, Échap pour fermer, saisie d'une lettre pour sauter.

const TRIGGER =
  'flex w-full items-center justify-between gap-2 rounded-md border border-line bg-field px-3 text-left text-body-md text-ivory focus-visible:border-gold aria-[invalid=true]:border-sport-red disabled:cursor-not-allowed disabled:opacity-60'

function readOptions(children) {
  return Children.toArray(children)
    .filter((child) => isValidElement(child) && child.type === 'option')
    .map((child) => {
      const label = Children.toArray(child.props.children).join('')
      return { value: String(child.props.value ?? label), label, disabled: Boolean(child.props.disabled) }
    })
}

export default function Select({
  id,
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  children,
  className = '',
  disabled = false,
  required = false,
  ...aria
}) {
  const autoId = useId()
  const triggerId = id || autoId
  const listId = `${triggerId}-liste`
  const options = readOptions(children)
  const [inner, setInner] = useState(defaultValue ?? options[0]?.value ?? '')
  const value = controlledValue ?? inner
  const selectedIndex = options.findIndex((option) => option.value === String(value ?? ''))
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(Math.max(selectedIndex, 0))
  const rootRef = useRef(null)
  const listRef = useRef(null)
  const typed = useRef({ text: '', timer: 0 })

  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView?.({ block: 'nearest' })
  }, [open, active])

  const choose = (index) => {
    const option = options[index]
    if (!option || option.disabled) return
    setInner(option.value)
    onChange?.({ target: { name, value: option.value }, currentTarget: { name, value: option.value } })
    close()
  }

  const move = (from, step) => {
    let next = from
    for (let i = 0; i < options.length; i += 1) {
      next = (next + step + options.length) % options.length
      if (!options[next].disabled) return next
    }
    return from
  }

  const onKeyDown = (event) => {
    if (disabled) return
    const { key } = event
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setActive(Math.max(selectedIndex, 0))
        setOpen(true)
      } else setActive((current) => move(current, key === 'ArrowDown' ? 1 : -1))
    } else if (key === 'Home' || key === 'End') {
      if (!open) return
      event.preventDefault()
      setActive(key === 'Home' ? move(-1, 1) : move(0, -1))
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      if (open) choose(active)
      else {
        setActive(Math.max(selectedIndex, 0))
        setOpen(true)
      }
    } else if (key === 'Escape') {
      if (open) {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
    } else if (key === 'Tab') {
      close()
    } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      window.clearTimeout(typed.current.timer)
      typed.current.text += key.toLowerCase()
      typed.current.timer = window.setTimeout(() => {
        typed.current.text = ''
      }, 600)
      const found = options.findIndex((option) => !option.disabled && option.label.toLowerCase().startsWith(typed.current.text))
      if (found >= 0) {
        setActive(found)
        if (!open) setOpen(true)
      }
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={options[selectedIndex]?.value ?? ''} />}
      <button
        type="button"
        id={triggerId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => {
          setActive(Math.max(selectedIndex, 0))
          setOpen((current) => !current)
        }}
        onKeyDown={onKeyDown}
        className={`${TRIGGER} min-h-11 ${className}`}
        {...aria}
      >
        <span className="truncate">{options[selectedIndex]?.label ?? ''}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-gold motion-safe:transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute top-full right-0 left-0 z-30 mt-1 max-h-64 min-w-max overflow-auto rounded-md border border-line bg-carbon-raised py-1 text-left shadow-2xl shadow-black/60"
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              role="option"
              aria-selected={index === selectedIndex}
              aria-disabled={option.disabled || undefined}
              onPointerEnter={() => !option.disabled && setActive(index)}
              onClick={() => choose(index)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 px-3 text-body-md normal-case tracking-normal ${
                option.disabled ? 'cursor-not-allowed text-silver/50' : index === selectedIndex ? 'text-gold' : 'text-ivory'
              } ${index === active && !option.disabled ? 'bg-gold/10' : ''}`}
            >
              {option.label}
              {index === selectedIndex && <Check aria-hidden="true" className="size-4 shrink-0 text-gold" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
