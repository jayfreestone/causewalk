import type { ErrorConstructor, Guard } from "./matcher"
import { toGuard } from "./matcher"
import { walk } from "./walk"

/**
 * Returns the first error in the tree that matches the given predicate, or `null` if none match.
 */
export function as<T>(
  error: Error,
  matcher: Guard<T>,
): T | null

/**
 * Returns the first error in the tree that is an instance of the given constructor, or `null` if none match.
 */
export function as<T extends Error>(
  error: Error,
  constructor: ErrorConstructor<T>,
): T | null

export function as(error: Error, matcher: Guard<unknown> | ErrorConstructor<Error>): unknown {
  const matches = toGuard(matcher)

  for (const candidate of walk(error)) {
    if (matches(candidate)) {
      return candidate
    }
  }

  return null
}
