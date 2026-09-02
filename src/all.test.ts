import { describe, expect, expectTypeOf, test } from "vitest"

import { all } from "./all"

describe("all", () => {
  test("returns every constructor match in depth-first order", () => {
    class RetryableError extends Error {}

    const first = new RetryableError("first")
    const second = new RetryableError("second")
    const cause = new RetryableError("cause")

    const input = new AggregateError([
      new Error("first wrapper", { cause: first }),
      new AggregateError([second]),
    ])

    input.cause = cause

    const result = all(input, RetryableError)

    expect(result).toEqual([first, second, cause])
    expectTypeOf(result).toEqualTypeOf<RetryableError[]>()
  })

  test("continues into descendants after an error matches", () => {
    class RetryableError extends Error {}

    const child = new RetryableError("child")
    const parent = new RetryableError("parent", { cause: child })

    expect(all(parent, RetryableError)).toEqual([parent, child])
  })

  test("narrows matches using a predicate", () => {
    function hasCode(candidate: unknown): candidate is { code: string } {
      return (
        typeof candidate === "object" &&
        candidate !== null &&
        "code" in candidate &&
        typeof candidate.code === "string"
      )
    }

    const first = { code: "first" }
    const second = { code: "second" }
    const input = new AggregateError([first, second])

    const result = all(input, hasCode)

    expect(result).toEqual([first, second])
    expectTypeOf(result).toEqualTypeOf<{ code: string }[]>()
  })

  test("returns an empty array when nothing matches", () => {
    class RetryableError extends Error {}

    expect(all(new Error("failure"), RetryableError)).toEqual([])
  })

  test("returns a shared error once and terminates cycles", () => {
    class RetryableError extends Error {}

    const shared = new RetryableError("shared")
    shared.cause = shared

    const input = new AggregateError([
      shared,
      new Error("wrapper", { cause: shared }),
    ])

    input.cause = shared

    expect(all(input, RetryableError)).toEqual([shared])
  })

  test("preserves repeated primitive occurrences", () => {
    function isString(candidate: unknown): candidate is string {
      return typeof candidate === "string"
    }

    const input = new AggregateError(["retry", "retry"])

    expect(all(input, isString)).toEqual(["retry", "retry"])
  })

  test("returns suppressed errors from newest to oldest", () => {
    class RetryableError extends Error {}

    const applicationError = new RetryableError("application failed")
    const firstCleanupError = new RetryableError("first cleanup failed")
    const secondCleanupError = new RetryableError("second cleanup failed")
    const firstSuppression = Object.assign(new Error("suppressed error"), {
      name: "SuppressedError",
      error: firstCleanupError,
      suppressed: applicationError,
    })
    const input = Object.assign(new Error("suppressed error"), {
      name: "SuppressedError",
      error: secondCleanupError,
      suppressed: firstSuppression,
    })

    expect(all(input, RetryableError)).toEqual([
      secondCleanupError,
      firstCleanupError,
      applicationError,
    ])
  })
})
