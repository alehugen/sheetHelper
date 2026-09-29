// @vitest-environment happy-dom
// Precisa de DOM: a store guarda o banco escolhido e as correções de categoria
// no localStorage.

import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { Category } from '@/domain/card/categories'
import { FindingKind } from '@/domain/card/findings'
import { itau } from '@/domain/card/issuers/itau'
import { nubank } from '@/domain/card/issuers/nubank'
import { readStatement } from '@/domain/card/readStatement'
import { useCardStore } from '@/presentation/stores/card'
import {
  TOTAIS,
  TOTAIS_ITAU,
  faturaItau,
  faturaNubank,
} from '../fixtures/statements.js'

function sessao(issuerId, texto, descritor, { limpa = true } = {}) {
  if (limpa) localStorage.clear()
  setActivePinia(createPinia())
  const card = useCardStore()
  card.setIssuer(issuerId)
  card.statement = readStatement(texto, descritor)
  card.fileName = 'exemplo.pdf'
  return card
}

describe('store de fatura — Itaú', () => {
  let card

  beforeEach(() => {
    card = sessao('itau', faturaItau, itau)
  })

  it('reconhece o banco escolhido', () => {
    expect(card.issuer.id).toBe('itau')
    expect(card.issuers.map((i) => i.id)).toEqual(['nubank', 'itau'])
  })

  it('as contas fecham', () => {
    expect(card.reconciles).toBe(true)
  })

  it('não conta as parcelas futuras no gasto do mês', () => {
    expect(card.total).toBe(TOTAIS_ITAU.compras + TOTAIS_ITAU.internacionais)
    expect(card.total).not.toBe(
      TOTAIS_ITAU.compras +
        TOTAIS_ITAU.internacionais +
        TOTAIS_ITAU.proximaFatura,
    )
  })

  it('o piso da próxima fatura vem do que o emissor declara', () => {
    expect(card.nextInvoice).toBe(TOTAIS_ITAU.proximaFatura)
  })

  it('soma o comprometido total declarado', () => {
    expect(card.committed).toBe(TOTAIS_ITAU.totalFuturo)
  })

  it('sem discordância, não há aviso', () => {
    expect(card.divergence).toBeNull()
  })

  it('a curva de compromisso desce até a última parcela', () => {
    expect(card.curve).toEqual([
      { offset: 1, amount: 200 },
      { offset: 2, amount: 200 },
      { offset: 3, amount: 200 },
    ])
  })

  it('usa a categoria que o Itaú já traz', () => {
    const porArquivo = card.current.filter((e) => e.source === 'issuer')

    expect(porArquivo.map((e) => e.category)).toEqual([
      Category.MARKET,
      Category.SHOPPING,
      Category.FOOD,
      Category.HEALTH,
    ])
  })

  it('a compra internacional fica sem categoria — aquela seção não traz', () => {
    expect(card.uncategorized).toBe(1)
    expect(card.current.find((e) => !e.category).section).toBe('international')
  })

  it('diz quanto da fatura é parcela de compra antiga', () => {
    // 200 de parcela sobre 400 de lançamento. O IOF do Itaú é só um total
    // declarado — não vira linha, então não entra na divisão.
    expect(card.fromInstallments).toBe(0.5)
  })
})

describe('store de fatura — Nubank', () => {
  let card

  beforeEach(() => {
    card = sessao('nubank', faturaNubank, nubank)
  })

  it('o resumo fecha', () => {
    expect(card.reconciles).toBe(true)
  })

  it('soma o que o titular gastou', () => {
    expect(card.total).toBe(TOTAIS.subtotalTitular)
  })

  it('sem seção de parcelas futuras, a curva sai das parcelas do mês', () => {
    expect(card.curve[0].amount).toBe(TOTAIS.saldoProximaFatura)
  })

  it('o piso declarado pelo emissor tem prioridade sobre a minha conta', () => {
    // Na fatura real do Nubank os dois discordavam, porque existe um cartão
    // adicional que o PDF não detalha. Aqui forço a mesma situação.
    const declarado = TOTAIS.saldoProximaFatura - 300
    const outra = sessao(
      'nubank',
      faturaNubank.replace(
        `Saldo em aberto da próxima fatura   R$ 1.030,00`,
        `Saldo em aberto da próxima fatura   R$ ${declarado.toFixed(2).replace('.', ',')}`,
      ),
      nubank,
    )

    expect(outra.nextInvoice).toBe(declarado)
    expect(outra.divergence.ours).toBe(TOTAIS.saldoProximaFatura)
    expect(outra.divergence.difference).toBe(300)
  })

  it('cai no dicionário, já que o Nubank não categoriza', () => {
    const mercado = card.current.find((e) => e.merchant === 'Mercado Exemplo')
    expect(mercado.category).toBe(Category.MARKET)
    expect(mercado.source).toBe('dictionary')

    const pedagio = card.current.find((e) => e.merchant?.includes('Pedágio'))
    expect(pedagio.category).toBe(Category.TRANSPORT)
  })

  it('o que o dicionário não conhece fica sem categoria, não vira "outros"', () => {
    expect(card.uncategorized).toBeGreaterThan(0)
    expect(card.current.every((e) => e.category !== undefined)).toBe(true)
  })

  it('acusa a compra internacional', () => {
    const inter = card.alerts.find((a) => a.kind === FindingKind.INTERNATIONAL)
    expect(inter.count).toBe(1)
    expect(inter.total).toBe(60)
  })
})

describe('correção de categoria', () => {
  it('a escolha da usuária vence e é lembrada', async () => {
    const card = sessao('nubank', faturaNubank, nubank)
    const alvo = card.current.find((e) => !e.category)

    card.assign(alvo.merchant, Category.SERVICES)
    const corrigido = card.current.find((e) => e.merchant === alvo.merchant)

    expect(corrigido.category).toBe(Category.SERVICES)
    expect(corrigido.source).toBe('manual')

    await Promise.resolve()
    const devolta = sessao('nubank', faturaNubank, nubank, { limpa: false })
    const lembrado = devolta.current.find((e) => e.merchant === alvo.merchant)

    expect(lembrado.category).toBe(Category.SERVICES)
    expect(lembrado.source).toBe('manual')
  })
})

describe('quando a leitura não fecha', () => {
  it('reconciles fica falso e a tela não mostra número', () => {
    localStorage.clear()
    setActivePinia(createPinia())
    const card = useCardStore()
    card.setIssuer('itau')
    card.statement = readStatement(
      faturaItau.replace('02/08 MERCADO EXEMPLOCURITIBA 100,00\n', ''),
      itau,
    )

    expect(card.reconciles).toBe(false)
    expect(card.checks.some((c) => !c.ok)).toBe(true)
  })

  it('sem fatura carregada, não há conferência nem erro', () => {
    localStorage.clear()
    setActivePinia(createPinia())
    const card = useCardStore()

    expect(card.checks).toEqual([])
    expect(card.reconciles).toBe(false)
    expect(card.total).toBe(0)
  })
})
