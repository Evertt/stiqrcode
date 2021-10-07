<script>
  import { auth, user } from "$lib/firebase"

  let email, password

  const login = async () => {
    const { signInWithEmailAndPassword } = await import("firebase/auth")
    await signInWithEmailAndPassword($auth, email, password)
  }

  const register = async () => {
    const { createUserWithEmailAndPassword } = await import("firebase/auth")
    await createUserWithEmailAndPassword($auth, email, password)
  }

  const logout = async () => {
    const { signOut } = await import("firebase/auth")
    await signOut($auth)
  }

  $: console.log($user)
</script>

{#if $user}
  Logged in!<br>
  <button on:click={logout}>Log out</button>
{:else}
  <input bind:value={email} name="email" type="email" placeholder="Email" />
  <input bind:value={password} name="password" type="password" placeholder="Password" />

  <button on:click={login}>Login</button>
  <button on:click={register}>Register</button>
{/if}
