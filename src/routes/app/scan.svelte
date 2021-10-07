<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit'

	export const load: Load = async ({ fetch }) => {
		const resp = await fetch('/api/v1/public-key')
		const spkiPem = await resp.text()
		return { props: { spkiPem } }
	}
</script>

<script lang="ts">
	import pako from "pako"
	import * as b45 from 'base45-ts/src/base45'
	import QrScanner from 'qr-scanner'
	import { onDestroy } from 'svelte'
	import jwtVerify from 'jose/jwt/verify'
	import { importSPKI } from 'jose/key/import'
	import type { KeyLike } from 'jose/key/import'

	QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js'

	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

	const decompress = (compressed: string) =>
		decode(pako.inflateRaw(b45.decode(compressed)))

	export let spkiPem: string
	let publicKey: KeyLike
	$: spkiPem && importSPKI(spkiPem, "ES256").then(pk => publicKey = pk)

	let videoElem: HTMLVideoElement
	let result: any
	let qrScanner: QrScanner

	const destroyScanner = () => {
		if (!qrScanner) return
		qrScanner.stop()
		qrScanner.destroy()
		qrScanner = null
	}

	const initScanner = async () => {
		if (!videoElem) return
		destroyScanner()
		qrScanner = new QrScanner(videoElem, async r => {
			const jws = decompress(r)
			const verified = await jwtVerify(jws, publicKey, {
				issuer: "stiqrcode.com",
				audience: "stiqrcode.app"
			})
			result = verified.payload
			destroyScanner()
		})
		qrScanner.start()
	}

	$: videoElem && initScanner()
	onDestroy(destroyScanner)
</script>

<svelte:head>
	<title>Scanner</title>
</svelte:head>

<div class="content">
	<!-- svelte-ignore a11y-media-has-caption -->
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
