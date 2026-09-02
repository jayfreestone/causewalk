import { walk } from "./walk"

export function is(error: Error, target: Error): boolean {
  return walk(error, (candidate): candidate is Error => candidate === target) !== null
}
