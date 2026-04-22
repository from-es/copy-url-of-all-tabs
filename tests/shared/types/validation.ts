/**
 * Type to be used for testing runtime validation.
 *
 * This type is used to intentionally bypass TypeScript's static type checking
 * when passing invalid values to functions to verify their runtime validation logic.
 * By using this type instead of a raw `any`, we can clearly communicate the intent
 * and centralize the ESLint warning suppression.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IntentionalAnyForValidation = any;