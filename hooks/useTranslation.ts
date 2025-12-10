import { useState, useEffect } from 'react';
import { translations, SupportedLanguage } from '../i18n/translations';

export const useTranslation = () => {
  const [lang, setLang] = useState<SupportedLanguage>('en');

  useEffect(() => {
    // Detect browser language
    // navigator.language returns 'en-US', 'es-ES', etc. We take the first part.
    const browserLang = navigator.language.split('-')[0];
    
    // Check if we support this language, otherwise fallback to 'en'
    const targetLang = (Object.keys(translations).includes(browserLang)) 
      ? browserLang as SupportedLanguage 
      : 'en';
      
    setLang(targetLang);
  }, []);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const langResources = translations[lang] || translations['en'];
    // Fallback chain: Selected Lang -> English -> Key itself
    let text = (langResources as any)[key] || (translations['en'] as any)[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v));
      });
    }
    return text;
  };

  return { t, lang };
};