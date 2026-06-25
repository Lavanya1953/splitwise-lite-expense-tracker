export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

/** UI-only preview of a member's share (server computes authoritative balances). */
export function previewShare(amount: number, percentage: number): number {
  return (amount * percentage) / 100
}

/** UI-only check so submit stays disabled until sliders total 100%. */
export function getSplitTotal(
  splits: Record<string, number>,
  members: readonly string[],
): number {
  return members.reduce((sum, member) => sum + (splits[member] ?? 0), 0)
}

export function isValidSplitTotal(
  splits: Record<string, number>,
  members: readonly string[],
): boolean {
  return Math.abs(getSplitTotal(splits, members) - 100) < 0.01
}
