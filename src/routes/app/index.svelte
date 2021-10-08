<script context="module" lang="ts">
	export const prerender = true
</script>

<script lang="ts">
	import state from '$lib/state'
	import { throttle } from "underscore"
	import { writable } from "svelte/store"
	import { db, user } from "$lib/firebase"
	import { importPKCS8 } from 'jose/key/import'
	import compactDecrypt from 'jose/jwe/compact/decrypt'

	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

	const fetching = writable<boolean|undefined>()
	fetching.set = throttle(fetching.set.bind(fetching), 500)

	let resetting = false

	const fetchResults = async () => {
		if (!$user) return
		$fetching = true
		const { deleteUser } = await import("firebase/auth")
		const { getDoc, doc, deleteDoc } = await import("firebase/firestore")

		const test = await getDoc(doc($db, "tests", $user.uid))
		const jwe = test.get('results')

		if (jwe) {
			deleteDoc(test.ref)
			await deleteUser($user)
			const privateKey = await importPKCS8($state.private_key, "RSA-OAEP-256")
			const decryptedJws = await compactDecrypt(jwe, privateKey)
			$state = { tests: [ ...$state.tests, decode(decryptedJws.plaintext) ] }
		}

		$fetching = false
	}

	const reset = async () => {
		if (!confirm("Are you sure you want to delete all your data?"))
			return

		resetting = true
		if ($user) {
			const { doc, deleteDoc } = await import("firebase/firestore")
			const { deleteUser } = await import("firebase/auth")
			await Promise.all([
				$state.code ? deleteDoc(doc($db, "codes", $state.code)) : Promise.resolve(),
				deleteDoc(doc($db, "tests", $user.uid)),
				deleteUser($user),
			])
		}
		$state = { tests: [] }
		resetting = false
	}
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

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
{:else if $state.tests.length && $fetching === false}
	<span>Yes! Check history 👇</span>
{:else}
	<a sveltekit:prefetch href="/app/start">
		{$state.code ? "Show code" : "Start new test"}
	</a>
{/if}

{#if $state.tests.length}
	<a sveltekit:prefetch href="/app/history">History</a>
{:else}
	<span>&nbsp;</span>
{/if}

<a sveltekit:prefetch href="/app/scan">
	Scan QR code
</a>

<span>&nbsp;</span>
{#if $user || $state.tests.length}
	<button class="reset" on:click={reset} disabled={resetting}>
		{resetting ? "Deleting..." : "Delete all my data"}
	</button>
{:else}
	<span>&nbsp;</span>
{/if}

<style>
	span {
		text-align: center;
	}

	a, button, span {
		width: 285px;
		height: 45px;
	}

	.reset {
		/* position: fixed; */
		/* top: .25rem;
		right: .25rem;
		width: 100px; */
		/* bottom: 20px; */
		color: #eee;
		background: #cd1515;
	}
</style>