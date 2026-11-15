// Catalog data (spec 23): Central Europe, the Alps and the Nordics. Shape: dist/catalog.mjs.
// Budget figures are rough per-person-per-day on-the-ground estimates in ₪, excluding flights and lodging.
export default [
  {
    id: 'vienna', code: 'VIE', airports: ['VIE'],
    name: { he: 'וינה', en: 'Vienna' }, country: { he: 'אוסטריה', en: 'Austria' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'couple', 'family', 'short_break', 'direct_flight', 'kosher'],
    bestMonths: [4, 5, 6, 9, 10, 12], flightHours: 4, direct: true, budgetLevel: 3, dailyBudgetIls: { low: 200, mid: 350, high: 650 },
    summary: { he: 'עיר קיסרית אלגנטית: ארמונות, מוזיאונים ברמה עולמית, בתי קפה ותיקים ותחבורה ציבורית מצוינת — מתאימה לסופ״ש ארוך, וגם לשווקי חג המולד בדצמבר.', en: 'An elegant imperial capital: palaces, world-class museums, historic coffee houses and excellent public transport — ideal for a long weekend, and for the Christmas markets in December.' },
    highlights: [
      { he: 'ארמון שנברון והגנים שלו', en: 'Schönbrunn Palace and its gardens' },
      { he: 'קתדרלת סטפן הקדוש והטבעת (רינגשטראסה)', en: 'St Stephen’s Cathedral and the Ringstrasse' },
      { he: '״הנשיקה״ של קלימט בבלוודר', en: 'Klimt’s The Kiss at the Belvedere' },
      { he: 'בתי הקפה הווינאיים ועוגת זאכר', en: 'Viennese coffee houses and Sachertorte' },
      { he: 'בית האופרה הממלכתי', en: 'The Vienna State Opera' },
      { he: 'הפראטר והגלגל הענק', en: 'The Prater and the Giant Ferris Wheel' },
      { he: 'שווקי חג המולד בדצמבר', en: 'Christmas markets in December' }
    ],
    areas: [
      { name: { he: 'העיר הפנימית (רובע 1)', en: 'Innere Stadt (1st district)' }, forWhom: { he: 'ביקור ראשון — הכול ברגל', en: 'First-timers — everything on foot' } },
      { name: { he: 'לאופולדשטאט (רובע 2)', en: 'Leopoldstadt (2nd district)' }, forWhom: { he: 'מי שמחפש אוכל כשר וקהילה יהודית, ליד הפראטר', en: 'Those looking for kosher food and the Jewish community, near the Prater' } },
      { name: { he: 'נויבאו ושפיטלברג (רובע 7)', en: 'Neubau & Spittelberg (7th district)' }, forWhom: { he: 'צעירים וזוגות — בוטיקים, בתי קפה וקרוב לרובע המוזיאונים', en: 'Young travellers and couples — boutiques, cafés and close to the MuseumsQuartier' } },
      { name: { he: 'ליד הנאשמרקט (רבעים 4 ו־6)', en: 'Around the Naschmarkt (4th & 6th districts)' }, forWhom: { he: 'אוהבי אוכל, מרכזי ומעט זול יותר', en: 'Food lovers — central and a little cheaper' } }
    ],
    attractions: [
      { name: { he: 'ארמון שנברון', en: 'Schönbrunn Palace' }, kind: 'landmark', durationH: 3, tags: ['culture', 'family'] },
      { name: { he: 'ארמון הופבורג ומוזיאון סיסי', en: 'Hofburg Palace & Sisi Museum' }, area: 'Innere Stadt (1st district)', kind: 'museum', durationH: 2, tags: ['culture'] },
      { name: { he: 'קתדרלת סטפן הקדוש', en: 'St Stephen’s Cathedral' }, area: 'Innere Stadt (1st district)', kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'המוזיאון לתולדות האמנות', en: 'Kunsthistorisches Museum' }, kind: 'museum', durationH: 3, tags: ['culture'] },
      { name: { he: 'ארמון בלוודר', en: 'Belvedere Palace' }, kind: 'museum', durationH: 2, tags: ['culture', 'couple'] },
      { name: { he: 'האלברטינה', en: 'The Albertina' }, area: 'Innere Stadt (1st district)', kind: 'museum', durationH: 2, tags: ['culture'] },
      { name: { he: 'בית האופרה הממלכתי (סיור או הופעה)', en: 'Vienna State Opera (tour or performance)' }, area: 'Innere Stadt (1st district)', kind: 'landmark', durationH: 1.5, tags: ['culture', 'couple'] },
      { name: { he: 'בית הספר הספרדי לרכיבה', en: 'Spanish Riding School' }, area: 'Innere Stadt (1st district)', kind: 'experience', durationH: 1.5, tags: ['culture', 'family'] },
      { name: { he: 'הנאשמרקט', en: 'Naschmarkt' }, area: 'Around the Naschmarkt (4th & 6th districts)', kind: 'market', durationH: 1.5, tags: ['food'] },
      { name: { he: 'רובע המוזיאונים', en: 'MuseumsQuartier' }, area: 'Neubau & Spittelberg (7th district)', kind: 'neighborhood', durationH: 2, tags: ['culture'] },
      { name: { he: 'הפראטר והגלגל הענק', en: 'Prater & the Giant Ferris Wheel' }, area: 'Leopoldstadt (2nd district)', kind: 'park', durationH: 2.5, tags: ['family', 'with_children'] },
      { name: { he: 'המוזיאון היהודי של וינה', en: 'Jewish Museum Vienna' }, area: 'Innere Stadt (1st district)', kind: 'museum', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'בית הונדרטוואסר', en: 'Hundertwasserhaus' }, kind: 'landmark', durationH: 0.5, tags: [] }
    ],
    dayTrips: [
      { name: { he: 'עמק הוואכאו — מנזר מלק ודירנשטיין', en: 'Wachau Valley — Melk Abbey & Dürnstein' }, hours: 1.5, note: { he: 'כרמים לאורך הדנובה, מנזר מרשים ושייט נהר בעונה', en: 'Vineyards along the Danube, a striking abbey and river boats in season' } },
      { name: { he: 'ברטיסלבה', en: 'Bratislava' }, hours: 1, note: { he: 'בירת סלובקיה ברכבת או בסירה על הדנובה', en: 'Slovakia’s capital by train or by boat on the Danube' } },
      { name: { he: 'זלצבורג', en: 'Salzburg' }, hours: 2.5, note: { he: 'ברכבת מהירה — יום ארוך אבל אפשרי', en: 'By fast train — a long but doable day' } }
    ],
    transport: { carRecommended: false, note: { he: 'רכבת תחתית, חשמליות ואוטובוסים מכסים את כל העיר; מהשדה יש רכבת למרכז. רכב רק מסבך — חניה יקרה ומוגבלת.', en: 'U-Bahn, trams and buses cover the whole city, and a train runs from the airport to the centre. A car only complicates things — parking is expensive and restricted.' } },
    practical: {
      currency: 'EUR', language: { he: 'גרמנית; אנגלית נפוצה מאוד', en: 'German; English widely spoken' }, timeZone: 'Europe/Vienna',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'קהילה יהודית גדולה, בעיקר ברובע 2, עם מסעדות, מאפיות וחנויות כשרות; כדאי לבדוק את תעודת הכשרות בכל מקום.', en: 'A large Jewish community, mainly in the 2nd district, with kosher restaurants, bakeries and shops; check each one’s certification.' },
      shabbat: { he: 'בתי כנסת פעילים, כולל הבית הכנסת המרכזי ברובע 1; לינה ברובעים 1–2 מאפשרת להגיע ברגל.', en: 'Active synagogues, including the main City Temple in the 1st district; staying in districts 1–2 keeps them within walking distance.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–אוקטובר נעימים. דצמבר קר אבל חגיגי עם שווקי חג המולד; יולי–אוגוסט יכולים להיות חמים, וינואר–פברואר קרים ואפורים.', en: 'April–June and September–October are pleasant. December is cold but festive with the Christmas markets; July–August can be hot, January–February cold and grey.' }
  },
  {
    id: 'budapest', code: 'BUD', airports: ['BUD'],
    name: { he: 'בודפשט', en: 'Budapest' }, country: { he: 'הונגריה', en: 'Hungary' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'nightlife', 'couple', 'short_break', 'direct_flight', 'kosher', 'low_budget'],
    bestMonths: [4, 5, 6, 9, 10, 12], flightHours: 3.5, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 130, mid: 250, high: 500 },
    summary: { he: 'עיר יפהפייה משני צדי הדנובה: מרחצאות תרמליים, ארמונות וגשרים מוארים, רובע יהודי חי וחיי לילה — במחירים נוחים יחסית לאירופה.', en: 'A beautiful city on both banks of the Danube: thermal baths, palaces and floodlit bridges, a lively Jewish quarter and nightlife — at prices that are friendly for Europe.' },
    highlights: [
      { he: 'בניין הפרלמנט על גדת הדנובה', en: 'The Parliament building on the Danube' },
      { he: 'המרחצאות התרמליים — סצ׳ני וגלרט', en: 'The thermal baths — Széchenyi and Gellért' },
      { he: 'ארמון בודה ומבצר הדייגים', en: 'Buda Castle and the Fisherman’s Bastion' },
      { he: 'בית הכנסת ברחוב דוהאני והרובע היהודי', en: 'The Dohány Street Synagogue and the Jewish Quarter' },
      { he: 'אנדרטת הנעליים על גדת הדנובה', en: 'The Shoes on the Danube Bank memorial' },
      { he: 'ברים בבניינים נטושים (״רואין בארים״)', en: 'The ruin bars' },
      { he: 'שייט ערב על הדנובה', en: 'An evening cruise on the Danube' }
    ],
    areas: [
      { name: { he: 'רובע 5 (המרכז בצד פשט)', en: 'District V (central Pest)' }, forWhom: { he: 'ביקור ראשון — קרוב לפרלמנט ולטיילת', en: 'First-timers — near the Parliament and the riverside' } },
      { name: { he: 'רובע 7 (הרובע היהודי)', en: 'District VII (Jewish Quarter)' }, forWhom: { he: 'חיי לילה, מסעדות ואוכל כשר — פחות שקט', en: 'Nightlife, restaurants and kosher food — not the quietest' } },
      { name: { he: 'רובע 6 ושדרות אנדרשי', en: 'District VI & Andrássy Avenue' }, forWhom: { he: 'זוגות ומשפחות — מרכזי, עם בתי קפה ואופרה', en: 'Couples and families — central, with cafés and the opera' } },
      { name: { he: 'רובע הטירה בבודה', en: 'Buda Castle District' }, forWhom: { he: 'שקט ורומנטי, עם נוף לעיר', en: 'Quiet and romantic, with city views' } }
    ],
    attractions: [
      { name: { he: 'בניין הפרלמנט ההונגרי', en: 'Hungarian Parliament Building' }, area: 'District V (central Pest)', kind: 'landmark', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'ארמון בודה', en: 'Buda Castle' }, area: 'Buda Castle District', kind: 'landmark', durationH: 2, tags: ['culture'] },
      { name: { he: 'מבצר הדייגים וכנסיית מתיאש', en: 'Fisherman’s Bastion & Matthias Church' }, area: 'Buda Castle District', kind: 'viewpoint', durationH: 1, tags: ['couple'] },
      { name: { he: 'מרחצאות סצ׳ני', en: 'Széchenyi Thermal Bath' }, kind: 'experience', durationH: 3, tags: ['relaxation', 'family'] },
      { name: { he: 'מרחצאות גלרט', en: 'Gellért Thermal Bath' }, kind: 'experience', durationH: 2.5, tags: ['relaxation', 'couple'] },
      { name: { he: 'בית הכנסת ברחוב דוהאני', en: 'Dohány Street Synagogue' }, area: 'District VII (Jewish Quarter)', kind: 'religious', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'אנדרטת הנעליים על גדת הדנובה', en: 'Shoes on the Danube Bank' }, area: 'District V (central Pest)', kind: 'landmark', durationH: 0.5, tags: ['culture'] },
      { name: { he: 'בזיליקת סטפן הקדוש', en: 'St Stephen’s Basilica' }, area: 'District V (central Pest)', kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'השוק הגדול', en: 'Great Market Hall' }, kind: 'market', durationH: 1.5, tags: ['food', 'shopping'] },
      { name: { he: 'סימפלה קרט', en: 'Szimpla Kert' }, area: 'District VII (Jewish Quarter)', kind: 'experience', durationH: 2, tags: ['nightlife'] },
      { name: { he: 'האי מרגרט', en: 'Margaret Island' }, kind: 'park', durationH: 2, tags: ['family', 'with_children'] },
      { name: { he: 'תצפית מגבעת גלרט', en: 'Gellért Hill viewpoint' }, kind: 'viewpoint', durationH: 1.5, tags: ['couple'] },
      { name: { he: 'שייט ערב על הדנובה', en: 'Evening Danube cruise' }, kind: 'experience', durationH: 1.5, tags: ['couple'] }
    ],
    dayTrips: [
      { name: { he: 'סנטנדרה', en: 'Szentendre' }, hours: 0.7, note: { he: 'עיירת אמנים ציורית, ברכבת פרברים או בסירה בקיץ', en: 'A picturesque artists’ town, by suburban train or by boat in summer' } },
      { name: { he: 'עיקול הדנובה — ויזגרד ואסטרגום', en: 'Danube Bend — Visegrád & Esztergom' }, hours: 1.5, note: { he: 'מצודה על הר ובזיליקה ענקית מעל הנהר', en: 'A hilltop citadel and a huge basilica above the river' } },
      { name: { he: 'אגם בלטון', en: 'Lake Balaton' }, hours: 2, note: { he: 'בעיקר בקיץ — רחצה ועיירות נופש', en: 'Mainly in summer — swimming and resort towns' } }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו, חשמליות (קו 2 לאורך הדנובה יפהפה) ואוטובוסים; מהשדה יש אוטובוס 100E למרכז. אין צורך ברכב.', en: 'Metro, trams (line 2 along the Danube is lovely) and buses; the 100E bus links the airport to the centre. No need for a car.' } },
    practical: {
      currency: 'HUF', language: { he: 'הונגרית; אנגלית במקומות תיירותיים ובקרב צעירים', en: 'Hungarian; English in tourist areas and among younger people' }, timeZone: 'Europe/Budapest',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'ברובע היהודי (רובע 7) יש מסעדות ומאפיות כשרות ובית חב״ד; כדאי לבדוק את תעודת הכשרות בכל מקום.', en: 'The Jewish Quarter (District VII) has kosher restaurants and bakeries and a Chabad house; check each one’s certification.' },
      shabbat: { he: 'כמה בתי כנסת פעילים ברובע היהודי; לינה ברובעים 5–7 מאפשרת להגיע ברגל.', en: 'Several active synagogues in the Jewish Quarter; staying in districts V–VII keeps them within walking distance.' }
    },
    seasonsNote: { he: 'אפריל–יוני וספטמבר–אוקטובר נוחים. יולי–אוגוסט חמים; דצמבר קר עם שווקי חג המולד, והמרחצאות החמים כיפיים במיוחד בחורף.', en: 'April–June and September–October are comfortable. July–August is hot; December is cold with Christmas markets, and the hot baths are especially good in winter.' }
  },
  {
    id: 'krakow', code: 'KRK', airports: ['KRK'],
    name: { he: 'קרקוב', en: 'Kraków' }, country: { he: 'פולין', en: 'Poland' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'short_break', 'direct_flight', 'low_budget'],
    bestMonths: [5, 6, 7, 8, 9, 10, 12], flightHours: 3.5, direct: true, budgetLevel: 2, dailyBudgetIls: { low: 110, mid: 220, high: 450 },
    summary: { he: 'עיר עתיקה ושמורה עם כיכר מרכזית ענקית, רובע קזימייז היהודי וטירת ואוול — וגם בסיס לביקור באושוויץ־בירקנאו ובמכרה המלח בווליצ׳קה. מחירים נוחים.', en: 'A well-preserved old city with a vast main square, the Jewish district of Kazimierz and Wawel Castle — and a base for visiting Auschwitz-Birkenau and the Wieliczka Salt Mine. Prices are friendly.' },
    highlights: [
      { he: 'הכיכר המרכזית ואולם הבדים', en: 'The Main Market Square and the Cloth Hall' },
      { he: 'טירת ואוול והקתדרלה', en: 'Wawel Castle and Cathedral' },
      { he: 'רובע קזימייז — בתי כנסת, בתי קפה ומורשת יהודית', en: 'Kazimierz — synagogues, cafés and Jewish heritage' },
      { he: 'ביקור באתר ההנצחה אושוויץ־בירקנאו', en: 'A visit to the Auschwitz-Birkenau memorial' },
      { he: 'מכרה המלח בווליצ׳קה', en: 'The Wieliczka Salt Mine' },
      { he: 'מפעל האמייל של אוסקר שינדלר', en: 'Oskar Schindler’s Enamel Factory' }
    ],
    areas: [
      { name: { he: 'העיר העתיקה', en: 'Old Town (Stare Miasto)' }, forWhom: { he: 'ביקור ראשון — הכול ברגל', en: 'First-timers — everything on foot' } },
      { name: { he: 'קזימייז', en: 'Kazimierz' }, forWhom: { he: 'אווירה, מסעדות וקרבה לבתי הכנסת ולחב״ד', en: 'Atmosphere, restaurants and close to the synagogues and Chabad' } },
      { name: { he: 'פודגוז׳ה', en: 'Podgórze' }, forWhom: { he: 'שקט יותר, מעבר לנהר וליד מפעל שינדלר', en: 'Quieter, across the river and near Schindler’s Factory' } },
      { name: { he: 'ליד התחנה המרכזית', en: 'Around the main station' }, forWhom: { he: 'תקציב ונוחות תחבורה לטיולי יום', en: 'Budget and easy transport for day trips' } }
    ],
    attractions: [
      { name: { he: 'הכיכר המרכזית ואולם הבדים', en: 'Main Market Square & Cloth Hall' }, area: 'Old Town (Stare Miasto)', kind: 'landmark', durationH: 1.5, tags: ['culture', 'shopping'] },
      { name: { he: 'בזיליקת מריה הקדושה', en: 'St Mary’s Basilica' }, area: 'Old Town (Stare Miasto)', kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'המוזיאון התת־קרקעי מתחת לכיכר', en: 'Rynek Underground museum' }, area: 'Old Town (Stare Miasto)', kind: 'museum', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'טירת ואוול', en: 'Wawel Royal Castle' }, kind: 'landmark', durationH: 2.5, tags: ['culture'] },
      { name: { he: 'קתדרלת ואוול', en: 'Wawel Cathedral' }, kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'מערת הדרקון בוואוול', en: 'Wawel Dragon’s Den' }, kind: 'experience', durationH: 0.5, tags: ['family', 'with_children'] },
      { name: { he: 'רובע קזימייז', en: 'Kazimierz' }, area: 'Kazimierz', kind: 'neighborhood', durationH: 2.5, tags: ['culture', 'food'] },
      { name: { he: 'בית הכנסת הישן', en: 'Old Synagogue' }, area: 'Kazimierz', kind: 'museum', durationH: 1, tags: ['culture'] },
      { name: { he: 'בית הכנסת והקברות של הרמ״א', en: 'Remuh Synagogue & Cemetery' }, area: 'Kazimierz', kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'כיכר נובי', en: 'Plac Nowy' }, area: 'Kazimierz', kind: 'market', durationH: 1, tags: ['food'] },
      { name: { he: 'מפעל האמייל של אוסקר שינדלר', en: 'Oskar Schindler’s Enamel Factory' }, area: 'Podgórze', kind: 'museum', durationH: 2.5, tags: ['culture'] },
      { name: { he: 'כיכר גיבורי הגטו', en: 'Ghetto Heroes Square' }, area: 'Podgórze', kind: 'landmark', durationH: 0.5, tags: ['culture'] },
      { name: { he: 'פארק הפלאנטי', en: 'Planty Park' }, area: 'Old Town (Stare Miasto)', kind: 'park', durationH: 1, tags: ['family'] }
    ],
    dayTrips: [
      { name: { he: 'אושוויץ־בירקנאו — אתר ההנצחה והמוזיאון', en: 'Auschwitz-Birkenau Memorial and Museum' }, hours: 1.5, note: { he: 'ביקור מטלטל שדורש יום שלם; כדאי להזמין כניסה עם הדרכה מראש ולהגיע בלבוש מכבד', en: 'A deeply moving visit that takes a full day; book a guided entry in advance and dress respectfully' } },
      { name: { he: 'מכרה המלח בווליצ׳קה', en: 'Wieliczka Salt Mine' }, hours: 0.5, note: { he: 'אולמות וקפלות מגולפים במלח עמוק מתחת לאדמה; הזמינו סיור מראש', en: 'Halls and chapels carved from salt deep underground; book a tour in advance' } },
      { name: { he: 'זקופנה והרי הטטרה', en: 'Zakopane & the Tatra Mountains' }, hours: 2, note: { he: 'עיירת הרים — הליכות בקיץ ושלג בחורף', en: 'A mountain town — hiking in summer, snow in winter' } }
    ],
    transport: { carRecommended: false, note: { he: 'המרכז קומפקטי ונוח להליכה, עם חשמליות; מהשדה יש רכבת למרכז. לאושוויץ ולווליצ׳קה הכי פשוט בסיור מאורגן או בתחבורה ציבורית.', en: 'The centre is compact and walkable, with trams; a train links the airport to the centre. For Auschwitz and Wieliczka an organised tour or public transport is simplest.' } },
    practical: {
      currency: 'PLN', language: { he: 'פולנית; אנגלית במקומות תיירותיים ובקרב צעירים', en: 'Polish; English in tourist areas and among younger people' }, timeZone: 'Europe/Warsaw',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'בקזימייז יש בית חב״ד עם ארוחות ומעט אפשרויות כשרות; ההיצע מצומצם, כדאי לתאם מראש.', en: 'Kazimierz has a Chabad house with meals and a few kosher options; supply is limited, so arrange in advance.' },
      shabbat: { he: 'בתי כנסת פעילים בקזימייז; לינה ברובע מאפשרת להגיע ברגל. לתאם ארוחות שבת עם חב״ד.', en: 'Active synagogues in Kazimierz; staying there keeps them within walking distance. Arrange Shabbat meals with Chabad.' }
    },
    seasonsNote: { he: 'מאי–ספטמבר נעימים וארוכים. דצמבר קר עם שוק חג המולד בכיכר; ינואר–פברואר קרים מאוד, במיוחד באושוויץ שרובו בחוץ.', en: 'May–September is pleasant with long days. December is cold, with a Christmas market on the square; January–February is very cold, especially at Auschwitz, which is mostly outdoors.' }
  },
  {
    id: 'swiss-alps', code: 'ZRH', airports: ['ZRH', 'GVA'],
    name: { he: 'האלפים השווייצריים', en: 'The Swiss Alps' }, country: { he: 'שווייץ', en: 'Switzerland' }, region: 'europe',
    tags: ['nature', 'family', 'couple', 'adventure', 'ski', 'luxury', 'direct_flight'],
    bestMonths: [1, 2, 3, 6, 7, 8, 9, 12], flightHours: 4.5, direct: true, budgetLevel: 4, dailyBudgetIls: { low: 350, mid: 600, high: 1100 },
    summary: { he: 'אגמים בצבע טורקיז, פסגות מושלגות ורכבות הרים מדויקות: ציריך, לוצרן ואזור אינטרלאקן–יונגפראו. בקיץ טיולים ואגמים, בחורף סקי — יעד יקר אבל מרהיב.', en: 'Turquoise lakes, snowy peaks and precise mountain railways: Zurich, Lucerne and the Interlaken–Jungfrau region. Hiking and lakes in summer, skiing in winter — expensive but spectacular.' },
    highlights: [
      { he: 'יונגפראויוך — ״פסגת אירופה״', en: 'Jungfraujoch — the “Top of Europe”' },
      { he: 'אגם לוצרן וגשר הקפלה', en: 'Lake Lucerne and the Chapel Bridge' },
      { he: 'עמק לאוטרברונן ומפלי המים', en: 'The Lauterbrunnen Valley and its waterfalls' },
      { he: 'פסגות פילאטוס וריגי ברכבות הרים', en: 'Mount Pilatus and Mount Rigi by mountain railway' },
      { he: 'גרינדלוולד והליכה על המצוק בפירסט', en: 'Grindelwald and the First Cliff Walk' },
      { he: 'סקי בגרינדלוולד ובוונגן', en: 'Skiing in Grindelwald and Wengen' },
      { he: 'שוקולד ופונדו שווייצרי', en: 'Swiss chocolate and fondue' }
    ],
    areas: [
      { name: { he: 'ציריך', en: 'Zurich' }, forWhom: { he: 'לילה ראשון או אחרון, עיר, קניות ואוכל כשר', en: 'A first or last night — city, shopping and kosher food' } },
      { name: { he: 'לוצרן', en: 'Lucerne' }, forWhom: { he: 'בסיס מרכזי ליד האגם, נוח לטיולי יום ברכבת', en: 'A central lakeside base, handy for day trips by train' } },
      { name: { he: 'אינטרלאקן', en: 'Interlaken' }, forWhom: { he: 'משפחות ומי שרוצה בסיס נוח לאזור יונגפראו', en: 'Families and anyone wanting an easy base for the Jungfrau region' } },
      { name: { he: 'גרינדלוולד, ונגן ולאוטרברונן', en: 'Grindelwald, Wengen & Lauterbrunnen' }, forWhom: { he: 'כפרי הרים — למטיילים ולגולשי סקי', en: 'Mountain villages — for hikers and skiers' } }
    ],
    attractions: [
      { name: { he: 'יונגפראויוך', en: 'Jungfraujoch' }, area: 'Grindelwald, Wengen & Lauterbrunnen', kind: 'viewpoint', durationH: 6, tags: ['nature', 'family'] },
      { name: { he: 'גשר הקפלה בלוצרן', en: 'Chapel Bridge, Lucerne' }, area: 'Lucerne', kind: 'landmark', durationH: 1, tags: ['culture'] },
      { name: { he: 'שייט באגם לוצרן', en: 'Lake Lucerne boat cruise' }, area: 'Lucerne', kind: 'experience', durationH: 2, tags: ['relaxation', 'couple'] },
      { name: { he: 'הר פילאטוס', en: 'Mount Pilatus' }, area: 'Lucerne', kind: 'viewpoint', durationH: 4, tags: ['nature'] },
      { name: { he: 'הר ריגי', en: 'Mount Rigi' }, kind: 'viewpoint', durationH: 4, tags: ['nature', 'family'] },
      { name: { he: 'המוזיאון השווייצרי לתחבורה', en: 'Swiss Museum of Transport' }, area: 'Lucerne', kind: 'museum', durationH: 3, tags: ['family', 'with_children'] },
      { name: { he: 'עמק לאוטרברונן ומפל שטאובך', en: 'Lauterbrunnen Valley & Staubbach Falls' }, area: 'Grindelwald, Wengen & Lauterbrunnen', kind: 'nature', durationH: 2, tags: ['nature'] },
      { name: { he: 'מפלי טרומלבך', en: 'Trümmelbach Falls' }, area: 'Grindelwald, Wengen & Lauterbrunnen', kind: 'nature', durationH: 1.5, tags: ['nature'] },
      { name: { he: 'פירסט ושביל המצוק', en: 'Grindelwald First & Cliff Walk' }, area: 'Grindelwald, Wengen & Lauterbrunnen', kind: 'experience', durationH: 3, tags: ['adventure', 'family'] },
      { name: { he: 'תצפית הרדר קולם', en: 'Harder Kulm viewpoint' }, area: 'Interlaken', kind: 'viewpoint', durationH: 1.5, tags: ['couple'] },
      { name: { he: 'שייט באגם בריינץ', en: 'Lake Brienz boat trip' }, area: 'Interlaken', kind: 'experience', durationH: 2, tags: ['relaxation'] },
      { name: { he: 'העיר העתיקה של ציריך ובאנהופשטראסה', en: 'Zurich Old Town & Bahnhofstrasse' }, area: 'Zurich', kind: 'neighborhood', durationH: 2, tags: ['shopping', 'culture'] },
      { name: { he: 'בית השוקולד של לינדט', en: 'Lindt Home of Chocolate' }, area: 'Zurich', kind: 'museum', durationH: 1.5, tags: ['family', 'food'] }
    ],
    dayTrips: [
      { name: { he: 'מפלי הריין', en: 'Rhine Falls' }, hours: 0.75, note: { he: 'המפלים הגדולים באירופה, קרוב לציריך', en: 'Europe’s largest waterfall, close to Zurich' } },
      { name: { he: 'ברן', en: 'Bern' }, hours: 1, note: { he: 'עיר הבירה עם עיר עתיקה מקורה בארקדות — ברכבת מציריך או מאינטרלאקן', en: 'The capital, with an arcaded old town — by train from Zurich or Interlaken' } },
      { name: { he: 'צרמט והמטרהורן', en: 'Zermatt & the Matterhorn' }, hours: 2.5, note: { he: 'יום ארוך מאינטרלאקן; עדיף ללון לילה', en: 'A long day from Interlaken; better with an overnight stay' } }
    ],
    transport: { carRecommended: false, note: { he: 'הרכבות, הסירות ורכבלי ההרים מתואמים ומדויקים; כרטיס מעבר תיירותי (Swiss Travel Pass) משתלם לרוב. ונגן ומירן סגורים לרכבים, כך שרכב לא באמת נחוץ.', en: 'Trains, boats and mountain lifts are timed together and punctual; a Swiss Travel Pass often pays off. Wengen and Mürren are car-free, so a car isn’t really needed.' } },
    practical: {
      currency: 'CHF', language: { he: 'גרמנית שווייצרית באזורים האלה (צרפתית בז׳נבה); אנגלית נפוצה', en: 'Swiss German in these areas (French in Geneva); English widely spoken' }, timeZone: 'Europe/Zurich',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'בציריך יש קהילה יהודית גדולה עם מסעדות וחנויות כשרות; באזורי ההרים ההיצע כמעט אפסי — כדאי להצטייד בציריך או לתאם ארוחות מראש.', en: 'Zurich has a large Jewish community with kosher restaurants and shops; in the mountains there is almost nothing — stock up in Zurich or arrange meals in advance.' },
      shabbat: { he: 'בציריך בתי כנסת רבים ברובע אנגה ובסביבה; בהרים כדאי לבחור לינה במרחק הליכה מהכפר ולתכנן את השבת מראש.', en: 'Zurich has many synagogues around Enge and nearby; in the mountains, stay within walking distance of the village and plan Shabbat ahead.' }
    },
    seasonsNote: { he: 'יוני–ספטמבר לטיולים ואגמים; דצמבר–מרץ לסקי. אפריל–מאי ונובמבר הם עונות מעבר — חלק מהרכבלים סגורים לתחזוקה. מזג האוויר בהרים משתנה מהר — כדאי לבדוק מצלמות פסגה לפני שעולים.', en: 'June–September for hiking and lakes; December–March for skiing. April–May and November are shoulder seasons — some lifts close for maintenance. Mountain weather changes fast — check the summit webcams before going up.' }
  },
  {
    id: 'austrian-alps', code: 'INN', airports: ['INN', 'SZG'],
    name: { he: 'האלפים האוסטריים', en: 'The Austrian Alps' }, country: { he: 'אוסטריה', en: 'Austria' }, region: 'europe',
    tags: ['ski', 'nature', 'family', 'couple', 'adventure'],
    bestMonths: [12, 1, 2, 3], flightHours: 5.5, direct: false, budgetLevel: 3, dailyBudgetIls: { low: 400, mid: 600, high: 950 },
    summary: { he: 'טירול וחבל זלצבורג: אתרי סקי גדולים ומגוונים, כפרים עם אפרה־סקי ונופים מושלגים — היעד הקלאסי לשבוע סקי. בקיץ ההרים הופכים למסלולי הליכה, אגמים ומפלים.', en: 'Tyrol and the Salzburg region: large, varied ski areas, villages with après-ski and snowy scenery — the classic ski-week destination. In summer the mountains turn into hiking trails, lakes and waterfalls.' },
    highlights: [
      { he: 'שבוע סקי באתרים כמו צילרטל, סקיוולט ושלבאך', en: 'A ski week in areas such as Zillertal, SkiWelt and Saalbach' },
      { he: 'הקרחון בהינטרטוקס — שלג בטוח כמעט כל השנה', en: 'The Hintertux Glacier — reliable snow almost all year' },
      { he: 'אפרה־סקי בכפרי טירול', en: 'Après-ski in the Tyrolean villages' },
      { he: 'רכבל הנורדקטה ישר ממרכז אינסברוק', en: 'The Nordkette cable car straight from central Innsbruck' },
      { he: 'העיר העתיקה של זלצבורג', en: 'Salzburg’s old town' },
      { he: 'בקיץ: מפלי קרימל ואגמים בצבע טורקיז', en: 'In summer: the Krimml Waterfalls and turquoise lakes' }
    ],
    areas: [
      { name: { he: 'צילרטל (מיירהופן)', en: 'Zillertal (Mayrhofen)' }, forWhom: { he: 'משפחות ומי שרוצה מגוון מסלולים וגישה לקרחון', en: 'Families and anyone wanting varied slopes and glacier access' } },
      { name: { he: 'קיצביל וסקיוולט', en: 'Kitzbühel & SkiWelt' }, forWhom: { he: 'גולשים בכל הרמות — אזור ענק ומחובר', en: 'Skiers of every level — a huge linked area' } },
      { name: { he: 'שלבאך–הינטרגלם', en: 'Saalbach-Hinterglemm' }, forWhom: { he: 'מעגל סקי גדול ואפרה־סקי שמח', en: 'A big ski circuit and lively après-ski' } },
      { name: { he: 'סנט אנטון אם ארלברג', en: 'St Anton am Arlberg' }, forWhom: { he: 'גולשים מנוסים ושטח פתוח', en: 'Experienced skiers and off-piste terrain' } },
      { name: { he: 'אינסברוק', en: 'Innsbruck' }, forWhom: { he: 'בסיס עירוני עם סקי יומי ותרבות', en: 'A city base with day skiing and culture' } }
    ],
    attractions: [
      { name: { he: 'קרחון הינטרטוקס', en: 'Hintertux Glacier' }, area: 'Zillertal (Mayrhofen)', kind: 'nature', durationH: 6, tags: ['ski', 'adventure'] },
      { name: { he: 'רכבל הנורדקטה', en: 'Nordkette cable car' }, area: 'Innsbruck', kind: 'viewpoint', durationH: 3, tags: ['nature', 'family'] },
      { name: { he: 'הגג המוזהב והעיר העתיקה של אינסברוק', en: 'Golden Roof & Innsbruck Old Town' }, area: 'Innsbruck', kind: 'landmark', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'טירת אמבראס', en: 'Ambras Castle' }, area: 'Innsbruck', kind: 'museum', durationH: 2, tags: ['culture'] },
      { name: { he: 'קפיצת הסקי ברגאיזל', en: 'Bergisel Ski Jump' }, area: 'Innsbruck', kind: 'viewpoint', durationH: 1, tags: ['ski'] },
      { name: { he: 'עולמות הקריסטל של סברובסקי', en: 'Swarovski Crystal Worlds' }, kind: 'museum', durationH: 2, tags: ['family', 'shopping'] },
      { name: { he: 'העיר קיצביל והר האנקאם', en: 'Kitzbühel town & the Hahnenkamm' }, area: 'Kitzbühel & SkiWelt', kind: 'neighborhood', durationH: 2, tags: ['ski', 'luxury'] },
      { name: { he: 'העיר העתיקה של זלצבורג ומבצר הוהנזלצבורג', en: 'Salzburg Old Town & Hohensalzburg Fortress' }, kind: 'landmark', durationH: 3, tags: ['culture'] },
      { name: { he: 'צל אם זה והאגם', en: 'Zell am See and its lake' }, kind: 'nature', durationH: 3, tags: ['nature', 'relaxation'] },
      { name: { he: 'מפלי קרימל (בעיקר בקיץ)', en: 'Krimml Waterfalls (mainly summer)' }, kind: 'nature', durationH: 3, tags: ['nature', 'family'] },
      { name: { he: 'כביש הגרוסגלוקנר (מאי–אוקטובר)', en: 'Grossglockner High Alpine Road (May–October)' }, kind: 'experience', durationH: 5, tags: ['nature'] },
      { name: { he: 'מערת הקרח אייזריזנוולט (מאי–אוקטובר)', en: 'Eisriesenwelt ice cave (May–October)' }, kind: 'nature', durationH: 3, tags: ['adventure'] }
    ],
    dayTrips: [
      { name: { he: 'זלצבורג מאינסברוק', en: 'Salzburg from Innsbruck' }, hours: 2, note: { he: 'ברכבת — עיר עתיקה, מבצר ובית הולדתו של מוצרט', en: 'By train — old town, fortress and Mozart’s birthplace' } },
      { name: { he: 'הלשטאט', en: 'Hallstatt' }, hours: 1.5, note: { he: 'מזלצבורג; כפר על אגם — עמוס מאוד בשעות היום', en: 'From Salzburg; a lakeside village — very crowded during the day' } },
      { name: { he: 'טירת נוישוונשטיין', en: 'Neuschwanstein Castle' }, hours: 2, note: { he: 'מעבר לגבול בגרמניה, ברכב מאינסברוק; להזמין כרטיסים מראש', en: 'Over the border in Germany, by car from Innsbruck; book tickets ahead' } }
    ],
    transport: { carRecommended: false, note: { he: 'לשבוע סקי מספיקה העברה מהשדה לאתר, ובתוך האתר יש אוטובוסי סקי. בקיץ, או כשרוצים לגלוש בכמה אתרים, רכב נוח — בחורף חובה צמיגי חורף. לרוב טסים עם עצירה בווינה, בציריך או בפרנקפורט, או למינכן וממשיכים ביבשה; לפעמים יש בעונה טיסות שכר של חבילות סקי.', en: 'For a ski week an airport transfer is enough, with ski buses in the resort. In summer, or to ski several areas, a car is handy — winter tyres are mandatory in winter. Flights usually connect via Vienna, Zurich or Frankfurt, or land in Munich and continue overland; ski-package charters sometimes run in season.' } },
    practical: {
      currency: 'EUR', language: { he: 'גרמנית; אנגלית נפוצה מאוד באתרי הסקי', en: 'German; English widely spoken in the ski resorts' }, timeZone: 'Europe/Vienna',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'באתרי הסקי אין כמעט היצע כשר מקומי; בעונה יש חבילות סקי עם אירוח כשר דרך מפעילים מישראל — אחרת כדאי להביא או לתאם אוכל ארוז.', en: 'There is almost no local kosher supply in the resorts; in season some Israeli operators run ski packages with kosher catering — otherwise bring or arrange packed food.' },
      shabbat: { he: 'הרכבלים פועלים בשבת; כדאי לבחור לינה במרחק הליכה ממרכז הכפר ולתכנן את השבת מראש.', en: 'Lifts run on Shabbat; stay within walking distance of the village centre and plan Shabbat ahead.' }
    },
    seasonsNote: { he: 'עונת הסקי מדצמבר עד מרץ; השיא בחגים ובחופשות פברואר — יקר ועמוס. בתחילת ובסוף העונה השלג פחות בטוח באתרים נמוכים, והקרחונים פתוחים זמן רב יותר. יוני–ספטמבר מצוינים להליכות ואגמים.', en: 'The ski season runs from December to March; the peaks are the holidays and February half-term — expensive and busy. Early and late in the season snow is less reliable at lower resorts, while the glaciers stay open longer. June–September is excellent for hiking and lakes.' }
  },
  {
    id: 'iceland', code: 'KEF', airports: ['KEF'],
    name: { he: 'איסלנד', en: 'Iceland' }, country: { he: 'איסלנד', en: 'Iceland' }, region: 'europe',
    tags: ['nature', 'adventure', 'couple', 'week_long'],
    bestMonths: [2, 3, 6, 7, 8, 9], flightHours: 9, direct: false, budgetLevel: 4, dailyBudgetIls: { low: 300, mid: 500, high: 900 },
    summary: { he: 'אי של קרחונים, מפלים, הרי געש ומעיינות חמים — טיול כביש של שבוע ומעלה. בקיץ השמש כמעט לא שוקעת, ובחורף יש סיכוי לזוהר הצפוני. יקר, אבל אין דבר כזה.', en: 'An island of glaciers, waterfalls, volcanoes and hot springs — a road trip of a week or more. In summer the sun barely sets, and in winter there is a chance of the northern lights. Expensive, but unlike anywhere else.' },
    highlights: [
      { he: 'מעגל הזהב — תינגווליר, גייסיר וגולפוס', en: 'The Golden Circle — Þingvellir, Geysir and Gullfoss' },
      { he: 'מפלי החוף הדרומי — סליאלנדספוס וסקוגאפוס', en: 'The south-coast waterfalls — Seljalandsfoss and Skógafoss' },
      { he: 'לגונת הקרחונים יוקולסרלון וחוף היהלומים', en: 'Jökulsárlón glacier lagoon and Diamond Beach' },
      { he: 'רחצה במעיינות חמים ובלגונות', en: 'Bathing in hot springs and lagoons' },
      { he: 'זוהר הצפוני בחורף', en: 'The northern lights in winter' },
      { he: 'צפייה בלווייתנים בצפון', en: 'Whale watching in the north' }
    ],
    areas: [
      { name: { he: 'רייקיאוויק', en: 'Reykjavík' }, forWhom: { he: 'הימים הראשונים והאחרונים — מסעדות, סיורים יוצאים מכאן', en: 'The first and last days — restaurants, tours leave from here' } },
      { name: { he: 'החוף הדרומי (ויק)', en: 'The South Coast (Vík)' }, forWhom: { he: 'מפלים, חופים שחורים וקרחונים', en: 'Waterfalls, black beaches and glaciers' } },
      { name: { he: 'אקוריירי והצפון', en: 'Akureyri & the North' }, forWhom: { he: 'מי שמקיף את האי — אגם מיוואטן ולווייתנים', en: 'Those circling the island — Lake Mývatn and whales' } },
      { name: { he: 'חצי האי סנייפלסנס', en: 'Snæfellsnes Peninsula' }, forWhom: { he: '״איסלנד בקטן״ — טוב לטיול קצר יותר', en: '“Iceland in miniature” — good for a shorter trip' } }
    ],
    attractions: [
      { name: { he: 'כנסיית הלגרימסקירקיה', en: 'Hallgrímskirkja' }, area: 'Reykjavík', kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'אולם הקונצרטים הרפה', en: 'Harpa Concert Hall' }, area: 'Reykjavík', kind: 'landmark', durationH: 0.5, tags: ['culture'] },
      { name: { he: 'הפארק הלאומי תינגווליר', en: 'Þingvellir National Park' }, kind: 'nature', durationH: 2, tags: ['nature', 'culture'] },
      { name: { he: 'גייסיר ושטרוקור', en: 'Geysir & Strokkur' }, kind: 'nature', durationH: 1, tags: ['nature', 'family'] },
      { name: { he: 'מפל גולפוס', en: 'Gullfoss' }, kind: 'nature', durationH: 1, tags: ['nature'] },
      { name: { he: 'מפל סליאלנדספוס', en: 'Seljalandsfoss' }, area: 'The South Coast (Vík)', kind: 'nature', durationH: 1, tags: ['nature'] },
      { name: { he: 'מפל סקוגאפוס', en: 'Skógafoss' }, area: 'The South Coast (Vík)', kind: 'nature', durationH: 1, tags: ['nature'] },
      { name: { he: 'חוף ריינספיארה', en: 'Reynisfjara beach' }, area: 'The South Coast (Vík)', kind: 'beach', durationH: 1, tags: ['nature'] },
      { name: { he: 'לגונת הקרחונים יוקולסרלון', en: 'Jökulsárlón glacier lagoon' }, area: 'The South Coast (Vík)', kind: 'nature', durationH: 2, tags: ['nature', 'couple'] },
      { name: { he: 'הלגונה הכחולה', en: 'Blue Lagoon' }, kind: 'experience', durationH: 3, tags: ['relaxation', 'luxury'] },
      { name: { he: 'סקיי לגון', en: 'Sky Lagoon' }, area: 'Reykjavík', kind: 'experience', durationH: 2, tags: ['relaxation', 'couple'] },
      { name: { he: 'צפייה בלווייתנים בהוסאוויק', en: 'Whale watching from Húsavík' }, area: 'Akureyri & the North', kind: 'experience', durationH: 3, tags: ['nature', 'family'] },
      { name: { he: 'אזור אגם מיוואטן והמרחצאות הטבעיים', en: 'Lake Mývatn area & Mývatn Nature Baths' }, area: 'Akureyri & the North', kind: 'nature', durationH: 4, tags: ['nature', 'relaxation'] }
    ],
    dayTrips: [
      { name: { he: 'מעגל הזהב', en: 'The Golden Circle' }, hours: 1, note: { he: 'לולאה של כ־230 ק״מ מרייקיאוויק — יום שלם ברכב או בסיור', en: 'A loop of about 230 km from Reykjavík — a full day by car or on a tour' } },
      { name: { he: 'החוף הדרומי עד ויק', en: 'The South Coast to Vík' }, hours: 2.5, note: { he: 'מפלים וחוף שחור; עדיף ללון בדרך', en: 'Waterfalls and a black beach; better with an overnight stop' } },
      { name: { he: 'חצי האי סנייפלסנס', en: 'Snæfellsnes Peninsula' }, hours: 2.5, note: { he: 'הר קירקיופל, חופים וכפרי דייגים', en: 'Kirkjufell mountain, beaches and fishing villages' } }
    ],
    transport: { carRecommended: true, note: { he: 'הכי טוב ברכב שכור; בכבישי ההרים (F) מותר לנסוע רק ב־4x4 ורק בקיץ. בחורף כבישים קפואים וימים קצרים — כדאי לבדוק כל בוקר את road.is ו־safetravel.is, או לבחור בסיורים מאורגנים.', en: 'Best by hire car; the highland F-roads are 4x4-only and summer-only. In winter roads are icy and days short — check road.is and safetravel.is every morning, or choose organised tours.' } },
    practical: {
      currency: 'ISK', language: { he: 'איסלנדית; אנגלית שוטפת כמעט אצל כולם', en: 'Icelandic; almost everyone speaks fluent English' }, timeZone: 'Atlantic/Reykjavik',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'ברייקיאוויק יש בית חב״ד שאפשר לתאם איתו ארוחות; מחוץ לבירה אין היצע כשר — כדאי להביא אוכל ארוז.', en: 'Reykjavík has a Chabad house where meals can be arranged; outside the capital there is no kosher supply — bring packed food.' },
      shabbat: { he: 'הכי פשוט לשבות ברייקיאוויק בתיאום עם חב״ד. בקיץ השבת נכנסת ויוצאת בשעות מאוחרות מאוד — כדאי לבדוק זמנים מראש.', en: 'Shabbat is easiest in Reykjavík with Chabad. In summer Shabbat starts and ends very late — check the times in advance.' }
    },
    seasonsNote: { he: 'יוני–אוגוסט: ימים ארוכים מאוד, מזג אוויר מתון והכי עמוס. ספטמבר ופברואר–מרץ: סיכוי טוב לזוהר הצפוני עם קצת יותר אור. בחורף ימים קצרים מאוד וכבישים קשים. בחצי האי רייקיאנס יש מדי פעם התפרצויות געשיות — כדאי לעקוב אחרי העדכונים המקומיים.', en: 'June–August: very long days, mild weather and the busiest time. September and February–March: a good chance of northern lights with a bit more daylight. Winter brings very short days and hard roads. The Reykjanes peninsula has occasional volcanic eruptions — follow local updates.' }
  },
  {
    id: 'norway-fjords', code: 'BGO', airports: ['BGO', 'OSL'],
    name: { he: 'הפיורדים של נורווגיה', en: 'Norway’s Fjords' }, country: { he: 'נורווגיה', en: 'Norway' }, region: 'europe',
    tags: ['nature', 'adventure', 'couple', 'family', 'week_long'],
    bestMonths: [5, 6, 7, 8, 9], flightHours: 7.5, direct: false, budgetLevel: 4, dailyBudgetIls: { low: 280, mid: 450, high: 850 },
    summary: { he: 'ברגן הצבעונית היא השער לפיורדים של מערב נורווגיה: מצוקים שיורדים לים, מפלים, רכבות נוף ומסלולי הליכה מפורסמים. הכי טוב בקיץ, עם ימים ארוכים מאוד.', en: 'Colourful Bergen is the gateway to western Norway’s fjords: cliffs dropping into the sea, waterfalls, scenic railways and famous hikes. Best in summer, with very long days.' },
    highlights: [
      { he: 'הרציף ההיסטורי בריגן בברגן', en: 'Bergen’s historic Bryggen wharf' },
      { he: 'רכבת פלאם ושייט בנרויפיורד', en: 'The Flåm Railway and a Nærøyfjord cruise' },
      { he: 'מסלול ״נורווגיה על קצה המזלג״', en: 'The “Norway in a Nutshell” route' },
      { he: 'הגיירנגרפיורד', en: 'The Geirangerfjord' },
      { he: 'טיפוס לטרולטונגה או לפרייקסטולן', en: 'Hiking to Trolltunga or Preikestolen' },
      { he: 'מפלים ומטעים בהרדנגרפיורד', en: 'Waterfalls and orchards on the Hardangerfjord' }
    ],
    areas: [
      { name: { he: 'ברגן', en: 'Bergen' }, forWhom: { he: 'בסיס עירוני עם מסעדות, נוח לטיולי יום', en: 'A city base with restaurants, handy for day trips' } },
      { name: { he: 'פלאם ואורלנד', en: 'Flåm & Aurland' }, forWhom: { he: 'בלב הסוגנפיורד — זוגות ומשפחות', en: 'In the heart of the Sognefjord — couples and families' } },
      { name: { he: 'ווס', en: 'Voss' }, forWhom: { he: 'אוהבי אקסטרים ופעילויות בטבע', en: 'Adventure-sports and outdoor lovers' } },
      { name: { he: 'הרדנגר (אודה ולופטהוס)', en: 'Hardanger (Odda & Lofthus)' }, forWhom: { he: 'מטיילים בדרך לטרולטונגה', en: 'Hikers heading to Trolltunga' } }
    ],
    attractions: [
      { name: { he: 'בריגן', en: 'Bryggen' }, area: 'Bergen', kind: 'landmark', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'רכבל פלויבאנן והר פלויין', en: 'Fløibanen funicular & Mount Fløyen' }, area: 'Bergen', kind: 'viewpoint', durationH: 2, tags: ['family'] },
      { name: { he: 'שוק הדגים של ברגן', en: 'Bergen Fish Market' }, area: 'Bergen', kind: 'market', durationH: 1, tags: ['food'] },
      { name: { he: 'הר אולריקן', en: 'Mount Ulriken' }, area: 'Bergen', kind: 'viewpoint', durationH: 3, tags: ['adventure', 'nature'] },
      { name: { he: 'טרולדהאוגן — ביתו של גריג', en: 'Troldhaugen — Grieg’s home' }, area: 'Bergen', kind: 'museum', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'רכבת פלאם', en: 'Flåm Railway' }, area: 'Flåm & Aurland', kind: 'experience', durationH: 2, tags: ['family', 'nature'] },
      { name: { he: 'שייט בנרויפיורד', en: 'Nærøyfjord cruise' }, area: 'Flåm & Aurland', kind: 'experience', durationH: 2, tags: ['nature', 'couple'] },
      { name: { he: 'תצפית סטגאשטיין', en: 'Stegastein viewpoint' }, area: 'Flåm & Aurland', kind: 'viewpoint', durationH: 1, tags: ['nature'] },
      { name: { he: 'כנסיית העץ בבורגונד', en: 'Borgund Stave Church' }, kind: 'religious', durationH: 1, tags: ['culture'] },
      { name: { he: 'מפל ורינגספוסן', en: 'Vøringsfossen waterfall' }, area: 'Hardanger (Odda & Lofthus)', kind: 'nature', durationH: 1, tags: ['nature'] },
      { name: { he: 'טרולטונגה', en: 'Trolltunga' }, area: 'Hardanger (Odda & Lofthus)', kind: 'nature', durationH: 10, tags: ['adventure'] },
      { name: { he: 'פרייקסטולן', en: 'Preikestolen (Pulpit Rock)' }, kind: 'nature', durationH: 4, tags: ['adventure', 'nature'] },
      { name: { he: 'שייט בגיירנגרפיורד', en: 'Geirangerfjord cruise' }, kind: 'experience', durationH: 1.5, tags: ['nature', 'couple'] }
    ],
    dayTrips: [
      { name: { he: 'נורווגיה על קצה המזלג — פלאם', en: 'Norway in a Nutshell — Flåm' }, hours: 3, note: { he: 'לולאה של רכבת, רכבת פלאם, שייט ואוטובוס דרך ווס ומירדל — יום שלם', en: 'A loop of train, the Flåm Railway, a boat and a bus via Voss and Myrdal — a full day' } },
      { name: { he: 'ווס', en: 'Voss' }, hours: 1.5, note: { he: 'ברכבת מברגן — אגם, מפלים ופעילויות אקסטרים', en: 'By train from Bergen — a lake, waterfalls and adventure sports' } },
      { name: { he: 'הרדנגרפיורד', en: 'The Hardangerfjord' }, hours: 1.5, note: { he: 'מפלים, מטעי תפוחים וכפרים על המים', en: 'Waterfalls, apple orchards and waterside villages' } }
    ],
    transport: { carRecommended: true, note: { he: 'רכבות ומעבורות מכסות את המסלולים המרכזיים, אבל רכב נותן הכי הרבה חופש. הדרכים צרות, עם מנהרות ארוכות, מעבורות ואגרות. מעברי הרים מסוימים סגורים בחורף.', en: 'Trains and ferries cover the main routes, but a car gives the most freedom. Roads are narrow, with long tunnels, ferries and tolls. Some mountain passes close in winter.' } },
    practical: {
      currency: 'NOK', language: { he: 'נורווגית; אנגלית שוטפת כמעט אצל כולם', en: 'Norwegian; almost everyone speaks fluent English' }, timeZone: 'Europe/Oslo',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'באוסלו יש קהילה קטנה ובית חב״ד; בברגן ובפיורדים אין היצע כשר — כדאי להביא או לתאם אוכל ארוז.', en: 'Oslo has a small community and a Chabad house; in Bergen and the fjords there is no kosher supply — bring or arrange packed food.' },
      shabbat: { he: 'בית כנסת וחב״ד באוסלו; בפיורדים צריך לתכנן לבד. בקיץ השבת יוצאת מאוחר מאוד בלילה — כדאי לבדוק זמנים מראש.', en: 'A synagogue and Chabad in Oslo; in the fjords you will need to plan on your own. In summer Shabbat ends very late at night — check the times in advance.' }
    },
    seasonsNote: { he: 'מאי–ספטמבר הכי טובים; יוני–אוגוסט עם ימים ארוכים מאוד ויותר תיירים. בברגן יורד גשם רוב השנה — כדאי לארוז מעיל גשם. בחורף חלק מהדרכים והשירותים סגורים, וטרולטונגה רק עם מדריך.', en: 'May–September is best; June–August has very long days and more visitors. Bergen gets rain much of the year — pack a rain jacket. In winter some roads and services close, and Trolltunga is guided-only.' }
  },
  {
    id: 'copenhagen', code: 'CPH', airports: ['CPH'],
    name: { he: 'קופנהגן', en: 'Copenhagen' }, country: { he: 'דנמרק', en: 'Denmark' }, region: 'europe',
    tags: ['city', 'culture', 'food', 'couple', 'family'],
    bestMonths: [5, 6, 7, 8, 9, 12], flightHours: 6, direct: false, budgetLevel: 4, dailyBudgetIls: { low: 250, mid: 420, high: 800 },
    summary: { he: 'בירת העיצוב הסקנדינבי: תעלות צבעוניות, אופניים בכל מקום, גני טיבולי וסצנת אוכל מהטובות באירופה. נעימה ובטוחה, טובה לזוגות ולמשפחות — אבל יקרה.', en: 'The capital of Scandinavian design: colourful canals, bikes everywhere, Tivoli Gardens and one of Europe’s best food scenes. Pleasant and safe, good for couples and families — but pricey.' },
    highlights: [
      { he: 'נמל נייהאבן והבתים הצבעוניים', en: 'Nyhavn harbour and its colourful houses' },
      { he: 'גני טיבולי', en: 'Tivoli Gardens' },
      { he: 'רכיבה על אופניים ברחבי העיר', en: 'Cycling around the city' },
      { he: 'אוכל נורדי חדש ושווקי אוכל', en: 'New Nordic cuisine and food markets' },
      { he: 'ארמון רוזנבורג ותכשיטי הכתר', en: 'Rosenborg Castle and the crown jewels' },
      { he: 'רחצה במים הפתוחים של הנמל בקיץ', en: 'Swimming in the harbour baths in summer' }
    ],
    areas: [
      { name: { he: 'המרכז (אינדרה בי)', en: 'Indre By (city centre)' }, forWhom: { he: 'ביקור ראשון — הכול ברגל', en: 'First-timers — everything on foot' } },
      { name: { he: 'וסטרברו', en: 'Vesterbro' }, forWhom: { he: 'אוכל וחיי לילה, ליד טיבולי והתחנה המרכזית', en: 'Food and nightlife, near Tivoli and the central station' } },
      { name: { he: 'נרברו', en: 'Nørrebro' }, forWhom: { he: 'צעירים — בתי קפה ואווירה שכונתית', en: 'Younger travellers — cafés and a local feel' } },
      { name: { he: 'כריסטיאנסהאבן', en: 'Christianshavn' }, forWhom: { he: 'זוגות — תעלות ושקט יחסי', en: 'Couples — canals and relative quiet' } },
      { name: { he: 'אוסטרברו', en: 'Østerbro' }, forWhom: { he: 'משפחות — פארקים ושכונה רגועה', en: 'Families — parks and a calm neighbourhood' } }
    ],
    attractions: [
      { name: { he: 'נייהאבן', en: 'Nyhavn' }, area: 'Indre By (city centre)', kind: 'neighborhood', durationH: 1, tags: ['couple', 'food'] },
      { name: { he: 'גני טיבולי', en: 'Tivoli Gardens' }, area: 'Vesterbro', kind: 'park', durationH: 4, tags: ['family', 'with_children'] },
      { name: { he: 'ארמון רוזנבורג', en: 'Rosenborg Castle' }, area: 'Indre By (city centre)', kind: 'landmark', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'ארמון אמליינבורג וחילופי המשמרות', en: 'Amalienborg Palace & Changing of the Guard' }, area: 'Indre By (city centre)', kind: 'landmark', durationH: 1, tags: ['culture', 'family'] },
      { name: { he: 'ארמון כריסטיאנסבורג', en: 'Christiansborg Palace' }, area: 'Indre By (city centre)', kind: 'landmark', durationH: 2, tags: ['culture'] },
      { name: { he: 'בת הים הקטנה', en: 'The Little Mermaid' }, area: 'Østerbro', kind: 'landmark', durationH: 0.5, tags: [] },
      { name: { he: 'המגדל העגול', en: 'The Round Tower' }, area: 'Indre By (city centre)', kind: 'viewpoint', durationH: 1, tags: ['family'] },
      { name: { he: 'צריח כנסיית המושיע', en: 'Church of Our Saviour spire' }, area: 'Christianshavn', kind: 'viewpoint', durationH: 1, tags: ['couple'] },
      { name: { he: 'שוק טורבהאלרנה', en: 'Torvehallerne market' }, area: 'Indre By (city centre)', kind: 'market', durationH: 1, tags: ['food'] },
      { name: { he: 'שוק האוכל רפן', en: 'Reffen street food market' }, kind: 'market', durationH: 2, tags: ['food'] },
      { name: { he: 'גליפטוטק ני קרלסברג', en: 'Ny Carlsberg Glyptotek' }, area: 'Indre By (city centre)', kind: 'museum', durationH: 2, tags: ['culture'] },
      { name: { he: 'המוזיאון הלאומי של דנמרק', en: 'National Museum of Denmark' }, area: 'Indre By (city centre)', kind: 'museum', durationH: 2, tags: ['culture', 'family'] },
      { name: { he: 'המוזיאון היהודי הדני', en: 'Danish Jewish Museum' }, area: 'Indre By (city centre)', kind: 'museum', durationH: 1, tags: ['culture'] }
    ],
    dayTrips: [
      { name: { he: 'טירת קרונבורג בהלסינגור', en: 'Kronborg Castle, Helsingør' }, hours: 0.75, note: { he: 'הטירה של ״המלט״, ברכבת לאורך החוף', en: 'Hamlet’s castle, by train along the coast' } },
      { name: { he: 'מוזיאון לואיזיאנה לאמנות מודרנית', en: 'Louisiana Museum of Modern Art' }, hours: 0.6, note: { he: 'מוזיאון מרהיב על שפת הים בהומלבק', en: 'A stunning seaside museum in Humlebæk' } },
      { name: { he: 'מאלמו', en: 'Malmö' }, hours: 0.6, note: { he: 'ברכבת מעל גשר אורסונד לשוודיה', en: 'By train over the Øresund Bridge to Sweden' } },
      { name: { he: 'מוזיאון ספינות הוויקינגים ברוסקילדה', en: 'Viking Ship Museum, Roskilde' }, hours: 0.5, note: { he: 'ספינות ויקינגיות מקוריות וקתדרלה עתיקה', en: 'Original Viking ships and an old cathedral' } }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו מהשדה למרכז תוך כרבע שעה, ובעיר מטרו, אוטובוסים ואופניים — העיר שטוחה ונוחה מאוד לרכיבה. אין צורך ברכב.', en: 'The metro reaches the centre from the airport in about 15 minutes; in town use the metro, buses and bikes — the city is flat and very bike-friendly. No need for a car.' } },
    practical: {
      currency: 'DKK', language: { he: 'דנית; אנגלית שוטפת כמעט אצל כולם', en: 'Danish; almost everyone speaks fluent English' }, timeZone: 'Europe/Copenhagen',
      visaNoteForIsraelis: { he: 'בדרך כלל אין צורך בוויזה לביקור קצר באזור שנגן; יש לבדוק את דרישות הכניסה העדכניות (כולל ETIAS) במקורות הרשמיים.', en: 'Usually no visa is needed for a short Schengen visit; check current entry rules (including ETIAS) with official sources.' },
      kosher: { he: 'קהילה יהודית קטנה ובית חב״ד; ההיצע הכשר מצומצם — כדאי לתאם ארוחות מראש.', en: 'A small Jewish community and a Chabad house; kosher supply is limited — arrange meals in advance.' },
      shabbat: { he: 'בית הכנסת הגדול נמצא במרכז העיר; לינה באינדרה בי מאפשרת להגיע ברגל. בקיץ השבת יוצאת מאוחר.', en: 'The Great Synagogue is in the city centre; staying in Indre By keeps it within walking distance. In summer Shabbat ends late.' }
    },
    seasonsNote: { he: 'מאי–ספטמבר הכי נעימים, עם ימים ארוכים וחיים בחוץ. בדצמבר טיבולי ושווקי חג המולד פתוחים; שאר החורף קר, חשוך ורטוב.', en: 'May–September is most pleasant, with long days and outdoor life. In December Tivoli and the Christmas markets are open; the rest of winter is cold, dark and wet.' }
  }
];
