// Spec 21: a bare Hebrew homepage visit follows the remembered language (same rule as i18n.mjs
// shouldRedirectToEnglish). A classic script in <head> so it runs before the page paints; external because
// the CSP allows no inline scripts.
try {
  if (localStorage.getItem('gerbi-lang') === 'en' && (location.pathname === '/' || location.pathname === '/index.html') && (!location.hash || location.hash === '#/')) location.replace('/en/');
} catch (e) { /* no storage: stay on the page */ }
