# אפיון 25 — הזמנה ותשלום באתר (טיסות)

**תאריך:** 15.11.2026 · **סטטוס:** נבנה במצבי `request` (ברירת מחדל) ו־`mock`; מצב `live` מוכן בקוד וחסום עד השלמת רשימת העלייה לאוויר (§12).

**החלטות בעלים:** לקוחות מזמינים דרך האתר · בלי תוספת מחיר (markup) בשלב זה · ביטוח נסיעות = הראל, בלי API, כתוספת "הצעה מנציג" · מלונות מחוץ לתחום הציבורי (הספק לא מאשר הצגת תוצאות/תמונות מלון) — מתחילים בטיסות, והזמנת מלון מתוכננת להתחבר מאחורי דגל.

**כלל בטיחות שהנחה את העבודה:** פרטי הספק ב־`.env` הם פרטי ייצור אמיתיים. בפיתוח **לא בוצעה אף קריאת הזמנה / הנפקה / ביטול / void** מול הספק. כל מסלול ההזמנה נבנה ונבדק מול ספק מזויף (`fakeSupplier`) שעונה מתשובות מוקלטות, ומול ספק תשלום מדומה (`mockPayments`). קריאות קריאה־בלבד שבוצעו: 2 חיפושים + 4 בדיקות זמינות (6 בסך הכול).

---

## 1. מחקר הספק (מנוע IRIX של dcs plus, ממשק reseller)

### 1.1 מקורות
- תיעוד OpenAPI ציבורי (קריאת קבצי תיעוד בלבד, לא קריאות API):
  - טיסות: `https://reseller.volero.net/reseller/api/flights/v1/openApi.yaml` — גרסה 1.0.17.
  - הזמנות (Reservations API): `https://reseller.volero.net/reseller/api/reservationsApi/v1/openApi.yaml` — גרסה 1.2.16.
  - דוגמאות בקשה/תשובה: `…/openApi/flightsOpenApi/V1/requests/BookingRequest-1.json`, `…/responses/BookingResponse-1.json`, `…/responses/OfferPriceResponse-1.json`, `…/reservationsOpenApi/V1/responses/IssueMethods.json`.
- תשובות חיות (קריאה בלבד, 15.11.2026): TLV⇄ATH, 2 מבוגרים + ילד. מוקלטות ומנוקות מאסימונים ב־`tests/fixtures/booking/`.

### 1.2 זרימת ההזמנה אצל הספק
| שלב | Endpoint | Scope | הערות |
|---|---|---|---|
| חיפוש | `POST /flights/v1/search` | `read:flights-search` | מחזיר `srk` + `tokens.searchResults` (JWT, **תוקף שעה** — `exp − iat = 3600`) |
| תמחור/זמינות | `POST …/offers/{offerIndex}/availability` | `read:flights-search` | מחזיר `availabilityToken`, `pricedOffer` עם `offerConfiguration`, `optionalServices`, `paymentMethods`, `fareDetails.timeLimits`, `autoTicketable` |
| תוספות (כבודה) | אותו endpoint עם `optionalServiceList:[{bookingCode, selectedOptionCode}]` | | **נבדק חי:** המחיר הכולל עולה בדיוק במחיר האפשרות (723.24→771.43 USD), האפשרות מסומנת `selected`, ו־`availabilityToken` מתחלף. ההזמנה חייבת להשתמש באסימון האחרון |
| כללי תעריף | `GET …/availability/fareRules` | | לפי PTC |
| בדיקת כפל | `POST …/double-booking-verification` | | מומלץ לפני הזמנה |
| **הזמנה** | `POST …/offers/{offerIndex}/book?token=` | `write:flights-book` | גוף: `clientRef` (ייחודי, `^[A-z0-9\-_:.]+$`), `availabilityToken`, `travelers[]`, `payment:{method:'credit'}`. תשובה: `id`, `status`, `reference.external` (= PNR), `price.net/selling`, `userConfirmations` |
| שליפה | `GET /reservationsApi/v1/reservations/{id}` · `…/reference/{clientRef}` | `read:reservations` | שליפה לפי `clientRef` = מפתח האידמפוטנטיות שלנו (reconciliation אחרי timeout) |
| הנפקה | `GET …/{id}/air/issue-methods` → `POST …/{id}/air/issue-tickets {issueMethodCode}` | `write:reservations` | רק כשהתעריף אינו `autoTicketable` |
| Void | `GET …/air/void-details` (`available`, `deadline`) → `POST …/air/void-tickets` | `write:reservations` | |
| החזר | `GET …/air/refund-details` → `POST …/air/refund-tickets {documentTokens}` | `write:reservations` | |
| ביטול הזמנה | `DELETE /reservationsApi/v1/reservations/{id}` | `write:reservations` | "בלתי הפיך", עשויים לחול דמי ביטול |
| Webhooks | `PUT …/{id}/webhooks {url}` | `write:reservations-webhooks` | אירועים: `status.change`, `ticket.issue/cancel/refund/reissue`, `pnr.changed`, `time_limit.changed`… **לא מתועדת חתימה** — HTTPS בלבד, ניסיונות חוזרים, צריך להחזיר `{"received":true}`. לכן מתייחסים אליו כטריגר ושולפים את ההזמנה מחדש |

