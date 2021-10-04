<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	import user from "$lib/user"
	import state from '$lib/state'
	import { db } from "$lib/firebase"
	import { importPKCS8 } from 'jose/key/import'
	import compactDecrypt from 'jose/jwe/compact/decrypt'
	import { exportPKCS8, exportSPKI } from 'jose/key/export'
	import generateKeyPair from 'jose/util/generate_key_pair'

	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

	const register = async () => {
		const { setDoc, doc } = await import("firebase/firestore")
		const { getAuth, signInAnonymously } = await import("firebase/auth")

  	await signInAnonymously(getAuth())

		const keys = await generateKeyPair("RSA-OAEP-256", { extractable: true })
		const pkcs8Pem = await exportPKCS8(keys.privateKey)
		const spkiPem = await exportSPKI(keys.publicKey)
		const resp = await fetch('/api/v1/code')
		const code = await resp.text()

		const testRef = doc(db(), "tests", $user.uid)
		await setDoc(testRef, { public_key: spkiPem })

		const codeRef = doc(db(), "codes", code)
		await setDoc(codeRef, { test: testRef.id })

		$state = { ...$state, id: $user.uid, code, private_key: pkcs8Pem }
	}

	const submitTest = async () => {
		const resp = await fetch('/api/v1/tests', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				code: $state.code,
				sub: "E v Brussel",
				tat: 210927,
				trs: {
					"c": 0,
					"g": 0,
					"h": 0,
					"b": 0,
					"s": 0
				}
			})
		})

		$state.code = null
	}

	const fetchResults = async () => {
		if (!$user) return
		const { deleteUser } = await import("firebase/auth")
		const { getDoc, doc, deleteDoc } = await import("firebase/firestore")

		const test = await getDoc(doc(db(), "tests", $user.uid))
		const jwe = test.get('results')

		if (!jwe) return

		deleteDoc(test.ref)
		deleteUser($user)
		const privateKey = await importPKCS8($state.private_key, "RSA-OAEP-256")
		const decryptedJws = await compactDecrypt(jwe, privateKey)
		$state = { tests: [ ...$state.tests, decode(decryptedJws.plaintext) ] }
	}
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<section>
	{#if !$user}
		<button on:click={register}>I'm getting a test now.</button>
	{/if}

	{#if $state.tests}
		<a sveltekit:prefetch href="/tests">History</a>
	{/if}

	{#if $state.code}
		<h2>{$state.code}</h2>

		<button on:click={submitTest}>Submit imaginary form.</button>
	{:else if $state.id}
		<button on:click={fetchResults}>Check test results</button>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}
</style>
