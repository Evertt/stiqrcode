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
	import QrScanner from "qr-scanner"
	import { onDestroy } from "svelte"
	import jwtVerify from "jose/jwt/verify"
	import transform from "$lib/jwt-transform"
	import { importSPKI } from "jose/key/import"
	import { fade, fly } from "svelte/transition"
	import type { KeyLike } from "jose/key/import"
	import { decode as b45Decode } from "base45-ts"
	import BackButton from "$lib/BackButton.svelte"

	QrScanner.WORKER_PATH = "/qr-scanner-worker.min.js"

	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

	const decompress = (compressed: string) =>
		decode(pako.inflateRaw(b45Decode(compressed)))

	export let spkiPem: string
	let publicKey: KeyLike
	$: spkiPem && importSPKI(spkiPem, "ES256").then(pk => publicKey = pk)

	function displayTextWidth(text, font = "sans-serif") {
		const _this = displayTextWidth as any
		let canvas = _this.canvas || (_this.canvas = document.createElement("canvas"))
		let context = canvas.getContext("2d")
		context.font = font
		let metrics = context.measureText(text)
		return metrics.width
	}

	const isValidResult = (input: any): input is Result => {
		return !!input?.stis
	}

	let videoElem: HTMLVideoElement
	let result: Result | Error
	let qrScanner: QrScanner
	let timeoutHandle, intervalHandle
	const tips = [
		"play around with the distance",
		"closer is not always better",
		"a brighter screen might help",
		"make sure their screen isn't tinted red"
	]
	let tipIndex = -1
	const fadeDuration = 700
	$: stis = isValidResult(result) && Object.entries(result.stis)
		.sort((a, b) => displayTextWidth(a[0]) - displayTextWidth(b[0]))

	const resetStuff = () => {
		tipIndex = -1
		clearTimeout(timeoutHandle)
		clearInterval(intervalHandle)
	}

	const destroyScanner = () => {
		resetStuff()
		if (!qrScanner) return
		qrScanner.stop()
		qrScanner.destroy()
		qrScanner = null
	}

	const initScanner = async () => {
		if (!videoElem) return
		resetStuff()
		qrScanner ??= new QrScanner(videoElem, async r => {
			if (result) return
			const jws = decompress(r)

			try {
				const verified = await jwtVerify(jws, publicKey, {
					issuer: "stiqrcode.com",
					audience: "stiqrcode.app"
				})
				result = transform(verified.payload as any)
			} catch (error) {
				result = error
			}

			timeoutHandle = setTimeout(destroyScanner, 10_000)
		})
		qrScanner.start()
		intervalHandle = setInterval(
			() => tipIndex = (tipIndex + 1) % tips.length,
			8000
		)
	}

	$: videoElem && !result && initScanner()
	onDestroy(destroyScanner)
</script>

<svelte:head>
	<title>Scanner</title>
</svelte:head>


<div id="wrap" class="content"
	in:fly={{ duration: 400, delay: 200, x: window.innerWidth }}
	out:fly={{ duration: 200, x: window.innerWidth }}>
	<BackButton />
	
	{#if result}
		<div class="square">
			{#if result instanceof Error}
				<div class="error">
					<p>This QR code is not valid anymore.</p>
					<p>QR codes are only valid for 5 minutes.</p>
					<p>But they can easily get a new QR code by pressing the button again.</p>
				</div>
			{:else}
				<table>
					<tr>
						<td>Name</td>
						<td>{result.name}</td>
					</tr>
					<tr>
						<td>Tested</td>
						<td>{result.tested_around}</td>
					</tr>
					{#each stis as [sti, result]}
						<tr class={result ? "positive" : "negative"}>
							<td>{sti}</td>
							<td>{result ? "positive" : "negative"}</td>
						</tr>
					{/each}
				</table>
			{/if}
		</div>
		<div class="new-scan">
			<button on:click={_ => result = null}>New scan</button>
		</div>
	{/if}

	<div class:hidden={result}>
		<div class="square">
			<!-- svelte-ignore a11y-media-has-caption -->
			<video bind:this={videoElem} />
		</div>
		<div class="tips">
			{#key tipIndex}
				{#if tips[tipIndex]}
					<span
						out:fade={{ duration: fadeDuration }}
						in:fade={{ duration: fadeDuration, delay: fadeDuration }}
					>Tip: {tips[tipIndex]}</span>
				{/if}
			{/key}
		</div>
	</div>
</div>

<style>
	#wrap.content {
		flex-direction: column;
		justify-content: center;
		font-size: 22px;
		align-items: stretch;
	}

	.error {
		padding: 1rem;
		background: crimson;

		p {
			margin-top: 0;
			color: #eee;
			font-size: 28px;
		}
	}

	.hidden {
		display: none;
	}

	.square {
		position: relative;
		width: 100%;

		&::after {
			content: "";
			display: block;
			padding-bottom: 100%;
		}

		& > * {
			position: absolute;
			width: 100%;
			height: 100%;
			border-radius: 8px;
    	box-shadow: 0 0 10px 0px rgb(0 0 0 / 20%);
		}
	}

	video {
		object-fit: cover;
	}

	table {
		border-collapse: collapse;
    background: #fdfdfd;

		td {
			padding: .5rem 1rem;
		}

		td:first-child {
			text-align: right;

			&::after {
				content: ":"
			}
		}
	}

	.tips, .new-scan {
		height: 72px;
		display: flex;
		position: relative;
	}

	.tips > * {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.new-scan button {
		width: 100%;
		height: 45px;
		margin: auto;
	}

	/* .old td:last-child::before {
		content: "⚠️ "
	} */

	.negative td:last-child::before {
		content: "✅ "
	}

	.positive td:last-child::before {
		content: "❌ "
	}
</style>
