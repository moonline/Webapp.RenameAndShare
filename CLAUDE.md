# CLAUDE.md

## Project

RenameAndShare is a static PWA with no build step, no package manager, and no dependencies beyond a locally vendored Bootstrap. Edit files directly and deploy by pushing to `main`.

Hosted at: https://moonline.github.io/Webapp.RenameAndShare/

## File structure

```
index.html                   # Single-page UI (Bootstrap dark theme)
manifest.json                # PWA manifest — defines share target and icons
service-worker.js            # Must stay at the project root (see constraints)
scripts/
  app.js                     # All application logic
dependencies/
  bootstrap-5.3.8/
    bootstrap.min.css
    bootstrap.min.js          # Non-bundle build (no Popper.js — not needed)
images/
  icon-rename-and-share-256.png
  icon-rename-and-share-512.png
```

## Architecture

The app intercepts Android share-sheet POST requests via the Web Share Target API, renames the file in the browser, and re-shares it using the Web Share API. No server, no upload, no credentials.

```
Share Target POST /share-target
  → service-worker.js intercepts
    → stores file blob in Cache API
      → redirects to /?incoming=1
        → app.js reads blob, shows rename UI
          → navigator.share() re-shares with new filename
```

## Key constraints

**`service-worker.js` must remain at the project root.**
The browser limits a service worker's default scope to its own directory. The share-target intercept must cover the root scope (`/Webapp.RenameAndShare/`) to handle incoming POST requests. Moving the file to `scripts/` would require the server to send a `Service-Worker-Allowed: /` header, which GitHub Pages does not support.

**All paths must be relative, not absolute.**
The app is deployed at the subpath `/Webapp.RenameAndShare/` on GitHub Pages. Absolute paths (e.g. `/service-worker.js`) resolve to the origin root and 404. Use `./` prefix or bare relative paths throughout — in `manifest.json`, `scripts/app.js`, and `service-worker.js`.

**`service-worker.js` derives `basePath` at runtime.**
`const basePath = new URL('.', self.location.href).pathname` resolves to `/Webapp.RenameAndShare/` on GitHub Pages and `/` on a custom domain. Use `basePath` for all pathname comparisons and redirects inside the service worker — never hardcode the deployment path.

## Coding style

- Indentation: **tabs**
- Variable names: **no abbreviations** — full descriptive names (e.g. `fileExtension` not `fileExt`, `statusElement` not `statusEl`)
- No inline scripts in HTML — logic lives in `scripts/app.js`
- No CDN links — Bootstrap is vendored locally in `dependencies/`

## Deployment

Push to `main` — GitHub Actions publishes to GitHub Pages automatically.

After deploying a change to `service-worker.js` or `manifest.json`, users must **reload the PWA twice** (or clear the service worker in DevTools) for the new worker to activate.
