export type Member = string

export type SplitPercentages = Record<string, number>

export interface Group {
  id: string
  name: string
  members: Member[]
}

export interface Expense {
  id: string
  groupId: string
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

export interface CreateGroupInput {
  name: string
  members: Member[]
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

export const DEFAULT_GROUP_MEMBERS = ['Amit', 'Rahul', 'Sneha'] as const
