import type { RequestHandler } from '@sveltejs/kit'
import { privateKey } from '$lib/signing-keys'
import { importSPKI } from 'jose/key/import'
import { db } from '$lib/firebase-admin'
import type { KeyLike } from 'jose/types'
import SignJWT from 'jose/jwt/sign'
import CompactEncrypt from 'jose/jwe/compact/encrypt'

const encode = TextEncoder.prototype.encode.bind(new TextEncoder())

const sign = (data: any, privateKey: KeyLike) => new SignJWT(data)
  .setProtectedHeader({ alg: 'EdDSA' })
  .setIssuer('stiqrcode.com')
  .setAudience('stiqrcode.com')
  .setExpirationTime('1year')
  .sign(privateKey)

const encrypt = (payload: string, publicKey: KeyLike) =>
  new CompactEncrypt(encode(payload))
    .setProtectedHeader({
      alg: 'RSA-OAEP-256',
      enc: 'A256GCM'
    })
    .encrypt(publicKey)

// TODO: Validate form
// TODO: In an earlier stage, validate the code,
// replace it with the user id and then delete the code
export const post: RequestHandler = async request => {
	const { code, ...form } = request.body as any

  const codeDoc = await db.collection('codes').doc(code).get()

  const testId = codeDoc.get('test')
  const testRef = db.collection('tests').doc(testId)
  await codeDoc.ref.delete()
  const test: typeof codeDoc = await testRef.get()
  const testData = test.data()

  const publicKey = await importSPKI(testData.public_key, "RSA-OAEP-256")
  const jws = await sign(form, await privateKey())
  const jwe = await encrypt(jws, publicKey)

  await testRef.update({ results: jwe })

  return { body: { success: true } }
}
