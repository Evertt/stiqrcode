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
		flex-direction: column;
		justify-content: center;
		font-size: 28px;
		background: #e0ffff;
		font-family: sans-serif;
	}

	:global(a), :global(input), :global(button) {
		display: block;
		font-size: 28px;
		text-align: center;
		padding: .25rem .5rem;
		box-sizing: border-box;
	}

	:global(a), :global(button) {
		border-radius: 5px;
		background: #a0bbbb;
		border: none;
		text-decoration: none;
		cursor: pointer;
		color: #333;
	}

	:global(p) {
		color: #ddd;
	}
</style>
