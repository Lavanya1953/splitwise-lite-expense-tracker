import type {
  CreateExpensePayload,
  CreateGroupPayload,
  Expense,
  Group,
  GroupDetail,
  Member,
  SettlementResponse,
  SplitPercentages,
} from '../types'

const API_BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${response.status})`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function fetchGroups(): Promise<Group[]> {
  return request<Group[]>('/groups')
}

export function createGroup(payload: CreateGroupPayload): Promise<Group> {
  return request<Group>('/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteGroup(groupId: string): Promise<void> {
  return request<void>(`/groups/${groupId}`, { method: 'DELETE' })
}

export function fetchGroup(groupId: string): Promise<GroupDetail> {
  return request<GroupDetail>(`/groups/${groupId}`)
}

export function fetchExpenses(groupId: string): Promise<Expense[]> {
  return request<Expense[]>(`/groups/${groupId}/expenses`)
}

export function createExpense(
  groupId: string,
  payload: CreateExpensePayload,
): Promise<Expense> {
  return request<Expense>(`/groups/${groupId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteExpense(groupId: string, expenseId: string): Promise<void> {
  return request<void>(`/groups/${groupId}/expenses/${expenseId}`, {
    method: 'DELETE',
  })
}

export function fetchSettlements(groupId: string): Promise<SettlementResponse> {
  return request<SettlementResponse>(`/groups/${groupId}/settlements`)
}

export type { Member, SplitPercentages }