### 1.3 נתוני נוסעים שהספק דורש (`BookingTravelerInputType`)
חובה: `ptc`, `reference` (ייחודי לנוסע), `type` (adult/child/infant), `title` (mr/mrs/miss/ms/mstr), `firstName`, `lastName`; נוסע `lead` אחד בדיוק. לפי `offerConfiguration`: `birthDate` (לכל PTC או לחלקם), `identificationDocument` (passport/identityCard: מספר, תוקף, מדינה מנפיקה, אזרחות, תאריך הנפקה אם נדרש), פרטי קשר (טלפון+מייל) של בעל ההזמנה.
**נמדד חי:** בשתי ההצעות `identificationDocument.required=false` (לכן **לא אוספים דרכון כשהספק לא דורש** — מזעור מידע), `birthdate` חובה לילד ובאחת ההצעות גם למבוגר, `contactDetails.required` true באחת.

### 1.4 שינוי מחיר, אחזקה (hold) ומגבלות זמן
- `timeLimits.offerExpiration` — כ־30 דקות מהתמחור (נמדד). `ticketingTimeLimit` / `lastTicketingDate` — עד סוף אותו יום בהצעה שנמדדה.
- **Hold:** תעריף שאינו `autoTicketable` (נמדד: Arkia) יוצר PNR שמחזיק מקום עד `ticketingTimeLimit`, והכרטיס מונפק בנפרד → מתאים ל"מסגרת → הזמנה → הנפקה → חיוב". תעריף `autoTicketable:true` (נמדד: Wizz Air, ספק NDC/LCC) מונפק מיד עם ההזמנה — **אין hold**; ביטול אחרי זה הוא void/refund לפי כללי החברה.
- שינוי מחיר מתגלה בבדיקת זמינות חוזרת; ההזמנה עצמה מחזירה `price.selling` שאנו משווים למחיר שאושר.
- **אין סביבת בדיקות (sandbox) מתועדת.** ה־`servers` היחיד בשני ה־OpenAPI הוא `https://reseller.volero.net/reseller/api` (ייצור). צריך לבקש מ־Volero סביבת בדיקה / ספק בדיקה (test provider) לפני `live`. עד אז — fixtures בלבד.

### 1.5 איך הסוכנות מחויבת אצל הספק
`payment.method` היחיד בסכמה הוא `credit` — **מסגרת אשראי של הסוכנות אצל Volero** (`paymentMethods.credit.info`: `available`, `unlimited`, `startDate/endDate`; יש גם `/credit/v1/get`). האתר לעולם לא שולח כרטיס לקוח לספק (שיטות הנפקה בכרטיס אשראי קיימות ב־issue-methods — לא בשימוש, מחוץ ל־PCI scope שלנו).
**ממצא חשוב:** בתשובה החיה `paymentMethods` ריק, ובהצעה אחת הספק כתב: *"Offer is auto-ticketable and there are no available payment methods."* — כלומר **לחשבון שלנו אין כרגע מסגרת אשראי פעילה**, והזמנה חיה תיכשל עד ש־Volero יפעילו credit. זה סעיף ראשון ברשימת העלייה לאוויר.

### 1.6 החזרים, void וביטולים
- Void: זמין עד `deadline` שמוחזר מ־`void-details` (לרוב אותו יום) — כמעט ללא עלות.
- Refund: לפי כללי התעריף; `refund-details` מחזיר אילו מסמכים ניתנים להחזר.
- ביטול PNR שלא הונפק — `DELETE` (חינמי לרוב עד ה־TTL).
- המערכת שלנו לא מבצעת אף אחד מאלה אוטומטית אחרי חיוב לקוח, חוץ מ־**שחרור מסגרת (void authorization) אצל ספק התשלום** כשההזמנה נכשלה לפני חיוב. החזרים/ביטולים אחרי הנפקה — פעולת נציג במסך הניהול (§6.3).

---

## 2. תשלום

### 2.1 עקרונות
- **עמוד תשלום מתארח (hosted) בהפניה מלאה** — לא iframe. האתר לא רואה כרטיס (PCI SAQ‑A), ה־CSP לא משתנה (`frame-src` לא נדרש; ניווט עליון אינו כפוף ל־`form-action`).
- **J5 (אישור מסגרת) → הזמנה → הנפקה → חיוב (capture).** הלקוח מחויב רק אחרי שיש כרטיסים.
- הודעת שרת־לשרת (webhook) היא **טריגר בלבד**: בכל הספקים הישראליים שנבדקו אין חתימת HMAC לסוחר ישיר, לכן (א) כתובת ההודעה כוללת אסימון HMAC פר־הזמנה שרק השרת יודע לחשב, (ב) העסקה נשלפת מחדש מהספק (`get-sales`) לפני כל שינוי, (ג) הסכום וההזמנה חייבים להתאים, (ד) כל אירוע מעובד פעם אחת.

