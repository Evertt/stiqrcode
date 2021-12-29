import { initializeApp } from "firebase/app"
import firebaseConfig from "$lib/firebase-config"
import { build, files, timestamp } from '$service-worker'
import { initializeAuth, indexedDBLocalPersistence } from "firebase/auth"

const FILES = `cache${timestamp}`

// `build` is an array of all the files generated by the bundler,
// `files` is an array of everything in the `static` directory
const to_cache = build.concat(files)
const staticAssets = new Set(to_cache)

// Initialize the Firebase app in the service worker script.
const app = initializeApp(firebaseConfig)
const auth = initializeAuth(app, {persistence: indexedDBLocalPersistence})

declare const self: ServiceWorkerGlobalScope

self.addEventListener('install', event => 
	event.waitUntil(
		caches
			.open(FILES)
			.then(cache => cache.addAll(to_cache))
			.then(() => self.skipWaiting())
	)
)

/**
 * Returns a promise that resolves with an ID token if available.
 * @return {!Promise<?string>} The promise that resolves with an ID token if
 *     available. Otherwise, the promise resolves with null.
 */
const getIdTokenPromise = async (): Promise<string | null> => {
	try {
		return await auth.currentUser?.getIdToken()
	} catch (_) {
		return null
	}
}

const getOriginFromUrl = (url: string) => {
	// https://stackoverflow.com/questions/1420881/how-to-extract-base-url-from-a-string-in-javascript
	const pathArray = url.split('/')
	const protocol = pathArray[0]
	const host = pathArray[2]
	return protocol + '//' + host
}

// Get underlying body if available. Works for text and json bodies.
const getBodyContent = async (req: Request): Promise<string|undefined> => {
	if (req.method === 'GET') return undefined
	if (req.headers.get('Content-Type')?.indexOf('json') > 0)
		return req.json().then(JSON.stringify)

	return req.text()
}

self.addEventListener('fetch', (event: FetchEvent) => {
	// Don't handle google apis through this service worker
	if (event.request.url.match(/googleapis.com/)) return

	const evt = event
	// console.log({ url: event.request.url})

	const requestProcessor = (idToken: string) => {
		let req = evt.request
		let processRequestPromise = Promise.resolve()

		const url = new URL(event.request.url)
		const isStaticAsset = url.host === self.location.host && staticAssets.has(url.pathname)
		const validHostAndProtocol = self.location.origin == getOriginFromUrl(evt.request.url) &&
			(self.location.protocol == 'https:' || self.location.hostname == 'localhost')
		
		// We want to skip caching requests with an idToken, because the cached response that we may have,
		// was probably a response that the server gave us when we were NOT authenticated yet.
		const skipBecauseUncached = (event.request.cache === 'only-if-cached' || idToken) && !isStaticAsset

		// For same origin https requests, append idToken to header.
		if (idToken && validHostAndProtocol) {
			// Clone headers as request headers are immutable.
			const headers = new Headers(req.headers)
			// Add ID token to header.
			headers.append('Authorization', 'Bearer ' + idToken)
			processRequestPromise = getBodyContent(req).then(body => {
				try {
					req = new Request(req.url, {
						method: req.method,
						headers: headers,
						mode: 'same-origin',
						credentials: req.credentials,
						cache: req.cache,
						redirect: req.redirect,
						referrer: req.referrer,
						body,
						// bodyUsed: req.bodyUsed,
						// context: req.context
					})
				} catch (e) {
					// This will fail for CORS requests. We just continue with the
					// fetch caching logic below and do not pass the ID token.
				}
			})
		}
		return processRequestPromise.then(async () => {
			if (validHostAndProtocol && !skipBecauseUncached) {
				// always serve static files and bundler-generated assets from cache.
				// if your application has other URLs with data that will never change,
				// set this variable to true for them and they will only be fetched once.
				const cachedAsset = isStaticAsset && (await caches.match(event.request))

				return cachedAsset || fetchAndCache(event.request)
			}

			return fetch(req)
		})
	}
	// Fetch the resource after checking for the ID token.
	// This can also be integrated with existing logic to serve cached files
	// in offline mode.
	evt.respondWith(getIdTokenPromise().then(requestProcessor, requestProcessor))
})

self.addEventListener('activate', event => 
	event.waitUntil(event.waitUntil(
		caches.keys().then(keys => {
			keys.forEach(key =>
				key !== FILES && caches.delete(key)
			)

			self.clients.claim()
		})
	))
)

/**
 * Fetch the asset from the network and store it in the cache.
 * Fall back to the cache if the user is offline.
 */
 async function fetchAndCache(request: Request) {
	const cache = await caches.open(`offline${timestamp}`)

	try {
		const response = await fetch(request)
		if (request.method === "GET")
			cache.put(request, response.clone())
		return response
	} catch (err) {
		const response = await cache.match(request)
		if (response) return response

		throw err
	}
}
