import en from '../locales/front/en.json'
import fr from '../locales/front/fr.json'
import es from '../locales/front/es.json'
import de from '../locales/front/de.json'

export const supportedLocales = ['en', 'fr', 'es', 'de'] as const
export type Locale = (typeof supportedLocales)[number]
type TranslationKey = keyof typeof en

const translations: Record<Locale, typeof en> = { en, fr, es, de }

export function useTranslations() {
  const locale = useState<Locale>('locale', () => 'en')

  const t = (key: TranslationKey, params?: Record<string, string>) => {
    let value = translations[locale.value][key] ?? translations.en[key]
    for (const [param, replacement] of Object.entries(params ?? {})) {
      value = value.replace(`{${param}}`, replacement)
    }
    return value
  }

  return { locale, supportedLocales, t }
}
