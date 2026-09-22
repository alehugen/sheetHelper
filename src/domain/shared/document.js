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

export function isValidDocument(value) {
  if (!value) return false
  if (isMasked(value)) return true
  const digits = documentDigits(value)
  if (digits.length === 11) return cpf.isValid(digits)
  if (digits.length === 14) return cnpj.isValid(digits)
  return false
}
