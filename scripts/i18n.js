let translations = {};

// ── Language detection ────────────────────────────────────────────────────────
function detectLanguage(availableLanguages) {
	// navigator.languages is an ordered list of the user's preferred languages
	const preferredLanguages = navigator.languages?.length
		? navigator.languages
		: [navigator.language || 'en'];

	for (const language of preferredLanguages) {
		const languageCode = language.split('-')[0].toLowerCase();
		if (availableLanguages.includes(languageCode)) {
			return languageCode;
		}
	}
	return 'en';
}

// ── Init ──────────────────────────────────────────────────────────────────────
export async function initializeTranslations() {
	const response = await fetch('translations/translations.json');
	const allTranslations = await response.json();

	const detectedLanguage = detectLanguage(Object.keys(allTranslations));
	translations = allTranslations[detectedLanguage] ?? allTranslations['en'];

	document.documentElement.lang = detectedLanguage;
}

// ── Translate ─────────────────────────────────────────────────────────────────
export function translate(key) {
	return translations[key] ?? key;
}

// ── Apply translations to DOM ─────────────────────────────────────────────────
// Elements with data-i18n get their textContent set.
// Elements with data-i18n-html get their innerHTML set (for labels with markup).
// Elements with data-i18n-placeholder get their placeholder attribute set.
export function applyTranslations() {
	document.querySelectorAll('[data-i18n]').forEach(element => {
		element.textContent = translate(element.dataset.i18n);
	});
	document.querySelectorAll('[data-i18n-html]').forEach(element => {
		element.innerHTML = translate(element.dataset.i18nHtml);
	});
	document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
		element.placeholder = translate(element.dataset.i18nPlaceholder);
	});
}
