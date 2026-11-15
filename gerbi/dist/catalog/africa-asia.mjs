// Catalog data (spec 23): Africa & Indian Ocean islands, Asia. Shape: dist/catalog.mjs.
// Budget figures are rough per-person-per-day estimates in ₪ without flights.
export default [
  {
    id: 'maldives', trip: 'maldives', code: 'MLE', airports: ['MLE'],
    name: { he: 'האיים המלדיביים', en: 'The Maldives' }, country: { he: 'המלדיביים', en: 'Maldives' }, region: 'asia',
    tags: ['beach', 'couple', 'relaxation', 'all_inclusive', 'luxury', 'nature', 'week_long'],
    bestMonths: [11, 12, 1, 2, 3, 4], flightHours: 8, direct: false, budgetLevel: 4, dailyBudgetIls: { low: 700, mid: 1600, high: 4000 },
    summary: { he: 'לגונות טורקיז, חול לבן ובקתות מעל המים — ריזורט על אי פרטי לחופשה של מנוחה, שנורקלינג וזמן זוגי.', en: 'Turquoise lagoons, white sand and overwater villas — a private-island resort for rest, snorkelling and time together.' },
    highlights: [
      { he: 'בקתה מעל המים', en: 'An overwater villa' },
      { he: 'שנורקלינג ושוניות אלמוגים', en: 'Snorkelling and coral reefs' },
      { he: 'שייט לצפייה בדולפינים', en: 'A dolphin-watching cruise' },
      { he: 'טיסה במטוס ימי מעל האטולים', en: 'A seaplane flight over the atolls' },
      { he: 'שקט מוחלט וספא', en: 'Total quiet and a spa' },
      { he: 'צלילה עם מנטות וכרישי לווייתן (בעונה)', en: 'Diving with mantas and whale sharks (in season)' }
    ],
    areas: [
      { name: { he: 'אטול מאלה הצפוני', en: 'North Malé Atoll' }, forWhom: { he: 'העברה קצרה בסירה מהשדה — טוב לחופשה קצרה', en: 'A short speedboat transfer — good for shorter stays' } },
      { name: { he: 'אטול מאלה הדרומי', en: 'South Malé Atoll' }, forWhom: { he: 'ריזורטים במרחק סירה, צלילה טובה', en: 'Resorts reached by speedboat, good diving' } },
      { name: { he: 'אטול ארי', en: 'Ari Atoll' }, forWhom: { he: 'צוללנים ושנורקלינג עם כרישי לווייתן — מטוס ימי', en: 'Divers and whale-shark snorkelling — by seaplane' } },
      { name: { he: 'אטול בא', en: 'Baa Atoll' }, forWhom: { he: 'שמורת ביוספרה, מנטות בעונה', en: 'A biosphere reserve, mantas in season' } },
      { name: { he: 'איים מקומיים (מאפושי ואחרים)', en: 'Local islands (Maafushi and others)' }, forWhom: { he: 'תקציב נמוך יותר — עם כללים מקומיים (למשל בלי אלכוהול)', en: 'Lower budgets — with local rules (e.g. no alcohol)' } }
    ],
    attractions: [
      { name: { he: 'שנורקלינג בשונית הבית של הריזורט', en: 'Snorkelling the resort’s house reef' }, kind: 'nature', durationH: 2, tags: ['beach', 'nature'] },
      { name: { he: 'שייט שקיעה עם דולפינים', en: 'Sunset dolphin cruise' }, kind: 'experience', durationH: 2, tags: ['couple'] },
      { name: { he: 'צלילה עם מנטות', en: 'Manta ray dive' }, kind: 'nature', durationH: 3, tags: ['adventure'] },
      { name: { he: 'שנורקלינג עם כרישי לווייתן בדרום ארי', en: 'Whale-shark snorkelling in South Ari' }, kind: 'nature', durationH: 4, tags: ['adventure', 'nature'] },
      { name: { he: 'גדת חול (Sandbank) לפיקניק', en: 'Sandbank picnic' }, kind: 'beach', durationH: 3, tags: ['couple', 'beach'] },
      { name: { he: 'טיסה נופית במטוס ימי', en: 'Scenic seaplane flight' }, kind: 'experience', durationH: 1, tags: ['luxury'] },
      { name: { he: 'דיג לילי מסורתי', en: 'Traditional night fishing' }, kind: 'experience', durationH: 2.5, tags: ['family'] },
      { name: { he: 'ספא מעל המים', en: 'Overwater spa' }, kind: 'experience', durationH: 2, tags: ['relaxation', 'luxury'] },
      { name: { he: 'סיור בעיר מאלה ובשוק הדגים', en: 'Malé city & fish market tour' }, kind: 'market', durationH: 2, tags: ['culture'] },
      { name: { he: 'קיאק ופאדל בלגונה', en: 'Kayak & paddleboard in the lagoon' }, kind: 'experience', durationH: 1.5, tags: ['adventure'] }
    ],
    dayTrips: [
      { name: { he: 'ביקור באי מקומי', en: 'A local-island visit' }, hours: 0.5, note: { he: 'הצצה לחיי הכפר; לבוש צנוע', en: 'A glimpse of village life; dress modestly' } }
    ],
    transport: { carRecommended: false, note: { he: 'מהשדה בהולהולה לריזורט בסירה מהירה או במטוס ימי (בתשלום נפרד). המטוס הימי טס רק באור יום, ונחיתה מאוחרת עלולה לחייב לילה במאלה.', en: 'From the airport to the resort by speedboat or seaplane (paid separately). Seaplanes fly only in daylight, so a late arrival may mean a night in Malé.' } },
    practical: {
      currency: 'USD', language: { he: 'דיבהי; אנגלית בריזורטים', en: 'Dhivehi; English at resorts' }, timeZone: 'Indian/Maldives',
      visaNoteForIsraelis: { he: 'מדיניות הכניסה לבעלי דרכון ישראלי השתנתה בעבר ועשויה להשתנות — חובה לבדוק במקורות הרשמיים לפני כל הזמנה.', en: 'Entry policy for Israeli passport holders has changed before and may change — always check official sources before booking.' },
      kosher: { he: 'אין כשרות מקומית; חלק מהריזורטים מסכימים לארוחות כשרות ארוזות בתיאום מראש.', en: 'No local kosher supply; some resorts accept pre-packed kosher meals by prior arrangement.' },
      shabbat: { he: 'בריזורט אין צורך בנסיעות — נוח לשבת; לתאם מראש נרות ואוכל.', en: 'No travel is needed at a resort — easy for Shabbat; arrange candles and food in advance.' }
    },
    seasonsNote: { he: 'נובמבר–אפריל: העונה היבשה והשקטה. מאי–אוקטובר: מונסון עם ממטרים, ים פחות צלול ומחירים נמוכים יותר.', en: 'November–April is the dry, calm season. May–October brings the monsoon: showers, less clear water and lower prices.' }
  }
];
