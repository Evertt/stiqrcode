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
  let unsubscribe = () => {}
  onDestroy(() => unsubscribe())

  const confirmCode = async () => {
    if (!code) return
    confirming = true
		const { updateDoc, deleteDoc, doc, onSnapshot } = await import("firebase/firestore")
		const codeRef = doc(db(), "codes", code)

    unsubscribe = onSnapshot(codeRef, snapshot => {
			const code = snapshot.data() as Code
      if (code.status === "confirmed") {
        form.id = code.test
        confirming = false
        unsubscribe()
        deleteDoc(snapshot.ref)
      }
		})

		await updateDoc(codeRef, { status: "confirming" } as Partial<Code>)
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
    <img src="/tail-spin.svg" alt="Confirming..." />
  {:else if !form.id}
    <input bind:value={code} placeholder="Code" pattern="[A-Z]{4}" />
    <button on:click={confirmCode}>Confirm code</button>
  {/if}

  <button disabled={!form.id}>Submit form</button>
</form>