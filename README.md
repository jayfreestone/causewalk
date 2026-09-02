# `causewalk`

<p align="center">
  <img src="./banner.png" alt="causewalk">
</p>

A dead-simple library for traversing native JavaScript errors.

JavaScript already has great support for error wrapping/chaining via `Error.cause`:

```js
try {
  throw new Error()
} catch (cause) {
  throw new Error("Oh no!", { cause })
}
```

`causewalk` doesn't try to reinvent the wheel or provide a custom error class, error matchers or result type. There are already great libraries like [`neverthrow`](https://github.com/supermacro/neverthrow) out there if you're ready to commit.

Instead, `causewalk` provides three tiny utility functions: `as`/`is`/`all`.

- Works in any and all JavaScript runtimes.
- Small and unopinionated.
- Works with `AggregateError` and `SuppressedError`.

## A real-world example

Imagine a payment SDK throws a `CardDeclinedError`. The checkout service adds useful context before letting the error bubble up:

```ts
async function checkout(order: Order) {
  try {
    await payments.charge(order)
  } catch (cause) {
    throw new Error(`Checkout failed for order ${order.id}`, { cause })
  }
}
```

At the edge of the application, you need to turn that failure into the right response. `causewalk` finds the original error without discarding the context added along the way:

```ts
import { as } from "causewalk"
import { CardDeclinedError } from "./payments"

try {
  await checkout(order)
  return response.status(204).send()
} catch (error) {
  const declined = as(error, CardDeclinedError)

  if (declined) {
    return response.status(402).send({ message: declined.message })
  }

  throw error
}
```

The same pattern works when deciding whether to retry a job, what to log, or how to report a failure.

> [!NOTE]
> **When would I use this?**
>
> If you're already using a rich/custom error library, `causewalk` probably isn't for you. It's designed as a simple set of utilities over native error wrapping.
>
> The second you need to care about what "type" an error is, `causewalk` lets you inspect the full chain without sacrificing the rich additional context that native error wrapping enables.

## Installation

```bash
npm install causewalk
```

# API

## `as`

Walks the error chain looking for the closest match. Pass it an error constructor:

```ts
import { as } from "causewalk"

class RetryableError extends Error {
  isRetryable() {
    return true
  }
}

const error = new Error("Could not fetch results", {
  cause: new RetryableError("Oh no"),
})

// `RetryableError` | null
const result = as(error, RetryableError)
```

Or a type predicate, if you're looking for something a little more specific:

```ts
function hasCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
  )
}

// `{ code: string } | null`
const coded = as(error, hasCode)
```

Returns `null` when there isn't a match.

## `is`

Checks whether a particular error exists anywhere in the error chain:

```ts
import { is } from "causewalk"

const timeout = new Error("Timed out")
const error = new Error("Could not fetch results", { cause: timeout })

is(error, timeout) // true
is(error, new Error("Timed out")) // false
```

Errors are compared by identity, not their type or contents. If you want to check for a type of error, use `as` instead.

## `all`

Works like `as`, but returns every match in the error chain:

```ts
import { all } from "causewalk"

const error = new AggregateError([
  new TypeError("First"),
  new Error("Something else"),
  new TypeError("Second"),
])

// `TypeError[]`
const typeErrors = all(error, TypeError)
```

`all` also accepts a type predicate. It returns an empty array when there aren't any matches.

## The nitty-gritty

Most of the time, an error and its `cause` form a straight line and there's only one possible match. When the chain branches, `causewalk` searches depth-first and returns the first match it finds.

The error you pass in is checked first:

```ts
const inner = new TypeError("Inner")
const outer = new TypeError("Outer", { cause: inner })

as(outer, TypeError) // outer
all(outer, TypeError) // [outer, inner]
```

An `AggregateError`'s errors are searched in their original order, before its `cause`:

```ts
const first = new TypeError("First")
const second = new TypeError("Second")
const cause = new TypeError("Cause")

const error = new AggregateError(
  [new Error("First wrapper", { cause: first }), second],
  "Everything failed",
  { cause },
)

as(error, TypeError) // first
all(error, TypeError) // [first, second, cause]
```

For a `SuppressedError`, the newer `error` is searched before the older `suppressed` error:

```ts
const applicationError = new TypeError("Application failed")
const cleanupError = new TypeError("Cleanup failed")
const error = new SuppressedError(cleanupError, applicationError, "Cleanup also failed")

as(error, TypeError) // cleanupError
all(error, TypeError) // [cleanupError, applicationError]
```

Error chains can contain the same error more than once, or even contain cycles. Each object is only visited once, so these won't duplicate results or loop forever.

## Can we have...

If it's already ergonomic in vanilla JS, `causewalk` has no desire to reimplement it. Dedicated error libraries with custom types provide very fluent helpers like `myErr.wrap('Additional Context')`. Causewalk doesn't: it works with native errors, and doesn't try to extend the built-ins.

Here are a few examples which are tempting but would absolutely nothing:

- `unwrap`: It's just `error.cause`.
- `join`: It's just `AggregateError`.
- `wrap`: It's just `new Error('Outer', { cause: new Error('Inner' )})`
