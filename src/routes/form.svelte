<script context="module" lang="ts">
	export const prerender = true
</script>

<script lang="ts">
  import type Code from "$lib/code"
  import { db } from "$lib/firebase"
  import { onDestroy } from "svelte"

  interface Form {
    id: string|null
    sub: string|null
    dot: number|null
  }

  let form: Form = {
    id: null,
    sub: null,
    dot: null
  }

  let code: string
  let confirming = false
  let unsubscribe
  onDestroy(() => unsubscribe && unsubscribe())

  const confirmCode = async (confirm: boolean) => {
    if (!code) return
    confirming = true
		const { updateDoc, deleteDoc, doc, onSnapshot } = await import("firebase/firestore")
		const codeRef = doc(db(), "codes", code)

    unsubscribe ??= onSnapshot(codeRef, snapshot => {
			const code = snapshot.data() as Code
      if (code.status === "confirmed") {
        form.id = code.test
        confirming = false
        unsubscribe()
        deleteDoc(snapshot.ref)
      } else if (code.status === null) {
        confirming = false
      }
		})

		await updateDoc(codeRef, {
      status: confirm ? "confirming" : null,
      nameOfTester: confirm ? "P&G292" : null,
    } as Partial<Code>)
  }

  const submitTest = async () => {
		await fetch('/api/v1/tests', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(form)
		})

    alert("Success")
	}
</script>

<form on:submit|preventDefault={submitTest}>
  <input bind:value={form.sub} placeholder="Name" />
  <input bind:value={form.dot} placeholder="Date" />

  {#if confirming}
    <img class="spinner" src="/tail-spin.svg" alt="Confirming..." />
    <button on:click|preventDefault={_ => confirmCode(false)}>Cancel</button>
  {:else if !form.id}
    <input bind:value={code} placeholder="Code" pattern="[A-Z]{4}" />
    <button on:click|preventDefault={_ => confirmCode(true)}>Confirm code</button>
  {:else}
    <button type="submit">Submit form</button>
  {/if}
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 20px;
	}

  .spinner {
    height: 50px;
  }
</style>