import { describe, expect, it } from 'vitest'

import { parseDocument } from '@/domain/receipt/parsing'
import { fixtures } from '../../fixtures/receipts.js'

const parse = (nome) => parseDocument(fixtures[nome], { sourceFile: nome })
const primeira = (nome) => parse(nome).entries[0].receipt

describe('comprovante do Itaú (Pix)', () => {
  const receipt = primeira('Itaú Pix')

  it('lê data, hora e valor', () => {
    expect(receipt.date).toBe('2026-09-22')
    expect(receipt.time).toBe('08:30:23')
    expect(receipt.amount).toBe(7047)
  })

  it('lê os dois lados', () => {
    expect(receipt.payerName).toBe('ALPHA INTERMEDIACOES LTDA')
    expect(receipt.payeeName).toBe('ACME SOLUCOES FINANCEIRAS E')
  })

  it('lê agência e conta da mesma linha', () => {
    expect(receipt.payerAccount).toBe('1234 / 56789-0')
  })

  it('classifica como pix', () => {
    expect(receipt.type).toBe('pix')
  })
})

describe('comprovante do Nubank (boleto)', () => {
  const receipt = primeira('Nubank boleto')

  it('lê a data com mês por extenso abreviado', () => {
    expect(receipt.date).toBe('2026-08-27')
  })

  it('lê agência e conta de linhas separadas', () => {
    expect(receipt.payerAccount).toBe('0001 / 123456789-0')
  })

  it('não confunde o CNPJ do rodapé (Nu Pagamentos) com o do pagador', () => {
    expect(receipt.payerDocument ?? '').not.toContain('66.777.888')
    expect(receipt.payeeDocument ?? '').not.toContain('66.777.888')
  })

  it('classifica como boleto', () => {
    expect(receipt.type).toBe('boleto')
  })
})

describe('comprovante da InfinitePay', () => {
  const receipt = primeira('InfinitePay')

  it('preserva o documento mascarado como veio', () => {
    expect(receipt.payeeDocument).toMatch(/[*x]/i)
  })

  it('lê o valor', () => {
    expect(receipt.amount).toBe(2600)
  })
})

describe('extrato do Banco do Brasil', () => {
  const resultado = parse('Extrato BB')

  it('rende várias linhas de um arquivo só', () => {
    expect(resultado.entries.length).toBeGreaterThan(1)
  })

  it('reconhece que é extrato, não comprovante', () => {
    expect(resultado.statement).toBeTruthy()
  })

  it('põe o titular do lado certo: favorecido quando entra, pagador quando sai', () => {
    const CONTA = '1234-5 / 67890-1'

    for (const { receipt } of resultado.entries) {
      const ladosComATitular = [
        receipt.payerAccount,
        receipt.payeeAccount,
      ].filter((conta) => conta === CONTA)
      expect(ladosComATitular).toHaveLength(1)
    }
  })

  it('o titular é sempre a mesma parte, em todas as linhas', () => {
    const titulares = new Set(
      resultado.entries.map(({ receipt }) =>
        receipt.payeeAccount === '1234-5 / 67890-1'
          ? receipt.payeeName
          : receipt.payerName,
      ),
    )

    expect(titulares).toEqual(new Set(['ACME S F D LTDA']))
  })

  it('todas as linhas têm data e valor', () => {
    for (const { receipt } of resultado.entries) {
      expect(receipt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isFinite(receipt.amount)).toBe(true)
    }
  })
})

describe('o conjunto inteiro', () => {
  const todas = Object.keys(fixtures).flatMap((nome) => parse(nome).entries)

  it('rende sete lançamentos', () => {
    expect(todas).toHaveLength(7)
  })

  it('nenhum fica sem data nem sem valor', () => {
    for (const { receipt } of todas) {
      expect(receipt.date).toBeTruthy()
      expect(receipt.amount).toBeGreaterThan(0)
    }
  })

  it('toda data sai em ISO', () => {
    for (const { receipt } of todas) {
      expect(receipt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('todo valor é número, nunca texto', () => {
    for (const { receipt } of todas) {
      expect(typeof receipt.amount).toBe('number')
    }
  })

  it('guarda o arquivo de origem', () => {
    expect(new Set(todas.map((e) => e.receipt.sourceFile)).size).toBe(
      Object.keys(fixtures).length,
    )
  })
})

describe('entrada degenerada', () => {
  it('texto vazio não quebra', () => {
    expect(() => parseDocument('', { sourceFile: 'vazio' })).not.toThrow()
  })

  it('texto sem nada reconhecível não inventa dados', () => {
    const { entries } = parseDocument('lorem ipsum dolor sit amet', {
      sourceFile: 'x',
    })
    for (const { receipt } of entries) {
      expect(receipt.amount ?? null).toBeNull()
    }
  })
})
