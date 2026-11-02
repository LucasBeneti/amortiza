import { useState } from 'react'
import type { AmortizationSystem, Scenario } from '../lib/financing'
import { formatCurrency } from '../lib/format'

const PAGE_SIZE = 50

/**
 * Paginated installment table (50 rows per page), one system at a time,
 * switched by a PRICE | SAC toggle. State is colocated here so switching
 * tabs or pages never re-renders the form or summary cards.
 */
export function AmortizationSchedule({
  price,
  sac,
}: {
  price: Scenario
  sac: Scenario
}) {
  const [system, setSystem] = useState<AmortizationSystem>('PRICE')
  const [page, setPage] = useState(1)
  const [previousPrice, setPreviousPrice] = useState(price)

  if (previousPrice !== price) {
    setPreviousPrice(price)
    setPage(1)
  }

  const scenario = system === 'PRICE' ? price : sac
  const { installments, summary } = scenario
  const hasAdjustment = scenario.annualAdjustmentPercent !== 0

  const totalPages = Math.max(1, Math.ceil(installments.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const visibleInstallments = installments.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  )

  const firstVisible = visibleInstallments[0]?.number ?? 1
  const lastVisible =
    visibleInstallments[visibleInstallments.length - 1]?.number ??
    installments.length

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

      {totalPages > 1 ? (
        <nav className="pagination" aria-label="Paginação de parcelas">
          <button
            type="button"
            className="pagination-button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            ← Anterior
          </button>
          <span className="pagination-status">
            Parcelas <strong>{firstVisible}–{lastVisible}</strong> de{' '}
            {installments.length} · Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className="pagination-button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Próxima →
          </button>
        </nav>
      ) : null}

      <div className="schedule-scroll">
        <table>
          <caption className="sr-only">
            Parcelas no modelo {system}: exibindo {firstVisible} a {lastVisible}{' '}
            de {installments.length} parcelas
          </caption>
          <thead>
            <tr>
              <th scope="col" className="month-column">
                Mês
              </th>
              <th scope="col">Parcela</th>
              <th scope="col">Juros</th>
              <th scope="col">Amortização</th>
              <th scope="col">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {visibleInstallments.map((installment) => (
              <tr key={installment.number}>
                <th scope="row" className="month-column">
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
              <th scope="row" className="month-column">
                Total
              </th>
              <td>{formatCurrency(summary.totalPaid)}</td>
              <td>{formatCurrency(summary.totalInterest)}</td>
              <td>{formatCurrency(summary.totalAmortization)}</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {totalPages > 1 ? (
        <nav className="pagination" aria-label="Paginação de parcelas (rodapé)">
          <button
            type="button"
            className="pagination-button"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            ← Anterior
          </button>
          <span className="pagination-status">
            Página {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className="pagination-button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Próxima →
          </button>
        </nav>
      ) : null}

      {hasAdjustment ? (
        <p className="table-note">
          * mês em que o saldo sofreu o reajuste anual de{' '}
          {scenario.annualAdjustmentPercent}%.
        </p>
      ) : null}
    </section>
  )
}
