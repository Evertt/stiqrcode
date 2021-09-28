<script context="module" lang="ts">
	// export const prerender = true;
</script>

<script lang="ts">
	import pako from "pako"
	import { browser } from '$app/env';
	import { writable } from "svelte/store"
	import Counter from '$lib/Counter.svelte';
	import type { JWK, KeyLike } from 'jose/types';
	import { importJWK } from 'jose/key/import'
	import { exportJWK } from 'jose/key/export'
	import SignJWT from 'jose/jwt/sign'
	import * as b45 from 'base45-ts/src/base45'
	import jwtVerify from 'jose/jwt/verify'
	import CompactEncrypt from 'jose/jwe/compact/encrypt'
	import compactDecrypt from 'jose/jwe/compact/decrypt'
	import generateKeyPair from 'jose/util/generate_key_pair'
	import generateSecret from 'jose/util/generate_secret'
	import cbor from 'cbor-web'
	// import CWT from 'cwt-js/lib/index'

	interface JsonWebKeys {
		privateKey: JWK
		publicKey: JWK
	}

	const encode = TextEncoder.prototype.encode.bind(new TextEncoder())
	const decode = TextDecoder.prototype.decode.bind(new TextDecoder())

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

	const encrypt = (payload: string) => getKeys('RSA-OAEP-256')
		.then(({ publicKey }) => new CompactEncrypt(encode(payload))
			.setProtectedHeader({
				alg: 'RSA-OAEP-256',
				enc: 'A256GCM',
				cty: 'JWT'
			})
			.encrypt(publicKey))

	const decrypt = (jwe: string) => getKeys('RSA-OAEP-256')
		.then(({ privateKey }) => compactDecrypt(jwe, privateKey))

	const storeDataInJWE = async (data: any, privateKey: KeyLike) => {
		const jws = await sign(data, privateKey)
		return encrypt(jws)
	}

	const extractAndVerifyJWS = async (jwe: string, publicKey: KeyLike) => {
		const decrypted = await decrypt(jwe)
		const jws = decode(decrypted.plaintext)

		await jwtVerify(jws, publicKey, {
			issuer: "stiqrcode.com",
			audience: "stiqrcode"
		})

		return jws
	}

	const resign = (jwt: string, secret: KeyLike) => new SignJWT({ jwt })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuer('stiqrcode')
		.setAudience('stiqrcode')
		.setExpirationTime('60seconds')
		.sign(secret)

	const compress = (jwt: string) => b45.encode(pako.deflateRaw(jwt))
	const decompress = (compressed: string) =>
		decode(pako.inflateRaw(b45.decode(compressed)))

	const makeQrCode = async (jwe: string, publicKey: KeyLike, secret: KeyLike) => {
		const jws = await extractAndVerifyJWS(jwe, publicKey)
		const newJWS = await resign(jws, secret)
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

	const doStuff = async () => {
		const keys = await getKeys("PS256")
		const secret = await getSecret("HS256")

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
		}, keys.privateKey)

		const qrData = await makeQrCode(jwe, keys.publicKey, secret)
		const payload = await scanAndVerifyQrCode(qrData, secret, keys.publicKey)

		console.log(payload)
	}

	if (browser) doStuff()
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<section>
	<h1>
		<div class="welcome">
			<picture>
				<source srcset="svelte-welcome.webp" type="image/webp" />
				<img src="svelte-welcome.png" alt="Welcome" />
			</picture>
		</div>

		to your new<br />SvelteKit app
	</h1>

	<h2>
		try editing <strong>src/routes/index.svelte</strong>
	</h2>

	<Counter />
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	h1 {
		width: 100%;
	}

	.welcome {
		position: relative;
		width: 100%;
		height: 0;
		padding: 0 0 calc(100% * 495 / 2048) 0;
	}

	.welcome img {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		display: block;
	}
</style>
