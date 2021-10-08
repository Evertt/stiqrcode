import { db } from "$lib/firebase-admin"

type Subscriber<T> = {
  (): Record<string, T>
  (id: string): T
}

type HasId = { id: string }

export default function subscribe<T extends HasId>(collection: string): Subscriber<T> {
  let data: Record<string, T> = {}

  db.collection(collection).onSnapshot(snapshot => {
    const newData: typeof data = {}

    snapshot.forEach(doc => {
      newData[doc.id] = { id: doc.id, ...doc.data() } as unknown as T
    })

    data = newData
  })

  function get(): typeof data
  function get(id: string): T
  function get(id?: string): T | typeof data {
    type R = typeof id extends string ? T : typeof data

    return (id ? data[id] : data) as R
  }

  return get
}