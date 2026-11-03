import en from '../locales/back/en.json' with { type: 'json' }
import fr from '../locales/back/fr.json' with { type: 'json' }
import es from '../locales/back/es.json' with { type: 'json' }
import de from '../locales/back/de.json' with { type: 'json' }

type BackendLocale = 'en' | 'fr' | 'es' | 'de'
type BackendTranslationKey = keyof typeof en

const translations: Record<BackendLocale, typeof en> = { en, fr, es, de }

function getLocale(acceptLanguage: string | undefined): BackendLocale {
  const requestedLocale = acceptLanguage?.split(',')[0]?.split('-')[0]
  return requestedLocale && requestedLocale in translations
    ? (requestedLocale as BackendLocale)
    : 'en'
}

export function translateBackend(
  key: BackendTranslationKey,
  acceptLanguage: string | undefined,
) {
  return translations[getLocale(acceptLanguage)][key]
}
