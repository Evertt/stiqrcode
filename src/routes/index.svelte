<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit'
	
	export const load: Load<{session: Session}> = async ({ session }) => {
		return {
			status: 302,
			redirect: session.isMobile ? "/app" : "/testers"
		}
	}
</script>

<a sveltekit:prefetch href="/app">App</a><br/>
<a sveltekit:prefetch href="/testers">Testers</a><br/>
