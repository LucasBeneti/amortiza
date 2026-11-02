import type { Scenario } from '../lib/financing'
import { formatCurrency, formatPercentage } from '../lib/format'

type SummaryRow = { label: string; value: string; highlight?: boolean }

function buildSummaryRows(scenario: Scenario): SummaryRow[] {
  const { summary } = scenario
  const rows: SummaryRow[] = [
    { label: '1ª parcela', value: formatCurrency(summary.firstInstallment), highlight: true },
    { label: 'Última parcela', value: formatCurrency(summary.lastInstallment), highlight: true },
    { label: 'Parcela média', value: formatCurrency(summary.averageInstallment) },
    { label: 'Total das parcelas', value: formatCurrency(summary.totalPaid) },
    { label: 'Total de juros', value: formatCurrency(summary.totalInterest) },
  ]

  if (summary.totalAdjustment !== 0) {
    rows.push({
      label: 'Reajuste acumulado do saldo',
      value: formatCurrency(summary.totalAdjustment),
    })
  }

  rows.push(
    {
      label: 'Custo além do imóvel (juros + reajuste)',
      value: formatCurrency(summary.costBeyondPropertyValue),
    },
    {
      label: 'Desembolso total (entrada + parcelas)',
      value: formatCurrency(summary.totalOutlay),
    },
  )

  return rows
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  return (
    <article className="scenario-card">
      <header className="scenario-card-header">
        <h3>{scenario.system}</h3>
        <p className="scenario-card-subtitle">
          entrada {formatPercentage(scenario.downPaymentPercent)} ·{' '}
          financiado {formatCurrency(scenario.financedAmount)}
        </p>
      </header>
      <dl>
        {buildSummaryRows(scenario).map((row) => (
          <div className="summary-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd className={row.highlight ? 'highlight' : undefined}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

/** Side-by-side cards with the metrics of each system. */
export function ScenarioSummary({ price, sac }: { price: Scenario; sac: Scenario }) {
  return (
    <section className="summary-panel" aria-label="Resumo comparativo">
      <h2>Resumo comparativo</h2>
      <div className="summary-grid">
        <ScenarioCard scenario={price} />
        <ScenarioCard scenario={sac} />
      </div>
    </section>
  )
}
