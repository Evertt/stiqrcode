<script lang="ts">
  let form = {
    id: null,
    sub: null,
    dot: null,
    res: {
      c: 0,
      s: 0,
      g: 0,
      h: 0,
      b: 0,
    }
  }

  const submitTest = async () => {
    form.dot = parseInt(form.dot)

    const resp = await fetch('/api/v1/tests', {
      method: 'POST', body: JSON.stringify(form),
      headers: { 'Content-Type': 'application/json' }
    })

    alert(resp.status)
	}
</script>

<form sm="vstack" on:submit|preventDefault={submitTest}>
  <input bind:value={form.id} placeholder="ID" required />
  <input bind:value={form.sub} placeholder="Name" required />
  <input bind:value={form.dot} placeholder="Date" required />
  <button type="submit">Submit form</button>
</form>