### 2.2 השוואת ספקי סליקה (מחקר 15.11.2026, מתיעוד רשמי)
| | PayMe | Cardcom | Grow (משולם) | Pelecard | Tranzila |
|---|---|---|---|---|---|
| עמוד מתארח | כן (`sale_url`; sandbox.payme.io / live) | כן, LowProfile (`secure.cardcom.solutions`) | כן (meshulam.co.il) | כן (`gateway21.pelecard.biz`) | iframe (`direct.tranzila.com`, לא אומת רשמית) |
| 3DS | כן | כן | לא אומת | כן | כן |
| ביט / Apple Pay / Google Pay | שלושתם (ביט — תשלום אחד, ₪ בלבד) | Apple/Google כן; ביט בעמוד — לא אומת | שלושתם | שלושתם | לפי השיווק |
| תשלומים | 1–36, גם "הלקוח בוחר" | 1–36 | לא אומת | כן | 2–36 |
| J5 → capture | `sale_type:"authorize"` → `capture-sale` (גם חלקי). **חובה לחייב תוך 7 ימים** | `SuspendedDeal` + capture לפי ApprovalNumber | דורש אישור מראש מ־Grow; עד 7 ימים | `ActionType:"J5"` → `CompleteDebitByUid` | לא אומת (התיעוד הפוך J4/J5) |
| החזר / ביטול מסגרת | `refund-sale` (מלא/חלקי; על authorize = שחרור) | `RefundByTransactionId` (חלקי, CancelOnly) | `refundTransaction` | לא אומת | לא אומת |
| Webhook ואימות | `sale_callback_url`, 3 ניסיונות; חתימה לשותפים בלבד → לאמת ב־`get-sales` | `WebHookUrl`, בלי חתימה → `GetLpResult` | `notifyUrl`, בלי חתימה | בלי חתימה → `ValidateByUniqueKey` | לא אומת |
| חשבוניות | API מסמכים מובנה | מודול מסמכים חזק | מובנה | Payper / EZcount | מובנה |
| Sandbox | **עצמי מהדשבורד** | דרך Cardcom | יש, מפתחות מהתמיכה | ציבורי | לא אומת |

### 2.3 המלצה: **PayMe** (חלופה: Cardcom)
PayMe הוא היחיד שהתיעוד הציבורי שלו מאשר את כל הזרימה שאנו צריכים: authorize→capture (כולל חלקי), שחרור מסגרת דרך `refund-sale`, ביט/Apple/Google Pay באותו עמוד, תשלומים 1–36, webhook עם הנחיה מפורשת לאמת ב־`get-sales`, מסמכים מובנים, ו־**sandbox בשירות עצמי** — אפשר להתחיל אינטגרציה לפני חוזה. בנוסף, לבעלים כבר יש היכרות עם PayMe (מזהה מוכר בפרויקט החשבוניות).
Cardcom — חלופה חזקה (סולק מורשה, מודול חשבוניות טוב), אבל ה־webhook לא חתום, ביט בעמוד לא אומת ומשך ה־J5 לא מתועד.

**מה הבעלים צריך לפתוח:** חשבון סוחר PayMe לעסק תיירות (לבקש במפורש: J5/authorize, תשלומים, ביט, Apple Pay, Google Pay; לברר underwriting לענף תיירות), להפעיל "E-commerce API" בדשבורד, לקבל `seller_payme_id` לבדיקות ולייצור, ולאשר מול המכירות: (1) J5 לסוג העסק, (2) האם ביט/ארנקים תומכים ב־authorize או רק חיוב מיידי, (3) כתובת עמוד הייצור המדויקת.
**הסתייגות:** ביט (ולעתים ארנקים) הוא בדרך כלל חיוב מיידי ולא J5. במקרה כזה הזרימה נשארת נכונה — "חיוב" במקום "מסגרת", ו"שחרור" הופך להחזר (`refund-sale`) — אבל צריך לאמת ב־sandbox.

### 2.4 מימוש
`backend/payments.mjs` — ממשק אחיד: `createPayment` (authorize only) · `verifyNotification` · `capture` · `voidAuthorization` · `refund` · `status`.
- `mockPayments` — עמוד תשלום מדומה בשרת (`/api/payments/mock/<intent>`, HTML בלי סקריפטים), הודעה חתומה HMAC‑SHA256 בדיוק כמו ספק אמיתי. לפיתוח, בדיקות ו־e2e בלבד.
- `paymePayments` — שלד מתאם ל־PayMe (`generate-sale` עם `sale_type:authorize`, `capture-sale`, `refund-sale`, `get-sales`), מוגדר מ־env, **לא נבדק מול PayMe**.

---

## 3. מצבי הפעלה (`BOOKING_MODE`)
| מצב | מה קורה | ספק | תשלום |
|---|---|---|---|
| `request` **(ברירת מחדל)** | האשף אוסף הכול, בודק מחיר מול הספק (קריאה בלבד), **לא מאשר ולא מזמין כלום**. ההזמנה הופכת לליד (`type:'booking'`) ולמשימה לנציג במסך הניהול. מייל "קיבלנו את הבקשה" | חי, קריאה בלבד | אין |
| `mock` | הזרימה המלאה של live מול ספק מזויף ותשלום מדומה. שמות משפחה מיוחדים מפעילים כשלים: `PRICECHANGE`, `SOLDOUT`, `SUPPLIERFAIL`, `TICKETFAIL`, `TIMEOUT`, `RQ` | `fakeSupplier` | `mockPayments` |
| `live` | הזמנה אמיתית + תשלום אמיתי | חי (כתיבה) | PayMe |
| `off` | אין הזמנה באתר | — | — |

**Fail‑closed:** `live` רץ רק אם קיימים `VOLERO_BOOKING_ENABLED=true`, `PAYMENT_PROVIDER=payme`, `PAYME_SELLER_ID`, `PAYMENT_WEBHOOK_SECRET`, `BOOKING_DATA_KEY`, `SITE_URL` (https). חסר משהו → רץ `request`, נרשם אזהרה, ו־`/api/status` (לבעלים) מציג מה חסר. `mock` מסורב בייצור (`VERCEL_ENV`/`NODE_ENV=production`). בלי מפתח הצפנה בייצור — ההזמנה כבויה לגמרי. `BOOKING_SUPPLIER=fake` (פיתוח בלבד) מחליף גם את קריאות הקריאה של `request` בספק המזויף.
מתאם הספק החי מסרב לכל קריאת כתיבה (`book/issue/void/cancel`) אם לא `BOOKING_MODE=live` **וגם** `VOLERO_BOOKING_ENABLED=true` — גם אם מישהו בנה אותו בטעות.

