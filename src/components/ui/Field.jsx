import { CircleAlert } from 'lucide-react'
import { useId } from 'react'

import Select from './Select.jsx'

// Spécifications : DESIGN.md.Components (champ). Le rouge n'est utilisé que pour le liseré et l'icône d'erreur,
// jamais pour le texte : le message d'erreur reste en ivoire.
// `color-scheme:dark` : sélecteurs de date et listes natives lisibles sur fond sombre.
// La hauteur minimale est ajoutée par type de contrôle (la zone de texte a la sienne) pour éviter deux `min-h-*` en conflit.
const CONTROL =
  'w-full rounded-md border border-line bg-field px-3 text-body-md text-ivory [color-scheme:dark] placeholder:text-silver focus-visible:border-gold aria-[invalid=true]:border-sport-red disabled:cursor-not-allowed disabled:opacity-60'
const TICK =
  'size-6 shrink-0 accent-gold aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-sport-red disabled:cursor-not-allowed disabled:opacity-60'

/**
 * Champ de formulaire accessible : libellé visible relié au contrôle, astérisque or si obligatoire,
 * aide et erreur reliées par `aria-describedby`, erreur annoncée (`role="alert"`).
 *
 * `as` : 'input' (défaut), 'textarea' ou 'select' (options en `children`).
 * `type` : 'text', 'email', 'tel', 'date', 'datetime-local', 'checkbox', 'radio', etc.
 */
export default function Field({
  id,
  label,
  required = false,
  error,
  hint,
  as = 'input',
  type = 'text',
  className = '',
  children,
  ...rest
}) {
  const autoId = useId()
  const fieldId = typeof id === 'string' && id.trim() ? id : autoId
  const hintId = `${fieldId}-hint`
  const errorId = `${fieldId}-error`
  const { 'aria-describedby': extraDescribedBy, 'aria-invalid': extraInvalid, ...others } = rest
  // Les références de l'appelant s'ajoutent à celles de l'aide et de l'erreur, sans les remplacer.
  const describedBy = [hint && hintId, error && errorId, extraDescribedBy].filter(Boolean).join(' ') || undefined

  const controlProps = {
    ...others,
    id: fieldId,
    required,
    'aria-invalid': error ? true : extraInvalid,
    'aria-describedby': describedBy,
  }

  const labelContent = (
    <>
      {label}
      {required && (
        <>
          <span aria-hidden="true" className="text-gold">
            {' '}
            *
          </span>
          <span className="sr-only"> (obligatoire)</span>
        </>
      )}
    </>
  )

  const message = (
    <>
      {hint && (
        <p id={hintId} className="mt-1 text-body-sm text-silver">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 flex items-start gap-2 text-body-sm text-ivory">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sport-red" />
          {error}
        </p>
      )}
    </>
  )

  if (as === 'input' && (type === 'checkbox' || type === 'radio')) {
    return (
      <div className={className}>
        <div className="flex min-h-11 items-center gap-3">
          <input type={type} className={TICK} {...controlProps} />
          <label htmlFor={fieldId} className="text-body-md text-ivory">
            {labelContent}
          </label>
        </div>
        {message}
      </div>
    )
  }

  let control
  if (as === 'select') {
    control = (
      <Select {...controlProps}>{children}</Select>
    )
  } else if (as === 'textarea') {
    control = <textarea className={`${CONTROL} min-h-32 py-3`} {...controlProps} />
  } else {
    control = <input type={type} className={`${CONTROL} min-h-11`} {...controlProps} />
  }

  return (
    <div className={className}>
      <label htmlFor={fieldId} className="mb-1 block text-body-sm text-ivory">
        {labelContent}
      </label>
      {control}
      {message}
    </div>
  )
}
