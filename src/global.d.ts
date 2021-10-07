/// <reference types="@sveltejs/kit" />

interface User {
  uid: string
  email?: string
  displayName?: string
}

interface Locals {
	user?: User
}

interface Code {
  test: string
  tester_id?: string
  tester_name?: string
  status?: "confirming"|"confirmed"
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Session extends Locals {}
