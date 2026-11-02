/**
 * Converts a user input in the Brazilian format into a number.
 *
 * Accepts:
 *   "10.5"        -> 10.5     (dot as decimal point)
 *   "10,5"        -> 10.5     (comma as decimal separator)
 *   "500.000"     -> 500000   (thousand grouping)
 *   "1.234,56"    -> 1234.56  (thousand grouping + comma decimal)
 *   "R$ 1.234,56" -> 1234.56  (symbols are stripped)
 *   "-2"          -> -2     (e.g. a negative annual adjustment)
 */
export function parseBrazilianNumber(text: string): number {
  const cleaned = text.replace(/[^\d.,-]/g, '').trim()

  if (!/\d/.test(cleaned)) {
    throw new Error('Preencha o campo com um número.')
  }

  let pattern = cleaned

  if (pattern.includes(',')) {
    // Comma is the decimal separator; dots, if present, are thousand groups.
    pattern = pattern.replace(/\./g, '').replace(/,/g, '.')
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(pattern)) {
    // Only thousand groups: "1.234" means 1234.
    pattern = pattern.replace(/\./g, '')
  }

  const number = Number(pattern)

  if (!Number.isFinite(number)) {
    throw new Error(`Valor inválido: "${text.trim()}"`)
  }

  return number
}
