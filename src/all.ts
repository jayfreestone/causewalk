import type { ErrorConstructor, Guard } from "./matcher"
import { toGuard } from "./matcher"
import { walk } from "./walk"

/**
 * Returns every value in the error tree that matches the given predicate.
 */
export function all<T>(
  error: Error,
  matcher: Guard<T>,
): T[]

/**
 * Returns every error in the tree that is an instance of the given constructor.
 */
export function all<T extends Error>(
  error: Error,
  constructor: ErrorConstructor<T>,
): T[]

export function all(
  error: Error,
  matcher: Guard<unknown> | ErrorConstructor<Error>,
): unknown[] {
  const matches = toGuard(matcher)
  const results: unknown[] = []

  for (const candidate of walk(error)) {
    if (matches(candidate)) {
      results.push(candidate)
    }
  }

  return results
}
