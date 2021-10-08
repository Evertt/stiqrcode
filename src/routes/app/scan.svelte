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
	import QrScanner from 'qr-scanner'
	import { onDestroy } from 'svelte'
	import jwtVerify from 'jose/jwt/verify'
	import transform from "$lib/jwt-transform"
	import * as b45 from 'base45-ts/src/base45'
	import { importSPKI } from 'jose/key/import'
	import type { KeyLike } from 'jose/key/import'
	import BackButton from "$lib/BackButton.svelte"

	QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js'

	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

	const decompress = (compressed: string) =>
		decode(pako.inflateRaw(b45.decode(compressed)))

	export let spkiPem: string
	let publicKey: KeyLike
	$: spkiPem && importSPKI(spkiPem, "ES256").then(pk => publicKey = pk)

	let videoElem: HTMLVideoElement
	let result: Result
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
			result = transform(verified.payload as any)
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

<BackButton />

<div class="content">
	{#if result}
		<table class:positive={result.result}>
			<tr>
				<td>Name</td>
				<td>{result.name}</td>
			</tr>
			<tr>
				<td>Date</td>
				<td>{result.tested_around}</td>
			</tr>
			<tr>
				<td>Result</td>
				<td>{result.result ? "positive" : "negative"}</td>
			</tr>
		</table>
	{:else}
		<!-- svelte-ignore a11y-media-has-caption -->
		<video bind:this={videoElem} />
		<span>Tip: closer is not always better</span>
	{/if}
</div>

<style>
	.content {
		width: 100%;
		max-width: var(--column-width);
		margin: var(--column-margin-top) auto 0 auto;
		font-size: 22px !important;
	}

	video {
		width: 100%;
	}

	table {
		border-collapse: collapse;

		td {
			padding: 1rem .5rem;
		}

		td:first-child::after {
			content: ":"
		}
	}
</style>
