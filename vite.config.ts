import { defineConfig, transformWithEsbuild } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'megaminx-jsx-loader',
      enforce: 'pre',
      async transform(code, id) {
        if (id.includes('/src/megaminx/') && id.endsWith('.js')) {
          return transformWithEsbuild(code, id, {
            loader: 'jsx',
            jsx: 'automatic',
          })
        }
      },
    },
    react({ include: /\.(js|jsx|ts|tsx)$/ }),
  ],
})
