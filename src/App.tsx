import { useCallback, useEffect, useState } from 'react'
import type { Expense, Group, GroupDetail, SettlementResponse, SplitPercentages } from './types'
import {
  createExpense,
  createGroup,
  deleteExpense,
  deleteGroup,
  fetchExpenses,
  fetchGroup,
  fetchGroups,
  fetchSettlements,
} from './api/client'
import { BillForm } from './components/BillForm'
import { GroupSelector } from './components/GroupSelector'
import { SettlementBoard } from './components/SettlementBoard'
import { ExpenseList } from './components/ExpenseList'
import './App.css'

function App() {
  const [groups, setGroups] = useState<Group[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [settlements, setSettlements] = useState<SettlementResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshGroupData = useCallback(async (groupId: string) => {
    const [detail, ledger, settlementData] = await Promise.all([
      fetchGroup(groupId),
      fetchExpenses(groupId),
      fetchSettlements(groupId),
    ])
    setGroupDetail(detail)
    setExpenses(ledger)
    setSettlements(settlementData)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const groupList = await fetchGroups()
        setGroups(groupList)
        if (groupList.length > 0) {
          const firstId = groupList[0].id
          setActiveGroupId(firstId)
          await refreshGroupData(firstId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [refreshGroupData])

  async function handleSelectGroup(groupId: string) {
    setError(null)
    setActiveGroupId(groupId)
    try {
      await refreshGroupData(groupId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group')
    }
  }

  async function handleCreateGroup(name: string, members: string[]) {
    setError(null)
    const group = await createGroup({ name, members })
    const nextGroups = await fetchGroups()
    setGroups(nextGroups)
    setActiveGroupId(group.id)
    await refreshGroupData(group.id)
  }

  async function handleDeleteGroup(groupId: string) {
    setError(null)
    await deleteGroup(groupId)
    const nextGroups = await fetchGroups()
    setGroups(nextGroups)
    const nextId = nextGroups[0]?.id ?? null
    setActiveGroupId(nextId)
    if (nextId) {
      await refreshGroupData(nextId)
    } else {
      setGroupDetail(null)
      setExpenses([])
      setSettlements(null)
    }
  }

  async function handleAddExpense(
    description: string,
    amount: number,
    payer: string,
    splits: SplitPercentages,
  ) {
    if (!activeGroupId) return
    setError(null)
    try {
      await createExpense(activeGroupId, { description, amount, payer, splits })
      await refreshGroupData(activeGroupId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add expense')
    }
  }

  async function handleRemoveExpense(id: string) {
    if (!activeGroupId) return
    setError(null)
    try {
      await deleteExpense(activeGroupId, id)
      await refreshGroupData(activeGroupId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove expense')
    }
  }

  if (loading) {
    return (
      <div className="app app-loading">
        <p>Loading ledger…</p>
      </div>
    )
  }

  if (!activeGroupId || !groupDetail) {
    return (
      <div className="app app-loading">
        <p>{error ?? 'Unable to connect to server. Start the API with npm run dev:server.'}</p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            $
          </span>
          <div>
            <h1>Splitwise-Lite</h1>
            <p>Track shared expenses across multiple groups</p>
          </div>
        </div>
      </header>

      <GroupSelector
        groups={groups}
        activeGroupId={activeGroupId}
        onSelect={handleSelectGroup}
        onCreate={handleCreateGroup}
        onDelete={handleDeleteGroup}
      />

      {error && (
        <p className="app-error" role="alert">
          {error}
        </p>
      )}

      <main className="app-main">
        <section className="panel panel-form">
          <BillForm
            key={activeGroupId}
            members={groupDetail.members}
            defaultSplits={groupDetail.defaultSplits}
            onSubmit={handleAddExpense}
          />
          <ExpenseList expenses={expenses} onRemove={handleRemoveExpense} />
        </section>

        <section className="panel panel-settlement">
          <SettlementBoard
            settlements={settlements}
            expenseCount={expenses.length}
            groupName={groupDetail.name}
          />
        </section>
      </main>
    </div>
  )
}

export default App
