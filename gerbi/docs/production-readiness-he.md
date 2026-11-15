# ג׳רבי — מוכנות לפרודקשן

29.10.2026 · מה כבר מוכן, מה חסר, ומי צריך לעשות מה.

**השורה התחתונה:** חיפוש הטיסות, הדירוג, ההבנה של בקשה חופשית והשמירה מוכנים טכנית. כדי לעלות לציבור חסרים: מפתחות ומשתנים ב־Vercel, אחסון קבוע (Upstash), ערוץ קשר עסקי, הסרת נעילת Vercel ודומיין, אישור חוזי מ־Volero על שימוש פומבי, ומסמכים משפטיים. הזמנה ותשלום באתר עדיין לא קיימים — המסלול הנוכחי הוא חיפוש → בדיקת מחיר → שמירה → פנייה לסוכן.

## 1. מפתחות API — איפה ואיך

| משתנה | מה | חובה? | איפה משיגים |
|---|---|---|---|
| `VOLERO_CLIENT_ID`, `VOLERO_CLIENT_SECRET` | חיפוש ובדיקת מחיר | כן | Volero (חשבון ה־reseller) |
| `OPENROUTER_API_KEY` | שותף AI ראשי (Qwen3.8 Max) | מומלץ | openrouter.ai → Keys |
| `DEEPSEEK_API_KEY` | שותף AI גיבוי | מומלץ | platform.deepseek.com → API keys |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | זיכרון שאילתות, מטמון AI ולמידה שנשמרים בין הפעלות | כן לפרודקשן | upstash.com → Redis → REST API (יש שכבה חינמית) |
| `GERBI_LLM_MODEL` | החלפת מודל (למשל `qwen/qwen3.8-flash`, זול פי 13) | לא | — |
| `GERBI_LLM_DAILY_TOKENS` | תקרת טוקנים ליום (ברירת מחדל 200,000) | לא | — |
| `VOLERO_BOOKING_ENABLED` | להשאיר `false` עד שיש תהליך הזמנה ותשלום | — | — |
| `LEADS_ADMIN_TOKEN` | מפתח לצפייה בפניות (טופס צור קשר וטיולים בהתאמה אישית) בדף `/leads-admin` וב־`GET /api/leads` (Bearer). בלי המשתנה, הצפייה כבויה (404) | כן, כדי לקרוא פניות | ליצור מחרוזת אקראית ארוכה: `openssl rand -hex 32` |
| `LEADS_WEBHOOK_URL` | התראה על כל פנייה חדשה: השרת שולח POST עם JSON (`{event:'lead.created', lead}`) לכתובת הזו, עד 3 שניות, וכישלון לא מפיל את השליחה | לא | Make / Zapier / n8n / Slack Workflow webhook |
| `EMAIL_PROVIDER` | שליחת מיילים לחשבונות לקוח (קוד כניסה, איפוס סיסמה): `resend` או `webhook`. ריק = אין מיילים; האתר מציג "שכחתם סיסמה? צרו קשר עם נציג" ואין כניסה עם קוד | לא | — |
| `EMAIL_API_KEY`, `EMAIL_FROM` | עם `resend`: מפתח API וכתובת שולח מדומיין מאומת (למשל `ג׳רבי טורס <no-reply@gerbitours.co.il>`) | עם `resend` | resend.com → API Keys + Domains |
| `EMAIL_WEBHOOK_URL`, `EMAIL_WEBHOOK_SECRET` | עם `webhook`: POST `{to,subject,text}` (Bearer אם יש סוד) ל־Make/Zapier/n8n ששולחים את המייל | עם `webhook` | — |
| `SITE_URL` | הכתובת הקנונית של האתר (`https://…`). קישורי איפוס סיסמה נבנים רק ממנה; בלעדיה האיפוס כבוי גם אם יש מיילים | לאיפוס סיסמה | הדומיין שלכם |
| `ACCOUNT_TRUSTED_ORIGINS` | מקורות נוספים (מופרדים בפסיקים) שמותר להם לשלוח בקשות חשבון, אם האתר זמין ביותר מדומיין אחד | לא | — |

