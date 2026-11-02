import { useState } from 'react'
import { AmortizationSchedule } from './components/AmortizationSchedule'
import { FinancingForm } from './components/FinancingForm'
import { RateOverview } from './components/RateOverview'
import { RuleBanner } from './components/RuleBanner'
import { ScenarioSummary } from './components/ScenarioSummary'
import {
  INITIAL_FORM_VALUES,
  parseFormValues,
  type RawFormValues,
} from './lib/form-values'
import {
  simulateFinancing,
  type Simulation,
  type SimulationParameters,
} from './lib/financing'

type Result =
  | { ok: true; simulation: Simulation }
  | { ok: false; message: string }

function isSameParameters(
  simulation: Simulation,
  next: Required<SimulationParameters>,
): boolean {
  return (
    simulation.parameters.propertyValue === next.propertyValue &&
    simulation.parameters.annualRatePercent === next.annualRatePercent &&
    simulation.parameters.months === next.months &&
    simulation.price.downPaymentPercent === next.priceDownPaymentPercent &&
    simulation.sac.downPaymentPercent === next.sacDownPaymentPercent &&
    simulation.parameters.annualAdjustmentPercent ===
      next.annualAdjustmentPercent &&
    simulation.parameters.rateMode === next.rateMode
  )
}

function computeNextResult(
  previous: Result | null,
  values: RawFormValues,
): Result {
  try {
    const parsed = parseFormValues(values)
    if (previous?.ok && isSameParameters(previous.simulation, parsed)) {
      return previous
    }
    return { ok: true, simulation: simulateFinancing(parsed) }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

function Header() {
  return (
    <header className="header">
      <h1 className="wordmark">amortiza</h1>
      <p className="tagline">PRICE x SAC · mesmo prazo · cálculo no navegador</p>
    </header>
  )
}

function Footer() {
  return (
    <footer className="footer-note">
      Modelo simplificado: juros sobre o saldo, sem seguro habitacional
      (MIP/DFI), tarifas ou IOF. O reajuste anual, quando informado, incide
      sobre o saldo devedor no aniversário de cada 12 parcelas.
    </footer>
  )
}

function App() {
  const [result, setResult] = useState<Result>(() =>
    computeNextResult(null, INITIAL_FORM_VALUES),
  )

  const handleFormSubmit = (values: RawFormValues) => {
    setResult((previous) => computeNextResult(previous, values))
  }

  return (
    <main className="app">
      <Header />
      <RuleBanner />
      <FinancingForm
        initialValues={INITIAL_FORM_VALUES}
        onSubmit={handleFormSubmit}
      />

      {!result.ok ? (
        <p className="error-message" role="alert">
          {result.message}
        </p>
      ) : (
        <>
          <RateOverview
            monthlyRate={result.simulation.parameters.monthlyRate}
            propertyValue={result.simulation.parameters.propertyValue}
          />
          <ScenarioSummary
            price={result.simulation.price}
            sac={result.simulation.sac}
          />
          <AmortizationSchedule
            price={result.simulation.price}
            sac={result.simulation.sac}
          />
        </>
      )}

      <Footer />
    </main>
  )
}

export default App
