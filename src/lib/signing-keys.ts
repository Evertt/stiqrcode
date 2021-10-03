import functions from 'firebase-functions'
import { importPKCS8 } from 'jose/key/import'
import { importSPKI } from 'jose/key/import'

const signingKeys = functions.config().signing

export const privateKey = () => importPKCS8(signingKeys.private_key, 'EdDSA')
export const publicKey = () => importSPKI(signingKeys.public_key, 'EdDSA')
