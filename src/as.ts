import { walk } from "./walk"

type Guard<T> = (error: unknown) => error is T

type ErrorConstructor<T extends Error> = new (...args: any[]) => T

/**
 * Returns the first error in the tree that matches the given predicate, or `null` if none match.
 */
export function as<T>(
  error: Error,
  matcher: Guard<T>
): T | null

/**
 * Returns the first error in the tree that is an instance of the given constructor, or `null` if none match.
 */
export function as<T extends Error>(
  error: Error,
  constructor: ErrorConstructor<T>
): T | null

export function as(error: Error, matcher: Guard<unknown> | ErrorConstructor<Error>): unknown {
  const matches: Guard<unknown> = isErrorConstructor(matcher)
    ? (error): error is Error => error instanceof matcher
    : matcher

  return walk(error, matches)
}

function isErrorConstructor(
  matcher: Guard<unknown> | ErrorConstructor<Error>,
): matcher is ErrorConstructor<Error> {
  const { prototype } = matcher as { prototype?: unknown }

  return (
    prototype === Error.prototype ||
    prototype instanceof Error
  )
}
