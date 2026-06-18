export const ART_DIRECTION = {
  callsign: 'CELESTIAL ATELIER',
  subtitle: 'living cartography for impossible worlds',
  palette: {
    void: '#020510',
    obsidian: '#070913',
    cyan: '#00e5ff',
    ultraviolet: '#b388ff',
    magenta: '#ff4081',
    vermilion: '#ff6e40',
    aurora: '#69f0ae',
    frost: '#84ffff',
    amber: '#ffd740',
    porcelain: '#f6f0ff',
    cobalt: '#2979ff',
    ink: '#111827',
  },
  lenses: {
    vignette: 'rgba(2, 5, 16, 0.72)',
    glass: 'rgba(246, 240, 255, 0.055)',
    prism: 'rgba(255, 215, 64, 0.18)',
  },
} as const;

export const SPECTRAL_TRAILS = [
  {
    id: 'aureate-spiral',
    primary: '#ffd740',
    secondary: '#ff6e40',
    radius: 17,
    height: 5.8,
    phase: 0.2,
    speed: 0.08,
    width: 1.4,
  },
  {
    id: 'cyan-hymn',
    primary: '#00e5ff',
    secondary: '#84ffff',
    radius: 29,
    height: 8.2,
    phase: 1.8,
    speed: -0.05,
    width: 1.1,
  },
  {
    id: 'violet-bloom',
    primary: '#b388ff',
    secondary: '#ff4081',
    radius: 42,
    height: 10.5,
    phase: 3.1,
    speed: 0.035,
    width: 1.8,
  },
  {
    id: 'verdant-echo',
    primary: '#69f0ae',
    secondary: '#00e676',
    radius: 54,
    height: 6.6,
    phase: 4.4,
    speed: -0.025,
    width: 1.2,
  },
] as const;

export const CONSTELLATION_VERSES = [
  {
    id: 'verse-cartography',
    text: 'Cartography is a way of touching light before arrival.',
    accent: '#00e5ff',
  },
  {
    id: 'verse-orbit',
    text: 'Every orbit is a brushstroke held in gravity.',
    accent: '#ffd740',
  },
  {
    id: 'verse-archive',
    text: 'The archive dreams in rings, frost, ember, and tide.',
    accent: '#b388ff',
  },
  {
    id: 'verse-helm',
    text: 'Steer by signal, but listen for the color underneath.',
    accent: '#69f0ae',
  },
  {
    id: 'verse-fold',
    text: 'A jump is only distance learning to become music.',
    accent: '#ff4081',
  },
] as const;
