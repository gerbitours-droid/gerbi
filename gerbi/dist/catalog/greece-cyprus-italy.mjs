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
  },
  {
    id: 'athens', code: 'ATH', airports: ['ATH'],
    name: { he: 'אתונה', en: 'Athens' }, country: { he: 'יוון', en: 'Greece' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'beach', 'nightlife', 'short_break', 'direct_flight', 'kosher', 'low_budget'],
    bestMonths: [3, 4, 5, 6, 9, 10, 11], flightHours: 2, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 150, mid: 280, high: 550 },
    summary: { he: 'בירה עתיקה במרחק שעתיים טיסה: האקרופוליס מעל העיר, סמטאות פלאקה, טברנות זולות ושפע חיי לילה — ועם הריביירה האתונאית אפשר לשלב גם ים.', en: 'An ancient capital two hours away: the Acropolis above the city, the lanes of Plaka, affordable tavernas and lively nights — and the Athens Riviera adds the sea.' },
    highlights: [
      { he: 'האקרופוליס והפרתנון', en: 'The Acropolis and the Parthenon' },
      { he: 'מוזיאון האקרופוליס', en: 'The Acropolis Museum' },
      { he: 'סמטאות פלאקה ומונסטירקי', en: 'The lanes of Plaka and Monastiraki' },
      { he: 'שקיעה מגבעת ליקבטוס', en: 'Sunset from Lycabettus Hill' },
      { he: 'חופי הריביירה האתונאית', en: 'The beaches of the Athens Riviera' },
      { he: 'מקדש פוסידון בכף סוניון', en: 'The Temple of Poseidon at Cape Sounion' },
      { he: 'סובלקי, מזה ואוזו בטברנות', en: 'Souvlaki, meze and ouzo in the tavernas' }
    ],
    areas: [
      { name: { he: 'פלאקה', en: 'Plaka' }, forWhom: { he: 'ביקור ראשון — מתחת לאקרופוליס והכול ברגל', en: 'First-timers — right below the Acropolis, all on foot' } },
      { name: { he: 'קוקאקי', en: 'Koukaki' }, forWhom: { he: 'זוגות ומשפחות — שקט יחסית, ליד מוזיאון האקרופוליס', en: 'Couples and families — calmer, next to the Acropolis Museum' } },
      { name: { he: 'מונסטירקי ופסירי', en: 'Monastiraki & Psyrri' }, forWhom: { he: 'צעירים ותקציב — ברים, אוכל רחוב ואווירה בלילה', en: 'Young travellers and budgets — bars, street food and nightlife' } },
      { name: { he: 'קולונאקי', en: 'Kolonaki' }, forWhom: { he: 'מי שאוהב שופינג, בתי קפה ושכונה אלגנטית', en: 'Shoppers and café lovers who like an elegant area' } },
      { name: { he: 'הריביירה — גליפדה וואולאגמני', en: 'The Riviera — Glyfada & Vouliagmeni' }, forWhom: { he: 'מי שרוצה ים ומלון חוף, עם חשמלית או מונית לעיר', en: 'Those who want the sea and a beach hotel, with a tram or taxi into town' } }
    ],
    attractions: [
      { name: { he: 'האקרופוליס', en: 'The Acropolis' }, kind: 'landmark', durationH: 2.5, tags: ['culture'], area: 'Plaka' },
      { name: { he: 'מוזיאון האקרופוליס', en: 'Acropolis Museum' }, kind: 'museum', durationH: 2, tags: ['culture', 'family'], area: 'Koukaki' },
      { name: { he: 'האגורה העתיקה', en: 'Ancient Agora' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Monastiraki & Psyrri' },
      { name: { he: 'המוזיאון הארכאולוגי הלאומי', en: 'National Archaeological Museum' }, kind: 'museum', durationH: 2.5, tags: ['culture'] },
      { name: { he: 'פלאקה ואנאפיוטיקה', en: 'Plaka & Anafiotika' }, kind: 'neighborhood', durationH: 2, tags: ['culture', 'food'], area: 'Plaka' },
      { name: { he: 'שוק הפשפשים במונסטירקי', en: 'Monastiraki Flea Market' }, kind: 'market', durationH: 1.5, tags: ['shopping'], area: 'Monastiraki & Psyrri' },
      { name: { he: 'גבעת ליקבטוס', en: 'Lycabettus Hill' }, kind: 'viewpoint', durationH: 1.5, tags: ['couple'], area: 'Kolonaki' },
      { name: { he: 'גבעת פילופאפוס', en: 'Philopappos Hill' }, kind: 'viewpoint', durationH: 1, tags: ['couple', 'nature'], area: 'Koukaki' },
      { name: { he: 'החלפת המשמר בכיכר סינטגמה', en: 'Changing of the guard at Syntagma Square' }, kind: 'experience', durationH: 0.5, tags: ['family'] },
      { name: { he: 'הגן הלאומי', en: 'National Garden' }, kind: 'park', durationH: 1, tags: ['family'] },
      { name: { he: 'האצטדיון הפנאתנאי', en: 'Panathenaic Stadium' }, kind: 'landmark', durationH: 1, tags: ['culture', 'family'] },
      { name: { he: 'המוזיאון היהודי של יוון', en: 'Jewish Museum of Greece' }, kind: 'museum', durationH: 1, tags: ['culture'], area: 'Plaka' },
      { name: { he: 'אגם וואולאגמני', en: 'Lake Vouliagmeni' }, kind: 'nature', durationH: 2.5, tags: ['relaxation', 'nature'], area: 'The Riviera — Glyfada & Vouliagmeni' }
    ],
    dayTrips: [
      { name: { he: 'כף סוניון — מקדש פוסידון', en: 'Cape Sounion — Temple of Poseidon' }, hours: 1.5, note: { he: 'נסיעה לאורך החוף; הכי יפה בשקיעה', en: 'A coastal drive; best at sunset' } },
      { name: { he: 'האי איגינה', en: 'Aegina island' }, hours: 1, note: { he: 'מעבורת מפיראוס; פיסטוקים, מקדש אפאיה וחופים קטנים', en: 'Ferry from Piraeus; pistachios, the Temple of Aphaia and small beaches' } },
      { name: { he: 'האי הידרה', en: 'Hydra island' }, hours: 2, note: { he: 'מעבורת מהירה; אי בלי מכוניות, נמל ציורי', en: 'Fast ferry; a car-free island with a picturesque harbour' } },
      { name: { he: 'דלפי', en: 'Delphi' }, hours: 2.5, note: { he: 'אתר האורקל בהרים; יום ארוך, עדיף בסיור מאורגן או ברכב', en: 'The oracle site in the mountains; a long day, best on a tour or by car' } }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו ישיר מהשדה למרכז (קו 3). במרכז הולכים ברגל; לריביירה יש חשמלית ואוטובוסים. רכב שווה רק לטיולי יום.', en: 'The metro runs straight from the airport to the centre (line 3). The centre is walkable; trams and buses reach the Riviera. A car is only worth it for day trips.' } },
    practical: {
      currency: 'EUR', language: { he: 'יוונית; אנגלית נפוצה מאוד', en: 'Greek; English widely spoken' }, timeZone: 'Europe/Athens',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'קהילה יהודית ובית חב״ד במרכז העיר, עם אפשרויות לאוכל כשר; כדאי לבדוק כשרות ולתאם מראש.', en: 'A Jewish community and a Chabad house in the centre, with kosher food options; check certification and arrange in advance.' },
      shabbat: { he: 'יש בתי כנסת במרכז; לינה בפלאקה, מונסטירקי או תיסיו מאפשרת להגיע ברגל. ארוחות שבת — לתאם עם חב״ד.', en: 'There are synagogues in the centre; staying in Plaka, Monastiraki or Thissio keeps them walkable. Arrange Shabbat meals with Chabad.' }
    },
    seasonsNote: { he: 'אביב וסתיו הכי נעימים לטיולים בעיר. יולי–אוגוסט חמים מאוד (בגלי חום האקרופוליס נסגר לפעמים בצהריים); החורף מתון וגשום מדי פעם.', en: 'Spring and autumn are best for sightseeing. July–August is very hot (in heatwaves the Acropolis sometimes closes at midday); winter is mild with occasional rain.' }
  },
  {
    id: 'crete', code: 'HER', airports: ['HER', 'CHQ'],
    name: { he: 'כרתים', en: 'Crete' }, country: { he: 'יוון', en: 'Greece' }, region: 'europe',
    tags: ['beach', 'family', 'nature', 'food', 'culture', 'adventure', 'direct_flight', 'all_inclusive'],
    bestMonths: [5, 6, 7, 8, 9, 10], flightHours: 2, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 150, mid: 280, high: 550 },
    summary: { he: 'האי הגדול ביוון: לגונות טורקיז, ערוצים להליכה, ארמון מינואי עתיק ועיירות נמל ונציאניות — מספיק גיוון לשבוע שלם, למשפחות ולזוגות.', en: 'Greece’s largest island: turquoise lagoons, gorges to hike, an ancient Minoan palace and Venetian harbour towns — variety enough for a full week, for families and couples.' },
    highlights: [
      { he: 'לגונת בלוס וחוף אלאפוניסי', en: 'Balos Lagoon and Elafonisi beach' },
      { he: 'הנמל הוונציאני והעיר העתיקה בחאניה', en: 'Chania’s Venetian harbour and old town' },
      { he: 'ארמון קנוסוס', en: 'The Palace of Knossos' },
      { he: 'הליכה בערוץ סמריה', en: 'Hiking the Samaria Gorge' },
      { he: 'האי ספינלונגה', en: 'Spinalonga island' },
      { he: 'המטבח הכרתי — שמן זית, דאקוס וראקי', en: 'Cretan food — olive oil, dakos and raki' }
    ],
    areas: [
      { name: { he: 'חאניה', en: 'Chania' }, forWhom: { he: 'זוגות ומי שרוצה עיר עתיקה יפה וקרבה לחופי המערב', en: 'Couples, and anyone wanting a pretty old town near the western beaches' } },
      { name: { he: 'הרקליון', en: 'Heraklion' }, forWhom: { he: 'בסיס עירוני ליד השדה, קנוסוס והמוזיאון', en: 'A city base near the airport, Knossos and the museum' } },
      { name: { he: 'רתימנו', en: 'Rethymno' }, forWhom: { he: 'באמצע האי — עיר עתיקה קטנה וחוף ארוך', en: 'Mid-island — a small old town and a long beach' } },
      { name: { he: 'אגיוס ניקולאוס ואלונדה', en: 'Agios Nikolaos & Elounda' }, forWhom: { he: 'משפחות ונופש במלונות חוף, חלקם הכול כלול', en: 'Families and beach-resort stays, some all-inclusive' } },
      { name: { he: 'חרסוניסוס ומאליה', en: 'Hersonissos & Malia' }, forWhom: { he: 'צעירים, חיי לילה ומלונות הכול כלול', en: 'Young travellers, nightlife and all-inclusive hotels' } }
    ],
    attractions: [
      { name: { he: 'ארמון קנוסוס', en: 'Palace of Knossos' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Heraklion' },
      { name: { he: 'המוזיאון הארכאולוגי של הרקליון', en: 'Heraklion Archaeological Museum' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Heraklion' },
      { name: { he: 'הנמל הוונציאני בחאניה', en: 'Chania Venetian harbour' }, kind: 'neighborhood', durationH: 2, tags: ['couple', 'food'], area: 'Chania' },
      { name: { he: 'בית הכנסת עץ חיים בחאניה', en: 'Etz Hayyim Synagogue, Chania' }, kind: 'religious', durationH: 0.5, tags: ['culture'], area: 'Chania' },
      { name: { he: 'ערוץ סמריה', en: 'Samaria Gorge' }, kind: 'nature', durationH: 7, tags: ['adventure', 'nature'] },
      { name: { he: 'לגונת בלוס', en: 'Balos Lagoon' }, kind: 'beach', durationH: 5, tags: ['beach', 'nature'] },
      { name: { he: 'חוף אלאפוניסי', en: 'Elafonisi beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'family'] },
      { name: { he: 'האי ספינלונגה', en: 'Spinalonga island' }, kind: 'landmark', durationH: 2.5, tags: ['culture', 'family'], area: 'Agios Nikolaos & Elounda' },
      { name: { he: 'העיר העתיקה של רתימנו ומבצר הפורטצה', en: 'Rethymno old town & Fortezza' }, kind: 'neighborhood', durationH: 2, tags: ['culture'], area: 'Rethymno' },
      { name: { he: 'חוף פרבלי', en: 'Preveli beach' }, kind: 'beach', durationH: 3, tags: ['beach', 'nature'] },
      { name: { he: 'מנזר ארקדי', en: 'Arkadi Monastery' }, kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'אגם קורנס', en: 'Lake Kournas' }, kind: 'nature', durationH: 1.5, tags: ['family', 'nature'] },
      { name: { he: 'האקווריום של כרתים', en: 'CretAquarium' }, kind: 'experience', durationH: 2, tags: ['family', 'with_children'] }
    ],
    dayTrips: [
      { name: { he: 'סנטוריני', en: 'Santorini' }, hours: 2, note: { he: 'מעבורת מהירה מהרקליון; יום ארוך אבל אפשרי', en: 'Fast ferry from Heraklion; a long but doable day' } },
      { name: { he: 'מטאלה והחוף הדרומי', en: 'Matala & the south coast' }, hours: 1.5, note: { he: 'מערות בצוק מעל מפרץ, ובדרך האתר העתיק פייסטוס', en: 'Cliff caves above a bay, with ancient Phaistos on the way' } }
    ],
    transport: { carRecommended: true, note: { he: 'האי גדול (בין הרקליון לחאניה כשעתיים וחצי נסיעה) והחופים היפים מרוחקים — רכב שכור הוא הדרך הנוחה. יש אוטובוסים בין הערים.', en: 'The island is big (about two and a half hours from Heraklion to Chania) and the best beaches are remote — a rental car is the easy option. Buses link the towns.' } },
    practical: {
      currency: 'EUR', language: { he: 'יוונית; אנגלית נפוצה מאוד', en: 'Greek; English widely spoken' }, timeZone: 'Europe/Athens',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'אין היצע כשר קבוע באי; בעונה פועלים לפעמים שירותי חב״ד — כדאי לבדוק מראש, או להביא ולתאם ארוחות ארוזות.', en: 'There is no regular kosher supply on the island; Chabad sometimes operates in season — check ahead, or bring or arrange packed meals.' },
      shabbat: { he: 'כדאי לבחור מלון שממנו הכול ברגל ולהצטייד מראש. בחאניה יש בית כנסת היסטורי.', en: 'Pick a hotel where everything is walkable and stock up in advance. Chania has a historic synagogue.' }
    },
    seasonsNote: { he: 'מאי–אוקטובר עונת החופים; יוני וספטמבר הכי מאוזנים. יולי–אוגוסט חמים ועמוסים. ערוץ סמריה פתוח בדרך כלל ממאי עד אוקטובר בלבד.', en: 'May–October is beach season; June and September are the best balance. July–August is hot and busy. The Samaria Gorge is usually open only from May to October.' }
  },
  {
    id: 'rhodes', code: 'RHO', airports: ['RHO'],
    name: { he: 'רודוס', en: 'Rhodes' }, country: { he: 'יוון', en: 'Greece' }, region: 'europe',
    tags: ['beach', 'family', 'culture', 'relaxation', 'short_break', 'direct_flight', 'low_budget', 'all_inclusive', 'water_slides'],
    bestMonths: [5, 6, 7, 8, 9, 10], flightHours: 1.5, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 140, mid: 260, high: 500 },
    summary: { he: 'אי שמש קרוב ומשתלם: עיר עתיקה מימי האבירים, חופים צלולים, מלונות הכול כלול ופארק מים — קלאסיקה לחופשה משפחתית או לסופ״ש ארוך.', en: 'A close, good-value sun island: a medieval Knights’ old town, clear beaches, all-inclusive hotels and a water park — a classic for a family holiday or a long weekend.' },
    highlights: [
      { he: 'העיר העתיקה ורחוב האבירים', en: 'The old town and the Street of the Knights' },
      { he: 'לינדוס והאקרופוליס מעל המפרץ', en: 'Lindos and its acropolis above the bay' },
      { he: 'מפרץ אנתוני קווין', en: 'Anthony Quinn Bay' },
      { he: 'בית הכנסת קהל שלום והרובע היהודי', en: 'Kahal Shalom Synagogue and the Jewish quarter' },
      { he: 'פארק המים בפלירקי', en: 'The water park at Faliraki' },
      { he: 'עמק הפרפרים', en: 'The Valley of the Butterflies' }
    ],
    areas: [
      { name: { he: 'העיר רודוס', en: 'Rhodes Town' }, forWhom: { he: 'זוגות ומי שרוצה עיר עתיקה, מסעדות וחיי לילה', en: 'Couples and anyone who wants the old town, restaurants and nightlife' } },
      { name: { he: 'פלירקי', en: 'Faliraki' }, forWhom: { he: 'צעירים ומשפחות — חוף ארוך ופארק מים', en: 'Young travellers and families — a long beach and the water park' } },
      { name: { he: 'לינדוס', en: 'Lindos' }, forWhom: { he: 'זוגות שמחפשים כפר לבן ורומנטי', en: 'Couples looking for a romantic whitewashed village' } },
      { name: { he: 'קולימביה', en: 'Kolymbia' }, forWhom: { he: 'משפחות במלונות הכול כלול, שקט יחסית', en: 'Families in all-inclusive hotels, relatively quiet' } },
      { name: { he: 'איקסיה ויאליסוס', en: 'Ixia & Ialysos' }, forWhom: { he: 'גלישת רוח ומלונות קרובים לעיר ולשדה', en: 'Windsurfing and hotels close to town and the airport' } }
    ],
    attractions: [
      { name: { he: 'העיר העתיקה של רודוס', en: 'Rhodes Old Town' }, kind: 'neighborhood', durationH: 3, tags: ['culture', 'shopping'], area: 'Rhodes Town' },
      { name: { he: 'ארמון המאסטר הגדול', en: 'Palace of the Grand Master' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Rhodes Town' },
      { name: { he: 'רחוב האבירים', en: 'Street of the Knights' }, kind: 'landmark', durationH: 0.5, tags: ['culture'], area: 'Rhodes Town' },
      { name: { he: 'בית הכנסת קהל שלום והמוזיאון היהודי', en: 'Kahal Shalom Synagogue & Jewish Museum of Rhodes' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Rhodes Town' },
      { name: { he: 'האקרופוליס של לינדוס', en: 'Acropolis of Lindos' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Lindos' },
      { name: { he: 'מפרץ פאולוס הקדוש', en: 'St Paul’s Bay' }, kind: 'beach', durationH: 3, tags: ['beach', 'couple'], area: 'Lindos' },
      { name: { he: 'מפרץ אנתוני קווין', en: 'Anthony Quinn Bay' }, kind: 'beach', durationH: 3, tags: ['beach'], area: 'Faliraki' },
      { name: { he: 'חוף צמביקה', en: 'Tsambika beach' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'Kolymbia' },
      { name: { he: 'פארק המים פלירקי', en: 'Faliraki Water Park' }, kind: 'experience', durationH: 4, tags: ['water_slides', 'family', 'with_children'], area: 'Faliraki' },
      { name: { he: 'עמק הפרפרים', en: 'Valley of the Butterflies' }, kind: 'nature', durationH: 1.5, tags: ['nature', 'family'] },
      { name: { he: 'שבעת המעיינות', en: 'Seven Springs' }, kind: 'nature', durationH: 1.5, tags: ['nature', 'family'], area: 'Kolymbia' },
      { name: { he: 'מעיינות קליתאה', en: 'Kallithea Springs' }, kind: 'landmark', durationH: 2, tags: ['beach', 'couple'], area: 'Faliraki' },
      { name: { he: 'גבעת פילרימוס', en: 'Filerimos Hill' }, kind: 'viewpoint', durationH: 1.5, tags: ['culture'], area: 'Ixia & Ialysos' }
    ],
    dayTrips: [
      { name: { he: 'האי סימי', en: 'Symi island' }, hours: 1.5, note: { he: 'מעבורת מהעיר רודוס; נמל צבעוני ומנזר פנורמיטיס', en: 'Ferry from Rhodes Town; a colourful harbour and Panormitis Monastery' } },
      { name: { he: 'טירת מונוליתוס והחוף המערבי', en: 'Monolithos Castle & the west coast' }, hours: 1.5, note: { he: 'ברכב; כפרים שקטים וטירה על סלע מעל הים', en: 'By car; quiet villages and a castle on a rock above the sea' } }
    ],
    transport: { carRecommended: true, note: { he: 'אוטובוסים מחברים את העיר ללינדוס ולחוף המזרחי, אבל רכב שכור לכמה ימים נותן חופש להגיע לחופים ולמפרצים.', en: 'Buses link the town with Lindos and the east coast, but a rental car for a few days frees you to reach the beaches and coves.' } },
    practical: {
      currency: 'EUR', language: { he: 'יוונית; אנגלית נפוצה מאוד', en: 'Greek; English widely spoken' }, timeZone: 'Europe/Athens',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'בעונה פועל בדרך כלל בית חב״ד עם ארוחות; כדאי לבדוק ולתאם מראש. מחוץ לעיר אין היצע כשר.', en: 'A Chabad house usually operates in season with meals; check and arrange in advance. There is no kosher supply outside town.' },
      shabbat: { he: 'מי ששומר שבת ירגיש הכי נוח בעיר רודוס, ליד העיר העתיקה; לתאם ארוחות מראש.', en: 'Shabbat observers are most comfortable in Rhodes Town near the old town; arrange meals in advance.' }
    },
    seasonsNote: { he: 'מאי–אוקטובר עונת החופים. יולי–אוגוסט חמים ועמוסים ויקרים יותר; יוני וספטמבר נעימים. בחורף הרבה מלונות סגורים.', en: 'May–October is beach season. July–August is hot, busy and pricier; June and September are pleasant. Many hotels close in winter.' }
  },
  {
    id: 'mykonos', code: 'JMK', airports: ['JMK'],
    name: { he: 'מיקונוס', en: 'Mykonos' }, country: { he: 'יוון', en: 'Greece' }, region: 'europe',
    tags: ['beach', 'nightlife', 'couple', 'luxury', 'food', 'short_break', 'direct_flight'],
    bestMonths: [5, 6, 7, 8, 9], flightHours: 2, direct: true, budgetLevel: 4, dailyBudgetIls: { low: 250, mid: 450, high: 900 },
    summary: { he: 'האי הכי מסיבתי בקיקלדים: סמטאות לבנות, טחנות רוח, שקיעות בוונציה הקטנה ומועדוני חוף עד הבוקר — יעד יוקרתי לזוגות ולחבר׳ה.', en: 'The Cyclades’ party island: white lanes, windmills, sunsets in Little Venice and beach clubs until dawn — an upmarket choice for couples and groups of friends.' },
    highlights: [
      { he: 'שקיעה בוונציה הקטנה', en: 'Sunset in Little Venice' },
      { he: 'טחנות הרוח מעל העיר', en: 'The windmills above town' },
      { he: 'סמטאות כורה, העיר הראשית', en: 'The lanes of Chora, the main town' },
      { he: 'מועדוני החוף בפרדייס וסופר פרדייס', en: 'The beach clubs at Paradise and Super Paradise' },
      { he: 'האי העתיק דלוס', en: 'The ancient island of Delos' },
      { he: 'מסעדות דגים על המים', en: 'Seafood restaurants on the water' }
    ],
    areas: [
      { name: { he: 'כורה (העיר)', en: 'Chora (Mykonos Town)' }, forWhom: { he: 'מי שרוצה הכול ברגל — מסעדות, ברים ושקיעה', en: 'Those who want everything on foot — restaurants, bars and sunsets' } },
      { name: { he: 'אורנוס', en: 'Ornos' }, forWhom: { he: 'משפחות וזוגות — מפרץ רגוע קרוב לעיר', en: 'Families and couples — a calm bay close to town' } },
      { name: { he: 'פלטיס יאלוס ופסרו', en: 'Platys Gialos & Psarou' }, forWhom: { he: 'חוף מסודר ומלונות יוקרה, עם סירות לחופים אחרים', en: 'Organised beaches and upmarket hotels, with boats to other beaches' } },
      { name: { he: 'אליה וקלפאס', en: 'Elia & Kalafatis' }, forWhom: { he: 'שקט יחסי וחופים ארוכים, צריך רכב', en: 'Relative quiet and long beaches; you need a car' } }
    ],
    attractions: [
      { name: { he: 'ונציה הקטנה', en: 'Little Venice' }, kind: 'neighborhood', durationH: 1.5, tags: ['couple', 'nightlife'], area: 'Chora (Mykonos Town)' },
      { name: { he: 'טחנות הרוח קאטו מילי', en: 'Kato Mili windmills' }, kind: 'landmark', durationH: 0.5, tags: ['couple'], area: 'Chora (Mykonos Town)' },
      { name: { he: 'כנסיית פרפורטיאני', en: 'Panagia Paraportiani church' }, kind: 'religious', durationH: 0.5, tags: ['culture'], area: 'Chora (Mykonos Town)' },
      { name: { he: 'האי דלוס', en: 'Delos archaeological site' }, kind: 'landmark', durationH: 4, tags: ['culture'] },
      { name: { he: 'חוף פרדייס', en: 'Paradise Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'nightlife'] },
      { name: { he: 'חוף סופר פרדייס', en: 'Super Paradise Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'nightlife'] },
      { name: { he: 'חוף פסרו', en: 'Psarou Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'luxury'], area: 'Platys Gialos & Psarou' },
      { name: { he: 'חוף אליה', en: 'Elia Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'relaxation'], area: 'Elia & Kalafatis' },
      { name: { he: 'חוף אורנוס', en: 'Ornos Beach' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'Ornos' },
      { name: { he: 'מגדלור ארמניסטיס', en: 'Armenistis Lighthouse' }, kind: 'viewpoint', durationH: 1, tags: ['couple'] },
      { name: { he: 'הכפר אנו מרה ומנזר טורליאני', en: 'Ano Mera village & Tourliani Monastery' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'המוזיאון הימי של הים האגאי', en: 'Aegean Maritime Museum' }, kind: 'museum', durationH: 1, tags: ['culture'], area: 'Chora (Mykonos Town)' }
    ],
    dayTrips: [
      { name: { he: 'האי טינוס', en: 'Tinos island' }, hours: 0.5, note: { he: 'מעבורת קצרה; כפרי שיש, יונים וכנסייה מפורסמת', en: 'A short ferry; marble villages, dovecotes and a famous church' } },
      { name: { he: 'האי פארוס', en: 'Paros island' }, hours: 1, note: { he: 'מעבורת מהירה; נאוסה ונמל דייגים', en: 'Fast ferry; Naoussa and its fishing harbour' } }
    ],
    transport: { carRecommended: false, note: { he: 'אוטובוסים מהעיר לחופים הדרומיים ומוניות ים בין המפרצים. רכב קטן או טרקטורון עוזרים לחופים הצפוניים; החניה בעיר קשה.', en: 'Buses run from town to the southern beaches, and sea taxis link the bays. A small car or quad helps for the northern beaches; parking in town is hard.' } },
    practical: {
      currency: 'EUR', language: { he: 'יוונית; אנגלית נפוצה מאוד', en: 'Greek; English widely spoken' }, timeZone: 'Europe/Athens',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'בקיץ פועל באי בית חב״ד עם ארוחות; כדאי לתאם מראש.', en: 'A Chabad house operates in summer with meals; arrange in advance.' },
      shabbat: { he: 'לינה בכורה מאפשרת שבת ברגל; לתאם ארוחות עם חב״ד.', en: 'Staying in Chora makes Shabbat walkable; arrange meals with Chabad.' }
    },
    seasonsNote: { he: 'יוני–ספטמבר שיא העונה והמסיבות; מאי ותחילת אוקטובר שקטים וזולים יותר. באוגוסט נושבות לעיתים רוחות חזקות (מלטמי). מנובמבר עד אפריל רוב העסקים סגורים.', en: 'June–September is peak season and party time; May and early October are quieter and cheaper. Strong meltemi winds often blow in August. From November to April most businesses close.' }
  },
  {
    id: 'cyprus', code: 'LCA', airports: ['LCA', 'PFO'],
    name: { he: 'קפריסין', en: 'Cyprus' }, country: { he: 'קפריסין', en: 'Cyprus' }, region: 'europe',
    tags: ['beach', 'family', 'relaxation', 'nightlife', 'short_break', 'direct_flight', 'low_budget', 'kosher', 'water_slides'],
    bestMonths: [4, 5, 6, 9, 10, 11], flightHours: 1, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 150, mid: 280, high: 550 },
    summary: { he: 'היעד הכי קרוב — פחות משעה טיסה: חופים צלולים באיה נאפה ופרוטרס, טיילות בלרנקה ובלימסול, עתיקות בפאפוס ונוכחות יהודית בכל עיר — מושלם לחופשה קצרה ולמשפחות.', en: 'The closest getaway — under an hour’s flight: clear beaches at Ayia Napa and Protaras, promenades in Larnaca and Limassol, antiquities in Paphos and a Jewish presence in every town — ideal for short breaks and families.' },
    highlights: [
      { he: 'חוף ניסי ואיה נאפה', en: 'Nissi Beach and Ayia Napa' },
      { he: 'כף גרקו ומערות הים', en: 'Cape Greco and its sea caves' },
      { he: 'טיילת פיניקודס בלרנקה', en: 'Finikoudes promenade in Larnaca' },
      { he: 'מרינת לימסול והעיר העתיקה', en: 'Limassol Marina and old town' },
      { he: 'הפסיפסים וקברי המלכים בפאפוס', en: 'The mosaics and Tombs of the Kings in Paphos' },
      { he: 'כפרי הרי טרודוס', en: 'The Troodos mountain villages' },
      { he: 'פארק המים ווטרוורלד', en: 'WaterWorld water park' }
    ],
    areas: [
      { name: { he: 'לרנקה', en: 'Larnaca' }, forWhom: { he: 'סופ״ש קצר — קרוב לשדה, טיילת וחב״ד', en: 'Short breaks — close to the airport, a promenade and Chabad' } },
      { name: { he: 'איה נאפה', en: 'Ayia Napa' }, forWhom: { he: 'צעירים — חופים ומסיבות', en: 'Young travellers — beaches and parties' } },
      { name: { he: 'פרוטרס', en: 'Protaras' }, forWhom: { he: 'משפחות — מפרצים רגועים ומלונות חוף', en: 'Families — calm bays and beach hotels' } },
      { name: { he: 'לימסול', en: 'Limassol' }, forWhom: { he: 'זוגות ומי שאוהב עיר, מסעדות ומרינה', en: 'Couples and city lovers — restaurants and a marina' } },
      { name: { he: 'פאפוס', en: 'Paphos' }, forWhom: { he: 'תרבות, עתיקות וטבע, קצב רגוע', en: 'Culture, antiquities and nature at a slower pace' } }
    ],
    attractions: [
      { name: { he: 'חוף ניסי', en: 'Nissi Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'nightlife'], area: 'Ayia Napa' },
      { name: { he: 'כף גרקו', en: 'Cape Greco' }, kind: 'nature', durationH: 2, tags: ['nature', 'adventure'] },
      { name: { he: 'מפרץ פיג טרי', en: 'Fig Tree Bay' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'Protaras' },
      { name: { he: 'פארק המים ווטרוורלד באיה נאפה', en: 'WaterWorld Ayia Napa' }, kind: 'experience', durationH: 5, tags: ['water_slides', 'family', 'with_children'], area: 'Ayia Napa' },
      { name: { he: 'טיילת פיניקודס', en: 'Finikoudes promenade' }, kind: 'neighborhood', durationH: 1.5, tags: ['food', 'family'], area: 'Larnaca' },
      { name: { he: 'כנסיית לזרוס הקדוש', en: 'Church of Saint Lazarus' }, kind: 'religious', durationH: 0.5, tags: ['culture'], area: 'Larnaca' },
      { name: { he: 'האגם המלוח של לרנקה והלה סולטן טקה', en: 'Larnaca Salt Lake & Hala Sultan Tekke' }, kind: 'nature', durationH: 1.5, tags: ['nature', 'culture'], area: 'Larnaca' },
      { name: { he: 'מרינת לימסול והנמל הישן', en: 'Limassol Marina & Old Port' }, kind: 'neighborhood', durationH: 2, tags: ['food', 'couple'], area: 'Limassol' },
      { name: { he: 'קוריון העתיקה', en: 'Ancient Kourion' }, kind: 'landmark', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'סלע אפרודיטה', en: 'Aphrodite’s Rock (Petra tou Romiou)' }, kind: 'viewpoint', durationH: 1, tags: ['couple'] },
      { name: { he: 'הפארק הארכאולוגי של פאפוס', en: 'Paphos Archaeological Park' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Paphos' },
      { name: { he: 'קברי המלכים', en: 'Tombs of the Kings' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Paphos' },
      { name: { he: 'מפרץ האלמוגים', en: 'Coral Bay' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'Paphos' }
    ],
    dayTrips: [
      { name: { he: 'הרי טרודוס', en: 'Troodos Mountains' }, hours: 1.5, note: { he: 'ברכב; כפרי הרים, מנזר קיקוס וטבע — ובחורף לפעמים שלג', en: 'By car; mountain villages, Kykkos Monastery and nature — sometimes snow in winter' } },
      { name: { he: 'חצי האי אקאמס והלגונה הכחולה', en: 'Akamas Peninsula & the Blue Lagoon' }, hours: 1, note: { he: 'מפאפוס או מפוליס; שייט או ג׳יפים', en: 'From Paphos or Polis; by boat or jeep' } },
      { name: { he: 'ניקוסיה', en: 'Nicosia' }, hours: 1, note: { he: 'הבירה — עיר עתיקה בתוך חומות ונציאניות', en: 'The capital — an old town inside Venetian walls' } }
    ],
    transport: { carRecommended: true, note: { he: 'נוהגים בצד שמאל. יש אוטובוסים בין הערים, אבל לחופים, לכף גרקו ולטרודוס הכי נוח ברכב שכור.', en: 'Driving is on the left. Intercity buses run, but a rental car is easiest for beaches, Cape Greco and Troodos.' } },
    practical: {
      currency: 'EUR', language: { he: 'יוונית; אנגלית נפוצה מאוד', en: 'Greek; English widely spoken' }, timeZone: 'Asia/Nicosia',
      visaNoteForIsraelis: { he: 'קפריסין חברה באיחוד האירופי. בדרך כלל אין צורך בוויזה לביקור קצר; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Cyprus is an EU member. Usually no visa is needed for a short visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'בתי חב״ד בלרנקה, לימסול, איה נאפה ופאפוס, וגם כמה מסעדות ומרכולים כשרים; כדאי לבדוק את תעודת הכשרות.', en: 'Chabad houses in Larnaca, Limassol, Ayia Napa and Paphos, plus several kosher restaurants and shops; check each one’s certification.' },
      shabbat: { he: 'יש בתי כנסת וארוחות שבת בערים הגדולות; כדאי ללון במרחק הליכה ולהירשם מראש.', en: 'Synagogues and Shabbat meals are available in the main towns; stay within walking distance and book ahead.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–נובמבר נעימים מאוד. יולי–אוגוסט חמים ולחים; החורף מתון ומתאים לעיר ולטרודוס, פחות לים.', en: 'April–June and September–November are very pleasant. July–August is hot and humid; winter is mild — good for towns and Troodos, less so for the sea.' }
  },
  {
    id: 'milan-lake-como', code: 'MIL', airports: ['MXP', 'LIN', 'BGY'],
    name: { he: 'מילאנו ואגם קומו', en: 'Milan & Lake Como' }, country: { he: 'איטליה', en: 'Italy' }, region: 'europe',
    tags: ['city', 'shopping', 'food', 'culture', 'couple', 'nature', 'short_break', 'direct_flight', 'kosher'],
    bestMonths: [4, 5, 6, 9, 10], flightHours: 4, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 350, high: 700 },
    summary: { he: 'בירת האופנה והעיצוב של איטליה, עם הדואומו, הסעודה האחרונה ושופינג ברמה גבוהה — ושעה ברכבת משם, הכפרים והווילות של אגם קומו.', en: 'Italy’s fashion and design capital, with the Duomo, The Last Supper and top-tier shopping — and an hour away by train, the villages and villas of Lake Como.' },
    highlights: [
      { he: 'הדואומו והטיול על הגג', en: 'The Duomo and its rooftop walk' },
      { he: 'הגלריה ויטוריו אמנואלה השני', en: 'Galleria Vittorio Emanuele II' },
      { he: '״הסעודה האחרונה״ של לאונרדו', en: 'Leonardo’s The Last Supper' },
      { he: 'רובע האופנה', en: 'The Fashion Quadrilateral' },
      { he: 'אפריטיבו לאורך תעלות הנבילי', en: 'Aperitivo along the Navigli canals' },
      { he: 'בלאג׳ו ווארנה על אגם קומו', en: 'Bellagio and Varenna on Lake Como' },
      { he: 'קהילה יהודית גדולה ואוכל כשר', en: 'A large Jewish community and kosher food' }
    ],
    areas: [
      { name: { he: 'מרכז — דואומו', en: 'Centro — Duomo' }, forWhom: { he: 'ביקור ראשון וקצר — הכול ברגל', en: 'Short first visits — all on foot' } },
      { name: { he: 'ברה', en: 'Brera' }, forWhom: { he: 'זוגות — גלריות, בתי קפה וסמטאות יפות', en: 'Couples — galleries, cafés and pretty streets' } },
      { name: { he: 'נבילי', en: 'Navigli' }, forWhom: { he: 'מי שאוהב ברים, אפריטיבו וחיי ערב', en: 'Those who love bars, aperitivo and evenings out' } },
      { name: { he: 'פורטה נואובה ואיזולה', en: 'Porta Nuova & Isola' }, forWhom: { he: 'מילאנו המודרנית, קרוב לתחנה המרכזית', en: 'Modern Milan, near Centrale station' } },
      { name: { he: 'אגם קומו — בלאג׳ו, ורנה או העיר קומו', en: 'Lake Como — Bellagio, Varenna or Como town' }, forWhom: { he: 'זוגות שרוצים לילה־שניים של נוף ושקט', en: 'Couples wanting a night or two of views and quiet' } }
    ],
    attractions: [
      { name: { he: 'הדואומו של מילאנו והגג', en: 'Milan Cathedral & rooftop' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'Centro — Duomo' },
      { name: { he: 'הגלריה ויטוריו אמנואלה השני', en: 'Galleria Vittorio Emanuele II' }, kind: 'landmark', durationH: 1, tags: ['shopping'], area: 'Centro — Duomo' },
      { name: { he: '״הסעודה האחרונה״ — סנטה מריה דלה גרציה', en: 'The Last Supper — Santa Maria delle Grazie' }, kind: 'museum', durationH: 0.5, tags: ['culture'] },
      { name: { he: 'טירת ספורצה', en: 'Sforza Castle' }, kind: 'museum', durationH: 2, tags: ['culture', 'family'] },
      { name: { he: 'פארק סמפיונה', en: 'Parco Sempione' }, kind: 'park', durationH: 1.5, tags: ['family'] },
      { name: { he: 'פינקוטקה די ברה', en: 'Pinacoteca di Brera' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Brera' },
      { name: { he: 'תיאטרון לה סקאלה והמוזיאון', en: 'La Scala theatre & museum' }, kind: 'museum', durationH: 1, tags: ['culture'], area: 'Centro — Duomo' },
      { name: { he: 'רובע האופנה', en: 'Quadrilatero della Moda' }, kind: 'neighborhood', durationH: 2, tags: ['shopping', 'luxury'], area: 'Centro — Duomo' },
      { name: { he: 'תעלות הנבילי', en: 'Navigli canals' }, kind: 'neighborhood', durationH: 2, tags: ['food', 'nightlife'], area: 'Navigli' },
      { name: { he: 'בוסקו ורטיקלה ופורטה נואובה', en: 'Bosco Verticale & Porta Nuova' }, kind: 'landmark', durationH: 1, tags: ['city'], area: 'Porta Nuova & Isola' },
      { name: { he: 'העיר קומו והרכבל לברונטה', en: 'Como town & the Brunate funicular' }, kind: 'viewpoint', durationH: 3, tags: ['nature', 'couple'], area: 'Lake Como — Bellagio, Varenna or Como town' },
      { name: { he: 'בלאג׳ו', en: 'Bellagio' }, kind: 'neighborhood', durationH: 3, tags: ['couple'], area: 'Lake Como — Bellagio, Varenna or Como town' },
      { name: { he: 'וילה דל בלביאנלו', en: 'Villa del Balbianello' }, kind: 'landmark', durationH: 1.5, tags: ['couple', 'culture'], area: 'Lake Como — Bellagio, Varenna or Como town' },
      { name: { he: 'ורנה', en: 'Varenna' }, kind: 'neighborhood', durationH: 2, tags: ['couple', 'nature'], area: 'Lake Como — Bellagio, Varenna or Como town' }
    ],
    dayTrips: [
      { name: { he: 'ברגמו העתיקה', en: 'Bergamo Città Alta' }, hours: 1, note: { he: 'ברכבת; עיר עליונה מוקפת חומות, עולים ברכבל', en: 'By train; a walled upper town reached by funicular' } },
      { name: { he: 'אגם גארדה — סירמיונה', en: 'Lake Garda — Sirmione' }, hours: 1.5, note: { he: 'רכבת לדזנצאנו ומשם אוטובוס או סירה', en: 'Train to Desenzano, then a bus or boat' } },
      { name: { he: 'אגם מאג׳ורה — סטרזה והאיים הבורומאים', en: 'Lake Maggiore — Stresa & the Borromean Islands' }, hours: 1, note: { he: 'ברכבת; ארמונות וגנים על איים', en: 'By train; palaces and gardens on islands' } },
      { name: { he: 'אאוטלט סרוואלה', en: 'Serravalle Designer Outlet' }, hours: 1, note: { he: 'לחובבי שופינג; יש שאטלים ממרכז העיר', en: 'For shoppers; shuttles run from the city centre' } }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו וחשמליות טובים בעיר; רכבת מהירה ממלפנסה למרכז. לאגם קומו מגיעים ברכבת ומשם במעבורות — רכב על כבישי האגם הצרים לא כדאי.', en: 'The metro and trams work well; an express train runs from Malpensa to the centre. Reach Lake Como by train and use the ferries — driving the narrow lake roads isn’t worth it.' } },
    practical: {
      currency: 'EUR', language: { he: 'איטלקית; אנגלית במקומות תיירותיים', en: 'Italian; English in tourist areas' }, timeZone: 'Europe/Rome',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'במילאנו קהילה יהודית גדולה, בית חב״ד, מסעדות ומעדניות כשרות; כדאי לבדוק את תעודת הכשרות. באגם קומו אין היצע — להצטייד.', en: 'Milan has a large Jewish community, Chabad, and kosher restaurants and delis; check each one’s certification. There is nothing at Lake Como — bring supplies.' },
      shabbat: { he: 'בתי כנסת רבים בעיר; כדאי ללון במרחק הליכה מבית כנסת ולתאם ארוחות מראש.', en: 'Plenty of synagogues in the city; stay within walking distance of one and arrange meals in advance.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–אוקטובר הכי נעימים, וגם עונת האגם. באוגוסט חם ועסקים רבים במילאנו סגורים לחופשה; החורף קר וערפילי, עם שווקי חג בדצמבר.', en: 'April–June and September–October are the most pleasant and the lake season. August is hot and many Milan businesses close for holidays; winter is cold and foggy, with festive markets in December.' }
  },
  {
    id: 'venice', code: 'VCE', airports: ['VCE'],
    name: { he: 'ונציה', en: 'Venice' }, country: { he: 'איטליה', en: 'Italy' }, region: 'europe',
    tags: ['city', 'culture', 'couple', 'food', 'short_break', 'direct_flight', 'kosher'],
    bestMonths: [4, 5, 6, 9, 10], flightHours: 3.5, direct: true, budgetLevel: 4, dailyBudgetIls: { low: 250, mid: 420, high: 800 },
    summary: { he: 'עיר על המים בלי מכוניות: תעלות, גשרים, ארמונות וכיכר סן מרקו, והגטו היהודי הראשון בעולם — יעד רומנטי קלאסי לשלושה–ארבעה לילות.', en: 'A car-free city on the water: canals, bridges, palaces and St Mark’s Square, plus the world’s first Jewish ghetto — a classic romantic trip of three or four nights.' },
    highlights: [
      { he: 'שייט וופורטו לאורך התעלה הגדולה', en: 'A vaporetto ride along the Grand Canal' },
      { he: 'כיכר סן מרקו והבזיליקה', en: 'St Mark’s Square and Basilica' },
      { he: 'ארמון הדוג׳ים וגשר האנחות', en: 'The Doge’s Palace and the Bridge of Sighs' },
      { he: 'הגטו היהודי — הראשון בעולם', en: 'The Jewish Ghetto — the world’s first' },
      { he: 'הזכוכית של מוראנו והבתים הצבעוניים בבוראנו', en: 'Murano glass and the colourful houses of Burano' },
      { he: 'צ׳יקטי ויין בבארים מקומיים', en: 'Cicchetti and wine in local bacari' }
    ],
    areas: [
      { name: { he: 'סן מרקו', en: 'San Marco' }, forWhom: { he: 'ביקור ראשון קצר — במרכז, אבל יקר ועמוס', en: 'A short first visit — central but pricey and crowded' } },
      { name: { he: 'קנאריג׳ו', en: 'Cannaregio' }, forWhom: { he: 'שומרי כשרות ושבת, ומי שרוצה אווירה מקומית', en: 'Kosher and Shabbat observers, and anyone after a local feel' } },
      { name: { he: 'דורסודורו', en: 'Dorsoduro' }, forWhom: { he: 'זוגות וחובבי אמנות — מוזיאונים ושקט יחסי', en: 'Couples and art lovers — museums and relative calm' } },
      { name: { he: 'קסטלו', en: 'Castello' }, forWhom: { he: 'ונציה שקטה ופחות תיירותית', en: 'A quieter, less touristy Venice' } },
      { name: { he: 'מסטרה', en: 'Mestre' }, forWhom: { he: 'תקציב — ביבשה, עשר דקות ברכבת לעיר', en: 'Budget — on the mainland, ten minutes by train' } }
    ],
    attractions: [
      { name: { he: 'כיכר סן מרקו', en: 'St Mark’s Square' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'San Marco' },
      { name: { he: 'בזיליקת סן מרקו', en: 'St Mark’s Basilica' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'San Marco' },
      { name: { he: 'ארמון הדוג׳ים', en: 'Doge’s Palace' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'San Marco' },
      { name: { he: 'מגדל הפעמונים של סן מרקו', en: 'St Mark’s Campanile' }, kind: 'viewpoint', durationH: 0.5, tags: ['couple'], area: 'San Marco' },
      { name: { he: 'גשר ריאלטו והשוק', en: 'Rialto Bridge & Market' }, kind: 'market', durationH: 1, tags: ['food'] },
      { name: { he: 'הגטו היהודי', en: 'The Jewish Ghetto' }, kind: 'neighborhood', durationH: 2, tags: ['culture', 'kosher'], area: 'Cannaregio' },
      { name: { he: 'גלריה האקדמיה', en: 'Gallerie dell’Accademia' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Dorsoduro' },
      { name: { he: 'אוסף פגי גוגנהיים', en: 'Peggy Guggenheim Collection' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Dorsoduro' },
      { name: { he: 'בזיליקת סנטה מריה דלה סלוטה', en: 'Santa Maria della Salute' }, kind: 'religious', durationH: 0.5, tags: ['culture'], area: 'Dorsoduro' },
      { name: { he: 'סקואולה גרנדה די סן רוקו', en: 'Scuola Grande di San Rocco' }, kind: 'museum', durationH: 1, tags: ['culture'] },
      { name: { he: 'סן ג׳ורג׳ו מאג׳ורה והמגדל', en: 'San Giorgio Maggiore & bell tower' }, kind: 'viewpoint', durationH: 1, tags: ['couple'] },
      { name: { he: 'שייט בגונדולה', en: 'Gondola ride' }, kind: 'experience', durationH: 0.5, tags: ['couple'] },
      { name: { he: 'קו וופורטו 1 בתעלה הגדולה', en: 'Vaporetto line 1 on the Grand Canal' }, kind: 'experience', durationH: 1, tags: ['family'] }
    ],
    dayTrips: [
      { name: { he: 'מוראנו ובוראנו', en: 'Murano & Burano' }, hours: 0.75, note: { he: 'בוופורטו; זכוכית במוראנו ובתים צבעוניים בבוראנו', en: 'By vaporetto; glassmaking on Murano, colourful houses on Burano' } },
      { name: { he: 'ורונה', en: 'Verona' }, hours: 1.25, note: { he: 'ברכבת; הארנה הרומית ו״המרפסת של ג׳ולייט״', en: 'By train; the Roman Arena and “Juliet’s balcony”' } },
      { name: { he: 'פדובה', en: 'Padua' }, hours: 0.5, note: { he: 'ברכבת; קפלת סקרובני ועיר אוניברסיטה', en: 'By train; the Scrovegni Chapel and a university town' } }
    ],
    transport: { carRecommended: false, note: { he: 'אין מכוניות — הולכים ברגל ונוסעים בוופורטו. מהשדה יש אוטובוס לפיאצלה רומא או סירה. כדאי מזוודה קלה: הרבה גשרים ומדרגות.', en: 'There are no cars — you walk and take the vaporetto. From the airport, take a bus to Piazzale Roma or a boat. Pack light: lots of bridges and steps.' } },
    practical: {
      currency: 'EUR', language: { he: 'איטלקית; אנגלית במקומות תיירותיים', en: 'Italian; English in tourist areas' }, timeZone: 'Europe/Rome',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'בגטו היהודי יש בית חב״ד ואפשרויות לאוכל כשר; כדאי לבדוק כשרות ולתאם ארוחות מראש.', en: 'The Jewish Ghetto has a Chabad house and kosher food options; check certification and arrange meals in advance.' },
      shabbat: { he: 'בתי כנסת היסטוריים בגטו; לינה בקנאריג׳ו מאפשרת שבת ברגל.', en: 'Historic synagogues in the Ghetto; staying in Cannaregio makes Shabbat walkable.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–אוקטובר הכי נעימים. בקיץ חם ועמוס מאוד; מנובמבר עד פברואר יש לפעמים הצפות (אקווה אלטה), ובפברואר — הקרנבל. בימים מסוימים נגבים דמי כניסה ממבקרי יום — כדאי לבדוק.', en: 'April–June and September–October are the most pleasant. Summer is hot and very crowded; from November to February there can be flooding (acqua alta), and February brings the Carnival. On certain days an access fee applies to day visitors — check ahead.' }
  },
  {
    id: 'florence-tuscany', code: 'FLR', airports: ['FLR', 'PSA'],
    name: { he: 'פירנצה וטוסקנה', en: 'Florence & Tuscany' }, country: { he: 'איטליה', en: 'Italy' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'couple', 'nature', 'shopping'],
    bestMonths: [4, 5, 6, 9, 10], flightHours: 6, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 350, high: 700 },
    summary: { he: 'ערש הרנסנס: הדואומו, אופיצי ופסל דוד בעיר שכולה ברגל — ומסביב גבעות טוסקנה, כרמים, עיירות מדיוואליות ואוכל פשוט ומעולה.', en: 'The cradle of the Renaissance: the Duomo, the Uffizi and David in a city made for walking — and all around, the Tuscan hills, vineyards, medieval towns and simple, superb food.' },
    highlights: [
      { he: 'הדואומו והכיפה של ברונלסקי', en: 'The Duomo and Brunelleschi’s dome' },
      { he: 'גלריית אופיצי', en: 'The Uffizi Gallery' },
      { he: 'פסל דוד של מיכלאנג׳לו', en: 'Michelangelo’s David' },
      { he: 'שקיעה מפיאצלה מיכלאנג׳לו', en: 'Sunset from Piazzale Michelangelo' },
      { he: 'כרמי קיאנטי וטעימות יין', en: 'Chianti vineyards and wine tastings' },
      { he: 'סיינה וסן ג׳ימיניאנו', en: 'Siena and San Gimignano' },
      { he: 'בית הכנסת הגדול של פירנצה', en: 'The Great Synagogue of Florence' }
    ],
    areas: [
      { name: { he: 'המרכז ההיסטורי', en: 'Historic centre' }, forWhom: { he: 'ביקור ראשון — הכול ברגל', en: 'First-timers — everything on foot' } },
      { name: { he: 'אולטרארנו וסנטו ספיריטו', en: 'Oltrarno & Santo Spirito' }, forWhom: { he: 'זוגות — סדנאות אומנים, טרטוריות ואווירה מקומית', en: 'Couples — artisan workshops, trattorias and a local feel' } },
      { name: { he: 'סנטה קרוצ׳ה וסנט׳אמברוג׳ו', en: 'Santa Croce & Sant’Ambrogio' }, forWhom: { he: 'קרוב לבית הכנסת ולשוק, חיי ערב', en: 'Near the synagogue and the market, lively evenings' } },
      { name: { he: 'אגריטוריזמו בקיאנטי', en: 'An agriturismo in Chianti' }, forWhom: { he: 'זוגות עם רכב שרוצים כרמים ושקט', en: 'Couples with a car who want vineyards and quiet' } },
      { name: { he: 'לוקה', en: 'Lucca' }, forWhom: { he: 'בסיס שקט בתוך חומות, קרוב לפיזה', en: 'A quiet walled base close to Pisa' } }
    ],
    attractions: [
      { name: { he: 'הדואומו והעלייה לכיפה', en: 'Florence Cathedral & dome climb' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Historic centre' },
      { name: { he: 'גלריית אופיצי', en: 'Uffizi Gallery' }, kind: 'museum', durationH: 3, tags: ['culture'], area: 'Historic centre' },
      { name: { he: 'גלריה האקדמיה — דוד', en: 'Galleria dell’Accademia — David' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Historic centre' },
      { name: { he: 'פונטה וקיו', en: 'Ponte Vecchio' }, kind: 'landmark', durationH: 0.5, tags: ['shopping'], area: 'Historic centre' },
      { name: { he: 'פיאצה דלה סיניוריה ופלאצו וקיו', en: 'Piazza della Signoria & Palazzo Vecchio' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Historic centre' },
      { name: { he: 'פיאצלה מיכלאנג׳לו', en: 'Piazzale Michelangelo' }, kind: 'viewpoint', durationH: 1, tags: ['couple'], area: 'Oltrarno & Santo Spirito' },
      { name: { he: 'ארמון פיטי וגני בובולי', en: 'Palazzo Pitti & Boboli Gardens' }, kind: 'park', durationH: 2.5, tags: ['culture', 'family'], area: 'Oltrarno & Santo Spirito' },
      { name: { he: 'בזיליקת סנטה קרוצ׳ה', en: 'Basilica of Santa Croce' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Santa Croce & Sant’Ambrogio' },
      { name: { he: 'בית הכנסת הגדול והמוזיאון היהודי', en: 'Great Synagogue & Jewish Museum' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Santa Croce & Sant’Ambrogio' },
      { name: { he: 'השוק המרכזי וסן לורנצו', en: 'Mercato Centrale & San Lorenzo market' }, kind: 'market', durationH: 1.5, tags: ['food', 'shopping'], area: 'Historic centre' },
      { name: { he: 'פיאצה דל קמפו בסיינה', en: 'Piazza del Campo, Siena' }, kind: 'landmark', durationH: 3, tags: ['culture'] },
      { name: { he: 'סן ג׳ימיניאנו', en: 'San Gimignano' }, kind: 'neighborhood', durationH: 2.5, tags: ['culture', 'couple'] },
      { name: { he: 'סיור יין בקיאנטי', en: 'Chianti wine tour' }, kind: 'experience', durationH: 5, tags: ['food', 'couple', 'nature'], area: 'An agriturismo in Chianti' }
    ],
    dayTrips: [
      { name: { he: 'פיזה ולוקה', en: 'Pisa & Lucca' }, hours: 1, note: { he: 'ברכבת; המגדל הנטוי וחומות לוקה באותו יום', en: 'By train; the Leaning Tower and Lucca’s walls in one day' } },
      { name: { he: 'סיינה', en: 'Siena' }, hours: 1.25, note: { he: 'אוטובוס ישיר; עיר מדיוואלית שלמה', en: 'Direct bus; an intact medieval city' } },
      { name: { he: 'צ׳ינקווה טרה', en: 'Cinque Terre' }, hours: 2.5, note: { he: 'ברכבת; חמישה כפרים צבעוניים על הצוק — יום ארוך', en: 'By train; five colourful cliffside villages — a long day' } },
      { name: { he: 'ואל ד׳אורצ׳ה', en: 'Val d’Orcia' }, hours: 2, note: { he: 'ברכב; הנופים המפורסמים של טוסקנה, פיינצה ומונטלצ׳ינו', en: 'By car; Tuscany’s famous landscapes, Pienza and Montalcino' } }
    ],
    transport: { carRecommended: true, note: { he: 'בפירנצה הולכים ברגל, ורכב בעיר אסור באזורי תנועה מוגבלת. לכפרי טוסקנה רכב שכור הוא הדרך הנוחה; לפיזה, לוקה וסיינה יש גם רכבות ואוטובוסים.', en: 'Florence is for walking, and cars are barred from its restricted traffic zones. For the Tuscan countryside a rental car is easiest; trains and buses also reach Pisa, Lucca and Siena.' } },
    practical: {
      currency: 'EUR', language: { he: 'איטלקית; אנגלית במקומות תיירותיים', en: 'Italian; English in tourist areas' }, timeZone: 'Europe/Rome',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'בפירנצה יש קהילה יהודית, בית חב״ד ומעט מקומות כשרים; כדאי לבדוק כשרות. בכפרי טוסקנה אין היצע — להצטייד.', en: 'Florence has a Jewish community, a Chabad house and a few kosher places; check certification. There is nothing in the Tuscan countryside — bring supplies.' },
      shabbat: { he: 'שבת נוחה בפירנצה, בלינה ליד בית הכנסת או במרכז; בכפרים צריך לתכנן ולהצטייד מראש.', en: 'Shabbat is easiest in Florence, staying near the synagogue or in the centre; in the countryside, plan and stock up ahead.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–אוקטובר מושלמים, והסתיו הוא גם עונת הבציר. יולי–אוגוסט חמים מאוד ועמוסים; בחורף פחות תיירים, אבל קריר וחלק מהכפרים רדומים.', en: 'April–June and September–October are ideal, and autumn is harvest time. July–August is very hot and crowded; winter has fewer tourists but is chilly and some villages go quiet.' }
  },
  {
    id: 'amalfi-naples', code: 'NAP', airports: ['NAP'],
    name: { he: 'נאפולי וחוף אמאלפי', en: 'Naples & the Amalfi Coast' }, country: { he: 'איטליה', en: 'Italy' }, region: 'europe',
    tags: ['beach', 'couple', 'food', 'culture', 'nature', 'luxury', 'direct_flight'],
    bestMonths: [4, 5, 6, 9, 10], flightHours: 3.5, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 220, mid: 400, high: 800 },
    summary: { he: 'נאפולי הסוערת עם הפיצה הכי טובה בעולם, פומפיי למרגלות הווזוב, ומשם הכביש המתפתל של חוף אמאלפי וקאפרי — שילוב של עתיקות, אוכל ונופי צוקים.', en: 'Lively Naples with the world’s best pizza, Pompeii at the foot of Vesuvius, and beyond them the winding Amalfi Coast road and Capri — antiquities, food and cliffside views in one trip.' },
    highlights: [
      { he: 'פיצה נפוליטנית במקום שבו נולדה', en: 'Neapolitan pizza where it was born' },
      { he: 'פומפיי והרקולנאום', en: 'Pompeii and Herculaneum' },
      { he: 'פוזיטנו, אמאלפי וראוולו', en: 'Positano, Amalfi and Ravello' },
      { he: 'קאפרי והמערה הכחולה', en: 'Capri and the Blue Grotto' },
      { he: 'עלייה ללוע הווזוב', en: 'Climbing to the crater of Vesuvius' },
      { he: 'שביל האלים מעל הים', en: 'The Path of the Gods above the sea' },
      { he: 'לימונצ׳לו ולימוני סורנטו', en: 'Limoncello and Sorrento lemons' }
    ],
    areas: [
      { name: { he: 'נאפולי — המרכז ההיסטורי', en: 'Naples — historic centre' }, forWhom: { he: 'אוהבי אוכל ועיר אמיתית, ותקציב נמוך יותר', en: 'Food lovers who like a real city, and lower budgets' } },
      { name: { he: 'סורנטו', en: 'Sorrento' }, forWhom: { he: 'משפחות — בסיס נוח עם רכבת ומעבורות לכל הכיוונים', en: 'Families — a handy base with trains and ferries everywhere' } },
      { name: { he: 'פוזיטנו', en: 'Positano' }, forWhom: { he: 'זוגות ויוקרה — הנוף המפורסם, הרבה מדרגות', en: 'Couples and luxury — the famous view, lots of steps' } },
      { name: { he: 'אמאלפי וראוולו', en: 'Amalfi & Ravello' }, forWhom: { he: 'מרכז החוף לנסיעות; ראוולו שקטה ורומנטית', en: 'Central for getting around; Ravello is quiet and romantic' } },
      { name: { he: 'קאפרי', en: 'Capri' }, forWhom: { he: 'לילה על האי, אחרי שהמבקרים היומיים עוזבים', en: 'A night on the island after the day-trippers leave' } }
    ],
    attractions: [
      { name: { he: 'פומפיי', en: 'Pompeii' }, kind: 'landmark', durationH: 4, tags: ['culture'] },
      { name: { he: 'הרקולנאום', en: 'Herculaneum' }, kind: 'landmark', durationH: 2.5, tags: ['culture'] },
      { name: { he: 'הר הווזוב', en: 'Mount Vesuvius' }, kind: 'nature', durationH: 2.5, tags: ['adventure', 'nature'] },
      { name: { he: 'המוזיאון הארכאולוגי הלאומי של נאפולי', en: 'Naples National Archaeological Museum' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Naples — historic centre' },
      { name: { he: 'ספקה־נאפולי והמרכז ההיסטורי', en: 'Spaccanapoli & the historic centre' }, kind: 'neighborhood', durationH: 2, tags: ['food', 'culture'], area: 'Naples — historic centre' },
      { name: { he: 'נאפולי התת־קרקעית', en: 'Napoli Sotterranea' }, kind: 'experience', durationH: 1.5, tags: ['culture', 'family'], area: 'Naples — historic centre' },
      { name: { he: 'קסטל דל אובו והטיילת', en: 'Castel dell’Ovo & the seafront' }, kind: 'landmark', durationH: 1, tags: ['couple'] },
      { name: { he: 'המערה הכחולה בקאפרי', en: 'Blue Grotto, Capri' }, kind: 'nature', durationH: 1, tags: ['nature'], area: 'Capri' },
      { name: { he: 'אנאקפרי והרכבל להר סולארו', en: 'Anacapri & the Monte Solaro chairlift' }, kind: 'viewpoint', durationH: 2, tags: ['couple', 'nature'], area: 'Capri' },
      { name: { he: 'שביל האלים', en: 'Path of the Gods' }, kind: 'nature', durationH: 3.5, tags: ['adventure', 'nature'] },
      { name: { he: 'פוזיטנו', en: 'Positano' }, kind: 'neighborhood', durationH: 2, tags: ['beach', 'couple'], area: 'Positano' },
      { name: { he: 'ראוולו — וילה רופולו ווילה צ׳ימברונה', en: 'Ravello — Villa Rufolo & Villa Cimbrone' }, kind: 'viewpoint', durationH: 2, tags: ['couple'], area: 'Amalfi & Ravello' },
      { name: { he: 'הקתדרלה של אמאלפי', en: 'Amalfi Cathedral' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Amalfi & Ravello' },
      { name: { he: 'הפיורד של פורורה', en: 'Fiordo di Furore' }, kind: 'nature', durationH: 0.5, tags: ['nature'] }
    ],
    dayTrips: [
      { name: { he: 'האי איסקיה', en: 'Ischia island' }, hours: 1, note: { he: 'מעבורת מנאפולי; מעיינות תרמיים וחופים', en: 'Ferry from Naples; thermal springs and beaches' } },
      { name: { he: 'האי פרוצ׳ידה', en: 'Procida island' }, hours: 0.75, note: { he: 'מעבורת מנאפולי; אי קטן עם נמל צבעוני', en: 'Ferry from Naples; a small island with a colourful harbour' } },
      { name: { he: 'פאסטום', en: 'Paestum' }, hours: 1.5, note: { he: 'מקדשים יווניים שמורים, ברכבת או ברכב', en: 'Well-preserved Greek temples, by train or car' } }
    ],
    transport: { carRecommended: false, note: { he: 'בנאפולי מטרו וכבלית; רכבת סירקומווזוביאנה לפומפיי ולסורנטו. על חוף אמאלפי אוטובוסים ומעבורות — הנהיגה בכביש הצר מלחיצה והחניה יקרה ונדירה.', en: 'Naples has a metro and funiculars; the Circumvesuviana train runs to Pompeii and Sorrento. On the Amalfi Coast use buses and ferries — driving the narrow road is stressful and parking scarce and costly.' } },
    practical: {
      currency: 'EUR', language: { he: 'איטלקית; אנגלית במקומות תיירותיים', en: 'Italian; English in tourist areas' }, timeZone: 'Europe/Rome',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'ההיצע הכשר מצומצם מאוד; בנאפולי יש קהילה יהודית קטנה ובית כנסת. כדאי להצטייד או לתאם ארוחות מראש.', en: 'Kosher food is very limited; Naples has a small Jewish community and a synagogue. Bring supplies or arrange meals in advance.' },
      shabbat: { he: 'הכי פשוט בנאפולי; על חוף אמאלפי צריך לבחור מלון שהכול בו ברגל ולהצטייד מראש.', en: 'Simplest in Naples; on the Amalfi Coast choose a hotel where everything is walkable and stock up ahead.' }
    },
    seasonsNote: { he: 'מאי–יוני וספטמבר–אוקטובר הכי טובים. יולי–אוגוסט חמים, עמוסים ויקרים; מנובמבר עד מרץ חלק מהמלונות על החוף סגורים והמעבורות מצטמצמות.', en: 'May–June and September–October are best. July–August is hot, crowded and pricey; from November to March many coastal hotels close and ferries are reduced.' }
  },
  {
    id: 'sicily', code: 'CTA', airports: ['CTA', 'PMO'],
    name: { he: 'סיציליה', en: 'Sicily' }, country: { he: 'איטליה', en: 'Italy' }, region: 'europe',
    tags: ['beach', 'food', 'culture', 'nature', 'adventure', 'couple', 'family', 'direct_flight', 'low_budget'],
    bestMonths: [4, 5, 6, 9, 10], flightHours: 3, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 170, mid: 300, high: 600 },
    summary: { he: 'האי הגדול בים התיכון: הר געש פעיל, מקדשים יווניים, ערי בארוק, שווקים צבעוניים וחופים — והאוכל הכי טוב באיטליה, במחירים נוחים יחסית.', en: 'The Mediterranean’s largest island: an active volcano, Greek temples, baroque towns, colourful markets and beaches — with some of Italy’s best food at relatively friendly prices.' },
    highlights: [
      { he: 'עלייה להר האטנה', en: 'Going up Mount Etna' },
      { he: 'טאורמינה והתיאטרון היווני', en: 'Taormina and its Greek theatre' },
      { he: 'עמק המקדשים באגריג׳נטו', en: 'The Valley of the Temples in Agrigento' },
      { he: 'אורטיג׳ה, העיר העתיקה של סירקוזה', en: 'Ortigia, Syracuse’s old town' },
      { he: 'השווקים של פלרמו', en: 'The markets of Palermo' },
      { he: 'קנולי, ארנצ׳יני וגרניטה', en: 'Cannoli, arancini and granita' }
    ],
    areas: [
      { name: { he: 'טאורמינה', en: 'Taormina' }, forWhom: { he: 'זוגות — נוף לים ולאטנה, אווירה רומנטית', en: 'Couples — views of the sea and Etna, a romantic feel' } },
      { name: { he: 'קטניה', en: 'Catania' }, forWhom: { he: 'בסיס עירוני ותקציבי, קרוב לשדה ולאטנה', en: 'A budget city base near the airport and Etna' } },
      { name: { he: 'סירקוזה — אורטיג׳ה', en: 'Syracuse — Ortigia' }, forWhom: { he: 'מי שרוצה עיר עתיקה על הים ואוכל טוב', en: 'Those who want an old town on the sea and good food' } },
      { name: { he: 'פלרמו', en: 'Palermo' }, forWhom: { he: 'אוהבי עיר, שווקים ותרבות', en: 'City, market and culture lovers' } },
      { name: { he: 'צ׳פאלו', en: 'Cefalù' }, forWhom: { he: 'משפחות — עיירת חוף עם חוף עירוני', en: 'Families — a seaside town with a town beach' } }
    ],
    attractions: [
      { name: { he: 'הר האטנה', en: 'Mount Etna' }, kind: 'nature', durationH: 5, tags: ['adventure', 'nature'] },
      { name: { he: 'התיאטרון היווני של טאורמינה', en: 'Teatro Antico di Taormina' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Taormina' },
      { name: { he: 'איזולה בלה', en: 'Isola Bella' }, kind: 'beach', durationH: 2, tags: ['beach', 'couple'], area: 'Taormina' },
      { name: { he: 'ערוצי אלקנטרה', en: 'Alcantara Gorges' }, kind: 'nature', durationH: 2, tags: ['nature', 'family'] },
      { name: { he: 'שוק הדגים וכיכר הדואומו בקטניה', en: 'Catania fish market & Piazza del Duomo' }, kind: 'market', durationH: 1.5, tags: ['food'], area: 'Catania' },
      { name: { he: 'אורטיג׳ה', en: 'Ortigia' }, kind: 'neighborhood', durationH: 3, tags: ['culture', 'food'], area: 'Syracuse — Ortigia' },
      { name: { he: 'הפארק הארכאולוגי נאפוליס בסירקוזה', en: 'Neapolis Archaeological Park, Syracuse' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Syracuse — Ortigia' },
      { name: { he: 'נוטו', en: 'Noto' }, kind: 'neighborhood', durationH: 2, tags: ['culture'] },
      { name: { he: 'עמק המקדשים', en: 'Valley of the Temples' }, kind: 'landmark', durationH: 3, tags: ['culture'] },
      { name: { he: 'סקאלה די טורקי', en: 'Scala dei Turchi' }, kind: 'viewpoint', durationH: 1, tags: ['nature'] },
      { name: { he: 'שוק באלארו בפלרמו', en: 'Ballarò market, Palermo' }, kind: 'market', durationH: 1.5, tags: ['food'], area: 'Palermo' },
      { name: { he: 'הקתדרלה של פלרמו', en: 'Palermo Cathedral' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Palermo' },
      { name: { he: 'הקתדרלה של מונריאלה', en: 'Monreale Cathedral' }, kind: 'religious', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'צ׳פאלו — העיר העתיקה והחוף', en: 'Cefalù old town & beach' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'Cefalù' }
    ],
    dayTrips: [
      { name: { he: 'האיים האאוליים — ליפארי וּוולקנו', en: 'Aeolian Islands — Lipari & Vulcano' }, hours: 2, note: { he: 'נסיעה למילאצו ומשם מעבורת; איים געשיים ובוץ חם', en: 'Drive to Milazzo, then a ferry; volcanic islands and hot mud' } },
      { name: { he: 'אריצ׳ה', en: 'Erice' }, hours: 1.5, note: { he: 'מפלרמו; עיירה מדיוואלית על הר מעל טרפאני', en: 'From Palermo; a medieval hilltop town above Trapani' } },
      { name: { he: 'שמורת צינגרו', en: 'Zingaro Nature Reserve' }, hours: 1.5, note: { he: 'מפלרמו; מסלול חוף ומפרצונים לרחצה', en: 'From Palermo; a coastal trail and coves for swimming' } }
    ],
    transport: { carRecommended: true, note: { he: 'האי גדול (מקטניה לפלרמו כשעתיים וחצי) והתחבורה הציבורית איטית — רכב שכור הוא הדרך הנוחה. בערים עצמן לא כדאי לנהוג.', en: 'The island is big (about two and a half hours from Catania to Palermo) and public transport is slow — a rental car is the easy option. Avoid driving inside the cities.' } },
    practical: {
      currency: 'EUR', language: { he: 'איטלקית; אנגלית בעיקר במקומות תיירותיים', en: 'Italian; English mainly in tourist areas' }, timeZone: 'Europe/Rome',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'אין כמעט היצע כשר מקומי; כדאי להצטייד או לתאם ארוחות ארוזות מראש.', en: 'There is almost no local kosher supply; bring or arrange packed meals in advance.' },
      shabbat: { he: 'כדאי לבחור מלון במרכז עיר שממנו הכול ברגל ולהצטייד מראש.', en: 'Pick a hotel in a town centre where everything is walkable, and stock up ahead.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–אוקטובר מושלמים לטיול ולים. יולי–אוגוסט חמים מאוד; בחורף מתון יחסית, ועל האטנה יורד שלג.', en: 'April–June and September–October are ideal for touring and the sea. July–August is very hot; winter is relatively mild, with snow on Etna.' }
  }
];
