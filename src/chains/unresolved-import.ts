export function isUnresolvedImport(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const code = "code" in error ? error.code : undefined;
  if (code === "ERR_MODULE_NOT_FOUND" || code === "MODULE_NOT_FOUND") {
    return true;
  }
  return error instanceof Error && /cannot find (?:package|module)/i.test(error.message);
}

export function missingPeerError(label: string, pkg: string, ...alsoInstall: string[]): Error {
  const install = [pkg, ...alsoInstall].join(" ");
  return new Error(`${label} key provided but ${pkg} is not installed. bun add ${install}`);
}
