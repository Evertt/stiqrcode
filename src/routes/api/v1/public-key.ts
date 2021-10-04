import { publicKey } from '$lib/signing-keys'

export const get = async () => ({
  body: (await publicKey())
})
