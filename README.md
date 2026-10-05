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
The form posts to `/api/enquiry`; it does not launch an email application.
The Azure Function sends a plain-text email to a recipient stored in backend
application settings, with the visitor's email as Reply-To. Neither the
recipient nor credentials appear in the public HTML, JavaScript or API responses.

### Required private configuration before production deployment

In the Azure portal, open the Static Web App matching
`polite-bay-02cdf1710.7.azurestaticapps.net`, then Settings → Environment variables
(or Configuration / Application settings, depending on the portal view).
Add these settings for the production environment:

| Setting | Value |
| --- | --- |
| `CONTACT_TO` | The requested destination inbox |
| `SMTP_USER` | The Gmail account used to send, normally the same inbox |
| `SMTP_PASSWORD` | A Google app password for that account |
| `SMTP_HOST` | `smtp.gmail.com` (default; change for another SMTP provider) |
| `SMTP_PORT` | `465` (default; port 587 uses mandatory STARTTLS) |

For Gmail, the account owner must enable 2-Step Verification and create an app
password at https://myaccount.google.com/apppasswords. Store the app password
only in backend settings, never in source code, frontend settings, a PR or chat.
See [Google's app-password instructions](https://support.google.com/accounts/answer/185833).
For another SMTP service, use that service's authenticated sending account and
credentials; the destination inbox remains independently configurable.

The default accepted browser origins are the root domain, `www` and the
production Azure hostname. For a PR preview, set `CONTACT_ALLOWED_ORIGINS` in
that preview environment to its exact origin. This check and the honeypot
block basic browser/bot abuse; they are not a distributed rate limiter.

The workflow now deploys `api/` alongside `src/`. Do not deploy the new form to
production until email credentials are configured: otherwise submissions
correctly report a delivery failure instead of claiming success.

### Verification

Run `npm ci` and `npm test` inside `api/`. Tests cover validation, private
recipient routing, SMTP rejection/failure, secret redaction, public asset
privacy, and browser success/failure/duplicate submission behavior.

After configuring the production settings and deploying, submit an enquiry
through https://velvetribbons.ca and verify it reaches the requested inbox.
Repeat on https://www.velvetribbons.ca. Confirm Reply-To is the visitor's email.
A local test passing does not confirm live Gmail delivery.
