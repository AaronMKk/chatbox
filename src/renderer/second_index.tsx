import React from 'react';
import ReactDOM from 'react-dom/client';
import SecondaryApp from './secondApp';
import reportWebVitals from './reportWebVitals';
import './i18n';
import './static/index.css';
import './static/globals.css';

import './setup/sentry_init';
import './setup/ga_init';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <SecondaryApp />
    </React.StrictMode>
);

// Optional: Report performance
reportWebVitals();