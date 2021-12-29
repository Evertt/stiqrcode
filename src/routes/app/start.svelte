<script context="module" lang="ts">
	export const prerender = true
</script>

<script lang="ts">
	import "../../check.css"
	import fsm from "svelte-fsm"
	import state from "$lib/state"
	import { browser } from "$app/env"
	import { onDestroy } from "svelte"
	import { goto } from "$app/navigation"
	import { fly } from "svelte/transition"
	import { db, user } from "$lib/firebase"
	import Progress from "$lib/Progress.svelte"
	import BackButton from "$lib/BackButton.svelte"
	import { exportPKCS8, exportSPKI } from "jose/key/export"
	import generateKeyPair from "jose/util/generate_key_pair"

	let code: Code
	let unsubscribe: () => void | undefined
	onDestroy(() => unsubscribe && unsubscribe())
	let progress = 0

	const codeState = fsm("initializing", {
		initializing: {
			async _enter() {
				if (!browser) return
				if ($state.code) return this.waitToConfirm()

				progress = 0
				const { setDoc, doc } = await import("firebase/firestore")
				const { getAuth, signInAnonymously } = await import("firebase/auth")

				const { user } = await signInAnonymously(getAuth())
				progress++
				
				const keys = await generateKeyPair("RSA-OAEP-256", { extractable: true })
				const pkcs8Pem = await exportPKCS8(keys.privateKey)
				const spkiPem = await exportSPKI(keys.publicKey)

				const resp = await fetch('/api/v1/code')
				const code = await resp.text()
				progress++

				const testRef = doc($db, "tests", user.uid)
				await setDoc(testRef, { public_key: spkiPem })
				
				progress++
				const codeRef = doc($db, "codes", code)
				await setDoc(codeRef, { test: testRef.id } as Code)

				$state = { ...$state, code, private_key: pkcs8Pem }

				this.waitToConfirm()
			},

			waitToConfirm: "waitingToConfirm"
		},
		waitingToConfirm: {
			async _enter() {
				if (!$state.code) return
				const { doc, onSnapshot } = await import("firebase/firestore")

				const codeRef = doc($db, "codes", $state.code)

				unsubscribe ??= onSnapshot(codeRef, snapshot => {
					if (!snapshot.exists || !snapshot.data()) return
					code = snapshot.data() as Code

					if (code.status === "confirming") {
						unsubscribe()
						unsubscribe = null
						this.askConfirmation()
					}
				})
			},
			
			askConfirmation: "confirming"
		},
		confirming: {
			async respond(confirmed: boolean) {
				if (!$state.code || !$user) return
				const { updateDoc, doc } = await import("firebase/firestore")

				const codeRef = doc($db, "codes", $state.code)
				await updateDoc(codeRef, { status: confirmed ? "confirmed" : null } as Partial<Code>)
				
				const testRef = doc($db, "tests", $user.uid)
				await updateDoc(testRef, { tester: confirmed ? code.tester_id : null })

				confirmed ? this.confirm() : this.deny()
			},

			confirm: "confirmed",
			deny: "waitingToConfirm"
		},
		confirmed: {
			_enter() {
				setTimeout(() => {
					$state.code = null
					goto('./')
				}, 2000)
			}
		}
	})
</script>

<svelte:head>
	<title>
		{$state.code ? "Show and confirm code" : "Start new test"}
	</title>
</svelte:head>

<section id="wrap"
	in:fly={{ duration: 400, delay: 200, x: window.innerWidth }}
	out:fly={{ duration: 200, x: window.innerWidth }}
>
	<BackButton />
	{#if $codeState === "initializing"}
		<Progress value={progress} max={3} />
	{:else if $codeState === "waitingToConfirm"}
		<p class="huge">{$state.code}</p>

		<p>
			Show code,<br>
			and wait to confirm.
		</p>
	{:else if $codeState === "confirming"}
		<p>Are you at {code.tester_name}?</p>
		<div class="buttons">
			<button on:click={_ => codeState.respond(false)}>No</button>
			<button on:click={_ => codeState.respond(true)}>Yes</button>
		</div>
	{:else if $codeState === "confirmed"}
		<svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
			<circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
			<path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
		</svg>
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

	.buttons {
		width: 100%;
		display: flex;
		justify-content: space-around;
	}

	.huge {
		font-size: 64px;
	}
</style>
