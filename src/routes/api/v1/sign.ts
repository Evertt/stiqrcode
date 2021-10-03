import type { RequestHandler } from '@sveltejs/kit'
import { privateKey, publicKey } from "$lib/signing-keys"
import jwtVerify from 'jose/jwt/verify'
import SignJWT from 'jose/jwt/sign'

export const post: RequestHandler<undefined, string> = async request => {
  const jws = request.body

  try {
    const verified = await jwtVerify(jws, await publicKey(), {
      issuer: "stiqrcode.com",
      audience: "stiqrcode.com"
    })

    const newJws = await new SignJWT(verified.payload)
      .setProtectedHeader({ alg: 'EdDSA' })
      .setIssuer('stiqrcode.com')
      .setAudience('stiqrcode.app')
      .setExpirationTime('5minutes')
      .sign(await privateKey())

    return { body: newJws }
  } catch (e) {
    return {
      status: 400,
      body: e.message
    }
  }
}