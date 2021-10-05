<script context="module" lang="ts">
	export const prerender = true
</script>

<script lang="ts">
	import state from '$lib/state'
	import type Code from "$lib/code"
	import { db } from "$lib/firebase"
	import { goto } from '$app/navigation'
	import { onMount, onDestroy } from "svelte"
	import { exportPKCS8, exportSPKI } from 'jose/key/export'
	import generateKeyPair from 'jose/util/generate_key_pair'

	let code: Code

	onMount(async () => {
		if ($state.code) return waitToConfirm()

		const { setDoc, doc } = await import("firebase/firestore")
		const { getAuth, signInAnonymously } = await import("firebase/auth")

  	const { user } = await signInAnonymously(getAuth())

		const keys = await generateKeyPair("RSA-OAEP-256", { extractable: true })
		const pkcs8Pem = await exportPKCS8(keys.privateKey)
		const spkiPem = await exportSPKI(keys.publicKey)
		const resp = await fetch('/api/v1/code')
		const code = await resp.text()

		const testRef = doc(db(), "tests", user.uid)
		await setDoc(testRef, { public_key: spkiPem })

		const codeRef = doc(db(), "codes", code)
		await setDoc(codeRef, { test: testRef.id } as Code)

		$state = { ...$state, id: user.uid, code, private_key: pkcs8Pem }

		waitToConfirm()
	})

	const waitToConfirm = async () => {
		if (!$state.code) return
		const { doc, onSnapshot } = await import("firebase/firestore")

		const codeRef = doc(db(), "codes", $state.code)

		const unsubscribe = onSnapshot(codeRef, snapshot => {
			if (!snapshot.exists) return
			code = snapshot.data() as Code
			console.log({ code })
		})

		onDestroy(() => unsubscribe())
	}

	const confirm = async () => {
		if (!$state.code) return
		const { updateDoc, doc } = await import("firebase/firestore")
		const codeRef = doc(db(), "codes", $state.code)
		await updateDoc(codeRef, { status: "confirmed" } as Partial<Code>)
	}

	$: if (code && code.status === "confirmed") {
		setTimeout(() => {
			goto('/')
			$state.code = null
		}, 1000)
	}
</script>

<svelte:head>
	<title>
		{$state.code ? "Show and confirm code" : "Start new test"}
	</title>
</svelte:head>

<section>
	{#if !code}
		<img src="/tail-spin.svg" alt="Loading..." />
	{:else}
		<p>Please show this code:</p>

		<p>{$state.code}</p>

		{#if !code.status}
			<p>
				Keep this screen open still,<br>
				we'll need you to confirm in a few moments
			</p>
		{:else if code.status === "confirming"}
			<button on:click={confirm}>Tap to confirm</button>
		{:else if code.status === "confirmed"}
			<p>Success!</p>
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
