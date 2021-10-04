import "$lib/firebase"
import { browser } from "$app/env"
import { readable } from "svelte/store"
import type { User } from "firebase/auth"
import { getAuth, onAuthStateChanged } from "firebase/auth"

export default readable<User>(null, set => 
  browser && onAuthStateChanged(getAuth(), set)
)
