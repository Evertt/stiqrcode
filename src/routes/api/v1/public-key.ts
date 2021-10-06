import type { RequestHandler } from '@sveltejs/kit'
import { signingKeys } from "$lib/signing-keys"

export const get: RequestHandler = () => ({
  body: signingKeys.public_key
})
