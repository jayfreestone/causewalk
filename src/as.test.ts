import { describe, test, expect, expectTypeOf, vi } from "vitest" 
import { as } from './as'

describe("as", () => {
  describe("When the target is an error constructor", () => {
    test("Returns the target when the target is a match", () => {
      class RetryableError extends Error {
        isRetryable() {
          return true
        }
      }

      const target = new RetryableError()

      const result = as(target, RetryableError)

      expect(result).toBe(target)
    })

    test("Returns the target when there's a match in the chain", () => {
      class RetryableError extends Error {
        isRetryable() {
          return true
        }
      }

      const target = new RetryableError()

      const result = as(new Error('', { cause: target }), RetryableError)

      expect(result).toBe(target)
    })

    test("Types the return value correctly", () => {
      class RetryableError extends Error {
        isRetryable() {
          return true
        }
      }

      const target = new RetryableError()

      const result = as(target, RetryableError)

      expectTypeOf(result).toEqualTypeOf<RetryableError | null>()
    })
  })

  describe("When the target is a predicate", () => {
    test("Returns the target when it matches the predicate", () => {
      function isRetryable(type: unknown): type is { isRetryable(): boolean } {
        return typeof type === "object" && type !== null && "isRetryable" in type
      }

      class RetryableError extends Error {
        isRetryable() {
          return true
        }
      }

      const target = new RetryableError()

      const result = as(target, isRetryable)

      expect(result).toBe(target)
    })

    test("Extracts a nested error from the chain when it matches the predicate", () => {
      function isRetryable(type: unknown): type is { isRetryable(): boolean } {
        return typeof type === "object" && type !== null && "isRetryable" in type
      }

      class RetryableError extends Error {
        isRetryable() {
          return true
        }
      }

      const target = new RetryableError()

      const result = as(new Error('', { cause: target }), isRetryable)

      expect(result).toBe(target)
    })

    test("Types the return value correctly", () => {
      function isRetryable(type: unknown): type is { isRetryable(): boolean } {
        return typeof type === "object" && type !== null && "isRetryable" in type
      }

      const result = as(new Error(''), isRetryable)

      expectTypeOf(result).toEqualTypeOf<{ isRetryable(): boolean } | null>()
    })
  })

  describe("Aggregate errors", () => {
    test("Returns the target when the target is a match", () => {
      class RetryableError extends Error {
        isRetryable() {
          return true
        }
      }

      const target = new RetryableError()

      const result = as(new AggregateError([target]), RetryableError)

      expect(result).toBe(target)
    })

    test("Returns the first depth-first match from an aggregate's own list", () => {
      class RetryableError extends Error {
        isRetryable() {
          return true
        }
      }

      const targetOne = new RetryableError()
      const targetTwo = new RetryableError()

      const result = as(new AggregateError([
        new Error('', { cause: targetOne }),
        new Error('', { cause: targetTwo }),
      ]), RetryableError)

      expect(result).toBe(targetOne)
    })

    test("Prefers its own errors over cause", () => {
      class RetryableError extends Error {
        isRetryable() {
          return true
        }
      }

      const target = new RetryableError()
      const cause = new RetryableError()

      const input = new AggregateError([
        new Error('', { cause: target }),
      ])

      input.cause = cause

      const result = as(input, RetryableError)

      expect(result).toBe(target)
    })
  })

  test("Finds a match in a suppressed error", () => {
    class RetryableError extends Error {}

    const applicationError = new RetryableError("application failed")
    const input = Object.assign(new Error("both operations failed"), {
      name: "SuppressedError",
      error: new Error("cleanup failed"),
      suppressed: applicationError,
    })

    expect(as(input, RetryableError)).toBe(applicationError)
  })

  test("Examines an error once when the tree contains a cycle", () => {
    const predicateSpy = vi.fn()

    function isRetryable(_type: unknown): _type is { isRetryable(): boolean } {
      predicateSpy()
      return false
    }

    const target = new Error()
    target.cause = target

    as(target, isRetryable)

    expect(predicateSpy).toHaveBeenCalledTimes(1)
  })
})
