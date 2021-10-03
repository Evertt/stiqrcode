import admin from "firebase-admin"

const firebaseConfig = {
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://stiqrcode.firebaseio.com",
}

export const app = admin.initializeApp(firebaseConfig)

export const db = app.firestore()

export const { serverTimestamp } = admin.firestore.FieldValue
