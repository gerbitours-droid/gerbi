// Catalog data (spec 23): Africa & Indian Ocean islands, Asia. Shape: dist/catalog.mjs.
// Budget figures are rough per-person-per-day estimates in ₪ without flights.
// dayTrips[].priceIls = rough ₪ per adult, ESTIMATES (Nov 2026): low ≈ do-it-yourself public transport + main entry fee,
// high ≈ a typical organised group tour from the base; converted at about €1=₪4, $1=₪3.7, £1=₪4.7 and rounded. Show as estimates.
export default [
  {
    id: 'maldives', trip: 'maldives', code: 'MLE', airports: ['MLE'],
    name: { he: 'האיים המלדיביים', en: 'The Maldives' }, country: { he: 'המלדיביים', en: 'Maldives' }, region: 'asia',
    tags: ['beach', 'couple', 'relaxation', 'all_inclusive', 'luxury', 'nature', 'week_long'],
    bestMonths: [11, 12, 1, 2, 3, 4], flightHours: 8, direct: false, budgetLevel: 4, dailyBudgetIls: { low: 250, mid: 550, high: 1200 },
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
      { name: { he: 'שנורקלינג בשונית הבית של הריזורט', en: 'Snorkelling the resort’s house reef' }, kind: 'nature', durationH: 2, tags: ['beach', 'nature'], mustSee: true },
      { name: { he: 'שייט שקיעה עם דולפינים', en: 'Sunset dolphin cruise' }, kind: 'experience', durationH: 2, tags: ['couple', 'evening'], mustSee: true },
      { name: { he: 'צלילה עם מנטות', en: 'Manta ray dive' }, kind: 'nature', durationH: 3, tags: ['adventure'] },
      { name: { he: 'שנורקלינג עם כרישי לווייתן בדרום ארי', en: 'Whale-shark snorkelling in South Ari' }, kind: 'nature', durationH: 4, tags: ['adventure', 'nature'], area: 'Ari Atoll' },
      { name: { he: 'גדת חול (Sandbank) לפיקניק', en: 'Sandbank picnic' }, kind: 'beach', durationH: 3, tags: ['couple', 'beach'], mustSee: true },
      { name: { he: 'טיסה נופית במטוס ימי', en: 'Scenic seaplane flight' }, kind: 'experience', durationH: 1, tags: ['luxury'] },
      { name: { he: 'דיג לילי מסורתי', en: 'Traditional night fishing' }, kind: 'experience', durationH: 2.5, tags: ['family', 'evening'] },
      { name: { he: 'ספא מעל המים', en: 'Overwater spa' }, kind: 'experience', durationH: 2, tags: ['relaxation', 'luxury'] },
      { name: { he: 'סיור בעיר מאלה ובשוק הדגים', en: 'Malé city & fish market tour' }, kind: 'market', durationH: 2, tags: ['culture'], area: 'Malé' },
      { name: { he: 'קיאק ופאדל בלגונה', en: 'Kayak & paddleboard in the lagoon' }, kind: 'experience', durationH: 1.5, tags: ['adventure'] }
    ],
    dayTrips: [
      { name: { he: 'ביקור באי מקומי', en: 'A local-island visit' }, hours: 0.5, note: { he: 'הצצה לחיי הכפר; לבוש צנוע', en: 'A glimpse of village life; dress modestly' }, priceIls: { low: 180, high: 370 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'מהשדה בהולהולה לריזורט בסירה מהירה או במטוס ימי (בתשלום נפרד). המטוס הימי טס רק באור יום, ונחיתה מאוחרת עלולה לחייב לילה במאלה.', en: 'From the airport to the resort by speedboat or seaplane (paid separately). Seaplanes fly only in daylight, so a late arrival may mean a night in Malé.' } },
    practical: {
      currency: 'USD', language: { he: 'דיבהי; אנגלית בריזורטים', en: 'Dhivehi; English at resorts' }, timeZone: 'Indian/Maldives',
      visaNoteForIsraelis: { he: 'מדיניות הכניסה לבעלי דרכון ישראלי השתנתה בעבר ועשויה להשתנות — חובה לבדוק במקורות הרשמיים לפני כל הזמנה.', en: 'Entry policy for Israeli passport holders has changed before and may change — always check official sources before booking.' },
      kosher: { he: 'אין כשרות מקומית; חלק מהריזורטים מסכימים לארוחות כשרות ארוזות בתיאום מראש.', en: 'No local kosher supply; some resorts accept pre-packed kosher meals by prior arrangement.' },
      shabbat: { he: 'בריזורט אין צורך בנסיעות — נוח לשבת; לתאם מראש נרות ואוכל.', en: 'No travel is needed at a resort — easy for Shabbat; arrange candles and food in advance.' }
    },
    seasonsNote: { he: 'נובמבר–אפריל: העונה היבשה והשקטה. מאי–אוקטובר: מונסון עם ממטרים, ים פחות צלול ומחירים נמוכים יותר.', en: 'November–April is the dry, calm season. May–October brings the monsoon: showers, less clear water and lower prices.' }
  },
  {
    id: 'bangkok', code: 'BKK', airports: ['BKK'],
    name: { he: 'בנגקוק', en: 'Bangkok' }, country: { he: 'תאילנד', en: 'Thailand' }, region: 'asia',
    tags: ['city', 'culture', 'food', 'shopping', 'nightlife', 'direct_flight', 'kosher', 'low_budget', 'week_long'],
    bestMonths: [11, 12, 1, 2], flightHours: 10.5, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 120, mid: 250, high: 550 },
    summary: { he: 'עיר ענקית ותוססת: מקדשים מוזהבים, שווקים, אוכל רחוב מעולה וקניות — ונקודת פתיחה נוחה לטיול בתאילנד. יש טיסות ישירות מתל אביב.', en: 'A huge, buzzing city of golden temples, markets, superb street food and shopping — and an easy starting point for a trip around Thailand. Direct flights from Tel Aviv.' },
    highlights: [
      { he: 'הארמון הגדול ומקדש בודהה האזמרגד', en: 'The Grand Palace and the Emerald Buddha' },
      { he: 'שייט על נהר צ׳או פראיה', en: 'A boat ride on the Chao Phraya River' },
      { he: 'אוכל רחוב בצ׳יינה טאון', en: 'Street food in Chinatown' },
      { he: 'שוק סוף השבוע צ׳טוצ׳אק', en: 'Chatuchak Weekend Market' },
      { he: 'בר על גג עם נוף לעיר', en: 'A rooftop bar over the skyline' },
      { he: 'יום טיול לאיוטאיה העתיקה', en: 'A day trip to ancient Ayutthaya' },
      { he: 'עיסוי תאילנדי', en: 'A Thai massage' }
    ],
    areas: [
      { name: { he: 'סוקומוויט', en: 'Sukhumvit' }, forWhom: { he: 'קרוב לרכבת העילית, מסעדות וחיי לילה — נוח לרוב המטיילים', en: 'Close to the Skytrain, restaurants and nightlife — convenient for most travellers' } },
      { name: { he: 'סיאם', en: 'Siam' }, forWhom: { he: 'מרכז העיר והקניונים — טוב למשפחות ולקניות', en: 'The city centre and its malls — good for families and shoppers' } },
      { name: { he: 'גדת הנהר (ריברסייד)', en: 'Riverside' }, forWhom: { he: 'נוף לנהר וגישה בסירה למקדשים — לזוגות', en: 'River views and boat access to the temples — for couples' } },
      { name: { he: 'באנגלמפו וחאו סאן', en: 'Banglamphu & Khao San' }, forWhom: { he: 'קרוב לארמון ולמקדשים; תרמילאים ותקציב נמוך', en: 'Near the palace and temples; backpackers and low budgets' } },
      { name: { he: 'סילום וסאתורן', en: 'Silom & Sathorn' }, forWhom: { he: 'אזור העסקים, עם פארק לומפיני ושוק לילה', en: 'The business district, with Lumphini Park and a night market' } }
    ],
    attractions: [
      { name: { he: 'הארמון הגדול ו־וואט פרה קאו', en: 'Grand Palace & Wat Phra Kaew' }, kind: 'landmark', durationH: 2.5, tags: ['culture'], area: 'Banglamphu & Khao San', mustSee: true },
      { name: { he: 'וואט פו — הבודהה השוכב', en: 'Wat Pho — the Reclining Buddha' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'Banglamphu & Khao San', mustSee: true },
      { name: { he: 'וואט ארון — מקדש השחר', en: 'Wat Arun — Temple of Dawn' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Riverside', mustSee: true },
      { name: { he: 'שוק סוף השבוע צ׳טוצ׳אק', en: 'Chatuchak Weekend Market' }, kind: 'market', durationH: 3, tags: ['shopping', 'food'], area: 'Chatuchak' },
      { name: { he: 'צ׳יינה טאון — רחוב יאוורט', en: 'Chinatown — Yaowarat Road' }, kind: 'neighborhood', durationH: 2.5, tags: ['food', 'nightlife', 'evening'], area: 'Chinatown (Yaowarat)' },
      { name: { he: 'שייט בסירת הנהר על הצ׳או פראיה', en: 'Chao Phraya river boat ride' }, kind: 'experience', durationH: 1.5, tags: ['family'], area: 'Riverside' },
      { name: { he: 'בית ג׳ים תומפסון', en: 'Jim Thompson House' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Siam' },
      { name: { he: 'פארק לומפיני', en: 'Lumphini Park' }, kind: 'park', durationH: 1.5, tags: ['family'], area: 'Silom & Sathorn' },
      { name: { he: 'רחוב חאו סאן', en: 'Khao San Road' }, kind: 'neighborhood', durationH: 2, tags: ['nightlife', 'low_budget', 'evening', 'adults'], area: 'Banglamphu & Khao San' },
      { name: { he: 'אסיאטיק — שוק לילה על הנהר', en: 'Asiatique The Riverfront night market' }, kind: 'market', durationH: 2.5, tags: ['shopping', 'family', 'evening'], area: 'Riverside' },
      { name: { he: 'קניוני סיאם', en: 'The Siam shopping malls' }, kind: 'neighborhood', durationH: 3, tags: ['shopping', 'family'], area: 'Siam' },
      { name: { he: 'בר על גג עם תצפית על העיר', en: 'A rooftop bar with a city view' }, kind: 'viewpoint', durationH: 2, tags: ['couple', 'nightlife', 'evening', 'adults'], area: 'Silom & Sathorn' },
      { name: { he: 'סדנת בישול תאילנדי', en: 'A Thai cooking class' }, kind: 'experience', durationH: 3, tags: ['food', 'couple'] }
    ],
    dayTrips: [
      { name: { he: 'איוטאיה — הבירה העתיקה', en: 'Ayutthaya — the old capital' }, hours: 1.5, note: { he: 'חורבות מקדשים מאתר מורשת עולמית; ברכבת, במיניוואן או בסיור מאורגן', en: 'World Heritage temple ruins; by train, minivan or organised tour' }, priceIls: { low: 30, high: 250 }, kind: 'landmark' },
      { name: { he: 'השוק הצף דמנואן סדואק ושוק המסילה מאקלונג', en: 'Damnoen Saduak floating market & Maeklong railway market' }, hours: 1.5, note: { he: 'כדאי לצאת מוקדם בבוקר; לרוב משולבים בסיור אחד', en: 'Go early in the morning; usually combined in one tour' }, priceIls: { low: 90, high: 250 }, kind: 'market' },
      { name: { he: 'קנצ׳נבורי והגשר על נהר קוואי', en: 'Kanchanaburi & the Bridge on the River Kwai' }, hours: 2.5, note: { he: 'יום ארוך; היסטוריה של מלחמת העולם השנייה ומפלי אראוואן', en: 'A long day; WWII history and the Erawan Falls' }, priceIls: { low: 170, high: 350 }, kind: 'landmark' },
      { name: { he: 'המשך צפונה לצ׳יאנג מאי', en: 'Onward north to Chiang Mai' }, hours: 1.5, note: { he: 'לא טיול יום — טיסה פנימית או רכבת לילה, למי שמאריך את הטיול', en: 'Not a day trip — a domestic flight or night train for those extending the trip' } }
    ],
    transport: { carRecommended: false, note: { he: 'הרכבת העילית (BTS), המטרו וסירות הנהר עוקפים את הפקקים; מוניות ואפליקציית Grab זולות. נהיגה בעיר לא מומלצת — התנועה צפופה ונוהגים בצד שמאל.', en: 'The Skytrain (BTS), metro and river boats beat the traffic; taxis and the Grab app are cheap. Driving in the city is not advised — traffic is heavy and it drives on the left.' } },
    practical: {
      currency: 'THB', language: { he: 'תאית; אנגלית באזורי התיירות', en: 'Thai; English in tourist areas' }, timeZone: 'Asia/Bangkok',
      visaNoteForIsraelis: { he: 'בדרך כלל ישראלים לא צריכים ויזה לשהייה תיירותית קצרה, ויש למלא כרטיס הגעה דיגיטלי לפני הטיסה. הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israelis generally do not need a visa for a short tourist stay, and a digital arrival card must be completed before the flight. Rules change — check official sources before flying.' },
      kosher: { he: 'יש כמה בתי חב״ד ומסעדות כשרות, בעיקר באזור חאו סאן וסוקומוויט; כדאי לבדוק ולתאם מראש.', en: 'There are several Chabad houses and kosher restaurants, mainly around Khao San and Sukhumvit; check and arrange in advance.' },
      shabbat: { he: 'כדאי לבחור מלון במרחק הליכה מבית חב״ד ולהזמין ארוחות שבת מראש.', en: 'Choose a hotel within walking distance of a Chabad house and book Shabbat meals in advance.' }
    },
    seasonsNote: { he: 'נובמבר–פברואר: העונה הנעימה והיבשה. מרץ–מאי חם מאוד. יוני–אוקטובר: עונת הגשמים — ממטרים חזקים אבל קצרים, ומחירים נמוכים יותר.', en: 'November–February is the pleasant, dry season. March–May is very hot. June–October is the rainy season — heavy but short showers, and lower prices.' }
  },
  {
    id: 'phuket', code: 'HKT', airports: ['HKT'],
    name: { he: 'פוקט', en: 'Phuket' }, country: { he: 'תאילנד', en: 'Thailand' }, region: 'asia',
    tags: ['beach', 'couple', 'family', 'relaxation', 'nature', 'nightlife', 'direct_flight', 'week_long'],
    bestMonths: [11, 12, 1, 2, 3, 4], flightHours: 11, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 150, mid: 300, high: 650 },
    summary: { he: 'האי הגדול של תאילנד: חופים ארוכים, מים חמימים ושייט לאיי פי פי ולמפרץ פאנג נגה — לזוגות, למשפחות ולמי שרוצה גם חיי לילה.', en: 'Thailand’s largest island: long beaches, warm water and boat trips to the Phi Phi Islands and Phang Nga Bay — for couples, families and those who want some nightlife too.' },
    highlights: [
      { he: 'שייט לאיי פי פי', en: 'A boat trip to the Phi Phi Islands' },
      { he: 'מפרץ פאנג נגה וצוקי הגיר', en: 'Phang Nga Bay and its limestone karsts' },
      { he: 'שקיעה בכף פרומתפ', en: 'Sunset at Promthep Cape' },
      { he: 'העיר העתיקה של פוקט', en: 'Phuket Old Town' },
      { he: 'הבודהה הגדול', en: 'The Big Buddha' },
      { he: 'חופים שקטים בקטה ובקרון', en: 'Quieter beaches at Kata and Karon' }
    ],
    areas: [
      { name: { he: 'פטונג', en: 'Patong' }, forWhom: { he: 'מרכז הבילוי והקניות — לצעירים ולחיי לילה', en: 'The hub for nightlife and shopping — for younger travellers' } },
      { name: { he: 'קטה וקרון', en: 'Kata & Karon' }, forWhom: { he: 'חופים רחבים ואווירה רגועה יותר — טוב למשפחות', en: 'Wide beaches and a calmer feel — good for families' } },
      { name: { he: 'קמלה ובאנג טאו', en: 'Kamala & Bang Tao' }, forWhom: { he: 'ריזורטים שקטים בחוף המערבי — לזוגות', en: 'Quiet resorts on the west coast — for couples' } },
      { name: { he: 'העיר פוקט והעיר העתיקה', en: 'Phuket Town & Old Town' }, forWhom: { he: 'אוכל מקומי, שווקים ותקציב נמוך — רחוק מהחוף', en: 'Local food, markets and low budgets — away from the beach' } },
      { name: { he: 'ראוואי וצ׳לונג', en: 'Rawai & Chalong' }, forWhom: { he: 'הדרום השקט, נקודת יציאה לסירות', en: 'The quiet south, a departure point for boats' } }
    ],
    attractions: [
      { name: { he: 'הבודהה הגדול', en: 'The Big Buddha' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'Rawai & Chalong', mustSee: true },
      { name: { he: 'וואט צ׳לונג', en: 'Wat Chalong' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Rawai & Chalong' },
      { name: { he: 'העיר העתיקה של פוקט', en: 'Phuket Old Town' }, kind: 'neighborhood', durationH: 2.5, tags: ['culture', 'food'], area: 'Phuket Town & Old Town', mustSee: true },
      { name: { he: 'כף פרומתפ בשקיעה', en: 'Promthep Cape at sunset' }, kind: 'viewpoint', durationH: 1, tags: ['couple', 'evening'], area: 'Rawai & Chalong', mustSee: true },
      { name: { he: 'תצפית קרון (שלושת המפרצים)', en: 'Karon Viewpoint' }, kind: 'viewpoint', durationH: 0.5, tags: ['nature'], area: 'Kata & Karon' },
      { name: { he: 'חוף פטונג', en: 'Patong Beach' }, kind: 'beach', durationH: 3, tags: ['beach'], area: 'Patong', months: [1, 2, 3, 4, 11, 12] },
      { name: { he: 'רחוב בנגלה בערב', en: 'Bangla Road at night' }, kind: 'neighborhood', durationH: 2, tags: ['nightlife', 'evening', 'adults'], area: 'Patong' },
      { name: { he: 'חופי קטה וקטה נוי', en: 'Kata and Kata Noi beaches' }, kind: 'beach', durationH: 4, tags: ['beach', 'family'], area: 'Kata & Karon', months: [1, 2, 3, 4, 11, 12] },
      { name: { he: 'חוף באנג טאו', en: 'Bang Tao Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'relaxation'], area: 'Kamala & Bang Tao', months: [1, 2, 3, 4, 11, 12] },
      { name: { he: 'שוק סוף השבוע (נאקה)', en: 'Phuket Weekend Market (Naka)' }, kind: 'market', durationH: 2, tags: ['shopping', 'food', 'evening'], area: 'Phuket Town & Old Town' },
      { name: { he: 'שייט לאיי פי פי ומפרץ מאיה', en: 'Phi Phi Islands & Maya Bay boat trip' }, kind: 'nature', durationH: 8, tags: ['beach', 'nature', 'teens'], mustSee: true },
      { name: { he: 'מפרץ פאנג נגה ואי ג׳יימס בונד בקיאקים', en: 'Phang Nga Bay & James Bond Island by kayak' }, kind: 'nature', durationH: 8, tags: ['nature', 'adventure', 'teens'] },
      { name: { he: 'שנורקלינג באיי הסימילן (בעונה)', en: 'Snorkelling in the Similan Islands (in season)' }, kind: 'nature', durationH: 10, tags: ['nature', 'adventure', 'teens'], months: [1, 2, 3, 4, 11, 12] }
    ],
    dayTrips: [
      { name: { he: 'איי פי פי', en: 'The Phi Phi Islands' }, hours: 1.5, note: { he: 'סירה מהירה; שנורקלינג וחופים — יום מלא', en: 'By speedboat; snorkelling and beaches — a full day' }, priceIls: { low: 170, high: 350 }, kind: 'beach' },
      { name: { he: 'מפרץ פאנג נגה', en: 'Phang Nga Bay' }, hours: 1, note: { he: 'צוקי גיר מהים, מערות וקיאקים', en: 'Limestone towers rising from the sea, caves and kayaking' }, priceIls: { low: 140, high: 300 }, kind: 'nature' },
      { name: { he: 'קראבי — ראיליי ואאו נאנג', en: 'Krabi — Railay & Ao Nang' }, hours: 2, note: { he: 'בסירה או ברכב; אפשר גם להעביר לשם כמה לילות', en: 'By boat or road; also worth a few nights of its own' }, priceIls: { low: 170, high: 350 }, kind: 'beach' }
    ],
    transport: { carRecommended: false, note: { he: 'אין תחבורה ציבורית נוחה בין החופים; מוניות, Grab או נהג פרטי. רכב שכור אפשרי לנהגים מנוסים (נוהגים בצד שמאל). קטנועים — רק עם רישיון מתאים וביטוח שמכסה אותם.', en: 'There is little practical public transport between beaches; use taxis, Grab or a private driver. A rental car suits confident drivers (it drives on the left). Scooters only with the right licence and insurance that covers them.' } },
    practical: {
      currency: 'THB', language: { he: 'תאית; אנגלית באזורי התיירות', en: 'Thai; English in tourist areas' }, timeZone: 'Asia/Bangkok',
      visaNoteForIsraelis: { he: 'בדרך כלל ישראלים לא צריכים ויזה לשהייה תיירותית קצרה, ויש למלא כרטיס הגעה דיגיטלי לפני הטיסה. הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israelis generally do not need a visa for a short tourist stay, and a digital arrival card must be completed before the flight. Rules change — check official sources before flying.' },
      kosher: { he: 'יש בית חב״ד באי עם ארוחות כשרות; לבדוק ולתאם מראש. מחוץ לחב״ד אין כמעט היצע כשר.', en: 'There is a Chabad house on the island with kosher meals; check and arrange in advance. Beyond Chabad there is almost no kosher supply.' },
      shabbat: { he: 'המרחקים בין החופים גדולים — מי ששומר שבת יבחר מלון קרוב לבית חב״ד ויתאם ארוחות מראש.', en: 'Beaches are far apart — Shabbat observers should stay near the Chabad house and arrange meals in advance.' }
    },
    seasonsNote: { he: 'נובמבר–אפריל: עונה יבשה וים רגוע. מאי–אוקטובר: מונסון — גלים בחוף המערבי, שייט מוגבל ופארקים ימיים מסוימים סגורים לחלק מהעונה, אבל מחירים נמוכים.', en: 'November–April brings dry weather and calm seas. May–October is the monsoon: west-coast waves, fewer boat trips and some marine parks closed for part of the season, but lower prices.' }
  },
  {
    id: 'vietnam', code: 'HAN', airports: ['HAN', 'SGN', 'DAD'],
    name: { he: 'וייטנאם', en: 'Vietnam' }, country: { he: 'וייטנאם', en: 'Vietnam' }, region: 'asia',
    tags: ['culture', 'food', 'nature', 'adventure', 'beach', 'city', 'low_budget', 'week_long'],
    bestMonths: [2, 3, 4, 10, 11, 12], flightHours: 13, direct: false, budgetLevel: 1, dailyBudgetIls: { low: 100, mid: 200, high: 450 },
    summary: { he: 'מסע לאורך המדינה: האנוי והעיר העתיקה, שייט בין צוקי מפרץ הא לונג, הפנסים של הוי אן והאנרגיה של הו צ׳י מין סיטי — עם אחד המטבחים הטובים באסיה ומחירים נמוכים.', en: 'A journey down the country: Hanoi’s Old Quarter, a cruise among the karsts of Ha Long Bay, the lanterns of Hoi An and the energy of Ho Chi Minh City — with one of Asia’s best cuisines and low prices.' },
    highlights: [
      { he: 'לילה על ספינה במפרץ הא לונג', en: 'A night aboard a boat in Ha Long Bay' },
      { he: 'הרובע העתיק של האנוי', en: 'Hanoi’s Old Quarter' },
      { he: 'העיר העתיקה של הוי אן בערב', en: 'Hoi An Ancient Town by night' },
      { he: 'שיט בסירות בנין בין', en: 'Rowing-boat rides in Ninh Binh' },
      { he: 'פו, באן מי ואוכל רחוב', en: 'Pho, banh mi and street food' },
      { he: 'מנהרות קו צ׳י ודלתת המקונג', en: 'The Cu Chi tunnels and the Mekong Delta' }
    ],
    areas: [
      { name: { he: 'האנוי', en: 'Hanoi' }, forWhom: { he: 'בסיס לצפון: הא לונג ונין בין; היסטוריה ואוכל רחוב', en: 'The base for the north: Ha Long and Ninh Binh; history and street food' } },
      { name: { he: 'הוי אן', en: 'Hoi An' }, forWhom: { he: 'עיירה ציורית, תופרים וחוף קרוב — לזוגות ולמשפחות', en: 'A picturesque town, tailors and a nearby beach — for couples and families' } },
      { name: { he: 'דה נאנג', en: 'Da Nang' }, forWhom: { he: 'עיר חוף מודרנית עם חוף ארוך — נוח למשפחות', en: 'A modern beach city with a long beach — easy for families' } },
      { name: { he: 'הו צ׳י מין סיטי (סייגון)', en: 'Ho Chi Minh City (Saigon)' }, forWhom: { he: 'עיר תוססת, קניות וחיי לילה; יציאה לדלתת המקונג', en: 'A lively city, shopping and nightlife; the gateway to the Mekong Delta' } }
    ],
    attractions: [
      { name: { he: 'אגם הואן קיאם והרובע העתיק', en: 'Hoan Kiem Lake & the Old Quarter' }, kind: 'neighborhood', durationH: 3, tags: ['culture', 'food', 'evening'], area: 'Hanoi', mustSee: true },
      { name: { he: 'מקדש הספרות', en: 'Temple of Literature' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Hanoi' },
      { name: { he: 'מוזוליאום הו צ׳י מין ומקדש העמוד האחד', en: 'Ho Chi Minh Mausoleum & One Pillar Pagoda' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Hanoi' },
      { name: { he: 'שייט לילה במפרץ הא לונג', en: 'Overnight cruise in Ha Long Bay' }, kind: 'nature', durationH: 24, tags: ['nature', 'couple'], area: 'Hanoi', mustSee: true },
      { name: { he: 'טראנג אן וטאם קוק בנין בין', en: 'Trang An & Tam Coc in Ninh Binh' }, kind: 'nature', durationH: 8, tags: ['nature'], area: 'Hanoi' },
      { name: { he: 'העיר העתיקה של הוי אן', en: 'Hoi An Ancient Town' }, kind: 'neighborhood', durationH: 4, tags: ['culture', 'couple', 'shopping'], area: 'Hoi An', mustSee: true },
      { name: { he: 'חוף אן באנג', en: 'An Bang Beach' }, kind: 'beach', durationH: 3, tags: ['beach', 'relaxation'], area: 'Hoi An', months: [3, 4, 5, 6, 7, 8] },
      { name: { he: 'הרי השיש', en: 'The Marble Mountains' }, kind: 'nature', durationH: 2, tags: ['nature'], area: 'Da Nang' },
      { name: { he: 'בה נה הילס והגשר המוזהב', en: 'Ba Na Hills & the Golden Bridge' }, kind: 'viewpoint', durationH: 6, tags: ['family'], area: 'Da Nang' },
      { name: { he: 'חוף מי קה', en: 'My Khe Beach' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'Da Nang', months: [3, 4, 5, 6, 7, 8] },
      { name: { he: 'מוזיאון שרידי המלחמה', en: 'War Remnants Museum' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Ho Chi Minh City (Saigon)' },
      { name: { he: 'שוק בן טאן', en: 'Ben Thanh Market' }, kind: 'market', durationH: 1.5, tags: ['shopping', 'food'], area: 'Ho Chi Minh City (Saigon)' },
      { name: { he: 'מנהרות קו צ׳י', en: 'Cu Chi Tunnels' }, kind: 'landmark', durationH: 5, tags: ['culture', 'adventure'], area: 'Ho Chi Minh City (Saigon)' }
    ],
    dayTrips: [
      { name: { he: 'נין בין מהאנוי', en: 'Ninh Binh from Hanoi' }, hours: 2, note: { he: 'שיט בסירות חתירה בין צוקי גיר ומקדשים; אפשר גם ללון', en: 'Rowing boats among limestone karsts and temples; also good for an overnight' }, priceIls: { low: 110, high: 220 }, kind: 'nature' },
      { name: { he: 'מקדשי מי סון', en: 'My Son Sanctuary' }, hours: 1, note: { he: 'חורבות מקדשי צ׳אם מהוי אן; כדאי בשעות הבוקר', en: 'Cham temple ruins from Hoi An; best in the morning' }, priceIls: { low: 50, high: 150 }, kind: 'landmark' },
      { name: { he: 'דלתת המקונג', en: 'The Mekong Delta' }, hours: 2, note: { he: 'סירות, מטעים וחיי כפר מהו צ׳י מין סיטי', en: 'Boats, orchards and village life from Ho Chi Minh City' }, priceIls: { low: 75, high: 250 }, kind: 'nature' },
      { name: { he: 'מעבר האי ואן', en: 'Hai Van Pass' }, hours: 1, note: { he: 'כביש הררי נופי בין דה נאנג להואה', en: 'A scenic mountain road between Da Nang and Hue' }, priceIls: { low: 110, high: 250 }, kind: 'viewpoint' }
    ],
    transport: { carRecommended: false, note: { he: 'בין הצפון, המרכז והדרום טסים בטיסות פנים קצרות; בערים — Grab ומוניות. נהיגה עצמית לא מומלצת; לטיולים — נהג פרטי או סיור מאורגן.', en: 'Short domestic flights link the north, centre and south; in cities use Grab and taxis. Self-driving is not advised; for excursions use a private driver or tour.' } },
    practical: {
      currency: 'VND', language: { he: 'וייטנאמית; אנגלית בסיסית באזורי התיירות', en: 'Vietnamese; basic English in tourist areas' }, timeZone: 'Asia/Ho_Chi_Minh',
      visaNoteForIsraelis: { he: 'בדרך כלל ישראלים צריכים ויזה אלקטרונית (e-visa) שמזמינים באתר הרשמי לפני הטיסה. הכללים משתנים — יש לבדוק במקורות הרשמיים לפני כל הזמנה.', en: 'Israelis generally need an e-visa ordered on the official site before flying. Rules change — always check official sources before booking.' },
      kosher: { he: 'יש בתי חב״ד בהאנוי ובהו צ׳י מין סיטי; בשאר המקומות כמעט אין כשרות — לתאם ארוחות או להביא אוכל ארוז.', en: 'There are Chabad houses in Hanoi and Ho Chi Minh City; elsewhere kosher food is scarce — arrange meals or bring packed food.' },
      shabbat: { he: 'כדאי לתכנן את השבת בהאנוי או בהו צ׳י מין סיטי, קרוב לבית חב״ד, ולתאם מראש.', en: 'Plan Shabbat in Hanoi or Ho Chi Minh City, near a Chabad house, and arrange in advance.' }
    },
    seasonsNote: { he: 'האקלים שונה בין האזורים: בצפון חורף קריר ואפור (דצמבר–פברואר) וקיץ חם ולח; במרכז עונת סערות וגשמים בערך מספטמבר עד נובמבר; הדרום חם כל השנה, יבש בדצמבר–אפריל. פברואר–אפריל טובים לרוב המסלול.', en: 'The climate varies by region: the north has a cool, grey winter (December–February) and a hot, humid summer; the centre gets storms and heavy rain roughly September–November; the south is hot year-round and dry December–April. February–April suits most itineraries.' }
  },
  {
    id: 'japan', code: 'TYO', airports: ['NRT', 'HND', 'KIX'],
    name: { he: 'יפן', en: 'Japan' }, country: { he: 'יפן', en: 'Japan' }, region: 'asia',
    tags: ['city', 'culture', 'food', 'shopping', 'nature', 'family', 'couple', 'week_long'],
    bestMonths: [3, 4, 5, 10, 11], flightHours: 15.5, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 250, mid: 450, high: 900 },
    summary: { he: 'טוקיו המודרנית, מקדשי קיוטו, אוכל הרחוב של אוסקה והנוף של הר פוג׳י — מדינה בטוחה ומסודרת עם רכבות מהירות, שמתאימה גם לטיול ראשון באסיה.', en: 'Modern Tokyo, Kyoto’s temples, Osaka’s street food and views of Mt Fuji — a safe, orderly country with fast trains that also suits a first trip to Asia.' },
    highlights: [
      { he: 'צומת שיבויה והאורות של טוקיו', en: 'The Shibuya Crossing and Tokyo’s lights' },
      { he: 'אלפי שערי הטוריי בפושימי אינארי', en: 'The thousands of torii gates at Fushimi Inari' },
      { he: 'הר פוג׳י מאגמי פוג׳י', en: 'Mt Fuji from the Fuji Five Lakes' },
      { he: 'אוכל רחוב בדוטונבורי באוסקה', en: 'Street food in Osaka’s Dotonbori' },
      { he: 'נסיעה ברכבת השינקנסן', en: 'A ride on the Shinkansen' },
      { he: 'פריחת הדובדבן באביב והשלכת בסתיו', en: 'Cherry blossom in spring and autumn colours' },
      { he: 'האיילות של נארה', en: 'The deer of Nara' }
    ],
    areas: [
      { name: { he: 'טוקיו', en: 'Tokyo' }, forWhom: { he: 'שינג׳וקו ושיבויה לבילוי וקניות, אסאקוסה לאווירה מסורתית', en: 'Shinjuku and Shibuya for buzz and shopping, Asakusa for a traditional feel' } },
      { name: { he: 'קיוטו', en: 'Kyoto' }, forWhom: { he: 'מקדשים, גנים ורובע הגיישות — לתרבות ולזוגות', en: 'Temples, gardens and the geisha district — for culture and couples' } },
      { name: { he: 'אוסקה', en: 'Osaka' }, forWhom: { he: 'אוכל, חיי לילה ובסיס זול יחסית לקיוטו ולנארה', en: 'Food, nightlife and a relatively cheap base for Kyoto and Nara' } },
      { name: { he: 'אזור פוג׳י והאקונה', en: 'Fuji & Hakone' }, forWhom: { he: 'נוף להר, אגמים ומעיינות חמים — לילה או שניים', en: 'Mountain views, lakes and hot springs — a night or two' } }
    ],
    attractions: [
      { name: { he: 'מקדש סנסו־ג׳י באסאקוסה', en: 'Senso-ji Temple, Asakusa' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'Tokyo', mustSee: true },
      { name: { he: 'צומת שיבויה', en: 'Shibuya Crossing' }, kind: 'landmark', durationH: 1, tags: ['city'], area: 'Tokyo' },
      { name: { he: 'מקדש מייג׳י', en: 'Meiji Jingu Shrine' }, kind: 'religious', durationH: 1.5, tags: ['culture', 'nature'], area: 'Tokyo', mustSee: true },
      { name: { he: 'השוק החיצוני של צוקיג׳י', en: 'Tsukiji Outer Market' }, kind: 'market', durationH: 2, tags: ['food'], area: 'Tokyo' },
      { name: { he: 'טוקיו סקייטרי', en: 'Tokyo Skytree' }, kind: 'viewpoint', durationH: 1.5, tags: ['family'], area: 'Tokyo' },
      { name: { he: 'teamLab Planets', en: 'teamLab Planets' }, kind: 'museum', durationH: 2, tags: ['family', 'couple'], area: 'Tokyo' },
      { name: { he: 'פושימי אינארי', en: 'Fushimi Inari Taisha' }, kind: 'religious', durationH: 2.5, tags: ['culture'], area: 'Kyoto', mustSee: true },
      { name: { he: 'קינקאקו־ג׳י — מקדש ביתן הזהב', en: 'Kinkaku-ji — the Golden Pavilion' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Kyoto', mustSee: true },
      { name: { he: 'יער הבמבוק בארשיאמה', en: 'Arashiyama Bamboo Grove' }, kind: 'nature', durationH: 2, tags: ['nature'], area: 'Kyoto' },
      { name: { he: 'רובע גיון', en: 'Gion district' }, kind: 'neighborhood', durationH: 2, tags: ['culture', 'couple'], area: 'Kyoto' },
      { name: { he: 'דוטונבורי', en: 'Dotonbori' }, kind: 'neighborhood', durationH: 2.5, tags: ['food', 'nightlife', 'evening'], area: 'Osaka' },
      { name: { he: 'טירת אוסקה', en: 'Osaka Castle' }, kind: 'landmark', durationH: 2, tags: ['culture', 'family'], area: 'Osaka' },
      { name: { he: 'אגם קוואגוצ׳י ותצפית על הר פוג׳י', en: 'Lake Kawaguchi & Mt Fuji views' }, kind: 'nature', durationH: 5, tags: ['nature'], area: 'Fuji & Hakone' }
    ],
    dayTrips: [
      { name: { he: 'נארה', en: 'Nara' }, hours: 0.75, note: { he: 'מקדש טודאי־ג׳י והאיילות בפארק; ברכבת מקיוטו או מאוסקה', en: 'Todai-ji Temple and the deer park; by train from Kyoto or Osaka' }, priceIls: { low: 40, high: 300 }, kind: 'religious' },
      { name: { he: 'האקונה', en: 'Hakone' }, hours: 1.5, note: { he: 'רכבל, שייט באגם אשי ומעיינות חמים; מטוקיו', en: 'Cable car, a Lake Ashi cruise and hot springs; from Tokyo' }, priceIls: { low: 170, high: 450 }, kind: 'nature' },
      { name: { he: 'קמאקורה', en: 'Kamakura' }, hours: 1, note: { he: 'הבודהה הגדול ומקדשים ליד הים; מטוקיו', en: 'The Great Buddha and seaside temples; from Tokyo' }, priceIls: { low: 40, high: 300 }, kind: 'religious' },
      { name: { he: 'הירושימה ומיאג׳ימה', en: 'Hiroshima & Miyajima' }, hours: 1.5, note: { he: 'בשינקנסן מאוסקה; יום ארוך', en: 'By Shinkansen from Osaka; a long day' }, priceIls: { low: 550, high: 900 }, kind: 'landmark' }
    ],
    transport: { carRecommended: false, note: { he: 'הרכבות מצוינות: מטרו בערים ושינקנסן ביניהן. כדאי לבדוק מראש אם כרטיס JR Pass משתלם למסלול שלכם. רכב רק לאזורים כפריים, ונדרש רישיון בינלאומי מתאים.', en: 'Trains are excellent: metros in the cities and the Shinkansen between them. Check in advance whether a JR Pass pays off for your route. A car only for rural areas, with a suitable international permit.' } },
    practical: {
      currency: 'JPY', language: { he: 'יפנית; אנגלית מוגבלת, השילוט בתחבורה גם באנגלית', en: 'Japanese; limited English, though transport signs are also in English' }, timeZone: 'Asia/Tokyo',
      visaNoteForIsraelis: { he: 'בדרך כלל ישראלים לא צריכים ויזה לשהייה תיירותית קצרה. הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israelis generally do not need a visa for a short tourist stay. Rules change — check official sources before flying.' },
      kosher: { he: 'יש בתי חב״ד בטוקיו, בקיוטו ובאוסקה שמספקים ארוחות בתיאום; מחוץ להם כמעט אין כשרות.', en: 'There are Chabad houses in Tokyo, Kyoto and Osaka that provide meals by arrangement; beyond them kosher food is scarce.' },
      shabbat: { he: 'כדאי לתכנן את השבת באחת הערים עם בית חב״ד, במלון במרחק הליכה, ולתאם מראש.', en: 'Plan Shabbat in one of the cities with a Chabad house, in a hotel within walking distance, and arrange in advance.' }
    },
    seasonsNote: { he: 'סוף מרץ–תחילת אפריל: פריחת הדובדבן (עמוס ויקר). אוקטובר–נובמבר: שלכת ומזג אוויר נעים. יוני–יולי גשום, הקיץ חם ולח, והחורף קר אבל צלול — עונת סקי בהוקאידו.', en: 'Late March–early April brings cherry blossom (busy and pricey). October–November brings autumn colours and pleasant weather. June–July is rainy, summer is hot and humid, and winter is cold but clear — ski season in Hokkaido.' }
  },
  {
    id: 'bali', code: 'DPS', airports: ['DPS'],
    name: { he: 'באלי', en: 'Bali' }, country: { he: 'אינדונזיה', en: 'Indonesia' }, region: 'asia',
    tags: ['beach', 'nature', 'culture', 'couple', 'relaxation', 'adventure', 'low_budget', 'week_long'],
    bestMonths: [4, 5, 6, 7, 8, 9, 10], flightHours: 14.5, direct: false, budgetLevel: 2, dailyBudgetIls: { low: 120, mid: 250, high: 550 },
    summary: { he: 'אי של מקדשים, טרסות אורז, גלישה ושקיעות: אובוד הירוקה, חופי הדרום והצוקים של אולואוואטו. לפני תכנון — חשוב לבדוק את הסדרי הכניסה לבעלי דרכון ישראלי.', en: 'An island of temples, rice terraces, surf and sunsets: green Ubud, the southern beaches and the cliffs of Uluwatu. Before planning, check the entry arrangements for Israeli passport holders carefully.' },
    highlights: [
      { he: 'טרסות האורז של טגללאנג', en: 'The Tegallalang rice terraces' },
      { he: 'שקיעה במקדש אולואוואטו וריקוד קצ׳אק', en: 'Sunset at Uluwatu Temple and a Kecak dance' },
      { he: 'זריחה על הר בטור', en: 'Sunrise on Mount Batur' },
      { he: 'מקדש טאנה לוט על הסלע בים', en: 'Tanah Lot, the temple on a sea rock' },
      { he: 'שיעור גלישה בצ׳אנגו', en: 'A surf lesson in Canggu' },
      { he: 'הצוקים של נוסה פנידה', en: 'The cliffs of Nusa Penida' }
    ],
    areas: [
      { name: { he: 'אובוד', en: 'Ubud' }, forWhom: { he: 'ג׳ונגל, טרסות, יוגה ותרבות — לזוגות ולשקט', en: 'Jungle, terraces, yoga and culture — for couples and quiet' } },
      { name: { he: 'סמיניאק', en: 'Seminyak' }, forWhom: { he: 'מסעדות, בוטיקים ומועדוני חוף', en: 'Restaurants, boutiques and beach clubs' } },
      { name: { he: 'צ׳אנגו', en: 'Canggu' }, forWhom: { he: 'גולשים, בתי קפה ואווירה צעירה', en: 'Surfers, cafés and a young vibe' } },
      { name: { he: 'אולואוואטו', en: 'Uluwatu' }, forWhom: { he: 'צוקים, חופים קטנים ונוף — לזוגות ולגולשים מנוסים', en: 'Cliffs, small beaches and views — for couples and experienced surfers' } },
      { name: { he: 'נוסה דואה וסאנור', en: 'Nusa Dua & Sanur' }, forWhom: { he: 'ים רגוע וריזורטים — הכי נוח למשפחות', en: 'Calm sea and resorts — the easiest for families' } }
    ],
    attractions: [
      { name: { he: 'יער הקופים הקדוש באובוד', en: 'Sacred Monkey Forest Sanctuary, Ubud' }, kind: 'park', durationH: 1.5, tags: ['nature', 'family'], area: 'Ubud' },
      { name: { he: 'טרסות האורז של טגללאנג', en: 'Tegallalang Rice Terraces' }, kind: 'nature', durationH: 2, tags: ['nature'], area: 'Ubud', mustSee: true },
      { name: { he: 'שביל הרכס קמפוהאן', en: 'Campuhan Ridge Walk' }, kind: 'nature', durationH: 1.5, tags: ['nature'], area: 'Ubud' },
      { name: { he: 'שוק האמנות של אובוד', en: 'Ubud Art Market' }, kind: 'market', durationH: 1.5, tags: ['shopping'], area: 'Ubud' },
      { name: { he: 'מקדש המים טירטה אמפול', en: 'Tirta Empul water temple' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'Ubud' },
      { name: { he: 'טיפוס זריחה על הר בטור', en: 'Mount Batur sunrise trek' }, kind: 'nature', durationH: 6, tags: ['adventure', 'nature', 'teens'], area: 'Ubud' },
      { name: { he: 'מקדש טאנה לוט', en: 'Tanah Lot Temple' }, kind: 'religious', durationH: 2, tags: ['culture', 'couple', 'evening'], area: 'Canggu', mustSee: true },
      { name: { he: 'מקדש אולואוואטו וריקוד קצ׳אק בשקיעה', en: 'Uluwatu Temple & sunset Kecak dance' }, kind: 'religious', durationH: 3, tags: ['culture', 'couple', 'evening'], area: 'Uluwatu', mustSee: true },
      { name: { he: 'חוף פדנג פדנג', en: 'Padang Padang Beach' }, kind: 'beach', durationH: 3, tags: ['beach'], area: 'Uluwatu' },
      { name: { he: 'חוף סמיניאק בשקיעה', en: 'Seminyak Beach at sunset' }, kind: 'beach', durationH: 2, tags: ['beach', 'couple', 'evening'], area: 'Seminyak' },
      { name: { he: 'שיעור גלישה בצ׳אנגו', en: 'Surf lesson in Canggu' }, kind: 'experience', durationH: 2, tags: ['adventure', 'beach', 'teens'], area: 'Canggu' },
      { name: { he: 'טרסות האורז של ג׳טילואיה', en: 'Jatiluwih Rice Terraces' }, kind: 'nature', durationH: 3, tags: ['nature'] }
    ],
    dayTrips: [
      { name: { he: 'נוסה פנידה', en: 'Nusa Penida' }, hours: 1, note: { he: 'סירה מהירה מסאנור; חוף קלינגקינג וצוקים — דרכים קשות, יום ארוך', en: 'Fast boat from Sanur; Kelingking Beach and cliffs — rough roads, a long day' }, priceIls: { low: 180, high: 330 }, kind: 'beach' },
      { name: { he: 'נוסה למבונגן', en: 'Nusa Lembongan' }, hours: 0.75, note: { he: 'אי רגוע לשנורקלינג; מתאים גם ללילה', en: 'A relaxed island for snorkelling; also good for a night' }, priceIls: { low: 150, high: 260 }, kind: 'beach' },
      { name: { he: 'מקדשי בסאקיה ולמפויאנג במזרח', en: 'Besakih and Lempuyang temples in the east' }, hours: 2, note: { he: 'נסיעה ארוכה עם נהג; בלמפויאנג יש תורים לצילום', en: 'A long drive with a driver; expect queues for photos at Lempuyang' }, priceIls: { low: 100, high: 300 }, kind: 'religious' }
    ],
    transport: { carRecommended: false, note: { he: 'הדרכים צפופות ואיטיות. הכי נוח לשכור נהג ליום; בערים — Grab או Gojek. קטנוע רק עם רישיון מתאים וביטוח שמכסה אותו. באלי גובה מס תיירות מהמבקרים.', en: 'Roads are congested and slow. Hiring a driver for the day is easiest; in towns use Grab or Gojek. A scooter only with the right licence and insurance that covers it. Bali charges visitors a tourist levy.' } },
    practical: {
      currency: 'IDR', language: { he: 'אינדונזית ובאלינזית; אנגלית באזורי התיירות', en: 'Indonesian and Balinese; English in tourist areas' }, timeZone: 'Asia/Makassar',
      visaNoteForIsraelis: { he: 'לאינדונזיה אין יחסים דיפלומטיים עם ישראל, והכניסה לבעלי דרכון ישראלי נעשית בהסדרים מיוחדים שמשתנים מעת לעת (למשל ויזה שמוסדרת מראש). אין להזמין לפני בדיקה במקורות הרשמיים ועם סוכן מנוסה.', en: 'Indonesia has no diplomatic relations with Israel, and entry for Israeli passport holders is through special arrangements that change from time to time (for example a visa arranged in advance). Do not book before checking official sources and with an experienced agent.' },
      kosher: { he: 'אין היצע כשר מקומי — להביא אוכל ארוז או לתאם ארוחות מראש.', en: 'No local kosher supply — bring packed food or arrange meals in advance.' },
      shabbat: { he: 'אין קהילה מקומית; מומלץ להישאר במלון אחד בשבת ולהכין את הכול מראש.', en: 'There is no local community; stay at one hotel over Shabbat and prepare everything in advance.' }
    },
    seasonsNote: { he: 'אפריל–אוקטובר: העונה היבשה, עם שיא תיירים ביולי–אוגוסט. נובמבר–מרץ: עונת הגשמים — ממטרים כבדים, לחות גבוהה ומחירים נמוכים יותר.', en: 'April–October is the dry season, with peak crowds in July–August. November–March is the rainy season — heavy showers, high humidity and lower prices.' },
    advisory: { he: 'המטה לביטחון לאומי מפרסם אזהרות מסע גם לגבי אינדונזיה, ורמתן משתנה. יש לבדוק את האזהרה העדכנית באתר המל״ל לפני ההזמנה.', en: 'Israel’s National Security Council also publishes travel warnings for Indonesia, and their level changes. Check the current warning on the NSC website before booking.' }
  },
  {
    id: 'sri-lanka', code: 'CMB', airports: ['CMB'],
    name: { he: 'סרי לנקה', en: 'Sri Lanka' }, country: { he: 'סרי לנקה', en: 'Sri Lanka' }, region: 'asia',
    tags: ['nature', 'culture', 'beach', 'adventure', 'couple', 'low_budget', 'week_long'],
    bestMonths: [12, 1, 2, 3, 4], flightHours: 10, direct: false, budgetLevel: 1, dailyBudgetIls: { low: 100, mid: 220, high: 500 },
    summary: { he: 'אי קטן עם הרבה בפנים: מבצר סיגיריה, מקדשים עתיקים, מטעי תה בהרים, ספארי פילים וחופים בדרום — טיול מגוון במחירים נמוכים.', en: 'A small island packed with variety: Sigiriya rock fortress, ancient temples, hill-country tea estates, elephant safaris and southern beaches — a varied trip at low prices.' },
    highlights: [
      { he: 'טיפוס על סלע סיגיריה', en: 'Climbing Sigiriya Rock' },
      { he: 'נסיעת הרכבת הנופית בין קנדי לאלה', en: 'The scenic train between Kandy and Ella' },
      { he: 'מטעי תה בהרים', en: 'Tea estates in the hills' },
      { he: 'ספארי בפארק יאלה או אודאוואלאווה', en: 'A safari in Yala or Udawalawe' },
      { he: 'מבצר גאלה', en: 'Galle Fort' },
      { he: 'צפייה בלווייתנים במיריסה (בעונה)', en: 'Whale watching off Mirissa (in season)' }
    ],
    areas: [
      { name: { he: 'המשולש התרבותי', en: 'The Cultural Triangle' }, forWhom: { he: 'סיגיריה, דמבולה ופולונארווה — היסטוריה ומקדשים', en: 'Sigiriya, Dambulla and Polonnaruwa — history and temples' } },
      { name: { he: 'קנדי', en: 'Kandy' }, forWhom: { he: 'מקדש השן וגנים בוטניים; שער לאזור ההרים', en: 'The Temple of the Tooth and botanical gardens; gateway to the hills' } },
      { name: { he: 'אלה והרי התה', en: 'Ella & the tea hills' }, forWhom: { he: 'מסלולי הליכה, נוף ומזג אוויר קריר — לזוגות ולמטיילים', en: 'Walks, views and cooler weather — for couples and hikers' } },
      { name: { he: 'החוף הדרומי (גאלה ומיריסה)', en: 'The south coast (Galle & Mirissa)' }, forWhom: { he: 'חופים, מבצר קולוניאלי ולווייתנים — לסיום רגוע', en: 'Beaches, a colonial fort and whales — for a relaxed finish' } }
    ],
    attractions: [
      { name: { he: 'סלע סיגיריה', en: 'Sigiriya Rock Fortress' }, kind: 'landmark', durationH: 3, tags: ['culture', 'adventure'], area: 'The Cultural Triangle', mustSee: true },
      { name: { he: 'מקדש המערות בדמבולה', en: 'Dambulla Cave Temple' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'The Cultural Triangle' },
      { name: { he: 'העיר העתיקה פולונארווה', en: 'Ancient City of Polonnaruwa' }, kind: 'landmark', durationH: 3, tags: ['culture'], area: 'The Cultural Triangle' },
      { name: { he: 'מקדש השן בקנדי', en: 'Temple of the Tooth, Kandy' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'Kandy', mustSee: true },
      { name: { he: 'הגנים הבוטניים בפרדניה', en: 'Peradeniya Royal Botanical Gardens' }, kind: 'park', durationH: 2, tags: ['nature', 'family'], area: 'Kandy' },
      { name: { he: 'גשר תשע הקשתות', en: 'Nine Arch Bridge' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Ella & the tea hills' },
      { name: { he: 'פסגת אדם הקטנה', en: 'Little Adam’s Peak' }, kind: 'viewpoint', durationH: 2, tags: ['nature'], area: 'Ella & the tea hills' },
      { name: { he: 'הרכבת הנופית קנדי–אלה', en: 'Kandy–Ella scenic train' }, kind: 'experience', durationH: 7, tags: ['nature', 'couple'], area: 'Kandy', mustSee: true },
      { name: { he: 'מישורי הורטון וקצה העולם', en: 'Horton Plains & World’s End' }, kind: 'nature', durationH: 4, tags: ['nature', 'adventure'], area: 'Ella & the tea hills' },
      { name: { he: 'ספארי בפארק הלאומי יאלה', en: 'Yala National Park safari' }, kind: 'nature', durationH: 5, tags: ['nature', 'adventure'], area: 'Yala (Tissamaharama)' },
      { name: { he: 'פארק הפילים אודאוואלאווה', en: 'Udawalawe National Park' }, kind: 'nature', durationH: 4, tags: ['nature', 'family'], area: 'Udawalawe' },
      { name: { he: 'מבצר גאלה', en: 'Galle Fort' }, kind: 'neighborhood', durationH: 3, tags: ['culture'], area: 'The south coast (Galle & Mirissa)', mustSee: true },
      { name: { he: 'שייט לצפייה בלווייתנים במיריסה', en: 'Whale-watching cruise from Mirissa' }, kind: 'experience', durationH: 4, tags: ['nature'], area: 'The south coast (Galle & Mirissa)', months: [1, 2, 3, 4, 11, 12] }
    ],
    dayTrips: [
      { name: { he: 'פולונארווה מהמשולש התרבותי', en: 'Polonnaruwa from the Cultural Triangle' }, hours: 1.5, note: { he: 'מומלץ באופניים בין החורבות, בשעות הבוקר', en: 'Best by bicycle among the ruins, in the morning' }, priceIls: { low: 150, high: 300 }, kind: 'landmark' },
      { name: { he: 'מישורי הורטון', en: 'Horton Plains' }, hours: 2, note: { he: 'יציאה לפני הזריחה כדי לראות את הנוף לפני העננים', en: 'Leave before dawn to see the view before the clouds roll in' }, priceIls: { low: 150, high: 350 }, kind: 'nature' },
      { name: { he: 'גאלה מהחוף הדרומי', en: 'Galle from the south coast' }, hours: 1, note: { he: 'סיור רגלי על חומות המבצר בשעות אחר הצהריים', en: 'A walk on the fort walls in the late afternoon' }, priceIls: { low: 20, high: 150 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'הדרך הנפוצה היא רכב עם נהג לכל הטיול; הרכבות נופיות אבל איטיות ועמוסות — כדאי לשריין מקום מראש. נוהגים בצד שמאל ונהיגה עצמית לא מומלצת.', en: 'The usual way is a car with driver for the whole trip; trains are scenic but slow and crowded — reserve seats in advance. Traffic drives on the left and self-driving is not advised.' } },
    practical: {
      currency: 'LKR', language: { he: 'סינהלית וטמילית; אנגלית נפוצה', en: 'Sinhala and Tamil; English is widely spoken' }, timeZone: 'Asia/Colombo',
      visaNoteForIsraelis: { he: 'בדרך כלל נדרש אישור כניסה אלקטרוני (ETA) שמגישים באתר הרשמי לפני הטיסה. התנאים השתנו לאחרונה — יש לבדוק במקורות הרשמיים לפני כל הזמנה.', en: 'An electronic travel authorisation (ETA) obtained on the official site before flying is generally required. Terms have changed recently — always check official sources before booking.' },
      kosher: { he: 'אין כמעט היצע כשר; בעונה יש פעילות חב״ד במוקדי תיירים ישראלים — לבדוק מראש. לרוב צריך להביא אוכל ארוז.', en: 'Kosher food is very limited; in season Chabad is active in Israeli travel hubs — check in advance. Packed food is usually needed.' },
      shabbat: { he: 'כדאי לתכנן את השבת בחוף או בעיירה אחת, בלי נסיעות, ולהכין מראש.', en: 'Plan Shabbat in one beach town or village, without travel, and prepare in advance.' }
    },
    seasonsNote: { he: 'דצמבר–אפריל: העונה הטובה לחוף הדרומי והמערבי ולאזור ההרים. מאי–ספטמבר: מונסון בדרום־מערב, אבל עונה טובה לחוף המזרחי (ארוגם ביי). אוקטובר–נובמבר גשום ברוב האי.', en: 'December–April is the best season for the south and west coasts and the hill country. May–September brings the south-west monsoon, but is the season for the east coast (Arugam Bay). October–November is wet across most of the island.' }
  },
  {
    id: 'goa', code: 'GOI', airports: ['GOI'],
    name: { he: 'גואה', en: 'Goa' }, country: { he: 'הודו', en: 'India' }, region: 'asia',
    tags: ['beach', 'relaxation', 'nightlife', 'food', 'culture', 'low_budget', 'week_long'],
    bestMonths: [11, 12, 1, 2, 3], flightHours: 10, direct: false, budgetLevel: 1, dailyBudgetIls: { low: 90, mid: 200, high: 450 },
    summary: { he: 'החוף המערבי של הודו: חופי דקלים, שקיעות, שווקי לילה וכנסיות פורטוגזיות — מצפון תוסס עם מסיבות ועד דרום שקט ורגוע. זול, חמים ומוכר למטיילים ישראלים.', en: 'India’s west coast: palm-fringed beaches, sunsets, night markets and Portuguese churches — from a lively, party-loving north to a calm, quiet south. Cheap, warm and well known to Israeli travellers.' },
    highlights: [
      { he: 'שקיעה בחוף פאלולם', en: 'Sunset at Palolem Beach' },
      { he: 'הכנסיות של גואה העתיקה', en: 'The churches of Old Goa' },
      { he: 'שוק הפשפשים של אנג׳ונה ושוק הלילה בארפורה', en: 'The Anjuna flea market and the Arpora night market' },
      { he: 'הרובע הלטיני פונטיינאס בפנג׳ים', en: 'The Fontainhas Latin Quarter in Panaji' },
      { he: 'מפלי דודסאגר', en: 'Dudhsagar Falls' },
      { he: 'אוכל גואני ופירות ים', en: 'Goan cooking and seafood' }
    ],
    areas: [
      { name: { he: 'צפון גואה (אנג׳ונה, וגאטור, ארמבול)', en: 'North Goa (Anjuna, Vagator, Arambol)' }, forWhom: { he: 'מסיבות, שווקים ואווירה צעירה — הישראלים מכירים', en: 'Parties, markets and a young vibe — familiar to Israelis' } },
      { name: { he: 'קלנגוט ובאגה', en: 'Calangute & Baga' }, forWhom: { he: 'חופים עמוסים, מסעדות וחיי לילה', en: 'Busy beaches, restaurants and nightlife' } },
      { name: { he: 'פנג׳ים וגואה העתיקה', en: 'Panaji & Old Goa' }, forWhom: { he: 'היסטוריה, כנסיות ותרבות — ליום או שניים', en: 'History, churches and culture — for a day or two' } },
      { name: { he: 'דרום גואה (פאלולם, אגונדה)', en: 'South Goa (Palolem, Agonda)' }, forWhom: { he: 'חופים שקטים ומנוחה — לזוגות ולמשפחות', en: 'Quiet beaches and rest — for couples and families' } }
    ],
    attractions: [
      { name: { he: 'בזיליקת בום ג׳יזוס', en: 'Basilica of Bom Jesus' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Panaji & Old Goa', mustSee: true },
      { name: { he: 'קתדרלת סה', en: 'Se Cathedral' }, kind: 'religious', durationH: 0.75, tags: ['culture'], area: 'Panaji & Old Goa' },
      { name: { he: 'פונטיינאס — הרובע הלטיני', en: 'Fontainhas — the Latin Quarter' }, kind: 'neighborhood', durationH: 2, tags: ['culture', 'couple'], area: 'Panaji & Old Goa', mustSee: true },
      { name: { he: 'שוק הפשפשים של אנג׳ונה (ימי רביעי)', en: 'Anjuna Flea Market (Wednesdays)' }, kind: 'market', durationH: 2.5, tags: ['shopping'], area: 'North Goa (Anjuna, Vagator, Arambol)', months: [1, 2, 3, 4, 11, 12] },
      { name: { he: 'שוק הלילה של ארפורה (מוצאי שבת)', en: 'Arpora Saturday Night Market' }, kind: 'market', durationH: 3, tags: ['shopping', 'food', 'nightlife', 'evening'], area: 'Calangute & Baga', months: [1, 2, 3, 4, 11, 12] },
      { name: { he: 'מבצר צ׳פורה', en: 'Chapora Fort' }, kind: 'viewpoint', durationH: 1, tags: ['culture', 'evening'], area: 'North Goa (Anjuna, Vagator, Arambol)' },
      { name: { he: 'חוף ארמבול', en: 'Arambol Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'relaxation'], area: 'North Goa (Anjuna, Vagator, Arambol)', months: [1, 2, 3, 4, 5, 10, 11, 12] },
      { name: { he: 'מבצר אגואדה', en: 'Fort Aguada' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Calangute & Baga' },
      { name: { he: 'חוף פאלולם', en: 'Palolem Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'family'], area: 'South Goa (Palolem, Agonda)', mustSee: true, months: [1, 2, 3, 4, 5, 10, 11, 12] },
      { name: { he: 'חוף אגונדה', en: 'Agonda Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'relaxation'], area: 'South Goa (Palolem, Agonda)', months: [1, 2, 3, 4, 5, 10, 11, 12] },
      { name: { he: 'חוף הפרפרים בשייט מפאלולם', en: 'Butterfly Beach by boat from Palolem' }, kind: 'beach', durationH: 3, tags: ['beach', 'nature'], area: 'South Goa (Palolem, Agonda)', months: [1, 2, 3, 4, 5, 10, 11, 12] },
      { name: { he: 'מטע תבלינים באזור פונדה', en: 'A spice plantation near Ponda' }, kind: 'experience', durationH: 3, tags: ['food', 'nature'], area: 'Ponda' },
      { name: { he: 'מקדש מנגשי', en: 'Shri Mangueshi Temple' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Ponda' }
    ],
    dayTrips: [
      { name: { he: 'מפלי דודסאגר', en: 'Dudhsagar Falls' }, hours: 2.5, note: { he: 'בג׳יפ דרך שמורת טבע; במונסון הגישה לעיתים סגורה', en: 'By jeep through a nature reserve; access is sometimes closed in the monsoon' }, priceIls: { low: 110, high: 250 }, kind: 'nature', months: [1, 2, 3, 4, 5, 10, 11, 12] },
      { name: { he: 'גוקרנה', en: 'Gokarna' }, hours: 3, note: { he: 'חופים שקטים ועיר מקדשים במדינת קרנטקה; עדיף ללון', en: 'Quiet beaches and a temple town in Karnataka; better as an overnight' }, priceIls: { low: 80, high: 300 }, kind: 'beach' },
      { name: { he: 'האמפי', en: 'Hampi' }, hours: 8, note: { he: 'לא טיול יום — נוף סלעים ומקדשים עתיקים, דורש יומיים לפחות', en: 'Not a day trip — boulder landscapes and ancient temples, needs at least two days' } }
    ],
    transport: { carRecommended: false, note: { he: 'מוניות ונהגים פרטיים לנסיעות ארוכות; בין חופים סמוכים — ריקשה או מונית. קטנוע רק עם רישיון מתאים וביטוח שמכסה אותו. נוהגים בצד שמאל.', en: 'Taxis and private drivers for longer journeys; between nearby beaches, a rickshaw or taxi. A scooter only with the right licence and insurance that covers it. Traffic drives on the left.' } },
    practical: {
      currency: 'INR', language: { he: 'קונקני, הינדי ואנגלית', en: 'Konkani, Hindi and English' }, timeZone: 'Asia/Kolkata',
      visaNoteForIsraelis: { he: 'בדרך כלל ישראלים צריכים ויזה להודו — לרוב ויזה אלקטרונית (e-Visa) שמגישים באתר הרשמי לפני הטיסה. הכללים משתנים — יש לבדוק במקורות הרשמיים לפני כל הזמנה.', en: 'Israelis generally need a visa for India — usually an e-Visa applied for on the official site before flying. Rules change — always check official sources before booking.' },
      kosher: { he: 'בעונה יש פעילות חב״ד בצפון גואה עם ארוחות; מחוץ לזה כמעט אין כשרות — לבדוק ולתאם מראש. מנות צמחוניות נפוצות מאוד.', en: 'In season Chabad is active in North Goa with meals; otherwise kosher food is scarce — check and arrange in advance. Vegetarian food is very common.' },
      shabbat: { he: 'מי ששומר שבת יבחר לינה בצפון גואה, קרוב לפעילות חב״ד, ויתאם מראש.', en: 'Shabbat observers should stay in North Goa, close to Chabad activity, and arrange in advance.' }
    },
    seasonsNote: { he: 'נובמבר–מרץ: עונה יבשה ונעימה — שיא בדצמבר–ינואר. אפריל–מאי חם ולח מאוד. יוני–ספטמבר: מונסון כבד, חלק מהמקומות בחוף סגורים.', en: 'November–March is the dry, pleasant season, peaking in December–January. April–May is very hot and humid. June–September brings a heavy monsoon, and some beach places close.' }
  }
];
