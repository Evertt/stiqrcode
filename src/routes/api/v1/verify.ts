import type { RequestHandler } from '@sveltejs/kit'
import { getPublicKey } from "$lib/signing-keys"
import jwtVerify from 'jose/jwt/verify'

export const post: RequestHandler<Locals, string> = async request => {
  const jws = request.body
  const publicKey = await getPublicKey()

  try {
    const verified = await jwtVerify(jws, publicKey, {
      issuer: "stiqrcode.com",
      audience: "stiqrcode.app"
    })

    return { body: verified.payload as any }
  } catch (e) {
    return {
      status: 400,
      body: { message: e.message }
    }
  }
}