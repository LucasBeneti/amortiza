/** Pure PRICE x SAC financing math. No DOM or Node dependencies. */

export type RateMode = 'nominal' | 'effective'
export type AmortizationSystem = 'PRICE' | 'SAC'
export type Installment = {
  number: number
  amount: number
  interest: number
  amortization: number
  balance: number
  adjustmentApplied: boolean
  adjustmentAmount: number
}
export type Summary = {
  totalPaid: number
  totalInterest: number
  totalAmortization: number
  totalAdjustment: number
  firstInstallment: number
  lastInstallment: number
  averageInstallment: number
  finalBalance: number
  totalOutlay: number
  costBeyondPropertyValue: number
}
export type Scenario = {
  system: AmortizationSystem
  propertyValue: number
  downPaymentPercent: number
  downPayment: number
  financedAmount: number
  annualRatePercent: number
  monthlyRate: number
  rateMode: RateMode
  months: number
  annualAdjustmentPercent: number
  installments: Installment[]
  summary: Summary
}
export type SimulationParameters = {
  propertyValue?: number
  annualRatePercent?: number
  months?: number
  priceDownPaymentPercent?: number
  sacDownPaymentPercent?: number
  annualAdjustmentPercent?: number
  rateMode?: RateMode
}
export type Simulation = {
  parameters: {
    propertyValue: number
    annualRatePercent: number
    monthlyRate: number
    rateMode: RateMode
    months: number
    annualAdjustmentPercent: number
  }
  price: Scenario
  sac: Scenario
}

const MONTHS_PER_YEAR = 12

/** Rounds a BRL value to cents. */
export function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Converts an annual rate (%) into a decimal monthly rate.
 *
 * - "nominal": divides the annual rate by 12 (typical contract clause).
 * - "effective": compounding, (1 + i_annual)^(1/12) - 1.
 */
export function convertAnnualRateToMonthlyRate(
  annualRatePercent: number,
  mode: RateMode = 'nominal',
): number {
  if (!Number.isFinite(annualRatePercent)) {
    throw new TypeError('A taxa anual precisa ser um número.')
  }
  if (annualRatePercent < 0) {
    throw new RangeError('A taxa anual não pode ser negativa.')
  }

  const annualRate = annualRatePercent / 100

  if (mode === 'nominal') return annualRate / MONTHS_PER_YEAR
  if (mode === 'effective') return (1 + annualRate) ** (1 / MONTHS_PER_YEAR) - 1

  throw new RangeError('Modo de taxa inválido. Use "nominal" ou "effective".')
}

/** Theoretical PRICE installment: P = balance * i / (1 - (1 + i)^-n). */
export function calculatePriceInstallment(
  balance: number,
  monthlyRate: number,
  months: number,
): number {
  if (!Number.isFinite(balance) || balance <= 0) {
    throw new RangeError('O saldo precisa ser maior que zero.')
  }
  if (!Number.isInteger(months) || months <= 0) {
    throw new RangeError('O prazo em meses precisa ser um inteiro maior que zero.')
  }
  if (!Number.isFinite(monthlyRate) || monthlyRate < 0) {
    throw new RangeError('A taxa mensal não pode ser negativa.')
  }
  if (monthlyRate === 0) return balance / months

  return (balance * monthlyRate) / (1 - (1 + monthlyRate) ** -months)
}

function validateScenario({
  financedAmount,
  monthlyRate,
  months,
  annualAdjustmentPercent,
}: {
  financedAmount: number
  monthlyRate: number
  months: number
  annualAdjustmentPercent: number
}): void {
  if (!Number.isFinite(financedAmount) || financedAmount <= 0) {
    throw new RangeError('O valor financiado precisa ser maior que zero.')
  }
  if (!Number.isInteger(months) || months <= 0) {
    throw new RangeError('O prazo em meses precisa ser um inteiro maior que zero.')
  }
  if (!Number.isFinite(monthlyRate) || monthlyRate < 0) {
    throw new RangeError('A taxa mensal não pode ser negativa.')
  }
  if (!Number.isFinite(annualAdjustmentPercent) || annualAdjustmentPercent <= -100) {
    throw new RangeError('O reajuste anual precisa ser maior que -100%.')
  }
}

