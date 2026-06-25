import { useMemo } from 'react'
import type { Member, SplitPercentages } from '../types'
import { formatCurrency, previewShare } from '../utils/format'

interface SplitSlidersProps {
  members: readonly Member[]
  splits: SplitPercentages
  participants: Set<Member>
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

  function toggleParticipant(member: Member) {
    const next = new Set(participants)
    if (next.has(member)) {
      if (next.size <= 1) return
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
        First choose who shared this expense, then set how much each person pays.
      </p>

      <div className="split-step">
        <h3 className="split-step-title">
          <span className="step-badge">1</span>
          Who shared this expense?
        </h3>
        <div className="participant-checkboxes">
          {members.map((member) => (
            <label key={member} className="participant-checkbox">
              <input
                type="checkbox"
                checked={participants.has(member)}
                onChange={() => toggleParticipant(member)}
              />
              <span>{member}</span>
            </label>
          ))}
        </div>
        <p className="split-step-hint">
          Only checked people are included in the split.
        </p>
      </div>

      <div className="split-step">
        <div className="split-step-header">
          <h3 className="split-step-title">
            <span className="step-badge">2</span>
            How much does each person pay?
          </h3>
          <button
            type="button"
            className="split-evenly-btn"
            onClick={handleSplitEvenly}
            disabled={participants.size === 0}
          >
            Split evenly
          </button>
        </div>
        <p className="split-step-hint">
          Drag sliders so everyone&apos;s share adds up to <strong>100%</strong>.
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
                  {!included && <em className="not-included">not in split</em>}
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
            ? 'Ready — splits total 100%.'
            : remaining > 0
              ? `${remaining.toFixed(0)}% still unassigned — increase someone's slider.`
              : `${Math.abs(remaining).toFixed(0)}% over 100% — lower someone's slider.`}
        </p>
      </div>
    </fieldset>
  )
}
