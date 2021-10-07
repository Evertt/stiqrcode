<script context="module" lang="ts">
  // TODO: Why does it give 500?
	// export const prerender = true
</script>

<script lang="ts">
  import { importSPKI } from 'jose/key/import'
  import { db } from '$lib/firebase'
  // import type { KeyLike } from 'jose/types'
  // import CompactEncrypt from 'jose/jwe/compact/encrypt'

  let id: string

  interface Form {
    sub: string|null
    dot: number|null
  }

  let form: Form = {
    sub: null,
    dot: null
  }

  // const encode = TextEncoder.prototype.encode.bind(new TextEncoder())

  // const encrypt = (payload: string, publicKey: KeyLike) =>
  //   new CompactEncrypt(encode(payload))
  //     .setProtectedHeader({
  //       alg: 'RSA-OAEP-256',
  //       enc: 'A256GCM'
  //     })
  //     .encrypt(publicKey)

  const submitTest = async () => {
    const { doc, getDoc } = await import("firebase/firestore")

    const testRef = doc($db, 'tests', id)
    const test = await getDoc(testRef)
    const spkiPem: string = test.get('public_key')

    const publicKey = await importSPKI(spkiPem, "RSA-OAEP-256")
    // const jws = await sign(form, await secret())
    // const jwe = await encrypt(jws, publicKey)

    // await testRef.update({ results: jwe })
	}
</script>

<form on:submit|preventDefault={submitTest}>
  <input bind:value={id} placeholder="ID" required />
  <input bind:value={form.sub} placeholder="Name" required />
  <input bind:value={form.dot} placeholder="Date" required />
  <button type="submit">Submit form</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 20px;
	}
</style>
