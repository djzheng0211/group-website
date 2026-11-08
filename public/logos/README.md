# Institution logos

Drop logo image files here, then reference them from a person's `.md` file:

```yaml
education:
  - degree: Ph.D.
    institution: Massachusetts Institute of Technology
    logo: /logos/mit.png
```

The path always starts with `/logos/` — that maps to this folder.

## Guidance

- **Format:** PNG with a transparent background works best. SVG also works.
- **Size:** anything from 200–500 px square is plenty; it renders at 46 px.
- **Shape:** square-ish crops look best. Very wide wordmarks get letterboxed.
- **Omit it:** if you leave `logo:` off, the site shows an initials monogram
  (MIT, CU, NU) instead — no broken image.

## A note on usage

University logos are trademarks. Using them to indicate where you studied or
worked is normal practice on academic pages, but each school has brand
guidelines, and some ask that you use a specific approved file. If in doubt,
grab the official file from the school's brand/identity page rather than a
web search result.
