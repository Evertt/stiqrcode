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
	import '../app.css'
	import { browser } from "$app/env"
	import { sveltex } from 'sveltex'
	sveltex()
</script>

<slot />