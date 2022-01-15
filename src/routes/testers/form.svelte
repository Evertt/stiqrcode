<script lang="ts">
  import { STIs } from "$lib/stis"

  const form = {
    id: null,
    sub: null,
    dot: null,
    res: {
      c: 0,
      s: 0,
      g: 0,
      h: 0,
      b: 0,
    },

    get _dot() {
      if (typeof this.dot !== "number") return this.dot
      return "20" + `${this.dot}`.replaceAll(/(\d\d)\B/g, "$1-")
    },

    set _dot(newDot: string) {
      if (typeof newDot !== "string") this.dot = newDot
      else this.dot = +(newDot.replaceAll("-", "").substring(2))
    }
  }

  const submitTest = async () => {
    const data = { ...form }
    delete data._dot

    const resp = await fetch('/api/v1/tests', {
      method: 'POST', body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    })

    alert(resp.status)
	}
</script>

<form class="vstack" on:submit|preventDefault={submitTest}>
  <input bind:value={form.id} placeholder="ID" required />
  <input bind:value={form.sub} placeholder="Name" required />
  <input bind:value={form._dot} placeholder="Date" required type=date />

  {#each Object.entries(STIs) as [key, label]}
    <label>
      {label}:
      <select bind:value={form.res[key]}>
        <option value={0}>Negative</option>
        <option value={1}>Positive</option>
      </select>
    </label>
  {/each}

  <button type="submit">Submit form</button>
</form>
