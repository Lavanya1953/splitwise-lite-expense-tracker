import { useMemo, useState } from 'react'
import type { Member, SplitPercentages } from '../types'
import { getSplitTotal, isValidSplitTotal } from '../utils/format'
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
  const amountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0
  const descriptionValid = description.trim().length > 0
  const canSubmit = descriptionValid && amountValid && splitsValid && !submitting

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
        <p>Record who paid and how the cost is shared.</p>
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
          <span>Paid By</span>
          <select value={payer} onChange={(e) => setPayer(e.target.value as Member)}>
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
        amount={amountValid ? parsedAmount : 0}
        onSplitsChange={setSplits}
        onParticipantsChange={setParticipants}
      />

      <div className="form-footer">
        <div className={`split-total ${splitsValid ? 'valid' : 'invalid'}`}>
          <span>Status</span>
          <strong>{splitsValid ? 'Ready to add' : `${splitTotal.toFixed(0)}% of 100%`}</strong>
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
            'Check who shared the expense, then adjust sliders until they total 100%.'}
        </p>
      )}
    </form>
  )
}
