// Catalog data (spec 23): Africa & Indian Ocean islands. Shape: dist/catalog.mjs.
// Budget figures are rough per-person-per-day estimates in ₪ on the ground, without flights and lodging.
export default [
  {
    id: 'zanzibar', code: 'ZNZ', airports: ['ZNZ'],
    name: { he: 'זנזיבר', en: 'Zanzibar' }, country: { he: 'טנזניה', en: 'Tanzania' }, region: 'africa',
    tags: ['beach', 'couple', 'relaxation', 'all_inclusive', 'nature', 'culture', 'direct_flight', 'week_long'],
    bestMonths: [6, 7, 8, 9, 10, 12, 1, 2], flightHours: 6, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 150, mid: 300, high: 650 },
    summary: { he: 'חופים לבנים, מים בצבע טורקיז ועיר עתיקה של סמטאות ותבלינים — אי טרופי באוקיינוס ההודי שמשלב בטן-גב, שנורקלינג ותרבות סווהילית.', en: 'White beaches, turquoise water and an old town of alleys and spices — an Indian Ocean island that mixes beach time, snorkelling and Swahili culture.' },
    highlights: [
      { he: 'סמטאות סטון טאון, אתר מורשת עולמית', en: 'The alleys of Stone Town, a World Heritage Site' },
      { he: 'שקיעה ושוק אוכל ערב בגני פורודאני', en: 'Sunset and the evening food market in Forodhani Gardens' },
      { he: 'שנורקלינג באטול מנמבה', en: 'Snorkelling at Mnemba Atoll' },
      { he: 'סיור תבלינים בחוות מקומית', en: 'A spice tour on a local farm' },
      { he: 'קופי קולובוס אדומים ביער ג׳וזאני', en: 'Red colobus monkeys in Jozani Forest' },
      { he: 'צבי ענק באי הכלא', en: 'Giant tortoises on Prison Island' },
      { he: 'חופים שנשארים לשחייה גם בשפל בנונגווי ובקנדווה', en: 'Beaches at Nungwi and Kendwa that stay swimmable at low tide' }
    ],
    areas: [
      { name: { he: 'סטון טאון', en: 'Stone Town' }, forWhom: { he: '1–2 לילות של תרבות, אוכל ואווירה — לא לחופשת חוף', en: '1–2 nights of culture, food and atmosphere — not a beach base' } },
      { name: { he: 'נונגווי וקנדווה (צפון)', en: 'Nungwi & Kendwa (north)' }, forWhom: { he: 'מי שרוצה לשחות כל היום — פחות תלות בגאות ושפל, שקיעות יפות', en: 'Swimmers — less affected by the tides, lovely sunsets' } },
      { name: { he: 'מטמווה וקיוונגווה (צפון-מזרח)', en: 'Matemwe & Kiwengwa (north-east)' }, forWhom: { he: 'ריזורטים והכול כלול, קרוב לאטול מנמבה', en: 'Resorts and all-inclusive stays, close to Mnemba Atoll' } },
      { name: { he: 'פאג׳ה וג׳מביאני (דרום-מזרח)', en: 'Paje & Jambiani (south-east)' }, forWhom: { he: 'קייטסרפינג, אווירה צעירה ונינוחה; שפל ארוך בחלק מהיום', en: 'Kitesurfing and a relaxed, young vibe; long low tides for part of the day' } }
    ],
    attractions: [
      { name: { he: 'סיור רגלי בסטון טאון', en: 'Stone Town walking tour' }, kind: 'neighborhood', durationH: 3, tags: ['culture'], area: 'Stone Town' },
      { name: { he: 'שוק אוכל הערב בגני פורודאני', en: 'Forodhani Gardens night food market' }, kind: 'market', durationH: 1.5, tags: ['food'], area: 'Stone Town' },
      { name: { he: 'שוק דרג׳אני', en: 'Darajani Market' }, kind: 'market', durationH: 1.5, tags: ['culture', 'food'], area: 'Stone Town' },
      { name: { he: 'המבצר הישן', en: 'The Old Fort' }, kind: 'landmark', durationH: 1, tags: ['culture'], area: 'Stone Town' },
      { name: { he: 'אתר שוק העבדים לשעבר והקתדרלה האנגליקנית', en: 'Former Slave Market site & Anglican Cathedral' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'Stone Town' },
      { name: { he: 'אי הכלא (צ׳אנגו) וצבי הענק', en: 'Prison Island (Changuu) & giant tortoises' }, kind: 'nature', durationH: 3, tags: ['family', 'nature'] },
      { name: { he: 'סיור תבלינים', en: 'Spice tour' }, kind: 'experience', durationH: 3, tags: ['culture', 'food'] },
      { name: { he: 'יער ג׳וזאני (פארק לאומי ג׳וזאני-מפרץ צ׳וואקה)', en: 'Jozani Forest (Jozani Chwaka Bay National Park)' }, kind: 'park', durationH: 2.5, tags: ['nature', 'family'] },
      { name: { he: 'שנורקלינג באטול מנמבה', en: 'Snorkelling at Mnemba Atoll' }, kind: 'nature', durationH: 4, tags: ['beach', 'nature'], area: 'Matemwe & Kiwengwa (north-east)' },
      { name: { he: 'חוף נונגווי', en: 'Nungwi Beach' }, kind: 'beach', durationH: 4, tags: ['beach', 'relaxation'], area: 'Nungwi & Kendwa (north)' },
      { name: { he: 'שייט דאו בשקיעה', en: 'Sunset dhow cruise' }, kind: 'experience', durationH: 2, tags: ['couple'] },
      { name: { he: 'שיעור קייטסרפינג בפאג׳ה', en: 'Kitesurfing lesson in Paje' }, kind: 'experience', durationH: 3, tags: ['adventure'], area: 'Paje & Jambiani (south-east)' },
      { name: { he: 'שייט באזור מפרץ מנאי ושרטון החול קוואלה', en: 'Menai Bay boat trip & Kwale sandbank' }, kind: 'experience', durationH: 7, tags: ['beach', 'family'] }
    ],
    dayTrips: [
      { name: { he: 'ספארי יום בטיסה קלה לפארק בטנזניה (מיקומי או ניירירה)', en: 'Fly-in day safari to mainland Tanzania (Mikumi or Nyerere)' }, hours: 11, note: { he: 'טיסה קצרה במטוס קל ונסיעות ספארי — יום ארוך ויקר, אבל טעימה אמיתית מהספארי', en: 'A short light-aircraft flight and game drives — a long, pricey day, but a real taste of safari' } },
      { name: { he: 'קיזימקזי', en: 'Kizimkazi' }, hours: 5, note: { he: 'כפר דייגים בדרום האי; יציאה מוקדמת בבוקר לראות דולפינים — בלי לרדוף אחריהם', en: 'A fishing village in the south; early-morning boats to see dolphins — ask for a responsible operator' } }
    ],
    transport: { carRecommended: false, note: { he: 'רוב התנועה בהסעות ובנהגים פרטיים; הנסיעה משדה התעופה לצפון או לדרום-מזרח לוקחת כשעה. השכרת רכב דורשת היתר נהיגה מקומי, והנהיגה בצד שמאל.', en: 'Most people use transfers and private drivers; the airport to the north or south-east takes about an hour. Car hire needs a local driving permit, and traffic drives on the left.' } },
    practical: {
      currency: 'TZS', language: { he: 'סווהילית ואנגלית', en: 'Swahili and English' }, timeZone: 'Africa/Dar_es_Salaam',
      visaNoteForIsraelis: { he: 'בעלי דרכון ישראלי נדרשים בדרך כלל לוויזה לטנזניה — ויזה אלקטרונית מראש (ובחלק מהמקרים גם בהגעה). הכללים משתנים — חובה לבדוק במקורות הרשמיים לפני הטיסה. מומלץ גם להתייעץ במרפאת מטיילים.', en: 'Israeli passport holders generally need a visa for Tanzania — an e-visa in advance (and in some cases on arrival). Rules change — always check official sources before you fly. A visit to a travel clinic is also recommended.' },
      kosher: { he: 'אין היצע כשר מקומי קבוע; כדאי לבדוק מראש אם יש פעילות חב״ד בעונה, או לתאם ארוחות ארוזות עם המלון.', en: 'No regular local kosher supply; check in advance whether Chabad is active in season, or arrange packed meals with the hotel.' },
      shabbat: { he: 'בריזורט על החוף אין צורך בנסיעות — נוח לשבת; לתאם מראש אוכל ונרות.', en: 'A beach resort needs no travel — easy for Shabbat; arrange food and candles in advance.' }
    },
    seasonsNote: { he: 'יוני–אוקטובר: עונה יבשה ונעימה. דצמבר–פברואר: חם ויבש יחסית. מרץ–מאי: הגשמים הארוכים, וחלק מהמקומות סגורים; בנובמבר יש גשמים קצרים.', en: 'June–October is dry and pleasant. December–February is hot and fairly dry. March–May brings the long rains and some places close; November has short rains.' }
  },
  {
    id: 'seychelles', code: 'SEZ', airports: ['SEZ'],
    name: { he: 'איי סיישל', en: 'Seychelles' }, country: { he: 'סיישל', en: 'Seychelles' }, region: 'africa',
    tags: ['beach', 'couple', 'luxury', 'nature', 'relaxation', 'direct_flight', 'week_long'],
    bestMonths: [4, 5, 9, 10, 11], flightHours: 6, direct: true, budgetLevel: 4, dailyBudgetIls: { low: 300, mid: 550, high: 1100 },
    summary: { he: 'סלעי גרניט ענקיים, חופים מהיפים בעולם ויערות ירוקים — ארכיפלג באוקיינוס ההודי לזוגות ולמי שאוהב טבע, שנורקלינג ושקט.', en: 'Giant granite boulders, some of the world’s most beautiful beaches and green forests — an Indian Ocean archipelago for couples and lovers of nature, snorkelling and quiet.' },
    highlights: [
      { he: 'חוף אנס סורס ד׳ארז׳אן בלה דיג', en: 'Anse Source d’Argent on La Digue' },
      { he: 'יער ואלה דה מאי ואגוזי הקוקו דה מר', en: 'Vallée de Mai and its coco de mer palms' },
      { he: 'חוף אנס לאציו בפראסלין', en: 'Anse Lazio on Praslin' },
      { he: 'אופניים בין החופים בלה דיג', en: 'Cycling between beaches on La Digue' },
      { he: 'צבי ענק באי קוריוז', en: 'Giant tortoises on Curieuse Island' },
      { he: 'שנורקלינג בפארק הימי סנט אן', en: 'Snorkelling in Sainte Anne Marine National Park' },
      { he: 'מסלולי הליכה בהרי מאהה', en: 'Hiking trails in the hills of Mahé' }
    ],
    areas: [
      { name: { he: 'בו ואלון (צפון מאהה)', en: 'Beau Vallon (north Mahé)' }, forWhom: { he: 'חוף ארוך ונוח לשחייה, מסעדות וקרבה לוויקטוריה', en: 'A long, swimmable beach, restaurants and easy access to Victoria' } },
      { name: { he: 'דרום ומערב מאהה', en: 'South & west Mahé' }, forWhom: { he: 'מפרצים שקטים וריזורטים מבודדים', en: 'Quiet coves and secluded resorts' } },
      { name: { he: 'פראסלין', en: 'Praslin' }, forWhom: { he: 'חופים מהיפים בסיישל ובסיס נוח לאיים הקטנים', en: 'Some of the best beaches and a good base for the small islands' } },
      { name: { he: 'לה דיג', en: 'La Digue' }, forWhom: { he: 'אי קטן בלי כמעט מכוניות — אופניים, קצב איטי ורומנטיקה', en: 'A small island with hardly any cars — bikes, slow pace and romance' } }
    ],
    attractions: [
      { name: { he: 'אנס סורס ד׳ארז׳אן', en: 'Anse Source d’Argent' }, kind: 'beach', durationH: 3, tags: ['beach', 'couple'], area: 'La Digue' },
      { name: { he: 'אחוזת יוניון וצבי הענק', en: 'L’Union Estate & giant tortoises' }, kind: 'park', durationH: 1.5, tags: ['family', 'nature'], area: 'La Digue' },
      { name: { he: 'ואלה דה מאי (אתר מורשת עולמית)', en: 'Vallée de Mai (World Heritage Site)' }, kind: 'nature', durationH: 2, tags: ['nature'], area: 'Praslin' },
      { name: { he: 'אנס לאציו', en: 'Anse Lazio' }, kind: 'beach', durationH: 3, tags: ['beach'], area: 'Praslin' },
      { name: { he: 'אי קוריוז ושנורקלינג בסנט פייר', en: 'Curieuse Island & snorkelling at St Pierre' }, kind: 'nature', durationH: 6, tags: ['nature', 'beach'], area: 'Praslin' },
      { name: { he: 'חוף בו ואלון', en: 'Beau Vallon Beach' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'], area: 'Beau Vallon (north Mahé)' },
      { name: { he: 'פארק ימי לאומי סנט אן', en: 'Sainte Anne Marine National Park' }, kind: 'nature', durationH: 4, tags: ['beach', 'nature'] },
      { name: { he: 'הפארק הלאומי מורן סיישלואה ומסלול קופוליה', en: 'Morne Seychellois National Park & the Copolia trail' }, kind: 'park', durationH: 3, tags: ['nature', 'adventure'] },
      { name: { he: 'שוק סר סלווין סלווין-קלארק בוויקטוריה', en: 'Sir Selwyn Selwyn-Clarke Market, Victoria' }, kind: 'market', durationH: 1, tags: ['food', 'culture'] },
      { name: { he: 'הגן הבוטני בוויקטוריה', en: 'Victoria Botanical Garden' }, kind: 'park', durationH: 1, tags: ['family', 'nature'] },
      { name: { he: 'תצפית חורבות המיסיון', en: 'Mission Ruins viewpoint' }, kind: 'viewpoint', durationH: 1, tags: ['culture'] },
      { name: { he: 'אנס אינטנדאנס', en: 'Anse Intendance' }, kind: 'beach', durationH: 2, tags: ['beach', 'couple'], area: 'South & west Mahé' }
    ],
    dayTrips: [
      { name: { he: 'פראסלין ולה דיג ממאהה', en: 'Praslin & La Digue from Mahé' }, hours: 10, note: { he: 'מעבורת מהירה לפראסלין (כשעה) ומשם קצרה ללה דיג; עדיף לישון לפחות לילה-שניים באיים', en: 'A fast ferry to Praslin (about an hour), then a short hop to La Digue; better to stay a night or two' } },
      { name: { he: 'האי קוזן', en: 'Cousin Island' }, hours: 3, note: { he: 'שמורת ציפורים קטנה בסירה מפראסלין; פתוחה רק בחלק מימות השבוע', en: 'A small bird reserve by boat from Praslin; open only on some weekdays' } }
    ],
    transport: { carRecommended: true, note: { he: 'במאהה ובפראסלין רכב שכור נותן חופש (נהיגה בצד שמאל, כבישים צרים ומתפתלים). בלה דיג מתניידים באופניים. בין האיים — מעבורות או טיסות פנים קצרות.', en: 'On Mahé and Praslin a hire car gives freedom (drive on the left; roads are narrow and winding). On La Digue you get around by bike. Between islands: ferries or short domestic flights.' } },
    practical: {
      currency: 'SCR', language: { he: 'קריאולית סיישלית, אנגלית וצרפתית', en: 'Seychellois Creole, English and French' }, timeZone: 'Indian/Mahe',
      visaNoteForIsraelis: { he: 'סיישל אינה דורשת ויזה מראש ומעניקה אישור שהייה בהגעה, אך נדרש אישור נסיעה מקוון לפני הטיסה. הכללים משתנים — חובה לבדוק במקורות הרשמיים.', en: 'Seychelles does not require a visa in advance and issues a visitor’s permit on arrival, but an online travel authorisation is required before you fly. Rules change — always check official sources.' },
      kosher: { he: 'אין היצע כשר מקומי; להביא או לתאם מראש ארוחות ארוזות.', en: 'No local kosher supply; bring or arrange packed meals in advance.' },
      shabbat: { he: 'כדאי לתכנן את השבת באותו אי ובאותו מלון, בלי מעברים בין איים.', en: 'Plan Shabbat on one island and in one hotel, without island hopping.' }
    },
    seasonsNote: { he: 'אפריל–מאי ואוקטובר–נובמבר: עונות המעבר — ים רגוע, צלול ונעים. יוני–ספטמבר: רוחות דרום-מזרחיות וים גלי יותר בחלק מהחופים. דצמבר–מרץ: חם, לח וגשום יותר.', en: 'April–May and October–November are the calm shoulder months — clear, gentle sea. June–September brings south-east trade winds and choppier water on some beaches. December–March is hotter, more humid and wetter.' }
  },
  {
    id: 'mauritius', code: 'MRU', airports: ['MRU'],
    name: { he: 'מאוריציוס', en: 'Mauritius' }, country: { he: 'מאוריציוס', en: 'Mauritius' }, region: 'africa',
    tags: ['beach', 'couple', 'family', 'all_inclusive', 'luxury', 'nature', 'relaxation', 'week_long'],
    bestMonths: [5, 6, 7, 8, 9, 10, 11], flightHours: 12, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 400, high: 850 },
    summary: { he: 'לגונות רגועות מוגנות בשונית, ריזורטים עם הכול כלול ופנים ירוק של מפלים והרים — אי באוקיינוס ההודי שמתאים גם לזוגות וגם למשפחות.', en: 'Calm reef-protected lagoons, all-inclusive resorts and a green interior of waterfalls and mountains — an Indian Ocean island for couples and families alike.' },
    highlights: [
      { he: 'הלגונות השקטות סביב האי', en: 'The calm lagoons around the island' },
      { he: 'אדמת שבעת הצבעים והמפל בשאמארל', en: 'The Seven Coloured Earth and waterfall at Chamarel' },
      { he: 'הר לה מורן, אתר מורשת עולמית', en: 'Le Morne Brabant, a World Heritage Site' },
      { he: 'שייט קטמרן לאיל או סרף', en: 'A catamaran to Île aux Cerfs' },
      { he: 'הפארק הלאומי ערוצי בלאק ריבר', en: 'Black River Gorges National Park' },
      { he: 'אוכל קריאולי והודי בשוק של פורט לואי', en: 'Creole and Indian food at the Port Louis market' }
    ],
    areas: [
      { name: { he: 'גראנד ביי והצפון', en: 'Grand Baie & the north' }, forWhom: { he: 'מסעדות, חיי ערב ושופינג — ונוח לטיולים', en: 'Restaurants, nightlife and shopping — and handy for touring' } },
      { name: { he: 'פליק אן פלאק והמערב', en: 'Flic en Flac & the west' }, forWhom: { he: 'שקיעות, ים רגוע וקרבה לשאמארל ולבלאק ריבר', en: 'Sunsets, calm water and close to Chamarel and Black River' } },
      { name: { he: 'בל מאר והמזרח', en: 'Belle Mare & the east' }, forWhom: { he: 'חופים ארוכים וריזורטים גדולים — מתאים למשפחות', en: 'Long beaches and big resorts — good for families' } },
      { name: { he: 'לה מורן והדרום-מערב', en: 'Le Morne & the south-west' }, forWhom: { he: 'קייטסרפינג, נופים דרמטיים וריזורטי יוקרה', en: 'Kitesurfing, dramatic scenery and luxury resorts' } },
      { name: { he: 'בלו ביי והדרום-מזרח', en: 'Blue Bay & the south-east' }, forWhom: { he: 'שנורקלינג בפארק הימי, קרוב לשדה התעופה', en: 'Snorkelling in the marine park, close to the airport' } }
    ],
    attractions: [
      { name: { he: 'אדמת שבעת הצבעים בשאמארל', en: 'Seven Coloured Earth, Chamarel' }, kind: 'nature', durationH: 1.5, tags: ['family', 'nature'], area: 'Le Morne & the south-west' },
      { name: { he: 'מפל שאמארל', en: 'Chamarel Waterfall' }, kind: 'viewpoint', durationH: 1, tags: ['nature'], area: 'Le Morne & the south-west' },
      { name: { he: 'הפארק הלאומי ערוצי בלאק ריבר', en: 'Black River Gorges National Park' }, kind: 'park', durationH: 4, tags: ['nature', 'adventure'] },
      { name: { he: 'טיפוס להר לה מורן', en: 'Le Morne Brabant hike' }, kind: 'nature', durationH: 4, tags: ['adventure', 'nature'], area: 'Le Morne & the south-west' },
      { name: { he: 'איל או סרף', en: 'Île aux Cerfs' }, kind: 'beach', durationH: 5, tags: ['beach', 'family'], area: 'Belle Mare & the east' },
      { name: { he: 'פארק ימי בלו ביי', en: 'Blue Bay Marine Park' }, kind: 'nature', durationH: 2.5, tags: ['beach', 'family'], area: 'Blue Bay & the south-east' },
      { name: { he: 'גראנד באסן (גנגה טאלאו)', en: 'Grand Bassin (Ganga Talao)' }, kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'הגן הבוטני בפמפלמוס', en: 'Pamplemousses Botanical Garden' }, kind: 'park', durationH: 2, tags: ['family', 'nature'], area: 'Grand Baie & the north' },
      { name: { he: 'השוק המרכזי בפורט לואי', en: 'Port Louis Central Market' }, kind: 'market', durationH: 1.5, tags: ['food', 'culture'] },
      { name: { he: 'אאפרבאסי גאט (אתר מורשת עולמית)', en: 'Aapravasi Ghat (World Heritage Site)' }, kind: 'museum', durationH: 1, tags: ['culture'] },
      { name: { he: 'מכתש טרו או סרף בקורפיפ', en: 'Trou aux Cerfs crater, Curepipe' }, kind: 'viewpoint', durationH: 1, tags: ['nature'] },
      { name: { he: 'בית הקברות היהודי סנט מרטין', en: 'St Martin Jewish Cemetery' }, kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'קזלה — פארק טבע ובעלי חיים', en: 'Casela Nature Parks' }, kind: 'park', durationH: 4, tags: ['family', 'with_children'], area: 'Flic en Flac & the west' }
    ],
    dayTrips: [
      { name: { he: 'סיור הדרום: שאמארל, בלאק ריבר וגראנד באסן', en: 'Southern tour: Chamarel, Black River & Grand Bassin' }, hours: 8, note: { he: 'הטיול הקלאסי באי — עם נהג או ברכב שכור', en: 'The classic island tour — with a driver or a hire car' } },
      { name: { he: 'פורט לואי ופמפלמוס', en: 'Port Louis & Pamplemousses' }, hours: 6, note: { he: 'שוק, היסטוריה וגן בוטני — אפשר לשלב בבית הקברות סנט מרטין', en: 'Market, history and a botanical garden — can be combined with St Martin cemetery' } },
      { name: { he: 'שייט קטמרן במזרח', en: 'East-coast catamaran cruise' }, hours: 7, note: { he: 'איל או סרף, שנורקלינג וארוחה על הסיפון', en: 'Île aux Cerfs, snorkelling and lunch on board' } }
    ],
    transport: { carRecommended: true, note: { he: 'רכב שכור משתלם לטיולים (נהיגה בצד שמאל); מוניות יקרות יחסית. מי שלא נוהג יכול להזמין נהג לטיולי יום.', en: 'A hire car pays off for touring (drive on the left); taxis are fairly pricey. Non-drivers can book a driver for day trips.' } },
    practical: {
      currency: 'MUR', language: { he: 'אנגלית (רשמית), צרפתית וקריאולית', en: 'English (official), French and Creole' }, timeZone: 'Indian/Mauritius',
      visaNoteForIsraelis: { he: 'בדרך כלל לא נדרשת ויזה מראש לבעלי דרכון ישראלי לשהייה תיירותית קצרה, אך הכללים משתנים — חובה לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israeli passport holders generally do not need a visa in advance for a short tourist stay, but rules change — always check official sources before you fly.' },
      kosher: { he: 'אין היצע כשר מקומי קבוע; לתאם מראש ארוחות ארוזות או לבדוק מול חב״ד.', en: 'No regular local kosher supply; arrange packed meals in advance or check with Chabad.' },
      shabbat: { he: 'בריזורט אין צורך בנסיעות — נוח לשבת; לתאם מראש אוכל ונרות.', en: 'A resort needs no travel — easy for Shabbat; arrange food and candles in advance.' }
    },
    seasonsNote: { he: 'מאי–נובמבר: החורף המקומי — יבש, נעים ופחות לח. דצמבר–אפריל: קיץ חם ולח, ובינואר–מרץ עונת הציקלונים.', en: 'May–November is the local winter — dry, pleasant and less humid. December–April is hot and humid summer, with cyclone season in January–March.' }
  },
  {
    id: 'cape-town', code: 'CPT', airports: ['CPT'],
    name: { he: 'קייפטאון', en: 'Cape Town' }, country: { he: 'דרום אפריקה', en: 'South Africa' }, region: 'africa',
    tags: ['city', 'nature', 'food', 'couple', 'adventure', 'culture', 'kosher', 'week_long'],
    bestMonths: [10, 11, 12, 1, 2, 3, 4], flightHours: 13, direct: false, budgetLevel: 2, dailyBudgetIls: { low: 150, mid: 300, high: 650 },
    summary: { he: 'עיר בין הר לים: הר השולחן, חופים, פינגווינים ויקבים במרחק נסיעה — ובסיס מושלם לטיול בכף ולדרך הגנים.', en: 'A city between mountain and sea: Table Mountain, beaches, penguins and wine estates a short drive away — and the perfect base for the Cape and the Garden Route.' },
    highlights: [
      { he: 'רכבל או טיפוס להר השולחן', en: 'Table Mountain by cableway or on foot' },
      { he: 'פינגווינים בחוף בולדרס', en: 'Penguins at Boulders Beach' },
      { he: 'כף התקווה הטובה וקייפ פוינט', en: 'The Cape of Good Hope and Cape Point' },
      { he: 'יקבים בסטלנבוש ובפרנשהוק', en: 'Wine estates in Stellenbosch and Franschhoek' },
      { he: 'כביש צ׳פמנס פיק', en: 'Chapman’s Peak Drive' },
      { he: 'הבתים הצבעוניים של בו-קאפ', en: 'The colourful houses of Bo-Kaap' },
      { he: 'רוד טריפ בדרך הגנים', en: 'A road trip along the Garden Route' }
    ],
    areas: [
      { name: { he: 'סיטי בול וגארדנס', en: 'City Bowl & Gardens' }, forWhom: { he: 'מרכזי, מסעדות ובתי קפה, קרוב להר השולחן ולבו-קאפ', en: 'Central, with restaurants and cafés, close to Table Mountain and Bo-Kaap' } },
      { name: { he: 'סי פוינט וגרין פוינט', en: 'Sea Point & Green Point' }, forWhom: { he: 'טיילת לים, קהילה יהודית ומקומות כשרים — נוח לשומרי כשרות ולשבת', en: 'A seafront promenade, the Jewish community and kosher options — handy for kashrut and Shabbat' } },
      { name: { he: 'קמפס ביי וקליפטון', en: 'Camps Bay & Clifton' }, forWhom: { he: 'חופים, שקיעות ויוקרה', en: 'Beaches, sunsets and luxury' } },
      { name: { he: 'הווטרפרונט (V&A)', en: 'V&A Waterfront' }, forWhom: { he: 'משפחות וביקור ראשון — בטוח, נוח ומלא אטרקציות', en: 'Families and first-timers — safe, easy and full of attractions' } }
    ],
    attractions: [
      { name: { he: 'הר השולחן ורכבל ההר', en: 'Table Mountain & Aerial Cableway' }, kind: 'viewpoint', durationH: 3, tags: ['nature', 'family'], area: 'City Bowl & Gardens' },
      { name: { he: 'טיפוס לראש האריה (Lion’s Head)', en: 'Lion’s Head hike' }, kind: 'nature', durationH: 3, tags: ['adventure', 'nature'] },
      { name: { he: 'הווטרפרונט', en: 'V&A Waterfront' }, kind: 'neighborhood', durationH: 3, tags: ['shopping', 'food', 'family'], area: 'V&A Waterfront' },
      { name: { he: 'מוזיאון זייץ לאמנות עכשווית אפריקאית (MOCAA)', en: 'Zeitz MOCAA' }, kind: 'museum', durationH: 2, tags: ['culture'], area: 'V&A Waterfront' },
      { name: { he: 'רובן איילנד', en: 'Robben Island' }, kind: 'museum', durationH: 4, tags: ['culture'] },
      { name: { he: 'בו-קאפ', en: 'Bo-Kaap' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture'], area: 'City Bowl & Gardens' },
      { name: { he: 'המוזיאון היהודי של דרום אפריקה', en: 'South African Jewish Museum' }, kind: 'museum', durationH: 1.5, tags: ['culture'], area: 'City Bowl & Gardens' },
      { name: { he: 'הגן הבוטני קירסטנבוש', en: 'Kirstenbosch National Botanical Garden' }, kind: 'park', durationH: 3, tags: ['nature', 'family'] },
      { name: { he: 'חוף בולדרס והפינגווינים', en: 'Boulders Beach penguins' }, kind: 'nature', durationH: 1.5, tags: ['family', 'nature'] },
      { name: { he: 'כף התקווה הטובה וקייפ פוינט', en: 'Cape of Good Hope & Cape Point' }, kind: 'viewpoint', durationH: 3, tags: ['nature'] },
      { name: { he: 'כביש צ׳פמנס פיק', en: 'Chapman’s Peak Drive' }, kind: 'viewpoint', durationH: 1, tags: ['nature', 'couple'] },
      { name: { he: 'חוף קמפס ביי', en: 'Camps Bay Beach' }, kind: 'beach', durationH: 2, tags: ['beach'], area: 'Camps Bay & Clifton' },
      { name: { he: 'שקיעה מסיגנל היל', en: 'Sunset from Signal Hill' }, kind: 'viewpoint', durationH: 1, tags: ['couple'] }
    ],
    dayTrips: [
      { name: { he: 'חצי האי של הכף', en: 'The Cape Peninsula' }, hours: 9, note: { he: 'צ׳פמנס פיק, בולדרס וקייפ פוינט בלולאה אחת — יום חובה', en: 'Chapman’s Peak, Boulders and Cape Point in one loop — a must' } },
      { name: { he: 'ארץ היין: סטלנבוש ופרנשהוק', en: 'The Winelands: Stellenbosch & Franschhoek' }, hours: 8, note: { he: 'יקבים, אוכל טוב ועיירות הולנדיות-כפיות; עדיף עם נהג', en: 'Wine estates, good food and Cape Dutch towns; better with a driver' } },
      { name: { he: 'הרמנוס', en: 'Hermanus' }, hours: 8, note: { he: 'צפייה בלווייתנים מהחוף, בעיקר ביולי–נובמבר', en: 'Whale watching from the shore, mainly July–November' } }
    ],
    transport: { carRecommended: true, note: { he: 'רכב שכור מומלץ לחצי האי, ליקבים ולדרך הגנים (נהיגה בצד שמאל). בעיר נוח להיעזר באובר. כדאי להימנע מהליכה בלילה ברחובות ריקים ולא להשאיר חפצים ברכב.', en: 'A hire car is worth it for the peninsula, the Winelands and the Garden Route (drive on the left). In town, Uber is handy. Avoid walking empty streets at night and leave nothing on view in the car.' } },
    practical: {
      currency: 'ZAR', language: { he: 'אנגלית, אפריקאנס וקוסה', en: 'English, Afrikaans and Xhosa' }, timeZone: 'Africa/Johannesburg',
      visaNoteForIsraelis: { he: 'בדרך כלל לא נדרשת ויזה לבעלי דרכון ישראלי לשהייה תיירותית קצרה; נדרשים דפים ריקים בדרכון. הכללים משתנים — חובה לבדוק במקורות הרשמיים.', en: 'Israeli passport holders generally do not need a visa for a short tourist stay; blank passport pages are required. Rules change — always check official sources.' },
      kosher: { he: 'בקייפטאון קהילה יהודית ותיקה, עם מסעדות וחנויות בהשגחה (בעיקר בסי פוינט ובגארדנס) ובית חב״ד. מחוץ לעיר — לתאם מראש.', en: 'Cape Town has a long-established Jewish community with supervised restaurants and shops (mainly in Sea Point and Gardens) and a Chabad house. Outside the city, arrange in advance.' },
      shabbat: { he: 'בתי כנסת בגארדנס ובסי פוינט — כדאי לישון בהליכה מהם ולתאם ארוחות מראש.', en: 'Synagogues in Gardens and Sea Point — stay within walking distance and arrange meals in advance.' }
    },
    seasonsNote: { he: 'נובמבר–מרץ: הקיץ — חם, יבש ושמשי, אבל רוח חזקה. ספטמבר–אוקטובר: אביב, פריחה ולווייתנים. יוני–אוגוסט: חורף גשום וקריר, ומחירים נמוכים יותר. המים באוקיינוס קרים כל השנה.', en: 'November–March is summer — hot, dry and sunny, but windy. September–October is spring, with wildflowers and whales. June–August is a cool, rainy winter with lower prices. The ocean is cold all year.' }
  },
  {
    id: 'kenya-safari', code: 'NBO', airports: ['NBO'],
    name: { he: 'ספארי בקניה', en: 'Kenya Safari' }, country: { he: 'קניה', en: 'Kenya' }, region: 'africa',
    tags: ['adventure', 'nature', 'couple', 'family', 'luxury', 'week_long'],
    bestMonths: [1, 2, 6, 7, 8, 9, 10], flightHours: 8, direct: false, budgetLevel: 4, dailyBudgetIls: { low: 450, mid: 850, high: 1600 },
    summary: { he: 'ספארי קלאסי: אריות, פילים והנדידה הגדולה במסאי מארה, פילים מול הקילימנג׳רו באמבוסלי ואגמי עמק השבר — עם ניירובי כשער כניסה.', en: 'Classic safari: lions, elephants and the Great Migration in the Maasai Mara, elephants below Kilimanjaro in Amboseli and the Rift Valley lakes — with Nairobi as the gateway.' },
    highlights: [
      { he: 'הנדידה הגדולה וחציית נהר המארה (יולי–אוקטובר)', en: 'The Great Migration and the Mara River crossings (July–October)' },
      { he: 'נסיעות ספארי במסאי מארה', en: 'Game drives in the Maasai Mara' },
      { he: 'כדור פורח מעל הסוואנה בזריחה', en: 'A sunrise hot-air balloon over the savannah' },
      { he: 'פילים על רקע הקילימנג׳רו באמבוסלי', en: 'Elephants against Kilimanjaro in Amboseli' },
      { he: 'שייט בין היפופוטמים באגם נאיבאשה', en: 'A boat among hippos on Lake Naivasha' },
      { he: 'מרכז הג׳ירפות ובית היתומים לפילים בניירובי', en: 'The Giraffe Centre and the elephant orphanage in Nairobi' }
    ],
    areas: [
      { name: { he: 'ניירובי (קארן)', en: 'Nairobi (Karen)' }, forWhom: { he: 'לילה ראשון ואחרון, קרוב לאטרקציות של בעלי החיים', en: 'First and last nights, close to the wildlife attractions' } },
      { name: { he: 'מסאי מארה', en: 'Maasai Mara' }, forWhom: { he: 'לב הספארי — לפחות 3 לילות, במיוחד בעונת הנדידה', en: 'The heart of the safari — at least 3 nights, especially in migration season' } },
      { name: { he: 'אמבוסלי', en: 'Amboseli' }, forWhom: { he: 'פילים ונוף הקילימנג׳רו — 2 לילות', en: 'Elephants and Kilimanjaro views — 2 nights' } },
      { name: { he: 'נאיבאשה ונאקורו (עמק השבר)', en: 'Naivasha & Nakuru (Rift Valley)' }, forWhom: { he: 'עצירה בדרך למארה: אגמים, ספארי ברגל ורכיבה על אופניים', en: 'A stop on the way to the Mara: lakes, walking safaris and cycling' } }
    ],
    attractions: [
      { name: { he: 'נסיעות ספארי בשמורת מסאי מארה', en: 'Game drives in the Maasai Mara National Reserve' }, kind: 'nature', durationH: 8, tags: ['adventure', 'nature'], area: 'Maasai Mara' },
      { name: { he: 'חציית נהר המארה בעונת הנדידה', en: 'Mara River migration crossings' }, kind: 'nature', durationH: 6, tags: ['nature'], area: 'Maasai Mara' },
      { name: { he: 'כדור פורח מעל המארה', en: 'Hot-air balloon over the Mara' }, kind: 'experience', durationH: 4, tags: ['couple', 'luxury'], area: 'Maasai Mara' },
      { name: { he: 'ביקור בכפר מסאי', en: 'Maasai village visit' }, kind: 'experience', durationH: 1.5, tags: ['culture'], area: 'Maasai Mara' },
      { name: { he: 'הפארק הלאומי אמבוסלי', en: 'Amboseli National Park' }, kind: 'park', durationH: 7, tags: ['nature'], area: 'Amboseli' },
      { name: { he: 'שייט באגם נאיבאשה', en: 'Lake Naivasha boat ride' }, kind: 'nature', durationH: 1.5, tags: ['family', 'nature'], area: 'Naivasha & Nakuru (Rift Valley)' },
      { name: { he: 'ספארי רגלי באי קרסנט', en: 'Walking safari on Crescent Island' }, kind: 'nature', durationH: 2, tags: ['family'], area: 'Naivasha & Nakuru (Rift Valley)' },
      { name: { he: 'אופניים בפארק הלאומי הלס גייט', en: 'Cycling in Hell’s Gate National Park' }, kind: 'park', durationH: 4, tags: ['adventure'], area: 'Naivasha & Nakuru (Rift Valley)' },
      { name: { he: 'הפארק הלאומי אגם נאקורו', en: 'Lake Nakuru National Park' }, kind: 'park', durationH: 5, tags: ['nature'], area: 'Naivasha & Nakuru (Rift Valley)' },
      { name: { he: 'הפארק הלאומי ניירובי', en: 'Nairobi National Park' }, kind: 'park', durationH: 4, tags: ['nature', 'family'] },
      { name: { he: 'בית היתומים לפילים של שלדריק', en: 'Sheldrick Wildlife Trust elephant orphanage' }, kind: 'experience', durationH: 1.5, tags: ['family', 'with_children'] },
      { name: { he: 'מרכז הג׳ירפות', en: 'Giraffe Centre' }, kind: 'experience', durationH: 1, tags: ['family', 'with_children'], area: 'Nairobi (Karen)' },
      { name: { he: 'מוזיאון קארן בליקסן', en: 'Karen Blixen Museum' }, kind: 'museum', durationH: 1, tags: ['culture'], area: 'Nairobi (Karen)' }
    ],
    dayTrips: [
      { name: { he: 'נאיבאשה והלס גייט מניירובי', en: 'Naivasha & Hell’s Gate from Nairobi' }, hours: 10, note: { he: 'נסיעה של כשעתיים לכל כיוון; שייט באגם ואופניים בין זברות', en: 'About two hours each way; a boat on the lake and cycling among zebras' } },
      { name: { he: 'הפארק הלאומי ניירובי', en: 'Nairobi National Park' }, hours: 5, note: { he: 'ספארי בבוקר מוקדם עם קו הרקיע של העיר ברקע — טוב ליום ההגעה או העזיבה', en: 'An early-morning game drive with the city skyline behind — good for arrival or departure day' } }
    ],
    transport: { carRecommended: false, note: { he: 'לא נוהגים לבד: הספארי נעשה ברכב שטח עם נהג-מדריך. למסאי מארה ולאמבוסלי אפשר גם לטוס במטוס קל משדה וילסון בניירובי וכך לחסוך נסיעות ארוכות בכבישים משובשים.', en: 'No self-drive: safaris are done in a 4×4 with a driver-guide. To the Maasai Mara and Amboseli you can also fly by light aircraft from Nairobi’s Wilson Airport and skip long, rough drives.' } },
    practical: {
      currency: 'KES', language: { he: 'סווהילית ואנגלית', en: 'Swahili and English' }, timeZone: 'Africa/Nairobi',
      visaNoteForIsraelis: { he: 'קניה החליפה את הוויזה באישור נסיעה אלקטרוני (eTA) שיש להוציא לפני הטיסה. הכללים משתנים — חובה לבדוק במקורות הרשמיים. מומלץ להתייעץ במרפאת מטיילים לגבי חיסונים ומלריה.', en: 'Kenya has replaced visas with an electronic travel authorisation (eTA) that must be obtained before you fly. Rules change — always check official sources. A travel clinic visit about vaccinations and malaria is recommended.' },
      kosher: { he: 'בניירובי יש קהילה יהודית קטנה ובית כנסת; בלודג׳ים בספארי אין כשרות — לתאם מראש ארוחות ארוזות.', en: 'Nairobi has a small Jewish community and a synagogue; safari lodges have no kosher food — arrange packed meals in advance.' },
      shabbat: { he: 'כדאי לתכנן את השבת בלודג׳ אחד בלי נסיעות ספארי, ולתאם עם המפעיל מראש.', en: 'Plan Shabbat at one lodge without game drives, and arrange it with the operator in advance.' }
    },
    seasonsNote: { he: 'יולי–אוקטובר: עונה יבשה והנדידה הגדולה במארה — שיא העונה, להזמין מוקדם. ינואר–פברואר: יבש וחם, צפייה טובה. אפריל–מאי: הגשמים הארוכים, וחלק מהלודג׳ים סגורים; בנובמבר גשמים קצרים.', en: 'July–October is the dry season and the Great Migration in the Mara — peak season, book early. January–February is dry and warm with good viewing. April–May brings the long rains and some lodges close; November has short rains.' },
    advisory: { he: 'קיימת אזהרת מסע של המטה לביטחון לאומי לקניה. רמת האזהרה משתנה — יש לבדוק באתר המל״ל לפני ההזמנה.', en: 'Israel’s National Security Council has a travel warning in place for Kenya. The level changes — check the NSC website before booking.' }
  }
];
