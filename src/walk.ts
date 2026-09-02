export function* walk(error: Error): Generator<unknown> {
  const pending: unknown[] = [error]

  // Prevent an infinite loop if one error is its own cause/there's a cycle.
  const visited = new Set<object>()

  while (pending.length > 0) {
    const current = pending.pop()

    if (typeof current === "object" && current !== null) {
      if (visited.has(current)) {
        continue
      }

      visited.add(current)
    }

    yield current

    if (typeof current !== "object" || current === null) {
      continue
    }

    // Push the cause first so aggregate members are visited first by the LIFO stack.
    if ("cause" in current) {
      pending.push(current.cause)
    }

    if (current instanceof AggregateError) {
      for (let index = current.errors.length - 1; index >= 0; index--) {
        pending.push(current.errors[index])
      }
    }

    // Push the suppressed error first so the newer error is visited first.
    if (isSuppressedErrorLike(current)) {
      pending.push(current.suppressed)
      pending.push(current.error)
    }
  }
}

/**
 * Talks and walks like a `SuppressedError`.
 * Duck-typed since it's not baseline available and not in Node yet.
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SuppressedError
 */
interface SuppressedErrorLike {
  name: "SuppressedError"
  error: unknown
  suppressed: unknown
}

function isSuppressedErrorLike(error: object): error is SuppressedErrorLike {
  return (
    "name" in error && error.name === "SuppressedError" && "error" in error && "suppressed" in error
  )
}
