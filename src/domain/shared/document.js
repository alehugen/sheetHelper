import { cnpj, cpf } from 'cpf-cnpj-validator'

export function documentDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}

export function isMasked(value) {
  return /[*x]/i.test(String(value ?? ''))
}

export function formatDocument(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (isMasked(raw)) return raw.toUpperCase().replace(/X/g, '*')

  const digits = documentDigits(raw)
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (digits.length === 14) {
    return digits.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    )
  }
  return raw
}

const CPF_GROUPS = [3, 3, 3, 2]
const CPF_SEPARATORS = ['.', '.', '-']
const CNPJ_GROUPS = [2, 3, 3, 4, 2]
const CNPJ_SEPARATORS = ['.', '.', '/', '-']
const CPF_LENGTH = 11
const CNPJ_LENGTH = 14

export function maskDocument(value) {
  const digits = documentDigits(value).slice(0, CNPJ_LENGTH)
  if (!digits) return ''

  const asCpf = digits.length <= CPF_LENGTH
  const groups = asCpf ? CPF_GROUPS : CNPJ_GROUPS
  const separators = asCpf ? CPF_SEPARATORS : CNPJ_SEPARATORS

  let masked = ''
  let cursor = 0
  for (
    let index = 0;
    index < groups.length && cursor < digits.length;
    index += 1
  ) {
    if (index) masked += separators[index - 1]
    masked += digits.slice(cursor, cursor + groups[index])
    cursor += groups[index]
  }
  return masked
}

export function isValidDocument(value) {
  if (!value) return false
  if (isMasked(value)) return true
  const digits = documentDigits(value)
  if (digits.length === 11) return cpf.isValid(digits)
  if (digits.length === 14) return cnpj.isValid(digits)
  return false
}
