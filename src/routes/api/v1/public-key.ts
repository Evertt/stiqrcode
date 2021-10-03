import { publicKey } from '$lib/signing-keys'

export const get = async () => ({
  body: { public_key: await publicKey() }
})
