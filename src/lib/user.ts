import "$lib/firebase"
import { auth } from "./firebase"
import { browser } from "$app/env"
import { readable } from "svelte/store"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"

export default readable<User>(null, set => {
  if (!browser) return
  let innerUnsub = () => {}
  return auth.subscribe($auth => {
    innerUnsub()
    if (!$auth) return
    innerUnsub = onAuthStateChanged($auth, set)
  }, () => innerUnsub())
})
