/**
 * Canonical tag vocabulary. The ids are deliberately stable: they are the
 * values stored by the learning layer, while Hebrew labels can evolve freely.
 */
export const tagCatalog = [
  {
    id: 'travel_style', label: 'סגנון חופשה', type: 'facet', children: [
      { id: 'beach', label: 'ים ובריכה', aliases: ['ים', 'חוף', 'בריכה', 'בטן גב', 'שמש', 'לגונה', 'beach', 'sea', 'pool', 'lagoon'] },
      { id: 'city', label: 'טיול עירוני', aliases: ['עיר', 'עירוני', 'מוזיאון', 'קניות', 'מסעדות', 'תרבות', 'city', 'museum', 'museums', 'shopping', 'restaurants', 'culture'] },
      { id: 'couple', label: 'זוגי', aliases: ['זוג', 'זוגי', 'רומנטי', 'ירח דבש', 'couple', 'romantic', 'honeymoon'] },
      { id: 'family', label: 'משפחתי', aliases: ['משפחה', 'ילדים', 'ילד', 'פעוט', 'תינוק', 'family', 'kids', 'children', 'toddler', 'baby'] },
      { id: 'relaxation', label: 'מנוחה', aliases: ['מנוחה', 'רגוע', 'שקט', 'להירגע', 'לא לרוץ', 'relax', 'relaxing', 'quiet', 'calm'] },
      { id: 'adventure', label: 'אקטיבי', aliases: ['טיולים', 'אטרקציות', 'אקסטרים', 'צלילה', 'טיול טבע', 'hiking', 'attractions', 'diving', 'nature'] }
    ]
  },
  {
    id: 'trip_shape', label: 'מבנה הטיול', type: 'facet', children: [
      { id: 'short_break', label: 'סוף שבוע קצר', aliases: ['סופש', 'סופ"ש', 'סוף שבוע', '3 לילות', 'weekend', '3 nights'] },
      { id: 'week_long', label: 'שבוע', aliases: ['שבוע', '7 לילות', 'a week', '7 nights'] },
      { id: 'flexible_dates', label: 'גמיש בתאריכים', aliases: ['גמיש', 'מתי שיוצא', 'לא משנה מתי', 'flexible', 'any time'] }
    ]
  },
  {
    id: 'booking_constraints', label: 'אילוצי הזמנה', type: 'facet', children: [
      { id: 'direct_flight', label: 'טיסה ישירה', aliases: ['טיסה ישירה', 'ישיר', 'בלי קונקשן', 'direct', 'nonstop', 'non-stop'] },
      { id: 'late_departure', label: 'יציאה בשעה נוחה', aliases: ['לא מוקדם', 'לא לקום מוקדם', 'טיסת צהריים', 'בערב', 'not too early', 'afternoon flight'] },
      { id: 'low_budget', label: 'מחיר חשוב', aliases: ['זול', 'משתלם', 'הכי זול', 'להוריד מחיר', 'תקציב נמוך', 'cheap', 'cheapest', 'affordable'] },
      { id: 'all_inclusive', label: 'הכל כלול', aliases: ['הכל כלול', 'הכול כלול', 'all inclusive', 'all-inclusive'] }
    ]
  },
  {
    id: 'special_requirements', label: 'צרכים והעדפות', type: 'facet', children: [
      { id: 'kosher', label: 'אוכל כשר', aliases: ['כשר', 'כשרות', 'kosher'] },
      { id: 'shabbat', label: 'שומרי שבת', aliases: ['שבת', 'שומר שבת', 'shabbat', 'sabbath'] },
      { id: 'accessible', label: 'נגישות', aliases: ['נגיש', 'נגישות', 'כיסא גלגלים', 'accessible', 'wheelchair'] },
      { id: 'water_slides', label: 'מגלשות מים', aliases: ['מגלשות', 'פארק מים', 'water slides', 'water park'] },
      { id: 'family_room', label: 'חדר משפחתי', aliases: ['חדר משפחתי', 'חדרים מחוברים', 'חדרים צמודים', 'family room', 'connecting rooms'] }
    ]
  },
  {
    id: 'traveler_context', label: 'הרכב הנוסעים', type: 'facet', children: [
      { id: 'solo', label: 'מטיילים לבד', aliases: ['לבד', 'סולו', 'solo', 'alone'] },
      { id: 'with_children', label: 'עם ילדים', aliases: ['עם ילדים', 'ילדים', 'ילד', 'with kids', 'with children'] },
      { id: 'adults_only', label: 'מבוגרים בלבד', aliases: ['ללא ילדים', 'בלי ילדים', 'מבוגרים בלבד', 'no kids', 'adults only'] }
    ]
  }
];

export const destinationTags = {
  santorini: ['beach', 'couple', 'relaxation', 'short_break'],
  rome: ['city', 'couple', 'short_break'],
  maldives: ['beach', 'couple', 'relaxation', 'all_inclusive'],
  dubai: ['city', 'beach', 'family', 'with_children', 'water_slides']
};

export function flatTags() {
  return tagCatalog.flatMap((facet) => facet.children.map((tag) => ({ ...tag, facetId: facet.id, facetLabel: facet.label })));
}

export function publicTagCatalog() {
  return tagCatalog.map(({ id, label, children }) => ({
    id, label, children: children.map(({ id: tagId, label: tagLabel }) => ({ id: tagId, label: tagLabel }))
  }));
}
