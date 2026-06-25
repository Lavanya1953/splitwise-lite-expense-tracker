export type Member = string

export type SplitPercentages = Record<string, number>

export interface Group {
  id: string
  name: string
  members: Member[]
}

export interface GroupDetail extends Group {
  defaultSplits: SplitPercentages
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

export interface SettlementResponse {
  messages: string[]
  settlements: Settlement[]
  netBalances: MemberBalance[]
}

export interface CreateExpensePayload {
  description: string
  amount: number
  payer: Member
  splits: SplitPercentages
}

export interface CreateGroupPayload {
  name: string
  members: Member[]
}
