import { describe, expect, test } from "vitest"

import { is } from "./is"

describe("is", () => {
  test("returns true when the error is the target", () => {
    const target = new Error("target")

    expect(is(target, target)).toBe(true)
  })

  test("compares errors by identity", () => {
    const error = new Error("same message")
    const target = new Error("same message")

    expect(is(error, target)).toBe(false)
  })

  test("returns true when a cause is the target", () => {
    const target = new Error("target")
    const error = new Error("outer", {
      cause: new Error("middle", { cause: target }),
    })

    expect(is(error, target)).toBe(true)
  })

  test("returns false when the target is not in the error tree", () => {
    const error = new Error("outer", { cause: new Error("inner") })

    expect(is(error, new Error("inner"))).toBe(false)
  })

  test("searches aggregate errors", () => {
    const target = new Error("target")
    const error = new AggregateError([
      new Error("first"),
      new Error("second", { cause: target }),
    ])

    expect(is(error, target)).toBe(true)
  })

  test("searches suppressed errors", () => {
    const target = new Error("cleanup failed")
    const error = Object.assign(new Error("both operations failed"), {
      name: "SuppressedError",
      error: target,
      suppressed: new Error("application failed"),
    })

    expect(is(error, target)).toBe(true)
  })

  test("handles cycles in the error tree", () => {
    const first = new Error("first")
    const second = new Error("second", { cause: first })
    first.cause = second

    expect(is(first, new Error("target"))).toBe(false)
  })
})
