// Splits a research thrust's markdown body into the two steps of its scroll
// story: first the prose (every "## Heading" with its paragraphs, e.g.
// Motivation and Approach), then all the bullets together as one numbered
// list. Bullets written as "**Label:** text" take the label as their title;
// the labels also name the stages of the loop artwork, which light up as
// the loop passes them (`stage` = number of bullets, kept on each step).
//
// Only the markdown used in src/content/research is handled: headings,
// paragraphs, "- " bullets, **bold**, *italic*, `code` and [links](url).

export type Step = { kicker: string; html: string; stage: number };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const inline = (s: string) =>
  esc(s.replace(/\s+/g, ' ').trim())
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

export function storySteps(body: string): { steps: Step[]; labels: string[] } {
  const sections: { heading: string; paras: string[]; bullets: string[] }[] = [];
  let sec = { heading: '', paras: [] as string[], bullets: [] as string[] };
  let cur: string[] | null = null; // the paragraph or bullet being continued

  for (const line of body.split(/\r?\n/)) {
    const h = line.match(/^#{2,3}\s+(.+)/);
    if (h) {
      if (sec.heading || sec.paras.length || sec.bullets.length) sections.push(sec);
      sec = { heading: h[1].trim(), paras: [], bullets: [] };
      cur = null;
    } else if (!line.trim()) {
      cur = null;
    } else if (/^\s*[-*]\s+/.test(line)) {
      sec.bullets.push(line.replace(/^\s*[-*]\s+/, ''));
      cur = sec.bullets;
    } else if (cur) {
      cur[cur.length - 1] += ' ' + line.trim();
    } else {
      sec.paras.push(line.trim());
      cur = sec.paras;
    }
  }
  sections.push(sec);

  let prose = '';
  for (const { heading, paras } of sections) {
    if (!paras.length) continue;
    if (heading) prose += `<h3>${inline(heading)}</h3>`;
    prose += paras.map((p) => `<p>${inline(p)}</p>`).join('');
  }

  const labels: string[] = [];
  let items = '';
  for (const b of sections.flatMap((s) => s.bullets)) {
    const m = b.match(/^\*\*(.+?):?\*\*:?\s*(.*)$/);
    const n = String(labels.length + 1).padStart(2, '0');
    labels.push(m ? m[1] : `Step ${labels.length + 1}`);
    // "**Label:** automated preparation…" reads as a sentence once split
    const text = m ? m[2].charAt(0).toUpperCase() + m[2].slice(1) : b;
    items += `<li><span class="r-approach-num">${n}</span><div>`
      + (m ? `<h4>${inline(m[1])}</h4>` : '')
      + `<p>${inline(text)}</p></div></li>`;
  }

  const steps: Step[] = [];
  if (prose) steps.push({ kicker: '', html: prose, stage: -1 });
  if (items) {
    const heading = sections.find((s) => s.bullets.length)?.heading ?? '';
    steps.push({ kicker: heading, html: `<ol class="r-approach">${items}</ol>`, stage: labels.length });
  }
  return { steps, labels };
}
