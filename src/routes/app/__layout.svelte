<svelte:head>
	<meta name="theme-color" content="#e0ffff">
</svelte:head>

<main><slot /></main>

<style lang="postcss">
	:global(body) {
		background: #e0ffff;
	}

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
		font-family: sans-serif;

		:global {
			a, input, button, span {
				display: block;
				font-size: 28px;
				text-align: center;
				padding: .25rem .5rem;
				box-sizing: border-box;
			}

			a, button {
				border-radius: 5px;
				background: #a0bbbb;
				border: none;
				text-decoration: none;
				cursor: pointer;
				color: #333;
			}

			p {
				color: #333;
			}
		}
	}
</style>
