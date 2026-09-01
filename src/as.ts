type Guard<T> = (error: unknown) => error is T

type ErrorConstructor<T extends Error> = new (...args: any[]) => T

type Matcher = (error: unknown) => boolean

/**
 * Returns the first error in the chain that matches the given predicate, or `null` if none match.
 */
export function as<T>(
  error: Error,
  matcher: Guard<T>
): T | null

/**
 * Returns the first error in the chain that is an instance of the given constructor, or `null` if none match. 
 */
export function as<T extends Error>(
  error: Error,
  constructor: ErrorConstructor<T>
): T | null

export function as(error: Error, matcher: Guard<unknown> | ErrorConstructor<Error>): unknown {
  let current: unknown = error

  // Prevent an infinite loop if one error is its own cause/there's a cycle.
  const visited = new Set<object>()

  const matches: Matcher = isErrorConstructor(matcher)
    ? error => error instanceof matcher
    : matcher

  while (true) {
    if (matches(current)) {
      return current
    }

    if (
      typeof current !== "object" ||
      current === null ||
      visited.has(current) ||
      !("cause" in current)
    ) {
      return null
    }

    visited.add(current)
    current = current.cause
  }
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
