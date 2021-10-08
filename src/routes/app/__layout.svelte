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
		align-items: center;
		flex-direction: column;
		justify-content: center;
		font-size: 28px;
		background: #e0ffff;
		font-family: sans-serif;
	}

	main :global(a), main :global(input), main :global(button) {
		display: block;
		font-size: 28px;
		text-align: center;
		padding: .25rem .5rem;
		box-sizing: border-box;
	}

	main :global(a), main :global(button) {
		border-radius: 5px;
		background: #a0bbbb;
		border: none;
		text-decoration: none;
		cursor: pointer;
		color: #333;
	}

	main :global(p) {
		color: #333;
	}
</style>
