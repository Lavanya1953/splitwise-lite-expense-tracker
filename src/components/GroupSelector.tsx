import { useState } from 'react'
import type { Group } from '../types'

interface GroupSelectorProps {
  groups: Group[]
  activeGroupId: string
  onSelect: (groupId: string) => void
  onCreate: (name: string, members: string[]) => Promise<void>
  onDelete: (groupId: string) => Promise<void>
}

export function GroupSelector({
  groups,
  activeGroupId,
  onSelect,
  onCreate,
  onDelete,
}: GroupSelectorProps) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [membersInput, setMembersInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const activeGroup = groups.find((group) => group.id === activeGroupId)

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)

    const members = membersInput
      .split(',')
      .map((member) => member.trim())
      .filter(Boolean)

    if (!name.trim()) {
      setFormError('Enter a group name.')
      return
    }
    if (members.length < 2) {
      setFormError('Add at least two members, separated by commas.')
      return
    }

    setSubmitting(true)
    try {
      await onCreate(name.trim(), members)
      setName('')
      setMembersInput('')
      setShowForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create group')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!activeGroup || groups.length <= 1) return
    const confirmed = window.confirm(
      `Delete "${activeGroup.name}" and all its expenses? This cannot be undone.`,
    )
    if (!confirmed) return
    await onDelete(activeGroup.id)
  }

  return (
    <div className="group-selector">
      <div className="group-selector-row">
        <label className="group-select-field">
          <span>Active group</span>
          <select
            value={activeGroupId}
            onChange={(e) => onSelect(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} ({group.members.length} members)
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="group-action-btn"
          onClick={() => setShowForm((open) => !open)}
        >
          {showForm ? 'Cancel' : '+ New group'}
        </button>

        {groups.length > 1 && (
          <button
            type="button"
            className="group-action-btn group-delete-btn"
            onClick={handleDelete}
          >
            Delete group
          </button>
        )}
      </div>

      {activeGroup && (
        <p className="group-members-summary">
          Members: {activeGroup.members.join(', ')}
        </p>
      )}

      {showForm && (
        <form className="group-create-form" onSubmit={handleCreate}>
          <h3>Create a new group</h3>
          <label className="field">
            <span>Group name</span>
            <input
              type="text"
              placeholder="e.g. Goa Trip, Office Lunch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Members (comma-separated)</span>
            <input
              type="text"
              placeholder="e.g. Amit, Rahul, Priya, Vikram"
              value={membersInput}
              onChange={(e) => setMembersInput(e.target.value)}
            />
          </label>
          {formError && (
            <p className="form-hint" role="alert">
              {formError}
            </p>
          )}
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create group'}
          </button>
        </form>
      )}
    </div>
  )
}
