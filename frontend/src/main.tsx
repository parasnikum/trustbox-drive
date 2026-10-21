import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App.tsx';
import './index.css';
import { auth0Config } from './config/auth0.ts';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={auth0Config.authorizationParams}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>,
);
