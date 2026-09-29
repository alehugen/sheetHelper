import { describe, expect, it } from 'vitest'

import { EntryKind } from '@/domain/card/CardEntry'
import { itau } from '@/domain/card/issuers/itau'
import { nubank } from '@/domain/card/issuers/nubank'
import { checkStatement, readStatement } from '@/domain/card/readStatement'
import {
  TOTAIS,
  TOTAIS_ITAU,
  faturaItau,
  faturaNubank,
} from '../../fixtures/statements.js'

const secao = (statement, nome) =>
  statement.entries.filter((entry) => entry.section === nome)

const somaDe = (statement, nome) =>
  Math.round(
    secao(statement, nome).reduce((total, e) => total + e.amount, 0) * 100,
  ) / 100

describe('fatura do Itaú', () => {
  const fatura = readStatement(faturaItau, itau)

  it('separa as seções', () => {
    expect(secao(fatura, 'purchases')).toHaveLength(4)
    expect(secao(fatura, 'payments')).toHaveLength(1)
    expect(secao(fatura, 'international')).toHaveLength(1)
    expect(secao(fatura, 'upcoming')).toHaveLength(1)
  })

  it('não conta as parcelas futuras como gasto do mês — foi o primeiro bug', () => {
    expect(somaDe(fatura, 'purchases')).toBe(TOTAIS_ITAU.compras)
    expect(somaDe(fatura, 'purchases')).not.toBe(
      TOTAIS_ITAU.compras + TOTAIS_ITAU.proximaFatura,
    )
  })

  it('lê a parcela nua sem confundir com a data', () => {
    const parcelada = secao(fatura, 'purchases').find((e) => e.installment)

    expect(parcelada.installment).toEqual({ current: 2, total: 6 })
    expect(parcelada.date).toBe('15/05')
    expect(parcelada.amount).toBe(200)
  })

  it('lê a categoria da linha de baixo', () => {
    const categorias = secao(fatura, 'purchases').map((e) => e.category)
    expect(categorias).toEqual([
      'supermercado',
      'vestuário',
      'restaurante',
      'saúde',
    ])
  })

  it('marca pagamento como pagamento, não como compra', () => {
    expect(secao(fatura, 'payments')[0].kind).toBe(EntryKind.PAYMENT)
    expect(secao(fatura, 'payments')[0].amount).toBeLessThan(0)
  })

  it('as três conferências fecham', () => {
    const conferencias = checkStatement(fatura, itau)
    expect(conferencias).toHaveLength(3)
    expect(conferencias.every((c) => c.ok)).toBe(true)
  })

  it('ignora as simulações de parcelamento do cabeçalho', () => {
    const valores = fatura.entries.map((e) => e.amount)
    expect(valores).not.toContain(460.7)
    expect(valores).not.toContain(60)
  })
})

describe('fatura do Nubank', () => {
  const fatura = readStatement(faturaNubank, nubank)

  it('lê as compras do titular', () => {
    expect(somaDe(fatura, 'purchases')).toBe(TOTAIS.subtotalTitular)
  })

  it('lê a compra internacional, cujo valor está três linhas abaixo', () => {
    const internacional = fatura.entries.find((e) => e.foreign)

    expect(internacional.foreign).toEqual({ currency: 'USD', amount: 10 })
    expect(internacional.amount).toBe(60)
  })

  it('lê a parcela escrita por extenso', () => {
    const parcelas = secao(fatura, 'purchases').filter((e) => e.installment)
    expect(parcelas).toHaveLength(4)
    expect(parcelas[0].installment).toEqual({ current: 5, total: 10 })
  })

  it('ignora os quatro dígitos do cartão no nome do estabelecimento', () => {
    const comCartao = secao(fatura, 'purchases').find((e) =>
      e.merchant.includes('Loja Exemplo'),
    )
    expect(comCartao.merchant).toBe('Loja Exemplo Movel')
  })

  it('o pagamento recebido entra negativo', () => {
    expect(fatura.declared.payments).toBe(TOTAIS.pagamento)
  })

  it('o resumo fecha no total a pagar', () => {
    const conferencias = checkStatement(fatura, nubank)
    expect(conferencias[0].ok).toBe(true)
    expect(conferencias[0].read).toBe(TOTAIS.total)
  })

  it('ignora as simulações das páginas de parcelamento', () => {
    const valores = fatura.entries.map((e) => e.amount)
    expect(valores).not.toContain(1470)
    expect(valores).not.toContain(490)
  })
})

describe('o guarda acusa quando a leitura não fecha', () => {
  it('uma linha perdida derruba a conferência', () => {
    const mutilada = faturaItau.replace(
      '02/08 MERCADO EXEMPLOCURITIBA 100,00\n',
      '',
    )
    const conferencias = checkStatement(readStatement(mutilada, itau), itau)

    expect(conferencias.find((c) => c.label === 'compras do cartão').ok).toBe(
      false,
    )
  })

  it('descrição do banco errado não lê nada', () => {
    const errada = readStatement(faturaItau, nubank)
    expect(errada.entries).toHaveLength(0)
  })

  it('texto vazio não quebra', () => {
    expect(() => readStatement('', itau)).not.toThrow()
    expect(readStatement('', itau).entries).toEqual([])
  })
})
