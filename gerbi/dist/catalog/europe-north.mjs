// Catalog data (spec 23): France, the UK, the Netherlands, Germany, Czechia. Shape: dist/catalog.mjs.
// Budget figures are rough per-person-per-day estimates in ₪ without flights.
// dayTrips[].priceIls = rough ₪ per adult, ESTIMATES (Nov 2026): low ≈ do-it-yourself public transport + main entry fee,
// high ≈ a typical organised group tour from the base; converted at about €1=₪4, $1=₪3.7, £1=₪4.7 and rounded. Show as estimates.
const SCHENGEN_VISA = { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' };
const UK_VISA = { he: 'אין צורך בוויזה לביקור קצר, אבל בעלי דרכון ישראלי צריכים אישור נסיעה אלקטרוני (ETA) לפני הטיסה לבריטניה. הכללים משתנים — יש לבדוק במקורות הרשמיים.', en: 'No visa is needed for a short visit, but Israeli passport holders need an Electronic Travel Authorisation (ETA) before flying to the UK. Rules change — check official sources.' };

export default [
  {
    id: 'paris', trip: 'paris', code: 'PAR', airports: ['CDG', 'ORY'],
    name: { he: 'פריז', en: 'Paris' }, country: { he: 'צרפת', en: 'France' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'couple', 'shopping', 'direct_flight', 'kosher', 'luxury', 'family'],
    bestMonths: [4, 5, 6, 9, 10, 12], flightHours: 5, direct: true, budgetLevel: 4, dailyBudgetIls: { low: 250, mid: 450, high: 850 },
    summary: { he: 'עיר האורות: מוזיאונים ענקיים, שדרות וגנים, בתי קפה ומאפיות בכל פינה, ורובע יהודי תוסס במארה — מתאימה לזוגות, למשפחות ולכל מי שאוהב אוכל ותרבות.', en: 'The City of Light: world-class museums, boulevards and gardens, cafés and bakeries on every corner, and a lively Jewish quarter in the Marais — for couples, families and anyone who loves food and culture.' },
    highlights: [
      { he: 'מגדל אייפל ושייט על הסן', en: 'The Eiffel Tower and a cruise on the Seine' },
      { he: 'הלובר ומוזיאון ד׳אורסיי', en: 'The Louvre and the Musée d’Orsay' },
      { he: 'מונמרטר והסקרה קר', en: 'Montmartre and the Sacré-Cœur' },
      { he: 'המארה ורחוב רוזייה', en: 'The Marais and rue des Rosiers' },
      { he: 'ארמון ורסאי וגניו', en: 'The Palace of Versailles and its gardens' },
      { he: 'בתי קפה, מאפיות וקרואסונים', en: 'Cafés, bakeries and croissants' },
      { he: 'קניות בשאנז אליזה ובגלרי לאפייט', en: 'Shopping on the Champs-Élysées and at Galeries Lafayette' }
    ],
    areas: [
      { name: { he: 'המארה', en: 'Le Marais' }, forWhom: { he: 'מרכזי, אופנתי וקרוב למסעדות כשרות ולבתי כנסת', en: 'Central and stylish, close to kosher restaurants and synagogues' }, price: 3, pros: { he: 'מרכזי ותוסס — אוכל כשר ובתי כנסת ברגל', en: 'Central and lively — kosher food and synagogues on foot' }, cons: { he: 'חדרים קטנים ויקרים, הומה בסופ״ש', en: 'Small, pricey rooms; busy at weekends' } },
      { name: { he: 'סן ז׳רמן והרובע הלטיני', en: 'Saint-Germain & the Latin Quarter' }, forWhom: { he: 'זוגות וביקור ראשון — בתי קפה, גלריות והכול ברגל', en: 'Couples and first-timers — cafés, galleries and everything on foot' }, price: 3, pros: { he: 'יפה, בטוח והכול ברגל', en: 'Beautiful, safe and walkable' }, cons: { he: 'מהאזורים היקרים בעיר', en: 'Among the priciest areas in town' } },
      { name: { he: 'האופרה והשדרות הגדולות', en: 'Opéra & the Grands Boulevards' }, forWhom: { he: 'מי שבא לקניות ורוצה תחבורה נוחה', en: 'Shoppers who want good transport links' }, price: 2, pros: { he: 'מטרו לכל הכיוונים וקניות ליד המלון', en: 'Metro in every direction and shopping on the doorstep' }, cons: { he: 'עסוק ופחות אינטימי בערב', en: 'Busy and less charming in the evening' } },
      { name: { he: 'הרובע ה־7 (ליד מגדל אייפל)', en: '7th arrondissement (near the Eiffel Tower)' }, forWhom: { he: 'משפחות — שקט, ירוק ויקר יחסית', en: 'Families — calm, green and fairly pricey' }, price: 3, pros: { he: 'שקט וירוק, מגדל אייפל במרחק הליכה', en: 'Calm and green, the Eiffel Tower within a walk' }, cons: { he: 'ערבים שקטים, רחוק מהמארה', en: 'Quiet evenings, far from the Marais' } },
      { name: { he: 'מונמרטר', en: 'Montmartre' }, forWhom: { he: 'אווירה של כפר בתוך העיר ומחירים נוחים יותר, עם עליות', en: 'A village feel within the city and lower prices, with hills' }, price: 1, pros: { he: 'אווירת כפר ומחירים נוחים יותר', en: 'A village feel and lower prices' }, cons: { he: 'עליות ומדרגות; פיגאל הסמוכה פחות נעימה בלילה', en: 'Hills and stairs; nearby Pigalle is seedy at night' } }
    ],
    attractions: [
      { name: { he: 'מגדל אייפל', en: 'The Eiffel Tower' }, area: '7th arrondissement (near the Eiffel Tower)', kind: 'landmark', durationH: 2, tags: ['couple', 'family'], mustSee: true },
      { name: { he: 'מוזיאון הלובר', en: 'The Louvre' }, kind: 'museum', durationH: 3.5, tags: ['culture'], area: 'Louvre & Tuileries', mustSee: true },
      { name: { he: 'מוזיאון ד׳אורסיי', en: 'Musée d’Orsay' }, area: '7th arrondissement (near the Eiffel Tower)', kind: 'museum', durationH: 2.5, tags: ['culture'] },
      { name: { he: 'קתדרלת נוטרדאם', en: 'Notre-Dame Cathedral' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Île de la Cité', mustSee: true },
      { name: { he: 'סנט שאפל', en: 'Sainte-Chapelle' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Île de la Cité' },
      { name: { he: 'מונמרטר והסקרה קר', en: 'Montmartre & Sacré-Cœur' }, area: 'Montmartre', kind: 'neighborhood', durationH: 2.5, tags: ['culture', 'couple'], mustSee: true },
      { name: { he: 'שער הניצחון ושאנז אליזה', en: 'Arc de Triomphe & Champs-Élysées' }, kind: 'landmark', durationH: 2, tags: ['shopping'], area: 'Champs-Élysées' },
      { name: { he: 'שייט על הסן', en: 'Seine river cruise' }, kind: 'experience', durationH: 1, tags: ['couple', 'family'], area: '7th arrondissement (near the Eiffel Tower)' },
      { name: { he: 'גני לוקסמבורג', en: 'Luxembourg Gardens' }, area: 'Saint-Germain & the Latin Quarter', kind: 'park', durationH: 1.5, tags: ['family', 'relaxation'] },
      { name: { he: 'המארה ורחוב רוזייה', en: 'Le Marais & rue des Rosiers' }, area: 'Le Marais', kind: 'neighborhood', durationH: 2, tags: ['culture', 'food', 'kosher'] },
      { name: { he: 'מוזיאון האורנז׳רי', en: 'Musée de l’Orangerie' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Louvre & Tuileries' },
      { name: { he: 'גג גלרי לאפייט', en: 'Galeries Lafayette rooftop' }, area: 'Opéra & the Grands Boulevards', kind: 'viewpoint', durationH: 1, tags: ['shopping'] }
    ],
    dayTrips: [
      { name: { he: 'ארמון ורסאי', en: 'Palace of Versailles' }, hours: 0.75, note: { he: 'ברכבת RER; כדאי להזמין כרטיסים מראש ולהקדיש יום שלם עם הגנים', en: 'By RER train; book tickets ahead and give it a full day with the gardens' }, priceIls: { low: 150, high: 420 }, kind: 'landmark' },
      { name: { he: 'דיסנילנד פריז', en: 'Disneyland Paris' }, hours: 0.75, note: { he: 'ברכבת RER — יום מושלם עם ילדים', en: 'By RER train — a perfect day with children' }, priceIls: { low: 300, high: 600 }, kind: 'experience' },
      { name: { he: 'ז׳יברני — הגנים של מונה', en: 'Giverny — Monet’s gardens' }, hours: 1.25, note: { he: 'רכבת לוורנון ומשם שאטל; פתוח מאפריל עד אוקטובר בלבד', en: 'Train to Vernon, then a shuttle; open April to October only' }, priceIls: { low: 220, high: 500 }, kind: 'park', months: [4, 5, 6, 7, 8, 9, 10] },
      { name: { he: 'ריימס ואזור השמפניה', en: 'Reims & the Champagne region' }, hours: 0.75, note: { he: 'רכבת מהירה; קתדרלה ומרתפי שמפניה', en: 'High-speed train; a cathedral and champagne cellars' }, priceIls: { low: 280, high: 800 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'המטרו מגיע כמעט לכל מקום, והרבה הולכים ברגל. משארל דה גול יש רכבת RER למרכז. רכב בעיר — לא כדאי.', en: 'The metro reaches almost everywhere and much is walkable. The RER train links Charles de Gaulle to the centre. Don’t drive in the city.' } },
    practical: {
      currency: 'EUR', language: { he: 'צרפתית; אנגלית במקומות תיירותיים', en: 'French; English in tourist areas' }, timeZone: 'Europe/Paris',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'אחד היצעי הכשרות הגדולים באירופה — במארה, ברובעים ה־17 וה־19 ועוד; כדאי לבדוק את תעודת הכשרות בכל מקום.', en: 'One of Europe’s largest kosher scenes — in the Marais, the 17th and 19th arrondissements and beyond; check each place’s certification.' },
      shabbat: { he: 'קהילה יהודית גדולה, בתי כנסת רבים ובתי חב״ד; לינה במארה מאפשרת להגיע לבית כנסת ברגל.', en: 'A large Jewish community, many synagogues and Chabad houses; staying in the Marais keeps a synagogue within walking distance.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–אוקטובר נעימים במיוחד. יולי–אוגוסט חמים ועמוסים בתיירים; דצמבר יפה עם קישוטי החגים, אבל קר וגשום.', en: 'April–June and September–October are especially pleasant. July–August is hot and crowded; December is pretty with festive lights but cold and wet.' }
  },
  {
    id: 'nice', code: 'NCE', airports: ['NCE'],
    name: { he: 'ניס והריביירה הצרפתית', en: 'Nice & the Côte d’Azur' }, country: { he: 'צרפת', en: 'France' }, region: 'europe',
    tags: ['beach', 'couple', 'relaxation', 'culture', 'food', 'luxury', 'short_break', 'direct_flight'],
    bestMonths: [5, 6, 7, 8, 9, 10], flightHours: 4, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 230, mid: 400, high: 750 },
    summary: { he: 'ים כחול, טיילת ארוכה ועיר עתיקה צבעונית — בסיס נוח לריביירה הצרפתית, עם מונקו, קאן וכפרי צוקים במרחק נסיעה קצרה ברכבת.', en: 'Blue sea, a long promenade and a colourful old town — an easy base for the French Riviera, with Monaco, Cannes and clifftop villages a short train ride away.' },
    highlights: [
      { he: 'הטיילת של האנגלים', en: 'The Promenade des Anglais' },
      { he: 'העיר העתיקה ושוק קור סלאיה', en: 'The old town and the Cours Saleya market' },
      { he: 'התצפית מגבעת הטירה', en: 'The view from Castle Hill' },
      { he: 'יום במונקו ובמונטה קרלו', en: 'A day in Monaco and Monte Carlo' },
      { he: 'הכפר אז שעל הצוק', en: 'The clifftop village of Èze' },
      { he: 'מוזיאוני שאגאל ומאטיס', en: 'The Chagall and Matisse museums' }
    ],
    areas: [
      { name: { he: 'העיר העתיקה (ויה ניס)', en: 'Vieux Nice' }, forWhom: { he: 'זוגות שרוצים אווירה, מסעדות וקרבה לים', en: 'Couples who want atmosphere, restaurants and the sea nearby' }, price: 2, pros: { he: 'סמטאות, שוק ומסעדות ליד הים', en: 'Alleys, market and restaurants by the sea' }, cons: { he: 'רועש בלילה וחדרים קטנים', en: 'Noisy at night, small rooms' } },
      { name: { he: 'לאורך הטיילת', en: 'Along the Promenade' }, forWhom: { he: 'משפחות ומי שרוצה נוף לים וגישה לחוף', en: 'Families and anyone after sea views and beach access' }, price: 3, pros: { he: 'נוף לים וגישה לחוף', en: 'Sea views and beach access' }, cons: { he: 'יקר, תנועה על הטיילת וחוף חלוקים', en: 'Pricey, traffic, pebbly beach' } },
      { name: { he: 'כיכר מסנה ורובע הזהב', en: 'Place Masséna & the Carré d’Or' }, forWhom: { he: 'מרכזי — קניות, טראם ונוחות', en: 'Central — shopping, tram and convenience' }, price: 2, pros: { he: 'מרכזי, חשמלית וקניות', en: 'Central, tram and shopping' }, cons: { he: 'עסוק ופחות אופי', en: 'Busy, less character' } },
      { name: { he: 'הנמל', en: 'The Port' }, forWhom: { he: 'שכונה מקומית ושקטה יותר, עם מסעדות דגים', en: 'A quieter local area with seafood restaurants' }, price: 2, pros: { he: 'שקט, מקומי ומסעדות דגים', en: 'Quiet, local, seafood restaurants' }, cons: { he: 'קצת רחוק מהחופים המרכזיים', en: 'A bit far from the main beaches' } }
    ],
    attractions: [
      { name: { he: 'הטיילת של האנגלים', en: 'Promenade des Anglais' }, area: 'Along the Promenade', kind: 'landmark', durationH: 1.5, tags: ['couple', 'family'], mustSee: true },
      { name: { he: 'העיר העתיקה של ניס', en: 'Vieux Nice' }, area: 'Vieux Nice', kind: 'neighborhood', durationH: 2, tags: ['culture', 'food'], mustSee: true },
      { name: { he: 'שוק קור סלאיה', en: 'Cours Saleya market' }, area: 'Vieux Nice', kind: 'market', durationH: 1, tags: ['food'] },
      { name: { he: 'גבעת הטירה', en: 'Castle Hill (Colline du Château)' }, kind: 'viewpoint', durationH: 1.5, tags: ['couple', 'family'], area: 'Vieux Nice', mustSee: true },
      { name: { he: 'כיכר מסנה', en: 'Place Masséna' }, area: 'Place Masséna & the Carré d’Or', kind: 'landmark', durationH: 0.5, tags: ['city'] },
      { name: { he: 'מוזיאון מארק שאגאל', en: 'Musée national Marc Chagall' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Cimiez' },
      { name: { he: 'מוזיאון מאטיס', en: 'Musée Matisse' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Cimiez' },
      { name: { he: 'החופים של ניס', en: 'Nice’s beaches' }, area: 'Along the Promenade', kind: 'beach', durationH: 3, tags: ['beach', 'relaxation'], months: [6, 7, 8, 9] },
      { name: { he: 'וילפרנש סור מר', en: 'Villefranche-sur-Mer' }, kind: 'neighborhood', durationH: 2.5, tags: ['beach', 'couple'], area: 'Villefranche-sur-Mer' },
      { name: { he: 'מסלול ההליכה בכף פרה', en: 'Cap Ferrat coastal path' }, kind: 'nature', durationH: 2.5, tags: ['nature'], area: 'Saint-Jean-Cap-Ferrat' },
      { name: { he: 'נמל לימפיה', en: 'Port Lympia' }, area: 'The Port', kind: 'neighborhood', durationH: 1.5, tags: ['food'] }
    ],
    dayTrips: [
      { name: { he: 'מונקו ומונטה קרלו', en: 'Monaco & Monte Carlo' }, hours: 0.5, note: { he: 'רכבת לאורך החוף; הקזינו, הנמל וארמון הנסיך', en: 'Coastal train; the casino, the harbour and the Prince’s Palace' }, priceIls: { low: 40, high: 300 }, kind: 'neighborhood' },
      { name: { he: 'אז', en: 'Èze' }, hours: 0.5, note: { he: 'אוטובוס מניס; כפר מימי הביניים על צוק מעל הים', en: 'Bus from Nice; a medieval village perched above the sea' }, priceIls: { low: 20, high: 250 }, kind: 'neighborhood' },
      { name: { he: 'אנטיב וקאן', en: 'Antibes & Cannes' }, hours: 0.5, note: { he: 'רכבת לאורך החוף; עיר עתיקה, נמל יאכטות והקרואזט', en: 'Coastal train; an old town, a yacht harbour and La Croisette' }, priceIls: { low: 60, high: 300 }, kind: 'neighborhood' },
      { name: { he: 'סן פול דה ונס', en: 'Saint-Paul-de-Vence' }, hours: 1, note: { he: 'כפר אמנים מוקף חומה; קל יותר ברכב', en: 'A walled artists’ village; easier by car' }, priceIls: { low: 20, high: 300 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'טראם מהשדה למרכז, ורכבות ואוטובוסים לאורך החוף למונקו, לקאן ולאנטיב. רכב נוח לכפרי ההרים, אבל החניה בעיר יקרה וקשה.', en: 'A tram runs from the airport to the centre, with trains and buses along the coast to Monaco, Cannes and Antibes. A car helps for the hill villages, but city parking is costly and scarce.' } },
    practical: {
      currency: 'EUR', language: { he: 'צרפתית; אנגלית במקומות תיירותיים', en: 'French; English in tourist areas' }, timeZone: 'Europe/Paris',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'יש קהילה יהודית ובית חב״ד, וכמה מסעדות וחנויות כשרות; כדאי לבדוק את תעודת הכשרות ולתאם מראש.', en: 'There is a Jewish community and a Chabad house, with a few kosher restaurants and shops; check certification and arrange in advance.' },
      shabbat: { he: 'יש בתי כנסת בעיר; לתאם ארוחות שבת עם חב״ד ולבחור לינה במרחק הליכה.', en: 'There are synagogues in town; arrange Shabbat meals with Chabad and stay within walking distance.' }
    },
    seasonsNote: { he: 'מאי–יוני וספטמבר–אוקטובר נעימים ופחות עמוסים. יולי–אוגוסט חמים, צפופים ויקרים; החורף מתון אבל לא לרחצה. החופים בניס מחלוקים, לא חול.', en: 'May–June and September–October are pleasant and less crowded. July–August is hot, busy and expensive; winter is mild but not for swimming. Nice’s beaches are pebbles, not sand.' }
  },
  {
    id: 'london', code: 'LON', airports: ['LHR', 'LGW', 'LTN', 'STN'],
    name: { he: 'לונדון', en: 'London' }, country: { he: 'בריטניה', en: 'United Kingdom' }, region: 'europe',
    tags: ['city', 'culture', 'shopping', 'family', 'with_children', 'food', 'nightlife', 'direct_flight', 'kosher'],
    bestMonths: [5, 6, 7, 8, 9, 12], flightHours: 5.5, direct: true, budgetLevel: 4, dailyBudgetIls: { low: 280, mid: 500, high: 950 },
    summary: { he: 'עיר ענקית ומגוונת: מוזיאונים גדולים בחינם, פארקים ירוקים, מחזות זמר בווסט אנד, שווקים וקניות — וקהילה יהודית גדולה עם הרבה אוכל כשר.', en: 'A vast, varied city: major museums with free entry, green parks, West End musicals, markets and shopping — and a large Jewish community with plenty of kosher food.' },
    highlights: [
      { he: 'המוזיאון הבריטי ומוזיאון הטבע — בכניסה חופשית', en: 'The British Museum and the Natural History Museum — free entry' },
      { he: 'מגדל לונדון ותכשיטי הכתר', en: 'The Tower of London and the Crown Jewels' },
      { he: 'ווסטמינסטר, ביג בן וארמון בקינגהאם', en: 'Westminster, Big Ben and Buckingham Palace' },
      { he: 'מחזמר בווסט אנד', en: 'A musical in the West End' },
      { he: 'שוק בורו ושוק קמדן', en: 'Borough Market and Camden Market' },
      { he: 'הייד פארק והפארקים המלכותיים', en: 'Hyde Park and the Royal Parks' },
      { he: 'סיור באולפני הארי פוטר', en: 'The Harry Potter studio tour' }
    ],
    areas: [
      { name: { he: 'ווסט אנד וקובנט גארדן', en: 'West End & Covent Garden' }, forWhom: { he: 'ביקור ראשון — תיאטראות, קניות ומסעדות', en: 'First-timers — theatres, shopping and restaurants' }, price: 3, pros: { he: 'תיאטראות, קניות ומסעדות — הכול קרוב', en: 'Theatres, shopping and restaurants, all close by' }, cons: { he: 'יקר ועמוס', en: 'Pricey and crowded' } },
      { name: { he: 'סאות׳ קנזינגטון', en: 'South Kensington' }, forWhom: { he: 'משפחות — ליד המוזיאונים והייד פארק', en: 'Families — near the museums and Hyde Park' }, price: 3, pros: { he: 'מוזיאונים בחינם והייד פארק ליד המלון', en: 'Free museums and Hyde Park nearby' }, cons: { he: 'יקר ושקט בערב', en: 'Pricey and quiet in the evening' } },
      { name: { he: 'סאות׳ בנק', en: 'South Bank' }, forWhom: { he: 'זוגות — טיילת על התמזה, תרבות ותצפיות', en: 'Couples — a Thames-side walk, culture and views' }, price: 2, pros: { he: 'טיילת על התמזה ונוף לעיר', en: 'A Thames-side promenade and city views' }, cons: { he: 'בלב התיירות, עמוס בסופ״ש', en: 'Tourist-central; crowded at weekends' } },
      { name: { he: 'גולדרס גרין', en: 'Golders Green' }, forWhom: { he: 'מי ששומר כשרות ושבת — מסעדות כשרות ובתי כנסת, רחוק יותר מהמרכז', en: 'Kosher and Shabbat observers — kosher restaurants and synagogues, further from the centre' }, price: 1, pros: { he: 'מסעדות כשרות ובתי כנסת ברגל', en: 'Kosher restaurants and synagogues on foot' }, cons: { he: 'כחצי שעה במטרו למרכז', en: 'About half an hour by Tube to the centre' } },
      { name: { he: 'שורדיץ׳', en: 'Shoreditch' }, forWhom: { he: 'צעירים — חיי לילה, אמנות רחוב ואוכל', en: 'Younger travellers — nightlife, street art and food' }, price: 2, pros: { he: 'חיי לילה, אוכל ואמנות רחוב', en: 'Nightlife, food and street art' }, cons: { he: 'רועש בסופ״ש', en: 'Noisy at weekends' } }
    ],
    attractions: [
      { name: { he: 'המוזיאון הבריטי', en: 'The British Museum' }, kind: 'museum', durationH: 3, tags: ['culture'], area: 'Bloomsbury', mustSee: true },
      { name: { he: 'מגדל לונדון', en: 'Tower of London' }, kind: 'landmark', durationH: 2.5, tags: ['culture', 'family'], area: 'Tower Hill', mustSee: true },
      { name: { he: 'גשר המגדל', en: 'Tower Bridge' }, kind: 'landmark', durationH: 1, tags: ['family'], area: 'Tower Hill' },
      { name: { he: 'מנזר וסטמינסטר וביג בן', en: 'Westminster Abbey & Big Ben' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'Westminster', mustSee: true },
      { name: { he: 'ארמון בקינגהאם וחילופי המשמרות', en: 'Buckingham Palace & Changing of the Guard' }, kind: 'landmark', durationH: 1.5, tags: ['family'], area: 'Westminster' },
      { name: { he: 'מוזיאון הטבע', en: 'Natural History Museum' }, area: 'South Kensington', kind: 'museum', durationH: 2.5, tags: ['family', 'with_children'] },
      { name: { he: 'הנשיונל גלרי וכיכר טרפלגר', en: 'National Gallery & Trafalgar Square' }, area: 'West End & Covent Garden', kind: 'museum', durationH: 2, tags: ['culture'] },
      { name: { he: 'טייט מודרן', en: 'Tate Modern' }, area: 'South Bank', kind: 'museum', durationH: 2, tags: ['culture'] },
      { name: { he: 'הלונדון איי', en: 'The London Eye' }, area: 'South Bank', kind: 'viewpoint', durationH: 1, tags: ['family', 'couple'] },
      { name: { he: 'שוק בורו', en: 'Borough Market' }, area: 'South Bank', kind: 'market', durationH: 1.5, tags: ['food'] },
      { name: { he: 'שוק קמדן', en: 'Camden Market' }, kind: 'market', durationH: 2, tags: ['shopping', 'food'], area: 'Camden' },
      { name: { he: 'הייד פארק וגני קנזינגטון', en: 'Hyde Park & Kensington Gardens' }, kind: 'park', durationH: 2, tags: ['family', 'relaxation'], area: 'South Kensington' },
      { name: { he: 'סיור אולפני וורנר בראדרס — הארי פוטר', en: 'Warner Bros. Studio Tour — The Making of Harry Potter' }, kind: 'experience', durationH: 4, tags: ['family', 'with_children', 'teens'], area: 'Leavesden (Watford)' }
    ],
    dayTrips: [
      { name: { he: 'אוקספורד', en: 'Oxford' }, hours: 1, note: { he: 'רכבת מפדינגטון או ממרילבון; קולג׳ים וספריות היסטוריות', en: 'Train from Paddington or Marylebone; historic colleges and libraries' }, priceIls: { low: 110, high: 420 }, kind: 'neighborhood' },
      { name: { he: 'טירת וינדזור', en: 'Windsor Castle' }, hours: 0.75, note: { he: 'רכבת; טירה מלכותית פעילה ועיירה נעימה', en: 'By train; a working royal castle and a pleasant town' }, priceIls: { low: 220, high: 420 }, kind: 'landmark' },
      { name: { he: 'סטונהנג׳ ובאת׳', en: 'Stonehenge & Bath' }, hours: 2, note: { he: 'יום ארוך — הכי נוח בסיור מאורגן', en: 'A long day — easiest on an organised tour' }, priceIls: { low: 420, high: 600 }, kind: 'landmark' },
      { name: { he: 'קיימברידג׳', en: 'Cambridge' }, hours: 1, note: { he: 'רכבת מקינגס קרוס; שיט בסירות על נהר הקאם', en: 'Train from King’s Cross; punting on the River Cam' }, priceIls: { low: 110, high: 380 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'רכבת תחתית ואוטובוסים — משלמים בכרטיס אשראי ללא מגע. מהית׳רו יש קו אליזבת׳ ורכבת מהירה, ומגטוויק רכבת. נהיגה בצד שמאל ואגרת גודש — רכב לא כדאי.', en: 'The Underground and buses — pay with a contactless card. Heathrow has the Elizabeth line and an express train; Gatwick has trains. Left-hand driving and a congestion charge — skip the car.' } },
    practical: {
      currency: 'GBP', language: { he: 'אנגלית', en: 'English' }, timeZone: 'Europe/London',
      visaNoteForIsraelis: UK_VISA,
      kosher: { he: 'היצע כשר רחב — מסעדות, מאפיות וסופרמרקטים בגולדרס גרין, בהנדון, בסטמפורד היל ועוד; במרכז העיר פחות. כדאי לבדוק את תעודת הכשרות.', en: 'A wide kosher supply — restaurants, bakeries and supermarkets in Golders Green, Hendon, Stamford Hill and beyond; less in central London. Check certification.' },
      shabbat: { he: 'קהילה יהודית גדולה ובתי כנסת רבים; מי ששומר שבת ירגיש בנוח בצפון־מערב לונדון.', en: 'A large Jewish community and many synagogues; Shabbat observers are most comfortable in north-west London.' }
    },
    seasonsNote: { he: 'מאי–ספטמבר הכי נעימים, עם ימים ארוכים. דצמבר חגיגי עם שווקי חג וקישוטים. גשם אפשרי בכל עונה — תביאו מעיל.', en: 'May–September is the most pleasant, with long days. December is festive with markets and lights. Rain is possible in any season — bring a jacket.' }
  },
  {
    id: 'edinburgh', code: 'EDI', airports: ['EDI'],
    name: { he: 'אדינבורו וסקוטלנד', en: 'Edinburgh & Scotland' }, country: { he: 'בריטניה (סקוטלנד)', en: 'United Kingdom (Scotland)' }, region: 'europe',
    tags: ['city', 'culture', 'nature', 'couple', 'adventure', 'food'],
    bestMonths: [5, 6, 7, 8, 9], flightHours: 8, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 230, mid: 400, high: 750 },
    summary: { he: 'עיר מימי הביניים עם טירה על הר געש כבוי, סמטאות אבן ופאבים — ושער לנופים הדרמטיים של הרמות הסקוטיות.', en: 'A medieval city with a castle on an extinct volcano, stone closes and pubs — and the gateway to the dramatic landscapes of the Scottish Highlands.' },
    highlights: [
      { he: 'טירת אדינבורו', en: 'Edinburgh Castle' },
      { he: 'הרויאל מייל והעיר העתיקה', en: 'The Royal Mile and the Old Town' },
      { he: 'טיפוס לכיסא של ארתור', en: 'Climbing Arthur’s Seat' },
      { he: 'פסטיבל הפרינג׳ באוגוסט', en: 'The Fringe festival in August' },
      { he: 'סיור לרמות הסקוטיות וללוך נס', en: 'A tour to the Highlands and Loch Ness' },
      { he: 'טעימות ויסקי סקוטי', en: 'Scotch whisky tastings' }
    ],
    areas: [
      { name: { he: 'העיר העתיקה', en: 'Old Town' }, forWhom: { he: 'ביקור ראשון — ליד הטירה והרויאל מייל', en: 'First-timers — near the castle and the Royal Mile' }, price: 3, pros: { he: 'ליד הטירה והרויאל מייל', en: 'Next to the castle and Royal Mile' }, cons: { he: 'עליות, המון תיירים ויקר בפסטיבל', en: 'Hilly, crowded, pricey in festival season' } },
      { name: { he: 'העיר החדשה', en: 'New Town' }, forWhom: { he: 'זוגות ומשפחות — רחובות ג׳ורג׳יאניים, קניות ושקט יחסי', en: 'Couples and families — Georgian streets, shopping and relative calm' }, price: 3, pros: { he: 'רחובות גאורגיאניים, קניות ושקט', en: 'Georgian streets, shopping and calm' }, cons: { he: 'יקר, במיוחד באוגוסט', en: 'Pricey, especially in August' } },
      { name: { he: 'ליית׳', en: 'Leith' }, forWhom: { he: 'אוכל טוב ליד המים ומחירים נוחים יותר', en: 'Good food by the water and better prices' }, price: 1, pros: { he: 'אוכל טוב ליד המים ומחירים נוחים', en: 'Good waterside food and better prices' }, cons: { he: 'חשמלית או אוטובוס למרכז', en: 'Tram or bus to the centre' } }
    ],
    attractions: [
      { name: { he: 'טירת אדינבורו', en: 'Edinburgh Castle' }, area: 'Old Town', kind: 'landmark', durationH: 2.5, tags: ['culture', 'family'], mustSee: true },
      { name: { he: 'הרויאל מייל', en: 'The Royal Mile' }, area: 'Old Town', kind: 'neighborhood', durationH: 2, tags: ['culture', 'shopping'], mustSee: true },
      { name: { he: 'ארמון הולירודהאוס', en: 'Palace of Holyroodhouse' }, area: 'Old Town', kind: 'landmark', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'הכיסא של ארתור', en: 'Arthur’s Seat' }, kind: 'nature', durationH: 2, tags: ['nature', 'adventure'], area: 'Old Town', mustSee: true },
      { name: { he: 'גבעת קלטון', en: 'Calton Hill' }, area: 'New Town', kind: 'viewpoint', durationH: 1, tags: ['couple'] },
      { name: { he: 'המוזיאון הלאומי של סקוטלנד', en: 'National Museum of Scotland' }, area: 'Old Town', kind: 'museum', durationH: 2, tags: ['culture', 'family'] },
      { name: { he: 'כפר דין', en: 'Dean Village' }, kind: 'neighborhood', durationH: 1, tags: ['couple'], area: 'West End' },
      { name: { he: 'גני פרינסס סטריט', en: 'Princes Street Gardens' }, area: 'New Town', kind: 'park', durationH: 1, tags: ['family'] },
      { name: { he: 'רחוב ויקטוריה וגראסמרקט', en: 'Victoria Street & the Grassmarket' }, area: 'Old Town', kind: 'neighborhood', durationH: 1.5, tags: ['food', 'nightlife', 'evening'] },
      { name: { he: 'קמרה אובסקורה ועולם האשליות', en: 'Camera Obscura & World of Illusions' }, area: 'Old Town', kind: 'experience', durationH: 1.5, tags: ['family', 'with_children'] },
      { name: { he: 'חוויית הוויסקי הסקוטי', en: 'The Scotch Whisky Experience' }, area: 'Old Town', kind: 'experience', durationH: 1, tags: ['food', 'adults'] },
      { name: { he: 'היאכטה המלכותית בריטניה', en: 'The Royal Yacht Britannia' }, area: 'Leith', kind: 'museum', durationH: 1.5, tags: ['culture'] }
    ],
    dayTrips: [
      { name: { he: 'הרמות הסקוטיות ולוך נס', en: 'The Highlands & Loch Ness' }, hours: 3.5, note: { he: 'יום ארוך מאוד בסיור מאורגן; עדיף לישון לילה או שניים באזור', en: 'A very long day on an organised tour; better with a night or two in the area' }, priceIls: { low: 280, high: 400 }, kind: 'nature' },
      { name: { he: 'טירת סטירלינג', en: 'Stirling Castle' }, hours: 1, note: { he: 'רכבת או רכב; טירה היסטורית עם נוף רחב', en: 'By train or car; a historic castle with wide views' }, priceIls: { low: 170, high: 350 }, kind: 'landmark' },
      { name: { he: 'סנט אנדרוז', en: 'St Andrews' }, hours: 1.5, note: { he: 'עיירת חוף, אוניברסיטה עתיקה ומגרש הגולף המפורסם', en: 'A seaside town, an ancient university and the famous golf course' }, priceIls: { low: 100, high: 350 }, kind: 'neighborhood' },
      { name: { he: 'גלזגו', en: 'Glasgow' }, hours: 1, note: { he: 'רכבת תכופה; מוזיאונים, אדריכלות וקניות', en: 'Frequent trains; museums, architecture and shopping' }, priceIls: { low: 70, high: 250 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'בעיר הולכים ברגל ובאוטובוסים, ויש טראם מהשדה. לרמות הסקוטיות רכב נותן הכי הרבה חופש — נהיגה בצד שמאל ובכבישים צרים.', en: 'In the city walk and take buses; a tram runs from the airport. For the Highlands a car gives the most freedom — left-hand driving on narrow roads.' } },
    practical: {
      currency: 'GBP', language: { he: 'אנגלית (במבטא סקוטי)', en: 'English (with a Scottish accent)' }, timeZone: 'Europe/London',
      visaNoteForIsraelis: UK_VISA,
      kosher: { he: 'היצע כשר מצומצם מאוד; יש בית חב״ד וקהילה קטנה — כדאי לתאם מראש או להביא אוכל ארוז, במיוחד לרמות.', en: 'Very limited kosher supply; there is a Chabad house and a small community — arrange in advance or bring packed food, especially for the Highlands.' },
      shabbat: { he: 'יש בית כנסת ובית חב״ד בעיר; לתאם ארוחות שבת מראש.', en: 'There is a synagogue and a Chabad house in the city; arrange Shabbat meals in advance.' }
    },
    seasonsNote: { he: 'מאי–ספטמבר הכי נעימים, עם ימים ארוכים מאוד. באוגוסט הפסטיבלים — העיר מלאה והמחירים מזנקים. החורף קר, חשוך ורטוב; תביאו שכבות ומעיל גשם בכל עונה.', en: 'May–September is best, with very long days. August brings the festivals — the city is packed and prices soar. Winter is cold, dark and wet; pack layers and a rain jacket in any season.' }
  },
  {
    id: 'amsterdam', code: 'AMS', airports: ['AMS'],
    name: { he: 'אמסטרדם', en: 'Amsterdam' }, country: { he: 'הולנד', en: 'Netherlands' }, region: 'europe',
    tags: ['city', 'culture', 'couple', 'food', 'nightlife', 'shopping', 'direct_flight'],
    bestMonths: [4, 5, 6, 7, 8, 9], flightHours: 5, direct: true, budgetLevel: 4, dailyBudgetIls: { low: 250, mid: 430, high: 800 },
    summary: { he: 'תעלות, גשרים ובתים צרים, אופניים בכל מקום, מוזיאונים מהשורה הראשונה וחיים תוססים — עיר קומפקטית שנוח לגלות ברגל ובאופניים.', en: 'Canals, bridges and narrow houses, bikes everywhere, first-rate museums and a lively scene — a compact city that is easy to explore on foot and by bike.' },
    highlights: [
      { he: 'שייט בתעלות', en: 'A canal cruise' },
      { he: 'הרייקסמוזיאום ומוזיאון ואן גוך', en: 'The Rijksmuseum and the Van Gogh Museum' },
      { he: 'בית אנה פרנק', en: 'The Anne Frank House' },
      { he: 'הרובע היהודי ובית הכנסת הפורטוגזי', en: 'The Jewish Cultural Quarter and the Portuguese Synagogue' },
      { he: 'רכיבה על אופניים לאורך התעלות', en: 'Cycling along the canals' },
      { he: 'שדות הצבעונים בקויקנהוף באביב', en: 'The tulip fields of Keukenhof in spring' }
    ],
    areas: [
      { name: { he: 'טבעת התעלות', en: 'Canal Ring (Grachtengordel)' }, forWhom: { he: 'זוגות וביקור ראשון — הלב היפה של העיר', en: 'Couples and first-timers — the city’s beautiful heart' }, price: 3, pros: { he: 'הלב היפה של העיר, הכול ברגל', en: 'The city’s beautiful heart, all on foot' }, cons: { he: 'יקר מאוד, מדרגות תלולות בבתים', en: 'Very pricey, steep stairs in old houses' } },
      { name: { he: 'יורדאן', en: 'Jordaan' }, forWhom: { he: 'אווירה שכונתית, בתי קפה וגלריות', en: 'A neighbourhood feel, cafés and galleries' }, price: 3, pros: { he: 'שכונתי, בתי קפה וגלריות', en: 'Neighbourly, cafés and galleries' }, cons: { he: 'יקר ומעט מלונות', en: 'Pricey with few hotels' } },
      { name: { he: 'רובע המוזיאונים', en: 'Museum Quarter' }, forWhom: { he: 'משפחות ואוהבי אמנות — ליד הוונדלפארק', en: 'Families and art lovers — next to the Vondelpark' }, price: 3, pros: { he: 'מוזיאונים ופארק פונדל', en: 'Museums and the Vondelpark' }, cons: { he: 'שקט בערב ויקר', en: 'Quiet at night and pricey' } },
      { name: { he: 'דה פייפ', en: 'De Pijp' }, forWhom: { he: 'אוכל, שוק ומחירים נוחים יותר', en: 'Food, a market and better prices' }, price: 2, pros: { he: 'שוק אלברט קאופ, אוכל ומטרו', en: 'Albert Cuyp market, food and metro' }, cons: { he: 'מעט מלונות, הרבה דירות קטנות', en: 'Few hotels, mostly small apartments' } }
    ],
    attractions: [
      { name: { he: 'הרייקסמוזיאום', en: 'Rijksmuseum' }, area: 'Museum Quarter', kind: 'museum', durationH: 3, tags: ['culture'], mustSee: true },
      { name: { he: 'מוזיאון ואן גוך', en: 'Van Gogh Museum' }, area: 'Museum Quarter', kind: 'museum', durationH: 2, tags: ['culture'], mustSee: true },
      { name: { he: 'בית אנה פרנק', en: 'Anne Frank House' }, area: 'Canal Ring (Grachtengordel)', kind: 'museum', durationH: 1.5, tags: ['culture'], mustSee: true },
      { name: { he: 'שייט בתעלות', en: 'Canal cruise' }, kind: 'experience', durationH: 1, tags: ['couple', 'family'], area: 'Canal Ring (Grachtengordel)', mustSee: true },
      { name: { he: 'הרובע התרבותי היהודי ובית הכנסת הפורטוגזי', en: 'Jewish Cultural Quarter & Portuguese Synagogue' }, kind: 'religious', durationH: 2, tags: ['culture'], area: 'Plantage' },
      { name: { he: 'יורדאן', en: 'Jordaan' }, area: 'Jordaan', kind: 'neighborhood', durationH: 2, tags: ['food', 'couple'] },
      { name: { he: 'הוונדלפארק', en: 'Vondelpark' }, area: 'Museum Quarter', kind: 'park', durationH: 1.5, tags: ['family', 'relaxation'] },
      { name: { he: 'שוק אלברט קאופ', en: 'Albert Cuyp Market' }, area: 'De Pijp', kind: 'market', durationH: 1, tags: ['food'] },
      { name: { he: 'שוק הפרחים', en: 'Bloemenmarkt (flower market)' }, area: 'Canal Ring (Grachtengordel)', kind: 'market', durationH: 0.5, tags: ['shopping'] },
      { name: { he: 'מוזיאון המדע נמו', en: 'NEMO Science Museum' }, kind: 'museum', durationH: 2.5, tags: ['family', 'with_children', 'teens'], area: 'Oosterdok' },
      { name: { he: 'תצפית A’DAM Lookout', en: 'A’DAM Lookout' }, kind: 'viewpoint', durationH: 1, tags: ['couple'], area: 'Amsterdam-Noord' },
      { name: { he: 'חוויית הייניקן', en: 'Heineken Experience' }, area: 'De Pijp', kind: 'experience', durationH: 1.5, tags: ['nightlife', 'adults'] }
    ],
    dayTrips: [
      { name: { he: 'זאנסה סכאנס', en: 'Zaanse Schans' }, hours: 0.5, note: { he: 'טחנות רוח ובתי עץ ירוקים — קצר וקל ברכבת או באוטובוס', en: 'Windmills and green wooden houses — short and easy by train or bus' }, priceIls: { low: 30, high: 200 }, kind: 'neighborhood' },
      { name: { he: 'קויקנהוף', en: 'Keukenhof' }, hours: 0.75, note: { he: 'גן הצבעונים פתוח רק באביב, בערך מאמצע מרץ עד אמצע מאי', en: 'The tulip gardens open only in spring, roughly mid-March to mid-May' }, priceIls: { low: 130, high: 300 }, kind: 'park', months: [3, 4, 5] },
      { name: { he: 'הארלם', en: 'Haarlem' }, hours: 0.25, note: { he: 'עיר עתיקה ורגועה, רבע שעה ברכבת', en: 'A calm historic town, 15 minutes by train' }, priceIls: { low: 30, high: 150 }, kind: 'neighborhood' },
      { name: { he: 'פולנדם ומרקן', en: 'Volendam & Marken' }, hours: 0.75, note: { he: 'כפרי דייגים על האייסלמר, באוטובוס', en: 'Fishing villages on the IJsselmeer, by bus' }, priceIls: { low: 50, high: 250 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'רכבת ישירה משיפהול לתחנה המרכזית בכרבע שעה; טראמים, הליכה ואופניים להשכרה. רכב בעיר — ממש לא כדאי (חניה יקרה מאוד).', en: 'A direct train runs from Schiphol to Centraal in about 15 minutes; then trams, walking and rental bikes. Don’t drive in the city (parking is very expensive).' } },
    practical: {
      currency: 'EUR', language: { he: 'הולנדית; אנגלית נפוצה מאוד', en: 'Dutch; English very widely spoken' }, timeZone: 'Europe/Amsterdam',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'יש כמה מסעדות וחנויות כשרות, בעיקר בבויטנפלדרט ובאמסטלפן, ובית חב״ד; כדאי לבדוק את תעודת הכשרות ולתכנן מראש.', en: 'There are a few kosher restaurants and shops, mainly in Buitenveldert and Amstelveen, and a Chabad house; check certification and plan ahead.' },
      shabbat: { he: 'יש קהילות ובתי כנסת בעיר ובבית חב״ד; לתאם ארוחות שבת מראש ולבחור לינה במרחק הליכה.', en: 'There are communities and synagogues in the city and a Chabad house; arrange Shabbat meals in advance and stay within walking distance.' }
    },
    seasonsNote: { he: 'אפריל–מאי לפריחת הצבעונים, יוני–ספטמבר לימים ארוכים ונעימים. הקיץ עמוס ויקר; החורף קר, אפור וגשום אבל שקט יותר.', en: 'April–May for the tulips, June–September for long, pleasant days. Summer is busy and pricey; winter is cold, grey and wet but quieter.' }
  },
  {
    id: 'berlin', code: 'BER', airports: ['BER'],
    name: { he: 'ברלין', en: 'Berlin' }, country: { he: 'גרמניה', en: 'Germany' }, region: 'europe',
    tags: ['city', 'culture', 'nightlife', 'food', 'shopping', 'short_break', 'direct_flight', 'kosher'],
    bestMonths: [4, 5, 6, 7, 8, 9, 12], flightHours: 4, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 180, mid: 320, high: 600 },
    summary: { he: 'עיר של היסטוריה והווה: החומה, אתרי זיכרון, מוזיאונים, אמנות רחוב וחיי לילה מהטובים באירופה — ובמחירים סבירים יחסית לבירות מערב אירופה.', en: 'A city of history and the here and now: the Wall, memorials, museums, street art and some of Europe’s best nightlife — at fairly reasonable prices for a Western European capital.' },
    highlights: [
      { he: 'שער ברנדנבורג וכיפת הרייכסטאג', en: 'The Brandenburg Gate and the Reichstag dome' },
      { he: 'האנדרטה לזכר יהודי אירופה שנרצחו', en: 'The Memorial to the Murdered Jews of Europe' },
      { he: 'שרידי החומה וגלריית איסט סייד', en: 'The Wall remains and the East Side Gallery' },
      { he: 'אי המוזיאונים', en: 'Museum Island' },
      { he: 'המוזיאון היהודי של ברלין', en: 'The Jewish Museum Berlin' },
      { he: 'ערבים בקרויצברג ובפרנצלאואר ברג', en: 'Evenings in Kreuzberg and Prenzlauer Berg' }
    ],
    areas: [
      { name: { he: 'מיטה', en: 'Mitte' }, forWhom: { he: 'ביקור ראשון — קרוב לרוב האתרים', en: 'First-timers — close to most sights' }, price: 2, pros: { he: 'קרוב לרוב האתרים, תחבורה מצוינת', en: 'Close to most sights, excellent transport' }, cons: { he: 'פחות אווירה שכונתית', en: 'Less neighbourhood feel' } },
      { name: { he: 'פרנצלאואר ברג', en: 'Prenzlauer Berg' }, forWhom: { he: 'משפחות וזוגות — שקט, ירוק ומלא בתי קפה', en: 'Families and couples — calm, leafy and full of cafés' }, price: 2, pros: { he: 'שקט, ירוק ומלא בתי קפה', en: 'Calm, leafy and full of cafés' }, cons: { he: 'מעט מלונות, רחוק מהמערב', en: 'Few hotels, far from the west' } },
      { name: { he: 'קרויצברג ופרידריכסהיין', en: 'Kreuzberg & Friedrichshain' }, forWhom: { he: 'צעירים — חיי לילה, אמנות רחוב ואוכל זול', en: 'Younger travellers — nightlife, street art and cheap food' }, price: 1, pros: { he: 'חיי לילה, אמנות רחוב ואוכל זול', en: 'Nightlife, street art and cheap food' }, cons: { he: 'רועש ומוזנח בחלקו', en: 'Noisy and gritty in parts' } },
      { name: { he: 'שרלוטנבורג', en: 'Charlottenburg' }, forWhom: { he: 'קניות בקורפירסטנדאם ואווירה מעודנת יותר', en: 'Shopping on the Kurfürstendamm and a more refined feel' }, price: 2, pros: { he: 'קודאם, קניות ואווירה מעודנת', en: 'Ku’damm shopping and a refined feel' }, cons: { he: 'רחוק ממיטה ומחיי הלילה', en: 'Far from Mitte and the nightlife' } }
    ],
    attractions: [
      { name: { he: 'שער ברנדנבורג', en: 'Brandenburg Gate' }, area: 'Mitte', kind: 'landmark', durationH: 0.5, tags: ['culture'], mustSee: true },
      { name: { he: 'כיפת הרייכסטאג', en: 'Reichstag dome' }, area: 'Mitte', kind: 'viewpoint', durationH: 1, tags: ['culture'] },
      { name: { he: 'האנדרטה לזכר יהודי אירופה שנרצחו', en: 'Memorial to the Murdered Jews of Europe' }, area: 'Mitte', kind: 'landmark', durationH: 1, tags: ['culture'], mustSee: true },
      { name: { he: 'המוזיאון היהודי של ברלין', en: 'Jewish Museum Berlin' }, area: 'Kreuzberg & Friedrichshain', kind: 'museum', durationH: 2.5, tags: ['culture'] },
      { name: { he: 'אי המוזיאונים', en: 'Museum Island' }, area: 'Mitte', kind: 'museum', durationH: 3, tags: ['culture'], mustSee: true },
      { name: { he: 'גלריית איסט סייד', en: 'East Side Gallery' }, area: 'Kreuzberg & Friedrichshain', kind: 'landmark', durationH: 1, tags: ['culture'] },
      { name: { he: 'אתר הזיכרון לחומת ברלין בברנאואר שטראסה', en: 'Berlin Wall Memorial (Bernauer Strasse)' }, area: 'Mitte', kind: 'landmark', durationH: 1.5, tags: ['culture'], mustSee: true },
      { name: { he: 'טופוגרפיה של הטרור', en: 'Topography of Terror' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Kreuzberg & Friedrichshain' },
      { name: { he: 'צ׳קפוינט צ׳רלי', en: 'Checkpoint Charlie' }, kind: 'landmark', durationH: 0.5, tags: ['culture'], area: 'Mitte' },
      { name: { he: 'מגדל הטלוויזיה', en: 'TV Tower (Fernsehturm)' }, area: 'Mitte', kind: 'viewpoint', durationH: 1, tags: ['family'] },
      { name: { he: 'פארק טירגרטן', en: 'Tiergarten' }, kind: 'park', durationH: 1.5, tags: ['family', 'relaxation'], area: 'Mitte' },
      { name: { he: 'שוק הפשפשים במאוארפארק (בימי ראשון)', en: 'Mauerpark flea market (Sundays)' }, area: 'Prenzlauer Berg', kind: 'market', durationH: 1.5, tags: ['shopping'] },
      { name: { he: 'כלבו KaDeWe', en: 'KaDeWe department store' }, kind: 'experience', durationH: 1.5, tags: ['shopping', 'food'], area: 'Schöneberg' }
    ],
    dayTrips: [
      { name: { he: 'פוטסדאם וארמון סנסוסי', en: 'Potsdam & Sanssouci Palace' }, hours: 0.75, note: { he: 'רכבת S-Bahn או אזורית; ארמונות וגנים', en: 'S-Bahn or regional train; palaces and gardens' }, priceIls: { low: 100, high: 300 }, kind: 'landmark' },
      { name: { he: 'בית ועידת ואנזה', en: 'House of the Wannsee Conference' }, hours: 0.75, note: { he: 'אתר הנצחה וחינוך על שפת האגם; אפשר לשלב עם פוטסדאם', en: 'A memorial and education site by the lake; combine with Potsdam' }, priceIls: { low: 20, high: 50 }, kind: 'museum' },
      { name: { he: 'אתר הזיכרון זקסנהאוזן', en: 'Sachsenhausen Memorial' }, hours: 1, note: { he: 'מחנה ריכוז לשעבר באורנינבורג; ביקור כבד ומשמעותי', en: 'A former concentration camp in Oranienburg; a heavy, meaningful visit' }, priceIls: { low: 20, high: 160 }, kind: 'museum' },
      { name: { he: 'דרזדן', en: 'Dresden' }, hours: 2, note: { he: 'ברכבת; עיר בארוק משוקמת על האלבה', en: 'By train; a restored baroque city on the Elbe' }, priceIls: { low: 100, high: 400 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'רשת U-Bahn, S-Bahn, טראמים ואוטובוסים מצוינת; מהשדה יש רכבת למרכז. העיר גדולה — כדאי כרטיס תחבורה יומי או שבועי.', en: 'An excellent U-Bahn, S-Bahn, tram and bus network; trains link the airport to the centre. The city is spread out — get a day or weekly pass.' } },
    practical: {
      currency: 'EUR', language: { he: 'גרמנית; אנגלית נפוצה', en: 'German; English widely spoken' }, timeZone: 'Europe/Berlin',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'יש מסעדות ומכולות כשרות ומרכז חב״ד גדול; כדאי לבדוק את תעודת הכשרות בכל מקום.', en: 'There are kosher restaurants and grocers and a large Chabad centre; check each place’s certification.' },
      shabbat: { he: 'קהילה יהודית פעילה ובתי כנסת בכמה שכונות; לתאם ארוחות שבת עם חב״ד ולבחור לינה בהתאם.', en: 'An active Jewish community with synagogues in several districts; arrange Shabbat meals with Chabad and choose your base accordingly.' }
    },
    seasonsNote: { he: 'מאי–ספטמבר נעימים, עם ביר גרטן ואירועים בחוץ. דצמבר קר אבל מלא שווקי חג המולד. ינואר–פברואר קפואים ואפורים.', en: 'May–September is pleasant, with beer gardens and outdoor events. December is cold but full of Christmas markets. January–February is freezing and grey.' }
  },
  {
    id: 'munich-bavaria', code: 'MUC', airports: ['MUC'],
    name: { he: 'מינכן ובוואריה', en: 'Munich & Bavaria' }, country: { he: 'גרמניה', en: 'Germany' }, region: 'europe',
    tags: ['nature', 'culture', 'family', 'couple', 'food', 'direct_flight', 'short_break'],
    bestMonths: [5, 6, 7, 8, 9, 12], flightHours: 4, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 220, mid: 380, high: 700 },
    summary: { he: 'עיר בווארית מסודרת עם כיכרות, ביר גרטן וגנים — ובמרחק נסיעה קצרה: אגמים כחולים, האלפים וטירת נוישוונשטיין. מושלם לטיול ברכב עם משפחה.', en: 'A tidy Bavarian city of squares, beer gardens and parks — and a short drive from blue lakes, the Alps and Neuschwanstein Castle. Perfect for a family road trip.' },
    highlights: [
      { he: 'טירת נוישוונשטיין', en: 'Neuschwanstein Castle' },
      { he: 'מריינפלאץ והגלוקנשפיל', en: 'Marienplatz and the Glockenspiel' },
      { he: 'הגן האנגלי והגולשים בנהר האייסבאך', en: 'The English Garden and the Eisbach river surfers' },
      { he: 'אגם קניגסזה וברכטסגאדן', en: 'Lake Königssee and Berchtesgaden' },
      { he: 'הצוגשפיצה — הפסגה הגבוהה בגרמניה', en: 'The Zugspitze — Germany’s highest peak' },
      { he: 'שווקי חג המולד בדצמבר', en: 'Christmas markets in December' }
    ],
    areas: [
      { name: { he: 'העיר העתיקה של מינכן', en: 'Munich Altstadt' }, forWhom: { he: 'ביקור ראשון — הכול ברגל', en: 'First-timers — everything on foot' }, price: 3, pros: { he: 'הכול ברגל, מריינפלאץ ובירות', en: 'All on foot, Marienplatz and beer halls' }, cons: { he: 'יקר מאוד, במיוחד באוקטוברפסט', en: 'Very pricey, especially at Oktoberfest' } },
      { name: { he: 'שוואבינג ומקסוורשטאדט', en: 'Schwabing & Maxvorstadt' }, forWhom: { he: 'משפחות וזוגות — ליד הגן האנגלי והמוזיאונים', en: 'Families and couples — near the English Garden and the museums' }, price: 2, pros: { he: 'הגן האנגלי, מוזיאונים ושקט', en: 'English Garden, museums and calm' }, cons: { he: 'קצת רחוק מהתחנה המרכזית', en: 'A bit far from the main station' } },
      { name: { he: 'גרמיש־פרטנקירכן', en: 'Garmisch-Partenkirchen' }, forWhom: { he: 'בסיס באלפים — טיולים בקיץ וסקי בחורף', en: 'An Alpine base — hiking in summer, skiing in winter' }, price: 2, pros: { he: 'אלפים, מסלולים וסקי', en: 'Alps, trails and skiing' }, cons: { he: 'שעה וחצי ממינכן', en: '90 minutes from Munich' } },
      { name: { he: 'פוסן', en: 'Füssen' }, forWhom: { he: 'לינה ליד נוישוונשטיין ואגמי האלגוי', en: 'Stay near Neuschwanstein and the Allgäu lakes' }, price: 2, pros: { he: 'ליד נוישוונשטיין והאגמים', en: 'Near Neuschwanstein and the lakes' }, cons: { he: 'שקט מאוד בערב, רחוק ממינכן', en: 'Very quiet at night, far from Munich' } }
    ],
    attractions: [
      { name: { he: 'מריינפלאץ והגלוקנשפיל', en: 'Marienplatz & the Glockenspiel' }, area: 'Munich Altstadt', kind: 'landmark', durationH: 1, tags: ['family', 'culture'], mustSee: true },
      { name: { he: 'שוק ויקטואליין', en: 'Viktualienmarkt' }, area: 'Munich Altstadt', kind: 'market', durationH: 1, tags: ['food'] },
      { name: { he: 'הגן האנגלי', en: 'English Garden (Englischer Garten)' }, area: 'Schwabing & Maxvorstadt', kind: 'park', durationH: 2, tags: ['family', 'relaxation'], mustSee: true },
      { name: { he: 'ארמון נימפנבורג', en: 'Nymphenburg Palace' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Nymphenburg' },
      { name: { he: 'הרזידנץ', en: 'Munich Residenz' }, area: 'Munich Altstadt', kind: 'museum', durationH: 2, tags: ['culture'] },
      { name: { he: 'המוזיאון הגרמני', en: 'Deutsches Museum' }, kind: 'museum', durationH: 3, tags: ['family', 'with_children'], area: 'Isarvorstadt' },
      { name: { he: 'BMW Welt ומוזיאון BMW', en: 'BMW Welt & BMW Museum' }, kind: 'museum', durationH: 2, tags: ['family'], area: 'Olympiapark' },
      { name: { he: 'פארק האולימפיאדה', en: 'Olympiapark' }, kind: 'park', durationH: 1.5, tags: ['family'], area: 'Olympiapark' },
      { name: { he: 'אתר הזיכרון דכאו', en: 'Dachau Concentration Camp Memorial Site' }, kind: 'landmark', durationH: 3, tags: ['culture'], area: 'Dachau' },
      { name: { he: 'טירת נוישוונשטיין', en: 'Neuschwanstein Castle' }, area: 'Füssen', kind: 'landmark', durationH: 3, tags: ['family', 'couple'], mustSee: true },
      { name: { he: 'אגם קניגסזה', en: 'Lake Königssee' }, kind: 'nature', durationH: 4, tags: ['nature', 'family'], area: 'Berchtesgaden' },
      { name: { he: 'הצוגשפיצה', en: 'Zugspitze' }, area: 'Garmisch-Partenkirchen', kind: 'viewpoint', durationH: 4, tags: ['nature', 'adventure'] }
    ],
    dayTrips: [
      { name: { he: 'נוישוונשטיין והוהנשוונגאו', en: 'Neuschwanstein & Hohenschwangau' }, hours: 2, note: { he: 'כרטיסים לכניסה לטירה כדאי להזמין הרבה מראש', en: 'Book castle tickets well in advance' }, priceIls: { low: 200, high: 450 }, kind: 'landmark' },
      { name: { he: 'זלצבורג', en: 'Salzburg' }, hours: 1.5, note: { he: 'ברכבת, מעבר לגבול באוסטריה; העיר של מוצרט', en: 'By train, just over the border in Austria; Mozart’s city' }, priceIls: { low: 120, high: 400 }, kind: 'neighborhood' },
      { name: { he: 'גרמיש־פרטנקירכן והצוגשפיצה', en: 'Garmisch-Partenkirchen & the Zugspitze' }, hours: 1.5, note: { he: 'רכבת רכס או רכבל לפסגה; נוף לארבע מדינות ביום בהיר', en: 'Cog railway or cable car to the top; views into four countries on a clear day' }, priceIls: { low: 360, high: 550 }, kind: 'viewpoint' },
      { name: { he: 'אגם כימזה וארמון הרנכימזה', en: 'Lake Chiemsee & Herrenchiemsee Palace' }, hours: 1, note: { he: 'רכבת לפרין ומשם סירה לאי', en: 'Train to Prien, then a boat to the island' }, priceIls: { low: 170, high: 350 }, kind: 'landmark' }
    ],
    transport: { carRecommended: true, note: { he: 'במינכן עצמה — U-Bahn, S-Bahn וטראמים, ומהשדה S-Bahn למרכז. לאלפים, לאגמים ולטירות רכב נותן הכי הרבה חופש; הכבישים מצוינים.', en: 'Within Munich use the U-Bahn, S-Bahn and trams; an S-Bahn line links the airport. For the Alps, lakes and castles a car gives the most freedom; roads are excellent.' } },
    practical: {
      currency: 'EUR', language: { he: 'גרמנית; אנגלית נפוצה בעיר, פחות בכפרים', en: 'German; English common in the city, less so in villages' }, timeZone: 'Europe/Berlin',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'במינכן יש קהילה יהודית, בית חב״ד ומעט מקומות כשרים; מחוץ לעיר אין כמעט היצע — כדאי לתאם מראש או להצטייד.', en: 'Munich has a Jewish community, a Chabad house and a few kosher outlets; outside the city there is almost nothing — arrange ahead or stock up.' },
      shabbat: { he: 'במינכן יש בתי כנסת ובית חב״ד; בכפרי האלפים אין קהילה — תכננו שבת בעיר או עם אוכל ארוז.', en: 'Munich has synagogues and a Chabad house; the Alpine villages have no community — plan Shabbat in the city or with packed food.' }
    },
    seasonsNote: { he: 'מאי–ספטמבר הכי טובים לאגמים ולמסלולים. אוקטוברפסט (סוף ספטמבר–תחילת אוקטובר) מקפיץ מחירים. דצמבר יפה עם שווקי חג המולד; בחורף יש סקי באזור גרמיש.', en: 'May–September is best for lakes and trails. Oktoberfest (late September–early October) pushes prices up. December is lovely with Christmas markets; in winter there is skiing around Garmisch.' }
  },
  {
    id: 'prague', code: 'PRG', airports: ['PRG'],
    name: { he: 'פראג', en: 'Prague' }, country: { he: 'צ׳כיה', en: 'Czech Republic' }, region: 'europe',
    tags: ['city', 'culture', 'couple', 'food', 'nightlife', 'short_break', 'direct_flight', 'low_budget', 'kosher'],
    bestMonths: [4, 5, 6, 9, 10, 12], flightHours: 4, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 130, mid: 230, high: 450 },
    summary: { he: 'עיר אגדות של גגות אדומים, גשרים וצריחים, עם רובע יהודי עתיק ומחירים נוחים — קלאסיקה לסופ״ש ארוך.', en: 'A fairy-tale city of red roofs, bridges and spires, with an old Jewish quarter and friendly prices — a long-weekend classic.' },
    highlights: [
      { he: 'גשר קארל בבוקר מוקדם', en: 'Charles Bridge early in the morning' },
      { he: 'מצודת פראג וקתדרלת ויטוס הקדוש', en: 'Prague Castle and St Vitus Cathedral' },
      { he: 'כיכר העיר העתיקה והשעון האסטרונומי', en: 'Old Town Square and the Astronomical Clock' },
      { he: 'הרובע היהודי יוזפוב ובית הכנסת אלטנוי', en: 'The Josefov Jewish quarter and the Old-New Synagogue' },
      { he: 'שייט על הוולטבה', en: 'A cruise on the Vltava' },
      { he: 'אוכל צ׳כי ובירה במחירים נוחים', en: 'Czech food and beer at good prices' }
    ],
    areas: [
      { name: { he: 'העיר העתיקה (סטארה מסטו)', en: 'Old Town (Staré Město)' }, forWhom: { he: 'ביקור ראשון — במרכז העניינים, קרוב לרובע היהודי', en: 'First-timers — in the thick of it, close to the Jewish quarter' }, price: 3, pros: { he: 'בלב העניינים, ליד הרובע היהודי', en: 'In the thick of it, by the Jewish Quarter' }, cons: { he: 'צפוף ורועש, מלכודות תיירים', en: 'Crowded, noisy, tourist traps' } },
      { name: { he: 'מאלה סטראנה', en: 'Malá Strana (Lesser Town)' }, forWhom: { he: 'זוגות — רחובות ציוריים מתחת למצודה', en: 'Couples — picturesque streets below the castle' }, price: 3, pros: { he: 'רחובות ציוריים מתחת לטירה', en: 'Picturesque streets below the castle' }, cons: { he: 'מרוצף ותלול, יקר', en: 'Cobbled and steep, pricey' } },
      { name: { he: 'העיר החדשה (נובה מסטו)', en: 'New Town (Nové Město)' }, forWhom: { he: 'תקציב ונוחות תחבורה, קרוב לכיכר ואצלב', en: 'Budget and transport links, near Wenceslas Square' }, price: 1, pros: { he: 'משתלם ותחבורה טובה', en: 'Good value and great transport' }, cons: { he: 'פחות ציורי, רחובות סואנים בלילה', en: 'Less pretty, rowdy streets at night' } },
      { name: { he: 'וינוהראדי', en: 'Vinohrady' }, forWhom: { he: 'שכונה מקומית ושקטה עם בתי קפה, קצת מחוץ למרכז', en: 'A quiet local area with cafés, a little out of the centre' }, price: 1, pros: { he: 'שקט, מקומי ומלא בתי קפה', en: 'Quiet, local and full of cafés' }, cons: { he: 'חשמלית או מטרו למרכז', en: 'Tram or metro to the centre' } }
    ],
    attractions: [
      { name: { he: 'מצודת פראג', en: 'Prague Castle' }, kind: 'landmark', durationH: 3, tags: ['culture'], area: 'Hradčany', mustSee: true },
      { name: { he: 'קתדרלת ויטוס הקדוש', en: 'St Vitus Cathedral' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Hradčany' },
      { name: { he: 'גשר קארל', en: 'Charles Bridge' }, kind: 'landmark', durationH: 1, tags: ['couple'], area: 'Malá Strana (Lesser Town)', mustSee: true },
      { name: { he: 'כיכר העיר העתיקה והשעון האסטרונומי', en: 'Old Town Square & the Astronomical Clock' }, area: 'Old Town (Staré Město)', kind: 'landmark', durationH: 1, tags: ['culture', 'family'], mustSee: true },
      { name: { he: 'המוזיאון היהודי בפראג (בתי הכנסת ובית הקברות העתיק)', en: 'Jewish Museum in Prague (synagogues & Old Jewish Cemetery)' }, area: 'Old Town (Staré Město)', kind: 'museum', durationH: 3, tags: ['culture'], mustSee: true },
      { name: { he: 'בית הכנסת אלטנוי', en: 'Old-New Synagogue' }, area: 'Old Town (Staré Město)', kind: 'religious', durationH: 0.5, tags: ['culture'] },
      { name: { he: 'מאלה סטראנה', en: 'Malá Strana' }, area: 'Malá Strana (Lesser Town)', kind: 'neighborhood', durationH: 2, tags: ['couple'] },
      { name: { he: 'גבעת פטרשין ומגדל התצפית', en: 'Petřín Hill & Lookout Tower' }, area: 'Malá Strana (Lesser Town)', kind: 'viewpoint', durationH: 2, tags: ['family', 'couple'] },
      { name: { he: 'ויששהראד', en: 'Vyšehrad' }, kind: 'viewpoint', durationH: 1.5, tags: ['culture'], area: 'Vyšehrad' },
      { name: { he: 'הבית הרוקד', en: 'The Dancing House' }, area: 'New Town (Nové Město)', kind: 'landmark', durationH: 0.5, tags: ['city'] },
      { name: { he: 'שייט על הוולטבה', en: 'Vltava river cruise' }, kind: 'experience', durationH: 1, tags: ['couple', 'family'], area: 'Old Town (Staré Město)' },
      { name: { he: 'פארק לטנה', en: 'Letná Park' }, kind: 'park', durationH: 1.5, tags: ['relaxation', 'food'], area: 'Letná' },
      { name: { he: 'גן החיות של פראג', en: 'Prague Zoo' }, kind: 'park', durationH: 4, tags: ['family', 'with_children'], area: 'Troja' }
    ],
    dayTrips: [
      { name: { he: 'צ׳סקי קרומלוב', en: 'Český Krumlov' }, hours: 3, note: { he: 'עיירה מימי הביניים עם טירה; יום ארוך, אפשר גם ללון', en: 'A medieval town with a castle; a long day, or stay the night' }, priceIls: { low: 100, high: 450 }, kind: 'neighborhood' },
      { name: { he: 'קוטנה הורה', en: 'Kutná Hora' }, hours: 1, note: { he: 'ברכבת; קתדרלת ברברה הקדושה וכנסיית העצמות', en: 'By train; St Barbara’s Cathedral and the Bone Church' }, priceIls: { low: 60, high: 300 }, kind: 'religious' },
      { name: { he: 'טרזין', en: 'Terezín' }, hours: 1, note: { he: 'גטו ומחנה מעבר לשעבר; ביקור חשוב לישראלים', en: 'A former ghetto and transit camp; an important visit for Israelis' }, priceIls: { low: 70, high: 280 }, kind: 'landmark' },
      { name: { he: 'קרלובי וארי', en: 'Karlovy Vary' }, hours: 2, note: { he: 'עיר מרחצאות עם מעיינות חמים ושדרות', en: 'A spa town with hot springs and colonnades' }, priceIls: { low: 70, high: 320 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'המרכז קומפקטי וטוב להליכה; מטרו וטראמים זולים ויעילים. מהשדה יש אוטובוס למטרו או לתחנת הרכבת. רכב רק לטיולים מחוץ לעיר.', en: 'The centre is compact and walkable; the metro and trams are cheap and efficient. Buses link the airport to the metro and the main station. A car only for trips outside the city.' } },
    practical: {
      currency: 'CZK', language: { he: 'צ׳כית; אנגלית במקומות תיירותיים', en: 'Czech; English in tourist areas' }, timeZone: 'Europe/Prague',
      visaNoteForIsraelis: SCHENGEN_VISA,
      kosher: { he: 'יש כמה מסעדות כשרות באזור הרובע היהודי ובית חב״ד; כדאי לבדוק את תעודת הכשרות בכל מקום.', en: 'There are several kosher restaurants around the Jewish quarter and a Chabad house; check each place’s certification.' },
      shabbat: { he: 'בתי כנסת פעילים ובית חב״ד ברובע היהודי; לינה בעיר העתיקה מאפשרת להגיע ברגל.', en: 'Active synagogues and a Chabad house in the Jewish quarter; staying in the Old Town keeps them within walking distance.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–אוקטובר נעימים. בקיץ חם ועמוס מאוד; דצמבר קסום עם שווקי חג המולד אבל קר. ינואר–פברואר קפואים ושקטים.', en: 'April–June and September–October are pleasant. Summer is warm and very crowded; December is magical with Christmas markets but cold. January–February is freezing and quiet.' }
  }
];
