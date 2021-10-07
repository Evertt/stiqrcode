import admin from "firebase-admin"

const firebaseConfig = {
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://stiqrcode.firebaseio.com",
}

export const app = admin.initializeApp(firebaseConfig)

export const db = app.firestore()

export const { serverTimestamp } = admin.firestore.FieldValue

let _users: Record<string, User> = {}

db.collection('testers').onSnapshot(snapshot => {
  const newUsers: Record<string, User> = {}

  snapshot.forEach(doc => {
    newUsers[doc.id] = { ...doc.data(), uid: doc.id } as User
  })

  _users = newUsers
})

export const users = (): Record<string, User> => _users
