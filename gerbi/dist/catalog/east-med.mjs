// Catalog data (spec 23): Turkey, Georgia, Bulgaria, the Gulf, Israel, Morocco. Shape: dist/catalog.mjs.
// Budget figures are rough per-person-per-day estimates in ₪ without flights.
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
      { name: { he: 'בורג׳ ח׳ליפה — At the Top', en: 'Burj Khalifa — At the Top' }, kind: 'viewpoint', durationH: 1.5, tags: ['city', 'family'] },
      { name: { he: 'דובאי מול והאקווריום', en: 'Dubai Mall & Aquarium' }, kind: 'experience', durationH: 3, tags: ['shopping', 'family'] },
      { name: { he: 'מופע המזרקות של דובאי', en: 'The Dubai Fountain show' }, kind: 'experience', durationH: 0.5, tags: ['family', 'couple'] },
      { name: { he: 'פארק המים אקוונטורה', en: 'Aquaventure Waterpark' }, kind: 'experience', durationH: 5, tags: ['water_slides', 'family'] },
      { name: { he: 'פארק המים ווילד וואדי', en: 'Wild Wadi Waterpark' }, kind: 'experience', durationH: 4, tags: ['water_slides', 'family'] },
      { name: { he: 'חוף JBR והטיילת', en: 'JBR Beach & The Walk' }, kind: 'beach', durationH: 3, tags: ['beach', 'family'] },
      { name: { he: 'שוק הזהב ושוק התבלינים', en: 'Gold Souk & Spice Souk' }, kind: 'market', durationH: 2, tags: ['shopping', 'culture'] },
      { name: { he: 'רובע אל פהידי ההיסטורי', en: 'Al Fahidi Historical District' }, kind: 'neighborhood', durationH: 1.5, tags: ['culture'] },
      { name: { he: 'מוזיאון העתיד', en: 'Museum of the Future' }, kind: 'museum', durationH: 2, tags: ['family'] },
      { name: { he: 'ספארי מדבר', en: 'Desert safari' }, kind: 'experience', durationH: 6, tags: ['adventure', 'family'] },
      { name: { he: 'מסגרת דובאי (Dubai Frame)', en: 'Dubai Frame' }, kind: 'viewpoint', durationH: 1, tags: ['family'] },
      { name: { he: 'גן הפרחים מירקל גארדן', en: 'Dubai Miracle Garden' }, kind: 'park', durationH: 2, tags: ['family'] }
    ],
    dayTrips: [
      { name: { he: 'אבו דאבי — המסגד הגדול והלובר', en: 'Abu Dhabi — Grand Mosque & Louvre' }, hours: 1.5, note: { he: 'נסיעה ברכב או באוטובוס; אפשר לשלב פארק שעשועים באי יאס', en: 'By car or bus; can be combined with a Yas Island theme park' } },
      { name: { he: 'חתא בהרי חג׳ר', en: 'Hatta in the Hajar Mountains' }, hours: 1.5, note: { he: 'סכר, קיאקים ומסלולי טבע', en: 'A dam, kayaking and nature trails' } }
    ],
    transport: { carRecommended: false, note: { he: 'מטרו מהשדה לרוב האזורים; מוניות ואפליקציות נסיעה זולות יחסית. רכב שכור נוח לטיולי יום.', en: 'The metro runs from the airport to most areas; taxis and ride apps are fairly cheap. A rental car helps for day trips.' } },
    practical: {
      currency: 'AED', language: { he: 'ערבית; אנגלית בכל מקום', en: 'Arabic; English everywhere' }, timeZone: 'Asia/Dubai',
      visaNoteForIsraelis: { he: 'ישראלים קיבלו בשנים האחרונות אשרה בהגעה; הכללים משתנים — יש לבדוק במקורות הרשמיים לפני הטיסה.', en: 'Israelis have recently received a visa on arrival; rules change — check official sources before flying.' },
      kosher: { he: 'יש מסעדות ושירותי קייטרינג כשרים ובית חב״ד; לתאם מראש.', en: 'There are kosher restaurants and caterers and a Chabad house; arrange in advance.' },
      shabbat: { he: 'מרחקים גדולים — כדאי לבחור מלון קרוב לקהילה או לבית חב״ד ולתאם ארוחות.', en: 'Distances are large — choose a hotel near the community or Chabad and arrange meals.' }
    },
    seasonsNote: { he: 'נובמבר–מרץ נעים ומושלם לים. אפריל ואוקטובר חמים. יוני–ספטמבר חם מאוד — רוב הזמן בפנים או בבריכה.', en: 'November–March is pleasant and perfect for the beach. April and October are warm. June–September is extremely hot — mostly indoors or by the pool.' }
  }
];
