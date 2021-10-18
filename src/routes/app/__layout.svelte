<svelte:head>
	<meta name="theme-color" content="#e0ffff">
</svelte:head>

<main><slot /></main>

<style lang="postcss">
	:global(body) {
		background: #e0ffff;
	}

	main {
		width: 100vw;
		height: 100vh;
		margin: 0 auto;
		font-size: 28px;
		font-family: sans-serif;

		:global(#wrap) {
			position: fixed;
			width: 100vw;
			height: 100vh;
			flex: 1;
			gap: 20px;
			padding: 1rem;
			display: flex;
			align-items: center;
			flex-direction: column;
			justify-content: center;
		}

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
