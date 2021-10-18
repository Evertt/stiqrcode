<script context="module" lang="ts">
	export const prerender = true
</script>

<script lang="ts">
	import state from '$lib/state'
	import { throttle } from "underscore"
	import { writable } from "svelte/store"
	import { db, user } from "$lib/firebase"
	import { fade } from "svelte/transition"
	import { importPKCS8 } from 'jose/key/import'
	import compactDecrypt from 'jose/jwe/compact/decrypt'

	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

	const fetching = writable<boolean|undefined>()
	fetching.set = throttle(fetching.set.bind(fetching), 500)

	let resetting = false
	let message: string

	const fetchResults = async () => {
		if (!$user) return
		$fetching = true
		const { deleteUser } = await import("firebase/auth")
		const { getDoc, doc, deleteDoc } = await import("firebase/firestore")

		const test = await getDoc(doc($db, "tests", $user.uid))
		const data = test.data()
		const jwe = test.get('results')

		if (jwe) {
			deleteDoc(test.ref)
			const privateKey = await importPKCS8($state.private_key, "RSA-OAEP-256")
			const decryptedJws = await compactDecrypt(jwe, privateKey)
			$state = { tests: [ ...$state.tests, decode(decryptedJws.plaintext) ] }
		}

		if (!data || jwe) {
			await deleteUser($user)
			message = jwe
				? "Yes! Check history 👇"
				: "It got deleted 😕"
		}

		$fetching = false
	}

	const reset = async () => {
		if (!confirm(
			"Are you sure you want to delete all your data? " +
			"That includes your history and any currently pending test."
		)) return

		resetting = true
		if ($user) try {
			const { deleteUser } = await import("firebase/auth")
		
			await deleteUser($user)
		} catch (_) {}

		$state = { tests: [] }
		resetting = false
	}
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<div id="wrap" in:fade={{ duration: 400, delay: 200 }} out:fade={{ duration: 400 }}>
	{#if $user && !$state.code}
		<button on:click={fetchResults} disabled={$fetching}>
			{#if $fetching}
				Checking...
			{:else if $fetching == null}
				Check latest test
			{:else}
				No results yet
			{/if}
		</button>
	{:else if message}
		<span>{message}</span>
	{:else}
		<a sveltekit:prefetch href="/app/start">
			{$state.code ? "Show code" : "Start new test"}
		</a>
	{/if}

	<span>
		{#if $state.tests.length}
			<a sveltekit:prefetch href="/app/history">History</a>
		{/if}
	</span>

	<a sveltekit:prefetch href="/app/scan">
		Scan QR code
	</a>

	<span></span>
	{#if $user || $state.tests.length}
		<button class="reset" on:click={reset} disabled={resetting}>
			{resetting ? "Deleting..." : "Delete all my data"}
		</button>
	{/if}
</div>

<style>
	span {
		text-align: center;
	}

	a, button, span {
		width: 285px;
		height: 45px;
		line-height: 45px;
		padding: 0 !important;
	}

	.reset {
		color: #eee;
		background: #cd1515;
	}
</style>