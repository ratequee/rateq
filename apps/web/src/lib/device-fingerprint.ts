let cachedFingerprint: string | null = null;

/** FingerprintJS visitorId for cross-account device detection on review submit. */
export async function getDeviceFingerprint(): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  if (cachedFingerprint) return cachedFingerprint;

  try {
    const FingerprintJS = await import('@fingerprintjs/fingerprintjs');
    const agent = await FingerprintJS.load();
    const result = await agent.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch {
    return undefined;
  }
}
