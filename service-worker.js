const CACHE_NAME = 'rename-and-share-v1';
const SHARED_FILE_KEY = '/shared-file';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', event => {
	const url = new URL(event.request.url);
	if (url.pathname === '/share-target' && event.request.method === 'POST') {
		event.respondWith(handleShareTarget(event.request));
		return;
	}
});

async function handleShareTarget(request) {
	const formData = await request.formData();
	const sharedFile = formData.get('file');

	if (!sharedFile) {
		return Response.redirect('/?error=no-file', 303);
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

	return Response.redirect('/?incoming=1', 303);
}
