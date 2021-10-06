<script lang="ts">
	import '../app.css'
	import { sveltex } from 'sveltex'
	sveltex()
</script>

<main>
	<slot />
</main>

<style>
	main {
		flex: 1;
		gap: 20px;
		width: 100vw;
		padding: 1rem;
		height: 100vh;
		display: flex;
		margin: 0 auto;
		max-width: 1024px;
		align-items: center;
		box-sizing: border-box;
		flex-direction: column;
		justify-content: center;
	}
</style>
