// Practical brochure info per country (spec 29). Stable facts only; weather = typical averages.
// Keyed by the exact `country.en` string used in dist/catalog.mjs destinations.
// Phrases: `local` is a Latin-script romanisation (so it can be read aloud); `say` is a Hebrew transliteration.
// Emergency numbers were checked against government travel pages (gov.uk / travel.gc.ca / travel.state.gov / national tourism sites), 2026-11.
// Weather: typical monthly average daily high/low in °C (approx., rounded) for the city named in each entry’s comment.

// ---------- helpers (build plain data; output shape is identical for every country) ----------
const EUROPLUG_OK = ['C', 'E', 'F', 'J', 'K', 'L', 'N'];
const plug = (types, volts, extraHe = '', extraEn = '') => {
  const euro = types.some((t) => EUROPLUG_OK.includes(t));
  const lowV = volts < 200;
  let he = euro
    ? 'תקע ישראלי דו-פיני עגול (C) מתאים לשקע; לתקע ישראלי תלת-פיני (H) נדרש מתאם.'
    : `נדרש מתאם: השקעים מסוג ${types.join('/')} ולא מתאימים לתקעים ישראליים (C/H).`;
  let en = euro
    ? 'Israeli two-pin round plugs (type C) fit; Israeli three-pin plugs (type H) need an adapter.'
    : `Adapter needed: sockets are type ${types.join('/')}, which do not take Israeli plugs (C/H).`;
  if (lowV) {
    he += ` המתח ${volts}V – בדקו שהמכשיר תומך 100–240V (רוב המטענים כן; מייבש שיער ומחליק לא תמיד).`;
    en += ` Voltage is ${volts}V – check devices are rated 100–240V (most chargers are; hair dryers/straighteners often not).`;
  }
  if (extraHe) he += ' ' + extraHe;
  if (extraEn) en += ' ' + extraEn;
  return { types, volts, he, en };
};
const RIGHT = { he: 'נוהגים בצד ימין', en: 'Drive on the right' };
const LEFT = { he: 'נוהגים בצד שמאל (ההגה מימין)', en: 'Drive on the left (right-hand drive)' };
const W_SAFE = { he: 'מי ברז ראויים לשתייה', en: 'Tap water is safe to drink' };
const W_CITIES = { he: 'מי ברז ראויים לשתייה ברוב הערים', en: 'Tap water is safe to drink in most towns and cities' };
const W_BOTTLED = { he: 'לא מומלץ לשתות מי ברז – שתו מים בבקבוק', en: 'Do not drink tap water – use bottled water' };
const wx = (rows) => Object.fromEntries(rows.map(([hi, lo], i) => [i + 1, { hi, lo }]));
const PHRASE_HE = ['שלום', 'תודה', 'בבקשה', 'סליחה', 'כמה זה עולה?', 'את החשבון, בבקשה', 'איפה נמצא...?', 'להתראות'];
const ph = (pairs) => pairs.map(([local, say], i) => ({ he: PHRASE_HE[i], local, say }));
const em = (general, police = '', ambulance = '', fire = '') => ({ general, police, ambulance, fire });

