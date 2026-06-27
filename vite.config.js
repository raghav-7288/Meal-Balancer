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
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Split heavy vendor libs into separate cacheable chunks
                    if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
                        return 'vendor-react';
                    }
                    if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
                        return 'vendor-charts';
                    }
                    if (id.includes('node_modules/@supabase')) {
                        return 'vendor-supabase';
                    }
                    if (id.includes('node_modules/jspdf')) {
                        return 'vendor-pdf';
                    }
                },
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.js'],
        exclude: ['node_modules', 'e2e/**'],
    },
})