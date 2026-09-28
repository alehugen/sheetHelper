import { describe, expect, it } from 'vitest'

import {
  assertCapacity,
  assignTargetRows,
} from '@/domain/spreadsheet/placement'
import { inferDirection, inferSheetIndex } from '@/domain/spreadsheet/routing'
import { Direction } from '@/domain/shared/direction'

describe('inferSheetIndex', () => {
  const abas = [{ name: 'Banco do Brasil' }, { name: 'Nubank' }]

  it('encontra a aba pelo banco do comprovante', () => {
    expect(inferSheetIndex({ payeeBank: 'BCO DO BRASIL S.A' }, abas)).toBe(0)
    expect(inferSheetIndex({ payerBank: 'Nu Pagamentos' }, abas)).toBe(1)
  })

  it('sem banco reconhecível devolve null, em vez de chutar a primeira', () => {
    expect(inferSheetIndex({ payeeBank: 'Banco Inexistente' }, abas)).toBeNull()
    expect(inferSheetIndex({}, abas)).toBeNull()
  })
})

describe('inferDirection', () => {
  it('se o nome da aba aparece no favorecido, é entrada', () => {
    expect(inferDirection({ payeeName: 'ACME SOLUCOES' }, 'Acme')).toBe(
      Direction.CREDIT,
    )
  })

  it('se aparece no pagador, é saída', () => {
    expect(inferDirection({ payerName: 'ACME SOLUCOES' }, 'Acme')).toBe(
      Direction.DEBIT,
    )
  })

  it('na dúvida assume entrada', () => {
    expect(
      inferDirection({ payerName: 'OUTRO', payeeName: 'TERCEIRO' }, 'Acme'),
    ).toBe(Direction.CREDIT)
  })
})

describe('assignTargetRows', () => {
  const abas = [{ firstWritableRow: 10, lastRow: 12 }]

  it('distribui linhas em sequência a partir da primeira livre', () => {
    const linhas = assignTargetRows(
      [{ sheetIndex: 0 }, { sheetIndex: 0 }],
      abas,
    )
    expect(linhas.map((l) => l.targetRow)).toEqual([10, 11])
  })

  it('cada aba tem seu próprio contador', () => {
    const duas = [
      { firstWritableRow: 5, lastRow: 9 },
      { firstWritableRow: 20, lastRow: 29 },
    ]
    const linhas = assignTargetRows(
      [{ sheetIndex: 0 }, { sheetIndex: 1 }],
      duas,
    )
    expect(linhas.map((l) => l.targetRow)).toEqual([5, 20])
  })
})

describe('assertCapacity', () => {
  it('não reclama quando cabe', () => {
    expect(() =>
      assertCapacity(
        [{ sheetIndex: 0 }],
        [{ firstWritableRow: 1, lastRow: 10, writeMode: 'fill' }],
      ),
    ).not.toThrow()
  })
})
