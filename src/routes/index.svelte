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
	{#if !$user || $state.code}
		<a sveltekit:prefetch href="/new-test">
			{$state.code ? "Show and confirm code" : "Start new test"}
		</a>
	{/if}

	{#if $state.tests.length}
		<a sveltekit:prefetch href="/tests">History</a>
	{/if}

	{#if $state.id}
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