---

## 4. מחזור חיים ומכונת מצבים (`backend/order-machine.mjs`)
```
draft → details → priced ─┬─ request ─→ requested → in_progress → confirmed
           ↕ price_changed │
                           └─ live/mock ─→ payment_pending → payment_authorized → booking → booked → ticketed → confirmed
```
ענפי כשל:
- **שינוי מחיר** בבדיקה החוזרת → `price_changed`; הלקוח חייב לאשר מחיר חדש לפני תשלום. בדיקה סופית רצה גם **אחרי** אישור המסגרת ולפני ההזמנה: שינוי → שחרור המסגרת → `price_changed` → תשלום מחדש.
- **המקום נגמר** → `unavailable` (אם הייתה מסגרת — משוחררת קודם).
- **תשלום נדחה** → `payment_failed` → ניסיון חוזר באותה הזמנה (attempt+1).
- **כשל ספק אחרי תשלום** → `booking_failed` → שחרור מסגרת אוטומטי → `voided`. אם השחרור נכשל → `needs_agent` (דגל `void_failed`) — לעולם לא חיוב שקט.
- **timeout עם תוצאה לא ידועה** → שליפה לפי `clientRef` (`<ref>-<attempt>`); נמצא → ממשיכים; לא נמצא → `needs_agent` (`booking_unknown`), ה־reconciliation ממשיך לחפש. לעולם לא מזמינים פעמיים.
- **הנפקה נכשלה** → `needs_agent` (`ticketing_failed`), הכרטיס לא חויב. **חיוב נכשל** → `needs_agent` (`capture_failed`).
- סטטוס `RQ` מהספק / מחיר ספק גבוה מהמאושר → `needs_agent` (`on_request` / `price_mismatch`), בלי הנפקה.

**אידמפוטנטיות:** `Idempotency-Key` ביצירת הזמנה (24 שעות) · `clientRef` אצל הספק · מנעול פר־הזמנה (`store.incr` עם TTL 90 שניות) סביב כל פעולה שנוגעת בספק/תשלום · אירועי תשלום מעובדים פעם אחת (`evt:<sha>` ל־30 יום) · `pay` כפול תוך 10 דקות מחזיר את אותו עמוד.
**Timeouts:** מחיר תקף 15 דקות (אחרת בדיקה חוזרת אוטומטית לפני תשלום) · טיוטה פגה אחרי 24 שעות ללא פעילות (נמחקת עם פרטיה, ומפתח הטיוטה ב־KV עם TTL 7 ימים) · `payment_pending` נבדק מול הספק אחרי 30 דקות ופג אחרי שעתיים.
**Reconciliation** (`reconcile()`): מריץ מצבים תקועים קדימה, מחפש הזמנות "לא ידועות", מסמן `hold_expiring` (מסגרת בת 5+ ימים — PayMe מחייב תוך 7), `ticketing_deadline` (שעתיים לפני TTL), ומוחק פרטים אישיים לפי מדיניות שמירה. רץ: אוטומטית כשהבעלים פותח את מסך ההזמנות (לכל היותר פעם ב־10 דקות), בכפתור במסך, וב־`GET /api/orders/cron/reconcile` עם `Authorization: Bearer $CRON_SECRET` (Vercel Cron).
**יומן ביקורת:** כל מעבר נרשם ב־`timeline` (מתי, מי — customer/system/admin/webhook/reconcile, מאיפה לאן, הערה). אירועים שאינם מעבר (הערה, דגל, עדכון תוספות) — גם. לוגים מובנים (`evt: booking_*`) בלי פרטים אישיים.

---

## 5. API
| Method | Path | מי | תיאור |
|---|---|---|---|
| GET | `/api/orders/config` | כולם | `{enabled, mode, online, maxInstallments, insurance, hotels:false}` |
| POST | `/api/orders` | כולם (Origin + JSON, מגבלת קצב משותפת 12/10 דק׳) | יצירה מהצעה: `{offer:{srk, offerIndex, searchToken, itineraryIndex}, source, insurance, lang}` + `Idempotency-Key`. השרת מתמחר מחדש; סוגי הנוסעים נלקחים מהתמחור, לא מהדפדפן. מחזיר `{id, token, order}` |
| GET | `/api/orders/:id` | בעל האסימון (`x-order-token`) או הלקוח המחובר | תצוגה ציבורית (מספר מסמך מוסתר) |
| POST | `/api/orders/:id/passengers` | 〃 | נוסעים + איש קשר (ולידציה בשרת) |
| POST | `/api/orders/:id/addons` | 〃 | `{bags:{"TLV-ATH": code}, insurance}` |
| POST | `/api/orders/:id/recheck` | 〃 | בדיקת מחיר חוזרת (עם התוספות) |
| POST | `/api/orders/:id/accept-price` | 〃 | אישור מחיר חדש |
| POST | `/api/orders/:id/submit` | 〃 | מצב request: `{terms, cancellation, expectedTotal}` |
| POST | `/api/orders/:id/pay` | 〃 | mock/live: `{terms, cancellation, expectedTotal}` → `{redirectUrl}` |
| POST | `/api/orders/:id/continue` | 〃 | דחיפה עדינה לתהליך תקוע (העמוד קורא בזמן המתנה) |
| POST | `/api/orders/:id/cancel` · `/cancel-request` | 〃 | נטישת טיוטה · בקשת ביטול (ליד לנציג) |
| GET / POST | `/api/orders/mine` · `/api/orders/lookup` | לקוח | הזמנות החשבון · הזמנות שמורות במכשיר (id+token) |
| POST | `/api/payments/notify/:provider/:orderId/:token` | ספק התשלום | הודעה (אימות: אסימון URL + חתימה/שליפה מחדש + סכום) |
| GET/POST | `/api/payments/mock/:intent` | mock בלבד | עמוד התשלום המדומה |
| GET | `/api/orders/admin` · `/admin/:id` · `/admin/export.csv` | בעלים | רשימה (סינון סטטוס/דגלים/חיפוש), פרטים מלאים (מפוענחים), ייצוא |
| POST | `/api/orders/admin/:id/action` · `/admin/reconcile` | בעלים | פעולות ידניות (§6.3) |
| GET | `/api/orders/cron/reconcile` | `CRON_SECRET` | reconciliation מתוזמן |

