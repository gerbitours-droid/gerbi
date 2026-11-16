// Brochure details per attraction (spec 29) – key: `${destinationId}|${attraction name.en}`. Prices are rough per-adult estimates in ILS.
export default {
  // ───── Maldives ─────
  'maldives|Snorkelling the resort’s house reef': {
    about: { he: 'השונית שמקיפה את האי של המלון, במרחק כמה צעדים מהחוף או מהווילה. נכנסים עם מסכה ושנורקל ורואים דגי תוכי, צבי ים, כרישי שונית קטנים ולא מזיקים ואלמוגים צבעוניים.', en: 'The coral reef ringing your resort island, a few steps from the beach or your villa. Mask up and you’ll see parrotfish, turtles, small harmless reef sharks and colourful coral.' },
    tip: { he: 'בררו בקבלה איפה נקודות הכניסה לשונית ומתי הגאות; שנורקלו בבוקר כשהמים שקטים ושקופים. השתמשו בקרם הגנה ידידותי לשונית.', en: 'Ask reception for the reef entry points and tide times; go in the morning when water is calm and clear. Use reef-safe sunscreen.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'maldives|Sunset dolphin cruise': {
    about: { he: 'שייט של כשעתיים בסירה מקומית (דוני) לקראת השקיעה, בחיפוש אחר להקות דולפינים מסתובבים שקופצים ליד החרטום. בדרך נהנים מהשמיים הכתומים מעל האטולים.', en: 'A two-hour ride on a local dhoni boat at sunset, searching for pods of spinner dolphins leaping by the bow, with orange skies over the atolls.' },
    tip: { he: 'שבו בחרטום כדי לראות את הדולפינים מקרוב. רוב המלונות מציעים את השייט פעם או פעמיים בשבוע – הירשמו מוקדם בחופשה.', en: 'Sit at the bow for close views. Most resorts run it once or twice a week, so sign up early in your stay.' },
    book: 'recommended', ticketIls: { low: 150, high: 350 } },
  'maldives|Manta ray dive': {
    about: { he: 'צלילה או שנורקלינג בתחנות ניקוי שאליהן מגיעות מנטות ענקיות, עם מוטת כנפיים של עד 4 מטרים. רואים אותן מרחפות לאט מעל השונית בזמן שדגים קטנים מנקים אותן.', en: 'A dive or snorkel at cleaning stations where giant manta rays, up to 4 m across, glide slowly over the reef while small fish clean them.' },
    tip: { he: 'העונה והאתרים משתנים לפי המונסון – שאלו את מרכז הצלילה איפה המנטות השבוע. בלי תעודת צלילה אפשר לרוב להצטרף כשנורקלרים.', en: 'Sites shift with the monsoon, so ask the dive centre where mantas are this week. Non-divers can usually join as snorkellers.' },
    book: 'recommended', ticketIls: { low: 250, high: 650 } },
  'maldives|Whale-shark snorkelling in South Ari': {
    about: { he: 'דרום אטול ארי הוא אחד המקומות היחידים בעולם שבו כרישי לווייתן, הדג הגדול בעולם, נראים כל השנה. שוחים לצד ענק עדין שאוכל פלנקטון ואינו מסוכן לאדם.', en: 'South Ari is one of the few places on Earth where whale sharks, the world’s largest fish, are seen year-round. You swim beside a gentle plankton-eating giant.' },
    tip: { he: 'שמרו מרחק של כ־3 מטרים ואל תגעו בכריש. התצפית לא מובטחת, אז העדיפו מפעיל שמבטיח יציאה חוזרת אם לא נמצא.', en: 'Keep about 3 m away and never touch. Sightings aren’t guaranteed, so prefer operators offering a retry if you miss out.' },
    book: 'recommended', ticketIls: { low: 300, high: 800 } },
  'maldives|Sandbank picnic': {
    about: { he: 'שייט קצר לגדת חול לבנה וחשופה באמצע הלגונה, בלי צמחייה ובלי אנשים מסביב. המלון מקים שמשייה, מגיש פיקניק או ארוחה, ואתם שוחים ומשנרקלים במים טורקיז.', en: 'A short boat ride to a bare strip of white sand in the middle of the lagoon. The resort sets up shade and a picnic while you swim in turquoise water.' },
    tip: { he: 'גדות חול מתכסות בגאות – תאמו את השעה מול הגאות. קחו כובע וקרם הגנה, אין שם צל טבעי.', en: 'Sandbanks shrink at high tide, so time it with the tides. Bring a hat and sunscreen – there’s no natural shade.' },
    book: 'required', ticketIls: { low: 350, high: 1200 } },
  'maldives|Scenic seaplane flight': {
    about: { he: 'טיסה נמוכה במטוס ימי מעל האטולים: לגונות טורקיז, שוניות בצורת טבעת ואיים זעירים שנראים מהאוויר כמו מפה חיה. לרוב זו גם ההעברה מהשדה למלון.', en: 'A low flight over the atolls in a seaplane: turquoise lagoons, ring-shaped reefs and tiny islands that look like a living map. Often doubles as your resort transfer.' },
    tip: { he: 'בקשו מושב ליד חלון; בטיסת הגעה שבו בצד שפונה לאטולים. מגבלת המשקל במזוודות קפדנית – כ־20 ק״ג.', en: 'Ask for a window seat. Luggage limits are strict (around 20 kg), so pack light.' },
    book: 'required', ticketIls: { low: 900, high: 2500 } },
  'maldives|Traditional night fishing': {
    about: { he: 'יציאה בסירת דוני אחרי השקיעה לדיג בחכה ידנית – חוט, קרס ופיתיון, כמו שהדייגים המלדיביים עושים כבר דורות. בסוף אפשר לבקש מהמטבח לבשל את השלל.', en: 'A dhoni trip after dark for handline fishing – just line, hook and bait, the way Maldivian fishermen have done it for generations. The kitchen can cook your catch.' },
    tip: { he: 'מתאים גם לילדים ולמי שמעולם לא דג. קחו שכבה דקה – ברוח בים הלילה מרגישים קריר.', en: 'Fine for kids and first-timers. Bring a light layer; it feels cool on the water at night.' },
    book: 'recommended', ticketIls: { low: 150, high: 350 } },
  'maldives|Overwater spa': {
    about: { he: 'חדרי טיפולים שבנויים על כלונסאות מעל הלגונה, לעיתים עם רצפת זכוכית שדרכה רואים דגים בזמן העיסוי. רוב התפריט מבוסס על עיסויים בסגנון באלינזי ותאילנדי.', en: 'Treatment rooms on stilts above the lagoon, sometimes with glass floor panels so you watch fish during your massage. Menus lean on Balinese and Thai styles.' },
    tip: { he: 'הזמינו בימים הראשונים – השעות הטובות נתפסות. מלונות רבים נותנים הנחה על טיפולים בשעות הבוקר.', en: 'Book early in your stay; prime slots fill up. Many resorts discount morning treatments.' },
    book: 'recommended', ticketIls: { low: 500, high: 1300 } },
  'maldives|Malé city & fish market tour': {
    about: { he: 'סיור בבירה הצפופה והקטנה: שוק הדגים שבו פורקים טונות ישר מהסירות, שוק הפירות והירקות, המסגד הישן מאבני אלמוגים והפארק של הסולטן. הצצה לחיים המקומיים מחוץ לריזורט.', en: 'A walk through the tiny, crowded capital: the fish market where tuna comes straight off the boats, the produce market, the old coral-stone mosque and Sultan Park.' },
    tip: { he: 'התלבשו בצניעות – כתפיים וברכיים מכוסות. שוק הדגים הכי פעיל אחר הצהריים כשהסירות חוזרות.', en: 'Dress modestly, shoulders and knees covered. The fish market is liveliest in the afternoon when boats return.' },
    book: 'recommended', ticketIls: { low: 150, high: 400 } },
  'maldives|Kayak & paddleboard in the lagoon': {
    about: { he: 'חתירה בקיאק שקוף או עמידה על סאפ במים רדודים ושקטים של הלגונה. מלמעלה רואים דגיגים, טריגונים קטנים ולפעמים כרישונים שחולפים מתחת.', en: 'Paddling a kayak or SUP over the shallow, calm lagoon. From above you spot small fish, baby rays and sometimes reef-shark pups gliding beneath.' },
    tip: { he: 'צאו מוקדם בבוקר לפני שהרוח מתגברת. בהרבה מלונות ציוד ללא מנוע כלול במחיר – בדקו לפני שמשלמים.', en: 'Go early before the wind picks up. Many resorts include non-motorised gear free – check before paying.' },
    book: 'no', ticketIls: { low: 0, high: 150 } },

  // ───── Bangkok ─────
  'bangkok|Grand Palace & Wat Phra Kaew': {
    about: { he: 'מתחם הארמון המלכותי מ־1782 עם גגות מוזהבים, ציורי קיר ענקיים ומקדש בודהת האזמרגד, הקדוש ביותר בתאילנד. מסתובבים בין סטופות זהב, פסלי שומרים ענקיים וחצרות מבריקות.', en: 'The royal palace complex from 1782, all gilded roofs, vast murals and the Temple of the Emerald Buddha, Thailand’s holiest. You wander past golden stupas, giant guardian statues and glittering courtyards.' },
    tip: { he: 'הגיעו בפתיחה ב־8:30 לפני הקבוצות והחום. חובה כתפיים וברכיים מכוסות. התעלמו ממי שאומר בחוץ שהארמון סגור היום – זה עוקץ ידוע.', en: 'Arrive at 8:30 opening, before groups and heat. Shoulders and knees covered. Ignore anyone outside saying it’s closed today – a classic scam.' },
    book: 'no', ticketIls: { low: 50, high: 60 } },
  'bangkok|Wat Pho — the Reclining Buddha': {
    about: { he: 'מקדש ענק ליד הארמון שבו שוכב פסל בודהה מוזהב באורך 46 מטר, עם כפות רגליים משובצות אם־הפנינה. במתחם יש מאות פסלי בודהה ובית ספר מפורסם לעיסוי תאילנדי.', en: 'A sprawling temple next to the palace housing a 46 m gilded Reclining Buddha with mother-of-pearl soles, plus hundreds of Buddha images and a renowned Thai massage school.' },
    tip: { he: 'אפשר לקבל עיסוי תאילנדי מסורתי בבית הספר שבמתחם במחיר סביר. הגיעו אחרי הארמון – זה במרחק הליכה של עשר דקות.', en: 'Get a traditional Thai massage at the temple’s own school for a fair price. It’s a 10-minute walk from the Grand Palace.' },
    book: 'no', ticketIls: { low: 30, high: 35 } },
  'bangkok|Wat Arun — Temple of Dawn': {
    about: { he: 'מקדש על הגדה המערבית של הנהר עם צריח מרכזי תלול שמכוסה פסיפס של חרסינה ושברי צלחות צבעוניים. מטפסים על מדרגות תלולות ומקבלים תצפית על הנהר והארמון.', en: 'A riverside temple whose steep central spire is covered in mosaics of coloured porcelain and broken china. Climb its steep steps for views over the river and palace.' },
    tip: { he: 'חוצים במעבורת קטנה מהמזח ליד וואט פו בכמה באט. הנוף הכי יפה של המקדש עצמו הוא מהגדה השנייה בשקיעה.', en: 'Cross on the small ferry from the pier by Wat Pho for a few baht. The best view of the temple itself is from the opposite bank at sunset.' },
    book: 'no', ticketIls: { low: 20, high: 25 } },
  'bangkok|Chatuchak Weekend Market': {
    about: { he: 'אחד משווקי סוף השבוע הגדולים בעולם, עם אלפי דוכנים של בגדים, קרמיקה, צמחים, עתיקות ואוכל רחוב. אפשר להעביר בו בקלות חצי יום ולהלך לאיבוד בין הסמטאות המקורות.', en: 'One of the world’s biggest weekend markets, with thousands of stalls selling clothes, ceramics, plants, antiques and street food. Easy to lose half a day in its covered lanes.' },
    tip: { he: 'בואו בבוקר לפני החום הכבד וצלמו את מפת השוק בכניסה. הגיעו ברכבת התחתית לתחנת Chatuchak Park.', en: 'Come in the morning before the worst heat and photograph the map at the entrance. Take the MRT to Chatuchak Park.' },
    book: 'no', ticketIls: { low: 0, high: 0 }, hours: { he: 'פעיל בעיקר בשבת וראשון', en: 'Mainly Saturday & Sunday' } },
  'bangkok|Chinatown — Yaowarat Road': {
    about: { he: 'רחוב יאוורט וסמטאותיו הם לב אוכל הרחוב של בנגקוק: שלטי ניאון, חנויות זהב, דוכני אטריות, פירות ים על הגריל ומקדשים סיניים קטנים. בערב הרחוב הופך למסעדה ענקית פתוחה.', en: 'Yaowarat and its alleys are Bangkok’s street-food heart: neon signs, gold shops, noodle stalls, grilled seafood and small Chinese temples. At night it becomes one huge open-air restaurant.' },
    tip: { he: 'בואו אחרי 18:00 ורעבים. חפשו דוכנים עם תור של מקומיים. רוב הדוכנים סגורים בימי שני.', en: 'Come after 6pm, hungry. Follow the queues of locals. Many stalls close on Mondays.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'bangkok|Chao Phraya river boat ride': {
    about: { he: 'שייט בסירות הציבוריות על הנהר הראשי של העיר, חולפים על פני מקדשים, ארמונות, גורדי שחקים ובתים על כלונסאות. זו גם הדרך הכי נוחה להגיע לאתרים של העיר העתיקה.', en: 'A ride on the public boats along the city’s main river, past temples, palaces, skyscrapers and stilt houses. Also the easiest way to reach the old-city sights.' },
    tip: { he: 'סירת הדגל הכתום זולה בהרבה מסירת התיירים הכחולה ועוצרת באותם מזחים. עלו בתחנת Sathorn ליד BTS Saphan Taksin.', en: 'The orange-flag boat is much cheaper than the blue tourist boat and stops at the same piers. Board at Sathorn pier by BTS Saphan Taksin.' },
    book: 'no', ticketIls: { low: 2, high: 20 } },
  'bangkok|Jim Thompson House': {
    about: { he: 'בית העץ של איש עסקי המשי האמריקאי שהחיה את תעשיית המשי התאילנדית ונעלם במסתוריות ב־1967. הבית מורכב משישה בתים מסורתיים עם אוסף אמנות אסייתית וגן טרופי.', en: 'The teak home of the American silk entrepreneur who revived Thai silk and vanished mysteriously in 1967: six traditional houses joined together, an Asian art collection and a tropical garden.' },
    tip: { he: 'הביקור בבית עצמו הוא רק בסיור מודרך קצר, לרוב גם באנגלית. החנות במקום מוכרת משי איכותי במחירים הוגנים.', en: 'The house itself is seen on a short guided tour, regularly in English. The shop sells quality silk at fair prices.' },
    book: 'no', ticketIls: { low: 20, high: 25 } },
  'bangkok|Lumphini Park': {
    about: { he: 'הפארק הירוק הגדול במרכז העיר, עם אגם, סירות פדלים ושבילי ריצה. בבוקר רואים מקומיים בטאי צ׳י ובערב באירובי, ולטאות מוניטור גדולות מטיילות בחופשיות ליד המים.', en: 'Central Bangkok’s big green lung, with a lake, pedal boats and jogging paths. Locals do tai chi at dawn and aerobics at dusk, and large monitor lizards roam by the water.' },
    tip: { he: 'בואו בשעות הבוקר המוקדמות או אחרי 17:00 כשקריר יותר. הלטאות לא מזיקות – פשוט אל תתקרבו.', en: 'Visit early morning or after 5pm when it’s cooler. The lizards are harmless – just give them space.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'bangkok|Khao San Road': {
    about: { he: 'רחוב התרמילאים המפורסם: ברים עם מוזיקה רועשת, דוכני פאד תאי, עיסויים ברחוב, מכונות קעקועים וחנויות מזכרות. בערב הוא הופך למסיבת רחוב ענקית.', en: 'The famous backpacker strip: loud bars, pad thai carts, street-side massages, tattoo parlours and souvenir stalls. After dark it turns into one big street party.' },
    tip: { he: 'בשביל אווירה רגועה יותר נסו את רחוב רמבוטרי הסמוך. היזהרו מבאקטים עם אלכוהול זול – הם חזקים.', en: 'For a calmer scene try neighbouring Rambuttri Road. Go easy on the cheap cocktail buckets – they’re strong.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'bangkok|Asiatique The Riverfront night market': {
    about: { he: 'שוק לילה ומתחם בילוי במחסנים ישנים על גדת הנהר, עם מאות חנויות, מסעדות וגלגל ענק. אווירה מסודרת ונעימה יותר משווקי הרחוב.', en: 'A night market and entertainment complex in old riverside warehouses, with hundreds of shops, restaurants and a big Ferris wheel. Tidier and calmer than street markets.' },
    tip: { he: 'הגיעו בשאטל־בוט החינמי ממזח Sathorn. הוא נפתח בשעות אחר הצהריים המאוחרות – אין טעם להגיע לפני השקיעה.', en: 'Take the free shuttle boat from Sathorn pier. It opens late afternoon – no point arriving before sunset.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'bangkok|The Siam shopping malls': {
    about: { he: 'שורת קניונים מחוברים בגשרים סביב תחנת סיאם: סיאם פרגון היוקרתי, MBK הזול והעממי, סנטרל וורלד הענק. גם מקלט ממוזג מהחום, עם אולמות אוכל מצוינים.', en: 'A string of malls linked by skywalks around Siam station: upmarket Siam Paragon, bargain MBK and vast CentralWorld. Also an air-conditioned escape with excellent food halls.' },
    tip: { he: 'אולם האוכל בקומת הקרקע של סיאם פרגון מצוין לארוחה מהירה. ב־MBK מתמקחים, בקניונים היוקרתיים לא.', en: 'The food hall in Siam Paragon’s lower level is great for a quick meal. Bargain at MBK, not in the upscale malls.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'bangkok|A rooftop bar with a city view': {
    about: { he: 'בנגקוק מפורסמת בברים על גגות גורדי שחקים, בגובה של 50–60 קומות מעל העיר. שותים קוקטייל מול האורות של הנהר וקו הרקיע, לרוב בשקיעה.', en: 'Bangkok is famous for bars atop skyscrapers, 50–60 floors up. Sip a cocktail above the river lights and skyline, ideally at sunset.' },
    tip: { he: 'יש קוד לבוש: בלי כפכפים ובלי מכנסיים קצרים לגברים. הגיעו לפני השקיעה כדי לתפוס מקום ליד המעקה.', en: 'Dress code applies: no flip-flops, no shorts for men. Arrive before sunset to grab a spot at the rail.' },
    book: 'recommended', ticketIls: { low: 45, high: 120 } },
  'bangkok|A Thai cooking class': {
    about: { he: 'סדנה של חצי יום שמתחילה לרוב בסיור בשוק מקומי לקניית חומרי גלם, וממשיכה בבישול 4–5 מנות כמו טום יאם, קארי ירוק ופאד תאי. בסוף אוכלים את מה שבישלתם ומקבלים מתכונים.', en: 'A half-day class that usually starts with a local market visit, then cooking 4–5 dishes like tom yum, green curry and pad thai. You eat everything and take the recipes home.' },
    tip: { he: 'ציינו מראש צמחונות או אלרגיות – רוב בתי הספר מתאימים. שיעורי בוקר כוללים בדרך כלל את סיור השוק.', en: 'Mention vegetarian needs or allergies in advance. Morning classes usually include the market tour.' },
    book: 'recommended', ticketIls: { low: 130, high: 300 } },

  // ───── Phuket ─────
  'phuket|The Big Buddha': {
    about: { he: 'פסל בודהה לבן בגובה 45 מטר, מצופה שיש בורמזי, על פסגת גבעת נאקרד. מהמרפסת סביבו נשקפת תצפית של 360 מעלות על מפרץ צ׳לונג, קטה וקרון.', en: 'A 45 m white Buddha clad in Burmese marble atop Nakkerd Hill. The terrace around it gives 360° views over Chalong Bay, Kata and Karon.' },
    tip: { he: 'הכניסה בתרומה. חובה לכסות כתפיים וברכיים – יש סרונגים בכניסה. העלייה מתפתלת, עדיף במונית ולא בקטנוע.', en: 'Entry is by donation. Cover shoulders and knees (sarongs at the gate). The road is winding – take a taxi rather than a scooter.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'phuket|Wat Chalong': {
    about: { he: 'המקדש הבודהיסטי החשוב והגדול בפוקט, עם צ׳די בן כמה קומות שבו נשמר לפי המסורת שבר עצם של הבודהה. בפנים ציורי קיר וקירות מוזהבים, ובחצר נשמעים זיקוקים שמקומיים מדליקים כהודיה.', en: 'Phuket’s largest and most important temple, with a multi-storey chedi said to hold a bone fragment of the Buddha, gilded walls and murals. Locals set off firecrackers in thanks.' },
    tip: { he: 'טפסו לקומה העליונה של הצ׳די לתצפית על המתחם. התלבשו בצניעות וחלצו נעליים לפני הכניסה לאולמות.', en: 'Climb to the top floor of the chedi for a view over the grounds. Dress modestly and remove shoes in the halls.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'phuket|Phuket Old Town': {
    about: { he: 'רחובות של בתי חנויות בסגנון סינו־פורטוגזי בצבעי פסטל מימי בהלת הפח. מטיילים בין בתי קפה, גלריות, מקדשים סיניים ובתי אחוזה, ואוכלים מאכלים מקומיים כמו מי הוקיאן.', en: 'Streets of pastel Sino-Portuguese shophouses from the tin-mining boom. Stroll past cafés, galleries, Chinese shrines and old mansions, and try local dishes like Hokkien noodles.' },
    tip: { he: 'בימי ראשון בערב רחוב תלאנג הופך לשוק הליכה (Lard Yai). הגיעו בשעות אחר הצהריים המאוחרות לצילום באור רך.', en: 'On Sunday evenings Thalang Road becomes the Lard Yai walking market. Come late afternoon for soft light.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'phuket|Promthep Cape at sunset': {
    about: { he: 'הכף הדרומי של פוקט, שלוחת סלע שנכנסת לים האנדמן. זו נקודת השקיעה המפורסמת של האי – מאות אנשים מתאספים לראות את השמש שוקעת מאחורי איים קטנים.', en: 'Phuket’s southern tip, a rocky headland jutting into the Andaman Sea. It’s the island’s classic sunset spot, with hundreds gathering as the sun drops behind small islets.' },
    tip: { he: 'הגיעו כ־45 דקות לפני השקיעה כדי לתפוס מקום וחנייה. לשקט יחסי רדו בשביל אל קצה הכף.', en: 'Arrive 45 minutes before sunset for a spot and parking. Walk down the path toward the tip for fewer crowds.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'phuket|Karon Viewpoint': {
    about: { he: 'תצפית על הכביש בין קטה לנאי הרן, שממנה רואים בבת אחת שלושה מפרצים: קטה נוי, קטה וקרון. אחת התמונות המוכרות של פוקט.', en: 'A roadside lookout between Kata and Nai Harn showing three bays at once: Kata Noi, Kata and Karon – one of Phuket’s signature views.' },
    tip: { he: 'האור הכי טוב בבוקר, כשהשמש מאחוריכם. שלבו עם תצפית פרומתפ באותו סיבוב בדרום האי.', en: 'Best light is in the morning, with the sun behind you. Combine with Promthep Cape on a southern loop.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'phuket|Patong Beach': {
    about: { he: 'החוף הכי מפורסם והכי עמוס בפוקט: רצועת חול של שלושה ק״מ עם ספורט ימי, מסעדות ומלונות לאורך הטיילת. מתאים למי שאוהב אקשן והמון אנשים.', en: 'Phuket’s most famous and busiest beach: 3 km of sand lined with watersports, restaurants and hotels. Best for those who like action and crowds.' },
    tip: { he: 'בעונת המונסון (מאי–אוקטובר) שימו לב לדגלים האדומים – זרמים חזקים. החלק הצפוני של החוף שקט יותר.', en: 'In monsoon season (May–Oct) obey red flags – currents can be strong. The northern end is quieter.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'phuket|Bangla Road at night': {
    about: { he: 'רחוב הבילוי הראשי של פטונג, שנסגר לרכבים בערב ומתמלא באורות ניאון, ברים, מועדונים ומופעים. אווירה רועשת ופרועה עד השעות הקטנות.', en: 'Patong’s main nightlife street, closed to traffic after dark and packed with neon, bars, clubs and shows – loud and wild until the small hours.' },
    tip: { he: 'זה לא מקום לילדים. בררו מחיר משקה מראש ושימרו על הטלפון בכיס קדמי.', en: 'Not a place for kids. Check drink prices up front and keep your phone in a front pocket.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'phuket|Kata and Kata Noi beaches': {
    about: { he: 'שני חופים סמוכים עם חול רך ומים צלולים, משפחתיים ורגועים יותר מפטונג. קטה פופולרי לגלישה בעונת הגלים, וקטה נוי הקטן מתאים לשנורקלינג ליד הסלעים בעונה השקטה.', en: 'Two neighbouring beaches with soft sand and clear water, calmer and more family-friendly than Patong. Kata is popular for surfing in the wave season; little Kata Noi is good for snorkelling by the rocks in calm months.' },
    tip: { he: 'מנובמבר עד אפריל הים שקט ומתאים לשחייה; בקיץ יש גלים לשיעורי גלישה. בקטה נוי יש פחות צל – הביאו שמשייה.', en: 'Nov–Apr the sea is calm for swimming; summer brings surf for lessons. Kata Noi has little shade – bring cover.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'phuket|Bang Tao Beach': {
    about: { he: 'חוף ארוך במיוחד, כשמונה ק״מ, בצפון־מערב האי, עם מלונות יוקרה, מועדוני חוף ואזורים שקטים כמעט ריקים. מקום טוב להליכה ארוכה וליום רגוע.', en: 'A very long beach of about 8 km on the north-west coast, with luxury resorts, beach clubs and near-empty quiet stretches. Good for long walks and a relaxed day.' },
    tip: { he: 'בקצה הדרומי יש מסעדות דגים מקומיות זולות; בצפון נמצאים מועדוני החוף המעוצבים. השקיעות כאן מצוינות.', en: 'Cheap local seafood shacks sit at the southern end; stylish beach clubs at the north. Great sunsets.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'phuket|Phuket Weekend Market (Naka)': {
    about: { he: 'שוק לילה מקומי וגדול שבו קונים בגדים, מזכרות, גאדג׳טים ובעיקר אוכל רחוב: שיפודים, חרקים מטוגנים, פירות טרופיים וקינוחים. מחירים זולים מאשר בחופים.', en: 'A big local night market for clothes, souvenirs, gadgets and above all street food: skewers, fried insects, tropical fruit and desserts – cheaper than the beach areas.' },
    tip: { he: 'הגיעו לקראת השקיעה ובקיבה ריקה. מתמקחים על בגדים ומזכרות, לא על אוכל.', en: 'Arrive around sunset on an empty stomach. Haggle for clothes and souvenirs, not food.' },
    book: 'no', ticketIls: { low: 0, high: 0 }, hours: { he: 'פעיל בערבי סוף השבוע', en: 'Weekend evenings' } },
  'phuket|Phi Phi Islands & Maya Bay boat trip': {
    about: { he: 'יום שלם בסירה מהירה לאיי פי פי: צוקי גיר מעל מים טורקיז, שנורקלינג, מפרץ פילה ומפרץ מאיה המפורסם מהסרט ״החוף״. במאיה מותר רק לטייל על החוף, השחייה אסורה.', en: 'A full-day speedboat trip to the Phi Phi Islands: limestone cliffs over turquoise water, snorkelling, Pileh Lagoon and Maya Bay of ‘The Beach’ fame, where you can walk the sand but not swim.' },
    tip: { he: 'מפרץ מאיה נסגר כל שנה לכחודשיים בקיץ (בדרך כלל אוגוסט–ספטמבר). בחרו יציאה מוקדמת כדי להקדים את ההמונים. דמי הפארק הלאומי משולמים לרוב בנפרד.', en: 'Maya Bay closes for about two months each year (usually Aug–Sep). Pick an early departure to beat crowds. The national-park fee is often paid separately.' },
    book: 'recommended', ticketIls: { low: 170, high: 450 } },
  'phuket|Phang Nga Bay & James Bond Island by kayak': {
    about: { he: 'מפרץ של מאות צוקי גיר שמזדקרים מהים. חותרים בקיאק עם מדריך לתוך מערות ולגונות נסתרות (הונג), ועוצרים באי ג׳יימס בונד מהסרט ״האיש עם אקדח הזהב״.', en: 'A bay of hundreds of limestone towers rising from the sea. A guide paddles you by kayak into caves and hidden lagoons (hongs), with a stop at James Bond Island from ‘The Man with the Golden Gun’.' },
    tip: { he: 'העדיפו סיור שיוצא מוקדם או סיור אחר הצהריים כדי להימנע מעומס. הכניסה ללגונות תלויה בגאות – תסמכו על המדריך.', en: 'Choose an early or late-afternoon tour to avoid crowds. Lagoon access depends on the tide – trust the guide’s timing.' },
    book: 'recommended', ticketIls: { low: 170, high: 450 } },
  'phuket|Snorkelling in the Similan Islands (in season)': {
    about: { he: 'ארכיפלג שמור בים האנדמן עם סלעי גרניט ענקיים, חול לבן כקמח ומים צלולים מאוד. בשנורקלינג רואים צבי ים, דגים צבעוניים ולפעמים כרישי שונית.', en: 'A protected Andaman archipelago of giant granite boulders, flour-white sand and very clear water. Snorkellers see turtles, colourful fish and sometimes reef sharks.' },
    tip: { he: 'הפארק פתוח רק באמצע אוקטובר עד אמצע מאי, ויש מכסת מבקרים יומית – הזמינו מראש. היציאה מקאו לאק, כשעה וחצי נסיעה מפוקט.', en: 'Open only mid-October to mid-May with a daily visitor cap – book ahead. Boats leave from Khao Lak, about 1.5 hours’ drive from Phuket.' },
    book: 'required', ticketIls: { low: 350, high: 650 }, hours: { he: 'פתוח בערך מאמצע אוקטובר עד אמצע מאי', en: 'Open roughly mid-Oct to mid-May' } },

  // ───── Vietnam ─────
  'vietnam|Hoan Kiem Lake & the Old Quarter': {
    about: { he: 'האגם במרכז האנוי עם מקדש נגוק סון על אי קטן וגשר אדום, ולצידו הרובע העתיק – 36 רחובות צפופים שכל אחד נקרא על שם מלאכה. קטנועים, דוכני פו ובתי קפה על מדרכות.', en: 'The lake at Hanoi’s heart, with Ngoc Son Temple on a tiny island reached by a red bridge, beside the Old Quarter’s 36 busy guild streets full of scooters, pho stalls and pavement cafés.' },
    tip: { he: 'בסופי שבוע בערב הרחובות סביב האגם נסגרים לרכב והופכים למדרחוב. נסו קפה ביצה (Cà phê trứng) באחד מבתי הקפה הוותיקים.', en: 'On weekend evenings the streets around the lake close to traffic. Try egg coffee at one of the old cafés.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'vietnam|Temple of Literature': {
    about: { he: 'מקדש קונפוציאני מ־1070 שהיה גם האוניברסיטה הראשונה של וייטנאם. עוברים בחמש חצרות עם בריכות, שערים מסורתיים ולוחות אבן על גבי צבים שעליהם חרוטים שמות בוגרים.', en: 'A Confucian temple from 1070 that housed Vietnam’s first university. You pass through five courtyards with ponds, gates and stone stelae on turtles carved with graduates’ names.' },
    tip: { he: 'הגיעו מוקדם בבוקר – אחר כך מגיעות קבוצות ובוגרים שמצטלמים בטקסים. המקום קטן ומספיקה שעה.', en: 'Come early; later it fills with tour groups and graduation photo shoots. An hour is plenty.' },
    book: 'no', ticketIls: { low: 8, high: 15 } },
  'vietnam|Ho Chi Minh Mausoleum & One Pillar Pagoda': {
    about: { he: 'מבנה שיש מרשים בכיכר בה דין שבו מוצגת גופתו החנוטה של הו צ׳י מין, עם משמר כבוד. בסמוך נמצא מקדש העמוד האחד – פגודה קטנה מעץ שעומדת על עמוד יחיד מעל בריכה.', en: 'An imposing marble building on Ba Dinh Square where Ho Chi Minh’s embalmed body lies under honour guard. Nearby is the One Pillar Pagoda, a small wooden shrine on a single column above a pond.' },
    tip: { he: 'לבוש צנוע חובה, אין לצלם בפנים ויש לשמור על שקט. התור זז מהר אבל הגיעו לפני 9:00. המוזוליאום נסגר לתחזוקה לכחודשיים בכל שנה, לרוב בסתיו.', en: 'Modest dress, no photos inside, silence required. Queue before 9am. The mausoleum closes for about two months a year for maintenance, usually in autumn.' },
    book: 'no', ticketIls: { low: 0, high: 10 }, hours: { he: 'סגור בימי שני ושישי; פתוח בעיקר בבוקר', en: 'Closed Mondays & Fridays; open mainly in the morning' } },
  'vietnam|Overnight cruise in Ha Long Bay': {
    about: { he: 'לילה על ספינה במפרץ של כ־2,000 איים וצוקי גיר ירוקים שמזדקרים מהמים. התוכנית כוללת קיאקים, ביקור במערה, שחייה, שיעור בישול וזריחה שקטה על הסיפון.', en: 'A night aboard a boat in a bay of some 2,000 jungle-topped limestone islets. Kayaking, a cave visit, swimming, a cooking demo and a quiet sunrise on deck.' },
    tip: { he: 'בחרו ספינה שמפליגה במפרץ לאן הא או באי טו לונג – פחות צפוף. הנסיעה מהאנוי כשעתיים וחצי לכל כיוון.', en: 'Pick a boat cruising Lan Ha or Bai Tu Long Bay – far fewer boats. It’s about 2.5 hours’ drive each way from Hanoi.' },
    book: 'required', ticketIls: { low: 550, high: 1500 } },
  'vietnam|Trang An & Tam Coc in Ninh Binh': {
    about: { he: 'נוף של שדות אורז ונהרות בין צוקי גיר, שנקרא ״הא לונג היבשתית״. משייטים בסירת משוטים שהחותרת מניעה לעיתים ברגליים, עוברים דרך מערות נמוכות ובין מקדשים קטנים.', en: 'Rice paddies and rivers winding between limestone karsts – ‘Ha Long Bay on land’. A rower, sometimes paddling with her feet, takes you through low caves and past small temples.' },
    tip: { he: 'טראנג אן שקט ומרשים יותר מטאם קוק. הביאו כובע וקרם הגנה – אין צל בסירה. הכי יפה בסוף מאי–יוני כשהאורז צהוב.', en: 'Trang An is calmer and grander than Tam Coc. Bring a hat – no shade on the boats. Prettiest late May–June when rice turns golden.' },
    book: 'no', ticketIls: { low: 35, high: 300 } },
  'vietnam|Hoi An Ancient Town': {
    about: { he: 'עיר נמל עתיקה ושמורה היטב, אתר מורשת עולמית, עם בתי סוחרים צהובים, אולמות אספה סיניים והגשר היפני המקורה. בערב מאות פנסי משי מאירים את הרחובות והנהר.', en: 'A beautifully preserved old trading port and World Heritage Site, with yellow merchant houses, Chinese assembly halls and the covered Japanese Bridge. At night silk lanterns light the streets and river.' },
    tip: { he: 'הכרטיס לעיר העתיקה כולל כניסה לחמישה אתרים לבחירה. בערב שטים בסירה ומשיטים פנס נייר על הנהר. חייטים מקומיים תופרים בגדים תוך יום.', en: 'The Old Town ticket includes five sights of your choice. At night take a boat and float a paper lantern. Local tailors make clothes in a day.' },
    book: 'no', ticketIls: { low: 15, high: 20 } },
  'vietnam|An Bang Beach': {
    about: { he: 'חוף חול רחב ונינוח כחמש דקות נסיעה מהוי אן, עם מסעדות דגים ומיטות שיזוף. מקום טוב להפסקה מהעיר, לשחייה ולארוחת צהריים מול הים.', en: 'A wide, laid-back beach a short ride from Hoi An, lined with seafood restaurants and sunbeds. A good break from town for a swim and lunch by the sea.' },
    tip: { he: 'מיטות השיזוף לרוב חינם אם מזמינים אוכל או שתייה. רכבו לשם באופניים מהעיר – זה שטוח ונעים.', en: 'Sunbeds are usually free if you order food or drinks. Cycle there from town – it’s flat and pleasant.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'vietnam|The Marble Mountains': {
    about: { he: 'חמש גבעות שיש וגיר בין דה נאנג להוי אן, מנוקבות במערות שבהן מקדשים ופסלי בודהה. מטפסים במדרגות או במעלית לתצפיות על החוף ועל העיר.', en: 'Five marble and limestone hills between Da Nang and Hoi An, riddled with caves holding shrines and Buddha statues. Climb stairs or take the lift to lookouts over the coast.' },
    tip: { he: 'בקרו במערת הויין קונג הגדולה. נעליים עם אחיזה טובה חובה – המדרגות חלקות. הגיעו בבוקר לפני החום.', en: 'Don’t miss the huge Huyen Khong Cave. Wear shoes with grip – steps get slippery. Go in the morning.' },
    book: 'no', ticketIls: { low: 6, high: 15 } },
  'vietnam|Ba Na Hills & the Golden Bridge': {
    about: { he: 'אתר בילוי על פסגת הר מעל דה נאנג, שאליו עולים באחד הרכבלים הארוכים בעולם. למעלה: הגשר המוזהב שנתמך בשתי ידיים ענקיות מאבן, כפר בסגנון צרפתי ופארק שעשועים.', en: 'A mountaintop resort above Da Nang reached by one of the world’s longest cable cars. Up top: the Golden Bridge held by two giant stone hands, a mock French village and an amusement park.' },
    tip: { he: 'עלו ברכבל הראשון בבוקר כדי לראות את הגשר לפני ההמונים והעננים. קחו שכבה – למעלה קריר בהרבה.', en: 'Ride the first cable car to see the bridge before crowds and cloud. Bring a layer – it’s much cooler up top.' },
    book: 'recommended', ticketIls: { low: 130, high: 170 } },
  'vietnam|My Khe Beach': {
    about: { he: 'החוף העירוני הארוך של דה נאנג, עם חול לבהיר ונקי, טיילת ומסעדות פירות ים. בבוקר המוקדם מקומיים שוחים ומתעמלים, ובאחר הצהריים יש גלים נוחים ללימוד גלישה.', en: 'Da Nang’s long city beach of clean pale sand, a promenade and seafood restaurants. Locals swim and exercise at dawn; afternoon waves suit beginner surfers.' },
    tip: { he: 'העונה הטובה לשחייה מרץ עד אוגוסט; בחורף הים גלי. נסו מסעדת פירות ים שבוחרים בה את הדגים מהאקווריום.', en: 'Best swimming season is March–August; winter seas are rough. Try a seafood place where you pick from the tanks.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'vietnam|War Remnants Museum': {
    about: { he: 'המוזיאון המבוקר ביותר בסייגון, שמתעד את מלחמת וייטנאם מנקודת המבט הוייטנאמית: מטוסים וטנקים בחצר, ובפנים תערוכות צילום עוצמתיות של צלמי מלחמה.', en: 'Saigon’s most visited museum, documenting the Vietnam War from the Vietnamese perspective: aircraft and tanks outside, powerful war-photography exhibitions inside.' },
    tip: { he: 'חלק מהתצלומים קשים מאוד לצפייה – לא מתאים לילדים צעירים. הקדישו כשעתיים והגיעו בבוקר.', en: 'Some photos are very graphic – not for young children. Allow about two hours and come in the morning.' },
    book: 'no', ticketIls: { low: 5, high: 10 } },
  'vietnam|Ben Thanh Market': {
    about: { he: 'השוק המקורה המפורסם במרכז סייגון, עם מגדל שעון מ־1914. בפנים בדים, קפה, מזכרות, תבלינים ודוכני אוכל, ובחוץ בערב שווקי לילה בסביבה.', en: 'Saigon’s iconic covered market with a 1914 clock tower, selling fabric, coffee, souvenirs and spices, plus food stalls inside.' },
    tip: { he: 'המחירים לתיירים גבוהים – התמקחו בנימוס. לאוכל טוב יותר נסו את Ben Thanh Street Food Market הסמוך.', en: 'Prices start high for tourists – haggle politely. For better food try the nearby Ben Thanh Street Food Market.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'vietnam|Cu Chi Tunnels': {
    about: { he: 'רשת מנהרות תת־קרקעית של עשרות ק״מ ששימשה לוחמים במלחמה, כשעה וחצי מסייגון. זוחלים בקטע מנהרה שהורחב לתיירים ורואים מלכודות, חדרי מגורים ומטבחים מוסתרים.', en: 'A vast underground tunnel network used during the war, about 1.5 hours from Saigon. Crawl through a section widened for visitors and see traps, living quarters and hidden kitchens.' },
    tip: { he: 'אתר בן דין קרוב ועמוס, בן דוק רחוק ושקט יותר. לבשו בגדים שלא אכפת לכם ללכלך. המנהרות צרות – לא למי שסובל מקלסטרופוביה.', en: 'Ben Dinh is closer and busier; Ben Duoc is further and quieter. Wear clothes you don’t mind getting dirty. Tight spaces – skip if claustrophobic.' },
    book: 'recommended', ticketIls: { low: 20, high: 250 } },

  // ───── Japan ─────
  'japan|Senso-ji Temple, Asakusa': {
    about: { he: 'המקדש הבודהיסטי העתיק בטוקיו, שנוסד לפי המסורת ב־628. נכנסים דרך שער קמינרימון עם הפנס האדום הענק, עוברים ברחוב נקאמיסה עם דוכני חטיפים ומזכרות ומגיעים לאולם הראשי ולפגודה בת חמש הקומות.', en: 'Tokyo’s oldest temple, traditionally founded in 628. Enter through the Kaminarimon gate with its giant red lantern, walk the Nakamise snack-and-souvenir street to the main hall and five-storey pagoda.' },
    tip: { he: 'בואו לפני 8:00 או אחרי השקיעה, כשהמקדש מואר וכמעט ריק. נסו מלון־פן חם מאחד הדוכנים.', en: 'Come before 8am or after dark when it’s lit up and nearly empty. Try a warm melon-pan from a stall.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'japan|Shibuya Crossing': {
    about: { he: 'מעבר החצייה העמוס בעולם: כשהרמזורים מתחלפים, עד כמה אלפי אנשים חוצים בבת אחת מכל הכיוונים, מוקפים מסכי ענק וניאון. חוויה של טוקיו בתמצית.', en: 'The world’s busiest pedestrian crossing: when the lights change, up to a few thousand people cross at once from every direction, surrounded by giant screens and neon.' },
    tip: { he: 'לצילום מלמעלה עלו לתצפית Shibuya Sky (בתשלום, הזמינו שעת שקיעה מראש) או לקומות העליונות של המבנים הסמוכים. חפשו גם את פסל הכלב האצ׳יקו.', en: 'For an aerial shot go up Shibuya Sky (paid, pre-book sunset) or upper floors nearby. Find the Hachiko dog statue too.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'japan|Meiji Jingu Shrine': {
    about: { he: 'מקדש שינטו שקט בתוך יער של כ־100,000 עצים בלב טוקיו, מוקדש לקיסר מייג׳י ולאשתו. הולכים בשביל חצץ רחב תחת שערי טוריי ענקיים מעץ, ולעיתים רואים טקס חתונה מסורתי.', en: 'A serene Shinto shrine in a forest of some 100,000 trees in central Tokyo, dedicated to Emperor Meiji and his wife. Walk wide gravel paths under huge wooden torii; you may glimpse a traditional wedding.' },
    tip: { he: 'בואו בבוקר מוקדם לשקט מלא. שלבו עם הרחוב התוסס טקשיטה דורי בהרג׳וקו, ממש ליד היציאה.', en: 'Come early for real calm. Pair it with lively Takeshita Street in Harajuku just outside.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'japan|Tsukiji Outer Market': {
    about: { he: 'מאות דוכנים וחנויות קטנות שנשארו סביב שוק הדגים הסיטונאי הישן: סושי טרי, חביתה יפנית מתוקה על מקל, צדפות על האש, סכינים וכלי מטבח.', en: 'Hundreds of stalls and small shops left around the old wholesale fish market: fresh sushi, sweet tamagoyaki on a stick, grilled scallops, knives and kitchenware.' },
    tip: { he: 'הגיעו בין 7:00 ל־10:00; רוב הדוכנים נסגרים עד הצהריים, ורבים סגורים בימי ראשון ורביעי. אכלו ליד הדוכן, לא תוך כדי הליכה.', en: 'Go between 7 and 10am; most stalls close by early afternoon and many shut on Sundays and Wednesdays. Eat at the stall, not while walking.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'japan|Tokyo Skytree': {
    about: { he: 'מגדל השידור הגבוה בעולם, 634 מטר. מעלית מהירה מעלה אתכם לתצפית ב־350 מטר, ואפשר להמשיך לגלריה בגובה 450 מטר. ביום בהיר רואים את הר פוג׳י.', en: 'The world’s tallest broadcast tower at 634 m. A fast lift takes you to the 350 m deck, with an upper gallery at 450 m. On clear days you can see Mt Fuji.' },
    tip: { he: 'כרטיס מקוון עם שעה קבועה חוסך תור וזול יותר. סיכויי ראות של פוג׳י הכי טובים בבקרי חורף.', en: 'An online timed ticket skips queues and costs less. Fuji views are best on winter mornings.' },
    book: 'recommended', ticketIls: { low: 55, high: 100 } },
  'japan|teamLab Planets': {
    about: { he: 'מוזיאון אמנות דיגיטלית סוחף שבו הולכים יחפים במים עד הברכיים בין דגי קוי מוקרנים, נכנסים לחדר של אינסוף נורות ולגן של פרחים תלויים. חוויה חושית מלאה, לא תערוכה שמסתכלים עליה.', en: 'An immersive digital-art museum where you walk barefoot through knee-deep water among projected koi, enter an infinity room of lights and a garden of floating orchids. You’re inside the art.' },
    tip: { he: 'חובה להזמין כרטיס עם שעה מראש. לבשו מכנסיים שאפשר לקפל עד הברך, ולנשים – עדיף לא חצאית (יש רצפות מראה).', en: 'Timed tickets must be booked ahead. Wear trousers you can roll above the knee; skirts aren’t ideal (mirrored floors).' },
    book: 'required', ticketIls: { low: 90, high: 120 } },
  'japan|Fushimi Inari Taisha': {
    about: { he: 'מקדש השינטו של אל האורז והשגשוג, המפורסם באלפי שערי טוריי כתומים שיוצרים מנהרות לאורך שבילים במעלה ההר. ההליכה עד הפסגה וחזרה לוקחת כשעתיים־שלוש.', en: 'The Shinto shrine of the rice and prosperity deity, famous for thousands of orange torii gates forming tunnels up the mountain. A round trip to the summit takes 2–3 hours.' },
    tip: { he: 'פתוח 24 שעות – הגיעו לפני 8:00 לצילומים בלי אנשים. ההמונים נעלמים כבר אחרי כרבע מהעלייה.', en: 'Open 24 hours – arrive before 8am for empty shots. Crowds thin out after the first quarter of the climb.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'japan|Kinkaku-ji — the Golden Pavilion': {
    about: { he: 'ביתן בן שלוש קומות שקומותיו העליונות מצופות עלי זהב, משתקף באגם מוקף גן יפני קלאסי. מקיפים את האגם בשביל קבוע ורואים אותו מכמה זוויות.', en: 'A three-storey pavilion whose upper floors are covered in gold leaf, mirrored in a pond within a classic Japanese garden. A set path circles the pond for views from several angles.' },
    tip: { he: 'האור והשתקפות הכי יפים ביום שמשי בבוקר. הביקור קצר – כ־40 דקות; שלבו עם ריואן־ג׳י וגן הסלעים הסמוך.', en: 'Best reflection on a sunny morning. The visit takes about 40 minutes; pair it with nearby Ryoan-ji’s rock garden.' },
    book: 'no', ticketIls: { low: 12, high: 15 } },
  'japan|Arashiyama Bamboo Grove': {
    about: { he: 'שביל קצר בין גבעולי במבוק ירוקים וגבוהים שמתנודדים ברוח ומשמיעים רשרוש מיוחד. האזור כולו כולל גם את מקדש טנריו־ג׳י, גשר טוגצוקיו ופארק הקופים.', en: 'A short path between towering green bamboo stalks that sway and rustle in the wind. The Arashiyama area also has Tenryu-ji temple, Togetsukyo Bridge and a monkey park.' },
    tip: { he: 'השביל עצמו קצר ועמוס מאוד אחרי 9:00 – הגיעו בזריחה. כדאי לשלב את הגן של טנריו־ג׳י שמתחבר ישירות לשביל.', en: 'The path is short and packed after 9am – come at sunrise. Tenryu-ji’s garden connects right onto it.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'japan|Gion district': {
    about: { he: 'רובע הגיישות ההיסטורי של קיוטו, עם בתי עץ מסורתיים (מאצ׳יה), בתי תה ורחוב האנאמיקוג׳י המרוצף. בערב אפשר לפעמים לראות גייקו או מאיקו בדרכן לפגישה.', en: 'Kyoto’s historic geisha district of wooden machiya townhouses, teahouses and cobbled Hanamikoji Street. In the evening you may glimpse a geiko or maiko heading to an appointment.' },
    tip: { he: 'אסור לצלם בסמטאות הפרטיות ויש קנסות – כבדו את השלטים. לעולם אל תעצרו או תצלמו גיישה מקרוב.', en: 'Photography is banned in the private lanes, with fines – follow the signs. Never stop or chase a geisha for photos.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'japan|Dotonbori': {
    about: { he: 'רחוב הבילוי והאוכל של אוסקה לאורך תעלה, עם שלטי ניאון ענקיים, סרטן מכני עצום ושלט רץ הגליקו המפורסם. אוכלים טקויאקי, אוקונומיאקי וקושיקאצו מדוכנים פתוחים.', en: 'Osaka’s food and nightlife strip along a canal, with giant neon signs, a huge mechanical crab and the famous Glico running-man. Eat takoyaki, okonomiyaki and kushikatsu from open stalls.' },
    tip: { he: 'בואו אחרי השקיעה, כשהשלטים דולקים. שייט קצר בתעלה מראה את הניאון מזווית אחרת.', en: 'Come after dark when the signs are lit. A short canal cruise shows the neon from another angle.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'japan|Osaka Castle': {
    about: { he: 'הטירה הלבנה עם גגות ירוקים ועיטורי זהב, מוקפת חומות אבן ענקיות ותעלות. בתוך המגדל המרכזי מוזיאון על תולדות הטירה ותצפית מהקומה העליונה.', en: 'The white castle with green roofs and gold trim, ringed by massive stone walls and moats. The main tower holds a museum on the castle’s history and a top-floor lookout.' },
    tip: { he: 'הפארק סביב הטירה חינמי ומקסים, במיוחד בעונת הדובדבנים. בתוך המגדל יש מעלית רק עד קומה מסוימת – משם מדרגות.', en: 'The park around it is free and lovely, especially in cherry-blossom season. The tower lift goes only partway; then stairs.' },
    book: 'no', ticketIls: { low: 15, high: 35 } },
  'japan|Lake Kawaguchi & Mt Fuji views': {
    about: { he: 'אחד מחמשת האגמים למרגלות הר פוג׳י, עם תצפיות קלאסיות על ההר המושלג מעל המים. אפשר לעלות ברכבל לתצפית, לבקר בפגודת צ׳ורייטו ולטייל לאורך החוף.', en: 'One of the Fuji Five Lakes, with classic views of the snow-capped peak above the water. Ride the ropeway to a lookout, visit Chureito Pagoda and stroll the shore.' },
    tip: { he: 'פוג׳י נוטה להסתתר בעננים אחרי הצהריים ובקיץ – תכננו את הבוקר והעדיפו סתיו או חורף. בדקו תחזית עננות לפני שיוצאים.', en: 'Fuji hides in cloud after midday and in summer – plan for morning, ideally autumn or winter. Check a cloud forecast first.' },
    book: 'no', ticketIls: { low: 0, high: 30 } },

  // ───── Bali ─────
  'bali|Sacred Monkey Forest Sanctuary, Ubud': {
    about: { he: 'יער גשם קטן בלב אובוד עם מאות קופי מקוק ושלושה מקדשים עתיקים מכוסים טחב. הולכים בשבילים ובגשרים בין עצי באניאן ענקיים ורואים את הקופים משחקים, מתרחצים ומניקים.', en: 'A patch of jungle in central Ubud with hundreds of macaques and three moss-covered temples. Paths and bridges wind between giant banyan trees while monkeys play, bathe and nurse.' },
    tip: { he: 'השאירו משקפי שמש, כובעים ואוכל בתיק סגור – הקופים חוטפים. אל תסתכלו להם ישר בעיניים ואל תאכילו.', en: 'Stow sunglasses, hats and food in a closed bag – monkeys snatch. Don’t stare them in the eye or feed them.' },
    book: 'no', ticketIls: { low: 18, high: 25 } },
  'bali|Tegallalang Rice Terraces': {
    about: { he: 'מדרגות של שדות אורז ירוקים שיורדות לעמק מתחת לעצי קוקוס, ומושקים בשיטת סובאק המסורתית. מטיילים בשבילים בין הטרסות ועוצרים בבתי קפה עם נוף.', en: 'Stepped green rice paddies falling into a valley beneath coconut palms, watered by the traditional subak system. Walk the paths between terraces and stop at view cafés.' },
    tip: { he: 'הגיעו לפני 8:00 – אחר כך עמוס וחם. לאורך השביל מבקשים תרומות קטנות; החזיקו מזומן קטן. הנדנדות לצילום בתשלום נפרד.', en: 'Arrive before 8am – it gets hot and crowded. Farmers ask small donations along the path, so carry change. Photo swings cost extra.' },
    book: 'no', ticketIls: { low: 5, high: 15 } },
  'bali|Campuhan Ridge Walk': {
    about: { he: 'שביל הליכה סלול על רכס דשא בין שני עמקי נהר, כשני ק״מ בכל כיוון מאובוד. נוף של ג׳ונגל, דקלים ושדות אורז, ובסופו בתי קפה בכפר בנגקיאנג סידם.', en: 'A paved path along a grassy ridge between two river valleys, about 2 km each way from Ubud, with jungle and palm views ending at cafés in Bangkiang Sidem village.' },
    tip: { he: 'לכו בזריחה או לפני השקיעה – בצהריים אין צל. ההתחלה מוסתרת מאחורי מקדש גונונג לבה ליד המלון Warwick Ibah.', en: 'Walk at sunrise or before sunset – no shade at midday. The trailhead hides behind Gunung Lebah temple near Warwick Ibah.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'bali|Ubud Art Market': {
    about: { he: 'שוק במרכז אובוד, מול הארמון המלכותי, שבו מוכרים סלי קש, סרונגים, פסלי עץ, תכשיטי כסף ותיקים. מקום טוב למזכרות מלאכת יד.', en: 'A market in central Ubud opposite the royal palace selling rattan bags, sarongs, wood carvings, silver jewellery and more – good for handicraft souvenirs.' },
    tip: { he: 'התמקחו – מחיר ראשון לרוב כפול. הגיעו בבוקר, ולפני כן בקרו בארמון אובוד ממול. בערב מתקיימים שם מופעי ריקוד.', en: 'Bargain – first prices are often double. Come in the morning and visit Ubud Palace across the road, which hosts evening dances.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'bali|Tirta Empul water temple': {
    about: { he: 'מקדש הינדי מהמאה ה־10 סביב מעיין קדוש. מקומיים ומבקרים נכנסים לבריכות האבן ועוברים תחת שורת זרבובים בטקס היטהרות, ובמתחם בריכות דגי קוי.', en: 'A 10th-century Hindu temple built around a sacred spring. Balinese and visitors wade into stone pools and pass under a row of spouts in a purification ritual; there are koi ponds too.' },
    tip: { he: 'סרונג ניתן בכניסה. אם רוצים להשתתף בטקס צריך סרונג נוסף לרחצה – שאלו מקומי על סדר הזרבובים, כמה מהם לא משמשים להיטהרות.', en: 'Sarongs are provided. To join the ritual you need a separate bathing sarong; ask a local about the spout order – some aren’t for purification.' },
    book: 'no', ticketIls: { low: 15, high: 20 } },
  'bali|Mount Batur sunrise trek': {
    about: { he: 'טיפוס לילי של כשעתיים על הר געש פעיל בגובה 1,717 מטר, עם פנסים ומדריך. מגיעים לפסגה לפני הזריחה ורואים את השמש עולה מעל אגם בטור והר אגונג, ולעיתים אוכלים ביצים שבושלו באדי ההר.', en: 'A two-hour night climb up a 1,717 m active volcano with headlamps and a guide. Reach the rim for sunrise over Lake Batur and Mt Agung, sometimes with eggs steamed in volcanic vents.' },
    tip: { he: 'האיסוף מהמלון בסביבות 2:00 לפנות בוקר. קחו מעיל – בפסגה קר. נעלי הליכה עם אחיזה, הירידה על חצץ.', en: 'Hotel pick-up is around 2am. Bring a jacket – it’s cold at the top. Wear grippy shoes; the descent is loose gravel.' },
    book: 'required', ticketIls: { low: 150, high: 300 } },
  'bali|Tanah Lot Temple': {
    about: { he: 'מקדש ים על סלע בתוך הגלים, אחד מסמלי באלי. בגאות הוא נראה כמו אי מבודד, ובשפל אפשר לגשת לבסיס הסלע ולמעיין המים המתוקים.', en: 'A sea temple perched on a rock in the surf, one of Bali’s icons. At high tide it looks like an island; at low tide you can walk to the base and its freshwater spring.' },
    tip: { he: 'הגיעו לשקיעה, אבל מוקדם כדי לתפוס מקום על הצוקים. מבקרים לא נכנסים למקדש עצמו.', en: 'Come for sunset, but early to grab a cliff-top spot. Visitors can’t enter the temple itself.' },
    book: 'no', ticketIls: { low: 15, high: 20 } },
  'bali|Uluwatu Temple & sunset Kecak dance': {
    about: { he: 'מקדש על צוק בגובה כ־70 מטר מעל האוקיינוס בדרום האי. בשקיעה מתקיים באמפיתאטרון מופע קצ׳אק – עשרות גברים יושבים במעגל ושרים ״צ׳אק־צ׳אק״ בזמן שמוצג סיפור הרמאיאנה.', en: 'A temple on a cliff about 70 m above the ocean in the south. At sunset an amphitheatre hosts the Kecak dance: dozens of men chanting ‘cak-cak’ in a circle as the Ramayana is acted out.' },
    tip: { he: 'הקופים כאן ידועים כגנבים של משקפיים וטלפונים – אחזו חזק. כרטיסי המופע נמכרים במקום ונגמרים בעונה, הגיעו שעה לפני.', en: 'Monkeys here are notorious for stealing glasses and phones – hold tight. Show tickets sell out in season; arrive an hour early.' },
    book: 'no', ticketIls: { low: 40, high: 60 } },
  'bali|Padang Padang Beach': {
    about: { he: 'מפרץ קטן ומוסתר בחצי האי בוקיט, שאליו יורדים במדרגות דרך סדק בין סלעים. חול לבן, מים טורקיז וגלישה מפורסמת בשונית לגולשים מנוסים.', en: 'A small hidden cove on the Bukit Peninsula reached by steps through a gap in the rocks: white sand, turquoise water and a famous reef break for experienced surfers.' },
    tip: { he: 'החוף קטן ומתמלא – הגיעו בבוקר. שחו רק בשפל רגוע, השונית רדודה. שימרו על התיק מקופים במדרגות.', en: 'It’s small and fills up – come in the morning. Swim at calm times; the reef is shallow. Watch bags around monkeys on the steps.' },
    book: 'no', ticketIls: { low: 3, high: 6 } },
  'bali|Seminyak Beach at sunset': {
    about: { he: 'חוף רחב וארוך עם פופים צבעוניים ומטריות על החול, מועדוני חוף ומוזיקה. בשקיעה כולם מתיישבים מול הים עם משקה, והשמיים נצבעים בכתום וורוד.', en: 'A long, wide beach with colourful beanbags and umbrellas on the sand, beach clubs and music. At sunset everyone settles in with a drink as the sky turns orange and pink.' },
    tip: { he: 'הפופים חינם אם מזמינים משקה. הים כאן עם זרמים – שחו רק בין הדגלים.', en: 'Beanbags are free with a drink. Currents can be strong – swim only between the flags.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'bali|Surf lesson in Canggu': {
    about: { he: 'שיעור גלישה של כשעתיים בחוף בטו בולונג בצ׳אנגו, עם גלים רכים וקרקעית חול שמתאימים למתחילים. המדריך דוחף אתכם לגל עד שאתם נעמדים.', en: 'A two-hour surf lesson at Batu Bolong in Canggu, where soft waves and a sandy bottom suit beginners. Your instructor pushes you into waves until you stand up.' },
    tip: { he: 'שיעורי בוקר מוקדמים – פחות רוח ופחות אנשים במים. לבשו חולצת לייקרה נגד שפשופים וכוויות.', en: 'Early-morning lessons mean less wind and fewer people. Wear a rash vest against chafing and sunburn.' },
    book: 'recommended', ticketIls: { low: 80, high: 160 } },
  'bali|Jatiluwih Rice Terraces': {
    about: { he: 'טרסות אורז עצומות על מדרונות הר בטוקארו, חלק מאתר מורשת עולמית של מערכת ההשקיה הבאלינזית. רחבות ושקטות בהרבה מטגללאנג, עם מסלולי הליכה מסומנים.', en: 'Vast rice terraces on the slopes of Mt Batukaru, part of the World Heritage-listed Balinese irrigation landscape. Wider and far quieter than Tegallalang, with marked walking trails.' },
    tip: { he: 'בחרו מסלול הליכה של שעה–שעתיים. כשעה וחצי נסיעה מאובוד – אפשר לשלב עם מקדש אולון דאנו בראטן באותו יום.', en: 'Pick a 1–2 hour loop trail. It’s about 1.5 hours from Ubud; combine with Ulun Danu Beratan temple the same day.' },
    book: 'no', ticketIls: { low: 10, high: 20 } },

  // ───── Sri Lanka ─────
  'sri-lanka|Sigiriya Rock Fortress': {
    about: { he: 'סלע ענק בגובה כ־200 מטר שעליו בנה מלך במאה ה־5 ארמון מבוצר. מטפסים כ־1,200 מדרגות, עוברים ציורי קיר עתיקים ו״שער האריה״ עם כפות ענק, ומגיעים לחורבות על הפסגה.', en: 'A 200 m rock where a 5th-century king built a fortified palace. Climb about 1,200 steps past ancient frescoes and the giant Lion’s Paws gate to ruins on the summit.' },
    tip: { he: 'התחילו בפתיחה ב־7:00 לפני החום והתורים. קחו מים. לתצפית על הסלע עצמו טפסו לסלע פידורנגלה הסמוך בזריחה.', en: 'Start at the 7am opening before heat and queues. Bring water. For a view of the rock itself, climb nearby Pidurangala at sunrise.' },
    book: 'no', ticketIls: { low: 120, high: 140 } },
  'sri-lanka|Dambulla Cave Temple': {
    about: { he: 'חמש מערות על צלע הר שהפכו למקדש לפני יותר מאלפיים שנה. בפנים עשרות פסלי בודהה, כולל בודהה שוכב באורך 14 מטר, ותקרות מכוסות כולן בציורי קיר צבעוניים.', en: 'Five caves on a hillside turned into a temple over 2,000 years ago, with dozens of Buddha statues including a 14 m reclining figure, and ceilings entirely covered in murals.' },
    tip: { he: 'הכרטיסים נמכרים בתחתית הגבעה, לא למעלה. כסו כתפיים וברכיים וחלצו נעליים – הסלע חם, קחו גרביים.', en: 'Tickets are sold at the bottom of the hill, not at the top. Cover shoulders and knees; shoes off – bring socks, the rock gets hot.' },
    book: 'no', ticketIls: { low: 20, high: 35 } },
  'sri-lanka|Ancient City of Polonnaruwa': {
    about: { he: 'הבירה המלכותית של סרי לנקה במאות ה־11–12: חורבות ארמונות, מקדשים, סטופות ובריכות פזורות על פני שטח גדול. השיא – גל וויהארה, ארבעה פסלי בודהה ענקיים חצובים בסלע אחד.', en: 'Sri Lanka’s royal capital in the 11th–12th centuries: palaces, temples, stupas and pools spread over a wide area. The highlight is Gal Vihara, four giant Buddhas carved from one rock face.' },
    tip: { he: 'שכרו אופניים או טוק־טוק – האתר מפוזר על כמה ק״מ. בקרו קודם במוזיאון ליד הכניסה, שם קונים את הכרטיס.', en: 'Rent a bicycle or tuk-tuk – the site spans several km. Start at the museum by the entrance, where you buy the ticket.' },
    book: 'no', ticketIls: { low: 100, high: 135 } },
  'sri-lanka|Temple of the Tooth, Kandy': {
    about: { he: 'מקדש על שפת אגם קנדי שבו נשמר שריד שן המיוחס לבודהה, המקום הקדוש ביותר לבודהיסטים בסרי לנקה. בשעות הטקס (פוג׳ה) נשמעים תופים ונפתח החדר הפנימי.', en: 'A temple on Kandy Lake housing a relic said to be the Buddha’s tooth, Sri Lanka’s holiest Buddhist site. During puja ceremonies drums sound and the inner chamber opens.' },
    tip: { he: 'הגיעו לפוג׳ה של הערב (בסביבות 18:30). לבוש לבן או צנוע, בלי כובע, נעליים נשארות בחוץ.', en: 'Come for the evening puja around 6:30pm. Wear white or modest clothes, no hats; shoes stay outside.' },
    book: 'no', ticketIls: { low: 20, high: 30 } },
  'sri-lanka|Peradeniya Royal Botanical Gardens': {
    about: { he: 'גן בוטני ענק ליד קנדי, מ־1843, עם שדרות דקלים מלכותיים, בית סחלבים, גשר תלוי מעל הנהר ועץ פיקוס ג׳אווה שנופו מכסה שטח עצום.', en: 'A vast botanical garden near Kandy from 1843, with avenues of royal palms, an orchid house, a suspension bridge over the river and a Javan fig whose canopy covers a huge area.' },
    tip: { he: 'הקדישו שעתיים־שלוש; קחו מפה בכניסה. עטלפי פירות ענקיים תלויים בעצים ליד הנהר – מראה מיוחד בשקיעה.', en: 'Allow 2–3 hours and grab a map. Giant fruit bats roost in trees by the river – a sight at dusk.' },
    book: 'no', ticketIls: { low: 30, high: 40 } },
  'sri-lanka|Nine Arch Bridge': {
    about: { he: 'גשר רכבת מקושת מאבן ולבנים מתקופת הקולוניאליזם הבריטי, שנבנה בלי פלדה, בתוך עמק ירוק של מטעי תה וג׳ונגל ליד אלה. הרגע המפורסם הוא כשהרכבת הכחולה חוצה אותו.', en: 'A colonial-era stone and brick railway viaduct built without steel, set in a green valley of tea and jungle near Ella. The magic moment is when the blue train rolls across.' },
    tip: { he: 'בדקו בתחנת אלה את זמני הרכבות ובואו כ־15 דקות לפני. התצפית הטובה – מבית הקפה על הגבעה מול הגשר.', en: 'Check train times at Ella station and arrive 15 minutes early. The best view is from the hillside café facing the bridge.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'sri-lanka|Little Adam’s Peak': {
    about: { he: 'מסלול הליכה קל של כ־45 דקות לכל כיוון, דרך מטעי תה, אל פסגה עם נוף פנורמי על עמק אלה ועל ״הסלע של אלה״. מתאים גם למשפחות.', en: 'An easy hike of about 45 minutes each way through tea plantations to a summit with panoramic views over the Ella Gap and Ella Rock. Family-friendly.' },
    tip: { he: 'צאו בזריחה כשהעמק עוד בערפל. בדרך חזרה אפשר לנסות את אומגת הענק או את הנדנדה של 98 Acres.', en: 'Set off at sunrise while the valley’s still misty. On the way back you can try the zipline or the 98 Acres swing.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'sri-lanka|Kandy–Ella scenic train': {
    about: { he: 'אחת מנסיעות הרכבת היפות בעולם: כשש־שבע שעות דרך הרי התה, מפלים, גשרים ומנהרות, עם תחנות קטנות בצבעי פסטל. רבים עומדים בדלת הפתוחה עם הרוח בפנים.', en: 'One of the world’s great train rides: around 6–7 hours through tea hills, waterfalls, bridges and tunnels, past pastel stations. Many ride at the open door with the wind in their face.' },
    tip: { he: 'מקומות שמורים במחלקה שנייה ושלישית נמכרים מהר – הזמינו מראש. שבו בצד ימין בכיוון אלה לנוף הטוב.', en: 'Reserved 2nd and 3rd class seats sell out fast – book ahead. Sit on the right heading to Ella for better views.' },
    book: 'recommended', ticketIls: { low: 10, high: 60 } },
  'sri-lanka|Horton Plains & World’s End': {
    about: { he: 'רמה גבוהה בגובה כ־2,100 מטר עם ערבות עשב, יערות ערפל ומסלול מעגלי של כ־9 ק״מ. בסופו צוק ״קצה העולם״ שנופל כ־870 מטר, ובדרך מפל בייקר.', en: 'A high plateau around 2,100 m of grassland and cloud forest with a 9 km loop trail to World’s End, a sheer drop of about 870 m, and Baker’s Falls on the way.' },
    tip: { he: 'התחילו בפתיחה ב־6:00 – העננים מכסים את הנוף בדרך כלל מ־10:00. בבוקר קר, קחו מעיל. אסור להכניס שקיות פלסטיק.', en: 'Start at the 6am opening – cloud usually rolls in by 10am. It’s cold early, bring a jacket. Plastic bags are banned.' },
    book: 'no', ticketIls: { low: 100, high: 160 } },
  'sri-lanka|Yala National Park safari': {
    about: { he: 'הפארק הלאומי המפורסם בסרי לנקה, עם אחד הריכוזים הגבוהים בעולם של נמרים. בנסיעת ג׳יפ רואים גם פילים, דובים, תנינים, צבאים וציפורים רבות.', en: 'Sri Lanka’s best-known national park, with one of the world’s highest leopard densities. Jeep drives also reveal elephants, sloth bears, crocodiles, deer and abundant birds.' },
    tip: { he: 'ספארי בוקר (מ־5:30) נותן את הסיכוי הטוב לנמר. בדרך כלל אזור מרכזי בפארק נסגר לכחודש וחצי בספטמבר–אוקטובר – בדקו לפני.', en: 'Morning drives from 5:30am give the best leopard odds. The main block usually closes for about six weeks around Sep–Oct – check first.' },
    book: 'recommended', ticketIls: { low: 150, high: 450 } },
  'sri-lanka|Udawalawe National Park': {
    about: { he: 'פארק עם ערבות פתוחות ומאגר מים, שבו רואים עדרי פילים כמעט בוודאות – לעיתים מאות. בספארי בג׳יפ רואים גם תאואים, תנינים ועופות דורסים.', en: 'A park of open grassland around a reservoir where elephant herds are almost guaranteed, sometimes hundreds. Jeep safaris also spot buffalo, crocodiles and raptors.' },
    tip: { he: 'בקרו גם ב״בית המעבר לפילים״ הסמוך בשעות האכלת הפילונים. ספארי אחר הצהריים מתאים – פחות חם מהצהריים.', en: 'Also visit the nearby Elephant Transit Home at baby-elephant feeding times. An afternoon safari works well.' },
    book: 'recommended', ticketIls: { low: 130, high: 350 } },
  'sri-lanka|Galle Fort': {
    about: { he: 'עיר מבוצרת שבנו הפורטוגלים וחיזקו ההולנדים במאה ה־17, אתר מורשת עולמית על חוף הים. סמטאות עם בתים קולוניאליים, בוטיקים ובתי קפה, ומגדלור לבן על החומה.', en: 'A sea-side fortified town founded by the Portuguese and built up by the Dutch in the 17th century, a World Heritage Site of colonial lanes, boutiques, cafés and a white lighthouse on the ramparts.' },
    tip: { he: 'הקיפו את החומות ברגל לקראת השקיעה – כ־שעה. החום בצהריים כבד, אז נחו בבית קפה בשעות האלה.', en: 'Walk the rampart circuit toward sunset – about an hour. Midday heat is heavy, so café-hop then.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'sri-lanka|Whale-watching cruise from Mirissa': {
    about: { he: 'הפלגה של כמה שעות מנמל מיריסה לחפש לווייתנים כחולים – החיה הגדולה בכדור הארץ – ולצידם לעיתים לווייתני זרע ולהקות דולפינים.', en: 'A few hours’ cruise from Mirissa harbour in search of blue whales – the largest animal on Earth – often with sperm whales and dolphin pods too.' },
    tip: { he: 'העונה בערך נובמבר עד אפריל. היציאה בשעות הבוקר המוקדמות; קחו כדור נגד בחילה ומעיל רוח. בחרו מפעיל שמכבד מרחק מהלווייתנים.', en: 'Season is roughly November to April. Boats leave early; take seasickness tablets and a windbreaker. Choose an operator that keeps a respectful distance.' },
    book: 'recommended', ticketIls: { low: 150, high: 300 } },

  // ───── Goa ─────
  'goa|Basilica of Bom Jesus': {
    about: { he: 'כנסייה בארוקית מ־1605 בגואה העתיקה, אתר מורשת עולמית, ששומרת את גופתו של פרנסיס חאווייר בארון כסף מעוטר. חזית לבנים אדומות וכנסייה פנימית מוזהבת.', en: 'A 1605 baroque church in Old Goa, a World Heritage Site, holding the remains of St Francis Xavier in an ornate silver casket. Bare red-laterite façade, gilded interior.' },
    tip: { he: 'זו כנסייה פעילה – כסו כתפיים וברכיים ושמרו על שקט בזמן תפילה. שלבו עם קתדרלת סה ממול.', en: 'It’s a working church – cover shoulders and knees and keep quiet during services. Pair it with Se Cathedral opposite.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'goa|Se Cathedral': {
    about: { he: 'אחת הכנסיות הגדולות באסיה, שהושלמה ב־1619, עם חזית לבנה בסגנון פורטוגלי־מנואלי. בפנים מזבח מוזהב ופעמון הזהב המפורסם במגדל.', en: 'One of Asia’s largest churches, completed in 1619, with a white Portuguese-Manueline façade, a gilded altar and the famous Golden Bell in its tower.' },
    tip: { he: 'נמצאת ממש מול בזיליקת בום ג׳יזוס – קחו חצי יום לכל גואה העתיקה. בואו בבוקר, החום בצהריים חזק.', en: 'It’s right across from Bom Jesus – allow half a day for Old Goa. Come in the morning before the heat.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'goa|Fontainhas — the Latin Quarter': {
    about: { he: 'הרובע הפורטוגלי הוותיק של פנג׳ים, עם בתים צבועים בצהוב, כחול וירוק, מרפסות עץ ואריחי אזולז׳ו. סמטאות שקטות עם גלריות, בתי הארחה ומאפיות גואניות.', en: 'Panaji’s old Portuguese quarter of yellow, blue and green houses with wooden balconies and azulejo tiles – quiet lanes of galleries, guesthouses and Goan bakeries.' },
    tip: { he: 'טיילו בבוקר או אחר הצהריים המאוחרים לאור טוב. נסו באבינקה (עוגת שכבות גואנית) במאפייה מקומית.', en: 'Walk early or late afternoon for good light. Try bebinca, the Goan layer cake, at a local bakery.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'goa|Anjuna Flea Market (Wednesdays)': {
    about: { he: 'שוק הפשפשים המפורסם שנולד בתקופת ההיפים, ליד חוף אנג׳ונה. מאות דוכנים של בגדים, תכשיטים, בדים מקשמיר ורג׳סטאן, תבלינים ומזכרות, עם מוזיקה ובתי קפה.', en: 'The famous flea market born in the hippie era by Anjuna beach: hundreds of stalls selling clothes, jewellery, Kashmiri and Rajasthani textiles, spices and souvenirs, with music and cafés.' },
    tip: { he: 'מתמקחים חזק – התחילו מחצי מהמחיר. השוק פעיל בעיקר בעונה (נובמבר–אפריל), הגיעו לפני הצהריים.', en: 'Haggle hard – start at half. It runs mainly in season (Nov–Apr); arrive before midday.' },
    book: 'no', ticketIls: { low: 0, high: 0 }, hours: { he: 'ימי רביעי, בעונה', en: 'Wednesdays, in season' } },
  'goa|Arpora Saturday Night Market': {
    about: { he: 'שוק לילה גדול באווירת פסטיבל, עם מאות דוכני בגדים, מלאכת יד, אוכל מכל העולם ובמה עם מוזיקה חיה. אחד הבילויים הפופולריים של צפון גואה.', en: 'A big festival-style night market with hundreds of stalls of clothes, crafts and international food, plus a live-music stage – one of North Goa’s favourite evenings out.' },
    tip: { he: 'מתחיל בסביבות 18:00 ופעיל רק בעונה. הגיעו במונית – החנייה מסביב עמוסה מאוד.', en: 'Starts around 6pm and runs in season only. Take a taxi – parking is chaotic.' },
    book: 'no', ticketIls: { low: 0, high: 0 }, hours: { he: 'מוצאי שבת, בעונה', en: 'Saturday evenings, in season' } },
  'goa|Chapora Fort': {
    about: { he: 'חורבות מבצר פורטוגלי מהמאה ה־17 על גבעה מעל שפך נהר צ׳פורה וחוף ואגאטור. מעט נשאר מהמבנה, אבל הנוף על הים והחופים מרהיב, ומוכר מסרט בוליווד מפורסם.', en: 'Ruins of a 17th-century Portuguese fort on a hill above the Chapora river mouth and Vagator beach. Little remains, but the sea views are superb – famous from a Bollywood hit.' },
    tip: { he: 'עלו לקראת השקיעה; העלייה קצרה אבל תלולה ובלי צל. נעלו נעליים סגורות – השביל סלעי.', en: 'Go up for sunset; the climb is short but steep with no shade. Wear closed shoes – the path is rocky.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'goa|Arambol Beach': {
    about: { he: 'החוף הצפוני והבוהמייני של גואה, עם אווירה רגועה, שיעורי יוגה, צריפי חוף ומעגלי תופים בשקיעה. מצפון לחוף נמצא אגם מים מתוקים קטן ליד הים.', en: 'Goa’s northernmost and most bohemian beach: relaxed vibe, yoga classes, beach shacks and sunset drum circles. Just north is a small freshwater lake by the sea.' },
    tip: { he: 'בשקיעה, בייחוד בימי ראשון, מתאספים מתופפים ולהטוטנים על החוף. לכו לאורך החוף צפונה עד ״אגם המים המתוקים״.', en: 'At sunset, especially Sundays, drummers and jugglers gather on the sand. Walk north along the beach to the Sweet Water Lake.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'goa|Fort Aguada': {
    about: { he: 'מבצר פורטוגלי מ־1612 על כף מעל הים, עם חומות אבן אדומה ומגדלור ישן מהעתיקים באסיה. בעבר שימש תחנת מים לספינות – מכאן השם ״אגואדה״ (מים).', en: 'A 1612 Portuguese fort on a headland, with red-stone walls and one of Asia’s oldest lighthouses. Ships once took on fresh water here – hence ‘Aguada’.' },
    tip: { he: 'בואו אחר הצהריים המאוחרים לנוף על חוף קנדולים והשקיעה. המבצר העליון קטן – חצי שעה מספיקה.', en: 'Come late afternoon for views over Candolim beach and the sunset. The upper fort is small – half an hour is enough.' },
    book: 'no', ticketIls: { low: 0, high: 5 } },
  'goa|Palolem Beach': {
    about: { he: 'מפרץ בצורת סהר עם חול לבן, דקלי קוקוס ומים שקטים יחסית, מהיפים בגואה. לאורכו צריפי חוף, בקתות עץ וסירות דייגים צבעוניות.', en: 'A crescent bay of white sand, coconut palms and relatively calm water – one of Goa’s prettiest – lined with beach shacks, huts and colourful fishing boats.' },
    tip: { he: 'בערבים מסוימים יש ״מסיבות שקטות״ עם אוזניות. הקצה הצפוני שקט יותר לשחייה.', en: 'Some nights host silent-headphone parties. The northern end is quieter for swimming.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'goa|Agonda Beach': {
    about: { he: 'חוף ארוך ושקט בדרום גואה, בלי מסיבות ועם בקתות עץ פזורות בין הדקלים. בקצה החוף צבי ים מקננים בעונה, ולכן האזור שמור ורגוע.', en: 'A long, quiet South Goa beach with no party scene and huts scattered among the palms. Olive ridley turtles nest at one end in season, keeping it protected and peaceful.' },
    tip: { he: 'מושלם ליום של כלום – ספר, שחייה וארוחת דגים. הים יכול להיות גלי; שחו ליד המצילים.', en: 'Perfect for a do-nothing day: book, swim, fish lunch. Waves can be strong – swim near lifeguards.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'goa|Butterfly Beach by boat from Palolem': {
    about: { he: 'מפרץ קטן ונסתר שמוקף צוקים וג׳ונגל, נגיש בעיקר בסירה מפאלולם. בדרך הסירות לרוב עוצרות לראות דולפינים, ועל החוף אפשר לשחות ולשנרקל.', en: 'A small hidden cove ringed by cliffs and jungle, reached mainly by boat from Palolem. Boats often stop to look for dolphins on the way; at the beach you swim and snorkel.' },
    tip: { he: 'התמקחו על מחיר הסירה ישירות עם הסירנים בחוף ובקשו עצירת דולפינים. יציאה בבוקר – הים שקט יותר.', en: 'Negotiate directly with boatmen on Palolem beach and ask for a dolphin stop. Morning trips have calmer seas.' },
    book: 'no', ticketIls: { low: 15, high: 45 } },
  'goa|A spice plantation near Ponda': {
    about: { he: 'סיור מודרך במטע ג׳ונגל שבו גדלים פלפל שחור, הל, וניל, קינמון ואגוז מוסקט. מריחים, טועמים ומסיימים בארוחת תאלי גואנית על עלה בננה.', en: 'A guided walk through a jungle plantation growing black pepper, cardamom, vanilla, cinnamon and nutmeg – smell, taste, then a Goan thali lunch on a banana leaf.' },
    tip: { he: 'בואו לפני הצהריים כדי שהסיור יסתיים בארוחה. מומלץ להוסיף ביקור במקדש מנגשי הסמוך.', en: 'Arrive late morning so the tour ends with lunch. Add nearby Mangueshi Temple.' },
    book: 'no', ticketIls: { low: 20, high: 45 } },
  'goa|Shri Mangueshi Temple': {
    about: { he: 'אחד המקדשים ההינדיים החשובים בגואה, מוקדש לשיווה, עם מגדל מנורות לבן בן שבע קומות וכיפות בהשפעה פורטוגלית. בערבי חג המגדל מואר במנורות שמן.', en: 'One of Goa’s most important Hindu temples, dedicated to Shiva, with a seven-storey white lamp tower and Portuguese-influenced domes. On festival nights the tower is lit with oil lamps.' },
    tip: { he: 'חלצו נעליים, לבוש צנוע. הצילום בתוך המקדש הפנימי אסור – כבדו את השלטים.', en: 'Shoes off, modest dress. Photography inside the inner sanctum isn’t allowed.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },

  // ───── Zanzibar ─────
  'zanzibar|Stone Town walking tour': {
    about: { he: 'סיור בעיר העתיקה של זנזיבר, אתר מורשת עולמית: סמטאות צרות, דלתות עץ מגולפות בסגנון ערבי והודי, בתי סוחרים, מסגדים וכנסיות. מדריך מקומי מסביר על היסטוריית הסחר בתבלינים.', en: 'A walk through Zanzibar’s World Heritage old town: narrow alleys, carved Arab and Indian wooden doors, merchants’ houses, mosques and churches, with a local guide on the spice-trade history.' },
    tip: { he: 'קחו מדריך מורשה – קל ללכת לאיבוד. התלבשו בצניעות, כתפיים וברכיים מכוסות. כולל בדרך כלל את בית פרדי מרקיורי.', en: 'Use a licensed guide – it’s easy to get lost. Dress modestly, shoulders and knees covered. Many tours pass the Freddie Mercury house.' },
    book: 'recommended', ticketIls: { low: 55, high: 120 } },
  'zanzibar|Forodhani Gardens night food market': {
    about: { he: 'גן על שפת הים שבו מדי ערב קמים דוכני אוכל: שיפודי פירות ים, ״פיצה זנזיבר״ מקופלת, מיץ קני סוכר טרי וצ׳יפסי מוהוגו. ילדים מקומיים קופצים לים מהמזח בשקיעה.', en: 'A seafront garden where food stalls pop up every evening: seafood skewers, folded ‘Zanzibar pizza’, fresh sugarcane juice and cassava chips, while local kids leap off the jetty at sunset.' },
    tip: { he: 'בקשו מחיר לפני שמזמינים ובחרו דגים שנראים טריים ובושלו מול עיניכם. הגיעו בשקיעה.', en: 'Agree prices before ordering and pick seafood that looks fresh and is cooked in front of you. Come at sunset.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'zanzibar|Darajani Market': {
    about: { he: 'השוק המרכזי של סטון טאון, בתוך מבנה מהתקופה הקולוניאלית ומסביבו: אולם דגים, אולם בשר, ערימות פירות טרופיים ודוכני תבלינים. החיים המקומיים במלוא עוצמתם.', en: 'Stone Town’s main market in and around a colonial-era hall: fish hall, meat hall, piles of tropical fruit and spice stalls – local life at full volume.' },
    tip: { he: 'בקרו בבוקר כשהסחורה טרייה. בקשו רשות לפני שמצלמים אנשים. אולם הבשר והדגים חזק לאף רגיש.', en: 'Go in the morning when it’s freshest. Ask before photographing people. The meat and fish halls are pungent.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'zanzibar|The Old Fort': {
    about: { he: 'מבצר אבן שבנו העומאנים בסוף המאה ה־17, הבניין העתיק ביותר בסטון טאון. בחצר שווקי מלאכת יד, בית קפה ואמפיתאטרון שמארח מופעים ופסטיבלים.', en: 'A stone fort built by the Omanis in the late 17th century, Stone Town’s oldest building. Its courtyard holds craft stalls, a café and an amphitheatre for shows and festivals.' },
    tip: { he: 'הכניסה חינם – שלבו עם בית הפלאות הסמוך וגני פורודאני. בדקו אם יש מופע באמפיתאטרון בערב.', en: 'Entry is free – combine with the nearby House of Wonders and Forodhani Gardens. Check for evening shows.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'zanzibar|Former Slave Market site & Anglican Cathedral': {
    about: { he: 'האתר שבו פעל שוק העבדים הגדול של מזרח אפריקה עד 1873, ועליו נבנתה הקתדרלה האנגליקנית. מוזיאון מרגש מספר את ההיסטוריה, ובמרתף נשמרו תאי כליאה קטנים.', en: 'The site of East Africa’s last major slave market, closed in 1873, where the Anglican Cathedral was built. A moving museum tells the story, and tiny holding cells survive below.' },
    tip: { he: 'הכרטיס כולל סיור מודרך – כדאי. הקדישו כשעה והגיעו בבוקר לפני הקבוצות.', en: 'The ticket includes a guided tour – worth it. Allow about an hour; morning is quieter.' },
    book: 'no', ticketIls: { low: 30, high: 60 } },
  'zanzibar|Prison Island (Changuu) & giant tortoises': {
    about: { he: 'אי קטן כ־30 דקות שייט מסטון טאון, עם בית כלא שלא שימש מעולם ומושבה של צבי ענק מאלדברה, חלקם בני יותר ממאה שנה. בדרך עוצרים לשנורקלינג.', en: 'A small island about 30 minutes by boat from Stone Town, with a never-used prison and a colony of Aldabra giant tortoises, some over 100 years old, plus a snorkel stop.' },
    tip: { he: 'מותר להאכיל ולגעת בעדינות בצבים לפי הנחיות הצוות. קבעו מחיר הסירה מראש; דמי הכניסה לאי משולמים בנפרד.', en: 'You can gently feed and touch the tortoises under staff guidance. Fix the boat price in advance; island entry is paid separately.' },
    book: 'recommended', ticketIls: { low: 80, high: 200 } },
  'zanzibar|Spice tour': {
    about: { he: 'סיור בחווה מחוץ לסטון טאון שבה רואים איך גדלים ציפורן, וניל, קינמון, אגוז מוסקט ופלפל. מריחים, טועמים פירות טרופיים, ולפעמים מטפסים על עץ קוקוס.', en: 'A visit to a farm outside Stone Town to see how cloves, vanilla, cinnamon, nutmeg and pepper grow. Smell, taste tropical fruit and maybe watch someone climb a coconut palm.' },
    tip: { he: 'הסיורים כוללים לרוב ארוחת צהריים מקומית – שאלו מראש. בסוף מציעים למכור תבלינים; אין חובה לקנות.', en: 'Tours often include a local lunch – ask first. You’ll be offered spices at the end; no obligation to buy.' },
    book: 'recommended', ticketIls: { low: 55, high: 130 } },
  'zanzibar|Jozani Forest (Jozani Chwaka Bay National Park)': {
    about: { he: 'הפארק הלאומי היחיד בזנזיבר, יער טרופי שבו חיים קופי קולובוס אדומים נדירים שקיימים רק באי. מטיילים עם מדריך ביער ובשביל עץ בין עצי מנגרובים.', en: 'Zanzibar’s only national park, a tropical forest home to rare red colobus monkeys found only on the island. Walk with a guide through the forest and on a boardwalk through mangroves.' },
    tip: { he: 'הקופים רגילים לאנשים – שמרו מרחק של כמה מטרים ואל תאכילו. שלבו בדרך לחופים בדרום־מזרח.', en: 'The monkeys are used to people – keep a few metres away and don’t feed them. Combine on the way to the south-east beaches.' },
    book: 'no', ticketIls: { low: 40, high: 60 } },
  'zanzibar|Snorkelling at Mnemba Atoll': {
    about: { he: 'שונית שמורה סביב אי פרטי קטן בצפון־מזרח, עם מים צלולים, דגים צבעוניים, צבי ים ולעיתים להקות דולפינים בדרך. אחד מאתרי השנורקלינג הטובים בזנזיבר.', en: 'A protected reef around a small private island in the north-east, with clear water, colourful fish, turtles and often dolphins on the way – one of Zanzibar’s best snorkelling spots.' },
    tip: { he: 'צאו בבוקר, לפני שהרוח מגבירה את הגלים. הקפידו לא לדרוך על האלמוגים. דמי השמורה הימית לרוב בנפרד.', en: 'Go in the morning before the wind picks up. Never stand on the coral. The marine-park fee is often extra.' },
    book: 'recommended', ticketIls: { low: 130, high: 300 } },
  'zanzibar|Nungwi Beach': {
    about: { he: 'החוף שבקצה הצפוני של האי, עם חול לבן ומים טורקיז שבהם הגאות והשפל מתונים יחסית – אפשר לשחות כמעט כל היום. מסביב מספנות סירות דאו מסורתיות ומסעדות.', en: 'The beach at the island’s northern tip, with white sand and turquoise water where tides are relatively mild, so swimming works most of the day. Traditional dhow builders and restaurants nearby.' },
    tip: { he: 'השקיעות מעל הים כאן מהיפות באי. בקרו בשמורת הצבים הקטנה (Mnarani) בכפר.', en: 'Sunsets over the sea here are among the island’s best. Visit the small Mnarani turtle sanctuary in the village.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'zanzibar|Sunset dhow cruise': {
    about: { he: 'שייט בסירת דאו מסורתית עם מפרש משולש, לקראת השקיעה. משקה ביד, לפעמים מוזיקת טאראב חיה, והשמש שוקעת מעל האוקיינוס ההודי.', en: 'A sail on a traditional lateen-rigged dhow at sunset – drink in hand, sometimes live taarab music – as the sun sinks into the Indian Ocean.' },
    tip: { he: 'שייטים יוצאים מסטון טאון, נונגווי וקנדווה. ודאו מה כלול – שתייה ופירות לפעמים בתוספת.', en: 'Cruises leave from Stone Town, Nungwi and Kendwa. Check what’s included – drinks and fruit are sometimes extra.' },
    book: 'recommended', ticketIls: { low: 75, high: 230 } },
  'zanzibar|Kitesurfing lesson in Paje': {
    about: { he: 'פאג׳ה הוא ממרכזי הקייטסרפינג של אפריקה: לגונה רדודה וחמימה ורוח קבועה רוב השנה. שיעור ראשון מתמקד בשליטה בעפיפון על החוף ובמים הרדודים.', en: 'Paje is one of Africa’s kitesurfing hubs: a shallow, warm lagoon and steady wind most of the year. A first lesson focuses on kite control on the beach and in the shallows.' },
    tip: { he: 'הרוח הקבועה בערך ביוני–ספטמבר ובדצמבר–פברואר. בשפל הלגונה מתרוקנת – בתי הספר מתזמנים לפי הגאות.', en: 'Steady wind roughly Jun–Sep and Dec–Feb. At low tide the lagoon drains, so schools schedule by the tide.' },
    book: 'recommended', ticketIls: { low: 220, high: 500 } },
  'zanzibar|Menai Bay boat trip & Kwale sandbank': {
    about: { he: 'יום בסירת דאו בשמורת מפרץ מנאי: שנורקלינג, ביקור בגדת חול, שחייה בלגונה של מנגרובים ועץ באובב ענק על אי קוואלה. לעיתים רואים דולפינים, ובסוף ארוחת פירות ים.', en: 'A dhow day in the Menai Bay conservation area: snorkelling, a sandbank stop, a swim in a mangrove lagoon and a giant baobab on Kwale Island – often dolphins, then a seafood lunch.' },
    tip: { he: 'מוכר גם בשם ״ספארי בלו״. הימנעו מסירות שרודפות אחרי דולפינים. קחו קרם הגנה ונעלי מים.', en: 'Often sold as ‘Safari Blue’. Avoid boats that chase dolphins. Bring sunscreen and water shoes.' },
    book: 'recommended', ticketIls: { low: 180, high: 350 } },

  // ───── Seychelles ─────
  'seychelles|Anse Source d’Argent': {
    about: { he: 'אחד החופים המצולמים בעולם: סלעי גרניט ורודים ענקיים, חול לבן ולגונות רדודות בצבע טורקיז. נגיש דרך אחוזת יוניון, עם מפרצונים קטנים שמתגלים לאורך הקו.', en: 'One of the world’s most photographed beaches: huge pink granite boulders, white sand and shallow turquoise lagoons, reached through L’Union Estate with little coves along the way.' },
    tip: { he: 'בשפל המים רדודים מאוד – בדקו טבלת גאות ובואו בגאות בינונית. הגיעו מוקדם בבוקר או אחר הצהריים לאור הכי יפה על הסלעים.', en: 'At low tide the water is ankle-deep – check tides and aim for mid-tide. Morning or late afternoon gives the best light on the rocks.' },
    book: 'no', ticketIls: { low: 40, high: 60 } },
  'seychelles|L’Union Estate & giant tortoises': {
    about: { he: 'מטע קוקוס ווניל היסטורי בלה דיג, עם בית אחוזה קולוניאלי, מכבש קופרה מסורתי ומתחם של צבי ענק. דרכו עוברים לחוף אנס סורס ד׳ארז׳אן.', en: 'A historic coconut and vanilla plantation on La Digue with a colonial house, a traditional copra mill and a giant-tortoise pen – and the gateway to Anse Source d’Argent.' },
    tip: { he: 'הכרטיס תקף לכל היום – אפשר לצאת ולחזור. שכרו אופניים, זו הדרך הנוחה להסתובב בלה דיג.', en: 'The ticket is valid all day, so you can come and go. Rent a bike – it’s how everyone gets around La Digue.' },
    book: 'no', ticketIls: { low: 40, high: 60 } },
  'seychelles|Vallée de Mai (World Heritage Site)': {
    about: { he: 'יער דקלים קדום בפראסלין, אתר מורשת עולמית, שבו גדל הקוקו־דה־מר – הדקל עם הזרע הגדול בעולם. הולכים בשבילים מוצלים ומקשיבים לתוכי השחור הנדיר.', en: 'A primeval palm forest on Praslin, a World Heritage Site, home to the coco de mer – the palm with the world’s largest seed. Walk shaded trails listening for the rare black parrot.' },
    tip: { he: 'הצטרפו לסיור המודרך החינמי שיוצא מהכניסה. הגיעו בבוקר המוקדם – אז הציפורים פעילות והיער קריר.', en: 'Join the free guided walk from the entrance. Come early when birds are active and it’s cooler.' },
    book: 'no', ticketIls: { low: 100, high: 140 } },
  'seychelles|Anse Lazio': {
    about: { he: 'חוף בצפון פראסלין שמדורג שוב ושוב בין היפים בעולם: חול לבן ועמוק, מים צלולים בגווני כחול וסלעי גרניט בשני הקצוות. מתאים לשחייה ולשנורקלינג ליד הסלעים.', en: 'A north Praslin beach regularly ranked among the world’s best: deep white sand, crystal-clear water and granite boulders at both ends – good for swimming and snorkelling by the rocks.' },
    tip: { he: 'קחו שמשייה או חפשו צל תחת עצי טקמאקה. בעונת רוחות דרום־מזרחיות (מאי–ספטמבר) הים כאן רגוע במיוחד.', en: 'Bring shade or find it under takamaka trees. During the south-east trades (May–Sep) the sea here is especially calm.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'seychelles|Curieuse Island & snorkelling at St Pierre': {
    about: { he: 'שייט מפראסלין לאי קוריוז, שמורת טבע עם צבי ענק שמסתובבים חופשי, שביל עץ בין מנגרובים ומושבת מצורעים היסטורית. בדרך עוצרים לשנורקלינג באי הזעיר סנט פייר.', en: 'A boat trip from Praslin to Curieuse, a reserve where giant tortoises roam free, with a mangrove boardwalk and a historic leper colony, plus a snorkel stop at tiny St Pierre islet.' },
    tip: { he: 'רוב הטיולים כוללים ברביקיו על החוף. נעלו סנדלים להליכה בשביל בין החופים, ודמי הפארק משולמים בנפרד.', en: 'Most trips include a beach barbecue. Wear sandals for the trail between beaches; park fees are usually extra.' },
    book: 'recommended', ticketIls: { low: 300, high: 600 } },
  'seychelles|Beau Vallon Beach': {
    about: { he: 'החוף הארוך והפופולרי בצפון מאהה, עם מים שקטים ברוב השנה, ספורט ימי, מסעדות ומועדוני צלילה. בערבי רביעי מתקיים בו שוק אוכל מקומי.', en: 'North Mahé’s long, popular beach with calm water most of the year, watersports, restaurants and dive centres. A local food market sets up on Wednesday evenings.' },
    tip: { he: 'השקיעות כאן יפות במיוחד. בעונת המונסון הצפון־מערבי (נובמבר–מרץ) הים יכול להיות גלי יותר.', en: 'Sunsets are lovely here. In the north-west monsoon (Nov–Mar) the sea can get choppier.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'seychelles|Sainte Anne Marine National Park': {
    about: { he: 'פארק ימי של שישה איים מול ויקטוריה, הראשון מסוגו באוקיינוס ההודי. שטים בסירה עם רצפת זכוכית, משנרקלים מעל אלמוגים ודגים ונחים על חוף באחד האיים.', en: 'A marine park of six islands off Victoria, the first of its kind in the Indian Ocean. Ride a glass-bottom boat, snorkel over coral and fish, and relax on an island beach.' },
    tip: { he: 'חצי יום מספיק. בחרו טיול שכולל עצירה בחוף באי מוייאן או סנט אן. דמי הפארק לרוב בתוספת.', en: 'Half a day is enough. Pick a trip that includes a beach stop on Moyenne or Sainte Anne. Park fees are often extra.' },
    book: 'recommended', ticketIls: { low: 200, high: 500 } },
  'seychelles|Morne Seychellois National Park & the Copolia trail': {
    about: { he: 'הפארק הלאומי הגדול במאהה, שמכסה את ההרים המיוערים של האי. שביל קופוליה הקצר והתלול (כשעה לכל כיוון) מסתיים בסלע גרניט עם תצפית על ויקטוריה והאיים.', en: 'Mahé’s largest national park, covering the island’s forested mountains. The short, steep Copolia trail (about an hour each way) ends on a granite dome overlooking Victoria and the islands.' },
    tip: { he: 'צאו בבוקר לפני העננים והחום. נעליים עם אחיזה – השביל בוצי אחרי גשם. ראו פרחי כד טורפים בדרך.', en: 'Go early before cloud and heat. Grippy shoes – it’s muddy after rain. Look for carnivorous pitcher plants on the way.' },
    book: 'no', ticketIls: { low: 0, high: 40 } },
  'seychelles|Sir Selwyn Selwyn-Clarke Market, Victoria': {
    about: { he: 'השוק המרכזי של הבירה הזעירה ויקטוריה, מ־1840: דגים טריים כמו טונה ודגי פרפר, פירות טרופיים, תבלינים, רטבי צ׳ילי ומזכרות. בקומה העליונה דוכני אמנות ובית קפה.', en: 'The main market of tiny Victoria, dating to 1840: fresh tuna and reef fish, tropical fruit, spices, chilli sauces and souvenirs, with craft stalls and a café upstairs.' },
    tip: { he: 'בואו בשבת בבוקר כשהשוק הכי תוסס. קנו וניל ותבלינים מקומיים – זולים יותר מבחנויות המלונות.', en: 'Come on Saturday morning when it’s busiest. Buy local vanilla and spices – cheaper than hotel shops.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'seychelles|Victoria Botanical Garden': {
    about: { he: 'גן בוטני קטן ומוצל בקצה ויקטוריה, עם דקלי קוקו־דה־מר, סחלבים, עצי תבלין ומתחם צבי ענק. מקום נעים להפסקה של שעה בעיר.', en: 'A small, shady botanical garden on the edge of Victoria with coco de mer palms, orchids, spice trees and a giant-tortoise enclosure – a pleasant hour’s break in town.' },
    tip: { he: 'אם לא מגיעים לפראסלין, כאן אפשר לראות קוקו־דה־מר מקרוב. בצהריים עטלפי פירות תלויים בעצים.', en: 'If you’re not going to Praslin, see coco de mer up close here. Fruit bats hang in the trees by day.' },
    book: 'no', ticketIls: { low: 20, high: 50 } },
  'seychelles|Mission Ruins viewpoint': {
    about: { he: 'שרידי בית ספר מהמאה ה־19 שהוקם לילדי עבדים משוחררים, על רכס ירוק בכביש ההרים של מאהה. שדרת עצי מהגוני מובילה לביתן עם נוף רחב על החוף המערבי.', en: 'Ruins of a 19th-century school for children of freed slaves on a green ridge along Mahé’s mountain road. An avenue of trees leads to a pavilion with sweeping west-coast views.' },
    tip: { he: 'עצירה של חצי שעה בדרך בכביש Sans Souci. בבוקר יש פחות עננים על הנוף.', en: 'A half-hour stop on the Sans Souci road. Mornings have less cloud over the view.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'seychelles|Anse Intendance': {
    about: { he: 'חוף פראי ויפהפה בדרום מאהה, עם חול לבן רך, דקלים וגלים חזקים. צבי ים מקננים כאן, ובית המלון היחיד בקצה משאיר את רוב החוף שקט.', en: 'A wild, beautiful beach in south Mahé with soft white sand, palms and powerful surf. Turtles nest here, and the lone resort at one end leaves most of it quiet.' },
    tip: { he: 'אין שונית מגינה – בעונת הרוחות הדרום־מזרחיות (מאי–ספטמבר) הגלים גבוהים ועדיף רק להתבונן. שתייה וצל הביאו מראש.', en: 'No protective reef – in the south-east trades (May–Sep) waves are big, so just admire. Bring drinks and shade.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },

  // ───── Mauritius ─────
  'mauritius|Seven Coloured Earth, Chamarel': {
    about: { he: 'גבעות קטנות של אדמה וולקנית בשכבות של אדום, סגול, כחול וצהוב, שנוצרו מבלייה של בזלת. בתוך הפארק הגאולוגי יש גם צבי ענק ושביל תצפית.', en: 'Small dunes of volcanic earth banded red, purple, blue and yellow, formed by weathered basalt. The geopark also has giant tortoises and a viewing walkway.' },
    tip: { he: 'הצבעים הכי חזקים אחרי גשם ובשמש של אחר הצהריים. הכרטיס כולל גם את תצפית מפל שאמארל.', en: 'Colours pop most after rain and in afternoon sun. The ticket also covers the Chamarel Waterfall lookout.' },
    book: 'no', ticketIls: { low: 30, high: 50 } },
  'mauritius|Chamarel Waterfall': {
    about: { he: 'המפל הגבוה במאוריציוס, שנופל כ־100 מטר מצוק בזלת אל ערוץ ירוק. רואים אותו מתצפית מסודרת בתוך פארק שאמארל.', en: 'Mauritius’ highest waterfall, dropping about 100 m from a basalt cliff into a green gorge, seen from a viewing platform within the Chamarel park.' },
    tip: { he: 'הכי מרשים בעונת הגשמים (ינואר–מרץ). המדרגות למטה עם תצפית נוספת – שווה את המאמץ הקטן.', en: 'Most impressive in the rainy season (Jan–Mar). Take the stairs down to the lower lookout – worth the small effort.' },
    book: 'no', ticketIls: { low: 30, high: 50 } },
  'mauritius|Black River Gorges National Park': {
    about: { he: 'הפארק הלאומי הגדול במאוריציוס, עם יער גשם, ערוצים עמוקים ומפלים. יש בו שבילי הליכה ותצפיות, ואפשר לראות את בז מאוריציוס הנדיר וקופים.', en: 'Mauritius’ largest national park, with rainforest, deep gorges and waterfalls. Hiking trails and lookouts offer chances to see the rare Mauritius kestrel and monkeys.' },
    tip: { he: 'התצפית של ערוצי בלאק ריבר על הכביש היא עצירה קלה. למסלול ארוך כמו מפל אלכסנדרה, צאו בבוקר עם מים ומעיל גשם.', en: 'The Black River Gorges viewpoint by the road is an easy stop. For longer trails go early with water and a rain jacket.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'mauritius|Le Morne Brabant hike': {
    about: { he: 'הר בזלת דרמטי בקצה הדרום־מערבי, אתר מורשת עולמית לזכר עבדים נמלטים שהסתתרו בו. הטיפוס כ־3–4 שעות הלוך־חזור, ומהפסגה נשקף נוף על הלגונה בצורת ״מפל תת־ימי״.', en: 'A dramatic basalt mountain on the south-west tip, a World Heritage Site honouring escaped slaves who hid there. The 3–4 hour round trip ends with views over the lagoon’s ‘underwater waterfall’ illusion.' },
    tip: { he: 'התחילו מוקדם – אין צל. החלק העליון תלול וטכני, ועדיף לטפס עם מדריך מקומי. נעלי שטח חובה.', en: 'Start early – no shade. The upper section is steep and scrambly, best done with a local guide. Proper shoes essential.' },
    book: 'no', ticketIls: { low: 0, high: 250 } },
  'mauritius|Île aux Cerfs': {
    about: { he: 'אי קטן מול החוף המזרחי, עם חופים לבנים, לגונה טורקיז, מגרש גולף וספורט ימי. מגיעים בשאטל או בסירה מהירה, לרוב כיום שלם עם ארוחת ברביקיו.', en: 'A small island off the east coast with white beaches, a turquoise lagoon, a golf course and watersports. Reached by shuttle or speedboat, often as a full day with a barbecue lunch.' },
    tip: { he: 'בסופי שבוע ובצהריים עמוס – לכו לאורך החוף להרחק מנקודת הנחיתה למקום שקט. סיורים רבים עוצרים גם במפל GRSE.', en: 'Weekends and midday are busy – walk along the shore away from the landing spot. Many trips also stop at the GRSE waterfall.' },
    book: 'recommended', ticketIls: { low: 40, high: 300 } },
  'mauritius|Blue Bay Marine Park': {
    about: { he: 'שמורה ימית בדרום־מזרח עם לגונה רדודה וצלולה ואלמוגים בריאים. יוצאים בסירה עם רצפת זכוכית ומשנרקלים מעל ״אלמוג המוח״ ענק ולהקות דגים.', en: 'A south-east marine reserve with a shallow, clear lagoon and healthy coral. Go out on a glass-bottom boat and snorkel over a giant brain coral and schools of fish.' },
    tip: { he: 'בבוקר הים שקט והראות טובה יותר. אל תאכילו דגים ואל תגעו באלמוגים – זו שמורה.', en: 'Mornings bring calmer seas and better visibility. Don’t feed fish or touch coral – it’s protected.' },
    book: 'no', ticketIls: { low: 40, high: 120 } },
  'mauritius|Grand Bassin (Ganga Talao)': {
    about: { he: 'אגם בלוע הר געש כבוי בהרים, המקום הקדוש ביותר להינדים במאוריציוס. סביבו מקדשים צבעוניים, וליד הכניסה פסלי ענק של שיווה ודורגה בגובה כ־33 מטר.', en: 'A crater lake in the highlands, the holiest Hindu site in Mauritius, ringed by colourful temples and guarded by giant statues of Shiva and Durga about 33 m tall.' },
    tip: { he: 'חלצו נעליים בכניסה למקדשים והתלבשו בצניעות. בפברואר–מרץ, בחג מהא שיבראטרי, מאות אלפים צועדים לכאן – עמוס מאוד.', en: 'Shoes off at shrines, modest dress. Around Maha Shivaratri (Feb–Mar) hundreds of thousands make the pilgrimage – very crowded.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'mauritius|Pamplemousses Botanical Garden': {
    about: { he: 'הגן הבוטני העתיק בחצי הכדור הדרומי, מהמאה ה־18. השיא – בריכה עם עלי לוטוס ענקיים (ויקטוריה אמזוניקה), ולצידה דקלים נדירים, עצי תבלין וצבי ענק.', en: 'The southern hemisphere’s oldest botanical garden, from the 18th century. The highlight is a pond of giant Victoria lily pads, plus rare palms, spice trees and giant tortoises.' },
    tip: { he: 'שכרו מדריך בכניסה – בלי הסבר מפספסים את הסיפורים. בואו בבוקר, הצהריים חמים ולחים.', en: 'Hire a guide at the gate – without one you miss the stories. Mornings are cooler than humid midday.' },
    book: 'no', ticketIls: { low: 15, high: 40 } },
  'mauritius|Port Louis Central Market': {
    about: { he: 'השוק המקורה בבירה, מהמאה ה־19: פירות וירקות טרופיים, תבלינים, תה וניל, ובקומה העליונה בדים ומזכרות. ליד הכניסה נסו דאל פורי – הפיתה הממולאת המפורסמת.', en: 'The capital’s 19th-century covered market: tropical produce, spices, vanilla tea and, upstairs, textiles and souvenirs. Grab a dholl puri – the famous stuffed flatbread – near the entrance.' },
    tip: { he: 'בואו בבוקר בימי חול. התמקחו על מזכרות בקומה העליונה, לא על אוכל. שלבו עם הקאודן ווטרפרונט הסמוך.', en: 'Come on a weekday morning. Bargain for souvenirs upstairs, not food. Combine with nearby Caudan Waterfront.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'mauritius|Aapravasi Ghat (World Heritage Site)': {
    about: { he: 'שרידי מחנה ההגירה שבו נחתו כחצי מיליון פועלי חוזה, רובם מהודו, במאה ה־19 – ראשית ההגירה הגדולה שעיצבה את האוכלוסייה של מאוריציוס. מרכז מבקרים מציג את סיפוריהם.', en: 'Remains of the 19th-century immigration depot where about half a million indentured labourers, mostly from India, landed – the migration that shaped Mauritius’ population. A visitor centre tells their stories.' },
    tip: { he: 'האתר קטן ונמצא במרכז פורט לואי ליד התחנה – חצי שעה עד שעה. התחילו במרכז המבקרים.', en: 'Small and central near Port Louis bus station – 30–60 minutes. Start with the interpretation centre.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'mauritius|Trou aux Cerfs crater, Curepipe': {
    about: { he: 'לוע הר געש כבוי ומיוער בתוך העיר קורפיפ, בקוטר כ־300 מטר. הולכים בכביש שמקיף את שפת הלוע ונהנים מתצפית על ההרים ועל חלקו הפנימי של האי.', en: 'A dormant, forested volcanic crater inside Curepipe town, about 300 m across. A road circles the rim with views over the mountains and the island’s interior.' },
    tip: { he: 'ההליכה סביב הלוע כ־20 דקות. בקורפיפ קריר וגשום יותר מבחוף – קחו שכבה.', en: 'The rim walk takes about 20 minutes. Curepipe is cooler and wetter than the coast – bring a layer.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'mauritius|St Martin Jewish Cemetery': {
    about: { he: 'בית קברות קטן ומטופח שבו קבורים כ־127 פליטים יהודים ממרכז אירופה שהבריטים הגלו למאוריציוס ב־1940 והוחזקו באי עד 1945. ליד האתר מרכז מידע קטן שמספר את הסיפור.', en: 'A small, well-kept cemetery holding about 127 Jewish refugees from central Europe whom the British deported to Mauritius in 1940 and held there until 1945. A small information centre tells the story.' },
    tip: { he: 'בדקו מראש את שעות הפתיחה ותאמו ביקור, כי השער לא תמיד פתוח. לבוש מכובד.', en: 'Check opening times and arrange your visit in advance, as the gate isn’t always open. Dress respectfully.' },
    book: 'recommended', ticketIls: { low: 0, high: 0 } },
  'mauritius|Casela Nature Parks': {
    about: { he: 'פארק טבע וחיות בחוף המערבי: ספארי בפארק עם זברות וג׳ירפות, הליכה עם ציפורים, מפגש עם טורפים גדולים ואטרקציות אתגר כמו אומגות. מתאים מאוד למשפחות.', en: 'A nature and wildlife park on the west coast: a safari through grassland with zebras and giraffes, aviaries, big-cat encounters and adventure add-ons like ziplines. Very family-friendly.' },
    tip: { he: 'הכרטיס הבסיסי לא כולל פעילויות מיוחדות – הזמינו אותן מראש באתר. בואו מוקדם לפני החום.', en: 'Basic entry excludes special activities – book those online in advance. Arrive early before the heat.' },
    book: 'recommended', ticketIls: { low: 80, high: 160 } },

  // ───── Cape Town ─────
  'cape-town|Table Mountain & Aerial Cableway': {
    about: { he: 'ההר השטוח שמעל קייפטאון, כ־1,085 מטר. רכבל עם קרון מסתובב עולה לפסגה בכחמש דקות, ולמעלה שבילים קצרים עם תצפית על העיר, האוקיינוס ואי רובן.', en: 'The flat-topped mountain above Cape Town, about 1,085 m. A rotating cable car reaches the top in about five minutes; short trails up there overlook the city, ocean and Robben Island.' },
    tip: { he: 'הרכבל נסגר ברוח חזקה ובעננים (״מפת השולחן״) – בדקו בבוקר באתר ועלו ביום הבהיר הראשון. כרטיס מקוון חוסך תור.', en: 'The cableway closes in high wind or cloud (the ‘tablecloth’) – check online that morning and go up on the first clear day. Online tickets skip the queue.' },
    book: 'recommended', ticketIls: { low: 90, high: 130 } },
  'cape-town|Lion’s Head hike': {
    about: { he: 'מסלול טיפוס פופולרי שמתפתל סביב פסגה חרוטית בגובה 669 מטר, כשעה־שעה וחצי לכל כיוון. בקטע האחרון נאחזים בשרשראות וסולמות, ומלמעלה רואים את הר השולחן, קמפס ביי והעיר.', en: 'A popular hike spiralling up a 669 m conical peak, about 1–1.5 hours each way. The last section has chains and ladders, and the summit looks over Table Mountain, Camps Bay and the city.' },
    tip: { he: 'קלאסי לזריחה או לשקיעה – אם יורדים בחושך, קחו פנס. בימי רוח חזקה דלגו על הטיפוס.', en: 'A classic at sunrise or sunset – bring a headlamp if descending in the dark. Skip it on very windy days.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'cape-town|V&A Waterfront': {
    about: { he: 'הנמל ההיסטורי שהפך למתחם קניות, מסעדות ובילוי, עם הר השולחן ברקע. כלבי ים נחים על המזחים, נגני רחוב מופיעים, ויש שוק אוכל במחסן שעל המים.', en: 'The historic harbour turned shopping, dining and entertainment hub, with Table Mountain as a backdrop. Seals laze on the jetties, buskers play, and there’s a waterfront food market.' },
    tip: { he: 'מכאן יוצאות הסירות לאי רובן. נסו את שוק האוכל V&A Food Market ואת האקווריום Two Oceans לילדים.', en: 'Robben Island ferries leave from here. Try the V&A Food Market and, with kids, Two Oceans Aquarium.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'cape-town|Zeitz MOCAA': {
    about: { he: 'המוזיאון הגדול בעולם לאמנות עכשווית מאפריקה, בתוך ממגורת תבואה ישנה שגולפה מבפנים לאטריום בצורת גרגר תירס ענק. גם הבניין לבדו שווה ביקור.', en: 'The world’s largest museum of contemporary African art, inside an old grain silo carved out into a cathedral-like atrium shaped like a giant corn kernel. The building alone is worth it.' },
    tip: { he: 'בדקו באתר הנחות לתושבי אפריקה וימים מיוחדים. הקדישו שעתיים, וסיימו בבר על הגג.', en: 'Check the website for special days and discounts. Allow two hours and finish at the rooftop bar.' },
    book: 'recommended', ticketIls: { low: 50, high: 70 } },
  'cape-town|Robben Island': {
    about: { he: 'האי שבו נכלא נלסון מנדלה 18 שנה, היום אתר מורשת עולמית. מפליגים מהווטרפרונט, נוסעים באוטובוס סביב האי ומסיירים בכלא עם אסיר פוליטי לשעבר שמספר מניסיונו.', en: 'The island where Nelson Mandela was imprisoned for 18 years, now a World Heritage Site. Ferry from the Waterfront, bus round the island and tour the prison with a former political prisoner.' },
    tip: { he: 'הכרטיסים אוזלים ימים מראש – הזמינו באתר הרשמי. ההפלגות מבוטלות לעיתים במזג אוויר סוער, אז אל תשאירו ליום האחרון.', en: 'Tickets sell out days ahead – book on the official site. Sailings can be cancelled in rough weather, so don’t leave it to your last day.' },
    book: 'required', ticketIls: { low: 110, high: 130 } },
  'cape-town|Bo-Kaap': {
    about: { he: 'שכונה היסטורית במדרון הגבעה מעל מרכז העיר, מפורסמת בבתים בצבעים עזים – ורוד, טורקיז, צהוב. ביתה של הקהילה הקייפ־מלאית, עם מסגדים ותיקים ומטבח מקומי מתובל.', en: 'A historic hillside neighbourhood above the city centre, famous for houses painted in bright pink, turquoise and yellow – home of the Cape Malay community, old mosques and spicy local cooking.' },
    tip: { he: 'זו שכונת מגורים – צלמו בכבוד ואל תטפסו על מדרגות של בתים. שיעור בישול קייפ־מלאי בבית מקומי הוא חוויה מצוינת.', en: 'It’s a residential area – photograph respectfully and stay off doorsteps. A Cape Malay cooking class in a local home is excellent.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'cape-town|South African Jewish Museum': {
    about: { he: 'מוזיאון מודרני בגני החברה, שמספר את סיפור יהודי דרום אפריקה – רובם ממוצא ליטאי – ומחובר לבית הכנסת הראשון במדינה מ־1863. במתחם גם מרכז השואה של קייפטאון.', en: 'A modern museum in the Company’s Garden telling the story of South African Jewry – mostly of Lithuanian origin – linked to the country’s first synagogue from 1863. The Cape Town Holocaust Centre is on the same campus.' },
    tip: { he: 'הביאו דרכון – יש בדיקת ביטחון בכניסה. שלבו עם טיול בגני החברה (Company’s Garden) הסמוכים.', en: 'Bring ID – there’s a security check at the entrance. Pair with a walk in the adjacent Company’s Garden.' },
    book: 'no', ticketIls: { low: 20, high: 40 }, hours: { he: 'סגור בשבת ובחגים יהודיים', en: 'Closed Saturdays & Jewish holidays' } },
  'cape-town|Kirstenbosch National Botanical Garden': {
    about: { he: 'אחד הגנים הבוטניים היפים בעולם, על המדרון המזרחי של הר השולחן, עם צמחייה מקומית בלבד – פרוטאות, ציפורי גן עדן ופרחי בר. גשר עץ מתפתל (״הנחש״) עובר בין צמרות העצים.', en: 'One of the world’s great botanical gardens, on Table Mountain’s eastern slopes, planted only with native flora – proteas, bird-of-paradise and fynbos. A curving walkway, the ‘Boomslang’, winds through the treetops.' },
    tip: { he: 'בקיץ (נובמבר–אפריל) יש קונצרטים בשקיעה בימי ראשון – הביאו שמיכה ופיקניק. כרטיסים מקוונים חוסכים תור.', en: 'In summer (Nov–Apr) Sunday sunset concerts run on the lawns – bring a blanket and picnic. Online tickets save queuing.' },
    book: 'no', ticketIls: { low: 40, high: 55 } },
  'cape-town|Boulders Beach penguins': {
    about: { he: 'מושבה של כ־3,000 פינגווינים אפריקאים בין סלעי גרניט ענקיים בסיימונס טאון. רואים אותם מטיילות עץ מקרוב, ובחוף הסמוך אפשר אפילו לשחות לידם.', en: 'A colony of some 3,000 African penguins among huge granite boulders in Simon’s Town. Watch them up close from boardwalks, and on the adjacent beach you can even swim near them.' },
    tip: { he: 'אל תגעו בפינגווינים – הם נושכים. הגיעו בפתיחה, לפני אוטובוסי הטיולים. שלבו באותו יום עם כף התקווה הטובה.', en: 'Don’t touch – penguins bite. Arrive at opening before tour buses. Combine with Cape Point the same day.' },
    book: 'no', ticketIls: { low: 35, high: 50 } },
  'cape-town|Cape of Good Hope & Cape Point': {
    about: { he: 'הקצה הדרום־מערבי של חצי האי, בשמורת טבע עם צוקים דרמטיים, חופים פראיים, בבונים ואנטילופות. מטפסים או עולים ברכבל קצר למגדלור הישן ונהנים מנוף על האוקיינוס.', en: 'The peninsula’s rugged south-west tip in a nature reserve of dramatic cliffs, wild beaches, baboons and antelope. Walk or ride the funicular to the old lighthouse for ocean views.' },
    tip: { he: 'סגרו חלונות ונעלו רכב – הבבונים פותחים דלתות ולוקחים אוכל. הקדישו חצי יום ושלבו עם בולדרס.', en: 'Keep windows closed and car locked – baboons open doors for food. Allow half a day and combine with Boulders.' },
    book: 'no', ticketIls: { low: 80, high: 110 } },
  'cape-town|Chapman’s Peak Drive': {
    about: { he: 'כביש של כ־9 ק״מ עם 114 עיקולים, חצוב בצוק בין האוט ביי לנורדהוק, מעל האוקיינוס. אחד הכבישים היפים בעולם, עם מפרצי עצירה לתצפית.', en: 'A 9 km road with 114 bends carved into the cliffs between Hout Bay and Noordhoek above the ocean – one of the world’s great drives, with pull-outs for views.' },
    tip: { he: 'זה כביש אגרה. נסעו מצפון לדרום אחר הצהריים לאור טוב. נסגר לעיתים אחרי גשם כבד בגלל סכנת נפילת סלעים.', en: 'It’s a toll road. Drive north to south in the afternoon for the best light. It sometimes closes after heavy rain due to rockfall risk.' },
    book: 'no', ticketIls: { low: 10, high: 20 } },
  'cape-town|Camps Bay Beach': {
    about: { he: 'חוף חול לבן ורחב עם שורת הרים ״שנים־עשר השליחים״ ברקע, וטיילת של מסעדות וברים מול הים. מקום לשקיעה ולקוקטייל.', en: 'A wide white-sand beach backed by the Twelve Apostles mountains, with a strip of restaurants and bars facing the sea – the place for sunset and a cocktail.' },
    tip: { he: 'המים קרים מאוד גם בקיץ (סביב 13–16 מעלות). חוף קליפטון הסמוך מוגן יותר מרוח.', en: 'The water is icy even in summer (around 13–16°C). Neighbouring Clifton beaches are more sheltered from wind.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'cape-town|Sunset from Signal Hill': {
    about: { he: 'גבעה מעל העיר שאליה עולים ברכב עד הפסגה, עם נוף על הנמל, האוקיינוס האטלנטי והר השולחן. בשקיעה מתאספים שם מקומיים עם פיקניק ויין.', en: 'A hill above the city you can drive right up, with views over the harbour, the Atlantic and Table Mountain. Locals gather at sunset with picnics and wine.' },
    tip: { he: 'הגיעו 45 דקות לפני השקיעה – החנייה מתמלאת. מכאן גם ממריאים מצנחי רחיפה בטנדם, כשמזג האוויר מאפשר.', en: 'Arrive 45 minutes before sunset – parking fills. Tandem paragliders launch from here when the weather allows.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },

  // ───── Kenya safari ─────
  'kenya-safari|Game drives in the Maasai Mara National Reserve': {
    about: { he: 'נסיעות ספארי בג׳יפ פתוח בסוואנה המפורסמת של קניה, בשעות הבוקר ואחר הצהריים. רואים אריות, פילים, ג׳ירפות, זברות, היפופוטמים ולעיתים צ׳יטות ונמרים, עם מדריך שמזהה סימנים בשטח.', en: 'Open-roof jeep drives across Kenya’s famous savannah, morning and late afternoon. Lions, elephants, giraffes, zebras, hippos and often cheetahs and leopards, with a guide reading the signs.' },
    tip: { he: 'הנסיעה הראשונה בזריחה היא הטובה ביותר לטורפים. דמי השמורה היומיים גבוהים ולרוב כלולים בחבילה – ודאו. קחו משקפת.', en: 'The dawn drive is best for predators. Daily reserve fees are steep and usually bundled in your package – check. Bring binoculars.' },
    book: 'required', ticketIls: { low: 370, high: 1500 } },
  'kenya-safari|Mara River migration crossings': {
    about: { he: 'בעונת הנדידה הגדולה עשרות אלפי גנו וזברות חוצים את נהר המארה בקפיצות לתוך מים שבהם מחכים תנינים. מחזה טבע עוצמתי, שלפעמים דורש שעות של המתנה על הגדה.', en: 'During the Great Migration tens of thousands of wildebeest and zebra plunge across the Mara River past waiting crocodiles – a raw spectacle that can take hours of waiting on the bank.' },
    tip: { he: 'העונה בערך יולי–אוקטובר, והחציות לא צפויות מראש. קחו אוכל ושתייה ליום שלם וסבלנות.', en: 'Season is roughly July–October and crossings can’t be predicted. Pack food, water and patience for a full day.' },
    book: 'required', ticketIls: { low: 370, high: 1500 } },
  'kenya-safari|Hot-air balloon over the Mara': {
    about: { he: 'המראה בזריחה בכדור פורח שמרחף כשעה מעל הסוואנה, ורואים עדרים מלמעלה בשקט מוחלט. אחרי הנחיתה מגישים ארוחת בוקר בשטח עם שמפניה.', en: 'A sunrise lift-off in a hot-air balloon drifting for about an hour over the savannah, watching herds below in total silence, followed by a bush breakfast with champagne.' },
    tip: { he: 'מקומות מוגבלים – הזמינו עם הלודג׳ כמה שבועות מראש. האיסוף בסביבות 5:00 בבוקר; קחו מעיל.', en: 'Spaces are limited – book through your lodge weeks ahead. Pick-up is around 5am; bring a jacket.' },
    book: 'required', ticketIls: { low: 1600, high: 2100 } },
  'kenya-safari|Maasai village visit': {
    about: { he: 'ביקור בכפר (מניאטה) של בני המסאי ליד השמורה: ריקוד הקפיצה המסורתי, הדלקת אש בעזרת מקלות, הצצה לבית בוץ וזבל ושיחה על חיי רועי הבקר.', en: 'A visit to a Maasai manyatta near the reserve: the traditional jumping dance, fire-making with sticks, a look inside a mud-and-dung house and talk of herding life.' },
    tip: { he: 'בררו מראש שהתשלום הולך לקהילה. בסוף מציעים תכשיטי חרוזים – אין חובה לקנות, אבל זה מקור הכנסה חשוב.', en: 'Check that your fee goes to the community. Beadwork is offered at the end – no obligation, but it’s an important income.' },
    book: 'no', ticketIls: { low: 75, high: 180 } },
  'kenya-safari|Amboseli National Park': {
    about: { he: 'פארק מפורסם בעדרי פילים גדולים עם חטים ארוכים, על רקע הר קילימנג׳רו המושלג שמעבר לגבול. ביצות ירוקות מושכות היפופוטמים, תאואים ומאות מיני ציפורים.', en: 'Famous for big-tusked elephant herds against snow-capped Kilimanjaro across the border. Green swamps draw hippos, buffalo and hundreds of bird species.' },
    tip: { he: 'הקילימנג׳רו נראה בדרך כלל רק בזריחה ובשקיעה, לפני שהעננים מכסים. עלו לגבעת Observation Hill לנוף על הביצות.', en: 'Kilimanjaro usually shows only at dawn and dusk before clouds cover it. Climb Observation Hill for views over the swamps.' },
    book: 'recommended', ticketIls: { low: 220, high: 400 } },
  'kenya-safari|Lake Naivasha boat ride': {
    about: { he: 'שייט באגם מים מתוקים בעמק השבר, בין קבוצות היפופוטמים, עיטי דגים שצוללים לטרף ומאות מיני ציפורים. שעה של רוגע בין ימי הספארי.', en: 'A boat ride on a Rift Valley freshwater lake among hippo pods, fish eagles swooping for prey and hundreds of bird species – a calm hour between safari days.' },
    tip: { he: 'בקשו מהסירן לזרוק דג לעיט כדי לצלם את הצלילה. בבוקר המוקדם הציפורים הכי פעילות.', en: 'Ask the boatman to toss a fish for a fish-eagle dive shot. Early morning has the most bird activity.' },
    book: 'no', ticketIls: { low: 50, high: 150 } },
  'kenya-safari|Walking safari on Crescent Island': {
    about: { he: 'חצי אי באגם נאיבאשה שבו אין טורפים, ולכן מטיילים ברגל עם מדריך בין ג׳ירפות, זברות, גנו ואנטילופות מקרוב. חלק מהסרט ״זיכרונות מאפריקה״ צולם כאן.', en: 'A peninsula on Lake Naivasha with no big predators, so you walk with a guide right among giraffes, zebras, wildebeest and antelope. Scenes from ‘Out of Africa’ were filmed here.' },
    tip: { he: 'מגיעים בשייט קצר – שלבו עם שייט ההיפופוטמים. לבשו נעליים סגורות ובגדים בגוונים טבעיים.', en: 'Reached by a short boat ride – combine with the hippo cruise. Wear closed shoes and neutral colours.' },
    book: 'no', ticketIls: { low: 100, high: 150 } },
  'kenya-safari|Cycling in Hell’s Gate National Park': {
    about: { he: 'אחד הפארקים היחידים בקניה שבהם מותר לרכוב באופניים ולהלך בין זברות, ג׳ירפות ותאואים. רוכבים בין צוקים אדומים ועמודי וולקניים, ויורדים לערוץ צר עם מעיינות חמים.', en: 'One of the few Kenyan parks where you can cycle and walk among zebras, giraffes and buffalo, riding between red cliffs and volcanic towers down to a narrow gorge with hot springs.' },
    tip: { he: 'שכרו אופניים בשער וקחו מדריך לערוץ – הוא חובה בפועל ושווה את הכסף. הנופים השפיעו על ״מלך האריות״.', en: 'Rent bikes at the gate and take a guide into the gorge – effectively required and worth it. The scenery inspired ‘The Lion King’.' },
    book: 'no', ticketIls: { low: 110, high: 180 } },
  'kenya-safari|Lake Nakuru National Park': {
    about: { he: 'פארק סביב אגם בעמק השבר, מקלט חשוב לקרנפים לבנים ושחורים – הסיכוי לראות אותם כאן גבוה. גם ג׳ירפות רוטשילד, אריות על עצים, ולעיתים להקות פלמינגו.', en: 'A park around a Rift Valley lake that’s a key rhino sanctuary for both white and black rhinos – your best odds in Kenya. Also Rothschild’s giraffes, tree-lounging lions and sometimes flamingos.' },
    tip: { he: 'מספר הפלמינגו משתנה מאוד עם מפלס המים – אל תבנו רק עליו. עלו לתצפית Baboon Cliff לנוף על האגם.', en: 'Flamingo numbers vary greatly with water levels – don’t count on them. Drive up to Baboon Cliff for the lake view.' },
    book: 'recommended', ticketIls: { low: 220, high: 300 } },
  'kenya-safari|Nairobi National Park': {
    about: { he: 'פארק ספארי אמיתי בשולי הבירה, עם אריות, קרנפים, ג׳ירפות ותאואים – ובקו האופק גורדי השחקים של ניירובי. מושלם לחצי יום ביום הגעה או עזיבה.', en: 'A real safari park on the edge of the capital, with lions, rhinos, giraffes and buffalo – and Nairobi’s skyscrapers on the horizon. Perfect for half a day on arrival or departure.' },
    tip: { he: 'התשלום בשער דיגיטלי בלבד (כרטיס או M-Pesa). צאו בפתיחה, כשהטורפים הכי פעילים.', en: 'Payment at the gate is cashless (card or M-Pesa). Go at opening when predators are most active.' },
    book: 'no', ticketIls: { low: 160, high: 300 } },
  'kenya-safari|Sheldrick Wildlife Trust elephant orphanage': {
    about: { he: 'מקום שבו מצילים ומגדלים פילונים יתומים לפני שחרורם לטבע. בשעת הביקור הקצרה הפילונים מגיעים לשתות חלב מבקבוקים ענקיים ולהתפלש בבוץ, והמטפלים מספרים את סיפורם.', en: 'A rescue centre raising orphaned baby elephants for release into the wild. During the short visiting hour the calves come for giant bottles of milk and a mud bath while keepers tell their stories.' },
    tip: { he: 'חובה להזמין באתר מראש; יש רק חלון ביקור אחד ביום, בדרך כלל בסביבות 11:00. אפשר ״לאמץ״ פילון ולקבל עדכונים.', en: 'Booking online is required; there’s one daily visiting window, usually around 11am. You can ‘foster’ a calf and get updates.' },
    book: 'required', ticketIls: { low: 55, high: 90 } },
  'kenya-safari|Giraffe Centre': {
    about: { he: 'מרכז שימור של ג׳ירפות רוטשילד בשכונת קארן. ממרפסת מוגבהת מאכילים אותן מקרוב בכדורי מזון, והן שולחות לשון כחולה ארוכה. גם שביל טבע קצר ביער.', en: 'A conservation centre for Rothschild’s giraffes in Karen. From a raised platform you hand-feed them pellets as they curl out long blue tongues; there’s a short forest trail too.' },
    tip: { he: 'מתאים מאוד לילדים. שלבו באותו בוקר עם שלדריק ומוזיאון קארן בליקסן – כולם קרובים.', en: 'Great with kids. Combine the same morning with Sheldrick and the Karen Blixen Museum – all nearby.' },
    book: 'no', ticketIls: { low: 40, high: 55 } },
  'kenya-safari|Karen Blixen Museum': {
    about: { he: 'בית החווה הקולוניאלי של הסופרת הדנית קארן בליקסן, שכתבה את ״זיכרונות מאפריקה״. מסיירים בחדרים עם רהיטים מקוריים ובגן, על רקע גבעות נגונג.', en: 'The colonial farmhouse of Danish author Karen Blixen, who wrote ‘Out of Africa’. Tour rooms with original furniture and the garden facing the Ngong Hills.' },
    tip: { he: 'הסיור המודרך קצר (כחצי שעה) וכלול במחיר. מעניין במיוחד אם ראיתם את הסרט או קראתם את הספר.', en: 'The guided tour is short (about 30 minutes) and included. Best if you’ve seen the film or read the book.' },
    book: 'no', ticketIls: { low: 30, high: 45 } },

  // ───── Dubai ─────
  'dubai|Burj Khalifa — At the Top': {
    about: { he: 'תצפית במגדל הגבוה בעולם (828 מטר). מעלית מהירה מעלה לקומות 124–125, ובכרטיס יקר יותר עד קומה 148. רואים את המדבר, הים, פאלם ג׳ומיירה ואת כל דובאי מלמעלה.', en: 'The observation deck of the world’s tallest building (828 m). A fast lift takes you to floors 124–125, or 148 with a pricier ticket, for views over desert, sea, Palm Jumeirah and all of Dubai.' },
    tip: { he: 'הזמינו מראש באתר – זול יותר מבקופה. שעת השקיעה הכי יקרה ומבוקשת; שעה לפני היא פשרה טובה. אחר כך רדו למופע המזרקות.', en: 'Book online – cheaper than at the desk. Sunset slots are priciest; an hour earlier is a good compromise. Then catch the fountain show below.' },
    book: 'recommended', ticketIls: { low: 150, high: 550 } },
  'dubai|Dubai Mall & Aquarium': {
    about: { he: 'אחד הקניונים הגדולים בעולם, עם יותר מ־1,200 חנויות, משטח החלקה על קרח, ואקווריום ענק עם כרישים וטריגונים שנראה מהמעבר בחינם. בכרטיס נכנסים למנהרה התת־ימית ולגן החיות.', en: 'One of the world’s largest malls, with 1,200+ shops, an ice rink and a huge aquarium tank of sharks and rays visible free from the concourse. A ticket gets you the walk-through tunnel and underwater zoo.' },
    tip: { he: 'את הקיר הגדול של האקווריום רואים חינם מהקומה התחתונה – לא חייבים כרטיס. הורידו את מפת הקניון, קל ללכת לאיבוד.', en: 'You can see the big tank wall free from the ground floor – no ticket needed. Use the mall map app; it’s easy to get lost.' },
    book: 'no', ticketIls: { low: 0, high: 220 } },
  'dubai|The Dubai Fountain show': {
    about: { he: 'מערכת מזרקות ענקית באגם מתחת לבורג׳ ח׳ליפה, שמזנקת לגובה של עד כ־140 מטר בתיאום עם מוזיקה ואורות. כל מופע נמשך כמה דקות.', en: 'A giant fountain system in the lake beneath Burj Khalifa, shooting jets up to about 140 m, choreographed to music and lights. Each show lasts a few minutes.' },
    tip: { he: 'בערב המופעים כל חצי שעה. הצפייה הכי טובה מהגשר ליד סוק אל בחאר או משייט אבארה קצר באגם (בתשלום).', en: 'In the evening shows run every 30 minutes. Best views from the Souk Al Bahar bridge, or a short paid abra ride on the lake.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'dubai|Aquaventure Waterpark': {
    about: { he: 'פארק מים ענק באטלנטיס על פאלם ג׳ומיירה, מהגדולים בעולם, עם מגלשות שיא, מגלשה שעוברת במנהרה בתוך בריכת כרישים, נהר עצל ארוך וחוף פרטי.', en: 'A huge waterpark at Atlantis on Palm Jumeirah, among the world’s largest, with record-breaking slides, a ride through a shark lagoon tunnel, a long lazy river and a private beach.' },
    tip: { he: 'הגיעו בפתיחה ורוצו קודם למגלשות הפופולריות. כרטיס מקוון זול יותר. בקיץ חם מאוד – שתו הרבה.', en: 'Arrive at opening and hit the big slides first. Online tickets are cheaper. Summer is scorching – hydrate.' },
    book: 'recommended', ticketIls: { low: 300, high: 420 } },
  'dubai|Wild Wadi Waterpark': {
    about: { he: 'פארק מים ותיק ומשפחתי ליד מלון בורג׳ אל ערב, עם מגלשות, בריכת גלים ונהר זורם. קטן ונגיש יותר מאקוונטורה, ועם נוף על המלון בצורת המפרש.', en: 'A long-running, family-friendly waterpark by the Burj Al Arab, with slides, a wave pool and a flowing river – smaller and easier than Aquaventure, with views of the sail-shaped hotel.' },
    tip: { he: 'מתאים במיוחד למשפחות עם ילדים צעירים. בדקו באתר ימי פתיחה – לעיתים סגור לשיפוצים.', en: 'Especially good with younger kids. Check the website for opening days – it sometimes closes for refurbishment.' },
    book: 'recommended', ticketIls: { low: 250, high: 350 } },
  'dubai|JBR Beach & The Walk': {
    about: { he: 'חוף ציבורי ארוך מול מגדלי ג׳ומיירה ביץ׳ רזידנס, עם טיילת מסעדות, חנויות ובתי קפה ונוף לגלגל הענק עין דובאי. מקום טוב לשחייה ולבילוי ערב.', en: 'A long public beach in front of the JBR towers, with a promenade of restaurants, shops and cafés and views of the Ain Dubai wheel – good for a swim and an evening out.' },
    tip: { he: 'הכניסה לחוף חינם; מיטות שיזוף בתשלום. בערב הטיילת מלאה – טיילו לדובאי מרינה הסמוכה.', en: 'The beach is free; loungers cost extra. Evenings are lively – stroll on to nearby Dubai Marina.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'dubai|Gold Souk & Spice Souk': {
    about: { he: 'השווקים המסורתיים בדיירה: בסוק הזהב חלונות ראווה עמוסים תכשיטי זהב, ובסוק התבלינים שקים פתוחים של זעפרן, הל, קטורת ופירות יבשים. החלק הוותיק והאותנטי של דובאי.', en: 'The traditional souks of Deira: the Gold Souk with windows crammed with gold jewellery, and the Spice Souk with open sacks of saffron, cardamom, frankincense and dried fruit – Dubai’s old soul.' },
    tip: { he: 'חצו את הקריק בסירת אבארה ב־1 דירהם – חוויה בפני עצמה. בזהב המחיר לפי משקל, ומתמקחים על עלות העבודה.', en: 'Cross the Creek by abra for 1 dirham – an experience in itself. Gold is priced by weight; haggle on the making charge.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'dubai|Al Fahidi Historical District': {
    about: { he: 'רובע משוחזר של בתי סוחרים מאבן ואלמוגים עם מגדלי רוח מסורתיים, ליד הקריק. סמטאות שקטות, גלריות, בתי קפה ומוזיאונים קטנים על דובאי של פעם.', en: 'A restored quarter of coral-stone merchant houses with traditional wind towers by the Creek: quiet lanes, galleries, cafés and small museums on old Dubai.' },
    tip: { he: 'בקרו בבוקר או לקראת ערב, כשנעים ללכת. נסו ארוחה אמירתית במרכז שייח׳ מוחמד להבנה תרבותית.', en: 'Visit in the morning or toward evening. Try an Emirati meal at the Sheikh Mohammed Centre for Cultural Understanding.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'dubai|Museum of the Future': {
    about: { he: 'מבנה טבעתי מכוסף ללא פינות, מכוסה כתב ערבי, שבתוכו תערוכה סוחפת על העתיד: חללית, מעבדה של מינים, ריפוי וחדר לילדים. חוויה יותר מאשר מוזיאון קלאסי.', en: 'A torus-shaped silver building with no corners, wrapped in Arabic calligraphy, holding an immersive show of the future: a space station, a species library, a wellness zone and a kids’ area.' },
    tip: { he: 'חובה להזמין משבצת זמן מראש – הכרטיסים נגמרים. הקדישו כשעתיים; הצילום של המבנה מבחוץ הכי יפה בערב.', en: 'Timed tickets must be booked ahead – they sell out. Allow two hours; the building looks best outside at night.' },
    book: 'required', ticketIls: { low: 145, high: 160 } },
  'dubai|Desert safari': {
    about: { he: 'יציאה אחר הצהריים לדיונות האדומות: נהיגת ג׳יפים על הדיונות, סנדבורד, רכיבה קצרה על גמל ושקיעה במדבר. בערב מחנה בדואי עם ארוחה, חינה ומופעי ריקוד.', en: 'An afternoon trip into the red dunes: 4x4 dune bashing, sandboarding, a short camel ride and desert sunset, then a Bedouin-style camp with dinner, henna and dance shows.' },
    tip: { he: 'נסיעת הדיונות קופצנית – לא מתאימה לנשים בהריון או לסובלים מבחילה. שבו מקדימה. קחו צעיף נגד חול.', en: 'Dune bashing is bumpy – not for pregnancy or motion sickness. Sit up front. Bring a scarf for sand.' },
    book: 'required', ticketIls: { low: 150, high: 450 } },
  'dubai|Dubai Frame': {
    about: { he: 'מסגרת תמונה ענקית בגובה 150 מטר בפארק זעבּיל. עולים בגשר הזכוכית שבראש המסגרת, עם רצפה שקופה בחלקה, ורואים מצד אחד את דובאי הישנה ומהשני את החדשה.', en: 'A giant 150 m picture frame in Zabeel Park. Ride up to the glass bridge across the top, part see-through floor, with old Dubai on one side and the new on the other.' },
    tip: { he: 'הביקור כשעה. קנו כרטיס מקוון ובואו לקראת השקיעה כדי לראות את העיר ביום ובלילה.', en: 'The visit takes about an hour. Buy online and come near sunset to see the city by day and night.' },
    book: 'recommended', ticketIls: { low: 50, high: 60 } },
  'dubai|Dubai Miracle Garden': {
    about: { he: 'גן ענק עם יותר ממאה מיליון פרחים שמסודרים בפסלים: מטוס איירבוס בגודל מלא מכוסה פרחים, טירות, לבבות ודמויות דיסני. צבעוני ומצולם במיוחד.', en: 'A huge garden of over 100 million flowers shaped into sculptures: a full-size Airbus covered in blooms, castles, hearts and Disney characters – vivid and very photogenic.' },
    tip: { he: 'פתוח רק בעונה הקרירה, בערך מנובמבר עד מאי. בואו אחר הצהריים המאוחרים, כשנעים יותר והתאורה נדלקת.', en: 'Open only in the cooler season, roughly November to May. Come late afternoon when it’s cooler and lights come on.' },
    book: 'no', ticketIls: { low: 95, high: 110 } },

  // ───── Istanbul ─────
  'istanbul|Hagia Sophia': {
    about: { he: 'מבנה מהמאה ה־6 שהיה במשך כאלף שנה הכנסייה הגדולה בעולם, אחר כך מסגד, מוזיאון, ושוב מסגד. הכיפה הענקית, פסיפסי הזהב הביזנטיים והמדליונים הערביים מרהיבים.', en: 'A 6th-century building that was the world’s largest church for nearly a thousand years, then a mosque, a museum and a mosque again. Its vast dome, Byzantine gold mosaics and calligraphy roundels are breathtaking.' },
    tip: { he: 'תיירים נכנסים בכרטיס לגלריה העליונה; הכניסה נסגרת בזמני התפילה. נשים מכסות ראש, כולם כתפיים וברכיים.', en: 'Visitors enter the upper gallery with a ticket; access pauses at prayer times. Women cover hair; everyone covers shoulders and knees.' },
    book: 'recommended', ticketIls: { low: 90, high: 120 } },
  'istanbul|Blue Mosque (Sultan Ahmed Mosque)': {
    about: { he: 'מסגד מ־1616 עם שש צריחים וכיפות מדורגות, שקיבל את שמו מעשרות אלפי אריחי איזניק הכחולים שבפנים. מסגד פעיל ונגיש למבקרים בין התפילות.', en: 'A 1616 mosque with six minarets and cascading domes, named for the tens of thousands of blue Iznik tiles inside. A working mosque open to visitors between prayers.' },
    tip: { he: 'הכניסה חינם אך סגורה לתיירים בזמני התפילה, בעיקר בצהרי יום שישי. מטפחות ראש וחצאיות כיסוי ניתנות בכניסה. חולצים נעליים.', en: 'Free, but closed to tourists at prayer times, especially Friday midday. Scarves and wraps are provided; shoes off.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'istanbul|Topkapı Palace': {
    about: { he: 'ארמון הסולטנים העות׳מאניים במשך כ־400 שנה, על כף מעל הבוספורוס. מסיירים בחצרות, בחדרי האוצר עם פגיון טופקפי ויהלום ענק, ובהרמון עם אריחים מרהיבים.', en: 'The Ottoman sultans’ palace for some 400 years, on a point above the Bosphorus. Explore courtyards, the Treasury with the Topkapı Dagger and a huge diamond, and the beautifully tiled Harem.' },
    tip: { he: 'הכרטיס המלא כולל את ההרמון – שווה. הגיעו בפתיחה והתחילו באוצר לפני התור. הקדישו שלוש שעות.', en: 'The full ticket includes the Harem – worth it. Arrive at opening and do the Treasury before queues build. Allow three hours.' },
    book: 'recommended', ticketIls: { low: 180, high: 260 }, hours: { he: 'סגור בימי שלישי', en: 'Closed Tuesdays' } },
  'istanbul|Basilica Cistern': {
    about: { he: 'מאגר מים תת־קרקעי מהמאה ה־6, עם 336 עמודי שיש באולם חשוך ומואר בעדינות. בפינה שני ראשי מדוזה הפוכים כבסיס לעמודים, ולעיתים מוצגות בו מיצבי אמנות.', en: 'A 6th-century underground reservoir of 336 marble columns in a dim, softly lit hall. In a corner, two upside-down Medusa heads serve as column bases; art installations sometimes appear.' },
    tip: { he: 'הגיעו בפתיחה או בערב – בצהריים התור ארוך. הכרטיס בערב יקר יותר אבל האווירה מיוחדת.', en: 'Go at opening or in the evening – midday queues are long. Evening tickets cost more but the mood is special.' },
    book: 'recommended', ticketIls: { low: 100, high: 170 } },
  'istanbul|Grand Bazaar': {
    about: { he: 'אחד השווקים המקורים הגדולים והעתיקים בעולם, עם כ־4,000 חנויות ב־60 רחובות מקורים בקמרונות מצוירים. שטיחים, מנורות, תכשיטים, עור, קרמיקה ותה.', en: 'One of the world’s largest and oldest covered markets, with some 4,000 shops along 60 vaulted, painted lanes: carpets, lamps, jewellery, leather, ceramics and tea.' },
    tip: { he: 'מתמקחים בנחת ובחיוך, ואל תרגישו מחויבים אחרי כוס תה. השוק סגור בימי ראשון.', en: 'Haggle slowly and with a smile; a glass of tea doesn’t oblige you. Closed on Sundays.' },
    book: 'no', ticketIls: { low: 0, high: 0 }, hours: { he: 'סגור בימי ראשון', en: 'Closed Sundays' } },
  'istanbul|Spice Bazaar': {
    about: { he: 'השוק המצרי מ־1660 ליד המעבורות של אמינונו, עם ערימות תבלינים צבעוניים, לוקום, פירות יבשים, תה ודבש. השוק קטן מהגרנד בזאר ונוח יותר.', en: 'The 1660 Egyptian Bazaar by the Eminönü ferries, piled with colourful spices, Turkish delight, dried fruit, tea and honey – smaller and easier than the Grand Bazaar.' },
    tip: { he: 'הרחובות שמסביב, שבהם קונים המקומיים, זולים יותר. טעמו לפני שקונים. סיימו בקפה טורקי בקורוקאהבג׳י מהמט אפנדי.', en: 'The surrounding streets where locals shop are cheaper. Taste before buying. Finish with coffee at Kurukahveci Mehmet Efendi.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'istanbul|Galata Tower': {
    about: { he: 'מגדל אבן גנואזי מהמאה ה־14 בגובה כ־67 מטר, מעל רובע גלאטה. מהמרפסת העגולה בקצהו נשקפת תצפית של 360 מעלות על קרן הזהב, חצי האי ההיסטורי והבוספורוס.', en: 'A 14th-century Genoese stone tower about 67 m tall above Galata. Its circular balcony gives 360° views over the Golden Horn, the historic peninsula and the Bosphorus.' },
    tip: { he: 'התורים ארוכים בשקיעה – בואו בפתיחה. הנוף על המגדל עצמו יפה מהסמטאות שמסביב, שווה לשוטט שם.', en: 'Sunset queues are long – go at opening. The tower looks great from the surrounding lanes, worth a wander.' },
    book: 'no', ticketIls: { low: 100, high: 140 } },
  'istanbul|İstiklal Avenue & Taksim Square': {
    about: { he: 'רחוב הולכי הרגל הראשי של איסטנבול, כ־1.4 ק״מ מכיכר טקסים עד טונל, עם בניינים מהמאה ה־19, חנויות, בתי קפה, כנסיות ומעברים מקורים. החשמלית האדומה הנוסטלגית עוברת לאורכו.', en: 'Istanbul’s main pedestrian street, about 1.4 km from Taksim Square to Tünel, lined with 19th-century buildings, shops, cafés, churches and arcades, with the red nostalgic tram running along it.' },
    tip: { he: 'היכנסו לפסאז׳ צ׳יצ׳ק פסאז׳י ולסמטאות הצדדיות לברים ומסעדות. שמרו על הארנק בעומס של ערבי סוף שבוע.', en: 'Duck into Çiçek Pasajı and the side alleys for bars and meyhanes. Mind your wallet in weekend-evening crowds.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'istanbul|Bosphorus cruise': {
    about: { he: 'שייט במצר שמפריד בין אירופה לאסיה, לאורך ארמונות, מבצרים, אחוזות עץ עות׳מאניות (יאלי) וגשרים ענקיים. אפשר בשייט קצר של שעתיים או במעבורת הציבורית הארוכה.', en: 'A cruise along the strait between Europe and Asia, past palaces, fortresses, Ottoman wooden mansions (yalı) and huge bridges – a short two-hour trip or the long public ferry.' },
    tip: { he: 'מעבורות העירייה (Şehir Hatları) זולות בהרבה מהסירות הפרטיות ומציעות אותו נוף. שבו בצד ימין בהפלגה צפונה.', en: 'City-run Şehir Hatları ferries are far cheaper than private boats with the same views. Sit on the right heading north.' },
    book: 'no', ticketIls: { low: 5, high: 130 } },
  'istanbul|Dolmabahçe Palace': {
    about: { he: 'ארמון בסגנון אירופי מהמאה ה־19 על חוף הבוספורוס, מרכז השלטון העות׳מאני המאוחר. בפנים אולם טקסים עצום עם נברשת קריסטל של כ־4.5 טון, וחדר שבו נפטר אטאטורק.', en: 'A 19th-century European-style palace on the Bosphorus, seat of the late Ottoman court. Inside: a vast ceremonial hall with a 4.5-tonne crystal chandelier, and the room where Atatürk died.' },
    tip: { he: 'הביקור במבנה הוא בסיור מודרך עם מכסה – הגיעו בבוקר. הצילום בפנים מוגבל.', en: 'Interiors are seen on guided tours with daily caps – come in the morning. Photography inside is restricted.' },
    book: 'recommended', ticketIls: { low: 150, high: 220 }, hours: { he: 'סגור בימי שני', en: 'Closed Mondays' } },
  'istanbul|Süleymaniye Mosque': {
    about: { he: 'יצירת המופת של האדריכל סינאן מ־1557, על הגבעה השלישית של העיר. מסגד אדיר ושקט יחסית, עם חצר מרווחת ותצפית על קרן הזהב מהגן שמאחור.', en: 'Architect Sinan’s 1557 masterpiece on the city’s third hill – a majestic, relatively calm mosque with a spacious courtyard and Golden Horn views from the garden behind.' },
    tip: { he: 'פחות עמוס מהמסגד הכחול ולא פחות יפה. נסו שעועית לבנה (קורו פסוליה) באחת המסעדות הוותיקות ברחוב שליד.', en: 'Far less crowded than the Blue Mosque and just as beautiful. Try kuru fasulye (white beans) at the old diners on the next street.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'istanbul|Balat & Fener': {
    about: { he: 'שכונות היסטוריות לחוף קרן הזהב, עם בתי עץ ולבנים צבעוניים במורד גבעות תלולות. כנסיות יווניות ובית הכנסת אחרידה, ובתי קפה ועתיקות בסמטאות.', en: 'Historic Golden Horn neighbourhoods of colourful wooden and brick houses on steep slopes, with Greek churches, the Ahrida Synagogue and cafés and antique shops in the lanes.' },
    tip: { he: 'לבשו נעליים נוחות – השיפועים תלולים. לביקור בבית הכנסת אחרידה צריך תיאום מראש.', en: 'Wear comfy shoes – the hills are steep. Visiting Ahrida Synagogue requires advance arrangement.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'istanbul|Kadıköy and its food market': {
    about: { he: 'שכונה תוססת בצד האסייתי של העיר, עם שוק אוכל של דגים, גבינות, מזה, פירות יבשים ומאפים. סצנה צעירה של בתי קפה, ברים וחנויות ויניל.', en: 'A lively Asian-side neighbourhood with a food market of fish, cheese, meze, dried fruit and pastries, and a young scene of cafés, bars and record shops.' },
    tip: { he: 'הגיעו במעבורת מאמינונו או מקרקוי – 20 דקות של נוף. נסו ארוחה במסעדת צ׳יה סופרה המפורסמת.', en: 'Arrive by ferry from Eminönü or Karaköy – 20 scenic minutes. Try a meal at the famous Çiya Sofrası.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },

  // ───── Georgia ─────
  'georgia|Tbilisi Old Town': {
    about: { he: 'העיר העתיקה של טביליסי, עם בתים עם מרפסות עץ מגולפות, כנסיות עתיקות, מסגד, בית כנסת וכיפות לבנים של מרחצאות. סמטאות עולות ויורדות, ובתי קפה ומסעדות גאורגיות בכל פינה.', en: 'Tbilisi’s Old Town of houses with carved wooden balconies, ancient churches, a mosque, a synagogue and the brick domes of the baths – up-and-down lanes with cafés and Georgian restaurants at every turn.' },
    tip: { he: 'נעליים נוחות – מרוצף ותלול. נסו חצ׳פורי וחינקלי, ושתו יין כתום מקומי. העיר נעימה במיוחד בערב.', en: 'Wear good shoes – cobbles and slopes. Try khachapuri and khinkali with local amber wine. Lovely in the evening.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'georgia|Narikala Fortress': {
    about: { he: 'מבצר עתיק על הרכס מעל העיר העתיקה, מהמאה ה־4 ואילך. מטפסים בין החומות ומקבלים תצפית על נהר המטקוורי, הגגות והכיפות, ופסל ״אם גאורגיה״ הענק בסמוך.', en: 'An ancient fortress on the ridge above the Old Town, dating back to the 4th century. Scramble along the walls for views over the Mtkvari river, rooftops and domes, beside the giant Mother of Georgia statue.' },
    tip: { he: 'עלו ברכבל מפארק ריקה ורדו ברגל דרך הסמטאות למרחצאות. בשקיעה הכי יפה; החומות לא מגודרות – זהירות עם ילדים.', en: 'Ride the cable car up from Rike Park and walk down through the lanes to the baths. Best at sunset; walls are unfenced – careful with kids.' },
    book: 'no', ticketIls: { low: 0, high: 5 } },
  'georgia|Abanotubani sulphur baths': {
    about: { he: 'רובע המרחצאות של טביליסי, עם כיפות לבנים מעל בריכות מים גופריתיים חמים ממעיינות טבעיים. אפשר לשכור חדר פרטי עם בריכה ולהוסיף קיסה – קרצוף ועיסוי מסורתי.', en: 'Tbilisi’s bath district, brick domes over hot sulphur pools fed by natural springs. Rent a private room with its own pool and add a kisi – a traditional scrub and massage.' },
    tip: { he: 'הזמינו חדר פרטי מראש, במיוחד בערב ובסופי שבוע. המרחצאות הציבוריים זולים מאוד אבל נפרדים לגברים ולנשים.', en: 'Book private rooms ahead, especially evenings and weekends. Public baths are very cheap but single-sex.' },
    book: 'recommended', ticketIls: { low: 20, high: 250 } },
  'georgia|Bridge of Peace & Rike Park': {
    about: { he: 'גשר הולכי רגל מודרני מזכוכית ופלדה בצורת גל מעל הנהר, שנדלק באלפי נורות בלילה. בצד השני פארק ריקה עם מזרקות, ומשם עולה הרכבל לנאריקלה.', en: 'A modern wave-shaped glass and steel footbridge over the river, lit by thousands of LEDs at night, leading to Rike Park with its fountains and the cable car up to Narikala.' },
    tip: { he: 'בואו אחרי השקיעה כשהגשר מואר. משם עולים ברכבל לנאריקלה – כרטיס זול עם כרטיס תחבורה מקומי.', en: 'Come after dark when it’s lit. Then ride the cable car to Narikala – cheap with a local transport card.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'georgia|Mtatsminda Park': {
    about: { he: 'פארק שעשועים על ההר הגבוה שמעל טביליסי, שאליו עולים ברכבל פוניקולר היסטורי. גלגל ענק, מתקנים לילדים, מסעדה ותצפית פנורמית על העיר כולה.', en: 'An amusement park atop the mountain above Tbilisi, reached by a historic funicular, with a Ferris wheel, kids’ rides, a restaurant and panoramic city views.' },
    tip: { he: 'עלו לקראת השקיעה והישארו לראות את העיר נדלקת. כרטיס הפוניקולר נטען על כרטיס מיוחד בתחנה.', en: 'Go up before sunset and stay to watch the city light up. Funicular fares go on a card bought at the station.' },
    book: 'no', ticketIls: { low: 15, high: 50 } },
  'georgia|Dry Bridge Market': {
    about: { he: 'שוק פשפשים פתוח על הגשר היבש ובפארק הסמוך, עם מזכרות סובייטיות, מדליות, מצלמות ישנות, צלחות, קרני שתייה וציורים של אמנים מקומיים.', en: 'An open-air flea market on the Dry Bridge and the park beside it: Soviet memorabilia, medals, old cameras, plates, drinking horns and local paintings.' },
    tip: { he: 'בסופי שבוע השוק במלוא הדרו. מתמקחים – המחיר הראשון גבוה. מזומן בלארי.', en: 'It’s fullest on weekends. Haggle – first prices are high. Bring cash in lari.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'georgia|Gergeti Trinity Church': {
    about: { he: 'כנסייה מהמאה ה־14 שעומדת לבדה על גבעה בגובה 2,170 מטר, מתחת להר קזבק המושלג. אחת התמונות המוכרות של גאורגיה, עם נוף על עמק סטפנצמינדה.', en: 'A 14th-century church standing alone on a hilltop at 2,170 m beneath snow-capped Mt Kazbek – one of Georgia’s iconic images, overlooking the Stepantsminda valley.' },
    tip: { he: 'עלו ברגל (כשעה וחצי) או בג׳יפ מקומי. נשים מכסות ראש ולובשות חצאית – יש בכניסה. בבוקר ההר בדרך כלל פחות מעונן.', en: 'Hike up (about 1.5 hours) or take a local 4x4. Women cover heads and wear skirts (provided). Mornings usually have less cloud on the peak.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'georgia|Ananuri Fortress': {
    about: { he: 'מבצר מהמאה ה־17 עם שתי כנסיות וחומות, על שפת מאגר טורקיז בכביש הצבאי הגאורגי. עוצרים בדרך לקזבגי, מטפסים על המגדל ומצלמים את המים.', en: 'A 17th-century fortress with two churches and walls on a turquoise reservoir along the Georgian Military Highway – a stop on the way to Kazbegi, with a tower to climb.' },
    tip: { he: 'עצירה של חצי שעה עד שעה. טפסו במגדל לנוף על המאגר; מדרגות צרות ותלולות.', en: 'A 30–60 minute stop. Climb the tower for reservoir views; the stairs are narrow and steep.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'georgia|Sighnaghi': {
    about: { he: 'עיירה קטנה על גבעה באזור היין קאחתי, עם חומה ומגדלים, בתים בצבעי פסטל וגגות אדומים. הנוף נשקף על עמק אלזאני ורכס הקווקז הגבוה.', en: 'A small hilltop town in the Kakheti wine region with defensive walls and towers, pastel houses and red roofs, overlooking the Alazani Valley and the High Caucasus.' },
    tip: { he: 'שלבו ביקור ביקב שמייצר יין בכדי חרס (קווברי). הליכה על החומות בשקיעה – חובה.', en: 'Pair it with a winery making qvevri clay-jar wine. Walk the walls at sunset.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'georgia|Uplistsikhe cave town': {
    about: { he: 'עיר חצובה בסלע על גדת נהר, עם ראשיתה באלף הראשון לפני הספירה. מטפסים בין אולמות, מקדשים, מרתפי יין ורחובות חצובים, ובראש הגבעה כנסייה קטנה.', en: 'A rock-cut town on a riverbank dating back to the first millennium BC. Clamber through carved halls, temples, wine cellars and streets, with a small church at the top.' },
    tip: { he: 'נעליים עם אחיזה – הסלע חלק. אין צל, אז בואו בבוקר. שלבו עם גורי, כ־15 דקות נסיעה.', en: 'Grippy shoes – the rock is slick. No shade, so come in the morning. Combine with Gori, 15 minutes away.' },
    book: 'no', ticketIls: { low: 15, high: 25 } },
  'georgia|Prometheus Cave': {
    about: { he: 'מערת נטיפים גדולה ליד קוטאיסי, עם מסלול הליכה של כ־1.4 ק״מ בין אולמות מוארים בצבעים, זקיפים ונטיפים. בחלק מהעונה אפשר לסיים בשייט קצר בנהר התת־קרקעי.', en: 'A large stalactite cave near Kutaisi with a 1.4 km walkway through colour-lit halls of stalactites and stalagmites; in season you can finish with a short underground boat ride.' },
    tip: { he: 'הטמפרטורה בפנים כ־14 מעלות כל השנה – קחו שכבה. הכניסה בסיורים מודרכים לפי שעות.', en: 'It’s about 14°C inside year-round – bring a layer. Entry is by timed guided tour.' },
    book: 'no', ticketIls: { low: 30, high: 50 } },
  'georgia|Martvili Canyon': {
    about: { he: 'קניון צר עם מים בצבע טורקיז ומפלים קטנים בין קירות סלע מכוסים טחב. הולכים בשביל ובגשרים, ובעונה גם שטים בסירה גומי לתוך הקניון.', en: 'A narrow canyon of turquoise water and small waterfalls between moss-covered rock walls. Follow the path and bridges, and in season take a rubber-boat ride into the gorge.' },
    tip: { he: 'בואו מוקדם – בקיץ האוטובוסים ממלאים את המקום מהצהריים. השייט תלוי במפלס המים ובמזג האוויר.', en: 'Arrive early – summer tour buses fill it from midday. Boat rides depend on water levels and weather.' },
    book: 'no', ticketIls: { low: 25, high: 70 } },
  'georgia|Batumi Boulevard': {
    about: { he: 'טיילת של כמה ק״מ לאורך הים השחור, עם עצי דקל, שבילי אופניים, מזרקות, פסלים ומגדל האלפבית. בקצה פסל ״עלי ונינו״ – שתי דמויות מתכת שנעות ומתמזגות.', en: 'A multi-kilometre Black Sea promenade with palms, bike lanes, fountains, sculptures and the Alphabet Tower, ending at ‘Ali and Nino’ – two moving metal figures that pass through each other.' },
    tip: { he: 'שכרו אופניים בתחנות העירוניות. בערב פסל ״עלי ונינו״ מואר ונע – הכי יפה אז. החוף מחלוקי נחל, קחו נעלי ים.', en: 'Rent bikes from city stations. ‘Ali and Nino’ is best lit at night. The beach is pebbly – bring water shoes.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },

  // ───── Bansko ─────
  'bansko|Bansko gondola': {
    about: { he: 'הרכבל המרכזי שיוצא מקצה העיירה ומעלה בכ־25 דקות לבנדריצה, בסיס אתר הסקי. בחורף זו הדרך של הגולשים למעלה, ובעונה הירוקה – לטיולים בהרי פירין.', en: 'The main gondola from the edge of town, climbing in about 25 minutes to Banderitsa, the ski area’s base – the skiers’ way up in winter and a route to Pirin hikes in the green season.' },
    tip: { he: 'בבוקר התור בתחתית ארוך מאוד – היו שם לפני 8:00 או בואו אחרי 10:00. כרטיס סקי יומי כולל את הרכבל.', en: 'Morning queues at the bottom are notoriously long – be there before 8am or after 10am. The day ski pass includes it.' },
    book: 'no', ticketIls: { low: 60, high: 220 } },
  'bansko|Shiligarnika & Plato ski areas': {
    about: { he: 'שני אזורי הגלישה המרכזיים בבנסקו, מעל קו העצים ובתוכו. מסלולים כחולים ואדומים רחבים בין יערות אורן, מתאימים למתחילים ולגולשים בינוניים.', en: 'Bansko’s two main ski zones, above and below the tree line: wide blue and red runs between pine forests, ideal for beginners and intermediates.' },
    tip: { he: 'כשיש תור לרכבל, המסלולים העליונים פחות עמוסים. שלג טוב בדרך כלל מסוף דצמבר עד סוף מרץ.', en: 'When the gondola is busy, the upper runs are quieter. Snow is usually reliable late December to late March.' },
    book: 'no', ticketIls: { low: 180, high: 240 } },
  'bansko|Todorka peak area': {
    about: { he: 'האזור הגבוה של אתר הסקי מתחת לפסגת טודורקה (2,746 מטר), עם מסלולים תלולים יותר ונוף על רכס פירין. בקיץ אפשר לטפס לפסגה ברגל.', en: 'The ski area’s high zone beneath Todorka peak (2,746 m), with steeper runs and views across the Pirin range. In summer you can hike to the summit.' },
    tip: { he: 'בימים בהירים העלו מוקדם לנוף הטוב ביותר. בקיץ הטיפוס לפסגה ארוך ותלול – קחו מים ושכבה.', en: 'On clear days go up early for the best views. The summer summit hike is long and steep – take water and a layer.' },
    book: 'no', ticketIls: { low: 0, high: 240 } },
  'bansko|Ski and snowboard school': {
    about: { he: 'שיעורי סקי וסנובורד קבוצתיים או פרטיים עם מדריכים מוסמכים, רבים מהם דוברי אנגלית. מתחילים בשיפוע קל ליד בנדריצה ומתקדמים בהדרגה למסלולים הכחולים.', en: 'Group or private ski and snowboard lessons with certified instructors, many English-speaking. Beginners start on a gentle slope near Banderitsa and progress to blue runs.' },
    tip: { he: 'הזמינו שיעורים יחד עם השכרת ציוד וכרטיס – לרוב זול יותר בחבילה. בשבוע חגים הזמינו מראש.', en: 'Book lessons with gear rental and pass – packages are usually cheaper. Reserve ahead in holiday weeks.' },
    book: 'recommended', ticketIls: { low: 150, high: 500 } },
  'bansko|Bansko Old Town': {
    about: { he: 'העיר העתיקה עם רחובות מרוצפים, בתי אבן מבוצרים מהמאות ה־18–19 עם חומות וגגות רעפים, וטברנות מסורתיות. אווירה כפרית שונה לגמרי מאזור הרכבל.', en: 'The old town of cobbled streets, 18th–19th-century fortified stone houses behind walls with slate roofs, and traditional taverns – a village feel far from the gondola strip.' },
    tip: { he: 'טיילו בשעות אחר הצהריים אחרי הגלישה. כרטיס משולב לבתי המוזיאון חוסך כסף.', en: 'Stroll in the late afternoon after skiing. A combined ticket for the house-museums saves money.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'bansko|Holy Trinity Church': {
    about: { he: 'כנסייה גדולה מ־1835 בלב העיר, עם מגדל פעמונים גבוה שהפך לסמל של בנסקו. בפנים איקונות וציורי קיר מעשה ידי אמני אסכולת בנסקו.', en: 'A large 1835 church in the town centre whose tall bell tower is Bansko’s symbol. Inside are icons and murals by artists of the Bansko school.' },
    tip: { he: 'כנסייה פעילה – התלבשו בצניעות ושמרו על שקט. החצר המוקפת חומה יפה לצילום.', en: 'A working church – dress modestly and keep quiet. The walled courtyard is photogenic.' },
    book: 'no', ticketIls: { low: 0, high: 5 } },
  'bansko|Velyanova House': {
    about: { he: 'בית סוחר מבוצר מהמאה ה־19 שבו עבד הצייר ולִיאן אוגנייב, עם תקרות עץ מגולפות וקירות מצוירים בעושר. דוגמה יפה לבית בנסקו מסורתי.', en: 'A 19th-century fortified merchant house where painter Velyan Ognev worked, with carved wooden ceilings and richly painted walls – a fine example of a traditional Bansko home.' },
    tip: { he: 'הביקור קצר – כחצי שעה. כדאי לקנות כרטיס משולב לכמה בתי מוזיאון.', en: 'A short visit, about half an hour. Get the combined ticket for several house-museums.' },
    book: 'no', ticketIls: { low: 5, high: 15 } },
  'bansko|Neofit Rilski House-Museum': {
    about: { he: 'בית הולדתו של ניאופיט רילסקי, נזיר ומחנך מהמאה ה־19 שכתב את הדקדוק הבולגרי הראשון. בית אבן מבוצר עם חצר פנימית ותערוכה על חייו.', en: 'The birthplace of Neofit Rilski, a 19th-century monk and educator who wrote the first Bulgarian grammar – a fortified stone house with an inner courtyard and an exhibition on his life.' },
    tip: { he: 'נמצא ליד כנסיית השילוש הקדוש – שלבו את שניהם. לפעמים סגור בצהריים, בדקו שעות.', en: 'It’s near Holy Trinity Church – see both together. It may close at midday, so check hours.' },
    book: 'no', ticketIls: { low: 5, high: 15 } },
  'bansko|Nikola Vaptsarov House-Museum': {
    about: { he: 'בית ילדותו של המשורר ניקולה ופצרוב, מהמשוררים הבולגרים המוכרים במאה ה־20. מוצגים חפצים אישיים, כתבי יד וסרט קצר על חייו.', en: 'The childhood home of poet Nikola Vaptsarov, one of Bulgaria’s best-known 20th-century poets, displaying personal items, manuscripts and a short film on his life.' },
    tip: { he: 'מעניין בעיקר לחובבי ספרות והיסטוריה בולגרית. נמצא בכיכר המרכזית, ליד מרכז המבקרים.', en: 'Mostly for literature and history fans. It’s on the central square near the visitor centre.' },
    book: 'no', ticketIls: { low: 5, high: 15 } },
  'bansko|Snowshoeing in Pirin National Park': {
    about: { he: 'הליכה מודרכת בנעלי שלג בפארק הלאומי פירין, אתר מורשת עולמית, בין יערות אורן מושלגים ועצי מחט עתיקים. שקט מוחלט ונוף הררי, בלי צורך בניסיון קודם.', en: 'A guided snowshoe walk in Pirin National Park, a World Heritage Site, through snowy pine forest and ancient conifers – total silence and mountain views, no experience needed.' },
    tip: { he: 'לבשו שכבות ונעלי הליכה עמידות למים; המדריך מספק נעלי שלג ומקלות. אל תצאו לבד מחוץ לשבילים – יש סכנת מפולות.', en: 'Wear layers and waterproof boots; guides supply snowshoes and poles. Don’t go off-trail alone – avalanche terrain.' },
    book: 'recommended', ticketIls: { low: 100, high: 220 } },
  'bansko|Banya hot springs': {
    about: { he: 'הכפר באניה, כ־15 דקות מבנסקו, שופע מעיינות מינרליים חמים. יש בו בריכות חיצוניות ציבוריות ומתחמי ספא, ונעים במיוחד לטבול במים החמים אחרי יום סקי.', en: 'The village of Banya, about 15 minutes from Bansko, is full of hot mineral springs, with public outdoor pools and spa complexes – bliss after a ski day.' },
    tip: { he: 'בקרו בערב אחרי הגלישה. קחו כפכפים ומגבת אם לא שוכרים במקום.', en: 'Go in the evening after skiing. Bring flip-flops and a towel unless renting.' },
    book: 'no', ticketIls: { low: 20, high: 90 } },
  'bansko|An evening in a traditional mehana': {
    about: { he: 'ארוחת ערב בטברנה בולגרית מסורתית (מהאנה), עם קירות אבן, אח בוערת ונגני עממי. מגישים קאפאמה – תבשיל בשר מקומי שמתבשל שעות בסיר חרס – ויין מקומי.', en: 'Dinner in a traditional Bulgarian mehana with stone walls, a roaring fire and folk musicians, serving kapama – a local meat stew slow-cooked in a clay pot – and local wine.' },
    tip: { he: 'הזמינו שולחן בערבי סוף שבוע בעונת הסקי. הקאפאמה דורשת לעיתים הזמנה מראש. ארוחה עולה בערך 50–120 ש״ח לאדם.', en: 'Reserve on ski-season weekends. Kapama sometimes needs pre-ordering. Expect roughly ₪50–120 per person.' },
    book: 'recommended', ticketIls: { low: 0, high: 0 } },

  // ───── Abu Dhabi ─────
  'abu-dhabi|Sheikh Zayed Grand Mosque': {
    about: { he: 'אחד המסגדים הגדולים בעולם, עשוי שיש לבן עם 82 כיפות, נברשות קריסטל ענקיות ואחד השטיחים הארוגים ביד הגדולים בעולם. בערב הוא מואר בגוונים שמשתנים עם הירח.', en: 'One of the world’s largest mosques, in white marble with 82 domes, enormous crystal chandeliers and one of the largest hand-knotted carpets on Earth. At night it’s lit in shades that follow the moon.' },
    tip: { he: 'הכניסה חינם אך יש להירשם מראש באתר. לבוש צנוע ארוך, ונשים מכסות ראש. סגור לתיירים בבוקר של יום שישי.', en: 'Free, but online registration is required. Long, modest clothing; women cover hair. Closed to visitors on Friday mornings.' },
    book: 'required', ticketIls: { low: 0, high: 0 } },
  'abu-dhabi|Louvre Abu Dhabi': {
    about: { he: 'מוזיאון אמנות מרהיב תחת כיפה ענקית של רשת מתכת שמפזרת ״גשם של אור״. האוסף מסודר לפי תקופות ומציג יצירות מכל העולם זו לצד זו, מהעת העתיקה ועד ימינו.', en: 'A stunning art museum beneath a vast latticed dome that scatters a ‘rain of light’. Galleries run chronologically, placing works from across the world side by side, from antiquity to today.' },
    tip: { he: 'הקדישו שלוש שעות ובואו אחר הצהריים להישאר לאור השקיעה מתחת לכיפה. אפשר להגיע גם בשייט קיאק סביב המוזיאון.', en: 'Allow three hours and come late afternoon to catch sunset light under the dome. Kayak tours around the museum are possible too.' },
    book: 'recommended', ticketIls: { low: 60, high: 70 }, hours: { he: 'סגור בימי שני', en: 'Closed Mondays' } },
  'abu-dhabi|Ferrari World': {
    about: { he: 'פארק שעשועים מקורה בנושא פרארי, תחת גג אדום ענק. השיא – פורמולה רוסה, מהרכבות ההרים המהירות בעולם, שמאיצה ל־240 קמ״ש בשניות.', en: 'An indoor Ferrari-themed park under a vast red roof. The star is Formula Rossa, among the world’s fastest roller coasters, hitting 240 km/h in seconds.' },
    tip: { he: 'כרטיס משולב לכמה פארקים באי יאס חוסך הרבה. מקורה וממוזג – מתאים גם לקיץ החם.', en: 'A multi-park Yas ticket saves a lot. It’s fully indoor and air-conditioned – fine in summer.' },
    book: 'recommended', ticketIls: { low: 300, high: 420 } },
  'abu-dhabi|Yas Waterworld': {
    about: { he: 'פארק מים גדול באי יאס עם עשרות מגלשות ומתקנים, בריכת גלים לגלישה ונהר עצל, בעיצוב של סיפור פנינים אמירתי.', en: 'A big Yas Island waterpark with dozens of slides and rides, a surf wave pool and a lazy river, themed around an Emirati pearl-diving tale.' },
    tip: { he: 'הגיעו בפתיחה לפני התורים. בקיץ (יוני–ספטמבר) החום קיצוני – שתו המון ועשו הפסקות בצל.', en: 'Arrive at opening to beat queues. Summer heat is extreme – drink lots and take shade breaks.' },
    book: 'recommended', ticketIls: { low: 280, high: 380 } },
  'abu-dhabi|Warner Bros. World': {
    about: { he: 'פארק שעשועים מקורה ענק עם עולמות של גיבורי העל של DC – גות׳האם ומטרופוליס – ושל הלוני טונס. מתקנים, מופעים ומפגשים עם דמויות.', en: 'A huge indoor theme park with worlds of DC superheroes – Gotham and Metropolis – and Looney Tunes, with rides, shows and character meet-ups.' },
    tip: { he: 'מתאים מאוד לילדים בגילי 5–12. כרטיס מקוון משולב עם פרארי וורלד זול יותר.', en: 'Great for kids aged roughly 5–12. Combined online tickets with Ferrari World are cheaper.' },
    book: 'recommended', ticketIls: { low: 300, high: 420 } },
  'abu-dhabi|SeaWorld Abu Dhabi': {
    about: { he: 'פארק ימי מקורה עם אקווריום ענק, מתקנים ומופעים, ואזורים שמציגים אוקיינוסים שונים – מהקוטב ועד שונית טרופית. רואים כרישים, פינגווינים ודולפינים.', en: 'An indoor marine park with a vast aquarium, rides and shows, and zones recreating different oceans – from the poles to a tropical reef – with sharks, penguins and dolphins.' },
    tip: { he: 'הקדישו יום כמעט שלם. בדקו באפליקציה את לוח המופעים ותכננו סביבם.', en: 'Allow most of a day. Check the show schedule in the app and plan around it.' },
    book: 'recommended', ticketIls: { low: 330, high: 450 } },
  'abu-dhabi|Qasr Al Watan': {
    about: { he: 'ארמון נשיאותי פעיל שנפתח לציבור, עם כיפות לבנות, אולמות שיש ענקיים, ספרייה ותצוגות על מסורת השלטון בערב. בערב מוצג על החזית מופע אור וקול.', en: 'A working presidential palace open to the public, with white domes, vast marble halls, a library and displays on Arab governance traditions, plus an evening light-and-sound show on the façade.' },
    tip: { he: 'בדקו את מועדי מופע ״Palace in Motion״ בערב. לבוש צנוע – כתפיים וברכיים מכוסות.', en: 'Check times for the evening ‘Palace in Motion’ show. Modest dress – shoulders and knees covered.' },
    book: 'recommended', ticketIls: { low: 65, high: 130 } },
  'abu-dhabi|Qasr Al Hosn': {
    about: { he: 'הבניין העתיק ביותר באבו דאבי, מגדל שמירה מהמאה ה־18 שהפך למבצר שליטים. היום מוזיאון שמספר איך הכפר של צוללי הפנינים הפך לבירה מודרנית.', en: 'Abu Dhabi’s oldest building, an 18th-century watchtower that grew into the rulers’ fort – now a museum telling how a pearling village became a modern capital.' },
    tip: { he: 'ביקור של כשעה וחצי. שלבו עם בית המלאכה (House of Artisans) במתחם.', en: 'About 90 minutes. Combine with the House of Artisans on the same site.' },
    book: 'no', ticketIls: { low: 25, high: 35 } },
  'abu-dhabi|Abrahamic Family House': {
    about: { he: 'מתחם באי סעדיית שבו עומדים זה לצד זה מסגד, כנסייה ובית כנסת, כל אחד בעיצוב אדריכלי מינימליסטי ייחודי. הסיור מציג את המבנים ואת המסורות המשותפות.', en: 'A complex on Saadiyat Island where a mosque, a church and a synagogue stand side by side, each in its own minimalist design. Tours introduce the buildings and shared traditions.' },
    tip: { he: 'הכניסה חינם אך יש להזמין משבצת מראש באתר. לבוש צנוע. בית הכנסת פעיל ואפשר לבקש פרטים על תפילות.', en: 'Free, but timed slots must be booked online. Modest dress. The synagogue is active; you can ask about services.' },
    book: 'required', ticketIls: { low: 0, high: 0 } },
  'abu-dhabi|Corniche Beach & promenade': {
    about: { he: 'טיילת עירונית ארוכה לאורך המפרץ, עם שבילי הליכה ואופניים, גנים ופארקי משחקים. בחוף יש אזורים ציבוריים ואזור משפחות עם מצילים ומים רגועים.', en: 'A long city promenade along the gulf with walking and cycle paths, gardens and playgrounds. The beach has public sections and a family area with lifeguards and calm water.' },
    tip: { he: 'בואו בשקיעה כשהחום יורד. לאזור המשפחות יש כניסה בתשלום סמלי – שקט ונקי יותר.', en: 'Come at sunset when it cools. The family section charges a small fee – quieter and cleaner.' },
    book: 'no', ticketIls: { low: 0, high: 25 } },
  'abu-dhabi|Saadiyat Beach': {
    about: { he: 'חוף ארוך עם חול לבן ומים צלולים, בין דיונות טבעיות שמגוננות על מקום קינון של צבי ים. שקט ונקי, עם חוף ציבורי ומועדוני חוף.', en: 'A long beach of white sand and clear water backed by natural dunes protecting turtle-nesting sites – calm and clean, with a public beach and beach clubs.' },
    tip: { he: 'בחוף הציבורי יש דמי כניסה קטנים, והוא מצוין לשחייה. אל תיכנסו לאזורי הדיונות המסומנים.', en: 'The public beach charges a small fee and is great for swimming. Keep out of fenced dune areas.' },
    book: 'no', ticketIls: { low: 0, high: 30 } },
  'abu-dhabi|Mangrove National Park — kayaking': {
    about: { he: 'חתירה בקיאק בתעלות שקטות בין עצי מנגרובים, ממש מול קו הרקיע של העיר. רואים אנפות, סרטנים, דגים ולעיתים צבי ים ופלמינגו.', en: 'Kayaking through calm channels between mangrove trees right opposite the city skyline, spotting herons, crabs, fish and sometimes turtles and flamingos.' },
    tip: { he: 'צאו בבוקר או לקראת שקיעה – חם פחות. הסיורים תלויים בגאות, הזמינו מראש.', en: 'Go in the morning or near sunset when it’s cooler. Tours run with the tides – book ahead.' },
    book: 'recommended', ticketIls: { low: 130, high: 220 } },
  'abu-dhabi|Heritage Village': {
    about: { he: 'שחזור של כפר אמירתי מסורתי על חוף הבריכות, עם בית מגורים מעלי דקל, באר, אוהל בדואי ובתי מלאכה של אומנים. נוף יפה מכאן לקו הרקיע של הקורניש.', en: 'A reconstruction of a traditional Emirati village by the Breakwater, with a palm-frond house, a well, a Bedouin tent and craft workshops – and a fine view of the Corniche skyline.' },
    tip: { he: 'ביקור קצר של שעה. בואו אחר הצהריים המאוחרים, כשחם פחות והאור על קו הרקיע יפה.', en: 'An hour is enough. Come late afternoon when it’s cooler and the skyline glows.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },

  // ───── Eilat ─────
  'eilat|Coral World Underwater Observatory': {
    about: { he: 'פארק ימי בחוף האלמוגים, שבמרכזו מצפה תת־ימי בעומק כ־6 מטרים בתוך שונית אמיתית. יש בו גם אקווריום כרישים, בריכת צבי ים ושייט בצוללת.', en: 'A marine park on Coral Beach centred on an underwater observatory about 6 m deep in a living reef, plus a shark tank, turtle pool and a submarine ride.' },
    tip: { he: 'בואו בבוקר כשההאכלות מתקיימות ויש פחות קהל. בדקו לוח האכלות בכניסה.', en: 'Come in the morning for feedings and smaller crowds. Check the feeding schedule at the gate.' },
    book: 'no', ticketIls: { low: 110, high: 150 } },
  'eilat|Coral Beach Nature Reserve': {
    about: { he: 'שמורה ימית עם שונית אלמוגים שמתחילה ממש מהחוף. נכנסים מגשרונים לשנורקלינג ורואים דגים צבעוניים ואלמוגים בלי צורך בסירה.', en: 'A marine reserve with a coral reef starting right at the shore. Enter from small jetties to snorkel among colourful fish and coral – no boat needed.' },
    tip: { he: 'השתמשו בגשרונים בלבד ואל תדרכו על האלמוגים. אפשר לשכור ציוד שנורקלינג בכניסה.', en: 'Enter only via the jetties and never stand on coral. Snorkel gear can be rented at the entrance.' },
    book: 'no', ticketIls: { low: 30, high: 45 } },
  'eilat|Dolphin Reef': {
    about: { he: 'מפרץ פתוח שבו חיה להקת דולפינים בסביבה ימית טבעית. צופים בהם ממזחים צפים, ואפשר להירשם לשנורקלינג או לצלילה בנוכחותם. יש גם בריכות הרגעה.', en: 'An open bay where a pod of dolphins lives in a natural sea environment. Watch them from floating piers or sign up to snorkel or dive with them; relaxation pools too.' },
    tip: { he: 'השחייה עם הדולפינים בתשלום נוסף ובמקומות מוגבלים – הזמינו מראש. בריכות ההרגעה מצוינות בערב.', en: 'Swims with dolphins cost extra and are limited – book ahead. The relaxation pools are lovely in the evening.' },
    book: 'recommended', ticketIls: { low: 80, high: 100 } },
  'eilat|North Beach & promenade': {
    about: { he: 'החוף העירוני המרכזי של אילת, עם טיילת מלונות, מסעדות, דוכנים וחנויות. בערב הטיילת מתמלאת באנשים, מופעי רחוב ואורות.', en: 'Eilat’s main town beach, with a promenade of hotels, restaurants, stalls and shops that fills up in the evening with people, buskers and lights.' },
    tip: { he: 'בקיץ שחו מוקדם בבוקר או אחרי 17:00. מיטות שיזוף בתשלום – הביאו מחצלת אם רוצים לחסוך.', en: 'In summer swim early or after 5pm. Sunbeds cost money – bring a mat to save.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'eilat|Intro dive or snorkelling': {
    about: { he: 'צלילת היכרות עם מדריך, בלי תעודה, לעומק של כמה מטרים בשונית מול החוף, או שנורקלינג מודרך. מתאים למתחילים מגיל 10 בערך, והמים צלולים כמעט כל השנה.', en: 'An intro dive with an instructor, no licence needed, to a few metres on the reef off the beach – or a guided snorkel. Suits beginners from about age 10; water is clear nearly year-round.' },
    tip: { he: 'לא טסים 24 שעות אחרי צלילה – תכננו בהתאם. במרכזי הצלילה בחוף הדרומי המחירים זהים פחות או יותר; בחרו לפי היחס.', en: 'Don’t fly within 24 hours of diving – plan accordingly. South-coast dive centres price similarly; choose by vibe.' },
    book: 'recommended', ticketIls: { low: 50, high: 400 } },
  'eilat|Timna Park': {
    about: { he: 'פארק מדברי עם מכרות נחושת עתיקים, תצורות סלע כמו ״עמודי שלמה״ ו״הפטרייה״, ואגם מלאכותי עם סירות פדלים. יש מסלולי הליכה, אופניים ומופע לילה בעונה.', en: 'A desert park with ancient copper mines, rock formations like Solomon’s Pillars and the Mushroom, and a lake with pedal boats – plus hiking and cycling trails and seasonal night shows.' },
    tip: { he: 'בקיץ הגיעו בפתיחה, החום קשה מאוד בצהריים. התחילו בסרט במרכז המבקרים.', en: 'In summer arrive at opening – midday heat is brutal. Start with the film at the visitor centre.' },
    book: 'no', ticketIls: { low: 50, high: 80 } },
  'eilat|Red Canyon': {
    about: { he: 'קניון צר של אבן חול אדומה וורודה בהרי אילת, עם שביל מעגלי קצר של כשעה וחצי. יורדים בסולמות ובמאחזים בתוך הערוץ – מסלול קל ויפה למשפחות.', en: 'A narrow red-and-pink sandstone canyon in the Eilat Mountains with a short loop trail of about 1.5 hours. Ladders and handholds lead down through it – easy and lovely for families.' },
    tip: { he: 'האור על הקירות הכי יפה בבוקר ובשעות אחר הצהריים המאוחרות. לא בימים חמים מאוד או כשיש התראת שיטפונות.', en: 'Wall colours glow best in morning and late afternoon. Avoid very hot days or flash-flood warnings.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'eilat|Hai-Bar Yotvata Nature Reserve': {
    about: { he: 'שמורה שבה מגדלים ומשיבים לטבע בעלי חיים מדבריים שנכחדו מהארץ, כמו ראמים לבנים, יעלים ויענים. נוסעים ברכב בשמורה וצופים בהם, ויש גם מבנה טורפים.', en: 'A reserve breeding desert animals that vanished from the region – white oryx, ibex, ostriches – for reintroduction. Drive through the reserve to watch them; there’s a predator centre too.' },
    tip: { he: 'בואו מוקדם בבוקר כשבעלי החיים פעילים. שלבו עם עצירה ביטבתה לשוקו קר.', en: 'Come early when animals are active. Combine with a stop at Yotvata for chocolate milk.' },
    book: 'no', ticketIls: { low: 30, high: 45 } },
  'eilat|Mount Tzfahot': {
    about: { he: 'הר קרוב לחוף הדרומי של אילת עם מסלול הליכה קצר ותלול של כשעה וחצי. מהפסגה נשקף נוף על מפרץ אילת וארבע מדינות.', en: 'A peak close to Eilat’s southern coast with a short, steep trail of about 1.5 hours. The summit looks across the Gulf of Eilat to four countries.' },
    tip: { he: 'צאו בזריחה או אחר הצהריים המאוחרים – אין צל. קחו מים ונעליים עם אחיזה.', en: 'Go at sunrise or late afternoon – there’s no shade. Take water and grippy shoes.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'eilat|Eilat Botanical Garden': {
    about: { he: 'גן טרופי קטן בשולי העיר עם מפלים, נחלים ועצים מכל העולם – כמו נווה מדבר ירוק בלב הנוף הצחיח. שבילים מוצלים וגשרונים מעל המים.', en: 'A small tropical garden on the edge of town with waterfalls, streams and trees from around the world – a green oasis amid the arid landscape, with shaded paths and footbridges.' },
    tip: { he: 'מקום מצוין להפסקה מהחום בצהריים. ביקור של כשעה.', en: 'A good escape from midday heat. About an hour.' },
    book: 'no', ticketIls: { low: 25, high: 45 } },
  'eilat|Camel Ranch': {
    about: { he: 'חווה בנחל שלמה שבה יוצאים לרכיבות על גמלים בנופי ההרים, משעה ועד חצי יום, ונהנים מאווירה מדברית עם תה ופיתות.', en: 'A ranch in Nahal Shlomo offering camel rides through the mountain scenery, from one hour to half a day, with a desert atmosphere of tea and flatbread.' },
    tip: { he: 'רכיבת שקיעה היא הנעימה ביותר. לבשו מכנסיים ארוכים – זה מונע שפשופים.', en: 'The sunset ride is the most pleasant. Wear long trousers to avoid chafing.' },
    book: 'recommended', ticketIls: { low: 100, high: 300 } },
  'eilat|Ice Mall': {
    about: { he: 'קניון בצפון אילת שבמרכזו משטח החלקה על קרח אמיתי – במדבר. סביבו חנויות, מסעדות ואטרקציות לילדים, ומקום טוב לברוח מהחום.', en: 'A North Eilat mall with a real ice-skating rink at its centre – in the desert – surrounded by shops, restaurants and kids’ attractions. A good heat escape.' },
    tip: { he: 'ההחלקה בתשלום נפרד וכוללת השכרת מחליקיים. קחו כפפות וגרביים עבות.', en: 'Skating costs extra and includes skate rental. Bring gloves and thick socks.' },
    book: 'no', ticketIls: { low: 0, high: 70 } },

  // ───── Dead Sea ─────
  'dead-sea|Masada': {
    about: { he: 'מבצר על צוק מבודד מעל ים המלח, שבנה הורדוס ושבו התבצרו המורדים האחרונים נגד רומא. מסיירים בארמון הצפוני התלוי, במחסנים, בבתי המרחץ ובשרידי הסוללה הרומית.', en: 'A fortress atop an isolated cliff above the Dead Sea, built by Herod and the last stand of rebels against Rome. Explore the hanging northern palace, storerooms, bathhouses and the Roman siege ramp.' },
    tip: { he: 'עלו ברכבל בבוקר לפני החום, וקחו הרבה מים. התחילו בסרט במוזיאון שבתחתית.', en: 'Take the cable car up early before the heat, with plenty of water. Start at the museum at the base.' },
    book: 'no', ticketIls: { low: 30, high: 85 } },
  'dead-sea|Snake Path climb at sunrise': {
    about: { he: 'שביל מתפתל במדרון המזרחי של מצדה, כשעה של טיפוס תלול. מגיעים לפסגה לפני הזריחה וצופים בשמש עולה מעל ים המלח והרי מואב.', en: 'A winding trail up Masada’s eastern face, about an hour of steep climbing, reaching the top before dawn to watch the sun rise over the Dead Sea and the Moab mountains.' },
    tip: { he: 'השער נפתח כשעה לפני הזריחה; קחו פנס ומים. בימים חמים מאוד השביל נסגר מוקדם – בדקו מראש.', en: 'The gate opens about an hour before sunrise; bring a headlamp and water. On very hot days the trail closes early – check first.' },
    book: 'no', ticketIls: { low: 30, high: 35 } },
  'dead-sea|Ein Gedi Reserve — Nahal David': {
    about: { he: 'נווה מדבר עם נחל זורם, בריכות ומפלים, ובראשם מפל דוד. הולכים במסלול קל בין צמחייה ירוקה, יעלים ושפנים, ומתרעננים במים.', en: 'A desert oasis with a flowing stream, pools and waterfalls topped by David’s Waterfall. An easy trail winds through greenery past ibex and hyraxes, with chances to cool off.' },
    tip: { he: 'הגיעו בפתיחה – בצהריים עמוס וחם. הכניסה האחרונה למסלולים מוקדמת מסגירת השמורה.', en: 'Arrive at opening – midday is crowded and hot. Last trail entry is well before closing.' },
    book: 'no', ticketIls: { low: 28, high: 35 } },
  'dead-sea|Nahal Arugot': {
    about: { he: 'נחל שקט ופראי יותר מנחל דוד, עם מים זורמים, בריכות טבילה ומפל ״הבריכה העליונה״. המסלול ארוך יותר וכולל הליכה במים.', en: 'A quieter, wilder stream than Nahal David, with flowing water, plunge pools and the Upper Pool waterfall. The trail is longer and involves wading.' },
    tip: { he: 'נעלו נעלי מים או סנדלים טובים. בימי חול פחות עמוס. הכניסה האחרונה מוקדמת – בדקו.', en: 'Wear water shoes or sturdy sandals. Weekdays are quieter. Last entry is early – check.' },
    book: 'no', ticketIls: { low: 28, high: 35 } },
  'dead-sea|Kibbutz Ein Gedi Botanical Garden': {
    about: { he: 'גן בוטני חי בתוך קיבוץ, עם מאות מינים של צמחים מכל העולם – באובבים, קקטוסים, צמחי בושם עתיקים – שגדלים בין בתי החברים.', en: 'A living botanical garden inside the kibbutz, with hundreds of species from around the world – baobabs, cacti, ancient perfume plants – growing among the members’ homes.' },
    tip: { he: 'הסיור המודרך מומלץ ודורש תיאום. בערב פחות חם וריחות הצמחים חזקים.', en: 'The guided tour is recommended and needs arranging. Evenings are cooler and fragrant.' },
    book: 'recommended', ticketIls: { low: 25, high: 45 } },
  'dead-sea|Ein Bokek public beach': {
    about: { he: 'החוף הציבורי המוסדר מול המלונות, עם מקלחות, צל ומצילים. נכנסים למים ומרחפים בלי מאמץ במים העשירים במלחים.', en: 'The organised public beach in front of the hotels, with showers, shade and lifeguards. Wade in and float effortlessly in the mineral-rich water.' },
    tip: { he: 'אל תכניסו את הראש ואל תתיזו – המים צורבים בעיניים. אל תתגלחו יום לפני. נעלי ים מגינות מגבישי המלח.', en: 'Keep your head above water and don’t splash – it stings eyes. Don’t shave the day before. Water shoes protect from salt crystals.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'dead-sea|Nahal Bokek': {
    about: { he: 'נחל קצר עם מעיין ומפל קטן בתוך קניון, במרחק הליכה מהמלונות. מסלול קל של כשעה הלוך־חזור, עם צמחייה ירוקה במדבר.', en: 'A short stream with a spring and small waterfall in a canyon, walking distance from the hotels – an easy hour’s round trip with greenery in the desert.' },
    tip: { he: 'מתאים לבוקר לפני הים. לא נכנסים בימים של התראת שיטפונות.', en: 'Good for a morning walk before the beach. Stay out on flash-flood warning days.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'dead-sea|Qumran National Park': {
    about: { he: 'האתר שבו נמצאו המגילות הגנוזות במערות שבצוקים הסמוכים. רואים את שרידי היישוב העתיק, סרט קצר ותצפית על המערה המפורסמת.', en: 'The site where the Dead Sea Scrolls were found in nearby cliff caves. See the ruins of the ancient settlement, a short film and a lookout over the famous cave.' },
    tip: { he: 'ביקור של כשעה. התחילו בסרט כדי להבין את ההקשר.', en: 'About an hour. Start with the film for context.' },
    book: 'no', ticketIls: { low: 25, high: 35 } },
  'dead-sea|Einot Tzukim Nature Reserve': {
    about: { he: 'שמורה עם מעיינות ובריכות מים מליחים־למחצה בין סבך קנים ותמרים, בחוף הצפוני של ים המלח. מקום לטבילה ולהליכה קלה.', en: 'A reserve of brackish springs and pools among reeds and palms on the north shore of the Dead Sea – for a dip and an easy walk.' },
    tip: { he: 'בסופי שבוע עמוס – בואו באמצע השבוע. קחו בגדי ים.', en: 'Busy at weekends – come midweek. Bring swimwear.' },
    book: 'no', ticketIls: { low: 25, high: 35 } },
  'dead-sea|Mount Sodom': {
    about: { he: 'רכס עשוי ברובו מלח, בדרום ים המלח, עם צוקים מחורצים ותצורות כמו ״אשת לוט״. מסלולים קצרים ותצפית על ים המלח והמדבר.', en: 'A ridge made largely of salt at the southern Dead Sea, with fluted cliffs and formations such as ‘Lot’s Wife’, short trails and views over the sea and desert.' },
    tip: { he: 'לא מטיילים בחום של הצהריים. קחו מים ונעליים עם אחיזה.', en: 'Avoid midday heat. Take water and grippy shoes.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'dead-sea|Mud treatments and spa': {
    about: { he: 'מרחי בוץ שחור מינרלי, טבילה בבריכות גופרית ומים מחוממים של ים המלח, ועיסויים. רוב המלונות בעין בוקק מציעים כניסה יומית לספא גם לאורחים מבחוץ.', en: 'Mineral black-mud wraps, dips in sulphur pools and heated Dead Sea water, and massages. Most Ein Bokek hotels sell spa day passes to outside guests.' },
    tip: { he: 'בוץ לבד אפשר למרוח חינם בחוף. כרטיס ספא יומי בימי חול זול יותר מבסופי שבוע.', en: 'You can slather on mud free at the beach. Weekday spa day passes are cheaper than weekends.' },
    book: 'recommended', ticketIls: { low: 100, high: 300 } },

  // ───── Marrakech ─────
  'marrakech|Jemaa el-Fnaa': {
    about: { he: 'הכיכר המרכזית של מרקש, אתר מורשת עולמית. ביום מוכרי מיץ תפוזים, מקדמי נחשים ומציירות חינה; בערב היא מתמלאת בדוכני אוכל מעשנים, מספרי סיפורים ומוזיקאים.', en: 'Marrakech’s great square, a UNESCO-recognised cultural space. By day: orange-juice sellers, snake charmers and henna artists; by night it fills with smoky food stalls, storytellers and musicians.' },
    tip: { he: 'צפו בשקיעה מגג אחד מבתי הקפה מסביב. מי שמצלם אמני רחוב יתבקש לשלם – סכמו מראש או אל תצלמו.', en: 'Watch sunset from a rooftop café. Photographing performers means paying – agree first or don’t shoot.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'marrakech|The medina souks': {
    about: { he: 'מבוך של סמטאות מקורות שבהן כל אזור מוקדש למלאכה: עור, מתכת, תבלינים, שטיחים, צבע ונעלי באבוש. רואים את בעלי המלאכה עובדים בבתי המלאכה הקטנים.', en: 'A maze of covered lanes, each quarter dedicated to a craft: leather, metal, spices, rugs, dyes and babouche slippers – with artisans at work in tiny workshops.' },
    tip: { he: 'התמקחו בנחת, והתחילו בשליש מהמחיר. סרבו בנימוס ל״מדריכים״ שמציעים לקחת אתכם – אפשר פשוט להשתמש בניווט בטלפון.', en: 'Bargain calmly, starting around a third. Politely decline self-appointed ‘guides’ – your phone map works fine.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'marrakech|Koutoubia Mosque (from outside)': {
    about: { he: 'המסגד הגדול של מרקש, עם צריח בגובה כ־77 מטר מהמאה ה־12 שהיה מודל לצריחים במרוקו ובספרד. הכניסה למסגד מותרת למוסלמים בלבד, אבל הגנים שמסביב פתוחים לכולם.', en: 'Marrakech’s great mosque, whose 12th-century minaret of about 77 m inspired towers across Morocco and Spain. Entry is for Muslims only, but the surrounding gardens are open to all.' },
    tip: { he: 'הצריח הכי יפה בשקיעה מגני הכותוביה. משם 5 דקות הליכה לכיכר ג׳מע אל פנא.', en: 'The minaret is loveliest at sunset from the Koutoubia gardens, 5 minutes’ walk from Jemaa el-Fnaa.' },
    book: 'no', ticketIls: { low: 0, high: 0 } },
  'marrakech|Bahia Palace': {
    about: { he: 'ארמון מהמאה ה־19 עם חצרות וגנים, תקרות עץ ארז מצוירות, פסיפסי זליג׳ ועבודות טיח מגולפות. ניתן לראות את הדרך שבה חיו הווזירים והאליטה.', en: 'A 19th-century palace of courtyards and gardens, painted cedar ceilings, zellige tilework and carved stucco – a glimpse of how viziers and the elite lived.' },
    tip: { he: 'הגיעו בפתיחה – אחר כך הקבוצות ממלאות את החדרים. הקדישו כשעה.', en: 'Arrive at opening; tour groups fill the rooms later. Allow about an hour.' },
    book: 'no', ticketIls: { low: 30, high: 40 } },
  'marrakech|Saadian Tombs': {
    about: { he: 'מתחם קברים מהמאה ה־16 של שושלת הסעדים, שהתגלה מחדש רק ב־1917. השיא – אולם שנים־עשר העמודים עם שיש איטלקי ותקרה מגולפת בעדינות מרהיבה.', en: 'A 16th-century burial complex of the Saadian dynasty, rediscovered only in 1917. The highlight is the Hall of Twelve Columns with Italian marble and an exquisitely carved ceiling.' },
    tip: { he: 'האתר קטן והתור לאולם המרכזי ארוך – בואו בפתיחה. ביקור של כחצי שעה.', en: 'It’s small and the queue for the main hall is long – go at opening. About 30 minutes.' },
    book: 'no', ticketIls: { low: 30, high: 40 } },
  'marrakech|El Badi Palace': {
    about: { he: 'חורבות ארמון עצום מהמאה ה־16, שבזמנו נחשב לאחד היפים בעולם. נשארו חומות אדמה גבוהות, בריכות שקועות וגני תפוזים, וחסידות מקננות על החומות.', en: 'The ruins of a vast 16th-century palace once considered among the world’s finest: towering earthen walls, sunken pools and orange gardens, with storks nesting on the ramparts.' },
    tip: { he: 'טפסו לגג החומה לתצפית על המדינה. אין כמעט צל – כובע ומים.', en: 'Climb to the rampart terrace for medina views. Almost no shade – hat and water.' },
    book: 'no', ticketIls: { low: 30, high: 40 } },
  'marrakech|Ben Youssef Madrasa': {
    about: { he: 'בית מדרש אסלאמי מהמאה ה־16, מהגדולים בצפון אפריקה, עם חצר מרכזית ובריכה, פסיפסים, עבודות טיח ועץ ארז מגולף. בקומה העליונה חדרי התלמידים הזעירים.', en: 'A 16th-century Islamic college, one of the largest in North Africa, with a central courtyard and pool, mosaics, carved stucco and cedar, and tiny student cells upstairs.' },
    tip: { he: 'החצר הכי פוטוגנית בבוקר המוקדם. שלבו עם מוזיאון מרקש הסמוך.', en: 'The courtyard is most photogenic early. Combine with the nearby Musée de Marrakech.' },
    book: 'no', ticketIls: { low: 15, high: 25 } },
  'marrakech|Jardin Majorelle': {
    about: { he: 'גן שתכנן הצייר ז׳אק מז׳ורל ושוקם בידי איב סן לורן, עם קקטוסים, במבוק, בריכות ווילה צבועה ב״כחול מז׳ורל״ הבוהק. במתחם גם מוזיאון הברברים.', en: 'A garden designed by painter Jacques Majorelle and restored by Yves Saint Laurent, with cacti, bamboo, pools and a villa painted in vivid ‘Majorelle blue’. The Berber Museum is on site.' },
    tip: { he: 'הכרטיסים נמכרים באתר הרשמי בלבד, עם שעת כניסה – הזמינו מראש. בפתיחה הגן הכי שקט.', en: 'Tickets are sold online only with a timed entry – book ahead. It’s calmest at opening.' },
    book: 'required', ticketIls: { low: 55, high: 120 } },
  'marrakech|Yves Saint Laurent Museum': {
    about: { he: 'מוזיאון מודרני ליד גן מז׳ורל, המוקדש למעצב שמרקש הייתה ביתו השני. מוצגים מבחר מתחלף של בגדים, סקיצות ותצלומים מהקולקציות המפורסמות.', en: 'A modern museum beside Jardin Majorelle devoted to the designer who made Marrakech his second home, with rotating displays of garments, sketches and photos from his famous collections.' },
    tip: { he: 'קנו כרטיס משולב עם גן מז׳ורל באתר – זה גם חוסך תור. ביקור של כשעה.', en: 'Buy a combined ticket with Majorelle online – it also saves queuing. About an hour.' },
    book: 'recommended', ticketIls: { low: 50, high: 60 } },
  'marrakech|Le Jardin Secret': {
    about: { he: 'גן היסטורי משוחזר בלב המדינה, עם גן אסלאמי מסורתי מחולק לארבעה, גן אקזוטי, מערכת השקיה עתיקה ומגדל תצפית. אי של שקט בין הסמטאות הרועשות.', en: 'A restored historic garden in the heart of the medina, with a classic four-part Islamic garden, an exotic garden, an ancient irrigation system and a lookout tower – an island of calm.' },
    tip: { he: 'עלו למגדל (תשלום נוסף) לנוף על הגגות והרי האטלס. שבו לתה בבית הקפה שבגן.', en: 'Climb the tower (small extra fee) for rooftop and Atlas views. Have tea in the garden café.' },
    book: 'no', ticketIls: { low: 30, high: 45 } },
  'marrakech|The Mellah & Lazama Synagogue': {
    about: { he: 'הרובע היהודי ההיסטורי של מרקש, עם בית הכנסת לזמה מהמאה ה־16 – חצר פנימית עם אריחים כחולים ולבנים ותערוכת צילומים על חיי הקהילה.', en: 'Marrakech’s historic Jewish quarter, home to the 16th-century Lazama Synagogue – a blue-and-white tiled courtyard with a photo exhibition on community life.' },
    tip: { he: 'שלבו עם קברי הסעדים וארמון באהייה הסמוכים. שוק התבלינים של המלאח זול מהסוקים המרכזיים.', en: 'Combine with the nearby Saadian Tombs and Bahia Palace. The Mellah spice market is cheaper than the main souks.' },
    book: 'no', ticketIls: { low: 5, high: 20 } },
  'marrakech|Miaara Jewish Cemetery': {
    about: { he: 'בית הקברות היהודי הגדול במרוקו, בשולי המלאח, עם אלפי מצבות לבנות ובהן קברי רבנים וצדיקים שמגיעים אליהם לעלייה לקבר.', en: 'Morocco’s largest Jewish cemetery, at the edge of the Mellah, with thousands of whitewashed tombs including those of revered rabbis visited by pilgrims.' },
    tip: { he: 'השומר במקום פותח ומסביר תמורת תשלום קטן. לבוש צנוע וכיסוי ראש לגברים.', en: 'The caretaker lets you in and explains for a small fee. Dress modestly; men cover their heads.' },
    book: 'no', ticketIls: { low: 5, high: 20 } },
  'marrakech|A traditional hammam': {
    about: { he: 'מרחץ אדים מרוקאי: יושבים בחדר חם, מורחים סבון שחור מזיתים ועוברים קרצוף עמוק עם כפפת כיס, שאחריו העור מרגיש חדש. אפשר בחמאם שכונתי פשוט או בספא מפנק.', en: 'A Moroccan steam bath: sit in the hot room, apply black olive soap, then get a vigorous kessa-glove scrub that leaves skin brand new – in a simple neighbourhood hammam or a pampering spa.' },
    tip: { he: 'בחמאם מקומי הביאו בגד ים, מגבת וכפכפים. בספא הזמינו מראש, במיוחד לזוגות.', en: 'For a local hammam bring swimwear, a towel and flip-flops. Book spas ahead, especially for couples.' },
    book: 'recommended', ticketIls: { low: 10, high: 350 } },
};
