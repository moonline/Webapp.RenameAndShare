const CACHE_NAME = 'rename-and-share-v1';
const SHARED_FILE_KEY = '/shared-file';

// Derive the base path from the service worker's own URL at runtime.
// This makes the worker work correctly regardless of the subpath the app
// is deployed at (e.g. / on a custom domain, or /Webapp.RenameAndShare/ on GitHub Pages).
// Example: if sw is at /Webapp.RenameAndShare/service-worker.js, basePath is '/Webapp.RenameAndShare/'
const basePath = new URL('.', self.location.href).pathname;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', event => {
	const url = new URL(event.request.url);
	if (url.pathname === `${basePath}share-target` && event.request.method === 'POST') {
		event.respondWith(handleShareTarget(event.request));
		return;
	}
});

async function handleShareTarget(request) {
	const formData = await request.formData();
	const sharedFile = formData.get('file');

	if (!sharedFile) {
		return Response.redirect(`${basePath}?error=no-file`, 303);
	}

	const cache = await caches.open(CACHE_NAME);
	await cache.put(
		SHARED_FILE_KEY,
		new Response(sharedFile, {
			headers: {
				'Content-Type': sharedFile.type || 'application/octet-stream',
				'X-File-Name': encodeURIComponent(sharedFile.name),
			},
		})
	);

	return Response.redirect(`${basePath}?incoming=1`, 303);
}
