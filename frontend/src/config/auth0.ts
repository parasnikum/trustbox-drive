export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'dev-cloudnest.us.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'demo_cloudnest_client_id',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: import.meta.env.VITE_AUTH0_AUDIENCE || undefined,
  },
};

export const isAuth0Configured = () => {
  return (
    !!import.meta.env.VITE_AUTH0_DOMAIN &&
    !!import.meta.env.VITE_AUTH0_CLIENT_ID &&
    import.meta.env.VITE_AUTH0_DOMAIN !== 'dev-cloudnest.us.auth0.com'
  );
};
