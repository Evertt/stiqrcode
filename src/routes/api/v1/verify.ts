import type { RequestHandler } from '@sveltejs/kit'
import { publicKey } from "$lib/signing-keys"
import jwtVerify from 'jose/jwt/verify'

export const post: RequestHandler<undefined, string> = async request => {
  const jws = request.body

  try {
    const verified = await jwtVerify(jws, await publicKey(), {
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