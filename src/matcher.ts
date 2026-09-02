export type Guard<T> = (error: unknown) => error is T

export type ErrorConstructor<T extends Error> = new (...args: any[]) => T

export function toGuard(matcher: Guard<unknown> | ErrorConstructor<Error>): Guard<unknown> {
  return isErrorConstructor(matcher) ? (error): error is Error => error instanceof matcher : matcher
}

function isErrorConstructor(
  matcher: Guard<unknown> | ErrorConstructor<Error>,
): matcher is ErrorConstructor<Error> {
  const { prototype } = matcher as { prototype?: unknown }

  return prototype === Error.prototype || prototype instanceof Error
}
