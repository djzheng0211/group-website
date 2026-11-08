import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Accepts either a bare string ("Kreamer Fellow") or an object with optional
// institution/years for more detail.
const fellowship = z.union([
  z.string(),
  z.object({
    name: z.string(),
    institution: z.string().optional(),
    years: z.union([z.number().int(), z.string()]).optional(),
  }),
]);

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.enum(['PI', 'postdoc', 'phd', 'masters', 'undergrad', 'staff', 'alumni']),
      position: z.string().optional(),
      department: z.string().optional(),
      email: z.string().email().optional(),
      // Path to a file in public/, e.g. "/people/daniel-zheng.jpg"
      photo: z.string().optional(),
      links: z
        .object({
          website: z.string().url().optional(),
          github: z.string().url().optional(),
          googleScholar: z.string().url().optional(),
          linkedin: z.string().url().optional(),
          orcid: z.string().url().optional(),
        })
        .optional(),
      education: z
        .array(
          z.object({
            degree: z.string(),
            field: z.string().optional(),
            institution: z.string(),
            year: z.union([z.number().int(), z.string()]).optional(),
            advisor: z.string().optional(),
            note: z.string().optional(),
          }),
        )
        .optional(),
      appointments: z
        .array(
          z.object({
            role: z.string(),
            institution: z.string(),
            years: z.string().optional(),
            note: z.string().optional(),
            // Fellowships held during this appointment, listed beneath it.
            fellowships: z.array(fellowship).optional(),
          }),
        )
        .optional(),
      // Standalone honors not tied to a specific appointment.
      fellowships: z.array(fellowship).optional(),
      joined: z.coerce.date().optional(),
      left: z.coerce.date().optional(),
      order: z.number().optional(),
    }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    // Names repeated from `authors` that share first authorship. They get an
    // asterisk plus a "contributed equally" note under the entry.
    equalContribution: z.array(z.string()).optional(),
    venue: z.string(),
    year: z.number().int().min(1900).max(2100),
    // Optional precise publication date, used to order papers published in
    // the same year newest-first. Falls back to Jan 1 of `year` if omitted.
    date: z.coerce.date().optional(),
    type: z.enum(['journal', 'conference', 'preprint', 'workshop', 'thesis', 'book-chapter']),
    doi: z.string().optional(),
    arxiv: z.string().optional(),
    pdf: z.string().optional(),
    toc: z.object({
      image: z.string(),
      alt: z.string(),
      source: z.string().url(),
      kind: z.enum(['graphical-abstract', 'article-figure']).default('graphical-abstract'),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }).optional(),
    code: z.string().url().optional(),
    data: z.string().url().optional(),
    bibtex: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      status: z.enum(['active', 'completed', 'archived']),
      started: z.coerce.date(),
      ended: z.coerce.date().optional(),
      lead: z.string().optional(),
      contributors: z.array(z.string()).default([]),
      cover: image().optional(),
      repo: z.string().url().optional(),
      tags: z.array(z.string()).default([]),
    }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { people, publications, research, news };
