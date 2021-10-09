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
  uid: string
  test: string
  tester_id?: string
  tester_name?: string
  status?: "confirming"|"confirmed"
}

interface Result {
  date: Date
  name: string
  result: boolean
  tested_around: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Session extends Locals {}
