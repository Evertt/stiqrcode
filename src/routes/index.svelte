<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
	import pako from "pako"
	import QRCode from 'qrcode'
	import type { JWK, KeyLike } from 'jose/types'
	import { importJWK, importPKCS8 } from 'jose/key/import'
	import { exportJWK, exportPKCS8, exportSPKI } from 'jose/key/export'
	import SignJWT from 'jose/jwt/sign'
	import * as b45 from 'base45-ts/src/base45'
	import jwtVerify from 'jose/jwt/verify'
	import CompactEncrypt from 'jose/jwe/compact/encrypt'
	import compactDecrypt from 'jose/jwe/compact/decrypt'
	import generateKeyPair from 'jose/util/generate_key_pair'
	import generateSecret from 'jose/util/generate_secret'
	import writable from '$lib/store'
	// import cbor from 'cbor-web'
	// import CWT from 'cwt-js/lib/index'

	interface JsonWebKeys {
		privateKey: JWK
		publicKey: JWK
	}

	interface KeySet {
		privateKey: KeyLike
		publicKey: KeyLike
	}

	const encode = TextEncoder.prototype.encode.bind(new TextEncoder())
	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

	const store = writable('stiqrcode', {
		id: null, code: null, private_key: null, jws: null
	})

	let canvas: HTMLCanvasElement

	const getKeys = async (alg: string) => {
		const storageKey = `stiqr-${alg}-keys`
		let jsonKeys: JsonWebKeys = JSON.parse(localStorage.getItem(storageKey))

		if (jsonKeys) {
			const privateKey = await importJWK(jsonKeys.privateKey, alg)
			const publicKey = await importJWK(jsonKeys.publicKey, alg)
			return { privateKey, publicKey }
		}

		const keys = await generateKeyPair(alg, { extractable: true })
		const jsonPrivateKey = await exportJWK(keys.privateKey)
		const jsonPublicKey = await exportJWK(keys.publicKey)
		localStorage.setItem(storageKey, JSON.stringify({
			privateKey: jsonPrivateKey, publicKey: jsonPublicKey
		}))

		return keys
	}

	const getSecret = async (alg: string) => {
		const storageKey = `stiqr-${alg}-secret`
		let jsonKey: JWK = JSON.parse(localStorage.getItem(storageKey))

		if (jsonKey) return importJWK(jsonKey, alg)

		const secret = await generateSecret(alg, { extractable: true })
		const jsonSecret = await exportJWK(secret)
		localStorage.setItem(storageKey, JSON.stringify(jsonSecret))

		return secret
	}

	const sign = (data: any, privateKey: KeyLike) => new SignJWT(data)
		.setProtectedHeader({ alg: 'PS256' })
		.setIssuer('stiqrcode.com')
		.setAudience('stiqrcode')
		.setExpirationTime('12weeks')
		.sign(privateKey)

	const encrypt = (payload: string, publicKey: KeyLike) =>
		new CompactEncrypt(encode(payload))
			.setProtectedHeader({
				alg: 'RSA-OAEP-256',
				enc: 'A256GCM',
				cty: 'JWT'
			})
			.encrypt(publicKey)

	const storeDataInJWE = async (data: any, keys: KeySet) => {
		const jws = await sign(data, keys.privateKey)
		return encrypt(jws, keys.publicKey)
	}

	const extractAndVerifyJWS = async (jwe: string, keys: KeySet) => {
		const decrypted = await compactDecrypt(jwe, keys.privateKey)
		const jws = decode(decrypted.plaintext)

		await jwtVerify(jws, keys.publicKey, {
			issuer: "stiqrcode.com",
			audience: "stiqrcode"
		})

		return jws
	}

	const reSign = (jwt: string, secret: KeyLike) => new SignJWT({ jwt })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuer('stiqrcode')
		.setAudience('stiqrcode')
		.setExpirationTime('60seconds')
		.sign(secret)

	const compress = (jwt: string) => b45.encode(pako.deflateRaw(jwt))
	const decompress = (compressed: string) =>
		decode(pako.inflateRaw(b45.decode(compressed)))

	const makeQrCode = async (jwe: string, keys: KeySet, secret: KeyLike) => {
		const jws = await extractAndVerifyJWS(jwe, keys)
		const newJWS = await reSign(jws, secret)
		const compressed = compress(newJWS)

		return compressed
	}

	const scanAndVerifyQrCode = async (data: string, secret: KeyLike, publicKey: KeyLike) => {
		const decompressed = decompress(data)

		const outerVerified = await jwtVerify(decompressed, secret, {
			issuer: "stiqrcode",
			audience: "stiqrcode"
		})

		const nestedJWS = outerVerified.payload.jwt as string

		const innerVerified = await jwtVerify(nestedJWS, publicKey, {
			issuer: "stiqrcode.com",
			audience: "stiqrcode"
		})

		return innerVerified.payload
	}

	const register = async () => {
		const keys = await generateKeyPair("RSA-OAEP-256", { extractable: true })
		const pkcs8Pem = await exportPKCS8(keys.privateKey)
		const spkiPem = await exportSPKI(keys.publicKey)

		const resp = await fetch('/api/v1/register', {
			method: 'POST', body: JSON.stringify({ public_key: spkiPem }),
			headers: { 'Content-Type': 'application/json' }
		})

		const { id, code } = await resp.json()

		$store = { ...$store, id, code, private_key: pkcs8Pem, }
	}

	const submitTest = async () => {
		const resp = await fetch('/api/v1/tests', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				code: $store.code,
				sub: "E v Brussel",
				tat: 210927,
				trs: {
					"c": 0,
					"g": 0,
					"h": 0,
					"b": 0,
					"s": 0
				}
			})
		})

		console.log(await resp.json())

		$store.code = null
	}

	const fetchResults = async () => {
		let resp = await fetch('/api/v1/test-results', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: $store.id })
		})

		const question = await resp.text()
		const privateKey = await importPKCS8($store.private_key, "RSA-OAEP-256")
		const decryptedAswer = await compactDecrypt(question, privateKey)
		const answer = decode(decryptedAswer.plaintext)

		console.log({ question, answer })

		resp = await fetch('/api/v1/test-results', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: $store.id, answer })
		})

		const jwe = await resp.text()
		const decryptedJws = await compactDecrypt(jwe, privateKey)
		$store.jws = decode(decryptedJws.plaintext)
	}

	const getValidJWS = async () => {
		const resp = await fetch('/api/v1/sign', {
			headers: { 'Content-Type': 'text/plain' },
			method: 'POST', body: $store.jws,
		})

		const jws = await resp.text()
		const compressed = compress(jws)
		await QRCode.toCanvas(canvas, compressed)
	}
	
	const doStuff = async () => {
		const cryptoKeys = await getKeys("RSA-OAEP-256")
		const signingKeys = await getKeys("PS256")
		const secret = await getSecret("HS256")

		const readingKeys: KeySet = {
			privateKey: cryptoKeys.privateKey,
			publicKey: signingKeys.publicKey,
		}

		const writingKeys: KeySet = {
			privateKey: signingKeys.privateKey,
			publicKey: cryptoKeys.publicKey,
		}

		const jwe = await storeDataInJWE({
			sub: "E v Brussel",
			tat: 210927,
			trs: {
				"c": 0,
				"g": 0,
				"h": 0,
				"b": 0,
				"s": 0
			}
		}, writingKeys)

		const qrData = await makeQrCode(jwe, readingKeys, secret)
		const payload = await scanAndVerifyQrCode(qrData, secret, signingKeys.publicKey)

		console.log(payload)
	}
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<section>
	<button on:click={register}>I'm at the testing institution right now.</button>

	{#if $store.code}
		<h2>{$store.code}</h2>

		<button on:click={submitTest}>Submit imaginary form.</button>
	{:else if $store.jws}
		<button on:click={getValidJWS}>Make QR code</button>

		<canvas bind:this={canvas} />
	{:else if $store.id}
		<button on:click={fetchResults}>Get test results</button>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}
</style>
