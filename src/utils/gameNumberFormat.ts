/**
 * Game HUD numbers: always `en-US` so decimals use "." and grouping is unambiguous.
 * (`toLocaleString(undefined)` can show e.g. "1,000" for 1.0 in fr-FR — comma as decimal.)
 */

const EN = 'en-US' as const

export function formatSscForUi(n: number): string {
  const x = Number(n) || 0
  return x.toLocaleString(EN, { minimumFractionDigits: 3, maximumFractionDigits: 6 })
}

/** Global Mercy Pot in header — thousands separators + fixed decimal places, always "." decimal */
export function formatMercyPotForHeader(amount: number, decimalPlaces: number): string {
  const n = Math.max(0, Number(amount) || 0)
  return n.toLocaleString(EN, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })
}

export function formatGoldWagerForUi(n: number): string {
  const x = Number(n) || 0
  return x.toLocaleString(EN, { maximumFractionDigits: 3 })
}
