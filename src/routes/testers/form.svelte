<script context="module" lang="ts">
  // TODO: Why does it give 500?
	// export const prerender = true
</script>

<script lang="ts">
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

  const submitTest = async () => {
    const resp = await fetch('/api/v1/tests', {
      method: 'POST', body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' }
    })

    alert(resp.status)
	}
</script>

<form on:submit|preventDefault={submitTest}>
  <input bind:value={form.id} placeholder="ID" required />
  <input bind:value={form.sub} placeholder="Name" required />
  <input bind:value={form.dot} placeholder="Date" required />
  <button type="submit">Submit form</button>
</form>

<style>
	form {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 20px;
	}
</style>
