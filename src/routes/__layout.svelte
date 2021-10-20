<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit'
	import { initI18n } from '../i18n/i18n-svelte'

	export const load: Load = async ({ page, fetch, session }) => {
		// const acceptLanguageHeaderDetector = initAcceptLanguageHeaderDetector(req)
		// const detectedLocale = detectLocale('en', ['nl', 'en'], detector)
		await initI18n('en')
		return {}
	}
</script>

<script lang="ts">
	import "virtual:windi.css"
	import { sveltex } from 'sveltex'
	import { browser } from "$app/env"
	sveltex()
	if (browser) import("virtual:windi-devtools")
</script>

<slot />