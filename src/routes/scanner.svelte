<script context="module">
	// import { importSPKI } from 'jose/key/import'

	// since there's no dynamic data here, we can prerender
	// it so that it gets served as a static asset in prod
	export const prerender = true

	// export const load = async ({ fetch }) => {
	// 	const resp = await fetch('/api/v1/public-key')
	// 	const spki = await resp.text()
	// 	const publicKey = await importSPKI(spki, 'EdDSA')

	// 	return { props: { publicKey } }
	// }
</script>

<script lang="ts">
	import QrScanner from 'qr-scanner'

	QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js'

	let videoElem: HTMLVideoElement
	let jws: string
	let result: any

	$: if (videoElem) {
		const qrScanner = new QrScanner(videoElem, r => {
			jws = r
			qrScanner.stop()
		})
		qrScanner.start()
	}

	$: if (jws) fetch('/api/v1/verify', {
		headers: { 'Content-Type': 'text/plain' },
		method: 'POST', body: jws,
	})
	.then(async resp => result = await resp.json())
</script>

<svelte:head>
	<title>Scanner</title>
</svelte:head>

<div class="content">
	<video bind:this={videoElem} />
	<pre>{JSON.stringify(result)}</pre>
</div>

<style>
	.content {
		width: 100%;
		max-width: var(--column-width);
		margin: var(--column-margin-top) auto 0 auto;
	}

	video {
		width: 100%;
	}
</style>
