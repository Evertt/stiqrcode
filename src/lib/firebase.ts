import { browser } from "$app/env"
import { initializeApp } from "firebase/app"
import type { Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCf4cpU8FJDMN9RwmJF0UydLe58n7H7bBk",
  authDomain: "stiqrcode.firebaseapp.com",
  projectId: "stiqrcode",
  storageBucket: "stiqrcode.appspot.com",
  messagingSenderId: "507111860888",
  appId: "1:507111860888:web:38adc79971cbc7064d3eed"
}

export const app = browser ? initializeApp(firebaseConfig) : null

let fs: Firestore

if (browser) import("firebase/firestore")
  .then(({ getFirestore}) => fs = getFirestore())

export const db = () => fs
