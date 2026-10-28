"""Render the project UX specification (its limited Markdown subset), no dependencies."""
from pathlib import Path
import html
import re
root=Path(__file__).resolve().parents[1]
source=root/'docs/ux-specification-he.md'
def inline(value):
    value=html.escape(value)
    value=re.sub(r'`([^`]+)`',r'<code dir="ltr">\1</code>',value)
    return re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',value)
lines=source.read_text().splitlines()
body=[];toc=[];index=0
while index<len(lines):
    line=lines[index]
    if not line.strip(): index+=1;continue
    if line.startswith('# '):
        body.append('<header class="cover"><span class="eyebrow">GERBI · PRODUCT EXPERIENCE</span><h1>'+inline(line[2:])+'</h1><p>מפת המוצר, מסעות המשתמש ואפיון מפורט לכל מסך</p><div class="chips"><span>31 מסכים ומשטחים</span><span>40 פרקי אפיון</span><span>עברית · RTL</span></div></header>')
    elif line.startswith('## '):
        n=len(toc)+1;title=line[3:];toc.append(f'<a href="#section-{n}">{inline(title)}</a>')
        body.append(f'<h2 id="section-{n}">{inline(title)}</h2>')
    elif line.startswith('### '): body.append('<h3>'+inline(line[4:])+'</h3>')
    elif line.startswith('| '):
        rows=[]
        while index<len(lines) and lines[index].startswith('| '):
            cells=[x.strip() for x in lines[index].strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?',x) for x in cells):rows.append(cells)
            index+=1
        body.append('<div class="table-wrap" tabindex="0" role="region" aria-label="טבלת אפיון"><table><thead><tr>'+''.join('<th scope="col">'+inline(c)+'</th>' for c in rows[0])+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+inline(c)+'</td>' for c in row)+'</tr>' for row in rows[1:])+'</tbody></table></div>')
        continue
    elif line.startswith('- ') or re.match(r'^\d+\. ',line):
        ordered=not line.startswith('- ');tag='ol' if ordered else 'ul';items=[]
        while index<len(lines) and (bool(re.match(r'^\d+\. ',lines[index])) if ordered else lines[index].startswith('- ')):
            items.append('<li>'+inline(re.sub(r'^(?:- |\d+\. )','',lines[index]))+'</li>');index+=1
        body.append('<'+tag+'>'+''.join(items)+'</'+tag+'>');continue
    else:body.append('<p>'+inline(line)+'</p>')
    index+=1
css='''
:root{color-scheme:light;--ink:#14294b;--blue:#086cc7;--line:#dbe5ef;--muted:#52657a}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:24px}body{margin:0;background:#f4f7fb;color:var(--ink);font:17px/1.9 Arial,sans-serif}a{color:var(--blue)}.layout{max-width:1440px;margin:auto;display:grid;grid-template-columns:285px minmax(0,1fr);gap:28px;padding:28px}aside{position:sticky;top:24px;align-self:start;max-height:calc(100vh - 48px);overflow:auto;background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px}summary{font-size:18px;font-weight:bold;cursor:pointer}nav{display:grid;margin-top:14px;gap:2px}nav a{text-decoration:none;color:var(--muted);font-size:13px;line-height:1.65;padding:7px 8px;border-radius:6px}nav a:hover,nav a:focus{background:#eaf3ff;color:var(--blue)}main{min-width:0;background:white;border:1px solid var(--line);border-radius:22px;padding:48px 50px}.cover{background:#eaf4ff;border-top:5px solid #ffdf27;padding:34px;border-radius:16px;margin-bottom:30px}.eyebrow{font-size:12px;letter-spacing:2px;color:var(--blue)}h1{font-size:39px;line-height:1.25;margin:14px 0}.cover p{color:var(--muted);font-size:18px}.chips{display:flex;gap:8px;flex-wrap:wrap}.chips span{background:#fff;padding:5px 12px;border-radius:30px;font-size:12px}h2{font-size:27px;line-height:1.4;border-top:1px solid var(--line);padding-top:32px;margin:44px 0 18px;scroll-margin-top:24px}h3{font-size:21px;margin-top:28px}p{margin:14px 0}li{padding-inline-start:4px;margin-bottom:10px}strong{color:#102b50}code{font-size:13px;background:#eef3f7;padding:3px 5px;border-radius:4px;unicode-bidi:isolate;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font-size:14px;line-height:1.65}th,td{text-align:right;padding:12px;border:1px solid var(--line);vertical-align:top}th{background:#eaf3ff}tr:nth-child(even){background:#f8fafc}.table-wrap{overflow:auto;margin:22px 0}.tools{display:flex;gap:12px;align-items:center;margin-bottom:24px;font-size:13px}.tools button{background:var(--blue);color:white;border:0;border-radius:8px;padding:10px 18px;font:inherit;cursor:pointer}.skip{position:absolute;top:-100px}.skip:focus{top:5px;background:white;padding:12px;z-index:5}:focus-visible{outline:3px solid #b56c00;outline-offset:3px}@media(max-width:1000px){.layout{grid-template-columns:220px 1fr;padding:16px;gap:16px}main{padding:28px}}@media(max-width:760px){.layout{display:block;padding:12px}aside{position:static;max-height:270px;margin-bottom:14px;padding:14px}main{padding:22px 18px}.cover{padding:22px}h1{font-size:30px}h2{font-size:24px}body{font-size:16px}th,td{min-width:130px}}@media print{aside,.tools,.skip{display:none}.layout{display:block;padding:0}main{padding:0;border:0}.cover{break-after:avoid}body{font-size:11pt;background:white}h2,h3{break-after:avoid}tr{break-inside:avoid}.table-wrap{overflow:visible}a{color:inherit}h2{margin-top:25px}*{print-color-adjust:exact}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
'''
output='<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ג׳רבי — אפיון UX מלא</title><style>'+css+'</style></head><body><a class="skip" href="#content">דילוג לאפיון</a><div class="layout"><aside><details open><summary>תוכן עניינים</summary><nav aria-label="פרקי האפיון">'+''.join(toc)+'</nav></details></aside><main id="content"><div class="tools"><button onclick="window.print()">הדפסה / שמירה כ־PDF</button><span>גרסה 1.0 · 20.10.2026</span></div>'+''.join(body)+'</main></div></body></html>'
(root/'docs/ux-specification-he.html').write_text(output)
print(f'Rendered {len(toc)} sections; {len(output):,} characters')