// ---------- phrase sets (hello, thank you, please, excuse me, how much?, the bill please, where is…?, goodbye) ----------
const GREEK = ph([['Yia sas', 'יאסאס'], ['Efcharistó', 'אפחריסטו'], ['Parakaló', 'פרקאלו'], ['Signómi', 'סיגנומי'], ['Póso káni?', 'פוסו קאני?'], ['To logariasmó, parakaló', 'טו לוגריאזמו, פרקאלו'], ['Pou íne...?', 'פו אינה...?'], ['Adío', 'אדיו']]);
const ITALIAN = ph([['Buongiorno / Ciao', 'בונג׳ורנו / צ׳או'], ['Grazie', 'גרציה'], ['Per favore', 'פר פבורה'], ['Mi scusi', 'מי סקוזי'], ['Quanto costa?', 'קוואנטו קוסטה?'], ['Il conto, per favore', 'איל קונטו, פר פבורה'], ['Dov’è...?', 'דובה...?'], ['Arrivederci', 'אריוודרצ׳י']]);
const ARABIC = ph([['Marhaba', 'מרחבא'], ['Shukran', 'שוכראן'], ['Min fadlak', 'מין פדלכ'], ['Law samaht', 'לאו סמחת'], ['Bikam hatha?', 'ביכם האדא?'], ['Al-hisab, law samaht', 'אל-חסאב, לאו סמחת'], ['Wein...?', 'ויין...?'], ['Ma’a as-salama', 'מע א-סלאמה']]);
const FRENCH = ph([['Bonjour', 'בונז׳ור'], ['Merci', 'מרסי'], ['S’il vous plaît', 'סיל וו פלה'], ['Excusez-moi', 'אקסקוזה מואה'], ['C’est combien ?', 'סה קומביין?'], ['L’addition, s’il vous plaît', 'לדיסיון, סיל וו פלה'], ['Où est... ?', 'או אה...?'], ['Au revoir', 'או רבואר']]);
const ENGLISH_UK = ph([['Hello', 'הלו'], ['Thank you', 'ת׳נק יו'], ['Please', 'פליז'], ['Excuse me', 'אקסקיוז מי'], ['How much is it?', 'האו מאץ׳ איז איט?'], ['The bill, please', 'דה ביל, פליז'], ['Where is...?', 'וור איז...?'], ['Goodbye', 'גודביי']]);
const ENGLISH_US = ph([['Hello', 'הלו'], ['Thank you', 'ת׳נק יו'], ['Please', 'פליז'], ['Excuse me', 'אקסקיוז מי'], ['How much is it?', 'האו מאץ׳ איז איט?'], ['The check, please', 'דה צ׳ק, פליז'], ['Where is...?', 'וור איז...?'], ['Goodbye', 'גודביי']]);
const SPANISH = ph([['Hola', 'אולה'], ['Gracias', 'גרסיאס'], ['Por favor', 'פור פבור'], ['Disculpe', 'דיסקולפה'], ['¿Cuánto cuesta?', 'קואנטו קואסטה?'], ['La cuenta, por favor', 'לה קואנטה, פור פבור'], ['¿Dónde está...?', 'דונדה אסטה...?'], ['Adiós', 'אדיוס']]);
const HUNGARIAN = ph([['Jó napot', 'יו נאפוט'], ['Köszönöm', 'קסנם'], ['Kérem', 'קרם'], ['Elnézést', 'אלנזשט'], ['Mennyibe kerül?', 'מניבה קרול?'], ['A számlát, kérem', 'א סאמלאט, קרם'], ['Hol van...?', 'הול ון...?'], ['Viszontlátásra', 'ויסונטלאטאשרה']]);
const CZECH = ph([['Dobrý den', 'דוברי דן'], ['Děkuji', 'דייקויי'], ['Prosím', 'פרוסים'], ['Promiňte', 'פרומיניטה'], ['Kolik to stojí?', 'קוליק טו סטויי?'], ['Účet, prosím', 'אוצ׳ט, פרוסים'], ['Kde je...?', 'גדה יה...?'], ['Na shledanou', 'נה סחלדנו']]);
const GEORGIAN = ph([['Gamarjoba', 'גמרג׳ובה'], ['Madloba', 'מדלובה'], ['Tu sheidzleba', 'תו שיידזלבה'], ['Bodishi', 'בודישי'], ['Ra ghirs?', 'רה ע׳ירס?'], ['Angarishi, tu sheidzleba', 'אנגרישי, תו שיידזלבה'], ['Sad aris...?', 'סאד אריס...?'], ['Nakhvamdis', 'נחוומדיס']]);
const THAI = ph([['Sawasdee (kha/krap)', 'סוואדי (קא/קראפ)'], ['Khop khun', 'קופ קון'], ['Karuna', 'קרונה'], ['Kho thot', 'קו טוט'], ['Tao rai?', 'טאו ראי?'], ['Check bin', 'צ׳ק בין'], ['...yoo tee nai?', '...יו טי נאי?'], ['La gon', 'לה גון']]);
const DUTCH = ph([['Hallo', 'האלו'], ['Dank u wel', 'דנק או ול'], ['Alstublieft', 'אלסטובליפט'], ['Pardon', 'פרדון'], ['Hoeveel kost het?', 'הופל קוסט הט?'], ['De rekening, alstublieft', 'דה רקנינג, אלסטובליפט'], ['Waar is...?', 'וואר איס...?'], ['Tot ziens', 'טוט זינס']]);
const germanWith = (hello, helloSay) => ph([[hello, helloSay], ['Danke', 'דנקה'], ['Bitte', 'ביטה'], ['Entschuldigung', 'אנטשולדיגונג'], ['Wie viel kostet das?', 'וי פיל קוסטט דאס?'], ['Die Rechnung, bitte', 'די רכנונג, ביטה'], ['Wo ist...?', 'וו איסט...?'], ['Auf Wiedersehen', 'אוף וידרזן']]);
const PORTUGUESE_PT = ph([['Olá', 'אולה'], ['Obrigado / Obrigada', 'אובריגדו / אובריגדה'], ['Por favor', 'פור פבור'], ['Com licença', 'קום ליסנסה'], ['Quanto custa?', 'קוואנטו קושטה?'], ['A conta, por favor', 'א קונטה, פור פבור'], ['Onde fica...?', 'אונד פיקה...?'], ['Adeus', 'אדאוש']]);
const PORTUGUESE_BR = ph([['Olá / Oi', 'אולה / אוי'], ['Obrigado / Obrigada', 'אובריגדו / אובריגדה'], ['Por favor', 'פור פבור'], ['Com licença', 'קום ליסנסה'], ['Quanto custa?', 'קוואנטו קוסטה?'], ['A conta, por favor', 'א קונטה, פור פבור'], ['Onde fica...?', 'אונג׳י פיקה...?'], ['Tchau', 'צ׳או']]);
const CROATIAN = ph([['Dobar dan', 'דובר דן'], ['Hvala', 'חוואלה'], ['Molim', 'מולים'], ['Oprostite', 'אופרוסטיטה'], ['Koliko košta?', 'קוליקו קושטה?'], ['Račun, molim', 'ראצ׳ון, מולים'], ['Gdje je...?', 'גדיה יה...?'], ['Doviđenja', 'דוביג׳ניה']]);
const MONTENEGRIN = ph([['Dobar dan', 'דובר דן'], ['Hvala', 'חוואלה'], ['Molim', 'מולים'], ['Izvinite', 'איזבינטה'], ['Koliko košta?', 'קוליקו קושטה?'], ['Račun, molim', 'ראצ׳ון, מולים'], ['Gdje je...?', 'גדיה יה...?'], ['Doviđenja', 'דוביג׳ניה']]);
const BULGARIAN = ph([['Zdraveyte', 'זדרווייטה'], ['Blagodarya', 'בלגודריה'], ['Molya', 'מוליה'], ['Izvinete', 'איזבינטה'], ['Kolko struva?', 'קולקו סטרובה?'], ['Smetkata, molya', 'סמטקטה, מוליה'], ['Kade e...?', 'קדה א...?'], ['Dovizhdane', 'דוביז׳דנה']]);
const POLISH = ph([['Dzień dobry', 'ג׳ן דוברי'], ['Dziękuję', 'ג׳נקויה'], ['Proszę', 'פרושה'], ['Przepraszam', 'פשפראשאם'], ['Ile to kosztuje?', 'אילה טו קושטויה?'], ['Poproszę rachunek', 'פופרושה רחונק'], ['Gdzie jest...?', 'גג׳ה יסט...?'], ['Do widzenia', 'דו וידזניה']]);
const SLOVENIAN = ph([['Dober dan', 'דובר דן'], ['Hvala', 'חוואלה'], ['Prosim', 'פרוסים'], ['Oprostite', 'אופרוסטיטה'], ['Koliko stane?', 'קוליקו סטנה?'], ['Račun, prosim', 'ראצ׳ון, פרוסים'], ['Kje je...?', 'קיה יה...?'], ['Nasvidenje', 'נסווידניה']]);
const TURKISH = ph([['Merhaba', 'מרחבה'], ['Teşekkür ederim', 'טשקור אדרים'], ['Lütfen', 'לוטפן'], ['Affedersiniz', 'אפדרסיניז'], ['Ne kadar?', 'נה קדר?'], ['Hesap, lütfen', 'הסאפ, לוטפן'], ['...nerede?', '...נרדה?'], ['Hoşça kalın', 'הושצ׳ה קאלין']]);
const DARIJA = ph([['Salam', 'סלאם'], ['Shukran', 'שוכראן'], ['Afak', 'עאפאכ'], ['Smeh liya', 'סמח לייה'], ['Bshhal?', 'בשחאל?'], ['L-hsab, afak', 'לחסאב, עאפאכ'], ['Fin...?', 'פין...?'], ['Bslama', 'בסלאמה']]);
const JAPANESE = ph([['Konnichiwa', 'קוניצ׳יווה'], ['Arigatō gozaimasu', 'אריגטו גוזאימס'], ['Onegaishimasu', 'אונגאישימס'], ['Sumimasen', 'סומימסן'], ['Ikura desu ka?', 'איקורה דס קה?'], ['Okaikei onegaishimasu', 'אוקאיקיי אונגאישימס'], ['...wa doko desu ka?', '...וה דוקו דס קה?'], ['Sayōnara', 'סאיונרה']]);
const VIETNAMESE = ph([['Xin chào', 'סין צ׳או'], ['Cảm ơn', 'קאם און'], ['Làm ơn', 'לאם און'], ['Xin lỗi', 'סין לוי'], ['Bao nhiêu tiền?', 'באו ניו טיין?'], ['Tính tiền', 'טין טיין'], ['...ở đâu?', '...או דאו?'], ['Tạm biệt', 'טאם ביית']]);
const SINHALA = ph([['Ayubowan', 'איובואן'], ['Istuti', 'איסטוטי'], ['Karunakarala', 'קרונאקרלה'], ['Samavenna', 'סמאוונה'], ['Keeyada?', 'קיאדה?'], ['Bill eka denna', 'ביל אקה דנה'], ['...koheda?', '...קוהדה?'], ['Gihin ennam', 'גיהין אנאם']]);
const HINDI = ph([['Namaste', 'נמסטה'], ['Dhanyavaad', 'דניוואד'], ['Kripya', 'קריפיה'], ['Maaf kijiye', 'מאף קיג׳יה'], ['Kitne ka hai?', 'קיתנה קה היי?'], ['Bill de dijiye', 'ביל דה דיג׳יה'], ['...kahan hai?', '...קהאן היי?'], ['Phir milenge', 'פיר מילנגה']]);
const INDONESIAN = ph([['Halo / Selamat pagi', 'האלו / סלמאת פאגי'], ['Terima kasih', 'טרימה קסיה'], ['Tolong', 'טולונג'], ['Permisi', 'פרמיסי'], ['Berapa harganya?', 'ברפה הרגניה?'], ['Minta bon', 'מינטה בון'], ['...di mana?', '...די מאנה?'], ['Sampai jumpa', 'סמפאי ג׳ומפה']]);
const SWAHILI = ph([['Jambo', 'ג׳מבו'], ['Asante sana', 'אסנטה סנה'], ['Tafadhali', 'תפדהאלי'], ['Samahani', 'סמהאני'], ['Bei gani?', 'ביי גאני?'], ['Naomba bili', 'נאומבה בילי'], ['...iko wapi?', '...איקו ואפי?'], ['Kwaheri', 'קוואהרי']]);
const ICELANDIC = ph([['Halló / Góðan dag', 'האלו / גואת׳אן דאג'], ['Takk fyrir', 'טאק פיריר'], ['Vinsamlegast', 'וינסאמלגאסט'], ['Afsakið', 'אפסאקית׳'], ['Hvað kostar þetta?', 'קוואת׳ קוסטאר ת׳טה?'], ['Reikninginn, takk', 'רייקנינגין, טאק'], ['Hvar er...?', 'קוואר אר...?'], ['Bless', 'בלס']]);
const NORWEGIAN = ph([['Hei', 'היי'], ['Takk', 'טאק'], ['Vær så snill', 'וער שו סניל'], ['Unnskyld', 'אונשיל'], ['Hva koster det?', 'וא קוסטר דה?'], ['Kan jeg få regningen?', 'קאן יי פו ריינינגן?'], ['Hvor er...?', 'וור אר...?'], ['Ha det', 'הא דה']]);
const DANISH = ph([['Hej', 'היי'], ['Tak', 'טאק'], ['Vær så venlig', 'ור סו וונלי'], ['Undskyld', 'אונסקול'], ['Hvad koster det?', 'וה קוסטר דה?'], ['Må jeg bede om regningen?', 'מו יי בה אום ריינינגן?'], ['Hvor er...?', 'וור אר...?'], ['Farvel', 'פרוול']]);

