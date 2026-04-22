import { AuthError, type AuthErrorCode } from '../data/repositories'
import { useI18n } from '../i18n'

/**
 * Translates an `AuthError` (or arbitrary throwable) into a user-facing string.
 * Centralizes the mapping from wire-layer error codes to i18n keys so every
 * auth-related view uses the same text.
 */
export function useAuthErrorMessage() {
  const t = useI18n()

  const codeToMessage: Record<AuthErrorCode, () => string> = {
    invalidCredentials: () => t.auth.invalid,
    signupFailed: () => t.auth.signupFailed,
  }

  return function messageFor(e: unknown, fallback?: string): string {
    if (e instanceof AuthError) {
      return e.detail ?? codeToMessage[e.code]()
    }
    if (e && typeof (e as { message?: unknown }).message === 'string') {
      return (e as { message: string }).message
    }
    return fallback ?? t.common.error
  }
}
