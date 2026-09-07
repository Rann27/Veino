import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        // Brand purple rather than the old #4B5563, which was all but invisible
        // against the dark themes — leaving slower navigations looking frozen.
        color: '#a78bfa',
        // Nothing flashes on navigations that resolve quickly; the bar only
        // appears once a visit is slow enough to be worth reporting.
        delay: 200,
        showSpinner: false,
    },
});
