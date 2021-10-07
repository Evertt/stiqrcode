<script context="module" lang="ts">
	export const prerender = true
</script>

<script lang="ts">
	import state from '$lib/state'
	import { db, user } from "$lib/firebase"
	import { importPKCS8 } from 'jose/key/import'
	import compactDecrypt from 'jose/jwe/compact/decrypt'

	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

	const fetchResults = async () => {
		if (!$user) return
		const { deleteUser } = await import("firebase/auth")
		const { getDoc, doc, deleteDoc } = await import("firebase/firestore")

		const test = await getDoc(doc($db, "tests", $user.uid))
		const jwe = test.get('results')

		if (!jwe) return alert("No results yet")

		deleteDoc(test.ref)
		deleteUser($user)
		const privateKey = await importPKCS8($state.private_key, "RSA-OAEP-256")
		const decryptedJws = await compactDecrypt(jwe, privateKey)
		$state = { tests: [ ...$state.tests, decode(decryptedJws.plaintext) ] }

		alert("Yes! We have your results!\nThey're added to your history.")
	}

	const reset = async () => {
		$state = { tests: [] }
		if ($user) {
			const { doc, deleteDoc } = await import("firebase/firestore")
			const { deleteUser } = await import("firebase/auth")
			deleteDoc(doc($db, "tests", $user.uid))
			deleteUser($user)
		}
	}

	// const makeKeys = async () => {
	// 	const { generateSecret } = await import("jose/util/generate_secret")
	// 	const { generateKeyPair } = await import('jose/util/generate_key_pair')
	// 	const { exportJWK, exportPKCS8, exportSPKI } = await import('jose/key/export')

	// 	const secret = await generateSecret('HS256', { extractable: true })
	// 	const { publicKey, privateKey } = await generateKeyPair('ES256', { extractable: true })

	// 	const jwk = await exportJWK(secret)
	// 	const spkiPem = await exportSPKI(publicKey)
	// 	const pkcs8Pem = await exportPKCS8(privateKey)

	// 	console.log(JSON.stringify(jwk))
	// 	console.log(spkiPem)
	// 	console.log(pkcs8Pem)
	// }

	// if (typeof window !== "undefined") makeKeys()
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

{#if !$user || $state.code}
	<a sveltekit:prefetch href="/app/start">
		{$state.code ? "Show and confirm code" : "Start new test"}
	</a>
{/if}

{#if $user}
	<button on:click={fetchResults}>Check test results</button>
{/if}

{#if $state.tests.length}
	<a sveltekit:prefetch href="/app/history">History</a>
{/if}

<a sveltekit:prefetch href="/app/scan">
	Scan QR code
</a>

<button class="reset" on:click={reset}>Reset</button>

<style>
	a, button {
		width: 260px;
	}

	.reset {
		position: fixed;
		top: .25rem;
		right: .25rem;
		width: 100px;
		color: #eee;
		background: #cd1515;
	}
</style>