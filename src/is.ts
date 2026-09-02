import { walk } from "./walk"

/**
 * Returns `true` if the target is in the given error tree, or `false` if not.
 * Doesn't try to narrow the type, since the target could be nested in any part of the error tree.
 * Use `as` if you want to extract a nested error and narrow the type.
 */
export function is(error: Error, target: Error): boolean {
  for (const candidate of walk(error)) {
    if (candidate === target) {
      return true
    }
  }

  return false
}
