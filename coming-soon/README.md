# Chronicle coming-soon page

Live: https://chronicle.vision/

Published 2026-11-18. A static holding page for the full Chronicle filmmaking product. No JavaScript, analytics, form processing or external runtime requests. Fonts are self-hosted; their OFL licenses are included alongside the font files.

## Files

- `public/`: the files served by Nginx.
- `nginx.conf`: the production virtual host, including HTTPS and canonical redirects.
- `PRODUCT.md`: product facts and the deliberately limited holding-page scope.
- `DESIGN.md`: the inherited palette, typography, composition and direction contract.

## Hosting

- DigitalOcean VPS: `root@159.65.56.146` using the existing SSH key.
- Document root: `/var/www/chronicle.vision`.
- Virtual host: `/etc/nginx/sites-available/chronicle.vision`, enabled through the matching symlink in `sites-enabled`.
- Backup and hashes of pre-existing site configurations: `/var/backups/chronicle.vision/20261118T124832Z`.
- Access and error logs: `/var/log/nginx/chronicle.vision.access.log` and `.error.log`.

## DNS

Managed by Dynadot DNS, TTL 5 minutes:

| Host | Type | Destination |
|---|---|---|
| @ | A | 159.65.56.146 |
| www | CNAME | chronicle.vision |

The registry delegation was verified at the .vision authoritative nameserver; the actual records were verified at Dynadot's authoritative nameserver. Ordinary public HTTPS and browser navigation were also verified after propagation.

## TLS

Let's Encrypt certificate covers `chronicle.vision` and `www.chronicle.vision`. Initial certificate expires 2027-02-16. Renewal is configured through the existing enabled `certbot.timer`, with webroot authentication and the per-certificate deploy hook `systemctl reload nginx`.

HTTP and HTTPS www requests redirect to `https://chronicle.vision`. HTTP ACME challenges remain reachable for renewals. Security headers include HSTS, a restrictive CSP, no-sniff, no-referrer and disabled camera/microphone/geolocation permissions.

Renewal check, run successfully on deployment:

```sh
ssh root@159.65.56.146 'certbot renew --cert-name chronicle.vision --dry-run --run-deploy-hooks --non-interactive'
```

## Updating the page

From this folder:

```sh
rsync -av public/ root@159.65.56.146:/var/www/chronicle.vision/
```

A content-only update needs no Nginx reload. Check any configuration change with `nginx -t` before reloading Nginx.

## Validation

An independent visual review returned **ship**, with no material findings for this narrow holding page. Local captures at 2560x1267 and 390x844 showed no overflow; contrast was checked. The live HTTPS page rendered in Chrome with its fonts loaded. External curl returned HTTP 200 with a trusted certificate using normal public DNS. HTTP and HTTPS www redirects returned 301 to the canonical origin. Certbot's scoped simulated renewal and deploy-hook test succeeded. SHA-256 checks confirmed that the pre-existing Nginx site configurations were unchanged.
