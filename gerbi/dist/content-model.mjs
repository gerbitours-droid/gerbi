// Owner-editable content (spec 18 §4): one validator shared by the admin page (inline errors) and the server (the gate).
// Site content is stored as overrides only; an empty field means "use the built-in default".
import { trips, contact } from './data.mjs';
import { safeLink } from './markdown.mjs';

export const SITE_DEFAULTS = {
  hero: { title: 'החופשה שלכם מתחילה כאן', subtitle: 'טיסות, מלונות וחבילות נופש – הכול במקום אחד, עם ג׳רבי טורס.' },
  contact: { ...contact },
  footer: { tagline: 'כל חופשה מתחילה בחיוך.', blurb: 'מתכננים יחד, בקצב שלכם.', legal: '© 2026 ג׳רבי טורס · גרסת הדגמה מקומית. מחירים ושירותים טעונים אימות.', note: 'גרסת הדגמה · המחירים אינם הצעה להזמנה' },
  banner: { enabled: false, text: '', link: '' },
  faqs: [],
  guides: {}
};
export const GUIDE_FIELDS = [['fit', 'למי זה מתאים'], ['less', 'פחות מתאים ל'], ['stay', 'איפה לישון'], ['move', 'להתנייד'], ['season', 'מתי לנסוע'], ['budget', 'מה מייקר את החופשה']];
export const GUIDE_IDS = trips.map((t) => t.id);
export const LIMITS = { siteJson: 60_000, title: 120, category: 40, excerpt: 300, body: 40_000, tag: 30, tags: 8, seoTitle: 70, seoDescription: 160, cover: 500, coverData: 350_000, faqs: 30, faqQ: 200, faqA: 1500, guide: 600, banner: 200, hero: 160, footer: 200 };
export const POST_STATUSES = ['draft', 'published'];
export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
const COVER_RE = /^(https:\/\/[^\s"'<>]+|\/assets\/[\w./-]+|\/api\/content\/cover\/[a-z0-9-]+(\?v=\w+)?)$/;
export const COVER_DATA_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

const str = (value) => (typeof value === 'string' ? value.trim() : value == null ? '' : null);
// A text field: '' is allowed (= default), wrong type or too long is an error. Control characters are removed.
function text(errors, key, value, max, { multiline = false } = {}) {
  const s = str(value);
  if (s === null) { errors[key] = 'סוג ערך לא תקין'; return ''; }
  const clean = s.replace(multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, '');
  if (clean.length > max) { errors[key] = `עד ${max} תווים`; return ''; }
  return clean;
}

export function slugFromTitle(title, now = new Date()) {
  const latin = String(title || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50).replace(/-+$/, '');
  if (latin.length >= 3) return latin;
  return `post-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6)}`;
}

// Returns { site, errors }: site holds only the fields that differ from "use the default".
export function normalizeSite(input) {
  const errors = {}, site = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { site: null, errors: { form: 'תוכן לא תקין' } };
  const group = (name) => (input[name] && typeof input[name] === 'object' && !Array.isArray(input[name]) ? input[name] : {});
  const put = (section, key, value) => { if (value) (site[section] ||= {})[key] = value; };
  const hero = group('hero');
  put('hero', 'title', text(errors, 'hero.title', hero.title, LIMITS.hero));
  put('hero', 'subtitle', text(errors, 'hero.subtitle', hero.subtitle, LIMITS.hero * 2));
  const c = group('contact');
  const whatsapp = text(errors, 'contact.whatsapp', c.whatsapp, 20).replace(/[\s+-]/g, '');
  if (whatsapp && !/^\d{8,15}$/.test(whatsapp)) errors['contact.whatsapp'] = 'ספרות בלבד בפורמט בינלאומי, למשל 972501234567';
  else put('contact', 'whatsapp', whatsapp);
  const phone = text(errors, 'contact.phone', c.phone, 20).replace(/[\s()-]/g, '');
  if (phone && !/^\+?\d{7,15}$/.test(phone)) errors['contact.phone'] = 'מספר טלפון לא תקין';
  else put('contact', 'phone', phone);
  const email = text(errors, 'contact.email', c.email, 120);
  if (email && !/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email)) errors['contact.email'] = 'כתובת מייל לא תקינה';
  else put('contact', 'email', email);
  const f = group('footer');
  for (const key of ['tagline', 'blurb', 'legal', 'note']) put('footer', key, text(errors, `footer.${key}`, f[key], LIMITS.footer));
  const b = group('banner');
  if (b.enabled !== undefined && typeof b.enabled !== 'boolean') errors['banner.enabled'] = 'סוג ערך לא תקין';
  const bannerText = text(errors, 'banner.text', b.text, LIMITS.banner), link = text(errors, 'banner.link', b.link, 300);
  if (link && !safeLink(link)) errors['banner.link'] = 'קישור חייב להתחיל ב־https:// או ב־#/';
  if (b.enabled === true && !bannerText) errors['banner.text'] = 'כדי להציג באנר צריך טקסט';
  if (b.enabled === true || bannerText || link) site.banner = { enabled: b.enabled === true, text: bannerText, link: errors['banner.link'] ? '' : link };
  if (input.faqs !== undefined) {
    if (!Array.isArray(input.faqs) || input.faqs.length > LIMITS.faqs) errors.faqs = `עד ${LIMITS.faqs} שאלות`;
    else {
      const faqs = input.faqs.map((item, i) => ({ q: text(errors, `faqs.${i}.q`, item?.q, LIMITS.faqQ), a: text(errors, `faqs.${i}.a`, item?.a, LIMITS.faqA, { multiline: true }) }))
        .filter((item, i) => { if (!item.q && !item.a) return false; if (!item.q || !item.a) errors[`faqs.${i}`] = 'צריך גם שאלה וגם תשובה'; return true; });
      if (faqs.length) site.faqs = faqs;
    }
  }
  const guides = group('guides');
  for (const id of Object.keys(guides)) {
    if (!GUIDE_IDS.includes(id)) { errors[`guides.${id}`] = 'יעד לא מוכר'; continue; }
    const g = guides[id] && typeof guides[id] === 'object' ? guides[id] : {};
    for (const [key] of GUIDE_FIELDS) { const value = text(errors, `guides.${id}.${key}`, g[key], LIMITS.guide, { multiline: true }); if (value) ((site.guides ||= {})[id] ||= {})[key] = value; }
  }
  if (JSON.stringify(site).length > LIMITS.siteJson) errors.form = 'התוכן ארוך מדי';
  return Object.keys(errors).length ? { site: null, errors } : { site, errors };
}

// Deep merge of defaults with stored overrides (both sides use it, so the site renders identically everywhere).
export function mergeSite(overrides) {
  const o = overrides && typeof overrides === 'object' ? overrides : {};
  return {
    hero: { ...SITE_DEFAULTS.hero, ...o.hero }, contact: { ...SITE_DEFAULTS.contact, ...o.contact }, footer: { ...SITE_DEFAULTS.footer, ...o.footer },
    banner: { ...SITE_DEFAULTS.banner, ...o.banner }, faqs: Array.isArray(o.faqs) ? o.faqs : [], guides: o.guides && typeof o.guides === 'object' ? o.guides : {}
  };
}

// Returns { post, errors }. coverData (an uploaded image) is validated separately by the server.
export function normalizePost(input, slug) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { post: null, errors: { form: 'פוסט לא תקין' } };
  if (!SLUG_RE.test(String(slug || ''))) errors.slug = 'אותיות לטיניות קטנות, ספרות ומקפים בלבד (עד 60)';
  const post = { slug: String(slug || '') };
  post.title = text(errors, 'title', input.title, LIMITS.title);
  if (!post.title && !errors.title) errors.title = 'חובה';
  post.category = text(errors, 'category', input.category, LIMITS.category);
  post.excerpt = text(errors, 'excerpt', input.excerpt, LIMITS.excerpt, { multiline: true });
  post.body = text(errors, 'body', input.body, LIMITS.body, { multiline: true });
  if (!post.body && !errors.body) errors.body = 'חובה';
  post.cover = text(errors, 'cover', input.cover, LIMITS.cover);
  if (post.cover && !COVER_RE.test(post.cover)) errors.cover = 'קישור תמונה חייב להתחיל ב־https://';
  const tags = input.tags == null ? [] : Array.isArray(input.tags) ? input.tags : typeof input.tags === 'string' ? input.tags.split(',') : null;
  if (!tags) errors.tags = 'סוג ערך לא תקין';
  else {
    post.tags = [...new Set(tags.map((tag, i) => text(errors, `tags.${i}`, tag, LIMITS.tag)).filter(Boolean))];
    if (post.tags.length > LIMITS.tags) errors.tags = `עד ${LIMITS.tags} תגיות`;
  }
  post.publishDate = text(errors, 'publishDate', input.publishDate, 10);
  if (post.publishDate && (!/^\d{4}-\d{2}-\d{2}$/.test(post.publishDate) || Number.isNaN(Date.parse(post.publishDate)))) errors.publishDate = 'תאריך לא תקין';
  post.status = POST_STATUSES.includes(input.status) ? input.status : 'draft';
  post.seoTitle = text(errors, 'seoTitle', input.seoTitle, LIMITS.seoTitle);
  post.seoDescription = text(errors, 'seoDescription', input.seoDescription, LIMITS.seoDescription, { multiline: true });
  post.builtin = input.builtin === true;
  return Object.keys(errors).length ? { post: null, errors } : { post, errors };
}

// Published and due (publish date today or earlier, in Israel time).
export const israelToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(now);
export const isLive = (post, today = israelToday()) => post?.status === 'published' && (!post.publishDate || post.publishDate <= today);
export const postState = (post, today = israelToday()) => (post.status !== 'published' ? 'draft' : isLive(post, today) ? 'published' : 'scheduled');
