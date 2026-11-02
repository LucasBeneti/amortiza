import { useEffect, useRef, useState } from 'react'
import { MAX_MONTHS, type RateMode } from '../lib/financing'
import { INITIAL_FORM_VALUES, type RawFormValues } from '../lib/form-values'
import { formatCurrency } from '../lib/format'
import { parseBrazilianNumber } from '../lib/input'

const SUBMIT_DEBOUNCE_MS = 180

function buildTermHint(rawMonths: string): string {
  try {
    const months = parseBrazilianNumber(rawMonths)
    if (!Number.isInteger(months) || months <= 0) {
      return `até ${MAX_MONTHS} meses (35 anos)`
    }
    if (months > MAX_MONTHS) {
      return `máximo permitido: ${MAX_MONTHS} meses (35 anos)`
    }
    const years = months / 12
    return Number.isInteger(years)
      ? `≈ ${years} ${years === 1 ? 'ano' : 'anos'} de contrato (máx. 35 anos)`
      : `${months} meses (máx. ${MAX_MONTHS})`
  } catch {
    return `até ${MAX_MONTHS} meses (35 anos)`
  }
}

/**
 * Isolated currency field: keeps its typing state locally so editing the
 * property value only re-renders this single input.
 */
function CurrencyField({
  id,
  name,
  label,
  defaultValue,
  placeholder,
  hint,
}: {
  id: string
  name: string
  label: string
  defaultValue: string
  placeholder: string
  hint: string
}) {
  const [value, setValue] = useState(defaultValue)

  const handleBlur = () => {
    try {
      const parsed = parseBrazilianNumber(value)
      setValue(formatCurrency(parsed))
    } catch {
      // Leave raw text untouched so validation can report the issue on submit.
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={handleBlur}
      />
      <p className="hint">{hint}</p>
    </div>
  )
}

/**
 * Isolated term field: keeps its typing state locally so the years hint updates
 * without re-rendering the rest of the form or the page.
 */
function TermField({ defaultValue }: { defaultValue: string }) {
  const [months, setMonths] = useState(defaultValue)

  return (
    <div className="field">
      <label htmlFor="months">Prazo (meses)</label>
      <input
        id="months"
        name="months"
        inputMode="numeric"
        autoComplete="off"
        placeholder="360"
        value={months}
        onChange={(event) => setMonths(event.target.value)}
      />
      <p className="hint">{buildTermHint(months)}</p>
    </div>
  )
}

/**
 * Uncontrolled numeric text field: zero React re-renders while the user types.
 */
function NumericField({
  id,
  name,
  label,
  defaultValue,
  placeholder,
  hint,
}: {
  id: string
  name: string
  label: string
  defaultValue: string
  placeholder: string
  hint: string
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        defaultValue={defaultValue}
      />
      <p className="hint">{hint}</p>
    </div>
  )
}

export function FinancingForm({
  initialValues = INITIAL_FORM_VALUES,
  onSubmit,
}: {
  initialValues?: RawFormValues
  onSubmit: (values: RawFormValues) => void
}) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const nextValues: RawFormValues = {
      propertyValue: String(formData.get('propertyValue') ?? ''),
      annualRate: String(formData.get('annualRate') ?? ''),
      months: String(formData.get('months') ?? ''),
      priceDownPayment: String(formData.get('priceDownPayment') ?? ''),
      sacDownPayment: String(formData.get('sacDownPayment') ?? ''),
      annualAdjustment: String(formData.get('annualAdjustment') ?? ''),
      rateMode: (formData.get('rateMode') as RateMode) ?? 'nominal',
    }

    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      onSubmit(nextValues)
    }, SUBMIT_DEBOUNCE_MS)
  }

  return (
    <form className="form" noValidate onSubmit={handleSubmit}>
      <CurrencyField
        id="property-value"
        name="propertyValue"
        label="Valor do imóvel"
        defaultValue={initialValues.propertyValue}
        placeholder="R$ 650.000,00"
        hint="aceita vírgula ou ponto decimal"
      />

      <NumericField
        id="annual-rate"
        name="annualRate"
        label="Taxa anual"
        defaultValue={initialValues.annualRate}
        placeholder="10.5"
        hint="em %, p.ex. 10.5 ou 10,5"
      />

      <TermField defaultValue={initialValues.months} />

      <NumericField
        id="price-down-payment"
        name="priceDownPayment"
        label="Entrada PRICE"
        defaultValue={initialValues.priceDownPayment}
        placeholder="50"
        hint="regra: 50%"
      />

      <NumericField
        id="sac-down-payment"
        name="sacDownPayment"
        label="Entrada SAC"
        defaultValue={initialValues.sacDownPayment}
        placeholder="30"
        hint="regra: ~30%"
      />

      <NumericField
        id="annual-adjustment"
        name="annualAdjustment"
        label="Reajuste anual do saldo"
        defaultValue={initialValues.annualAdjustment}
        placeholder="0"
        hint="0 = sem reajuste"
      />

      <div className="field field-wide">
        <label htmlFor="rate-mode">Critério da taxa</label>
        <select
          id="rate-mode"
          name="rateMode"
          defaultValue={initialValues.rateMode}
        >
          <option value="nominal">Nominal · anual ÷ 12 (cláusula do contrato)</option>
          <option value="effective">Efetiva · (1 + anual)^(1/12) − 1 (calculadoras)</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="submit" className="submit-button">
          Calcular parcelas
        </button>
      </div>
    </form>
  )
}
