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

## Contact and booking enquiries

All booking and corporate quote buttons lead to the shared enquiry form.
Sending an enquiry opens the visitor's email application addressed to
`info@velvetribbons.ca`. The visitor must send the composed email to complete
the enquiry. The destination Gmail inbox is not included in the website.

Before deploying this change, configure an email forwarding service to receive
mail for the domain and forward `info@velvetribbons.ca` to the intended private
Gmail inbox. Add the MX records supplied by that service in GoDaddy DNS, and
verify delivery to the alias. MX records alone do not define a forwarding rule.
Do not set an MX target to an email address or to gmail.com.

If the GoDaddy account has its Email Forwarding product, use Email & Office
Dashboard → Forwards → Add Forward. Otherwise an email hosting or forwarding
service is required. See [GoDaddy forwarding instructions](https://www.godaddy.com/en-ca/help/create-edit-or-delete-forwards-with-email-forwarding-42254).

This approach hides Gmail from website visitors; the public `info@` alias is
visible in the email composer. Replies sent directly from Gmail show that
Gmail address unless a separate send-as service is configured.