// ---------- countries ----------
export default {
  'Greece': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'לא חובה; נהוג לעגל או להשאיר 5–10% במסעדה על שירות טוב.', en: 'Not obligatory; round up or leave 5–10% in restaurants for good service.' },
    emergency: em('112', '100', '166', '199'),
    phrases: GREEK,
    weather: wx([[13, 7], [14, 7], [16, 9], [20, 12], [25, 16], [30, 20], [33, 23], [33, 23], [29, 19], [24, 15], [19, 11], [15, 8]]), // Athens
    driving: RIGHT,
    water: { he: 'מי ברז ראויים לשתייה באתונה וביבשה; באיים רבים עדיף מים בבקבוק', en: 'Tap water is safe in Athens and on the mainland; on many islands use bottled water' },
  },
  'Cyprus': {
    plug: plug(['G'], 230),
    tipping: { he: 'לעיתים כלול דמי שירות 10%; אם לא – נהוג 5–10%.', en: 'A 10% service charge is often included; if not, 5–10% is customary.' },
    emergency: em('112', '112', '112', '112'), // 199 also works
    phrases: GREEK,
    weather: wx([[17, 7], [17, 7], [19, 9], [23, 12], [27, 16], [31, 20], [33, 23], [33, 23], [31, 21], [27, 17], [22, 12], [18, 9]]), // Limassol / Larnaca
    driving: LEFT,
    water: { he: 'מי ברז ראויים לשתייה (מותפלים); רבים מעדיפים מים בבקבוק בגלל הטעם', en: 'Tap water is safe (desalinated); many prefer bottled for the taste' },
  },
  'Italy': {
    plug: plug(['C', 'F', 'L'], 230),
    tipping: { he: 'לא נהוג טיפ גבוה; בחשבון לרוב יש coperto (דמי שולחן). עיגול או 1–2 אירו על שירות טוב.', en: 'Big tips are not expected; bills often include a coperto (cover charge). Round up or leave €1–2 for good service.' },
    emergency: em('112', '113', '118', '115'),
    phrases: ITALIAN,
    weather: wx([[12, 3], [13, 4], [16, 6], [19, 8], [23, 12], [28, 16], [31, 18], [31, 18], [27, 15], [22, 11], [16, 7], [13, 4]]), // Rome
    driving: RIGHT,
    water: W_SAFE,
  },
  'United Arab Emirates': {
    plug: plug(['G', 'C', 'D'], 230, 'רוב השקעים מסוג G (בריטי).', 'Most sockets are type G (British).'),
    tipping: { he: 'אם אין דמי שירות בחשבון – נהוג 10–15% במסעדות.', en: 'If no service charge is included, 10–15% is customary in restaurants.' },
    emergency: em('999', '999', '998', '997'),
    phrases: ARABIC,
    weather: wx([[24, 15], [25, 16], [28, 18], [33, 21], [38, 25], [40, 28], [41, 30], [41, 30], [39, 27], [35, 23], [30, 19], [26, 16]]), // Dubai
    driving: RIGHT,
    water: { he: 'מי הברז מותפלים ובטוחים, אך מקובל לשתות מים בבקבוק', en: 'Tap water is desalinated and safe, but bottled water is the norm' },
  },
  'France': {
    plug: plug(['C', 'E'], 230),
    tipping: { he: 'השירות כלול במחיר (service compris); נהוג לעגל או להשאיר כמה אירו.', en: 'Service is included (service compris); round up or leave a few euros.' },
    emergency: em('112', '17', '15', '18'),
    phrases: FRENCH,
    weather: wx([[7, 3], [8, 3], [12, 5], [16, 7], [20, 11], [23, 14], [25, 16], [25, 16], [21, 13], [16, 10], [11, 6], [8, 3]]), // Paris
    driving: RIGHT,
    water: W_SAFE,
  },
  'United Kingdom': {
    plug: plug(['G'], 230),
    tipping: { he: 'במסעדות 10–12.5% (לעיתים כבר כלול כ-service charge); בפאבים לא נהוג.', en: 'Restaurants 10–12.5% (often already added as a service charge); not expected in pubs.' },
    emergency: em('999', '999', '999', '999'), // 112 also works
    phrases: ENGLISH_UK,
    weather: wx([[8, 3], [9, 3], [12, 4], [15, 6], [18, 9], [21, 12], [24, 14], [23, 14], [20, 12], [16, 9], [11, 5], [9, 3]]), // London
    driving: LEFT,
    water: W_SAFE,
  },
  'Spain': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'לא חובה; נהוג לעגל או 5–10% במסעדה.', en: 'Not obligatory; round up or leave 5–10% in restaurants.' },
    emergency: em('112', '091', '061', '080'), // ambulance/fire local numbers vary by region – 112 always works
    phrases: SPANISH,
    weather: wx([[14, 5], [15, 6], [17, 8], [19, 10], [22, 14], [26, 18], [29, 21], [29, 21], [26, 18], [22, 14], [17, 9], [15, 6]]), // Barcelona
    driving: RIGHT,
    water: W_CITIES,
  },
  'Hungary': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'נהוג 10–15%; בדקו אם כבר נוסף דמי שירות לחשבון.', en: '10–15% is customary; check whether a service charge is already on the bill.' },
    emergency: em('112', '107', '104', '105'),
    phrases: HUNGARIAN,
    weather: wx([[2, -3], [5, -2], [11, 2], [17, 6], [22, 11], [25, 14], [27, 16], [27, 15], [22, 11], [16, 6], [8, 2], [3, -2]]), // Budapest
    driving: RIGHT,
    water: W_SAFE,
  },
  'Czech Republic': {
    plug: plug(['C', 'E'], 230),
    tipping: { he: 'נהוג לעגל או להשאיר כ-10% במסעדה.', en: 'Round up or leave about 10% in restaurants.' },
    emergency: em('112', '158', '155', '150'),
    phrases: CZECH,
    weather: wx([[1, -4], [3, -3], [8, 0], [14, 4], [19, 8], [22, 11], [24, 13], [24, 13], [19, 9], [13, 5], [6, 1], [2, -2]]), // Prague
    driving: RIGHT,
    water: W_SAFE,
  },
  'Georgia': {
    plug: plug(['C', 'F'], 220),
    tipping: { he: 'במסעדות רבות כבר נוסף דמי שירות 10–18%; אם לא – נהוג כ-10%.', en: 'Many restaurants add a 10–18% service charge; if not, about 10% is customary.' },
    emergency: em('112', '112', '112', '112'),
    phrases: GEORGIAN,
    weather: wx([[7, -1], [9, 0], [14, 4], [19, 8], [24, 13], [28, 17], [31, 20], [31, 19], [26, 15], [20, 10], [13, 4], [8, 0]]), // Tbilisi
    driving: RIGHT,
    water: { he: 'מי ברז בטביליסי נחשבים ראויים לשתייה; מחוץ לערים עדיף מים בבקבוק', en: 'Tap water in Tbilisi is generally considered safe; outside cities prefer bottled' },
  },
  'Israel': {
    plug: { types: ['C', 'H', 'M'], volts: 230, he: 'אין צורך במתאם – שקעים ישראליים רגילים.', en: 'No adapter needed – standard Israeli sockets.' },
    tipping: { he: 'במסעדות נהוג 10–15%.', en: '10–15% is customary in restaurants.' },
    emergency: em('112', '100', '101', '102'),
    phrases: [], // Hebrew – no phrase list needed
    weather: wx([[21, 10], [23, 12], [26, 15], [31, 19], [35, 23], [38, 26], [40, 27], [40, 27], [37, 25], [33, 21], [27, 16], [22, 11]]), // Eilat
    driving: RIGHT,
    water: W_SAFE,
  },
  'United States': {
    plug: plug(['A', 'B'], 120),
    tipping: { he: 'טיפ כמעט חובה: 18–22% במסעדות, 15–20% במוניות, 1–2 דולר למשקה בבר.', en: 'Tipping is effectively expected: 18–22% in restaurants, 15–20% for taxis, $1–2 per drink at bars.' },
    emergency: em('911', '911', '911', '911'),
    phrases: ENGLISH_US,
    weather: wx([[4, -3], [6, -2], [10, 2], [17, 7], [22, 12], [27, 18], [29, 21], [29, 20], [25, 16], [18, 10], [12, 5], [6, 0]]), // New York
    driving: RIGHT,
    water: W_CITIES,
  },
  'Thailand': {
    plug: plug(['A', 'B', 'C', 'F', 'O'], 230),
    tipping: { he: 'לא חובה; נהוג להשאיר עודף קטן. במלונות ומסעדות יוקרה לרוב נוסף 10% שירות.', en: 'Not obligatory; leave small change. Upscale hotels and restaurants usually add 10% service.' },
    emergency: em('191', '191', '1669', '199'), // Tourist Police: 1155
    phrases: THAI,
    weather: wx([[32, 22], [33, 24], [34, 25], [35, 26], [34, 26], [33, 26], [33, 25], [33, 25], [32, 25], [32, 24], [32, 23], [32, 21]]), // Bangkok
    driving: LEFT,
    water: W_BOTTLED,
  },
  'Netherlands': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'השירות כלול; נהוג לעגל או 5–10% על שירות טוב.', en: 'Service is included; round up or leave 5–10% for good service.' },
    emergency: em('112', '112', '112', '112'),
    phrases: DUTCH,
    weather: wx([[6, 1], [7, 1], [10, 3], [14, 5], [17, 9], [20, 11], [22, 14], [22, 13], [19, 11], [15, 8], [10, 4], [7, 2]]), // Amsterdam
    driving: RIGHT,
    water: W_SAFE,
  },
  'Austria': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'נהוג לעגל או כ-5–10%; את הטיפ אומרים למלצר בזמן התשלום.', en: 'Round up or about 5–10%; tell the server the total when paying.' },
    emergency: em('112', '133', '144', '122'),
    phrases: germanWith('Grüß Gott / Servus', 'גריס גוט / סרווס'),
    weather: wx([[3, -2], [5, -1], [10, 2], [16, 6], [21, 11], [24, 14], [26, 16], [26, 16], [21, 12], [15, 7], [8, 2], [4, -1]]), // Vienna
    driving: RIGHT,
    water: W_SAFE,
  },
  'Germany': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'נהוג לעגל או 5–10%; את הטיפ אומרים למלצר בזמן התשלום.', en: 'Round up or 5–10%; tell the server the total when paying.' },
    emergency: em('112', '110', '112', '112'),
    phrases: germanWith('Hallo / Guten Tag', 'האלו / גוטן טאג'),
    weather: wx([[3, -2], [5, -2], [9, 1], [15, 5], [19, 9], [22, 12], [24, 14], [24, 14], [19, 10], [14, 6], [8, 2], [4, -1]]), // Berlin
    driving: RIGHT,
    water: W_SAFE,
  },
  'Portugal': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'לא חובה; נהוג לעגל או 5–10% במסעדה.', en: 'Not obligatory; round up or leave 5–10% in restaurants.' },
    emergency: em('112', '112', '112', '112'),
    phrases: PORTUGUESE_PT,
    weather: wx([[15, 8], [16, 9], [19, 10], [20, 12], [23, 14], [27, 17], [29, 18], [29, 18], [27, 17], [23, 15], [18, 11], [15, 9]]), // Lisbon
    driving: RIGHT,
    water: W_SAFE,
  },
  'Croatia': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'נהוג כ-10% במסעדות על שירות טוב.', en: 'About 10% in restaurants for good service.' },
    emergency: em('112', '192', '194', '193'),
    phrases: CROATIAN,
    weather: wx([[12, 6], [13, 6], [15, 8], [18, 11], [22, 15], [27, 19], [30, 22], [30, 22], [26, 18], [21, 14], [17, 10], [13, 7]]), // Dubrovnik
    driving: RIGHT,
    water: W_SAFE,
  },
  'Montenegro': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'נהוג 5–10% במסעדות.', en: '5–10% is customary in restaurants.' },
    emergency: em('112', '122', '124', '123'),
    phrases: MONTENEGRIN,
    weather: wx([[12, 5], [13, 5], [15, 8], [18, 10], [23, 14], [27, 18], [30, 21], [30, 21], [26, 17], [22, 13], [17, 9], [13, 6]]), // Budva / Kotor
    driving: RIGHT,
    water: { he: 'מי ברז בדרך כלל ראויים לשתייה בערים; בעונת הקיץ רבים מעדיפים מים בבקבוק', en: 'Tap water is generally safe in towns; in peak summer many prefer bottled' },
  },
  'Switzerland': {
    plug: plug(['C', 'J'], 230),
    tipping: { he: 'השירות כלול במחיר; נהוג לעגל.', en: 'Service is included; rounding up is customary.' },
    emergency: em('112', '117', '144', '118'),
    phrases: germanWith('Grüezi', 'גריאצי'), // German-speaking Alps (Interlaken/Zermatt); French in the west
    weather: wx([[2, -4], [4, -4], [9, 0], [13, 3], [18, 7], [21, 10], [23, 12], [23, 12], [19, 9], [14, 5], [7, 0], [3, -3]]), // Interlaken (≈570 m)
    driving: RIGHT,
    water: W_SAFE,
  },
  'Bulgaria': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'נהוג כ-10% במסעדות.', en: 'About 10% in restaurants.' },
    emergency: em('112', '112', '112', '112'),
    phrases: BULGARIAN,
    weather: wx([[3, -6], [5, -5], [9, -2], [14, 2], [19, 7], [22, 10], [25, 12], [25, 12], [21, 8], [15, 4], [9, -1], [4, -4]]), // Bansko town (≈930 m); slopes much colder
    driving: RIGHT,
    water: W_CITIES,
  },
  'Maldives': {
    plug: plug(['G', 'D'], 230, 'ברוב אתרי הנופש השקעים מסוג G.', 'Most resorts use type G sockets.'),
    tipping: { he: '10% דמי שירות כלולים בחשבון באתרי הנופש; טיפ נוסף לצוות לפי שיקול דעת.', en: 'A 10% service charge is added at resorts; extra tips for staff are at your discretion.' },
    emergency: em('911', '119', '102', '118'), // 911 = national emergency centre
    phrases: ENGLISH_UK, // English is spoken at all resorts (local language: Dhivehi)
    weather: wx([[30, 26], [31, 26], [31, 27], [32, 27], [31, 27], [31, 26], [30, 26], [30, 26], [30, 25], [30, 25], [30, 25], [30, 25]]), // Malé
    driving: LEFT,
    water: W_BOTTLED,
  },
  'Poland': {
    plug: plug(['C', 'E'], 230),
    tipping: { he: 'נהוג כ-10% במסעדות. שימו לב: לומר dziękuję בזמן מסירת הכסף מתפרש כ"תשאירו את העודף".', en: 'About 10% in restaurants. Note: saying dziękuję while handing over cash means “keep the change”.' },
    emergency: em('112', '997', '999', '998'),
    phrases: POLISH,
    weather: wx([[1, -5], [3, -4], [8, -1], [14, 4], [19, 8], [22, 12], [24, 14], [24, 13], [19, 9], [13, 5], [7, 1], [2, -3]]), // Kraków
    driving: RIGHT,
    water: { he: 'מי ברז ראויים לשתייה מבחינה רשמית; רבים מעדיפים מים בבקבוק', en: 'Tap water is officially safe; many locals prefer bottled' },
  },
  'Spain (Canary Islands)': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'לא חובה; נהוג לעגל או 5–10% במסעדה.', en: 'Not obligatory; round up or leave 5–10% in restaurants.' },
    emergency: em('112', '091', '112', '112'),
    phrases: SPANISH,
    weather: wx([[21, 15], [21, 15], [22, 16], [23, 16], [24, 17], [26, 19], [28, 20], [29, 21], [28, 21], [26, 19], [24, 17], [22, 16]]), // Tenerife coast (Santa Cruz / south)
    driving: RIGHT,
    water: { he: 'מי הברז מותפלים – מומלץ לשתות מים בבקבוק', en: 'Tap water is desalinated – bottled water is recommended for drinking' },
  },
  'Slovenia': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'לא חובה; נהוג לעגל או 5–10% במסעדה.', en: 'Not obligatory; round up or leave 5–10% in restaurants.' },
    emergency: em('112', '113', '112', '112'),
    phrases: SLOVENIAN,
    weather: wx([[3, -4], [6, -3], [11, 1], [16, 5], [21, 9], [25, 13], [27, 15], [27, 14], [21, 10], [16, 6], [9, 1], [4, -3]]), // Ljubljana
    driving: RIGHT,
    water: W_SAFE,
  },
  'Turkey': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'נהוג 5–10% במסעדות; בבתי קפה – עיגול.', en: '5–10% in restaurants; round up in cafés.' },
    emergency: em('112', '112', '112', '112'),
    phrases: TURKISH,
    weather: wx([[9, 3], [9, 3], [12, 4], [16, 8], [21, 12], [26, 17], [28, 20], [29, 20], [25, 17], [20, 13], [15, 9], [11, 5]]), // Istanbul
    driving: RIGHT,
    water: W_BOTTLED,
  },
  'Morocco': {
    plug: plug(['C', 'E'], 220),
    tipping: { he: 'נהוג כ-10% במסעדות, וטיפ קטן למדריכים, סבלים ושומרי חניה.', en: 'About 10% in restaurants, plus small tips for guides, porters and parking attendants.' },
    emergency: em('112', '190', '150', '150'), // 19 / 15 from a landline
    phrases: DARIJA, // Moroccan Arabic; French is widely understood
    weather: wx([[18, 6], [20, 8], [23, 10], [25, 12], [29, 15], [33, 18], [37, 21], [37, 21], [32, 19], [27, 15], [22, 10], [19, 7]]), // Marrakech
    driving: RIGHT,
    water: W_BOTTLED,
  },
  'Japan': {
    plug: plug(['A', 'B'], 100),
    tipping: { he: 'לא נותנים טיפ – זה עלול להתפרש כלא מנומס.', en: 'No tipping – it can be considered impolite.' },
    emergency: em('110', '110', '119', '119'),
    phrases: JAPANESE,
    weather: wx([[10, 1], [10, 2], [14, 5], [19, 10], [23, 15], [26, 19], [30, 23], [31, 24], [27, 21], [22, 15], [17, 9], [12, 4]]), // Tokyo
    driving: LEFT,
    water: W_SAFE,
  },
  'Vietnam': {
    plug: plug(['A', 'C', 'F'], 220),
    tipping: { he: 'לא חובה אך מוערך; עודף קטן במסעדות וטיפ למדריכים ונהגים.', en: 'Not expected but appreciated; small change in restaurants, tips for guides and drivers.' },
    emergency: em('113', '113', '115', '114'),
    phrases: VIETNAMESE,
    weather: wx([[19, 14], [20, 15], [23, 18], [27, 21], [32, 24], [33, 26], [33, 26], [32, 26], [31, 25], [29, 22], [26, 19], [22, 15]]), // Hanoi (south is hot year-round)
    driving: RIGHT,
    water: W_BOTTLED,
  },
  'Sri Lanka': {
    plug: plug(['D', 'G', 'M'], 230),
    tipping: { he: 'במסעדות ובמלונות לרוב נוסף 10% שירות; טיפ לנהגים ולמדריכים מקובל.', en: 'Restaurants and hotels usually add 10% service; tips for drivers and guides are customary.' },
    emergency: em('119', '119', '1990', '110'),
    phrases: SINHALA, // Tamil is also spoken; English is common in tourism
    weather: wx([[31, 22], [31, 23], [31, 24], [31, 25], [31, 26], [30, 26], [30, 25], [30, 25], [30, 25], [30, 24], [30, 23], [30, 23]]), // Colombo
    driving: LEFT,
    water: W_BOTTLED,
  },
  'India': {
    plug: plug(['C', 'D', 'M'], 230),
    tipping: { he: 'נהוג כ-10% במסעדות אם לא נוסף דמי שירות; טיפ קטן לנהגים ולסבלים.', en: 'About 10% in restaurants if no service charge is added; small tips for drivers and porters.' },
    emergency: em('112', '100', '108', '101'),
    phrases: HINDI, // Goa: Konkani is local; Hindi and English are widely understood
    weather: wx([[32, 20], [32, 21], [33, 23], [33, 25], [33, 27], [30, 25], [29, 24], [29, 24], [30, 24], [32, 23], [33, 22], [33, 21]]), // Goa (Panaji)
    driving: LEFT,
    water: W_BOTTLED,
  },
  'Indonesia': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'במסעדות ובמלונות לרוב נוסף שירות ומס; טיפ קטן לנהגים ולמדריכים מקובל.', en: 'Restaurants and hotels usually add service and tax; small tips for drivers and guides are customary.' },
    emergency: em('112', '110', '118', '113'),
    phrases: INDONESIAN,
    weather: wx([[31, 24], [31, 24], [31, 24], [32, 24], [31, 24], [30, 23], [30, 23], [30, 23], [31, 23], [32, 24], [32, 24], [31, 24]]), // Bali (Denpasar)
    driving: LEFT,
    water: W_BOTTLED,
  },
  'Tanzania': {
    plug: plug(['D', 'G'], 230),
    tipping: { he: 'נהוג כ-10% במסעדות; טיפ למדריכים, נהגים וצוות המלון מקובל.', en: 'About 10% in restaurants; tips for guides, drivers and hotel staff are customary.' },
    emergency: em('112', '112', '115', '114'), // public ambulance service is limited – save your hotel’s / insurer’s number
    phrases: SWAHILI,
    weather: wx([[32, 24], [32, 24], [32, 24], [30, 24], [29, 23], [29, 22], [28, 21], [28, 21], [29, 21], [30, 22], [31, 23], [32, 24]]), // Zanzibar (Stone Town)
    driving: LEFT,
    water: W_BOTTLED,
  },
  'Seychelles': {
    plug: plug(['G'], 240),
    tipping: { he: 'במלונות ומסעדות לרוב נוסף דמי שירות; טיפ נוסף לפי שיקול דעת.', en: 'Hotels and restaurants often add a service charge; extra tips are at your discretion.' },
    emergency: em('999', '999', '151', '999'), // 112 also works
    phrases: FRENCH, // Creole, English and French are official
    weather: wx([[29, 24], [30, 25], [31, 25], [31, 26], [30, 26], [29, 25], [28, 24], [28, 24], [29, 24], [29, 25], [30, 24], [29, 24]]), // Mahé (Victoria)
    driving: LEFT,
    water: { he: 'מי הברז במאהה מטופלים, אך מומלץ לשתות מים בבקבוק', en: 'Tap water on Mahé is treated, but bottled water is recommended' },
  },
  'Mauritius': {
    plug: plug(['C', 'G'], 230),
    tipping: { he: 'לא חובה; 5–10% במסעדות על שירות טוב.', en: 'Not obligatory; 5–10% in restaurants for good service.' },
    emergency: em('999', '999', '114', '115'), // 112 also works for police; fire also 995
    phrases: FRENCH, // Mauritian Creole is spoken; French and English are widely understood
    weather: wx([[30, 23], [30, 23], [30, 23], [29, 22], [27, 20], [26, 18], [25, 17], [25, 17], [26, 18], [27, 19], [29, 21], [30, 22]]), // north-west coast (Grand Baie / Port Louis)
    driving: LEFT,
    water: { he: 'מומלץ לשתות מים בבקבוק', en: 'Bottled water is recommended' },
  },
  'South Africa': {
    plug: plug(['M', 'N', 'C', 'D'], 230, 'רוב השקעים מסוג M (תלת-פיני גדול) – מומלץ להביא מתאם.', 'Most sockets are type M (large three-pin) – bring an adapter.'),
    tipping: { he: 'נהוג 10–15% במסעדות, וטיפ קטן לשומרי חניה ולמתדלקים.', en: '10–15% in restaurants, plus small tips for car guards and petrol attendants.' },
    emergency: em('112', '10111', '10177', '10177'),
    phrases: ENGLISH_UK, // English widely used (also Afrikaans, isiXhosa in Cape Town)
    weather: wx([[26, 16], [27, 16], [25, 15], [23, 12], [20, 10], [18, 8], [18, 7], [18, 8], [19, 9], [21, 11], [24, 13], [25, 15]]), // Cape Town (southern hemisphere)
    driving: LEFT,
    water: { he: 'מי ברז ראויים לשתייה בקייפטאון ובערים הגדולות', en: 'Tap water is safe in Cape Town and major cities' },
  },
  'Kenya': {
    plug: plug(['G'], 240),
    tipping: { he: 'נהוג כ-10% במסעדות; בספארי מקובל טיפ יומי לנהג-מדריך ולצוות המחנה.', en: 'About 10% in restaurants; on safari a daily tip for the driver-guide and camp staff is customary.' },
    emergency: em('999', '999', '999', '999'), // 112 also works
    phrases: SWAHILI,
    weather: wx([[25, 12], [27, 12], [26, 14], [24, 15], [23, 14], [22, 12], [21, 11], [22, 11], [25, 11], [25, 13], [23, 14], [23, 13]]), // Nairobi / Mara highlands (≈1,600 m)
    driving: LEFT,
    water: W_BOTTLED,
  },
  'Iceland': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'לא נהוג – השירות כלול במחיר.', en: 'Not expected – service is included.' },
    emergency: em('112', '112', '112', '112'),
    phrases: ICELANDIC,
    weather: wx([[2, -3], [3, -2], [4, -2], [6, 0], [10, 4], [12, 7], [14, 9], [14, 8], [11, 5], [7, 2], [4, -1], [2, -3]]), // Reykjavík
    driving: RIGHT,
    water: { he: 'מי ברז מצוינים לשתייה (מים חמים מהברז עשויים להריח מגופרית – זה תקין)', en: 'Excellent tap water (hot tap water may smell of sulphur – this is normal)' },
  },
  'Norway': {
    plug: plug(['C', 'F'], 230),
    tipping: { he: 'לא חובה; נהוג לעגל או 5–10% על שירות טוב.', en: 'Not obligatory; round up or 5–10% for good service.' },
    emergency: em('112', '112', '113', '110'),
    phrases: NORWEGIAN,
    weather: wx([[4, 0], [4, 0], [6, 1], [10, 3], [14, 7], [17, 10], [18, 12], [18, 12], [15, 9], [11, 6], [7, 3], [5, 1]]), // Bergen (fjords region)
    driving: RIGHT,
    water: W_SAFE,
  },
  'Denmark': {
    plug: plug(['C', 'E', 'F', 'K'], 230),
    tipping: { he: 'השירות כלול במחיר; עיגול על שירות טוב.', en: 'Service is included; round up for good service.' },
    emergency: em('112', '112', '112', '112'),
    phrases: DANISH,
    weather: wx([[3, -1], [3, -1], [6, 0], [11, 3], [16, 8], [19, 11], [22, 14], [21, 14], [17, 11], [12, 7], [7, 3], [4, 1]]), // Copenhagen
    driving: RIGHT,
    water: W_SAFE,
  },
  'United Kingdom (Scotland)': {
    plug: plug(['G'], 230),
    tipping: { he: 'במסעדות 10–12.5% (לעיתים כבר כלול כ-service charge); בפאבים לא נהוג.', en: 'Restaurants 10–12.5% (often already added as a service charge); not expected in pubs.' },
    emergency: em('999', '999', '999', '999'), // 112 also works
    phrases: ENGLISH_UK,
    weather: wx([[7, 1], [8, 1], [10, 2], [12, 4], [15, 6], [18, 9], [19, 11], [19, 11], [17, 9], [13, 6], [9, 3], [7, 1]]), // Edinburgh
    driving: LEFT,
    water: W_SAFE,
  },
  'Mexico': {
    plug: plug(['A', 'B'], 127),
    tipping: { he: 'נהוג 10–15% במסעדות (propina); טיפ קטן לסבלים ולמדריכים.', en: '10–15% in restaurants (propina); small tips for porters and guides.' },
    emergency: em('911', '911', '911', '911'),
    phrases: SPANISH,
    weather: wx([[28, 19], [29, 20], [30, 21], [31, 22], [32, 24], [33, 24], [33, 24], [33, 24], [32, 24], [31, 23], [30, 21], [29, 20]]), // Cancún
    driving: RIGHT,
    water: W_BOTTLED,
  },
  'Costa Rica': {
    plug: plug(['A', 'B'], 120),
    tipping: { he: 'החוק מוסיף 10% שירות לחשבון במסעדות; טיפ נוסף למדריכים ונהגים מקובל.', en: 'By law restaurants add 10% service; extra tips for guides and drivers are customary.' },
    emergency: em('911', '911', '911', '911'),
    phrases: SPANISH,
    weather: wx([[24, 15], [25, 15], [26, 16], [26, 17], [26, 17], [26, 17], [25, 17], [26, 17], [26, 16], [25, 16], [24, 16], [24, 15]]), // San José (Central Valley); coasts are much hotter
    driving: RIGHT,
    water: { he: 'מי ברז ראויים לשתייה ברוב האזורים התיירותיים; באזורים מרוחקים עדיף מים בבקבוק', en: 'Tap water is safe in most tourist areas; in remote areas prefer bottled' },
  },
  'Peru': {
    plug: plug(['A', 'C'], 220),
    tipping: { he: 'נהוג כ-10% במסעדות; טיפ למדריכים ולסבלים במסלולים מקובל.', en: 'About 10% in restaurants; tips for guides and porters on treks are customary.' },
    emergency: em('105', '105', '106', '116'),
    phrases: SPANISH,
    weather: wx([[19, 7], [19, 7], [19, 7], [20, 4], [20, 2], [19, 0], [19, -1], [20, 1], [21, 4], [21, 5], [21, 6], [20, 7]]), // Cusco (≈3,400 m)
    driving: RIGHT,
    water: W_BOTTLED,
  },
  'Argentina': {
    plug: plug(['C', 'I'], 220, 'רוב השקעים החדשים מסוג I.', 'Most newer sockets are type I.'),
    tipping: { he: 'נהוג כ-10% במסעדות (propina), לרוב במזומן.', en: 'About 10% in restaurants (propina), usually in cash.' },
    emergency: em('911', '911', '107', '100'),
    phrases: SPANISH,
    weather: wx([[30, 20], [29, 19], [26, 17], [23, 14], [19, 11], [16, 8], [15, 7], [17, 8], [19, 10], [22, 13], [26, 16], [29, 18]]), // Buenos Aires (southern hemisphere)
    driving: RIGHT,
    water: { he: 'מי ברז ראויים לשתייה בבואנוס איירס', en: 'Tap water is safe in Buenos Aires' },
  },
  'Brazil': {
    plug: plug(['N', 'C'], 127, 'בריו המתח 127V; בחלק מהערים 220V.', 'Rio uses 127V; some cities use 220V.'),
    tipping: { he: 'בחשבון לרוב נוסף 10% שירות; מעבר לזה לא נדרש.', en: 'A 10% service charge is usually added; nothing more is needed.' },
    emergency: em('190', '190', '192', '193'),
    phrases: PORTUGUESE_BR,
    weather: wx([[30, 24], [31, 24], [30, 24], [29, 23], [27, 21], [26, 20], [26, 19], [26, 20], [26, 20], [27, 21], [28, 22], [29, 23]]), // Rio de Janeiro (southern hemisphere)
    driving: RIGHT,
    water: W_BOTTLED,
  },
  'Australia': {
    plug: plug(['I'], 230),
    tipping: { he: 'לא נהוג; 10% על שירות מיוחד במסעדה.', en: 'Not expected; 10% for exceptional restaurant service.' },
    emergency: em('000', '000', '000', '000'), // 112 also works from mobiles
    phrases: ENGLISH_UK,
    weather: wx([[26, 19], [26, 19], [25, 18], [23, 15], [20, 12], [18, 9], [17, 8], [18, 9], [21, 11], [22, 14], [24, 16], [25, 18]]), // Sydney (southern hemisphere)
    driving: LEFT,
    water: W_SAFE,
  },
  'New Zealand': {
    plug: plug(['I'], 230),
    tipping: { he: 'לא נהוג; עיגול על שירות מיוחד.', en: 'Not expected; round up for exceptional service.' },
    emergency: em('111', '111', '111', '111'),
    phrases: ENGLISH_UK, // Māori greeting: Kia ora
    weather: wx([[24, 16], [25, 16], [23, 15], [21, 13], [18, 11], [16, 9], [15, 8], [16, 8], [17, 10], [19, 11], [21, 13], [23, 15]]), // Auckland (southern hemisphere; Queenstown is much colder)
    driving: LEFT,
    water: W_SAFE,
  },
};

