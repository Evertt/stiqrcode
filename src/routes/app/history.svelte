<script context="module" lang="ts">
	export const prerender = true
</script>

<script lang="ts">
	import pako from "pako"
	import QRCode from "qrcode"
	import state from "$lib/state"
	import { encode } from "base45-ts"
	import { fly } from "svelte/transition"
	import transform from "$lib/jwt-transform"
	import BackButton from "$lib/BackButton.svelte"

	let dataURL: string
	let interval: number | NodeJS.Timer

	const compress = (jwt: string) => encode(pako.deflateRaw(jwt))

	$: tests = $state.tests.reverse().map(jws => {
		const payload = JSON.parse(atob(jws.split('.')[1]))
		const result = transform(payload)

		return { date: result.tested_around, jws }
	})

	const makeQRCode = async (test: string) => {
		if (!dataURL) dataURL = "/tail-spin.svg"

		const resp = await fetch('/api/v1/sign', {
			headers: { 'Content-Type': 'text/plain' },
			method: 'POST', body: test,
		})

		const jws = await resp.text()
		const compressed = compress(jws)

		if (!dataURL) return // request was canceled
		dataURL = await QRCode.toDataURL(compressed)
	}

	const displayQRCode = (test: string) => {
		clearInterval(interval as number)
		makeQRCode(test)
		interval = setInterval(
			() => makeQRCode(test),
			1000 * 60 * 3 // 3 minutes
		)
	}

	const stopDisplayingQRCode = () => {
		clearInterval(interval as number)
		dataURL = null // this also cancels any running requests
	}
</script>

<div id="wrap"
	in:fly={{ duration: 400, delay: 200, x: window.innerWidth }}
	out:fly={{ duration: 200, x: window.innerWidth }}
>
	<BackButton />

	{#each tests as { jws, date }}
		<button on:click={_ => displayQRCode(jws)}>{date}</button>
	{/each}
	
	{#if dataURL}
		<div class="qr-code" on:click={stopDisplayingQRCode}>
			<img src={dataURL} alt="QR Code" />
		</div>
	{/if}
</div>

<style>
	button {
		width: 260px;
	}

	.qr-code {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		padding: 0.5em;
		align-items: center;
		justify-content: center;
		background: rgba(0,0,0,0.5)
	}

	.qr-code img {
		width: 100%;
		max-width: 250px;
	}

	.qr-code img[src$="svg"] {
		max-width: 125px;
	}
</style>
