export function logActionError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}]`, message, error);
}
