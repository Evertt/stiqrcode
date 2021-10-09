import { browser } from "$app/env"
import type { Readable } from "svelte/store"
import firebaseConfig from "./firebase-config"
import type { Auth, User } from "firebase/auth"
import type { FirebaseApp } from "firebase/app"
import type { Firestore } from "firebase/firestore"
import { service, readable, derived } from 'sveltex'

export const app: Readable<FirebaseApp> = service(() => readable(null, async set => {
  if (!browser) return
  const { initializeApp } = await import("firebase/app")
  set(initializeApp(firebaseConfig))
}))

export const auth: Readable<Auth> = service(() => derived(app, async ($app, set) => {
  if (!browser || !$app) return
  const { initializeAuth, indexedDBLocalPersistence } = await import("firebase/auth")
  set(initializeAuth($app, {persistence: indexedDBLocalPersistence}))
}))

export const db: Readable<Firestore> = service(() => derived(auth, async ($auth, set) => {
  if (!browser || !$auth) return
  const { getFirestore } = await import("firebase/firestore")
  set(getFirestore())
}))

// eslint-disable-next-line @typescript-eslint/no-empty-function
let innerUnsub = () => {}
export const user: Readable<User> = derived(auth, async ($auth, set) => {
  if (!browser || !$auth) return
  const { onAuthStateChanged } = await import("firebase/auth")
  innerUnsub()
  innerUnsub = onAuthStateChanged($auth, set)
})

export const getUser = async (session: Session): Promise<globalThis.User|null> => {
  const user = session.user

  if (!user && browser) try {
    const { getAuth } = await import("firebase/auth")
    const auth = getAuth()
    return auth.currentUser
  } catch (e) {
    return null
  }

  return user
}