function totalsFromSchedule(installments: Installment[]): {
  totalPaid: number
  totalInterest: number
  totalAmortization: number
  totalAdjustment: number
} {
  return installments.reduce(
    (totals, installment) => ({
      totalPaid: roundToCents(totals.totalPaid + installment.amount),
      totalInterest: roundToCents(totals.totalInterest + installment.interest),
      totalAmortization: roundToCents(
        totals.totalAmortization + installment.amortization,
      ),
      totalAdjustment: roundToCents(totals.totalAdjustment + installment.adjustmentAmount),
    }),
    { totalPaid: 0, totalInterest: 0, totalAmortization: 0, totalAdjustment: 0 },
  )
}

/**
 * Builds the full PRICE schedule.
 *
 * The annual adjustment, when provided, is applied to the outstanding balance
 * right after each 12-installment anniversary, and the installment is
 * recalculated for the remaining term. With a zero adjustment every installment
 * is equal (except the last one, which absorbs the rounding difference to
 * close the balance).
 */
export function generatePriceSchedule({
  financedAmount,
  monthlyRate,
  months,
  annualAdjustmentPercent = 0,
}: {
  financedAmount: number
  monthlyRate: number
  months: number
  annualAdjustmentPercent?: number
}): Installment[] {
  validateScenario({
    financedAmount,
    monthlyRate,
    months,
    annualAdjustmentPercent,
  })

  const adjustment = annualAdjustmentPercent / 100
  let balance = roundToCents(financedAmount)
  let theoreticalInstallment = roundToCents(
    calculatePriceInstallment(balance, monthlyRate, months),
  )
  const installments: Installment[] = []

  for (let month = 1; month <= months; month += 1) {
    let adjustmentApplied = false
    let adjustmentAmount = 0

    // Anniversary: applies the adjustment over the balance and recalculates
    // the installment for the remaining months.
    if (month > 1 && (month - 1) % MONTHS_PER_YEAR === 0 && adjustment !== 0) {
      const balanceBeforeAdjustment = balance
      balance = roundToCents(balance * (1 + adjustment))
      adjustmentAmount = roundToCents(balance - balanceBeforeAdjustment)
      theoreticalInstallment = roundToCents(
        calculatePriceInstallment(balance, monthlyRate, months - month + 1),
      )
      adjustmentApplied = true
    }

    const interest = roundToCents(balance * monthlyRate)
    let amortization: number
    let amount: number

    if (month === months) {
      // Last installment: absorbs the rounding difference.
      amortization = balance
      amount = roundToCents(balance + interest)
    } else {
      amount = theoreticalInstallment
      amortization = roundToCents(amount - interest)
      if (amortization > balance) {
        amortization = balance
        amount = roundToCents(balance + interest)
      }
    }

    balance = roundToCents(balance - amortization)
    installments.push({
      number: month,
      amount,
      interest,
      amortization,
      balance,
      adjustmentApplied,
      adjustmentAmount,
    })
  }

  return installments
}

/**
 * Builds the full SAC schedule.
 *
 * The amortization is the balance divided by the remaining months, which keeps
 * the amortization constant and self-adjusts after an annual balance adjustment.
 */
export function generateSacSchedule({
  financedAmount,
  monthlyRate,
  months,
  annualAdjustmentPercent = 0,
}: {
  financedAmount: number
  monthlyRate: number
  months: number
  annualAdjustmentPercent?: number
}): Installment[] {
  validateScenario({
    financedAmount,
    monthlyRate,
    months,
    annualAdjustmentPercent,
  })

  const adjustment = annualAdjustmentPercent / 100
  let balance = roundToCents(financedAmount)
  const installments: Installment[] = []

  for (let month = 1; month <= months; month += 1) {
    let adjustmentApplied = false
    let adjustmentAmount = 0

    if (month > 1 && (month - 1) % MONTHS_PER_YEAR === 0 && adjustment !== 0) {
      const balanceBeforeAdjustment = balance
      balance = roundToCents(balance * (1 + adjustment))
      adjustmentAmount = roundToCents(balance - balanceBeforeAdjustment)
      adjustmentApplied = true
    }

    const remainingMonths = months - month + 1
    const interest = roundToCents(balance * monthlyRate)
    const amortization =
      month === months
        ? balance
        : Math.min(balance, roundToCents(balance / remainingMonths))
    const amount = roundToCents(amortization + interest)

    balance = roundToCents(balance - amortization)
    installments.push({
      number: month,
      amount,
      interest,
      amortization,
      balance,
      adjustmentApplied,
      adjustmentAmount,
    })
  }

  return installments
}

