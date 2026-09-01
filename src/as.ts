type Guard<T> = (error: unknown) => error is T

type ErrorConstructor<T extends Error> = new (...args: any[]) => T

type Matcher = (error: unknown) => boolean

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
  const pending: unknown[] = [error]

  // Prevent an infinite loop if one error is its own cause/there's a cycle.
  const visited = new Set<object>()

  const matches: Matcher = isErrorConstructor(matcher)
    ? error => error instanceof matcher
    : matcher

  while (pending.length > 0) {
    const current = pending.pop()

    if (matches(current)) {
      return current
    }

    if (
      typeof current !== "object" ||
      current === null ||
      visited.has(current)
    ) {
      continue
    }

    visited.add(current)

    // Push the cause first so aggregate members are visited first by the LIFO stack.
    if ("cause" in current) {
      pending.push(current.cause)
    }

    if (current instanceof AggregateError) {
      for (let index = current.errors.length - 1; index >= 0; index--) {
        pending.push(current.errors[index])
      }
    }
  }

  return null
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
