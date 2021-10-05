<script context="module" lang="ts">
	export const prerender = true
</script>

<script lang="ts">
	import user from "$lib/user"
	import state from '$lib/state'
	import { db } from "$lib/firebase"
	import { importPKCS8 } from 'jose/key/import'
	import compactDecrypt from 'jose/jwe/compact/decrypt'

	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

	const fetchResults = async () => {
		if (!$user) return
		const { deleteUser } = await import("firebase/auth")
		const { getDoc, doc, deleteDoc } = await import("firebase/firestore")

		const test = await getDoc(doc(db(), "tests", $user.uid))
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
			const { deleteUser } = await import("firebase/auth")
			await deleteUser($user)
		}
	}
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

{#if !$user || $state.code}
	<a sveltekit:prefetch href="/start">
		{$state.code ? "Show and confirm code" : "Start new test"}
	</a>
{/if}

{#if $user}
	<button on:click={fetchResults}>Check test results</button>
{/if}

{#if $state.tests.length}
	<a sveltekit:prefetch href="/history">History</a>
{/if}

<a sveltekit:prefetch href="/scan">
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
		color: #ccc;
		background: #cd1515;
	}
</style>