function buildScenario({
  system,
  propertyValue,
  downPaymentPercent,
  annualRatePercent,
  monthlyRate,
  rateMode,
  months,
  annualAdjustmentPercent,
  generateSchedule,
}: {
  system: AmortizationSystem
  propertyValue: number
  downPaymentPercent: number
  annualRatePercent: number
  monthlyRate: number
  rateMode: RateMode
  months: number
  annualAdjustmentPercent: number
  generateSchedule: (parameters: {
    financedAmount: number
    monthlyRate: number
    months: number
    annualAdjustmentPercent: number
  }) => Installment[]
}): Scenario {
  const downPayment = roundToCents(propertyValue * (downPaymentPercent / 100))
  const financedAmount = roundToCents(propertyValue - downPayment)

  if (financedAmount <= 0) {
    throw new RangeError(
      `A entrada de ${downPaymentPercent}% não deixa valor financiado no cenário ${system}.`,
    )
  }

  const installments = generateSchedule({
    financedAmount,
    monthlyRate,
    months,
    annualAdjustmentPercent,
  })
  const totals = totalsFromSchedule(installments)

  return {
    system,
    propertyValue,
    downPaymentPercent,
    downPayment,
    financedAmount,
    annualRatePercent,
    monthlyRate,
    rateMode,
    months,
    annualAdjustmentPercent,
    installments,
    summary: {
      ...totals,
      firstInstallment: installments[0]!.amount,
      lastInstallment: installments[installments.length - 1]!.amount,
      averageInstallment: roundToCents(totals.totalPaid / months),
      finalBalance: installments[installments.length - 1]!.balance,
      totalOutlay: roundToCents(downPayment + totals.totalPaid),
      costBeyondPropertyValue: roundToCents(
        totals.totalInterest + totals.totalAdjustment,
      ),
    },
  }
}

/**
 * Simulates both systems for the same property (same term and rate), with
 * possibly different down payments: 50% on PRICE and 30% on SAC by default.
 */
export function simulateFinancing({
  propertyValue = 500_000,
  annualRatePercent = 10.5,
  months = 360,
  priceDownPaymentPercent = 50,
  sacDownPaymentPercent = 30,
  annualAdjustmentPercent = 0,
  rateMode = 'nominal',
}: SimulationParameters = {}): Simulation {
  if (!Number.isFinite(propertyValue) || propertyValue <= 0) {
    throw new RangeError('O valor do imóvel precisa ser maior que zero.')
  }
  if (!Number.isFinite(priceDownPaymentPercent) || priceDownPaymentPercent < 0) {
    throw new RangeError('A entrada da PRICE não pode ser negativa.')
  }
  if (!Number.isFinite(sacDownPaymentPercent) || sacDownPaymentPercent < 0) {
    throw new RangeError('A entrada da SAC não pode ser negativa.')
  }

  const monthlyRate = convertAnnualRateToMonthlyRate(annualRatePercent, rateMode)
  const commonParameters = {
    propertyValue,
    annualRatePercent,
    monthlyRate,
    rateMode,
    months,
    annualAdjustmentPercent,
  }

  const price = buildScenario({
    ...commonParameters,
    system: 'PRICE',
    downPaymentPercent: priceDownPaymentPercent,
    generateSchedule: generatePriceSchedule,
  })
  const sac = buildScenario({
    ...commonParameters,
    system: 'SAC',
    downPaymentPercent: sacDownPaymentPercent,
    generateSchedule: generateSacSchedule,
  })

  return {
    parameters: {
      propertyValue,
      annualRatePercent,
      monthlyRate,
      rateMode,
      months,
      annualAdjustmentPercent,
    },
    price,
    sac,
  }
}
