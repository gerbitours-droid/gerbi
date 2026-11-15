// Catalog data (spec 23): Spain, Portugal, the Western Balkans. Shape and editorial rules: dist/catalog.mjs + docs/specs/23-destinations-catalog-he.md.
// Budget figures are rough per-person-per-day estimates in ₪ without flights.
const SCHENGEN_VISA = { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל מערכת ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' };

export default [
  {
    id: 'barcelona', code: 'BCN', airports: ['BCN'],
    name: { he: 'ברצלונה', en: 'Barcelona' }, country: { he: 'ספרד', en: 'Spain' }, region: 'europe',
    tags: ['city', 'beach', 'culture', 'food', 'nightlife', 'shopping', 'couple', 'short_break', 'direct_flight'],
    bestMonths: [4, 5, 6, 9, 10], flightHours: 4.5, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 350, high: 650 },
    summary: { he: 'עיר של גאודי, טאפאס וים: אדריכלות שאין כמוה בעולם, רובע גותי צפוף, שווקים וחוף עירוני — מושלם לסופ״ש ארוך או לשבוע.', en: 'Gaudí, tapas and the sea: one-of-a-kind architecture, a tightly packed Gothic Quarter, food markets and a city beach — perfect for a long weekend or a week.' },
    highlights: [
      { he: 'הסגרדה פמיליה ובנייני גאודי', en: 'The Sagrada Família and Gaudí’s buildings' },
      { he: 'סמטאות הרובע הגותי ואל בורן', en: 'The lanes of the Gothic Quarter and El Born' },
      { he: 'שוק לה בוקריה', en: 'La Boqueria market' },
      { he: 'חוף ברצלונטה וטיילת הים', en: 'Barceloneta beach and the seafront promenade' },
      { he: 'פארק גואל ונוף על העיר', en: 'Park Güell and views over the city' },
      { he: 'טאפאס וארוחות ערב מאוחרות', en: 'Tapas and late dinners' }
    ],
    areas: [
      { name: { he: 'אישמפלה', en: 'Eixample' }, forWhom: { he: 'ביקור ראשון — מרכזי, רחובות רחבים וקניות', en: 'First-timers — central, wide streets and shopping' } },
      { name: { he: 'הרובע הגותי ואל בורן', en: 'Gothic Quarter & El Born' }, forWhom: { he: 'מי שרוצה אווירה, ברים ומסעדות ליד הבית', en: 'Those who want atmosphere, bars and restaurants on the doorstep' } },
      { name: { he: 'גרסיה', en: 'Gràcia' }, forWhom: { he: 'זוגות שאוהבים כיכרות שכונתיות ותחושה מקומית', en: 'Couples who like neighbourhood squares and a local feel' } },
      { name: { he: 'ברצלונטה', en: 'Barceloneta' }, forWhom: { he: 'מי שבא בשביל הים, בקיץ', en: 'Beach-first summer visitors' } }
    ],
    attractions: [
      { name: { he: 'הסגרדה פמיליה', en: 'Sagrada Família' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'Eixample' },
      { name: { he: 'פארק גואל', en: 'Park Güell' }, kind: 'park', durationH: 2, tags: ['culture', 'family'] },
      { name: { he: 'קאסה באטיו', en: 'Casa Batlló' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Eixample' },
      { name: { he: 'קאסה מילה (לה פדררה)', en: 'Casa Milà (La Pedrera)' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Eixample' },
      { name: { he: 'הרובע הגותי', en: 'Gothic Quarter' }, kind: 'neighborhood', durationH: 2, tags: ['culture'], area: 'Gothic Quarter & El Born' },
      { name: { he: 'שוק לה בוקריה', en: 'La Boqueria market' }, kind: 'market', durationH: 1, tags: ['food'] },
      { name: { he: 'לה רמבלה', en: 'La Rambla' }, kind: 'neighborhood', durationH: 1, tags: ['shopping'] },
      { name: { he: 'מוזיאון פיקאסו', en: 'Picasso Museum' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Gothic Quarter & El Born' },
      { name: { he: 'חוף ברצלונטה', en: 'Barceloneta Beach' }, kind: 'beach', durationH: 3, tags: ['beach'], area: 'Barceloneta' },
      { name: { he: 'גבעת מונז׳ואיק', en: 'Montjuïc' }, kind: 'park', durationH: 3, tags: ['family', 'culture'] },
      { name: { he: 'תצפית הבונקרים (בונקרס דל כרמל)', en: 'Bunkers del Carmel viewpoint' }, kind: 'viewpoint', durationH: 1.5, tags: ['couple'] },
      { name: { he: 'טיבידאבו — פארק השעשועים והתצפית', en: 'Tibidabo amusement park & viewpoint' }, kind: 'experience', durationH: 3, tags: ['family', 'with_children'] },
      { name: { he: 'פלאו דה לה מוזיקה קטלאנה', en: 'Palau de la Música Catalana' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Gothic Quarter & El Born' }
    ],
    dayTrips: [
      { name: { he: 'מונסראט', en: 'Montserrat' }, hours: 1, note: { he: 'מנזר על הר סלעים מיוחד; רכבת ורכבל', en: 'A monastery on a striking rocky mountain; train and cable car' } },
      { name: { he: 'סיטג׳ס', en: 'Sitges' }, hours: 0.7, note: { he: 'עיירת חוף נעימה, ברכבת', en: 'A pleasant beach town, by train' } },
      { name: { he: 'ג׳ירונה', en: 'Girona' }, hours: 0.7, note: { he: 'עיר עתיקה ורובע יהודי היסטורי, ברכבת מהירה', en: 'An old town with a historic Jewish quarter, by high-speed train' } }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו טוב והרבה הליכה. מהשדה יש אוטובוס ישיר ורכבת. רכב רק לטיולים מחוץ לעיר.', en: 'A good metro and plenty of walking. A direct bus and a train run from the airport. A car only for trips out of town.' } },
    practical: {
      currency: 'EUR', language: { he: 'ספרדית וקטלאנית; אנגלית במקומות תיירותיים', en: 'Spanish and Catalan; English in tourist areas' }, timeZone: 'Europe/Madrid',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'יש קהילה יהודית, בית חב״ד וכמה מסעדות כשרות; כדאי לבדוק את תעודת הכשרות בכל מקום.', en: 'There is a Jewish community, a Chabad house and a few kosher restaurants; check each one’s certification.' },
      shabbat: { he: 'יש בתי כנסת בעיר; כדאי ללון במרחק הליכה ולתאם ארוחות שבת מראש.', en: 'The city has synagogues; stay within walking distance and arrange Shabbat meals in advance.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–אוקטובר הכי נעימים. יולי–אוגוסט חמים ועמוסים מאוד; החורף מתון ומתאים לעיר, לא לים.', en: 'April–June and September–October are the most pleasant. July–August is hot and very busy; winter is mild — fine for the city, not the beach.' }
  },
  {
    id: 'madrid', code: 'MAD', airports: ['MAD'],
    name: { he: 'מדריד', en: 'Madrid' }, country: { he: 'ספרד', en: 'Spain' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'nightlife', 'shopping', 'couple', 'direct_flight'],
    bestMonths: [3, 4, 5, 6, 9, 10, 11], flightHours: 5, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 180, mid: 320, high: 600 },
    summary: { he: 'בירת ספרד: מוזיאונים מהטובים בעולם, פארקים גדולים, שווקים ובארים שמתמלאים עד מאוחר בלילה — ובסיס מצוין לטולדו וסגוביה.', en: 'Spain’s capital: world-class museums, big parks, food markets and bars that stay full late into the night — and a great base for Toledo and Segovia.' },
    highlights: [
      { he: 'מוזיאון הפראדו', en: 'The Prado Museum' },
      { he: 'הארמון המלכותי', en: 'The Royal Palace' },
      { he: 'פארק רטירו', en: 'Retiro Park' },
      { he: 'פלאסה מאיור ושוק סן מיגל', en: 'Plaza Mayor and the San Miguel market' },
      { he: 'טאפאס בלה לטינה', en: 'Tapas in La Latina' },
      { he: 'טיול יום לטולדו', en: 'A day trip to Toledo' }
    ],
    areas: [
      { name: { he: 'סול ומרכז העיר', en: 'Sol & Centro' }, forWhom: { he: 'ביקור ראשון — הכול במרחק הליכה', en: 'First-timers — everything within walking distance' } },
      { name: { he: 'בריו דה לאס לטרס', en: 'Barrio de las Letras' }, forWhom: { he: 'זוגות — ליד המוזיאונים, עם מסעדות ואווירה', en: 'Couples — close to the museums, with restaurants and atmosphere' } },
      { name: { he: 'סלמנקה', en: 'Salamanca' }, forWhom: { he: 'קניות ושכונה מסודרת ושקטה יחסית', en: 'Shopping and a smart, relatively quiet district' } },
      { name: { he: 'מלסניה וצ׳ואקה', en: 'Malasaña & Chueca' }, forWhom: { he: 'צעירים וחיי לילה', en: 'Younger travellers and nightlife' } }
    ],
    attractions: [
      { name: { he: 'מוזיאון הפראדו', en: 'Museo del Prado' }, kind: 'museum', durationH: 3, tags: ['culture'], area: 'Barrio de las Letras' },
      { name: { he: 'מוזיאון ריינה סופיה', en: 'Museo Reina Sofía' }, kind: 'museum', durationH: 2, tags: ['culture'] },
      { name: { he: 'מוזיאון תיסן-בורנמיסה', en: 'Thyssen-Bornemisza Museum' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Barrio de las Letras' },
      { name: { he: 'הארמון המלכותי', en: 'Royal Palace of Madrid' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Sol & Centro' },
      { name: { he: 'פארק רטירו', en: 'Retiro Park' }, kind: 'park', durationH: 2, tags: ['family', 'couple'] },
      { name: { he: 'פלאסה מאיור', en: 'Plaza Mayor' }, kind: 'landmark', durationH: 0.5, tags: ['culture'], area: 'Sol & Centro' },
      { name: { he: 'שוק סן מיגל', en: 'Mercado de San Miguel' }, kind: 'market', durationH: 1, tags: ['food'], area: 'Sol & Centro' },
      { name: { he: 'פוארטה דל סול וגראן ויה', en: 'Puerta del Sol & Gran Vía' }, kind: 'neighborhood', durationH: 1.5, tags: ['shopping'], area: 'Sol & Centro' },
      { name: { he: 'מקדש דבוד בשקיעה', en: 'Temple of Debod at sunset' }, kind: 'viewpoint', durationH: 1, tags: ['couple'] },
      { name: { he: 'שוק הפשפשים אל ראסטרו (בימי ראשון)', en: 'El Rastro flea market (Sundays)' }, kind: 'market', durationH: 2, tags: ['shopping'] },
      { name: { he: 'אצטדיון סנטיאגו ברנבאו', en: 'Santiago Bernabéu Stadium' }, kind: 'experience', durationH: 1.5, tags: ['family'] },
      { name: { he: 'לה לטינה', en: 'La Latina' }, kind: 'neighborhood', durationH: 2, tags: ['food', 'nightlife'] }
    ],
    dayTrips: [
      { name: { he: 'טולדו', en: 'Toledo' }, hours: 0.5, note: { he: 'עיר עתיקה על גבעה עם בתי כנסת היסטוריים; ברכבת מהירה', en: 'A hilltop old town with historic synagogues; by high-speed train' } },
      { name: { he: 'סגוביה', en: 'Segovia' }, hours: 0.5, note: { he: 'אמת המים הרומית והאלקסר; ברכבת מהירה', en: 'The Roman aqueduct and the Alcázar; by high-speed train' } },
      { name: { he: 'אל אסקוריאל', en: 'El Escorial' }, hours: 1, note: { he: 'מנזר וארמון מלכותי ענק למרגלות ההרים', en: 'A vast royal monastery-palace at the foot of the mountains' } }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו מצוין, גם מהשדה. רכב לא נחוץ — לטולדו ולסגוביה נוסעים ברכבת.', en: 'An excellent metro, including from the airport. No car needed — take the train to Toledo and Segovia.' } },
    practical: {
      currency: 'EUR', language: { he: 'ספרדית; אנגלית חלקית', en: 'Spanish; some English' }, timeZone: 'Europe/Madrid',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'יש קהילה יהודית, בית חב״ד ומעט מסעדות כשרות; כדאי לבדוק את תעודת הכשרות ולתאם מראש.', en: 'There is a Jewish community, a Chabad house and a few kosher restaurants; check certification and plan ahead.' },
      shabbat: { he: 'יש בתי כנסת בעיר; כדאי ללון במרחק הליכה ולתאם ארוחות שבת מראש.', en: 'The city has synagogues; stay within walking distance and arrange Shabbat meals in advance.' }
    },
    seasonsNote: { he: 'אביב וסתיו הכי נעימים. יולי–אוגוסט חמים מאוד ויבשים; החורף קר בבקרים אבל לרוב שמשי.', en: 'Spring and autumn are the most pleasant. July–August is very hot and dry; winter mornings are cold but usually sunny.' }
  },
  {
    id: 'mallorca', code: 'PMI', airports: ['PMI'],
    name: { he: 'מיורקה', en: 'Mallorca' }, country: { he: 'ספרד', en: 'Spain' }, region: 'europe',
    tags: ['beach', 'family', 'couple', 'nature', 'relaxation', 'water_slides', 'nightlife'],
    bestMonths: [5, 6, 7, 8, 9, 10], flightHours: 6.5, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 350, high: 700 },
    summary: { he: 'האי הגדול באיים הבלאריים: מפרצונים עם מים טורקיז, הרים וכפרי אבן, ובירה עם קתדרלה מרשימה — טוב למשפחות ולזוגות כאחד.', en: 'The largest of the Balearic Islands: coves with turquoise water, mountains and stone villages, and a capital with an imposing cathedral — good for families and couples alike.' },
    highlights: [
      { he: 'מפרצונים קטנים עם מים צלולים', en: 'Small coves with crystal-clear water' },
      { he: 'קתדרלת פלמה והעיר העתיקה', en: 'Palma Cathedral and the old town' },
      { he: 'רכבת העץ לסויר', en: 'The vintage wooden train to Sóller' },
      { he: 'רכס טרמונטנה ונופי הצוקים בפורמנטור', en: 'The Tramuntana range and the cliffs of Formentor' },
      { he: 'מערות דראק', en: 'The Caves of Drach' },
      { he: 'כפרי ההרים ולדמוסה ודאייה', en: 'The mountain villages of Valldemossa and Deià' }
    ],
    areas: [
      { name: { he: 'פלמה', en: 'Palma' }, forWhom: { he: 'מי שרוצה עיר, מסעדות וחוף קרוב', en: 'Those who want a city, restaurants and a nearby beach' } },
      { name: { he: 'אלקודיה ונמל אלקודיה', en: 'Alcúdia & Port d’Alcúdia' }, forWhom: { he: 'משפחות — מפרץ רדוד וארוך', en: 'Families — a long, shallow bay' } },
      { name: { he: 'סויר ונמל סויר', en: 'Sóller & Port de Sóller' }, forWhom: { he: 'זוגות ומטיילים בהרים', en: 'Couples and mountain walkers' } },
      { name: { he: 'החוף הדרום-מזרחי (סנטניי וקאלה ד׳אור)', en: 'South-east coast (Santanyí & Cala d’Or)' }, forWhom: { he: 'מי שבא בשביל המפרצונים והשקט', en: 'Cove-hunters who want quiet' } }
    ],
    attractions: [
      { name: { he: 'קתדרלת פלמה (לה סאו)', en: 'Palma Cathedral (La Seu)' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Palma' },
      { name: { he: 'טירת בלבר', en: 'Bellver Castle' }, kind: 'viewpoint', durationH: 1.5, tags: ['culture'], area: 'Palma' },
      { name: { he: 'העיר העתיקה של פלמה', en: 'Palma old town' }, kind: 'neighborhood', durationH: 2, tags: ['culture', 'shopping', 'food'], area: 'Palma' },
      { name: { he: 'רכבת סויר', en: 'Sóller train' }, kind: 'experience', durationH: 3, tags: ['family'] },
      { name: { he: 'ולדמוסה', en: 'Valldemossa' }, kind: 'neighborhood', durationH: 2, tags: ['culture', 'couple'] },
      { name: { he: 'כף פורמנטור', en: 'Cap de Formentor' }, kind: 'viewpoint', durationH: 3, tags: ['nature'] },
      { name: { he: 'מערות דראק', en: 'Coves del Drac' }, kind: 'nature', durationH: 2, tags: ['family', 'nature'] },
      { name: { he: 'חוף אס טרנק', en: 'Es Trenc beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'relaxation'] },
      { name: { he: 'קאלו דס מורו', en: 'Caló des Moro' }, kind: 'beach', durationH: 2, tags: ['beach', 'couple'], area: 'South-east coast (Santanyí & Cala d’Or)' },
      { name: { he: 'הפארק הטבעי מונדראגו', en: 'Mondragó Natural Park' }, kind: 'nature', durationH: 3, tags: ['beach', 'nature', 'family'], area: 'South-east coast (Santanyí & Cala d’Or)' },
      { name: { he: 'פארק המים אקוולנד אל ארנל', en: 'Aqualand El Arenal water park' }, kind: 'experience', durationH: 5, tags: ['water_slides', 'with_children'] },
      { name: { he: 'מסלולי הליכה ברכס טרמונטנה', en: 'Serra de Tramuntana hiking' }, kind: 'nature', durationH: 4, tags: ['adventure', 'nature'] }
    ],
    dayTrips: [
      { name: { he: 'האי קבררה', en: 'Cabrera island' }, hours: 1, note: { he: 'שמורה ימית; סירה מקולוניה דה סנט ז׳ורדי, בעונה', en: 'A marine national park; boat from Colònia de Sant Jordi, in season' } },
      { name: { he: 'דאייה ונמל סויר', en: 'Deià & Port de Sóller' }, hours: 1, note: { he: 'כביש ההרים המפורסם — יום נוף בנסיעה', en: 'The famous mountain road — a scenic driving day' } }
    ],
    transport: { carRecommended: true, note: { he: 'רכב שכור הכי נוח למפרצונים ולכפרים. יש אוטובוסים בין הערים, אבל לחופים הקטנים הם לא מגיעים טוב. החניה במפרצונים מתמלאת בבוקר.', en: 'A hire car is easiest for the coves and villages. Buses link the towns but serve the small beaches poorly. Cove car parks fill up early.' } },
    practical: {
      currency: 'EUR', language: { he: 'ספרדית וקטלאנית; אנגלית וגרמנית נפוצות', en: 'Spanish and Catalan; English and German widely spoken' }, timeZone: 'Europe/Madrid',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'בפלמה פועל בית חב״ד; מחוץ לעיר אין כמעט אספקה כשרה. כדאי לתאם ארוחות מראש או להצטייד.', en: 'There is a Chabad house in Palma; outside the city kosher food is scarce. Arrange meals in advance or bring supplies.' },
      shabbat: { he: 'לשבת עדיף ללון בפלמה, קרוב לחב״ד; בשאר האי הכול מבוסס רכב.', en: 'For Shabbat, stay in Palma near Chabad; the rest of the island depends on a car.' }
    },
    seasonsNote: { he: 'יוני וספטמבר אידיאליים: ים חם ופחות עומס. יולי–אוגוסט חמים ועמוסים מאוד; מנובמבר עד מרץ האי שקט וחלק מאזורי החוף סגורים.', en: 'June and September are ideal: warm sea, fewer crowds. July–August is hot and packed; from November to March the island is quiet and some resort areas close.' }
  },
  {
    id: 'tenerife', code: 'TFS', airports: ['TFS'], hotelCity: 'TCI',
    name: { he: 'טנריפה', en: 'Tenerife' }, country: { he: 'ספרד (האיים הקנריים)', en: 'Spain (Canary Islands)' }, region: 'europe',
    tags: ['beach', 'nature', 'family', 'with_children', 'water_slides', 'adventure', 'relaxation', 'week_long'],
    bestMonths: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12], flightHours: 8.5, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 180, mid: 320, high: 600 },
    summary: { he: 'האי הגדול באיים הקנריים, מול חופי אפריקה: הר געש מושלג, חופים, פארק מים מהטובים בעולם ומזג אוויר נעים כמעט כל השנה — חופשה של שבוע ויותר.', en: 'The largest of the Canary Islands, off the coast of Africa: a snow-capped volcano, beaches, one of the world’s best water parks and pleasant weather almost all year — a holiday of a week or more.' },
    highlights: [
      { he: 'הפארק הלאומי טיידה והרכבל להר הגעש', en: 'Teide National Park and the cable car up the volcano' },
      { he: 'פארק המים סיאם פארק', en: 'Siam Park water park' },
      { he: 'שייט לצפייה בלווייתנים ודולפינים', en: 'Whale and dolphin watching by boat' },
      { he: 'צוקי לוס חיגנטס', en: 'The cliffs of Los Gigantes' },
      { he: 'הכפר מסקה בין ההרים', en: 'The mountain village of Masca' },
      { he: 'קיץ נעים גם בחורף', en: 'Mild, summery weather even in winter' }
    ],
    areas: [
      { name: { he: 'קוסטה אדחה', en: 'Costa Adeje' }, forWhom: { he: 'משפחות וזוגות — חופים, טיילת ושמש', en: 'Families and couples — beaches, promenade and sunshine' } },
      { name: { he: 'לוס כריסטיאנוס ופלאיה דה לאס אמריקס', en: 'Los Cristianos & Playa de las Américas' }, forWhom: { he: 'מי שרוצה הכול קרוב, כולל חיי לילה', en: 'Those who want everything close, nightlife included' } },
      { name: { he: 'פוארטו דה לה קרוס', en: 'Puerto de la Cruz' }, forWhom: { he: 'צפון ירוק ומקומי יותר, ליד לורו פארק', en: 'The greener, more local north, near Loro Parque' } }
    ],
    attractions: [
      { name: { he: 'הפארק הלאומי טיידה', en: 'Teide National Park' }, kind: 'nature', durationH: 5, tags: ['nature', 'adventure'] },
      { name: { he: 'רכבל הטיידה', en: 'Teide Cable Car' }, kind: 'viewpoint', durationH: 2, tags: ['nature', 'family'] },
      { name: { he: 'סיאם פארק', en: 'Siam Park' }, kind: 'experience', durationH: 6, tags: ['water_slides', 'with_children', 'family'], area: 'Costa Adeje' },
      { name: { he: 'לורו פארק', en: 'Loro Parque' }, kind: 'park', durationH: 5, tags: ['family', 'with_children'], area: 'Puerto de la Cruz' },
      { name: { he: 'צוקי לוס חיגנטס', en: 'Los Gigantes cliffs' }, kind: 'viewpoint', durationH: 2, tags: ['nature'] },
      { name: { he: 'מסקה', en: 'Masca' }, kind: 'neighborhood', durationH: 2, tags: ['nature'] },
      { name: { he: 'שייט לווייתנים ודולפינים', en: 'Whale & dolphin watching cruise' }, kind: 'experience', durationH: 3, tags: ['family', 'nature'] },
      { name: { he: 'פלאיה דל דוקה', en: 'Playa del Duque' }, kind: 'beach', durationH: 4, tags: ['beach', 'relaxation'], area: 'Costa Adeje' },
      { name: { he: 'חוף לאס טרסיטס', en: 'Playa de Las Teresitas' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'] },
      { name: { he: 'סן כריסטובל דה לה לגונה', en: 'San Cristóbal de La Laguna' }, kind: 'neighborhood', durationH: 2, tags: ['culture'] },
      { name: { he: 'הפארק הכפרי אנאגה', en: 'Anaga Rural Park' }, kind: 'nature', durationH: 4, tags: ['nature', 'adventure'] },
      { name: { he: 'גראצ׳יקו', en: 'Garachico' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture'] }
    ],
    dayTrips: [
      { name: { he: 'האי לה גומרה', en: 'La Gomera' }, hours: 1, note: { he: 'מעבורת מלוס כריסטיאנוס; יערות ועמקים ירוקים', en: 'Ferry from Los Cristianos; forests and green valleys' } }
    ],
    transport: { carRecommended: true, note: { he: 'רכב שכור כמעט הכרחי לטיידה, לצפון ולכפרים. יש אוטובוסים בין הערים הגדולות. הכבישים בהרים מתפתלים — לתכנן זמן.', en: 'A hire car is close to essential for Teide, the north and the villages. Buses link the main towns. Mountain roads are winding — allow time.' } },
    practical: {
      currency: 'EUR', language: { he: 'ספרדית; אנגלית נפוצה באזורי התיירות', en: 'Spanish; English widely spoken in resort areas' }, timeZone: 'Atlantic/Canary',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'אין כמעט אספקה כשרה מקומית; כדאי לבדוק מראש מול חב״ד באיים הקנריים או להביא אוכל ארוז.', en: 'There is almost no local kosher supply; check in advance with Chabad in the Canary Islands or bring packed food.' },
      shabbat: { he: 'דירה עם מטבח באזור הטיילת מאפשרת לשבות בלי רכב; ארוחות צריך לתכנן מראש.', en: 'An apartment with a kitchen near the promenade makes a car-free Shabbat possible; plan meals in advance.' }
    },
    seasonsNote: { he: 'הדרום שמשי ונעים כמעט כל השנה; בחורף הים קריר ובפסגת הטיידה יכול לרדת שלג. יולי–אוגוסט חמים יותר ועמוסים.', en: 'The south is sunny and mild almost all year; in winter the sea is cool and Teide’s summit can see snow. July–August is hotter and busier.' }
  },
  {
    id: 'lisbon', code: 'LIS', airports: ['LIS'],
    name: { he: 'ליסבון', en: 'Lisbon' }, country: { he: 'פורטוגל', en: 'Portugal' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'couple', 'beach', 'nightlife', 'direct_flight'],
    bestMonths: [4, 5, 6, 9, 10], flightHours: 5.5, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 150, mid: 280, high: 550 },
    summary: { he: 'עיר על שבע גבעות מעל נהר הטז׳ו: חשמליות צהובות, אריחי אזולז׳ו, תצפיות ומאפי פסטל דה נאטה — ובמרחק נסיעה קצרה סינטרה וחופי קשקאיש.', en: 'A city of seven hills above the Tagus: yellow trams, azulejo tiles, viewpoints and pastéis de nata — with Sintra and the beaches of Cascais a short ride away.' },
    highlights: [
      { he: 'החשמלית 28 בסמטאות אלפמה', en: 'Tram 28 through the lanes of Alfama' },
      { he: 'בלם: מנזר ז׳רונימוש ומגדל בלם', en: 'Belém: Jerónimos Monastery and Belém Tower' },
      { he: 'תצפיות (מירדורוש) על הגגות האדומים', en: 'Miradouros over the red rooftops' },
      { he: 'הארמונות של סינטרה', en: 'The palaces of Sintra' },
      { he: 'פסטל דה נאטה ודגים על הגריל', en: 'Pastéis de nata and grilled fish' },
      { he: 'ערב פאדו', en: 'An evening of fado' }
    ],
    areas: [
      { name: { he: 'באישה ושיאדו', en: 'Baixa & Chiado' }, forWhom: { he: 'ביקור ראשון — מרכזי ושטוח יחסית', en: 'First-timers — central and relatively flat' } },
      { name: { he: 'אלפמה', en: 'Alfama' }, forWhom: { he: 'זוגות שרוצים אווירה ותצפיות, ולא מפחדים ממדרגות', en: 'Couples after atmosphere and views, who don’t mind steps' } },
      { name: { he: 'פרינסיפה ריאל', en: 'Príncipe Real' }, forWhom: { he: 'שכונה שיקית עם מסעדות וגנים', en: 'A chic area with restaurants and gardens' } },
      { name: { he: 'פארק האומות', en: 'Parque das Nações' }, forWhom: { he: 'משפחות — מודרני, שטוח וליד האוקיינריום', en: 'Families — modern, flat and near the Oceanarium' } }
    ],
    attractions: [
      { name: { he: 'מנזר ז׳רונימוש', en: 'Jerónimos Monastery' }, kind: 'landmark', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'מגדל בלם', en: 'Belém Tower' }, kind: 'landmark', durationH: 1, tags: ['culture'] },
      { name: { he: 'מצודת סאו ז׳ורז׳', en: 'São Jorge Castle' }, kind: 'viewpoint', durationH: 1.5, tags: ['culture', 'family'], area: 'Alfama' },
      { name: { he: 'אלפמה', en: 'Alfama' }, kind: 'neighborhood', durationH: 2, tags: ['culture', 'couple'], area: 'Alfama' },
      { name: { he: 'החשמלית 28', en: 'Tram 28' }, kind: 'experience', durationH: 1, tags: ['family'] },
      { name: { he: 'האוקיינריום של ליסבון', en: 'Lisbon Oceanarium' }, kind: 'museum', durationH: 2.5, tags: ['family', 'with_children'], area: 'Parque das Nações' },
      { name: { he: 'פראסה דו קומרסיו', en: 'Praça do Comércio' }, kind: 'landmark', durationH: 0.5, tags: ['culture'], area: 'Baixa & Chiado' },
      { name: { he: 'באיירו אלטו', en: 'Bairro Alto' }, kind: 'neighborhood', durationH: 2, tags: ['nightlife', 'food'] },
      { name: { he: 'LX פקטורי', en: 'LX Factory' }, kind: 'market', durationH: 1.5, tags: ['shopping', 'food'] },
      { name: { he: 'שוק טיים אאוט (מרקדו דה ריביירה)', en: 'Time Out Market (Mercado da Ribeira)' }, kind: 'market', durationH: 1, tags: ['food'] },
      { name: { he: 'מוזיאון קלוסט גולבנקיאן', en: 'Calouste Gulbenkian Museum' }, kind: 'museum', durationH: 2, tags: ['culture'] },
      { name: { he: 'תצפית סניורה דו מונטה', en: 'Miradouro da Senhora do Monte' }, kind: 'viewpoint', durationH: 0.5, tags: ['couple'] }
    ],
    dayTrips: [
      { name: { he: 'סינטרה', en: 'Sintra' }, hours: 0.7, note: { he: 'ארמון פנה וארמונות ביער; ברכבת. להגיע מוקדם', en: 'Pena Palace and palaces in the forest; by train. Go early' } },
      { name: { he: 'קשקאיש', en: 'Cascais' }, hours: 0.7, note: { he: 'עיירת חוף ברכבת לאורך הים', en: 'A seaside town by a coastal train' } },
      { name: { he: 'אבורה', en: 'Évora' }, hours: 1.5, note: { he: 'עיר עתיקה מוקפת חומה באלנטז׳ו', en: 'A walled old town in the Alentejo' } }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו, חשמליות, רכבות לסינטרה ולקשקאיש והרבה הליכה בעליות. מהשדה יש מטרו. רכב בעיר לא כדאי.', en: 'Metro, trams, trains to Sintra and Cascais, and lots of uphill walking. The metro reaches the airport. Don’t drive in the city.' } },
    practical: {
      currency: 'EUR', language: { he: 'פורטוגזית; אנגלית נפוצה', en: 'Portuguese; English widely spoken' }, timeZone: 'Europe/Lisbon',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'יש קהילה יהודית ובית חב״ד; האפשרויות הכשרות מעטות — כדאי לתאם מראש ולבדוק תעודת כשרות.', en: 'There is a Jewish community and a Chabad house; kosher options are few — arrange in advance and check certification.' },
      shabbat: { he: 'יש בית כנסת ובית חב״ד; לינה במרכז מקלה, אבל העיר תלולה — לבחור מקום קרוב.', en: 'There is a synagogue and a Chabad house; staying central helps, but the city is steep — pick somewhere close.' }
    },
    seasonsNote: { he: 'אביב וסתיו מושלמים. הקיץ חם ועמוס אבל עם בריזה מהאוקיינוס; החורף מתון וגשום יותר. מי האוקיינוס קרירים גם באוגוסט.', en: 'Spring and autumn are ideal. Summer is hot and busy but with an ocean breeze; winter is mild and wetter. The Atlantic stays cool even in August.' }
  },
  {
    id: 'porto', code: 'OPO', airports: ['OPO'],
    name: { he: 'פורטו', en: 'Porto' }, country: { he: 'פורטוגל', en: 'Portugal' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'couple', 'low_budget'],
    bestMonths: [4, 5, 6, 7, 8, 9, 10], flightHours: 7.5, direct: false, budgetLevel: 2, dailyBudgetIls: { low: 140, mid: 260, high: 500 },
    summary: { he: 'עיר נהר ציורית בצפון פורטוגל: בתים צבעוניים מעל הדורו, גשר ברזל מרשים, מרתפי יין פורט ואוכל טוב במחירים נוחים.', en: 'A picturesque river city in northern Portugal: colourful houses above the Douro, a striking iron bridge, port-wine cellars and good food at fair prices.' },
    highlights: [
      { he: 'רובע ריביירה על גדת הדורו', en: 'The Ribeira quarter on the Douro' },
      { he: 'גשר דום לואיש הראשון', en: 'The Dom Luís I Bridge' },
      { he: 'מרתפי יין הפורט בווילה נובה דה גאיה', en: 'Port-wine cellars in Vila Nova de Gaia' },
      { he: 'תחנת סאו בנטו ואריחי האזולז׳ו', en: 'São Bento station and its azulejo tiles' },
      { he: 'טיול יום לעמק הדורו', en: 'A day trip to the Douro Valley' }
    ],
    areas: [
      { name: { he: 'ריביירה', en: 'Ribeira' }, forWhom: { he: 'זוגות שרוצים נוף לנהר ואווירה', en: 'Couples who want river views and atmosphere' } },
      { name: { he: 'המרכז (באישה)', en: 'Baixa' }, forWhom: { he: 'ביקור ראשון — הכי נוח להתנייד ברגל', en: 'First-timers — easiest base on foot' } },
      { name: { he: 'וילה נובה דה גאיה', en: 'Vila Nova de Gaia' }, forWhom: { he: 'נוף על העיר ומרתפי היין, שקט יותר בערב', en: 'Views of the city and the wine cellars, quieter at night' } },
      { name: { he: 'פוז דו דורו', en: 'Foz do Douro' }, forWhom: { he: 'מי שרוצה ים וטיילת, קצת מחוץ למרכז', en: 'Those who want the sea and a promenade, a little out of the centre' } }
    ],
    attractions: [
      { name: { he: 'רובע ריביירה', en: 'Ribeira' }, kind: 'neighborhood', durationH: 2, tags: ['culture', 'food'], area: 'Ribeira' },
      { name: { he: 'גשר דום לואיש הראשון', en: 'Dom Luís I Bridge' }, kind: 'landmark', durationH: 1, tags: ['couple'], area: 'Ribeira' },
      { name: { he: 'מרתפי הפורט בגאיה', en: 'Port wine cellars in Gaia' }, kind: 'experience', durationH: 1.5, tags: ['food', 'couple'], area: 'Vila Nova de Gaia' },
      { name: { he: 'תחנת הרכבת סאו בנטו', en: 'São Bento railway station' }, kind: 'landmark', durationH: 0.5, tags: ['culture'], area: 'Baixa' },
      { name: { he: 'ספריית ללו', en: 'Livraria Lello' }, kind: 'landmark', durationH: 0.5, tags: ['culture'], area: 'Baixa' },
      { name: { he: 'מגדל קלריגוש', en: 'Clérigos Tower' }, kind: 'viewpoint', durationH: 1, tags: ['culture'], area: 'Baixa' },
      { name: { he: 'ארמון הבורסה', en: 'Palácio da Bolsa' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Ribeira' },
      { name: { he: 'שייט ששת הגשרים', en: 'Six Bridges river cruise' }, kind: 'experience', durationH: 1, tags: ['family', 'couple'] },
      { name: { he: 'שוק בוליאו', en: 'Bolhão Market' }, kind: 'market', durationH: 1, tags: ['food'], area: 'Baixa' },
      { name: { he: 'מוזיאון ופארק סרלבש', en: 'Serralves Museum & Park' }, kind: 'museum', durationH: 2.5, tags: ['culture', 'family'] },
      { name: { he: 'בית הכנסת קדורי מקור חיים', en: 'Kadoorie Mekor Haim Synagogue' }, kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'תצפית ממנזר סרה דו פילאר', en: 'Serra do Pilar viewpoint' }, kind: 'viewpoint', durationH: 1, tags: ['couple'], area: 'Vila Nova de Gaia' }
    ],
    dayTrips: [
      { name: { he: 'עמק הדורו', en: 'Douro Valley' }, hours: 1.5, note: { he: 'טרסות כרמים ויקבים; ברכבת לפניאו או בסיור מאורגן', en: 'Terraced vineyards and wineries; by train to Pinhão or on a tour' } },
      { name: { he: 'גימראיש', en: 'Guimarães' }, hours: 1, note: { he: 'עיר עתיקה וטירה — ״ערש פורטוגל״', en: 'An old town and castle — ‘the cradle of Portugal’' } },
      { name: { he: 'ברגה', en: 'Braga' }, hours: 1, note: { he: 'כנסיות ומקדש בום ז׳זוס על הגבעה', en: 'Churches and the Bom Jesus sanctuary on the hill' } },
      { name: { he: 'אביירו', en: 'Aveiro' }, hours: 1, note: { he: 'תעלות וסירות צבעוניות, ברכבת', en: 'Canals and colourful boats, by train' } }
    ],
    transport: { carRecommended: false, note: { he: 'המרכז קומפקטי אבל תלול; יש מטרו (גם מהשדה) ורכבות לערים הסמוכות. רכב רק לעמק הדורו, אם בכלל.', en: 'The centre is compact but steep; a metro runs (including from the airport) and trains reach nearby towns. A car only for the Douro, if at all.' } },
    practical: {
      currency: 'EUR', language: { he: 'פורטוגזית; אנגלית נפוצה', en: 'Portuguese; English widely spoken' }, timeZone: 'Europe/Lisbon',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'יש קהילה יהודית ובית כנסת פעיל; האפשרויות הכשרות מוגבלות — כדאי לפנות לקהילה מראש.', en: 'There is a Jewish community and an active synagogue; kosher options are limited — contact the community in advance.' },
      shabbat: { he: 'לינה במרכז מאפשרת להגיע ברגל לבית הכנסת; ארוחות לתאם מראש.', en: 'Staying central puts the synagogue within walking distance; arrange meals in advance.' }
    },
    seasonsNote: { he: 'מאי–ספטמבר הכי נעימים ויבשים. החורף גשום וקריר; גם בקיץ הערבים ליד האוקיינוס יכולים להיות קרירים.', en: 'May–September is the most pleasant and dry. Winter is rainy and cool; even in summer, evenings by the ocean can be chilly.' }
  },
  {
    id: 'madeira', code: 'FNC', airports: ['FNC'],
    name: { he: 'מדיירה', en: 'Madeira' }, country: { he: 'פורטוגל', en: 'Portugal' }, region: 'europe',
    tags: ['nature', 'adventure', 'couple', 'relaxation', 'week_long'],
    bestMonths: [4, 5, 6, 7, 8, 9, 10], flightHours: 8.5, direct: false, budgetLevel: 2, dailyBudgetIls: { low: 150, mid: 280, high: 550 },
    summary: { he: 'אי ירוק ותלול באוקיינוס האטלנטי: מסלולי הליכה לאורך תעלות מים (לבאדות), פסגות מעל העננים, צוקים ובריכות לבה — יעד למטיילים שרוצים טבע ושקט.', en: 'A green, steep island in the Atlantic: walks along irrigation channels (levadas), peaks above the clouds, sea cliffs and lava pools — for travellers who want nature and calm.' },
    highlights: [
      { he: 'הליכה לאורך הלבאדות', en: 'Walking the levadas' },
      { he: 'זריחה בפיקו דו אריירו', en: 'Sunrise on Pico do Arieiro' },
      { he: 'בריכות הלבה הטבעיות בפורטו מוניז', en: 'The natural lava pools at Porto Moniz' },
      { he: 'הרכבל למונטה וגלישה במזחלות הנצרים', en: 'The cable car to Monte and the wicker toboggan ride' },
      { he: 'רצפת הזכוכית בצוק קאבו ז׳יראו', en: 'The glass skywalk at Cabo Girão' },
      { he: 'העיר העתיקה של פונשל', en: 'Funchal’s old town' }
    ],
    areas: [
      { name: { he: 'פונשל', en: 'Funchal' }, forWhom: { he: 'בסיס נוח — מסעדות, תחבורה וסיורים', en: 'A convenient base — restaurants, transport and tours' } },
      { name: { he: 'קאלטה', en: 'Calheta' }, forWhom: { he: 'זוגות שמחפשים שמש ושקט בדרום-מערב', en: 'Couples after sun and quiet in the south-west' } },
      { name: { he: 'סנטנה והצפון', en: 'Santana & the north' }, forWhom: { he: 'מטיילים שרוצים להיות קרובים למסלולים', en: 'Walkers who want to be close to the trails' } }
    ],
    attractions: [
      { name: { he: 'פיקו דו אריירו', en: 'Pico do Arieiro' }, kind: 'viewpoint', durationH: 2, tags: ['nature'] },
      { name: { he: 'מסלול פיקו דו אריירו–פיקו רואיבו', en: 'Pico do Arieiro–Pico Ruivo hike' }, kind: 'nature', durationH: 6, tags: ['adventure', 'nature'] },
      { name: { he: 'לבאדה 25 המעיינות', en: 'Levada das 25 Fontes' }, kind: 'nature', durationH: 4, tags: ['nature', 'adventure'], area: 'Calheta' },
      { name: { he: 'לבאדה קלדייראו ורדה', en: 'Levada do Caldeirão Verde' }, kind: 'nature', durationH: 5, tags: ['nature', 'adventure'], area: 'Santana & the north' },
      { name: { he: 'חצי האי סאו לורנסו', en: 'Ponta de São Lourenço' }, kind: 'nature', durationH: 3, tags: ['nature'] },
      { name: { he: 'בריכות הלבה בפורטו מוניז', en: 'Porto Moniz natural pools' }, kind: 'beach', durationH: 2, tags: ['family', 'beach'] },
      { name: { he: 'קאבו ז׳יראו', en: 'Cabo Girão skywalk' }, kind: 'viewpoint', durationH: 1, tags: ['couple'] },
      { name: { he: 'גן מונטה פאלאס הטרופי', en: 'Monte Palace Tropical Garden' }, kind: 'park', durationH: 2, tags: ['couple', 'family'], area: 'Funchal' },
      { name: { he: 'מזחלות הנצרים של מונטה', en: 'Monte toboggan ride' }, kind: 'experience', durationH: 0.5, tags: ['family'], area: 'Funchal' },
      { name: { he: 'שוק לברדורש', en: 'Mercado dos Lavradores' }, kind: 'market', durationH: 1, tags: ['food'], area: 'Funchal' },
      { name: { he: 'העיר העתיקה של פונשל', en: 'Funchal old town' }, kind: 'neighborhood', durationH: 2, tags: ['culture', 'food'], area: 'Funchal' },
      { name: { he: 'שייט לצפייה בדולפינים ולווייתנים', en: 'Dolphin & whale watching trip' }, kind: 'experience', durationH: 3, tags: ['family', 'nature'] },
      { name: { he: 'בתי סנטנה המסורתיים', en: 'Santana traditional houses' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Santana & the north' }
    ],
    dayTrips: [
      { name: { he: 'האי פורטו סנטו', en: 'Porto Santo' }, hours: 2.5, note: { he: 'מעבורת מפונשל לאי עם חוף זהוב ארוך — עדיף ללון לילה', en: 'Ferry from Funchal to an island with a long golden beach — better with an overnight' } }
    ],
    transport: { carRecommended: true, note: { he: 'רכב שכור הכי גמיש, אבל הכבישים תלולים ומתפתלים — לנהגים בטוחים. אפשר גם לבסס את הטיול על סיורים מאורגנים מפונשל.', en: 'A hire car is most flexible, but roads are steep and winding — for confident drivers. Organised tours from Funchal are a good alternative.' } },
    practical: {
      currency: 'EUR', language: { he: 'פורטוגזית; אנגלית נפוצה', en: 'Portuguese; English widely spoken' }, timeZone: 'Atlantic/Madeira',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'אין אספקה כשרה מקומית — כדאי להביא אוכל ארוז או לבחור דירה עם מטבח.', en: 'No local kosher supply — bring packed food or choose an apartment with a kitchen.' },
      shabbat: { he: 'אין קהילה מקומית; לינה בפונשל עם מטבח והכנה מראש מאפשרים שבת נוחה.', en: 'There is no local community; staying in Funchal with a kitchen and preparing ahead makes Shabbat manageable.' }
    },
    seasonsNote: { he: 'מזג אוויר מתון כל השנה; אפריל–אוקטובר הכי טובים למסלולים. בחורף יותר גשם בצפון ובהרים, ומדי פעם רוחות שמשבשות טיסות.', en: 'Mild all year; April–October is best for walking. Winter brings more rain to the north and the mountains, and occasional winds that disrupt flights.' }
  },
  {
    id: 'croatia', code: 'DBV', airports: ['DBV', 'SPU'],
    name: { he: 'קרואטיה — דוברובניק וספליט', en: 'Croatia — Dubrovnik & Split' }, country: { he: 'קרואטיה', en: 'Croatia' }, region: 'europe',
    tags: ['beach', 'culture', 'nature', 'couple', 'family', 'short_break', 'direct_flight'],
    bestMonths: [5, 6, 7, 8, 9, 10], flightHours: 2.5, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 350, high: 650 },
    summary: { he: 'החוף הדלמטי: עיר מוקפת חומות בדוברובניק, ארמון רומי חי בספליט, איים ומפרצים עם מים צלולים ופארקים לאומיים של מפלים — שבוע מושלם של ים ותרבות.', en: 'The Dalmatian coast: walled Dubrovnik, a living Roman palace in Split, islands and bays with clear water and national parks full of waterfalls — a perfect week of sea and culture.' },
    highlights: [
      { he: 'הליכה על חומות דוברובניק', en: 'Walking Dubrovnik’s city walls' },
      { he: 'ארמון דיוקלטיאנוס בספליט', en: 'Diocletian’s Palace in Split' },
      { he: 'מפלי הפארק הלאומי קרקה', en: 'The waterfalls of Krka National Park' },
      { he: 'שייט לאיים הוואר, בראץ׳ ולוקרום', en: 'Boat trips to Hvar, Brač and Lokrum' },
      { he: 'הרכבל להר סרג׳ מעל דוברובניק', en: 'The cable car up Mount Srđ above Dubrovnik' },
      { he: 'בית הכנסת העתיק של דוברובניק', en: 'Dubrovnik’s historic synagogue' }
    ],
    areas: [
      { name: { he: 'העיר העתיקה של דוברובניק', en: 'Dubrovnik Old Town' }, forWhom: { he: 'זוגות לביקור קצר — יקר ועמוס, אבל קסום', en: 'Couples on a short visit — pricey and busy, but magical' } },
      { name: { he: 'לאפאד (דוברובניק)', en: 'Lapad (Dubrovnik)' }, forWhom: { he: 'משפחות — חופים וטיילת, אוטובוס לעיר העתיקה', en: 'Families — beaches and a promenade, a bus to the Old Town' } },
      { name: { he: 'מרכז ספליט', en: 'Split centre' }, forWhom: { he: 'בסיס לאיים ולפארקים, עם חיי ערב', en: 'A base for islands and parks, with evening life' } },
      { name: { he: 'ריביירת מקרסקה', en: 'Makarska Riviera' }, forWhom: { he: 'חופשת חוף משפחתית בין שתי הערים', en: 'A family beach holiday between the two cities' } }
    ],
    attractions: [
      { name: { he: 'חומות דוברובניק', en: 'Dubrovnik city walls' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Dubrovnik Old Town' },
      { name: { he: 'הרחוב הראשי סטרדון', en: 'Stradun' }, kind: 'neighborhood', durationH: 1, tags: ['culture', 'shopping'], area: 'Dubrovnik Old Town' },
      { name: { he: 'רכבל דוברובניק להר סרג׳', en: 'Dubrovnik cable car to Mount Srđ' }, kind: 'viewpoint', durationH: 1.5, tags: ['couple', 'family'] },
      { name: { he: 'האי לוקרום', en: 'Lokrum island' }, kind: 'nature', durationH: 3, tags: ['nature', 'beach'] },
      { name: { he: 'מבצר לובריינאץ', en: 'Fort Lovrijenac' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Dubrovnik Old Town' },
      { name: { he: 'בית הכנסת של דוברובניק', en: 'Dubrovnik Synagogue' }, kind: 'religious', durationH: 0.5, tags: ['culture'], area: 'Dubrovnik Old Town' },
      { name: { he: 'חוף בנייה', en: 'Banje Beach' }, kind: 'beach', durationH: 3, tags: ['beach'] },
      { name: { he: 'ארמון דיוקלטיאנוס', en: 'Diocletian’s Palace' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Split centre' },
      { name: { he: 'גבעת מריאן', en: 'Marjan Hill' }, kind: 'park', durationH: 2, tags: ['nature', 'family'], area: 'Split centre' },
      { name: { he: 'הפארק הלאומי קרקה', en: 'Krka National Park' }, kind: 'nature', durationH: 5, tags: ['nature', 'family'] },
      { name: { he: 'חוף זלטני ראט בבראץ׳', en: 'Zlatni Rat beach, Brač' }, kind: 'beach', durationH: 5, tags: ['beach'] },
      { name: { he: 'טרוגיר', en: 'Trogir' }, kind: 'neighborhood', durationH: 2, tags: ['culture'] }
    ],
    dayTrips: [
      { name: { he: 'האי הוואר', en: 'Hvar' }, hours: 1, note: { he: 'קטמרן מספליט; עיירה יפה וחופים', en: 'Catamaran from Split; a pretty town and beaches' } },
      { name: { he: 'הפארק הלאומי פליטביצה', en: 'Plitvice Lakes National Park' }, hours: 2.5, note: { he: 'אגמים ומפלים מדהימים; יום ארוך מספליט', en: 'Stunning lakes and waterfalls; a long day from Split' } },
      { name: { he: 'קוטור (מונטנגרו)', en: 'Kotor (Montenegro)' }, hours: 2, note: { he: 'מדוברובניק, כולל מעבר גבול — לקחת דרכון', en: 'From Dubrovnik, including a border crossing — bring your passport' } },
      { name: { he: 'האי קורצ׳ולה', en: 'Korčula' }, hours: 2, note: { he: 'עיר עתיקה על אי, בקטמרן מדוברובניק או מספליט', en: 'An island old town, by catamaran from Dubrovnik or Split' } }
    ],
    transport: { carRecommended: true, note: { he: 'רכב נוח בין דוברובניק לספליט ולפארקים; בעיר העתיקה ובקיץ החניה קשה ויקרה. בין האיים — קטמרנים ומעבורות. אפשר לטוס לאחת הערים ולחזור מהשנייה.', en: 'A car helps between Dubrovnik, Split and the parks; Old Town parking is hard and pricey in summer. Catamarans and ferries link the islands. You can fly into one city and out of the other.' } },
    practical: {
      currency: 'EUR', language: { he: 'קרואטית; אנגלית נפוצה', en: 'Croatian; English widely spoken' }, timeZone: 'Europe/Zagreb',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'אין כמעט אספקה כשרה מקומית; כדאי לבדוק מול חב״ד בקרואטיה ולתאם מראש, או להצטייד.', en: 'There is almost no local kosher supply; check with Chabad in Croatia and arrange in advance, or bring supplies.' },
      shabbat: { he: 'לינה בתוך העיר העתיקה או בסמוך לה מאפשרת שבת ברגל; ארוחות צריך לתכנן מראש.', en: 'Staying in or near the old towns makes a walkable Shabbat possible; plan meals in advance.' }
    },
    seasonsNote: { he: 'יוני וספטמבר הכי טובים: ים חם ופחות עומס. יולי–אוגוסט חמים, עמוסים ויקרים; מנובמבר עד מרץ חלק מהעסקים והקווים הימיים לא פועלים.', en: 'June and September are best: warm sea, fewer crowds. July–August is hot, crowded and expensive; from November to March some businesses and ferry lines stop.' }
  },
  {
    id: 'montenegro', code: 'TIV', airports: ['TIV', 'TGD'],
    name: { he: 'מונטנגרו', en: 'Montenegro' }, country: { he: 'מונטנגרו', en: 'Montenegro' }, region: 'europe',
    tags: ['beach', 'nature', 'adventure', 'family', 'couple', 'low_budget', 'short_break', 'direct_flight'],
    bestMonths: [5, 6, 7, 8, 9, 10], flightHours: 2.5, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 130, mid: 230, high: 450 },
    summary: { he: 'מדינה קטנה עם הרבה נוף: מפרץ קוטור בין הרים תלולים, עיירות חוף מימי הוונציאנים, קניונים ואגמים בפנים הארץ — ומחירים נוחים יחסית לים התיכון.', en: 'A small country with a lot of scenery: the Bay of Kotor between steep mountains, Venetian-era coastal towns, canyons and lakes inland — and prices that are gentle by Mediterranean standards.' },
    highlights: [
      { he: 'העיר העתיקה של קוטור והטיפוס למבצר', en: 'Kotor old town and the climb to the fortress' },
      { he: 'פרסט והאי עם הכנסייה במפרץ', en: 'Perast and the island church in the bay' },
      { he: 'העיר העתיקה של בודווה והחופים', en: 'Budva’s old town and beaches' },
      { he: 'התצפית על סבטי סטפן', en: 'The view of Sveti Stefan' },
      { he: 'הפארק הלאומי דורמיטור וקניון טארה', en: 'Durmitor National Park and the Tara Canyon' },
      { he: 'אגם סקאדר', en: 'Lake Skadar' }
    ],
    areas: [
      { name: { he: 'קוטור ומפרץ קוטור', en: 'Kotor & the Bay of Kotor' }, forWhom: { he: 'זוגות ומי שרוצה נוף ותרבות', en: 'Couples and those after scenery and history' } },
      { name: { he: 'בודווה', en: 'Budva' }, forWhom: { he: 'חופים וחיי לילה, קרוב להכול', en: 'Beaches and nightlife, close to everything' } },
      { name: { he: 'טיבאט', en: 'Tivat' }, forWhom: { he: 'מרינה מטופחת וקרבה לשדה התעופה', en: 'A polished marina and close to the airport' } },
      { name: { he: 'פטרובאץ', en: 'Petrovac' }, forWhom: { he: 'משפחות — עיירת חוף שקטה יותר', en: 'Families — a quieter beach town' } }
    ],
    attractions: [
      { name: { he: 'העיר העתיקה של קוטור', en: 'Kotor Old Town' }, kind: 'neighborhood', durationH: 2, tags: ['culture'], area: 'Kotor & the Bay of Kotor' },
      { name: { he: 'חומות קוטור ומבצר סן ג׳ובאני', en: 'Kotor fortress walls (San Giovanni)' }, kind: 'viewpoint', durationH: 2, tags: ['adventure'], area: 'Kotor & the Bay of Kotor' },
      { name: { he: 'פרסט', en: 'Perast' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture', 'couple'], area: 'Kotor & the Bay of Kotor' },
      { name: { he: 'גבירתנו של הסלעים', en: 'Our Lady of the Rocks' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Kotor & the Bay of Kotor' },
      { name: { he: 'העיר העתיקה של בודווה', en: 'Budva Old Town' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture', 'nightlife'], area: 'Budva' },
      { name: { he: 'חוף מוגרן', en: 'Mogren Beach' }, kind: 'beach', durationH: 3, tags: ['beach'], area: 'Budva' },
      { name: { he: 'חוף יאז', en: 'Jaz Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'family'], area: 'Budva' },
      { name: { he: 'תצפית על סבטי סטפן', en: 'Sveti Stefan viewpoint' }, kind: 'viewpoint', durationH: 0.5, tags: ['couple'], area: 'Budva' },
      { name: { he: 'הפארק הלאומי לובצ׳ן ומאוזוליאום נייגוש', en: 'Lovćen National Park & Njegoš Mausoleum' }, kind: 'nature', durationH: 3, tags: ['nature'] },
      { name: { he: 'הפארק הלאומי אגם סקאדר', en: 'Lake Skadar National Park' }, kind: 'nature', durationH: 4, tags: ['nature', 'family'] },
      { name: { he: 'מנזר אוסטרוג', en: 'Ostrog Monastery' }, kind: 'religious', durationH: 2, tags: ['culture'] },
      { name: { he: 'פורטו מונטנגרו', en: 'Porto Montenegro' }, kind: 'neighborhood', durationH: 1.5, tags: ['luxury', 'food'], area: 'Tivat' }
    ],
    dayTrips: [
      { name: { he: 'דורמיטור וקניון טארה', en: 'Durmitor & the Tara Canyon' }, hours: 3, note: { he: 'האגם השחור, גשר ג׳ורג׳ביץ׳ ורפטינג בעונה; יום ארוך או לילה בז׳בליאק', en: 'Black Lake, Đurđevića Tara Bridge and rafting in season; a long day or a night in Žabljak' } },
      { name: { he: 'דוברובניק (קרואטיה)', en: 'Dubrovnik (Croatia)' }, hours: 2, note: { he: 'כולל מעבר גבול שיכול להתארך בקיץ — לקחת דרכון', en: 'Includes a border crossing that can be slow in summer — bring your passport' } },
      { name: { he: 'צטיניה', en: 'Cetinje' }, hours: 1, note: { he: 'הבירה המלכותית הישנה, בדרך ללובצ׳ן', en: 'The old royal capital, on the way to Lovćen' } }
    ],
    transport: { carRecommended: true, note: { he: 'רכב שכור הכי נוח, במיוחד לפנים הארץ. בין עיירות החוף יש אוטובוסים, ובקיץ יש פקקים סביב המפרץ. כבישי ההרים צרים ומתפתלים.', en: 'A hire car is easiest, especially inland. Buses link the coastal towns, and summer traffic jams build around the bay. Mountain roads are narrow and winding.' } },
    practical: {
      currency: 'EUR', language: { he: 'מונטנגרית; אנגלית נפוצה באזורי התיירות', en: 'Montenegrin; English common in tourist areas' }, timeZone: 'Europe/Podgorica',
      visaNoteForIsraelis: { he: 'בעלי דרכון ישראלי בדרך כלל לא צריכים ויזה לביקור תיירות קצר; הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israeli passport holders usually don’t need a visa for a short tourist visit; rules change — check official sources before flying.' },
      kosher: { he: 'האספקה הכשרה מוגבלת מאוד; בעונה יש פעילות של חב״ד באזור החוף — לבדוק ולתאם מראש, או להצטייד.', en: 'Kosher supply is very limited; Chabad is active on the coast in season — check and arrange in advance, or bring supplies.' },
      shabbat: { he: 'לינה בתוך העיר העתיקה או ליד הטיילת מאפשרת שבת ברגל; ארוחות צריך לתכנן מראש.', en: 'Staying in an old town or by the promenade makes a walkable Shabbat possible; plan meals in advance.' }
    },
    seasonsNote: { he: 'יוני וספטמבר הכי נעימים. יולי–אוגוסט חמים ועמוסים בחוף; בהרים נעים יותר. בחורף החוף שקט וגשום, ובדורמיטור יורד שלג.', en: 'June and September are the most pleasant. July–August is hot and crowded on the coast; the mountains are cooler. In winter the coast is quiet and wet, and Durmitor gets snow.' }
  },
  {
    id: 'slovenia', code: 'LJU', airports: ['LJU'],
    name: { he: 'סלובניה — ליובליאנה ואגם בלד', en: 'Slovenia — Ljubljana & Lake Bled' }, country: { he: 'סלובניה', en: 'Slovenia' }, region: 'europe',
    tags: ['nature', 'adventure', 'couple', 'family', 'culture', 'relaxation'],
    bestMonths: [5, 6, 7, 8, 9, 10], flightHours: 5.5, direct: false, budgetLevel: 2, dailyBudgetIls: { low: 150, mid: 280, high: 550 },
    summary: { he: 'מדינה קטנה וירוקה בין האלפים לים האדריאטי: בירה נינוחה על נהר, אגם בלד עם הכנסייה על האי, הרי האלפים היוליאניים ומערות ענק — טבע נגיש במרחקים קצרים.', en: 'A small green country between the Alps and the Adriatic: a laid-back riverside capital, Lake Bled with its island church, the Julian Alps and vast caves — accessible nature over short distances.' },
    highlights: [
      { he: 'אגם בלד והכנסייה על האי', en: 'Lake Bled and the island church' },
      { he: 'העיר העתיקה של ליובליאנה לאורך הנהר', en: 'Ljubljana’s old town along the river' },
      { he: 'אגם בוהיני והאלפים היוליאניים', en: 'Lake Bohinj and the Julian Alps' },
      { he: 'מערות פוסטויינה וטירת פרדיאמה', en: 'Postojna Cave and Predjama Castle' },
      { he: 'עמק הסוצ׳ה והנהר הטורקיז', en: 'The Soča Valley and its turquoise river' },
      { he: 'פיראן על חוף האדריאטי', en: 'Piran on the Adriatic coast' }
    ],
    areas: [
      { name: { he: 'ליובליאנה', en: 'Ljubljana' }, forWhom: { he: 'בסיס עירוני נוח עם מסעדות, טוב לכמה לילות', en: 'A comfortable city base with restaurants, good for a few nights' } },
      { name: { he: 'בלד', en: 'Bled' }, forWhom: { he: 'זוגות ומשפחות — אגם, טבע ומסלולים קלים', en: 'Couples and families — a lake, nature and easy walks' } },
      { name: { he: 'בוהיני', en: 'Bohinj' }, forWhom: { he: 'מי שמחפש שקט וטבע פראי יותר', en: 'Those after quiet and wilder nature' } },
      { name: { he: 'בובץ ועמק הסוצ׳ה', en: 'Bovec & the Soča Valley' }, forWhom: { he: 'אקטיביים — רפטינג, הליכות ורכיבה', en: 'Active travellers — rafting, hiking and cycling' } }
    ],
    attractions: [
      { name: { he: 'אגם בלד', en: 'Lake Bled' }, kind: 'nature', durationH: 3, tags: ['nature', 'couple', 'family'], area: 'Bled' },
      { name: { he: 'סירת פלטנה לאי בלד', en: 'Pletna boat to Bled Island' }, kind: 'experience', durationH: 1.5, tags: ['couple'], area: 'Bled' },
      { name: { he: 'טירת בלד', en: 'Bled Castle' }, kind: 'viewpoint', durationH: 1.5, tags: ['culture'], area: 'Bled' },
      { name: { he: 'ערוץ וינטגר', en: 'Vintgar Gorge' }, kind: 'nature', durationH: 2, tags: ['nature', 'family'], area: 'Bled' },
      { name: { he: 'אגם בוהיני', en: 'Lake Bohinj' }, kind: 'nature', durationH: 3, tags: ['nature', 'relaxation'], area: 'Bohinj' },
      { name: { he: 'מפל סביצה', en: 'Savica Waterfall' }, kind: 'nature', durationH: 1.5, tags: ['nature'], area: 'Bohinj' },
      { name: { he: 'רכבל ווגל', en: 'Vogel cable car' }, kind: 'viewpoint', durationH: 2, tags: ['nature', 'family'], area: 'Bohinj' },
      { name: { he: 'טירת ליובליאנה', en: 'Ljubljana Castle' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Ljubljana' },
      { name: { he: 'הגשר המשולש וכיכר פרשרן', en: 'Triple Bridge & Prešeren Square' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Ljubljana' },
      { name: { he: 'השוק המרכזי של ליובליאנה', en: 'Ljubljana Central Market' }, kind: 'market', durationH: 1, tags: ['food'], area: 'Ljubljana' },
      { name: { he: 'פארק טיבולי', en: 'Tivoli Park' }, kind: 'park', durationH: 1.5, tags: ['family'], area: 'Ljubljana' },
      { name: { he: 'מערות פוסטויינה', en: 'Postojna Cave' }, kind: 'nature', durationH: 2, tags: ['family', 'with_children'] },
      { name: { he: 'טירת פרדיאמה', en: 'Predjama Castle' }, kind: 'landmark', durationH: 1, tags: ['culture', 'family'] }
    ],
    dayTrips: [
      { name: { he: 'מערות פוסטויינה וטירת פרדיאמה', en: 'Postojna Cave & Predjama Castle' }, hours: 1, note: { he: 'שילוב קלאסי ליום אחד מליובליאנה', en: 'A classic one-day combo from Ljubljana' } },
      { name: { he: 'פיראן', en: 'Piran' }, hours: 1.5, note: { he: 'עיירת חוף ונציאנית על האדריאטי', en: 'A Venetian-style town on the Adriatic' } },
      { name: { he: 'עמק הסוצ׳ה דרך מעבר וורשיץ׳', en: 'Soča Valley via the Vršič Pass' }, hours: 2, note: { he: 'כביש הרים מרהיב, פתוח בעיקר בעונה החמה', en: 'A spectacular mountain road, open mainly in the warmer months' } },
      { name: { he: 'מערות שקוציאן', en: 'Škocjan Caves' }, hours: 1, note: { he: 'קניון תת-קרקעי ענק, אתר מורשת עולמית', en: 'A huge underground canyon, a UNESCO World Heritage Site' } }
    ],
    transport: { carRecommended: true, note: { he: 'רכב שכור נוח מאוד — המרחקים קצרים והכבישים טובים. בכבישים המהירים צריך מדבקת אגרה אלקטרונית (וינייטה). בין ליובליאנה לבלד יש גם אוטובוסים.', en: 'A hire car is very convenient — distances are short and roads are good. Motorways need an electronic vignette. Buses also link Ljubljana and Bled.' } },
    practical: {
      currency: 'EUR', language: { he: 'סלובנית; אנגלית נפוצה', en: 'Slovene; English widely spoken' }, timeZone: 'Europe/Ljubljana',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'האספקה הכשרה מוגבלת מאוד; כדאי להביא אוכל ארוז או לבחור דירה עם מטבח, ולבדוק מראש מול חב״ד.', en: 'Kosher supply is very limited; bring packed food or choose an apartment with a kitchen, and check with Chabad in advance.' },
      shabbat: { he: 'אין כמעט תשתית מקומית; לינה במרכז ליובליאנה או ליד אגם בלד מאפשרת שבת ברגל עם הכנה מראש.', en: 'There is almost no local infrastructure; staying in central Ljubljana or by Lake Bled allows a walkable Shabbat with preparation.' }
    },
    seasonsNote: { he: 'מאי–אוקטובר הכי טובים; יולי–אוגוסט חמים ועמוסים בבלד. בחורף קר, חלק מכבישי ההרים סגורים ויש אתרי סקי קטנים.', en: 'May–October is best; July–August is warm and busy at Bled. Winter is cold, some mountain roads close and there are small ski areas.' }
  }
];
