import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@images': fileURLToPath(new URL('./images', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/services/**', 'src/debug/utils/**'],
    },
  },
})
