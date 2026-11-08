// Internal links and files in public/, prefixed with the site's base path, so
// the site works both at a domain root and under a sub-path such as
// https://owner.github.io/group-website/ (a GitHub Pages project site).
// Write paths from the root as usual ("/people", "/logos/x.png"); external
// links, mailto: and #anchors pass through unchanged.

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const url = (path: string) =>
  /^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(path) ? path : `${BASE}/${path.replace(/^\/+/, '')}`;

/** A path without its trailing slash ("/" stays "/"), for comparing pages */
export const samePath = (a: string, b: string) => {
  const norm = (p: string) => p.replace(/\/+$/, '') || '/';
  return norm(a) === norm(b);
};
