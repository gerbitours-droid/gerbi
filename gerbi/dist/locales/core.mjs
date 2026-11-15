// Dictionary area "core" (spec 21): brand, language switch, generic server errors shared by every area.
// Keys are prefixed "core.". Hebrew = the original text, character for character.
export default {
  he: {
    'core.brand': 'ג׳רבי טורס',
    'core.mascot': 'ג׳רבי',
    'core.lang.he': 'עברית',
    'core.lang.en': 'English',
    'core.lang.switch': 'שפה',
    'core.lang.toEn': 'Switch to English',
    'core.lang.toHe': 'מעבר לעברית',
    'core.inHebrew': 'בעברית',
    'core.err.generic': 'משהו השתבש. נסו שוב בעוד רגע.',
    'core.err.network': 'אין חיבור לשרת כרגע. בדקו את החיבור ונסו שוב.',
    'core.err.rate_limited': 'יותר מדי בקשות בזמן קצר. נסו שוב בעוד דקה.',
    'core.err.not_found': 'לא נמצא.',
    'core.err.payload_too_large': 'הבקשה ארוכה מדי.',
    'core.err.invalid_json': 'הבקשה לא תקינה.',
    'core.err.method_not_allowed': 'הפעולה לא נתמכת.',
    'core.err.timeout': 'הבקשה לקחה יותר מדי זמן. נסו שוב.'
  },
  en: {
    'core.brand': 'Gerbi Tours',
    'core.mascot': 'Gerbi',
    'core.lang.he': 'עברית',
    'core.lang.en': 'English',
    'core.lang.switch': 'Language',
    'core.lang.toEn': 'Switch to English',
    'core.lang.toHe': 'מעבר לעברית',
    'core.inHebrew': 'In Hebrew',
    'core.err.generic': 'Something went wrong. Please try again in a moment.',
    'core.err.network': 'We can’t reach the server right now. Check your connection and try again.',
    'core.err.rate_limited': 'Too many requests in a short time. Please try again in a minute.',
    'core.err.not_found': 'Not found.',
    'core.err.payload_too_large': 'That request is too long.',
    'core.err.invalid_json': 'That request isn’t valid.',
    'core.err.method_not_allowed': 'That action isn’t supported.',
    'core.err.timeout': 'The request took too long. Please try again.'
  }
};
