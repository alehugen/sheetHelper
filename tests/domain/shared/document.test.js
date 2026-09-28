import { describe, expect, it } from 'vitest'

import {
  documentDigits,
  formatDocument,
  isMasked,
  isValidDocument,
  maskDocument,
} from '@/domain/shared/document'

describe('maskDocument', () => {
  it('formata progressivamente enquanto se digita um CNPJ', () => {
    const passos = '22333444000181'
      .split('')
      .reduce(
        (acc, digito) => [...acc, maskDocument((acc.at(-1) ?? '') + digito)],
        [],
      )

    expect(passos.at(-1)).toBe('22.333.444/0001-81')
    expect(passos[1]).toBe('22')
    expect(passos[3]).toBe('223.3')
  })

  it('formata CPF até onze dígitos', () => {
    expect(maskDocument('12345678901')).toBe('123.456.789-01')
  })

  it('nunca deixa separador solto no fim, para o backspace funcionar', () => {
    for (let tamanho = 1; tamanho <= 14; tamanho += 1) {
      expect(maskDocument('22333444000181'.slice(0, tamanho))).toMatch(/\d$/)
    }
  })

  it('aceita texto já formatado ou com lixo em volta', () => {
    expect(maskDocument('CNPJ: 22.333.444/0001-81 ')).toBe('22.333.444/0001-81')
  })

  it('descarta o que passa de catorze dígitos', () => {
    expect(maskDocument('223334440001819999')).toBe('22.333.444/0001-81')
  })

  it('devolve vazio para entrada sem dígito', () => {
    expect(maskDocument('...//--')).toBe('')
    expect(maskDocument('')).toBe('')
    expect(maskDocument(null)).toBe('')
  })
})

describe('formatDocument', () => {
  it('formata CNPJ e CPF completos', () => {
    expect(formatDocument('22333444000181')).toBe('22.333.444/0001-81')
    expect(formatDocument('12345678901')).toBe('123.456.789-01')
  })

  it('preserva mascarado, padronizando o caractere', () => {
    expect(formatDocument('***.xxx.535-**')).toBe('***.***.535-**')
  })

  it('devolve o original quando não reconhece', () => {
    expect(formatDocument('abc')).toBe('abc')
  })
})

describe('isMasked e isValidDocument', () => {
  it('reconhece mascarado', () => {
    expect(isMasked('***.535.***-**')).toBe(true)
    expect(isMasked('22333444000181')).toBe(false)
  })

  it('valida dígito verificador de CNPJ', () => {
    expect(isValidDocument('22.333.444/0001-81')).toBe(true)
    expect(isValidDocument('22.333.444/0001-80')).toBe(false)
  })

  it('aceita mascarado sem conseguir validar', () => {
    expect(isValidDocument('***.535.***-**')).toBe(true)
  })

  it('recusa vazio e tamanho errado', () => {
    expect(isValidDocument('')).toBe(false)
    expect(isValidDocument('123')).toBe(false)
  })

  it('documentDigits extrai só os dígitos', () => {
    expect(documentDigits('22.333.444/0001-81')).toBe('22333444000181')
  })
})
