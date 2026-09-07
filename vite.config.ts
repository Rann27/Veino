import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // CKEditor is deliberately absent here. Naming it as a manual
                // chunk made Rollup treat it as a static dependency of the
                // entry, so app.tsx pulled in 929 KB (242 KB gzipped) on every
                // public page — homepage included — even though every
                // RichTextEditor import is already lazy() and only admins ever
                // open an editor. Worse, because it sat in the entry graph the
                // app could not boot until it finished downloading: one failed
                // request for it left readers with a blank white page.
                //
                // Left to itself, Rollup splits it out behind those lazy()
                // boundaries, which is what was wanted all along.
                //
                // vendor stays: react, react-dom and Inertia genuinely are
                // needed before anything can render.
                manualChunks: {
                    'vendor': ['react', 'react-dom', '@inertiajs/react'],
                }
            }
        }
    },
    optimizeDeps: {
        include: ['ckeditor5', '@ckeditor/ckeditor5-react'],
        force: true
    },
});
