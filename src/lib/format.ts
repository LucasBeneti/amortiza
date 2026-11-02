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
  // Intl uses a non-breaking space (U+00A0) after "R$"; replace it with a
  // regular space.
  return currencyFormat.format(value).replace(/\u00A0/g, ' ')
}

export function formatPercentage(value: number): string {
  return `${percentageFormat.format(value)}%`
}
