<script context="module" lang="ts">
  import { getUser } from "$lib/firebase"
  import type { Load } from '@sveltejs/kit'

	export const load: Load<{session: Session}> = async ({ page, session }) => {
    const status = 302
    let user = await getUser(session)
    const loginRoute = '/testers/login'

    if (page.path === loginRoute) return {}
		if (!user) return { redirect: loginRoute, status }
    if (user.uid && !user.email) return { redirect: '/app', status }

    return {}
	}
</script>

<slot />
