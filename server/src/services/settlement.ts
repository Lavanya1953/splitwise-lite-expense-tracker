import type {
  Expense,
  Member,
  MemberBalance,
  Settlement,
  SplitPercentages,
} from '../types.js'

const EPSILON = 0.01

export function createEqualSplits(members: readonly Member[]): SplitPercentages {
  if (members.length === 0) return {}

  const share = Math.floor(100 / members.length)
  const remainder = 100 - share * members.length
  return Object.fromEntries(
    members.map((member, index) => [
      member,
      share + (index < remainder ? 1 : 0),
    ]),
  )
}

export function getSplitTotal(
  splits: SplitPercentages,
  members: readonly Member[],
): number {
  return members.reduce((sum, member) => sum + (splits[member] ?? 0), 0)
}

export function isValidSplitTotal(
  splits: SplitPercentages,
  members: readonly Member[],
): boolean {
  return Math.abs(getSplitTotal(splits, members) - 100) < EPSILON
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function calculateNetBalances(
  expenses: Expense[],
  members: readonly Member[],
): MemberBalance[] {
  const balances = Object.fromEntries(
    members.map((member) => [member, 0]),
  ) as Record<string, number>

  for (const expense of expenses) {
    const { amount, payer, splits } = expense

    balances[payer] = (balances[payer] ?? 0) + amount

    for (const member of members) {
      const share = (amount * (splits[member] ?? 0)) / 100
      balances[member] = (balances[member] ?? 0) - share
    }
  }

  return members.map((member) => ({
    member,
    net: roundCurrency(balances[member] ?? 0),
  }))
}

export function minimizeDebts(
  expenses: Expense[],
  members: readonly Member[],
): Settlement[] {
  const netBalances = calculateNetBalances(expenses, members)

  const creditors: { member: Member; amount: number }[] = []
  const debtors: { member: Member; amount: number }[] = []

  for (const { member, net } of netBalances) {
    if (net > EPSILON) {
      creditors.push({ member, amount: net })
    } else if (net < -EPSILON) {
      debtors.push({ member, amount: -net })
    }
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const settlements: Settlement[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const transfer = roundCurrency(Math.min(debtors[i].amount, creditors[j].amount))

    if (transfer > EPSILON) {
      settlements.push({
        from: debtors[i].member,
        to: creditors[j].member,
        amount: transfer,
      })
    }

    debtors[i].amount = roundCurrency(debtors[i].amount - transfer)
    creditors[j].amount = roundCurrency(creditors[j].amount - transfer)

    if (debtors[i].amount <= EPSILON) i++
    if (creditors[j].amount <= EPSILON) j++
  }

  return settlements
}

export function getSettlementMessages(
  expenses: Expense[],
  members: readonly Member[],
): string[] {
  const settlements = minimizeDebts(expenses, members)
  const settledMembers = new Set<Member>()

  for (const { from, to } of settlements) {
    settledMembers.add(from)
    settledMembers.add(to)
  }

  const messages = settlements.map(
    ({ from, to, amount }) => `${from} owes ${to} ${formatCurrency(amount)}`,
  )

  for (const member of members) {
    if (!settledMembers.has(member)) {
      messages.push(`${member} owes nobody (Even)`)
    }
  }

  return messages
}

export function buildSettlementResponse(
  expenses: Expense[],
  members: readonly Member[],
) {
  return {
    messages: getSettlementMessages(expenses, members),
    settlements: minimizeDebts(expenses, members),
    netBalances: calculateNetBalances(expenses, members),
  }
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}
