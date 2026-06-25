import type { Member, SettlementResponse } from '../types'
import { formatCurrency } from '../utils/format'

interface SettlementBoardProps {
  settlements: SettlementResponse | null
  expenseCount: number
  groupName?: string
}

function describeBalance(member: Member, net: number): string {
  if (Math.abs(net) <= 0.01) {
    return `${member} is even — paid exactly their share.`
  }
  if (net > 0) {
    return `${member} is owed ${formatCurrency(net)} (paid more than their share).`
  }
  return `${member} owes ${formatCurrency(Math.abs(net))} overall (paid less than their share).`
}

export function SettlementBoard({ settlements, expenseCount, groupName }: SettlementBoardProps) {
  const hasData = expenseCount > 0 && settlements

  const evenMembers = hasData
    ? settlements.netBalances
        .filter(({ net }) => Math.abs(net) <= 0.01)
        .map(({ member }) => member)
    : []

  const debtSettlements = hasData ? settlements.settlements : []

  return (
    <div className="settlement-board">
      <div className="panel-heading">
        <h2>Net Balances{groupName ? ` — ${groupName}` : ''}</h2>
        <p>
          After all expenses, this shows the simplest way for everyone to settle up.
        </p>
      </div>

      {!hasData ? (
        <div className="empty-state">
          <p>No expenses yet.</p>
          <p>Add a bill on the left to see who owes whom.</p>
        </div>
      ) : (
        <>
          {debtSettlements.length > 0 ? (
            <section className="settlement-section">
              <h3 className="settlement-section-title">Payments to make</h3>
              <p className="settlement-section-desc">
                Each line is one payment that clears part of the group debt.
              </p>
              <ul className="settlement-payments">
                {debtSettlements.map(({ from, to, amount }) => (
                  <li key={`${from}-${to}-${amount}`} className="settlement-payment">
                    <span className="payment-from">{from}</span>
                    <span className="payment-arrow" aria-hidden="true">
                      pays
                    </span>
                    <span className="payment-to">{to}</span>
                    <span className="payment-amount">{formatCurrency(amount)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <div className="settlement-all-clear">
              <p>Everyone is even — no payments needed.</p>
            </div>
          )}

          {evenMembers.length > 0 && debtSettlements.length > 0 && (
            <section className="settlement-section">
              <h3 className="settlement-section-title">Already even</h3>
              <ul className="settlement-even-list">
                {evenMembers.map((member) => (
                  <li key={member}>{member} owes nobody (Even)</li>
                ))}
              </ul>
            </section>
          )}

          <section className="settlement-section">
            <h3 className="settlement-section-title">Everyone&apos;s standing</h3>
            <p className="settlement-section-desc">
              How each person&apos;s payments compare to what they actually spent.
            </p>
            <ul className="balance-standing">
              {settlements.netBalances.map(({ member, net }) => (
                <li
                  key={member}
                  className={
                    net > 0.01 ? 'standing-owed' : net < -0.01 ? 'standing-owes' : 'standing-even'
                  }
                >
                  {describeBalance(member, net)}
                </li>
              ))}
            </ul>
          </section>

          {debtSettlements.length > 0 && (
            <p className="settlement-count">
              {debtSettlements.length} payment{debtSettlements.length !== 1 ? 's' : ''} settles
              everything — no need for everyone to pay everyone.
            </p>
          )}
        </>
      )}
    </div>
  )
}
