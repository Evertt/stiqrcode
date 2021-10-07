/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { config } from 'firebase-functions'
import { importPKCS8, importSPKI, importJWK } from 'jose/key/import'

export const signingKeys = config().signing

export const privateKey = () => importPKCS8(signingKeys.private_key, 'ES256')
export const publicKey = () => importSPKI(signingKeys.public_key, 'ES256')
export const secret = () => importJWK(signingKeys.secret, 'HS256')
