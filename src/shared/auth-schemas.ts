import { z } from 'zod'

/**
 * Validation rules shared by the browser forms and /api/v1/auth (one source of truth).
 * Messages are UI-label keys (validation.*) so forms show them in the visitor's language.
 */
export const PASSWORD_MIN = 10
export const PASSWORD_MAX = 128

export const emailField = z
  .string()
  .trim()
  .min(1, 'validation.required')
  .max(254, 'validation.email')
  .pipe(z.email('validation.email'))
  .transform((v) => v.toLowerCase())

export const newPasswordField = z
  .string()
  .min(PASSWORD_MIN, 'validation.passwordMin')
  .max(PASSWORD_MAX, 'validation.passwordMax')

export const localeField = z.enum(['en', 'ja'])

export const registerSchema = z.strictObject({
  name: z.string().trim().min(1, 'validation.required').max(120, 'validation.nameMax'),
  email: emailField,
  password: newPasswordField,
  preferredLocale: localeField.default('en'),
})

export const loginSchema = z.strictObject({
  email: emailField,
  password: z.string().min(1, 'validation.required').max(PASSWORD_MAX, 'validation.passwordMax'),
})

export const emailOnlySchema = z.strictObject({ email: emailField })

export const tokenSchema = z.strictObject({ token: z.string().min(10).max(200) })

export const resetSchema = z.strictObject({
  token: z.string().min(10).max(200),
  password: newPasswordField,
})

export const preferencesSchema = z.strictObject({ preferredLocale: localeField })

/** Browser-only: reset form with a confirmation field. */
export const resetFormSchema = z
  .object({ password: newPasswordField, confirm: z.string().min(1, 'validation.required') })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'validation.passwordsMatch',
  })

export type RegisterInput = z.input<typeof registerSchema>
export type LoginInput = z.input<typeof loginSchema>
