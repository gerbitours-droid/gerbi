// Catalog data (spec 23): Turkey, Georgia, Bulgaria, the Gulf, Israel, Morocco. Shape: dist/catalog.mjs.
// Budget figures are rough per-person-per-day estimates in ₪ without flights.
// dayTrips[].priceIls = rough ₪ per adult, ESTIMATES (Nov 2026): low ≈ do-it-yourself public transport + main entry fee,
// high ≈ a typical organised group tour from the base; converted at about €1=₪4, $1=₪3.7, £1=₪4.7 and rounded. Show as estimates.
export default [
  {
    id: 'dubai', trip: 'dubai', code: 'DXB', airports: ['DXB'],
    name: { he: 'דובאי', en: 'Dubai' }, country: { he: 'איחוד האמירויות', en: 'United Arab Emirates' }, region: 'middle-east',
    tags: ['city', 'beach', 'family', 'with_children', 'water_slides', 'shopping', 'luxury', 'direct_flight', 'kosher'],
    bestMonths: [11, 12, 1, 2, 3], flightHours: 3.5, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 450, high: 1000 },
    summary: { he: 'עיר של שיאים: גורדי שחקים, קניונים ענקיים, פארקי מים וחופים — עם מזג אוויר נעים בחורף, ומתאימה במיוחד למשפחות.', en: 'A city of superlatives: skyscrapers, giant malls, water parks and beaches — with pleasant winter weather, and great for families.' },
    highlights: [
      { he: 'תצפית מבורג׳ ח׳ליפה', en: 'The view from the Burj Khalifa' },
      { he: 'פארקי מים ואטרקציות למשפחות', en: 'Water parks and family attractions' },
      { he: 'טיילת המרינה וחוף JBR', en: 'The Marina walk and JBR beach' },
      { he: 'ספארי מדבר וארוחה בדיונות', en: 'A desert safari and dinner in the dunes' },
      { he: 'השווקים והאבּרות בדובאי הישנה', en: 'The souks and abra boats of old Dubai' },
      { he: 'קניות בקניונים הגדולים בעולם', en: 'Shopping in some of the world’s largest malls' }
    ],
    areas: [
      { name: { he: 'דובאי מרינה ו־JBR', en: 'Dubai Marina & JBR' }, forWhom: { he: 'חוף, טיילת ומסעדות — טוב לרוב המטיילים', en: 'Beach, promenade and restaurants — good for most travellers' } },
      { name: { he: 'דאונטאון', en: 'Downtown' }, forWhom: { he: 'מי שרוצה את בורג׳ ח׳ליפה ודובאי מול ברגל', en: 'Walking distance to the Burj Khalifa and Dubai Mall' } },
      { name: { he: 'פאלם ג׳ומיירה', en: 'Palm Jumeirah' }, forWhom: { he: 'ריזורטים עם חוף פרטי — משפחות וזוגות', en: 'Resorts with private beaches — families and couples' } },
      { name: { he: 'דיירה ובור דובאי', en: 'Deira & Bur Dubai' }, forWhom: { he: 'תקציב, שווקים ואווירה מקומית', en: 'Budget stays, souks and local feel' } }
    ],
    attractions: [
      { name: { he: 'בורג׳ ח׳ליפה — At the Top', en: 'Burj Khalifa — At the Top' }, kind: 'viewpoint', durationH: 1.5, tags: ['city', 'family'], area: 'Downtown', mustSee: true },
      { name: { he: 'דובאי מול והאקווריום', en: 'Dubai Mall & Aquarium' }, kind: 'experience', durationH: 3, tags: ['shopping', 'family'], area: 'Downtown' },
      { name: { he: 'מופע המזרקות של דובאי', en: 'The Dubai Fountain show' }, kind: 'experience', durationH: 0.5, tags: ['family', 'couple', 'evening'], area: 'Downtown', mustSee: true },
      { name: { he: 'פארק המים אקוונטורה', en: 'Aquaventure Waterpark' }, kind: 'experience', durationH: 5, tags: ['water_slides', 'family', 'teens'], area: 'Palm Jumeirah' },
      { name: { he: 'פארק המים ווילד וואדי', en: 'Wild Wadi Waterpark' }, kind: 'experience', durationH: 4, tags: ['water_slides', 'family', 'teens'], area: 'Jumeirah' },
      { name: { he: 'חוף JBR והטיילת', en: 'JBR Beach & The Walk' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'Dubai Marina & JBR' },
      { name: { he: 'שוק הזהב ושוק התבלינים', en: 'Gold Souk & Spice Souk' }, kind: 'market', durationH: 2, tags: ['shopping', 'culture'], area: 'Deira & Bur Dubai' },
      { name: { he: 'רובע אל פהידי ההיסטורי', en: 'Al Fahidi Historical District' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture'], area: 'Deira & Bur Dubai' },
      { name: { he: 'מוזיאון העתיד', en: 'Museum of the Future' }, kind: 'museum', durationH: 2, tags: ['family'], area: 'Trade Centre' },
      { name: { he: 'ספארי מדבר', en: 'Desert safari' }, kind: 'experience', durationH: 6, tags: ['adventure', 'family', 'teens', 'evening'], mustSee: true },
      { name: { he: 'מסגרת דובאי (Dubai Frame)', en: 'Dubai Frame' }, kind: 'viewpoint', durationH: 1, tags: ['family'], area: 'Deira & Bur Dubai' },
      { name: { he: 'גן הפרחים מירקל גארדן', en: 'Dubai Miracle Garden' }, kind: 'park', durationH: 2, tags: ['family'], area: 'Al Barsha', months: [1, 2, 3, 4, 5, 11, 12] }
    ],
    dayTrips: [
      { name: { he: 'אבו דאבי — המסגד הגדול והלובר', en: 'Abu Dhabi — Grand Mosque & Louvre' }, hours: 1.5, note: { he: 'נסיעה ברכב או באוטובוס; אפשר לשלב פארק שעשועים באי יאס', en: 'By car or bus; can be combined with a Yas Island theme park' }, priceIls: { low: 120, high: 400 }, kind: 'religious' },
      { name: { he: 'חתא בהרי חג׳ר', en: 'Hatta in the Hajar Mountains' }, hours: 1.5, note: { he: 'סכר, קיאקים ומסלולי טבע', en: 'A dam, kayaking and nature trails' }, priceIls: { low: 60, high: 450 }, kind: 'nature' }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו מהשדה לרוב האזורים; מוניות ואפליקציות נסיעה זולות יחסית. רכב שכור נוח לטיולי יום.', en: 'The metro runs from the airport to most areas; taxis and ride apps are fairly cheap. A rental car helps for day trips.' } },
    practical: {
      currency: 'AED', language: { he: 'ערבית; אנגלית בכל מקום', en: 'Arabic; English everywhere' }, timeZone: 'Asia/Dubai',
      visaNoteForIsraelis: { he: 'ישראלים קיבלו בשנים האחרונות אשרה בהגעה; הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israelis have recently received a visa on arrival; rules change — check official sources before flying.' },
      kosher: { he: 'יש מסעדות ושירותי קייטרינג כשרים ובית חב״ד; לתאם מראש.', en: 'There are kosher restaurants and caterers and a Chabad house; arrange in advance.' },
      shabbat: { he: 'מרחקים גדולים — כדאי לבחור מלון קרוב לקהילה או לבית חב״ד ולתאם ארוחות.', en: 'Distances are large — choose a hotel near the community or Chabad and arrange meals.' }
    },
    seasonsNote: { he: 'נובמבר–מרץ נעים ומושלם לים. אפריל ואוקטובר חמים. יוני–ספטמבר חם מאוד — רוב הזמן בפנים או בבריכה.', en: 'November–March is pleasant and perfect for the beach. April and October are warm. June–September is extremely hot — mostly indoors or by the pool.' }
  },
  {
    id: 'istanbul', code: 'IST', airports: ['IST', 'SAW'],
    name: { he: 'איסטנבול', en: 'Istanbul' }, country: { he: 'טורקיה', en: 'Turkey' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'shopping', 'couple', 'nightlife'],
    bestMonths: [4, 5, 6, 9, 10], flightHours: 5, direct: false, budgetLevel: 2, dailyBudgetIls: { low: 150, mid: 280, high: 550 },
    summary: { he: 'עיר על שתי יבשות: מסגדים וארמונות עות׳מאניים, שווקים צבעוניים, שייט בבוספורוס ואוכל מעולה בכל פינה.', en: 'A city on two continents: Ottoman mosques and palaces, colourful bazaars, Bosphorus cruises and great food on every corner.' },
    highlights: [
      { he: 'איה סופיה והמסגד הכחול בסולטן אחמט', en: 'Hagia Sophia and the Blue Mosque in Sultanahmet' },
      { he: 'שייט בבוספורוס בין אירופה לאסיה', en: 'A Bosphorus cruise between Europe and Asia' },
      { he: 'השוק הגדול ושוק התבלינים', en: 'The Grand Bazaar and the Spice Bazaar' },
      { he: 'ארמון טופקפי ואוצרות הסולטנים', en: 'Topkapı Palace and the sultans’ treasures' },
      { he: 'שקיעה ממגדל גלאטה', en: 'Sunset from the Galata Tower' },
      { he: 'אוכל רחוב, בקלאווה ומסעדות דגים', en: 'Street food, baklava and fish restaurants' }
    ],
    areas: [
      { name: { he: 'סולטן אחמט', en: 'Sultanahmet' }, forWhom: { he: 'מי שבא בשביל האתרים — הכול במרחק הליכה', en: 'Sightseers — the main sights are within walking distance' } },
      { name: { he: 'ביוגלו, גלאטה וקרקוי', en: 'Beyoğlu, Galata & Karaköy' }, forWhom: { he: 'זוגות וצעירים — בתי קפה, ברים וחיי לילה', en: 'Couples and younger travellers — cafés, bars and nightlife' } },
      { name: { he: 'קאדיקוי (הצד האסייתי)', en: 'Kadıköy (Asian side)' }, forWhom: { he: 'אווירה מקומית, שוק אוכל ומחירים נוחים', en: 'Local feel, a food market and good-value prices' } },
      { name: { he: 'בשיקטאש ונישנטאשי', en: 'Beşiktaş & Nişantaşı' }, forWhom: { he: 'קניות, מסעדות וקרבה לבוספורוס', en: 'Shopping, restaurants and close to the Bosphorus' } }
    ],
    attractions: [
      { name: { he: 'איה סופיה', en: 'Hagia Sophia' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'Sultanahmet', mustSee: true },
      { name: { he: 'המסגד הכחול (מסגד סולטן אחמט)', en: 'Blue Mosque (Sultan Ahmed Mosque)' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Sultanahmet', mustSee: true },
      { name: { he: 'ארמון טופקפי', en: 'Topkapı Palace' }, kind: 'museum', durationH: 3, tags: ['culture'], area: 'Sultanahmet', mustSee: true },
      { name: { he: 'בור המים של הבזיליקה', en: 'Basilica Cistern' }, kind: 'landmark', durationH: 1, tags: ['culture', 'family'], area: 'Sultanahmet' },
      { name: { he: 'השוק הגדול (גרנד בזאר)', en: 'Grand Bazaar' }, kind: 'market', durationH: 2.5, tags: ['shopping', 'culture'], area: 'Bazaar Quarter', mustSee: true },
      { name: { he: 'שוק התבלינים', en: 'Spice Bazaar' }, kind: 'market', durationH: 1.5, tags: ['food', 'shopping'], area: 'Bazaar Quarter' },
      { name: { he: 'מגדל גלאטה', en: 'Galata Tower' }, kind: 'viewpoint', durationH: 1, tags: ['couple'], area: 'Beyoğlu, Galata & Karaköy' },
      { name: { he: 'רחוב איסטיקלאל וכיכר טקסים', en: 'İstiklal Avenue & Taksim Square' }, kind: 'neighborhood', durationH: 2, tags: ['shopping', 'nightlife', 'evening'], area: 'Beyoğlu, Galata & Karaköy' },
      { name: { he: 'שייט בבוספורוס', en: 'Bosphorus cruise' }, kind: 'experience', durationH: 2, tags: ['couple', 'family'], area: 'Bazaar Quarter' },
      { name: { he: 'ארמון דולמבהצ׳ה', en: 'Dolmabahçe Palace' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'Beşiktaş & Nişantaşı' },
      { name: { he: 'מסגד סולימאניה', en: 'Süleymaniye Mosque' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'Bazaar Quarter' },
      { name: { he: 'שכונות בלאט ופנר', en: 'Balat & Fener' }, kind: 'neighborhood', durationH: 2.5, tags: ['culture'], area: 'Balat' },
      { name: { he: 'קאדיקוי ושוק האוכל', en: 'Kadıköy and its food market' }, kind: 'neighborhood', durationH: 3, tags: ['food'], area: 'Kadıköy (Asian side)' }
    ],
    dayTrips: [
      { name: { he: 'איי הנסיכים — ביואקאדה', en: 'Princes’ Islands — Büyükada' }, hours: 1.5, note: { he: 'מעבורת מהעיר; אי בלי מכוניות, אופניים ווילות עץ', en: 'A ferry from the city; a car-free island of bikes and wooden villas' }, priceIls: { low: 20, high: 250 }, kind: 'neighborhood' },
      { name: { he: 'בורסה', en: 'Bursa' }, hours: 2.5, note: { he: 'מעבורת מהירה ואוטובוס; הבירה העות׳מאנית הראשונה ומעיינות חמים', en: 'Fast ferry and bus; the first Ottoman capital, with hot springs' }, priceIls: { low: 100, high: 400 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו, חשמליות ומעבורות עם כרטיס איסטנבולקרט; פקקים כבדים — רכב שכור לא כדאי בעיר.', en: 'Metro, trams and ferries with an Istanbulkart; traffic is heavy — a rental car is not worth it in the city.' } },
    practical: {
      currency: 'TRY', language: { he: 'טורקית; אנגלית באזורי התיירות', en: 'Turkish; English in tourist areas' }, timeZone: 'Europe/Istanbul',
      visaNoteForIsraelis: { he: 'ישראלים לרוב אינם נדרשים לאשרה לביקור תיירות קצר; הכללים משתנים — יש לבדוק במקורות הרשמיים לפני ההזמנה.', en: 'Israelis have generally not needed a visa for a short tourist stay; rules change — check official sources before booking.' },
      kosher: { he: 'יש קהילה יהודית ובית חב״ד, אבל ההיצע הכשר מצומצם; לתאם ארוחות מראש.', en: 'There is a Jewish community and a Chabad house, but kosher supply is limited; arrange meals in advance.' },
      shabbat: { he: 'כדאי לתאם מראש עם בית חב״ד ארוחות ומקום ללינה במרחק הליכה.', en: 'Arrange meals with Chabad in advance and stay within walking distance.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–אוקטובר נעימים להליכה. יולי–אוגוסט חמים ועמוסים. החורף קר וגשום, אבל זול ושקט יותר.', en: 'April–June and September–October are pleasant for walking. July–August is hot and crowded. Winter is cold and rainy, but cheaper and quieter.' },
    advisory: { he: 'על טורקיה חלה אזהרת מסע של המטה לביטחון לאומי. רמת האזהרה משתנה — יש לבדוק את העדכון באתר המל״ל לפני ההזמנה.', en: 'Turkey is under a travel warning from Israel’s National Security Council. The level changes — check the NSC website before booking.' }
  },
  {
    id: 'georgia', code: 'TBS', airports: ['TBS', 'BUS', 'KUT'],
    name: { he: 'גאורגיה', en: 'Georgia' }, country: { he: 'גאורגיה', en: 'Georgia' }, region: 'europe',
    tags: ['nature', 'food', 'culture', 'adventure', 'low_budget', 'couple', 'short_break', 'direct_flight'],
    bestMonths: [5, 6, 9, 10], flightHours: 2.5, direct: true, budgetLevel: 1, dailyBudgetIls: { low: 120, mid: 220, high: 450 },
    summary: { he: 'הרי הקווקז, יין ביתי ואוכל נדיב: טביליסי הציורית, נופי קזבגי, כרמי קחטי וחוף בטומי — במחירים נוחים ובטיסה קצרה.', en: 'Caucasus mountains, home-made wine and generous food: picturesque Tbilisi, the Kazbegi scenery, Kakheti vineyards and Batumi’s seafront — at good prices and a short flight away.' },
    highlights: [
      { he: 'העיר העתיקה של טביליסי ומרחצאות הגופרית', en: 'Tbilisi’s old town and sulphur baths' },
      { he: 'כנסיית גרגטי מול הר קזבק', en: 'Gergeti church facing Mount Kazbek' },
      { he: 'טעימות יין באזור קחטי', en: 'Wine tasting in Kakheti' },
      { he: 'חצ׳פורי, חינקלי ושולחן גאורגי עמוס', en: 'Khachapuri, khinkali and a laden Georgian table' },
      { he: 'כביש הצבא הגאורגי והנופים לאורכו', en: 'The Georgian Military Road and its views' },
      { he: 'טיילת בטומי ליד הים השחור', en: 'The Batumi boulevard on the Black Sea' }
    ],
    areas: [
      { name: { he: 'טביליסי — העיר העתיקה', en: 'Tbilisi — Old Town' }, forWhom: { he: 'בסיס נוח לרוב המטיילים — מסעדות, אתרים ויציאה לטיולי יום', en: 'A handy base for most travellers — restaurants, sights and day trips' } },
      { name: { he: 'קזבגי (סטפנצמינדה)', en: 'Kazbegi (Stepantsminda)' }, forWhom: { he: 'אוהבי טבע ומסלולי הליכה בהרים', en: 'Nature lovers and mountain hikers' } },
      { name: { he: 'קחטי — סיגנאחי ותלאווי', en: 'Kakheti — Sighnaghi & Telavi' }, forWhom: { he: 'זוגות ואוהבי יין ואוכל', en: 'Couples and wine and food lovers' } },
      { name: { he: 'בטומי', en: 'Batumi' }, forWhom: { he: 'ים, טיילת וחיי לילה בקיץ', en: 'Sea, promenade and summer nightlife' } }
    ],
    attractions: [
      { name: { he: 'העיר העתיקה של טביליסי', en: 'Tbilisi Old Town' }, kind: 'neighborhood', durationH: 3, tags: ['culture', 'food'], area: 'Tbilisi — Old Town', mustSee: true },
      { name: { he: 'מבצר נאריקלה', en: 'Narikala Fortress' }, kind: 'viewpoint', durationH: 1.5, tags: ['culture'], area: 'Tbilisi — Old Town', mustSee: true },
      { name: { he: 'מרחצאות הגופרית באבנוטובני', en: 'Abanotubani sulphur baths' }, kind: 'experience', durationH: 1.5, tags: ['relaxation', 'couple'], area: 'Tbilisi — Old Town' },
      { name: { he: 'גשר השלום ופארק ריקה', en: 'Bridge of Peace & Rike Park' }, kind: 'park', durationH: 1, tags: ['family'], area: 'Tbilisi — Old Town' },
      { name: { he: 'פארק מטצמינדה', en: 'Mtatsminda Park' }, kind: 'viewpoint', durationH: 2, tags: ['family'], area: 'Tbilisi — Old Town' },
      { name: { he: 'שוק הגשר היבש', en: 'Dry Bridge Market' }, kind: 'market', durationH: 1.5, tags: ['shopping'], area: 'Tbilisi — Old Town' },
      { name: { he: 'כנסיית השילוש הקדוש בגרגטי', en: 'Gergeti Trinity Church' }, kind: 'religious', durationH: 2.5, tags: ['nature', 'adventure'], area: 'Kazbegi (Stepantsminda)', mustSee: true },
      { name: { he: 'מבצר אנאנורי', en: 'Ananuri Fortress' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Kazbegi (Stepantsminda)' },
      { name: { he: 'סיגנאחי', en: 'Sighnaghi' }, kind: 'neighborhood', durationH: 3, tags: ['couple', 'food'], area: 'Kakheti — Sighnaghi & Telavi', mustSee: true },
      { name: { he: 'עיר המערות אופליסציחה', en: 'Uplistsikhe cave town' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'Tbilisi — Old Town' },
      { name: { he: 'מערת פרומתאוס', en: 'Prometheus Cave' }, kind: 'nature', durationH: 1.5, tags: ['nature', 'family'], area: 'Kutaisi' },
      { name: { he: 'קניון מרטווילי', en: 'Martvili Canyon' }, kind: 'nature', durationH: 2, tags: ['nature', 'adventure'], area: 'Kutaisi' },
      { name: { he: 'טיילת בטומי', en: 'Batumi Boulevard' }, kind: 'beach', durationH: 2, tags: ['beach', 'family'], area: 'Batumi', months: [6, 7, 8, 9] }
    ],
    dayTrips: [
      { name: { he: 'מצחטה', en: 'Mtskheta' }, hours: 0.5, note: { he: 'הבירה העתיקה — מנזר ג׳ווארי וקתדרלת סווטיצחובלי', en: 'The ancient capital — Jvari Monastery and Svetitskhoveli Cathedral' }, priceIls: { low: 10, high: 150 }, kind: 'religious' },
      { name: { he: 'קזבגי בכביש הצבא הגאורגי', en: 'Kazbegi via the Georgian Military Road' }, hours: 3, note: { he: 'יום ארוך; עדיף לישון לילה בהרים', en: 'A long day; better with a night in the mountains' }, priceIls: { low: 80, high: 250 }, kind: 'nature' },
      { name: { he: 'קחטי ויקבים', en: 'Kakheti and its wineries' }, hours: 2, note: { he: 'סיגנאחי, מנזר בודבה וטעימות יין', en: 'Sighnaghi, Bodbe Monastery and wine tastings' }, priceIls: { low: 120, high: 300 }, kind: 'experience' }
    ],
    transport: { carRecommended: false, note: { he: 'בטביליסי מטרו ואפליקציות נסיעה זולות. לטיולים מחוץ לעיר נהוג לשכור נהג או סיור מאורגן; כבישי ההרים מאתגרים.', en: 'Tbilisi has a metro and cheap ride apps. For trips out of town most people hire a driver or join a tour; mountain roads are demanding.' } },
    practical: {
      currency: 'GEL', language: { he: 'גאורגית; רוסית נפוצה, אנגלית באזורי התיירות', en: 'Georgian; Russian is common, English in tourist areas' }, timeZone: 'Asia/Tbilisi',
      visaNoteForIsraelis: { he: 'ישראלים לרוב אינם נדרשים לאשרה לביקור תיירות; הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israelis have generally not needed a visa for a tourist visit; rules change — check official sources before flying.' },
      kosher: { he: 'יש קהילה יהודית ותיקה ובית חב״ד בטביליסי ובבטומי; מחוץ לערים — להביא אוכל או לתאם מראש.', en: 'There is an old Jewish community and Chabad in Tbilisi and Batumi; outside the cities, bring food or arrange in advance.' },
      shabbat: { he: 'בטביליסי יש בתי כנסת בעיר העתיקה; לתאם ארוחות עם בית חב״ד.', en: 'Tbilisi has synagogues in the old town; arrange meals with Chabad.' }
    },
    seasonsNote: { he: 'מאי–יוני וספטמבר–אוקטובר מושלמים — ירוק, נעים ועונת הבציר בסתיו. יולי–אוגוסט חם בטביליסי ומתאים לים ולהרים. בחורף — סקי בגודאורי.', en: 'May–June and September–October are ideal — green, mild, with the grape harvest in autumn. July–August is hot in Tbilisi but good for the sea and mountains. In winter — skiing in Gudauri.' }
  },
  {
    id: 'bansko', code: 'SOF', airports: ['SOF'],
    name: { he: 'בנסקו', en: 'Bansko' }, country: { he: 'בולגריה', en: 'Bulgaria' }, region: 'europe',
    tags: ['ski', 'low_budget', 'family', 'with_children', 'nature', 'adventure', 'direct_flight'],
    bestMonths: [12, 1, 2, 3], flightHours: 2.5, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 250, mid: 400, high: 700 },
    summary: { he: 'אתר הסקי המשתלם של בולגריה: מסלולים לכל הרמות בהרי פירין, בתי ספר לסקי ועיירה עתיקה עם טברנות — אחד הסקי הזולים באירופה.', en: 'Bulgaria’s good-value ski resort: slopes for every level in the Pirin mountains, ski schools and an old town full of taverns — one of Europe’s cheapest ski trips.' },
    highlights: [
      { he: 'סקי בהרי פירין במחירים נוחים', en: 'Skiing in the Pirin mountains at good prices' },
      { he: 'בתי ספר לסקי למתחילים ולילדים', en: 'Ski schools for beginners and children' },
      { he: 'הרכבל מהעיירה ישר למסלולים', en: 'The gondola straight from town to the slopes' },
      { he: 'העיירה העתיקה ובתי האבן', en: 'The old town and its stone houses' },
      { he: 'ערב בטברנה (מחנה) עם אוכל ומוזיקה מקומית', en: 'An evening in a mehana with local food and music' },
      { he: 'מעיינות חמים בכפר באניה הסמוך', en: 'Hot springs in nearby Banya' }
    ],
    areas: [
      { name: { he: 'ליד תחנת הרכבל', en: 'Near the gondola station' }, forWhom: { he: 'גולשים ומשפחות — יוצאים לסקי בלי הסעות', en: 'Skiers and families — out on the slopes without shuttles' } },
      { name: { he: 'העיירה העתיקה', en: 'Old Town' }, forWhom: { he: 'אווירה, מסעדות וטברנות; מעט רחוק יותר מהרכבל', en: 'Atmosphere, restaurants and taverns; a little further from the gondola' } },
      { name: { he: 'באניה ורזלוג', en: 'Banya & Razlog' }, forWhom: { he: 'תקציב ומעיינות חמים, עם הסעה למסלולים', en: 'Budget stays and hot springs, with a shuttle to the slopes' } }
    ],
    attractions: [
      { name: { he: 'רכבל בנסקו', en: 'Bansko gondola' }, kind: 'experience', durationH: 0.5, tags: ['ski', 'family'], area: 'Near the gondola station', mustSee: true },
      { name: { he: 'מסלולי שילינגרניקה ופלאטו', en: 'Shiligarnika & Plato ski areas' }, kind: 'nature', durationH: 5, tags: ['ski', 'family', 'teens'], area: 'Near the gondola station', mustSee: true, months: [1, 2, 3, 4, 12] },
      { name: { he: 'אזור פסגת טודורקה', en: 'Todorka peak area' }, kind: 'viewpoint', durationH: 2, tags: ['ski', 'adventure'], area: 'Near the gondola station', months: [1, 2, 3, 4, 12] },
      { name: { he: 'בית ספר לסקי ולסנובורד', en: 'Ski and snowboard school' }, kind: 'experience', durationH: 4, tags: ['ski', 'with_children'], area: 'Near the gondola station', months: [1, 2, 3, 4, 12] },
      { name: { he: 'העיירה העתיקה של בנסקו', en: 'Bansko Old Town' }, kind: 'neighborhood', durationH: 2, tags: ['culture'], area: 'Old Town', mustSee: true },
      { name: { he: 'כנסיית השילוש הקדוש', en: 'Holy Trinity Church' }, kind: 'religious', durationH: 0.5, tags: ['culture'], area: 'Old Town' },
      { name: { he: 'בית ווליאנוב', en: 'Velyanova House' }, kind: 'museum', durationH: 1, tags: ['culture'], area: 'Old Town' },
      { name: { he: 'בית־מוזיאון ניאופיט רילסקי', en: 'Neofit Rilski House-Museum' }, kind: 'museum', durationH: 1, tags: ['culture'], area: 'Old Town' },
      { name: { he: 'בית־מוזיאון ניקולה ופצרוב', en: 'Nikola Vaptsarov House-Museum' }, kind: 'museum', durationH: 1, tags: ['culture'], area: 'Old Town' },
      { name: { he: 'הליכה בנעלי שלג בפארק הלאומי פירין', en: 'Snowshoeing in Pirin National Park' }, kind: 'nature', durationH: 3, tags: ['nature', 'adventure'], area: 'Pirin National Park', months: [1, 2, 3, 12] },
      { name: { he: 'מעיינות חמים בבאניה', en: 'Banya hot springs' }, kind: 'experience', durationH: 2, tags: ['relaxation', 'family'], area: 'Banya & Razlog' },
      { name: { he: 'ערב בטברנה מסורתית', en: 'An evening in a traditional mehana' }, kind: 'experience', durationH: 2.5, tags: ['food', 'nightlife', 'evening'], area: 'Old Town' }
    ],
    dayTrips: [
      { name: { he: 'מנזר רילה', en: 'Rila Monastery' }, hours: 2, note: { he: 'המנזר המפורסם של בולגריה, בלב ההרים', en: 'Bulgaria’s most famous monastery, deep in the mountains' }, priceIls: { low: 150, high: 300 }, kind: 'religious' },
      { name: { he: 'מלניק', en: 'Melnik' }, hours: 2, note: { he: 'עיירת יין קטנה ופירמידות החול סביבה', en: 'A small wine town surrounded by sand pyramids' }, priceIls: { low: 150, high: 300 }, kind: 'neighborhood' },
      { name: { he: 'אתר הסקי דוברינישטה', en: 'Dobrinishte ski area' }, hours: 0.5, note: { he: 'אתר קטן ושקט יותר ליום של שינוי', en: 'A smaller, quieter area for a change of scene' }, priceIls: { low: 100, high: 180 }, kind: 'nature', months: [1, 2, 3, 12] }
    ],
    transport: { carRecommended: false, note: { he: 'העברה מסופיה כשעתיים וחצי עד שלוש שעות. העיירה הליכתית, ויש הסעות למסלולים — רכב לא נדרש.', en: 'The transfer from Sofia takes about 2.5–3 hours. The town is walkable and there are shuttles to the slopes — no car needed.' } },
    practical: {
      currency: 'EUR', language: { he: 'בולגרית; אנגלית בסיסית באזורי התיירות', en: 'Bulgarian; basic English in tourist areas' }, timeZone: 'Europe/Sofia',
      visaNoteForIsraelis: { he: 'בולגריה חברה באזור שנגן — ישראלים לא צריכים ויזה לביקור קצר. יש לבדוק במקורות הרשמיים את מועד ההפעלה של ETIAS לפני ההזמנה.', en: 'Bulgaria is in the Schengen area — Israelis do not need a visa for a short stay. Check official sources for the ETIAS start date before booking.' },
      kosher: { he: 'בבנסקו אין היצע כשר קבוע; בית חב״ד בסופיה. מומלץ להביא מזון או לברר על חבילות עם ארוחות כשרות.', en: 'No regular kosher supply in Bansko; Chabad is in Sofia. Bring food or ask about packages with kosher meals.' },
      shabbat: { he: 'אין קהילה בבנסקו — להתארגן מראש עם אוכל לשבת וללון קרוב לרכבל.', en: 'There is no community in Bansko — prepare Shabbat food in advance and stay close to the gondola.' }
    },
    seasonsNote: { he: 'עונת הסקי מאמצע דצמבר עד סוף מרץ בערך; ינואר–פברואר עם השלג הכי אמין. בקיץ האזור מתאים לטיולי הרים בפירין.', en: 'The ski season runs roughly from mid-December to late March; January–February has the most reliable snow. In summer the area suits hiking in the Pirin mountains.' }
  },
  {
    id: 'abu-dhabi', code: 'AUH', airports: ['AUH'],
    name: { he: 'אבו דאבי', en: 'Abu Dhabi' }, country: { he: 'איחוד האמירויות', en: 'United Arab Emirates' }, region: 'middle-east',
    tags: ['city', 'culture', 'beach', 'family', 'with_children', 'water_slides', 'luxury', 'direct_flight'],
    bestMonths: [11, 12, 1, 2, 3], flightHours: 3.5, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 250, mid: 450, high: 900 },
    summary: { he: 'בירת האמירויות: המסגד הגדול, הלובר אבו דאבי ופארקי השעשועים של אי יאס — רגועה ומרווחת יותר מדובאי, ומושלמת למשפחות בחורף.', en: 'The Emirates’ capital: the Grand Mosque, the Louvre Abu Dhabi and the Yas Island theme parks — calmer and more spacious than Dubai, and perfect for families in winter.' },
    highlights: [
      { he: 'המסגד הגדול של שייח׳ זאיד', en: 'Sheikh Zayed Grand Mosque' },
      { he: 'הלובר אבו דאבי באי סעדיית', en: 'The Louvre Abu Dhabi on Saadiyat Island' },
      { he: 'פארקי השעשועים והמים של אי יאס', en: 'The theme parks and water park on Yas Island' },
      { he: 'חופים רחבים ושקטים', en: 'Wide, quiet beaches' },
      { he: 'בית המשפחה האברהמית — מסגד, כנסייה ובית כנסת', en: 'The Abrahamic Family House — mosque, church and synagogue' },
      { he: 'שייט קיאקים בין המנגרובים', en: 'Kayaking among the mangroves' }
    ],
    areas: [
      { name: { he: 'אי יאס', en: 'Yas Island' }, forWhom: { he: 'משפחות — פארקי שעשועים, פארק מים וחוף', en: 'Families — theme parks, a water park and a beach' } },
      { name: { he: 'אי סעדיית', en: 'Saadiyat Island' }, forWhom: { he: 'חוף יפה, מוזיאונים וריזורטים — זוגות ומשפחות', en: 'A beautiful beach, museums and resorts — couples and families' } },
      { name: { he: 'הקורניש ומרכז העיר', en: 'The Corniche & city centre' }, forWhom: { he: 'מחירים נוחים יותר, טיילת וקרבה לאתרים', en: 'Better prices, a promenade and close to the sights' } }
    ],
    attractions: [
      { name: { he: 'המסגד הגדול של שייח׳ זאיד', en: 'Sheikh Zayed Grand Mosque' }, kind: 'religious', durationH: 2, tags: ['culture', 'family'], area: 'Al Rawdah', mustSee: true },
      { name: { he: 'הלובר אבו דאבי', en: 'Louvre Abu Dhabi' }, kind: 'museum', durationH: 3, tags: ['culture', 'couple'], area: 'Saadiyat Island', mustSee: true },
      { name: { he: 'פרארי וורלד', en: 'Ferrari World' }, kind: 'experience', durationH: 5, tags: ['family', 'adventure', 'teens'], area: 'Yas Island', mustSee: true },
      { name: { he: 'פארק המים יאס ווטרוורלד', en: 'Yas Waterworld' }, kind: 'experience', durationH: 5, tags: ['water_slides', 'family', 'teens'], area: 'Yas Island' },
      { name: { he: 'וורנר ברדרס וורלד', en: 'Warner Bros. World' }, kind: 'experience', durationH: 5, tags: ['family', 'with_children'], area: 'Yas Island' },
      { name: { he: 'סי וורלד אבו דאבי', en: 'SeaWorld Abu Dhabi' }, kind: 'experience', durationH: 5, tags: ['family', 'with_children'], area: 'Yas Island' },
      { name: { he: 'ארמון קסר אל וטן', en: 'Qasr Al Watan' }, kind: 'landmark', durationH: 2, tags: ['culture'], area: 'The Corniche & city centre' },
      { name: { he: 'קסר אל חוסן', en: 'Qasr Al Hosn' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'The Corniche & city centre' },
      { name: { he: 'בית המשפחה האברהמית', en: 'Abrahamic Family House' }, kind: 'religious', durationH: 1.5, tags: ['culture'], area: 'Saadiyat Island' },
      { name: { he: 'חוף הקורניש והטיילת', en: 'Corniche Beach & promenade' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'The Corniche & city centre' },
      { name: { he: 'חוף סעדיית', en: 'Saadiyat Beach' }, kind: 'beach', durationH: 3, tags: ['beach', 'relaxation'], area: 'Saadiyat Island' },
      { name: { he: 'הפארק הלאומי מנגרובים — קיאקים', en: 'Mangrove National Park — kayaking' }, kind: 'nature', durationH: 2, tags: ['nature', 'family'], area: 'Eastern Mangroves' },
      { name: { he: 'כפר המורשת', en: 'Heritage Village' }, kind: 'museum', durationH: 1, tags: ['culture', 'family'], area: 'The Corniche & city centre' }
    ],
    dayTrips: [
      { name: { he: 'דובאי', en: 'Dubai' }, hours: 1.5, note: { he: 'נסיעה ברכב או באוטובוס; בורג׳ ח׳ליפה ודובאי מול', en: 'By car or bus; the Burj Khalifa and Dubai Mall' }, priceIls: { low: 60, high: 350 }, kind: 'landmark' },
      { name: { he: 'אל עין', en: 'Al Ain' }, hours: 1.5, note: { he: 'עיר נווה מדבר, מטעי תמרים והר ג׳בל חפית', en: 'An oasis city, date groves and Jebel Hafeet' }, priceIls: { low: 130, high: 400 }, kind: 'nature' }
    ],
    transport: { carRecommended: false, note: { he: 'מוניות ואפליקציות נסיעה נוחות; יש אוטובוסים בין האיים לאתרים. רכב שכור עוזר לטיולי יום.', en: 'Taxis and ride apps are easy; buses link the islands and sights. A rental car helps for day trips.' } },
    practical: {
      currency: 'AED', language: { he: 'ערבית; אנגלית בכל מקום', en: 'Arabic; English everywhere' }, timeZone: 'Asia/Dubai',
      visaNoteForIsraelis: { he: 'ישראלים קיבלו בשנים האחרונות אשרה בהגעה; הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israelis have recently received a visa on arrival; rules change — check official sources before flying.' },
      kosher: { he: 'יש שירותי קייטרינג כשר ובית חב״ד; ההיצע קטן מבדובאי — לתאם מראש.', en: 'There are kosher caterers and a Chabad house; supply is smaller than in Dubai — arrange in advance.' },
      shabbat: { he: 'בבית המשפחה האברהמית פועל בית כנסת; מרחקים גדולים — כדאי לתאם ארוחות ולינה מראש.', en: 'There is a synagogue at the Abrahamic Family House; distances are large — arrange meals and lodging in advance.' }
    },
    seasonsNote: { he: 'נובמבר–מרץ נעים ומתאים לים ולפארקים. אפריל ואוקטובר חמים. יוני–ספטמבר חם מאוד — רוב הזמן בפנים או בבריכה.', en: 'November–March is pleasant for the beach and parks. April and October are warm. June–September is extremely hot — mostly indoors or by the pool.' }
  },
  {
    id: 'eilat', code: 'ETM', airports: ['ETM'],
    name: { he: 'אילת', en: 'Eilat' }, country: { he: 'ישראל', en: 'Israel' }, region: 'israel',
    tags: ['beach', 'family', 'with_children', 'relaxation', 'nature', 'kosher', 'short_break', 'direct_flight'],
    bestMonths: [10, 11, 12, 1, 2, 3, 4, 5], flightHours: 1, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 350, high: 650 },
    summary: { he: 'חופשת שמש בתוך הבית: ים סוף, שוניות אלמוגים, נופי מדבר וקניות פטורות ממע״מ — שעה טיסה, או נסיעה של ארבע–חמש שעות מהמרכז.', en: 'A sunny break close to home: the Red Sea, coral reefs, desert scenery and VAT-free shopping — an hour’s flight, or a four-to-five-hour drive from the centre.' },
    highlights: [
      { he: 'שנורקלינג וצלילה בשוניות האלמוגים', en: 'Snorkelling and diving on the coral reefs' },
      { he: 'המצפה התת־ימי', en: 'The Underwater Observatory' },
      { he: 'שמש וים גם באמצע החורף', en: 'Sun and sea even in midwinter' },
      { he: 'פארק תמנע והקניון האדום', en: 'Timna Park and the Red Canyon' },
      { he: 'קניות פטורות ממע״מ', en: 'VAT-free shopping' },
      { he: 'ריף הדולפינים', en: 'The Dolphin Reef' }
    ],
    areas: [
      { name: { he: 'החוף הצפוני והטיילת', en: 'North Beach & the promenade' }, forWhom: { he: 'משפחות ומי שרוצה מסעדות, טיילת ובילוי במרחק הליכה', en: 'Families and anyone who wants restaurants, the promenade and nightlife on foot' } },
      { name: { he: 'החוף הדרומי (חוף האלמוגים)', en: 'South coast (Coral Beach)' }, forWhom: { he: 'שנורקלינג, צלילה ושקט', en: 'Snorkelling, diving and quiet' } },
      { name: { he: 'מרכז העיר', en: 'Town centre' }, forWhom: { he: 'תקציב — דירות ואכסניות קרוב לקניונים', en: 'Budget — apartments and guesthouses near the malls' } }
    ],
    attractions: [
      { name: { he: 'המצפה התת־ימי (קורל וורלד)', en: 'Coral World Underwater Observatory' }, kind: 'experience', durationH: 3, tags: ['family', 'with_children'], area: 'South coast (Coral Beach)', mustSee: true },
      { name: { he: 'שמורת חוף האלמוגים', en: 'Coral Beach Nature Reserve' }, kind: 'beach', durationH: 3, tags: ['beach', 'nature'], area: 'South coast (Coral Beach)', mustSee: true },
      { name: { he: 'ריף הדולפינים', en: 'Dolphin Reef' }, kind: 'experience', durationH: 2.5, tags: ['family', 'nature'], area: 'South coast (Coral Beach)' },
      { name: { he: 'החוף הצפוני והטיילת', en: 'North Beach & promenade' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'North Beach & the promenade' },
      { name: { he: 'צלילת היכרות או שנורקלינג', en: 'Intro dive or snorkelling' }, kind: 'experience', durationH: 2, tags: ['adventure', 'teens'], area: 'South coast (Coral Beach)' },
      { name: { he: 'פארק תמנע', en: 'Timna Park' }, kind: 'nature', durationH: 4, tags: ['nature', 'family'], area: 'Arava (Timna & Yotvata)', mustSee: true },
      { name: { he: 'הקניון האדום', en: 'Red Canyon' }, kind: 'nature', durationH: 2.5, tags: ['nature', 'adventure', 'teens'], area: 'Eilat Mountains' },
      { name: { he: 'שמורת חי־בר יטבתה', en: 'Hai-Bar Yotvata Nature Reserve' }, kind: 'park', durationH: 2, tags: ['nature', 'with_children'], area: 'Arava (Timna & Yotvata)' },
      { name: { he: 'הר צפחות', en: 'Mount Tzfahot' }, kind: 'viewpoint', durationH: 2, tags: ['nature'], area: 'Eilat Mountains' },
      { name: { he: 'הגן הבוטני אילת', en: 'Eilat Botanical Garden' }, kind: 'park', durationH: 1, tags: ['family'] },
      { name: { he: 'חוות הגמלים', en: 'Camel Ranch' }, kind: 'experience', durationH: 2, tags: ['family', 'with_children'], area: 'South coast (Coral Beach)' },
      { name: { he: 'קניון הקרח', en: 'Ice Mall' }, kind: 'experience', durationH: 2, tags: ['shopping', 'family'], area: 'North Beach & the promenade' }
    ],
    dayTrips: [
      { name: { he: 'מצפה רמון', en: 'Mitzpe Ramon' }, hours: 2, note: { he: 'תצפית על המכתש וטיולי ג׳יפים', en: 'Views over the crater and jeep tours' }, priceIls: { low: 200, high: 450 }, kind: 'nature' },
      { name: { he: 'פטרה (ירדן)', en: 'Petra (Jordan)' }, hours: 2, note: { he: 'דרך מעבר יצחק רבין, בסיור מאורגן; לבדוק מראש תנאי כניסה והנחיות ביטחוניות', en: 'Via the Yitzhak Rabin crossing on an organised tour; check entry rules and security guidance first' }, priceIls: { low: 850, high: 1300 }, kind: 'landmark' }
    ],
    transport: { carRecommended: false, note: { he: 'טיסה של כשעה לנמל רמון, או נסיעה של ארבע–חמש שעות מהמרכז. בעיר מוניות ואוטובוסים; רכב עוזר לתמנע ולאתרי המדבר.', en: 'About an hour’s flight to Ramon Airport, or a four-to-five-hour drive from the centre. Taxis and buses in town; a car helps for Timna and the desert sites.' } },
    practical: {
      currency: 'ILS', language: { he: 'עברית; אנגלית נפוצה', en: 'Hebrew; English widely spoken' }, timeZone: 'Asia/Jerusalem',
      visaNoteForIsraelis: { he: 'אין צורך בויזה — חופשה בישראל.', en: 'No visa needed — a domestic trip.' },
      kosher: { he: 'רוב המלונות ומסעדות רבות בעיר כשרים.', en: 'Most hotels and many restaurants in town are kosher.' },
      shabbat: { he: 'בתי כנסת בעיר ובחלק מהמלונות; תחבורה ציבורית לא פועלת בשבת.', en: 'Synagogues in town and in some hotels; public transport does not run on Shabbat.' }
    },
    seasonsNote: { he: 'אוקטובר–מאי נעים — חורף חמים וים נוח. יוני–ספטמבר חם מאוד, עם מחירי שיא בחופשות. ביולי–אוגוסט לפעילות בבוקר ובערב.', en: 'October–May is pleasant — a warm winter and a comfortable sea. June–September is very hot, with peak prices in the holidays. In July–August, plan activities for morning and evening.' }
  },
  {
    id: 'dead-sea', code: 'TLV', airports: ['TLV'],
    name: { he: 'ים המלח', en: 'Dead Sea' }, country: { he: 'ישראל', en: 'Israel' }, region: 'israel',
    tags: ['relaxation', 'nature', 'couple', 'family', 'kosher', 'short_break'],
    bestMonths: [10, 11, 12, 1, 2, 3, 4], flightHours: 0, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 150, mid: 300, high: 600 },
    summary: { he: 'הנקודה הנמוכה בעולם: ציפה במים המלוחים, בוץ ומעיינות, זריחה על מצדה ומסלולי מים בעין גדי — שעה וחצי–שעתיים מתל אביב או מירושלים.', en: 'The lowest place on earth: floating in the salty water, mud and springs, sunrise on Masada and water trails at Ein Gedi — 1.5–2 hours from Tel Aviv or Jerusalem.' },
    highlights: [
      { he: 'ציפה במים של ים המלח', en: 'Floating in the Dead Sea' },
      { he: 'זריחה על מצדה', en: 'Sunrise on Masada' },
      { he: 'מפלים ובריכות בשמורת עין גדי', en: 'Waterfalls and pools in the Ein Gedi reserve' },
      { he: 'בוץ, ספא ומעיינות', en: 'Mud, spas and springs' },
      { he: 'חורף חמים ושמש כמעט כל השנה', en: 'A warm winter and sunshine almost all year' }
    ],
    areas: [
      { name: { he: 'עין בוקק', en: 'Ein Bokek' }, forWhom: { he: 'מלונות על החוף, ספא וחוף ציבורי — משפחות וזוגות', en: 'Beachfront hotels, spas and a public beach — families and couples' } },
      { name: { he: 'עין גדי', en: 'Ein Gedi' }, forWhom: { he: 'טבע, מסלולים ושקט', en: 'Nature, trails and quiet' } },
      { name: { he: 'ערד', en: 'Arad' }, forWhom: { he: 'תקציב, מעל הים — עשרים דקות נסיעה למטה', en: 'Budget stays above the sea — a 20-minute drive down' } }
    ],
    attractions: [
      { name: { he: 'מצדה', en: 'Masada' }, kind: 'landmark', durationH: 3, tags: ['culture', 'family'], area: 'Masada', mustSee: true },
      { name: { he: 'עלייה בשביל הנחש לזריחה', en: 'Snake Path climb at sunrise' }, kind: 'experience', durationH: 3, tags: ['adventure', 'nature', 'teens'], area: 'Masada' },
      { name: { he: 'שמורת עין גדי — נחל דוד', en: 'Ein Gedi Reserve — Nahal David' }, kind: 'nature', durationH: 2.5, tags: ['nature', 'family'], area: 'Ein Gedi', mustSee: true },
      { name: { he: 'נחל ערוגות', en: 'Nahal Arugot' }, kind: 'nature', durationH: 3, tags: ['nature', 'adventure'], area: 'Ein Gedi' },
      { name: { he: 'הגן הבוטני בקיבוץ עין גדי', en: 'Kibbutz Ein Gedi Botanical Garden' }, kind: 'park', durationH: 1.5, tags: ['nature'], area: 'Ein Gedi' },
      { name: { he: 'החוף הציבורי בעין בוקק', en: 'Ein Bokek public beach' }, kind: 'beach', durationH: 2, tags: ['beach', 'family'], area: 'Ein Bokek', mustSee: true },
      { name: { he: 'נחל בוקק', en: 'Nahal Bokek' }, kind: 'nature', durationH: 1.5, tags: ['nature', 'family'], area: 'Ein Bokek' },
      { name: { he: 'הגן הלאומי קומראן', en: 'Qumran National Park' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'North Dead Sea' },
      { name: { he: 'שמורת עינות צוקים', en: 'Einot Tzukim Nature Reserve' }, kind: 'nature', durationH: 2, tags: ['nature', 'family'], area: 'North Dead Sea' },
      { name: { he: 'הר סדום', en: 'Mount Sodom' }, kind: 'viewpoint', durationH: 1.5, tags: ['nature'], area: 'Mount Sodom' },
      { name: { he: 'טיפולי בוץ וספא', en: 'Mud treatments and spa' }, kind: 'experience', durationH: 2, tags: ['relaxation', 'couple'], area: 'Ein Bokek' }
    ],
    dayTrips: [
      { name: { he: 'ירושלים', en: 'Jerusalem' }, hours: 1.5, note: { he: 'העיר העתיקה והכותל; אפשר לשלב בדרך הלוך או חזור', en: 'The Old City and the Western Wall; easy to combine on the way in or out' }, priceIls: { low: 80, high: 400 }, kind: 'religious' },
      { name: { he: 'ערד ותל ערד', en: 'Arad & Tel Arad' }, hours: 0.5, note: { he: 'עיר כנענית עתיקה ותצפית על המדבר', en: 'An ancient Canaanite city and desert views' }, priceIls: { low: 40, high: 120 }, kind: 'landmark' }
    ],
    transport: { carRecommended: true, note: { he: 'נסיעה של שעה וחצי–שעתיים מתל אביב או מירושלים. יש אוטובוסים מירושלים, אבל רכב נוח בהרבה בין האתרים.', en: 'A 1.5–2 hour drive from Tel Aviv or Jerusalem. There are buses from Jerusalem, but a car is far easier between the sites.' } },
    practical: {
      currency: 'ILS', language: { he: 'עברית; אנגלית נפוצה', en: 'Hebrew; English widely spoken' }, timeZone: 'Asia/Jerusalem',
      visaNoteForIsraelis: { he: 'אין צורך בויזה — חופשה בישראל.', en: 'No visa needed — a domestic trip.' },
      kosher: { he: 'רוב המלונות בעין בוקק כשרים.', en: 'Most hotels in Ein Bokek are kosher.' },
      shabbat: { he: 'במלונות יש בדרך כלל בית כנסת או מניין; אין תחבורה ציבורית בשבת.', en: 'Hotels usually have a synagogue or a minyan; there is no public transport on Shabbat.' }
    },
    seasonsNote: { he: 'אוקטובר–אפריל נעים ומתאים למסלולים. מאי–ספטמבר חם מאוד — רק בבוקר המוקדם, עם הרבה מים.', en: 'October–April is pleasant and good for hiking. May–September is extremely hot — early mornings only, with plenty of water.' }
  },
  {
    id: 'marrakech', code: 'RAK', airports: ['RAK'],
    name: { he: 'מרקש', en: 'Marrakech' }, country: { he: 'מרוקו', en: 'Morocco' }, region: 'africa',
    tags: ['city', 'culture', 'food', 'shopping', 'couple', 'adventure'],
    bestMonths: [3, 4, 5, 10, 11], flightHours: 8, direct: false, budgetLevel: 2, dailyBudgetIls: { low: 150, mid: 280, high: 550 },
    summary: { he: 'העיר האדומה: סמטאות המדינה והשווקים, ריאדים עם חצר פנימית, גנים מרהיבים ומרחק קצר מהרי האטלס ומהמדבר — וגם מורשת יהודית עשירה במלאח.', en: 'The Red City: the medina’s lanes and souks, riads with inner courtyards, striking gardens and a short ride to the Atlas mountains and the desert — plus a rich Jewish heritage in the Mellah.' },
    highlights: [
      { he: 'כיכר ג׳מע אל פנא בערב', en: 'Jemaa el-Fnaa square at night' },
      { he: 'השווקים בסמטאות המדינה', en: 'The souks in the medina’s lanes' },
      { he: 'גן מז׳ורל ומוזיאון איב סן לורן', en: 'Jardin Majorelle and the Yves Saint Laurent Museum' },
      { he: 'הרובע היהודי (המלאח) ובית הכנסת לזמה', en: 'The Jewish quarter (Mellah) and the Lazama Synagogue' },
      { he: 'לינה בריאד מסורתי', en: 'Staying in a traditional riad' },
      { he: 'יציאה להרי האטלס או למדבר אגפאי', en: 'A trip to the Atlas mountains or the Agafay desert' }
    ],
    areas: [
      { name: { he: 'המדינה (העיר העתיקה)', en: 'The Medina' }, forWhom: { he: 'ריאדים, שווקים ואווירה — זוגות ומי שבא לחוויה', en: 'Riads, souks and atmosphere — couples and experience seekers' } },
      { name: { he: 'גליז', en: 'Gueliz' }, forWhom: { he: 'העיר החדשה — מסעדות, בתי קפה ושקט יחסי', en: 'The new town — restaurants, cafés and relative calm' } },
      { name: { he: 'הפלמרייה', en: 'The Palmeraie' }, forWhom: { he: 'ריזורטים עם בריכות מחוץ לעיר — משפחות ומנוחה', en: 'Resorts with pools outside town — families and rest' } }
    ],
    attractions: [
      { name: { he: 'כיכר ג׳מע אל פנא', en: 'Jemaa el-Fnaa' }, kind: 'landmark', durationH: 2, tags: ['culture', 'food', 'evening'], area: 'The Medina', mustSee: true },
      { name: { he: 'השווקים של המדינה', en: 'The medina souks' }, kind: 'market', durationH: 3, tags: ['shopping', 'culture'], area: 'The Medina', mustSee: true },
      { name: { he: 'מסגד הכותוביה (מבחוץ)', en: 'Koutoubia Mosque (from outside)' }, kind: 'religious', durationH: 0.5, tags: ['culture'], area: 'The Medina' },
      { name: { he: 'ארמון באהייה', en: 'Bahia Palace' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'The Medina' },
      { name: { he: 'קברי הסעדים', en: 'Saadian Tombs' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'The Medina' },
      { name: { he: 'ארמון אל באדי', en: 'El Badi Palace' }, kind: 'landmark', durationH: 1.5, tags: ['culture'], area: 'The Medina' },
      { name: { he: 'מדרסת בן יוסף', en: 'Ben Youssef Madrasa' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'The Medina' },
      { name: { he: 'גן מז׳ורל', en: 'Jardin Majorelle' }, kind: 'park', durationH: 1.5, tags: ['couple'], area: 'Gueliz', mustSee: true },
      { name: { he: 'מוזיאון איב סן לורן', en: 'Yves Saint Laurent Museum' }, kind: 'museum', durationH: 1, tags: ['culture'], area: 'Gueliz' },
      { name: { he: 'הגן הסודי (לה ז׳רדן סקרה)', en: 'Le Jardin Secret' }, kind: 'park', durationH: 1, tags: ['couple'], area: 'The Medina' },
      { name: { he: 'המלאח ובית הכנסת לזמה', en: 'The Mellah & Lazama Synagogue' }, kind: 'religious', durationH: 2, tags: ['culture'], area: 'The Medina' },
      { name: { he: 'בית הקברות היהודי מיערה', en: 'Miaara Jewish Cemetery' }, kind: 'religious', durationH: 1, tags: ['culture'], area: 'The Medina' },
      { name: { he: 'חמאם מסורתי', en: 'A traditional hammam' }, kind: 'experience', durationH: 2, tags: ['relaxation', 'couple'], area: 'The Medina' }
    ],
    dayTrips: [
      { name: { he: 'מדבר אגפאי', en: 'Agafay Desert' }, hours: 1, note: { he: 'מדבר אבנים עם רכיבה על גמלים וארוחת ערב במחנה', en: 'A stony desert with camel rides and dinner at a camp' }, priceIls: { low: 120, high: 300 }, kind: 'experience' },
      { name: { he: 'עמק אוריקה', en: 'Ourika Valley' }, hours: 1, note: { he: 'כפרים ברברים ומפלים למרגלות האטלס', en: 'Berber villages and waterfalls at the foot of the Atlas' }, priceIls: { low: 80, high: 250 }, kind: 'nature' },
      { name: { he: 'אימליל והרי האטלס', en: 'Imlil & the Atlas mountains' }, hours: 1.5, note: { he: 'מסלולי הליכה ונופים לעבר הר טובקל', en: 'Walking trails and views towards Mount Toubkal' }, priceIls: { low: 120, high: 300 }, kind: 'nature' },
      { name: { he: 'אסווירה', en: 'Essaouira' }, hours: 3, note: { he: 'עיירת חוף מבוצרת על האוקיינוס האטלנטי; יום ארוך', en: 'A walled seaside town on the Atlantic; a long day' }, priceIls: { low: 90, high: 250 }, kind: 'neighborhood' }
    ],
    transport: { carRecommended: false, note: { he: 'המדינה הליכתית; מוניות קטנות לשאר העיר (לסכם מחיר מראש). לטיולי יום — נהג או סיור מאורגן.', en: 'The medina is walkable; petit taxis for the rest of the city (agree the fare first). For day trips — a driver or an organised tour.' } },
    practical: {
      currency: 'MAD', language: { he: 'ערבית וברברית; צרפתית נפוצה, אנגלית באזורי התיירות', en: 'Arabic and Berber; French is common, English in tourist areas' }, timeZone: 'Africa/Casablanca',
      visaNoteForIsraelis: { he: 'ישראלים נדרשו בשנים האחרונות לאשרה אלקטרונית; הכללים משתנים — יש לבדוק במקורות הרשמיים לפני ההזמנה.', en: 'Israelis have needed an electronic visa in recent years; rules change — check official sources before booking.' },
      kosher: { he: 'יש קהילה יהודית קטנה ובית חב״ד, אבל ההיצע הכשר מצומצם; לתאם ארוחות מראש.', en: 'There is a small Jewish community and a Chabad house, but kosher supply is limited; arrange meals in advance.' },
      shabbat: { he: 'בתי כנסת במלאח; כדאי ללון בריאד במדינה, במרחק הליכה, ולתאם ארוחות מראש.', en: 'Synagogues in the Mellah; stay in a riad in the medina within walking distance and arrange meals in advance.' }
    },
    advisory: { he: 'המטה לביטחון לאומי מפרסם אזהרות מסע גם לגבי מרוקו, ורמתן משתנה. יש לבדוק את האזהרה העדכנית באתר המל״ל לפני ההזמנה.', en: 'Israel’s National Security Council also publishes travel warnings for Morocco, and the level changes. Check the current warning on the NSC website before booking.' },
    seasonsNote: { he: 'מרץ–מאי ואוקטובר–נובמבר נעימים. יוני–ספטמבר חם מאוד. בחורף ימים נעימים אבל לילות קרים — וגם שלג על האטלס.', en: 'March–May and October–November are pleasant. June–September is very hot. Winter brings mild days but cold nights — and snow on the Atlas.' }
  }
];
