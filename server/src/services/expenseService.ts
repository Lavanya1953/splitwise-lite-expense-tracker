import { randomUUID } from 'node:crypto'
import type { CreateExpenseInput, Expense, Member } from '../types.js'
import { GROUP_MEMBERS } from '../types.js'
import { isValidSplitTotal } from './settlement.js'

const expenses: Expense[] = []

export function listExpenses(): Expense[] {
  return [...expenses]
}

export function addExpense(input: CreateExpenseInput): Expense {
  validateExpenseInput(input)

  const expense: Expense = {
    id: randomUUID(),
    description: input.description.trim(),
    amount: roundCurrency(input.amount),
    payer: input.payer,
    splits: { ...input.splits },
  }

  expenses.push(expense)
  return expense
}

export function removeExpense(id: string): boolean {
  const index = expenses.findIndex((expense) => expense.id === id)
  if (index === -1) return false
  expenses.splice(index, 1)
  return true
}

function validateExpenseInput(input: CreateExpenseInput): void {
  if (!input.description?.trim()) {
    throw new ValidationError('Description is required')
  }

  if (typeof input.amount !== 'number' || Number.isNaN(input.amount) || input.amount <= 0) {
    throw new ValidationError('Amount must be a positive number')
  }

  if (!GROUP_MEMBERS.includes(input.payer)) {
    throw new ValidationError('Invalid payer')
  }

  if (!input.splits || !isValidSplitTotal(input.splits)) {
    throw new ValidationError('Split percentages must total exactly 100%')
  }

  for (const member of GROUP_MEMBERS) {
    const pct = input.splits[member]
    if (typeof pct !== 'number' || pct < 0 || pct > 100) {
      throw new ValidationError(`Invalid split for ${member}`)
    }
  }

  const sharers = GROUP_MEMBERS.filter((member) => input.splits[member] > 0.01)
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

export function isMember(value: string): value is Member {
  return (GROUP_MEMBERS as readonly string[]).includes(value)
}
