import { getCollection, type CollectionEntry } from 'astro:content';

type Pub = CollectionEntry<'publications'>;

const effectiveDate = (data: Pub['data']) => data.date ?? new Date(data.year, 0, 1);

// All publications, newest first.
export async function getPublications() {
  return (await getCollection('publications')).sort(
    (a, b) =>
      effectiveDate(b.data).valueOf() - effectiveDate(a.data).valueOf() ||
      a.data.title.localeCompare(b.data.title),
  );
}

// Bold the group's own authors so readers can find them in long lists.
const GROUP_AUTHORS = [
  /^zheng,?\s*d(\.|aniel)/i, // CV style: "Zheng, D. J."
  /daniel\s*j?\.?\s*zheng/i, // full-name style
];
export const isGroupAuthor = (name: string) => GROUP_AUTHORS.some((re) => re.test(name));

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
export const sharesFirstAuthorship = (name: string, list?: string[]) =>
  (list ?? []).some((n) => norm(n) === norm(name));

// Link the title to wherever the paper actually lives: the published
// version (DOI) first, then a PDF, then an arXiv preprint.
export const pubUrl = (data: Pub['data']) => {
  if (data.doi) return data.doi.startsWith('http') ? data.doi : `https://doi.org/${data.doi}`;
  if (data.pdf) return data.pdf;
  if (data.arxiv) return `https://arxiv.org/abs/${data.arxiv}`;
  return undefined;
};
