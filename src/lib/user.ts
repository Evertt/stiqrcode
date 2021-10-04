import "$lib/firebase"
import { browser } from "$app/env"
import { readable } from "svelte/store"
import type { User } from "firebase/auth"
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth"

export default readable<User>(null, set => {
  if (!browser) return () => {}

  return onAuthStateChanged(getAuth(), user => set(user))
})

if (browser) {
  const auth = getAuth()
  signInAnonymously(auth)
}
