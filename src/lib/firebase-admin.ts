import admin from "firebase-admin"

export const app = admin.initializeApp()

export const db = app.firestore()

export const { serverTimestamp } = admin.firestore.FieldValue
