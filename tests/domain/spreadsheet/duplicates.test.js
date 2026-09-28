import { describe, expect, it } from 'vitest'

import {
  DuplicateLevel,
  addToIndex,
  buildIndex,
  findDuplicate,
  toRecord,
} from '@/domain/spreadsheet/duplicates'

const lancamento = (campos) =>
  toRecord(
    { date: '2026-08-14', amount: 100, payerName: 'ACME LTDA', ...campos },
    1,
  )

describe('toRecord', () => {
  it('guarda o valor em centavos, para não comparar float', () => {
    expect(lancamento({ amount: 100.5 }).amount).toBe(10050)
  })

  it('normaliza o identificador, ignorando pontuação e caixa', () => {
    expect(lancamento({ transactionId: 'E-1234/ab' }).id).toBe('e1234ab')
  })

  it('campos ausentes viram null em vez de undefined', () => {
    const registro = toRecord({}, 1)
    expect(registro).toMatchObject({
      date: null,
      amount: null,
      name: null,
      id: null,
    })
  })
})

describe('findDuplicate', () => {
  it('identificador igual é duplicata certa, mesmo com valor diferente', () => {
    const indice = buildIndex([lancamento({ transactionId: 'E123' })])
    const achado = findDuplicate(
      lancamento({ transactionId: 'E123', amount: 999 }),
      indice,
    )

    expect(achado.level).toBe(DuplicateLevel.CERTAIN)
  })

  it('data e valor iguais com nome igual é duplicata certa', () => {
    const indice = buildIndex([lancamento({})])
    expect(findDuplicate(lancamento({}), indice).level).toBe(
      DuplicateLevel.CERTAIN,
    )
  })

  it('data e valor iguais com nome diferente é apenas possível', () => {
    const indice = buildIndex([lancamento({ payerName: 'ACME LTDA' })])
    const achado = findDuplicate(
      lancamento({ payerName: 'OUTRA EMPRESA' }),
      indice,
    )

    expect(achado.level).toBe(DuplicateLevel.POSSIBLE)
  })

  it('o nome casa por prefixo curto — variações do mesmo cadastro', () => {
    const indice = buildIndex([lancamento({ payerName: 'ACME SERVICOS LTDA' })])
    const achado = findDuplicate(
      lancamento({ payerName: 'ACME SERVICOS LTDA ME' }),
      indice,
    )

    expect(achado.level).toBe(DuplicateLevel.CERTAIN)
  })

  it('data diferente não é duplicata', () => {
    const indice = buildIndex([lancamento({})])
    expect(
      findDuplicate(lancamento({ date: '2026-08-15' }), indice).level,
    ).toBe(DuplicateLevel.NONE)
  })

  it('índice vazio nunca acusa', () => {
    expect(findDuplicate(lancamento({}), buildIndex([])).level).toBe(
      DuplicateLevel.NONE,
    )
  })

  it('devolve quais linhas colidiram, para a tela poder apontar', () => {
    const indice = buildIndex([lancamento({})])
    expect(findDuplicate(lancamento({}), indice).matches[0].reference).toBe(1)
  })
})

describe('addToIndex', () => {
  it('registra o que foi acrescentado, evitando duplicata dentro do mesmo lote', () => {
    const indice = buildIndex([])
    addToIndex(indice, lancamento({}))

    expect(findDuplicate(lancamento({}), indice).level).toBe(
      DuplicateLevel.CERTAIN,
    )
  })
})
