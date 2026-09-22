import { bbStatementParser } from './bbStatement.js'

const STATEMENTS = [bbStatementParser]

const MIN_SCORE = 6

export function detectStatement(text) {
  const ranked = STATEMENTS.map((parser) => ({
    parser,
    score: parser.score(text),
  })).sort((a, b) => b.score - a.score)

  const best = ranked[0]
  return best && best.score >= MIN_SCORE ? best : null
}
