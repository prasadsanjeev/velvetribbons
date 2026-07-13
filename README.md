# Velvet Ribbons — velvetribbons.ca

Static site deployed on Azure Static Web Apps (Free tier).

## Structure
```
src/
  index.html                  # the website
  staticwebapp.config.json    # SWA routing + security headers
.github/workflows/
  azure-static-web-apps.yml   # CI/CD pipeline
```

## Deploy — Option A: GitHub CI/CD (recommended)
1. Push this folder to a new GitHub repo (main branch).
2. Azure Portal → Create resource → **Static Web App**
   - Plan: **Free**
   - Region: Central Canada (or East US 2)
   - Source: GitHub → select repo/branch
   - Build presets: **Custom**, App location: `src`, Output location: *(blank)*
3. Azure auto-adds the deploy token secret; if using this workflow file
   instead of the generated one, copy the token from
   SWA → Manage deployment token → add as repo secret
   `AZURE_STATIC_WEB_APPS_API_TOKEN`.
4. Push to main → site deploys automatically.

## Deploy — Option B: SWA CLI (no GitHub, 2 minutes)
```bash
npm install -g @azure/static-web-apps-cli
az login
swa deploy ./src --deployment-token <TOKEN> --env production
```

## Custom domain: velvetribbons.ca
SWA → Custom domains → Add:
1. Add `www.velvetribbons.ca` → create CNAME at your registrar
   pointing to the `*.azurestaticapps.net` hostname → validate.
2. Add apex `velvetribbons.ca` → validate via TXT record, then create
   an ALIAS/ANAME record (or use Cloudflare CNAME-flattening) to the
   same hostname.
3. SWA → Custom domains → set `velvetribbons.ca` as default so
   www redirects to apex. SSL certificates are automatic and free.

## Contact form
Currently uses mailto: (opens the visitor's email app). For a true
backend form later, add an Azure Function under /api and post to it,
or swap in Formspree/Web3Forms with one HTML change.
