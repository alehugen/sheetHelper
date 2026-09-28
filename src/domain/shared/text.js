export function normalizeText(raw) {
  if (!raw) return ''
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[​-‍﻿]/g, '')
    .replace(/[ \t ]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function repairOcr(text) {
  return String(text ?? '').replace(
    /(\d)\s?[/\\|.-]\s?(\d)(?=\s+[A-Za-zÀ-ÿ]{3,9}\.?\s+\d{4})/g,
    '$1$2',
  )
}

function deburr(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function fold(value) {
  return deburr(value).toLowerCase()
}

export function normalizeName(value) {
  return fold(value)
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function namesMatch(a, b, minPrefix) {
  const left = normalizeName(a)
  const right = normalizeName(b)
  if (!left || !right) return false
  if (left === right) return true

  const [short, long] =
    left.length <= right.length ? [left, right] : [right, left]
  return short.length >= minPrefix && long.startsWith(short)
}

export function upperCase(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleUpperCase('pt-BR')
}

export function cleanValue(value) {
  return String(value ?? '')
    .replace(/^[\s:;.–—-]+/, '')
    .replace(/[\s:;.–—-]+$/, '')
    .trim()
}

export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '')
}
