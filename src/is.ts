export function is(error: Error, target: Error): boolean {
  const pending: unknown[] = [error]

  // Prevent an infinite loop if one error is its own cause/there's a cycle.
  const visited = new Set<object>()

  const matches = (error: unknown): boolean => error === target

  while (pending.length > 0) {
    const current = pending.pop()

    if (matches(current)) {
      return true
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

  return false
}