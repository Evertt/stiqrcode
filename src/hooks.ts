import { users } from "./store/users"
import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { app as admin } from "$lib/firebase-admin"
import type { ServerRequest, GetSession } from "@sveltejs/kit/types/hooks"

function getIdToken(req: ServerRequest<Locals>) {
  // Parse the injected ID token from the request header.
  const authorizationHeader = req.headers.authorization || '';
  const components = authorizationHeader.split(' ');
  return components.length > 1 ? components[1] : '';
}

const authenticateUser: Handle<Locals> = async ({ request, resolve }) => {
  const idToken = getIdToken(request)
	// Verify the ID token using the Firebase Admin SDK.
	// User already logged in. Redirect to profile page.
	try {
		const { uid } = await admin.auth().verifyIdToken(idToken)
		request.locals.user = { uid, ...users(uid) }
	} catch(_) {
		// ignore error
	}

	return resolve(request)
}

const handleMethodSpoofing: Handle<Locals> = async ({ request, resolve }) => {
	// TODO https://github.com/sveltejs/kit/issues/1046
	if (request.query.has('_method')) {
		request.method = request.query.get('_method').toUpperCase()
	}

	const response = await resolve(request)

	return response
}

export const handle = sequence(handleMethodSpoofing, authenticateUser)

export const getSession: GetSession<Locals, unknown, Session> = request => {
	return { ...request.locals }
}
