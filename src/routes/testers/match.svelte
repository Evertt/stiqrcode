<script lang="ts">
  import { db, user } from "$lib/firebase"
  import { onDestroy } from "svelte"

  let id: string
  let code: string
  let confirming = false
  let unsubscribe: () => void | undefined
  onDestroy(() => unsubscribe && unsubscribe())

  const confirmCode = async (confirm: boolean) => {
    if (!code) return
    confirming = true
		const { updateDoc, deleteDoc, doc, onSnapshot } = await import("firebase/firestore")
		const codeRef = doc($db, "codes", code)

    unsubscribe ??= onSnapshot(codeRef, snapshot => {
			const code = snapshot.data() as Code
      if (code.status === "confirmed") {
        id = code.test
        confirming = false
        unsubscribe()
        deleteDoc(snapshot.ref)
      } else if (code.status === null) {
        confirming = false
      }
		})

		await updateDoc(codeRef, {
      status: confirm ? "confirming" : null,
      tester_id: confirm ? $user.uid : null,
      tester_name: confirm ? $user.displayName : null,
    } as Partial<Code>)
  }
</script>

{#if confirming}
  <img class="spinner" src="/tail-spin.svg" alt="Confirming..." />
  <button on:click={_ => confirmCode(false)}>Cancel</button>
{:else if !id}
  <input bind:value={code} placeholder="Code" pattern="[A-Z]{4}" />
  <button on:click={_ => confirmCode(true)}>Confirm code</button>
{:else}
  {id}
{/if}

<style>
	.spinner {
    height: 50px;
  }
</style>