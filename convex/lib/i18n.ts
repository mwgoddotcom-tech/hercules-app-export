// Must match DEFAULT_LOCALE in src/i18n.ts
export const DEFAULT_LOCALE = "en";

// Generic type for documents with translations
// K = the specific field names that can be translated (eg "name" | "description")
export type TranslatedDoc<K extends string> = {
  translations: Record<string, Partial<Record<K, string>>>;
};

// Resolves best matching locale from available translations
// Tries: exact match (fr-FR) → base locale (fr) → default (en) → first available
function resolveLocale<K extends string>(
  translations: Record<string, Partial<Record<K, string>>>,
  locale?: string | null,
): { locale: string; values: Partial<Record<K, string>> } {
  // Try exact match
  if (locale && translations[locale]) {
    return { locale, values: translations[locale] };
  }

  // Try base locale (fr from fr-FR)
  if (locale?.includes("-")) {
    const base = locale.substring(0, locale.indexOf("-"));
    if (translations[base]) {
      return { locale: base, values: translations[base] };
    }
  }

  // Try default locale
  if (translations[DEFAULT_LOCALE]) {
    return { locale: DEFAULT_LOCALE, values: translations[DEFAULT_LOCALE] };
  }

  // Use first available
  const [firstLocale, firstValues] = Object.entries(translations)[0] ?? [];
  return {
    locale: firstLocale ?? DEFAULT_LOCALE,
    values: (firstValues ?? {}) as Partial<Record<K, string>>,
  };
}

// Adds localized fields to a document
// K = the specific field names to extract (must be keys of the translations)
export function localizeFields<T extends TranslatedDoc<K>, K extends string>(
  doc: T,
  locale: string | null | undefined,
  fields: K[],
): T & { localeUsed: string } & Partial<Record<K, string>> {
  const { locale: localeUsed, values } = resolveLocale(doc.translations, locale);

  const patch: Record<string, unknown> = { localeUsed };
  for (const field of fields) {
    if (values[field] !== undefined) {
      patch[field] = values[field];
    }
  }

  return { ...doc, ...patch } as T & { localeUsed: string } & Partial<Record<K, string>>;
}
