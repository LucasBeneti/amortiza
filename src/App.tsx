import { useMemo, useState } from 'react'
import { AmortizationSchedule } from './components/AmortizationSchedule'
import { RuleBanner } from './components/RuleBanner'
import { ScenarioSummary } from './components/ScenarioSummary'
import { parseBrazilianNumber } from './lib/input'
import type { RateMode, Simulation } from './lib/financing'
import { simulateFinancing } from './lib/financing'
import { formatCurrency, formatPercentage } from './lib/format'

type FormState = {
  propertyValue: string
  annualRate: string
  months: string
  priceDownPayment: string
  sacDownPayment: string
  annualAdjustment: string
  rateMode: RateMode
}

/** Market defaults: 50% down payment on PRICE, ~30% on SAC. */
const INITIAL_FORM_STATE: FormState = {
  propertyValue: '500.000',
  annualRate: '10.5',
  months: '360',
  priceDownPayment: '50',
  sacDownPayment: '30',
  annualAdjustment: '0',
  rateMode: 'nominal',
}

type TextFieldName =
  | 'propertyValue'
  | 'annualRate'
  | 'months'
  | 'priceDownPayment'
  | 'sacDownPayment'
  | 'annualAdjustment'

type Result = { ok: true; simulation: Simulation } | { ok: false; message: string }

function buildTermHint(formState: FormState): string {
  try {
    const months = parseBrazilianNumber(formState.months)
    if (!Number.isInteger(months) || months <= 0) {
      return '360 = 30 anos · 420 = 35 anos'
    }
    const years = months / 12
    return Number.isInteger(years) ? `≈ ${years} anos de contrato` : ''
  } catch {
    return '360 = 30 anos · 420 = 35 anos'
  }
}

function computeResult(formState: FormState): Result {
  try {
    const simulation = simulateFinancing({
      propertyValue: parseBrazilianNumber(formState.propertyValue),
      annualRatePercent: parseBrazilianNumber(formState.annualRate),
      months: parseBrazilianNumber(formState.months),
      priceDownPaymentPercent: parseBrazilianNumber(formState.priceDownPayment),
      sacDownPaymentPercent: parseBrazilianNumber(formState.sacDownPayment),
      annualAdjustmentPercent: parseBrazilianNumber(formState.annualAdjustment),
      rateMode: formState.rateMode,
    })
    return { ok: true, simulation }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

function App() {
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE)

  const updateTextField =
    (field: TextFieldName) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setFormState((previous) => ({ ...previous, [field]: value }))
    }

  const updateRateMode = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFormState((previous) => ({
      ...previous,
      rateMode: event.target.value as RateMode,
    }))
  }

  const result = useMemo(() => computeResult(formState), [formState])

  const rates = result.ok
    ? {
        monthly: result.simulation.parameters.monthlyRate * 100,
        effectiveAnnual: (1 + result.simulation.parameters.monthlyRate) ** 12 - 1,
      }
    : null

  return (
    <main className="app">
      <header className="header">
        <h1 className="wordmark">amortiza</h1>
        <p className="tagline">PRICE x SAC · mesmo prazo · cálculo no navegador</p>
      </header>

      <RuleBanner />

      <form
        className="form"
        noValidate
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="field">
          <label htmlFor="property-value">Valor do imóvel</label>
          <input
            id="property-value"
            inputMode="decimal"
            autoComplete="off"
            placeholder="500.000"
            value={formState.propertyValue}
            onChange={updateTextField('propertyValue')}
          />
          <p className="hint">em reais</p>
        </div>

        <div className="field">
          <label htmlFor="annual-rate">Taxa anual</label>
          <input
            id="annual-rate"
            inputMode="decimal"
            autoComplete="off"
            placeholder="10.5"
            value={formState.annualRate}
            onChange={updateTextField('annualRate')}
          />
          <p className="hint">em %, p.ex. 10.5 ou 10,5</p>
        </div>

        <div className="field">
          <label htmlFor="months">Prazo (meses)</label>
          <input
            id="months"
            inputMode="numeric"
            autoComplete="off"
            placeholder="360"
            value={formState.months}
            onChange={updateTextField('months')}
          />
          <p className="hint">{buildTermHint(formState)}</p>
        </div>

        <div className="field">
          <label htmlFor="price-down-payment">Entrada PRICE</label>
          <input
            id="price-down-payment"
            inputMode="decimal"
            autoComplete="off"
            placeholder="50"
            value={formState.priceDownPayment}
            onChange={updateTextField('priceDownPayment')}
          />
          <p className="hint">regra: 50%</p>
        </div>

        <div className="field">
          <label htmlFor="sac-down-payment">Entrada SAC</label>
          <input
            id="sac-down-payment"
            inputMode="decimal"
            autoComplete="off"
            placeholder="30"
            value={formState.sacDownPayment}
            onChange={updateTextField('sacDownPayment')}
          />
          <p className="hint">regra: ~30%</p>
        </div>

        <div className="field">
          <label htmlFor="annual-adjustment">Reajuste anual do saldo</label>
          <input
            id="annual-adjustment"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={formState.annualAdjustment}
            onChange={updateTextField('annualAdjustment')}
          />
          <p className="hint">0 = sem reajuste</p>
        </div>

        <div className="field field-wide">
          <label htmlFor="rate-mode">Critério da taxa</label>
          <select
            id="rate-mode"
            value={formState.rateMode}
            onChange={updateRateMode}
          >
            <option value="nominal">Nominal · anual ÷ 12 (cláusula do contrato)</option>
            <option value="effective">Efetiva · (1 + anual)^(1/12) − 1 (calculadoras)</option>
          </select>
        </div>
      </form>

      {!result.ok ? (
        <p className="error-message" role="alert">
          {result.message}
        </p>
      ) : (
        <>
          {rates ? (
            <dl className="rate-overview">
              <div>
                <dt>Taxa mensal aplicada</dt>
                <dd>{formatPercentage(rates.monthly)} a.m.</dd>
              </div>
              <div>
                <dt>Taxa efetiva anual</dt>
                <dd>{formatPercentage(rates.effectiveAnnual)} a.a.</dd>
              </div>
              <div>
                <dt>Valor do imóvel</dt>
                <dd>{formatCurrency(result.simulation.parameters.propertyValue)}</dd>
              </div>
            </dl>
          ) : null}

          <ScenarioSummary price={result.simulation.price} sac={result.simulation.sac} />
          <AmortizationSchedule price={result.simulation.price} sac={result.simulation.sac} />
        </>
      )}

      <footer className="footer-note">
        Modelo simplificado: juros sobre o saldo, sem seguro habitacional
        (MIP/DFI), tarifas ou IOF. O reajuste anual, quando informado, incide
        sobre o saldo devedor no aniversário de cada 12 parcelas.
      </footer>
    </main>
  )
}

export default App
