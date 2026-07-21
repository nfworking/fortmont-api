# Fortmont OAuth Sample

This folder contains a tiny browser-based OAuth / OpenID Connect client for testing Fortmont as an identity provider.

## Run

```bash
pnpm --dir packages/sample run dev
```

Open the page at `http://localhost:4173`, then set:

- Issuer URL: `https://api.fortmont.me`
- Redirect URI: `http://localhost:4173/`
- Client ID: the registered Fortmont OAuth client ID

The sample uses authorization code + PKCE, exchanges the code for tokens, and shows the returned claims.