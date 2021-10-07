<script>
  import { goto } from "$app/navigation"
  import { db, auth, user } from "$lib/firebase"

  let name, email, password

  const login = async () => {
    const { signInWithEmailAndPassword } = await import("firebase/auth")
    const { user } = await signInWithEmailAndPassword($auth, email, password)

    goto("./match")
  }

  const register = async () => {
    const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth")
    const { user } = await createUserWithEmailAndPassword($auth, email, password)

    await updateProfile(user, { displayName: name })

    const { doc, setDoc } = await import("firebase/firestore")
    await setDoc(
      doc($db, "testers", user.uid),
      { displayName: name, email }
    )
    goto("./match")
  }

  const logout = async () => {
    const { signOut } = await import("firebase/auth")
    await signOut($auth)
  }
</script>

{#if $user}
  Logged in!<br>
  <button on:click={logout}>Log out</button>
{:else}
  <input bind:value={name} name="name" type="name" placeholder="Name" />
  <input bind:value={email} name="email" type="email" placeholder="Email" />
  <input bind:value={password} name="password" type="password" placeholder="Password" />

  <button on:click={login}>Login</button>
  <button on:click={register}>Register</button>
{/if}
