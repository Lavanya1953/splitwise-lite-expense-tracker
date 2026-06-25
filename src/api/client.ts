import type {
  CreateExpensePayload,
  Expense,
  Member,
  MembersResponse,
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

export function fetchMembers(): Promise<MembersResponse> {
  return request<MembersResponse>('/members')
}

export function fetchExpenses(): Promise<Expense[]> {
  return request<Expense[]>('/expenses')
}

export function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  return request<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteExpense(id: string): Promise<void> {
  return request<void>(`/expenses/${id}`, { method: 'DELETE' })
}

export function fetchSettlements(): Promise<SettlementResponse> {
  return request<SettlementResponse>('/settlements')
}

export type { Member, SplitPercentages }
