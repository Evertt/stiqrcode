<script context="module" lang="ts">
  import { getUser } from "$lib/firebase"
  import type { Load } from '@sveltejs/kit'

	export const load: Load<{session: Session}> = async ({ page, session }) => {
    const status = 302
    let user = await getUser(session)
    const loginRoute = '/testers/login'

    const parts = page.path.split("/")
    const last = parts[parts.length - 1]

    if (page.path === loginRoute) return { props: { page: last } }
		if (!user) return { redirect: loginRoute, status }
    if (user.uid && !user.email) return { redirect: '/app', status }
    if (page.path === "/testers") return { redirect: '/testers/match', status }

    return { props: { page: last } }
	}
</script>

<script lang="ts">
  export let page: string
</script>

<div class="h-screen bg-light-300 w-screen top-0 left-0 fixed">
  <div class="bg-white rounded-md mx-auto max-w-md shadow-md m-4 p-4">
    {#if page !== 'login'}
      <div class="m-2 text-center pb-2 nav hstack">
        <a class:active={page === 'match'} sveltekit:prefetch href="/testers/match">Match</a>
        <a class:active={page === 'form'} sveltekit:prefetch href="/testers/form">Form</a>
      </div>
    {/if}
    <div class="vstack">
      <slot />
    </div>
  </div>
</div>

<style>
  .nav :global {
    a {
      @apply border-b-3 pb-1 w-24;

      &.active {
        @apply border-blue-800;
      }
    }
  }

  .vstack :global {
    input {
      @apply border rounded border-light-900 m-2 p-2;
    }

    button {
      @apply rounded bg-light-900 m-2 py-2 px-4;

      img {
        @apply h-[26px] inline;
      }
    }
  }
</style>
