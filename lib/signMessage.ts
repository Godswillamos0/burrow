/** The exact message users sign to prove wallet ownership. Shared by client and server. */
export function buildSignMessage(handle: string, wallet: string, nonce: string): string {
  return `Join the Burrow waitlist\nX: @${handle.replace(/^@/, '')}\nWallet: ${wallet.toLowerCase()}\nNonce: ${nonce}`;
}
