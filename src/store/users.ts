import { db } from "$lib/firebase-admin"

let _users: Record<string, User> = {}

db.collection('testers').onSnapshot(snapshot => {
  const newUsers: Record<string, User> = {}

  snapshot.forEach(doc => {
    newUsers[doc.id] = { ...doc.data(), uid: doc.id } as User
  })

  _users = newUsers
})

export function users(id: string): User
export function users(): Record<string, User>
export function users(id?: string): User | Record<string, User> {
  return id ? _users[id] : _users
}