**חשבונות לקוח (אזור אישי, אפיון `docs/specs/17-customer-area-he.md`):** נשמרים ב־KV במרחב `gerbi:accounts:*` (משתמשים, סשנים מגובבים עם תפוגה של 30 יום, קודים, אינדקס פניות לפי מייל). **בפרודקשן חובה Upstash**, אחרת חשבונות וסשנים נעלמים בין מופעים. העוגייה `__Host-gerbi_sid` (HttpOnly, Secure, SameSite=Lax) מופעלת אוטומטית ב־Vercel (`VERCEL` או `NODE_ENV=production`). מקומית: `gerbi/data/accounts.json`. סיסמאות ב־scrypt; אין צורך במפתח סודי נוסף.
| `FX_PROVIDER` | מקור שער ההמרה לשקלים: `leumi` (ברירת מחדל — שער העברות והמחאות – מכירה, JSON ציבורי של בנק לאומי) או `boi` (שער יציג של בנק ישראל + מרווח). השני תמיד משמש גיבוי | לא | — |
| `FX_SALE_MARKUP_PCT` | מרווח המכירה מעל השער היציג כשמשתמשים בבנק ישראל. ברירת מחדל `1.2` (נמדד 13.11.2026: מרווח העברות–מכירה בלאומי 1.03%–1.16% מעל היציג; מעוגל מעט למעלה כדי לא להציג פחות ממה שהלקוח ישלם). טווח 0–5 | לא | — |
| `FX_REFRESH_HOURS` | כל כמה שעות לרענן את השערים (ברירת מחדל 4; 0.25–24). בין רענונים מוגש מהמטמון | לא | — |
| `WHATSAPP_VERIFY_TOKEN` | בוט שירות בוואטסאפ: מחרוזת שאתם בוחרים ומזינים גם ב־Meta בהגדרת ה־webhook (`https://<דומיין>/api/whatsapp/webhook`) | רק לוואטסאפ | ליצור: `openssl rand -hex 16` |
| `WHATSAPP_APP_SECRET` | בדיקת החתימה `X-Hub-Signature-256` של כל webhook | רק לוואטסאפ | developers.facebook.com → האפליקציה → App settings → Basic → App secret |
| `WHATSAPP_TOKEN` | שליחת תשובות דרך Graph API | רק לוואטסאפ | Business Settings → System users → טוקן קבוע עם `whatsapp_business_messaging` |
| `WHATSAPP_PHONE_NUMBER_ID` | מזהה המספר העסקי ששולח | רק לוואטסאפ | WhatsApp Manager → API Setup → Phone number ID |
| `WHATSAPP_GRAPH_URL` | ברירת מחדל `https://graph.facebook.com/v21.0`; הסימולטור מחליף לשרת מקומי | לא | — |
| `PUBLIC_SITE_URL` | כתובת האתר המלאה, כדי שקישורים בתשובות הוואטסאפ יהיו לחיצים | לא | למשל `https://gerbi.example` |

**פניות (לידים):** נשמרות ב־Upstash (המפתח `gerbi:leads:all`, עד 5,000 אחרונות). בלי Upstash ב־Vercel הן נשמרות רק בזיכרון של מופע הפונקציה ועלולות להיעלם — לכן בפרודקשן חובה Upstash, או לפחות `LEADS_WEBHOOK_URL` שמעביר כל פנייה החוצה. מקומית: `gerbi/data/leads.json` (לא ב־Git). הגבלה: 5 פניות ל־10 דקות לכל כתובת IP, ושדה מלכודת לבוטים.

**מחירים בשקלים (אפיון 13, `docs/specs/13-pricing-ils-he.md`):** מחירי הספק מומרים לשקלים לפי שער העברות והמחאות – מכירה. `GET /api/fx` מחזיר את השערים, המקור והתאריך (מטמון בזיכרון + Upstash במפתח `gerbi:fx:latest`, רענון ברקע, שער ישן מוגש כשהמקור נופל, ואם אין שער בכלל — `ok:false` והאתר מציג מטבע ספק). שער ידני של הבעלים: `PUT /api/fx/override` עם `Authorization: Bearer $LEADS_ADMIN_TOKEN` וגוף `{"rates":{"USD":3.25},"note":"...","expiresAt":"..."}` (רשות), ביטול ב־`DELETE /api/fx/override`; נשמר ב־`gerbi:fx:override` וגובר על השער האוטומטי לכל מטבע שנקבע. מחשבון המרה: `#/converter`.

**כללים:**
1. מפתחות רק ב־`gerbi/.env` (מקומי, לא נכנס ל־Git) וב־Vercel → Project → Settings → Environment Variables. לא בקוד, לא בדפדפן.
2. ב־Vercel: לסמן Production (ו־Preview אם בודקים שם), לשמור, ואז Deployments → Redeploy — משתנים חדשים נכנסים רק בפריסה הבאה.
3. מפתח נפרד לפיתוח ולפרודקשן, כדי שבדיקות מקומיות לא ישרפו את מכסת האתר.
4. תקרות הוצאה אצל הספק: ב־OpenRouter להגדיר limit למפתח; ב־DeepSeek לטעון יתרה קטנה. בנוסף יש תקרה יומית באתר.
5. אחרי הוספה: `node scripts/check-providers.mjs` בודק קריאה אמיתית לכל ספק (זמן, טוקנים, JSON תקין). ב־Vercel: `/api/status` מראה `partner.available` ו־`supplier.connected`.

