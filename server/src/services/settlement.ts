import type {
  Expense,
  Member,
  MemberBalance,
  Settlement,
  SplitPercentages,
} from '../types.js'
import { GROUP_MEMBERS } from '../types.js'

const EPSILON = 0.01

export function createEqualSplits(): SplitPercentages {
  const share = Math.floor(100 / GROUP_MEMBERS.length)
  const remainder = 100 - share * GROUP_MEMBERS.length
  return Object.fromEntries(
    GROUP_MEMBERS.map((member, index) => [
      member,
      share + (index < remainder ? 1 : 0),
    ]),
  ) as SplitPercentages
}

export function getSplitTotal(splits: SplitPercentages): number {
  return GROUP_MEMBERS.reduce((sum, member) => sum + splits[member], 0)
}

export function isValidSplitTotal(splits: SplitPercentages): boolean {
  return Math.abs(getSplitTotal(splits) - 100) < EPSILON
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function calculateNetBalances(expenses: Expense[]): MemberBalance[] {
  const balances = Object.fromEntries(
    GROUP_MEMBERS.map((member) => [member, 0]),
  ) as Record<Member, number>

  for (const expense of expenses) {
    const { amount, payer, splits } = expense

    balances[payer] += amount

    for (const member of GROUP_MEMBERS) {
      const share = (amount * splits[member]) / 100
      balances[member] -= share
    }
  }

  return GROUP_MEMBERS.map((member) => ({
    member,
    net: roundCurrency(balances[member]),
  }))
}

export function minimizeDebts(expenses: Expense[]): Settlement[] {
  const netBalances = calculateNetBalances(expenses)

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

export function getSettlementMessages(expenses: Expense[]): string[] {
  const settlements = minimizeDebts(expenses)
  const settledMembers = new Set<Member>()

  for (const { from, to } of settlements) {
    settledMembers.add(from)
    settledMembers.add(to)
  }

  const messages = settlements.map(
    ({ from, to, amount }) => `${from} owes ${to} ${formatCurrency(amount)}`,
  )

  for (const member of GROUP_MEMBERS) {
    if (!settledMembers.has(member)) {
      messages.push(`${member} owes nobody (Even)`)
    }
  }

  return messages
}

export function buildSettlementResponse(expenses: Expense[]) {
  return {
    messages: getSettlementMessages(expenses),
    settlements: minimizeDebts(expenses),
    netBalances: calculateNetBalances(expenses),
  }
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}
