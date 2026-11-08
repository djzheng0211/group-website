# Headshots

Drop photos here, then reference them from a person's `.md` file:

```yaml
photo: /people/daniel-zheng.jpg
```

The path always starts with `/people/` — that maps to this folder.

## Guidance

- **Format:** JPG for photos, PNG if you need transparency.
- **Size:** roughly 600 x 760 px (a 4:5 portrait crop) is ideal. It renders at
  150 x 190 px, so anything much larger just slows the page down.
- **Omit it:** if you leave `photo:` off, the site shows the person's initials
  in a placeholder box.
