// Site color theme, chosen at build time.
//
//   azure:   azure #3283BE, snowy white #FEFDFE, coral #FD614B touches (the default)
//   classic: Delaware blue with a restrained gold accent
//
// To build or preview the classic theme, set the SITE_THEME environment variable:
//   SITE_THEME=classic npm run dev
// The page colors live in src/styles/global.css (under [data-theme="azure"]);
// this file holds the colors baked into the generated SVG artwork.

export type ThemeName = 'classic' | 'azure';

// Read at build time in Node (typed loosely: the project has no @types/node)
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};
const requested = (env.SITE_THEME ?? '').trim().toLowerCase();
export const THEME: ThemeName = requested === 'classic' ? 'classic' : 'azure';

type ArtPalette = {
  /** Highlight color: routes, metal sites, best results */
  accent: string;
  /** Same highlight as "r,g,b", for translucent strokes */
  accentRgb: string;
  /** Keep the highlight at one shade: no translucent versions of it */
  accentSolid?: boolean;
  /** Measured-value scale: low -> middle -> high */
  heat: [number[], number[], number[]];
  /** If set, values at or above this jump straight to the high color
      (no blended shades of it); below, the scale runs low -> middle */
  heatCutoff?: number;
  /** Dark fill matching the artwork background */
  ink: string;
  /** Same dark fill as "r,g,b" */
  inkRgb: string;
  /** Back face of the protein helix */
  helixBack: string;
  /** Operando traces: active phase and microenvironment */
  phase: string;
  micro: string;
  /** Oxygen atoms in the molecule drawings */
  oxygen: string;
  /** Metal site in the enzyme drawing, if it should differ from the accent */
  metal?: string;
  /** Browser UI color (mobile address bar) */
  themeColor: string;
};

const PALETTES: Record<ThemeName, ArtPalette> = {
  classic: {
    accent: '#a9791f',
    accentRgb: '169,121,31',
    heat: [[86, 132, 196], [236, 241, 248], [232, 178, 60]],
    ink: '#072d4d',
    inkRgb: '7,36,62',
    helixBack: 'rgb(48,82,132)',
    phase: '#8fb8ee',
    micro: '#f28b6d',
    oxygen: '#e5675a',
    themeColor: '#072d4d',
  },
  azure: {
    accent: '#fd614b',
    accentRgb: '253,97,75',
    accentSolid: true,
    // Three blues only: deep navy #1b4c7a, azure #3283be, pale #ebf3fa.
    // Coral marks only the top quarter of results.
    heat: [[50, 131, 190], [254, 253, 254], [253, 97, 75]],
    heatCutoff: 0.75,
    ink: '#1b4c7a',
    inkRgb: '27,76,122',
    helixBack: '#3283be',
    // One secondary color for the drawings, sunglow #ffd166, used where a
    // second feature must stand apart from white and the coral highlight:
    // the microenvironment (operando) and the metal site (enzyme).
    phase: '#ebf3fa',
    micro: '#ffd166',
    oxygen: '#fd614b',      // oxygen stays red (coral), as chemists expect
    metal: '#ffd166',
    themeColor: '#3283be',
  },
};

export const ART = PALETTES[THEME];

/** Logo and icons: the azure theme uses copies with a coral node
    (made by .preview/recolor-logo-azure.mjs) */
export const LOGO = THEME === 'azure'
  ? { symbol: '/logos/azure/accel-symbol-144.png', favicon: '/logos/azure/favicon.png', appleTouch: '/logos/azure/apple-touch-icon.png' }
  : { symbol: '/logos/accel-symbol-144.png', favicon: '/favicon.png', appleTouch: '/apple-touch-icon.png' };

/** Opacity for an accent-colored mark: as designed in classic; in a theme
    that keeps the accent at one shade, marks are fully solid, and faint
    glows (below 0.4) are dropped. */
export const accentOpacity = (a: number) => (ART.accentSolid ? (a >= 0.4 ? 1 : 0) : a);

/** The accent color at a given opacity, as an SVG color string */
export const accentA = (a: number) =>
  ART.accentSolid ? (a >= 0.4 ? ART.accent : 'none') : `rgba(${ART.accentRgb},${a})`;
