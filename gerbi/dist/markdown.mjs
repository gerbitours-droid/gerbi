// A deliberately small Markdown → HTML renderer for owner-written blog posts (spec 18 §6).
// Everything is escaped first; only an allow-list of syntax becomes markup, and only allow-listed URLs become links.
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Works on already-escaped text: quotes and angle brackets cannot appear, so the value is attribute-safe.
const LINK_OK = /^(https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[\d-]+|#\/[^\s]*|\/(?![\/\\])[^\s\\]*)$/i;
const IMAGE_OK = /^(https:\/\/[^\s]+|\/assets\/[\w./-]+|\/api\/content\/cover\/[\w-]+(\?v=[\w]+)?)$/i;
export const safeLink = (url) => (LINK_OK.test(url) ? url : '');
export const safeImage = (url) => (IMAGE_OK.test(url) ? url : '');

function inline(raw) {
  const tokens = [];
  const hold = (html) => `\u0000${tokens.push(html) - 1}\u0000`;
  let text = esc(raw.replace(/\u0000/g, ''));
  text = text.replace(/`([^`]+)`/g, (_, code) => hold(`<code>${code}</code>`));
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (all, alt, url) => (safeImage(url) ? hold(`<img src="${url}" alt="${alt}" loading="lazy">`) : all));
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (all, label, url) => {
    if (!safeLink(url)) return label;
    const external = /^https?:/i.test(url);
    return hold(`<a href="${url}"${external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''}>${label}</a>`);
  });
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>');
  return text.replace(/\u0000(\d+)\u0000/g, (_, i) => tokens[Number(i)]);
}

export function renderMarkdown(source = '') {
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let paragraph = [], list = null, quote = [];
  const flush = () => {
    if (paragraph.length) { out.push(`<p>${paragraph.map(inline).join('<br>')}</p>`); paragraph = []; }
    if (list) { out.push(`<${list.tag}>${list.items.map((item) => `<li>${inline(item)}</li>`).join('')}</${list.tag}>`); list = null; }
    if (quote.length) { out.push(`<blockquote>${quote.map(inline).join('<br>')}</blockquote>`); quote = []; }
  };
  for (const line of lines) {
    const trimmed = line.trim();
    let match;
    if (!trimmed) { flush(); continue; }
    if ((match = /^(#{1,3})\s+(.+)$/.exec(trimmed))) { flush(); const level = match[1].length === 3 ? 3 : 2; out.push(`<h${level}>${inline(match[2])}</h${level}>`); continue; }
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) { flush(); out.push('<hr>'); continue; }
    if ((match = /^>\s?(.*)$/.exec(trimmed))) { if (paragraph.length || list) flush(); quote.push(match[1]); continue; }
    const bullet = /^[-*]\s+(.+)$/.exec(trimmed), ordered = /^\d+[.)]\s+(.+)$/.exec(trimmed);
    if (bullet || ordered) {
      const tag = bullet ? 'ul' : 'ol';
      if (paragraph.length || quote.length || (list && list.tag !== tag)) flush();
      list ||= { tag, items: [] };
      list.items.push((bullet || ordered)[1]);
      continue;
    }
    if (list || quote.length) flush();
    paragraph.push(trimmed);
  }
  flush();
  return out.join('\n');
}

// Plain text for excerpts and reading time.
export const markdownText = (source = '') => String(source).replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[#>*`_-]+/g, ' ').replace(/\s+/g, ' ').trim();
export const readingMinutes = (source = '') => Math.max(1, Math.round(markdownText(source).split(' ').filter(Boolean).length / 180));
