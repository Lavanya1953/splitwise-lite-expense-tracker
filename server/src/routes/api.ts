import { Router } from 'express'
import {
  addExpense,
  listExpenses,
  removeExpense,
  removeExpensesForGroup,
  ValidationError,
} from '../services/expenseService.js'
import {
  createGroup,
  deleteGroup,
  getGroup,
  GroupValidationError,
  listGroups,
} from '../services/groupService.js'
import { buildSettlementResponse, createEqualSplits } from '../services/settlement.js'
import type { CreateExpenseInput, CreateGroupInput } from '../types.js'

export const apiRouter = Router()

apiRouter.get('/groups', (_req, res) => {
  res.json(listGroups())
})

apiRouter.post('/groups', (req, res) => {
  try {
    const group = createGroup(req.body as CreateGroupInput)
    res.status(201).json(group)
  } catch (error) {
    if (error instanceof GroupValidationError) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to create group' })
  }
})

apiRouter.delete('/groups/:groupId', (req, res) => {
  try {
    const removed = deleteGroup(req.params.groupId)
    if (!removed) {
      res.status(404).json({ error: 'Group not found' })
      return
    }
    removeExpensesForGroup(req.params.groupId)
    res.status(204).send()
  } catch (error) {
    if (error instanceof GroupValidationError) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to delete group' })
  }
})

apiRouter.get('/groups/:groupId', (req, res) => {
  const group = getGroup(req.params.groupId)
  if (!group) {
    res.status(404).json({ error: 'Group not found' })
    return
  }
  res.json({
    ...group,
    defaultSplits: createEqualSplits(group.members),
  })
})

apiRouter.get('/groups/:groupId/expenses', (req, res) => {
  const group = getGroup(req.params.groupId)
  if (!group) {
    res.status(404).json({ error: 'Group not found' })
    return
  }
  res.json(listExpenses(req.params.groupId))
})

apiRouter.post('/groups/:groupId/expenses', (req, res) => {
  try {
    const expense = addExpense(req.params.groupId, req.body as CreateExpenseInput)
    res.status(201).json(expense)
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
      return
    }
    res.status(500).json({ error: 'Failed to create expense' })
  }
})

apiRouter.delete('/groups/:groupId/expenses/:expenseId', (req, res) => {
  const removed = removeExpense(req.params.groupId, req.params.expenseId)
  if (!removed) {
    res.status(404).json({ error: 'Expense not found' })
    return
  }
  res.status(204).send()
})

apiRouter.get('/groups/:groupId/settlements', (req, res) => {
  const group = getGroup(req.params.groupId)
  if (!group) {
    res.status(404).json({ error: 'Group not found' })
    return
  }
  const groupExpenses = listExpenses(req.params.groupId)
  res.json(buildSettlementResponse(groupExpenses, group.members))
})
