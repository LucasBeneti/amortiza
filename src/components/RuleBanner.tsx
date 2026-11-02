/**
 * Notice about the market rule of thumb: PRICE requires a ~50% down payment
 * and SAC sits around 30%. The inputs come pre-filled with those values and
 * can be increased at any time.
 */
export function RuleBanner() {
  return (
    <aside className="rule-banner" role="note">
      <p>
        Regra de bolso do mercado: na <strong>PRICE</strong> os financiadores
        pedem ≈ <strong>50%</strong> de entrada; na <strong>SAC</strong>,
        ≈ <strong>30%</strong>. Os campos já vêm preenchidos assim — e você
        pode aumentar a entrada em qualquer modalidade: mais entrada diminui o
        valor financiado e a parcela.
      </p>
    </aside>
  )
}
