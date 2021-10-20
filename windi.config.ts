import { defineConfig } from 'vite-plugin-windicss'

export default defineConfig({
  attributify: true,
  shortcuts: {
    'hstack': 'flex justify-around',
    'vstack': 'flex flex-col',
    'icon': 'w-6 h-6 fill-current',
    'app': 'text-red',
    'app-border': 'border-gray-200 dark:border-dark-300',
  },
})