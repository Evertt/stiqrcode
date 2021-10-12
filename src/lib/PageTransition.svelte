<script lang="ts">
  import { browser } from "$app/env"
  import { page, navigating } from "$app/stores"
  import type { FlyParams } from "svelte/transition"
  import { fly } from "svelte/transition"

  const duration = 400
  let oldPath = $page.path
  let newPath = $page.path

  $: oldPath = $navigating?.from.path || oldPath
  $: newPath = $navigating?.to.path || newPath
  
  const params = (direction: "in"|"out"): FlyParams => {
    if (!browser) return {}
    const factor = direction === "in" ? 1 : -1

    let params: FlyParams = { duration, x: 0, y: 0 }

    if (newPath.startsWith(oldPath)) {
      if (direction === "in") params = {
        duration, x: window.innerWidth * factor
      }
    } else if (oldPath.startsWith(newPath)) {
      if (direction === "out") params = {
        duration, x: -window.innerWidth * factor
      }
    } else {
      params = { duration, y: -window.innerHeight * factor }
    }

    return params
  }
</script>

{#key $page.path === newPath}
  <div in:fly={params("in")} out:fly={params("out")}>
    <slot />
  </div>
{/key}

<style>
  div {
    position: fixed;
    width: 100vw;
    height: 100vh;
    overflow: auto;
  }
</style>