import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        // Bundle analysis (#77) — run with: ANALYZE=true npm run build
        process.env.ANALYZE && (await import('rollup-plugin-visualizer')).visualizer({
            filename: 'dist/bundle-stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
        }),
    ].filter(Boolean),
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.js'],
        exclude: ['node_modules', 'e2e/**'],
    },
})