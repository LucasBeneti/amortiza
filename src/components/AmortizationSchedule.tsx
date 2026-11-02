import { useState } from 'react'
import type { AmortizationSystem, Scenario } from '../lib/financing'
import { formatCurrency } from '../lib/format'

/**
 * Full installment table, one system at a time, switched by a
 * PRICE | SAC toggle. On narrow screens the table scrolls horizontally;
 * numbers use `tabular-nums` and the header stays sticky.
 */
export function AmortizationSchedule({ price, sac }: { price: Scenario; sac: Scenario }) {
  const [system, setSystem] = useState<AmortizationSystem>('PRICE')
  const scenario = system === 'PRICE' ? price : sac
  const { installments, summary } = scenario
  const hasAdjustment = scenario.annualAdjustmentPercent !== 0

  return (
    <section className="schedule-panel" aria-label="Tabela de parcelas">
      <div className="schedule-header">
        <h2>Tabela de parcelas</h2>
        <div
          className="system-toggle"
          role="group"
          aria-label="Sistema de amortização"
        >
          {(['PRICE', 'SAC'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={system === option}
              onClick={() => setSystem(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="schedule-scroll">
        <table>
          <caption className="sr-only">
            Parcelas no modelo {system}: {installments.length} parcelas, do mês 1 ao
            mês {scenario.months}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="align-left">
                Mês
              </th>
              <th scope="col">Parcela</th>
              <th scope="col">Juros</th>
              <th scope="col">Amortização</th>
              <th scope="col">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((installment) => (
              <tr key={installment.number}>
                <th scope="row" className="align-left">
                  {installment.number}
                  {installment.adjustmentApplied ? ' *' : ''}
                </th>
                <td>{formatCurrency(installment.amount)}</td>
                <td>{formatCurrency(installment.interest)}</td>
                <td>{formatCurrency(installment.amortization)}</td>
                <td>{formatCurrency(installment.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="align-left">
                Total ({installments.length})
              </th>
              <td>{formatCurrency(summary.totalPaid)}</td>
              <td>{formatCurrency(summary.totalInterest)}</td>
              <td>{formatCurrency(summary.totalAmortization)}</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {hasAdjustment ? (
        <p className="table-note">
          * mês em que o saldo sofreu o reajuste anual de{' '}
          {scenario.annualAdjustmentPercent}%.
        </p>
      ) : null}
    </section>
  )
}
