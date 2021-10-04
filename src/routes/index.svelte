<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	import pako from "pako"
	import QRCode from 'qrcode'
	import user from "$lib/user"
	import writable from '$lib/store'
	import { db } from "$lib/firebase"
	import { importPKCS8 } from 'jose/key/import'
	import { encode } from 'base45-ts/src/base45'
	import compactDecrypt from 'jose/jwe/compact/decrypt'
	import { exportPKCS8, exportSPKI } from 'jose/key/export'
	import generateKeyPair from 'jose/util/generate_key_pair'

	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

	interface Store {
		id?: string
		code?: string
		private_key?: string
		jws: string[]
	}

	const store = writable<Store>('stiqrcode', { jws: [] })

	let canvas: HTMLCanvasElement

	const compress = (jwt: string) => encode(pako.deflateRaw(jwt))

	const register = async () => {
		const { setDoc, doc } = await import("firebase/firestore")

		const keys = await generateKeyPair("RSA-OAEP-256", { extractable: true })
		const pkcs8Pem = await exportPKCS8(keys.privateKey)
		const spkiPem = await exportSPKI(keys.publicKey)
		const resp = await fetch('/api/v1/code')
		const code = await resp.text()

		const testRef = doc(db(), "tests", $user.uid)
		await setDoc(testRef, { public_key: spkiPem })

		const codeRef = doc(db(), "codes", code)
		await setDoc(codeRef, { test: testRef.id })

		$store = { ...$store, id: $user.uid, code, private_key: pkcs8Pem }
	}

	const submitTest = async () => {
		const resp = await fetch('/api/v1/tests', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				code: $store.code,
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

		$store.code = null
	}

	const fetchResults = async () => {
		if (!$user) return
		const { getDoc, doc, deleteDoc } = await import("firebase/firestore")

		const test = await getDoc(doc(db(), "tests", $user.uid))
		const jwe = test.get('results')

		if (!jwe) return

		deleteDoc(test.ref)
		const privateKey = await importPKCS8($store.private_key, "RSA-OAEP-256")
		const decryptedJws = await compactDecrypt(jwe, privateKey)
		$store.jws = [ ...$store.jws, decode(decryptedJws.plaintext) ]
	}

	const getValidJWS = async () => {
		const resp = await fetch('/api/v1/sign', {
			headers: { 'Content-Type': 'text/plain' },
			method: 'POST', body: $store.jws.at(-1),
		})

		const jws = await resp.text()
		const compressed = compress(jws)
		await QRCode.toCanvas(canvas, compressed)
	}
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<section>
	{#if $user}
		<button on:click={register}>I'm at the testing institution right now.</button>

		{#if $store.code}
			<h2>{$store.code}</h2>

			<button on:click={submitTest}>Submit imaginary form.</button>
		{:else if $store.jws}
			<button on:click={getValidJWS}>Make QR code</button>

			<canvas bind:this={canvas} />
		{:else if $store.id}
			<button on:click={fetchResults}>Get test results</button>
		{/if}
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
