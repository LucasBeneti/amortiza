/** pt-BR (Intl) formatting for monetary values and percentages. */

const currencyFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const percentageFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

export function formatCurrency(value: number): string {
  return currencyFormat.format(value)
}

export function formatPercentage(value: number): string {
  return `${percentageFormat.format(value)}%`
}
