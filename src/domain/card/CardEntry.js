export const EntryKind = {
  PURCHASE: 'purchase',
  IOF: 'iof',
  FEE: 'fee',
  INTEREST: 'interest',
  PAYMENT: 'payment',
  REFUND: 'refund',
}

const SPENDING = [
  EntryKind.PURCHASE,
  EntryKind.IOF,
  EntryKind.FEE,
  EntryKind.INTEREST,
]

export function amountOf(entry) {
  const value = Number(entry?.amount)
  return Number.isFinite(value) ? value : 0
}

export function isSpending(entry) {
  return SPENDING.includes(entry?.kind)
}

export function remainingInstallments(entry) {
  const { current, total } = entry?.installment ?? {}
  if (!Number.isInteger(current) || !Number.isInteger(total)) return 0
  if (current < 1 || total < current) return 0
  return total - current
}
