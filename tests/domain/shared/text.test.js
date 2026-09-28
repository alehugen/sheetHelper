import { describe, expect, it } from 'vitest'

import {
  cleanValue,
  fold,
  namesMatch,
  normalizeName,
  normalizeText,
  onlyDigits,
  repairOcr,
  upperCase,
} from '@/domain/shared/text'

describe('normalizeName', () => {
  it('reduz a letras, números e espaço simples', () => {
    expect(normalizeName('  ACME   Serviços & Cia. Ltda ')).toBe(
      'acme servicos cia ltda',
    )
  })

  it('devolve string vazia para nulo', () => {
    expect(normalizeName(null)).toBe('')
  })
})

describe('namesMatch', () => {
  it('casa nomes iguais ignorando pontuação', () => {
    expect(namesMatch('ACME LTDA.', 'acme ltda', 8)).toBe(true)
  })

  it('casa por prefixo quando o mais curto atinge o limiar', () => {
    expect(namesMatch('ACME SERVICOS', 'ACME SERVICOS LTDA ME', 8)).toBe(true)
  })

  it('não casa quando o prefixo é menor que o limiar', () => {
    expect(namesMatch('ACME', 'ACME SERVICOS LTDA', 8)).toBe(false)
  })

  it('o limiar é parâmetro — 4 aceita o que 8 recusa', () => {
    expect(namesMatch('ACME', 'ACME SERVICOS LTDA', 4)).toBe(true)
  })

  it('nomes diferentes nunca casam', () => {
    expect(namesMatch('ACME LTDA', 'OUTRA EMPRESA', 4)).toBe(false)
  })

  it('vazio não casa com nada', () => {
    expect(namesMatch('', 'ACME', 4)).toBe(false)
  })
})

describe('utilitários de texto', () => {
  it('fold remove acento e baixa a caixa', () => {
    expect(fold('AÇÃO Ínterim')).toBe('acao interim')
  })

  it('cleanValue tira pontuação das pontas', () => {
    expect(cleanValue(' : R$ 10,00 . ')).toBe('R$ 10,00')
  })

  it('onlyDigits mantém só dígitos', () => {
    expect(onlyDigits('22.333.444/0001-81')).toBe('22333444000181')
  })

  it('upperCase normaliza espaços', () => {
    expect(upperCase('  joão   da  silva ')).toBe('JOÃO DA SILVA')
  })

  it('normalizeText colapsa linhas em branco', () => {
    expect(normalizeText('a\n\n\n\nb')).toBe('a\n\nb')
  })

  it('repairOcr junta dígito quebrado antes de mês por extenso', () => {
    expect(repairOcr('2/7 AGO 2026')).toBe('27 AGO 2026')
  })
})
