export class SpreadsheetCapacityError extends Error {
  constructor(sheetName, needed, available) {
    super(
      `A aba "${sheetName}" tem ${available} linha(s) livre(s) e são necessárias ${needed}.`,
    )
    this.name = 'SpreadsheetCapacityError'
  }
}

export function assignTargetRows(rows, sheets) {
  const next = new Map()

  return rows.map((row) => {
    const sheet = sheets[row.sheetIndex]
    if (!next.has(row.sheetIndex)) {
      next.set(row.sheetIndex, sheet?.firstWritableRow ?? 0)
    }

    const targetRow = next.get(row.sheetIndex)
    next.set(row.sheetIndex, targetRow + 1)

    return { ...row, targetRow }
  })
}

export function assertCapacity(rows, sheets) {
  const needed = new Map()
  for (const row of rows) {
    needed.set(row.sheetIndex, (needed.get(row.sheetIndex) ?? 0) + 1)
  }

  for (const [index, count] of needed) {
    const sheet = sheets[index]
    if (!sheet || sheet.writeMode !== 'fill') continue

    const available = sheet.lastRow - sheet.firstWritableRow + 1
    if (count > available) {
      throw new SpreadsheetCapacityError(sheet.name, count, available)
    }
  }
}