אבטחה: כל POST של לקוח דורש Origin זהה (`sameOrigin` כמו בחשבונות) ו־`application/json`; הזמנה לא קיימת וגישה אסורה נראות זהות (404); מגבלות קצב (`orders` 90/דק׳ לכתובת, `ordersCreate` משותפת, `ordersNotify` 120/דק׳); מסלולי הבעלים דרך סשן הניהול (bridge) או הטוקן.

---

## 6. ממשק

### 6.1 נקודות כניסה
- כפתור **"להזמנה"** בחלון "בדיקת מחיר" של תוצאות הטיסות (הלוך־חזור, כיוון אחד ורב־יעדי) — מופיע רק כש־`/api/orders/config` מחזיר `enabled`.
- בונה הטיולים (§9) — כפתור "להזמנת הטיסה" על הטיסה שנבחרה.

### 6.2 האשף `#/book/<id>` (`dist/booking.mjs`)
1. **נוסעים** — לכל נוסע לפי סוג: מגדר (ממנו נגזר title), שם פרטי ושם משפחה באותיות לטיניות (בדיקה מיידית + בשרת), תאריך לידה (חובה לילד/תינוק ולפי דרישת הספק; ילד 2–11 ביום הטיסה הראשונה, תינוק מתחת ל־2 גם בחזור), פרטי דרכון **רק כשהספק דורש** (מספר, תוקף > סוף הנסיעה + אזהרת 6 חודשים, אזרחות, מדינה מנפיקה). איש קשר — מולא מהחשבון אם מחוברים.
2. **תוספות** — מזוודה לכל כיוון אם הספק מציע (מחיר בספק + ≈₪), ו־**ביטוח נסיעות הראל** — תיבת סימון "אשמח להצעה", לא נגבה ולא נכלל במחיר; מגיע לנציג כליד.
3. **סיכום** — הטיסה, הנוסעים, תוספות, **מחיר סופי בשקלים שנבדק מחדש** (וגם במטבע המקור + השער), פירוט לפי סוג נוסע, "כולל מסים ודמי שירות, בלי עמלה", מדיניות ביטול (non‑refundable / כללי החברה / זכות ביטול לפי חוק הגנת הצרכן), הסתייגות הספק אם קיימת, אישור תנאים + אישור מדיניות ביטול (קישורים ל־`#/terms`). request: "שליחת בקשת הזמנה"; online: "לתשלום מאובטח · ₪X" (התשלומים — עד 6 —, ביט ו־Apple/Google Pay נבחרים בדף התשלום המתארח).
4. **אישור** — מספר הזמנה, PNR, מספרי כרטיסים, סכום ותשלומים, הדפסה, "ההזמנות שלי", בקשת ביטול, היסטוריה. מצבי ביניים (ממתין לתשלום / בתהליך) מתעדכנים לבד.
- שגיאות שדה ליד השדה (`aria-invalid`, הודעה מקושרת), מיקוד לשגיאה הראשונה, `aria-live` לשינויי מצב, עבודה ב־375 וב־1440, עברית RTL ואנגלית `/en/`.

### 6.3 ניהול — לשונית "הזמנות" ב־`/admin`
רשימה עם סינון (סטטוס/קבוצה, "דורש טיפול", חיפוש לפי מספר/PNR/שם/טלפון), מונים, מצב ההפעלה בפועל ומה חסר ל־live; כרטיס הזמנה עם כל הפרטים (מפוענחים — רק לבעלים), ציר זמן מלא, דגלים, ופעולות: הערה · "בטיפול" · אישור ידני (PNR + כרטיסים, שולח מייל) · סימון "הונפק" · המשך אוטומטי אחרי תיקון · חיוב (capture) · שחרור מסגרת · החזר דרך ספק התשלום (מלא/חלקי) · ביטול · ניקוי דגל · reconciliation · ייצוא CSV (בלי תאריכי לידה ומסמכים).

### 6.4 "ההזמנות שלי"
באזור הלקוח (`#/account`) ובעמוד `#/orders`: הזמנות החשבון + הזמנות שנפתחו במכשיר (אסימון ב־localStorage). קישור במייל כולל את האסימון פעם אחת ונשמר במכשיר.

---

