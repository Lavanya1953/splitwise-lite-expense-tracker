import { randomUUID } from 'node:crypto'
import type { CreateGroupInput, Group } from '../types.js'
import { DEFAULT_GROUP_MEMBERS } from '../types.js'

const groups: Group[] = []

function seedDefaultGroup(): void {
  if (groups.length > 0) return
  groups.push({
    id: randomUUID(),
    name: 'Roommates',
    members: [...DEFAULT_GROUP_MEMBERS],
  })
}

seedDefaultGroup()

export function listGroups(): Group[] {
  return [...groups]
}

export function getGroup(id: string): Group | undefined {
  return groups.find((group) => group.id === id)
}

export function createGroup(input: CreateGroupInput): Group {
  const name = input.name?.trim()
  if (!name) {
    throw new GroupValidationError('Group name is required')
  }

  const members = normalizeMembers(input.members)
  if (members.length < 2) {
    throw new GroupValidationError('A group needs at least two members')
  }

  const group: Group = {
    id: randomUUID(),
    name,
    members,
  }

  groups.push(group)
  return group
}

export function deleteGroup(id: string): boolean {
  if (groups.length <= 1) {
    throw new GroupValidationError('Cannot delete the only remaining group')
  }

  const index = groups.findIndex((group) => group.id === id)
  if (index === -1) return false
  groups.splice(index, 1)
  return true
}

function normalizeMembers(members: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of members) {
    const name = raw.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(name)
  }

  return result
}

export class GroupValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GroupValidationError'
  }
}
