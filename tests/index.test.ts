import { expect, test } from "vitest"

import { all } from "../src"

test("exports all from the package entry point", () => {
  const target = new TypeError("target")
  const error = new Error("outer", { cause: target })

  expect(all(error, TypeError)).toEqual([target])
})
