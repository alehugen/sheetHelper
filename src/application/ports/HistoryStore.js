export const HISTORY_LIMIT = 3

export function createHistoryEntry({
  id,
  createdAt,
  fileName,
  format,
  receipts,
}) {
  return {
    id,
    createdAt,
    fileName,
    format,
    receipts,
    count: receipts.length,
    total: receipts.reduce(
      (sum, receipt) => sum + (Number(receipt.amount) || 0),
      0,
    ),
  }
}
