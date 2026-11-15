// Catalog data (spec 23): Greece, Cyprus, Italy. Shape and editorial rules: dist/catalog.mjs + docs/specs/23-destinations-catalog-he.md.
// Budget figures are rough per-person-per-day estimates in ₪ without flights.
export default [
  {
    id: 'santorini', trip: 'santorini', code: 'JTR', airports: ['JTR'],
    name: { he: 'סנטוריני', en: 'Santorini' }, country: { he: 'יוון', en: 'Greece' }, region: 'europe',
    tags: ['beach', 'couple', 'relaxation', 'short_break', 'direct_flight', 'luxury', 'food'],
    bestMonths: [5, 6, 9, 10], flightHours: 2.5, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 220, mid: 400, high: 750 },
    summary: { he: 'אי געשי עם כפרים לבנים על שפת מכתש ענק, שקיעות מפורסמות וחופים של חול שחור — יעד זוגי קלאסי במרחק טיסה קצרה.', en: 'A volcanic island of whitewashed villages on the rim of a vast caldera, famous sunsets and black-sand beaches — a classic couples’ escape a short flight away.' },
    highlights: [
      { he: 'שקיעה מעל הקלדרה באויה', en: 'Sunset over the caldera in Oia' },
      { he: 'מסלול ההליכה על המצוק מפירה לאויה', en: 'The clifftop walk from Fira to Oia' },
      { he: 'חופי חול שחור ואדום', en: 'Black- and red-sand beaches' },
      { he: 'שייט לאיים הגעשיים ולמעיינות החמים', en: 'A boat trip to the volcanic islets and hot springs' },
      { he: 'יקבים מקומיים ויין אסירטיקו', en: 'Local wineries and Assyrtiko wine' },
      { he: 'העיר הפרהיסטורית אקרוטירי', en: 'The prehistoric town of Akrotiri' }
    ],
    areas: [
      { name: { he: 'אויה', en: 'Oia' }, forWhom: { he: 'זוגות שרוצים את הנוף המפורסם ומוכנים לשלם עליו', en: 'Couples who want the famous view and will pay for it' } },
      { name: { he: 'פירה ופירוסטפני', en: 'Fira & Firostefani' }, forWhom: { he: 'מי שרוצה מרכז, מסעדות ותחבורה ציבורית', en: 'Those who want a central base, restaurants and buses' } },
      { name: { he: 'אימרוביגלי', en: 'Imerovigli' }, forWhom: { he: 'נוף לקלדרה בשקט יחסי', en: 'Caldera views with relative quiet' } },
      { name: { he: 'קמארי ופריסה', en: 'Kamari & Perissa' }, forWhom: { he: 'משפחות ומי שמעדיף חוף, בלי מדרגות ובמחיר נמוך יותר', en: 'Families and beach lovers — no steps and lower prices' } }
    ],
    attractions: [
      { name: { he: 'תצפית השקיעה בטירת אויה', en: 'Oia Castle sunset viewpoint' }, kind: 'viewpoint', durationH: 1.5, tags: ['couple'] },
      { name: { he: 'מסלול פירה–אויה', en: 'Fira–Oia hiking trail' }, kind: 'nature', durationH: 3.5, tags: ['adventure', 'nature'] },
      { name: { he: 'אקרוטירי', en: 'Akrotiri archaeological site' }, kind: 'landmark', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'החוף האדום', en: 'Red Beach' }, kind: 'beach', durationH: 2, tags: ['beach'] },
      { name: { he: 'חוף פריסה', en: 'Perissa Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'family'] },
      { name: { he: 'הכפר פירגוס', en: 'Pyrgos village' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'שייט לנאה קמני ולמעיינות החמים', en: 'Nea Kameni volcano & hot springs cruise' }, kind: 'experience', durationH: 5, tags: ['adventure'] },
      { name: { he: 'מוזיאון תרה הפרהיסטורית', en: 'Museum of Prehistoric Thera' }, kind: 'museum', durationH: 1, tags: ['culture'] },
      { name: { he: 'יקב ותצפית בסנטו', en: 'Santo Wines winery' }, kind: 'experience', durationH: 1.5, tags: ['food', 'couple'] },
      { name: { he: 'מגדלור אקרוטירי', en: 'Akrotiri Lighthouse' }, kind: 'viewpoint', durationH: 1, tags: ['couple'] },
      { name: { he: 'העתיקות של תרה העתיקה', en: 'Ancient Thera' }, kind: 'landmark', durationH: 2, tags: ['culture'] }
    ],
    dayTrips: [
      { name: { he: 'האי תרסיה', en: 'Thirasia island' }, hours: 0.5, note: { he: 'סירה מאמודי — כפר שקט עם נוף הפוך לקלדרה', en: 'A boat from Ammoudi — a quiet village looking back at the caldera' } },
      { name: { he: 'יום באיוס', en: 'A day on Ios' }, hours: 1, note: { he: 'מעבורת מהירה; חופים רחבים', en: 'Fast ferry; wide sandy beaches' } }
    ],
    transport: { carRecommended: false, note: { he: 'אוטובוסים יוצאים מפירה לכל הכפרים; רכב או טרקטורון נוחים לחופים, אבל החניה בכפרי המצוק קשה בקיץ.', en: 'Buses run from Fira to every village; a car or quad helps for beaches, but parking in the cliff villages is hard in summer.' } },
    practical: {
      currency: 'EUR', language: { he: 'יוונית; אנגלית נפוצה מאוד', en: 'Greek; English widely spoken' }, timeZone: 'Europe/Athens',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל מערכת ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'באי יש בית חב״ד פעיל בעונה עם ארוחות; כדאי לתאם מראש.', en: 'A Chabad house operates in season with meals; arrange in advance.' },
      shabbat: { he: 'אפשר לשבות בכפרי המצוק ברגל; לתאם ארוחות שבת עם חב״ד.', en: 'The cliff villages are walkable on Shabbat; arrange Shabbat meals with Chabad.' }
    },
    seasonsNote: { he: 'מאי–יוני וספטמבר–אוקטובר נעימים. יולי–אוגוסט חמים ועמוסים מאוד; מנובמבר עד מרץ חלק גדול מהעסקים סגור.', en: 'May–June and September–October are pleasant. July–August is hot and very crowded; from November to March many businesses close.' }
  },
  {
    id: 'rome', trip: 'rome', code: 'FCO', airports: ['FCO'],
    name: { he: 'רומא', en: 'Rome' }, country: { he: 'איטליה', en: 'Italy' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'couple', 'short_break', 'direct_flight', 'kosher', 'shopping'],
    bestMonths: [3, 4, 5, 6, 9, 10, 11], flightHours: 3.5, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 350, high: 650 },
    summary: { he: 'העיר הנצחית: אלפיים שנות היסטוריה בכל פינה, כיכרות ומזרקות, אוכל איטלקי אמיתי ורובע יהודי עתיק — טוב לסופ״ש ארוך או לשבוע.', en: 'The Eternal City: two thousand years of history on every corner, piazzas and fountains, real Italian food and an ancient Jewish quarter — great for a long weekend or a week.' },
    highlights: [
      { he: 'הקולוסיאום והפורום הרומי', en: 'The Colosseum and the Roman Forum' },
      { he: 'מוזיאוני הוותיקן והקפלה הסיסטינית', en: 'The Vatican Museums and the Sistine Chapel' },
      { he: 'הפנתאון, פיאצה נבונה ומזרקת טרווי', en: 'The Pantheon, Piazza Navona and the Trevi Fountain' },
      { he: 'הגטו היהודי והבית הכנסת הגדול', en: 'The Jewish Ghetto and the Great Synagogue' },
      { he: 'ערבים בטרסטוורה', en: 'Evenings in Trastevere' },
      { he: 'פסטה, פיצה וג׳לטו בכל רחוב', en: 'Pasta, pizza and gelato on every street' }
    ],
    areas: [
      { name: { he: 'המרכז ההיסטורי (פנתאון–נבונה)', en: 'Centro Storico (Pantheon–Navona)' }, forWhom: { he: 'ביקור ראשון — הכול ברגל', en: 'First-timers — everything on foot' } },
      { name: { he: 'טרסטוורה', en: 'Trastevere' }, forWhom: { he: 'זוגות שאוהבים מסעדות ואווירה בערב', en: 'Couples who love restaurants and evening buzz' } },
      { name: { he: 'מונטי', en: 'Monti' }, forWhom: { he: 'קרוב לקולוסיאום, שכונה צעירה עם בוטיקים', en: 'Near the Colosseum, a young area with boutiques' } },
      { name: { he: 'פראטי', en: 'Prati' }, forWhom: { he: 'משפחות — שקט יחסית וליד הוותיקן', en: 'Families — calmer and close to the Vatican' } },
      { name: { he: 'ליד טרמיני', en: 'Around Termini' }, forWhom: { he: 'תקציב ונוחות תחבורה, פחות אווירה', en: 'Budget and transport links, less charm' } }
    ],
    attractions: [
      { name: { he: 'הקולוסיאום', en: 'The Colosseum' }, kind: 'landmark', durationH: 2, tags: ['culture'] },
      { name: { he: 'הפורום הרומי והפלטינו', en: 'Roman Forum & Palatine Hill' }, kind: 'landmark', durationH: 2.5, tags: ['culture'] },
      { name: { he: 'מוזיאוני הוותיקן והקפלה הסיסטינית', en: 'Vatican Museums & Sistine Chapel' }, kind: 'museum', durationH: 3.5, tags: ['culture'] },
      { name: { he: 'בזיליקת פטרוס הקדוש', en: 'St Peter’s Basilica' }, kind: 'religious', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'הפנתאון', en: 'The Pantheon' }, kind: 'landmark', durationH: 0.5, tags: ['culture'] },
      { name: { he: 'מזרקת טרווי', en: 'Trevi Fountain' }, kind: 'landmark', durationH: 0.5, tags: ['couple'] },
      { name: { he: 'המדרגות הספרדיות', en: 'Spanish Steps' }, kind: 'landmark', durationH: 0.5, tags: ['shopping'] },
      { name: { he: 'הגטו היהודי והמוזיאון היהודי', en: 'Jewish Ghetto & Jewish Museum of Rome' }, kind: 'neighborhood', durationH: 2, tags: ['culture', 'kosher'] },
      { name: { he: 'גלריה בורגזה', en: 'Galleria Borghese' }, kind: 'museum', durationH: 2, tags: ['culture'] },
      { name: { he: 'גני וילה בורגזה', en: 'Villa Borghese gardens' }, kind: 'park', durationH: 2, tags: ['family'] },
      { name: { he: 'טרסטוורה', en: 'Trastevere' }, kind: 'neighborhood', durationH: 2, tags: ['food', 'nightlife'] },
      { name: { he: 'שוק קמפו דה פיורי', en: 'Campo de’ Fiori market' }, kind: 'market', durationH: 1, tags: ['food'] },
      { name: { he: 'תצפית ג׳יאניקולו', en: 'Gianicolo viewpoint' }, kind: 'viewpoint', durationH: 1, tags: ['couple'] }
    ],
    dayTrips: [
      { name: { he: 'פומפיי', en: 'Pompeii' }, hours: 2.5, note: { he: 'רכבת מהירה לנאפולי ומשם רכבת מקומית; יום ארוך', en: 'High-speed train to Naples, then a local train; a long day' } },
      { name: { he: 'טיבולי — וילה ד׳אסטה ווילה אדריאנה', en: 'Tivoli — Villa d’Este & Hadrian’s Villa' }, hours: 1, note: { he: 'גנים ומזרקות מרהיבים', en: 'Spectacular gardens and fountains' } },
      { name: { he: 'אוסטיה אנטיקה', en: 'Ostia Antica' }, hours: 0.7, note: { he: 'עיר נמל רומית שמורה, ברכבת מקומית', en: 'A preserved Roman port town, by local train' } },
      { name: { he: 'פירנצה', en: 'Florence' }, hours: 1.5, note: { he: 'ברכבת מהירה — אפשרי כיום אחד', en: 'By high-speed train — doable in a day' } }
    ],
    transport: { carRecommended: false, note: { he: 'הרבה הליכה, מטרו ואוטובוסים. מהשדה יש רכבת ישירה לטרמיני. רכב בעיר — לא כדאי (אזורי תנועה מוגבלת).', en: 'Lots of walking, metro and buses. A direct train links the airport to Termini. Don’t drive in the city (restricted traffic zones).' } },
    practical: {
      currency: 'EUR', language: { he: 'איטלקית; אנגלית במקומות תיירותיים', en: 'Italian; English in tourist areas' }, timeZone: 'Europe/Rome',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'בגטו היהודי יש מסעדות כשרות לא מעטות; כדאי לבדוק את תעודת הכשרות בכל מקום.', en: 'The Jewish Ghetto has a good number of kosher restaurants; check each one’s certification.' },
      shabbat: { he: 'קהילה יהודית ותיקה ובתי כנסת; לינה במרכז ההיסטורי מאפשרת להגיע ברגל.', en: 'An old Jewish community with synagogues; staying in the historic centre keeps them within walking distance.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–נובמבר נוחים. יולי–אוגוסט חמים מאוד ועמוסים; החורף מתון ושקט יותר.', en: 'April–June and September–November are comfortable. July–August is very hot and crowded; winter is mild and quieter.' }
  }
];