## 7. הגנת הצרכן
- **מחיר כולל** (סעיף 17ב): המחיר המוצג לפני תשלום כולל את כל המסים, ההיטלים ודמי השירות של הספק; אין עמלת סוכנות (החלטת בעלים). הסכום שמחויב = המחיר שהוצג ואושר (`expectedTotal` חייב להתאים בשרת).
- **זכות ביטול בעסקת מכר מרחוק** (סעיף 14ג + תקנות ביטול עסקה): מוצגת בסיכום ומקושרת ל־`#/terms#t-consumer`; בקשת ביטול זמינה מעמוד ההזמנה. השאלות הפתוחות (חריגי שירותי נסיעה, מה מותר לגבות) — `docs/legal/open-questions-he.md` §2 שאלות 2–3; נוספו שאלות 17א–17ג על ההזמנה המקוונת.
- **אישור תנאים** — שתי תיבות נפרדות (תנאים; מדיניות ביטול), נשמר מועד וגרסה בהזמנה.
- **קבלות:** אישור הזמנה להדפסה + מייל. חשבונית/קבלה במס — ממודול המסמכים של ספק הסליקה (PayMe) או ממערכת החשבוניות של העסק; לא נבנה כאן (§12).
- **תנאי השימוש** (`#/terms` §4) עדיין אומרים "אין הזמנה ותשלום מקוונים" — נכון למצב `request`; לפני `live` עורך הדין מעדכן.

---

## 8. אבטחה ופרטיות
- **מזעור:** דרכון נאסף רק כשהספק דורש. לקוח לא מקבל בחזרה מספר מסמך מלא (`•••567`). הליד לא כולל תאריכי לידה/דרכון. הייצוא לא כולל אותם. הלוגים לא כוללים פרטים אישיים.
- **הצפנה במנוחה:** נוסעים + איש קשר + אסימון הגישה נשמרים ב־KV כ־AES‑256‑GCM (`BOOKING_DATA_KEY`, IV חדש בכל כתיבה, מזהה ההזמנה כ־AAD → אי אפשר להעביר בלוב להזמנה אחרת; שינוי בייט נכשל). בפיתוח בלי מפתח — `data/booking-dev.key` (נוצר פעם אחת, הרשאות 600, מחוץ ל־git). בייצור בלי מפתח — ההזמנה כבויה.
- **שמירה:** טיוטה שלא הושלמה — נמחקת אחרי 24 שעות. אחרי הנסיעה — הפרטים האישיים נמחקים אחרי `BOOKING_PII_RETENTION_DAYS` (ברירת מחדל 90, מינימום 30); הרשומה הכספית (מספר, PNR, סכומים) נשארת לצורכי הנהלת חשבונות.
- **PCI:** האתר לא נוגע בכרטיס (עמוד מתארח בהפניה) → SAQ‑A. אין שליחת כרטיס לספק הטיסות (רק מסגרת הסוכנות).
- **גישה:** אסימון הזמנה אקראי 192 ביט (נשמר כ־SHA‑256) או חשבון הבעלים; ניהול — בעלים בלבד; webhooks — אסימון URL + אימות ספק.

---

## 9. ממשק הזמנה לבונה הטיולים (ולכל דף עתידי)
דפדפן: `import { startBooking } from './booking-client.mjs'` →
`startBooking({ offer: { srk, offerIndex, searchToken, itineraryIndex }, source: 'builder', insurance: true|false })` — יוצר הזמנה, שומר את האסימון במכשיר ומנווט ל־`#/book/<id>`. שגיאות: `offer_unavailable` (410), `rate_limited` (429), `booking_unavailable` (503).
שרת: `POST /api/orders` עם אותו גוף. הבונה מעביר את דגל ביטוח הראל שלו (`pkg.insurance.include`) — בלי UI ביטוח נוסף.
**מלונות:** `kind:'hotel'` מחזיר 501 `hotel_booking_disabled`. כשהספק יאשר הצגה ציבורית (`HOTELS_PUBLIC_DISPLAY`) — מוסיפים `kind:'hotel'` עם מתאם ספק (`hotels/v1` book, scope `write:hotels-book`) לאותה מכונת מצבים; עד אז מלון נשאר "הצעה מנציג".

---

## 10. משתני סביבה
| משתנה | מתי | הערה |
|---|---|---|
| `BOOKING_MODE` | תמיד | `request` (ברירת מחדל) / `mock` / `live` / `off` |
| `BOOKING_DATA_KEY` | ייצור — חובה | 32 בתים אקראיים (hex/base64) — `openssl rand -hex 32`. **לגבות! אובדן = אובדן פרטי ההזמנות הפתוחות** |
| `BOOKING_PII_RETENTION_DAYS` | לא חובה | ברירת מחדל 90 |
| `PAYMENT_PROVIDER` | live | `payme` |
| `PAYME_SELLER_ID`, `PAYME_ENV` (`sandbox`/`live`), `PAYME_API_URL` | live | |
| `PAYMENT_WEBHOOK_SECRET` | live | 32+ תווים אקראיים |
| `SITE_URL` | live, מיילים | `https://…` |
| `CRON_SECRET` | מומלץ | ל־`/api/orders/cron/reconcile` |
| `VOLERO_BOOKING_ENABLED` | live | `true` רק ביום העלייה |
| `BOOKING_SUPPLIER=fake` | פיתוח | בדיקת זמינות מזויפת גם במצב request |

---

