import { browser } from "$app/env"
import type { Auth } from "firebase/auth"
import type { Readable } from "svelte/store"
import type { FirebaseApp } from "firebase/app"
import type { Firestore } from "firebase/firestore"
import { service, readable, derived } from 'sveltex'

export const app: Readable<FirebaseApp> = service(() => readable(null, async set => {
  if (!browser) return
  const { initializeApp } = await import("firebase/app")
  set(initializeApp({
    apiKey: "AIzaSyCf4cpU8FJDMN9RwmJF0UydLe58n7H7bBk",
    authDomain: "stiqrcode.firebaseapp.com",
    projectId: "stiqrcode",
    storageBucket: "stiqrcode.appspot.com",
    messagingSenderId: "507111860888",
    appId: "1:507111860888:web:38adc79971cbc7064d3eed"
  }))
}))

export const db: Readable<Firestore> = service(() => derived(app, async ($app, set) => {
  if (!browser || !$app) return
  const { getFirestore } = await import("firebase/firestore")
  set(getFirestore())
}))

export const auth: Readable<Auth> = service(() => derived(app, async ($app, set) => {
  if (!browser || !$app) return
  const { getAuth } = await import("firebase/auth")
  set(getAuth())
}))
