import { useMemo } from 'react'
import type { Member, SplitPercentages } from '../types'
import { formatCurrency, previewShare } from '../utils/format'

interface SplitSlidersProps {
  members: readonly Member[]
  splits: SplitPercentages
  participants: Set<Member>
  payer: Member
  amount: number
  onSplitsChange: (splits: SplitPercentages) => void
  onParticipantsChange: (participants: Set<Member>) => void
}

function distributeEqually(
  members: readonly Member[],
  participants: Set<Member>,
): SplitPercentages {
  const active = members.filter((member) => participants.has(member))
  if (active.length === 0) {
    return Object.fromEntries(members.map((member) => [member, 0])) as SplitPercentages
  }

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

export function SplitSliders({
  members,
  splits,
  participants,
  payer,
  amount,
  onSplitsChange,
  onParticipantsChange,
}: SplitSlidersProps) {
  const splitTotal = useMemo(
    () => members.reduce((sum, member) => sum + splits[member], 0),
    [members, splits],
  )
  const remaining = 100 - splitTotal
  const isValid = Math.abs(remaining) < 0.01
  const checkedCount = participants.size

  function toggleParticipant(member: Member) {
    if (member === payer) return

    const next = new Set(participants)
    if (next.has(member)) {
      if (next.size <= 2) return
      next.delete(member)
    } else {
      next.add(member)
    }
    onParticipantsChange(next)
    onSplitsChange(distributeEqually(members, next))
  }

  function handleSliderChange(member: Member, value: number) {
    onSplitsChange({ ...splits, [member]: value })
  }

  function handleSplitEvenly() {
    onSplitsChange(distributeEqually(members, participants))
  }

  return (
    <fieldset className="split-sliders">
      <legend>Split Selector</legend>
      <p className="split-help">
        <strong>Paid By</strong> is who covered the bill upfront.
        Check everyone who should <em>pay back their share</em> below.
      </p>

      <div className="split-step">
        <h3 className="split-step-title">
          <span className="step-badge">1</span>
          Who should split this bill?
        </h3>
        <div className="participant-checkboxes">
          {members.map((member) => {
            const isPayer = member === payer
            const locked = isPayer

            return (
              <label
                key={member}
                className={`participant-checkbox ${locked ? 'participant-locked' : ''}`}
                title={locked ? `${payer} paid — always included in the split` : undefined}
              >
                <input
                  type="checkbox"
                  checked={participants.has(member)}
                  disabled={locked}
                  onChange={() => toggleParticipant(member)}
                />
                <span>
                  {member}
                  {isPayer && <em className="payer-tag">paid</em>}
                </span>
              </label>
            )
          })}
        </div>
        <p className="split-step-hint">
          Keep everyone checked if you all shared the expense. Uncheck only people who
          did not participate.
        </p>
      </div>

      <div className="split-step">
        <div className="split-step-header">
          <h3 className="split-step-title">
            <span className="step-badge">2</span>
            Each person&apos;s share (%)
          </h3>
          <button
            type="button"
            className="split-evenly-btn"
            onClick={handleSplitEvenly}
            disabled={checkedCount < 2}
          >
            Split evenly
          </button>
        </div>
        <p className="split-step-hint">
          Use <strong>Split evenly</strong> after selecting participants — then {payer} will
          be owed by everyone else.
        </p>

        {members.map((member) => {
          const included = participants.has(member)
          const percentage = splits[member]
          const share = previewShare(amount, percentage)

          return (
            <div
              key={member}
              className={`slider-row ${included ? '' : 'slider-row-disabled'}`}
            >
              <div className="slider-header">
                <span className="member-name">
                  {member}
                  {!included && <em className="not-included">not splitting</em>}
                </span>
                <span className="slider-values">
                  <strong>{percentage}%</strong>
                  {amount > 0 && included && (
                    <span className="share-amount">{formatCurrency(share)}</span>
                  )}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={percentage}
                disabled={!included}
                onChange={(e) => handleSliderChange(member, Number(e.target.value))}
                aria-label={`${member} split percentage`}
              />
            </div>
          )
        })}
      </div>

      <div className={`split-progress ${isValid ? 'valid' : 'invalid'}`}>
        <div className="split-progress-labels">
          <span>Total assigned</span>
          <strong>{splitTotal.toFixed(0)}% / 100%</strong>
        </div>
        <div className="split-progress-bar" aria-hidden="true">
          <div
            className="split-progress-fill"
            style={{ width: `${Math.min(splitTotal, 100)}%` }}
          />
        </div>
        <p className="split-progress-hint">
          {isValid
            ? checkedCount < 2
              ? 'Only one person is splitting — no one else will owe the payer.'
              : 'Ready — splits total 100%.'
            : remaining > 0
              ? `${remaining.toFixed(0)}% still unassigned — tap Split evenly or adjust sliders.`
              : `${Math.abs(remaining).toFixed(0)}% over 100% — lower someone's slider.`}
        </p>
      </div>
    </fieldset>
  )
}
