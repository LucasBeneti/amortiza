import { formatCurrency, formatPercentage } from '../lib/format'

export function RateOverview({
  monthlyRate,
  propertyValue,
}: {
  monthlyRate: number
  propertyValue: number
}) {
  const monthlyPercent = monthlyRate * 100
  const effectiveAnnualPercent = ((1 + monthlyRate) ** 12 - 1) * 100

  return (
    <dl className="rate-overview">
      <div>
        <dt>Taxa mensal aplicada</dt>
        <dd>{formatPercentage(monthlyPercent)} a.m.</dd>
      </div>
      <div>
        <dt>Taxa efetiva anual</dt>
        <dd>{formatPercentage(effectiveAnnualPercent)} a.a.</dd>
      </div>
      <div>
        <dt>Valor do imóvel</dt>
        <dd>{formatCurrency(propertyValue)}</dd>
      </div>
    </dl>
  )
}
