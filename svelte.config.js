import { resolve } from 'path'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import preprocess from 'svelte-preprocess'
import firebase from 'svelte-adapter-firebase'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess({
        postcss: true
    })],

	kit: {
		adapter: firebase(),
		target: '#svelte',
		vite: {
			resolve: {
				alias: {
					$store: resolve(__dirname, './src/store'),
				},
			},
		}
	}
}

export default config
