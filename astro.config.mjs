import { defineConfig } from 'astro/config';

// Where the site is served from.
//
// On GitHub Pages this is worked out automatically from the repository the
// GitHub Action builds (GitHub sets GITHUB_REPOSITORY = "owner/repo"):
//   repo named owner.github.io  ->  https://owner.github.io/       (base "/")
//   any other repo name         ->  https://owner.github.io/repo/  (base "/repo")
//
// For a custom domain (e.g. https://accel.udel.edu), set SITE_URL, and
// BASE_PATH="/" (see .github/workflows/deploy.yml). Locally neither is set, so
// the dev server runs at the root as usual.
const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const userSite = !!owner && repo?.toLowerCase() === `${owner.toLowerCase()}.github.io`;

const site = process.env.SITE_URL || (owner ? `https://${owner.toLowerCase()}.github.io` : 'http://localhost:4321');
const base = process.env.BASE_PATH || (owner && !userSite ? `/${repo}` : '/');

// https://astro.build/config
export default defineConfig({ site, base });
