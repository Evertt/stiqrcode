<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'

	// export const prerender = true

	export const load: Load<{session: Session}> = async ({ page, session }) => {
    const loginRoute = '/testers/login'

    if (page.path === loginRoute) return {}
		if (!session.user) return { redirect: loginRoute }
    if (!session.user.email) return { redirect: '/app' }

    return {}
	}
</script>

<slot />
