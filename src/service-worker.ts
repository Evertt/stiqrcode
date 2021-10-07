import firebaseConfig from "$lib/firebase-config"
import { initializeApp } from "firebase/app"
import {
  initializeAuth,
  indexedDBLocalPersistence,
  onAuthStateChanged,
  getIdToken
} from "firebase/auth"

// Initialize the Firebase app in the service worker script.
const app = initializeApp(firebaseConfig)
const auth = initializeAuth(app, {persistence: indexedDBLocalPersistence})

declare const self: ServiceWorkerGlobalScope

/**
 * Returns a promise that resolves with an ID token if available.
 * @return {!Promise<?string>} The promise that resolves with an ID token if
 *     available. Otherwise, the promise resolves with null.
 */
const getIdTokenPromise = (): Promise<string | null> => {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe()
      if (user) {
        getIdToken(user).then(
          idToken => resolve(idToken),
          () => resolve(null) // Fail silently
        )
      } else {
        resolve(null)
      }
    })
  })
}

const getOriginFromUrl = (url: string) => {
  // https://stackoverflow.com/questions/1420881/how-to-extract-base-url-from-a-string-in-javascript
  const pathArray = url.split('/')
  const protocol = pathArray[0]
  const host = pathArray[2]
  return protocol + '//' + host
}

// Get underlying body if available. Works for text and json bodies.
const getBodyContent = async (req: Request) => {
  if (req.method === 'GET') return
  if (req.headers.get('Content-Type')?.indexOf('json') > 0)
    return req.json().then(JSON.stringify)

  return req.text()
}

self.addEventListener('fetch', (event: FetchEvent) => {
  const evt = event

  const requestProcessor = (idToken: string) => {
    let req = evt.request
    let processRequestPromise = Promise.resolve()
    // For same origin https requests, append idToken to header.
    if (self.location.origin == getOriginFromUrl(evt.request.url) &&
        (self.location.protocol == 'https:' ||
         self.location.hostname == 'localhost') &&
        idToken) {
      // Clone headers as request headers are immutable.
      const headers = new Headers()
      req.headers.forEach((val, key) => {
        headers.append(key, val)
      })
      // Add ID token to header.
      headers.append('Authorization', 'Bearer ' + idToken)
      processRequestPromise = getBodyContent(req).then((body: string) => {
        try {
          req = new Request(req.url, {
            method: req.method,
            headers: headers,
            mode: 'same-origin',
            credentials: req.credentials,
            cache: req.cache,
            redirect: req.redirect,
            referrer: req.referrer,
            body: req.method === 'GET' ? undefined : body,
            // bodyUsed: req.bodyUsed,
            // context: req.context
          })
        } catch (e) {
          // This will fail for CORS requests. We just continue with the
          // fetch caching logic below and do not pass the ID token.
        }
      })
    }
    return processRequestPromise.then(() => {
      return fetch(req)
    })
  }
  // Fetch the resource after checking for the ID token.
  // This can also be integrated with existing logic to serve cached files
  // in offline mode.
  evt.respondWith(getIdTokenPromise().then(requestProcessor, requestProcessor))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
