// A destination's clock relative to Israel ("שעה אחת יותר מבישראל" / "1 hour ahead of Israel"), for the date it
// matters (daylight saving differs between countries). Pure; safe in Node and the browser.
import { t, lang as pageLang } from './i18n.mjs';

// Minutes east of UTC for an IANA zone at a moment, or null when the zone is unknown.
export function offsetMinutes(timeZone, at = new Date()) {
  try {
    const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName')?.value || '';
    if (name === 'GMT') return 0;
    const m = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(name);
    return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : null;
  } catch { return null; }
}

export function timeVsIsrael(timeZone, at = new Date(), l = pageLang) {
  const there = offsetMinutes(timeZone, at), here = offsetMinutes('Asia/Jerusalem', at);
  if (there === null || here === null) return String(timeZone || '').replace(/_/g, ' ');
  const diff = (there - here) / 60;
  if (!diff) return t('build.tz.same', {}, l);
  return t(diff > 0 ? 'build.tz.ahead' : 'build.tz.behind', { hours: Math.abs(diff) }, l);
}
