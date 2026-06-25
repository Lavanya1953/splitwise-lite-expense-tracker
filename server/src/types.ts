export const GROUP_MEMBERS = ['Amit', 'Rahul', 'Sneha'] as const

export type Member = (typeof GROUP_MEMBERS)[number]

export type SplitPercentages = Record<Member, number>

export interface Expense {
  id: string
  description: string
  amount: number
  payer: Member
  splits: SplitPercentages
}

export interface Settlement {
  from: Member
  to: Member
  amount: number
}

export interface MemberBalance {
  member: Member
  net: number
}

export interface CreateExpenseInput {
  description: string
  amount: number
  payer: Member
  splits: SplitPercentages
}

export interface SettlementResponse {
  messages: string[]
  settlements: Settlement[]
  netBalances: MemberBalance[]
}