## 11. קריטריוני קבלה
| # | קריטריון | איך נבדק |
|---|---|---|
| 1 | אף קריאת כתיבה לספק בפיתוח/בדיקות; מתאם חי מסרב לכתיבה בלי live+enabled | `tests/booking.test.mjs` (חסימת רשת + "live adapter refuses") |
| 2 | ברירת המחדל `request`; live חסר הגדרות → request; mock מסורב בייצור; בלי מפתח בייצור → כבוי | בדיקות "modes", "without an encryption key" |
| 3 | כפתור "להזמנה" בחלון בדיקת המחיר (כולל רב־יעדי) פותח `#/book/<id>` עם המחיר שתומחר בשרת | e2e |
| 4 | ולידציה: שמות לטיניים, תאריך לידה מול סוג נוסע, דרכון כשנדרש, איש קשר; בשרת ובדפדפן | בדיקת "passenger validation" + e2e (שם בעברית נדחה) |
| 5 | מחיר סופי בשקלים + מטבע מקור לפני תשלום, כולל מסים; מחויב רק הסכום שהוצג | "happy path", "price change" (`price_mismatch`) |
| 6 | שינוי מחיר מחייב אישור מחדש; מקום שנגמר → unavailable בלי חיוב | "price change", "seat gone" |
| 7 | כשל ספק אחרי מסגרת → שחרור אוטומטי; שחרור שנכשל → נציג | "supplier failure…" ×2 |
| 8 | timeout → שליפה לפי clientRef, אין הזמנה כפולה | "supplier timeout" |
| 9 | הודעת תשלום: אסימון URL, חתימה, סכום, אידמפוטנטיות | "notifications…", "mock notifications…" |
| 10 | הצפנת פרטים במנוחה, קשורה להזמנה, עמידה בשינוי | "AES-256-GCM" + "stored encrypted" |
| 11 | גישה: בלי אסימון → 404; Origin זר → 403; JSON בלבד; idempotency | "access, CSRF and idempotency" |
| 12 | request: אין תשלום/הזמנה; ליד + מייל; נציג מאשר ידנית עם PNR | "request mode" + e2e |
| 13 | ביטוח הראל — בקשת הצעה בלבד, לא נגבה, מגיע לנציג | "request mode" (ליד), e2e |
| 14 | "ההזמנות שלי" באזור הלקוח ובעמוד `#/orders` | e2e |
| 15 | ניהול: רשימה, פרטים, ציר זמן, פעולות, reconciliation, CSV בלי מסמכים | "request mode", e2e אדמין |
| 16 | עברית + אנגלית, 375 + 1440, בלי גלילה אופקית, נגיש (תוויות, שגיאות מקושרות, מיקוד) | e2e + צילומים ב־`verification/25-booking/` |
| 17 | CSP ללא שינוי (`script-src 'self'`), אין "Volero" בממשק | בדיקות קיימות + e2e (חיפוש טקסט) |
| 18 | `npm test` + `npm run check` ירוקים | CI מקומי |

---

## 12. רשימת עלייה לאוויר (live)
1. **Volero:** להפעיל מסגרת אשראי (`credit`) לחשבון (היום: "no available payment methods"); לבקש **סביבת בדיקה / test provider**; לאשר שימוש ב־`write:flights-book` ו־`write:reservations`, look‑to‑book, ומדיניות void/refund ועמלות; לברר אם `priceModifiers` יידרשו בעתיד (markup).
2. **PayMe:** חשבון סוחר + J5 + תשלומים + ביט/ארנקים; sandbox → בדיקת המתאם (`paymePayments`) מקצה לקצה, כולל `get-sales`, capture חלקי ו־refund; כתובת עמוד הייצור.
3. **משפטי:** עדכון `#/terms` §4–6 להזמנה מקוונת, מנגנון דמי ביטול, חשבוניות (שאלות 17א–17ג ב־open-questions).
4. **חשבוניות/קבלות:** להחליט — מסמכי PayMe או מערכת החשבוניות של העסק; לחבר אחרי capture.
5. **הגדרות:** `BOOKING_DATA_KEY` (לגבות בכספת), `PAYMENT_WEBHOOK_SECRET`, `SITE_URL`, `CRON_SECRET` + Vercel Cron כל 10 דק׳ ל־`/api/orders/cron/reconcile`, Upstash (חובה — הקבצים לא נשמרים ב־Vercel), `EMAIL_*`.
6. **הרצה מבוקרת:** `BOOKING_MODE=live` עם הזמנה אחת אמיתית של הבעלים בתעריף שאינו auto‑ticketable, ביטול שלה בתוך חלון ה־void, ובדיקת ההחזר.
7. **ניטור:** התראה על `needs_agent`, `hold_expiring`, `ticketing_deadline` (היום נראים במסך הניהול ובליד).


---

## 13. עדכון 23.11.2026 — תוספות מלאות, דרכון מלא, נוסעים שמורים, מלון בקליק

**החלטות בעלים:** לאסוף דרכון מלא לכל נוסע תמיד (מחליף את "רק כשהספק דורש" ב־§1.3/§6.2) · להציע את כל התוספות שהספק מחזיר · לאפשר שמירת נוסעים בחשבון.

