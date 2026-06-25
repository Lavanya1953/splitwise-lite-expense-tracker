import type { Expense } from '../types'
import { formatCurrency } from '../utils/format'

interface ExpenseListProps {
  expenses: Expense[]
  onRemove: (id: string) => void
}

export function ExpenseList({ expenses, onRemove }: ExpenseListProps) {
  if (expenses.length === 0) return null

  return (
    <div className="expense-list">
      <h3>Ledger ({expenses.length})</h3>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id} className="expense-item">
            <div className="expense-info">
              <strong>{expense.description}</strong>
              <span className="expense-meta">
                {formatCurrency(expense.amount)} · paid by {expense.payer}
              </span>
              <span className="expense-splits">
                {Object.entries(expense.splits)
                  .filter(([, pct]) => pct > 0)
                  .map(([member, pct]) => `${member} ${pct}%`)
                  .join(' · ')}
              </span>
            </div>
            <button
              type="button"
              className="remove-btn"
              onClick={() => onRemove(expense.id)}
              aria-label={`Remove ${expense.description}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
