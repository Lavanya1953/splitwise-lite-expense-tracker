import { useCallback, useEffect, useState } from 'react'

import type { Expense, Member, MembersResponse, SettlementResponse, SplitPercentages } from './types'

import {

  createExpense,

  deleteExpense,

  fetchExpenses,

  fetchMembers,

  fetchSettlements,

} from './api/client'

import { BillForm } from './components/BillForm'

import { SettlementBoard } from './components/SettlementBoard'

import { ExpenseList } from './components/ExpenseList'

import './App.css'



function App() {

  const [membersData, setMembersData] = useState<MembersResponse | null>(null)

  const [expenses, setExpenses] = useState<Expense[]>([])

  const [settlements, setSettlements] = useState<SettlementResponse | null>(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)



  const refreshLedger = useCallback(async () => {

    const [nextExpenses, nextSettlements] = await Promise.all([

      fetchExpenses(),

      fetchSettlements(),

    ])

    setExpenses(nextExpenses)

    setSettlements(nextSettlements)

  }, [])



  useEffect(() => {

    async function load() {

      try {

        const [members, ledger, settlementData] = await Promise.all([

          fetchMembers(),

          fetchExpenses(),

          fetchSettlements(),

        ])

        setMembersData(members)

        setExpenses(ledger)

        setSettlements(settlementData)

      } catch (err) {

        setError(err instanceof Error ? err.message : 'Failed to load data')

      } finally {

        setLoading(false)

      }

    }



    load()

  }, [])



  async function handleAddExpense(

    description: string,

    amount: number,

    payer: Member,

    splits: SplitPercentages,

  ) {

    setError(null)

    try {

      await createExpense({ description, amount, payer, splits })

      await refreshLedger()

    } catch (err) {

      setError(err instanceof Error ? err.message : 'Failed to add expense')

    }

  }



  async function handleRemoveExpense(id: string) {

    setError(null)

    try {

      await deleteExpense(id)

      await refreshLedger()

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



  if (!membersData) {

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

            <p>Track shared expenses and settle up instantly</p>

          </div>

        </div>

        <div className="group-pill">

          Group: {membersData.members.join(', ')}

        </div>

      </header>



      {error && (

        <p className="app-error" role="alert">

          {error}

        </p>

      )}



      <main className="app-main">

        <section className="panel panel-form">

          <BillForm

            members={membersData.members}

            defaultSplits={membersData.defaultSplits}

            onSubmit={handleAddExpense}

          />

          <ExpenseList expenses={expenses} onRemove={handleRemoveExpense} />

        </section>



        <section className="panel panel-settlement">

          <SettlementBoard settlements={settlements} expenseCount={expenses.length} />

        </section>

      </main>

    </div>

  )

}



export default App

