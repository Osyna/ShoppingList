import { pb } from '../../pb'
import type { AuthUser } from '../../types'

/**
 * Auth-related wire operations.
 *
 * Throws `AuthError` with a typed code; UI callers translate the code
 * to a user-facing message. Keeps the repo layer free of i18n imports.
 */
export type AuthErrorCode = 'invalidCredentials' | 'signupFailed'

export class AuthError extends Error {
  readonly code: AuthErrorCode
  readonly detail?: string
  constructor(code: AuthErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = 'AuthError'
    this.code = code
    this.detail = detail
  }
}

export const authRepo = {
  currentUser(): AuthUser | null {
    return (pb.authStore.model as AuthUser | null) ?? null
  },

  isValid(): boolean {
    return pb.authStore.isValid
  },

  onChange(cb: () => void): () => void {
    return pb.authStore.onChange(cb)
  },

  async login(email: string, password: string): Promise<void> {
    try {
      await pb.collection('users').authWithPassword(email, password)
    } catch {
      throw new AuthError('invalidCredentials')
    }
  },

  async signup(email: string, password: string, name: string): Promise<void> {
    try {
      await pb.collection('users').create({
        email,
        password,
        passwordConfirm: password,
        name,
      })
      await pb.collection('users').authWithPassword(email, password)
    } catch (e: unknown) {
      throw new AuthError('signupFailed', parseSignupDetail(e))
    }
  },

  logout(): void {
    pb.authStore.clear()
  },
}

function parseSignupDetail(e: unknown): string | undefined {
  const resp = (e as { response?: { data?: Record<string, { message?: string }> } })?.response
    ?.data
  if (!resp) return undefined
  const msg = Object.values(resp)
    .map((v) => v?.message)
    .filter(Boolean)
    .join(' — ')
  return msg || undefined
}
