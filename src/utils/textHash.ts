/**
 * SHA-256 hex fingerprint via the Web Crypto API, lowercase - matches the backend's hash format
 * (PrivatePrep.Services.Reports.TextHasher / CvContentHasher: Convert.ToHexString(...).ToLowerInvariant()).
 */
export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
