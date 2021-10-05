import { config } from 'firebase-functions'
import { importPKCS8 } from 'jose/key/import'
import { importSPKI } from 'jose/key/import'

const signingKeys = config().signing

console.log(config())

export const privateKey = () => importPKCS8(signingKeys.private_key, 'EdDSA')
export const publicKey = () => importSPKI(signingKeys.public_key, 'EdDSA')
