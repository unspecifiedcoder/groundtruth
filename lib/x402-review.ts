const DEFAULT_OKX_REVIEW_ADDRESS = '0xbc59eb75C55e3bF1E63aaeE653C2b8E02BFd2033'

export function reviewAddresses(): Set<string> {
  return new Set(
    (process.env.X402_EXEMPT_ADDRESSES ?? DEFAULT_OKX_REVIEW_ADDRESS)
      .split(',')
      .map(address => address.trim().toLowerCase())
      .filter(Boolean)
  )
}

/**
 * Read the payer only from recognized x402 credential fields.
 *
 * Never scan arbitrary JSON text for the review address: resource descriptions
 * and extension metadata are caller-controlled, so a substring match would let
 * an unrelated caller impersonate the marketplace reviewer.
 */
export function payerFromPaymentHeader(header: string | null): string | null {
  if (!header) return null

  try {
    const decoded = JSON.parse(Buffer.from(header, 'base64').toString('utf8'))
    const candidate =
      decoded?.payload?.authorization?.from ??
      decoded?.payload?.authorization?.owner ??
      decoded?.payload?.permit2Authorization?.from ??
      decoded?.payload?.permit2Authorization?.owner ??
      decoded?.payload?.from ??
      decoded?.authorization?.from ??
      decoded?.authorization?.owner ??
      decoded?.from ??
      decoded?.payer

    return typeof candidate === 'string' && /^0x[0-9a-fA-F]{40}$/.test(candidate)
      ? candidate.toLowerCase()
      : null
  } catch {
    return null
  }
}

export function isReviewPayer(header: string | null): { payer: string | null; exempt: boolean } {
  const payer = payerFromPaymentHeader(header)
  return { payer, exempt: !!payer && reviewAddresses().has(payer) }
}
