import type { RequestHandler } from '@sveltejs/kit'
import { importSPKI } from 'jose/key/import'
import { db, serverTimestamp } from '$lib/fb'

function makeCode() {
  let text = ""
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

  for (let i = 0; i < 4; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))

  return text
}

type Unpromise<T extends Promise<any>> = T extends Promise<infer U> ? U : never

function getRandomCode() {
  const code = makeCode()
  const codeRef = db.collection('codes').doc(code)
  return codeRef.get()
}

export const post: RequestHandler<undefined, any> = async request => {
	const { public_key } = request.body

  try {
    await importSPKI(public_key, "RSA-OAEP-256")
  } catch (_) {
    return { status: public_key ? 422 : 400, body: {
      message: "You must submit a valid RSA-OAEP-256 public key."
    } }
  }

  const testRef = db.collection('tests').doc()
  await testRef.set({ public_key, updated_at: serverTimestamp() })

  let code: Unpromise<ReturnType<typeof getRandomCode>>

  while ((code = await getRandomCode()).exists);

  code.ref.set({ test: testRef, updated_at: serverTimestamp() })

  return { body: { id: testRef.id, code: code.id } }
}