**בוט שירות לקוחות (מפרט 16, `docs/specs/16-support-bot-he.md`):** עובד באתר בלי שום מפתח. העברות לנציג נשמרות כפנייה `type:'support'` ב־`gerbi:leads:all` (ולכן מגיעות גם ל־`LEADS_WEBHOOK_URL`) וכרשומת הסלמה ב־`gerbi:support-escalations:*`; שיחות ב־`gerbi:support-conversations:*` עם תפוגה של 90 יום; נוסחי התשובות ושעות הפעילות שבעל העסק עורך ב־`gerbi:support-content:faq` (`PUT /api/support/content`). ממשק הניהול קורא `GET /api/support/escalations` עם `LEADS_ADMIN_TOKEN`. **שעות הפעילות ופרטי הקשר הם ממלאי מקום** עד שהעסק יספק אמיתיים. וואטסאפ נדלק רק כשכל ארבעת משתני `WHATSAPP_*` מוגדרים (אחרת `/api/whatsapp/webhook` מחזיר 404). בדיקה בלי Meta: `node scripts/simulate-whatsapp.mjs`. ב־Meta: להירשם ל־webhook field `messages`. הבוט עונה רק בתוך חלון 24 השעות שנפתח בהודעת הלקוח; פנייה יזומה אחרי 24 שעות דורשת תבנית מאושרת (לא מומש).

## 2. מה כבר מוכן

| תחום | מצב |
|---|---|
| חיפוש Volero | נתונים מאומתים בשרת לפני שליחה; תשובה מקוצרת מ־~6.5MB ל־100KB ברשת (קיצוץ + gzip); מטמון 3 דק׳ לחיפוש זהה ואיחוד בקשות כפולות; ניסיון חוזר אחד בכשל חולף; מגבלת קצב לכל לקוח; יומן JSON לכל קריאה |
| הזמנה | חסומה בשרת אלא אם `VOLERO_BOOKING_ENABLED=true` |
| הבנת בקשה | 100% על 60 בקשות מסומנות (40 כוונון + 20 מוחזקות) |
| דירוג | עלות כוללת, 0 היפוכי סדר, 6/6 מקרי פשרה, למידה חסומה מבחירות |
| שותף AI | נקרא רק כשצריך, במטמון, עם תקרה, מפסק ונפילה לספק הבא; בלי מפתח — דטרמיניסטי |
| בדיקות | 69 בדיקות יחידה (`npm test`) + 6 תסריטי דפדפן חיים (`tests/e2e/`) |

## 3. מה חסר — לפי סדר

| # | פריט | מי | חוסם עלייה? |
|---|---|---|---|
| 1 | משתני סביבה ב־Vercel (טבלה 1) + Redeploy | אתה | כן |
| 2 | Upstash Redis — בלי זה הזיכרון והלמידה נמחקים בין הפעלות | אתה (5 דק׳) | כן |
| 3 | **Volero:** אישור שהפרטים הם לסביבת ייצור, מותר שימוש פומבי, מגבלות קצב וחיפוש־להזמנה (look-to-book), ומותר מטמון של 3 דק׳ | אתה מול Volero | כן |
| 4 | ערוץ קשר עסקי (וואטסאפ/מייל) ל־`dist/data.mjs` — כרגע אין לאן לשלוח טיסה שמורה | אתה נותן, אני מחבר | כן |
| 5 | הסרת Deployment Protection ב־Vercel + דומיין משלכם | אתה | כן |
| 6 | מסמכים משפטיים: מדיניות פרטיות (חוק הגנת הפרטיות ותיקון 13), תנאי שימוש, הצהרת נגישות ורכז נגישות (תקנות הנגישות לשירות) — לבדיקת עו״ד | עו״ד | כן |
| 7 | ניטור: התראה כש־`/api/status` מראה שגיאת ספק או שהאתר לא עונה (למשל UptimeRobot חינמי) | אתה מגדיר, אני יכול להכין | מומלץ |
| 8 | מגבלת קצב משותפת לכל המופעים (היום לכל מופע בנפרד) — דרך Upstash | אני, אחרי 2 | מומלץ |
| 9 | תוכן היעדים — בדיקה של מישהו מהעסק | אתם | מומלץ |
| 10 | הזמנה ותשלום באתר (סליקה מאובטחת, הנפקת כרטיסים מול Volero, ביטולים) | פרויקט נפרד | לא — רק אם רוצים מכירה ישירה |

## 4. בדיקה אחרי שהכול מוגדר

```sh
node scripts/check-providers.mjs          # שותף AI אמיתי
curl https://<הדומיין>/api/status          # connected, partner.available, storage: upstash
node scripts/eval-understanding.mjs --holdout
npm test
```
