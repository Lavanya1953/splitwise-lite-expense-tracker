import { randomUUID } from 'node:crypto'
import type { CreateExpenseInput, Expense, Member } from '../types.js'
import { getGroup } from './groupService.js'
import { isValidSplitTotal } from './settlement.js'

const expenses: Expense[] = []

export function listExpenses(groupId: string): Expense[] {
  return expenses.filter((expense) => expense.groupId === groupId)
}

export function addExpense(groupId: string, input: CreateExpenseInput): Expense {
  const group = getGroup(groupId)
  if (!group) {
    throw new ValidationError('Group not found')
  }

  validateExpenseInput(input, group.members)

  const expense: Expense = {
    id: randomUUID(),
    groupId,
    description: input.description.trim(),
    amount: roundCurrency(input.amount),
    payer: input.payer,
    splits: { ...input.splits },
  }

  expenses.push(expense)
  return expense
}

export function removeExpense(groupId: string, expenseId: string): boolean {
  const index = expenses.findIndex(
    (expense) => expense.id === expenseId && expense.groupId === groupId,
  )
  if (index === -1) return false
  expenses.splice(index, 1)
  return true
}

export function removeExpensesForGroup(groupId: string): void {
  for (let i = expenses.length - 1; i >= 0; i--) {
    if (expenses[i].groupId === groupId) {
      expenses.splice(i, 1)
    }
  }
}

function validateExpenseInput(
  input: CreateExpenseInput,
  members: readonly Member[],
): void {
  if (!input.description?.trim()) {
    throw new ValidationError('Description is required')
  }

  if (typeof input.amount !== 'number' || Number.isNaN(input.amount) || input.amount <= 0) {
    throw new ValidationError('Amount must be a positive number')
  }

  if (!members.includes(input.payer)) {
    throw new ValidationError('Payer must be a member of this group')
  }

  if (!input.splits || !isValidSplitTotal(input.splits, members)) {
    throw new ValidationError('Split percentages must total exactly 100%')
  }

  for (const member of members) {
    const pct = input.splits[member] ?? 0
    if (typeof pct !== 'number' || pct < 0 || pct > 100) {
      throw new ValidationError(`Invalid split for ${member}`)
    }
  }

  const sharers = members.filter((member) => (input.splits[member] ?? 0) > 0.01)
  if (sharers.length < 2) {
    throw new ValidationError(
      'At least two people must share the expense. Check all participants and split evenly so others owe the payer.',
    )
  }
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
