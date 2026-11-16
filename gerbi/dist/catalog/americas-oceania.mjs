// Catalog data (spec 23): Americas & Oceania. Shape and editorial rules: dist/catalog.mjs + docs/specs/23-destinations-catalog-he.md.
// Budget figures are rough per-person-per-day estimates in ₪ on the ground (food, sights, local transport) — without flights or lodging.
// dayTrips[].priceIls = rough ₪ per adult, ESTIMATES (Nov 2026): low ≈ do-it-yourself public transport + main entry fee,
// high ≈ a typical organised group tour from the base; converted at about €1=₪4, $1=₪3.7, £1=₪4.7 and rounded. Show as estimates.
const ESTA = { he: 'ישראל נכללת בתוכנית הפטור מוויזה של ארה״ב מאז 2023, ולכן ברוב המקרים מספיק אישור ESTA שמגישים מראש באינטרנט; יש לבדוק את התנאים העדכניים במקורות הרשמיים.', en: 'Israel joined the US Visa Waiver Program in 2023, so in most cases an ESTA approval, applied for online in advance, is enough; check current conditions with official sources.' };

export default [
  {
    id: 'new-york', code: 'NYC', airports: ['JFK', 'EWR', 'LGA'],
    name: { he: 'ניו יורק', en: 'New York' }, country: { he: 'ארצות הברית', en: 'United States' }, region: 'americas',
    tags: ['city', 'culture', 'food', 'shopping', 'nightlife', 'kosher', 'direct_flight', 'week_long', 'couple'],
    bestMonths: [4, 5, 6, 9, 10, 11, 12], flightHours: 12, direct: true, budgetLevel: 4, dailyBudgetIls: { low: 300, mid: 500, high: 950 },
    summary: { he: 'העיר שלא ישנה: גורדי שחקים, מוזיאונים ענקיים, מופעי ברודוויי, שופינג ואוכל מכל העולם — עם טיסה ישירה ושפע של אוכל כשר.', en: 'The city that never sleeps: skyscrapers, world-class museums, Broadway shows, shopping and food from everywhere — with direct flights and plenty of kosher food.' },
    highlights: [
      { he: 'סנטרל פארק ברגל או באופניים', en: 'Central Park on foot or by bike' },
      { he: 'פסל החירות ואליס איילנד', en: 'The Statue of Liberty and Ellis Island' },
      { he: 'מופע ברודוויי וטיימס סקוור בלילה', en: 'A Broadway show and Times Square at night' },
      { he: 'המטרופוליטן, MoMA ומוזיאון הטבע', en: 'The Met, MoMA and the Natural History Museum' },
      { he: 'הליכה על גשר ברוקלין', en: 'Walking across the Brooklyn Bridge' },
      { he: 'תצפיות מגורדי השחקים', en: 'Views from the skyscrapers' },
      { he: 'שופינג בשדרה החמישית ובסוהו', en: 'Shopping on Fifth Avenue and in SoHo' }
    ],
    areas: [
      { name: { he: 'מידטאון', en: 'Midtown' }, forWhom: { he: 'ביקור ראשון — קרוב לכל דבר, רועש ויקר', en: 'First-timers — close to everything, busy and pricey' } },
      { name: { he: 'אפר ווסט סייד', en: 'Upper West Side' }, forWhom: { he: 'משפחות ושומרי כשרות — שקט יחסי, ליד סנטרל פארק ובתי כנסת', en: 'Families and kosher travellers — calmer, near Central Park and synagogues' } },
      { name: { he: 'גריניץ׳ וילג׳ וסוהו', en: 'Greenwich Village & SoHo' }, forWhom: { he: 'זוגות שאוהבים בתי קפה, חנויות ואווירה', en: 'Couples who like cafés, boutiques and atmosphere' } },
      { name: { he: 'לואר מנהטן', en: 'Lower Manhattan' }, forWhom: { he: 'קרוב לפסל החירות ולגשר ברוקלין, שקט בערב', en: 'Near the Statue of Liberty and Brooklyn Bridge, quiet at night' } },
      { name: { he: 'ברוקלין (ויליאמסבורג ודאמבו)', en: 'Brooklyn (Williamsburg & DUMBO)' }, forWhom: { he: 'צעירים, אוכל וחיי לילה, נוף למנהטן', en: 'Younger travellers, food and nightlife, Manhattan views' } }
    ],
    attractions: [
      { name: { he: 'סנטרל פארק', en: 'Central Park' }, kind: 'park', durationH: 3, tags: ['family', 'nature'], area: 'Central Park', mustSee: true },
      { name: { he: 'פסל החירות ואליס איילנד', en: 'Statue of Liberty & Ellis Island' }, kind: 'landmark', durationH: 4, tags: ['culture', 'family'], area: 'Lower Manhattan', mustSee: true },
      { name: { he: 'מוזיאון המטרופוליטן לאמנות', en: 'The Metropolitan Museum of Art' }, kind: 'museum', durationH: 3, tags: ['culture'], area: 'Upper East Side' },
      { name: { he: 'המוזיאון האמריקאי לתולדות הטבע', en: 'American Museum of Natural History' }, kind: 'museum', durationH: 3, tags: ['family', 'with_children'], area: 'Upper West Side' },
      { name: { he: 'מוזיאון לאמנות מודרנית (MoMA)', en: 'Museum of Modern Art (MoMA)' }, kind: 'museum', durationH: 2.5, tags: ['culture'], area: 'Midtown' },
      { name: { he: 'טופ אוף דה רוק', en: 'Top of the Rock' }, kind: 'viewpoint', durationH: 1.5, tags: ['couple'], area: 'Midtown' },
      { name: { he: 'טיימס סקוור ומופע בברודוויי', en: 'Times Square & a Broadway show' }, kind: 'experience', durationH: 3.5, tags: ['nightlife', 'culture', 'evening'], area: 'Midtown', mustSee: true },
      { name: { he: 'האנדרטה והמוזיאון של 11 בספטמבר', en: '9/11 Memorial & Museum' }, kind: 'museum', durationH: 2.5, tags: ['culture'], area: 'Lower Manhattan', mustSee: true },
      { name: { he: 'גשר ברוקלין ודאמבו', en: 'Brooklyn Bridge & DUMBO' }, kind: 'landmark', durationH: 2, tags: ['couple'], area: 'Brooklyn (Williamsburg & DUMBO)' },
      { name: { he: 'ההיי ליין וצ׳לסי מרקט', en: 'The High Line & Chelsea Market' }, kind: 'park', durationH: 2, tags: ['food'], area: 'Chelsea' },
      { name: { he: 'ויליאמסבורג', en: 'Williamsburg' }, kind: 'neighborhood', durationH: 2.5, tags: ['food', 'nightlife', 'evening'], area: 'Brooklyn (Williamsburg & DUMBO)' },
      { name: { he: 'השדרה החמישית', en: 'Fifth Avenue' }, kind: 'neighborhood', durationH: 2, tags: ['shopping'], area: 'Midtown' },
      { name: { he: 'המעבורת לסטטן איילנד', en: 'Staten Island Ferry' }, kind: 'experience', durationH: 1, tags: ['family', 'low_budget'], area: 'Lower Manhattan' }
    ],
    dayTrips: [
      { name: { he: 'פילדלפיה', en: 'Philadelphia' }, hours: 1.5, note: { he: 'ברכבת — היכל העצמאות ופעמון החירות', en: 'By train — Independence Hall and the Liberty Bell' }, priceIls: { low: 160, high: 750 }, kind: 'landmark' },
      { name: { he: 'וושינגטון', en: 'Washington, D.C.' }, hours: 3, note: { he: 'ברכבת מהירה; יום ארוך, עדיף ללון לילה', en: 'By fast train; a long day, better with an overnight' }, priceIls: { low: 550, high: 1100 }, kind: 'landmark' },
      { name: { he: 'אאוטלט וודברי קומון', en: 'Woodbury Common Premium Outlets' }, hours: 1, note: { he: 'אוטובוס ממנהטן — יום שופינג', en: 'Bus from Manhattan — a shopping day' }, priceIls: { low: 160, high: 200 }, kind: 'experience' }
    ],
    transport: { carRecommended: false, note: { he: 'הרכבת התחתית פועלת מסביב לשעון, ורוב מנהטן נוחה ברגל. מהשדות יש רכבות ומוניות. רכב בעיר — ממש לא כדאי (פקקים וחניה יקרה).', en: 'The subway runs around the clock and most of Manhattan is walkable. Trains and taxis link the airports. Don’t drive in the city (traffic and costly parking).' } },
    practical: {
      currency: 'USD', language: { he: 'אנגלית', en: 'English' }, timeZone: 'America/New_York',
      visaNoteForIsraelis: ESTA,
      kosher: { he: 'שפע של מסעדות ומכולות כשרות, בעיקר במנהטן ובברוקלין; כדאי לבדוק את תעודת הכשרות בכל מקום.', en: 'Plenty of kosher restaurants and grocers, mainly in Manhattan and Brooklyn; check each one’s certification.' },
      shabbat: { he: 'קהילות ובתי כנסת בכל רובע ובתי חב״ד; לינה באפר ווסט סייד או באפר איסט סייד מקלה מאוד על שבת.', en: 'Communities, synagogues and Chabad houses in every borough; staying on the Upper West or Upper East Side makes Shabbat easy.' }
    },
    seasonsNote: { he: 'אביב (אפריל–יוני) וסתיו (ספטמבר–נובמבר) הכי נעימים. דצמבר קר אבל חגיגי ומואר. הקיץ חם ולח, ובינואר–פברואר קר מאוד ולפעמים יורד שלג.', en: 'Spring (April–June) and autumn (September–November) are the most pleasant. December is cold but festive. Summer is hot and humid; January–February is very cold, sometimes snowy.' }
  },
  {
    id: 'florida', code: 'MIA', airports: ['MIA', 'MCO'],
    name: { he: 'פלורידה', en: 'Florida' }, country: { he: 'ארצות הברית', en: 'United States' }, region: 'americas',
    tags: ['beach', 'family', 'with_children', 'water_slides', 'kosher', 'direct_flight', 'week_long', 'shopping', 'nature'],
    bestMonths: [1, 2, 3, 4, 5, 11, 12], flightHours: 13.5, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 300, mid: 550, high: 1000 },
    summary: { he: 'שני טיולים בטיסה אחת: חופים, אר דקו וחיי לילה במיאמי, ופארקי השעשועים הגדולים בעולם באורלנדו — יעד מושלם למשפחות, עם קהילה יהודית גדולה.', en: 'Two trips in one: beaches, Art Deco and nightlife in Miami, and the world’s biggest theme parks in Orlando — ideal for families, with a large Jewish community.' },
    highlights: [
      { he: 'פארקי דיסני ויוניברסל באורלנדו', en: 'Disney and Universal parks in Orlando' },
      { he: 'סאות׳ ביץ׳ ורובע האר דקו', en: 'South Beach and the Art Deco district' },
      { he: 'שייט בסירת מדחף באוורגליידס', en: 'An airboat ride in the Everglades' },
      { he: 'נסיעה על הכביש לקי ווסט', en: 'The drive down to Key West' },
      { he: 'פארקי מים ומגלשות', en: 'Water parks and slides' },
      { he: 'אאוטלטים וקניונים ענקיים', en: 'Huge outlets and malls' }
    ],
    areas: [
      { name: { he: 'מיאמי ביץ׳ (סאות׳ ביץ׳)', en: 'Miami Beach (South Beach)' }, forWhom: { he: 'זוגות וצעירים — חוף, מסעדות וחיי לילה', en: 'Couples and younger travellers — beach, restaurants and nightlife' } },
      { name: { he: 'צפון מיאמי ביץ׳, סרפסייד ואוונטורה', en: 'North Miami Beach, Surfside & Aventura' }, forWhom: { he: 'משפחות ושומרי כשרות — קהילה יהודית גדולה', en: 'Families and kosher travellers — a large Jewish community' } },
      { name: { he: 'מרכז מיאמי', en: 'Central Miami' }, forWhom: { he: 'מי שרוצה את וינווד, ליטל הוואנה ואווירה עירונית', en: 'Those after Wynwood, Little Havana and a city feel' } },
      { name: { he: 'אורלנדו (אזור הפארקים)', en: 'Orlando (theme-park area)' }, forWhom: { he: 'משפחות עם ילדים — כמה ימים של פארקים', en: 'Families with children — several days of parks' } }
    ],
    attractions: [
      { name: { he: 'סאות׳ ביץ׳ ואושן דרייב', en: 'South Beach & Ocean Drive' }, kind: 'beach', durationH: 3, tags: ['beach', 'nightlife', 'evening'], area: 'Miami Beach (South Beach)', mustSee: true },
      { name: { he: 'רובע האר דקו ההיסטורי', en: 'Art Deco Historic District' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture'], area: 'Miami Beach (South Beach)' },
      { name: { he: 'וינווד וולס', en: 'Wynwood Walls' }, kind: 'neighborhood', durationH: 2, tags: ['culture'], area: 'Central Miami' },
      { name: { he: 'ליטל הוואנה (קאז׳ה אוצ׳ו)', en: 'Little Havana (Calle Ocho)' }, kind: 'neighborhood', durationH: 2, tags: ['food', 'culture'], area: 'Central Miami' },
      { name: { he: 'וילה ויזקאיה וגניה', en: 'Vizcaya Museum & Gardens' }, kind: 'museum', durationH: 2, tags: ['culture', 'couple'], area: 'Central Miami' },
      { name: { he: 'קי ביסקיין — פארק ביל באגס', en: 'Key Biscayne — Bill Baggs Cape Florida State Park' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'Central Miami' },
      { name: { he: 'גן החיות של מיאמי', en: 'Zoo Miami' }, kind: 'park', durationH: 3, tags: ['family', 'with_children'], area: 'Central Miami' },
      { name: { he: 'אאוטלט סוגראס מילס', en: 'Sawgrass Mills outlets' }, kind: 'experience', durationH: 4, tags: ['shopping'], area: 'Sunrise (Fort Lauderdale)' },
      { name: { he: 'מג׳יק קינגדום (וולט דיסני וורלד)', en: 'Magic Kingdom (Walt Disney World)' }, kind: 'experience', durationH: 10, tags: ['family', 'with_children'], area: 'Orlando (theme-park area)', mustSee: true },
      { name: { he: 'EPCOT (וולט דיסני וורלד)', en: 'EPCOT (Walt Disney World)' }, kind: 'experience', durationH: 8, tags: ['family'], area: 'Orlando (theme-park area)' },
      { name: { he: 'יוניברסל אורלנדו', en: 'Universal Orlando Resort' }, kind: 'experience', durationH: 10, tags: ['family', 'with_children', 'teens'], area: 'Orlando (theme-park area)', mustSee: true },
      { name: { he: 'פארק המים וולקנו ביי', en: 'Volcano Bay water park' }, kind: 'experience', durationH: 6, tags: ['water_slides', 'family', 'with_children', 'teens'], area: 'Orlando (theme-park area)' }
    ],
    dayTrips: [
      { name: { he: 'פארק האוורגליידס', en: 'Everglades National Park' }, hours: 1, note: { he: 'ממיאמי — שייט בסירת מדחף, תנינים ושבילי טבע', en: 'From Miami — airboat rides, alligators and nature trails' }, priceIls: { low: 120, high: 450 }, kind: 'nature' },
      { name: { he: 'קי ווסט', en: 'Key West' }, hours: 4, note: { he: 'נסיעה מרהיבה על גשרים מעל הים; עדיף ללון לילה', en: 'A spectacular drive over sea bridges; better with an overnight' }, priceIls: { low: 330, high: 560 }, kind: 'neighborhood' },
      { name: { he: 'מרכז החלל קנדי', en: 'Kennedy Space Center' }, hours: 1, note: { he: 'מאורלנדו — חוויה מעולה לילדים ולמבוגרים', en: 'From Orlando — great for kids and adults alike' }, priceIls: { low: 300, high: 550 }, kind: 'museum' }
    ],
    transport: { carRecommended: true, note: { he: 'מחוץ למיאמי ביץ׳ הכול ברכב. בין מיאמי לאורלנדו יש כ־4 שעות נסיעה, או רכבת Brightline. בפארקים של אורלנדו יש הסעות מהמלונות.', en: 'Outside Miami Beach you need a car. Miami to Orlando is about 4 hours by road, or take the Brightline train. Orlando hotels run park shuttles.' } },
    practical: {
      currency: 'USD', language: { he: 'אנגלית; ספרדית נפוצה מאוד במיאמי', en: 'English; Spanish very common in Miami' }, timeZone: 'America/New_York',
      visaNoteForIsraelis: ESTA,
      kosher: { he: 'באזור מיאמי (מיאמי ביץ׳, סרפסייד, צפון מיאמי ביץ׳ ואוונטורה) יש מבחר גדול של מסעדות וסופרים כשרים; באורלנדו יש בית חב״ד ואפשרויות מצומצמות יותר. לבדוק תעודת כשרות בכל מקום.', en: 'The Miami area (Miami Beach, Surfside, North Miami Beach, Aventura) has a wide choice of kosher restaurants and shops; Orlando has a Chabad house and fewer options. Check each certification.' },
      shabbat: { he: 'במיאמי ביץ׳ ובסרפסייד יש בתי כנסת רבים במרחק הליכה; באורלנדו המרחקים גדולים — כדאי לתאם עם חב״ד מראש.', en: 'Miami Beach and Surfside have many synagogues within walking distance; Orlando is spread out — arrange with Chabad in advance.' }
    },
    seasonsNote: { he: 'נובמבר–מאי יבש ונעים. יוני–נובמבר זו עונת ההוריקנים: חם, לח וסופות רעמים אחר הצהריים. בחגים האמריקאיים ובחופשות הפארקים עמוסים מאוד.', en: 'November–May is dry and pleasant. June–November is hurricane season: hot, humid, with afternoon storms. Parks are packed during US holidays.' }
  },
  {
    id: 'los-angeles', code: 'LAX', airports: ['LAX'],
    name: { he: 'לוס אנג׳לס', en: 'Los Angeles' }, country: { he: 'ארצות הברית', en: 'United States' }, region: 'americas',
    tags: ['city', 'beach', 'family', 'with_children', 'direct_flight', 'week_long', 'kosher', 'shopping', 'food'],
    bestMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11], flightHours: 15.5, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 300, mid: 500, high: 950 },
    summary: { he: 'הוליווד, חופי האוקיינוס השקט ופארקים של אולפני קולנוע — עיר ענקית שמתאימה למשפחות, ונקודת פתיחה מצוינת לטיול בחוף קליפורניה.', en: 'Hollywood, Pacific beaches and film-studio parks — a sprawling city that suits families and makes a great start to a California coast road trip.' },
    highlights: [
      { he: 'אולפני יוניברסל ודיסנילנד', en: 'Universal Studios and Disneyland' },
      { he: 'שקיעה במצפה גריפית׳ מול שלט הוליווד', en: 'Sunset at Griffith Observatory facing the Hollywood Sign' },
      { he: 'סנטה מוניקה וונציה ביץ׳', en: 'Santa Monica and Venice Beach' },
      { he: 'מרכז גטי — אמנות ונוף', en: 'The Getty Center — art and views' },
      { he: 'נסיעה לאורך החוף למאליבו', en: 'A coastal drive to Malibu' },
      { he: 'רודיאו דרייב בבוורלי הילס', en: 'Rodeo Drive in Beverly Hills' }
    ],
    areas: [
      { name: { he: 'סנטה מוניקה וונציה', en: 'Santa Monica & Venice' }, forWhom: { he: 'מי שרוצה חוף, הליכה ואווירה נינוחה', en: 'Those who want the beach, walking and a relaxed vibe' } },
      { name: { he: 'הוליווד ווסט הוליווד', en: 'Hollywood & West Hollywood' }, forWhom: { he: 'מרכזי, חיי לילה ואטרקציות', en: 'Central, with nightlife and sights' } },
      { name: { he: 'בוורלי הילס ופיקו־רוברטסון', en: 'Beverly Hills & Pico-Robertson' }, forWhom: { he: 'שומרי כשרות ומשפחות — קהילה יהודית ומיקום מרכזי', en: 'Kosher travellers and families — a Jewish community and a central location' } },
      { name: { he: 'אנהיים', en: 'Anaheim' }, forWhom: { he: 'משפחות שבאות בעיקר לדיסנילנד', en: 'Families coming mainly for Disneyland' } }
    ],
    attractions: [
      { name: { he: 'מצפה גריפית׳', en: 'Griffith Observatory' }, kind: 'viewpoint', durationH: 2, tags: ['family', 'couple', 'evening'], area: 'Hollywood & West Hollywood', mustSee: true },
      { name: { he: 'שדרת הכוכבים ותיאטרון TCL הסיני', en: 'Hollywood Walk of Fame & TCL Chinese Theatre' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Hollywood & West Hollywood', mustSee: true },
      { name: { he: 'אולפני יוניברסל הוליווד', en: 'Universal Studios Hollywood' }, kind: 'experience', durationH: 8, tags: ['family', 'with_children', 'teens'], area: 'Universal City', mustSee: true },
      { name: { he: 'דיסנילנד', en: 'Disneyland Resort' }, kind: 'experience', durationH: 10, tags: ['family', 'with_children', 'teens'], area: 'Anaheim' },
      { name: { he: 'סיור באולפני וורנר ברוס', en: 'Warner Bros. Studio Tour Hollywood' }, kind: 'experience', durationH: 3, tags: ['family'], area: 'Burbank' },
      { name: { he: 'מרכז גטי', en: 'The Getty Center' }, kind: 'museum', durationH: 3, tags: ['culture'], area: 'Brentwood' },
      { name: { he: 'מוזיאון ה־Broad', en: 'The Broad' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Downtown LA' },
      { name: { he: 'המזח והחוף של סנטה מוניקה', en: 'Santa Monica Pier & beach' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'Santa Monica & Venice', mustSee: true },
      { name: { he: 'טיילת ונציה ביץ׳ והתעלות', en: 'Venice Beach boardwalk & canals' }, kind: 'neighborhood', durationH: 2, tags: ['beach'], area: 'Santa Monica & Venice' },
      { name: { he: 'מאליבו — חוף אל מטדור', en: 'Malibu — El Matador State Beach' }, kind: 'beach', durationH: 2.5, tags: ['couple', 'nature'], area: 'Malibu' },
      { name: { he: 'רודיאו דרייב', en: 'Rodeo Drive' }, kind: 'neighborhood', durationH: 1.5, tags: ['shopping', 'luxury'], area: 'Beverly Hills & Pico-Robertson' },
      { name: { he: 'גרנד סנטרל מרקט', en: 'Grand Central Market' }, kind: 'market', durationH: 1, tags: ['food'], area: 'Downtown LA' },
      { name: { he: 'תצפית לשלט הוליווד מלייק הוליווד פארק', en: 'Hollywood Sign view from Lake Hollywood Park' }, kind: 'viewpoint', durationH: 1, tags: ['family'], area: 'Hollywood & West Hollywood' }
    ],
    dayTrips: [
      { name: { he: 'סן דייגו', en: 'San Diego' }, hours: 2.5, note: { he: 'חופים, העיר העתיקה וגן החיות המפורסם', en: 'Beaches, Old Town and the famous zoo' }, priceIls: { low: 250, high: 650 }, kind: 'neighborhood' },
      { name: { he: 'סנטה ברברה', en: 'Santa Barbara' }, hours: 2, note: { he: 'עיירת חוף ספרדית ויקבים בסביבה', en: 'A Spanish-style coastal town with wineries nearby' }, priceIls: { low: 230, high: 600 }, kind: 'neighborhood' },
      { name: { he: 'פארק ג׳ושוע טרי', en: 'Joshua Tree National Park' }, hours: 2.5, note: { he: 'מדבר, סלעים ועצי יהושע; לצאת מוקדם ולהצטייד במים', en: 'Desert, boulders and Joshua trees; start early and carry water' }, priceIls: { low: 150, high: 900 }, kind: 'nature' }
    ],
    transport: { carRecommended: true, note: { he: 'העיר ענקית ופרוסה — כמעט הכול ברכב או באפליקציות נסיעה. יש פקקים כבדים, אז כדאי לחלק את הימים לפי אזורים.', en: 'The city is huge and spread out — almost everything is by car or ride app. Traffic is heavy, so plan each day around one area.' } },
    practical: {
      currency: 'USD', language: { he: 'אנגלית; ספרדית נפוצה', en: 'English; Spanish widely spoken' }, timeZone: 'America/Los_Angeles',
      visaNoteForIsraelis: ESTA,
      kosher: { he: 'מבחר גדול של מסעדות וסופרים כשרים, בעיקר בפיקו־רוברטסון, בלה בריאה ובעמק סן פרננדו; לבדוק תעודת כשרות בכל מקום.', en: 'A wide choice of kosher restaurants and shops, mainly in Pico-Robertson, La Brea and the San Fernando Valley; check each certification.' },
      shabbat: { he: 'קהילות ובתי כנסת רבים בפיקו־רוברטסון ובהנקוק פארק; לינה שם מאפשרת שבת ברגל, כי בשאר העיר הכול ברכב.', en: 'Many communities and synagogues in Pico-Robertson and Hancock Park; staying there allows a walkable Shabbat, as the rest of the city is car-based.' }
    },
    seasonsNote: { he: 'אפשר להגיע כמעט כל השנה. מאי–יוני לפעמים מעוננים בבקרים על החוף; הקיץ חם ויבש; בחורף נעים יחסית עם מעט ימי גשם.', en: 'Good almost year-round. May–June can bring overcast mornings on the coast; summer is hot and dry; winter is fairly mild with a few rainy days.' }
  },
  {
    id: 'las-vegas', code: 'LAS', airports: ['LAS'],
    name: { he: 'לאס וגאס', en: 'Las Vegas' }, country: { he: 'ארצות הברית', en: 'United States' }, region: 'americas',
    tags: ['nightlife', 'couple', 'luxury', 'shopping', 'nature', 'adventure', 'city', 'week_long'],
    bestMonths: [3, 4, 5, 10, 11], flightHours: 17, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 250, mid: 450, high: 900 },
    summary: { he: 'עיר הבידור באמצע המדבר: מלונות־ענק, מופעים ומזרקות, ובמרחק נסיעה — הגרנד קניון, סכר הובר ושמורות סלע אדום מרהיבות.', en: 'The entertainment capital in the middle of the desert: mega-resorts, shows and fountains — and within driving distance, the Grand Canyon, Hoover Dam and stunning red-rock parks.' },
    highlights: [
      { he: 'הסטריפ בלילה', en: 'The Strip at night' },
      { he: 'מופע של סירק דו סוליי', en: 'A Cirque du Soleil show' },
      { he: 'מזרקות הבלאג׳יו', en: 'The Bellagio fountains' },
      { he: 'הגרנד קניון', en: 'The Grand Canyon' },
      { he: 'קניון הסלע האדום', en: 'Red Rock Canyon' },
      { he: 'פרימונט סטריט ווגאס הישנה', en: 'Fremont Street and old Vegas' }
    ],
    areas: [
      { name: { he: 'הסטריפ', en: 'The Strip' }, forWhom: { he: 'ביקור ראשון — המלונות, המופעים והאווירה', en: 'First-timers — the resorts, shows and buzz' } },
      { name: { he: 'דאונטאון (פרימונט סטריט)', en: 'Downtown (Fremont Street)' }, forWhom: { he: 'תקציב נמוך יותר ואווירת וגאס הישנה', en: 'Lower budgets and old-Vegas atmosphere' } },
      { name: { he: 'הנדרסון וסאמרליין', en: 'Henderson & Summerlin' }, forWhom: { he: 'משפחות ומי שמגיע עם רכב ומעדיף שקט', en: 'Families and drivers who prefer quiet' } }
    ],
    attractions: [
      { name: { he: 'הסטריפ בלילה', en: 'The Strip at night' }, kind: 'experience', durationH: 3, tags: ['nightlife', 'evening'], area: 'The Strip', mustSee: true },
      { name: { he: 'מזרקות הבלאג׳יו', en: 'Fountains of Bellagio' }, kind: 'landmark', durationH: 0.5, tags: ['couple', 'evening'], area: 'The Strip', mustSee: true },
      { name: { he: 'מופע של סירק דו סוליי', en: 'A Cirque du Soleil show' }, kind: 'experience', durationH: 2, tags: ['nightlife', 'couple', 'evening'], area: 'The Strip' },
      { name: { he: 'מופע בספירה (Sphere)', en: 'A show at Sphere' }, kind: 'experience', durationH: 2, tags: ['nightlife', 'evening'], area: 'The Strip' },
      { name: { he: 'גלגל הענק היי רולר', en: 'High Roller observation wheel' }, kind: 'viewpoint', durationH: 1, tags: ['couple'], area: 'The Strip' },
      { name: { he: 'פרימונט סטריט אקספיריינס', en: 'Fremont Street Experience' }, kind: 'experience', durationH: 2, tags: ['nightlife', 'evening'], area: 'Downtown (Fremont Street)', mustSee: true },
      { name: { he: 'מוזיאון הניאון', en: 'The Neon Museum' }, kind: 'museum', durationH: 1, tags: ['culture'], area: 'Downtown (Fremont Street)' },
      { name: { he: 'מוזיאון המאפיה', en: 'The Mob Museum' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Downtown (Fremont Street)' },
      { name: { he: 'פורום שופס בסיזרס פאלאס', en: 'The Forum Shops at Caesars' }, kind: 'experience', durationH: 2, tags: ['shopping', 'luxury'], area: 'The Strip' },
      { name: { he: 'שלט ״Welcome to Fabulous Las Vegas״', en: 'Welcome to Fabulous Las Vegas sign' }, kind: 'landmark', durationH: 0.5, tags: ['city'], area: 'The Strip' },
      { name: { he: 'קניון הסלע האדום', en: 'Red Rock Canyon National Conservation Area' }, kind: 'nature', durationH: 3, tags: ['nature', 'adventure'], area: 'Henderson & Summerlin' },
      { name: { he: 'שבעת ההרים הקסומים', en: 'Seven Magic Mountains' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Jean' }
    ],
    dayTrips: [
      { name: { he: 'סכר הובר', en: 'Hoover Dam' }, hours: 0.75, note: { he: 'סכר ענק על נהר הקולורדו; אפשר לשלב בדרך לגרנד קניון', en: 'A huge dam on the Colorado River; easy to combine with the Grand Canyon' }, priceIls: { low: 220, high: 400 }, kind: 'landmark' },
      { name: { he: 'עמק האש', en: 'Valley of Fire State Park' }, hours: 1, note: { he: 'סלעים אדומים וכתובות סלע; לא בצהרי הקיץ', en: 'Red rock and petroglyphs; avoid summer middays' }, priceIls: { low: 100, high: 750 }, kind: 'nature' },
      { name: { he: 'הגרנד קניון — השוליים המערביים והסקייווק', en: 'Grand Canyon West & Skywalk' }, hours: 2.5, note: { he: 'הקרוב ביותר לווגאס; מסלול שמנוהל בנפרד מהפארק הלאומי', en: 'The closest rim to Vegas; run separately from the national park' }, priceIls: { low: 550, high: 1100 }, kind: 'viewpoint' },
      { name: { he: 'הגרנד קניון — השוליים הדרומיים', en: 'Grand Canyon South Rim' }, hours: 4.5, note: { he: 'הנופים הקלאסיים של הפארק הלאומי; יום ארוך מאוד — עדיף ללון לילה או לטוס בטיסת נוף', en: 'The classic national-park views; a very long day — better with an overnight or a scenic flight' }, priceIls: { low: 670, high: 1000 }, kind: 'viewpoint' }
    ],
    transport: { carRecommended: false, note: { he: 'על הסטריפ זזים ברגל, במונורייל ובאפליקציות נסיעה — המרחקים בין המלונות גדולים ממה שנראה. לטיולי היום כדאי לשכור רכב או להצטרף לסיור מאורגן.', en: 'On the Strip you get around on foot, by monorail and ride apps — distances between resorts are longer than they look. Rent a car or join a tour for day trips.' } },
    practical: {
      currency: 'USD', language: { he: 'אנגלית', en: 'English' }, timeZone: 'America/Los_Angeles',
      visaNoteForIsraelis: ESTA,
      kosher: { he: 'יש בעיר כמה מסעדות כשרות ובית חב״ד; האפשרויות על הסטריפ עצמו מצומצמות — כדאי לתכנן ולתאם מראש.', en: 'The city has a few kosher restaurants and a Chabad house; options on the Strip itself are limited — plan and arrange ahead.' },
      shabbat: { he: 'מלונות הסטריפ ענקיים ופועלים עם כרטיסי חדר אלקטרוניים ומעליות — כדאי לבדוק מראש פתרונות ולתאם ארוחות עם חב״ד.', en: 'Strip resorts are huge and run on electronic key cards and lifts — check solutions in advance and arrange meals with Chabad.' }
    },
    seasonsNote: { he: 'מרץ–מאי ואוקטובר–נובמבר נוחים. ביוני–ספטמבר החום במדבר עולה על 40 מעלות, ובחורף הלילות קרים. בטיולי מדבר תמיד להצטייד בהרבה מים.', en: 'March–May and October–November are comfortable. June–September desert heat tops 40°C, and winter nights are cold. Always carry plenty of water on desert trips.' }
  },
  {
    id: 'cancun', code: 'CUN', airports: ['CUN'],
    name: { he: 'קנקון וריביירה מאיה', en: 'Cancún & the Riviera Maya' }, country: { he: 'מקסיקו', en: 'Mexico' }, region: 'americas',
    tags: ['beach', 'all_inclusive', 'couple', 'family', 'relaxation', 'nature', 'week_long', 'nightlife'],
    bestMonths: [11, 12, 1, 2, 3, 4], flightHours: 17, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 180, mid: 320, high: 650 },
    summary: { he: 'ים קריבי טורקיז, ריזורטים הכול־כלול, צלילה בסנוטים ואתרי מאיה עתיקים — מקנקון ועד טולום, שילוב של מנוחה והרפתקה.', en: 'Turquoise Caribbean sea, all-inclusive resorts, swimming in cenotes and ancient Maya sites — from Cancún to Tulum, a blend of rest and adventure.' },
    highlights: [
      { he: 'שחייה בסנוטים — בורות מים טבעיים', en: 'Swimming in cenotes — natural sinkholes' },
      { he: 'חורבות המאיה בטולום מעל הים', en: 'The Maya ruins of Tulum above the sea' },
      { he: 'צ׳יצ׳ן איצה, מפלאי העולם החדשים', en: 'Chichén Itzá, one of the New Seven Wonders' },
      { he: 'שנורקל עם צבי ים באקומל', en: 'Snorkelling with sea turtles in Akumal' },
      { he: 'הפארקים שקסרט ושל־הא', en: 'The Xcaret and Xel-Há parks' },
      { he: 'האי איסלה מוחרס', en: 'Isla Mujeres' }
    ],
    areas: [
      { name: { he: 'אזור המלונות של קנקון', en: 'Cancún Hotel Zone' }, forWhom: { he: 'הכול־כלול, חופים רחבים וחיי לילה', en: 'All-inclusive stays, wide beaches and nightlife' } },
      { name: { he: 'פלאיה דל כרמן', en: 'Playa del Carmen' }, forWhom: { he: 'מי שרוצה עיירה מהלכת עם מסעדות, באמצע הריביירה', en: 'Those who want a walkable town with restaurants, mid-Riviera' } },
      { name: { he: 'טולום', en: 'Tulum' }, forWhom: { he: 'זוגות — אווירה בוהמיינית, סנוטים וחורבות', en: 'Couples — a bohemian vibe, cenotes and ruins' } },
      { name: { he: 'פוארטו מורלוס', en: 'Puerto Morelos' }, forWhom: { he: 'משפחות שמחפשות שקט קרוב לשדה', en: 'Families wanting quiet near the airport' } }
    ],
    attractions: [
      { name: { he: 'חוף דלפינס', en: 'Playa Delfines' }, kind: 'beach', durationH: 3, tags: ['beach'], area: 'Cancún Hotel Zone', mustSee: true },
      { name: { he: 'המוזיאון התת־ימי MUSA', en: 'MUSA Underwater Museum of Art' }, kind: 'experience', durationH: 2, tags: ['adventure'], area: 'Cancún Hotel Zone' },
      { name: { he: 'מרקדו 28', en: 'Mercado 28' }, kind: 'market', durationH: 1, tags: ['shopping'], area: 'Downtown Cancún' },
      { name: { he: 'השדרה החמישית בפלאיה דל כרמן', en: 'Quinta Avenida, Playa del Carmen' }, kind: 'neighborhood', durationH: 2, tags: ['shopping', 'nightlife'], area: 'Playa del Carmen' },
      { name: { he: 'פארק שקסרט', en: 'Xcaret Park' }, kind: 'experience', durationH: 8, tags: ['family', 'with_children', 'nature', 'teens'], area: 'Playa del Carmen', mustSee: true },
      { name: { he: 'פארק של־הא', en: 'Xel-Há Park' }, kind: 'experience', durationH: 6, tags: ['family', 'with_children', 'teens'], area: 'Akumal' },
      { name: { he: 'אקומל — שחייה עם צבי ים', en: 'Akumal — swimming with sea turtles' }, kind: 'beach', durationH: 3, tags: ['nature', 'family'], area: 'Akumal' },
      { name: { he: 'האתר הארכאולוגי בטולום', en: 'Tulum archaeological site' }, kind: 'landmark', durationH: 2, tags: ['culture', 'beach'], area: 'Tulum', mustSee: true },
      { name: { he: 'הגראן סנוטה', en: 'Gran Cenote' }, kind: 'nature', durationH: 2, tags: ['nature'], area: 'Tulum' },
      { name: { he: 'סנוטה דוס אוחוס', en: 'Cenote Dos Ojos' }, kind: 'nature', durationH: 2, tags: ['adventure', 'nature', 'teens'], area: 'Tulum' },
      { name: { he: 'חורבות קובה', en: 'Cobá ruins' }, kind: 'landmark', durationH: 2.5, tags: ['culture'], area: 'Tulum' }
    ],
    dayTrips: [
      { name: { he: 'צ׳יצ׳ן איצה', en: 'Chichén Itzá' }, hours: 2.5, note: { he: 'לצאת מוקדם לפני החום וההמונים; משלבים לרוב עם סנוטה איק קיל', en: 'Leave early to beat heat and crowds; usually combined with Cenote Ik Kil' }, priceIls: { low: 260, high: 480 }, kind: 'landmark' },
      { name: { he: 'איסלה מוחרס', en: 'Isla Mujeres' }, hours: 0.5, note: { he: 'מעבורת מקנקון; מסתובבים באי בעגלת גולף', en: 'Ferry from Cancún; get around the island by golf cart' }, priceIls: { low: 80, high: 300 }, kind: 'beach' },
      { name: { he: 'קוסומל', en: 'Cozumel' }, hours: 0.75, note: { he: 'מעבורת מפלאיה דל כרמן; צלילה ושנורקל בשוניות', en: 'Ferry from Playa del Carmen; reef diving and snorkelling' }, priceIls: { low: 200, high: 400 }, kind: 'beach' },
      { name: { he: 'האי הולבוש', en: 'Holbox' }, hours: 3, note: { he: 'נסיעה ומעבורת; עדיף לפחות לילה אחד', en: 'Drive plus ferry; better with at least one night' }, priceIls: { low: 200, high: 400 }, kind: 'beach' }
    ],
    transport: { carRecommended: true, note: { he: 'מי שנשאר בריזורט מסתדר בהסעות. כדי לטייל בין סנוטים, טולום וחורבות — רכב שכור נוח, ויש גם אוטובוסי ADO נוחים בין הערים.', en: 'Resort stays work fine with transfers. To explore cenotes, Tulum and ruins a rental car is handy; comfortable ADO buses also link the towns.' } },
    practical: {
      currency: 'MXN', language: { he: 'ספרדית; אנגלית נפוצה באזורי התיירות', en: 'Spanish; English common in tourist areas' }, timeZone: 'America/Cancun',
      visaNoteForIsraelis: { he: 'בדרך כלל ישראלים אינם צריכים ויזה לביקור תיירותי במקסיקו, אבל בביקורת הגבולות בקנקון היו מקרים של סירוב כניסה — כדאי להחזיק הזמנת לינה, כרטיס חזור ואמצעי תשלום. הכללים משתנים — יש לבדוק במקורות הרשמיים.', en: 'Israelis usually need no visa for a tourist visit to Mexico, but there have been cases of refused entry at Cancún — carry your accommodation booking, return ticket and means of payment. Rules change — check official sources.' },
      kosher: { he: 'יש בתי חב״ד בקנקון, בפלאיה דל כרמן ובטולום עם ארוחות; מחוץ להם אין כמעט היצע כשר — לתאם מראש.', en: 'Chabad houses in Cancún, Playa del Carmen and Tulum offer meals; beyond them there is almost no kosher supply — arrange in advance.' },
      shabbat: { he: 'בריזורט אין צורך בנסיעות — נוח לשבת; ארוחות ונרות לתאם עם חב״ד.', en: 'No travel is needed at a resort — easy for Shabbat; arrange meals and candles with Chabad.' }
    },
    seasonsNote: { he: 'דצמבר–אפריל יבש ונעים — עונת השיא. יוני–נובמבר עונת ההוריקנים (בעיקר אוגוסט–אוקטובר). אצות סרגסום מגיעות לחופים בעיקר באביב ובקיץ, בהיקף שמשתנה משנה לשנה.', en: 'December–April is dry and pleasant — peak season. June–November is hurricane season (mainly August–October). Sargassum seaweed reaches the beaches mostly in spring and summer, varying year to year.' }
  },
  {
    id: 'costa-rica', code: 'SJO', airports: ['SJO', 'LIR'],
    name: { he: 'קוסטה ריקה', en: 'Costa Rica' }, country: { he: 'קוסטה ריקה', en: 'Costa Rica' }, region: 'americas',
    tags: ['nature', 'adventure', 'beach', 'family', 'couple', 'week_long'],
    bestMonths: [12, 1, 2, 3, 4], flightHours: 18, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 350, high: 650 },
    summary: { he: 'הרי געש, יערות גשם, עצלנים וטוקנים, וחופים בשני אוקיינוסים — טיול טבע והרפתקאות מושלם, שמתאים גם למשפחות.', en: 'Volcanoes, rainforests, sloths and toucans, and beaches on two oceans — a superb nature and adventure trip that also suits families.' },
    highlights: [
      { he: 'הר הגעש ארנל ומעיינות חמים', en: 'Arenal Volcano and hot springs' },
      { he: 'יער הענן במונטוורדה', en: 'The Monteverde cloud forest' },
      { he: 'עצלנים וקופים בפארק מנואל אנטוניו', en: 'Sloths and monkeys in Manuel Antonio' },
      { he: 'אומגות וגשרים תלויים מעל היער', en: 'Ziplines and hanging bridges above the forest' },
      { he: 'המים התכולים של ריו סלסטה', en: 'The sky-blue waters of Río Celeste' },
      { he: 'רפטינג בנהר פקוארה', en: 'Rafting on the Pacuare River' }
    ],
    areas: [
      { name: { he: 'לה פורטונה וארנל', en: 'La Fortuna & Arenal' }, forWhom: { he: 'משפחות וזוגות — הר געש, מעיינות ואטרקציות', en: 'Families and couples — volcano, hot springs and activities' } },
      { name: { he: 'מונטוורדה', en: 'Monteverde' }, forWhom: { he: 'אוהבי טבע והרפתקאות — יער ענן ואומגות', en: 'Nature and adventure lovers — cloud forest and ziplines' } },
      { name: { he: 'מנואל אנטוניו', en: 'Manuel Antonio' }, forWhom: { he: 'חוף וג׳ונגל במקום אחד', en: 'Beach and jungle in one place' } },
      { name: { he: 'גואנקסטה (טמרינדו)', en: 'Guanacaste (Tamarindo)' }, forWhom: { he: 'חופים, גלישה ואקלים יבש יותר', en: 'Beaches, surfing and a drier climate' } },
      { name: { he: 'החוף הקריבי (פוארטו ויחו)', en: 'Caribbean coast (Puerto Viejo)' }, forWhom: { he: 'אווירה קריבית רגועה ותקציב נמוך יותר', en: 'A laid-back Caribbean feel and lower budgets' } }
    ],
    attractions: [
      { name: { he: 'הפארק הלאומי הר הגעש ארנל', en: 'Arenal Volcano National Park' }, kind: 'nature', durationH: 3, tags: ['nature'], area: 'La Fortuna & Arenal', mustSee: true },
      { name: { he: 'מעיינות חמים בלה פורטונה', en: 'Hot springs in La Fortuna' }, kind: 'experience', durationH: 3, tags: ['relaxation', 'couple'], area: 'La Fortuna & Arenal' },
      { name: { he: 'מפל לה פורטונה', en: 'La Fortuna Waterfall' }, kind: 'nature', durationH: 2, tags: ['nature'], area: 'La Fortuna & Arenal' },
      { name: { he: 'הגשרים התלויים של ארנל', en: 'Arenal Hanging Bridges' }, kind: 'nature', durationH: 2.5, tags: ['family', 'nature'], area: 'La Fortuna & Arenal' },
      { name: { he: 'שמורת יער הענן מונטוורדה', en: 'Monteverde Cloud Forest Reserve' }, kind: 'nature', durationH: 3, tags: ['nature'], area: 'Monteverde', mustSee: true },
      { name: { he: 'אומגות במונטוורדה', en: 'Ziplining in Monteverde' }, kind: 'experience', durationH: 2.5, tags: ['adventure', 'teens'], area: 'Monteverde' },
      { name: { he: 'סיור לילה ביער', en: 'A guided night walk in the forest' }, kind: 'experience', durationH: 2, tags: ['family', 'nature', 'evening'] },
      { name: { he: 'הפארק הלאומי מנואל אנטוניו', en: 'Manuel Antonio National Park' }, kind: 'nature', durationH: 4, tags: ['beach', 'family', 'nature'], area: 'Manuel Antonio', mustSee: true },
      { name: { he: 'ריו סלסטה והפארק הלאומי טנוריו', en: 'Río Celeste & Tenorio Volcano National Park' }, kind: 'nature', durationH: 4, tags: ['nature', 'adventure'], area: 'La Fortuna & Arenal' },
      { name: { he: 'רפטינג בנהר פקוארה', en: 'Whitewater rafting on the Pacuare River' }, kind: 'experience', durationH: 6, tags: ['adventure', 'teens'], area: 'Turrialba' },
      { name: { he: 'חוף טמרינדו', en: 'Tamarindo Beach' }, kind: 'beach', durationH: 3, tags: ['beach'], area: 'Guanacaste (Tamarindo)' },
      { name: { he: 'הפארק הלאומי קאוויטה', en: 'Cahuita National Park' }, kind: 'nature', durationH: 3, tags: ['beach', 'nature'], area: 'Caribbean coast (Puerto Viejo)' }
    ],
    dayTrips: [
      { name: { he: 'הר הגעש פואס', en: 'Poás Volcano' }, hours: 1.5, note: { he: 'מסן חוסה; לוע פעיל — להגיע בבוקר לפני העננים, ולבדוק מראש שהפארק פתוח', en: 'From San José; an active crater — go early before the clouds, and check the park is open' }, priceIls: { low: 220, high: 450 }, kind: 'nature' },
      { name: { he: 'גני המפלים לה פאס', en: 'La Paz Waterfall Gardens' }, hours: 1.5, note: { he: 'מפלים ובעלי חיים — טוב לילדים', en: 'Waterfalls and wildlife — good for kids' }, priceIls: { low: 200, high: 450 }, kind: 'park' },
      { name: { he: 'הר הגעש אירסו', en: 'Irazú Volcano' }, hours: 1.5, note: { he: 'הגבוה בהרי הגעש במדינה; קר למעלה', en: 'The country’s highest volcano; cold at the top' }, priceIls: { low: 100, high: 400 }, kind: 'nature' }
    ],
    transport: { carRecommended: true, note: { he: 'רכב שכור (עדיף 4X4) הוא הדרך הנוחה לטייל; הכבישים איטיים, אז לתכנן פחות קילומטרים ביום. יש גם שאטלים בין אזורי התיירות.', en: 'A rental car (ideally 4x4) is the easiest way around; roads are slow, so plan short daily distances. Shuttles also link the tourist areas.' } },
    practical: {
      currency: 'CRC', language: { he: 'ספרדית; אנגלית באזורי התיירות', en: 'Spanish; English in tourist areas' }, timeZone: 'America/Costa_Rica',
      visaNoteForIsraelis: { he: 'בדרך כלל ישראלים אינם צריכים ויזה לביקור תיירותי קצר; ייתכן שיידרש כרטיס יציאה מהמדינה. הכללים משתנים — יש לבדוק במקורות הרשמיים.', en: 'Israelis usually need no visa for a short tourist visit; an onward ticket may be required. Rules change — check official sources.' },
      kosher: { he: 'יש בית חב״ד בסן חוסה ובכמה אזורי תיירות; מחוץ להם ההיצע הכשר מועט — כדאי להביא או לתאם אוכל מראש.', en: 'Chabad operates in San José and some tourist areas; elsewhere kosher supply is scarce — bring or arrange food in advance.' },
      shabbat: { he: 'כדאי לתכנן את המסלול כך שהשבת תיפול ליד בית חב״ד, ולתאם ארוחות מראש.', en: 'Plan the route so Shabbat falls near a Chabad house, and arrange meals in advance.' }
    },
    seasonsNote: { he: 'דצמבר–אפריל זו העונה היבשה בצד הפסיפי — הכי פופולרית. מאי–נובמבר ״העונה הירוקה״: גשמים בעיקר אחר הצהריים ומחירים נמוכים יותר. בחוף הקריבי דפוס הגשמים שונה, וספטמבר–אוקטובר שם לרוב יבשים יחסית.', en: 'December–April is the dry season on the Pacific side — the most popular time. May–November is the “green season”: mostly afternoon rain and lower prices. The Caribbean coast has a different pattern; September–October there is often relatively dry.' }
  },
  {
    id: 'peru', code: 'LIM', airports: ['LIM', 'CUZ'],
    name: { he: 'פרו', en: 'Peru' }, country: { he: 'פרו', en: 'Peru' }, region: 'americas',
    tags: ['culture', 'adventure', 'nature', 'food', 'week_long', 'low_budget'],
    bestMonths: [5, 6, 7, 8, 9], flightHours: 19, direct: false, budgetLevel: 2, dailyBudgetIls: { low: 130, mid: 250, high: 500 },
    summary: { he: 'מאצ׳ו פיצ׳ו, קוסקו והעמק הקדוש בהרי האנדים, ולימה — אחת מבירות האוכל של העולם. טיול תרבות והרפתקה בגובה רב, שדורש זמן להתאקלם.', en: 'Machu Picchu, Cusco and the Sacred Valley high in the Andes, plus Lima — one of the world’s food capitals. A culture and adventure trip at altitude that needs time to acclimatise.' },
    highlights: [
      { he: 'מאצ׳ו פיצ׳ו עם הזריחה', en: 'Machu Picchu at sunrise' },
      { he: 'העיר העתיקה של קוסקו', en: 'Cusco’s old town' },
      { he: 'שווקים וכפרים בעמק הקדוש', en: 'Markets and villages in the Sacred Valley' },
      { he: 'בריכות המלח של מאראס והטרסות במוראי', en: 'The Maras salt pans and the Moray terraces' },
      { he: 'הר הקשת', en: 'Rainbow Mountain' },
      { he: 'סביצ׳ה והמטבח הפרואני בלימה', en: 'Ceviche and Peruvian cuisine in Lima' }
    ],
    areas: [
      { name: { he: 'מירפלורס (לימה)', en: 'Miraflores (Lima)' }, forWhom: { he: 'בסיס נוח ובטוח יחסית מול האוקיינוס, מסעדות', en: 'A comfortable, relatively safe base on the ocean, with restaurants' } },
      { name: { he: 'בארנקו (לימה)', en: 'Barranco (Lima)' }, forWhom: { he: 'אווירה בוהמיינית, אמנות וחיי לילה', en: 'Bohemian vibe, art and nightlife' } },
      { name: { he: 'קוסקו', en: 'Cusco' }, forWhom: { he: 'בסיס לכל הטיולים באנדים — בגובה 3,400 מטר', en: 'The base for Andean trips — at 3,400 m' } },
      { name: { he: 'העמק הקדוש', en: 'Sacred Valley' }, forWhom: { he: 'נמוך יותר מקוסקו — טוב להתאקלמות ולמשפחות', en: 'Lower than Cusco — good for acclimatising and for families' } }
    ],
    attractions: [
      { name: { he: 'מאצ׳ו פיצ׳ו', en: 'Machu Picchu' }, kind: 'landmark', durationH: 4, tags: ['culture', 'adventure'], area: 'Aguas Calientes', mustSee: true },
      { name: { he: 'פלאסה דה ארמס והקתדרלה של קוסקו', en: 'Plaza de Armas & Cusco Cathedral' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Cusco', mustSee: true },
      { name: { he: 'קוריקנצ׳ה', en: 'Qorikancha' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Cusco' },
      { name: { he: 'סקסאיוואמן', en: 'Sacsayhuamán' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Cusco' },
      { name: { he: 'שוק סן פדרו', en: 'San Pedro Market' }, kind: 'market', durationH: 1, tags: ['food'], area: 'Cusco' },
      { name: { he: 'פיסאק — השוק והחורבות', en: 'Pisac market & ruins' }, kind: 'landmark', durationH: 3, tags: ['culture', 'shopping'], area: 'Sacred Valley' },
      { name: { he: 'המבצר באויאנטאיטמבו', en: 'Ollantaytambo fortress' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Sacred Valley', mustSee: true },
      { name: { he: 'מוראי ובריכות המלח של מאראס', en: 'Moray & the Maras salt pans' }, kind: 'landmark', durationH: 3, tags: ['culture', 'nature'], area: 'Sacred Valley' },
      { name: { he: 'המרכז ההיסטורי של לימה', en: 'Lima historic centre' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'Lima Centro' },
      { name: { he: 'מוזיאון לארקו', en: 'Larco Museum' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Pueblo Libre (Lima)' },
      { name: { he: 'וואקה פוקיאנה', en: 'Huaca Pucllana' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Miraflores (Lima)' },
      { name: { he: 'המלקון של מירפלורס ופארק האהבה', en: 'Miraflores Malecón & Parque del Amor' }, kind: 'viewpoint', durationH: 1.5, tags: ['couple'], area: 'Miraflores (Lima)' },
      { name: { he: 'בארנקו', en: 'Barranco' }, kind: 'neighborhood', durationH: 2, tags: ['nightlife', 'food'], area: 'Barranco (Lima)' }
    ],
    dayTrips: [
      { name: { he: 'הר הקשת (ויניקונקה)', en: 'Rainbow Mountain (Vinicunca)' }, hours: 3, note: { he: 'מקוסקו; יציאה לפני עלות השחר והליכה בגובה של כ־5,000 מטר — רק אחרי התאקלמות', en: 'From Cusco; a pre-dawn start and a walk at about 5,000 m — only once acclimatised' }, priceIls: { low: 110, high: 230 }, kind: 'nature' },
      { name: { he: 'אגם הומנטאי', en: 'Humantay Lake' }, hours: 3, note: { he: 'מקוסקו; עלייה תלולה לאגם טורקיז בגובה רב', en: 'From Cusco; a steep climb to a turquoise high-altitude lake' }, priceIls: { low: 110, high: 230 }, kind: 'nature' },
      { name: { he: 'פראקס ואיי בייסטס', en: 'Paracas & the Ballestas Islands' }, hours: 3.5, note: { he: 'מלימה; שייט לאריות ים ולציפורים — יום ארוך, עדיף ללון', en: 'From Lima; a boat trip to sea lions and birds — a long day, better with an overnight' }, priceIls: { low: 220, high: 450 }, kind: 'nature' }
    ],
    transport: { carRecommended: false, note: { he: 'בין לימה לקוסקו טסים (כשעה ורבע). למאצ׳ו פיצ׳ו מגיעים ברכבת לאגואס קליינטס ומשם באוטובוס. כרטיסי הכניסה והרכבת מוגבלים — להזמין הרבה זמן מראש.', en: 'Fly between Lima and Cusco (about 1¼ hours). Reach Machu Picchu by train to Aguas Calientes, then a bus. Entry and train tickets are limited — book well ahead.' } },
    practical: {
      currency: 'PEN', language: { he: 'ספרדית (וקצ׳ואה באנדים); אנגלית מוגבלת מחוץ לאזורי התיירות', en: 'Spanish (and Quechua in the Andes); limited English outside tourist areas' }, timeZone: 'America/Lima',
      visaNoteForIsraelis: { he: 'בדרך כלל ישראלים אינם צריכים ויזה לביקור תיירותי קצר; הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israelis usually need no visa for a short tourist visit; rules change — check official sources before flying.' },
      kosher: { he: 'יש בתי חב״ד בלימה ובקוסקו עם ארוחות (בקוסקו מגיעים הרבה מטיילים ישראלים); מחוץ להם אין כמעט היצע כשר — לתאם או להביא אוכל ארוז.', en: 'Chabad houses in Lima and Cusco serve meals (Cusco sees many Israeli travellers); elsewhere there is almost no kosher supply — arrange or bring packed food.' },
      shabbat: { he: 'כדאי לתכנן שהשבת תיפול בקוסקו או בלימה ולתאם ארוחות עם חב״ד מראש.', en: 'Plan for Shabbat in Cusco or Lima and arrange meals with Chabad in advance.' }
    },
    seasonsNote: { he: 'מאי–ספטמבר זו העונה היבשה באנדים — ימים בהירים ולילות קרים; יוני–אוגוסט הכי עמוסים. נובמבר–מרץ גשום בהרים, ושביל האינקה סגור בפברואר. בלימה החורף (יוני–ספטמבר) אפור ומעונן.', en: 'May–September is the dry season in the Andes — clear days and cold nights; June–August is busiest. November–March is rainy in the mountains, and the Inca Trail closes in February. Lima’s winter (June–September) is grey and overcast.' }
  },
  {
    id: 'buenos-aires', code: 'BUE', airports: ['EZE', 'AEP'],
    name: { he: 'בואנוס איירס', en: 'Buenos Aires' }, country: { he: 'ארגנטינה', en: 'Argentina' }, region: 'americas',
    tags: ['city', 'culture', 'food', 'nightlife', 'kosher', 'week_long', 'low_budget', 'shopping'],
    bestMonths: [3, 4, 5, 9, 10, 11], flightHours: 20, direct: false, budgetLevel: 2, dailyBudgetIls: { low: 130, mid: 230, high: 450 },
    summary: { he: 'הפריז של דרום אמריקה: שדרות רחבות, טנגו, בתי קפה, סטייקים ויין מלבק, וקהילה יהודית גדולה — ובסיס לטיסות למפלי איגואסו ולפטגוניה.', en: 'The Paris of South America: grand avenues, tango, cafés, steak and Malbec, and a large Jewish community — and a base for flights to Iguazú Falls and Patagonia.' },
    highlights: [
      { he: 'מופע טנגו וערב במילונגה', en: 'A tango show and an evening at a milonga' },
      { he: 'בית הקברות רקולטה', en: 'Recoleta Cemetery' },
      { he: 'הבתים הצבעוניים של לה בוקה', en: 'The colourful houses of La Boca' },
      { he: 'יריד יום ראשון בסן טלמו', en: 'The Sunday fair in San Telmo' },
      { he: 'ארוחת אסאדו ויין מלבק', en: 'An asado dinner with Malbec' },
      { he: 'תיאטרון קולון', en: 'The Teatro Colón' },
      { he: 'המשך למפלי איגואסו או לפטגוניה', en: 'Onward to Iguazú Falls or Patagonia' }
    ],
    areas: [
      { name: { he: 'פלרמו', en: 'Palermo' }, forWhom: { he: 'צעירים וזוגות — מסעדות, ברים ופארקים', en: 'Younger travellers and couples — restaurants, bars and parks' } },
      { name: { he: 'רקולטה', en: 'Recoleta' }, forWhom: { he: 'מרכזי, אלגנטי ובטוח יחסית — טוב לביקור ראשון', en: 'Central, elegant and relatively safe — good for first-timers' } },
      { name: { he: 'סן טלמו', en: 'San Telmo' }, forWhom: { he: 'אווירה ותיקה, טנגו ועתיקות, תקציב נמוך יותר', en: 'Old-world charm, tango and antiques, lower budgets' } },
      { name: { he: 'פוארטו מדרו', en: 'Puerto Madero' }, forWhom: { he: 'מודרני, שקט ויוקרתי ליד המים', en: 'Modern, quiet and upmarket by the water' } }
    ],
    attractions: [
      { name: { he: 'בית הקברות רקולטה', en: 'Recoleta Cemetery' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Recoleta', mustSee: true },
      { name: { he: 'חנות הספרים אל אתנאו גרנד ספלנדיד', en: 'El Ateneo Grand Splendid bookshop' }, kind: 'landmark', durationH: 0.5, tags: ['culture'], area: 'Recoleta' },
      { name: { he: 'לה בוקה וקמיניטו', en: 'La Boca & Caminito' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture'], area: 'La Boca', mustSee: true },
      { name: { he: 'יריד סן טלמו', en: 'San Telmo Sunday fair' }, kind: 'market', durationH: 2, tags: ['shopping', 'culture'], area: 'San Telmo' },
      { name: { he: 'פלאסה דה מאיו והקאסה רוסדה', en: 'Plaza de Mayo & Casa Rosada' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Centro (Microcentro)', mustSee: true },
      { name: { he: 'תיאטרון קולון', en: 'Teatro Colón' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Centro (Microcentro)' },
      { name: { he: 'קפה טורטוני', en: 'Café Tortoni' }, kind: 'landmark', durationH: 0.5, tags: ['food'], area: 'Centro (Microcentro)' },
      { name: { he: 'מופע טנגו', en: 'A tango show' }, kind: 'experience', durationH: 3, tags: ['nightlife', 'couple', 'evening'] },
      { name: { he: 'ארוחה בפרייה (מסעדת בשרים)', en: 'Dinner at a parrilla (steakhouse)' }, kind: 'experience', durationH: 2, tags: ['food', 'evening'] },
      { name: { he: 'מוזיאון MALBA', en: 'MALBA museum' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Palermo' },
      { name: { he: 'פארקי פלרמו וגן הוורדים', en: 'Bosques de Palermo & the Rose Garden' }, kind: 'park', durationH: 2, tags: ['family'], area: 'Palermo' },
      { name: { he: 'פוארטו מדרו וגשר האישה', en: 'Puerto Madero & Puente de la Mujer' }, kind: 'neighborhood', durationH: 1.5, tags: ['couple'], area: 'Puerto Madero' },
      { name: { he: 'שכונת אונסה והחיים היהודיים', en: 'Once and Jewish Buenos Aires' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture', 'kosher'], area: 'Once (Balvanera)' }
    ],
    dayTrips: [
      { name: { he: 'טיגרה והדלתא', en: 'Tigre & the Paraná Delta' }, hours: 1, note: { he: 'ברכבת; שייט בתעלות ושוק', en: 'By train; canal boat rides and a market' }, priceIls: { low: 40, high: 300 }, kind: 'nature' },
      { name: { he: 'קולוניה דל סקרמנטו (אורוגוואי)', en: 'Colonia del Sacramento (Uruguay)' }, hours: 1.25, note: { he: 'מעבורת מהירה; עיירה קולוניאלית — לקחת דרכון', en: 'Fast ferry; a colonial town — bring your passport' }, priceIls: { low: 250, high: 450 }, kind: 'neighborhood' },
      { name: { he: 'מפלי איגואסו', en: 'Iguazú Falls' }, hours: 2, note: { he: 'טיסה פנימית; לא מתאים כיום אחד — כדאי לפחות שני לילות כדי לראות את הצד הארגנטינאי והברזילאי', en: 'A domestic flight; not a day trip — allow at least two nights to see the Argentine and Brazilian sides' } },
      { name: { he: 'פטגוניה — אל קלפטה וקרחון פריטו מורנו', en: 'Patagonia — El Calafate & Perito Moreno Glacier' }, hours: 3.5, note: { he: 'טיסה פנימית; צריך לפחות 3–4 ימים, בעיקר באוקטובר–אפריל', en: 'A domestic flight; needs at least 3–4 days, best October–April' } }
    ],
    transport: { carRecommended: false, note: { he: 'רכבת תחתית (סובטה), אוטובוסים ומוניות באפליקציה. רכב בעיר לא נחוץ. לאיגואסו ולפטגוניה טסים משדה אאורופארקה (AEP) ברוב המקרים.', en: 'Subway (Subte), buses and app taxis. No need for a car in the city. Flights to Iguazú and Patagonia mostly leave from Aeroparque (AEP).' } },
    practical: {
      currency: 'ARS', language: { he: 'ספרדית; אנגלית במקומות תיירותיים', en: 'Spanish; English in tourist spots' }, timeZone: 'America/Argentina/Buenos_Aires',
      visaNoteForIsraelis: { he: 'בדרך כלל ישראלים אינם צריכים ויזה לביקור תיירותי קצר; הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israelis usually need no visa for a short tourist visit; rules change — check official sources before flying.' },
      kosher: { he: 'אחת הקהילות היהודיות הגדולות בעולם — מסעדות, מאפיות וסופרים כשרים, בעיקר באונסה, בבלגרנו ובפלרמו; לבדוק תעודת כשרות בכל מקום.', en: 'One of the world’s largest Jewish communities — kosher restaurants, bakeries and shops, mainly in Once, Belgrano and Palermo; check each certification.' },
      shabbat: { he: 'בתי כנסת רבים ובתי חב״ד ברחבי העיר; כדאי ללון קרוב לקהילה ולתאם ארוחות.', en: 'Many synagogues and Chabad houses around the city; stay near a community and arrange meals.' }
    },
    seasonsNote: { he: 'אביב (ספטמבר–נובמבר, עם פריחת הג׳קרנדות) וסתיו (מרץ–מאי) הכי נעימים. דצמבר–פברואר חם ולח; יוני–אוגוסט קריר. פטגוניה מתאימה בעיקר באוקטובר–אפריל.', en: 'Spring (September–November, with jacarandas in bloom) and autumn (March–May) are the most pleasant. December–February is hot and humid; June–August is cool. Patagonia is best October–April.' }
  },
  {
    id: 'rio', code: 'RIO', airports: ['GIG'],
    name: { he: 'ריו דה ז׳ניירו', en: 'Rio de Janeiro' }, country: { he: 'ברזיל', en: 'Brazil' }, region: 'americas',
    tags: ['beach', 'city', 'nightlife', 'nature', 'culture', 'week_long', 'low_budget'],
    bestMonths: [4, 5, 6, 8, 9, 10], flightHours: 18, direct: false, budgetLevel: 2, dailyBudgetIls: { low: 130, mid: 230, high: 450 },
    summary: { he: 'עיר בין הרים ירוקים לאוקיינוס: ישו הגואל, הר הסוכר, חופי קופקבנה ואיפנמה, סמבה וקרנבל — אנרגיה שאין בשום מקום אחר.', en: 'A city between green mountains and the ocean: Christ the Redeemer, Sugarloaf, Copacabana and Ipanema beaches, samba and Carnival — energy like nowhere else.' },
    highlights: [
      { he: 'פסל ישו הגואל על הקורקובדו', en: 'Christ the Redeemer on Corcovado' },
      { he: 'רכבל הר הסוכר בשקיעה', en: 'The Sugarloaf cable car at sunset' },
      { he: 'החופים של קופקבנה ואיפנמה', en: 'Copacabana and Ipanema beaches' },
      { he: 'מדרגות סלרון ושכונת סנטה תרזה', en: 'The Selarón Steps and Santa Teresa' },
      { he: 'ערב סמבה בלאפה', en: 'A samba night in Lapa' },
      { he: 'יער טיז׳וקה בלב העיר', en: 'Tijuca Forest in the heart of the city' }
    ],
    areas: [
      { name: { he: 'קופקבנה', en: 'Copacabana' }, forWhom: { he: 'ביקור ראשון — חוף, תחבורה ובית חב״ד', en: 'First-timers — beach, transport and Chabad' } },
      { name: { he: 'איפנמה ולבלון', en: 'Ipanema & Leblon' }, forWhom: { he: 'זוגות — יוקרתי יותר, מסעדות ואווירה נינוחה', en: 'Couples — more upmarket, restaurants and a relaxed feel' } },
      { name: { he: 'בוטפוגו', en: 'Botafogo' }, forWhom: { he: 'שכונה מקומית ותקציב בינוני, נוף להר הסוכר', en: 'A local neighbourhood at mid-range prices, with Sugarloaf views' } },
      { name: { he: 'סנטה תרזה', en: 'Santa Teresa' }, forWhom: { he: 'אמנות ואווירה בוהמיינית על הגבעה; זהירות בשעות הלילה', en: 'Art and a bohemian hilltop vibe; take care at night' } }
    ],
    attractions: [
      { name: { he: 'ישו הגואל (קורקובדו)', en: 'Christ the Redeemer (Corcovado)' }, kind: 'landmark', durationH: 3, tags: ['culture'], area: 'Cosme Velho', mustSee: true },
      { name: { he: 'הר הסוכר', en: 'Sugarloaf Mountain' }, kind: 'viewpoint', durationH: 2.5, tags: ['couple'], area: 'Urca', mustSee: true },
      { name: { he: 'חוף קופקבנה', en: 'Copacabana Beach' }, kind: 'beach', durationH: 3, tags: ['beach'], area: 'Copacabana' },
      { name: { he: 'חוף איפנמה ושקיעה בארפואדור', en: 'Ipanema Beach & sunset at Arpoador' }, kind: 'beach', durationH: 3, tags: ['beach', 'couple', 'evening'], area: 'Ipanema & Leblon', mustSee: true },
      { name: { he: 'מדרגות סלרון', en: 'Selarón Steps' }, kind: 'landmark', durationH: 0.5, tags: ['culture'], area: 'Lapa' },
      { name: { he: 'סנטה תרזה והחשמלית', en: 'Santa Teresa & its tram' }, kind: 'neighborhood', durationH: 2, tags: ['culture'], area: 'Santa Teresa' },
      { name: { he: 'לאפה — סמבה וחיי לילה', en: 'Lapa — samba & nightlife' }, kind: 'neighborhood', durationH: 3, tags: ['nightlife', 'evening', 'adults'], area: 'Lapa' },
      { name: { he: 'הפארק הלאומי טיז׳וקה', en: 'Tijuca National Park' }, kind: 'nature', durationH: 3, tags: ['nature'], area: 'Tijuca Forest' },
      { name: { he: 'הגן הבוטני', en: 'Rio Botanical Garden' }, kind: 'park', durationH: 2, tags: ['family', 'nature'], area: 'Jardim Botânico' },
      { name: { he: 'לגונת רודריגו דה פרייטס', en: 'Rodrigo de Freitas Lagoon' }, kind: 'park', durationH: 1.5, tags: ['family'], area: 'Lagoa' },
      { name: { he: 'מוזיאון המחר', en: 'Museum of Tomorrow' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Centro' },
      { name: { he: 'סיור באצטדיון מרקנה', en: 'Maracanã Stadium tour' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Maracanã' },
      { name: { he: 'רחיפה מפדרה בוניטה', en: 'Hang-gliding from Pedra Bonita' }, kind: 'experience', durationH: 2, tags: ['adventure', 'teens'], area: 'São Conrado' }
    ],
    dayTrips: [
      { name: { he: 'פטרופוליס', en: 'Petrópolis' }, hours: 1.5, note: { he: 'עיר הקיסרות בהרים — ארמונות ואקלים קריר', en: 'The imperial city in the hills — palaces and cooler air' }, priceIls: { low: 40, high: 400 }, kind: 'neighborhood' },
      { name: { he: 'אילה גרנדה', en: 'Ilha Grande' }, hours: 3, note: { he: 'נסיעה וסירה לאי ללא מכוניות; עדיף ללון לילה או שניים', en: 'Road plus boat to a car-free island; better with a night or two' }, priceIls: { low: 200, high: 500 }, kind: 'beach' },
      { name: { he: 'בוזיוס', en: 'Búzios' }, hours: 3, note: { he: 'עיירת נופש עם מפרצים וחופים; יום ארוך', en: 'A resort town of coves and beaches; a long day' }, priceIls: { low: 130, high: 350 }, kind: 'beach' }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו בין אזורי החוף והמרכז, ומוניות באפליקציה. כדאי לא להסתובב עם חפצי ערך על החוף, ולהעדיף נסיעה על פני הליכה ברחובות ריקים בלילה.', en: 'The metro links the beach districts and centre, plus app taxis. Don’t carry valuables on the beach, and prefer a ride over walking empty streets at night.' } },
    practical: {
      currency: 'BRL', language: { he: 'פורטוגזית; אנגלית מוגבלת', en: 'Portuguese; limited English' }, timeZone: 'America/Sao_Paulo',
      visaNoteForIsraelis: { he: 'בדרך כלל ישראלים אינם צריכים ויזה לביקור תיירותי קצר; הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israelis usually need no visa for a short tourist visit; rules change — check official sources before flying.' },
      kosher: { he: 'יש קהילה יהודית ובתי חב״ד, אבל ההיצע הכשר מצומצם — כדאי לתאם ארוחות מראש.', en: 'There is a Jewish community and Chabad, but kosher supply is limited — arrange meals in advance.' },
      shabbat: { he: 'בקופקבנה ובאיפנמה יש בתי כנסת ובית חב״ד; לינה שם מאפשרת להגיע ברגל.', en: 'Copacabana and Ipanema have synagogues and Chabad; staying there keeps them within walking distance.' }
    },
    seasonsNote: { he: 'אפריל–יוני ואוגוסט–אוקטובר נעימים ופחות לחים. דצמבר–מרץ חם מאוד, לח וגשום — וזו גם עונת הקרנבל (פברואר–מרץ) והשיא במחירים. ערב ראש השנה האזרחית בקופקבנה הוא אירוע ענק.', en: 'April–June and August–October are pleasant and less humid. December–March is very hot, humid and rainy — also Carnival season (February–March) and peak prices. New Year’s Eve on Copacabana is a huge event.' }
  },
  {
    id: 'sydney', code: 'SYD', airports: ['SYD'],
    name: { he: 'סידני', en: 'Sydney' }, country: { he: 'אוסטרליה', en: 'Australia' }, region: 'oceania',
    tags: ['city', 'beach', 'nature', 'family', 'food', 'week_long', 'kosher'],
    bestMonths: [10, 11, 12, 1, 2, 3, 4], flightHours: 20, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 250, mid: 420, high: 800 },
    summary: { he: 'בית האופרה, גשר הנמל ומעבורות על מים כחולים, חופי גלישה בתוך העיר ובעלי חיים שאין במקום אחר — טיסה ארוכה, אבל שווה כל שעה.', en: 'The Opera House, the Harbour Bridge and ferries across blue water, surf beaches inside the city and wildlife found nowhere else — a long flight that rewards every hour.' },
    highlights: [
      { he: 'בית האופרה וגשר הנמל', en: 'The Opera House and the Harbour Bridge' },
      { he: 'מסלול החוף מבונדיי לקוג׳י', en: 'The Bondi to Coogee coastal walk' },
      { he: 'מעבורת למנלי', en: 'The ferry to Manly' },
      { he: 'קואלות וקנגורו בגן החיות טרונגה', en: 'Koalas and kangaroos at Taronga Zoo' },
      { he: 'טיפוס על גשר הנמל', en: 'Climbing the Harbour Bridge' },
      { he: 'ההרים הכחולים', en: 'The Blue Mountains' }
    ],
    areas: [
      { name: { he: 'הרוקס וסירקולר קיי', en: 'The Rocks & Circular Quay' }, forWhom: { he: 'ביקור ראשון — ליד האופרה, הגשר והמעבורות', en: 'First-timers — next to the Opera House, the bridge and ferries' } },
      { name: { he: 'דרלינג הארבר', en: 'Darling Harbour' }, forWhom: { he: 'משפחות — אקווריום, טיילת ואטרקציות', en: 'Families — aquarium, promenade and attractions' } },
      { name: { he: 'בונדיי', en: 'Bondi' }, forWhom: { he: 'חוף וגלישה; קהילה יהודית ואוכל כשר בסביבה', en: 'Beach and surf; a Jewish community and kosher food nearby' } },
      { name: { he: 'מנלי', en: 'Manly' }, forWhom: { he: 'אווירת עיירת חוף, חצי שעה במעבורת מהעיר', en: 'A beach-town feel, half an hour by ferry from the city' } },
      { name: { he: 'סארי הילס', en: 'Surry Hills' }, forWhom: { he: 'אוהבי אוכל, בתי קפה וברים', en: 'Food lovers — cafés and bars' } }
    ],
    attractions: [
      { name: { he: 'בית האופרה של סידני', en: 'Sydney Opera House' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'The Rocks & Circular Quay', mustSee: true },
      { name: { he: 'טיפוס על גשר הנמל (BridgeClimb)', en: 'Sydney Harbour BridgeClimb' }, kind: 'experience', durationH: 3.5, tags: ['adventure'], area: 'The Rocks & Circular Quay' },
      { name: { he: 'הרוקס', en: 'The Rocks' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture', 'food'], area: 'The Rocks & Circular Quay' },
      { name: { he: 'הגן הבוטני המלכותי וכיסא גברת מקווארי', en: 'Royal Botanic Garden & Mrs Macquarie’s Chair' }, kind: 'park', durationH: 2, tags: ['family', 'couple'], area: 'The Rocks & Circular Quay' },
      { name: { he: 'הגלריה לאמנות של ניו סאות׳ ויילס', en: 'Art Gallery of New South Wales' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'The Domain' },
      { name: { he: 'חוף בונדיי', en: 'Bondi Beach' }, kind: 'beach', durationH: 3, tags: ['beach'], area: 'Bondi', mustSee: true, months: [1, 2, 3, 4, 11, 12] },
      { name: { he: 'מסלול החוף בונדיי–קוג׳י', en: 'Bondi to Coogee coastal walk' }, kind: 'nature', durationH: 3, tags: ['nature'], area: 'Bondi' },
      { name: { he: 'מעבורת וחוף מנלי', en: 'Manly ferry & beach' }, kind: 'experience', durationH: 4, tags: ['beach', 'family'], area: 'Manly', mustSee: true },
      { name: { he: 'גן החיות טרונגה', en: 'Taronga Zoo' }, kind: 'park', durationH: 4, tags: ['family', 'with_children'], area: 'Mosman' },
      { name: { he: 'אקווריום סי לייף סידני', en: 'SEA LIFE Sydney Aquarium' }, kind: 'experience', durationH: 2, tags: ['family', 'with_children'], area: 'Darling Harbour' },
      { name: { he: 'שוק הדגים של סידני', en: 'Sydney Fish Market' }, kind: 'market', durationH: 1.5, tags: ['food'], area: 'Pyrmont' },
      { name: { he: 'המוזיאון היהודי של סידני', en: 'Sydney Jewish Museum' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Darlinghurst' },
      { name: { he: 'ווטסונס ביי ותצפית הגאפ', en: 'Watsons Bay & The Gap' }, kind: 'viewpoint', durationH: 2, tags: ['couple'], area: 'Watsons Bay' }
    ],
    dayTrips: [
      { name: { he: 'ההרים הכחולים', en: 'Blue Mountains' }, hours: 2, note: { he: 'ברכבת או ברכב — תצפית שלוש האחיות ומסלולי הליכה', en: 'By train or car — the Three Sisters lookout and walking trails' }, priceIls: { low: 30, high: 450 }, kind: 'nature' },
      { name: { he: 'עמק האנטר', en: 'Hunter Valley' }, hours: 2.5, note: { he: 'אזור יין וגבינות; עדיף בסיור מאורגן', en: 'Wine and cheese country; best on an organised tour' }, priceIls: { low: 360, high: 600 }, kind: 'experience' },
      { name: { he: 'פורט סטיבנס', en: 'Port Stephens' }, hours: 2.5, note: { he: 'דיונות חול ותצפית דולפינים', en: 'Sand dunes and dolphin watching' }, priceIls: { low: 360, high: 600 }, kind: 'nature' },
      { name: { he: 'הפארק הלאומי המלכותי', en: 'Royal National Park' }, hours: 1, note: { he: 'צוקים, חופים ומסלולי חוף', en: 'Cliffs, beaches and coastal trails' }, priceIls: { low: 20, high: 350 }, kind: 'nature' }
    ],
    transport: { carRecommended: false, note: { he: 'רכבות, אוטובוסים ומעבורות — משלמים בכרטיס אשראי ללא מגע. בעיר לא צריך רכב; לטיולי יום רכב שכור נוח (נהיגה בצד שמאל).', en: 'Trains, buses and ferries — pay by contactless card. No car needed in the city; a rental helps for day trips (driving on the left).' } },
    practical: {
      currency: 'AUD', language: { he: 'אנגלית', en: 'English' }, timeZone: 'Australia/Sydney',
      visaNoteForIsraelis: { he: 'ישראלים צריכים אשרת תייר שמגישים מראש באינטרנט (בדרך כלל ויזת Visitor, סוג 600); זמני הטיפול משתנים — כדאי להגיש מוקדם ולבדוק במקורות הרשמיים.', en: 'Israelis need a tourist visa applied for online in advance (usually the Visitor visa, subclass 600); processing times vary — apply early and check official sources.' },
      kosher: { he: 'בבונדיי ובפרברים המזרחיים יש מסעדות, מאפיות וסופרים כשרים ובתי חב״ד; לבדוק תעודת כשרות בכל מקום.', en: 'Bondi and the eastern suburbs have kosher restaurants, bakeries, shops and Chabad houses; check each certification.' },
      shabbat: { he: 'בתי כנסת רבים בבונדיי, בדובר הייטס וברוז ביי; לינה באזור מאפשרת שבת ברגל.', en: 'Many synagogues in Bondi, Dover Heights and Rose Bay; staying in the area allows a walkable Shabbat.' }
    },
    seasonsNote: { he: 'העונות הפוכות לשלנו: אוקטובר–אפריל חמים ומתאימים לחוף; דצמבר–פברואר זה הקיץ והשיא, עם הזיקוקים בערב השנה החדשה. יוני–אוגוסט חורף מתון — טוב לעיר, פחות לחוף.', en: 'Seasons are reversed: October–April is warm and good for the beach; December–February is peak summer, with the New Year’s Eve fireworks. June–August is a mild winter — fine for the city, less so for beaches.' }
  },
  {
    id: 'new-zealand', code: 'AKL', airports: ['AKL', 'ZQN'],
    name: { he: 'ניו זילנד', en: 'New Zealand' }, country: { he: 'ניו זילנד', en: 'New Zealand' }, region: 'oceania',
    tags: ['nature', 'adventure', 'family', 'couple', 'week_long', 'ski'],
    bestMonths: [11, 12, 1, 2, 3, 4], flightHours: 24, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 230, mid: 400, high: 750 },
    summary: { he: 'פיורדים, הרי געש, אגמים טורקיז ושדות גייזרים, וקווינסטאון — בירת האקסטרים. המקום הכי רחוק מישראל, ומהיפים בעולם לטיול ברכב או בקרוואן.', en: 'Fjords, volcanoes, turquoise lakes and geyser fields, plus Queenstown — the adventure capital. As far from Israel as it gets, and one of the world’s finest road trips by car or campervan.' },
    highlights: [
      { he: 'שייט בפיורד מילפורד סאונד', en: 'A cruise on Milford Sound' },
      { he: 'הוביטון — הכפר מ״שר הטבעות״', en: 'Hobbiton — the Lord of the Rings village' },
      { he: 'גייזרים ותרבות מאורית ברוטורואה', en: 'Geysers and Māori culture in Rotorua' },
      { he: 'אקסטרים בקווינסטאון: באנג׳י וסירות סילון', en: 'Queenstown thrills: bungy and jet boats' },
      { he: 'מעבר טונגרירו', en: 'The Tongariro Alpine Crossing' },
      { he: 'אגם טקאפו והר קוק', en: 'Lake Tekapo and Mount Cook' },
      { he: 'מערות התולעים הזוהרות בוויטומו', en: 'The Waitomo glowworm caves' }
    ],
    areas: [
      { name: { he: 'אוקלנד', en: 'Auckland' }, forWhom: { he: 'נקודת הנחיתה — עיר נמל ובסיס לצפון האי הצפוני', en: 'The arrival point — a harbour city and base for the north of the North Island' } },
      { name: { he: 'רוטורואה', en: 'Rotorua' }, forWhom: { he: 'משפחות — גייזרים, תרבות מאורית ופעילויות', en: 'Families — geysers, Māori culture and activities' } },
      { name: { he: 'קווינסטאון', en: 'Queenstown' }, forWhom: { he: 'אוהבי אקסטרים וסקי, ובסיס למילפורד סאונד', en: 'Thrill-seekers and skiers, and a base for Milford Sound' } },
      { name: { he: 'וואנקה והר קוק', en: 'Wanaka & Mount Cook' }, forWhom: { he: 'זוגות ומטיילים — אגמים, הרים ושקט', en: 'Couples and hikers — lakes, mountains and quiet' } }
    ],
    attractions: [
      { name: { he: 'מגדל הסקיי טאוור', en: 'Sky Tower' }, kind: 'viewpoint', durationH: 1, tags: ['family'], area: 'Auckland' },
      { name: { he: 'הר אידן', en: 'Mount Eden (Maungawhau)' }, kind: 'viewpoint', durationH: 1, tags: ['nature'], area: 'Auckland' },
      { name: { he: 'טה פויה — גייזרים ותרבות מאורית', en: 'Te Puia — geysers & Māori culture' }, kind: 'experience', durationH: 3, tags: ['culture', 'family'], area: 'Rotorua', mustSee: true },
      { name: { he: 'וואי־או־טאפו', en: 'Wai-O-Tapu Thermal Wonderland' }, kind: 'nature', durationH: 2, tags: ['nature'], area: 'Rotorua' },
      { name: { he: 'מעבר טונגרירו', en: 'Tongariro Alpine Crossing' }, kind: 'nature', durationH: 8, tags: ['adventure', 'nature'], area: 'Tongariro National Park', months: [1, 2, 3, 4, 11, 12] },
      { name: { he: 'הרכבל והמגלשה של סקייליין קווינסטאון', en: 'Skyline Queenstown gondola & luge' }, kind: 'viewpoint', durationH: 2, tags: ['family'], area: 'Queenstown', mustSee: true },
      { name: { he: 'סירת הסילון בנהר שוטובר', en: 'Shotover Jet' }, kind: 'experience', durationH: 1, tags: ['adventure', 'teens'], area: 'Queenstown' },
      { name: { he: 'באנג׳י מגשר קוואראו', en: 'Kawarau Bridge bungy' }, kind: 'experience', durationH: 2, tags: ['adventure', 'teens'], area: 'Queenstown' },
      { name: { he: 'סקי ברמרקבלס או בקורונט פיק', en: 'Skiing at The Remarkables or Coronet Peak' }, kind: 'experience', durationH: 6, tags: ['ski'], area: 'Queenstown', months: [6, 7, 8, 9, 10] },
      { name: { he: 'אגם וואנקה ו״העץ של וואנקה״', en: 'Lake Wanaka & That Wanaka Tree' }, kind: 'viewpoint', durationH: 1, tags: ['couple'], area: 'Wanaka & Mount Cook' },
      { name: { he: 'מסלול רויס פיק', en: 'Roys Peak Track' }, kind: 'nature', durationH: 6, tags: ['adventure', 'nature'], area: 'Wanaka & Mount Cook' },
      { name: { he: 'מסלול עמק הוקר בהר קוק', en: 'Hooker Valley Track, Aoraki/Mount Cook' }, kind: 'nature', durationH: 3, tags: ['nature', 'family'], area: 'Wanaka & Mount Cook', mustSee: true },
      { name: { he: 'אגם טקאפו וכנסיית הרועה הטוב', en: 'Lake Tekapo & Church of the Good Shepherd' }, kind: 'viewpoint', durationH: 1, tags: ['couple'], area: 'Wanaka & Mount Cook' }
    ],
    dayTrips: [
      { name: { he: 'הוביטון', en: 'Hobbiton Movie Set' }, hours: 2, note: { he: 'מאוקלנד; סיור מודרך בלבד — להזמין מראש', en: 'From Auckland; guided tours only — book ahead' }, priceIls: { low: 260, high: 550 }, kind: 'experience' },
      { name: { he: 'מערות ויטומו', en: 'Waitomo Glowworm Caves' }, hours: 2.5, note: { he: 'מאוקלנד; אפשר לשלב עם הוביטון בדרך לרוטורואה', en: 'From Auckland; combine with Hobbiton on the way to Rotorua' }, priceIls: { low: 130, high: 450 }, kind: 'nature' },
      { name: { he: 'האי וואיהקה', en: 'Waiheke Island' }, hours: 0.75, note: { he: 'מעבורת מאוקלנד — יקבים וחופים', en: 'Ferry from Auckland — wineries and beaches' }, priceIls: { low: 130, high: 450 }, kind: 'beach' },
      { name: { he: 'מילפורד סאונד', en: 'Milford Sound' }, hours: 4, note: { he: 'מקווינסטאון בכביש — יום ארוך מאוד; אפשר גם טיסת נוף. הכביש נסגר לפעמים בחורף', en: 'From Queenstown by road — a very long day; scenic flights also run. The road sometimes closes in winter' }, priceIls: { low: 440, high: 700 }, kind: 'nature' }
    ],
    transport: { carRecommended: true, note: { he: 'רכב שכור או קרוואן הם הדרך הטבעית לטייל; נוהגים בצד שמאל, והדרכים מפותלות — המרחקים לוקחים יותר זמן ממה שנראה. בין האיים טסים או לוקחים מעבורת.', en: 'A rental car or campervan is the natural way to travel; driving is on the left and roads wind, so distances take longer than they look. Fly or ferry between the islands.' } },
    practical: {
      currency: 'NZD', language: { he: 'אנגלית (ומאורית)', en: 'English (and Māori)' }, timeZone: 'Pacific/Auckland',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור תיירותי קצר, אבל חובה להוציא מראש אישור NZeTA; הכללים משתנים — יש לבדוק במקורות הרשמיים.', en: 'Usually no visa is needed for a short tourist visit, but an NZeTA must be obtained in advance; rules change — check official sources.' },
      kosher: { he: 'יש בתי חב״ד באוקלנד, בקווינסטאון ובכמה ערים נוספות; מחוץ להם כמעט אין היצע כשר — קרוואן עם מטבח מקל מאוד.', en: 'Chabad houses operate in Auckland, Queenstown and a few other towns; elsewhere there is almost no kosher supply — a campervan kitchen helps a lot.' },
      shabbat: { he: 'המרחקים גדולים — כדאי לתכנן את המסלול כך שהשבת תיפול ליד בית חב״ד, ולתאם מראש.', en: 'Distances are long — plan the route so Shabbat falls near a Chabad house, and arrange ahead.' }
    },
    seasonsNote: { he: 'העונות הפוכות: דצמבר–פברואר קיץ — הכי חם והכי עמוס; מרץ–אפריל סתיו נהדר ושקט יותר. יוני–ספטמבר עונת הסקי בקווינסטאון, אבל חלק מהמסלולים והכבישים בהרים עלולים להיסגר. מזג האוויר משתנה מהר בכל עונה.', en: 'Seasons are reversed: December–February is summer — warmest and busiest; March–April is a lovely, quieter autumn. June–September is ski season around Queenstown, though some mountain tracks and roads may close. Weather changes fast in any season.' }
  }
];
