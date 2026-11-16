// Brochure details per attraction (spec 29) – key: `${destinationId}|${attraction name.en}`. Prices are rough per-adult estimates in ILS.
export default {
  // ── New York ──
  'new-york|Central Park': {
    about: { he: 'פארק ענק של כ־3,400 דונם באמצע מנהטן, עם אגמים, גשרי אבן, מדשאות ושבילי אופניים. מטיילים בין בת׳סדה טרס, שדרת המול, סטרוברי פילדס וטירת בלוודר, ואפשר לשכור סירת משוטים באגם.', en: 'An 843-acre park in the middle of Manhattan, with lakes, stone bridges, lawns and bike loops. Walk between Bethesda Terrace, the Mall, Strawberry Fields and Belvedere Castle, or rent a rowboat on the Lake.' },
    tip: { he: 'שכרו אופניים לשעתיים ורכבו על הלולאה המרכזית – רואים הרבה יותר מאשר ברגל. בבוקר מוקדם הפארק שקט במיוחד.', en: 'Rent bikes for two hours and ride the main loop – you see far more than on foot. Early mornings are especially calm.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'new-york|Statue of Liberty & Ellis Island': {
    about: { he: 'מעבורת מבאטרי פארק לאי החירות, שם עומד הפסל המפורסם, וממשיכה לאליס איילנד – תחנת ההגירה שדרכה עברו מיליוני מהגרים. במוזיאון באליס איילנד רואים את אולם הרישום המקורי וסיפורים אישיים של מהגרים.', en: 'A ferry from Battery Park to Liberty Island, home of the famous statue, then on to Ellis Island, the immigration station millions passed through. The Ellis Island museum keeps the original Registry Room and personal immigrant stories.' },
    tip: { he: 'כרטיסים לכן הפסל ולכתר נגמרים שבועות מראש – הזמינו רק דרך Statue City Cruises. קחו את המעבורת הראשונה והקדישו לזה לפחות חצי יום.', en: 'Pedestal and crown tickets sell out weeks ahead – buy only via Statue City Cruises. Take the first ferry and allow at least half a day.' },
    book: 'recommended',
    ticketIls: { low: 90, high: 120 }
  },
  'new-york|The Metropolitan Museum of Art': {
    about: { he: 'אחד המוזיאונים הגדולים בעולם, עם 5,000 שנות אמנות: מקדש דנדור המצרי השלם, אגף השריונות, ציורי ון גוך ורמברנדט ואמנות אמריקאית. אי אפשר לראות הכול – בוחרים שלושה–ארבעה אגפים.', en: 'One of the world’s great museums, spanning 5,000 years: the complete Egyptian Temple of Dendur, the Arms and Armor hall, Van Gogh and Rembrandt, and the American Wing. You can’t see it all – pick three or four galleries.' },
    tip: { he: 'בקיץ עלו לגג (Roof Garden) לנוף על סנטרל פארק. בימי שישי ושבת המוזיאון פתוח עד מאוחר ופחות עמוס בערב.', en: 'In summer go up to the Roof Garden for Central Park views. On Friday and Saturday it stays open late and evenings are quieter.' },
    book: 'recommended',
    ticketIls: { low: 100, high: 115 },
    hours: { he: 'סגור בימי רביעי', en: 'Closed Wednesdays' }
  },
  'new-york|American Museum of Natural History': {
    about: { he: 'מוזיאון ענק לתולדות הטבע: שלדי דינוזאורים בקומה הרביעית, לווייתן כחול בגודל מלא תלוי מהתקרה, דיורמות של בעלי חיים ומרכז גילדר החדש עם פרפרים חיים. גן עדן לילדים.', en: 'A huge natural history museum: dinosaur skeletons on the fourth floor, a life-size blue whale hanging from the ceiling, classic animal dioramas and the new Gilder Center with live butterflies. Heaven for kids.' },
    tip: { he: 'התחילו בקומת הדינוזאורים לפני שהיא מתמלאת. מופע הפלנטריום ומעון הפרפרים דורשים כרטיס נוסף.', en: 'Start with the dinosaur floor before it fills up. The planetarium show and butterfly vivarium need an add-on ticket.' },
    book: 'recommended',
    ticketIls: { low: 105, high: 165 }
  },
  'new-york|Museum of Modern Art (MoMA)': {
    about: { he: 'המוזיאון החשוב בעולם לאמנות מודרנית: ״ליל כוכבים״ של ון גוך, ״העלמות מאביניון״ של פיקאסו, פחיות המרק של וורהול ושעונים נמסים של דאלי. גם אגף העיצוב שווה עצירה.', en: 'The world’s leading modern art museum: Van Gogh’s Starry Night, Picasso’s Les Demoiselles d’Avignon, Warhol’s soup cans and Dalí’s melting clocks. The design galleries are worth a stop too.' },
    tip: { he: 'עלו ישר לקומה החמישית (1880–1940) – שם רוב היצירות המפורסמות – ורדו למטה. גן הפסלים מצוין להפסקה.', en: 'Go straight to the fifth floor (1880–1940), where most of the famous works hang, then work your way down. The sculpture garden is perfect for a break.' },
    book: 'recommended',
    ticketIls: { low: 110, high: 115 }
  },
  'new-york|Top of the Rock': {
    about: { he: 'מרפסות תצפית בקומות 67–70 של מגדל רוקפלר סנטר. היתרון על פני האמפייר סטייט: רואים את האמפייר סטייט עצמו, ומהצד השני את סנטרל פארק כולו.', en: 'Observation decks on floors 67–70 of 30 Rockefeller Plaza. Its edge over the Empire State: you actually see the Empire State Building, and on the other side the whole of Central Park.' },
    tip: { he: 'הזמינו משבצת כחצי שעה לפני השקיעה ותישארו לראות את האורות נדלקים. משבצות השקיעה נגמרות ראשונות.', en: 'Book a slot about 30 minutes before sunset and stay for the city lights. Sunset slots sell out first.' },
    book: 'recommended',
    ticketIls: { low: 150, high: 210 }
  },
  'new-york|Times Square & a Broadway show': {
    about: { he: 'הצומת המואר ביותר בעולם, עם מסכי ענק והמון אדם, ומסביבו רובע התיאטראות של ברודוויי. מחזמר כמו ״מלך האריות״, ״ויקד״ או ״המילטון״ הוא חוויה ניו־יורקית קלאסית.', en: 'The world’s brightest intersection, all giant screens and crowds, surrounded by the Broadway theatre district. A musical like The Lion King, Wicked or Hamilton is a classic New York night.' },
    tip: { he: 'בדוכן TKTS שבטיימס סקוור יש כרטיסים לאותו יום בהנחה. את המופעים הלוהטים הזמינו מראש באתר הרשמי בלבד.', en: 'The TKTS booth in Times Square sells same-day discounted seats. For the hottest shows book ahead on the official site only.' },
    book: 'recommended',
    ticketIls: { low: 300, high: 900 },
    hours: { he: 'רוב מופעי ברודוויי לא מתקיימים בימי שני', en: 'Most Broadway shows are dark on Mondays' }
  },
  'new-york|9/11 Memorial & Museum': {
    about: { he: 'שתי בריכות ענק במקום שבו עמדו מגדלי התאומים, עם שמות כל הנספים חרוטים סביבן, ומתחתן מוזיאון מרגש עם שרידי המגדלים ועדויות מהיום ההוא. ביקור כבד אבל חשוב.', en: 'Two huge pools where the Twin Towers stood, ringed by the names of every victim, with a moving museum below holding remains of the towers and testimony from the day. Heavy, but important.' },
    tip: { he: 'האנדרטה בחוץ פתוחה בחינם; למוזיאון הזמינו שעה מראש. תכננו זמן רגוע אחריו – למשל טיול באוקולוס הסמוך.', en: 'The outdoor memorial is free; book a museum time slot in advance. Plan something gentle afterwards, like the nearby Oculus.' },
    book: 'recommended',
    ticketIls: { low: 0, high: 130 }
  },
  'new-york|Brooklyn Bridge & DUMBO': {
    about: { he: 'הליכה על הגשר התלוי המפורסם מ־1883, על שביל עץ מעל התנועה, עם נוף לקו הרקיע של מנהטן. בצד ברוקלין מחכה דאמבו – רחובות מרוצפים, גלריות ונוף לגשר מנהטן.', en: 'A walk across the famous 1883 suspension bridge on a wooden promenade above the traffic, with Manhattan skyline views. On the Brooklyn side waits DUMBO, with cobbled streets, galleries and the classic Manhattan Bridge view.' },
    tip: { he: 'קחו רכבת לדאמבו וחצו את הגשר לכיוון מנהטן – כך הנוף מולכם. התמונה המפורסמת היא ברחוב וושינגטון.', en: 'Take the subway to DUMBO and walk toward Manhattan so the skyline is in front of you. The famous photo spot is on Washington Street.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'new-york|The High Line & Chelsea Market': {
    about: { he: 'פארק מוגבה באורך כ־2.3 ק״מ על מסילת רכבת ישנה, עם צמחייה, אמנות ונוף לרחובות מלמעלה. בדרך יורדים לצ׳לסי מרקט – מפעל ביסקוויטים לשעבר שהפך לשוק אוכל מקורה.', en: 'A 1.45-mile elevated park on an old freight rail line, with planting, art and views down the avenues. Along the way, drop into Chelsea Market, a former biscuit factory turned indoor food hall.' },
    tip: { he: 'התחילו בהדסון ירדס (עם ה־Vessel) והלכו דרומה, כך תסיימו בצ׳לסי מרקט ובמוזיאון ויטני – בזמן לארוחה.', en: 'Start at Hudson Yards by the Vessel and walk south, so you finish at Chelsea Market and the Whitney – just in time to eat.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'new-york|Williamsburg': {
    about: { he: 'שכונה תוססת בברוקלין עם בתי קפה, חנויות וינטג׳, אמנות רחוב, ברים על גגות ונוף למנהטן מהטיילת שעל הנהר. מקום טוב לראות את ניו יורק של הצעירים.', en: 'A lively Brooklyn neighbourhood of coffee shops, vintage stores, street art, rooftop bars and riverfront views back to Manhattan. A good place to see young New York.' },
    tip: { he: 'בשבתות בעונה החמה מתקיים כאן שוק האוכל Smorgasburg. הגיעו ברכבת L – תחנה אחת מתחת לנהר ממנהטן.', en: 'On warm-season Saturdays the Smorgasburg food market runs here. Take the L train – one stop under the river from Manhattan.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'new-york|Fifth Avenue': {
    about: { he: 'שדרת הקניות המפורסמת בעולם, בין חנויות הדגל של המותגים הגדולים, קתדרלת פטריק הקדוש, רוקפלר סנטר והספרייה הציבורית. בדצמבר – חלונות הראווה ועץ חג המולד המפורסם.', en: 'The world’s most famous shopping avenue, lined with flagship stores, St Patrick’s Cathedral, Rockefeller Center and the New York Public Library. In December – the window displays and the famous Christmas tree.' },
    tip: { he: 'הכניסה לספרייה הציבורית (רחוב 42) חינם – היכנסו לראות את אולם הקריאה הגדול. ליד יש פארק בראיינט להפסקה.', en: 'The New York Public Library at 42nd Street is free – step in to see the Rose Main Reading Room, with Bryant Park next door for a break.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'new-york|Staten Island Ferry': {
    about: { he: 'מעבורת חינמית שיוצאת מקצה מנהטן לסטטן איילנד, כ־25 דקות לכל כיוון. בדרך רואים את פסל החירות, את קו הרקיע של לואר מנהטן ואת הנמל – בלי לשלם שקל.', en: 'A free commuter ferry from the tip of Manhattan to Staten Island, about 25 minutes each way. On the way you see the Statue of Liberty, the Lower Manhattan skyline and the harbour – for nothing.' },
    tip: { he: 'בדרך הלוך עמדו בצד ימין של המעבורת – שם עוברים ליד פסל החירות. בסטטן איילנד פשוט חוזרים במעבורת הבאה.', en: 'On the way out stand on the right-hand side for the closest Statue of Liberty view. On Staten Island just catch the next ferry back.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  // ── Florida ──
  'florida|South Beach & Ocean Drive': {
    about: { he: 'החוף המפורסם של מיאמי ביץ׳, עם חול לבן, מים חמימים ותחנות מצילים צבעוניות. לאורכו אושן דרייב – רחוב של מלונות אר דקו בצבעי פסטל, מסעדות ובתי קפה.', en: 'Miami Beach’s famous strip of white sand and warm water, dotted with colourful lifeguard towers. Behind it runs Ocean Drive, a row of pastel Art Deco hotels, restaurants and cafés.' },
    tip: { he: 'המסעדות שעל אושן דרייב יקרות ותיירותיות – אכלו רחוב אחד פנימה. בלומוס פארק יש שירותים ומקלחות.', en: 'Ocean Drive restaurants are pricey tourist traps – eat a block inland. Lummus Park has restrooms and showers.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'florida|Art Deco Historic District': {
    about: { he: 'מאות בניינים בסגנון אר דקו משנות ה־30 וה־40, בצבעי פסטל, עם קווים מעוגלים ושלטי ניאון. זה הריכוז הגדול בעולם של אדריכלות כזאת, והוא מרוכז ברחובות אושן דרייב, קולינס ווושינגטון.', en: 'Hundreds of 1930s–40s Art Deco buildings in pastel colours, with rounded corners and neon signs – the world’s largest concentration of the style, around Ocean Drive, Collins Avenue and Washington Avenue.' },
    tip: { he: 'בואו גם אחרי החשכה, כשהניאונים דולקים. יש סיור הליכה מודרך של אגודת השימור שמתחיל במרכז המבקרים באושן דרייב.', en: 'Come back after dark when the neon is on. The Miami Design Preservation League runs guided walks from its Ocean Drive welcome centre.' },
    book: 'no',
    ticketIls: { low: 0, high: 130 }
  },
  'florida|Wynwood Walls': {
    about: { he: 'מחסנים ישנים שהפכו לגלריית גרפיטי ענקית תחת כיפת השמיים, עם ציורי קיר של אמנים מכל העולם. מסביב לרובע – עוד עשרות קירות צבועים, גלריות, ברים ומבשלות בירה.', en: 'Old warehouses turned into a huge open-air graffiti gallery with murals by artists from around the world. The streets around it add dozens more painted walls, galleries, bars and breweries.' },
    tip: { he: 'גם בלי להיכנס למתחם הסגור, הרחובות שמסביב מלאים בציורי קיר בחינם. בואו אחר הצהריים ותישארו לערב.', en: 'Even without entering the gated walls, the surrounding streets are full of free murals. Come in the afternoon and stay for the evening.' },
    book: 'no',
    ticketIls: { low: 0, high: 70 }
  },
  'florida|Little Havana (Calle Ocho)': {
    about: { he: 'הלב הקובני של מיאמי: קפה קובני חזק בחלונות קטנים, מגלגלי סיגרים, מוזיקה לטינית ברחוב וקשישים משחקים דומינו בפארק מקסימו גומס. מקום מצוין לארוחה קובנית אותנטית.', en: 'Miami’s Cuban heart: strong cafecito from walk-up windows, cigar rollers, Latin music in the street and old-timers playing dominoes in Máximo Gómez Park. A great place for an authentic Cuban meal.' },
    tip: { he: 'נסו קפה קובני וקרוקטות במסעדת ורסאי המפורסמת. ביום שישי האחרון בחודש יש ברחוב פסטיבל ערב עם מוזיקה.', en: 'Try a cafecito and croquetas at the famous Versailles. On the last Friday of the month, Viernes Culturales brings music to the street.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'florida|Vizcaya Museum & Gardens': {
    about: { he: 'וילה בסגנון רנסנס איטלקי שבנה תעשיין עשיר בתחילת המאה ה־20 על שפת המפרץ, עם חדרים מרוהטים בעתיקות וגנים רשמיים עם מזרקות, פסלים ומבוך גדרות חיות.', en: 'An Italian Renaissance-style villa built on Biscayne Bay by an industrialist in the early 1900s, with antique-filled rooms and formal gardens of fountains, statues and hedge mazes.' },
    tip: { he: 'בואו בבוקר, לפני החום והקבוצות. הגנים יפים במיוחד בצד המפרץ, ליד ספינת האבן.', en: 'Come in the morning before the heat and the groups. The gardens are loveliest on the bay side, by the stone barge.' },
    book: 'recommended',
    ticketIls: { low: 85, high: 100 },
    hours: { he: 'סגור בימי שלישי', en: 'Closed Tuesdays' }
  },
  'florida|Key Biscayne — Bill Baggs Cape Florida State Park': {
    about: { he: 'שמורת חוף בקצה האי קי ביסקיין, עם חוף רחב ושקט, מים צלולים, שבילי אופניים ומגדלור היסטורי מ־1825 שאפשר לטפס עליו בחלק מהימים. רגוע הרבה יותר מסאות׳ ביץ׳.', en: 'A beach park at the tip of Key Biscayne, with a wide quiet beach, clear water, bike paths and an 1825 lighthouse that’s open for climbs on some days. Far calmer than South Beach.' },
    tip: { he: 'התשלום הוא לפי רכב, אז כדאי להגיע ברכב מלא. מסעדת Boater’s Grill שליד המעגן מגישה פירות ים טובים.', en: 'Entry is charged per car, so come with a full one. Boater’s Grill by the marina serves good seafood.' },
    book: 'no',
    ticketIls: { low: 10, high: 35 }
  },
  'florida|Zoo Miami': {
    about: { he: 'גן חיות גדול ופתוח בדרום מיאמי, שבו החיות מחולקות לאזורים לפי יבשות ומוצגות בלי כלובים, מאחורי תעלות. יש ג׳ירפות שאפשר להאכיל, פילים, טיגריסים ואזור פלורידה עם תנינים.', en: 'A big open-plan zoo in south Miami where animals are grouped by continent and shown in moated, cage-free habitats. Feed the giraffes, see elephants and tigers, and visit the Florida exhibit with alligators.' },
    tip: { he: 'הגן רחב מאוד וחם – שכרו אופניים או רכב פדלים (Safari Cycle) והגיעו עם הפתיחה, כשהחיות פעילות.', en: 'It’s very spread out and hot – rent a bike or a Safari Cycle and arrive at opening, when the animals are active.' },
    book: 'no',
    ticketIls: { low: 95, high: 130 }
  },
  'florida|Sawgrass Mills outlets': {
    about: { he: 'אחד מקניוני האאוטלט הגדולים בארה״ב, ליד פורט לודרדייל, עם יותר מ־350 חנויות של מותגים במחירים מוזלים – ביגוד, נעליים, מוצרי ספורט ואופנת יוקרה באגף The Colonnade.', en: 'One of the largest outlet malls in the US, near Fort Lauderdale, with 350+ discounted brand stores – clothing, shoes, sportswear and luxury labels in the Colonnade wing.' },
    tip: { he: 'בקשו במרכז המידע חוברת קופונים לתיירים (מציגים דרכון). הגיעו בבוקר באמצע השבוע ותכננו יום כמעט מלא.', en: 'Ask at guest services for the tourist coupon book (show your passport). Go on a weekday morning and plan most of a day.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'florida|Magic Kingdom (Walt Disney World)': {
    about: { he: 'הפארק הקלאסי של דיסני: טירת סינדרלה, ״פיטר פן״, ״שודדי הקאריביים״, הרי החלל והמנסיון הרדוף, תהלוכה ביום וזיקוקים בלילה מעל הטירה. הפארק המתאים ביותר למשפחות עם ילדים.', en: 'Disney’s classic park: Cinderella Castle, Peter Pan’s Flight, Pirates of the Caribbean, Space Mountain and the Haunted Mansion, with a daytime parade and fireworks over the castle at night.' },
    tip: { he: 'הגיעו חצי שעה לפני הפתיחה ורוצו למתקנים הפופולריים. שקלו לקנות Lightning Lane כדי לדלג על התורים הארוכים.', en: 'Arrive 30 minutes before opening and head for the headliners first. Consider Lightning Lane to skip the longest queues.' },
    book: 'recommended',
    ticketIls: { low: 450, high: 750 }
  },
  'florida|EPCOT (Walt Disney World)': {
    about: { he: 'פארק של דיסני שמשלב טכנולוגיה ומתקנים עם ״מסע סביב העולם״: 11 ביתנים של מדינות סביב אגם, עם אוכל ואדריכלות מקומיים. מתקנים בולטים: ״שומרי הגלקסיה״, ״פרוזן״ ו״רטטוי״.', en: 'A Disney park mixing technology and rides with a “trip around the world”: 11 country pavilions around a lagoon, each with local food and architecture. Top rides include Guardians of the Galaxy, Frozen and Remy’s Ratatouille.' },
    tip: { he: 'מתקן ״שומרי הגלקסיה״ עובד בתור וירטואלי – הירשמו באפליקציה בדיוק בשעה 7:00. בערב אכלו בביתנים במקום בפוד־קורט.', en: 'Guardians of the Galaxy uses a virtual queue – join in the app at exactly 7am. In the evening eat at the country pavilions.' },
    book: 'recommended',
    ticketIls: { low: 430, high: 720 }
  },
  'florida|Universal Orlando Resort': {
    about: { he: 'מתחם של פארקי שעשועים: יוניברסל סטודיוס, איילנדס אוף אדוונצ׳ר והפארק החדש אפיק יוניברס. הכוכב הוא עולם הארי פוטר – הוגסמידס, סמטת דיאגון ורכבת ההוגוורטס אקספרס שמחברת ביניהם.', en: 'A resort of theme parks: Universal Studios, Islands of Adventure and the new Epic Universe. The star is the Wizarding World of Harry Potter – Hogsmeade, Diagon Alley and the Hogwarts Express that links them.' },
    tip: { he: 'כדי לנסוע ברכבת ההוגוורטס צריך כרטיס Park-to-Park. אקספרס פס חוסך שעות בעונות העמוסות.', en: 'To ride the Hogwarts Express you need a Park-to-Park ticket. An Express Pass saves hours in busy seasons.' },
    book: 'recommended',
    ticketIls: { low: 450, high: 900 }
  },
  'florida|Volcano Bay water park': {
    about: { he: 'פארק המים של יוניברסל, בנוי סביב הר געש מלאכותי בגובה 60 מטר בעיצוב פולינזי. יש מגלשות עם נפילה חופשית, נהר עצל, בריכת גלים וחופים לשכיבה.', en: 'Universal’s water park, built around a 200-foot Polynesian-style volcano, with drop-door slides, a lazy river, a wave pool and sandy lounging areas.' },
    tip: { he: 'בפארק משתמשים בצמיד TapuTapu לתור וירטואלי – כך לא עומדים בתור. בקיץ הגיעו בפתיחה, הוא מתמלא מהר.', en: 'The TapuTapu wristband holds your place in virtual queues, so no standing in line. In summer arrive at opening – it fills fast.' },
    book: 'recommended',
    ticketIls: { low: 280, high: 380 }
  },
  // ── Los Angeles ──
  'los-angeles|Griffith Observatory': {
    about: { he: 'מצפה כוכבים בסגנון אר דקו על צלע הר מעל לוס אנג׳לס, עם תצוגות חינמיות על החלל, טלסקופים ופלנטריום. מהמרפסות יש נוף פנורמי לעיר ולשלט הוליווד.', en: 'An Art Deco observatory on a hillside above LA, with free space exhibits, public telescopes and a planetarium. Its terraces give panoramic views of the city and the Hollywood Sign.' },
    tip: { he: 'בואו לשקיעה ותישארו לטלסקופים בערב. החניה בהר יקרה ומלאה – אפשר להגיע באוטובוס DASH Observatory.', en: 'Come for sunset and stay for the evening telescopes. Parking up top is pricey and full – the DASH Observatory bus is easier.' },
    book: 'no',
    ticketIls: { low: 0, high: 40 },
    hours: { he: 'סגור בימי שני', en: 'Closed Mondays' }
  },
  'los-angeles|Hollywood Walk of Fame & TCL Chinese Theatre': {
    about: { he: 'מדרכה בשדרות הוליווד עם יותר מ־2,700 כוכבים על שם אנשי בידור, ולידה תיאטרון TCL הסיני – שבחצרו טביעות ידיים ורגליים של כוכבי קולנוע בבטון.', en: 'A Hollywood Boulevard sidewalk set with 2,700+ stars for entertainers, beside the TCL Chinese Theatre, whose forecourt holds film stars’ hand and footprints in cement.' },
    tip: { he: 'מספיקה שעה. אל תשלמו לדמויות המחופשות על תמונות אם לא סיכמתם מחיר מראש.', en: 'An hour is plenty. Don’t pay costumed characters for photos unless you agree a price first.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'los-angeles|Universal Studios Hollywood': {
    about: { he: 'פארק שעשועים ואולפן קולנוע פעיל. בסיור האולפנים ברכבת עוברים בין תפאורות אמיתיות, ובפארק יש את עולם הארי פוטר, סופר נינטנדו וורלד, ״רובוטריקים״ ו״פארק היורה״.', en: 'A theme park and working film studio. The tram Studio Tour passes real sets, and the park adds Harry Potter, Super Nintendo World, Transformers and Jurassic World rides.' },
    tip: { he: 'עשו את סיור האולפנים מוקדם, לפני שהתור מתארך. לסופר נינטנדו וורלד לכו מיד בפתיחה.', en: 'Do the Studio Tour early before lines build. Head to Super Nintendo World right at opening.' },
    book: 'recommended',
    ticketIls: { low: 400, high: 700 }
  },
  'los-angeles|Disneyland Resort': {
    about: { he: 'דיסנילנד המקורי מ־1955 באנהיים, עם שני פארקים: דיסנילנד הקלאסי עם טירת היפהפייה הנרדמת, וקליפורניה אדוונצ׳ר עם ״קארס לנד״ ו״מארוול״. חוויה משפחתית מלאה ליום או יומיים.', en: 'The original 1955 Disneyland in Anaheim, with two parks: classic Disneyland with Sleeping Beauty Castle, and California Adventure with Cars Land and the Avengers Campus.' },
    tip: { he: 'הכרטיסים מתומחרים לפי תאריך – ימי חול מחוץ לחגים זולים יותר. אפליקציית דיסני מראה זמני המתנה בזמן אמת.', en: 'Tickets are priced by date – non-holiday weekdays are cheaper. The Disneyland app shows live wait times.' },
    book: 'recommended',
    ticketIls: { low: 400, high: 780 }
  },
  'los-angeles|Warner Bros. Studio Tour Hollywood': {
    about: { he: 'סיור ברכב פתוח באולפן פעיל בבורבנק: מגרשי צילום אחוריים, במות סאונד, תפאורת בית הקפה של ״חברים״ ותערוכות של הארי פוטר ובאטמן. מסתיים באזור שבו מצטלמים על הספה של ״חברים״.', en: 'A cart tour of a working studio in Burbank: backlot streets, sound stages, the Friends Central Perk set and Harry Potter and Batman exhibits, ending where you can sit on the Friends couch.' },
    tip: { he: 'מתאים למעריצי סדרות וסרטים יותר מאשר לילדים קטנים. בחרו את הסיור הראשון של הבוקר.', en: 'Better for TV and film fans than young kids. Pick the first tour of the morning.' },
    book: 'recommended',
    ticketIls: { low: 250, high: 320 }
  },
  'los-angeles|The Getty Center': {
    about: { he: 'מוזיאון אמנות על גבעה בברנטווד, שאליו עולים ברכבל קטן. יש ציורים של ון גוך (״איריסים״), מונה ורמברנדט, אדריכלות לבנה מרשימה, גנים וחלונות עם נוף עד האוקיינוס.', en: 'A hilltop art museum in Brentwood reached by a little tram. Inside: Van Gogh’s Irises, Monet and Rembrandt; outside, striking white architecture, gardens and views to the ocean.' },
    tip: { he: 'הכניסה חינם, משלמים רק על חניה – אז באוטובוס זה ממש חינם. הגן המרכזי יפה במיוחד אחר הצהריים.', en: 'Entry is free – you only pay for parking, so by bus it really is free. The Central Garden is loveliest in the afternoon.' },
    book: 'recommended',
    ticketIls: { low: 0, high: 0 },
    hours: { he: 'סגור בימי שני', en: 'Closed Mondays' }
  },
  'los-angeles|The Broad': {
    about: { he: 'מוזיאון לאמנות עכשווית במרכז העיר, בבניין לבן דמוי כוורת. יש בו יצירות של וורהול, ליכטנשטיין, בסקיאה וג׳ף קונס, ואת חדר ״המראות האינסופיות״ של יאיוי קוסאמה.', en: 'A contemporary art museum downtown in a white honeycomb-like building, with Warhol, Lichtenstein, Basquiat and Jeff Koons, plus Yayoi Kusama’s Infinity Mirror Room.' },
    tip: { he: 'הכניסה חינם אבל צריך להזמין שעה באתר. לחדר המראות נרשמים בנפרד מיד כשנכנסים – התור מתמלא.', en: 'Entry is free but needs a timed reservation. Sign up for the Infinity Room as soon as you enter – it fills up.' },
    book: 'recommended',
    ticketIls: { low: 0, high: 0 },
    hours: { he: 'סגור בימי שני', en: 'Closed Mondays' }
  },
  'los-angeles|Santa Monica Pier & beach': {
    about: { he: 'מזח עץ היסטורי עם גלגל ענק, רכבת הרים קטנה ודוכנים, וסוף כביש 66 המפורסם. משני צדדיו חוף רחב, ומשם אפשר לרכוב על שביל האופניים עד ונציה ביץ׳.', en: 'A historic wooden pier with a Ferris wheel, a small coaster and stalls, plus the end of Route 66. Wide beaches on both sides, and a bike path south to Venice Beach.' },
    tip: { he: 'שכרו אופניים ליד המזח ורכבו דרומה לוונציה. לקראת השקיעה המזח הכי יפה, וגם הכי עמוס.', en: 'Rent bikes near the pier and ride south to Venice. The pier is prettiest – and busiest – toward sunset.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'los-angeles|Venice Beach boardwalk & canals': {
    about: { he: 'טיילת חוף צבעונית עם אמני רחוב, סקייטפארק, מגרש הכושר Muscle Beach ודוכנים. כמה רחובות פנימה מסתתרות תעלות ונציה – שכונה שקטה של בתים יפים וגשרים קטנים.', en: 'A colourful boardwalk of street performers, a skatepark, Muscle Beach and stalls. A few blocks inland hide the Venice Canals, a quiet neighbourhood of pretty homes and little bridges.' },
    tip: { he: 'אחרי הטיילת קפצו לרחוב אבוט קיני – בתי קפה וחנויות טובים יותר. בתעלות שווה ללכת בשעות אחר הצהריים.', en: 'After the boardwalk head to Abbot Kinney Blvd for better cafés and shops. Walk the canals in the late afternoon.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'los-angeles|Malibu — El Matador State Beach': {
    about: { he: 'חוף קטן ופראי במאליבו, עם צוקים, סלעי ענק בתוך המים ומערות ים. יורדים אליו בשביל ובמדרגות תלולים, והוא אחד המקומות היפים ביותר בקליפורניה לשקיעה.', en: 'A small wild Malibu cove with cliffs, sea stacks and sea caves, reached by a steep trail and stairs – one of California’s most beautiful sunset spots.' },
    tip: { he: 'בדקו טבלת גאות – בשפל אפשר ללכת בין הסלעים. החניה קטנה ובתשלום; אין שירותים במקום.', en: 'Check the tides – at low tide you can walk between the rocks. The paid lot is small and there are no restrooms.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'los-angeles|Rodeo Drive': {
    about: { he: 'רחוב היוקרה של בוורלי הילס, עם חנויות של שאנל, גוצ׳י, לואי ויטון ואחרות, ובקצהו מדרגות Two Rodeo המרוצפות ומלון בוורלי וילשייר מ״אישה יפה״.', en: 'Beverly Hills’ luxury street of Chanel, Gucci, Louis Vuitton and more, ending at the cobbled Two Rodeo steps and the Beverly Wilshire, the Pretty Woman hotel.' },
    tip: { he: 'מספיקה הליכה של שעה. אפשר לחנות שעתיים חינם בחניונים העירוניים של בוורלי הילס.', en: 'An hour’s stroll is enough. Beverly Hills city garages offer free parking for the first couple of hours.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'los-angeles|Grand Central Market': {
    about: { he: 'שוק אוכל מקורה מ־1917 במרכז העיר, עם עשרות דוכנים: טאקו מקסיקני, ראמן, פסטרמה, בורגרים וקפה. מקום תוסס לארוחת צהריים זולה ומגוונת.', en: 'A covered 1917 food market downtown with dozens of stalls – tacos, ramen, pastrami, burgers and coffee. A lively spot for a cheap, varied lunch.' },
    tip: { he: 'מול השוק יש את Angels Flight – רכבל קטנטן והיסטורי שעולה לבאנקר היל. בשעות הצהריים העמוסות, בואו מוקדם.', en: 'Opposite sits Angels Flight, a tiny historic funicular up to Bunker Hill. Come early to beat the lunch rush.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'los-angeles|Hollywood Sign view from Lake Hollywood Park': {
    about: { he: 'פארק שכונתי קטן בגבעות הוליווד, עם אחד מקווי הראייה הקרובים והנקיים ביותר לשלט הוליווד. מקום מעולה לתמונה בלי טיפוס.', en: 'A small neighbourhood park in the Hollywood Hills with one of the closest, cleanest views of the Hollywood Sign – a great photo with no hike.' },
    tip: { he: 'הגיעו בבוקר, כשהאור על השלט. זה אזור מגורים – חנו רק במקומות המותרים ושמרו על שקט.', en: 'Come in the morning when the light is on the sign. It’s residential – park legally and keep it quiet.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  // ── Las Vegas ──
  'las-vegas|The Strip at night': {
    about: { he: 'שדרת לאס וגאס בולוורד, כ־6.5 ק״מ של בתי מלון־קזינו ענקיים, כל אחד עולם בפני עצמו: ונציה עם גונדולות, פריז עם מגדל אייפל, ניו יורק ועוד. בלילה הכול מואר וזו חוויה בפני עצמה.', en: 'Las Vegas Boulevard: about four miles of mega casino-resorts, each a world of its own – Venice with gondolas, Paris with an Eiffel Tower, New York and more. At night it all lights up.' },
    tip: { he: 'המרחקים גדולים מכפי שנראה – נעליים נוחות ובקבוק מים. מעבר בין המלונות דרך הגשרים להולכי רגל.', en: 'Distances are bigger than they look – wear comfy shoes and carry water. Cross between hotels using the pedestrian bridges.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'las-vegas|Fountains of Bellagio': {
    about: { he: 'מופע מזרקות ענק באגם שמול מלון בלאג׳יו, שבו מאות סילוני מים ״רוקדים״ למוזיקה ולאורות. כל מופע נמשך כמה דקות, והוא חינמי לגמרי.', en: 'A huge fountain show on the lake in front of the Bellagio, with hundreds of water jets “dancing” to music and lights. Each show lasts a few minutes and is completely free.' },
    tip: { he: 'בערב המופעים תכופים יותר. היכנסו גם לחממה (Conservatory) של הבלאג׳יו – תצוגת פרחים עונתית בחינם.', en: 'Shows run more often in the evening. Also step into the Bellagio Conservatory – a free seasonal flower display.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'las-vegas|A Cirque du Soleil show': {
    about: { he: 'מופעי האקרובטיקה של סירק דו סוליי הם סמל של וגאס, עם כמה מופעים קבועים באולמות שנבנו במיוחד. ״O״ בבלאג׳יו מתרחש סביב בריכת מים ענקית, ו״מיסטר״ הוא הוותיק והמשפחתי.', en: 'Cirque du Soleil’s acrobatic shows are a Vegas icon, with several resident productions in purpose-built theatres. “O” at the Bellagio is staged around a giant pool; Mystère is the long-running family favourite.' },
    tip: { he: 'מושבים במרכז האולם, לא בשורות הראשונות, נותנים את המבט הטוב ביותר. השוו מחירים באתר הרשמי.', en: 'Mid-house seats, not the front rows, give the best view. Compare prices on the official site.' },
    book: 'recommended',
    ticketIls: { low: 250, high: 750 }
  },
  'las-vegas|A show at Sphere': {
    about: { he: 'אולם בצורת כדור ענק עם מסך LED פנימי שעוטף את הקהל ומערכת סאונד ייחודית. מוקרנים בו סרטים כמו ״Postcard from Earth״ ומופעי ענק של אמנים, ומבחוץ הכדור עצמו הוא מסך מואר.', en: 'A giant spherical venue whose wraparound interior LED screen and unique sound system envelop the audience. It hosts immersive films like Postcard from Earth and big concerts; outside, the sphere itself is a glowing screen.' },
    tip: { he: 'גם בלי מופע, צפו בכדור המואר מבחוץ בלילה. בפנים, מושבים גבוהים במרכז נותנים את התמונה המלאה.', en: 'Even without a show, watch the lit-up exterior at night. Inside, higher centre seats give the full picture.' },
    book: 'required',
    ticketIls: { low: 370, high: 1100 }
  },
  'las-vegas|High Roller observation wheel': {
    about: { he: 'גלגל ענק בגובה כ־170 מטר בקצה מתחם LINQ. סיבוב שלם נמשך כחצי שעה בקבינה גדולה ושקופה, עם נוף על הסטריפ והמדבר.', en: 'A roughly 550-foot observation wheel at the LINQ. One full rotation takes about 30 minutes in a large glass cabin, with views over the Strip and the desert.' },
    tip: { he: 'הסיבוב בשעת השקיעה הוא הכי יפה, כשהאורות נדלקים. כרטיס יום זול יותר מכרטיס לילה.', en: 'The sunset ride is the most beautiful, as the lights come on. Daytime tickets are cheaper than night ones.' },
    book: 'no',
    ticketIls: { low: 90, high: 180 }
  },
  'las-vegas|Fremont Street Experience': {
    about: { he: 'הרחוב הוותיק של וגאס במרכז העיר, מקורה בגג מסכי LED ענק שמציג מופעי אור וקול בערב. יש בו קזינו ותיקים, להקות על במות ואומגה שעוברת מתחת לגג.', en: 'Old Vegas downtown, a pedestrian street under a giant LED canopy that runs light-and-sound shows in the evening, with vintage casinos, live bands and a zipline under the roof.' },
    tip: { he: 'בואו אחרי החשכה – המופעים על הגג פועלים רק בערב. האווירה רועשת ומבוגרת יותר מהסטריפ.', en: 'Come after dark – the canopy shows only run in the evening. The vibe is louder and more adult than the Strip.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'las-vegas|The Neon Museum': {
    about: { he: '״בית הקברות של הניאון״: מגרש מלא בשלטי ענק היסטוריים של קזינו ומלונות שנסגרו, חלקם משוחזרים ומאירים. מספר את סיפור וגאס דרך השלטים שלה.', en: 'The “Neon Boneyard”: a lot full of giant historic signs from demolished casinos and motels, some restored and lit. It tells the story of Vegas through its signs.' },
    tip: { he: 'הזמינו סיור אחרי השקיעה, כשהשלטים המשוחזרים דולקים. השעות נגמרות מהר.', en: 'Book an after-dark tour, when restored signs are lit. Slots go fast.' },
    book: 'recommended',
    ticketIls: { low: 90, high: 130 }
  },
  'las-vegas|The Mob Museum': {
    about: { he: 'מוזיאון על הפשע המאורגן בארה״ב והמאבק בו, בבית המשפט הפדרלי ההיסטורי. רואים את הקיר מטבח יום ולנטיין, מוצגים אינטראקטיביים ובר מוסתר מתקופת היובש במרתף.', en: 'A museum of organised crime and the fight against it, in a historic federal courthouse. See the St. Valentine’s Day Massacre wall, interactive exhibits and a Prohibition-style speakeasy in the basement.' },
    tip: { he: 'הקדישו שעתיים לפחות. הבר במרתף פתוח גם בלי כרטיס למוזיאון.', en: 'Allow at least two hours. The basement speakeasy is open even without a museum ticket.' },
    book: 'recommended',
    ticketIls: { low: 130, high: 170 }
  },
  'las-vegas|The Forum Shops at Caesars': {
    about: { he: 'קניון יוקרה בתוך סיזרס פאלאס, מעוצב כרחוב רומי עתיק עם מזרקות, פסלים ותקרה מצוירת כשמיים שמשנים צבע במהלך היום. כיף לטייל בו גם בלי לקנות.', en: 'An upscale mall inside Caesars Palace, designed as an ancient Roman street with fountains, statues and a painted-sky ceiling that changes with the time of day – fun to wander even without shopping.' },
    tip: { he: 'המדרגות הנעות הספירליות בכניסה הן חוויה בפני עצמה. הקניון ממוזג – מקום טוב לברוח מהחום.', en: 'The spiral escalators at the entrance are an attraction in themselves. It’s air-conditioned – a good escape from the heat.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'las-vegas|Welcome to Fabulous Las Vegas sign': {
    about: { he: 'השלט האייקוני מ־1959 בקצה הדרומי של הסטריפ, שבו מצטלמים כמעט כל המבקרים בעיר. יש חניון קטן ממש לידו.', en: 'The iconic 1959 sign at the south end of the Strip, where nearly every visitor stops for a photo. There’s a small parking lot right beside it.' },
    tip: { he: 'בבוקר מוקדם התור לתמונה קצר. בדרך ממנו לשדה התעופה או אליו קל לשלב עצירה קצרה.', en: 'Early morning means a short photo line. It’s an easy stop on the way to or from the airport.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'las-vegas|Red Rock Canyon National Conservation Area': {
    about: { he: 'קניון של סלעי חול אדומים וצהובים במרחק כ־30 דקות נסיעה מהסטריפ. נוסעים בכביש נוף חד־סטרי של כ־21 ק״מ ועוצרים לטיולים קצרים ולטיפוס קל על סלעים.', en: 'A canyon of red and cream sandstone about 30 minutes from the Strip. Drive the 13-mile one-way scenic loop and stop for short hikes and easy rock scrambling.' },
    tip: { he: 'בחלק גדול מהשנה צריך להזמין מראש משבצת כניסה לכביש הנוף. בקיץ בואו בבוקר מוקדם עם הרבה מים.', en: 'For much of the year the scenic drive needs a timed-entry reservation. In summer come early with plenty of water.' },
    book: 'recommended',
    ticketIls: { low: 0, high: 40 }
  },
  'las-vegas|Seven Magic Mountains': {
    about: { he: 'מיצב אמנות במדבר דרומית לווגאס: שבעה מגדלים של סלעי ענק צבועים בצבעים זרחניים, בגובה של כ־10 מטרים. ניגוד מצחיק ומצולם במיוחד לנוף המדבר.', en: 'A desert art installation south of Vegas: seven towers of huge boulders painted in neon colours, around 30 feet tall – a striking, very photogenic contrast with the desert.' },
    tip: { he: 'זה כ־30 דקות נסיעה מהסטריפ ועצירה של חצי שעה. בואו בבוקר או לפני השקיעה – בצהריים אין צל בכלל.', en: 'About 30 minutes from the Strip for a half-hour stop. Come in the morning or before sunset – there’s no shade at midday.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  // ── Cancún & Riviera Maya ──
  'cancun|Playa Delfines': {
    about: { he: 'החוף הציבורי היפה ביותר באזור המלונות של קנקון, עם חול לבן, מים בטורקיז ונוף פתוח בלי מלונות צמודים. מעליו התצפית ״אל מיראדור״ עם שלט קנקון הצבעוני.', en: 'The prettiest public beach in Cancún’s Hotel Zone, with white sand, turquoise water and an open view free of hotels, overlooked by the El Mirador viewpoint and its colourful Cancún sign.' },
    tip: { he: 'הגלים כאן חזקים – שימו לב לדגלים ושחו ליד המציל. אין צל, הביאו שמשייה.', en: 'The surf here is strong – watch the flags and swim near the lifeguard. There’s no shade, so bring an umbrella.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'cancun|MUSA Underwater Museum of Art': {
    about: { he: 'מוזיאון תת־ימי עם כ־500 פסלים בגודל אדם, שהוצבו על קרקעית הים ומשמשים בסיס לשונית אלמוגים. רואים אותם בשנורקל, בצלילה או מסירה עם רצפת זכוכית.', en: 'An underwater museum of about 500 life-size sculptures placed on the seabed as an artificial reef. See them by snorkelling, diving or from a glass-bottom boat.' },
    tip: { he: 'לאתר העמוק יותר צריך צלילה; בשנורקל רואים את האתר הרדוד במנצ׳ונס. השתמשו רק בקרם הגנה ידידותי לשונית.', en: 'The deeper site needs scuba; snorkellers see the shallow Manchones site. Use reef-safe sunscreen only.' },
    book: 'recommended',
    ticketIls: { low: 180, high: 450 }
  },
  'cancun|Mercado 28': {
    about: { he: 'שוק מזכרות ותיק במרכז העיר קנקון, עם מבוך של דוכנים: כלי קרמיקה, שמיכות, מסכות, תכשיטי כסף וטקילה. במרכזו מסעדות מקומיות זולות.', en: 'A long-running souvenir market in downtown Cancún, a maze of stalls selling pottery, blankets, masks, silver jewellery and tequila, with cheap local restaurants in the middle.' },
    tip: { he: 'מתמקחים – המחיר הראשון גבוה בהרבה. משלמים בפסו מקסיקני כדי לקבל מחיר טוב יותר מבדולרים.', en: 'Haggle – the first price is well inflated. Pay in pesos for a better deal than in dollars.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'cancun|Quinta Avenida, Playa del Carmen': {
    about: { he: 'מדרחוב ארוך במקביל לחוף בפלאיה דל כרמן, עם מסעדות, ברים, חנויות ובתי קפה, ורחובות קטנים שיורדים אל הים. ממנו יוצאת גם המעבורת לקוזומל.', en: 'A long pedestrian street parallel to the beach in Playa del Carmen, lined with restaurants, bars, shops and cafés, with side streets running down to the sea. The Cozumel ferry leaves from here.' },
    tip: { he: 'החלק הצפוני של הרחוב (אחרי רחוב 20) נעים ופחות תיירותי. בערב האווירה בשיאה.', en: 'The northern stretch (past Calle 20) is more relaxed and less touristy. Evenings are when it buzzes.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'cancun|Xcaret Park': {
    about: { he: 'פארק אקולוגי ענק ליד פלאיה דל כרמן: נהרות תת־קרקעיים לשחייה, אקווריום, בעלי חיים, כפר מאיה ושחזורים, ובערב מופע ענק על ההיסטוריה והתרבות של מקסיקו.', en: 'A huge eco-park near Playa del Carmen: underground rivers to swim, an aquarium, wildlife, a Mayan village and, in the evening, a big show on Mexico’s history and culture.' },
    tip: { he: 'תכננו יום מלא ואל תפספסו את מופע הערב. מותר רק קרם הגנה ללא כימיקלים – אפשר לקבל בכניסה.', en: 'Plan a full day and don’t miss the evening show. Only chemical-free sunscreen is allowed – they hand it out at the gate.' },
    book: 'recommended',
    ticketIls: { low: 450, high: 700 }
  },
  'cancun|Xel-Há Park': {
    about: { he: 'פארק מים טבעי בלגונה שבה נהר מתוק פוגש את הים, עם שנורקל בין דגים צבעוניים, ציפה על נהר, קפיצות מצוק ואומגות. הכרטיס כולל אוכל ושתייה ללא הגבלה.', en: 'A natural water park in an inlet where a river meets the sea: snorkel among colourful fish, float down the river, jump off rocks and zipline. Tickets include unlimited food and drinks.' },
    tip: { he: 'ציוד השנורקל כלול – אין צורך להביא. שחו בבוקר, כשהמים צלולים והדגים רבים.', en: 'Snorkel gear is included – no need to bring yours. Swim in the morning when the water is clearest.' },
    book: 'recommended',
    ticketIls: { low: 380, high: 550 }
  },
  'cancun|Akumal — swimming with sea turtles': {
    about: { he: 'מפרץ רדוד ושקט שבו צבי ים ירוקים רועים בעשב הים קרוב לחוף. שוחים איתם בשנורקל, במרחק שמירה, ולעיתים רואים גם תמנונים ודגי שמש.', en: 'A calm, shallow bay where green sea turtles graze on seagrass close to shore. You snorkel alongside them at a respectful distance, often spotting rays and colourful fish too.' },
    tip: { he: 'בחלק המוגן חובה לשחות עם מדריך מורשה ואפוד הצלה. בואו בבוקר, לפני שהאוטובוסים מגיעים.', en: 'In the protected area a licensed guide and life vest are mandatory. Come early, before the tour buses.' },
    book: 'no',
    ticketIls: { low: 60, high: 180 }
  },
  'cancun|Tulum archaeological site': {
    about: { he: 'עיר מאיה מוקפת חומה על צוק מעל הים הקריבי – אחד האתרים הארכאולוגיים המצולמים בעולם. המבנה הבולט הוא ״אל קסטיו״, ומתחת לצוק יש חוף קטן לשחייה.', en: 'A walled Mayan city on a cliff above the Caribbean – one of the most photographed ruins anywhere. The standout is El Castillo, and there’s a small swimming beach below the cliff.' },
    tip: { he: 'הגיעו לפתיחה בבוקר – אחר כך חם מאוד ועמוס. הביאו בגד ים, יש ירידה לחוף מתוך האתר.', en: 'Arrive at opening – it gets very hot and crowded later. Bring a swimsuit; there’s beach access inside the site.' },
    book: 'no',
    ticketIls: { low: 40, high: 150 }
  },
  'cancun|Gran Cenote': {
    about: { he: 'בולען טבעי מלא מים מתוקים וצלולים ליד טולום, עם מערות, נטיפים, צבים קטנים ודגים. שוחים או צוללים בשנורקל בין המערה הפתוחה למעברים מוצלים.', en: 'A natural sinkhole of clear fresh water near Tulum, with caves, stalactites, small turtles and fish. Swim or snorkel between the open pool and shaded passages.' },
    tip: { he: 'הגיעו לפתיחה כדי לשחות לבד כמעט. חובה להתקלח לפני הכניסה ואסור קרם הגנה.', en: 'Arrive at opening to have it almost to yourself. Showering first is mandatory and sunscreen isn’t allowed.' },
    book: 'no',
    ticketIls: { low: 80, high: 140 }
  },
  'cancun|Cenote Dos Ojos': {
    about: { he: 'שני בולענים מחוברים (״שתי עיניים״) שמובילים לאחת ממערכות המערות התת־ימיות הגדולות בעולם. המים צלולים בצורה מדהימה, ובשנורקל רואים קורות אור שחודרות אל המערה.', en: 'Two linked sinkholes (“two eyes”) that open onto one of the world’s largest underwater cave systems. The water is astonishingly clear, with light beams streaming into the cavern as you snorkel.' },
    tip: { he: 'כדאי לשכור פנס וציוד שנורקל במקום. צוללים מוסמכים יכולים להזמין צלילת מערה מודרכת.', en: 'Rent a torch and snorkel gear on site. Certified divers can book a guided cavern dive.' },
    book: 'no',
    ticketIls: { low: 60, high: 160 }
  },
  'cancun|Cobá ruins': {
    about: { he: 'עיר מאיה עתיקה וגדולה בתוך הג׳ונגל, עם דרכים עתיקות שמחברות בין קבוצות מבנים ופירמידת נוחוך מול הגבוהה באזור. מטיילים בין המבנים ברגל, באופניים או בריקשה.', en: 'A large ancient Mayan city in the jungle, with old causeways linking groups of buildings and Nohoch Mul, the tallest pyramid in the region. Explore on foot, by bike or by pedal-taxi.' },
    tip: { he: 'שכרו אופניים בכניסה – המרחקים גדולים. כיום אסור לטפס על הפירמידה הגדולה.', en: 'Rent a bike at the entrance – the distances are long. Climbing the big pyramid is no longer allowed.' },
    book: 'no',
    ticketIls: { low: 30, high: 90 }
  },
  // ── Costa Rica ──
  'costa-rica|Arenal Volcano National Park': {
    about: { he: 'פארק סביב הר הגעש החרוטי ארנל, שהיה פעיל עד 2010. מטיילים בשבילים בין שדות לבה ישנים ויער גשם, עם תצפיות על ההר ועל אגם ארנל.', en: 'A park around the perfectly conical Arenal volcano, active until 2010. Trails cross old lava fields and rainforest, with views of the cone and Lake Arenal.' },
    tip: { he: 'הפסגה בדרך כלל בעננים – הסיכוי הטוב ביותר לראות אותה הוא מוקדם בבוקר. אסור לטפס על ההר עצמו.', en: 'The summit is usually in cloud – your best chance to see it is early morning. Climbing the volcano itself isn’t allowed.' },
    book: 'no',
    ticketIls: { low: 55, high: 75 }
  },
  'costa-rica|Hot springs in La Fortuna': {
    about: { he: 'מעיינות חמים שמחוממים על ידי הר הגעש, מאתרי ספא מפוארים כמו טבקון – עם נהר חם ומפלים בתוך ג׳ונגל – ועד נקודות חינמיות בנהר שבהן מתיישבים במים החמים.', en: 'Volcano-heated hot springs, from lavish spa resorts like Tabacón, with a warm river and waterfalls in the jungle, to free spots in the river where you simply sit in the warm water.' },
    tip: { he: 'ערב במעיינות אחרי יום טיולים הוא השילוב המושלם. באתרים הגדולים כדאי כרטיס שכולל ארוחת ערב.', en: 'An evening soak after a day of hiking is the perfect combo. At the big resorts, a ticket with dinner is good value.' },
    book: 'recommended',
    ticketIls: { low: 0, high: 400 }
  },
  'costa-rica|La Fortuna Waterfall': {
    about: { he: 'מפל בגובה כ־70 מטר שנופל לבריכה בלב יער טרופי. יורדים אליו בכ־500 מדרגות ואפשר לשחות בבריכה הקרירה שבתחתיתו.', en: 'A roughly 70-metre waterfall dropping into a pool in tropical forest. Around 500 steps lead down, and you can swim in the cool water below.' },
    tip: { he: 'העלייה חזרה מתישה – קחו זמן ומים. אל תשחו ממש מתחת לנפילה, הזרם חזק.', en: 'The climb back up is tiring – take it slow and bring water. Don’t swim right under the falls; the current is strong.' },
    book: 'no',
    ticketIls: { low: 60, high: 75 }
  },
  'costa-rica|Arenal Hanging Bridges': {
    about: { he: 'שביל של כ־3 ק״מ ביער גשם עם גשרים תלויים בגובה צמרות העצים. רואים ציפורים, קופים, עצלנים ופרחים, ומדי פעם את הר הגעש בין העצים.', en: 'A roughly 3 km rainforest trail with hanging bridges at canopy height. Spot birds, monkeys, sloths and flowers, with glimpses of the volcano through the trees.' },
    tip: { he: 'קחו מדריך – בלי משקפת וטלסקופ קשה לזהות את החיות. בבוקר מוקדם יש הכי הרבה פעילות.', en: 'Take a guide – without their scope the wildlife is hard to spot. Early morning is the most active time.' },
    book: 'recommended',
    ticketIls: { low: 100, high: 230 }
  },
  'costa-rica|Monteverde Cloud Forest Reserve': {
    about: { he: 'שמורת יער ענן ברכס ההרים, עם עצים מכוסים טחב, אורכידאות ושבילים בתוך ערפל. זה אחד המקומות הטובים בעולם לראות את הקצאל – ציפור צבעונית ונדירה.', en: 'A mountain cloud forest of moss-draped trees, orchids and misty trails – one of the best places on earth to see the resplendent quetzal.' },
    tip: { he: 'סיור מודרך מוקדם בבוקר מגדיל מאוד את הסיכוי לראות קצאל. הביאו מעיל גשם ושכבה חמה.', en: 'An early guided walk greatly improves your quetzal odds. Bring a rain jacket and a warm layer.' },
    book: 'recommended',
    ticketIls: { low: 90, high: 230 }
  },
  'costa-rica|Ziplining in Monteverde': {
    about: { he: 'מונטוורדה היא בירת האומגות של קוסטה ריקה, עם כבלים ארוכים מעל יער הענן. בחלק מהפארקים יש אומגת ״סופרמן״ שבה טסים בשכיבה, ונדנדת טרזן.', en: 'Monteverde is Costa Rica’s zipline capital, with long cables above the cloud forest. Some parks have a “Superman” line flown face-down and a Tarzan swing.' },
    tip: { he: 'בחרו חברה עם קווים ארוכים ותקן בטיחות ברור. ביום גשום עדיין פועלים – פשוט תרטבו.', en: 'Choose an operator with long lines and clear safety standards. They run in the rain – you just get wet.' },
    book: 'recommended',
    ticketIls: { low: 220, high: 370 }
  },
  'costa-rica|A guided night walk in the forest': {
    about: { he: 'סיור לילה עם פנסים ומדריך מקומי, שבו רואים את החיות הפעילות בחושך: צפרדעים עם עיניים אדומות, טרנטולות, עצלנים, נחשים ולפעמים אופוסומים וקינקאז׳ו.', en: 'A torch-lit walk with a local guide to see the night-shift wildlife: red-eyed tree frogs, tarantulas, sloths, snakes and sometimes opossums or kinkajous.' },
    tip: { he: 'נעליים סגורות ומכנסיים ארוכים. בוחרים קבוצה קטנה – המדריך רואה יותר ומספיק להראות לכולם.', en: 'Wear closed shoes and long trousers. Pick a small group – the guide spots more and can show everyone.' },
    book: 'recommended',
    ticketIls: { low: 90, high: 150 }
  },
  'costa-rica|Manuel Antonio National Park': {
    about: { he: 'פארק לאומי קטן על חוף האוקיינוס השקט, שבו היער יורד עד חופים לבנים. בשבילים רואים קופים, עצלנים, איגואנות ודביבונים, ואחר כך שוחים במפרצים.', en: 'A small national park on the Pacific where rainforest runs down to white beaches. On the trails you see monkeys, sloths, iguanas and raccoons, then swim in the coves.' },
    tip: { he: 'את הכרטיס קונים מראש באתר הרשמי בלבד. אל תשאירו אוכל פתוח – הקופים חוטפים.', en: 'Tickets must be bought online in advance from the official site. Don’t leave food out – the monkeys snatch it.' },
    book: 'required',
    ticketIls: { low: 65, high: 75 },
    hours: { he: 'סגור בימי שני', en: 'Closed Mondays' }
  },
  'costa-rica|Río Celeste & Tenorio Volcano National Park': {
    about: { he: 'נהר בצבע תכלת חלבי שנוצר במקום שבו שני נחלים עם מינרלים שונים נפגשים. השביל עובר ביער גשם למפל תכלת, לנקודת המפגש ולמעיינות רותחים קטנים.', en: 'A river of milky sky-blue water, created where two streams with different minerals meet. The trail runs through rainforest to a turquoise waterfall, the meeting point and small bubbling springs.' },
    tip: { he: 'אחרי גשם כבד הצבע מתעמעם – בדקו מראש. השביל בוצי, נעלי הליכה טובות הכרחיות. אסור לשחות.', en: 'After heavy rain the colour fades – check ahead. The trail is muddy, so wear good shoes. Swimming isn’t allowed.' },
    book: 'no',
    ticketIls: { low: 45, high: 65 }
  },
  'costa-rica|Whitewater rafting on the Pacuare River': {
    about: { he: 'רפטינג על אחד הנהרות היפים בעולם לרפטינג, עם אשדים בדרגה 3–4 בתוך קניון ירוק ומפלים שנופלים ישר לנהר. טיול יום שכולל הסעה וארוחה.', en: 'Rafting one of the world’s most beautiful rivers, with class III–IV rapids through a green canyon and waterfalls spilling straight into the river. A day trip with transport and lunch.' },
    tip: { he: 'מתאים למי שיודע לשחות ובכושר סביר. יש גם טיול של שני ימים עם לינה בלודג׳ ביער.', en: 'Suited to swimmers in reasonable shape. There’s also a two-day trip with a night in a jungle lodge.' },
    book: 'recommended',
    ticketIls: { low: 370, high: 480 }
  },
  'costa-rica|Tamarindo Beach': {
    about: { he: 'עיירת גלישה תוססת בחוף האוקיינוס השקט, עם חוף ארוך, בתי ספר לגלישה, מסעדות וברים. מהחוף רואים את אחת השקיעות היפות במדינה.', en: 'A lively Pacific surf town with a long beach, surf schools, restaurants and bars, and one of the country’s best sunsets.' },
    tip: { he: 'שיעור גלישה לראשונים מומלץ בגאות נמוכה. בערב צאו לשקיעה עם משקה על החוף.', en: 'Beginner surf lessons work best around low-to-mid tide. At sunset grab a drink on the beach.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'costa-rica|Cahuita National Park': {
    about: { he: 'פארק על החוף הקריבי עם שביל לאורך הים בין ג׳ונגל לחופים, שבו רואים קופים מייללים, עצלנים ונחשים, ושונית אלמוגים שאפשר לשחות בה בשנורקל עם מדריך.', en: 'A Caribbean-coast park with a seaside trail between jungle and beaches – look for howler monkeys, sloths and snakes – and a coral reef you can snorkel with a guide.' },
    tip: { he: 'בכניסה מצד העיירה קאוויטה התשלום הוא תרומה. שנורקל מותר רק עם מדריך מורשה.', en: 'At the Cahuita-town entrance you pay by donation. Snorkelling is only permitted with a licensed guide.' },
    book: 'no',
    ticketIls: { low: 0, high: 60 }
  },
  // ── Peru ──
  'peru|Machu Picchu': {
    about: { he: 'עיר האינקה האגדית מהמאה ה־15, בנויה על אוכף הר מעל עמק נהר אורובמבה. מטיילים בין מקדשים, טרסות ובתי אבן מדויקים, עם הרים תלולים וירוקים מכל צד.', en: 'The legendary 15th-century Inca city on a mountain saddle above the Urubamba valley. Walk among temples, terraces and precisely fitted stone houses, ringed by steep green peaks.' },
    tip: { he: 'מספר הכרטיסים היומי מוגבל ונמכר לפי מסלול ושעה – הזמינו חודשים מראש, יחד עם ההר הואיינה פיצ׳ו. חובה להציג דרכון.', en: 'Daily tickets are capped and sold by circuit and time – book months ahead, along with Huayna Picchu. You must show your passport.' },
    book: 'required',
    ticketIls: { low: 150, high: 260 }
  },
  'peru|Plaza de Armas & Cusco Cathedral': {
    about: { he: 'הכיכר המרכזית של קוסקו, מוקפת קשתות קולוניאליות ושתי כנסיות גדולות. בקתדרלה יש ציור מפורסם של הסעודה האחרונה שבו מוגש על השולחן חזיר ים – המאכל המקומי.', en: 'Cusco’s main square, ringed by colonial arcades and two grand churches. Inside the cathedral is a famous Last Supper painting in which the dish on the table is guinea pig, a local delicacy.' },
    tip: { he: 'בגובה של 3,400 מטר, הקדישו את היום הראשון להליכה איטית. מרפסות בתי הקפה מעל הכיכר מצוינות לתצפית.', en: 'At 3,400 m, keep your first day slow. The café balconies above the square are great for views.' },
    book: 'no',
    ticketIls: { low: 0, high: 50 }
  },
  'peru|Qorikancha': {
    about: { he: 'מקדש השמש של האינקה, שהיה בעבר מצופה זהב, ועליו נבנה מנזר סנטו דומינגו הספרדי. רואים קירות אינקה מושלמים בתוך מבנה קולוניאלי – שתי תרבויות בבניין אחד.', en: 'The Inca Temple of the Sun, once lined with gold, with the Spanish Santo Domingo convent built on top. Flawless Inca walls inside a colonial building – two cultures in one place.' },
    tip: { he: 'מדריך במקום עושה הבדל גדול בהבנת הבנייה. הגן שמתחת למקדש יפה ופתוח בחינם.', en: 'A guide makes a big difference to understanding the masonry. The garden below the temple is pretty and free.' },
    book: 'no',
    ticketIls: { low: 20, high: 35 }
  },
  'peru|Sacsayhuamán': {
    about: { he: 'מתחם אינקה מעל קוסקו, עם חומות זיגזג מאבנים ענקיות – חלקן במשקל עשרות טונות – שמשתלבות זו בזו בלי מלט. מהגבעה יש נוף מצוין על העיר.', en: 'An Inca complex above Cusco with zigzag walls of colossal stones, some weighing dozens of tonnes, fitted together without mortar, plus great views over the city.' },
    tip: { he: 'הכניסה כלולה בכרטיס התיירות של קוסקו (Boleto Turístico) – קנו אותו אם תבקרו גם בעמק הקדוש.', en: 'Entry is part of the Cusco Boleto Turístico – buy it if you’re also visiting the Sacred Valley.' },
    book: 'no',
    ticketIls: { low: 70, high: 150 }
  },
  'peru|San Pedro Market': {
    about: { he: 'השוק המרכזי והצבעוני של קוסקו, עם דוכני מיצי פירות טריים, עשרות סוגי תפוחי אדמה ותירס, גבינות, לחם, צמחי מרפא ומזכרות, ודוכני אוכל מקומי זולים.', en: 'Cusco’s colourful central market: fresh fruit-juice stalls, dozens of potato and corn varieties, cheese, bread, herbal remedies, souvenirs and cheap local food counters.' },
    tip: { he: 'נסו שייק פירות בדוכני המיצים – מגישים בכוס ענקית עם תוספת. שמרו על התיק, יש צפיפות.', en: 'Try a fruit shake from the juice ladies – a huge glass with a free top-up. Keep an eye on your bag in the crush.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'peru|Pisac market & ruins': {
    about: { he: 'כפר בעמק הקדוש עם שוק אומנים צבעוני של אריגים, כובעים וקרמיקה, ומעליו אתר אינקה מרשים – טרסות חקלאיות ענקיות ומקדשים על צלע ההר.', en: 'A Sacred Valley village with a colourful artisan market of textiles, hats and pottery, and above it an impressive Inca site of huge farming terraces and hillside temples.' },
    tip: { he: 'עלו לחורבות במונית ורדו ברגל בשביל לכפר – הנוף נהדר. השוק פעיל כל יום, והגדול ביותר בימי ראשון.', en: 'Take a taxi up to the ruins and hike the trail down to the village – great views. The market runs daily and is biggest on Sundays.' },
    book: 'no',
    ticketIls: { low: 70, high: 150 }
  },
  'peru|Ollantaytambo fortress': {
    about: { he: 'מבצר ומקדש אינקה על צלע הר מעל עיירה שבה עדיין גרים בבתים ותעלות מים מתקופת האינקה. מטפסים במדרגות טרסות ענקיות עד מקדש השמש עם אבני פורפיר מסיביות.', en: 'An Inca fortress-temple on a hillside above a town still living in Inca-era houses and water channels. Climb giant terraces to the Sun Temple and its massive porphyry stones.' },
    tip: { he: 'מכאן יוצאת הרכבת למאצ׳ו פיצ׳ו – שלבו את הביקור עם יום הנסיעה. מהצד השני של העיר יש שביל חינמי לאסמים עתיקים.', en: 'This is where the train to Machu Picchu leaves – combine the visit with your travel day. Across town a free trail climbs to ancient storehouses.' },
    book: 'no',
    ticketIls: { low: 70, high: 150 }
  },
  'peru|Moray & the Maras salt pans': {
    about: { he: 'מוראי: טרסות אינקה עגולות וענקיות, כנראה מעבדה חקלאית עתיקה. מאראס: מאות בריכות מלח לבנות על צלע הר, שמופק בהן מלח כבר מאות שנים.', en: 'Moray: huge circular Inca terraces, probably an ancient agricultural lab. Maras: hundreds of white salt pools on a hillside, harvested for centuries.' },
    tip: { he: 'מוראי כלולה בכרטיס התיירות; מאראס דורשת כרטיס נפרד. קנו מלח ורוד בכניסה לבריכות – מזכרת מצוינת.', en: 'Moray is in the Boleto Turístico; Maras needs its own small ticket. Pink salt from the pans makes a great souvenir.' },
    book: 'no',
    ticketIls: { low: 70, high: 170 }
  },
  'peru|Lima historic centre': {
    about: { he: 'המרכז הקולוניאלי של לימה, עם כיכר מרכזית, קתדרלה, מרפסות עץ מגולפות וארמונות. במנזר סן פרנסיסקו יורדים לקטקומבות עם אלפי עצמות.', en: 'Lima’s colonial heart: the main square, cathedral, carved wooden balconies and palaces. At San Francisco Monastery you descend into catacombs holding thousands of bones.' },
    tip: { he: 'הגיעו בבוקר ובמונית מאפליקציה. סיור הקטקומבות קצר ומודרך, ושווה כל דקה.', en: 'Come in the morning and use an app taxi. The catacombs tour is short and guided – well worth it.' },
    book: 'no',
    ticketIls: { low: 0, high: 40 }
  },
  'peru|Larco Museum': {
    about: { he: 'מוזיאון לאמנות פרה־קולומביאנית באחוזה קולוניאלית לבנה עם גנים פורחים. יש בו קרמיקה, תכשיטי זהב ובדים עתיקים, ומחסן פתוח עם עשרות אלפי כלים.', en: 'A pre-Columbian art museum in a white colonial mansion with flowering gardens, showing ceramics, gold jewellery and ancient textiles, plus open storerooms holding tens of thousands of pots.' },
    tip: { he: 'המסעדה בגן מצוינת לארוחת צהריים. יש גם גלריה של קרמיקה אירוטית – שימו לב אם אתם עם ילדים.', en: 'The garden restaurant is excellent for lunch. There’s an erotic pottery gallery – worth knowing if you’re with kids.' },
    book: 'no',
    ticketIls: { low: 40, high: 50 }
  },
  'peru|Huaca Pucllana': {
    about: { he: 'פירמידה עתיקה מלבני בוץ, בת כ־1,500 שנה, בלב שכונת מירפלורס המודרנית. בסיור מודרך עולים על המבנה ושומעים על התרבות שבנתה אותו.', en: 'A roughly 1,500-year-old adobe pyramid in the middle of modern Miraflores. A guided tour takes you up the structure and explains the culture that built it.' },
    tip: { he: 'הסיור קצר – כשעה. המסעדה שליד הפירמידה מוארת בערב ונותנת נוף מיוחד עליה.', en: 'The tour is short, about an hour. The restaurant beside it overlooks the lit-up pyramid at night.' },
    book: 'no',
    ticketIls: { low: 15, high: 25 },
    hours: { he: 'סגור בימי שלישי', en: 'Closed Tuesdays' }
  },
  'peru|Miraflores Malecón & Parque del Amor': {
    about: { he: 'טיילת ירוקה על הצוקים מעל האוקיינוס השקט, עם פארקים, שבילי אופניים ונוף לגולשים. בפארק האהבה יש פסל ענק של זוג מתנשק וספסלי פסיפס צבעוניים.', en: 'A green clifftop promenade above the Pacific with parks, bike paths and surfer-watching views. In the Parque del Amor a giant kissing-couple statue sits among colourful mosaic benches.' },
    tip: { he: 'בואו לשקיעה. משם אפשר גם לעשות טיסת מצנח רחיפה קצרה מעל המים.', en: 'Come at sunset. You can also take a short tandem paraglide over the water from here.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'peru|Barranco': {
    about: { he: 'שכונה בוהמיינית ליד הים, עם בתי אחוזה צבעוניים, ציורי קיר, גלריות וברים. גשר האנחות העץ הוא הסמל שלה, ויורדים ממנו בשביל עד החוף.', en: 'A bohemian seaside district of colourful mansions, murals, galleries and bars. Its wooden Bridge of Sighs is the symbol, with a path running down to the beach.' },
    tip: { he: 'בואו אחר הצהריים ותישארו לערב – הברים והמסעדות מתעוררים. בקרו גם במוזיאון MATE לצילום.', en: 'Come in the afternoon and stay into the evening when bars come alive. The MATE photography museum is worth a stop.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  // ── Buenos Aires ──
  'buenos-aires|Recoleta Cemetery': {
    about: { he: 'בית קברות מפואר מ־1822 שנראה כמו עיר קטנה של מאוזוליאומים משיש, עם פסלים, כיפות וויטראז׳ים. כאן קבורים נשיאים, סופרים ואווה פרון, בקבר משפחת דוארטה.', en: 'A grand 1822 cemetery that feels like a small city of marble mausoleums with statues, domes and stained glass. Presidents, writers and Eva Perón (in the Duarte family tomb) are buried here.' },
    tip: { he: 'קחו מפה או סיור מודרך בכניסה – קל ללכת לאיבוד בסמטאות. בסופי שבוע יש יריד אומנים צמוד לחומה.', en: 'Grab a map or join a guided walk at the gate – the lanes are a maze. On weekends a craft fair sets up by the walls.' },
    book: 'no',
    ticketIls: { low: 0, high: 60 }
  },
  'buenos-aires|El Ateneo Grand Splendid bookshop': {
    about: { he: 'חנות ספרים בתוך תיאטרון מ־1919, עם תקרה מצוירת, תאי צפייה מוזהבים ווילון אדום. מדפי הספרים ממלאים את האולם, ועל הבמה פועל בית קפה.', en: 'A bookshop inside a 1919 theatre, with a painted ceiling, gilded boxes and red curtains. Shelves fill the auditorium and a café sits on the stage.' },
    tip: { he: 'עלו לקומה העליונה לתמונה של כל האולם. בבוקר יש פחות מבקרים.', en: 'Go up to the top balcony for the full-hall photo. Mornings are quieter.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'buenos-aires|La Boca & Caminito': {
    about: { he: 'שכונת הנמל של המהגרים האיטלקים, עם בתי פח צבועים בצבעים עזים, רקדני טנגו ברחוב ומסעדות עם מופעים. בסמוך אצטדיון לה בומבונרה של בוקה ג׳וניורס.', en: 'The old port district of Italian immigrants, with brightly painted tin houses, street tango dancers and restaurants with shows. Boca Juniors’ La Bombonera stadium is nearby.' },
    tip: { he: 'בקרו בשעות היום ונשארו ברחובות התיירותיים המרכזיים. סיור באצטדיון שווה גם למי שלא חובב כדורגל.', en: 'Visit by day and stay in the main tourist streets. The stadium tour is fun even for non-football fans.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'buenos-aires|San Telmo Sunday fair': {
    about: { he: 'שוק עתיקות ואומנים שמתפרש לאורך רחוב דפנסה בשכונה הוותיקה סן טלמו. מוכרים כלי כסף, שעונים, גרמופונים ואמנות, ובכיכר דורגו רוקדים טנגו לקראת ערב.', en: 'An antiques and crafts fair stretching along Defensa Street in old San Telmo, selling silverware, clocks, gramophones and art, with tango in Plaza Dorrego toward evening.' },
    tip: { he: 'היכנסו גם לשוק המקורה של סן טלמו, עם בתי קפה ודוכני אוכל. התחילו מהכיכר ולכו לכיוון פלאסה דה מאיו.', en: 'Duck into the covered San Telmo Market for cafés and food stalls. Start at Plaza Dorrego and walk toward Plaza de Mayo.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 },
    hours: { he: 'מתקיים בימי ראשון', en: 'Held on Sundays' }
  },
  'buenos-aires|Plaza de Mayo & Casa Rosada': {
    about: { he: 'הכיכר ההיסטורית של בואנוס איירס, שבה נקבעו רגעים מרכזיים בתולדות ארגנטינה. בקצה עומד ״הבית הוורוד״ – בניין משרדי הנשיא – ומסביב הקתדרלה המטרופוליטנית והקבילדו הקולוניאלי.', en: 'Buenos Aires’ historic square, where key moments of Argentine history unfolded. At one end stands the pink Casa Rosada, the presidential offices, with the Metropolitan Cathedral and colonial Cabildo around it.' },
    tip: { he: 'בסופי שבוע יש לפעמים סיורים חינמיים בקאסה רוסדה בהרשמה מראש. שלבו עם הליכה בשדרת מאיו.', en: 'On weekends the Casa Rosada sometimes offers free tours with advance registration. Combine with a stroll down Avenida de Mayo.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'buenos-aires|Teatro Colón': {
    about: { he: 'אחד מבתי האופרה הטובים בעולם, נחשב לבעל אקוסטיקה מעולה, עם אולם מוזהב בצורת פרסה ויטראז׳ים. בסיור מודרך רואים את האולם, את הסלונים ואת אחורי הקלעים.', en: 'One of the world’s great opera houses, famed for its acoustics, with a gilded horseshoe hall and stained glass. A guided tour covers the hall, salons and backstage.' },
    tip: { he: 'אם יש הופעה בתאריכים שלכם, כרטיס להופעה הוא חוויה טובה יותר מהסיור. גם מקומות בקומות הגבוהות שווים.', en: 'If there’s a performance during your stay, it beats the tour. Even the upper tiers are worth it.' },
    book: 'recommended',
    ticketIls: { low: 70, high: 130 }
  },
  'buenos-aires|Café Tortoni': {
    about: { he: 'בית הקפה הוותיק בעיר, משנת 1858, עם עמודי שיש, ויטראז׳ים ומלצרים בחליפות. כאן ישבו סופרים ואמנים, ובערב מתקיימים במרתף מופעי טנגו קטנים.', en: 'The city’s oldest café, from 1858, with marble columns, stained glass and waiters in suits. Writers and artists sat here, and small tango shows run downstairs in the evening.' },
    tip: { he: 'הזמינו צ׳ורוס עם שוקולד חם. בצהריים יש תור בכניסה – בבוקר נכנסים מהר.', en: 'Order churros with hot chocolate. There’s a queue at midday – mornings are quicker.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'buenos-aires|A tango show': {
    about: { he: 'בואנוס איירס היא בירת הטנגו. מופעי ערב עם ארוחה מציגים רקדנים מקצועיים ותזמורת חיה, ולמי שרוצה אווירה מקומית – מילונגה, ערב ריקודים שבו המקומיים רוקדים.', en: 'Buenos Aires is the home of tango. Dinner shows feature professional dancers and a live orchestra; for a local feel, try a milonga, a dance night where porteños dance themselves.' },
    tip: { he: 'מופע בלי ארוחה זול יותר, ואפשר לאכול לפני במסעדה טובה. הרבה מילונגות מציעות שיעור למתחילים בתחילת הערב.', en: 'A show without dinner is cheaper – eat at a good restaurant first. Many milongas start with a beginners’ class.' },
    book: 'recommended',
    ticketIls: { low: 150, high: 550 }
  },
  'buenos-aires|Dinner at a parrilla (steakhouse)': {
    about: { he: 'ארוחת ״אסאדו״ ארגנטינאית בפרייה – מסעדת גריל על גחלים. מזמינים נתחים כמו ביפה דה צ׳וריסו ואוחו דה ביפה, עם צ׳ימיצ׳ורי, סלט ויין מלבק.', en: 'An Argentine asado at a parrilla, a charcoal-grill restaurant. Order cuts like bife de chorizo or ojo de bife with chimichurri, a salad and a glass of Malbec.' },
    tip: { he: 'ארגנטינאים אוכלים מאוחר – מסעדות מתמלאות אחרי 21:00. במסעדות המפורסמות הזמינו שולחן מראש.', en: 'Argentines eat late – restaurants fill up after 9pm. Reserve ahead at the famous places.' },
    book: 'recommended',
    ticketIls: { low: 150, high: 400 }
  },
  'buenos-aires|MALBA museum': {
    about: { he: 'מוזיאון לאמנות לטינו־אמריקאית מודרנית בבניין עכשווי בפלרמו. באוסף יצירות של פרידה קאלו, דייגו ריברה ופרננדו בוטרו, לצד אמנים ארגנטינאים.', en: 'A museum of modern Latin American art in a contemporary building in Palermo, with works by Frida Kahlo, Diego Rivera and Fernando Botero alongside Argentine artists.' },
    tip: { he: 'בית הקפה של המוזיאון מצוין. שלבו עם הליכה בפארקים של פלרמו הסמוכים.', en: 'The museum café is excellent. Combine with a walk in the nearby Palermo parks.' },
    book: 'no',
    ticketIls: { low: 30, high: 70 }
  },
  'buenos-aires|Bosques de Palermo & the Rose Garden': {
    about: { he: 'פארקים ירוקים ענקיים עם אגמים, שבילי ריצה וסירות פדלים. בלב הפארק גן הוורדים (El Rosedal) עם אלפי שיחי ורדים, גשר לבן וגן משוררים.', en: 'Huge green parks with lakes, jogging paths and pedal boats. At their heart, El Rosedal holds thousands of rose bushes, a white bridge and a Poets’ Garden.' },
    tip: { he: 'בסופי שבוע המקומיים יוצאים לפארק – אווירה נהדרת. הוורדים בשיאם באביב ובקיץ המקומיים.', en: 'On weekends locals flock here – great atmosphere. The roses peak in the local spring and summer.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'buenos-aires|Puerto Madero & Puente de la Mujer': {
    about: { he: 'שכונת נמל משוחזרת עם מחסני לבנים אדומות שהפכו למסעדות, מגדלים מודרניים וטיילת לאורך המים. גשר האישה של קלטרווה מסתובב כדי לתת לסירות לעבור.', en: 'A redeveloped port district of red-brick warehouses turned restaurants, modern towers and a waterside promenade. Calatrava’s Puente de la Mujer swings open to let boats through.' },
    tip: { he: 'טיילו בשקיעה, כשהמים והמגדלים מוארים. ספינת המוזיאון פרגטה סרמיינטו עוגנת ממש שם.', en: 'Walk at sunset when the water and towers glow. The museum ship Fragata Sarmiento is moored right there.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'buenos-aires|Once and Jewish Buenos Aires': {
    about: { he: 'בבואנוס איירס אחת הקהילות היהודיות הגדולות בעולם. בשכונת אונסה יש בתי כנסת, מסעדות כשרות וחנויות, ובמרכז העיר בית הכנסת הגדול ״טמפלו ליברטד״ עם מוזיאון יהודי.', en: 'Buenos Aires has one of the world’s largest Jewish communities. Once has synagogues, kosher restaurants and shops, and downtown the grand Templo Libertad synagogue houses a Jewish museum.' },
    tip: { he: 'בשבת רוב העסקים היהודיים סגורים – בואו ביום חול. לביקור במוזיאון היהודי צריך להביא דרכון.', en: 'Most Jewish businesses close on Shabbat – visit on a weekday. Bring your passport for the Jewish Museum.' },
    book: 'no',
    ticketIls: { low: 0, high: 40 }
  },
  // ── Rio de Janeiro ──
  'rio|Christ the Redeemer (Corcovado)': {
    about: { he: 'פסל ענק בגובה 30 מטר על פסגת הר קורקובדו, אחד משבעת פלאי העולם החדשים. עולים ברכבת שיניים דרך יער טיז׳וקה, ומלמעלה רואים את כל ריו – החופים, הר הסוכר והלגונה.', en: 'A 30-metre statue atop Corcovado, one of the New Seven Wonders. A cog train climbs through Tijuca forest, and from the top you see all of Rio – beaches, Sugarloaf and the lagoon.' },
    tip: { he: 'בדקו את מזג האוויר ומצלמת הרשת לפני – בעננים לא רואים כלום. עלו ברכבת הראשונה של הבוקר.', en: 'Check the weather and the webcam first – in cloud you see nothing. Take the first train of the morning.' },
    book: 'recommended',
    ticketIls: { low: 80, high: 140 }
  },
  'rio|Sugarloaf Mountain': {
    about: { he: 'הר גרניט מעוגל בפתח מפרץ גואנבארה, שאליו עולים בשני רכבלים דרך הר אורקה. מהפסגה יש נוף על קופקבנה, על פסל ישו ועל המפרץ.', en: 'A rounded granite peak at the mouth of Guanabara Bay, reached by two cable cars via Morro da Urca, with views over Copacabana, Christ the Redeemer and the bay.' },
    tip: { he: 'עלו כשעה לפני השקיעה ותישארו לאורות העיר. בבוקר המוקדם התורים קצרים במיוחד.', en: 'Go up an hour before sunset and stay for the city lights. Early mornings have the shortest queues.' },
    book: 'recommended',
    ticketIls: { low: 130, high: 180 }
  },
  'rio|Copacabana Beach': {
    about: { he: 'חוף באורך 4 ק״מ בצורת חצי ירח, עם הטיילת המפורסמת בדוגמת גלים שחור־לבן, דוכני משקאות, כדורעף חופים ומלון קופקבנה פאלאס ההיסטורי.', en: 'A 4 km crescent beach with the famous black-and-white wave-pattern promenade, drink kiosks, beach volleyball and the historic Copacabana Palace hotel.' },
    tip: { he: 'קחו לחוף רק מה שצריך. שכרו כיסא ושמשייה מהדוכנים ונסו מי קוקוס טריים.', en: 'Bring only what you need to the beach. Rent a chair and umbrella from a kiosk and try fresh coconut water.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'rio|Ipanema Beach & sunset at Arpoador': {
    about: { he: 'החוף האופנתי של ריו, עם נוף להרי ״שני האחים״ ואווירה צעירה. בקצה המזרחי סלע ארפואדור – שם המקומיים מתאספים לשקיעה ומוחאים כפיים כשהשמש שוקעת.', en: 'Rio’s trendiest beach, framed by the Dois Irmãos peaks. At its east end, Arpoador rock is where locals gather for sunset – and applaud as the sun goes down.' },
    tip: { he: 'הגיעו לסלע כשעה לפני השקיעה כדי לתפוס מקום. כל ״פוסטו״ (עמדת מציל) בחוף מושך קהל אחר.', en: 'Get to the rock an hour before sunset for a spot. Each numbered lifeguard “posto” draws a different crowd.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'rio|Selarón Steps': {
    about: { he: 'גרם מדרגות של כ־215 מדרגות שאמן צ׳יליאני כיסה באלפי אריחים צבעוניים מעשרות מדינות. נמשך מלאפה לסנטה תרזה ומצולם במיוחד.', en: 'A flight of about 215 steps that a Chilean artist covered with thousands of colourful tiles from dozens of countries, linking Lapa and Santa Teresa – hugely photogenic.' },
    tip: { he: 'בואו מוקדם בבוקר לתמונות בלי אנשים. חפשו ביניהם אריחים ממדינות שביקרתם בהן.', en: 'Come early in the morning for people-free photos. Look for tiles from your own country.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'rio|Santa Teresa & its tram': {
    about: { he: 'שכונה בוהמיינית על גבעה, עם אחוזות ישנות, סטודיואים של אמנים ובתי קפה. החשמלית הצהובה ההיסטורית (״בונדיניו״) חוצה את אמות לאפה בדרך למעלה.', en: 'A bohemian hilltop neighbourhood of old mansions, artist studios and cafés. The historic yellow tram (“bondinho”) crosses the Lapa Arches on its way up.' },
    tip: { he: 'עלו בחשמלית מהתחנה במרכז ורדו ברגל. ארוחה במסעדות עם נוף על המפרץ – חוויה.', en: 'Ride the tram up from the downtown station and wander down. Lunch at a restaurant with bay views.' },
    book: 'no',
    ticketIls: { low: 0, high: 20 }
  },
  'rio|Lapa — samba & nightlife': {
    about: { he: 'מוקד חיי הלילה של ריו, סביב אמות לאפה הלבנות מהמאה ה־18. בסופי שבוע הרחובות מתמלאים, ומועדונים כמו ריו סנאריום מנגנים סמבה חיה עד הבוקר.', en: 'Rio’s nightlife hub around the white 18th-century Lapa Arches. On weekends the streets fill up and clubs like Rio Scenarium play live samba until dawn.' },
    tip: { he: 'ימי שישי הם הערב החזק. הגיעו ועזבו במונית מאפליקציה ושמרו טלפון בכיס הקדמי.', en: 'Friday is the big night. Arrive and leave by app taxi and keep your phone in a front pocket.' },
    book: 'no',
    ticketIls: { low: 0, high: 90 }
  },
  'rio|Tijuca National Park': {
    about: { he: 'אחד מיערות הגשם העירוניים הגדולים בעולם, בתוך העיר. יש בו מפלים, שבילים לפסגות כמו פדרה דה גאוואה, ותצפיות כמו ויסטה שינזה. רואים קופים קטנים וטוקנים.', en: 'One of the world’s largest urban rainforests, inside the city, with waterfalls, trails to peaks like Pedra da Gávea and viewpoints like Vista Chinesa. Look for marmosets and toucans.' },
    tip: { he: 'עדיף להגיע עם מדריך או סיור ג׳יפ – כך רואים הרבה בזמן קצר. מסלולים ארוכים התחילו מוקדם.', en: 'Go with a guide or jeep tour to see a lot in little time. Start longer hikes early.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'rio|Rio Botanical Garden': {
    about: { he: 'גן בוטני מ־1808 למרגלות קורקובדו, עם שדרת דקלי מלך ענקיים, חממת אורכידאות, אגם שושני מים ענקיים וקופים קטנים בעצים.', en: 'An 1808 botanical garden at the foot of Corcovado, with an avenue of towering imperial palms, an orchid house, a pond of giant water lilies and marmosets in the trees.' },
    tip: { he: 'שלבו עם הלגונה שקרובה מאוד. בבוקר נעים ושקט ויש יותר ציפורים.', en: 'Combine with the nearby lagoon. Mornings are cool, quiet and birdier.' },
    book: 'no',
    ticketIls: { low: 20, high: 70 }
  },
  'rio|Rodrigo de Freitas Lagoon': {
    about: { he: 'לגונה גדולה בלב העיר, מוקפת שביל אופניים והליכה של כ־7.5 ק״מ, עם נוף לקורקובדו. לאורך הגדה יש קיוסקים ומסעדות, ואפשר לשכור סירת ברבור.', en: 'A large lagoon in the heart of the city, circled by a roughly 7.5 km cycling and walking path with Corcovado views. Kiosks and restaurants line the shore, and you can rent swan pedal boats.' },
    tip: { he: 'שכרו אופני עיר באפליקציה ורכבו סיבוב שלם בשעות אחר הצהריים. בערב הקיוסקים מנגנים מוזיקה חיה.', en: 'Rent a city bike via the app and ride a full loop in the late afternoon. In the evening the kiosks have live music.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'rio|Museum of Tomorrow': {
    about: { he: 'מוזיאון מדע עתידני בנמל המחודש של ריו, בבניין לבן שתכנן קלטרווה. התערוכות האינטראקטיביות עוסקות בכדור הארץ, באקלים ובעתיד שלנו.', en: 'A futuristic science museum on Rio’s revamped waterfront, in a white Calatrava building, with interactive exhibits on the planet, climate and our future.' },
    tip: { he: 'שלבו עם כיכר מאואה ועם ציור הקיר הענק ״קובראס״ על הטיילת. בבוקר יש פחות קבוצות.', en: 'Combine with Praça Mauá and the giant Kobra mural on the boulevard. Mornings have fewer groups.' },
    book: 'no',
    ticketIls: { low: 20, high: 40 }
  },
  'rio|Maracanã Stadium tour': {
    about: { he: 'אחד מאצטדיוני הכדורגל המפורסמים בעולם, שאירח שני גמרים של המונדיאל. בסיור נכנסים לחדרי ההלבשה, יוצאים למנהרה לכר הדשא ורואים טביעות רגליים של כוכבים.', en: 'One of football’s most famous stadiums, host of two World Cup finals. The tour visits the dressing rooms, walks the tunnel to the pitch and shows stars’ footprints.' },
    tip: { he: 'אם יש משחק בזמן הביקור – זו חוויה גדולה יותר מהסיור. הגיעו ברכבת התחתית.', en: 'If there’s a match during your stay, it beats the tour. Take the metro.' },
    book: 'no',
    ticketIls: { low: 60, high: 110 }
  },
  'rio|Hang-gliding from Pedra Bonita': {
    about: { he: 'טיסת גלשן רחיפה בטנדם עם מדריך מורשה מרמפה ביער טיז׳וקה, מעל היער והים, עם נחיתה על חוף סאו קונראדו. הטיסה נמשכת כ־10 דקות.', en: 'A tandem hang-glide with a licensed pilot from a ramp in Tijuca forest, soaring over forest and sea before landing on São Conrado beach. The flight lasts about 10 minutes.' },
    tip: { he: 'הטיסה תלויה במזג האוויר – השאירו תאריך גמיש. בדקו שהטייס מוסמך ושהמחיר כולל תמונות.', en: 'It’s weather-dependent – keep your date flexible. Check the pilot is certified and the price includes photos.' },
    book: 'recommended',
    ticketIls: { low: 450, high: 650 }
  },
  // ── Sydney ──
  'sydney|Sydney Opera House': {
    about: { he: 'בניין המפרשים הלבנים המפורסם על שפת הנמל, אחד מסמלי המאה ה־20. בסיור מודרך נכנסים לאולמות ושומעים את סיפור הבנייה, ובערב אפשר לראות מופע.', en: 'The famous white-sailed building on the harbour, a 20th-century icon. A guided tour takes you into the halls and through the story of its construction, or see a show in the evening.' },
    tip: { he: 'לתמונה הטובה ביותר של הבניין לכו לכיסא גברת מקווארי או צאו במעבורת. הסיור הקצר עדיף על פני התערוכה.', en: 'For the best photo go to Mrs Macquarie’s Chair or take a ferry. The guided tour is the best way inside.' },
    book: 'recommended',
    ticketIls: { low: 0, high: 130 }
  },
  'sydney|Sydney Harbour BridgeClimb': {
    about: { he: 'טיפוס מודרך על קשת גשר הנמל עד לגובה 134 מטר, עם רתמה וציוד מלא. מלמעלה יש נוף של 360 מעלות על הנמל, בית האופרה והעיר.', en: 'A guided climb over the arch of the Harbour Bridge to 134 metres, fully harnessed, with 360-degree views of the harbour, Opera House and city.' },
    tip: { he: 'הטיפוס בשעת השקיעה הוא היפה – והיקר – ביותר. אסור לקחת טלפון; התמונות נמכרות בסוף.', en: 'Sunset climbs are the most beautiful – and expensive. Phones aren’t allowed; photos are sold at the end.' },
    book: 'required',
    ticketIls: { low: 480, high: 950 }
  },
  'sydney|The Rocks': {
    about: { he: 'הרובע הוותיק ביותר של סידני, ליד הגשר, עם סמטאות אבן, פאבים היסטוריים, גלריות ובתי קפה. כאן התיישבו האירופאים הראשונים ב־1788.', en: 'Sydney’s oldest quarter by the Bridge, with stone laneways, historic pubs, galleries and cafés – where the first European settlers landed in 1788.' },
    tip: { he: 'בסופי שבוע מתקיים כאן שוק אומנים ואוכל. בפאבים הוותיקים מגישים בירה מבשלה מקומית.', en: 'On weekends there’s a craft and food market. The old pubs pour locally brewed beer.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'sydney|Royal Botanic Garden & Mrs Macquarie’s Chair': {
    about: { he: 'גן בוטני ענק על שפת הנמל, ליד בית האופרה, עם מדשאות, עצים עתיקים וגן ורדים. בקצהו ״הכיסא של גברת מקווארי״ – ספסל חצוב בסלע עם הנוף הקלאסי של הגשר והאופרה.', en: 'A vast harbourside garden beside the Opera House, with lawns, ancient trees and a rose garden. At its tip, Mrs Macquarie’s Chair is a bench carved into rock with the classic Bridge-and-Opera-House view.' },
    tip: { he: 'הכניסה חינם. הגיעו לכיסא בזריחה או בשקיעה, ומשם לכו לאורך המים חזרה לאופרה.', en: 'Entry is free. Visit the Chair at sunrise or sunset, then walk the waterfront back to the Opera House.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'sydney|Art Gallery of New South Wales': {
    about: { he: 'מוזיאון האמנות הראשי של סידני, עם אוסף אוסטרלי, אירופי ואסייתי ואגף חשוב של אמנות אבוריג׳ינית. הבניין החדש, Sydney Modern, מוסיף אמנות עכשווית ונוף למפרץ.', en: 'Sydney’s main art museum, with Australian, European and Asian collections and an important Aboriginal art wing. The new Sydney Modern building adds contemporary art and harbour views.' },
    tip: { he: 'הכניסה לאוסף הקבוע חינם. אל תפספסו את ״הטנק״ (The Tank) – מיכל דלק תת־קרקעי ישן שהפך לחלל אמנות.', en: 'The permanent collection is free. Don’t miss The Tank, an old underground fuel tank turned art space.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'sydney|Bondi Beach': {
    about: { he: 'החוף המפורסם של אוסטרליה, בצורת קשת עם חול זהוב, גלישה ותרבות חוף. בקצה הדרומי בריכת אייסברגס, שבה הגלים מתנפצים לתוך הבריכה.', en: 'Australia’s most famous beach, a golden arc of sand with surfing and beach culture. At the south end, the Icebergs pool has waves crashing right into it.' },
    tip: { he: 'שחו רק בין הדגלים האדומים־צהובים. בריכת אייסברגס פתוחה לציבור בתשלום קטן.', en: 'Swim only between the red-and-yellow flags. Icebergs pool is open to the public for a small fee.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'sydney|Bondi to Coogee coastal walk': {
    about: { he: 'שביל חוף של כ־6 ק״מ על הצוקים, מבונדיי דרך חופים קטנים כמו טמרמה וברונטה עד קוג׳י. בדרך בריכות סלע, תצפיות ובית קברות היסטורי מעל הים.', en: 'A roughly 6 km clifftop path from Bondi past little beaches like Tamarama and Bronte to Coogee, with rock pools, lookouts and a historic cemetery above the sea.' },
    tip: { he: 'הביאו בגד ים – בברונטה יש בריכת סלע לשחייה. בין מאי לנובמבר אפשר לראות לווייתנים.', en: 'Bring swimwear – Bronte has a rock pool. Between May and November you may spot whales.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'sydney|Manly ferry & beach': {
    about: { he: 'שייט של כחצי שעה ממעגן סירקולר קיי לחוף מנלי, עם נוף לבית האופרה ולנמל. מנלי היא עיירת חוף נינוחה עם מדרחוב, גלישה ושביל חוף יפה.', en: 'A roughly 30-minute ferry from Circular Quay to Manly, with Opera House and harbour views. Manly is a relaxed beach suburb with a pedestrian Corso, surfing and a lovely coastal walk.' },
    tip: { he: 'זה תחבורה ציבורית רגילה – משלמים בכרטיס אשראי בשער. שבו בחוץ בצד ימין ביציאה לראות את האופרה.', en: 'It’s a regular public ferry – tap your credit card at the gate. Sit outside on the right going out for Opera House views.' },
    book: 'no',
    ticketIls: { low: 20, high: 50 }
  },
  'sydney|Taronga Zoo': {
    about: { he: 'גן חיות על מדרון מעל הנמל, עם נוף מדהים לעיר. רואים קואלות, קנגורואים, פלטיפוסים ושדים טסמניים, וגם חיות מכל העולם.', en: 'A zoo on a slope above the harbour with stunning city views. See koalas, kangaroos, platypus and Tasmanian devils, plus animals from around the world.' },
    tip: { he: 'הגיעו במעבורת מסירקולר קיי ועלו ברכבל Sky Safari לכניסה העליונה – ואז הולכים בירידה.', en: 'Take the ferry from Circular Quay and ride the Sky Safari cable car to the top gate, then walk downhill.' },
    book: 'recommended',
    ticketIls: { low: 110, high: 150 }
  },
  'sydney|SEA LIFE Sydney Aquarium': {
    about: { he: 'אקווריום גדול בדרלינג הארבר, עם מנהרות זכוכית שעוברות מתחת לכרישים ולתריסנים, אזור של השונית הגדולה, פינגווינים ודוגונג.', en: 'A big aquarium at Darling Harbour, with glass tunnels under sharks and rays, a Great Barrier Reef zone, penguins and a dugong.' },
    tip: { he: 'כרטיס משולב עם אטרקציות סמוכות (כמו גן החיות WILD LIFE) זול יותר. קנו באתר מראש להנחה.', en: 'Combo tickets with nearby attractions like WILD LIFE Sydney Zoo are cheaper. Buy online for a discount.' },
    book: 'recommended',
    ticketIls: { low: 100, high: 140 }
  },
  'sydney|Sydney Fish Market': {
    about: { he: 'שוק הדגים הגדול בחצי הכדור הדרומי, עם דוכנים של דגים טריים, צדפות, סרטנים וסושי. קונים ואוכלים בשולחנות ליד המים.', en: 'The southern hemisphere’s biggest fish market, with stalls of fresh fish, oysters, crabs and sushi. Buy and eat at tables by the water.' },
    tip: { he: 'בואו לארוחת צהריים מוקדמת, לפני העומס. שמרו על הצלחת – השחפים נועזים.', en: 'Come for an early lunch before the crowds. Guard your plate – the gulls are bold.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'sydney|Sydney Jewish Museum': {
    about: { he: 'מוזיאון שמספר את תולדות היהודים באוסטרליה ואת סיפור השואה, דרך עדויות של ניצולים שהיגרו לסידני. חוויה מרגשת ומעמיקה.', en: 'A museum telling the story of Jews in Australia and of the Holocaust through the testimony of survivors who made Sydney their home. Moving and in-depth.' },
    tip: { he: 'בדקו מראש מתי מתקיימות שיחות עם מתנדבים. הקדישו כשעתיים.', en: 'Check ahead for talks by volunteer guides. Allow around two hours.' },
    book: 'no',
    ticketIls: { low: 35, high: 60 },
    hours: { he: 'סגור בשבת ובחגים יהודיים', en: 'Closed Saturdays and Jewish holidays' }
  },
  'sydney|Watsons Bay & The Gap': {
    about: { he: 'כפר דייגים לשעבר בקצה חצי האי, עם חוף שקט ונוף לעיר מעבר למים. הליכה קצרה מובילה לתצפית ״הגאפ״ – צוקים דרמטיים מול האוקיינוס הפתוח.', en: 'A former fishing village at the tip of the peninsula, with a calm beach and city views across the water. A short walk leads to The Gap, dramatic cliffs facing the open ocean.' },
    tip: { he: 'הגיעו במעבורת וקחו פיש אנד צ׳יפס בדויילס על המים. המשיכו לסאות׳ הד ולמגדלור האדום־לבן.', en: 'Come by ferry and grab fish and chips at Doyles on the water. Continue to South Head and its red-and-white lighthouse.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  // ── New Zealand ──
  'new-zealand|Sky Tower': {
    about: { he: 'מגדל תצפית בגובה 328 מטר במרכז אוקלנד, הגבוה בחצי הכדור הדרומי. מרצפת הזכוכית רואים את הנמל, את ההרים הגעשיים ואת האיים. לאמיצים יש קפיצה מבוקרת ממנו.', en: 'A 328-metre observation tower in central Auckland, the tallest in the southern hemisphere. From its glass floors see the harbour, volcanic cones and islands; the brave can do a controlled SkyJump.' },
    tip: { he: 'ביום צלול הנוף מגיע רחוק – בדקו תחזית. ארוחה במסעדה המסתובבת כוללת את העלייה.', en: 'On a clear day you see for miles – check the forecast. Dining at the revolving restaurant includes the ride up.' },
    book: 'no',
    ticketIls: { low: 75, high: 100 }
  },
  'new-zealand|Mount Eden (Maungawhau)': {
    about: { he: 'הר געש כבוי והנקודה הטבעית הגבוהה באוקלנד, עם מכתש עמוק בפסגה. מהפסגה יש נוף של 360 מעלות על העיר, שני הנמלים והרי הגעש מסביב.', en: 'An extinct volcano and Auckland’s highest natural point, with a deep crater at the summit and 360-degree views of the city, both harbours and the surrounding cones.' },
    tip: { he: 'הכניסה חינם והעלייה קצרה. אל תיכנסו למכתש – זה אתר מקודש למאורים.', en: 'It’s free and a short climb. Don’t walk into the crater – it’s sacred to Māori.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'new-zealand|Te Puia — geysers & Māori culture': {
    about: { he: 'עמק גיאותרמי ברוטורואה עם גייזר פוהוטו, שפורץ כמה פעמים ביום, בריכות בוץ רותח ובית קיווי. במקום פועל גם בית ספר לגילוף ואריגה מאורי ומוצג מופע תרבות.', en: 'A geothermal valley in Rotorua with Pōhutu geyser, which erupts several times a day, boiling mud pools and a kiwi house. It also hosts a Māori carving and weaving school and cultural performances.' },
    tip: { he: 'שלבו סיור ערב עם ארוחת האנגי (בישול באדמה) ומופע – שווה במיוחד.', en: 'Combine an evening tour with a hāngī feast and performance – especially worth it.' },
    book: 'recommended',
    ticketIls: { low: 160, high: 400 }
  },
  'new-zealand|Wai-O-Tapu Thermal Wonderland': {
    about: { he: 'פארק גיאותרמי ליד רוטורואה, עם בריכות בצבעים לא אמיתיים: ״בריכת השמפניה״ הכתומה־טורקיז, אגם ירוק זרחני ובורות בוץ מבעבעים. השבילים מסודרים ונוחים.', en: 'A geothermal park near Rotorua with unreal colours: the orange-and-turquoise Champagne Pool, a neon-green lake and bubbling mud. The trails are well laid out.' },
    tip: { he: 'בכל בוקר בשעה 10:15 מפעילים את גייזר ליידי נוקס – הגיעו מוקדם כדי לראות גם אותו. ריח הגופרית חזק.', en: 'Lady Knox Geyser is set off every morning at 10:15 – arrive early to see it. The sulphur smell is strong.' },
    book: 'no',
    ticketIls: { low: 85, high: 110 }
  },
  'new-zealand|Tongariro Alpine Crossing': {
    about: { he: 'מסלול יום של כ־19 ק״מ בין הרי געש פעילים, שנחשב לאחד הטובים בעולם. עוברים מכתשים, שדות לבה ואגמי ״אמרלד״ בצבע ירוק בוהק, עם נוף להר נגאורוהו.', en: 'A roughly 19 km day hike between active volcanoes, rated among the world’s best, past craters, lava fields and vivid green Emerald Lakes, with views of Mt Ngāuruhoe.' },
    tip: { he: 'המסלול חד־כיווני, אז הזמינו מראש שאטל. מזג האוויר משתנה מהר – בגדים חמים ועמידים לגשם חובה.', en: 'It’s one-way, so pre-book a shuttle. Weather changes fast – warm, waterproof layers are a must.' },
    book: 'recommended',
    ticketIls: { low: 0, high: 130 }
  },
  'new-zealand|Skyline Queenstown gondola & luge': {
    about: { he: 'רכבל תלול שעולה מעל קווינסטאון לתצפית מרהיבה על אגם וואקאטיפו והרמרקבלס. למעלה יש מסלול מגלשות (לוג׳) – עגלות קטנות שגולשים בהן במורד.', en: 'A steep gondola above Queenstown to sweeping views of Lake Wakatipu and The Remarkables. At the top, the luge sends you down a winding track in little carts.' },
    tip: { he: 'קנו חבילה עם כמה סיבובי לוג׳ – אחד לא מספיק. בשקיעה הנוף הכי יפה.', en: 'Buy a package with several luge rides – one is never enough. Sunset has the best view.' },
    book: 'no',
    ticketIls: { low: 130, high: 200 }
  },
  'new-zealand|Shotover Jet': {
    about: { he: 'סירת סילון מהירה שטסה בקניון צר של נהר שוטובר, במרחק סנטימטרים מהסלעים, עם סיבובי 360 מעלות. חוויית אדרנלין קלאסית של קווינסטאון.', en: 'A high-speed jet boat that blasts through the narrow Shotover River canyon, inches from the rock walls, with 360-degree spins – a classic Queenstown thrill.' },
    tip: { he: 'תרטבו מעט – מעיל קל מספיק. יש הסעה חינמית ממרכז קווינסטאון.', en: 'You’ll get a little wet – a light jacket is enough. There’s a free shuttle from central Queenstown.' },
    book: 'recommended',
    ticketIls: { low: 330, high: 400 }
  },
  'new-zealand|Kawarau Bridge bungy': {
    about: { he: 'האתר שבו נולדה קפיצת הבאנג׳י המסחרית ב־1988: קפיצה של 43 מטר מגשר היסטורי מעל נהר קווארו, עם אפשרות לגעת במים. גם לצפות מהמרפסת מרגש.', en: 'Where commercial bungy began in 1988: a 43-metre jump from a historic bridge over the Kawarau River, with an optional water touch. Watching from the deck is a thrill too.' },
    tip: { he: 'יש מגבלות משקל וגיל – בדקו מראש. אפשר גם קפיצה בזוג.', en: 'There are weight and age limits – check ahead. Tandem jumps are possible.' },
    book: 'required',
    ticketIls: { low: 580, high: 700 }
  },
  'new-zealand|Skiing at The Remarkables or Coronet Peak': {
    about: { he: 'שני אתרי סקי ליד קווינסטאון: קורונט פיק – הוותיק, עם נוף לעמק וסקי לילה בחלק מהימים, והרמרקבלס – רכס מרשים עם מסלולים טובים למתחילים ולמשפחות.', en: 'Two ski areas near Queenstown: Coronet Peak, the classic with valley views and night skiing on some days, and The Remarkables, a dramatic range with good beginner and family terrain.' },
    tip: { he: 'העונה בערך מיוני עד אוקטובר. שאטל מהעיר חוסך נהיגה בכביש ההר עם שרשראות.', en: 'The season runs roughly June to October. The shuttle from town saves driving the mountain road with chains.' },
    book: 'recommended',
    ticketIls: { low: 300, high: 450 }
  },
  'new-zealand|Lake Wanaka & That Wanaka Tree': {
    about: { he: 'אגם הררי שקט עם עיירה נינוחה לצידו. בתוך המים עומד עץ ערבה בודד – ״העץ של וואנקה״ – אחד העצים המצולמים בעולם, על רקע הרים מושלגים.', en: 'A calm alpine lake with a relaxed town beside it. In the water stands a lone willow – That Wanaka Tree – one of the world’s most photographed trees, framed by snowy peaks.' },
    tip: { he: 'בזריחה האור הכי יפה והמים הכי שקטים. אל תטפסו על העץ – הוא רגיש.', en: 'Sunrise brings the best light and stillest water. Don’t climb the tree – it’s fragile.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'new-zealand|Roys Peak Track': {
    about: { he: 'מסלול תלול של כ־16 ק״מ הלוך־חזור עם עלייה של כ־1,200 מטר, לתצפית המפורסמת על אגם וואנקה והרכס המתפתל. קשה, אבל הנוף מהפסגה יוצא דופן.', en: 'A steep roughly 16 km return hike climbing about 1,200 metres to the famous view over Lake Wanaka and the winding ridge. Tough, but the summit view is extraordinary.' },
    tip: { he: 'אין צל בכלל – התחילו מוקדם, עם הרבה מים וקרם הגנה. החניון מתמלא עוד לפני הזריחה.', en: 'There’s no shade – start early with lots of water and sunscreen. The car park fills before sunrise.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 },
    hours: { he: 'סגור לעונת ההמלטה, 1 באוקטובר עד 10 בנובמבר', en: 'Closed for lambing, 1 October to 10 November' }
  },
  'new-zealand|Hooker Valley Track, Aoraki/Mount Cook': {
    about: { he: 'מסלול קל של כ־10 ק״מ הלוך־חזור בעמק מתחת להר קוק, ההר הגבוה בניו זילנד. חוצים שלושה גשרים תלויים ומגיעים לאגם קרחוני עם גושי קרח צפים.', en: 'An easy roughly 10 km return walk up a valley beneath Aoraki/Mount Cook, New Zealand’s highest peak, crossing three swing bridges to a glacial lake with floating icebergs.' },
    tip: { he: 'בבוקר מוקדם ההר נקי מעננים והשביל שקט. הביאו שכבה חמה – הרוח מהקרחון קרה.', en: 'Early morning brings a cloud-free peak and a quiet trail. Bring a warm layer – the glacier wind is cold.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'new-zealand|Lake Tekapo & Church of the Good Shepherd': {
    about: { he: 'אגם בצבע טורקיז חלבי, ועל שפתו כנסיית אבן קטנה מ־1935 עם חלון שצופה אל האגם וההרים. האזור הוא שמורת שמי לילה, מהטובות בעולם לצפייה בכוכבים.', en: 'A milky turquoise lake with a small 1935 stone church on its shore, its window framing the lake and mountains. The area is a dark-sky reserve, among the world’s best for stargazing.' },
    tip: { he: 'בסוף האביב (נובמבר–דצמבר) התורמוסים פורחים סביב האגם. צאו בלילה לסיור כוכבים מודרך.', en: 'In late spring (November–December) lupins bloom around the lake. Join a guided stargazing tour at night.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  // ── Vienna ──
  'vienna|Schönbrunn Palace': {
    about: { he: 'ארמון הקיץ של משפחת הבסבורג, עם יותר מ־1,400 חדרים. בסיור רואים את חדרי פרנץ יוזף וסיסי ואת אולמות הנשפים, ומסביב גנים ענקיים, גן חיות ותצפית הגלוריאטה על הגבעה.', en: 'The Habsburgs’ summer palace, with over 1,400 rooms. Tour the apartments of Franz Joseph and Sisi and the ballrooms, then explore vast gardens, the zoo and the Gloriette lookout on the hill.' },
    tip: { he: 'קנו כרטיס עם שעת כניסה באתר מראש. הגנים חינם – עלו לגלוריאטה לנוף על הארמון ווינה.', en: 'Buy a timed ticket online in advance. The gardens are free – climb to the Gloriette for the view back over the palace and Vienna.' },
    book: 'recommended',
    ticketIls: { low: 110, high: 170 }
  },
  'vienna|Hofburg Palace & Sisi Museum': {
    about: { he: 'ארמון החורף של ההבסבורגים בלב העיר. כרטיס אחד כולל את הדירות הקיסריות, את מוזיאון סיסי – על חייה של הקיסרית אליזבת – ואת אוסף כלי הכסף והפורצלן של החצר.', en: 'The Habsburgs’ winter palace in the city centre. One ticket covers the Imperial Apartments, the Sisi Museum on Empress Elisabeth’s life, and the court Silver Collection.' },
    tip: { he: 'מדריך שמע כלול ושווה. ה״סיסי טיקט״ מכסה גם את שנברון – משתלם אם מבקרים בשניהם.', en: 'The audio guide is included and worth it. The Sisi Ticket also covers Schönbrunn – good value if you visit both.' },
    book: 'no',
    ticketIls: { low: 75, high: 95 }
  },
  'vienna|St Stephen’s Cathedral': {
    about: { he: 'הקתדרלה הגותית בלב וינה, עם גג רעפים צבעוני בדוגמת זיגזג ומגדל דרומי בגובה 136 מטר. אפשר לטפס ב־343 מדרגות למגדל, לעלות במעלית לפעמון הענק ולרדת לקטקומבות.', en: 'Vienna’s Gothic cathedral, with its patterned tile roof and 136-metre south tower. Climb 343 steps up the tower, take the lift to the giant Pummerin bell, or descend to the catacombs.' },
    tip: { he: 'החלק האחורי של הכנסייה פתוח בחינם; לכל השאר יש כרטיס משולב. הטיפוס למגדל הדרומי נותן את הנוף הטוב ביותר.', en: 'The back of the nave is free; a combined ticket covers the rest. The south tower climb gives the best view.' },
    book: 'no',
    ticketIls: { low: 0, high: 100 }
  },
  'vienna|Kunsthistorisches Museum': {
    about: { he: 'מוזיאון האמנות הגדול של וינה, בארמון מפואר עם כיפה. יש בו את האוסף הגדול בעולם של ברויגל, ציורים של ולסקז, רפאל ורמברנדט, ואוצרות מצריים ויוונים.', en: 'Vienna’s great art museum in a domed palace, holding the world’s largest Bruegel collection, works by Velázquez, Raphael and Rembrandt, and Egyptian and Greek treasures.' },
    tip: { he: 'שבו לקפה ועוגה בבית הקפה שמתחת לכיפה – אחד היפים בעיר. התחילו באולם ברויגל בקומה הראשונה.', en: 'Have coffee and cake in the café under the dome – one of the city’s finest. Start with the Bruegel room on the first floor.' },
    book: 'no',
    ticketIls: { low: 80, high: 95 }
  },
  'vienna|Belvedere Palace': {
    about: { he: 'שני ארמונות בארוקיים עם גן מדורג ביניהם. בבלוודר העליון תלוי ״הנשיקה״ של קלימט, לצד יצירות של שילה, קוקושקה ומונה.', en: 'Two Baroque palaces with terraced gardens between them. The Upper Belvedere is home to Klimt’s The Kiss, alongside Schiele, Kokoschka and Monet.' },
    tip: { he: 'מספיק כרטיס לבלוודר העליון בלבד. הזמינו שעה מוקדמת כדי לראות את ״הנשיקה״ בלי המון.', en: 'A ticket for the Upper Belvedere alone is enough. Book an early slot to see The Kiss without crowds.' },
    book: 'recommended',
    ticketIls: { low: 70, high: 100 }
  },
  'vienna|The Albertina': {
    about: { he: 'ארמון הבסבורגי עם אוסף אמנות חשוב: ממונה, דגה וסזאן ועד פיקאסו ושאגאל, ואוסף ענק של רישומים. בנוסף רואים את החדרים המלכותיים המשוחזרים.', en: 'A Habsburg palace with a major art collection, from Monet, Degas and Cézanne to Picasso and Chagall, a vast graphic-arts collection and restored state rooms.' },
    tip: { he: 'מהמרפסת שבכניסה יש נוף יפה על בית האופרה. בדקו אילו תערוכות מתחלפות מוצגות.', en: 'The terrace at the entrance overlooks the Opera House. Check which temporary exhibitions are on.' },
    book: 'no',
    ticketIls: { low: 75, high: 90 }
  },
  'vienna|Vienna State Opera (tour or performance)': {
    about: { he: 'אחד מבתי האופרה החשובים בעולם, עם הופעה כמעט כל ערב בעונה. אפשר לצפות באופרה או בבלט, או להצטרף לסיור מודרך באולם, במדרגות הגדולות ובאחורי הקלעים.', en: 'One of the world’s leading opera houses, with a performance almost every night of the season. See an opera or ballet, or join a guided tour of the hall, grand staircase and backstage.' },
    tip: { he: 'כרטיסי עמידה זולים מאוד נמכרים ביום ההופעה. בקיץ (יולי–אוגוסט) אין הופעות, אבל יש סיורים.', en: 'Very cheap standing tickets are sold on the day. There are no performances in July–August, but tours run.' },
    book: 'recommended',
    ticketIls: { low: 50, high: 1000 }
  },
  'vienna|Spanish Riding School': {
    about: { he: 'בית ספר לרכיבה קלאסית מהמאה ה־16, שבו סוסי ליפיצנר לבנים מבצעים תרגילי בלט מורכבים באולם בארוקי מפואר בתוך ההופבורג.', en: 'A classical riding school dating from the 16th century, where white Lipizzaner stallions perform intricate equine “ballet” in a Baroque hall inside the Hofburg.' },
    tip: { he: 'לתקציב קטן – צפו באימון הבוקר, זול בהרבה מהמופע. את המופעים המלאים הזמינו מראש.', en: 'On a budget, watch a morning exercise session – far cheaper than a gala. Book full performances ahead.' },
    book: 'recommended',
    ticketIls: { low: 70, high: 1000 }
  },
  'vienna|Naschmarkt': {
    about: { he: 'השוק המפורסם של וינה, באורך של כקילומטר וחצי, עם דוכני פירות, תבלינים, גבינות וממתקים ומסעדות מכל העולם. בשבת מתקיים לידו שוק פשפשים.', en: 'Vienna’s famous market, about 1.5 km long, with stalls of fruit, spices, cheese and sweets and restaurants from around the world. A flea market sets up beside it on Saturdays.' },
    tip: { he: 'אכלו ארוחת בוקר מאוחרת באחת המסעדות. בדרך הסתכלו על בנייני הווגנר בסגנון יוגנדשטיל ברחוב לינקה וינצאייל.', en: 'Have a late breakfast at one of the restaurants. Look out for Otto Wagner’s Jugendstil buildings on Linke Wienzeile.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 },
    hours: { he: 'סגור בימי ראשון', en: 'Closed Sundays' }
  },
  'vienna|MuseumsQuartier': {
    about: { he: 'מתחם תרבות ענק באורוות הקיסריות לשעבר, עם מוזיאון לאופולד – אוסף שילה הגדול בעולם – מוזיאון לאמנות מודרנית, בתי קפה וחצר עם ספסלי ישיבה ענקיים וצבעוניים.', en: 'A huge cultural complex in the former imperial stables: the Leopold Museum (the world’s largest Schiele collection), the mumok modern art museum, cafés and a courtyard of giant colourful loungers.' },
    tip: { he: 'החצר חינם ומלאה במקומיים בערבי קיץ. מוזיאון לאופולד הוא החובה כאן.', en: 'The courtyard is free and full of locals on summer evenings. The Leopold Museum is the must-see.' },
    book: 'no',
    ticketIls: { low: 0, high: 75 }
  },
  'vienna|Prater & the Giant Ferris Wheel': {
    about: { he: 'פארק ענק עם שדרות עצים ולונה פארק ותיק, ובמרכזו הגלגל הענק מ־1897 – אחד מסמלי וינה. הקרונות העתיקים מסתובבים לאט ונותנים נוף יפה על העיר.', en: 'A vast park with tree-lined avenues and an old amusement park, centred on the 1897 Giant Ferris Wheel, a Vienna icon whose vintage cabins turn slowly over the city.' },
    tip: { he: 'הכניסה לפארק חינם; משלמים לפי מתקן. בערב הלונה פארק מואר ונחמד במיוחד.', en: 'The park is free; you pay per ride. It’s especially fun lit up in the evening.' },
    book: 'no',
    ticketIls: { low: 0, high: 70 }
  },
  'vienna|Jewish Museum Vienna': {
    about: { he: 'מוזיאון בשני אתרים – ארמון אסקלס ברחוב דורותיאה ויודנפלאץ – שמספר את סיפור יהודי וינה מימי הביניים ועד היום. ביודנפלאץ רואים יסודות של בית כנסת מימי הביניים ואת אנדרטת הספרייה.', en: 'A museum on two sites – Palais Eskeles on Dorotheergasse and Judenplatz – telling the story of Vienna’s Jews from the Middle Ages to today. Judenplatz shows medieval synagogue foundations and the “nameless library” memorial.' },
    tip: { he: 'כרטיס אחד תקף לשני האתרים, שנמצאים במרחק הליכה קצר. הקדישו שעתיים–שלוש.', en: 'One ticket covers both sites, a short walk apart. Allow two to three hours.' },
    book: 'no',
    ticketIls: { low: 50, high: 70 },
    hours: { he: 'סגור בשבת', en: 'Closed Saturdays' }
  },
  'vienna|Hundertwasserhaus': {
    about: { he: 'בניין מגורים צבעוני ועקום שתכנן האמן הונדרטוואסר, עם רצפות גליות, עצים שצומחים מהמרפסות ובלי קו ישר אחד. רואים אותו מבחוץ בלבד, כי גרים בו.', en: 'A colourful, wavy apartment block designed by artist Hundertwasser, with uneven floors, trees growing from balconies and hardly a straight line. It’s residential, so you see it from outside.' },
    tip: { he: 'מול הבניין יש ״כפר הונדרטוואסר״ עם חנויות ושירותים. מוזיאון הונדרטוואסר (KunstHausWien) במרחק הליכה קצר.', en: 'Opposite is the Hundertwasser Village with shops and toilets. The KunstHausWien museum is a short walk away.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  // ── Budapest ──
  'budapest|Hungarian Parliament Building': {
    about: { he: 'בניין הפרלמנט הניאו־גותי על גדת הדנובה, מהגדולים באירופה, עם כיפה ומאות צריחים. בסיור מודרך עולים במדרגות המוזהבות ורואים את כתר סטפן הקדוש.', en: 'The neo-Gothic Parliament on the Danube, one of Europe’s largest buildings, with its dome and hundreds of spires. A guided tour climbs the gilded staircase to see the Holy Crown of Hungary.' },
    tip: { he: 'הסיורים באנגלית נגמרים מהר – הזמינו באתר הרשמי מראש. בערב הבניין מואר ונראה הכי טוב מצד בודה.', en: 'English tours sell out – book on the official site in advance. At night it’s lit and looks best from the Buda side.' },
    book: 'required',
    ticketIls: { low: 90, high: 130 }
  },
  'budapest|Buda Castle': {
    about: { he: 'מתחם הארמון המלכותי על גבעת הטירה, שבו שוכנים כיום הגלריה הלאומית ההונגרית ומוזיאון ההיסטוריה של בודפשט. מהטרסות יש נוף פנורמי על הדנובה ועל פשט.', en: 'The royal palace complex on Castle Hill, now home to the Hungarian National Gallery and the Budapest History Museum, with panoramic terraces over the Danube and Pest.' },
    tip: { he: 'עלו ברכבל הפוניקולר ההיסטורי מגשר השלשלאות או באוטובוס 16 – זול יותר ובלי תור. החצרות חינם.', en: 'Ride the historic funicular from the Chain Bridge or take bus 16 – cheaper and no queue. The courtyards are free.' },
    book: 'no',
    ticketIls: { low: 0, high: 80 }
  },
  'budapest|Fisherman’s Bastion & Matthias Church': {
    about: { he: 'מרפסת תצפית לבנה עם שבעה צריחים בסגנון אגדה, מעל הדנובה והפרלמנט. לידה כנסיית מתיאש עם גג רעפים צבעוני ופנים מצויר בשפע.', en: 'A fairytale white lookout terrace with seven turrets above the Danube and Parliament, beside Matthias Church with its colourful tiled roof and richly painted interior.' },
    tip: { he: 'בבוקר מוקדם או בערב אין תור ואין תשלום למרפסות העליונות. רוב התצפית חינם בכל שעה.', en: 'Early morning or evening, the upper terraces are free and empty. Most of the view is free any time.' },
    book: 'no',
    ticketIls: { low: 0, high: 50 }
  },
  'budapest|Széchenyi Thermal Bath': {
    about: { he: 'המרחצאות הגדולים בבודפשט, בארמון ניאו־בארוקי צהוב בפארק העירוני. יש 18 בריכות, ובהן שלוש בריכות חוץ חמות שבהן המקומיים משחקים שחמט במים גם בחורף.', en: 'Budapest’s largest baths, in a yellow neo-Baroque palace in City Park, with 18 pools including three steaming outdoor ones where locals play chess in the water even in winter.' },
    tip: { he: 'הביאו כפכפים ומגבת. כרטיס עם לוקר מספיק, ובימי חול בבוקר יש הרבה פחות אנשים.', en: 'Bring flip-flops and a towel. A locker ticket is enough, and weekday mornings are far quieter.' },
    book: 'recommended',
    ticketIls: { low: 120, high: 180 }
  },
  'budapest|Gellért Thermal Bath': {
    about: { he: 'מרחצאות בסגנון ארט נובו למרגלות גבעת גלרט, עם עמודים, פסיפסים וויטראז׳ים. הבריכה המקורה המפוארת נחשבת לאחת היפות באירופה.', en: 'Art Nouveau baths at the foot of Gellért Hill, with columns, mosaics and stained glass. The grand indoor pool is considered one of Europe’s most beautiful.' },
    tip: { he: 'בדקו לפני הביקור שהמרחצאות פתוחים – במבנה מתוכננים שיפוצים. בימי חול בבוקר שקט יותר.', en: 'Check it’s open before you go – renovation works are planned for the building. Weekday mornings are calmer.' },
    book: 'recommended',
    ticketIls: { low: 120, high: 180 }
  },
  'budapest|Dohány Street Synagogue': {
    about: { he: 'בית הכנסת הגדול באירופה, מ־1859, בסגנון מורי עם שני מגדלים. במתחם המוזיאון היהודי, בית קברות קטן ו״עץ החיים״ – אנדרטת מתכת לזכר קורבנות השואה.', en: 'Europe’s largest synagogue, from 1859, in Moorish style with twin towers. The complex includes the Jewish Museum, a small cemetery and the metal Tree of Life Holocaust memorial.' },
    tip: { he: 'הכרטיס כולל סיור מודרך – כדאי להצטרף. כסו כתפיים; לגברים מחלקים כיפה בכניסה.', en: 'The ticket includes a guided tour – join it. Cover shoulders; men are given a kippah at the door.' },
    book: 'recommended',
    ticketIls: { low: 90, high: 130 },
    hours: { he: 'סגור בשבת ובחגים יהודיים', en: 'Closed Saturdays and Jewish holidays' }
  },
  'budapest|Shoes on the Danube Bank': {
    about: { he: 'אנדרטה של 60 זוגות נעליים מברזל על גדת הדנובה, לזכר היהודים שנורו כאן בחורף 1944–1945 והושלכו לנהר. מקום קטן, שקט ומרגש.', en: 'A memorial of 60 pairs of iron shoes on the Danube bank, honouring the Jews shot here in the winter of 1944–45 and thrown into the river. Small, quiet and moving.' },
    tip: { he: 'נמצא כ־300 מטר דרומית לפרלמנט – שלבו עם הביקור שם. בשקיעה המקום שקט במיוחד.', en: 'It’s about 300 m south of Parliament – combine the two. It’s especially quiet at sunset.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'budapest|St Stephen’s Basilica': {
    about: { he: 'הכנסייה הגדולה בבודפשט, בגובה 96 מטר – בדיוק כמו הפרלמנט. בפנים יש שיש, זהב ופסיפסים, ומהכיפה, שאליה עולים במעלית או במדרגות, נשקף נוף של 360 מעלות.', en: 'Budapest’s largest church, 96 metres tall – exactly the height of Parliament. Inside: marble, gold and mosaics; up top, a 360-degree panorama from the dome by lift or stairs.' },
    tip: { he: 'התצפית מהכיפה היא החלק השווה ביותר. בערב מתקיימים לעיתים קונצרטי עוגב.', en: 'The dome panorama is the best part. Organ concerts are held some evenings.' },
    book: 'no',
    ticketIls: { low: 0, high: 60 }
  },
  'budapest|Great Market Hall': {
    about: { he: 'השוק המקורה הגדול בעיר, בבניין מ־1897 עם גג רעפים צבעוני. בקומה התחתונה פפריקה, נקניקים ופירות, ובקומה העליונה דוכני לאנגוש – לחם מטוגן הונגרי – ומזכרות.', en: 'The city’s largest covered market, an 1897 hall with a colourful tiled roof. Downstairs: paprika, sausages and produce; upstairs: lángos (Hungarian fried bread) stalls and souvenirs.' },
    tip: { he: 'קנו פפריקה בקומה התחתונה, לא בדוכני המזכרות. בשבת השוק נסגר מוקדם.', en: 'Buy paprika downstairs, not at the souvenir stalls. On Saturdays it closes early.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 },
    hours: { he: 'סגור בימי ראשון', en: 'Closed Sundays' }
  },
  'budapest|Szimpla Kert': {
    about: { he: 'הבר ההריסות הראשון והמפורסם בבודפשט, בבניין נטוש ברובע היהודי שמולא בריהוט ישן, אמנות מוזרה ואורות. חדרים רבים, חצר פתוחה ומוזיקה – חוויה יותר מבר.', en: 'Budapest’s first and most famous ruin bar, in a derelict Jewish Quarter building filled with mismatched furniture, odd art and lights – many rooms, an open courtyard and music. More experience than bar.' },
    tip: { he: 'בואו גם ביום – זה מקום מרתק לראות. בבוקר יום ראשון מתקיים כאן שוק איכרים קטן.', en: 'Visit by day too – it’s fascinating to see. On Sunday mornings it hosts a small farmers’ market.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'budapest|Margaret Island': {
    about: { he: 'אי ירוק באמצע הדנובה, בלי מכוניות, עם מסלול ריצה של יותר מ־5 ק״מ, גני ורדים, חורבות מנזר ומזרקה מוזיקלית שרוקדת למוזיקה. מקום נהדר לאופניים ופיקניק.', en: 'A car-free green island in the Danube with a 5+ km running track, rose gardens, monastery ruins and a musical fountain that dances to music. Great for bikes and picnics.' },
    tip: { he: 'שכרו אופניים או עגלת פדלים בכניסה. בקיץ פתוח כאן פארק המים הפתוח פאלטינוס.', en: 'Rent a bike or pedal cart at the entrance. In summer the Palatinus outdoor pools are open here.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'budapest|Gellért Hill viewpoint': {
    about: { he: 'גבעה סלעית מעל הדנובה, עם אנדרטת החירות בפסגה והתצפית הטובה ביותר על כל העיר – הגשרים, הפרלמנט וגבעת הטירה.', en: 'A rocky hill above the Danube topped by the Liberty Statue, with the best view over the whole city – the bridges, Parliament and Castle Hill.' },
    tip: { he: 'העלייה ברגל כחצי שעה מגשר אליזבת. בשקיעה ובערב, כשהעיר מוארת, הנוף מדהים.', en: 'It’s a 30-minute walk up from Elisabeth Bridge. At sunset and after dark, with the city lit, the view is stunning.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'budapest|Evening Danube cruise': {
    about: { he: 'שייט של שעה בערך על הדנובה, כשהפרלמנט, גבעת הטירה וגשר השלשלאות מוארים. יש שייט פשוט עם משקה ושייט עם ארוחת ערב ומוזיקה.', en: 'About an hour on the Danube as Parliament, Castle Hill and the Chain Bridge glow at night, from simple cruises with a drink to dinner cruises with music.' },
    tip: { he: 'שייט קצר בלי ארוחה נותן את אותו נוף בפחות כסף. שבו על הסיפון הפתוח.', en: 'A short cruise without dinner gives the same view for less. Sit on the open deck.' },
    book: 'recommended',
    ticketIls: { low: 60, high: 300 }
  },
  // ── Kraków ──
  'krakow|Main Market Square & Cloth Hall': {
    about: { he: 'אחת הכיכרות העירוניות הגדולות באירופה מימי הביניים, מוקפת בתים צבעוניים ובתי קפה. במרכזה אולם הבדים מתקופת הרנסנס, שבו דוכני מזכרות, תכשיטי ענבר ועבודות עץ.', en: 'One of Europe’s largest medieval squares, lined with colourful houses and cafés. At its centre the Renaissance Cloth Hall houses stalls selling souvenirs, amber jewellery and woodwork.' },
    tip: { he: 'בקומה העליונה של אולם הבדים יש גלריה לאמנות פולנית ומרפסת עם נוף על הכיכר.', en: 'Upstairs in the Cloth Hall a gallery of Polish art has a terrace overlooking the square.' },
    book: 'no',
    ticketIls: { low: 0, high: 35 }
  },
  'krakow|St Mary’s Basilica': {
    about: { he: 'כנסייה גותית עם שני מגדלים שונים בגובהם וגג כחול זרוע כוכבים מבפנים. במרכזה המזבח המגולף של פייט שטוס. מהמגדל נשמעת כל שעה מנגינת חצוצרה שנקטעת באמצע.', en: 'A Gothic church with two unequal towers and a star-studded blue ceiling inside, centred on Veit Stoss’s carved altarpiece. Every hour a trumpet call sounds from the tower, breaking off mid-tune.' },
    tip: { he: 'המזבח נפתח כל יום בשעה 11:50 – הגיעו כמה דקות קודם. הכניסה לתיירים היא מהדלת הצדדית.', en: 'The altarpiece is opened daily at 11:50 – arrive a few minutes early. Tourists enter through the side door.' },
    book: 'no',
    ticketIls: { low: 15, high: 40 }
  },
  'krakow|Rynek Underground museum': {
    about: { he: 'מוזיאון מודרני ומרתק מתחת לכיכר המרכזית, בתוך חפירות ארכאולוגיות. הולכים בין שרידי דוכנים ורחובות מימי הביניים, עם הולוגרמות ומסכי מגע.', en: 'A modern, absorbing museum beneath the Main Square, inside the archaeological dig. Walk among remains of medieval stalls and streets, with holograms and touchscreens.' },
    tip: { he: 'הכניסה בשעות קבועות ומספר המקומות מוגבל – קנו כרטיס מראש או בבוקר באותו יום.', en: 'Entry is by timed slot with limited places – buy ahead or first thing that day.' },
    book: 'recommended',
    ticketIls: { low: 30, high: 45 }
  },
  'krakow|Wawel Royal Castle': {
    about: { he: 'ארמון מלכי פולין על גבעה מעל הוויסלה, עם חצר רנסנס מקושתת. התערוכות כוללות את חדרי המלוכה המפוארים, שטיחי קיר פלמיים עצומים ואוצרות המלוכה.', en: 'The Polish kings’ castle on a hill above the Vistula, with an arcaded Renaissance courtyard. Exhibitions include the grand state rooms, huge Flemish tapestries and the crown treasury.' },
    tip: { he: 'כל תערוכה בכרטיס נפרד, ומספר הכרטיסים היומי מוגבל – קנו באתר מראש. החצר והגבעה חינם.', en: 'Each exhibition has its own ticket and daily numbers are capped – buy online in advance. The courtyard and hill are free.' },
    book: 'recommended',
    ticketIls: { low: 30, high: 120 }
  },
  'krakow|Wawel Cathedral': {
    about: { he: 'הקתדרלה שבה הוכתרו ונקברו מלכי פולין, עם קפלות מוזהבות וקברים מלכותיים. מטפסים במדרגות עץ צרות לפעמון זיגמונט הענק ויורדים לקריפטות.', en: 'The cathedral where Polish kings were crowned and buried, with gilded chapels and royal tombs. Climb narrow wooden stairs to the huge Sigismund Bell and descend to the crypts.' },
    tip: { he: 'הכרטיס נקנה במשרד מול הכניסה לקתדרלה, לא בתוכה. המדרגות לפעמון תלולות.', en: 'Buy tickets at the office opposite the cathedral entrance, not inside. The bell-tower stairs are steep.' },
    book: 'no',
    ticketIls: { low: 20, high: 35 }
  },
  'krakow|Wawel Dragon’s Den': {
    about: { he: 'מערת גיר קצרה בצלע גבעת ואוול, שלפי האגדה גר בה הדרקון של קרקוב. יוצאים ממנה לגדת הנהר, שם עומד פסל דרקון מברונזה שיורק אש כל כמה דקות. ילדים אוהבים את זה מאוד.', en: 'A short limestone cave in Wawel Hill where, legend says, Kraków’s dragon lived. It exits onto the riverbank by a bronze dragon statue that breathes fire every few minutes. Kids love it.' },
    tip: { he: 'נכנסים מלמעלה, מגבעת ואוול, ויוצאים למטה ליד הנהר. משלמים במכונה – הכינו מטבעות או כרטיס.', en: 'Enter from the top of Wawel Hill and exit by the river. Pay at the machine – have coins or a card ready.' },
    book: 'no',
    ticketIls: { low: 10, high: 20 },
    hours: { he: 'פתוח רק בעונה החמה (בערך אפריל–אוקטובר)', en: 'Open in the warmer months only (roughly April–October)' }
  },
  'krakow|Kazimierz': {
    about: { he: 'הרובע היהודי ההיסטורי של קרקוב, עם בתי כנסת עתיקים, סמטאות ציוריות, ציורי קיר ובתי קפה. כיום הוא גם מרכז חיי הלילה והאוכל של העיר.', en: 'Kraków’s historic Jewish quarter, with old synagogues, picturesque lanes, murals and cafés – today also the city’s food and nightlife hub.' },
    tip: { he: 'סיור הליכה מודרך נותן את ההקשר ההיסטורי. ברחוב שרוקה יש מסעדות עם מטבח יהודי־פולני ומוזיקת כליזמרים.', en: 'A guided walk gives the historical context. Szeroka Street has Jewish-Polish restaurants with klezmer music.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'krakow|Old Synagogue': {
    about: { he: 'בית הכנסת העתיק ביותר שנשתמר בפולין, מהמאה ה־15. כיום זה מוזיאון על חיי היהודים בקרקוב, עם תשמישי קדושה, בימה משוחזרת וסיפור הקהילה.', en: 'Poland’s oldest surviving synagogue, from the 15th century, now a museum of Jewish life in Kraków with ritual objects, a restored bimah and the community’s story.' },
    tip: { he: 'נמצא בקצה רחוב שרוקה – התחילו ממנו את הסיור בקזימייז. הביקור קצר, כשעה.', en: 'It stands at the end of Szeroka Street – start your Kazimierz walk here. The visit is short, about an hour.' },
    book: 'no',
    ticketIls: { low: 20, high: 35 }
  },
  'krakow|Remuh Synagogue & Cemetery': {
    about: { he: 'בית כנסת קטן ופעיל מהמאה ה־16, הקשור לרבי משה איסרליש – הרמ״א. מאחוריו בית קברות עתיק עם מצבות מגולפות וקברו של הרמ״א, שאליו מגיעים מבקרים מכל העולם.', en: 'A small, still-active 16th-century synagogue linked to Rabbi Moses Isserles, the Rema. Behind it lies an old cemetery of carved headstones and the Rema’s grave, visited from around the world.' },
    tip: { he: 'זה בית כנסת פעיל – לבוש צנוע; גברים מכסים ראש. הקיר בכניסה בנוי משברי מצבות.', en: 'It’s an active synagogue – dress modestly; men cover their heads. The entrance wall is built from broken headstones.' },
    book: 'no',
    ticketIls: { low: 10, high: 20 },
    hours: { he: 'סגור בשבת ובחגים יהודיים', en: 'Closed Saturdays and Jewish holidays' }
  },
  'krakow|Plac Nowy': {
    about: { he: 'כיכר תוססת בלב קזימייז, ובמרכזה מבנה עגול שבו מוכרים זאפיקנקה – באגט פתוח עם גבינה ותוספות, האוכל העממי של קרקוב. מסביב ברים, ובבקרים שווקים קטנים.', en: 'A lively square in the heart of Kazimierz around a round pavilion selling zapiekanki – open baguettes with cheese and toppings, Kraków’s street food – ringed by bars, with small markets in the mornings.' },
    tip: { he: 'נסו זאפיקנקה בערב, כשהכיכר מתעוררת. בסופי שבוע יש בבוקר שוק פשפשים ועתיקות.', en: 'Try a zapiekanka in the evening when the square comes alive. Weekend mornings bring a flea and antiques market.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'krakow|Oskar Schindler’s Enamel Factory': {
    about: { he: 'המפעל של אוסקר שינדלר, שהציל כ־1,200 יהודים, הפך למוזיאון מרגש על קרקוב תחת הכיבוש הנאצי. התערוכה מעוצבת כמסלול של חדרים משוחזרים, עדויות ותמונות.', en: 'The factory of Oskar Schindler, who saved some 1,200 Jews, now a powerful museum on Kraków under Nazi occupation, laid out as a route of recreated rooms, testimony and photographs.' },
    tip: { he: 'מספר הכרטיסים מוגבל ונגמר מראש – הזמינו באתר. הקדישו לפחות שעתיים.', en: 'Tickets are limited and sell out – book online. Allow at least two hours.' },
    book: 'required',
    ticketIls: { low: 40, high: 55 }
  },
  'krakow|Ghetto Heroes Square': {
    about: { he: 'הכיכר המרכזית של גטו קרקוב לשעבר, ובה אנדרטה של 70 כיסאות ברזל ריקים לזכר היהודים שגורשו מכאן. בפינת הכיכר ״בית המרקחת תחת הנשר״ – מוזיאון על הרוקח שעזר לתושבי הגטו.', en: 'The former main square of the Kraków ghetto, with a memorial of 70 empty iron chairs for the Jews deported from here. On the corner, the Pharmacy Under the Eagle museum tells of the pharmacist who helped ghetto residents.' },
    tip: { he: 'נמצא בדרך למפעל של שינדלר – שלבו את השניים. קטע מחומת הגטו נשמר ברחוב לבובסקה הסמוך.', en: 'It’s on the way to Schindler’s Factory – combine them. A fragment of the ghetto wall survives on nearby Lwowska Street.' },
    book: 'no',
    ticketIls: { low: 0, high: 25 }
  },
  'krakow|Planty Park': {
    about: { he: 'טבעת ירוקה של כ־4 ק״מ שמקיפה את העיר העתיקה, במקום שבו עמדו החומות. שבילים מוצלים, ספסלים, פסלים ושרידים כמו שער פלוריאן והברביקן.', en: 'A roughly 4 km green ring around the Old Town where the walls once stood, with shady paths, benches, statues and survivors like St Florian’s Gate and the Barbican.' },
    tip: { he: 'זו הדרך הנעימה ביותר לעבור בין אתרים בעיר העתיקה. בסתיו העלים הצבעוניים יפים במיוחד.', en: 'It’s the pleasantest way between Old Town sights. In autumn the colours are gorgeous.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  // ── Swiss Alps ──
  'swiss-alps|Jungfraujoch': {
    about: { he: '״פסגת אירופה״ – תחנת הרכבת הגבוהה ביבשת, בגובה 3,454 מטר. עולים ברכבת דרך מנהרה בתוך הר האייגר, ולמעלה יש מצפה ספינקס, ארמון קרח ונוף על קרחון אלץ׳ – הארוך באלפים.', en: 'The “Top of Europe”: the continent’s highest railway station at 3,454 m. A train tunnels up through the Eiger to the Sphinx observatory, an Ice Palace and views over the Aletsch Glacier, the longest in the Alps.' },
    tip: { he: 'בדקו את מצלמות הרשת לפני שאתם קונים – בעננים לא רואים כלום. בגובה הזה זזים לאט; הביאו מעיל ומשקפי שמש.', en: 'Check the webcams before you buy – in cloud you see nothing. Move slowly at this altitude; bring a jacket and sunglasses.' },
    book: 'recommended',
    ticketIls: { low: 500, high: 1100 }
  },
  'swiss-alps|Chapel Bridge, Lucerne': {
    about: { he: 'גשר עץ מקורה מהמאה ה־14 שחוצה את נהר רויס בלוצרן, עם ציורים משולשים בתקרה ומגדל מים מתומן. אחד מסמלי שווייץ, מקושט בפרחים בקיץ.', en: 'A 14th-century covered wooden bridge across the Reuss in Lucerne, with triangular paintings under the roof and an octagonal water tower – a Swiss icon, decked with flowers in summer.' },
    tip: { he: 'התמונה הטובה ביותר היא מהגדה, ליד כנסיית הישועים. המשיכו לגשר שפראוור הפחות מוכר עם ״ריקוד המוות״.', en: 'The best photo is from the riverbank near the Jesuit Church. Continue to the lesser-known Spreuer Bridge and its Dance of Death paintings.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'swiss-alps|Lake Lucerne boat cruise': {
    about: { he: 'שייט באגם מפותל בין הרים, על ספינות קיטור היסטוריות או ספינות מודרניות, בין כפרים כמו ויצנאו ובקנריד. האגם הוא גם הדרך היפה להגיע לרכבות של ריגי ופילאטוס.', en: 'A cruise on a winding mountain lake aboard historic paddle steamers or modern boats, calling at villages like Vitznau and Beckenried – also the scenic way to reach the Rigi and Pilatus railways.' },
    tip: { he: 'עם כרטיס Swiss Travel Pass השייט כלול. בחרו ספינת קיטור – החוויה שווה את זה.', en: 'The Swiss Travel Pass covers the cruise. Pick a paddle steamer – it’s worth it.' },
    book: 'no',
    ticketIls: { low: 100, high: 300 }
  },
  'swiss-alps|Mount Pilatus': {
    about: { he: 'הר מעל לוצרן עם נוף לאגם ולאלפים. ב״סיבוב הזהב״ משלבים שייט, רכבת השיניים התלולה בעולם (שיפוע 48%) ורכבל בירידה. למעלה יש שבילי תצפית קצרים ומלון.', en: 'A mountain above Lucerne with lake and Alpine views. The Golden Round Trip combines a boat, the world’s steepest cogwheel railway (48% gradient) and a cable car down. At the top: short lookout trails and a hotel.' },
    tip: { he: 'רכבת השיניים פועלת רק בעונה החמה (בערך מאי–נובמבר); בחורף עולים ברכבל בלבד. Swiss Travel Pass נותן הנחה.', en: 'The cogwheel railway only runs in the warmer months (roughly May–November); in winter go up by cable car. The Swiss Travel Pass gives a discount.' },
    book: 'recommended',
    ticketIls: { low: 380, high: 560 }
  },
  'swiss-alps|Mount Rigi': {
    about: { he: '״מלכת ההרים״, הר נגיש עם רכבת השיניים הראשונה באירופה. מהפסגה רואים שלושה אגמים ושרשרת של פסגות מושלגות, ויש שבילי הליכה קלים בין תחנות הרכבת.', en: 'The “Queen of the Mountains”, an easy peak served by Europe’s first cogwheel railway. The summit overlooks three lakes and a chain of snowy peaks, with gentle trails between stations.' },
    tip: { he: 'עם Swiss Travel Pass העלייה כלולה – זו הדרך הזולה להר. רדו ברגל תחנה או שתיים בשביל הנוף.', en: 'With a Swiss Travel Pass the ride is included – the cheapest mountain option. Walk down a station or two for the views.' },
    book: 'no',
    ticketIls: { low: 0, high: 350 }
  },
  'swiss-alps|Swiss Museum of Transport': {
    about: { he: 'המוזיאון הפופולרי בשווייץ, עם רכבות, מטוסים, ספינות ומכוניות שאפשר לעלות עליהם, פלנטריום, סימולטורים ואולם עם מפה אווירית ענקית של שווייץ שהולכים עליה.', en: 'Switzerland’s most popular museum, with trains, planes, boats and cars you can climb into, a planetarium, simulators and a hall with a giant aerial map of Switzerland you walk across.' },
    tip: { he: 'מעולה ליום גשום ולילדים. הגיעו בשייט מלוצרן – יש תחנה ממש ליד המוזיאון.', en: 'Perfect for rainy days and kids. Arrive by boat from Lucerne – there’s a pier right by the museum.' },
    book: 'no',
    ticketIls: { low: 130, high: 170 }
  },
  'swiss-alps|Lauterbrunnen Valley & Staubbach Falls': {
    about: { he: 'עמק קרחוני צר עם קירות סלע אנכיים ו־72 מפלים. מפל שטאובך נופל כמעט 300 מטר ממש מעל הכפר, ואפשר לטפס לגלריה מאחוריו.', en: 'A narrow glacial valley of sheer rock walls and 72 waterfalls. Staubbach Falls drops nearly 300 metres right above the village, with a path up to a gallery behind it.' },
    tip: { he: 'הליכה לאורך העמק בחינם היא אחת היפות בשווייץ. משם עולים ברכבל לכפרים מירן או ונגן.', en: 'Walking the valley floor is free and one of Switzerland’s finest. From here, lifts climb to Mürren or Wengen.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'swiss-alps|Trümmelbach Falls': {
    about: { he: 'עשרה מפלים של מי קרחון שזורמים בעוצמה אדירה בתוך ההר עצמו. עולים במעלית בתוך הסלע והולכים במנהרות ובמדרגות ליד המים הגועשים.', en: 'Ten glacier-fed waterfalls thundering inside the mountain itself. A lift inside the rock takes you up, then tunnels and stairs lead past the roaring water.' },
    tip: { he: 'קחו מעיל – יש רטיבות וקור. לא מתאים לעגלות תינוקות ולילדים קטנים מאוד.', en: 'Bring a jacket – it’s wet and cold. Not suitable for strollers or very young children.' },
    book: 'no',
    ticketIls: { low: 60, high: 75 },
    hours: { he: 'פתוח בעונה בלבד (בערך אפריל–נובמבר)', en: 'Open seasonally (roughly April–November)' }
  },
  'swiss-alps|Grindelwald First & Cliff Walk': {
    about: { he: 'רכבל מגרינדלוולד להר פירסט, ושם שביל מתכת שתלוי על צוק מעל התהום, עם נוף לאייגר. למטה אפשר לרדת באומגת First Flyer, בעגלות הרים או בקורקינט.', en: 'A gondola from Grindelwald to First, where a steel walkway hangs off a cliff with Eiger views. Come down by the First Flyer zipline, mountain carts or trotti-bikes.' },
    tip: { he: 'מפירסט צאו להליכה של כשעה לאגם בכאלפזה – הבבואה של ההרים במים מדהימה.', en: 'From First hike about an hour to Bachalpsee – the mountain reflections are stunning.' },
    book: 'no',
    ticketIls: { low: 220, high: 320 }
  },
  'swiss-alps|Harder Kulm viewpoint': {
    about: { he: 'תצפית מעל אינטרלאקן שאליה עולים ברכבל פוניקולר של 10 דקות. מגשר התצפית רואים את שני האגמים ואת הפסגות אייגר, מנך ויונגפראו.', en: 'A lookout above Interlaken reached by a 10-minute funicular. Its Two Lakes Bridge views both lakes and the Eiger, Mönch and Jungfrau.' },
    tip: { he: 'בואו לשקיעה ואכלו במסעדה למעלה. Swiss Travel Pass נותן הנחה.', en: 'Come for sunset and eat at the restaurant up top. The Swiss Travel Pass gives a discount.' },
    book: 'no',
    ticketIls: { low: 140, high: 190 },
    hours: { he: 'פועל בעונה (בערך אפריל–נובמבר)', en: 'Runs seasonally (roughly April–November)' }
  },
  'swiss-alps|Lake Brienz boat trip': {
    about: { he: 'שייט על אגם בצבע טורקיז מאינטרלאקן לבריינץ, בין כפרים כמו איזלטוולד ותחנה למפלי גיסבך, שנופלים במדרגות ליד מלון היסטורי.', en: 'A cruise across a turquoise lake from Interlaken to Brienz, past villages like Iseltwald, with a stop for the Giessbach Falls cascading beside a historic hotel.' },
    tip: { he: 'רדו בתחנת גיסבך ועלו ברכבל הפוניקולר הישן למפלים. עם Swiss Travel Pass השייט כלול.', en: 'Hop off at Giessbach and ride the old funicular to the falls. The Swiss Travel Pass covers the boat.' },
    book: 'no',
    ticketIls: { low: 100, high: 300 }
  },
  'swiss-alps|Zurich Old Town & Bahnhofstrasse': {
    about: { he: 'סמטאות מרוצפות משני צדי נהר לימאט, עם כנסיות ותיקות כמו הגרוסמינסטר והפראומינסטר, ובאנהופשטראסה – רחוב הקניות היוקרתי שבין התחנה לאגם.', en: 'Cobbled lanes on both banks of the Limmat, with landmark churches like the Grossmünster and Fraumünster, and Bahnhofstrasse, the luxury shopping street from the station to the lake.' },
    tip: { he: 'עלו לגבעת לינדנהוף לנוף חינמי על העיר. בפראומינסטר יש חלונות ויטראז׳ של שאגאל.', en: 'Climb to the Lindenhof for a free view over town. The Fraumünster has stained-glass windows by Chagall.' },
    book: 'no',
    ticketIls: { low: 0, high: 25 }
  },
  'swiss-alps|Lindt Home of Chocolate': {
    about: { he: 'מוזיאון השוקולד של לינדט בקילכברג ליד ציריך, עם מזרקת שוקולד ענקית, תערוכה אינטראקטיבית על תולדות השוקולד וטעימות חופשיות בסוף, וחנות לינדט ענקית.', en: 'Lindt’s chocolate museum in Kilchberg near Zurich, with a giant chocolate fountain, an interactive history of chocolate, free tastings at the end and a huge Lindt shop.' },
    tip: { he: 'הזמינו שעה מראש, במיוחד בסופי שבוע. השאירו מקום בבטן לטעימות בסוף הסיור.', en: 'Book a time slot ahead, especially at weekends. Save room for the tastings at the end.' },
    book: 'recommended',
    ticketIls: { low: 60, high: 85 }
  },
  // ── Austrian Alps ──
  'austrian-alps|Hintertux Glacier': {
    about: { he: 'קרחון בקצה עמק צילרטל, אחד האתרים היחידים באוסטריה עם סקי כל השנה. ברכבלים מגיעים לגובה של יותר מ־3,000 מטר, ויש סיור במערת קרח טבעית בתוך הקרחון.', en: 'A glacier at the head of the Zillertal, one of Austria’s few year-round ski areas. Lifts climb above 3,000 m, and you can tour a natural ice cave inside the glacier.' },
    tip: { he: 'גם בלי סקי, כרטיס רכבל לתצפית בפסגה וסיור ב״ארמון הקרח״ שווים. הביאו בגדים חמים גם בקיץ.', en: 'Even without skiing, a panorama lift ticket and the Nature Ice Palace tour are worth it. Bring warm clothes even in summer.' },
    book: 'no',
    ticketIls: { low: 150, high: 320 }
  },
  'austrian-alps|Nordkette cable car': {
    about: { he: 'מסלול רכבלים ישר ממרכז אינסברוק לפסגת הפלקאר בגובה 2,256 מטר – תוך כ־20 דקות מהעיר להרים. תחנות רכבל הפוניקולר תוכננו על ידי זהא חדיד.', en: 'A chain of lifts straight from central Innsbruck to the Hafelekar at 2,256 m – about 20 minutes from city to peaks. The funicular stations were designed by Zaha Hadid.' },
    tip: { he: 'קנו את Innsbruck Card – היא כוללת עלייה אחת ועוד הרבה אתרים. ביום צלול רואים עד איטליה.', en: 'The Innsbruck Card includes one ride and many other sights. On a clear day you can see toward Italy.' },
    book: 'no',
    ticketIls: { low: 170, high: 210 }
  },
  'austrian-alps|Golden Roof & Innsbruck Old Town': {
    about: { he: 'העיר העתיקה של אינסברוק, עם בתים צבעוניים מימי הביניים, קשתות ובתי קפה והרים בכל פינה. במרכזה ״הגג המוזהב״ – מרפסת מלכותית מ־1500 עם 2,657 רעפי נחושת מוזהבים.', en: 'Innsbruck’s Old Town of colourful medieval houses, arcades, cafés and mountain views at every turn, centred on the Golden Roof – a royal balcony from 1500 with 2,657 gilded copper tiles.' },
    tip: { he: 'עלו למגדל העיר שליד הגג לנוף על הגגות. בערב העיר העתיקה שקטה ויפה.', en: 'Climb the City Tower beside the Golden Roof for a rooftop view. The Old Town is lovely and quiet in the evening.' },
    book: 'no',
    ticketIls: { low: 0, high: 40 }
  },
  'austrian-alps|Ambras Castle': {
    about: { he: 'טירת רנסנס על גבעה מעל אינסברוק, עם ״חדר הפלאות והאמנות״ – אוסף מוזר ומרתק של הארכידוכס פרדיננד השני, אולם ספרדי מפואר, שריונות וגן גדול עם טווסים.', en: 'A Renaissance castle above Innsbruck with Archduke Ferdinand II’s Chamber of Art and Curiosities, a magnificent Spanish Hall, armour collections and a big park with peacocks.' },
    tip: { he: 'האולם הספרדי הוא גולת הכותרת – לא לפספס. הגן חינם ומצוין לפיקניק.', en: 'The Spanish Hall is the highlight – don’t miss it. The park is free and great for a picnic.' },
    book: 'no',
    ticketIls: { low: 55, high: 75 }
  },
  'austrian-alps|Bergisel Ski Jump': {
    about: { he: 'מקפצת סקי אולימפית בעיצוב של זהא חדיד, על גבעה מעל אינסברוק. עולים במעלית משופעת לראש המגדל, ומשם יש נוף על העיר והעמק – ולפעמים רואים קופצים מתאמנים.', en: 'An Olympic ski jump designed by Zaha Hadid on a hill above Innsbruck. An inclined lift climbs to the top of the tower for views over the city and valley – sometimes with jumpers training.' },
    tip: { he: 'בית הקפה בראש המגדל מושלם לקפה עם נוף. הכרטיס כלול ב־Innsbruck Card.', en: 'The café at the top is perfect for coffee with a view. Entry is included in the Innsbruck Card.' },
    book: 'no',
    ticketIls: { low: 40, high: 55 }
  },
  'austrian-alps|Swarovski Crystal Worlds': {
    about: { he: '״חדרי פלא״ של אמנות קריסטלים בוואטנס, ליד אינסברוק. נכנסים דרך ראש ענק עם מפל, ובפנים יש מיצבים של אמנים, גן גדול ומגרש משחקים מרשים.', en: 'A set of “Chambers of Wonder” built around crystal art in Wattens near Innsbruck. You enter through a giant grass-covered head with a waterfall, then explore artist installations, gardens and an impressive playground.' },
    tip: { he: 'יש הסעה מאינסברוק. מגרש המשחקים והגן מעולים לילדים – הקדישו להם זמן.', en: 'A shuttle runs from Innsbruck. The playground and gardens are great for kids – allow time for them.' },
    book: 'no',
    ticketIls: { low: 85, high: 110 }
  },
  'austrian-alps|Kitzbühel town & the Hahnenkamm': {
    about: { he: 'עיירת אלפים יוקרתית עם בתים צבעוניים, חנויות ובתי קפה. מעליה הר האנקאם, שבו נערך בכל ינואר מרוץ הסקי ה״שטרייף״ – מהמפחידים בעולם. בקיץ עולים ברכבל להליכות.', en: 'An upmarket Alpine town of painted houses, shops and cafés, below the Hahnenkamm, home each January to the Streif – one of the world’s scariest downhill races. In summer the gondola serves hiking trails.' },
    tip: { he: 'עלו ברכבל וראו את קו הזינוק של השטרייף מקרוב. העיירה עצמה נעימה לשיטוט של שעה–שעתיים.', en: 'Ride up to see the Streif start gate up close. The town itself makes a pleasant hour or two of strolling.' },
    book: 'no',
    ticketIls: { low: 0, high: 170 }
  },
  'austrian-alps|Salzburg Old Town & Hohensalzburg Fortress': {
    about: { he: 'עיר בארוקית יפהפייה, עיר הולדתו של מוצרט, עם רחוב גטריידה הצר וכנסיות מפוארות. מעליה המבצר הוהנזלצבורג, מהגדולים באירופה, שאליו עולים בפוניקולר לנוף על העיר.', en: 'A beautiful Baroque city, Mozart’s birthplace, with narrow Getreidegasse and grand churches, crowned by Hohensalzburg, one of Europe’s largest fortresses, reached by funicular for city views.' },
    tip: { he: 'גני מירבל, שבהם צולם ״צלילי המוזיקה״, חינמיים. ה־Salzburg Card משתלמת אם מבקרים בכמה מוזיאונים.', en: 'The Mirabell Gardens, seen in The Sound of Music, are free. The Salzburg Card pays off if you visit several museums.' },
    book: 'no',
    ticketIls: { low: 0, high: 100 }
  },
  'austrian-alps|Zell am See and its lake': {
    about: { he: 'עיירת נופש על שפת אגם צלול בין הרים, עם טיילת, סירות ורחצה בקיץ. ברכבל עולים להר שמיטנהוהה לנוף על האגם ועל הרי הוהה טאוארן.', en: 'A resort town on a clear mountain lake, with a promenade, boats and summer swimming. A cable car climbs the Schmittenhöhe for views over the lake and the Hohe Tauern peaks.' },
    tip: { he: 'שייט קצר על האגם או שכירת סירת פדלים – הדרך הכי טובה ליהנות. בקיץ המים מספיק חמימים לשחייה.', en: 'A short lake cruise or a pedal boat is the best way to enjoy it. In summer the water is warm enough to swim.' },
    book: 'no',
    ticketIls: { low: 0, high: 150 }
  },
  'austrian-alps|Krimml Waterfalls (mainly summer)': {
    about: { he: 'המפלים הגבוהים באוסטריה, שנופלים בשלוש מדרגות לגובה כולל של כ־380 מטר. שביל מטפס לאורכם עם תצפיות, ומהמים עולה רסס קריר.', en: 'Austria’s highest waterfalls, dropping in three tiers about 380 metres in total. A trail climbs alongside with viewpoints, cooled by the spray.' },
    tip: { he: 'הנקודות התחתונות קרובות – אפשר להסתפק בחצי שעה. לטיפוס עד למעלה צריך כשעה וחצי לכל כיוון.', en: 'The lower viewpoints are close – half an hour is enough. Climbing to the top takes about 1.5 hours each way.' },
    book: 'no',
    ticketIls: { low: 15, high: 35 }
  },
  'austrian-alps|Grossglockner High Alpine Road (May–October)': {
    about: { he: 'כביש הרים מפורסם של כ־48 ק״מ, עם 36 סיבובי פרסה, שמגיע לגובה של יותר מ־2,500 מטר. בתצפית ״קייזר פרנץ יוזף הוהה״ רואים את הגרוסגלוקנר – ההר הגבוה באוסטריה – ואת קרחון פסטרצה.', en: 'A famous mountain road of about 48 km and 36 hairpins climbing above 2,500 m. At the Kaiser-Franz-Josefs-Höhe lookout you face the Grossglockner, Austria’s highest peak, and the Pasterze Glacier.' },
    tip: { he: 'משלמים אגרה לפי רכב. צאו מוקדם ובדקו תחזית – בעננים לא רואים את ההר.', en: 'The toll is per car. Start early and check the forecast – in cloud the peak disappears.' },
    book: 'no',
    ticketIls: { low: 40, high: 180 }
  },
  'austrian-alps|Eisriesenwelt ice cave (May–October)': {
    about: { he: 'מערת הקרח הגדולה בעולם, בצלע הר מעל ורפן. בסיור מודרך עם מנורות קרביד עולים במאות מדרגות בין מפלי קרח קפואים ואולמות ענקיים.', en: 'The world’s largest ice cave, in a mountainside above Werfen. A guided tour by carbide lamp climbs hundreds of steps past frozen icefalls and vast halls.' },
    tip: { he: 'בפנים קר מאוד גם באוגוסט – מעיל וכובע. אסור לצלם בתוך המערה. ההליכה מהחניה תלולה.', en: 'It’s freezing inside even in August – bring a coat and hat. No photos inside the cave. The walk up from the car park is steep.' },
    book: 'recommended',
    ticketIls: { low: 120, high: 170 }
  },
  // ── Iceland ──
  'iceland|Hallgrímskirkja': {
    about: { he: 'הכנסייה הגבוהה באיסלנד, בעיצוב שמזכיר עמודי בזלת. בפנים יש עוגב ענק, ומהמגדל – במעלית – נשקף נוף על הגגות הצבעוניים של רייקיאוויק.', en: 'Iceland’s tallest church, designed to evoke basalt columns, with a huge organ inside and a lift up the tower for views over Reykjavík’s colourful roofs.' },
    tip: { he: 'הכניסה לכנסייה חינם; המעלית למגדל בתשלום קטן. בזמן טקסים המגדל סגור.', en: 'The church is free; the tower lift costs a little. The tower closes during services.' },
    book: 'no',
    ticketIls: { low: 0, high: 50 }
  },
  'iceland|Harpa Concert Hall': {
    about: { he: 'אולם קונצרטים על שפת הנמל, עם חזית של משושי זכוכית שמשנים צבע עם האור. אפשר להיכנס לטייל בלובי בחינם, או לראות קונצרט או מופע.', en: 'A harbourfront concert hall whose façade of glass hexagons shifts colour with the light. Wander the lobby for free or catch a concert or show.' },
    tip: { he: 'עלו לקומות העליונות בלובי לנוף על הנמל וההרים. בערב החזית מוארת.', en: 'Go up to the top lobby floors for harbour and mountain views. At night the façade lights up.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'iceland|Þingvellir National Park': {
    about: { he: 'עמק השבר בין הלוחות הטקטוניים של אמריקה ואירופה – הולכים ממש בין קירות סלע. כאן גם התכנס הפרלמנט האיסלנדי הראשון בשנת 930. חלק מ״מעגל הזהב״.', en: 'The rift valley between the North American and Eurasian plates, where you walk between rock walls. Iceland’s first parliament met here in 930. Part of the Golden Circle.' },
    tip: { he: 'משלמים על חניה. לחוויה מיוחדת: שנורקל בסדק סילפרה במים צלולים להפליא – בהזמנה מראש ובתשלום נפרד.', en: 'Parking is paid. For something special, snorkel the crystal-clear Silfra fissure – pre-booked and paid separately.' },
    book: 'no',
    ticketIls: { low: 0, high: 30 }
  },
  'iceland|Geysir & Strokkur': {
    about: { he: 'שדה גיאותרמי עם בריכות מהבילות. הגייזר הגדול גייסיר – שנתן את שמו לכל הגייזרים – כמעט רדום, אבל שטרוקור הסמוך פורץ גבוה כל כמה דקות.', en: 'A geothermal field of steaming pools. Great Geysir, which gave all geysers their name, is mostly dormant, but neighbouring Strokkur shoots up every few minutes.' },
    tip: { he: 'עמדו עם הגב לרוח כדי לא להירטב. המים רותחים – אל תעברו את החבלים.', en: 'Stand with the wind at your back to stay dry. The water is boiling – stay behind the ropes.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'iceland|Gullfoss': {
    about: { he: '״מפל הזהב״ – מפל אדיר שנופל בשתי מדרגות לקניון עמוק. שבילים ומרפסות מובילים קרוב מאוד למים, ובימי שמש נוצרות קשתות בענן ברסס.', en: 'The “Golden Falls”: a mighty two-tier waterfall plunging into a deep canyon. Paths and platforms take you close to the water, and sunny days bring rainbows in the spray.' },
    tip: { he: 'הביאו מעיל גשם – השביל התחתון רטוב. בחורף חלק מהשבילים סגורים בגלל קרח.', en: 'Bring a rain jacket – the lower path gets soaked. In winter some paths close for ice.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'iceland|Seljalandsfoss': {
    about: { he: 'מפל דק וגבוה של כ־60 מטר, שאפשר ללכת מאחוריו בשביל שמקיף אותו. כמה מאות מטרים משם מסתתר מפל גליופרבוי בתוך נקיק.', en: 'A slender 60-metre waterfall with a path that loops right behind it. A few hundred metres away, Gljúfrabúi hides inside a narrow gorge.' },
    tip: { he: 'תרטבו – מעיל עמיד ונעליים עם אחיזה טובה. אל תפספסו את גליופרבוי – נכנסים אליו דרך הנחל.', en: 'You’ll get wet – waterproof jacket and grippy shoes. Don’t miss Gljúfrabúi, reached by wading into the stream.' },
    book: 'no',
    ticketIls: { low: 0, high: 30 }
  },
  'iceland|Skógafoss': {
    about: { he: 'מפל רחב ועוצמתי בגובה כ־60 מטר, שאפשר להגיע עד לבסיס שלו. מדרגות לצידו מטפסות לתצפית עליונה, ומשם מתחיל שביל לאורך הנהר עם עוד מפלים.', en: 'A wide, powerful 60-metre waterfall you can walk right up to. Stairs alongside climb to a top viewpoint, where a trail follows the river past more falls.' },
    tip: { he: 'ביום שמש יש כמעט תמיד קשת בענן. המדרגות למעלה – כ־500 – שוות את המאמץ.', en: 'On sunny days there’s almost always a rainbow. The roughly 500 steps to the top are worth it.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'iceland|Reynisfjara beach': {
    about: { he: 'חוף חול שחור וולקני ליד ויק, עם עמודי בזלת משושים, מערה ומגדלי סלע שבולטים מהים. אחד הנופים הדרמטיים של איסלנד.', en: 'A black volcanic sand beach near Vík with hexagonal basalt columns, a cave and sea stacks rising from the waves – one of Iceland’s most dramatic scenes.' },
    tip: { he: 'גלים גבוהים מגיעים כאן בהפתעה – שמרו מרחק מקו המים ואל תפנו גב לים.', en: 'Big waves arrive here without warning – keep well back from the water and never turn your back to the sea.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'iceland|Jökulsárlón glacier lagoon': {
    about: { he: 'לגונה שבה גושי קרח כחולים ולבנים מתנתקים מהקרחון ושטים לאט אל הים. מעבר לכביש נמצא ״חוף היהלומים״ – חול שחור זרוע גושי קרח נוצצים.', en: 'A lagoon where blue and white icebergs break off the glacier and drift slowly to the sea. Across the road is Diamond Beach, black sand scattered with glittering ice.' },
    tip: { he: 'שייט בסירת אמפיבית או זודיאק מתקרב לגושים. כלבי ים נראים לעתים קרובות בפתח הלגונה.', en: 'An amphibian or Zodiac boat tour gets you close to the ice. Seals are often seen at the lagoon mouth.' },
    book: 'no',
    ticketIls: { low: 0, high: 350 }
  },
  'iceland|Blue Lagoon': {
    about: { he: 'ספא גיאותרמי בתוך שדה לבה, עם מים חמימים בצבע תכלת חלבי, עשירים בסיליקה ומינרלים. הכרטיס כולל מסכת בוץ לבן, ויש גם משקה בבר שבתוך הבריכה.', en: 'A geothermal spa in a lava field, with warm milky-blue water rich in silica and minerals. Tickets include a white silica mud mask, and there’s a swim-up bar.' },
    tip: { he: 'קרוב לשדה התעופה – שבצו אותו ביום הנחיתה או ההמראה. מרחו מרכך בשיער לפני הכניסה, המים מייבשים.', en: 'It’s near the airport – slot it in on arrival or departure day. Put conditioner in your hair first; the water dries it out.' },
    book: 'required',
    ticketIls: { low: 250, high: 500 }
  },
  'iceland|Sky Lagoon': {
    about: { he: 'לגונה גיאותרמית חדשה על שפת האוקיינוס, דקות מרייקיאוויק, עם בריכת אינסוף שמשקיפה על הים. ״הטקס בשבעה שלבים״ כולל סאונה, טבילה קרה וקרצוף גוף.', en: 'A newer geothermal lagoon on the ocean’s edge minutes from Reykjavík, with an infinity pool facing the sea. Its seven-step ritual includes a sauna, cold plunge and body scrub.' },
    tip: { he: 'קרוב יותר לעיר מהלגונה הכחולה. בשקיעה או בערבי חורף, עם סיכוי לזוהר צפוני – קסום.', en: 'Closer to town than the Blue Lagoon. At sunset or on winter evenings, with a chance of aurora, it’s magical.' },
    book: 'required',
    ticketIls: { low: 270, high: 450 }
  },
  'iceland|Whale watching from Húsavík': {
    about: { he: 'עיירת דייגים בצפון איסלנד, הנחשבת לבירת צפיית הלווייתנים של אירופה. בשייט של כשלוש שעות רואים לווייתנים גדולי סנפיר, דולפינים ולפעמים לווייתן כחול.', en: 'A northern fishing town known as Europe’s whale-watching capital. On a roughly three-hour trip you may see humpbacks, dolphins and sometimes a blue whale.' },
    tip: { he: 'הקיץ הוא העונה הטובה ביותר. גם ביום חם קר על הסיפון – החברות מחלקות סרבלים חמים.', en: 'Summer is the best season. It’s cold on deck even on warm days – operators hand out warm overalls.' },
    book: 'recommended',
    ticketIls: { low: 300, high: 450 }
  },
  'iceland|Lake Mývatn area & Mývatn Nature Baths': {
    about: { he: 'אזור געשי מגוון סביב אגם: מכתשים, תצורות לבה מוזרות בדימובורגיר, שדה הגופרית המהביל הוורר, ובסוף היום – רחצה במרחצאות הטבעיים, גרסה שקטה וזולה יותר של הלגונה הכחולה.', en: 'A varied volcanic area around a lake: craters, the odd lava formations of Dimmuborgir, the steaming Hverir sulphur field and, to finish, a soak in the Nature Baths – a calmer, cheaper Blue Lagoon.' },
    tip: { he: 'בקיץ יש באזור נחילי זבובונים – רשת ראש עוזרת. הזמינו את המרחצאות מראש.', en: 'In summer midge swarms gather – a head net helps. Pre-book the Nature Baths.' },
    book: 'recommended',
    ticketIls: { low: 0, high: 220 }
  },
  // ── Norway – fjords ──
  'norway-fjords|Bryggen': {
    about: { he: 'הרציף ההיסטורי של ברגן, שורה של בתי עץ צבעוניים ועקומים מתקופת סוחרי הליגה ההנזאית, באתר מורשת עולמית. בין הבתים יש סמטאות עץ צרות, סדנאות וחנויות.', en: 'Bergen’s historic wharf, a row of colourful, leaning wooden buildings from the Hanseatic merchants, a World Heritage Site. Narrow wooden alleys between them hide workshops and shops.' },
    tip: { he: 'היכנסו לסמטאות שמאחורי החזיתות – שם הקסם. מוזיאון הליגה ההנזאית מסביר את ההיסטוריה.', en: 'Go into the passages behind the façades – that’s where the magic is. The Hanseatic Museum explains the history.' },
    book: 'no',
    ticketIls: { low: 0, high: 70 }
  },
  'norway-fjords|Fløibanen funicular & Mount Fløyen': {
    about: { he: 'רכבל פוניקולר שעולה ממרכז ברגן להר פלויין תוך כמה דקות. למעלה יש תצפית על העיר, הנמל והפיורדים, אגם קטן, שבילי יער ומגרש משחקים.', en: 'A funicular from central Bergen up Mount Fløyen in minutes, with views over the city, harbour and fjords, plus a small lake, forest trails and a playground.' },
    tip: { he: 'עלו ברכבל ורדו ברגל בשביל היער – כ־40 דקות נעימות. בקיץ התור ארוך, קנו כרטיס אונליין.', en: 'Ride up and walk down through the forest – about 40 pleasant minutes. In summer the queue is long; buy online.' },
    book: 'no',
    ticketIls: { low: 45, high: 65 }
  },
  'norway-fjords|Bergen Fish Market': {
    about: { he: 'שוק דגים ופירות ים על שפת הנמל, עם סלמון, סרטני מלך, שרימפס ודגים מעושנים, ומסעדות שמבשלות במקום. מקום טוב לטעום פירות ים נורווגיים.', en: 'A harbourside fish market selling salmon, king crab, shrimp and smoked fish, with restaurants cooking on the spot – a good place to taste Norwegian seafood.' },
    tip: { he: 'המחירים גבוהים – בדקו מחיר לפני שמזמינים. כריך שרימפס או סלמון הוא האופציה הזולה.', en: 'Prices are steep – check before ordering. A shrimp or salmon sandwich is the budget choice.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'norway-fjords|Mount Ulriken': {
    about: { he: 'הגבוה מבין שבעת ההרים של ברגן, שאליו עולים ברכבל. מהפסגה יש נוף רחב על העיר, האיים והפיורדים, ולמיטיבי לכת – מסלול רכס יפה עד פלויין.', en: 'The highest of Bergen’s seven mountains, reached by cable car, with sweeping views of the city, islands and fjords – and for keen hikers, a beautiful ridge trail to Fløyen.' },
    tip: { he: 'מסלול ״וידן״ לפלויין לוקח כ־5–6 שעות ומצריך מזג אוויר טוב. יש אוטובוס הסעה מהמרכז לרכבל.', en: 'The Vidden trail to Fløyen takes 5–6 hours and needs good weather. A shuttle bus runs from the centre to the cable car.' },
    book: 'no',
    ticketIls: { low: 90, high: 150 }
  },
  'norway-fjords|Troldhaugen — Grieg’s home': {
    about: { he: 'הבית של המלחין אדוורד גריג, על שפת אגם ליד ברגן. רואים את הבית, את בקתת ההלחנה הקטנה ואת קברו בסלע, ובאולם הקונצרטים מתקיימים רסיטלים לפסנתר.', en: 'Composer Edvard Grieg’s lakeside home near Bergen. See the villa, his little composing hut and his tomb in the rock, and catch a piano recital in the concert hall.' },
    tip: { he: 'בקיץ מתקיימים קונצרטי צהריים קצרים – בחרו כרטיס שכולל אותם. מגיעים ברכבת הקלה ועוד הליכה של כ־20 דקות.', en: 'In summer there are short lunchtime concerts – pick a ticket that includes one. Take the light rail plus a 20-minute walk.' },
    book: 'no',
    ticketIls: { low: 55, high: 120 }
  },
  'norway-fjords|Flåm Railway': {
    about: { he: 'אחת ממסילות הרכבת התלולות והיפות בעולם: כ־20 ק״מ מהמישור ההררי במירדל עד לפלאם שעל הפיורד, עם ירידה של כ־860 מטר, מנהרות, מפלים ועצירה ליד מפל קיוספוסן.', en: 'One of the world’s steepest and most scenic railways: about 20 km from Myrdal on the mountain plateau down to Flåm on the fjord, dropping some 860 m past tunnels, waterfalls and a stop at Kjosfossen.' },
    tip: { he: 'שבו בצד שמאל בירידה למפלים ולנוף הטוב. בקיץ הרכבות מלאות – הזמינו מראש.', en: 'Sit on the left going down for the best views. Summer trains fill up – book ahead.' },
    book: 'recommended',
    ticketIls: { low: 220, high: 320 }
  },
  'norway-fjords|Nærøyfjord cruise': {
    about: { he: 'שייט בפיורד הצר ביותר בנורווגיה, אתר מורשת עולמית, בין קירות הרים תלולים בגובה מאות מטרים, מפלים וכפרים זעירים. חלק מהסירות חשמליות ושקטות.', en: 'A cruise through Norway’s narrowest fjord, a World Heritage Site, between mountain walls hundreds of metres high, waterfalls and tiny villages. Some boats are electric and near silent.' },
    tip: { he: 'השייט מפלאם לגודוואנגן משתלב היטב עם רכבת פלאם במסלול ״נורווגיה בקליפת אגוז״. עמדו על הסיפון העליון.', en: 'The Flåm–Gudvangen cruise links neatly with the Flåm Railway on the “Norway in a Nutshell” route. Stand on the top deck.' },
    book: 'recommended',
    ticketIls: { low: 220, high: 340 }
  },
  'norway-fjords|Stegastein viewpoint': {
    about: { he: 'מרפסת תצפית מעץ ומזכוכית שבולטת 30 מטר מצלע ההר, כ־650 מטר מעל פיורד אאורלנד. אחת התצפיות הדרמטיות בנורווגיה.', en: 'A wood-and-glass platform jutting 30 metres from the mountainside, some 650 m above the Aurlandsfjord – one of Norway’s most dramatic viewpoints.' },
    tip: { he: 'מפלאם יש אוטובוס תיירים לתצפית. ברכב הכביש צר ומפותל – סעו לאט.', en: 'A tourist bus runs up from Flåm. By car the road is narrow and twisty – drive slowly.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'norway-fjords|Borgund Stave Church': {
    about: { he: 'כנסיית עץ מימי הביניים, מסביבות 1200, מהשמורות ביותר בנורווגיה, עם גגות מדורגים, ראשי דרקונים ומגולפים עתיקים. ליד יש מרכז מבקרים על כנסיות העץ.', en: 'A medieval wooden stave church from around 1200, one of Norway’s best preserved, with tiered roofs, dragon heads and ancient carvings, plus a visitor centre on stave churches.' },
    tip: { he: 'משלבים בקלות בנסיעה בין אוסלו לפיורדים. הביקור קצר – כ־45 דקות.', en: 'An easy stop on the drive between Oslo and the fjords. The visit is short – about 45 minutes.' },
    book: 'no',
    ticketIls: { low: 40, high: 60 }
  },
  'norway-fjords|Vøringsfossen waterfall': {
    about: { he: 'אחד המפלים המפורסמים בנורווגיה, שנופל כ־180 מטר לקניון עמוק. גשר מדרגות חדש חוצה מעל התהום ונותן מבט מרהיב ישר אל המפל.', en: 'One of Norway’s most famous waterfalls, plunging about 180 m into a deep gorge. A new stair bridge spans the chasm for a breathtaking straight-on view.' },
    tip: { he: 'התצפיות חינמיות ומרוחקות כמה דקות מהחניה. בקיץ הזרם הכי חזק.', en: 'The viewpoints are free and a few minutes from the car park. The flow is strongest in summer.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'norway-fjords|Trolltunga': {
    about: { he: '״לשון הטרול״ – לשון סלע שבולטת באוויר כ־700 מטר מעל אגם ריגדאלסוואטנט. מסלול יום ארוך וקשה של כ־20–28 ק״מ, עם תמונה מהמפורסמות בנורווגיה בסוף.', en: '“Troll’s Tongue”: a rock ledge jutting out about 700 m above Ringedalsvatnet. A long, tough 20–28 km day hike, ending in one of Norway’s most famous photos.' },
    tip: { he: 'צפו ל־10–12 שעות הליכה; צאו עם שחר. בלי מדריך – רק בעונת הקיץ (בערך יוני–ספטמבר).', en: 'Expect 10–12 hours; start at dawn. Without a guide, go only in summer season (roughly June–September).' },
    book: 'no',
    ticketIls: { low: 0, high: 70 }
  },
  'norway-fjords|Preikestolen (Pulpit Rock)': {
    about: { he: 'צוק שטוח ומרובע שמתנשא כ־600 מטר מעל ליזפיורד. המסלול של כ־8 ק״מ הלוך־חזור לוקח כ־4 שעות, עם קטעים סלעיים, והנוף מהצוק מדהים.', en: 'A flat-topped square cliff about 600 m above the Lysefjord. The roughly 8 km return hike takes around four hours over rocky stretches, and the view from the top is stunning.' },
    tip: { he: 'צאו מוקדם בבוקר או אחר הצהריים כדי להימנע מהעומס. נעלי הליכה טובות ובגדים בשכבות.', en: 'Start early morning or late afternoon to avoid the crowds. Wear good hiking shoes and layers.' },
    book: 'no',
    ticketIls: { low: 0, high: 40 }
  },
  'norway-fjords|Geirangerfjord cruise': {
    about: { he: 'שייט בפיורד מפורסם ופתלתל, אתר מורשת עולמית, בין חוות נטושות על צוקים ומפלים – ובראשם ״שבע האחיות״ ומולן ״המחזר״. הנוף מהמים מרהיב מכל זווית.', en: 'A cruise on a famous winding fjord, a World Heritage Site, past abandoned cliff-top farms and waterfalls – led by the Seven Sisters, with “the Suitor” opposite. Stunning from every angle.' },
    tip: { he: 'המעבורת בין הלסילט לגיירנגר היא דרך משתלמת לשלב שייט עם נסיעה. עלו גם לתצפית דלסניבה מעל הפיורד.', en: 'The Hellesylt–Geiranger ferry combines the cruise with your journey. Also drive up to the Dalsnibba viewpoint above the fjord.' },
    book: 'recommended',
    ticketIls: { low: 140, high: 280 }
  },
  // ── Copenhagen ──
  'copenhagen|Nyhavn': {
    about: { he: 'תעלה מהמאה ה־17 עם בתים צבעוניים, סירות עץ ישנות ומסעדות על הרציף. אחד הנופים המצולמים בקופנהגן, והנקודה שממנה יוצאים רוב שייטי התעלות.', en: 'A 17th-century canal lined with colourful townhouses, old wooden boats and quayside restaurants – one of Copenhagen’s most photographed views, and where most canal tours start.' },
    tip: { he: 'האוכל ברציף יקר – קנו משקה ושבו על שפת התעלה כמו המקומיים. שייט תעלות של שעה נותן סקירה מצוינת של העיר.', en: 'Quayside dining is pricey – grab a drink and sit on the canal edge like locals. An hour-long canal tour is a great overview.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'copenhagen|Tivoli Gardens': {
    about: { he: 'גן שעשועים מ־1843 במרכז העיר, מהוותיקים בעולם, עם גנים, אגם, אלפי נורות, מתקנים קלאסיים ורכבת הרים מעץ משנת 1914. קסום במיוחד בערב.', en: 'An 1843 amusement park in the city centre, one of the world’s oldest, with gardens, a lake, thousands of lights, classic rides and a 1914 wooden roller coaster. Magical in the evening.' },
    tip: { he: 'הכניסה לגן לחוד והמתקנים לחוד – לילדים משתלם צמיד מתקנים. בואו לקראת ערב, כשהאורות נדלקים.', en: 'Entry and rides are priced separately – for kids a ride pass pays off. Come toward evening when the lights come on.' },
    book: 'no',
    ticketIls: { low: 85, high: 280 },
    hours: { he: 'פתוח בעונות (קיץ, ליל כל הקדושים וחג המולד) – לא כל השנה', en: 'Open in seasons (summer, Halloween and Christmas) – not year-round' }
  },
  'copenhagen|Rosenborg Castle': {
    about: { he: 'טירת רנסנס מהמאה ה־17, בתוך גן המלך, שבה מוצגים חדרי המלוכה המקוריים ובמרתף – תכשיטי הכתר ואוצרות המלוכה של דנמרק.', en: 'A 17th-century Renaissance castle in the King’s Garden, displaying original royal rooms and, in the basement, the Danish crown jewels and royal regalia.' },
    tip: { he: 'בקיץ הזמינו כניסה בשעה קבועה. גן המלך חינם ונהדר לפיקניק.', en: 'In summer book a timed entry. The King’s Garden is free and lovely for a picnic.' },
    book: 'recommended',
    ticketIls: { low: 70, high: 90 }
  },
  'copenhagen|Amalienborg Palace & Changing of the Guard': {
    about: { he: 'ארבעה ארמונות בארוקיים סביב כיכר מתומנת – מעון משפחת המלוכה הדנית. בכל יום בצהריים מתקיים טקס חילופי המשמרות, אחרי צעידה של המשמר מטירת רוזנבורג.', en: 'Four Baroque palaces around an octagonal square – home of the Danish royal family. Every day at noon the guard changes, after marching from Rosenborg Castle.' },
    tip: { he: 'הגיעו כמה דקות לפני 12:00. אחר כך המשיכו לכנסיית השיש שממול, עם הכיפה הירוקה.', en: 'Arrive a few minutes before noon. Then continue to the Marble Church opposite with its green dome.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'copenhagen|Christiansborg Palace': {
    about: { he: 'ארמון על אי קטן בלב העיר, שבו יושבים הפרלמנט וראש הממשלה. אפשר לבקר באולמות הקבלה המלכותיים, בשרידי הטירה מימי הביניים במרתף ובאורוות המלכותיות.', en: 'A palace on a small central island housing the Danish parliament and prime minister’s office. Visit the Royal Reception Rooms, medieval castle ruins in the basement and the Royal Stables.' },
    tip: { he: 'העלייה למגדל הארמון – הגבוה בעיר – חינם, עם נוף מצוין. צפו לבדיקה ביטחונית קצרה.', en: 'The palace tower – the city’s tallest – is free with a great view. Expect a brief security check.' },
    book: 'no',
    ticketIls: { low: 0, high: 100 }
  },
  'copenhagen|The Little Mermaid': {
    about: { he: 'פסל ברונזה קטן מ־1913 של בת הים מהאגדה של הנס כריסטיאן אנדרסן, יושבת על סלע בנמל. הוא קטן ממה שרוב האנשים מצפים, אבל זה סמל העיר.', en: 'A small 1913 bronze of Hans Christian Andersen’s mermaid, sitting on a rock in the harbour. Smaller than most expect, but the symbol of the city.' },
    tip: { he: 'בואו מוקדם בבוקר, לפני האוטובוסים. שלבו עם מצודת קסטלט שליד.', en: 'Come early before the tour buses. Combine with the nearby Kastellet fortress.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'copenhagen|The Round Tower': {
    about: { he: 'מגדל תצפית מהמאה ה־17 שבנה המלך כריסטיאן הרביעי כמצפה כוכבים. עולים בו ברמפה ספירלית בלי מדרגות עד לתצפית על גגות העיר העתיקה.', en: 'A 17th-century tower built by King Christian IV as an observatory. A spiral ramp – no stairs – winds up to views over the Old Town rooftops.' },
    tip: { he: 'מתאים גם לעגלות ולילדים בזכות הרמפה. באמצע הדרך יש אולם תערוכות בספרייה הישנה.', en: 'The ramp makes it stroller- and kid-friendly. Halfway up is an exhibition hall in the old library.' },
    book: 'no',
    ticketIls: { low: 20, high: 30 }
  },
  'copenhagen|Church of Our Saviour spire': {
    about: { he: 'כנסייה בכריסטיאנסהאון עם צריח מפותל ומוזהב. 150 המדרגות האחרונות מטפסות מבחוץ סביב הצריח, עם נוף מסחרר על העיר והנמל.', en: 'A Christianshavn church with a twisting gilded spire. The final 150 steps spiral around the outside of the spire, with dizzying views over the city and harbour.' },
    tip: { he: 'לא למי שפוחד מגבהים. ברוח חזקה או בגשם המגדל נסגר – בדקו לפני.', en: 'Not for anyone afraid of heights. The tower closes in strong wind or rain – check first.' },
    book: 'no',
    ticketIls: { low: 30, high: 50 }
  },
  'copenhagen|Torvehallerne market': {
    about: { he: 'שני אולמות זכוכית של שוק אוכל איכותי, עם כ־60 דוכנים: סמורברוד – כריכים פתוחים דניים – דגים, גבינות, מאפים, קפה ואוכל מכל העולם.', en: 'Two glass market halls with around 60 food stalls: smørrebrød (Danish open sandwiches), fish, cheese, pastries, coffee and food from around the world.' },
    tip: { he: 'נסו סמורברוד ומאפה דני טרי. מקום מצוין לצהריים מהירים ליד תחנת נורפורט.', en: 'Try smørrebrød and a fresh Danish pastry. A great quick lunch near Nørreport station.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'copenhagen|Reffen street food market': {
    about: { he: 'שוק אוכל רחוב גדול על המים, במספנה לשעבר, עם עשרות דוכנים במכולות: אוכל מכל העולם, בירה מקומית, מוזיקה וכיסאות נוח מול הנמל.', en: 'A big waterfront street-food market in a former shipyard, with dozens of stalls in shipping containers – global food, local beer, music and deckchairs facing the harbour.' },
    tip: { he: 'פועל בעיקר בעונה החמה – בדקו מועדים. הגיעו במעבורת הנמל ובואו לשקיעה.', en: 'It mainly runs in the warmer months – check dates. Arrive by harbour bus and come for sunset.' },
    book: 'no',
    ticketIls: { low: 0, high: 0 }
  },
  'copenhagen|Ny Carlsberg Glyptotek': {
    about: { he: 'מוזיאון שהקים מייסד מבשלת קרלסברג, עם פסלים עתיקים מיוון, רומא ומצרים, יצירות של רודן ואימפרסיוניסטים צרפתים. במרכזו גן חורף עם דקלים וכיפת זכוכית.', en: 'A museum founded by the Carlsberg brewer, with ancient Greek, Roman and Egyptian sculpture, Rodin and French Impressionists, built around a palm-filled glass-domed winter garden.' },
    tip: { he: 'שבו לקפה בגן החורף. עלו לגג לנוף על טיבולי.', en: 'Have coffee in the winter garden. Go up to the roof terrace for views over Tivoli.' },
    book: 'no',
    ticketIls: { low: 60, high: 75 },
    hours: { he: 'סגור בימי שני', en: 'Closed Mondays' }
  },
  'copenhagen|National Museum of Denmark': {
    about: { he: 'המוזיאון הגדול לתולדות דנמרק, מתקופת האבן דרך הוויקינגים ועד היום. יש בו את מרכבת השמש העתיקה, אוצרות ויקינגים ותערוכה נהדרת לילדים.', en: 'Denmark’s main history museum, from the Stone Age through the Vikings to today, with the ancient Sun Chariot, Viking treasures and a great children’s museum.' },
    tip: { he: 'התחילו בגלריות הפרה־היסטוריה והוויקינגים – הן הכי מרשימות. מוזיאון הילדים מעולה ליום גשום.', en: 'Start with the prehistory and Viking galleries – the most impressive. The children’s museum is perfect on a rainy day.' },
    book: 'no',
    ticketIls: { low: 60, high: 75 }
  },
  'copenhagen|Danish Jewish Museum': {
    about: { he: 'מוזיאון קטן שתכנן דניאל ליבסקינד בתוך מבנה ישן של הספרייה המלכותית. הוא מספר את סיפור יהודי דנמרק, כולל ההצלה ב־1943, כשרובם הוברחו בסירות לשוודיה.', en: 'A small museum designed by Daniel Libeskind inside an old Royal Library building, telling the story of Danish Jews, including the 1943 rescue, when most were ferried by boat to Sweden.' },
    tip: { he: 'שלבו עם ״היהלום השחור״ – הבניין המודרני של הספרייה המלכותית ממש לידו.', en: 'Combine with the Black Diamond, the Royal Library’s modern building right next door.' },
    book: 'no',
    ticketIls: { low: 40, high: 60 }
  }
};
