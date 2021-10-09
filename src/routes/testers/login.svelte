<script context="module" lang="ts">
  export const prerender = true
</script>

<script>
  import { goto } from "$app/navigation"
  import { db, auth, user } from "$lib/firebase"

  let name, email, password
  let working = false

  const login = async () => {
    working = true
    const { signInWithEmailAndPassword } = await import("firebase/auth")
    await signInWithEmailAndPassword($auth, email, password)
    goto("/testers/match")
  }

  const register = async () => {
    working = true
    const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth")
    const { user } = await createUserWithEmailAndPassword($auth, email, password)

    await updateProfile(user, { displayName: name })

    const { doc, setDoc } = await import("firebase/firestore")
    await setDoc(
      doc($db, "testers", user.uid),
      { displayName: name, email }
    )
    
    goto("/testers/match")
  }

  const logout = async () => {
    working = true
    const { signOut } = await import("firebase/auth")
    await signOut($auth)

    goto("/")
  }
</script>

{#if working}
  <img src="/tail-spin.svg" alt="Working..." />
{:else if $user}
  Logged in!<br>
  <button on:click={logout}>Log out</button>
{:else}
  <input bind:value={name} name="name" type="name" placeholder="Name" />
  <input bind:value={email} name="email" type="email" placeholder="Email" />
  <input bind:value={password} name="password" type="password" placeholder="Password" />

  <button on:click={login}>Login</button>
  <button on:click={register}>Register</button>
{/if}
