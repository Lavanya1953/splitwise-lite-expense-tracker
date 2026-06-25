import { Router } from 'express'
import {
  addExpense,
  listExpenses,
  removeExpense,
  ValidationError,
} from '../services/expenseService.js'
import { buildSettlementResponse, createEqualSplits } from '../services/settlement.js'
import { GROUP_MEMBERS } from '../types.js'
import type { CreateExpenseInput } from '../types.js'

export const apiRouter = Router()

apiRouter.get('/members', (_req, res) => {
  res.json({
    members: GROUP_MEMBERS,
    defaultSplits: createEqualSplits(),
  })
})

apiRouter.get('/expenses', (_req, res) => {
  res.json(listExpenses())
})

apiRouter.post('/expenses', (req, res) => {
  try {
    const expense = addExpense(req.body as CreateExpenseInput)
    res.status(201).json(expense)
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to create expense' })
  }
})

apiRouter.delete('/expenses/:id', (req, res) => {
  const removed = removeExpense(req.params.id)
  if (!removed) {
    res.status(404).json({ error: 'Expense not found' })
    return
  }
  res.status(204).send()
})

apiRouter.get('/settlements', (_req, res) => {
  res.json(buildSettlementResponse(listExpenses()))
})
