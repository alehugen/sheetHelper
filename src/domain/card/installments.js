import { amountOf, remainingInstallments } from './CardEntry.js'

const MAX_HORIZON = 72

export function futureCommitment(entries) {
  const pending = entries
    .map((entry) => ({
      amount: amountOf(entry),
      remaining: remainingInstallments(entry),
    }))
    .filter((item) => item.remaining > 0 && item.amount > 0)

  const horizon = Math.min(
    pending.reduce((longest, item) => Math.max(longest, item.remaining), 0),
    MAX_HORIZON,
  )

  return Array.from({ length: horizon }, (_, index) => ({
    offset: index + 1,
    amount: pending.reduce(
      (sum, item) => sum + (item.remaining > index ? item.amount : 0),
      0,
    ),
  }))
}

export function committedTotal(entries) {
  return futureCommitment(entries).reduce((sum, month) => sum + month.amount, 0)
}

export function committedNext(entries) {
  return futureCommitment(entries)[0]?.amount ?? 0
}

export function installmentShare(entries) {
  const spent = entries.reduce(
    (sum, entry) => sum + (entry.installment ? amountOf(entry) : 0),
    0,
  )
  const total = entries.reduce((sum, entry) => sum + amountOf(entry), 0)
  return total ? spent / total : 0
}
