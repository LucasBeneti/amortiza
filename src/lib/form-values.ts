import { type RateMode, type SimulationParameters } from './financing'
import { formatCurrency } from './format'
import { parseBrazilianNumber } from './input'

export type RawFormValues = {
  propertyValue: string
  annualRate: string
  months: string
  priceDownPayment: string
  sacDownPayment: string
  annualAdjustment: string
  rateMode: RateMode
}

export const INITIAL_FORM_VALUES: RawFormValues = {
  propertyValue: formatCurrency(500_000),
  annualRate: '10.5',
  months: '360',
  priceDownPayment: '50',
  sacDownPayment: '30',
  annualAdjustment: '0',
  rateMode: 'effective',
}

/** Converts the raw form strings into parsed numeric simulation parameters. */
export function parseFormValues(values: RawFormValues): Required<SimulationParameters> {
  return {
    propertyValue: parseBrazilianNumber(values.propertyValue),
    annualRatePercent: parseBrazilianNumber(values.annualRate),
    months: parseBrazilianNumber(values.months),
    priceDownPaymentPercent: parseBrazilianNumber(values.priceDownPayment),
    sacDownPaymentPercent: parseBrazilianNumber(values.sacDownPayment),
    annualAdjustmentPercent: parseBrazilianNumber(values.annualAdjustment),
    rateMode: values.rateMode,
  }
}
