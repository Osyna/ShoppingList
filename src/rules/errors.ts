export class RuleViolationError extends Error {
  readonly ruleId: string
  constructor(ruleId: string, message: string) {
    super(message)
    this.name = 'RuleViolationError'
    this.ruleId = ruleId
  }
}

export function isRuleViolation(e: unknown): e is RuleViolationError {
  return e instanceof RuleViolationError
}
