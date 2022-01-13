/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { config } from 'firebase-functions'
import { importPKCS8, importSPKI, importJWK } from 'jose/key/import'

export const signingKeys = config().signing

// EcDSA was chosen instead of EdDSA,
// because an exported EdDSA public key
// can't be imported on the browser side.
export const getPrivateKey = () => importPKCS8(signingKeys.private_key, 'ES256')
export const getPublicKey = () => importSPKI(signingKeys.public_key, 'ES256')
export const getSecret = () => importJWK(signingKeys.secret, 'HS256')