// ---------- packing rules ----------
// A builder applies every rule whose `when` matches the trip (all keys in `when` must match):
//   always: true                     – always included
//   season: 'summer'|'winter'|'rain' – trip season (builder derives from month + hemisphere + weather table)
//   styles: [...]                    – match if the trip has ANY of these styles (beach, ski, city, hiking, safari, luxury, cruise)
//   kids:   'toddler'|'child'        – travelling with toddlers (0–3) or children (4–12)
//   hot:    true / cold: true        – monthly avg high ≥ 28°C / avg low ≤ 5°C at the destination
// Items are de-duplicated by `en` when several rules match.
export const packingRules = [
  { when: { always: true }, items: [
    { he: 'דרכון (בתוקף 6 חודשים לפחות) וצילום שלו', en: 'Passport (valid 6+ months) and a copy' },
    { he: 'כרטיסי טיסה, אישורי מלון וביטוח נסיעות', en: 'Flight tickets, hotel confirmations and travel insurance' },
    { he: 'כרטיס אשראי + מעט מזומן במטבע המקומי', en: 'Credit card + some local cash' },
    { he: 'מתאם חשמל (ראו עמוד ׳מה כדאי לדעת׳)', en: 'Power adapter (see the “Good to know” page)' },
    { he: 'מטען טלפון וסוללה ניידת', en: 'Phone charger and power bank' },
    { he: 'תרופות קבועות (בכבודת היד)', en: 'Regular medication (in hand luggage)' },
  ] },
  { when: { styles: ['beach'] }, items: [
    { he: 'בגדי ים', en: 'Swimwear' },
    { he: 'קרם הגנה ידידותי לשונית', en: 'Reef-safe sunscreen' },
    { he: 'כובע ומשקפי שמש', en: 'Hat and sunglasses' },
    { he: 'כפכפים / נעלי מים', en: 'Flip-flops / water shoes' },
    { he: 'מגבת חוף', en: 'Beach towel' },
    { he: 'שקית אטומה לטלפון', en: 'Waterproof phone pouch' },
  ] },
  { when: { styles: ['ski'] }, items: [
    { he: 'מעיל ומכנסי סקי', en: 'Ski jacket and pants' },
    { he: 'שכבה תרמית (חולצה ומכנס)', en: 'Thermal base layers' },
    { he: 'גרבי סקי', en: 'Ski socks' },
    { he: 'כפפות, כובע צמר וצוואר (באף)', en: 'Gloves, beanie and neck gaiter' },
    { he: 'משקפת סקי', en: 'Ski goggles' },
    { he: 'קרם הגנה ושפתון הגנה', en: 'Sunscreen and lip balm' },
  ] },
  { when: { styles: ['city'] }, items: [
    { he: 'נעלי הליכה נוחות', en: 'Comfortable walking shoes' },
    { he: 'תיק יום קטן עם רוכסן', en: 'Small zip day bag' },
    { he: 'בקבוק מים רב-פעמי', en: 'Reusable water bottle' },
  ] },
  { when: { styles: ['hiking', 'safari'] }, items: [
    { he: 'נעלי הליכה / טיולים', en: 'Hiking boots / trail shoes' },
    { he: 'תרמיל יום', en: 'Daypack' },
    { he: 'מעיל רוח / גשם קל', en: 'Light wind / rain jacket' },
    { he: 'דוחה יתושים', en: 'Insect repellent' },
    { he: 'פנס ראש', en: 'Head torch' },
    { he: 'ערכת עזרה ראשונה בסיסית', en: 'Basic first-aid kit' },
  ] },
  { when: { styles: ['safari'] }, items: [
    { he: 'בגדים בצבעים ניטרליים (חאקי/בז׳)', en: 'Neutral-coloured clothes (khaki/beige)' },
    { he: 'משקפת', en: 'Binoculars' },
  ] },
  { when: { styles: ['luxury', 'cruise'] }, items: [
    { he: 'בגד ערב לארוחה חגיגית', en: 'Evening outfit for a formal dinner' },
    { he: 'נעליים אלגנטיות', en: 'Smart shoes' },
  ] },
  { when: { season: 'summer' }, items: [
    { he: 'בגדים קלים ונושמים', en: 'Light, breathable clothes' },
    { he: 'קרם הגנה וכובע', en: 'Sunscreen and hat' },
  ] },
  { when: { hot: true }, items: [
    { he: 'בקבוק מים ומלחי שתייה', en: 'Water bottle and rehydration salts' },
  ] },
  { when: { season: 'winter' }, items: [
    { he: 'מעיל חם', en: 'Warm coat' },
    { he: 'סוודר / פליז', en: 'Sweater / fleece' },
    { he: 'נעליים סגורות עמידות למים', en: 'Closed waterproof shoes' },
  ] },
  { when: { cold: true }, items: [
    { he: 'כפפות, כובע צמר וצעיף', en: 'Gloves, beanie and scarf' },
    { he: 'שכבה תרמית', en: 'Thermal layer' },
  ] },
  { when: { season: 'rain' }, items: [
    { he: 'מעיל גשם / פונצ׳ו', en: 'Rain jacket / poncho' },
    { he: 'מטרייה מתקפלת', en: 'Compact umbrella' },
    { he: 'שקיות אטומות לציוד ולמסמכים', en: 'Dry bags for gear and documents' },
  ] },
  { when: { kids: 'toddler' }, items: [
    { he: 'עגלה קלה מתקפלת', en: 'Light folding stroller' },
    { he: 'חיתולים ומגבונים לימים הראשונים', en: 'Nappies and wipes for the first days' },
    { he: 'בקבוקים, מטרנה וחטיפים לטיסה', en: 'Bottles, formula and snacks for the flight' },
    { he: 'מנשא', en: 'Baby carrier' },
    { he: 'מדחום ותרופות לילדים (אקמול/נורופן לילדים)', en: 'Thermometer and children’s fever medicine' },
    { he: 'בגדים להחלפה בכבודת היד', en: 'Spare clothes in hand luggage' },
  ] },
  { when: { kids: 'child' }, items: [
    { he: 'אוזניות ומשחקים לטיסה', en: 'Headphones and games for the flight' },
    { he: 'בקבוק מים וחטיפים', en: 'Water bottle and snacks' },
    { he: 'כובע וקרם הגנה לילדים', en: 'Kids’ hat and sunscreen' },
    { he: 'מדחום ותרופות לילדים', en: 'Thermometer and children’s medicine' },
  ] },
  { when: { kids: 'child', styles: ['beach'] }, items: [
    { he: 'מצופים / שרוולי ים', en: 'Swim armbands / float vest' },
    { he: 'חולצת UV', en: 'UV swim shirt' },
  ] },
];
