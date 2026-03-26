// ── Service worker ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
	navigator.serviceWorker
		.register('/service-worker.js')
		.catch(console.error);
}

// ── DOM refs ──────────────────────────────────────────────────────────────────
const renameUiElement = document.getElementById('rename-ui');
const idleScreenElement = document.getElementById('idle-screen');
const originalNameElement = document.getElementById('original-name-display');
const dateInput = document.getElementById('date-input');
const customNameInput = document.getElementById('custom-name-input');
const composedPreviewElement = document.getElementById('preview-composed');
const freetextInput = document.getElementById('freetext-input');
const freetextPreviewElement = document.getElementById('preview-freetext');
const shareButton = document.getElementById('share-btn');
const resetButton = document.getElementById('reset-btn');
const statusElement = document.getElementById('status');
const composedTabButton = document.getElementById('tab-composed');
const freetextTabButton = document.getElementById('tab-freetext');

// ── State ─────────────────────────────────────────────────────────────────────
let sharedBlob = null;
let originalName = '';
let fileExtension = '';
let originalStem = '';

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayAsISODate() {
	// Returns YYYY-MM-DD in local time, as required by <input type="date">
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, '0');
	const day = String(today.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function isoDateToYYMMDD(isoDate) {
	if (!isoDate) return '';
	const [year, month, day] = isoDate.split('-');
	return year.slice(-2) + month + day;
}

function buildComposedFilename() {
	const datePart = isoDateToYYMMDD(dateInput.value);
	const customPart = customNameInput.value.trim();
	const parts = [datePart, customPart, originalStem].filter(Boolean);
	return parts.join('-') + fileExtension;
}

function buildFreetextFilename() {
	return freetextInput.value.trim();
}

function isComposedTabActive() {
	return composedTabButton.classList.contains('active');
}

function getActiveFilename() {
	return isComposedTabActive() ? buildComposedFilename() : buildFreetextFilename();
}

function updatePreviews() {
	const composedFilename = buildComposedFilename();
	composedPreviewElement.textContent = composedFilename || '—';

	const freetextFilename = buildFreetextFilename();
	freetextPreviewElement.textContent = freetextFilename || freetextInput.placeholder || '—';

	const activeFilename = isComposedTabActive() ? composedFilename : freetextFilename;
	shareButton.disabled = !activeFilename;
}

function resetInputs() {
	dateInput.value = todayAsISODate();
	customNameInput.value = '';
	freetextInput.value = '';
	freetextInput.placeholder = originalName;
	updatePreviews();
}

// When switching to freetext: use the current composed result (if any) as placeholder
freetextTabButton.addEventListener('show.bs.tab', () => {
	const composedFilename = buildComposedFilename();
	freetextInput.placeholder = composedFilename || originalName;
	updatePreviews();
});

// ── Load shared file from cache ───────────────────────────────────────────────
async function loadSharedFile() {
	if (!location.search.includes('incoming=1')) return false;

	try {
		const cache = await caches.open('rename-and-share-v1');
		const response = await cache.match('/shared-file');
		if (!response) return false;

		sharedBlob = await response.blob();
		originalName = decodeURIComponent(response.headers.get('X-File-Name') || 'file');

		const dotIndex = originalName.lastIndexOf('.');
		if (dotIndex > 0) {
			fileExtension = originalName.slice(dotIndex);
			originalStem = originalName.slice(0, dotIndex);
		} else {
			fileExtension = '';
			originalStem = originalName;
		}

		originalNameElement.textContent = originalName;
		await cache.delete('/shared-file');
		return true;
	} catch (error) {
		console.error('Failed to load shared file:', error);
		return false;
	}
}

// ── Share renamed file ────────────────────────────────────────────────────────
async function shareRenamed() {
	const newFilename = getActiveFilename();
	if (!newFilename || !sharedBlob) return;

	if (!navigator.canShare) {
		setStatus('Web Share API not supported in this browser.', 'text-danger');
		return;
	}

	const renamedFile = new File([sharedBlob], newFilename, { type: sharedBlob.type });

	if (!navigator.canShare({ files: [renamedFile] })) {
		setStatus('File sharing not supported in this browser.', 'text-danger');
		return;
	}

	try {
		setStatus('Opening share sheet…');
		await navigator.share({ files: [renamedFile] });
		setStatus('Shared successfully.', 'text-success');
	} catch (error) {
		if (error.name === 'AbortError') {
			setStatus('Share cancelled.');
		} else {
			setStatus('Share failed: ' + error.message, 'text-danger');
		}
	}
}

function setStatus(message, statusCssClass = 'text-body-secondary') {
	statusElement.textContent = message;
	statusElement.className = `text-center small mb-0 ${statusCssClass}`;
}

// ── Event listeners ───────────────────────────────────────────────────────────
dateInput.addEventListener('input', updatePreviews);
customNameInput.addEventListener('input', updatePreviews);
freetextInput.addEventListener('input', updatePreviews);
composedTabButton.addEventListener('shown.bs.tab', updatePreviews);
freetextTabButton.addEventListener('shown.bs.tab', updatePreviews);
shareButton.addEventListener('click', shareRenamed);
resetButton.addEventListener('click', resetInputs);

// ── Init ──────────────────────────────────────────────────────────────────────
async function initialize() {
	const fileWasShared = await loadSharedFile();
	if (fileWasShared) {
		renameUiElement.classList.remove('d-none');
		resetInputs();
		customNameInput.focus();
	} else {
		idleScreenElement.classList.remove('d-none');
		if (location.search.includes('error=no-file')) {
			setStatus('No file was received.', 'text-danger');
		}
	}
}

initialize();
