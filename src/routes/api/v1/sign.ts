import type { RequestHandler } from '@sveltejs/kit'
import { getPrivateKey, getSecret } from "$lib/signing-keys"
import jwtVerify from 'jose/jwt/verify'
import SignJWT from 'jose/jwt/sign'

export const post: RequestHandler<Locals, string> = async request => {
  const jws = request.body
  const secret = await getSecret()
  const privateKey = await getPrivateKey()

  try {
    const verified = await jwtVerify(jws, secret, {
      issuer: "stiqrcode.com",
      audience: "stiqrcode.com"
    })

    // TODO: Consider whether it would make sense to
    // rotate these key pairs, since the tokens they sign
    // are valid for only 5 minutes anyway. Maybe rotating
    // these key pairs could add a strong layer of security?
    const newJws = await new SignJWT(verified.payload)
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuer('stiqrcode.com')
      .setAudience('stiqrcode.app')
      .setExpirationTime('5minutes')
      .sign(privateKey)

    return { body: newJws }
  } catch (e) {
    return {
      status: 400,
      body: e.message
    }
  }
}