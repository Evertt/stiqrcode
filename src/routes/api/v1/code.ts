import type { RequestHandler } from '@sveltejs/kit'
import { db } from '$lib/firebase-admin'

let codes: Record<string, any> = {}

db.collection('codes').onSnapshot(snapshot => {
  const newCodes = {}
  snapshot.forEach(doc => newCodes[doc.id] = doc.data())
  codes = newCodes
})

function makeRandomCode() {
  let text = ""
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

  for (let i = 0; i < 4; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))

  return text
}

function getNewCode() {
  let code = makeRandomCode()

  while (codes[code])
    code = makeRandomCode()

  return code
}

export const get: RequestHandler =
  () => ({ body: getNewCode() })
