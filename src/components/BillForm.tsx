import { useMemo, useState } from 'react'
import type { Member, SplitPercentages } from '../types'
import {
  formatCurrency,
  getSplitTotal,
  hasGroupSplit,
  isValidSplitTotal,
  previewShare,
} from '../utils/format'
import { SplitSliders } from './SplitSliders'

interface BillFormProps {
  members: readonly Member[]
  defaultSplits: SplitPercentages
  onSubmit: (
    description: string,
    amount: number,
    payer: Member,
    splits: SplitPercentages,
  ) => void | Promise<void>
}

function initialParticipants(members: readonly Member[]): Set<Member> {
  return new Set(members)
}

function distributeEqually(
  members: readonly Member[],
  participants: Set<Member>,
): SplitPercentages {
  const active = members.filter((member) => participants.has(member))
  const share = Math.floor(100 / active.length)
  const remainder = 100 - share * active.length

  return Object.fromEntries(
    members.map((member) => {
      const index = active.indexOf(member)
      if (index === -1) return [member, 0]
      return [member, share + (index < remainder ? 1 : 0)]
    }),
  ) as SplitPercentages
}

export function BillForm({ members, defaultSplits, onSubmit }: BillFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [payer, setPayer] = useState<Member>(members[0])
  const [splits, setSplits] = useState<SplitPercentages>({ ...defaultSplits })
  const [participants, setParticipants] = useState<Set<Member>>(() =>
    initialParticipants(members),
  )
  const [submitting, setSubmitting] = useState(false)

  const parsedAmount = parseFloat(amount)
  const splitTotal = useMemo(() => getSplitTotal(splits, members), [splits, members])
  const splitsValid = isValidSplitTotal(splits, members)
  const groupSplit = hasGroupSplit(splits, members)
  const amountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0
  const descriptionValid = description.trim().length > 0
  const canSubmit =
    descriptionValid && amountValid && splitsValid && groupSplit && !submitting

  const reimbursementPreview = useMemo(() => {
    if (!amountValid || !splitsValid || !groupSplit) return null

    const lines = members
      .filter((member) => member !== payer && splits[member] > 0)
      .map((member) => ({
        member,
        amount: previewShare(parsedAmount, splits[member]),
      }))

    if (lines.length === 0) return null

    return lines
  }, [amountValid, splitsValid, groupSplit, members, payer, parsedAmount, splits])

  function handlePayerChange(newPayer: Member) {
    setPayer(newPayer)
    setParticipants((prev) => {
      const next = new Set(prev)
      next.add(newPayer)
      return next
    })
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    try {
      await onSubmit(description.trim(), parsedAmount, payer, { ...splits })
      setDescription('')
      setAmount('')
      setPayer(members[0])
      setSplits({ ...defaultSplits })
      setParticipants(initialParticipants(members))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="bill-form" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <h2>Add Expense</h2>
        <p>Record who paid upfront and how the cost is shared among the group.</p>
      </div>

      <label className="field">
        <span>Description</span>
        <input
          type="text"
          placeholder="e.g. Dinner at Olive Garden"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Total Amount</span>
          <div className="amount-input">
            <span className="currency-prefix">$</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </label>

        <label className="field">
          <span>Paid By (who covered the bill)</span>
          <select value={payer} onChange={(e) => handlePayerChange(e.target.value as Member)}>
            {members.map((member) => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
        </label>
      </div>

      <SplitSliders
        members={members}
        splits={splits}
        participants={participants}
        payer={payer}
        amount={amountValid ? parsedAmount : 0}
        onSplitsChange={setSplits}
        onParticipantsChange={(next) => {
          setParticipants(next)
          setSplits(distributeEqually(members, next))
        }}
      />

      {reimbursementPreview && (
        <div className="split-preview" role="status">
          <strong>After adding this expense:</strong>
          <ul>
            {reimbursementPreview.map(({ member, amount: owed }) => (
              <li key={member}>
                {member} owes {payer} {formatCurrency(owed)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="form-footer">
        <div className={`split-total ${canSubmit ? 'valid' : 'invalid'}`}>
          <span>Status</span>
          <strong>
            {canSubmit
              ? 'Ready to add'
              : !splitsValid
                ? `${splitTotal.toFixed(0)}% of 100%`
                : !groupSplit
                  ? 'Need 2+ people splitting'
                  : 'Incomplete'}
          </strong>
        </div>

        <button type="submit" className="submit-btn" disabled={!canSubmit}>
          {submitting ? 'Adding…' : 'Add to Ledger'}
        </button>
      </div>

      {!canSubmit && !submitting && (
        <p className="form-hint" role="status">
          {!descriptionValid && 'Enter a description. '}
          {!amountValid && 'Enter a valid amount. '}
          {!splitsValid &&
            'Tap Split evenly or adjust sliders until they total 100%. '}
          {splitsValid && !groupSplit &&
            'At least two people must share the bill — check all participants and tap Split evenly.'}
        </p>
      )}
    </form>
  )
}