### 13.1 תוספות (שלב 2 באשף)
- המקור: `pricedOffer.optionalServices` — שירות לכל נוסע (`target`+`passengerIndex`) ולכל מסלול (`TLV-ATH`, `ATH-TLV`, `TLV-TLV` = כל הנסיעה). `backend/booking-supplier.mjs` → `extrasOf()` שומר את **כל** השירותים (לא רק BG): `{bookingCode, kind, from, to, pax, options[{code, description, price}]}`. `pax` = מיקום הנוסע בהזמנה (ADT…, CHD…, INF…).
- קבוצות (`extraKind` ב־`dist/booking-core.mjs`): `bags` (BG) · `cabin` (TS/CY, "Advanced Ancillary Options": תיק אישי, טרולי, עלייה מועדפת) · `seat` (SE) · `sport` ("Flight Extras Options" – Sport Equipment) · `meal` · `other` (כל קטגוריה לא מוכרת – מוצגת בניסוח הספק). כל קבוצה עם אייקון קו ותווית בעברית/אנגלית.
- ניסוח קריא (`extraLabel`): "1 bags - 10Kg total" → "מזוודה אחת · עד 10 ק״ג"; "Both = Personal Item / 40x30x20cm + Hand Luggage / 55x40x23cm / 1 bag max 10Kg + Speedy Boarding" → "הלוך וחזור: תיק אישי קטן (40×30×20 ס״מ) + טרולי לתא הנוסעים עד 10 ק״ג (55×40×23 ס״מ) + עלייה מועדפת למטוס". דפוס לא מוכר → הטקסט המקורי (מנוקה מהמחיר ומ־HTML).
- בחירה: `addons.extras = {bookingCode: optionCode}` → `optionalServiceList` בתמחור החוזר, בבדיקה הסופית לפני ההזמנה ובהזמנה. הסכום הצפוי = מחיר בסיס + סכום התוספות (אין "שינוי מחיר" שווא); `price.extras` בפירוט. לקוחות ישנים ששולחים `bags:{route:code}` עדיין נתמכים (`bagChoice`). כפתור "אותן תוספות לכל הנוסעים" + סכום חי בשקלים.
- `mandatoryServices` (ריק בהקלטות) מוצגים לקריאה בלבד כ"כלולים במחיר".
- `fareDetails.brandedFare[].serviceList` (מושבים, שינוי, ביטול…) הוא מידע על התעריף בלבד, בלי `bookingCode` – לא ניתן להזמנה דרך ה־API, ולכן מוצג בכרטיס הטיסה (תחום אחר) ולא כתוספת לבחירה.

### 13.2 דרכון מלא לכל נוסע
- תמיד: מספר, מדינה מנפיקה, אזרחות, תאריך הנפקה, תוקף, תאריך לידה, מגדר, שם פרטי/משפחה בלטינית. `requirementsFrom()` מחזיר `document: true` תמיד; `supplierDocument` שומר מה הספק עצמו ביקש.
- ולידציה (דפדפן + שרת): תוקף אחרי סוף הנסיעה, אזהרה מתחת ל־6 חודשים; **תאריך הנפקה** – תאריך אמיתי, לא בעתיד, אחרי הלידה, לפני התוקף, ולא יותר מ־~10 שנים לפני התוקף (`issueDateProblem`).
- אחסון: בתוך הבלוב המוצפן של ההזמנה (AES‑256‑GCM, §8). תצוגה: ממוסך (`•••123`) ללקוח **וגם במסך הניהול**; מספר מלא רק בכפתור "הצגת מספרי הדרכון המלאים" (`GET /api/orders/admin/:id/documents`) שנרשם ביומן הביקורת (`documents_viewed`) – הנציג צריך אותו כדי להשלים הזמנה במצב request.
- לספק נשלח רק `identificationDocument {documentType, number, expiryDate, issuingCountry, nationality, issuingDate}` (השדות ש־`BookingTravelerInputType` מקבל).
- עריכה חוזרת של הנוסעים: "להשתמש במספר הדרכון שכבר הוזן •••123" (`document.keep`) – השרת לוקח את המספר מההזמנה; הדפדפן לא מקבל אותו.

### 13.3 נוסעים שמורים (אזור הלקוח, `dist/account-travellers.mjs`)
- `GET/POST /api/account/travellers`, `POST /api/account/travellers/delete` – לקוח מחובר בלבד, עד 12 נוסעים, הסכמה מפורשת בכל שמירה (נשמר טקסט ההסכמה + זמן). כל נוסע מוצפן בנפרד עם מפתח ההזמנות (`BOOKING_DATA_KEY`), AAD = `traveller:<userId>:<id>`; בלי מפתח – כבוי (503).
- הדפדפן מקבל תמיד מספר ממוסך (כולל בייצוא הנתונים). עריכה בלי להקליד מחדש: "להשתמש בדרכון השמור".
- באשף: "בחרו נוסע שמור" לכל נוסע – ממלא הכול; הדרכון נשלח כ־`{useSaved:true, savedId}` והשרת משלים את המספר מהחשבון של המחובר בלבד (מזהה של חשבון אחר לא נפתר → "הקלידו שוב"). תיבת "שמירת הנוסעים לחשבון" + הסכמה; שמירה חוזרת מעדכנת ולא משכפלת.
- מחיקת החשבון מוחקת את הנוסעים השמורים (הם חלק מרשומת המשתמש).

### 13.4 מלון בקליק
- אחרי בקשת/הזמנת טיסה, מסך האישור מציע "הזמינו מלון בקליק": אותו נוסע מוביל ואיש קשר, יעד ותאריכים מהטיסה; בחירה אופציונלית של דירוג/בסיס/הערה. `POST /api/orders/:id/hotel-request` יוצר ליד אחד (`booking:hotel`, בלי פרטי דרכון), פעם אחת להזמנה.
- בבונה הטיולים: טופס "העבירו לנציג" מתמלא אוטומטית בשם/טלפון/מייל מההזמנה האחרונה במכשיר (`prefillFromBooking`, נקרא מהשרת עם אסימון ההזמנה).

### 13.5 בדיקות
- `tests/booking.test.mjs` (תוספות, דרכון, מיסוך, מלון), `tests/saved-travellers.test.mjs` (הצפנה, מיסוך, הסכמה, שימוש בדרכון שמור, מחיקה עם החשבון). e2e: `booking.e2e.mjs` – שלבי דרכון/תוספות/מלון/נוסעים שמורים/מיסוך בניהול. צילומים: `verification/booking-2026-11-23/`.
