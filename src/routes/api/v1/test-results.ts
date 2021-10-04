import type { RequestHandler } from '@sveltejs/kit'
import { db, serverTimestamp } from '$lib/firebase-admin'
import type { KeyLike } from 'jose/types'
import { importSPKI } from 'jose/key/import'
import CompactEncrypt from 'jose/jwe/compact/encrypt'

const encode = TextEncoder.prototype.encode.bind(new TextEncoder())

const encrypt = (payload: string, publicKey: KeyLike) =>
  new CompactEncrypt(encode(payload))
    .setProtectedHeader({
      alg: 'RSA-OAEP-256',
      enc: 'A256GCM'
    })
    .encrypt(publicKey)

type Body = { id: string, answer: string }
export const post: RequestHandler<undefined, Body> = async request => {
  const { id, answer } = request.body
  const test = await db.collection('tests').doc(id).get()
  const testData = test.data()

  if (!answer) {
    const answer = (Math.random() + 1).toString(36).substring(2)
    await test.ref.update({ answer, updated_at: serverTimestamp() })
    const publicKey = await importSPKI(testData.public_key, "RSA-OAEP-256")
    const question = await encrypt(answer, publicKey)
    return { body: question }
  }

  if (answer !== testData.answer) return {
    status: 422, body: "Wrong answer."
  }

  await test.ref.delete()

  return { body: testData.results }
}
